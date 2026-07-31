# `Clone` Trait

> **Level 3 — Ownership & Borrowing**
> Explicit deep duplication via `.clone()`. Required for types that don't implement `Copy`.

---

## 1. Prerequisites

- [Move Semantics](../level_03/move_semantics.md) — The default behavior of assignment that `Clone` allows you to bypass.
- [`Copy` Trait](../level_03/copy_trait.md) — The implicit version of copying for small, simple Stack data.
- [Traits](../level_04/trait.md) — (Future reference) The system used to define shared behaviors across types.

---

## 2. Term Category

**Rust-specific**: Other languages often hide whether variable assignment is performing a cheap pointer copy or an expensive full data copy. Rust forces expensive "Deep Copies" to be incredibly explicit via the `.clone()` method.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Sometimes you genuinely need a full, independent duplicate of a massive Heap data structure (like a `String` or a `Vec`). 

Rust's default behavior is to **Move** the data, invalidating the original variable. Why doesn't it just automatically copy the data? Because making a Deep Copy is **extremely expensive**. The computer has to ask the Operating System for new Heap memory and then copy every single byte of data over.

Because Rust is a systems programming language focused on performance, it refuses to do expensive things secretly. If you want an expensive Deep Copy, you must explicitly type `.clone()`. When a Rust programmer reviews code and sees `.clone()`, they instantly know: *"Ah, a heavy memory allocation is happening here."*

### (2) Reality Metaphor

Imagine you own a famous, original oil painting (Heap data). 

- If you hand it to a friend, you no longer have it. (**Move Semantics**)
- What if you want to keep your original *and* give your friend an identical one? You must hire a professional artist to spend a week painting a perfect replica. This is incredibly expensive and slow, so it never happens by accident. You must explicitly issue the order to **`.clone()`** it.

*(Contrast this with the `Copy` trait, which is like quickly scribbling a duplicate of a 2-line post-it note).*

### (3) Rust Code Examples

#### Short Snippet (The Explicit Clone)
```rust
fn main() {
    let s1 = String::from("Hello");
    
    // We explicitly ask for a Deep Copy. 
    // New memory is allocated on the Heap!
    let s2 = s1.clone(); 
    
    // Because we cloned it, s1 was never moved. Both are perfectly valid!
    println!("s1: {}, s2: {}", s1, s2);
}
```

#### Fuller Example (Custom Clone Structs)
Just like `Copy`, custom `struct`s do not implement `Clone` by default. You can easily add it using the `#[derive(Clone)]` macro. When you call `.clone()` on the struct, Rust will recursively call `.clone()` on all of its fields.

```rust
// We tell the compiler: "Allow us to clone this struct!"
#[derive(Clone)]
struct User {
    username: String, // String is not Copy, so the struct cannot be Copy!
    login_count: i32,
}

fn main() {
    let user1 = User {
        username: String::from("alice_88"),
        login_count: 5,
    };
    
    // We perform a deep copy of the entire struct.
    let user2 = user1.clone();
    
    println!("user1 is still alive: {}", user1.username);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Clone Trait Scoping and Lifecycle Rules

**The mistake:** Assuming Clone Trait instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("clone_trait_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("clone_trait_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Clone Trait State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Clone Trait through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Clone Trait Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Clone Trait instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Custom Deep Copying and Reference-Counted Shared State in Transactional Snapshots

**Problem:**
In high-concurrency database storage engines, transaction snapshots isolate uncommitted mutations while sharing global metadata across instances. Automatic `#[derive(Clone)]` on complex data structures can lead to unexpected behavior if pointer duplication vs value deep-copying is not explicitly managed.

