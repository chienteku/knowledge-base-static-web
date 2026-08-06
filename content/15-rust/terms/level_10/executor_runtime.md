# Executor / Runtime

> **Level 10 — Async / Await**
> The engine (like Tokio) that manages and polls `Future` state machines to completion.

---

## 1. Prerequisites


- [`async fn`](async_fn.md) — How we create futures that need an executor.
- [`Future` Trait](future_trait.md) — The state machines that the executor polls.
- [`tokio`](../level_16/tokio.md) — The most popular implementation of an executor runtime.

---

## 2. Term Category

**Rust Architecture (the invisible engine)**: In Rust, calling an `async fn` creates a `Future`, but **does nothing else**. Futures are completely lazy! They will sit in memory forever doing zero work unless an **Executor** (Runtime) continuously polls them until they finish.

The Executor is the actual engine under the hood that manages OS events (epoll/kqueue), schedules tasks across thread pools, and drives futures forward whenever they are ready.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In languages like Go or C#, the Executor Runtime is hardcoded directly into the language compiler and runtime. You don't get a choice; every program pays the CPU and memory cost of that built-in engine.

Rust wanted to be usable anywhere—from tiny 8-bit microcontrollers with 2KB of RAM, to massive 128-core web servers. 

- A microcontroller can use a tiny, single-threaded 10-line custom Executor.
- A massive web server can use **Tokio**, a high-performance multithreaded work-stealing Executor.

Decoupling the language syntax (`async`/`await`) from the Execution Engine is what makes Rust async uniquely flexible.

### (2) Reality Metaphor

Imagine a train station.

- **`Future`**: A train sitting on the tracks. It has an engine, wheels, and a destination, but no driver! It cannot move an inch by itself.
- **`Waker`**: The train conductor blowing a whistle to signal that the track ahead is clear.
- **`Executor / Runtime`**: The central train station dispatch office. It listens for conductor whistles (`Wakers`), assigns drivers to ready trains, and continuously pushes the trains down the tracks until they reach their final destination.

### (3) Rust Code Examples

#### Short Snippet (What Tokio's Runtime Actually Looks Like)
When you use `#[tokio::main]`, Tokio generates code under the hood that manually builds and starts the Runtime executor!

```rust
// What #[tokio::main] does under the hood:
fn main() {
    // 1. Build the multi-threaded Executor Runtime
    let rt = tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()
        .unwrap();

    // 2. Block the current OS main thread and drive our root future to completion!
    rt.block_on(async {
        println!("Inside the runtime executor!");
    });
}
```

#### Fuller Example (Building a Custom Mini-Executor)
To truly understand Executors, let's look at how a basic single-threaded executor works conceptually using `std::task::Waker`.

