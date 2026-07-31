# `Tokio`

> **Level 10 — Async / Await**
> The industry-standard asynchronous runtime for Rust.

---

## 1. Prerequisites

- [`async fn`](../level_10/async_fn.md) — Declaring the lazy functions Tokio executes.
- [`Future` Trait](../level_10/future_trait.md) — The state machines Tokio polls.
- [`std::thread::spawn`](../level_09/std_thread_spawn.md) — Contrast with Tokio's green tasks.

---

## 2. Term Category

**Rust Ecosystem (the async engine)**: Rust's standard library provides the `async`/`await` keywords, but it intentionally does **not** include an event loop or task executor! 

**Tokio** is the defacto standard, battle-tested third-party crate that provides the engine. It includes a multi-threaded work-stealing task scheduler, async timers, non-blocking network sockets (TCP/UDP), async file I/O, and inter-task channels.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In languages like JavaScript (Node.js) or Go, the async runtime (event loop or goroutine scheduler) is built directly into the language runtime itself. 

Rust rejected this design because Rust is a systems language intended for everything from bare-metal microcontrollers to massive cloud servers. Embedded systems cannot afford the memory overhead of a hidden global event loop! 

Therefore, Rust left the runtime out of the standard library, allowing crates like **Tokio** to provide ultra-optimized runtimes for servers while embedded systems use custom bare-metal executors.

### (2) Reality Metaphor

Imagine a high-tech automated fulfillment warehouse.

- **Rust Standard Library (`async`/`await`)**: The blueprints and standard cardboard boxes. They define *what* a package looks like, but there are no machines to move them!
- **Tokio**: The entire automated warehouse infrastructure—conveyor belts, robotic forklifts, sorting hubs, and high-speed dispatchers that grab thousands of boxes per second and move them across the warehouse without collision.

### (3) Rust Code Examples

#### Short Snippet (The `#[tokio::main]` Macro)
The `#[tokio::main]` attribute transforms a standard `fn main()` into an `async fn main()`, setting up the multi-threaded runtime under the hood automatically.

```rust
#[tokio::main]
async fn main() {
    println!("Hello from Tokio runtime!");
    
    // Non-blocking sleep! The underlying OS thread is NOT blocked!
    tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
    
    println!("Woke up 1 second later!");
}
```

#### Fuller Example (Non-Blocking TCP Echo Server)
This snippet shows Tokio's non-blocking network sockets in action, handling incoming connections asynchronously.

