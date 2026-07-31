# Operator Overloading

> **Level 14 — Advanced Traits & Type System**
> Customizing the behavior of built-in arithmetic, logical, indexing, and assignment operators (`+`, `-`, `*`, `[]`, `+=`) for custom types by implementing traits in the `std::ops` module.

---

## 1. Prerequisites

- [Traits](../level_04/trait.md) — Standard trait implementation mechanics (`impl Trait for Type`).
- [Associated Types](../level_04/associated_types.md) — Standard associated types (`type Output`) used in `std::ops` traits.
- [`Deref` / `DerefMut` Traits](../level_14/deref_deref_mut_traits.md) — Customizing the `*` dereference operator via `std::ops`.

---

## 2. Term Category

**Syntax / Trait / Language Feature**: Operator Overloading in Rust allows custom types (like 2D vectors, complex numbers, matrices, or custom collections) to define custom behaviors for standard language operators (`+`, `-`, `*`, `/`, `%`, `==`, `[]`, `+=`). In Rust, operator overloading is strictly type-safe and syntactic sugar for trait method calls declared in the `std::ops` module (e.g. `a + b` is syntactic sugar for `std::ops::Add::add(a, b)`).

---

## 3. Environment Context

**Universal Rust**: Operator overloading via `std::ops` is supported across all Rust targets (`std`, `no_std`, WASM, embedded). It is heavily used in math libraries (`cgmath`, `nalgebra`), matrix operations, domain-specific types (e.g. `Duration + Duration`), and container indexing (`Index`).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"

In languages like JavaScript or Java, operators like `+` or `[]` are either fixed to primitive types (numbers, strings) or limited to built-in arrays. When writing mathematical or graphics code in Java, adding two vectors requires writing verbose method chains:
```java
Vector3D result = v1.add(v2).multiply(2.0);
```

In C++, operator overloading allows arbitrary operator redefinition, but permits defining arbitrary custom operators (`<<` overloaded for I/O streams) or altering operator evaluation rules unpredictably without trait boundaries.

Rust wanted an operator overloading system that was:
1. **Readable & Expressive**: Natural mathematical expressions (`v1 + v2 * 2.0`).
2. **Strictly Trait-Bound**: You cannot invent new operator symbols (like `**` or `<=>`). You can only overload existing built-in operators by implementing their corresponding standard library traits in `std::ops`.
3. **Type-Safe & Explicit**: Operator parameters and return types are fully checked by the compiler. You can overload `Add` for `Point + Vector`, `Point + Point`, or `&Point + &Point`.

### (2) Reality Metaphor

Imagine a **Universal Mechanical Adapter Control Board**:

- **Languages Without Operator Overloading** are like a factory machine with separate buttons labeled `Button_Add_Integers()`, `Button_Add_Floats()`, and `Button_Combine_Vectors()`. Operators only work for factory defaults.
- **C++ Style Arbitrary Overloading** is like allowing workers to rewire any button on the control panel to do anything: pressing the "+" button might cause the coffee machine to pour espresso (**confusing I/O stream overloading**).
- **Rust `std::ops` Operator Overloading** is a standardized plug-in socket interface:
  - The "+" symbol on the control panel is permanently wired to a standard socket labeled `std::ops::Add`.
  - When you install a custom 2D Vector module into your machine, you plug it into the `std::ops::Add` socket by implementing `fn add(self, rhs: Self) -> Self`.
  - Pressing "+" on your 2D Vector seamlessly runs your vector addition formula with complete type safety and predictable syntax.

### (3) Code Examples

#### Short Snippet (Overloading `+` (`std::ops::Add`) for 2D Point)

```rust
use std::ops::Add;

#[derive(Debug, PartialEq)]
struct Point2D {
    x: i32,
    y: i32,
}

// Implement `Add` trait to overload `+` operator
impl Add for Point2D {
    type Output = Point2D;

    fn add(self, rhs: Point2D) -> Self::Output {
        Point2D {
            x: self.x + rhs.x,
            y: self.y + rhs.y,
        }
    }
}

fn main() {
    let p1 = Point2D { x: 10, y: 20 };
    let p2 = Point2D { x: 5, y: 15 };

    // Syntactic sugar: `p1 + p2` calls `Add::add(p1, p2)`
    let sum = p1 + p2;

    println!("Sum of points: {:?}", sum); // Point2D { x: 15, y: 35 }
    assert_eq!(sum, Point2D { x: 15, y: 35 });
}
```

