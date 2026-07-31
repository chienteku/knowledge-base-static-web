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

---

## 5. Practice Exercises

### Exercise 1: Thread-Safe Bounded Blocking Queue (`BoundedQueue<T>`)

**Problem:**
In high-concurrency systems (such as async task schedulers or event-processing pipelines), producer threads submit tasks to a shared queue while consumer worker threads process them. To prevent unbounded memory growth under heavy load, the queue must enforce a maximum capacity.
- When the queue is **full**, calling `push()` must block until space becomes available.
- When the queue is **empty**, calling `pop()` must block until an item is inserted.

Implement a generic `BoundedQueue<T>` primitive using `Mutex<VecDeque<T>>` along with two `Condvar` instances (`not_full` and `not_empty`).
1. Provide `BoundedQueue::new(capacity: usize) -> Self`.
2. Implement `push(&self, item: T)`: acquires the mutex, waits via `self.not_full.wait(...)` in a `while` loop if capacity is reached, pushes the item, and notifies a waiting consumer via `self.not_empty.notify_one()`.
3. Implement `pop(&self) -> T`: acquires the mutex, waits via `self.not_empty.wait(...)` in a `while` loop if the queue is empty, pops the item, and notifies a waiting producer via `self.not_full.notify_one()`.
4. Implement helper methods `len(&self) -> usize` and `is_empty(&self) -> bool`.
5. Include a comprehensive unit test suite in `#[cfg(test)] mod tests` demonstrating concurrent multi-producer, multi-consumer data processing and bounded blocking behavior.

