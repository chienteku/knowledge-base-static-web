# `perf` / `flamegraph`

> **Level 15 — Performance & Optimization**
> Statistical CPU profiling tools (`perf` on Linux and `cargo-flamegraph`) used to sample running Rust binaries, record stack traces, and generate visual Flamegraphs to pinpoint CPU bottlenecks, cache misses, and hot functions.

---

## 1. Prerequisites


- [Release Profile](release_profile.md) — Configuring `[profile.release]` with `debug = true` for profiling symbol resolution.

---

## 2. Term Category

**Performance / Ecosystem / Tooling**: `perf` (the Linux kernel profiling subsystem) and `cargo-flamegraph` (the standard Rust Cargo extension) are non-invasive, sampling-based CPU profiling tools. Instead of adding manual benchmark timing statements to every function, profiling tools interrupt the CPU at high frequencies (e.g. 99 times per second), sample the active stack trace, and aggregate the samples into a visual **Flamegraph** (an interactive SVG chart where width corresponds to percentage of total CPU execution time spent in a function).

---

## 3. Environment Context

**CLI Tooling / Linux & macOS**: `perf` is built into Linux kernels. `cargo-flamegraph` is an open-source Rust cargo command (`cargo install flamegraph`) that wraps `perf` (on Linux) or `dtrace` (on macOS) to automatically compile, profile, and output `flamegraph.svg` for Rust binaries.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"

Donald Knuth famously wrote: *"Premature optimization is the root of all evil."*

When developers attempt to optimize Rust code based on intuition alone:
1. They waste hours hand-optimizing a function they *think* is slow, only to discover it accounts for 0.01% of total program execution time.
2. They miss the actual bottleneck — such as a hidden `String` clone inside a nested loop or a lock contention stall inside a thread pool.

Performance optimization requires **empirical measurement**.

CPU Profiling with `perf` and `flamegraph` solves this by giving developers an exact visual breakdown of CPU time:
- **Zero Code Modification**: You do NOT need to modify your Rust source code or add timing logs.
- **Whole-Program Sampling**: Records everything — user code, standard library allocations, third-party crate algorithms, and system calls.
- **Flamegraph Visualization**:
  - **Width**: The horizontal width of a box represents the percentage of total CPU time spent in that function (wider box = hotter function).
  - **Height**: The vertical stack depth represents the function call hierarchy (bottom = entrypoint `main`, top = active leaf function).

### (2) Reality Metaphor

Imagine a **Traffic Helicopter Thermal Imaging Camera over a City Highway**:

- **Manual `Instant::now()` Benchmarking** is like sending a human traffic surveyor to count cars at a single intersection: you get precise data for that 1 intersection, but have no idea if a 10-mile traffic jam is backed up 2 miles away.
- **`perf` / `flamegraph` Profiling** is an infra-red thermal camera mounted on a police helicopter flying over the entire city:
  - The camera captures heat maps of all roads simultaneously (**samples stack traces 99x/sec across all CPU cores**).
  - Bright red, wide thermal hotspots (**wide boxes in a Flamegraph**) instantly pinpoint where traffic is gridlocked (**which function is consuming 80% of CPU time**).
  - Engineers can zoom straight to the hotspot and fix the bottleneck immediately.

### (3) Code Examples

#### Short Snippet (Setting up `Cargo.toml` for Flamegraph Profiling)

```toml
# Cargo.toml

[package]
name = "profiled_app"
version = "0.1.0"
edition = "2021"

# Enable debug symbols in Release Profile for Flamegraph function name resolution
[profile.release]
opt-level = 3
debug = true # CRITICAL: Keeps function symbol names in release binary for flamegraph/perf!
```

#### Fuller Example (Simulating a Bottleneck for Flamegraph Analysis)

