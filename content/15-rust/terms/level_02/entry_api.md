# Entry API (`.entry(k).or_insert(...)`)

> **Level 2 — Control Flow & Data Structures**
> The idiomatic single-lookup pattern for "insert if absent, otherwise update" on `HashMap`/`BTreeMap`.

---

## 1. Prerequisites


- [`HashMap<K, V>`](hashmap_k_v.md) — The collection this API is a method on.
- [Closures (`|args| body`)](../level_06/closure.md) — Used by the lazy `or_insert_with` variant.
- [`Default` Trait](../level_04/default_trait.md) — Used by `or_default`.

---

## 2. Term Category

**Collection Idiom (the single-lookup pattern)**: The Entry API is `HashMap`'s answer to "insert-if-absent, update-if-present" — one of the most common map operations in any language. It exists to replace a naive two-lookup pattern with a single, efficient traversal into the map's internal structure.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The obvious way to write "increment a counter for this key, starting at 0 if it's new" is: `if !map.contains_key(&key) { map.insert(key, 0); } map[key] += 1;` (or the borrow-checker-friendlier `match map.get_mut(&key)`). Both approaches walk the map's internal hash buckets **twice** — once to check, once to insert/update — which is wasteful, and the `match`-based version is verbose. Rust's `HashMap::entry()` method solves both problems: it does the bucket lookup exactly once, returning an `Entry` enum (`Occupied` or `Vacant`) that represents "the exact spot this key belongs, whether or not it's filled yet." Every subsequent method on that `Entry` — `or_insert`, `or_insert_with`, `and_modify` — operates on that already-found spot, with no second traversal.

### (2) Reality Metaphor

Imagine checking into a hotel with an assigned room number, but you're not sure if the room already has a guest.

