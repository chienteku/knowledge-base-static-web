# Miri (Undefined Behavior Detector)

> **Level 13 — Rust**
> A MIR interpreter that executes Rust programs and detects Undefined Behavior invisible to normal compilation, invaluable for `unsafe` code.

---

## 1. Prerequisites

- [Undefined Behavior (UB)](undefined_behavior.md) — Undefined behavior rules.
- [`unsafe` Block](unsafe_block.md) — Unsafe code blocks.

---

## 2. Term Category

**Undefined Behavior Diagnostic**: The Miri interpreter for detecting Undefined Behavior (UB).

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Traditional C/C++ sanitizers (Valgrind, AddressSanitizer) detect memory bugs at runtime on compiled binaries, but cannot detect subtle Rust language aliasing violations (like Stacked Borrows / Tree Borrows rules).

Miri is an official `rustc` MID-Level IR (MIR) interpreter that executes Rust programs in a virtual environment. Miri tracks pointer provenance, uninitialized memory, dangling references, data races, and aliasing violations, catching Undefined Behavior (UB) before code reaches production.

### (2) Reality Metaphor

A full-body medical MRI scanner: scanning the internal organs and tissue layers of a patient in 3D to spot micro-fractures invisible to standard visual inspection.

### (3) Rust Code Examples

#### Short Snippet
```rust
// Execute test suite under Miri:
// $ cargo miri test
```

#### Fuller Example
```rust
pub fn safe_pointer_borrow(val: &i32) -> i32 {
    let ptr = val as *const i32;
    // Miri verifies pointer provenance and memory alignment!
    unsafe { *ptr }
}

fn main() {
    let val = 42;
    assert_eq!(safe_pointer_borrow(&val), 42);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Mutating Data via Raw Pointer While Shared References Exist (Stacked Borrows Violation)

**The mistake:** Creating a shared reference `&x` and then mutating `x` via raw pointer `*mut i32`.

**Why it is wrong:** Violates Stacked Borrows aliasing rules. Shared references guarantee underlying data does not mutate during their lifetime; mutating invalidates pointer provenance.

*Incorrect:*
```rust
let mut x = 5; let r = &x; let p = &mut x as *mut i32; unsafe { *p = 10; } // Miri UB error!
```

*Fix:*
```rust
Ensure shared references drop before mutating via raw pointers!
```

### Mistake 2: Reading Uninitialized Memory Bytes

**The mistake:** Reading values from `MaybeUninit<T>` without calling `.assume_init()` or initializing memory.

**Why it is wrong:** Reading uninitialized memory bytes is immediate Undefined Behavior in Rust.

*Incorrect:*
```rust
use std::mem::MaybeUninit; let val: i32 = unsafe { MaybeUninit::uninit().assume_init() };
```

*Fix:*
```rust
Initialize memory first: let mut val = MaybeUninit::<i32>::uninit(); val.write(42); let v = unsafe { val.assume_init() };
```

### Mistake 3: Creating Out-of-Bounds Raw Pointer Offsets

**The mistake:** Performing pointer arithmetic past the allocated allocation boundary (`ptr.add(N)`).

**Why it is wrong:** Creating (or dereferencing) out-of-bounds raw pointers invalidates memory allocation bounds in Miri.

*Incorrect:*
```rust
let arr = [1, 2]; unsafe { let p = arr.as_ptr().add(5); *p; } // Miri Out-of-bounds UB!
```

*Fix:*
```rust
Ensure pointer arithmetic remains strictly within valid array bounds!
```

---

## 5. Practice Exercises

### Exercise 1: Miri-Verified Safe Custom Slice Splitter

**Scenario:** Build a custom slice splitting function `split_slice_at_mut<T>(slice: &mut [T], mid: usize) -> (&mut [T], &mut [T])` using raw pointers and verify zero UB under Miri.

**Requirements:**
1. Use raw pointer arithmetic (`slice.as_mut_ptr()`).
1. Ensure non-overlapping pointer bounds.
1. Construct slices via `std::slice::from_raw_parts_mut`.
1. Write unit tests verifiable under Miri.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::slice;
> 
> pub fn custom_split_at_mut<T>(slice: &mut [T], mid: usize) -> (&mut [T], &mut [T]) {
>     let len = slice.len();
>     assert!(mid <= len, "mid point exceeds slice length");
>     let ptr = slice.as_mut_ptr();
> 
>     unsafe {
>         (
>             slice::from_raw_parts_mut(ptr, mid),
>             slice::from_raw_parts_mut(ptr.add(mid), len - mid),
>         )
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_miri_safe_split() {
>         let mut data = [1, 2, 3, 4, 5];
>         let (left, right) = custom_split_at_mut(&mut data, 2);
>         left[0] = 10;
>         right[0] = 20;
> 
>         assert_eq!(data, [10, 2, 20, 4, 5]);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Uses raw pointers to split a single mutable slice into two disjoint non-overlapping mutable slices.
> 2. Pass Miri Stacked Borrows pointer provenance verification because pointer regions do not overlap.

---

### Exercise 2: Miri Stacked Borrows Aliasing Test Suite

**Scenario:** Demonstrate a safe raw pointer aliasing pattern that passes Miri Stacked Borrows validation.

**Requirements:**
1. Create mutable vector.
1. Derive raw pointer.
1. Mutate safely without live shared references.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn safe_raw_mutation(vec: &mut Vec<i32>, index: usize, val: i32) {
>     let ptr = vec.as_mut_ptr();
>     unsafe {
>         *ptr.add(index) = val;
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_safe_raw_mutation() {
>         let mut v = vec![10, 20, 30];
>         safe_raw_mutation(&mut v, 1, 99);
>         assert_eq!(v[1], 99);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Raw pointer access stays within valid vector allocation bounds, passing Miri pointer provenance checks.

---

### Exercise 3: Miri Uninitialized Memory Initialization Pattern

**Scenario:** Implement a buffer initializer using `MaybeUninit<[u8; 4]>` passed through Miri verification.

**Requirements:**
1. Initialize memory using `MaybeUninit`.
1. Call `assume_init()` safely.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::mem::MaybeUninit;
> 
> pub fn create_initialized_buffer() -> [u8; 4] {
>     let mut buf: [MaybeUninit<u8>; 4] = unsafe { MaybeUninit::uninit().assume_init() };
>     for (i, elem) in buf.iter_mut().enumerate() {
>         elem.write(i as u8);
>     }
>     unsafe { std::mem::transmute(buf) }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_buffer_init() {
>         let buf = create_initialized_buffer();
>         assert_eq!(buf, [0, 1, 2, 3]);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Initializes all memory bytes before transmute, preventing uninitialized memory reads in Miri.

---

## 5. Related Terms

- [Undefined Behavior (UB)](undefined_behavior.md) — UB detection.
- [Cargo CLI](../level_07/cargo_cli.md) — Cargo integration.
- [Mir Mid Level Ir](../level_19/mir_mid_level_ir.md) — Related concept: Mir Mid Level Ir.

---

## 7. Key Takeaways

- Miri is an official MIR interpreter detecting Undefined Behavior in Rust.
- Catches Stacked Borrows / Tree Borrows pointer aliasing violations.
- Detects uninitialized memory reads, dangling pointers, and data races.
- Run test suites under Miri using `cargo miri test`.
