# Integration Tests

> **Level 8 — Testing & Documentation**
> Tests in the `tests/` directory; each file is compiled as a separate crate.

---

## 1. Prerequisites

- [`#[test]`](../level_08/test_attribute.md) — The attribute used to mark functions as tests.
- [`pub` Visibility](../level_07/pub_visibility.md) — The access modifier that Integration Tests rely on.
- [Crate](../level_01/crate.md) — Because every integration test file is secretly compiled as its own independent crate!

---

## 2. Term Category

**Rust Tooling (the external perspective)**: Unit tests live directly inside your `src/` folder alongside your code. Because they are internal, they can see your private functions and test your internal plumbing. 

**Integration Tests** live outside your codebase entirely, in a special `tests/` folder at the root of your project. They are entirely external. They can only see the `pub` (public) API of your library, forcing you to test your code exactly the way a customer would use it.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The Rust designers recognized two fundamentally different types of testing that both needed first-class support.

1. You need **Unit Tests** (internal) to verify that the individual gears and cogs in your machine are perfectly machined and mathematically correct. 
2. You need **Integration Tests** (external) to verify that the entire machine works as expected when an actual user turns the key. 

If you put Integration Tests inside your `src/` folder, you might accidentally "cheat" by accessing private internal variables that a real user wouldn't have access to. By forcing Integration Tests into a separate `tests/` directory and compiling them as completely independent crates, Rust mathematically guarantees that your tests cannot cheat.

### (2) Reality Metaphor

Imagine you are opening a new Restaurant.

**Unit Tests** are the Head Chef standing in the kitchen, tasting the soup with a spoon to make sure it has enough salt (Internal Testing). The chef has full access to the pantry, the recipes, and the raw ingredients.

**Integration Tests** are a Secret Shopper walking through the front door of the restaurant (External Testing). The secret shopper sits at a table, orders from the public menu, and eats the final meal. The secret shopper isn't allowed to walk into the kitchen! They can only interact with the restaurant exactly the way a real customer would.

### (3) Rust Code Examples

#### Short Snippet (The Folder Structure)
To write Integration Tests, you must step outside your `src/` folder and create a new folder named `tests/` at the root of your project (right next to `Cargo.toml`).

```text
my_awesome_library/
├── Cargo.toml
├── src/
│   └── lib.rs         <-- Your actual library code
└── tests/
    └── my_tests.rs    <-- Your integration tests!
```

#### Fuller Example (Writing the Test)
Unlike Unit Tests, you do **not** need to use `#[cfg(test)] mod tests { ... }`. Because the entire `tests/` folder is only compiled when you run `cargo test`, Cargo already knows to keep it out of production!

**File: `tests/my_tests.rs`**
```rust
// 1. We must explicitly import our library, exactly like a customer would!
// (Assuming your Cargo.toml package name is `my_awesome_library`)
use my_awesome_library; 

// 2. Just write your tests! No `mod tests` block needed.
#[test]
fn test_the_public_api() {
    // We can only access functions marked with `pub` in our lib.rs!
    let result = my_awesome_library::calculate_total(100);
    
    assert_eq!(result, 120);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Integration Tests Scoping and Lifecycle Rules

**The mistake:** Assuming Integration Tests instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("integration_tests_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("integration_tests_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Integration Tests State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Integration Tests through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Integration Tests Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Integration Tests instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Cheating Secret Shopper

**Problem:** You wrote a library with a public `login()` function, and a private `hash_password()` function. You write the following Integration Test in your `tests/` folder. Why does it fail to compile?

```rust
use my_auth_lib;

