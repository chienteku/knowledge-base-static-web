# Reborrowing & Two-Phase Borrows

> **Level 3 — Ownership & Borrowing**
> The implicit `&mut *r` that lets a `&mut` reference be passed to a function and used again afterward, plus the relaxation that allows `vec.push(vec.len())`.

---

## 1. Prerequisites

- [Mutable Borrowing (`&mut`)](../level_03/mutable_borrowing.md) — The exclusivity rule reborrowing and two-phase borrows both interact with.
- [Non-Lexical Lifetimes (NLL)](../level_05/non_lexical_lifetimes.md) — A closely related borrow-checker precision improvement from the same era.
- [Method](../level_02/method.md) — The call-site shape (`vec.push(...)`) where two-phase borrows matter most.

---

## 2. Term Category

**Borrow-Checker Refinements (the "obviously fine" exceptions)**: `&mut T` is supposed to be *exclusive* — only one can exist at a time. Taken completely literally, this rule would reject a surprising amount of everyday, clearly-safe code. Reborrowing and two-phase borrows are two specific, compiler-recognized exceptions that make the exclusivity rule work the way you'd intuitively expect, without weakening the underlying safety guarantee.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

**Reborrowing** solves this problem: if you have `r: &mut T` and pass `r` to a function expecting `&mut T`, doesn't that *move* `r`, making it unusable afterward (since `&mut` isn't `Copy`)? In practice, the compiler instead implicitly creates a **temporary, shorter-lived borrow** *of* `*r` — a "reborrow" — for the duration of that function call, and hands `r` itself back to you afterward, fully usable again. Without this, you'd have to explicitly write `&mut *r` everywhere, or structure code around never reusing a `&mut` reference after passing it anywhere.

**Two-phase borrows** solve a narrower, related problem: `vec.push(vec.len())` looks like it should conflict — `vec.push(...)` needs `&mut vec`, but `vec.len()` (evaluated as an argument) needs `&vec` "at the same time." The compiler recognizes that a mutable borrow used for a method call actually has two phases: it's first only *reserved* (during argument evaluation, other shared borrows are still fine), and only becomes fully *active* (exclusive) once the call itself actually happens — after all arguments, including `vec.len()`, have already been evaluated and no longer need to read `vec`.

### (2) Reality Metaphor

**Reborrowing**: Imagine lending your house key to a contractor for the afternoon so they can do specific work, with an explicit agreement that they hand the key back to you the moment they're done — you don't lose ownership of the key permanently just because someone else briefly held it.

**Two-phase borrows**: Imagine reserving a conference room ("I intend to use this room exclusively soon") while you're still in the hallway checking your notes (**reading `vec.len()`**) — the room is provisionally claimed, but not yet *locked and in exclusive use*, so someone briefly glancing through the door window (**a shared read**) during your hallway prep doesn't cause a conflict. Only once you actually step inside and shut the door (**the call itself executes**) does the room become truly exclusive.

### (3) Rust Code Examples

#### Short Snippet (Reborrowing in Action)
```rust
fn add_one(x: &mut i32) {
    *x += 1;
}

fn main() {
    let mut value = 5;
    let r: &mut i32 = &mut value;

    add_one(r); // Implicitly reborrows `*r` for the duration of this call.
    add_one(r); // `r` is STILL usable here — it wasn't moved/consumed by the first call!

    println!("{value}"); // 7
}
```

#### Fuller Example (Two-Phase Borrows, `vec.push(vec.len())`)
```rust
fn main() {
    let mut numbers = vec![10, 20, 30];

    // This looks like it should conflict: `.push()` needs `&mut numbers`,
    // but `.len()` (an argument) needs `&numbers` at "the same time."
    // Two-phase borrows make this legal: the &mut is only RESERVED during
    // argument evaluation, and only becomes ACTIVE once push() itself runs
    // (by which point .len() has already finished reading).
    numbers.push(numbers.len());

    println!("{numbers:?}"); // [10, 20, 30, 3]
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Reborrowing Scoping and Lifecycle Rules

**The mistake:** Assuming Reborrowing instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("reborrowing_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("reborrowing_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Reborrowing State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Reborrowing through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Reborrowing Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Reborrowing instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Explain Without Two-Phase Borrows

**Problem:** Before two-phase borrows were introduced, `numbers.push(numbers.len())` did **not** compile. Explain why, using the *literal* (non-two-phase) reading of the exclusivity rule.

> [!check]- Answer
> Under a strict, literal reading, `numbers.push(...)` desugars to something like `Vec::push(&mut numbers, numbers.len())`. Rust evaluates the receiver's `&mut numbers` borrow *before* evaluating the arguments, and under the old model that mutable borrow was considered **immediately active** the moment it was taken — meaning `numbers.len()` (which needs `&numbers`, a shared borrow) would then conflict with the already-active exclusive `&mut numbers`, even though the mutation hadn't actually happened yet. Two-phase borrows fix this specifically by splitting the mutable borrow into a *reserved* phase (compatible with concurrent shared reads) and an *active* phase (starting only once the call itself executes).

---

### Exercise 2: Explicit Deref Reborrowing in Functions

**Problem:** Pass `&mut *ref_val` into a helper function and demonstrate using `ref_val` again after the function completes.

**Expected output:**
> [!check]- Answer
> ```
> Final value: 30
> ```
> ```rust
> fn add_five(x: &mut i32) { *x += 5; }
> fn main() {
>     let mut val = 20;
>     let r = &mut val;
>     add_five(&mut *r); // Reborrow
>     *r += 5;
>     println!("Final value: {}", *r);
> }
> ```
>
> **Explanation:** Reborrowing `&mut *r` suspends `r` temporarily, allowing inner function calls without moving ownership of `r`.

---

### Exercise 3: Implicit Reborrowing on Method Calls

**Problem:** Call a `&mut self` method twice on a mutable reference `&mut Struct`.

**Expected output:**
> [!check]- Answer
> ```
> Count: 2
> ```
> ```rust
> struct Counter(u32);
> impl Counter { fn bump(&mut self) { self.0 += 1; } }
> fn main() {
>     let mut c = Counter(0);
>     let r = &mut c;
>     r.bump(); // Implicit reborrow
>     r.bump();
>     println!("Count: {}", r.0);
> }
> ```
>
> **Explanation:** Calling `&mut self` methods on mutable references automatically performs implicit reborrowing.

---

## 6. Related Terms

- [Mutable Borrowing (`&mut`)](../level_03/mutable_borrowing.md) — The exclusivity rule both of these features carefully refine without weakening.
- [Non-Lexical Lifetimes (NLL)](../level_05/non_lexical_lifetimes.md) — A sibling borrow-checker precision improvement from the same 2018-edition era.
- [Method](../level_02/method.md) — The `receiver.method(args)` call shape where two-phase borrows specifically apply.

---

## 7. Key Takeaways

- **Reborrowing** implicitly creates a temporary, shorter-lived borrow when a `&mut` reference is passed somewhere, so the original reference remains usable afterward — without this, `&mut` references would behave as if consumed on first use.
- **Two-phase borrows** split a mutable borrow taken for a method call into a *reserved* phase (during argument evaluation, compatible with shared reads) and an *active* phase (only once the call itself runs) — this is exactly what makes `vec.push(vec.len())` compile.
- Neither feature weakens Rust's core aliasing guarantees; both are precision improvements that make the borrow checker match programmer intuition more closely.
- Both were part of the broader borrow-checker overhaul (alongside NLL) that shipped around the 2018 edition.
