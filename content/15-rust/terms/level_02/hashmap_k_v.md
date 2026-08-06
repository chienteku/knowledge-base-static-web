# `HashMap<K, V>`

> **Level 2 — Control Flow & Data Structures**
> A hash map collection for key-value storage.

---

## 1. Prerequisites


- [`Vec<T>`](vec_t.md) — The default collection for lists of items, indexed by numbers.
- [`Option<T>`](option_t.md) — Used heavily when trying to safely read data out of a HashMap.

---

## 2. Term Category



**Rust Collection (hash table key-value map)**: A standard dictionary or map structure found in almost all programming languages. It is known as a `dict` in Python, `HashMap` in Java, `Object` or `Map` in JavaScript, and `std::unordered_map` in C++.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

A [`Vec<T>`](../level_02/vec_t.md) is fantastic for storing lists of data. However, if you have a Vector of 1,000,000 users and you want to find the user named "Alice", you have to check every single user one by one until you find her. This is extremely slow.

A `HashMap<K, V>` stores data in **Key-Value pairs** (e.g., Key: `"Alice"`, Value: `User_Data`). When you insert data, the computer runs the Key through a mathematical "hashing algorithm". This algorithm determines exactly where in memory the Value will be stored. Later, when you ask the HashMap for "Alice", it runs the name through the algorithm again, giving it the exact memory address instantly. This allows you to look up a Value instantly, regardless of whether the Map contains 10 items or 10 million items.

### (2) Reality Metaphor

A Vector is like a **stack of physical files** on a messy desk. To find "Alice's" file, you have to read the name on every single file from top to bottom until you finally find it.

A HashMap is like a **magical filing cabinet clerk**. You walk up to the desk and simply say, "Give me Alice's file." The clerk's brain instantly translates the name "Alice" into "Drawer 4, Folder 12", opens the drawer, and hands it to you immediately.

### (3) Rust Code Examples

#### Short Snippet (Import and Insert)
Unlike `Vec` and `Option`, HashMaps are not used quite as frequently, so Rust does not import them automatically. You must bring them into scope manually!
```rust
// 1. You MUST import HashMap from the standard library's collections module!
use std::collections::HashMap;

fn main() {
    // 2. Create the HashMap
    let mut scores = HashMap::new();

    // 3. Insert Key-Value pairs
    scores.insert(String::from("Blue Team"), 10);
    scores.insert(String::from("Red Team"), 50);
}
```

#### Fuller Example (Safe Retrieval)
```rust
use std::collections::HashMap;

fn main() {
    let mut book_reviews = HashMap::new();
    book_reviews.insert(String::from("Dune"), 5);
    book_reviews.insert(String::from("Twilight"), 2);

    let target_book = String::from("Dune");

    // How do we read data? Use `.get()`!
    // IMPORTANT: `.get()` requires a REFERENCE to the key (`&target_book`), not the key itself.
    // It returns an `Option<&V>` because the book might not exist in the map!
    match book_reviews.get(&target_book) {
        Some(rating) => println!("{} has a rating of {}/5", target_book, rating),
        None => println!("We haven't reviewed {} yet.", target_book),
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Hashmap K V Scoping and Lifecycle Rules

**The mistake:** Assuming Hashmap K V instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("hashmap_k_v_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("hashmap_k_v_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Hashmap K V State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Hashmap K V through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Hashmap K V Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Hashmap K V instances across OS threads via `std::thread::spawn`.

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

## 5. Practice Exercises

### Exercise 1: Distributed Microservice API Rate Limiter & Sliding Window Quota Manager

**Scenario:** **Problem Statement:**
In high-throughput microservices, backend platforms enforce rate limits on API keys or client IP addresses to prevent service overload and guarantee service availability.

**Requirements:**
Implement an in-memory rate limiter using `HashMap<String, QuotaState>`.
1. Define a struct `QuotaState` with `count: u32` and `window_start_sec: u64`.
2. Define a `RateLimiter` struct encapsulating `max_requests: u32`, `window_duration_sec: u64`, and `clients: HashMap<String, QuotaState>`.
3. Implement the following methods for `RateLimiter`:
   - `new(max_requests: u32, window_duration_sec: u64) -> Self`: Constructs a new rate limiter instance.
   - `check_and_record(&mut self, client_id: &str, timestamp_sec: u64) -> bool`: Uses the `HashMap::entry()` API (`.and_modify()` and `.or_insert()`) to record incoming requests in a single map lookup. If the timestamp exceeds the window boundary (`timestamp_sec >= window_start_sec + window_duration_sec`), reset the request count to 1 and update `window_start_sec`. Otherwise, increment `count`. Returns `true` if `count <= max_requests` (request allowed), or `false` if quota is exceeded.
   - `get_client_count(&self, client_id: &str) -> Option<u32>`: Safely retrieves the current request count for a given `client_id` using `HashMap::get()`.
   - `cleanup_idle_clients(&mut self, current_timestamp_sec: u64, max_idle_sec: u64) -> usize`: Uses `HashMap::retain()` to purge entries where `current_timestamp_sec >= state.window_start_sec + max_idle_sec`. Returns the number of purged client entries.

```rust
use std::collections::HashMap;

