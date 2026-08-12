# `Future` Trait

> **Level 10 — Async / Await**
> The fundamental trait behind every async computation in Rust.

---

## 1. Prerequisites


- [`async fn`](async_fn.md) — The syntax that generates types implementing `Future`.
- [Trait](../level_04/trait.md) — The general concept of defining shared behavior in Rust.
- [`pin!`, `Pin<T>`, and `Unpin`](pin_t.md) — The memory guarantee that keeps futures from moving.

---

## 2. Term Category

**Rust Core Interface (the state machine)**: Underneath the hood, every single `async fn`, `async` block, and timer in Rust is just a struct that implements a single core trait: **`std::future::Future`**.

A `Future` represents an asynchronous computation that may not have finished yet. It is physically a **State Machine** that is continuously polled by an executor until it returns a final result.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In JavaScript, Promises are managed by the V8 C++ engine runtime. In Go, Goroutines are managed by a hidden Go runtime scheduler. 

Rust wanted to be usable on bare-metal microcontrollers where no runtime exists! Therefore, Rust designed **`Future`** as a pure, zero-cost abstraction trait defined in `core::future::Future`. 

It has a single method: `poll()`.
- If the computation is done, it returns `Poll::Ready(output)`.
- If the computation is still waiting (e.g., waiting for network I/O), it returns `Poll::Pending` and saves a `Waker` notification callback!

### (2) Reality Metaphor

Imagine waiting for your order at a fast-food restaurant.

