# The `Iterator` Trait

> **Level 5 — Rust**
> The core Rust trait defining lazy sequences via `fn next(&mut self) -> Option<Self::Item>`, enabling a rich ecosystem of adaptor methods like `map`, `filter`, and `collect`.

---

## 1. Prerequisites

- [Iterator](../level_02/iterator.md) — Core sequence iteration concept in Rust.
- [Trait](../level_04/trait.md) — Trait mechanism enabling sequence iteration.

---

## 2. Term Category



**Rust Core Trait (lazy sequence processing abstraction)**: `std::iter::Iterator` is Rust's foundational trait for lazy sequence processing. It defines an interface for consuming items sequentially (`.next()`) and provides over 70 default adaptor methods (`.map()`, `.filter()`, `.take()`, `.fold()`, `.collect()`) that allow declarative, zero-cost data processing pipelines.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Traditional imperative loops require manual index management (`for i in 0..len`), which introduces potential off-by-one errors, bounds-checking overhead on every iteration, and explicit mutation state.

Rust's `Iterator` solves this by introducing **lazy, push-or-pull sequence abstractions with zero-cost overhead**:
1. **Lazy Evaluation**: Iterator adaptors (`.map()`, `.filter()`, `.zip()`) perform zero computation and allocate no memory when constructed. Processing only happens when a terminal consumer (`.collect()`, `.sum()`, `.for_each()`, `.fold()`) pulls elements through the pipeline.
2. **Zero-Cost Abstractions**: The Rust compiler and LLVM optimize iterator pipelines aggressively. Bounds checks are eliminated because the iterator guarantees valid slice bounds internally. Pipeline stages are fused into a single tight loop in machine code, matching or surpassing manually tuned C loops.
3. **Unified Interface**: By implementing a single method (`fn next(&mut self) -> Option<Self::Item>`), custom data structures automatically gain access to standard combinators.

### (2) Deep Dive — Core Mechanics and Standard Trait Hierarchy

```rust
pub trait Iterator {
    type Item;
    fn next(&mut self) -> Option<Self::Item>;

    // 70+ provided default methods like map, filter, fold, etc.
}
```

- **`type Item`**: Associated type specifying the element type yielded on each step.
- **`fn next(&mut self)`**: Advances the iterator and returns `Some(element)` or `None` when exhausted.
- **Iterator Categories**:
  - `IntoIterator`: Types that can be converted into an iterator via `.into_iter()`.
  - `DoubleEndedIterator`: Supports pulling elements from both ends via `.next_back()`.
  - `ExactSizeIterator`: Iterators with a known, fixed length via `.len()`.
  - `FusedIterator`: Guarantees that once `.next()` returns `None`, all subsequent calls will also return `None`.

### (3) Reality Metaphor

An automated industrial water purification facility:
- Raw river water enters the system (`IntoIterator`).
- Dynamic filtration units (`.filter()`), chemical treatment modules (`.map()`), and mineral injectors (`.inspect()`) are wired together in a pipe network.
- **No water flows** through any stage until the city water main open valve (`.collect()`) pulls water from the end. Water is processed on demand, drop by drop, without storing intermediate pools.

### (4) Rust Code Examples

#### Short Snippet
```rust
let sum: i32 = vec![1, 2, 3].iter().map(|x| x * 2).sum();
assert_eq!(sum, 12);
```

