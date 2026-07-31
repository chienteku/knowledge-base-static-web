# Custom Error Types

> **Level 4 — Error Handling & Generics**
> Defining your own error enums/structs that implement `std::error::Error`.

---

## 1. Prerequisites

- [`Result<T, E>`](../level_02/result_t_e.md) — The wrapper where our custom errors will live (the `E` part).
- [Enum](../level_02/enum.md) — The primary data structure used to build custom errors.
- [`?` Operator](../level_04/question_mark_operator.md) — The tool used to propagate these errors.

---

## 2. Term Category

**Rust-specific (the domain-driven design)**: In dynamic languages like Python or JavaScript, you usually just "throw" a generic Exception or an error string. In Rust, errors are strictly typed, domain-specific data structures that give the compiler (and the caller) exact information about what went wrong.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

When building an application, functions fail for very specific reasons. A user login attempt might fail because:
1. The username doesn't exist.
2. The password was incorrect.
3. The database server is currently offline.

If your function just returns `Result<User, String>` where the `String` is `"Login failed"`, that is terrible design. The caller has no idea *why* it failed unless they try to parse the text of the string!

To solve this, Rust encourages us to create **Custom Error Types** using `enum`. By creating a `LoginError` enum with those three specific variants, the caller can `match` on the exact error and execute perfect recovery logic (e.g., prompt the user to try again, or page the DevOps team that the database is down).

### (2) Reality Metaphor

Imagine a doctor calling you to give you the results of a blood test. 

If they just say *"You are sick"* (returning a generic `String` error), you have no idea what is wrong. Do you have a mild cold, or a terminal illness? You don't know what medicine to take to recover.

A **Custom Error Type** is the doctor giving you an exact diagnosis (`Diagnosis::StrepThroat`). Because you have an exact, categorized error, you know exactly what happened, and exactly what antibiotics (recovery logic) to use.

### (3) Rust Code Examples

#### Short Snippet (The Basic Enum)
The simplest way to make a custom error is just to define an enum and stick it inside a `Result`.

```rust
// 1. Define the exact ways this domain can fail
enum MathError {
    DivideByZero,
    NegativeSquareRoot,
}

// 2. Use our custom type in the `Err` slot of the Result
fn divide(a: f64, b: f64) -> Result<f64, MathError> {
    if b == 0.0 {
        return Err(MathError::DivideByZero);
    }
    Ok(a / b)
}
```

#### Fuller Example (The Idiomatic Boilerplate)
To make your error fully "idiomatic" (so it works perfectly with the rest of the Rust ecosystem), you must implement three traits: `Debug`, `Display`, and `std::error::Error`. 

*(Note: In the real world, nobody writes this boilerplate by hand. They use the `thiserror` crate to generate it automatically, which we will learn about soon!)*

