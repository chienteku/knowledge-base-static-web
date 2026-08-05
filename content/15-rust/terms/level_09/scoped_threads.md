# Scoped Threads (`std::thread::scope`)

> **Level 9 — Concurrency & Parallelism**
> Threads guaranteed to finish before the enclosing scope exits, letting them safely borrow non-`'static` stack data.

---

## 1. Prerequisites


- [`std::thread::spawn`](std_thread_spawn.md) — The unscoped thread-creation function this feature extends.
- [`'static` Lifetime](../level_05/static_lifetime.md) — The requirement scoped threads specifically relax.
- [`Arc<T>`](../level_03/arc_t.md) — The workaround scoped threads often let you avoid entirely.

---

## 2. Term Category

**Concurrency API (the borrow-friendly thread spawner)**: `std::thread::scope` creates a block where threads spawned inside are **guaranteed by the compiler** to be joined (finished) before the block ends. This guarantee is what lets those threads borrow local stack data directly, something ordinary `thread::spawn` cannot allow.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

`std::thread::spawn` requires its closure to be `'static` — meaning it can only capture owned data or `'static` references, never a borrow of a local stack variable. This restriction exists because a spawned thread's *lifetime is unbounded* from the compiler's point of view: it might still be running long after the function that spawned it has returned and its stack variables have been destroyed, which would leave the thread holding a dangling reference. The common workaround — wrapping data in `Arc<T>` — works, but forces an allocation and a runtime reference count even when the data was always going to outlive every spawned thread anyway (e.g. a `for` loop that spawns threads and then immediately waits for all of them). `std::thread::scope` fixes this at the type-system level: because the API's design *guarantees* every thread spawned inside the scope is joined before the scope function returns, the compiler can soundly allow those threads to borrow data from the *enclosing* stack frame — no `'static` bound, no `Arc`, no allocation required.

### (2) Reality Metaphor

Imagine sending several employees out to run quick errands, but you know for certain none of them can leave the building until they all check back in with you.

- **`thread::spawn` (unscoped)**: An employee (**the thread**) is sent out with instructions to potentially work indefinitely, with no promise of when — or if — they'll be back before you leave the building yourself. Because of that uncertainty, you can't hand them anything that only exists inside your own desk (**a stack borrow**) — you'd have to give them a durable, personal copy of everything they need (**owned/`'static` data**), in case your desk is cleared out before they return.
- **`thread::scope` (scoped)**: You gather several employees for errands, but this time everyone has signed a binding agreement: nobody leaves the building until **everyone** has reported back to you, and you personally won't walk out that door until they have. Because that guarantee is airtight, you can now safely hand them documents straight off your own desk (**borrow local stack data**) — you know with certainty your desk won't be cleared while they're still out.

### (3) Rust Code Examples

#### Short Snippet (Borrowing Local Data Without `Arc`)
```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5]; // A plain, NON-'static local variable.

    std::thread::scope(|s| {
        s.spawn(|| {
            let sum: i32 = numbers.iter().sum(); // Directly borrows `numbers` — no Arc!
            println!("sum: {sum}");
        });
        s.spawn(|| {
            println!("max: {:?}", numbers.iter().max()); // Also borrows `numbers`.
        });
    }); // <- `scope` blocks here until BOTH threads finish; only then can `numbers` drop.

    println!("numbers still usable here: {numbers:?}");
}
```

