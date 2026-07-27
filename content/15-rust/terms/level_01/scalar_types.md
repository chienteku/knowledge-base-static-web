# Scalar Types

> **Level 1 — Foundations**
> Primitive types: integers (`i32`, `u64`…), floats (`f32`, `f64`), `bool`, and `char`.

---

## 1. Prerequisites

- [Variable](../level_01/variable.md) — A named binding used to store data.

---

## 2. Term Category

**Rust-nonspecific**: A general programming concept (primitive data types), though Rust's specific integer naming convention (`i32`, `u8`) is distinct.

---

## 3. Explanation

### (1) Design Motivation — "Why does this exist in programming languages?"

At the hardware level, everything in a computer is just a giant sequence of 1s and 0s. The CPU doesn't inherently know if `01000001` means the number 65, the letter 'A', or a pixel color. **Scalar types** exist to give meaning to those bits. They tell the compiler exactly how much memory to allocate for a single value and how to interpret it.

In older languages like C, a type like `int` might be 16 bits on one machine and 32 bits on another, leading to portability bugs. Rust takes a strict, deterministic approach. Rust's scalar types explicitly declare their memory size and behavior. For example, `i32` is always a 32-bit signed integer everywhere. This guarantees your code behaves the exact same way on a tiny microcontroller as it does on a massive cloud server.

There are four primary scalar types in Rust:
1. **Integers**: Whole numbers (signed like `i32` can be negative; unsigned like `u8` are strictly positive).
2. **Floating-point numbers**: Numbers with decimals (`f32`, `f64`).
3. **Booleans**: True or false (`bool`).
4. **Characters**: A single letter, number, or emoji (`char`), which is exactly 4 bytes in Rust to support all of Unicode.

### (2) Reality Metaphor

Think of scalar types as the **atomic elements of the periodic table** (Hydrogen, Oxygen, Iron). 
They represent a single, indivisible concept. A block of iron is just iron. You can't break it down into simpler materials. Later on, you will combine these atomic elements to create complex molecules (Compound Types) like water or steel, but the universe is fundamentally built on these basic, single-value elements.

### (3) Rust Code Examples

#### Short Snippet
```rust
let integer: i32 = -42;         // Signed 32-bit integer
let float: f64 = 3.14159;       // 64-bit floating point
let is_active: bool = true;     // Boolean
let initial: char = 'R';        // Character (single quotes)
```

#### Fuller Example
```rust
fn main() {
    // If you don't specify the type, Rust defaults to i32 for integers 
    // and f64 for floats, because they are fast on modern CPUs.
    let speed_limit = 65; // Inferred as i32
    let exact_temp = 98.6; // Inferred as f64

    // u8 is an "unsigned 8-bit integer". It holds values from 0 to 255.
    // It is perfect for ages, RGB colors, or raw bytes.
    let age: u8 = 25;

    // Characters use single quotes. Strings use double quotes.
    // Rust chars support all Unicode, including emojis!
    let status_emoji: char = '✅';
    let is_admin = false;

    if !is_admin {
        println!("User is {} years old. Status: {}", age, status_emoji);
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Assigning a negative number to an unsigned integer

**The mistake:** Trying to store a negative value in a `u` (unsigned) type.

**Why it's wrong:** "Unsigned" means the number does not have a +/- sign; it is strictly positive (starting from 0). If you try to give it a negative number, the compiler will reject it to prevent memory corruption.

*Incorrect:*
```rust
let balance: u32 = -100; // ERROR: cannot apply unary operator `-` to type `u32`
```

*Fix:*
```rust
let balance: i32 = -100; // Use an 'i' (integer) type which is signed.
```

### Mistake 2: Mixing scalar types in math operations

**The mistake:** Trying to add or multiply an integer with a float, or an `i32` with an `i64`.

**Why it's wrong:** Unlike JavaScript or Python, Rust refuses to implicitly convert (coerce) your data types. If you mix types, precision could be lost. You must explicitly convert one type to another using the `as` keyword.

*Incorrect:*
```rust
let apples = 5;       // i32
let weight = 2.5;     // f64
let total = apples * weight; // ERROR: cannot multiply `i32` by `f64`
```

*Fix:*
```rust
let apples = 5;
let weight = 2.5;
// Explicitly cast `apples` to an f64 before multiplying
let total = (apples as f64) * weight; 
```

---

### Mistake 3: Concurrent Access to Scalar Types Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Scalar Types instances across OS threads via `std::thread::spawn`.

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

## 5. Practice Exercises

### Exercise 1: Fix the Type Mismatch

**Problem:** The following code fails to compile because it mixes types. Fix it by using the `as` keyword to cast the `u8` into an `i32` before the addition.

```rust
fn main() {
    let small_num: u8 = 10;
    let large_num: i32 = 1000;
    
    let sum = small_num + large_num;
    println!("Sum is {}", sum);
}
```

**Expected output:**
```text
Sum is 1010
```

> [!check]- Answer
> - You cannot add a `u8` directly to an `i32`.
> - Change `small_num + large_num` to `(small_num as i32) + large_num`.

---

### Exercise 2: Bitwise Operations on Integers

**Problem:** Perform bitwise AND (`&`), OR (`|`), and XOR (`^`) on `0b1100_u8` and `0b1010_u8`. Print the resulting values in binary format (`{:04b}`).

**Expected output:**
```
AND: 1000
OR: 1110
XOR: 0110
```

> [!check]- Answer
> ```rust
> fn main() {
>     let a: u8 = 0b1100;
>     let b: u8 = 0b1010;
>     println!("AND: {:04b}", a & b);
>     println!("OR: {:04b}", a | b);
>     println!("XOR: {:04b}", a ^ b);
> }
> ```
>
> **Explanation:** Bitwise operators manipulate bit fields directly, and `{:04b}` formats numbers into binary representations padded to 4 digits.

### Exercise 3: IEEE-754 Float NaN Comparison Trap

**Problem:** Demonstrate why comparing `f32::NAN == f32::NAN` returns `false`, and check NaN using `.is_nan()` instead.

**Expected output:**
```
Direct equality: false
is_nan check: true
```

> [!check]- Answer
> ```rust
> fn main() {
>     let nan = f32::NAN;
>     println!("Direct equality: {}", nan == nan);
>     println!("is_nan check: {}", nan.is_nan());
> }
> ```
>
> **Explanation:** By IEEE 754 standards, `NaN` is not equal to any value, including itself. Rust provides `.is_nan()` for reliable verification.

---

## 6. Related Terms

- [Compound Types](../level_01/compound_types.md) — How to group multiple scalar types together into a single construct (like Tuples or Arrays).
- [Type Annotation](../level_01/type_annotation.md) — The syntax (`: type`) used to explicitly define a variable's scalar type.
- [Type Inference](../level_01/type_inference.md) — How the compiler guesses you want an `i32` or `f64` if you don't provide a type annotation.

---

## 7. Key Takeaways

- There are four main scalar types: integers, floating-point numbers, booleans, and characters.
- Rust uses strict, explicitly-sized naming for numbers (e.g., `i32` is 32-bit, `u8` is 8-bit).
- If you don't annotate a type, Rust defaults to `i32` for integers and `f64` for floats.
- Rust does not perform implicit type conversions; you must use the `as` keyword to mix types in operations.
- Characters (`char`) use single quotes (`'A'`) and are a full 4 bytes to support all Unicode symbols.