```rust
use std::fmt;
use std::error::Error;

// 1. Must derive Debug
#[derive(Debug)]
enum LoginError {
    BadPassword,
    UserNotFound(String),
}

// 2. Must implement Display (how the error looks when printed to the user)
impl fmt::Display for LoginError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            LoginError::BadPassword => write!(f, "Incorrect password."),
            LoginError::UserNotFound(user) => write!(f, "User '{}' not found in database.", user),
        }
    }
}

// 3. Must implement the official Error trait (this is usually empty!)
impl Error for LoginError {}

fn main() {
    let err = LoginError::UserNotFound(String::from("alice_99"));
    
    // Now it prints beautifully!
    println!("Error occurred: {}", err);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Custom Error Types Scoping and Lifecycle Rules

**The mistake:** Assuming Custom Error Types instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("custom_error_types_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("custom_error_types_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Custom Error Types State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Custom Error Types through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Custom Error Types Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Custom Error Types instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Multi-Tier Microservice Error Hierarchy & Transparent `From` Conversion

**Problem Statement:**
In a high-throughput network gateway microservice, binary network packets are validated and written to a storage engine. Failures can occur at the protocol level (invalid header, checksum mismatch), the storage layer (record not found, capacity exceeded, underlying file I/O failure), or the gateway security layer (unauthorized client ID).

Design a hierarchical error handling architecture:
1. Define a `StorageError` enum with variants: `NotFound { record_id: u64 }`, `CapacityExceeded { limit: usize, current: usize }`, and `Io(std::io::Error)`.
2. Define a `ProtocolError` enum with variants: `InvalidHeader { byte: u8 }` and `ChecksumMismatch { expected: u32, actual: u32 }`.
3. Define an overarching `GatewayError` enum with variants: `Storage(StorageError)`, `Protocol(ProtocolError)`, and `Unauthorized { client_id: String }`.
4. Implement `std::fmt::Display` and `std::error::Error` for all three error types. Ensure `GatewayError::source()` delegates down to `StorageError` or `ProtocolError`, and `StorageError::source()` delegates down to `std::io::Error`.
5. Implement `From` trait conversions (`From<StorageError>`, `From<ProtocolError>`, and `From<std::io::Error>`) for `GatewayError` to enable ergonomic `?` operator propagation.
6. Write a packet-processing function `process_packet(client_id: &str, raw_bytes: &[u8]) -> Result<u64, GatewayError>` that validates client authorization, header bytes, checksums, and record bounds.
7. Include unit tests asserting error text formatting, nested `source()` unwrapping across layers, transparent `?` conversions, and `matches!` pattern matching.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::fmt;
> use std::error::Error;
> 
> #[derive(Debug)]
> pub enum StorageError {
>     NotFound { record_id: u64 },
>     CapacityExceeded { limit: usize, current: usize },
>     Io(std::io::Error),
> }
> 
> impl fmt::Display for StorageError {
>     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
>         match self {
>             StorageError::NotFound { record_id } => {
>                 write!(f, "Storage error: record ID {} not found", record_id)
>             }
>             StorageError::CapacityExceeded { limit, current } => {
>                 write!(
>                     f,
>                     "Storage capacity exceeded: current {} exceeds limit {}",
>                     current, limit
>                 )
>             }
>             StorageError::Io(err) => write!(f, "Storage I/O failure: {}", err),
>         }
>     }
> }
> 
> impl Error for StorageError {
>     fn source(&self) -> Option<&(dyn Error + 'static)> {
>         match self {
>             StorageError::Io(err) => Some(err),
>             _ => None,
>         }
>     }
> }
> 
> impl From<std::io::Error> for StorageError {
>     fn from(err: std::io::Error) -> Self {
>         StorageError::Io(err)
>     }
> }
> 
> #[derive(Debug)]
> pub enum ProtocolError {
>     InvalidHeader { byte: u8 },
>     ChecksumMismatch { expected: u32, actual: u32 },
> }
> 
> impl fmt::Display for ProtocolError {
>     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
>         match self {
>             ProtocolError::InvalidHeader { byte } => {
>                 write!(f, "Protocol error: invalid header byte 0x{:02X}", byte)
>             }
>             ProtocolError::ChecksumMismatch { expected, actual } => {
>                 write!(
>                     f,
>                     "Protocol error: checksum mismatch (expected 0x{:08X}, got 0x{:08X})",
>                     expected, actual
>                 )
>             }
>         }
>     }
> }
> 
> impl Error for ProtocolError {}
> 
> #[derive(Debug)]
> pub enum GatewayError {
>     Storage(StorageError),
>     Protocol(ProtocolError),
>     Unauthorized { client_id: String },
> }
> 
> impl fmt::Display for GatewayError {
>     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
>         match self {
>             GatewayError::Storage(err) => write!(f, "Gateway storage fault: {}", err),
>             GatewayError::Protocol(err) => write!(f, "Gateway protocol fault: {}", err),
>             GatewayError::Unauthorized { client_id } => {
>                 write!(f, "Gateway security failure: unauthorized client '{}'", client_id)
>             }
>         }
>     }
> }
> 
> impl Error for GatewayError {
>     fn source(&self) -> Option<&(dyn Error + 'static)> {
>         match self {
>             GatewayError::Storage(err) => Some(err),
>             GatewayError::Protocol(err) => Some(err),
>             GatewayError::Unauthorized { .. } => None,
>         }
>     }
> }
> 
> impl From<StorageError> for GatewayError {
>     fn from(err: StorageError) -> Self {
>         GatewayError::Storage(err)
>     }
> }
> 
> impl From<ProtocolError> for GatewayError {
>     fn from(err: ProtocolError) -> Self {
>         GatewayError::Protocol(err)
>     }
> }
> 
> impl From<std::io::Error> for GatewayError {
>     fn from(err: std::io::Error) -> Self {
>         GatewayError::Storage(StorageError::Io(err))
>     }
> }
> 
> pub fn process_packet(client_id: &str, raw_bytes: &[u8]) -> Result<u64, GatewayError> {
>     if client_id.is_empty() || client_id == "anonymous" {
>         return Err(GatewayError::Unauthorized {
>             client_id: client_id.to_string(),
>         });
>     }
> 
>     if raw_bytes.is_empty() {
>         return Err(GatewayError::Protocol(ProtocolError::InvalidHeader { byte: 0 }));
>     }
> 
>     if raw_bytes[0] != 0xAA {
>         return Err(ProtocolError::InvalidHeader { byte: raw_bytes[0] }.into());
>     }
> 
>     if raw_bytes.len() < 5 {
>         return Err(StorageError::CapacityExceeded {
>             limit: 5,
>             current: raw_bytes.len(),
>         }.into());
>     }
> 
>     let payload_checksum = raw_bytes[1] as u32;
>     let expected_checksum = raw_bytes[2] as u32;
>     if payload_checksum != expected_checksum {
>         return Err(GatewayError::from(ProtocolError::ChecksumMismatch {
>             expected: expected_checksum,
>             actual: payload_checksum,
>         }));
>     }
> 
>     let record_id = ((raw_bytes[3] as u64) << 8) | (raw_bytes[4] as u64);
>     if record_id == 0 {
>         return Err(StorageError::NotFound { record_id: 0 }.into());
>     }
> 
>     Ok(record_id)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_unauthorized_client() {
>         let result = process_packet("anonymous", &[0xAA, 1, 1, 0, 42]);
>         assert!(result.is_err());
>         let err = result.unwrap_err();
>         assert!(matches!(err, GatewayError::Unauthorized { .. }));
>         assert_eq!(
>             err.to_string(),
>             "Gateway security failure: unauthorized client 'anonymous'"
>         );
>         assert!(err.source().is_none());
>     }
> 
>     #[test]
>     fn test_invalid_header_protocol_error() {
>         let result = process_packet("client_123", &[0xFF, 1, 1, 0, 42]);
>         assert!(result.is_err());
>         let err = result.unwrap_err();
>         assert!(matches!(err, GatewayError::Protocol(ProtocolError::InvalidHeader { byte: 0xFF })));
>         assert_ne!(err.to_string(), "");
>         
>         let source = err.source().expect("Expected underlying protocol error source");
>         assert_eq!(
>             source.to_string(),
>             "Protocol error: invalid header byte 0xFF"
>         );
>     }
> 
>     #[test]
>     fn test_storage_capacity_exceeded_from_conversion() {
>         let result = process_packet("client_123", &[0xAA, 1, 1]);
>         assert!(result.is_err());
>         let err = result.unwrap_err();
>         assert!(matches!(
>             err,
>             GatewayError::Storage(StorageError::CapacityExceeded { limit: 5, current: 3 })
>         ));
>     }
> 
>     #[test]
>     fn test_successful_packet_processing() {
>         let result = process_packet("client_123", &[0xAA, 0x05, 0x05, 0x01, 0x00]);
>         assert!(result.is_ok());
>         assert_eq!(result.unwrap(), 256);
>     }
> 
>     #[test]
>     fn test_io_error_nested_chaining() {
>         let io_err = std::io::Error::new(std::io::ErrorKind::ConnectionReset, "connection lost");
>         let gateway_err: GatewayError = io_err.into();
>         assert!(matches!(gateway_err, GatewayError::Storage(StorageError::Io(_))));
>         
>         let storage_src = gateway_err.source().expect("First layer source should exist");
>         assert_eq!(storage_src.to_string(), "Storage I/O failure: connection lost");
>         
>         let nested_io_src = storage_src.source().expect("Second layer nested I/O source should exist");
>         assert_eq!(nested_io_src.to_string(), "connection lost");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Multi-Tier Error Hierarchy**: Large software systems partition domain errors by subsystem (`ProtocolError`, `StorageError`) and aggregate them into top-level container errors (`GatewayError`). This enforces domain separation while giving API consumers fine-grained recovery options.
> 2. **Trait Invariants & Causal Chaining**: Implementing `std::error::Error::source(&self)` returns `Option<&(dyn Error + 'static)>`. Returning `Some(err)` enables cause chain traversal (e.g. via `err.source()`), allowing logging infrastructure or reporting tools to walk back to root causes like `std::io::Error`.
> 3. **Implicit Conversion via `From` & `?`**: Implementing `From<SubError> for GatewayError` allows the `?` operator to perform zero-cost implicit conversions. When `process_packet` returns `Err(StorageError::...)`, `?` invokes `From::from` to wrap it seamlessly into `GatewayError::Storage`.
> 4. **Dynamic Dispatch & Lifetime Bound `'static`**: Trait objects returned by `source()` carry a lifetime bound of `'static`. This enables safe downcasting at runtime via `.downcast_ref::<TargetType>()` without running into lifetime ambiguity or dangling references.
> 5. **Memory Layout & Zero-Cost Abstractions**: Enum discriminant tags and payload fields are compiled into tight memory structures. Matching on enum errors incurs zero runtime overhead compared to string allocation or dynamic exception throwing.

---

### Exercise 2: Contextual Rich Error Struct with Source Chaining & Thread Safety

**Problem Statement:**
In an algorithmic order execution engine, error reporting requires rich transaction metadata (such as order ID, failure category, retryability flags, and an optional underlying cause). Simple unit enums lack the capacity to attach dynamic metadata and nested cause chains across asynchronous execution boundaries.

Construct a production-ready struct-based error type:
1. Define an `OrderErrorKind` enum with variants: `InsufficientLiquidity { symbol: String, requested: u64, available: u64 }`, `AccountFrozen { account_id: String }`, `ExecutionTimeout { elapsed_ms: u64 }`, and `InternalFault`.
2. Define an `OrderError` struct containing `order_id: String`, `kind: OrderErrorKind`, `source: Option<Box<dyn Error + Send + Sync + 'static>>`, and `is_retryable: bool`.
3. Provide builder/constructor methods `new(order_id, kind, is_retryable)` and `with_source(self, source)`.
4. Implement `std::fmt::Display` to output formatted diagnostic summaries including the order ID and retry status.
5. Implement `std::error::Error` for `OrderError`, returning `self.source` as `Option<&(dyn Error + 'static)>`.
6. Write function `execute_trade(...) -> Result<(), OrderError>` simulating order execution and safety checks.
7. Include unit tests asserting retryability classification, metadata retention, dynamic `source()` downcasting to `std::io::Error`, and compiler verification of `Send + Sync` thread safety.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::fmt;
> use std::error::Error;
> 
> #[derive(Debug)]
> pub enum OrderErrorKind {
>     InsufficientLiquidity { symbol: String, requested: u64, available: u64 },
>     AccountFrozen { account_id: String },
>     ExecutionTimeout { elapsed_ms: u64 },
>     InternalFault,
> }
> 
> impl fmt::Display for OrderErrorKind {
>     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
>         match self {
>             OrderErrorKind::InsufficientLiquidity { symbol, requested, available } => {
>                 write!(
>                     f,
>                     "Insufficient liquidity for symbol '{}': requested {}, available {}",
>                     symbol, requested, available
>                 )
>             }
>             OrderErrorKind::AccountFrozen { account_id } => {
>                 write!(f, "Account '{}' is frozen", account_id)
>             }
>             OrderErrorKind::ExecutionTimeout { elapsed_ms } => {
>                 write!(f, "Execution timed out after {}ms", elapsed_ms)
>             }
>             OrderErrorKind::InternalFault => write!(f, "Internal transaction engine fault"),
>         }
>     }
> }
> 
> #[derive(Debug)]
> pub struct OrderError {
>     pub order_id: String,
>     pub kind: OrderErrorKind,
>     pub source: Option<Box<dyn Error + Send + Sync + 'static>>,
>     pub is_retryable: bool,
> }
> 
> impl OrderError {
>     pub fn new(order_id: impl Into<String>, kind: OrderErrorKind, is_retryable: bool) -> Self {
>         Self {
>             order_id: order_id.into(),
>             kind,
>             source: None,
>             is_retryable,
>         }
>     }
> 
>     pub fn with_source(
>         mut self,
>         source: impl Into<Box<dyn Error + Send + Sync + 'static>>,
>     ) -> Self {
>         self.source = Some(source.into());
>         self
>     }
> }
> 
> impl fmt::Display for OrderError {
>     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
>         write!(
>             f,
>             "[Order:{}] {} (retryable: {})",
>             self.order_id, self.kind, self.is_retryable
>         )
>     }
> }
> 
> impl Error for OrderError {
>     fn source(&self) -> Option<&(dyn Error + 'static)> {
>         self.source
>             .as_ref()
>             .map(|e| e.as_ref() as &(dyn Error + 'static))
>     }
> }
> 
> pub fn execute_trade(
>     order_id: &str,
>     account_id: &str,
>     symbol: &str,
>     amount: u64,
>     available_liquidity: u64,
>     is_account_active: bool,
> ) -> Result<(), OrderError> {
>     if !is_account_active {
>         return Err(OrderError::new(
>             order_id,
>             OrderErrorKind::AccountFrozen {
>                 account_id: account_id.to_string(),
>             },
>             false,
>         ));
>     }
> 
>     if amount > available_liquidity {
>         return Err(OrderError::new(
>             order_id,
>             OrderErrorKind::InsufficientLiquidity {
>                 symbol: symbol.to_string(),
>                 requested: amount,
>                 available: available_liquidity,
>             },
>             true,
>         ));
>     }
> 
>     Ok(())
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
>     use std::io;
> 
>     #[test]
>     fn test_account_frozen_non_retryable() {
>         let result = execute_trade("ORD-001", "ACC-99", "BTC-USD", 100, 500, false);
>         assert!(result.is_err());
>         let err = result.unwrap_err();
> 
>         assert_eq!(err.order_id, "ORD-001");
>         assert!(!err.is_retryable);
>         assert!(matches!(err.kind, OrderErrorKind::AccountFrozen { .. }));
>         assert_eq!(
>             err.to_string(),
>             "[Order:ORD-001] Account 'ACC-99' is frozen (retryable: false)"
>         );
>         assert!(err.source().is_none());
>     }
> 
>     #[test]
>     fn test_insufficient_liquidity_retryable() {
>         let result = execute_trade("ORD-002", "ACC-100", "ETH-USD", 50, 10, true);
>         assert!(result.is_err());
>         let err = result.unwrap_err();
> 
>         assert_eq!(err.order_id, "ORD-002");
>         assert!(err.is_retryable);
>         assert!(matches!(
>             err.kind,
>             OrderErrorKind::InsufficientLiquidity { ref symbol, requested: 50, available: 10 } if symbol == "ETH-USD"
>         ));
>         assert_ne!(err.to_string(), "");
>     }
> 
>     #[test]
>     fn test_source_chaining_and_downcasting() {
>         let io_err = io::Error::new(io::ErrorKind::TimedOut, "Network connection timed out");
>         let err = OrderError::new("ORD-003", OrderErrorKind::ExecutionTimeout { elapsed_ms: 5000 }, true)
>             .with_source(io_err);
> 
>         assert_eq!(err.order_id, "ORD-003");
>         assert!(err.source().is_some());
>         
>         let src = err.source().unwrap();
>         assert_eq!(src.to_string(), "Network connection timed out");
> 
>         // Test downcasting dynamically from dyn Error
>         let io_downcast = src.downcast_ref::<io::Error>();
>         assert!(io_downcast.is_some());
>         assert_eq!(io_downcast.unwrap().kind(), io::ErrorKind::TimedOut);
>     }
> 
>     #[test]
>     fn test_thread_safety_send_sync() {
>         fn assert_send_sync<T: Send + Sync>() {}
>         assert_send_sync::<OrderError>();
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Struct-Based Contextual Errors**: While `enum` custom errors excel at categorizing failure modes, `struct` error types allow attaching context (IDs, timestamps, telemetry flags) regardless of the underlying variant.
> 2. **Thread Safety with `Send + Sync + 'static`**: Trait objects stored in asynchronous or multi-threaded pipelines (e.g., Tokio or `std::thread`) must satisfy `Box<dyn Error + Send + Sync + 'static>`. `Send` permits transferring ownership across thread boundaries, `Sync` allows shared access across threads, and `'static` guarantees the error owns all its data without dangling references.
> 3. **Trait Object Downcasting**: The trait method `source(&self)` returns `Option<&(dyn Error + 'static)>`. Consumers can inspect lower-level causes at runtime using `.downcast_ref::<T>()`, allowing callers to extract specific operational errors (like `std::io::Error`) from opaque trait object wrappers.
> 4. **Builder Pattern Ergonomics**: Method chaining via `with_source(...)` allows callers to incrementally attach low-level root causes without polluting primary constructor signatures.

---

### Exercise 3: Dynamic Config Loader with Parsing & Validation Error Diagnostics

**Problem Statement:**
Applications often parse dynamic key-value configuration inputs where failures stem from missing required parameters, malformed numeric string values, invalid operational thresholds, or system I/O errors.

Build a complete configuration parsing error domain:
1. Define a `ConfigError` enum with variants: `Io(std::io::Error)`, `ParseInt { key: String, source: std::num::ParseIntError }`, `MissingKey(String)`, and `ValidationFailed { key: String, reason: String }`.
2. Implement `std::fmt::Display` providing detailed context for each variant.
3. Implement `std::error::Error` delegating to nested error sources for `Io` and `ParseInt`.
4. Implement `From<std::io::Error>` for `ConfigError`.
5. Add utility methods `is_fatal(&self) -> bool` (returning `true` for I/O and integer parse failures) and `key(&self) -> Option<&str>` to retrieve the offending key.
6. Implement `parse_and_validate_config(input: &str) -> Result<ServerConfig, ConfigError>` parsing key-value pairs (e.g. `port=8080`, `max_connections=1000`) and validating `port >= 1024` and `max_connections > 0`.
7. Write unit tests validating key extraction, fatal/non-fatal categorization, parse error source downcasting, validation threshold enforcement, and success cases.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::fmt;
> use std::error::Error;
> use std::num::ParseIntError;
> 
> #[derive(Debug)]
> pub enum ConfigError {
>     Io(std::io::Error),
>     ParseInt {
>         key: String,
>         source: ParseIntError,
>     },
>     MissingKey(String),
>     ValidationFailed {
>         key: String,
>         reason: String,
>     },
> }
> 
> impl fmt::Display for ConfigError {
>     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
>         match self {
>             ConfigError::Io(err) => write!(f, "Configuration I/O error: {}", err),
>             ConfigError::ParseInt { key, source } => write!(
>                 f,
>                 "Invalid integer configuration for key '{}': {}",
>                 key, source
>             ),
>             ConfigError::MissingKey(key) => {
>                 write!(f, "Required configuration key '{}' missing", key)
>             }
>             ConfigError::ValidationFailed { key, reason } => write!(
>                 f,
>                 "Configuration validation failed for key '{}': {}",
>                 key, reason
>             ),
>         }
>     }
> }
> 
> impl Error for ConfigError {
>     fn source(&self) -> Option<&(dyn Error + 'static)> {
>         match self {
>             ConfigError::Io(err) => Some(err),
>             ConfigError::ParseInt { source, .. } => Some(source),
>             ConfigError::MissingKey(_) | ConfigError::ValidationFailed { .. } => None,
>         }
>     }
> }
> 
> impl From<std::io::Error> for ConfigError {
>     fn from(err: std::io::Error) -> Self {
>         ConfigError::Io(err)
>     }
> }
> 
> impl ConfigError {
>     pub fn is_fatal(&self) -> bool {
>         matches!(self, ConfigError::Io(_) | ConfigError::ParseInt { .. })
>     }
> 
>     pub fn key(&self) -> Option<&str> {
>         match self {
>             ConfigError::Io(_) => None,
>             ConfigError::ParseInt { key, .. } => Some(key),
>             ConfigError::MissingKey(key) => Some(key),
>             ConfigError::ValidationFailed { key, .. } => Some(key),
>         }
>     }
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct ServerConfig {
>     pub port: u16,
>     pub max_connections: u32,
> }
> 
> pub fn parse_and_validate_config(input: &str) -> Result<ServerConfig, ConfigError> {
>     let mut port_val: Option<u16> = None;
>     let mut max_conn_val: Option<u32> = None;
> 
>     for line in input.lines() {
>         let line = line.trim();
>         if line.is_empty() || line.starts_with('#') {
>             continue;
>         }
> 
>         let mut parts = line.splitn(2, '=');
>         let key = parts.next().unwrap_or("").trim();
>         let value = parts.next().unwrap_or("").trim();
> 
>         match key {
>             "port" => {
>                 let parsed: u16 = value.parse().map_err(|err: ParseIntError| ConfigError::ParseInt {
>                     key: "port".to_string(),
>                     source: err,
>                 })?;
>                 port_val = Some(parsed);
>             }
>             "max_connections" => {
>                 let parsed: u32 = value.parse().map_err(|err: ParseIntError| ConfigError::ParseInt {
>                     key: "max_connections".to_string(),
>                     source: err,
>                 })?;
>                 max_conn_val = Some(parsed);
>             }
>             _ => {}
>         }
>     }
> 
>     let port = port_val.ok_or_else(|| ConfigError::MissingKey("port".to_string()))?;
>     let max_connections = max_conn_val.ok_or_else(|| ConfigError::MissingKey("max_connections".to_string()))?;
> 
>     if port < 1024 {
>         return Err(ConfigError::ValidationFailed {
>             key: "port".to_string(),
>             reason: format!("Port {} is restricted; must be >= 1024", port),
>         });
>     }
> 
>     if max_connections == 0 {
>         return Err(ConfigError::ValidationFailed {
>             key: "max_connections".to_string(),
>             reason: "Max connections cannot be zero".to_string(),
>         });
>     }
> 
>     Ok(ServerConfig { port, max_connections })
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_missing_key_error() {
>         let input = "port=8080";
>         let result = parse_and_validate_config(input);
>         assert!(result.is_err());
>         let err = result.unwrap_err();
> 
>         assert!(!err.is_fatal());
>         assert_eq!(err.key(), Some("max_connections"));
>         assert!(matches!(err, ConfigError::MissingKey(_)));
>         assert_eq!(err.to_string(), "Required configuration key 'max_connections' missing");
>     }
> 
>     #[test]
>     fn test_parse_int_error_fatal() {
>         let input = "port=not_a_number\nmax_connections=100";
>         let result = parse_and_validate_config(input);
>         assert!(result.is_err());
>         let err = result.unwrap_err();
> 
>         assert!(err.is_fatal());
>         assert_eq!(err.key(), Some("port"));
>         assert!(matches!(err, ConfigError::ParseInt { .. }));
>         
>         let source = err.source().expect("ParseInt error should have a source");
>         assert!(source.downcast_ref::<ParseIntError>().is_some());
>     }
> 
>     #[test]
>     fn test_validation_failed() {
>         let input = "port=80\nmax_connections=100";
>         let result = parse_and_validate_config(input);
>         assert!(result.is_err());
>         let err = result.unwrap_err();
> 
>         assert!(!err.is_fatal());
>         assert_eq!(err.key(), Some("port"));
>         assert!(matches!(err, ConfigError::ValidationFailed { .. }));
>         assert_ne!(err.to_string(), "");
>     }
> 
>     #[test]
>     fn test_valid_config() {
>         let input = "# Default settings\nport=8080\nmax_connections=1000\n";
>         let result = parse_and_validate_config(input);
>         assert!(result.is_ok());
>         let config = result.unwrap();
>         assert_eq!(config, ServerConfig { port: 8080, max_connections: 1000 });
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Domain Context Attachment**: Wrapping standard library errors (like `ParseIntError`) inside custom variants like `ConfigError::ParseInt { key, source }` solves the "missing context" problem—the caller receives not only *why* parsing failed, but *which parameter key* caused the failure.
> 2. **Delegating Causal Sources**: By returning `Some(source)` from `Error::source()` for `ParseInt`, tools like error loggers can extract the inner `ParseIntError` (e.g., "invalid digit found in string") alongside the application-level context string ("Invalid integer configuration for key 'port'").
> 3. **Non-Fatal Error Recovery Logic**: Exposing inspection helper methods like `is_fatal()` or `key()` allows upstream callers to make granular control flow decisions—such as applying default fallback values for non-fatal errors while aborting on fatal configuration errors.
> 4. **Zero Allocation Matching**: Pattern matching on `ConfigError` variants uses static type checking and zero runtime memory allocations, contrasting with string-parsing error systems.

---

## 6. Related Terms

- [`anyhow` / `thiserror`](../level_04/anyhow_thiserror.md) — The wildly popular crates that automatically write all the tedious `Display` and `Error` boilerplate for you!
- [`From` / `Into` Traits](../level_04/from_into_traits.md) — The secret sauce that allows us to automatically convert standard library errors (like `io::Error`) into our Custom Error Types.

---

## 7. Key Takeaways

- You should almost **never use `String`** as an error type in a real application.
- Custom Errors are usually defined using an `enum` so you can list all the exact, specific ways your function can fail.
- A good custom error allows the caller to `match` the error and run different, specific recovery logic for different failures.
- For your custom error to be fully idiomatic, it must implement the `Debug`, `Display`, and `std::error::Error` traits.
