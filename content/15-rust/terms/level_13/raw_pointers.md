# Raw Pointers (`*const T`, `*mut T`)

> **Level 13 — Unsafe Rust & FFI**
> Unchecked, primitive memory address pointers (`*const T` for immutable, `*mut T` for mutable) that bypass Rust's borrow checker and ownership guarantees.

---

## 1. Prerequisites


- [References and Borrowing (`&`, `&mut`)](../level_01/references_and_borrowing.md) — Understanding standard safe references (`&T`, `&mut T`), borrow lifetimes, and aliasing rules.
- [Undefined Behavior (UB)](undefined_behavior.md) — De-referencing null, dangling, or unaligned raw pointers causes Undefined Behavior.

---

## 2. Term Category

**Memory / Performance / Unsafe**: Raw Pointers are low-level memory primitives in Rust. Represented as `*const T` (immutable raw pointer) and `*mut T` (mutable raw pointer), they store raw numeric memory addresses directly (like C pointers). Unlike safe references (`&T` / `&mut T`), raw pointers ignore lifetimes, can be null, can be dangling, ignore alignment checks, and allow simultaneous mutable aliasing.

---

## 3. Environment Context

**Universal Rust**: Raw pointers are available across all Rust targets (`std`, `no_std`, WASM, embedded). They are fundamental when building custom data structures (`Vec`, `LinkedList`), implementing hardware drivers, calling C functions over FFI, or optimizing memory allocations.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"

Standard Rust references (`&T` and `&mut T`) enforce strict safety invariants enforced by the compiler:
1. They are guaranteed never to be null.
2. They are guaranteed to point to valid, initialized memory.
3. They strictly follow the **aliasing XOR mutability** rule (either multiple `&T` or exactly one `&mut T`).
4. Their validity is tied to a compile-time lifetime `'a`.

While these rules prevent 99% of memory bugs, they make certain low-level programming tasks impossible:
- **Interoperability with C/C++**: C APIs pass raw pointers (`void*`, `int*`) that have no lifetimes or borrow checking.
- **Cyclic & Linked Data Structures**: Graphs, doubly-linked lists, and lock-free queues require node pointers to alias each other mutably.
- **Hardware Memory Mapping**: Embedded systems need to write directly to hardcoded memory addresses (e.g. `0x4000_0000` for MMIO registers).
- **Custom Allocators**: Low-level memory managers work with uninitialized heap memory regions.

Rust introduced **Raw Pointers** (`*const T` and `*mut T`) as primitive types to bridge this gap. Raw pointers strip away compiler safety guarantees, allowing developers to manipulate memory addresses freely, provided dereferencing is guarded inside an `unsafe` block.

### (2) Reality Metaphor

Imagine a **GPS Navigation System vs Raw Latitude/Longitude Coordinates**:

- A **Safe Reference (`&T` / `&mut T`)** is like a high-end GPS Navigation system: it constantly monitors road safety, ensures the destination address exists, prevents driving off a cliff, and refuses to navigate into closed construction zones (**borrow checking & lifetime safety**).
- A **Raw Pointer (`*const T` / `*mut T`)** is like handing an off-road driver a slip of paper with raw latitude and longitude numbers (`0x7fff_5fbff5c0`):
  - Creating and reading the coordinates on paper costs nothing and is harmless (**creating raw pointers is safe**).
  - Driving your truck directly to those coordinates (**dereferencing raw pointers `*ptr`**) requires stepping out of the GPS safety system (**`unsafe` block**).
  - If the coordinates point to a valid gas station (**initialized object**), you succeed. If the coordinates point to the middle of the ocean (**null / dangling pointer**), your truck sinks (**Undefined Behavior / Segmentation Fault**).

### (3) Code Examples

#### Short Snippet (Creating and Dereferencing Raw Pointers)

```rust
fn main() {
    let mut x: i32 = 42;

    // 1. Creating raw pointers from references (SAFE — no `unsafe` needed!)
    let raw_const: *const i32 = &x as *const i32;
    let raw_mut: *mut i32 = &mut x as *mut i32;

    // 2. Creating a null raw pointer (SAFE)
    let null_ptr: *const i32 = std::ptr::null();

    println!("raw_const address: {:p}", raw_const);
    println!("raw_mut address:   {:p}", raw_mut);
    println!("null_ptr address:  {:p}", null_ptr);

    // 3. Dereferencing raw pointers REQUIRES `unsafe` block:
    unsafe {
        // SAFETY: `raw_const` and `raw_mut` were derived from valid stack variable `x`
        println!("Value via raw_const: {}", *raw_const);
        *raw_mut = 100;
        println!("Modified value via raw_mut: {}", *raw_mut);
    }
}
```

