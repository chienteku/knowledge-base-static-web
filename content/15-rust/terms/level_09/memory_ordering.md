# Memory Ordering (`Ordering`)

> **Level 9 — Concurrency & Parallelism**
> `std::sync::atomic::Ordering` variants (`Relaxed`, `Acquire`, `Release`, `AcqRel`, `SeqCst`) controlling CPU and compiler instruction reordering around atomic operations.

---

## 1. Prerequisites

- [`Atomic` Types](atomic_types.md) — Atomic memory operations.

---

## 2. Term Category



**Rust Concurrency Memory Model (atomic memory barrier ordering)**: `std::sync::atomic::Ordering` (`Relaxed`, `Acquire`, `Release`, `AcqRel`, `SeqCst`) controlling hardware memory barrier instructions and compiler reordering.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Modern CPUs and optimizing compilers aggressively reorder memory read/write instructions to maximize instruction pipeline throughput. In multithreaded lock-free data structures, instruction reordering can cause thread B to read initialized data before thread A's writes become visible.

`Ordering` specifies hardware memory barrier instruction semantics for atomic operations (`AtomicBool`, `AtomicUsize`, `AtomicPtr`):
- `SeqCst`: Enforces global sequential consistency across all threads (default, most restrictive).
- `Acquire`/`Release`: Establishes paired synchronization barriers between publishing (`Release`) and consuming (`Acquire`) threads.
- `Relaxed`: Guarantees atomic operation execution without enforcing memory ordering barriers.

### (2) Reality Metaphor

A factory assembly line checkpoint supervisor:
- **`Release` barrier**: A supervisor certifies that all preceding assembly steps are finished before stamping a shipment label.
- **`Acquire` barrier**: The receiving warehouse verifies the shipment label before unpacking the cargo components.

### (3) Rust Code Examples

#### Atomic Store & Load with Sequential Consistency
```rust
use std::sync::atomic::{AtomicUsize, Ordering};

let val = AtomicUsize::new(0);
val.store(42, Ordering::SeqCst);
assert_eq!(val.load(Ordering::SeqCst), 42);
```

