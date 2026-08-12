# Unit Type (`()`)

> **Level 1 — Foundations**
> The "nothing" type, taking 0 bytes. Implicitly returned when there is no other value.

---

## 1. Prerequisites


- [fn](fn.md) — Functions that don't specify a return type implicitly return `()`.
- [Statements](statements.md) — Statements in Rust evaluate to the Unit Type `()`.
- [Expressions](expressions.md) — If you add a semicolon to an expression, it turns into a statement and returns `()` instead of its actual value.
- [Scalar Types](scalar_types.md) — Primitive types.

---

## 2. Term Category

**Rust-specific (the explicitness)**: In languages like C, Java, or C++, a function that returns nothing is marked with the keyword `void`. In Rust, there is no `void`. Instead, functions that "return nothing" actually return a concrete type: the Unit Type `()`, which takes up exactly zero bytes of memory.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In programming language design, treating "functions that return a value" and "functions that return nothing" as two completely different concepts causes massive headaches—especially when building Generic types (code that can accept *any* type). 

Rust's designers unified this by ensuring that **every single block of code and every single function in Rust returns *something***. 

If a function doesn't have a meaningful value to return, it simply returns the Unit Type `()`. Because it takes exactly 0 bytes of memory, there is absolutely no performance penalty. But because it is a real type, the mathematical consistency of Rust's compiler is preserved. No special `void` rules are needed!

### (2) Reality Metaphor

The Unit Type is like an **Empty Receipt**.

If you go to the store and buy an apple, the cashier hands you an apple (a concrete value, like an `i32`). 

If you go to the store, ask the cashier for directions, and leave without buying anything, they don't give you an apple. Instead, imagine they print out a completely blank receipt and hand it to you. This is the Unit Type `()`. 

The blank receipt has zero monetary value and takes up zero space in your pocket. However, it serves as physical proof to the universe that your interaction with the cashier completed successfully. 

### (3) Rust Code Examples

#### Short Snippet (Implicit Return)
```rust
// These two function signatures mean the EXACT same thing.
// If you don't specify a return type, Rust assumes `-> ()`
fn do_nothing() {
    println!("I return nothing!");
}

fn do_nothing_explicit() -> () {
    println!("I also return nothing!");
}
```

