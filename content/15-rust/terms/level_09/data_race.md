# Data Race

> **Level 9 — Concurrency & Parallelism**
> Simultaneous unsynchronized access where at least one is a write; impossible in safe Rust.

---

## 1. Prerequisites


- [`std::thread::spawn`](std_thread_spawn.md) — The function that introduces multiple threads (and thus the possibility of data races).
- [Ownership](../level_03/ownership.md) — The system Rust uses to prevent this bug.
- [`Mutex<T>`](mutex_t.md) — The tool used to synchronize access and prevent data races.

---

## 2. Term Category

**Undefined Behavior (Concurrency Flaw)**: A Data Race occurs when two or more concurrent threads access the exact same memory location without synchronization, and at least one access is a write.

---

## 3. Explanation

### (1) Design Motivation — "Why does this concept exist?"

In languages like C and C++, unsynchronized memory mutation across threads produces undefined behavior—often resulting in non-reproducible "Heisenbugs", memory corruption, and security vulnerabilities.

Rust's ownership and borrowing model (`&T` aliased XOR `&mut T` exclusive) combined with `Send` and `Sync` auto traits guarantee at compile time that **Data Races are impossible in Safe Rust**.

### (2) Reality Metaphor

Two blindfolded authors trying to edit the same sheet of paper simultaneously:
- Author A reads line 5 while Author B erases line 5 and writes new text over it.
- Author A reads half of the old string and half of the new string, resulting in corrupted gibberish.

### (3) Rust Code Examples