```rust
use std::collections::HashMap;

/// A intentionally un-optimized function (hot bottleneck)
fn slow_matrix_search(data: &[i32], target: i32) -> bool {
    // Bottleneck: Repeatedly allocating a HashMap on every call!
    let mut map = HashMap::new();
    for &val in data {
        map.insert(val, true);
    }
    map.contains_key(&target)
}

/// A fast linear search alternative
fn fast_linear_search(data: &[i32], target: i32) -> bool {
    data.contains(&target)
}

fn main() {
    let numbers: Vec<i32> = (0..5000).collect();

    println!("Running workload for Flamegraph sampling...");

    // Run workload in loop so `perf` / `flamegraph` can sample CPU execution
    for _ in 0..10_000 {
        // Bottleneck function consumes 95%+ of CPU time!
        let _ = slow_matrix_search(&numbers, 4999);
        let _ = fast_linear_search(&numbers, 4999);
    }

    println!("Workload completed.");
}
```

#### CLI Command Execution (`cargo-flamegraph`)

```bash
# 1. Install cargo-flamegraph tool once
cargo install flamegraph

# 2. Run flamegraph on the release binary (generates flamegraph.svg automatically)
cargo flamegraph

# 3. Open the generated interactive SVG file in any web browser
google-chrome flamegraph.svg
```

---

### Reading a Flamegraph

```
┌──────────────────────────────────────────────────────────┐
│  slow_matrix_search (92% of CPU time)                     │ ◄── WIDE BOX = HOT BOTTLENECK!
├──────────────────────────────────────────────────────────┤
│  main (98% of CPU time)                                  │
└──────────────────────────────────────────────────────────┘
```

- **X-Axis (Width)**: Shows percentage of total CPU time spent in each function. Wide boxes are hot functions; narrow boxes are fast.
- **Y-Axis (Height)**: Shows stack depth. The top box is the function currently executing on the CPU hardware when the sample was taken.
- **Color**: Colors are random warm hues (red, orange, yellow) used for visual differentiation; color intensity does NOT indicate temperature.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Running `cargo flamegraph` without `debug = true` in Release Profile

**The mistake:** Running `cargo flamegraph` on a release build where `[profile.release]` has `debug = false`.

**Why it's wrong:** Without debug symbols, `perf` cannot map raw CPU instruction addresses back to human-readable Rust function names. The generated Flamegraph will display useless hexadecimal addresses (`0x7fff_5f201a40`) instead of function names like `slow_matrix_search`.

*Incorrect:*
```toml
# ❌ Missing debug = true! Flamegraph will display hex memory addresses instead of function names.
[profile.release]
debug = false
```

*Fix:*
```toml
# Correct: Keep debug symbols in release profile for clean flamegraph labels
[profile.release]
debug = true
```

### Mistake 2: Profiling Debug Builds (`cargo build` without `--release`)

**The mistake:** Profiling un-optimized debug binaries and optimizing functions based on debug results.

**Why it's wrong:** Debug builds include un-inlined closure wrappers, un-optimized iterator overhead, and debug assertion checks. A bottleneck in a debug build (like an un-inlined getter method) usually vanishes completely when compiled in release mode. Always profile release builds.

### Mistake 3: Permission Denied Errors when Running `perf` on Linux

**The mistake:** Running `cargo flamegraph` on Linux and receiving `perf_event_open: Permission denied`.

**Why it's wrong:** Linux kernel security settings (`perf_event_paranoid`) restrict non-root users from sampling CPU performance counters.

*Fix:*
```bash
# Temporarily lower Linux perf paranoid level for the current session:
sudo sysctl -w kernel.perf_event_paranoid=-1
```

---

## 6. Practice Exercises

### Exercise 1: Diagnosing Heap Allocation Bottlenecks in Stream Data Processing

**Problem:**
You are developing a high-throughput network log ingestion engine in Rust that processes log lines formatted as `TIMESTAMP LEVEL COMPONENT MESSAGE STATUS`. A CPU sample profile produced by `cargo flamegraph` reveals that `alloc::alloc::alloc` and `core::fmt::format` account for **72% of total CPU execution time** (visible as a wide, hot block near the top of the sampling stack).

