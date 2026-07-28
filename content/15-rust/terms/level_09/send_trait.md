# `Send` Trait

> **Level 9 — Concurrency & Parallelism**
> Marker trait indicating a type can be safely transferred between threads.

---

## 1. Prerequisites

- [`std::thread::spawn`](../level_09/std_thread_spawn.md) — The function that creates threads and strictly requires this trait.
- [Marker Traits](../level_14/marker_traits.md) — Traits that have no methods; they just tell the compiler a mathematical fact about a type.
- [`Rc<T>`](../level_03/rc_t.md) — The most famous type that lacks this trait.

---

## 2. Term Category

**Rust-specific (the thread bouncer)**: In older languages like C++, you can pass absolutely any variable into a background thread. If that variable was not designed for multithreading (like a simple, non-atomic reference counter), it will corrupt your memory and silently crash your program. 

Rust completely prevents this using the **`Send`** trait. It is a mathematical proof to the compiler that a specific type is safe to be moved (transferred) across a thread boundary.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

How does the compiler actually *know* if a type is thread-safe? 

The Rust designers created an "auto-trait" called `Send`. The compiler automatically implements `Send` for almost every type in Rust (`String`, `Vec`, custom structs, etc.), *unless* that type contains something that is inherently unsafe to send across threads. 

When you call `thread::spawn`, the function signature has a strict rule: the closure must only capture variables that implement `Send`. If you try to move a non-thread-safe type (like `Rc<T>`) into a thread, the compiler sees it lacks the `Send` trait and immediately stops you from compiling, preventing a catastrophic Data Race!

### (2) Reality Metaphor

Imagine you are at an Airport (the thread boundary). You want to board an airplane (enter the new thread). 

The TSA Agent (the Rust compiler) asks to see your passport (the `Send` trait). 
- If you are a standard piece of luggage (a `String`, a `Vec`, an `i32`), you are automatically given a passport. You board the plane.
- But if you are carrying hazardous materials (like an `Rc<T>`, which will explode if used on an airplane), the TSA Agent sees you do not have a passport. They deny your boarding pass. You literally cannot get on the plane.

### (3) Rust Code Examples

#### Short Snippet (The Function Signature)
If you look at the official standard library documentation for `thread::spawn`, you will see exactly how the compiler enforces this rule.

```rust
// The simplified signature of thread::spawn:
pub fn spawn<F, T>(f: F) -> JoinHandle<T>
where
    F: FnOnce() -> T,
    F: Send + 'static, // <--- THE BOUNCER! The closure (F) MUST implement Send!
    T: Send + 'static,
```

#### Fuller Example (The TSA Agent in Action)
Let's see what happens when we try to sneak hazardous materials onto the airplane.

```rust
use std::rc::Rc;
use std::thread;

fn main() {
    // 1. We create a Reference Counted string. 
    // `Rc` uses a standard integer `count += 1` to track owners.
    let my_data = Rc::new(String::from("Hello"));

    // 2. We try to MOVE it into a new thread!
    thread::spawn(move || {
        println!("{}", my_data);
    });
}
```
**Compiler Error!**
```text
error[E0277]: `Rc<String>` cannot be sent between threads safely
   = help: the trait `Send` is not implemented for `Rc<String>`
   = note: required because it appears within the type `[closure]`
```
*Why did it fail?* Because if Thread A and Thread B both tried to update the `Rc` count at the exact same millisecond, they would overwrite each other's math, resulting in a corrupted count and a "Use After Free" security vulnerability. `Rc` is not `Send`!

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Send Trait Scoping and Lifecycle Rules

**The mistake:** Assuming Send Trait instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("send_trait_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("send_trait_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Send Trait State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Send Trait through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Send Trait Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Send Trait instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Safe Alternative

**Problem:** You are building a Web Server and need to share a massive configuration object across 10 different worker threads. You tried to wrap it in an `Rc<Config>` so the threads could share ownership, but the compiler threw a `Send` error. What wrapper should you use instead?

> [!check]- Answer
> You should use **`Arc<Config>`**.
>
> `Arc` stands for Atomic Reference Counted. It does the exact same thing as `Rc`, but uses thread-safe atomic math. Therefore, `Arc` implements the `Send` trait and is allowed to cross the thread boundary!

---

### Exercise 2: Verifying `Send` Trait Bounds

**Problem:** Write a function `fn assert_send<T: Send>()` and verify `Arc<i32>` implements `Send`.

**Expected output:**
> [!check]- Answer
> ```
> Arc implements Send
> ```
> ```rust
> fn assert_send<T: Send>() {}
> fn main() {
>     assert_send::<std::sync::Arc<i32>>();
>     println!("Arc implements Send");
> }
> ```
>
> **Explanation:** `Send` indicates that ownership of a type can be transferred safely across thread boundaries.

---

### Exercise 3: Raw Pointer `Send` Wrapper Implementation

**Problem:** Wrap a raw pointer in a custom struct `struct PtrWrapper(*mut i32)` and implement `unsafe impl Send for PtrWrapper`.

**Expected output:**
> [!check]- Answer
> ```
> Unsafe Send implemented
> ```
> struct PtrWrapper(*mut i32);
> unsafe impl Send for PtrWrapper {}
> fn main() {
>     println!("Unsafe Send implemented");
> }
> ```
>
> **Explanation:** Implementing `Send` manually requires `unsafe impl` to guarantee pointer safety across threads.

---

## 6. Related Terms

- [`std::thread::spawn`](../level_09/std_thread_spawn.md) — The function that strictly requires the `Send` trait.
- [`Sync` Trait](../level_09/sync_trait.md) — The sister trait to `Send`, dealing with shared references (`&T`) instead of moved ownership (`T`).
- [`Arc<T>`](../level_03/arc_t.md) — The thread-safe alternative to `Rc<T>` that *does* implement `Send`.

---

## 7. Key Takeaways

- **`Send`** is a Marker Trait that proves a type is safe to transfer (move) across thread boundaries.
- `thread::spawn` mathematically requires all captured variables in the closure to implement `Send`.
- Most primitive types and custom structs automatically implement `Send`.
- Types with non-atomic internal state (like `Rc<T>`) explicitly do *not* implement `Send`.
- Never manually implement `Send` using `unsafe` unless you are a concurrency expert building a custom synchronization primitive.
