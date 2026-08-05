# `Mutex<T>`

> **Level 9 — Concurrency & Parallelism**
> Mutual exclusion lock; provides interior mutability across threads.

---

## 1. Prerequisites


- [Interior Mutability](../level_03/interior_mutability.md) — The ability to mutate data even when you only have an immutable reference to it.
- [`RefCell<T>`](../level_03/refcell_t.md) — The single-threaded version of this concept.
- [`Sync` Trait](sync_trait.md) — The trait that proves a type is safe to share across threads.

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

---

## 5. Practice Exercises

### Exercise 1: Resilient Multi-Threaded Task Pipeline with Poisoning Recovery

**Problem:** In high-throughput background worker systems, multiple threads process jobs from a shared task queue guarded by `Arc<Mutex<VecDeque<Task>>>`. If a worker thread panics mid-task while holding the lock guard, the `Mutex` becomes *poisoned*. Calling `.lock().unwrap()` on subsequent threads will trigger cascading panics across the entire worker pool.

Design a thread-safe `ResilientTaskQueue` that:
1. Wraps a task queue `VecDeque<Task>` and a dead-letter queue `Vec<Task>` in `Arc<Mutex<...>>`.
2. Implements `push(&self, task: Task)` to enqueue tasks safely.
3. Implements `pop_or_recover(&self) -> Option<Task>`: when `.lock()` returns `Err(PoisonError)`, recovers the lock guard via `err.into_inner()` to salvage state without crashing.
4. Implements `record_dead_letter(&self, task: Task)` to log failed jobs to the dead-letter queue under poison-resilient locking.
5. Includes a comprehensive unit test suite in `#[cfg(test)] mod tests` verifying multi-threaded enqueuing, panic recovery, and dead-letter count assertions.

