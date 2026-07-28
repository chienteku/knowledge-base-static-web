# `Unpin` Trait

> **Level 10 — Async / Await**
> Marker trait indicating a type can be safely moved after pinning.

---

## 1. Prerequisites

- [`Pin<T>`](../level_10/pin_t.md) — The memory lock that `Unpin` explicitly bypasses.
- [Marker Traits](../level_14/marker_traits.md) — Traits with no methods that just prove a mathematical fact to the compiler.
- [Move Semantics](../level_03/move_semantics.md) — The default behavior of Rust that `Unpin` says is safe to do.

---

## 2. Term Category

**Rust-specific (the auto-trait)**: If `Pin` is the heavy iron padlock that permanently glues a variable to its memory address, **`Unpin`** is the master key that completely ignores the padlock. 

It is an "auto-trait" (just like `Send` or `Sync`) that the compiler automatically slaps onto almost every single type in the Rust language.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The Rust designers introduced `Pin` to solve the catastrophic memory corruption caused by `async fn` Futures (which contain self-referential pointers). 

But they realized a massive problem: if the Executor requires `Pin` to run a `Future`, does that mean developers have to start wrapping every single variable in their program in a `Pin`? Do I have to pin a `String` or an `i32` before I can use it inside an async function?

The solution was the `Unpin` auto-trait. The compiler basically says: 
> *"If a type does NOT contain self-references, it is perfectly safe to move around. I will automatically give it the `Unpin` trait."*

If a type implements `Unpin`, wrapping it in a `Pin` does absolutely nothing. The compiler lets you move it anyway! The **ONLY** things that do *not* implement `Unpin` are the auto-generated `Futures` from `async fn`.

### (2) Reality Metaphor

Imagine `Pin` is a massive, heavy metal "boot" that the police attach to a car tire to prevent the car from moving.

- **`!Unpin` (An async Future)**: This is a normal physical car. The police attach the metal boot to the tire (`Pin`). The car is now permanently pinned to that parking spot. It cannot move.
- **`Unpin` (A normal `String`)**: This is a ghost car. It doesn't have physical tires. If the police attach a metal boot to a ghost car (`Pin<String>`), the ghost car can just phase straight through the metal boot and drive away anyway! The boot has zero effect on it.

### (3) Rust Code Examples

#### Short Snippet (The Trait)
`Unpin` is a marker trait, meaning it has zero methods. It exists purely to satisfy compiler bounds. 

```rust
// The actual definition in the standard library
pub auto trait Unpin {}
```

#### Fuller Example (Phasing through the Boot)
Let's see the ghost car in action. If we wrap a `String` in a `Pin`, the compiler will just let us extract the mutable reference and move the memory anyway, because `String` implements `Unpin`!

```rust
use std::pin::Pin;

fn main() {
    let mut my_string = String::from("Hello");
    
    // We put the metal boot on the String!
    let mut pinned_string: Pin<&mut String> = Pin::new(&mut my_string);
    
    // Because String implements Unpin, the `Pin::new` function exists!
    // We can phase right through the boot and extract a mutable reference:
    let extracted_ref: &mut String = pinned_string.get_mut();
    
    // We can now move the memory, mutate it, swap it, whatever!
    *extracted_ref = String::from("World");
    println!("{}", my_string); // Prints "World"
}
```
However, if you tried to call `Pin::new(&mut my_future)`, the compiler would throw an angry error! `Pin::new` explicitly requires the inner type to implement `Unpin`. To pin a Future, you must use unsafe code or macros like `tokio::pin!` which *don't* require `Unpin`.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Unpin Trait Scoping and Lifecycle Rules

**The mistake:** Assuming Unpin Trait instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("unpin_trait_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("unpin_trait_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Unpin Trait State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Unpin Trait through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Unpin Trait Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Unpin Trait instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Sorting Hat

**Problem:** Sort the following types into two categories: "Implements Unpin" and "Does NOT implement Unpin" (!Unpin).

1. `i32`
2. `String`
3. `Vec<f64>`
4. The return value of `async fn do_work() {}`
5. `HashMap<String, i32>`

> [!check]- Answer
> **Implements Unpin (Ghost Cars):**
> 1. `i32`
> 2. `String`
> 3. `Vec<f64>`
> 5. `HashMap<String, i32>`
>
> **Does NOT implement Unpin (Physical Cars):**
> 4. The return value of `async fn do_work() {}` (Because it generates a self-referential State Machine!)

---

### Exercise 2: Opting Out of `Unpin` with `PhantomPinned`

**Problem:** Create a self-referential struct containing `_pin: PhantomPinned` to make it `!Unpin`.

**Expected output:**
> [!check]- Answer
> ```
> Struct is !Unpin
> ```
> ```rust
> use std::marker::PhantomPinned;
> struct Unmovable {
>     val: i32,
>     _pin: PhantomPinned,
> }
> fn main() {
>     println!("Struct is !Unpin");
> }
> ```
>
> **Explanation:** `PhantomPinned` marker fields remove automatic `Unpin` implementations from structs.

---

### Exercise 3: Safe Deref Mutability for `Unpin` Types

**Problem:** Move values out of `Pin<&mut T>` when `T: Unpin` using `Pin::into_inner`.

**Expected output:**
> [!check]- Answer
> ```
> Extracted Unpin value: 42
> ```
> use std::pin::Pin;
> fn main() {
>     let mut val = 42;
>     let pinned = Pin::new(&mut val);
>     println!("Extracted Unpin value: {}", *pinned);
> }
> ```
>
> **Explanation:** Types implementing `Unpin` can be unpinned and moved safely.

---

## 6. Related Terms

- [`Pin<T>`](../level_10/pin_t.md) — The wrapper that `Unpin` bypasses.
- [`Send` Trait](../level_09/send_trait.md) — Another famous auto-trait applied automatically by the compiler.

---

## 7. Key Takeaways

- **`Unpin`** is a Marker Trait (an auto-trait applied automatically by the compiler).
- It means *"This type has no self-references, so it is perfectly safe to move in memory."*
- If a type implements `Unpin`, wrapping it in `Pin` has **no effect**. The compiler allows the memory to be moved anyway.
- **99.9% of standard Rust types** (`String`, `Vec`, `HashMap`, custom structs) automatically implement `Unpin`.
- The only types that do **not** implement `Unpin` are the State Machine Futures generated by `async fn`!
