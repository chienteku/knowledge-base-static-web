# `Arc<Mutex<T>>`

> **Level 9 — Concurrency & Parallelism**
> Common pattern for shared mutable state across threads.

---

## 1. Prerequisites

- [`Arc<T>`](../level_03/arc_t.md) — The thread-safe smart pointer that allows shared ownership.
- [`Mutex<T>`](../level_09/mutex_t.md) — The lock that allows safe mutation.
- [`std::thread::spawn`](../level_09/std_thread_spawn.md) — The function that creates the threads requiring this pattern!

---

## 2. Term Category

**Rust-specific (the iconic duo)**: While `Arc` and `Mutex` are completely separate tools, they are combined so frequently in Rust that the phrase **`Arc<Mutex<T>>`** has become a singular, famous idiom. 

If you go to a Rust forum and ask: *"How do I share a variable across 10 threads and let them all safely modify it?"*, the entire community will immediately answer in unison: *"Wrap it in an `Arc<Mutex<T>>`."*

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In Rust, the golden rule of Ownership is that a variable can only have *one* owner. If you spawn 10 threads, who owns the variable? 

The standard answer is `Arc` (Atomic Reference Counted pointer). `Arc` allows 10 threads to share ownership of the data! But there's a massive catch: `Arc` only provides *immutable* shared access. What if the 10 threads need to actually *modify* the data? You can't have multiple mutable references in Rust!

The solution is brilliant composition:
1. You wrap the data in a `Mutex`, which provides safe *interior mutability* (the ability to mutate data even when you only have an immutable reference to the Mutex).
2. You wrap that `Mutex` in an `Arc`. 

The `Arc` shares the box; the `Mutex` protects the contents.

### (2) Reality Metaphor

Imagine you have a single, highly confidential Company Ledger (the data). You have 10 accountants (the threads) who all need to read and update it. 

- You can't just hand the Ledger to Accountant #1, because the other 9 couldn't access it.
- So, you put the Ledger in a heavy steel Safe with a combination lock (**`Mutex`**). Only one accountant can open it at a time.
- But how do all 10 accountants know where the Safe is? You bolt the Safe to the floor in the center of the office, and give all 10 accountants a map to its location (**`Arc`**). 

Now, multiple people share access to the location of the safe (`Arc`), but only one person can mutate the ledger inside it at a time (`Mutex`).

### (3) Rust Code Examples

#### Short Snippet (The Declaration)
You declare it by nesting the `new()` calls.

```rust
use std::sync::{Arc, Mutex};

// A shared, mutable counter initialized to 0.
let shared_state = Arc::new(Mutex::new(0));
```

#### Fuller Example (The Classic Counter)
This is the "Hello World" of Rust concurrency. We spawn 10 threads that all safely increment the exact same number.

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    // 1. Create the iconic duo
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        // 2. We MUST clone the Arc to give a "map to the safe" to the new thread.
        // This does NOT clone the data, it just increments the reference count!
        let counter_clone = Arc::clone(&counter);
        
        let handle = thread::spawn(move || {
            // 3. We use the map to find the safe, and lock it!
            let mut num = counter_clone.lock().unwrap();
            
            // 4. We mutate the data!
            *num += 1;
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    // Result is guaranteed to be 10!
    println!("Final count: {}", *counter.lock().unwrap());
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Arc Mutex T Scoping and Lifecycle Rules

**The mistake:** Assuming Arc Mutex T instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("arc_mutex_t_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("arc_mutex_t_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Arc Mutex T State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Arc Mutex T through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Arc Mutex T Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Arc Mutex T instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Non-Atomic Twin

**Problem:** There is an exact single-threaded equivalent to `Arc<Mutex<T>>`. It uses a non-atomic reference counter (because it doesn't need thread safety) and a non-locking interior mutability wrapper. What is the name of this single-threaded pattern?

> [!check]- Answer
> **`Rc<RefCell<T>>`**!
>
> - `Rc` is the single-threaded version of `Arc`.
> - `RefCell` is the single-threaded version of `Mutex`.
>
> If you try to pass `Rc<RefCell<T>>` into `thread::spawn`, the compiler will violently reject it because it lacks the `Send` trait!

---

### Exercise 2: Shared Thread State Mutation

**Problem:** Spawn 5 threads incrementing a shared counter stored in `Arc<Mutex<u32>>`.

**Expected output:**
> [!check]- Answer
> ```
> Final count: 5
> ```
> ```rust
> use std::sync::{Arc, Mutex};
> use std::thread;
> fn main() {
>     let counter = Arc::new(Mutex::new(0));
>     let mut handles = vec![];
>     for _ in 0..5 {
>         let c = Arc::clone(&counter);
>         handles.push(thread::spawn(move || {
>             let mut num = c.lock().unwrap();
>             *num += 1;
>         }));
>     }
>     for h in handles { h.join().unwrap(); }
>     println!("Final count: {}", *counter.lock().unwrap());
> }
> ```
>
> **Explanation:** `Arc<Mutex<T>>` provides thread-safe, shared mutable access across concurrent execution contexts.

---

### Exercise 3: Scoped Block Release for Mutex Guards

**Problem:** Scope `mutex.lock()` inside a block `{ ... }` so subsequent thread locks don't block.

**Expected output:**
> [!check]- Answer
> ```
> Lock released safely
> ```
> ```rust
> use std::sync::{Arc, Mutex};
> fn main() {
>     let m = Arc::new(Mutex::new(10));
>     {
>         let mut guard = m.lock().unwrap();
>         *guard = 20;
>     }
>     println!("Lock released safely: {}", *m.lock().unwrap());
> }
> ```
>
> **Explanation:** Dropping `MutexGuard` scope blocks releases exclusive lock ownership.

---

## 6. Related Terms

- [`Rc<T>`](../level_03/rc_t.md) / [`RefCell<T>`](../level_03/refcell_t.md) — The exact single-threaded equivalent of this pattern!
- [`RwLock<T>`](../level_09/rwlock_t.md) — Often swapped in to create `Arc<RwLock<T>>` for read-heavy applications.

---

## 7. Key Takeaways

- **`Arc<Mutex<T>>`** is the standard Rust pattern for sharing mutable state across threads.
- **`Arc`** provides the shared ownership (giving every thread a pointer to the data).
- **`Mutex`** provides the thread-safe interior mutability (ensuring threads can safely modify the data one at a time).
- You must explicitly `Arc::clone(&variable)` to increment the reference count for each new thread you spawn.
- The `Arc` shares the box; the `Mutex` protects the contents!