#### Lock-Free Data Publishing via `Acquire` / `Release` Paired Barriers
```rust
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
use std::sync::Arc;
use std::thread;

pub struct LockFreeFlag {
    data: AtomicUsize,
    ready: AtomicBool,
}

impl LockFreeFlag {
    pub fn new() -> Self {
        Self { data: AtomicUsize::new(0), ready: AtomicBool::new(false) }
    }
}

fn main() {
    let flag = Arc::new(LockFreeFlag::new());
    let f_clone = flag.clone();

    thread::spawn(move || {
        f_clone.data.store(100, Ordering::Relaxed);
        f_clone.ready.store(true, Ordering::Release); // Release barrier!
    }).join().unwrap();

    if flag.ready.load(Ordering::Acquire) { // Acquire barrier!
        assert_eq!(flag.data.load(Ordering::Relaxed), 100);
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using `Ordering::Relaxed` for Shared Memory State Synchronization

**The mistake:** Using `Ordering::Relaxed` when publishing data payload pointers between threads.

**Why it is wrong:** CPUs may reorder data payload writes *after* the flag store, allowing another thread to read uninitialized memory.

*Incorrect:*
```rust
ready.store(true, Ordering::Relaxed); // Memory reordering bug!
```

*Fix:*
```rust
ready.store(true, Ordering::Release); // Use Release ordering to flush memory writes!
```

### Mistake 2: Using `Ordering::Acquire` on Atomic Store Operations

**The mistake:** Passing `Ordering::Acquire` to `.store()`.

**Why it is wrong:** `Acquire` ordering is strictly for load operations (`.load()`); passing `Acquire` to `.store()` panics.

*Incorrect:*
```rust
atomic.store(1, Ordering::Acquire); // Panics!
```

*Fix:*
```rust
atomic.store(1, Ordering::Release); // Correct!
```

### Mistake 3: Overusing `Ordering::SeqCst` in High-Frequency Hot Loops

**The mistake:** Defaulting to `SeqCst` everywhere in high-performance lock-free data structures.

**Why it is wrong:** `SeqCst` emits expensive full-memory fence instructions (e.g. `MFENCE` on x86) on every atomic operation, slowing down throughput.

---

## 5. Practice Exercises

### Exercise 1: Lock-Free Single-Producer Single-Consumer (SPSC) Flag Guard

**Scenario:** Build a lock-free task completion guard using `AtomicBool` with `Acquire`/`Release` memory ordering.

**Requirements:**
1. Define `SpscFlag` struct with `payload: AtomicU64` and `ready: AtomicBool`.
2. Writer sets payload (`Relaxed`) then sets `ready` flag (`Release`).
3. Reader checks `ready` (`Acquire`) then reads payload (`Relaxed`).
4. Write unit tests validating data delivery.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
> use std::sync::Arc;
> 
> pub struct SpscFlag {
>     payload: AtomicU64,
>     ready: AtomicBool,
> }
> 
> impl SpscFlag {
>     pub fn new() -> Self {
>         Self {
>             payload: AtomicU64::new(0),
>             ready: AtomicBool::new(false),
>         }
>     }
> 
>     pub fn publish(&self, val: u64) {
>         self.payload.store(val, Ordering::Relaxed);
>         self.ready.store(true, Ordering::Release);
>     }
> 
>     pub fn consume(&self) -> Option<u64> {
>         if self.ready.load(Ordering::Acquire) {
>             Some(self.payload.load(Ordering::Relaxed))
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
>     fn test_spsc_acquire_release() {
>         let flag = Arc::new(SpscFlag::new());
>         let f_clone = flag.clone();
> 
>         let handle = std::thread::spawn(move || {
>             f_clone.publish(42);
>         });
>         handle.join().unwrap();
> 
>         assert_eq!(flag.consume(), Some(42));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `Ordering::Release` on `ready.store` guarantees payload writes become visible before flag is set.
> 2. `Ordering::Acquire` on `ready.load` synchronizes payload memory reads across CPU cores.
> 3. Establishes a happens-before relationship without expensive full CPU memory fences.

---

### Exercise 2: High-Performance Atomic Event Counter with `Relaxed` Ordering

**Scenario:** Implement a high-throughput atomic event metrics counter using `Ordering::Relaxed`.

**Requirements:**
1. Define `MetricsCounter`.
2. Increment using `Ordering::Relaxed`.
3. Write unit test.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::sync::atomic::{AtomicUsize, Ordering};
> 
> pub struct MetricsCounter {
>     count: AtomicUsize,
> }
> 
> impl MetricsCounter {
>     pub fn new() -> Self { Self { count: AtomicUsize::new(0) } }
>     pub fn inc(&self) { self.count.fetch_add(1, Ordering::Relaxed); }
>     pub fn get(&self) -> usize { self.count.load(Ordering::Relaxed) }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_metrics_counter() {
>         let c = MetricsCounter::new();
>         c.inc();
>         c.inc();
>         assert_eq!(c.get(), 2);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Simple event counters do not synchronize external memory, making `Ordering::Relaxed` the optimal zero-cost atomic operation.
> 2. Atomic hardware operations guarantee thread-safe incrementing without data races.

---

### Exercise 3: Lock-Free Spinlock Flag Guard

**Scenario:** Build a simple spinlock using `AtomicBool` and `Acquire`/`Release` ordering.

**Requirements:**
1. Implement `Spinlock` with `lock()` and `unlock()`.
2. Write unit test testing lock acquisition.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::sync::atomic::{AtomicBool, Ordering};
> 
> pub struct Spinlock {
>     locked: AtomicBool,
> }
> 
> impl Spinlock {
>     pub fn new() -> Self { Self { locked: AtomicBool::new(false) } }
>     pub fn lock(&self) {
>         while self.locked.swap(true, Ordering::Acquire) {
>             std::hint::spin_loop();
>         }
>     }
>     pub fn unlock(&self) {
>         self.locked.store(false, Ordering::Release);
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_spinlock() {
>         let lock = Spinlock::new();
>         lock.lock();
>         lock.unlock();
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `swap(true, Ordering::Acquire)` acquires memory synchronization for entering the critical section.
> 2. `store(false, Ordering::Release)` releases memory synchronization upon exiting the critical section.
> 3. `std::hint::spin_loop()` informs CPU pipeline of busy-waiting loops.

---

## 5. Related Terms

- [`Atomic` Types](atomic_types.md) — Lock-free atomic types.

---

## 7. Key Takeaways

- Specifies hardware memory barrier instructions for atomic operations.
- `Ordering::SeqCst` guarantees global sequential consistency (default, most restrictive).
- `Acquire`/`Release` pairs synchronize data payloads across CPU cores.
- `Relaxed` guarantees atomicity without memory reordering barriers.
