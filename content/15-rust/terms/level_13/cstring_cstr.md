# `CString` / `CStr`

> **Level 13 — Rust**
> Nul-terminated string types for safely passing text data across the C FFI boundary: `CString` (owned) and `CStr` (borrowed view).

---

## 1. Prerequisites

- [FFI (Foreign Function Interface)](ffi.md) — FFI interoperability.
- [String vs &str](../level_01/string_vs_&str.md) — Rust string types.

---


## 2. Term Category

**FFI / Systems**: Nul-terminated string types for safely passing text data across the C FFI boundary: `CString` (owned) and `CStr` (borrowed view).

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Rust strings (`String` and `&str`) are UTF-8 encoded with an explicit byte length and are *not* nul-terminated. Conversely, C strings (`char *`) have no explicit length field and rely on a trailing nul byte (`\0`) to signal string termination.

Passing a Rust `&str` directly to C causes C functions to read past valid memory until hitting a random `0` byte (causing buffer overreads or segfaults). `CString` (owned heap container) and `CStr` (borrowed reference view) safely format and validate nul-terminated strings for Foreign Function Interface (FFI) boundaries.

### (2) Reality Metaphor

A passport control border checkpoint: Rust strings are digital biometric e-passports with explicit page counts; C strings are paper scrolls stamped with an official NUL wax seal at the end. Crossing the C border requires adding the wax seal (`CString`) before handing the scroll to the border guard (`CStr`).

### (3) Rust Code Examples

#### Short Snippet
```rust
use std::ffi::CString;
let c_str = CString::new("Hello C API").unwrap();
let raw_ptr: *const std::os::raw::c_char = c_str.as_ptr();
```

