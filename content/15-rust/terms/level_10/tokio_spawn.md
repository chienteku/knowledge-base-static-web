# `tokio::spawn`

> **Level 10 — Async / Await**
> Spawns a background async task onto Tokio's multithreaded executor.

---

## 1. Prerequisites

- [`std::thread::spawn`](../level_09/std_thread_spawn.md) — The OS-level equivalent we learned in Level 9.
- [`Tokio`](../level_10/tokio.md) — The async runtime providing the task executor.
- [`async fn`](../level_10/async_fn.md) — The functions that are passed to `spawn`.

---

## 2. Term Category

**Rust Tooling (the async worker generator)**: If `async fn` is a recipe, and `main` is the kitchen, **`tokio::spawn`** is hiring a new assistant chef, handing them a recipe, and telling them to go cook it in the background while you keep working on other things!

It takes an `async` block or `Future` and spawns it as an independent **Tokio Task**.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In Level 9, we learned about `std::thread::spawn`. It spawns a new OS-level thread. But as we know, OS threads are heavy (2MB of RAM each). If a web server receives 10,000 requests per second, spawning 10,000 OS threads will instantly crash the machine.

`tokio::spawn` does **not** spawn an OS thread! Instead, it creates a lightweight "Green Task" (which takes only a few hundred bytes of memory) and places it on Tokio's internal work queue. Tokio's small pool of background OS threads will automatically pick up and execute the task!

You get all the concurrency of multithreading, with virtually zero memory overhead.

### (2) Reality Metaphor

Imagine a busy Restaurant Kitchen.

- **`std::thread::spawn`**: Every time a customer orders a burger, you construct an entirely new physical kitchen building with its own stove and hire a new chef. Extremely expensive!
- **`tokio::spawn`**: You have a single kitchen with 4 chefs. When an order comes in, you print out a order ticket (a **Task**) and clip it to the order wheel. The 4 chefs rapidly grab tickets off the wheel and work on them concurrently. Extremely fast and efficient!

### (3) Rust Code Examples

#### Short Snippet (Background Processing)
Notice how `tokio::spawn` returns a `JoinHandle`. You can `.await` the handle to get the task's return value, or ignore it to let it run detached in the background!

```rust
#[tokio::main]
async fn main() {
    // Spawns a task into the background!
    let handle = tokio::spawn(async {
        println!("Hello from a background task!");
        42 // Return value
    });

    // Do other work on the main task...
    println!("Doing main work...");

    // Wait for the background task to finish and get its result
    let result = handle.await.unwrap();
    println!("Task returned: {}", result);
}
```

#### Fuller Example (The Background Logger)
Imagine an HTTP server handling incoming web requests. We don't want to slow down the user's web page response while writing logs to a slow database. We can use `tokio::spawn` to fire-and-forget the logging!

```rust
use tokio::time::{sleep, Duration};

async fn save_log_to_database(log_msg: String) {
    // Simulate a slow database write (1 second)
    sleep(Duration::from_secs(1)).await;
    println!("Logged to DB: {}", log_msg);
}

async fn handle_web_request(user_id: u32) -> &'static str {
    let log_entry = format!("User {} clicked a button", user_id);
    
    // FIRE AND FORGET!
    // We spawn the log task in the background. We do NOT .await it here!
    tokio::spawn(save_log_to_database(log_entry));

    // The user gets an INSTANT response! They don't have to wait 1 second!
    "Success!"
}

#[tokio::main]
async fn main() {
    let response = handle_web_request(42).await;
    println!("Web Server Response: {}", response);

    // Sleep briefly so main doesn't exit before the background task finishes printing
    sleep(Duration::from_secs(2)).await;
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Tokio Spawn Scoping and Lifecycle Rules

**The mistake:** Assuming Tokio Spawn instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("tokio_spawn_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("tokio_spawn_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Tokio Spawn State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Tokio Spawn through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Tokio Spawn Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Tokio Spawn instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Bounded Concurrent Telemetry Ingestion Pool with Task Cancellation Safety

**Scenario**: You are developing a high-throughput telemetry ingestion service. Incoming raw packet payloads must be processed concurrently in background tasks. To prevent memory exhaustion under load spikes, the system must enforce a concurrency limit using `Arc<tokio::sync::Semaphore>`. Furthermore, if an ingestion batch is cancelled, pending `JoinHandle` instances must be abortable via `handle.abort()` with explicit status verification.

Construct a task spawning pool that limits active concurrent tasks and supports graceful task aborts.

**Requirements**:
1. Define a `TelemetryTask` struct with `id: u64` and `payload: String`.
2. Implement `spawn_bounded_task(semaphore: Arc<Semaphore>, task: TelemetryTask) -> JoinHandle<Result<String, &'static str>>`.
3. Acquire a permit from the semaphore inside the spawned task before processing.
4. Add unit tests asserting permit throttling, successful task execution, and task abort behavior via `handle.abort()` (verifying `join_err.is_cancelled()`).

