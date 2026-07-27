# Prelude

> **Level 7 — Modules, Visibility & Project Structure**
> The set of names — `Option`, `Result`, `Vec`, `String`, and common traits — automatically imported into every module, with no `use` statement required.

---

## 1. Prerequisites

- [`use` Statement](../level_07/use_statement.md) — The mechanism the prelude implicitly performs on your behalf.
- [Module](../level_01/module.md) — The scope the prelude's names are injected into.
- [The Standard Library (`std`)](../level_17/std_library.md) — Where the default prelude's contents come from.

---

## 2. Term Category

**Implicit Import Mechanism (the invisible `use` statements)**: Every Rust file behaves as though it starts with a hidden `use std::prelude::v1::*;` (or the `core` prelude, under `#![no_std]`) — a curated list of extremely common names that would be tedious to import manually in literally every single file that uses them.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

`Option`, `Result`, `Vec`, `String`, `Box`, `Clone`, `Drop`, `Iterator` — these types and traits are used in nearly *every* nontrivial Rust file. Requiring an explicit `use std::option::Option;`, `use std::vec::Vec;`, and so on at the top of every single module would be enormous, near-universal boilerplate with zero informational value — of course a file uses `Option`, virtually all of them do. Rust's solution is the prelude: a small, deliberately curated set of names that the compiler implicitly brings into scope for every module, automatically, with no `use` statement required at all. This is why beginners can write `let x: Option<i32> = None;` on their very first day without ever being taught what a `use` statement is — the necessary import already silently happened before their code even started.

### (2) Reality Metaphor

Imagine walking into any hotel room in a particular chain and finding a small set of amenities — a bar of soap, a bottle of water, a notepad — already sitting there waiting for you, with zero request required, in **every single room**, everywhere in the world.

- **The prelude** is that standard, always-present amenity kit — you never have to call the front desk (**write a `use` statement**) to get `Option` or `Vec`; they're simply already there, in every room (**every module**), because the hotel chain (**the standard library**) decided these particular items are common enough to provide by default everywhere.
- **Anything not in the amenity kit** — say, a hair dryer, or a specific brand of coffee — you *do* still have to explicitly request from the front desk (**write an explicit `use` statement**), because it's not universal enough to justify stocking in literally every room by default.

### (3) Rust Code Examples

#### Short Snippet (What Works With Zero `use` Statements)
```rust
fn main() {
    // NONE of these required a `use` statement — all are in the prelude!
    let numbers: Vec<i32> = vec![1, 2, 3];
    let maybe: Option<i32> = numbers.first().copied();
    let result: Result<i32, String> = Ok(42);
    let text: String = String::from("hello");
    let boxed: Box<i32> = Box::new(5);

    println!("{maybe:?} {result:?} {text} {boxed}");
}
```

#### Fuller Example (What's NOT in the Prelude — Explicit `use` Still Required)
```rust
// HashMap is NOT in the prelude — this line is genuinely required:
use std::collections::HashMap;

fn main() {
    let mut map: HashMap<&str, i32> = HashMap::new(); // Would fail to compile without the `use` above!
    map.insert("a", 1);
    println!("{map:?}");
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Prelude Scoping and Lifecycle Rules

**The mistake:** Assuming Prelude instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("prelude_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("prelude_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Prelude State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Prelude through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Prelude Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Prelude instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Explain a Compile Error

**Problem:** This code fails with `cannot find type HashSet in this scope`. Explain why, given what you now know about the prelude, and provide the fix.
```rust
fn main() {
    let s: HashSet<i32> = HashSet::new();
}
```

> [!check]- Answer
> `HashSet` is **not** part of the standard prelude — only a small set of extremely universal names (`Option`, `Result`, `Vec`, `String`, `Box`, and a handful of traits) are implicitly imported. `HashSet` lives in `std::collections` and must be explicitly brought into scope:
> ```rust
> use std::collections::HashSet;
>
> fn main() {
>     let s: HashSet<i32> = HashSet::new();
> }
> ```

---

### Exercise 2: Building a Custom Library Prelude

**Problem:** Create a `pub mod prelude` re-exporting common library traits and types `pub use crate::core::*;`.

**Expected output:**
```
Custom prelude imported
```

> [!check]- Answer
> ```rust
> mod my_crate {
>     pub mod core { pub fn run() { println!("Custom prelude imported"); } }
>     pub mod prelude { pub use super::core::run; }
> }
> use my_crate::prelude::*;
> fn main() {
>     run();
> }
> ```
>
> **Explanation:** Library preludes group common types and traits into single wildcard import modules.

### Exercise 3: Standard Prelude Default Imports

**Problem:** Name 5 items automatically imported into every Rust file via standard prelude (e.g. `Option`, `Result`, `Vec`, `String`, `Box`).

**Expected output:**
```
Prelude items: Option, Result, Vec, String, Box
```

> [!check]- Answer
> fn main() {
>     println!("Prelude items: Option, Result, Vec, String, Box");
> }
> ```
>
> **Explanation:** The standard prelude automatically imports ubiquitous types into every Rust module.

---

---

## 6. Related Terms

- [`use` Statement](../level_07/use_statement.md) — The exact mechanism the prelude implicitly invokes on your behalf for its curated set of names.
- [The Standard Library (`std`)](../level_17/std_library.md) — The source of the default prelude's contents.
- [`#![no_std]`](../level_17/no_std.md) — Switches to a different, smaller prelude sourced from `core` instead of `std`.
- [Module](../level_01/module.md) — The scope unit the prelude's implicit imports apply to, in every single file.

---

## 7. Key Takeaways

- The prelude is a small, curated set of names (types like `Option`, `Result`, `Vec`, `String`, `Box`, and common traits) automatically imported into every module with no `use` statement.
- It's why beginner Rust code can use `Option`/`Vec` immediately, without ever needing to be taught `use` statements first.
- Most standard-library types — including very common ones like `HashMap` — are **not** in the prelude and still require an explicit `use`.
- `#![no_std]` swaps the default `std` prelude for a smaller one sourced from `core`, since `std`-specific types aren't available there.
