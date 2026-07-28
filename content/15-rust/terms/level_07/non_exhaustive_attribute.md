# `#[non_exhaustive]`

> **Level 7 — Modules, Visibility & Project Structure**
> Marks a struct/enum so downstream crates cannot exhaustively match or construct it — preserving your freedom to add fields/variants later without a breaking change.

---

## 1. Prerequisites

- [Enum](../level_02/enum.md) / [Struct](../level_02/struct.md) — What this attribute is applied to.
- [`match`](../level_02/match.md) — Whose exhaustiveness checking this attribute specifically restricts for external crates.
- [`pub` Visibility](../level_07/pub_visibility.md) — The public-API concern this attribute is designed to protect.
- [Edition](../level_07/edition.md) — The versioning context this attribute's SemVer guarantees operate within.

---

## 2. Term Category

**API-Evolution Attribute (the "more variants may come" promise)**: By default, a public enum with 3 variants is a firm promise: "there will always be exactly these 3 variants, forever, or it's a breaking change." `#[non_exhaustive]` softens that promise deliberately, explicitly telling downstream users "expect more variants/fields to appear in future versions — don't write code that assumes today's list is final."

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Rust's `match` exhaustiveness checking is a wonderful safety feature *within* a single crate — if you add a new enum variant, every `match` on it across your own codebase fails to compile until you handle the new case, guaranteeing you never forget one. But this becomes a liability across crate boundaries: if a library's public enum is matched exhaustively by downstream code, adding **any** new variant to that enum — even a genuinely new, unrelated feature — breaks every single downstream crate's build. This makes evolving public enums (and structs, for adding fields) effectively impossible without a major version bump, even for additions that shouldn't logically be "breaking." `#[non_exhaustive]` fixes this: it forces external crates to include a wildcard `_` arm in every `match`, and forbids them from directly constructing the type with struct-literal syntax (forcing a constructor function instead) — both restrictions exist specifically so the library author retains room to add new variants/fields later without it counting as a breaking change for anyone who respected the attribute's warning.

### (2) Reality Metaphor

Imagine a restaurant's printed menu that explicitly states, in bold letters at the top: "Additional seasonal items may be added at any time without notice."

- **A normal (exhaustive) menu**: If a customer's order form has a checkbox for every single item currently on the menu, and the restaurant later adds a new dish, every customer's old order form is suddenly "incomplete" — a real problem if the form was supposed to be a complete, final checklist.
- **`#[non_exhaustive]` (the seasonal-items warning)**: Customers are explicitly told upfront to always include a "something else, ask your server" catch-all option on their order form. When the restaurant adds a new seasonal dish later, every customer's form still technically works — the catch-all option gracefully absorbs it, exactly as everyone was warned it might need to.

### (3) Rust Code Examples

#### Short Snippet (Forcing a Wildcard Arm)
```rust
// Inside a LIBRARY crate:
#[non_exhaustive]
pub enum Event {
    Click,
    KeyPress(char),
}

// Inside a DOWNSTREAM crate using this library:
fn handle(event: Event) {
    match event {
        Event::Click => println!("clicked"),
        Event::KeyPress(c) => println!("key: {c}"),
        // The `_` arm below is MANDATORY here, specifically because Event is non_exhaustive!
        // Without it: "non-exhaustive patterns: `_` not covered" — even though today,
        // Click and KeyPress genuinely ARE the only two variants that exist.
        _ => println!("unknown future event"),
    }
}
```