#### Fuller Example (Splitting Work Across a Slice)
```rust
fn parallel_sum(data: &[i32], num_chunks: usize) -> i32 {
    let chunk_size = data.len().div_ceil(num_chunks);
    let mut total = 0;

    std::thread::scope(|s| {
        let handles: Vec<_> = data
            .chunks(chunk_size)
            .map(|chunk| s.spawn(move || chunk.iter().sum::<i32>())) // Borrows a slice of `data`.
            .collect();

        for handle in handles {
            total += handle.join().unwrap();
        }
    });

    total
}

fn main() {
    let data: Vec<i32> = (1..=100).collect();
    println!("{}", parallel_sum(&data, 4)); // 5050
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Scoped Threads Scoping and Lifecycle Rules

**The mistake:** Assuming Scoped Threads instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("scoped_threads_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("scoped_threads_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Scoped Threads State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Scoped Threads through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Scoped Threads Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Scoped Threads instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: In-Place Parallel Image Brightness Processing with Stack Chunking

**Problem:** A real-time image processing subsystem receives a raw mutable pixel buffer (`&mut [u8]`) residing on the caller's stack frame. To minimize latency and avoid heap allocations (such as `Vec` allocations or `Arc` reference counting), write a thread-safe function `parallel_adjust_brightness(pixels: &mut [u8], factor: i16, num_threads: usize) -> Vec<ChunkStats>` that partitions the mutable slice into non-overlapping chunks using `chunks_mut` and processes each chunk concurrently inside a `std::thread::scope`. 

Each scoped thread must iterate over its assigned chunk, apply the brightness offset to each pixel with saturation clamping (`0..=255`), and collect per-chunk statistics (`ChunkStats { min_val, max_val, pixels_processed }`). Return the collected statistics from all join handles.

> [!check]- Answer
> ```rust
> use std::thread;
> 
> #[derive(Debug, PartialEq, Eq, Clone, Copy)]
> pub struct ChunkStats {
>     pub min_val: u8,
>     pub max_val: u8,
>     pub pixels_processed: usize,
> }
> 
> pub fn parallel_adjust_brightness(
>     pixels: &mut [u8],
>     factor: i16,
>     num_threads: usize,
> ) -> Vec<ChunkStats> {
>     if pixels.is_empty() || num_threads == 0 {
>         return Vec::new();
>     }
> 
>     let chunk_size = (pixels.len() + num_threads - 1) / num_threads;
>     let chunks: Vec<&mut [u8]> = pixels.chunks_mut(chunk_size).collect();
> 
>     thread::scope(|s| {
>         let handles: Vec<_> = chunks
>             .into_iter()
>             .map(|chunk| {
>                 s.spawn(move || {
>                     let mut min_val = u8::MAX;
>                     let mut max_val = u8::MIN;
>                     let count = chunk.len();
> 
>                     for pixel in chunk.iter_mut() {
>                         let new_val = (*pixel as i16 + factor).clamp(0, 255) as u8;
>                         *pixel = new_val;
>                         if new_val < min_val {
>                             min_val = new_val;
>                         }
>                         if new_val > max_val {
>                             max_val = new_val;
>                         }
>                     }
> 
>                     if count == 0 {
>                         min_val = 0;
>                         max_val = 0;
>                     }
> 
>                     ChunkStats {
>                         min_val,
>                         max_val,
>                         pixels_processed: count,
>                     }
>                 })
>             })
>             .collect();
> 
>         handles.into_iter().map(|h| h.join().unwrap()).collect()
>     })
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_parallel_brightness_adjustment() {
>         let mut pixels = vec![10, 50, 100, 200, 250];
>         let stats = parallel_adjust_brightness(&mut pixels, 20, 2);
> 
>         assert_eq!(pixels, vec![30, 70, 120, 220, 270]);
>         assert_eq!(stats.len(), 2);
>         assert_eq!(stats[0].pixels_processed, 3);
>         assert_eq!(stats[0].min_val, 30);
>         assert_eq!(stats[0].max_val, 120);
>         assert_eq!(stats[1].pixels_processed, 2);
>         assert_eq!(stats[1].min_val, 220);
>         assert_eq!(stats[1].max_val, 270);
>         assert_ne!(stats[0].min_val, stats[1].min_val);
>     }
> 
>     #[test]
>     fn test_parallel_brightness_saturation_clamp() {
>         let mut pixels = vec![5, 250];
>         let stats = parallel_adjust_brightness(&mut pixels, -20, 2);
> 
>         assert_eq!(pixels, vec![0, 230]);
>         assert_eq!(stats[0].min_val, 0);
>         assert_eq!(stats[0].max_val, 0);
>         assert_eq!(stats[1].min_val, 230);
>         assert_eq!(stats[1].max_val, 230);
>     }
> 
>     #[test]
>     fn test_empty_buffer_and_single_thread() {
>         let mut empty: Vec<u8> = vec![];
>         let stats_empty = parallel_adjust_brightness(&mut empty, 10, 4);
>         assert!(stats_empty.is_empty());
> 
>         let mut data = vec![100, 150];
>         let stats_single = parallel_adjust_brightness(&mut data, -50, 1);
>         assert_eq!(data, vec![50, 100]);
>         assert_eq!(stats_single.len(), 1);
>         assert_eq!(stats_single[0].pixels_processed, 2);
>         assert!(matches!(stats_single[0], ChunkStats { pixels_processed: 2, .. }));
>     }
> }
> ```
> **Explanation:**
> 1. **Zero-Allocation Stack Borrowing:** Unscoped `std::thread::spawn` requires `'static` lifetimes, forcing caller data to be copied or wrapped in `Arc`. `std::thread::scope` guarantees that all worker threads join before the function exits, enabling scoped threads to borrow `&mut [u8]` directly from the stack.
> 2. **Aliasing XOR Mutability:** Rust's borrow checker prohibits multiple threads from borrowing the same `&mut [u8]`. By partitioning the slice into disjoint sub-slices via `chunks_mut`, each worker receives exclusive ownership of a distinct memory region, satisfying Rust's safety rules without locks or atomics.
> 3. **Thread Return Values:** Thread join handles in `std::thread::scope` return values directly from worker closures (`s.spawn(move || ...)`). Calling `handle.join().unwrap()` collects per-thread `ChunkStats` deterministically without atomic synchronization.
>

