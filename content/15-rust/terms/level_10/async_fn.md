# `async fn`

> **Level 10 — Async / Await**
> Declares an asynchronous function that returns a `Future`.

---

## 1. Prerequisites


- [`std::thread::spawn`](../level_09/std_thread_spawn.md) — The heavy, OS-level concurrency we used in Level 9.
- [fn](../level_01/fn.md) — The standard, synchronous way to run code.
- [Trait](../level_04/trait.md) — The core interface that powers async Rust under the hood.

---

## 2. Term Category

**Rust-specific (the lazy function)**: `async`/`await` is a massive paradigm shift in programming. 

Unlike a standard `fn` which executes immediately when you call it, an **`async fn`** is *perfectly lazy*. When you call it, it does absolutely nothing! Instead, it instantly returns a `Future`—a state machine representing work that will happen *later*.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In Level 9, we used OS threads for concurrency. But OS threads are incredibly heavy. An OS thread takes roughly 2MB of memory just to exist! If you are building a massive chat server and you want to handle 100,000 simultaneous user connections, you can't just spawn 100,000 OS threads; your server will instantly crash from running out of RAM.

`async fn` provides "green threads". They are incredibly lightweight, zero-cost state machines. You can spawn millions of them on a single OS thread. The OS thread just rapidly switches between them whenever one is paused (like waiting for a database to return data).

### (2) Reality Metaphor

Imagine you are a Chef cooking a massive Thanksgiving dinner (you are the single OS thread).

- **Synchronous (`fn`)**: You put a turkey in the oven. You stand perfectly still, staring at the oven door for 4 hours until it finishes. You do absolutely nothing else.
- **Multithreading (`thread::spawn`)**: You hire 4 assistant chefs. One stares at the oven for 4 hours. One stares at the boiling water for 20 minutes. It's very fast, but paying 4 chefs is incredibly expensive (massive memory overhead).
- **Async (`async fn`)**: You put the turkey in the oven and set a timer (`Future`). While it bakes, you chop onions. You put the onions in a pan, set a timer (`Future`), and start boiling water. You (a single chef) are doing 3 things simultaneously by constantly switching tasks whenever you are forced to wait!

### (3) Rust Code Examples

#### Short Snippet (The Lazy Return)
When you call an `async fn`, it does not return the data type. It returns a `Future` that *promises* to eventually yield that data type.

```rust
// Standard function: returns a u32 immediately
fn get_id_sync() -> u32 {
    5
}

// Async function: actually returns an `impl Future<Output = u32>`
async fn get_id_async() -> u32 {
    5
}

fn main() {
    let a = get_id_sync(); // `a` is 5
    
    let b = get_id_async(); 
    // `b` is NOT 5! It is a paused state machine!
    // The code inside `get_id_async` has not run yet!
}
```

#### Fuller Example (The Executor)
Because `async fn` is lazy, it will *never run* unless something explicitly tells it to step forward. That "something" is an Async Runtime (like the wildly popular `tokio` crate). 

Notice how `main` itself becomes an `async fn` using the `tokio::main` macro!

