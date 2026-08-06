# `thread_local!` Macro

> **Level 9 — Concurrency & Parallelism**
> Declares per-thread storage — giving each thread its own independent instance of a value, without any shared-state synchronization.

---

## 1. Prerequisites


- [Static (`static`)](../level_01/static_static.md) — The global-scope mechanism this macro provides a per-thread alternative to.
- [`std::thread::spawn`](std_thread_spawn.md) — What creates the separate threads, each of which gets its own instance.
- [`OnceCell` / `OnceLock` / `LazyLock` / `LazyCell`](oncelock_lazylock.md) — A related global-state tool, but *shared* across threads rather than per-thread.

---

## 2. Term Category

**Standard Library Macro (the per-thread global)**: A normal `static` is a **single** value shared by the entire program, across every thread — which means mutating it safely requires synchronization (`Mutex`, atomics, `OnceLock`). `thread_local!` sidesteps synchronization entirely by giving each thread its own **private, independent copy** of the value — no thread ever sees another thread's copy, so there's nothing to synchronize.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Some global-feeling state genuinely shouldn't be shared across threads at all — a per-thread request ID counter, a per-thread random number generator seed, a per-thread scratch buffer reused across many function calls to avoid repeated allocation. Using an ordinary `static` for these would force you to add synchronization (a `Mutex`, say) purely to protect data that was never meant to be shared in the first place — real overhead and complexity for a false problem. `thread_local!` solves this directly: it declares a value that's transparently instantiated **separately** for each thread that ever accesses it, the first time that thread touches it. Since no two threads ever see the same underlying storage, there's no possibility of a data race, and no synchronization primitive is needed at all — the isolation is structural, not lock-based.

### (2) Reality Metaphor

Imagine an office building where, instead of one shared supply closet everyone has to take turns accessing (**a `Mutex`-protected `static`**), each individual employee is issued their own small personal desk drawer stocked with a permanent, private set of pens and notepads.

- **A shared `static` (with a `Mutex`)**: Everyone lines up at the same supply closet, waiting their turn to grab a pen, then putting it back when done — necessary because it's genuinely the *same* physical pens everyone's sharing.
- **`thread_local!`**: Each employee's desk drawer is entirely their own — nobody ever needs to wait in line or coordinate, because nobody else can even see or touch what's in a different employee's drawer. Two employees can grab "their pen" at the exact same instant with zero possibility of conflict, since they're not even touching the same physical object.

### (3) Rust Code Examples

#### Short Snippet (Basic Per-Thread State)
```rust
use std::cell::Cell;

thread_local! {
    static COUNTER: Cell<u32> = Cell::new(0);
}

fn increment_and_print() {
    COUNTER.with(|c| {
        c.set(c.get() + 1);
        println!("Thread-local counter: {}", c.get());
    });
}

fn main() {
    increment_and_print(); // Thread-local counter: 1
    increment_and_print(); // Thread-local counter: 2 (SAME thread, so it accumulates)
}
```

