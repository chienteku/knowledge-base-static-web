# `PartialOrd` / `Ord`

> **Level 4 — Error Handling & Generics**
> Traits for ordering comparison (`<`, `>`, etc.).

---

## 1. Prerequisites


- [`PartialEq` / `Eq`](partialeq_eq.md) — You can't see if one thing is greater than another if you don't even know how to check if they are equal!
- [Derive Macro](derive_macro.md) — How you get these traits for free 99% of the time.
- [Expressions](../level_01/expressions.md) — The operators that these traits unlock.

---

## 2. Term Category

**Rust-specific (the sorting engine)**: In the previous term, we learned how to check if two things are *equal*. Now, we learn how to check if one thing is *greater than* another. These traits power the `<`, `>`, `<=`, and `>=` operators, and they are the secret engine that allows the `.sort()` method to work on your custom data structures.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

If you have a `Vec` of custom `Player` structs, how does the compiler know how to sort them? By their alphabetical name? By their high score? Rust refuses to guess. It forces you to implement **`PartialOrd`** to define exactly how two objects compare to each other (Less, Greater, or Equal).

**So what is `Ord`?**
Just like the difference between `PartialEq` and `Eq`, there is a split because of floating-point numbers (`f32`, `f64`). 

Floating-point numbers have a special value called `NaN` (Not a Number). If you ask the CPU, *"Is 5.0 greater than NaN?"*, the answer is mathematically undefined. Because `NaN` cannot be strictly ordered, floating point numbers only implement `PartialOrd`, not `Ord`.

**`Ord`** is a strict guarantee to the compiler that *"My custom type has no undefined `NaN` edge cases. I can guarantee a perfect, Total Ordering for every single possible value."* **You MUST implement `Ord` if you want to use the `.sort()` method on a `Vec`!**

### (2) Reality Metaphor

Imagine `PartialOrd` is a judge trying to rank three boxers. Usually, the judge can say A beat B, and B beat C. But what if boxer C never showed up to the fight (`NaN`)? The judge cannot rank C against the others. The ranking is only *partially* valid. 

`Ord` is a guarantee to the tournament director: *"Everyone showed up, everyone fought, and I can give you a perfect 1-to-3 ranking list with absolutely zero exceptions."* You cannot sort a tournament leaderboard without that strict `Ord` guarantee.

### (3) Rust Code Examples

#### Short Snippet (The Free Implementation)
If you use `#[derive]`, Rust will compare your fields top-to-bottom. It checks the first field; if they are equal, it moves to the second field, just like sorting words in a dictionary!

```rust
// Notice that Ord requires PartialOrd, which requires Eq, which requires PartialEq!
#[derive(PartialEq, Eq, PartialOrd, Ord)]
struct Version {
    major: u32,
    minor: u32,
}

fn main() {
    let v1 = Version { major: 1, minor: 5 };
    let v2 = Version { major: 2, minor: 0 };
    
    // The < operator works magically!
    if v1 < v2 {
        println!("Please update your software.");
    }
}
```

#### Fuller Example (Manual Sorting Logic)
If you want to sort a list of `Player` structs strictly by their `score` (and ignore their alphabetical name), you have to write the implementation manually.

*(Note: In real code, implementing all 4 traits manually is quite tedious. People often use a helper method like `player.score.cmp(&other.score)` inside the `Ord` block to save time).*

