# `Duration` and `Instant`

> **Level 1 — Rust**
> `std::time::Duration` (a span of time) and `std::time::Instant` (a monotonic, high-precision point in time for performance measurement).

---

## 1. Prerequisites

- [Scalar Types](scalar_types.md) — Primitive integer types.

---

## 2. Term Category



**Rust Standard Library (monotonic time & measurement)**: `std::time::Duration` representing elapsed time spans and `std::time::Instant` for monotonic clock timing.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Measuring algorithm execution speed or timing out operations using wall-clock system time is unreliable because operating system clocks can shift backwards due to Network Time Protocol (NTP) adjustments.

Rust provides `Instant` (a monotonic clock point guaranteed to move forward continuously, immune to system time adjustments) and `Duration` (a span of time measured in seconds and nanoseconds). They enable high-precision scope profiling and execution benchmarking.

### (2) Reality Metaphor

A race track stopwatch (`Instant`) vs. a wall clock: the wall clock can be adjusted backwards for daylight savings time, but the race referee's digital stopwatch only counts forward continuously (`Duration`).

### (3) Rust Code Examples

#### Short Snippet
```rust
use std::time::{Duration, Instant};
let start = Instant::now();
let elapsed: Duration = start.elapsed();
```

#### Fuller Example
```rust
use std::thread;
use std::time::{Duration, Instant};

pub fn profile_task(ms: u64) -> Duration {
    let start = Instant::now();
    thread::sleep(Duration::from_millis(ms));
    start.elapsed()
}

fn main() {
    let elapsed = profile_task(10);
    assert!(elapsed >= Duration::from_millis(10));
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Subtracting Instants in Reverse Order (Panic on Negative Duration)

**The mistake:** Subtracting a later `Instant` from an earlier `Instant` using `earlier - later`.

**Why it is wrong:** `Instant` subtraction panics if the second instant occurs after the first. Use `.checked_duration_since()` or `start.elapsed()`.

*Incorrect:*
```rust
let d = start_time - Instant::now(); // Panics if start_time is in the past!
```

*Fix:*
```rust
let d = Instant::now().duration_since(start_time); // Correct!
```

### Mistake 2: Using `SystemTime` for Benchmark Time Measurement

**The mistake:** Using `std::time::SystemTime::now()` to benchmark function execution speed.

**Why it is wrong:** `SystemTime` reads host OS wall-clock time which can jump backwards during NTP clock synchronization, causing negative elapsed time errors.

*Incorrect:*
```rust
let start = SystemTime::now(); // Vulnerable to NTP adjustments!
```

*Fix:*
```rust
let start = Instant::now(); // Monotonic clock guaranteed to move forward!
```

### Mistake 3: Forgetting `Duration` Precision Unit Constructors

**The mistake:** Manually multiplying floating point seconds to compute millisecond durations.

**Why it is wrong:** Error-prone and introduces floating point rounding inaccuracies.

*Incorrect:*
```rust
let d = Duration::from_secs_f64(0.005);
```

*Fix:*
```rust
let d = Duration::from_millis(5); // Clean explicit constructor!
```

---

## 5. Practice Exercises

### Exercise 1: Scope Execution Benchmarking Utility

**Scenario:** Build an execution profiler `benchmark_execution<F, R>(f: F) -> (R, Duration)` timing closure execution speed.

**Requirements:**
1. Accept generic closure `F: FnOnce() -> R`.
1. Record `Instant::now()`.
1. Return execution result and `Duration`.
1. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::time::{Duration, Instant};
> 
> pub fn benchmark_execution<F, R>(f: F) -> (R, Duration)
> where
>     F: FnOnce() -> R,
> {
>     let start = Instant::now();
>     let result = f();
>     let elapsed = start.elapsed();
>     (result, elapsed)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
>     use std::thread;
> 
>     #[test]
>     fn test_benchmark_profiler() {
>         let (res, elapsed) = benchmark_execution(|| {
>             thread::sleep(Duration::from_millis(5));
>             42
>         });
>         assert_eq!(res, 42);
>         assert!(elapsed >= Duration::from_millis(5));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Uses `Instant::now()` monotonic clock to measure execution time accurately.
> 2. Returns result payload alongside high-precision `Duration`.

---

### Exercise 2: Deadline Expiration Checker

**Scenario:** Implement a deadline expiration checker `Deadline` initialized with a maximum duration allowance.

**Requirements:**
1. Define `Deadline` with target `Instant`.
1. Implement `is_expired(&self) -> bool`.
1. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::time::{Duration, Instant};
> 
> pub struct Deadline {
>     target: Instant,
> }
> 
> impl Deadline {
>     pub fn starting_from_now(timeout: Duration) -> Self {
>         Self {
>             target: Instant::now() + timeout,
>         }
>     }
> 
>     pub fn is_expired(&self) -> bool {
>         Instant::now() >= self.target
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_deadline_checker() {
>         let dl = Deadline::starting_from_now(Duration::from_millis(10));
>         assert!(!dl.is_expired());
>         std::thread::sleep(Duration::from_millis(15));
>         assert!(dl.is_expired());
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Adds `Duration` to `Instant` to compute future deadline target monotonic points.

---

### Exercise 3: Duration Unit Formatter

**Scenario:** Build a human-readable duration formatter `format_duration(d: Duration) -> String` converting durations into formatted strings.

**Requirements:**
1. Format milliseconds, microseconds, or seconds.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::time::Duration;
> 
> pub fn format_duration(d: Duration) -> String {
>     if d.as_secs() > 0 {
>         format!("{:.2}s", d.as_secs_f64())
>     } else if d.as_millis() > 0 {
>         format!("{}ms", d.as_millis())
>     } else {
>         format!("{}us", d.as_micros())
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_duration_formatter() {
>         assert_eq!(format_duration(Duration::from_millis(250)), "250ms");
>         assert_eq!(format_duration(Duration::from_secs(2)), "2.00s");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Uses `Duration` unit accessors (`as_millis()`, `as_secs_f64()`).

---

## 5. Related Terms

- [`std::thread::spawn`](../level_09/std_thread_spawn.md) — Thread sleep and timing operations.

---

## 7. Key Takeaways

- `Instant` represents a monotonic clock point immune to OS time shifts.
- `Duration` represents a span of time measured in seconds and nanoseconds.
- Use `Instant` for benchmarking, profiling, and timeout calculations.
- Use `SystemTime` only when calendar date/time formatting is required.
