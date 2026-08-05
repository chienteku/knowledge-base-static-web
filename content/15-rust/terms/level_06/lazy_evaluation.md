# Lazy Evaluation

> **Level 6 — Closures & Functional Patterns**
> Iterators are lazy; no work is done until a consuming adapter (e.g. `.collect()`, `.sum()`) is called.

---

## 1. Prerequisites


- [Iterator](../level_02/iterator.md) — The core trait that powers this lazy behavior.
- [Iterator Chains](iterator_chains.md) — The pipelines that benefit most from being lazy.
- [Iterator Adapters](../level_02/iterator_adapters.md) — The specific methods (like `map` and `filter`) that are lazy.

---

## 2. Term Category

**Rust Performance Mechanic (deferred computation)**: **Lazy Evaluation** in Rust means that calling iterator adapters like `.map()`, `.filter()`, or `.take()` performs **zero immediate computation** and allocates zero intermediate memory buffers. Instead, adapters construct nested struct representations (e.g., `Map<Filter<Iter, P>, F>`) that defer element processing until a terminal consumer like `.collect()` or `.next()` actively drives iteration.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Eager evaluation algorithms iterate through entire collections immediately at every step. If you run `.map().filter().take(5)` eagerly on a 10,000,000 element array:
1. Step 1 allocates an intermediate 10,000,000 element mapped array.
2. Step 2 allocates another 10,000,000 element filtered array.
3. Step 3 takes 5 elements and discards 9,999,995 computed items.

Rust's **Lazy Evaluation** model eliminates this waste completely:
- Creating `.map().filter().take(5)` constructs a zero-cost stack struct holding function pointers or closure environments.
- When the consumer requests item #1 via `.next()`, the pipeline processes item #1 through map, filter, and take.
- After 5 matching items are yielded, processing halts immediately. Items 6 through 10,000,000 are **never accessed or evaluated**.

### (2) Reality Metaphor

- **Eager Evaluation (Buffet Restaurant)**: A kitchen prepares 1,000 plates of steak, 1,000 salads, and 1,000 desserts in advance, placing them on heating trays even if only 3 customers arrive.
- **Lazy Evaluation (Made-to-Order Restaurant)**: The chef receives an order ticket (the iterator pipeline). Nothing is cooked until a customer sits at the table and places an order (`.next()`). The chef prepares exactly one meal at a time on demand.

### (3) Rust Code Examples

#### Proving Zero Execution Before Consumer
```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];

    println!("Constructing lazy iterator pipeline...");
    let pipeline = numbers.iter().map(|&x| {
        println!("  [EVALUATING] Mapping item: {x}");
        x * 2
    }).filter(|&x| {
        println!("  [EVALUATING] Filtering item: {x}");
        x > 5
    });

    println!("Pipeline constructed! (Notice zero evaluation printed above)");

    println!("Executing consumer .collect():");
    let result: Vec<i32> = pipeline.collect();
    println!("Final collected result: {:?}", result);
}
```