Inspection reveals the baseline parser allocates intermediate `String` objects for every token on every line:

```rust
// Unoptimized baseline parsing with excessive heap allocations
pub fn parse_log_line_alloc(line: &str) -> Option<(String, String, u16)> {
    let parts: Vec<String> = line.split(' ').map(|s| s.to_string()).collect();
    if parts.len() >= 5 {
        let level = parts[1].clone();
        let component = parts[2].clone();
        let status: u16 = parts[4].parse().ok()?;
        Some((level, component, status))
    } else {
        None
    }
}
```

Write a zero-copy, zero-allocation alternative `parse_log_line_zero_copy` returning borrowed string slices `(&str, &str, u16)` bound to the input lifetime `'a`. Create unit tests with assertions (`assert_eq!`) confirming both parsers return identical data for valid inputs and handle malformed inputs correctly. Explain how `cargo flamegraph` reflects the shift from heap-intensive execution to stack-only execution.

> [!check]- Answer
> **Problem Analysis & Profiling Strategy:**
> The `cargo flamegraph` profile highlights `alloc::alloc::alloc` as the primary CPU hotspot because `to_string()`, `collect::<Vec<_>>()`, and `.clone()` allocate dynamic memory on the heap for every single parsed line. Heap allocations involve OS kernel page checks and allocator synchronization locks, which swamp raw CPU string parsing logic. Optimizing this requires borrowing references (`&'a str`) directly from the original input string buffer without allocating heap memory.
>
> ```rust
> #[derive(Debug, PartialEq, Eq)]
> pub struct LogRecord<'a> {
>     pub level: &'a str,
>     pub component: &'a str,
>     pub status: u16,
> }
>
> /// Unoptimized baseline parser creating heap-allocated Strings and Vecs
> pub fn parse_log_line_alloc(line: &str) -> Option<(String, String, u16)> {
>     let parts: Vec<String> = line.split(' ').map(|s| s.to_string()).collect();
>     if parts.len() >= 5 {
>         let level = parts[1].clone();
>         let component = parts[2].clone();
>         let status: u16 = parts[4].parse().ok()?;
>         Some((level, component, status))
>     } else {
>         None
>     }
> }
>
> /// Optimized zero-copy parser returning borrowed string slices (&'a str)
> pub fn parse_log_line_zero_copy<'a>(line: &'a str) -> Option<LogRecord<'a>> {
>     let mut iter = line.split_whitespace();
>     let _timestamp = iter.next()?;
>     let level = iter.next()?;
>     let component = iter.next()?;
>     let _message = iter.next()?;
>     let status_str = iter.next()?;
>     let status: u16 = status_str.parse().ok()?;
>
>     Some(LogRecord {
>         level,
>         component,
>         status,
>     })
> }
>
> #[cfg(test)]
> mod tests {
>     use super::*;
>
>     #[test]
>     fn test_log_parser_equivalence() {
>         let raw_log = "2026-07-30T12:00:00Z WARN AUTH_SVC Login_Failed 401";
>         
>         let alloc_res = parse_log_line_alloc(raw_log).expect("Failed to parse alloc");
>         let zero_copy_res = parse_log_line_zero_copy(raw_log).expect("Failed to parse zero copy");
>         
>         // Verify extracted values are identical
>         assert_eq!(alloc_res.0, zero_copy_res.level);
>         assert_eq!(alloc_res.1, zero_copy_res.component);
>         assert_eq!(alloc_res.2, zero_copy_res.status);
>         assert_eq!(zero_copy_res.level, "WARN");
>         assert_eq!(zero_copy_res.component, "AUTH_SVC");
>         assert_eq!(zero_copy_res.status, 401);
>     }
>
>     #[test]
>     fn test_malformed_log_lines() {
>         let short_log = "2026-07-30T12:00:00Z INFO";
>         assert_eq!(parse_log_line_alloc(short_log), None);
>         assert_eq!(parse_log_line_zero_copy(short_log), None);
>         
>         let invalid_status = "2026-07-30T12:00:00Z ERROR NET_SVC Timeout INVALID_CODE";
>         assert_eq!(parse_log_line_alloc(invalid_status), None);
>         assert_eq!(parse_log_line_zero_copy(invalid_status), None);
>     }
> }
> ```
>
> **Explanation:**
> 1. **Flamegraph Signature Before Optimization:** In the original binary profiled with `cargo flamegraph`, the flamegraph shows a wide top bar representing `alloc::alloc::alloc` and `__rdl_alloc` sitting on top of `parse_log_line_alloc`. This indicates that the CPU spends most of its clock cycles managing heap metadata and memory allocation pointers rather than performing string parsing.
> 2. **Flamegraph Signature After Optimization:** In `parse_log_line_zero_copy`, iterator traversal operates entirely over pointer offsets within the existing `&'a str` slice. `alloc::alloc` disappears entirely from the flamegraph, and the box width for `parse_log_line_zero_copy` shrinks dramatically (often by 10x–20x), allowing overall throughput to scale linearly with CPU memory bandwidth.
> 3. **Symbol Resolution Requirement:** For `cargo flamegraph` to pinpoint `parse_log_line_alloc` versus standard library allocation routines, `Cargo.toml` must include `[profile.release] debug = true`. Without debug symbols, `perf` can only display raw memory addresses (`0x55a8f...`), rendering bottleneck identification impossible.