#### Fuller Example (Overloading `[]` Indexing via `Index` & `IndexMut`)

```rust
use std::ops::{Index, IndexMut};

/// A custom 2D Grid collection supporting matrix indexing `grid[(row, col)]`
pub struct Grid2D<T> {
    rows: usize,
    cols: usize,
    data: Vec<T>,
}

impl<T: Default + Clone> Grid2D<T> {
    pub fn new(rows: usize, cols: usize) -> Self {
        Grid2D {
            rows,
            cols,
            data: vec![T::default(); rows * cols],
        }
    }
}

// 1. Immutable Indexing `grid[(row, col)]`
impl<T> Index<(usize, usize)> for Grid2D<T> {
    type Output = T;

    fn index(&self, index: (usize, usize)) -> &Self::Output {
        let (row, col) = index;
        assert!(row < self.rows && col < self.cols, "Grid index out of bounds");
        &self.data[row * self.cols + col]
    }
}

// 2. Mutable Indexing `grid[(row, col)] = val`
impl<T> IndexMut<(usize, usize)> for Grid2D<T> {
    fn index_mut(&mut self, index: (usize, usize)) -> &mut Self::Output {
        let (row, col) = index;
        assert!(row < self.rows && col < self.cols, "Grid index out of bounds");
        &mut self.data[row * self.cols + col]
    }
}

fn main() {
    let mut grid: Grid2D<i32> = Grid2D::new(3, 3);

    // Overloaded `IndexMut` assignment `grid[(1, 1)] = val`:
    grid[(1, 1)] = 42;

    // Overloaded `Index` read `grid[(1, 1)]`:
    println!("Value at grid (1, 1): {}", grid[(1, 1)]); // 42
}
```

---

## 4. Standard Library `std::ops` Traits Mapping

| Operator | Trait Name | Method Signature |
| :--- | :--- | :--- |
| `+` | `std::ops::Add` | `fn add(self, rhs: RHS) -> Self::Output` |
| `-` | `std::ops::Sub` | `fn sub(self, rhs: RHS) -> Self::Output` |
| `*` | `std::ops::Mul` | `fn mul(self, rhs: RHS) -> Self::Output` |
| `/` | `std::ops::Div` | `fn div(self, rhs: RHS) -> Self::Output` |
| `%` | `std::ops::Rem` | `fn rem(self, rhs: RHS) -> Self::Output` |
| `+=` | `std::ops::AddAssign` | `fn add_assign(&mut self, rhs: RHS)` |
| `-=` | `std::ops::SubAssign` | `fn sub_assign(&mut self, rhs: RHS)` |
| `[]` | `std::ops::Index` | `fn index(&self, index: Idx) -> &Self::Output` |
| `[] =` | `std::ops::IndexMut` | `fn index_mut(&mut self, index: Idx) -> &mut Self::Output` |
| `-x` (unary) | `std::ops::Neg` | `fn neg(self) -> Self::Output` |
| `!x` (unary) | `std::ops::Not` | `fn not(self) -> Self::Output` |

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Move vs Borrow Ownership Loss during Operator Use

**The mistake:** Implementing `Add` for owned `Point` (`impl Add for Point`), calling `p1 + p2`, and then trying to reuse `p1` or `p2` later in the function.

**Why it's wrong:** `fn add(self, rhs: Self)` takes ownership of both `self` and `rhs` by default. If `Point` is not `Copy`, evaluating `p1 + p2` moves `p1` and `p2`, rendering them invalid in subsequent lines.

*Incorrect:*
```rust
struct BigData(Vec<u8>);
impl Add for BigData { ... }

let d1 = BigData(vec![1]);
let d2 = BigData(vec![2]);
let d3 = d1 + d2;
// ❌ Compiler Error E0382: use of moved value `d1`!
// println!("{:?}", d1); 
```

*Fix:*
```rust
// Implement `Add` for references `&BigData` as well as owned `BigData`
impl<'a, 'b> Add<&'b BigData> for &'a BigData {
    type Output = BigData;
    fn add(self, rhs: &'b BigData) -> Self::Output { ... }
}

let d3 = &d1 + &d2; // Operates on references without moving ownership!
```

### Mistake 2: Forgetting to Implement `AddAssign` when `Add` is Implemented

