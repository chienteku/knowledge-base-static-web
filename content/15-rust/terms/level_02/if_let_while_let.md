# `if let` / `while let`

> **Level 2 — Control Flow & Data Structures**
> Syntactic sugar for matching a single pattern, ignoring the rest.

---

## 1. Prerequisites

- [`match`](../level_02/match.md) — The exhaustive pattern matching tool that `if let` is designed to simplify.
- [`Option<T>`](../level_02/option_t.md) — (Future reference) `if let` is most commonly used to extract values from `Option` (`Some` / `None`).

---

## 2. Term Category

**Rust-specific (mostly)**: `if let` is **syntactic sugar** (a shorthand convenience) popularized by languages like Swift and Rust to make single-pattern matching much less verbose.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The [`match`](../level_02/match.md) expression is incredibly safe because it is **exhaustive**—it forces you to handle every possible outcome. 

However, there is a very common scenario in Rust: you only care about *one* specific outcome, and you want to do absolutely nothing if any other outcome occurs. If you write this using a `match` statement, you are forced to add a useless `_ => ()` (catch-all that does nothing) arm just to satisfy the compiler. This adds visual clutter.

`if let` was designed specifically for this scenario. It allows you to match a single pattern and extract its inner value, while silently ignoring all other possibilities. `while let` is the exact same concept, but it loops continuously *as long as* the pattern continues to match.

### (2) Reality Metaphor

Imagine you are fishing in a murky lake.

A **`match` statement** is like a strict supervisor forcing you to process every single thing you reel in: *"If it's a fish, put it in the bucket. If it's an old boot, throw it in the trash. If it's seaweed, throw it back."*

An **`if let` statement** is like putting on a pair of selective sunglasses where you only care about one thing. *"If I catch a fish, put it in the bucket. Ignore literally everything else."*

### (3) Rust Code Examples

#### Short Snippet (The Verbose vs The Elegant)
```rust
let config_max = Some(3u8);

// The verbose way using `match`:
match config_max {
    Some(max) => println!("The maximum is configured to be {}", max),
    _ => (), // We are forced to include this useless line
}

// The elegant way using `if let`:
if let Some(max) = config_max {
    println!("The maximum is configured to be {}", max),
}
```

#### Fuller Example (`while let`)
```rust
fn main() {
    // A vector of numbers
    let mut numbers = vec![1, 2, 3];

    // `numbers.pop()` removes the last item and returns `Some(item)`.
    // When the vector is empty, it returns `None`.
    // `while let` will keep looping as long as it successfully matches `Some(number)`.
    while let Some(number) = numbers.pop() {
        println!("Popped: {}", number);
    }
    
    println!("The list is now empty!");
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using `if let` instead of `==` for simple values

**The mistake:** Using `if let` to check if an integer equals `5`.

**Why it's wrong:** `if let` is specifically for **Pattern Matching** (destructuring complex types like Enums to pull out inner values). If you are just doing a standard equality check on a primitive value, just use a normal `if` statement.

*Incorrect:*
```rust
let x = 5;
if let 5 = x { ... } // Compiler warning: irrefutable if-let pattern
```

*Fix:*
```rust
if x == 5 { ... }
```

### Mistake 2: Mutating If Let While Let State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with If Let While Let through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to If Let While Let Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe If Let While Let instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Refactor to Syntactic Sugar

**Problem:** The code below uses a verbose `match` statement to check if a user has a nickname. Because we do nothing (`()`) if they don't have a nickname, this is a perfect candidate for `if let`. Refactor it.

```rust
fn main() {
    let nickname = Some("Maverick");
    
    // TODO: Refactor this `match` into an `if let` statement
    match nickname {
        Some(name) => println!("Call sign: {}", name),
        None => (),
    }
}
```

**Expected output:**
```text
Call sign: Maverick
```

> [!check]- Answer
> - Delete the `match` block entirely.
> - Write: `if let Some(name) = nickname { ... }`
> - Put the `println!` inside the block.

---

### Exercise 2: Refactoring `match` to `if let`

**Problem:** Refactor a single-arm match on `Option<String>` into an `if let Some(name) = opt` expression.

**Expected output:**
```
Found: Alice
```

> [!check]- Answer
> ```rust
> fn main() {
>     let opt = Some(String::from("Alice"));
>     if let Some(name) = opt {
>         println!("Found: {}", name);
>     }
> }
> ```
>
> **Explanation:** `if let` provides concise pattern matching syntax when only one pattern variant matters.

### Exercise 3: Looping over Stack with `while let`

**Problem:** Pop items off a `Vec` stack using `while let Some(val) = stack.pop()` until empty.

**Expected output:**
```
Popped: 3
Popped: 2
Popped: 1
```

> [!check]- Answer
> ```rust
> fn main() {
>     let mut stack = vec![1, 2, 3];
>     while let Some(val) = stack.pop() {
>         println!("Popped: {}", val);
>     }
> }
> ```
>
> **Explanation:** `while let` continues executing its loop block as long as pattern matching succeeds.

---

## 6. Related Terms

- [`match`](../level_02/match.md) — The verbose, exhaustive parent of `if let`.
- [Pattern Matching](../level_02/pattern_matching.md) — The underlying mechanic used by `if let` to extract values.

---

## 7. Key Takeaways

- `if let Pattern = Value { ... }` is shorthand for a `match` statement that only cares about **one specific pattern**.
- It automatically and safely ignores all other possibilities.
- `while let Pattern = Value { ... }` loops continuously as long as the pattern successfully matches.
- It is perfect for handling `Option::Some` or `Result::Ok` when you don't care about the `None` or `Err` cases.
- If you find yourself writing an `else` block after an `if let`, you should probably just use `match`.
