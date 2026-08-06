# `anyhow` / `thiserror`

> **Level 4 — Error Handling & Generics**
> Popular crates: `anyhow` for application-level errors; `thiserror` for library error types.

---

## 1. Prerequisites


- [Custom Error Types](custom_error_types.md) — The boilerplate-heavy manual errors that these crates replace.
- [`From` / `Into` Traits](from_into_traits.md) — The conversion logic that these crates automate.
- [`?` Operator](question_mark_operator.md) — The tool used to propagate the errors these crates generate.

---

## 2. Term Category

**Rust-specific (the ecosystem standard)**: In Rust, the standard library provides the foundation for error handling, but the community has universally adopted these two third-party crates to remove boilerplate and make error handling joyful. They were both created by David Tolnay, a legendary Rust developer.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In the previous terms, we saw that creating a fully idiomatic Custom Error requires writing a massive amount of boilerplate. You have to implement `Debug`, implement `Display` (with a giant `match` statement), implement `std::error::Error`, and write a `From` implementation for *every single external error type* you want to automatically convert with `?`. 

Developers hated writing this. It slowed down development. To fix this forever, the community built two distinct tools:
1. **`thiserror`**: A macro that writes all the `Display`, `Error`, and `From` boilerplate for your custom `enum`s automatically.
2. **`anyhow`**: A magical `Result` type that can secretly hold *literally any error in the universe*, meaning you don't even have to write a custom enum at all!

### (2) Reality Metaphor

Imagine you run a commercial bakery. 

- **`thiserror` is the Customer Menu.** If you are selling to customers, you need a precise menu of exact cupcakes so customers know exactly what they are buying. `thiserror` automatically prints the precise labels for your custom variants. You use `thiserror` when writing **Libraries** because other developers (your customers) need to know exactly what errors your library returns so they can write recovery logic.
- **`anyhow` is the Manager's Incident Report.** In the back office, if a pipe bursts or the oven exploded, the manager doesn't care about a "precise enum menu" of failures. They just want a generic "Something went wrong: The oven exploded" report to log it and close the store. You use `anyhow` when writing **Applications** (executables) because you just want to catch *any* error, print it, and gracefully crash without spending time defining a thousand custom enums.

### (3) Rust Code Examples

#### The Application Way: `anyhow`
If you are writing an application (like a CLI tool or a web server backend), you just use `anyhow::Result`. It accepts **everything**.

```rust
use std::fs::File;
// Notice we import the special Result from anyhow
use anyhow::{Result, Context}; 

// We don't define any custom enums! We just return anyhow::Result.
fn read_config() -> Result<String> {
    // 1. We use ? on an io::Error. anyhow accepts it perfectly!
    let _file = File::open("config.txt")
        // 2. We can attach human-readable context to the error easily!
        .context("Failed to open the critical config.txt file")?; 

    // 3. We use ? on a parsing Error. anyhow accepts that perfectly too!
    let number: i32 = "not_a_number".parse()?; 
    
    Ok("Success".to_string())
}
```

#### The Library Way: `thiserror`
If you are writing a library for others to use, you must provide precise enums. `thiserror` writes all the boilerplate for you using the `#[derive(Error)]` macro.

```rust
use thiserror::Error;
use std::io;

// The macro writes the Display, Error, and From boilerplate for us!
#[derive(Error, Debug)]
pub enum MyLibError {
    // We define how this variant is displayed using #[error("...")]
    #[error("The database at {0} could not be reached.")]
    DatabaseOffline(String),
    
    // #[from] tells the macro to automatically write `impl From<io::Error> for MyLibError`!
    #[error("File system error occurred.")]
    FileSystemError(#[from] io::Error),
}

fn open_lib_file() -> Result<(), MyLibError> {
    // The ? operator works magically because `thiserror` wrote the `From` implementation!
    let _file = std::fs::File::open("lib_data.txt")?;
    Ok(())
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Anyhow Thiserror Scoping and Lifecycle Rules

**The mistake:** Assuming Anyhow Thiserror instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("anyhow_thiserror_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("anyhow_thiserror_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Anyhow Thiserror State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Anyhow Thiserror through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Anyhow Thiserror Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Anyhow Thiserror instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Production Library Domain Error Taxonomy (`thiserror` Pattern)

**Scenario:**
You are developing a core storage engine crate (`storage_engine`) used across distributed database microservices. Library callers require a strongly-typed, zero-cost error hierarchy `StorageError` that enables precise, programmatic match-based recovery while adhering strictly to `std::error::Error` trait conventions.

Design and implement `StorageError` featuring:
1. Strongly-typed enum variants:
   - `NotFound { key: String, partition: u32 }`
   - `Io(std::io::Error)`
   - `Serialization { reason: String }`
   - `CapacityExhausted { limit: usize, requested: usize }`
2. Full `std::fmt::Display` formatting adhering to `thiserror` display string interpolation patterns (`#[error("...")]`):
   - `NotFound`: `"Key '{key}' not found in storage partition {partition}"`
   - `Io`: `"Underlying IO storage failure"`
   - `Serialization`: `"Serialization error: {reason}"`
   - `CapacityExhausted`: `"Storage capacity exceeded: requested {requested} bytes, limit is {limit} bytes"`
