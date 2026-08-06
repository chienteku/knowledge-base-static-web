# `const` Generics

> **Level 19 — Rust**
> Using constant values as generic parameters, e.g. `struct Array<T, const N: usize>([T; N])`, enabling type-level array sizes.

---

## 1. Prerequisites

- [Generics (`<T>`)](../level_04/generics.md) — Generics.
- [Constants (`const`)](../level_01/constants_const.md) — Compile-time constants.

---

## 2. Term Category



**Rust Advanced Type System (compile-time constant generic parameters)**: Generic parameters over constant values (`struct Matrix<T, const N: usize>`).

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Before `const` generics, Rust could only parameterize structs and traits over types (`T`) or lifetimes (`'a`). Storing fixed-size arrays required implementing traits separately for every possible array length (e.g. `[T; 1]`, `[T; 2]`, ... up to `[T; 32]`).

Const generics allow types to be generic over constant values like integers (`const N: usize`). This brings type-safe fixed-length stack allocation to Rust without heap overhead or macro boilerplate.

### (2) Reality Metaphor

Bespoke shoe manufacturing: shoe patterns are parameterized by integer shoe sizes (e.g. Size 9, Size 10). The factory uses the exact same shoe design template while guaranteeing exact physical dimensions at production time.

### (3) Rust Code Examples

#### Short Snippet
```rust
pub struct FixedBuffer<T, const CAP: usize> {
    data: [T; CAP],
    len: usize,
}
```

