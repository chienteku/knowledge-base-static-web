# `OnceCell` / `OnceLock` / `LazyLock` / `LazyCell`

> **Level 9 — Concurrency & Parallelism**
> Standard-library types for write-once and lazily-initialized values — the safe, thread-friendly replacement for `static mut`.

---

## 1. Prerequisites


- [Static (`static`)](../level_01/static_static.md) — The global-state mechanism these types safely replace for non-trivial initialization.
- [Interior Mutability](../level_03/interior_mutability.md) — The pattern that lets a shared `&OnceLock<T>` still be initialized once.
- [`Sync` Trait](sync_trait.md) — What makes `OnceLock`/`LazyLock` (unlike `OnceCell`/`LazyCell`) safe to share across threads.

---

## 2. Term Category

**Standard Library Types (the safe global-state family)**: These four types answer "how do I create a value that's computed once, the first time it's needed, and then reused forever?" — the classic *lazy static* pattern — without reaching for `unsafe`. `OnceCell`/`LazyCell` are the single-threaded versions; `OnceLock`/`LazyLock` are their thread-safe counterparts.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

A `const` must be computable at compile time, and a plain `static` must be initialized with a compile-time constant expression too — neither can run arbitrary code like "parse this config file" or "compile this regex" at startup. Before these types existed, achieving a genuinely lazy, run-once global required either `static mut` (which needs `unsafe` and has no built-in synchronization) or an external crate (`lazy_static!`, `once_cell`). The standard library eventually absorbed this pattern natively: `OnceLock<T>` lets you declare a `static` that starts empty and is filled in **exactly once**, safely, from any thread, the first time it's accessed — with the runtime guaranteeing no two threads can race to initialize it simultaneously. `LazyLock<T>` goes one step further, bundling the "what value to compute" closure directly into the type, so you don't even need to write the "is it initialized yet?" check yourself.

### (2) Reality Metaphor

Imagine an office coffee machine that needs to be calibrated exactly once, the very first time anyone uses it that day.

- **`static mut` (the old, unsafe way)**: Anyone can walk up and start fiddling with the calibration dial at any time, with no lock on the machine — if two people try to calibrate it simultaneously, the machine could end up in a corrupted, inconsistent state.
- **`OnceLock`**: The machine has a built-in mechanism that lets exactly the *first* person who approaches perform the calibration, while anyone else who tries to use it *during* that calibration automatically waits their turn. Everyone after that first calibration just gets to use the already-configured machine directly, instantly.
- **`LazyLock`**: Same guarantee, but the calibration *procedure itself* (the closure) is welded onto the machine from the factory — nobody even needs to remember to write "if not calibrated, calibrate" logic; simply touching the machine for the first time runs it automatically.

### (3) Rust Code Examples

#### Short Snippet (`OnceLock`, Manual Initialization)
```rust
use std::sync::OnceLock;

static CONFIG: OnceLock<String> = OnceLock::new();

fn get_config() -> &'static str {
    // .get_or_init() runs the closure ONLY on the very first call, from any thread.
    CONFIG.get_or_init(|| {
        println!("Loading config for the first time...");
        "production".to_string()
    })
}

fn main() {
    println!("{}", get_config()); // Prints "Loading..." then "production"
    println!("{}", get_config()); // Just "production" — no reload!
}
```