3. Proper `std::error::Error` implementation with `source()` support returning `Some(err)` for underlying IO failures.
4. Automatic `From<std::io::Error>` conversion implementation for frictionless `?` operator propagation.
5. Domain inspection helper methods `is_not_found()` and `is_io_error()`.
6. Full unit tests inside `#[cfg(test)] mod tests` using `assert_eq!`, `assert!`, `assert_ne!`, and `matches!`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::error::Error;
> use std::fmt;
> use std::io;
> 
> #[derive(Debug)]
> pub enum StorageError {
>     NotFound { key: String, partition: u32 },
>     Io(io::Error),
>     Serialization { reason: String },
>     CapacityExhausted { limit: usize, requested: usize },
> }
> 
> impl fmt::Display for StorageError {
>     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
>         match self {
>             StorageError::NotFound { key, partition } => {
>                 write!(f, "Key '{key}' not found in storage partition {partition}")
>             }
>             StorageError::Io(_err) => {
>                 write!(f, "Underlying IO storage failure")
>             }
>             StorageError::Serialization { reason } => {
>                 write!(f, "Serialization error: {reason}")
>             }
>             StorageError::CapacityExhausted { limit, requested } => {
>                 write!(
>                     f,
>                     "Storage capacity exceeded: requested {requested} bytes, limit is {limit} bytes"
>                 )
>             }
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
> impl From<io::Error> for StorageError {
>     fn from(err: io::Error) -> Self {
>         StorageError::Io(err)
>     }
> }
> 
> impl StorageError {
>     pub fn is_not_found(&self) -> bool {
>         matches!(self, StorageError::NotFound { .. })
>     }
> 
>     pub fn is_io_error(&self) -> bool {
>         matches!(self, StorageError::Io(_))
>     }
> }
> 
> pub fn read_partition_record(key: &str, partition: u32) -> Result<Vec<u8>, StorageError> {
>     if key.is_empty() {
>         return Err(StorageError::NotFound {
>             key: key.to_string(),
>             partition,
>         });
>     }
>     if partition > 100 {
>         let io_err = io::Error::new(io::ErrorKind::ConnectionRefused, "Partition offline");
>         return Err(StorageError::from(io_err));
>     }
>     Ok(vec![1, 2, 3, 4])
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_not_found_formatting_and_helpers() {
>         let err = StorageError::NotFound {
>             key: "usr_99".to_string(),
>             partition: 4,
>         };
>         assert_eq!(
>             err.to_string(),
>             "Key 'usr_99' not found in storage partition 4"
>         );
>         assert!(err.is_not_found());
>         assert_ne!(err.is_io_error(), true);
>         assert!(matches!(err, StorageError::NotFound { .. }));
>         assert!(err.source().is_none());
>     }
> 
>     #[test]
>     fn test_io_error_source_chaining_and_from() {
>         let io_err = io::Error::new(io::ErrorKind::PermissionDenied, "Access denied");
>         let storage_err: StorageError = io_err.into();
> 
>         assert!(storage_err.is_io_error());
>         assert_eq!(storage_err.is_not_found(), false);
>         assert!(matches!(storage_err, StorageError::Io(_)));
> 
>         let source = storage_err.source().expect("Should have source");
>         assert_eq!(source.to_string(), "Access denied");
>     }
> 
>     #[test]
>     fn test_read_partition_record() {
>         let ok_res = read_partition_record("valid_key", 10);
>         assert!(ok_res.is_ok());
>         assert_eq!(ok_res.unwrap(), vec![1, 2, 3, 4]);
> 
>         let err_res = read_partition_record("", 5);
>         assert!(err_res.is_err());
>         let err = err_res.unwrap_err();
>         assert!(matches!(err, StorageError::NotFound { .. }));
>         assert_ne!(err.to_string(), "");
>     }
> }
> ```
>
> #### Technical Explanation
>
>
>
>
> 1. **`thiserror` Procedural Macro Mechanics**:
>    - In crate libraries, `thiserror::Error` procedural derive macro automates standard trait code generation at compile time without any runtime performance overhead.
>    - The attribute `#[error("...")]` auto-generates the `fmt::Display` implementation using standard `write!(f, ...)` formatting routines.
>    - The attribute `#[from]` auto-generates `impl From<io::Error> for StorageError`, enabling seamless operator sugar (`?`) propagation from standard library IO calls directly into domain errors.
>
> 2. **Trait Invariants and `source()` Chaining**:
>    - `std::error::Error::source()` returns an `Option<&(dyn Error + 'static)>`. Returning `Some(err)` for the `Io` variant allows error reporters, observability framework loggers, and diagnostic tools to traverse the causational error backtrace tree across crate boundaries.
>    - The static lifetime `'static` bound on `dyn Error + 'static` guarantees that the underlying error source contains no short-lived borrowing references, ensuring it remains valid for dynamic inspection.
>
> 3. **Exhaustive Matching & Library Ergonomics**:
>    - By defining typed enum variants rather than returning generic strings, callers retain full compile-time exhaustive match capability (`match err { StorageError::NotFound { .. } => ..., StorageError::Io(e) => ... }`).
>    - Helper methods (`is_not_found()`, `is_io_error()`) encapsulate common inspection logic without forcing caller code to import internal variant namespaces or construct verbose pattern matches.
>
> 4. **Memory Layout and Monomorphization**:
>    - Enum-based error taxonomy provides zero-cost static dispatch. Disk space and memory alignment equal the largest variant's payload plus discriminant tag byte(s), avoiding unnecessary heap allocation unless an underlying variant (e.g. `io::Error`) explicitly allocates internally.
> 
---

### Exercise 2: Application Context Propagation Pipeline (`anyhow` Pattern)

**Scenario:**
When developing application binaries (CLI microservices, ETL pipelines), creating distinct enum variants for every transient parsing or configuration failure is unproductive. Applications require context-rich error propagation that wraps arbitrary lower-level errors (`std::io::Error`, `ParseIntError`) while accumulating diagnostic application context as errors bubble up the stack frame.

Implement an application context pipeline featuring:
1. An `AnyhowError` container type wrapping a type-erased thread-safe error trait object (`Box<dyn std::error::Error + Send + Sync + 'static>`) along with an ordered stack of contextual string diagnostics (`context_chain: Vec<String>`).
2. A generic extension trait `ContextExt<T>` exposing `.context(msg)` and `.with_context(closure)` for `Result<T, E>`.
3. `Display` implementation for `AnyhowError` that formats the top-level context followed by all parent cause context layers and root-cause error descriptions.
4. A production function `load_service_config(input_str: &str, path: &str) -> Result<u16, AnyhowError>` demonstrating contextual error enrichment during service initialization.
5. Comprehensive unit tests inside `#[cfg(test)] mod tests` using `assert_eq!`, `assert!`, `assert_ne!`, and `matches!`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::error::Error;
> use std::fmt;
> use std::io;
> use std::num::ParseIntError;
> 
> #[derive(Debug)]
> pub struct AnyhowError {
>     inner: Box<dyn Error + Send + Sync + 'static>,
>     context_chain: Vec<String>,
> }
> 
> impl AnyhowError {
>     pub fn new<E>(err: E) -> Self
>     where
>         E: Error + Send + Sync + 'static,
>     {
>         Self {
>             inner: Box::new(err),
>             context_chain: Vec::new(),
>         }
>     }
> 
>     pub fn context<S: Into<String>>(mut self, msg: S) -> Self {
>         self.context_chain.push(msg.into());
>         self
>     }
> 
>     pub fn context_chain(&self) -> &[String] {
>         &self.context_chain
>     }
> 
>     pub fn root_cause(&self) -> &(dyn Error + Send + Sync + 'static) {
>         &*self.inner
>     }
> }
> 
> impl fmt::Display for AnyhowError {
>     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
>         if let Some(top) = self.context_chain.last() {
>             write!(f, "{}", top)?;
>             for ctx in self.context_chain.iter().rev().skip(1) {
>                 write!(f, "\n  caused by: {}", ctx)?;
>             }
>             write!(f, "\n  root cause: {}", self.inner)?;
>         } else {
>             write!(f, "{}", self.inner)?;
>         }
>         Ok(())
>     }
> }
> 
> impl Error for AnyhowError {
>     fn source(&self) -> Option<&(dyn Error + 'static)> {
>         Some(&*self.inner)
>     }
> }
> 
> pub trait ContextExt<T> {
>     fn context<S: Into<String>>(self, msg: S) -> Result<T, AnyhowError>;
>     fn with_context<F, S>(self, f: F) -> Result<T, AnyhowError>
>     where
>         F: FnOnce() -> S,
>         S: Into<String>;
> }
> 
> impl<T, E> ContextExt<T> for Result<T, E>
> where
>     E: Error + Send + Sync + 'static,
> {
>     fn context<S: Into<String>>(self, msg: S) -> Result<T, AnyhowError> {
>         self.map_err(|err| AnyhowError::new(err).context(msg))
>     }
> 
>     fn with_context<F, S>(self, f: F) -> Result<T, AnyhowError>
>     where
>         F: FnOnce() -> S,
>         S: Into<String>,
>     {
>         self.map_err(|err| AnyhowError::new(err).context(f()))
>     }
> }
> 
> impl<T> ContextExt<T> for Result<T, AnyhowError> {
>     fn context<S: Into<String>>(self, msg: S) -> Result<T, AnyhowError> {
>         self.map_err(|err| err.context(msg))
>     }
> 
>     fn with_context<F, S>(self, f: F) -> Result<T, AnyhowError>
>     where
>         F: FnOnce() -> S,
>         S: Into<String>,
>     {
>         self.map_err(|err| err.context(f()))
>     }
> }
> 
> pub fn parse_port_raw(input: &str) -> Result<u16, ParseIntError> {
>     input.parse::<u16>()
> }
> 
> pub fn load_service_config(input_str: &str, path: &str) -> Result<u16, AnyhowError> {
>     let port = parse_port_raw(input_str)
>         .with_context(|| format!("Failed to parse port integer from content in '{path}'"))
>         .context("Failed to load microservice network configuration")?;
> 
>     if port < 1024 {
>         return Err(AnyhowError::new(io::Error::new(
>             io::ErrorKind::PermissionDenied,
>             "Privileged port numbers (< 1024) are prohibited",
>         ))
>         .context(format!("Invalid port {port} specified in '{path}'"))
>         .context("Failed to load microservice network configuration"));
>     }
> 
>     Ok(port)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_context_accumulation_and_formatting() {
>         let res = load_service_config("invalid_port", "/etc/app.conf");
>         assert!(res.is_err());
> 
>         let err = res.unwrap_err();
>         assert_eq!(err.context_chain().len(), 2);
>         assert_eq!(
>             err.context_chain()[0],
>             "Failed to parse port integer from content in '/etc/app.conf'"
>         );
>         assert_eq!(
>             err.context_chain()[1],
>             "Failed to load microservice network configuration"
>         );
> 
>         let formatted = err.to_string();
>         assert!(formatted.contains("Failed to load microservice network configuration"));
>         assert!(formatted.contains("caused by: Failed to parse port integer from content in '/etc/app.conf'"));
>         assert!(formatted.contains("root cause: invalid digit found in string"));
> 
>         assert_ne!(formatted, "");
>         assert!(matches!(err.root_cause().downcast_ref::<ParseIntError>(), Some(_)));
>     }
> 
>     #[test]
>     fn test_privileged_port_failure() {
>         let res = load_service_config("80", "/etc/app.conf");
>         assert!(res.is_err());
> 
>         let err = res.unwrap_err();
>         assert_eq!(
>             err.context_chain()[0],
>             "Invalid port 80 specified in '/etc/app.conf'"
>         );
>         assert!(matches!(err.root_cause().downcast_ref::<io::Error>(), Some(_)));
>         assert_ne!(err.context_chain().len(), 0);
>     }
> 
>     #[test]
>     fn test_valid_config_loading() {
>         let res = load_service_config("8080", "/etc/app.conf");
>         assert!(res.is_ok());
>         assert_eq!(res.unwrap(), 8080);
>         assert_ne!(8080, 0);
>     }
> }
> ```
>
> #### Technical Explanation
>
>
>
>
> 1. **Dynamic Error Type Erasure (`Box<dyn Error + Send + Sync + 'static>`)**:
>    - `anyhow::Error` uses a single pointer-sized trait object container on the heap (`Box<dyn Error + Send + Sync + 'static>`).
>    - The `Send + Sync` auto-trait bounds ensure that the error instance can safely cross OS thread boundaries and be shared between async worker tasks (`tokio::spawn`).
>    - The `'static` lifetime bound enforces that the inner error owns all its data and contains no references to stack variables whose lifetime might end before the error is handled.
>
> 2. **Context Stack Architecture vs Simple Error Mapping**:
>    - Standard `.map_err()` operations often discard lower-level failure details or convert errors into raw un-structured strings (`String`).
>    - The `.context()` / `.with_context()` pattern wraps the underlying error into an accumulative stack tree. As errors unwind through deep function call chains, each layer decorates the error with high-level domain intent ("Failed to load network configuration") without losing the root diagnostic ("invalid digit found in string").
>
> 3. **Lazy Context Evaluation via Closures (`with_context`)**:
>    - `.context(msg)` evaluates its argument eagerly, allocating heap memory for formatted `String` objects even when the `Result` is `Ok`.
>    - `.with_context(|| format!(...))` accepts a `FnOnce() -> S` closure. Rust's compiler optimizes this closure so string formatting and heap allocations are strictly deferred until the `Err` variant is encountered on cold execution paths.
>
> 4. **Dynamic Downcasting via Vtable Reflection**:
>    - Calling `.downcast_ref::<ParseIntError>()` delegates to `std::any::TypeId` metadata embedded in the trait object vtable.
>    - This allows application code to print type-erased errors in main logging handlers while still allowing telemetry filters to inspect specific underlying error types dynamically.
> 
---

### Exercise 3: Dynamic Dispatch vs Static Dispatch Architecture (Library-to-Application Boundary Bridge)

**Scenario:**
Production Rust architectures follow a clear separation of concerns: underlying library crates emit strongly-typed `thiserror` error enums for internal monomorphization efficiency, while application service boundaries catch these library errors, decorate them with domain context, and type-erase them into `anyhow` trait object containers.

Implement a library-to-application error handling boundary:
1. A database library module exposing a strongly-typed `DatabaseError` enum (`ConnectionFailed`, `QueryTimeout`, `ConstraintViolation`).
2. An application business layer function `process_user_payment(user_id: u64, amount_cents: u64)` that invokes library database operations, converts typed database errors into an application `BoundaryError` (erased `anyhow`-style context error), and evaluates business constraints (e.g. `BusinessLogicError` for insufficient funds).
3. A telemetry audit function `audit_error_severity(err: &BoundaryError) -> &'static str` that uses `downcast_ref` reflection on the underlying erased error to inspect whether the root cause was `DatabaseError::ConnectionFailed` (returns `"CRITICAL_ALERT"`), `DatabaseError::QueryTimeout` (returns `"WARNING_RETRY"`), or `BusinessLogicError` (returns `"INFO_USER"`).
4. Full unit tests in `#[cfg(test)] mod tests` using `assert_eq!`, `assert!`, `assert_ne!`, and `matches!`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::error::Error;
> use std::fmt;
> 
> #[derive(Debug)]
> pub enum DatabaseError {
>     ConnectionFailed { endpoint: String },
>     QueryTimeout { timeout_ms: u64 },
>     ConstraintViolation { table: String, column: String },
> }
> 
> impl fmt::Display for DatabaseError {
>     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
>         match self {
>             DatabaseError::ConnectionFailed { endpoint } => {
>                 write!(f, "Failed to connect to database endpoint at '{endpoint}'")
>             }
>             DatabaseError::QueryTimeout { timeout_ms } => {
>                 write!(f, "Database query timed out after {timeout_ms} ms")
>             }
>             DatabaseError::ConstraintViolation { table, column } => {
>                 write!(
>                     f,
>                     "Database constraint violation on table '{table}', column '{column}'"
>                 )
>             }
>         }
>     }
> }
> 
> impl Error for DatabaseError {}
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct UserAccount {
>     pub id: u64,
>     pub balance_cents: u64,
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct PaymentReceipt {
>     pub transaction_id: String,
>     pub amount_cents: u64,
>     pub remaining_balance: u64,
> }
> 
> pub fn query_user_account(user_id: u64) -> Result<UserAccount, DatabaseError> {
>     match user_id {
>         0 => Err(DatabaseError::ConnectionFailed {
>             endpoint: "db-primary.internal:5432".to_string(),
>         }),
>         999 => Err(DatabaseError::QueryTimeout { timeout_ms: 2500 }),
>         100 => Ok(UserAccount {
>             id: 100,
>             balance_cents: 5000,
>         }),
>         _ => Err(DatabaseError::ConstraintViolation {
>             table: "users".to_string(),
>             column: "id".to_string(),
>         }),
>     }
> }
> 
> #[derive(Debug)]
> pub struct BoundaryError {
>     inner: Box<dyn Error + Send + Sync + 'static>,
>     context: String,
> }
> 
> impl BoundaryError {
>     pub fn new<E: Error + Send + Sync + 'static>(err: E, context: String) -> Self {
>         Self {
>             inner: Box::new(err),
>             context,
>         }
>     }
> 
>     pub fn root_cause(&self) -> &(dyn Error + Send + Sync + 'static) {
>         &*self.inner
>     }
> 
>     pub fn context(&self) -> &str {
>         &self.context
>     }
> }
> 
> impl fmt::Display for BoundaryError {
>     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
>         write!(f, "{}: {}", self.context, self.inner)
>     }
> }
> 
> impl Error for BoundaryError {
>     fn source(&self) -> Option<&(dyn Error + 'static)> {
>         Some(&*self.inner)
>     }
> }
> 
> #[derive(Debug)]
> pub struct BusinessLogicError {
>     pub message: String,
> }
> 
> impl fmt::Display for BusinessLogicError {
>     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
>         write!(f, "Business logic error: {}", self.message)
>     }
> }
> 
> impl Error for BusinessLogicError {}
> 
> pub fn process_user_payment(user_id: u64, amount_cents: u64) -> Result<PaymentReceipt, BoundaryError> {
>     let account = query_user_account(user_id).map_err(|db_err| {
>         BoundaryError::new(
>             db_err,
>             format!("Payment processing aborted for user ID {user_id}"),
>         )
>     })?;
> 
>     if account.balance_cents < amount_cents {
>         let biz_err = BusinessLogicError {
>             message: format!(
>                 "Insufficient funds: account balance {} cents is less than charge {} cents",
>                 account.balance_cents, amount_cents
>             ),
>         };
>         return Err(BoundaryError::new(
>             biz_err,
>             format!("Payment authorization failed for user ID {user_id}"),
>         ));
>     }
> 
>     Ok(PaymentReceipt {
>         transaction_id: format!("tx_{user_id}_{amount_cents}"),
>         amount_cents,
>         remaining_balance: account.balance_cents - amount_cents,
>     })
> }
> 
> pub fn audit_error_severity(err: &BoundaryError) -> &'static str {
>     if let Some(db_err) = err.root_cause().downcast_ref::<DatabaseError>() {
>         match db_err {
>             DatabaseError::ConnectionFailed { .. } => "CRITICAL_ALERT",
>             DatabaseError::QueryTimeout { .. } => "WARNING_RETRY",
>             DatabaseError::ConstraintViolation { .. } => "ERROR_LOG",
>         }
>     } else if let Some(_biz_err) = err.root_cause().downcast_ref::<BusinessLogicError>() {
>         "INFO_USER"
>     } else {
>         "UNKNOWN_ERROR"
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_successful_payment_processing() {
>         let receipt = process_user_payment(100, 2000).expect("Payment should succeed");
>         assert_eq!(
>             receipt,
>             PaymentReceipt {
>                 transaction_id: "tx_100_2000".to_string(),
>                 amount_cents: 2000,
>                 remaining_balance: 3000,
>             }
>         );
>         assert_ne!(receipt.remaining_balance, 5000);
>         assert!(receipt.amount_cents > 0);
>     }
> 
>     #[test]
>     fn test_connection_failure_downcasting_and_severity() {
>         let res = process_user_payment(0, 1000);
>         assert!(res.is_err());
> 
>         let err = res.unwrap_err();
>         assert_eq!(
>             err.context(),
>             "Payment processing aborted for user ID 0"
>         );
>         assert!(matches!(
>             err.root_cause().downcast_ref::<DatabaseError>(),
>             Some(DatabaseError::ConnectionFailed { .. })
>         ));
> 
>         let severity = audit_error_severity(&err);
>         assert_eq!(severity, "CRITICAL_ALERT");
>         assert_ne!(severity, "INFO_USER");
>     }
> 
>     #[test]
>     fn test_timeout_failure_severity() {
>         let res = process_user_payment(999, 1000);
>         assert!(res.is_err());
> 
>         let err = res.unwrap_err();
>         assert!(matches!(
>             err.root_cause().downcast_ref::<DatabaseError>(),
>             Some(DatabaseError::QueryTimeout { .. })
>         ));
> 
>         let severity = audit_error_severity(&err);
>         assert_eq!(severity, "WARNING_RETRY");
>     }
> 
>     #[test]
>     fn test_insufficient_funds_business_error() {
>         let res = process_user_payment(100, 99999);
>         assert!(res.is_err());
> 
>         let err = res.unwrap_err();
>         assert!(matches!(
>             err.root_cause().downcast_ref::<BusinessLogicError>(),
>             Some(_)
>         ));
> 
>         let severity = audit_error_severity(&err);
>         assert_eq!(severity, "INFO_USER");
>         assert_ne!(severity, "CRITICAL_ALERT");
>     }
> }
> ```
>
> #### Technical Explanation
>
>
>
>
> 1. **Static Dispatch vs Dynamic Dispatch Architectural Boundary**:
>    - In library code (`query_user_account`), static dispatch via `thiserror`-pattern enums ensures that library operations produce zero heap allocation overhead, monomorphize efficiently, and enforce compile-time error handling.
>    - At application boundaries (`process_user_payment`), heterogeneous error types (`DatabaseError`, `BusinessLogicError`, `io::Error`) are unified into a single type-erased return signature (`Result<T, anyhow::Error>`). This prevents application signatures from turning into bloated nested generic error types.
> 
> 2. **Runtime Type Inspection via `downcast_ref`**:
>    - Type erasure with `Box<dyn Error + Send + Sync + 'static>` does not permanently destroy concrete type information.
>    - The function `err.root_cause().downcast_ref::<DatabaseError>()` queries the vtable's embedded `std::any::TypeId`. If the dynamic type matches `DatabaseError`, Rust safely re-constitutes a borrowed reference `&DatabaseError`, enabling targeted variant inspectability for metric classification ("CRITICAL_ALERT" vs "WARNING_RETRY") without breaking global abstraction boundaries.
> 
> 3. **Ownership and Lifetime Constraints**:
>    - The `'static` bound on `Box<dyn Error + Send + Sync + 'static>` guarantees that all owned fields inside `DatabaseError` or `BusinessLogicError` live for the entire duration of the application binary process, preventing dangling references when passed across asynchronous threads or task channels.
> 
> 4. **Edge Cases and Defensive Error Handling**:
>    - If an error is wrapped multiple times or erased into a raw `String`, downcasting directly to `DatabaseError` returns `None`. Designing structured error boundary objects preserves the inner `source()` chain so diagnostic tools and severity auditors can recursively inspect parent causes.
> 
---

## 6. Related Terms


- [Custom Error Types](custom_error_types.md) — What `thiserror` is automating behind the scenes.
- [`std::error::Error` Trait & `Box<dyn Error>`](error_trait_box_dyn_error.md) — Related concept: `std::error::Error` Trait & `Box<dyn Error>`.
- [Error Handling Stack](../level_18/error_handling_stack.md) — Related concept: Error Handling Stack.

---

## 7. Key Takeaways

- `thiserror` = For **Libraries**. Automatically generates the boilerplate for your exact, specific custom `enum` errors so callers can `match` on them.
- `anyhow` = For **Applications**. Provides a magical `Result<T>` that can hold *literally any error* in the universe, making it incredibly fast and easy to propagate errors up to `main()` with attached context.
