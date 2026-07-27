# Lifetime Variance

> **Level 5 — Lifetimes**
> The type-system rules governing how lifetimes relationship in subtyping: covariance, contravariance, and invariance.

---

## 1. Prerequisites

- [Lifetime (`'a`)](../level_05/lifetime.md) — Reference scope annotations.
- [Lifetime Bounds (`'a: 'b`)](../level_05/lifetime_bounds.md) — The outlives relationship (`'a` outlives `'b`).
- [Mutable Borrowing (`&mut`)](../level_03/mutable_borrowing.md) — The primary source of invariance in Rust.

---

## 2. Term Category

**Type-System Rule (subtyping for lifetimes)**: Rust does not have traditional Object-Oriented inheritance, but it **does** have subtyping for lifetimes! If lifetime `'a` outlives `'b` (`'a: 'b`), then `'a` is a subtype of `'b` (`'a <: 'b`). **Variance** describes how substitution of sub-lifetimes affects generic container types (`&'a T`, `&mut 'a T`, `fn(&'a T)`).

---

## 3. Explanation

### (1) The Three Types of Variance

Given `'a: 'b` (lifetime `'a` outlives `'b`, so `'a` is a subtype of `'b`):

1. **Covariance:** If `'a` is a subtype of `'b`, then `F<'a>` is a subtype of `F<'b>`.
   - You can pass a longer-lived reference where a shorter-lived reference is expected.
   - Example: `&'a T` is **covariant** over `'a` and `T`. (`&'static str` can be passed to a function expecting `&'a str`).
2. **Invariance:** `F<'a>` and `F<'b>` have no subtype relationship, regardless of whether `'a: 'b`.
   - You can ONLY pass an exact lifetime match.
   - Example: `&mut 'a T` is **invariant** over `T`! (`&mut &'static str` CANNOT be passed where `&mut &'a str` is expected).
3. **Contravariance:** If `'a` is a subtype of `'b`, then `F<'b>` is a subtype of `F<'a>` (reverses the relationship).
   - Occurs in function argument types: `fn(&'a T)`.

### (2) Design Motivation — "Why is `&mut T` Invariant?"

Why can't we pass `&mut &'static str` into a function expecting `&mut &'a str`?

Consider this catastrophic memory leak without invariance:

```rust
// Suppose &mut T were covariant over T (Hypothetical dangerous Rust)
fn overwrite_with_local<'a>(r: &mut &'a str) {
    let local_string = String::from("short");
    *r = &local_string; // Overwrites the reference with a short-lived reference!
} // local_string is freed here!

fn main() {
    let mut static_ref: &'static str = "hello";
    // If &mut T were covariant, we could pass &mut static_ref into overwrite_with_local!
    // After the call, static_ref would point to FREED STACK MEMORY!
}
```

Because `&mut T` allows writing *into* the reference, allowing a shorter lifetime to be written into a location expecting a longer lifetime (`'static`) would create a dangling pointer! Therefore, **mutable references `&mut T` MUST be invariant over `T`.**

### (3) Summary Variance Table

| Type / Constructor | Variance over `'a` | Variance over `T` |
|---|---|---|
| `&'a T` | Covariant | Covariant |
| `&'a mut T` | Covariant | **Invariant** |
| `Box<T>` / `Vec<T>` | — | Covariant |
| `Cell<T>` / `RefCell<T>` | — | **Invariant** |
| `fn(T) -> U` | — | `T` is **Contravariant**, `U` is Covariant |

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Lifetime Variance Scoping and Lifecycle Rules

**The mistake:** Assuming Lifetime Variance instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("lifetime_variance_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("lifetime_variance_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Lifetime Variance State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Lifetime Variance through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Lifetime Variance Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Lifetime Variance instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Test Covariance Understanding

**Can a `&'static str` be assigned to a variable of type `&'a str` (where `'a` is a short scope)?**

> [!check]- Answer
> **Yes!** Shared references `&'a T` are **covariant** over `'a`. Because `'static` outlives `'a`, a long-lived reference can always be used where a shorter-lived reference is requested.

---

### Exercise 2: Covariance on Immutable References

**Problem:** Demonstrate that `&'static str` can be passed to a function expecting `&'a str` due to covariance.

**Expected output:**
```
Covariant slice accepted
```

> [!check]- Answer
> ```rust
> fn print_slice<'a>(s: &'a str) {
>     println!("Covariant slice accepted: {}", s);
> }
> fn main() {
>     let static_str: &'static str = "static data";
>     print_slice(static_str);
> }
> ```
>
> **Explanation:** Immutable references `&'a T` are covariant over `'a`, allowing longer lifetimes (`'static`) to substitute for shorter requested lifetimes (`'a`).

### Exercise 3: Invariance of Mutable References

**Problem:** Explain why `&mut T` is invariant over `T` to prevent storing short-lived references in long-lived locations.

**Expected output:**
```
Invariance prevents invalid reference assignment
```

> [!check]- Answer
> ```rust
> fn main() {
>     println!("Invariance prevents invalid reference assignment");
> }
> ```
>
> **Explanation:** Invariance enforces exact type matching on `&mut T` so callers cannot overwrite long-lived reference targets with short-lived data.

---

## 6. Related Terms

- [Lifetime (`'a`)](../level_05/lifetime.md) — Reference scope annotations.
- [Mutable Borrowing (`&mut`)](../level_03/mutable_borrowing.md) — The trigger for invariance.
- [`Cell<T>` / `RefCell<T>`](../level_03/refcell_t.md) — Interior mutability types that are invariant over `T`.

---

## 7. Key Takeaways

- **Covariance:** Can substitute longer lifetimes for shorter ones (`&'a T`).
- **Invariance:** Must match exact lifetimes (`&mut T`, `Cell<T>`).
- Invariance prevents writing short-lived data into long-lived references, preventing dangling pointers.
- Function arguments `fn(T)` are **contravariant** over `T`.
