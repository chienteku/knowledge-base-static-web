# `HashMap` and `HashSet`

> **Level 5 — Rust**
> Standard library hash-based collections: `HashMap<K,V>` maps keys to values, `HashSet<T>` stores unique values — both provide O(1) average-case lookup.

---

## 1. Prerequisites

- [`HashMap<K, V>`](../level_02/hashmap_k_v.md) — Standard library HashMap collection.
- [`Hash` Trait](../level_02/hash_trait.md) — The Hash trait required for keys in hash maps.

---

## 2. Term Category

**Collections**: `std::collections::HashMap` (key-value dictionary) and `std::collections::HashSet` (unique value collection) implement open-addressing hash tables backed by Robin Hood / SwissTable cache-optimized layout. By default, Rust uses SipHash 1-3 to offer cryptographic resistance against HashDoS attacks.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Searching linear arrays or vectors (`Vec<T>`) requires $O(N)$ sequential comparison operations, becoming a performance bottleneck as dataset size grows.

`HashMap<K, V>` and `HashSet<T>` resolve this by mapping key values through a hash function into memory buckets, delivering $O(1)$ average-time complexity for insertions, lookups, and deletions:
1. **HashDoS Security**: By default, Rust uses the SipHash 1-3 hashing algorithm with randomized keys per instance. This prevents malicious external input from crafting deliberate hash collisions to force $O(N)$ worst-case degrade attacks.
2. **SwissTable Cache Optimization**: Modern Rust `HashMap` uses the `hashbrown` implementation under the hood. It organizes bucket metadata into SIMD-probeable 16-byte control groups, reducing CPU cache misses during hash table probing.
3. **The Entry API**: The `map.entry(key)` API provides atomic $O(1)$ single-lookup insertion, mutation, and default initialization without redundant table searching.

### (2) Deep Dive — Trait Requirements for Custom Keys

For a type `K` to serve as a key in `HashMap<K, V>` or `HashSet<K>`, it must implement three standard traits:

- **`Eq` & `PartialEq`**: Defines equivalence relationships between key instances.
- **`Hash`**: Hashes key data into a 64-bit integer hash code via `Hasher`.

> [!IMPORTANT]
> **Key Stability Invariant**: If two keys are equal (`k1 == k2`), their computed hash values **must be identical** (`hash(k1) == hash(k2)`). Mutating a key's hashed fields while it resides inside a `HashMap` or `HashSet` breaks hash bucket indexing, causing lookups to fail silently.

### (3) Reality Metaphor

- **`HashMap<K, V>`**: A hotel room keycard rack. Each physical keycard hook is tagged with a room number (`K`). Reaching directly for room hook 304 retrieves the corresponding room keycard (`V`) instantly in $O(1)$ time without searching every room key in the building.
- **`HashSet<T>`**: An exclusive VIP party guest list. When a guest arrives, the bouncer checks the list in $O(1)$ time to verify membership and denies entry if the guest is already marked as checked-in.

### (4) Rust Code Examples

#### Short Snippet (Basic Usage)
```rust
use std::collections::HashMap;

let mut map = HashMap::new();
map.insert("user_101", 95);
assert_eq!(map.get("user_101"), Some(&95));
```

#### Atomic Mutation via the Entry API
```rust
use std::collections::HashMap;

pub fn count_words(words: &[&str]) -> HashMap<String, usize> {
    let mut counts = HashMap::new();
    for &word in words {
        // Single lookup: retrieves existing reference or inserts 0, then increments
        *counts.entry(word.to_string()).or_insert(0) += 1;
    }
    counts
}

fn main() {
    let words = vec!["apple", "banana", "apple", "cherry"];
    let map = count_words(&words);
    assert_eq!(map.get("apple"), Some(&2));
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting `#[derive(Hash, PartialEq, Eq)]` on Custom Key Structs

**The mistake:** Declaring a custom struct or enum and attempting to use it as a `HashMap` key without deriving `Hash`, `PartialEq`, and `Eq`.

**Why it is wrong:** `HashMap` constraints require `K: Hash + Eq`. Omitting these trait derivations triggers compiler error `E0277`.

