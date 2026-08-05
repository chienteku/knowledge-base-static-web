# `Waker` and `Context`

> **Level 10 — Rust**
> `std::task::Waker` and `std::task::Context` — the core signalling mechanism async tasks use to notify an executor that a paused `Future` is ready to be polled again.

---

## 1. Prerequisites

- [`Future` Trait](future_trait.md) — The Future trait.

---

## 2. Term Category

**Asynchronous Runtime**: `std::task::Waker` and `Context` for notifying executors when asynchronous tasks become ready.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Asynchronous futures (`Future::poll`) return `Poll::Pending` when I/O operations are not ready. If executors constantly polled futures in a busy-wait loop, CPU usage would spike to 100%.

`Waker` is a thread-safe handle that signals the async runtime executor when an I/O resource becomes ready. `Context` wraps the `&Waker` reference passed to `Future::poll()`. When I/O events complete, hardware or reactor threads call `waker.wake()`, prompting the executor to re-poll that specific task.

### (2) Reality Metaphor

An airport boarding gate waiting area: instead of passengers lining up and asking the gate agent every 10 seconds if the plane is ready (`busy polling`), passengers sit down and wait until the loudspeaker announcement calls their group (`waker.wake()`).

### (3) Rust Code Examples

#### Short Snippet
```rust
use std::task::{Context, Poll, Waker};
let waker = Waker::noop();
let mut cx = Context::from_waker(&waker);
```

