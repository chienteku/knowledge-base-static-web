# Crate

> **Level 1 — Foundations**
> A compilation unit in Rust; either a binary (executable) or a library.

---

## 1. Prerequisites

- [Cargo](../level_01/cargo.md) — Rust's build system and package manager that creates, builds, and manages crates

---

## 2. Term Category

**Rust-specific**

While every language has some concept of a "compilation unit" (Java has JARs, Go has packages, C has translation units), the *crate* as Rust defines it — a single rooted tree of modules compiled as one atomic unit, with explicit visibility boundaries — is a Rust-specific design. The name itself, "crate," is unique to the Rust ecosystem.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Here's the problem we were staring at.

In C and C++, the "compilation unit" is a single `.c` or `.cpp` file. Each file is compiled independently, and the linker stitches them together at the end. This means the compiler can't see across files during compilation — it can't check types across boundaries, can't optimize globally, and can't enforce visibility rules. Header files attempt to bridge this gap, but they're fragile, duplicated, and a constant source of bugs (include order matters, missing guards cause redefinitions, macros leak everywhere).

We wanted something different. We wanted a compilation unit that was *big enough* to let the compiler see the whole picture — all the types, all the functions, all the visibility rules — in one shot. But not *so* big that it became unwieldy. We needed a Goldilocks unit.

That's the crate.

A crate is the largest unit the Rust compiler processes at once. It starts from a single root file (`src/main.rs` for binaries, `src/lib.rs` for libraries) and includes everything reachable through `mod` declarations. The compiler sees the entire crate as one coherent unit, which means it can:

- Enforce privacy: items are private by default, and only `pub` items cross crate boundaries
- Check types end-to-end: no header file mismatches, no "undefined reference" surprises
- Optimize globally: inlining, monomorphization, and dead code elimination happen within the whole crate

We also made a deliberate choice: there are exactly **two kinds** of crates — binary crates (which produce executables) and library crates (which produce reusable code). No ambiguity, no special configuration. A binary crate has a `main()` function. A library crate doesn't. That's it.

The name "crate" itself was a playful nod — Cargo ships crates. It stuck.

### (2) Reality Metaphor

Think of a crate as a **shipping container**.

A shipping container is a standard-sized box that holds a complete shipment. Everything inside it is organized, labeled, and sealed as a single unit. When the container arrives at a port (your project), you don't need to know how things are arranged inside — you just know what the container *exports* (its public interface).

There are two types of containers:
- A **delivery container** (binary crate) — it arrives at its destination and its contents are *used directly* (you run the executable)
- A **supply container** (library crate) — its contents are *unpacked and assembled into something else* (other crates depend on it)

The port authority (Cargo) manages loading, transporting, and unloading these containers. And the container's walls enforce boundaries — you can't reach into someone else's container and grab a private item without permission.

### (3) Rust Code Examples

#### Short Snippet — Two kinds of crates

```bash
# Create a binary crate (has src/main.rs with fn main())
cargo new my_app

# Create a library crate (has src/lib.rs, no main function)
cargo new my_lib --lib
```

```rust
// src/main.rs — the root of a BINARY crate
fn main() {
    println!("I'm a binary crate — I run as a program!");
}
```

```rust
// src/lib.rs — the root of a LIBRARY crate
pub fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}
```

#### Fuller Example — A library crate used by a binary crate

First, create the library crate:

```rust
// my_math/src/lib.rs — a library crate providing math utilities

/// Adds two numbers together.
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

/// Multiplies two numbers together.
pub fn multiply(a: i32, b: i32) -> i32 {
    a * b
}

// This function is PRIVATE — only usable inside this crate
fn internal_helper() -> i32 {
    42
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_add() {
        assert_eq!(add(2, 3), 5);
    }

    #[test]
    fn test_multiply() {
        assert_eq!(multiply(4, 5), 20);
    }

    #[test]
    fn test_internal_helper() {
        // We CAN access private functions within the same crate
        assert_eq!(internal_helper(), 42);
    }
}
```

Then, use it from a binary crate:

```toml
# my_app/Cargo.toml
[package]
name = "my_app"
version = "0.1.0"
edition = "2024"

[dependencies]
my_math = { path = "../my_math" }   # Depend on our local library crate
```

