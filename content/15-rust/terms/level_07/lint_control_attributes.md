# Lint Control Attributes (`#[allow]` / `#[warn]` / `#[deny]` / `#[forbid]`)

> **Level 7 — Modules, Visibility & Project Structure**
> Adjust the severity of compiler and Clippy lints at item, module, or crate scope.

---

## 1. Prerequisites

- [`cfg` Attribute](../level_07/cfg_attribute.md) — A sibling attribute mechanism, for conditional compilation rather than lint severity.
- [Clippy](../level_16/clippy.md) — The linter whose suggestions these attributes most commonly tune.
- [`#[must_use]`](../level_07/must_use_attribute.md) — An example of a specific warning these attributes can silence or escalate.

---

## 2. Term Category

**Lint Configuration Attributes (the volume knob for warnings)**: Every lint (a compiler or Clippy check, like "unused variable" or "dead code") has a default severity. These four attributes let you override that severity — anywhere from completely silencing a lint to making it an unbypassable hard error — scoped as narrowly as a single function or as broadly as an entire crate.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The compiler and Clippy ship with sensible default lint levels — most style/correctness suggestions are `warn`, most genuine bugs are `deny` or built into hard errors. But defaults can't fit every situation: sometimes a specific, well-understood piece of code deliberately does something a lint flags (test fixtures with intentionally "dead" code, a specific numeric cast you've verified is safe), and you want to silence just that one warning without turning the lint off project-wide. Other times, a team wants to *raise* a lint's severity — turning "warning, but the build still succeeds" into "hard compile error, this must be fixed before merging" — as a way of enforcing team standards automatically. The four attributes form an escalating scale: `#[allow(lint)]` silences it entirely, `#[warn(lint)]` sets/resets it to a warning, `#[deny(lint)]` turns it into a compile error, and `#[forbid(lint)]` does the same as `deny` but additionally **prevents any nested code from downgrading it back** with a later `#[allow]`.

### (2) Reality Metaphor

Imagine a building's fire-alarm sensitivity settings, adjustable per-room.

- **`#[allow(lint)]`**: You disable the smoke detector in exactly one specific room where you know controlled, expected smoke happens (a designated smoking lounge) — everywhere else in the building, the detector stays fully active.
- **`#[warn(lint)]`**: Reset a room's detector back to the building's normal default sensitivity — "beep loudly, but don't trigger the sprinklers."
- **`#[deny(lint)]`**: Configure a room's detector to trigger a full building evacuation — any smoke here is treated as a serious, blocking emergency.
- **`#[forbid(lint)]`**: The same evacuation-triggering configuration, but additionally **welded shut** so nobody working in that room later can quietly disable it for their own convenience — a policy that can't be locally overridden by anyone downstream.

### (3) Rust Code Examples

#### Short Snippet (Silencing a Specific Warning Locally)
```rust
fn main() {
    #[allow(unused_variables)] // Silences JUST this one specific warning, JUST here.
    let debug_only_value = 42; // Normally: "warning: unused variable `debug_only_value`"

    let y = 10; // This one still gets the normal warning, since it's outside the #[allow].
}
```

#### Fuller Example (Crate-Wide Denial, Scoped Overrides)
```rust
// At the TOP of a crate's main.rs or lib.rs, this affects the WHOLE crate:
#![deny(unused_must_use)] // Turns "ignored Result" from a warning into a hard compile error.

fn might_fail() -> Result<(), String> {
    Err("oops".to_string())
}

fn cleanup_ignoring_errors() {
    // Even under crate-wide `deny`, a LOCAL #[allow] can carve out a specific exception,
    // as long as the crate used `deny` (not `forbid`, which would block even this):
    #[allow(unused_must_use)]
    {
        might_fail(); // Explicitly, locally permitted to ignore the Result here.
    }
}

fn main() {
    // might_fail(); // Would be a HARD COMPILE ERROR here, thanks to the crate-wide deny!
    cleanup_ignoring_errors();
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Lint Control Attributes Scoping and Lifecycle Rules

**The mistake:** Assuming Lint Control Attributes instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("lint_control_attributes_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("lint_control_attributes_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Lint Control Attributes State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Lint Control Attributes through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Lint Control Attributes Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Lint Control Attributes instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Predict the Compile Outcome

**Problem:** Given this code, will `cargo build` succeed or fail?
```rust
#![forbid(dead_code)]

mod internal {
    #[allow(dead_code)] // Attempting to locally override the crate-wide forbid.
    fn unused_helper() {}
}
```

> [!check]- Answer
> **It fails to compile.** `#![forbid(dead_code)]` at the crate root doesn't just deny the lint — it specifically **prevents any nested `#[allow(dead_code)]` from taking effect anywhere in the crate**, including inside `mod internal`. The compiler will report an error on the local `#[allow]` itself, something like "forbid(dead_code) overrides the previous allow". This is precisely the distinguishing feature of `forbid` versus `deny`: `deny` can still be locally carved around by a nested `allow`; `forbid` cannot.

---

### Exercise 2: Allowing Specific Unused Variable Warnings

**Problem:** Suppress unused variable warning on `let unused = 42;` using `#[allow(unused_variables)]`.

**Expected output:**
```
Lint suppressed cleanly
```

> [!check]- Answer
> ```rust
> fn main() {
>     #[allow(unused_variables)]
>     let unused = 42;
>     println!("Lint suppressed cleanly");
> }
> ```
>
> **Explanation:** `#[allow(lint_name)]` localizes lint suppression to single items or statements.

### Exercise 3: Denying Warnings in CI with Crate Level Attributes

**Problem:** Add `#![deny(clippy::all)]` to crate root.

**Expected output:**
```
Clippy deny configured
```

> [!check]- Answer
> fn main() {
>     println!("Clippy deny configured");
> }
> ```
>
> **Explanation:** `#![deny(...)]` treats matching lint warnings as hard compilation errors.

---

## 6. Related Terms

- [`cfg` Attribute](../level_07/cfg_attribute.md) — A sibling attribute mechanism for a different purpose (conditional compilation, not lint severity).
- [Clippy](../level_16/clippy.md) — The linter whose suggestions (`clippy::lint_name`) are most commonly tuned with these attributes.
- [`#[must_use]`](../level_07/must_use_attribute.md) — An example of a specific lint (`unused_must_use`) these attributes can silence, warn on, or deny.
- [Edition](../level_07/edition.md) — Lint defaults and available lints can shift between editions, another reason explicit control sometimes matters.

---

## 7. Key Takeaways

- `#[allow]`/`#[warn]`/`#[deny]`/`#[forbid]` adjust a specific lint's severity, scoped to whatever item (function, module, crate) they're attached to.
- `#![...]` (with a `!`) at the top of a file applies crate-wide or module-wide; `#[...]` (without `!`) applies to the specific following item.
- `deny` turns a lint into a hard compile error that **can** be locally overridden by a nested `allow`; `forbid` does the same but **cannot** be overridden anywhere downstream.
- Use `#[allow(dead_code)]` and similar sparingly and deliberately — treat lint warnings as a signal worth investigating, not noise to silence by default.