#### Compile-Time Data Race Prevention in Safe Rust
```rust
use std::thread;

fn main() {
    let mut data = vec![1, 2, 3];

    // Thread A attempts to mutate data
    // thread::spawn(move || { data.push(4); });

    // Thread B attempts to read data at the same time
    // thread::spawn(move || { println!("{:?}", data); }); // ❌ COMPILE ERROR! Borrow checker rejects aliased mutation!
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Confusing Low-Level "Data Races" with High-Level "Race Conditions"

**The mistake:** Assuming Rust's data-race-freedom guarantees that logic timing bugs (race conditions) cannot occur.

**Why it is wrong:** Safe Rust prevents low-level memory corruption (data races). However, high-level logical race conditions (e.g. TOCTOU: checking balance then withdrawing in separate mutex locks) can still happen in Safe Rust.

### Mistake 2: Assuming Multi-Step Atomic Operations Are Race-Condition Free

**The mistake:** Performing `val.load()` followed by `val.store()` across separate atomic calls and expecting atomic isolation.

**Why it is wrong:** Another thread can modify the atomic value between the `.load()` and `.store()` calls, creating a logical race condition.

*Incorrect:*
```rust
let current = atomic.load(Ordering::Relaxed);
atomic.store(current + 1, Ordering::Relaxed); // ❌ Race condition between load and store!
```

*Fix:*
```rust
atomic.fetch_add(1, Ordering::Relaxed); // Correct: Single atomic read-modify-write operation!
```

### Mistake 3: Bypassing Borrow Checker Rules with `unsafe` Raw Pointers (`*mut T`) across Threads

**The mistake:** Dereferencing raw pointers concurrently inside `unsafe` blocks without synchronization.

**Why it is wrong:** Bypassing compile-time borrow checker checks re-introduces C-style data races and undefined behavior into Rust.

---

## 5. Practice Exercises

### Exercise 1: High-Throughput Telemetry Aggregator (Lock-Free Data Race Prevention)

**Scenario:** Hundreds of concurrent worker threads process requests and must record telemetry metrics (total requests, error counts, active connections) without incurring heavy `Mutex` lock overhead or triggering unsynchronized data races.

**Requirements:**
1. Implement `TelemetryAggregator` using `AtomicU64` and `AtomicI64`.
2. Implement `record_request`, `connection_opened`, `connection_closed`, and `snapshot`.
3. Write unit tests validating lock-free multi-threaded metrics collection.

> [!check]- Answer
>
> #### Implementation
>
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
>         assert_eq!(snap.total_requests, 1000);
>         assert_eq!(snap.error_count, 200);
>         assert_eq!(snap.active_connections, 0);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Unsynchronized mutation (`counter++`) across threads causes data races and cache line corruption in languages like C/C++; Rust's borrow checker rejects shared `&mut T` to prevent this at compile time.
> 2. `AtomicU64` and `AtomicI64` wrap hardware atomic instructions, providing thread-safe interior mutability through shared references (`&self`).
> 3. `Ordering::Relaxed` handles metric increments without memory fences, while `Ordering::Acquire` synchronizes memory reads in `snapshot()`.
> 
---

### Exercise 2: Multi-Account Financial Ledger (Eliminating TOCTOU Race Conditions)

**Scenario:** Safe Rust prevents data races (memory corruption) but does not automatically eliminate high-level race conditions (logical bugs like TOCTOU).

**Requirements:**
1. Implement `AccountLedger` using `Arc<Mutex<AccountState>>`.
2. Implement `transfer_to` acquiring both locks in a single atomic scope to eliminate TOCTOU bugs.
3. Order lock acquisitions by account ID (`self_id < target_id`) to prevent AB-BA deadlocks.
4. Write unit tests validating transfer correctness and deadlock prevention.

> [!check]- Answer
>
> #### Implementation
>
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
>         for _ in 0..10 {
>             let a1 = acc1.clone();
>             let a2 = acc2.clone();
>             handles.push(thread::spawn(move || {
>                 let _ = a1.transfer_to(&a2, 50);
>             }));
>         }
> 
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
>         assert_eq!(acc1.balance(), 800);
>         assert_eq!(acc2.balance(), 1200);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Data races refer to unsynchronized memory corruption; race conditions refer to logical timing/ordering errors.
> 2. Holding locks for both accounts within a single critical section eliminates TOCTOU balance check races.
> 3. Sorting lock acquisitions by account ID (`self_id < target_id`) prevents AB-BA thread deadlocks.
> 
---

### Exercise 3: Dynamic Parallel Dispatch Pipeline with Auto-Trait Guards (`Send` & `Sync`)

**Scenario:** Building a thread-safe task processing engine where worker handles receive task items via channels and report processing status without data races.

**Requirements:**
1. Implement `ParallelPipeline` using `mpsc::channel` and `Arc<Mutex<Receiver<Task>>>`.
2. Cleanly shut down worker threads when task channels drop.
3. Write unit tests validating parallel task execution.

> [!check]- Answer
>
> #### Implementation
>
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
>                         Err(_) => break,
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
>         drop(result_tx);
> 
>         for task in tasks {
>             task_tx.send(task).unwrap();
>         }
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
>             Task { id: 1, payload: "alpha_data".to_string() },
>             Task { id: 2, payload: "invalid_payload".to_string() },
>             Task { id: 3, payload: "beta_data".to_string() },
>         ];
> 
>         let results = pipeline.execute_batch(tasks);
>         assert_eq!(results.len(), 3);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `Send` and `Sync` auto traits guarantee thread safety, preventing single-threaded types (`Rc`, `RefCell`) from crossing thread boundaries.
> 2. `Arc<Mutex<Receiver<Task>>>` allows multiple worker threads to safely pop task items from a shared channel.
> 3. Dropping `task_tx` closes the channel and signals worker threads to exit cleanly upon `Err(_)`.
> 
---

## 6. Related Terms


- [`Mutex<T>`](mutex_t.md) — The software tool that prevents Data Races by forcing threads to wait in a single-file line.
- [`Atomic` Types](atomic_types.md) — The hardware tool that prevents Data Races by performing math in a single, uninterruptible cycle.

---

## 7. Key Takeaways

- A **Data Race** happens when two threads access the exact same memory simultaneously, and at least one is writing.
- Safe Rust guarantees that Data Races are **impossible to compile**.
- Rust prevents them using Ownership, Borrowing (`&mut`), `Send`, and `Sync`.
- Data races (memory corruption) are distinct from **Race Conditions** (logical timing bugs).