#### Fuller Example (`LazyLock`, Fully Automatic)
```rust
use std::sync::LazyLock;
use std::collections::HashMap;

// The closure runs automatically on first access — no .get_or_init() call needed anywhere.
static GREETINGS: LazyLock<HashMap<&str, &str>> = LazyLock::new(|| {
    println!("Building greetings map...");
    let mut m = HashMap::new();
    m.insert("en", "Hello");
    m.insert("es", "Hola");
    m
});

fn main() {
    // First dereference triggers initialization automatically.
    println!("{}", GREETINGS["en"]); // Prints "Building..." then "Hello"
    println!("{}", GREETINGS["es"]); // Just "Hola" — already built.
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Oncelock Lazylock Scoping and Lifecycle Rules

**The mistake:** Assuming Oncelock Lazylock instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("oncelock_lazylock_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("oncelock_lazylock_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Oncelock Lazylock State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Oncelock Lazylock through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Oncelock Lazylock Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Oncelock Lazylock instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Microservice Database Connection Pool & Global Config (`LazyLock` & `OnceLock`)

**Problem Statement:**
In high-concurrency microservices, initializing database connection pools and parsing service configurations from external sources must happen lazily and exactly once across all worker threads.
You are tasked with building a thread-safe global connection manager:
1. Define a global `LazyLock<ServerConfig>` that automatically parses configuration settings on first access.
2. Define a global `OnceLock<DbConnectionPool>` that encapsulates database connection pool creation.
3. Implement `get_or_init_pool()` using `OnceLock::get_or_init` to construct the pool, tracking initialization counts via an `AtomicUsize`.
4. Demonstrate thread safety by spawning 20 concurrent threads that simultaneously call `get_or_init_pool()` and attempt to acquire connections.
5. Write unit tests in `#[cfg(test)] mod tests` verifying that the initialization closure runs exactly once despite thread contention, connections are distributed up to capacity, and configuration settings match expectations.

> [!check]- Answer
> ```rust
> use std::sync::{LazyLock, OnceLock};
> use std::sync::atomic::{AtomicUsize, Ordering};
> use std::thread;
> 
> #[derive(Debug, Clone)]
> pub struct ServerConfig {
>     pub db_url: String,
>     pub max_connections: usize,
> }
> 
> // Global configuration loaded lazily upon first access via LazyLock
> pub static GLOBAL_CONFIG: LazyLock<ServerConfig> = LazyLock::new(|| {
>     ServerConfig {
>         db_url: String::from("postgres://admin:secret@db.internal:5432/production"),
>         max_connections: 10,
>     }
> });
> 
> #[derive(Debug)]
> pub struct DbConnectionPool {
>     pub url: String,
>     pub capacity: usize,
>     active_connections: AtomicUsize,
> }
> 
> impl DbConnectionPool {
>     pub fn new(url: String, capacity: usize) -> Self {
>         DbConnectionPool {
>             url,
>             capacity,
>             active_connections: AtomicUsize::new(0),
>         }
>     }
> 
>     pub fn acquire(&self) -> Option<usize> {
>         let current = self.active_connections.fetch_add(1, Ordering::SeqCst);
>         if current < self.capacity {
>             Some(current + 1)
>         } else {
>             self.active_connections.fetch_sub(1, Ordering::SeqCst);
>             None
>         }
>     }
> 
>     pub fn active_count(&self) -> usize {
>         self.active_connections.load(Ordering::SeqCst)
>     }
> }
> 
> // Global OnceLock instance and atomic initialization counter
> pub static DB_POOL: OnceLock<DbConnectionPool> = OnceLock::new();
> pub static POOL_INIT_COUNT: AtomicUsize = AtomicUsize::new(0);
> 
> pub fn get_or_init_pool() -> &'static DbConnectionPool {
>     DB_POOL.get_or_init(|| {
>         POOL_INIT_COUNT.fetch_add(1, Ordering::SeqCst);
>         let config = &*GLOBAL_CONFIG; // Dereferencing LazyLock triggers config setup
>         DbConnectionPool::new(config.db_url.clone(), config.max_connections)
>     })
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_lazy_and_once_lock_thread_safety() {
>         let handles: Vec<_> = (0..20)
>             .map(|_| {
>                 thread::spawn(|| {
>                     let pool = get_or_init_pool();
>                     assert_eq!(pool.url, "postgres://admin:secret@db.internal:5432/production");
>                     assert_eq!(pool.capacity, 10);
>                     pool.acquire()
>                 })
>             })
>             .collect();
> 
>         let results: Vec<Option<usize>> = handles.into_iter().map(|h| h.join().unwrap()).collect();
> 
>         // Verify the initialization closure executed EXACTLY once
>         assert_eq!(POOL_INIT_COUNT.load(Ordering::SeqCst), 1);
>         assert!(DB_POOL.get().is_some());
> 
>         // Verify connection pooling enforced capacity (10 acquired, 10 denied)
>         let successful_acquisitions = results.iter().filter(|r| r.is_some()).count();
>         assert_eq!(successful_acquisitions, 10);
>     }
> }
> ```
> 
> **Explanation & Key Takeaways:**
> 1. **Lazy Static Initialization (`LazyLock`)**: `GLOBAL_CONFIG` encapsulates configuration parsing logic. By wrapping it in `LazyLock`, Rust guarantees that no work is done at program startup; the closure evaluates automatically on the first dereference (`&*GLOBAL_CONFIG`).
> 2. **Explicit Thread-Safe Initialization (`OnceLock`)**: `DB_POOL.get_or_init()` guarantees that even when 20 worker threads concurrently call `get_or_init_pool()`, exactly one thread executes the initialization closure while the remaining threads block until the initialized `&'static DbConnectionPool` reference is available.
> 3. **Atomic State & Concurrency Safety**: The test verifies atomic initialization counts (`POOL_INIT_COUNT == 1`) and thread connection bounds without requiring `unsafe` code or manual Mutex locking during reads.

