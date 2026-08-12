# Iterator Chains

> **Level 6 — Closures & Functional Patterns**
> Composing `.map()`, `.filter()`, `.flat_map()`, `.fold()`, etc. for expressive data pipelines.

---

## 1. Prerequisites


- [Iterator](../level_02/iterator.md) — The core trait that makes these chains possible.
- [Closures (`|args| body`)](closure.md) — The tiny anonymous functions that are passed into the chain links.
- [Iterator Adapters](../level_02/iterator_adapters.md) — Methods like `.map()` and `.filter()` that are linked together to form the chain.

---

## 2. Term Category

**Rust Idiom (declarative processing pipelines)**: An **Iterator Chain** is a functional composition pattern in Rust where multiple lazy iterator adapters (`.map()`, `.filter()`, `.flat_map()`, `.zip()`) are chained together into a single zero-cost pipeline driven by a terminal consumer (`.collect()`, `.fold()`, `.sum()`).

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Traditional imperative loops processing complex data require manual state mutation, index management, nested `if/else` checks, and temporary vector allocations.

Iterator chains provide a declarative syntax where transformations are expressed as pure functions:
1. **Zero-Cost Abstractions**: The LLVM compiler monomorphizes and inline-expands iterator chain closures, eliminating intermediate heap allocations and unrolling loops to run as fast as hand-optimized C assembly.
2. **Bounds Check Elimination**: Because iterator chains operate on internal pointer bounds rather than indexed subscript access (`vec[i]`), LLVM can completely eliminate runtime array bounds checks.
3. **Lazy Fusion**: Adapter steps (`.map(f1).map(f2).filter(f3)`) are fused together in a single item-by-item pass rather than creating temporary array buffers for each step.

### (2) Reality Metaphor

- **Imperative `for` loop**: A factory where a worker picks up a raw part, walks it to machine 1, waits, walks it to machine 2, waits, and puts it in a crate manually.
- **Iterator Chain**: A fully automated conveyor belt assembly line. Parts move smoothly through machine 1 (`.filter()`) directly into machine 2 (`.map()`) and drop into the shipping container (`.collect()`) in a continuous stream.

### (3) Rust Code Examples

#### Imperative Loop vs Declarative Iterator Chain
```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // Imperative approach (verbose state mutation)
    let mut imperative_res = Vec::new();
    for &n in &numbers {
        if n % 2 == 0 {
            imperative_res.push(n * n);
        }
    }

    // Declarative Iterator Chain (zero extra allocation)
    let chain_res: Vec<i32> = numbers
        .iter()
        .filter(|&&n| n % 2 == 0)
        .map(|&n| n * n)
        .collect();

    assert_eq!(imperative_res, chain_res);
}
```

