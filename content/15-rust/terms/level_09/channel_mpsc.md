# Channel (`mpsc`)

> **Level 9 — Concurrency & Parallelism**
> Multi-producer, single-consumer message passing: `std::sync::mpsc`.

---

## 1. Prerequisites


- [`std::thread::spawn`](std_thread_spawn.md) — The function used to spawn the threads that will send the messages.
- [`Send` Trait](send_trait.md) — The trait required to physically move data through the channel.
- [`Arc<Mutex<T>>`](arc_mutex_t.md) — The *other* way to do concurrency, which you should compare this to.

---

## 2. Term Category

**Message-Passing Concurrency**: `std::sync::mpsc` provides Multi-Producer, Single-Consumer channels for safe, lock-free inter-thread communication.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

> *"Do not communicate by sharing memory; instead, share memory by communicating."*

While `Arc<Mutex<T>>` provides thread-safe shared memory, it introduces software lock contention. When many threads attempt to lock a single mutex concurrently, threads waste time waiting in line.

Channels decouple worker threads completely. Multiple producer threads (`Sender<T>`) push owned values into a thread-safe queue without locking shared state, and a single consumer thread (`Receiver<T>`) processes incoming messages sequentially. Passing ownership of values across threads via channels eliminates data races by design.

### (2) Reality Metaphor

Bank tellers dropping deposits into a pneumatic tube:
- **Multi-Producers (`Sender`)**: 10 bank tellers working independently at separate desks. Each teller drops cash deposit envelopes into their pneumatic tube slot without leaving their desk.
- **Single-Consumer (`Receiver`)**: A single vault manager sitting in the back room catching incoming envelopes from the central pneumatic outlet and processing them one by one.

### (3) Rust Code Examples

