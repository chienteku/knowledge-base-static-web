# `if` / `else`

> **Level 2 — Control Flow & Data Structures**
> Conditional branching; `if` is an expression and can return values.

---

## 1. Prerequisites

- [Variable](../level_01/variable.md) — Understanding how to assign the result of an `if` expression to a variable.

---

## 2. Term Category

**Rust-specific**: While `if` statements exist in almost every programming language, Rust elevates them by making them **expressions** (meaning they can return a value directly), eliminating the need for the "ternary operator" (`condition ? a : b`) found in languages like C, Java, or JavaScript.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Every program needs to make decisions (conditional branching). If a user is an admin, show the admin panel; otherwise, show the standard dashboard. 

In older languages, `if` is purely a *statement*—an action that executes code. If you wanted to assign a value based on a condition, you had to either:
1. Create a mutable variable, then mutate it inside the `if` block (which is verbose and breaks immutability).
2. Use a completely different, specialized syntax called the ternary operator (`let status = is_admin ? "Admin" : "User";`).

Rust elegantly solves this by making `if` an **expression**. In Rust, blocks of code can evaluate to a final value. This means you can assign an entire `if / else` block directly to a variable. It keeps the language syntax simple (no need for ternary operators) while encouraging you to use safe, immutable variables (`let` instead of `mut`).

### (2) Reality Metaphor

An `if` statement is like **approaching a fork in a road**. You read the sign (the condition). If the sign says "Bridge Out," you take the `else` path.

Because Rust's `if` is an *expression*, it's also like a **vending machine**. You press a button based on a condition (e.g., "Do I want soda or water?"). The machine evaluates your choice and *returns an item directly into your hands* (the value assigned to your variable).

### (3) Rust Code Examples

#### Short Snippet (Standard usage)
```rust
let health = 45;

// Notice there are NO parentheses around the condition.
if health <= 0 {
    println!("Game Over!");
} else if health < 50 {
    println!("Warning: Low Health!");
} else {
    println!("Looking good.");
}
```

#### Fuller Example (Using `if` as an expression)
```rust
fn main() {
    let is_vip = true;
    
    // We are assigning the result of the entire `if` block to `entrance_fee`.
    // Because we don't put semicolons at the end of `0` and `50`, 
    // they are RETURNED from the block.
    let entrance_fee = if is_vip {
        0 
    } else {
        50
    };
    
    println!("Your fee is ${}", entrance_fee);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding If Else Scoping and Lifecycle Rules

**The mistake:** Assuming If Else instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("if_else_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("if_else_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Putting parentheses around the condition

**The mistake:** Writing `if (x > 5)` like you would in C, Java, or JavaScript.

**Why it's wrong:** Rust does not require (or want) parentheses around the boolean condition. If you include them, the compiler will actually give you a warning telling you to remove them, as they are considered unnecessary visual clutter.

*Incorrect:*
```rust
if (health == 100) { ... } // Compiler Warning!
```

*Fix:*
```rust
if health == 100 { ... }
```

---

### Mistake 3: Concurrent Access to If Else Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe If Else instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Refactor to an Expression

**Problem:** The code below uses a mutable variable to assign a discount based on a membership status. Refactor this code to use `if` as an expression so that `discount` can be an immutable variable (just `let`).

```rust
fn main() {
    let is_member = true;
    let mut discount = 0; // We want to get rid of `mut`
    
    if is_member {
        discount = 15;
    } else {
        discount = 0;
    }
    
    println!("Discount applied: {}%", discount);
}
```

**Expected output:**
```text
Discount applied: 15%
```

> [!check]- Answer
> - Change `let mut discount = 0;` to `let discount = if is_member { ... };`.
> - Inside the `{ ... }`, just put the number `15` without a semicolon, and `0` in the else block.
> - Don't forget the semicolon at the very end of the closing brace `};`.

---

### Exercise 2: Expression-Based Conditional Assignment

**Problem:** Assign `let category = if age < 18 { "Minor" } else { "Adult" };` and print it for `age = 20`.

**Expected output:**
```
Adult
```

> [!check]- Answer
> ```rust
> fn main() {
>     let age = 20;
>     let category = if age < 18 { "Minor" } else { "Adult" };
>     println!("{}", category);
> }
> ```
>
> **Explanation:** Expression-based `if/else` returns values directly to variable bindings.

### Exercise 3: Chained Conditional Branching

**Problem:** Write an `if / else if / else` expression determining grades (`A` >= 90, `B` >= 80, `C` else) for score `85`.

**Expected output:**
```
Grade: B
```

> [!check]- Answer
> ```rust
> fn main() {
>     let score = 85;
>     let grade = if score >= 90 {
>         'A'
>     } else if score >= 80 {
>         'B'
>     } else {
>         'C'
>     };
>     println!("Grade: {}", grade);
> }
> ```
>
> **Explanation:** All branches in an `if / else if` expression tree must return matching types (`char`).

---

## 6. Related Terms

- [`match`](../level_02/match.md) — The more powerful, pattern-matching alternative to `if`. Usually preferred over long chains of `else if`.
- [Expressions](../level_01/expressions.md) vs [Statements](../level_01/statements.md) — The core concept that allows `if` to return a value (Expressions return values, statements do not).

---

## 7. Key Takeaways

- Use `if`, `else if`, and `else` for basic conditional branching.
- **Do not** put parentheses around the condition (`if x > 5 {`).
- `if` blocks are **expressions**. They can evaluate to a value, which allows you to assign them directly to a `let` variable.
- When used as an expression, **every branch must return the exact same data type**.
- Using `if` as an expression is the idiomatic Rust alternative to the ternary operator (`? :`).