**The mistake:** Implementing `Add` for `+` and expecting `+=` to work automatically.

**Why it's wrong:** `+` (`Add`) and `+=` (`AddAssign`) are separate traits in `std::ops`. Implementing `Add` does NOT automatically overload `+=`.

*Incorrect:*
```rust
let mut p = Point2D { x: 1, y: 1 };
// ❌ Compiler Error: binary assignment operator `+=` cannot be applied to type `Point2D`
// p += Point2D { x: 2, y: 2 }; 
```

*Fix:*
```rust
use std::ops::AddAssign;

impl AddAssign for Point2D {
    fn add_assign(&mut self, rhs: Self) {
        self.x += rhs.x;
        self.y += rhs.y;
    }
}
p += Point2D { x: 2, y: 2 }; // Works!
```

### Mistake 3: Violating Expected Operator Principle of Least Surprise

**The mistake:** Overloading `+` to perform data deletion, or `*` to perform network I/O requests.

**Why it's wrong:** Operator overloading should adhere strictly to mathematical and standard domain conventions. Surprising or non-intuitive operator behavior hurts codebase readability.

---

## 6. Practice Exercises

### Exercise 1: Embedded Fixed-Point Arithmetic & Saturating Operators (`Add`, `Sub`, `Mul`, `Neg`, `AddAssign`, References)

**Problem:** In embedded systems (e.g., motor controllers, digital signal processors) operating without a Hardware Floating Point Unit (FPU), fractional numbers are calculated using Fixed-Point arithmetic (`Q16.16`). Implement a fixed-point struct `Q16_16(pub i32)` with integer scaling ($1.0 = 65536$). Overload `Add`, `Sub`, `Mul`, `Neg`, `AddAssign`, and reference addition `&Q16_16 + &Q16_16`. Verify correctness with unit tests and assertions.