#### Fuller Example
```rust
use std::ffi::{CStr, CString};
use std::os::raw::c_char;

pub fn pass_to_c_library(input: &str) -> Result<String, std::ffi::NulError> {
    let c_string = CString::new(input)?;
    let ptr: *const c_char = c_string.as_ptr();
    
    // Simulate reading back from C via CStr
    let borrowed: &CStr = unsafe { CStr::from_ptr(ptr) };
    Ok(borrowed.to_str().unwrap().to_string())
}

fn main() {
    let res = pass_to_c_library("Safe string").unwrap();
    assert_eq!(res, "Safe string");
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: The 'Dangling Pointer' One-Liner (`CString::new().unwrap().as_ptr()`)

**The mistake:** Invoking `.as_ptr()` directly on an un-bound temporary `CString` inside an FFI call argument list.

**Why it is wrong:** The temporary `CString` is dropped immediately at the end of the statement, deallocating the memory. The raw pointer passed to C becomes a dangling pointer causing Undefined Behavior.

*Incorrect:*
```rust
unsafe { c_func(CString::new("data").unwrap().as_ptr()); } // Dangling pointer UB!
```

*Fix:*
```rust
let c_str = CString::new("data").unwrap(); unsafe { c_func(c_str.as_ptr()); }
```

### Mistake 2: Passing Strings with Interior Nul Bytes

**The mistake:** Attempting to construct a `CString` from text containing embedded `\0` bytes.

**Why it is wrong:** C string functions stop reading at the first `\0` byte, causing premature truncation. `CString::new` catches this and returns a `NulError`.

*Incorrect:*
```rust
let c_str = CString::new("hello\0world").unwrap(); // Panics with NulError!
```

*Fix:*
```rust
let c_str = CString::new("hello world").map_err(|e| e); // Handle NulError gracefully!
```

### Mistake 3: Assuming C Strings Are Always Valid UTF-8

**The mistake:** Calling `CStr::to_str().unwrap()` on unknown raw C strings.

**Why it is wrong:** C strings are arbitrary non-zero byte sequences without encoding guarantees. If C returns invalid UTF-8 bytes, `.to_str().unwrap()` panics.

*Incorrect:*
```rust
let s = unsafe { CStr::from_ptr(raw_c_ptr) }.to_str().unwrap(); // Might panic on invalid UTF-8!
```

*Fix:*
```rust
let s = unsafe { CStr::from_ptr(raw_c_ptr) }.to_string_lossy(); // Safe lossy conversion!
```

---

## 5. Practice Exercises

### Exercise 1: Safe C POSIX Environment Variable Reader FFI Wrapper

**Scenario:** Build a safe Rust FFI wrapper function `get_c_env(var_name: &str) -> Option<String>` calling the C standard library `getenv(const char *name)` function safely.

**Requirements:**
1. Convert `var_name` to `CString`.
1. Invoke `libc::getenv` safely.
1. Convert returned `*const c_char` to `&CStr` and `String`.
1. Write unit tests verifying environment reading.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::ffi::{CStr, CString};
> use std::os::raw::c_char;
> 
> extern "C" {
>     fn getenv(name: *const c_char) -> *const c_char;
> }
> 
> pub fn get_c_env(var_name: &str) -> Option<String> {
>     let c_name = CString::new(var_name).ok()?;
>     unsafe {
>         let ptr = getenv(c_name.as_ptr());
>         if ptr.is_null() {
>             None
>         } else {
>             let c_str = CStr::from_ptr(ptr);
>             Some(c_str.to_string_lossy().into_owned())
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_getenv_ffi() {
>         std::env::set_var("TEST_C_FFI_VAR", "hello_c");
>         let val = get_c_env("TEST_C_FFI_VAR");
>         assert_eq!(val, Some("hello_c".to_string()));
>         std::env::remove_var("TEST_C_FFI_VAR");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `CString::new(var_name)` appends the trailing `\0` byte required by C `getenv`.
> 2. Binds `c_name` to a local variable to prevent early deallocation before the unsafe `getenv` call.
> 3. Converts raw pointer response to `&CStr` and safely converts UTF-8 bytes into `String`.

---

### Exercise 2: Zero-Allocation Constant C String Passing via `c""` Literals

**Scenario:** Demonstrate zero-allocation static C string literals (`c"hello"`) introduced in Rust 1.77 for high-performance FFI logging.

**Requirements:**
1. Define a static `&CStr` using `c"..."` literal syntax.
1. Pass `&CStr` pointer to mock C logger function.
1. Test zero-allocation static string reference.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::ffi::CStr;
> 
> pub fn log_c_message(msg: &'static CStr) -> usize {
>     msg.to_bytes().len()
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_c_literal() {
>         let static_c_str: &'static CStr = c"System initialization complete";
>         assert_eq!(log_c_message(static_c_str), 30);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. The `c"..."` literal embeds a nul-terminated `&CStr` directly in the binary read-only `.rodata` segment.
> 2. Eliminates dynamic heap allocation overhead for constant FFI strings.

---

### Exercise 3: Custom FFI String Buffer Converter

**Scenario:** Build a utility `rust_to_c_buffer(input: &str, buf: &mut [u8]) -> Result<(), &'static str>` copying Rust text into a raw C byte buffer with a trailing nul byte.

**Requirements:**
1. Copy bytes into buffer.
1. Enforce trailing `\0` byte.
1. Return error if buffer is too small.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn rust_to_c_buffer(input: &str, buf: &mut [u8]) -> Result<(), &'static str> {
>     if buf.len() <= input.len() {
>         return Err("Buffer too small for string and nul terminator");
>     }
>     buf[..input.len()].copy_from_slice(input.as_bytes());
>     buf[input.len()] = 0; // Add nul terminator!
>     Ok(())
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_c_buffer_copy() {
>         let mut buf = [0u8; 10];
>         assert!(rust_to_c_buffer("hello", &mut buf).is_ok());
>         assert_eq!(&buf[..6], b"hello\0");
>         assert!(rust_to_c_buffer("too_long_string", &mut buf).is_err());
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Manually constructs a nul-terminated byte array for zero-allocation C buffer outputs.

---

## 5. Related Terms

- [FFI (Foreign Function Interface)](ffi.md) — C FFI boundary.
- [`extern "C"`](extern_c.md) — C calling convention.

---


## 7. Key Takeaways

- `CString` is the owned, heap-allocated string type for sending data to C (`*const c_char`).
- `&CStr` is the borrowed view for reading nul-terminated strings from C.
- Never chain `.as_ptr()` on un-bound temporary `CString::new(...)` expressions.
- Use `c"..."` literals in Rust 1.77+ for zero-allocation static C strings.
