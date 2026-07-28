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

### Exercise 2: What `!Unpin` Actually Prevents \u2014 `Pin::new` vs `Box::pin`

**Problem:**
If a type implements `Unpin`, you can use `Pin::new(&mut val)` and then freely move `val` out afterward \u2014 pinning has no effect on it. If a type is `!Unpin`, you *cannot* call `Pin::new` on a stack reference (the compiler blocks the safe path), and you must use `Box::pin` instead for a stable heap address.

Demonstrate both cases:
1. Create `struct Movable { val: i32 }` (auto-`Unpin`). Pin it with `Pin::new`, deref it, then move `val` out afterward \u2014 show this is fine.
2. Create `struct Immovable { _pin: PhantomPinned }` (`!Unpin`). Explain (in a comment) why `Pin::new(&mut immovable)` would be rejected by the compiler. Pin it safely with `Box::pin` instead, and dereference through the Pin to read a field.

**Expected output:**
> [!check]- Answer
> ```text
> Movable value through Pin: 99
> Moved val out of Movable afterward: 99
> Immovable value through Box::pin: 42
> ```
>
> - **Hint 1:** `Pin::new(ptr)` is only available when the pointed-to type implements `Unpin`. The function signature is `Pin::new(ptr: P) -> Pin<P> where P::Target: Unpin`. For `!Unpin` types, this function simply does not exist \u2014 the compiler rejects the call at the trait bound level.
> - **Hint 2:** `Pin::new_unchecked` is the unsafe escape hatch that bypasses the `Unpin` check. `Box::pin(val)` is the safe alternative: it allocates on the heap, which has a stable address for as long as the `Box` lives.
> - **Hint 3:** You can read through a `Pin<Box<T>>` with `pinned_box.as_ref().get_ref().field` or by dereferencing: `(*pinned_box).field`. Writing requires `pinned_box.as_mut().get_mut().field` \u2014 but only if `T: Unpin`.
>
> ```rust
> use std::marker::PhantomPinned;
> use std::pin::Pin;
>
> // Movable is Unpin (auto-implemented): safe to use Pin::new and then move.
> struct Movable {
>     val: i32,
> }
>
> // Immovable is !Unpin because PhantomPinned opts out of the auto-impl.
> struct Immovable {
>     val: i32,
>     _pin: PhantomPinned,
> }
>
> fn main() {
>     // Case 1: Unpin type \u2014 Pin::new works; moving out afterward is fine.
>     let mut m = Movable { val: 99 };
>     {
>         let pinned = Pin::new(&mut m); // allowed: Movable: Unpin
>         println!("Movable value through Pin: {}", pinned.val);
>     } // pin released here; &mut m is no longer borrowed
>     println!("Moved val out of Movable afterward: {}", m.val); // m is still usable
>
>     // Case 2: !Unpin type \u2014 Pin::new is NOT available; use Box::pin.
>     // let mut i = Immovable { val: 42, _pin: PhantomPinned };
>     // Pin::new(&mut i); // \u274c compile error: Immovable: !Unpin
>
>     let pinned_box: Pin<Box<Immovable>> = Box::pin(Immovable {
>         val: 42,
>         _pin: PhantomPinned,
>     });
>     // Read through the Pin by calling get_ref() (safe for any Pin).
>     println!("Immovable value through Box::pin: {}", pinned_box.as_ref().get_ref().val);
>     // pinned_box drops here \u2014 the heap allocation is freed.
> }
> ```
>
> **Explanation:**
> `Unpin` is the trait that says "I don't care if I'm moved while pinned". For such types, `Pin` is essentially a no-op wrapper \u2014 it adds no safety constraints. `!Unpin` types (like async state machines) genuinely need the location stability guarantee: once pinned, they must stay at the same address until dropped. `Box::pin` provides this by allocating on the heap and preventing the `Box` from moving (via the `Pin` wrapper). The practical takeaway: you almost never deal with `Pin` directly when writing async Rust \u2014 the `async/await` machinery handles it. You encounter it when implementing `Future` by hand or working with self-referential data structures.

---

### Exercise 3: Safe Deref Mutability for `Unpin` Types

**Problem:** Move values out of `Pin<&mut T>` when `T: Unpin` using `Pin::into_inner`.

**Expected output:**
> [!check]- Answer
> ```
> Extracted Unpin value: 42
> ```
> ```rust
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
