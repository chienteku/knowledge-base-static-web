# `.await`

> **Level 10 — Async / Await**
> Keyword that pauses execution until a `Future` resolves to a value.

---

## 1. Prerequisites


- [`async fn`](async_fn.md) — Declaring the lazy functions that we `.await`.
- [`Future` Trait](future_trait.md) — The trait whose `Output` type is returned by `.await`.
- [`tokio`](../level_16/tokio.md) — The runtime that drives execution while we wait.

---

## 2. Term Category

**Rust Language Syntax (the pause button)**: If calling an `async fn` creates a paused `Future` state machine, **`.await`** is the magic keyword that actually starts running it and waits for the final result.

Crucially, `.await` is **postfix syntax** (written after the expression, like `my_future.await`). 

Unlike synchronous code which freezes the entire thread while waiting, `.await` **yields control back to the Tokio Runtime**, allowing the thread to work on millions of other tasks while this one is waiting!

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In traditional synchronous code, if you call `database.query()`, your OS thread literally stops executing code and stands idle in RAM for 50 milliseconds waiting for the network packet to arrive. This is called **Blocking I/O**.

`.await` introduces **Non-Blocking I/O**. When you write `database.query().await`, Rust saves the function's state, pauses it, and tells the Tokio Runtime: *"Hey, I'm waiting for a network packet. Go do other work!"* 

The Tokio runtime instantly switches the CPU to process another user's web request. When the network packet finally arrives 50ms later, Tokio wakes your task back up and `.await` evaluates to the database result!

### (2) Postfix Syntax — "Why `fut.await` instead of `await fut`?"

In languages like C#, Python, or JavaScript, you write `await fetch()`. 

Rust intentionally chose postfix syntax: `fetch().await`. Why? 