---

### Exercise 2: Identifying Algorithmic Hotspots in Telemetry Data Aggregation

**Problem:**
An embedded sensor gateway reads values from 8 dedicated telemetry sensors (IDs `0` through `7`). A CPU profiling sample with `cargo flamegraph` shows that `std::collections::hash_map::RandomState::build_hasher` and SipHash hashing routines occupy **65% of total execution time** inside the telemetry collection loop:

```rust
// Unoptimized baseline: using HashMap for a known, small, contiguous integer key range
use std::collections::HashMap;

pub struct TelemetryAggregatorHash {
    readings: HashMap<u8, f64>,
}

impl TelemetryAggregatorHash {
    pub fn new() -> Self {
        Self { readings: HashMap::new() }
    }
    pub fn record(&mut self, sensor_id: u8, value: f64) {
        self.readings.insert(sensor_id, value);
    }
    pub fn get_reading(&self, sensor_id: u8) -> Option<f64> {
        self.readings.get(&sensor_id).copied()
    }
}
```

Refactor this data structure into an optimized stack-allocated array implementation `TelemetryAggregatorArray` using `[Option<f64>; 8]` with zero hashing overhead. Write unit tests with assertions (`assert_eq!`) confirming both implementations maintain identical sensor states across multiple write and read operations. Explain how `cargo flamegraph` visualizes the complete elimination of hash function stack frames.