---

### Exercise 2: Concurrent Log Audit Pipeline with Scoped Panic & Error Propagation

**Problem:** A log monitoring daemon audits large slice collections of log strings (`&[&str]`) stored on the orchestrator's stack frame. Implement `audit_logs_parallel(logs: &[&str], num_workers: usize) -> Result<AuditReport, LogParseError>` using `std::thread::scope`.

The function must split the log slice among worker threads. Workers parse log lines to aggregate log level counts (`total_logs`, `error_count`, `warn_count`, `info_count`). If any thread encounters a log entry containing `"CORRUPTED"`, it immediately returns `Err(LogParseError::CorruptedPayload(String))`. The orchestrator must collect worker results, aggregate reports on success, or short-circuit and return the parsing error.

> [!check]- Answer
> ```rust
> use std::thread;
> 
> #[derive(Debug, PartialEq, Eq, Clone, Default)]
> pub struct AuditReport {
>     pub total_logs: usize,
>     pub error_count: usize,
>     pub warn_count: usize,
>     pub info_count: usize,
> }
> 
> #[derive(Debug, PartialEq, Eq, Clone)]
> pub enum LogParseError {
>     CorruptedPayload(String),
> }
> 
> pub fn audit_logs_parallel(
>     logs: &[&str],
>     num_workers: usize,
> ) -> Result<AuditReport, LogParseError> {
>     if logs.is_empty() || num_workers == 0 {
>         return Ok(AuditReport::default());
>     }
> 
>     let chunk_size = (logs.len() + num_workers - 1) / num_workers;
> 
>     thread::scope(|s| {
>         let handles: Vec<_> = logs
>             .chunks(chunk_size)
>             .map(|chunk| {
>                 s.spawn(move || -> Result<AuditReport, LogParseError> {
>                     let mut report = AuditReport::default();
>                     for log in chunk {
>                         if log.contains("CORRUPTED") {
>                             return Err(LogParseError::CorruptedPayload(log.to_string()));
>                         }
>                         report.total_logs += 1;
>                         if log.starts_with("[ERROR]") {
>                             report.error_count += 1;
>                         } else if log.starts_with("[WARN]") {
>                             report.warn_count += 1;
>                         } else if log.starts_with("[INFO]") {
>                             report.info_count += 1;
>                         }
>                     }
>                     Ok(report)
>                 })
>             })
>             .collect();
> 
>         let mut combined = AuditReport::default();
>         for handle in handles {
>             let res = handle.join().unwrap();
>             match res {
>                 Ok(rep) => {
>                     combined.total_logs += rep.total_logs;
>                     combined.error_count += rep.error_count;
>                     combined.warn_count += rep.warn_count;
>                     combined.info_count += rep.info_count;
>                 }
>                 Err(err) => return Err(err),
>             }
>         }
>         Ok(combined)
>     })
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_audit_logs_success() {
>         let logs = [
>             "[INFO] Service started",
>             "[WARN] Disk space low",
>             "[ERROR] Connection timeout",
>             "[INFO] User logged in",
>             "[ERROR] Database unreachable",
>         ];
> 
>         let result = audit_logs_parallel(&logs, 2);
>         assert!(result.is_ok());
>         let report = result.unwrap();
>         assert_eq!(report.total_logs, 5);
>         assert_eq!(report.error_count, 2);
>         assert_eq!(report.warn_count, 1);
>         assert_eq!(report.info_count, 2);
>         assert_ne!(report.error_count, report.warn_count);
>     }
> 
>     #[test]
>     fn test_audit_logs_corrupted_payload() {
>         let logs = [
>             "[INFO] Normal payload",
>             "CORRUPTED log line payload payload",
>             "[ERROR] Never reached",
>         ];
> 
>         let result = audit_logs_parallel(&logs, 3);
>         assert!(result.is_err());
>         assert!(matches!(
>             result,
>             Err(LogParseError::CorruptedPayload(ref msg)) if msg.contains("CORRUPTED")
>         ));
>     }
> 
>     #[test]
>     fn test_audit_empty_logs() {
>         let logs: [&str; 0] = [];
>         let result = audit_logs_parallel(&logs, 4);
>         assert_eq!(result, Ok(AuditReport::default()));
>         assert!(result.is_ok());
>     }
> }
> ```
> **Explanation:**
> 1. **Scoped Lifetime Propagation:** The log slice `&[&str]` consists of string slices tied to stack lifetimes. Using `std::thread::scope` allows worker threads to capture `chunk: &[&str]` via `move` closures without allocating `Arc<Vec<String>>`.
> 2. **Panic and Error Safety:** `std::thread::scope` automatically joins all unjoined threads when the scope block exits (even during panics). Handling `Result` returns inside join handles allows graceful error propagation back to the caller function.
> 3. **Deterministic Aggregation:** Thread join handle results are processed sequentially by the parent thread, producing deterministic aggregate metrics without mutex contention.
>