#### Fuller Example (Raw Pointer Offset Arithmetic & Slice Iteration)

```rust
/// Iterates over an array using raw pointer arithmetic (`ptr.add(i)`).
fn sum_array_raw(arr: &[i32]) -> i32 {
    let len = arr.len();
    let ptr: *const i32 = arr.as_ptr(); // Get raw pointer to first element

    let mut sum = 0;
    for i in 0..len {
        unsafe {
            // SAFETY:
            // 1. `ptr` points to valid slice memory of length `len`.
            // 2. `ptr.add(i)` computes address offset `ptr + i * size_of::<i32>()`.
            // 3. `i` is strictly within `0..len`, so `ptr.add(i)` is in-bounds and readable.
            let elem_ptr: *const i32 = ptr.add(i);
            sum += *elem_ptr;
        }
    }
    sum
}

fn main() {
    let numbers = [10, 20, 30, 40, 50];
    let total = sum_array_raw(&numbers);
    println!("Total sum calculated via raw pointer arithmetic: {}", total); // 150
}
```

---

## 4. Raw Pointers vs Safe References Comparison

| Feature | Safe Reference (`&T` / `&mut T`) | Raw Pointer (`*const T` / `*mut T`) |
| :--- | :--- | :--- |
| **Can be Null?** | ❌ Never | ✅ Yes (`std::ptr::null()`) |
| **Borrow Checked?** | ✅ Strictly by compiler | ❌ Bypassed |
| **Aliasing Rules** | ✅ Aliasing XOR Mutability | ❌ Multiple `*mut T` permitted |
| **Lifetime Tracking** | ✅ Explicit or elided lifetimes | ❌ No lifetimes attached |
| **Creation Cost** | Safe | Safe |
| **Dereference Cost** | Safe (`*reference`) | Requires `unsafe { *ptr }` |

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Dereferencing a Null Raw Pointer

**The mistake:** Calling `*ptr` when `ptr` is `std::ptr::null()` inside an `unsafe` block.

**Why it's wrong:** Dereferencing a null raw pointer causes immediate Undefined Behavior (typically resulting in a Segmentation Fault crash).

*Incorrect:*
```rust
let ptr: *const i32 = std::ptr::null();
unsafe {
    // ❌ UNDEFINED BEHAVIOR! Dereferencing null pointer!
    let val = *ptr; 
}
```

*Fix:*
```rust
let ptr: *const i32 = std::ptr::null();
unsafe {
    // Correct: Use `as_ref()` to safely convert raw pointer to Option<&T>
    if let Some(val_ref) = ptr.as_ref() {
        println!("Value: {}", val_ref);
    } else {
        println!("Pointer is null, skipping dereference.");
    }
}
```

### Mistake 2: Creating a Dangling Reference via Use-After-Free

**The mistake:** Storing a raw pointer to a local variable that goes out of scope, and dereferencing it later.

**Why it's wrong:** Because raw pointers carry no lifetime tracking, the compiler will not prevent you from keeping a raw pointer after the underlying data is dropped.

*Incorrect:*
```rust
let raw_ptr: *const String;
{
    let s = String::from("hello");
    raw_ptr = &s as *const String;
} // `s` is dropped here!

unsafe {
    // ❌ UNDEFINED BEHAVIOR! `raw_ptr` is dangling!
    println!("{}", &*raw_ptr); 
}
```

*Fix:*
```rust
// Keep ownership active for the duration of raw pointer usage
let s = String::from("hello");
let raw_ptr: *const String = &s as *const String;

unsafe {
    println!("{}", &*raw_ptr); // Correct: `s` is still alive
}
```

### Mistake 3: Miscalculating Pointer Offset Units in `ptr.offset()`

**The mistake:** Assuming `ptr.offset(1)` moves the pointer by 1 byte instead of 1 element of type `T`.

**Why it's wrong:** Pointer arithmetic in Rust (`ptr.add(n)`, `ptr.offset(n)`) automatically multiplies `n` by `std::mem::size_of::<T>()`. Manually multiplying by element size causes double-scaling out-of-bounds pointer offsets.

