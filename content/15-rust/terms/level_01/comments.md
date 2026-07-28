# Comments

> **Level 1 — Foundations**
> Line comments (`//`), block comments (`/* */`), and doc comments (`///`, `//!`).

---

## 1. Prerequisites

None.

---

## 2. Term Category

**Rust-nonspecific**: Every programming language has comments. However, Rust's built-in, first-class support for "doc comments" that generate HTML documentation is a standout feature of the Rust ecosystem.

---

## 3. Explanation

### (1) Design Motivation — "Why does this exist in programming languages?"

Well-written code explains *what* the computer is doing, but it rarely explains *why* the programmer chose to do it that way. Comments are entirely ignored by the compiler; they exist solely for humans to leave notes, warnings, and explanations for their teammates (or for their future selves).

Rust provides three main types of comments:
1. **Line Comments (`//`)**: The standard way to leave a quick note. Anything after the `//` on that specific line is ignored.
2. **Block Comments (`/* */`)**: Useful for writing long paragraphs or, more commonly, for quickly disabling large chunks of code during debugging.
3. **Doc Comments (`///` and `//!`)**: This is where Rust shines. If you use three slashes (`///`), Rust treats it as official documentation for your code. It supports full Markdown (bolding, code blocks, links). When you run `cargo doc`, Rust automatically reads these comments and builds a beautiful, easily navigable HTML website for your project.

### (2) Reality Metaphor

Think of regular comments (`//`) like **sticky notes** you leave on a blueprint for your coworkers. They are informal, messy, and meant only for the people actively building the machine.

Think of Doc Comments (`///`) like the **official user manual** that ships with the final product. You write them directly in the blueprint to save time, but a machine extracts them, formats them nicely, and binds them into a polished book for the end-user.

### (3) Rust Code Examples

#### Short Snippet
```rust
// This is a standard line comment. It's just a note.

/* 
   This is a block comment. 
   It can span multiple lines!
*/
let x = 5; // You can also put line comments at the end of a line of code.
```

#### Fuller Example
```rust
//! This is an "inner" doc comment. It documents the ENTIRE file/module 
//! that encloses it. You usually put these at the very top of `main.rs`.
//! 
//! # Welcome to my program!
//! This program calculates physics stuff.

/// This is an "outer" doc comment. It documents the specific item 
/// that comes immediately *after* it. 
/// 
/// It supports **Markdown**!
/// 
/// ```
/// let result = calculate_gravity(9.8);
/// ```
fn calculate_gravity(mass: f64) -> f64 {
    // We multiply by 9.8 because that is Earth's gravity constant.
    // (This is a regular comment explaining the 'why').
    mass * 9.8
}

fn main() {
    /* 
    println!("I am commenting out this code so it doesn't run!");
    */
    let my_mass = 50.0;
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Confusing Line Comments `//` with Outer Doc Comments `///`

**The mistake:** Writing `//` above public functions expecting `cargo doc` to generate HTML documentation.

**Why it's wrong:** `cargo doc` processes `///` doc comments for item documentation. Regular `//` line comments are stripped out.

*Incorrect:*
```rust
// Calculates area of circle
pub fn area(r: f64) -> f64 { 3.14 * r * r }
```

*Fix:*
```rust
/// Calculates area of circle
pub fn area(r: f64) -> f64 { 3.14 * r * r }
```

### Mistake 2: Misusing Inner Doc Comments `//!` inside Functions

**The mistake:** Placing `//!` inside function bodies to document internal code lines.

**Why it's wrong:** `//!` documents the containing item (such as crate root `lib.rs` or module). Using it inside a function causes compile errors or misplaced module docs.

*Incorrect:*
```rust
fn calc() {
    //! This documents the function internally (Wrong!)
}
```

*Fix:*
```rust
fn calc() {
    // Document internal implementation details using line comments
}
```

### Mistake 3: Failing to Verify Doc Comment Code Examples with `cargo test`

**The mistake:** Writing code blocks inside `///` doc comments without running `cargo test` to verify them.

**Why it's wrong:** `cargo test` automatically compiles and executes doc comment code blocks as tests.

*Incorrect:*
```rust
/// ```rust
/// let x = add(1); // ❌ Fails compilation if signature changed!
/// ```
pub fn add(a: i32, b: i32) -> i32 { a + b }
```

*Fix:*
```rust
/// ```rust
/// let x = my_crate::add(1, 2);
/// assert_eq!(x, 3);
/// ```
pub fn add(a: i32, b: i32) -> i32 { a + b }
```

## 5. Practice Exercises

### Exercise 1: Upgrade to Docs

**Problem:** The function below has a good explanation, but it is using standard comments. Upgrade the comments so that they become official Doc Comments that will show up in the generated HTML documentation, and make the word "true" bold using Markdown.

```rust
// Checks if the player has enough health to survive an attack.
// Returns **true** if they survive.
fn can_survive(health: i32, damage: i32) -> bool {
    health > damage
}
```

**Expected output:**
*(The code should compile, and if `cargo doc` was run, it would generate a webpage for `can_survive`)*

> [!check]- Answer
> - Change the `//` to `///`.
> - Standard markdown bold is `**word**`.
> - The final result should be `/// Checks if the player...` and `/// Returns **true** if they survive.`

---

### Exercise 2: Module-Level Documentation

**Problem:** Write a Rust file with module-level documentation describing a math utility module using inner doc comments (`//!`). Add a documented function `add` inside.

**Expected output:**
> [!check]- Answer
> ```
> Math utility ready
> ```
> ```rust
> //! Math Utilities Module
> //! Provides basic arithmetic helper functions.
>
> /// Adds two integers.
> pub fn add(a: i32, b: i32) -> i32 {
>     a + b
> }
>
> fn main() {
>     println!("Math utility ready");
> }
> ```
>
> **Explanation:** `//!` documents the containing item (the module file itself), while `///` documents the item that follows it (`pub fn add`).

---

### Exercise 3: Hiding Setup Code in Doc Tests

**Problem:** Write a function doc comment with a runnable code example where the `fn main()` header and imports are hidden from generated docs using `#` prefix.

**Expected output:**
> [!check]- Answer
> ```
> Doc example structured properly
> ```
> ```rust
> /// Computes the square of a number.
> ///
> /// ```
> /// # fn main() {
> /// assert_eq!(square(4), 16);
> /// # }
> /// ```
> pub fn square(x: i32) -> i32 {
>     x * x
> }
>
> fn main() {
>     println!("Doc example structured properly");
> }
> ```
>
> **Explanation:** Lines starting with `#` in doc test blocks are compiled and executed when running `cargo test`, but omitted from the rendered HTML documentation.

---

## 6. Related Terms

- [`fn`](../level_01/fn.md) — Functions are the most common items that receive `///` doc comments.
- **[Cargo](../level_01/cargo.md)** — (From Term #1) Cargo includes the `cargo doc --open` command which reads your `///` comments and instantly opens them as a website in your browser.

---

## 7. Key Takeaways

- Use `//` for quick, internal notes to yourself or other developers.
- Use `/* */` for multi-line notes or for quickly disabling code.
- Use `///` right above a function, struct, or variable to officially document it.
- Use `//!` at the top of a file to officially document the entire file/module.
- Doc comments support Markdown and are compiled into websites using the `cargo doc` command.
