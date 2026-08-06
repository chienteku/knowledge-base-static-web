# `Arc<Mutex<T>>`

> **Level 9 — Concurrency & Parallelism**
> Common pattern for shared mutable state across threads.

---

## 1. Prerequisites


- [`Arc<T>`](../level_03/arc_t.md) — The thread-safe smart pointer that allows shared ownership.
- [`Mutex<T>`](mutex_t.md) — The lock that allows safe mutation.
- [`std::thread::spawn`](std_thread_spawn.md) — The function that creates the threads requiring this pattern!

---

## 2. Term Category

**Concurrency Pattern (Shared Mutable Thread-Safe State)**: `Arc<Mutex<T>>` is the canonical Rust pattern combining `Arc<T>` (Atomic Reference Counting for thread-safe shared ownership) with `Mutex<T>` (Mutual Exclusion for thread-safe interior mutability).

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Rust enforces strict aliasing and ownership rules:
- Data can have either multiple shared immutable references (`&T`) OR a single exclusive mutable reference (`&mut T`).
- Across OS threads, shared access requires thread-safe reference counting (`Arc<T>`), but `Arc<T>` only grants immutable `&T` access to its payload.
- To mutate shared data across threads without raw pointers or `unsafe`, Rust uses **composition**:
  - `Arc<T>` provides shared, multi-thread ownership by atomically tracking reference counts.
  - `Mutex<T>` provides thread-safe *interior mutability*, locking runtime access so only one thread can mutate `T` at a time.

Combining them into `Arc<Mutex<T>>` allows multiple threads to hold shared ownership of a mutex while safely acquiring exclusive mutable access (`MutexGuard<'a, T>`) on demand.

### (2) Reality Metaphor

A secure office document safe:
- **`Arc`**: The company badge and building pass given to 10 employees. Everyone holds an equivalent pass to enter the room where the safe lives.
- **`Mutex`**: The single key to the document safe. Even though 10 employees can stand in the room (`Arc`), only one employee can hold the key (`Mutex.lock()`), open the safe, and edit the document at a time.

### (3) Rust Code Examples

