# `Atomic` Types

> **Level 9 — Concurrency & Parallelism**
> Lock-free atomic operations: `AtomicBool`, `AtomicUsize`, etc.

---

## 1. Prerequisites


- [`Arc<T>`](../level_03/arc_t.md) — The tool used to share Atomic types across threads.
- [`Mutex<T>`](mutex_t.md) — The software lock that Atomics are designed to replace for simple data!

---

## 2. Term Category

**Hardware Synchronization Primitives (Lock-Free Thread Safety)**: Atomic types (`AtomicBool`, `AtomicUsize`, `AtomicI32`, etc.) leverage CPU hardware-level atomic instructions (`fetch_add`, `compare_exchange`) to perform uninterruptible read-modify-write memory operations across OS threads without software mutex locks.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

A standard operation like `x = x + 1` requires 3 distinct CPU instruction steps:
1. Load `x` from memory into a register.
2. Increment the register value.
3. Store the register value back to memory.

If two threads execute this concurrently, both might read `5` and store `6`, causing a lost update data race.

While a `Mutex` prevents this by forcing OS threads to sleep and wait in line (involving expensive OS context switches), atomic types invoke hardware atomic instructions supported directly by CPU microchips. These instructions execute the entire read-modify-write cycle in a single uninterruptible hardware cycle, enabling high-performance lock-free concurrent counters, flags, and state trackers.

### (2) Reality Metaphor

A turnstile counter at a stadium:
- **`Mutex`**: A security guard who halts each fan, checks their ticket, writes their name in a logbook, and signals the next fan to enter. Safe, but slow for large crowds.
- **`AtomicUsize`**: A mechanical turnstile counter. Every fan walking through physically rotates the wheel by 1 tooth in a single mechanical motion. It cannot split or interleave mid-turn, counting every single fan instantly.

### (3) Rust Code Examples