// TODO: Define QuotaState struct
// TODO: Define RateLimiter struct and implement methods using HashMap entry API and retain()
```

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::HashMap;
> 
> #[derive(Debug, PartialEq, Clone)]
> pub struct QuotaState {
>     pub count: u32,
>     pub window_start_sec: u64,
> }
> 
> pub struct RateLimiter {
>     max_requests: u32,
>     window_duration_sec: u64,
>     clients: HashMap<String, QuotaState>,
> }
> 
> impl RateLimiter {
>     pub fn new(max_requests: u32, window_duration_sec: u64) -> Self {
>         Self {
>             max_requests,
>             window_duration_sec,
>             clients: HashMap::new(),
>         }
>     }
> 
>     pub fn check_and_record(&mut self, client_id: &str, timestamp_sec: u64) -> bool {
>         let max_req = self.max_requests;
>         let window_dur = self.window_duration_sec;
> 
>         let state = self.clients
>             .entry(client_id.to_string())
>             .and_modify(|s| {
>                 if timestamp_sec >= s.window_start_sec + window_dur {
>                     s.count = 1;
>                     s.window_start_sec = timestamp_sec;
>                 } else {
>                     s.count += 1;
>                 }
>             })
>             .or_insert(QuotaState {
>                 count: 1,
>                 window_start_sec: timestamp_sec,
>             });
> 
>         state.count <= max_req
>     }
> 
>     pub fn get_client_count(&self, client_id: &str) -> Option<u32> {
>         self.clients.get(client_id).map(|s| s.count)
>     }
> 
>     pub fn cleanup_idle_clients(&mut self, current_timestamp_sec: u64, max_idle_sec: u64) -> usize {
>         let initial_len = self.clients.len();
>         self.clients.retain(|_, state| {
>             current_timestamp_sec < state.window_start_sec + max_idle_sec
>         });
>         initial_len - self.clients.len()
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_rate_limiter_quota_enforcement() {
>         let mut limiter = RateLimiter::new(3, 10);
>         let client = "api_key_123";
> 
>         // First 3 requests in window (t = 100..105) must be allowed
>         assert!(limiter.check_and_record(client, 100));
>         assert!(limiter.check_and_record(client, 102));
>         assert!(limiter.check_and_record(client, 105));
> 
>         // 4th request exceeds quota (returns false)
>         assert_ne!(limiter.check_and_record(client, 108), true);
>         assert_eq!(limiter.get_client_count(client), Some(4));
> 
>         // Request at t = 111 starts a new window and resets quota count
>         assert!(limiter.check_and_record(client, 111));
>         assert_eq!(limiter.get_client_count(client), Some(1));
> 
>         // Non-existent client yields None
>         let non_existent = limiter.get_client_count("unknown_client");
>         assert!(matches!(non_existent, None));
>     }
> 
>     #[test]
>     fn test_rate_limiter_stale_client_cleanup() {
>         let mut limiter = RateLimiter::new(5, 60);
>         limiter.check_and_record("active_user", 1000);
>         limiter.check_and_record("stale_user", 500);
> 
>         let purged_count = limiter.cleanup_idle_clients(1000, 300);
>         assert_eq!(purged_count, 1);
>         assert_eq!(limiter.get_client_count("stale_user"), None);
>         assert_eq!(limiter.get_client_count("active_user"), Some(1));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Entry API Optimization**: Using `self.clients.entry(client_id.to_string())` avoids the anti-pattern of doing a lookup with `.contains_key()` followed by `.insert()` or `.get_mut()`, which would double the hashing cost ($2 \times \mathcal{O}(1)$). The `Entry` API performs hash computation and bucket lookup exactly once.
> 2. **In-Place Value Mutation**: `.and_modify()` operates directly on an exclusive reference `&mut QuotaState` inside the entry. If the entry exists, it updates `count` or resets the timestamp without re-allocating memory for the `String` key.
> 3. **Ownership and Lookup Borrowing**: `check_and_record` accepts `&str` and converts it to an owned `String` only when creating or matching an entry key. Conversely, `get_client_count` calls `.get(client_id)`, leveraging the `Borrow<str>` implementation for `String` keys, allowing key lookups using borrowed string slices `&str` without allocating memory on heap.
> 4. **Retain for Garbage Collection**: The `retain` method evaluates a closure over key-value pairs `(&K, &mut V)` in-place, removing items when the closure evaluates to `false`. This achieves memory reclamation for idle connections in $\mathcal{O}(N)$ without intermediate allocation of vector keys.
> 
---

### Exercise 2: Observability Log Processing & Multi-Tag Inverted Search Index

**Scenario:** **Problem Statement:**
Log analytics systems index structured log messages under arbitrary metadata tags (e.g. `"env:prod"`, `"level:error"`, `"service:auth"`) to enable instant filtered queries.

**Requirements:**
Implement a multi-tag search index using `HashMap<String, Vec<u64>>` where the key is a tag string and the value is a vector of unique log record IDs (`u64`).
1. Define a `LogInvertedIndex` struct wrapping `index: HashMap<String, Vec<u64>>`.
2. Implement the following methods:
   - `new() -> Self`: Constructs an empty search index.
   - `index_log(&mut self, log_id: u64, tags: &[&str])`: For each tag in `tags`, uses `index.entry(tag.to_string()).or_default()` to retrieve or initialize the `Vec<u64>` entry, and appends `log_id` if it is not already present.
   - `query_tag(&self, tag: &str) -> Option<&[u64]>`: Looks up log IDs associated with a tag and returns a reference slice `Option<&[u64]>`.
   - `tag_count(&self) -> usize`: Returns the total number of indexed tags in the map.
   - `remove_tag(&mut self, tag: &str) -> Option<Vec<u64>>`: Removes a tag index completely using `HashMap::remove()` and returns the owned list of log IDs.
   - `purge_logs_before(&mut self, min_log_id: u64)`: Retains only log IDs $\ge \text{min\_log\_id}$ in every tag's vector. If a tag's vector becomes empty, remove the tag entry from the HashMap using `retain()`.

```rust
use std::collections::HashMap;