#### Fuller Example (The Semicolon Effect)
```rust
fn main() {
    // A block expression evaluates to its last line.
    // Because `5 + 5` has no semicolon, this block evaluates to `10`.
    let a: i32 = {
        5 + 5
    };

    // Because we added a semicolon to the end of `5 + 5;`, it becomes a Statement.
    // Statements evaluate to `()`. 
    // Therefore, `b` is assigned the Unit Type.
    let b: () = {
        5 + 5; 
    };

    println!("Value of a: {}", a);
    println!("Value of b is the unit type, which prints as: {:?}", b);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Accidental Semicolons

**The mistake:** Trying to return a value from a function, but putting a semicolon `;` at the end of the line.

**Why it's wrong:** As shown in the example above, a semicolon suppresses the value of an expression and turns it into `()`. If your function signature promises to return an `i32`, but you return `()`, the compiler will throw a `mismatched types` error.

*Incorrect:*
```rust
fn add_one(x: i32) -> i32 {
    x + 1; // ERROR: expected `i32`, found `()`
}
```

*Fix:*
```rust
fn add_one(x: i32) -> i32 {
    x + 1 // Remove the semicolon!
}
```

### Mistake 2: Mutating Unit Type State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Unit Type through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Unit Type Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Unit Type instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: High-Throughput Telemetry Ingestion & Deduplication Pipeline (`Result<(), PipelineError>` and `HashMap<K, ()>`)

**Scenario**:
In high-throughput event streaming engines, raw telemetry data frames must be deduplicated before entering storage or stream analytics pipelines. To minimize heap overhead when storing millions of request IDs in memory, engineers leverage `std::collections::HashMap<String, ()>`, transforming a map into a zero-overhead set membership index where values consume exactly 0 bytes (`size_of::<()>() == 0`). Furthermore, ingestion side-effects return `Result<(), PipelineError>` to signal successful buffer updates without allocating redundant return payloads.

**Task Requirements**:
1. Define a `PipelineError` enum with variants `DuplicateId(String)`, `InvalidPayload(String)`, and `CapacityExceeded`. Derive `Debug`, `Clone`, `PartialEq`, `Eq`.
2. Construct a `TelemetryPipeline` struct managing:
   - `dedup_set`: `std::collections::HashMap<String, ()>`
   - `max_capacity`: `usize`
   - `processed_count`: `u64`
3. Implement `TelemetryPipeline::new(max_capacity: usize) -> Self`.
4. Implement `process_frame(&mut self, request_id: &str, payload: &str) -> Result<(), PipelineError>`:
   - If `payload.trim().is_empty()`, return `Err(PipelineError::InvalidPayload("Payload cannot be empty".to_string()))`.
   - If `request_id` exists in `dedup_set`, return `Err(PipelineError::DuplicateId(request_id.to_string()))`.
   - If `dedup_set.len() >= max_capacity`, return `Err(PipelineError::CapacityExceeded)`.
   - Insert `(request_id.to_string(), ())` into `dedup_set`, increment `processed_count`, and return `Ok(())`.
5. Implement `flush(&mut self) -> Result<(), PipelineError>` to clear `dedup_set` and return `Ok(())`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::HashMap;
>
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub enum PipelineError {
>     DuplicateId(String),
>     InvalidPayload(String),
>     CapacityExceeded,
> }
>
> pub struct TelemetryPipeline {
>     dedup_set: HashMap<String, ()>,
>     max_capacity: usize,
>     processed_count: u64,
> }
>
> impl TelemetryPipeline {
>     pub fn new(max_capacity: usize) -> Self {
>         Self {
>             dedup_set: HashMap::new(),
>             max_capacity,
>             processed_count: 0,
>         }
>     }
>
>     pub fn process_frame(&mut self, request_id: &str, payload: &str) -> Result<(), PipelineError> {
>         if payload.trim().is_empty() {
>             return Err(PipelineError::InvalidPayload(
>                 "Payload cannot be empty".to_string(),
>             ));
>         }
>         if self.dedup_set.contains_key(request_id) {
>             return Err(PipelineError::DuplicateId(request_id.to_string()));
>         }
>         if self.dedup_set.len() >= self.max_capacity {
>             return Err(PipelineError::CapacityExceeded);
>         }
>
>         self.dedup_set.insert(request_id.to_string(), ());
>         self.processed_count += 1;
>         Ok(())
>     }
>
>     pub fn flush(&mut self) -> Result<(), PipelineError> {
>         self.dedup_set.clear();
>         Ok(())
>     }
>
>     pub fn processed_count(&self) -> u64 {
>         self.processed_count
>     }
>
>     pub fn len(&self) -> usize {
>         self.dedup_set.len()
>     }
>
>     pub fn is_empty(&self) -> bool {
>         self.dedup_set.is_empty()
>     }
> }
>
> #[cfg(test)]
> mod tests {
>     use super::*;
>
>     #[test]
>     fn test_unit_type_memory_footprint() {
>         assert_eq!(std::mem::size_of::<()>(), 0);
>         assert_eq!(std::mem::align_of::<()>(), 1);
>     }
>
>     #[test]
>     fn test_successful_frame_processing() {
>         let mut pipeline = TelemetryPipeline::new(5);
>         let result = pipeline.process_frame("req-101", "{\"temp\": 22.4}");
>         assert!(result.is_ok());
>         assert_eq!(pipeline.len(), 1);
>         assert_eq!(pipeline.processed_count(), 1);
>     }
>
>     #[test]
>     fn test_duplicate_detection() {
>         let mut pipeline = TelemetryPipeline::new(5);
>         assert!(pipeline.process_frame("req-101", "data").is_ok());
>
>         let dup_err = pipeline.process_frame("req-101", "data_diff");
>         assert!(matches!(dup_err, Err(PipelineError::DuplicateId(ref id)) if id == "req-101"));
>         assert_ne!(pipeline.processed_count(), 2);
>     }
>
>     #[test]
>     fn test_invalid_payload() {
>         let mut pipeline = TelemetryPipeline::new(5);
>         let err = pipeline.process_frame("req-102", "   ");
>         assert!(matches!(err, Err(PipelineError::InvalidPayload(_))));
>         assert_eq!(pipeline.len(), 0);
>     }
>
>     #[test]
>     fn test_capacity_limit_and_flush() {
>         let mut pipeline = TelemetryPipeline::new(2);
>         assert!(pipeline.process_frame("req-1", "payload").is_ok());
>         assert!(pipeline.process_frame("req-2", "payload").is_ok());
>
>         let cap_err = pipeline.process_frame("req-3", "payload");
>         assert_eq!(cap_err, Err(PipelineError::CapacityExceeded));
>         assert_eq!(pipeline.len(), 2);
>
>         assert!(pipeline.flush().is_ok());
>         assert!(pipeline.is_empty());
>         assert!(pipeline.process_frame("req-3", "payload").is_ok());
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Zero-Sized Type (ZST) Optimization**: The unit type `()` occupies 0 bytes of memory (`std::mem::size_of::<()>() == 0`). When stored as map values in `HashMap<K, ()>`, the compiler optimizes away value allocations completely. The bucket storage only holds hash keys and hash metadata, turning the map into a memory-efficient set.
> 2. **Explicit Fallible Side-Effects via `Result<(), E>`**: Rust intentionally omits `void`. When a function performs stateful side-effects (e.g. mutating `TelemetryPipeline`) without yielding a data return value on success, returning `Result<(), PipelineError>` enforces mandatory error checking at call sites via `?` or `match`. Returning `Ok(())` signals void completion while preserving algebraic type safety.
> 3. **Ownership and Mutability**: `process_frame` requires `&mut self` because inserting into `dedup_set` mutates internal map buckets. The string parameter `request_id` is borrowed as `&str` to avoid unnecessary heap allocations on error checks before ownership conversion (`to_string()`).
> 4. **Edge Cases**: Empty or whitespace-only payloads are caught before dedup insertion to avoid polluting the cache with invalid request entries. Reaching capacity triggers early exit without mutating the pipeline counter.
>
> 
---

### Exercise 2: Generic Event Dispatcher & Signal Handler Framework with Unit Type Payloads (`P = ()`)

**Scenario**:
In asynchronous event-driven system architecture, message brokers handle both data-heavy message payloads (such as `Vec<u8>`) and zero-sized pulse or tick signals (`P = ()`). By leveraging Rust's generic trait default type parameters (`pub trait EventHandler<P = ()>`), signal handlers require zero runtime payload memory (`size_of::<()>() == 0`), while providing a uniform interface returning `Result<(), DispatchError>` for side-effect dispatching.

**Task Requirements**:
1. Define a `DispatchError` enum with variants `HandlerOffline`, `RateLimited`, and `ExecutionFailed(String)`. Derive `Debug`, `Clone`, `PartialEq`, `Eq`.
2. Define a generic trait `EventHandler<P = ()>` with `fn handle(&mut self, payload: P) -> Result<(), DispatchError>`.
3. Implement `SystemPulseHandler` implementing `EventHandler<()>`:
   - Stores `pulses_received: u64`, `max_pulses: u64`, and `is_online: bool`.
   - `handle(&mut self, _payload: ()) -> Result<(), DispatchError>`:
     - Returns `Err(DispatchError::HandlerOffline)` if `!is_online`.
     - Returns `Err(DispatchError::RateLimited)` if `pulses_received >= max_pulses`.
     - Increments `pulses_received` by 1 and returns `Ok(())`.
4. Implement `TelemetryBatchHandler` implementing `EventHandler<Vec<u8>>`:
   - Stores `bytes_processed: usize` and `is_online: bool`.
   - `handle(&mut self, payload: Vec<u8>) -> Result<(), DispatchError>`:
     - Returns `Err(DispatchError::HandlerOffline)` if `!is_online`.
     - Returns `Err(DispatchError::ExecutionFailed("Empty payload".to_string()))` if `payload.is_empty()`.
     - Adds `payload.len()` to `bytes_processed` and returns `Ok(())`.
5. Include unit tests asserting trait execution, size of unit type, offline handling, rate limits, and matching enum errors.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub enum DispatchError {
>     HandlerOffline,
>     RateLimited,
>     ExecutionFailed(String),
> }
>
> pub trait EventHandler<P = ()> {
>     fn handle(&mut self, payload: P) -> Result<(), DispatchError>;
> }
>
> pub struct SystemPulseHandler {
>     pulses_received: u64,
>     max_pulses: u64,
>     is_online: bool,
> }
>
> impl SystemPulseHandler {
>     pub fn new(max_pulses: u64, is_online: bool) -> Self {
>         Self {
>             pulses_received: 0,
>             max_pulses,
>             is_online,
>         }
>     }
>
>     pub fn pulses_received(&self) -> u64 {
>         self.pulses_received
>     }
> }
>
> impl EventHandler<()> for SystemPulseHandler {
>     fn handle(&mut self, _payload: ()) -> Result<(), DispatchError> {
>         if !self.is_online {
>             return Err(DispatchError::HandlerOffline);
>         }
>         if self.pulses_received >= self.max_pulses {
>             return Err(DispatchError::RateLimited);
>         }
>         self.pulses_received += 1;
>         Ok(())
>     }
> }
>
> pub struct TelemetryBatchHandler {
>     bytes_processed: usize,
>     is_online: bool,
> }
>
> impl TelemetryBatchHandler {
>     pub fn new(is_online: bool) -> Self {
>         Self {
>             bytes_processed: 0,
>             is_online,
>         }
>     }
>
>     pub fn bytes_processed(&self) -> usize {
>         self.bytes_processed
>     }
> }
>
> impl EventHandler<Vec<u8>> for TelemetryBatchHandler {
>     fn handle(&mut self, payload: Vec<u8>) -> Result<(), DispatchError> {
>         if !self.is_online {
>             return Err(DispatchError::HandlerOffline);
>         }
>         if payload.is_empty() {
>             return Err(DispatchError::ExecutionFailed(
>                 "Empty payload".to_string(),
>             ));
>         }
>         self.bytes_processed += payload.len();
>         Ok(())
>     }
> }
>
> #[cfg(test)]
> mod tests {
>     use super::*;
>
>     #[test]
>     fn test_pulse_handler_unit_payload() {
>         let mut pulse_handler = SystemPulseHandler::new(2, true);
>         assert_eq!(std::mem::size_of::<()>(), 0);
>
>         assert!(pulse_handler.handle(()).is_ok());
>         assert_eq!(pulse_handler.pulses_received(), 1);
>         assert!(pulse_handler.handle(()).is_ok());
>         assert_eq!(pulse_handler.pulses_received(), 2);
>
>         let rate_err = pulse_handler.handle(());
>         assert_eq!(rate_err, Err(DispatchError::RateLimited));
>     }
>
>     #[test]
>     fn test_offline_pulse_handler() {
>         let mut pulse_handler = SystemPulseHandler::new(10, false);
>         let err = pulse_handler.handle(());
>         assert!(matches!(err, Err(DispatchError::HandlerOffline)));
>         assert_eq!(pulse_handler.pulses_received(), 0);
>     }
>
>     #[test]
>     fn test_batch_handler_data_payload() {
>         let mut batch_handler = TelemetryBatchHandler::new(true);
>         let result = batch_handler.handle(vec![1, 2, 3, 4, 5]);
>         assert!(result.is_ok());
>         assert_eq!(batch_handler.bytes_processed(), 5);
>
>         let empty_err = batch_handler.handle(vec![]);
>         assert!(matches!(empty_err, Err(DispatchError::ExecutionFailed(_))));
>         assert_ne!(batch_handler.bytes_processed(), 0);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Default Type Parameters and Generic Monomorphization**: Rust traits allow default generic types (`trait EventHandler<P = ()>`). When callers specify `EventHandler` without type arguments, Rust defaults to `P = ()`. Compiler monomorphization generates machine code tailored for `P = ()` where argument passing compiles down to a no-op (zero register or stack footprint).
> 2. **Signal Notifications vs. Data Payloads**: Passing `()` explicitly as a function argument (`handler.handle(())`) clearly communicates intent: the event carries no state, acting purely as an impulse trigger.
> 3. **Conformity with Trait Boundaries**: The unit type `()` satisfies standard marker traits including `Copy`, `Clone`, `Send`, `Sync`, `Sized`, `Eq`, and `Ord`. This enables seamless integration into generic containers and concurrency constructs.
> 4. **Edge Cases**: Offline handlers reject both unit signal pulses and byte payloads immediately. Pulse counters prevent overflow attacks by bounding allowed signals via `RateLimited`.
>
> 
---

### Exercise 3: Transactional Storage Engine Write-Ahead Log (WAL) Checkpoint Coordinator (`Result<(), StorageError>`)

**Scenario**:
In database engines (such as PostgreSQL or SQLite WAL modules), disk flushing operations (`fsync`, `WAL checkpoint`, `segment purge`) are side-effect operations returning `Result<(), StorageError>`. A checkpoint coordinator manages transaction log sequence numbers (LSNs), enforces read-only safety modes, flushes unwritten bytes, and coordinates checkpoint generation transitions without returning dummy success values.

**Task Requirements**:
1. Define a `StorageError` enum with variants `ReadOnlyMode`, `AlreadyCheckpointed`, `DiskFull`, and `IoError(String)`. Derive `Debug`, `Clone`, `PartialEq`, `Eq`.
2. Construct a `WalCoordinator` struct holding:
   - `current_lsn`: `u64`
   - `flushed_lsn`: `u64`
   - `last_checkpoint_lsn`: `u64`
   - `pending_bytes`: `usize`
   - `checkpoint_count`: `u64`
   - `is_read_only`: `bool`
3. Implement `WalCoordinator::new(is_read_only: bool) -> Self`.
4. Implement methods:
   - `append_log(&mut self, bytes_len: usize) -> Result<u64, StorageError>`:
     - Returns `Err(StorageError::ReadOnlyMode)` if `is_read_only`.
     - Increments `current_lsn` by 1, adds `bytes_len` to `pending_bytes`, and returns `Ok(current_lsn)`.
   - `flush_wal(&mut self) -> Result<(), StorageError>`:
     - Returns `Err(StorageError::ReadOnlyMode)` if `is_read_only`.
     - If `flushed_lsn == current_lsn`, returns `Ok(())` (idempotent no-op).
     - Sets `flushed_lsn = current_lsn`, resets `pending_bytes = 0`, and returns `Ok(())`.
   - `checkpoint(&mut self) -> Result<(), StorageError>`:
     - Returns `Err(StorageError::ReadOnlyMode)` if `is_read_only`.
     - If `flushed_lsn < current_lsn`, calls `self.flush_wal()?`.
     - If `flushed_lsn == last_checkpoint_lsn`, returns `Err(StorageError::AlreadyCheckpointed)`.
     - Sets `last_checkpoint_lsn = flushed_lsn`, increments `checkpoint_count` by 1, and returns `Ok(())`.
5. Include comprehensive unit tests demonstrating WAL operations, read-only mode safety, idempotent flushing, error matching, and memory alignment of `Result<(), StorageError>`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub enum StorageError {
>     ReadOnlyMode,
>     AlreadyCheckpointed,
>     DiskFull,
>     IoError(String),
> }
>
> pub struct WalCoordinator {
>     current_lsn: u64,
>     flushed_lsn: u64,
>     last_checkpoint_lsn: u64,
>     pending_bytes: usize,
>     checkpoint_count: u64,
>     is_read_only: bool,
> }
>
> impl WalCoordinator {
>     pub fn new(is_read_only: bool) -> Self {
>         Self {
>             current_lsn: 0,
>             flushed_lsn: 0,
>             last_checkpoint_lsn: 0,
>             pending_bytes: 0,
>             checkpoint_count: 0,
>             is_read_only,
>         }
>     }
>
>     pub fn append_log(&mut self, bytes_len: usize) -> Result<u64, StorageError> {
>         if self.is_read_only {
>             return Err(StorageError::ReadOnlyMode);
>         }
>         self.current_lsn += 1;
>         self.pending_bytes += bytes_len;
>         Ok(self.current_lsn)
>     }
>
>     pub fn flush_wal(&mut self) -> Result<(), StorageError> {
>         if self.is_read_only {
>             return Err(StorageError::ReadOnlyMode);
>         }
>         if self.flushed_lsn == self.current_lsn {
>             return Ok(());
>         }
>         self.flushed_lsn = self.current_lsn;
>         self.pending_bytes = 0;
>         Ok(())
>     }
>
>     pub fn checkpoint(&mut self) -> Result<(), StorageError> {
>         if self.is_read_only {
>             return Err(StorageError::ReadOnlyMode);
>         }
>         if self.flushed_lsn < self.current_lsn {
>             self.flush_wal()?;
>         }
>         if self.flushed_lsn == self.last_checkpoint_lsn {
>             return Err(StorageError::AlreadyCheckpointed);
>         }
>         self.last_checkpoint_lsn = self.flushed_lsn;
>         self.checkpoint_count += 1;
>         Ok(())
>     }
>
>     pub fn current_lsn(&self) -> u64 {
>         self.current_lsn
>     }
>
>     pub fn flushed_lsn(&self) -> u64 {
>         self.flushed_lsn
>     }
>
>     pub fn checkpoint_count(&self) -> u64 {
>         self.checkpoint_count
>     }
>
>     pub fn pending_bytes(&self) -> usize {
>         self.pending_bytes
>     }
> }
>
> #[cfg(test)]
> mod tests {
>     use super::*;
>
>     #[test]
>     fn test_storage_result_unit_memory_footprint() {
>         assert_eq!(std::mem::size_of::<()>(), 0);
>         assert!(std::mem::size_of::<Result<(), StorageError>>() > 0);
>     }
>
>     #[test]
>     fn test_append_and_flush_lifecycle() {
>         let mut wal = WalCoordinator::new(false);
>         let lsn1 = wal.append_log(128);
>         assert_eq!(lsn1, Ok(1));
>         assert_eq!(wal.pending_bytes(), 128);
>         assert_eq!(wal.flushed_lsn(), 0);
>
>         let flush_res = wal.flush_wal();
>         assert!(flush_res.is_ok());
>         assert_eq!(wal.flushed_lsn(), 1);
>         assert_eq!(wal.pending_bytes(), 0);
>
>         // Idempotent flush
>         assert!(wal.flush_wal().is_ok());
>     }
>
>     #[test]
>     fn test_checkpoint_lifecycle() {
>         let mut wal = WalCoordinator::new(false);
>         let _ = wal.append_log(256);
>
>         let ckpt_res = wal.checkpoint();
>         assert!(ckpt_res.is_ok());
>         assert_eq!(wal.checkpoint_count(), 1);
>         assert_eq!(wal.flushed_lsn(), 1);
>
>         // Duplicate checkpoint without new LSN
>         let dup_ckpt = wal.checkpoint();
>         assert_eq!(dup_ckpt, Err(StorageError::AlreadyCheckpointed));
>         assert_ne!(wal.checkpoint_count(), 2);
>     }
>
>     #[test]
>     fn test_read_only_protection() {
>         let mut ro_wal = WalCoordinator::new(true);
>         let append_err = ro_wal.append_log(64);
>         assert!(matches!(append_err, Err(StorageError::ReadOnlyMode)));
>
>         let flush_err = ro_wal.flush_wal();
>         assert_eq!(flush_err, Err(StorageError::ReadOnlyMode));
>
>         let ckpt_err = ro_wal.checkpoint();
>         assert_eq!(ckpt_err, Err(StorageError::ReadOnlyMode));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Discriminant Optimization in `Result<(), E>`**: Because `()` occupies 0 bytes, `Result<(), StorageError>` stores only the discriminant and the payload of `StorageError`. The compiler does not allocate space for the success value, optimizing memory layouts for fallible side-effect functions.
> 2. **Cascading Side-Effects with `?` Operator**: In `checkpoint()`, calling `self.flush_wal()?` leverages early return propagation. If `flush_wal()` returns `Err(StorageError::ReadOnlyMode)`, execution halts immediately and bubbles up the error, preventing invalid checkpoint creation.
> 3. **Idempotence of `Ok(())`**: Both `flush_wal` and `checkpoint` exhibit idempotent behavior. If `flushed_lsn == current_lsn`, `flush_wal()` returns `Ok(())` without executing redundant I/O syscalls. If no new LSNs were logged since the last checkpoint, `checkpoint()` safely rejects the request with `Err(StorageError::AlreadyCheckpointed)`.
> 4. **Edge Cases**: Read-only nodes (e.g. secondary read-replicas) reject append, flush, and checkpoint operations immediately with `StorageError::ReadOnlyMode`.
>
> 
---

## 6. Related Terms


- [Unit Struct](../level_02/unit_struct.md) — A custom struct you define that behaves exactly like the built-in Unit Type (taking up 0 bytes).
- [Statements](statements.md) — The fundamental building blocks that always evaluate to `()`.
- [`ZSTs` (Zero-Sized Types)](../level_11/zsts.md) — Related concept: `ZSTs` (Zero-Sized Types).
- [Never Type (`!`)](../level_11/never_type.md) — The ! never type.

---

## 7. Key Takeaways

- Rust does not have a `void` keyword.
- Functions that don't return data implicitly return the **Unit Type `()`**.
- It is a concrete type that takes up exactly **0 bytes** of memory.
- Adding a semicolon `;` to the end of an expression suppresses its value and evaluates to `()`. This is the #1 cause of "mismatched types: expected X, found `()`" compiler errors.