> [!check]- Answer
> **Problem Analysis & Profiling Strategy:**
> While `HashMap` provides $O(1)$ average time complexity, Rust's default `HashMap` uses `SipHash-1-3`, a cryptographically secure hashing algorithm designed to prevent Denial-of-Service attacks. For small, fixed integer keys (e.g. sensor IDs 0..7), computing a cryptographic hash on every lookup creates severe CPU overhead. Replacing `HashMap` with a direct array lookup (`[Option<f64>; 8]`) reduces lookup to a single array index offset operation.
>
> ```rust
> use std::collections::HashMap;
>
> /// Unoptimized baseline aggregator using HashMap
> pub struct TelemetryAggregatorHash {
>     readings: HashMap<u8, f64>,
> }
>
> impl TelemetryAggregatorHash {
>     pub fn new() -> Self {
>         Self { readings: HashMap::new() }
>     }
>     pub fn record(&mut self, sensor_id: u8, value: f64) {
>         self.readings.insert(sensor_id, value);
>     }
>     pub fn get_reading(&self, sensor_id: u8) -> Option<f64> {
>         self.readings.get(&sensor_id).copied()
>     }
> }
>
> /// Optimized array aggregator using direct index mapping for sensor IDs 0..7
> pub struct TelemetryAggregatorArray {
>     readings: [Option<f64>; 8],
> }
>
> impl TelemetryAggregatorArray {
>     pub fn new() -> Self {
>         Self { readings: [None; 8] }
>     }
>     pub fn record(&mut self, sensor_id: u8, value: f64) -> Result<(), &'static str> {
>         let index = sensor_id as usize;
>         if index < self.readings.len() {
>             self.readings[index] = Some(value);
>             Ok(())
>         } else {
>             Err("Sensor ID out of bounds")
>         }
>     }
>     pub fn get_reading(&self, sensor_id: u8) -> Option<f64> {
>         let index = sensor_id as usize;
>         if index < self.readings.len() {
>             self.readings[index]
>         } else {
>             None
>         }
>     }
> }
>
> #[cfg(test)]
> mod tests {
>     use super::*;
>
>     #[test]
>     fn test_telemetry_aggregator_equivalence() {
>         let mut hash_agg = TelemetryAggregatorHash::new();
>         let mut array_agg = TelemetryAggregatorArray::new();
>
>         let test_data = [(0u8, 23.5f64), (3u8, 98.6f64), (7u8, 101.3f64)];
>
>         for &(id, val) in &test_data {
>             hash_agg.record(id, val);
>             array_agg.record(id, val).expect("Recording failed");
>         }
>
>         for id in 0..8u8 {
>             assert_eq!(hash_agg.get_reading(id), array_agg.get_reading(id));
>         }
>
>         assert_eq!(array_agg.get_reading(3), Some(98.6));
>         assert_eq!(array_agg.get_reading(2), None);
>     }
>
>     #[test]
>     fn test_array_bounds_checking() {
>         let mut array_agg = TelemetryAggregatorArray::new();
>         assert!(array_agg.record(8, 50.0).is_err());
>         assert_eq!(array_agg.get_reading(8), None);
>     }
> }
> ```
>
> **Explanation:**
> 1. **Flamegraph Signature Shift:** In the unoptimized profile, `cargo flamegraph` depicts a tall stack hierarchy: `main` $\rightarrow$ `record` $\rightarrow$ `HashMap::insert` $\rightarrow$ `RandomState::build_hasher` $\rightarrow$ `SipHash::write_u8`. In the optimized version, array indexing compiles down to a single CPU instruction (`mov [rax + rbx*8], xmm0`). The stack depth collapses to 1, and the function box becomes virtually invisible in `flamegraph.svg`.
> 2. **Cache Locality:** Array storage `[Option<f64>; 8]` occupies contiguous stack memory (64 bytes, exactly 1 CPU L1 cache line). `HashMap`, in contrast, allocates table buckets dynamically across separate heap memory addresses, causing potential CPU L1/L2 cache misses during high-frequency lookups.

---

### Exercise 3: Analyzing Flamegraph Call Stack Depth (Flame Towers) in Dynamic Programming

**Problem:**
When profiling a fibonacci/cost-path calculation module with `cargo flamegraph`, the resulting `flamegraph.svg` displays an extremely tall, narrow pyramid (a "Flame Tower") where `fibonacci_recursive` stack frames stack vertically over 40 levels high, consuming **90% of overall CPU time** due to redundant branch recalculation and repeated function call overhead:

```rust
// Unoptimized naive recursive implementation creating deep flamegraph call stacks
pub fn fibonacci_recursive(n: u32) -> u64 {
    match n {
        0 => 0,
        1 => 1,
        _ => fibonacci_recursive(n - 1) + fibonacci_recursive(n - 2),
    }
}
```

Implement an optimized iterative dynamic programming version `fibonacci_iterative` with $O(N)$ time complexity and $O(1)$ stack space. Write unit tests with assertions (`assert_eq!`) validating output accuracy across multiple test inputs, including edge cases ($N=0, 1, 20$). Explain how Flamegraph Y-axis (stack depth) and X-axis (CPU time percentage) change after eliminating deep recursion.

