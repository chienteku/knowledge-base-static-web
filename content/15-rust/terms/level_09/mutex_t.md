# `Mutex<T>`

> **Level 9 — Concurrency & Parallelism**
> Mutual exclusion lock; provides interior mutability across threads.

---

## 1. Prerequisites

- [Interior Mutability](../level_03/interior_mutability.md) — The ability to mutate data even when you only have an immutable reference to it.
- [`RefCell<T>`](../level_03/refcell_t.md) — The single-threaded version of this concept.
- [`Sync` Trait](../level_09/sync_trait.md) — The trait that proves a type is safe to share across threads.

---

## 2. Term Category

**Rust-nonspecific (the bouncer)**: Mutexes exist in almost every programming language (C++, Java, Python, Go). A Mutex (Mutual Exclusion) is a lock. It ensures that only one thread can access a piece of data at a time. 

While the concept is universal, Rust's implementation is incredibly unique. In other languages, the Mutex sits *next* to the data. In Rust, the Mutex actually *owns* the data, making it mathematically impossible to access the data without unlocking it first.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In C++, developers create a `data` variable and a separate `data_mutex` variable. Before mutating the data, the developer is *supposed* to lock the mutex. But developers are human. They constantly forget to lock the mutex, leading to catastrophic Data Races where two threads overwrite the data simultaneously.

The Rust designers realized: *"What if the Mutex completely swallowed the data?"* 

In Rust, `Mutex<T>` wraps the data entirely. The only way to see the data is to call `.lock()`. This pauses the current thread until the Mutex is available. Because `Mutex` uses Operating System-level locking to guarantee safety, the compiler explicitly gives it the `Sync` trait, allowing you to safely share and mutate data across multiple threads!

### (2) Reality Metaphor

Imagine a public restroom (the data) in a coffee shop. 

There is a physical key attached to a giant block of wood (the Mutex). Only one person can hold the key at a time. 
- If someone is currently inside the restroom, you must wait outside the door until they come out and hand you the key. 
- You cannot physically enter the restroom without holding the key.

This ensures total privacy (data safety). You can never accidentally walk in while someone else is using it. When you finish and leave the bathroom, you drop the key (the lock goes out of scope), allowing the next person in line to take it.

### (3) Rust Code Examples

#### Short Snippet (The Lock)
To mutate the data, you must call `.lock()`. Because a thread could panic while holding the lock (corrupting the data), `.lock()` returns a `Result` to warn you. You must `.unwrap()` it.

```rust
use std::sync::Mutex;

fn main() {
    let m = Mutex::new(5); // The Mutex swallows the number 5

    {
        // We pause until we get the lock. 
        // `num` is a smart pointer to the data inside!
        let mut num = m.lock().unwrap();
        *num = 6;
        
    } // `num` goes out of scope here. The Mutex automatically unlocks!

    println!("Mutex contains: {:?}", m);
}
```

#### Fuller Example (The Best Friends: Arc + Mutex)
A `Mutex` allows safe mutation, but it doesn't allow shared ownership. If you spawn 3 threads, how do they all "own" the Mutex? 

You combine it with `Arc`! `Arc` shares the box; `Mutex` protects the contents. `Arc<Mutex<T>>` is the most famous combination in Rust concurrency.

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    // 1. We create a counter wrapped in a Mutex, wrapped in an Arc.
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    // 2. We spawn 10 threads.
    for _ in 0..10 {
        let counter_clone = Arc::clone(&counter); // Share ownership!
        
        let handle = thread::spawn(move || {
            // 3. We lock the Mutex. If another thread is currently adding,
            // this thread will patiently wait in line.
            let mut num = counter_clone.lock().unwrap();
            *num += 1;
        });
        handles.push(handle);
    }

    // Wait for all threads to finish
    for handle in handles {
        handle.join().unwrap();
    }

    // 4. The result is GUARANTEED to be 10. No data races!
    println!("Final count: {}", *counter.lock().unwrap());
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Mutex T Scoping and Lifecycle Rules

**The mistake:** Assuming Mutex T instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("mutex_t_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("mutex_t_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Mutex T State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Mutex T through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Mutex T Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Mutex T instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Missing Trait

**Problem:** You are reviewing a friend's code. They tried to use `RefCell<i32>` to share a mutable integer across 4 threads using an `Arc`. The compiler threw a `Sync` error. What wrapper should they replace `RefCell` with to fix the error?

> [!check]- Answer
> They must replace `RefCell<i32>` with **`Mutex<i32>`**!
>
> Both types provide Interior Mutability, but `RefCell` is for single-threaded programs, while `Mutex` uses OS locks to provide thread-safe Interior Mutability (giving it the `Sync` trait).

---

### Exercise 2: Handling Mutex Poisoning

**Problem:** Handle a poisoned mutex using `.lock().unwrap_or_else(|e| e.into_inner())` after a thread panics while holding the lock.

**Expected output:**
> [!check]- Answer
> ```
> Recovered poisoned value: 42
> ```
> ```rust
> use std::sync::{Arc, Mutex};
> use std::thread;
> fn main() {
>     let m = Arc::new(Mutex::new(42));
>     let m_clone = Arc::clone(&m);
>     let _ = thread::spawn(move || {
>         let _guard = m_clone.lock().unwrap();
>         panic!("Thread panic holding lock");
>     }).join();
>     let val = m.lock().unwrap_or_else(|e| e.into_inner());
>     println!("Recovered poisoned value: {}", *val);
> }
> ```
>
> **Explanation:** `Mutex::lock` returns `PoisonError` if a thread panics while holding the lock guard.

---

### Exercise 3: Non-Blocking Lock Acquisition with `try_lock`

**Problem:** Use `mutex.try_lock()` to attempt non-blocking lock acquisition.

**Expected output:**
> [!check]- Answer
> ```
> Try lock succeeded
> ```
> use std::sync::Mutex;
> fn main() {
>     let m = Mutex::new(10);
>     if let Ok(guard) = m.try_lock() {
>         println!("Try lock succeeded: {}", *guard);
>     }
> }
> ```
>
> **Explanation:** `try_lock()` attempts lock acquisition immediately, returning `Err(TryLockError::WouldBlock)` if locked.

---

## 6. Related Terms

- [`Arc<T>`](../level_03/arc_t.md) — The `Arc` shares the Mutex; the Mutex mutates the data. They are best friends (`Arc<Mutex<T>>`).
- [`RwLock<T>`](../level_09/rwlock_t.md) — The faster cousin of `Mutex` that allows multiple readers to read the data simultaneously, but still restricts writing to one thread at a time.
- [`RefCell<T>`](../level_03/refcell_t.md) — The single-threaded version of `Mutex`.

---

## 7. Key Takeaways

- **`Mutex<T>`** (Mutual Exclusion) ensures only one thread can access the inner data at a time.
- It provides thread-safe Interior Mutability, allowing multiple threads to safely mutate shared data.
- You access the data by calling **`.lock().unwrap()`**.
- When the returned lock guard goes out of scope, the Mutex is automatically unlocked for the next thread.
- It is almost always combined with `Arc` (e.g., `Arc<Mutex<i32>>`).
- Rust guarantees no Data Races, but you can still cause permanent program freezes (Deadlocks)!
