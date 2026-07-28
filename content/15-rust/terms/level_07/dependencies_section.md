# `[dependencies]`

> **Level 7 — Modules, Visibility & Project Structure**
> Section in `Cargo.toml` for declaring external crate dependencies.

---

## 1. Prerequisites

- [`Cargo.toml`](../level_07/cargo_toml.md) — The configuration file where this section lives.
- [Cargo](../level_01/cargo.md) — The program that reads this section and does all the hard work.
- [Crate](../level_01/crate.md) — The external libraries you are actually importing.

---

## 2. Term Category

**Rust Tooling (the library importer)**: The Rust standard library is intentionally kept very small. Things like random number generation, HTTP requests, async runtimes, and JSON parsing are not built-in! 

To get these features, you must rely on the open-source community by downloading Crates from `crates.io`. The `[dependencies]` section in your `Cargo.toml` file is where you list exactly what community crates your project needs.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In older systems languages like C++, adding an external library was a nightmare. You had to download zip files, configure Makefiles, match compilation targets manually, and fight linker errors. 

The Rust team wanted dependency management to be completely frictionless. By simply typing the name and version of a library under `[dependencies]`, Cargo handles 100% of the downloading, configuring, linking, and compiling automatically. It completely abstracts away the nightmare of manual dependency management.

### (2) Reality Metaphor

Imagine you are building a House. 

You don't know how to build a toilet from scratch. You don't want to build a toilet from scratch. So, you just write *"Toilet (Version 1.2)"* on your shopping list (`[dependencies]`). 

The general contractor (Cargo) takes your list, drives to Home Depot (`crates.io`), buys the exact toilet you asked for, drives it back to the house, and seamlessly plumbs it into your walls so you can just use it immediately.

### (3) Rust Code Examples

#### Short Snippet (The Standard Import)
Here is how you add the popular `rand` crate to your project so you can generate random numbers.

**File: `Cargo.toml`**
```toml
[package]
name = "my_game"
version = "0.1.0"
edition = "2021"

[dependencies]
# We tell Cargo we want the `rand` crate, version 0.8
rand = "0.8"
```

Once you save this file, you can immediately start using `rand::random()` in your `main.rs` file! The next time you run `cargo build`, Cargo will magically download it for you.

#### Fuller Example (The 3 Ways to Import)
Sometimes you need more than just a version number. Here are the three most common ways to define a dependency.

```toml
[dependencies]

# 1. THE STANDARD WAY (From crates.io)
# Just the name and the version string.
serde = "1.0"

# 2. THE FEATURES WAY (Opt-in to specific parts of a crate)
# Some crates are huge. We use curly braces to say we only want 
# the `json` parsing feature, saving us from compiling the rest of the crate!
serde_json = { version = "1.0", features = ["alloc"] }
tokio = { version = "1.30", features = ["full"] }

# 3. THE LOCAL PATH WAY (For Workspaces)
# We don't want to download this from the internet. We want Cargo to 
# look in a folder on our local hard drive!
my_shared_types = { path = "../my_shared_types" }
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Dependencies Section Scoping and Lifecycle Rules

**The mistake:** Assuming Dependencies Section instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("dependencies_section_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("dependencies_section_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Dependencies Section State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Dependencies Section through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Dependencies Section Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Dependencies Section instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Syntax Error

**Problem:** You are trying to add the `rand` crate to your project. You open `Cargo.toml` and write the following line. When you run `cargo build`, it throws a parsing error. What is wrong with the line?

```toml
[dependencies]
rand = 0.8
```

> [!check]- Answer
> You forgot the quotes! `Cargo.toml` uses the TOML format, and version numbers must always be Strings.
>
> ```toml
> [dependencies]
> rand = "0.8"
> ```

---

### Exercise 2: Optional Dependency Feature Gating

**Problem:** Declare `serde = { version = "1.0", optional = true }` in `[dependencies]`.

**Expected output:**
> [!check]- Answer
> ```
> Optional dependency configured
> ```
> ```rust
> fn main() {
>     println!("Optional dependency configured");
> }
> ```
>
> **Explanation:** Marking dependencies as `optional = true` exposes corresponding feature flags of the same name.

---

### Exercise 3: Git Dependency Specification

**Problem:** Specify a git dependency `rand = { git = "https://github.com/rust-random/rand", branch = "master" }`.

**Expected output:**
> [!check]- Answer
> ```
> Git dependency declared
> ```
> fn main() {
>     println!("Git dependency declared");
> }
> ```
>
> **Explanation:** Cargo supports fetching dependencies directly from remote git repositories.

---

## 6. Related Terms

- [`Cargo.toml`](../level_07/cargo_toml.md) — The file that this section lives inside.
- [Workspace](../level_07/workspace.md) — The feature that heavily uses local `{ path = "..." }` dependencies.
- [Cargo](../level_01/cargo.md) — The program that actually reads this section and downloads the crates.

---

## 7. Key Takeaways

- The `[dependencies]` section is where you list external crates from `crates.io`.
- Adding a crate is as simple as writing `name = "version"`.
- Cargo handles downloading, caching, linking, and compiling the crates automatically.
- Rust uses standard SemVer. `"1.0"` means Cargo is allowed to download any `1.x.x` version, but will never automatically upgrade you to `2.0.0`.
