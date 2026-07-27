# Type Annotation

> **Level 1 — Foundations**
> Explicitly specifying a type, e.g. `let x: i32 = 5;`.

---

## 1. Prerequisites

- [Variable](../level_01/variable.md) — The named bindings that you attach type annotations to.
- [Type Inference](../level_01/type_inference.md) — The compiler's automatic guessing of types, which annotations override.

---

## 2. Term Category

**Rust-nonspecific**: Present in almost all statically-typed languages (like C++, Java, and TypeScript) as the primary way to define the shape and constraints of data.

---

## 3. Explanation

### (1) Design Motivation — "Why does this exist in programming languages?"

While [Type Inference](../level_01/type_inference.md) is incredibly powerful and saves you from typing redundant code, it isn't magic. There are times when the compiler simply cannot guess what type of data you want, or the context is too ambiguous. Furthermore, as programs grow larger, relying purely on the compiler's guesses can make the code hard for *humans* to read.

**Type Annotation** is the syntax you use to manually declare the exact type of a variable or a function's input/output. You do this by placing a colon (`:`) followed by the type name after your variable. By requiring explicit annotations in critical boundaries—like function signatures—Rust guarantees that the "contract" between different parts of your code is strictly enforced and clearly documented.

### (2) Reality Metaphor

Think of type annotation as putting a **specific job title on a help-wanted sign**. 

If you just hang a sign that says *"Looking for a worker,"* the intent is ambiguous (this is like an ambiguous type). Are you looking for a plumber, an accountant, or a chef? 

By adding an annotation—*"Looking for a worker: **Electrician**"*—you strictly filter the candidates. If a plumber tries to apply (assigning the wrong data type), they are immediately rejected.

### (3) Rust Code Examples

#### Short Snippet
```rust
// The `: i32` is the type annotation telling Rust this is a 32-bit integer.
let player_score: i32 = 100;

// The `: bool` tells Rust this is a boolean (true/false).
let is_game_over: bool = false;
```

#### Fuller Example
```rust
// Rust STRICTLY requires type annotations for function parameters and return types.
// The compiler refuses to guess here to ensure the contract is perfectly clear.
fn multiply(a: i32, b: i32) -> i32 {
    a * b
}

fn main() {
    // Here, we voluntarily use a type annotation for readability, 
    // even though the compiler could probably guess it.
    let base_damage: f64 = 15.5;
    
    let raw_input = "42";
    
    // Here, type annotation is MANDATORY. 
    // `.parse()` can turn a string into almost any number type. 
    // Without `: u32`, the compiler has no idea what you want it parsed into.
    let parsed_age: u32 = raw_input.parse().unwrap();
    
    println!("Parsed age: {}", parsed_age);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting annotations on function parameters

**The mistake:** Trying to rely on type inference when defining a new function.

**Why it's wrong:** In some languages, you can get away with this, but Rust's compiler is intentionally designed to stop inferring at function boundaries. This ensures that a mistake inside a function doesn't accidentally change the type signature of the function, which could break code everywhere else in the project.

*Incorrect:*
```rust
// ERROR: expected type, found `x`
fn square(x) { 
    x * x
}
```

*Fix:*
```rust
// Explicitly annotate the parameter and the return type (`-> i32`)
fn square(x: i32) -> i32 { 
    x * x
}
```

### Mistake 2: Annotating a type that contradicts the assigned value

**The mistake:** Giving a variable an annotation but assigning it data of a completely different type.

**Why it's wrong:** The compiler will prioritize your annotation as the absolute truth. If the data doesn't match the truth, it throws an error immediately.

*Incorrect:*
```rust
let active_users: u32 = "Five"; // ERROR: expected `u32`, found `&str`
```

*Fix:*
```rust
let active_users: u32 = 5;
```

---

### Mistake 3: Concurrent Access to Type Annotation Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Type Annotation instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Enforce the Type

**Problem:** You want to store the number `10`, but you specifically want it to take up the absolute minimum amount of memory possible (an 8-bit unsigned integer). Use a type annotation to force the compiler to store it as a `u8` instead of its default `i32`.

```rust
fn main() {
    // TODO: Add a type annotation so `tiny_number` is specifically a `u8`.
    let tiny_number = 10;
    
    println!("My tiny number is {}", tiny_number);
}
```

**Expected output:**
```text
My tiny number is 10
```

> [!check]- Answer
> - Place a colon `:` immediately after the variable name `tiny_number`.
> - Follow the colon with the type you want: `u8`.
> - The final code should look like `let tiny_number: u8 = 10;`.

---

### Exercise 2: Annotating Turbofish vs Variable Types

**Problem:** Collect an iterator of numbers `1..=5` into a `Vec<i32>` using explicit variable type annotation `let v: Vec<i32> = ...`, and then using turbofish `.collect::<Vec<i32>>()`.

**Expected output:**
```
[1, 2, 3, 4, 5]
[1, 2, 3, 4, 5]
```

> [!check]- Answer
> ```rust
> fn main() {
>     let v1: Vec<i32> = (1..=5).collect();
>     let v2 = (1..=5).collect::<Vec<i32>>();
>     println!("{:?}", v1);
>     println!("{:?}", v2);
> }
> ```
>
> **Explanation:** Both variable type annotations and turbofish syntax (`::<T>`) supply necessary type information to generic collection functions.

### Exercise 3: Function Signature Contract Annotations

**Problem:** Write a function `parse_age(input: &str) -> Result<u8, std::num::ParseIntError>` requiring explicit input and return type annotations.

**Expected output:**
```
Parsed age: 25
```

> [!check]- Answer
> ```rust
> fn parse_age(input: &str) -> Result<u8, std::num::ParseIntError> {
>     input.trim().parse::<u8>()
> }
> fn main() {
>     if let Ok(age) = parse_age("25") {
>         println!("Parsed age: {}", age);
>     }
> }
> ```
>
> **Explanation:** Function signatures in Rust always require explicit type annotations for all input parameters and return values.

---

## 6. Related Terms

- [Type Inference](../level_01/type_inference.md) — The compiler's automatic behavior that type annotation manually overrides.
- [`fn`](../level_01/fn.md) — Function declarations, the one place where type annotations are strictly mandatory.
- [Scalar Types](../level_01/scalar_types.md) — The primitive types (like `i32`, `f64`, `bool`) you will frequently use in your annotations.

---

## 7. Key Takeaways

- Type annotations manually define the type of a variable using the syntax `variable: type`.
- You must use them when the compiler is confused or a method is ambiguous (like `.parse()`).
- Rust strictly **requires** type annotations on all function parameters and return types to keep code boundaries safe and predictable.
- You can voluntarily use annotations on variables just to make your code easier for other humans to read.
