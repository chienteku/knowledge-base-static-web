# `std::thread::spawn`

> **Level 9 — Concurrency & Parallelism**
> Creates a new OS thread.

---

## 1. Prerequisites

- [Closure (`|...|`)](../level_06/closure.md) — The anonymous function syntax used to give the new thread its instructions.
- [`move` Keyword](../level_06/move_closure.md) — The keyword required to safely transfer variables into the new thread.

---

## 2. Term Category

**Rust-nonspecific (the parallel worker)**: Almost all modern languages support multithreading. It is the ability to tell your computer's Operating System to create a second, independent timeline of execution so you can run two tasks at the exact same time. 

**`std::thread::spawn`** is the Rust standard library function that creates these parallel workers.

---

## 3. Explanation

### (1) Design Motivation — "Why does this exist in programming languages?"

Single-core CPU speeds stopped increasing dramatically over a decade ago. To keep computers getting faster, manufacturers started adding *more cores* (4, 8, 16, or 32 cores per chip). 

If you write standard synchronous code, your program only runs on ONE core, wasting 95% of your computer's power! To utilize modern hardware, you must split your work into chunks and spawn threads to process them simultaneously. 

Rust's approach to threads is world-famous. In C++, sharing data between threads often causes catastrophic bugs (Data Races) where two threads overwrite the same memory at the same time. Rust uses its Ownership system to completely prevent Data Races at compile time!

### (2) Reality Metaphor

Imagine you are a Head Chef (the main thread) cooking a massive Thanksgiving dinner. 

You are chopping vegetables. If you stop chopping to stir the soup, the vegetables don't get chopped. You can only do one thing at a time. It takes 5 hours to cook dinner. 

To speed this up, you pick up a phone and hire an Assistant Chef (`thread::spawn`). You hand them a recipe card (a Closure) and say: *"You stir the soup!"* Now, you are chopping vegetables while they are stirring the soup at the exact same time. Dinner is ready in 2 hours!

### (3) Rust Code Examples

#### Short Snippet (The Assistant Chef)
You pass a Closure to `spawn`. The new thread immediately begins executing the code inside the closure.

```rust
use std::thread;

fn main() {
    // We hire an assistant chef to print this message!
    thread::spawn(|| {
        println!("Hello from the new thread!");
    });
}
```

#### Fuller Example (Waiting for the Assistant)
If you run the code above, there is a very high chance it will print absolutely nothing! Why? Because if the Head Chef (the main thread) finishes their work and goes home, the restaurant closes and all assistant chefs are instantly fired! 

You must tell the main thread to **wait** for the assistant to finish.

