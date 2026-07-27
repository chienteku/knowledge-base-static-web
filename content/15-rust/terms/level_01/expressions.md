# Expressions

> **Level 1 — Foundations**
> Code that evaluates to a value (e.g., `5 + 5`, calling a function, `if` blocks without a trailing `;`).

---

## 1. Prerequisites

- [Statements](../level_01/statements.md) — Understanding the difference between doing an action (Statements) and returning a value (Expressions).
- [Variable](../level_01/variable.md) — Variables are assigned the values that expressions evaluate to.

---

## 2. Term Category

**Rust-specific (mostly)**: Rust is an **expression-oriented** language. While all languages have expressions (like `5 + 5`), Rust goes much further. Almost every construct in Rust (including `if` blocks, `match` blocks, and basic `{}` scope blocks) is an expression that can return a value. 

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

When you are programming, you constantly need to calculate and pass around data. Any piece of code that evaluates to a specific value is an **expression**. 

In older languages like C or Python, there is a strict divide. You have "expressions" for math (`5 + 5`), and "statements" for logic (`if`, `switch`, `for`). Because logic blocks are statements, they don't return values. If you want an `if` block to calculate a value, you have to create a temporary variable and assign to it.

Rust's designers realized that code is much cleaner and safer if almost *everything* evaluates to a value. By making `{}` blocks and `if` blocks into expressions, you can chain logic together seamlessly. The golden rule of Rust expressions is this: **If a block of code ends with an expression that lacks a semicolon, that value is implicitly returned from the block.**

### (2) Reality Metaphor

An expression is like **asking a question that requires an answer.**
- *"What is 5 + 5?"* -> Evaluates to `10`.
- *"What is the length of 'Hello'?"* -> Evaluates to `5`.
- *"If it is raining, return 'umbrella', otherwise return 'sunglasses'."* -> Evaluates to `'umbrella'`.

When the question is answered, you can immediately hand that answer (the value) to someone else (like a variable).

### (3) Rust Code Examples

#### Short Snippet
```rust
// `5 + 5` is an expression. It evaluates to 10.
let math_result = 5 + 5; 

// `String::from("Hello")` is an expression. It evaluates to a new String.
let greeting = String::from("Hello");
```

#### Fuller Example
```rust
fn main() {
    // A block of code `{ ... }` is an expression!
    let y = {
        let x = 3;
        
        // This is the final line of the block. 
        // Notice there is NO SEMICOLON at the end.
        // Therefore, this block evaluates to `4`, which gets assigned to `y`.
        x + 1 
    };
    
    println!("The value of y is: {}", y);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Accidentally adding a semicolon

**The mistake:** Putting a semicolon at the end of a line that you intended to return as a value.

**Why it's wrong:** Adding a semicolon (`;`) to the end of an expression turns it into a [Statement](../level_01/statements.md). Statements do not return values (they return `()`, the empty unit type). This is the most common compiler error for beginners trying to implicitly return a value from a function or block.

*Incorrect:*
```rust
fn get_score() -> i32 {
    100; // ERROR: expected `i32`, found `()`
}
```

*Fix:*
```rust
fn get_score() -> i32 {
    100 // SUCCESS: No semicolon, so this expression is returned!
}
```

---

### Mistake 2: Mutating Expressions State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Expressions through an immutable reference `&T` or without specifying `mut` in variable declarations.

**Why it's wrong:** Rust's aliasing XOR mutability rule (`&T` for shared immutable access, `&mut T` for exclusive mutable access) prohibits mutating state through shared references unless interior mutability patterns (e.g. `RefCell`, `Mutex`) are explicitly used.

*Incorrect:*
```rust
fn update_val(data: &i32) {
    // *data += 1; // ❌ Error E0594: cannot assign to `*data`, which is behind a `&` reference
}
```

*Fix:*
```rust
fn update_val(data: &mut i32) {
    *data += 1; // Correct: exclusive mutable reference permits mutation
}
```

### Mistake 3: Concurrent Access to Expressions Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Expressions instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Free the Expression

**Problem:** The code below is trying to assign the result of a block to the variable `area`, but it won't compile because the block is currently returning nothing (a statement). Fix the code so the block evaluates to the area of the rectangle.

```rust
fn main() {
    let width = 10;
    let height = 5;
    
    // TODO: Fix the block so it evaluates to `width * height`
    let area = {
        let multiplier = 1;
        width * height * multiplier;
    };
    
    println!("Area is: {}", area);
}
```

**Expected output:**
```text
Area is: 50
```

> [!check]- Answer
> - The very last line of the block (`width * height * multiplier;`) ends with a semicolon.
> - This turns it into a statement, meaning the block evaluates to nothing.
> - Remove the semicolon from that final line!

---

### Exercise 2: Refactoring Semicolon Statements to Expression Assignment

**Problem:** Refactor a multi-step `let status = if ...` assignment into a single clean block expression returning a string slice.

**Expected output:**
```
Active
```

> [!check]- Answer
> ```rust
> fn main() {
>     let score = 85;
>     let status = if score >= 80 {
>         "Active"
>     } else {
>         "Inactive"
>     };
>     println!("{}", status);
> }
> ```
>
> **Explanation:** Rust's `if` is an expression. Omitting trailing semicolons inside block branches lets the evaluated value flow directly into the `status` variable binding.

### Exercise 3: Block Expression Unit Evaluation

**Problem:** Explain what `{ let a = 5; let b = 10; a + b; }` evaluates to and fix it to evaluate to `15`.

**Expected output:**
```
15
```

> [!check]- Answer
> ```rust
> fn main() {
>     let val = { let a = 5; let b = 10; a + b }; // Omit semicolon on a + b
>     println!("{}", val);
> }
> ```
>
> **Explanation:** The original block evaluated to `()` because `a + b;` ended in a semicolon. Removing the semicolon turns `a + b` into the block's return expression.

---

## 6. Related Terms

- [Statements](../level_01/statements.md) — The exact opposite. Statements perform actions, do not return values, and usually end with semicolons.
- [`if` / `else`](../level_02/if_else.md) — A prime example of how Rust turns traditional statements into powerful expressions that return values.

---

## 7. Key Takeaways

- Expressions evaluate to a value.
- They **do not** end with a semicolon.
- Math (`5 + 5`), function calls, and even `{ ... }` blocks are expressions.
- The golden rule: If the last line of a block lacks a semicolon, that block implicitly returns that value.
- Adding a semicolon to an expression turns it into a Statement, completely throwing away its value.
