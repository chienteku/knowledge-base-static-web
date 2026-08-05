# Partial Moves & Partial Borrows

> **Level 3 — Ownership & Borrowing**
> Moving one field out of a struct while leaving others behind, and borrowing disjoint fields simultaneously.

---

## 1. Prerequisites


- [Move Semantics](move_semantics.md) — The whole-value moving rule this concept specializes to individual fields.
- [Ownership](ownership.md) — What "partially moved" means for a struct's overall ownership state.
- [Mutable Borrowing (`&mut`)](mutable_borrowing.md) — The exclusivity rule that partial borrows specifically relax at the field level.

---

## 2. Term Category

**Borrow-Checker Precision (the field-level exception)**: Both ownership and borrowing rules, taken at their coarsest, would apply to an entire struct as a single unit. Rust's borrow checker is actually more precise than that: it tracks ownership and borrows **per field**, letting you move one field out while leaving the rest of the struct intact, and borrow two different fields mutably at the same time, as long as they're provably disjoint.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

If ownership rules only worked at the whole-struct level, this common pattern would be impossible: `let Config { name, settings } = config; use(name); use(settings);` — destructuring a struct and moving each field out independently. Rust's compiler is smarter than that: it tracks the **initialization state of each field separately**. Moving `config.name` out only invalidates `config.name` specifically — `config.settings` remains fully valid and usable, and the compiler statically tracks that `config` as a whole is now only *partially* initialized (which is why you generally can't use `config` as a complete value again afterward, only its still-valid individual fields). The equivalent applies to borrowing: `&mut config.a` and `&mut config.b` can coexist, because the compiler can see, at the field level, that `a` and `b` are provably non-overlapping memory — unlike calling two methods on `config` as a whole, where the compiler (usually) can't see inside to know the methods only touch disjoint fields.

### (2) Reality Metaphor

Imagine a gift basket with several distinct compartments, each holding a different item.

- **Partial moves**: You can reach in and take out the chocolate (**one field**) without needing to take the entire basket. The basket itself is now missing one item (**partially moved**), but the wine bottle and cheese still sitting in their own compartments (**other fields**) remain completely fine to remove separately, whenever you like.
- **Partial borrows**: Two different people can each simultaneously reach into two *different* compartments of the same basket without getting in each other's way — one person adjusting the wine bottle, another rearranging the cheese — as long as they're clearly reaching into separate, non-overlapping compartments and not, say, both grabbing at the same slot.

### (3) Rust Code Examples

#### Short Snippet (Partial Move via Destructuring)
```rust
struct Config {
    name: String,
    settings: Vec<i32>,
}

fn main() {
    let config = Config { name: "prod".to_string(), settings: vec![1, 2, 3] };

    let Config { name, settings } = config; // Both fields MOVED OUT independently.

    println!("{name}");     // Fine — `name` is a fully valid, owned String.
    println!("{settings:?}"); // Fine — `settings` is a fully valid, owned Vec.
    // println!("{}", config.name); // ERROR: `config` was partially moved from.
}
```

