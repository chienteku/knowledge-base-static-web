# Data Race

> **Level 9 — Concurrency & Parallelism**
> Simultaneous unsynchronized access where at least one is a write; impossible in safe Rust.

---

## 1. Prerequisites

- [`std::thread::spawn`](../level_09/std_thread_spawn.md) — The function that introduces multiple threads (and thus the possibility of data races).
- [Ownership](../level_03/ownership.md) — The system Rust uses to prevent this bug.
- [`Mutex<T>`](../level_09/mutex_t.md) — The tool used to synchronize access and prevent data races.

---

## 2. Term Category

**Rust-nonspecific (the ultimate villain)**: A Data Race is widely considered the most terrifying, difficult-to-debug error in all of computer science. It occurs when two threads try to access the exact same piece of memory at the exact same microsecond, and at least one of them is modifying (writing to) that memory.

The entire Rust programming language was essentially created to mathematically eradicate this specific bug.

---

## 3. Explanation

### (1) Design Motivation — "Why does this concept exist?"

In C and C++, Data Races are a daily occurrence. They are often called "Heisenbugs" (named after the Heisenberg Uncertainty Principle)—they only happen 1 in 10,000 times based on microscopic, random variations in CPU timing and OS scheduling. 

Your code will work perfectly on your laptop 100 times in a row, pass every test, and then crash catastrophically in production once a month. Because the timing is random, they are nearly impossible to reproduce and fix.

Rust's strict Ownership system, the Borrow Checker (which only allows one `&mut` reference at a time), and the `Send`/`Sync` traits were all explicitly designed to guarantee at compile-time that a Data Race is physically impossible to compile.

### (2) Reality Metaphor