#### Basic `Arc<Mutex<T>>` Counter across 10 Threads
```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter_clone = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            let mut num = counter_clone.lock().unwrap();
            *num += 1;
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    assert_eq!(*counter.lock().unwrap(), 10);
    println!("Final counter value: {}", *counter.lock().unwrap());
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Holding a `MutexGuard` across Long-Running Tasks or `.await` Points

**The mistake:** Holding the `MutexGuard` across expensive network requests, disk I/O, or async `.await` yield points.

**Why it is wrong:** Keeping the lock acquired blocks all other threads attempting to access the `Arc<Mutex<T>>`, creating severe performance bottlenecks and lock starvation. In async Rust (`tokio`), holding a `std::sync::MutexGuard` across `.await` points violates `Send` bounds or leads to deadlocks.

*Incorrect:*
```rust
let mut guard = shared_data.lock().unwrap();
do_expensive_network_io(); // ❌ Lock held during network wait! Blocks all other threads!
*guard += 1;
```

*Fix:*
```rust
// Scope lock guard tightly to minimize critical section!
{
    let mut guard = shared_data.lock().unwrap();
    *guard += 1;
} // Guard dropped here!
do_expensive_network_io(); // Non-blocking!
```

### Mistake 2: Inconsistent Lock Acquisition Order Causing Deadlocks

**The mistake:** Thread A locks `Mutex 1` then `Mutex 2`, while Thread B locks `Mutex 2` then `Mutex 1`.

**Why it is wrong:** Results in classic thread deadlocks where Thread A waits for `Mutex 2` and Thread B waits for `Mutex 1`, stalling execution indefinitely.

*Incorrect:*
```rust
// Thread A: lock(m1) -> lock(m2)
// Thread B: lock(m2) -> lock(m1) // ❌ Deadlock!
```

*Fix:*
```rust
// Enforce a strict, global lock acquisition hierarchy across all thread entry points!
```

### Mistake 3: Using Non-Thread-Safe Combinations like `Rc<Mutex<T>>` or `Arc<RefCell<T>>` across Threads

**The mistake:** Attempting to spawn threads with `Rc<Mutex<T>>` or `Arc<RefCell<T>>`.

**Why it is wrong:** `Rc` does not implement `Send` or `Sync` (atomics are missing), and `RefCell` uses non-atomic reference counting for interior mutability. The Rust compiler blocks compilation with error `E0277` (`trait Send is not implemented`).

---

## 5. Practice Exercises

### Exercise 1: Multi-Threaded In-Memory Cache with TTL

**Scenario:** In high-concurrency web applications, caching expensive database queries or session metadata in memory across multiple worker threads is a standard requirement. Implement a thread-safe `ConcurrentCache<K, V>` using `Arc<Mutex<HashMap<K, CacheEntry<V>>>>`.

**Requirements:**
1. Implement `ConcurrentCache` with `set`, `get`, `cleanup_expired`, and `len` methods.
2. Support TTL eviction logic.
3. Write unit tests executing concurrent writes and reads across 10 threads.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::HashMap;
> use std::hash::Hash;
> use std::sync::{Arc, Mutex};
> use std::time::{Duration, Instant};
> 
> #[derive(Clone, Debug, PartialEq)]
> pub struct CacheEntry<V> {
>     pub value: V,
>     pub expires_at: Instant,
> }
> 
> pub struct ConcurrentCache<K, V> {
>     store: Arc<Mutex<HashMap<K, CacheEntry<V>>>>,
> }
> 
> impl<K, V> ConcurrentCache<K, V>
> where
>     K: Eq + Hash + Clone + Send + 'static,
>     V: Clone + Send + 'static,
> {
>     pub fn new() -> Self {
>         Self {
>             store: Arc::new(Mutex::new(HashMap::new())),
>         }
>     }
> 
>     pub fn set(&self, key: K, value: V, ttl: Duration) {
>         let entry = CacheEntry {
>             value,
>             expires_at: Instant::now() + ttl,
>         };
>         let mut guard = self.store.lock().unwrap();
>         guard.insert(key, entry);
>     }
> 
>     pub fn get(&self, key: &K) -> Option<V> {
>         let mut guard = self.store.lock().unwrap();
>         if let Some(entry) = guard.get(key) {
>             if Instant::now() < entry.expires_at {
>                 return Some(entry.value.clone());
>             }
>         }
>         guard.remove(key);
>         None
>     }
> 
>     pub fn cleanup_expired(&self) -> usize {
>         let mut guard = self.store.lock().unwrap();
>         let now = Instant::now();
>         let initial_len = guard.len();
>         guard.retain(|_, entry| entry.expires_at > now);
>         initial_len - guard.len()
>     }
> 
>     pub fn len(&self) -> usize {
>         let guard = self.store.lock().unwrap();
>         guard.len()
>     }
> 
>     pub fn is_empty(&self) -> bool {
>         self.len() == 0
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
>     use std::thread;
> 
>     #[test]
>     fn test_concurrent_cache_operations() {
>         let cache = Arc::new(ConcurrentCache::new());
>         let mut handles = vec![];
> 
>         for i in 0..10 {
>             let cache_clone = Arc::clone(&cache);
>             handles.push(thread::spawn(move || {
>                 cache_clone.set(format!("session_{i}"), i, Duration::from_millis(150));
>             }));
>         }
> 
>         for handle in handles {
>             handle.join().unwrap();
>         }
> 
>         assert_eq!(cache.len(), 10);
>         assert_eq!(cache.get(&"session_0".to_string()), Some(0));
>         assert_eq!(cache.get(&"session_5".to_string()), Some(5));
> 
>         thread::sleep(Duration::from_millis(200));
> 
>         assert_eq!(cache.get(&"session_0".to_string()), None);
>         let evicted = cache.cleanup_expired();
>         assert_eq!(evicted, 9);
>         assert_eq!(cache.len(), 0);
>         assert!(cache.is_empty());
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `Arc` provides multi-thread shared ownership of the underlying `Mutex<HashMap<K, CacheEntry<V>>>`.
> 2. `Mutex` grants safe interior mutability so concurrent threads can insert and mutate map entries safely.
> 3. Lock guards are held for minimal scope during `get` and `set` operations to minimize thread lock contention.
> 
---

### Exercise 2: Multi-Producer Multi-Consumer Thread-Safe Job Queue

**Scenario:** Task processing engines require a thread-safe task queue where producer threads submit jobs and worker threads consume them. Implement `WorkDispatcher<T>` using `Arc<(Mutex<QueueInner<T>>, Condvar)>`.

**Requirements:**
1. Implement `push`, `pop`, and `shutdown` methods.
2. Use `Condvar` to block worker threads efficiently when the queue is empty.
3. Write unit tests with 4 worker threads consuming 100 producer tasks.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::VecDeque;
> use std::sync::{Arc, Condvar, Mutex};
> use std::thread;
> use std::time::Duration;
> 
> struct QueueInner<T> {
>     tasks: VecDeque<T>,
>     is_shutdown: bool,
> }
> 
> pub struct WorkDispatcher<T> {
>     shared: Arc<(Mutex<QueueInner<T>>, Condvar)>,
> }
> 
> impl<T: Send + 'static> WorkDispatcher<T> {
>     pub fn new() -> Self {
>         Self {
>             shared: Arc::new((
>                 Mutex::new(QueueInner {
>                     tasks: VecDeque::new(),
>                     is_shutdown: false,
>                 }),
>                 Condvar::new(),
>             )),
>         }
>     }
> 
>     pub fn push(&self, task: T) -> Result<(), T> {
>         let (lock, cvar) = &*self.shared;
>         let mut inner = lock.lock().unwrap();
>         if inner.is_shutdown {
>             return Err(task);
>         }
>         inner.tasks.push_back(task);
>         cvar.notify_one();
>         Ok(())
>     }
> 
>     pub fn pop(&self) -> Option<T> {
>         let (lock, cvar) = &*self.shared;
>         let mut inner = lock.lock().unwrap();
>         loop {
>             if let Some(task) = inner.tasks.pop_front() {
>                 return Some(task);
>             }
>             if inner.is_shutdown {
>                 return None;
>             }
>             inner = cvar.wait(inner).unwrap();
>         }
>     }
> 
>     pub fn shutdown(&self) {
>         let (lock, cvar) = &*self.shared;
>         let mut inner = lock.lock().unwrap();
>         inner.is_shutdown = true;
>         cvar.notify_all();
>     }
> }
> 
> impl<T: Send + 'static> Default for WorkDispatcher<T> {
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
>     fn test_work_dispatcher_pipeline() {
>         let dispatcher = Arc::new(WorkDispatcher::<u64>::new());
>         let mut worker_handles = vec![];
> 
>         for _ in 0..4 {
>             let dispatcher_clone = Arc::clone(&dispatcher);
>             worker_handles.push(thread::spawn(move || {
>                 let mut local_sum = 0u64;
>                 while let Some(task) = dispatcher_clone.pop() {
>                     local_sum += task;
>                 }
>                 local_sum
>             }));
>         }
> 
>         for i in 1..=100 {
>             assert!(dispatcher.push(i).is_ok());
>         }
> 
>         thread::sleep(Duration::from_millis(50));
>         dispatcher.shutdown();
> 
>         let total_sum: u64 = worker_handles
>             .into_iter()
>             .map(|h| h.join().unwrap())
>             .sum();
> 
>         let expected_sum: u64 = (1..=100).sum();
>         assert_eq!(total_sum, expected_sum);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `Arc` shares the tuple containing the `Mutex` queue and `Condvar` condition variable across worker threads.
> 2. `Condvar::wait` automatically unlocks the `Mutex` guard while sleeping to avoid CPU spinning.
> 3. `shutdown` sets `is_shutdown` and broadcasts `notify_all` to cleanly exit worker threads.
> 
---

### Exercise 3: Thread-Safe Token Bucket Rate Limiter

**Scenario:** API gateways require thread-safe rate limiters to throttle requests across incoming worker connections. Implement `SharedRateLimiter` wrapping `Arc<Mutex<TokenBucket>>` using the Token Bucket algorithm.

**Requirements:**
1. Implement `SharedRateLimiter` with `allow_request` and `available_tokens` methods.
2. Support refill calculations inside the mutex lock.
3. Write unit tests validating thread safety across concurrent token consumption attempts.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::sync::{Arc, Mutex};
> use std::thread;
> use std::time::{Duration, Instant};
> 
> #[derive(Debug)]
> pub struct TokenBucket {
>     capacity: f64,
>     refill_rate: f64,
>     tokens: f64,
>     last_refill: Instant,
> }
> 
> impl TokenBucket {
>     pub fn new(capacity: f64, refill_rate: f64) -> Self {
>         Self {
>             capacity,
>             refill_rate,
>             tokens: capacity,
>             last_refill: Instant::now(),
>         }
>     }
> 
>     fn refill(&mut self) {
>         let now = Instant::now();
>         let elapsed = now.duration_since(self.last_refill).as_secs_f64();
>         self.tokens = (self.tokens + elapsed * self.refill_rate).min(self.capacity);
>         self.last_refill = now;
>     }
> 
>     pub fn try_consume(&mut self, tokens: f64) -> bool {
>         self.refill();
>         if self.tokens >= tokens {
>             self.tokens -= tokens;
>             true
>         } else {
>             false
>         }
>     }
> 
>     pub fn remaining_tokens(&mut self) -> f64 {
>         self.refill();
>         self.tokens
>     }
> }
> 
> pub struct SharedRateLimiter {
>     limiter: Arc<Mutex<TokenBucket>>,
> }
> 
> impl SharedRateLimiter {
>     pub fn new(capacity: f64, refill_rate: f64) -> Self {
>         Self {
>             limiter: Arc::new(Mutex::new(TokenBucket::new(capacity, refill_rate))),
>         }
>     }
> 
>     pub fn allow_request(&self, tokens: f64) -> bool {
>         let mut guard = self.limiter.lock().unwrap();
>         guard.try_consume(tokens)
>     }
> 
>     pub fn available_tokens(&self) -> f64 {
>         let mut guard = self.limiter.lock().unwrap();
>         guard.remaining_tokens()
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_concurrent_rate_limiter() {
>         let rate_limiter = Arc::new(SharedRateLimiter::new(5.0, 10.0));
>         let mut handles = vec![];
> 
>         for _ in 0..5 {
>             let limiter_clone = Arc::clone(&rate_limiter);
>             handles.push(thread::spawn(move || {
>                 limiter_clone.allow_request(1.0)
>             }));
>         }
> 
>         let results: Vec<bool> = handles.into_iter().map(|h| h.join().unwrap()).collect();
>         assert_eq!(results.len(), 5);
>         assert!(results.iter().all(|&allowed| allowed));
> 
>         assert_eq!(rate_limiter.allow_request(1.0), false);
> 
>         thread::sleep(Duration::from_millis(200));
>         assert_eq!(rate_limiter.allow_request(1.0), true);
>         assert_eq!(rate_limiter.allow_request(1.0), true);
>         assert_eq!(rate_limiter.allow_request(1.0), false);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Serializes token refill calculations and deductions inside `MutexGuard` to prevent race conditions.
> 2. `Arc` enables sharing the rate limiter instance across multiple concurrent request handling threads.
> 3. Token refills are computed lazily based on elapsed time inside the lock.
> 
---

## 6. Related Terms

- [Channel (`mpsc`)](channel_mpsc.md) — Related concept: Channel (`mpsc`).

---

## 7. Key Takeaways

- `Arc<Mutex<T>>` is the canonical Rust pattern for sharing mutable state across OS threads.
- `Arc` provides thread-safe shared ownership; `Mutex` provides thread-safe interior mutability.
- Always scope `MutexGuard` locks tightly to prevent lock contention and deadlocks.
- `Arc::clone(&pointer)` increments the atomic reference count for each spawned thread.
- The `Arc` shares the box; the `Mutex` protects the contents!