> [!check]- Answer
> ```rust
> use std::ops::{Add, AddAssign, Mul, Neg, Sub};
> 
> /// Q16.16 Fixed-Point Number representation.
> /// Upper 16 bits represent integer part, lower 16 bits represent fractional part.
> #[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
> pub struct Q16_16(pub i32);
> 
> impl Q16_16 {
>     pub const SCALE: i32 = 65536; // 1 << 16
> 
>     /// Create Q16.16 from a floating-point number.
>     pub fn from_f64(val: f64) -> Self {
>         Q16_16((val * Self::SCALE as f64) as i32)
>     }
> 
>     /// Convert Q16.16 back to f64 for verification.
>     pub fn to_f64(self) -> f64 {
>         self.0 as f64 / Self::SCALE as f64
>     }
> }
> 
> // 1. Homogeneous Add: Q16_16 + Q16_16
> impl Add for Q16_16 {
>     type Output = Self;
> 
>     fn add(self, rhs: Self) -> Self::Output {
>         Q16_16(self.0.saturating_add(rhs.0))
>     }
> }
> 
> // 2. Reference Add: &Q16_16 + &Q16_16 (prevents moves when operating on borrowed references)
> impl<'a, 'b> Add<&'b Q16_16> for &'a Q16_16 {
>     type Output = Q16_16;
> 
>     fn add(self, rhs: &'b Q16_16) -> Self::Output {
>         Q16_16(self.0.saturating_add(rhs.0))
>     }
> }
> 
> // 3. Subtraction: Q16_16 - Q16_16
> impl Sub for Q16_16 {
>     type Output = Self;
> 
>     fn sub(self, rhs: Self) -> Self::Output {
>         Q16_16(self.0.saturating_sub(rhs.0))
>     }
> }
> 
> // 4. Fixed-Point Multiplication: (a * b) >> 16
> impl Mul for Q16_16 {
>     type Output = Self;
> 
>     fn mul(self, rhs: Self) -> Self::Output {
>         let prod = (self.0 as i64 * rhs.0 as i64) >> 16;
>         Q16_16(prod as i32)
>     }
> }
> 
> // 5. Unary Negation: -Q16_16
> impl Neg for Q16_16 {
>     type Output = Self;
> 
>     fn neg(self) -> Self::Output {
>         Q16_16(-self.0)
>     }
> }
> 
> // 6. Compound AddAssign: Q16_16 += Q16_16
> impl AddAssign for Q16_16 {
>     fn add_assign(&mut self, rhs: Self) {
>         self.0 = self.0.saturating_add(rhs.0);
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_fixed_point_ops() {
>         let a = Q16_16::from_f64(1.5);
>         let b = Q16_16::from_f64(2.5);
> 
>         // Test Add
>         let sum = a + b;
>         assert_eq!(sum, Q16_16::from_f64(4.0));
>         assert_eq!(sum.to_f64(), 4.0);
> 
>         // Test Reference Add without consuming a and b
>         let ref_sum = &a + &b;
>         assert_eq!(ref_sum, Q16_16::from_f64(4.0));
> 
>         // Test Sub
>         let diff = b - a;
>         assert_eq!(diff, Q16_16::from_f64(1.0));
> 
>         // Test Mul
>         let m1 = Q16_16::from_f64(2.0);
>         let m2 = Q16_16::from_f64(3.5);
>         let prod = m1 * m2;
>         assert_eq!(prod, Q16_16::from_f64(7.0));
> 
>         // Test Unary Negation
>         let neg_a = -a;
>         assert_eq!(neg_a, Q16_16::from_f64(-1.5));
> 
>         // Test AddAssign
>         let mut acc = Q16_16::from_f64(10.0);
>         acc += Q16_16::from_f64(5.25);
>         assert_eq!(acc, Q16_16::from_f64(15.25));
>     }
> }
> 
> fn main() {
>     let a = Q16_16::from_f64(1.5);
>     let b = Q16_16::from_f64(2.5);
>     let sum = a + b;
>     println!("1.5 + 2.5 in Q16.16 = {} (f64: {})", sum.0, sum.to_f64());
>     assert_eq!(sum.to_f64(), 4.0);
> }
> ```
> 
> **Step-by-Step Technical Explanation:**
> 1. **Fixed-Point Arithmetic Mechanics**: In fixed-point $Q16.16$, the integer value is shifted left by 16 bits ($1.0 = 65536$). When multiplying two $Q16.16$ values, scaling multiplies twice ($(a \times 65536) \times (b \times 65536) = a \cdot b \times 65536^2$), requiring an intermediate `i64` cast and a bitwise right-shift `>> 16` to re-scale back to $Q16.16$.
> 2. **Reference Operator Overloading (`impl Add<&B> for &A`)**: By implementing `Add<&Q16_16> for &Q16_16`, evaluating `&a + &b` borrows `a` and `b` rather than moving them. This is vital when custom types are heavy or non-`Copy`.
> 3. **Saturating Bounds Safety**: Using `.saturating_add()` and `.saturating_sub()` inside arithmetic trait methods prevents integer overflow panics in low-level embedded hardware loops.
> 4. **`Add` vs `AddAssign` Separation**: Implementing `Add` overloads `+` but does NOT automatically overload `+=`. `AddAssign::add_assign(&mut self, rhs)` must be explicitly implemented to mutate the variable in place.

---

### Exercise 2: Physical Unit Safety with Heterogeneous Binary Operators (`Mul`, `Div`, `AddAssign`)

**Problem:** In robotics and sensor fusion systems, multiplying velocity by time must produce distance, while dividing distance by time must produce velocity. Attempting to add seconds to meters must fail at compile time. Define type-safe wrappers `Meters(pub f64)`, `Seconds(pub f64)`, and `MetersPerSecond(pub f64)`. Implement heterogeneous `Mul` and `Div` traits to enforce dimensional analysis at compile-time. Include complete unit tests and assertions.

