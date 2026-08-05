# Ownership

> **Level 3 — Ownership & Borrowing**
> Every value has exactly one owner; when the owner goes out of scope, the value is dropped.

---

## 1. Prerequisites


- [Variable](../level_01/variable.md) — Variables are the "owners" of data.
- [Expressions](../level_01/expressions.md) — Curly braces `{}` define scopes, which are critical for determining when an owner dies.
- [String vs &str](../level_01/string_vs_&str.md) — `String` data lives on the Heap, making it the primary subject of Ownership rules.

---

## 2. Term Category

**Rust-specific (the core innovation)**: Ownership is Rust’s most unique and famous feature. It is the revolutionary system that allows Rust to guarantee perfect memory safety *without* relying on a slow, background Garbage Collector.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Historically, programming languages manage memory in one of two ways:
1. **Manual Management (C, C++)**: You manually ask the OS for memory (`malloc`), and you manually give it back (`free`). This is blazing fast but incredibly dangerous. If you forget to `free`, your program leaks memory until it crashes. If you `free` the same memory twice, hackers can exploit your program.
2. **Garbage Collection (Java, Python, JS)**: A background program (the Garbage Collector) constantly scans your program while it runs, looking for memory you aren't using anymore to clean it up. This is very safe, but it makes the language slower and causes unpredictable "pauses" during execution.

Rust chose a third, entirely new path: **Ownership**. The compiler enforces a strict set of rules at compile-time. It tracks exactly which variable "owns" a piece of memory. The exact moment that variable's curly brace `{}` ends, the compiler *automatically inserts the `free` code for you*. 

You get the blazing speed of C (no Garbage Collector) with the perfect safety of Java (no memory leaks).

### (2) Reality Metaphor

Imagine borrowing a book from a library.

- **In C++**: You take the book. The librarian never tracks it. You must remember to walk back and return it, or the book is lost forever.
- **In Java**: A librarian literally follows you around town, constantly watching to see if you are still reading the book. If you put it down, they grab it and take it back to the library.
- **In Rust**: The library has three strict rules:
  1. Only **one person** (the Owner) can hold the book at a time.
  2. You can only read the book while you are in this specific room (your Scope).
  3. The exact second you walk out the door (out of scope), an automatic trapdoor opens and drops the book into the return bin.

### (3) Rust Code Examples

#### Short Snippet (The Drop)
```rust
fn main() {
    { // Scope A begins
        let name = String::from("Alice"); // `name` is the OWNER of the string "Alice".
        
        println!("{}", name); 
        
    } // Scope A ends. `name` goes out of scope.
      // Rust automatically calls `drop(name)` here. The memory is instantly freed!
      
    // println!("{}", name); // ERROR: `name` no longer exists!
}
```

#### Fuller Example (The 3 Rules in Action)
The 3 Rules of Ownership are:
1. Each value in Rust has a variable that’s called its **owner**.
2. There can only be **one owner at a time**.
3. When the owner goes out of scope, the value will be dropped.