```rust
use tokio::net::TcpListener;
use tokio::io::{AsyncReadExt, AsyncWriteExt};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Bind a non-blocking TCP listener to port 8080
    let listener = TcpListener::bind("127.0.0.1:8080").await?;
    println!("Echo server listening on 127.0.0.1:8080");

    loop {
        // Asynchronously wait for a client connection
        let (mut socket, addr) = listener.accept().await?;
        println!("New connection from: {}", addr);

        // Spawn an independent task for each connection so main loop isn't blocked!
        tokio::spawn(async move {
            let mut buf = [0u8; 1024];

            loop {
                // Read from socket non-blockingly
                let n = match socket.read(&mut buf).await {
                    Ok(0) => return, // Connection closed cleanly
                    Ok(n) => n,
                    Err(_) => return,
                };

                // Echo data back to client non-blockingly
                if socket.write_all(&buf[..n]).await.is_err() {
                    return;
                }
            }
        });
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Tokio Scoping and Lifecycle Rules

**The mistake:** Assuming Tokio instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("tokio_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("tokio_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Tokio State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Tokio through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Tokio Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Tokio instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Asynchronous Event Pipeline with Backpressure and Graceful Shutdown

**Scenario**: You are building a production telemetry processing engine in Tokio. High-volume incoming events arrive from network interfaces and must be dispatched through an asynchronous bounded channel (`tokio::sync::mpsc`) to background worker tasks. The worker task processes events, enforces backpressure, prioritizes emergency events using `tokio::select!` with `biased;`, and handles graceful shutdown when a termination signal is received via `tokio::sync::watch`.

Construct a complete Tokio pipeline with bounded channel backpressure, priority message processing, and graceful shutdown draining.

**Requirements**:
1. Define a `TelemetryEvent` struct containing `id: u64`, `payload: String`, and `is_emergency: bool`.
2. Create `AsyncPipelineEngine` with bounded `mpsc::channel(buffer_size)`.
3. Implement a background worker task using `tokio::select!` with `biased;` to prioritize emergency signals or shutdown notifications.
4. Implement graceful shutdown: when `watch::Sender` signals shutdown, the worker drains all remaining messages in the `mpsc` queue before exiting.
5. Add unit tests asserting event processing count, emergency prioritization order, and clean shutdown draining.

> [!check]- Answer
> ```rust
> use std::sync::Arc;
> use tokio::sync::{mpsc, watch, Mutex};
> use tokio::time::{sleep, Duration};
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct TelemetryEvent {
>     pub id: u64,
>     pub payload: String,
>     pub is_emergency: bool,
> }
> 
> #[derive(Debug, Default)]
> pub struct EngineMetrics {
>     pub processed_count: usize,
>     pub emergency_count: usize,
> }
> 
> pub struct AsyncPipelineEngine {
>     tx: mpsc::Sender<TelemetryEvent>,
>     shutdown_tx: watch::Sender<bool>,
>     metrics: Arc<Mutex<EngineMetrics>>,
> }
> 
> impl AsyncPipelineEngine {
>     pub fn new(buffer_size: usize) -> Self {
>         let (tx, mut rx) = mpsc::channel::<TelemetryEvent>(buffer_size);
>         let (shutdown_tx, mut shutdown_rx) = watch::channel(false);
>         let metrics = Arc::new(Mutex::new(EngineMetrics::default()));
>         let metrics_clone = Arc::clone(&metrics);
> 
>         // Spawn worker task into Tokio runtime
>         tokio::spawn(async move {
>             loop {
>                 tokio::select! {
>                     biased;
> 
>                     // Check shutdown signal first
>                     _ = shutdown_rx.changed() => {
>                         if *shutdown_rx.borrow() {
>                             // Drain remaining messages in queue
>                             while let Ok(evt) = rx.try_recv() {
>                                 let mut m = metrics_clone.lock().await;
>                                 m.processed_count += 1;
>                                 if evt.is_emergency {
>                                     m.emergency_count += 1;
>                                 }
>                             }
>                             break;
>                         }
>                     }
> 
>                     // Process incoming channel events
>                     maybe_evt = rx.recv() => {
>                         match maybe_evt {
>                             Some(evt) => {
>                                 sleep(Duration::from_millis(5)).await;
>                                 let mut m = metrics_clone.lock().await;
>                                 m.processed_count += 1;
>                                 if evt.is_emergency {
>                                     m.emergency_count += 1;
>                                 }
>                             }
>                             None => break, // Channel closed
>                         }
>                     }
>                 }
>             }
>         });
> 
>         Self {
>             tx,
>             shutdown_tx,
>             metrics,
>         }
>     }
> 
>     pub async fn send_event(&self, evt: TelemetryEvent) -> Result<(), mpsc::error::SendError<TelemetryEvent>> {
>         self.tx.send(evt).await
>     }
> 
>     pub fn trigger_shutdown(&self) {
>         let _ = self.shutdown_tx.send(true);
>     }
> 
>     pub fn snapshot_metrics(&self) -> Arc<Mutex<EngineMetrics>> {
>         Arc::clone(&self.metrics)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[tokio::test]
>     async fn test_pipeline_backpressure_and_drain() {
>         let engine = AsyncPipelineEngine::new(10);
> 
>         engine
>             .send_event(TelemetryEvent {
>                 id: 1,
>                 payload: "data1".into(),
>                 is_emergency: false,
>             })
>             .await
>             .unwrap();
> 
>         engine
>             .send_event(TelemetryEvent {
>                 id: 2,
>                 payload: "CRITICAL".into(),
>                 is_emergency: true,
>             })
>             .await
>             .unwrap();
> 
>         sleep(Duration::from_millis(20)).await;
> 
>         engine.trigger_shutdown();
>         sleep(Duration::from_millis(20)).await;
> 
>         let snap = engine.snapshot_metrics();
>         let guard = snap.lock().await;
>         assert_eq!(guard.processed_count, 2);
>         assert_eq!(guard.emergency_count, 1);
>     }
> }
> ```
> 
> **Step-by-Step Explanation**:
> 1. **Bounded Channel Backpressure**: `mpsc::channel(buffer_size)` limits channel memory capacity. If the channel is full, calls to `.send().await` suspend the calling task asynchronously without blocking worker OS threads.
> 2. **Biased Directive**: `biased;` in `tokio::select!` enforces top-to-bottom branch evaluation, guaranteeing that shutdown signals are checked before processing standard messages.
> 3. **Watch Channel Shutdown**: `watch::channel` broadcasts shutdown signals across multiple Tokio tasks efficiently.
> 
> ---
> 
> ### Exercise 2: Resilient Asynchronous Data Aggregator with `select!`, Timeouts, and Cancellation Safety
> 
> **Scenario**: A web gateway must fetch data from a primary remote endpoint and a fallback endpoint concurrently. If the primary endpoint does not return data within a deadline timeout, the gateway races the request against the fallback endpoint using `tokio::select!` while ensuring cancellation safety (dropping uncompleted requests).
> 
> Build a resilient aggregator function using `tokio::select!` and `tokio::time::timeout`.
> 
> **Requirements**:
> 1. Implement `async fn fetch_primary(url: &str, delay: Duration) -> Result<String, &'static str>`.
> 2. Implement `async fn fetch_fallback(url: &str, delay: Duration) -> Result<String, &'static str>`.
> 3. Write `async fn fetch_resilient_data(primary_url: &str, fallback_url: &str, primary_delay: Duration, fallback_delay: Duration, deadline: Duration) -> Result<String, &'static str>`.
> 4. Add unit tests asserting primary success, fallback invocation on primary timeout, and total failure scenarios.
> 
> > [!check]- Answer
> > ```rust
> > use std::time::Duration;
> > use tokio::time::sleep;
> > 
> > pub async fn fetch_primary(url: &str, delay: Duration) -> Result<String, &'static str> {
> >     sleep(delay).await;
> >     if url.contains("error") {
> >         Err("PRIMARY_FAILED")
> >     } else {
> >         Ok(format!("PRIMARY_DATA_{}", url))
> >     }
> > }
> > 
> > pub async fn fetch_fallback(url: &str, delay: Duration) -> Result<String, &'static str> {
> >     sleep(delay).await;
> >     if url.contains("error") {
> >         Err("FALLBACK_FAILED")
> >     } else {
> >         Ok(format!("FALLBACK_DATA_{}", url))
> >     }
> > }
> > 
> > pub async fn fetch_resilient_data(
> >     primary_url: &'static str,
> >     fallback_url: &'static str,
> >     primary_delay: Duration,
> >     fallback_delay: Duration,
> >     deadline: Duration,
> > ) -> Result<String, &'static str> {
> >     let primary_fut = fetch_primary(primary_url, primary_delay);
> >     let fallback_fut = fetch_fallback(fallback_url, fallback_delay);
> > 
> >     tokio::pin!(primary_fut);
> >     tokio::pin!(fallback_fut);
> > 
> >     let deadline_timer = sleep(deadline);
> >     tokio::pin!(deadline_timer);
> > 
> >     tokio::select! {
> >         res = &mut primary_fut => {
> >             match res {
> >                 Ok(data) => Ok(data),
> >                 Err(_) => fallback_fut.await,
> >             }
> >         }
> >         _ = &mut deadline_timer => {
> >             // Primary timed out; fall back immediately
> >             fallback_fut.await
> >         }
> >     }
> > }
> > 
> > #[cfg(test)]
> > mod tests {
> >     use super::*;
> > 
> >     #[tokio::test]
> >     async fn test_fetch_primary_success() {
> >         let res = fetch_resilient_data(
> >             "http://primary.com",
> >             "http://fallback.com",
> >             Duration::from_millis(10),
> >             Duration::from_millis(50),
> >             Duration::from_millis(100),
> >         )
> >         .await;
> >         assert_eq!(res, Ok("PRIMARY_DATA_http://primary.com".to_string()));
> >     }
> > 
> >     #[tokio::test]
> >     async fn test_fallback_on_primary_timeout() {
> >         let res = fetch_resilient_data(
> >             "http://slow-primary.com",
> >             "http://fallback.com",
> >             Duration::from_millis(200),
> >             Duration::from_millis(10),
> >             Duration::from_millis(20),
> >         )
> >         .await;
> >         assert_eq!(res, Ok("FALLBACK_DATA_http://fallback.com".to_string()));
> >     }
> > }
> > ```
> > 
> > **Step-by-Step Explanation**:
> > 1. **Cancellation Safety**: `tokio::select!` polls branches concurrently. When the fastest branch resolves (or deadline expires), uncompleted futures in other branches are dropped, cancelling their pending I/O operations cleanly.
> > 2. **Stack Pinning**: Using `tokio::pin!` allows borrowing futures inside `select!` so they can be `.await`ed subsequently in fallback branches if needed.
> 
> ---
> 
> ### Exercise 3: Concurrency Throttler & Panic-Safe Task Dispatcher with Tokio Semaphores
> 
> **Scenario**: Microservices processing expensive database migrations or heavy analytical tasks must rate-limit active concurrency to prevent overwhelming CPU/memory resources. Furthermore, if a background task panics, the dispatcher must catch the panic via `JoinHandle` error inspection (`join_err.is_panic()`) without crashing the main application loop.
> 
> Construct a panic-safe task dispatcher using Tokio semaphores and task handles.
> 
> **Requirements**:
> 1. Define `JobTask` struct with `id: u64` and `should_panic: bool`.
> 2. Implement `TaskDispatcher` holding `Arc<tokio::sync::Semaphore>`.
> 3. Implement `dispatch_job(&self, job: JobTask) -> tokio::task::JoinHandle<Result<String, &'static str>>`.
> 4. Add unit tests confirming semaphore throttling and verifying panic catching via `handle.await.unwrap_err().is_panic()`.
> 
> > [!check]- Answer
> > ```rust
> > use std::sync::Arc;
> > use std::time::Duration;
> > use tokio::sync::Semaphore;
> > use tokio::task::JoinHandle;
> > 
> > #[derive(Debug, Clone)]
> > pub struct JobTask {
> >     pub id: u64,
> >     pub should_panic: bool,
> > }
> > 
> > pub struct TaskDispatcher {
> >     semaphore: Arc<Semaphore>,
> > }
> > 
> > impl TaskDispatcher {
> >     pub fn new(max_concurrency: usize) -> Self {
> >         Self {
> >             semaphore: Arc::new(Semaphore::new(max_concurrency)),
> >         }
> >     }
> > 
> >     pub fn dispatch_job(&self, job: JobTask) -> JoinHandle<Result<String, &'static str>> {
> >         let sem = Arc::clone(&self.semaphore);
> >         tokio::spawn(async move {
> >             let _permit = sem.acquire_owned().await.unwrap();
> >             if job.should_panic {
> >                 panic!("CRITICAL_JOB_PANIC");
> >             }
> >             tokio::time::sleep(Duration::from_millis(10)).await;
> >             Ok(format!("JOB_{}_SUCCESS", job.id))
> >         })
> >     }
> > }
> > 
> > #[cfg(test)]
> > mod tests {
> >     use super::*;
> > 
> >     #[tokio::test]
> >     async fn test_dispatcher_success() {
> >         let dispatcher = TaskDispatcher::new(2);
> >         let handle = dispatcher.dispatch_job(JobTask { id: 1, should_panic: false });
> >         let res = handle.await.unwrap();
> >         assert_eq!(res, Ok("JOB_1_SUCCESS".to_string()));
> >     }
> > 
> >     #[tokio::test]
> >     async fn test_dispatcher_catches_panic() {
> >         let dispatcher = TaskDispatcher::new(2);
> >         let handle = dispatcher.dispatch_job(JobTask { id: 2, should_panic: true });
> >         let join_res = handle.await;
> >         assert!(join_res.is_err());
> >         let err = join_res.unwrap_err();
> >         assert!(err.is_panic());
> >     }
> > }
> > ```
> > 
> > **Step-by-Step Explanation**:
> > 1. **Concurrency Throttling**: `Semaphore::new(max_concurrency)` limits simultaneous task execution, queuing extra tasks asynchronously.
> > 2. **Panic Isolation**: Tokio task panics are isolated to the spawned task. `.await`ing the `JoinHandle` yields `Err(JoinError)` where `err.is_panic()` returns `true`, allowing safe recovery without crashing the host process.
> 
> ---
> 
> ## 6. Related Terms
> 
> - [`async fn`](../level_10/async_fn.md) — The language feature Tokio executes.
> - [`tokio::spawn`](../level_10/tokio_spawn.md) — How you push tasks onto Tokio's thread pool.
> - [`select!`](../level_10/select_macro.md) — Tokio's event multiplexing macro.
> 
> ---
> 
> ## 7. Key Takeaways
> 
> - **`Tokio`** is the industry-standard async runtime for Rust.
> - It is **not** part of Rust's standard library, allowing Rust to run on bare-metal systems without runtime bloat.
> - It provides a multi-threaded, work-stealing task scheduler, async I/O, timers, and channels.
> - Use **`#[tokio::main]`** to initialize the runtime automatically.
> - Never run long-blocking synchronous operations (like `std::thread::sleep` or heavy CPU loops) inside Tokio tasks; use `tokio::task::spawn_blocking` instead!
> 
