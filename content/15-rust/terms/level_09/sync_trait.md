# `Sync` Trait

> **Level 9 — Concurrency & Parallelism**
> Marker trait indicating a type can be safely shared (via `&T`) between threads.

---

## 1. Prerequisites


- [`Send` Trait](send_trait.md) — The sister trait to `Sync`. You must understand `Send` first!
- [Borrowing (`&`)](../level_03/borrowing.md) — The concept of multiple read-only pointers pointing to the same data.
- [`RefCell<T>`](../level_03/refcell_t.md) — The most famous type that lacks this trait.

---

## 2. Term Category

**Rust-specific (the sharing bouncer)**: The `Send` trait means you are allowed to *move* (transfer ownership of) a variable into a background thread. 

But what if you don't want to move it? What if you want to keep the variable in the main thread, but let 5 different background threads *look at it* simultaneously using shared references (`&T`)? 

The **`Sync`** trait is the mathematical proof to the compiler that a type is safe to be looked at by multiple threads at the exact same time.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The Rust compiler enforces one incredibly brilliant, golden rule: 
> *"A type `T` is `Sync` if and only if `&T` is `Send`."*

This sounds like a tongue-twister, but it translates to: *"It is safe to let multiple threads look at this data simultaneously (`Sync`), ONLY IF it is safe to send a pointer to that data into another thread (`&T` is `Send`)."*

Most types in Rust (like `i32` or `String`) are perfectly safe to read from multiple threads at the same time. Why? Because shared references (`&T`) in Rust are **immutable**! You can't cause a Data Race if nobody is allowed to write to the data.

However, some types (like `RefCell<T>`) use *Interior Mutability*. This means their internal data can be mutated *even through an immutable `&T` reference*. If two threads tried to mutate a `RefCell` at the exact same time, the program would crash. Because of this, the Rust compiler explicitly removes the `Sync` trait from `RefCell`. 

### (2) Reality Metaphor

Imagine a rare painting in a museum. 

- **`Send`** is boxing up the painting, putting it on an airplane, and transferring ownership to a new museum in Paris. 
- **`Sync`** is hanging the painting on the wall and letting 50 different people (threads) look at it at the exact same time (`&T`). 

But what if the painting is actually a magic whiteboard (`RefCell`) that people can draw on while looking at it? If 50 people try to draw on it at the exact same time, chaos ensues! The museum removes the `Sync` sign from the whiteboard, forcing people to take turns.

### (3) Rust Code Examples

#### Short Snippet (The Rule)
Because `Sync` is an auto-trait, you never actually implement it yourself. The compiler does it for you. 

```rust
// The compiler automatically applies this logic to every type you create:
// If my `&T` can be Sent to another thread, then I am Sync!
unsafe auto trait Sync {}
```

#### Fuller Example (The Bouncer in Action)
Let's see what happens if we try to share a `RefCell` across multiple threads using an `Arc` (Atomic Reference Counted pointer). 

`Arc` allows multiple threads to share ownership of data. But `Arc` has a strict rule: the data inside it must be `Send + Sync`!

```rust
use std::sync::Arc;
use std::cell::RefCell;
use std::thread;

fn main() {
    // 1. We wrap a RefCell inside an Arc so we can share it.
    let shared_data = Arc::new(RefCell::new(5));
    let data_clone = Arc::clone(&shared_data);

    // 2. We spawn a thread and try to mutate the RefCell!
    thread::spawn(move || {
        let mut inner = data_clone.borrow_mut();
        *inner += 1;
    });
}
```
**Compiler Error!**
```text
error[E0277]: `RefCell<i32>` cannot be shared between threads safely
   = help: the trait `Sync` is not implemented for `RefCell<i32>`
   = note: required because of the requirements on the impl of `Send` for `Arc<RefCell<i32>>`
```
*Why did it fail?* Because `Arc` gives multiple threads a shared reference to the inner data. But `RefCell` is not `Sync`! It will crash if two threads call `.borrow_mut()` at the same time. The compiler catches this bug instantly.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Sync Trait Scoping and Lifecycle Rules

