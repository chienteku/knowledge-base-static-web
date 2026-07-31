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

---

## 5. Practice Exercises

### Exercise 1: Lock-Free Concurrency Guard and Rate Limiter

**Problem:** Build a lock-free rate limiter and active connection manager for an API gateway using `AtomicUsize`. The rate limiter must enforce a maximum limit of active concurrent connections (`max_conns`) without using software locks (`Mutex`). 

Implement `LockFreeRateLimiter` with:
1. `try_acquire(&self) -> Result<AcquiredGuard, RateLimiterError>`: Uses a Compare-And-Swap (CAS) loop with `compare_exchange_weak` to atomically check if `active_conns < max_conns`. If true, it increments `active_conns` and returns an `AcquiredGuard`. If full, it atomically increments `rejected_requests` and returns `Err(RateLimiterError::CapacityExceeded)`.
2. An `AcquiredGuard` struct implementing `Drop` that atomically decrements `active_conns` via `fetch_sub(1, Ordering::SeqCst)` when it leaves scope.
3. Thread-safe tracking of total successful requests (`total_requests`) and rejected requests (`rejected_requests`).

Include unit tests in `#[cfg(test)] mod tests` verifying capacity limits, drop cleanup, and multithreaded burst safety using `assert_eq!`, `assert!`, and `assert_ne!`.

> [!check]- Answer
> ```rust
> use std::sync::atomic::{AtomicUsize, Ordering};
> use std::sync::Arc;
> use std::thread;
> use std::time::Duration;
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum RateLimiterError {
>     CapacityExceeded,
> }
> 
> pub struct LockFreeRateLimiter {
>     active_conns: AtomicUsize,
>     total_requests: AtomicUsize,
>     rejected_requests: AtomicUsize,
>     max_conns: usize,
> }
> 
> pub struct AcquiredGuard<'a> {
>     limiter: &'a LockFreeRateLimiter,
> }
> 
> impl Drop for AcquiredGuard<'_> {
>     fn drop(&mut self) {
>         self.limiter.active_conns.fetch_sub(1, Ordering::SeqCst);
>     }
> }
> 
> impl LockFreeRateLimiter {
>     pub fn new(max_conns: usize) -> Self {
>         Self {
>             active_conns: AtomicUsize::new(0),
>             total_requests: AtomicUsize::new(0),
>             rejected_requests: AtomicUsize::new(0),
>             max_conns,
>         }
>     }
> 
>     pub fn try_acquire(&self) -> Result<AcquiredGuard, RateLimiterError> {
>         let mut current = self.active_conns.load(Ordering::SeqCst);
>         loop {
>             if current >= self.max_conns {
>                 self.rejected_requests.fetch_add(1, Ordering::SeqCst);
>                 return Err(RateLimiterError::CapacityExceeded);
>             }
>             match self.active_conns.compare_exchange_weak(
>                 current,
>                 current + 1,
>                 Ordering::SeqCst,
>                 Ordering::SeqCst,
>             ) {
>                 Ok(_) => {
>                     self.total_requests.fetch_add(1, Ordering::SeqCst);
>                     return Ok(AcquiredGuard { limiter: self });
>                 }
>                 Err(actual) => {
>                     current = actual;
>                 }
>             }
>         }
>     }
> 
>     pub fn active_connections(&self) -> usize {
>         self.active_conns.load(Ordering::SeqCst)
>     }
> 
>     pub fn total_requests(&self) -> usize {
>         self.total_requests.load(Ordering::SeqCst)
>     }
> 
>     pub fn rejected_requests(&self) -> usize {
>         self.rejected_requests.load(Ordering::SeqCst)
>     }
> }
> 
> fn main() {
>     let limiter = Arc::new(LockFreeRateLimiter::new(3));
>     let mut handles = vec![];
> 
>     for i in 0..10 {
>         let limiter_clone = Arc::clone(&limiter);
>         let h = thread::spawn(move || {
>             match limiter_clone.try_acquire() {
>                 Ok(_guard) => {
>                     thread::sleep(Duration::from_millis(50));
>                     println!("Thread {} acquired slot successfully", i);
>                 }
>                 Err(_) => {
>                     println!("Thread {} rate limited", i);
>                 }
>             }
>         });
>         handles.push(h);
>     }
> 
>     for h in handles {
>         h.join().unwrap();
>     }
> 
>     println!("Total requests: {}", limiter.total_requests());
>     println!("Rejected requests: {}", limiter.rejected_requests());
>     println!("Active connections: {}", limiter.active_connections());
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_rate_limiter_capacity_enforcement() {
>         let limiter = LockFreeRateLimiter::new(2);
>         let g1 = limiter.try_acquire();
>         let g2 = limiter.try_acquire();
>         let g3 = limiter.try_acquire();
> 
>         assert!(g1.is_ok());
>         assert!(g2.is_ok());
>         assert_eq!(g3.err(), Some(RateLimiterError::CapacityExceeded));
>         assert_eq!(limiter.active_connections(), 2);
>         assert_eq!(limiter.rejected_requests(), 1);
> 
>         drop(g1);
>         assert_eq!(limiter.active_connections(), 1);
> 
>         let g4 = limiter.try_acquire();
>         assert!(g4.is_ok());
>         assert_eq!(limiter.active_connections(), 2);
>         assert_eq!(limiter.total_requests(), 3);
>     }
> 
>     #[test]
>     fn test_concurrent_traffic_burst() {
>         let limiter = Arc::new(LockFreeRateLimiter::new(5));
>         let mut handles = vec![];
> 
>         for _ in 0..20 {
>             let lim = Arc::clone(&limiter);
>             handles.push(thread::spawn(move || {
>                 if let Ok(_guard) = lim.try_acquire() {
>                     thread::sleep(Duration::from_millis(10));
>                 }
>             }));
>         }
> 
>         for h in handles {
>             h.join().unwrap();
>         }
> 
>         assert_eq!(limiter.active_connections(), 0);
>         assert_eq!(limiter.total_requests() + limiter.rejected_requests(), 20);
>     }
> }
> ```
>
> **Step-by-Step Explanation:**
> 1. **Atomic CAS Loop (`compare_exchange_weak`)**: Instead of blocking OS threads with a `Mutex`, `try_acquire` reads the current value into `current`, validates `current < max_conns`, and attempts an atomic swap. If another thread mutated `active_conns` concurrently, `compare_exchange_weak` returns `Err(actual)`, updating `current` to retry immediately.
> 2. **RAII Guard Cleanup (`Drop`)**: `AcquiredGuard` implements `Drop` to ensure `active_conns.fetch_sub(1, Ordering::SeqCst)` is executed whenever the guard leaves scope, even if worker logic panics.
> 3. **Lock-Free Request Metrics**: Both `total_requests` and `rejected_requests` are modified using atomic `fetch_add` operations, guaranteeing strict thread safety and lock-free hardware speed.