---

### Exercise 2: High-Performance Concurrent Log Masking Pipeline (`LazyLock` & Atomic Metrics)

**Problem Statement:**
In enterprise telemetry pipelines, user audit logs contain sensitive Personally Identifiable Information (PII) such as email tokens, credit card identifiers, and SSN formats. Compiling string redactors or regex rules per incoming request introduces severe latency penalties.
You are tasked with implementing a zero-overhead, multi-threaded log scrubbing system:
1. Construct a `PatternRedactor` struct containing masking rules for sensitive tokens.
2. Initialize a global `static REDACTOR: LazyLock<PatternRedactor>` so redaction patterns are compiled once globally upon first access.
3. Track overall telemetry metrics across worker threads using `AtomicUsize` counters (`TOTAL_LOGS_PROCESSED` and `TOTAL_REDACTIONS`).
4. Implement `process_log_line(line: &str) -> String` to sanitize log streams concurrently across worker threads.
5. Create a complete unit test module `#[cfg(test)] mod tests` verifying pattern replacements, atomic counter accuracy, and thread-safe parallel processing across concurrent worker threads.

> [!check]- Answer
> ```rust
> use std::sync::LazyLock;
> use std::sync::atomic::{AtomicUsize, Ordering};
> use std::thread;
> 
> pub struct PatternRedactor {
>     rules: Vec<(&'static str, &'static str)>,
> }
> 
> impl PatternRedactor {
>     pub fn new() -> Self {
>         PatternRedactor {
>             rules: vec![
>                 ("[EMAIL]", "[REDACTED_EMAIL]"),
>                 ("[SSN]", "[REDACTED_SSN]"),
>                 ("[CARD]", "[REDACTED_CARD]"),
>             ],
>         }
>     }
> 
>     pub fn redact(&self, input: &str) -> (String, usize) {
>         let mut output = input.to_string();
>         let mut replacements = 0;
> 
>         for (token, replacement) in &self.rules {
>             while let Some(pos) = output.find(token) {
>                 output.replace_range(pos..pos + token.len(), replacement);
>                 replacements += 1;
>             }
>         }
>         (output, replacements)
>     }
> }
> 
> // Global pre-compiled pattern redactor loaded lazily on first access
> pub static REDACTOR: LazyLock<PatternRedactor> = LazyLock::new(|| {
>     PatternRedactor::new()
> });
> 
> pub static TOTAL_LOGS_PROCESSED: AtomicUsize = AtomicUsize::new(0);
> pub static TOTAL_REDACTIONS: AtomicUsize = AtomicUsize::new(0);
> 
> pub fn process_log_line(line: &str) -> String {
>     TOTAL_LOGS_PROCESSED.fetch_add(1, Ordering::SeqCst);
>     let (sanitized, count) = REDACTOR.redact(line);
>     TOTAL_REDACTIONS.fetch_add(count, Ordering::SeqCst);
>     sanitized
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_concurrent_log_redaction_pipeline() {
>         let log_samples = vec![
>             "User login from 10.0.0.1 with [EMAIL] verified.",
>             "Payment attempt using [CARD] under account [SSN].",
>             "System health check OK - memory usage stable.",
>             "Security audit: Account reset requested for [EMAIL] and [SSN].",
>         ];
> 
>         let handles: Vec<_> = (0..8)
>             .map(|idx| {
>                 let line = log_samples[idx % log_samples.len()].to_string();
>                 thread::spawn(move || process_log_line(&line))
>             })
>             .collect();
> 
>         let redacted_logs: Vec<String> = handles
>             .into_iter()
>             .map(|h| h.join().unwrap())
>             .collect();
> 
>         assert_eq!(redacted_logs.len(), 8);
>         assert_eq!(TOTAL_LOGS_PROCESSED.load(Ordering::SeqCst), 8);
>         assert!(TOTAL_REDACTIONS.load(Ordering::SeqCst) > 0);
> 
>         // Verify redacted pattern replacements
>         assert!(redacted_logs[0].contains("[REDACTED_EMAIL]"));
>         assert!(!redacted_logs[0].contains("[EMAIL]"));
>         assert!(redacted_logs[1].contains("[REDACTED_CARD]"));
>         assert!(redacted_logs[1].contains("[REDACTED_SSN]"));
>     }
> }
> ```
> 
> **Explanation & Key Takeaways:**
> 1. **Lazy Pre-compilation**: Initializing `REDACTOR` via `LazyLock` defers setup until runtime while ensuring the redactor rules are compiled only once across all worker threads.
> 2. **Shared Read-Only Access (`Sync`)**: `LazyLock<PatternRedactor>` implements `Sync` because `PatternRedactor` only exposes immutable reference borrows (`&self`), allowing all 8 worker threads to query the exact same memory location without contention or lock acquisitions.
> 3. **Atomic Operations**: Thread-safe atomic counters (`AtomicUsize`) track metric totals across concurrent worker threads without requiring explicit synchronization primitives like `Mutex`.