> [!check]- Answer
> ```rust
> use std::ops::{Add, AddAssign, Div, Mul, Sub};
> 
> #[derive(Debug, Clone, Copy, PartialEq)]
> pub struct Meters(pub f64);
> 
> #[derive(Debug, Clone, Copy, PartialEq)]
> pub struct Seconds(pub f64);
> 
> #[derive(Debug, Clone, Copy, PartialEq)]
> pub struct MetersPerSecond(pub f64);
> 
> // 1. Homogeneous Add/Sub for Meters
> impl Add for Meters {
>     type Output = Self;
>     fn add(self, rhs: Self) -> Self::Output {
>         Meters(self.0 + rhs.0)
>     }
> }
> 
> impl Sub for Meters {
>     type Output = Self;
>     fn sub(self, rhs: Self) -> Self::Output {
>         Meters(self.0 - rhs.0)
>     }
> }
> 
> impl AddAssign for Meters {
>     fn add_assign(&mut self, rhs: Self) {
>         self.0 += rhs.0;
>     }
> }
> 
> // 2. Heterogeneous Multiplication: MetersPerSecond * Seconds -> Meters
> impl Mul<Seconds> for MetersPerSecond {
>     type Output = Meters;
> 
>     fn mul(self, rhs: Seconds) -> Self::Output {
>         Meters(self.0 * rhs.0)
>     }
> }
> 
> // Commutative Multiplication: Seconds * MetersPerSecond -> Meters
> impl Mul<MetersPerSecond> for Seconds {
>     type Output = Meters;
> 
>     fn mul(self, rhs: MetersPerSecond) -> Self::Output {
>         Meters(self.0 * rhs.0)
>     }
> }
> 
> // 3. Heterogeneous Division: Meters / Seconds -> MetersPerSecond
> impl Div<Seconds> for Meters {
>     type Output = MetersPerSecond;
> 
>     fn div(self, rhs: Seconds) -> Self::Output {
>         MetersPerSecond(self.0 / rhs.0)
>     }
> }
> 
> // 4. Heterogeneous Division: Meters / MetersPerSecond -> Seconds
> impl Div<MetersPerSecond> for Meters {
>     type Output = Seconds;
> 
>     fn div(self, rhs: MetersPerSecond) -> Self::Output {
>         Seconds(self.0 / rhs.0)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_physical_units() {
>         let dist1 = Meters(100.0);
>         let dist2 = Meters(50.0);
>         assert_eq!(dist1 + dist2, Meters(150.0));
> 
>         let mut current_pos = Meters(10.0);
>         current_pos += Meters(5.0);
>         assert_eq!(current_pos, Meters(15.0));
> 
>         let speed = MetersPerSecond(25.0);
>         let time = Seconds(4.0);
> 
>         // Speed * Time -> Distance
>         let distance: Meters = speed * time;
>         assert_eq!(distance, Meters(100.0));
> 
>         // Commutative Time * Speed -> Distance
>         let distance2: Meters = time * speed;
>         assert_eq!(distance2, Meters(100.0));
> 
>         // Distance / Time -> Speed
>         let calculated_speed: MetersPerSecond = distance / time;
>         assert_eq!(calculated_speed, MetersPerSecond(25.0));
> 
>         // Distance / Speed -> Time
>         let calculated_time: Seconds = distance / speed;
>         assert_eq!(calculated_time, Seconds(4.0));
>     }
> }
> 
> fn main() {
>     let speed = MetersPerSecond(15.0);
>     let time = Seconds(10.0);
>     let dist = speed * time;
>     println!("Travel distance: {:?} (speed: {:?}, time: {:?})", dist, speed, time);
>     assert_eq!(dist, Meters(150.0));
> }
> ```
> 
> **Step-by-Step Technical Explanation:**
> 1. **Heterogeneous Binary Operator Traits**: Standard arithmetic traits in `std::ops` have generic parameter defaults: `pub trait Mul<RHS = Self> { type Output; fn mul(self, rhs: RHS) -> Self::Output; }`. By overriding `RHS` with a different type (`Mul<Seconds> for MetersPerSecond`), operators can bridge two completely different types.
> 2. **Associated Type Output Flexibility**: The associated type `type Output` specifies the exact return type resulting from the operation. `MetersPerSecond * Seconds` specifies `type Output = Meters`, maintaining dimensional correctness.
> 3. **Commutativity Requirements**: In Rust, `a * b` calls `Mul::mul(a, b)` where `a` is `Self` and `b` is `RHS`. Therefore, `speed * time` and `time * speed` require separate trait implementations (`Mul<Seconds> for MetersPerSecond` vs `Mul<MetersPerSecond> for Seconds`).
> 4. **Zero-Cost Compile-Time Safety**: Newtype wrappers combined with heterogeneously overloaded operators catch physical unit dimension mismatch bugs at compile-time with zero runtime abstraction overhead.

---

### Exercise 3: Dynamic 2D Matrix Indexing & Mutable Slice Views (`Index`, `IndexMut`)

**Problem:** High-performance machine learning frameworks store multidimensional matrices in flat 1D vectors for cache locality. Implement a generic struct `Matrix2D<T>` that supports tuple indexing `matrix[(row, col)]` for read/write access, as well as row slice extraction `&matrix[row]`. Include full unit tests with `assert_eq!` and `#[should_panic]` testing out-of-bounds access.