```rust
use std::thread;
use std::time::Duration;

fn main() {
    // 1. Spawn the thread. It returns a "handle" (a receipt for our thread).
    let handle = thread::spawn(|| {
        for i in 1..=5 {
            println!("Assistant thread is working on item {}...", i);
            thread::sleep(Duration::from_millis(10)); // Simulate hard work
        }
    });

    // 2. The main thread continues working simultaneously!
    for i in 1..=3 {
        println!("Main thread is working on item {}...", i);
        thread::sleep(Duration::from_millis(10));
    }

    // 3. We tell the main thread to WAIT here until the assistant finishes.
    // Without this, the program might exit before the assistant counts to 5!
    handle.join().unwrap();
    
    println!("Both threads are completely done!");
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to borrow variables from the main thread

**The pitfall:** A beginner creates a string in the main thread and tries to print it from inside the spawned thread. The compiler screams: *"Closure may outlive the current function!"*

*Incorrect:*
```rust
let name = String::from("Alice");
thread::spawn(|| {
    println!("Hello {}", name); // COMPILE ERROR!
});
```

**Why it's wrong:** The Rust compiler is protecting you from a massive memory safety bug! 
What if the main thread finishes its work, hits the end of the `main()` function, and destroys (drops) the `name` variable? But the spawned thread is still running! If the spawned thread tried to print `name`, it would be reading garbage, corrupted memory (a dangling pointer).

**The fix:** You MUST use the **`move`** keyword to permanently transfer Ownership of the variable into the new thread!

*Fix:*
```rust
let name = String::from("Alice");
thread::spawn(move || { // <--- Added `move`!
    println!("Hello {}", name); // Perfectly safe!
});
```
By taking Ownership, the spawned thread is now responsible for destroying `name` when it finishes, guaranteeing memory safety.

---

### Mistake 2: Mutating Std Thread Spawn State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Std Thread Spawn through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Std Thread Spawn Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Std Thread Spawn instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Parallel Chunked Task Processing with Panic Safety

**Problem:**
Build a resilient parallel compute engine `parallel_map_reduce` that splits a dataset `Vec<T>` into worker chunks of size `chunk_size`, spawns OS threads using `std::thread::spawn` to map each chunk concurrently, and joins the threads to aggregate partial results. If any worker thread panics, the engine must safely intercept the panic payload via `JoinHandle::join()`, extract the panic error message, and return `Err(String)` without unwinding the main thread.

> [!check]- Answer
> ```rust
> use std::sync::Arc;
> use std::thread;
> 
> pub fn parallel_map_reduce<T, R, F, G>(
>     data: Vec<T>,
>     chunk_size: usize,
>     map_fn: F,
>     reduce_fn: G,
>     initial: R,
> ) -> Result<R, String>
> where
>     T: Send + 'static,
>     R: Send + 'static,
>     F: Fn(Vec<T>) -> R + Send + Sync + 'static,
>     G: Fn(R, R) -> R,
> {
>     if data.is_empty() {
>         return Ok(initial);
>     }
>     if chunk_size == 0 {
>         return Err("chunk_size must be greater than zero".to_string());
>     }
> 
>     let map_fn = Arc::new(map_fn);
>     let mut handles = Vec::new();
> 
>     let mut current_chunk = Vec::with_capacity(chunk_size);
>     for item in data {
>         current_chunk.push(item);
>         if current_chunk.len() == chunk_size {
>             let chunk = std::mem::replace(&mut current_chunk, Vec::with_capacity(chunk_size));
>             let map_ref = Arc::clone(&map_fn);
>             handles.push(thread::spawn(move || map_ref(chunk)));
>         }
>     }
>     if !current_chunk.is_empty() {
>         let map_ref = Arc::clone(&map_fn);
>         handles.push(thread::spawn(move || map_ref(current_chunk)));
>     }
> 
>     let mut acc = initial;
>     for handle in handles {
>         match handle.join() {
>             Ok(partial_res) => {
>                 acc = reduce_fn(acc, partial_res);
>             }
>             Err(panic_payload) => {
>                 let err_msg = if let Some(s) = panic_payload.downcast_ref::<&str>() {
>                     s.to_string()
>                 } else if let Some(s) = panic_payload.downcast_ref::<String>() {
>                     s.clone()
>                 } else {
>                     "Thread panicked with non-string payload".to_string()
>                 };
>                 return Err(format!("Worker thread panicked: {}", err_msg));
>             }
>         }
>     }
> 
>     Ok(acc)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_parallel_map_reduce_success() {
>         let numbers: Vec<i64> = (1..=100).collect();
>         let result = parallel_map_reduce(
>             numbers,
>             25,
>             |chunk| chunk.into_iter().map(|x| x * x).sum::<i64>(),
>             |acc, val| acc + val,
>             0,
>         );
>         assert!(result.is_ok());
>         assert_eq!(result.unwrap(), 338350);
>     }
> 
>     #[test]
>     fn test_parallel_map_reduce_panic_propagation() {
>         let numbers: Vec<i32> = vec![1, 2, 3, 0, 5, 6];
>         let result = parallel_map_reduce(
>             numbers,
>             2,
>             |chunk| {
>                 chunk.into_iter().map(|x| {
>                     if x == 0 {
>                         panic!("Division by zero encountered!");
>                     }
>                     100 / x
>                 }).sum::<i32>()
>             },
>             |acc, val| acc + val,
>             0,
>         );
>         assert!(result.is_err());
>         let err = result.unwrap_err();
>         assert!(err.contains("Division by zero encountered!"));
>     }
> 
>     #[test]
>     fn test_empty_input_and_zero_chunk() {
>         let empty: Vec<i32> = vec![];
>         let res_empty = parallel_map_reduce(empty, 5, |c| c.len(), |a, b| a + b, 0);
>         assert_eq!(res_empty.unwrap(), 0);
> 
>         let data = vec![1, 2, 3];
>         let res_zero = parallel_map_reduce(data, 0, |c| c.len(), |a, b| a + b, 0);
>         assert!(res_zero.is_err());
>     }
> }
> ```
> 
> **Explanation:**
> 1. **Data Partitioning**: The input vector is dynamically grouped into fixed-size chunks using memory replacement without requiring elements `T` to implement `Clone`.
> 2. **Thread Spawning with `Arc`**: `Arc::clone` safely shares immutable references to `map_fn` across threads while satisfying `'static` lifetime requirements.
> 3. **Panic Extraction**: When `handle.join()` returns `Err(Box<dyn Any + Send>)`, `downcast_ref` attempts to downcast the payload first to `&str` and then to `String` to construct a descriptive error message.

---

### Exercise 2: Multi-Stage Pipeline with Thread Builder & MPSC Streaming