// TODO: Define LogInvertedIndex struct and methods
```

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::HashMap;
> 
> #[derive(Default)]
> pub struct LogInvertedIndex {
>     index: HashMap<String, Vec<u64>>,
> }
> 
> impl LogInvertedIndex {
>     pub fn new() -> Self {
>         Self {
>             index: HashMap::new(),
>         }
>     }
> 
>     pub fn index_log(&mut self, log_id: u64, tags: &[&str]) {
>         for &tag in tags {
>             let log_list = self.index.entry(tag.to_string()).or_default();
>             if !log_list.contains(&log_id) {
>                 log_list.push(log_id);
>             }
>         }
>     }
> 
>     pub fn query_tag(&self, tag: &str) -> Option<&[u64]> {
>         self.index.get(tag).map(|vec| vec.as_slice())
>     }
> 
>     pub fn tag_count(&self) -> usize {
>         self.index.len()
>     }
> 
>     pub fn remove_tag(&mut self, tag: &str) -> Option<Vec<u64>> {
>         self.index.remove(tag)
>     }
> 
>     pub fn purge_logs_before(&mut self, min_log_id: u64) {
>         self.index.retain(|_, log_ids| {
>             log_ids.retain(|&id| id >= min_log_id);
>             !log_ids.is_empty()
>         });
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_log_indexing_and_query() {
>         let mut idx = LogInvertedIndex::new();
>         idx.index_log(101, &["level:error", "service:auth"]);
>         idx.index_log(102, &["level:info", "service:auth"]);
>         idx.index_log(103, &["level:error", "service:db"]);
> 
>         // Verify log query slices
>         assert_eq!(idx.query_tag("level:error").unwrap(), &[101, 103]);
>         assert_eq!(idx.query_tag("service:auth").unwrap(), &[101, 102]);
> 
>         // Non-existent tag query returns None
>         assert!(idx.query_tag("service:network").is_none());
>         assert_ne!(idx.tag_count(), 0);
>     }
> 
>     #[test]
>     fn test_tag_removal_and_log_purging() {
>         let mut idx = LogInvertedIndex::new();
>         idx.index_log(10, &["env:prod"]);
>         idx.index_log(20, &["env:prod"]);
> 
>         let removed = idx.remove_tag("env:prod");
>         assert_eq!(removed, Some(vec![10, 20]));
>         assert!(matches!(idx.remove_tag("env:prod"), None));
> 
>         // Test log retention purging
>         idx.index_log(5, &["region:us-east"]);
>         idx.index_log(15, &["region:us-east"]);
>         idx.purge_logs_before(10);
> 
>         assert_eq!(idx.query_tag("region:us-east").unwrap(), &[15]);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Default Initialization with `or_default()`**: `self.index.entry(tag.to_string()).or_default()` yields an `&mut Vec<u64>`. If the key exists, it returns a mutable reference to the existing vector; if not, it constructs a new empty vector using `Default::default()` and inserts it into the map.
> 2. **Slice Borrowing (`Option<&[u64]>`)**: `query_tag` transforms `Option<&Vec<u64>>` into `Option<&[u64]>` via `.map(|v| v.as_slice())`. Returning a slice reference avoids cloning the underlying vector and decouples caller interface from internal storage structures.
> 3. **Ownership Transfer in `.remove()`**: Calling `self.index.remove(tag)` extracts the key-value pair from the table, returning `Option<V>` (here `Option<Vec<u64>>`). The HashMap hands total ownership of the internal vector to the caller, deallocating the table entry slot.
> 4. **Nested Retain Closures**: `purge_logs_before` nesting `retain` on both the outer `HashMap` and inner `Vec<u64>` allows atomic pruning of outdated elements. Returning `!log_ids.is_empty()` in the HashMap retain closure ensures empty key buckets are immediately dropped to minimize hash table load factor.
> 
---

### Exercise 3: High-Frequency Market Ticker Stats & VWAP Aggregator

**Scenario:** **Problem Statement:**
Financial exchanges aggregate trade executions across multiple stock/crypto ticker symbols (`"BTC-USD"`, `"AAPL"`, `"ETH-USD"`). Aggregators track metrics per symbol: count of trades, total volume, min execution price, max execution price, and cumulative Volume-Weighted Average Price (VWAP).

**Requirements:**
Implement a financial market trade aggregator using `HashMap<String, TickerStats>`.
1. Define a `TickerStats` struct with fields:
   - `trade_count: u64`
   - `total_volume: f64`
   - `min_price: f64`
   - `max_price: f64`
   - `vwap_numerator: f64` (accumulated sum of $\text{price} \times \text{volume}$)
2. Implement a `TradeAggregator` struct wrapping `metrics: HashMap<String, TickerStats>`.
3. Implement methods:
   - `new() -> Self`
   - `record_trade(&mut self, symbol: &str, price: f64, volume: f64)`: Uses `HashMap::entry()` with `.and_modify()` and `.or_insert()` to update `TickerStats` in-place. Update `min_price` and `max_price` appropriately, accumulate `total_volume`, increment `trade_count`, and add `price * volume` to `vwap_numerator`.
   - `get_vwap(&self, symbol: &str) -> Option<f64>`: Returns `Option<f64>` containing `vwap_numerator / total_volume` (or `None` if symbol is absent or volume is zero).
   - `get_stats(&self, symbol: &str) -> Option<&TickerStats>`: Safely retrieves an immutable reference to `TickerStats` using `.get()`.
   - `prune_low_volume_symbols(&mut self, min_volume: f64) -> usize`: Uses `HashMap::retain()` to drop symbols with `total_volume < min_volume`. Returns total count of pruned symbols.

```rust
use std::collections::HashMap;

