# `thread::spawn`

> **Level 9 — Concurrency & Parallelism**
> Creates a new OS thread with `std::thread::spawn`, accepting a closure and returning a `JoinHandle<T>` that can be awaited to retrieve the thread's return value.

---

## 1. Prerequisites

- [`std::thread::spawn`](std_thread_spawn.md) — Standard thread spawning.

---

## 2. Term Category

**Operating System Threading Primitives**: `std::thread::spawn` for launching concurrent operating system (OS) threads.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Executing CPU-intensive calculations (such as matrix multiplication, image encoding, or cryptography) sequentially on a single thread underutilizes multi-core CPUs.

`std::thread::spawn` launches an independent OS thread executing a closure concurrently. It returns a `JoinHandle<T>`, allowing the parent thread to wait for completion and retrieve the thread's return value safely via `.join()`.

### (2) Reality Metaphor

Hiring an independent freelance worker for a background project: you hand them task instructions, they work concurrently in their own office, and deliver the final result report upon completion (`.join()`).

### (3) Rust Code Examples

#### Short Snippet
```rust
use std::thread;

let handle = thread::spawn(|| 42);
assert_eq!(handle.join().unwrap(), 42);
```

#### Parallel Multi-Thread Computation
```rust
use std::thread;

pub fn compute_parallel_sum(data: Vec<i64>) -> i64 {
    let mid = data.len() / 2;
    let (left, right) = data.split_at(mid);
    let left_vec = left.to_vec();
    let right_vec = right.to_vec();

    let h1 = thread::spawn(move || left_vec.iter().sum::<i64>());
    let h2 = thread::spawn(move || right_vec.iter().sum::<i64>());

    h1.join().unwrap() + h2.join().unwrap()
}

fn main() {
    let numbers = vec![1, 2, 3, 4, 5, 6, 7, 8];
    assert_eq!(compute_parallel_sum(numbers), 36);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Borrowing Local Variables Without `move` Closures or `thread::scope`

**The mistake:** Referencing local scope variables inside spawned thread closures without ownership transfer.

**Why it is wrong:** Spawned threads have a `'static` lifetime bound because they may outlive the caller function. The borrow checker rejects non-move closures.

*Incorrect:*
```rust
let s = String::from("hello");
thread::spawn(|| println!("{s}")); // ❌ Error E0373: closure may outlive current function!
```

*Fix:*
```rust
let s = String::from("hello");
thread::spawn(move || println!("{s}")); // Correct: move ownership into closure!
```

### Mistake 2: Ignoring Thread Panics on `.join()`

**The mistake:** Unwrapping `.join()` directly without inspecting potential thread panic `Err` responses.

**Why it is wrong:** If a spawned thread panics, `.join()` returns `Err(Box<dyn Any>)`. Unwrapping it propagates the panic to the caller thread.

*Incorrect:*
```rust
let val = handle.join().unwrap();
```

*Fix:*
```rust
match handle.join() {
    Ok(val) => println!("Success: {val}"),
    Err(_) => println!("Thread panicked!"),
}
```

### Mistake 3: Spawning Thousands of Native OS Threads (Thread Exhaustion)

**The mistake:** Calling `std::thread::spawn` inside a loop for thousands of tasks.

**Why it is wrong:** Each OS thread allocates 1-8 MB of stack memory. Spawning thousands of threads crashes the process with out-of-memory errors.

*Incorrect:*
```rust
for _ in 0..10_000 {
    thread::spawn(|| { /* ... */ }); // ❌ Exhausts OS thread limits!
}
```

*Fix:*
```rust
// Use worker pools (Rayon) or async task runtimes (Tokio) for high-concurrency tasks!
```

---

## 5. Practice Exercises

### Exercise 1: Parallel Array Processing Benchmark Engine

**Scenario:** Build a parallel sum utility `parallel_matrix_sum` splitting a matrix array into two spawned threads using `std::thread::spawn`.