#### Fuller Example (Each Spawned Thread Gets Its Own Independent Copy)
```rust
use std::cell::Cell;

thread_local! {
    static REQUEST_ID: Cell<u32> = Cell::new(0);
}

fn next_id() -> u32 {
    REQUEST_ID.with(|id| {
        let current = id.get();
        id.set(current + 1);
        current
    })
}

fn main() {
    let handles: Vec<_> = (0..3)
        .map(|_| std::thread::spawn(|| {
            // Each thread starts its OWN counter fresh at 0 — completely independent!
            println!("{} {} {}", next_id(), next_id(), next_id());
        }))
        .collect();

    for h in handles { h.join().unwrap(); }
    // Every thread prints "0 1 2" — none of them share state or interfere with each other.
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Thread Local Macro Scoping and Lifecycle Rules

**The mistake:** Assuming Thread Local Macro instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("thread_local_macro_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("thread_local_macro_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Thread Local Macro State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Thread Local Macro through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Thread Local Macro Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Thread Local Macro instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: High-Performance Per-Thread Scratch Buffer Pool

**Scenario:**
In high-throughput network services or serialization pipelines, creating new heap allocations (`Vec<u8>`) inside hot processing loops causes allocator lock contention and memory fragmentation. You need to implement a zero-allocation parsing helper using `thread_local!` to maintain a per-thread scratch buffer.

Implement `with_scratch_buffer<F, R>(f: F) -> R` and `encode_hex_with_scratch(bytes: &[u8]) -> String`:
1. Use `thread_local!` with `RefCell<Vec<u8>>` to store a reusable buffer initialized with capacity for each thread.
2. In `with_scratch_buffer`, clear the thread's buffer (preserving capacity) before passing exclusive mutable access `&mut Vec<u8>` to the closure `f`.
3. In `encode_hex_with_scratch`, convert a byte slice into an ASCII hex string using the caller thread's scratch buffer.
4. Include a unit test module verifying buffer capacity reuse on the same thread and complete memory storage isolation across multiple spawned OS threads.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::cell::RefCell;
> use std::thread;
> 
> thread_local! {
>     static SCRATCH_BUFFER: RefCell<Vec<u8>> = RefCell::new(Vec::with_capacity(1024));
> }
> 
> /// Executes closure `f` with access to the calling thread's private scratch buffer.
> /// Clears the buffer (preserving capacity) prior to invocation.
> pub fn with_scratch_buffer<F, R>(f: F) -> R
> where
>     F: FnOnce(&mut Vec<u8>) -> R,
> {
>     SCRATCH_BUFFER.with(|buf_cell| {
>         let mut buf = buf_cell.borrow_mut();
>         buf.clear();
>         f(&mut buf)
>     })
> }
> 
> /// Encodes raw bytes into a hexadecimal string using the thread-local scratch buffer.
> pub fn encode_hex_with_scratch(bytes: &[u8]) -> String {
>     with_scratch_buffer(|buf| {
>         const HEX_CHARS: &[u8; 16] = b"0123456789abcdef";
>         buf.reserve(bytes.len() * 2);
>         for &b in bytes {
>             buf.push(HEX_CHARS[(b >> 4) as usize]);
>             buf.push(HEX_CHARS[(b & 0x0F) as usize]);
>         }
>         std::str::from_utf8(buf).unwrap().to_string()
>     })
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
>     use std::sync::Arc;
>     use std::sync::atomic::{AtomicUsize, Ordering};
> 
>     #[test]
>     fn test_thread_local_scratch_buffer_reuse() {
>         let input = b"Hello, Rust!";
>         let encoded = encode_hex_with_scratch(input);
>         assert_eq!(encoded, "48656c6c6f2c205275737421");
> 
>         // Verify buffer capacity is preserved across multiple calls on the same thread
>         SCRATCH_BUFFER.with(|buf| {
>             assert!(buf.borrow().capacity() >= 24);
>             assert_eq!(buf.borrow().len(), 0);
>         });
>     }
> 
>     #[test]
>     fn test_concurrent_thread_local_isolation() {
>         let total_capacity_recorded = Arc::new(AtomicUsize::new(0));
>         let handles: Vec<_> = (0..4)
>             .map(|i| {
>                 let total_cap = Arc::clone(&total_capacity_recorded);
>                 thread::spawn(move || {
>                     let data = vec![i as u8; 100];
>                     let res = encode_hex_with_scratch(&data);
>                     assert_eq!(res.len(), 200);
> 
>                     SCRATCH_BUFFER.with(|buf| {
>                         let cap = buf.borrow().capacity();
>                         total_cap.fetch_add(cap, Ordering::SeqCst);
>                     })
>                 })
>             })
>             .collect();
> 
>         for h in handles {
>             h.join().unwrap();
>         }
> 
>         // Each of the 4 spawned threads initialized its own private capacity independently
>         assert!(total_capacity_recorded.load(Ordering::SeqCst) >= 400);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Zero-Locking Per-Thread Buffer**: `SCRATCH_BUFFER` uses `thread_local!` combined with `RefCell<Vec<u8>>`. Because each thread accesses its own distinct `Vec<u8>`, borrowing via `.borrow_mut()` incurs zero synchronization locks or atomic overhead.
> 2. **Capacity Retention**: Calling `.clear()` empties the buffer length to 0 while keeping the underlying heap capacity allocated. Subsequent calls reuse the allocated memory without performing new heap allocations.
> 3. **Thread Memory Isolation**: Spawning 4 worker threads causes each thread to initialize its own separate `SCRATCH_BUFFER` instance on first access. Mutating or clearing the buffer in one thread has zero side effects on other threads.
> 
---

### Exercise 2: Per-Thread Lock-Free Metrics Aggregator & Batch Harvest Pipeline

**Scenario:**
In high-concurrency systems, writing telemetry metrics directly into shared `Arc<Mutex<Metrics>>` or atomic counters on every request creates cache-line contention and mutex bottlenecking. A common pattern is to aggregate metrics locally per thread using `thread_local!`, and periodically flush aggregated batches into a central global metric collector.

Implement `MetricsCollector` with lock-free local recording and batched flushing:
1. Define a `ThreadMetrics` struct tracking `requests_processed`, `error_count`, and `total_latency_us`.
2. Declare a `thread_local!` static `LOCAL_METRICS: RefCell<ThreadMetrics>`.
3. Provide `record_request(latency_us: u64, is_error: bool)` that mutates thread-local metrics without locking.
4. Provide `flush(global_registry: &Arc<Mutex<ThreadMetrics>>)` that atomically locks the global registry once per flush cycle, accumulates the batch totals, and resets the thread-local state to zero.
5. Provide unit tests testing thread-local aggregation, post-flush local state resetting, and multithreaded concurrent batch harvesting.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::cell::RefCell;
> use std::sync::{Arc, Mutex};
> use std::thread;
> 
> #[derive(Debug, Default, Clone, PartialEq, Eq)]
> pub struct ThreadMetrics {
>     pub requests_processed: u64,
>     pub error_count: u64,
>     pub total_latency_us: u64,
> }
> 
> thread_local! {
>     static LOCAL_METRICS: RefCell<ThreadMetrics> = RefCell::new(ThreadMetrics::default());
> }
> 
> pub struct MetricsCollector;
> 
> impl MetricsCollector {
>     /// Record a processed request into the calling thread's local accumulator without locking.
>     pub fn record_request(latency_us: u64, is_error: bool) {
>         LOCAL_METRICS.with(|m| {
>             let mut metrics = m.borrow_mut();
>             metrics.requests_processed += 1;
>             metrics.total_latency_us += latency_us;
>             if is_error {
>                 metrics.error_count += 1;
>             }
>         });
>     }
> 
>     /// Flushes local metrics into a shared global registry and resets the thread-local state.
>     pub fn flush(global_registry: &Arc<Mutex<ThreadMetrics>>) {
>         LOCAL_METRICS.with(|m| {
>             let mut local = m.borrow_mut();
>             if local.requests_processed > 0 {
>                 let mut global = global_registry.lock().unwrap();
>                 global.requests_processed += local.requests_processed;
>                 global.error_count += local.error_count;
>                 global.total_latency_us += local.total_latency_us;
> 
>                 // Reset thread-local metrics after successful flush
>                 *local = ThreadMetrics::default();
>             }
>         });
>     }
> 
>     /// Reads current snapshot of calling thread's local metrics.
>     pub fn snapshot() -> ThreadMetrics {
>         LOCAL_METRICS.with(|m| m.borrow().clone())
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_local_metrics_recording_and_reset() {
>         MetricsCollector::record_request(150, false);
>         MetricsCollector::record_request(300, true);
> 
>         let snap = MetricsCollector::snapshot();
>         assert_eq!(snap.requests_processed, 2);
>         assert_eq!(snap.error_count, 1);
>         assert_eq!(snap.total_latency_us, 450);
> 
>         let global = Arc::new(Mutex::new(ThreadMetrics::default()));
>         MetricsCollector::flush(&global);
> 
>         // Assert local state reset post-flush
>         let snap_after = MetricsCollector::snapshot();
>         assert_eq!(snap_after, ThreadMetrics::default());
> 
>         // Assert global state received aggregated batch data
>         let global_snap = global.lock().unwrap().clone();
>         assert_eq!(global_snap.requests_processed, 2);
>         assert_eq!(global_snap.error_count, 1);
>         assert_eq!(global_snap.total_latency_us, 450);
>     }
> 
>     #[test]
>     fn test_multithreaded_metrics_harvesting() {
>         let global_registry = Arc::new(Mutex::new(ThreadMetrics::default()));
>         let handles: Vec<_> = (0..5)
>             .map(|id| {
>                 let global = Arc::clone(&global_registry);
>                 thread::spawn(move || {
>                     for i in 0..10 {
>                         MetricsCollector::record_request(100 + id * 10, i % 3 == 0);
>                     }
>                     MetricsCollector::flush(&global);
>                 })
>             })
>             .collect();
> 
>         for h in handles {
>             h.join().unwrap();
>         }
> 
>         let global = global_registry.lock().unwrap();
>         assert_eq!(global.requests_processed, 50);
>         // 5 threads * 4 errors per thread (i=0,3,6,9) = 20 total errors
>         assert_eq!(global.error_count, 20);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Atomic Free Hot Path**: `record_request` operates exclusively on thread-local storage (`RefCell<ThreadMetrics>`), eliminating lock acquisitions and atomic cache invalidations during request handling.
> 2. **Batch Aggregation**: Mutex acquisition only occurs during `flush()`. Instead of 50 mutex locks across 5 worker threads, only 5 batch lock acquisitions occur.
> 3. **State Isolation & Clean Reset**: `*local = ThreadMetrics::default()` clears thread-local state back to zero after flushing, ensuring subsequent requests on recycled threads begin with clean accumulators.
> 
---

### Exercise 3: Per-Thread Fast PRNG & Automatic Thread-Local `Drop` Destructor Cleanup

**Scenario:**
Thread-safe random number generation using shared global mutexes degrades performance in concurrent algorithms. Furthermore, understanding the lifecycle of `thread_local!` variables requires knowing when their `Drop` implementations run (upon OS thread exit).

Implement a thread-isolated Fast Xorshift PRNG and thread-exit cleanup guard:
1. Define a `FastRng` struct implementing a non-zero seeded Xorshift64 PRNG algorithm.
2. Define a `ThreadCleanupGuard` struct implementing `Drop` that decrements an `Arc<AtomicUsize>` counter tracking active worker threads when a thread exits.
3. Declare `thread_local!` instances for `FastRng` and `ThreadCleanupGuard`.
4. Implement functions `thread_random_u64()`, `reseed_thread_rng(seed: u64)`, and `set_thread_cleanup_tracker(tracker: Arc<AtomicUsize>)`.
5. Write unit tests verifying PRNG determinism upon reseeding, thread-local sequence isolation, and automatic destruction of thread-local items when spawned threads complete execution.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::cell::RefCell;
> use std::sync::Arc;
> use std::sync::atomic::{AtomicUsize, Ordering};
> use std::thread;
> 
> pub struct FastRng {
>     state: u64,
> }
> 
> impl FastRng {
>     pub fn new(seed: u64) -> Self {
>         let state = if seed == 0 { 0x853c49e65d70a2b5 } else { seed };
>         FastRng { state }
>     }
> 
>     pub fn next_u64(&mut self) -> u64 {
>         let mut x = self.state;
>         x ^= x << 13;
>         x ^= x >> 7;
>         x ^= x << 17;
>         self.state = x;
>         x
>     }
> }
> 
> pub struct ThreadCleanupGuard {
>     active_count: Option<Arc<AtomicUsize>>,
> }
> 
> impl Drop for ThreadCleanupGuard {
>     fn drop(&mut self) {
>         if let Some(ref count) = self.active_count {
>             count.fetch_sub(1, Ordering::SeqCst);
>         }
>     }
> }
> 
> thread_local! {
>     static PER_THREAD_RNG: RefCell<FastRng> = RefCell::new(FastRng::new(0123456789));
>     static CLEANUP_GUARD: RefCell<ThreadCleanupGuard> = RefCell::new(ThreadCleanupGuard { active_count: None });
> }
> 
> pub fn set_thread_cleanup_tracker(tracker: Arc<AtomicUsize>) {
>     tracker.fetch_add(1, Ordering::SeqCst);
>     CLEANUP_GUARD.with(|guard| {
>         guard.borrow_mut().active_count = Some(tracker);
>     });
> }
> 
> pub fn thread_random_u64() -> u64 {
>     PER_THREAD_RNG.with(|rng| rng.borrow_mut().next_u64())
> }
> 
> pub fn reseed_thread_rng(seed: u64) {
>     PER_THREAD_RNG.with(|rng| {
>         *rng.borrow_mut() = FastRng::new(seed);
>     });
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_thread_rng_determinism_and_reseed() {
>         reseed_thread_rng(42);
>         let val1 = thread_random_u64();
>         let val2 = thread_random_u64();
>         assert_ne!(val1, val2);
> 
>         // Reseeding with identical seed reproduces exact PRNG sequence
>         reseed_thread_rng(42);
>         let val1_again = thread_random_u64();
>         assert_eq!(val1, val1_again);
>     }
> 
>     #[test]
>     fn test_thread_local_isolation_and_destructor_cleanup() {
>         let active_threads = Arc::new(AtomicUsize::new(0));
> 
>         let handles: Vec<_> = (0..3)
>             .map(|i| {
>                 let tracker = Arc::clone(&active_threads);
>                 thread::spawn(move || {
>                     set_thread_cleanup_tracker(tracker);
>                     reseed_thread_rng(100 + i as u64);
>                     let r = thread_random_u64();
>                     assert_ne!(r, 0);
>                 })
>             })
>             .collect();
> 
>         for h in handles {
>             h.join().unwrap();
>         }
> 
>         // After all spawned threads exit, their thread_local! items drop automatically
>         assert_eq!(active_threads.load(Ordering::SeqCst), 0);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Lock-Free PRNG**: Using `thread_local!` for pseudo-random number generation provides each worker thread with its own state register, avoiding atomic lock contention or global seed serialization.
> 2. **Deterministic Reseeding**: Reseeding `PER_THREAD_RNG` mutates only the caller thread's RNG instance, enabling deterministic replay in per-thread simulations or property-based tests.
> 3. **Thread Lifecycle Destructors**: Rust automatically calls `Drop::drop` on `thread_local!` instances when an OS thread completes execution. In `ThreadCleanupGuard::drop`, `active_count.fetch_sub(1)` runs automatically as each spawned thread exits, cleanly tracking thread lifecycles without explicit teardown hooks.
> 
---

## 6. Related Terms


- [Static (`static`)](../level_01/static_static.md) — The program-wide, shared alternative this macro specifically avoids.
- [Interior Mutability](../level_03/interior_mutability.md) — `thread_local!` values are almost always paired with `Cell`/`RefCell`, since the storage itself is accessed through a shared `&` reference via `.with()`.
- [`OnceCell` / `OnceLock` / `LazyLock` / `LazyCell`](oncelock_lazylock.md) — The shared-across-threads sibling tool for lazy global state.
- [`std::thread::spawn`](std_thread_spawn.md) — What creates the separate threads, each lazily getting its own independent `thread_local!` instance on first access.

---

## 7. Key Takeaways

- `thread_local!` gives each thread its **own independent instance** of a value — no two threads ever see or share the same underlying storage.
- Because there's no sharing, there's no data-race possibility, and no `Mutex`/atomics are needed.
- Access goes through `.with(|value| { ... })`, since the macro-declared item itself is a special handle, not the value directly.
- Almost always paired with `Cell`/`RefCell` for interior mutability, since `.with()` only ever hands you a shared `&` reference to the thread's own copy.
