# `tokio`

> **Level 16 — Ecosystem & Tooling**
> The dominant, multi-threaded asynchronous event-driven runtime ecosystem in Rust — powering high-throughput network applications with non-blocking I/O (`tokio::net`), timers (`tokio::time`), file I/O (`tokio::fs`), task spawning (`tokio::spawn`), and concurrency channels (`tokio::sync`).

---

## 1. Prerequisites


- [`async` / `.await`](../level_09/async_await.md) — Rust's async language primitives.
- [`Future` Trait](../level_10/future_trait.md) — The core asynchronous trait polled by `tokio`'s reactor.
- [Channels (`mpsc`, `oneshot`)](../level_09/channels_mpsc_oneshot.md) — Asynchronous synchronization primitives.

---

## 2. Term Category



**Rust Ecosystem Library (asynchronous event loop runtime)**: `tokio` is the de facto async runtime ecosystem for Rust. While the Rust standard library provides the `Future` trait and `async/await` syntax, it intentionally excludes an async runtime executor. `tokio` provides the multi-threaded work-stealing task scheduler, non-blocking I/O event reactor (epoll/kqueue/IOCP), and async networking primitives that power crates like `reqwest`, `axum`, `hyper`, and `tonic`.



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Traditional OS thread-per-connection architectures (like standard 1:1 threads) scale poorly when handling 100,000 concurrent network connections:
- Each OS thread allocates 2 MB of stack memory (100,000 threads = 200 GB RAM!).
- Thread context-switching overloads the OS kernel scheduler.

`tokio` uses an **M:N Asynchronous Work-Stealing Task Model**:
- Millions of lightweight async tasks (`tokio::spawn`) are multiplexed across a small pool of worker threads matching hardware CPU cores (e.g. 8 threads).
- Non-blocking I/O events are polled using platform-native OS primitives (`epoll` on Linux, `kqueue` on macOS, `IOCP` on Windows).
- When a task pauses on `await` waiting for network packets, worker threads immediately steal and execute other active tasks.

### (2) Code Examples

#### Asynchronous TCP Echo Server with `tokio`

```rust
use tokio::net::TcpListener;
use tokio::io::{AsyncReadExt, AsyncWriteExt};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let listener = TcpListener::bind("127.0.0.1:8080").await?;
    println!("Tokio TCP server listening on 127.0.0.1:8080");

    // Accept incoming connections in an async loop
    loop {
        let (mut socket, addr) = listener.accept().await?;
        println!("Accepted connection from: {}", addr);

        // Spawn a lightweight Tokio background task for each connection
        tokio::spawn(async move {
            let mut buf = [0u8; 1024];
            loop {
                let n = match socket.read(&mut buf).await {
                    Ok(0) => return, // Connection closed
                    Ok(n) => n,
                    Err(e) => {
                        eprintln!("Socket read error: {}", e);
                        return;
                    }
                };

                // Echo data back asynchronously
                if let Err(e) = socket.write_all(&buf[..n]).await {
                    eprintln!("Socket write error: {}", e);
                    return;
                }
            }
        });
    }
}
```

---

## 4. Common Mistakes & Pitfalls
### Mistake 2: Holding `std::sync::MutexGuard` Across `.await` Yield Points

**The mistake:** Locking `std::sync::Mutex` and calling `.await` while holding the guard.

**Why it's wrong:** Standard mutexes block the underlying OS thread, deadlocking Tokio worker pools and causing `!Send` future compiler errors.

*Fix:* Use `tokio::sync::Mutex` when holding locks across yield points.

### Mistake 3: Spawning Tasks Without Managing `JoinHandle` Panic / Cancellation Errors

**The mistake:** Calling `tokio::spawn(async { ... })` and discarding the returned `JoinHandle`.

**Why it's wrong:** If the spawned background task panics, the panic is swallowed silently without logging or alerting the parent application.

*Fix:* Await `handle.await` and inspect `JoinError` to handle background panics cleanly.


### Mistake 1: Blocking the Tokio Worker Thread with Synchronous I/O or Heavy Loops

**The mistake:** Calling `std::thread::sleep()` or executing a heavy CPU loop inside a Tokio `async` block.

**Why it's wrong:** Tokio worker threads are shared across thousands of async tasks. Blocking a worker thread starves other tasks from executing.

*Fix:*
```rust
// Use `tokio::time::sleep` for sleeping, or `tokio::task::spawn_blocking` for CPU heavy work:
tokio::task::spawn_blocking(move || {
    // Heavy CPU or synchronous file operation
}).await.unwrap();
```

---

## 5. Practice Exercises

