# Benchmarking

> **Level 8 — Testing & Documentation**
> Performance measurement; stable Rust uses the `criterion` crate.

---

## 1. Prerequisites

- [`#[test]`](../level_08/test_attribute.md) — The correctness counterpart to benchmarking.
- [Cargo](../level_01/cargo.md) — The build system used to run benchmarks via `cargo bench`.

---

## 2. Term Category

**Rust-nonspecific (the performance tester)**: Unit tests verify that your code calculates the correct answer. Benchmarks verify *how fast* your code calculates that answer. 

In Rust, performance is a first-class citizen. Benchmarking is how you mathematically prove that your new algorithm is actually faster than the old one, rather than just guessing.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

*"Is this code faster?"* Developers love to argue about performance. 

But writing a manual timer (`let start = Instant::now(); run_code();`) is wildly inaccurate. Modern CPUs fluctuate in clock speed, cache states change randomly, and the OS interrupts your program to do background tasks. A single timer run is meaningless.

Proper benchmarking requires running a function thousands of times, dropping statistical outliers, tracking CPU cycles, and calculating a true mathematical average. 

Because the built-in `cargo bench` tool relies on unstable compiler features, the entire Rust ecosystem has agreed to use a wildly popular, statistically rigorous external crate called **`criterion`** for all benchmarking.

### (2) Reality Metaphor

Imagine you are a Formula 1 race team.

- A **Unit Test** is putting the car on blocks in the garage and turning the steering wheel to make sure the tires move. It verifies the car works.
- A **Benchmark** is taking the car to the track, driving 100 laps, tracking the exact milliseconds of every single lap with lasers, and calculating the true average lap time to see if the new engine is actually faster than last year's model.

### (3) Rust Code Examples

#### Short Snippet (The Configuration)
To use Criterion, you must add it to a special `[dev-dependencies]` section in your `Cargo.toml`. These dependencies are only downloaded when running tests or benchmarks, saving your customers from downloading them!

**File: `Cargo.toml`**
```toml
[dev-dependencies]
criterion = "0.5"

# We must tell Cargo about our benchmark file and disable the default runner
[[bench]]
name = "my_benchmark"
harness = false
```

#### Fuller Example (The Black Box)
Benchmarks live in a `benches/` directory at the root of your project, exactly like Integration Tests!

**File: `benches/my_benchmark.rs`**
```rust
use criterion::{black_box, criterion_group, criterion_main, Criterion};
use my_awesome_library::calculate_fibonacci;

fn criterion_benchmark(c: &mut Criterion) {
    // We tell Criterion to benchmark this specific function
    c.bench_function("fibonacci 20", |b| {
        // `b.iter` runs the closure inside it thousands of times
        b.iter(|| {
            // We use `black_box` to trick the compiler! (See Common Mistakes below)
            calculate_fibonacci(black_box(20))
        })
    });
}

// These macros generate the main function that actually runs the benchmarks
criterion_group!(benches, criterion_benchmark);
criterion_main!(benches);
```
To run this, you simply type `cargo bench` in your terminal. Criterion will print out a beautiful statistical report showing the exact nanoseconds it took to run.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Benchmarking Scoping and Lifecycle Rules

