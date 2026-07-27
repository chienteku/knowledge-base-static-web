# Compound Types

> **Level 1 — Foundations**
> Tuples `(i32, f64)` and fixed-length arrays `[i32; 5]`.

---

## 1. Prerequisites

- [Scalar Types](../level_01/scalar_types.md) — The fundamental, single-value data types (integers, floats, booleans, chars) that make up compound types.

---

## 2. Term Category

**Rust-nonspecific**: Grouping multiple values together is a fundamental concept in almost all programming languages.

---

## 3. Explanation

### (1) Design Motivation — "Why does this exist in programming languages?"

If you only had scalar types, passing related data around would be a nightmare. Imagine a function that calculates 3D coordinates. Without compound types, you would have to return three separate variables, which isn't cleanly supported by most function signatures. Compound types solve this by allowing you to bundle multiple values into a single package.

In Rust, the two primitive compound types are **Tuples** and **Arrays**. 
- **Tuples** let you group multiple values of *different* types into one block. They are perfect for returning multiple values from a function.
- **Arrays** let you group multiple values of the *same* type. 

A critical design rule in Rust is that **both Tuples and Arrays have a fixed length**. Once you define them, they can never grow or shrink. This allows the Rust compiler to allocate exactly the right amount of memory on the stack, making them incredibly fast and efficient.

### (2) Reality Metaphor

- **A Tuple is like a pre-packaged lunchbox.** It has specific compartments of different sizes. Slot 0 might hold a sandwich (a string), Slot 1 might hold an apple (a character), and Slot 2 might hold a juice box (an integer). The items are different, but they are bundled together as one "lunch".
- **An Array is like an egg carton.** It has a fixed number of slots (e.g., exactly 12), and every single slot must contain the exact same type of item (an egg).

### (3) Rust Code Examples

#### Short Snippet
```rust
// A tuple grouping an integer, a float, and a character
let my_tuple: (i32, f64, char) = (500, 6.4, 'Z');

// An array containing exactly five integers
let my_array: [i32; 5] = [1, 2, 3, 4, 5];
```

#### Fuller Example
```rust
fn main() {
    // TUPLES:
    // We can access tuple elements directly using a period (dot notation)
    let coordinates = (10, 20, 30);
    println!("The X coordinate is: {}", coordinates.0);
    
    // We can also "destructure" a tuple into separate variables
    let (x, y, z) = coordinates;
    println!("Destructured: x={}, y={}, z={}", x, y, z);

    // ARRAYS:
    // Arrays are useful when you want your data allocated on the stack 
    // rather than the heap, and you know the exact size.
    let months = ["Jan", "Feb", "Mar", "Apr"];
    
    // Arrays are accessed using square brackets (zero-indexed)
    let first_month = months[0];
    println!("The first month is {}", first_month);
    
    // You can also initialize an array with the same value repeated
    // This creates an array of exactly 100 zeros: [0, 0, 0, ..., 0]
    let zero_buffer = [0; 100]; 
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Out-of-Bounds Array Indexing Causing Runtime Panics

**The mistake:** Accessing an array element using `arr[index]` where `index >= arr.len()`.

**Why it's wrong:** Direct index lookups perform bounds checks at runtime and panic if the index exceeds array size. Use `.get(index)` for safe handling.

*Incorrect:*
```rust
let arr = [1, 2, 3];
let item = arr[5]; // 💥 Runtime panic: index out of bounds!
```

*Fix:*
```rust
let arr = [1, 2, 3];
if let Some(item) = arr.get(5) {
    println!("{}", item);
}
```

### Mistake 2: Attempting Dynamic Size Extensions on Fixed-Size Tuples and Arrays

**The mistake:** Attempting to push elements onto a fixed-size Rust tuple `(i32, &str)` or array `[i32; 4]`.

**Why it's wrong:** Tuples and arrays in Rust have fixed lengths determined at compile time. Use `Vec<T>` for dynamically resizable collections.

*Incorrect:*
```rust
let mut arr = [1, 2, 3];
// arr.push(4); // ❌ Method push does not exist on array
```

*Fix:*
```rust
let mut vec = vec![1, 2, 3];
vec.push(4); // Works dynamically!
```

### Mistake 3: Accessing Tuple Elements with Square Bracket Syntax

**The mistake:** Writing `tuple[0]` instead of dot notation `tuple.0`.

**Why it's wrong:** Tuples use dot indexing (`t.0`, `t.1`) because tuple fields can have heterogeneous types.

*Incorrect:*
```rust
let t = (10, "hello");
// let val = t[0]; // ❌ Cannot index tuple with []
```

*Fix:*
```rust
let t = (10, "hello");
let val = t.0; // Correct dot indexing
```

## 5. Practice Exercises

### Exercise 1: Tuple Destructuring and Array Access

**Problem:** Complete the code below to print the second element of the tuple, and the third element of the array.

```rust
fn main() {
    let user_info = ("Alice", 28, true);
    let top_scores = [100, 95, 90, 85, 80];
    
    // TODO: Extract the age (28) from user_info
    // let age = ...;
    
    // TODO: Extract the score 90 from top_scores
    // let third_score = ...;
    
    // println!("{} is {} years old and scored {}", user_info.0, age, third_score);
}
```

**Expected output:**
```text
Alice is 28 years old and scored 90
```

> [!check]- Answer
> - To get the second element of a tuple, use `.1` (tuples are zero-indexed).
> - To get the third element of an array, use `[2]` (arrays are zero-indexed).

---

### Exercise 2: Tuple Destructuring & Re-binding

**Problem:** Given a tuple `(100, "Rust", 3.14)`, destructure it into individual variables, swap the integer and float positions into a new tuple, and print the new tuple.

**Expected output:**
```
(3.14, "Rust", 100)
```

> [!check]- Answer
> ```rust
> fn main() {
>     let tuple = (100, "Rust", 3.14);
>     let (count, name, ratio) = tuple;
>     let swapped = (ratio, name, count);
>     println!("{:?}", swapped);
> }
> ```
>
> **Explanation:** Tuple pattern matching `let (count, name, ratio) = tuple;` extracts fields by position, allowing flexible rearrangement into a new tuple structure.

### Exercise 3: Array Initialization with Repeat Syntax

**Problem:** Create an array of 5 elements filled with the number `42`. Modify the third element to `99` and print the entire array.

**Expected output:**
```
[42, 42, 99, 42, 42]
```

> [!check]- Answer
> ```rust
> fn main() {
>     let mut arr = [42; 5];
>     arr[2] = 99;
>     println!("{:?}", arr);
> }
> ```
>
> **Explanation:** `[42; 5]` uses array repeat syntax to construct an array of type `[i32; 5]`. Mutability (`mut`) permits in-place element modification at index 2.

---

## 6. Related Terms

- [Scalar Types](../level_01/scalar_types.md) — The individual primitive values that are placed inside compound types.
- [Variable](../level_01/variable.md) — You bind compound types to variables just like scalar types.
- [Struct](../level_02/struct.md) — A more advanced way to group multiple values together using named fields instead of numbered indices.
- [`Vec<T>`](../level_02/vec_t.md) — The heap-allocated, dynamic version of an array that *can* grow and shrink.

---

## 7. Key Takeaways

- **Tuples** group multiple values of *different* types. Access elements using a dot (e.g., `tuple.0`).
- **Arrays** group multiple values of the *same* type. Access elements using brackets (e.g., `array[0]`).
- Both primitive Tuples and Arrays have a **fixed length** known at compile-time. They cannot grow or shrink.
- Rust actively prevents you from accessing array memory out-of-bounds, choosing to panic safely rather than read corrupted data.
