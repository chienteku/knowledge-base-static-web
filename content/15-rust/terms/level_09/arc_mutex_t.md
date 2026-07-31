# `Arc<Mutex<T>>`

> **Level 9 — Concurrency & Parallelism**
> Common pattern for shared mutable state across threads.

---

## 1. Prerequisites

- [`Arc<T>`](../level_03/arc_t.md) — The thread-safe smart pointer that allows shared ownership.
- [`Mutex<T>`](../level_09/mutex_t.md) — The lock that allows safe mutation.
- [`std::thread::spawn`](../level_09/std_thread_spawn.md) — The function that creates the threads requiring this pattern!

---

## 2. Term Category

**Rust-specific (the iconic duo)**: While `Arc` and `Mutex` are completely separate tools, they are combined so frequently in Rust that the phrase **`Arc<Mutex<T>>`** has become a singular, famous idiom. 

If you go to a Rust forum and ask: *"How do I share a variable across 10 threads and let them all safely modify it?"*, the entire community will immediately answer in unison: *"Wrap it in an `Arc<Mutex<T>>`."*

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In Rust, the golden rule of Ownership is that a variable can only have *one* owner. If you spawn 10 threads, who owns the variable? 

The standard answer is `Arc` (Atomic Reference Counted pointer). `Arc` allows 10 threads to share ownership of the data! But there's a massive catch: `Arc` only provides *immutable* shared access. What if the 10 threads need to actually *modify* the data? You can't have multiple mutable references in Rust!

The solution is brilliant composition:
1. You wrap the data in a `Mutex`, which provides safe *interior mutability* (the ability to mutate data even when you only have an immutable reference to the Mutex).
2. You wrap that `Mutex` in an `Arc`. 

The `Arc` shares the box; the `Mutex` protects the contents.

### (2) Reality Metaphor

Imagine you have a single, highly confidential Company Ledger (the data). You have 10 accountants (the threads) who all need to read and update it. 

- You can't just hand the Ledger to Accountant #1, because the other 9 couldn't access it.
- So, you put the Ledger in a heavy steel Safe with a combination lock (**`Mutex`**). Only one accountant can open it at a time.
- But how do all 10 accountants know where the Safe is? You bolt the Safe to the floor in the center of the office, and give all 10 accountants a map to its location (**`Arc`**). 

Now, multiple people share access to the location of the safe (`Arc`), but only one person can mutate the ledger inside it at a time (`Mutex`).

### (3) Rust Code Examples

#### Short Snippet (The Declaration)
You declare it by nesting the `new()` calls.

```rust
use std::sync::{Arc, Mutex};

// A shared, mutable counter initialized to 0.
let shared_state = Arc::new(Mutex::new(0));
```

