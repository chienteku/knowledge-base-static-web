# `#[test]`

> **Level 8 — Testing & Documentation**
> Attribute marking a function as a unit test, run via `cargo test`.

---

## 1. Prerequisites

- [Derive Macro](../level_04/derive_macro.md) — The feature that introduces the `#[...]` attribute syntax.
- [`cfg` Attribute](../level_07/cfg_attribute.md) — The tool used to hide tests from production builds.

---

## 2. Term Category

**Rust Tooling (the built-in test runner)**: In languages like JavaScript or Python, if you want to write a unit test, you usually have to download an external testing framework (like Jest, Mocha, or PyTest), configure it, and set up test runners. 

Rust has a world-class test runner built directly into the compiler and standard library! The **`#[test]`** attribute is how you tell the compiler that a specific function is a Unit Test.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The Rust designers wanted testing to be absolutely zero-friction. If testing requires downloading libraries and writing configuration files, developers will procrastinate and avoid writing tests. 

By building testing directly into the language, you never have to configure anything. You just write `#[test]` above a function, run `cargo test` in your terminal, and Cargo automatically finds all the marked functions, runs them in parallel, and gives you a beautiful green/red report.

### (2) Reality Metaphor

Imagine you are a factory worker building a car engine. 

As you build it, you occasionally want to run a diagnostic check. However, you wouldn't ship the diagnostic machine *inside* the car to the customer! 

You attach a special `[Diagnostic Mode]` sticker (`#[test]`) to a specific diagnostic button. When the factory manager runs a test (`cargo test`), they press that button. But when the car is finally shipped to the customer (`cargo build`), the factory automatically removes that button entirely. It never goes into production.

### (3) Rust Code Examples

#### Short Snippet (The Basic Test)
Any normal function can become a test by adding the attribute! (Note: Test functions cannot take arguments).

```rust
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

// 1. We mark the function as a test!
#[test]
fn test_addition() {
    let result = add(2, 2);
    
    // 2. We use a macro to verify the answer is correct
    assert_eq!(result, 4); 
}
```

#### Fuller Example (The Idiomatic Test Module)
While you *can* put `#[test]` functions anywhere, Rust developers almost universally follow a specific pattern. They create an internal module named `tests` at the very bottom of the file they are testing.

```rust
// File: src/math.rs
pub fn multiply(a: i32, b: i32) -> i32 {
    a * b
}

// ==========================================
// Idiomatic Testing Block
// ==========================================

// 1. We hide the ENTIRE module from production builds!
#[cfg(test)]
mod tests {
    // 2. We import everything from the parent file (math.rs) into this module
    use super::*;

    // 3. We write our test
    #[test]
    fn it_multiplies_correctly() {
        assert_eq!(multiply(5, 5), 25);
    }

    // 4. We can even write helper functions that aren't tests!
    // Because `mod tests` is hidden, this helper won't bloat production code.
    fn setup_database_for_test() { ... }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Test Attribute Scoping and Lifecycle Rules

**The mistake:** Assuming Test Attribute instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("test_attribute_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("test_attribute_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Test Attribute State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Test Attribute through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Test Attribute Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Test Attribute instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Missing Import

**Problem:** You wrote the following test file, but it fails to compile! The compiler says: `cannot find function 'calculate_tax' in this scope`. How do you fix it?

```rust
fn calculate_tax(amount: f64) -> f64 {
    amount * 0.20
}

#[cfg(test)]
mod tests {
    #[test]
    fn check_tax() {
        assert_eq!(calculate_tax(100.0), 20.0);
    }
}
```

> [!check]- Answer
> You forgot `use super::*;`! 
>
> The `mod tests` block is a child module. By default, it cannot see the functions in its parent module. You must add `use super::*;` to import `calculate_tax` into the test scope.
>
> ```rust
> #[cfg(test)]
> mod tests {
>     use super::*; // FIX!
>
>     #[test]
>     fn check_tax() {
>         assert_eq!(calculate_tax(100.0), 20.0);
>     }
> }
> ```

---

### Exercise 2: Standard Unit Test Module Structure

**Problem:** Write a `#[cfg(test)] mod tests { use super::*; #[test] fn test_add() { assert_eq!(2+2, 4); } }` module.

**Expected output:**
```
Unit test verified
```

> [!check]- Answer
> ```rust
> #[cfg(test)]
> mod tests {
>     use super::*;
>     #[test]
>     fn test_add() {
>         assert_eq!(2 + 2, 4);
>     }
> }
> fn main() {
>     println!("Unit test verified");
> }
> ```
>
> **Explanation:** `#[cfg(test)]` ensures test module code is compiled only during `cargo test`.

### Exercise 3: Result-Returning Unit Tests

**Problem:** Write a test function returning `Result<(), String>` that uses `?` inside test body.

**Expected output:**
```
Result test passed
```

> [!check]- Answer
> #[test]
> fn test_result() -> Result<(), String> {
>     let val: u32 = "42".parse().map_err(|e| e.to_string())?;
>     assert_eq!(val, 42);
>     Ok(())
> }
> fn main() {
>     let _ = test_result();
>     println!("Result test passed");
> }
> ```
>
> **Explanation:** Tests returning `Result<(), E>` allow using `?` for concise error assertions.

---

---

## 6. Related Terms

- [`assert!`](../level_08/assert_macros.md) — The macros you use *inside* the `#[test]` function to actually verify that the code behaves correctly.
- [`cfg` Attribute](../level_07/cfg_attribute.md) — Used in conjunction with tests to hide the test module from the compiler.

---

## 7. Key Takeaways

- **`#[test]`** marks a standard function as a Unit Test.
- It is executed by running **`cargo test`** in your terminal.
- Test functions cannot take arguments.
- The idiomatic Rust pattern is to place tests in a `mod tests` block at the bottom of the file, guarded by `#[cfg(test)]`.
- Always use `use super::*;` inside your test module so you can access the functions you are trying to test.