> [!check]- Answer
> ```rust
> use std::ops::{Index, IndexMut};
> 
> /// Flat 2D Matrix buffer optimized for contiguous cache memory locality
> #[derive(Debug, Clone, PartialEq)]
> pub struct Matrix2D<T> {
>     rows: usize,
>     cols: usize,
>     data: Vec<T>,
> }
> 
> impl<T: Default + Clone> Matrix2D<T> {
>     pub fn new(rows: usize, cols: usize) -> Self {
>         Matrix2D {
>             rows,
>             cols,
>             data: vec![T::default(); rows * cols],
>         }
>     }
> 
>     pub fn rows(&self) -> usize {
>         self.rows
>     }
> 
>     pub fn cols(&self) -> usize {
>         self.cols
>     }
> }
> 
> // 1. Immutable 2D Tuple Indexing: matrix[(row, col)]
> impl<T> Index<(usize, usize)> for Matrix2D<T> {
>     type Output = T;
> 
>     fn index(&self, index: (usize, usize)) -> &Self::Output {
>         let (row, col) = index;
>         assert!(
>             row < self.rows && col < self.cols,
>             "Matrix index ({}, {}) out of bounds for matrix size {}x{}",
>             row,
>             col,
>             self.rows,
>             self.cols
>         );
>         &self.data[row * self.cols + col]
>     }
> }
> 
> // 2. Mutable 2D Tuple Indexing: matrix[(row, col)] = val
> impl<T> IndexMut<(usize, usize)> for Matrix2D<T> {
>     fn index_mut(&mut self, index: (usize, usize)) -> &mut Self::Output {
>         let (row, col) = index;
>         assert!(
>             row < self.rows && col < self.cols,
>             "Matrix index ({}, {}) out of bounds for matrix size {}x{}",
>             row,
>             col,
>             self.rows,
>             self.cols
>         );
>         &mut self.data[row * self.cols + col]
>     }
> }
> 
> // 3. Immutable Row Slice Indexing: &matrix[row] -> &[T]
> impl<T> Index<usize> for Matrix2D<T> {
>     type Output = [T];
> 
>     fn index(&self, row: usize) -> &Self::Output {
>         assert!(
>             row < self.rows,
>             "Row index {} out of bounds for matrix with {} rows",
>             row,
>             self.rows
>         );
>         let start = row * self.cols;
>         &self.data[start..start + self.cols]
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_matrix_indexing() {
>         let mut mat: Matrix2D<i32> = Matrix2D::new(3, 4);
> 
>         // Mutate using tuple index (row 1, col 2)
>         mat[(1, 2)] = 42;
>         mat[(0, 0)] = 10;
>         mat[(2, 3)] = 99;
> 
>         // Read using tuple index
>         assert_eq!(mat[(1, 2)], 42);
>         assert_eq!(mat[(0, 0)], 10);
>         assert_eq!(mat[(2, 3)], 99);
>         assert_eq!(mat[(0, 1)], 0); // Default value
> 
>         // Access full row as slice using Index<usize>
>         let row_1: &[i32] = &mat[1];
>         assert_eq!(row_1, &[0, 0, 42, 0]);
>         assert_eq!(row_1.len(), 4);
>     }
> 
>     #[test]
>     #[should_panic(expected = "Matrix index (3, 0) out of bounds")]
>     fn test_out_of_bounds_tuple() {
>         let mat: Matrix2D<i32> = Matrix2D::new(3, 3);
>         let _ = mat[(3, 0)];
>     }
> }
> 
> fn main() {
>     let mut mat: Matrix2D<f64> = Matrix2D::new(2, 2);
>     mat[(0, 0)] = 1.1;
>     mat[(0, 1)] = 2.2;
>     mat[(1, 0)] = 3.3;
>     mat[(1, 1)] = 4.4;
> 
>     println!("Matrix row 0: {:?}", &mat[0]);
>     assert_eq!(mat[(1, 0)], 3.3);
> }
> ```
> 
> **Step-by-Step Technical Explanation:**
> 1. **Index Trait Desugaring**: In Rust, evaluating `container[idx]` desugars to `*Index::index(&container, idx)`. The return type of `index()` is `&Self::Output`, allowing auto-dereferencing to obtain the inner value reference `&T`.
> 2. **IndexMut Mechanics**: `IndexMut::index_mut(&mut container, idx)` returns `&mut Self::Output`. This permits left-hand side assignment like `matrix[(1, 2)] = 42`, where Rust automatically dereferences the mutable reference returned by `index_mut`.
> 3. **Custom Index Types**: The generic parameter `Idx` in `Index<Idx>` can be any type—such as tuples `(usize, usize)`, ranges `Range<usize>`, or standard `usize`. Here, implementing `Index<(usize, usize)>` provides multi-dimensional subscripting syntax `grid[(r, c)]`.
> 4. **Returning Dynamically Sized Types (DSTs)**: By implementing `Index<usize>` with `type Output = [T]`, indexing a matrix by row number (`&matrix[1]`) yields a borrowed slice view (`&[T]`) directly into the flat buffer without allocating memory.
> 
---