*Incorrect:*
```rust
let arr: [i32; 4] = [10, 20, 30, 40];
let ptr: *const i32 = arr.as_ptr();

unsafe {
    // ❌ WRONG! `ptr.add(4 * size_of::<i32>())` offsets by 16 elements (64 bytes!), out of bounds!
    let bad_offset = ptr.add(4 * std::mem::size_of::<i32>()); 
}
```

*Fix:*
```rust
let arr: [i32; 4] = [10, 20, 30, 40];
let ptr: *const i32 = arr.as_ptr();

unsafe {
    // Correct: `ptr.add(1)` offsets by 1 element of type i32 (4 bytes)
    let next_elem = *ptr.add(1); // 20
    println!("Second element: {}", next_elem);
}
```

---

## 6. Practice Exercises

### Exercise 1: Zero-Copy Slice Splitting via Raw Pointer Arithmetic

**Problem:** In high-throughput network stream processing, you need to partition a contiguous mutable slice `&mut [T]` into two disjoint mutable sub-slices `(&mut [T], &mut [T])` at a designated boundary `mid`. Standard Rust safe indexing (`&mut slice[..mid]` and `&mut slice[mid..]`) is rejected by the borrow checker because it attempts to borrow two mutable references from the same slice simultaneously.

Implement `split_at_mut_raw<T>(slice: &mut [T], mid: usize) -> Result<(&mut [T], &mut [T]), &'static str>` using raw pointers. Validate bounds, derive raw pointers using `.as_mut_ptr()`, offset using `ptr.add(mid)`, and reconstruct sub-slices with `std::slice::from_raw_parts_mut`. Write unit tests with assertions (`assert_eq!`) demonstrating independent parallel mutations.

> [!check]- Answer
> ```rust
> /// Splits a mutable slice into two disjoint sub-slices at index `mid` using raw pointers.
> ///
> /// # Errors
> /// Returns an error string if `mid > slice.len()`.
> pub fn split_at_mut_raw<T>(
>     slice: &mut [T],
>     mid: usize,
> ) -> Result<(&mut [T], &mut [T]), &'static str> {
>     let len = slice.len();
>     if mid > len {
>         return Err("Index out of bounds");
>     }
> 
>     let ptr: *mut T = slice.as_mut_ptr();
> 
>     // SAFETY:
>     // 1. `mid` is bounded by `len`, so `ptr.add(mid)` stays within or at the end boundary of the slice allocation.
>     // 2. The sub-slices `(0..mid)` and `(mid..len)` cover strictly disjoint memory regions, preventing `&mut T` aliasing.
>     // 3. `ptr` is valid, non-null, properly aligned, and derived from a valid live mutable slice reference.
>     unsafe {
>         let left_ptr = ptr;
>         let right_ptr = ptr.add(mid);
> 
>         let left_slice = std::slice::from_raw_parts_mut(left_ptr, mid);
>         let right_slice = std::slice::from_raw_parts_mut(right_ptr, len - mid);
> 
>         Ok((left_slice, right_slice))
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_split_at_mut_raw_success() {
>         let mut buffer = [10, 20, 30, 40, 50, 60];
>         let (left, right) = split_at_mut_raw(&mut buffer, 2).expect("Split failed");
> 
>         assert_eq!(left, &mut [10, 20]);
>         assert_eq!(right, &mut [30, 40, 50, 60]);
> 
>         // Mutate both sub-slices independently
>         for val in left.iter_mut() {
>             *val *= 2;
>         }
>         for val in right.iter_mut() {
>             *val += 1;
>         }
> 
>         assert_eq!(buffer, [20, 40, 31, 41, 51, 61]);
>     }
> 
>     #[test]
>     fn test_split_at_mut_raw_out_of_bounds() {
>         let mut buffer = [1, 2, 3];
>         let res = split_at_mut_raw(&mut buffer, 10);
>         assert_eq!(res, Err("Index out of bounds"));
>     }
> 
>     #[test]
>     fn test_split_at_mut_raw_edge_cases() {
>         let mut buffer = [100, 200];
>         // Split at index 0 (left slice is empty)
>         let (left_empty, right_full) = split_at_mut_raw(&mut buffer, 0).unwrap();
>         assert_eq!(left_empty.len(), 0);
>         assert_eq!(right_full.len(), 2);
> 
>         // Split at index len (right slice is empty)
>         let (left_full, right_empty) = split_at_mut_raw(&mut buffer, 2).unwrap();
>         assert_eq!(left_full.len(), 2);
>         assert_eq!(right_empty.len(), 0);
>     }
> }
> ```
>
> **Explanation:**
> 1. **Borrow Checker Constraint:** Safe Rust prevents creating `&mut buffer[..mid]` and `&mut buffer[mid..]` directly because both expressions attempt to borrow `buffer` mutably at the same time, violating the aliasing XOR mutability rule.
> 2. **Raw Pointer Dereferencing Bypass:** Calling `.as_mut_ptr()` yields a raw mutable pointer `*mut T` to the first element, stripping borrow checker tracking.
> 3. **Pointer Arithmetic (`add`):** `ptr.add(mid)` computes `ptr + mid * size_of::<T>()`. Rust ensures that `mid` is scaled by element byte size automatically.
> 4. **Rebuilding Safe Slices (`from_raw_parts_mut`):** `std::slice::from_raw_parts_mut(ptr, len)` converts a raw pointer and length back into a safe slice `&mut [T]`. Because `left_ptr` spans `[0, mid)` and `right_ptr` spans `[mid, len)`, the two constructed mutable slices point to disjoint (non-overlapping) memory ranges, maintaining absolute memory safety.