**Requirements:**
1. Implement `parallel_matrix_sum(data: Vec<i32>) -> i32`.
2. Split array into 2 halves and spawn 2 worker threads with `move` closures.
3. Join handles and return aggregate sum.
4. Write unit test.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::thread;
> 
> pub fn parallel_matrix_sum(data: Vec<i32>) -> i32 {
>     let len = data.len();
>     if len == 0 {
>         return 0;
>     }
>     let mid = len / 2;
>     let (left, right) = data.split_at(mid);
>     let left_vec = left.to_vec();
>     let right_vec = right.to_vec();
> 
>     let handle1 = thread::spawn(move || -> i32 { left_vec.iter().sum() });
>     let handle2 = thread::spawn(move || -> i32 { right_vec.iter().sum() });
> 
>     let sum1 = handle1.join().unwrap_or(0);
>     let sum2 = handle2.join().unwrap_or(0);
>     sum1 + sum2
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_parallel_sum() {
>         let v = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
>         assert_eq!(parallel_matrix_sum(v), 55);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Splits computation workloads across OS CPU cores for parallel execution.
> 2. Uses `move` closures to transfer vector ownership safely to spawned threads.
> 3. `.join()` collects worker thread results and handles potential panics safely.

---

### Exercise 2: Scoped Thread Local Borrowing with `std::thread::scope`

**Scenario:** Use `std::thread::scope` for zero-copy borrowing of local variables without `Arc` or heap cloning.

**Requirements:**
1. Use `std::thread::scope`.
2. Borrow local slice across 2 spawned threads.
3. Write unit test.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::thread;
> 
> pub fn scoped_sum(data: &[i32]) -> i32 {
>     let mid = data.len() / 2;
>     let (left, right) = data.split_at(mid);
> 
>     thread::scope(|s| {
>         let h1 = s.spawn(|| left.iter().sum::<i32>());
>         let h2 = s.spawn(|| right.iter().sum::<i32>());
>         h1.join().unwrap() + h2.join().unwrap()
>     })
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_scoped_thread() {
>         let numbers = [10, 20, 30, 40];
>         assert_eq!(scoped_sum(&numbers), 100);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `std::thread::scope` guarantees all spawned threads complete before the scope block exits.
> 2. Enables zero-copy slice borrowing (`&[i32]`) without requiring `Arc` or heap allocations.
> 3. Simplifies multithreaded data processing with zero-cost lifetime guarantees.

---

### Exercise 3: Thread Panic Recovery Guard

**Scenario:** Demonstrate capturing thread panics safely via `.join()` error handling without crashing caller threads.

**Requirements:**
1. Spawn thread that panics conditionally.
2. Handle `Err` gracefully.
3. Write unit test.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::thread;
> 
> pub fn safe_thread_exec(should_panic: bool) -> Result<i32, &'static str> {
>     let handle = thread::spawn(move || {
>         if should_panic {
>             panic!("Task failed!");
>         }
>         42
>     });
> 
>     handle.join().map_err(|_| "Thread panicked during execution")
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_thread_panic_recovery() {
>         assert_eq!(safe_thread_exec(false), Ok(42));
>         assert!(safe_thread_exec(true).is_err());
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `.join()` catches panics occurring inside worker threads.
> 2. Converts thread panics into `Result::Err` values for robust error recovery.
> 3. Prevents worker failures from crashing the host process.

---

## 5. Related Terms

- [`'static` Lifetime](../level_05/static_lifetime.md)
- [`std::thread::spawn`](std_thread_spawn.md) — std::thread::spawn reference.

---

## 7. Key Takeaways

- `std::thread::spawn` creates a new OS thread executing a closure.
- Returns `JoinHandle<T>` for waiting and receiving return values via `.join()`.
- Requires `move` closures when capturing variables to satisfy lifetime bounds.
- Use `std::thread::scope` for zero-copy borrowing of local variables.