### Exercise 4: Bitwise Hardware MMIO Register Manipulation (`BitAnd`, `BitOr`, `BitXor`, `Not`, `BitOrAssign`)

**Problem:** Low-level microcontroller drivers use Memory-Mapped I/O (MMIO) register bitmasks to toggle control flags (`ENABLE`, `INTERRUPT`, `DMA_MODE`). Create a struct `ControlRegister(pub u32)` and overload bitwise operators (`BitAnd`, `BitOr`, `BitXor`, `Not`, `BitOrAssign`) to enable clean bitwise syntax without raw integer conversions. Include test assertions for setting, clearing, and toggling register flags.

> [!check]- Answer
> ```rust
> use std::ops::{BitAnd, BitOr, BitOrAssign, BitXor, Not};
> 
> /// MMIO Peripheral Control Register wrapper
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub struct ControlRegister(pub u32);
> 
> impl ControlRegister {
>     // Hardware Flag Bitmasks
>     pub const NONE: u32 = 0;
>     pub const ENABLE: u32 = 1 << 0;       // Bit 0: 0x01
>     pub const INTERRUPT: u32 = 1 << 1;    // Bit 1: 0x02
>     pub const DMA_MODE: u32 = 1 << 2;     // Bit 2: 0x04
>     pub const ERROR_RESET: u32 = 1 << 3;  // Bit 3: 0x08
> 
>     pub fn new(val: u32) -> Self {
>         ControlRegister(val)
>     }
> 
>     pub fn is_set(&self, mask: u32) -> bool {
>         (self.0 & mask) == mask
>     }
> }
> 
> // 1. Bitwise OR with raw bitmask: `reg | MASK`
> impl BitOr<u32> for ControlRegister {
>     type Output = Self;
> 
>     fn bitor(self, rhs: u32) -> Self::Output {
>         ControlRegister(self.0 | rhs)
>     }
> }
> 
> // Bitwise OR between registers: `reg1 | reg2`
> impl BitOr for ControlRegister {
>     type Output = Self;
> 
>     fn bitor(self, rhs: Self) -> Self::Output {
>         ControlRegister(self.0 | rhs.0)
>     }
> }
> 
> // 2. Bitwise AND: `reg & mask`
> impl BitAnd<u32> for ControlRegister {
>     type Output = Self;
> 
>     fn bitand(self, rhs: u32) -> Self::Output {
>         ControlRegister(self.0 & rhs)
>     }
> }
> 
> impl BitAnd for ControlRegister {
>     type Output = Self;
> 
>     fn bitand(self, rhs: Self) -> Self::Output {
>         ControlRegister(self.0 & rhs.0)
>     }
> }
> 
> // 3. Bitwise XOR: `reg ^ mask` (Toggle bits)
> impl BitXor<u32> for ControlRegister {
>     type Output = Self;
> 
>     fn bitxor(self, rhs: u32) -> Self::Output {
>         ControlRegister(self.0 ^ rhs)
>     }
> }
> 
> // 4. Bitwise NOT: `!reg` (Invert bits)
> impl Not for ControlRegister {
>     type Output = Self;
> 
>     fn not(self) -> Self::Output {
>         ControlRegister(!self.0)
>     }
> }
> 
> // 5. Bitwise OR Assign: `reg |= mask`
> impl BitOrAssign<u32> for ControlRegister {
>     fn bitor_assign(&mut self, rhs: u32) {
>         self.0 |= rhs;
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_register_bitops() {
>         let mut reg = ControlRegister::new(ControlRegister::NONE);
> 
>         // 1. Set ENABLE flag via BitOrAssign (`|=`)
>         reg |= ControlRegister::ENABLE;
>         assert!(reg.is_set(ControlRegister::ENABLE));
>         assert_eq!(reg.0, 0x01);
> 
>         // 2. Combine flags via BitOr (`|`)
>         let reg_with_dma = reg | ControlRegister::DMA_MODE;
>         assert_eq!(reg_with_dma.0, 0x05); // 0x01 | 0x04 = 0x05
>         assert!(reg_with_dma.is_set(ControlRegister::ENABLE));
>         assert!(reg_with_dma.is_set(ControlRegister::DMA_MODE));
> 
>         // 3. Clear flag using BitAnd (`&`) and Bitwise NOT (`!`)
>         // Mask out ENABLE flag from 0x05
>         let cleared = reg_with_dma & (!ControlRegister::ENABLE);
>         assert_eq!(cleared.0, 0x04);
>         assert!(!cleared.is_set(ControlRegister::ENABLE));
>         assert!(cleared.is_set(ControlRegister::DMA_MODE));
> 
>         // 4. Toggle flag using BitXor (`^`)
>         let toggled = reg_with_dma ^ ControlRegister::INTERRUPT;
>         assert_eq!(toggled.0, 0x07); // 0x05 ^ 0x02 = 0x07
>         assert!(toggled.is_set(ControlRegister::INTERRUPT));
> 
>         let untoggled = toggled ^ ControlRegister::INTERRUPT;
>         assert_eq!(untoggled.0, 0x05);
>         assert!(!untoggled.is_set(ControlRegister::INTERRUPT));
>     }
> }
> 
> fn main() {
>     let mut ctrl = ControlRegister::new(ControlRegister::NONE);
>     ctrl |= ControlRegister::ENABLE | ControlRegister::INTERRUPT;
>     println!("Control Register Value: {:#010b}", ctrl.0);
>     assert_eq!(ctrl.0, 0b0011);
> }
> ```
> 
> **Step-by-Step Technical Explanation:**
> 1. **Bitwise Trait Desugaring**: Operator expressions desugar directly to `std::ops` bitwise traits: `a | b` -> `BitOr::bitor(a, b)`, `a & b` -> `BitAnd::bitand(a, b)`, `a ^ b` -> `BitXor::bitxor(a, b)`, `!a` -> `Not::not(a)`, and `a |= b` -> `BitOrAssign::bitor_assign(&mut a, b)`.
> 2. **Mask Inversion with Bitwise NOT**: Bitwise NOT (`!MASK`) flips all 0s to 1s and 1s to 0s. Combining bitwise AND with inverted mask (`reg & !ENABLE`) clears specific bitfield flags while leaving all other active control bits intact.
> 3. **Bit Toggling with XOR**: Bitwise XOR (`reg ^ INTERRUPT`) flips target bits—if the bit was 0 it becomes 1, and if 1 it becomes 0.
> 4. **Embedded `#![no_std]` Compatibility**: All bitwise traits live in `core::ops` as well as `std::ops`. Overloading bitwise operators compiles down to single CPU bitwise assembly instructions (`or`, `and`, `xor`, `not`) with zero runtime overhead.

---

## 7. Related Terms

- [`Deref` / `DerefMut` Traits](../level_14/deref_deref_mut_traits.md) — Overloading the `*` dereference operator.
- [Traits](../level_04/trait.md) — Trait abstraction mechanism.
- [Associated Types](../level_04/associated_types.md) — `type Output` used in `std::ops` traits.
- [`AsRef` / `AsMut`](../level_14/as_ref_as_mut.md) — Reference conversion traits.

---

## 8. Key Takeaways

- Operator Overloading allows custom types to define behaviors for operators (`+`, `-`, `*`, `[]`, `+=`) by implementing `std::ops` traits.
- Expressions like `a + b` are syntactic sugar for `std::ops::Add::add(a, b)`.
- You cannot invent custom operator symbols; you can only overload built-in operators provided in `std::ops`.
- To avoid moving non-`Copy` types, implement operator traits for reference types (`&Type + &Type`).
- Separate traits exist for value operators (`Add`) and compound assignment operators (`AddAssign`).
