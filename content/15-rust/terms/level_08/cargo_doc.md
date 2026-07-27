# `cargo doc`

> **Level 8 — Testing & Documentation**
> Generates HTML documentation from doc comments.

---

## 1. Prerequisites

- [Cargo](../level_01/cargo.md) — The build system that executes this command.
- [Comments](../level_01/comments.md) — The `///` syntax that provides the raw text for this tool.
- [Doc Tests](../level_08/doc_tests.md) — The code examples that this tool formats into the final page.

---

## 2. Term Category

**Rust Tooling (the website builder)**: You wrote hundreds of beautiful `///` doc comments explaining how your library works. But reading comments scattered across dozens of raw `.rs` text files is ugly and incredibly hard to navigate. 

The **`cargo doc`** command is a built-in tool that extracts all those comments and automatically builds a beautiful, searchable, interactive HTML website for your project!

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In other programming ecosystems, developers have to download and configure massive third-party tools (like Doxygen for C++, Sphinx for Python, or Javadoc for Java) to generate documentation websites. These tools often break, require complex configuration files, and result in completely different website layouts across the ecosystem. 

Rust built the documentation generator directly into Cargo. Because *every* Rust project uses `cargo doc`, every single Rust library in the world has the exact same standardized documentation layout. When you learn how to read one Rust documentation page (like the ones on `docs.rs`), you instantly know how to read them all!

### (2) Reality Metaphor

Imagine you are an author writing a novel on a typewriter. 

Your raw manuscript (the `.rs` code files) has margin notes, sticky notes, and scribbles (the `///` comments). You don't hand that messy stack of papers to a customer! 

You hand it to a Publisher (`cargo doc`). The publisher takes your messy notes, typesets them, generates a Table of Contents, binds them into a beautiful hardcover book, and places it on a shelf for the world to easily read.

### (3) Rust Code Examples

#### Short Snippet (The Commands)
You don't write Rust code for this, you just run terminal commands!

```bash
# 1. Build the website! 
# It saves the HTML files in `target/doc/`
cargo doc

# 2. Build the website AND immediately open it in your web browser!
cargo doc --open
```

#### Fuller Example (Writing for the Publisher)
When you write `///` comments, you are actually writing Markdown! `cargo doc` understands standard markdown headers, bolding, and lists.

```rust
/// Calculates the total cost of an order.
///
/// # Formulas Used
/// This uses the standard `price * quantity` formula.
///
/// # Panics
/// This function will panic if `quantity` is negative!
///
/// # Examples
/// ```
/// let total = calculate_total(10.0, 5);
/// assert_eq!(total, 50.0);
/// ```
pub fn calculate_total(price: f64, quantity: i32) -> f64 {
    // ...
}
```
When you run `cargo doc`, it turns `# Formulas Used` into a massive HTML Header, and it turns the ` ``` ` block into beautifully syntax-highlighted code.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Cargo Doc Scoping and Lifecycle Rules

**The mistake:** Assuming Cargo Doc instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("cargo_doc_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("cargo_doc_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Cargo Doc State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Cargo Doc through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Cargo Doc Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Cargo Doc instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Magic Flag

**Problem:** You just finished writing documentation for your new library. You want to generate the HTML website, but you are too lazy to manually open your file explorer, navigate to `target/doc/`, find `index.html`, and double-click it. What terminal command does all of this for you automatically?

> [!check]- Answer
> ```bash
> cargo doc --open
> ```
> This is one of the most beloved commands in the Rust ecosystem!

---

### Exercise 2: Intra-Doc Type Linking Syntax

**Problem:** Link to a struct `[`Widget`]` in function doc comments using intra-doc link syntax.

**Expected output:**
```
Intra-doc link verified
```

> [!check]- Answer
> ```rust
> /// Uses [`Widget`] for rendering.
> pub struct Widget;
> fn main() {
>     println!("Intra-doc link verified");
> }
> ```
>
> **Explanation:** Intra-doc links in markdown `[`TypeName`]` automatically resolve to target item documentation.

### Exercise 3: Generating Docs with Private Items Included

**Problem:** Command to build documentation including private items.

**Expected output:**
```
cargo doc --document-private-items --open
```

> [!check]- Answer
> fn main() {
>     println!("cargo doc --document-private-items --open");
> }
> ```
>
> **Explanation:** `--document-private-items` forces `cargo doc` to render documentation for non-public items.

---

## 6. Related Terms

- [Doc Tests](../level_08/doc_tests.md) — The code examples that `cargo doc` formats beautifully into the HTML page (which are also run as tests!).
- [`pub` Visibility](../level_07/pub_visibility.md) — The access modifier that determines whether `cargo doc` includes an item by default.

---

## 7. Key Takeaways

- `cargo doc` parses all `///` (and `//!`) comments in your codebase.
- It generates a beautiful, standardized HTML website in the `target/doc/` folder.
- Run **`cargo doc --open`** to build the site and immediately open it in your default web browser.
- Run **`cargo doc --document-private-items`** to include documentation for non-public functions (perfect for internal team wikis).
