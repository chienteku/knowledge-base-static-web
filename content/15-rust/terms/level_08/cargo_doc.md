# `cargo doc`

> **Level 8 — Testing & Documentation**
> Generates HTML documentation from doc comments.

---

## 1. Prerequisites


- [Cargo](../level_01/cargo.md) — The build system that executes this command.
- [Comments](../level_01/comments.md) — The `///` syntax that provides the raw text for this tool.
- [Doc Tests](doc_tests.md) — The code examples that this tool formats into the final page.

---

## 2. Term Category

**Rust Tooling (the website builder)**: You wrote hundreds of beautiful `///` doc comments explaining how your library works. But reading comments scattered across dozens of raw `.rs` text files is ugly and incredibly hard to navigate. 

The **`cargo doc`** command is a built-in tool that extracts all those comments and automatically builds a beautiful, searchable, interactive HTML website for your project!

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In other programming ecosystems, developers have to download and configure massive third-party tools (like Doxygen for C++, Sphinx for Python, or Javadoc for Java) to generate documentation websites. These tools often break, require complex configuration files, and result in completely different website layouts across the ecosystem. 

Rust built the documentation generator directly into Cargo. Because *every* Rust project uses `cargo doc`, every single Rust library in the world has the exact same standardized documentation layout. When you learn how to read one Rust documentation page (like the ones on `docs.rs`), you instantly know how to read them all!

### (2) Reality Metaphor

Imagine you are an author writing a novel on a typewriter. 

Your raw manuscript (the `.rs` code files) has margin notes, sticky notes, and scribbles (the `///` comments). You don't hand that messy stack of papers to a customer! 

You hand it to a Publisher (`cargo doc`). The publisher takes your messy notes, typesets them, generates a Table of Contents, binds them into a beautiful hardcover book, and places it on a shelf for the world to easily read.

### (3) Rust Code Examples

#### Short Snippet (The Commands)
You don't write Rust code for this, you just run terminal commands!

```bash
# 1. Build the website! 
# It saves the HTML files in `target/doc/`
cargo doc

# 2. Build the website AND immediately open it in your web browser!
cargo doc --open
```

#### Fuller Example (Writing for the Publisher)
When you write `///` comments, you are actually writing Markdown! `cargo doc` understands standard markdown headers, bolding, and lists.

```rust
/// Calculates the total cost of an order.
///
/// # Formulas Used
/// This uses the standard `price * quantity` formula.
///
/// # Panics
/// This function will panic if `quantity` is negative!
///
/// # Examples
/// ```
/// let total = calculate_total(10.0, 5);
/// assert_eq!(total, 50.0);
/// ```
pub fn calculate_total(price: f64, quantity: i32) -> f64 {
    // ...
}
```
When you run `cargo doc`, it turns `# Formulas Used` into a massive HTML Header, and it turns the ` ``` ` block into beautifully syntax-highlighted code.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Cargo Doc Scoping and Lifecycle Rules