**The mistake:** Assuming Benchmarking instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("benchmarking_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("benchmarking_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Benchmarking State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Benchmarking through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Benchmarking Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Benchmarking instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Zero-Allocation Binary Parser vs. Allocating Parser Benchmarking Harness

**Problem Statement:**
You are benchmarking high-frequency trading binary data packet parsers. You need to compare an allocating parser (`parse_allocating`) that allocates strings against a zero-copy parser (`parse_zero_copy`) that returns string slices. You must implement both parsing strategies, write a benchmark harness leveraging `std::hint::black_box`, and include a unit test suite (`#[cfg(test)] mod tests`) verifying parsing correctness using assertions (`assert_eq!`, `assert!`, `assert_ne!`, `matches!`).

Requirements:
1. Define `BinaryPacket` with header magic `0xFA`, key slice/string, and payload slice/vec.
2. Implement `parse_allocating(input: &[u8]) -> Result<(String, Vec<u8>), &'static str>`.
3. Implement `parse_zero_copy(input: &[u8]) -> Result<(&str, &[u8]), &'static str>`.
4. Create `benchmark_parser_harness(iterations: usize, input: &[u8])` utilizing `black_box` for both strategies.
5. In `#[cfg(test)] mod tests`, write unit tests verifying output parity, error variants on corrupt magic bytes, and allocation differences (`assert_eq!`, `assert!`, `assert_ne!`).

> [!check]- Answer
> ```rust
> use std::hint::black_box;
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum ParseError {
>     InvalidMagic,
>     BufferTooShort,
>     Utf8Error,
> }
> 
> /// Allocating binary parser strategy.
> pub fn parse_allocating(input: &[u8]) -> Result<(String, Vec<u8>), ParseError> {
>     if input.len() < 5 {
>         return Err(ParseError::BufferTooShort);
>     }
>     if input[0] != 0xFA {
>         return Err(ParseError::InvalidMagic);
>     }
>     let key_len = input[1] as usize;
>     if input.len() < 2 + key_len {
>         return Err(ParseError::BufferTooShort);
>     }
>     let key_str = std::str::from_utf8(&input[2..2 + key_len]).map_err(|_| ParseError::Utf8Error)?;
>     let payload = input[2 + key_len..].to_vec();
>     Ok((key_str.to_string(), payload))
> }
> 
> /// Zero-copy borrowing binary parser strategy.
> pub fn parse_zero_copy(input: &[u8]) -> Result<(&str, &[u8]), ParseError> {
>     if input.len() < 5 {
>         return Err(ParseError::BufferTooShort);
>     }
>     if input[0] != 0xFA {
>         return Err(ParseError::InvalidMagic);
>     }
>     let key_len = input[1] as usize;
>     if input.len() < 2 + key_len {
>         return Err(ParseError::BufferTooShort);
>     }
>     let key_str = std::str::from_utf8(&input[2..2 + key_len]).map_err(|_| ParseError::Utf8Error)?;
>     let payload = &input[2 + key_len..];
>     Ok((key_str, payload))
> }
> 
> /// Benchmarking loop runner utilizing black_box compiler barriers.
> pub fn benchmark_parser_harness(iterations: usize, input: &[u8]) -> (usize, usize) {
>     let mut alloc_count = 0;
>     let mut zero_copy_count = 0;
> 
>     for _ in 0..iterations {
>         let res_a = parse_allocating(black_box(input));
>         if black_box(res_a).is_ok() {
>             alloc_count += 1;
>         }
> 
>         let res_z = parse_zero_copy(black_box(input));
>         if black_box(res_z).is_ok() {
>             zero_copy_count += 1;
>         }
>     }
> 
>     (alloc_count, zero_copy_count)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_parser_correctness_and_parity() {
>         let mut packet = vec![0xFA, 0x04]; // Magic 0xFA, Key length 4
>         packet.extend_from_slice(b"AAPL");
>         packet.extend_from_slice(b"PAYLOAD_DATA");
> 
>         let alloc_res = parse_allocating(&packet);
>         let zero_res = parse_zero_copy(&packet);
> 
>         assert!(alloc_res.is_ok());
>         assert!(zero_res.is_ok());
> 
>         let (alloc_key, alloc_payload) = alloc_res.unwrap();
>         let (zero_key, zero_payload) = zero_res.unwrap();
> 
>         assert_eq!(alloc_key, zero_key);
>         assert_eq!(alloc_payload.as_slice(), zero_payload);
>         assert_eq!(alloc_key, "AAPL");
>         assert_ne!(alloc_key, "GOOG");
>     }
> 
>     #[test]
>     fn test_invalid_magic_error() {
>         let packet = vec![0xBB, 0x02, b'X', b'Y'];
>         let res = parse_zero_copy(&packet);
>         assert!(matches!(res, Err(ParseError::InvalidMagic)));
>     }
> 
>     #[test]
>     fn test_benchmark_harness_execution() {
>         let mut packet = vec![0xFA, 0x03];
>         packet.extend_from_slice(b"KEY");
>         packet.extend_from_slice(b"BODY");
> 
>         let (alloc_runs, zero_runs) = benchmark_parser_harness(100, &packet);
>         assert_eq!(alloc_runs, 100);
>         assert_eq!(zero_runs, 100);
>     }
> }
> ```
> 
> **Technical Explanation:**
> 1. **Compiler Optimization Barriers (`black_box`)**: Wrapping inputs (`black_box(input)`) and outputs in benchmark iteration loops prevents LLVM constant folding from eliminating parsing instructions during benchmark execution.
> 2. **Zero-Copy Performance**: `parse_zero_copy` avoids heap allocation by borrowing slice lifetimes (`&'a str`, `&'a [u8]`) from the input slice, eliminating memory manager latency.

---

### Exercise 2: SIMD Parallel Search vs. Linear Scan Benchmarking Simulation

**Problem Statement:**
You are benchmarking search algorithms for vector data structures. You must implement a linear search algorithm (`linear_search`) and a chunked parallel SIMD-style search algorithm (`chunked_search`), and create a benchmarking simulation harness using `black_box`.

Requirements:
1. Implement `linear_search(haystack: &[u64], target: u64) -> Option<usize>`.
2. Implement `chunked_search(haystack: &[u64], target: u64) -> Option<usize>` processing 4 elements per iteration loop.
3. Construct `run_search_benchmarks(haystack: &[u64], target: u64, iterations: usize)`.
4. Write unit tests in `#[cfg(test)] mod tests` verifying search result equivalence, edge case empty slices, and target missing scenarios (`assert_eq!`, `assert!`, `assert_ne!`, `matches!`).

> [!check]- Answer
> ```rust
> use std::hint::black_box;
> 
> /// Sequential linear search implementation.
> pub fn linear_search(haystack: &[u64], target: u64) -> Option<usize> {
>     haystack.iter().position(|&x| x == target)
> }
> 
> /// Unrolled 4-element chunk search simulating SIMD vector lanes.
> pub fn chunked_search(haystack: &[u64], target: u64) -> Option<usize> {
>     let chunks = haystack.chunks_exact(4);
>     let remainder = chunks.remainder();
> 
>     for (chunk_idx, chunk) in chunks.enumerate() {
>         let base_idx = chunk_idx * 4;
>         if chunk[0] == target { return Some(base_idx); }
>         if chunk[1] == target { return Some(base_idx + 1); }
>         if chunk[2] == target { return Some(base_idx + 2); }
>         if chunk[3] == target { return Some(base_idx + 3); }
>     }
> 
>     let base_idx = haystack.len() - remainder.len();
>     for (idx, &val) in remainder.iter().enumerate() {
>         if val == target {
>             return Some(base_idx + idx);
>         }
>     }

>     None
> }
> 
> /// Benchmarking loop measuring search throughput.
> pub fn run_search_benchmarks(haystack: &[u64], target: u64, iterations: usize) {
>     for _ in 0..iterations {
>         let res1 = linear_search(black_box(haystack), black_box(target));
>         black_box(res1);
> 
>         let res2 = chunked_search(black_box(haystack), black_box(target));
>         black_box(res2);
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_search_parity() {
>         let data: Vec<u64> = (0..100).collect();
> 
>         let target = 42;
>         let linear_idx = linear_search(&data, target);
>         let chunked_idx = chunked_search(&data, target);
> 
>         assert_eq!(linear_idx, Some(42));
>         assert_eq!(linear_idx, chunked_idx);
>         assert_ne!(linear_idx, None);
>     }
> 
>     #[test]
>     fn test_target_missing_and_remainder() {
>         let data = vec![10, 20, 30, 40, 50]; // 5 elements: 1 chunk of 4 + 1 remainder
> 
>         assert_eq!(chunked_search(&data, 50), Some(4));
>         assert_eq!(chunked_search(&data, 99), None);
>         assert_eq!(linear_search(&data, 99), None);
>     }
> }
> ```
> 
> **Technical Explanation:**
> 1. **Loop Unrolling & Cache Alignment**: `chunked_search` unrolls loop iterations, allowing instruction pipelining and SIMD vectorization.
> 2. **Benchmark Integrity**: Using `black_box` ensures the compiler does not optimize search loops away when testing populated slices.

---

### Exercise 3: In-Memory Mutex vs. Atomic Counter Throughput Benchmark

**Problem Statement:**
You are benchmarking thread synchronization primitives for high-concurrency event telemetry counters. You must compare an `AtomicU64` counter against a `Mutex<u64>` counter under multi-threaded contention.

Requirements:
1. Implement `benchmark_atomic_counter(threads: usize, ops_per_thread: usize) -> u64`.
2. Implement `benchmark_mutex_counter(threads: usize, ops_per_thread: usize) -> u64`.
3. In `#[cfg(test)] mod tests`, write unit tests asserting final counter totals match `threads * ops_per_thread` (`assert_eq!`, `assert!`).

> [!check]- Answer
> ```rust
> use std::hint::black_box;
> use std::sync::atomic::{AtomicU64, Ordering};
> use std::sync::{Arc, Mutex};
> use std::thread;
> 
> pub fn benchmark_atomic_counter(threads: usize, ops_per_thread: usize) -> u64 {
>     let counter = Arc::new(AtomicU64::new(0));
>     let mut handles = Vec::new();
> 
>     for _ in 0..threads {
>         let c = Arc::clone(&counter);
>         handles.push(thread::spawn(move || {
>             for _ in 0..ops_per_thread {
>                 c.fetch_add(black_box(1), Ordering::Relaxed);
>             }
>         }));
>     }
> 
>     for handle in handles {
>         handle.join().unwrap();
>     }
> 
>     counter.load(Ordering::SeqCst)
> }
> 
> pub fn benchmark_mutex_counter(threads: usize, ops_per_thread: usize) -> u64 {
>     let counter = Arc::new(Mutex::new(0u64));
>     let mut handles = Vec::new();
> 
>     for _ in 0..threads {
>         let c = Arc::clone(&counter);
>         handles.push(thread::spawn(move || {
>             for _ in 0..ops_per_thread {
>                 let mut guard = c.lock().unwrap();
>                 *guard += black_box(1);
>             }
>         }));
>     }
> 
>     for handle in handles {
>         handle.join().unwrap();
>     }
> 
>     let val = *counter.lock().unwrap();
>     val
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_concurrency_counter_correctness() {
>         let threads = 4;
>         let ops = 1000;
>         let expected = (threads * ops) as u64;
> 
>         let atomic_total = benchmark_atomic_counter(threads, ops);
>         let mutex_total = benchmark_mutex_counter(threads, ops);
> 
>         assert_eq!(atomic_total, expected);
>         assert_eq!(mutex_total, expected);
>         assert_eq!(atomic_total, mutex_total);
>     }
> }
> ```
> 
> **Technical Explanation:**
> 1. **Lock Contention Overhead**: Mutex locking involves OS context switches under high contention, whereas `AtomicU64` uses hardware atomic instructions (`LOCK XADD`).
> 2. **Verification**: Tests confirm both primitives yield identical, mathematically correct results without race conditions.

---

## 6. Related Terms

- [`[dependencies]`](../level_07/dependencies_section.md) — The file where `criterion` must be added under `[dev-dependencies]`.
- [`#[test]`](../level_08/test_attribute.md) — The correctness counterpart to benchmarking.

---

## 7. Key Takeaways

- Unit Tests check for correctness; **Benchmarks check for speed**.
- The standard tool for benchmarking in stable Rust is the external **`criterion`** crate.
- Benchmarks live in a `benches/` directory at the root of your project.
- You execute them by running **`cargo bench`** in the terminal.
- You **must** wrap inputs and outputs in `black_box()` to prevent the Rust compiler from deleting your benchmark code during optimization!