#### Fuller Example (Forcing Construction Through a Function)
```rust
// Inside a LIBRARY crate:
#[non_exhaustive]
pub struct Config {
    pub timeout_ms: u32,
    pub retries: u8,
}

impl Config {
    pub fn new(timeout_ms: u32, retries: u8) -> Self {
        Config { timeout_ms, retries }
    }
}

// Inside a DOWNSTREAM crate:
fn main() {
    // let c = Config { timeout_ms: 100, retries: 3 }; // COMPILE ERROR: struct literal
    //   syntax forbidden for non_exhaustive structs from OUTSIDE their defining crate!
    let c = library::Config::new(100, 3); // Must go through the provided constructor.
    println!("{}", c.timeout_ms); // Reading existing PUBLIC fields is still fine.
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Non Exhaustive Attribute Scoping and Lifecycle Rules

**The mistake:** Assuming Non Exhaustive Attribute instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("non_exhaustive_attribute_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("non_exhaustive_attribute_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Non Exhaustive Attribute State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Non Exhaustive Attribute through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Non Exhaustive Attribute Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Non Exhaustive Attribute instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Predict the Breaking-Change Impact

**Problem:** A library has `pub enum Status { Active, Inactive }` (no `#[non_exhaustive]`), used with exhaustive `match` statements by many downstream crates. The library wants to add a `Status::Pending` variant in its next release. Is this a breaking change? What if `#[non_exhaustive]` had been applied from the start?

> [!check]- Answer
> **Without `#[non_exhaustive]`**: Yes, this **is** a breaking change. Every downstream crate that exhaustively matched on `Status` (without a `_` arm, since none was needed before) will fail to compile the moment they upgrade, because their `match` is no longer exhaustive against the new three-variant enum.
>
> **With `#[non_exhaustive]` applied from the start**: No breaking change. Every downstream crate would have been *forced*, all along, to include a `_` wildcard arm (since the compiler wouldn't have let them omit it). Adding `Pending` simply means that wildcard arm now also (correctly) catches the new variant, with zero code changes required downstream.

---

### Exercise 2: Exhaustive Match Handling for Non-Exhaustive Enums

**Problem:** Match an external `#[non_exhaustive] enum Status { Active, Inactive }` using `_ => ...` wildcard fallback.

**Expected output:**
> [!check]- Answer
> ```
> Matched active
> ```
> ```rust
> #[non_exhaustive]
> enum Status { Active, Inactive }
> fn main() {
>     let s = Status::Active;
>     match s {
>         Status::Active => println!("Matched active"),
>         _ => println!("Other"),
>     }
> }
> ```
>
> **Explanation:** `#[non_exhaustive]` enforces wildcard `_` fallback arms outside the defining crate.

---

### Exercise 3: Non-Exhaustive Struct Field Construction Constraints

**Problem:** Explain why `#[non_exhaustive] struct Config { pub host: String }` cannot be constructed directly using struct literals outside its defining crate.

**Expected output:**
> [!check]- Answer
> ```
> Construct via constructor method required
> ```
> ```rust
> fn main() { 
>     println!("Construct via constructor method required");
> }
> ```
>
> **Explanation:** `#[non_exhaustive]` structs force external crates to use constructor methods instead of direct literal initialization.

---

## 6. Related Terms

- [Enum](../level_02/enum.md) / [Struct](../level_02/struct.md) — The two item kinds this attribute applies to.
- [`match`](../level_02/match.md) — Whose exhaustiveness-checking behavior this attribute specifically alters for external crates.
- [Edition](../level_07/edition.md) — The broader SemVer/compatibility context this attribute is one tool within.
- [`#[must_use]`](../level_07/must_use_attribute.md) — A sibling API-design attribute, though focused on a different concern (unused values, not exhaustiveness).

---

## 7. Key Takeaways

- `#[non_exhaustive]` forces downstream crates to include a wildcard `_` arm in any `match` on the type, and to construct it only through a provided function, not a struct literal.
- It exists purely as a public-API evolution tool: it lets a library author add new variants/fields later without that addition counting as a semver-breaking change.
- The restrictions apply **only** to code outside the defining crate — the crate itself still sees and enforces the type's exact, complete definition.
- It's the standard way to signal "this list is not guaranteed final" on any public enum or struct meant to be extended over time.