#### Fuller Example (Partial Borrows: Two `&mut` on Disjoint Fields)
```rust
struct Player {
    health: i32,
    inventory: Vec<String>,
}

fn main() {
    let mut player = Player { health: 100, inventory: vec!["sword".to_string()] };

    // Two SEPARATE mutable borrows into DIFFERENT fields, at the same time.
    // The compiler can see `health` and `inventory` are disjoint memory — legal!
    let health_ref: &mut i32 = &mut player.health;
    let inventory_ref: &mut Vec<String> = &mut player.inventory;

    *health_ref -= 10;
    inventory_ref.push("shield".to_string());

    println!("{} {:?}", player.health, player.inventory); // 90 ["sword", "shield"]
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Partial Moves Scoping and Lifecycle Rules

**The mistake:** Assuming Partial Moves instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("partial_moves_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("partial_moves_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Partial Moves State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Partial Moves through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Partial Moves Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Partial Moves instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: High-Performance Concurrent Task Pipeline Worker (Partial Moves & Field-Level Mutability Disjointness)

**Problem:**
In a high-throughput stream processing pipeline, worker nodes ingest structured batches (`TaskBatch`) containing heavy payload buffers (`Vec<u8>`), batch metadata (`BatchHeader`), and execution metrics (`TelemetryStats`).
When dispatching payload data to a processing queue, we must move out the heavy payload vector to prevent expensive deep copies. At the same time, the worker must retain and update its telemetry stats and header info. Furthermore, helper methods updating telemetry stats must operate concurrently with reference-based reads of the batch header without triggering borrow checker conflicts (`E0502` / `E0499`).

Implement a task dispatching stage that:
1. Defines `BatchHeader`, `TelemetryStats`, `TaskBatch`, and `PipelineStage`.
2. Implements a task consumption function `dispatch_batch(batch: TaskBatch)` that partially moves out the payload buffer (`Vec<u8>`) for processing while keeping `header` and `telemetry` intact for audit logging.
3. Implements disjoint field borrowing in `PipelineStage::process_disjoint`, allowing concurrent mutable updates to `telemetry` and shared read access to `header` by splitting references across disjoint struct fields (`&batch.header` and `&mut self.telemetry`).
4. Includes comprehensive unit tests using `#[cfg(test)] mod tests` with explicit assertions (`assert_eq!`, `assert!`, `assert_ne!`, `matches!`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq)]
> pub struct BatchHeader {
>     pub batch_id: u64,
>     pub priority: u8,
> }
> 
> #[derive(Debug, Default, PartialEq, Eq)]
> pub struct TelemetryStats {
>     pub processed_count: usize,
>     pub total_bytes: usize,
>     pub errors: usize,
> }
> 
> #[derive(Debug)]
> pub struct TaskBatch {
>     pub header: BatchHeader,
>     pub payload: Vec<u8>,
>     pub telemetry: TelemetryStats,
> }
> 
> pub struct PipelineStage {
>     pub stage_name: String,
>     pub telemetry: TelemetryStats,
> }
> 
> impl PipelineStage {
>     pub fn new(name: &str) -> Self {
>         Self {
>             stage_name: name.to_string(),
>             telemetry: TelemetryStats::default(),
>         }
>     }
> 
>     /// Dispatches a TaskBatch by partially moving out the payload while retaining header & telemetry.
>     pub fn dispatch_batch(batch: TaskBatch) -> (Vec<u8>, BatchHeader, TelemetryStats) {
>         // Partial move: `payload` is moved out of `batch`.
>         // `batch.header` and `batch.telemetry` remain owned and valid.
>         let payload = batch.payload;
>         let header = batch.header;
>         let telemetry = batch.telemetry;
> 
>         (payload, header, telemetry)
>     }
> 
>     /// Process raw bytes using disjoint field borrows.
>     /// By taking `&BatchHeader` and `&mut TelemetryStats` as separate parameters,
>     /// we avoid taking `&mut self` on a parent struct, avoiding borrow conflicts.
>     pub fn update_stats(header: &BatchHeader, stats: &mut TelemetryStats, byte_len: usize) {
>         if header.priority > 0 {
>             stats.processed_count += 1;
>             stats.total_bytes += byte_len;
>         } else {
>             stats.errors += 1;
>         }
>     }
> 
>     /// Processes batch using disjoint borrows on `self.telemetry` and `batch.header`.
>     pub fn process_disjoint(&mut self, batch: &TaskBatch) {
>         // Disjoint borrow: read borrow of `batch.header`, mutable borrow of `self.telemetry`.
>         Self::update_stats(&batch.header, &mut self.telemetry, batch.payload.len());
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_partial_move_dispatch() {
>         let batch = TaskBatch {
>             header: BatchHeader { batch_id: 101, priority: 2 },
>             payload: vec![0xDE, 0xAD, 0xBE, 0xEF],
>             telemetry: TelemetryStats::default(),
>         };
> 
>         // Partial move of TaskBatch fields
>         let (payload, header, stats) = PipelineStage::dispatch_batch(batch);
> 
>         assert_eq!(payload, vec![0xDE, 0xAD, 0xBE, 0xEF]);
>         assert_eq!(header.batch_id, 101);
>         assert_eq!(stats.processed_count, 0);
>         assert_ne!(payload.len(), 0);
>     }
> 
>     #[test]
>     fn test_disjoint_field_borrowing() {
>         let mut stage = PipelineStage::new("ingress_filter");
>         let batch = TaskBatch {
>             header: BatchHeader { batch_id: 202, priority: 1 },
>             payload: vec![1, 2, 3, 4, 5],
>             telemetry: TelemetryStats::default(),
>         };
> 
>         stage.process_disjoint(&batch);
> 
>         assert_eq!(stage.telemetry.processed_count, 1);
>         assert_eq!(stage.telemetry.total_bytes, 5);
>         assert_eq!(stage.telemetry.errors, 0);
>         assert!(matches!(stage.telemetry.errors, 0));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
>
>
> 1. **Field-Level Ownership Tracking**: In `dispatch_batch`, destructuring or assigning `batch.payload` transfers ownership of the `Vec<u8>` heap allocation without cloning. The Rust compiler tracks initialization state on a per-field basis (in compiler terminology, `MovePath` analysis). `batch.header` and `batch.telemetry` remain valid independently.
> 2. **Struct Invalidation vs Field Validity**: Once `batch.payload` is moved out, the `batch` binding is in a *partially moved* state. Passing `batch` as a single argument or taking a reference `&batch` is prohibited by the compiler (`E0382`), but accessing remaining initialized fields (`batch.header`) is permitted as long as `TaskBatch` does not implement `Drop`.
> 3. **Disjoint Field Borrowing (NLL & Field Split)**: In `process_disjoint`, passing `&batch.header` (immutable borrow of `header`) and `&mut self.telemetry` (exclusive borrow of `stage.telemetry`) succeeds because the compiler verifies that `self` and `batch` are distinct objects, and within `self`, `telemetry` is a distinct memory location from other fields. If a helper method were defined as `fn update(&mut self, header: &BatchHeader)`, calling `self.update(&self.header)` would fail with `E0502` because `&mut self` borrows the *entire* struct, overlapping with `&self.header`. Splitting function signatures into explicit field references decouples borrow scopes.
> 4. **Edge Cases & Memory Layout**: If `TaskBatch` implemented `std::ops::Drop`, partial moves of any field (`let payload = batch.payload;`) would trigger error `E0509` ("cannot move out of type `TaskBatch`, which implements the `Drop` trait"). Rust requires values with custom drops to remain structurally complete so `drop(&mut self)` can safely access all fields.

---

### Exercise 2: Zero-Copy Protocol Frame Decoder & Handling `Drop` Constraints

**Problem:**
In network microservices, high-performance packet framing requires parsing protocol frames (`NetworkFrame`) consisting of a `FrameHeader`, a `PayloadBuffer`, and dynamic trace metadata.
However, `NetworkFrame` implements `Drop` to release network resources or telemetry span registration on teardown.
When decomposing `NetworkFrame` into header metadata and payload data for stream routing, direct partial moves fail with compiler error `E0509` because types implementing `Drop` cannot be partially moved from.

Implement a zero-copy protocol frame decoder that:
1. Defines `FrameHeader`, `PayloadBuffer` (wrapping `Vec<u8>`), and `NetworkFrame` (which implements `Drop`).
2. Solves the `Drop` constraint using idiomatic Rust patterns (`Option::take` or structural decomposition via `std::mem::take`), allowing zero-copy ownership transfer of payload data without copying memory.
3. Implements disjoint field borrowing to parse header flags while mutating payload buffers in place.
4. Includes comprehensive unit tests using `#[cfg(test)] mod tests` with explicit assertions (`assert_eq!`, `assert!`, `assert_ne!`, `matches!`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::mem;
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct FrameHeader {
>     pub stream_id: u32,
>     pub flags: u8,
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct PayloadBuffer {
>     pub data: Vec<u8>,
> }
> 
> pub struct NetworkFrame {
>     pub header: FrameHeader,
>     // Wrapped in Option to enable zero-copy extraction on Drop-implementing structs
>     pub payload: Option<PayloadBuffer>,
>     pub active_drops: usize,
> }
> 
> impl Drop for NetworkFrame {
>     fn drop(&mut self) {
>         // Custom cleanup logic (e.g. telemetry / socket release)
>         self.active_drops += 1;
>     }
> }
> 
> pub struct PacketDecoder;
> 
> impl PacketDecoder {
>     /// Zero-copy extraction of payload from a Drop-implementing struct using Option::take.
>     pub fn extract_payload(frame: &mut NetworkFrame) -> Option<PayloadBuffer> {
>         // `frame.payload.take()` leaves `None` in `frame.payload` and moves out the `PayloadBuffer`.
>         // This avoids partial move violations (E0509) on structs that implement `Drop`.
>         frame.payload.take()
>     }
> 
>     /// Mutate payload in-place while borrowing header immutably (disjoint borrows).
>     pub fn transform_in_place(header: &FrameHeader, payload: &mut PayloadBuffer) {
>         if (header.flags & 0x01) != 0 {
>             // Apply byte transformation (e.g. XOR encryption/masking)
>             for byte in payload.data.iter_mut() {
>                 *byte ^= 0xFF;
>             }
>         }
>     }
> 
>     /// Helper demonstrating disjoint field borrowing on NetworkFrame fields.
>     pub fn process_frame_disjoint(frame: &mut NetworkFrame) {
>         if let Some(ref mut payload) = frame.payload {
>             // Disjoint borrow: immutable reference to `frame.header`, mutable reference to `payload` inside `frame.payload`.
>             Self::transform_in_place(&frame.header, payload);
>         }
>     }
> 
>     /// Deconstructs payload using std::mem::take / std::mem::replace without Option wrapper.
>     pub fn replace_payload_buffer(buf: &mut Vec<u8>) -> Vec<u8> {
>         mem::take(buf)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_zero_copy_payload_extraction_with_drop() {
>         let mut frame = NetworkFrame {
>             header: FrameHeader { stream_id: 42, flags: 0x01 },
>             payload: Some(PayloadBuffer { data: vec![0x10, 0x20, 0x30] }),
>             active_drops: 0,
>         };
> 
>         // Extract payload zero-copy without triggering E0509
>         let extracted = PacketDecoder::extract_payload(&mut frame);
> 
>         assert!(extracted.is_some());
>         assert_eq!(extracted.unwrap().data, vec![0x10, 0x20, 0x30]);
>         assert!(frame.payload.is_none());
>         assert_eq!(frame.header.stream_id, 42);
>     }
> 
>     #[test]
>     fn test_disjoint_field_borrow_transform() {
>         let mut frame = NetworkFrame {
>             header: FrameHeader { stream_id: 100, flags: 0x01 },
>             payload: Some(PayloadBuffer { data: vec![0x00, 0x0F, 0xF0] }),
>             active_drops: 0,
>         };
> 
>         PacketDecoder::process_frame_disjoint(&mut frame);
> 
>         let data = &frame.payload.as_ref().unwrap().data;
>         assert_eq!(data, &vec![0xFF, 0xF0, 0x0F]);
>         assert_ne!(data[0], 0x00);
>         assert!(matches!(frame.header.flags, 0x01));
>     }
> 
>     #[test]
>     fn test_mem_take_replacement() {
>         let mut raw_bytes = vec![1, 2, 3, 4];
>         let original = PacketDecoder::replace_payload_buffer(&mut raw_bytes);
> 
>         assert_eq!(original, vec![1, 2, 3, 4]);
>         assert!(raw_bytes.is_empty());
>         assert_eq!(raw_bytes.len(), 0);
>     }
> }
> ```
>
> #### Technical Explanation
>
>
>
>
> 1. **The `Drop` vs Partial Move Invariant (`E0509`)**: In Rust, when a type implements `std::ops::Drop`, the compiler generates a call to `Drop::drop(&mut self)` when the instance goes out of scope. If partial moves were allowed on `Drop` types (e.g. `let p = frame.payload;`), `Drop::drop` would execute on a partially uninitialized `self`, leading to undefined behavior or double-free bugs when `drop` attempts to touch moved fields. Thus, Rust strictly forbids moving fields out of a struct implementing `Drop`.
> 2. **Workaround 1: `Option::take`**: By wrapping the owned field in `Option<T>`, the struct memory layout contains `Option::Some(T)`. Calling `.take()` replaces the field content with `Option::None` and returns `Some(T)` by value. The field remains in a valid `Option::None` state, keeping the parent struct fully initialized and valid for `Drop::drop(&mut self)`.
> 3. **Workaround 2: `std::mem::replace` / `std::mem::take`**: For non-`Option` fields implementing `Default`, `std::mem::take(&mut field)` steals ownership of the vector/buffer by swapping it with an empty `Default` instance. This performs zero memory allocations or deep clones while maintaining struct initialization invariants.
> 4. **Disjoint Borrow Mechanics with `Option`**: In `process_frame_disjoint`, `if let Some(ref mut payload) = frame.payload` creates a mutable reference `&mut PayloadBuffer` anchored specifically to the heap content inside `frame.payload`. Simultaneously passing `&frame.header` succeeds because `frame.header` and `frame.payload` occupy disjoint byte offsets in memory.
> 5. **Performance & Memory Overhead**: `Option<Vec<u8>>` benefits from null-pointer optimization (NPO) on pointer types or niche optimization, rendering `Option<Vec<u8>>` identical in size to a raw `Vec<u8>` (24 bytes on 64-bit platforms). `Option::take()` evaluates to a single pointer swap instruction, yielding true zero-copy ergonomics.

---

### Exercise 3: Arena Memory Recycler & Graph Node Splitting (Disjoint Field Borrows & Partial Deallocation)

**Problem:**
In graph algorithms, Quadtrees, or spatial indexing structures, graph nodes (`ArenaNode`) manage dynamic memory slots containing node payload (`NodeData`), incoming/outgoing edges (`EdgeList`), and freelist memory recycling markers (`RecycleHeader`).
When performing node splitting or graph edge re-linking:
- We need to mutably update `EdgeList` while reading properties from `NodeData`.
- When deallocating a node back to the arena freelist, we partially move out `NodeData` (returning ownership to the caller) while reusing `EdgeList` buffers and resetting `RecycleHeader` to avoid redundant heap reallocations.

Implement an Arena Node Recycler system that:
1. Defines `NodeData`, `EdgeList`, `RecycleHeader`, and `ArenaNode`.
2. Implements a node recycling method `recycle_node(node: ArenaNode)` that partially moves out `node.data` for processing, while recycling `node.edges` and `node.header` back into a recycled pool.
3. Implements disjoint field references in node optimization methods (`relink_edges(&NodeData, &mut EdgeList)`), demonstrating how to split struct method calls so that caller code can modify edge vectors without mutably locking `NodeData`.
4. Includes comprehensive unit tests using `#[cfg(test)] mod tests` with explicit assertions (`assert_eq!`, `assert!`, `assert_ne!`, `matches!`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq)]
> pub struct NodeData {
>     pub id: u64,
>     pub payload: String,
> }
> 
> #[derive(Debug, Default, PartialEq, Eq)]
> pub struct EdgeList {
>     pub neighbors: Vec<u64>,
>     pub weights: Vec<f32>,
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct RecycleHeader {
>     pub generation: u32,
>     pub is_recycled: bool,
> }
> 
> #[derive(Debug)]
> pub struct ArenaNode {
>     pub data: NodeData,
>     pub edges: EdgeList,
>     pub header: RecycleHeader,
> }
> 
> pub struct NodeArena {
>     pub recycled_edges: Vec<EdgeList>,
>     pub next_generation: u32,
> }
> 
> impl NodeArena {
>     pub fn new() -> Self {
>         Self {
>             recycled_edges: Vec::new(),
>             next_generation: 1,
>         }
>     }
> 
>     /// Recycles an ArenaNode by partially moving `data` to caller,
>     /// while saving `edges` and updating `header` in the arena pool.
>     pub fn recycle_node(&mut self, node: ArenaNode) -> NodeData {
>         // Partial move: `data` and `edges` are moved out independently.
>         let extracted_data = node.data;
>         let mut edges = node.edges;
> 
>         // Clear heavy vector allocations for reuse
>         edges.neighbors.clear();
>         edges.weights.clear();
> 
>         // Store recycled edge buffer in arena pool
>         self.recycled_edges.push(edges);
>         self.next_generation += 1;
> 
>         extracted_data
>     }
> 
>     /// Helper operating on disjoint field references:
>     /// mutates `edges` based on read-only inspection of `data`.
>     pub fn relink_edges(data: &NodeData, edges: &mut EdgeList, target_id: u64, weight: f32) {
>         // Only link edges if target is different from node ID
>         if data.id != target_id {
>             edges.neighbors.push(target_id);
>             edges.weights.push(weight);
>         }
>     }
> 
>     /// Demonstrates calling disjoint field helper on an ArenaNode.
>     pub fn update_node_disjoint(node: &mut ArenaNode, target_id: u64, weight: f32) {
>         // Disjoint borrow: `&node.data` (immutable) and `&mut node.edges` (mutable).
>         Self::relink_edges(&node.data, &node.edges, target_id, weight);
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_partial_move_node_recycling() {
>         let mut arena = NodeArena::new();
>         let node = ArenaNode {
>             data: NodeData { id: 42, payload: "sensor_data_chunk".to_string() },
>             edges: EdgeList { neighbors: vec![1, 2, 3], weights: vec![1.0, 2.5, 3.2] },
>             header: RecycleHeader { generation: 1, is_recycled: false },
>         };
> 
>         // Deconstruct node via partial moves
>         let data = arena.recycle_node(node);
> 
>         assert_eq!(data.id, 42);
>         assert_eq!(data.payload, "sensor_data_chunk");
>         assert_eq!(arena.recycled_edges.len(), 1);
>         assert!(arena.recycled_edges[0].neighbors.is_empty());
>         assert_eq!(arena.next_generation, 2);
>     }
> 
>     #[test]
>     fn test_disjoint_field_relinking() {
>         let mut node = ArenaNode {
>             data: NodeData { id: 10, payload: "root_node".to_string() },
>             edges: EdgeList::default(),
>             header: RecycleHeader { generation: 1, is_recycled: false },
>         };
> 
>         // Relink valid target
>         NodeArena::update_node_disjoint(&mut node, 20, 4.5);
>         assert_eq!(node.edges.neighbors, vec![20]);
>         assert_eq!(node.edges.weights, vec![4.5]);
> 
>         // Attempt relinking self (should be ignored by logic)
>         NodeArena::update_node_disjoint(&mut node, 10, 1.0);
>         assert_eq!(node.edges.neighbors.len(), 1);
>         assert_ne!(node.edges.neighbors.len(), 2);
>         assert!(matches!(node.edges.neighbors.first(), Some(&20)));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
>
>
> 1. **Partial Moves in Buffer Recycling**: In high-throughput memory managers (such as slot map or quadtree arenas), allocating vector capacity (`Vec::with_capacity`) repeatedly incurs system call and realloc overhead. In `recycle_node`, `let extracted_data = node.data; let mut edges = node.edges;` partially moves `data` and `edges` out of `node`. `extracted_data` is returned to the caller by value, while `edges` (with its allocated heap capacity preserved) has its length reset via `.clear()` and is stored in `self.recycled_edges` for instant reuse by subsequent node allocations.
> 2. **Struct Disassembly Mechanics**: Rust tracks ownership at the field level. `node.data` and `node.edges` are disjoint memory offsets inside `ArenaNode`. Moving `data` out leaves `node.data` uninitialized, while `node.edges` remains fully valid. Because `ArenaNode` does not implement `Drop`, fields can be moved independently without runtime drops interfering.
> 3. **Refactoring Struct Methods for Disjoint Borrows**: A common design trap in Rust is defining `fn relink(&mut self, target_id: u64, weight: f32)`. If `relink` internal logic needs to read `self.data.id` while pushing into `self.edges.neighbors`, calling internal methods on `self` can conflict with concurrent borrows. By defining standalone functions or static helper functions (`relink_edges(data: &NodeData, edges: &mut EdgeList)`), caller code can borrow `&node.data` (shared) and `&mut node.edges` (exclusive) simultaneously. The borrow checker statically verifies that `node.data` and `node.edges` refer to non-overlapping fields.
> 4. **Memory Layout and Field Splitting Alignment**: At compile time, `ArenaNode` is laid out sequentially in memory. When borrowing `&node.data` and `&mut node.edges`, the compiler calculates pointer offsets: `&node.data` resolves to `(node_ptr + offset_data)` and `&mut node.edges` resolves to `(node_ptr + offset_edges)`. Because offset regions do not overlap, Rust guarantees memory safety without needing mutexes or runtime ref-cell counters.

---

## 6. Related Terms


- [Move Semantics](move_semantics.md)
- [Mutable Borrowing (`&mut`)](mutable_borrowing.md) — The exclusivity rule partial borrows relax specifically for provably-disjoint fields.
- [`std::mem` Utilities (`replace`, `take`, `swap`, `drop`)](std_mem_utilities.md) — A common tool for working around cases where partial-borrow analysis can't see through a method call boundary.
- [Pattern Matching](../level_02/pattern_matching.md) — The destructuring syntax (`let Struct { a, b } = value;`) that commonly triggers partial moves.

---

## 7. Key Takeaways

- Rust's ownership and borrow tracking operates at the **field level**, not just the whole-struct level.
- A "partial move" leaves a struct's individual fields independently valid or invalid — you can still use fields that weren't moved out, but not the struct as a single complete value.
- "Partial borrows" let you hold simultaneous mutable borrows of different, disjoint fields of the same struct.
- This field-level analysis only works for **direct field access** in the current scope — it cannot see through an opaque method call to know which fields that method actually touches.
