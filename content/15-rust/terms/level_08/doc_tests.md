# Doc Tests

> **Level 8 — Testing & Documentation**
> Code examples in doc comments (`///`) that are compiled and run as tests.

---

## 1. Prerequisites

- [Comments](../level_01/comments.md) — The `///` syntax used to write documentation for functions.
- [`#[test]`](../level_08/test_attribute.md) — The standard testing tool that Doc Tests automatically hook into.

---

## 2. Term Category

**Rust Tooling (the documentation enforcer)**: In most languages, documentation is just raw text. If you write a code example in the comments showing how to use your function, and then 6 months later you change the function's arguments, your documentation is now broken and lying to your users! 

Rust prevents this by turning your documentation examples into actual, runnable tests. When you run `cargo test`, Cargo extracts all the code blocks from your comments and executes them.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The Rust designers wanted `crates.io` to be the best, most reliable package registry in the world. Good packages require good documentation, and good documentation absolutely requires code examples. 

But code examples rot faster than anything else in a codebase. A developer updates the code but forgets to update the comments. 

By automatically extracting all markdown code blocks out of `///` comments and running them during `cargo test`, Rust guarantees that every single code example in your documentation actually compiles and works perfectly. If your code example is outdated, your build fails!

### (2) Reality Metaphor

Imagine reading an instruction manual for a new Blender. 

The manual says: *"Press the RED button to blend."* But the factory updated the blender 3 months ago, and now the button is BLUE. You press the red button, and the blender catches on fire. The manual lied to you!

A **Doc Test** is like a factory robot that reads the instruction manual every single night, presses the exact buttons the manual tells it to press on a real blender, and throws a massive alarm if the blender doesn't turn on.

### (3) Rust Code Examples

#### Short Snippet (The Basic Doc Test)
You don't need `#[test]`. You literally just write a markdown code block inside a triple-slash comment!

```rust
/// Adds two numbers together.
///
/// # Examples
///
/// ```
/// let result = my_library::add(2, 2);
/// assert_eq!(result, 4);
/// ```
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}
```
When you run `cargo test`, Cargo will say: `Doc-tests my_library ... ok`!

#### Fuller Example (Hiding Boilerplate)
Sometimes you need 10 lines of setup code (like connecting to a database) just to make a 2-line code example work. But you don't want the reader to see that ugly setup code in the documentation! 

Rust allows you to prefix lines with `# ` inside the code block. These lines are hidden from the reader in the final documentation, but the compiler still sees them and runs them!

```rust
/// Fetches the active user from the database.
///
/// ```
/// # // The reader will NOT see these hidden setup lines!
/// # let db = Database::connect_mock();
/// # db.insert_test_user("Alice");
/// #
/// // The reader WILL see this!
/// let user = my_library::get_user(&db);
/// assert_eq!(user.name, "Alice");
/// ```
pub fn get_user(db: &Database) -> User { ... }
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Doc Tests Scoping and Lifecycle Rules

**The mistake:** Assuming Doc Tests instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("doc_tests_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("doc_tests_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Doc Tests State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Doc Tests through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Doc Tests Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Doc Tests instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Invisible Setup

**Problem:** You are writing a doc test for an `open_file()` function. The test requires you to create a temporary file first, but you don't want the temporary file creation code to clutter up your beautiful documentation example. What specific character do you put at the start of the line to hide it from the reader?

> [!check]- Answer
> You use the **`#`** symbol (followed by a space)!
>
> ```rust
> /// ```
> /// # std::fs::write("temp.txt", "hello").unwrap();
> /// let file = open_file("temp.txt");
> /// ```
> ```

---

### Exercise 2: Hiding Setup Statements in Doc Tests

**Problem:** Use `#` prefix to hide setup statements inside doc test markdown blocks.

**Expected output:**
> [!check]- Answer
> ```
> Doc test compiled
> ```
> ```rust
> /// ```
> /// # let x = 5;
> /// assert_eq!(x, 5);
> /// ```
> pub fn check() {}
> fn main() { println!("Doc test compiled"); }
> ```
>
> **Explanation:** `#` hides boilerplate setup lines from rendered HTML while preserving code execution in tests.

---

### Exercise 3: `should_panic` in a Doc Test Block

**Problem:**
Doc tests aren't limited to examples that succeed. Sometimes the most important thing to document is *what panics*. Adding ` ```should_panic ``` ` to the opening fence tells `cargo test` to expect the enclosed code to panic \u2014 the test passes if it panics, and *fails* if it runs successfully.

Write the complete `///` doc comment for a `divide(a: u32, b: u32) -> u32` function that:
1. Includes a normal working example (` ``` `) showing `divide(10, 2) == 5`.
2. Includes a `should_panic` example showing that `divide(1, 0)` panics.
3. Implements the function body with `assert!(b != 0, "division by zero");`.

Then answer: **why is a `should_panic` doc test more valuable than just writing "panics if b is 0" in plain text?**

**Expected output:**
> [!check]- Answer
> *(No runtime stdout \u2014 these are `cargo test` doc tests. Both blocks pass: the first returns 5 correctly, the second panics as expected.)*
>
> - **Hint 1:** The ` ```should_panic ``` ` annotation goes on the *opening* fence line of the second code block: ` ```should_panic `. The closing fence is still just ` ``` `.
> - **Hint 2:** You can combine annotations: ` ```should_panic,no_run ``` ` marks a block as expected to panic but doesn't actually run it (useful when the panic requires an environment that isn't available in CI).
> - **Hint 3:** The `# ` prefix trick (from Exercise 1) works inside `should_panic` blocks too. You can hide the function definition so the rendered docs only show the one-line panic call.
>
> ```rust
> /// Divides `a` by `b`.
> ///
> /// # Examples
> ///
> /// Normal usage:
> /// ```
> /// # fn divide(a: u32, b: u32) -> u32 { if b == 0 { panic!("division by zero") } a / b }
> /// assert_eq!(divide(10, 2), 5);
> /// ```
> ///
> /// Panics when `b` is zero:
> /// ```should_panic
> /// # fn divide(a: u32, b: u32) -> u32 { if b == 0 { panic!("division by zero") } a / b }
> /// divide(1, 0); // panics: "division by zero"
> /// ```
> ///
> /// # Panics
> ///
> /// Panics if `b` is `0`.
> pub fn divide(a: u32, b: u32) -> u32 {
>     assert!(b != 0, "division by zero");
>     a / b
> }
> ```
>
> **Answer to the "why more valuable" question:**
> Plain text saying "panics if b is 0" can lie \u2014 maybe the implementation changed and it no longer panics, or it panics with a different message. A `should_panic` doc test is **executable**: `cargo test` runs it every time you run tests. If the function stops panicking (e.g. someone changed the assert to a return), the doc test fails immediately, alerting you that the documentation and the code have diverged. Documentation you can't compile is documentation you can't trust.

---

## 6. Related Terms

- [`cargo doc`](../level_08/cargo_doc.md) — The command that actually generates the beautiful HTML website from these `///` comments.
- [Integration Tests](../level_08/integration_tests.md) — Like Integration Tests, Doc Tests can only test the `pub` API of a Library crate.

---

## 7. Key Takeaways

- Any ` ``` ` code block inside a `///` doc comment is automatically compiled and run as a test.
- This mathematically guarantees your documentation is never outdated or lying to the user.
- You can hide ugly boilerplate setup code in your examples by prefixing the lines with `# `.
- Just like Integration Tests, Doc Tests only run for Library Crates (`src/lib.rs`), not Binary Crates (`main.rs`).