**Problem:**
Design a multi-stage streaming pipeline using `std::thread::Builder` and `std::sync::mpsc` channels. 
- Stage 1 (`Producer` thread named `"stage-producer"` with 2 MB stack size) processes raw log strings, filters out empty lines, attaches sequence numbers, and streams them into an `mpsc::channel`.
- Stage 2 (`Aggregator` thread named `"stage-aggregator"` with 2 MB stack size) receives records from the channel, counts total valid records and error instances containing `"[ERROR]"` or `"[FATAL]"`, and returns aggregated metrics.
- The pipeline function must join both threads and return `PipelineStats`.

> [!check]- Answer
> ```rust
> use std::sync::mpsc;
> use std::thread;
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct PipelineStats {
>     pub total_processed: usize,
>     pub error_count: usize,
>     pub thread_names_verified: bool,
> }
> 
> pub fn run_log_pipeline(logs: Vec<String>) -> Result<PipelineStats, String> {
>     let (tx_producer, rx_worker) = mpsc::channel::<(usize, String)>();
> 
>     let producer_builder = thread::Builder::new()
>         .name("stage-producer".to_string())
>         .stack_size(2 * 1024 * 1024);
> 
>     let producer_handle = producer_builder
>         .spawn(move || {
>             let current_thread = thread::current();
>             let thread_name = current_thread.name().unwrap_or("").to_string();
>             
>             let mut seq = 0;
>             for log in logs {
>                 if !log.trim().is_empty() {
>                     seq += 1;
>                     if tx_producer.send((seq, log)).is_err() {
>                         break;
>                     }
>                 }
>             }
>             thread_name
>         })
>         .map_err(|e| format!("Failed to spawn producer thread: {}", e))?;
> 
>     let aggregator_builder = thread::Builder::new()
>         .name("stage-aggregator".to_string())
>         .stack_size(2 * 1024 * 1024);
> 
>     let aggregator_handle = aggregator_builder
>         .spawn(move || {
>             let current_thread = thread::current();
>             let thread_name = current_thread.name().unwrap_or("").to_string();
> 
>             let mut total_processed = 0;
>             let mut error_count = 0;
> 
>             for (_seq, log_line) in rx_worker {
>                 total_processed += 1;
>                 if log_line.contains("[ERROR]") || log_line.contains("[FATAL]") {
>                     error_count += 1;
>                 }
>             }
> 
>             let stats = PipelineStats {
>                 total_processed,
>                 error_count,
>                 thread_names_verified: false,
>             };
>             (thread_name, stats)
>         })
>         .map_err(|e| format!("Failed to spawn aggregator thread: {}", e))?;
> 
>     let prod_name = producer_handle.join().map_err(|_| "Producer thread panicked".to_string())?;
>     let (agg_name, mut stats) = aggregator_handle.join().map_err(|_| "Aggregator thread panicked".to_string())?;
> 
>     stats.thread_names_verified = prod_name == "stage-producer" && agg_name == "stage-aggregator";
>     Ok(stats)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_log_pipeline_execution() {
>         let raw_logs = vec![
>             "[INFO] Service started".to_string(),
>             "".to_string(),
>             "[ERROR] Database connection failed".to_string(),
>             "   ".to_string(),
>             "[WARN] High memory usage".to_string(),
>             "[FATAL] System out of memory".to_string(),
>         ];
> 
>         let stats = run_log_pipeline(raw_logs).expect("Pipeline failed");
> 
>         assert_eq!(stats.total_processed, 4);
>         assert_eq!(stats.error_count, 2);
>         assert!(stats.thread_names_verified);
>     }
> 
>     #[test]
>     fn test_log_pipeline_empty_logs() {
>         let raw_logs: Vec<String> = vec![];
>         let stats = run_log_pipeline(raw_logs).expect("Pipeline failed");
> 
>         assert_eq!(stats.total_processed, 0);
>         assert_eq!(stats.error_count, 0);
>         assert!(stats.thread_names_verified);
>     }
> }
> ```
> 
> **Explanation:**
> 1. **Thread Customization**: `std::thread::Builder` configures thread OS names and allocates 2 MB custom stack size per worker thread.
> 2. **Streaming Synchronization**: `tx_producer` sends tuple items `(seq, log)` across the channel. When the producer thread finishes and drops `tx_producer`, the `rx_worker` iterator terminates cleanly.
> 3. **Validation**: Thread metadata is queried inside worker closures via `thread::current().name()` and verified in unit tests.

---

### Exercise 3: Dynamic Task Batch Dispatcher with Atomic Metrics and Panic Interception

