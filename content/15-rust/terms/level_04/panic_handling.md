# Panic and `panic!` Macro

> **Level 4 — Rust**
> Rust's mechanism for unrecoverable errors: the `panic!` macro unwinds (or aborts) the stack, printing a message and terminating the thread, used when invariants are violated.

---

## 1. Prerequisites

- [`panic!` Macro](panic.md) — The panic! macro for unrecoverable errors.
- [`Result<T, E>`](../level_02/result_t_e.md) — Recoverable Result errors vs unrecoverable panics.

---

## 2. Term Category

**Error Recovery**: Panic mechanism (`panic!`), stack unwinding, and `catch_unwind` recovery boundary.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Unrecoverable runtime failures (out-of-bounds memory access, integer division by zero, broken invariants) must halt execution safely to prevent memory corruption.

Rust panics trigger stack unwinding (or aborts depending on `panic = "abort"` build settings), walking up the call stack to drop local RAII resources. `std::panic::catch_unwind` allows capturing panics across web server request boundaries or FFI thresholds.

### (2) Reality Metaphor

A building fire sprinkler system: when a localized fire breaks out, the system trips emergency alarms (`panic!`), shuts down local gas lines, and isolates the floor (`catch_unwind`) without collapsing the entire skyscraper.

### (3) Rust Code Examples

#### Short Snippet
```rust
use std::panic;
let res = panic::catch_unwind(|| { panic!("emergency!"); });
assert!(res.is_err());
```

#### Fuller Example
```rust
use std::panic;

pub fn safe_execute_task<F, R>(f: F) -> Result<R, &'static str>
where
    F: FnOnce() -> R + panic::UnwindSafe,
{
    panic::catch_unwind(f).map_err(|_| "Task panicked during execution")
}

fn main() {
    let ok_res = safe_execute_task(|| 42);
    let panic_res = safe_execute_task(|| panic!("boom"));
    assert_eq!(ok_res, Ok(42));
    assert!(panic_res.is_err());
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using `panic!` for Expected Recoverable Business Errors

**The mistake:** Panicking on expected user validation errors (like invalid password or missing file).

**Why it is wrong:** Panics are for unrecoverable bugs, not control flow. Use `Result<T, E>` for expected recoverable errors.

*Incorrect:*
```rust
if user.password != input { panic!("Wrong password"); } // Antipattern!
```

*Fix:*
```rust
if user.password != input { return Err(AuthError::InvalidPassword); }
```

### Mistake 2: Catching Panics Across FFI Boundaries Without `catch_unwind`

**The mistake:** Allowing a Rust panic to unwind across an `extern "C"` FFI boundary into C code.

**Why it is wrong:** Unwinding past a C ABI frame causes immediate Undefined Behavior. Always catch panics before returning to C.

*Incorrect:*
```rust
#[no_mangle] pub extern "C" fn ffi_call() { panic!("oops"); } // UB on FFI!
```

*Fix:*
```rust
#[no_mangle] pub extern "C" fn ffi_call() { let _ = panic::catch_unwind(|| { ... }); }
```

### Mistake 3: Assuming `catch_unwind` Catches All Panics in `panic = "abort"` Mode

**The mistake:** Relying on `catch_unwind` when the crate is compiled with `panic = "abort"`.

**Why it is wrong:** In `panic = "abort"` mode, panics abort the process instantly without unwinding stack frames; `catch_unwind` is bypassed.

*Incorrect:*
```rust
Relying on catch_unwind under panic = "abort"
```

*Fix:*
```rust
Design critical invariants defensively without depending strictly on panic unwinding!
```

---

## 5. Practice Exercises

### Exercise 1: Web Request Handler Panic Isolation Boundary

**Scenario:** Build an HTTP worker thread panic isolation wrapper `handle_web_request<F>(handler: F) -> (u16, String)` using `catch_unwind` to catch worker handler panics and return a `500 Internal Server Error` response.

**Requirements:**
1. Accept closure `F: FnOnce() -> String + UnwindSafe`.
1. Execute inside `panic::catch_unwind`.
1. Return `(200, body)` on success.
1. Return `(500, "Internal Server Error")` on panic.
1. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::panic::{self, UnwindSafe};
> 
> pub fn handle_web_request<F>(handler: F) -> (u16, String)
> where
>     F: FnOnce() -> String + UnwindSafe,
> {
>     match panic::catch_unwind(handler) {
>         Ok(body) => (200, body),
>         Err(_) => (500, "Internal Server Error".into()),
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_panic_isolation_success() {
>         let (status, body) = handle_web_request(|| "Hello World".into());
>         assert_eq!(status, 200);
>         assert_eq!(body, "Hello World");
>     }
> 
>     #[test]
>     fn test_panic_isolation_failure() {
>         let (status, body) = handle_web_request(|| panic!("Database connection crashed!"));
>         assert_eq!(status, 500);
>         assert_eq!(body, "Internal Server Error");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `panic::catch_unwind` captures thread unwinding panics at the request boundary.
> 2. Converts worker panics into HTTP 500 status codes without crashing the web server thread.

---

### Exercise 2: Custom Panic Hook Logger

**Scenario:** Demonstrate installing a custom panic hook via `std::panic::set_hook` to log panic location metadata.

**Requirements:**
1. Install `set_hook`.
1. Capture panic info.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::sync::atomic::{AtomicBool, Ordering};
> 
> static PANIC_LOGGED: AtomicBool = AtomicBool::new(false);
> 
> pub fn setup_custom_panic_hook() {
>     panic::set_hook(Box::new(|_info| {
>         PANIC_LOGGED.store(true, Ordering::SeqCst);
>     }));
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_panic_hook() {
>         setup_custom_panic_hook();
>         let _ = panic::catch_unwind(|| {
>             panic!("Test panic hook logging");
>         });
>         assert!(PANIC_LOGGED.load(Ordering::SeqCst));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `panic::set_hook` intercepts panics to log diagnostic metadata before unwinding.

---

### Exercise 3: FFI Panic Guard Wrapper

**Scenario:** Build an FFI function guard converting Rust panics into C error code integer returns (`0` success, `-1` panic).

**Requirements:**
1. Wrap FFI logic in `catch_unwind`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::panic;
> 
> pub fn safe_ffi_wrapper<F>(f: F) -> i32
> where
>     F: FnOnce() -> i32 + panic::UnwindSafe,
> {
>     panic::catch_unwind(f).unwrap_or(-1)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_ffi_panic_guard() {
>         assert_eq!(safe_ffi_wrapper(|| 42), 42);
>         assert_eq!(safe_ffi_wrapper(|| panic!("FFI panic")), -1);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Prevents Undefined Behavior caused by unwinding across FFI boundaries.

---

## 5. Related Terms

- None!

---

## 7. Key Takeaways

- `panic!` is for unrecoverable bugs, halting thread execution safely.
- Stack unwinding walks up the stack dropping local RAII resources.
- `catch_unwind` captures panics at isolation boundaries (web servers, FFI).
- Use `Result<T, E>` for expected recoverable errors.
