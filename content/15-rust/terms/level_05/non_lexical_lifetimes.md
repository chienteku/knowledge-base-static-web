# Non-Lexical Lifetimes (NLL)

> **Level 5 — Lifetimes**
> The borrow checker's current model, where a borrow ends at its *last actual use*, not at the end of its enclosing lexical scope.

---

## 1. Prerequisites

- [Borrow Checker](../level_03/borrow_checker.md) — The system NLL is the current operating model of.
- [Lifetime (`'a`)](../level_05/lifetime.md) — What NLL changed the precise meaning of.
- [Mutable Borrowing (`&mut`)](../level_03/mutable_borrowing.md) — The rule NLL's flexibility is most noticeable around.

---

## 2. Term Category

**Borrow-Checker Model (the "ends when you're done" rule)**: Before NLL, a borrow was considered alive for its **entire enclosing block**, textually, even after its last use. NLL changed this: a borrow is now considered to end at the last point in the control-flow graph where it's actually used, which lets the borrow checker accept far more obviously-correct code without requiring artificial restructuring.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Early Rust (pre-2018 edition, roughly) tied a borrow's lifetime to **lexical scope** — the borrow lasted until the closing `}` of the block it was created in, regardless of whether the code actually used it again after some earlier point. This produced maddening false-positive errors: `let r = &mut vec; use(r); let r2 = &mut vec;` would fail to compile even though `r` was never touched again after `use(r)`, purely because `r`'s lexical scope technically extended to the end of the block. NLL fixed this by making the borrow checker analyze the actual **control-flow graph** instead of textual scope: a borrow's *effective* lifetime now ends at its last real use, computed from how the code actually flows, not from where the curly braces happen to sit. This single change eliminated a huge fraction of the "the borrow checker is fighting me over code that's obviously fine" complaints from early Rust.

### (2) Reality Metaphor

Imagine a library that tracks whether a book is "checked out" based on when you're actually reading it, versus a stricter library that considers a book checked out for your entire visit no matter how briefly you glanced at it.

- **Lexical lifetimes (the old model)**: The library considers any book you touched checked out for your *entire visit*, even if you set it back down and never opened it again — so if a friend wants to borrow that exact book five minutes later, while you're still browsing the same room, they're incorrectly told it's unavailable.
- **NLL (the current model)**: The library's smart tracking system notices the exact moment you're truly done with a book (**your last actual use**) and marks it available again immediately — your friend can borrow it the moment you're finished, without needing to wait for you to leave the room entirely.

### (3) Rust Code Examples

#### Short Snippet (Code That Only Compiles Thanks to NLL)
```rust
fn main() {
    let mut data = vec![1, 2, 3];

    let r = &data;          // Immutable borrow starts.
    println!("{r:?}");      // Last use of `r` — its borrow ends HERE, not at the closing brace.

    data.push(4);           // A mutable borrow — legal under NLL, since `r`'s borrow already ended.
    println!("{data:?}");   // [1, 2, 3, 4]
}
```

#### Fuller Example (The Classic Pre-NLL Rejection)
```rust
use std::collections::HashMap;

fn get_or_insert(map: &mut HashMap<&str, i32>, key: &'static str) -> i32 {
    // Pre-NLL, this pattern often required restructuring to satisfy the borrow checker,
    // because `map.get(key)`'s borrow was considered to extend to the end of the block.
    if let Some(&value) = map.get(key) {
        return value; // Immutable borrow's LAST use is right here.
    }
    // NLL correctly recognizes the immutable borrow above already ended,
    // so this mutable borrow is accepted without any restructuring needed.
    map.insert(key, 0);
    0
}

fn main() {
    let mut scores = HashMap::new();
    println!("{}", get_or_insert(&mut scores, "alice")); // 0
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Non Lexical Lifetimes Scoping and Lifecycle Rules

**The mistake:** Assuming Non Lexical Lifetimes instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("non_lexical_lifetimes_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("non_lexical_lifetimes_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Non Lexical Lifetimes State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Non Lexical Lifetimes through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Non Lexical Lifetimes Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Non Lexical Lifetimes instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Explain Why This Compiles Under NLL

**Problem:** Explain, using NLL's "ends at last use" rule, why this function compiles:
```rust
fn first_word(s: &mut String) -> &str {
    let bytes = s.as_bytes();
    for (i, &b) in bytes.iter().enumerate() {
        if b == b' ' {
            return &s[0..i]; // A NEW immutable borrow of `s`, after `bytes`'s last use.
        }
    }
    s.push_str("!"); // A mutable borrow — would conflict with `bytes` under lexical scoping!
    s
}
```

> [!check]- Answer
> `bytes` (an immutable borrow of `s`) is last used inside the `for` loop's condition check (`bytes.iter()`). Under NLL, that borrow's effective lifetime ends there — it doesn't extend all the way to the function's closing brace just because it was declared near the top. By the time `s.push_str("!")` (a mutable borrow) executes, `bytes`'s borrow has already conceptually ended in the control-flow graph, so there's no conflict. Under the old, purely lexical-scope model, `bytes`'s borrow would have been considered alive for the entire function body, and this exact function would have failed to compile.

---

### Exercise 2: Early Borrow Termination via NLL

**Problem:** Create an immutable borrow `r = &mut val`, modify `*r`, print it, and then mutate `val` directly on the next line.

**Expected output:**
```
Modified val: 100
```

> [!check]- Answer
> ```rust
> fn main() {
>     let mut val = 42;
>     let r = &mut val;
>     *r = 100;
>     println!("Read via r: {}", r); // Last use of r
>     val = 200; // Allowed by NLL because r is never used after line above
>     println!("Modified val: {}", val);
> }
> ```
>
> **Explanation:** NLL ends reference lifetimes immediately after their final point of use rather than at scope end.

### Exercise 3: NLL in HashMap Entry Iteration

**Problem:** Demonstrate looking up a key in `HashMap`, using the reference, and modifying the map on subsequent lines without scope block nesting.

**Expected output:**
```
Updated map successfully
```

> [!check]- Answer
> use std::collections::HashMap;
> fn main() {
>     let mut map = HashMap::new();
>     map.insert("key", 1);
>     if let Some(val) = map.get("key") {
>         println!("Val: {}", val);
>     }
>     map.insert("key", 2);
>     println!("Updated map successfully");
> }
> ```
>
> **Explanation:** NLL permits map mutation immediately after `if let` pattern lookup references finish execution.

---

## 6. Related Terms

- [Borrow Checker](../level_03/borrow_checker.md) — The system NLL is the modern operating model for.
- [Lifetime (`'a`)](../level_05/lifetime.md) — What NLL redefines the practical *ending point* of.
- [Reborrowing & Two-Phase Borrows](../level_03/reborrowing.md) — A closely related refinement that also loosened overly strict early borrow-checker behavior.

---

## 7. Key Takeaways

- NLL (stabilized in the 2018 edition) redefined a borrow's effective lifetime to end at its **last actual use** in the control-flow graph, not at the end of its lexical (`{ }`) scope.
- This eliminated a large class of "obviously correct" code that the older, purely-scope-based borrow checker used to reject.
- NLL does **not** relax the core aliasing rules — it only changes *when* a borrow is considered to have ended.