> [!check]- Answer
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
>         assert!(capacity > 0, "Capacity must be greater than zero");
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
> 
>     pub fn len(&self) -> usize {
>         self.queue.lock().unwrap().len()
>     }
> 
>     pub fn is_empty(&self) -> bool {
>         self.queue.lock().unwrap().is_empty()
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
>     use std::sync::atomic::{AtomicUsize, Ordering};
> 
>     #[test]
>     fn test_bounded_queue_basic() {
>         let q = BoundedQueue::new(2);
>         assert!(q.is_empty());
>         assert_eq!(q.len(), 0);
> 
>         q.push(10);
>         q.push(20);
>         assert_eq!(q.len(), 2);
> 
>         assert_eq!(q.pop(), 10);
>         assert_eq!(q.pop(), 20);
>         assert!(q.is_empty());
>     }
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
>         // Spawn producers
>         for p_id in 0..num_producers {
>             let q = Arc::clone(&queue);
>             handles.push(thread::spawn(move || {
>                 for i in 0..items_per_producer {
>                     q.push(p_id * 1000 + i);
>                 }
>             }));
>         }
> 
>         // Spawn consumers
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
>         assert!(queue.is_empty());
>     }
> 
>     #[test]
>     fn test_blocking_capacity_bound() {
>         let queue = Arc::new(BoundedQueue::new(1));
>         queue.push(42);
> 
>         let q_clone = Arc::clone(&queue);
>         let producer_done = Arc::new(Mutex::new(false));
>         let pd_clone = Arc::clone(&producer_done);
> 
>         let handle = thread::spawn(move || {
>             q_clone.push(99); // Will block until consumer pops 42
>             let mut done = pd_clone.lock().unwrap();
>             *done = true;
>         });
> 
>         // Give producer time to block
>         thread::sleep(std::time::Duration::from_millis(50));
>         assert_eq!(*producer_done.lock().unwrap(), false);
> 
>         assert_eq!(queue.pop(), 42); // Unblocks producer
>         handle.join().unwrap();
>         assert_eq!(*producer_done.lock().unwrap(), true);
>         assert_eq!(queue.pop(), 99);
>     }
> }
> ```
>
> **Explanation:**
> 1. **Dual `Condvar` Design**: `not_full` tracks available space for producers; `not_empty` tracks available items for consumers.
> 2. **Spurious Wakeup Prevention**: The `while` loop checks queue state (`guard.len() >= self.capacity` or `guard.is_empty()`) before and after waking up, preventing race conditions or false notifications.
> 3. **Atomic Handshake**: Calling `cvar.wait(guard)` atomically unlocks the `Mutex` and suspends the thread, preventing missed signals between checking condition state and sleeping.

---

### Exercise 2: Multi-Stage Parallel Simulation with `Barrier` Rendezvous

**Problem:**
In scientific computing and simulation matrix updates, algorithms proceed through distinct synchronization phases across multiple worker threads. In each step:
1. **Phase 1 (Compute)**: Each worker computes intermediate values in parallel based on local inputs.
2. **Barrier Point 1**: All worker threads rendezvous. The framework elects exactly one leader thread (`BarrierWaitResult::is_leader()`) to execute global state checkpointing or parameter aggregation.
3. **Phase 2 (Exchange & Verify)**: Workers safely read adjacent workers' updated values without data races because all threads are guaranteed to have completed Phase 1.
4. **Barrier Point 2**: All threads rendezvous again before advancing to the next iteration step.

Design a `PhasedSimulationEngine` struct that coordinates $N$ worker threads across $M$ iterations, collecting phase computation outputs into thread-safe storage while electing barrier leaders. Verify through unit tests that iteration phases complete in order and leader selection happens exactly once per barrier cycle.

> [!check]- Answer
> ```rust
> use std::sync::{Arc, Barrier, Mutex};
> use std::thread;
> 
> pub struct PhasedSimulationEngine;
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct SimulationResult {
>     pub final_states: Vec<Vec<usize>>,
>     pub leader_events_count: usize,
> }
> 
> impl PhasedSimulationEngine {
>     pub fn run_simulation(num_workers: usize, iterations: usize) -> SimulationResult {
>         assert!(num_workers > 0 && iterations > 0);
>         let barrier = Arc::new(Barrier::new(num_workers));
>         let shared_matrix = Arc::new(Mutex::new(vec![vec![0; iterations]; num_workers]));
>         let leader_counter = Arc::new(Mutex::new(0));
> 
>         let mut handles = Vec::with_capacity(num_workers);
> 
>         for worker_id in 0..num_workers {
>             let barrier = Arc::clone(&barrier);
>             let matrix = Arc::clone(&shared_matrix);
>             let leaders = Arc::clone(&leader_counter);
> 
>             handles.push(thread::spawn(move || {
>                 for iter in 0..iterations {
>                     // Phase 1: Local computation step
>                     let step_value = (worker_id + 1) * 100 + (iter + 1);
>                     {
>                         let mut guard = matrix.lock().unwrap();
>                         guard[worker_id][iter] = step_value;
>                     }
> 
>                     // Rendezvous 1: Synchronize Phase 1 completion across all threads
>                     let wait_res = barrier.wait();
>                     if wait_res.is_leader() {
>                         let mut l_guard = leaders.lock().unwrap();
>                         *l_guard += 1;
>                     }
> 
>                     // Phase 2: Post-synchronization state check (safe to read neighbor data)
>                     let neighbor_id = (worker_id + 1) % num_workers;
>                     let neighbor_val = {
>                         let guard = matrix.lock().unwrap();
>                         guard[neighbor_id][iter]
>                     };
>                     assert!(neighbor_val > 0, "Neighbor data must be written prior to barrier");
> 
>                     // Rendezvous 2: Synchronize before starting next iteration
>                     barrier.wait();
>                 }
>             }));
>         }
> 
>         for h in handles {
>             h.join().unwrap();
>         }
> 
>         let final_states = Arc::try_unwrap(shared_matrix).unwrap().into_inner().unwrap();
>         let leader_events_count = Arc::try_unwrap(leader_counter).unwrap().into_inner().unwrap();
> 
>         SimulationResult {
>             final_states,
>             leader_events_count,
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
>         // Verify leader election count (1 leader per iteration * 1 barrier check)
>         assert_eq!(result.leader_events_count, iterations);
> 
>         // Verify matrix state calculation correctness
>         assert_eq!(result.final_states.len(), workers);
>         for (worker_id, row) in result.final_states.iter().enumerate() {
>             assert_eq!(row.len(), iterations);
>             for (iter, &val) in row.iter().enumerate() {
>                 let expected = (worker_id + 1) * 100 + (iter + 1);
>                 assert_eq!(val, expected);
>             }
>         }
>     }
> 
>     #[test]
>     fn test_single_worker_simulation() {
>         let result = PhasedSimulationEngine::run_simulation(1, 3);
>         assert_eq!(result.leader_events_count, 3);
>         assert_eq!(result.final_states, vec![vec![101, 102, 103]]);
>     }
> }
> ```
>
> **Explanation:**
> 1. **Phase Synchronization**: `Barrier::wait()` suspends each worker thread until all `num_workers` threads reach the exact same execution point.
> 2. **Leader Election**: Exactly one thread per barrier rendezvous receives a `BarrierWaitResult` where `.is_leader()` is `true`. This thread can safely perform single-threaded coordinator actions (e.g. updating progress meters, aggregating statistics) without extra locks.
> 3. **Data Exchange Guarantees**: Because every thread blocks at `barrier.wait()`, any worker reading another worker's Phase 1 output in Phase 2 is guaranteed to observe completed writes.

---

### Exercise 3: Broadcast Readiness Gate / One-Shot Synchronization Latch

**Problem:**
When bootstrapping complex distributed nodes or multithreaded servers, worker threads need to wait for system subsystem initialization (database connection establishment, routing table pre-warming, TLS handshake context setup) before taking incoming traffic.
A `ReadinessGate` synchronization primitive acts as a broadcast latch:
- Worker threads call `.wait()` and block while the gate is closed (`false`).
- Once the initializer thread calls `.open()`, **all** waiting threads are unblocked simultaneously (`cvar.notify_all()`).
- Any worker thread calling `.wait()` after the gate is already open passes through without blocking.
- The gate can be optionally `.reset()` back to closed for re-initialization cycles.

Implement `ReadinessGate` using `Mutex<bool>` and `Condvar`. Include a complete unit test module validating multi-threaded broadcast wakeups, zero-delay pass-through when already open, and gate resetting logic.

> [!check]- Answer
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
>         Self {
>             state: Mutex::new(false),
>             cvar: Condvar::new(),
>         }
>     }
> 
>     pub fn wait(&self) {
>         let mut open = self.state.lock().unwrap();
>         while !*open {
>             open = self.cvar.wait(open).unwrap();
>         }
>     }
> 
>     pub fn open(&self) {
>         let mut open = self.state.lock().unwrap();
>         if !*open {
>             *open = true;
>             self.cvar.notify_all();
>         }
>     }
> 
>     pub fn is_open(&self) -> bool {
>         *self.state.lock().unwrap()
>     }
> 
>     pub fn reset(&self) {
>         let mut open = self.state.lock().unwrap();
>         *open = false;
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
>         // Verify workers are waiting while gate is closed
>         thread::sleep(Duration::from_millis(50));
>         assert_eq!(arrival_counter.load(Ordering::SeqCst), 0);
>         assert!(!gate.is_open());
> 
>         // Signal all waiting threads
>         gate.open();
>         assert!(gate.is_open());
> 
>         for h in handles {
>             h.join().unwrap();
>         }
> 
>         assert_eq!(arrival_counter.load(Ordering::SeqCst), num_workers);
>     }
> 
>     #[test]
>     fn test_pass_through_when_already_open() {
>         let gate = ReadinessGate::new();
>         gate.open();
>         assert!(gate.is_open());
> 
>         // Calling wait on open gate should not block
>         gate.wait();
>         assert!(gate.is_open());
>     }
> 
>     #[test]
>     fn test_gate_reset() {
>         let gate = ReadinessGate::new();
>         gate.open();
>         assert!(gate.is_open());
> 
>         gate.reset();
>         assert!(!gate.is_open());
>     }
> }
> ```
>
> **Explanation:**
> 1. **`notify_all()` vs `notify_one()`**: Unlike queue scenarios where only one worker takes an item, initialization broadcast gates must awaken **all** blocked threads simultaneously using `notify_all()`.
> 2. **State Memory**: Because the underlying state `*open` is persisted as `true`, threads arriving *after* `.open()` was called bypass the `while !*open` wait loop immediately without sleeping.
> 3. **Thread Safety**: Access to `state` is guarded by `Mutex`, ensuring atomic state transitions and avoiding lost wakeups.

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