> [!check]- Answer
> ```rust
> use std::collections::VecDeque;
> use std::sync::{Arc, Mutex};
> use std::thread;
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct Task {
>     pub id: u64,
>     pub payload: String,
> }
> 
> pub struct ResilientTaskQueue {
>     queue: Arc<Mutex<VecDeque<Task>>>,
>     dead_letter: Arc<Mutex<Vec<Task>>>,
> }
> 
> impl ResilientTaskQueue {
>     pub fn new() -> Self {
>         Self {
>             queue: Arc::new(Mutex::new(VecDeque::new())),
>             dead_letter: Arc::new(Mutex::new(Vec::new())),
>         }
>     }
> 
>     pub fn push(&self, task: Task) {
>         let mut guard = match self.queue.lock() {
>             Ok(g) => g,
>             Err(p) => p.into_inner(),
>         };
>         guard.push_back(task);
>     }
> 
>     pub fn pop_or_recover(&self) -> Option<Task> {
>         let mut guard = match self.queue.lock() {
>             Ok(g) => g,
>             Err(p) => p.into_inner(),
>         };
>         guard.pop_front()
>     }
> 
>     pub fn record_dead_letter(&self, task: Task) {
>         let mut guard = match self.dead_letter.lock() {
>             Ok(g) => g,
>             Err(p) => p.into_inner(),
>         };
>         guard.push(task);
>     }
> 
>     pub fn dead_letter_count(&self) -> usize {
>         let guard = match self.dead_letter.lock() {
>             Ok(g) => g,
>             Err(p) => p.into_inner(),
>         };
>         guard.len()
>     }
> 
>     pub fn queue_len(&self) -> usize {
>         let guard = match self.queue.lock() {
>             Ok(g) => g,
>             Err(p) => p.into_inner(),
>         };
>         guard.len()
>     }
> 
>     pub fn is_poisoned(&self) -> bool {
>         self.queue.is_poisoned()
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
>     use std::sync::Arc;
>     use std::thread;
> 
>     #[test]
>     fn test_concurrent_enqueue_dequeue() {
>         let queue = Arc::new(ResilientTaskQueue::new());
>         let mut handles = vec![];
> 
>         for t_id in 0..4 {
>             let q_clone = Arc::clone(&queue);
>             handles.push(thread::spawn(move || {
>                 for i in 0..25 {
>                     q_clone.push(Task {
>                         id: t_id * 100 + i,
>                         payload: format!("data_{}_{}", t_id, i),
>                     });
>                 }
>             }));
>         }
> 
>         for h in handles {
>             h.join().unwrap();
>         }
> 
>         assert_eq!(queue.queue_len(), 100);
> 
>         let queue_consumer = Arc::clone(&queue);
>         let consumer_handle = thread::spawn(move || {
>             let mut count = 0;
>             while let Some(_task) = queue_consumer.pop_or_recover() {
>                 count += 1;
>             }
>             count
>         });
> 
>         let consumed = consumer_handle.join().unwrap();
>         assert_eq!(consumed, 100);
>         assert_eq!(queue.queue_len(), 0);
>     }
> 
>     #[test]
>     fn test_poison_recovery_and_dead_letter() {
>         let queue = Arc::new(ResilientTaskQueue::new());
>         queue.push(Task { id: 1, payload: "initial".into() });
> 
>         let q_clone = Arc::clone(&queue);
>         let panic_handle = thread::spawn(move || {
>             let _guard = q_clone.queue.lock().unwrap();
>             panic!("Intentional worker crash while holding lock guard");
>         });
> 
>         assert!(panic_handle.join().is_err());
>         assert!(queue.is_poisoned(), "Mutex should be poisoned after thread panic");
> 
>         // Recover from poisoned mutex using into_inner()
>         let popped = queue.pop_or_recover();
>         assert!(popped.is_some());
>         assert_eq!(popped.unwrap().id, 1);
> 
>         queue.record_dead_letter(Task { id: 99, payload: "failed_job".into() });
>         assert_eq!(queue.dead_letter_count(), 1);
>     }
> }
> ```
>
> **Step-by-step Explanation:**
> 1. **Understanding Mutex Poisoning:** In Rust, if a thread holding a `MutexGuard` panics, the `Mutex` is marked as *poisoned* to prevent unhandled corrupt state from propagating silently.
> 2. **Poison Error Handling:** Calling `.lock()` on a poisoned mutex returns `Err(PoisonError<MutexGuard<T>>)`. Calling `err.into_inner()` retrieves the underlying `MutexGuard`, allowing the program to safely inspect or clean up data without crashing.
> 3. **Concurrency Safety:** Combining `Arc` with `Mutex` allows safe multi-threaded sharing (`Send` + `Sync`). The `pop_or_recover()` method guarantees that task worker loops remain resilient even when individual jobs crash.

---

### Exercise 2: Non-Blocking Telemetry Aggregator using `try_lock()` Fallback Buffers

**Problem:** High-frequency logging and metric systems cannot tolerate thread blockages caused by `.lock()` contention on every single telemetry event. To achieve predictable execution time, workers attempt non-blocking lock acquisition with `try_lock()`. If `try_lock()` returns `TryLockError::WouldBlock`, event updates are written to a thread-local buffer and later flushed in batches when contention clears.

Implement `NonBlockingCollector`:
1. Wraps `Arc<Mutex<TelemetryStats>>` tracking event count, error count, and cumulative latency.
2. Implements `record(&self, latency_ms: u64, is_error: bool) -> bool`: attempts `try_lock()`. Returns `true` if locked and updated immediately, `false` if blocked.
3. Implements `flush_fallback_batch(&self, batch: &[(u64, bool)]) -> usize`: locks the mutex (recovering if poisoned) and applies all buffered events in a single operation.
4. Includes unit tests in `#[cfg(test)] mod tests` verifying non-blocking `try_lock()` behavior under artificial lock contention, batch flushing, and metric snapshot consistency.