---

### Exercise 2: Lock-Free State Machine and Optimistic Peak Memory Aggregator

**Problem:** Build an execution task state machine and concurrent memory metric aggregator using `AtomicU8` and `AtomicUsize`.

Implement `TaskStateTracker` with:
1. State management using `AtomicU8` representing discrete execution states (`STATE_IDLE = 0`, `STATE_RUNNING = 1`, `STATE_PAUSED = 2`, `STATE_STOPPED = 3`).
2. `try_transition(&self, current: u8, next: u8) -> Result<u8, u8>` using `compare_exchange` to ensure state transitions occur atomically without race conditions.
3. `update_peak_memory(&self, val: usize)`: Optimistically tracks the maximum memory observed across all threads by executing a CAS retry loop (`compare_exchange_weak`) until `peak_memory_mb` is at least `val`.
4. Unit tests in `#[cfg(test)] mod tests` verifying transition validity, invalid transition rejections, and lock-free maximum value calculation under concurrent updates.

> [!check]- Answer
> ```rust
> use std::sync::atomic::{AtomicU8, AtomicUsize, Ordering};
> use std::sync::Arc;
> use std::thread;
> 
> pub const STATE_IDLE: u8 = 0;
> pub const STATE_RUNNING: u8 = 1;
> pub const STATE_PAUSED: u8 = 2;
> pub const STATE_STOPPED: u8 = 3;
> 
> pub struct TaskStateTracker {
>     state: AtomicU8,
>     peak_memory_mb: AtomicUsize,
>     transition_count: AtomicUsize,
> }
> 
> impl TaskStateTracker {
>     pub fn new() -> Self {
>         Self {
>             state: AtomicU8::new(STATE_IDLE),
>             peak_memory_mb: AtomicUsize::new(0),
>             transition_count: AtomicUsize::new(0),
>         }
>     }
> 
>     pub fn current_state(&self) -> u8 {
>         self.state.load(Ordering::SeqCst)
>     }
> 
>     pub fn peak_memory(&self) -> usize {
>         self.peak_memory_mb.load(Ordering::SeqCst)
>     }
> 
>     pub fn transition_count(&self) -> usize {
>         self.transition_count.load(Ordering::SeqCst)
>     }
> 
>     pub fn try_transition(&self, current: u8, next: u8) -> Result<u8, u8> {
>         match self.state.compare_exchange(
>             current,
>             next,
>             Ordering::SeqCst,
>             Ordering::SeqCst,
>         ) {
>             Ok(prev) => {
>                 self.transition_count.fetch_add(1, Ordering::SeqCst);
>                 Ok(prev)
>             }
>             Err(actual) => Err(actual),
>         }
>     }
> 
>     pub fn update_peak_memory(&self, val: usize) {
>         let mut current = self.peak_memory_mb.load(Ordering::SeqCst);
>         while val > current {
>             match self.peak_memory_mb.compare_exchange_weak(
>                 current,
>                 val,
>                 Ordering::SeqCst,
>                 Ordering::SeqCst,
>             ) {
>                 Ok(_) => break,
>                 Err(actual) => current = actual,
>             }
>         }
>     }
> }
> 
> fn main() {
>     let tracker = Arc::new(TaskStateTracker::new());
>     
>     assert!(tracker.try_transition(STATE_IDLE, STATE_RUNNING).is_ok());
>     
>     let mut handles = vec![];
>     for i in 1..=5 {
>         let tr = Arc::clone(&tracker);
>         handles.push(thread::spawn(move || {
>             let memory_used = i * 128;
>             tr.update_peak_memory(memory_used);
>         }));
>     }
> 
>     for h in handles {
>         h.join().unwrap();
>     }
> 
>     println!("Current State: {}", tracker.current_state());
>     println!("Peak Memory: {} MB", tracker.peak_memory());
>     println!("Transitions: {}", tracker.transition_count());
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_valid_state_transitions() {
>         let tracker = TaskStateTracker::new();
>         assert_eq!(tracker.current_state(), STATE_IDLE);
> 
>         let res = tracker.try_transition(STATE_IDLE, STATE_RUNNING);
>         assert_eq!(res, Ok(STATE_IDLE));
>         assert_eq!(tracker.current_state(), STATE_RUNNING);
> 
>         let invalid_res = tracker.try_transition(STATE_IDLE, STATE_PAUSED);
>         assert_eq!(invalid_res, Err(STATE_RUNNING));
>         assert_eq!(tracker.current_state(), STATE_RUNNING);
> 
>         let pause_res = tracker.try_transition(STATE_RUNNING, STATE_PAUSED);
>         assert!(pause_res.is_ok());
>         assert_eq!(tracker.transition_count(), 2);
>     }
> 
>     #[test]
>     fn test_concurrent_peak_memory_update() {
>         let tracker = Arc::new(TaskStateTracker::new());
>         let mut handles = vec![];
> 
>         let values = vec![50, 200, 150, 400, 350, 100];
>         for val in values {
>             let tr = Arc::clone(&tracker);
>             handles.push(thread::spawn(move || {
>                 tr.update_peak_memory(val);
>             }));
>         }
> 
>         for h in handles {
>             h.join().unwrap();
>         }
> 
>         assert_eq!(tracker.peak_memory(), 400);
>     }
> }
> ```
>
> **Step-by-Step Explanation:**
> 1. **Atomic State Machine (`compare_exchange`)**: State transitions check if the current state strictly matches the expected predecessor (`current`). If two threads attempt conflicting transitions, only one succeeds; the other receives `Err(actual)` with the real state.
> 2. **Optimistic Max Update Loop**: `update_peak_memory` reads the existing peak into `current`. If `val <= current`, no update is needed. If `val > current`, it executes `compare_exchange_weak`. If a concurrent thread sets a higher or equal value, `compare_exchange_weak` fails, updating `current` so the loop re-evaluates whether `val > current`.
> 3. **Lock-Free Metrics**: Metric updates complete in nanoseconds directly on CPU registers without OS thread unscheduling.

