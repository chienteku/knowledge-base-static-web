# `Condvar` & `Barrier`

> **Level 9 — Concurrency & Parallelism**
> A condition variable for blocking a thread until notified, and a barrier for synchronizing a fixed set of threads at a rendezvous point.

---

## 1. Prerequisites


- [`Mutex<T>`](mutex_t.md) — What `Condvar` is always used alongside.
- [`std::thread::spawn`](std_thread_spawn.md) — The threads these primitives coordinate.
- [Channel (`mpsc`)](channel_mpsc.md) — A higher-level alternative for many of the same coordination problems.

---

## 2. Term Category



**Rust Concurrency Primitives (thread synchronization barriers & condition variables)**: `Condvar` (Condition Variable) and `Barrier` provide event-driven thread sleeping/notification and multi-thread phase synchronization.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

`Mutex` answers the question "who currently owns exclusive access to data?" However, it cannot efficiently wait for a logical condition to become true (e.g., "is the queue non-empty?"). Repeatedly locking and checking a mutex in a loop wastes CPU cycles (busy-waiting).

`Condvar` solves this by allowing a thread to **atomically** unlock its mutex and put itself to sleep until another thread signals a condition change via `.notify_one()` or `.notify_all()`.

`Barrier` solves a related multi-thread pattern: forcing a fixed number of threads ($N$) to wait at a rendezvous point until all $N$ threads have arrived before any thread is allowed to proceed to the next execution phase.

### (2) Reality Metaphor

- **`Condvar`**: Customer at a restaurant table. Instead of walking up to the kitchen door every 10 seconds asking "is my meal ready?" (busy-waiting), the customer sits down and sleeps (`cvar.wait(lock)`). The chef rings a bell (`cvar.notify_one()`) when the food is ready, waking the customer up.
- **`Barrier`**: Tour group meeting point. A tour guide specifies that 10 hikers must assemble at a checkpoint before starting the mountain climb. The first 9 hikers arrive and wait; the moment the 10th hiker arrives, everyone proceeds together.

### (3) Rust Code Examples

#### `Condvar` Signal Notification
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
        cvar.notify_one(); // Wake waiting thread!
    });

    let (lock, cvar) = &*pair;
    let mut ready = lock.lock().unwrap();
    while !*ready {
        ready = cvar.wait(ready).unwrap(); // Atomically unlocks lock and sleeps
    }
    println!("Signal received!");
}
```

#### `Barrier` Phase Synchronization
```rust
use std::sync::{Arc, Barrier};
use std::thread;