---

### Exercise 3: Fallible Thread-Safe Authentication Service (`OnceLock<Result<T, E>>`)

**Problem Statement:**
In distributed microservice architectures, initializing remote security keys or token validators can fail due to transient network glitches or missing API tokens. Unlike `LazyLock` (which panics if initialization panics), `OnceLock` can hold fallible types such as `Result<T, E>`.
You are tasked with implementing a fallible thread-safe authentication manager:
1. Define an `AuthService` struct containing a `OnceLock<Result<String, AuthError>>` token cache and an atomic attempt counter.
2. Implement `get_or_initialize_token(&self, simulate_success: bool) -> Result<&str, AuthError>` using `OnceLock::get_or_init` to store the result of the initialization attempt.
3. Write unit tests in `#[cfg(test)] mod tests` demonstrating multi-threaded concurrent access, caching of results (whether `Ok` or `Err`), and verifying that subsequent reads receive cached outcomes without re-invoking initialization.

> [!check]- Answer
> ```rust
> use std::sync::{Arc, OnceLock};
> use std::sync::atomic::{AtomicUsize, Ordering};
> use std::thread;
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub enum AuthError {
>     NetworkTimeout,
>     InvalidCredentials,
> }
> 
> pub struct AuthService {
>     token_cache: OnceLock<Result<String, AuthError>>,
>     attempts: AtomicUsize,
> }
> 
> impl AuthService {
>     pub fn new() -> Self {
>         AuthService {
>             token_cache: OnceLock::new(),
>             attempts: AtomicUsize::new(0),
>         }
>     }
> 
>     pub fn get_or_initialize_token(&self, simulate_success: bool) -> Result<&str, AuthError> {
>         let res = self.token_cache.get_or_init(|| {
>             self.attempts.fetch_add(1, Ordering::SeqCst);
>             if simulate_success {
>                 Ok(String::from("bearer_token_v9_secure_hash"))
>             } else {
>                 Err(AuthError::NetworkTimeout)
>             }
>         });
> 
>         match res {
>             Ok(token) => Ok(token.as_str()),
>             Err(err) => Err(err.clone()),
>         }
>     }
> 
>     pub fn attempts_count(&self) -> usize {
>         self.attempts.load(Ordering::SeqCst)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_fallible_oncelock_success_caching() {
>         let service = Arc::new(AuthService::new());
>         let handles: Vec<_> = (0..10)
>             .map(|_| {
>                 let svc = Arc::clone(&service);
>                 thread::spawn(move || svc.get_or_initialize_token(true))
>             })
>             .collect();
> 
>         for handle in handles {
>             let res = handle.join().unwrap();
>             assert_eq!(res, Ok("bearer_token_v9_secure_hash"));
>         }
> 
>         // Ensure initialization closure ran exactly once across 10 concurrent threads
>         assert_eq!(service.attempts_count(), 1);
>     }
> 
>     #[test]
>     fn test_fallible_oncelock_error_caching() {
>         let service = AuthService::new();
> 
>         // First call initializes with Err
>         let res1 = service.get_or_initialize_token(false);
>         assert_eq!(res1, Err(AuthError::NetworkTimeout));
>         assert_eq!(service.attempts_count(), 1);
> 
>         // Subsequent call returns cached Err without re-executing initialization closure
>         let res2 = service.get_or_initialize_token(true);
>         assert_eq!(res2, Err(AuthError::NetworkTimeout));
>         assert_eq!(service.attempts_count(), 1);
>     }
> }
> ```
> 
> **Explanation & Key Takeaways:**
> 1. **Fallible Lazy Initialization**: Wrapping `Result<T, E>` inside `OnceLock` allows safe lazy initialization of fallible resources without panicking worker threads.
> 2. **Single-Execution Guarantee**: `OnceLock::get_or_init` guarantees that the closure runs at most once across all threads. Once computed, the inner `Result` (whether `Ok` or `Err`) is cached for the lifetime of the `OnceLock`.
> 3. **Thread-Safe Borrowing**: Returning references `Result<&str, AuthError>` directly borrows from the static/heap storage managed inside `OnceLock`, preventing unnecessary allocations on reads.

