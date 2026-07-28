# `Atomic` Types

> **Level 9 — Concurrency & Parallelism**
> Lock-free atomic operations: `AtomicBool`, `AtomicUsize`, etc.

---

## 1. Prerequisites

- [`Arc<T>`](../level_03/arc_t.md) — The tool used to share Atomic types across threads. 
- [`Mutex<T>`](../level_09/mutex_t.md) — The software lock that Atomics are designed to replace for simple data!

---

## 2. Term Category

**Rust-nonspecific (the hardware lock)**: A `Mutex` is incredibly safe, but it is a "software lock". When a thread is waiting for a `Mutex`, the Operating System literally pauses the thread, switches context, and wakes it up later. This OS-level context switching is relatively slow. 

For simple operations (like adding `1` to a counter, or flipping a `bool` flag to `true`), pausing an entire thread with a massive `Mutex` is overkill. 

**`Atomic` types** (like `AtomicUsize`, `AtomicBool`) are hardware-level primitives that perform math operations in a single, uninterruptible CPU cycle—no OS locks required!

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Consider the simple math equation: `x = x + 1`. 

In hardware, this actually requires 3 distinct steps: 
1. Read the value of `x` from memory.
2. Add `1` to it inside the CPU. 
3. Write the new value back to memory. 

If Thread A and Thread B do this at the exact same microsecond, they might both read `5`, both add `1`, and both write `6` back to memory. The number should be `7`! You lost data!

A `Mutex` prevents this by forcing the threads to wait in line. But CPU manufacturers realized this math was so common that they built a special hardware instruction into the microchip: *"Read, Add, and Write this specific memory location in one single, uninterruptible, Atomic step."* 

Rust exposes these hardware instructions via the `std::sync::atomic` module.

### (2) Reality Metaphor

Imagine two people (threads) trying to deposit a check at a bank.

- **Mutex:** You stand in a 5-minute line, talk to the teller, hand them the check, wait for them to type it in, and get a receipt. It is very safe, but very slow.
- **Atomic Type:** You walk directly past the line and drop the check into a highly secure, robotic ATM deposit slot that instantly vacuums it up and updates your balance in a millisecond. It is lightning fast! *(However, the robot ATM only supports very basic operations. You can't ask the ATM robot for a complex mortgage loan!)*

### (3) Rust Code Examples

#### Short Snippet (The Methods)
Atomic types have special methods like `fetch_add` (add), `fetch_sub` (subtract), and `store` (replace). 

```rust
use std::sync::atomic::{AtomicUsize, Ordering};

let counter = AtomicUsize::new(0);

// Atomically add 1 to the counter!
counter.fetch_add(1, Ordering::SeqCst);
```

#### Fuller Example (The Speed Boost)
In a previous term, we used `Arc<Mutex<usize>>` to share a counter across 10 threads. Look how much cleaner (and faster!) it is to replace the `Mutex` with an `AtomicUsize`.

```rust
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use std::thread;

fn main() {
    // 1. Notice there is no Mutex! Just Arc + Atomic!
    let counter = Arc::new(AtomicUsize::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter_clone = Arc::clone(&counter);
        
        let handle = thread::spawn(move || {
            // 2. We don't have to call .lock().unwrap()!
            // We just ask the CPU to atomically add 1.
            counter_clone.fetch_add(1, Ordering::SeqCst);
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    // 3. We read the final value using `.load()`
    println!("Final count: {}", counter.load(Ordering::SeqCst));
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Atomic Types Scoping and Lifecycle Rules

**The mistake:** Assuming Atomic Types instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("atomic_types_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("atomic_types_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Atomic Types State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Atomic Types through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Atomic Types Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Atomic Types instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Complex Struct

**Problem:** You have a massive `User` struct with 50 fields (Name, Email, Age, Address, Password Hash, etc.). You want to share and mutate this User across 10 threads as fast as possible. Can you wrap it in an `AtomicUser`?

> [!check]- Answer
> **No!** 
>
> Hardware atomics only exist for very basic, primitive data types (like integers, booleans, and raw pointers). The CPU cannot atomically update a massive 50-field struct in a single instruction. For a complex struct, you *must* use a software lock like a `Mutex<T>` or `RwLock<T>`.

---

### Exercise 2: Atomic Flag Toggle with `AtomicBool`

**Problem:** Toggle an `AtomicBool` using `.store(true, Ordering::SeqCst)` and read with `.load(Ordering::SeqCst)`.

**Expected output:**
> [!check]- Answer
> ```
> Flag state: true
> ```
> ```rust
> use std::sync::atomic::{AtomicBool, Ordering};
> fn main() {
>     let flag = AtomicBool::new(false);
>     flag.store(true, Ordering::SeqCst);
>     println!("Flag state: {}", flag.load(Ordering::SeqCst));
> }
> ```
>
> **Explanation:** Atomic types provide lock-free concurrent primitive variable access.

---

### Exercise 3: Thread-Safe Counter with `fetch_add`

**Problem:** Increment an `AtomicUsize` across 3 threads using `.fetch_add(1, Ordering::SeqCst)`.

**Expected output:**
> [!check]- Answer
> ```
> Atomic count: 3
> ```
> use std::sync::atomic::{AtomicUsize, Ordering};
> use std::sync::Arc;
> use std::thread;
> fn main() {
>     let cnt = Arc::new(AtomicUsize::new(0));
>     let mut handles = vec![];
>     for _ in 0..3 {
>         let c = Arc::clone(&cnt);
>         handles.push(thread::spawn(move || { c.fetch_add(1, Ordering::SeqCst); }));
>     }
>     for h in handles { h.join().unwrap(); }
>     println!("Atomic count: {}", cnt.load(Ordering::SeqCst));
> }
> ```
>
> **Explanation:** `fetch_add` executes atomic read-modify-write operations in a single CPU instruction.

---

## 6. Related Terms

- [`Arc<T>`](../level_03/arc_t.md) — The "A" in `Arc` literally stands for Atomic! It uses an `AtomicUsize` internally to track the reference count across threads!
- [`Mutex<T>`](../level_09/mutex_t.md) — The slower, software-lock alternative required for complex types.

---

## 7. Key Takeaways

- **`Atomic`** types (like `AtomicUsize`, `AtomicBool`) are hardware-level, lock-free synchronization primitives.
- They allow multiple threads to safely mutate a single variable without needing a `Mutex`.
- Operations like `.fetch_add()` happen in a single, uninterruptible CPU cycle.
- They are significantly faster than a `Mutex`, but they **only work on simple primitive types** (integers, booleans, pointers).
- Always use `Ordering::SeqCst` unless you specifically know exactly what you are doing.