> [!check]- Answer
> ```rust
> use std::sync::{Arc, Mutex, TryLockError};
> use std::thread;
> use std::time::Duration;
> 
> #[derive(Debug, Default, PartialEq, Eq)]
> pub struct TelemetryStats {
>     pub total_events: u64,
>     pub total_errors: u64,
>     pub cumulative_latency_ms: u64,
> }
> 
> pub struct NonBlockingCollector {
>     stats: Arc<Mutex<TelemetryStats>>,
> }
> 
> impl NonBlockingCollector {
>     pub fn new() -> Self {
>         Self {
>             stats: Arc::new(Mutex::new(TelemetryStats::default())),
>         }
>     }
> 
>     pub fn record(&self, latency_ms: u64, is_error: bool) -> bool {
>         match self.stats.try_lock() {
>             Ok(mut guard) => {
>                 guard.total_events += 1;
>                 if is_error {
>                     guard.total_errors += 1;
>                 }
>                 guard.cumulative_latency_ms += latency_ms;
>                 true
>             }
>             Err(TryLockError::WouldBlock) => false,
>             Err(TryLockError::Poisoned(p)) => {
>                 let mut guard = p.into_inner();
>                 guard.total_events += 1;
>                 if is_error {
>                     guard.total_errors += 1;
>                 }
>                 guard.cumulative_latency_ms += latency_ms;
>                 true
>             }
>         }
>     }
> 
>     pub fn flush_fallback_batch(&self, batch: &[(u64, bool)]) -> usize {
>         let mut guard = match self.stats.lock() {
>             Ok(g) => g,
>             Err(p) => p.into_inner(),
>         };
> 
>         for &(latency_ms, is_error) in batch {
>             guard.total_events += 1;
>             if is_error {
>                 guard.total_errors += 1;
>             }
>             guard.cumulative_latency_ms += latency_ms;
>         }
> 
>         batch.len()
>     }
> 
>     pub fn snapshot(&self) -> TelemetryStats {
>         let guard = match self.stats.lock() {
>             Ok(g) => g,
>             Err(p) => p.into_inner(),
>         };
>         TelemetryStats {
>             total_events: guard.total_events,
>             total_errors: guard.total_errors,
>             cumulative_latency_ms: guard.cumulative_latency_ms,
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
>     use std::sync::Arc;
>     use std::thread;
>     use std::time::Duration;
> 
>     #[test]
>     fn test_try_lock_success_and_contention() {
>         let collector = Arc::new(NonBlockingCollector::new());
> 
>         let success = collector.record(15, false);
>         assert!(success, "record should succeed when lock is available");
>         assert_eq!(collector.snapshot().total_events, 1);
> 
>         // Hold lock in background thread to simulate contention
>         let stats_clone = Arc::clone(&collector.stats);
>         let lock_holder = thread::spawn(move || {
>             let _guard = stats_clone.lock().unwrap();
>             thread::sleep(Duration::from_millis(50));
>         });
> 
>         thread::sleep(Duration::from_millis(10));
> 
>         // try_lock fails under contention
>         let contended = collector.record(25, true);
>         assert!(!contended, "record should return false when lock is held");
> 
>         lock_holder.join().unwrap();
> 
>         // Record succeeds once lock is released
>         let after_release = collector.record(30, false);
>         assert!(after_release);
>     }
> 
>     #[test]
>     fn test_fallback_batch_flushing() {
>         let collector = NonBlockingCollector::new();
>         let batch = vec![(10, false), (20, true), (30, false)];
> 
>         let count = collector.flush_fallback_batch(&batch);
>         assert_eq!(count, 3);
> 
>         let snap = collector.snapshot();
>         assert_eq!(snap.total_events, 3);
>         assert_eq!(snap.total_errors, 1);
>         assert_eq!(snap.cumulative_latency_ms, 60);
>     }
> }
> ```
>
> **Step-by-step Explanation:**
> 1. **Non-Blocking Lock Acquisition:** `Mutex::try_lock()` attempts to acquire exclusive access immediately. If another thread holds the lock, it immediately returns `Err(TryLockError::WouldBlock)` without causing the calling thread to sleep.
> 2. **Performance Trade-offs:** High-performance systems use `try_lock()` to avoid thread context switching overhead on critical execution paths.
> 3. **Batch Aggregation:** When direct acquisition fails, records buffered locally can be flushed in bulk using `flush_fallback_batch()`, amortizing lock acquisition cost across multiple metric events.