> [!check]- Answer
> **Problem Analysis & Profiling Strategy:**
> In Flamegraphs:
> - **X-Axis (Width):** Represents the relative percentage of CPU execution time spent in a function. Naive recursion evaluates $O(2^N)$ branches, expanding the X-axis box width to cover nearly the entire profiling sample.
> - **Y-Axis (Height):** Represents the function call stack depth. Each recursive call pushes a new frame onto the stack, resulting in a tall vertical "flame tower".
> Iterative processing replaces recursion with a simple `for` loop, reducing time complexity from $O(2^N)$ to $O(N)$ and stack depth from $O(N)$ to $O(1)$.
>
> ```rust
> /// Naive recursive implementation (exponential time complexity & deep stack frame depth)
> pub fn fibonacci_recursive(n: u32) -> u64 {
>     match n {
>         0 => 0,
>         1 => 1,
>         _ => fibonacci_recursive(n - 1) + fibonacci_recursive(n - 2),
>     }
> }
>
> /// Optimized iterative dynamic programming implementation (linear time complexity & O(1) stack depth)
> pub fn fibonacci_iterative(n: u32) -> u64 {
>     if n == 0 {
>         return 0;
>     }
>     let mut a = 0u64;
>     let mut b = 1u64;
>     for _ in 2..=n {
>         let temp = a + b;
>         a = b;
>         b = temp;
>     }
>     b
> }
>
> #[cfg(test)]
> mod tests {
>     use super::*;
>
>     #[test]
>     fn test_fibonacci_correctness() {
>         let test_cases = vec![
>             (0, 0),
>             (1, 1),
>             (2, 1),
>             (3, 2),
>             (10, 55),
>             (20, 6765),
>             (30, 832040),
>         ];
>
>         for (input, expected) in test_cases {
>             assert_eq!(fibonacci_recursive(input), expected);
>             assert_eq!(fibonacci_iterative(input), expected);
>         }
>     }
>
>     #[test]
>     fn test_large_input_iterative() {
>         // Iterative can compute large inputs instantly without stack overflow or performance collapse
>         assert_eq!(fibonacci_iterative(50), 12586269025);
>     }
> }
> ```
>
> **Explanation:**
> 1. **Flamegraph Y-Axis Transformation:** In `fibonacci_recursive`, every invocation adds a frame to the call stack. For $N=40$, the flamegraph visualizes a 40-level-high vertical stack of `fibonacci_recursive` frames. In `fibonacci_iterative`, the stack depth is constant ($Y=1$ above `main`), completely flattening the flame tower.
> 2. **Flamegraph X-Axis Transformation:** Because `fibonacci_recursive` has exponential time complexity $O(2^N)$, it monopolizes the CPU during sampling, appearing as a massive wide block occupying >90% of the horizontal chart width. `fibonacci_iterative` executes in sub-microsecond time ($O(N)$), so its horizontal width in `flamegraph.svg` collapses to effectively 0% of the total workload profile.

---

## 7. Related Terms


- [Release Profile](release_profile.md) — Cargo build profile configured with `debug = true` for profiling.
- [Zero-Cost Abstractions](zero_cost_abstractions.md) — Core performance philosophy verified via profiling tools.
- [SIMD (`std::simd`)](simd.md) — Related concept: SIMD (`std::simd`).

---

## 8. Key Takeaways

- `perf` and `cargo-flamegraph` are non-invasive, sampling-based CPU profiling tools.
- Flamegraphs display stack traces visually: horizontal width = % of CPU runtime spent in function (wide = hot bottleneck); vertical height = stack call depth.
- Always profile release builds configured with `[profile.release]` `debug = true` to preserve human-readable function symbol labels.
- Install `cargo-flamegraph` via `cargo install flamegraph` and run `cargo flamegraph` to generate interactive `flamegraph.svg` files.
- On Linux, configure `kernel.perf_event_paranoid=-1` if `perf` returns permission denied errors.
