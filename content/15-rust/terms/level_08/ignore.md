# `#[ignore]`

> **Level 8 — Testing & Documentation**
> Attribute to skip a test by default; run ignored tests with `cargo test -- --ignored`.

---

## 1. Prerequisites

- [`#[test]`](../level_08/test_attribute.md) — The attribute that makes a function a test in the first place.

---

## 2. Term Category

**Rust Tooling (the test skipper)**: As your project grows, you might write some tests that take a very long time to run (like downloading a large file from the internet, connecting to a real database, or crunching massive amounts of data). 

You do not want these heavy tests running every single time you hit Save! The **`#[ignore]`** attribute tells Cargo to skip the test during standard runs, but keeps the test available for when you explicitly ask for it.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

A core rule of software engineering is: *Testing needs to be fast.* 

If `cargo test` takes 5 minutes to run, developers will simply stop running it. However, you still absolutely need to write those slow, heavy integration tests to ensure your software works in the real world! 

The Rust designers created `#[ignore]` so you can write those slow tests, commit them to your repository, but prevent them from slowing down your daily workflow.

### (2) Reality Metaphor

Imagine you have a daily workout routine (your standard `cargo test`). It takes 20 minutes, you do it every morning, and it keeps you healthy. 

Once a month, you want to run a full 26-mile marathon to really test your endurance. If you forced yourself to run a marathon *every single day*, you'd quit working out entirely! 

`#[ignore]` is like keeping the marathon on your calendar, but skipping it during your daily routine. You only run the marathon when you specifically wake up and say: *"Today is marathon day!"* (`cargo test -- --ignored`).

### (3) Rust Code Examples

#### Short Snippet (The Skipped Test)
To use it, you simply stack the `#[ignore]` attribute right below your `#[test]` attribute.

```rust
#[cfg(test)]
mod tests {
    #[test]
    fn fast_math_test() {
        assert_eq!(2 + 2, 4); // This runs instantly!
    }

    #[test]
    #[ignore]
    fn slow_database_test() {
        // This test connects to AWS and takes 10 seconds to run.
        // It will be SKIPPED during a standard `cargo test`.
        connect_to_database(); 
    }
}
```

#### Fuller Example (How to actually run it)
If Cargo skips the test by default, how do you actually run it when you want to? You use terminal flags!

```bash
# 1. The Daily Routine
# Runs `fast_math_test`. Skips `slow_database_test`.
cargo test

# 2. The Marathon Day! 
# The `--` separates Cargo's arguments from the test runner's arguments.
# This command runs ONLY the tests marked with #[ignore].
cargo test -- --ignored

# 3. Run Absolutely Everything
# This command runs all normal tests AND all ignored tests.
cargo test -- --include-ignored
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Ignore Scoping and Lifecycle Rules

**The mistake:** Assuming Ignore instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("ignore_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("ignore_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Ignore State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Ignore through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Ignore Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Ignore instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Specific Marathon

**Problem:** You have 5 tests marked with `#[ignore]`. One of them is named `test_billing_api`. You only want to run that specific ignored test, without running the other 4. What terminal command would you write?

> [!check]- Answer
> You combine the test name filter with the ignored flag!
>
> ```bash
> cargo test test_billing_api -- --ignored
> ```

---

### Exercise 2: Ignoring Slow Test Executions

**Problem:** Annotate a test function with `#[test]` and `#[ignore = "slow integration test"]`.

**Expected output:**
> [!check]- Answer
> ```
> Ignored test configured
> ```
> ```rust
> #[test]
> #[ignore = "slow integration test"]
> fn slow_test() {}
> fn main() {
>     println!("Ignored test configured");
> }
> ```
>
> **Explanation:** `#[ignore]` skips annotated test functions during standard `cargo test` runs.

---

### Exercise 3: Executing Ignored Tests via Cargo

**Problem:** Command line flag to run only ignored tests in Cargo.

**Expected output:**
> [!check]- Answer
> ```
> cargo test -- --ignored
> ```
> fn main() {
>     println!("cargo test -- --ignored");
> }
> ```
>
> **Explanation:** `-- --ignored` forces `cargo test` to execute only ignored tests.

---

---

## 6. Related Terms

- [`#[test]`](../level_08/test_attribute.md) — The attribute that makes a function a test in the first place.

---

## 7. Key Takeaways

- **`#[ignore]`** skips a test during a standard `cargo test` run.
- It must be used in combination with the `#[test]` attribute.
- It is heavily used for slow tests, network-dependent tests, or temporarily broken tests.
- You can run *only* the ignored tests using **`cargo test -- --ignored`**.
- You can provide a reason by writing `#[ignore = "reason"]`.
- The compiler still checks ignored tests for syntax and type errors, preventing "code rot"!
