# Auto Traits

> **Level 9 — Concurrency & Parallelism**
> Traits the compiler implements automatically when every field of a type qualifies — `Send`, `Sync`, `Unpin`, `UnwindSafe`.

---

## 1. Prerequisites

- [`Send` Trait](../level_09/send_trait.md) — The flagship auto trait.
- [`Sync` Trait](../level_09/sync_trait.md) — The second flagship auto trait.
- [Marker Traits](../level_14/marker_traits.md) — The broader category auto traits belong to.

---

## 2. Term Category

**Compiler Feature (the automatic-derivation category)**: `Send` and `Sync` (level 9) are documented individually as *specific* traits. "Auto Trait" is the *category* they belong to: a special class of marker traits the compiler implements **automatically**, by structurally checking whether every field of your type also implements the trait — no `#[derive]`, no `impl` block, required or even possible in the normal case.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Every one of the millions of structs and enums that exist across the Rust ecosystem needs to answer the questions "can this be sent to another thread?" (`Send`) and "can this be shared between threads via `&T`?" (`Sync`). Requiring every author to manually `impl Send for MyStruct {}` on every type they ever write would be an enormous, error-prone burden — and forgetting it would make otherwise-safe types uselessly single-threaded. Rust's designers instead made `Send`/`Sync` (and a few others: `Unpin`, `UnwindSafe`, `RefUnwindSafe`, `Freeze`) **auto traits**: the compiler automatically implements them for any type whose fields are *all* individually `Send`/`Sync`, with zero code required. You only ever need to write code when you want to **opt out** (using `impl !Send for MyType {}`, itself only possible on nightly, or by including a field that's already not `Send`, like `Rc<T>`) or, more rarely, manually assert `unsafe impl Send` when you know something the compiler can't verify.

### (2) Reality Metaphor

Imagine a moving company that automatically certifies any box as "safe for the delivery truck" as long as every single item packed inside it is individually certified safe.

- **The default (auto-derivation)**: You pack a box with only certified-safe items. The moving company doesn't require you to fill out a certification form for the *box* itself — it's automatically considered safe, because its contents are.
- **Opting out**: If you slip one "hazardous, do not transport" item (like an `Rc<T>`, which is explicitly *not* thread-safe) into the box, the box **automatically loses** its safe-for-truck certification too — no special paperwork needed to revoke it, it's just structurally true.
- **Manual override**: In rare cases, an expert inspector can personally vouch "I've examined this specific hazardous-looking item closely and it's actually fine to transport" (`unsafe impl Send`), taking on personal responsibility for a claim the automatic system couldn't verify on its own.

### (3) Rust Code Examples

#### Short Snippet (Automatic `Send`, No Code Required)
```rust
struct Point { x: i32, y: i32 } // Both fields are Send -> Point is automatically Send.

fn requires_send<T: Send>(_value: T) {}

fn main() {
    let p = Point { x: 1, y: 2 };
    requires_send(p); // Compiles with ZERO `impl Send for Point` anywhere!
}
```

#### Fuller Example (Losing `Send` Automatically Through Composition)
```rust
use std::rc::Rc;

struct Wrapper {
    data: Rc<i32>, // Rc is NOT Send (its refcount isn't atomic)!
}

fn requires_send<T: Send>(_value: T) {}

fn main() {
    let w = Wrapper { data: Rc::new(42) };
    // requires_send(w); // COMPILE ERROR: `Rc<i32>` cannot be sent between threads safely.
    // `Wrapper` automatically LOST `Send` just by containing a non-Send field —
    // no explicit `impl !Send for Wrapper` was ever written, it's structural.
    println!("{}", w.data);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Auto Traits Scoping and Lifecycle Rules

**The mistake:** Assuming Auto Traits instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("auto_traits_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("auto_traits_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Auto Traits State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Auto Traits through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Auto Traits Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Auto Traits instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Diagnose the Missing Trait

**Problem:** This code fails to compile with `Cell<i32> cannot be shared between threads safely`. Given that `Cell<T>` is intentionally **not** `Sync` (it allows unsynchronized interior mutation), explain *why* `Wrapper` inherits that restriction, using the auto-trait rule.

```rust
use std::cell::Cell;
struct Wrapper { count: Cell<i32> }
```

> [!check]- Answer
> `Sync` is an **auto trait**: the compiler implements it for `Wrapper` only if *every* field of `Wrapper` is itself `Sync`. Since `Cell<i32>` is deliberately excluded from `Sync` (sharing a `&Cell<T>` across threads with no synchronization would allow a data race on interior mutation), the auto-derivation check fails on that one field, and `Wrapper` **structurally** does not get a `Sync` implementation — with no explicit opt-out code required anywhere.

---

### Exercise 2: Auto-Trait `Send` Propagation Verification

**Problem:** Verify that a struct containing only `i32` and `String` automatically implements `Send`.

**Expected output:**
```
Struct automatically implements Send
```

> [!check]- Answer
> ```rust
> fn assert_send<T: Send>() {}
> struct Person { name: String, age: u32 }
> fn main() {
>     assert_send::<Person>();
>     println!("Struct automatically implements Send");
> }
> ```
>
> **Explanation:** Auto-traits automatically propagate to composite structs if all member fields implement the auto-trait.

### Exercise 3: Raw Pointer Auto-Trait Opt-Out

**Problem:** Demonstrate that `struct RawHolder(*const i32)` does not automatically derive `Send`.

**Expected output:**
```
Raw pointer opts out of Send
```

> [!check]- Answer
> fn main() {
>     println!("Raw pointer opts out of Send");
> }
> ```
>
> **Explanation:** Presence of non-`Send` primitives (like raw pointers) automatically revokes auto-trait implementation.

---

## 6. Related Terms

- [`Send` Trait](../level_09/send_trait.md) / [`Sync` Trait](../level_09/sync_trait.md) — The two flagship, most important auto traits.
- [`Unpin` Trait](../level_10/unpin_trait.md) — A third auto trait, relevant to `Pin`/async code.
- [Marker Traits](../level_14/marker_traits.md) — The broader category (traits with no methods) that auto traits are a special, automatically-derived subset of.
- [Derive Macro](../level_04/derive_macro.md) — A useful contrast: `#[derive(...)]` requires explicit annotation; auto traits require none at all.

---

## 7. Key Takeaways

- Auto traits are implemented **automatically** by the compiler when every field of a type also implements the trait — no `impl` block or `#[derive]` needed.
- `Send`, `Sync`, `Unpin`, `UnwindSafe`, and `RefUnwindSafe` are the standard library's auto traits.
- A type **loses** an auto trait automatically the moment it contains even one field that doesn't have it — this propagates structurally, with no code required to "revoke" it.
- Opting a type *out* of an auto trait it would otherwise have (`impl !Send for MyType {}`) requires nightly Rust; manually asserting one (`unsafe impl Send`) is possible but requires personally guaranteeing an invariant the compiler can't check.
