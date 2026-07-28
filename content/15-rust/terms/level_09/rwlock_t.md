# `RwLock<T>`

> **Level 9 — Concurrency & Parallelism**
> Reader-writer lock; allows multiple readers or one writer.

---

## 1. Prerequisites

- [Shared Borrowing (`&T`)](../level_03/borrowing.md) — The concept of unlimited read-only access.
- [Mutable Borrowing (`&mut T`)](../level_03/mutable_borrowing.md) — The concept of exclusive write access.
- [`Mutex<T>`](../level_09/mutex_t.md) — The simpler lock that `RwLock` seeks to optimize.

---

## 2. Term Category

**Rust-nonspecific (the VIP bouncer)**: A standard `Mutex` is a blunt instrument: it only lets *one* thread access the data at a time, period. 

But what if you have 100 threads that just want to *read* a configuration file, and only 1 thread that occasionally wants to *update* it? A `Mutex` forces all 100 readers into a single-file line, completely destroying your parallel performance! 

An **`RwLock` (Read-Write Lock)** solves this by enforcing Rust's core borrowing rules at runtime: it allows unlimited simultaneous readers, OR exactly one exclusive writer.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The Rust compiler uses two strict borrowing rules at compile time:
1. You can have unlimited immutable references (`&T`).
2. OR you can have exactly one mutable reference (`&mut T`).

An `RwLock` takes this exact same logic and applies it to threads at runtime!
- If Thread A asks for a **Read Lock**, it gets it instantly. 
- If Thread B asks for a **Read Lock**, it also gets it instantly. They both read simultaneously.
- But if Thread C asks for a **Write Lock**, the lock pauses Thread C. Thread C must patiently stand at the door and wait for Thread A and Thread B to leave before it can enter.
- Once Thread C is inside, any new threads asking to read are paused at the door until Thread C finishes writing.

This massively speeds up read-heavy applications (like Web Servers checking a cached user-profile) because the threads don't block each other!

### (2) Reality Metaphor

Imagine a Public Museum holding an ancient, rare manuscript.

- **Read Lock:** 50 scholars can stand around the glass case and look at the manuscript at the exact same time. Nobody is modifying it, so it's perfectly safe to let everyone look simultaneously.
- **Write Lock:** A restorer needs to open the glass case and physically paint over a tear in the manuscript. The museum must kick all 50 scholars out of the room. The restorer must be alone in the room until the paint dries. Once the restorer leaves, the 50 scholars can rush back in.

### (3) Rust Code Examples

#### Short Snippet (The Locks)
Instead of a single `.lock()` method, `RwLock` gives you two specific methods.

```rust
use std::sync::RwLock;

fn main() {
    let lock = RwLock::new(5);

    // 1. Unlimited Readers!
    let r1 = lock.read().unwrap();
    let r2 = lock.read().unwrap();
    println!("Read 1: {}, Read 2: {}", *r1, *r2);
    
    // We MUST drop the read locks before we can write!
    drop(r1);
    drop(r2);

    // 2. Exclusive Writer!
    let mut w = lock.write().unwrap();
    *w += 1;
}
```

#### Fuller Example (The Web Server Cache)
`RwLock` is almost always paired with `Arc` so multiple threads can own the lock! Here we simulate 3 threads reading a config simultaneously, while 1 thread occasionally updates it.

```rust
use std::sync::{Arc, RwLock};
use std::thread;
use std::time::Duration;

fn main() {
    // A configuration flag shared across threads
    let config = Arc::new(RwLock::new(false));
    let mut handles = vec![];

    // Spawn 3 Reader Threads
    for _ in 0..3 {
        let cfg = Arc::clone(&config);
        handles.push(thread::spawn(move || {
            for _ in 0..5 {
                // They all grab read locks simultaneously! No waiting in line!
                let is_active = cfg.read().unwrap();
                println!("Reader thread sees config: {}", *is_active);
                thread::sleep(Duration::from_millis(10));
            }
        }));
    }

    // Spawn 1 Writer Thread
    let cfg_writer = Arc::clone(&config);
    handles.push(thread::spawn(move || {
        thread::sleep(Duration::from_millis(20));
        
        // This thread asks for a write lock. It will wait for the readers to
        // momentarily drop their locks, then it will swoop in and mutate it!
        let mut active = cfg_writer.write().unwrap();
        *active = true;
        println!("*** WRITER THREAD UPDATED CONFIG! ***");
    }));

    for handle in handles {
        handle.join().unwrap();
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Rwlock T Scoping and Lifecycle Rules

**The mistake:** Assuming Rwlock T instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("rwlock_t_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("rwlock_t_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Rwlock T State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Rwlock T through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Rwlock T Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Rwlock T instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Bottleneck

**Problem:** You are building a Web Server. 99% of your HTTP requests just read the User's Profile from memory. 1% of requests update the profile. You originally used an `Arc<Mutex<UserProfile>>`, but your server is incredibly slow under high traffic. Why is it slow, and what should you replace it with?

> [!check]- Answer
> It is slow because a `Mutex` forces all 99% of your Readers to wait in a single-file line! Even though they just want to look at the profile, they have to take turns. 
>
> You should replace it with **`Arc<RwLock<UserProfile>>`**. This will allow all the Readers to read simultaneously, massively boosting performance!

---

### Exercise 2: Multiple Simultaneous Readers with `RwLock`

**Problem:** Acquire two simultaneous read guards `r1 = lock.read()` and `r2 = lock.read()`.

**Expected output:**
> [!check]- Answer
> ```
> r1: 42, r2: 42
> ```
> ```rust
> use std::sync::RwLock;
> fn main() {
>     let lock = RwLock::new(42);
>     let r1 = lock.read().unwrap();
>     let r2 = lock.read().unwrap();
>     println!("r1: {}, r2: {}", *r1, *r2);
> }
> ```
>
> **Explanation:** `RwLock` permits multiple simultaneous reader guards when no writer guard is active.

---

### Exercise 3: Exclusive Writer Acquisition

**Problem:** Acquire an exclusive write guard `w = lock.write()` and modify the protected value.

**Expected output:**
> [!check]- Answer
> ```
> Writer updated: 100
> ```
> ```rust
> use std::sync::RwLock;
> fn main() {
>     let lock = RwLock::new(10);
>     {
>         let mut w = lock.write().unwrap();
>         *w = 100;
>     }
>     println!("Writer updated: {}", *lock.read().unwrap());
> }
> ```
>
> **Explanation:** `write()` requests exclusive access, blocking all new readers and writers.

---

## 6. Related Terms

- [`Mutex<T>`](../level_09/mutex_t.md) — The simpler lock that only allows one thread to access data at a time, period.
- [`Arc<T>`](../level_03/arc_t.md) — The smart pointer used to share the `RwLock` across threads (`Arc<RwLock<T>>`).
- [`RefCell<T>`](../level_03/refcell_t.md) — The single-threaded equivalent of an `RwLock`. `RefCell` enforces the exact same borrowing rules at runtime, but without OS thread locks!

---

## 7. Key Takeaways

- **`RwLock`** stands for Read-Write Lock.
- It enforces Rust's borrowing rules at runtime across threads: **Unlimited Readers OR Exactly One Writer.**
- Use **`.read().unwrap()`** for immutable, simultaneous access.
- Use **`.write().unwrap()`** for exclusive, mutable access.
- It is heavily used in read-heavy applications (like caching or configuration) where a `Mutex` would cause a massive bottleneck.
- Be extremely careful not to ask for a Write Lock while you are still holding a Read Lock, or you will Deadlock yourself!
