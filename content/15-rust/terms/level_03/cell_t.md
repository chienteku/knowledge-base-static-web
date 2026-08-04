# `Cell<T>`

> **Level 3 — Ownership & Borrowing**
> A smart pointer for interior mutability of `Copy` types without borrowing overhead.

---

## 1. Prerequisites

- [`RefCell<T>`](../level_03/refcell_t.md) — The heavy-duty tool that `Cell` is an optimization of.
- [`Copy` Trait](../level_03/copy_trait.md) — The trait that allows `Cell` to be so incredibly fast.

---

## 2. Term Category

**Rust-specific (the lightweight optimization)**: `Cell` provides the exact same superpower as `RefCell` (bypassing the strict Borrow Checker), but it is heavily optimized specifically for small, simple data types.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

We know that `RefCell` allows us to bypass the Borrow Checker and mutate data that the compiler thinks is immutable. But `RefCell` achieves this by keeping an internal "guard" counter that tracks how many borrows are active. Updating and checking this counter takes CPU cycles. If you make a mistake, the guard crashes your program.

But what if the data you want to mutate is just a simple `i32` score counter? 

Tracking references and enforcing borrow rules for a tiny `i32` is massive overkill. Because an `i32` implements the `Copy` trait, you don't even *need* a reference to read it; you can just copy the whole number instantly! 

This is what **`Cell<T>`** does. It bypasses the Borrow Checker entirely *without* any runtime tracking guards. It never gives out references; it only gives out copies. Because there are no references, you can never violate the "One Mutable Borrow" rule, meaning it is blazing fast and impossible to `panic!`.

### (2) Reality Metaphor

Imagine wanting to share a secret family recipe.

**`RefCell`** is a heavily guarded library. To look at the recipe, you have to sign a logbook (the runtime guard). If two people try to sign out the only copy at the exact same time to edit it, the guard violently kicks you out (a `panic!`).

**`Cell<T>`** is a cheap copy machine. There are no guards, no logbooks, and no borrowing. If you want to read the recipe, you just press a button and instantly print a duplicate copy for yourself (`.get()`). If you want to update it, you just print a new piece of paper and permanently overwrite the master copy (`.set()`). Because everyone just makes cheap copies, nobody ever fights over who is holding the original paper. There are no rules, and no crashes.

### (3) Rust Code Examples

#### Short Snippet (The Faster Alternative)
To read data inside a `Cell`, you call `.get()`. To overwrite the data, you call `.set()`. Notice that neither method requires an `&mut` reference!
```rust
use std::cell::Cell;

fn main() {
    // 1. We create an immutable variable
    let score = Cell::new(10);
    
    // 2. We overwrite the value. No `.borrow_mut()` needed! No Panics!
    score.set(20);
    
    // 3. We retrieve a COPY of the value.
    let current_score = score.get();
    
    println!("The score is: {}", current_score);
}
```

#### Fuller Example (Sharing with Rc)
Just like `RefCell`, `Cell` is almost always wrapped inside an `Rc` so that multiple owners can mutate a shared counter.