```rust
fn main() {
    let s1 = String::from("Hello"); // s1 is the owner
    
    // Because there can only be ONE owner at a time...
    // Passing `s1` to `s2` TRANSFERS ownership to `s2`. 
    let s2 = s1; 
    
    // s1 is now completely empty and invalid. It no longer owns anything.
    // println!("{}", s1); // COMPILER ERROR: "borrow of moved value: `s1`"
    
    println!("s2 is the new owner: {}", s2);
} // Scope ends. Only `s2` is dropped, because `s1` already lost its ownership.
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Ownership Scoping and Lifecycle Rules

**The mistake:** Assuming Ownership instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("ownership_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("ownership_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Ownership State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Ownership through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Ownership Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Ownership instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Zero-Copy Network Telemetry Pipeline with Dead-Letter Queue Ownership Routing

**Problem Description**:
In high-throughput network service architectures, passing large data frames between processing stages by copying byte vectors incurs substantial allocation overhead and memory bandwidth degradation. To achieve zero-copy throughput, frames must be transferred by value (moving ownership) through the pipeline stages.

Design a telemetry pipeline where:
1. `NetworkFrame` owns a `FrameHeader` (stream ID, sequence number, expected 8-bit checksum) and a heap-allocated `payload: Vec<u8>`.
2. `FrameIngest::process(frame: NetworkFrame)` takes ownership of the frame, computes an 8-bit XOR checksum across the payload bytes, and evaluates it against `expected_checksum`.
3. If valid, ownership is returned inside `IngestResult::Valid(NetworkFrame)`. If corrupted, ownership is transferred to `IngestResult::Corrupted(NetworkFrame)`.
4. `DeadLetterQueue` acts as an owner of rejected frames, storing them in internal storage for post-mortem auditing.
5. `FrameTransformer::transform_to_uppercase(frame: NetworkFrame)` takes ownership of valid frames, mutates the payload ASCII bytes to uppercase, recalculates the header checksum, and returns the modified frame.

Write a complete compilable module with unit tests in `#[cfg(test)] mod tests` verifying that vector payload pointers (`as_ptr()`) remain identical across all ownership transfers, confirming zero heap allocations or memory copies. Ensure unit tests contain explicit assertions (`assert_eq!`, `assert!`, `assert_ne!`, `matches!`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq)]
> pub struct FrameHeader {
>     pub stream_id: u32,
>     pub sequence: u64,
>     pub expected_checksum: u8,
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct NetworkFrame {
>     pub header: FrameHeader,
>     pub payload: Vec<u8>,
> }
> 
> impl NetworkFrame {
>     pub fn new(stream_id: u32, sequence: u64, payload: Vec<u8>) -> Self {
>         let checksum = payload.iter().fold(0u8, |acc, &b| acc ^ b);
>         Self {
>             header: FrameHeader {
>                 stream_id,
>                 sequence,
>                 expected_checksum: checksum,
>             },
>             payload,
>         }
>     }
> 
>     pub fn compute_actual_checksum(&self) -> u8 {
>         self.payload.iter().fold(0u8, |acc, &b| acc ^ b)
>     }
> }
> 
> #[derive(Debug)]
> pub enum IngestResult {
>     Valid(NetworkFrame),
>     Corrupted(NetworkFrame),
> }
> 
> pub struct FrameIngest;
> 
> impl FrameIngest {
>     pub fn process(frame: NetworkFrame) -> IngestResult {
>         let actual = frame.compute_actual_checksum();
>         if actual == frame.header.expected_checksum {
>             IngestResult::Valid(frame)
>         } else {
>             IngestResult::Corrupted(frame)
>         }
>     }
> }
> 
> pub struct DeadLetterQueue {
>     rejected_frames: Vec<NetworkFrame>,
> }
> 
> impl DeadLetterQueue {
>     pub fn new() -> Self {
>         Self { rejected_frames: Vec::new() }
>     }
> 
>     pub fn push(&mut self, frame: NetworkFrame) {
>         self.rejected_frames.push(frame);
>     }
> 
>     pub fn len(&self) -> usize {
>         self.rejected_frames.len()
>     }
> 
>     pub fn is_empty(&self) -> bool {
>         self.rejected_frames.is_empty()
>     }
> 
>     pub fn get_frame(&self, index: usize) -> Option<&NetworkFrame> {
>         self.rejected_frames.get(index)
>     }
> }
> 
> pub struct FrameTransformer;
> 
> impl FrameTransformer {
>     pub fn transform_to_uppercase(mut frame: NetworkFrame) -> NetworkFrame {
>         for byte in frame.payload.iter_mut() {
>             byte.make_ascii_uppercase();
>         }
>         frame.header.expected_checksum = frame.compute_actual_checksum();
>         frame
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_valid_frame_pipeline_ownership_transfer() {
>         let frame = NetworkFrame::new(101, 1, b"hello rust".to_vec());
>         let initial_ptr = frame.payload.as_ptr();
> 
>         match FrameIngest::process(frame) {
>             IngestResult::Valid(valid_frame) => {
>                 assert_eq!(valid_frame.payload.as_ptr(), initial_ptr);
>                 let transformed = FrameTransformer::transform_to_uppercase(valid_frame);
>                 assert_eq!(transformed.payload, b"HELLO RUST");
>                 assert_eq!(transformed.payload.as_ptr(), initial_ptr);
>                 assert_eq!(transformed.header.stream_id, 101);
>             }
>             IngestResult::Corrupted(_) => panic!("Frame should be valid"),
>         }
>     }
> 
>     #[test]
>     fn test_corrupted_frame_dead_letter_routing() {
>         let mut corrupted_frame = NetworkFrame::new(202, 2, b"sensor payload".to_vec());
>         corrupted_frame.payload[0] = b'X'; // Corrupt payload byte directly
>         let payload_ptr = corrupted_frame.payload.as_ptr();
> 
>         let mut dlq = DeadLetterQueue::new();
> 
>         match FrameIngest::process(corrupted_frame) {
>             IngestResult::Valid(_) => panic!("Frame should be detected as corrupted"),
>             IngestResult::Corrupted(bad_frame) => {
>                 assert_eq!(bad_frame.payload.as_ptr(), payload_ptr);
>                 dlq.push(bad_frame);
>             }
>         }
> 
>         assert_eq!(dlq.len(), 1);
>         let retrieved = dlq.get_frame(0).unwrap();
>         assert_eq!(retrieved.header.stream_id, 202);
>         assert_ne!(retrieved.compute_actual_checksum(), retrieved.header.expected_checksum);
>         assert!(matches!(FrameIngest::process(NetworkFrame::new(1, 1, vec![])), IngestResult::Valid(_)));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
>
>
> 1. **Step-by-Step Execution Flow**:
>    - `NetworkFrame::new` initializes a `NetworkFrame` on the caller's stack frame. The payload byte vector allocates heap memory, storing a 24-byte header on the stack (pointer, capacity, length).
>    - Calling `FrameIngest::process(frame)` moves the entire stack struct `frame` into the function. No heap memory is copied; only the 24-byte metadata header and frame fields are copied on the stack.
>    - Upon checksum validation, `frame` ownership is wrapped inside an `IngestResult` enum variant (`Valid` or `Corrupted`) and moved back to the caller.
>    - If valid, `FrameTransformer::transform_to_uppercase(valid_frame)` consumes ownership, mutates the heap bytes in-place via an exclusive `&mut`, recalculates the checksum, and transfers the modified owner back.
>    - If corrupted, ownership transfers into `dlq.push(bad_frame)`, moving the frame into `DeadLetterQueue`'s inner `Vec<NetworkFrame>`.
>
> 2. **Language Invariants & Ownership Implications**:
>    - **Single-Ownership Rule**: At any point in execution, a `NetworkFrame` has exactly one owner variable (e.g., `frame` -> `IngestResult` -> `valid_frame` -> `transformed`). Compile-time move semantics prevent double-processing or simultaneous mutation.
>    - **Move Semantics vs Deep Copy**: Standard assignment or parameter passing for non-`Copy` types performs a fast bitwise copy of stack descriptors (`memcpy` of the pointer/cap/len struct) while invalidating the source variable.
>
> 3. **Memory Layout**:
>    - **Stack**: `NetworkFrame` descriptor containing `stream_id` (4 bytes), padding (4 bytes), `sequence` (8 bytes), `expected_checksum` (1 byte), padding (7 bytes), plus `Vec<u8>` metadata pointer (8 bytes), capacity (8 bytes), length (8 bytes).
>    - **Heap**: The payload bytes `b"hello rust"`. In the unit test, `assert_eq!(valid_frame.payload.as_ptr(), initial_ptr)` proves that the heap address remains identical throughout the pipeline.
>
> 4. **Edge Cases**:
>    - If a corrupted frame is dropped without being pushed to the `DeadLetterQueue`, Rust automatically invokes `Drop` for `NetworkFrame`, which deallocates the underlying `Vec<u8>` heap memory, avoiding memory leaks.

---

### Exercise 2: Fixed-Capacity Memory Slot Pool with RAII Release Guard

**Problem Description**:
In low-latency systems (e.g. game engines, embedded drivers, packet processing), dynamic heap allocations during runtime loops introduce non-deterministic allocator delays and memory fragmentation. Fixed-capacity slot pools pre-allocate memory chunks and issue exclusive ownership handles (`BufferSlotHandle`) to callers.

Design a memory pool system where:
1. `BufferPool` manages a fixed set of pre-allocated buffers (`Vec<Vec<u8>>`) and tracks their allocation status (`SlotState::Free` vs `SlotState::Occupied`) using shared state (`Rc<RefCell<InnerPool>>`).
2. Calling `pool.acquire()` searches for an available free slot, marks it occupied, and returns `Some(BufferSlotHandle)` owning the slot index. If all slots are full, it returns `None`.
3. `BufferSlotHandle` permits callers to write bytes into the slot (`write_bytes`) and read stored payload (`read_bytes`).
4. Calling `handle.release()` explicitly consumes ownership of `self`, marks the pool slot state back to `SlotState::Free`, returns the extracted payload byte vector, and disables the fallback destructor.
5. If `BufferSlotHandle` goes out of scope *without* calling `release()`, its `Drop` implementation automatically reclaims the slot in the pool, ensuring zero resource leaks.

Write a complete compilable module with unit tests in `#[cfg(test)] mod tests` verifying explicit release behavior, RAII automatic slot reclamation upon drop, and slot reuse, using explicit assertions (`assert_eq!`, `assert!`, `assert_ne!`, `matches!`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::cell::RefCell;
> use std::rc::Rc;
> 
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub enum SlotState {
>     Free,
>     Occupied,
> }
> 
> pub struct InnerPool {
>     slots: Vec<Vec<u8>>,
>     slot_states: Vec<SlotState>,
>     capacity: usize,
> }
> 
> #[derive(Clone)]
> pub struct BufferPool {
>     inner: Rc<RefCell<InnerPool>>,
> }
> 
> impl BufferPool {
>     pub fn new(capacity: usize, slot_size: usize) -> Self {
>         let mut slots = Vec::with_capacity(capacity);
>         let mut slot_states = Vec::with_capacity(capacity);
>         for _ in 0..capacity {
>             slots.push(vec![0u8; slot_size]);
>             slot_states.push(SlotState::Free);
>         }
> 
>         Self {
>             inner: Rc::new(RefCell::new(InnerPool {
>                 slots,
>                 slot_states,
>                 capacity,
>             })),
>         }
>     }
> 
>     pub fn acquire(&self) -> Option<BufferSlotHandle> {
>         let mut pool = self.inner.borrow_mut();
>         for i in 0..pool.capacity {
>             if pool.slot_states[i] == SlotState::Free {
>                 pool.slot_states[i] = SlotState::Occupied;
>                 return Some(BufferSlotHandle {
>                     slot_index: i,
>                     pool: self.clone(),
>                     released: false,
>                 });
>             }
>         }
>         None
>     }
> 
>     pub fn available_slots(&self) -> usize {
>         let pool = self.inner.borrow();
>         pool.slot_states
>             .iter()
>             .filter(|&&s| s == SlotState::Free)
>             .count()
>     }
> }
> 
> pub struct BufferSlotHandle {
>     slot_index: usize,
>     pool: BufferPool,
>     released: bool,
> }
> 
> impl BufferSlotHandle {
>     pub fn slot_index(&self) -> usize {
>         self.slot_index
>     }
> 
>     pub fn write_bytes(&mut self, data: &[u8]) -> usize {
>         let mut pool = self.pool.inner.borrow_mut();
>         let slot = &mut pool.slots[self.slot_index];
>         let bytes_to_copy = data.len().min(slot.len());
>         slot[..bytes_to_copy].copy_from_slice(&data[..bytes_to_copy]);
>         bytes_to_copy
>     }
> 
>     pub fn read_bytes(&self) -> Vec<u8> {
>         let pool = self.pool.inner.borrow();
>         pool.slots[self.slot_index].clone()
>     }
> 
>     pub fn release(mut self) -> Vec<u8> {
>         let payload = self.read_bytes();
>         let mut pool = self.pool.inner.borrow_mut();
>         pool.slot_states[self.slot_index] = SlotState::Free;
>         self.released = true;
>         payload
>     }
> }
> 
> impl Drop for BufferSlotHandle {
>     fn drop(&mut self) {
>         if !self.released {
>             let mut pool = self.pool.inner.borrow_mut();
>             pool.slot_states[self.slot_index] = SlotState::Free;
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_pool_acquisition_and_explicit_release() {
>         let pool = BufferPool::new(2, 64);
>         assert_eq!(pool.available_slots(), 2);
> 
>         let mut handle1 = pool.acquire().expect("Should acquire slot 0");
>         assert_eq!(handle1.slot_index(), 0);
>         assert_eq!(pool.available_slots(), 1);
> 
>         let written = handle1.write_bytes(b"pool payload data");
>         assert_eq!(written, 17);
> 
>         let payload = handle1.release();
>         assert_eq!(&payload[..17], b"pool payload data");
>         assert_eq!(pool.available_slots(), 2);
>     }
> 
>     #[test]
>     fn test_pool_raii_automatic_drop_reclamation() {
>         let pool = BufferPool::new(1, 32);
>         assert_eq!(pool.available_slots(), 1);
> 
>         {
>             let _handle = pool.acquire().unwrap();
>             assert_eq!(pool.available_slots(), 0);
>         } // _handle goes out of scope here; Drop frees the slot
> 
>         assert_eq!(pool.available_slots(), 1);
>         let second_acq = pool.acquire();
>         assert!(matches!(second_acq, Some(_)));
>         assert_ne!(pool.available_slots(), 1);
>     }
> }
> ```
>
> #### Technical Explanation
>
>
>
>
> 1. **Step-by-Step Execution Flow**:
>    - `BufferPool::new` constructs an `InnerPool` wrapped in `Rc<RefCell<...>>`, enabling shared ownership of the pool manager across multiple handles while allowing dynamically checked interior mutability.
>    - `pool.acquire()` borrows the inner pool mutably, locates the first `SlotState::Free`, transitions it to `Occupied`, and constructs an owned `BufferSlotHandle` holding `slot_index`.
>    - `handle.release(self)` takes `self` by value, moving ownership of the handle into the function. It reads the slot data, sets `slot_states[self.slot_index] = SlotState::Free`, sets `self.released = true`, and returns the owned payload.
>    - If `handle` falls out of scope without calling `release()`, Rust automatically triggers `Drop::drop(&mut self)`. The flag check `if !self.released` resets the slot state in the pool, preventing slot leaks.
>
> 2. **Language Invariants & Ownership Implications**:
>    - **Consuming Ownership via `release(self)`**: By taking `self` by value, `release` guarantees that the caller cannot access `handle` again after releasing the slot back to the pool. Any subsequent attempt to use `handle` generates compiler error `E0382` (use of moved value).
>    - **RAII Destructor Safety Net**: Implementing `Drop` ensures resource safety even when panic unwind occurs or early returns exit early before explicit release calls.
>
> 3. **Memory Layout**:
>    - `BufferPool` stack layout is a single 8-byte `Rc` pointer pointing to heap data containing `InnerPool`.
>    - `InnerPool` contains contiguous `Vec` arrays for slots and slot states allocated on the heap.
>    - `BufferSlotHandle` stack layout consists of `slot_index` (8 bytes), cloned `BufferPool` (8 bytes), and `released` boolean (1 byte + padding), total 24 bytes on 64-bit architectures.
>
> 4. **Edge Cases**:
>    - Re-acquiring slots when `capacity` is exhausted safely yields `None`.
>    - Setting `released = true` in `release()` prevents double-free / double-release logic when `drop()` runs at the end of `release()`'s scope.

---

### Exercise 3: Consuming Artifact Transformation Pipeline with DAG Node Execution

**Problem Description**:
In build orchestrators (such as Cargo or Bazel) and data processing DAGs, pipeline tasks process build artifacts through a sequence of steps. To prevent stale state access and guarantee data isolation, execution steps take *exclusive consuming ownership* of intermediate artifacts, mutate or replace their payload data, and yield a new owned output artifact.

Design a task execution pipeline where:
1. `TaskArtifact` owns a string label (`label: String`), payload byte vector (`payload: Vec<u8>`), and a step execution counter (`metadata_count: usize`).
2. `PipelineStep` is an enum with step transformations:
   - `TrimWhitespace`: Strips whitespace bytes (`b' '`, `b'\t'`, `b'\n'`) from payload, appends `->trimmed` to label, and increments `metadata_count`.
   - `CompressRle`: Performs run-length encoding (RLE) on payload bytes, appends `->compressed` to label, and increments `metadata_count`.
   - `AddHeader`: Prepends `b"HEADER:"` to payload, appends `->headered` to label, and increments `metadata_count`.
3. `TaskRunner` holds an ordered list of `PipelineStep` instances. Calling `runner.run(initial_artifact)` moves the initial artifact through each step via `step.execute(artifact)`, returning `Result<TaskArtifact, PipelineError>`.
4. If an artifact payload is empty, `step.execute` returns `Err(PipelineError::EmptyPayload)`.

Write a complete compilable module with unit tests in `#[cfg(test)] mod tests` verifying ownership consumption during execution, step label chaining, metadata counting, and error handling using explicit assertions (`assert_eq!`, `assert!`, `assert_ne!`, `matches!`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq)]
> pub struct TaskArtifact {
>     pub label: String,
>     pub payload: Vec<u8>,
>     pub metadata_count: usize,
> }
> 
> impl TaskArtifact {
>     pub fn new(label: impl Into<String>, payload: Vec<u8>) -> Self {
>         Self {
>             label: label.into(),
>             payload,
>             metadata_count: 0,
>         }
>     }
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum PipelineError {
>     EmptyPayload,
> }
> 
> #[derive(Debug, Clone, Copy)]
> pub enum PipelineStep {
>     TrimWhitespace,
>     CompressRle,
>     AddHeader,
> }
> 
> impl PipelineStep {
>     pub fn execute(&self, mut artifact: TaskArtifact) -> Result<TaskArtifact, PipelineError> {
>         if artifact.payload.is_empty() {
>             return Err(PipelineError::EmptyPayload);
>         }
> 
>         match self {
>             PipelineStep::TrimWhitespace => {
>                 let trimmed: Vec<u8> = artifact
>                     .payload
>                     .into_iter()
>                     .filter(|&b| b != b' ' && b != b'\t' && b != b'\n')
>                     .collect();
>                 artifact.payload = trimmed;
>                 artifact.label.push_str("->trimmed");
>                 artifact.metadata_count += 1;
>                 Ok(artifact)
>             }
>             PipelineStep::CompressRle => {
>                 let mut compressed = Vec::new();
>                 if let Some(&first) = artifact.payload.first() {
>                     let mut current = first;
>                     let mut count = 1u8;
>                     for &b in artifact.payload.iter().skip(1) {
>                         if b == current && count < 255 {
>                             count += 1;
>                         } else {
>                             compressed.push(count);
>                             compressed.push(current);
>                             current = b;
>                             count = 1;
>                         }
>                     }
>                     compressed.push(count);
>                     compressed.push(current);
>                 }
>                 artifact.payload = compressed;
>                 artifact.label.push_str("->compressed");
>                 artifact.metadata_count += 1;
>                 Ok(artifact)
>             }
>             PipelineStep::AddHeader => {
>                 let mut new_payload = b"HEADER:".to_vec();
>                 new_payload.extend(artifact.payload);
>                 artifact.payload = new_payload;
>                 artifact.label.push_str("->headered");
>                 artifact.metadata_count += 1;
>                 Ok(artifact)
>             }
>         }
>     }
> }
> 
> pub struct TaskRunner {
>     steps: Vec<PipelineStep>,
> }
> 
> impl TaskRunner {
>     pub fn new(steps: Vec<PipelineStep>) -> Self {
>         Self { steps }
>     }
> 
>     pub fn run(&self, initial: TaskArtifact) -> Result<TaskArtifact, PipelineError> {
>         let mut current_artifact = initial;
>         for step in &self.steps {
>             current_artifact = step.execute(current_artifact)?;
>         }
>         Ok(current_artifact)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_task_runner_ownership_consumption_pipeline() {
>         let initial = TaskArtifact::new("raw_data", b" A AA  B BB ".to_vec());
>         let runner = TaskRunner::new(vec![
>             PipelineStep::TrimWhitespace,
>             PipelineStep::CompressRle,
>             PipelineStep::AddHeader,
>         ]);
> 
>         let result = runner.run(initial);
>         assert!(matches!(result, Ok(_)));
> 
>         let final_artifact = result.unwrap();
>         assert_eq!(final_artifact.label, "raw_data->trimmed->compressed->headered");
>         assert_eq!(final_artifact.metadata_count, 3);
>         assert_ne!(final_artifact.payload, b" A AA  B BB ");
>         assert!(final_artifact.payload.starts_with(b"HEADER:"));
>     }
> 
>     #[test]
>     fn test_empty_payload_error_handling() {
>         let empty_artifact = TaskArtifact::new("empty", vec![]);
>         let runner = TaskRunner::new(vec![PipelineStep::TrimWhitespace]);
> 
>         let result = runner.run(empty_artifact);
>         assert_eq!(result, Err(PipelineError::EmptyPayload));
>         assert!(matches!(result, Err(PipelineError::EmptyPayload)));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
>
>
> 1. **Step-by-Step Execution Flow**:
>    - `TaskArtifact::new` allocates heap buffers for the `label` string and `payload` vector.
>    - `runner.run(initial)` takes ownership of `initial`. In each iteration of the loop over `self.steps`, `step.execute(current_artifact)` consumes ownership of `current_artifact`.
>    - Inside `PipelineStep::execute(mut artifact: TaskArtifact)`:
>      - `TrimWhitespace` calls `artifact.payload.into_iter()`, consuming ownership of the old vector, filtering bytes, collecting into a newly allocated vector, and re-assigning `artifact.payload`.
>      - The modified `artifact` is returned wrapped in `Ok(artifact)`.
>    - The loop replaces `current_artifact` with the returned artifact, passing ownership to the next step.
>
> 2. **Language Invariants & Ownership Implications**:
>    - **Value-Consuming Transformations**: By taking `artifact: TaskArtifact` by value rather than `&mut TaskArtifact`, steps explicitly declare total ownership transfer. The caller cannot hold references to pre-transformed states.
>    - **Move Semantics in Collections**: In `TrimWhitespace`, `artifact.payload.into_iter()` moves ownership of the vector buffer out of `artifact.payload`, freeing the old heap buffer once iteration completes.
>
> 3. **Memory Layout**:
>    - `TaskArtifact` stack representation: `String` descriptor (24 bytes: ptr, cap, len), `Vec<u8>` descriptor (24 bytes: ptr, cap, len), `metadata_count` (8 bytes). Total stack size: 56 bytes.
>    - Heap memory contains the string characters and raw payload bytes.
>
> 4. **Edge Cases**:
>    - If any step fails (e.g. returning `Err(PipelineError::EmptyPayload)`), the `?` operator early-returns the error. Rust automatically drops `current_artifact`, freeing its string and payload vectors immediately without memory leaks.

---

## 6. Related Terms


- [Move Semantics](move_semantics.md) — The technical term for transferring ownership from one variable to another (e.g., `let s2 = s1;`).
- [`Copy` Trait](copy_trait.md) — The exception to Ownership rules for simple stack data.
- [Borrowing (`&`)](borrowing.md) — How to let a function look at data *without* taking ownership of it.
- [String vs &str](../level_01/string_vs_&str.md) — Related concept: String vs &str.
- [Entry API (`.entry(k).or_insert(...)`)](../level_02/entry_api.md) — Related concept: Entry API (`.entry(k).or_insert(...)`).
- [`Drop` Trait](drop_trait.md) — Related concept: `Drop` Trait.
- [`Rc<T>`](rc_t.md) — Related concept: `Rc<T>`.
- [`std::mem` Utilities (`replace`, `take`, `swap`, `drop`)](std_mem_utilities.md) — Related concept: `std::mem` Utilities (`replace`, `take`, `swap`, `drop`).
- [Memory Leaks & Reference Cycles](../level_11/memory_leaks.md) — Related concept: Memory Leaks & Reference Cycles.
- [Stack vs Heap](../level_15/stack_vs_heap.md) — Related concept: Stack vs Heap.

---

## 7. Key Takeaways

- **Ownership** replaces Garbage Collection, providing memory safety with zero runtime overhead.
- There are **3 Rules of Ownership**:
  1. Each value in Rust has a variable that’s called its **owner**.
  2. There can only be **one owner** at a time.
  3. When the owner goes **out of scope**, the value will be dropped (cleaned up).
- Because there can only be one owner, assigning a `String` to a new variable transfers ownership and destroys the old variable.
