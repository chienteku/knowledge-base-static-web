# `Index` and `IndexMut` Traits

> **Level 14 — Rust**
> The `std::ops` traits behind the `[]` subscript operator, allowing types to define custom indexing behaviour.

---

## 1. Prerequisites

- [Operator Overloading](operator_overloading.md) — Operator overloading.

---

## 2. Term Category

**Operator Overloading**: `Index` and `IndexMut` traits for subscript indexing syntax `container[index]`.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Custom collections (like 2D grid matrices, custom ring buffers, or dictionary maps) need standard square bracket subscript indexing (`container[idx]`) for intuitive readability.

`Index` (`fn index(&self, index: Idx) -> &Self::Output`) and `IndexMut` overload the `[]` subscript operator in Rust. They allow custom types to return immutable or mutable references to elements using arbitrary key/index types.

### (2) Reality Metaphor

A library card catalog or PO Box wall: using an index key (PO Box number) to unlock and inspect or update the exact mail slot inside.

### (3) Rust Code Examples

#### Short Snippet
```rust
use std::ops::Index;
struct Matrix([f64; 4]);
impl Index<usize> for Matrix {
    type Output = f64;
    fn index(&self, idx: usize) -> &f64 { &self.0[idx] }
}
```

#### Fuller Example
```rust
use std::ops::{Index, IndexMut};

pub struct Grid2D {
    data: Vec<i32>,
    cols: usize,
}

impl Grid2D {
    pub fn new(rows: usize, cols: usize) -> Self {
        Self { data: vec![0; rows * cols], cols }
    }
}

impl Index<(usize, usize)> for Grid2D {
    type Output = i32;
    fn index(&self, (r, c): (usize, usize)) -> &Self::Output {
        &self.data[r * self.cols + c]
    }
}

impl IndexMut<(usize, usize)> for Grid2D {
    fn index_mut(&mut self, (r, c): (usize, usize)) -> &mut Self::Output {
        &mut self.data[r * self.cols + c]
    }
}

fn main() {
    let mut grid = Grid2D::new(3, 3);
    grid[(1, 1)] = 42;
    assert_eq!(grid[(1, 1)], 42);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Panicking on Out-of-Bounds Indexing Without Providing Fallible `.get()` Alternatives

**The mistake:** Implementing `Index` with panicking out-of-bounds assertions while failing to provide a fallible `.get(&self, idx) -> Option<&Output>` method.

**Why it is wrong:** Subscript indexing in Rust (`container[idx]`) is expected to panic on out-of-bounds, but callers need a non-panicking `.get()` alternative for safe lookups.

*Incorrect:*
```rust
impl Index for Grid { ... } // No .get() method provided!
```

*Fix:*
```rust
Provide both index operator impl AND fallible .get() / .get_mut() methods!
```

### Mistake 2: Returning Owned Values Instead of References in `Index::index`

**The mistake:** Attempting to return an owned value `T` from `index(&self)` instead of a reference `&T`.

**Why it is wrong:** The `Index` trait signature strictly requires returning a reference `&Self::Output` tied to the container lifetime.

*Incorrect:*
```rust
fn index(&self, idx: usize) -> Self::Output { self.data[idx].clone() } // Signature mismatch!
```

*Fix:*
```rust
fn index(&self, idx: usize) -> &Self::Output { &self.data[idx] }
```

### Mistake 3: Forgetting `IndexMut` for Assignment Subscripting

**The mistake:** Implementing `Index` and attempting to assign values using `container[idx] = new_val`.

**Why it is wrong:** Subscript mutation requires implementing `std::ops::IndexMut`.

*Incorrect:*
```rust
grid[0] = 10; // Error without IndexMut!
```

*Fix:*
```rust
impl IndexMut<usize> for Grid { fn index_mut(&mut self, idx: usize) -> &mut i32 { &mut self.data[idx] } }
```

---

## 5. Practice Exercises

### Exercise 1: Type-Safe 2D Matrix Grid Indexer

**Scenario:** Build a 2D matrix struct `Matrix2D<T>` supporting tuple subscript indexing `matrix[(row, col)]` for both read and write access.

**Requirements:**
1. Define `Matrix2D<T>` struct.
1. Implement `Index<(usize, usize)>` and `IndexMut<(usize, usize)>`.
1. Write unit tests for read/write indexing.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::ops::{Index, IndexMut};
> 
> pub struct Matrix2D<T> {
>     data: Vec<T>,
>     pub rows: usize,
>     pub cols: usize,
> }
> 
> impl<T: Clone + Default> Matrix2D<T> {
>     pub fn new(rows: usize, cols: usize) -> Self {
>         Self {
>             data: vec![T::default(); rows * cols],
>             rows,
>             cols,
>         }
>     }
> }
> 
> impl<T> Index<(usize, usize)> for Matrix2D<T> {
>     type Output = T;
>     fn index(&self, (r, c): (usize, usize)) -> &Self::Output {
>         assert!(r < self.rows && c < self.cols, "Index out of bounds");
>         &self.data[r * self.cols + c]
>     }
> }
> 
> impl<T> IndexMut<(usize, usize)> for Matrix2D<T> {
>     fn index_mut(&mut self, (r, c): (usize, usize)) -> &mut Self::Output {
>         assert!(r < self.rows && c < self.cols, "Index out of bounds");
>         &mut self.data[r * self.cols + c]
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_matrix_indexing() {
>         let mut mat = Matrix2D::<i32>::new(3, 3);
>         mat[(0, 2)] = 99;
>         mat[(2, 1)] = 42;
> 
>         assert_eq!(mat[(0, 2)], 99);
>         assert_eq!(mat[(2, 1)], 42);
>         assert_eq!(mat[(0, 0)], 0);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `Index<(usize, usize)>` enables clean 2D tuple subscripting `mat[(r, c)]`.
> 2. `IndexMut` enables direct assignment `mat[(r, c)] = val`.

---

### Exercise 2: Custom Key-Value Dictionary Indexer

**Scenario:** Build a string-indexed key-value configuration dictionary implementing `Index<&str>`.

**Requirements:**
1. Define `ConfigMap` wrapping `HashMap<String, String>`.
1. Implement `Index<&str>`.
1. Test indexing.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::ops::Index;
> use std::collections::HashMap;
> 
> pub struct ConfigMap {
>     settings: HashMap<String, String>,
> }
> 
> impl ConfigMap {
>     pub fn new() -> Self { Self { settings: HashMap::new() } }
>     pub fn insert(&mut self, k: &str, v: &str) {
>         self.settings.insert(k.to_string(), v.to_string());
>     }
> }
> 
> impl Index<&str> for ConfigMap {
>     type Output = String;
>     fn index(&self, key: &str) -> &Self::Output {
>         &self.settings[key]
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_config_map_indexing() {
>         let mut cfg = ConfigMap::new();
>         cfg.insert("host", "localhost");
>         assert_eq!(cfg["host"], "localhost");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Implements `Index<&str>` to support string key subscript lookups `cfg["host"]`.

---

### Exercise 3: Circular Buffer Subscript Indexer

**Scenario:** Build a fixed-capacity ring buffer implementing wrapped `Index` subscript access.

**Requirements:**
1. Define `RingBuffer`.
1. Implement modulo indexing.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::ops::Index;
> 
> pub struct RingBuffer<T> {
>     data: Vec<T>,
> }
> 
> impl<T> RingBuffer<T> {
>     pub fn new(data: Vec<T>) -> Self { Self { data } }
> }
> 
> impl<T> Index<usize> for RingBuffer<T> {
>     type Output = T;
>     fn index(&self, idx: usize) -> &Self::Output {
>         &self.data[idx % self.data.len()]
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_ring_index() {
>         let ring = RingBuffer::new(vec![10, 20, 30]);
>         assert_eq!(ring[0], 10);
>         assert_eq!(ring[3], 10); // Wrapped index!
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Subscript indexing automatically applies modulo arithmetic for circular buffer lookups.

---

## 5. Related Terms

- [Operator Overloading](operator_overloading.md) — Operator overloading.

---

## 7. Key Takeaways

- Overloads subscript operator `container[idx]`.
- `Index` returns immutable reference `&Self::Output`.
- `IndexMut` enables subscript assignment (`container[idx] = val`).
- Should be paired with fallible non-panicking `.get()` methods.
