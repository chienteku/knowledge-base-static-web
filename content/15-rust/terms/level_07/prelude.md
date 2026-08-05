# Prelude

> **Level 7 — Modules, Visibility & Project Structure**
> The set of names — `Option`, `Result`, `Vec`, `String`, and common traits — automatically imported into every module, with no `use` statement required.

---

## 1. Prerequisites


- [`use` Statement](use_statement.md) — The mechanism the prelude implicitly performs on your behalf.
- [Module](../level_01/module.md) — The scope the prelude's names are injected into.
- [The Rust Standard Library (`std`)](../level_17/std_library.md) — Where the default prelude's contents come from.

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

### Mistake 1: Assuming All Standard Library Types Are Included in the Default Prelude

**The mistake:** Calling `HashMap::new()` or `BTreeMap::new()` without writing `use std::collections::HashMap;`.

**Why it is wrong:** To avoid namespace bloat, only core types (`Option`, `Result`, `Vec`, `String`, `Box`) are included in the standard prelude. Collection types like `HashMap` must be explicitly imported via `use`.

*Incorrect:*
```rust
let map = HashMap::<String, i32>::new(); // ❌ Error E0412: cannot find type `HashMap` in this scope!
```

*Fix:*
```rust
use std::collections::HashMap; // Correct!
let map = HashMap::<String, i32>::new();
```

### Mistake 2: Writing Unnecessary Redundant `use std::vec::Vec;` Imports

**The mistake:** Explicitly writing `use std::vec::Vec;` or `use std::option::Option;` at the top of every file.

**Why it is wrong:** `Vec` and `Option` are already automatically imported into every module scope via the prelude. Redundant imports add clutter.

### Mistake 3: Overusing Wildcard Glob Imports (`use my_lib::prelude::*`) in Large Projects

**The mistake:** Importing custom library preludes with wildcard globs in every submodule file.

**Why it is wrong:** Can lead to unexpected name shadowing or ambiguities when new items are added to custom preludes in future versions. Use explicit imports or scope preludes carefully.

---

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
> [!check]- Answer
> ```
> Custom prelude imported
> ```
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

---

### Exercise 3: What Needs `use` and What Doesn't?

**Problem:**
The prelude makes a small curated set of items automatically available in every Rust file. Everything else in `std` requires an explicit `use`. A common beginner mistake is assuming "it's in std, so I can use it without importing it."

For each item below, predict: **does it require a `use` statement, or is it in the prelude?**

| Item | Requires `use`? |
|---|---|
| `Option<T>` | ? |
| `Vec<T>` | ? |
| `HashMap<K, V>` | ? |
| `String` | ? |
| `BTreeMap<K, V>` | ? |
| `Box<T>` | ? |
| `std::cmp::Ordering` | ? |
| `Iterator` trait | ? |
| `Write` trait (`std::io::Write`) | ? |
| `ToString` trait | ? |

Then write a program that uses all of the following **without any `use` statement**: `Vec<i32>`, `String`, `Box<i32>`, `Option<i32>`, and `ToString::to_string`. Then add the appropriate `use` for `HashMap` and show it compiles.

**Expected output:**
> [!check]- Answer
> ```text
> vec: [1, 2, 3], s: hello, boxed: 42, opt: Some(7), map size: 2
> ```
>
> | Item | Requires `use`? |
> |---|---|
> | `Option<T>` | ❌ No — prelude |
> | `Vec<T>` | ❌ No — prelude |
> | `HashMap<K, V>` | ✅ Yes — `use std::collections::HashMap` |
> | `String` | ❌ No — prelude |
> | `BTreeMap<K, V>` | ✅ Yes — `use std::collections::BTreeMap` |
> | `Box<T>` | ❌ No — prelude |
> | `std::cmp::Ordering` | ✅ Yes |
> | `Iterator` trait | ❌ No — prelude (the trait methods are available) |
> | `Write` trait (`std::io::Write`) | ✅ Yes — needed to call `.write_all()` etc. |
> | `ToString` trait | ❌ No — prelude (`.to_string()` works without importing it) |
>
> ```rust
> // No `use` statement needed for Vec, String, Box, Option, ToString.
> // All of these compile purely on the prelude.
> use std::collections::HashMap; // HashMap is NOT in the prelude — must import.
>
> fn main() {
>     let v: Vec<i32> = vec![1, 2, 3];        // Vec: prelude
>     let s: String = "hello".to_string();     // String + ToString: prelude
>     let b: Box<i32> = Box::new(42);          // Box: prelude
>     let o: Option<i32> = Some(7);            // Option: prelude
>
>     let mut map: HashMap<&str, i32> = HashMap::new(); // HashMap: explicit use
>     map.insert("a", 1);
>     map.insert("b", 2);
>
>     println!("vec: {:?}, s: {}, boxed: {}, opt: {:?}, map size: {}", v, s, b, o, map.len());
> }
> ```
>
> **Explanation:**
> The prelude contains only the most universally needed items — the ones that would be tedious and noisy to import in virtually every Rust file. `HashMap` is very common but not *universal* (many programs don't need it), so it's in `std::collections` and requires explicit import. The design choice is deliberate: items in the prelude must justify their namespace pollution across every single Rust file that ever gets written.

---

## 6. Related Terms


- [`use` Statement](use_statement.md) — The exact mechanism the prelude implicitly invokes on your behalf for its curated set of names.
- [The Rust Standard Library (`std`)](../level_17/std_library.md) — The source of the default prelude's contents.
- [Module](../level_01/module.md) — The scope unit the prelude's implicit imports apply to, in every single file.

---

## 7. Key Takeaways

- The prelude is a small, curated set of names (types like `Option`, `Result`, `Vec`, `String`, `Box`, and common traits) automatically imported into every module with no `use` statement.
- It's why beginner Rust code can use `Option`/`Vec` immediately, without ever needing to be taught `use` statements first.
- Most standard-library types — including very common ones like `HashMap` — are **not** in the prelude and still require an explicit `use`.
- `#![no_std]` swaps the default `std` prelude for a smaller one sourced from `core`, since `std`-specific types aren't available there.