#[test]
fn check_hashing() {
    let hash = my_auth_lib::hash_password("password123");
    assert_ne!(hash, "password123");
}
```

> [!check]- Answer
> It fails because `hash_password()` is private! 
>
> Integration Tests are external. They are exactly like a customer who downloaded your crate from the internet. They can only access functions that are marked with `pub`. If you want to test private internal functions, you must write a Unit Test inside `src/lib.rs`.

---

### Exercise 2: `tests/common/mod.rs` — Sharing Helpers Without Creating a Test Binary

**Problem:**
You want to share a `setup()` helper function across multiple integration test files in your `tests/` directory. You create `tests/common.rs` with:
```rust
pub fn setup() { /* prepare test database */ }
```
When you run `cargo test`, you see:
```
running 0 tests
test result: ok. 0 passed
```
for a test binary called `common`. Why is Cargo running `tests/common.rs` as its own test binary, and how do you fix it?

> [!check]- Answer
> **Why it happens:**
> Every `.rs` file directly inside `tests/` is compiled by Cargo as an **independent test binary**. Cargo sees `tests/common.rs` and creates a separate test executable for it. Since `common.rs` has no `#[test]` functions, that binary reports "0 tests". This is annoying noise in the output and also means `setup()` is compiled and linked separately rather than being shared.
>
> **The fix: use `tests/common/mod.rs`:**
> ```
> tests/
>   common/
>     mod.rs       ← helper code goes here
>   auth_test.rs   ← uses `mod common;`
>   billing_test.rs
> ```
> Subdirectories inside `tests/` are **not** automatically compiled as top-level test binaries. A file at `tests/common/mod.rs` is a module, not an entry point. Each test file that needs the helpers declares:
> ```rust
> mod common;  // looks for tests/common/mod.rs
> ```
> This causes `common/mod.rs` to be compiled as part of *that test file's binary*, not as its own binary. Cargo never sees a standalone `tests/common` executable, so no spurious "0 tests" output appears.
>
> **Explanation:**
> This is a Cargo file-discovery quirk: the `tests/` directory uses the same "every top-level `.rs` file is a target" rule as `src/bin/`. The `mod.rs` convention is the standard escape hatch when you need shared helpers.

---

### Exercise 3: Writing a Real Integration Test

**Problem:**
Write the two files needed for a complete, working integration test:
1. `src/lib.rs` — a public `add(a: i32, b: i32) -> i32` function.
2. `tests/math_test.rs` — an integration test file that imports the library and tests `add`.

Then answer:
- Why does `tests/math_test.rs` use `use my_crate::add;` rather than `mod` to access the function?
- Why is `#[cfg(test)]` **not** needed in the integration test file?

**Expected output:**
> [!check]- Answer
> ```text
> running 2 tests
> test test_add_positive ... ok
> test test_add_negative ... ok
> test result: ok. 2 passed; 0 failed
> ```
>
> - **Hint 1:** In `tests/math_test.rs`, the crate name matches the `[package] name` in `Cargo.toml`. If your package is named `my_math`, the import is `use my_math::add;`. Cargo compiles each integration test file as a separate crate that depends on your library.
> - **Hint 2:** No `#[cfg(test)]` is needed because the entire `tests/` directory is only compiled during `cargo test`. Cargo never includes integration test files in a normal `cargo build`.
> - **Hint 3:** No `fn main()` is needed either. Cargo generates its own `main` harness for the test binary that discovers and runs all `#[test]` functions automatically.
>
> ```rust
> // src/lib.rs
>
> /// Adds two integers.
> pub fn add(a: i32, b: i32) -> i32 {
>     a + b
> }
> ```
>
> ```rust
> // tests/math_test.rs
>
> // Integration tests import the crate by name, exactly like an external user would.
> // No `#[cfg(test)]` needed — this file is ONLY compiled during `cargo test`.
> use my_math::add;
>
> #[test]
> fn test_add_positive() {
>     assert_eq!(add(2, 3), 5);
> }
>
> #[test]
> fn test_add_negative() {
>     assert_eq!(add(-1, -4), -5);
> }
> ```
>
> **Answer to the `use` vs `mod` question:**
> `mod` declares a *submodule* that Cargo looks for as a file in the same directory. `use` imports an item from a *separate crate*. Because each file in `tests/` is compiled as its own independent crate, the library is a *dependency* (Cargo adds it automatically), not a submodule. You import from it with `use`, exactly as an external user would after adding it to their `Cargo.toml`.
>
> **Answer to the `#[cfg(test)]` question:**
> `#[cfg(test)]` is needed in `src/` files to gate code that should only exist during testing — because those files are also compiled during normal `cargo build`. Files in `tests/` are *never* compiled by `cargo build`. Cargo only touches them during `cargo test`, so every line in a `tests/` file is implicitly test-only — no annotation required.

---

## 6. Related Terms

- [`#[test]`](../level_08/test_attribute.md) — The attribute used inside integration tests to mark the test functions.
- [Crate](../level_01/crate.md) — Every file in the `tests/` folder is compiled as its own independent crate!

---

## 7. Key Takeaways

- Integration Tests live in a **`tests/`** directory at the root of your project.
- They act exactly like an external customer: they can only access your `pub` API.
- Every `.rs` file in the `tests/` folder is compiled as a completely separate crate.
- You can only write integration tests for Library Crates (`lib.rs`), not Binary Crates (`main.rs`).
- You still use the `#[test]` attribute, but you do *not* need `#[cfg(test)]`.