```rust
// my_app/src/main.rs — a binary crate consuming the library

use my_math::{add, multiply};  // Import public items from the library crate

fn main() {
    let sum = add(10, 20);
    let product = multiply(5, 6);

    println!("10 + 20 = {}", sum);        // 10 + 20 = 30
    println!("5 × 6 = {}", product);      // 5 × 6 = 30

    // my_math::internal_helper();  // ❌ ERROR: this function is private!
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Crate Scoping and Lifecycle Rules

**The mistake:** Assuming Crate instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("crate_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("crate_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Crate State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Crate through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Crate Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Crate instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Identify the crate type

**Problem:** You run `cargo new calculator` and then `cargo new utils --lib`. For each, answer:
1. What file is the crate root?
2. What type of crate is it (binary or library)?
3. Can it be executed directly with `cargo run`?

**Expected answers:**

| Project | Crate Root | Type | Runnable? |
|---------|-----------|------|-----------|
| `calculator` | `src/main.rs` | Binary | Yes |
| `utils` | `src/lib.rs` | Library | No |

> [!check]- Answer
> - Binary crates always have `src/main.rs` with a `fn main()` function
> - Library crates always have `src/lib.rs` and no `main` function
> - Only binary crates can be run directly — library crates are meant to be used *by* other crates

---

### Exercise 2: Create a library crate and use it

**Problem:** Create a library crate called `string_utils` with a public function `shout(text: &str) -> String` that converts the input to uppercase and appends `"!!!"`. Then create a binary crate called `shouter` that depends on `string_utils` and prints `shout("hello rust")`.

**Expected output:**
> [!check]- Answer
> ```
> HELLO RUST!!!
> ```
> - Use `cargo new string_utils --lib` to create the library
> - Use `cargo new shouter` to create the binary
> - In `string_utils/src/lib.rs`, use `text.to_uppercase()` and `format!("{}!!!", ...)`
> - Remember to mark the function as `pub`
> - In `shouter/Cargo.toml`, add `string_utils = { path = "../string_utils" }`
> - In `shouter/src/main.rs`, use `string_utils::shout("hello rust")`

---

### Exercise 3: Understand crate privacy boundaries

**Problem:** In the `string_utils` library crate from Exercise 2, add a *private* helper function called `add_exclamation(text: &str) -> String` that appends `"!!!"`. Refactor `shout` to use this helper internally. Then verify from the `shouter` binary crate that you *cannot* call `add_exclamation` directly.

**Expected behavior:**
- `cargo run` in `shouter` still prints `HELLO RUST!!!`
- Adding `string_utils::add_exclamation("test")` to `main.rs` causes a compiler error about private access

> [!check]- Answer
> - Define `fn add_exclamation(...)` without `pub` — it defaults to private
> - Refactor `shout` to call `add_exclamation` internally (same crate = can access private items)
> - In the binary crate, try `string_utils::add_exclamation("test");` — the compiler will reject it
> - The error message will say something like "function `add_exclamation` is private"

---

### Exercise 4: Package Anatomy — What Gets Compiled?

**Problem:**
A Cargo package called `my_tool` has the following file layout:

```
my_tool/
├── Cargo.toml
└── src/
    ├── lib.rs      # contains: pub fn greet(name: &str) -> String { format!("Hello, {}!", name) }
    ├── main.rs     # calls my_tool::greet and prints the result
    └── bin/
        └── check.rs  # a second binary; prints "check passed"
```

Answer the following without running any code:
1. How many **crates** does `cargo build --all-targets` produce? What kind is each?
2. What command runs the primary binary?
3. What command runs only the `check` binary?
4. `src/main.rs` wants to call `greet` from `src/lib.rs`. What is the correct `use` path, and what is the package name that Cargo uses as the crate name?
5. Could `src/bin/check.rs` call `greet` from `src/lib.rs`? If yes, how?

> [!check]- Answer
> **1. Crates produced by `cargo build --all-targets`:**
>
> | Crate | Kind | Source file |
> |---|---|---|
> | `my_tool` (library) | `lib` | `src/lib.rs` |
> | `my_tool` (binary) | `bin` | `src/main.rs` |
> | `check` (binary) | `bin` | `src/bin/check.rs` |
>
> **3 crates total.** The library crate and the primary binary crate share the package name `my_tool`. The second binary is named `check` after its filename.
>
> **2. Run the primary binary:**
> ```bash
> cargo run
> ```
> When there is exactly one binary at `src/main.rs`, `cargo run` targets it unambiguously.
>
> **3. Run only `check`:**
> ```bash
> cargo run --bin check
> ```
> The `--bin` flag selects among all binary targets by their Cargo name (derived from the filename in `src/bin/`).
>
> **4. Calling `greet` from `src/main.rs`:**
> ```rust
> // src/main.rs
> use my_tool::greet;   // the crate name = the [package] name in Cargo.toml
>
> fn main() {
>     println!("{}", greet("Rust"));  // prints: Hello, Rust!
> }
> ```
> The library crate's name is the `name` field from `[package]` in `Cargo.toml`. Within the same package, `src/main.rs` can reference the library as an external crate — by that same name.
>
> **5. `src/bin/check.rs` calling `greet`:**
> Yes — files in `src/bin/` can also call the library crate by the same package name:
> ```rust
> // src/bin/check.rs
> use my_tool::greet;
>
> fn main() {
>     println!("{}", greet("check"));  // Hello, check!
>     println!("check passed");
> }
> ```
> Every binary target in the same package can depend on the package's own library crate. Both `src/main.rs` and `src/bin/*.rs` see it as an external dependency, even though they are in the same package.
>
> **Explanation:**
> `src/lib.rs` and `src/main.rs` are the **two default crate roots**. Cargo discovers them by convention — no `Cargo.toml` entry is required. Files in `src/bin/` are also auto-discovered as additional binary targets. Each crate is compiled independently starting from its root file.

---

## 6. Related Terms

- [Cargo](../level_01/cargo.md) — the tool that builds, tests, and manages crates
- [Package](../level_01/package.md) — a Cargo concept wrapping one or more crates with a `Cargo.toml`
- [Module](../level_01/module.md) — the organizational unit *within* a crate; crates contain modules
- [`pub` Visibility](../level_07/pub_visibility.md) — controls what items are exposed beyond the crate boundary
- [`Cargo.toml`](../level_07/cargo_toml.md) — the manifest file that defines how a crate is built and its dependencies

---

## 7. Key Takeaways

- **A crate is Rust's compilation unit** — the largest chunk of code the compiler processes at once, starting from a single root file.
- **Two kinds, no ambiguity** — binary crates (`src/main.rs`, have `fn main()`, produce executables) and library crates (`src/lib.rs`, produce reusable code).
- **Crate ≠ package** — a package (defined by `Cargo.toml`) can contain multiple crates, but each crate is a single compilation unit.
- **Privacy is enforced at the crate boundary** — items are private by default and only `pub` items are visible to other crates.
- **The crate root is the entry point** — `src/main.rs` or `src/lib.rs` is where the compiler starts; all modules branch out from there via `mod` declarations.
