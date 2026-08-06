# Channels (`mpsc`, `oneshot`)

> **Level 9 — Concurrency & Parallelism**
> Message-passing primitives for safe inter-thread communication: `std::sync::mpsc` provides multi-producer, single-consumer channels; `tokio::sync::oneshot` sends a single value.

---

## 1. Prerequisites

- [Channel (`mpsc`)](channel_mpsc.md) — MPSC channels.

---

## 2. Term Category



**Rust Concurrency Pattern (message passing communication channels)**: Multi-producer single-consumer (`mpsc`) and single-producer single-consumer oneshot (`oneshot`) channels for thread synchronization.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Sharing mutable state across concurrent threads using mutexes introduces lock contention, complex lock ordering deadlocks, and race conditions.

Following Erlang and Go concurrency philosophy ("Do not communicate by sharing memory; share memory by communicating"), `mpsc` channels allow multiple sender producers (`Sender<T>`) to transmit data to a single receiver consumer (`Receiver<T>`). `oneshot` channels transmit a single value for one-time task completion signaling.

### (2) Reality Metaphor

A postal mail drop-box outside an office building: multiple workers drop envelopes into the slot (`mpsc` producers), while a single mail carrier collects all letters at the bottom (`mpsc` consumer).

### (3) Rust Code Examples

#### Short Snippet
```rust
use std::sync::mpsc;

let (tx, rx) = mpsc::channel();
tx.send(42).unwrap();
assert_eq!(rx.recv().unwrap(), 42);
```

#### Multi-Worker Execution Pipeline
```rust
use std::sync::mpsc;
use std::thread;

pub fn run_worker_pipeline() -> u32 {
    let (tx, rx) = mpsc::channel();
    for i in 1..=3 {
        let tx_clone = tx.clone();
        thread::spawn(move || {
            tx_clone.send(i * 10).unwrap();
        });
    }
    drop(tx); // Drop original sender so receiver loop terminates
    let mut total = 0;
    while let Ok(val) = rx.recv() {
        total += val;
    }
    total
}

fn main() {
    assert_eq!(run_worker_pipeline(), 60);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to Drop Original `Sender` in Worker Channel Loops

**The mistake:** Cloning `tx` for worker threads while leaving the original `tx` bound in the main thread during `rx.recv()` iteration.

**Why it is wrong:** `rx.recv()` blocks indefinitely waiting for items because the channel remains open as long as any `Sender` exists.

*Incorrect:*
```rust
for i in 0..3 { let tx_c = tx.clone(); ... } while let Ok(v) = rx.recv() {} // Deadlock!
```

*Fix:*
```rust
drop(tx); // Drop original tx so rx.recv() closes when all workers finish!
```

### Mistake 2: Sending Non-`Send` Types Across Channels

**The mistake:** Attempting to transmit `Rc<T>` or `RefCell<T>` across channels to another thread.

**Why it is wrong:** Rust requires types sent across thread boundaries to implement `Send`. `Rc<T>` uses non-atomic reference counting, causing compilation errors.

*Incorrect:*
```rust
tx.send(Rc::new(5)); // Error: Rc is not Send!
```

*Fix:*
```rust
tx.send(Arc::new(5)); // Use Arc or owned values!
```

### Mistake 3: Unwrapping `send()` Without Handling Disconnected Receivers

**The mistake:** Calling `tx.send(val).unwrap()` when the receiving end may have dropped.

**Why it is wrong:** If `rx` is dropped, `.send()` returns `Err(SendError)`, causing an unhandled panic.

*Incorrect:*
```rust
tx.send(data).unwrap();
```

*Fix:*
```rust
if let Err(e) = tx.send(data) { println!("Receiver disconnected: {e}"); }
```

---

## 5. Practice Exercises

### Exercise 1: Concurrent Web Crawler Pipeline using `mpsc` Channels

**Scenario:** Build a concurrent URL downloader pipeline where 3 worker threads download URLs and send byte sizes back to a single aggregator receiver using `mpsc`.

**Requirements:**
1. Create `mpsc::channel()`.
2. Spawn 3 worker threads using `tx.clone()`.
3. Send URL sizes to receiver.
4. Test total size aggregation.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::sync::mpsc;
> use std::thread;
> 
> pub struct UrlTask {
>     pub url: String,
>     pub payload_size: usize,
> }
> 
> pub fn aggregate_download_sizes(tasks: Vec<UrlTask>) -> usize {
>     let (tx, rx) = mpsc::channel();
> 
>     for task in tasks {
>         let tx_clone = tx.clone();
>         thread::spawn(move || {
>             // Simulate download task
>             tx_clone.send(task.payload_size).unwrap();
>         });
>     }
>     drop(tx); // Drop master sender
> 
>     let mut total_bytes = 0;
>     while let Ok(size) = rx.recv() {
>         total_bytes += size;
>     }
>     total_bytes
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_mpsc_crawler_pipeline() {
>         let tasks = vec![
>             UrlTask { url: "a.com".into(), payload_size: 100 },
>             UrlTask { url: "b.com".into(), payload_size: 200 },
>             UrlTask { url: "c.com".into(), payload_size: 300 },
>         ];
>         assert_eq!(aggregate_download_sizes(tasks), 600);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Multiple threads produce metrics into cloned `tx` senders.
> 2. Single receiver `rx` collects all metrics safely without mutex locks.
> 3. Dropping master `tx` ensures channel iteration closes when worker threads complete.
> 
---

### Exercise 2: Single-Shot Oneshot Task Completion Signal Simulator

**Scenario:** Implement a single-shot task completion notifier using `mpsc` bounded channel of size 1.

**Requirements:**
1. Create bounded channel `mpsc::sync_channel(1)`.
2. Signal completion.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::sync::mpsc;
> use std::thread;
> 
> pub fn execute_with_oneshot_signal() -> String {
>     let (tx, rx) = mpsc::sync_channel(1);
>     thread::spawn(move || {
>         // Perform background work
>         tx.send("SUCCESS").unwrap();
>     });
>     rx.recv().unwrap().to_string()
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_oneshot_signal() {
>         assert_eq!(execute_with_oneshot_signal(), "SUCCESS");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Bounded sync channels act as light oneshot notification triggers.
> 2. `rx.recv()` blocks execution until background thread finishes work and sends a response.
> 3. Ensures thread-safe single-value synchronization.
> 
---

### Exercise 3: Bounded Queue Producer Backpressure Test

**Scenario:** Demonstrate backpressure using `mpsc::sync_channel(CAPACITY)`.

**Requirements:**
1. Create sync channel with capacity 2.
2. Verify blocking on overflow.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::sync::mpsc;
> 
> pub fn test_backpressure() -> bool {
>     let (tx, rx) = mpsc::sync_channel(2);
>     tx.send(1).unwrap();
>     tx.send(2).unwrap();
>     let try_3 = tx.try_send(3);
>     let is_full = try_3.is_err();
>     let _ = rx.recv();
>     is_full
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_bounded_channel() {
>         assert!(test_backpressure());
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Bounded channels block senders when full, providing memory backpressure.
> 2. `try_send` returns an error immediately when buffer capacity is reached.
> 3. Prevents producer memory consumption from overwhelming system resources.
> 
---

## 5. Related Terms

- [Channel (`mpsc`)](channel_mpsc.md) — Standard MPSC channel.

---

## 7. Key Takeaways

- `mpsc` allows Multiple Producers to send data to a Single Consumer.
- Share memory by communicating instead of locking shared state.
- Drop the master `tx` sender so `rx.recv()` terminates cleanly.
- Transmitted types must implement `Send`.