### Exercise 1: Bounded Concurrency Task Worker Pool with MPSC Channels
**Scenario:** In microservices architecture, processing bulk workloads (e.g., document indexing or outbound batch API notifications) concurrently can overwhelm downstream endpoints or saturate OS file descriptors. Implement a bounded task worker pool using Tokio's MPSC channel (`tokio::sync::mpsc`) and a concurrency-limiting `tokio::sync::Semaphore`.
Your implementation must:
1. Define a `Job` struct containing `id: u64` and `payload: String`.
2. Define a `JobResult` struct containing `job_id: u64`, `worker_id: usize`, and `status: String`.
3. Construct a `WorkerPool` that spawns $N$ concurrent worker tasks listening on a shared job channel.
4. Limit active concurrent processing across worker tasks using an `Arc<Semaphore>`.
5. Collect all processed results into a `Vec<JobResult>` and return them.
6. Write a comprehensive unit test using `#[tokio::test]` with assertions verifying total processed job count, correct status formatting, and job ordering.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::sync::Arc;
> use tokio::sync::{mpsc, Semaphore};
> use tokio::task::JoinHandle;
> use tokio::time::{sleep, Duration};
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct Job {
>     pub id: u64,
>     pub payload: String,
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct JobResult {
>     pub job_id: u64,
>     pub worker_id: usize,
>     pub status: String,
> }
> 
> pub struct WorkerPool {
>     max_concurrency: usize,
>     num_workers: usize,
> }
> 
> impl WorkerPool {
>     pub fn new(max_concurrency: usize, num_workers: usize) -> Self {
>         Self {
>             max_concurrency,
>             num_workers,
>         }
>     }
> 
>     pub async fn process_jobs(&self, jobs: Vec<Job>) -> Vec<JobResult> {
>         let total_jobs = jobs.len();
>         let (job_tx, job_rx) = mpsc::channel::<Job>(total_jobs.max(1));
>         let (result_tx, mut result_rx) = mpsc::channel::<JobResult>(total_jobs.max(1));
> 
>         let semaphore = Arc::new(Semaphore::new(self.max_concurrency));
>         let job_rx = Arc::new(tokio::sync::Mutex::new(job_rx));
> 
>         let mut worker_handles: Vec<JoinHandle<()>> = Vec::with_capacity(self.num_workers);
> 
>         for worker_id in 0..self.num_workers {
>             let job_rx = Arc::clone(&job_rx);
>             let result_tx = result_tx.clone();
>             let semaphore = Arc::clone(&semaphore);
> 
>             let handle = tokio::spawn(async move {
>                 loop {
>                     // Lock receiver briefly to fetch next queued job
>                     let job = {
>                         let mut rx_guard = job_rx.lock().await;
>                         rx_guard.recv().await
>                     };
> 
>                     match job {
>                         Some(job) => {
>                             // Acquire semaphore permit to cap active execution count
>                             let _permit = semaphore.acquire().await.unwrap();
> 
>                             // Simulate async workload (e.g. non-blocking I/O request)
>                             sleep(Duration::from_millis(10)).await;
> 
>                             let res = JobResult {
>                                 job_id: job.id,
>                                 worker_id,
>                                 status: format!("PROCESSED: {}", job.payload),
>                             };
> 
>                             let _ = result_tx.send(res).await;
>                         }
>                         None => break, // Channel closed, terminate worker loop
>                     }
>                 }
>             });
>             worker_handles.push(handle);
>         }
> 
>         // Drop producer's result_tx handle so result_rx closes when all workers finish
>         drop(result_tx);
> 
>         // Enqueue all incoming jobs
>         for job in jobs {
>             job_tx.send(job).await.unwrap();
>         }
>         // Drop job_tx so workers detect end of job stream
>         drop(job_tx);
> 
>         // Drain result channel
>         let mut results = Vec::with_capacity(total_jobs);
>         while let Some(res) = result_rx.recv().await {
>             results.push(res);
>         }
> 
>         // Await worker completion
>         for handle in worker_handles {
>             handle.await.unwrap();
>         }
> 
>         results
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[tokio::test]
>     async fn test_worker_pool_bounded_execution() {
>         let pool = WorkerPool::new(2, 4);
>         let jobs = vec![
>             Job { id: 1, payload: "Task A".into() },
>             Job { id: 2, payload: "Task B".into() },
>             Job { id: 3, payload: "Task C".into() },
>             Job { id: 4, payload: "Task D".into() },
>             Job { id: 5, payload: "Task E".into() },
>         ];
> 
>         let total_jobs = jobs.len();
>         let mut results = pool.process_jobs(jobs).await;
> 
>         // Sort results by job_id for deterministic assertions
>         results.sort_by_key(|r| r.job_id);
> 
>         assert_eq!(results.len(), total_jobs);
>         assert_eq!(results[0].job_id, 1);
>         assert_eq!(results[0].status, "PROCESSED: Task A");
>         assert_eq!(results[4].job_id, 5);
>         assert_eq!(results[4].status, "PROCESSED: Task E");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **`tokio::sync::mpsc` Channel:** Multi-producer single-consumer channel transfers tasks asynchronously from callers to workers.
> 2. **`tokio::sync::Semaphore` Permits:** Enforces hard upper bounds on active concurrent processing tasks, preventing resource exhaustion under peak loads.
> 3. **Channel Termination Protocol:** Dropping `job_tx` causes `recv().await` to return `None`, naturally terminating worker tasks without polling flags or manual cancellation tokens.

---

### Exercise 2: Resilient RPC Fetcher with Timeout and Fallback via `tokio::time::timeout`
**Scenario:** Distributed services calling upstream services or remote databases must handle latency spikes gracefully. Build a resilient async RPC client function using `tokio::time::timeout`.
Your implementation must:
1. Define a `QueryResponse` enum representing `Success(String)`, `Fallback(String)`, or `TimedOut`.
2. Implement `fetch_with_resilience` taking a primary async query closure, a fallback async query closure, and a timeout duration `deadline`.
3. Race the primary query against `deadline`. If primary completes successfully within `deadline`, return `QueryResponse::Success`.
4. If primary exceeds `deadline` or errors, immediately attempt the fallback query within a second `deadline` window.
5. If fallback completes successfully, return `QueryResponse::Fallback`. If fallback also times out or fails, return `QueryResponse::TimedOut`.
6. Write unit tests with `#[tokio::test]` asserting primary success, primary timeout leading to fallback success, and dual timeout failure.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use tokio::time::{sleep, Duration, timeout};
> 
> #[derive(Debug, PartialEq, Eq, Clone)]
> pub enum QueryResponse {
>     Success(String),
>     Fallback(String),
>     TimedOut,
> }
> 
> pub async fn fetch_with_resilience<F1, F2, Fut1, Fut2>(
>     primary_fn: F1,
>     fallback_fn: F2,
>     deadline: Duration,
> ) -> QueryResponse
> where
>     F1: FnOnce() -> Fut1,
>     F2: FnOnce() -> Fut2,
>     Fut1: std::future::Future<Output = Result<String, &'static str>>,
>     Fut2: std::future::Future<Output = Result<String, &'static str>>,
> {
>     // Enforce timeout on primary query future
>     match timeout(deadline, primary_fn()).await {
>         Ok(Ok(data)) => QueryResponse::Success(data),
>         Ok(Err(_)) | Err(_) => {
>             // Primary failed or timed out; attempt fallback query
>             match timeout(deadline, fallback_fn()).await {
>                 Ok(Ok(fallback_data)) => QueryResponse::Fallback(fallback_data),
>                 _ => QueryResponse::TimedOut,
>             }
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[tokio::test]
>     async fn test_primary_success() {
>         let primary = || async {
>             sleep(Duration::from_millis(10)).await;
>             Ok("Primary DB Data".to_string())
>         };
>         let fallback = || async { Ok("Cache Data".to_string()) };
> 
>         let res = fetch_with_resilience(primary, fallback, Duration::from_millis(100)).await;
>         assert_eq!(res, QueryResponse::Success("Primary DB Data".to_string()));
>     }
> 
>     #[tokio::test]
>     async fn test_primary_timeout_triggers_fallback() {
>         let primary_slow = || async {
>             sleep(Duration::from_millis(200)).await;
>             Ok("Slow Data".to_string())
>         };
>         let fallback_fast = || async {
>             sleep(Duration::from_millis(10)).await;
>             Ok("Fast Cache Data".to_string())
>         };
> 
>         let res = fetch_with_resilience(primary_slow, fallback_fast, Duration::from_millis(50)).await;
>         assert_eq!(res, QueryResponse::Fallback("Fast Cache Data".to_string()));
>     }
> 
>     #[tokio::test]
>     async fn test_both_timeout_returns_timed_out() {
>         let primary_slow = || async {
>             sleep(Duration::from_millis(200)).await;
>             Ok("Slow Data".to_string())
>         };
>         let fallback_slow = || async {
>             sleep(Duration::from_millis(200)).await;
>             Ok("Slow Fallback Data".to_string())
>         };
> 
>         let res = fetch_with_resilience(primary_slow, fallback_slow, Duration::from_millis(50)).await;
>         assert_eq!(res, QueryResponse::TimedOut);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **`tokio::time::timeout` Deadline Safety:** Wraps any `Future` with a time constraint. If the timer fires before the underlying `Future` resolves, Tokio drops the `Future`, immediately aborting pending operations.
> 2. **Async Future Cancellation:** Tokio futures are lazy and state-machine-driven. Dropping an uncompleted future cleanly drops all internal task resources without leaks.
> 3. **Higher-Order Async Closures:** Accepting `FnOnce() -> Future` avoids premature execution of fallback logic until primary failure occurs.

---

### Exercise 3: Offloading CPU Work & Broadcasting State via `spawn_blocking` and `watch` Channels
**Scenario:** In asynchronous network servers, performing intensive synchronous CPU tasks (such as password hashing or cryptography) on Tokio worker threads freezes the runtime and starves network I/O.
Implement a service where:
1. Heavy CPU computation (hashing byte data) is safely offloaded to Tokio's dedicated blocking threadpool using `tokio::task::spawn_blocking`.
2. Computation updates are published to subscriber tasks using a `tokio::sync::watch` channel (single producer, multi-subscriber).
3. Subscriber tasks watch for state notifications via `rx.changed().await` and inspect the latest computed state using `rx.borrow()`.
4. Write unit tests with `#[tokio::test]` verifying that blocking tasks resolve correctly off-worker threads and subscriber watch receivers receive updated values.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use tokio::sync::watch;
> use tokio::task;
> use tokio::time::{sleep, Duration};
> 
> pub struct HashingService {
>     tx: watch::Sender<u64>,
>     rx: watch::Receiver<u64>,
> }
> 
> impl HashingService {
>     pub fn new(initial_state: u64) -> Self {
>         let (tx, rx) = watch::channel(initial_state);
>         Self { tx, rx }
>     }
> 
>     pub fn subscribe(&self) -> watch::Receiver<u64> {
>         self.rx.clone()
>     }
> 
>     pub async fn compute_hash_offloaded(&self, input_data: Vec<u8>) -> Result<u64, String> {
>         let tx = self.tx.clone();
> 
>         // Offload heavy CPU workload to Tokio's dedicated blocking thread pool
>         let computed_hash = task::spawn_blocking(move || {
>             // FNV-1a hash algorithm simulation
>             let mut hash: u64 = 14695981039346656037;
>             for byte in input_data {
>                 hash ^= byte as u64;
>                 hash = hash.wrapping_mul(1099511628211);
>             }
>             hash
>         })
>         .await
>         .map_err(|e| format!("Task join error: {}", e))?;
> 
>         // Broadcast updated result to all subscriber channels
>         let _ = tx.send(computed_hash);
> 
>         Ok(computed_hash)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[tokio::test]
>     async fn test_spawn_blocking_and_watch_broadcast() {
>         let service = HashingService::new(0);
>         let mut sub1 = service.subscribe();
>         let mut sub2 = service.subscribe();
> 
>         // Verify initial watch values
>         assert_eq!(*sub1.borrow(), 0);
>         assert_eq!(*sub2.borrow(), 0);
> 
>         let data = vec![10, 20, 30, 40, 50];
> 
>         // Spawn listener task to observe async watch changes
>         let listener_handle = tokio::spawn(async move {
>             sub1.changed().await.unwrap();
>             *sub1.borrow()
>         });
> 
>         // Perform CPU computation on blocking pool
>         let hash = service.compute_hash_offloaded(data).await.unwrap();
>         assert_ne!(hash, 0);
> 
>         // Verify sub2 reflects the latest state immediately
>         assert_eq!(*sub2.borrow(), hash);
> 
>         // Verify spawned listener task unblocks and reads the updated state
>         let received_hash = listener_handle.await.unwrap();
>         assert_eq!(received_hash, hash);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **`tokio::task::spawn_blocking`:** Delegates CPU-bound or synchronous blocking tasks to a separate OS thread pool managed by Tokio, preserving reactor threads for non-blocking I/O.
> 2. **`tokio::sync::watch` Channel:** Efficient single-producer, multi-consumer state broadcast channel where receivers observe state change notifications without queuing historical values.
> 3. **`rx.changed().await` & `rx.borrow()`:** `changed()` yields asynchronously when a new value is sent, while `borrow()` provides zero-copy read access to the current shared state.

---

---

## 6. Related Terms

- [`Read` / `Write` / `BufRead` Traits](../level_04/read_write_bufread.md) — Related concept: `Read` / `Write` / `BufRead` Traits.

---

## 7. Key Takeaways

- `tokio` is the leading async runtime ecosystem in Rust.
- Provides work-stealing task scheduling (`tokio::spawn`), non-blocking I/O (`tokio::net`), timers (`tokio::time`), and channels (`tokio::sync`).
- Annotate `main` with `#[tokio::main]` to initialize the multi-threaded Tokio runtime.
- Never block a Tokio worker thread with synchronous I/O or `std::thread::sleep`; use `spawn_blocking` or `tokio::time::sleep`.
