# Trait

> **Level 4 — Error Handling & Generics**
> A collection of methods that types can implement; Rust's core abstraction mechanism (like interfaces).

---

## 1. Prerequisites

- [Structs](../level_02/struct.md) — The data types that will implement the traits.
- [`impl` Block](../level_02/impl_block.md) — The syntax used to attach methods to a type.

---

## 2. Term Category

**Rust-specific (the interface definition)**: In object-oriented languages like Java or C#, you use "Interfaces" or "Abstract Base Classes" to define shared behavior. Rust does not have classes or inheritance. Instead, it relies entirely on **Traits** to define what a type *can do*.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Imagine you have a `Car` struct and an `Airplane` struct. Both of them have the ability to `move_forward()`. 

You want to write a generic function that accepts *anything* that can move forward. In traditional Object-Oriented Programming (OOP), you would make them both inherit from a `Vehicle` base class. Rust completely rejects class inheritance because it often leads to bloated, fragile, and tightly-coupled hierarchies (the "Gorilla Banana" problem).

Instead, Rust uses **Traits**. A Trait is simply a contract. It says: *"I don't care what your data looks like, or where you came from. If you want to claim you have this Trait, you **must** provide the code for these specific methods."* 

By using Traits, unrelated types can share a common interface without needing a shared parent class.

### (2) Reality Metaphor

Imagine you are hiring someone to translate a document into French. 

You don't care if the applicant is a human, a robot, or an alien (the **Struct**). You don't care who their parents are or what family tree they belong to (**Inheritance**). You only care about one single thing: Do they possess the ability to speak French? 

A Trait is exactly that: a certificate of ability (`trait SpeaksFrench`). If an object implements that trait, it holds the certificate, and you can mathematically trust it to translate your document.

### (3) Rust Code Examples

#### Short Snippet (Defining and Implementing)
Here is how you define a contract (the Trait), and how you sign the contract (the `impl`).

```rust
// 1. Define the Trait (The Contract)
trait Summary {
    // We only provide the signature, not the body!
    fn summarize(&self) -> String; 
}

struct NewsArticle {
    headline: String,
    author: String,
}

// 2. Implement the Trait for our specific type
impl Summary for NewsArticle {
    // We MUST provide the exact method defined in the trait
    fn summarize(&self) -> String {
        format!("{} by {}", self.headline, self.author)
    }
}

fn main() {
    let article = NewsArticle {
        headline: String::from("Rust wins again"),
        author: String::from("Alice"),
    };
    
    // We can now call the trait method!
    println!("{}", article.summarize());
}
```

#### Fuller Example (Default Implementations)
Sometimes, a trait has a method where the behavior is usually exactly the same for 90% of types. You can provide a **default implementation** inside the trait itself, so the struct doesn't have to write it!

```rust
trait Greeter {
    // The trait provides the actual code!
    fn say_hello(&self) {
        println!("Hello there!");
    }
}

struct FriendlyRobot;
struct GrumpyCat;

// The robot gets the default behavior for free. We just write an empty block.
impl Greeter for FriendlyRobot {}

// The cat wants to OVERRIDE the default behavior with its own.
impl Greeter for GrumpyCat {
    fn say_hello(&self) {
        println!("Go away.");
    }
}

fn main() {
    let r2d2 = FriendlyRobot;
    let garfield = GrumpyCat;
    
    r2d2.say_hello();   // Prints: Hello there!
    garfield.say_hello(); // Prints: Go away.
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Trait Scoping and Lifecycle Rules

**The mistake:** Assuming Trait instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("trait_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("trait_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Trait State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Trait through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Trait Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Trait instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Resilient Telemetry Pipeline & Metric Extractor Trait

**Problem Scenario:**
In an enterprise Rust microservice architecture, telemetry data (HTTP latency, database connection pool utilization, memory metrics) must be continuously extracted and emitted to monitoring backends like Prometheus or Datadog. 

Your task is to design a unified `MetricExtractor` trait that allows different telemetry types to report their metrics cleanly while providing default formatting behavior:

1. Define a trait `MetricExtractor` with the following contract:
   - `fn metric_name(&self) -> &'static str;` (Required)
   - `fn extract_value(&self) -> f64;` (Required)
   - `fn tags(&self) -> Vec<(&'static str, String)>` (Default method: returns an empty `Vec`)
   - `fn format_telemetry(&self) -> String` (Default method: formats output as `"[METRIC] {metric_name} = {extract_value:.2} | tags: {tags}"`, formatting tags as `k1=v1,k2=v2` or `"none"` if empty).