fn main() {
    let barrier = Arc::new(Barrier::new(3));
    let mut handles = vec![];

    for id in 0..3 {
        let c_barrier = Arc::clone(&barrier);
        handles.push(thread::spawn(move || {
            println!("Worker {id} phase 1 complete");
            c_barrier.wait(); // Blocks until all 3 workers reach this line
            println!("Worker {id} starting phase 2");
        }));
    }

    for h in handles { h.join().unwrap(); }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Checking `Condvar` Wait Condition with an `if` Statement Instead of a `while` Loop

**The mistake:** Writing `if !ready { ready = cvar.wait(ready).unwrap(); }`.

**Why it is wrong:** Operating systems permit **spurious wakeups** (waking a thread from sleep without an explicit signal) and race conditions under `notify_all()`. Checking conditions with an `if` allows threads to execute with invalid state assumptions.

*Incorrect:*
```rust
if !ready {
    ready = cvar.wait(ready).unwrap(); // ❌ Spurious wakeup bypasses condition!
}
```

*Fix:*
```rust
while !ready {
    ready = cvar.wait(ready).unwrap(); // Correct: re-checks condition upon waking up!
}
```

### Mistake 2: Calling `Condvar::wait` Without Holding the Associated `Mutex` Lock

**The mistake:** Passing an un-locked state or attempting to call wait without active lock guards.

**Why it is wrong:** `cvar.wait(guard)` requires an active `MutexGuard`. This guarantees that checking the predicate and entering the sleep queue occurs atomically without missing notifications.

### Mistake 3: Reusing a `Barrier` Instance with Mismatched Thread Counts

**The mistake:** Initializing `Barrier::new(5)` but only spawning 4 worker threads.

**Why it is wrong:** The barrier will block all 4 threads indefinitely, deadlocking the program because the 5th arrival signal will never occur.

---

## 5. Practice Exercises

### Exercise 1: Thread-Safe Bounded Blocking Queue (`BoundedQueue<T>`)

**Scenario:** Implement a bounded queue where producer threads block when capacity is reached and consumer threads block when the queue is empty.

**Requirements:**
1. Define `BoundedQueue<T>` with `queue: Mutex<VecDeque<T>>`, `capacity: usize`, `not_full: Condvar`, and `not_empty: Condvar`.
2. Implement `push` and `pop` using `while` wait loops.
3. Write unit tests validating multi-producer multi-consumer execution and capacity blocking.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::VecDeque;
> use std::sync::{Arc, Condvar, Mutex};
> use std::thread;
> 
> pub struct BoundedQueue<T> {
>     queue: Mutex<VecDeque<T>>,
>     capacity: usize,
>     not_full: Condvar,
>     not_empty: Condvar,
> }
> 
> impl<T> BoundedQueue<T> {
>     pub fn new(capacity: usize) -> Self {
>         assert!(capacity > 0);
>         Self {
>             queue: Mutex::new(VecDeque::with_capacity(capacity)),
>             capacity,
>             not_full: Condvar::new(),
>             not_empty: Condvar::new(),
>         }
>     }
> 
>     pub fn push(&self, item: T) {
>         let mut guard = self.queue.lock().unwrap();
>         while guard.len() >= self.capacity {
>             guard = self.not_full.wait(guard).unwrap();
>         }
>         guard.push_back(item);
>         self.not_empty.notify_one();
>     }
> 
>     pub fn pop(&self) -> T {
>         let mut guard = self.queue.lock().unwrap();
>         while guard.is_empty() {
>             guard = self.not_empty.wait(guard).unwrap();
>         }
>         let item = guard.pop_front().unwrap();
>         self.not_full.notify_one();
>         item
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
>     use std::sync::atomic::{AtomicUsize, Ordering};
> 
>     #[test]
>     fn test_multi_producer_multi_consumer() {
>         let queue = Arc::new(BoundedQueue::new(4));
>         let num_producers = 4;
>         let num_consumers = 4;
>         let items_per_producer = 50;
>         let total_consumed = Arc::new(AtomicUsize::new(0));
> 
>         let mut handles = vec![];
> 
>         for p_id in 0..num_producers {
>             let q = Arc::clone(&queue);
>             handles.push(thread::spawn(move || {
>                 for i in 0..items_per_producer {
>                     q.push(p_id * 1000 + i);
>                 }
>             }));
>         }
> 
>         for _ in 0..num_consumers {
>             let q = Arc::clone(&queue);
>             let counter = Arc::clone(&total_consumed);
>             handles.push(thread::spawn(move || {
>                 for _ in 0..items_per_producer {
>                     let _val = q.pop();
>                     counter.fetch_add(1, Ordering::SeqCst);
>                 }
>             }));
>         }
> 
>         for h in handles {
>             h.join().unwrap();
>         }
> 
>         assert_eq!(total_consumed.load(Ordering::SeqCst), num_producers * items_per_producer);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `not_full` tracks available buffer slots for producers; `not_empty` tracks ready items for consumers.
> 2. `while` loops prevent spurious wakeups from modifying state incorrectly.
> 3. `cvar.wait(guard)` atomically unlocks the `Mutex` and puts the thread to sleep, preventing lost wakeups.

---

### Exercise 2: Multi-Stage Parallel Simulation with `Barrier` Rendezvous

**Scenario:** In scientific parallel simulations, workers execute matrix operations in synchronized iterative phases.

**Requirements:**
1. Implement `PhasedSimulationEngine::run_simulation(num_workers, iterations)`.
2. Use `Barrier::wait()` to align worker threads across calculation phases.
3. Track leader election via `wait_res.is_leader()`.
4. Write unit tests validating matrix calculations and leader election count.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::sync::{Arc, Barrier, Mutex};
> use std::thread;
> 
> pub struct PhasedSimulationEngine;
> 
> #[derive(Debug, Clone)]
> pub struct SimulationResult {
>     pub final_states: Vec<Vec<usize>>,
>     pub leader_events_count: usize,
> }
> 
> impl PhasedSimulationEngine {
>     pub fn run_simulation(num_workers: usize, iterations: usize) -> SimulationResult {
>         let barrier = Arc::new(Barrier::new(num_workers));
>         let shared_matrix = Arc::new(Mutex::new(vec![vec![0; iterations]; num_workers]));
>         let leader_counter = Arc::new(Mutex::new(0));
>         let mut handles = Vec::with_capacity(num_workers);
> 
>         for worker_id in 0..num_workers {
>             let barrier = Arc::clone(&barrier);
>             let matrix = Arc::clone(&shared_matrix);
>             let leaders = Arc::clone(&leader_counter);
> 
>             handles.push(thread::spawn(move || {
>                 for iter in 0..iterations {
>                     let step_value = (worker_id + 1) * 100 + (iter + 1);
>                     {
>                         let mut guard = matrix.lock().unwrap();
>                         guard[worker_id][iter] = step_value;
>                     }
> 
>                     let wait_res = barrier.wait();
>                     if wait_res.is_leader() {
>                         let mut l_guard = leaders.lock().unwrap();
>                         *l_guard += 1;
>                     }
> 
>                     let neighbor_id = (worker_id + 1) % num_workers;
>                     let neighbor_val = {
>                         let guard = matrix.lock().unwrap();
>                         guard[neighbor_id][iter]
>                     };
>                     assert!(neighbor_val > 0);
> 
>                     barrier.wait();
>                 }
>             }));
>         }
> 
>         for h in handles { h.join().unwrap(); }
> 
>         SimulationResult {
>             final_states: Arc::try_unwrap(shared_matrix).unwrap().into_inner().unwrap(),
>             leader_events_count: Arc::try_unwrap(leader_counter).unwrap().into_inner().unwrap(),
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_phased_simulation_correctness() {
>         let workers = 4;
>         let iterations = 5;
>         let result = PhasedSimulationEngine::run_simulation(workers, iterations);
> 
>         assert_eq!(result.leader_events_count, iterations);
>         assert_eq!(result.final_states.len(), workers);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `Barrier::wait()` suspends all worker threads until all $N$ threads reach the barrier.
> 2. `wait_res.is_leader()` evaluates to `true` for exactly one thread per barrier rendezvous.
> 3. Barrier synchronization guarantees cross-thread data visibility between computation phases.

---

### Exercise 3: Broadcast Readiness Gate / One-Shot Synchronization Latch

**Scenario:** Workers must wait for system initialization before handling incoming workload requests. Implement a broadcast latch.

**Requirements:**
1. Implement `ReadinessGate` using `Mutex<bool>` and `Condvar`.
2. Implement `wait()`, `open()` (`cvar.notify_all()`), `is_open()`, and `reset()`.
3. Write unit tests validating broadcast wakeups and non-blocking pass-through when open.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::sync::{Arc, Condvar, Mutex};
> use std::thread;
> use std::time::Duration;
> 
> pub struct ReadinessGate {
>     state: Mutex<bool>,
>     cvar: Condvar,
> }
> 
> impl ReadinessGate {
>     pub fn new() -> Self {
>         Self { state: Mutex::new(false), cvar: Condvar::new() }
>     }
> 
>     pub fn wait(&self) {
>         let mut open = self.state.lock().unwrap();
>         while !*open { open = self.cvar.wait(open).unwrap(); }
>     }
> 
>     pub fn open(&self) {
>         let mut open = self.state.lock().unwrap();
>         if !*open { *open = true; self.cvar.notify_all(); }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
>     use std::sync::atomic::{AtomicUsize, Ordering};
> 
>     #[test]
>     fn test_readiness_gate_broadcast() {
>         let gate = Arc::new(ReadinessGate::new());
>         let arrival_counter = Arc::new(AtomicUsize::new(0));
>         let num_workers = 5;
>         let mut handles = vec![];
> 
>         for _ in 0..num_workers {
>             let g = Arc::clone(&gate);
>             let counter = Arc::clone(&arrival_counter);
>             handles.push(thread::spawn(move || {
>                 g.wait();
>                 counter.fetch_add(1, Ordering::SeqCst);
>             }));
>         }
> 
>         thread::sleep(Duration::from_millis(50));
>         assert_eq!(arrival_counter.load(Ordering::SeqCst), 0);
> 
>         gate.open();
>         for h in handles { h.join().unwrap(); }
> 
>         assert_eq!(arrival_counter.load(Ordering::SeqCst), num_workers);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `notify_all()` awakens all waiting worker threads simultaneously upon initialization.
> 2. Persistent `*open == true` state allows subsequent caller threads to pass through without sleeping.
> 3. `Mutex` synchronization avoids lost notification signals during gate opening transitions.

---

## 6. Related Terms


- [`Mutex<T>`](mutex_t.md) — What `Condvar::wait` is always paired with; the lock it atomically releases while sleeping.
- [Channel (`mpsc`)](channel_mpsc.md) — A higher-level alternative that often replaces manual `Condvar` usage for simple producer/consumer signaling.
- [`std::thread::spawn`](std_thread_spawn.md)
- [`Arc<T>`](../level_03/arc_t.md) — Needed to share a `Mutex`/`Condvar`/`Barrier` across the multiple threads that use it.

---

## 7. Key Takeaways

- `Condvar` lets a thread efficiently sleep until explicitly notified, atomically releasing an associated `Mutex` lock while waiting — no busy-waiting required.
- Always re-check the wait condition in a `while` loop after waking, never a single `if`, to correctly handle spurious wakeups and `notify_all` races.
- `Barrier::new(n)` blocks every one of `n` threads at `.wait()` until all `n` have arrived, then releases them all together — the standard tool for phased, multi-thread rendezvous points.
- Both are lower-level primitives; channels (`mpsc`) or higher-level abstractions often solve the same coordination problems with less manual bookkeeping.