> [!check]- Answer
> ```rust
> use std::sync::Arc;
> use std::time::Duration;
> use tokio::sync::Semaphore;
> use tokio::task::JoinHandle;
> 
> #[derive(Debug, Clone)]
> pub struct TelemetryTask {
>     pub id: u64,
>     pub payload: String,
> }
> 
> /// Spawns a background task guarded by a concurrency semaphore permit.
> pub fn spawn_bounded_task(
>     semaphore: Arc<Semaphore>,
>     task: TelemetryTask,
> ) -> JoinHandle<Result<String, &'static str>> {
>     tokio::spawn(async move {
>         // Acquire concurrency permit before starting heavy processing
>         let _permit = semaphore
>             .acquire_owned()
>             .await
>             .map_err(|_| "Semaphore closed")?;
> 
>         if task.payload.is_empty() {
>             return Err("EMPTY_PAYLOAD");
>         }
> 
>         tokio::time::sleep(Duration::from_millis(20)).await;
>         Ok(format!("PROCESSED_{}_{}", task.id, task.payload.to_uppercase()))
>     })
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[tokio::test]
>     async fn test_spawn_bounded_task_success() {
>         let sem = Arc::new(Semaphore::new(2));
>         let task = TelemetryTask {
>             id: 101,
>             payload: "sensor_data".into(),
>         };
> 
>         let handle = spawn_bounded_task(sem, task);
>         let res = handle.await.unwrap();
>         assert_eq!(res, Ok("PROCESSED_101_SENSOR_DATA".to_string()));
>     }
> 
>     #[tokio::test]
>     async fn test_spawn_task_abort_cancellation() {
>         let sem = Arc::new(Semaphore::new(2));
>         let task = TelemetryTask {
>             id: 102,
>             payload: "long_running_task".into(),
>         };
> 
>         let handle = spawn_bounded_task(sem, task);
>         // Immediately abort the task before it finishes sleeping
>         handle.abort();
> 
>         let join_res = handle.await;
>         assert!(join_res.is_err());
>         let err = join_res.unwrap_err();
>         assert!(err.is_cancelled());
>     }
> }
> ```
> 
> **Step-by-Step Explanation**:
> 1. **`tokio::spawn` Requirements**: `tokio::spawn` requires the passed async block/future to satisfy `Send + 'static`. Moving `task` and `semaphore` (`Arc<Semaphore>`) into `async move` ensures ownership is transferred cleanly.
> 2. **Permit Rate Limiting**: Calling `semaphore.acquire_owned().await` inside the spawned task ensures that at most $N$ tasks execute their critical sections concurrently. Excess tasks wait asynchronously without consuming OS threads.
> 3. **Cancellation via `abort()`**: Calling `.abort()` on a `JoinHandle` sends a cancellation signal to the Tokio executor. When `.await`ed, the handle returns a `JoinError` where `err.is_cancelled()` evaluates to `true`.
> 
> ---
> 
> ### Exercise 2: Background Worker Engine with Shared Mutex State & Oneshot Response Channels
> 
> **Scenario**: In microservice worker engines, background processing tasks are spawned asynchronously to execute CPU or I/O calculations. Callers require two-way communication: delivering task commands to the background worker and receiving completion responses back via `tokio::sync::oneshot` channels while updating shared runtime statistics.
> 
> Build a worker manager that uses `tokio::spawn` to run background jobs and report results.
> 
> **Requirements**:
> 1. Define `WorkerStats` tracking `completed_jobs: u64` and `failed_jobs: u64`.
> 2. Implement `AsyncWorkerManager` wrapping `Arc<tokio::sync::Mutex<WorkerStats>>`.
> 3. Implement `spawn_job(&self, job_id: u64, input: u64) -> oneshot::Receiver<Result<u64, &'static str>>`.
> 4. Use `oneshot::channel()` to send job results back from the `tokio::spawn` task to the caller.
> 5. Add unit tests verifying result delivery via oneshot channels and stats update in `WorkerStats`.
> 
> > [!check]- Answer
> > ```rust
> > use std::sync::Arc;
> > use tokio::sync::{mutex::Mutex, oneshot};
> > use std::time::Duration;
> > 
> > #[derive(Debug, Default)]
> > pub struct WorkerStats {
> >     pub completed_jobs: u64,
> >     pub failed_jobs: u64,
> > }
> > 
> > pub struct AsyncWorkerManager {
> >     stats: Arc<Mutex<WorkerStats>>,
> > }
> > 
> > impl AsyncWorkerManager {
> >     pub fn new() -> Self {
> >         Self {
> >             stats: Arc::new(Mutex::new(WorkerStats::default())),
> >         }
> >     }
> > 
> >     pub fn snapshot(&self) -> Arc<Mutex<WorkerStats>> {
> >         Arc::clone(&self.stats)
> >     }
> > 
> >     pub fn spawn_job(
> >         &self,
> >         job_id: u64,
> >         input: u64,
> >     ) -> oneshot::Receiver<Result<u64, &'static str>> {
> >         let (tx, rx) = oneshot::channel();
> >         let stats_ref = Arc::clone(&self.stats);
> > 
> >         tokio::spawn(async move {
> >             tokio::time::sleep(Duration::from_millis(10)).await;
> > 
> >             let result = if input == 0 {
> >                 Err("DIV_BY_ZERO")
> >             } else {
> >                 Ok(job_id * 100 / input)
> >             };
> > 
> >             {
> >                 let mut guard = stats_ref.lock().await;
> >                 if result.is_ok() {
> >                     guard.completed_jobs += 1;
> >                 } else {
> >                     guard.failed_jobs += 1;
> >                 }
> >             }
> > 
> >             let _ = tx.send(result);
> >         });
> > 
> >         rx
> >     }
> > }
> > 
> > #[cfg(test)]
> > mod tests {
> >     use super::*;
> > 
> >     #[tokio::test]
> >     async fn test_worker_job_success() {
> >         let manager = AsyncWorkerManager::new();
> >         let rx = manager.spawn_job(1, 5);
> > 
> >         let res = rx.await.unwrap();
> >         assert_eq!(res, Ok(20));
> > 
> >         let stats = manager.snapshot();
> >         let guard = stats.lock().await;
> >         assert_eq!(guard.completed_jobs, 1);
> >         assert_eq!(guard.failed_jobs, 0);
> >     }
> > 
> >     #[tokio::test]
> >     async fn test_worker_job_failure() {
> >         let manager = AsyncWorkerManager::new();
> >         let rx = manager.spawn_job(2, 0);
> > 
> >         let res = rx.await.unwrap();
> >         assert_eq!(res, Err("DIV_BY_ZERO"));
> > 
> >         let stats = manager.snapshot();
> >         let guard = stats.lock().await;
> >         assert_eq!(guard.completed_jobs, 0);
> >         assert_eq!(guard.failed_jobs, 1);
> >     }
> > }
> > ```
> > 
> > **Step-by-Step Explanation**:
> > 1. **Oneshot Channel Communication**: `oneshot::channel()` creates a single-producer, single-consumer channel ideal for returning a single value from a background `tokio::spawn` task back to the caller.
> > 2. **Shared Thread-Safe State**: Wrapping `WorkerStats` inside `Arc<tokio::sync::Mutex<WorkerStats>>` allows the background spawned task to lock the mutex asynchronously without blocking executor threads.
> > 3. **Non-blocking Execution**: `manager.spawn_job(...)` returns immediately with the `oneshot::Receiver`, allowing the caller to continue execution or `.await` the result when needed.
> 
> ---
> 
> ### Exercise 3: Real-Time Multi-Endpoint Scraper Aggregator with Deadline Timeouts
> 
> **Scenario**: An API gateway scrapes data from multiple remote endpoints concurrently. Using `tokio::spawn`, each scraping request runs in its own background task. To prevent hanging tasks from blocking the system, each spawned `JoinHandle` is wrapped inside `tokio::time::timeout`.
> 
> Construct a concurrent scraper that spawns tasks for multiple URLs and aggregates results.
> 
> **Requirements**:
> 1. Write `async fn mock_scrape_url(url: String, delay: Duration) -> Result<String, &'static str>`.
> 2. Write `async fn scrape_all(urls: Vec<(String, Duration)>, max_deadline: Duration) -> Vec<Result<String, &'static str>>`.
> 3. Spawn a task for each URL using `tokio::spawn`.
> 4. Wrap each `JoinHandle` in `tokio::time::timeout`.
> 5. Add unit tests asserting success and deadline timeout handling.
> 
> > [!check]- Answer
> > ```rust
> > use std::time::Duration;
> > use tokio::time::timeout;
> > 
> > pub async fn mock_scrape_url(url: String, delay: Duration) -> Result<String, &'static str> {
> >     tokio::time::sleep(delay).await;
> >     if url.contains("invalid") {
> >         Err("HTTP_404")
> >     } else {
> >         Ok(format!("DATA_FROM_{}", url))
> >     }
> > }
> > 
> > pub async fn scrape_all(
> >     urls: Vec<(String, Duration)>,
> >     max_deadline: Duration,
> > ) -> Vec<Result<String, &'static str>> {
> >     let mut handles = Vec::new();
> > 
> >     for (url, delay) in urls {
> >         let handle = tokio::spawn(async move {
> >             mock_scrape_url(url, delay).await
> >         });
> >         handles.push(handle);
> >     }
> > 
> >     let mut results = Vec::new();
> >     for handle in handles {
> >         match timeout(max_deadline, handle).await {
> >             Ok(Ok(scrape_res)) => results.push(scrape_res),
> >             Ok(Err(_join_err)) => results.push(Err("TASK_PANICKED")),
> >             Err(_timeout_err) => results.push(Err("SCRAPE_TIMEOUT")),
> >         }
> >     }
> > 
> >     results
> > }
> > 
> > #[cfg(test)]
> > mod tests {
> >     use super::*;
> > 
> >     #[tokio::test]
> >     async fn test_scrape_all_mixed_results() {
> >         let endpoints = vec![
> >             ("https://api.one.com".to_string(), Duration::from_millis(10)),
> >             ("https://api.invalid.com".to_string(), Duration::from_millis(10)),
> >             ("https://api.slow.com".to_string(), Duration::from_millis(200)),
> >         ];
> > 
> >         let results = scrape_all(endpoints, Duration::from_millis(50)).await;
> >         assert_eq!(results.len(), 3);
> >         assert_eq!(results[0], Ok("DATA_FROM_https://api.one.com".to_string()));
> >         assert_eq!(results[1], Err("HTTP_404"));
> >         assert_eq!(results[2], Err("SCRAPE_TIMEOUT"));
> >     }
> > }
> > ```
> > 
> > **Step-by-Step Explanation**:
> > 1. **Concurrent Spawning**: Iterating over endpoints and spawning tasks via `tokio::spawn` schedules all requests to run in parallel on Tokio's multi-threaded worker pool.
> > 2. **JoinHandle Supervision**: `tokio::time::timeout(max_deadline, handle)` enforces a deadline on waiting for the task's completion. If the task takes longer than `max_deadline`, `timeout` returns an `Err`, allowing the aggregator to proceed without hanging.
> 
> ---
> 
> ## 6. Related Terms
> 
> - [`std::thread::spawn`](../level_09/std_thread_spawn.md) — The OS-level thread equivalent.
> - [`Tokio`](../level_10/tokio.md) — The runtime that manages these tasks.
> - [`join!`](../level_10/join_macro.md) — How you run multiple futures concurrently on the *same* task.
> 
> ---
> 
> ## 7. Key Takeaways
> 
> - **`tokio::spawn`** creates a lightweight, independent background task.
> - It does **NOT** spawn an OS thread; it places a task on Tokio's internal thread-pool queue.
> - It is insanely fast and cheap — you can spawn millions of tasks without exhausting RAM.
> - It returns a **`JoinHandle`** which you can `.await` to get the return value.
> - Tasks spawned via `tokio::spawn` run independently in the background; you do not *have* to `.await` them!
> 
