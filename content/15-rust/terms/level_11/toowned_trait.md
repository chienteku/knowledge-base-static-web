# `ToOwned` Trait

> **Level 11 — Smart Pointers & Advanced Types**
> Generalizes `Clone` to produce an owned value *from a borrow*, even when the borrowed and owned types differ — the trait bound that makes `Cow` work.

---

## 1. Prerequisites

- [`Clone` Trait](../level_03/clone_trait.md) — The narrower trait this one generalizes.
- [`Cow<'a, T>`](../level_11/cow_t.md) — The type whose entire design depends on this trait.
- [`String` vs `&str`](../level_01/string_vs_&str.md) — The canonical example of borrowed/owned types that differ.

---

## 2. Term Category

**Standard Library Trait (the borrow-to-owned bridge)**: `Clone` requires the source and result to be the **same type** (`T -> T`). `ToOwned` relaxes this: it lets a *borrowed* type produce a *different, owned* type (`&str -> String`, `&[T] -> Vec<T>`). This small generalization is exactly what's needed to make `Cow<'_, T>` possible.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

`Clone::clone(&self) -> Self` is perfect when duplicating a `String` into another `String`, or an `i32` into another `i32` — the input and output are the same type. But consider `str`: you can't `.clone()` a `&str` into an owned `str`, because `str` is a Dynamically Sized Type that can't exist as an owned, stack-allocated value at all — the *owned equivalent* of borrowed `str` data is a completely different type, `String`. `ToOwned` exists precisely to express this relationship generically: `ToOwned::to_owned(&self) -> Self::Owned`, where `Self::Owned` can be a distinct associated type. Every type that implements `Clone` gets a blanket `ToOwned` implementation for free (with `Owned = Self`), so `ToOwned` is a strict generalization, not a competing trait — and it's specifically the trait bound `Cow<'a, T>` requires on its `Borrowed` type, since `Cow` needs to be able to turn its borrowed variant into an owned one on demand.

### (2) Reality Metaphor

Imagine a print shop that can duplicate documents, but sometimes the "duplicate" has to be a fundamentally different physical format than the original.

- **`Clone`**: You hand over a photograph, and the shop hands back an identical photograph — same medium, same format, just a second physical copy.
- **`ToOwned`**: You hand over a **negative** (the borrowed, lightweight form — like `&str`), and the shop doesn't hand you back another negative. It develops the negative into a full, physical, standalone photograph (**the owned form**, `String`) — a different kind of object entirely, but unmistakably derived from and equivalent in content to what you handed in.

### (3) Rust Code Examples

#### Short Snippet (Borrowed → Owned, Different Types)
```rust
fn main() {
    let borrowed: &str = "hello";
    let owned: String = borrowed.to_owned(); // &str -> String: DIFFERENT types!

    let slice: &[i32] = &[1, 2, 3];
    let vec: Vec<i32> = slice.to_owned(); // &[i32] -> Vec<i32>: also different types!

    println!("{owned} {vec:?}");
}
```

#### Fuller Example (Why `Cow` Requires `ToOwned`, Not `Clone`)
```rust
use std::borrow::Cow;

// Cow<'a, str> needs to be able to produce a String (the OWNED form of str)
// when it needs to mutate — `Clone` couldn't express this, since `str` can't
// "clone" into another `str` (it's unsized!). It specifically needs ToOwned.
fn ensure_trailing_slash(input: &str) -> Cow<'_, str> {
    if input.ends_with('/') {
        Cow::Borrowed(input) // No allocation — we just borrow the original.
    } else {
        // .to_owned() here is ToOwned::to_owned, producing a fresh String.
        Cow::Owned(format!("{input}/"))
    }
}

fn main() {
    println!("{}", ensure_trailing_slash("/already/slashed/")); // no allocation
    println!("{}", ensure_trailing_slash("/needs/one"));        // allocates a String
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Toowned Trait Scoping and Lifecycle Rules

**The mistake:** Assuming Toowned Trait instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("toowned_trait_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("toowned_trait_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Toowned Trait State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Toowned Trait through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Toowned Trait Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Toowned Trait instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Why Won't This Compile?

**Problem:** Explain why `let s: str = "hello".clone();` fails to compile, and what the corrected line using `ToOwned` looks like.

> [!check]- Answer
> `str` is a Dynamically Sized Type — it has no fixed compile-time size, so it's impossible to hold one directly in a stack variable, let alone have `Clone::clone(&self) -> Self` return one by value. The corrected version uses `ToOwned`, whose associated `Owned` type is `String`, not `str`:
>
> ```rust
> let s: String = "hello".to_owned();
> ```

---

### Exercise 2: Converting String Slices to Owned Strings with `ToOwned`

**Problem:** Convert `&str` slice `"rust"` into owned `String` using `.to_owned()`.

**Expected output:**
> [!check]- Answer
> ```
> Owned text: rust
> ```
> ```rust
> fn main() {
>     let slice: &str = "rust";
>     let owned: String = slice.to_owned();
>     println!("Owned text: {}", owned);
> }
> ```
>
> **Explanation:** `ToOwned` generalizes `.clone()` to clone borrowed slice data into owned buffer types.

---

### Exercise 3: Converting Array Slices to Owned Vectors

**Problem:** Convert a slice `&[1, 2, 3]` into an owned `Vec<i32>` using `.to_owned()`.

**Expected output:**
> [!check]- Answer
> ```
> Owned vec: [1, 2, 3]
> ```
> ```rust
> fn main() {
>     let slice: &[i32] = &[1, 2, 3];
>     let owned: Vec<i32> = slice.to_owned();
>     println!("Owned vec: {:?}", owned);
> }
> ```
>
> **Explanation:** `ToOwned` creates owned `Vec<T>` instances from slice references `&[T]`.

---

## 6. Related Terms

- [`Clone` Trait](../level_03/clone_trait.md) — The same-type duplication trait `ToOwned` generalizes; every `Clone` type gets `ToOwned` for free.
- [`Cow<'a, T>`](../level_11/cow_t.md) — The primary consumer of this trait; `Cow::Owned` variant's type is exactly `<T as ToOwned>::Owned`.
- [`Borrow` / `BorrowMut`](../level_14/borrow_trait.md) — A conceptually related trait for the reverse direction (owned-to-borrowed lookups), often mentioned alongside `ToOwned`.
- [Dynamically Sized Types (DSTs)](../level_11/dynamically_sized_types.md) — The reason `str`/`[T]` need `ToOwned` instead of `Clone` in the first place.

---

## 7. Key Takeaways

- `ToOwned::to_owned(&self) -> Self::Owned` generalizes `Clone` by allowing the owned result to be a **different type** than the borrowed source.
- Every `Clone` type automatically implements `ToOwned` too (via a blanket impl with `Owned = Self`) — `ToOwned` is a strict superset of capability.
- `str` and `[T]` (unsized DSTs) can only implement `ToOwned` (→ `String`/`Vec<T>`), never `Clone`, since `Clone` would require returning an unsized `Self` by value.
- `Cow<'a, T>` specifically requires `T: ToOwned`, not `T: Clone`, precisely so it can wrap DSTs like `str`.
