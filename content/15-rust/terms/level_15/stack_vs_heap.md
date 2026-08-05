# Stack vs Heap

> **Level 15 — Performance & Optimization**
> The two fundamental regions of RAM available to a Rust program: the Stack (ultra-fast, LIFO ordered, fixed-size allocation managed automatically per stack frame) and the Heap (flexible, dynamically-sized allocation managed deterministically via ownership and smart pointers like `Box<T>` and `Vec<T>`).

---

## 1. Prerequisites


- [Ownership](../level_03/ownership.md) — Rust's deterministic memory management model without a garbage collector.
- [Smart Pointers (`Box`, `Rc`, `Arc`)](../level_10/smart_pointers.md) — Smart pointer types used to allocate memory on the heap.
- [Dynamically Sized Types (DSTs)](../level_11/dynamically_sized_types.md) — Types whose size is unknown at compile time, requiring heap storage behind pointers.

---

## 2. Term Category

**Memory / Performance**: Stack vs Heap is a core computer systems concept. In Rust, understanding the performance trade-offs between stack and heap allocations is critical for writing high-performance systems code. Values stored on the stack must have a known, fixed size at compile time (`Sized`), while values allocated on the heap (`Box`, `Vec`, `String`) can grow dynamically at runtime.

---

## 3. Environment Context

**Universal Rust**: Stack memory exists across all Rust targets (`std`, `no_std`, embedded microcontrollers). Heap memory requires a memory allocator (available by default in `std`, or configured via `#![no_std]` custom allocators).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"

In high-level garbage-collected languages like JavaScript, Python, or Java:
- Practically every object, array, string, or class instance is automatically allocated on the heap.
- Developers do not choose where data lives in memory.
- The garbage collector (GC) runs in the background, consuming CPU cycles and causing unpredictable latency spikes (GC pauses) to scan heap pointers and free unreferenced memory.

In C and C++:
- Developers must manually call `malloc()` and `free()` for heap memory.
- Forgetting `free()` causes memory leaks; calling `free()` twice causes double-free security crashes.

Rust combines the **ultra-fast performance of manual memory management** with **compile-time safety**:
1. **The Stack**: Used by default for all local variables of known compile-time size (`i32`, `[u8; 64]`, fixed structs). Pushing and popping stack memory is an $O(1)$ CPU instruction pointer movement (adjusting the stack pointer register `RSP`).
2. **The Heap**: Used when data sizes are dynamic (`Vec<T>`, `String`), recursive (linked lists), or shared (`Rc<T>`).
3. **RAII (Drop)**: When a heap-owning type (`Box<T>` or `Vec<T>`) goes out of scope, Rust automatically generates code at compile time to deallocate the heap memory immediately. No garbage collector required!

### (2) Reality Metaphor

Imagine a **Desk-top Sticky Note Pad vs a Warehouse Rental Facility**:

- **The Stack** is like a stack of sticky notes on your desk:
  - You grab notes off the top and place them back on top in strict last-in, first-out order (**LIFO stack frames**).
  - It takes zero travel time: your hand moves 2 inches (**adjust CPU stack pointer register**).
  - The desk surface area is small and limited (**fixed stack size limit, typically 2 MB**).
- **The Heap** is a large commercial rental warehouse across town:
  - When you need to store 500 large cardboard boxes (**dynamically sized `Vec<T>`**), you call the warehouse manager (**invoke allocator `malloc`**).
  - The manager searches for an empty room big enough (**find contiguous free heap block**), signs a lease contract (**returns pointer address**), and hands you a key card (**pointer on the stack**).
  - It takes travel time to drive to the warehouse and unlock the room (**pointer dereferencing & allocation overhead**), but the warehouse can store massive, growing inventory.

### (3) Code Examples

#### Short Snippet (Inspecting Stack vs Heap Addresses)

```rust
fn main() {
    // 1. STACK ALLOCATION: Local primitive integer lives directly on the stack
    let stack_val: i32 = 42;

    // 2. HEAP ALLOCATION: `Box::new` allocates 42 on the heap.
    // The Box smart pointer (8-byte pointer) lives on the STACK, pointing to HEAP memory.
    let heap_val: Box<i32> = Box::new(42);

    println!("Address of stack_val (on STACK): {:p}", &stack_val);
    println!("Address of heap_val pointer (on STACK): {:p}", &heap_val);
    println!("Address of heap_val data (on HEAP):    {:p}", heap_val.as_ref());
    // Notice that STACK addresses are close together, while HEAP addresses live in a completely different memory range!
}
```

