# Rayon

> **Level 9 — Concurrency & Parallelism**
> Popular crate for data parallelism; provides parallel iterators (`.par_iter()`).

---

## 1. Prerequisites


- [`std::thread::spawn`](std_thread_spawn.md) — The raw multi-threading tool that Rayon abstracts away.
- [Iterator Adapters](../level_02/iterator_adapters.md) — The `.iter().map().filter()` chains that Rayon supercharges.
- [Closures (`|args| body`)](../level_06/closure.md) — The syntax used to pass logic into Rayon iterators.

---

## 2. Term Category

**Rust Tooling (the parallel powerhouse)**: Writing raw `std::thread::spawn` code is tedious. If you have an array of 1,000,000 numbers and you want to double all of them, you don't want to manually spawn 16 threads, slice the array into 16 chunks, pass the chunks to the threads, wait for them to finish, and painstakingly recombine the array. 

**Rayon** is an external crate that does all of this for you automatically. You literally just change `.iter()` to `.par_iter()`, and your loop instantly runs across all available CPU cores!

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The Rust designers wanted concurrency to be incredibly easy, but they also didn't want to bloat the standard library with complex thread-pooling logic. 

Rayon was created as an external crate (built by Niko Matsakis, one of Rust's core designers) to handle "Data Parallelism". 

It uses a brilliant algorithm called a **"work-stealing thread pool"**. If you have a massive loop, Rayon automatically distributes the loop iterations across all available CPU cores. If Core 1 finishes its chunk of work early, it literally "steals" work from Core 2's queue so that no CPU core is ever sitting idle! This maximizes efficiency with zero manual configuration.

### (2) Reality Metaphor

Imagine you have 10,000 envelopes to stuff. 

- **Single Thread (`.iter()`):** You sit alone at a desk and stuff them one by one. It takes 10 hours.
- **Manual Threads (`thread::spawn`):** You hire 4 friends, spend an hour splitting the envelopes into 4 perfectly equal piles, hand them out, and wait. If Friend A finishes their pile early, they just sit in a chair doing nothing while the others work.
- **Rayon (`.par_iter()`):** You dump all 10,000 envelopes in the center of the room and yell *"Go!"* Your 4 friends grab as many as they can. If Friend A finishes their pile, they immediately reach over and steal envelopes from Friend B's pile. Nobody is ever sitting idle!

### (3) Rust Code Examples

#### Short Snippet (The Magic Trick)
To use Rayon, you add `rayon = "1"` to your `Cargo.toml`. Then, you must bring the Rayon "prelude" into scope. This unlocks the magic `.par_iter()` method on all your standard collections (Vecs, HashMaps, etc.).

```rust
use rayon::prelude::*; // <--- Required!

fn main() {
    let numbers = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // This sum is calculated across multiple threads!
    let total: i32 = numbers.par_iter().sum();
}
```

#### Fuller Example (The Massive Chain)
Rayon provides parallel versions of almost every standard iterator adapter (`.map`, `.filter`, `.collect`). 

```rust
use rayon::prelude::*;

fn main() {
    // A massive vector of 1 million numbers
    let mut numbers: Vec<i32> = (1..1_000_000).collect();

    // In a SINGLE LINE, we spin up a thread pool, distribute the data,
    // filter it, mutate it, and recombine it.
    let processed_data: Vec<i32> = numbers
        .into_par_iter()           // 1. Parallel Iterator!
        .filter(|&x| x % 2 == 0)   // 2. Filter evens in parallel
        .map(|x| x * x)            // 3. Square them in parallel
        .collect();                // 4. Recombine into a single Vec!
        
    println!("Processed {} items!", processed_data.len());
}
```
If you accidentally tried to cause a Data Race inside the `.map()` closure, the Rust compiler would catch it instantly and refuse to compile, maintaining "Fearless Concurrency"!

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Rayon Scoping and Lifecycle Rules

**The mistake:** Assuming Rayon instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("rayon_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("rayon_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Rayon State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Rayon through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Rayon Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Rayon instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: High-Throughput Log Telemetry Aggregator via Custom ThreadPool, Parallel Fold, and Lock-Free Map-Reduce

**Scenario:**
In a cloud-native web service, millions of access log lines are ingested in large batches. Parsing logs sequentially causes severe CPU bottlenecking. However, using global mutexes inside parallel loops causes lock contention, defeating the purpose of parallelism.

Design a zero-contention parallel log aggregation module using Rayon:
1. Parse raw log lines formatted as `"STATUS_CODE LATENCY_MS MSG"` (e.g., `"200 45 OK"` or `"500 120 InternalServerError"`). Skip malformed lines.
2. Build a custom Rayon `ThreadPool` with 4 worker threads to process log batches independently without clogging global worker pools.
3. Use `par_iter().fold(...)` to accumulate local `LogMetrics` per thread chunk without locks, followed by `.reduce(...)` to merge thread-local metrics into a final aggregate.
4. Track status code distribution (`2xx`, `4xx`, `5xx`), total valid log count, and maximum recorded latency.

Write the complete code with comprehensive unit tests in `mod tests` asserting total count, status distributions, peak latency, error tolerance on bad logs, and proper custom `ThreadPool` execution.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use rayon::prelude::*;
> use rayon::ThreadPoolBuilder;
> use std::cmp::max;
> 
> #[derive(Debug, Default, PartialEq, Eq, Clone)]
> pub struct LogMetrics {
>     pub total_logs: usize,
>     pub status_2xx: usize,
>     pub status_4xx: usize,
>     pub status_5xx: usize,
>     pub max_latency_ms: u64,
> }
> 
> impl LogMetrics {
>     pub fn merge(mut self, other: Self) -> Self {
>         self.total_logs += other.total_logs;
>         self.status_2xx += other.status_2xx;
>         self.status_4xx += other.status_4xx;
>         self.status_5xx += other.status_5xx;
>         self.max_latency_ms = max(self.max_latency_ms, other.max_latency_ms);
>         self
>     }
> }
> 
> pub fn parse_log_line(line: &str) -> Option<(u16, u64)> {
>     let mut parts = line.split_whitespace();
>     let status: u16 = parts.next()?.parse().ok()?;
>     let latency: u64 = parts.next()?.parse().ok()?;
>     Some((status, latency))
> }
> 
> pub fn process_logs_parallel(logs: &[&str], num_threads: usize) -> LogMetrics {
>     let pool = ThreadPoolBuilder::new()
>         .num_threads(num_threads)
>         .build()
>         .expect("Failed to build custom Rayon ThreadPool");
> 
>     pool.install(|| {
>         logs.par_iter()
>             .filter_map(|line| parse_log_line(line))
>             .fold(
>                 LogMetrics::default,
>                 |mut acc, (status, latency)| {
>                     acc.total_logs += 1;
>                     acc.max_latency_ms = max(acc.max_latency_ms, latency);
>                     match status {
>                         200..=299 => acc.status_2xx += 1,
>                         400..=499 => acc.status_4xx += 1,
>                         500..=599 => acc.status_5xx += 1,
>                         _ => {}
>                     }
>                     acc
>                 },
>             )
>             .reduce(LogMetrics::default, LogMetrics::merge)
>     })
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_parse_log_line_valid_and_invalid() {
>         let valid = parse_log_line("200 45 GET /api/v1/health");
>         assert!(valid.is_some());
>         assert_eq!(valid, Some((200, 45)));
> 
>         let invalid = parse_log_line("BAD_STATUS 45 GET /api/v1/health");
>         assert_eq!(invalid, None);
> 
>         let incomplete = parse_log_line("200");
>         assert!(incomplete.is_none());
>     }
> 
>     #[test]
>     fn test_process_logs_parallel_aggregation() {
>         let logs = vec![
>             "200 15 OK",
>             "201 25 Created",
>             "404 100 NotFound",
>             "500 450 InternalError",
>             "503 300 ServiceUnavailable",
>             "200 80 OK",
>             "invalid_log_entry",
>             "401 50 Unauthorized",
>         ];
> 
>         let metrics = process_logs_parallel(&logs, 4);
> 
>         assert_eq!(metrics.total_logs, 7);
>         assert_eq!(metrics.status_2xx, 3);
>         assert_eq!(metrics.status_4xx, 2);
>         assert_eq!(metrics.status_5xx, 2);
>         assert_eq!(metrics.max_latency_ms, 450);
>         assert_ne!(metrics.total_logs, logs.len());
>     }
> 
>     #[test]
>     fn test_empty_logs() {
>         let logs: Vec<&str> = vec![];
>         let metrics = process_logs_parallel(&logs, 2);
>         assert_eq!(metrics, LogMetrics::default());
>         assert!(matches!(metrics.total_logs, 0));
>     }
> }
> ```
> 
> #### Technical Explanation
>
> 1. **Custom `ThreadPoolBuilder` Isolation:** In production applications, running CPU-heavy batch processing on the default global Rayon thread pool can starve critical system tasks. Constructing a custom `ThreadPool` via `ThreadPoolBuilder::new().num_threads(...).build()` ensures resource isolation. The `pool.install(...)` method sets the context so `.par_iter()` executes within that custom pool.
> 2. **Lock-Free Local Accumulation (`fold`):** Using shared mutable state protected by `Mutex` inside parallel iterators creates severe lock contention. `fold()` initializes thread-local identity accumulators (`LogMetrics::default`), allowing each worker thread to mutate its own isolated metrics struct without acquiring locks.
> 3. **Hierarchical Reduction (`reduce`):** Once worker threads complete their chunks, `.reduce(...)` hierarchically combines the thread-local `LogMetrics` structs using `LogMetrics::merge`. This pattern reduces lock/atomic overhead from $O(N)$ down to $O(\text{num\_threads})$.
> 
---

### Exercise 2: Recursive Divide-and-Conquer AST Evaluation with `rayon::join` and Non-Static Stack Borrowing via `rayon::scope`

**Scenario:**
A compiler parser generates heavy expression trees (AST) that need evaluation. Evaluating nested expressions sequentially can result in high latency. Moreover, we want to collect live evaluation telemetry (node invocation count) during execution across work-stealing threads without moving owned memory into heap allocations or requiring `'static` lifetime bounds.

Implement a parallel recursive AST evaluator using `rayon::join` and `rayon::scope`:
1. Define an `Expr` enum representing numeric literals, binary addition, binary multiplication, and conditional branching.
2. Write a recursive function `eval_parallel(&Expr, depth: usize) -> i64` that uses `rayon::join` when evaluation depth is below a threshold (e.g. `depth < 4`) to schedule sub-expression evaluations on Rayon's work-stealing deque in parallel. Switch to sequential evaluation when depth exceeds the threshold to avoid excessive task granularity overhead.
3. Use `rayon::scope` to spawn background monitoring tasks that safely borrow stack variables (e.g., an `AtomicUsize` step counter) across task boundaries without `Arc` wrapping.
4. Implement a comprehensive unit test suite using `mod tests` checking mathematical correctness, stack reference borrowing, depth cutoff handling, and non-trivial AST branch evaluation.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use rayon::prelude::*;
> use std::sync::atomic::{AtomicUsize, Ordering};
> 
> #[derive(Debug, Clone)]
> pub enum Expr {
>     Literal(i64),
>     Add(Box<Expr>, Box<Expr>),
>     Mul(Box<Expr>, Box<Expr>),
>     IfGtZero(Box<Expr>, Box<Expr>, Box<Expr>),
> }
> 
> pub fn eval_parallel(expr: &Expr, depth: usize, atomic_counter: &AtomicUsize) -> i64 {
>     atomic_counter.fetch_add(1, Ordering::Relaxed);
> 
>     match expr {
>         Expr::Literal(val) => *val,
>         Expr::Add(left, right) => {
>             if depth < 4 {
>                 let (l_res, r_res) = rayon::join(
>                     || eval_parallel(left, depth + 1, atomic_counter),
>                     || eval_parallel(right, depth + 1, atomic_counter),
>                 );
>                 l_res + r_res
>             } else {
>                 eval_parallel(left, depth + 1, atomic_counter)
>                     + eval_parallel(right, depth + 1, atomic_counter)
>             }
>         }
>         Expr::Mul(left, right) => {
>             if depth < 4 {
>                 let (l_res, r_res) = rayon::join(
>                     || eval_parallel(left, depth + 1, atomic_counter),
>                     || eval_parallel(right, depth + 1, atomic_counter),
>                 );
>                 l_res * r_res
>             } else {
>                 eval_parallel(left, depth + 1, atomic_counter)
>                     * eval_parallel(right, depth + 1, atomic_counter)
>             }
>         }
>         Expr::IfGtZero(cond, then_expr, else_expr) => {
>             let cond_val = eval_parallel(cond, depth + 1, atomic_counter);
>             if cond_val > 0 {
>                 eval_parallel(then_expr, depth + 1, atomic_counter)
>             } else {
>                 eval_parallel(else_expr, depth + 1, atomic_counter)
>             }
>         }
>     }
> }
> 
> pub fn evaluate_ast_with_scope(ast: &Expr) -> (i64, usize) {
>     let node_counter = AtomicUsize::new(0);
>     let mut result = 0;
> 
>     rayon::scope(|s| {
>         s.spawn(|_| {
>             // Scoped task executing AST evaluation concurrently while borrowing local stack references
>             result = eval_parallel(ast, 0, &node_counter);
>         });
>     });
> 
>     (result, node_counter.load(Ordering::SeqCst))
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_literal_and_simple_arithmetic() {
>         let counter = AtomicUsize::new(0);
>         let expr = Expr::Add(
>             Box::new(Expr::Literal(10)),
>             Box::new(Expr::Literal(32)),
>         );
>         let val = eval_parallel(&expr, 0, &counter);
>         assert_eq!(val, 42);
>         assert_eq!(counter.load(Ordering::Relaxed), 3);
>     }
> 
>     #[test]
>     fn test_complex_ast_evaluation_with_scope() {
>         // ( (5 * 4) + (10 + 20) ) -> (20 + 30) = 50
>         let ast = Expr::Add(
>             Box::new(Expr::Mul(
>                 Box::new(Expr::Literal(5)),
>                 Box::new(Expr::Literal(4)),
>             )),
>             Box::new(Expr::Add(
>                 Box::new(Expr::Literal(10)),
>                 Box::new(Expr::Literal(20)),
>             )),
>         );
> 
>         let (result, nodes_visited) = evaluate_ast_with_scope(&ast);
>         assert_eq!(result, 50);
>         assert!(nodes_visited > 5);
>         assert_ne!(result, 0);
>     }
> 
>     #[test]
>     fn test_conditional_branching() {
>         let counter = AtomicUsize::new(0);
>         let ast = Expr::IfGtZero(
>             Box::new(Expr::Literal(1)),
>             Box::new(Expr::Literal(100)),
>             Box::new(Expr::Literal(-100)),
>         );
> 
>         let val = eval_parallel(&ast, 0, &counter);
>         assert_eq!(val, 100);
>         assert!(matches!(val, 100));
>     }
> }
> ```
> 
> #### Technical Explanation
>
> 1. **Work-Stealing Task Splitting via `rayon::join`:** `rayon::join(closure1, closure2)` branches execution into two tasks. If idle worker threads exist in Rayon's pool, one closure is stolen while the current thread runs the other. This divide-and-conquer strategy evaluates binary expression subtrees concurrently without manual thread management.
> 2. **Sequential Cutoff Threshold:** Spawning tasks for tiny computations (like leaf `Expr::Literal` nodes) creates scheduling overhead that outweighs parallel execution gains. Bounding `join` with a `depth < 4` condition switches execution to sequential evaluation at deeper tree levels.
> 3. **Non-Static Stack Borrowing with `rayon::scope`:** Standard OS thread spawning (`std::thread::spawn`) requires closures to own data or hold `'static` references. `rayon::scope` guarantees that all spawned tasks complete before the scope block finishes, enabling tasks to safely borrow stack references (like `node_counter` and `result`) without requiring `Arc` or heap allocations.
> 
---

### Exercise 3: In-Place Parallel Chunk Mutation & Sorting with Atomic Progress Tracking & Custom Ordering

**Scenario:**
A quantitative trading platform processes large arrays of financial transaction records (`Transaction { id: u64, amount: f64, timestamp: u64, flags: u8 }`).
Before feeding transaction batches into risk models, records must be mutated in-place to apply currency conversions or risk weighting, filtered or marked, and finally sorted by timestamp descending, then amount descending.

Implement a parallel processing pipeline using Rayon's slice extensions:
1. Define `Transaction` struct with fields `id`, `amount`, `timestamp`, `flags`.
2. Use `par_chunks_mut(chunk_size)` to partition a mutable slice of transactions across threads. Each thread updates `amount` by multiplying with a `risk_factor` and sets bit flag `0x01` in `flags` when `amount > threshold`.
3. Track total processed chunks atomically using `AtomicUsize` with `Ordering::Release` / `Ordering::Acquire`.
4. Perform parallel in-place sorting using `par_sort_unstable_by()` with custom multi-field sorting rules (timestamp descending, then amount descending).
5. Include a comprehensive unit test suite in `mod tests` testing chunked parallel mutations, atomic progress counters, sorting correctness, and bitwise flag assertions.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use rayon::prelude::*;
> use std::cmp::Ordering as CmpOrdering;
> use std::sync::atomic::{AtomicUsize, Ordering};
> 
> #[derive(Debug, Clone, PartialEq)]
> pub struct Transaction {
>     pub id: u64,
>     pub amount: f64,
>     pub timestamp: u64,
>     pub flags: u8,
> }
> 
> pub fn process_and_sort_transactions(
>     txs: &mut [Transaction],
>     risk_factor: f64,
>     high_risk_threshold: f64,
>     chunk_size: usize,
> ) -> usize {
>     let chunk_counter = AtomicUsize::new(0);
> 
>     // Step 1: In-place parallel chunk processing
>     txs.par_chunks_mut(chunk_size).for_each(|chunk| {
>         for tx in chunk.iter_mut() {
>             tx.amount *= risk_factor;
>             if tx.amount >= high_risk_threshold {
>                 tx.flags |= 0x01; // Set high risk flag
>             }
>         }
>         chunk_counter.fetch_add(1, Ordering::Release);
>     });
> 
>     // Step 2: In-place parallel unstable sort by timestamp DESC, then amount DESC
>     txs.par_sort_unstable_by(|a, b| {
>         let time_cmp = b.timestamp.cmp(&a.timestamp);
>         if time_cmp != CmpOrdering::Equal {
>             time_cmp
>         } else {
>             b.amount
>                 .partial_cmp(&a.amount)
>                 .unwrap_or(CmpOrdering::Equal)
>         }
>     });
> 
>     chunk_counter.load(Ordering::Acquire)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_chunk_mutation_and_risk_flag() {
>         let mut txs = vec![
>             Transaction { id: 1, amount: 100.0, timestamp: 1000, flags: 0 },
>             Transaction { id: 2, amount: 50.0, timestamp: 1001, flags: 0 },
>             Transaction { id: 3, amount: 200.0, timestamp: 1002, flags: 0 },
>             Transaction { id: 4, amount: 10.0, timestamp: 999, flags: 0 },
>         ];
> 
>         let processed_chunks = process_and_sort_transactions(&mut txs, 2.0, 150.0, 2);
> 
>         assert_eq!(processed_chunks, 2);
> 
>         // Check high risk flag on mutated amounts:
>         // tx1: 100 * 2 = 200 >= 150 (flag 0x01)
>         // tx2: 50 * 2 = 100 < 150 (flag 0x00)
>         // tx3: 200 * 2 = 400 >= 150 (flag 0x01)
>         // tx4: 10 * 2 = 20 < 150 (flag 0x00)
> 
>         // Sorted by timestamp DESC:
>         // Index 0: timestamp 1002 (tx3, amount 400.0, flag 1)
>         // Index 1: timestamp 1001 (tx2, amount 100.0, flag 0)
>         // Index 2: timestamp 1000 (tx1, amount 200.0, flag 1)
>         // Index 3: timestamp 999  (tx4, amount 20.0, flag 0)
> 
>         assert_eq!(txs[0].id, 3);
>         assert_eq!(txs[0].amount, 400.0);
>         assert_eq!(txs[0].flags & 0x01, 1);
> 
>         assert_eq!(txs[1].id, 2);
>         assert_eq!(txs[1].timestamp, 1001);
> 
>         assert_ne!(txs[0].timestamp, txs[3].timestamp);
>         assert!(matches!(txs[0].flags & 0x01, 1));
>     }
> 
>     #[test]
>     fn test_sorting_tie_breaking_by_amount() {
>         let mut txs = vec![
>             Transaction { id: 1, amount: 100.0, timestamp: 1000, flags: 0 },
>             Transaction { id: 2, amount: 300.0, timestamp: 1000, flags: 0 },
>         ];
> 
>         process_and_sort_transactions(&mut txs, 1.0, 500.0, 1);
> 
>         // Timestamps equal (1000), tie broken by amount DESC:
>         assert_eq!(txs[0].id, 2);
>         assert_eq!(txs[1].id, 1);
>     }
> }
> ```
> 
> #### Technical Explanation
>
> 1. **In-Place Parallel Chunk Mutation (`par_chunks_mut`):** `par_chunks_mut(size)` splits a slice into non-overlapping mutable slices processed concurrently by Rayon threads. Because the slice segments are non-overlapping, Rust's borrow checker guarantees data-race freedom without locks.
> 2. **Parallel Sorting with Custom Comparators (`par_sort_unstable_by`):** `par_sort_unstable_by` uses a parallel sample-sort algorithm, distributing array partitioning across available cores. Using `unstable` sorting avoids allocating extra memory buffers for stability when element identity stability is unneeded.
> 3. **Atomic Progress Synchronization (`Release` / `Acquire`):** `fetch_add` with `Ordering::Release` ensures all chunk updates are visible to observers reading the atomic variable with `Ordering::Acquire` after completion, preventing instruction reordering across thread synchronization barriers.
> 
---

## 6. Related Terms


- [Iterator Adapters](../level_02/iterator_adapters.md) — Rayon provides parallel equivalents for all of these (`.map`, `.filter`, `.collect`).
- [`std::thread::spawn`](std_thread_spawn.md) — What Rayon is actually doing under the hood!

---

## 7. Key Takeaways

- **Rayon** is the standard Rust crate for Data Parallelism.
- It uses a highly optimized **"work-stealing" thread pool** to ensure no CPU core ever sits idle.
- You unlock it by bringing **`use rayon::prelude::*;`** into scope.
- You simply replace `.iter()` with **`.par_iter()`**, or `.into_iter()` with **`.into_par_iter()`**.
- **Do NOT use it for tiny arrays!** The overhead of thread management will actually slow your program down.