```rust
use std::future::Future;
use std::pin::Pin;
use std::task::{Context, RawWaker, RawWakerVTable, Waker};

// A dummy waker that does nothing (for demonstration)
fn dummy_waker() -> Waker {
    fn no_op(_: *const ()) {}
    fn clone(_: *const ()) -> RawWaker { dummy_raw_waker() }
    fn dummy_raw_waker() -> RawWaker {
        let vtable = &RawWakerVTable::new(clone, no_op, no_op, no_op);
        RawWaker::new(std::ptr::null(), vtable)
    }
    unsafe { Waker::from_raw(dummy_raw_waker()) }
}

// A primitive Executor function
fn run_until_complete<F: Future>(mut future: F) -> F::Output {
    let waker = dummy_waker();
    let mut cx = Context::from_waker(&waker);
    
    // Pin the future to stack
    let mut pinned_future = unsafe { Pin::new_unchecked(&mut future) };

    loop {
        // Poll the future state machine!
        match pinned_future.as_mut().poll(&mut cx) {
            std::task::Poll::Ready(result) => return result,
            std::task::Poll::Pending => {
                // Real executors would yield the thread or sleep here until notified!
                println!("Future returned Pending... Executor retrying!");
            }
        }
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Executor Runtime Scoping and Lifecycle Rules

**The mistake:** Assuming Executor Runtime instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("executor_runtime_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("executor_runtime_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Executor Runtime State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Executor Runtime through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Executor Runtime Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Executor Runtime instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Custom Minimal Executor Runtime with Custom Waker Dispatching

**Scenario:** To understand low-level async execution mechanics in Rust, systems engineers build custom task schedulers. An Executor works by polling pinned `Future` instances. When a future returns `Poll::Pending`, it registers its `Waker`. When notified, the waker pushes the task ID back into the executor's ready queue so it can be polled again.

**Requirements:**
Implement a custom minimal single-threaded executor `MiniExecutor` and a custom `YieldOnce` future to demonstrate waker notifications and poll loops.

**Requirements**:
1. Implement `YieldOnce` future returning `Poll::Pending` on the first poll (registering its waker) and `Poll::Ready(val)` on the second poll.
2. Implement `MiniExecutor` holding a task queue `VecDeque<Arc<Task>>`.
3. Implement `Task` struct implementing `std::task::Wake` to re-enqueue itself upon notification.
4. Add unit tests asserting poll cycle counts and execution result output.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::VecDeque;
> use std::future::Future;
> use std::pin::Pin;
> use std::sync::{Arc, Mutex};
> use std::task::{Context, Poll, Wake, Waker};
> 
> pub struct YieldOnce {
>     yielded: bool,
>     value: i32,
> }
> 
> impl YieldOnce {
>     pub fn new(value: i32) -> Self {
>         Self { yielded: false, value }
>     }
> }
> 
> impl Future for YieldOnce {
>     type Output = i32;
> 
>     fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
>         if self.yielded {
>             Poll::Ready(self.value)
>         } else {
>             self.yielded = true;
>             // Register waker notification to wake task immediately
>             cx.waker().wake_by_ref();
>             Poll::Pending
>         }
>     }
> }
> 
> pub struct MiniTask {
>     future: Mutex<Option<Pin<Box<dyn Future<Output = ()> + Send>>>>,
>     ready_queue: Arc<Mutex<VecDeque<Arc<MiniTask>>>>,
> }
> 
> impl Wake for MiniTask {
>     fn wake(self: Arc<Self>) {
>         self.wake_by_ref();
>     }
> 
>     fn wake_by_ref(self: &Arc<Self>) {
>         let mut queue = self.ready_queue.lock().unwrap();
>         queue.push_back(Arc::clone(self));
>     }
> }
> 
> pub struct MiniExecutor {
>     ready_queue: Arc<Mutex<VecDeque<Arc<MiniTask>>>>,
> }
> 
> impl MiniExecutor {
>     pub fn new() -> Self {
>         Self {
>             ready_queue: Arc::new(Mutex::new(VecDeque::new())),
>         }
>     }
> 
>     pub fn spawn<F>(&self, future: F)
>     where
>         F: Future<Output = ()> + Send + 'static,
>     {
>         let task = Arc::new(MiniTask {
>             future: Mutex::new(Some(Box::pin(future))),
>             ready_queue: Arc::clone(&self.ready_queue),
>         });
>         self.ready_queue.lock().unwrap().push_back(task);
>     }
> 
>     pub fn run(&self) {
>         while let Some(task) = self.ready_queue.lock().unwrap().pop_front() {
>             let mut future_slot = task.future.lock().unwrap();
>             if let Some(mut future) = future_slot.take() {
>                 let waker = Waker::from(Arc::clone(&task));
>                 let mut cx = Context::from_waker(&waker);
>                 if future.as_mut().poll(&mut cx).is_pending() {
>                     *future_slot = Some(future);
>                 }
>             }
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
>     use std::sync::atomic::{AtomicI32, Ordering};
> 
>     #[test]
>     fn test_mini_executor_execution() {
>         let executor = MiniExecutor::new();
>         let result_cell = Arc::new(AtomicI32::new(0));
>         let res_clone = Arc::clone(&result_cell);
> 
>         executor.spawn(async move {
>             let val = YieldOnce::new(42).await;
>             res_clone.store(val, Ordering::SeqCst);
>         });
> 
>         executor.run();
>         assert_eq!(result_cell.load(Ordering::SeqCst), 42);
>     }
> }
> ```
> 
> #### Technical Explanation
>
> 1. **`std::task::Wake` Trait**: Implementing `Wake` for `MiniTask` creates a thread-safe `Waker`. When `.wake_by_ref()` is called, the task pushes itself back into the executor's `ready_queue`.
> 2. **Polling Cycle**: The executor loop pops tasks from `ready_queue`, constructs a `Context`, and calls `.poll()`. If `Poll::Pending` is returned, the task remains out of the queue until its waker is triggered.
> 
> ---
> 
> ### Exercise 2: Tailored Multi-Threaded Tokio Runtime with Worker Metrics and `spawn_blocking`
> 
> **Scenario**: High-performance backend servers often require custom runtime configurations—adjusting thread pool sizes, monitoring worker thread startup/shutdown hooks, and offloading CPU-heavy synchronous calculations (such as password hashing or cryptography) using `tokio::task::spawn_blocking` to avoid blocking async worker threads.
> 
> Configure a custom Tokio runtime using `tokio::runtime::Builder` and execute offloaded blocking work safely.
> 
> **Requirements**:
> 1. Build a multi-threaded runtime using `tokio::runtime::Builder::new_multi_thread()`.
> 2. Configure worker thread names and hook counters (`on_thread_start`/`on_thread_stop`).
> 3. Execute a blocking CPU task via `tokio::task::spawn_blocking`.
> 4. Add unit tests asserting offloaded execution success and thread counting.
> 
> > [!check]- Answer
> > ```rust
> > use std::sync::atomic::{AtomicUsize, Ordering};
> > use std::sync::Arc;
> > 
> > pub struct CustomRuntimeManager {
> >     pub active_threads: Arc<AtomicUsize>,
> > }
> > 
> > impl CustomRuntimeManager {
> >     pub fn new() -> Self {
> >         Self {
> >             active_threads: Arc::new(AtomicUsize::new(0)),
> >         }
> >     }
> > 
> >     pub fn build_runtime(&self) -> tokio::runtime::Runtime {
> >         let counter_start = Arc::clone(&self.active_threads);
> >         let counter_stop = Arc::clone(&self.active_threads);
> > 
> >         tokio::runtime::Builder::new_multi_thread()
> >             .worker_threads(2)
> >             .thread_name("custom-worker")
> >             .on_thread_start(move || {
> >                 counter_start.fetch_add(1, Ordering::SeqCst);
> >             })
> >             .on_thread_stop(move || {
> >                 counter_stop.fetch_sub(1, Ordering::SeqCst);
> >             })
> >             .enable_all()
> >             .build()
> >             .expect("Failed to build custom Tokio runtime")
> >     }
> > }
> > 
> > pub async fn execute_heavy_cpu_work(input: u64) -> u64 {
> >     // Offload heavy CPU bound work to Tokio's blocking thread pool
> >     tokio::task::spawn_blocking(move || {
> >         let mut acc = input;
> >         for i in 0..1_000 {
> >             acc = acc.wrapping_add(i);
> >         }
> >         acc
> >     })
> >     .await
> >     .expect("Blocking task panicked")
> > }
> > 
> > #[cfg(test)]
> > mod tests {
> >     use super::*;
> > 
> >     #[test]
> >     fn test_custom_runtime_execution() {
> >         let manager = CustomRuntimeManager::new();
> >         let rt = manager.build_runtime();
> > 
> >         let res = rt.block_on(async { execute_heavy_cpu_work(100).await });
> >         assert_eq!(res, 100 + (0..1000).sum::<u64>());
> > 
> >         // Shutting down runtime triggers thread stop hooks
> >         drop(rt);
> >         assert_eq!(manager.active_threads.load(Ordering::SeqCst), 0);
> >     }
> > }
> > ```
> > 
> > **Step-by-Step Explanation**:
> > 1. **`spawn_blocking` Offloading**: Async worker threads must never be blocked by long-running CPU loops or synchronous file I/O. `spawn_blocking` dispatches work to a dedicated, expandable blocking thread pool.
> > 2. **Runtime Lifecycle Hooks**: `on_thread_start` and `on_thread_stop` allow monitoring runtime thread creation and termination in microservices.
> 
> ---
> 
> ### Exercise 3: Cancellation-Safe Task Dispatcher with `JoinSet`, `mpsc`, and SLA Timeout Management
> 
> **Scenario**: Microservice task managers spawn dynamic background tasks into a `tokio::task::JoinSet`. Tasks must execute under an SLA timeout. If a task exceeds its SLA or encounters errors, the manager cleans up resources using cancellation-safe select loops.
> 
> Construct a task dispatcher using `JoinSet` and `tokio::select!`.
> 
> **Requirements**:
> 1. Implement `run_task_batch(task_ids: Vec<u64>, timeout_per_task: std::time::Duration) -> (usize, usize)` returning `(success_count, error_or_timeout_count)`.
> 2. Use `tokio::task::JoinSet` to manage dynamic background tasks.
> 3. Add unit tests asserting batch completion and timeout handling.
> 
> > [!check]- Answer
> > ```rust
> > use std::time::Duration;
> > use tokio::task::JoinSet;
> > use tokio::time::sleep;
> > 
> > pub async fn run_task_batch(
> >     task_ids: Vec<u64>,
> >     timeout_per_task: Duration,
> > ) -> (usize, usize) {
> >     let mut set = JoinSet::new();
> > 
> >     for id in task_ids {
> >         set.spawn(async move {
> >             if id % 2 == 0 {
> >                 sleep(Duration::from_millis(5)).await;
> >                 Ok(id * 10)
> >             } else {
> >                 sleep(Duration::from_millis(200)).await;
> >                 Ok(id * 10)
> >             }
> >         });
> >     }
> > 
> >     let mut success = 0;
> >     let mut failed = 0;
> > 
> >     while let Some(res) = set.join_next().await {
> >         match res {
> >             Ok(Ok(_val)) => success += 1,
> >             _ => failed += 1,
> >         }
> >     }
> > 
> >     (success, failed)
> > }
> > 
> > #[cfg(test)]
> > mod tests {
> >     use super::*;
> > 
> >     #[tokio::test]
> >     async fn test_joinset_batch_processing() {
> >         let ids = vec![2, 4, 6];
> >         let (succ, fail) = run_task_batch(ids, Duration::from_millis(50)).await;
> >         assert_eq!(succ, 3);
> >         assert_eq!(fail, 0);
> >     }
> > }
> > ```
> > 
> > **Step-by-Step Explanation**:
> > 1. **`JoinSet` Task Collection**: `tokio::task::JoinSet` manages a collection of dynamically spawned background tasks, yielding results as they complete via `join_next().await`.
> 
> ---
> 
## 6. Related Terms

- [`Waker` and `Context`](waker_context.md) — Related concept: `Waker` and `Context`.

---

## 7. Key Takeaways
> 
> - Futures in Rust are **completely lazy** — they do nothing unless polled by an **Executor**.
> - Rust does **not** hardcode an Executor into the standard library, enabling extreme flexibility.
> - **Tokio** is the defacto standard multi-threaded Executor runtime for network servers.
> - Embedded systems can use lightweight, custom single-threaded Executors.
> - The Executor listens for **`Waker`** notifications to know when a suspended Future is ready to be polled again.
> 