---

### Exercise 2: Embedded Hardware DMA Buffer Ingestion & Alignment Verification

**Problem:** In embedded driver development, a microcontroller DMA peripheral writes raw binary packet data to a hardware address. Before ingesting this raw pointer into typed Rust data structures, the driver must verify safety invariants:
1. The raw pointer must not be null.
2. The raw memory address must be aligned according to `align_of::<T>()` (`address % align_of::<T>() == 0`).
3. The count must be non-zero.

Implement `unsafe fn safe_ingest_dma_buffer<T: Copy>(raw_ptr: *const T, count: usize) -> Result<Vec<T>, IngestError>` using `std::ptr::copy_nonoverlapping`. Return an `IngestError` enum (`NullPointer`, `MisalignedPointer`, `ZeroCount`). Write unit tests with assertions validating successful ingestion, null pointer rejection, zero-count rejection, and misalignment detection.

> [!check]- Answer
> ```rust
> #[derive(Debug, PartialEq, Eq)]
> pub enum IngestError {
>     NullPointer,
>     MisalignedPointer { ptr_val: usize, alignment: usize },
>     ZeroCount,
> }
> 
> /// Safely ingests raw hardware DMA memory into an owned Rust `Vec<T>`.
> ///
> /// # Safety
> /// Caller must guarantee `raw_ptr` points to valid, initialized memory containing at least `count` instances of `T`.
> pub unsafe fn safe_ingest_dma_buffer<T: Copy>(
>     raw_ptr: *const T,
>     count: usize,
> ) -> Result<Vec<T>, IngestError> {
>     if raw_ptr.is_null() {
>         return Err(IngestError::NullPointer);
>     }
> 
>     if count == 0 {
>         return Err(IngestError::ZeroCount);
>     }
> 
>     let addr = raw_ptr as usize;
>     let align = std::mem::align_of::<T>();
>     if addr % align != 0 {
>         return Err(IngestError::MisalignedPointer {
>             ptr_val: addr,
>             alignment: align,
>         });
>     }
> 
>     let mut dest: Vec<T> = Vec::with_capacity(count);
> 
>     // SAFETY:
>     // 1. `raw_ptr` is non-null and verified to be properly aligned for `T`.
>     // 2. `dest.as_mut_ptr()` points to freshly allocated heap memory with capacity >= `count`.
>     // 3. The source and destination memory regions are completely non-overlapping.
>     // 4. `copy_nonoverlapping` bulk copies `count * size_of::<T>()` bytes.
>     std::ptr::copy_nonoverlapping(raw_ptr, dest.as_mut_ptr(), count);
> 
>     // Set vector length after memory initialization
>     dest.set_len(count);
> 
>     Ok(dest)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[repr(C, align(4))]
>     #[derive(Debug, Copy, Clone, PartialEq, Eq)]
>     struct PacketHeader {
>         id: u16,
>         flags: u16,
>         checksum: u32,
>     }
> 
>     #[test]
>     fn test_dma_ingestion_success() {
>         let headers = vec![
>             PacketHeader { id: 0x01, flags: 0x00, checksum: 0xDEADBEEF },
>             PacketHeader { id: 0x02, flags: 0x01, checksum: 0xCAFEBABE },
>         ];
> 
>         let raw: *const PacketHeader = headers.as_ptr();
> 
>         unsafe {
>             let ingested = safe_ingest_dma_buffer(raw, 2).expect("Ingestion failed");
>             assert_eq!(ingested, headers);
>         }
>     }
> 
>     #[test]
>     fn test_dma_ingestion_null_pointer() {
>         let null_ptr: *const u32 = std::ptr::null();
>         unsafe {
>             let res = safe_ingest_dma_buffer(null_ptr, 10);
>             assert_eq!(res, Err(IngestError::NullPointer));
>         }
>     }
> 
>     #[test]
>     fn test_dma_ingestion_zero_count() {
>         let data = [10u32, 20u32];
>         unsafe {
>             let res = safe_ingest_dma_buffer(data.as_ptr(), 0);
>             assert_eq!(res, Err(IngestError::ZeroCount));
>         }
>     }
> 
>     #[test]
>     fn test_dma_ingestion_misaligned_pointer() {
>         let data: [u32; 4] = [10, 20, 30, 40];
>         let valid_ptr = data.as_ptr() as *const u8;
> 
>         // Offset by 1 byte to guarantee misalignment for u32 (requires 4-byte alignment)
>         let misaligned_ptr = unsafe { valid_ptr.add(1) } as *const u32;
> 
>         unsafe {
>             let res = safe_ingest_dma_buffer(misaligned_ptr, 2);
>             match res {
>                 Err(IngestError::MisalignedPointer { alignment, .. }) => {
>                     assert_eq!(alignment, std::mem::align_of::<u32>());
>                 }
>                 _ => panic!("Expected MisalignedPointer error"),
>             }
>         }
>     }
> }
> ```
>
> **Explanation:**
> 1. **Hardware Memory Alignment:** Microcontrollers and CPUs mandate that data types like `u32` (4-byte aligned) or `u64` (8-byte aligned) reside at memory addresses that are multiples of their alignment. Dereferencing an unaligned raw pointer causes hardware fault traps on embedded platforms or Undefined Behavior in Rust.
> 2. **Null Checks (`is_null`):** Raw pointers lack compiler non-null guarantees. Checking `ptr.is_null()` protects against null dereference crashes.
> 3. **High-Speed Copying (`copy_nonoverlapping`):** Equivalent to C's `memcpy`, `std::ptr::copy_nonoverlapping` performs bulk memory transfers without per-element looping overhead.
> 4. **Safe Vector Initialization Sequence:** Calling `Vec::with_capacity` allocates memory without initializing elements. `set_len` must only be called *after* `copy_nonoverlapping` populates the buffer to avoid exposing uninitialized memory.