Imagine a giant chalkboard (the computer's memory). 

Two people (threads) are standing at the board, both wearing blindfolds. 
- Person A is running their fingers across the board to read a sentence. 
- At the exact same time, Person B takes an eraser, wipes away half the sentence, and writes a new one. 

Person A ends up reading half of the old sentence and half of the new sentence, resulting in absolute gibberish. That is a Data Race. The data is fundamentally corrupted because it was modified *while* it was being accessed.

### (3) Rust Code Examples

#### Short Snippet (The Attempt)
It is impossible to write a Data Race in Safe Rust. If you try, the Borrow Checker will instantly stop you!

```rust
use std::thread;

fn main() {
    let mut data = vec![1, 2, 3];

    // Thread A tries to write to the data
    thread::spawn(|| {
        data.push(4); // COMPILE ERROR!
    });

    // Thread B tries to read the data at the exact same time!
    thread::spawn(|| {
        println!("{:?}", data); // COMPILE ERROR!
    });
}
```
In C++, this compiles perfectly and crashes randomly. In Rust, the compiler screams because you are trying to use a variable after moving it, preventing the Data Race.

#### Fuller Example (The Bank Heist)
To understand why Data Races are so dangerous, let's look at the classic Banking example. This is what happens under the hood if a Data Race were allowed to occur when depositing money.

1. The Bank Account has **$0**.
2. Thread A and Thread B both want to deposit $100 at the exact same microsecond.
3. Thread A reads the balance. It sees **$0**.
4. Thread B reads the balance. It sees **$0**.
5. Thread A adds $100 to the $0 it saw, and writes **$100** to the database.
6. Thread B adds $100 to the $0 it saw, and writes **$100** to the database (overwriting Thread A!).
7. The total balance is **$100**. The other $100 vanished into thin air!

To prevent this, you must synchronize the access using a [`Mutex`](../level_09/mutex_t.md) or [`Atomic Types`](../level_09/atomic_types.md). By forcing the threads to take turns (synchronization), Thread B is forced to wait until Thread A finishes. Thread B will read the updated `$100`, add its own `$100`, and correctly write `$200`.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Data Race Scoping and Lifecycle Rules

**The mistake:** Assuming Data Race instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("data_race_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("data_race_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Data Race State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Data Race through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Data Race Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Data Race instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: High-Throughput Telemetry Aggregator (Lock-Free Data Race Prevention)

**Problem:**
You are building a high-throughput telemetry collector for a microservice framework. Hundreds of concurrent worker threads process requests and must record telemetry metrics (total requests, error counts, and active connections) without incurring the heavy locking overhead of a `Mutex`. In C/C++, unsynchronized incrementing of global variables from multiple threads causes severe data races and memory corruption. In Rust, direct mutation through shared references (`&T`) is prohibited by the borrow checker.

Implement a lock-free `TelemetryAggregator` struct using standard library atomic primitives (`std::sync::atomic::{AtomicU64, AtomicI64, Ordering}`) that allows safe concurrent updates behind shared immutable references (`&Self`), preventing data races at the CPU hardware level. Include a method to retrieve a snapshot of current metrics.


> [!check]- Answer
> ```rust
> use std::sync::atomic::{AtomicI64, AtomicU64, Ordering};
> use std::sync::Arc;
> use std::thread;
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct MetricsSnapshot {
>     pub total_requests: u64,
>     pub error_count: u64,
>     pub active_connections: i64,
> }
> 
> pub struct TelemetryAggregator {
>     total_requests: AtomicU64,
>     error_count: AtomicU64,
>     active_connections: AtomicI64,
> }
> 
> impl TelemetryAggregator {
>     pub fn new() -> Self {
>         Self {
>             total_requests: AtomicU64::new(0),
>             error_count: AtomicU64::new(0),
>             active_connections: AtomicI64::new(0),
>         }
>     }
> 
>     pub fn record_request(&self, is_error: bool) {
>         self.total_requests.fetch_add(1, Ordering::Relaxed);
>         if is_error {
>             self.error_count.fetch_add(1, Ordering::Relaxed);
>         }
>     }
> 
>     pub fn connection_opened(&self) {
>         self.active_connections.fetch_add(1, Ordering::Relaxed);
>     }
> 
>     pub fn connection_closed(&self) {
>         self.active_connections.fetch_sub(1, Ordering::Relaxed);
>     }
> 
>     pub fn snapshot(&self) -> MetricsSnapshot {
>         MetricsSnapshot {
>             total_requests: self.total_requests.load(Ordering::Acquire),
>             error_count: self.error_count.load(Ordering::Acquire),
>             active_connections: self.active_connections.load(Ordering::Acquire),
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_concurrent_telemetry_aggregation() {
>         let aggregator = Arc::new(TelemetryAggregator::new());
>         let mut handles = vec![];
> 
>         for thread_idx in 0..10 {
>             let agg = Arc::clone(&aggregator);
>             handles.push(thread::spawn(move || {
>                 for iter in 0..100 {
>                     agg.connection_opened();
>                     let is_err = (thread_idx + iter) % 5 == 0;
>                     agg.record_request(is_err);
>                     agg.connection_closed();
>                 }
>             }));
>         }
> 
>         for handle in handles {
>             handle.join().unwrap();
>         }
> 
>         let snap = aggregator.snapshot();
> 
>         // Comprehensive assertions using assert_eq!, assert!, assert_ne!, and matches!
>         assert_eq!(snap.total_requests, 1000);
>         assert_eq!(snap.error_count, 200);
>         assert_eq!(snap.active_connections, 0);
> 
>         assert!(snap.total_requests > snap.error_count);
>         assert_ne!(snap.total_requests, 0);
>         assert!(matches!(
>             snap,
>             MetricsSnapshot {
>                 total_requests: 1000,
>                 active_connections: 0,
>                 ..
>             }
>         ));
>     }
> }
> ```
> 
> **Key Concurrency & Memory Safety Analysis:**
> 1. **Why Normal Mutation Causes Data Races:** In C++, two threads executing `counter++` compile to three hardware instructions (`READ memory -> MODIFY register -> WRITE back memory`). When interleaved, writes overwrite each other (lost updates) or corrupt CPU cache lines. Rust's borrow checker rejects shared mutable references (`&mut T` behind multiple threads) to guarantee at compile time that unsynchronized writes cannot occur.
> 2. **Interior Mutability via Atomic Types:** `AtomicU64` and `AtomicI64` wrap hardware-level atomic instructions (such as `LOCK XADD` on x86-64). They provide *interior mutability*, allowing state modification through shared immutable references (`&self`) without triggering undefined behavior or data races.
> 3. **Memory Ordering Selection:**
>    - `Ordering::Relaxed` is used for individual increments (`fetch_add`) because only atomicity of the single counter is required, avoiding CPU memory bus fences.
>    - `Ordering::Acquire` is used in `snapshot()` to synchronize loads across cache boundaries so reads reflect preceding atomic writes across threads.

---

### Exercise 2: Multi-Account Financial Ledger (Eliminating TOCTOU Race Conditions)

**Problem:**
Safe Rust guarantees that low-level *data races* (memory corruption) are impossible. However, it does not automatically prevent high-level *race conditions* (logical bugs stemming from timing and improper synchronization granularity). 

Consider a banking system processing concurrent transfers between accounts. A common flaw is "Time-Of-Check To Time-Of-Use" (TOCTOU): checking an account balance in one lock scope, releasing the lock, and deducting funds in a subsequent lock scope. If another thread alters the balance in between, accounts can end up overdrawn (negative balances).

Implement a thread-safe `AccountLedger` system using `Arc<Mutex<AccountState>>`. Write a `transfer_to` method that acquires mutex locks for *both* accounts in a single atomic scope to eliminate TOCTOU bugs. Additionally, implement strict lock ordering based on unique account IDs to prevent deadlocks when concurrent threads transfer funds in opposite directions.

> [!check]- Answer
> ```rust
> use std::sync::{Arc, Mutex};
> use std::thread;
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum TransactionError {
>     InsufficientFunds { balance: u64, requested: u64 },
>     SameAccount,
> }
> 
> #[derive(Debug)]
> pub struct AccountState {
>     pub id: u64,
>     pub balance: u64,
> }
> 
> #[derive(Clone)]
> pub struct AccountLedger {
>     state: Arc<Mutex<AccountState>>,
> }
> 
> impl AccountLedger {
>     pub fn new(id: u64, initial_balance: u64) -> Self {
>         Self {
>             state: Arc::new(Mutex::new(AccountState {
>                 id,
>                 balance: initial_balance,
>             })),
>         }
>     }
> 
>     pub fn id(&self) -> u64 {
>         self.state.lock().unwrap().id
>     }
> 
>     pub fn balance(&self) -> u64 {
>         self.state.lock().unwrap().balance
>     }
> 
>     pub fn transfer_to(&self, target: &AccountLedger, amount: u64) -> Result<(), TransactionError> {
>         let self_id = self.id();
>         let target_id = target.id();
> 
>         if self_id == target_id {
>             return Err(TransactionError::SameAccount);
>         }
> 
>         // Ordered lock acquisition based on ID to prevent deadlocks
>         let (mut source_guard, mut target_guard) = if self_id < target_id {
>             let g1 = self.state.lock().unwrap();
>             let g2 = target.state.lock().unwrap();
>             (g1, g2)
>         } else {
>             let g2 = target.state.lock().unwrap();
>             let g1 = self.state.lock().unwrap();
>             (g1, g2)
>         };
> 
>         if source_guard.balance < amount {
>             return Err(TransactionError::InsufficientFunds {
>                 balance: source_guard.balance,
>                 requested: amount,
>             });
>         }
> 
>         source_guard.balance -= amount;
>         target_guard.balance += amount;
> 
>         Ok(())
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_concurrent_transfers_prevent_race_conditions() {
>         let acc1 = AccountLedger::new(1, 1000);
>         let acc2 = AccountLedger::new(2, 1000);
> 
>         let mut handles = vec![];
> 
>         // 10 threads transfer 50 from acc1 to acc2
>         for _ in 0..10 {
>             let a1 = acc1.clone();
>             let a2 = acc2.clone();
>             handles.push(thread::spawn(move || {
>                 let _ = a1.transfer_to(&a2, 50);
>             }));
>         }
> 
>         // 10 threads transfer 30 from acc2 to acc1 concurrently (opposite direction)
>         for _ in 0..10 {
>             let a1 = acc1.clone();
>             let a2 = acc2.clone();
>             handles.push(thread::spawn(move || {
>                 let _ = a2.transfer_to(&a1, 30);
>             }));
>         }
> 
>         for handle in handles {
>             handle.join().unwrap();
>         }
> 
>         // Net movement: 10 * 50 = 500 (acc1 -> acc2), 10 * 30 = 300 (acc2 -> acc1)
>         // acc1 final: 1000 - 500 + 300 = 800
>         // acc2 final: 1000 + 500 - 300 = 1200
>         assert_eq!(acc1.balance(), 800);
>         assert_eq!(acc2.balance(), 1200);
> 
>         assert_ne!(acc1.balance(), acc2.balance());
>         assert!(acc1.balance() + acc2.balance() == 2000);
> 
>         let failed_transfer = acc1.transfer_to(&acc2, 10000);
>         assert!(matches!(
>             failed_transfer,
>             Err(TransactionError::InsufficientFunds {
>                 balance: 800,
>                 requested: 10000
>             })
>         ));
>     }
> }
> ```
> 
> **Key Concurrency & Memory Safety Analysis:**
> 1. **Data Race vs. Race Condition:** Data races refer strictly to concurrent unsynchronized memory mutation (prevented at compile-time by Rust). Race conditions refer to flaws in execution ordering where individual operations are synchronized (e.g. locking balance, reading balance, unlocking balance, then locking again to withdraw), but the compound operation is non-atomic.
> 2. **Transactional Lock Scope:** Holding guards for both `source` and `target` inside `transfer_to` ensures that the balance check and subtraction happen atomically within the same critical section, preventing double-spend and TOCTOU bugs.
> 3. **Deadlock Prevention via ID Ordering:** If Thread A transfers from Account 1 to Account 2 while Thread B transfers from Account 2 to Account 1, un-ordered locking (`lock(1)` then `lock(2)` vs `lock(2)` then `lock(1)`) causes a classic AB-BA deadlock. Sorting lock acquisitions by account ID (`self_id < target_id`) enforces a strict total lock ordering hierarchy across threads.

---

### Exercise 3: Dynamic Parallel Dispatch Pipeline with Auto-Trait Guards (`Send` & `Sync`)

**Problem:**
You are architecture-designing a parallel worker pool system that processes batch jobs across OS threads. Attempting to share single-threaded types such as `std::rc::Rc` or `std::cell::RefCell` across threads results in compile error `E0277` because they are `!Send` and `!Sync`. Their internal reference counters and borrow flags lack hardware atomic protections; sharing them across threads would cause catastrophic data races.

Build a thread-safe `ParallelPipeline` using `std::sync::mpsc` channels and `Arc<Mutex<Receiver<Task>>>` to distribute tasks across worker threads. Ensure that worker handles exit cleanly when task channels close and results are aggregated back safely.

> [!check]- Answer
> ```rust
> use std::sync::mpsc::{self, Receiver, Sender};
> use std::sync::{Arc, Mutex};
> use std::thread;
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum TaskResult {
>     Success { task_id: u64, output: String },
>     Failure { task_id: u64, error: String },
> }
> 
> pub struct Task {
>     pub id: u64,
>     pub payload: String,
> }
> 
> pub struct ParallelPipeline {
>     worker_count: usize,
> }
> 
> impl ParallelPipeline {
>     pub fn new(worker_count: usize) -> Self {
>         Self { worker_count }
>     }
> 
>     pub fn execute_batch(&self, tasks: Vec<Task>) -> Vec<TaskResult> {
>         let (task_tx, task_rx) = mpsc::channel::<Task>();
>         let (result_tx, result_rx) = mpsc::channel::<TaskResult>();
> 
>         let shared_rx = Arc::new(Mutex::new(task_rx));
>         let mut workers = vec![];
> 
>         for _ in 0..self.worker_count {
>             let rx = Arc::clone(&shared_rx);
>             let tx = result_tx.clone();
> 
>             workers.push(thread::spawn(move || loop {
>                 let task = {
>                     let lock = rx.lock().unwrap();
>                     match lock.recv() {
>                         Ok(t) => t,
>                         Err(_) => break, // Channel closed and empty
>                     }
>                 };
> 
>                 let result = if task.payload.contains("invalid") {
>                     TaskResult::Failure {
>                         task_id: task.id,
>                         error: "Payload contains invalid data".to_string(),
>                     }
>                 } else {
>                     TaskResult::Success {
>                         task_id: task.id,
>                         output: task.payload.to_uppercase(),
>                     }
>                 };
> 
>                 tx.send(result).unwrap();
>             }));
>         }
> 
>         // Drop the extra result_tx handle owned by main thread
>         drop(result_tx);
> 
>         // Dispatch all tasks to worker threads
>         for task in tasks {
>             task_tx.send(task).unwrap();
>         }
>         // Dropping task_tx closes the channel, signaling workers to terminate when work is complete
>         drop(task_tx);
> 
>         for worker in workers {
>             worker.join().unwrap();
>         }
> 
>         let mut results = vec![];
>         while let Ok(res) = result_rx.recv() {
>             results.push(res);
>         }
> 
>         results
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_parallel_pipeline_execution() {
>         let pipeline = ParallelPipeline::new(4);
> 
>         let tasks = vec![
>             Task {
>                 id: 1,
>                 payload: "alpha_data".to_string(),
>             },
>             Task {
>                 id: 2,
>                 payload: "invalid_payload".to_string(),
>             },
>             Task {
>                 id: 3,
>                 payload: "beta_data".to_string(),
>             },
>         ];
> 
>         let results = pipeline.execute_batch(tasks);
> 
>         assert_eq!(results.len(), 3);
>         assert_ne!(results.len(), 0);
> 
>         let success_count = results
>             .iter()
>             .filter(|r| matches!(r, TaskResult::Success { .. }))
>             .count();
>         let failure_count = results
>             .iter()
>             .filter(|r| matches!(r, TaskResult::Failure { .. }))
>             .count();
> 
>         assert_eq!(success_count, 2);
>         assert_eq!(failure_count, 1);
>         assert!(results
>             .iter()
>             .any(|r| matches!(r, TaskResult::Success { task_id: 1, .. })));
>     }
> }
> ```
> 
> **Key Concurrency & Memory Safety Analysis:**
> 1. **Auto-Traits `Send` and `Sync`:** `Send` indicates a type can transfer ownership across thread boundaries; `Sync` indicates `&T` can be shared between threads safely. Safe Rust uses these marker traits to forbid data races at compile time.
> 2. **Why `Rc` and `RefCell` fail:** `Rc<T>` non-atomically increments its reference count on clone/drop. If shared across threads, interleaved counter updates cause data races and memory leaks/use-after-free bugs. Rust marks `Rc` as `!Send` and `!Sync`. Replacing `Rc` with `Arc` (atomic reference counting) and `RefCell` with `Mutex` restores `Send` and `Sync` bounds.
> 3. **Channel Dispatch & Shutdown Invariants:** Wrapping `mpsc::Receiver` in `Arc<Mutex<Receiver<Task>>>` allows workers to pull tasks safely without competing unsynchronized for channel buffers. Dropping `task_tx` on the producer thread closes the channel, allowing worker threads to cleanly exit their `recv()` loop upon `Err(_)` and terminate without deadlocks.

---

## 6. Related Terms

- [`Mutex<T>`](../level_09/mutex_t.md) — The software tool that prevents Data Races by forcing threads to wait in a single-file line.
- [`Atomic` Types](../level_09/atomic_types.md) — The hardware tool that prevents Data Races by performing math in a single, uninterruptible cycle.

---

## 7. Key Takeaways

- A **Data Race** happens when two threads access the exact same memory simultaneously, and at least one is writing.
- They cause silent, unpredictable memory corruption that is nearly impossible to reproduce or debug.
- Safe Rust guarantees that Data Races are **impossible to compile**.
- Rust prevents them using the core concepts of Ownership, Borrowing (`&mut`), `Send`, and `Sync`.
- A Data Race (memory corruption) is different from a **Race Condition** (a logical timing bug). Rust does *not* prevent Race Conditions.
