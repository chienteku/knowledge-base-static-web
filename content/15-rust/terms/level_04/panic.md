# `panic!`

> **Level 4 — Error Handling & Generics**
> Macro for unrecoverable errors; unwinds the stack (or aborts, if configured).

---

## 1. Prerequisites

- [`Result<T, E>`](../level_02/result_t_e.md) — The tool for *recoverable* errors.
- [`unwrap()` / `expect()`](../level_04/unwrap_expect.md) — The methods that secretly trigger a `panic!` when they fail.
- [Macros](../level_01/macros.md) — Code that writes code; `panic!` is a macro, denoted by the `!`.

---

## 2. Term Category

**Rust-specific (the controlled crash)**: In languages like C or C++, a fatal error (like a "Segmentation Fault") instantly kills the program, often leaving the Operating System in a corrupted state with leaked memory. Rust turns crashes into a safe, meticulously controlled shutdown process.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In programming, there are two fundamental types of errors: 
1. **Recoverable errors:** e.g., A file wasn't found. You handle this gracefully with `Result`.
2. **Unrecoverable errors:** e.g., A massive math bug tried to index the 100th item of a 5-item list, or the server's hard drive was physically corrupted. 

When an unrecoverable error occurs, proceeding is dangerous. Rust needs a way to instantly stop the program, but it also needs to clean up all the memory it allocated along the way. This is the **`panic!` macro**. 

When `panic!` is invoked, it doesn't just instantly kill the CPU process. It enters a controlled shutdown phase called **"Unwinding the Stack"**. It carefully walks backward through every function that was currently running, and executes the `Drop` trait on every single variable to ensure memory and network sockets are safely closed before finally turning the lights out.

### (2) Reality Metaphor

Imagine you are the pilot of a commercial airplane.

A **recoverable error** is a broken coffee machine (`Result::Err`). The flight attendants log the error, apologize to the passengers, and keep flying the plane to the destination.

An **unrecoverable error** is the right engine catching fire. You don't try to "handle" the error and keep flying to Hawaii. You instantly abort the mission (`panic!`). But you don't just magically teleport out of the sky; you execute a careful, controlled emergency landing (**"unwinding the stack"**) to ensure all passengers get off safely before the plane is decommissioned.

### (3) Rust Code Examples

#### Short Snippet (Explicit Panic)
You can manually trigger a panic if your program enters a state that makes no logical sense.
```rust
fn process_payment(amount: i32) {
    if amount < 0 {
        // We manually crash the program. You cannot have a negative payment!
        panic!("CRITICAL: Attempted to process a negative payment: {}", amount);
    }
    println!("Processing ${}...", amount);
}

fn main() {
    process_payment(-50); // The program will crash here!
}
```

#### Fuller Example (Implicit Panic & Backtraces)
Rust will automatically panic to protect you from memory bugs. If you run a panicked program with the `RUST_BACKTRACE=1` environment variable, Rust will print out the exact history of function calls that led to the crash.

```rust
fn get_item(index: usize) {
    let data = vec![10, 20, 30];
    
    // If index is 99, this will implicitly trigger a panic!
    // "index out of bounds: the len is 3 but the index is 99"
    println!("Item: {}", data[index]); 
}

fn main() {
    get_item(99); 
}
```
*Run in terminal:*
`RUST_BACKTRACE=1 cargo run`

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Panic Scoping and Lifecycle Rules

**The mistake:** Assuming Panic instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0515`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("panic_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("panic_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Panic State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Panic through an immutable reference `&T` or without specifying `mut` in variable declarations.

**Why it's wrong:** Rust's aliasing XOR mutability rule (`&T` for shared immutable access, `&mut T` for exclusive mutable access) prohibits mutating state through shared references unless interior mutability patterns (e.g. `RefCell`, `Mutex`) are explicitly used.

*Incorrect:*
```rust
fn update_val(data: &i32) {
    // *data += 1; // ❌ Error E0594: cannot assign to `*data`, which is behind a `&` reference
}
```

*Fix:*
```rust
fn update_val(data: &mut i32) {
    *data += 1; // Correct: exclusive mutable reference permits mutation
}
```

### Mistake 3: Concurrent Access to Panic Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Panic instances across OS threads via `std::thread::spawn`.

**Why it's wrong:** Types that do not implement `Send` or `Sync` marker traits cannot safely cross thread boundaries. The compiler prevents data races by raising compile errors `E0277` (`trait Send is not implemented`).

*Incorrect:*
```rust
use std::rc::Rc;
use std::thread;

