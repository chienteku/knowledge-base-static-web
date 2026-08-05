# Async Closures

> **Level 10 — Async / Await**
> Closures that return a `Future` or use `async` blocks internally.

---

## 1. Prerequisites


- [Closure](../level_06/closure.md) — Standard synchronous closures in Rust.
- [`async fn`](async_fn.md) — Asynchronous functions.
- [`Future` Trait](future_trait.md) — The return type of async closure calls.

---

## 2. Term Category

**Rust Language Syntax (the async lambda)**: Standard closures in Rust take inputs and return values immediately (`|x| x + 1`). 

An **Async Closure** is a closure that returns a `Future` (e.g., `|x| async move { x + 1 }` or using experimental `async |x| { x + 1 }` syntax). They allow passing asynchronous callbacks into higher-order functions like iterators, stream adapters, or HTTP route handlers.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In modern async Rust, higher-order functions (like `.filter()`, `.map()`, or custom HTTP middleware frameworks) frequently need to execute asynchronous operations inside callbacks.

For example, when processing a list of User IDs:
- A synchronous closure `|id| fetch_user(id)` would block the thread!
- You want an async closure `|id| async move { fetch_user(id).await }` so the callback yields control back to Tokio!

### (2) Lifetime Complexity — "Why is it tricky?"

Standard closures borrow data for the duration of the function call (`fn(&T) -> U`). 

Async closures are trickier because they return a `Future` state machine. The returned `Future` might live long after the closure function call itself has returned! If the closure borrowed data from its environment, Rust must ensure the borrowed references inside the returned `Future` remain valid until the `Future` is actually `.await`ed.

### (3) Rust Code Examples

#### Short Snippet (Async Closure with `async move`)
The standard, fully-stable way to write async closures in Rust today is returning an `async move` block from a standard closure.

```rust
#[tokio::main]
async fn main() {
    // An async closure returning an `async move` block
    let fetch_data = |id: u32| async move {
        // Simulating async work
        tokio::time::sleep(std::time::Duration::from_millis(10)).await;
        format!("User #{}", id)
    };

    // Calling the closure creates a Future, which we then .await!
    let result = fetch_data(42).await;
    println!("{}", result);
}
```

#### Fuller Example (Passing Async Closures to Stream Pipeline)
Passing async closures into stream processing methods like `StreamExt::then`.