---

### Exercise 3: Intrusive Doubly-Linked Node Pointer Linking & Swapping

**Problem:** Intrusive doubly-linked lists in kernels and memory allocators require nodes to store pointers to each other (`prev` and `next`). Standard safe references `&mut Node` cannot form cyclic graphs because multiple mutable references to the same node violate unique aliasing rules.

Define an intrusive `Node<T>` struct containing `val: T`, `prev: *mut Node<T>`, and `next: *mut Node<T>`. Implement:
1. `Node::new(val: T) -> Self` with null pointer initialization.
2. `unsafe fn link_neighbors<T>(left: *mut Node<T>, right: *mut Node<T>)` setting `(*left).next = right` and `(*right).prev = left`.
3. `unsafe fn swap_node_payloads<T>(node_a: *mut Node<T>, node_b: *mut Node<T>)` using `std::ptr::addr_of_mut!` and `std::ptr::swap` to exchange node values in-place without re-linking node pointers or moving nodes.

Write unit tests verifying pointer linkage, payload swapping, and structural integrity.

> [!check]- Answer
> ```rust
> use std::ptr;
> 
> pub struct Node<T> {
>     pub val: T,
>     pub prev: *mut Node<T>,
>     pub next: *mut Node<T>,
> }
> 
> impl<T> Node<T> {
>     pub fn new(val: T) -> Self {
>         Node {
>             val,
>             prev: ptr::null_mut(),
>             next: ptr::null_mut(),
>         }
>     }
> }
> 
> /// Links two raw node pointers bidirectionally: `left.next = right` and `right.prev = left`.
> ///
> /// # Safety
> /// `left` and `right` must be valid, non-null, initialized raw pointers to `Node<T>`.
> pub unsafe fn link_neighbors<T>(left: *mut Node<T>, right: *mut Node<T>) {
>     if !left.is_null() {
>         (*left).next = right;
>     }
>     if !right.is_null() {
>         (*right).prev = left;
>     }
> }
> 
> /// Swaps the values contained within two raw node pointers in-place.
> ///
> /// # Safety
> /// `node_a` and `node_b` must be valid, non-null, readable, and writable raw pointers to `Node<T>`.
> pub unsafe fn swap_node_payloads<T>(node_a: *mut Node<T>, node_b: *mut Node<T>) {
>     assert!(!node_a.is_null() && !node_b.is_null(), "Pointers must not be null");
> 
>     // Derive raw mutable pointers directly to the `val` fields without intermediate safe references
>     let ptr_a: *mut T = ptr::addr_of_mut!((*node_a).val);
>     let ptr_b: *mut T = ptr::addr_of_mut!((*node_b).val);
> 
>     // Swap raw bytes directly in memory
>     ptr::swap(ptr_a, ptr_b);
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_node_linking() {
>         let mut node1 = Node::new(100);
>         let mut node2 = Node::new(200);
> 
>         let ptr1: *mut Node<i32> = &mut node1;
>         let ptr2: *mut Node<i32> = &mut node2;
> 
>         unsafe {
>             link_neighbors(ptr1, ptr2);
> 
>             assert_eq!((*ptr1).next, ptr2);
>             assert_eq!((*ptr2).prev, ptr1);
>             assert_eq!((*(*ptr1).next).val, 200);
>             assert_eq!((*(*ptr2).prev).val, 100);
>         }
>     }
> 
>     #[test]
>     fn test_swap_node_payloads() {
>         let mut node1 = Node::new("alpha".to_string());
>         let mut node2 = Node::new("beta".to_string());
> 
>         let ptr1: *mut Node<String> = &mut node1;
>         let ptr2: *mut Node<String> = &mut node2;
> 
>         unsafe {
>             link_neighbors(ptr1, ptr2);
> 
>             // Swap values between node1 and node2
>             swap_node_payloads(ptr1, ptr2);
> 
>             assert_eq!(node1.val, "beta");
>             assert_eq!(node2.val, "alpha");
> 
>             // Verify structural node link relationships remain intact after payload swap
>             assert_eq!((*ptr1).next, ptr2);
>             assert_eq!((*ptr2).prev, ptr1);
>         }
>     }
> }
> ```
>
> **Explanation:**
> 1. **Cyclic Structures via `*mut T`:** Standard Rust references `&mut T` cannot model doubly-linked lists because `node1` borrowing `node2` mutably while `node2` borrows `node1` mutably breaks ownership rules. Raw pointers `*mut Node<T>` allow arbitrary pointer graphs without borrow checking constraints.
> 2. **Avoiding Aliasing Violations with `addr_of_mut!`:** `ptr::addr_of_mut!((*node_a).val)` creates a raw pointer directly to a struct field without taking an intermediate `&mut (*node_a).val` reference, which could trigger undefined behavior if other raw pointers alias the memory.
> 3. **In-Place Bitwise Swap (`ptr::swap`):** `ptr::swap(ptr_a, ptr_b)` exchanges the contents of two memory addresses byte-by-byte. This works safely even for non-`Copy` types like `String`, preserving ownership and avoiding double-free memory bugs.

