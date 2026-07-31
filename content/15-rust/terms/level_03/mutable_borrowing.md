# Mutable Borrowing (`&mut`)

> **Level 3 — Ownership & Borrowing**
> Creating an exclusive mutable reference; only one `&mut` is allowed at a time.

---

## 1. Prerequisites

- [Borrowing (`&`)](../level_03/borrowing.md) — The concept of passing references instead of Ownership.
- [Mutability (`mut`)](../level_01/mutability_mut.md) — The keyword required to allow data to change.
- [Expressions / Blocks](../level_01/expressions.md) — Knowing how `{}` scopes work is critical for managing how long a borrow lasts.

---

## 2. Term Category

**Rust-specific (the strict safety rules)**: While pointers in C++ allow unrestricted and highly dangerous mutation, Rust introduces a strict rule known in computer science as "Aliasing XOR Mutability". You can have many readers, OR exactly one writer, but never both at the same time.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In languages like Java, Python, or C++, multiple variables or threads can hold a reference to the exact same list. If Thread A is looping over the list while Thread B is simultaneously deleting items from it, the program will crash or produce garbage data. This is called a **Data Race**, and it is one of the hardest bugs to track down in programming.

Rust was designed to completely eliminate Data Races at compile time. It does this via the strict rules of **Mutable Borrowing (`&mut`)**. 

Rust guarantees that a mutable reference is *exclusive*. If you hold a `&mut` reference to data, no one else is allowed to hold *any* reference to that data (not even a read-only one!). Because the compiler mathematically proves that the writer is the *only* person accessing the memory, data races are impossible.

### (2) Reality Metaphor

Imagine a **whiteboard** in a conference room.

Standard Borrowing (`&`) is like opening the window blinds. You can have 10 people looking at the whiteboard simultaneously, because looking doesn't change anything.

**Mutable Borrowing (`&mut`)** is handing one person a marker. If someone has a marker and is actively changing the board, you *must close the blinds*. No one else is allowed to even *look* at the board while it's being written to, because they might read half-finished, incorrect data. 

**The Golden Rule:** You can have many readers, or exactly one writer. Never both.

### (3) Rust Code Examples

#### Short Snippet (Modifying Data via Reference)
To mutably borrow data, both the original variable AND the reference must be marked `mut`.
```rust
fn add_world(s: &mut String) {
    s.push_str(" World!");
} // The mutable borrow ends here.

fn main() {
    // 1. The original variable MUST be `mut`
    let mut greeting = String::from("Hello");
    
    // 2. We pass a mutable reference `&mut`
    add_world(&mut greeting);
    
    println!("{}", greeting); // Prints: Hello World!
}
```

#### Fuller Example (The Exclusivity Rule)
The compiler will aggressively stop you if you try to break the Golden Rule.

