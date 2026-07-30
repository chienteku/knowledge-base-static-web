# `extern "C"`

> **Level 13 — Unsafe Rust & FFI**
> The language clause and function modifier that specifies the standard C Application Binary Interface (ABI) calling convention for importing foreign C functions or exporting Rust functions to foreign runtimes.

---

## 1. Prerequisites

- [FFI (Foreign Function Interface)](../level_13/ffi.md) — Understanding cross-language binary interoperability.
- [`unsafe` Block](../level_13/unsafe_block.md) — Understanding why calling foreign `extern "C"` functions requires an `unsafe` block.
- [Functions](../level_01/function.md) — Standard function declaration and call semantics in Rust.

---

## 2. Term Category

**Syntax / Unsafe / FFI**: `extern "C"` is a low-level keyword combination in Rust. It specifies the Application Binary Interface (ABI) — the exact machine-level rules for how function arguments are passed in CPU registers/stack, how return values are handed back, and how stack frames are managed — matching the standard C language calling convention (`cdecl` / `system`).

---

## 3. Environment Context

**Universal Rust**: `extern "C"` is supported across all platforms (`std`, `no_std`, WASM, embedded microcontrollers). It is used both in `extern "C" { ... }` blocks (to import foreign C functions) and on function definitions (`pub extern "C" fn foo(...)`) to export Rust functions to C, C++, Python, Node.js, or OS kernels.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"

At the machine assembly level, calling a function is not just "jumping to an address." The compiler must follow precise calling convention rules:
- Which CPU registers hold the 1st, 2nd, and 3rd parameters? (e.g. `RDI`, `RSI`, `RDX` on x86_64 Linux).
- Are extra arguments pushed onto the stack left-to-right or right-to-left?
- Who cleans up the stack frame after the function finishes — the caller or the callee?

By default, Rust uses an unspecified internal ABI (`"Rust"` ABI). The Rust compiler reserves the right to optimize, reorder, or pass arguments in registers however it sees fit between different compiler versions.

However, if Rust needs to talk to a C library (or allow a C program to call a Rust library), both compilers MUST agree on the exact same assembly-level calling rules. 

Rust introduced `extern "C"` as the universal ABI specification string:
1. **Importing Foreign Functions**: `extern "C" { fn c_func(); }` tells `rustc` that `c_func` expects parameters and stack cleanup according to standard C calling conventions.
2. **Exporting Rust Functions**: `pub extern "C" fn rust_func()` tells `rustc` to compile `rust_func` using standard C entry/exit assembly conventions so C programs can invoke it cleanly.

### (2) Reality Metaphor

Imagine a **Diplomatic Embassy Translation Protocol**:

- The **Default Rust ABI (`"Rust"`)** is like two native citizens speaking high-speed local dialect shorthand in their home country: highly efficient, but completely incomprehensible to outsiders.
- The **C ABI (`extern "C"`)** is **Diplomatic French / English**: an internationally standardized formal language protocol agreed upon by all countries (**compilers**).
  - When a Rust diplomat speaks to a foreign ambassador (**calls a C function**), they switch to Diplomatic French (**`extern "C"`**), ensuring every formal greeting, argument title, and exit handshake (**stack registers & return values**) follows the exact international standard protocol.

### (3) Code Examples

#### Short Snippet (Importing and Exporting `extern "C"` Functions)

```rust
use std::os::raw::c_int;

// 1. IMPORTING: Declare foreign C library function using `extern "C"` block
extern "C" {
    fn abs(input: c_int) -> c_int;
}

// 2. EXPORTING: Define a Rust function with `extern "C"` ABI and `#[no_mangle]`
#[no_mangle]
pub extern "C" fn rust_add(a: c_int, b: c_int) -> c_int {
    a + b
}

fn main() {
    // Calling imported C function inside unsafe block
    let neg = -15;
    let positive = unsafe { abs(neg) };
    println!("c_abs(-15) = {}", positive); // 15

    // Calling exported Rust function
    let sum = rust_add(10, 20);
    println!("rust_add(10, 20) = {}", sum); // 30
}
```

#### Fuller Example (FFI Callback Function Pointer with `extern "C"`)

```rust
use std::os::raw::c_int;

// Define a C-compatible callback function pointer type alias using `extern "C"`
type CCallback = extern "C" fn(c_int) -> c_int;

/// A C-compatible higher-order function that executes a foreign C callback
#[no_mangle]
pub extern "C" fn process_number(value: c_int, callback: CCallback) -> c_int {
    // Execute the callback function using standard C ABI calling rules
    callback(value)
}

