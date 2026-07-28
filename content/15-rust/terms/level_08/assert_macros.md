# `assert!` / `assert_eq!` / `assert_ne!`

> **Level 8 — Testing & Documentation**
> Macros for test assertions.

---

## 1. Prerequisites

- [`#[test]`](../level_08/test_attribute.md) — The attribute that sets up the environment where these macros are most commonly used.
- [Macros](../level_01/macros.md) — The code-generating system (denoted by `!`) that powers these assertions.
- [`panic!`](../level_04/panic.md) — The action these macros take when an assertion fails.

---

## 2. Term Category

**Rust-specific (the test judges)**: Once you've marked a function with `#[test]`, how do you actually verify that your code works? You use these three macros. 

They act as judges for your code. If they look at your code's output and determine it is incorrect, they immediately trigger a `panic!`. This `panic!` is caught by the test runner, causing the test to fail and lighting up your terminal with a big red `FAILED`.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Testing inherently requires comparing *expected* results with *actual* results. The Rust designers provided three distinct macros to cover all basic testing needs:
1. **`assert!`**: Checks if a single boolean condition is `true`.
2. **`assert_eq!`**: Checks if `actual == expected`. (This is the most heavily used!).
3. **`assert_ne!`**: Checks if `actual != expected`. 

Why are they macros (`!`) instead of standard functions? Because macros have access to the compiler's abstract syntax tree. When an `assert_eq!` fails, the macro automatically captures the line number, the file name, and prints the exact values of both sides, providing you with an incredibly helpful error message automatically!

### (2) Reality Metaphor

Imagine you are a Quality Assurance inspector at a toaster factory. 

A toaster comes off the assembly line. You plug it in and press the button (**`assert!`**). Does it turn on? Yes! (The test passes). 

You set the dial to level 4 and measure the temperature. You expect 400 degrees. The toaster outputs 350 degrees. You yell: *"**`assert_eq!`** failed! Expected 400, got 350!"* and you smash the big red PANIC button, immediately stopping the assembly line. 

### (3) Rust Code Examples

#### Short Snippet (The Three Judges)
Here are all three macros in action inside a single test.

```rust
#[test]
fn test_all_assertions() {
    let result = 5 + 5;
    let is_even = result % 2 == 0;

    // 1. assert! (Checks if something is true)
    assert!(is_even);

    // 2. assert_eq! (Checks if two things are exactly equal)
    assert_eq!(result, 10);

    // 3. assert_ne! (Checks if two things are NOT equal)
    assert_ne!(result, 99);
}
```

#### Fuller Example (Custom Error Messages)
You can optionally provide custom error messages to all three macros! This is incredibly useful for debugging complex tests where you want to know *why* something failed.

```rust
#[test]
fn test_user_permissions() {
    let role = "Guest";
    let has_access = false;

    // The first argument is the condition. The rest is a custom formatted message!
    assert!(
        !has_access, 
        "SECURITY BREACH! The role '{}' was incorrectly granted access!", 
        role
    );

    let calculated_tax = 15.50;
    assert_eq!(
        calculated_tax, 
        20.00, 
        "Tax calculation failed. Expected 20.00 but got {}", 
        calculated_tax
    );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Assert Macros Scoping and Lifecycle Rules

**The mistake:** Assuming Assert Macros instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("assert_macros_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("assert_macros_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Assert Macros State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Assert Macros through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Assert Macros Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Assert Macros instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Choose your Judge

**Problem:** You wrote a function called `is_admin(user_id)`. You want to write a test to verify that user `99` is an admin. Which assertion macro is the most idiomatic (cleanest) choice for this?

1. `assert_eq!(is_admin(99), true);`
2. `assert!(is_admin(99));`
3. `assert_ne!(is_admin(99), false);`

> [!check]- Answer
> **2. `assert!(is_admin(99));`**
>
> While all three options will technically work and compile, `assert!` is specifically designed for evaluating boolean flags. Using `assert_eq!(..., true)` is considered unidiomatic and overly verbose.

---

### Exercise 2: Custom Assertion Error Messages

**Problem:** Assert `val == 10` with custom error message `assert_eq!(val, 10, "Expected 10, got {}", val)`.

**Expected output:**
> [!check]- Answer
> ```
> Assertion passed
> ```
> ```rust
> fn main() {
>     let val = 10;
>     assert_eq!(val, 10, "Expected 10, got {}", val);
>     println!("Assertion passed");
> }
> ```
>
> **Explanation:** Assertion macros accept optional format strings and arguments for diagnostic failure messages.

---

### Exercise 3: Release-Omitted Checks with `debug_assert!`

**Problem:** Write a `debug_assert!(x > 0)` check that is compiled out in `--release` mode.

**Expected output:**
> [!check]- Answer
> ```
> Debug assert checked
> ```
> fn main() {
>     let x = 5;
>     debug_assert!(x > 0);
>     println!("Debug assert checked");
> }
> ```
>
> **Explanation:** `debug_assert!` executes only in debug builds, incurring zero runtime overhead in production binaries.

---

## 6. Related Terms

- [`PartialEq` Trait](../level_04/partialeq_eq.md) — The mathematical trait required to compare two items in `assert_eq!`.
- [`Debug` Trait](../level_04/debug_trait.md) — The formatting trait required to print the failure messages to the terminal.

---

## 7. Key Takeaways

- **`assert!(condition)`** checks if a boolean is true.
- **`assert_eq!(actual, expected)`** checks if two values are equal. (This is the most common one!).
- **`assert_ne!(actual, unexpected)`** checks if two values are *not* equal.
- If any of these fail, they trigger a `panic!`, causing the test to fail.
- You can add custom, formatted error messages as extra arguments (e.g., `assert!(is_valid, "Data was {}!", data)`).
- Custom structs must `#[derive(Debug, PartialEq)]` to be used in `assert_eq!` or `assert_ne!`.
