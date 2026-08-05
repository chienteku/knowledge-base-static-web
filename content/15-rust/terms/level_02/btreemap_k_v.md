# `BTreeMap<K, V>`

> **Level 2 — Control Flow & Data Structures**
> An ordered map that keeps keys sorted, with efficient range queries — `HashMap`'s sorted sibling.

---

## 1. Prerequisites


- [`HashMap<K, V>`](hashmap_k_v.md) — The unordered map this type mirrors in API but differs from in ordering and key requirements.
- [`PartialOrd` / `Ord`](../level_04/partialord_ord.md) — Required on the key type, instead of `Hash`.
- [`for` / Range](for_range.md) — What powers the efficient `.range()` queries.

---

## 2. Term Category

**Collection Type (the sorted map)**: `BTreeMap<K, V>` provides the same "look values up by key" contract as `HashMap`, but backed by a B-tree instead of a hash table. The trade-off is fundamental: you give up `HashMap`'s O(1) average lookup for O(log n), in exchange for keys that are **always kept in sorted order** and support efficient range queries.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

`HashMap` deliberately scrambles key order for speed — hashing throws away any notion of "less than" or "greater than." But sometimes you *need* order: "give me all entries with keys between 100 and 200," or "what's the smallest key still in the map?" A `HashMap` can only answer these by scanning every single entry, which is O(n). `BTreeMap` organizes its keys in a self-balancing tree structure specifically so these are efficient, tree-traversal operations instead of full scans — at the modest cost of needing `Ord` instead of `Hash`, and losing the O(1) average case.

### (2) Reality Metaphor

Imagine a phone book (a physical, printed one) versus a scrambled box of index cards.

- **`HashMap`**: Every contact is on an index card thrown into a bin, sorted only by a hash you can't read. Finding "Alice" is nearly instant if you know her hash-bucket, but you have no idea who comes "before" or "after" her.
- **`BTreeMap`**: A real phone book, alphabetically sorted. Finding "Alice" takes a moment longer (flip to the "A" section), but you can instantly answer "who's between Aaron and Andrew?" (a **range query**), or "who's the very first entry?" — questions the scrambled index-card bin simply cannot answer efficiently.

### (3) Rust Code Examples

#### Short Snippet (Sorted Iteration, For Free)
```rust
use std::collections::BTreeMap;

fn main() {
    let mut scores = BTreeMap::new();
    scores.insert("charlie", 90);
    scores.insert("alice", 100);
    scores.insert("bob", 95);

    // BTreeMap ALWAYS iterates in key-sorted order — no .sort() needed.
    for (name, score) in &scores {
        println!("{name}: {score}");
    }
    // alice: 100
    // bob: 95
    // charlie: 90
}
```

