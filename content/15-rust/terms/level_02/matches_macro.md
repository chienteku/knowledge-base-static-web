# `matches!` Macro

> **Level 2 — Control Flow & Data Structures**
> `matches!(expr, Pattern)` returns a `bool` for a single pattern test, without writing a full `match`.

---

## 1. Prerequisites

- [`match`](../level_02/match.md) — The full construct this macro is sugar over.
- [Pattern Matching](../level_02/pattern_matching.md) — The pattern grammar accepted on the right-hand side.
- [Macros](../level_01/macros.md) — The general mechanism `matches!` is built with.

---

## 2. Term Category

**Utility Macro (the boolean pattern test)**: `matches!` answers exactly one question — "does this value match this pattern?" — as a plain `bool`, letting you use pattern matching directly inside an `if` condition, a `.filter()` closure, or anywhere else a boolean is expected, without the ceremony of a full `match` block.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Checking "is this enum variant X (ignoring its payload)?" with a full `match` is verbose for such a simple yes/no question:

```rust
let is_ready = match status {
    Status::Ready => true,
    _ => false,
};
```

That's four lines and a throwaway `_ => false` arm just to answer one boolean question. `matches!(status, Status::Ready)` expands to exactly this `match` under the hood, but as a **single expression** — because it's a macro, it can accept the full pattern grammar (including `|` alternatives and `if` guards) that a plain `==` comparison could never support (enums with data, or types without `PartialEq`, can't use `==` at all).

### (2) Reality Metaphor

Imagine a security checkpoint where a guard just needs to answer "does this badge match one of the approved shapes?" — not process the badge in any other way.

- **A full `match`**: The guard sets up an entire elaborate sorting station with a labeled bin for every possible badge shape, most of which just funnel into a "reject" bin, purely to answer one yes/no question.
- **`matches!`**: The guard holds up a single stencil (**the pattern**) against the badge and just says "yes" or "no" on the spot — same underlying comparison logic, but collapsed into a single instant boolean answer.

### (3) Rust Code Examples

#### Short Snippet (Basic Boolean Check)
```rust
enum Status { Ready, Pending, Failed(String) }

fn main() {
    let status = Status::Ready;

    // Without matches!:
    let is_ready_verbose = match status {
        Status::Ready => true,
        _ => false,
    };

    // With matches!: identical result, one line.
    let status2 = Status::Ready;
    let is_ready = matches!(status2, Status::Ready);

    println!("{is_ready_verbose} {is_ready}"); // true true
}
```

#### Fuller Example (Or-Patterns and Guards Inside `matches!`)
```rust
enum Status { Ready, Pending, Failed(String) }

fn main() {
    let s = Status::Failed("timeout".to_string());

    // Or-pattern: is it EITHER Ready or Pending?
    let active = matches!(s, Status::Ready | Status::Pending);
    println!("{active}"); // false

    // Pattern with a guard: is it a Failed variant AND does the message contain "timeout"?
    let timed_out = matches!(&s, Status::Failed(msg) if msg.contains("timeout"));
    println!("{timed_out}"); // true

    // Great inside iterator adapters, where a closure must return bool:
    let statuses = vec![Status::Ready, Status::Failed("oops".into()), Status::Pending];
    let ready_count = statuses.iter().filter(|s| matches!(s, Status::Ready)).count();
    println!("{ready_count}"); // 1
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Matches Macro Scoping and Lifecycle Rules

**The mistake:** Assuming Matches Macro instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("matches_macro_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("matches_macro_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Matches Macro State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Matches Macro through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Matches Macro Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Matches Macro instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Filter with `matches!`

**Problem:** Given `let nums = vec![Some(1), None, Some(3), None, Some(5)];`, use `.filter()` with `matches!` to count how many are `None`.

> [!check]- Answer
> ```rust
> fn main() {
>     let nums = vec![Some(1), None, Some(3), None, Some(5)];
>     let none_count = nums.iter().filter(|n| matches!(n, None)).count();
>     println!("{none_count}"); // 2
> }
> ```

---

### Exercise 2: Filtering Enums with `matches!`

**Problem:** Filter a list of `Option<i32>` values using `.filter(|x| matches!(x, Some(n) if *n > 10))`.

**Expected output:**
```
[Some(15), Some(20)]
```

> [!check]- Answer
> ```rust
> fn main() {
>     let items = vec![Some(5), Some(15), None, Some(20)];
>     let filtered: Vec<_> = items
>         .into_iter()
>         .filter(|x| matches!(x, Some(n) if *n > 10))
>         .collect();
>     println!("{:?}", filtered);
> }
> ```
>
> **Explanation:** `matches!(val, pattern)` converts pattern matching expressions into Boolean predicates.

### Exercise 3: Testing Multiple Pattern Variants

**Problem:** Use `matches!(c, 'a' | 'e' | 'i' | 'o' | 'u')` to test if char `c` is a vowel.

**Expected output:**
```
Is vowel: true
```

> [!check]- Answer
> ```rust
> fn main() {
>     let c = 'e';
>     println!("Is vowel: {}", matches!(c, 'a' | 'e' | 'i' | 'o' | 'u'));
> }
> ```
>
> **Explanation:** `matches!` supports pattern OR syntax (`|`) for concise Boolean checks.

---

## 6. Related Terms

- [`match`](../level_02/match.md) — The full construct `matches!` expands into internally.
- [Pattern Matching](../level_02/pattern_matching.md) — Supplies the or-patterns (`|`) and guards (`if`) `matches!` accepts.
- [`PartialEq` / `Eq`](../level_04/partialeq_eq.md) — What `==` requires, and what `matches!` deliberately does **not** require.
- [`let else` Statement](../level_02/let_else_statement.md) — A sibling pattern-matching-flattening macro/statement, for a different use case (extraction rather than boolean testing).

---

## 7. Key Takeaways

- `matches!(value, pattern)` is sugar for a full `match` that returns `true` on a match and `false` otherwise, as a single expression.
- It accepts the **full pattern grammar** — or-patterns (`A | B`) and `if` guards — not just simple equality.
- It works on types that don't implement `PartialEq`, since it's structural pattern matching, not comparison.
- Especially useful inside closures (`.filter()`, `.find()`) where a `match` block would be awkward to inline.