2. Implement `MetricExtractor` for `HttpRequestMetrics` (holding `endpoint: String`, `duration_ms: f64`, `status_code: u16`):
   - Overrides `tags()` to return endpoint and status code tags.
3. Implement `MetricExtractor` for `DbPoolMetrics` (holding `pool_name: &'static str`, `active_connections: u32`, `max_connections: u32`):
   - Calculates utilization ratio (`active / max`) as `extract_value()`. Handles division by zero by returning `0.0`.
   - Uses the default `tags()` implementation.
4. Write a generic collector function `pub fn collect_and_format<T: MetricExtractor>(metric: &T) -> String`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub trait MetricExtractor {
>     fn metric_name(&self) -> &'static str;
>     fn extract_value(&self) -> f64;
> 
>     fn tags(&self) -> Vec<(&'static str, String)> {
>         Vec::new()
>     }
> 
>     fn format_telemetry(&self) -> String {
>         let tag_strs: Vec<String> = self
>             .tags()
>             .into_iter()
>             .map(|(k, v)| format!("{}={}", k, v))
>             .collect();
>         let tags_formatted = if tag_strs.is_empty() {
>             "none".to_string()
>         } else {
>             tag_strs.join(",")
>         };
>         format!(
>             "[METRIC] {} = {:.2} | tags: {}",
>             self.metric_name(),
>             self.extract_value(),
>             tags_formatted
>         )
>     }
> }
> 
> pub struct HttpRequestMetrics {
>     pub endpoint: String,
>     pub duration_ms: f64,
>     pub status_code: u16,
> }
> 
> impl MetricExtractor for HttpRequestMetrics {
>     fn metric_name(&self) -> &'static str {
>         "http.request.duration_ms"
>     }
> 
>     fn extract_value(&self) -> f64 {
>         self.duration_ms
>     }
> 
>     fn tags(&self) -> Vec<(&'static str, String)> {
>         vec![
>             ("endpoint", self.endpoint.clone()),
>             ("status", self.status_code.to_string()),
>         ]
>     }
> }
> 
> pub struct DbPoolMetrics {
>     pub pool_name: &'static str,
>     pub active_connections: u32,
>     pub max_connections: u32,
> }
> 
> impl MetricExtractor for DbPoolMetrics {
>     fn metric_name(&self) -> &'static str {
>         "db.pool.utilization_ratio"
>     }
> 
>     fn extract_value(&self) -> f64 {
>         if self.max_connections == 0 {
>             0.0
>         } else {
>             self.active_connections as f64 / self.max_connections as f64
>         }
>     }
> }
> 
> pub fn collect_and_format<T: MetricExtractor>(metric: &T) -> String {
>     metric.format_telemetry()
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_http_metrics_formatting() {
>         let http = HttpRequestMetrics {
>             endpoint: String::from("/api/v1/checkout"),
>             duration_ms: 142.856,
>             status_code: 200,
>         };
> 
>         assert_eq!(http.metric_name(), "http.request.duration_ms");
>         assert!((http.extract_value() - 142.856).abs() < f64::EPSILON);
>         assert_eq!(http.tags().len(), 2);
> 
>         let formatted = collect_and_format(&http);
>         assert!(formatted.contains("[METRIC] http.request.duration_ms = 142.86"));
>         assert!(formatted.contains("endpoint=/api/v1/checkout"));
>         assert!(formatted.contains("status=200"));
>     }
> 
>     #[test]
>     fn test_db_metrics_default_tags() {
>         let db = DbPoolMetrics {
>             pool_name: "postgres_primary",
>             active_connections: 18,
>             max_connections: 24,
>         };
> 
>         assert_eq!(db.metric_name(), "db.pool.utilization_ratio");
>         assert!((db.extract_value() - 0.75).abs() < f64::EPSILON);
>         assert!(db.tags().is_empty());
> 
>         let formatted = collect_and_format(&db);
>         assert_eq!(
>             formatted,
>             "[METRIC] db.pool.utilization_ratio = 0.75 | tags: none"
>         );
>         assert_ne!(db.extract_value(), 1.0);
>     }
> 
>     #[test]
>     fn test_zero_max_connections_edge_case() {
>         let db_zero = DbPoolMetrics {
>             pool_name: "uninit_pool",
>             active_connections: 0,
>             max_connections: 0,
>         };
>         assert_eq!(db_zero.extract_value(), 0.0);
>         let formatted = collect_and_format(&db_zero);
>         assert!(matches!(formatted.as_str(), s if s.contains("0.00")));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
>
>
> 1. **Trait Contract & Method Requirements**: The `MetricExtractor` trait enforces abstract signatures (`metric_name` and `extract_value`) while furnishing concrete default logic for `tags` and `format_telemetry`. Standard default implementations allow types like `DbPoolMetrics` to inherit boilerplate formatting without rewriting standard string construction logic.
> 2. **Monomorphization of Generic Functions**: `collect_and_format<T: MetricExtractor>` uses static dispatch (monomorphization). During compilation, Rust generates specialized code paths for `collect_and_format::<HttpRequestMetrics>` and `collect_and_format::<DbPoolMetrics>`, entirely eliminating runtime vtable lookup overhead.
> 3. **Ownership and Lifetime Guarantees**: `metric_name()` returns `&'static str` because metric keys are fixed compile-time constants stored in the program's read-only binary section (`.rodata`). `tags()` constructs owned `String` representations to accommodate dynamically formatted numbers and routes without risking dangling reference errors.
> 4. **Edge Case Safety**: `DbPoolMetrics::extract_value` explicitly checks for zero `max_connections` before dividing, guarding against `NaN` floating-point anomalies or unexpected telemetry formatting panics.

---

### Exercise 2: Extensible Storage Engine Trait with Batching & Default Fallback Logic

**Problem Scenario:**
A high-performance caching layer needs a pluggable `StorageEngine` trait to support multiple underlying storage backends (e.g., In-Memory HashMap, Disk KV engine, Redis Proxy). 

You need to build a trait interface with default fallback lookup, membership checks, and transaction batching mechanics:

1. Define a `StorageError` enum with variants: `KeyNotFound(String)`, `PermissionDenied`, `StorageFull`, `IoError(String)`.
2. Define a `StorageEngine` trait:
   - Abstract method: `fn get(&self, key: &str) -> Result<Vec<u8>, StorageError>;`
   - Abstract method: `fn set(&mut self, key: String, value: Vec<u8>) -> Result<(), StorageError>;`
   - Default method: `fn get_or_default(&self, key: &str, default_val: Vec<u8>) -> Vec<u8>` (Returns existing data if found, or returns `default_val` on error).
   - Default method: `fn contains(&self, key: &str) -> bool` (Returns `true` if `self.get(key)` returns `Ok(_)`, `false` otherwise).
   - Default method: `fn batch_set(&mut self, entries: Vec<(String, Vec<u8>)>) -> Result<usize, StorageError>` (Iterates over `entries`, invoking `self.set`, returning inserted count or propagating the first `StorageError`).
3. Implement `StorageEngine` for `InMemoryStorage` (containing a `HashMap<String, Vec<u8>>` and a `quota: usize`).
4. Enforce quota limits in `set`: if unique entry count exceeds `quota`, return `Err(StorageError::StorageFull)`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::HashMap;
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum StorageError {
>     KeyNotFound(String),
>     PermissionDenied,
>     StorageFull,
>     IoError(String),
> }
> 
> pub trait StorageEngine {
>     fn get(&self, key: &str) -> Result<Vec<u8>, StorageError>;
>     fn set(&mut self, key: String, value: Vec<u8>) -> Result<(), StorageError>;
> 
>     fn get_or_default(&self, key: &str, default_val: Vec<u8>) -> Vec<u8> {
>         match self.get(key) {
>             Ok(data) => data,
>             Err(_) => default_val,
>         }
>     }
> 
>     fn contains(&self, key: &str) -> bool {
>         self.get(key).is_ok()
>     }
> 
>     fn batch_set(&mut self, entries: Vec<(String, Vec<u8>)>) -> Result<usize, StorageError> {
>         let mut count = 0;
>         for (k, v) in entries {
>             self.set(k, v)?;
>             count += 1;
>         }
>         Ok(count)
>     }
> }
> 
> pub struct InMemoryStorage {
>     data: HashMap<String, Vec<u8>>,
>     quota: usize,
> }
> 
> impl InMemoryStorage {
>     pub fn new(quota: usize) -> Self {
>         Self {
>             data: HashMap::new(),
>             quota,
>         }
>     }
> }
> 
> impl StorageEngine for InMemoryStorage {
>     fn get(&self, key: &str) -> Result<Vec<u8>, StorageError> {
>         self.data
>             .get(key)
>             .cloned()
>             .ok_or_else(|| StorageError::KeyNotFound(key.to_string()))
>     }
> 
>     fn set(&mut self, key: String, value: Vec<u8>) -> Result<(), StorageError> {
>         if self.data.len() >= self.quota && !self.data.contains_key(&key) {
>             return Err(StorageError::StorageFull);
>         }
>         self.data.insert(key, value);
>         Ok(())
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_in_memory_storage_crud() {
>         let mut storage = InMemoryStorage::new(5);
>         assert!(!storage.contains("session:1001"));
> 
>         assert_eq!(
>             storage.get("session:1001"),
>             Err(StorageError::KeyNotFound("session:1001".to_string()))
>         );
> 
>         let res = storage.set("session:1001".to_string(), b"active_user_data".to_vec());
>         assert!(res.is_ok());
> 
>         assert!(storage.contains("session:1001"));
>         assert_eq!(
>             storage.get("session:1001").unwrap(),
>             b"active_user_data".to_vec()
>         );
>     }
> 
>     #[test]
>     fn test_default_get_or_default() {
>         let mut storage = InMemoryStorage::new(5);
>         storage
>             .set("config:theme".to_string(), b"dark".to_vec())
>             .unwrap();
> 
>         let theme = storage.get_or_default("config:theme", b"light".to_vec());
>         assert_eq!(theme, b"dark".to_vec());
> 
>         let font = storage.get_or_default("config:font", b"monospace".to_vec());
>         assert_eq!(font, b"monospace".to_vec());
>         assert_ne!(theme, font);
>     }
> 
>     #[test]
>     fn test_batch_set_default_method() {
>         let mut storage = InMemoryStorage::new(10);
>         let items = vec![
>             ("k1".to_string(), b"v1".to_vec()),
>             ("k2".to_string(), b"v2".to_vec()),
>             ("k3".to_string(), b"v3".to_vec()),
>         ];
> 
>         let batch_res = storage.batch_set(items);
>         assert_eq!(batch_res, Ok(3));
>         assert!(storage.contains("k1"));
>         assert!(storage.contains("k2"));
>         assert!(storage.contains("k3"));
> 
>         let fetch_err = storage.get("k4");
>         assert!(matches!(fetch_err, Err(StorageError::KeyNotFound(_))));
>     }
> 
>     #[test]
>     fn test_storage_full_quota_enforcement() {
>         let mut storage = InMemoryStorage::new(1);
>         storage.set("k1".to_string(), b"v1".to_vec()).unwrap();
> 
>         let err = storage.set("k2".to_string(), b"v2".to_vec());
>         assert!(matches!(err, Err(StorageError::StorageFull)));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
>
>
> 1. **Default Method Composition**: Default methods in traits can invoke abstract trait methods (`self.get()` inside `contains()` and `get_or_default()`, and `self.set()` inside `batch_set()`). This promotes composition over code duplication while maintaining strict interface contracts.
> 2. **Error Propagation with `?` Operator**: In `batch_set`, the `?` operator evaluates `self.set(k, v)`. If an error occurs on item $N$, batch execution halts immediately and returns `Err(StorageError)`, ensuring transactional fail-fast behavior across default operations.
> 3. **Ownership and Mutability Boundaries**: Abstract method `get(&self)` requires only shared reference borrowing, permitting concurrent reads. Conversely, `set(&mut self)` requires exclusive write access, enforcing Rust's single-writer-or-multiple-readers borrow checker rule.
> 4. **Quota Guard Mechanics**: `InMemoryStorage` validates key presence (`!self.data.contains_key(&key)`) before applying quota bounds, allowing updates to existing keys even when capacity limits are met.

---

### Exercise 3: Supertrait Dependency Hierarchy for Cryptographic Payload Serialization & Verification

**Problem Scenario:**
In a secure blockchain engine or signed RPC messaging system, payloads transmitted over the wire must satisfy serialization requirements before cryptographic signing can take place. 

To enforce this structural constraint at compile time, design a supertrait relationship where `Signable` depends on `Serializable`:

1. Define trait `Serializable`:
   - `fn serialize(&self) -> Vec<u8>;`
   - `fn deserialize(bytes: &[u8]) -> Result<Self, String> where Self: Sized;`
2. Define supertrait `Signable: Serializable`:
   - Default method `fn signing_bytes(&self) -> Vec<u8>` which invokes `self.serialize()`.
   - Method signature `fn sign(&self, secret_key: &str) -> String;`
   - Default method `fn verify(&self, secret_key: &str, signature: &str) -> bool` which returns `self.sign(secret_key) == signature`.
3. Implement `Serializable` and `Signable` for `TransactionPayload` (struct with `tx_id: u64`, `sender: String`, `amount: u64`).
   - Format `serialize()` as UTF-8 string bytes: `"{tx_id}:{sender}:{amount}"`.
   - Compute `sign()` using a checksum digest format: `"SIG[{secret_key}:{sum_of_bytes}]"`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub trait Serializable {
>     fn serialize(&self) -> Vec<u8>;
>     fn deserialize(bytes: &[u8]) -> Result<Self, String>
>     where
>         Self: Sized;
> }
> 
> pub trait Signable: Serializable {
>     fn signing_bytes(&self) -> Vec<u8> {
>         self.serialize()
>     }
> 
>     fn sign(&self, secret_key: &str) -> String {
>         let bytes = self.signing_bytes();
>         let checksum: u32 = bytes.iter().map(|&b| b as u32).sum();
>         format!("SIG[{}:{}]", secret_key, checksum)
>     }
> 
>     fn verify(&self, secret_key: &str, signature: &str) -> bool {
>         self.sign(secret_key) == signature
>     }
> }
> 
> #[derive(Debug, PartialEq, Eq, Clone)]
> pub struct TransactionPayload {
>     pub tx_id: u64,
>     pub sender: String,
>     pub amount: u64,
> }
> 
> impl Serializable for TransactionPayload {
>     fn serialize(&self) -> Vec<u8> {
>         format!("{}:{}:{}", self.tx_id, self.sender, self.amount).into_bytes()
>     }
> 
>     fn deserialize(bytes: &[u8]) -> Result<Self, String> {
>         let s = std::str::from_utf8(bytes).map_err(|e| e.to_string())?;
>         let parts: Vec<&str> = s.split(':').collect();
>         if parts.len() != 3 {
>             return Err(format!("Invalid segment count: {}", parts.len()));
>         }
>         let tx_id = parts[0]
>             .parse::<u64>()
>             .map_err(|_| "Invalid tx_id".to_string())?;
>         let sender = parts[1].to_string();
>         let amount = parts[2]
>             .parse::<u64>()
>             .map_err(|_| "Invalid amount".to_string())?;
>         Ok(TransactionPayload {
>             tx_id,
>             sender,
>             amount,
>         })
>     }
> }
> 
> impl Signable for TransactionPayload {}
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_serializable_roundtrip() {
>         let tx = TransactionPayload {
>             tx_id: 10042,
>             sender: String::from("alice.eth"),
>             amount: 5000,
>         };
> 
>         let bytes = tx.serialize();
>         assert_eq!(bytes, b"10042:alice.eth:5000".to_vec());
> 
>         let restored = TransactionPayload::deserialize(&bytes);
>         assert!(matches!(restored, Ok(ref payload) if payload.tx_id == 10042));
>         assert_eq!(restored.unwrap(), tx);
>     }
> 
>     #[test]
>     fn test_supertrait_signing_and_verification() {
>         let tx = TransactionPayload {
>             tx_id: 99,
>             sender: String::from("bob.eth"),
>             amount: 250,
>         };
> 
>         let secret = "secret_key_123";
>         let sig = tx.sign(secret);
> 
>         assert!(tx.verify(secret, &sig));
> 
>         let bogus_sig = "SIG[secret_key_123:000]";
>         assert_ne!(sig, bogus_sig);
>         assert!(!tx.verify(secret, bogus_sig));
>     }
> 
>     #[test]
>     fn test_tampered_payload_verification_failure() {
>         let tx_original = TransactionPayload {
>             tx_id: 1,
>             sender: String::from("charlie"),
>             amount: 10,
>         };
>         let secret = "key_abc";
>         let sig_original = tx_original.sign(secret);
> 
>         let tx_tampered = TransactionPayload {
>             tx_id: 1,
>             sender: String::from("charlie"),
>             amount: 1000000,
>         };
> 
>         assert!(!tx_tampered.verify(secret, &sig_original));
>         assert!(matches!(
>             tx_tampered.verify(secret, &sig_original),
>             false
>         ));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
>
>
> 1. **Supertrait Inheritance Hierarchy**: The `trait Signable: Serializable` declaration creates a compile-time requirement: any type implementing `Signable` MUST also implement `Serializable`. The compiler rejects attempts to implement `Signable` on a struct without an explicit `impl Serializable for Type` block.
> 2. **Sized Bound on Associated Constructors**: `deserialize` includes a `where Self: Sized` bound. Because constructor-style methods return `Self` by value, the compiler must know the precise stack size of the implementing type at compile time. This bound also permits `Serializable` to remain compatible with trait object dynamic dispatch if needed for methods excluding `Self: Sized`.
> 3. **Default Supertrait Method Chaining**: Default method `signing_bytes()` on `Signable` directly calls `self.serialize()` provided by the supertrait `Serializable`. This guarantees that signature calculation operates on identical byte representations to wire network serialization.
> 4. **Tamper Resilience**: Modifying any field (such as `amount`) alters the serialized byte sequence, producing a different checksum digest during `verify()`, catching data corruption or unauthorized payload tampering.

---

## 6. Related Terms

- [Trait Bound](../level_04/trait_bound.md) — How we actually force a generic `<T>` to implement a specific Trait (e.g., `<T: Summary>`).
- [Generics (`<T>`)](../level_04/generics.md) — What we use Traits to constrain.
- [`impl Trait`](../level_04/impl_trait.md) — Syntactic sugar for accepting/returning types that implement a specific trait.

---

## 7. Key Takeaways

- Traits define shared behavior (methods) that multiple different types can implement.
- They are Rust's equivalent to "Interfaces" in languages like Java or C#.
- You implement a trait on a type using the `impl TraitName for TypeName` syntax.
- Traits can have default method implementations, which types can choose to keep or override.
- **The Orphan Rule** prevents you from implementing an external trait on an external type.