#### Fuller Example (Range Queries)
```rust
use std::collections::BTreeMap;
use std::ops::Bound::Included;

fn main() {
    let mut inventory: BTreeMap<u32, &str> = BTreeMap::new();
    inventory.insert(100, "widget-A");
    inventory.insert(150, "widget-B");
    inventory.insert(200, "widget-C");
    inventory.insert(250, "widget-D");

    // Efficiently find every item priced between 120 and 220 (inclusive), in O(log n + k).
    for (price, name) in inventory.range((Included(120), Included(220))) {
        println!("{name} costs {price}");
    }
    // widget-B costs 150
    // widget-C costs 200

    // first_key_value / last_key_value: instant min/max, no scan needed.
    println!("{:?}", inventory.first_key_value()); // Some((100, "widget-A"))
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Btreemap K V Scoping and Lifecycle Rules

**The mistake:** Assuming Btreemap K V instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("btreemap_k_v_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("btreemap_k_v_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Btreemap K V State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Btreemap K V through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Btreemap K V Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Btreemap K V instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Real-Time Limit Order Book (Financial Matching Engine)

**Scenario:** In financial trading systems and cryptocurrency exchanges, limit order books maintain live buy and sell orders grouped by price levels. Sell (ask) price levels must be traversed in ascending order so market buy orders execute against the best (lowest) ask price available. At each price level, multiple limit orders must execute in FIFO (First-In, First-Out) time priority. Furthermore, risk engines require range queries to inspect aggregate order depth across price intervals `[min_price, max_price]`.

**Task:** Implement a `LimitOrderBook` structure using `BTreeMap<u64, VecDeque<Order>>`, where price ticks in integer units (cents or satoshis) act as keys.
1. `add_ask_order(&mut self, price: u64, order: Order)` — Append an ask limit order to the FIFO queue at the specified price level using `BTreeMap::entry()`.
2. `get_depth_in_range(&self, min_price: u64, max_price: u64) -> u64` — Efficiently calculate total available order quantity across price levels in `[min_price, max_price]` using `BTreeMap::range()`.
3. `match_market_buy(&mut self, quantity: u64) -> (u64, Vec<(u64, u64)>)` — Execute a market buy order against lowest ask price levels, updating or popping orders as they are filled and removing depleted price levels from the map.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::{BTreeMap, VecDeque};
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct Order {
>     pub order_id: u64,
>     pub quantity: u64,
> }
> 
> #[derive(Debug, Default)]
> pub struct LimitOrderBook {
>     // Key: Price tick in integer units. Value: FIFO queue of limit orders.
>     asks: BTreeMap<u64, VecDeque<Order>>,
> }
> 
> impl LimitOrderBook {
>     pub fn new() -> Self {
>         Self {
>             asks: BTreeMap::new(),
>         }
>     }
> 
>     pub fn add_ask_order(&mut self, price: u64, order: Order) {
>         self.asks.entry(price).or_default().push_back(order);
>     }
> 
>     pub fn get_depth_in_range(&self, min_price: u64, max_price: u64) -> u64 {
>         self.asks
>             .range(min_price..=max_price)
>             .flat_map(|(_, orders)| orders.iter())
>             .map(|o| o.quantity)
>             .sum()
>     }
> 
>     pub fn match_market_buy(&mut self, mut quantity: u64) -> (u64, Vec<(u64, u64)>) {
>         let mut filled_qty = 0;
>         let mut executions = Vec::new();
> 
>         while quantity > 0 && !self.asks.is_empty() {
>             // Retrieve lowest price tick key
>             let &best_price = self.asks.keys().next().unwrap();
>             let orders = self.asks.get_mut(&best_price).unwrap();
> 
>             while quantity > 0 && !orders.is_empty() {
>                 let front_order = orders.front_mut().unwrap();
>                 if front_order.quantity <= quantity {
>                     let qty = front_order.quantity;
>                     quantity -= qty;
>                     filled_qty += qty;
>                     executions.push((best_price, qty));
>                     orders.pop_front();
>                 } else {
>                     front_order.quantity -= quantity;
>                     filled_qty += quantity;
>                     executions.push((best_price, quantity));
>                     quantity = 0;
>                 }
>             }
> 
>             if orders.is_empty() {
>                 self.asks.remove(&best_price);
>             }
>         }
> 
>         (filled_qty, executions)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_order_book_operations() {
>         let mut book = LimitOrderBook::new();
> 
>         book.add_ask_order(100, Order { order_id: 1, quantity: 50 });
>         book.add_ask_order(100, Order { order_id: 2, quantity: 30 });
>         book.add_ask_order(105, Order { order_id: 3, quantity: 100 });
>         book.add_ask_order(110, Order { order_id: 4, quantity: 200 });
> 
>         // Range depth verification
>         let depth_100_105 = book.get_depth_in_range(100, 105);
>         assert_eq!(depth_100_105, 180);
> 
>         let depth_out_of_range = book.get_depth_in_range(200, 300);
>         assert_eq!(depth_out_of_range, 0);
> 
>         // Non-zero liquidity assertion
>         assert_ne!(book.get_depth_in_range(100, 110), 0);
> 
>         // Partial market matching (price 100: 50 from order 1 + 20 from order 2)
>         let (filled, executions) = book.match_market_buy(70);
>         assert_eq!(filled, 70);
>         assert_eq!(executions, vec![(100, 50), (100, 20)]);
> 
>         // Remaining depth at price 100 is 10
>         let remaining_100_depth = book.get_depth_in_range(100, 100);
>         assert_eq!(remaining_100_depth, 10);
> 
>         // Match remaining 10 at 100 and all 100 at 105
>         let (filled_remaining, _) = book.match_market_buy(110);
>         assert_eq!(filled_remaining, 110);
> 
>         // Price levels 100 and 105 should be fully removed
>         assert!(book.asks.get(&100).is_none());
>         assert!(book.asks.get(&105).is_none());
> 
>         // Verify lowest remaining price tick is 110 using matches!
>         assert!(matches!(book.asks.keys().next(), Some(&110)));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
> 
> 
> 1. **Tree Ordering Invariant**: `BTreeMap` guarantees that keys (`u64` price ticks) are maintained in strictly sorted order. Obtaining the lowest ask price tick via `.keys().next()` operates in $O(1)$ time amortized, eliminating the need to sort keys manually or perform full scans.
> 2. **Entry API Ergonomics**: `self.asks.entry(price).or_default()` performs a single tree search to locate or insert the `VecDeque` for a price tick, preventing duplicate lookup overhead ($O(\log N)$ instead of $2 \times O(\log N)$).
> 3. **Price-Time Priority Queue**: Using `VecDeque<Order>` inside each price tick bucket enforces strict FIFO order (`push_back` for insertion, `pop_front` for execution), matching financial exchange compliance standards.
> 4. **Range Query Traversal**: `.range(min_price..=max_price)` performs a binary search to find `min_price` in $O(\log N)$ time, then yields matching price levels up to `max_price`. This allows instant depth calculations without iterating through unrelated price levels.
> 5. **Ownership & Borrowing**: In `match_market_buy`, extracting `let &best_price = self.asks.keys().next().unwrap();` copies the `u64` key, releasing the borrow on `self.asks` so `self.asks.get_mut(&best_price)` can obtain exclusive mutable access to the queue.
> 6. **Edge Cases**: Handled partial order fills (updating `quantity` in-place), full order exhaustion (`pop_front`), price tick deletion (`self.asks.remove(&best_price)` when the queue becomes empty), and market orders exceeding total available book liquidity.

---

### Exercise 2: Time-Series APM Metrics & Retention Pruning Engine

**Scenario:** Application Performance Monitoring (APM) systems continuously record microsecond-timestamped telemetry data (such as CPU usage percentages). High-throughput telemetry engines require efficient range queries for arbitrary sliding time windows `[start_timestamp, end_timestamp]` to render dashboard charts. Additionally, long-running services must regularly prune old historical data beyond a retention cutoff threshold without blocking real-time ingest or triggering heavy garbage collection spikes.

**Task:** Implement a `TimeSeriesStore` leveraging `BTreeMap<u64, MetricEntry>` where microsecond timestamps are keys.
1. `record(&mut self, timestamp: u64, cpu_usage: f64)` — Insert telemetry measurements into the store.
2. `query_range(&self, start: u64, end: u64) -> Option<AggregatedMetric>` — Retrieve and aggregate metrics (count, min, max, avg) within a timestamp range using `BTreeMap::range()`.
3. `prune_older_than(&mut self, cutoff_timestamp: u64) -> usize` — Use `BTreeMap::split_off()` to split the tree at `cutoff_timestamp` in $O(\log N)$ time, discarding entries older than the cutoff and returning the count of pruned records.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::BTreeMap;
> 
> #[derive(Debug, Clone, PartialEq)]
> pub struct MetricEntry {
>     pub cpu_usage: f64,
> }
> 
> #[derive(Debug, PartialEq)]
> pub struct AggregatedMetric {
>     pub count: usize,
>     pub min: f64,
>     pub max: f64,
>     pub avg: f64,
> }
> 
> #[derive(Debug, Default)]
> pub struct TimeSeriesStore {
>     // Key: Microsecond timestamp. Value: Metric entry.
>     metrics: BTreeMap<u64, MetricEntry>,
> }
> 
> impl TimeSeriesStore {
>     pub fn new() -> Self {
>         Self {
>             metrics: BTreeMap::new(),
>         }
>     }
> 
>     pub fn record(&mut self, timestamp: u64, cpu_usage: f64) {
>         self.metrics.insert(timestamp, MetricEntry { cpu_usage });
>     }
> 
>     pub fn query_range(&self, start: u64, end: u64) -> Option<AggregatedMetric> {
>         let entries: Vec<&MetricEntry> = self
>             .metrics
>             .range(start..=end)
>             .map(|(_, entry)| entry)
>             .collect();
> 
>         if entries.is_empty() {
>             return None;
>         }
> 
>         let count = entries.len();
>         let mut min = f64::MAX;
>         let mut max = f64::MIN;
>         let mut sum = 0.0;
> 
>         for entry in entries {
>             let val = entry.cpu_usage;
>             if val < min {
>                 min = val;
>             }
>             if val > max {
>                 max = val;
>             }
>             sum += val;
>         }
> 
>         Some(AggregatedMetric {
>             count,
>             min,
>             max,
>             avg: sum / count as f64,
>         })
>     }
> 
>     pub fn prune_older_than(&mut self, cutoff_timestamp: u64) -> usize {
>         // split_off splits the BTreeMap into two at the given key.
>         // `retained` receives keys >= cutoff_timestamp.
>         // `self.metrics` keeps keys < cutoff_timestamp.
>         let retained = self.metrics.split_off(&cutoff_timestamp);
>         let pruned_count = self.metrics.len();
>         self.metrics = retained;
>         pruned_count
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_time_series_store() {
>         let mut store = TimeSeriesStore::new();
> 
>         store.record(1000, 45.0);
>         store.record(2000, 60.0);
>         store.record(3000, 30.0);
>         store.record(4000, 90.0);
>         store.record(5000, 75.0);
> 
>         // Range query aggregation
>         let aggregate = store.query_range(2000, 4000).unwrap();
>         assert_eq!(aggregate.count, 3);
>         assert_eq!(aggregate.min, 30.0);
>         assert_eq!(aggregate.max, 90.0);
>         assert_eq!(aggregate.avg, 60.0);
> 
>         // Non-matching range
>         assert!(store.query_range(6000, 7000).is_none());
> 
>         // Non-equality assertion for total metrics vs range count
>         assert_ne!(store.metrics.len(), aggregate.count);
> 
>         // Test pruning retention with split_off
>         let pruned_count = store.prune_older_than(3000);
>         assert_eq!(pruned_count, 2); // Timestamps 1000 and 2000 pruned
>         assert_eq!(store.metrics.len(), 3); // Timestamps 3000, 4000, 5000 retained
> 
>         // Verify lowest remaining key is 3000 using matches!
>         assert!(matches!(store.metrics.keys().next(), Some(&3000)));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
> 
> 
> 1. **Time-Series Indexing**: Using timestamps as keys in `BTreeMap` leverages the tree's natural ordering invariant. Unlike `HashMap`, queries over time windows `[t_start, t_end]` do not require scanning the entire dataset.
> 2. **Efficient Range Iteration**: `.range(start..=end)` performs a logarithmic binary search to locate `start` in $O(\log N)$, then sequentially yields elements up to `end`.
> 3. **$O(\log N)$ Retention Pruning with `split_off`**: The `split_off(&cutoff_timestamp)` method splits a B-Tree root node along the key boundary in $O(\log N)$ time. The original tree retains keys strictly less than `cutoff_timestamp`, while the returned map contains keys greater than or equal to `cutoff_timestamp`. Reassigning `self.metrics = retained` drops all expired entries at once, avoiding element-by-element iteration ($O(K \log N)$ deletion).
> 4. **Float Precision & Null Safety**: Floating-point aggregations handle boundaries using `f64::MAX` and `f64::MIN`. Empty ranges safely return `None` rather than producing NaN averages or division-by-zero errors.
> 5. **Edge Cases**: Empty queries, single-element matching windows, pruning when all items are expired, and pruning when no items meet the cutoff threshold.

---

### Exercise 3: OS Kernel Free-Block Memory Manager with Adjacent Coalescing

**Scenario:** Operating system kernels and bare-metal embedded heap allocators track available free memory blocks using address-ordered lists. Each free block is defined by a base physical address (`u64`) and block size (`usize`). When allocating $N$ bytes of memory, the manager locates a free block of sufficient size (First-Fit strategy) and splits it if necessary. When freeing memory, the manager inserts the block back into the free list and immediately **coalesces** (merges) contiguous adjacent memory blocks to prevent memory fragmentation.

**Task:** Implement a `FreeBlockManager` struct using `BTreeMap<u64, usize>` mapping `start_address -> block_size`.
1. `allocate(&mut self, size: usize) -> Option<u64>` — Locate the first free block with size $\ge \text{size}$, remove it, insert any remaining split block fragment back into `free_blocks`, and return the allocated start address.
2. `deallocate(&mut self, addr: u64, size: usize) -> Result<(), AllocError>` — Re-insert the memory block into `free_blocks` with mandatory neighbor coalescing:
   - Check if the preceding free block ends at `addr` (`prev_addr + prev_size == addr`); if so, merge left.
   - Check if the succeeding free block starts at `addr + size`; if so, merge right.
   - Check for memory overlaps or double-free errors, returning `Err(AllocError::OverlapDetected)`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::BTreeMap;
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum AllocError {
>     InvalidAddress,
>     OverlapDetected,
> }
> 
> #[derive(Debug, Default)]
> pub struct FreeBlockManager {
>     // Key: Base start address (u64). Value: Block size in bytes (usize).
>     free_blocks: BTreeMap<u64, usize>,
> }
> 
> impl FreeBlockManager {
>     pub fn new() -> Self {
>         Self {
>             free_blocks: BTreeMap::new(),
>         }
>     }
> 
>     pub fn free_block_count(&self) -> usize {
>         self.free_blocks.len()
>     }
> 
>     pub fn allocate(&mut self, size: usize) -> Option<u64> {
>         if size == 0 {
>             return None;
>         }
> 
>         // Locate first block with adequate size
>         let candidate_addr = self
>             .free_blocks
>             .iter()
>             .find(|(_, &block_size)| block_size >= size)
>             .map(|(&addr, _)| addr);
> 
>         if let Some(start_addr) = candidate_addr {
>             let block_size = self.free_blocks.remove(&start_addr).unwrap();
>             if block_size > size {
>                 let remaining_addr = start_addr + size as u64;
>                 let remaining_size = block_size - size;
>                 self.free_blocks.insert(remaining_addr, remaining_size);
>             }
>             Some(start_addr)
>         } else {
>             None
>         }
>     }
> 
>     pub fn deallocate(&mut self, mut addr: u64, mut size: usize) -> Result<(), AllocError> {
>         if size == 0 {
>             return Err(AllocError::InvalidAddress);
>         }
> 
>         // Step 1: Check for left-coalescing with preceding block
>         let prev_block = self
>             .free_blocks
>             .range(..addr)
>             .next_back()
>             .map(|(&a, &s)| (a, s));
> 
>         if let Some((prev_addr, prev_size)) = prev_block {
>             if prev_addr + prev_size as u64 > addr {
>                 return Err(AllocError::OverlapDetected);
>             }
>             if prev_addr + prev_size as u64 == addr {
>                 self.free_blocks.remove(&prev_addr);
>                 addr = prev_addr;
>                 size += prev_size;
>             }
>         }
> 
>         // Step 2: Check for right-coalescing with succeeding block
>         let next_addr = addr + size as u64;
>         let next_size = self.free_blocks.get(&next_addr).copied();
> 
>         if let Some(n_size) = next_size {
>             self.free_blocks.remove(&next_addr);
>             size += n_size;
>         }
> 
>         // Step 3: Check for overlap with any higher block
>         if let Some((&next_start, _)) = self.free_blocks.range(addr..).next() {
>             if addr + size as u64 > next_start {
>                 return Err(AllocError::OverlapDetected);
>             }
>         }
> 
>         self.free_blocks.insert(addr, size);
>         Ok(())
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_free_block_manager() {
>         let mut manager = FreeBlockManager::new();
> 
>         // Initial free memory block: 0x1000 to 0x5000 (16384 bytes)
>         manager.deallocate(0x1000, 0x4000).unwrap();
>         assert_eq!(manager.free_block_count(), 1);
> 
>         // Allocate 0x1000 bytes -> returns 0x1000, split remainder at 0x2000 (size 0x3000)
>         let addr1 = manager.allocate(0x1000);
>         assert_eq!(addr1, Some(0x1000));
>         assert_eq!(manager.free_block_count(), 1);
> 
>         // Allocate 0x1000 bytes -> returns 0x2000, split remainder at 0x3000 (size 0x2000)
>         let addr2 = manager.allocate(0x1000);
>         assert_eq!(addr2, Some(0x2000));
> 
>         // Excess allocation request fails
>         assert!(manager.allocate(0x10000).is_none());
> 
>         // Deallocate addr2 (0x2000, 0x1000) -> right coalesces with block at 0x3000 (size 0x2000) -> size 0x3000 at 0x2000
>         let res1 = manager.deallocate(0x2000, 0x1000);
>         assert!(res1.is_ok());
>         assert_eq!(manager.free_block_count(), 1);
> 
>         // Deallocate addr1 (0x1000, 0x1000) -> left coalesces with block at 0x2000 -> single block 0x1000 (size 0x4000)
>         let res2 = manager.deallocate(0x1000, 0x1000);
>         assert!(res2.is_ok());
>         assert_eq!(manager.free_block_count(), 1);
>         assert_eq!(manager.free_blocks.get(&0x1000), Some(&0x4000));
> 
>         // Error detection: overlapping deallocation (double free)
>         let err_res = manager.deallocate(0x1800, 0x1000);
>         assert_ne!(err_res, Ok(()));
>         assert!(matches!(err_res, Err(AllocError::OverlapDetected)));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
> 
> 
> 1. **Address-Ordered Memory Map**: Storing free memory blocks as `BTreeMap<u64, usize>` maintains physical base addresses in sorted order. This enables $O(\log N)$ lookup of adjacent free blocks using `.range(..addr)` and `.range(addr..)`.
> 2. **First-Fit Allocation Strategy**: `allocate` searches for the first block whose capacity is $\ge \text{size}$. When a candidate is found, `self.free_blocks.remove(&start_addr)` removes the entry from the map. If the block is larger than required, the remaining unallocated portion is re-inserted at `start_addr + size` with length `block_size - size`.
> 3. **Left Coalescing via `.range(..addr)`**: `range(..addr).next_back()` finds the free block ending closest to `addr`. If `prev_addr + prev_size == addr`, the left block is adjacent. Removing `prev_addr` and updating `addr = prev_addr` and `size += prev_size` merges the left neighbor.
> 4. **Right Coalescing via Key Lookup**: `self.free_blocks.get(&(addr + size))` checks if a free block starts exactly at `addr + size`. If present, removing `next_addr` and extending `size += next_size` merges the right neighbor. If both left and right neighbors are present, double coalescing occurs in a single deallocation step.
> 5. **Safety Invariants & Overlap Detection**: Validates physical boundary constraints (`prev_addr + prev_size > addr` or `addr + size > next_start`), preventing heap corruption or double-free security vulnerabilities.
> 6. **Edge Cases**: Zero-byte requests, full memory exhaustion, non-contiguous allocations, and double-sided coalescing.

---

## 6. Related Terms


- [`HashMap<K, V>`](hashmap_k_v.md) — The unordered sibling with the same core API but different internal structure and trait bounds.
- [`HashSet<T>` / `BTreeSet<T>`](hashset_btreeset.md) — The set counterpart, same underlying B-tree.
- [`PartialOrd` / `Ord`](../level_04/partialord_ord.md) — The required key-comparison trait.
- [Entry API (`.entry(k).or_insert(...)`)](entry_api.md) — `BTreeMap` supports `.entry()` too, with identical semantics to `HashMap`.

---

## 7. Key Takeaways

- `BTreeMap<K, V>` keeps keys in **sorted order at all times**, at the cost of O(log n) instead of O(1) average operations.
- Keys must implement `Ord`, not `Hash` — a fundamentally different requirement from `HashMap`.
- `.range(start..end)` gives efficient, tree-traversal-based access to a contiguous key range — something `HashMap` cannot do efficiently at all.
- Default to `HashMap` for raw speed; reach for `BTreeMap` specifically when sorted iteration or range queries are a real requirement.
