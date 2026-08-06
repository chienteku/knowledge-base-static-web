# `HashSet<T>` / `BTreeSet<T>`

> **Level 2 — Control Flow & Data Structures**
> Collections of unique values — hash-based (unordered) or B-tree-based (sorted).

---

## 1. Prerequisites


- [`HashMap<K, V>`](hashmap_k_v.md) — `HashSet<T>` is implemented internally as `HashMap<T, ()>`.
- [`Hash` Trait](hash_trait.md) — Required for `HashSet` elements.
- [`PartialOrd` / `Ord`](../level_04/partialord_ord.md) — Required for `BTreeSet` elements.

---

## 2. Term Category

**Collection Type (the deduplicator)**: A `Set` answers one question extremely efficiently: "have I seen this value before?" `HashSet<T>` and `BTreeSet<T>` are Rust's two set implementations — same core guarantee (no duplicates), different trade-offs (hashing speed vs. sorted iteration order).

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

A very common task is "give me the unique values from this collection" or "quickly check membership." You *could* use a `Vec<T>` and call `.contains()`, but that's an O(n) linear scan for every check. You could use a `HashMap<T, ()>` — and in fact that's *exactly* what `HashSet<T>` is under the hood, just with a cleaner API that hides the meaningless `()` value. Rust gives you two flavors because they inherit the trade-offs of their underlying map: `HashSet` (backed by hashing) gives O(1) average membership checks but no ordering guarantee; `BTreeSet` (backed by a sorted tree) gives O(log n) checks but keeps elements sorted, and lets you efficiently query ranges.

### (2) Reality Metaphor

Imagine a nightclub bouncer checking IDs against a guest list, deciding whether to let someone in for the first time.

- **`HashSet`**: The bouncer has a magic scanner that instantly hashes each ID card and checks a bucket — nearly instant, but the guest list on the clipboard is in a completely scrambled, unpredictable order.
- **`BTreeSet`**: The bouncer keeps a physical, alphabetically-sorted card catalog. Checking still takes a moment (flipping to the right letter), but at the end of the night, reading the whole guest list off top to bottom gives you it in perfect alphabetical order for free.
- **The core guarantee, either way**: No matter how many times the same person tries to walk in, the guest list only ever records them **once**.

### (3) Rust Code Examples

#### Short Snippet (Deduplication)
```rust
use std::collections::HashSet;

fn main() {
    let numbers = vec![1, 2, 2, 3, 3, 3, 4];
    let unique: HashSet<i32> = numbers.into_iter().collect();

    println!("{}", unique.len()); // 4 (duplicates silently discarded)
    println!("{}", unique.contains(&3)); // true — O(1) average lookup
}
```