#### Fuller Example (Optimizing Data Structures by Moving from Heap to Stack)

```rust
use std::time::Instant;

/// Small string optimization using fixed-size stack array vs heap String
fn benchmark_stack_vs_heap() {
    let iterations = 10_000_000;

    // 1. HEAP ALLOCATION BENCHMARK (Vec/String allocation in loop)
    let start_heap = Instant::now();
    let mut heap_sum = 0;
    for i in 0..iterations {
        let v: Vec<u8> = vec![i as u8, (i + 1) as u8]; // Heap allocation every loop iteration!
        heap_sum += v[0] as u64;
    }
    let duration_heap = start_heap.elapsed();

    // 2. STACK ALLOCATION BENCHMARK (Fixed-size stack array)
    let start_stack = Instant::now();
    let mut stack_sum = 0;
    for i in 0..iterations {
        let a: [u8; 2] = [i as u8, (i + 1) as u8]; // Pure stack allocation, 0 heap calls!
        stack_sum += a[0] as u64;
    }
    let duration_stack = start_stack.elapsed();

    println!("Heap allocation loop duration:  {:?}", duration_heap);
    println!("Stack allocation loop duration: {:?}", duration_stack);
    assert_eq!(heap_sum, stack_sum);
}

fn main() {
    benchmark_stack_vs_heap();
}
```

---

## 4. Stack vs Heap Comparison Matrix

| Feature | The Stack | The Heap |
| :--- | :--- | :--- |
| **Allocation Speed** | Ultra-fast ($O(1)$, single CPU pointer adjustment) | Slower (requires searching free lists in memory allocator) |
| **Access Speed** | Fast (high CPU L1/L2 cache locality) | Slightly slower (pointer dereference required) |
| **Size Limit** | Small & fixed (typically 2–8 MB; stack overflow if exceeded) | Large (limited only by available system RAM) |
| **Sizing Rules** | Must be known at compile time (`Sized`) | Can grow or shrink dynamically at runtime (`Vec`, `String`) |
| **Deallocation** | Automatic (popped when stack frame function exits) | Deterministic via RAII `Drop` when owner goes out of scope |
| **Common Types** | `i32`, `f64`, `bool`, `[T; N]`, raw references `&T` | `Box<T>`, `Vec<T>`, `String`, `Rc<T>`, `Arc<T>`, `HashMap` |

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Causing a Stack Overflow via Massive Stack Allocations or Deep Recursion

**The mistake:** Allocating a huge array directly on the stack (e.g. `let buffer = [0u8; 10_000_000];`) or writing unbounded recursive functions.

**Why it's wrong:** The stack has a small fixed memory size limit (typically 2 MB). Allocating arrays larger than the stack limit triggers an immediate process crash (`stack overflow`).

*Incorrect:*
```rust
fn main() {
    // ❌ Stack Overflow Crash! Attempting to allocate 10 MB on 2 MB stack.
    let huge_buffer = [0u8; 10_000_000]; 
}
```

*Fix:*
```rust
fn main() {
    // Correct: Allocate large buffers on the HEAP using Vec or Box
    let huge_buffer: Vec<u8> = vec![0u8; 10_000_000]; // Heap allocation
}
```

### Mistake 2: Unnecessary Heap Allocation inside Performance-Critical Loops

**The mistake:** Calling `format!()`, `to_string()`, or `vec![]` inside a hot loop when a fixed-size stack buffer or slice could be reused.

**Why it's wrong:** Repeatedly invoking the global heap allocator in a loop (`malloc` / `free`) incurs significant lock contention and allocator search overhead.

*Incorrect:*
```rust
for i in 0..1_000_000 {
    // ❌ Allocates a new String on the heap 1,000,000 times!
    let s = format!("item_{}", i); 
    process(&s);
}
```

*Fix:*
```rust
use std::fmt::Write;

// Correct: Reuse a single heap buffer across loop iterations
let mut buffer = String::with_capacity(32);
for i in 0..1_000_000 {
    buffer.clear();
    write!(&mut buffer, "item_{}", i).unwrap();
    process(&buffer);
}
```

