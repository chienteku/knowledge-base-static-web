# Collecting

> **Level 2 — Control Flow & Data Structures**
> Converting an Iterator back into a concrete collection like `Vec`.

---

## 1. Prerequisites


- [Iterator](iterator.md) — The lazy sequence of items that `collect()` consumes.
- [`Vec<T>`](vec_t.md) — The most common collection that we collect *into*.
- [Type Annotation](../level_01/type_annotation.md) — Required because `collect` can build many different things, so you must explicitly tell it what to build.

---

## 2. Term Category

**Rust-specific (the explicitness)**: In languages like JavaScript, calling `array.map(...)` automatically returns a brand new array. In Rust, calling `.map(...)` returns a lazy Iterator that does absolutely nothing. You must explicitly call `.collect()` at the end of the chain to force the Iterator to run and package the results into a final data structure.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Why doesn't `.map()` just return a `Vec` automatically? Because Rust prioritizes ultimate performance and control. 

Creating a new `Vec` requires asking the operating system for Heap memory, which is a slow operation. What if you didn't actually want a `Vec`? What if you wanted to transform the data into a `HashMap`, a `HashSet`, or a `String`? What if you just wanted to find the `sum()` of the numbers, and didn't need a new collection at all? 

By keeping Iterators lazy, Rust allows you to chain a dozen operations together (map, filter, reverse) without allocating *any* memory. Then, you use `.collect()` exactly once at the very end to build the exact type of collection you need. It is highly optimized and perfectly explicit.

### (2) Reality Metaphor

Imagine a factory assembly line.

[Iterators](../level_02/iterator.md) and their methods (like `.map()` or `.filter()`) are the conveyor belts and robotic arms that modify the product. However, if there is no box at the end of the belt to catch the products, the factory boss refuses to turn the machine on. It just sits there, doing nothing (laziness).

**`.collect()`** is the act of putting a specific box at the end of the conveyor belt and pressing the "ON" switch. But because the factory makes many different types of boxes, you have to explicitly tell the boss *which* box you placed there (e.g., "I placed a `Vec` box here!").

### (3) Rust Code Examples

#### Short Snippet (The "Turbofish" Syntax)
Because `.collect()` can build almost anything, the compiler usually needs you to specify the type. The most common way is using the "Turbofish" syntax: `::<>`.
```rust
fn main() {
    let numbers = vec![1, 2, 3];
    
    // `.iter()` borrows the data.
    // `.map()` transforms it, but does nothing yet.
    // `.collect()` turns the machine on and builds a new Vec!
    let doubled = numbers.iter().map(|x| x * 2).collect::<Vec<i32>>();
    
    println!("{:?}", doubled); // [2, 4, 6]
}
```