#### Fuller Example
```rust
struct Matrix<const ROWS: usize, const COLS: usize> {
    data: [[f64; COLS]; ROWS],
}

impl<const ROWS: usize, const COLS: usize> Matrix<ROWS, COLS> {
    fn zeros() -> Self {
        Self { data: [[0.0; COLS]; ROWS] }
    }
    fn dimensions(&self) -> (usize, usize) {
        (ROWS, COLS)
    }
}

fn main() {
    let mat = Matrix::<3, 4>::zeros();
    assert_eq!(mat.dimensions(), (3, 4));
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Mismatching Const Generic Size Parameters

**The mistake:** Attempting to assign or pass a struct with `const N` to a place expecting a different size `const M`.

**Why it is wrong:** The constant value $N$ is part of the static type identity. `Buffer<10>` and `Buffer<20>` are completely distinct types at compile time.

*Incorrect:*
```rust
let b1: Buffer<10> = Buffer::<20>::new(); // Type Mismatch Error!
```

*Fix:*
```rust
Ensure const generic size parameters match or provide explicit conversion traits!
```

### Mistake 2: Using Expressions in Const Generic Arguments Without `{}`

**The mistake:** Writing complex expressions in const generic arguments without curly braces.

**Why it is wrong:** Rust syntax requires wrapping complex arithmetic expressions in `{}` inside const generic arguments.

*Incorrect:*
```rust
let b: Buffer<N + 1> = Buffer::new(); // Syntax Error!
```

*Fix:*
```rust
let b: Buffer<{ N + 1 }> = Buffer::new(); // Correct!
```

### Mistake 3: Expecting Implicit Coercion Between Array Lengths

**The mistake:** Expecting `[T; N]` to automatically coerce to `[T; M]`.

**Why it is wrong:** Array sizes do not coerce automatically; they must be sliced `&[T]` or converted explicitly.

*Incorrect:*
```rust
fn process(arr: [i32; 10]) {}
process([0; 5]); // Compiler Error!
```

*Fix:*
```rust
fn process(slice: &[i32]) {}
process(&[0; 5]); // Coerces array to slice!
```

---

## 5. Practice Exercises

### Exercise 1: Compile-Time Fixed Ring Buffer

**Scenario:** Implement a stack-allocated ring buffer `RingBuffer<T, const N: usize>` with zero heap allocation.

**Requirements:**
1. Define `RingBuffer<T, const N: usize>` with array storage `[Option<T>; N]`.
1. Implement `push(&mut self, item: T) -> Result<(), T>`.
1. Add unit tests verifying capacity.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub struct RingBuffer<T, const N: usize> {
>     storage: [Option<T>; N],
>     write_idx: usize,
>     count: usize,
> }
> 
> impl<T: Copy, const N: usize> RingBuffer<T, N> {
>     pub fn new() -> Self {
>         Self {
>             storage: [None; N],
>             write_idx: 0,
>             count: 0,
>         }
>     }
> 
>     pub fn push(&mut self, item: T) -> bool {
>         if self.count >= N {
>             return false;
>         }
>         self.storage[self.write_idx] = Some(item);
>         self.write_idx = (self.write_idx + 1) % N;
>         self.count += 1;
>         true
>     }
> 
>     pub fn capacity(&self) -> usize {
>         N
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_ring_buffer_const_generic() {
>         let mut buf = RingBuffer::<i32, 3>::new();
>         assert_eq!(buf.capacity(), 3);
>         assert!(buf.push(10));
>         assert!(buf.push(20));
>         assert!(buf.push(30));
>         assert!(!buf.push(40)); // Full!
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `RingBuffer<T, N>` uses `const N: usize` to allocate fixed storage `[Option<T>; N]` on the stack.
> 2. Provides zero-allocation bounded buffering.

---

### Exercise 2: Type-Safe Matrix Multiplication Guard

**Scenario:** Build a linear algebra matrix struct where matrix multiplication `Matrix<R1, C1> * Matrix<C1, C2>` is verified at compile time.

**Requirements:**
1. Define `Matrix<const R: usize, const C: usize>`.
1. Implement multiplication method enforcing inner dimension equality `C1 == R2`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq)]
> pub struct Matrix<const R: usize, const C: usize> {
>     pub data: [[f64; C]; R],
> }
> 
> impl<const R: usize, const C: usize> Matrix<R, C> {
>     pub fn multiply<const C2: usize>(&self, rhs: &Matrix<C, C2>) -> Matrix<R, C2> {
>         let mut result = [[0.0; C2]; R];
>         let mut r = 0;
>         while r < R {
>             let mut c2 = 0;
>             while c2 < C2 {
>                 let mut k = 0;
>                 while k < C {
>                     result[r][c2] += self.data[r][k] * rhs.data[k][c2];
>                     k += 1;
>                 }
>                 c2 += 1;
>             }
>             r += 1;
>         }
>         Matrix { data: result }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_matrix_mult() {
>         let m1 = Matrix::<2, 3> { data: [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]] };
>         let m2 = Matrix::<3, 2> { data: [[7.0, 8.0], [9.0, 1.0], [2.0, 3.0]] };
>         let res = m1.multiply(&m2);
>         assert_eq!(res.data, [[31.0, 19.0], [85.0, 55.0]]);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Const generics guarantee compile-time verification that `m1` columns match `m2` rows.
> 2. Prevents runtime matrix dimension mismatch bugs.

---

### Exercise 3: Compile-Time Static String Packet Encoder

**Scenario:** Create a network packet encoder `Packet<const SIZE: usize>` that serializes payloads into fixed byte arrays.

**Requirements:**
1. Define `Packet<const SIZE: usize>` with byte array payload `[u8; SIZE]`.
1. Implement `as_slice(&self) -> &[u8]`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub struct Packet<const SIZE: usize> {
>     bytes: [u8; SIZE],
> }
> 
> impl<const SIZE: usize> Packet<SIZE> {
>     pub fn from_slice(input: &[u8]) -> Option<Self> {
>         if input.len() != SIZE {
>             return None;
>         }
>         let mut bytes = [0u8; SIZE];
>         bytes.copy_from_slice(input);
>         Some(Self { bytes })
>     }
> 
>     pub fn as_slice(&self) -> &[u8] {
>         &self.bytes
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_packet_creation() {
>         let p = Packet::<4>::from_slice(b"PING").unwrap();
>         assert_eq!(p.as_slice(), b"PING");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `Packet<SIZE>` ensures stack-allocated binary packet payloads.
> 2. Sizing errors are caught during initialization.

---

## 6. Related Terms

- [`const fn`](const_fn.md) — Const functions.
- [Const Evaluation Ctfe](const_evaluation_ctfe.md) — Compile-time evaluation.

---

## 7. Key Takeaways

- Parameterizes types over constant values (e.g. `const N: usize`).
- Array sizes $N$ become part of static type checking.
- Eliminates runtime heap allocation for fixed-capacity buffers.
- Complex expressions in const generic arguments must be enclosed in `{}`.
