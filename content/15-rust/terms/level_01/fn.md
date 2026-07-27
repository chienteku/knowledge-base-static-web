# fn

> **Level 1 — Foundations**
> Keyword to declare a function. `fn main()` is the program entry point.

---

## 1. Prerequisites

None.

---

## 2. Term Category

**Rust-nonspecific**: A general programming concept (Functions).

---

## 3. Explanation

### (1) Design Motivation — "Why does this exist in programming languages?"

If you write a program that performs the same sequence of operations multiple times, copying and pasting that code leads to massive, unmaintainable, and error-prone files. Functions exist to solve this fundamental problem: they allow developers to encapsulate a reusable block of logic under a single name. 

While languages like JavaScript use `function` and Python uses `def`, Rust uses the concise `fn` keyword. Rust's specific take on functions places a heavy emphasis on safety and clarity. Unlike dynamic languages, Rust requires you to explicitly state the types of all parameters and the return type in the function signature. This guarantees the compiler has all the information it needs to enforce type safety and memory management before the function is ever called. Additionally, Rust leans into being an *expression-oriented* language, allowing the last expression in a function to be implicitly returned.

### (2) Reality Metaphor

Think of a function as a **vending machine**. 
The coins and button presses you put into it are the **parameters** (inputs). The internal gears and mechanisms that verify your payment and drop the item are the **function body** (logic). Finally, the snack that falls into the tray at the bottom is the **return value** (output). 

Every time you want that snack, you don't build a new vending machine; you just walk up to the existing one, pass in the required inputs, and get your result.

### (3) Rust Code Examples

#### Short Snippet
```rust
fn greet() {
    println!("Hello, Rust!");
}
```

#### Fuller Example
```rust
// Every executable Rust program starts at the `main` function.
fn main() {
    // Calling the function and passing arguments
    let total = calculate_price(10, 3);
    println!("The total price is: ${}", total);
}

// A function with parameters (quantity, price) and a return type (i32).
fn calculate_price(quantity: i32, price: i32) -> i32 {
    let base_cost = quantity * price;
    
    // Implicit return: Notice there is NO semicolon at the end of this line.
    // This evaluates to the value that the function returns.
    base_cost + 5
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to specify the return type

**The mistake:** Creating a function that returns a value without declaring the return type (`-> Type`) in the signature.

**Why it's wrong:** Rust's compiler needs to know exactly what type a function returns to ensure type safety throughout your program. If you don't specify it, Rust assumes the function returns an empty tuple `()` (meaning nothing), causing a type mismatch error when you try to return actual data.

*Incorrect:*
```rust
fn get_number() {
    5
}
```

*Fix:*
```rust
fn get_number() -> i32 {
    5
}
```

### Mistake 2: Accidentally suppressing the implicit return with a semicolon

**The mistake:** Placing a semicolon at the end of the expression you intended to return.

**Why it's wrong:** In Rust, adding a semicolon turns an *expression* (which evaluates to a value) into a *statement* (which does not). A statement returns the empty unit type `()`. If your function signature promises an `i32` but your last line ends in a semicolon, you are actually returning `()`, causing a compilation error.

*Incorrect:*
```rust
fn add(a: i32, b: i32) -> i32 {
    a + b;
}
```

*Fix:*
```rust
fn add(a: i32, b: i32) -> i32 {
    a + b
}
```

---

### Mistake 3: Concurrent Access to Fn Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Fn instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Square a Number

**Problem:** Define a function named `square` that takes a single `i32` parameter and returns its square (the number multiplied by itself).

**Expected output:**
```text
The square of 4 is 16
```

> [!check]- Answer
> - Start with the `fn` keyword.
> - Name the parameter something like `num: i32`.
> - Don't forget the return type `-> i32`.
> - The last line of the function should be `num * num` with no semicolon.

---

### Exercise 2: Function Pointer Traversal

**Problem:** Define a function `apply_op(a: i32, b: i32, op: fn(i32, i32) -> i32) -> i32`. Call it with a multiplication function and print the result for `3` and `7`.

**Expected output:**
```
21
```

> [!check]- Answer
> ```rust
> fn multiply(x: i32, y: i32) -> i32 { x * y }
> fn apply_op(a: i32, b: i32, op: fn(i32, i32) -> i32) -> i32 {
>     op(a, b)
> }
> fn main() {
>     println!("{}", apply_op(3, 7, multiply));
> }
> ```
>
> **Explanation:** `fn(i32, i32) -> i32` is a function pointer type in Rust, allowing top-level functions to be passed as arguments.

### Exercise 3: Early Return Guard Clause

**Problem:** Write a function `divide(numerator: f64, denominator: f64) -> Option<f64>` that uses an early `return None;` guard clause if `denominator == 0.0`.

**Expected output:**
```
Result: 4
```

> [!check]- Answer
> ```rust
> fn divide(n: f64, d: f64) -> Option<f64> {
>     if d == 0.0 {
>         return None;
>     }
>     Some(n / d)
> }
> fn main() {
>     if let Some(val) = divide(12.0, 3.0) {
>         println!("Result: {}", val);
>     }
> }
> ```
>
> **Explanation:** Explicit `return` keywords allow guard clauses to exit functions early before reaching the final block expression.

---

## 6. Related Terms

- [Variable](../level_01/variable.md) — Functions often declare variables locally or accept them as parameters.
- [Type Annotation](../level_01/type_annotation.md) — Function signatures mandate explicit type annotations for inputs and outputs.
- [Module](../level_01/module.md) — Functions are typically grouped and organized within modules.

---

## 7. Key Takeaways

- Functions are declared using the `fn` keyword.
- `fn main()` is the required entry point for all executable Rust programs.
- All function parameters and return values must have explicit type annotations.
- The final expression in a function block (without a trailing semicolon) is implicitly returned.
- Functions are fundamental building blocks for writing modular, reusable code.
