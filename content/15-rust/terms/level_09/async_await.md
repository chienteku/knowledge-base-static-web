# `async` / `.await`

> **Level 9 — Rust**
> Rust's zero-cost async abstraction: `async fn` and `async` blocks produce `Future`s, while `.await` suspends execution until the future resolves, driven by an executor like Tokio.

---

## 1. Prerequisites

- [`async fn`](../level_10/async_fn.md) — Async functions.

---

## 2. Term Category



**Rust Asynchronous Feature (cooperative task execution syntax)**: `async` and `.await` syntax construct zero-cost, cooperative asynchronous state machines (`Future`s) in Rust.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Synchronous I/O operations (reading network sockets, waiting for database queries) block executing OS threads, requiring thousands of heavy OS threads for high-concurrency applications.

Rust's `async`/`.await` transforms asynchronous functions into lightweight cooperative state machines (`Future`s). When an `async` function encounters a `.await` yield point, it suspends execution and returns control to an asynchronous runtime executor (such as Tokio or `async-executor`) without blocking the underlying OS thread, enabling thousands of concurrent connections on a single OS thread.

### (2) Reality Metaphor

A restaurant waiter serving 20 dining tables: after taking an order at Table 1 and handing it to the kitchen, the waiter does not stand idle in front of the kitchen waiting for food to cook; they immediately walk to Table 2 to take orders (`.await` yield). When food for Table 1 is ready, the kitchen notifies the waiter (waker notification), who resumes serving Table 1.

### (3) Rust Code Examples