#### Custom Iterator Implementation & Pipeline Fusion
```rust
/// A custom streaming sliding window average iterator over float slices
pub struct MovingAverage<'a> {
    slice: &'a [f64],
    window_size: usize,
    index: usize,
}

impl<'a> MovingAverage<'a> {
    pub fn new(slice: &'a [f64], window_size: usize) -> Self {
        Self { slice, window_size, index: 0 }
    }
}

impl<'a> Iterator for MovingAverage<'a> {
    type Item = f64;

    fn next(&mut self) -> Option<Self::Item> {
        if self.index + self.window_size > self.slice.len() {
            return None;
        }
        let window = &self.slice[self.index..self.index + self.window_size];
        let sum: f64 = window.iter().sum();
        self.index += 1;
        Some(sum / self.window_size as f64)
    }
}

fn main() {
    let data = vec![10.0, 20.0, 30.0, 40.0, 50.0];
    let averages: Vec<f64> = MovingAverage::new(&data, 3).collect();
    assert_eq!(averages, vec![20.0, 30.0, 40.0]);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Expecting Lazy Iterator Adaptors to Execute Without a Consumer

**The mistake:** Calling `.map()` or `.filter()` without invoking a terminal consumer like `.collect()`, `.for_each()`, or `.sum()`.

**Why it is wrong:** Iterator adaptors are lazy and construct a wrapper struct without evaluating elements. The compiler emits an `unused Iterator that must be used` warning, and side effects inside closures will never run.

*Incorrect:*
```rust
vec.iter().map(|x| println!("{x}")); // Warning: iterator adapter does nothing!
```

*Fix:*
```rust
vec.iter().for_each(|x| println!("{x}")); // Terminal consumer executes side-effects!
```

### Mistake 2: Confusing `.iter()`, `.iter_mut()`, and `.into_iter()`

**The mistake:** Using `.into_iter()` on a collection when shared or mutable references are needed, or using `.iter()` when ownership transfer is required.

**Why it is wrong:**
- `.iter()` borrows elements immutably, yielding `&T`.
- `.iter_mut()` borrows elements mutably, yielding `&mut T`.
- `.into_iter()` consumes ownership of the collection, yielding owned `T`.

*Incorrect:*
```rust
let names = vec!["Alice".to_string(), "Bob".to_string()];
for name in names.into_iter() {
    println!("{name}");
}
// println!("{:?}", names); // ❌ Error E0382: use of moved value `names`
```

*Fix:*
```rust
let names = vec!["Alice".to_string(), "Bob".to_string()];
for name in names.iter() {
    println!("{name}");
}
println!("{:?}", names); // Correct: names was only borrowed!
```

### Mistake 3: Creating Inefficient Intermediate Collections (`.collect::<Vec<_>>()`)

**The mistake:** Collecting into temporary `Vec` instances between chained iterator operations.

**Why it is wrong:** Allocates heap memory unnecessarily and breaks pipeline fusion, defeating zero-cost abstraction benefits.

*Incorrect:*
```rust
let temp: Vec<_> = data.iter().filter(|&&x| x > 0).collect();
let result: Vec<_> = temp.iter().map(|&&x| x * 2).collect(); // Double allocation!
```

*Fix:*
```rust
let result: Vec<_> = data.iter().filter(|&&x| x > 0).map(|&x| x * 2).collect(); // Single pipeline pass!
```

---

## 5. Practice Exercises

### Exercise 1: Real-Time HTTP Telemetry Stream Aggregator

**Scenario:** You are building an API gateway log analyzer that processes raw web server log entries. You need to parse incoming log records, filter out non-error HTTP status codes (< 400), strip ambient whitespace, calculate total error counts, and aggregate average response duration in milliseconds using a zero-allocation iterator pipeline.

**Requirements:**
1. Filter records where HTTP status code $\ge 400$.
2. Extract response latency from the payload using iterator combinators.
3. Compute total error count and average latency in a single pass using `.fold()` or iterator adaptors.
4. Write comprehensive unit tests for valid logs, empty logs, and logs with malformed records.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq)]
> pub struct TelemetrySummary {
>     pub total_errors: usize,
>     pub avg_latency_ms: f64,
> }
> 
> pub fn analyze_telemetry_logs(logs: &[&str]) -> TelemetrySummary {
>     let (total_errors, sum_latency) = logs
>         .iter()
>         .filter_map(|line| {
>             let mut parts = line.split_whitespace();
>             let _method = parts.next()?;
>             let _path = parts.next()?;
>             let status: u16 = parts.next()?.parse().ok()?;
>             let latency: f64 = parts.next()?.parse().ok()?;
>             
>             if status >= 400 {
>                 Some(latency)
>             } else {
>                 None
>             }
>         })
>         .fold((0, 0.0), |(count, sum), latency| (count + 1, sum + latency));
> 
>     let avg_latency_ms = if total_errors > 0 {
>         sum_latency / total_errors as f64
>     } else {
>         0.0
>     };
> 
>     TelemetrySummary {
>         total_errors,
>         avg_latency_ms,
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_telemetry_analysis() {
>         let logs = vec![
>             "GET /api/v1/health 200 12.5",
>             "POST /api/v1/checkout 500 250.0",
>             "GET /api/v1/users 404 45.0",
>             "PUT /api/v1/user 200 18.0",
>             "POST /api/v1/login 401 105.0",
>         ];
>         let summary = analyze_telemetry_logs(&logs);
>         assert_eq!(summary.total_errors, 3);
>         assert!((summary.avg_latency_ms - 133.333333).abs() < 1e-4);
>     }
> 
>     #[test]
>     fn test_empty_logs() {
>         let logs: Vec<&str> = vec![];
>         let summary = analyze_telemetry_logs(&logs);
>         assert_eq!(summary.total_errors, 0);
>         assert_eq!(summary.avg_latency_ms, 0.0);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `split_whitespace()` creates a zero-copy string slice iterator for tokenizing log fields without heap allocations.
> 2. `filter_map()` combines parsing and filtering: non-numeric inputs or status codes below 400 return `None` and are discarded gracefully.
> 3. `.fold((0, 0.0), ...)` aggregates running error count and cumulative latency in a single pipeline pass.
> 
---

### Exercise 2: Streaming Financial Ticker Sliding Window Iterator

**Scenario:** High-frequency trading systems require analyzing real-time stock price ticks over a rolling window. Implement a custom struct `SlidingWindowIter` that implements `Iterator` to yield rolling maximum price changes without re-allocating memory during iteration.

**Requirements:**
1. Create a struct `SlidingWindowIter<'a, T>` that wraps a slice `&'a [T]` and window size.
2. Implement `Iterator` yielding slice windows `&'a [T]`.
3. Provide helper adaptor logic to calculate maximum price spread across sliding windows.
4. Write unit tests testing various window sizes and edge cases.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub struct SlidingWindowIter<'a, T> {
>     data: &'a [T],
>     window_size: usize,
>     cursor: usize,
> }
> 
> impl<'a, T> SlidingWindowIter<'a, T> {
>     pub fn new(data: &'a [T], window_size: usize) -> Self {
>         Self {
>             data,
>             window_size,
>             cursor: 0,
>         }
>     }
> }
> 
> impl<'a, T> Iterator for SlidingWindowIter<'a, T> {
>     type Item = &'a [T];
> 
>     fn next(&mut self) -> Option<Self::Item> {
>         if self.window_size == 0 || self.cursor + self.window_size > self.data.len() {
>             None
>         } else {
>             let window = &self.data[self.cursor..self.cursor + self.window_size];
>             self.cursor += 1;
>             Some(window)
>         }
>     }
> }
> 
> pub fn max_window_spread(prices: &[f64], window_size: usize) -> Vec<f64> {
>     SlidingWindowIter::new(prices, window_size)
>         .filter_map(|win| {
>             let min = win.iter().copied().reduce(f64::min)?;
>             let max = win.iter().copied().reduce(f64::max)?;
>             Some(max - min)
>         })
>         .collect()
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_sliding_window_iterator() {
>         let prices = vec![100.0, 102.0, 101.0, 105.0, 104.0];
>         let spreads = max_window_spread(&prices, 3);
>         // Window 1: [100, 102, 101] -> max-min = 2
>         // Window 2: [102, 101, 105] -> max-min = 4
>         // Window 3: [101, 105, 104] -> max-min = 4
>         assert_eq!(spreads, vec![2.0, 4.0, 4.0]);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Custom struct stores lifetime `'a` borrowed from input slice, avoiding deep copy of ticker data.
> 2. `Iterator::next` advances internal cursor by 1 on each step, returning sub-slices `&'a [T]`.
> 3. Standard iterator methods like `.reduce()` compute min and max values zero-cost over window slices.
> 
---

### Exercise 3: Zero-Copy CSV Record Parser via Chained Iterator Combinators

**Scenario:** Build a fast CSV row decoder that parses line-delimited records into structured structs without allocating String buffers per field.

**Requirements:**
1. Given a CSV string slice, parse lines into field slices using `.split()`.
2. Skip header row using `.skip(1)`.
3. Filter invalid records and collect valid records into a final result vector.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq)]
> pub struct Record<'a> {
>     pub id: u64,
>     pub name: &'a str,
>     pub score: f32,
> }
> 
> pub fn parse_csv_records<'a>(csv_data: &'a str) -> Vec<Record<'a>> {
>     csv_data
>         .lines()
>         .skip(1)
>         .filter(|line| !line.trim().is_empty())
>         .filter_map(|line| {
>             let mut fields = line.split(',');
>             let id: u64 = fields.next()?.trim().parse().ok()?;
>             let name = fields.next()?.trim();
>             let score: f32 = fields.next()?.trim().parse().ok()?;
>             Some(Record { id, name, score })
>         })
>         .collect()
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_parse_csv() {
>         let raw_csv = "id,name,score\n1, Alice , 95.5\n2, Bob , 88.0\ninvalid,line,data\n3, Charlie , 92.3";
>         let records = parse_csv_records(raw_csv);
>         assert_eq!(records.len(), 3);
>         assert_eq!(records[0], Record { id: 1, name: "Alice", score: 95.5 });
>         assert_eq!(records[2], Record { id: 3, name: "Charlie", score: 92.3 });
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `csv_data.lines()` generates an iterator yielding line slices referencing the original string input buffer.
> 2. `.skip(1)` bypasses the header row lazily.
> 3. `.split(',')` extracts fields as borrowed `&'a str` slices without allocating heap strings.
> 
---

## 5. Related Terms

- None!

---

## 7. Key Takeaways

- `Iterator` requires implementing `type Item` and `fn next(&mut self) -> Option<Item>`.
- Iterator adaptors (`.map()`, `.filter()`) are lazy and execute zero work until consumed.
- Terminal consumers (`.collect()`, `.fold()`, `.sum()`, `.for_each()`) drive the pipeline.
- Rust iterator pipelines compile into zero-cost, bounds-check-free assembly loop machine code.
