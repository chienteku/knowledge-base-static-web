# `loop`

> **Level 2 — Control Flow & Data Structures**
> An infinite loop; exit with `break` (which can return a value).

---

## 1. Prerequisites

- [`if` / `else`](../level_02/if_else.md) — You almost always need an `if` statement to decide when to stop the loop.
- [Expressions](../level_01/expressions.md) — Understanding how blocks of code can evaluate to a value.

---

## 2. Term Category

**Rust-specific (mostly)**: While many languages use `while(true)` for infinite loops, Rust provides a dedicated `loop` keyword. Furthermore, Rust's `loop` is unique because it is an *expression* that can return a value via the `break` statement.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Infinite loops are incredibly common in programming. A web server runs in an infinite loop listening for requests, a video game runs in an infinite rendering loop, and network requests often need to retry infinitely until they succeed. 

Instead of forcing developers to write the slightly awkward `while true { ... }`, Rust provides the explicit `loop` keyword. This isn't just syntactic sugar—it actually helps the Rust compiler! When the compiler sees `loop`, it knows with 100% certainty that the code inside will run at least once and won't stop until it hits a `break`.

Because Rust loves [Expressions](../level_01/expressions.md), `loop` can also evaluate to a value. If you are looping specifically to calculate a result (like waiting for a user to type a valid number), you can hand that result directly to the `break` keyword. The entire `loop` block will then evaluate to that value, allowing you to assign it cleanly to a `let` variable.

### (2) Reality Metaphor

A `loop` is like **running on a treadmill**. 

Once you press start, you will keep running infinitely. You only stop when a specific condition occurs (e.g., you hit 5 miles, or you get too tired). At that point, you hit the big red `break` button to stop the machine.

Returning a value from a loop is like stepping off the treadmill and immediately handing your final calorie count (the value) to your fitness app (the variable).

### (3) Rust Code Examples

#### Short Snippet
```rust
let mut counter = 0;

loop {
    counter += 1;
    
    if counter == 3 {
        println!("Hit the limit! Stopping.");
        break; // This exits the loop entirely.
    }
}
```