---

## 6. Related Terms


- [Static (`static`)](../level_01/static_static.md) — The mechanism these types are almost always paired with.
- [Interior Mutability](../level_03/interior_mutability.md) — The general pattern (mutating through a shared `&T`) that `OnceLock` relies on internally.
- [`Mutex<T>`](mutex_t.md) — A related but different tool: `Mutex` allows repeated mutation; `OnceLock` allows exactly one initialization, then read-only access forever after.
- [Closure](../level_06/closure.md) — What `LazyLock::new()` and `.get_or_init()` both accept as the "how to compute the value" argument.
- [`thread_local!` Macro](thread_local_macro.md) — Related concept: `thread_local!` Macro.

---

## 7. Key Takeaways

- `OnceLock<T>`/`OnceCell<T>` hold a value that's set **exactly once**, safely, with `.get_or_init()`; after that, access is just a fast read.
- `LazyLock<T>`/`LazyCell<T>` bundle the initialization closure directly into the type — no `get_or_init` call needed, initialization triggers automatically on first access.
- Use the `std::sync::` versions (`OnceLock`, `LazyLock`) for anything shareable across threads — including virtually all `static` items; use the `std::cell::` versions only for genuinely single-threaded local use.
- These types are the modern, `unsafe`-free replacement for both `static mut` and the older `lazy_static!`/`once_cell` crates.
