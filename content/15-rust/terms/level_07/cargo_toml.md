# `Cargo.toml`

> **Level 7 — Modules, Visibility & Project Structure**
> Manifest file defining package metadata, dependencies, features, and build configuration.

---

## 1. Prerequisites

- [Cargo](../level_01/cargo.md) — The build system that actually reads and executes this file.
- [Crate](../level_01/crate.md) — The compilation unit that this file describes.

---

## 2. Term Category

**Rust Tooling (the project manifest)**: Just as Node.js has `package.json`, and Python has `requirements.txt` or `pyproject.toml`, Rust has `Cargo.toml`. This single file is the absolute source of truth for your entire Rust project. It tells Cargo exactly how to build your code and what external libraries it needs to download.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The Rust designers wanted dependency management to be a first-class citizen. They didn't want developers suffering through chaotic `Makefiles` or manually downloading and linking C++ libraries. They built Cargo to handle all of this automatically. 

But Cargo needs a standardized instruction manual for every project. The `Cargo.toml` file provides this. It uses the **TOML** (Tom's Obvious, Minimal Language) format, which was specifically chosen because it is incredibly easy for humans to read and write compared to messy JSON (no trailing comma errors!) or fragile YAML (no hidden whitespace bugs!).

### (2) Reality Metaphor

Imagine you are baking a cake. 

You have a recipe. The `Cargo.toml` is the **Ingredients List** at the top of the recipe. It doesn't contain the actual cooking instructions (that's your Rust code in `src/main.rs`). Instead, it tells the chef (Cargo) exactly what supplies they need to buy from the grocery store (`crates.io`), and what tools they need to configure before they can even start cooking.

### (3) Rust Code Examples

#### Short Snippet (The Standard Manifest)
When you run `cargo new my_project`, it automatically generates a minimal `Cargo.toml` that looks like this:

```toml
# The [package] section contains the metadata about your project.
[package]
name = "my_project"
version = "0.1.0"
edition = "2021"
authors = ["Alice <alice@example.com>"]

# The [dependencies] section is where you list external libraries.
[dependencies]
# We are currently using 0 external dependencies!
```

#### Fuller Example (Advanced Configuration)
As your project grows, your `Cargo.toml` becomes much more powerful. You can define optional features and completely change how the compiler optimizes your code.

```toml
[package]
name = "super_server"
version = "1.2.0"
edition = "2021"

[dependencies]
tokio = { version = "1.0", features = ["full"] } # A dependency with specific features enabled
serde = "1.0" # A standard dependency

# 1. OPTIONAL FEATURES
# We let users of our library choose if they want to compile the "database" code,
# which requires downloading the heavy `sqlx` crate.
[features]
default = []
database_support = ["sqlx"]

# 2. COMPILER PROFILES
# We tell the compiler: "When building the final release version, strip out all
# debug symbols to make the file size smaller!"
[profile.release]
strip = true 
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Cargo Toml Scoping and Lifecycle Rules

**The mistake:** Assuming Cargo Toml instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("cargo_toml_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("cargo_toml_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Cargo Toml State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Cargo Toml through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Cargo Toml Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Cargo Toml instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Categorize the Config

**Problem:** Look at the following TOML lines. Which `[section]` do they belong under? `[package]` or `[dependencies]`?

1. `reqwest = "0.11"`
2. `version = "2.0.5"`
3. `edition = "2021"`
4. `rand = { version = "0.8", features = ["small_rng"] }`

> [!check]- Answer
> 1. `[dependencies]` (It's an external library)
> 2. `[package]` (It's the version of YOUR code)
> 3. `[package]` (It's the version of the Rust compiler to use)
> 4. `[dependencies]` (It's an external library with specific features requested)

---

### Exercise 2: Declaring Package Metadata

**Problem:** Write a `[package]` manifest section defining `name = "demo"`, `version = "0.1.0"`, `edition = "2021"`.

**Expected output:**
> [!check]- Answer
> ```
> [package]
> name = "demo"
> version = "0.1.0"
> edition = "2021"
> ```
> ```rust
> fn main() {
>     println!("[package]\nname = \"demo\"\nversion = \"0.1.0\"\nedition = \"2021\"");
> }
> ```
>
> **Explanation:** `[package]` declares core crate manifest metadata.

---

### Exercise 3: Adding Renamed Dependencies

**Problem:** Rename a dependency `my_serde = { package = "serde", version = "1.0" }` in `Cargo.toml`.

**Expected output:**
> [!check]- Answer
> ```
> Dependency alias configured
> ```
> ```rust
> fn main() {
>     println!("Dependency alias configured");
> }
> ```
>
> **Explanation:** `package = "..."` allows aliasing crate imports under alternative local names.

---

## 6. Related Terms

- [`[dependencies]`](../level_07/dependencies_section.md) — The most frequently edited section of this file.
- [Workspace](../level_07/workspace.md) — How you use `Cargo.toml` to manage multiple separate crates inside a single mega-project repository.

---

## 7. Key Takeaways

- `Cargo.toml` is the absolute source of truth and instruction manual for your Rust project.
- It uses the simple TOML format, which relies on `[headers]` to separate configuration sections.
- The `[package]` section contains metadata about your project (name, version, authors).
- The `[dependencies]` section lists the external crates that Cargo needs to download from `crates.io`.
- You edit `Cargo.toml`, but you **NEVER** manually edit `Cargo.lock`!