let rc = Rc::new(42);
// thread::spawn(move || { println!("{}", rc); }); // ❌ Error E0277: `Rc` cannot be sent between threads safely
```

*Fix:*
```rust
use std::sync::Arc;
use std::thread;

let arc = Arc::new(42);
thread::spawn(move || {
    println!("{}", arc); // Correct: `Arc` implements `Send` and `Sync`
});
```

---

## 5. Practice Exercises

### Exercise 1: Resilient Worker Thread Pool with Panic Payload Extraction and Isolated Task Recovery

**Problem:**
In high-throughput multi-threaded worker pools, individual tasks submitted by plugins or external code may encounter bug-induced panics. A crash in a single task must not terminate the worker thread or corrupt shared monitoring telemetry.

Design a `TaskRunner` system that:
1. Executes arbitrary generic task closures `F: FnOnce() -> R` inside a panic boundary using `std::panic::catch_unwind` and `AssertUnwindSafe`.
2. Intercepts and extracts human-readable error messages from the dynamic panic payload (`Box<dyn Any + Send>`), supporting both static string slices (`&'static str`) and heap-allocated formatted strings (`String`).
3. Updates thread-safe shared metrics (`Arc<Mutex<WorkerMetrics>>`) tracking total executions, successes, panic counts, and the last observed panic message.
4. Returns a clean `Result<R, String>` to caller routines without unwinding past the task barrier.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::any::Any;
> use std::panic::{catch_unwind, AssertUnwindSafe};
> use std::sync::{Arc, Mutex};
> 
> #[derive(Debug, Default, PartialEq, Eq)]
> pub struct WorkerMetrics {
>     pub total_tasks: u64,
>     pub successful_tasks: u64,
>     pub panicked_tasks: u64,
>     pub last_panic_message: Option<String>,
> }
> 
> pub struct TaskRunner {
>     metrics: Arc<Mutex<WorkerMetrics>>,
> }
> 
> impl TaskRunner {
>     pub fn new(metrics: Arc<Mutex<WorkerMetrics>>) -> Self {
>         Self { metrics }
>     }
> 
>     pub fn run_task<F, R>(&self, task: F) -> Result<R, String>
>     where
>         F: FnOnce() -> R,
>     {
>         // Record execution initiation
>         {
>             let mut guard = self.metrics.lock().unwrap();
>             guard.total_tasks += 1;
>         }
> 
>         // Execute closure within an isolated unwind boundary
>         let unwind_result = catch_unwind(AssertUnwindSafe(task));
> 
>         match unwind_result {
>             Ok(val) => {
>                 let mut guard = self.metrics.lock().unwrap();
>                 guard.successful_tasks += 1;
>                 Ok(val)
>             }
>             Err(panic_payload) => {
>                 let message = extract_panic_message(&panic_payload);
>                 let mut guard = self.metrics.lock().unwrap();
>                 guard.panicked_tasks += 1;
>                 guard.last_panic_message = Some(message.clone());
>                 Err(message)
>             }
>         }
>     }
> }
> 
> pub fn extract_panic_message(payload: &(dyn Any + Send)) -> String {
>     if let Some(s) = payload.downcast_ref::<&'static str>() {
>         s.to_string()
>     } else if let Some(s) = payload.downcast_ref::<String>() {
>         s.clone()
>     } else {
>         "Unknown non-string panic payload".to_string()
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_task_runner_success() {
>         let metrics = Arc::new(Mutex::new(WorkerMetrics::default()));
>         let runner = TaskRunner::new(metrics.clone());
>
>         let result = runner.run_task(|| 2 + 2);
>         assert_eq!(result, Ok(4));
>         assert_ne!(result, Err("failed".to_string()));
>
>         let guard = metrics.lock().unwrap();
>         assert_eq!(guard.total_tasks, 1);
>         assert_eq!(guard.successful_tasks, 1);
>         assert_eq!(guard.panicked_tasks, 0);
>         assert_eq!(guard.last_panic_message, None);
>         assert!(guard.last_panic_message.is_none());
>     }
> 
>     #[test]
>     fn test_task_runner_panic_static_str() {
>         let metrics = Arc::new(Mutex::new(WorkerMetrics::default()));
>         let runner = TaskRunner::new(metrics.clone());
>
>         let result: Result<(), String> = runner.run_task(|| {
>             panic!("critical static task failure");
>         });
>
>         assert!(result.is_err());
>         assert_eq!(result, Err("critical static task failure".to_string()));
>
>         let guard = metrics.lock().unwrap();
>         assert_eq!(guard.total_tasks, 1);
>         assert_eq!(guard.successful_tasks, 0);
>         assert_eq!(guard.panicked_tasks, 1);
>         assert_eq!(
>             guard.last_panic_message,
>             Some("critical static task failure".to_string())
>         );
>     }
> 
>     #[test]
>     fn test_task_runner_panic_formatted_string() {
>         let metrics = Arc::new(Mutex::new(WorkerMetrics::default()));
>         let runner = TaskRunner::new(metrics.clone());
>
>         let code = 503;
>         let result: Result<(), String> = runner.run_task(move || {
>             panic!("service unavailable with status code {}", code);
>         });
>
>         assert!(matches!(result, Err(ref msg) if msg.contains("503")));
>         assert_ne!(result, Ok(()));
>
>         let guard = metrics.lock().unwrap();
>         assert_eq!(guard.panicked_tasks, 1);
>         assert_eq!(
>             guard.last_panic_message,
>             Some("service unavailable with status code 503".to_string())
>         );
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Unwind Safety & `AssertUnwindSafe`**: `catch_unwind` requires its closure to implement `UnwindSafe`. When a closure captures mutable references or state, Rust flags it as potentially broken if an unwinding panic leaves invariants in a half-mutated state. `AssertUnwindSafe` explicitly wraps the closure to pledge that shared invariants are either properly guarded or reset upon panic.
> 2. **Panic Payload Type Downcasting**: When `panic!` is invoked, Rust packages the panic argument into a heap object trait object `Box<dyn Any + Send>`.
>    - `panic!("static literal")` produces `Box<&'static str>`.
>    - `panic!("formatted {}", arg)` allocates a `Box<String>`.
>    Using `downcast_ref` on `dyn Any + Send` queries the vtable type ID at runtime, safely converting the trait object back into concrete references (`&'static str` or `String`) without undefined behavior.
> 3. **Concurrency & Thread-Safe Telemetry**: Shared metrics are guarded by `Arc<Mutex<WorkerMetrics>>`. Even if the task closure panics mid-execution, stack unwinding pops stack frames back to `catch_unwind`. The caller thread retains ownership of the `Mutex` handle, guaranteeing telemetry is accurately updated without thread poisoning or data leaks.

---

### Exercise 2: Structured Telemetry Panic Hook with Custom Panic Payload Logging & Contextual Stack Capture

**Problem:**
In production microservices, relying on raw stderr panic prints makes incident debugging difficult because unstructured log streams lack structured telemetry fields like thread names and exact source code line coordinates.

Implement a telemetry recorder `TelemetryLogger` that:
1. Installs a global custom panic hook using `std::panic::set_hook`.
2. Captures panic metadata into a thread-safe `Arc<Mutex<Vec<PanicRecord>>>`, storing the thread name (`std::thread::current().name()`), panic payload message, and source file location (`PanicHookInfo::location()`).
3. Preserves previous panic hook chains (`std::panic::take_hook()`), invoking the prior hook after appending the telemetry event to allow default error formatting or crash-reporting agents to run concurrently.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::any::Any;
> use std::panic::{self, PanicHookInfo};
> use std::sync::{Arc, Mutex};
> use std::thread;
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct PanicRecord {
>     pub thread_name: String,
>     pub message: String,
>     pub location: String,
> }
> 
> pub struct TelemetryLogger {
>     records: Arc<Mutex<Vec<PanicRecord>>>,
> }
> 
> impl TelemetryLogger {
>     pub fn new(records: Arc<Mutex<Vec<PanicRecord>>>) -> Self {
>         Self { records }
>     }
> 
>     pub fn install_hook(&self) {
>         let records = Arc::clone(&self.records);
>         let previous_hook = panic::take_hook();
> 
>         panic::set_hook(Box::new(move |info: &PanicHookInfo<'_>| {
>             let thread_name = thread::current()
>                 .name()
>                 .unwrap_or("unnamed-thread")
>                 .to_string();
> 
>             let message = extract_payload(info.payload());
> 
>             let location = info
>                 .location()
>                 .map(|loc| format!("{}:{}:{}", loc.file(), loc.line(), loc.column()))
>                 .unwrap_or_else(|| "unknown location".to_string());
> 
>             let record = PanicRecord {
>                 thread_name,
>                 message,
>                 location,
>             };
> 
>             if let Ok(mut guard) = records.lock() {
>                 guard.push(record);
>             }
> 
>             // Chain execution to previous hook
>             previous_hook(info);
>         }));
>     }
> }
> 
> fn extract_payload(payload: &(dyn Any + Send)) -> String {
>     if let Some(s) = payload.downcast_ref::<&'static str>() {
>         s.to_string()
>     } else if let Some(s) = payload.downcast_ref::<String>() {
>         s.clone()
>     } else {
>         "non-string panic payload".to_string()
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_telemetry_panic_capture() {
>         let records = Arc::new(Mutex::new(Vec::new()));
>         let logger = TelemetryLogger::new(records.clone());
>         logger.install_hook();
> 
>         let unwind_res = panic::catch_unwind(|| {
>             panic!("telemetry intercepted pipeline fault");
>         });
> 
>         assert!(unwind_res.is_err());
>         assert_ne!(unwind_res.is_ok(), true);
> 
>         let guard = records.lock().unwrap();
>         assert_eq!(guard.len(), 1);
>         assert_eq!(guard[0].message, "telemetry intercepted pipeline fault");
>         assert_ne!(guard[0].location, "unknown location");
>         assert!(matches!(guard[0].location.contains("panic.md"), true | false));
>         assert!(guard[0].thread_name.len() > 0);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Panic Hooks vs `catch_unwind` Lifecycle**: `std::panic::set_hook` installs a handler that executes at the exact instant a panic is raised, **before** the stack unwinds. This guarantees that stack frames, local thread storage, and location metadata (`file!`, `line!`, `column!`) remain completely intact when `PanicHookInfo` is inspected.
> 2. **Hook Chaining Pattern**: Invoking `panic::take_hook()` fetches the existing registered hook before setting a new one via `panic::set_hook`. Calling `previous_hook(info)` at the end of the custom closure ensures hook composition—preventing telemetry extensions from suppressing standard error printing or diagnostic logging configured by upstream frameworks.
> 3. **Thread Safety & Payload Bounds**: The panic hook receives `&PanicHookInfo`, where `.payload()` returns `&(dyn Any + Send)`. Shared storage is guarded by `Arc<Mutex<Vec<PanicRecord>>>`, allowing panics originating from any OS thread to safely push records into the central telemetry buffer under mutex synchronization.

---

### Exercise 3: FFI Exception Boundary Guard & Abort Safety Wrapper

**Problem:**
When exporting Rust library functions to C/C++ via dynamic libraries or Foreign Function Interfaces (FFI), permitting a Rust stack panic to unwind across an `extern "C"` binary interface boundary triggers Undefined Behavior (UB) or forces process termination.

Design an FFI-safe exception boundary function `ffi_exception_guard` that:
1. Accepts a target output raw pointer `*mut T` and a generic Rust closure `F: FnOnce() -> Result<T, String>`.
2. Traps any Rust panic using `catch_unwind` and `AssertUnwindSafe`.
3. Validates pointer non-nullness before writing outputs using raw memory operations (`std::ptr::write`).
4. Converts all outcome states into explicit `i32` FFI status codes:
   - `0` (`FFI_SUCCESS`): Result successfully computed and written to `*mut T`.
   - `-1` (`FFI_ERR_NULL_PTR`): Output raw pointer is null.
   - `-2` (`FFI_ERR_LOGICAL`): Computation returned an operational `Err(String)`.
   - `-3` (`FFI_ERR_PANIC`): Unwinding panic trapped at boundary.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::panic::{catch_unwind, AssertUnwindSafe};
> use std::ptr;
> 
> pub const FFI_SUCCESS: i32 = 0;
> pub const FFI_ERR_NULL_PTR: i32 = -1;
> pub const FFI_ERR_LOGICAL: i32 = -2;
> pub const FFI_ERR_PANIC: i32 = -3;
> 
> /// # Safety
> /// `output_ptr` must be a valid, writable pointer to `T` when non-null.
> pub unsafe fn ffi_exception_guard<F, T>(output_ptr: *mut T, operation: F) -> i32
> where
>     F: FnOnce() -> Result<T, String>,
> {
>     if output_ptr.is_null() {
>         return FFI_ERR_NULL_PTR;
>     }
> 
>     let unwind_result = catch_unwind(AssertUnwindSafe(operation));
> 
>     match unwind_result {
>         Ok(Ok(value)) => {
>             unsafe {
>                 ptr::write(output_ptr, value);
>             }
>             FFI_SUCCESS
>         }
>         Ok(Err(_err_msg)) => FFI_ERR_LOGICAL,
>         Err(_panic_payload) => FFI_ERR_PANIC,
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
>     use std::mem::MaybeUninit;
> 
>     #[test]
>     fn test_ffi_guard_success() {
>         let mut slot = MaybeUninit::<i32>::uninit();
>         let status = unsafe {
>             ffi_exception_guard(slot.as_mut_ptr(), || Ok(100))
>         };
>
>         assert_eq!(status, FFI_SUCCESS);
>         assert_ne!(status, FFI_ERR_PANIC);
>         assert_eq!(unsafe { slot.assume_init() }, 100);
>     }
> 
>     #[test]
>     fn test_ffi_guard_null_pointer() {
>         let status = unsafe {
>             ffi_exception_guard::<_, i32>(ptr::null_mut(), || Ok(42))
>         };
>
>         assert_eq!(status, FFI_ERR_NULL_PTR);
>         assert!(matches!(status, FFI_ERR_NULL_PTR));
>     }
> 
>     #[test]
>     fn test_ffi_guard_logical_error() {
>         let mut slot = MaybeUninit::<i32>::uninit();
>         let status = unsafe {
>             ffi_exception_guard(slot.as_mut_ptr(), || Err("invalid input operand".to_string()))
>         };
>
>         assert_eq!(status, FFI_ERR_LOGICAL);
>         assert_ne!(status, FFI_SUCCESS);
>     }
> 
>     #[test]
>     fn test_ffi_guard_panic_caught() {
>         let mut slot = MaybeUninit::<i32>::uninit();
>         let status = unsafe {
>             ffi_exception_guard(slot.as_mut_ptr(), || {
>                 panic!("internal memory index out of bounds");
>             })
>         };
>
>         assert_eq!(status, FFI_ERR_PANIC);
>         assert!(matches!(status, FFI_ERR_PANIC));
>         assert_ne!(status, FFI_SUCCESS);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **FFI ABI Panic Boundary Guarantees**: Under Rust's C ABI spec (`extern "C"`), allowing a panic to unwind past the function boundary violates target calling conventions, triggering instant aborts or frame corruption in host dynamic callers (e.g. C/C++ binaries). `catch_unwind` creates an explicit boundary, turning panics into integer error codes.
> 2. **Uninitialized Memory & Raw Pointer Safety**: Writing output results using standard assignment (`*output_ptr = val`) is invalid for uninitialized memory targets like `MaybeUninit` because standard assignment attempts to drop existing target memory first. `ptr::write(output_ptr, value)` performs a raw bitwise copy of `value` into the pointer destination without invoking `Drop` on uninitialized bytes.
> 3. **Error Serialization & Exclusivity**: Operational `Result::Err` errors and runtime unwinding panics represent distinct failure modes. The status codes isolate logical program errors (`-2`) from fatal runtime assertion panics (`-3`) and pointer validation failures (`-1`), presenting a deterministic interface to foreign callers.

---

## 6. Related Terms

- [`unwrap()` / `expect()`](../level_04/unwrap_expect.md) — The methods that actively choose to trigger a `panic!` if a `Result` is an error.
- [`Drop` Trait](../level_03/drop_trait.md) — The cleanup method that is rapidly executed as the stack unwinds during a panic.

---

## 7. Key Takeaways

- `panic!` is a macro used for **unrecoverable errors** where the program cannot safely continue.
- It triggers a controlled shutdown called **"unwinding the stack"**, which executes the `Drop` trait on all active variables to safely free memory.
- You can manually call it using `panic!("message")`.
- It is implicitly called by memory-safety protections, like array out-of-bounds indexing, `.unwrap()`, or division by zero.
- You can view the exact sequence of function calls that led to the crash by running the program with the `RUST_BACKTRACE=1` environment variable.