#### Fuller Example
```rust
fn main() {
    let mut retry_count = 0;
    
    // We want to retry a fake network connection until it succeeds.
    // Because `loop` is an expression, we can assign its result to `status`.
    let status = loop {
        retry_count += 1;
        
        if retry_count < 5 {
            println!("Connection failed, retrying...");
            continue; // `continue` skips to the next iteration of the loop.
        }
        
        // When we finally succeed, we pass the "Success" string to `break`.
        // This stops the loop AND returns "Success" to the `status` variable.
        break "Success"; 
    };
    
    // Note the semicolon after the `loop` block! 
    // It is required because this was a `let` statement.
    
    println!("Final connection status: {}", status);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Loop Scoping and Lifecycle Rules

**The mistake:** Assuming Loop instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("loop_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("loop_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Loop State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Loop through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Loop Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Loop instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Resilient Microservice Network Retry Engine with Exponential Backoff

**Scenario:**
In distributed microservice architectures, downstream remote calls frequently suffer from transient network outages or temporary rate-limiting. A common production pattern is an infinite `loop` expression acting as a stateful retry engine that evaluates to a `Result<Response, NetworkError>` using `break` statements.

**Task:**
Implement `execute_with_retry<F>(config: RetryConfig, mut request_fn: F) -> Result<Response, NetworkError>` where `F: FnMut(u32) -> ServiceStatus`.
- The function must execute an infinite `loop` that increments attempt counters and invokes `request_fn(attempt)`.
- If `ServiceStatus::Success(resp)` is returned, exit the loop using `break Ok(resp)`.
- If `ServiceStatus::TransientFailure(reason)` is returned:
  - If `attempt >= config.max_attempts`, exit the loop using `break Err(NetworkError::MaxRetriesExceeded { attempts: attempt, last_error: reason })`.
  - Otherwise, update backoff state (`(current_backoff * 2).min(config.max_backoff_ms)`) and invoke `continue` to advance to the next retry attempt.
- If `ServiceStatus::FatalFailure(reason)` is returned, immediately exit using `break Err(NetworkError::Fatal(reason))`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq)]
> pub enum NetworkError {
>     MaxRetriesExceeded { attempts: u32, last_error: String },
>     Fatal(String),
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct Response {
>     pub status_code: u16,
>     pub body: String,
> }
> 
> pub enum ServiceStatus {
>     Success(Response),
>     TransientFailure(String),
>     FatalFailure(String),
> }
> 
> pub struct RetryConfig {
>     pub max_attempts: u32,
>     pub initial_backoff_ms: u64,
>     pub max_backoff_ms: u64,
> }
> 
> pub fn execute_with_retry<F>(config: RetryConfig, mut request_fn: F) -> Result<Response, NetworkError>
> where
>     F: FnMut(u32) -> ServiceStatus,
> {
>     let mut attempt = 0;
>     let mut current_backoff = config.initial_backoff_ms;
> 
>     let result = loop {
>         attempt += 1;
>         match request_fn(attempt) {
>             ServiceStatus::Success(resp) => {
>                 break Ok(resp);
>             }
>             ServiceStatus::TransientFailure(reason) => {
>                 if attempt >= config.max_attempts {
>                     break Err(NetworkError::MaxRetriesExceeded {
>                         attempts: attempt,
>                         last_error: reason,
>                     });
>                 }
>                 current_backoff = (current_backoff * 2).min(config.max_backoff_ms);
>                 continue;
>             }
>             ServiceStatus::FatalFailure(reason) => {
>                 break Err(NetworkError::Fatal(reason));
>             }
>         }
>     };
> 
>     result
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_retry_success_first_attempt() {
>         let config = RetryConfig {
>             max_attempts: 3,
>             initial_backoff_ms: 100,
>             max_backoff_ms: 1000,
>         };
> 
>         let result = execute_with_retry(config, |_attempt| {
>             ServiceStatus::Success(Response {
>                 status_code: 200,
>                 body: "OK".to_string(),
>             })
>         });
> 
>         assert!(result.is_ok());
>         let resp = result.unwrap();
>         assert_eq!(resp.status_code, 200);
>         assert_eq!(resp.body, "OK");
>         assert_ne!(resp.status_code, 500);
>         assert!(matches!(resp, Response { status_code: 200, .. }));
>     }
> 
>     #[test]
>     fn test_retry_transient_then_success() {
>         let config = RetryConfig {
>             max_attempts: 4,
>             initial_backoff_ms: 50,
>             max_backoff_ms: 400,
>         };
> 
>         let result = execute_with_retry(config, |attempt| {
>             if attempt < 3 {
>                 ServiceStatus::TransientFailure(format!("Timeout on attempt {}", attempt))
>             } else {
>                 ServiceStatus::Success(Response {
>                     status_code: 200,
>                     body: "Recovered".to_string(),
>                 })
>             }
>         });
> 
>         assert!(result.is_ok());
>         let resp = result.unwrap();
>         assert_eq!(resp.body, "Recovered");
>         assert_ne!(resp.body, "Failed");
>         assert!(matches!(resp.status_code, 200));
>     }
> 
>     #[test]
>     fn test_retry_max_retries_exceeded() {
>         let config = RetryConfig {
>             max_attempts: 3,
>             initial_backoff_ms: 10,
>             max_backoff_ms: 50,
>         };
> 
>         let result = execute_with_retry(config, |attempt| {
>             ServiceStatus::TransientFailure(format!("503 Service Unavailable #{}", attempt))
>         });
> 
>         assert!(result.is_err());
>         let err = result.unwrap_err();
>         assert_ne!(err, NetworkError::Fatal("503".to_string()));
>         assert!(matches!(
>             err,
>             NetworkError::MaxRetriesExceeded { attempts: 3, .. }
>         ));
>         if let NetworkError::MaxRetriesExceeded { attempts, last_error } = err {
>             assert_eq!(attempts, 3);
>             assert!(last_error.contains("503 Service Unavailable #3"));
>         }
>     }
> 
>     #[test]
>     fn test_retry_fatal_failure_immediate_break() {
>         let config = RetryConfig {
>             max_attempts: 5,
>             initial_backoff_ms: 10,
>             max_backoff_ms: 50,
>         };
> 
>         let mut calls = 0;
>         let result = execute_with_retry(config, |_attempt| {
>             calls += 1;
>             ServiceStatus::FatalFailure("401 Unauthorized".to_string())
>         });
> 
>         assert_eq!(calls, 1);
>         assert_ne!(calls, 5);
>         assert!(result.is_err());
>         assert!(matches!(result, Err(NetworkError::Fatal(_))));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **`loop` as an Expression**: In Rust, `loop` blocks are primary expressions that evaluate to a concrete value supplied by `break expression;`. The variable `result` directly receives the `Result<Response, NetworkError>` evaluated by the `loop` block without requiring intermediate mutable optional containers (`Option<Result<...>>`).
> 2. **Type Uniformity & Language Invariants**: Every `break` statement inside a typed `loop` expression must return the identical type. In `execute_with_retry`, all three exit arms (`break Ok(resp)`, `break Err(NetworkError::MaxRetriesExceeded { .. })`, and `break Err(NetworkError::Fatal(..))`) evaluate to `Result<Response, NetworkError>`. If any `break` arm returned a mismatched type or omitted a value, the compiler would trigger `E0308`.
> 3. **Ownership and State Mutation**: The retry state variables (`attempt` and `current_backoff`) are mutated across iterations in the caller frame. The closure `request_fn` is declared with `FnMut(u32)` to allow mutable environment capture across retry iterations.
> 4. **Edge Cases & Backoff Bounds**: Exponential backoff calculations can overflow integer limits if uncontrolled; `.min(config.max_backoff_ms)` ensures upper bounds are safe. When `FatalFailure` occurs, the engine breaks immediately, guaranteeing zero wasted retry cycles or side effects on unrecoverable errors.

---

### Exercise 2: Labeled Multi-Pass Stream Packet Framing & Validation Parser

**Scenario:**
High-performance binary network protocols transmit framed packets over contiguous stream buffers. Stream parsing requires resynchronizing corrupted headers and skipping malformed frames using nested loops with loop labels (`'stream: loop` and `'frame: loop`).

**Task:**
Implement `parse_stream_frames(buffer: &[u8]) -> ParseSummary`.
- Frame protocol definition:
  - Header: Magic byte `0xAA` (1 byte).
  - Length: Payload length `L` (1 byte `u8`).
  - Payload: `L` bytes.
  - Checksum: Bitwise XOR sum of payload bytes (1 byte).
- Control flow rules:
  - Label the outer loop `'stream: loop`. If remaining buffer bytes `< 2`, break out of `'stream`.
  - If `remaining[0] != 0xAA`, resynchronize by incrementing cursor by 1 byte and calling `continue 'stream`.
  - If remaining buffer length is less than the complete frame size (`2 + L + 1`), break out of `'stream` (buffer truncated).
  - Label the inner validation loop `'frame: loop`. Calculate payload checksum.
  - If checksum matches, record `Frame { payload: payload.to_vec() }`, advance cursor past the frame, and break out of `'frame`.
  - If checksum fails, increment corrupted frame counter, advance cursor by 1 byte past corrupt magic header, and call `continue 'stream` to resume stream scanning.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq)]