// TODO: Define TickerStats and TradeAggregator structs and methods
```

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::HashMap;
> 
> #[derive(Debug, PartialEq, Clone)]
> pub struct TickerStats {
>     pub trade_count: u64,
>     pub total_volume: f64,
>     pub min_price: f64,
>     pub max_price: f64,
>     pub vwap_numerator: f64,
> }
> 
> #[derive(Default)]
> pub struct TradeAggregator {
>     metrics: HashMap<String, TickerStats>,
> }
> 
> impl TradeAggregator {
>     pub fn new() -> Self {
>         Self {
>             metrics: HashMap::new(),
>         }
>     }
> 
>     pub fn record_trade(&mut self, symbol: &str, price: f64, volume: f64) {
>         let trade_val = price * volume;
>         self.metrics
>             .entry(symbol.to_string())
>             .and_modify(|s| {
>                 s.trade_count += 1;
>                 s.total_volume += volume;
>                 s.min_price = s.min_price.min(price);
>                 s.max_price = s.max_price.max(price);
>                 s.vwap_numerator += trade_val;
>             })
>             .or_insert(TickerStats {
>                 trade_count: 1,
>                 total_volume: volume,
>                 min_price: price,
>                 max_price: price,
>                 vwap_numerator: trade_val,
>             });
>     }
> 
>     pub fn get_vwap(&self, symbol: &str) -> Option<f64> {
>         self.metrics.get(symbol).and_then(|s| {
>             if s.total_volume > 0.0 {
>                 Some(s.vwap_numerator / s.total_volume)
>             } else {
>                 None
>             }
>         })
>     }
> 
>     pub fn get_stats(&self, symbol: &str) -> Option<&TickerStats> {
>         self.metrics.get(symbol)
>     }
> 
>     pub fn prune_low_volume_symbols(&mut self, min_volume: f64) -> usize {
>         let initial_len = self.metrics.len();
>         self.metrics.retain(|_, stats| stats.total_volume >= min_volume);
>         initial_len - self.metrics.len()
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_trade_aggregation_and_vwap() {
>         let mut agg = TradeAggregator::new();
>         agg.record_trade("BTC-USD", 50000.0, 1.5);
>         agg.record_trade("BTC-USD", 52000.0, 0.5);
> 
>         let stats = agg.get_stats("BTC-USD").unwrap();
>         assert_eq!(stats.trade_count, 2);
>         assert_eq!(stats.total_volume, 2.0);
>         assert_eq!(stats.min_price, 50000.0);
>         assert_eq!(stats.max_price, 52000.0);
> 
>         // VWAP calculation: (50000*1.5 + 52000*0.5) / 2.0 = (75000 + 26000)/2.0 = 101000/2.0 = 50500.0
>         let vwap = agg.get_vwap("BTC-USD");
>         assert!(vwap.is_some());
>         assert_eq!(vwap.unwrap(), 50500.0);
> 
>         // Query non-existent symbol returns None
>         let unknown_stats = agg.get_stats("UNKNOWN");
>         assert!(matches!(unknown_stats, None));
>     }
> 
>     #[test]
>     fn test_low_volume_pruning() {
>         let mut agg = TradeAggregator::new();
>         agg.record_trade("HIGH_VOL", 100.0, 500.0);
>         agg.record_trade("LOW_VOL", 10.0, 5.0);
> 
>         let pruned = agg.prune_low_volume_symbols(50.0);
>         assert_ne!(pruned, 0);
>         assert_eq!(pruned, 1);
>         assert!(agg.get_stats("LOW_VOL").is_none());
>         assert!(agg.get_stats("HIGH_VOL").is_some());
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Single-Pass Aggregation via Entry API**: `record_trade` computes the trade value (`price * volume`) once and executes `entry(symbol.to_string())`. If the ticker key exists in the map bucket, `.and_modify()` updates cumulative statistics without heap allocation. If vacant, `.or_insert()` inserts the initial `TickerStats` struct.
> 2. **Float Arithmetic & `Option` Chaining**: Floating-point operations use `.min()` and `.max()` to compute minimum/maximum boundaries. In `get_vwap()`, `.and_then()` safely guards against zero division if `total_volume` is `0.0`.
> 3. **Borrowed Key Queries (`&str` vs `String`)**: `HashMap<String, TickerStats>` supports lookup via `.get(&str)` because `String` implements `Borrow<str>`. This means `get_vwap` and `get_stats` pass a string slice `&str` directly without incurring allocation overhead (`.to_string()`).
> 4. **In-place Table Filtering**: `prune_low_volume_symbols` executes `.retain(|_, stats| stats.total_volume >= min_volume)`. It iterates through hash table buckets in $\mathcal{O}(N)$ time, dropping sub-threshold entries in place and keeping overall load factor clean.
> 
---

## 6. Related Terms


- [`Vec<T>`](vec_t.md) — The standard collection for ordered lists, where items are looked up by a numerical index rather than a Key.
- [`Option<T>`](option_t.md) — The type returned by `HashMap::get()`, ensuring you safely handle the scenario where the Key doesn't exist.
- [`BTreeMap<K, V>`](btreemap_k_v.md) — Related concept: `BTreeMap<K, V>`.
- [Entry API (`.entry(k).or_insert(...)`)](entry_api.md) — Related concept: Entry API (`.entry(k).or_insert(...)`).
- [`Hash` Trait](hash_trait.md) — Related concept: `Hash` Trait.
- [`HashSet<T>` / `BTreeSet<T>`](hashset_btreeset.md) — Related concept: `HashSet<T>` / `BTreeSet<T>`.

---

## 7. Key Takeaways

- `HashMap<K, V>` stores data in **Key-Value pairs**.
- It allows for near-instant data lookup by Key, regardless of how large the map gets.
- You must manually import it at the top of your file using `use std::collections::HashMap;`.
- Use `.insert(key, value)` to add data.
- Use `.get(&key)` to retrieve data. It requires a reference to the key, and it safely returns an `Option<&V>` in case the key is missing.