*Incorrect:*
```rust
struct DeviceId { id: u64 }
// let mut map = HashMap::<DeviceId, String>::new(); // ❌ Error E0277: trait `Hash` is not implemented for `DeviceId`
```

*Fix:*
```rust
#[derive(Hash, PartialEq, Eq, Debug, Clone)]
struct DeviceId { id: u64 }
let mut map = HashMap::<DeviceId, String>::new(); // Correct!
```

### Mistake 2: Writing Verbose `contains_key` Followed by `insert` (Double Lookup Anti-Pattern)

**The mistake:** Checking `if map.contains_key(&key)` followed by `map.get_mut(&key)` or `map.insert(key, val)`.

**Why it is wrong:** Computes the key hash and probes the hash table twice, wasting CPU cycles. Use the `Entry` API (`map.entry(key).or_insert(...)`) for a single atomic lookup.

*Incorrect:*
```rust
if !map.contains_key(&key) {
    map.insert(key.clone(), 0);
}
*map.get_mut(&key).unwrap() += 1; // Double lookup!
```

*Fix:*
```rust
*map.entry(key).or_insert(0) += 1; // Single atomic lookup!
```

### Mistake 3: Mutating Key Fields While Inside `HashMap` via Interior Mutability

**The mistake:** Wrapping a key struct field in `RefCell` or `Mutex` and mutating it while the key is stored inside a `HashMap`.

**Why it is wrong:** Changing key fields alters its hash value. The key now resides in the wrong hash bucket, making it un-findable via `.get()` and corrupting internal map invariants.

---

## 5. Practice Exercises

### Exercise 1: High-Throughput HTTP Request Rate Limiter (Entry API)

**Scenario:** Build an API gateway rate limiter `RateLimiter` using `HashMap<String, RequestQuota>` and the `Entry` API to track client IP request counts and bucket expiration timestamps.

