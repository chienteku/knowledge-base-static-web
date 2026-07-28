# Higher-Ranked Trait Bounds (HRTB)

> **Level 5 — Lifetimes**
> The `for<'a>` syntax specifying that a trait bound or closure must hold for *all* possible lifetimes.

---

## 1. Prerequisites

- [Trait Bound](../level_04/trait_bound.md) — Constraining generic types.
- [Lifetime (`'a`)](../level_05/lifetime.md) — Reference validity annotations.
- [Closure (`Fn`)](../level_06/closure.md) — Closures that take references as parameters.

---

## 2. Term Category

**Rust-specific (universal quantification for lifetimes)**: Higher-Ranked Trait Bounds (HRTB) use the **`for<'a>`** keyword syntax. They allow you to express a bound that must be satisfied **for *any* lifetime `'a`**, rather than for a single, specific lifetime `'a` chosen by the caller. HRTBs are most commonly encountered when writing generic functions that accept closures that borrow arguments.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Consider a function `call_with_ref` that takes a closure `f` and calls `f` with a reference to a locally created variable:

```rust
fn call_with_ref<F>(f: F)
where
    F: Fn(&i32), // What is the lifetime of &i32 here?
{
    let val = 42;
    f(&val); // &val only lives inside `call_with_ref`!
}
```

If we try to write the trait bound with a standard lifetime parameter `'a`:

```rust
// WRONG: 'a is chosen by the CALLER outside call_with_ref
fn call_with_ref<'a, F>(f: F) where F: Fn(&'a i32)
```

This fails! The caller chooses `'a` *before* `call_with_ref` is called. But `val` is created *inside* `call_with_ref`, so its lifetime is shorter than any caller-chosen `'a`!

We need a way to say: *"The closure `F` must accept a reference of **ANY** arbitrary lifetime `'a` created inside this function."*

That is higher-ranked trait bounds syntax: **`for<'a> F: Fn(&'a i32)`**.

### (2) Reality Metaphor

- **Standard Generic Lifetime (`'a`):** A lock with a single specific key. The caller brings key `'a` from home, and the function must fit that specific key.
- **Higher-Ranked Trait Bound (`for<'a>`):** A master key cutter. The function says: *"I will hand you keys with completely random, unpredictable lifetimes `'a` generated on the fly. Your closure must be able to open the door for **every single key** I hand you."*

### (3) Rust Code Examples

#### Short Snippet (`for<'a>` Syntax)
```rust
// F must be callable with a reference of ANY lifetime 'a
fn execute_closure<F>(f: F)
where
    for<'a> F: Fn(&'a str) -> usize,
{
    let s = String::from("hello");
    let len = f(&s);
    println!("Length: {len}");
}
```

#### Practical Example (HRTB with Closures)
In practice, Rust's closure trait bounds (`Fn(&str)`) automatically expand to `for<'a> Fn(&'a str)` via Lifetime Elision! So you rarely have to type `for<'a>` manually unless you are writing complex generic trait bounds.

```rust
fn apply_to_temp_str<F>(f: F)
where
    for<'a> F: Fn(&'a str) -> String,
{
    let temp = String::from("temporary buffer");
    let result = f(&temp);
    println!("Result: {result}");
}

fn main() {
    // The closure accepts &str of ANY lifetime
    apply_to_temp_str(|s| s.to_uppercase());
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Higher Ranked Trait Bounds Scoping and Lifecycle Rules

**The mistake:** Assuming Higher Ranked Trait Bounds instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("higher_ranked_trait_bounds_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("higher_ranked_trait_bounds_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Higher Ranked Trait Bounds State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Higher Ranked Trait Bounds through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Higher Ranked Trait Bounds Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Higher Ranked Trait Bounds instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Read the HRTB Syntax

**What does `where T: for<'a> Trait<'a>` express in English?**

> [!check]- Answer
> It means: *"Type `T` implements `Trait<'a>` for **every possible lifetime** `'a`."*

---

### Exercise 2: HRTB Closure Parameter Contracts

**Problem:** Write a function `fn apply_to_str<F>(f: F) where F: for<'a> Fn(&'a str) -> usize` that calls `f` on local string slices.

**Expected output:**
> [!check]- Answer
> ```
> Len: 5
> ```
> ```rust
> fn apply_to_str<F>(f: F) where F: for<'a> Fn(&'a str) -> usize {
>     let s = String::from("hello");
>     println!("Len: {}", f(&s));
> }
> fn main() {
>     apply_to_str(|s| s.len());
> }
> ```
>
> **Explanation:** `for<'a>` higher-ranked trait bounds ensure closures can borrow temporary local stack slices.

---

### Exercise 3: Higher-Ranked Trait Bounds on Function Pointers

**Problem:** Accept a function pointer with higher-ranked lifetime: `for<'a> fn(&'a i32) -> i32`.

**Expected output:**
> [!check]- Answer
> ```
> Value: 42
> ```
> fn deref_val(x: &i32) -> i32 { *x }
> fn exec(f: for<'a> fn(&'a i32) -> i32) {
>     let val = 42;
>     println!("Value: {}", f(&val));
> }
> fn main() { exec(deref_val); }
> ```
>
> **Explanation:** `for<'a>` syntax works with function pointers operating over generic reference lifetimes.

---

## 6. Related Terms

- [Lifetime (`'a`)](../level_05/lifetime.md) — The reference lifetime parameter.
- [Trait Bound](../level_04/trait_bound.md) — Generic constraints.
- [Closure (`Fn`)](../level_06/closure.md) — Functional argument types where HRTB is most useful.

---

## 7. Key Takeaways

- `for<'a>` means "for all lifetimes `'a`" (universal quantification).
- HRTB allows functions to accept closures that operate on locally created, short-lived references.
- Normal closure bounds like `Fn(&str)` automatically expand to `for<'a> Fn(&'a str)` through lifetime elision.
- Essential for advanced generic programming and closure trait bounds.