---

### Exercise 3: Deadlock-Free Multi-Resource Transfers with Ordered Lock Acquisition

**Problem:** When two or more threads attempt to acquire locks on multiple `Mutex`-guarded resources in non-uniform orders (e.g. Thread 1 locks Account A then B, while Thread 2 locks Account B then A), a **Deadlock** can freeze both threads permanently.

Implement a deadlock-free bank transaction ledger:
1. Define `Account` containing `id: u64` and `balance: u64`.
2. Implement `BankLedger::transfer(acc_a: &Arc<Mutex<Account>>, acc_b: &Arc<Mutex<Account>>, amount: u64) -> Result<(), &'static str>`:
   - Compare memory addresses using `Arc::as_ptr()` to establish a strict deterministic lock ordering (locking the lower memory address first, then higher address second).
   - Guard against self-transfers (`Arc::ptr_eq` or matching IDs) and check balance sufficiency.
3. Includes unit tests in `#[cfg(test)] mod tests` running 20 concurrent threads performing bidirectional transfers (A -> B and B -> A) simultaneously, asserting zero deadlocks and total ledger balance invariant preservation (`assert_eq!`).

> [!check]- Answer
> ```rust
> use std::sync::{Arc, Mutex};
> use std::thread;
> 
> #[derive(Debug)]
> pub struct Account {
>     pub id: u64,
>     pub balance: u64,
> }
> 
> pub struct BankLedger;
> 
> impl BankLedger {
>     pub fn transfer(
>         acc_a: &Arc<Mutex<Account>>,
>         acc_b: &Arc<Mutex<Account>>,
>         amount: u64,
>     ) -> Result<(), &'static str> {
>         if Arc::ptr_eq(acc_a, acc_b) {
>             return Err("Cannot transfer to self");
>         }
> 
>         // Deterministic lock acquisition order based on memory address
>         let a_ptr = Arc::as_ptr(acc_a) as usize;
>         let b_ptr = Arc::as_ptr(acc_b) as usize;
> 
>         let (mut guard_a, mut guard_b) = if a_ptr < b_ptr {
>             let g_a = acc_a.lock().map_err(|_| "Poisoned lock")?;
>             let g_b = acc_b.lock().map_err(|_| "Poisoned lock")?;
>             (g_a, g_b)
>         } else {
>             let g_b = acc_b.lock().map_err(|_| "Poisoned lock")?;
>             let g_a = acc_a.lock().map_err(|_| "Poisoned lock")?;
>             (g_a, g_b)
>         };
> 
>         if guard_a.id == guard_b.id {
>             return Err("Cannot transfer to self");
>         }
> 
>         if guard_a.balance < amount {
>             return Err("Insufficient funds");
>         }
> 
>         guard_a.balance -= amount;
>         guard_b.balance += amount;
> 
>         Ok(())
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
>     use std::sync::Arc;
>     use std::thread;
> 
>     #[test]
>     fn test_concurrent_transfers_no_deadlock() {
>         let acc1 = Arc::new(Mutex::new(Account { id: 1, balance: 1000 }));
>         let acc2 = Arc::new(Mutex::new(Account { id: 2, balance: 1000 }));
> 
>         let initial_total = acc1.lock().unwrap().balance + acc2.lock().unwrap().balance;
>         assert_eq!(initial_total, 2000);
> 
>         let mut handles = vec![];
> 
>         // Spawn 10 threads transferring acc1 -> acc2
>         for _ in 0..10 {
>             let a = Arc::clone(&acc1);
>             let b = Arc::clone(&acc2);
>             handles.push(thread::spawn(move || {
>                 for _ in 0..100 {
>                     let _ = BankLedger::transfer(&a, &b, 5);
>                 }
>             }));
>         }
> 
>         // Spawn 10 threads transferring acc2 -> acc1
>         for _ in 0..10 {
>             let a = Arc::clone(&acc1);
>             let b = Arc::clone(&acc2);
>             handles.push(thread::spawn(move || {
>                 for _ in 0..100 {
>                     let _ = BankLedger::transfer(&b, &a, 5);
>                 }
>             }));
>         }
> 
>         for h in handles {
>             h.join().unwrap();
>         }
> 
>         let final_b1 = acc1.lock().unwrap().balance;
>         let final_b2 = acc2.lock().unwrap().balance;
>         assert_eq!(final_b1 + final_b2, 2000, "Total monetary balance invariant must be preserved");
>     }
> 
>     #[test]
>     fn test_self_transfer_and_insufficient_funds() {
>         let acc1 = Arc::new(Mutex::new(Account { id: 10, balance: 50 }));
>         let acc2 = Arc::new(Mutex::new(Account { id: 20, balance: 500 }));
> 
>         let self_res = BankLedger::transfer(&acc1, &acc1, 10);
>         assert!(self_res.is_err());
>         assert_eq!(self_res.unwrap_err(), "Cannot transfer to self");
> 
>         let overdraft_res = BankLedger::transfer(&acc1, &acc2, 100);
>         assert!(overdraft_res.is_err());
>         assert_eq!(overdraft_res.unwrap_err(), "Insufficient funds");
> 
>         assert_eq!(acc1.lock().unwrap().balance, 50);
>         assert_eq!(acc2.lock().unwrap().balance, 500);
>     }
> }
> ```
>
> **Step-by-step Explanation:**
> 1. **The Cause of Deadlocks:** Deadlocks occur when circular waiting occurs among threads holding locks. If Thread A holds Lock 1 and requests Lock 2, while Thread B holds Lock 2 and requests Lock 1, neither thread can proceed.
> 2. **Global Lock Ordering Strategy:** A standard method to prevent deadlocks is acquiring multiple locks in a global total order. By converting `Arc::as_ptr()` pointer addresses to integers (`usize`), both threads lock lower-addressed Mutexes before higher-addressed Mutexes regardless of parameter order.
> 3. **Invariant Protection:** Holding both mutex guards within the scope of `BankLedger::transfer` ensures atomic transfer between accounts while guaranteeing invariant balance conservation (`acc1.balance + acc2.balance == total`).

