# `Arc<T>`

> **Level 3 — Ownership & Borrowing**
> Thread-safe version of `Rc<T>` using atomic reference counting.

---

## 1. Prerequisites

- [`Rc<T>`](../level_03/rc_t.md) — You must understand how basic Reference Counting works first.
- [Ownership](../level_03/ownership.md) — The fundamental rule that both `Rc` and `Arc` are designed to bypass.

---

## 2. Term Category

**Rust-specific (the concurrent equivalent)**: While many languages use heavy, universal Garbage Collectors to manage memory across threads, Rust uses a specialized, explicit Atomic Reference Counter.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

We know that `Rc<T>` allows multiple owners to share data by keeping an integer count of how many owners exist. But if you try to pass an `Rc` into a background thread, the compiler throws a massive error. Why?

Because updating a standard integer across multiple threads is dangerous! If Thread A and Thread B both try to increment the `Rc` count at the exact same nanosecond, the CPU might drop one of the updates. The count becomes corrupted. If the count hits `0` early, the data drops while a thread is still using it. If the count never hits `0`, you get a permanent memory leak.

To fix this, we need **`Arc<T>`** (**A**tomic **R**eference **C**ounted). It does the exact same thing as `Rc`, but uses special hardware CPU instructions ("Atomics") to guarantee that the integer count is updated perfectly and safely across threads without ever corrupting.

### (2) Reality Metaphor

Imagine two people (**Threads**) standing in different rooms, trying to update a shared chalkboard tally (**`Rc`**). Because they can't coordinate, they might both walk up to the board at the exact same second, see the number `1`, erase it, and both write `2`. They just added two viewers, but the board only says `2` instead of `3`! The tally is corrupted.

**`Arc<T>`** is like replacing the chalkboard with a heavy, mechanical turnstile. No matter how fast people push through it simultaneously, the mechanical gears lock up and physically force the count to increment perfectly, one by one.

### (3) Rust Code Examples

#### Short Snippet (Sharing across threads)
Using `Arc` looks identical to using `Rc`. You just swap the names.