#### Multi-Producer Task Dispatch to Single Consumer
```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    for i in 1..=3 {
        let tx_clone = tx.clone();
        thread::spawn(move || {
            let msg = format!("Worker {i} finished task!");
            tx_clone.send(msg).unwrap(); // Moves ownership of msg into channel!
        });
    }

    // CRITICAL: Drop original master `tx` so `rx` iterator terminates!
    drop(tx);

    for received in rx {
        println!("Received: {received}");
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to `drop(tx)` in the Main Thread, Causing Consumer Deadlocks

**The mistake:** Cloning `tx` for worker threads while leaving the original `tx` bound in the main thread during `rx` iteration.

**Why it is wrong:** `rx.recv()` or `for msg in rx` blocks indefinitely waiting for new messages because the channel remains open as long as any `Sender` instance exists.

*Incorrect:*
```rust
for i in 0..3 {
    let tx_clone = tx.clone();
    thread::spawn(move || { tx_clone.send(i).unwrap(); });
}
// ❌ Forgotten `drop(tx)`! Receiver blocks forever waiting for main thread's tx!
for val in rx { println!("{val}"); }
```

*Fix:*
```rust
drop(tx); // Drop master sender! Channel closes when all worker tx clones drop!
for val in rx { println!("{val}"); }
```

### Mistake 2: Attempting to Transmit Non-`Send` Types Across Channels

**The mistake:** Sending `Rc<T>` or `RefCell<T>` across an `mpsc` channel.

**Why it is wrong:** `mpsc::Sender::send` requires `T: Send`. Types with non-atomic reference counters (`Rc`) or unsynchronized interior mutability (`RefCell`) are `!Send`, triggering compiler error `E0277`.

*Incorrect:*
```rust
tx.send(Rc::new(42)); // ❌ Error: `Rc<i32>` cannot be sent between threads safely!
```

*Fix:*
```rust
tx.send(Arc::new(42)); // Correct: Arc implements Send!
```

### Mistake 3: Unwrapping `tx.send()` Without Handling Disconnected Receivers

**The mistake:** Calling `tx.send(val).unwrap()` when the receiving end may drop early.

**Why it is wrong:** If the `Receiver` is dropped or panics, `tx.send()` returns `Err(SendError(val))`. Calling `.unwrap()` panics the worker thread.

---

## 5. Practice Exercises

### Exercise 1: Bounded Telemetry Pipeline with Backpressure & Non-Blocking Fallbacks

**Scenario:** In high-throughput server infrastructure, unbounded channels can cause OOM errors if log producers generate entries faster than the log consumer can process them. Bounded channels (`mpsc::sync_channel(bound)`) enforce backpressure.

**Requirements:**
1. Define `LogEntry` with `severity`, `target`, `payload`, and `sequence_id`.
2. Implement `LogCollector` wrapping `SyncSender<LogEntry>` with `submit` and `try_submit`.
3. Implement `process_logs(rx: Receiver<LogEntry>) -> ProcessingStats`.
4. Write unit tests validating backpressure saturation, non-blocking `TrySendError::Full` handling, and log processing aggregation.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::sync::mpsc::{self, Receiver, SendError, SyncSender, TrySendError};
> use std::thread;
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub enum LogLevel {
>     Info,
>     Warning,
>     Error,
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct LogEntry {
>     pub severity: LogLevel,
>     pub target: String,
>     pub payload: String,
>     pub sequence_id: u64,
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum LogError {
>     Full(LogEntry),
>     Disconnected(LogEntry),
> }
> 
> pub struct LogCollector {
>     sender: SyncSender<LogEntry>,
> }
> 
> impl LogCollector {
>     pub fn new(sender: SyncSender<LogEntry>) -> Self {
>         Self { sender }
>     }
> 
>     pub fn submit(&self, entry: LogEntry) -> Result<(), SendError<LogEntry>> {
>         self.sender.send(entry)
>     }
> 
>     pub fn try_submit(&self, entry: LogEntry) -> Result<(), LogError> {
>         self.sender.try_send(entry).map_err(|err| match err {
>             TrySendError::Full(e) => LogError::Full(e),
>             TrySendError::Disconnected(e) => LogError::Disconnected(e),
>         })
>     }
> }
> 
> pub struct ProcessingStats {
>     pub total_processed: usize,
>     pub error_count: usize,
>     pub warning_count: usize,
> }
> 
> pub fn process_logs(rx: Receiver<LogEntry>) -> ProcessingStats {
>     let mut stats = ProcessingStats {
>         total_processed: 0,
>         error_count: 0,
>         warning_count: 0,
>     };
> 
>     for entry in rx {
>         stats.total_processed += 1;
>         match entry.severity {
>             LogLevel::Error => stats.error_count += 1,
>             LogLevel::Warning => stats.warning_count += 1,
>             LogLevel::Info => {}
>         }
>     }
> 
>     stats
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_backpressure_and_overflow() {
>         let (tx, rx) = mpsc::sync_channel::<LogEntry>(2);
>         let collector = LogCollector::new(tx);
> 
>         let entry1 = LogEntry {
>             severity: LogLevel::Info,
>             target: "auth".into(),
>             payload: "login success".into(),
>             sequence_id: 1,
>         };
>         let entry2 = LogEntry {
>             severity: LogLevel::Warning,
>             target: "db".into(),
>             payload: "high latency".into(),
>             sequence_id: 2,
>         };
>         let entry3 = LogEntry {
>             severity: LogLevel::Error,
>             target: "api".into(),
>             payload: "500 internal error".into(),
>             sequence_id: 3,
>         };
> 
>         assert!(collector.try_submit(entry1.clone()).is_ok());
>         assert!(collector.try_submit(entry2.clone()).is_ok());
> 
>         let result = collector.try_submit(entry3.clone());
>         assert!(matches!(result, Err(LogError::Full(_))));
> 
>         let received1 = rx.recv().unwrap();
>         assert_eq!(received1, entry1);
> 
>         assert!(collector.try_submit(entry3.clone()).is_ok());
>     }
> 
>     #[test]
>     fn test_multithreaded_log_aggregation() {
>         let (tx, rx) = mpsc::sync_channel::<LogEntry>(10);
>         let mut handles = vec![];
> 
>         for t_id in 0..4 {
>             let tx_clone = tx.clone();
>             let handle = thread::spawn(move || {
>                 let collector = LogCollector::new(tx_clone);
>                 for seq in 0..5 {
>                     let level = if seq % 2 == 0 { LogLevel::Info } else { LogLevel::Error };
>                     let entry = LogEntry {
>                         severity: level,
>                         target: format!("worker-{}", t_id),
>                         payload: format!("task step {}", seq),
>                         sequence_id: seq,
>                     };
>                     collector.submit(entry).unwrap();
>                 }
>             });
>             handles.push(handle);
>         }
> 
>         drop(tx);
> 
>         let stats = process_logs(rx);
> 
>         for h in handles {
>             h.join().unwrap();
>         }
> 
>         assert_eq!(stats.total_processed, 20);
>         assert_eq!(stats.error_count, 8);
>         assert_eq!(stats.warning_count, 0);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `mpsc::sync_channel(bound)` allocates fixed ring-buffer capacity to enforce backpressure.
> 2. `try_send` returns immediately with `TrySendError::Full` if capacity is reached without blocking caller threads.
> 3. `drop(tx)` closes the channel so the consumer loop (`for entry in rx`) terminates cleanly.

---

### Exercise 2: Multi-Stage Fan-Out / Fan-In Parallel ETL Pipeline Topology

**Scenario:** Data processing pipelines route items across processing stages: Extraction $\rightarrow$ Transformation $\rightarrow$ Aggregation. Standard `Receiver` is `!Clone`, requiring `Arc<Mutex<Receiver<T>>>` to distribute tasks across parallel transformer workers.

**Requirements:**
1. Define `RawRecord` and `ProcessedRecord`.
2. Implement Stage 1 (Producer), Stage 2 (Transformers sharing `Arc<Mutex<Receiver<RawRecord>>>`), and Stage 3 (Aggregator).
3. Return `PipelineSummary` containing dataset statistics.
4. Write unit tests validating pipeline correctness.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::sync::{mpsc, Arc, Mutex};
> use std::thread;
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct RawRecord {
>     pub id: u64,
>     pub raw_data: String,
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct ProcessedRecord {
>     pub id: u64,
>     pub checksum: u32,
>     pub is_valid: bool,
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct PipelineSummary {
>     pub total_records: usize,
>     pub valid_records: usize,
>     pub checksum_sum: u64,
> }
> 
> pub fn run_etl_pipeline(raw_inputs: Vec<RawRecord>, num_transformers: usize) -> PipelineSummary {
>     let (tx1, rx1) = mpsc::channel::<RawRecord>();
>     let (tx2, rx2) = mpsc::channel::<ProcessedRecord>();
> 
>     let producer_handle = thread::spawn(move || {
>         for record in raw_inputs {
>             tx1.send(record).unwrap();
>         }
>     });
> 
>     let rx1_shared = Arc::new(Mutex::new(rx1));
>     let mut transformer_handles = vec![];
> 
>     for _ in 0..num_transformers {
>         let rx1_clone = Arc::clone(&rx1_shared);
>         let tx2_clone = tx2.clone();
> 
>         let handle = thread::spawn(move || {
>             loop {
>                 let record_opt = {
>                     let rx_guard = rx1_clone.lock().unwrap();
>                     rx_guard.recv().ok()
>                 };
> 
>                 match record_opt {
>                     Some(record) => {
>                         let checksum: u32 = record.raw_data.bytes().map(|b| b as u32).sum();
>                         let is_valid = !record.raw_data.is_empty();
>                         let processed = ProcessedRecord {
>                             id: record.id,
>                             checksum,
>                             is_valid,
>                         };
>                         tx2_clone.send(processed).unwrap();
>                     }
>                     None => break,
>                 }
>             }
>         });
>         transformer_handles.push(handle);
>     }
> 
>     drop(tx2);
> 
>     let aggregator_handle = thread::spawn(move || {
>         let mut total_records = 0;
>         let mut valid_records = 0;
>         let mut checksum_sum = 0u64;
> 
>         for record in rx2 {
>             total_records += 1;
>             if record.is_valid {
>                 valid_records += 1;
>             }
>             checksum_sum += record.checksum as u64;
>         }
> 
>         PipelineSummary {
>             total_records,
>             valid_records,
>             checksum_sum,
>         }
>     });
> 
>     producer_handle.join().unwrap();
>     for h in transformer_handles {
>         h.join().unwrap();
>     }
>     aggregator_handle.join().unwrap()
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_etl_pipeline_execution() {
>         let inputs = vec![
>             RawRecord { id: 1, raw_data: "ALPHA".into() },
>             RawRecord { id: 2, raw_data: "BETA".into() },
>             RawRecord { id: 3, raw_data: "GAMMA".into() },
>             RawRecord { id: 4, raw_data: "".into() },
>         ];
> 
>         let summary = run_etl_pipeline(inputs, 3);
> 
>         assert_eq!(summary.total_records, 4);
>         assert_eq!(summary.valid_records, 3);
>         assert_eq!(summary.checksum_sum, 997);
>     }
> 
>     #[test]
>     fn test_empty_pipeline() {
>         let summary = run_etl_pipeline(vec![], 2);
>         assert_eq!(summary.total_records, 0);
>         assert_eq!(summary.valid_records, 0);
>         assert_eq!(summary.checksum_sum, 0);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `Arc<Mutex<Receiver<RawRecord>>>` shares a single `Receiver` across multiple parallel stage 2 worker threads.
> 2. Cascading channel shutdown propagates automatically as upstream senders complete and drop.
> 3. Stage 3 aggregates output records concurrently without shared state mutations.

---

### Exercise 3: Bidirectional Request-Response Protocol via Channel-in-Message Pattern

**Scenario:** In actor frameworks, client threads send request commands and await response values. Use the Channel-in-Message pattern by encapsulating a return channel (`mpsc::Sender<Response>`) inside the task payload message.

**Requirements:**
1. Define `TaskCommand` enum with response channel handles.
2. Implement `WorkerPool` with `execute_square`, `execute_concat`, and `shutdown`.
3. Write unit tests testing synchronous responses, concurrent requests, and clean worker thread teardown.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::sync::{mpsc, Arc, Mutex};
> use std::thread::{self, JoinHandle};
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum TaskResult {
>     Number(i64),
>     Text(String),
> }
> 
> pub enum TaskCommand {
>     Square {
>         number: i64,
>         respond_to: mpsc::Sender<TaskResult>,
>     },
>     Concat {
>         a: String,
>         b: String,
>         respond_to: mpsc::Sender<TaskResult>,
>     },
>     Shutdown,
> }
> 
> pub struct WorkerPool {
>     cmd_tx: mpsc::Sender<TaskCommand>,
>     workers: Vec<JoinHandle<()>>,
> }
> 
> impl WorkerPool {
>     pub fn new(num_workers: usize) -> Self {
>         let (cmd_tx, cmd_rx) = mpsc::channel::<TaskCommand>();
>         let cmd_rx_shared = Arc::new(Mutex::new(cmd_rx));
>         let mut workers = Vec::with_capacity(num_workers);
> 
>         for _ in 0..num_workers {
>             let rx_clone = Arc::clone(&cmd_rx_shared);
>             let handle = thread::spawn(move || loop {
>                 let cmd = {
>                     let rx_guard = rx_clone.lock().unwrap();
>                     rx_guard.recv().ok()
>                 };
> 
>                 match cmd {
>                     Some(TaskCommand::Square { number, respond_to }) => {
>                         let _ = respond_to.send(TaskResult::Number(number * number));
>                     }
>                     Some(TaskCommand::Concat { a, b, respond_to }) => {
>                         let _ = respond_to.send(TaskResult::Text(format!("{}{}", a, b)));
>                     }
>                     Some(TaskCommand::Shutdown) | None => break,
>                 }
>             });
>             workers.push(handle);
>         }
> 
>         Self { cmd_tx, workers }
>     }
> 
>     pub fn execute_square(&self, number: i64) -> Result<i64, &'static str> {
>         let (reply_tx, reply_rx) = mpsc::channel();
>         self.cmd_tx
>             .send(TaskCommand::Square {
>                 number,
>                 respond_to: reply_tx,
>             })
>             .map_err(|_| "Worker pool disconnected")?;
> 
>         match reply_rx.recv().map_err(|_| "Worker dropped response channel")? {
>             TaskResult::Number(res) => Ok(res),
>             _ => Err("Invalid response type"),
>         }
>     }
> 
>     pub fn execute_concat(&self, a: &str, b: &str) -> Result<String, &'static str> {
>         let (reply_tx, reply_rx) = mpsc::channel();
>         self.cmd_tx
>             .send(TaskCommand::Concat {
>                 a: a.to_string(),
>                 b: b.to_string(),
>                 respond_to: reply_tx,
>             })
>             .map_err(|_| "Worker pool disconnected")?;
> 
>         match reply_rx.recv().map_err(|_| "Worker dropped response channel")? {
>             TaskResult::Text(res) => Ok(res),
>             _ => Err("Invalid response type"),
>         }
>     }
> 
>     pub fn shutdown(mut self) {
>         for _ in 0..self.workers.len() {
>             let _ = self.cmd_tx.send(TaskCommand::Shutdown);
>         }
>         drop(self.cmd_tx);
> 
>         for worker in self.workers.drain(..) {
>             worker.join().unwrap();
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_worker_pool_dispatch() {
>         let pool = WorkerPool::new(4);
> 
>         let sq_res = pool.execute_square(12);
>         assert_eq!(sq_res, Ok(144));
> 
>         let concat_res = pool.execute_concat("Hello, ", "Rust!");
>         assert_eq!(concat_res, Ok("Hello, Rust!".to_string()));
> 
>         pool.shutdown();
>     }
> 
>     #[test]
>     fn test_concurrent_client_requests() {
>         let pool = Arc::new(WorkerPool::new(3));
>         let mut handles = vec![];
> 
>         for i in 1..=5 {
>             let pool_ref = Arc::clone(&pool);
>             let h = thread::spawn(move || {
>                 let val = pool_ref.execute_square(i).unwrap();
>                 assert_eq!(val, i * i);
>             });
>             handles.push(h);
>         }
> 
>         for h in handles {
>             h.join().unwrap();
>         }
> 
>         if let Ok(p) = Arc::try_unwrap(pool) {
>             p.shutdown();
>         }
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Channel-in-message pattern encapsulates response `Sender` instances inside command payloads for bi-directional RPC messaging.
> 2. Each request creates an isolated oneshot reply channel `(reply_tx, reply_rx)`.
> 3. `WorkerPool::shutdown` terminates worker threads cleanly by sending shutdown commands and joining handles.

---

## 6. Related Terms


- [`std::thread::spawn`](std_thread_spawn.md) — The function used to spawn the Producers.
- [`Arc<Mutex<T>>`](arc_mutex_t.md) — The alternative approach to concurrency (sharing memory instead of passing messages).
- [`VecDeque<T>`](../level_02/vecdeque_t.md) — Related concept: `VecDeque<T>`.
- [`Condvar` & `Barrier`](condvar_barrier.md) — Related concept: `Condvar` & `Barrier`.
- [Channels (`mpsc`, `oneshot`)](channels_mpsc_oneshot.md) — Related concept: Channels (`mpsc`, `oneshot`).

---

## 7. Key Takeaways

- A **Channel** is a one-way communication tube between threads.
- `mpsc` stands for **Multi-Producer, Single-Consumer**.
- `mpsc::channel()` returns a tuple: **`(tx, rx)`** (Transmitter and Receiver).
- You can `.clone()` the `tx` to give it to multiple threads. You *cannot* clone the `rx`.
- Sending a message `.send(data)` **moves** ownership of the data into the channel (requiring the `Send` trait).
- The channel only closes when *every single copy* of `tx` has been dropped!
