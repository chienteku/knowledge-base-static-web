# `Arc<T>`

> **Level 3 — Ownership & Borrowing**
> Thread-safe version of `Rc<T>` using atomic reference counting.

---

## 1. Prerequisites

- [`Rc<T>`](../level_03/rc_t.md) — You must understand how basic Reference Counting works first.
- [Ownership](../level_03/ownership.md) — The fundamental rule that both `Rc` and `Arc` are designed to bypass.

---

## 2. Term Category

**Rust-specific (the concurrent equivalent)**: While many languages use heavy, universal Garbage Collectors to manage memory across threads, Rust uses a specialized, explicit Atomic Reference Counter.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

We know that `Rc<T>` allows multiple owners to share data by keeping an integer count of how many owners exist. But if you try to pass an `Rc` into a background thread, the compiler throws a massive error. Why?

Because updating a standard integer across multiple threads is dangerous! If Thread A and Thread B both try to increment the `Rc` count at the exact same nanosecond, the CPU might drop one of the updates. The count becomes corrupted. If the count hits `0` early, the data drops while a thread is still using it. If the count never hits `0`, you get a permanent memory leak.

To fix this, we need **`Arc<T>`** (**A**tomic **R**eference **C**ounted). It does the exact same thing as `Rc`, but uses special hardware CPU instructions ("Atomics") to guarantee that the integer count is updated perfectly and safely across threads without ever corrupting.

### (2) Reality Metaphor

Imagine two people (**Threads**) standing in different rooms, trying to update a shared chalkboard tally (**`Rc`**). Because they can't coordinate, they might both walk up to the board at the exact same second, see the number `1`, erase it, and both write `2`. They just added two viewers, but the board only says `2` instead of `3`! The tally is corrupted.

**`Arc<T>`** is like replacing the chalkboard with a heavy, mechanical turnstile. No matter how fast people push through it simultaneously, the mechanical gears lock up and physically force the count to increment perfectly, one by one.

### (3) Rust Code Examples

#### Short Snippet (Sharing across threads)
Using `Arc` looks identical to using `Rc`. You just swap the names.

```rust
use std::sync::Arc;
use std::thread;

fn main() {
    // 1. Wrap data in an Atomic Reference Counter
    let shared_data = Arc::new(String::from("Thread Secret"));
    
    // 2. Clone it for the new thread (safely increments count to 2)
    let data_for_thread = Arc::clone(&shared_data);
    
    // 3. Move the clone into the background thread
    let handle = thread::spawn(move || {
        println!("Background thread reads: {}", data_for_thread);
    }); // count drops to 1 here!
    
    println!("Main thread reads: {}", shared_data);
    
    handle.join().unwrap();
} // count drops to 0 here. String is dropped!
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Arc T Scoping and Lifecycle Rules

**The mistake:** Assuming Arc T instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("arc_t_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("arc_t_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Arc T State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Arc T through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Arc T Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Arc T instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Fix the Compiler Error

**Problem:** The code below attempts to share a `Vec` with a background thread using `Rc`. The compiler will reject it because `Rc` is not thread-safe. Fix the code by switching to the thread-safe version. You will need to change three lines.

```rust
use std::rc::Rc;
use std::thread;

fn main() {
    let numbers = Rc::new(vec![1, 2, 3]);
    
    let thread_numbers = Rc::clone(&numbers);
    
    thread::spawn(move || {
        println!("Thread sees: {:?}", thread_numbers);
    }).join().unwrap();
}
```

> [!check]- Answer
> 1. Change the import to `use std::sync::Arc;`
> 2. Change `Rc::new` to `Arc::new`
> 3. Change `Rc::clone` to `Arc::clone`

---

### Exercise 2: Sharing Data Across Spawned Threads with `Arc`

**Problem:** Wrap a `Vec<i32>` in an `Arc`, clone the `Arc`, and move it into a `std::thread::spawn` closure to print vector length from another thread.

**Expected output:**
```
Thread saw len: 3
```

> [!check]- Answer
> ```rust
> use std::sync::Arc;
> use std::thread;
> fn main() {
>     let data = Arc::new(vec![1, 2, 3]);
>     let data_clone = Arc::clone(&data);
>     let handle = thread::spawn(move || {
>         println!("Thread saw len: {}", data_clone.len());
>     });
>     handle.join().unwrap();
> }
> ```
>
> **Explanation:** `Arc` provides thread-safe atomic reference counting, allowing multiple thread scopes to share read access to data.

### Exercise 3: Arc Weak References for Cyclic Prevention

**Problem:** Create an `Arc::downgrade` weak pointer and attempt to upgrade it using `.upgrade()`.

**Expected output:**
```
Upgraded: 42
```

> [!check]- Answer
> ```rust
> use std::sync::Arc;
> fn main() {
>     let strong = Arc::new(42);
>     let weak = Arc::downgrade(&strong);
>     if let Some(val) = weak.upgrade() {
>         println!("Upgraded: {}", val);
>     }
> }
> ```
>
> **Explanation:** `Weak` references do not prevent inner value drops when all `Arc` strong references fall out of scope.

---

## 6. Related Terms

- [`Rc<T>`](../level_03/rc_t.md) — The faster, single-threaded sibling.
- [`Mutex<T>`](../level_09/mutex_t.md) — Often wrapped inside an `Arc` (as `Arc<Mutex<T>>`) to allow thread-safe mutation.
- [`RefCell<T>`](../level_03/refcell_t.md) — The single-threaded way to mutate shared data (used with `Rc`).

---

## 7. Key Takeaways

- `Arc<T>` stands for **Atomic Reference Counted**.
- It does the exact same thing as `Rc<T>` (Shared Ownership), but it is **Thread Safe**.
- It uses special CPU instructions to ensure the owner count is never corrupted, even if multiple threads clone it simultaneously.
- Because these atomic instructions have a slight performance cost, you should only use `Arc` when dealing with threads. Otherwise, stick to `Rc`.
- Like `Rc`, the data inside an `Arc` is strictly read-only!