```rust
fn main() {
    let mut book = String::from("The Rust Book");
    
    // Bob borrows the book mutably (He has the marker!)
    let bob_editor = &mut book;
    
    // Alice tries to borrow the book to read it...
    // let alice_reader = &book; // COMPILER ERROR! You cannot read while Bob is editing!
    
    // Bob tries to give his friend Charlie a marker too...
    // let charlie_editor = &mut book; // COMPILER ERROR! Only ONE marker allowed!
    
    bob_editor.push_str(" - 2nd Edition");
    
    // Bob's borrow ends here. Now it's safe to read again!
    println!("Final book: {}", book); 
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Mutable Borrowing Scoping and Lifecycle Rules

**The mistake:** Assuming Mutable Borrowing instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("mutable_borrowing_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("mutable_borrowing_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Mutable Borrowing State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Mutable Borrowing through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Mutable Borrowing Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Mutable Borrowing instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Zero-Copy Ingest Buffer Framing & Disjoint Mutable Slices

**Scenario:** In high-throughput network packet ingestion pipelines, raw byte arrays must be processed in-place without memory allocation. A contiguous buffer `&mut [u8]` contains a fixed header followed by frame payload data. Naive indexing attempts like `let h = &mut buf[..4]; let p = &mut buf[4..];` fail compile-time borrow checks because the compiler treats `buf` as being borrowed mutably twice.

**Task:** Write a production-grade `PacketStreamProcessor` struct that wraps a mutable slice borrow `&'a mut [u8]`. Implement `split_header_and_payload(&mut self, header_len: usize)` using `split_at_mut` to produce disjoint header and payload mutable slices without violating the aliasing XOR mutability invariant. Implement `transform_in_place` to invert header flags and apply an XOR cipher mask to payload bytes. Include comprehensive unit tests with explicit assertions (`assert!`, `assert_eq!`, `assert_ne!`, `matches!`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq)]
> pub enum PacketError {
>     BufferTooSmall,
>     InvalidHeader,
> }
> 
> pub struct PacketStreamProcessor<'a> {
>     buffer: &'a mut [u8],
> }
> 
> impl<'a> PacketStreamProcessor<'a> {
>     pub fn new(buffer: &'a mut [u8]) -> Self {
>         Self { buffer }
>     }
> 
>     pub fn split_header_and_payload(
>         &mut self,
>         header_len: usize,
>     ) -> Result<(&mut [u8], &mut [u8]), PacketError> {
>         if self.buffer.len() < header_len {
>             return Err(PacketError::BufferTooSmall);
>         }
>         // Safe split into disjoint, non-overlapping mutable slices
>         let (header, payload) = self.buffer.split_at_mut(header_len);
>         Ok((header, payload))
>     }
> 
>     pub fn transform_in_place(
>         &mut self,
>         header_len: usize,
>         key: u8,
>     ) -> Result<(), PacketError> {
>         let (header, payload) = self.split_header_and_payload(header_len)?;
> 
>         if header.is_empty() {
>             return Err(PacketError::InvalidHeader);
>         }
>         // Invert header flags byte in-place
>         header[0] ^= 0xFF;
> 
>         // Apply XOR key transformation across payload slice elements
>         for byte in payload.iter_mut() {
>             *byte ^= key;
>         }
>         Ok(())
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_packet_transformation_success() {
>         let mut raw_bytes = vec![0x01, 0x02, 0x03, 0x04, 0xAA, 0xBB, 0xCC];
>         let mut processor = PacketStreamProcessor::new(&mut raw_bytes);
> 
>         let res = processor.transform_in_place(4, 0x55);
>         assert!(res.is_ok());
> 
>         assert_eq!(raw_bytes[0], 0xFE);
>         assert_eq!(raw_bytes[1], 0x02);
>         assert_eq!(raw_bytes[4], 0xFF);
>         assert_ne!(raw_bytes[4], 0xAA);
>     }
> 
>     #[test]
>     fn test_buffer_too_small_error() {
>         let mut raw_bytes = vec![0x01, 0x02];
>         let mut processor = PacketStreamProcessor::new(&mut raw_bytes);
>         let res = processor.split_header_and_payload(4);
>         assert!(res.is_err());
>         assert!(matches!(res, Err(PacketError::BufferTooSmall)));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
> 
> 
> 1. **Disjoint Mutable Slices & Aliasing XOR Mutability**: The Rust borrow checker enforces that no two mutable references (`&mut T`) can alias the same memory location simultaneously. Sub-slicing a slice twice via index notation (`&mut buf[..4]` and `&mut buf[4..]`) tries to borrow `buf` twice in the same scope. The standard library method `slice::split_at_mut` internally uses safe raw pointer offsets (`from_raw_parts_mut`) to split a single slice pointer into two non-overlapping mutable slices `(&mut [u8], &mut [u8])`. Because the compiler can prove the memory regions do not overlap, both mutable references remain valid without violating exclusivity invariants.
> 
> 2. **Reborrowing Dynamics & Lifetime Elision**: Inside `split_header_and_payload`, passing `&mut self` temporarily reborrows the underlying `self.buffer` for the duration of the method call. The returned slices `(&mut [u8], &mut [u8])` carry lifetimes tied to the reborrow of `self`, ensuring that caller access to `processor` is suspended until the borrowed slices fall out of scope.
> 
> 3. **In-Place Memory Layout & Dereferencing**: The iterator `payload.iter_mut()` yields mutable reference elements (`&mut u8`). Using the dereference operator `*byte ^= key` mutates the underlying heap buffer memory directly, executing with zero temporary memory allocations (`O(1)` space complexity).
> 
> 4. **Edge Cases**: If `self.buffer.len() < header_len`, `split_header_and_payload` fails gracefully returning `Err(PacketError::BufferTooSmall)` before any slice split or unchecked indexing occurs.

---

### Exercise 2: Disjoint Memory Grid Mutation & Simultaneous Index Swapping

**Scenario:** In spatial partitioning grid algorithms (such as game physics grids or 2D matrix solvers backed by flat 1D vectors), two distinct grid cells must be swapped or mutated concurrently. A simple attempt like `let ref_a = &mut grid[i]; let ref_b = &mut grid[j];` causes compiler error `E0499` (cannot borrow `grid` as mutable more than once) because index resolution happens at runtime, while lifetime exclusivity is checked statically.

**Task:** Implement a safe, production-grade `SpatialGridBuffer` struct containing a flat `Vec<u32>` grid representation. Implement `get_mut_two(&mut self, idx_a: usize, idx_b: usize)` using `split_at_mut` to obtain simultaneous exclusive `&mut u32` references to two distinct elements. Implement `swap_cells` to perform zero-allocation element swapping via `std::mem::swap`. Include unit tests verifying valid swaps, out-of-bounds protection, and identical index rejection using explicit assertions (`assert!`, `assert_eq!`, `assert_ne!`, `matches!`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq)]
> pub enum GridError {
>     OutOfBounds,
>     IdenticalIndices,
> }
> 
> pub struct SpatialGridBuffer {
>     cells: Vec<u32>,
>     width: usize,
>     height: usize,
> }
> 
> impl SpatialGridBuffer {
>     pub fn new(width: usize, height: usize, default_val: u32) -> Self {
>         Self {
>             cells: vec![default_val; width * height],
>             width,
>             height,
>         }
>     }
> 
>     pub fn get_mut_two(
>         &mut self,
>         idx_a: usize,
>         idx_b: usize,
>     ) -> Result<(&mut u32, &mut u32), GridError> {
>         if idx_a >= self.cells.len() || idx_b >= self.cells.len() {
>             return Err(GridError::OutOfBounds);
>         }
>         if idx_a == idx_b {
>             return Err(GridError::IdenticalIndices);
>         }
> 
>         let (first_idx, second_idx, is_swapped) = if idx_a < idx_b {
>             (idx_a, idx_b, false)
>         } else {
>             (idx_b, idx_a, true)
>         };
> 
>         // Split at the higher index to create non-overlapping left and right sub-slices
>         let (left_slice, right_slice) = self.cells.split_at_mut(second_idx);
>         let ref_first = &mut left_slice[first_idx];
>         let ref_second = &mut right_slice[0];
> 
>         if is_swapped {
>             Ok((ref_second, ref_first))
>         } else {
>             Ok((ref_first, ref_second))
>         }
>     }
> 
>     pub fn swap_cells(&mut self, idx_a: usize, idx_b: usize) -> Result<(), GridError> {
>         let (ref_a, ref_b) = self.get_mut_two(idx_a, idx_b)?;
>         std::mem::swap(ref_a, ref_b);
>         Ok(())
>     }
> 
>     pub fn get(&self, idx: usize) -> Option<u32> {
>         self.cells.get(idx).copied()
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_disjoint_swap_success() {
>         let mut grid = SpatialGridBuffer::new(2, 2, 0);
>         grid.cells[0] = 10;
>         grid.cells[3] = 99;
> 
>         let res = grid.swap_cells(0, 3);
>         assert!(res.is_ok());
>         assert_eq!(grid.get(0), Some(99));
>         assert_eq!(grid.get(3), Some(10));
>         assert_ne!(grid.get(0), grid.get(3));
>     }
> 
>     #[test]
>     fn test_identical_index_rejection() {
>         let mut grid = SpatialGridBuffer::new(2, 2, 5);
>         let res = grid.swap_cells(1, 1);
>         assert!(res.is_err());
>         assert!(matches!(res, Err(GridError::IdenticalIndices)));
>     }
> 
>     #[test]
>     fn test_out_of_bounds_rejection() {
>         let mut grid = SpatialGridBuffer::new(2, 2, 5);
>         let res = grid.swap_cells(0, 10);
>         assert!(res.is_err());
>         assert!(matches!(res, Err(GridError::OutOfBounds)));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
> 
> 
> 1. **Runtime Index Disjointness vs Static Borrow Rules**: The Rust compiler cannot verify whether runtime variable indices `idx_a` and `idx_b` refer to different memory locations. Attempting to index a collection mutably twice within the same scope violates static aliasing rules. Splitting `self.cells` at `second_idx` divides the vector memory into `left_slice` (indices `0..second_idx`) and `right_slice` (indices `second_idx..len`). Because `first_idx < second_idx`, `first_idx` is safely contained in `left_slice` while `second_idx` corresponds to index `0` of `right_slice`.
> 
> 2. **Memory Layout & In-Place Bitwise Swap**: `std::mem::swap` takes two exclusive mutable references `&mut T` and swaps their binary bit patterns directly in memory using temporary register moves without heap allocation.
> 
> 3. **Non-Lexical Lifetimes (NLL) & Retaining Original Ordering**: The boolean flag `is_swapped` ensures that returned mutable reference tuples `(ref_a, ref_b)` correctly correspond to requested parameter order `(idx_a, idx_b)`.
> 
> 4. **Edge Cases**: When `idx_a == idx_b`, returning two mutable references to the exact same memory element would violate Rust's core safety guarantee (aliasing mutability). Returning `Err(GridError::IdenticalIndices)` prevents undefined behavior and dynamic aliasing bugs.

---

### Exercise 3: Circular Ring Buffer Batch Reborrowing & Partitioned Sub-slice Mutations

**Scenario:** Real-time telemetry systems and DSP audio processors operate on contiguous circular ring buffers. Processing modules must overwrite incoming samples, track evicted metrics, and mutably reborrow buffer halves to apply signal gains or vector DSP operations in-place without taking ownership or reallocating memory.

**Task:** Build a `TelemetryRingBuffer<'a>` struct wrapping a slice reference `&'a mut [f64]`. Implement `push(&mut self, val: f64) -> f64` to write sample data, update ring head, and return the evicted sample value. Implement `split_half_mut` to split the borrowed slice into two distinct mutable halves for parallel sub-slice gain adjustment, and `apply_gain_in_place(&mut self, gain: f64)`. Include full unit tests with explicit assertions (`assert!`, `assert_eq!`, `assert_ne!`, `matches!`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq)]
> pub enum RingBufferError {
>     EmptyBuffer,
>     InvalidChunkSize,
> }
> 
> pub struct TelemetryRingBuffer<'a> {
>     data: &'a mut [f64],
>     head: usize,
> }
> 
> impl<'a> TelemetryRingBuffer<'a> {
>     pub fn new(data: &'a mut [f64]) -> Result<Self, RingBufferError> {
>         if data.is_empty() {
>             return Err(RingBufferError::EmptyBuffer);
>         }
>         Ok(Self { data, head: 0 })
>     }
> 
>     pub fn push(&mut self, val: f64) -> f64 {
>         let evicted = self.data[self.head];
>         self.data[self.head] = val;
>         self.head = (self.head + 1) % self.data.len();
>         evicted
>     }
> 
>     pub fn split_half_mut(
>         &mut self,
>     ) -> Result<(&mut [f64], &mut [f64]), RingBufferError> {
>         let len = self.data.len();
>         if len < 2 {
>             return Err(RingBufferError::InvalidChunkSize);
>         }
>         let mid = len / 2;
>         Ok(self.data.split_at_mut(mid))
>     }
> 
>     pub fn apply_gain_in_place(&mut self, gain: f64) {
>         for sample in self.data.iter_mut() {
>             *sample *= gain;
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_ring_buffer_push_and_eviction() {
>         let mut storage = vec![1.0, 2.0, 3.0];
>         let mut ring = TelemetryRingBuffer::new(&mut storage).unwrap();
> 
>         let evicted1 = ring.push(10.0);
>         assert_eq!(evicted1, 1.0);
>         assert_ne!(storage[0], 1.0);
>         assert_eq!(storage[0], 10.0);
> 
>         ring.apply_gain_in_place(2.0);
>         assert_eq!(storage[0], 20.0);
>         assert_eq!(storage[1], 4.0);
>     }
> 
>     #[test]
>     fn test_split_half_reborrowing() {
>         let mut storage = vec![10.0, 20.0, 30.0, 40.0];
>         let mut ring = TelemetryRingBuffer::new(&mut storage).unwrap();
> 
>         let res = ring.split_half_mut();
>         assert!(res.is_ok());
> 
>         let (left, right) = res.unwrap();
>         left[0] += 5.0;
>         right[0] += 5.0;
> 
>         assert_eq!(storage[0], 15.0);
>         assert_eq!(storage[2], 35.0);
>     }
> 
>     #[test]
>     fn test_empty_buffer_error() {
>         let mut storage: Vec<f64> = vec![];
>         let res = TelemetryRingBuffer::new(&mut storage);
>         assert!(res.is_err());
>         assert!(matches!(res, Err(RingBufferError::EmptyBuffer)));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
> 
> 
> 1. **Mutable Slice Struct Wrappers & Explicit Lifetime `'a`**: `TelemetryRingBuffer<'a>` encapsulates a mutable slice borrow `&'a mut [f64]`. The lifetime parameter `'a` guarantees that `storage` memory owned by the caller outlives the ring buffer instance. While `ring` exists and mutably borrows `storage`, the caller cannot access `storage` directly due to mutable borrow exclusivity.
> 
> 2. **Reborrowing & Transitive Lifetime Exclusivity**: In `split_half_mut(&mut self)`, calling `self.data.split_at_mut(mid)` reborrows the inner slice `&mut [f64]`. The returned pair `(&mut [f64], &mut [f64])` allows modifying the first and second halves of the buffer independently. While `left` and `right` exist, `ring` itself is temporarily reborrowed and cannot be used until `left` and `right` fall out of scope.
> 
> 3. **In-Place Sample Overwrite & Ring Modulo Arithmetic**: `push` overwrites `self.data[self.head]` in-place without allocation. Ring wrap-around is achieved via `(self.head + 1) % len`.
> 
> 4. **Edge Cases**: Passing an empty slice `&mut []` causes `TelemetryRingBuffer::new` to fail immediately with `Err(RingBufferError::EmptyBuffer)`, ensuring all subsequent slice operations like `% self.data.len()` are protected from divide-by-zero panics.

---

## 6. Related Terms

- [Borrow Checker](../level_03/borrow_checker.md) — The strict compiler component that enforces the "One Mutable Borrow" rule.
- [Interior Mutability](../level_03/interior_mutability.md) — (Future reference) Advanced patterns that bypass these strict compile-time rules using runtime checks instead.

---

## 7. Key Takeaways

- **Mutable Borrowing (`&mut`)** allows a function to temporarily modify data without taking ownership.
- The original variable itself must be declared with `mut`.
- Both the sender and receiver must explicitly use `&mut` syntax.
- **The Golden Rule**: You can have either *many immutable borrows (`&`)* OR *exactly one mutable borrow (`&mut`)*. Never both at the same time.
- This strict exclusivity rule completely eliminates Data Races at compile time.
