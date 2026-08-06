# `#[test]`

> **Level 8 — Testing & Documentation**
> Attribute marking a function as a unit test, run via `cargo test`.

---

## 1. Prerequisites


- [Derive Macro](../level_04/derive_macro.md) — The feature that introduces the `#[...]` attribute syntax.
- [`cfg` Attribute](../level_07/cfg_attribute.md) — The tool used to hide tests from production builds.

---

## 2. Term Category

**Rust Tooling (the built-in test runner)**: In languages like JavaScript or Python, if you want to write a unit test, you usually have to download an external testing framework (like Jest, Mocha, or PyTest), configure it, and set up test runners. 

Rust has a world-class test runner built directly into the compiler and standard library! The **`#[test]`** attribute is how you tell the compiler that a specific function is a Unit Test.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The Rust designers wanted testing to be absolutely zero-friction. If testing requires downloading libraries and writing configuration files, developers will procrastinate and avoid writing tests. 

By building testing directly into the language, you never have to configure anything. You just write `#[test]` above a function, run `cargo test` in your terminal, and Cargo automatically finds all the marked functions, runs them in parallel, and gives you a beautiful green/red report.

### (2) Reality Metaphor

Imagine you are a factory worker building a car engine. 

As you build it, you occasionally want to run a diagnostic check. However, you wouldn't ship the diagnostic machine *inside* the car to the customer! 

You attach a special `[Diagnostic Mode]` sticker (`#[test]`) to a specific diagnostic button. When the factory manager runs a test (`cargo test`), they press that button. But when the car is finally shipped to the customer (`cargo build`), the factory automatically removes that button entirely. It never goes into production.

### (3) Rust Code Examples

#### Short Snippet (The Basic Test)
Any normal function can become a test by adding the attribute! (Note: Test functions cannot take arguments).

```rust
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

// 1. We mark the function as a test!
#[test]
fn test_addition() {
    let result = add(2, 2);
    
    // 2. We use a macro to verify the answer is correct
    assert_eq!(result, 4); 
}
```

#### Fuller Example (The Idiomatic Test Module)
While you *can* put `#[test]` functions anywhere, Rust developers almost universally follow a specific pattern. They create an internal module named `tests` at the very bottom of the file they are testing.

```rust
// File: src/math.rs
pub fn multiply(a: i32, b: i32) -> i32 {
    a * b
}

// ==========================================
// Idiomatic Testing Block
// ==========================================

// 1. We hide the ENTIRE module from production builds!
#[cfg(test)]
mod tests {
    // 2. We import everything from the parent file (math.rs) into this module
    use super::*;

    // 3. We write our test
    #[test]
    fn it_multiplies_correctly() {
        assert_eq!(multiply(5, 5), 25);
    }

    // 4. We can even write helper functions that aren't tests!
    // Because `mod tests` is hidden, this helper won't bloat production code.
    fn setup_database_for_test() { ... }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Test Attribute Scoping and Lifecycle Rules

**The mistake:** Assuming Test Attribute instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("test_attribute_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("test_attribute_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Test Attribute State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Test Attribute through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Test Attribute Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Test Attribute instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Multi-Currency Banking Ledger & Fallible Test Suite (`Result<(), E>`)

**Scenario:** **Problem Statement:**
In high-frequency financial platforms, ledger accounting systems must guarantee atomic transfers, strict currency validation, and descriptive error reporting. Unit testing such fallible operations often requires checking happy paths with clean `?` propagation as well as explicitly matching error variants.

**Requirements:**
Implement a multi-currency ledger system `BankLedger` with custom error handling (`LedgerError`), and write a robust unit test suite using `#[test]` functions that return `Result<(), LedgerError>` alongside assertions (`assert_eq!`, `assert!`, `matches!`).

Requirements:
1. Define `Currency` (enum with `USD`, `EUR`, `GBP`) implementing `PartialEq`, `Eq`, `Hash`, `Clone`, `Copy`, `Debug`.
2. Define custom `LedgerError` enum with variants:
   - `InsufficientBalance { requested: u64, available: u64 }`
   - `CurrencyMismatch { expected: Currency, found: Currency }`
   - `InvalidAmount(String)`
   - `AccountNotFound(String)`
3. Implement `BankLedger`:
   - `create_account(&mut self, account_id: &str, initial_balance: u64, currency: Currency)`
   - `get_balance(&self, account_id: &str) -> Result<u64, LedgerError>`
   - `transfer(&mut self, from: &str, to: &str, amount: u64, currency: Currency) -> Result<(), LedgerError>`: validates positive amounts, account presence, matching currencies, and sufficient balance before applying state changes.
