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

### Exercise 2: Building a Real Intra-Doc Link Web

**Problem:**
Intra-doc links let items in your documentation reference each other automatically — rustdoc resolves `[`TypeName`]` to a clickable hyperlink in the generated HTML, so readers can navigate your API without leaving the docs.

Write a code snippet (suitable for `src/lib.rs`) that demonstrates:
1. A `Config` struct with a `///` doc comment.
2. A `Server` struct whose doc comment references `Config` using an intra-doc link: `/// Uses a [`Config`] to configure the server.`
3. A public function `build_server(cfg: Config) -> Server` whose doc comment links to **both** [`Config`] and [`Server`].
4. Identify: what happens at `cargo doc` time if you misspell the link as `[`Confgi`]`?

**Expected output:**
> [!check]- Answer
> *(No runtime output — this is documentation code. Run `cargo doc --open` to see the linked HTML.)*
>
> - **Hint 1:** Intra-doc links use the backtick-bracket syntax: `` [`TypeName`] `` or `[TypeName]`. The backtick form renders the name in monospace font (preferred for types/functions); the plain form renders it in normal font.
> - **Hint 2:** `cargo doc` resolves these links at build time. If the target item doesn't exist (or is misspelled), rustdoc emits a **warning**: `unresolved link to 'Confgi'`. This makes broken doc links detectable in CI — use `RUSTDOCFLAGS="-D warnings"` to turn them into errors.
> - **Hint 3:** You can link to methods with `[`Config::new`]`, to enum variants with `[`MyEnum::Variant`]`, and even to items in other crates with full paths: `[`std::collections::HashMap`]`.
>
> ```rust
> /// Application configuration.
> ///
> /// Pass this to [`build_server`] to create a running [`Server`].
> pub struct Config {
>     pub port: u16,
> }
>
> /// The main HTTP server.
> ///
> /// Constructed from a [`Config`] via [`build_server`].
> pub struct Server {
>     port: u16,
> }
>
> /// Creates a [`Server`] from the provided [`Config`].
> ///
> /// # Example
> /// ```
> /// let cfg = Config { port: 8080 };
> /// let server = build_server(cfg);
> /// ```
> pub fn build_server(cfg: Config) -> Server {
>     Server { port: cfg.port }
> }
> ```
>
> **Answer to the misspell question:**
> `cargo doc` emits: `warning: unresolved link to 'Confgi'` and renders the text as plain non-linked text. Add `#![deny(rustdoc::broken_intra_doc_links)]` at the top of `src/lib.rs` to turn this into a hard error that blocks `cargo doc` from succeeding, which is the recommended CI practice.

---

### Exercise 3: When to Use `--document-private-items`

**Problem:**
By default, `cargo doc` only generates documentation for `pub` items — the public API that external users see. But there are situations where you need docs for private internals too.

Answer the following:
1. A junior developer joins your team and needs to understand the internal `parse_header` helper (which is `pub(crate)`, not `pub`). What command generates docs they can browse?
2. You are writing a binary crate (`src/main.rs`) with no `pub` items at all. Will `cargo doc` produce any output by default? What flag fixes this?
3. Why would you typically **not** publish `--document-private-items` documentation publicly on `docs.rs`?

> [!check]- Answer
> **1. Generating internal docs:**
> ```bash
> cargo doc --document-private-items --open
> ```
> This instructs rustdoc to document all items regardless of visibility — `pub(crate)`, `pub(super)`, and even fully private `fn`. The generated site is identical in structure to the normal docs, just with more items.
>
> **2. Binary crates:**
> Yes — a binary crate with no `pub` items produces an essentially empty `cargo doc` site. `--document-private-items` is the flag that makes it useful for binary crates, since all their items are private by definition.
>
> **3. Why not publish private docs:**
> Private items often contain implementation details, internal invariants, and assumptions that only make sense in the context of the full source code. Exposing them as a public HTML site could: (a) leak proprietary implementation strategies, (b) confuse external users who try to call internal functions that aren't actually accessible, and (c) create a maintenance burden since private APIs change freely without semver guarantees.
>
> **Explanation:**
> `--document-private-items` is a developer ergonomics flag, not a publication tool. It bridges the gap between "read the source" and "read structured docs" for contributors working inside the codebase.

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
