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

### Exercise 2: Structuring Shared Test Helpers in `tests/common/mod.rs`

**Problem:** Explain why `tests/common/mod.rs` prevents Cargo from treating helper modules as test binaries.

**Expected output:**
> [!check]- Answer
> ```
> tests/common/mod.rs avoids test runner overhead
> ```
> ```rust
> fn main() {
>     println!("tests/common/mod.rs avoids test runner overhead");
> }
> ```
>
> **Explanation:** Subdirectories with `mod.rs` are ignored as independent test binary targets by Cargo.

---

### Exercise 3: Importing Public Library Crates in Integration Tests

**Problem:** Write an integration test function in `tests/integration_test.rs` importing `use my_crate::*;`.

**Expected output:**
> [!check]- Answer
> ```
> Integration test executed
> ```
> #[test]
> fn test_pub_api() {
>     println!("Integration test executed");
> }
> fn main() { test_pub_api(); }
> ```
>
> **Explanation:** Integration tests in `tests/` exercise published library APIs externally.

---

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