**The mistake:** Assuming Sync Trait instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("sync_trait_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("sync_trait_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Sync Trait State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Sync Trait through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Sync Trait Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Sync Trait instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: High-Throughput Telemetry System with Atomic `Sync` Guarantees

**Problem:**  
In a multi-threaded web server framework, worker threads concurrently record runtime metrics (request counts, error counters, and status updates) via shared references `&MetricsCollector`. Standard cell types like `RefCell<T>` cannot be shared across threads because `RefCell` does not implement `Sync`. 

Implement a thread-safe telemetry collector `MetricsCollector` that uses atomic types (`AtomicU64`, `AtomicBool`) so that all fields automatically satisfy the compiler's `Sync` auto-trait requirement. Include methods `record_request(&self)`, `record_error(&self)`, `get_metrics(&self) -> (u64, u64)`, and `deactivate(&self)`. Write unit tests verifying that concurrent calls from 10 spawned threads accurately increment counters across shared references without data races or locking overhead.

> [!check]- Answer
> ```rust
> use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
> use std::sync::Arc;
> use std::thread;
> 
> /// A high-throughput telemetry collector safe to share across threads via `&MetricsCollector`.
> pub struct MetricsCollector {
>     request_count: AtomicU64,
>     error_count: AtomicU64,
>     is_active: AtomicBool,
> }
> 
> impl MetricsCollector {
>     pub fn new() -> Self {
>         Self {
>             request_count: AtomicU64::new(0),
>             error_count: AtomicU64::new(0),
>             is_active: AtomicBool::new(true),
>         }
>     }
> 
>     pub fn record_request(&self) {
>         if self.is_active.load(Ordering::Relaxed) {
>             self.request_count.fetch_add(1, Ordering::Relaxed);
>         }
>     }
> 
>     pub fn record_error(&self) {
>         if self.is_active.load(Ordering::Relaxed) {
>             self.error_count.fetch_add(1, Ordering::Relaxed);
>         }
>     }
> 
>     pub fn get_metrics(&self) -> (u64, u64) {
>         (
>             self.request_count.load(Ordering::Relaxed),
>             self.error_count.load(Ordering::Relaxed),
>         )
>     }
> 
>     pub fn deactivate(&self) {
>         self.is_active.store(false, Ordering::Relaxed);
>     }
> }
> 
> /// Compile-time check asserting that `T` implements `Sync`.
> fn assert_sync<T: Sync>() {}
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_concurrent_metrics_collection() {
>         // Validate at compile time that MetricsCollector is Sync
>         assert_sync::<MetricsCollector>();
> 
>         let collector = Arc::new(MetricsCollector::new());
>         let mut handles = vec![];
> 
>         // Spawn 10 concurrent worker threads sharing &MetricsCollector via Arc
>         for i in 0..10 {
>             let collector_ref = Arc::clone(&collector);
>             let handle = thread::spawn(move || {
>                 for _ in 0..100 {
>                     collector_ref.record_request();
>                 }
>                 if i % 2 == 0 {
>                     collector_ref.record_error();
>                 }
>             });
>             handles.push(handle);
>         }
> 
>         for handle in handles {
>             handle.join().unwrap();
>         }
> 
>         let (requests, errors) = collector.get_metrics();
>         assert_eq!(requests, 1000);
>         assert_eq!(errors, 5);
> 
>         // Verify deactivation stops recording
>         collector.deactivate();
>         collector.record_request();
>         let (requests_after, _) = collector.get_metrics();
>         assert_eq!(requests_after, 1000);
>     }
> }
> ```
> 
> **Explanation:**
> 1. **Auto-Trait Mechanics:** `MetricsCollector` contains `AtomicU64` and `AtomicBool`. Since all composite fields implement `Sync`, the compiler automatically derives `Sync` for `MetricsCollector`.
> 2. **Shared Mutation (`&self`):** Atomic types provide lock-free interior mutability using CPU hardware atomic instructions (`fetch_add`, `store`, `load`). Because mutation occurs through immutable references `&self`, sharing `&MetricsCollector` across worker threads is completely thread-safe.
> 3. **Validation:** `assert_sync::<MetricsCollector>()` statically verifies the trait bound `T: Sync`.

---

### Exercise 2: Concurrent Sharded In-Memory Cache with `RwLock` and `Sync` Bounds

**Problem:**  
In read-heavy application services, global locks create lock contention across worker threads. A common pattern is a sharded key-value cache `ShardedCache<K, V, const SHARDS: usize>`, where key-value entries are partitioned across an array of `RwLock<HashMap<K, V>>` shards.

Implement a generic `ShardedCache<K, V, SHARDS>` struct that allows multiple concurrent readers to access different shards via `&ShardedCache`. Explain why `ShardedCache<K, V>` automatically implements `Sync` when `K: Send + Sync` and `V: Send + Sync`. Write a comprehensive unit test suite where 8 parallel threads concurrently read and write entries across shards, using `assert_eq!` to verify stored values and thread safety.

> [!check]- Answer
> ```rust
> use std::collections::hash_map::DefaultHasher;
> use std::collections::HashMap;
> use std::hash::{Hash, Hasher};
> use std::sync::{Arc, RwLock};
> use std::thread;
> 
> /// A high-concurrency sharded key-value cache.
> pub struct ShardedCache<K, V, const SHARDS: usize = 16> {
>     shards: [RwLock<HashMap<K, V>>; SHARDS],
> }
> 
> impl<K: Hash + Eq, V: Clone, const SHARDS: usize> ShardedCache<K, V, SHARDS> {
>     pub fn new() -> Self {
>         let shards = std::array::from_fn(|_| RwLock::new(HashMap::new()));
>         Self { shards }
>     }
> 
>     fn get_shard_index(&self, key: &K) -> usize {
>         let mut hasher = DefaultHasher::new();
>         key.hash(&mut hasher);
>         (hasher.finish() as usize) % SHARDS
>     }
> 
>     pub fn insert(&self, key: K, value: V) {
>         let idx = self.get_shard_index(&key);
>         let mut guard = self.shards[idx].write().expect("RwLock poisoned");
>         guard.insert(key, value);
>     }
> 
>     pub fn get(&self, key: &K) -> Option<V> {
>         let idx = self.get_shard_index(key);
>         let guard = self.shards[idx].read().expect("RwLock poisoned");
>         guard.get(key).cloned()
>     }
> }
> 
> fn assert_sync<T: Sync>() {}
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_sharded_cache_sync_concurrency() {
>         assert_sync::<ShardedCache<String, u64, 8>>();
> 
>         let cache = Arc::new(ShardedCache::<String, u64, 8>::new());
> 
>         // Pre-populate initial cache state
>         for i in 0..100 {
>             cache.insert(format!("key_{i}"), i);
>         }
> 
>         let mut handles = vec![];
> 
>         // Spawn 8 reader threads accessing shared references `&ShardedCache`
>         for thread_idx in 0..8 {
>             let cache_ref = Arc::clone(&cache);
>             handles.push(thread::spawn(move || {
>                 for i in 0..100 {
>                     let key = format!("key_{i}");
>                     let val = cache_ref.get(&key);
>                     assert_eq!(val, Some(i));
>                 }
>                 cache_ref.insert(format!("thread_{thread_idx}"), thread_idx as u64);
>             }));
>         }
> 
>         for handle in handles {
>             handle.join().unwrap();
>         }
> 
>         for thread_idx in 0..8 {
>             let val = cache.get(&format!("thread_{thread_idx}"));
>             assert_eq!(val, Some(thread_idx as u64));
>             assert_ne!(val, None);
>         }
>     }
> }
> ```
> 
> **Explanation:**
> 1. **Trait Derivation Requirements:** `RwLock<T>` is `Sync` if and only if `T: Send + Sync`. Because `HashMap<K, V>` stores `K` and `V`, `ShardedCache<K, V>` automatically inherits `Sync` whenever `K: Send + Sync` and `V: Send + Sync`.
> 2. **Concurrent Reading:** Multiple threads hold immutable references `&ShardedCache` simultaneously. Inside `get()`, acquire `RwLock::read()` allows parallel concurrent read access across threads without exclusive locking.
> 3. **Reduced Contention:** Partitioning data into `SHARDS` minimizes thread locking bottlenecks under high reader/writer concurrency.

---

### Exercise 3: Manual `Sync` Implementation for an UnsafeCell Sequence Buffer

**Problem:**  
Rust's compiler automatically marks types containing `UnsafeCell<T>` as `!Sync` because `UnsafeCell` provides raw interior mutability without synchronization. However, low-level lock-free data structures can use `UnsafeCell` safely if thread synchronization is enforced via atomic operations and release/acquire memory orderings.

Implement a fixed-capacity sequence buffer `AtomicSeqBuffer<T, const N: usize>` backed by `UnsafeCell`. Because `UnsafeCell` disables auto-derived `Sync`, explicitly write `unsafe impl<T: Send, const N: usize> Sync for AtomicSeqBuffer<T, N>`. Explain the exact safety invariants required for this `unsafe impl`. Write a unit test module testing multi-producer insertion across threads, validating index allocation, bounded slot checks (`matches!`), and element retrieval assertions.

> [!check]- Answer
> ```rust
> use std::cell::UnsafeCell;
> use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
> use std::sync::Arc;
> use std::thread;
> 
> pub struct AtomicSlot<T> {
>     data: UnsafeCell<Option<T>>,
>     written: AtomicBool,
> }
> 
> pub struct AtomicSeqBuffer<T, const N: usize> {
>     slots: [AtomicSlot<T>; N],
>     next_index: AtomicUsize,
> }
> 
> // SAFETY: UnsafeCell is !Sync by default. We manually implement Sync because:
> // 1. `next_index` uses AtomicUsize::fetch_add to guarantee each producer thread receives a unique index.
> // 2. Write synchronization is guarded by `written.store(true, Ordering::Release)`.
> // 3. Readers check `written.load(Ordering::Acquire)` before dereferencing `UnsafeCell`.
> // 4. Requirement: T must be Send because values produced by one thread may be read by another.
> unsafe impl<T: Send, const N: usize> Sync for AtomicSeqBuffer<T, N> {}
> unsafe impl<T: Send, const N: usize> Send for AtomicSeqBuffer<T, N> {}
> 
> impl<T, const N: usize> AtomicSeqBuffer<T, N> {
>     pub fn new() -> Self {
>         let slots = std::array::from_fn(|_| AtomicSlot {
>             data: UnsafeCell::new(None),
>             written: AtomicBool::new(false),
>         });
>         Self {
>             slots,
>             next_index: AtomicUsize::new(0),
>         }
>     }
> 
>     pub fn push(&self, value: T) -> Result<usize, T> {
>         let idx = self.next_index.fetch_add(1, Ordering::SeqCst);
>         if idx >= N {
>             return Err(value);
>         }
> 
>         // SAFETY: `idx` is unique across threads due to atomic fetch_add. No concurrent writes occur on this slot.
>         unsafe {
>             let slot_ptr = self.slots[idx].data.get();
>             *slot_ptr = Some(value);
>         }
> 
>         // Publish slot initialization to reader threads with Release ordering
>         self.slots[idx].written.store(true, Ordering::Release);
>         Ok(idx)
>     }
> 
>     pub fn get(&self, index: usize) -> Option<&T> {
>         if index >= N {
>             return None;
>         }
> 
>         // Synchronize with Release store using Acquire load
>         if self.slots[index].written.load(Ordering::Acquire) {
>             // SAFETY: The slot has been written and published. No further mutation will occur.
>             unsafe {
>                 let slot_ptr = self.slots[index].data.get();
>                 (*slot_ptr).as_ref()
>             }
>         } else {
>             None
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_atomic_seq_buffer_sync() {
>         let buffer = Arc::new(AtomicSeqBuffer::<u32, 100>::new());
>         let mut handles = vec![];
> 
>         // Spawn 10 producer threads pushing 10 elements each concurrently
>         for t in 0..10 {
>             let buf_ref = Arc::clone(&buffer);
>             handles.push(thread::spawn(move || {
>                 for i in 0..10 {
>                     let val = (t * 10 + i) as u32;
>                     let res = buf_ref.push(val);
>                     assert!(res.is_ok());
>                 }
>             }));
>         }
> 
>         for h in handles {
>             h.join().unwrap();
>         }
> 
>         // Verify all 100 slots were safely published and populated
>         for i in 0..100 {
>             let val = buffer.get(i);
>             assert!(val.is_some());
>         }
> 
>         // Test boundary conditions and overflow handling
>         assert_eq!(buffer.get(100), None);
>         assert!(matches!(buffer.push(999), Err(999)));
>     }
> }
> ```
> 
> **Explanation:**
> 1. **Why `UnsafeCell` Opts Out of `Sync`:** `UnsafeCell<T>` allows raw interior mutability (`*cell.get() = ...`) without compile-time aliasing checks. Hence, Rust marks it `!Sync` to prevent data races.
> 2. **Safety Invariants for `unsafe impl Sync`:**
>    - Unique index allocation via atomic `fetch_add` guarantees no two threads mutate the same slot.
>    - `Ordering::Release` on `written.store` and `Ordering::Acquire` on `written.load` establish a *happens-before* memory relationship, ensuring reader threads observe the written payload before accessing raw pointers.
> 3. **Trait Bound `T: Send`:** When sharing `&AtomicSeqBuffer<T>` across threads, data created on producer threads is read on consumer threads. Therefore, `T` must implement `Send`.
> 
> ---
> 
## 6. Related Terms

- [`Send` Trait](send_trait.md) — Related concept: `Send` Trait.

---

## 7. Key Takeaways
> 
> - **`Sync`** proves a type can be safely referenced (`&T`) by multiple threads simultaneously.
> - A type `T` is `Sync` if and only if `&T` is `Send`.
> - Most primitive types and immutable structs are automatically `Sync` because immutable reads are always thread-safe.
> - Types with non-thread-safe Interior Mutability (like `RefCell<T>`) are *not* `Sync`.
> - **`Send` is for moving; `Sync` is for sharing.**
> 