**The mistake:** Assuming Cargo Doc instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("cargo_doc_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("cargo_doc_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Cargo Doc State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Cargo Doc through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Cargo Doc Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Cargo Doc instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Distributed Cache API with Rustdoc Intra-Doc Hyperlinks & Code Hiding

**Scenario:**
You are building an in-memory distributed caching library (`DistributedCache`). To make your library documentation clear and easily navigable via `cargo doc`, you must write crate-level and item-level doc comments that link related types using rustdoc intra-doc link syntax (`[`CacheConfig`]`, `[`CacheError`]`, `[`CacheBackend`]`).

Requirements:
1. Define a `CacheConfig` struct for cache capacity and TTL settings.
2. Define a `CacheBackend` trait specifying `get` and `put` operations, with `# Errors` doc headers.
3. Implement `InMemoryCache` conforming to `CacheBackend` with hit and miss counters.
4. Include doc comments featuring intra-doc links, `# Examples`, and `#` hidden lines for clean HTML output.
5. Write complete unit tests (`#[cfg(test)] mod tests`) verifying cache hit/miss tracking and capacity eviction with `assert_eq!`, `assert!`, `assert_ne!`, and `matches!`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::HashMap;
> 
> /// Error types encountered during cache operations.
> ///
> /// See [`InMemoryCache`] for practical usage.
> #[derive(Debug, PartialEq, Eq)]
> pub enum CacheError {
>     /// The cache capacity defined in [`CacheConfig`] has been exceeded.
>     CapacityExceeded,
>     /// The requested key was not found in storage.
>     KeyNotFound,
>     /// An internal storage failure occurred.
>     StorageError(String),
> }
> 
> /// Configuration settings for [`InMemoryCache`].
> #[derive(Debug, Clone)]
> pub struct CacheConfig {
>     /// Maximum number of key-value pairs allowed.
>     pub max_entries: usize,
>     /// Default time-to-live in seconds.
>     pub ttl_seconds: u64,
> }
> 
> impl Default for CacheConfig {
>     fn default() -> Self {
>         Self {
>             max_entries: 1000,
>             ttl_seconds: 3600,
>         }
>     }
> }
> 
> /// Abstraction for pluggable cache storage backends.
> ///
> /// Implementations must support key retrieval via [`CacheBackend::get`] and insertion via [`CacheBackend::put`].
> pub trait CacheBackend {
>     /// Retrieves a value associated with `key`.
>     ///
>     /// # Errors
>     /// Returns [`CacheError::KeyNotFound`] if the key does not exist.
>     fn get(&mut self, key: &str) -> Result<Option<String>, CacheError>;
> 
>     /// Inserts a key-value pair into the storage backend.
>     ///
>     /// # Errors
>     /// Returns [`CacheError::CapacityExceeded`] if insertion exceeds [`CacheConfig::max_entries`].
>     fn put(&mut self, key: String, value: String) -> Result<(), CacheError>;
> }
> 
> /// In-memory implementation of [`CacheBackend`].
> ///
> /// Maintains hit/miss counters and enforces capacity limits defined by [`CacheConfig`].
> ///
> /// # Examples
> /// ```
> /// # use std::error::Error;
> /// # fn main() -> Result<(), Box<dyn Error>> {
> /// let config = CacheConfig { max_entries: 2, ttl_seconds: 60 };
> /// let mut cache = InMemoryCache::new(config);
> /// cache.put("session_101".to_string(), "active".to_string())?;
> /// assert_eq!(cache.get("session_101")?, Some("active".to_string()));
> /// # Ok(())
> /// # }
> /// ```
> pub struct InMemoryCache {
>     config: CacheConfig,
>     storage: HashMap<String, String>,
>     hits: u64,
>     misses: u64,
> }
> 
> impl InMemoryCache {
>     /// Constructs a new [`InMemoryCache`] using the provided [`CacheConfig`].
>     pub fn new(config: CacheConfig) -> Self {
>         Self {
>             config,
>             storage: HashMap::new(),
>             hits: 0,
>             misses: 0,
>         }
>     }
> 
>     /// Returns the current number of successful cache hits.
>     pub fn hits(&self) -> u64 {
>         self.hits
>     }
> 
>     /// Returns the current number of cache misses.
>     pub fn misses(&self) -> u64 {
>         self.misses
>     }
> }
> 
> impl CacheBackend for InMemoryCache {
>     fn get(&mut self, key: &str) -> Result<Option<String>, CacheError> {
>         match self.storage.get(key) {
>             Some(val) => {
>                 self.hits += 1;
>                 Ok(Some(val.clone()))
>             }
>             None => {
>                 self.misses += 1;
>                 Err(CacheError::KeyNotFound)
>             }
>         }
>     }
> 
>     fn put(&mut self, key: String, value: String) -> Result<(), CacheError> {
>         if !self.storage.contains_key(&key) && self.storage.len() >= self.config.max_entries {
>             return Err(CacheError::CapacityExceeded);
>         }
>         self.storage.insert(key, value);
>         Ok(())
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_cache_hit_and_miss_tracking() {
>         let config = CacheConfig { max_entries: 2, ttl_seconds: 300 };
>         let mut cache = InMemoryCache::new(config);
> 
>         assert_eq!(cache.hits(), 0);
>         assert_eq!(cache.misses(), 0);
> 
>         assert!(cache.put("usr_1".to_string(), "alice".to_string()).is_ok());
>         
>         let res = cache.get("usr_1");
>         assert!(res.is_ok());
>         assert_eq!(res.unwrap(), Some("alice".to_string()));
>         assert_eq!(cache.hits(), 1);
> 
>         let err = cache.get("usr_2");
>         assert!(matches!(err, Err(CacheError::KeyNotFound)));
>         assert_eq!(cache.misses(), 1);
>     }
> 
>     #[test]
>     fn test_cache_capacity_limit() {
>         let config = CacheConfig { max_entries: 1, ttl_seconds: 300 };
>         let mut cache = InMemoryCache::new(config);
> 
>         assert!(cache.put("k1".to_string(), "v1".to_string()).is_ok());
>         let overflow = cache.put("k2".to_string(), "v2".to_string());
>         assert_eq!(overflow, Err(CacheError::CapacityExceeded));
>         assert_ne!(cache.storage.len(), 2);
>     }
> }
> ```
> 
> **Step-by-step Technical Explanation:**
> 1. **Intra-Doc Link Resolution:** By enclosing type names in brackets (e.g. `[`CacheConfig`]`, `[`CacheError`]`), `cargo doc` resolves these references during doc generation and emits HTML hyperlinks directly connecting API components across the rendered website.
> 2. **Hiding Boilerplate Code with `#`:** In doc comment code blocks, lines starting with `#` (such as `# use std::error::Error;` or `# fn main() -> Result<(), Box<dyn Error>> {`) are parsed and executed during `cargo test --doc` verification, but omitted from the HTML documentation rendered by `cargo doc --open`.
> 3. **Standard Section Headers:** Adding Markdown section headers (`# Errors`, `# Examples`) standardizes rustdoc rendering into distinct visual callout blocks on the generated HTML page.
> 
---

### Exercise 2: API Gateway Middleware with Hidden Types (`#[doc(hidden)]`) & Feature Gates

**Scenario:**
In an enterprise API Gateway middleware, external public documentation built by `cargo doc` should focus strictly on public types while omitting internal helpers, raw byte manipulators, and legacy methods.

Requirements:
1. Implement a `GatewayConfig` struct and a `TokenValidator` struct for authorization handling.
2. Use `#[doc(hidden)]` to exclude low-level primitive methods (`__internal_raw_hash`) and internal session structs (`InternalSessionTracker`) from `cargo doc` HTML output while keeping them accessible to library code.
3. Document panics and security rules using `# Panics` and `# Security` doc headers.
4. Implement an `AuthenticationProvider` trait with error handling using `AuthError`.
5. Write complete unit tests (`#[cfg(test)] mod tests`) testing valid/invalid tokens, trait dispatch, hidden internal method execution, and panic triggers using `assert_eq!`, `assert!`, `assert_ne!`, and `matches!`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::HashSet;
> 
> /// Error variants encountered during API Gateway request processing.
> #[derive(Debug, PartialEq, Eq)]
> pub enum AuthError {
>     /// Provided JWT or API token is expired or corrupted.
>     InvalidToken,
>     /// Caller lacks permission for the requested endpoint.
>     Unauthorized,
>     /// Low-level crypt validation failed internally.
>     InternalCryptoError,
> }
> 
> /// Core configuration for the API Gateway middleware.
> #[derive(Debug, Clone)]
> pub struct GatewayConfig {
>     /// Active API port for inbound client connections.
>     pub port: u16,
>     /// List of allowed host origins for CORS validation.
>     pub allowed_origins: HashSet<String>,
> }
> 
> /// Token validation processor for API requests.
> ///
> /// Uses standard HMAC key verification to authenticate incoming client tokens.
> pub struct TokenValidator {
>     secret_key: String,
> }
> 
> impl TokenValidator {
>     /// Constructs a new [`TokenValidator`] with the specified secret key.
>     ///
>     /// # Panics
>     /// Panics if `secret_key` is empty.
>     pub fn new(secret_key: impl Into<String>) -> Self {
>         let key = secret_key.into();
>         assert!(!key.is_empty(), "Secret key cannot be empty");
>         Self { secret_key: key }
>     }
> 
>     /// Validates an incoming authorization bearer token.
>     ///
>     /// # Errors
>     /// Returns [`AuthError::InvalidToken`] if the token format is invalid or key mismatch occurs.
>     ///
>     /// # Example
>     /// ```
>     /// let validator = TokenValidator::new("supersecret");
>     /// assert!(validator.validate_token("token_supersecret_valid").is_ok());
>     /// ```
>     pub fn validate_token(&self, token: &str) -> Result<bool, AuthError> {
>         if token.starts_with("token_") && token.contains(&self.secret_key) {
>             Ok(true)
>         } else {
>             Err(AuthError::InvalidToken)
>         }
>     }
> 
>     /// Low-level raw hash computation helper.
>     ///
>     /// Hidden from public HTML documentation generated by `cargo doc`.
>     #[doc(hidden)]
>     pub fn __internal_raw_hash(&self, input: &[u8]) -> u64 {
>         input.iter().fold(0u64, |acc, &x| acc.wrapping_add(x as u64))
>     }
> }
> 
> /// Trait defining authentication providers for API Gateway integration.
> pub trait AuthenticationProvider {
>     /// Authenticates an incoming request payload string.
>     ///
>     /// # Security
>     /// Tokens must be transmitted over encrypted TLS connections.
>     fn authenticate(&self, credential: &str) -> Result<String, AuthError>;
> }
> 
> impl AuthenticationProvider for TokenValidator {
>     fn authenticate(&self, credential: &str) -> Result<String, AuthError> {
>         if self.validate_token(credential)? {
>             Ok("user_authenticated_role".to_string())
>         } else {
>             Err(AuthError::Unauthorized)
>         }
>     }
> }
> 
> /// Internal session cache hidden from external documentation.
> #[doc(hidden)]
> pub struct InternalSessionTracker {
>     pub active_sessions: u32,
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_token_validation_success_and_failure() {
>         let validator = TokenValidator::new("secret123");
>         
>         let valid_res = validator.validate_token("token_secret123_session");
>         assert!(valid_res.is_ok());
>         assert_eq!(valid_res.unwrap(), true);
> 
>         let invalid_res = validator.validate_token("token_wrongkey_session");
>         assert_eq!(invalid_res, Err(AuthError::InvalidToken));
>     }
> 
>     #[test]
>     fn test_auth_provider_trait_implementation() {
>         let validator = TokenValidator::new("my_jwt_key");
>         let auth_res = validator.authenticate("token_my_jwt_key_granted");
>         assert!(auth_res.is_ok());
>         assert_eq!(auth_res.unwrap(), "user_authenticated_role");
> 
>         let bad_auth = validator.authenticate("invalid");
>         assert!(matches!(bad_auth, Err(AuthError::InvalidToken)));
>     }
> 
>     #[test]
>     fn test_hidden_internal_methods_work_at_runtime() {
>         let validator = TokenValidator::new("key");
>         // Hidden methods still exist and run normally in Rust code despite #[doc(hidden)]
>         let hash = validator.__internal_raw_hash(b"test_payload");
>         assert_ne!(hash, 0);
>     }
> 
>     #[test]
>     #[should_panic(expected = "Secret key cannot be empty")]
>     fn test_empty_secret_key_panics() {
>         let _ = TokenValidator::new("");
>     }
> }
> ```
> 
> **Step-by-step Technical Explanation:**
> 1. **Controlling HTML Visibility with `#[doc(hidden)]`:** Annotating items with `#[doc(hidden)]` instructs `cargo doc` to omit them from generated HTML index pages. This keeps library documentation clean and focused on public APIs while retaining full visibility in Rust source code for internal workspace modules.
> 2. **Verifying Panic Guarantees:** The `# Panics` section in documentation guarantees contract behavior under invalid inputs. The `#[should_panic]` test attribute verifies that empty keys panic as documented.
> 3. **Documenting Security Constraints:** Custom section headers like `# Security` draw immediate developer attention in the generated HTML layout for critical compliance rules.
> 
---

### Exercise 3: Event Microservice Bus with Inline Re-exports (`#[doc(inline)]`)

**Scenario:**
When structuring large crates with nested sub-modules (`mod internal`), users navigating through `cargo doc` can get lost in multi-level module trees. You must flatten the documentation presentation by re-exporting internal types at the crate root using `#[doc(inline)] pub use ...`.

Requirements:
1. Define internal sub-module items: `EventMessage` struct, `EventHandler` trait, and `EventBus` struct.
2. In the parent module, re-export sub-module items using `#[doc(inline)] pub use ...` so `cargo doc` embeds their documentation directly into the main module landing page instead of creating nested sub-page links.
3. Support thread-safe subscriber registration and event publishing using `Arc<Mutex<...>>` or atomic counters.
4. Include doc comments featuring `# Concurrency` and intra-doc links.
5. Write complete unit tests (`#[cfg(test)] mod tests`) verifying multi-subscriber delivery, empty payload filtering, and total published message tracking using `assert_eq!`, `assert!`, `assert_ne!`, and `matches!`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub mod internal {
>     use std::sync::{Arc, Mutex};
> 
>     /// Represents a message dispatched through the event bus system.
>     ///
>     /// See [`EventBus`](super::EventBus) for dispatching details.
>     #[derive(Debug, Clone, PartialEq, Eq)]
>     pub struct EventMessage {
>         /// Topic header determining target subscribers.
>         pub topic: String,
>         /// Raw message body payload bytes.
>         pub payload: Vec<u8>,
>     }
> 
>     impl EventMessage {
>         /// Creates a new [`EventMessage`] with topic and payload.
>         pub fn new(topic: impl Into<String>, payload: Vec<u8>) -> Self {
>             Self {
>                 topic: topic.into(),
>                 payload,
>             }
>         }
>     }
> 
>     /// Handler trait for processing incoming [`EventMessage`] events.
>     pub trait EventHandler: Send + Sync {
>         /// Processes a single dispatched [`EventMessage`].
>         fn handle(&self, msg: &EventMessage);
>     }
> 
>     /// Thread-safe event bus that routes [`EventMessage`] instances to registered [`EventHandler`]s.
>     ///
>     /// # Concurrency
>     /// Thread safe. Uses internal [`std::sync::Mutex`] locking for concurrent publish calls.
>     pub struct EventBus {
>         handlers: Arc<Mutex<Vec<Box<dyn EventHandler>>>>,
>         published_count: Arc<Mutex<usize>>,
>     }
> 
>     impl EventBus {
>         /// Constructs a new empty [`EventBus`].
>         pub fn new() -> Self {
>             Self {
>                 handlers: Arc::new(Mutex::new(Vec::new())),
>                 published_count: Arc::new(Mutex::new(0)),
>             }
>         }
> 
>         /// Registers a new subscriber handler with the bus.
>         pub fn subscribe<H: EventHandler + 'static>(&self, handler: H) {
>             let mut list = self.handlers.lock().unwrap();
>             list.push(Box::new(handler));
>         }
> 
>         /// Publishes an [`EventMessage`] to all registered handlers.
>         ///
>         /// Returns the number of handlers that processed the event.
>         pub fn publish(&self, message: &EventMessage) -> usize {
>             let list = self.handlers.lock().unwrap();
>             for handler in list.iter() {
>                 handler.handle(message);
>             }
>             let mut count = self.published_count.lock().unwrap();
>             *count += 1;
>             list.len()
>         }
> 
>         /// Returns total count of published messages.
>         pub fn total_published(&self) -> usize {
>             *self.published_count.lock().unwrap()
>         }
>     }
> }
> 
> // Inlining sub-module items into the crate root documentation page generated by `cargo doc`:
> #[doc(inline)]
> pub use internal::EventBus;
> #[doc(inline)]
> pub use internal::EventHandler;
> #[doc(inline)]
> pub use internal::EventMessage;
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
>     use std::sync::atomic::{AtomicUsize, Ordering};
>     use std::sync::Arc;
> 
>     struct TestMetricsHandler {
>         processed: Arc<AtomicUsize>,
>     }
> 
>     impl EventHandler for TestMetricsHandler {
>         fn handle(&self, msg: &EventMessage) {
>             if !msg.payload.is_empty() {
>                 self.processed.fetch_add(1, Ordering::SeqCst);
>             }
>         }
>     }
> 
>     #[test]
>     fn test_event_bus_publishing_and_metrics() {
>         let bus = EventBus::new();
>         let counter = Arc::new(AtomicUsize::new(0));
> 
>         let handler = TestMetricsHandler {
>             processed: Arc::clone(&counter),
>         };
> 
>         bus.subscribe(handler);
> 
>         let msg1 = EventMessage::new("order.created", b"payload_bytes".to_vec());
>         let handler_count = bus.publish(&msg1);
> 
>         assert_eq!(handler_count, 1);
>         assert_eq!(counter.load(Ordering::SeqCst), 1);
>         assert_eq!(bus.total_published(), 1);
>     }
> 
>     #[test]
>     fn test_event_bus_empty_payload_filtering() {
>         let bus = EventBus::new();
>         let counter = Arc::new(AtomicUsize::new(0));
> 
>         bus.subscribe(TestMetricsHandler {
>             processed: Arc::clone(&counter),
>         });
> 
>         let empty_msg = EventMessage::new("order.ping", vec![]);
>         let handler_count = bus.publish(&empty_msg);
> 
>         assert_eq!(handler_count, 1);
>         // Metric handler skips empty payload
>         assert_eq!(counter.load(Ordering::SeqCst), 0);
>         assert_ne!(bus.total_published(), 0);
>     }
> 
>     #[test]
>     fn test_inlined_reexport_types_match() {
>         let msg = EventMessage::new("test", vec![1, 2, 3]);
>         assert_eq!(msg.topic, "test");
>         assert!(matches!(msg.payload.as_slice(), [1, 2, 3]));
>     }
> }
> ```
> 
> **Step-by-step Technical Explanation:**
> 1. **`#[doc(inline)]` Taxonomy Management:** When re-exporting types from private or nested modules using `pub use internal::Item`, rustdoc normally creates a simple hyperlinked entry. Adding `#[doc(inline)]` forces `cargo doc` to render the full item documentation directly on the top-level page, reducing click depth for downstream users.
> 2. **Cross-Module Intra-Doc Links:** `[`EventBus`](super::EventBus)` illustrates how intra-doc links can navigate up and down module hierarchies using standard path references.
> 3. **Thread Safety Verification:** The unit test demonstrates thread-safe dispatch across atomic metrics and shared handler traits (`Send + Sync`).
> 
---

## 6. Related Terms


- [Doc Tests](doc_tests.md) — The code examples that `cargo doc` formats beautifully into the HTML page (which are also run as tests!).
- [`pub` Visibility](../level_07/pub_visibility.md) — The access modifier that determines whether `cargo doc` includes an item by default.
- [`//!` (Inner Doc Comment)](inner_doc_comment.md) — Related concept: `//!` (Inner Doc Comment).

---

## 7. Key Takeaways

- `cargo doc` parses all `///` (and `//!`) comments in your codebase.
- It generates a beautiful, standardized HTML website in the `target/doc/` folder.
- Run **`cargo doc --open`** to build the site and immediately open it in your default web browser.
- Run **`cargo doc --document-private-items`** to include documentation for non-public functions (perfect for internal team wikis).
