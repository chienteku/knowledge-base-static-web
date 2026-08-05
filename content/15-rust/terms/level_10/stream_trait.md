# `stream_trait.md` (Stream Trait)

> **Level 10 — Async / Await**
> An asynchronous iterator that yields a sequence of values over time.

---

## 1. Prerequisites


- [The `Iterator` Trait](../level_05/iterator_trait.md) — The synchronous equivalent of `Stream`.
- [`Future` Trait](future_trait.md) — Yields a *single* value asynchronously; `Stream` yields *multiple* values asynchronously.
- [`async fn`](async_fn.md) — Asynchronous functions used alongside streams.

---

## 2. Term Category

**Rust Standard Trait (the async iterator)**: In Rust, a standard `Iterator` produces a series of items synchronously (blocking until each item is ready). A **`Stream`** is an asynchronous iterator. 

Instead of blocking the thread while waiting for the next item (e.g. waiting for incoming TCP packets or database rows), a `Stream` yields control back to the Tokio Runtime until the next item is ready to be processed.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Imagine you are receiving a continuous stream of events from a WebSocket server, or reading a 10GB log file line-by-line over a network connection. 

- You cannot use `Future`, because a `Future` can only resolve **once** to a single value.
- You cannot use standard `Iterator`, because `.next()` is synchronous and would freeze your entire thread while waiting for network packets.

`Stream` bridges this gap. It defines an asynchronous `.poll_next()` method that yields `Poll::Ready(Some(value))` when an item arrives, `Poll::Pending` when waiting, or `Poll::Ready(None)` when the stream ends.

### (2) Reality Metaphor

Imagine a conveyor belt in a factory.

- **`Iterator` (Synchronous)**: The conveyor belt is cranked by hand. You stand at the belt. If the next item isn't there yet, you stand completely frozen until someone places an item on the belt.
- **`Stream` (Asynchronous)**: An automated sensor alerts you whenever a new box arrives on the belt (`Poll::Ready`). While the belt is empty (`Poll::Pending`), you turn around and assemble other products until the sensor beeps again!

### (3) Rust Code Examples

#### Short Snippet (Consuming a Stream with `StreamExt`)
Using the `futures::stream::StreamExt` trait, you can consume streams using familiar methods like `.next()`, `.map()`, and `.filter()`.

```rust
use futures::stream::{self, StreamExt};

#[tokio::main]
async fn main() {
    // Create a stream from a vector
    let mut stream = stream::iter(vec![1, 2, 3, 4, 5]);

    // Consuming items asynchronously using .next().await!
    while let Some(value) = stream.next().await {
        println!("Received stream item: {}", value);
    }
}
```

#### Fuller Example (Building a Continuous Interval Stream)
Here is how you process real-time events arriving over time using Tokio's built-in interval streams.