#### Fuller Example (The Classic Counter)
This is the "Hello World" of Rust concurrency. We spawn 10 threads that all safely increment the exact same number.

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    // 1. Create the iconic duo
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        // 2. We MUST clone the Arc to give a "map to the safe" to the new thread.
        // This does NOT clone the data, it just increments the reference count!
        let counter_clone = Arc::clone(&counter);
        
        let handle = thread::spawn(move || {
            // 3. We use the map to find the safe, and lock it!
            let mut num = counter_clone.lock().unwrap();
            
            // 4. We mutate the data!
            *num += 1;
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    // Result is guaranteed to be 10!
    println!("Final count: {}", *counter.lock().unwrap());
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Arc Mutex T Scoping and Lifecycle Rules

**The mistake:** Assuming Arc Mutex T instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("arc_mutex_t_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("arc_mutex_t_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Arc Mutex T State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Arc Mutex T through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Arc Mutex T Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Arc Mutex T instances across OS threads via `std::thread::spawn`.

**Why it's wrong:** Types that do not implement `Send` or `Sync` marker traits cannot safely cross thread boundaries. The compiler prevents data races by raising compile errors `E0277` (`trait Send is not implemented`).

*Incorrect:*
```rust
use std::rc::Rc;
use std::thread;

let rc = Rc::new(42);
// thread::spawn(move || { println!("{}", rc); }); // ❌ Error E0277: `Rc` cannot be sent between threads safely
}
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

### Exercise 1: Multi-Threaded In-Memory Cache with TTL

**Problem:** In high-concurrency web applications, caching expensive database queries or session metadata in memory across multiple worker threads is a standard requirement. Design and implement a thread-safe `ConcurrentCache<K, V>` using `Arc<Mutex<HashMap<K, CacheEntry<V>>>>`.

The cache must allow concurrent worker threads to insert key-value pairs with a Time-To-Live (TTL), retrieve valid non-expired entries, lazily evict expired entries upon lookup, and run a maintenance sweep function `cleanup_expired` to purge stale entries. Ensure lock guards are held for the minimal required scope to optimize throughput.

> [!check]- Answer
> **Key Architectural Concepts:**
> 1. **Shared Ownership & Interior Mutability:** Wrapping `HashMap` inside `Mutex` grants thread-safe interior mutability, while `Arc` allows multiple execution threads to hold shared ownership of the cache reference.
> 2. **Lock Guard Scope Minimization:** Lock guards returned by `lock().unwrap()` must be dropped as soon as possible. Avoid executing long-running compute operations while holding the `MutexGuard` to prevent lock starvation across worker threads.
> 3. **Dual Eviction Strategy:**
>    - **Lazy Eviction:** During `get()`, if an entry's `expires_at` timestamp is in the past, remove it immediately and return `None`.
>    - **Proactive Eviction:** `cleanup_expired()` iterates through the inner `HashMap` using `retain()` to prune stale entries in a single pass.
> 4. **Auto-Trait Bounds:** Key `K` and Value `V` must implement `Send + 'static` to cross thread boundaries safely inside `Arc`.
>
> ```rust
> use std::collections::HashMap;
> use std::hash::Hash;
> use std::sync::{Arc, Mutex};
> use std::thread;
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
>         // Lazy cleanup of expired key
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
> impl<K, V> Default for ConcurrentCache<K, V>
> where
>     K: Eq + Hash + Clone + Send + 'static,
>     V: Clone + Send + 'static,
> {
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
>     fn test_concurrent_cache_operations() {
>         let cache = Arc::new(ConcurrentCache::new());
>         let mut handles = vec![];
> 
>         // Spawn 10 threads inserting items concurrently
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
>         // Sleep past TTL to test lazy eviction and proactive cleanup
>         thread::sleep(Duration::from_millis(200));
> 
>         assert_eq!(cache.get(&"session_0".to_string()), None);
>         let evicted = cache.cleanup_expired();
>         assert_eq!(evicted, 9); // session_0 was lazily removed, remaining 9 swept
>         assert_eq!(cache.len(), 0);
>         assert!(cache.is_empty());
>     }
> }
> ```
> 
> ---
> 
> ### Exercise 2: Multi-Producer Multi-Consumer Thread-Safe Job Queue
> 
> **Problem:** Task processing engines require a thread-safe task queue where producer threads submit jobs and worker threads consume them. Design `WorkDispatcher<T>` using `Arc<(Mutex<QueueInner<T>>, Condvar)>`.
> 
> The dispatcher must allow producers to enqueue tasks with `push`, worker threads to block efficiently on `pop` until a task is available without spin-locking, and administrators to invoke `shutdown()` to notify all waiting workers to wake up and exit gracefully.
> 
> > [!check]- Answer
> > **Key Architectural Concepts:**
> > 1. **`Mutex` + `Condvar` Synchronization:** Combining `Mutex` and `Condvar` inside an `Arc` allows threads to sleep efficiently without busy-waiting (polling in a tight loop).
> > 2. **Atomicity & Lock Release During Wait:** When a worker calls `condvar.wait(guard)`, Rust automatically unlocks the `MutexGuard`, suspends the current thread, and re-acquires the lock immediately upon being woken up by `notify_one()` or `notify_all()`.
> > 3. **Graceful Shutdown Signaling:** `shutdown()` sets `is_shutdown = true` under lock and invokes `cvar.notify_all()`, waking all waiting worker threads so they evaluate the shutdown flag and break out of worker loops.
> >
> > ```rust
> > use std::collections::VecDeque;
> > use std::sync::{Arc, Condvar, Mutex};
> > use std::thread;
> > use std::time::Duration;
> > 
> > struct QueueInner<T> {
> >     tasks: VecDeque<T>,
> >     is_shutdown: bool,
> > }
> > 
> > pub struct WorkDispatcher<T> {
> >     shared: Arc<(Mutex<QueueInner<T>>, Condvar)>,
> > }
> > 
> > impl<T: Send + 'static> WorkDispatcher<T> {
> >     pub fn new() -> Self {
> >         Self {
> >             shared: Arc::new((
> >                 Mutex::new(QueueInner {
> >                     tasks: VecDeque::new(),
> >                     is_shutdown: false,
> >                 }),
> >                 Condvar::new(),
> >             )),
> >         }
> >     }
> > 
> >     pub fn push(&self, task: T) -> Result<(), T> {
> >         let (lock, cvar) = &*self.shared;
> >         let mut inner = lock.lock().unwrap();
> >         if inner.is_shutdown {
> >             return Err(task);
> >         }
> >         inner.tasks.push_back(task);
> >         cvar.notify_one();
> >         Ok(())
> >     }
> > 
> >     pub fn pop(&self) -> Option<T> {
> >         let (lock, cvar) = &*self.shared;
> >         let mut inner = lock.lock().unwrap();
> >         loop {
> >             if let Some(task) = inner.tasks.pop_front() {
> >                 return Some(task);
> >             }
> >             if inner.is_shutdown {
> >                 return None;
> >             }
> >             inner = cvar.wait(inner).unwrap();
> >         }
> >     }
> > 
> >     pub fn shutdown(&self) {
> >         let (lock, cvar) = &*self.shared;
> >         let mut inner = lock.lock().unwrap();
> >         inner.is_shutdown = true;
> >         cvar.notify_all();
> >     }
> > }
> > 
> > impl<T: Send + 'static> Default for WorkDispatcher<T> {
> >     fn default() -> Self {
> >         Self::new()
> >     }
> > }
> > 
> > #[cfg(test)]
> > mod tests {
> >     use super::*;
> > 
> >     #[test]
> >     fn test_work_dispatcher_pipeline() {
> >         let dispatcher = Arc::new(WorkDispatcher::<u64>::new());
> >         let mut worker_handles = vec![];
> > 
> >         // Spawn 4 consumer/worker threads
> >         for _ in 0..4 {
> >             let dispatcher_clone = Arc::clone(&dispatcher);
> >             worker_handles.push(thread::spawn(move || {
> >                 let mut local_sum = 0u64;
> >                 while let Some(task) = dispatcher_clone.pop() {
> >                     local_sum += task;
> >                 }
> >                 local_sum
> >             }));
> >         }
> > 
> >         // Push 100 tasks across producers
> >         for i in 1..=100 {
> >             assert!(dispatcher.push(i).is_ok());
> >         }
> > 
> >         // Allow workers to process tasks before shutting down
> >         thread::sleep(Duration::from_millis(50));
> >         dispatcher.shutdown();
> > 
> >         // Ensure pushing after shutdown fails
> >         assert!(dispatcher.push(999).is_err());
> > 
> >         // Collect and verify total sum processed across worker pool
> >         let total_sum: u64 = worker_handles
> >             .into_iter()
> >             .map(|h| h.join().unwrap())
> >             .sum();
> > 
> >         let expected_sum: u64 = (1..=100).sum();
> >         assert_eq!(total_sum, expected_sum);
> >     }
> > }
> > ```
> 
> ---
> 
> ### Exercise 3: Thread-Safe Rate Limiter (Token Bucket Algorithm)
> 
> **Problem:** API gateways require thread-safe rate limiters to throttle requests across incoming worker connections. Implement `SharedRateLimiter` wrapping `Arc<Mutex<TokenBucket>>` using the Token Bucket algorithm.
> 
> `TokenBucket` maintains `capacity`, `refill_rate` (tokens/sec), `tokens`, and `last_refill: Instant`. Concurrent handler threads invoke `allow_request(tokens)` to atomically compute elapsed refill tokens, check available balance, and consume requested tokens if sufficient.
> 
> > [!check]- Answer
> > **Key Architectural Concepts:**
> > 1. **Atomic State Refill inside Guard:** Time-based refill calculation (`elapsed * refill_rate`) must occur within the `MutexGuard` lock to ensure token balance and timestamp updates are strictly atomic across concurrent threads.
> > 2. **Thread Safety via `Arc<Mutex<T>>`:** Sharing `SharedRateLimiter` across request handling threads via `Arc::clone` guarantees safe access without data races.
> > 3. **Race Condition Prevention:** By serializing bucket refills and token deductions with `Mutex`, simultaneous requests cannot overdraw the token balance beyond max capacity.
> >
> > ```rust
> > use std::sync::{Arc, Mutex};
> > use std::thread;
> > use std::time::{Duration, Instant};
> > 
> > #[derive(Debug)]
> > pub struct TokenBucket {
> >     capacity: f64,
> >     refill_rate: f64, // tokens per second
> >     tokens: f64,
> >     last_refill: Instant,
> > }
> > 
> > impl TokenBucket {
> >     pub fn new(capacity: f64, refill_rate: f64) -> Self {
> >         Self {
> >             capacity,
> >             refill_rate,
> >             tokens: capacity,
> >             last_refill: Instant::now(),
> >         }
> >     }
> > 
> >     fn refill(&mut self) {
> >         let now = Instant::now();
> >         let elapsed = now.duration_since(self.last_refill).as_secs_f64();
> >         self.tokens = (self.tokens + elapsed * self.refill_rate).min(self.capacity);
> >         self.last_refill = now;
> >     }
> > 
> >     pub fn try_consume(&mut self, tokens: f64) -> bool {
> >         self.refill();
> >         if self.tokens >= tokens {
> >             self.tokens -= tokens;
> >             true
> >         } else {
> >             false
> >         }
> >     }
> > 
> >     pub fn remaining_tokens(&mut self) -> f64 {
> >         self.refill();
> >         self.tokens
> >     }
> > }
> > 
> > pub struct SharedRateLimiter {
> >     limiter: Arc<Mutex<TokenBucket>>,
> > }
> > 
> > impl SharedRateLimiter {
> >     pub fn new(capacity: f64, refill_rate: f64) -> Self {
> >         Self {
> >             limiter: Arc::new(Mutex::new(TokenBucket::new(capacity, refill_rate))),
> >         }
> >     }
> > 
> >     pub fn allow_request(&self, tokens: f64) -> bool {
> >         let mut guard = self.limiter.lock().unwrap();
> >         guard.try_consume(tokens)
> >     }
> > 
> >     pub fn available_tokens(&self) -> f64 {
> >         let mut guard = self.limiter.lock().unwrap();
> >         guard.remaining_tokens()
> >     }
> > }
> > 
> > #[cfg(test)]
> > mod tests {
> >     use super::*;
> > 
> >     #[test]
> >     fn test_concurrent_rate_limiter() {
> >         // Capacity: 5 tokens, refill: 10 tokens/sec
> >         let rate_limiter = Arc::new(SharedRateLimiter::new(5.0, 10.0));
> >         let mut handles = vec![];
> > 
> >         // 5 concurrent threads try to consume 1 token each
> >         for _ in 0..5 {
> >             let limiter_clone = Arc::clone(&rate_limiter);
> >             handles.push(thread::spawn(move || {
> >                 limiter_clone.allow_request(1.0)
> >             }));
> >         }
> > 
> >         let results: Vec<bool> = handles.into_iter().map(|h| h.join().unwrap()).collect();
> >         assert_eq!(results.len(), 5);
> >         assert!(results.iter().all(|&allowed| allowed));
> > 
> >         // Capacity exhausted, immediate 6th attempt fails
> >         assert_eq!(rate_limiter.allow_request(1.0), false);
> > 
> >         // Sleep 200ms to allow refill of ~2 tokens (10 tokens/sec * 0.2s = 2 tokens)
> >         thread::sleep(Duration::from_millis(200));
> >         assert_eq!(rate_limiter.allow_request(1.0), true);
> >         assert_eq!(rate_limiter.allow_request(1.0), true);
> >         assert_eq!(rate_limiter.allow_request(1.0), false);
> >     }
> > }
> > ```
> 
> ---
> 
> ## 6. Related Terms
> 
> - [`Rc<T>`](../level_03/rc_t.md) / [`RefCell<T>`](../level_03/refcell_t.md) — The exact single-threaded equivalent of this pattern!
> - [`RwLock<T>`](../level_09/rwlock_t.md) — Often swapped in to create `Arc<RwLock<T>>` for read-heavy applications.
> 
> ---
> 
> ## 7. Key Takeaways
> 
> - **`Arc<Mutex<T>>`** is the standard Rust pattern for sharing mutable state across threads.
> - **`Arc`** provides the shared ownership (giving every thread a pointer to the data).
> - **`Mutex`** provides the thread-safe interior mutability (ensuring threads can safely modify the data one at a time).
> - You must explicitly `Arc::clone(&variable)` to increment the reference count for each new thread you spawn.
> - The `Arc` shares the box; the `Mutex` protects the contents!
> 
