# `From` / `Into` Traits

> **Level 4 — Error Handling & Generics**
> Conversion traits enabling automatic error type coercion with `?`.

---

## 1. Prerequisites


- [`?` Operator](question_mark_operator.md) — The operator that secretly relies on these traits to work its magic.
- [Custom Error Types](custom_error_types.md) — The primary beneficiary of automatic conversions.
- [Trait](trait.md) — The mechanism defining shared behavior across types.

---

## 2. Term Category

**Rust-specific (the conversion engine)**: In many languages, you cast values using syntax like `(int)myFloat`. Rust strongly prefers explicit, safe conversions using standard functions. The `From` and `Into` traits are the universal, idiomatic way to convert Type A into Type B in Rust. Crucially, they also power the secret magic behind the `?` operator!

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

When building custom errors, you often encounter a frustrating situation. 

Imagine your function returns `Result<(), MyCustomAppError>`. Inside your function, you try to open a file using `File::open()`. If the file doesn't exist, `File::open()` returns a `std::io::Error`. 

If you try to use the `?` operator on the file open (`File::open("file.txt")?`), the compiler will scream at you! It will say: *"You are trying to return a `std::io::Error`, but the function signature promises a `MyCustomAppError`."*

To solve this, Rust needs a standard way to say, *"Here is how you convert an IO Error into My Custom Error."* 

By implementing the **`From`** trait, you teach the compiler how to do this conversion. Once the compiler knows how to convert the types, the `?` operator will **automatically** perform the conversion for you behind the scenes!

### (2) Reality Metaphor

Imagine you have a custom wallet that only holds **Euro** bills (`MyCustomAppError`). 

You go to a vending machine that spits out change in **US Dollars** (`std::io::Error`). You can't put the USD directly into your Euro wallet. 

The `From` trait is an **Currency Exchange Booth**. You teach the booth how to take USD and turn it into Euros. 

The `?` operator is your personal assistant. When the vending machine hands your assistant USD, the assistant automatically runs to the Exchange Booth, swaps it for Euros, and puts it in your wallet without you ever having to ask.

### (3) Rust Code Examples

#### Short Snippet (Basic Conversions)
You already use `From` and `Into` all the time when working with Strings!
```rust
fn main() {
    // Using From: "I want a String FROM a string literal"
    let s1 = String::from("Hello");

    // Using Into: "I have a string literal, turn it INTO whatever type s2 is"
    // (The compiler knows s2 is a String, so it uses the From implementation under the hood)
    let s2: String = "World".into(); 
}
```

#### Fuller Example (Error Coercion Magic)
Here is how `From` makes the `?` operator magical.