```rust
use tokio; // You must add tokio to your Cargo.toml

// A lazy async function simulating a database fetch
async fn fetch_user_data() -> String {
    // We will learn about .await in the next term!
    println!("Fetching from database...");
    String::from("Alice")
}

// The tokio macro sets up the invisible Chef (the runtime executor)
#[tokio::main]
async fn main() {
    // Calling the function does NOTHING. It just creates the Future.
    let future = fetch_user_data();
    
    // We must use `.await` to hand the Future to Tokio to actually execute!
    let username = future.await; 
    
    println!("Found user: {}", username);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Async Fn Scoping and Lifecycle Rules

**The mistake:** Assuming Async Fn instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("async_fn_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("async_fn_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Async Fn State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Async Fn through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Async Fn Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Async Fn instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Asynchronous Telemetry Batch Processor with Timeout Pipeline

**Scenario:** You are constructing a telemetry processing microservice for a cloud analytics platform. Raw telemetry batches arrive concurrently and must undergo validation, item processing, and per-batch deadline enforcement. Because `async fn` returns an unexecuted `Future` state machine, calling processing logic creates an idle task graph until driven by an async runtime (`tokio`).

**Requirements:**
Write an async pipeline that validates and transforms incoming telemetry batches while wrapping processing operations inside deadline timeouts.

**Requirements**:
1. Define a `TelemetryBatch` struct containing `batch_id: u64` and `payload: Vec<String>`.
2. Define a `ProcessedBatch` struct containing `batch_id: u64`, `item_count: usize`, and `status: String`.
3. Define a `PipelineError` enum featuring variants `Timeout`, `EmptyBatch`, and `InvalidPayload(String)`.
4. Implement `async fn process_telemetry_batch(batch: TelemetryBatch, delay: Duration) -> Result<ProcessedBatch, PipelineError>` that fails on empty payloads or invalid items, simulates I/O delay via `tokio::time::sleep`, and returns processed metrics.
5. Implement `async fn execute_batch_with_timeout(batch: TelemetryBatch, delay: Duration, max_time: Duration) -> Result<ProcessedBatch, PipelineError>` using `tokio::time::timeout`.
6. Add unit tests asserting batch processing success, error conditions, timeout behavior, and demonstrating the lazy creation of futures.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::time::Duration;
> use tokio::time::timeout;
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct TelemetryBatch {
>     pub batch_id: u64,
>     pub payload: Vec<String>,
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct ProcessedBatch {
>     pub batch_id: u64,
>     pub item_count: usize,
>     pub status: String,
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum PipelineError {
>     Timeout,
>     EmptyBatch,
>     InvalidPayload(String),
> }
> 
> /// Transforms and enriches a single telemetry batch asynchronously.
> pub async fn process_telemetry_batch(
>     batch: TelemetryBatch,
>     delay: Duration,
> ) -> Result<ProcessedBatch, PipelineError> {
>     if batch.payload.is_empty() {
>         return Err(PipelineError::EmptyBatch);
>     }
> 
>     // Simulate asynchronous network/database I/O processing
>     tokio::time::sleep(delay).await;
> 
>     for item in &batch.payload {
>         if item.is_empty() {
>             return Err(PipelineError::InvalidPayload("Empty payload item".to_string()));
>         }
>     }
> 
>     Ok(ProcessedBatch {
>         batch_id: batch.batch_id,
>         item_count: batch.payload.len(),
>         status: format!("PROCESSED_ITEMS_{}", batch.payload.len()),
>     })
> }
> 
> /// Executes processing with a strict timeout deadline.
> pub async fn execute_batch_with_timeout(
>     batch: TelemetryBatch,
>     delay: Duration,
>     max_time: Duration,
> ) -> Result<ProcessedBatch, PipelineError> {
>     match timeout(max_time, process_telemetry_batch(batch, delay)).await {
>         Ok(result) => result,
>         Err(_) => Err(PipelineError::Timeout),
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[tokio::test]
>     async fn test_process_batch_success() {
>         let batch = TelemetryBatch {
>             batch_id: 101,
>             payload: vec!["cpu_usage:45%".into(), "mem_usage:62%".into()],
>         };
>         let res = process_telemetry_batch(batch, Duration::from_millis(10)).await;
>         assert!(res.is_ok());
>         let processed = res.unwrap();
>         assert_eq!(processed.batch_id, 101);
>         assert_eq!(processed.item_count, 2);
>         assert_eq!(processed.status, "PROCESSED_ITEMS_2");
>     }
> 
>     #[tokio::test]
>     async fn test_process_empty_batch_error() {
>         let batch = TelemetryBatch {
>             batch_id: 102,
>             payload: vec![],
>         };
>         let res = process_telemetry_batch(batch, Duration::from_millis(10)).await;
>         assert_eq!(res, Err(PipelineError::EmptyBatch));
>     }
> 
>     #[tokio::test]
>     async fn test_batch_timeout_triggered() {
>         let batch = TelemetryBatch {
>             batch_id: 103,
>             payload: vec!["metric:1".into()],
>         };
>         let res = execute_batch_with_timeout(
>             batch,
>             Duration::from_millis(100),
>             Duration::from_millis(10),
>         )
>         .await;
>         assert_eq!(res, Err(PipelineError::Timeout));
>     }
> 
>     #[tokio::test]
>     async fn test_lazy_execution_proof() {
>         let batch = TelemetryBatch {
>             batch_id: 104,
>             payload: vec!["metric:ok".into()],
>         };
>         // Calling async fn constructs the state machine without running its body
>         let fut = process_telemetry_batch(batch, Duration::from_millis(5));
>         // Execution takes place only when .await polls the future
>         let result = fut.await;
>         assert!(matches!(result, Ok(ProcessedBatch { batch_id: 104, .. })));
>     }
> }
> ```
> 
> #### Technical Explanation
>
> 1. **Async Signature Desugaring**: Declaring `async fn process_telemetry_batch(...) -> Result<ProcessedBatch, PipelineError>` desugars into `fn process_telemetry_batch(...) -> impl Future<Output = Result<ProcessedBatch, PipelineError>>`. Returning an opaque future allows lazy scheduling.
> 2. **State Machine Generation**: The compiler generates an anonymous `enum`/`struct` holding parameters `batch` and `delay`. During the call `process_telemetry_batch(...)`, no code executes; memory is allocated for the state struct on the caller's stack/frame.
> 3. **Non-Blocking Sleep**: `tokio::time::sleep(delay).await` yields execution back to the Tokio event loop without blocking the host OS thread.
> 4. **Composition with `tokio::time::timeout`**: Because an `async fn` yields a standard `Future`, higher-level primitives like `timeout(duration, future)` can wrap, poll, and drop the underlying future if the deadline expires before completion.
> 
> ---
> 
> ### Exercise 2: Multithreaded Tokio Task Spawning, State Machine Structs, and `Send` / `Sync` Boundaries
> 
> **Scenario**: High-performance multi-threaded async engines (such as Tokio work-stealing runtimes) schedule futures across background OS worker threads. Any task spawned via `tokio::spawn` requires its `Future` type to satisfy `Send + 'static`. If an `async fn` holds a non-`Send` type (such as `std::rc::Rc`) across an `.await` yield point, the entire state machine generated by the compiler becomes `!Send`, resulting in a compilation error.
> 
> Design a thread-safe metrics collector struct and demonstrate how variable scoping guarantees that non-`Send` types or exclusive borrows do not cross `.await` yield points.
> 
> **Requirements**:
> 1. Implement a `WorkerMetrics` struct tracking `total_processed: u64` and `failed_tasks: u64`.
> 2. Implement an `AsyncMetricsCollector` wrapping `Arc<tokio::sync::Mutex<WorkerMetrics>>`.
> 3. Provide `async fn record_success(&self)` that safely spawns an asynchronous background task on Tokio worker threads to update metrics.
> 4. Provide `async fn process_with_scoped_non_send(&self, data: String) -> Result<usize, &'static str>` showing how non-`Send` data (e.g. `Rc<String>`) can be processed inside an isolated inner block scope and dropped *before* calling `.await`.
> 5. Include unit tests confirming metrics mutation across multiple concurrent `tokio::spawn` tasks and verifying scope isolation.
> 
> > [!check]- Answer
> > ```rust
> > use std::sync::Arc;
> > use tokio::sync::Mutex;
> > use tokio::task::JoinHandle;
> > 
> > #[derive(Debug, Default)]
> > pub struct WorkerMetrics {
> >     pub total_processed: u64,
> >     pub failed_tasks: u64,
> > }
> > 
> > pub struct AsyncMetricsCollector {
> >     metrics: Arc<Mutex<WorkerMetrics>>,
> > }
> > 
> > impl AsyncMetricsCollector {
> >     pub fn new() -> Self {
> >         Self {
> >             metrics: Arc::new(Mutex::new(WorkerMetrics::default())),
> >         }
> >     }
> > 
> >     pub fn snapshot(&self) -> Arc<Mutex<WorkerMetrics>> {
> >         Arc::clone(&self.metrics)
> >     }
> > 
> >     /// Increments metrics safely inside a Tokio worker thread.
> >     pub async fn record_success(&self) {
> >         let metrics_ref = Arc::clone(&self.metrics);
> >         tokio::spawn(async move {
> >             tokio::time::sleep(std::time::Duration::from_millis(5)).await;
> >             let mut guard = metrics_ref.lock().await;
> >             guard.total_processed += 1;
> >         })
> >         .await
> >         .expect("Task panicked");
> >     }
> > 
> >     /// Demonstrates strict scope management ensuring non-Send data is dropped prior to `.await`.
> >     pub async fn process_with_scoped_non_send(&self, data: String) -> Result<usize, &'static str> {
> >         let len = {
> >             // std::rc::Rc is !Send and cannot cross thread boundaries or yield points
> >             let temp_buffer = std::rc::Rc::new(data);
> >             temp_buffer.len()
> >             // temp_buffer is explicitly dropped at block close
> >         };
> > 
> >         // .await point: compiler verifies no non-Send types remain live in state machine frame
> >         tokio::time::sleep(std::time::Duration::from_millis(1)).await;
> > 
> >         let mut guard = self.metrics.lock().await;
> >         guard.total_processed += 1;
> > 
> >         Ok(len)
> >     }
> > }
> > 
> > #[cfg(test)]
> > mod tests {
> >     use super::*;
> > 
> >     #[tokio::test]
> >     async fn test_metrics_record_success() {
> >         let collector = AsyncMetricsCollector::new();
> >         collector.record_success().await;
> >         collector.record_success().await;
> > 
> >         let snap = collector.snapshot();
> >         let guard = snap.lock().await;
> >         assert_eq!(guard.total_processed, 2);
> >         assert_eq!(guard.failed_tasks, 0);
> >     }
> > 
> >     #[tokio::test]
> >     async fn test_scoped_non_send_across_await() {
> >         let collector = AsyncMetricsCollector::new();
> >         let res = collector.process_with_scoped_non_send("hello_tokio".into()).await;
> >         assert_eq!(res, Ok(11));
> > 
> >         let snap = collector.snapshot();
> >         let guard = snap.lock().await;
> >         assert_eq!(guard.total_processed, 1);
> >     }
> > 
> >     #[tokio::test]
> >     async fn test_concurrent_spawns() {
> >         let collector = Arc::new(AsyncMetricsCollector::new());
> >         let mut handles: Vec<JoinHandle<()>> = Vec::new();
> > 
> >         for _ in 0..5 {
> >             let col_clone = Arc::clone(&collector);
> >             handles.push(tokio::spawn(async move {
> >                 col_clone.record_success().await;
> >             }));
> >         }
> > 
> >         for handle in handles {
> >             handle.await.unwrap();
> >         }
> > 
> >         let snap = collector.snapshot();
> >         let guard = snap.lock().await;
> >         assert_eq!(guard.total_processed, 5);
> >     }
> > }
> > ```
> > 
> > **Step-by-Step Explanation**:
> > 1. **Compiler State Allocation**: When the Rust compiler analyzes an `async fn`, it layout-analyzes all variables live across every `.await` point. Variables live across yield points become member fields in the generated future struct.
> > 2. **`Send` Trait Propagation**: If any field in the generated future struct is `!Send` (such as `Rc<T>`, `RefCell<T>`, or raw pointers), the overall `Future` auto-trait implementation becomes `!Send`. `tokio::spawn` requires `F: Send + 'static`, causing a compile error if non-`Send` types persist across yield points.
> > 3. **Block Scope Isolation**: Wrapping non-`Send` operations inside an inner scope block (`let len = { let temp = Rc::new(...); temp.len() };`) guarantees that `temp` is dropped before the execution reaches `tokio::time::sleep(...).await`.
> > 4. **Thread-Safe Synchronization**: Replacing `std::sync::Mutex` with `tokio::sync::Mutex` ensures that holding a mutex guard across yield points suspends the async task without blocking worker OS threads.
> 
> ---
> 
> ### Exercise 3: Resilient RPC Worker Loop with Retries, Exponential Backoff, and Cancellation Safety
> 
> **Scenario**: Microservice clients must issue remote procedure calls (RPC) over unreliable networks. When network transient errors occur, the client should execute exponential backoff retries. Furthermore, async functions must handle shutdown signals gracefully using `tokio::select!`. If the shutdown signal fires, the pending retry loop must be cancelled cleanly without leaking asynchronous state or orphan futures.
> 
> Construct a resilient RPC client retry loop and demonstrate cancellation safety during runtime cancellation events.
> 
> **Requirements**:
> 1. Define `RpcResponse` containing `body: String` and `attempts: usize`.
> 2. Define `RpcError` enum with `NetworkFailure`, `MaxRetriesExceeded`, and `Cancelled`.
> 3. Implement `MockRpcClient` capable of simulating transient network failures before eventually succeeding.
> 4. Write `async fn rpc_with_retry(client: &MockRpcClient, max_retries: usize, initial_backoff: Duration) -> Result<RpcResponse, RpcError>` using a stateful retry loop with exponential backoff (`backoff *= 2`).
> 5. Write `async fn rpc_with_cancellation(client: &MockRpcClient, max_retries: usize, initial_backoff: Duration, shutdown_rx: oneshot::Receiver<()>) -> Result<RpcResponse, RpcError>` using `tokio::select!`.
> 6. Provide unit tests validating successful retries, max retry overflow, and immediate cancellation handling.
> 
> > [!check]- Answer
> > ```rust
> > use std::sync::atomic::{AtomicUsize, Ordering};
> > use std::sync::Arc;
> > use std::time::Duration;
> > use tokio::sync::oneshot;
> > 
> > #[derive(Debug, PartialEq, Eq, Clone)]
> > pub struct RpcResponse {
> >     pub body: String,
> >     pub attempts: usize,
> > }
> > 
> > #[derive(Debug, PartialEq, Eq)]
> > pub enum RpcError {
> >     NetworkFailure,
> >     MaxRetriesExceeded,
> >     Cancelled,
> > }
> > 
> > pub struct MockRpcClient {
> >     fail_count: Arc<AtomicUsize>,
> > }
> > 
> > impl MockRpcClient {
> >     pub fn new(failures_before_success: usize) -> Self {
> >         Self {
> >             fail_count: Arc::new(AtomicUsize::new(failures_before_success)),
> >         }
> >     }
> > 
> >     pub async fn call(&self) -> Result<String, RpcError> {
> >         let remaining = self.fail_count.load(Ordering::SeqCst);
> >         if remaining > 0 {
> >             self.fail_count.fetch_sub(1, Ordering::SeqCst);
> >             Err(RpcError::NetworkFailure)
> >         } else {
> >             Ok("SUCCESS_PAYLOAD".into())
> >         }
> >     }
> > }
> > 
> > /// Executes an RPC call with exponential retry backoff.
> > pub async fn rpc_with_retry(
> >     client: &MockRpcClient,
> >     max_retries: usize,
> >     initial_backoff: Duration,
> > ) -> Result<RpcResponse, RpcError> {
> >     let mut attempt = 0;
> >     let mut backoff = initial_backoff;
> > 
> >     loop {
> >         attempt += 1;
> >         match client.call().await {
> >             Ok(body) => {
> >                 return Ok(RpcResponse { body, attempts: attempt });
> >             }
> >             Err(_) => {
> >                 if attempt > max_retries {
> >                     return Err(RpcError::MaxRetriesExceeded);
> >                 }
> >                 tokio::time::sleep(backoff).await;
> >                 backoff *= 2;
> >             }
> >         }
> >     }
> > }
> > 
> > /// Executes RPC retry loop while racing against a cancellation signal safely.
> > pub async fn rpc_with_cancellation(
> >     client: &MockRpcClient,
> >     max_retries: usize,
> >     initial_backoff: Duration,
> >     mut shutdown_rx: oneshot::Receiver<()>,
> > ) -> Result<RpcResponse, RpcError> {
> >     tokio::select! {
> >         res = rpc_with_retry(client, max_retries, initial_backoff) => res,
> >         _ = &mut shutdown_rx => Err(RpcError::Cancelled),
> >     }
> > }
> > 
> > #[cfg(test)]
> > mod tests {
> >     use super::*;
> > 
> >     #[tokio::test]
> >     async fn test_rpc_retry_success_after_failures() {
> >         let client = MockRpcClient::new(2);
> >         let res = rpc_with_retry(&client, 3, Duration::from_millis(5)).await;
> >         assert!(res.is_ok());
> >         let resp = res.unwrap();
> >         assert_eq!(resp.body, "SUCCESS_PAYLOAD");
> >         assert_eq!(resp.attempts, 3);
> >     }
> > 
> >     #[tokio::test]
> >     async fn test_rpc_retry_exceeded() {
> >         let client = MockRpcClient::new(5);
> >         let res = rpc_with_retry(&client, 2, Duration::from_millis(5)).await;
> >         assert_eq!(res, Err(RpcError::MaxRetriesExceeded));
> >     }
> > 
> >     #[tokio::test]
> >     async fn test_rpc_cancellation_triggered() {
> >         let client = MockRpcClient::new(10);
> >         let (tx, rx) = oneshot::channel();
> > 
> >         // Trigger cancellation signal concurrently after 5ms
> >         tokio::spawn(async move {
> >             tokio::time::sleep(Duration::from_millis(5)).await;
> >             let _ = tx.send(());
> >         });
> > 
> >         let res = rpc_with_cancellation(&client, 5, Duration::from_millis(50), rx).await;
> >         assert_eq!(res, Err(RpcError::Cancelled));
> >     }
> > }
> > ```
> > 
> > **Step-by-Step Explanation**:
> > 1. **Stateful Async Loops**: `async fn` supports standard imperative control structures like `loop`, `while`, and `match`. At each `.await` point inside the loop (such as `client.call().await` or `tokio::time::sleep(backoff).await`), the compiler saves `attempt` and `backoff` inside the generated future struct frame.
> > 2. **Exponential Backoff**: Multiplying duration `backoff *= 2` prevents network retry storms by progressively increasing interval waits between retries.
> > 3. **Cancellation Safety in `tokio::select!`**: `tokio::select!` concurrently polls multiple branch futures. When one branch completes (e.g. `shutdown_rx` receives a signal), all incomplete futures in other branches are dropped. In Rust, dropping an uncompleted `Future` immediately invokes its `Drop` implementation, cancelling pending tasks and freeing associated resources safely without leakages.
> 
> ---
> 
## 6. Related Terms

- [`async` / `.await`](../level_09/async_await.md) — Related concept: `async` / `.await`.
- [Generators / Coroutines (Unstable)](../level_19/generators_coroutines.md) — Related concept: Generators Coroutines.

---

## 7. Key Takeaways
> 
> - **`async fn`** declares an asynchronous function.
> - It does **NOT** execute when called! It is perfectly lazy.
> - Instead of returning a value, it immediately returns a paused **`Future`** state machine.
> - It is designed for massive concurrency (millions of tasks) without the heavy memory overhead of OS threads.
> - You must never run blocking, synchronous code (like `std::thread::sleep`) inside an `async fn`!
> - It requires an external Executor (like **`tokio`**) and the **`.await`** keyword to actually run.
> 