#### High-Performance Concurrent Counter with `AtomicUsize`
```rust
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use std::thread;

fn main() {
    let counter = Arc::new(AtomicUsize::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter_clone = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            // Hardware atomic increment: no mutex locking required!
            counter_clone.fetch_add(1, Ordering::SeqCst);
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    assert_eq!(counter.load(Ordering::SeqCst), 10);
    println!("Final atomic counter: {}", counter.load(Ordering::SeqCst));
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Assuming Multiple Separate Atomic Calls form a Single Atomic Operation

**The mistake:** Executing `if counter.load(Ordering::SeqCst) < max { counter.fetch_add(1, Ordering::SeqCst); }`.

**Why it is wrong:** Even though each individual operation (`load` and `fetch_add`) is atomic, another thread can intervene between the two calls, causing race conditions. You must use a single Compare-And-Swap operation like `compare_exchange` or `compare_exchange_weak`.

*Incorrect:*
```rust
if counter.load(Ordering::SeqCst) < 10 {
    // ❌ Another thread can increment counter here! Over-capacity race condition!
    counter.fetch_add(1, Ordering::SeqCst);
}
```

*Fix:*
```rust
// Use compare_exchange in a CAS loop!
let mut current = counter.load(Ordering::SeqCst);
loop {
    if current >= 10 { break; }
    match counter.compare_exchange_weak(current, current + 1, Ordering::SeqCst, Ordering::SeqCst) {
        Ok(_) => break,
        Err(actual) => current = actual,
    }
}
```

### Mistake 2: Misusing `Ordering::Relaxed` for Thread Synchronization Flags

**The mistake:** Using `Ordering::Relaxed` when using an `AtomicBool` as a flag to notify another thread that shared data is ready.

**Why it is wrong:** `Ordering::Relaxed` allows the CPU and compiler to reorder memory operations. Thread B might see the flag set to `true` *before* it sees the memory writes that occurred prior to setting the flag.

*Incorrect:*
```rust
ready_flag.store(true, Ordering::Relaxed); // ❌ Memory writes can be reordered after this store!
```

*Fix:*
```rust
ready_flag.store(true, Ordering::Release); // Guarantees prior writes are published!
```

### Mistake 3: Expecting Atomic Types to Work on Arbitrary Complex Structs

**The mistake:** Trying to create an `Atomic<MyStruct>` without a mutex.

**Why it is wrong:** Atomics rely on hardware support for native primitive types (`usize`, `u64`, `bool`, pointers). Custom structs exceeding machine word size cannot be modified atomically by CPU hardware instructions; use `Mutex<MyStruct>` or `RwLock<MyStruct>`.

---

## 5. Practice Exercises

### Exercise 1: Lock-Free Concurrency Guard and Rate Limiter

**Scenario:** Build a lock-free rate limiter and active connection manager for an API gateway using `AtomicUsize`. The rate limiter must enforce a maximum limit of active concurrent connections (`max_conns`) without using software locks (`Mutex`).

**Requirements:**
1. Implement `LockFreeRateLimiter` with `try_acquire`, `active_connections`, `total_requests`, and `rejected_requests`.
2. Use `compare_exchange_weak` inside a CAS retry loop for atomic slot reservation.
3. Implement `AcquiredGuard` with `Drop` to automatically decrement active connection counts on exit.
4. Write unit tests validating capacity enforcement under multi-threaded connection bursts.

> [!check]- Answer
> 
> #### Implementation
> 
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
> #### Technical Explanation
>
> 1. `compare_exchange_weak` performs lock-free atomic Compare-And-Swap (CAS) state updates without OS context switches.
> 2. `AcquiredGuard` implements RAII drop semantics to decrement active counts automatically upon completion.
> 3. Counters (`total_requests`, `rejected_requests`) use atomic `fetch_add` for thread-safe lock-free metric collection.

---

### Exercise 2: Lock-Free State Machine and Peak Memory Aggregator

**Scenario:** Build an execution task state machine and concurrent memory metric aggregator using `AtomicU8` and `AtomicUsize`.

**Requirements:**
1. Implement `TaskStateTracker` with `try_transition` and `update_peak_memory`.
2. Use `compare_exchange` for state transitions.
3. Use a CAS loop to update `peak_memory_mb` optimistically.
4. Write unit tests.

> [!check]- Answer
> 
> #### Implementation
> 
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
> impl Default for TaskStateTracker {
>     fn default() -> Self {
>         Self::new()
>     }
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
> #### Technical Explanation
> 
> 1. `AtomicU8::compare_exchange` validates state transition correctness atomically across threads.
> 2. `update_peak_memory` uses an optimistic CAS loop (`compare_exchange_weak`) to track maximum memory without software locks.
> 3. State machine metrics execute in nanoseconds directly on CPU registers.

---

### Exercise 3: Multithreaded Worker Pool Shutdown Coordinator

**Scenario:** Implement a thread pool lifecycle and metric coordinator using `AtomicBool` and `AtomicUsize`.

**Requirements:**
1. Implement `ThreadPoolCoordinator` with `request_shutdown`, `is_shutdown`, `record_task_completed`, and `active_workers`.
2. Write unit tests.

> [!check]- Answer
> 
> #### Implementation
> 
> ```rust
> use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
> use std::sync::Arc;
> use std::thread;
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
> impl Default for ThreadPoolCoordinator {
>     fn default() -> Self {
>         Self::new()
>     }
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
> #### Technical Explanation
> 
> 1. `AtomicBool` provides zero-latency cross-thread shutdown signal propagation.
> 2. `active_workers` tracks worker lifetime boundaries via atomic increment and decrement operations.
> 3. Task metrics aggregate concurrently across threads without lock contention.

---

## 6. Related Terms


- [`Arc<T>`](../level_03/arc_t.md) — The "A" in `Arc` literally stands for Atomic! It uses an `AtomicUsize` internally to track the reference count across threads!
- [`Mutex<T>`](mutex_t.md) — The slower, software-lock alternative required for complex types.
- [Data Race](data_race.md) — Related concept: Data Race.
- [Memory Ordering (`Ordering`)](memory_ordering.md) — Related concept: Memory Ordering (`Ordering`).

---

## 7. Key Takeaways

- **`Atomic`** types (like `AtomicUsize`, `AtomicBool`) are hardware-level, lock-free synchronization primitives.
- They allow multiple threads to safely mutate a single variable without needing a `Mutex`.
- Operations like `.fetch_add()` happen in a single, uninterruptible CPU cycle.
- They are significantly faster than a `Mutex`, but they **only work on simple primitive types** (integers, booleans, pointers).
- Always use `Ordering::SeqCst` unless you specifically know exactly what you are doing.