---

## 6. Related Terms


- [`Arc<T>`](../level_03/arc_t.md) — The `Arc` shares the Mutex; the Mutex mutates the data. They are best friends (`Arc<Mutex<T>>`).
- [`RwLock<T>`](rwlock_t.md) — The faster cousin of `Mutex` that allows multiple readers to read the data simultaneously, but still restricts writing to one thread at a time.
- [`RefCell<T>`](../level_03/refcell_t.md) — The single-threaded version of `Mutex`.
- [Interior Mutability](../level_03/interior_mutability.md) — Related concept: Interior Mutability.
- [`Atomic` Types](atomic_types.md) — Related concept: `Atomic` Types.
- [`Condvar` & `Barrier`](condvar_barrier.md) — Related concept: `Condvar` & `Barrier`.
- [Data Race](data_race.md) — Related concept: Data Race.
- [`OnceCell` / `OnceLock` / `LazyLock` / `LazyCell`](oncelock_lazylock.md) — Related concept: `OnceCell` / `OnceLock` / `LazyLock` / `LazyCell`.
- [RAII (Resource Acquisition Is Initialization)](../level_18/raii.md) — Related concept: RAII (Resource Acquisition Is Initialization).

---

## 7. Key Takeaways

- **`Mutex<T>`** (Mutual Exclusion) ensures only one thread can access the inner data at a time.
- It provides thread-safe Interior Mutability, allowing multiple threads to safely mutate shared data.
- You access the data by calling **`.lock().unwrap()`**.
- When the returned lock guard goes out of scope, the Mutex is automatically unlocked for the next thread.
- It is almost always combined with `Arc` (e.g., `Arc<Mutex<i32>>`).
- Rust guarantees no Data Races, but you can still cause permanent program freezes (Deadlocks)!
