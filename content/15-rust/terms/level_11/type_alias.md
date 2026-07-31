# Type Alias

> **Level 11 — Smart Pointers & Advanced Types**
> `type Kilometers = i32;` — creates an alias, not a distinct type.

---

## 1. Prerequisites

- [Newtype Pattern](../level_11/newtype_pattern.md) — The strict, safe alternative to Type Aliases.
- [Result Enum](../level_02/result_t_e.md) — The most common place Type Aliases are used in the standard library.

---

## 2. Term Category

**Rust Syntax (the nickname generator)**: A Type Alias is a way to give a new name (a nickname) to an existing type. 

Unlike the Newtype Pattern (which creates a brand new, mathematically distinct struct), a Type Alias creates an identical clone of the name. If you make `type Kilometers = i32`, the compiler treats `Kilometers` and `i32` as exactly the same thing. You can use them interchangeably.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In Rust, types can get horrifyingly long. If you are building an advanced server, you might have a variable with a type like `Rc<RefCell<HashMap<String, Vec<Box<dyn std::error::Error>>>>>`. 

Typing that out in 15 different function signatures is an absolute nightmare. 

A Type Alias allows you to write `type ErrorMap = Rc<RefCell<...>>` once at the top of the file, and then just use `ErrorMap` everywhere else. It is purely for code readability and typing convenience.

### (2) Reality Metaphor

- **Newtype Pattern (`struct`)**: You legally change your name to a new identity. Your old driver's license no longer works. The bouncer at the club rejects your old ID. (A strictly new, distinct type).
- **Type Alias (`type`)**: Your name is William, but your friends call you "Bill". Both "William" and "Bill" refer to the exact same person. If a bouncer checks a VIP list for "William", and you say "I'm Bill", the bouncer lets you in because they are just aliases for the same thing!

### (3) Rust Code Examples

#### Short Snippet (Zero Type Safety)
Notice how `walk` asks for `Kilometers`, but we can just pass in a raw `i32` and the compiler doesn't care at all!

```rust
// Create a Type Alias (a nickname)
type Kilometers = i32;

fn walk(distance: Kilometers) {
    println!("Walking {} units!", distance);
}

fn main() {
    let x: i32 = 5;
    let y: Kilometers = 10;
    
    walk(x); // SUCCESS! i32 is accepted!
    walk(y); // SUCCESS!
}
```

#### Fuller Example (The Standard Library `Result` Pattern)
The Rust Standard Library uses Type Aliases everywhere to clean up code! 

If you use the `std::io` module, you will notice that almost every function returns `std::io::Result<T>`. But wait, doesn't `Result` require two generics? `Result<T, E>`? 

Yes! But the standard library created a Type Alias to hardcode the error type, saving you from typing `std::io::Error` 100 times! You can do the same in your own projects:

```rust
// We define our massive, custom Error enum
enum ServerError {
    DatabaseCrash,
    NetworkTimeout,
    InvalidUser,
}

// We create a Type Alias so we don't have to type out `ServerError` ever again!
type ServerResult<T> = Result<T, ServerError>;

// Now our function signatures are incredibly clean!
fn get_user() -> ServerResult<String> {
    Ok("Alice".to_string())
}

fn fetch_data() -> ServerResult<i32> {
    Err(ServerError::NetworkTimeout)
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Type Alias Scoping and Lifecycle Rules

**The mistake:** Assuming Type Alias instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("type_alias_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("type_alias_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Type Alias State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Type Alias through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Type Alias Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Type Alias instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Standardizing Microservice API Errors with Domain `Result` Type Aliases

**Problem:**
In high-throughput microservices and REST API backends, writing `Result<T, ApiError>` repeatedly across dozens of internal pipeline functions introduces boilerplate visual clutter. Following standard Rust idioms (like `std::io::Result<T>`), module authors define a generic type alias `type ApiResult<T> = Result<T, ApiError>;` that binds the concrete domain error type once.

Implement a request execution pipeline that utilizes `ApiResult<T>` short-circuiting:
1. Define a domain error enum `ApiError` with variants `NotFound(String)`, `Unauthorized`, `ValidationError(String)`, and `Internal(String)`.
2. Declare a module-level generic type alias `pub type ApiResult<T> = Result<T, ApiError>;`.
3. Implement `RequestPipeline` with `authenticate`, `validate_payload`, `fetch_user_name`, and `process_request` methods. `process_request` should use the `?` operator on `ApiResult` types to return formatted success text or short-circuit on error.
4. Include comprehensive unit tests verifying successful pipeline execution, authentication failures (`ApiError::Unauthorized`), and validation errors (`ApiError::ValidationError`).

> [!check]- Answer
> ```rust
> #[derive(Debug, PartialEq, Eq)]
> pub enum ApiError {
>     NotFound(String),
>     Unauthorized,
>     ValidationError(String),
>     Internal(String),
> }
> 
> // Module-level Type Alias to eliminate repetitive generic error declarations
> pub type ApiResult<T> = Result<T, ApiError>;
> 
> pub struct RequestPipeline {
>     valid_token: String,
> }
> 
> impl RequestPipeline {
>     pub fn new(token: &str) -> Self {
>         Self {
>             valid_token: token.to_string(),
>         }
>     }
> 
>     pub fn authenticate(&self, token: &str) -> ApiResult<u64> {
>         if token == self.valid_token {
>             Ok(1042) // User ID
>         } else {
>             Err(ApiError::Unauthorized)
>         }
>     }
> 
>     pub fn validate_payload(&self, payload: &str) -> ApiResult<()> {
>         if payload.is_empty() {
>             Err(ApiError::ValidationError("Payload cannot be empty".into()))
>         } else if payload.len() > 100 {
>             Err(ApiError::ValidationError("Payload exceeds max length".into()))
>         } else {
>             Ok(())
>         }
>     }
> 
>     pub fn fetch_user_name(&self, user_id: u64) -> ApiResult<String> {
>         match user_id {
>             1042 => Ok("Alice".to_string()),
>             _ => Err(ApiError::NotFound(format!("User ID {} not found", user_id))),
>         }
>     }
> 
>     // High-level pipeline method leveraging the ApiResult alias with `?` operator
>     pub fn process_request(&self, token: &str, payload: &str) -> ApiResult<String> {
>         let user_id = self.authenticate(token)?;
>         self.validate_payload(payload)?;
>         let name = self.fetch_user_name(user_id)?;
>         Ok(format!("Welcome, {}! Request processed: '{}'", name, payload))
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_successful_pipeline_execution() {
>         let pipeline = RequestPipeline::new("secret-bearer-token");
>         let result = pipeline.process_request("secret-bearer-token", "action=update_profile");
>         assert!(result.is_ok());
>         assert_eq!(
>             result.unwrap(),
>             "Welcome, Alice! Request processed: 'action=update_profile'"
>         );
>     }
> 
>     #[test]
>     fn test_authentication_failure() {
>         let pipeline = RequestPipeline::new("secret-bearer-token");
>         let result = pipeline.process_request("invalid-token", "action=update_profile");
>         assert!(result.is_err());
>         assert!(matches!(result.unwrap_err(), ApiError::Unauthorized));
>     }
> 
>     #[test]
>     fn test_validation_failure() {
>         let pipeline = RequestPipeline::new("secret-bearer-token");
>         let result = pipeline.process_request("secret-bearer-token", "");
>         assert!(result.is_err());
>         assert_eq!(
>             result.unwrap_err(),
>             ApiError::ValidationError("Payload cannot be empty".into())
>         );
>     }
> }
> ```
> 
> **Detailed Explanation:**
> 1. **Domain `Result` Type Alias:** By declaring `pub type ApiResult<T> = Result<T, ApiError>;`, we fix the second generic parameter (`E`) of Rust's standard `Result<T, E>`. Callers only need to supply `T`.
> 2. **Operator `?` Compatibility:** Because `ApiResult<T>` is physically identical to `Result<T, ApiError>`, the standard `?` operator functions seamlessly for error propagation across pipeline methods.
> 3. **Assertions in Unit Tests:**
>    - `assert!(result.is_ok())` and `assert_eq!(...)` confirm proper data processing on valid requests.
>    - `matches!(result.unwrap_err(), ApiError::Unauthorized)` pattern-matches enum variants without requiring manual destructuring.

---

### Exercise 2: Simplifying Complex Trait Object Closures in Event Handler Dispatchers

**Problem:**
In asynchronous frameworks, event dispatchers, or plugin systems, callback signatures involving trait objects can become unreadable (e.g. `Box<dyn Fn(&str) -> Result<String, &'static str> + Send + Sync>`). Without type aliases, registering handlers and managing internal registry maps generates verbose function signatures.

Construct a thread-safe `EventDispatcher` system:
1. Define a domain error alias `pub type EventResult<T> = Result<T, &'static str>;`.
2. Define a type alias `pub type EventHandler = Box<dyn Fn(&str) -> EventResult<String> + Send + Sync>;` for dynamic thread-safe closures.
3. Define a type alias `pub type HandlerRegistry = HashMap<String, Vec<EventHandler>>;` for the internal listener map.
4. Implement `EventDispatcher` with `subscribe` and `dispatch` methods.
5. Write unit tests ensuring multiple subscribers per event execute, errors propagate cleanly, and unregistered channels safely return empty vectors.

> [!check]- Answer
> ```rust
> use std::collections::HashMap;
> 
> // Type alias for domain result return types
> pub type EventResult<T> = Result<T, &'static str>;
> 
> // Complex Type Alias for dynamic thread-safe closure handlers
> pub type EventHandler = Box<dyn Fn(&str) -> EventResult<String> + Send + Sync>;
> 
> // Type alias for handler container per event channel
> pub type HandlerRegistry = HashMap<String, Vec<EventHandler>>;
> 
> pub struct EventDispatcher {
>     registry: HandlerRegistry,
> }
> 
> impl EventDispatcher {
>     pub fn new() -> Self {
>         Self {
>             registry: HashMap::new(),
>         }
>     }
> 
>     pub fn subscribe<F>(&mut self, event: &str, handler: F)
>     where
>         F: Fn(&str) -> EventResult<String> + Send + Sync + 'static,
>     {
>         self.registry
>             .entry(event.to_string())
>             .or_insert_with(Vec::new)
>             .push(Box::new(handler));
>     }
> 
>     pub fn dispatch(&self, event: &str, payload: &str) -> Vec<EventResult<String>> {
>         match self.registry.get(event) {
>             Some(handlers) => handlers.iter().map(|h| h(payload)).collect(),
>             None => Vec::new(),
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_event_dispatcher_pub_sub() {
>         let mut dispatcher = EventDispatcher::new();
> 
>         // Handler 1: Uppercase logger
>         dispatcher.subscribe("user_login", |payload| {
>             if payload.is_empty() {
>                 Err("Empty payload")
>             } else {
>                 Ok(format!("LOG: USER {}", payload.to_uppercase()))
>             }
>         });
> 
>         // Handler 2: Audit tracker
>         dispatcher.subscribe("user_login", |payload| {
>             Ok(format!("AUDIT: session_created_for_{}", payload))
>         });
> 
>         let results = dispatcher.dispatch("user_login", "alice");
>         assert_eq!(results.len(), 2);
>         assert_eq!(results[0], Ok("LOG: USER ALICE".to_string()));
>         assert_eq!(results[1], Ok("AUDIT: session_created_for_alice".to_string()));
>     }
> 
>     #[test]
>     fn test_event_handler_error_propagation() {
>         let mut dispatcher = EventDispatcher::new();
> 
>         dispatcher.subscribe("order_placed", |payload| {
>             if payload == "malformed" {
>                 Err("Invalid JSON format")
>             } else {
>                 Ok(format!("Processed order {}", payload))
>             }
>         });
> 
>         let results = dispatcher.dispatch("order_placed", "malformed");
>         assert_eq!(results.len(), 1);
>         assert!(matches!(results[0], Err("Invalid JSON format")));
>     }
> 
>     #[test]
>     fn test_unregistered_event_dispatch() {
>         let dispatcher = EventDispatcher::new();
>         let results = dispatcher.dispatch("unknown_event", "data");
>         assert!(results.is_empty());
>     }
> }
> ```
> 
> **Detailed Explanation:**
> 1. **Trait Object Cleanups:** Writing `Box<dyn Fn(&str) -> Result<String, &'static str> + Send + Sync>` in every struct field, parameter list, and return type causes intense boilerplate. Aliasing this complex combination to `EventHandler` restores clean readable code.
> 2. **Nested Map Type Alias:** `HandlerRegistry` abstracts `HashMap<String, Vec<EventHandler>>`, simplifying structural data declarations in the `EventDispatcher` struct.
> 3. **Thread Safety Trait Bounds:** The `Send + Sync` bounds ensure that event handlers can safely be dispatched across thread boundaries in concurrent execution environments.

---

### Exercise 3: Decoupling Thread-Safe Concurrent Storage with Nested Type Aliases

**Problem:**
Building concurrent data structures like in-memory caches or database connections involves wrapping collections inside composite smart pointers (e.g. `Arc<RwLock<HashMap<K, V>>>`). Directly typing `Arc<RwLock<HashMap<CacheKey, CacheValue<V>>>>` across storage managers makes code verbose and rigid.

Implement a thread-safe `ConcurrentCache<V>` using nested type aliases:
1. Define primitive scalar type aliases `pub type CacheKey = String;` and `pub type InstantSeconds = u64;`.
2. Define a custom `CacheError` enum (`KeyNotFound`, `Expired`, `LockPoisoned`) and a domain type alias `pub type CacheResult<T> = Result<T, CacheError>;`.
3. Define `CacheValue<V>` containing `data: V` and `expires_at: InstantSeconds`.
4. Define a composite type alias `pub type SharedStore<V> = Arc<RwLock<HashMap<CacheKey, CacheValue<V>>>>;`.
5. Implement `ConcurrentCache<V>` with `set`, `get`, `remove`, and `purge_expired` methods.
6. Write unit tests evaluating TTL expiration logic, purge operations, and multi-threaded concurrent mutations across OS threads using `std::thread::spawn`.

> [!check]- Answer
> ```rust
> use std::collections::HashMap;
> use std::sync::{Arc, RwLock};
> 
> pub type CacheKey = String;
> pub type InstantSeconds = u64;
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub enum CacheError {
>     KeyNotFound(CacheKey),
>     Expired,
>     LockPoisoned,
> }
> 
> // Domain Result type alias
> pub type CacheResult<T> = Result<T, CacheError>;
> 
> #[derive(Debug, Clone)]
> pub struct CacheValue<V> {
>     pub data: V,
>     pub expires_at: InstantSeconds,
> }
> 
> // Nested Type Alias combining Arc, RwLock, and HashMap for thread-safe memory storage
> pub type SharedStore<V> = Arc<RwLock<HashMap<CacheKey, CacheValue<V>>>>;
> 
> pub struct ConcurrentCache<V> {
>     store: SharedStore<V>,
> }
> 
> impl<V: Clone> ConcurrentCache<V> {
>     pub fn new() -> Self {
>         Self {
>             store: Arc::new(RwLock::new(HashMap::new())),
>         }
>     }
> 
>     pub fn set(
>         &self,
>         key: CacheKey,
>         data: V,
>         ttl_secs: u64,
>         current_time: InstantSeconds,
>     ) -> CacheResult<()> {
>         let mut guard = self.store.write().map_err(|_| CacheError::LockPoisoned)?;
>         guard.insert(
>             key,
>             CacheValue {
>                 data,
>                 expires_at: current_time + ttl_secs,
>             },
>         );
>         Ok(())
>     }
> 
>     pub fn get(&self, key: &str, current_time: InstantSeconds) -> CacheResult<V> {
>         let guard = self.store.read().map_err(|_| CacheError::LockPoisoned)?;
>         match guard.get(key) {
>             Some(entry) => {
>                 if current_time >= entry.expires_at {
>                     Err(CacheError::Expired)
>                 } else {
>                     Ok(entry.data.clone())
>                 }
>             }
>             None => Err(CacheError::KeyNotFound(key.to_string())),
>         }
>     }
> 
>     pub fn remove(&self, key: &str) -> CacheResult<V> {
>         let mut guard = self.store.write().map_err(|_| CacheError::LockPoisoned)?;
>         guard
>             .remove(key)
>             .map(|v| v.data)
>             .ok_or_else(|| CacheError::KeyNotFound(key.to_string()))
>     }
> 
>     pub fn purge_expired(&self, current_time: InstantSeconds) -> CacheResult<usize> {
>         let mut guard = self.store.write().map_err(|_| CacheError::LockPoisoned)?;
>         let before_count = guard.len();
>         guard.retain(|_, v| current_time < v.expires_at);
>         Ok(before_count - guard.len())
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
>     use std::thread;
> 
>     #[test]
>     fn test_cache_set_get_and_expiration() {
>         let cache = ConcurrentCache::<String>::new();
>         let now = 1000;
> 
>         cache.set("session_123".into(), "user_alice".into(), 60, now).unwrap();
> 
>         // Valid read before expiry
>         assert_eq!(
>             cache.get("session_123", now + 30),
>             Ok("user_alice".to_string())
>         );
> 
>         // Expired read returns Error
>         assert_eq!(cache.get("session_123", now + 61), Err(CacheError::Expired));
>     }
> 
>     #[test]
>     fn test_purge_expired_entries() {
>         let cache = ConcurrentCache::<i32>::new();
>         let now = 1000;
> 
>         cache.set("k1".into(), 10, 10, now).unwrap();
>         cache.set("k2".into(), 20, 50, now).unwrap();
> 
>         let purged = cache.purge_expired(now + 20).unwrap();
>         assert_eq!(purged, 1);
>         assert_eq!(cache.get("k2", now + 20), Ok(20));
>         assert!(matches!(cache.get("k1", now + 20), Err(CacheError::KeyNotFound(_))));
>     }
> 
>     #[test]
>     fn test_concurrent_thread_access() {
>         let cache = Arc::new(ConcurrentCache::<u64>::new());
>         let now = 500;
>         let mut handles = vec![];
> 
>         for i in 0..10 {
>             let cache_clone = Arc::clone(&cache);
>             let handle = thread::spawn(move || {
>                 let key = format!("worker_{}", i);
>                 cache_clone.set(key.clone(), i * 100, 300, now).unwrap();
>             });
>             handles.push(handle);
>         }
> 
>         for handle in handles {
>             handle.join().unwrap();
>         }
> 
>         for i in 0..10 {
>             let key = format!("worker_{}", i);
>             assert_eq!(cache.get(&key, now + 10), Ok(i * 100));
>         }
>     }
> }
> ```
> 
> **Detailed Explanation:**
> 1. **Composite Memory Type Alias:** `SharedStore<V>` encases the generic `Arc<RwLock<HashMap<CacheKey, CacheValue<V>>>>`. Any change to underlying synchronization primitives (e.g. switching from `RwLock` to `Mutex`) can be performed in a single type alias location.
> 2. **Interior Mutability & Mutex Guards:** The `store.write()` and `store.read()` methods acquire shared or exclusive locks on the underlying data, propagating `LockPoisoned` errors through `CacheResult<T>`.
> 3. **Thread Safety Verification:** The `test_concurrent_thread_access` test spawns 10 separate OS threads, demonstrating that `SharedStore<V>` can safely be cloned (`Arc::clone`) and accessed across threads concurrently.

---

## 6. Related Terms

- [Newtype Pattern](../level_11/newtype_pattern.md) — The strict, safe alternative to a Type Alias.
- [Result Enum](../level_02/result_t_e.md) — The most common place type aliases are used in the standard library (`std::io::Result`).

---

## 7. Key Takeaways

- A **Type Alias** uses the `type Name = OriginalType;` syntax to create a nickname for an existing type.
- It is used purely to shorten painfully long type signatures (like `Rc<RefCell<Vec<T>>>`) to make code readable.
- It does **not** create a new type! The compiler treats the alias and the original type as 100% identical and interchangeable.
- It provides **zero type safety**. To enforce strict mathematical or security boundaries, use the Newtype Pattern instead!