### Mistake 3: Fearing Heap Allocations Excessive Newtype Wrappers

**The mistake:** Avoiding heap allocations so obsessively that code becomes unmaintainable, unsafe, or uses overly complex fixed stack buffers when a `Box<T>` or `Vec<T>` would be clean and performant enough.

---

## 6. Practice Exercises

### Exercise 1: AST Node Evaluation with `Box<T>` for Infinite Size Resolution & Heap Indirection

**Problem:** In compiler design and expression evaluation engines, abstract syntax trees (AST) represent nested mathematical expressions. A naive recursive enum definition such as `enum Expr { Val(i64), Add(Expr, Expr) }` fails to compile in Rust because `Expr` would have an infinite size at compile time (`E0072`). Furthermore, placing massive AST structures directly on the call stack risks triggering stack overflow when deeply nested expressions are evaluated.

Implement a recursive expression evaluator `Expr` that uses `Box<Expr>` to break the infinite type size, ensuring `std::mem::size_of::<Expr>()` remains small and constant on the stack while node payloads are allocated on the heap. Write an `eval(&self) -> i64` method, a helper function to measure total heap nodes, and unit tests validating evaluation correctness and memory layout.

> [!check]- Answer
> ```rust
> #[derive(Debug, PartialEq, Eq)]
> pub enum Expr {
>     Literal(i64),
>     Add(Box<Expr>, Box<Expr>),
>     Multiply(Box<Expr>, Box<Expr>),
> }
> 
> impl Expr {
>     /// Recursively evaluates the arithmetic expression.
>     pub fn eval(&self) -> i64 {
>         match self {
>             Expr::Literal(val) => *val,
>             Expr::Add(left, right) => left.eval() + right.eval(),
>             Expr::Multiply(left, right) => left.eval() * right.eval(),
>         }
>     }
> 
>     /// Helper to count total heap allocations (nodes behind Box).
>     pub fn heap_node_count(&self) -> usize {
>         match self {
>             Expr::Literal(_) => 0,
>             Expr::Add(left, right) | Expr::Multiply(left, right) => {
>                 2 + left.heap_node_count() + right.heap_node_count()
>             }
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
>     use std::mem::size_of;
> 
>     #[test]
>     fn test_ast_evaluation_and_memory_layout() {
>         // Build AST: (5 + 3) * 10
>         //       *
>         //      / \
>         //     +   10
>         //    / \
>         //   5   3
>         let expr = Expr::Multiply(
>             Box::new(Expr::Add(
>                 Box::new(Expr::Literal(5)),
>                 Box::new(Expr::Literal(3)),
>             )),
>             Box::new(Expr::Literal(10)),
>         );
> 
>         // 1. Verify arithmetic evaluation
>         assert_eq!(expr.eval(), 80);
> 
>         // 2. Verify stack size of the top-level Expr enum is small & fixed (24 bytes on 64-bit target)
>         // Discriminant (1 byte + alignment) + 2 pointers (2 * 8 bytes) = 24 bytes
>         assert_eq!(size_of::<Expr>(), 24);
> 
>         // 3. Verify total heap nodes allocated
>         assert_eq!(expr.heap_node_count(), 4);
> 
>         // 4. Verify stack vs heap pointer locations
>         let stack_addr = &expr as *const Expr as usize;
>         if let Expr::Multiply(ref left_box, _) = expr {
>             let heap_addr = &**left_box as *const Expr as usize;
>             // The heap address and stack address belong to distinct memory segments
>             assert_ne!(stack_addr, heap_addr);
>         } else {
>             panic!("Expected Multiply variant");
>         }
>     }
> }
> ```
> 
> **Explanation:**
> 1. **Infinite Size Resolution (`E0072`)**: Without `Box<T>`, calculating `size_of::<Expr>()` requires knowing the size of `Expr`, which contains two `Expr`s, leading to infinite compile-time size. Replacing `Expr` with `Box<Expr>` stores an 8-byte pointer (on 64-bit architectures) inside the enum, giving `Expr` a fixed size on the stack.
> 2. **Stack Footprint**: The `Expr` enum header lives on the stack frame and occupies only 24 bytes (1 byte enum discriminant + padding + 2 $\times$ 8-byte `Box` pointers). The actual tree nodes live on the heap.
> 3. **Recursive Traversal & Evaluation**: Calling `left.eval()` dereferences the `Box<Expr>` pointer to read heap memory and evaluate sub-expressions recursively.
> 4. **Deterministic Deallocation**: When `expr` goes out of scope, Rust's `Drop` implementation for `Box` recursively frees all child nodes allocated on the heap without requiring a garbage collector.