> pub struct Frame {
>     pub payload: Vec<u8>,
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct ParseSummary {
>     pub frames: Vec<Frame>,
>     pub bytes_processed: usize,
>     pub corrupted_frames_skipped: usize,
> }
> 
> pub fn parse_stream_frames(buffer: &[u8]) -> ParseSummary {
>     let mut frames = Vec::new();
>     let mut cursor = 0;
>     let mut corrupt_count = 0;
> 
>     'stream: loop {
>         let remaining = &buffer[cursor..];
>         if remaining.len() < 2 {
>             break 'stream;
>         }
> 
>         if remaining[0] != 0xAA {
>             cursor += 1;
>             continue 'stream;
>         }
> 
>         let payload_len = remaining[1] as usize;
>         let total_frame_len = 2 + payload_len + 1;
> 
>         if remaining.len() < total_frame_len {
>             break 'stream;
>         }
> 
>         'frame: loop {
>             let payload = &remaining[2..2 + payload_len];
>             let expected_checksum = remaining[2 + payload_len];
>             let calculated_checksum = payload.iter().fold(0u8, |acc, &b| acc ^ b);
> 
>             if calculated_checksum != expected_checksum {
>                 corrupt_count += 1;
>                 cursor += 1;
>                 continue 'stream;
>             }
> 
>             frames.push(Frame {
>                 payload: payload.to_vec(),
>             });
>             cursor += total_frame_len;
>             break 'frame;
>         }
>     }
> 
>     ParseSummary {
>         frames,
>         bytes_processed: cursor,
>         corrupted_frames_skipped: corrupt_count,
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_parse_valid_single_frame() {
>         let data = vec![0xAA, 0x03, 10, 20, 30, 10 ^ 20 ^ 30];
>         let summary = parse_stream_frames(&data);
> 
>         assert!(summary.frames.len() == 1);
>         assert_eq!(summary.frames[0].payload, vec![10, 20, 30]);
>         assert_eq!(summary.bytes_processed, 6);
>         assert_ne!(summary.bytes_processed, 0);
>         assert!(matches!(
>             summary,
>             ParseSummary {
>                 corrupted_frames_skipped: 0,
>                 ..
>             }
>         ));
>     }
> 
>     #[test]
>     fn test_parse_multiple_frames_with_noise() {
>         let data = vec![
>             0xFF, 0x00,
>             0xAA, 0x01, 42, 42,
>             0xBB,
>             0xAA, 0x02, 1, 2, 1 ^ 2,
>         ];
>         let summary = parse_stream_frames(&data);
> 
>         assert_eq!(summary.frames.len(), 2);
>         assert_eq!(summary.frames[0].payload, vec![42]);
>         assert_eq!(summary.frames[1].payload, vec![1, 2]);
>         assert_ne!(summary.corrupted_frames_skipped, 99);
>         assert!(matches!(summary.frames.as_slice(), [_, _]));
>     }
> 
>     #[test]
>     fn test_parse_corrupt_checksum_recovery() {
>         let data = vec![
>             0xAA, 0x01, 42, 99,
>             0xAA, 0x01, 7, 7,
>         ];
>         let summary = parse_stream_frames(&data);
> 
>         assert_eq!(summary.frames.len(), 1);
>         assert_eq!(summary.frames[0].payload, vec![7]);
>         assert_eq!(summary.corrupted_frames_skipped, 1);
>         assert_ne!(summary.corrupted_frames_skipped, 0);
>         assert!(matches!(summary.frames.first(), Some(f) if f.payload == vec![7]));
>     }
> 
>     #[test]
>     fn test_parse_truncated_buffer() {
>         let data = vec![0xAA, 0x05, 1, 2];
>         let summary = parse_stream_frames(&data);
> 
>         assert!(summary.frames.is_empty());
>         assert_eq!(summary.bytes_processed, 0);
>         assert_ne!(summary.bytes_processed, 4);
>         assert!(matches!(summary.frames.len(), 0));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Loop Labels & Scope Targeting**: Rust allows loop constructs to be prefixed with explicit labels like `'stream:` and `'frame:`. By invoking `continue 'stream` from inside the nested `'frame: loop`, control flow instantly unwinds the inner loop and resumes execution at the beginning of the outer stream iteration.
> 2. **Zero-Copy Slicing & Lifetimes**: During framing inspection, slices (`&remaining[2..2 + payload_len]`) borrow directly from the input `&[u8]` buffer without heap allocation. Memory allocation for `Frame` payload `Vec<u8>` occurs exclusively after verifying payload integrity and checksum.
> 3. **Stream Resynchronization & Safety**: Binary protocol stream parsers must handle junk bytes or corrupted headers without panicking. When an invalid magic byte or corrupted checksum is encountered, the cursor advances by 1 byte and `continue 'stream` re-scans the stream sequentially, preventing infinite loops on corrupted inputs.
> 4. **Edge Cases**: Buffer truncation (`remaining.len() < total_frame_len`) breaks the outer loop gracefully, preserving already-parsed frames and returning the exact count of processed bytes.

---

### Exercise 3: Lock-Free Ring Buffer Event Collector with CAS Retry Loop

**Scenario:**
In concurrent multi-threaded telemetry and logging pipelines, lock contention on traditional mutexes degrades throughput. Low-latency systems employ lock-free circular buffers where producer threads reserve write slots using atomic Compare-And-Swap (CAS) inside an infinite retry `loop`.

**Task:**
Implement `LockFreeRingBuffer` slot reservation using `AtomicUsize` and CAS retry loop:
- `reserve_slot(&self) -> Result<usize, BufferError>`:
  - Enters a labeled atomic loop `'cas: loop`.
  - Atomically reads current `head` and `tail` pointers.
  - Checks buffer capacity: if `head.wrapping_sub(tail) >= self.capacity`, breaks out of `'cas` returning `Err(BufferError::Full)`.
  - Computes `next_head = current_head.wrapping_add(1)`.
  - Executes `self.head.compare_exchange_weak(current_head, next_head, Ordering::AcqRel, Ordering::Acquire)`.
  - On `Ok(_)`, breaks out of `'cas` returning `Ok(current_head % self.capacity)`.
  - On `Err(_)`, another thread updated `head` concurrently; calls `continue 'cas` to retry the reservation with updated atomic values.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::sync::atomic::{AtomicUsize, Ordering};
> use std::sync::Arc;
> use std::thread;
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum BufferError {
>     Full,
>     Shutdown,
> }
> 
> pub struct LockFreeRingBuffer {
>     capacity: usize,
>     head: AtomicUsize,
>     tail: AtomicUsize,
> }
> 
> impl LockFreeRingBuffer {
>     pub fn new(capacity: usize) -> Self {
>         Self {
>             capacity,
>             head: AtomicUsize::new(0),
>             tail: AtomicUsize::new(0),
>         }
>     }
> 
>     pub fn reserve_slot(&self) -> Result<usize, BufferError> {
>         let result = 'cas: loop {
>             let current_head = self.head.load(Ordering::Relaxed);
>             let current_tail = self.tail.load(Ordering::Acquire);
> 
>             if current_head.wrapping_sub(current_tail) >= self.capacity {
>                 break 'cas Err(BufferError::Full);
>             }
> 
>             let next_head = current_head.wrapping_add(1);
> 
>             match self.head.compare_exchange_weak(
>                 current_head,
>                 next_head,
>                 Ordering::AcqRel,
>                 Ordering::Acquire,
>             ) {
>                 Ok(_) => {
>                     let slot_idx = current_head % self.capacity;
>                     break 'cas Ok(slot_idx);
>                 }
>                 Err(_) => {
>                     continue 'cas;
>                 }
>             }
>         };
> 
>         result
>     }
> 
>     pub fn advance_tail(&self, count: usize) {
>         self.tail.fetch_add(count, Ordering::Release);
>     }
> 
>     pub fn len(&self) -> usize {
>         let head = self.head.load(Ordering::Relaxed);
>         let tail = self.tail.load(Ordering::Relaxed);
>         head.wrapping_sub(tail)
>     }
> 
>     pub fn is_empty(&self) -> bool {
>         self.len() == 0
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_single_thread_slot_reservation() {
>         let buffer = LockFreeRingBuffer::new(4);
> 
>         assert_eq!(buffer.reserve_slot(), Ok(0));
>         assert_eq!(buffer.reserve_slot(), Ok(1));
>         assert_eq!(buffer.reserve_slot(), Ok(2));
>         assert_eq!(buffer.reserve_slot(), Ok(3));
> 
>         let err = buffer.reserve_slot();
>         assert!(err.is_err());
>         assert_eq!(err, Err(BufferError::Full));
>         assert_ne!(err, Ok(4));
>         assert!(matches!(err, Err(BufferError::Full)));
>     }
> 
>     #[test]
>     fn test_tail_advance_frees_capacity() {
>         let buffer = LockFreeRingBuffer::new(2);
> 
>         assert!(buffer.reserve_slot().is_ok());
>         assert!(buffer.reserve_slot().is_ok());
>         assert_eq!(buffer.reserve_slot(), Err(BufferError::Full));
> 
>         buffer.advance_tail(1);
> 
>         let res = buffer.reserve_slot();
>         assert!(res.is_ok());
>         assert_eq!(res, Ok(0));
>         assert_ne!(res, Ok(1));
>         assert!(matches!(res, Ok(0)));
>     }
> 
>     #[test]
>     fn test_concurrent_multi_thread_reservations() {
>         let capacity = 1000;
>         let buffer = Arc::new(LockFreeRingBuffer::new(capacity));
>         let num_threads = 10;
>         let slots_per_thread = 100;
> 
>         let mut handles = Vec::new();
> 
>         for _ in 0..num_threads {
>             let buf_clone = Arc::clone(&buffer);
>             let handle = thread::spawn(move || {
>                 let mut local_slots = Vec::new();
>                 for _ in 0..slots_per_thread {
>                     if let Ok(slot) = buf_clone.reserve_slot() {
>                         local_slots.push(slot);
>                     }
>                 }
>                 local_slots
>             });
>             handles.push(handle);
>         }
> 
>         let mut total_reserved = 0;
>         for handle in handles {
>             let thread_slots = handle.join().unwrap();
>             total_reserved += thread_slots.len();
>         }
> 
>         assert_eq!(total_reserved, 1000);
>         assert_eq!(buffer.len(), 1000);
>         assert_ne!(buffer.len(), 0);
>         assert!(matches!(buffer.reserve_slot(), Err(BufferError::Full)));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Lock-Free CAS Loops**: In concurrent Rust, `compare_exchange_weak` inside an explicit `loop` provides non-blocking synchronization. If thread A loses a race to thread B, `compare_exchange_weak` returns `Err(actual_value)`, causing the loop to call `continue 'cas` and retry with the updated state rather than acquiring a blocking kernel mutex lock.
> 2. **Memory Ordering & Hardware Barriers**: `Ordering::AcqRel` on success ensures write operations performed prior to slot reservation become visible to consumer threads reading slot data (`Release`), while acquiring prior consumer tail updates (`Acquire`).
> 3. **Wrapping Arithmetic & Overflow**: Atomic counters wrapping around integer boundaries (`usize::MAX`) are safely calculated using `wrapping_sub` and `wrapping_add`. The distance `head.wrapping_sub(tail)` correctly yields the number of active items regardless of counter rollover.
> 4. **Thread Safety & `Sync` Trait**: `LockFreeRingBuffer` implements `Sync` automatically because all inner fields (`AtomicUsize`, `usize`) implement `Sync`, permitting safe shared borrowing across thread handles wrapped in `Arc`.

---

## 6. Related Terms

- [`while`](../level_02/while.md) — A loop that runs as long as a specific condition evaluates to true.
- [`for` / Range](../level_02/for_range.md) — An iterator loop (the most common and idiomatic loop in Rust).
- [Expressions](../level_01/expressions.md) — The concept that allows `loop` to return a value.

---

## 7. Key Takeaways

- `loop` creates an infinite loop.
- Use the `break` keyword to exit the loop entirely.
- Use the `continue` keyword to skip the rest of the current iteration and start the next one immediately.
- `loop` can be used as an **expression** to return a value by passing that value to `break` (e.g., `break 42;`).
- Always prefer `loop` over `while true`.
