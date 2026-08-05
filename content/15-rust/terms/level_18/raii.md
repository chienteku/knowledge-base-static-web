# RAII (Resource Acquisition Is Initialization)

> **Level 18 — Rust**
> A resource management pattern where ownership of a resource (file handle, lock, allocation) is tied to an object's lifetime — Rust's `Drop` trait implements RAII automatically.

---

## 1. Prerequisites

- [`Drop` Trait](../level_03/drop_trait.md) — Drop destructor trait.
- [Ownership](../level_03/ownership.md) — Ownership rules.

---


## 2. Term Category

**Resource Management**: Resource Acquisition Is Initialization (RAII) via `Drop` trait.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Manual resource cleanup (closing file handles, freeing socket descriptors, releasing mutex locks) in C/C++ leads to resource leaks and double-free vulnerabilities when early returns or exceptions occur.

RAII (Resource Acquisition Is Initialization) ties system resource lifecycles directly to variable lifetimes in Rust. When a resource wrapper leaves its scope, the compiler automatically invokes `Drop::drop`, guaranteeing leak-free cleanup regardless of early returns or panics.

### (2) Reality Metaphor

An automatic hotel keycard door lock: room access rights are tied to card key validity; the moment card authorization expires or the guest leaves, access is locked automatically.

### (3) Rust Code Examples

#### Short Snippet
```rust
struct LockGuard<'a>(&'a mut Mutex);
impl Drop for LockGuard<'_> { fn drop(&mut self) { println!("Mutex unlocked!"); } }
```

#### Fuller Example
```rust
use std::sync::Mutex;

fn main() {
    let lock = Mutex::new(42);
    {
        let mut guard = lock.lock().unwrap();
        *guard += 1;
    } // Guard drops here, releasing mutex lock automatically!
    assert_eq!(*lock.lock().unwrap(), 43);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Calling `.drop()` Explicitly on a Variable

**The mistake:** Attempting to call `x.drop()` manually.

**Why it is wrong:** Rust forbids direct explicit `.drop()` calls to prevent double-free errors. Use `std::mem::drop(x)` instead.

*Incorrect:*
```rust
guard.drop(); // Compiler Error!
```

*Fix:*
```rust
std::mem::drop(guard); // Correct explicit drop syntax!
```

### Mistake 2: Holding Mutex Locks Across Async `.await` Points

**The mistake:** Holding a standard RAII `std::sync::MutexGuard` across an async yield point.

**Why it is wrong:** Standard `MutexGuard` does not implement `Send`, causing compile errors when held across `.await` points.

*Incorrect:*
```rust
let _g = std_mutex.lock().unwrap(); async_func().await;
```

*Fix:*
```rust
Use tokio::sync::Mutex or limit lock scope before .await!
```

### Mistake 3: Forgetting Temporary Values Drop Immediately in Statement Tail

**The mistake:** Expecting a temporary RAII guard stored in an underscore variable `let _ = lock.lock()` to remain held.

**Why it is wrong:** The pattern `let _ = ...` drops the temporary value immediately on that single statement line!

*Incorrect:*
```rust
let _ = lock.lock().unwrap(); // Lock released immediately on this line!
```

*Fix:*
```rust
let _guard = lock.lock().unwrap(); // Held until end of block scope!
```

---

## 5. Practice Exercises

### Exercise 1: RAII Temporary File Auto-Cleaner

**Scenario:** Build an RAII struct `TempFileGuard` creating a temporary disk file on initialization and automatically deleting it upon drop.

**Requirements:**
1. Define `TempFileGuard` holding `PathBuf`.
1. Implement `Drop` to delete file from disk.
1. Write unit test verifying deletion on drop.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::fs::{File, remove_file};
> use std::path::PathBuf;
> 
> pub struct TempFileGuard {
>     pub path: PathBuf,
> }
> 
> impl TempFileGuard {
>     pub fn new(path: impl Into<PathBuf>) -> Self {
>         let path = path.into();
>         File::create(&path).expect("Failed to create temp file");
>         Self { path }
>     }
> }
> 
> impl Drop for TempFileGuard {
>     fn drop(&mut self) {
>         let _ = remove_file(&self.path);
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_raii_file_cleanup() {
>         let path = PathBuf::from("temp_test_file.tmp");
>         {
>             let _guard = TempFileGuard::new(&path);
>             assert!(path.exists());
>         } // Drop executed here!
>         assert!(!path.exists());
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `TempFileGuard` creates the disk file in `.new()`.
> 2. When `_guard` leaves block scope, `Drop::drop` automatically deletes the file, preventing orphaned temporary files.

---

### Exercise 2: RAII Active Connection Metric Counter

**Scenario:** Build an RAII active connection counter `ConnectionGuard` incrementing an atomic metric on creation and decrementing on drop.

**Requirements:**
1. Define `ConnectionGuard` holding `Arc<AtomicUsize>`.
1. Implement `Drop` to decrement counter.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::sync::Arc;
> use std::sync::atomic::{AtomicUsize, Ordering};
> 
> pub struct ConnectionGuard {
>     counter: Arc<AtomicUsize>,
> }
> 
> impl ConnectionGuard {
>     pub fn new(counter: Arc<AtomicUsize>) -> Self {
>         counter.fetch_add(1, Ordering::SeqCst);
>         Self { counter }
>     }
> }
> 
> impl Drop for ConnectionGuard {
>     fn drop(&mut self) {
>         self.counter.fetch_sub(1, Ordering::SeqCst);
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_connection_counter() {
>         let counter = Arc::new(AtomicUsize::new(0));
>         {
>             let _conn1 = ConnectionGuard::new(counter.clone());
>             let _conn2 = ConnectionGuard::new(counter.clone());
>             assert_eq!(counter.load(Ordering::SeqCst), 2);
>         }
>         assert_eq!(counter.load(Ordering::SeqCst), 0);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Guarantees live connection counts are updated atomically on creation and destruction.
> 2. Thread-safe RAII resource tracking.

---

### Exercise 3: RAII Execution Timer Scope Profiler

**Scenario:** Implement a scope performance profiler measuring execution time between scope creation and drop.

**Requirements:**
1. Define `ScopeTimer` recording `Instant`.
1. Print elapsed duration in `Drop`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::time::Instant;
> 
> pub struct ScopeTimer {
>     name: &'static str,
>     start: Instant,
> }
> 
> impl ScopeTimer {
>     pub fn new(name: &'static str) -> Self {
>         Self { name, start: Instant::now() }
>     }
> }
> 
> impl Drop for ScopeTimer {
>     fn drop(&mut self) {
>         let elapsed = self.start.elapsed();
>         println!("Scope [{}] took {:?}", self.name, elapsed);
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_scope_timer() {
>         let _t = ScopeTimer::new("unit_test");
>         std::thread::sleep(std::time::Duration::from_millis(1));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Automatically profiles function scope execution time.
> 2. Infallible drop execution.

---

## 5. Related Terms

- [Scoped Threads (`std::thread::scope`)](../level_09/scoped_threads.md)
- [`Drop` Trait](../level_03/drop_trait.md) — Drop trait destructors.
- [`Mutex<T>`](../level_09/mutex_t.md) — RAII mutex guard locking.

---


## 7. Key Takeaways

- Ties system resource lifecycles to variable scope lifetimes.
- Resource cleanup executes automatically via `Drop::drop`.
- Guarantees memory and handle safety even during early returns or panics.
- Use `std::mem::drop(val)` for explicit manual drop.