---

### Exercise 2: Small Vector Optimization (Stack-First Allocation with Heap Fallback)

**Problem:** High-throughput web servers parse HTTP headers for every incoming request. The vast majority of HTTP requests contain 8 or fewer headers. Allocating a heap-backed `Vec<Header>` for every single request causes severe global memory allocator lock contention and cache misses.

Implement a stack-first small vector `SmallHeaderBuffer<const N: usize>` that stores up to `N` items directly in an inline stack array (`[Option<Header>; N]`) without any heap allocation. If the number of items exceeds `N`, it dynamically spills over and migrates all elements into a heap-allocated `Vec<Header>`. Include helper methods to query whether memory is currently on the stack vs heap, and write unit tests to verify stack-to-heap transition behavior.

> [!check]- Answer
> ```rust
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub struct Header {
>     pub name: &'static str,
>     pub value: &'static str,
> }
> 
> #[derive(Debug)]
> pub enum SmallHeaderBuffer<const N: usize> {
>     Stack {
>         data: [Option<Header>; N],
>         len: usize,
>     },
>     Heap(Vec<Header>),
> }
> 
> impl<const N: usize> SmallHeaderBuffer<N> {
>     pub fn new() -> Self {
>         // Initialize inline stack storage with None
>         Self::Stack {
>             data: [None; N],
>             len: 0,
>         }
>     }
> 
>     pub fn len(&self) -> usize {
>         match self {
>             Self::Stack { len, .. } => *len,
>             Self::Heap(vec) => vec.len(),
>         }
>     }
> 
>     pub fn is_empty(&self) -> bool {
>         self.len() == 0
>     }
> 
>     pub fn is_heap(&self) -> bool {
>         matches!(self, Self::Heap(_))
>     }
> 
>     pub fn push(&mut self, header: Header) {
>         match self {
>             Self::Stack { data, len } => {
>                 if *len < N {
>                     data[*len] = Some(header);
>                     *len += 1;
>                 } else {
>                     // Capacity N exceeded: Spill over from Stack to Heap!
>                     let mut vec = Vec::with_capacity(N + 1);
>                     for item in data.iter_mut().take(*len) {
>                         if let Some(h) = item.take() {
>                             vec.push(h);
>                         }
>                     }
>                     vec.push(header);
>                     *self = Self::Heap(vec);
>                 }
>             }
>             Self::Heap(vec) => {
>                 vec.push(header);
>             }
>         }
>     }
> 
>     pub fn get(&self, index: usize) -> Option<&Header> {
>         match self {
>             Self::Stack { data, len } => {
>                 if index < *len {
>                     data[index].as_ref()
>                 } else {
>                     None
>                 }
>             }
>             Self::Heap(vec) => vec.get(index),
>         }
>     }
> }
> 
> impl<const N: usize> Default for SmallHeaderBuffer<N> {
>     fn default() -> Self {
>         Self::new()
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_small_header_buffer_stack_allocation() {
>         let mut buf = SmallHeaderBuffer::<4>::new();
>         assert!(!buf.is_heap());
>         assert_eq!(buf.len(), 0);
> 
>         buf.push(Header { name: "Host", value: "localhost" });
>         buf.push(Header { name: "Accept", value: "text/html" });
> 
>         assert!(!buf.is_heap(), "Buffer should remain on stack when count <= 4");
>         assert_eq!(buf.len(), 2);
>         assert_eq!(buf.get(0).unwrap().name, "Host");
>         assert_eq!(buf.get(1).unwrap().value, "text/html");
>     }
> 
>     #[test]
>     fn test_small_header_buffer_spillover_to_heap() {
>         let mut buf = SmallHeaderBuffer::<2>::new();
>         
>         // Fill stack capacity (N = 2)
>         buf.push(Header { name: "h1", value: "v1" });
>         buf.push(Header { name: "h2", value: "v2" });
>         assert!(!buf.is_heap());
> 
>         // Push 3rd item -> Triggers migration to heap
>         buf.push(Header { name: "h3", value: "v3" });
>         assert!(buf.is_heap(), "Buffer should spill over to heap when count > 2");
>         assert_eq!(buf.len(), 3);
> 
>         assert_eq!(buf.get(0).unwrap().value, "v1");
>         assert_eq!(buf.get(1).unwrap().value, "v2");
>         assert_eq!(buf.get(2).unwrap().value, "v3");
>     }
> }
> ```
> 
> **Explanation:**
> 1. **Small Buffer Optimization Pattern**: By leveraging Rust const generics (`const N: usize`), `SmallHeaderBuffer` allocates fixed inline storage on the stack frame. Common payloads ($N \le 4$) execute with zero heap allocation calls (`malloc`/`free`).
> 2. **In-place State Transition**: When `len == N` and `push` is called, the buffer transfers existing elements from inline stack memory into a newly allocated heap `Vec`, replacing `*self` with `Self::Heap(vec)`.
> 3. **Cache Locality**: Storing elements on the stack keeps data contiguous in CPU L1/L2 cache lines, significantly improving iteration speed over heap-allocated vectors for short-lived HTTP requests.
> 4. **Safety & Take Semantics**: `item.take()` safely extracts values out of `Option<Header>` stack slots without duplicating or dropping uninitialized memory.