- **`Future`**: Your receipt with an Order Number (e.g. Order #42). Holding the receipt doesn't mean you have the food yet; it represents *future food*.
- **`poll()`**: You walking up to the counter and asking: *"Is Order #42 ready?"*
  - **`Poll::Pending`**: The clerk says *"Not yet!"* You hand the clerk your phone number (`Waker`) and go sit down.
  - **`Poll::Ready(Burger)`**: The clerk hands you the burger! The future is complete!

### (3) Rust Code Examples

#### Short Snippet (The Trait Definition)
Here is the literal definition of the `Future` trait in Rust's standard library:

```rust
use std::pin::Pin;
use std::task::{Context, Poll};

pub trait Future {
    // The type of the value produced when the future completes!
    type Output;

    // Driven forward by the Executor
    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output>;
}
```

#### Fuller Example (Building a Custom `Future` from Scratch)
Let's build a custom `Future` struct manually without using `async fn`! It will yield `Poll::Pending` twice, and then return `Poll::Ready(100)` on the 3rd attempt.

```rust
use std::future::Future;
use std::pin::Pin;
use std::task::{Context, Poll};

// Our custom state machine struct
struct CounterFuture {
    count: u32,
}

impl Future for CounterFuture {
    type Output = u32;

    fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        self.count += 1;

        if self.count >= 3 {
            println!("Count reached 3! Returning Ready.");
            Poll::Ready(100)
        } else {
            println!("Count is {}... Returning Pending.", self.count);
            
            // Tell the executor to wake us up again immediately so we get polled again!
            cx.waker().wake_by_ref();
            
            Poll::Pending
        }
    }
}

#[tokio::main]
async fn main() {
    let my_future = CounterFuture { count: 0 };

    // We can .await our manually constructed Future state machine!
    let result = my_future.await;
    
    println!("Final Result: {}", result); // 100
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Future Trait Scoping and Lifecycle Rules

**The mistake:** Assuming Future Trait instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("future_trait_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("future_trait_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Future Trait State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Future Trait through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Future Trait Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Future Trait instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Polled Exponential Backoff Retry `Future` (`RetryFuture`)

**Scenario:** Low-level networking crates often implement custom `Future` state machines to handle retries without allocating extra futures on the heap. Implement a custom `RetryFuture<F>` struct that wraps a fallible closure/operation, tracks remaining attempts, registers wakers when pending, and executes backoff retries manually inside `poll()`.

**Requirements:**
Build a manual `Future` implementation for retry logic.

**Requirements**:
1. Implement `RetryFuture<F, T, E>` holding state parameters `max_retries: usize`, `attempts: usize`, and inner function `F: FnMut() -> Result<T, E>`.
2. Implement `Future` returning `Poll::Ready(Ok(T))` or `Poll::Ready(Err(E))` after exhausting retries.
3. In `poll`, if the inner operation returns `Err` and `attempts < max_retries`, increment `attempts`, call `cx.waker().wake_by_ref()`, and return `Poll::Pending`.
4. Add unit tests verifying instant success, success after $K$ attempts, and error return upon retry exhaustion.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::future::Future;
> use std::pin::Pin;
> use std::task::{Context, Poll};
> 
> pub struct RetryFuture<F, T, E> {
>     op: F,
>     max_retries: usize,
>     attempts: usize,
> }
> 
> impl<F, T, E> RetryFuture<F, T, E> {
>     pub fn new(max_retries: usize, op: F) -> Self {
>         Self {
>             op,
>             max_retries,
>             attempts: 0,
>         }
>     }
> }
> 
> impl<F, T, E> Future for RetryFuture<F, T, E>
> where
>     F: FnMut() -> Result<T, E> + Unpin,
> {
>     type Output = Result<T, E>;
> 
>     fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
>         self.attempts += 1;
>         match (self.op)() {
>             Ok(val) => Poll::Ready(Ok(val)),
>             Err(err) => {
>                 if self.attempts >= self.max_retries {
>                     Poll::Ready(Err(err))
>                 } else {
>                     cx.waker().wake_by_ref();
>                     Poll::Pending
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
>     #[tokio::test]
>     async fn test_retry_future_success() {
>         let mut count = 0;
>         let retry_fut = RetryFuture::new(3, move || {
>             count += 1;
>             if count == 2 {
>                 Ok("SUCCESS")
>             } else {
>                 Err("TRANSIENT_ERR")
>             }
>         });
> 
>         let res = retry_fut.await;
>         assert_eq!(res, Ok("SUCCESS"));
>     }
> 
>     #[tokio::test]
>     async fn test_retry_future_exhaustion() {
>         let retry_fut = RetryFuture::new(2, || Err::<(), _>("PERMANENT_ERR"));
>         let res = retry_fut.await;
>         assert_eq!(res, Err("PERMANENT_ERR"));
>     }
> }
> ```
> 
> #### Technical Explanation
>
> 1. **Manual `Future` Mechanics**: Implementing `Future` directly requires defining `type Output` and writing the `poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output>` state machine loop.
> 2. **Waker Notification**: When returning `Poll::Pending`, calling `cx.waker().wake_by_ref()` informs Tokio's executor to reschedule the future for polling again.
> 
> ---
> 
> ### Exercise 2: Shared Single-Execution Asynchronous Cell (`AsyncOnceCell`)
> 
> **Scenario**: Database connection pools or configuration loaders use an `AsyncOnceCell<T>` to ensure an expensive initialization future runs only once. If multiple caller tasks `.await` the cell concurrently while initialization is in progress, all callers register their `Waker`s and receive the initialized result once complete.
> 
> Construct a shared single-execution cell using manual `Future` waker registration.
> 
> **Requirements**:
> 1. Define `AsyncOnceCell<T>` with shared `Arc<Mutex<CellState<T>>>`.
> 2. `CellState<T>` contains `value: Option<T>`, `wakers: Vec<Waker>`, and `is_initializing: bool`.
> 3. Implement `get_or_init<F>(&self, init: F)` returning a custom `OnceCellFuture<T>`.
> 4. Add unit tests asserting single initialization execution across multiple concurrent task callers.
> 
> [!check]- Answer
> ```rust
> use std::future::Future;
> use std::pin::Pin;
> use std::sync::{Arc, Mutex};
> use std::task::{Context, Poll, Waker};
> 
> struct CellState<T> {
>     value: Option<T>,
>     wakers: Vec<Waker>,
> }
> 
> pub struct AsyncOnceCell<T> {
>     state: Arc<Mutex<CellState<T>>>,
> }
> 
> impl<T: Clone> AsyncOnceCell<T> {
>     pub fn new() -> Self {
>         Self {
>             state: Arc::new(Mutex::new(CellState {
>                 value: None,
>                 wakers: Vec::new(),
>             })),
>         }
>     }
> 
>     pub fn set(&self, val: T) {
>         let mut guard = self.state.lock().unwrap();
>         guard.value = Some(val);
>         for waker in guard.wakers.drain(..) {
>             waker.wake();
>         }
>     }
> 
>     pub fn get(&self) -> OnceCellFuture<T> {
>         OnceCellFuture {
>             state: Arc::clone(&self.state),
>         }
>     }
> }
> 
> pub struct OnceCellFuture<T> {
>     state: Arc<Mutex<CellState<T>>>,
> }
> 
> impl<T: Clone> Future for OnceCellFuture<T> {
>     type Output = T;
> 
>     fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
>         let mut guard = self.state.lock().unwrap();
>         if let Some(ref val) = guard.value {
>             Poll::Ready(val.clone())
>         } else {
>             guard.wakers.push(cx.waker().clone());
>             Poll::Pending
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
>     use std::time::Duration;
> 
>     #[tokio::test]
>     async fn test_async_once_cell_multi_waiter() {
>         let cell = Arc::new(AsyncOnceCell::<String>::new());
>         let cell1 = Arc::clone(&cell);
>         let cell2 = Arc::clone(&cell);
> 
>         let h1 = tokio::spawn(async move { cell1.get().await });
>         let h2 = tokio::spawn(async move { cell2.get().await });
> 
>         tokio::time::sleep(Duration::from_millis(10)).await;
>         cell.set("CONFIG_DATA".into());
> 
>         assert_eq!(h1.await.unwrap(), "CONFIG_DATA");
>         assert_eq!(h2.await.unwrap(), "CONFIG_DATA");
>     }
> }
> ```
> 
> #### Technical Explanation
>
> 1. **Multi-Waiter Waker Tracking**: `CellState` maintains `wakers: Vec<Waker>`. Concurrent callers polling `OnceCellFuture` push their wakers into the list when data is pending.
> 2. **Fan-Out Waker Notification**: Calling `cell.set(val)` pops all stored wakers via `guard.wakers.drain(..)` and invokes `.wake()` on each, unblocking all `.await`ing tasks simultaneously.
> 
> ---
> 
> ### Exercise 3: Custom Cancellation-Safe `Select2` Combinator with Safe Pinned Projection
> 
> **Scenario**: `tokio::select!` races two futures. To understand its internal mechanics, build a custom zero-allocation `Select2<F1, F2>` combinator implementing `Future`.
> 
> Construct a manual `Select2` combinator with pinned projection.
> 
> **Requirements**:
> 1. Implement `Select2<F1, F2>` struct holding `fut1: F1` and `fut2: F2`.
> 2. Implement `Future` returning `Poll::Ready(Either<F1::Output, F2::Output>)`.
> 3. Perform structural pin projection using `unsafe { Pin::new_unchecked(...) }`.
> 4. Add unit tests asserting branch winning behavior and cancellation of the losing future.
> 
> [!check]- Answer
> ```rust
> use std::future::Future;
> use std::pin::Pin;
> use std::task::{Context, Poll};
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum Either<A, B> {
>     Left(A),
>     Right(B),
> }
> 
> pub struct Select2<F1, F2> {
>     fut1: F1,
>     fut2: F2,
> }
> 
> impl<F1, F2> Select2<F1, F2> {
>     pub fn new(fut1: F1, fut2: F2) -> Self {
>         Self { fut1, fut2 }
>     }
> }
> 
> impl<F1: Future, F2: Future> Future for Select2<F1, F2> {
>     type Output = Either<F1::Output, F2::Output>;
> 
>     fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
>         // SAFETY: Structural pin projection for fut1 and fut2
>         let (p1, p2) = unsafe {
>             let this = self.get_unchecked_mut();
>             (
>                 Pin::new_unchecked(&mut this.fut1),
>                 Pin::new_unchecked(&mut this.fut2),
>             )
>         };
> 
>         if let Poll::Ready(out1) = p1.poll(cx) {
>             return Poll::Ready(Either::Left(out1));
>         }
> 
>         if let Poll::Ready(out2) = p2.poll(cx) {
>             return Poll::Ready(Either::Right(out2));
>         }
> 
>         Poll::Pending
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
>     use std::time::Duration;
> 
>     #[tokio::test]
>     async fn test_select2_left_wins() {
>         let f1 = async {
>             tokio::time::sleep(Duration::from_millis(5)).await;
>             "LEFT_WIN"
>         };
>         let f2 = async {
>             tokio::time::sleep(Duration::from_millis(100)).await;
>             "RIGHT_WIN"
>         };
> 
>         let res = Select2::new(f1, f2).await;
>         assert_eq!(res, Either::Left("LEFT_WIN"));
>     }
> }
> ```
> 
> #### Technical Explanation
>
> 1. **Structural Pin Projection**: `Select2` projects `Pin<&mut Select2<F1, F2>>` into `Pin<&mut F1>` and `Pin<&mut F2>`.
> 2. **First-Completion Resolution**: Polling both projected futures inside `poll` returns `Poll::Ready(Either::Left)` or `Poll::Ready(Either::Right)` for whichever future completes first.
> 
> ---
> 
## 6. Related Terms

- [`pin!`, `Pin<T>`, and `Unpin`](pin_t.md) — Related concept: `pin!`, `Pin<T>`, and `Unpin`.
- [Generators / Coroutines (Unstable)](../level_19/generators_coroutines.md) — Related concept: Generators Coroutines.
- [`Waker` and `Context`](waker_context.md) — Related concept: `Waker` and `Context`.

---

## 7. Key Takeaways
> 
> - Every `async` computation in Rust is a struct implementing **`std::future::Future`**.
> - A `Future` is a zero-cost **State Machine** — it contains no background threads or hidden runtime cost!
> - The core method is **`poll()`**, which returns `Poll::Ready(value)` or `Poll::Pending`.
> - It is **lazy**; it does nothing until polled by an **Executor** (like Tokio).
> - When `Poll::Pending` is returned, the Future saves a **`Waker`** callback so Tokio knows when to wake it up again.
> 