```rust
use tokio::time::{interval, Duration};
use tokio_stream::wrappers::IntervalStream;
use futures::stream::StreamExt;

#[tokio::main]
async fn main() {
    // Create a timer stream that yields a tick every 500 milliseconds
    let mut ticker = IntervalStream::new(interval(Duration::from_millis(500)));

    let mut count = 0;
    
    // Process 3 ticks asynchronously
    while let Some(_instant) = ticker.next().await {
        count += 1;
        println!("Tick #{}", count);

        if count >= 3 {
            break; // Stop listening to stream
        }
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Stream Trait Scoping and Lifecycle Rules

**The mistake:** Assuming Stream Trait instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("stream_trait_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("stream_trait_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Stream Trait State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Stream Trait through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Stream Trait Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Stream Trait instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Manual `Stream` Trait Implementation — Async Rate-Limited Telemetry Ticker

**Scenario**: Low-level networking frameworks often require custom stream types implemented directly against `futures_core::stream::Stream`. A rate-limited telemetry ticker produces sequential readings up to a maximum count, pausing asynchronously between ticks and waking the task via `cx.waker().wake_by_ref()` when pending.

Implement a custom `TelemetryTicker` struct manually implementing `Stream`.

**Requirements**:
1. Define `TelemetryTicker` holding `current: usize`, `max: usize`, and `yielded_pending: bool`.
2. Implement `futures_core::stream::Stream` yielding `usize`.
3. In `poll_next`, if `yielded_pending` is false, set it to true, call `cx.waker().wake_by_ref()`, and return `Poll::Pending`. If true, reset it to false, increment `current`, and return `Poll::Ready(Some(current))`. Return `Poll::Ready(None)` when `current > max`.
4. Add unit tests asserting item sequence and stream termination.

> [!check]- Answer
> ```rust
> use futures_core::stream::Stream;
> use std::pin::Pin;
> use std::task::{Context, Poll};
> 
> pub struct TelemetryTicker {
>     current: usize,
>     max: usize,
>     yielded_pending: bool,
> }
> 
> impl TelemetryTicker {
>     pub fn new(max: usize) -> Self {
>         Self {
>             current: 0,
>             max,
>             yielded_pending: false,
>         }
>     }
> }
> 
> impl Stream for TelemetryTicker {
>     type Item = usize;
> 
>     fn poll_next(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Option<Self::Item>> {
>         if self.current >= self.max {
>             return Poll::Ready(None);
>         }
> 
>         if !self.yielded_pending {
>             self.yielded_pending = true;
>             cx.waker().wake_by_ref();
>             Poll::Pending
>         } else {
>             self.yielded_pending = false;
>             self.current += 1;
>             Poll::Ready(Some(self.current))
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
>     use futures_util::stream::StreamExt;
> 
>     #[tokio::test]
>     async fn test_telemetry_ticker_stream() {
>         let mut ticker = TelemetryTicker::new(3);
>         let mut results = Vec::new();
> 
>         while let Some(val) = ticker.next().await {
>             results.push(val);
>         }
> 
>         assert_eq!(results, vec![1, 2, 3]);
>     }
> }
> ```
> 
> **Step-by-Step Explanation**:
> 1. **Manual `Stream` Trait Implementation**: `futures_core::stream::Stream` requires `poll_next(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Option<Self::Item>>`.
> 2. **Waker Notification**: Returning `Poll::Pending` requires registering/notifying a `Waker` (`cx.waker().wake_by_ref()`) so the executor reschedules `poll_next`.
> 
> ---
> 
> ### Exercise 2: Async Log Stream Aggregation & Batching Pipeline with Cancellation Safety

**Scenario**: Real-time log monitoring pipelines parse continuous streams of log lines. The stream pipeline must filter entries by severity level (e.g. `ERROR` or `WARN`), group them into fixed-size batches using `StreamExt::chunks`, and handle shutdown signals cancellation-safely.

Build an async stream pipeline for log parsing and chunking.

**Requirements**:
1. Define `LogEntry` with `level: String` and `message: String`.
2. Write `async fn process_log_stream<S>(stream: S, batch_size: usize) -> Vec<Vec<LogEntry>>` where `S: Stream<Item = LogEntry> + Unpin`.
3. Filter entries retaining only `"ERROR"` or `"WARN"`, then chunk into batches of `batch_size`.
4. Add unit tests asserting filtering and chunking accuracy.

> [!check]- Answer
> ```rust
> use futures_util::stream::{Stream, StreamExt};
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct LogEntry {
>     pub level: String,
>     pub message: String,
> }
> 
> pub async fn process_log_stream<S>(
>     stream: S,
>     batch_size: usize,
> ) -> Vec<Vec<LogEntry>>
> where
>     S: Stream<Item = LogEntry> + Unpin,
> {
>     stream
>         .filter(|entry| {
>             let keep = entry.level == "ERROR" || entry.level == "WARN";
>             async move { keep }
>         })
>         .chunks(batch_size)
>         .collect()
>         .await
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
>     use futures_util::stream;
> 
>     #[tokio::test]
>     async fn test_process_log_stream_filtering_and_chunking() {
>         let logs = vec![
>             LogEntry { level: "INFO".into(), message: "started".into() },
>             LogEntry { level: "WARN".into(), message: "high memory".into() },
>             LogEntry { level: "ERROR".into(), message: "disk full".into() },
>             LogEntry { level: "DEBUG".into(), message: "trace".into() },
>             LogEntry { level: "ERROR".into(), message: "oom".into() },
>         ];

> 
>         let stream = stream::iter(logs);
>         let batches = process_log_stream(stream, 2).await;
> 
>         assert_eq!(batches.len(), 2);
>         assert_eq!(batches[0].len(), 2);
>         assert_eq!(batches[0][0].message, "high memory");
>         assert_eq!(batches[0][1].message, "disk full");
>         assert_eq!(batches[1].len(), 1);
>         assert_eq!(batches[1][0].message, "oom");
>     }
> }
> ```
> 
> **Step-by-Step Explanation**:
> 1. **Stream Combinators**: `.filter()` filters items asynchronously, while `.chunks(batch_size)` groups items into `Vec<T>` chunks.
> 2. **`StreamExt::collect`**: `.collect().await` asynchronously waits for stream completion, gathering batches into `Vec<Vec<LogEntry>>`.
> 
> ---
> 
> ### Exercise 3: Custom Stream Adapter — Async Deduplicating Stream Combinator

**Scenario**: High-frequency financial ticker streams produce rapid repeated price entries. A custom stream adapter `DeduplicateStream<St>` wraps an underlying stream and drops consecutive duplicate items before yielding to callers.

Construct a custom stream combinator adapter implementing `Stream`.

**Requirements**:
1. Define `DeduplicateStream<St, T>` holding `stream: St` and `last_item: Option<T>`.
2. Implement `Stream` for `DeduplicateStream<St, T>` where `St: Stream<Item = T> + Unpin`, `T: PartialEq + Clone`.
3. In `poll_next`, loop polling `stream.poll_next()`. Skip items equal to `last_item`.
4. Add unit tests asserting deduplication of consecutive duplicate values.

> [!check]- Answer
> ```rust
> use futures_core::stream::Stream;
> use std::pin::Pin;
> use std::task::{Context, Poll};
> 
> pub struct DeduplicateStream<St, T> {
>     stream: St,
>     last_item: Option<T>,
> }
> 
> impl<St, T> DeduplicateStream<St, T> {
>     pub fn new(stream: St) -> Self {
>         Self {
>             stream,
>             last_item: None,
>         }
>     }
> }
> 
> impl<St, T> Stream for DeduplicateStream<St, T>
> where
>     St: Stream<Item = T> + Unpin,
>     T: PartialEq + Clone,
> {
>     type Item = T;
> 
>     fn poll_next(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Option<Self::Item>> {
>         loop {
>             match Pin::new(&mut self.stream).poll_next(cx) {
>                 Poll::Ready(Some(item)) => {
>                     if let Some(ref last) = self.last_item {
>                         if last == &item {
>                             continue; // Skip duplicate item, loop to poll next
>                         }
>                     }
>                     self.last_item = Some(item.clone());
>                     return Poll::Ready(Some(item));
>                 }
>                 Poll::Ready(None) => return Poll::Ready(None),
>                 Poll::Pending => return Poll::Pending,
>             }
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
>     use futures_util::stream::{self, StreamExt};
> 
>     #[tokio::test]
>     async fn test_deduplicate_stream() {
>         let raw_stream = stream::iter(vec![10, 10, 20, 20, 20, 30, 10]);
>         let mut dedup_stream = DeduplicateStream::new(raw_stream);
> 
>         let mut results = Vec::new();
>         while let Some(val) = dedup_stream.next().await {
>             results.push(val);
>         }
> 
>         assert_eq!(results, vec![10, 20, 30, 10]);
>     }
> }
> ```
> 
> **Step-by-Step Explanation**:
> 1. **Stream Adapter Pattern**: `DeduplicateStream` wraps inner stream `St` and intercepts `poll_next` calls.
> 2. **Stateful Filtering**: Maintaining `last_item: Option<T>` enables comparing incoming values and looping to poll the next item when duplicates occur.
> 
> ---
> 
## 6. Related Terms

- None!

---

## 7. Key Takeaways
> 
> - A **`Stream`** is an asynchronous iterator.
> - Unlike `Future` (which yields 1 result), a `Stream` yields **multiple values over time**.
> - Unlike `Iterator` (which blocks the thread), a `Stream` **yields control to Tokio** when waiting for the next item.
> - Import **`futures::stream::StreamExt`** to get access to `.next().await`, `.map()`, `.filter()`, and `.collect()`.
> - Perfect for WebSockets, TCP packet streams, database cursor streams, and periodic timer ticks.
> 