```rust
use std::cmp::Ordering;

// We derive the Eq traits because we still want to use `==` normally
#[derive(PartialEq, Eq)]
struct Player {
    name: String,
    score: u32,
}

// 1. We manually implement Ord (the strict guarantee)
impl Ord for Player {
    fn cmp(&self, other: &Self) -> Ordering {
        // We tell Rust to ONLY look at the score field when sorting!
        self.score.cmp(&other.score)
    }
}

// 2. We also have to implement PartialOrd to satisfy the compiler
impl PartialOrd for Player {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

fn main() {
    let mut leaderboard = vec![
        Player { name: String::from("Zack"), score: 500 },
        Player { name: String::from("Alice"), score: 9000 },
    ];
    
    // Because we implemented Ord, we can use .sort()!
    // Zack goes first (500), Alice goes second (9000), ignoring alphabetical order!
    leaderboard.sort(); 
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Partialord Ord Scoping and Lifecycle Rules

**The mistake:** Assuming Partialord Ord instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("partialord_ord_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("partialord_ord_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Partialord Ord State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Partialord Ord through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Partialord Ord Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Partialord Ord instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: High-Frequency Trading Order Book Matching Engine (`Price-Time Priority`)

**Scenario:** In an order book for a high-frequency financial exchange, limit orders are prioritized according to **Price-Time Priority**:
1. For **Buy Orders (Bids)**: Orders with higher prices take precedence (descending price order). If prices are identical, orders placed earlier (smaller nanosecond timestamp) take precedence. If timestamps match, the order with the smaller unique sequence ID takes precedence.
2. For **Sell Orders (Asks)**: Orders with lower prices take precedence (ascending price order). If prices match, earlier nanosecond timestamps take precedence, followed by smaller sequence IDs.

Implement `Ord`, `PartialOrd`, `Eq`, and `PartialEq` for `LimitOrder` such that `std::collections::BinaryHeap` (which pops the greatest element according to `Ord`) acts as a prioritized order book popping the highest-priority order first. Write a complete program containing an `OrderBook` struct and unit tests using `assert_eq!`, `assert!`, `assert_ne!`, and `matches!`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::cmp::Ordering;
> use std::collections::BinaryHeap;
> 
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub enum OrderSide {
>     Buy,
>     Sell,
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct LimitOrder {
>     pub id: u64,
>     pub price_cents: u64,
>     pub timestamp_ns: u64,
>     pub side: OrderSide,
> }
> 
> impl LimitOrder {
>     pub fn new(id: u64, price_cents: u64, timestamp_ns: u64, side: OrderSide) -> Self {
>         Self {
>             id,
>             price_cents,
>             timestamp_ns,
>             side,
>         }
>     }
> }
> 
> impl Ord for LimitOrder {
>     fn cmp(&self, other: &Self) -> Ordering {
>         // If order sides differ, group by side enum discriminant
>         if self.side != other.side {
>             return (self.side as u8).cmp(&(other.side as u8));
>         }
> 
>         match self.side {
>             OrderSide::Buy => {
>                 // Buy side: Higher price is GREATER (pops first from BinaryHeap)
>                 self.price_cents
>                     .cmp(&other.price_cents)
>                     .then_with(|| other.timestamp_ns.cmp(&self.timestamp_ns)) // Earlier timestamp (smaller ns) is GREATER
>                     .then_with(|| other.id.cmp(&self.id))                    // Smaller ID is GREATER
>             }
>             OrderSide::Sell => {
>                 // Sell side: Lower price is GREATER (pops first from BinaryHeap)
>                 other
>                     .price_cents
>                     .cmp(&self.price_cents)
>                     .then_with(|| other.timestamp_ns.cmp(&self.timestamp_ns)) // Earlier timestamp (smaller ns) is GREATER
>                     .then_with(|| other.id.cmp(&self.id))                    // Smaller ID is GREATER
>             }
>         }
>     }
> }
> 
> impl PartialOrd for LimitOrder {
>     fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
>         Some(self.cmp(other))
>     }
> }
> 
> pub struct OrderBook {
>     pub buy_orders: BinaryHeap<LimitOrder>,
>     pub sell_orders: BinaryHeap<LimitOrder>,
> }
> 
> impl OrderBook {
>     pub fn new() -> Self {
>         Self {
>             buy_orders: BinaryHeap::new(),
>             sell_orders: BinaryHeap::new(),
>         }
>     }
> 
>     pub fn add_order(&mut self, order: LimitOrder) {
>         match order.side {
>             OrderSide::Buy => self.buy_orders.push(order),
>             OrderSide::Sell => self.sell_orders.push(order),
>         }
>     }
> 
>     pub fn pop_best_buy(&mut self) -> Option<LimitOrder> {
>         self.buy_orders.pop()
>     }
> 
>     pub fn pop_best_sell(&mut self) -> Option<LimitOrder> {
>         self.sell_orders.pop()
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_buy_price_time_priority() {
>         let mut book = OrderBook::new();
> 
>         let o1 = LimitOrder::new(1, 1000, 100, OrderSide::Buy); // Price 1000, t=100
>         let o2 = LimitOrder::new(2, 1050, 200, OrderSide::Buy); // Price 1050 (higher price)
>         let o3 = LimitOrder::new(3, 1000, 50, OrderSide::Buy);  // Price 1000, t=50 (earlier)
> 
>         book.add_order(o1);
>         book.add_order(o2);
>         book.add_order(o3);
> 
>         // Highest price (o2 at 1050) pops first
>         let first = book.pop_best_buy();
>         assert!(first.is_some());
>         assert_eq!(first.as_ref().unwrap().id, 2);
> 
>         // Next highest is o3 (same price as o1, but earlier timestamp 50 < 100)
>         let second = book.pop_best_buy();
>         assert_eq!(second.as_ref().unwrap().id, 3);
> 
>         // Last is o1
>         let third = book.pop_best_buy();
>         assert_eq!(third.as_ref().unwrap().id, 1);
> 
>         // Empty queue returns None
>         assert!(matches!(book.pop_best_buy(), None));
>     }
> 
>     #[test]
>     fn test_sell_price_time_priority() {
>         let mut book = OrderBook::new();
> 
>         let s1 = LimitOrder::new(10, 500, 100, OrderSide::Sell); // Price 500
>         let s2 = LimitOrder::new(11, 450, 200, OrderSide::Sell); // Price 450 (cheaper seller)
>         let s3 = LimitOrder::new(12, 500, 80, OrderSide::Sell);  // Price 500, earlier t=80
> 
>         book.add_order(s1);
>         book.add_order(s2);
>         book.add_order(s3);
> 
>         // Lowest price seller (s2 at 450) pops first
>         let first = book.pop_best_sell().unwrap();
>         assert_eq!(first.id, 11);
> 
>         // Next is s3 (price 500, earlier timestamp 80 < 100)
>         let second = book.pop_best_sell().unwrap();
>         assert_eq!(second.id, 12);
> 
>         // Last is s1
>         let third = book.pop_best_sell().unwrap();
>         assert_ne!(third.id, 12);
>         assert_eq!(third.id, 10);
>     }
> }
> ```
>
> #### Technical Explanation
>
>
> 
> 
> 1. **Price-Time Priority & Heap Invariants:**
>    `std::collections::BinaryHeap` in Rust is a max-heap: calling `.pop()` extracts the element that evaluates as `Ordering::Greater` relative to all other elements. To achieve Price-Time Priority for Buy orders, higher price and lower timestamp must evaluate to `Ordering::Greater`. We accomplish this chaining via `.then_with()`, which evaluates secondary and tertiary comparison closures only when primary fields are equal (`Ordering::Equal`).
> 
> 2. **Total Ordering (`Ord`) Requirements:**
>    The `Ord` trait requires strict adherence to mathematical total ordering properties:
>    - **Reflexivity:** `a == a` (guaranteed since `u64` integers are reflexive).
>    - **Antisymmetry:** If `a <= b` and `b <= a`, then `a == b`.
>    - **Transitivity:** If `a < b` and `b < c`, then `a < c`.
>    By using integer cents (`u64`) instead of floating-point numbers (`f64`), we eliminate invalid non-reflexive states (`NaN`), fulfilling Rust's strict standard library invariant for `Ord`.
> 
> 3. **Performance & Monomorphization:**
>    `BinaryHeap` monomorphizes directly over `LimitOrder`. The `cmp` function is inlined by LLVM during compilation into efficient inline comparison CPU instructions without heap allocations or virtual method table (`vtable`) dynamic dispatch overhead.
> 
---