---

### Exercise 3: Scoped Multi-Stage Streaming ETL Pipeline with Zero-Copy Stack Borrowing

**Problem:** In a multi-stage streaming data engine, incoming `DataPoint` structs flow through a pipeline across concurrent stages:
1. **Stage 1 (Filter):** Borrows `data: &[DataPoint]` and `config: &PipelineConfig` from the caller stack frame, filtering data points meeting `min_threshold` and sending them over a channel.
2. **Stage 2 (Transform):** Receives data from Stage 1, looks up category weights in a stack-allocated lookup table `&HashMap<String, u64>`, computes `score = raw_value * weight * config.multiplier`, and sends scores over a second channel.
3. **Stage 3 (Aggregate):** Receives transformed scores and aggregates them into `PipelineSummary { processed_count, total_weighted_score }`.

Implement `run_scoped_pipeline(data: &[DataPoint], lookup: &HashMap<String, u64>, config: &PipelineConfig) -> PipelineSummary` using `std::thread::scope` and `std::sync::mpsc::channel`.

> [!check]- Answer
> ```rust
> use std::collections::HashMap;
> use std::sync::mpsc;
> use std::thread;
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct DataPoint {
>     pub id: u64,
>     pub category: String,
>     pub raw_value: u64,
> }
> 
> #[derive(Debug, Clone)]
> pub struct PipelineConfig {
>     pub min_threshold: u64,
>     pub multiplier: u64,
> }
> 
> #[derive(Debug, Default, PartialEq, Eq)]
> pub struct PipelineSummary {
>     pub processed_count: usize,
>     pub total_weighted_score: u64,
> }
> 
> pub fn run_scoped_pipeline(
>     data: &[DataPoint],
>     lookup: &HashMap<String, u64>,
>     config: &PipelineConfig,
> ) -> PipelineSummary {
>     let (tx1, rx1) = mpsc::channel::<(u64, String, u64)>();
>     let (tx2, rx2) = mpsc::channel::<u64>();
> 
>     thread::scope(|s| {
>         // Stage 1: Ingestion & Filtering (borrows data & config)
>         s.spawn(move || {
>             for item in data {
>                 if item.raw_value >= config.min_threshold {
>                     if tx1.send((item.id, item.category.clone(), item.raw_value)).is_err() {
>                         break;
>                     }
>                 }
>             }
>         });
> 
>         // Stage 2: Transformation & Lookup (borrows lookup & config)
>         s.spawn(move || {
>             for (_id, category, raw_val) in rx1 {
>                 let weight = lookup.get(&category).copied().unwrap_or(1);
>                 let score = raw_val * weight * config.multiplier;
>                 if tx2.send(score).is_err() {
>                     break;
>                 }
>             }
>         });
> 
>         // Stage 3: Aggregation (collects into PipelineSummary)
>         let aggregator_handle = s.spawn(move || {
>             let mut summary = PipelineSummary::default();
>             for score in rx2 {
>                 summary.processed_count += 1;
>                 summary.total_weighted_score += score;
>             }
>             summary
>         });
> 
>         aggregator_handle.join().unwrap()
>     })
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_scoped_pipeline_flow() {
>         let data = vec![
>             DataPoint { id: 1, category: "sensor_a".to_string(), raw_value: 10 },
>             DataPoint { id: 2, category: "sensor_b".to_string(), raw_value: 5 }, // Below threshold
>             DataPoint { id: 3, category: "sensor_a".to_string(), raw_value: 20 },
>             DataPoint { id: 4, category: "unknown".to_string(), raw_value: 15 },
>         ];
> 
>         let mut lookup = HashMap::new();
>         lookup.insert("sensor_a".to_string(), 3);
>         lookup.insert("sensor_b".to_string(), 2);
> 
>         let config = PipelineConfig {
>             min_threshold: 10,
>             multiplier: 2,
>         };
> 
>         // Borrow local stack data directly without Arc
>         let summary = run_scoped_pipeline(&data, &lookup, &config);
> 
>         // Item 1: raw 10 * weight 3 * mult 2 = 60
>         // Item 3: raw 20 * weight 3 * mult 2 = 120
>         // Item 4: raw 15 * default_weight 1 * mult 2 = 30
>         // Total count = 3, Total score = 60 + 120 + 30 = 210
>         assert_eq!(summary.processed_count, 3);
>         assert_eq!(summary.total_weighted_score, 210);
>         assert_ne!(summary.processed_count, data.len());
>     }
> 
>     #[test]
>     fn test_scoped_pipeline_filtered_all() {
>         let data = vec![
>             DataPoint { id: 1, category: "sensor_a".to_string(), raw_value: 2 },
>         ];
>         let lookup = HashMap::new();
>         let config = PipelineConfig {
>             min_threshold: 10,
>             multiplier: 2,
>         };
> 
>         let summary = run_scoped_pipeline(&data, &lookup, &config);
>         assert_eq!(summary, PipelineSummary::default());
>         assert!(matches!(summary, PipelineSummary { processed_count: 0, total_weighted_score: 0 }));
>     }
> }
> ```
> **Explanation:**
> 1. **Zero-Copy Multi-Thread Sharing:** Scoped threads allow Stage 1 and Stage 2 to concurrently borrow `config` and `lookup` from the caller's stack frame. No `Arc`, `RwLock`, or deep cloning of lookup tables is required.
> 2. **Automatic Channel Shutdown:** Senders (`tx1`, `tx2`) are moved into stage closures inside `std::thread::scope`. When Stage 1 finishes iterating over `data`, `tx1` is dropped, causing `rx1` iteration in Stage 2 to terminate cleanly. Likewise, `tx2` drops when Stage 2 finishes, terminating Stage 3 naturally.
> 3. **Compiler Lifetime Guarantees:** Because `thread::scope` blocks until Stage 1, Stage 2, and Stage 3 complete, the Rust compiler guarantees that `data`, `lookup`, and `config` outlive all three threads.

---

## 6. Related Terms


- [`std::thread::spawn`](std_thread_spawn.md) — The unscoped primitive this API builds on and relaxes the `'static` requirement of.
- [`'static` Lifetime](../level_05/static_lifetime.md) — The specific constraint scoped threads let you bypass.
- [`Arc<T>`](../level_03/arc_t.md) — The common (now often unnecessary) workaround for sharing data with unscoped threads.
- [RAII (Resource Acquisition Is Initialization)](../level_18/raii.md) — The `scope` function's "block until all threads join" behavior is itself an RAII-style guarantee, enforced by the API's structure rather than a `Drop` impl.

---

## 7. Key Takeaways

- `std::thread::scope(|s| { ... })` guarantees every thread spawned via `s.spawn(...)` is joined before `scope()` returns.
- That guarantee lets scoped threads borrow **non-`'static`** data straight from the enclosing stack frame — no `Arc`, no cloning, no allocation.
- Reach for it whenever your concurrency pattern is "fan out several threads, then wait for all of them" within the same function.
- Fall back to `Arc`/`Mutex` only when threads must genuinely outlive the spawning function or need true shared mutable state beyond a simple join.