---

### Exercise 3: Zero-Allocation Stack Ring Buffer for Embedded Microcontrollers (`#![no_std]`)

**Problem:** In embedded systems (such as ARM Cortex-M microcontrollers operating under `#![no_std]`), global heap allocators are often disabled to prevent runtime memory fragmentation, non-deterministic latency, and out-of-memory panics. An automotive sensor sampling module requires a fixed-capacity ring buffer to record incoming ADC (Analog-to-Digital Converter) voltage readings entirely on the stack.

Implement a `#![no_std]` compatible `StackRingBuffer<const CAP: usize>` that allocates zero heap memory, maintains a sliding window of sensor readings, overwrites the oldest sample when capacity is reached, and calculates the moving average. Include unit tests demonstrating zero heap allocation and correct circular overwriting.

> [!check]- Answer
> ```rust
> #![no_std]
> 
> /// Fixed-capacity ring buffer operating entirely on stack memory.
> pub struct StackRingBuffer<const CAP: usize> {
>     data: [f32; CAP],
>     head: usize,
>     len: usize,
> }
> 
> impl<const CAP: usize> StackRingBuffer<CAP> {
>     /// Constructs a new empty stack ring buffer.
>     pub const fn new() -> Self {
>         assert!(CAP > 0, "Capacity must be greater than zero");
>         Self {
>             data: [0.0; CAP],
>             head: 0,
>             len: 0,
>         }
>     }
> 
>     /// Pushes a new sensor reading into the buffer.
>     /// Overwrites the oldest reading if the buffer is full.
>     pub fn push(&mut self, sample: f32) {
>         self.data[self.head] = sample;
>         self.head = (self.head + 1) % CAP;
>         if self.len < CAP {
>             self.len += 1;
>         }
>     }
> 
>     /// Returns the current number of elements in the buffer.
>     pub fn len(&self) -> usize {
>         self.len
>     }
> 
>     /// Returns true if buffer contains no elements.
>     pub fn is_empty(&self) -> bool {
>         self.len == 0
>     }
> 
>     /// Calculates the moving average of all recorded samples.
>     pub fn moving_average(&self) -> f32 {
>         if self.len == 0 {
>             return 0.0;
>         }
>         let sum: f32 = self.data[..self.len].iter().sum();
>         sum / (self.len as f32)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
>     use core::mem::size_of;
> 
>     #[test]
>     fn test_stack_ring_buffer_operations() {
>         let mut sensor_buf = StackRingBuffer::<4>::new();
>         assert_eq!(sensor_buf.len(), 0);
>         assert_eq!(sensor_buf.moving_average(), 0.0);
> 
>         // Push samples: [10.0, 20.0, 30.0, 40.0]
>         sensor_buf.push(10.0);
>         sensor_buf.push(20.0);
>         sensor_buf.push(30.0);
>         sensor_buf.push(40.0);
> 
>         assert_eq!(sensor_buf.len(), 4);
>         assert_eq!(sensor_buf.moving_average(), 25.0); // (10+20+30+40)/4 = 25.0
> 
>         // Push 5th sample: Overwrites 10.0 with 50.0 -> [50.0, 20.0, 30.0, 40.0]
>         sensor_buf.push(50.0);
>         assert_eq!(sensor_buf.len(), 4);
>         assert_eq!(sensor_buf.moving_average(), 35.0); // (50+20+30+40)/4 = 35.0
>     }
> 
>     #[test]
>     fn test_exact_stack_memory_footprint() {
>         // Stack Ring Buffer of 4 x f32 (16 bytes) + 2 x usize (16 bytes on 64-bit target) = 32 bytes
>         let buf = StackRingBuffer::<4>::new();
>         assert_eq!(size_of::<StackRingBuffer<4>>(), 32);
>     }
> }
> ```
> 
> **Explanation:**
> 1. **`#![no_std]` Safety**: `StackRingBuffer` relies solely on core language primitive types (`f32`, `usize`, fixed arrays `[f32; CAP]`). It does not import `std` or `alloc`, guaranteeing compatibility with bare-metal microcontrollers without a dynamic memory allocator.
> 2. **Deterministic Const Initialization**: `StackRingBuffer::new()` is declared `const fn`, allowing the buffer to be allocated at compile time in `.bss` or directly on the function stack frame.
> 3. **Fixed Memory Footprint**: `size_of::<StackRingBuffer<4>>()` equals $4 \times 4$ bytes (`f32` array) $+ 2 \times 8$ bytes (`head` and `len` indices), occupying exactly 32 bytes on the stack with zero risk of heap fragmentation.
> 4. **Circular Modulo Arithmetic**: `(self.head + 1) % CAP` efficiently recycles array indices in constant $O(1)$ time without re-allocating or shifting memory elements.
> 
---