Implement a custom `Clone` implementation for a transactional storage cache. You are given a struct `CacheNode` containing a unique `u64` node ID, a dynamic heap-allocated payload buffer `Vec<u8>`, and a shared schema pointer `Arc<SchemaMetadata>`.
Your task is to:
1. Manually implement `Clone` for `CacheNode` so that calling `.clone()` allocates a fresh heap memory buffer for `payload`, while performing a shallow reference-count increment (`Arc::clone`) for `metadata`.
2. Implement `TransactionSnapshot` with a method `fork_transaction(&self, new_tx_id: u64) -> TransactionSnapshot` that produces an isolated copy of active cache nodes.
3. Write comprehensive unit tests in `#[cfg(test)] mod tests` using `assert_eq!`, `assert!`, `assert_ne!`, and `matches!` to verify deep buffer isolation, shared metadata pointer equality, strong reference counting, and enum pattern states.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::sync::Arc;
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum StorageEngineState {
>     Active,
>     ReadOnly,
> }
> 
> #[derive(Debug)]
> pub struct SchemaMetadata {
>     pub table_name: String,
>     pub version: u32,
>     pub engine_state: StorageEngineState,
> }
> 
> #[derive(Debug)]
> pub struct CacheNode {
>     pub node_id: u64,
>     pub payload: Vec<u8>,
>     pub metadata: Arc<SchemaMetadata>,
> }
> 
> impl Clone for CacheNode {
>     fn clone(&self) -> Self {
>         Self {
>             node_id: self.node_id,
>             payload: self.payload.clone(), // Deep copy of heap-allocated byte vector
>             metadata: Arc::clone(&self.metadata), // Shallow copy: increments reference count
>         }
>     }
> }
> 
> #[derive(Debug, Clone)]
> pub struct TransactionSnapshot {
>     pub tx_id: u64,
>     pub nodes: Vec<CacheNode>,
> }
> 
> impl TransactionSnapshot {
>     pub fn new(tx_id: u64, nodes: Vec<CacheNode>) -> Self {
>         Self { tx_id, nodes }
>     }
> 
>     pub fn fork_transaction(&self, new_tx_id: u64) -> Self {
>         let mut cloned = self.clone();
>         cloned.tx_id = new_tx_id;
>         cloned
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_transactional_snapshot_cloning() {
>         let schema = Arc::new(SchemaMetadata {
>             table_name: String::from("orders"),
>             version: 3,
>             engine_state: StorageEngineState::Active,
>         });
> 
>         let original_node = CacheNode {
>             node_id: 1001,
>             payload: vec![0xDE, 0xAD, 0xBE, 0xEF],
>             metadata: Arc::clone(&schema),
>         };
> 
>         let snapshot_v1 = TransactionSnapshot::new(1, vec![original_node]);
>         let mut snapshot_v2 = snapshot_v1.fork_transaction(2);
> 
>         // Mutate snapshot v2 payload to test memory isolation
>         snapshot_v2.nodes[0].payload.push(0xFF);
> 
>         // 1. assert_eq!: Check payload lengths after fork and mutation
>         assert_eq!(snapshot_v1.nodes[0].payload.len(), 4);
>         assert_eq!(snapshot_v2.nodes[0].payload.len(), 5);
>         assert_eq!(snapshot_v1.tx_id, 1);
>         assert_eq!(snapshot_v2.tx_id, 2);
> 
>         // 2. assert_ne!: Ensure vector heap memory addresses differ (deep copy verified)
>         assert_ne!(
>             snapshot_v1.nodes[0].payload.as_ptr(),
>             snapshot_v2.nodes[0].payload.as_ptr()
>         );
> 
>         // 3. assert!: Verify Arc pointer equality and strong count increment
>         assert!(Arc::ptr_eq(
>             &snapshot_v1.nodes[0].metadata,
>             &snapshot_v2.nodes[0].metadata
>         ));
>         assert!(Arc::strong_count(&schema) >= 3);
> 
>         // 4. matches!: Assert schema engine state using pattern matching
>         assert!(matches!(
>             snapshot_v2.nodes[0].metadata.engine_state,
>             StorageEngineState::Active
>         ));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Custom `Clone` Strategy & Hybrid Memory Semantics**:
>    - The `CacheNode` struct combines deep heap duplication with shared immutable pointer sharing. The `payload.clone()` call invokes `Vec::clone()`, allocating a separate block of memory on the heap and copying byte values. Mutating `snapshot_v2`'s payload cannot affect `snapshot_v1`.
>    - Conversely, `Arc::clone(&self.metadata)` executes an atomic reference count increment (`fetch_add`) without duplicating the underlying `SchemaMetadata`. This optimizes memory consumption by sharing heavy, immutable schema structures across thousands of transaction snapshots.
> 
> 2. **Ownership, Lifetimes, and Invariants**:
>    - `Arc<T>` guarantees thread-safe shared ownership. Because `SchemaMetadata` is behind an `Arc`, it is immutable unless interior mutability constructs (like `RwLock` or `Mutex`) are introduced.
>    - When `fork_transaction` calls `self.clone()`, Rust recursively clones the `Vec<CacheNode>`, which in turn calls `CacheNode::clone()` for every element.
> 
> 3. **Memory Layout Breakdown**:
>    - **Stack**: `CacheNode` stack frame contains `node_id` (8 bytes), `Vec` header (24 bytes: pointer, capacity, length), and `Arc` pointer (8 bytes).
>    - **Heap**: Separate buffer allocations exist for `snapshot_v1.payload` and `snapshot_v2.payload`. A single heap allocation hosts `SchemaMetadata` alongside atomic reference counts managed by `Arc`.
> 
> 4. **Edge Cases & Failure Modes**:
>    - If `#[derive(Clone)]` were used blindly on a struct containing raw references or un-isolated mutable inner pointers, mutation leakage could occur across transactions.
>    - Performing a deep copy on extremely large vector payloads introduces latency spikes. In production engines, copy-on-write dynamic arrays (`Cow<'a, [u8]>`) or chunked page buffers are combined with `Clone` to mitigate large allocations.

---

### Exercise 2: Buffer Allocation Reuse via Overridden `Clone::clone_from`

**Problem:**
High-throughput network proxies and gRPC parsing engines process millions of protocol frames per second. Repeated calls to standard `Clone::clone` allocate brand-new heap memory for payload buffers, driving OS allocator churn and CPU cache misses. The `Clone` trait offers an optimization hook: `fn clone_from(&mut self, source: &Self)`. By default, `clone_from` falls back to `*self = source.clone()`, but overriding it allows destination buffers to clear and reuse existing heap allocations without dropping and re-allocating memory.

Implement `NetworkFrame` featuring a `PacketHeader` and a dynamic `payload: Vec<u8>`. Override `clone_from` for `NetworkFrame` so that when copying a source frame into an existing destination frame, the destination's pre-allocated heap capacity is preserved and reused.
Write unit tests in `#[cfg(test)] mod tests` using `assert_eq!`, `assert!`, `assert_ne!`, and `matches!` to verify capacity retention, raw heap pointer preservation (`as_ptr()`), header attribute equivalence, and packet frame classification.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub enum FrameKind {
>     Data,
>     Control,
>     Heartbeat,
> }
> 
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub struct PacketHeader {
>     pub sequence_number: u64,
>     pub kind: FrameKind,
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct NetworkFrame {
>     pub header: PacketHeader,
>     pub payload: Vec<u8>,
> }
> 
> impl Clone for NetworkFrame {
>     fn clone(&self) -> Self {
>         Self {
>             header: self.header,
>             payload: self.payload.clone(), // Default path: fresh heap allocation
>         }
>     }
> 
>     fn clone_from(&mut self, source: &Self) {
>         // Copy header value fields
>         self.header = source.header;
>         // Reuse existing payload heap allocation buffer
>         self.payload.clear();
>         self.payload.extend_from_slice(&source.payload);
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_network_frame_clone_from_reuses_heap_buffer() {
>         let source_frame = NetworkFrame {
>             header: PacketHeader {
>                 sequence_number: 42,
>                 kind: FrameKind::Data,
>             },
>             payload: vec![1, 2, 3, 4, 5, 6, 7, 8],
>         };
> 
>         // Destination frame with pre-allocated buffer capacity (e.g., 1024 bytes)
>         let mut dest_frame = NetworkFrame {
>             header: PacketHeader {
>                 sequence_number: 0,
>                 kind: FrameKind::Heartbeat,
>             },
>             payload: Vec::with_capacity(1024),
>         };
> 
>         let original_dest_ptr = dest_frame.payload.as_ptr();
>         let original_dest_cap = dest_frame.payload.capacity();
> 
>         // Execute optimized clone_from
>         dest_frame.clone_from(&source_frame);
> 
>         // 1. assert_eq!: Payloads and headers match source frame
>         assert_eq!(dest_frame.header, source_frame.header);
>         assert_eq!(dest_frame.payload, source_frame.payload);
>         assert_eq!(dest_frame.payload.capacity(), original_dest_cap);
> 
>         // 2. assert!: Ensure destination pointer remains IDENTICAL (zero new heap allocations)
>         assert!(dest_frame.payload.as_ptr() == original_dest_ptr);
> 
>         // 3. assert_ne!: Ensure destination payload memory address differs from source memory address
>         assert_ne!(dest_frame.payload.as_ptr(), source_frame.payload.as_ptr());
> 
>         // 4. matches!: Assert header frame kind using pattern matching
>         assert!(matches!(dest_frame.header.kind, FrameKind::Data));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Optimizing Allocator Pressure via `clone_from`**:
>    - Standard `Clone::clone(&self)` returns a brand-new instance of `Self`. For `Vec<T>`, this forces the Global Allocator (`malloc`/`jemalloc`) to allocate memory on every call.
>    - `clone_from(&mut self, source: &Self)` mutates `self` in place. By calling `self.payload.clear()`, the vector resets its length descriptor to `0` while maintaining its underlying allocated heap buffer (`capacity`). Calling `extend_from_slice()` copies raw bytes into the existing memory buffer without invoking system memory allocation calls.
> 
> 2. **Memory Layout and Heap Pointer Stability**:
>    - When `dest_frame.payload.capacity()` is greater than or equal to `source_frame.payload.len()`, `extend_from_slice` writes directly into the memory region starting at `as_ptr()`.
>    - The test explicitly checks `assert!(dest_frame.payload.as_ptr() == original_dest_ptr)`, proving empirically that zero heap reallocation occurred during the copy.
> 
> 3. **Ownership and Invariants**:
>    - `PacketHeader` derives `Copy`, enabling cheap 16-byte stack assignment (`self.header = source.header`).
>    - The borrow checker enforces that `dest_frame` is mutably borrowed (`&mut self`) while `source_frame` is immutably borrowed (`&Self`), preventing self-aliasing bugs during memory slice copying.
> 
> 4. **Edge Cases**:
>    - **Buffer Under-capacity**: If `source.payload.len()` exceeds `dest.payload.capacity()`, `extend_from_slice` automatically triggers a heap reallocation, growing `dest.payload`'s capacity. While a reallocation occurs in that scenario, subsequent frame copies of equal or smaller size will reuse the expanded buffer.
>    - **Self-Cloning**: Calling `frame.clone_from(&frame)` could clear the vector before copying if not handled carefully. `Vec::extend_from_slice` handles slice references safely, but aliasing guards are good practice in general `clone_from` implementations.

---

### Exercise 3: Deep Cloning Dynamic Directed Acyclic Graphs (DAG) with Isolated Task Execution States

**Problem:**
In workflow orchestration frameworks (e.g. Apache Airflow, DAG build tools), pipelines are represented as graphs of connected `TaskNode` structures. When an execution job is spawned from a master pipeline template, the engine must clone the DAG graph into an active execution run. Every task node stores execution parameters (`Vec<(String, String)>`), job metadata, and dynamic state tracking (`NodeStatus`). Mutating task state or recording errors during run execution must never pollute the template graph or parallel run instances.

Implement custom `Clone` logic for `TaskNode` and `TaskPipeline`. Ensure that all strings, metadata, parameter vectors, and state variants are deeply cloned into independent memory addresses.
Write unit tests in `#[cfg(test)] mod tests` using `assert_eq!`, `assert!`, `assert_ne!`, and `matches!` to verify template isolation, parameter vector heap decoupling, duration and error status matching, and state transition independence.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub enum NodeStatus {
>     Pending,
>     Running { worker_id: u32 },
>     Completed { duration_ms: u64 },
>     Failed { error_message: String },
> }
> 
> #[derive(Debug, Clone)]
> pub struct TaskNode {
>     pub node_id: u32,
>     pub name: String,
>     pub parameters: Vec<(String, String)>,
>     pub status: NodeStatus,
> }
> 
> impl TaskNode {
>     pub fn new(id: u32, name: &str, params: &[(&str, &str)]) -> Self {
>         Self {
>             node_id: id,
>             name: name.to_string(),
>             parameters: params
>                 .iter()
>                 .map(|(k, v)| (k.to_string(), v.to_string()))
>                 .collect(),
>             status: NodeStatus::Pending,
>         }
>     }
> }
> 
> #[derive(Debug)]
> pub struct TaskPipeline {
>     pub pipeline_id: String,
>     pub nodes: Vec<TaskNode>,
> }
> 
> impl Clone for TaskPipeline {
>     fn clone(&self) -> Self {
>         Self {
>             pipeline_id: self.pipeline_id.clone(),
>             nodes: self.nodes.iter().cloned().collect(),
>         }
>     }
> 
>     fn clone_from(&mut self, source: &Self) {
>         self.pipeline_id.clone_from(&source.pipeline_id);
>         self.nodes.clear();
>         self.nodes.extend(source.nodes.iter().cloned());
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_dag_pipeline_deep_clone_isolation() {
>         let node1 = TaskNode::new(1, "ExtractData", &[("source", "postgres://db")]);
>         let node2 = TaskNode::new(2, "TransformData", &[("batch_size", "5000")]);
> 
>         let template_pipeline = TaskPipeline {
>             pipeline_id: String::from("template_etl_v1"),
>             nodes: vec![node1, node2],
>         };
> 
>         // Clone template into an active execution run instance
>         let mut execution_pipeline = template_pipeline.clone();
>         execution_pipeline.pipeline_id = String::from("run_exec_9021");
> 
>         // Mutate node statuses in execution pipeline
>         execution_pipeline.nodes[0].status = NodeStatus::Running { worker_id: 42 };
>         execution_pipeline.nodes[1].status = NodeStatus::Completed { duration_ms: 1250 };
> 
>         // 1. assert_eq!: Verify template nodes remain Pending while execution IDs differ
>         assert_eq!(template_pipeline.pipeline_id, "template_etl_v1");
>         assert_eq!(execution_pipeline.pipeline_id, "run_exec_9021");
>         assert_eq!(template_pipeline.nodes[0].status, NodeStatus::Pending);
> 
>         // 2. assert_ne!: Ensure parameter vector memory buffers reside at distinct heap addresses
>         assert_ne!(
>             template_pipeline.nodes[0].parameters.as_ptr(),
>             execution_pipeline.nodes[0].parameters.as_ptr()
>         );
> 
>         // 3. assert!: Validate node collection lengths are identical
>         assert!(template_pipeline.nodes.len() == execution_pipeline.nodes.len());
> 
>         // 4. matches!: Assert node execution statuses using pattern matching
>         assert!(matches!(
>             execution_pipeline.nodes[0].status,
>             NodeStatus::Running { worker_id: 42 }
>         ));
>         assert!(matches!(
>             execution_pipeline.nodes[1].status,
>             NodeStatus::Completed { duration_ms: 1250 }
>         ));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Recursive Deep Cloning of Complex Nested Data**:
>    - `TaskPipeline::clone` initiates a cascading deep clone: `pipeline_id.clone()` allocates heap memory for the pipeline name `String`, while `self.nodes.iter().cloned().collect()` invokes `TaskNode::clone()` for every element.
>    - Inside `TaskNode`, cloning duplicates `name: String`, `parameters: Vec<(String, String)>` (which duplicates heap allocations for every key-value tuple), and the `NodeStatus` enum (which handles dynamic heap data if `Failed { error_message }` is populated).
> 
> 2. **State Isolation and Memory Decoupling**:
>    - The master pipeline template serves as a read-only baseline blueprint. Modifying `execution_pipeline.nodes[0].status` mutates stack/heap bytes belonging exclusively to the `execution_pipeline` instance.
>    - `assert_ne!(template_pipeline.nodes[0].parameters.as_ptr(), execution_pipeline.nodes[0].parameters.as_ptr())` proves that nested inner vectors are physically separated on the heap.
> 
> 3. **Enum Memory Representation and `matches!` Invariants**:
>    - `NodeStatus` is a tagged union (discriminant + payload). Fieldless variants (`Pending`) consume only discriminant space, while payload variants (`Running { worker_id }`, `Failed { error_message }`) store data directly or via heap pointers inside the enum layout.
>    - Rust's `matches!` macro allows clean structural pattern matching on enum variants during unit testing without requiring manually written `if let` or `match` blocks.
> 
> 4. **Edge Cases & Operational Considerations**:
>    - **Graph Cyclic References**: If DAG nodes referenced each other via shared mutable references (`Rc<RefCell<TaskNode>>`), a standard recursive `.clone()` call could enter infinite recursion or duplicate shared nodes unexpectedly. Dag structures requiring cyclic references use node index IDs (`u32` keys into a flat `Vec<TaskNode>`) to maintain safe value-level cloning semantics without pointer cycles.

---

## 6. Related Terms

- [`Copy` Trait](../level_03/copy_trait.md) — The implicit, cheap version of copying for stack-only data.
- [Borrowing (`&`)](../level_03/borrowing.md) — The idiomatic way to avoid `.clone()` by just letting functions look at your data temporarily without taking ownership.

---

## 7. Key Takeaways

- The `Clone` trait allows you to perform an expensive **Deep Copy** of data.
- Because Deep Copies hit the Heap and slow down performance, it is never automatic. You must explicitly type `.clone()`.
- You can make your own structs cloneable by adding `#[derive(Clone)]` directly above the struct definition.
- Avoid using `.clone()` as a crutch just to silence compiler errors; use Borrowing (`&`) whenever possible to maintain blazing fast performance.