**Problem:**
Implement a resilient task dispatch manager `execute_task_batch` that accepts a vector of dynamic heap-allocated task closures (`Box<dyn FnOnce() -> String + Send + 'static>`). Spawn an OS worker thread for each task using `thread::Builder`, track completion status using atomic counters (`AtomicUsize`), capture panicked tasks using `JoinHandle::join()`, and aggregate completed outputs into an `ExecutionReport`.

> [!check]- Answer
> ```rust
> use std::sync::atomic::{AtomicUsize, Ordering};
> use std::sync::Arc;
> use std::thread;
> 
> pub struct ExecutionReport {
>     pub succeeded_count: usize,
>     pub failed_count: usize,
>     pub outputs: Vec<String>,
>     pub total_tasks: usize,
> }
> 
> pub type TaskClosure = Box<dyn FnOnce() -> String + Send + 'static>;
> 
> pub fn execute_task_batch(tasks: Vec<TaskClosure>) -> ExecutionReport {
>     let total_tasks = tasks.len();
>     let completed_counter = Arc::new(AtomicUsize::new(0));
>     let failed_counter = Arc::new(AtomicUsize::new(0));
> 
>     let mut handles = Vec::with_capacity(total_tasks);
> 
>     for (idx, task) in tasks.into_iter().enumerate() {
>         let completed_clone = Arc::clone(&completed_counter);
>         let failed_clone = Arc::clone(&failed_counter);
> 
>         let handle = thread::Builder::new()
>             .name(format!("worker-task-{}", idx))
>             .spawn(move || {
>                 let res = task();
>                 completed_clone.fetch_add(1, Ordering::SeqCst);
>                 res
>             })
>             .expect("Failed to spawn worker thread");
> 
>         handles.push((handle, failed_clone));
>     }
> 
>     let mut outputs = Vec::new();
> 
>     for (handle, failed_ref) in handles {
>         match handle.join() {
>             Ok(output) => {
>                 outputs.push(output);
>             }
>             Err(_) => {
>                 failed_ref.fetch_add(1, Ordering::SeqCst);
>             }
>         }
>     }
> 
>     let succeeded_count = completed_counter.load(Ordering::SeqCst);
>     let failed_count = failed_counter.load(Ordering::SeqCst);
> 
>     ExecutionReport {
>         succeeded_count,
>         failed_count,
>         outputs,
>         total_tasks,
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_task_batch_execution_success_and_panic() {
>         let tasks: Vec<TaskClosure> = vec![
>             Box::new(|| "Task 1 complete".to_string()),
>             Box::new(|| panic!("Task 2 forced crash")),
>             Box::new(|| "Task 3 complete".to_string()),
>         ];
> 
>         let report = execute_task_batch(tasks);
> 
>         assert_eq!(report.total_tasks, 3);
>         assert_eq!(report.succeeded_count, 2);
>         assert_eq!(report.failed_count, 1);
>         assert_eq!(report.outputs.len(), 2);
>         assert!(report.outputs.contains(&"Task 1 complete".to_string()));
>         assert!(report.outputs.contains(&"Task 3 complete".to_string()));
>     }
> 
>     #[test]
>     fn test_empty_task_batch() {
>         let tasks: Vec<TaskClosure> = vec![];
>         let report = execute_task_batch(tasks);
> 
>         assert_eq!(report.total_tasks, 0);
>         assert_eq!(report.succeeded_count, 0);
>         assert_eq!(report.failed_count, 0);
>         assert!(report.outputs.is_empty());
>     }
> }
> ```
> 
> **Explanation:**
> 1. **Dynamic Task Trait Objects**: Tasks are boxed closures satisfying `FnOnce() -> String + Send + 'static`, permitting execution of heterogeneous dynamic closures across thread boundaries.
> 2. **Atomic Synchronization**: `AtomicUsize::fetch_add` with `Ordering::SeqCst` provides thread-safe execution tracking without lock contention overhead.
> 3. **Fault Isolation**: The caller thread joins worker handles sequentially. If a worker panics, `handle.join()` captures the panic `Err`, incrementing the `failed_counter` while successful outputs are preserved.

---

## 6. Related Terms

- [`move` Keyword](../level_06/move_closure.md) — The keyword required to safely transfer external variables into the thread closure.
- [`Send` Trait](../level_09/send_trait.md) — The upcoming trait that determines if a variable is actually *allowed* to be moved into a thread!

---

## 7. Key Takeaways

- **`std::thread::spawn`** creates a new OS thread to run code in parallel.
- It takes a Closure (`|| { ... }`) containing the code you want the new thread to run.
- You must call **`.join().unwrap()`** on the returned handle if you want the main thread to stop and wait for the spawned thread to finish.
- You must use **`move ||`** to transfer ownership of any external variables into the thread, preventing dangerous dangling pointers if the main thread exits early.