#### Complex Multi-Stage Pipeline (`filter_map` + `flat_map` + `fold`)
```rust
fn main() {
    let raw_logs = vec![
        "2026-08-01 INFO status=200 path=/index.html",
        "2026-08-01 ERROR status=500 path=/checkout",
        "invalid log line",
        "2026-08-01 ERROR status=503 path=/payment",
    ];

    let error_paths: Vec<&str> = raw_logs
        .into_iter()
        .filter(|line| line.contains("ERROR"))
        .filter_map(|line| {
            line.split_whitespace()
                .find(|part| part.starts_with("path="))
                .map(|p| &p[5..])
        })
        .collect();

    assert_eq!(error_paths, vec!["/checkout", "/payment"]);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Collecting Intermediate Allocations Between Chain Steps

**The mistake:** Calling `.collect::<Vec<_>>()` after every single intermediate adapter step in a processing pipeline.

**Why it is wrong:** Allocates multiple redundant heap vectors. Keep adapters linked continuously in a single lazy pipeline and call `.collect()` only once at the end.

*Incorrect:*
```rust
let step1: Vec<i32> = nums.into_iter().filter(|x| x % 2 == 0).collect(); // Extra heap allocation!
let step2: Vec<i32> = step1.into_iter().map(|x| x * 2).collect();
```

*Fix:*
```rust
let step2: Vec<i32> = nums.into_iter().filter(|x| x % 2 == 0).map(|x| x * 2).collect(); // Single pass!
```

### Mistake 2: Using `.map()` for Side-Effects Without Terminal Consumption

**The mistake:** Writing `items.iter().map(|x| println!("{x}"));` to print items.

**Why it is wrong:** `.map()` is a lazy adapter. Without a terminal consumer, the closure **never runs**, triggering compiler warning `unused Map that must be used`.

*Fix:*
```rust
items.iter().for_each(|x| println!("{x}")); // Use for_each consumer!
```

### Mistake 3: Over-Complicating Chains where Simple Loops or `filter_map` Excel

**The mistake:** Nesting multiple `.map().flatten()` operations instead of using `.flat_map()` or `.filter_map()`.

---

## 5. Practice Exercises

### Exercise 1: Multi-Stage Telemetry Sensor Data Processing Pipeline

**Scenario:** Build a telemetry data cleanser `cleanse_telemetry(readings: &[&str]) -> Vec<f64>` using an iterator chain that:
1. Parses string inputs into `f64`.
2. Ignores invalid parse entries (`Err`).
3. Filters out extreme noise values outside the range `[0.0, 100.0]`.
4. Converts Celsius values to Fahrenheit (`c * 1.8 + 32.0`).
5. Collects into `Vec<f64>`.

**Requirements:**
1. Implement `cleanse_telemetry`.
2. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn cleanse_telemetry(readings: &[&str]) -> Vec<f64> {
>     readings
>         .iter()
>         .filter_map(|s| s.parse::<f64>().ok())
>         .filter(|&temp| (0.0..=100.0).contains(&temp))
>         .map(|temp| temp * 1.8 + 32.0)
>         .collect()
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_telemetry_pipeline() {
>         let raw = vec!["25.0", "invalid", "-10.0", "150.0", "0.0"];
>         let result = cleanse_telemetry(&raw);
>         
>         // 25.0 C -> 77.0 F, 0.0 C -> 32.0 F
>         assert_eq!(result, vec![77.0, 32.0]);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `filter_map(|s| s.parse().ok())` drops invalid float strings without panicking.
> 2. `filter` removes values outside `[0.0, 100.0]` range.
> 3. `map` converts Celsius to Fahrenheit in a single unrolled pass.
> 
---

### Exercise 2: E-Commerce Order Tax & Discount Calculator (`zip` + `fold`)

**Scenario:** Implement an order invoicing engine `calculate_total(prices: &[f64], quantities: &[u32], tax_rate: f64) -> f64` that zips item price and quantity arrays, calculates subtotal, applies tax, and returns total amount.

**Requirements:**
1. Use `prices.iter().zip(quantities)`.
2. Compute `price * quantity` sum via `.fold()` or `.map().sum()`.
3. Apply `tax_rate`.
4. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn calculate_total(prices: &[f64], quantities: &[u32], tax_rate: f64) -> f64 {
>     let subtotal: f64 = prices
>         .iter()
>         .zip(quantities)
>         .map(|(&price, &qty)| price * qty as f64)
>         .sum();
>     
>     subtotal * (1.0 + tax_rate)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_order_calculator() {
>         let prices = vec![10.0, 20.0, 5.0];
>         let quantities = vec![2, 1, 4]; // (20 + 20 + 20) = 60.0
>         let total = calculate_total(&prices, &quantities, 0.10); // 60 * 1.10 = 66.0
>         
>         assert!((total - 66.0).abs() < 1e-6);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `.zip()` combines parallel price and quantity slices into item tuples.
> 2. `.map(...).sum()` aggregates totals in a single SIMD-vectorizable loop.
> 
---

### Exercise 3: Log File Tokenizer using `flat_map`

**Scenario:** Build a log document word frequency tokenizer `extract_keywords(documents: &[&str]) -> Vec<String>` that splits lines into lowercase words, filters out words shorter than 4 characters, and collects unique results.

**Requirements:**
1. Use `.flat_map(|doc| doc.split_whitespace())`.
2. Clean word strings and filter by length $\ge 4$.
3. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn extract_keywords(documents: &[&str]) -> Vec<String> {
>     documents
>         .iter()
>         .flat_map(|doc| doc.split_whitespace())
>         .map(|w| w.to_lowercase())
>         .filter(|w| w.len() >= 4)
>         .collect()
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_extract_keywords() {
>         let docs = vec!["Rust async programming", "High performance async web"];
>         let keywords = extract_keywords(&docs);
>         
>         assert_eq!(keywords, vec!["rust", "async", "programming", "high", "performance", "async"];
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `flat_map` flattens sub-iterators returned by `split_whitespace()` into a single contiguous stream.
> 2. Avoids intermediate vector creation per document line.
> 
---

## 6. Related Terms


- [Lazy Evaluation](lazy_evaluation.md) — The fundamental concept explaining why Iterator Chains do absolutely nothing until a Consumer like `.collect()` is called.
- [Closures (`|args| body`)](closure.md) — The tiny anonymous functions you are passing into `map()` and `filter()`.

---

## 7. Key Takeaways

- Iterator chains compose lazy adapters (`map`, `filter`, `flat_map`) into single-pass processing pipelines.
- Compiled iterator chains achieve zero-cost abstractions with bounds-check elimination.
- Pipelines do not execute until driven by terminal consumers (`collect`, `sum`, `fold`, `for_each`).
- Prefer `.flat_map()` over nested `.map().flatten()` and `.filter_map()` for combined parse and filter operations.
