# `Condvar` & `Barrier`

> **Level 9 — Concurrency & Parallelism**
> A condition variable for blocking a thread until notified, and a barrier for synchronizing a fixed set of threads at a rendezvous point.

---

## 1. Prerequisites

- [`Mutex<T>`](../level_09/mutex_t.md) — What `Condvar` is always used alongside.
- [`std::thread::spawn`](../level_09/std_thread_spawn.md) — The threads these primitives coordinate.
- [Channel (`mpsc`)](../level_09/channel_mpsc.md) — A higher-level alternative for many of the same coordination problems.

---

## 2. Term Category

**Low-Level Synchronization Primitives (the classic building blocks)**: `Mutex` alone only answers "who currently has exclusive access?" — it says nothing about *waiting for a specific condition* to become true, or *coordinating a group* of threads to all reach the same point together. `Condvar` and `Barrier` are the standard, textbook synchronization primitives that fill in exactly those two gaps.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Imagine a thread that needs to wait until "the queue is non-empty" before proceeding. Without `Condvar`, the only options are busy-waiting (repeatedly locking a `Mutex`, checking, unlocking, in a tight loop — wasting CPU) or building custom signaling infrastructure yourself. `Condvar` provides the missing piece: `.wait()` **atomically** releases a held `Mutex` lock and puts the thread to sleep, and some other thread can later call `.notify_one()`/`.notify_all()` to wake waiters up efficiently, with no busy-waiting at all. `Barrier` solves a different, related problem: "N threads are each doing independent work, but none of them should proceed past a certain point until *all* N have reached it" — a classic pattern in parallel algorithms with distinct phases (compute phase 1, wait for everyone, compute phase 2 using everyone's phase-1 results).

### (2) Reality Metaphor

**`Condvar`**: Imagine a diner where a customer doesn't want to repeatedly poke their head into the kitchen every ten seconds asking "is my order ready yet?" (**busy-waiting**). Instead, they sit down and fall asleep at the table, having told the kitchen "wake me up specifically when my order is ready" (**`.wait()`**). The kitchen staff, once the order is done, walks over and taps the customer awake (**`.notify_one()`**) — efficient for both sides, no repeated polling required.

**`Barrier`**: Imagine a group of hikers who agree to regroup at a specific checkpoint before continuing together as a pack. Each hiker walks at their own pace and arrives at the checkpoint at a different time, but every single one of them **waits** at that checkpoint until the *last* straggler finally arrives — only then does the entire group set off together again for the next leg.

### (3) Rust Code Examples

#### Short Snippet (`Condvar`: Waiting for a Signal)
```rust
use std::sync::{Arc, Mutex, Condvar};
use std::thread;

fn main() {
    let pair = Arc::new((Mutex::new(false), Condvar::new()));
    let pair2 = Arc::clone(&pair);

    thread::spawn(move || {
        let (lock, cvar) = &*pair2;
        let mut ready = lock.lock().unwrap();
        *ready = true;
        cvar.notify_one(); // Wake up whoever is waiting.
    });

    let (lock, cvar) = &*pair;
    let mut ready = lock.lock().unwrap();
    // .wait() atomically unlocks `ready` and sleeps until notified — then re-locks automatically.
    while !*ready {
        ready = cvar.wait(ready).unwrap();
    }
    println!("Signal received!");
}
```

#### Fuller Example (`Barrier`: Synchronizing a Multi-Phase Computation)
```rust
use std::sync::{Arc, Barrier};
use std::thread;

fn main() {
    let num_threads = 3;
    let barrier = Arc::new(Barrier::new(num_threads));
    let mut handles = vec![];

    for id in 0..num_threads {
        let barrier = Arc::clone(&barrier);
        handles.push(thread::spawn(move || {
            println!("Thread {id} doing phase 1 work...");
            barrier.wait(); // Blocks here until ALL 3 threads have called .wait().
            println!("Thread {id} starting phase 2 (everyone finished phase 1)!");
        }));
    }

    for h in handles { h.join().unwrap(); }
}
// All three "phase 1" lines print (in some order) BEFORE any "phase 2" line does.
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Condvar Barrier Scoping and Lifecycle Rules

**The mistake:** Assuming Condvar Barrier instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("condvar_barrier_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("condvar_barrier_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Condvar Barrier State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Condvar Barrier through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Condvar Barrier Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Condvar Barrier instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Choose the Right Primitive

**Problem:** You have 4 worker threads, each processing a chunk of a large dataset independently. Once all 4 have finished their chunk, and only then, the program should merge the results and print a summary. Which primitive fits best — `Condvar` or `Barrier` — and why?

> [!check]- Answer
> **`Barrier`.** This is exactly the "N independent tasks, wait for all of them to reach the same point" pattern `Barrier::new(4)` is designed for — each worker calls `.wait()` once its chunk is done, and all 4 calls unblock together only once the last one arrives. `Condvar` is better suited to a different shape of problem: one thread waiting for a specific, arbitrary *condition* to become true, potentially signaled repeatedly and asymmetrically by other threads — not a fixed "everyone rendezvous at this exact point" pattern.

---

### Exercise 2: Synchronizing Thread Phases with `Barrier`

**Problem:** Spawn 3 threads waiting at a `Barrier::new(3)` before executing phase 2.

**Expected output:**
> [!check]- Answer
> ```
> Phase 2 reached across threads
> ```
> ```rust
> use std::sync::{Arc, Barrier};
> use std::thread;
> fn main() {
>     let barrier = Arc::new(Barrier::new(3));
>     let mut handles = vec![];
>     for _ in 0..3 {
>         let b = Arc::clone(&barrier);
>         handles.push(thread::spawn(move || {
>             b.wait();
>         }));
>     }
>     for h in handles { h.join().unwrap(); }
>     println!("Phase 2 reached across threads");
> }
> ```
>
> **Explanation:** `Barrier` blocks executing threads until the specified target thread count reaches the barrier.

---

### Exercise 3: Signaling Condition Variables

**Problem:** Use `Condvar::notify_one()` to signal a waiting thread when a Boolean flag becomes `true`.

**Expected output:**
> [!check]- Answer
> ```
> Notified and resumed
> ```
> use std::sync::{Arc, Mutex, Condvar};
> fn main() {
>     let pair = Arc::new((Mutex::new(false), Condvar::new()));
>     let pair2 = Arc::clone(&pair);
>     std::thread::spawn(move || {
>         let (lock, cvar) = &*pair2;
>         let mut started = lock.lock().unwrap();
>         *started = true;
>         cvar.notify_one();
>     });
>     let (lock, cvar) = &*pair;
>     let mut started = lock.lock().unwrap();
>     while !*started { started = cvar.wait(started).unwrap(); }
>     println!("Notified and resumed");
> }
> ```
>
> **Explanation:** `Condvar` paired with `Mutex` signals state changes between worker thread tasks.

---

## 6. Related Terms

- [`Mutex<T>`](../level_09/mutex_t.md) — What `Condvar::wait` is always paired with; the lock it atomically releases while sleeping.
- [Channel (`mpsc`)](../level_09/channel_mpsc.md) — A higher-level alternative that often replaces manual `Condvar` usage for simple producer/consumer signaling.
- [`std::thread::spawn`](../level_09/std_thread_spawn.md) / [Scoped Threads](../level_09/scoped_threads.md) — The threads these primitives coordinate between.
- [`Arc<T>`](../level_03/arc_t.md) — Needed to share a `Mutex`/`Condvar`/`Barrier` across the multiple threads that use it.

---

## 7. Key Takeaways

- `Condvar` lets a thread efficiently sleep until explicitly notified, atomically releasing an associated `Mutex` lock while waiting — no busy-waiting required.
- Always re-check the wait condition in a `while` loop after waking, never a single `if`, to correctly handle spurious wakeups and `notify_all` races.
- `Barrier::new(n)` blocks every one of `n` threads at `.wait()` until all `n` have arrived, then releases them all together — the standard tool for phased, multi-thread rendezvous points.
- Both are lower-level primitives; channels (`mpsc`) or higher-level abstractions often solve the same coordination problems with less manual bookkeeping.
