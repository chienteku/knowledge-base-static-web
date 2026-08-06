# Arrays and Slices

> **Level 1 — Rust**
> Fixed-size contiguous sequences (`[T; N]`) and dynamically-sized views into contiguous sequences (`&[T]`) in Rust.

---

## 1. Prerequisites

- [Compound Types](compound_types.md) — Fixed-length sequences built on primitive scalar types.

---

## 2. Term Category



**Rust Data Structure (the stack/view dichotomy)**: Fixed-size stack arrays `[T; N]` and dynamically-sized reference slice views `&[T]`.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Allocating dynamic memory on the heap for small, fixed-length collections (like RGB color channels, fixed 3D coordinates, or buffer chunks) incurs unnecessary memory allocation overhead.

Rust distinguishes between fixed-size stack arrays `[T; N]` (where capacity $N$ is part of the static compile-time type) and slice views `&[T]` (a borrowed reference view representing a dynamically-sized contiguous sequence of elements). Slice views allow functions to operate generically over arrays, vectors, or sub-regions without copying memory.

### (2) Reality Metaphor

A physical photo album vs. a cardboard slide viewer frame: the photo album (`[T; N]`) has a fixed number of bound plastic sleeve pages; the slide viewer frame (`&[T]`) is a window placed over any continuous section of photos to inspect them without detaching them from the album.

### (3) Rust Code Examples

#### Short Snippet
```rust
let arr: [i32; 3] = [10, 20, 30];
let slice: &[i32] = &arr[1..];
assert_eq!(slice[0], 20);
```

#### Fuller Example
```rust
pub fn sum_elements(slice: &[i32]) -> i32 {
    slice.iter().sum()
}

fn main() {
    let stack_array: [i32; 4] = [1, 2, 3, 4];
    let heap_vec: Vec<i32> = vec![5, 6, 7, 8];
    
    // Both arrays and vectors coerce to &[i32] slices!
    assert_eq!(sum_elements(&stack_array), 10);
    assert_eq!(sum_elements(&heap_vec), 26);
    assert_eq!(sum_elements(&stack_array[1..3]), 5);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Out-of-Bounds Index Panic

**The mistake:** Accessing an array or slice element using an index equal to or greater than its length `arr[arr.len()]`.

**Why it is wrong:** Rust performs bounds checking on direct subscript indexing `arr[i]`. If the index is out of bounds, Rust panics at runtime to prevent buffer overflow vulnerabilities.

*Incorrect:*
```rust
let arr = [10, 20]; let val = arr[2]; // Runtime Panic!
```

*Fix:*
```rust
let val = arr.get(2).copied().unwrap_or(0); // Safe fallible access via .get()
```

### Mistake 2: Attempting to Mutate Elements Through an Immutable Slice `&[T]`

**The mistake:** Trying to assign a new value `slice[0] = 42` through a shared `&[T]` slice reference.

**Why it is wrong:** Shared references `&[T]` are strictly immutable to prevent data races. Mutable element mutation requires `&mut [T]`.

*Incorrect:*
```rust
fn update(s: &[i32]) { s[0] = 1; } // Compiler Error!
```

*Fix:*
```rust
fn update(s: &mut [i32]) { s[0] = 1; } // Use &mut [T] slice!
```

### Mistake 3: Mismatching Array Length Types in Functions

**The mistake:** Defining a function accepting `[i32; 4]` and attempting to pass `[i32; 5]`.

**Why it is wrong:** Array capacity $N$ is part of the static type. `[i32; 4]` and `[i32; 5]` are completely different types.

*Incorrect:*
```rust
fn process(a: [i32; 4]) {} process([1, 2, 3, 4, 5]); // Type Mismatch!
```

*Fix:*
```rust
fn process(s: &[i32]) {} process(&[1, 2, 3, 4, 5]); // Accept &[T] slice!
```

---

## 5. Practice Exercises

### Exercise 1: High-Performance Sliding Window Average Signal Processor

**Scenario:** Build a digital signal processing function `sliding_window_avg(samples: &[f64], window_size: usize) -> Vec<f64>` accepting a slice of input audio samples and returning calculated window averages.

**Requirements:**
1. Accept `&[f64]` slice parameter.
1. Use slice windows `samples.windows(window_size)`.
1. Return `Vec<f64>`.
1. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn sliding_window_avg(samples: &[f64], window_size: usize) -> Vec<f64> {
>     if window_size == 0 || samples.len() < window_size {
>         return Vec::new();
>     }
>     samples
>         .windows(window_size)
>         .map(|w| w.iter().sum::<f64>() / (window_size as f64))
>         .collect()
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_sliding_window() {
>         let array_data: [f64; 5] = [1.0, 2.0, 3.0, 4.0, 5.0];
>         let averages = sliding_window_avg(&array_data, 3);
>         assert_eq!(averages, vec![2.0, 3.0, 4.0]);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Function parameter `samples: &[f64]` allows accepting stack arrays `[f64; N]`, sub-slices, or heap `Vec<f64>` zero-copy.
> 2. Uses `.windows(N)` iterator over slice sub-views.

---

### Exercise 2: In-Place Buffer Sanitizer with Mutable Slices `&mut [T]`

**Scenario:** Build a network buffer sanitizer `clamp_buffer(buf: &mut [u8], max_val: u8)` replacing byte values exceeding `max_val`.

**Requirements:**
1. Accept `&mut [u8]` slice.
1. Modify elements in-place.
1. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn clamp_buffer(buf: &mut [u8], max_val: u8) {
>     for byte in buf.iter_mut() {
>         if *byte > max_val {
>             *byte = max_val;
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_clamp_buffer() {
>         let mut stack_buf: [u8; 4] = [50, 150, 200, 10];
>         clamp_buffer(&mut stack_buf, 100);
>         assert_eq!(stack_buf, [50, 100, 100, 10]);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Operates directly on caller's stack array in-place without dynamic heap allocations.

---

### Exercise 3: Fixed RGB Pixel Color Channel Converter

**Scenario:** Implement a fixed-size 3-byte RGB array converter `rgb_to_grayscale(rgb: [u8; 3]) -> u8`.

**Requirements:**
1. Accept `[u8; 3]` fixed stack array.
1. Calculate weighted luminance.
1. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn rgb_to_grayscale(rgb: [u8; 3]) -> u8 {
>     let r = rgb[0] as f32;
>     let g = rgb[1] as f32;
>     let b = rgb[2] as f32;
>     (0.299 * r + 0.587 * g + 0.114 * b) as u8
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_rgb_conversion() {
>         let pixel: [u8; 3] = [255, 255, 255];
>         assert_eq!(rgb_to_grayscale(pixel), 255);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `[u8; 3]` enforces exact 3-element stack allocation for fixed graphics pixel data.

---

## 5. Related Terms

- [SIMD (`std::simd`)](../level_15/simd.md)
- [`Vec<T>`](../level_02/vec_t.md) — The heap-allocated dynamic array version.
- [Compound Types](compound_types.md) — Related concept: Compound Types.
- [`Index` and `IndexMut` Traits](../level_14/index_indexmut_traits.md) — Related concept: `Index` and `IndexMut` Traits.

---

## 7. Key Takeaways

- Arrays `[T; N]` have a fixed length $N$ known at compile time.
- Slices `&[T]` are borrowed views over contiguous memory.
- Prefer `&[T]` or `&mut [T]` slice parameters in public functions for API flexibility.
- Use `.get(idx)` for safe out-of-bounds bounds checking.