### Exercise 2: Multiversion Microservice Semantic Versioning & Cluster Router

**Scenario:** Microservice capabilities in a distributed cloud gateway are selected based on Semantic Versioning precedence (SemVer 2.0.0):
1. Version precedence is checked in order: `major`, `minor`, `patch`.
2. Pre-release tags have *lower precedence* than normal releases (`1.0.0-alpha < 1.0.0-beta < 1.0.0`). If a version lacks a pre-release tag (`None`), it is considered a full release and takes precedence over any `Some(prerelease)`.
3. Build metadata (e.g. `+build20260731`) is explicitly ignored during ordering precedence comparison according to the SemVer specification.

Implement custom `Ord`, `PartialOrd`, `Eq`, and `PartialEq` for a custom `SemVer` type. Implement a generic `ServiceClusterRouter<T>` that stores registered node instances, filters nodes matching a target major version, and routes traffic to the highest compatible version available. Write comprehensive unit tests verifying pre-release ordering, build metadata exclusion, and cluster routing using explicit assertions (`assert_eq!`, `assert!`, `assert_ne!`, `matches!`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::cmp::Ordering;
> 
> #[derive(Debug, Clone)]
> pub struct SemVer {
>     pub major: u32,
>     pub minor: u32,
>     pub patch: u32,
>     pub prerelease: Option<String>,
>     pub build_metadata: Option<String>,
> }
> 
> impl SemVer {
>     pub fn new(
>         major: u32,
>         minor: u32,
>         patch: u32,
>         prerelease: Option<&str>,
>         build_metadata: Option<&str>,
>     ) -> Self {
>         Self {
>             major,
>             minor,
>             patch,
>             prerelease: prerelease.map(|s| s.to_string()),
>             build_metadata: build_metadata.map(|s| s.to_string()),
>         }
>     }
> }
> 
> // Precedence equality ignores build_metadata per SemVer spec
> impl PartialEq for SemVer {
>     fn eq(&self, other: &Self) -> bool {
>         self.major == other.major
>             && self.minor == other.minor
>             && self.patch == other.patch
>             && self.prerelease == other.prerelease
>     }
> }
> 
> impl Eq for SemVer {}
> 
> impl Ord for SemVer {
>     fn cmp(&self, other: &Self) -> Ordering {
>         let core_cmp = self
>             .major
>             .cmp(&other.major)
>             .then_with(|| self.minor.cmp(&other.minor))
>             .then_with(|| self.patch.cmp(&other.patch));
> 
>         if core_cmp != Ordering::Equal {
>             return core_cmp;
>         }
> 
>         // Prerelease tag rules: None (release) > Some (prerelease)
>         match (&self.prerelease, &other.prerelease) {
>             (None, None) => Ordering::Equal,
>             (None, Some(_)) => Ordering::Greater,
>             (Some(_), None) => Ordering::Less,
>             (Some(a), Some(b)) => a.cmp(b),
>         }
>     }
> }
> 
> impl PartialOrd for SemVer {
>     fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
>         Some(self.cmp(other))
>     }
> }
> 
> #[derive(Debug, Clone)]
> pub struct ServiceNode<T> {
>     pub version: SemVer,
>     pub endpoint_payload: T,
> }
> 
> pub struct ServiceClusterRouter<T> {
>     nodes: Vec<ServiceNode<T>>,
> }
> 
> impl<T> ServiceClusterRouter<T> {
>     pub fn new(nodes: Vec<ServiceNode<T>>) -> Self {
>         Self { nodes }
>     }
> 
>     pub fn select_highest_compatible(&self, target_major: u32) -> Option<&ServiceNode<T>> {
>         self.nodes
>             .iter()
>             .filter(|node| node.version.major == target_major)
>             .max_by(|a, b| a.version.cmp(&b.version))
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_semver_prerelease_precedence() {
>         let alpha = SemVer::new(1, 0, 0, Some("alpha"), None);
>         let beta = SemVer::new(1, 0, 0, Some("beta"), None);
>         let release = SemVer::new(1, 0, 0, None, None);
> 
>         assert!(alpha < beta);
>         assert!(beta < release);
>         assert_eq!(alpha.cmp(&release), Ordering::Less);
>     }
> 
>     #[test]
>     fn test_semver_build_metadata_ignored_for_ord() {
>         let v1 = SemVer::new(1, 2, 3, None, Some("build.100"));
>         let v2 = SemVer::new(1, 2, 3, None, Some("build.200"));
> 
>         assert_eq!(v1, v2); // PartialEq ignores build metadata
>         assert_eq!(v1.cmp(&v2), Ordering::Equal);
>     }
> 
>     #[test]
>     fn test_cluster_router_selection() {
>         let nodes = vec![
>             ServiceNode {
>                 version: SemVer::new(1, 1, 0, None, None),
>                 endpoint_payload: "node-v1.1",
>             },
>             ServiceNode {
>                 version: SemVer::new(1, 2, 0, Some("rc1"), None),
>                 endpoint_payload: "node-v1.2-rc1",
>             },
>             ServiceNode {
>                 version: SemVer::new(1, 2, 0, None, None),
>                 endpoint_payload: "node-v1.2-release",
>             },
>             ServiceNode {
>                 version: SemVer::new(2, 0, 0, None, None),
>                 endpoint_payload: "node-v2.0",
>             },
>         ];
> 
>         let router = ServiceClusterRouter::new(nodes);
> 
>         let selected_v1 = router.select_highest_compatible(1);
>         assert!(selected_v1.is_some());
>         assert_eq!(selected_v1.unwrap().endpoint_payload, "node-v1.2-release");
> 
>         let selected_v3 = router.select_highest_compatible(3);
>         assert!(matches!(selected_v3, None));
>         assert_ne!(selected_v1.unwrap().endpoint_payload, "node-v2.0");
>     }
> }
> ```
>
> #### Technical Explanation
>
>
> 
> 
> 1. **Equivalence Classes vs Identity (`PartialEq` vs `Ord` Consistency):**
>    Standard Rust API guidelines require `PartialEq` and `Ord` to be consistent: `a == b` if and only if `a.cmp(&b) == Ordering::Equal`. By ignoring `build_metadata` in both `PartialEq` and `Ord`, we maintain this mathematical invariant while allowing `SemVer` structs to store build context without affecting precedence logic.
> 
> 2. **Pattern Matching Options for Total Order (`None` vs `Some`):**
>    In Rust standard library total ordering, a full release version (`None`) outranks a pre-release candidate (`Some("alpha")`). The `match` expression cleanly partitions the precedence logic: `(None, Some(_))` evaluates to `Ordering::Greater`, guaranteeing that pre-release code is never chosen over a production release of the same core triplet.
> 
> 3. **Generic Iterator Higher-Order Functions (`max_by`):**
>    `ServiceClusterRouter<T>` uses standard library iterator methods (`.filter()` and `.max_by()`). Because `T` is generic, Rust's compiler monomorphizes `select_highest_compatible` for each payload type without dynamic dispatch allocations.
> 
---

### Exercise 3: Real-Time IoT Telemetry Stream Processing & Quantile Sliding Window (`PartialOrd` Fallback vs `total_cmp` Ord Wrappers)

**Scenario:** In high-throughput industrial IoT monitoring, sensor streams return floating-point metrics (`f64` latency in milliseconds). Because `f64` values can contain `NaN` (Not-a-Number), standard floating-point types in Rust only implement `PartialOrd`, preventing direct usage in `Vec::sort()` or ordered tree collections.

Design a wrapper type `OrderedMetric` around `f64` that provides strict `Ord` and `Eq` implementation using IEEE-754 total ordering (`f64::total_cmp`). Implement a generic stream trait `StreamProcessor<T>` and a bounded sliding window `QuantileWindow` struct that ingests raw telemetry samples, filters out `NaN` values by returning a custom `MetricError`, keeps the internal buffer sorted, and computes specified percentiles (`p50`, `p90`, `p99`). Write unit tests validating `NaN` error handling, IEEE total ordering (`-0.0 < +0.0`), sliding-window capacity eviction, percentile calculation, and assertions (`assert_eq!`, `assert!`, `assert_ne!`, `matches!`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::cmp::Ordering;
> 
> #[derive(Debug, Clone, Copy)]
> pub struct OrderedMetric(pub f64);
> 
> impl PartialEq for OrderedMetric {
>     fn eq(&self, other: &Self) -> bool {
>         self.0.total_cmp(&other.0) == Ordering::Equal
>     }
> }
> 
> impl Eq for OrderedMetric {}
> 
> impl PartialOrd for OrderedMetric {
>     fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
>         Some(self.cmp(other))
>     }
> }
> 
> impl Ord for OrderedMetric {
>     fn cmp(&self, other: &Self) -> Ordering {
>         self.0.total_cmp(&other.0)
>     }
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum MetricError {
>     InvalidSample(String),
>     EmptyWindow,
>     InvalidQuantile(String),
> }
> 
> pub trait StreamProcessor<T> {
>     fn process_sample(&mut self, sample: T) -> Result<(), MetricError>;
>     fn calculate_quantile(&self, quantile: f64) -> Result<f64, MetricError>;
> }
> 
> pub struct QuantileWindow {
>     capacity: usize,
>     samples: Vec<OrderedMetric>,
> }
> 
> impl QuantileWindow {
>     pub fn new(capacity: usize) -> Self {
>         Self {
>             capacity,
>             samples: Vec::with_capacity(capacity),
>         }
>     }
> 
>     pub fn len(&self) -> usize {
>         self.samples.len()
>     }
> 
>     pub fn is_empty(&self) -> bool {
>         self.samples.is_empty()
>     }
> }
> 
> impl StreamProcessor<f64> for QuantileWindow {
>     fn process_sample(&mut self, sample: f64) -> Result<(), MetricError> {
>         if sample.is_nan() {
>             return Err(MetricError::InvalidSample(
>                 "Cannot process NaN sample value".into(),
>             ));
>         }
> 
>         if self.samples.len() >= self.capacity {
>             self.samples.remove(0); // Evict oldest entry
>         }
> 
>         self.samples.push(OrderedMetric(sample));
>         self.samples.sort(); // Sorts using our custom total_cmp Ord implementation
>         Ok(())
>     }
> 
>     fn calculate_quantile(&self, quantile: f64) -> Result<f64, MetricError> {
>         if self.samples.is_empty() {
>             return Err(MetricError::EmptyWindow);
>         }
>         if !(0.0..=1.0).contains(&quantile) {
>             return Err(MetricError::InvalidQuantile(
>                 "Quantile ratio must be between 0.0 and 1.0".into(),
>             ));
>         }
> 
>         let index = ((self.samples.len() - 1) as f64 * quantile).round() as usize;
>         Ok(self.samples[index].0)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_ordered_metric_ieee_total_cmp() {
>         let neg_zero = OrderedMetric(-0.0);
>         let pos_zero = OrderedMetric(0.0);
>         let nan = OrderedMetric(f64::NAN);
> 
>         // IEEE 754-2008 totalOrder specifies -0.0 < +0.0 and NaN is comparable
>         assert!(neg_zero < pos_zero);
>         assert!(pos_zero < nan);
>         assert_eq!(neg_zero.cmp(&pos_zero), Ordering::Less);
>     }
> 
>     #[test]
>     fn test_nan_sample_rejection() {
>         let mut window = QuantileWindow::new(5);
>         let res = window.process_sample(f64::NAN);
> 
>         assert!(res.is_err());
>         assert!(matches!(res, Err(MetricError::InvalidSample(_))));
>         assert_eq!(window.len(), 0);
>     }
> 
>     #[test]
>     fn test_quantile_window_calculation_and_eviction() {
>         let mut window = QuantileWindow::new(5);
> 
>         // Push 5 samples: 10.0, 50.0, 20.0, 40.0, 30.0
>         assert!(window.process_sample(10.0).is_ok());
>         assert!(window.process_sample(50.0).is_ok());
>         assert!(window.process_sample(20.0).is_ok());
>         assert!(window.process_sample(40.0).is_ok());
>         assert!(window.process_sample(30.0).is_ok());
> 
>         // Buffer is sorted: [10.0, 20.0, 30.0, 40.0, 50.0]
>         let p50 = window.calculate_quantile(0.5).unwrap();
>         assert_eq!(p50, 30.0);
> 
>         let p0 = window.calculate_quantile(0.0).unwrap();
>         assert_eq!(p0, 10.0);
> 
>         let p100 = window.calculate_quantile(1.0).unwrap();
>         assert_eq!(p100, 50.0);
> 
>         // Evict oldest sample by pushing a new one (evicts 10.0, adds 60.0)
>         assert!(window.process_sample(60.0).is_ok());
>         assert_eq!(window.len(), 5);
> 
>         let invalid_q = window.calculate_quantile(1.5);
>         assert!(matches!(invalid_q, Err(MetricError::InvalidQuantile(_))));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
> 
> 
> 1. **Why `f64` Only Implements `PartialOrd`:**
>    According to IEEE 754 standards, floating point comparison operations involving `NaN` evaluate to `false` for `<`, `>`, and `==` (e.g. `f64::NAN == f64::NAN` is `false`). This breaks the reflexivity axiom of total ordering (`x == x`). Consequently, Rust's type system refuses to implement `Ord` for `f32` and `f64`.
> 
> 2. **IEEE 754-2008 `total_cmp` Implementation:**
>    By calling `f64::total_cmp(&other.0)`, `OrderedMetric` establishes a strict total ordering: negative quiet `NaN`s < negative numbers < `-0.0` < `+0.0` < positive numbers < positive quiet `NaN`s. This converts partial ordering into a valid total ordering capable of satisfying `Ord` and `Eq` type bounds.
> 
> 3. **Error Handling & Trait Abstractions:**
>    The `StreamProcessor` trait decouples telemetry ingestion from windowing storage. By returning `Result<(), MetricError>`, invalid inputs like `NaN` are caught at the boundary before violating domain logic, preventing panic conditions in downstream sliding window statistics.
> 
---

## 6. Related Terms


- [`PartialEq` / `Eq`](partialeq_eq.md) — The prerequisite traits that these ordering traits are built on top of.
- [Derive Macro](derive_macro.md) — How you get `PartialOrd` and `Ord` for free 99% of the time.
- [`BTreeMap<K, V>`](../level_02/btreemap_k_v.md) — Related concept: `BTreeMap<K, V>`.
- [`HashSet<T>` / `BTreeSet<T>`](../level_02/hashset_btreeset.md) — Related concept: `HashSet<T>` / `BTreeSet<T>`.

---

## 7. Key Takeaways

- `PartialOrd` is the trait that powers the `<`, `>`, `<=`, and `>=` operators.
- `Ord` is a strict guarantee of "Total Ordering" (meaning the type has no undefined `NaN` values).
- You **MUST** implement `Ord` if you want to use the `.sort()` method on a `Vec` of your custom types.
- You can derive them automatically using `#[derive(PartialEq, Eq, PartialOrd, Ord)]`. The macro will evaluate the fields top-to-bottom (dictionary order).
- You must implement them manually if you want custom sorting logic (e.g., sorting users by high score instead of by username).
