# `match`

> **Level 2 — Control Flow & Data Structures**
> Pattern matching expression; must be exhaustive over all possible variants.

---

## 1. Prerequisites

- [`if` / `else`](../level_02/if_else.md) — The basic branching logic that `match` often replaces when things get complex.
- [Expressions](../level_01/expressions.md) — Because `match` is an expression, it can return a value directly to a variable.

---

## 2. Term Category

**Rust-specific (the strict safety)**: `match` is the Rust equivalent of the `switch` statement found in C, Java, or JavaScript. However, Rust elevates it by enforcing strict **exhaustiveness** (you must handle every possible case) and by making it an expression.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The traditional `switch` statement in older languages is infamous for causing bugs. Two major issues exist:
1. **Fallthrough**: If you forget to write the `break` keyword at the end of a `switch` case, the code accidentally "falls through" and executes the next case too.
2. **Missing cases**: You can easily forget to handle a specific value, leading to unexpected runtime behavior.

Rust designed the `match` expression to completely eliminate these bugs. 
First, there is no "fallthrough" in Rust. Once a `match` arm is chosen, it executes that block and immediately exits.
Second, `match` is **exhaustive**. The compiler will literally refuse to compile your code if it detects that you haven't handled every single possible value. To handle "everything else", Rust uses the `_` (underscore) character as a catch-all.

### (2) Reality Metaphor

Imagine you are a postal worker sorting physical mail. 

A traditional `switch` statement is like having a few specific slots for standard letters. If a weirdly shaped package arrives, you might just throw it on the floor because you forgot to build a slot for it. 

A Rust `match` statement is like having a strict postmaster hovering over your shoulder. They demand that every single piece of mail has a designated slot. To guarantee this, they force you to put a large "Catch-All" bin (`_`) at the end of your desk so that absolutely nothing is dropped on the floor.

### (3) Rust Code Examples

#### Short Snippet
```rust
let dice_roll = 4;

// Matching against a number. 
match dice_roll {
    1 => println!("Critical failure!"),
    6 => println!("Critical success!"),
    // The `_` is the catch-all. It handles 2, 3, 4, 5, 
    // and literally any other integer.
    _ => println!("A normal roll."),
}
```

#### Fuller Example
```rust
fn main() {
    let traffic_light = "Yellow";
    
    // Because `match` is an expression, we can assign the result 
    // directly to the `action` variable.
    let action = match traffic_light {
        "Green" => "Go",
        "Yellow" => "Slow down",
        "Red" => "Stop",
        // If the string is anything else (e.g. "Purple" or "Broken"),
        // the catch-all handles it safely.
        _ => "Proceed with caution",
    };
    
    println!("The light is {}. Action: {}", traffic_light, action);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Match Scoping and Lifecycle Rules

**The mistake:** Assuming Match instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("match_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("match_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Match State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Match through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Match Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Match instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Satisfy the Postmaster

**Problem:** The code below tries to map an HTTP status code to a message, but it will not compile because it is not exhaustive. Fix it by adding a catch-all arm that returns `"Unknown Error"`.

```rust
fn main() {
    let status_code = 404;
    
    let message = match status_code {
        200 => "OK",
        403 => "Forbidden",
        404 => "Not Found",
        500 => "Internal Server Error",
        // TODO: Add a catch-all arm here!
    };
    
    println!("Status: {}", message);
}
```

**Expected output:**
> [!check]- Answer
> ```text
> Status: Not Found
> ```
> - Add `_ => "Unknown Error",` to the bottom of the match list.

---

### Exercise 2: Match Guard Conditions

**Problem:** Match an integer `x` using match guards `n if n % 2 == 0 => "Even"` and `_ => "Odd"`.

**Expected output:**
> [!check]- Answer
> ```
> Even
> ```
> ```rust
> fn main() {
>     let x = 4;
>     let desc = match x {
>         n if n % 2 == 0 => "Even",
>         _ => "Odd",
>     };
>     println!("{}", desc);
> }
> ```
>
> **Explanation:** Match guards (`if condition`) add secondary runtime Boolean predicates to match arms.

---

### Exercise 3: Matching Tuple Ranges

**Problem:** Match coordinate tuple `(x, y)`: `(0, 0) => "Origin"`, `(x, 0) => "X-axis"`, `(0, y) => "Y-axis"`, `_ => "Space"`.

**Expected output:**
> [!check]- Answer
> ```
> X-axis
> ```
> ```rust
> fn main() {
>     let pt = (5, 0);
>     let loc = match pt {
>         (0, 0) => "Origin",
>         (_, 0) => "X-axis",
>         (0, _) => "Y-axis",
>         _ => "Space",
>     };
>     println!("{}", loc);
> }
> ```
>
> **Explanation:** Tuple pattern matching destructures multiple components simultaneously.

---

## 6. Related Terms

- [`if let`](../level_02/if_let_while_let.md) — Syntactic sugar for when a `match` only cares about one specific pattern and ignores all others.
- [Enum](../level_02/enum.md) — The custom data structure that `match` was practically built to work hand-in-hand with.

---

## 7. Key Takeaways

- `match` is a safer, more powerful alternative to long `if / else if` chains (and replaces `switch`).
- It is an **expression**, meaning it can return a value.
- Every possible value must be handled (**exhaustiveness**).
- Use the underscore `_` as a "catch-all" or "default" case.
- There is no "fallthrough" in Rust; only the matching arm is executed, and it automatically breaks.