- **The naive two-lookup approach**: You ask the front desk "is room 402 occupied?" (lookup #1). They say no. You then separately ask them to "please put a guest in room 402" (lookup #2, walking to the room again).
- **The Entry API**: You ask the front desk for "room 402" — they walk you *directly* to the room's door (**one lookup**) and hand you a key that represents "this exact room, occupied or not." From there, you can say "if it's empty, put someone in; either way, hand me the current occupant" — all without the front desk needing to look anything up again.

### (3) Rust Code Examples

#### Short Snippet (Counting Word Frequencies)
```rust
use std::collections::HashMap;

fn main() {
    let words = ["a", "b", "a", "c", "b", "a"];
    let mut counts: HashMap<&str, i32> = HashMap::new();

    for word in words {
        // "Get the entry for `word`; if vacant, insert 0; either way, give me a &mut to it."
        *counts.entry(word).or_insert(0) += 1;
    }

    println!("{:?}", counts); // {"a": 3, "b": 2, "c": 1}
}
```

#### Fuller Example (Grouping Into a `Vec` Per Key, With `or_default` and `and_modify`)
```rust
use std::collections::HashMap;

fn main() {
    let pairs = [("fruit", "apple"), ("veg", "carrot"), ("fruit", "banana")];
    let mut groups: HashMap<&str, Vec<&str>> = HashMap::new();

    for (category, item) in pairs {
        // or_default(): Vec<&str>::default() is an empty Vec — no closure needed.
        groups.entry(category).or_default().push(item);
    }
    println!("{:?}", groups); // {"fruit": ["apple", "banana"], "veg": ["carrot"]}

    // and_modify runs ONLY if the key already exists, chained before or_insert.
    let mut scores: HashMap<&str, i32> = HashMap::new();
    scores.entry("alice").and_modify(|s| *s += 10).or_insert(100);
    scores.entry("alice").and_modify(|s| *s += 10).or_insert(100);
    println!("{:?}", scores); // {"alice": 110}  (100 on first call, +10 on second)
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Entry Api Scoping and Lifecycle Rules

**The mistake:** Assuming Entry Api instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("entry_api_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("entry_api_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Entry Api State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Entry Api through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Entry Api Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Entry Api instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Multi-Tenant API Rate Limiter & Token Bucket Aggregator

**Scenario:** **Problem Statement:**
In a high-performance network API gateway, rate limiting is applied per client tenant and API endpoint route combination. Each tenant-route pair operates a token bucket algorithm to enforce rate limits. If a tenant makes a request, the system must check whether a bucket exists for `(client_id, endpoint)`:
1. If the token bucket already exists, replenish its tokens based on the elapsed time since `last_refill_timestamp` before consuming requested tokens.
2. If the token bucket does not exist, initialize a new `TokenBucket` with default capacity and current timestamp using lazy insertion.
3. If sufficient tokens are available, deduct the requested tokens and return `Ok(remaining_tokens)`. Otherwise, return `Err(RateLimitError::Exceeded { remaining, requested })`.

**Requirements:**
Implement `RateLimiter::consume` using `HashMap::entry`, chaining `.and_modify()` for token replenishment on existing buckets and `.or_insert_with_key()` for lazy bucket initialization. Ensure your unit tests verify token deduction, error handling when tokens are exhausted, token replenishment over simulated time, and type assertions using `matches!`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::HashMap;
> 
> #[derive(Debug, Clone, PartialEq, Eq, Hash)]
> pub struct TenantRouteKey {
>     pub client_id: String,
>     pub endpoint: String,
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct TokenBucket {
>     pub available_tokens: u32,
>     pub max_capacity: u32,
>     pub refill_rate_per_sec: u32,
>     pub last_refill_timestamp: u64,
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum RateLimitError {
>     Exceeded { remaining: u32, requested: u32 },
> }
> 
> pub struct RateLimiter {
>     buckets: HashMap<TenantRouteKey, TokenBucket>,
>     default_capacity: u32,
>     default_refill_rate: u32,
> }
> 
> impl RateLimiter {
>     pub fn new(default_capacity: u32, default_refill_rate: u32) -> Self {
>         Self {
>             buckets: HashMap::new(),
>             default_capacity,
>             default_refill_rate,
>         }
>     }
> 
>     pub fn consume(
>         &mut self,
>         client_id: &str,
>         endpoint: &str,
>         requested: u32,
>         current_timestamp: u64,
>     ) -> Result<u32, RateLimitError> {
>         let key = TenantRouteKey {
>             client_id: client_id.to_string(),
>             endpoint: endpoint.to_string(),
>         };
> 
>         let default_cap = self.default_capacity;
>         let default_rate = self.default_refill_rate;
> 
>         // Single-lookup via Entry API:
>         // and_modify refills existing buckets; or_insert_with_key lazily constructs missing ones.
>         let bucket = self
>             .buckets
>             .entry(key)
>             .and_modify(|b| {
>                 let elapsed = current_timestamp.saturating_sub(b.last_refill_timestamp);
>                 if elapsed > 0 {
>                     let added = elapsed.saturating_mul(b.refill_rate_per_sec as u64) as u32;
>                     b.available_tokens = b.available_tokens.saturating_add(added).min(b.max_capacity);
>                     b.last_refill_timestamp = current_timestamp;
>                 }
>             })
>             .or_insert_with_key(|_k| TokenBucket {
>                 available_tokens: default_cap,
>                 max_capacity: default_cap,
>                 refill_rate_per_sec: default_rate,
>                 last_refill_timestamp: current_timestamp,
>             });
> 
>         if bucket.available_tokens >= requested {
>             bucket.available_tokens -= requested;
>             Ok(bucket.available_tokens)
>         } else {
>             Err(RateLimitError::Exceeded {
>                 remaining: bucket.available_tokens,
>                 requested,
>             })
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_rate_limiter_entry_api_flow() {
>         let mut limiter = RateLimiter::new(100, 10);
> 
>         // Initial request lazily creates bucket with 100 tokens, consumes 30 -> 70 remain
>         let res1 = limiter.consume("tenant_a", "/api/v1/resource", 30, 1000);
>         assert_eq!(res1, Ok(70));
> 
>         // Second request at same timestamp consumes 50 -> 20 remain
>         let res2 = limiter.consume("tenant_a", "/api/v1/resource", 50, 1000);
>         assert_eq!(res2, Ok(20));
> 
>         // Third request asks for 30, but only 20 available -> RateLimitError::Exceeded
>         let res3 = limiter.consume("tenant_a", "/api/v1/resource", 30, 1000);
>         assert!(res3.is_err());
>         assert_eq!(
>             res3,
>             Err(RateLimitError::Exceeded {
>                 remaining: 20,
>                 requested: 30
>             })
>         );
>         assert!(matches!(res3, Err(RateLimitError::Exceeded { .. })));
> 
>         // 5 seconds elapse -> refill 5 * 10 = 50 tokens -> available: 20 + 50 = 70
>         // Consume 40 -> 30 remain
>         let res4 = limiter.consume("tenant_a", "/api/v1/resource", 40, 1005);
>         assert_eq!(res4, Ok(30));
>         assert_ne!(res4, Ok(70));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Single-Traversal Mechanics**: Calling `self.buckets.entry(key)` performs a single hash calculation and bucket table traversal to locate the target slot. The returned `Entry` enum encapsulates the map slot.
> 2. **`and_modify` Execution Model**: The closure passed to `.and_modify(|b| ...)` executes strictly when the `Entry` is `Occupied`. This allows executing timestamp delta calculation and saturating token replenishment in-place on the existing `TokenBucket` before returning the mutable reference.
> 3. **`or_insert_with_key` Laziness**: If the `Entry` is `Vacant`, `.and_modify()` is bypassed, and `.or_insert_with_key()` constructs the default `TokenBucket` lazily. Using `or_insert_with_key` avoids upfront allocation of default values when entries are occupied.
> 4. **Borrowing & Lifetimes**: The method returns a `&mut TokenBucket` referencing the bucket inside `HashMap`. The mutable borrow of `self.buckets` lasts for the duration of `.entry(...)`, after which the reference to the internal `TokenBucket` is obtained safely without violating Rust's aliasing XOR mutability rules.
> 5. **Edge Cases**: Uses `saturating_sub`, `saturating_mul`, and `saturating_add` to protect against timestamp clock skew or arithmetic overflow. Limits token replenishment to `max_capacity` using `.min()`.
> 
---

### Exercise 2: Real-Time Financial Order Book Depth & Price Level Pruning Engine

**Scenario:** **Problem Statement:**
In an electronic trading engine, order books maintain bid and ask depth indexed by price ticks using a sorted map (`BTreeMap<u64, PriceLevel>`). When market participants submit or cancel orders:
1. `add_order` should update an existing price level by adding quantity and incrementing order count, or create a new price level if vacant.
2. `cancel_order` should locate the price level at `price_cents`. If occupied, it decrements the available volume. If the volume reaches 0 (or quantity requested for cancellation covers all volume), it must prune the price level entirely from the `BTreeMap` without performing a secondary lookup by key.
3. If attempting to cancel from a vacant price level, it must return a clear `Result::Err`.

**Requirements:**
Implement `OrderBook` using `BTreeMap::entry` and pattern match on `Entry::Occupied(mut entry)` to invoke `OccupiedEntry::remove` for $O(\log N)$ in-place level pruning. Write unit tests confirming order aggregation, partial cancellation, total pruning, and error handling for missing price levels.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::btree_map::Entry;
> use std::collections::BTreeMap;
> 
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub enum OrderSide {
>     Bid,
>     Ask,
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct PriceLevel {
>     pub total_quantity: u64,
>     pub order_count: u32,
> }
> 
> pub struct OrderBook {
>     pub bids: BTreeMap<u64, PriceLevel>,
>     pub asks: BTreeMap<u64, PriceLevel>,
> }
> 
> impl OrderBook {
>     pub fn new() -> Self {
>         Self {
>             bids: BTreeMap::new(),
>             asks: BTreeMap::new(),
>         }
>     }
> 
>     pub fn add_order(&mut self, side: OrderSide, price_cents: u64, quantity: u64) {
>         let tree = match side {
>             OrderSide::Bid => &mut self.bids,
>             OrderSide::Ask => &mut self.asks,
>         };
> 
>         tree.entry(price_cents)
>             .and_modify(|level| {
>                 level.total_quantity += quantity;
>                 level.order_count += 1;
>             })
>             .or_insert(PriceLevel {
>                 total_quantity: quantity,
>                 order_count: 1,
>             });
>     }
> 
>     pub fn cancel_order(
>         &mut self,
>         side: OrderSide,
>         price_cents: u64,
>         quantity: u64,
>     ) -> Result<Option<PriceLevel>, String> {
>         let tree = match side {
>             OrderSide::Bid => &mut self.bids,
>             OrderSide::Ask => &mut self.asks,
>         };
> 
>         match tree.entry(price_cents) {
>             Entry::Occupied(mut occupied) => {
>                 let level = occupied.get_mut();
>                 if quantity >= level.total_quantity {
>                     // Prune empty price level directly from BTreeMap using OccupiedEntry::remove
>                     occupied.remove();
>                     Ok(None)
>                 } else {
>                     level.total_quantity -= quantity;
>                     if level.order_count > 1 {
>                         level.order_count -= 1;
>                     }
>                     Ok(Some(level.clone()))
>                 }
>             }
>             Entry::Vacant(_) => Err(format!("Price level {} not found", price_cents)),
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_order_book_entry_pruning() {
>         let mut book = OrderBook::new();
> 
>         // Insert orders at price 10000 cents ($100.00)
>         book.add_order(OrderSide::Bid, 10000, 50);
>         book.add_order(OrderSide::Bid, 10000, 30);
> 
>         assert!(book.bids.contains_key(&10000));
>         let level = book.bids.get(&10000).unwrap();
>         assert_eq!(level.total_quantity, 80);
>         assert_eq!(level.order_count, 2);
> 
>         // Partial cancellation: 30 units removed -> 50 units remain
>         let res1 = book.cancel_order(OrderSide::Bid, 10000, 30);
>         assert!(res1.is_ok());
>         let updated = res1.unwrap();
>         assert!(updated.is_some());
>         assert_eq!(updated.as_ref().unwrap().total_quantity, 50);
>         assert_ne!(updated.as_ref().unwrap().total_quantity, 80);
> 
>         // Full cancellation: remaining 50 units removed -> price level pruned
>         let res_pruned = book.cancel_order(OrderSide::Bid, 10000, 50);
>         assert_eq!(res_pruned, Ok(None));
>         assert!(!book.bids.contains_key(&10000));
> 
>         // Cancelling non-existent price level returns Err
>         let res_err = book.cancel_order(OrderSide::Bid, 99999, 10);
>         assert!(res_err.is_err());
>         assert!(matches!(res_err, Err(_)));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **`BTreeMap::entry` vs `HashMap::entry`**: `BTreeMap` maintains key ordering (sorted by price tick), making `.entry()` traverse a self-balancing B-Tree in $O(\log N)$ time.
> 2. **In-Place Node Pruning with `OccupiedEntry::remove`**: Naively deleting a key requires finding the node (`get_mut`), checking condition, dropping borrow, and calling `tree.remove(&key)` (a second $O(\log N)$ tree traversal). By pattern-matching on `Entry::Occupied(mut occupied)`, we call `occupied.remove()`, which deletes the node directly from the tree structure using the internal cursor already pointing to that node.
> 3. **Ownership and Value Recovery**: `OccupiedEntry::remove(self)` consumes the occupied entry handle and returns ownership of the stored `V` (`PriceLevel`). This guarantees memory safety while avoiding any redundant tree navigations.
> 4. **Edge Cases**: Complete cancellation where `quantity >= level.total_quantity` cleanly prevents zero-volume price levels from bloating memory and search trees.
> 
---

### Exercise 3: Lexical Symbol Table with Lazy Type Inference & Re-binding

**Scenario:** **Problem Statement:**
In a language compiler AST traversal, a symbol table tracks variable scope bindings, dynamic types, and reference usage counts.
1. When resolving a symbol reference via `resolve_or_define(name, default_kind)`:
   - If the symbol already exists in the table, increment its `reference_count` by 1 using `.and_modify()` without altering its declared `kind`.
   - If the symbol does not exist, initialize a new `SymbolRecord` with `reference_count = 1` and `is_exported = false` using `or_insert_with_key` to borrow the key reference without redundant allocations.
2. `export_symbol(name)` locates the symbol using `Entry::Occupied` to set `is_exported = true` and returns `Ok(previous_is_exported_state)`. If the symbol is absent (`Entry::Vacant`), it returns `Err`.

**Requirements:**
Implement `SymbolTable` using the Entry API. Write unit tests with assertions (`assert_eq!`, `assert!`, `assert_ne!`, `matches!`) covering symbol creation, reference count increments, type preservation, and export flags.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::hash_map::Entry;
> use std::collections::HashMap;
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub enum SymbolKind {
>     Variable,
>     Function { arity: usize },
>     Constant,
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct SymbolRecord {
>     pub name: String,
>     pub kind: SymbolKind,
>     pub reference_count: usize,
>     pub is_exported: bool,
> }
> 
> #[derive(Default)]
> pub struct SymbolTable {
>     symbols: HashMap<String, SymbolRecord>,
> }
> 
> impl SymbolTable {
>     pub fn new() -> Self {
>         Self {
>             symbols: HashMap::new(),
>         }
>     }
> 
>     pub fn resolve_or_define(&mut self, name: &str, default_kind: SymbolKind) -> &mut SymbolRecord {
>         self.symbols
>             .entry(name.to_string())
>             .and_modify(|rec| rec.reference_count += 1)
>             .or_insert_with_key(|k| SymbolRecord {
>                 name: k.clone(),
>                 kind: default_kind,
>                 reference_count: 1,
>                 is_exported: false,
>             })
>     }
> 
>     pub fn export_symbol(&mut self, name: &str) -> Result<bool, String> {
>         match self.symbols.entry(name.to_string()) {
>             Entry::Occupied(mut entry) => {
>                 let rec = entry.get_mut();
>                 let prev = rec.is_exported;
>                 rec.is_exported = true;
>                 Ok(prev)
>             }
>             Entry::Vacant(_) => Err(format!("Cannot export undefined symbol: '{}'", name)),
>         }
>     }
> 
>     pub fn get_symbol(&self, name: &str) -> Option<&SymbolRecord> {
>         self.symbols.get(name)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_symbol_table_resolution_and_export() {
>         let mut table = SymbolTable::new();
> 
>         // Define initial variable symbol
>         let rec1 = table.resolve_or_define("max_threads", SymbolKind::Variable);
>         assert_eq!(rec1.name, "max_threads");
>         assert_eq!(rec1.reference_count, 1);
>         assert_eq!(rec1.kind, SymbolKind::Variable);
> 
>         // Resolving again increments reference_count and preserves original kind
>         let rec2 = table.resolve_or_define("max_threads", SymbolKind::Constant);
>         assert_eq!(rec2.reference_count, 2);
>         assert_eq!(rec2.kind, SymbolKind::Variable);
>         assert_ne!(rec2.kind, SymbolKind::Constant);
> 
>         // Export existing symbol
>         let export_res = table.export_symbol("max_threads");
>         assert_eq!(export_res, Ok(false));
> 
>         let current = table.get_symbol("max_threads").unwrap();
>         assert!(current.is_exported);
> 
>         // Exporting undefined symbol returns error
>         let err_res = table.export_symbol("undefined_var");
>         assert!(err_res.is_err());
>         assert!(matches!(err_res, Err(_)));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Zero-Overhead Symbol Resolution**: `resolve_or_define` combines `.entry(key)`, `.and_modify()`, and `.or_insert_with_key()`. When a symbol is already present, `.and_modify()` updates `reference_count` in-place on the internal reference without re-allocating or modifying existing metadata fields like `kind`.
> 2. **Key Access in Initialization (`or_insert_with_key`)**: The closure passed to `or_insert_with_key(|k| ...)` receives a reference `&K` (`&String`) to the key passed to `.entry()`. This allows copying or cloning key data directly into the newly constructed `SymbolRecord` without needing external variable captures.
> 3. **Occupied vs Vacant Entry Branching**: `export_symbol` demonstrates explicit pattern matching on `Entry`. `Entry::Occupied(mut entry)` yields a handle to the found bucket, from which `entry.get_mut()` extracts `&mut SymbolRecord` to mutate `is_exported`. If `Entry::Vacant`, we avoid panicking or inserting garbage state, cleanly returning an error string.
> 4. **Lifetime Guarantees**: `resolve_or_define` returns `&mut SymbolRecord` tied to the lifetime of `&mut self`. Rust's borrow checker ensures that the returned mutable reference maintains exclusive access to the underlying table slot until it goes out of scope.
> 
---

## 6. Related Terms


- [`HashMap<K, V>`](hashmap_k_v.md)
- [`Default` Trait](../level_04/default_trait.md) — Powers `.or_default()`.
- [Closures (`|args| body`)](../level_06/closure.md) — What `.or_insert_with()` and `.and_modify()` accept.
- [Ownership](../level_03/ownership.md) — Why a naive two-lookup pattern is even a problem worth solving — `Entry` holds onto the located slot so you don't re-borrow the map twice.
- [`BTreeMap<K, V>`](btreemap_k_v.md) — Related concept: `BTreeMap<K, V>`.

---

## 7. Key Takeaways

- `.entry(key)` performs exactly **one** internal lookup, returning an `Entry` that represents "this key's slot, filled or not."
- `.or_insert(v)` inserts `v` if vacant, and always returns a `&mut V` to the (now-guaranteed-present) value.
- `.or_insert_with(closure)` is the lazy version — use it when computing the default value is expensive.
- `.or_default()` inserts `V::default()` if vacant — the shortest form, when `V: Default`.
- `.and_modify(closure)` runs only on the `Occupied` branch, and is commonly chained before `.or_insert(...)`.