```rust
use std::sync::Arc;
use std::thread;

fn main() {
    // 1. Wrap data in an Atomic Reference Counter
    let shared_data = Arc::new(String::from("Thread Secret"));
    
    // 2. Clone it for the new thread (safely increments count to 2)
    let data_for_thread = Arc::clone(&shared_data);
    
    // 3. Move the clone into the background thread
    let handle = thread::spawn(move || {
        println!("Background thread reads: {}", data_for_thread);
    }); // count drops to 1 here!
    
    println!("Main thread reads: {}", shared_data);
    
    handle.join().unwrap();
} // count drops to 0 here. String is dropped!
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Arc T Scoping and Lifecycle Rules

**The mistake:** Assuming Arc T instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("arc_t_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("arc_t_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Arc T State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Arc T through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Arc T Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Arc T instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Zero-Copy Concurrent Log Broadcast & Atomic Telemetry Pipeline

**Scenario:** In a high-throughput microservice, a central telemetry node loads log snapshot buffers into memory and broadcasts them to multiple background worker threads for parallel filtering without copying the buffer content. Each worker thread updates a shared atomic counter to record query metrics.

**Task:**
1. Implement `SharedLogSnapshot` holding an `Arc<Vec<String>>` for the log lines and an `Arc<AtomicUsize>` for query count.
2. Implement `process_logs_concurrently` to spawn worker threads using `Arc::clone`, filter matching lines containing a keyword, and return results.
3. Write comprehensive unit tests verifying strong pointer counts, matching entries, atomic query counts, and pattern matching assertions.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::sync::atomic::{AtomicUsize, Ordering};
> use std::sync::Arc;
> use std::thread;
> 
> pub struct SharedLogSnapshot {
>     logs: Arc<Vec<String>>,
>     query_count: Arc<AtomicUsize>,
> }
> 
> impl SharedLogSnapshot {
>     pub fn new(logs: Vec<String>) -> Self {
>         Self {
>             logs: Arc::new(logs),
>             query_count: Arc::new(AtomicUsize::new(0)),
>         }
>     }
> 
>     pub fn filter_keyword(&self, keyword: &str) -> Vec<String> {
>         self.query_count.fetch_add(1, Ordering::SeqCst);
>         self.logs
>             .iter()
>             .filter(|line| line.contains(keyword))
>             .cloned()
>             .collect()
>     }
> 
>     pub fn query_count(&self) -> usize {
>         self.query_count.load(Ordering::SeqCst)
>     }
> 
>     pub fn strong_count(&self) -> usize {
>         Arc::strong_count(&self.logs)
>     }
> }
> 
> pub fn process_logs_concurrently(
>     snapshot: &SharedLogSnapshot,
>     keyword: &str,
>     num_workers: usize,
> ) -> Vec<Vec<String>> {
>     let mut handles = Vec::with_capacity(num_workers);
> 
>     for _ in 0..num_workers {
>         let logs_clone = Arc::clone(&snapshot.logs);
>         let count_clone = Arc::clone(&snapshot.query_count);
>         let kw = keyword.to_string();
> 
>         let handle = thread::spawn(move || {
>             count_clone.fetch_add(1, Ordering::SeqCst);
>             logs_clone
>                 .iter()
>                 .filter(|line| line.contains(&kw))
>                 .cloned()
>                 .collect::<Vec<String>>()
>         });
>         handles.push(handle);
>     }
> 
>     handles
>         .into_iter()
>         .map(|h| h.join().expect("Worker thread panicked"))
>         .collect()
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_concurrent_log_filtering() {
>         let logs = vec![
>             "INFO: System boot".to_string(),
>             "ERROR: Out of memory".to_string(),
>             "WARN: High CPU usage".to_string(),
>             "ERROR: Disk read failure".to_string(),
>         ];
> 
>         let snapshot = SharedLogSnapshot::new(logs);
> 
>         // Verify initial strong pointer count is 1
>         assert_eq!(snapshot.strong_count(), 1);
> 
>         let worker_results = process_logs_concurrently(&snapshot, "ERROR", 4);
> 
>         // Verify all worker threads completed successfully and returned matching errors
>         assert_eq!(worker_results.len(), 4);
>         for res in &worker_results {
>             assert_eq!(res.len(), 2);
>             assert!(res[0].contains("ERROR"));
>             assert_ne!(res[0], res[1]);
>         }
> 
>         // Verify total atomic query executions across threads
>         assert_eq!(snapshot.query_count(), 4);
> 
>         // Verify strong reference count returned to 1 after worker threads exited
>         assert_eq!(snapshot.strong_count(), 1);
> 
>         // Verify slice matching with matches!
>         let single_filter = snapshot.filter_keyword("WARN");
>         assert!(matches!(single_filter.as_slice(), [ref line] if line.contains("WARN")));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
>
>
> 1. **Step-by-Step Technical Breakdown**:
>    - `SharedLogSnapshot::new` wraps a `Vec<String>` in an `Arc`, allocating a control block on the heap alongside the log buffer.
>    - `process_logs_concurrently` loops `num_workers` times, invoking `Arc::clone(&snapshot.logs)` and `Arc::clone(&snapshot.query_count)` for each worker. `Arc::clone` increments the atomic strong reference count without copying the string buffer vectors.
>    - `thread::spawn(move || ...)` transfers ownership of the cloned `Arc` handles into each thread's closure frame.
>    - Each thread executes its search, atomically updates `query_count` via `fetch_add`, and exits. Joining the handles cleans up thread execution states and drops the thread-local `Arc` references.
>
> 2. **Language Invariants & Thread Safety (`Send` / `Sync`)**:
>    - `Arc<T>` implements `Send` and `Sync` if and only if `T: Send + Sync`. Since `Vec<String>` and `AtomicUsize` both implement `Send + Sync`, `Arc<Vec<String>>` can safely cross OS thread boundaries.
>    - `Rc<T>` cannot be used here because its reference count increment is non-atomic and lacks `Send` / `Sync` trait implementations.
>
> 3. **Lifetime & Ownership Implications**:
>    - The closure passed to `thread::spawn` requires a `'static` lifetime boundary because OS threads can theoretically outlive the caller's stack frame. `Arc` satisfies `'static` ownership by taking owned heap data across thread boundaries.
>    - When worker threads finish, their internal `Arc` instances are dropped, calling `fetch_sub` atomically. Once all worker handles join and exit, `strong_count` drops back to 1.
>
> 4. **Memory Layout**:
>    - `Arc<Vec<String>>` consists of a stack-allocated 8-byte pointer targeting an inline heap allocation formatted as `[ strong: AtomicUsize | weak: AtomicUsize | data: Vec<String> ]`.
>    - The underlying string buffer heap allocation is shared seamlessly across all workers with zero memory duplication.
>
> 5. **Edge Cases**:
>    - If a worker thread panics during filtering, `handle.join()` returns an `Err(Box<dyn Any>)`. The `expect` unwraps this and propagates the failure cleanly while dropping the thread's `Arc` handle to avoid memory leaks.

