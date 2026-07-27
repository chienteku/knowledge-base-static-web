# Statements

> **Level 1 — Foundations**
> Instructions that perform an action and do not return a value (e.g., `let` bindings, statements ending in `;`).

---

## 1. Prerequisites

- [Variable](../level_01/variable.md) — Declaring a variable (`let x = 5;`) is the most common example of a statement.

---

## 2. Term Category

**Rust-nonspecific**: A fundamental concept in almost all programming languages, though Rust enforces a much stricter distinction between statements and expressions than languages like C or Python.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

When you write code, you are fundamentally doing two things: calculating values, and telling the computer what to do with those values. 

**Statements** are the instructions that tell the computer to *do* something. They perform an action (like allocating memory for a variable, or defining a new function), but they **do not return a value**. Because they don't evaluate to a result, you cannot assign a statement to another variable. 

In Rust, the most common statements are `let` declarations and expressions that have been terminated by a semicolon (`;`). The semicolon acts as a period at the end of a sentence, signaling to the compiler: *"I am done with this instruction, execute it, throw away the result, and move on."*

### (2) Reality Metaphor

A statement is like **giving a command to a worker**. 

You say, *"Put this box on the shelf"* (which is like `let box = "shelf";`). The worker performs the action. They don't hand you anything back in return. You cannot use the "result" of that action to do something else. 

By contrast, an expression is like asking a question: *"What is 5 + 5?"*. The worker hands you back a piece of paper that says "10".

### (3) Rust Code Examples

#### Short Snippet
```rust
// This entire line is a statement. 
// It performs the action of binding '5' to 'x'.
let x = 5;

// Function declarations are also statements. 
// They define something, but don't evaluate to a value.
fn do_nothing() {}
```

#### Fuller Example
```rust
fn main() {
    // 1. A standard `let` statement
    let name = "Alice";
    
    // 2. An expression turned into a statement.
    // `name.len()` is an expression (it evaluates to 5).
    // But because we put a semicolon `;` at the end, we throw away the 5. 
    // The line becomes a statement that does nothing useful.
    name.len();
    
    // 3. A macro call used as a statement.
    // It performs the action of printing to the console, then stops.
    println!("Hello, {}!", name);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to assign a statement to a variable

**The mistake:** Assuming that `let y = 5` returns the value `5` so you can chain assignments.

**Why it's wrong:** In languages like C or Ruby, `x = y = 5` is valid because the assignment `y = 5` returns `5`. In Rust, `let y = 5` is strictly a statement. It returns nothing (technically, it returns the unit type `()`), so you cannot assign it to `x`.

*Incorrect:*
```rust
// ERROR: expected expression, found `let` statement
let x = (let y = 5); 
```

*Fix:*
```rust
let y = 5;
let x = y;
```

### Mistake 2: Mutating Statements State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Statements through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Statements Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Statements instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Spot the Statements

**Problem:** Look at the block of code below. Which lines are statements?

```rust
fn main() {
    let a = 10;
    let b = 20;
    
    a + b
}
```

**Expected output:**
*(Identify the statements mentally before checking the hints)*

> [!check]- Answer
> - `fn main() { ... }` is a statement (function definition).
> - `let a = 10;` is a statement.
> - `let b = 20;` is a statement.
> - `a + b` is **NOT** a statement. It is an expression because it lacks a semicolon and returns a value (30) from the function.

---

### Exercise 2: Converting Statements to Expression Values

**Problem:** Convert a block containing multiple statements into a block expression returning the calculated product of `a` and `b`.

**Expected output:**
```
Product: 50
```

> [!check]- Answer
> ```rust
> fn main() {
>     let product = {
>         let a = 5;
>         let b = 10;
>         a * b // Expression (no semicolon!)
>     };
>     println!("Product: {}", product);
> }
> ```
>
> **Explanation:** Combining local statements with a final un-semicoloned expression allows complex initialization blocks to yield computed values directly.

### Exercise 3: Statement Execution Order

**Problem:** Predict the output of executing three sequential `println!` statements versus block expression evaluation.

**Expected output:**
```
Step 1
Step 2
Done
```

> [!check]- Answer
> ```rust
> fn main() {
>     println!("Step 1");
>     println!("Step 2");
>     println!("Done");
> }
> ```
>
> **Explanation:** Statements execute sequentially in top-to-bottom imperative order.

---

## 6. Related Terms

- [Expressions](../level_01/expressions.md) — The exact opposite. Expressions *evaluate* to a value, and they do not end with a semicolon.
- [`if` / `else`](../level_02/if_else.md) — In many languages, `if` is a statement. In Rust, it is an expression.

---

## 7. Key Takeaways

- Statements are instructions that perform an action but **do not return a value**.
- Because they don't return a value, you cannot assign a statement to a variable (no `let x = (let y = 5);`).
- `let` bindings and function declarations are statements.
- Adding a semicolon (`;`) to the end of an expression turns it into a statement, throwing away its value.
