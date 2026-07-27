# `#[must_use]`

> **Level 7 — Modules, Visibility & Project Structure**
> Emits a compiler warning when a returned value is silently ignored — why `Result` and lazy iterators nag you if you drop them.

---

## 1. Prerequisites

- [`Result<T, E>`](../level_02/result_t_e.md) — The most famous type carrying this attribute in the standard library.
- [Lazy Evaluation](../level_06/lazy_evaluation.md) — Why iterators are also marked `#[must_use]`.
- [`fn`](../level_01/fn.md) — What this attribute can also be applied directly to, on the function itself.

---

## 2. Term Category

**Lint Attribute (the "don't just throw this away" warning)**: `#[must_use]` marks a type (or a specific function's return value) so that if calling code produces one and then discards it without ever reading, storing, or otherwise using it, the compiler emits a warning — flagging what's very often a genuine, silent bug.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Consider `some_operation_that_might_fail();` where the function returns a `Result<T, E>` but the call's return value is never bound to anything. Was the error silently ignored on purpose, or did the developer simply forget the `?` or a `.unwrap()`/`match`? Without any signal, this is indistinguishable from a real bug — and in practice, it very often *is* one: an operation failed, and nobody noticed. `#[must_use]`, applied to `Result` (and `Option`, and iterators, and several other types) in the standard library, makes the compiler flag exactly this situation with a warning, nudging the developer to explicitly handle or intentionally discard (via `let _ = ...;`) the value, rather than silently dropping it by accident. It's a lightweight, zero-runtime-cost static check that catches an entire class of "I forgot to check the result" bugs at compile time.

### (2) Reality Metaphor

Imagine a package delivery service that requires an explicit signature confirming "I received this and either accepted or explicitly refused it," rather than allowing the courier to just leave a package on the doorstep and drive off with no acknowledgment.

- **Without `#[must_use]`**: The courier drops a package (**a `Result`**) at the door and leaves immediately. Maybe the homeowner picked it up, maybe it sat there and got rained on and ruined — nobody can tell from the delivery log alone whether the outcome was actually addressed.
- **With `#[must_use]`**: The delivery system flags an alert the moment a package is dropped without a corresponding signature — "package #4471 was delivered but never signed for!" It doesn't *force* the homeowner to do anything specific with it, but it makes silent, unacknowledged deliveries impossible to overlook.

### (3) Rust Code Examples

#### Short Snippet (The Classic `Result` Warning)
```rust
fn risky_operation() -> Result<i32, String> {
    Err("something went wrong".to_string())
}

fn main() {
    risky_operation(); // WARNING: unused `Result` that must be used
    // The compiler flags this because Result<T, E> is #[must_use] in the standard library.

    // Explicitly acknowledging the discard silences the warning:
    let _ = risky_operation(); // "I'm intentionally ignoring this."
}
```

#### Fuller Example (Applying `#[must_use]` to Your Own Type)
```rust
#[must_use = "a Transaction does nothing until you call .commit() or .rollback()"]
struct Transaction {
    committed: bool,
}

impl Transaction {
    fn begin() -> Self { Transaction { committed: false } }
    fn commit(mut self) { self.committed = true; println!("committed!"); }
}

fn main() {
    Transaction::begin(); // WARNING: unused `Transaction` that must be used
                           // a Transaction does nothing until you call .commit() or .rollback()

    let tx = Transaction::begin();
    tx.commit(); // No warning — the value was actually used.
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Must Use Attribute Scoping and Lifecycle Rules

**The mistake:** Assuming Must Use Attribute instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("must_use_attribute_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("must_use_attribute_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Must Use Attribute State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Must Use Attribute through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Must Use Attribute Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Must Use Attribute instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Predict Whether a Warning Fires

**Problem:** Does the following code trigger a `#[must_use]` warning? Why or why not?
```rust
fn get_value() -> Option<i32> { Some(42) }

fn main() {
    if get_value().is_some() {
        println!("got a value");
    }
}
```

> [!check]- Answer
> **No warning.** Even though `Option<T>` is `#[must_use]`, calling `.is_some()` on the returned `Option` counts as *using* it — the value was consumed by that method call, not silently dropped. The warning only fires when a `#[must_use]` value is produced and then discarded with **no** use at all, such as a bare `get_value();` statement with the return value completely unreferenced.

---

### Exercise 2: Annotating Custom Functions with `#[must_use]`

**Problem:** Annotate `#[must_use = "calculating area returns a value that should be used"] fn area(r: f64) -> f64`.

**Expected output:**
```
Area: 78.53981633974483
```

> [!check]- Answer
> ```rust
> #[must_use = "calculating area returns a value that should be used"]
> fn area(r: f64) -> f64 { std::f64::consts::PI * r * r }
> fn main() {
>     let a = area(5.0);
>     println!("Area: {}", a);
> }
> ```
>
> **Explanation:** `#[must_use]` triggers compiler warnings if returned values are unused.

### Exercise 3: Annotating Custom Struct Types with `#[must_use]`

**Problem:** Annotate `#[must_use] struct Guard;` so any unassigned instance generation triggers compiler warnings.

**Expected output:**
```
Guard assigned
```

> [!check]- Answer
> #[must_use]
> struct Guard;
> fn main() {
>     let _g = Guard;
>     println!("Guard assigned");
> }
> ```
>
> **Explanation:** Annotating types with `#[must_use]` applies warnings to all functions returning instances of that type.

---

---

## 6. Related Terms

- [`Result<T, E>`](../level_02/result_t_e.md) / [`Option<T>`](../level_02/option_t.md) — The two most common standard-library types marked `#[must_use]`.
- [Lazy Evaluation](../level_06/lazy_evaluation.md) — Why `Iterator`-returning adapter methods are also `#[must_use]`: an unused iterator chain silently does nothing at all.
- [`#[non_exhaustive]`](../level_07/non_exhaustive_attribute.md) — A sibling API-design attribute, addressing a different concern.
- [`?` Operator](../level_04/question_mark_operator.md) — The most common, idiomatic way to properly "use" a `Result` that would otherwise trigger this warning.

---

## 7. Key Takeaways

- `#[must_use]` warns when a value of the marked type is produced and then completely discarded without ever being read or used.
- It's applied to `Result`, `Option`, and iterator-returning methods in the standard library — precisely the cases where silently dropping the value is very often a genuine bug.
- You can apply it to your own types (or specific functions) too, optionally with a custom message explaining *why* the value matters.
- `let _ = expr;` explicitly and intentionally silences the warning — use it deliberately, not reflexively.
