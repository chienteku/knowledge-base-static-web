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

**Problem:** Write a Rust file with module-level documentation describing a math utility module using inner doc comments (`//!`). Add a documented function `pub fn add(a: i32, b: i32) -> i32` inside. Then call `add(3, 4)` from `main` and print the result to prove it works.

**Expected output:**
> [!check]- Answer
> ```text
> 3 + 4 = 7
> ```
> ```rust
> //! Math Utilities Module
> //! Provides basic arithmetic helper functions.
>
> /// Adds two integers.
> ///
> /// # Examples
> /// ```
> /// assert_eq!(add(1, 2), 3);
> /// ```
> pub fn add(a: i32, b: i32) -> i32 {
>     a + b
> }
>
> fn main() {
>     // We actually call and use the documented function to prove it works.
>     let result = add(3, 4);
>     println!("3 + 4 = {}", result);
> }
> ```
>
> **Explanation:**
> - `//!` (with `!`) applies to the **containing item** — used at the top of a file, it documents the entire module or crate root. It appears in the module's `cargo doc` page header.
> - `///` (without `!`) applies to the **next item** — here it documents `pub fn add`. The `# Examples` section is compiled and run by `cargo test` as a doc test.
> - Note: in a real binary crate you wouldn't have both `pub fn add` and `fn main` in the same file — this is a simplified single-file demonstration. In a library crate, `//!` goes in `src/lib.rs` and `main()` lives in the binary.

---

### Exercise 3: Hiding Setup Code in Doc Tests

**Problem:**
Doc test code blocks in `///` comments are compiled and run by `cargo test`. Sometimes you need setup boilerplate (imports, `fn main` wrappers) that should run but not appear in the HTML docs. Lines prefixed with `#` are included in compilation but hidden from the rendered page.

Write a `pub fn square(x: i32) -> i32` with a doc comment containing:
1. A short description.
2. An `# Examples` section with a runnable assertion using `assert_eq!`.
3. One line **hidden** with `#` to demonstrate the hide-from-docs syntax.

Then write `fn main()` that calls `square` and prints the result — demonstrating the function actually works at runtime, not just in the test.

**Expected output:**
> [!check]- Answer
> ```text
> square(4) = 16
> square(0) = 0
> ```
>
> - **Hint 1:** Lines prefixed with `# ` (hash + space) inside a ` ``` ` code block in a `///` comment are compiled and run as part of the doc test but are hidden from the HTML output that `cargo doc` generates. They're invisible to readers but visible to `cargo test`.
> - **Hint 2:** The `assert_eq!` in the doc test is the real verification — it fails `cargo test` if `square(4) != 16`. This is what makes doc tests valuable: they are executable specifications, not just documentation prose.
> - **Hint 3:** You can use `#` to hide entire blocks including `use` imports or helper function definitions that would be noise in the docs but are required for the code example to compile.
>
> ```rust
> /// Computes the square of a number.
> ///
> /// # Examples
> ///
> /// ```
> /// # // This line is hidden from docs but compiled by `cargo test`:
> /// # fn square(x: i32) -> i32 { x * x }  // re-declare for doc test scope
> /// assert_eq!(square(4), 16);
> /// assert_eq!(square(0), 0);
> /// ```
> pub fn square(x: i32) -> i32 {
>     x * x
> }
>
> fn main() {
>     // Call the real function — proving it produces the correct values at runtime.
>     println!("square(4) = {}", square(4));
>     println!("square(0) = {}", square(0));
> }
> ```
>
> **Explanation:**
> When `cargo test` runs, it extracts every ` ``` ` code block from `///` comments and compiles each as a mini-program. Lines starting with `# ` are silently included in that compilation but stripped from the HTML page. This lets you keep examples realistic and compilable without cluttering the documentation with boilerplate. The outer `fn main()` here demonstrates the actual runtime behavior — they are two separate things: the doc test validates correctness during CI, and `main()` shows the function in action.

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
