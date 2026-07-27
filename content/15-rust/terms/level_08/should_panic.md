# `#[should_panic]`

> **Level 8 — Testing & Documentation**
> Attribute indicating a test is expected to panic.

---

## 1. Prerequisites

- [`#[test]`](../level_08/test_attribute.md) — The attribute that must always accompany `#[should_panic]`.
- [`panic!`](../level_04/panic.md) — The macro that triggers the behavior this attribute is looking for.

---

## 2. Term Category

**Rust-specific (the reverse test)**: Normally, if a function panics, the test runner marks it as a failure (red). 

But sometimes, you *want* a function to panic. For example, if you write a function that divides two numbers, you want to guarantee that it crashes if the user tries to divide by zero. The **`#[should_panic]`** attribute tells the test runner to reverse its logic: if the function panics, the test *passes*. If the function successfully finishes, the test *fails*.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In robust software, testing edge cases and failure modes is just as important as testing the "happy path". 

If your official API documentation explicitly states: *"This function will panic if you pass it a negative number,"* you need a way to mathematically prove that it actually does. The Rust designers created `#[should_panic]` to make testing these intentional, defensive crashes incredibly easy.

### (2) Reality Metaphor

Imagine you are testing a new car's Airbag System. 

In a normal test (like testing the radio), if the car crashes, the test failed. But in an Airbag test, a crash is exactly what you want! If you crash the car into a wall and the airbag deploys, the test passes. If you drive the car safely to the grocery store during the airbag test, the test actually *fails*, because you didn't trigger the system you were trying to verify. 

`#[should_panic]` is the label you put on the car to tell the safety inspectors: *"Crash this car into a wall on purpose!"*

### (3) Rust Code Examples

#### Short Snippet (The Basic Crash)
Here is a test that intentionally triggers an array out-of-bounds error. 

```rust
#[cfg(test)]
mod tests {
    // 1. We must mark it as a test FIRST.
    #[test]
    // 2. We tell the runner to EXPECT a crash.
    #[should_panic]
    fn test_array_out_of_bounds() {
        let numbers = [1, 2, 3];
        // We ask for the 99th item in an array of 3 items. 
        // This causes a panic! The test PASSES!
        let _x = numbers[99]; 
    }
}
```

#### Fuller Example (The Exact Crash)
If you just use `#[should_panic]`, the test passes on *any* panic. But what if it panicked for the wrong reason? The idiomatic way to use this attribute is to provide an `expected` message.

```rust
pub fn divide(a: i32, b: i32) -> i32 {
    if b == 0 {
        panic!("MathError: Cannot divide by zero!");
    }
    a / b
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    // We tell the runner to look for a SPECIFIC panic message!
    // It only passes if the panic message contains this exact string.
    #[should_panic(expected = "MathError: Cannot divide by zero")]
    fn test_divide_by_zero() {
        // This triggers the specific panic we want.
        divide(10, 0);
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Should Panic Scoping and Lifecycle Rules

**The mistake:** Assuming Should Panic instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("should_panic_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("should_panic_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Should Panic State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Should Panic through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Should Panic Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Should Panic instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Strict Bouncer

**Problem:** You wrote a `login(age)` function. It contains the code `assert!(age >= 18, "User is too young");`. Write the two attributes you need to place above your test function to verify that `login(15)` correctly panics with the exact expected error.

> [!check]- Answer
> ```rust
> #[test]
> #[should_panic(expected = "User is too young")]
> fn test_underage_login() {
>     login(15);
> }
> ```

---

### Exercise 2: Expecting Specific Panic Messages

**Problem:** Annotate a test function with `#[should_panic(expected = "out of bounds")]`.

**Expected output:**
```
Expected panic test configured
```

> [!check]- Answer
> ```rust
> #[test]
> #[should_panic(expected = "out of bounds")]
> fn test_bounds() {
>     panic!("out of bounds");
> }
> fn main() {
>     println!("Expected panic test configured");
> }
> ```
>
> **Explanation:** `expected` verifies that panic messages contain the target substring.

### Exercise 3: Testing Division by Zero Panics

**Problem:** Test integer division by zero using `#[should_panic]`.

**Expected output:**
```
Div zero panic test verified
```

> [!check]- Answer
> fn main() {
>     println!("Div zero panic test verified");
> }
> ```
>
> **Explanation:** `#[should_panic]` validates expected panic failures in bounds checks and math zero conditions.

---

---

## 6. Related Terms

- [`#[test]`](../level_08/test_attribute.md) — The attribute that must always accompany `#[should_panic]`.
- [`panic!`](../level_04/panic.md) — The macro that triggers the behavior this attribute looks for.
- [`assert!`](../level_08/assert_macros.md) — The macros that are often used inside functions to intentionally trigger the panics you are testing.

---

## 7. Key Takeaways

- `#[should_panic]` reverses standard test logic: Panicking = Pass. Completing successfully = Fail.
- It must be used in combination with the `#[test]` attribute.
- It is crucial for verifying that your code correctly catches and crashes on invalid input or edge cases.
- Always try to use `#[should_panic(expected = "message")]` to ensure it panicked for the exact right reason.