Because in Rust, error handling and method chaining are everywhere (`?` operator, `.unwrap()`, `.map()`). 
- **Prefix (C#/JS)**: `(await fetch()).map(...)` (Requires ugly nested parentheses!)
- **Postfix (Rust)**: `fetch().await?.map(...)` (Flows naturally from left to right!)

### (3) Reality Metaphor

Imagine a Doctor's Office.

- **Synchronous (No `.await`)**: The doctor calls a lab to request blood test results. The doctor holds the phone to their ear and stands completely still for 3 hours waiting for the lab technician to find the file. All other patients in the waiting room are forced to wait!
- **Asynchronous (`.await`)**: The doctor calls the lab, leaves a callback number, hangs up the phone (`.await`), and immediately sees 10 other patients in the waiting room. 3 hours later, the lab calls back. The doctor picks up the phone and reads the results. Zero wasted doctor time!

### (4) Rust Code Examples

#### Short Snippet (Method Chaining with `?`)
Notice how postfix `.await` combines seamlessly with Rust's `?` error handling operator!

```rust
async fn fetch_user_id() -> Result<u32, &'static str> {
    Ok(42)
}

async fn get_user() -> Result<String, &'static str> {
    // Postfix syntax allows chaining .await followed immediately by ?
    let id = fetch_user_id().await?; 
    
    Ok(format!("User #{}", id))
}
```

#### Fuller Example (Sequential vs Concurrent `.await`)
Calling `.await` immediately pauses execution *right there*. If you want two tasks to run concurrently, do **NOT** `.await` them immediately!

```rust
use tokio::time::{sleep, Duration};

async fn do_work(id: u32, delay_ms: u64) -> u32 {
    sleep(Duration::from_millis(delay_ms)).await;
    println!("Task {} done!", id);
    id
}

#[tokio::main]
async fn main() {
    // ----------------------------------------------------
    // BAD (Sequential): Takes 100ms + 100ms = 200ms total!
    // ----------------------------------------------------
    let a = do_work(1, 100).await; // Pauses main completely right here!
    let b = do_work(2, 100).await; // Only starts after task 1 is finished!

    // ----------------------------------------------------
    // GOOD (Concurrent): Takes only 100ms total!
    // ----------------------------------------------------
    let fut1 = do_work(3, 100); // Created, but NOT awaited yet!
    let fut2 = do_work(4, 100); // Created, but NOT awaited yet!

    // Now run them simultaneously using tokio::join!
    let (c, d) = tokio::join!(fut1, fut2);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Await Scoping and Lifecycle Rules

**The mistake:** Assuming Await instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("await_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("await_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Await State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Await through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Await Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Await instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Resilient Async Pipeline with Per-Attempt Timeout & Exponential Backoff

**Scenario:** You are developing an asynchronous API client for a cloud telemetry ingestion service. Remote HTTP calls can experience transient packet loss or server throttling. When calling remote endpoints, each attempt must be bounded by a per-attempt deadline using `tokio::time::timeout`. If an attempt fails or times out, the client must apply exponential backoff before `.await`ing the next attempt.

**Requirements:**
Construct a resilient retry function using `.await` and deadline timeouts.

**Requirements**:
1. Define a `TelemetryResponse` struct containing `status_code: u16` and `body: String`.
2. Define a `PipelineError` enum featuring variants `Timeout`, `ServerError(u16)`, and `MaxRetriesExceeded`.
3. Implement `async fn mock_remote_fetch(attempt: usize, delay: Duration) -> Result<TelemetryResponse, PipelineError>`.
4. Implement `async fn retry_with_timeout(max_retries: usize, initial_backoff: Duration, per_attempt_timeout: Duration) -> Result<TelemetryResponse, PipelineError>`.
5. Add unit tests asserting success on retry, failure on timeout, and exponential backoff calculations.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::time::Duration;
> use tokio::time::{sleep, timeout};
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct TelemetryResponse {
>     pub status_code: u16,
>     pub body: String,
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub enum PipelineError {
>     Timeout,
>     ServerError(u16),
>     MaxRetriesExceeded,
> }
> 
> pub async fn mock_remote_fetch(
>     attempt: usize,
>     delay: Duration,
> ) -> Result<TelemetryResponse, PipelineError> {
>     sleep(delay).await;
>     if attempt < 3 {
>         Err(PipelineError::ServerError(503))
>     } else {
>         Ok(TelemetryResponse {
>             status_code: 200,
>             body: "TELEMETRY_OK".into(),
>         })
>     }
> }
> 
> pub async fn retry_with_timeout(
>     max_retries: usize,
>     initial_backoff: Duration,
>     per_attempt_timeout: Duration,
> ) -> Result<TelemetryResponse, PipelineError> {
>     let mut backoff = initial_backoff;
> 
>     for attempt in 1..=max_retries {
>         // Wrap async function execution inside a deadline timeout and .await the result
>         let result = timeout(per_attempt_timeout, mock_remote_fetch(attempt, Duration::from_millis(5))).await;
> 
> 
>         match result {
>             Ok(Ok(resp)) => return Ok(resp),
>             Ok(Err(_err)) => {}
>             Err(_timeout_err) => {}
>         }
> 
>         if attempt < max_retries {
>             sleep(backoff).await;
>             backoff *= 2;
>         }
>     }
> 
>     Err(PipelineError::MaxRetriesExceeded)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[tokio::test]
>     async fn test_retry_success_on_third_attempt() {
>         let res = retry_with_timeout(4, Duration::from_millis(2), Duration::from_millis(50)).await;
>         assert!(res.is_ok());
>         let resp = res.unwrap();
>         assert_eq!(resp.status_code, 200);
>         assert_eq!(resp.body, "TELEMETRY_OK");
>     }
> 
>     #[tokio::test]
>     async fn test_retry_max_exceeded() {
>         let res = retry_with_timeout(2, Duration::from_millis(2), Duration::from_millis(50)).await;
>         assert_eq!(res, Err(PipelineError::MaxRetriesExceeded));
>     }
> }
> ```
> 
> #### Technical Explanation
>
> 1. **Postfix `.await` Composition**: Calling `mock_remote_fetch(...).await` suspends `retry_with_timeout` until the remote fetch future completes. Wrapping it inside `timeout(duration, fut).await` composes timer futures seamlessly.
> 2. **Non-Blocking Backoff**: `sleep(backoff).await` suspends the async task without blocking Tokio worker threads.
> 
> ---
> 
> ### Exercise 2: Manual `Future` Waker Mechanics vs `.await` Synchronization
> 
> **Scenario**: To understand what `.await` does under the hood, we can build a custom single-slot rendezvous channel `AsyncRendezvous<T>`. When a consumer calls `consume().await`, if data is not ready, `.await` registers the caller's `Waker` and yields `Poll::Pending`. When a producer calls `produce(val)`, it sets the value and invokes `waker.wake()`, signaling Tokio to resume the consumer's `.await` point.
> 
> Build a custom rendezvous synchronization primitive implementing `Future`.
> 
> **Requirements**:
> 1. Implement `AsyncRendezvous<T>` with shared `Arc<Mutex<State<T>>>`.
> 2. Implement `Future` for `ConsumerFuture<T>` returning `Poll::Ready(T)` when populated.
> 3. Add unit tests asserting produced data reception across task boundaries.
> 
> > [!check]- Answer
> > ```rust
> > use std::future::Future;
> > use std::pin::Pin;
> > use std::sync::{Arc, Mutex};
> > use std::task::{Context, Poll, Waker};
> > 
> > struct State<T> {
> >     value: Option<T>,
> >     waker: Option<Waker>,
> > }
> > 
> > pub struct AsyncRendezvous<T> {
> >     state: Arc<Mutex<State<T>>>,
> > }
> > 
> > impl<T: Clone> AsyncRendezvous<T> {
> >     pub fn new() -> Self {
> >         Self {
> >             state: Arc::new(Mutex::new(State {
> >                 value: None,
> >                 waker: None,
> >             })),
> >         }
> >     }
> > 
> >     pub fn produce(&self, val: T) {
> >         let mut guard = self.state.lock().unwrap();
> >         guard.value = Some(val);
> >         if let Some(waker) = guard.waker.take() {
> >             waker.wake();
> >         }
> >     }
> > 
> >     pub fn consume(&self) -> ConsumerFuture<T> {
> >         ConsumerFuture {
> >             state: Arc::clone(&self.state),
> >         }
> >     }
> > }
> > 
> > pub struct ConsumerFuture<T> {
> >     state: Arc<Mutex<State<T>>>,
> > }
> > 
> > impl<T: Clone> Future for ConsumerFuture<T> {
> >     type Output = T;
> > 
> >     fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
> >         let mut guard = self.state.lock().unwrap();
> >         if let Some(val) = guard.value.clone() {
> >             Poll::Ready(val)
> >         } else {
> >             guard.waker = Some(cx.waker().clone());
> >             Poll::Pending
> >         }
> >     }
> > }
> > 
> > #[cfg(test)]
> > mod tests {
> >     use super::*;
> >     use std::time::Duration;
> > 
> >     #[tokio::test]
> >     async fn test_rendezvous_produce_consume() {
> >         let channel = AsyncRendezvous::<String>::new();
> >         let channel_clone = AsyncRendezvous {
> >             state: Arc::clone(&channel.state),
> >         };
> > 
> >         tokio::spawn(async move {
> >             tokio::time::sleep(Duration::from_millis(10)).await;
> >             channel_clone.produce("PAYLOAD_READY".into());
> >         });
> > 
> >         // .await polls ConsumerFuture until producer calls waker.wake()
> >         let res = channel.consume().await;
> >         assert_eq!(res, "PAYLOAD_READY");
> >     }
> > }
> > ```
> > 
> > **Step-by-Step Explanation**:
> > 1. **Under the Hood of `.await`**: When `.await` is executed on `ConsumerFuture`, it calls `poll(cx)`. If data is absent, `cx.waker()` is saved and `Poll::Pending` is returned.
> > 2. **Waker Notification**: When `produce()` supplies data, calling `waker.wake()` notifies Tokio's executor to re-poll the consumer future, causing `.await` to unblock and return `Poll::Ready(val)`.
> 
> ---
> 
> ### Exercise 3: Cancellation-Safe Event Loop with `tokio::select!` and Async Channels
> 
> **Scenario**: Real-time event processors continuously pull messages from async channels using `.await` while racing against shutdown channels and interval tickers. `.await` points inside `tokio::select!` must be cancellation-safe to avoid losing messages.
> 
> Build a message processor event loop using `tokio::select!` and `.await`.
> 
> **Requirements**:
> 1. Implement `EventProcessor` accepting `mpsc::Receiver<String>` and `oneshot::Receiver<()>`.
> 2. Process incoming messages until emergency shutdown signal is received.
> 3. Add unit tests asserting message processing and cancellation behavior.
> 
> > [!check]- Answer
> > ```rust
> > use tokio::sync::{mpsc, oneshot};
> > 
> > pub async fn run_event_processor(
> >     mut rx: mpsc::Receiver<String>,
> >     mut cancel_rx: oneshot::Receiver<()>,
> > ) -> Vec<String> {
> >     let mut processed = Vec::new();
> > 
> >     loop {
> >         tokio::select! {
> >             biased;
> 
> 
>             _ = &mut cancel_rx => {
>                 break;
>             }
>             maybe_msg = rx.recv() => {
>                 match maybe_msg {
>                     Some(msg) => processed.push(format!("PROCESSED_{}", msg)),
>                     None => break,
>                 }
>             }
>         }
>     }
> 
>     processed
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[tokio::test]
>     async fn test_event_processor_loop() {
>         let (tx, rx) = mpsc::channel(10);
>         let (cancel_tx, cancel_rx) = oneshot::channel();
> 
>         tx.send("EVENT_1".into()).await.unwrap();
>         tx.send("EVENT_2".into()).await.unwrap();
> 
>         let handle = tokio::spawn(async move { run_event_processor(rx, cancel_rx).await });
> 
>         tokio::time::sleep(std::time::Duration::from_millis(10)).await;
>         let _ = cancel_tx.send(());
> 
> 
>         let res = handle.await.unwrap();
>         assert_eq!(res.len(), 2);
>         assert_eq!(res[0], "PROCESSED_EVENT_1");
>         assert_eq!(res[1], "PROCESSED_EVENT_2");
>     }
> }
> ```
> 
> #### Technical Explanation
>
> 1. **`tokio::select!` & `.await`**: `rx.recv()` returns a future. `.await`ing it inside `tokio::select!` yields control back to Tokio while awaiting messages.
> 
> ---
> 
## 6. Related Terms

- [`async` / `.await`](../level_09/async_await.md) — Related concept: `async` / `.await`.

---

## 7. Key Takeaways
> 
> - **`.await`** pauses the current async function until the `Future` yields its final result.
> - It is **non-blocking** — the host OS thread is released to work on other tasks while waiting!
> - It uses **postfix syntax** (`future.await`), enabling clean method chaining with `?` and `.map()`.
> - You can **only** use `.await` inside an `async fn` or `async` block.
> - Avoid `.await`ing futures sequentially if you want them to run concurrently (use `tokio::join!` instead!).
> 