#### Fuller Example (Set Algebra: Union, Intersection, and Sorted Iteration)
```rust
use std::collections::{BTreeSet, HashSet};

fn main() {
    let a: HashSet<i32> = [1, 2, 3, 4].into_iter().collect();
    let b: HashSet<i32> = [3, 4, 5, 6].into_iter().collect();

    let mut intersection: Vec<&i32> = a.intersection(&b).collect();
    intersection.sort(); // HashSet order is unpredictable; sort for stable output.
    println!("{:?}", intersection); // [3, 4]

    // BTreeSet: same dedup guarantee, but iteration is ALWAYS sorted — no manual sort needed.
    let sorted_set: BTreeSet<i32> = [5, 1, 4, 1, 3].into_iter().collect();
    let ordered: Vec<&i32> = sorted_set.iter().collect();
    println!("{:?}", ordered); // [1, 3, 4, 5] — guaranteed ascending order
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Hashset Btreeset Scoping and Lifecycle Rules

**The mistake:** Assuming Hashset Btreeset instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("hashset_btreeset_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("hashset_btreeset_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Hashset Btreeset State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Hashset Btreeset through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Hashset Btreeset Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Hashset Btreeset instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Multi-Tenant API Gateway Request Deduplicator & Client Tracking (`HashSet`)

**Scenario:** **Scenario**: You are developing a high-throughput microservice gateway processing incoming HTTP request payloads. Due to mobile network retries and webhook replay attacks, duplicate request payloads frequently hit the endpoint. You must implement a payload deduplication system and active client IP tracker using `HashSet<T>`.

**Requirements:**
**Requirements**:
1. Create an `ApiPayload` struct holding `request_id: String`, `client_ip: String`, and `endpoint: String`.
2. Implement custom `PartialEq`, `Eq`, and `Hash` for `ApiPayload` such that two payloads are considered equal and produce identical hash values based solely on their `request_id` (enabling O(1) hash table deduplication regardless of other field differences).
3. Create a `GatewayDeduplicator` structure containing `processed_requests: HashSet<ApiPayload>` and `active_clients: HashSet<String>`.
4. Implement `process_request(&mut self, payload: ApiPayload) -> Result<bool, &'static str>`, returning `Ok(true)` if the request is novel and inserted, `Ok(false)` if it is a duplicate, or an `Err` if `request_id` or `client_ip` is empty.
5. Provide helper methods `active_client_count(&self) -> usize`, `is_client_active(&self, ip: &str) -> bool`, and `flush_clients(&mut self)`.
6. Include comprehensive unit tests with explicit assertions (`assert_eq!`, `assert!`, `assert_ne!`, `matches!`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::HashSet;
> use std::hash::{Hash, Hasher};
>
> #[derive(Debug, Clone)]
> pub struct ApiPayload {
>     pub request_id: String,
>     pub client_ip: String,
>     pub endpoint: String,
> }
>
> impl PartialEq for ApiPayload {
>     fn eq(&self, other: &Self) -> bool {
>         self.request_id == other.request_id
>     }
> }
>
> impl Eq for ApiPayload {}
>
> impl Hash for ApiPayload {
>     fn hash<H: Hasher>(&self, state: &mut H) {
>         self.request_id.hash(state);
>     }
> }
>
> #[derive(Debug, Default)]
> pub struct GatewayDeduplicator {
>     processed_requests: HashSet<ApiPayload>,
>     active_clients: HashSet<String>,
> }
>
> impl GatewayDeduplicator {
>     pub fn new() -> Self {
>         Self {
>             processed_requests: HashSet::new(),
>             active_clients: HashSet::new(),
>         }
>     }
>
>     pub fn process_request(&mut self, payload: ApiPayload) -> Result<bool, &'static str> {
>         if payload.request_id.trim().is_empty() || payload.client_ip.trim().is_empty() {
>             return Err("Invalid payload: request_id and client_ip must not be empty");
>         }
>
>         self.active_clients.insert(payload.client_ip.clone());
>
>         if self.processed_requests.contains(&payload) {
>             Ok(false)
>         } else {
>             self.processed_requests.insert(payload);
>             Ok(true)
>         }
>     }
>
>     pub fn active_client_count(&self) -> usize {
>         self.active_clients.len()
>     }
>
>     pub fn is_client_active(&self, ip: &str) -> bool {
>         self.active_clients.contains(ip)
>     }
>
>     pub fn flush_clients(&mut self) {
>         self.active_clients.clear();
>     }
> }
>
> #[cfg(test)]
> mod tests {
>     use super::*;
>
>     #[test]
>     fn test_deduplication_and_client_tracking() {
>         let mut gateway = GatewayDeduplicator::new();
>
>         let req1 = ApiPayload {
>             request_id: "req-101".to_string(),
>             client_ip: "192.168.1.10".to_string(),
>             endpoint: "/api/v1/checkout".to_string(),
>         };
>         let req1_retry = req1.clone();
>
>         let res1 = gateway.process_request(req1);
>         assert!(res1.is_ok());
>         assert_eq!(res1.unwrap(), true);
>
>         // Replayed payload should be detected as duplicate
>         let res1_retry = gateway.process_request(req1_retry);
>         assert!(res1_retry.is_ok());
>         assert_eq!(res1_retry.unwrap(), false);
>
>         assert_eq!(gateway.active_client_count(), 1);
>         assert!(gateway.is_client_active("192.168.1.10"));
>         assert_ne!(gateway.active_client_count(), 0);
>
>         // Invalid request testing
>         let invalid_req = ApiPayload {
>             request_id: "".to_string(),
>             client_ip: "10.0.0.1".to_string(),
>             endpoint: "/health".to_string(),
>         };
>         let err_res = gateway.process_request(invalid_req);
>         assert!(err_res.is_err());
>         assert!(matches!(err_res, Err("Invalid payload: request_id and client_ip must not be empty")));
>
>         // Flush active clients
>         gateway.flush_clients();
>         assert_eq!(gateway.active_client_count(), 0);
>     }
> }
> ```
>
> #### Technical Explanation
>
>
> 1. **Custom `Hash` and `Eq` Contract**: `HashSet<T>` requires that if `a == b` (via `PartialEq`), then `hash(a) == hash(b)` (via `Hash`). By manually deriving `PartialEq`, `Eq`, and `Hash` based exclusively on `request_id`, two `ApiPayload` instances with identical IDs will hash to the exact same bucket and compare equal, regardless of payload mutation in other metadata fields.
> 2. **O(1) Membership Lookup**: `processed_requests.contains(&payload)` computes the hash of `payload.request_id` in expected O(1) time and checks the internal `HashMap<ApiPayload, ()>` bucket.
> 3. **Ownership and Borrows**: `process_request` takes full ownership of `payload: ApiPayload`. If the request is new, ownership is moved directly into `self.processed_requests.insert(payload)`. `active_clients` clones the `client_ip` `String` so that tracking client IP membership remains independent of payload drop lifecycles.
> 4. **Edge Cases & Invariants**: Blank string payloads are guarded upfront via `.trim().is_empty()` checks to prevent corrupted entries from poisoning the hash bucket.
> 
---

### Exercise 2: Kernel Memory Slab & Page Range Allocator (`BTreeSet`)

**Scenario:** **Scenario**: In an operating system kernel or microkernel memory manager, physical memory blocks are indexed by their starting physical address offsets. To enable range-based address allocation, deterministic sorted iteration, and fast upper/lower bound range queries, build a physical memory range slab allocator using `BTreeSet<T>`.

**Requirements:**
**Requirements**:
1. Define a `MemoryBlock` struct with `base_addr: u64` and `size_bytes: usize`. Implement `PartialEq`, `Eq`, `PartialOrd`, and `Ord` ordered strictly by `base_addr`.
2. Build a `SlabAllocator` struct containing `free_blocks: BTreeSet<MemoryBlock>`.
3. Implement `register_block(&mut self, base_addr: u64, size_bytes: usize) -> bool` to insert new blocks, returning `false` if `base_addr` is already registered.
4. Implement `find_first_fit(&self, required_size: usize) -> Option<MemoryBlock>` iterating through sorted order to return the lowest address block satisfying `size_bytes >= required_size`.
5. Implement `allocate_exact(&mut self, block: &MemoryBlock) -> bool` to remove an allocated block.
6. Implement `query_address_range(&self, start_addr: u64, end_addr: u64) -> Vec<MemoryBlock>` using `BTreeSet::range()` with inclusive bounds `(Bound::Included, Bound::Included)`.
7. Write unit tests incorporating explicit assertions (`assert_eq!`, `assert!`, `assert_ne!`, `matches!`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::BTreeSet;
> use std::ops::Bound;
>
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct MemoryBlock {
>     pub base_addr: u64,
>     pub size_bytes: usize,
> }
>
> impl PartialOrd for MemoryBlock {
>     fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
>         Some(self.cmp(other))
>     }
> }
>
> impl Ord for MemoryBlock {
>     fn cmp(&self, other: &Self) -> std::cmp::Ordering {
>         self.base_addr.cmp(&other.base_addr)
>     }
> }
>
> #[derive(Debug, Default)]
> pub struct SlabAllocator {
>     free_blocks: BTreeSet<MemoryBlock>,
> }
>
> impl SlabAllocator {
>     pub fn new() -> Self {
>         Self {
>             free_blocks: BTreeSet::new(),
>         }
>     }
>
>     pub fn register_block(&mut self, base_addr: u64, size_bytes: usize) -> bool {
>         self.free_blocks.insert(MemoryBlock {
>             base_addr,
>             size_bytes,
>         })
>     }
>
>     pub fn find_first_fit(&self, required_size: usize) -> Option<MemoryBlock> {
>         self.free_blocks
>             .iter()
>             .find(|block| block.size_bytes >= required_size)
>             .cloned()
>     }
>
>     pub fn allocate_exact(&mut self, block: &MemoryBlock) -> bool {
>         self.free_blocks.remove(block)
>     }
>
>     pub fn query_address_range(&self, start_addr: u64, end_addr: u64) -> Vec<MemoryBlock> {
>         let dummy_start = MemoryBlock {
>             base_addr: start_addr,
>             size_bytes: 0,
>         };
>         let dummy_end = MemoryBlock {
>             base_addr: end_addr,
>             size_bytes: usize::MAX,
>         };
>
>         self.free_blocks
>             .range((Bound::Included(&dummy_start), Bound::Included(&dummy_end)))
>             .cloned()
>             .collect()
>     }
>
>     pub fn get_sorted_blocks(&self) -> Vec<MemoryBlock> {
>         self.free_blocks.iter().cloned().collect()
>     }
> }
>
> #[cfg(test)]
> mod tests {
>     use super::*;
>
>     #[test]
>     fn test_btree_memory_allocator() {
>         let mut allocator = SlabAllocator::new();
>
>         assert!(allocator.register_block(0x2000, 1024));
>         assert!(allocator.register_block(0x1000, 512));
>         assert!(allocator.register_block(0x3000, 4096));
>
>         // Duplicate base address insertion should return false
>         assert_eq!(allocator.register_block(0x1000, 2048), false);
>
>         // Assert strict sorted order
>         let sorted = allocator.get_sorted_blocks();
>         assert_eq!(sorted[0].base_addr, 0x1000);
>         assert_eq!(sorted[1].base_addr, 0x2000);
>         assert_eq!(sorted[2].base_addr, 0x3000);
>
>         let fit = allocator.find_first_fit(1000);
>         assert!(matches!(fit, Some(MemoryBlock { base_addr: 0x2000, size_bytes: 1024 })));
>
>         let range_blocks = allocator.query_address_range(0x1500, 0x3500);
>         assert_eq!(range_blocks.len(), 2);
>         assert_eq!(range_blocks[0].base_addr, 0x2000);
>         assert_ne!(range_blocks[0].base_addr, 0x1000);
>
>         let block_to_alloc = MemoryBlock { base_addr: 0x2000, size_bytes: 1024 };
>         assert!(allocator.allocate_exact(&block_to_alloc));
>         assert_eq!(allocator.get_sorted_blocks().len(), 2);
>     }
> }
> ```
>
> #### Technical Explanation
>
>
> 1. **`Ord` Invariant on `BTreeSet`**: Unlike `HashSet` which requires `Hash + Eq`, `BTreeSet` relies on `Ord` to maintain a balanced B-Tree structure. By ordering `MemoryBlock` solely by `base_addr`, elements are kept continuously sorted in logarithmic runtime ($O(\log N)$ per operation).
> 2. **Efficient Range Scanning via `Bound`**: `BTreeSet::range` accepts `(Bound<&T>, Bound<&T>)`, allowing sub-slice range queries over tree nodes in $O(\log N + K)$ time where $K$ is the number of elements in the range. Dummy bounds `dummy_start` and `dummy_end` serve as search keys.
> 3. **Memory Safety & Borrowing**: `.range()` yields borrowed references `&MemoryBlock`. Calling `.cloned()` creates stack copies of matched blocks without invalidating or mutating the internal tree pointers.
> 
---