**Requirements:**
1. Define struct `RequestQuota { pub count: usize, pub window_start_sec: u64 }`.
2. Define struct `RateLimiter` wrapping `HashMap<String, RequestQuota>`.
3. Implement `check_rate_limit(&mut self, ip: &str, current_time_sec: u64, max_requests: usize, window_sec: u64) -> bool`.
4. Return `true` if request is allowed, `false` if rate limit exceeded.
5. Write unit tests testing quota resets across time windows.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::HashMap;
> 
> #[derive(Debug, PartialEq)]
> pub struct RequestQuota {
>     pub count: usize,
>     pub window_start_sec: u64,
> }
> 
> pub struct RateLimiter {
>     quotas: HashMap<String, RequestQuota>,
> }
> 
> impl RateLimiter {
>     pub fn new() -> Self {
>         Self { quotas: HashMap::new() }
>     }
> 
>     pub fn check_rate_limit(
>         &mut self,
>         ip: &str,
>         current_time_sec: u64,
>         max_requests: usize,
>         window_sec: u64,
>     ) -> bool {
>         let quota = self.quotas.entry(ip.to_string()).or_insert(RequestQuota {
>             count: 0,
>             window_start_sec: current_time_sec,
>         });
> 
>         if current_time_sec >= quota.window_start_sec + window_sec {
>             quota.count = 1;
>             quota.window_start_sec = current_time_sec;
>             true
>         } else if quota.count < max_requests {
>             quota.count += 1;
>             true
>         } else {
>             false
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_rate_limiter() {
>         let mut limiter = RateLimiter::new();
>         let client_ip = "192.168.1.100";
>         
>         // Max 2 requests per 10 seconds
>         assert!(limiter.check_rate_limit(client_ip, 1000, 2, 10)); // Allowed (count=1)
>         assert!(limiter.check_rate_limit(client_ip, 1002, 2, 10)); // Allowed (count=2)
>         assert!(!limiter.check_rate_limit(client_ip, 1005, 2, 10)); // Blocked!
>         
>         // Window resets at 1011 sec
>         assert!(limiter.check_rate_limit(client_ip, 1012, 2, 10)); // Allowed!
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `self.quotas.entry(ip.to_string()).or_insert(...)` uses the `Entry` API to perform an atomic single lookup.
> 2. Avoids double hash table probing by returning a direct mutable reference `&mut RequestQuota` to update counters in place.

---

### Exercise 2: Distributed Log Event Deduplicator (`HashSet`)

**Scenario:** Implement a high-performance log event deduplicator `EventDeduplicator` that stores 64-bit event hash IDs in a `HashSet<u64>` to eliminate duplicate log entries within a sliding window.

**Requirements:**
1. Define struct `EventDeduplicator` wrapping `HashSet<u64>`.
2. Implement `process_event(&mut self, event_id: u64) -> bool` returning `true` if new, `false` if duplicate.
3. Write unit tests processing arrays of event IDs.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::HashSet;
> 
> pub struct EventDeduplicator {
>     seen_events: HashSet<u64>,
> }
> 
> impl EventDeduplicator {
>     pub fn new() -> Self {
>         Self { seen_events: HashSet::new() }
>     }
> 
>     pub fn process_event(&mut self, event_id: u64) -> bool {
>         self.seen_events.insert(event_id)
>     }
> 
>     pub fn len(&self) -> usize {
>         self.seen_events.len()
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_event_deduplication() {
>         let mut dedup = EventDeduplicator::new();
>         
>         assert!(dedup.process_event(0xDEADBEEF));  // First time -> true
>         assert!(!dedup.process_event(0xDEADBEEF)); // Duplicate -> false
>         assert!(dedup.process_event(0xCAFEBABE));  // New event -> true
>         assert_eq!(dedup.len(), 2);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `HashSet::insert(val)` returns `true` if the item was newly inserted and `false` if it already existed in the set.
> 2. Provides $O(1)$ average time complexity membership checking without allocation overhead per lookup.

---

### Exercise 3: Custom Key IoT Device Router

**Scenario:** Create a network packet routing table `DeviceRouter` using a custom key struct `DeviceId` deriving `Hash, PartialEq, Eq`.

**Requirements:**
1. Define `#[derive(Hash, PartialEq, Eq, Clone, Debug)] struct DeviceId { pub vendor_id: u16, pub serial: u64 }`.
2. Define `DeviceRouter` holding `HashMap<DeviceId, String>`.
3. Implement methods `register_device` and `resolve_route`.
4. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::HashMap;
> 
> #[derive(Hash, PartialEq, Eq, Clone, Debug)]
> pub struct DeviceId {
>     pub vendor_id: u16,
>     pub serial: u64,
> }
> 
> pub struct DeviceRouter {
>     routes: HashMap<DeviceId, String>,
> }
> 
> impl DeviceRouter {
>     pub fn new() -> Self {
>         Self { routes: HashMap::new() }
>     }
> 
>     pub fn register_device(&mut self, device: DeviceId, route_ip: String) {
>         self.routes.insert(device, route_ip);
>     }
> 
>     pub fn resolve_route(&self, device: &DeviceId) -> Option<&str> {
>         self.routes.get(device).map(|s| s.as_str())
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_custom_key_device_router() {
>         let mut router = DeviceRouter::new();
>         let dev1 = DeviceId { vendor_id: 0x10EE, serial: 998822 };
>         
>         router.register_device(dev1.clone(), "10.0.0.45".into());
>         assert_eq!(router.resolve_route(&dev1), Some("10.0.0.45"));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `#[derive(Hash, PartialEq, Eq)]` satisfies key requirements for `HashMap`.
> 2. Compound struct keys can be looked up using shared references `&DeviceId`.

---

## 5. Related Terms

- [`Borrow` / `BorrowMut`](../level_14/borrow_borrow_mut.md)

---

## 7. Key Takeaways

- `HashMap<K, V>` provides $O(1)$ average-time complexity key-value lookups.
- `HashSet<T>` provides $O(1)$ average-time complexity unique set membership checks.
- Custom keys must derive or implement `Hash`, `PartialEq`, and `Eq`.
- Use the `Entry` API (`map.entry(key).or_insert(...)`) to perform atomic single-lookup operations.
- Never mutate a key's hashed data fields while the key is stored inside a hash table.