---

### Exercise 3: Multithreaded Worker Pool Shutdown Coordinator

**Problem:** Implement a thread pool lifecycle and metric coordinator using `AtomicBool` and `AtomicUsize`.

Implement `ThreadPoolCoordinator` with:
1. `shutdown_requested`: An `AtomicBool` flag indicating whether workers should finish their work loops and exit.
2. `tasks_processed`: An `AtomicUsize` tracking total completed workload units across all threads.
3. `active_workers`: An `AtomicUsize` tracking currently live worker threads.
4. `request_shutdown(&self)`: Atomically sets `shutdown_requested` to `true` via `store(true, Ordering::SeqCst)`.
5. Unit tests in `#[cfg(test)] mod tests` verifying worker creation, task processing count aggregation, and clean shutdown propagation using `assert_eq!` and `assert!`.

> [!check]- Answer
> ```rust
> use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
> use std::sync::Arc;
> use std::thread;
> use std::time::Duration;
> 
> pub struct ThreadPoolCoordinator {
>     shutdown_requested: AtomicBool,
>     tasks_processed: AtomicUsize,
>     active_workers: AtomicUsize,
> }
> 
> impl ThreadPoolCoordinator {
>     pub fn new() -> Self {
>         Self {
>             shutdown_requested: AtomicBool::new(false),
>             tasks_processed: AtomicUsize::new(0),
>             active_workers: AtomicUsize::new(0),
>         }
>     }
> 
>     pub fn request_shutdown(&self) {
>         self.shutdown_requested.store(true, Ordering::SeqCst);
>     }
> 
>     pub fn is_shutdown(&self) -> bool {
>         self.shutdown_requested.load(Ordering::SeqCst)
>     }
> 
>     pub fn record_task_completed(&self) {
>         self.tasks_processed.fetch_add(1, Ordering::SeqCst);
>     }
> 
>     pub fn tasks_processed(&self) -> usize {
>         self.tasks_processed.load(Ordering::SeqCst)
>     }
> 
>     pub fn active_workers(&self) -> usize {
>         self.active_workers.load(Ordering::SeqCst)
>     }
> }
> 
> fn main() {
>     let coordinator = Arc::new(ThreadPoolCoordinator::new());
>     let worker_count = 4;
>     let mut handles = vec![];
> 
>     for worker_id in 0..worker_count {
>         let coord = Arc::clone(&coordinator);
>         coord.active_workers.fetch_add(1, Ordering::SeqCst);
> 
>         let h = thread::spawn(move || {
>             while !coord.is_shutdown() {
>                 // Simulate processing a task
>                 coord.record_task_completed();
>                 thread::sleep(Duration::from_millis(10));
>             }
>             coord.active_workers.fetch_sub(1, Ordering::SeqCst);
>             println!("Worker {} shut down cleanly.", worker_id);
>         });
>         handles.push(h);
>     }
> 
>     // Let workers execute for a brief period
>     thread::sleep(Duration::from_millis(50));
>     coordinator.request_shutdown();
> 
>     for h in handles {
>         h.join().unwrap();
>     }
> 
>     println!("Total tasks processed: {}", coordinator.tasks_processed());
>     println!("Remaining active workers: {}", coordinator.active_workers());
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_shutdown_signal_propagation() {
>         let coordinator = ThreadPoolCoordinator::new();
>         assert!(!coordinator.is_shutdown());
> 
>         coordinator.request_shutdown();
>         assert!(coordinator.is_shutdown());
>     }
> 
>     #[test]
>     fn test_worker_lifecycle_and_metrics() {
>         let coordinator = Arc::new(ThreadPoolCoordinator::new());
>         let mut handles = vec![];
> 
>         for _ in 0..3 {
>             let coord = Arc::clone(&coordinator);
>             coord.active_workers.fetch_add(1, Ordering::SeqCst);
>             handles.push(thread::spawn(move || {
>                 for _ in 0..100 {
>                     if coord.is_shutdown() {
>                         break;
>                     }
>                     coord.record_task_completed();
>                 }
>                 coord.active_workers.fetch_sub(1, Ordering::SeqCst);
>             }));
>         }
> 
>         for h in handles {
>             h.join().unwrap();
>         }
> 
>         assert_eq!(coordinator.tasks_processed(), 300);
>         assert_eq!(coordinator.active_workers(), 0);
>     }
> }
> ```
>
> **Step-by-Step Explanation:**
> 1. **Atomic Control Signaling (`AtomicBool`)**: Workers check `coord.is_shutdown()` on every iteration. Setting `shutdown_requested` to `true` via `store(true, Ordering::SeqCst)` provides immediate cross-thread visibility across CPU cache coherency lines.
> 2. **Concurrent Workers Lifecycle Accounting**: Each worker atomically increments `active_workers` on launch via `fetch_add(1, Ordering::SeqCst)` and atomically decrements `active_workers` on exit via `fetch_sub(1, Ordering::SeqCst)`.
> 3. **Lock-Free Aggregate Task Counters**: `tasks_processed` aggregates completed work metrics safely across all concurrently executing threads without mutex locks.

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