4. In `#[cfg(test)] mod tests`, implement unit tests using `#[test]` attributes:
   - `test_successful_transfer`: returns `Result<(), LedgerError>` and uses `?` operator for readable assertion pipelines.
   - `test_insufficient_funds_returns_error`: uses `matches!` macro to verify exact error metadata.
   - `test_currency_mismatch_returns_error`: uses `assert_eq!` to check mismatch variant equality.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::HashMap;
> 
> #[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
> pub enum Currency {
>     USD,
>     EUR,
>     GBP,
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub enum LedgerError {
>     InsufficientBalance { requested: u64, available: u64 },
>     CurrencyMismatch { expected: Currency, found: Currency },
>     InvalidAmount(String),
>     AccountNotFound(String),
> }
> 
> #[derive(Debug, Clone)]
> pub struct Account {
>     pub id: String,
>     pub balance: u64,
>     pub currency: Currency,
> }
> 
> #[derive(Debug, Default)]
> pub struct BankLedger {
>     accounts: HashMap<String, Account>,
> }
> 
> impl BankLedger {
>     pub fn new() -> Self {
>         Self {
>             accounts: HashMap::new(),
>         }
>     }
> 
>     pub fn create_account(&mut self, account_id: &str, initial_balance: u64, currency: Currency) {
>         self.accounts.insert(
>             account_id.to_string(),
>             Account {
>                 id: account_id.to_string(),
>                 balance: initial_balance,
>                 currency,
>             },
>         );
>     }
> 
>     pub fn get_balance(&self, account_id: &str) -> Result<u64, LedgerError> {
>         let acc = self
>             .accounts
>             .get(account_id)
>             .ok_or_else(|| LedgerError::AccountNotFound(account_id.to_string()))?;
>         Ok(acc.balance)
>     }
> 
>     pub fn transfer(
>         &mut self,
>         from: &str,
>         to: &str,
>         amount: u64,
>         currency: Currency,
>     ) -> Result<(), LedgerError> {
>         if amount == 0 {
>             return Err(LedgerError::InvalidAmount(
>                 "Transfer amount must be positive".to_string(),
>             ));
>         }
> 
>         let from_acc = self
>             .accounts
>             .get(from)
>             .ok_or_else(|| LedgerError::AccountNotFound(from.to_string()))?;
>         if from_acc.currency != currency {
>             return Err(LedgerError::CurrencyMismatch {
>                 expected: from_acc.currency,
>                 found: currency,
>             });
>         }
>         if from_acc.balance < amount {
>             return Err(LedgerError::InsufficientBalance {
>                 requested: amount,
>                 available: from_acc.balance,
>             });
>         }
> 
>         let to_acc = self
>             .accounts
>             .get(to)
>             .ok_or_else(|| LedgerError::AccountNotFound(to.to_string()))?;
>         if to_acc.currency != currency {
>             return Err(LedgerError::CurrencyMismatch {
>                 expected: to_acc.currency,
>                 found: currency,
>             });
>         }
> 
>         // Perform atomic balance modifications
>         let from_mut = self.accounts.get_mut(from).unwrap();
>         from_mut.balance -= amount;
> 
>         let to_mut = self.accounts.get_mut(to).unwrap();
>         to_mut.balance += amount;
> 
>         Ok(())
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_successful_transfer() -> Result<(), LedgerError> {
>         let mut ledger = BankLedger::new();
>         ledger.create_account("alice", 1000, Currency::USD);
>         ledger.create_account("bob", 500, Currency::USD);
> 
>         ledger.transfer("alice", "bob", 300, Currency::USD)?;
> 
>         assert_eq!(ledger.get_balance("alice")?, 700);
>         assert_eq!(ledger.get_balance("bob")?, 800);
>         Ok(())
>     }
> 
>     #[test]
>     fn test_insufficient_funds_returns_error() {
>         let mut ledger = BankLedger::new();
>         ledger.create_account("alice", 100, Currency::EUR);
>         ledger.create_account("bob", 500, Currency::EUR);
> 
>         let result = ledger.transfer("alice", "bob", 200, Currency::EUR);
>         assert!(matches!(
>             result,
>             Err(LedgerError::InsufficientBalance {
>                 requested: 200,
>                 available: 100
>             })
>         ));
>     }
> 
>     #[test]
>     fn test_currency_mismatch_returns_error() {
>         let mut ledger = BankLedger::new();
>         ledger.create_account("alice", 1000, Currency::USD);
>         ledger.create_account("bob", 500, Currency::EUR);
> 
>         let result = ledger.transfer("alice", "bob", 100, Currency::USD);
>         assert_eq!(
>             result,
>             Err(LedgerError::CurrencyMismatch {
>                 expected: Currency::EUR,
>                 found: Currency::USD,
>             })
>         );
>     }
> }
> 
> fn main() {
>     let mut ledger = BankLedger::new();
>     ledger.create_account("alice", 500, Currency::USD);
>     ledger.create_account("bob", 200, Currency::USD);
>     assert!(ledger.transfer("alice", "bob", 100, Currency::USD).is_ok());
>     println!("Ledger transfer verified successfully!");
> }
> ```
> 
> **Technical Explanation:**
> 1. **Result-Returning Unit Tests (`#[test] fn ... -> Result<(), E>`)**: Returning a `Result` type from a `#[test]` annotated function allows using the standard `?` operator inside tests. If any step returns `Err`, the test runner catches it as a test failure and prints the inner error debug output.
> 2. **`matches!` Macro**: Provides clean pattern matching assertions against complex enum variants (such as struct-like enum variants with fields) without verbose `if let` blocks.
> 3. **Isolation with `#[cfg(test)]`**: Hides all test cases and `main()` integration helpers from production builds, keeping production binaries lean.

---

### Exercise 2: Bounded LRU Cache Storage Engine & Invariant Testing

**Scenario:** **Problem Statement:**
In-memory caching services (like Redis or Memcached microservices) enforce strict capacity limits and Least-Recently-Used (LRU) eviction algorithms. Unit tests must rigorously verify state invariants, such as eviction on capacity overflow and updating access recency upon read operations.

**Requirements:**
Implement a generic bounded cache `BoundedCache<K, V>` and write comprehensive unit tests with `#[test]`, `assert_eq!`, `assert_ne!`, and `assert!`.

Requirements:
1. Struct `BoundedCache<K, V>` with private fields `capacity: usize`, `items: HashMap<K, V>`, and `access_order: Vec<K>`.
2. Methods:
   - `new(capacity: usize) -> Self` (panics if capacity is zero).
   - `get(&mut self, key: &K) -> Option<&V>`: updates the key's position to the most recently used (end of `access_order`) upon hit.
   - `put(&mut self, key: K, value: V)`: inserts key/value. If updating an existing key, updates value and recency without expanding size. If inserting a new key at full capacity, evicts the oldest key (front of `access_order`).
   - `len(&self) -> usize`, `capacity(&self) -> usize`, `is_empty(&self) -> bool`.
3. In `#[cfg(test)] mod tests`, write unit tests:
   - `test_cache_put_and_get`: tests key retrieval and missing key returns `None`.
   - `test_lru_eviction_policy`: verifies that accessing a key promotes its recency, causing the unaccessed key to be evicted first on overflow (`assert_ne!`, `assert_eq!`).
   - `test_update_existing_key_does_not_evict`: verifies updating keys doesn't overflow or evict unrelated items.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::HashMap;
> use std::hash::Hash;
> 
> #[derive(Debug)]
> pub struct BoundedCache<K, V> {
>     capacity: usize,
>     items: HashMap<K, V>,
>     access_order: Vec<K>,
> }
> 
> impl<K: PartialEq + Eq + Hash + Clone, V> BoundedCache<K, V> {
>     pub fn new(capacity: usize) -> Self {
>         assert!(capacity > 0, "Capacity must be greater than zero");
>         Self {
>             capacity,
>             items: HashMap::new(),
>             access_order: Vec::new(),
>         }
>     }
> 
>     pub fn get(&mut self, key: &K) -> Option<&V> {
>         if self.items.contains_key(key) {
>             self.touch(key);
>             self.items.get(key)
>         } else {
>             None
>         }
>     }
> 
>     pub fn put(&mut self, key: K, value: V) {
>         if self.items.contains_key(&key) {
>             self.items.insert(key.clone(), value);
>             self.touch(&key);
>             return;
>         }
> 
>         if self.items.len() >= self.capacity {
>             if let Some(oldest) = self.access_order.first().cloned() {
>                 self.items.remove(&oldest);
>                 self.access_order.remove(0);
>             }
>         }
> 
>         self.items.insert(key.clone(), value);
>         self.access_order.push(key);
>     }
> 
>     pub fn len(&self) -> usize {
>         self.items.len()
>     }
> 
>     pub fn capacity(&self) -> usize {
>         self.capacity
>     }
> 
>     pub fn is_empty(&self) -> bool {
>         self.items.is_empty()
>     }
> 
>     fn touch(&mut self, key: &K) {
>         if let Some(pos) = self.access_order.iter().position(|k| k == key) {
>             let k = self.access_order.remove(pos);
>             self.access_order.push(k);
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_cache_put_and_get() {
>         let mut cache = BoundedCache::new(2);
>         cache.put("a", 100);
>         cache.put("b", 200);
> 
>         assert_eq!(cache.get(&"a"), Some(&100));
>         assert_eq!(cache.get(&"b"), Some(&200));
>         assert_eq!(cache.get(&"c"), None);
>     }
> 
>     #[test]
>     fn test_lru_eviction_policy() {
>         let mut cache = BoundedCache::new(2);
>         cache.put("key1", 1);
>         cache.put("key2", 2);
> 
>         // Access key1 to promote its recency over key2
>         assert_eq!(cache.get(&"key1"), Some(&1));
> 
>         // Inserting key3 should trigger LRU eviction of key2
>         cache.put("key3", 3);
> 
>         assert_eq!(cache.len(), 2);
>         assert_eq!(cache.get(&"key2"), None);
>         assert_ne!(cache.get(&"key1"), None);
>         assert_eq!(cache.get(&"key1"), Some(&1));
>         assert_eq!(cache.get(&"key3"), Some(&3));
>     }
> 
>     #[test]
>     fn test_update_existing_key_does_not_evict() {
>         let mut cache = BoundedCache::new(2);
>         cache.put("alpha", 10);
>         cache.put("beta", 20);
> 
>         // Overwrite existing key "alpha"
>         cache.put("alpha", 15);
> 
>         assert_eq!(cache.len(), 2);
>         assert_eq!(cache.get(&"alpha"), Some(&15));
>         assert_eq!(cache.get(&"beta"), Some(&20));
>     }
> }
> 
> fn main() {
>     let mut cache = BoundedCache::new(2);
>     cache.put("x", 1);
>     cache.put("y", 2);
>     assert_eq!(cache.len(), 2);
>     println!("BoundedCache test verified successfully!");
> }
> ```
> 
> **Technical Explanation:**
> 1. **Testing Mutability & State Transmutation**: `get(&mut self, ...)` modifies internal recency metadata. Unit tests demonstrate how mutable borrows interact with assertion checks.
> 2. **Negative Assertions (`assert_ne!`)**: Used alongside positive equality checks (`assert_eq!`) to explicitly verify that evicted items are no longer reachable while non-evicted items retain correct values.
> 3. **Determinism**: Unit tests verify exact algorithmic invariant properties (LRU order) deterministically without external timing or randomized dependencies.

---

### Exercise 3: Webhook Dispatcher with Mock Transport Trait & Retry Verification

**Scenario:** **Problem Statement:**
In distributed microservices, outbound webhook delivery services implement retry loops with status code inspection. Unit testing network code directly against real HTTP endpoints makes tests slow and non-deterministic. The standard Rust testing pattern abstracts network I/O behind a trait and creates a mock implementation within unit test modules.

**Requirements:**
Design a trait-based `WebhookDispatcher` and implement a deterministic mock transport to test retry mechanisms and failure scenarios.

Requirements:
1. Define trait `HttpTransport`:
   - `send_payload(&self, url: &str, payload: &str) -> Result<u16, String>;`
2. Struct `WebhookDispatcher<T: HttpTransport>`:
   - `new(transport: T, max_retries: u32) -> Self`
   - `dispatch(&self, url: &str, payload: &str) -> Result<(), String>`: retries up to `max_retries` times if the returned HTTP status code is outside `200..=299` or returns transport error.
3. Struct `MockHttpTransport` (implementing `HttpTransport` with interior mutability via `RefCell`):
   - Stores queued response results `RefCell<Vec<Result<u16, String>>>`.
   - Records total network invocation calls `RefCell<usize>`.
4. Unit tests inside `#[cfg(test)] mod tests`:
   - `test_dispatch_success_first_try`: asserts 200 OK succeeds on call 1.
   - `test_dispatch_retry_then_succeed`: queued responses `[503, 500, 200]` succeed after 3 attempts.
   - `test_dispatch_exhausts_retries_and_fails`: queued errors exceed max retries and fail with formatted error string.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::cell::RefCell;
> 
> pub trait HttpTransport {
>     fn send_payload(&self, url: &str, payload: &str) -> Result<u16, String>;
> }
> 
> pub struct WebhookDispatcher<T: HttpTransport> {
>     transport: T,
>     max_retries: u32,
> }
> 
> impl<T: HttpTransport> WebhookDispatcher<T> {
>     pub fn new(transport: T, max_retries: u32) -> Self {
>         Self {
>             transport,
>             max_retries,
>         }
>     }
> 
>     pub fn dispatch(&self, url: &str, payload: &str) -> Result<(), String> {
>         let mut attempts = 0;
>         loop {
>             attempts += 1;
>             match self.transport.send_payload(url, payload) {
>                 Ok(status) if (200..=299).contains(&status) => return Ok(()),
>                 Ok(status) => {
>                     if attempts > self.max_retries {
>                         return Err(format!(
>                             "Dispatch failed with HTTP status {} after {} attempts",
>                             status, attempts
>                         ));
>                     }
>                 }
>                 Err(err) => {
>                     if attempts > self.max_retries {
>                         return Err(format!(
>                             "Dispatch transport error '{}' after {} attempts",
>                             err, attempts
>                         ));
>                     }
>                 }
>             }
>         }
>     }
> }
> 
> // ==========================================
> // Mock Implementation for Deterministic Tests
> // ==========================================
> pub struct MockHttpTransport {
>     pub status_responses: RefCell<Vec<Result<u16, String>>>,
>     pub call_count: RefCell<usize>,
> }
> 
> impl MockHttpTransport {
>     pub fn new(responses: Vec<Result<u16, String>>) -> Self {
>         Self {
>             status_responses: RefCell::new(responses),
>             call_count: RefCell::new(0),
>         }
>     }
> }
> 
> impl HttpTransport for MockHttpTransport {
>     fn send_payload(&self, _url: &str, _payload: &str) -> Result<u16, String> {
>         *self.call_count.borrow_mut() += 1;
>         let mut responses = self.status_responses.borrow_mut();
>         if responses.is_empty() {
>             Err("No mock responses remaining".to_string())
>         } else {
>             responses.remove(0)
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_dispatch_success_first_try() {
>         let mock = MockHttpTransport::new(vec![Ok(200)]);
>         let dispatcher = WebhookDispatcher::new(mock, 3);
> 
>         let result = dispatcher.dispatch("https://api.example.com/hook", r#"{"event":"user_signup"}"#);
>         assert!(result.is_ok());
>     }
> 
>     #[test]
>     fn test_dispatch_retry_then_succeed() {
>         let mock = MockHttpTransport::new(vec![Ok(503), Ok(500), Ok(200)]);
>         let dispatcher = WebhookDispatcher::new(mock, 3);
> 
>         let result = dispatcher.dispatch("https://api.example.com/hook", r#"{"event":"payment"}"#);
>         assert!(result.is_ok());
>     }
> 
>     #[test]
>     fn test_dispatch_exhausts_retries_and_fails() {
>         let mock = MockHttpTransport::new(vec![Ok(500), Ok(500), Ok(500)]);
>         let dispatcher = WebhookDispatcher::new(mock, 2);
> 
>         let result = dispatcher.dispatch("https://api.example.com/hook", r#"{"event":"fail"}"#);
>         assert!(result.is_err());
>         if let Err(msg) = result {
>             assert!(msg.contains("HTTP status 500"));
>             assert!(msg.contains("after 3 attempts"));
>         }
>     }
> }
> 
> fn main() {
>     let mock = MockHttpTransport::new(vec![Ok(200)]);
>     let dispatcher = WebhookDispatcher::new(mock, 3);
>     assert!(dispatcher.dispatch("https://example.com", "test").is_ok());
>     println!("Webhook dispatcher verified successfully!");
> }
> ```
> 
> **Technical Explanation:**
> 1. **Dependency Injection via Traits**: By defining `HttpTransport` as a trait generic `T: HttpTransport`, product code remains agnostic to real HTTP networking versus mock testing drivers.
> 2. **Mocking with Interior Mutability (`RefCell`)**: Standard unit tests require shared `&self` references across trait invocations. `RefCell` provides safe interior mutability to mutate mock call counts and response queues inside immutable trait methods without unsafe code.
> 3. **Testing Retry Edge Cases**: Unit tests systematically inject status sequences (`[503, 500, 200]`) to prove retry loops complete successfully before retry thresholds expire.

---

## 6. Related Terms


- [`assert!` Macros](assert_macros.md) — The macros you use *inside* the `#[test]` function to actually verify that the code behaves correctly.
- [`cfg` Attribute](../level_07/cfg_attribute.md) — Used in conjunction with tests to hide the test module from the compiler.

---

## 7. Key Takeaways

- **`#[test]`** marks a standard function as a Unit Test.
- It is executed by running **`cargo test`** in your terminal.
- Test functions cannot take arguments.
- The idiomatic Rust pattern is to place tests in a `mod tests` block at the bottom of the file, guarded by `#[cfg(test)]`.
- Always use `use super::*;` inside your test module so you can access the functions you are trying to test.