```rust
use std::fs::File;
use std::io;

// 1. Our custom error enum
enum AppError {
    DatabaseDown,
    FileError(String), // We want to store the IO error message here
}

// 2. The Exchange Booth: Teach Rust how to convert io::Error -> AppError
impl From<io::Error> for AppError {
    fn from(error: io::Error) -> Self {
        // We wrap the standard IO error inside our custom variant
        AppError::FileError(error.to_string())
    }
}

// 3. The Magic!
fn read_config() -> Result<(), AppError> {
    // File::open returns an `io::Error`.
    // Because we implemented `From`, the `?` operator sees the `io::Error`,
    // automatically calls `AppError::from()`, and returns the `AppError`!
    let _file = File::open("config.txt")?; 
    
    Ok(())
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding From Into Traits Scoping and Lifecycle Rules

**The mistake:** Assuming From Into Traits instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("from_into_traits_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("from_into_traits_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating From Into Traits State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with From Into Traits through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to From Into Traits Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe From Into Traits instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Multi-Tiered Domain & Network Error Coercion Pipeline

**Scenario:** You are building a production microservice backend where low-level subsystem errors (`std::io::Error`, custom `HttpError`, custom `ParseError`) must be automatically mapped into a unified domain error type (`ServiceError`) when using the `?` operator.

**Task:**
1. Define a domain enum `ServiceError` with variants: `Config(String)`, `Network { status_code: u16, message: String }`, `Parse(String)`, and `Internal(String)`.
2. Implement `From<std::io::Error>`, `From<HttpError>`, and `From<ParseError>` for `ServiceError`.
3. Write three worker functions (`load_config`, `fetch_user_data`, `parse_port`) demonstrating automatic error coercion via `?`.
4. Include a unit test module `#[cfg(test)] mod tests` verifying all error conversions using explicit `assert_eq!`, `assert!`, `assert_ne!`, and `matches!` macros.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::fmt;
> use std::io;
> 
> #[derive(Debug, PartialEq)]
> pub enum ServiceError {
>     Config(String),
>     Network { status_code: u16, message: String },
>     Parse(String),
>     Internal(String),
> }
> 
> impl fmt::Display for ServiceError {
>     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
>         match self {
>             ServiceError::Config(msg) => write!(f, "Configuration Error: {msg}"),
>             ServiceError::Network { status_code, message } => {
>                 write!(f, "Network Error [{status_code}]: {message}")
>             }
>             ServiceError::Parse(msg) => write!(f, "Parse Error: {msg}"),
>             ServiceError::Internal(msg) => write!(f, "Internal Error: {msg}"),
>         }
>     }
> }
> 
> impl std::error::Error for ServiceError {}
> 
> // 1. Convert std::io::Error -> ServiceError::Config
> impl From<io::Error> for ServiceError {
>     fn from(err: io::Error) -> Self {
>         ServiceError::Config(err.to_string())
>     }
> }
> 
> #[derive(Debug, PartialEq)]
> pub struct HttpError {
>     pub status: u16,
>     pub body: String,
> }
> 
> impl fmt::Display for HttpError {
>     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
>         write!(f, "HTTP Error {}: {}", self.status, self.body)
>     }
> }
> 
> impl std::error::Error for HttpError {}
> 
> // 2. Convert HttpError -> ServiceError::Network
> impl From<HttpError> for ServiceError {
>     fn from(err: HttpError) -> Self {
>         ServiceError::Network {
>             status_code: err.status,
>             message: err.body,
>         }
>     }
> }
> 
> #[derive(Debug, PartialEq)]
> pub struct ParseError {
>     pub field: String,
>     pub reason: String,
> }
> 
> impl fmt::Display for ParseError {
>     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
>         write!(f, "Failed to parse field '{}': {}", self.field, self.reason)
>     }
> }
> 
> impl std::error::Error for ParseError {}
> 
> // 3. Convert ParseError -> ServiceError::Parse
> impl From<ParseError> for ServiceError {
>     fn from(err: ParseError) -> Self {
>         ServiceError::Parse(format!("{}: {}", err.field, err.reason))
>     }
> }
> 
> pub fn load_config(path: &str) -> Result<String, ServiceError> {
>     if path.is_empty() {
>         return Err(io::Error::new(io::ErrorKind::NotFound, "Path cannot be empty").into());
>     }
>     let _file = std::fs::File::open(path)?;
>     Ok("config content".to_string())
> }
> 
> pub fn fetch_user_data(user_id: u64) -> Result<String, ServiceError> {
>     if user_id == 0 {
>         return Err(HttpError {
>             status: 404,
>             body: "User not found".to_string(),
>         }
>         .into());
>     }
>     Ok(format!("User_{user_id}_Data"))
> }
> 
> pub fn parse_port(input: &str) -> Result<u16, ServiceError> {
>     if input.as_bytes().iter().any(|b| !b.is_ascii_digit()) {
>         return Err(ParseError {
>             field: "port".to_string(),
>             reason: "non-digit character found".to_string(),
>         }
>         .into());
>     }
>     let port: u16 = input.parse().map_err(|_| ParseError {
>         field: "port".to_string(),
>         reason: "number out of u16 range".to_string(),
>     })?;
>     Ok(port)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_io_error_conversion() {
>         let res = load_config("");
>         assert!(res.is_err());
>         let err = res.unwrap_err();
>         assert_eq!(
>             err,
>             ServiceError::Config("Path cannot be empty".to_string())
>         );
>     }
> 
>     #[test]
>     fn test_http_error_conversion() {
>         let res = fetch_user_data(0);
>         assert_ne!(res, Ok("User_0_Data".to_string()));
>         let err = res.unwrap_err();
>         assert!(matches!(
>             err,
>             ServiceError::Network { status_code: 404, .. }
>         ));
>     }
> 
>     #[test]
>     fn test_parse_error_conversion() {
>         let res = parse_port("invalid");
>         assert!(res.is_err());
>         let err = res.unwrap_err();
>         assert_eq!(
>             err,
>             ServiceError::Parse("port: non-digit character found".to_string())
>         );
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Mechanism of `?` Coercion**: When `?` is invoked on `Result<T, E>`, it evaluates the expression. If `Err(e)` is returned, `?` implicitly executes `Err(From::from(e))` to match the outer function's return type `Result<T, ServiceError>`.
> 2. **Symmetry of `From` and `Into`**: Rust's standard library includes the blanket implementation `impl<T, U> Into<U> for T where U: From<T>`. Defining `From<HttpError> for ServiceError` automatically allows `HttpError::into()`.
> 3. **Ownership and Zero-Allocation Wrappers**: `From::from` takes ownership of the source error `e` by value. Converting variants shifts ownership of string data (`String` buffers) into the target enum variant without unnecessary intermediate heap allocations or cloning.
> 4. **Static Dispatch & Inlining**: Because trait implementations for `From` are concrete, the Rust compiler monomorphizes and inline-expands the conversion function during optimization. No dynamic dispatch (`dyn Error` vtable lookups) is required.
> 
---

### Exercise 2: Zero-Cost Ergonomic HTTP Builder with Generic `impl Into<T>` Constraints

**Scenario:** High-performance network libraries must offer flexible API endpoints where caller inputs (`&str`, `String`, `Vec<u8>`, `JsonPayload`) are automatically accepted without forcing callers to write verbose `.to_string()` or `.into()` calls at every invocation site.

**Task:**
1. Define a `JsonPayload` newtype wrapper and implement `From<&str>`, `From<String>`, and `From<JsonPayload> for Vec<u8>`.
2. Construct `HttpRequestBuilder` using generic parameters bounded by `Into<String>` and `Into<Vec<u8>>`.
3. Implement `HttpRequestBuilder::build()` returning `Result<HttpRequest, &'static str>`.
4. Include a unit test module `#[cfg(test)] mod tests` verifying builder ergonomics with `assert_eq!`, `assert!`, `assert_ne!`, and `matches!`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct JsonPayload(pub String);
> 
> impl From<&str> for JsonPayload {
>     fn from(s: &str) -> Self {
>         JsonPayload(s.to_string())
>     }
> }
> 
> impl From<String> for JsonPayload {
>     fn from(s: String) -> Self {
>         JsonPayload(s)
>     }
> }
> 
> impl From<JsonPayload> for Vec<u8> {
>     fn from(payload: JsonPayload) -> Self {
>         payload.0.into_bytes()
>     }
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct HttpRequest {
>     pub url: String,
>     pub headers: Vec<(String, String)>,
>     pub body: Vec<u8>,
> }
> 
> #[derive(Debug, Default)]
> pub struct HttpRequestBuilder {
>     url: Option<String>,
>     headers: Vec<(String, String)>,
>     body: Vec<u8>,
> }
> 
> impl HttpRequestBuilder {
>     pub fn new() -> Self {
>         Self::default()
>     }
> 
>     pub fn url<U: Into<String>>(mut self, url: U) -> Self {
>         self.url = Some(url.into());
>         self
>     }
> 
>     pub fn header<K, V>(mut self, key: K, value: V) -> Self
>     where
>         K: Into<String>,
>         V: Into<String>,
>     {
>         self.headers.push((key.into(), value.into()));
>         self
>     }
> 
>     pub fn body<B: Into<Vec<u8>>>(mut self, body: B) -> Self {
>         self.body = body.into();
>         self
>     }
> 
>     pub fn build(self) -> Result<HttpRequest, &'static str> {
>         let url = self.url.ok_or("URL is required")?;
>         Ok(HttpRequest {
>             url,
>             headers: self.headers,
>             body: self.body,
>         })
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_builder_ergonomics() {
>         let req = HttpRequestBuilder::new()
>             .url("https://api.example.com/v1/resource")
>             .header("Content-Type", "application/json")
>             .header(String::from("Authorization"), "Bearer token123")
>             .body(JsonPayload::from(r#"{"action":"sync"}"#))
>             .build()
>             .unwrap();
> 
>         assert_eq!(req.url, "https://api.example.com/v1/resource");
>         assert_eq!(req.headers.len(), 2);
>         assert_ne!(req.body.len(), 0);
>         assert!(req.headers.contains(&("Content-Type".to_string(), "application/json".to_string())));
>         assert!(matches!(
>             std::str::from_utf8(&req.body),
>             Ok(r#"{"action":"sync"}"#)
>         ));
>     }
> 
>     #[test]
>     fn test_builder_missing_url() {
>         let res = HttpRequestBuilder::new().build();
>         assert!(res.is_err());
>         assert_eq!(res.unwrap_err(), "URL is required");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Polymorphic API Design with `impl Into<T>`**: By accepting `impl Into<String>` or generic type parameters `U: Into<String>`, builder methods shift conversion responsibility from caller call-sites into method bodies, creating flexible, highly ergonomic APIs.
> 2. **Monomorphization and Inlining Efficiency**: Rust monomorphizes generic functions at compile time. Instantiations with `&str` compile down directly to `.to_string()`, while instantiations with owned `String` become no-ops during optimization because `From<String> for String` is identity.
> 3. **Transitive Conversions via Intermediate Types**: Implementing `From<JsonPayload> for Vec<u8>` along with `From<&str> for JsonPayload` allows `JsonPayload` instances to act as zero-cost byte conversion intermediaries.
> 4. **Ownership and Buffer Re-use**: The `into_bytes()` method on `String` consumes the inner `String` and re-uses its underlying allocated heap capacity buffer directly for `Vec<u8>`, ensuring zero re-allocation cost during conversion.
> 
---

### Exercise 3: Canonical Data Telemetry Pipeline with Reflexive `From` / `Into`

**Scenario:** In an enterprise telemetry engine, disparate data streams (`RawSysMetric`, `RawNetworkMetric`, `RawAppMetric`) must be normalized into a unified structure (`TelemetryRecord`) for streaming. The processing pipeline also leverages Rust's reflexive `From<T> for T` implementation to support uniform batch processing of both raw metrics and already-normalized records.

**Task:**
1. Define raw metric structs `RawSysMetric`, `RawNetworkMetric`, `RawAppMetric` and canonical `TelemetryRecord`.
2. Implement `From` for each raw metric type targeting `TelemetryRecord`.
3. Create generic normalization functions `normalize_metric<M: Into<TelemetryRecord>>(raw: M)` and `normalize_batch<M: Into<TelemetryRecord>>(raw_batch: Vec<M>)`.
4. Demonstrate reflexive identity conversion (passing `TelemetryRecord` directly to `normalize_metric`).
5. Include a unit test module `#[cfg(test)] mod tests` with explicit assertions: `assert_eq!`, `assert!`, `assert_ne!`, `matches!`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone, PartialEq)]
> pub struct RawSysMetric {
>     pub hostname: String,
>     pub cpu_usage: f64,
>     pub memory_mb: u64,
> }
> 
> #[derive(Debug, Clone, PartialEq)]
> pub struct RawNetworkMetric {
>     pub interface: String,
>     pub bytes_sent: u64,
>     pub bytes_recv: u64,
> }
> 
> #[derive(Debug, Clone, PartialEq)]
> pub struct RawAppMetric {
>     pub service_name: String,
>     pub requests_per_sec: u32,
>     pub error_rate: f64,
> }
> 
> #[derive(Debug, Clone, PartialEq)]
> pub struct TelemetryRecord {
>     pub source_id: String,
>     pub metric_name: String,
>     pub primary_value: f64,
>     pub tags: Vec<(String, String)>,
> }
> 
> impl From<RawSysMetric> for TelemetryRecord {
>     fn from(raw: RawSysMetric) -> Self {
>         TelemetryRecord {
>             source_id: raw.hostname,
>             metric_name: "sys.cpu_usage".to_string(),
>             primary_value: raw.cpu_usage,
>             tags: vec![("memory_mb".to_string(), raw.memory_mb.to_string())],
>         }
>     }
> }
> 
> impl From<RawNetworkMetric> for TelemetryRecord {
>     fn from(raw: RawNetworkMetric) -> Self {
>         TelemetryRecord {
>             source_id: raw.interface,
>             metric_name: "net.bytes_sent".to_string(),
>             primary_value: raw.bytes_sent as f64,
>             tags: vec![("bytes_recv".to_string(), raw.bytes_recv.to_string())],
>         }
>     }
> }
> 
> impl From<RawAppMetric> for TelemetryRecord {
>     fn from(raw: RawAppMetric) -> Self {
>         TelemetryRecord {
>             source_id: raw.service_name,
>             metric_name: "app.requests_per_sec".to_string(),
>             primary_value: raw.requests_per_sec as f64,
>             tags: vec![("error_rate".to_string(), raw.error_rate.to_string())],
>         }
>     }
> }
> 
> pub fn normalize_metric<M: Into<TelemetryRecord>>(raw: M) -> TelemetryRecord {
>     raw.into()
> }
> 
> pub fn normalize_batch<M: Into<TelemetryRecord>>(raw_batch: Vec<M>) -> Vec<TelemetryRecord> {
>     raw_batch.into_iter().map(Into::into).collect()
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_sys_metric_normalization() {
>         let sys = RawSysMetric {
>             hostname: "server-01".to_string(),
>             cpu_usage: 84.5,
>             memory_mb: 16384,
>         };
>         let record = normalize_metric(sys);
>         assert_eq!(record.source_id, "server-01");
>         assert_eq!(record.metric_name, "sys.cpu_usage");
>         assert_eq!(record.primary_value, 84.5);
>         assert_ne!(record.tags.len(), 0);
>     }
> 
>     #[test]
>     fn test_batch_normalization() {
>         let batch = vec![
>             RawNetworkMetric {
>                 interface: "eth0".to_string(),
>                 bytes_sent: 1024,
>                 bytes_recv: 2048,
>             },
>             RawNetworkMetric {
>                 interface: "wlan0".to_string(),
>                 bytes_sent: 512,
>                 bytes_recv: 1024,
>             },
>         ];
>         let records = normalize_batch(batch);
>         assert_eq!(records.len(), 2);
>         assert!(matches!(records[0].metric_name.as_str(), "net.bytes_sent"));
>         assert_eq!(records[0].source_id, "eth0");
>         assert_eq!(records[1].source_id, "wlan0");
>     }
> 
>     #[test]
>     fn test_reflexive_identity_conversion() {
>         let record = TelemetryRecord {
>             source_id: "custom-sensor".to_string(),
>             metric_name: "temp.celsius".to_string(),
>             primary_value: 23.4,
>             tags: vec![],
>         };
> 
>         let processed = normalize_metric(record.clone());
>         assert_eq!(processed, record);
>         assert!(matches!(processed.metric_name.as_str(), "temp.celsius"));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Standard Library Reflexive Blanket Implementation**: Rust's standard library implements `impl<T> From<T> for T { fn from(t: T) -> T { t } }`. Consequently, any type `T` automatically implements `Into<T>`. Passing an already normalized `TelemetryRecord` into `normalize_metric` invokes the identity function without any computation or re-allocation.
> 2. **Canonical Transformation Pipeline**: Implementing `From` for individual domain types centralizes mapping logic. The generic functions `normalize_metric` and `normalize_batch` remain cleanly decoupled from concrete input types.
> 3. **Stream Iterator Optimization**: `raw_batch.into_iter().map(Into::into).collect()` executes element-by-element mapping within an iterator pipeline, allowing LLVM compiler optimizations to vector-allocate the target `Vec<TelemetryRecord>`.
> 4. **Memory & Life-cycle Properties**: Values are moved into `From::from`, transferring heap allocations (such as owned `String` fields) directly into the fields of `TelemetryRecord`, maintaining high efficiency.
> 
---

## 6. Related Terms


- [`?` Operator](question_mark_operator.md) — The operator that secretly calls `.into()` under the hood when propagating errors.
- [`TryFrom` and `TryInto` Traits](../level_14/tryfrom_tryinto.md) — The fallible versions of these traits. You use these when a conversion *might fail* (like trying to convert a massive `i64` into a tiny `i8`). They return a `Result`.
- [`as` Casting (Primitive Numeric Coercion)](../level_01/as_casting.md) — Related concept: `as` Casting (Primitive Numeric Coercion).
- [Custom Error Types](custom_error_types.md) — Related concept: Custom Error Types.
- [`FromStr` Trait & `.parse()`](fromstr_parse.md) — Related concept: `FromStr` Trait & `.parse()`.
- [`TryFrom` / `TryInto`](../level_14/try_from_try_into.md) — Related concept: `TryFrom` / `TryInto`.
- [`From` for Constructor Overloading](../level_18/from_for_constructor_overloading.md) — Related concept: From For Constructor Overloading.

---

## 7. Key Takeaways

- `From` and `Into` are the standard, idiomatic ways to convert between types in Rust.
- If you implement `From`, the standard library automatically writes the `Into` implementation for you for free. Always implement `From`.
- The `?` operator secretly relies on these traits. If a function returns `std::io::Error` but your outer function returns `MyError`, the `?` operator will automatically convert it using `.into()` (as long as you wrote an `impl From<std::io::Error> for MyError` block).