### Exercise 3: Role-Based Access Control (RBAC) & Compliance Scope Audit Engine (`HashSet` & `BTreeSet`)

**Scenario:** **Scenario**: An enterprise IAM (Identity and Access Management) engine evaluates user authorization by executing set algebra operations across Granted Scopes, Required Scopes, and Denied Blacklist Scopes. Security compliance mandates that compliance audit reports present all evaluated scopes in strict, deterministic alphabetical order.

**Requirements:**
**Requirements**:
1. Implement an `RbacEngine` struct that performs permission scope set algebra.
2. Implement `calculate_effective_permissions(granted: &HashSet<String>, required: &HashSet<String>, denied: &HashSet<String>) -> (HashSet<String>, bool)` computing allowed permissions as `(granted ∩ required) \ denied`. Return `(effective_set, is_fully_authorized)`, where `is_fully_authorized` is `true` iff all `required` scopes are present in `effective_set`.
3. Implement `generate_audit_log(granted: &HashSet<String>, denied: &HashSet<String>) -> BTreeSet<String>` combining all evaluated unique scopes into a sorted `BTreeSet<String>`.
4. Implement `find_missing_scopes(granted: &HashSet<String>, required: &HashSet<String>) -> HashSet<String>` returning `required \ granted`.
5. Write unit tests utilizing `assert_eq!`, `assert!`, `assert_ne!`, and `matches!`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::{BTreeSet, HashSet};
>
> #[derive(Debug, Default)]
> pub struct RbacEngine;
>
> impl RbacEngine {
>     pub fn calculate_effective_permissions(
>         granted: &HashSet<String>,
>         required: &HashSet<String>,
>         denied: &HashSet<String>,
>     ) -> (HashSet<String>, bool) {
>         // Effective permissions = (granted ∩ required) \ denied
>         let allowed: HashSet<String> = granted
>             .intersection(required)
>             .cloned()
>             .collect::<HashSet<String>>()
>             .difference(denied)
>             .cloned()
>             .collect();
>
>         let is_fully_authorized = required.is_subset(&allowed);
>         (allowed, is_fully_authorized)
>     }
>
>     pub fn generate_audit_log(
>         granted: &HashSet<String>,
>         denied: &HashSet<String>,
>     ) -> BTreeSet<String> {
>         let mut audit_log: BTreeSet<String> = BTreeSet::new();
>
>         for perm in granted.union(denied) {
>             audit_log.insert(perm.clone());
>         }
>
>         audit_log
>     }
>
>     pub fn find_missing_scopes(
>         granted: &HashSet<String>,
>         required: &HashSet<String>,
>     ) -> HashSet<String> {
>         required.difference(granted).cloned().collect()
>     }
> }
>
> #[cfg(test)]
> mod tests {
>     use super::*;
>
>     #[test]
>     fn test_rbac_scope_algebra() {
>         let granted: HashSet<String> = ["read:users", "write:users", "delete:users", "export:data"]
>             .iter()
>             .map(|s| s.to_string())
>             .collect();
>
>         let required: HashSet<String> = ["read:users", "write:users", "delete:users"]
>             .iter()
>             .map(|s| s.to_string())
>             .collect();
>
>         let denied: HashSet<String> = ["delete:users", "admin:all"]
>             .iter()
>             .map(|s| s.to_string())
>             .collect();
>
>         let (effective, is_auth) = RbacEngine::calculate_effective_permissions(&granted, &required, &denied);
>
>         assert!(effective.contains("read:users"));
>         assert!(effective.contains("write:users"));
>         assert!(!effective.contains("delete:users"));
>         assert_eq!(is_auth, false);
>
>         let missing = RbacEngine::find_missing_scopes(&granted, &required);
>         assert!(missing.is_empty());
>
>         let audit = RbacEngine::generate_audit_log(&granted, &denied);
>         let audit_vec: Vec<String> = audit.into_iter().collect();
>
>         assert_eq!(
>             audit_vec,
>             vec![
>                 "admin:all",
>                 "delete:users",
>                 "export:data",
>                 "read:users",
>                 "write:users"
>             ]
>         );
>
>         assert_ne!(audit_vec[0], "read:users");
>         assert!(matches!(is_auth, false));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
> 1. **Set Algebra Operations**: `.intersection()` returns an iterator yielding items present in both sets ($A \cap B$). `.difference()` yields elements in the first set but absent from the second ($A \setminus B$). `.union()` yields all unique elements present across either set ($A \cup B$).
> 2. **Complementary Data Structure Choice**: `HashSet` is chosen for fast permission math due to $O(1)$ lookup and set operations. `BTreeSet` is chosen for audit log generation because security auditing requires strict, deterministic lexicographical order. Inserting $N$ items into `BTreeSet` automatically yields a sorted list upon iteration.
> 3. **Subset Verification**: `required.is_subset(&allowed)` evaluates if every required permission scope is satisfied in $O(M)$ time where $M$ is the size of the required set.
> 
---

## 6. Related Terms


- [`HashMap<K, V>`](hashmap_k_v.md) — `HashSet<T>` is literally `HashMap<T, ()>` internally.
- [`BTreeMap<K, V>`](btreemap_k_v.md) — `BTreeSet<T>`'s map counterpart, same sorted-tree structure.
- [`Hash` Trait](hash_trait.md) — Required on `T` for `HashSet<T>`.
- [`PartialOrd` / `Ord`](../level_04/partialord_ord.md) — Required on `T` for `BTreeSet<T>`.
- [`FromIterator` / `Extend` Traits](fromiterator_extend_traits.md) — What powers `.collect::<HashSet<_>>()` and `.extend()`.

---

## 7. Key Takeaways

- Both types guarantee **no duplicate elements**; the difference is purely about backing structure and ordering.
- `HashSet<T>` requires `Hash + Eq` on `T`; offers O(1) average membership checks; **no** iteration-order guarantee.
- `BTreeSet<T>` requires `Ord` on `T`; offers O(log n) membership checks; **always** iterates in sorted order.
- `HashSet` is internally `HashMap<T, ()>` — the unit-type value is a ZST, so there's no real memory overhead versus a "pure" set structure.
- Both support set algebra (`.union()`, `.intersection()`, `.difference()`) out of the box.