#### Short-Circuiting Lazy Evaluation with `.take()`
```rust
fn main() {
    let huge_range = 0..1_000_000;

    // Evaluates ONLY the first 3 items!
    let first_three: Vec<i32> = huge_range
        .map(|x| x * 10)
        .take(3)
        .collect();

    assert_eq!(first_three, vec![0, 10, 20]);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Expecting Side-Effects inside `.map()` without Consuming the Iterator

**The mistake:** Putting side-effects (e.g. state mutation or I/O logging) inside `.map()` without attaching a terminal consumer.

**Why it is wrong:** `.map()` returns a lazy `Map` adapter struct. If `.collect()`, `.for_each()`, or a `for` loop is never called on it, the closure body **never executes**.

*Incorrect:*
```rust
let items = vec![1, 2, 3];
items.iter().map(|x| println!("{x}")); // ❌ Does NOTHING! Warning: unused Map
```

*Fix:*
```rust
let items = vec![1, 2, 3];
items.iter().for_each(|x| println!("{x}")); // Correct!
```

### Mistake 2: Assuming Lazy Iterators Process Elements In-Order Across All Pipeline Steps

**The mistake:** Assuming `.map(f1).map(f2)` processes all elements through `f1` before starting `f2`.

**Why it is wrong:** Rust iterators process item-by-item down the entire adapter chain (`item1 -> f1 -> f2`, then `item2 -> f1 -> f2`), not layer-by-layer.

### Mistake 3: Reusing a Consumed Lazy Iterator

**The mistake:** Calling a consuming method like `.collect()` on an iterator and then trying to iterate over the same iterator variable again.

---

## 5. Practice Exercises

### Exercise 1: Short-Circuiting Security Audit Log Scanner

**Scenario:** Build an audit log scanner `find_first_threat(logs: &[&str]) -> Option<String>` that streams log entries, lazily transforms log lines into lower-case, checks for threat signatures (`"unauthorized"` or `"exploit"`), and short-circuits on the first detected threat without processing remaining logs.

**Requirements:**
1. Implement `find_first_threat`.
2. Write unit tests verifying that evaluation stops immediately after the first match.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn find_first_threat(logs: &[&str]) -> Option<String> {
>     logs.iter()
>         .map(|line| line.to_lowercase())
>         .find(|line| line.contains("unauthorized") || line.contains("exploit"))
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_short_circuit_threat_scanner() {
>         let logs = vec![
>             "2026-08-01 INFO Login success",
>             "2026-08-01 WARN Unauthorized access attempt from IP 10.0.0.5",
>             "2026-08-01 CRITICAL Exploit payload detected", // Should NOT be evaluated!
>         ];
>         
>         let match_result = find_first_threat(&logs);
>         assert!(match_result.unwrap().contains("unauthorized"));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `.find(...)` acts as a short-circuiting consumer.
> 2. As soon as the second line matches, iteration halts, avoiding computation on the third line.

---

### Exercise 2: Infinite Stream Fibonacci Sequence Generator (`take` + `collect`)

**Scenario:** Implement an infinite Fibonacci generator struct `Fibonacci` implementing `Iterator<Item = u64>`, and lazily generate the first $N$ numbers using `.take(n).collect()`.

**Requirements:**
1. Define `struct Fibonacci { curr: u64, next: u64 }`.
2. Implement `Iterator for Fibonacci`.
3. Generate first $N$ numbers lazily.
4. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub struct Fibonacci {
>     curr: u64,
>     next: u64,
> }
> 
> impl Fibonacci {
>     pub fn new() -> Self {
>         Self { curr: 0, next: 1 }
>     }
> }
> 
> impl Iterator for Fibonacci {
>     type Item = u64;
> 
>     fn next(&mut self) -> Option<Self::Item> {
>         let current = self.curr;
>         self.curr = self.next;
>         self.next = current.wrapping_add(self.next);
>         Some(current)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_lazy_fibonacci() {
>         let fib_10: Vec<u64> = Fibonacci::new().take(7).collect();
>         assert_eq!(fib_10, vec![0, 1, 1, 2, 3, 5, 8]);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `Fibonacci` is an infinite stream producing numbers on demand.
> 2. `.take(7)` lazily limits iteration to 7 calls without allocating infinite memory.

---

### Exercise 3: Custom Lazy Filter-Map Pipeline Verifier

**Scenario:** Build a custom lazy adapter function `fn count_evaluations<I, F>(iter: I, f: F) -> usize` that demonstrates lazy execution by counting exact adapter evaluations during iteration.

**Requirements:**
1. Implement `count_evaluations`.
2. Write unit tests verifying that element counts match consumer requests rather than source length.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn count_evaluations<I>(iter: I, take_n: usize) -> (Vec<i32>, usize)
> where
>     I: IntoIterator<Item = i32>,
> {
>     let mut eval_count = 0;
>     let result: Vec<i32> = iter
>         .into_iter()
>         .map(|x| {
>             eval_count += 1;
>             x * 2
>         })
>         .take(take_n)
>         .collect();
>     (result, eval_count)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_lazy_evaluation_count() {
>         let data = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
>         let (res, evals) = count_evaluations(data, 3);
>         
>         assert_eq!(res, vec![2, 4, 6]);
>         assert_eq!(evals, 3); // Exactly 3 evaluations executed, not 10!
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `.take(3)` stops pulling items from `.map()` after 3 elements.
> 2. Demonstrates lazy evaluation driving item-by-item execution.

---

## 6. Related Terms


- [Collecting](../level_02/collecting.md) — The most common way to force a lazy iterator to finally do its work.
- [Iterator Chains](iterator_chains.md) — The pipelines that benefit most from this optimization.
- [`Iterator` Consumers (`fold`, `reduce`, `sum`, `product`, `count`, `any`, `all`, `find`, `position`)](../level_02/iterator_consumers.md) — Related concept: `Iterator` Consumers (`fold`, `reduce`, `sum`, `product`, `count`, `any`, `all`, `find`, `position`).

---

## 7. Key Takeaways

- Iterators and adapters (`map`, `filter`, `take`) perform zero immediate work when constructed.
- Adapters build zero-cost nested struct wrappers that defer execution.
- Work executes on demand item-by-item when driven by consumers (`collect`, `sum`, `find`, `for_each`).
- Short-circuiting consumers (`find`, `any`, `take`) halt pipeline processing as soon as evaluation conditions are met.