### Exercise 4: Memory Cache Locality & Dereference Cost (Contiguous Stack Slices vs Vector of Heap Boxes)

**Problem:** In real-time graphics rendering engines and high-frequency financial calculations, data layout determines performance. Storing a collection of 3D spatial points as a contiguous stack array `[Point3D; N]` allows the CPU prefetcher to load adjacent points directly into high-speed L1/L2 cache lines. Conversely, storing points as a collection of heap smart pointers `Vec<Box<Point3D>>` forces the CPU to follow indirect pointer jumps across disparate heap memory addresses, causing frequent CPU cache misses.

Write a benchmark and verification suite containing a `Point3D` struct. Implement two spatial centroid calculation functions: one operating on a contiguous slice `&[Point3D]` (stack/contiguous layout) and another operating on `&[Box<Point3D>]` (heap-indirection layout). Write unit tests verifying that both approaches compute identical results and inspect the memory addresses to prove contiguous stack layout vs pointer indirection on the heap.

> [!check]- Answer
> ```rust
> #[derive(Debug, Clone, Copy, PartialEq)]
> pub struct Point3D {
>     pub x: f64,
>     pub y: f64,
>     pub z: f64,
> }
> 
> /// Compute centroid using contiguous memory layout (high CPU cache locality)
> pub fn compute_centroid_contiguous(points: &[Point3D]) -> Point3D {
>     if points.is_empty() {
>         return Point3D { x: 0.0, y: 0.0, z: 0.0 };
>     }
>     let mut sum_x = 0.0;
>     let mut sum_y = 0.0;
>     let mut sum_z = 0.0;
> 
>     for p in points {
>         sum_x += p.x;
>         sum_y += p.y;
>         sum_z += p.z;
>     }
> 
>     let count = points.len() as f64;
>     Point3D {
>         x: sum_x / count,
>         y: sum_y / count,
>         z: sum_z / count,
>     }
> }
> 
> /// Compute centroid using boxed heap pointers (pointer indirection penalty)
> pub fn compute_centroid_boxed(points: &[Box<Point3D>]) -> Point3D {
>     if points.is_empty() {
>         return Point3D { x: 0.0, y: 0.0, z: 0.0 };
>     }
>     let mut sum_x = 0.0;
>     let mut sum_y = 0.0;
>     let mut sum_z = 0.0;
> 
>     for p_box in points {
>         sum_x += p_box.x; // Indirection: Dereferences Box pointer to read heap memory
>         sum_y += p_box.y;
>         sum_z += p_box.z;
>     }
> 
>     let count = points.len() as f64;
>     Point3D {
>         x: sum_x / count,
>         y: sum_y / count,
>         z: sum_z / count,
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_centroid_equivalence_and_address_contiguity() {
>         // 1. Contiguous Stack Allocation
>         let stack_points: [Point3D; 3] = [
>             Point3D { x: 1.0, y: 2.0, z: 3.0 },
>             Point3D { x: 4.0, y: 5.0, z: 6.0 },
>             Point3D { x: 7.0, y: 8.0, z: 9.0 },
>         ];
> 
>         // 2. Boxed Heap Allocation
>         let boxed_points: Vec<Box<Point3D>> = vec![
>             Box::new(Point3D { x: 1.0, y: 2.0, z: 3.0 }),
>             Box::new(Point3D { x: 4.0, y: 5.0, z: 6.0 }),
>             Box::new(Point3D { x: 7.0, y: 8.0, z: 9.0 }),
>         ];
> 
>         // 3. Assert mathematical result equivalence
>         let c1 = compute_centroid_contiguous(&stack_points);
>         let c2 = compute_centroid_boxed(&boxed_points);
>         assert_eq!(c1, Point3D { x: 4.0, y: 5.0, z: 6.0 });
>         assert_eq!(c1, c2);
> 
>         // 4. Verify contiguous memory layout of stack array
>         let ptr0 = &stack_points[0] as *const Point3D as usize;
>         let ptr1 = &stack_points[1] as *const Point3D as usize;
>         let stride = std::mem::size_of::<Point3D>(); // 3 * 8 = 24 bytes
>         assert_eq!(ptr1 - ptr0, stride, "Stack elements must be laid out contiguously");
> 
>         // 5. Inspect boxed pointers: the pointers in Vec are contiguous, but pointed-to data live on heap
>         let box0_heap_addr = &*boxed_points[0] as *const Point3D as usize;
>         let box1_heap_addr = &*boxed_points[1] as *const Point3D as usize;
>         assert_ne!(box0_heap_addr, ptr0);
>         // Heap allocations may have padding/header metadata between them
>         assert!(box0_heap_addr != box1_heap_addr);
>     }
> }
> ```
> 
> **Explanation:**
> 1. **Contiguous Cache Locality**: `stack_points` allocates 72 contiguous bytes ($3 \times 24$ bytes) directly on the stack. Iterating through `&[Point3D]` allows CPU hardware prefetchers to load sequential memory addresses into CPU L1 cache with zero cache misses.
> 2. **Pointer Indirection Overhead**: `Vec<Box<Point3D>>` stores 3 pointers (24 bytes) in the vector memory buffer, but each pointer targets a separate 24-byte block scattered across heap memory. Traversing `p_box.x` forces the CPU to perform a pointer dereference to an arbitrary heap location, risking cache line misses.
> 3. **Memory Layout Verification**: The test proves that `ptr1 - ptr0` equals `size_of::<Point3D>()` (24 bytes), demonstrating exact contiguous memory packing for stack arrays.

---

## 7. Related Terms


- [Ownership](../level_03/ownership.md) — Memory ownership rules managing stack/heap deallocation.
- [Smart Pointers (`Box`, `Rc`, `Arc`)](../level_10/smart_pointers.md) — Heap allocation wrappers.
- [Dynamically Sized Types (DSTs)](../level_11/dynamically_sized_types.md) — Types requiring heap pointers due to unknown compile-time size.
- [Allocator API](allocator_api.md) — Custom global heap memory allocators.

---

## 8. Key Takeaways

- The **Stack** stores fixed-size local variables (`Sized`); allocation is $O(1)$ and ultra-fast via CPU stack pointer movement.
- The **Heap** stores dynamic or large data (`Vec`, `Box`, `String`); allocation requires requesting memory from the system memory allocator.
- Rust deallocates heap memory deterministically via RAII `Drop` when the owner goes out of scope — no garbage collector required!
- Avoid allocating large arrays ($>2\text{ MB}$) on the stack to prevent stack overflow crashes.
- Optimize hot performance loops by reusing heap buffers or using fixed-size stack arrays (`[T; N]`).
