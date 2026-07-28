# `let else` Statement

> **Level 2 — Control Flow & Data Structures**
> `let Pattern = expr else { diverge };` — binds on a successful match, or runs a diverging block otherwise.

---

## 1. Prerequisites

- [`if let` / `while let`](../level_02/if_let_while_let.md) — The pattern-matching sugar `let else` complements.
- [Pattern Matching](../level_02/pattern_matching.md) — The underlying mechanism.
- [Never Type (`!`)](../level_11/never_type.md) — The type of the diverging `else` block.

---

## 2. Term Category

**Control-Flow Sugar (the flattening idiom)**: `let else` is the modern, idiomatic answer to "unwrap this pattern, or bail out of the function right now." It exists specifically to eliminate the extra nesting level that `if let ... else { return }` forces onto the rest of your function.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Before `let else` (stabilized in Rust 1.65), extracting a value from an `Option`/`Result`/enum and bailing early on failure required an `if let` with the "happy path" indented one level deeper:

```rust
let value = if let Some(v) = maybe_value {
    v
} else {
    return; // or `continue`, `break`, `panic!`
};
```

This is awkward: the *success* case, which is usually the interesting logic, ends up wrapped in an `if let { ... } else { ... }` block just to extract one value. As functions grow and chain several of these, the code creeps rightward with nesting that has nothing to do with actual branching logic. `let else` inverts the emphasis: the pattern goes on the left of a normal `let`, and only the *failure* path gets an explicit block, which must diverge (`return`, `break`, `continue`, or `panic!`) since there's no other way to produce a value for `value` on that branch.

### (2) Reality Metaphor

Imagine airport security screening: you walk through, and either you get a green light and keep walking straight ahead, or a red light stops you and diverts you to a separate room entirely.

- **`if let ... else { ... }`**: The entire rest of your day's itinerary is written *inside* the "green light" room, indented one level in, because technically it was a branch. Every subsequent event nests one level deeper.
- **`let else`**: You just keep walking normally down the main hallway after the checkpoint (**no extra nesting**). The red-light room is a clearly separate side-room you're diverted to only on failure — and once you're in it, you *must* exit the building entirely (`return`/`panic!`/`continue`/`break`), never wander back into the main hallway.

### (3) Rust Code Examples

#### Short Snippet (Before and After)
```rust
fn describe(input: Option<i32>) -> String {
    // BEFORE: if let / else, with an extra nesting level.
    let value = if let Some(v) = input {
        v
    } else {
        return "no value".to_string();
    };
    format!("value is {value}")
}

fn describe_v2(input: Option<i32>) -> String {
    // AFTER: let else. Same logic, zero extra nesting for the happy path.
    let Some(value) = input else {
        return "no value".to_string();
    };
    format!("value is {value}")
}
```

#### Fuller Example (Chaining Several Extractions Flat)
```rust
fn process(raw: &str) -> Result<i32, String> {
    let Some((key, value)) = raw.split_once('=') else {
        return Err(format!("'{raw}' is missing '='"));
    };

    let Ok(number) = value.trim().parse::<i32>() else {
        return Err(format!("'{value}' is not a valid number"));
    };

    if key.trim().is_empty() {
        return Err("key cannot be empty".to_string());
    }

    Ok(number * 2) // The "happy path" stays flat, no matter how many extractions precede it.
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Let Else Statement Scoping and Lifecycle Rules

**The mistake:** Assuming Let Else Statement instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("let_else_statement_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("let_else_statement_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Let Else Statement State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Let Else Statement through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Let Else Statement Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Let Else Statement instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Convert to `let else`

**Problem:** Rewrite this function to use `let else` instead of `match`:
```rust
fn first_positive(numbers: &[i32]) -> i32 {
    let first = match numbers.first() {
        Some(n) => n,
        None => return 0,
    };
    if *first > 0 { *first } else { 0 }
}
```

> [!check]- Answer
> ```rust
> fn first_positive(numbers: &[i32]) -> i32 {
>     let Some(first) = numbers.first() else {
>         return 0;
>     };
>     if *first > 0 { *first } else { 0 }
> }
> ```

---

### Exercise 2: Early Function Exit with `let-else`

**Problem:** Write a function `parse_even(opt: Option<i32>)` using `let-else` to extract `val` or exit early returning `()`.

**Expected output:**
> [!check]- Answer
> ```
> Extracted: 42
> ```
> ```rust
> fn parse_even(opt: Option<i32>) {
>     let Some(val) = opt else { return; };
>     println!("Extracted: {}", val);
> }
> fn main() {
>     parse_even(Some(42));
>     parse_even(None);
> }
> ```
>
> **Explanation:** `let-else` binds variables in outer scope if the pattern matches or executes a diverging `else` block.

---

### Exercise 3: Unwrapping Result Errors with `let-else`

**Problem:** Extract `Ok(count)` from `Result<u32, &str>` using `let Ok(count) = res else { return; };`.

**Expected output:**
> [!check]- Answer
> ```
> Count: 10
> ```
> ```rust
> fn main() {
>     let res: Result<u32, &str> = Ok(10);
>     let Ok(count) = res else { return; };
>     println!("Count: {}", count);
> }
> ```
>
> **Explanation:** `let-else` avoids nested `if let` indentation while maintaining safe error extraction.

---

## 6. Related Terms

- [`if let` / `while let`](../level_02/if_let_while_let.md) — The syntax `let else` is designed to flatten away in the "extract or bail" case.
- [Pattern Matching](../level_02/pattern_matching.md) — The general matching machinery `let else` uses on its left-hand side.
- [Never Type (`!`)](../level_11/never_type.md) — The type-theoretic reason the `else` block is required to diverge.
- [`?` Operator](../level_04/question_mark_operator.md) — A related but narrower flattening tool, specific to `Option`/`Result` propagation; `let else` is more general, since its pattern isn't limited to `Some`/`Ok`.

---

## 7. Key Takeaways

- `let PATTERN = expr else { diverge };` binds the pattern's contents on success, with **no added nesting** for the rest of the function.
- The `else` block is mandatory to diverge — `return`, `break`, `continue`, or `panic!` — since there's no value to bind otherwise.
- It works for *any* refutable pattern, not just `Option`/`Result` — unlike the narrower `?` operator.
- Introduced in Rust 1.65 as the idiomatic replacement for `if let ... else { return/continue/break }`.
