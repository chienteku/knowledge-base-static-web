# Package

> **Level 1 — Foundations**
> A Cargo concept containing one or more crates, defined by a `Cargo.toml` file.

---

## 1. Prerequisites

- [Cargo](../level_01/cargo.md) — The Rust package manager and build system
- [Crate](../level_01/crate.md) — A compilation unit in Rust (either a library or a binary)

---

## 2. Term Category

**Rust-specific**

A Cargo-specific concept that organizes one or more crates and defines how they are built.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

As we built Cargo to manage Rust projects, we needed a clear distinction between "the thing being compiled" (a crate) and "the project you distribute" (a package). If every project was just a single crate, things would get messy when developers wanted to ship both a command-line tool and a reusable library in the same repository. 

We designed the **Package** as a container. A package is defined by a `Cargo.toml` file. It's the unit of distribution you upload to crates.io. Inside a package, you can have multiple crates (usually one library crate and one or more binary crates). This design gives you a clean way to organize, version, and publish related code together, while still letting the Rust compiler deal with individual crates independently.

### (2) Reality Metaphor

Think of a **Package** as a shipping box, and a **Crate** as the actual product inside.

When you buy a drone, the whole box that arrives at your door is the **Package**. It has a shipping label (`Cargo.toml`) that tells the delivery system where it's going, what's inside, and how heavy it is. Inside the box, you might have the drone itself (a binary crate — something you can turn on and use) and a spare parts kit (a library crate — parts you can use to build or fix things). The package is how you ship it; the crates are what actually do the work.

### (3) Rust Code Examples

#### Short Snippet

Here is what the defining file of a package, `Cargo.toml`, looks like:

```toml
[package]
name = "my_awesome_package"
version = "0.1.0"
edition = "2024"

[dependencies]
# Dependencies for the entire package go here
rand = "0.10"
```

#### Fuller Example

A typical package structure on your file system looks like this. The package contains both a library crate (`src/lib.rs`) and a binary crate (`src/main.rs`).

```text
my_awesome_package/    # This is a PACKAGE (the shipping box)
├── Cargo.toml         # The package definition and dependencies
├── src/
│   ├── lib.rs         # A LIBRARY CRATE (reusable code)
│   └── main.rs        # A BINARY CRATE (executable program)
```

In `src/lib.rs` (the library crate):

```rust
// This functionality is part of the library crate
pub fn calculate_power(base: u32, exponent: u32) -> u32 {
    base.pow(exponent)
}
```

In `src/main.rs` (the binary crate):

```rust
// The binary crate can use the library crate from the same package
use my_awesome_package::calculate_power;

fn main() {
    let result = calculate_power(2, 8);
    println!("2 to the power of 8 is: {}", result);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Package Scoping and Lifecycle Rules

**The mistake:** Assuming Package instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("package_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("package_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Package State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Package through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Package Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Package instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Inspect a Package Definition

**Problem:** 
1.  Open your terminal and run `cargo new package_test`.
2.  Open the newly created `package_test` directory.
3.  Look at the `Cargo.toml` file.
4.  Identify the section that defines the package. What fields are required?

**Expected answers:**
The `[package]` header defines the package. Required fields typically include `name`, `version`, and `edition`.

> [!check]- Answer
> - Look for the `[package]` header in the `Cargo.toml` file.

---

### Exercise 2: Add a Library to a Binary Package

**Problem:** 
1.  In the `package_test` directory you just created, you already have a binary crate at `src/main.rs`.
2.  Create a new file named `src/lib.rs`.
3.  Add a simple function to `src/lib.rs`:
```rust
pub fn hello_from_lib() {
    println!("Hello from the library crate!");
}
```
4.  Call this function from `src/main.rs`.
5.  Successfully run `cargo run` and see the output from both the main function and the library function.

**Expected output:**
Output from `main.rs` followed by "Hello from the library crate!".

> [!check]- Answer
> - In your `src/main.rs`, you need to bring the library function into scope.
> - Use `use package_test::hello_from_lib;` at the top of the file, then call `hello_from_lib();` inside `main()`.

---

### Exercise 3: Adding Multiple Binary Targets

**Problem:** Explain how to add a secondary binary executable `src/bin/admin.rs` to an existing Cargo package without editing `Cargo.toml`.

**Expected output:**
> [!check]- Answer
> ```
> cargo run --bin admin
> ```
> ```rust
> fn main() {
>     println!("cargo run --bin admin");
> }
> ```
>
> **Explanation:** Cargo automatically discovers any `.rs` files placed inside `src/bin/` as additional binary crate targets accessible via `cargo run --bin <name>`.

---

## 6. Related Terms

- [Cargo](../level_01/cargo.md) — The tool that manages packages
- [Crate](../level_01/crate.md) — The building blocks contained within a package
- [Module](../level_01/module.md) — How you organize code *inside* a single crate

---

## 7. Key Takeaways

- **A Package is defined by a `Cargo.toml` file.**
- **It is a container** that groups one or more crates together.
- **A package can contain at most one library crate.**
- **A package can contain multiple binary crates** (by placing them in `src/bin/`).
- **Packages are the units of distribution** that you publish to registries like crates.io.