```rust
use std::rc::Rc;
use std::cell::Cell;

fn main() {
    // A shared counter wrapped in a Cell
    let shared_counter = Rc::new(Cell::new(0));
    
    let user1 = Rc::clone(&shared_counter);
    let user2 = Rc::clone(&shared_counter);
    
    // Both users can freely update the counter without causing a panic!
    user1.set(user1.get() + 1);
    user2.set(user2.get() + 1);
    
    println!("Total clicks: {}", shared_counter.get()); // Prints 2
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Cell T Scoping and Lifecycle Rules

**The mistake:** Assuming Cell T instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("cell_t_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("cell_t_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Cell T State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Cell T through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Cell T Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Cell T instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Single-Threaded Reactive GUI Event Observer System

**Problem:**
In single-threaded GUI frameworks (such as GTK or custom desktop event loops), multiple UI component callbacks need to inspect and mutate shared application metrics (render count, dirty flag, and active tab index) without exclusive `&mut self` borrowing privileges or runtime reference-counter panic risks.

Implement a `WidgetTracker` system managing a `DisplayMetrics` state structure using `Cell<T>`.

**Requirements:**
1. Define a `#[derive(Debug, Clone, Copy, PartialEq, Eq)]` struct `DisplayMetrics` containing `render_count: u32`, `is_dirty: bool`, and `active_tab_id: usize`.
2. Define a `WidgetTracker` struct wrapping `metrics: Cell<DisplayMetrics>` and `total_events_processed: Cell<u32>`.
3. Implement `mark_dirty(&self)` to set `is_dirty` to `true` behind an immutable `&self` reference.
4. Implement `increment_render(&self) -> u32` to increment `render_count`, clear `is_dirty` to `false`, and return the updated count.
5. Implement `switch_tab(&self, new_tab: usize) -> usize` to switch `active_tab_id`, increment `total_events_processed`, and return the *previous* tab ID.
6. Implement `swap_metrics(&self, other: &Self)` to atomically exchange metrics between two trackers using `Cell::swap`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::cell::Cell;
> 
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub struct DisplayMetrics {
>     pub render_count: u32,
>     pub is_dirty: bool,
>     pub active_tab_id: usize,
> }
> 
> pub struct WidgetTracker {
>     metrics: Cell<DisplayMetrics>,
>     total_events_processed: Cell<u32>,
> }
> 
> impl WidgetTracker {
>     pub fn new(initial_metrics: DisplayMetrics) -> Self {
>         Self {
>             metrics: Cell::new(initial_metrics),
>             total_events_processed: Cell::new(0),
>         }
>     }
> 
>     pub fn mark_dirty(&self) {
>         let mut current = self.metrics.get();
>         current.is_dirty = true;
>         self.metrics.set(current);
>     }
> 
>     pub fn increment_render(&self) -> u32 {
>         let mut current = self.metrics.get();
>         current.render_count += 1;
>         current.is_dirty = false;
>         self.metrics.set(current);
>         current.render_count
>     }
> 
>     pub fn switch_tab(&self, new_tab: usize) -> usize {
>         let mut current = self.metrics.get();
>         let old_tab = current.active_tab_id;
>         current.active_tab_id = new_tab;
>         self.metrics.set(current);
>         self.total_events_processed.set(self.total_events_processed.get() + 1);
>         old_tab
>     }
> 
>     pub fn swap_metrics(&self, other: &Self) {
>         self.metrics.swap(&other.metrics);
>     }
> 
>     pub fn get_metrics(&self) -> DisplayMetrics {
>         self.metrics.get()
>     }
> 
>     pub fn total_events(&self) -> u32 {
>         self.total_events_processed.get()
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_widget_tracker_operations() {
>         let tracker1 = WidgetTracker::new(DisplayMetrics {
>             render_count: 0,
>             is_dirty: false,
>             active_tab_id: 1,
>         });
> 
>         let tracker2 = WidgetTracker::new(DisplayMetrics {
>             render_count: 10,
>             is_dirty: true,
>             active_tab_id: 5,
>         });
> 
>         // Verify mark_dirty mutates state behind immutable reference
>         tracker1.mark_dirty();
>         assert!(tracker1.get_metrics().is_dirty);
> 
>         // Verify increment_render returns updated count and clears dirty flag
>         let new_renders = tracker1.increment_render();
>         assert_eq!(new_renders, 1);
>         assert!(!tracker1.get_metrics().is_dirty);
>         assert_eq!(tracker1.get_metrics().render_count, 1);
> 
>         // Verify switch_tab returns old value and increments event counter
>         let prev_tab = tracker1.switch_tab(3);
>         assert_eq!(prev_tab, 1);
>         assert_eq!(tracker1.get_metrics().active_tab_id, 3);
>         assert_eq!(tracker1.total_events(), 1);
> 
>         // Verify atomic swap between shared trackers
>         tracker1.swap_metrics(&tracker2);
>         assert_eq!(tracker1.get_metrics().active_tab_id, 5);
>         assert_eq!(tracker2.get_metrics().active_tab_id, 3);
>         assert_ne!(tracker1.get_metrics(), tracker2.get_metrics());
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Copy Value Semantics**: `Cell<T>` requires `T` to implement `Copy` for the `.get()` method. Calling `self.metrics.get()` copies the entire `DisplayMetrics` struct (a 24-byte stack value on 64-bit platforms) out of the `Cell` into a local stack slot without taking any borrows or references to the internal buffer.
> 2. **Interior Mutability via `UnsafeCell`**: Internally, `Cell<T>` wraps `UnsafeCell<T>`. Rust's compiler treats `UnsafeCell` as a language primitive that disables the immutability optimization pass for values behind shared `&` references. Because `.set()` overwrites the memory location directly without returning a reference to `T`, aliasing invariants are preserved—no outstanding references to the interior data ever exist.
> 3. **Atomic State Swapping (`Cell::swap`)**: The `swap_metrics` method utilizes `Cell::swap(&a, &b)`, which performs an inline raw memory swap (`std::ptr::swap`) between the two `UnsafeCell` pointers. Because no references to the contents are held, swapping is entirely panic-safe and fast.
> 4. **Memory Layout and Safety**: The memory layout of `Cell<DisplayMetrics>` is identical to `DisplayMetrics` (zero size/alignment overhead). `Cell` explicitly implements `!Sync`, preventing shared references `&Cell<T>` from crossing thread boundaries. This guarantees single-threaded thread safety without any dynamic borrowing guards or locking mechanisms.

---

### Exercise 2: Graph Cycle Detection with Reentrant State Traversal Markers

**Problem:**
When performing Depth-First Search (DFS) or Topological Sorting over graph nodes shared via reference-counted pointers (`Rc<GraphNode>`), algorithm state markers (`Unvisited`, `Visiting`, `Visited`) must be updated during graph walks. Using `RefCell<NodeState>` introduces dynamic borrow checks that overhead performance and risk runtime panic crashes during cyclic reentrancy.

Implement a graph cycle detection engine using `Cell<NodeState>` for state tracking and `RefCell<Vec<Rc<GraphNode>>>` for node adjacency lists.

**Requirements:**
1. Define `#[derive(Debug, Clone, Copy, PartialEq, Eq)]` enum `NodeState { Unvisited, Visiting, Visited }`.
2. Define struct `GraphNode` with fields `id: usize`, `state: Cell<NodeState>`, and `neighbors: RefCell<Vec<Rc<GraphNode>>>`.
3. Implement `has_cycle(&self) -> bool` using Depth-First Search:
   - If node state is `Visiting`, return `true` (cycle detected).
   - If node state is `Visited`, return `false`.
   - If `Unvisited`, set state to `Visiting`, recursively call `has_cycle` on neighbors, and update state to `Visited` before returning `false`.
4. Implement `reset_states(&self)` to recursively reset node states back to `Unvisited`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::cell::{Cell, RefCell};
> use std::rc::Rc;
> 
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub enum NodeState {
>     Unvisited,
>     Visiting,
>     Visited,
> }
> 
> pub struct GraphNode {
>     pub id: usize,
>     pub state: Cell<NodeState>,
>     pub neighbors: RefCell<Vec<Rc<GraphNode>>>,
> }
> 
> impl GraphNode {
>     pub fn new(id: usize) -> Self {
>         Self {
>             id,
>             state: Cell::new(NodeState::Unvisited),
>             neighbors: RefCell::new(Vec::new()),
>         }
>     }
> 
>     pub fn add_neighbor(&self, neighbor: Rc<GraphNode>) {
>         self.neighbors.borrow_mut().push(neighbor);
>     }
> 
>     pub fn state(&self) -> NodeState {
>         self.state.get()
>     }
> 
>     pub fn has_cycle(&self) -> bool {
>         match self.state.get() {
>             NodeState::Visiting => true,
>             NodeState::Visited => false,
>             NodeState::Unvisited => {
>                 self.state.set(NodeState::Visiting);
>                 // Snapshot neighbor smart pointers to release RefCell borrow early
>                 let neighbors = self.neighbors.borrow().clone();
>                 for neighbor in neighbors {
>                     if neighbor.has_cycle() {
>                         return true;
>                     }
>                 }
>                 self.state.set(NodeState::Visited);
>                 false
>             }
>         }
>     }
> 
>     pub fn reset_states(&self) {
>         if self.state.get() != NodeState::Unvisited {
>             self.state.set(NodeState::Unvisited);
>             let neighbors = self.neighbors.borrow().clone();
>             for neighbor in neighbors {
>                 neighbor.reset_states();
>             }
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_graph_traversal_cycle_detection() {
>         let n0 = Rc::new(GraphNode::new(0));
>         let n1 = Rc::new(GraphNode::new(1));
>         let n2 = Rc::new(GraphNode::new(2));
> 
>         // Construct acyclic graph: 0 -> 1 -> 2
>         n0.add_neighbor(Rc::clone(&n1));
>         n1.add_neighbor(Rc::clone(&n2));
> 
>         assert!(!n0.has_cycle());
>         assert_eq!(n0.state(), NodeState::Visited);
>         assert_eq!(n1.state(), NodeState::Visited);
>         assert_eq!(n2.state(), NodeState::Visited);
> 
>         // Reset graph state back to Unvisited
>         n0.reset_states();
>         assert_eq!(n0.state(), NodeState::Unvisited);
>         assert_eq!(n1.state(), NodeState::Unvisited);
> 
>         // Construct cycle: 2 -> 0 (forming 0 -> 1 -> 2 -> 0)
>         n2.add_neighbor(Rc::clone(&n0));
>         assert!(n0.has_cycle());
>         assert!(matches!(n0.state(), NodeState::Visiting | NodeState::Visited));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Decoupling Data Structure interior mutability**: Graph topology (the `Vec` of outgoing edges) requires heap allocation and dynamic growing, making `RefCell<Vec<Rc<GraphNode>>>` appropriate. Conversely, algorithm visitation flags (`NodeState`) are tiny 1-byte enums implementing `Copy`. Utilizing `Cell<NodeState>` avoids borrowing guards for node states completely.
> 2. **Reentrancy Safety in Graph Traversal**: If `state` were tracked via `RefCell<NodeState>`, re-entering a node during cycle detection while a `borrow_mut()` was active on its state would trigger a runtime panic `AlreadyBorrowed`. Because `Cell<NodeState>` immediately sets the byte value by value copy without returning references or guards, re-entrant checks (`state.get() == Visiting`) execute safely without panicking.
> 3. **Lifetime & Snapshot Borrowing**: `self.neighbors.borrow().clone()` clones the vector of shared `Rc` pointers to instantly drop the `RefCell` borrow guard before invoking the recursive `neighbor.has_cycle()` call. This ensures no dynamic borrows persist across stack frames during recursion.
> 4. **Memory Layout Efficiency**: `Cell<NodeState>` occupies exactly 1 byte (plus alignment padding matching `NodeState`), achieving zero overhead compared to `RefCell<T>` which adds a 64-bit `isize` borrow counter.

---

### Exercise 3: Arena Memory Allocator Metrics & High-Watermark Tracker

**Problem:**
In high-throughput memory allocators or zero-allocation pool managers, allocator telemetry (total bytes allocated, active allocation count, peak high-water mark, failed allocation attempts) must be updated inside immutable `&self` allocation calls (`fn record_allocation(&self, size: usize)`).

Implement an `ArenaMetrics` telemetry system using `Cell<usize>` and `Cell<AllocatorTelemetry>`.

**Requirements:**
1. Define `#[derive(Debug, Clone, Copy, PartialEq, Eq)]` struct `AllocatorTelemetry` holding `total_allocated_bytes: usize`, `active_allocations: usize`, `peak_watermark_bytes: usize`, and `failed_allocations: usize`.
2. Define struct `ArenaMetrics` holding `capacity_bytes: usize`, `current_offset: Cell<usize>`, and `telemetry: Cell<AllocatorTelemetry>`.
3. Implement `record_allocation(&self, size: usize) -> Result<usize, &'static str>`:
   - If `current_offset + size <= capacity_bytes`, update offset, increment `total_allocated_bytes` and `active_allocations`, update `peak_watermark_bytes` if current offset exceeds previous peak, write updated telemetry back, and return `Ok(previous_offset)`.
   - If allocation exceeds capacity, increment `failed_allocations` in telemetry and return `Err("Out of memory")`.
4. Implement `record_deallocation(&self, size: usize)` to decrement `active_allocations` (saturating at 0).
5. Implement `reset(&self)` to reset `current_offset` to 0 and `active_allocations` to 0 while preserving historical `total_allocated_bytes`, `peak_watermark_bytes`, and `failed_allocations`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::cell::Cell;
> 
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub struct AllocatorTelemetry {
>     pub total_allocated_bytes: usize,
>     pub active_allocations: usize,
>     pub peak_watermark_bytes: usize,
>     pub failed_allocations: usize,
> }
> 
> impl AllocatorTelemetry {
>     pub const fn empty() -> Self {
>         Self {
>             total_allocated_bytes: 0,
>             active_allocations: 0,
>             peak_watermark_bytes: 0,
>             failed_allocations: 0,
>         }
>     }
> }
> 
> pub struct ArenaMetrics {
>     capacity_bytes: usize,
>     current_offset: Cell<usize>,
>     telemetry: Cell<AllocatorTelemetry>,
> }
> 
> impl ArenaMetrics {
>     pub fn new(capacity_bytes: usize) -> Self {
>         Self {
>             capacity_bytes,
>             current_offset: Cell::new(0),
>             telemetry: Cell::new(AllocatorTelemetry::empty()),
>         }
>     }
> 
>     pub fn record_allocation(&self, size: usize) -> Result<usize, &'static str> {
>         let offset = self.current_offset.get();
>         if offset + size <= self.capacity_bytes {
>             let start_offset = offset;
>             let new_offset = offset + size;
>             self.current_offset.set(new_offset);
> 
>             let mut stats = self.telemetry.get();
>             stats.total_allocated_bytes += size;
>             stats.active_allocations += 1;
>             if new_offset > stats.peak_watermark_bytes {
>                 stats.peak_watermark_bytes = new_offset;
>             }
>             self.telemetry.set(stats);
> 
>             Ok(start_offset)
>         } else {
>             let mut stats = self.telemetry.get();
>             stats.failed_allocations += 1;
>             self.telemetry.set(stats);
> 
>             Err("Out of memory")
>         }
>     }
> 
>     pub fn record_deallocation(&self, _size: usize) {
>         let mut stats = self.telemetry.get();
>         stats.active_allocations = stats.active_allocations.saturating_sub(1);
>         self.telemetry.set(stats);
>     }
> 
>     pub fn reset(&self) {
>         self.current_offset.set(0);
>         let mut stats = self.telemetry.get();
>         stats.active_allocations = 0;
>         self.telemetry.set(stats);
>     }
> 
>     pub fn snapshot(&self) -> AllocatorTelemetry {
>         self.telemetry.get()
>     }
> 
>     pub fn current_offset(&self) -> usize {
>         self.current_offset.get()
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_arena_allocator_metrics() {
>         let arena = ArenaMetrics::new(1024);
> 
>         // Verify initial telemetry state
>         let init_stats = arena.snapshot();
>         assert_eq!(init_stats.total_allocated_bytes, 0);
>         assert_eq!(init_stats.active_allocations, 0);
> 
>         // Perform valid allocations and verify offsets
>         let addr1 = arena.record_allocation(256);
>         assert_eq!(addr1, Ok(0));
>         assert_eq!(arena.current_offset(), 256);
> 
>         let addr2 = arena.record_allocation(512);
>         assert_eq!(addr2, Ok(256));
>         assert_eq!(arena.current_offset(), 768);
> 
>         let stats = arena.snapshot();
>         assert_eq!(stats.total_allocated_bytes, 768);
>         assert_eq!(stats.active_allocations, 2);
>         assert_eq!(stats.peak_watermark_bytes, 768);
>         assert_eq!(stats.failed_allocations, 0);
> 
>         // Trigger allocation failure when exceeding capacity
>         let err = arena.record_allocation(500);
>         assert!(matches!(err, Err("Out of memory")));
>         let stats_after_fail = arena.snapshot();
>         assert_eq!(stats_after_fail.failed_allocations, 1);
>         assert_eq!(stats_after_fail.total_allocated_bytes, 768);
> 
>         // Record deallocation and verify active count
>         arena.record_deallocation(256);
>         assert_eq!(arena.snapshot().active_allocations, 1);
> 
>         // Reset arena and verify watermark preservation
>         arena.reset();
>         assert_eq!(arena.current_offset(), 0);
>         let reset_stats = arena.snapshot();
>         assert_eq!(reset_stats.active_allocations, 0);
>         assert_eq!(reset_stats.peak_watermark_bytes, 768);
>         assert_eq!(reset_stats.failed_allocations, 1);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Read-Modify-Write Pattern with `Cell<Copy>`**: Because `AllocatorTelemetry` implements `Copy`, updating it inside `record_allocation` follows a safe three-step Read-Modify-Write sequence: copy the struct out with `.get()`, mutate local fields on the stack, and write the struct back with `.set()`. Because no references point into the interior of the `Cell`, no aliasing violations can occur.
> 2. **Performance Mechanics vs `RefCell`**: A `RefCell<AllocatorTelemetry>` would perform atomic or integer borrow-counter modifications and conditional branching on every read/write operation. `Cell<T>` compiles down to simple move/store instructions without any branch instructions, making it ideal for hot memory allocation paths.
> 3. **Thread-Safety Guarantees (`!Sync`)**: `Cell<T>` does not use atomic instructions (`std::sync::atomic`). Therefore, Rust marks `Cell<T>` as `!Sync`, ensuring that `&ArenaMetrics` cannot be shared across multiple threads simultaneously. Attempting to pass `&ArenaMetrics` to `std::thread::spawn` yields a compile-time error (`E0277`), preventing data races.
> 4. **Memory Layout and Invariants**: `Cell<AllocatorTelemetry>` has the exact same memory layout, alignment, and size as `AllocatorTelemetry` (32 bytes on 64-bit systems). The underlying `UnsafeCell` informs LLVM that memory behind `&Cell` can mutate, preventing incorrect compiler optimizations such as constant propagation across calls.

---

## 6. Related Terms

- [`RefCell<T>`](../level_03/refcell_t.md) — The heavy-duty version of `Cell` used for Heap data (like `String` and `Vec`).
- [Interior Mutability](../level_03/interior_mutability.md) — The official name for the design pattern that both `Cell` and `RefCell` enable.

---

## 7. Key Takeaways

- `Cell<T>` allows you to bypass the strict Borrow Checker and mutate data that is declared as immutable.
- Unlike `RefCell`, it has **zero runtime overhead** and will **never panic**.
- It achieves this by never giving out references. It only ever gives out cheap copies of the data.
- Because it relies on cheap copies, it is only meant for data that implements the **`Copy` trait** (like `i32`, `bool`, `f64`).
- To read the data, use `.get()`. To overwrite the data, use `.set()`.