```rust
use futures::stream::{self, StreamExt};
use tokio::time::{sleep, Duration};

async fn process_order(id: u32) -> String {
    sleep(Duration::from_millis(50)).await;
    format!("Order #{} Processed", id)
}

#[tokio::main]
async fn main() {
    let order_ids = stream::iter(vec![101, 102, 103]);

    // We pass an async closure into .then() to process stream items concurrently!
    let mut processed_stream = order_ids.then(|id| async move {
        process_order(id).await
    });

    while let Some(status) = processed_stream.next().await {
        println!("{}", status);
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Async Closures Scoping and Lifecycle Rules

**The mistake:** Assuming Async Closures instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("async_closures_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("async_closures_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Async Closures State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Async Closures through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Async Closures Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Async Closures instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Resilient Async Retry Middleware with Exponential Backoff

**Scenario**: Higher-order middleware functions in web frameworks accept async closures to wrap business logic with cross-cutting concerns like retries or logging. Construct a generic function `with_async_retry` that accepts an async closure `F: FnMut() -> Fut` and executes exponential backoff retries upon failure.

Build a higher-order async closure retry runner.

**Requirements**:
1. Implement `with_async_retry<F, Fut, T, E>(mut op: F, max_retries: usize, initial_backoff: Duration) -> Result<T, E>` where `F: FnMut() -> Fut`, `Fut: Future<Output = Result<T, E>>`.
2. Apply exponential backoff between retries.
3. Add unit tests asserting success on first try, recovery after transient failure, and failure after max retries.

> [!check]- Answer
> ```rust
> use std::future::Future;
> use std::time::Duration;
> use tokio::time::sleep;
> 
> pub async fn with_async_retry<F, Fut, T, E>(
>     mut op: F,
>     max_retries: usize,
>     initial_backoff: Duration,
> ) -> Result<T, E>
> where
>     F: FnMut() -> Fut,
>     Fut: Future<Output = Result<T, E>>,
> {
>     let mut backoff = initial_backoff;
>     let mut attempts = 0;
> 
>     loop {
>         attempts += 1;
>         match op().await {
>             Ok(val) => return Ok(val),
>             Err(err) => {
>                 if attempts >= max_retries {
>                     return Err(err);
>                 }
>                 sleep(backoff).await;
>                 backoff *= 2;
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
>     async fn test_async_closure_retry_success() {
>         let mut count = 0;
>         let closure = || async {
>             count += 1;
>             if count == 2 {
>                 Ok::<_, &'static str>("SUCCESS")
>             } else {
>                 Err("TRANSIENT")
>             }
>         };
> 
>         let res = with_async_retry(closure, 3, Duration::from_millis(5)).await;
>         assert_eq!(res, Ok("SUCCESS"));
>     }
> }
> ```
> 
> **Step-by-Step Explanation**:
> 1. **Higher-Order Async Closures**: Specifying bound `F: FnMut() -> Fut` where `Fut: Future` allows passing closures returning `async move` blocks directly.
> 2. **Evaluation via `.await`**: Calling `op().await` executes the returned future on each retry iteration.
> 
> ---
> 
> ### Exercise 2: Bounded Concurrent Stream Mapper Preserving Order

**Scenario**: Processing large data batches requires mapping elements using an async closure while bounding concurrent execution using `Arc<tokio::sync::Semaphore>` and preserving original element order.

Construct a concurrent stream mapper accepting an async closure.

**Requirements**:
1. Implement `concurrent_map<T, R, F, Fut>(items: Vec<T>, concurrency: usize, mapper: F) -> Vec<R>` where `F: Fn(T) -> Fut + Send + Sync + 'static`, `Fut: Future<Output = R> + Send + 'static`, `T: Send + 'static`, `R: Send + 'static`.
2. Order output matching input `Vec<T>`.
3. Add unit tests asserting order preservation and concurrency bounding.

> [!check]- Answer
> ```rust
> use std::future::Future;
> use std::sync::Arc;
> use tokio::sync::Semaphore;
> 
> pub async fn concurrent_map<T, R, F, Fut>(
>     items: Vec<T>,
>     concurrency: usize,
>     mapper: F,
> ) -> Vec<R>
> where
>     T: Send + 'static,
>     R: Send + 'static,
>     F: Fn(T) -> Fut + Send + Sync + 'static,
>     Fut: Future<Output = R> + Send + 'static,
> {
>     let semaphore = Arc::new(Semaphore::new(concurrency));
>     let mapper = Arc::new(mapper);
>     let mut handles = Vec::new();
> 
>     for (idx, item) in items.into_iter().enumerate() {
>         let sem = Arc::clone(&semaphore);
>         let map_fn = Arc::clone(&mapper);
>         let handle = tokio::spawn(async move {
>             let _permit = sem.acquire_owned().await.unwrap();
>             let res = map_fn(item).await;
>             (idx, res)
>         });
>         handles.push(handle);
>     }
> 
>     let mut indexed_results = Vec::new();
>     for handle in handles {
>         indexed_results.push(handle.await.unwrap());
>     }
> 
>     indexed_results.sort_by_key(|(idx, _)| *idx);
>     indexed_results.into_iter().map(|(_, res)| res).collect()
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[tokio::test]
>     async fn test_concurrent_map_order_preservation() {
>         let inputs = vec![10, 20, 30];
>         let closure = |x: u64| async move {
>             tokio::time::sleep(std::time::Duration::from_millis(50 - x)).await;
>             x * 2
>         };
> 
>         let results = concurrent_map(inputs, 2, closure).await;
>         assert_eq!(results, vec![20, 40, 60]);
>     }
> }
> ```
> 
> **Step-by-Step Explanation**:
> 1. **Thread-Safe Async Closures**: `Arc<F>` allows sharing the async closure `F` safely across multiple `tokio::spawn` tasks.
> 2. **Index Sorting**: Enclosing `(idx, res)` tuple pairs ensures sorting restores original order regardless of completion order.
> 
> ---
> 
> ### Exercise 3: Dynamic Async Event Router with Trait Objects and Timeout Enforcement

**Scenario**: Event routers map string event names to dynamic async closure handlers using trait objects `Box<dyn Fn(String) -> Pin<Box<dyn Future<Output = String> + Send>> + Send + Sync>`.

Build a dynamic async event router with timeout enforcement.

**Requirements**:
1. Implement `AsyncEventRouter` mapping event keys to boxed async handlers.
2. Implement `register_handler` and `dispatch_event(&self, event: &str, payload: String, timeout_duration: Duration)`.
3. Add unit tests asserting handler dispatch and timeout triggers.

> [!check]- Answer
> ```rust
> use std::collections::HashMap;
> use std::future::Future;
> use std::pin::Pin;
> use std::time::Duration;
> use tokio::time::timeout;
> 
> type AsyncHandler = Box<
>     dyn Fn(String) -> Pin<Box<dyn Future<Output = String> + Send>> + Send + Sync,
> >;
> 
> #[derive(Default)]
> pub struct AsyncEventRouter {
>     handlers: HashMap<String, AsyncHandler>,
> }
> 
> impl AsyncEventRouter {
>     pub fn new() -> Self {
>         Self::default()
>     }
> 
>     pub fn register_handler<F, Fut>(&mut self, event: &str, handler: F)
>     where
>         F: Fn(String) -> Fut + Send + Sync + 'static,
>         Fut: Future<Output = String> + Send + 'static,
>     {
>         let boxed_handler = Box::new(move |payload: String| {
>             let fut = handler(payload);
>             Box::pin(fut) as Pin<Box<dyn Future<Output = String> + Send>>
>         });
>         self.handlers.insert(event.to_string(), boxed_handler);
>     }
> 
>     pub async fn dispatch_event(
>         &self,
>         event: &str,
>         payload: String,
>         timeout_duration: Duration,
>     ) -> Result<String, &'static str> {
>         let handler = self.handlers.get(event).ok_or("HANDLER_NOT_FOUND")?;
>         let fut = handler(payload);
>         match timeout(timeout_duration, fut).await {
>             Ok(res) => Ok(res),
>             Err(_) => Err("HANDLER_TIMEOUT"),
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[tokio::test]
>     async fn test_async_event_router_dispatch() {
>         let mut router = AsyncEventRouter::new();
>         router.register_handler("USER_LOGIN", |payload| async move {
>             format!("HANDLED_{}", payload)
>         });
> 
>         let res = router
>             .dispatch_event("USER_LOGIN", "alice".into(), Duration::from_millis(50))
>             .await;
>         assert_eq!(res, Ok("HANDLED_alice".to_string()));
>     }
> }
> ```
> 
> **Step-by-Step Explanation**:
> 1. **Trait Object Erasure**: `Pin<Box<dyn Future<Output = String> + Send>>` erases specific concrete future types generated by async closures, storing handlers inside `HashMap`.
> 
> ---
> 
## 6. Related Terms

- None!

---

## 7. Key Takeaways
> 
> - **Async Closures** are closures that return a `Future` or use `async move` blocks internally.
> - They allow passing asynchronous callbacks into higher-order functions like stream combinators and route handlers.
> - The standard, fully-stable way to write them is `|args| async move { ... }`.
> - Use `F: Fn(T) -> Fut` where `Fut: Future` bounds when taking async closures as generic function parameters.
> - Use `Pin<Box<dyn Future<Output = T> + Send>>` trait objects when storing async closures inside dynamic collections.
> 