#### Basic Async Execution Pipeline
```rust
pub async fn compute_async_val(x: u32) -> u32 {
    x * 2
}

pub async fn async_pipeline() -> u32 {
    let val1 = compute_async_val(10).await;
    let val2 = compute_async_val(20).await;
    val1 + val2
}

fn block_on<F: std::future::Future>(mut fut: F) -> F::Output {
    use std::task::{Context, Poll, Waker};
    let waker = Waker::noop();
    let mut cx = Context::from_waker(&waker);
    let mut pin_fut = unsafe { std::pin::Pin::new_unchecked(&mut fut) };
    match pin_fut.as_mut().poll(&mut cx) {
        Poll::Ready(res) => res,
        Poll::Pending => panic!("Future pending in sync runner"),
    }
}

fn main() {
    let result = block_on(async_pipeline());
    assert_eq!(result, 60);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Invoking Synchronous Blocking I/O Inside `async` Tasks

**The mistake:** Invoking `std::thread::sleep` or `std::fs::read` inside async execution tasks.

**Why it is wrong:** Blocks the async runtime OS worker thread, preventing all other cooperative async tasks scheduled on that thread from making progress.

*Incorrect:*
```rust
async fn work() {
    std::thread::sleep(std::time::Duration::from_secs(1)); // ❌ Blocks worker thread!
}
```

*Fix:*
```rust
async fn work() {
    tokio::time::sleep(std::time::Duration::from_secs(1)).await; // Non-blocking yield!
}
```

### Mistake 2: Calling an `async fn` Without Appending `.await`

**The mistake:** Invoking an `async fn` without appending `.await` to the call site.

**Why it is wrong:** In Rust, calling an `async fn` constructs a lazy `Future` state machine but does **not** execute it. The function body never runs unless polled or `.await`ed.

*Incorrect:*
```rust
fetch_data(); // ❌ Warning: unused Future! Code never executed!
```

*Fix:*
```rust
fetch_data().await; // Correct: awaits execution to completion!
```

### Mistake 3: Holding Non-`Send` Mutex Guards Across `.await` Yield Points

**The mistake:** Holding a standard `std::sync::MutexGuard` across an `.await` yield point.

**Why it is wrong:** Causes compilation error `Future is not Send` because tasks moving between multi-threaded executor threads cannot hold non-`Send` guard references across suspension points.

*Incorrect:*
```rust
let guard = std_mutex.lock().unwrap();
fetch_remote_data().await; // ❌ Error: MutexGuard held across await!
```

*Fix:*
```rust
{
    let guard = std_mutex.lock().unwrap();
    // mutate data
} // Drop guard before await!
fetch_remote_data().await;
```

---

## 5. Practice Exercises

### Exercise 1: Asynchronous HTTP Response Combinator Pipeline

**Scenario:** Build an asynchronous data processing pipeline combining results from multiple async tasks using `.await`.

**Requirements:**
1. Define `async fn fetch_user_id(name: &str) -> u64`.
2. Define `async fn fetch_user_balance(id: u64) -> u64`.
3. Combine balance results in `async fn get_total_balance`.
4. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub async fn fetch_user_id(name: &str) -> u64 {
>     if name == "Alice" { 101 } else { 102 }
> }
> 
> pub async fn fetch_user_balance(id: u64) -> u64 {
>     if id == 101 { 500 } else { 250 }
> }
> 
> pub async fn get_total_balance(user1: &str, user2: &str) -> u64 {
>     let id1 = fetch_user_id(user1).await;
>     let id2 = fetch_user_id(user2).await;
>     let b1 = fetch_user_balance(id1).await;
>     let b2 = fetch_user_balance(id2).await;
>     b1 + b2
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     fn block_on_test<F: std::future::Future>(mut fut: F) -> F::Output {
>         use std::task::{Context, Poll, Waker};
>         let waker = Waker::noop();
>         let mut cx = Context::from_waker(&waker);
>         let mut pin_fut = unsafe { std::pin::Pin::new_unchecked(&mut fut) };
>         match pin_fut.as_mut().poll(&mut cx) {
>             Poll::Ready(res) => res,
>             Poll::Pending => panic!("Pending in sync test runner"),
>         }
>     }
> 
>     #[test]
>     fn test_async_pipeline() {
>         let total = block_on_test(get_total_balance("Alice", "Bob"));
>         assert_eq!(total, 750);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Async functions return lazy futures evaluated sequentially via `.await`.
> 2. `.await` yields control back to the executor without blocking OS threads.
> 3. Pipelines combine multiple async data fetches cleanly.

---

### Exercise 2: Async Retry Wrapper Mechanism

**Scenario:** Build an async retry helper function `async_retry` re-evaluating an async task up to N times on error.

**Requirements:**
1. Implement `async fn async_retry<F, Fut, T, E>(mut f: F, max_retries: usize)`.
2. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub async fn async_retry<F, Fut, T, E>(f: F, max_retries: usize) -> Result<T, E>
> where
>     F: Fn() -> Fut,
>     Fut: std::future::Future<Output = Result<T, E>>,
> {
>     let mut attempts = 0;
>     loop {
>         match f().await {
>             Ok(val) => return Ok(val),
>             Err(err) => {
>                 attempts += 1;
>                 if attempts >= max_retries {
>                     return Err(err);
>                 }
>             }
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     fn block_on_test<F: std::future::Future>(mut fut: F) -> F::Output {
>         use std::task::{Context, Poll, Waker};
>         let waker = Waker::noop();
>         let mut cx = Context::from_waker(&waker);
>         let mut pin_fut = unsafe { std::pin::Pin::new_unchecked(&mut fut) };
>         match pin_fut.as_mut().poll(&mut cx) {
>             Poll::Ready(res) => res,
>             Poll::Pending => panic!("Pending"),
>         }
>     }
> 
>     #[test]
>     fn test_async_retry_success() {
>         let res = block_on_test(async_retry(|| async { Ok::<i32, ()>(42) }, 3));
>         assert_eq!(res, Ok(42));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Higher-order async functions accept closure factories returning `Future` instances.
> 2. `.await` evaluates each attempt asynchronously inside a retry loop.
> 3. Errors are returned after exhausting `max_retries`.

---

### Exercise 3: Async Task Identity and Polling Verification

**Scenario:** Validate cooperative yield state machine execution.

**Requirements:**
1. Implement `async fn async_identity`.
2. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub async fn async_identity(val: i32) -> i32 {
>     val
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     fn block_on_test<F: std::future::Future>(mut fut: F) -> F::Output {
>         use std::task::{Context, Poll, Waker};
>         let waker = Waker::noop();
>         let mut cx = Context::from_waker(&waker);
>         let mut pin_fut = unsafe { std::pin::Pin::new_unchecked(&mut fut) };
>         match pin_fut.as_mut().poll(&mut cx) {
>             Poll::Ready(res) => res,
>             Poll::Pending => panic!("Pending"),
>         }
>     }
> 
>     #[test]
>     fn test_async_identity() {
>         assert_eq!(block_on_test(async_identity(100)), 100);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Tests fundamental `Future` polling mechanics using standard `Waker::noop`.
> 2. Demonstrates zero-cost `Future` state machine generation.

---

## 5. Related Terms

- [`async fn`](../level_10/async_fn.md) — Async fn declarations.
- [`.await`](../level_10/await.md) — Await syntax.

---

## 7. Key Takeaways

- `async` functions transform code into state machines returning `Future`.
- `.await` yields execution back to the runtime executor until the future is ready.
- Do not invoke blocking synchronous functions (`std::thread::sleep`) inside async tasks.
- Async futures are lazy and perform zero work until polled or `.await`ed.