---

### Exercise 2: Lock-Free Observer Registry with `Arc<T>` and `Weak<T>` Weak Reference Upgrades

**Scenario:** An event notification engine maintains a list of observer callbacks across worker services. To prevent cyclic reference memory leaks and avoid keeping observers alive beyond their domain scope, the event hub stores subscribers as `Weak<Observer>`. During event dispatches, the hub attempts to upgrade `Weak<Observer>` references to `Arc<Observer>`, safely skipping observers that have been dropped.

**Task:**
1. Implement `Observer` containing `id`, `name`, and an atomic processed event count.
2. Implement `EventHub` maintaining `subscribers: Vec<Weak<Observer>>`.
3. Implement `subscribe`, `publish`, and `prune` methods using `Arc::downgrade` and `Weak::upgrade`.
4. Write unit tests with assertions (`assert_eq!`, `assert!`, `assert_ne!`, `matches!`) demonstrating dynamic subscriber drop, safe upgrade handling, and list pruning.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::sync::atomic::{AtomicUsize, Ordering};
> use std::sync::{Arc, Weak};
> 
> pub struct Observer {
>     pub id: u64,
>     pub name: String,
>     processed_count: AtomicUsize,
> }
> 
> impl Observer {
>     pub fn new(id: u64, name: &str) -> Self {
>         Self {
>             id,
>             name: name.to_string(),
>             processed_count: AtomicUsize::new(0),
>         }
>     }
> 
>     pub fn notify(&self, _event: &str) {
>         self.processed_count.fetch_add(1, Ordering::SeqCst);
>     }
> 
>     pub fn processed_count(&self) -> usize {
>         self.processed_count.load(Ordering::SeqCst)
>     }
> }
> 
> pub struct EventHub {
>     subscribers: Vec<Weak<Observer>>,
> }
> 
> impl EventHub {
>     pub fn new() -> Self {
>         Self {
>             subscribers: Vec::new(),
>         }
>     }
> 
>     pub fn subscribe(&mut self, observer: &Arc<Observer>) {
>         self.subscribers.push(Arc::downgrade(observer));
>     }
> 
>     pub fn publish(&self, event: &str) -> usize {
>         let mut delivered = 0;
>         for weak_sub in &self.subscribers {
>             if let Some(observer) = weak_sub.upgrade() {
>                 observer.notify(event);
>                 delivered += 1;
>             }
>         }
>         delivered
>     }
> 
>     pub fn prune(&mut self) {
>         self.subscribers.retain(|weak_sub| weak_sub.strong_count() > 0);
>     }
> 
>     pub fn subscriber_count(&self) -> usize {
>         self.subscribers.len()
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_weak_observer_lifecycle_and_pruning() {
>         let mut hub = EventHub::new();
> 
>         let obs1 = Arc::new(Observer::new(1, "MetricsWorker"));
>         let obs2 = Arc::new(Observer::new(2, "AuditLogger"));
> 
>         hub.subscribe(&obs1);
>         hub.subscribe(&obs2);
> 
>         assert_eq!(hub.subscriber_count(), 2);
>         assert_eq!(Arc::strong_count(&obs1), 1);
>         assert_eq!(Arc::weak_count(&obs1), 1);
> 
>         // Publish event while both observers exist
>         let delivered = hub.publish("USER_LOGIN");
>         assert_eq!(delivered, 2);
>         assert_eq!(obs1.processed_count(), 1);
>         assert_eq!(obs2.processed_count(), 1);
> 
>         // Explicitly drop obs2
>         drop(obs2);
> 
>         // Publish event when one observer is dropped
>         let delivered_after_drop = hub.publish("USER_LOGOUT");
>         assert_eq!(delivered_after_drop, 1);
>         assert_eq!(obs1.processed_count(), 2);
>         assert!(obs1.processed_count() > 0);
> 
>         // Verify unpruned count vs pruned count
>         assert_ne!(hub.subscriber_count(), 1); // Weak handle still exists in Vec
>         hub.prune();
>         assert_eq!(hub.subscriber_count(), 1); // Successfully pruned
> 
>         // Match subscriber upgrade using matches!
>         let remaining_weak = &hub.subscribers[0];
>         let upgraded = remaining_weak.upgrade();
>         assert!(matches!(upgraded, Some(ref obs) if obs.id == 1));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
>
>
> 1. **Step-by-Step Technical Breakdown**:
>    - `Arc::downgrade(&obs)` creates a non-owning `Weak<Observer>` handle and increments the atomic `weak` pointer counter without altering `strong_count`.
>    - During `publish`, `weak_sub.upgrade()` attempts to convert `Weak<Observer>` into `Arc<Observer>`. If `strong_count > 0`, it atomically increments `strong_count` and returns `Some(Arc<Observer>)`. If the original `Arc` was dropped, it returns `None`.
>    - `prune` filters out handles where `weak_sub.strong_count() == 0`, reclaiming administrative vector slots.
> 
> 2. **Language Invariants & Cycle Prevention**:
>    - Holding strong `Arc` references inside registry collections causes reference cycles or memory leaks if subscribers are never explicitly unregistered.
>    - Using `Weak<T>` ensures that observer instances drop as soon as their domain owners out of scope, eliminating memory leaks while keeping dispatches safe.
> 
> 3. **Lifetime & Ownership Implications**:
>    - `Weak<T>` does not grant direct access to `T`. Access requires temporary upgrading to `Arc<T>`, which holds a strong reference for the scope of `Some(observer)`.
>    - Once `notify` finishes, `observer` falls out of scope, dropping the upgraded strong reference back to zero if no other strong references exist.
> 
> 4. **Memory Layout**:
>    - An `Arc` allocation header keeps `[ strong: AtomicUsize | weak: AtomicUsize | data: T ]`.
>    - When `strong` reaches 0, `data` (`Observer`) is dropped immediately and its internal buffer is deallocated. However, the control block `[ strong | weak ]` remains allocated until `weak` also drops to 0.
> 
> 5. **Edge Cases**:
>    - Concurrent drop during `upgrade()`: Atomic CPU instructions ensure that `upgrade()` either successfully increments `strong_count` before drop completes or observes `0` and returns `None`, guaranteeing zero data races.

---

### Exercise 3: Multithreaded Metric Aggregation Engine with `Arc<Mutex<T>>` Interior Mutability

**Scenario:** In a parallel stream processing platform, multiple worker threads process chunks of financial transactions concurrently and aggregate runtime metrics (total processing amount, success counts, error codes) into a shared accumulator. Since `Arc<T>` only permits immutable `&T` borrows across threads, it must be paired with a `Mutex<T>` (`Arc<Mutex<MetricsAccumulator>>`) to achieve thread-safe interior mutability.

**Task:**
1. Implement `Transaction` struct and `MetricsAccumulator` struct.
2. Implement `process_transaction_batches` spawning worker threads for each batch.
3. Use `Arc::clone` and `Mutex::lock` to update shared state safely across threads.
4. Write unit tests with explicit assertions (`assert_eq!`, `assert!`, `assert_ne!`, `matches!`) verifying multithreaded metrics aggregation, strong reference counter transitions, and mutex lock safety.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::sync::{Arc, Mutex};
> use std::thread;
> 
> #[derive(Debug, Clone)]
> pub struct Transaction {
>     pub id: u64,
>     pub amount: f64,
>     pub is_valid: bool,
>     pub error_code: Option<String>,
> }
> 
> #[derive(Debug, Default)]
> pub struct MetricsAccumulator {
>     pub total_amount: f64,
>     pub success_count: u64,
>     pub failure_count: u64,
>     pub errors: Vec<String>,
> }
> 
> impl MetricsAccumulator {
>     pub fn record(&mut self, tx: &Transaction) {
>         if tx.is_valid {
>             self.total_amount += tx.amount;
>             self.success_count += 1;
>         } else {
>             self.failure_count += 1;
>             if let Some(err) = &tx.error_code {
>                 self.errors.push(err.clone());
>             }
>         }
>     }
> }
> 
> pub fn process_transaction_batches(
>     batches: Vec<Vec<Transaction>>,
>     shared_metrics: Arc<Mutex<MetricsAccumulator>>,
> ) {
>     let mut handles = Vec::with_capacity(batches.len());
> 
>     for batch in batches {
>         let metrics_clone = Arc::clone(&shared_metrics);
>         let handle = thread::spawn(move || {
>             for tx in &batch {
>                 let mut guard = metrics_clone
>                     .lock()
>                     .expect("Mutex poisoned by thread panic");
>                 guard.record(tx);
>             }
>         });
>         handles.push(handle);
>     }
> 
>     for handle in handles {
>         handle.join().expect("Worker thread panicked");
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_concurrent_metrics_aggregation() {
>         let metrics = Arc::new(Mutex::new(MetricsAccumulator::default()));
> 
>         // Initial strong count is 1
>         assert_eq!(Arc::strong_count(&metrics), 1);
> 
>         let batch1 = vec![
>             Transaction { id: 1, amount: 150.0, is_valid: true, error_code: None },
>             Transaction { id: 2, amount: 0.0, is_valid: false, error_code: Some("ERR_INSUFFICIENT_FUNDS".to_string()) },
>         ];
> 
>         let batch2 = vec![
>             Transaction { id: 3, amount: 250.5, is_valid: true, error_code: None },
>             Transaction { id: 4, amount: 99.5, is_valid: true, error_code: None },
>         ];
> 
>         process_transaction_batches(vec![batch1, batch2], Arc::clone(&metrics));
> 
>         // Strong pointer count resets back to 1 after threads join
>         assert_eq!(Arc::strong_count(&metrics), 1);
> 
>         let final_metrics = metrics.lock().unwrap();
> 
>         assert_eq!(final_metrics.success_count, 3);
>         assert_eq!(final_metrics.failure_count, 1);
>         assert_eq!(final_metrics.total_amount, 500.0);
>         assert_ne!(final_metrics.success_count, final_metrics.failure_count);
>         assert!(final_metrics.total_amount > 0.0);
> 
>         // Verify recorded error code using matches!
>         assert!(matches!(final_metrics.errors.as_slice(), [ref err] if err == "ERR_INSUFFICIENT_FUNDS"));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
>
>
> 1. **Step-by-Step Technical Breakdown**:
>    - `Arc::new(Mutex::new(...))` wraps the accumulator in a thread-safe interior mutability container.
>    - `process_transaction_batches` clones `Arc` for each worker thread, incrementing `strong_count`.
>    - Inside each worker thread loop, `metrics_clone.lock()` requests exclusive access. Once acquired, it returns a `MutexGuard`, allowing mutable operation `guard.record(tx)`.
>    - Upon exiting scope at the end of each loop iteration or thread execution, RAII drops `MutexGuard`, releasing the hardware lock for other threads.
> 
> 2. **Language Invariants & Interior Mutability**:
>    - `Arc<T>` strictly provides shared immutable references (`&T`). It does not allow calling `&mut T` methods on the underlying data.
>    - To modify data shared via `Arc`, an interior mutability primitive implementing `Sync` (such as `Mutex<T>` or `RwLock<T>`) is required. `RefCell<T>` cannot be used across threads because it is `!Sync`.
> 
> 3. **Lifetime & Ownership Implications**:
>    - The `MutexGuard<'a, T>` returned by `.lock()` borrows the `Mutex` for lifetime `'a`. The lock remains held until the guard is dropped.
>    - Scoping lock guards tightly ensures lock contention between concurrent worker threads is minimized.
> 
> 4. **Memory Layout**:
>    - `Arc<Mutex<MetricsAccumulator>>` layout: Stack pointer -> `[ strong: AtomicUsize | weak: AtomicUsize | Mutex { lock_state: AtomicU32, data: MetricsAccumulator } ]`.
> 
> 5. **Edge Cases & Poisoning**:
>    - If a worker thread panics while holding the `MutexGuard`, the `Mutex` enters a poisoned state. Subsequent `.lock()` calls return `Err(PoisonError)`. Calling `.expect(...)` or `.unwrap()` explicitly surfaces the panic and prevents corrupt state processing.

---

## 6. Related Terms

- [`Rc<T>`](../level_03/rc_t.md) — The faster, single-threaded sibling.
- [`Mutex<T>`](../level_09/mutex_t.md) — Often wrapped inside an `Arc` (as `Arc<Mutex<T>>`) to allow thread-safe mutation.
- [`RefCell<T>`](../level_03/refcell_t.md) — The single-threaded way to mutate shared data (used with `Rc`).

---

## 7. Key Takeaways

- `Arc<T>` stands for **Atomic Reference Counted**.
- It does the exact same thing as `Rc<T>` (Shared Ownership), but it is **Thread Safe**.
- It uses special CPU instructions to ensure the owner count is never corrupted, even if multiple threads clone it simultaneously.
- Because these atomic instructions have a slight performance cost, you should only use `Arc` when dealing with threads. Otherwise, stick to `Rc`.
- Like `Rc`, the data inside an `Arc` is strictly read-only!