// A Rust callback function formatted for C ABI
extern "C" fn double_it(n: c_int) -> c_int {
    n * 2
}

fn main() {
    // Pass `double_it` callback pointer to `process_number`
    let result = process_number(21, double_it);
    println!("Processed result via extern \"C\" callback: {}", result); // 42
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Omitting `#[no_mangle]` on Exported `extern "C"` Functions

**The mistake:** Declaring `pub extern "C" fn my_func()` without adding the `#[no_mangle]` attribute.

**Why it's wrong:** By default, Rust mangles (hashes) function names in compiled binary symbol tables to support namespaces and modules (e.g. `_ZN4my_app7my_func17h8a9f...`). Foreign C linkers search for the literal string `"my_func"`. Without `#[no_mangle]`, the C linker fails with a "symbol not found" error.

*Incorrect:*
```rust
// ❌ C linker will fail to find `my_api_func` because name is mangled!
pub extern "C" fn my_api_func() -> i32 { 42 }
```

*Fix:*
```rust
// Correct: `#[no_mangle]` preserves the exact literal symbol name in object files
#[no_mangle]
pub extern "C" fn my_api_func() -> i32 { 42 }
```

### Mistake 2: Mismatched ABI String Identifiers (e.g. `"stdcall"` vs `"C"`)

**The mistake:** Using `extern "C"` when interfacing with 32-bit Windows system APIs expecting `"stdcall"`.

**Why it's wrong:** On 32-bit Windows, standard C functions use `cdecl` (`"C"`), but Windows OS Win32 API functions expect `stdcall` (`"stdcall"`). Mismatched calling conventions corrupt the CPU stack pointer register (`ESP`), causing instant application crashes.

*Incorrect:*
```rust
// ❌ On 32-bit Windows, Win32 API functions require `"stdcall"`, not `"C"`
extern "C" {
    fn MessageBoxA(hwnd: *mut std::ffi::c_void, text: *const i8, title: *const i8, style: u32) -> i32;
}
```

*Fix:*
```rust
// Correct: Use target-appropriate ABI or Windows API bindings (or `extern "system"`)
extern "system" {
    fn MessageBoxA(hwnd: *mut std::ffi::c_void, text: *const i8, title: *const i8, style: u32) -> i32;
}
```

### Mistake 3: Passing Non-FFI Safe Types in `extern "C"` Function Signatures

**The mistake:** Passing complex Rust-native types (like `String`, `Vec<T>`, `Option<T>`, or `Box<T>`) across `extern "C"` function parameters.

**Why it's wrong:** Rust-native types do NOT have a defined C memory layout or ABI representation. Passing them into an `extern "C"` function triggers compiler warnings (`improper_ctypes`) and causes Undefined Behavior when C code reads the parameters.

*Incorrect:*
```rust
// ❌ Compiler Warning: `String` and `Vec` are NOT FFI-safe!
#[no_mangle]
pub extern "C" fn process_data(data: String) { ... }
```

*Fix:*
```rust
use std::os::raw::c_char;

// Correct: Use raw pointers and primitive C types for FFI signatures
#[no_mangle]
pub extern "C" fn process_data(ptr: *const c_char, len: usize) { ... }
```

---

## 6. Practice Exercises

### Exercise 1: Embedded ADC Sensor Processing via `extern "C"` Callback

**Problem:** In an embedded IoT system, a C hardware driver collects raw ADC 12-bit voltage samples and triggers processing via a C-compatible callback. Export a library function `process_sensor_batch` using `#[no_mangle]` and `extern "C"`. The function must take a raw pointer `data_ptr: *const u16`, length `len: usize`, and an optional callback `Option<extern "C" fn(sample_index: u32, scaled_val: f32) -> i32>`. Convert raw ADC values ($V_{out} = \frac{\text{raw} \times 3.3}{4095.0}$), invoke the callback, handle null pointers safely, and return status codes (`0` for success, `-1` for invalid parameters, `-2` for early callback abort). Write unit tests verifying execution.

> [!check]- Answer
> ```rust
> use std::os::raw::c_int;
> 
> /// FFI-compatible callback signature matching standard C ABI conventions
> pub type SensorCallback = extern "C" fn(sample_index: u32, scaled_val: f32) -> c_int;
> 
> /// Processes raw 12-bit ADC sensor samples and streams converted voltages via C callback.
> ///
> /// # Safety
> /// `data_ptr` must be a valid, readable pointer to at least `len` elements of `u16`
> /// if `len > 0` and `data_ptr` is non-null.
> #[no_mangle]
> pub unsafe extern "C" fn process_sensor_batch(
>     data_ptr: *const u16,
>     len: usize,
>     callback: Option<SensorCallback>,
> ) -> c_int {
>     // 1. Null pointer and boundary validation
>     if data_ptr.is_null() || len == 0 {
>         return -1;
>     }
> 
>     // 2. Safely construct a slice reference from raw pointer and length
>     let samples = unsafe { std::slice::from_raw_parts(data_ptr, len) };
> 
>     // 3. Process each sample with 12-bit ADC scaling (3.3V reference)
>     for (index, &raw_adc) in samples.iter().enumerate() {
>         let scaled_voltage = (raw_adc as f32 * 3.3) / 4095.0;
> 
>         if let Some(cb) = callback {
>             // Execute foreign C callback adhering to standard C calling convention
>             let status = cb(index as u32, scaled_voltage);
>             if status != 0 {
>                 return -2; // Abortion signal from callback
>             }
>         }
>     }
> 
>     0 // Success
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     static mut PROCESSED_COUNT: u32 = 0;
> 
>     extern "C" fn mock_sensor_cb(_idx: u32, voltage: f32) -> c_int {
>         unsafe {
>             PROCESSED_COUNT += 1;
>         }
>         assert!(voltage >= 0.0 && voltage <= 3.3);
>         0
>     }
> 
>     extern "C" fn aborting_cb(_idx: u32, _voltage: f32) -> c_int {
>         -1
>     }
> 
>     #[test]
>     fn test_process_sensor_batch_success() {
>         unsafe { PROCESSED_COUNT = 0; }
>         let raw_samples: [u16; 4] = [0, 2047, 4095, 1024];
>         
>         let result = unsafe {
>             process_sensor_batch(raw_samples.as_ptr(), raw_samples.len(), Some(mock_sensor_cb))
>         };
> 
>         assert_eq!(result, 0);
>         assert_eq!(unsafe { PROCESSED_COUNT }, 4);
>     }
> 
>     #[test]
>     fn test_null_pointer_handling() {
>         let result = unsafe {
>             process_sensor_batch(std::ptr::null(), 10, Some(mock_sensor_cb))
>         };
>         assert_eq!(result, -1);
>     }
> 
>     #[test]
>     fn test_callback_abort() {
>         let raw_samples: [u16; 4] = [100, 200, 300, 400];
>         let result = unsafe {
>             process_sensor_batch(raw_samples.as_ptr(), raw_samples.len(), Some(aborting_cb))
>         };
>         assert_eq!(result, -2);
>     }
> }
> ```
>
> **Explanation:**
> 1. **`extern "C"` ABI Modifier**: Mandates standard C calling conventions (stack register parameter passing and caller/callee cleanup), ensuring raw function calls cross FFI boundaries safely.
> 2. **`#[no_mangle]` Symbol Preservation**: Instructs `rustc` not to hash/mangle `process_sensor_batch` in object binary symbol tables, allowing foreign C linkers to resolve the function by literal name.
> 3. **Null-Pointer Optimization (NPO)**: Using `Option<SensorCallback>` allows safe representation of optional function pointers. In Rust's C ABI representation, `None` compiles directly to a C `NULL` pointer.
> 4. **Safe Pointer Dereferencing**: `std::slice::from_raw_parts` encapsulates raw pointer iteration within a safe slice view after explicit `data_ptr.is_null()` validation.
> 
---

### Exercise 2: Packet Alert Dispatcher Interfacing with C Raw Strings (`CStr`)

**Problem:** A C network stack triggers alert dispatches into a Rust module by invoking an exported callback `rust_on_packet_alert(packet_id: u64, payload_ptr: *const c_char) -> c_int`. Export this function with `#[no_mangle]` and `extern "C"`. Inspect `payload_ptr` via `std::ffi::CStr`, check if the string contains `"CRITICAL"`, handle null pointers (`-1`) and UTF-8 errors (`-2`), and return `1` for critical alerts or `0` for normal alerts. Include unit tests with `CString`.

> [!check]- Answer
> ```rust
> use std::ffi::{CStr, CString};
> use std::os::raw::{c_char, c_int};
> 
> /// Foreign C logging API declaration
> extern "C" {
>     pub fn c_dispatch_log(level: c_int, msg: *const c_char) -> c_int;
> }
> 
> /// Exported C-compatible callback to inspect packet alert payloads.
> ///
> /// # Safety
> /// `payload_ptr` must be a valid, null-terminated C string pointer if non-null.
> #[no_mangle]
> pub unsafe extern "C" fn rust_on_packet_alert(
>     packet_id: u64,
>     payload_ptr: *const c_char,
> ) -> c_int {
>     // 1. Guard against NULL pointers from foreign callers
>     if payload_ptr.is_null() {
>         return -1;
>     }
> 
>     // 2. Wrap C raw string in CStr to safely inspect byte content without copying
>     let c_str = unsafe { CStr::from_ptr(payload_ptr) };
> 
>     // 3. Attempt UTF-8 conversion; return -2 if foreign byte stream is invalid UTF-8
>     let payload_str = match c_str.to_str() {
>         Ok(s) => s,
>         Err(_) => return -2,
>     };
> 
>     // 4. Inspect packet payload string content
>     if payload_str.contains("CRITICAL") {
>         1 // Critical alert code
>     } else {
>         0 // Normal alert code
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_packet_alert_critical() {
>         let alert_msg = CString::new("ALERT: CRITICAL buffer overflow attempt").unwrap();
>         let result = unsafe {
>             rust_on_packet_alert(1001, alert_msg.as_ptr())
>         };
>         assert_eq!(result, 1);
>     }
> 
>     #[test]
>     fn test_packet_alert_normal() {
>         let alert_msg = CString::new("INFO: Standard keepalive ping received").unwrap();
>         let result = unsafe {
>             rust_on_packet_alert(1002, alert_msg.as_ptr())
>         };
>         assert_eq!(result, 0);
>     }
> 
>     #[test]
>     fn test_packet_alert_null_pointer() {
>         let result = unsafe {
>             rust_on_packet_alert(1003, std::ptr::null())
>         };
>         assert_eq!(result, -1);
>     }
> }
> ```
>
> **Explanation:**
> 1. **Foreign C Function Declarations**: `extern "C" { ... }` blocks inform the Rust compiler of external C functions available at link time, applying host C ABI calling conventions.
> 2. **C String Pointer Representation**: C string pointers (`*const c_char`) point to null-terminated (`\0`) byte sequences. Rust string slices (`&str`) are fat pointers containing address and byte length.
> 3. **`CStr` Zero-Copy Inspection**: `CStr::from_ptr` scans raw memory starting at `payload_ptr` until finding the terminating `\0` byte, providing a safe borrow slice without extra heap allocations.
> 4. **Integer Status Return Codes**: Exported FFI functions return C-compatible primitive types (`c_int`) to ensure clean status propagation across language boundaries.
> 
---

### Exercise 3: Cross-ABI Hardware Virtual Table (`#[repr(C)]` VTable & Function Pointers)

**Problem:** Design a C-compatible Hardware Abstraction Layer (HAL) UART device driver interface using a `#[repr(C)]` VTable struct containing `extern "C"` function pointers (`write_byte`, `read_byte`, `flush`). Implement concrete C-ABI handlers, wrap the vtable inside a high-level Rust driver struct `HardwareDriver`, and write unit tests with assertions verifying write, read, and error states across the FFI boundary.

> [!check]- Answer
> ```rust
> use std::os::raw::c_int;
> 
> /// C-compatible Hardware Abstraction Layer VTable for UART operations
> #[repr(C)]
> pub struct UartOpsVTable {
>     pub write_byte: extern "C" fn(dev_id: u8, byte: u8) -> c_int,
>     pub read_byte: extern "C" fn(dev_id: u8, out_byte: *mut u8) -> c_int,
>     pub flush: extern "C" fn(dev_id: u8) -> c_int,
> }
> 
> static mut MOCK_TX_BUFFER: Vec<u8> = Vec::new();
> static mut MOCK_RX_DATA: u8 = 0xAA;
> 
> /// Concrete C-ABI implementation for writing byte to UART peripheral
> pub extern "C" fn uart_write_impl(dev_id: u8, byte: u8) -> c_int {
>     if dev_id != 1 { return -1; }
>     unsafe {
>         MOCK_TX_BUFFER.push(byte);
>     }
>     0
> }
> 
> /// Concrete C-ABI implementation for reading byte from UART peripheral
> pub extern "C" fn uart_read_impl(dev_id: u8, out_byte: *mut u8) -> c_int {
>     if dev_id != 1 || out_byte.is_null() { return -1; }
>     unsafe {
>         *out_byte = MOCK_RX_DATA;
>     }
>     0
> }
> 
> /// Concrete C-ABI implementation for flushing UART hardware FIFO
> pub extern "C" fn uart_flush_impl(dev_id: u8) -> c_int {
>     if dev_id != 1 { return -1; }
>     0
> }
> 
> /// High-level Rust HAL Driver wrapping raw C-ABI VTable
> pub struct HardwareDriver {
>     dev_id: u8,
>     vtable: UartOpsVTable,
> }
> 
> impl HardwareDriver {
>     pub fn new(dev_id: u8, vtable: UartOpsVTable) -> Self {
>         Self { dev_id, vtable }
>     }
> 
>     pub fn write(&self, data: u8) -> Result<(), i32> {
>         let status = (self.vtable.write_byte)(self.dev_id, data);
>         if status == 0 { Ok(()) } else { Err(status) }
>     }
> 
>     pub fn read(&self) -> Result<u8, i32> {
>         let mut buffer: u8 = 0;
>         let status = (self.vtable.read_byte)(self.dev_id, &mut buffer as *mut u8);
>         if status == 0 { Ok(buffer) } else { Err(status) }
>     }
> 
>     pub fn flush(&self) -> Result<(), i32> {
>         let status = (self.vtable.flush)(self.dev_id);
>         if status == 0 { Ok(()) } else { Err(status) }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_uart_vtable_driver() {
>         unsafe {
>             MOCK_TX_BUFFER.clear();
>             MOCK_RX_DATA = 0x55;
>         }
> 
>         let vtable = UartOpsVTable {
>             write_byte: uart_write_impl,
>             read_byte: uart_read_impl,
>             flush: uart_flush_impl,
>         };
> 
>         let driver = HardwareDriver::new(1, vtable);
> 
>         assert_eq!(driver.write(0x42), Ok(()));
>         unsafe {
>             assert_eq!(MOCK_TX_BUFFER, vec![0x42]);
>         }
> 
>         assert_eq!(driver.read(), Ok(0x55));
>         assert_eq!(driver.flush(), Ok(()));
>     }
> 
>     #[test]
>     fn test_invalid_device_id() {
>         let vtable = UartOpsVTable {
>             write_byte: uart_write_impl,
>             read_byte: uart_read_impl,
>             flush: uart_flush_impl,
>         };
> 
>         let driver = HardwareDriver::new(99, vtable);
>         assert_eq!(driver.write(0x10), Err(-1));
>     }
> }
> ```
>
> **Explanation:**
> 1. **`#[repr(C)]` Struct Layout**: Guarantees struct field alignment and padding match C struct layout rules (`struct uart_ops`), matching function pointer offsets across compiler boundaries.
> 2. **`extern "C" fn` Function Pointers**: Specifying `extern "C"` on function pointer field signatures ensures callers pass arguments via C CPU registers rather than Rust ABI registers.
> 3. **Output via Raw Pointers**: Passing `out_byte: *mut u8` enables C-compatible out-parameter data output without creating unaligned Rust reference aliasing.
> 4. **Safe Rust Abstraction Layer**: Wrapping low-level C function pointer calls inside idiomatic `Result<T, E>` Rust methods isolates safety invariants to the driver boundary.
> 
---

## 7. Related Terms

- [FFI (Foreign Function Interface)](../level_13/ffi.md) — The parent topic covering cross-language interoperability.
- [`#[repr(C)]`](../level_13/repr_c.md) — The attribute ensuring struct memory layouts match C layout rules.
- [`unsafe` Block](../level_13/unsafe_block.md) — Block required to invoke imported `extern "C"` functions.
- [Raw Pointers (`*const T`, `*mut T`)](../level_13/raw_pointers.md) — Memory pointers passed across `extern "C"` functions.

---

## 8. Key Takeaways

- `extern "C"` specifies the standard C Application Binary Interface (ABI) calling convention.
- Use `extern "C" { ... }` blocks to import foreign C functions.
- Use `#[no_mangle] pub extern "C" fn` to export Rust functions to foreign linkers without symbol name hashing.
- Only pass FFI-safe types (`c_int`, `*const c_char`, `#[repr(C)]` structs) across `extern "C"` signatures.
- Use `extern "system"` for platform-default system ABIs (e.g. Win32 `stdcall` on 32-bit Windows).
