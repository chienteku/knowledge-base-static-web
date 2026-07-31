# `RwLock<T>`

> **Level 9 — Concurrency & Parallelism**
> Reader-writer lock; allows multiple readers or one writer.

---

## 1. Prerequisites

- [Shared Borrowing (`&T`)](../level_03/borrowing.md) — The concept of unlimited read-only access.
- [Mutable Borrowing (`&mut T`)](../level_03/mutable_borrowing.md) — The concept of exclusive write access.
- [`Mutex<T>`](../level_09/mutex_t.md) — The simpler lock that `RwLock` seeks to optimize.

---

## 2. Term Category

**Rust-nonspecific (the VIP bouncer)**: A standard `Mutex` is a blunt instrument: it only lets *one* thread access the data at a time, period. 

But what if you have 100 threads that just want to *read* a configuration file, and only 1 thread that occasionally wants to *update* it? A `Mutex` forces all 100 readers into a single-file line, completely destroying your parallel performance! 

An **`RwLock` (Read-Write Lock)** solves this by enforcing Rust's core borrowing rules at runtime: it allows unlimited simultaneous readers, OR exactly one exclusive writer.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The Rust compiler uses two strict borrowing rules at compile time:
1. You can have unlimited immutable references (`&T`).
2. OR you can have exactly one mutable reference (`&mut T`).

An `RwLock` takes this exact same logic and applies it to threads at runtime!
- If Thread A asks for a **Read Lock**, it gets it instantly. 
- If Thread B asks for a **Read Lock**, it also gets it instantly. They both read simultaneously.
- But if Thread C asks for a **Write Lock**, the lock pauses Thread C. Thread C must patiently stand at the door and wait for Thread A and Thread B to leave before it can enter.
- Once Thread C is inside, any new threads asking to read are paused at the door until Thread C finishes writing.

This massively speeds up read-heavy applications (like Web Servers checking a cached user-profile) because the threads don't block each other!

### (2) Reality Metaphor

Imagine a Public Museum holding an ancient, rare manuscript.

- **Read Lock:** 50 scholars can stand around the glass case and look at the manuscript at the exact same time. Nobody is modifying it, so it's perfectly safe to let everyone look simultaneously.
- **Write Lock:** A restorer needs to open the glass case and physically paint over a tear in the manuscript. The museum must kick all 50 scholars out of the room. The restorer must be alone in the room until the paint dries. Once the restorer leaves, the 50 scholars can rush back in.

### (3) Rust Code Examples

#### Short Snippet (The Locks)
Instead of a single `.lock()` method, `RwLock` gives you two specific methods.

```rust
use std::sync::RwLock;

fn main() {
    let lock = RwLock::new(5);

    // 1. Unlimited Readers!
    let r1 = lock.read().unwrap();
    let r2 = lock.read().unwrap();
    println!("Read 1: {}, Read 2: {}", *r1, *r2);
    
    // We MUST drop the read locks before we can write!
    drop(r1);
    drop(r2);

    // 2. Exclusive Writer!
    let mut w = lock.write().unwrap();
    *w += 1;
}
```

#### Fuller Example (The Web Server Cache)
`RwLock` is almost always paired with `Arc` so multiple threads can own the lock! Here we simulate 3 threads reading a config simultaneously, while 1 thread occasionally updates it.