---

## 7. Related Terms


- [`unsafe` Block](unsafe_block.md) — Required block scope to dereference raw pointers.
- [Undefined Behavior (UB)](undefined_behavior.md) — The memory safety risks when misusing raw pointers.
- [References and Borrowing (`&`, `&mut`)](../level_01/references_and_borrowing.md) — Standard safe pointer abstractions in Rust.
- [FFI (Foreign Function Interface)](ffi.md) — Interoperability layer where raw pointers pass to/from C libraries.
- [`extern "C"`](extern_c.md) — Related concept: `extern "C"`.
- [`unsafe fn`](unsafe_fn.md) — Related concept: `unsafe fn`.
- [Allocator API](../level_15/allocator_api.md) — Related concept: Allocator API.

---

## 8. Key Takeaways

- Raw pointers (`*const T` for immutable, `*mut T` for mutable) represent unchecked memory addresses.
- Creating raw pointers is completely **SAFE**; dereferencing them (`*ptr`) requires an **`unsafe` block**.
- Raw pointers can be null, dangling, or aliased mutably, and carry no lifetime tracking.
- Use `ptr.as_ref()` or `ptr.as_mut()` to safely convert raw pointers into `Option<&T>` / `Option<&mut T>` with null checks.
- Pointer arithmetic (`ptr.add(n)`) scales automatically by `size_of::<T>()`.