#### Fuller Example (Variable Annotation vs Turbofish)
You can tell the compiler what "box" to use in two different ways.
```rust
fn main() {
    let words = vec!["hello", "world"];
    
    // Method 1: Variable Type Annotation
    // We tell the variable `shouted` that it will be a `Vec<String>`.
    // The compiler reads this and tells `.collect()` to build a `Vec<String>`.
    let shouted: Vec<String> = words.iter().map(|w| w.to_uppercase()).collect();
    
    // Method 2: The Turbofish `::<T>`
    // We attach the type directly to the `.collect()` method call.
    // Notice the `_`! We can tell the compiler "Build a Vec, but you figure out what goes inside it."
    let shouted2 = words.iter().map(|w| w.to_uppercase()).collect::<Vec<_>>();
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Collecting Scoping and Lifecycle Rules

**The mistake:** Assuming Collecting instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("collecting_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("collecting_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Collecting State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Collecting through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Collecting Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Collecting instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Real-Time Network Packet Telemetry Aggregator

**Problem:**
In a high-throughput network monitoring service, raw telemetry streams arrive as string records formatted as `"<node_id>:<bytes_transferred>:<latency_ms>"`. Corrupted lines (incorrect field counts or non-numeric values) must be filtered out without breaking stream processing.

Implement a function `parse_and_aggregate_telemetry` that accepts an iterator over raw string slices (`impl IntoIterator<Item = &'a str>`). It must perform the following:
1. Parse each line into key-value pairs `(String, MetricSample)`. Use `filter_map` and `.collect()` or `fold` to group metric samples by `node_id` into an intermediate `HashMap<String, Vec<MetricSample>>`.
2. Convert the grouped map into a final `HashMap<String, NodeAggregate>` using `.collect::<HashMap<String, NodeAggregate>>()`, calculating `total_bytes`, `max_latency_ms`, and total `sample_count` per node.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::HashMap;
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct MetricSample {
>     pub bytes: u64,
>     pub latency_ms: u32,
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct NodeAggregate {
>     pub total_bytes: u64,
>     pub max_latency_ms: u32,
>     pub sample_count: usize,
> }
> 
> pub fn parse_and_aggregate_telemetry<'a>(
>     raw_logs: impl IntoIterator<Item = &'a str>,
> ) -> HashMap<String, NodeAggregate> {
>     // Step 1: Filter out invalid lines, parse samples, and group by node_id
>     let samples_by_node: HashMap<String, Vec<MetricSample>> = raw_logs
>         .into_iter()
>         .filter_map(|line| {
>             let parts: Vec<&str> = line.trim().split(':').collect();
>             if parts.len() != 3 {
>                 return None;
>             }
>             let node_id = parts[0].to_string();
>             let bytes = parts[1].parse::<u64>().ok()?;
>             let latency_ms = parts[2].parse::<u32>().ok()?;
>             Some((node_id, MetricSample { bytes, latency_ms }))
>         })
>         .fold(HashMap::new(), |mut acc, (node_id, sample)| {
>             acc.entry(node_id).or_default().push(sample);
>             acc
>         });
> 
>     // Step 2: Transform grouped samples into aggregate statistics map via .collect()
>     samples_by_node
>         .into_iter()
>         .map(|(node_id, samples)| {
>             let total_bytes: u64 = samples.iter().map(|s| s.bytes).sum();
>             let max_latency_ms: u32 = samples.iter().map(|s| s.latency_ms).max().unwrap_or(0);
>             let sample_count = samples.len();
>             (
>                 node_id,
>                 NodeAggregate {
>                     total_bytes,
>                     max_latency_ms,
>                     sample_count,
>                 },
>             )
>         })
>         .collect::<HashMap<String, NodeAggregate>>()
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_telemetry_aggregation() {
>         let logs = vec![
>             "node-1:1024:12",
>             "node-2:2048:45",
>             "node-1:512:8",
>             "corrupted_line_without_colons",
>             "node-2:1024:90",
>             "node-3:bad_bytes:15",
>         ];
> 
>         let agg = parse_and_aggregate_telemetry(logs);
> 
>         assert_eq!(agg.len(), 2);
>         assert!(agg.contains_key("node-1"));
>         assert!(agg.contains_key("node-2"));
>         assert_ne!(agg.contains_key("node-3"), true);
> 
>         let node1 = agg.get("node-1").unwrap();
>         assert_eq!(node1.total_bytes, 1536);
>         assert_eq!(node1.max_latency_ms, 12);
>         assert_eq!(node1.sample_count, 2);
> 
>         let node2 = agg.get("node-2").unwrap();
>         assert_eq!(node2.total_bytes, 3072);
>         assert_eq!(node2.max_latency_ms, 90);
> 
>         assert!(matches!(agg.get("node-1"), Some(NodeAggregate { sample_count: 2, .. })));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Data Pipeline & Lazy Execution**: The string parsing step leverages `filter_map`. Each input line is parsed into `Option<(String, MetricSample)>` using `str::split` and `str::parse`. By returning `None` for malformed lines or parse failures, `filter_map` lazily drops invalid items without panicking.
> 2. **Collecting Key-Value Pairs into HashMaps**: `Iterator::collect()` requires an explicit collection type because `collect()` can produce any type implementing `FromIterator`. In Step 2, calling `.collect::<HashMap<String, NodeAggregate>>()` drives the iterator to consume key-value tuples `(String, NodeAggregate)` and insert them directly into the hash map.
> 3. **Ownership and Memory Lifetime**: String slices `&'a str` are owned by the caller. When building `HashMap<String, NodeAggregate>`, new owned `String` keys are constructed via `.to_string()`, transferring exclusive heap ownership into the returned `HashMap`.
> 4. **Edge Cases**: Empty logs or inputs containing only corrupted lines yield an empty `HashMap`. Zero-latency or single-sample cases are handled cleanly by `unwrap_or(0)` and `samples.len()`.

---

### Exercise 2: Fail-Fast Financial Batch Processor vs Complete Audit Partition Collector

**Problem:**
A financial transaction engine receives raw batches of incoming payment requests (`RawTransaction`). Each record must be validated against business rules: non-empty account identifier, positive transfer amount in cents, and supported currency code (`"USD"` or `"EUR"`).

The system requires two distinct processing strategies powered by Rust collection idioms:
1. **Fail-Fast Engine (`process_batch_fail_fast`)**: Collects an iterator of `Result<ValidatedTransaction, ValidationError>` into `Result<Vec<ValidatedTransaction>, ValidationError>`. If any single transaction fails validation, `.collect()` must halt evaluation immediately (fail-fast) and return the first encountered error.
2. **Audit Partitioning Engine (`process_batch_audit`)**: Uses `Iterator::partition` to separate all results into a tuple `(Vec<ValidatedTransaction>, Vec<ValidationError>)`, capturing all valid transactions for execution while archiving all validation errors for auditing.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct RawTransaction {
>     pub id: u64,
>     pub account: String,
>     pub amount_cents: i64,
>     pub currency: String,
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct ValidatedTransaction {
>     pub id: u64,
>     pub account: String,
>     pub amount_cents: u64,
>     pub currency: String,
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub enum ValidationError {
>     EmptyAccount { id: u64 },
>     InvalidAmount { id: u64, amount: i64 },
>     UnsupportedCurrency { id: u64, currency: String },
> }
> 
> pub fn validate_transaction(raw: RawTransaction) -> Result<ValidatedTransaction, ValidationError> {
>     if raw.account.trim().is_empty() {
>         return Err(ValidationError::EmptyAccount { id: raw.id });
>     }
>     if raw.amount_cents <= 0 {
>         return Err(ValidationError::InvalidAmount { id: raw.id, amount: raw.amount_cents });
>     }
>     if raw.currency != "USD" && raw.currency != "EUR" {
>         return Err(ValidationError::UnsupportedCurrency { id: raw.id, currency: raw.currency });
>     }
> 
>     Ok(ValidatedTransaction {
>         id: raw.id,
>         account: raw.account,
>         amount_cents: raw.amount_cents as u64,
>         currency: raw.currency,
>     })
> }
> 
> // Strategy 1: Fail-fast collecting into Result<Vec<T>, E>
> pub fn process_batch_fail_fast(
>     batch: Vec<RawTransaction>,
> ) -> Result<Vec<ValidatedTransaction>, ValidationError> {
>     batch.into_iter().map(validate_transaction).collect()
> }
> 
> // Strategy 2: Full audit partition into (Vec<T>, Vec<E>)
> pub fn process_batch_audit(
>     batch: Vec<RawTransaction>,
> ) -> (Vec<ValidatedTransaction>, Vec<ValidationError>) {
>     let (oks, errs): (Vec<_>, Vec<_>) = batch
>         .into_iter()
>         .map(validate_transaction)
>         .partition(Result::is_ok);
> 
>     let valid = oks.into_iter().map(Result::unwrap).collect();
>     let invalid = errs.into_iter().map(Result::unwrap_err).collect();
> 
>     (valid, invalid)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_fail_fast_and_audit_collecting() {
>         let valid_tx1 = RawTransaction { id: 1, account: "acc_101".into(), amount_cents: 5000, currency: "USD".into() };
>         let invalid_tx2 = RawTransaction { id: 2, account: "".into(), amount_cents: 1000, currency: "USD".into() };
>         let invalid_tx3 = RawTransaction { id: 3, account: "acc_103".into(), amount_cents: -50, currency: "USD".into() };
>         let valid_tx4 = RawTransaction { id: 4, account: "acc_104".into(), amount_cents: 2500, currency: "EUR".into() };
> 
>         let batch_mixed = vec![valid_tx1.clone(), invalid_tx2.clone(), invalid_tx3.clone(), valid_tx4.clone()];
> 
>         // Fail-fast test: stops on first error (id 2)
>         let fail_fast_res = process_batch_fail_fast(batch_mixed.clone());
>         assert!(fail_fast_res.is_err());
>         assert_ne!(fail_fast_res.is_ok(), true);
>         assert!(matches!(
>             fail_fast_res,
>             Err(ValidationError::EmptyAccount { id: 2 })
>         ));
> 
>         // Fail-fast test: all valid transactions
>         let batch_valid = vec![valid_tx1.clone(), valid_tx4.clone()];
>         let fail_fast_ok = process_batch_fail_fast(batch_valid);
>         assert!(fail_fast_ok.is_ok());
>         let valid_res = fail_fast_ok.unwrap();
>         assert_eq!(valid_res.len(), 2);
>         assert_eq!(valid_res[0].id, 1);
>         assert_eq!(valid_res[1].amount_cents, 2500);
> 
>         // Audit mode test: partitions all records into valid and error lists
>         let (valid_txs, invalid_errors) = process_batch_audit(batch_mixed);
>         assert_eq!(valid_txs.len(), 2);
>         assert_eq!(invalid_errors.len(), 2);
>         assert_eq!(valid_txs[0].id, 1);
>         assert_eq!(valid_txs[1].id, 4);
> 
>         assert!(matches!(invalid_errors[0], ValidationError::EmptyAccount { id: 2 }));
>         assert!(matches!(invalid_errors[1], ValidationError::InvalidAmount { id: 3, amount: -50 }));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Result Short-Circuiting in `FromIterator`**: Rust provides a standard implementation `impl<T, E, V> FromIterator<Result<T, E>> for Result<V, E> where V: FromIterator<T>`. When collecting an iterator of `Result<T, E>`, iteration stops upon the first `Err(e)` encountered. Remaining elements are not evaluated, providing strict $O(k)$ fail-fast guarantees where $k$ is the index of the first failure.
> 2. **Partitioning Iterators**: `Iterator::partition` splits an iterator into two collections based on a predicate closure (`Result::is_ok`). Because `partition` collects both sides simultaneously into a tuple `(A, B)`, it consumes the source batch in a single pass without extra memory allocations beyond the output vectors.
> 3. **Ownership and Value Transfer**: `into_iter()` transfers full ownership of `RawTransaction` structs from the input vector. Validated instances wrap owned `String` fields without intermediate string cloning or allocations.
> 4. **Edge Cases**: Empty transaction batches collect cleanly into `Ok(vec![])` or `(vec![], vec![])`. Large batches short-circuit immediately on early errors, optimizing memory and throughput.

---

### Exercise 3: High-Performance Log Indexer via Custom `FromIterator` Implementation

**Problem:**
In search engine tokenizers and log indexers, streaming text tokens are frequently parsed and collected into term frequency statistics. Rather than building custom looping constructs across calling code, Rust allows custom types to participate directly in `.collect()` by implementing `std::iter::FromIterator`.

Implement a domain data structure `TokenHistogram` and its `FromIterator<S>` trait for any type `S: Into<String>` (handling string slices `&str` and owned `String`s seamlessly).
Requirements:
1. Maintain internal term frequencies in a `HashMap<String, usize>` and track `total_tokens`.
2. Implement `FromIterator<S>` so calling `stream.collect::<TokenHistogram>()` or `let histogram: TokenHistogram = stream.collect()` populates the struct automatically.
3. Provide inspectable methods: `total_tokens(&self) -> usize`, `unique_tokens(&self) -> usize`, `frequency(&self, token: &str) -> usize`, and `top_n(&self, n: usize) -> Vec<(&str, usize)>`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::HashMap;
> use std::iter::FromIterator;
> 
> #[derive(Debug, Clone, PartialEq, Eq, Default)]
> pub struct TokenHistogram {
>     counts: HashMap<String, usize>,
>     total_tokens: usize,
> }
> 
> impl TokenHistogram {
>     pub fn new() -> Self {
>         Self::default()
>     }
> 
>     pub fn total_tokens(&self) -> usize {
>         self.total_tokens
>     }
> 
>     pub fn unique_tokens(&self) -> usize {
>         self.counts.len()
>     }
> 
>     pub fn frequency(&self, token: &str) -> usize {
>         self.counts.get(token).copied().unwrap_or(0)
>     }
> 
>     pub fn top_n(&self, n: usize) -> Vec<(&str, usize)> {
>         let mut entries: Vec<(&str, usize)> = self
>             .counts
>             .iter()
>             .map(|(k, v)| (k.as_str(), *v))
>             .collect();
>         entries.sort_by(|a, b| b.1.cmp(&a.1).then_with(|| a.0.cmp(b.0)));
>         entries.truncate(n);
>         entries
>     }
> }
> 
> // Implement FromIterator to allow direct .collect() invocation into TokenHistogram
> impl<S: Into<String>> FromIterator<S> for TokenHistogram {
>     fn from_iter<T: IntoIterator<Item = S>>(iter: T) -> Self {
>         let mut histogram = TokenHistogram::new();
>         for item in iter {
>             let token: String = item.into();
>             if !token.is_empty() {
>                 *histogram.counts.entry(token).or_insert(0) += 1;
>                 histogram.total_tokens += 1;
>             }
>         }
>         histogram
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_custom_from_iterator_histogram() {
>         let raw_text = "rust memory safety concurrency rust performance rust memory";
> 
>         // Collect iterator of &str directly into TokenHistogram using collect()
>         let histogram: TokenHistogram = raw_text.split_whitespace().collect();
> 
>         assert_eq!(histogram.total_tokens(), 7);
>         assert_eq!(histogram.unique_tokens(), 4);
>         assert_ne!(histogram.total_tokens(), 0);
> 
>         assert_eq!(histogram.frequency("rust"), 3);
>         assert_eq!(histogram.frequency("memory"), 2);
>         assert_eq!(histogram.frequency("safety"), 1);
>         assert_eq!(histogram.frequency("missing_word"), 0);
> 
>         let top2 = histogram.top_n(2);
>         assert_eq!(top2.len(), 2);
>         assert_eq!(top2[0], ("rust", 3));
>         assert_eq!(top2[1], ("memory", 2));
> 
>         assert!(matches!(histogram.top_n(1).first(), Some(&("rust", 3))));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Extending the `.collect()` Capability via `FromIterator`**: In Rust, `.collect()` is a generic method parameterized on `FromIterator::from_iter`. Implementing `FromIterator<S>` for a custom type `TokenHistogram` allows any iterator yielding items convertible to `String` (`S: Into<String>`) to be collected seamlessly.
> 2. **Generic Flexibility (`S: Into<String>`)**: By using the trait bound `S: Into<String>`, `TokenHistogram` can collect from iterators over borrowed string slices `&str` (such as `split_whitespace()`) as well as owned `String` streams without needing duplicate trait implementations.
> 3. **Frequency Ranking & Memory Efficiency**: The `top_n` method creates borrowed tuples `(&str, usize)` referencing internal map keys `&String`, avoiding unnecessary allocations when querying rankings. Sorting uses `b.1.cmp(&a.1)` for descending frequency and `a.0.cmp(b.0)` for deterministic alphabetical tie-breaking.
> 4. **Edge Cases**: Empty tokens (`""`) are skipped during insertion. An empty stream produces a valid `TokenHistogram` with `total_tokens == 0` and `unique_tokens == 0`.

---

## 6. Related Terms


- [Iterator](iterator.md) — The underlying system that makes `.collect()` possible.
- [Closure](../level_06/closure.md) — The anonymous inline functions (like `|x| x * 2`) used inside `.map()` and `.filter()`.
- [`FromIterator` / `Extend` Traits](fromiterator_extend_traits.md) — Related concept: `FromIterator` / `Extend` Traits.
- [Iterator Adapters](iterator_adapters.md) — Related concept: Iterator Adapters.
- [`Iterator` Consumers (`fold`, `reduce`, `sum`, `product`, `count`, `any`, `all`, `find`, `position`)](iterator_consumers.md) — Related concept: `Iterator` Consumers (`fold`, `reduce`, `sum`, `product`, `count`, `any`, `all`, `find`, `position`).
- [Lazy Evaluation](../level_06/lazy_evaluation.md) — Related concept: Lazy Evaluation.
- [Turbofish (`::<>`)](../level_06/turbofish.md) — Related concept: Turbofish (`::<>`).

---

## 7. Key Takeaways

- Iterators are lazy; `.collect()` is the "consumer" that actually turns the machine on and gathers the final results.
- Because `.collect()` is incredibly powerful and can build *many* types of collections (Vecs, HashMaps, Strings), you **must** tell the compiler what type you want.
- You can provide the type via variable annotation (`let x: Vec<i32> = ...`) or the turbofish syntax (`.collect::<Vec<i32>>()`).
- An underscore `_` can be used inside the turbofish (`::<Vec<_>>`) to let the compiler automatically guess the inner data type, saving you typing!