```rust
use std::sync::{Arc, RwLock};
use std::thread;
use std::time::Duration;

fn main() {
    // A configuration flag shared across threads
    let config = Arc::new(RwLock::new(false));
    let mut handles = vec![];

    // Spawn 3 Reader Threads
    for _ in 0..3 {
        let cfg = Arc::clone(&config);
        handles.push(thread::spawn(move || {
            for _ in 0..5 {
                // They all grab read locks simultaneously! No waiting in line!
                let is_active = cfg.read().unwrap();
                println!("Reader thread sees config: {}", *is_active);
                thread::sleep(Duration::from_millis(10));
            }
        }));
    }

    // Spawn 1 Writer Thread
    let cfg_writer = Arc::clone(&config);
    handles.push(thread::spawn(move || {
        thread::sleep(Duration::from_millis(20));
        
        // This thread asks for a write lock. It will wait for the readers to
        // momentarily drop their locks, then it will swoop in and mutate it!
        let mut active = cfg_writer.write().unwrap();
        *active = true;
        println!("*** WRITER THREAD UPDATED CONFIG! ***");
    }));

    for handle in handles {
        handle.join().unwrap();
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Rwlock T Scoping and Lifecycle Rules

**The mistake:** Assuming Rwlock T instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("rwlock_t_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("rwlock_t_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Rwlock T State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Rwlock T through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Rwlock T Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Rwlock T instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Thread-Safe In-Memory Cache with TTL Expiration

**Problem:** 
In high-throughput web applications, in-memory caches handle high read-to-write ratios. Multiple HTTP worker threads frequently read cached data, while a background janitor thread periodically removes expired entries or writes new values. Using a standard `Mutex` would block all reader threads during every read lookup, causing significant latency spikes.

Implement a thread-safe `TtlCache<K, V>` struct using `RwLock` and `HashMap`.
1. `TtlCache` should store key-value pairs along with an expiration `Instant`.
2. Implement `get(&self, key: &K) -> Option<V>`: acquires a **read lock** and returns a copy/clone of the value if present and not expired.
3. Implement `insert(&self, key: K, value: V, ttl: Duration)`: acquires a **write lock** to insert/overwrite the entry.
4. Implement `prune_expired(&self) -> usize`: acquires a **write lock** to sweep and remove all expired keys, returning the count of pruned items.
5. Provide a unit test module verifying concurrent reader threads reading valid data simultaneously while a background thread updates entries and prunes expired items without deadlocks or data corruption.

> [!check]- Answer
> ```rust
> use std::collections::HashMap;
> use std::hash::Hash;
> use std::sync::{Arc, RwLock};
> use std::thread;
> use std::time::{Duration, Instant};
> 
> #[derive(Clone)]
> struct CacheEntry<V> {
>     value: V,
>     expires_at: Instant,
> }
> 
> pub struct TtlCache<K, V> {
>     store: RwLock<HashMap<K, CacheEntry<V>>>,
> }
> 
> impl<K: Eq + Hash + Clone, V: Clone> TtlCache<K, V> {
>     pub fn new() -> Self {
>         Self {
>             store: RwLock::new(HashMap::new()),
>         }
>     }
> 
>     pub fn insert(&self, key: K, value: V, ttl: Duration) {
>         let entry = CacheEntry {
>             value,
>             expires_at: Instant::now() + ttl,
>         };
>         let mut guard = self.store.write().expect("RwLock write lock poisoned");
>         guard.insert(key, entry);
>     }
> 
>     pub fn get(&self, key: &K) -> Option<V> {
>         let guard = self.store.read().expect("RwLock read lock poisoned");
>         if let Some(entry) = guard.get(key) {
>             if Instant::now() < entry.expires_at {
>                 return Some(entry.value.clone());
>             }
>         }
>         None
>     }
> 
>     pub fn prune_expired(&self) -> usize {
>         let now = Instant::now();
>         let mut guard = self.store.write().expect("RwLock write lock poisoned");
>         let initial_len = guard.len();
>         guard.retain(|_, entry| entry.expires_at > now);
>         initial_len - guard.len()
>     }
> 
>     pub fn len(&self) -> usize {
>         let guard = self.store.read().expect("RwLock read lock poisoned");
>         guard.len()
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_cache_basic_operations() {
>         let cache = TtlCache::new();
>         cache.insert("user_1", "Alice".to_string(), Duration::from_secs(10));
>         assert_eq!(cache.get(&"user_1"), Some("Alice".to_string()));
>         assert_eq!(cache.get(&"user_2"), None);
>     }
> 
>     #[test]
>     fn test_cache_ttl_expiration_and_pruning() {
>         let cache = TtlCache::new();
>         cache.insert("short_lived", 100, Duration::from_millis(50));
>         cache.insert("long_lived", 200, Duration::from_secs(10));
> 
>         thread::sleep(Duration::from_millis(70));
>         assert_eq!(cache.get(&"short_lived"), None);
>         assert_eq!(cache.get(&"long_lived"), Some(200));
> 
>         let removed = cache.prune_expired();
>         assert_eq!(removed, 1);
>         assert_eq!(cache.len(), 1);
>     }
> 
>     #[test]
>     fn test_concurrent_read_write_access() {
>         let cache = Arc::new(TtlCache::new());
>         cache.insert("config_key", 1000, Duration::from_secs(5));
> 
>         let mut handles = vec![];
> 
>         // Spawn 5 reader threads
>         for _ in 0..5 {
>             let cache_clone = Arc::clone(&cache);
>             handles.push(thread::spawn(move || {
>                 for _ in 0..10 {
>                     let val = cache_clone.get(&"config_key");
>                     assert!(val == Some(1000) || val == Some(2000));
>                     thread::sleep(Duration::from_millis(5));
>                 }
>             }));
>         }
> 
>         // Spawn 1 writer thread
>         let cache_writer = Arc::clone(&cache);
>         handles.push(thread::spawn(move || {
>             thread::sleep(Duration::from_millis(15));
>             cache_writer.insert("config_key", 2000, Duration::from_secs(5));
>         }));
> 
>         for handle in handles {
>             handle.join().unwrap();
>         }
> 
>         assert_eq!(cache.get(&"config_key"), Some(2000));
>     }
> }
> ```
>
> **Explanation:**
> 1. **Read Lock for non-blocking lookup (`.read()`):** Multiple threads calling `get()` acquire shared read guards. They do not block each other, allowing true parallel reads.
> 2. **Write Lock for modification (`.write()`):** `insert()` and `prune_expired()` obtain exclusive access. All reader threads wait briefly while the map is modified.
> 3. **Deadlock Prevention:** `get()` releases its read lock as soon as it returns the cloned value, ensuring no read guard is held across write lock calls.

---

### Exercise 2: Hot-Reloadable Application Configuration with Versioning

**Problem:**
Microservice API gateways often store global configuration settings (such as rate limits, routing rules, and feature flags) that change infrequently. Thousands of incoming requests per second read this configuration concurrently. When an administrator reloads the config, the system must update all values atomically and increment a version number without crashing active readers or serving partially updated state.

Design a `ConfigRegistry` struct:
1. Wrap the custom configuration type `AppConfig` in `RwLock<AppConfig>` paired with an `AtomicU64` version counter.
2. Implement `fn get_config<F, R>(&self, reader_fn: F) -> (R, u64)`: acquires a read lock on the config, applies `reader_fn`, and returns both the computed result and the current version counter.
3. Implement `fn update_config(&self, new_config: AppConfig) -> u64`: acquires a write lock, replaces the configuration atomically, increments the version counter using atomic ordering, and returns the new version.
4. Implement a comprehensive unit test suite where multiple worker threads continuously read active feature flags while a management thread updates the configuration, verifying that readers always see consistent state matching the reported version.

> [!check]- Answer
> ```rust
> use std::sync::atomic::{AtomicU64, Ordering};
> use std::sync::{Arc, RwLock};
> use std::thread;
> use std::time::Duration;
> 
> #[derive(Debug, Clone, PartialEq)]
> pub struct AppConfig {
>     pub max_connections: u32,
>     pub rate_limit_per_sec: u32,
>     pub maintenance_mode: bool,
> }
> 
> pub struct ConfigRegistry {
>     config: RwLock<AppConfig>,
>     version: AtomicU64,
> }
> 
> impl ConfigRegistry {
>     pub fn new(initial_config: AppConfig) -> Self {
>         Self {
>             config: RwLock::new(initial_config),
>             version: AtomicU64::new(1),
>         }
>     }
> 
>     pub fn get_config<F, R>(&self, reader_fn: F) -> (R, u64)
>     where
>         F: FnOnce(&AppConfig) -> R,
>     {
>         let guard = self.config.read().expect("RwLock poisoned during config read");
>         let result = reader_fn(&*guard);
>         let ver = self.version.load(Ordering::Acquire);
>         (result, ver)
>     }
> 
>     pub fn update_config(&self, new_config: AppConfig) -> u64 {
>         let mut guard = self.config.write().expect("RwLock poisoned during config write");
>         *guard = new_config;
>         self.version.fetch_add(1, Ordering::AcqRel) + 1
>     }
> 
>     pub fn current_version(&self) -> u64 {
>         self.version.load(Ordering::Acquire)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_config_initialization_and_update() {
>         let initial = AppConfig {
>             max_connections: 100,
>             rate_limit_per_sec: 50,
>             maintenance_mode: false,
>         };
>         let registry = ConfigRegistry::new(initial.clone());
>         assert_eq!(registry.current_version(), 1);
> 
>         let (limit, ver) = registry.get_config(|cfg| cfg.rate_limit_per_sec);
>         assert_eq!(limit, 50);
>         assert_eq!(ver, 1);
> 
>         let updated = AppConfig {
>             max_connections: 500,
>             rate_limit_per_sec: 200,
>             maintenance_mode: false,
>         };
>         let new_ver = registry.update_config(updated);
>         assert_eq!(new_ver, 2);
> 
>         let (max_conn, ver_after) = registry.get_config(|cfg| cfg.max_connections);
>         assert_eq!(max_conn, 500);
>         assert_eq!(ver_after, 2);
>     }
> 
>     #[test]
>     fn test_atomic_hot_reload_across_threads() {
>         let initial = AppConfig {
>             max_connections: 10,
>             rate_limit_per_sec: 100,
>             maintenance_mode: false,
>         };
>         let registry = Arc::new(ConfigRegistry::new(initial));
>         let mut handles = vec![];
> 
>         // Spawn 4 worker threads checking config state
>         for _ in 0..4 {
>             let reg_clone = Arc::clone(&registry);
>             handles.push(thread::spawn(move || {
>                 for _ in 0..20 {
>                     let (m_mode, ver) = reg_clone.get_config(|cfg| cfg.maintenance_mode);
>                     if ver == 1 {
>                         assert!(!m_mode);
>                     } else if ver == 2 {
>                         assert!(m_mode);
>                     }
>                     thread::sleep(Duration::from_millis(2));
>                 }
>             }));
>         }
> 
>         // Spawn reload thread
>         let reg_reload = Arc::clone(&registry);
>         handles.push(thread::spawn(move || {
>             thread::sleep(Duration::from_millis(10));
>             let new_cfg = AppConfig {
>                 max_connections: 0,
>                 rate_limit_per_sec: 0,
>                 maintenance_mode: true,
>             };
>             reg_reload.update_config(new_cfg);
>         }));
> 
>         for handle in handles {
>             handle.join().unwrap();
>         }
> 
>         assert_eq!(registry.current_version(), 2);
>     }
> }
> ```
>
> **Explanation:**
> 1. **Atomic Configuration Updates:** By acquiring a write lock before replacing `*guard = new_config`, readers never see intermediate or partially initialized states.
> 2. **Version Synchronization:** Using `AtomicU64` with `Ordering::AcqRel` ensures version counter updates are safely visible across threads alongside the updated data structure.
> 3. **Closure-based Scoped Access (`get_config`):** Passing a reader closure `FnOnce(&AppConfig) -> R` ensures the read lock guard is automatically dropped when the closure returns, preventing callers from accidentally leaking read guards across long operations.
> 
---

### Exercise 3: Resilient Metrics Aggregator & Lock Poisoning Recovery

**Problem:**
In a production monitoring service, multiple worker threads record diagnostic counts (`HashMap<String, u64>`) while an exporter thread periodically reads metrics to report telemetry data. If a worker thread panics while holding a write lock on the shared `RwLock`, standard acquisition calls like `.read()` or `.write()` return a `PoisonError`. Rather than allowing the entire application to crash, a resilient service must recover from lock poisoning, retain unaffected metrics, and continue operating normally.

Implement a `ResilientMetrics` aggregator:
1. Wrap `HashMap<String, u64>` inside an `RwLock`.
2. Implement `fn increment(&self, metric: &str, amount: u64)`: acquires write access. If the lock is poisoned due to a panicked thread, recover the underlying guard using `unwrap_or_else(|e| e.into_inner())` or `match` on `PoisonError` and increment the counter.
3. Implement `fn snapshot(&self) -> HashMap<String, u64>`: acquires read access, safely handles lock poisoning recovery, and returns a cloned snapshot of all recorded metrics.
4. Implement `fn is_poisoned(&self) -> bool`: checks whether the internal `RwLock` is currently in a poisoned state.
5. Write unit tests that deliberately trigger a thread panic inside a write lock guard, verify that subsequent calls successfully recover via `into_inner()`, and assert that metric accumulation resumes seamlessly.

> [!check]- Answer
> ```rust
> use std::collections::HashMap;
> use std::sync::{Arc, RwLock};
> use std::thread;
> 
> pub struct ResilientMetrics {
>     counters: RwLock<HashMap<String, u64>>,
> }
> 
> impl ResilientMetrics {
>     pub fn new() -> Self {
>         Self {
>             counters: RwLock::new(HashMap::new()),
>         }
>     }
> 
>     pub fn increment(&self, metric: &str, amount: u64) {
>         let mut guard = match self.counters.write() {
>             Ok(g) => g,
>             Err(poison_err) => poison_err.into_inner(),
>         };
>         *guard.entry(metric.to_string()).or_insert(0) += amount;
>     }
> 
>     pub fn snapshot(&self) -> HashMap<String, u64> {
>         let guard = match self.counters.read() {
>             Ok(g) => g,
>             Err(poison_err) => poison_err.into_inner(),
>         };
>         guard.clone()
>     }
> 
>     pub fn is_poisoned(&self) -> bool {
>         self.counters.is_poisoned()
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_normal_metrics_aggregation() {
>         let metrics = ResilientMetrics::new();
>         metrics.increment("requests_total", 10);
>         metrics.increment("requests_total", 5);
>         metrics.increment("errors_total", 1);
> 
>         let snap = metrics.snapshot();
>         assert_eq!(snap.get("requests_total"), Some(&15));
>         assert_eq!(snap.get("errors_total"), Some(&1));
>         assert!(!metrics.is_poisoned());
>     }
> 
>     #[test]
>     fn test_poison_recovery_after_thread_panic() {
>         let metrics = Arc::new(ResilientMetrics::new());
>         metrics.increment("system_starts", 1);
> 
>         // Spawn a thread that panics while holding the write lock
>         let metrics_panic = Arc::clone(&metrics);
>         let handle = thread::spawn(move || {
>             let mut guard = metrics_panic.counters.write().unwrap();
>             *guard.entry("in_flight".to_string()).or_insert(0) += 99;
>             panic!("Simulated worker thread crash!");
>         });
> 
>         // Expect the spawned thread to report a panic error
>         let join_result = handle.join();
>         assert!(join_result.is_err());
> 
>         // Lock is now poisoned
>         assert!(metrics.is_poisoned());
> 
>         // Resilient increment recovers from poison state
>         metrics.increment("system_starts", 1);
>         metrics.increment("recovered_events", 42);
> 
>         let snap = metrics.snapshot();
>         assert_eq!(snap.get("system_starts"), Some(&2));
>         assert_eq!(snap.get("in_flight"), Some(&99));
>         assert_eq!(snap.get("recovered_events"), Some(&42));
>     }
> }
> ```
>
> **Explanation:**
> 1. **Understanding Lock Poisoning:** In Rust, if a thread panics while holding an `RwLockWriteGuard` (or `MutexGuard`), Rust marks the lock as *poisoned* to warn other threads that shared data might be in an inconsistent state.
> 2. **Poison Recovery with `into_inner()`:** Calling `poison_err.into_inner()` extracts the underlying lock guard despite the poison status. This allows application logic to inspect, clean up, or continue using the data safely without aborting the entire process.
> 3. **Robust Telemetry Systems:** Microservices and telemetry agents rely on poison recovery so isolated worker panics do not cause cascading failures across unrelated API endpoints.

---

## 6. Related Terms

- [`Mutex<T>`](../level_09/mutex_t.md) — The simpler lock that only allows one thread to access data at a time, period.
- [`Arc<T>`](../level_03/arc_t.md) — The smart pointer used to share the `RwLock` across threads (`Arc<RwLock<T>>`).
- [`RefCell<T>`](../level_03/refcell_t.md) — The single-threaded equivalent of an `RwLock`. `RefCell` enforces the exact same borrowing rules at runtime, but without OS thread locks!

---

## 7. Key Takeaways

- **`RwLock`** stands for Read-Write Lock.
- It enforces Rust's borrowing rules at runtime across threads: **Unlimited Readers OR Exactly One Writer.**
- Use **`.read().unwrap()`** for immutable, simultaneous access.
- Use **`.write().unwrap()`** for exclusive, mutable access.
- It is heavily used in read-heavy applications (like caching or configuration) where a `Mutex` would cause a massive bottleneck.
- Be extremely careful not to ask for a Write Lock while you are still holding a Read Lock, or you will Deadlock yourself!