#### Fuller Example
```rust
use std::future::Future;
use std::pin::Pin;
use std::task::{Context, Poll, Waker};

pub struct ReadyFuture(pub i32);

impl Future for ReadyFuture {
    type Output = i32;
    fn poll(self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<Self::Output> {
        Poll::Ready(self.0)
    }
}

fn main() {
    let waker = Waker::noop();
    let mut cx = Context::from_waker(&waker);
    let mut fut = ReadyFuture(42);
    let mut pinned = Pin::new(&mut fut);
    assert_eq!(pinned.poll(&mut cx), Poll::Ready(42));
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to Clone and Save the `Waker` in `Poll::Pending` Futures

**The mistake:** Returning `Poll::Pending` from a custom `Future::poll` without calling `cx.waker().clone()` and saving it for the I/O event thread.

**Why it is wrong:** The executor puts the task to sleep and will *never* poll the future again because no `Waker` was saved to notify it. The task deadlocks permanently.

*Incorrect:*
```rust
fn poll(...) -> Poll<()> { Poll::Pending } // Saved no Waker! Task frozen forever!
```

*Fix:*
```rust
fn poll(..., cx: &mut Context) -> Poll<()> { self.waker = Some(cx.waker().clone()); Poll::Pending }
```

### Mistake 2: Calling `waker.wake()` Inside the Busy Polling Loop

**The mistake:** Calling `waker.wake()` synchronously inside `Future::poll` before returning `Poll::Pending`.

**Why it is wrong:** Triggers an infinite spinning CPU loop where the executor immediately re-polls the future without any actual delay.

*Incorrect:*
```rust
fn poll(...) { cx.waker().wake_by_ref(); return Poll::Pending; } // Busy spin loop!
```

*Fix:*
```rust
Call waker.wake() asynchronously from an I/O completion event thread!
```

### Mistake 3: Reusing Stale `Waker` Handles Across Multiple Polls

**The mistake:** Saving the `Waker` from the first `poll()` call and ignoring updated `Waker` instances in subsequent `poll()` calls.

**Why it is wrong:** Tasks may be moved between different executor worker threads; using a stale Waker notifies the wrong executor queue.

*Incorrect:*
```rust
if self.waker.is_none() { self.waker = Some(cx.waker().clone()); }
```

*Fix:*
```rust
Always update saved wakers: self.waker = Some(cx.waker().clone());
```

---

## 5. Practice Exercises

### Exercise 1: Custom Timer Future with Waker Signal

**Scenario:** Build a custom asynchronous timer future `TimerFuture` that returns `Poll::Pending` on first poll, spawns a thread to sleep, and calls `waker.wake()` upon timer expiration.

**Requirements:**
1. Define `TimerFuture` struct holding `shared_state: Arc<Mutex<State>>`.
1. Implement `Future` for `TimerFuture`.
1. In `poll()`, if not ready, save `cx.waker().clone()` and spawn timer thread.
1. Timer thread sleeps and calls `waker.wake()`.
1. Write unit test.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::future::Future;
> use std::pin::Pin;
> use std::sync::{Arc, Mutex};
> use std::task::{Context, Poll, Waker};
> use std::thread;
> use std::time::Duration;
> 
> pub struct SharedState {
>     pub completed: bool,
>     pub waker: Option<Waker>,
> }
> 
> pub struct TimerFuture {
>     shared_state: Arc<Mutex<SharedState>>,
> }
> 
> impl TimerFuture {
>     pub fn new(duration: Duration) -> Self {
>         let shared_state = Arc::new(Mutex::new(SharedState {
>             completed: false,
>             waker: None,
>         }));
> 
>         let thread_state = shared_state.clone();
>         thread::spawn(move || {
>             thread::sleep(duration);
>             let mut guard = thread_state.lock().unwrap();
>             guard.completed = true;
>             if let Some(waker) = guard.waker.take() {
>                 waker.wake();
>             }
>         });
> 
>         Self { shared_state }
>     }
> }
> 
> impl Future for TimerFuture {
>     type Output = &'static str;
> 
>     fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
>         let mut guard = self.shared_state.lock().unwrap();
>         if guard.completed {
>             Poll::Ready("Timer Expired")
>         } else {
>             guard.waker = Some(cx.waker().clone());
>             Poll::Pending
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_timer_future_waker() {
>         let mut timer = TimerFuture::new(Duration::from_millis(10));
>         let waker = Waker::noop();
>         let mut cx = Context::from_waker(&waker);
> 
>         let mut pinned = Pin::new(&mut timer);
>         assert_eq!(pinned.as_mut().poll(&mut cx), Poll::Pending);
> 
>         std::thread::sleep(Duration::from_millis(20));
>         assert_eq!(pinned.as_mut().poll(&mut cx), Poll::Ready("Timer Expired"));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Demonstrates `Waker` lifecycle: saving `cx.waker().clone()` when returning `Poll::Pending`.
> 2. Timer thread invokes `waker.wake()` to notify the executor.

---

### Exercise 2: Mock Signal Waker Trigger

**Scenario:** Build a manual event signal `SignalFuture` woken by an external `fire()` call.

**Requirements:**
1. Implement `SignalFuture`.
1. Call `fire()` and verify `Poll::Ready`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::future::Future;
> use std::pin::Pin;
> use std::sync::{Arc, Mutex};
> use std::task::{Context, Poll, Waker};
> 
> pub struct SignalState {
>     pub fired: bool,
>     pub waker: Option<Waker>,
> }
> 
> pub struct SignalFuture {
>     pub state: Arc<Mutex<SignalState>>,
> }
> 
> impl SignalFuture {
>     pub fn new() -> (Self, Arc<Mutex<SignalState>>) {
>         let state = Arc::new(Mutex::new(SignalState { fired: false, waker: None }));
>         (Self { state: state.clone() }, state)
>     }
> }
> 
> impl Future for SignalFuture {
>     type Output = u32;
>     fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
>         let mut guard = self.state.lock().unwrap();
>         if guard.fired {
>             Poll::Ready(100)
>         } else {
>             guard.waker = Some(cx.waker().clone());
>             Poll::Pending
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_signal_waker() {
>         let (mut fut, state) = SignalFuture::new();
>         let waker = Waker::noop();
>         let mut cx = Context::from_waker(&waker);
>         let mut pinned = Pin::new(&mut fut);
> 
>         assert_eq!(pinned.as_mut().poll(&mut cx), Poll::Pending);
> 
>         {
>             let mut guard = state.lock().unwrap();
>             guard.fired = true;
>             if let Some(w) = guard.waker.take() {
>                 w.wake();
>             }
>         }
> 
>         assert_eq!(pinned.as_mut().poll(&mut cx), Poll::Ready(100));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Demonstrates event-driven asynchronous reactor notification pattern.

---

### Exercise 3: Noop Waker Context Test Runner Helper

**Scenario:** Demonstrate constructing synchronous contexts using `Waker::noop()`.

**Requirements:**
1. Create `Context` from `Waker::noop()`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::task::{Context, Waker};
> 
> pub fn create_test_context<'a>(waker: &'a Waker) -> Context<'a> {
>     Context::from_waker(waker)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_noop_context() {
>         let waker = Waker::noop();
>         let cx = create_test_context(&waker);
>         assert!(cx.waker().will_wake(&waker));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `Waker::noop()` provides non-allocating test wakers for polling futures.

---

## 5. Related Terms

- [`Future` Trait](future_trait.md) — Polling futures via Waker.
- [Executor / Runtime](executor_runtime.md) — Task executors.

---

## 7. Key Takeaways

- `Waker` notifies async runtime executors when tasks are ready for polling.
- `Context` wraps the `&Waker` passed to `Future::poll()`.
- Always clone and save `cx.waker()` when returning `Poll::Pending`.
- Call `waker.wake()` from reactor or I/O completion threads to wake sleeping tasks.
