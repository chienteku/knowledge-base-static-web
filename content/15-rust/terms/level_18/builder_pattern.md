# Builder Pattern

> **Level 18 — Rust**
> Constructing complex objects step-by-step with method chaining, returning `self` from each setter to enable fluent APIs.

---

## 1. Prerequisites

- [Struct](../level_02/struct.md) — Struct data structures.
- [`impl` Block](../level_02/impl_block.md) — Impl blocks.

---

## 2. Term Category

**Design Pattern**: The Builder pattern for constructing complex objects step-by-step.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Rust structs do not support default parameter values or constructor overloading in function signatures. When a struct has dozens of configuration fields, constructors become unmaintainable.

The Builder pattern provides fluent, method-chained object construction. It encapsulates optional fields with sensible defaults, separates configuration from object instantiation, and can enforce required fields at compile time using Type-State patterns or at runtime via `Result<T, BuildError>`.

### (2) Reality Metaphor

Customizing a luxury automobile at a dealership: choosing exterior color, wheel package, and interior leather trim step-by-step before sending the final specification order to the manufacturing line.

### (3) Rust Code Examples

#### Short Snippet
```rust
let server = ServerBuilder::new()
    .host("127.0.0.1")
    .port(8080)
    .build()
    .unwrap();
```

#### Fuller Example
```rust
#[derive(Debug, PartialEq)]
pub struct HttpClient {
    pub url: String,
    pub timeout_ms: u64,
    pub follow_redirects: bool,
}

pub struct HttpClientBuilder {
    url: Option<String>,
    timeout_ms: u64,
    follow_redirects: bool,
}

impl HttpClientBuilder {
    pub fn new() -> Self {
        Self {
            url: None,
            timeout_ms: 3000,
            follow_redirects: true,
        }
    }

    pub fn url(mut self, url: impl Into<String>) -> Self {
        self.url = Some(url.into());
        self
    }

    pub fn timeout_ms(mut self, timeout_ms: u64) -> Self {
        self.timeout_ms = timeout_ms;
        self
    }

    pub fn build(self) -> Result<HttpClient, &'static str> {
        let url = self.url.ok_or("URL parameter is mandatory")?;
        Ok(HttpClient {
            url,
            timeout_ms: self.timeout_ms,
            follow_redirects: self.follow_redirects,
        })
    }
}

fn main() {
    let client = HttpClientBuilder::new()
        .url("https://api.example.com")
        .timeout_ms(5000)
        .build()
        .unwrap();
    assert_eq!(client.timeout_ms, 5000);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Calling `.unwrap()` on Missing Mandatory Builder Fields

**The mistake:** Unwrapping optional builder fields inside `.build()` without returning a fallible `Result`.

**Why it is wrong:** If a mandatory parameter is omitted by the caller, `.unwrap()` causes a runtime panic.

*Incorrect:*
```rust
fn build(self) -> Config { Config { host: self.host.unwrap() } }
```

*Fix:*
```rust
fn build(self) -> Result<Config, &'static str> { let host = self.host.ok_or("host missing")?; Ok(Config { host }) }
```

### Mistake 2: Mutating Builder by Reference Instead of Taking Ownership (`self`)

**The mistake:** Taking `&mut self` instead of `mut self` in builder setter methods.

**Why it is wrong:** Taking `&mut self` prevents clean fluent chaining (`Builder::new().a().b()`) without storing intermediate local variables.

*Incorrect:*
```rust
pub fn set_port(&mut self, p: u16) { self.port = p; }
```

*Fix:*
```rust
pub fn port(mut self, p: u16) -> Self { self.port = p; self }
```

### Mistake 3: Duplicating Struct Fields in Public Struct and Builder

**The mistake:** Failing to reuse `Default` or internal state definitions across struct and builder.

**Why it is wrong:** Creates maintenance overhead when adding new fields to the struct.

*Incorrect:*
```rust
struct Client { a: i32 } struct ClientBuilder { a: i32 }
```

*Fix:*
```rust
#[derive(Default)] struct ClientConfig { a: i32 } struct ClientBuilder(ClientConfig);
```

---

## 5. Practice Exercises

### Exercise 1: Type-Safe Database Connection Pool Builder

**Scenario:** Design a production database connection pool builder `DbPoolBuilder` requiring `connection_string` and validating timeout bounds.

**Requirements:**
1. Create `DbPoolBuilder` with optional `max_connections` (default 10).
1. Enforce non-empty `connection_string` in `.build()`.
1. Write unit tests for default and customized builds.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq)]
> pub struct DbPool {
>     pub connection_string: String,
>     pub max_connections: u32,
>     pub timeout_sec: u64,
> }
> 
> pub struct DbPoolBuilder {
>     connection_string: Option<String>,
>     max_connections: u32,
>     timeout_sec: u64,
> }
> 
> impl DbPoolBuilder {
>     pub fn new() -> Self {
>         Self {
>             connection_string: None,
>             max_connections: 10,
>             timeout_sec: 30,
>         }
>     }
> 
>     pub fn connection_string(mut self, conn: impl Into<String>) -> Self {
>         self.connection_string = Some(conn.into());
>         self
>     }
> 
>     pub fn max_connections(mut self, max: u32) -> Self {
>         self.max_connections = max;
>         self
>     }
> 
>     pub fn build(self) -> Result<DbPool, &'static str> {
>         let connection_string = self.connection_string.ok_or("Connection string is required")?;
>         if connection_string.is_empty() {
>             return Err("Connection string cannot be empty");
>         }
>         Ok(DbPool {
>             connection_string,
>             max_connections: self.max_connections,
>             timeout_sec: self.timeout_sec,
>         })
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_valid_builder() {
>         let pool = DbPoolBuilder::new()
>             .connection_string("postgres://localhost:5432/db")
>             .max_connections(25)
>             .build()
>             .unwrap();
>         assert_eq!(pool.max_connections, 25);
>         assert_eq!(pool.timeout_sec, 30);
>     }
> 
>     #[test]
>     fn test_missing_connection_string() {
>         let res = DbPoolBuilder::new().build();
>         assert!(res.is_err());
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `DbPoolBuilder::new()` sets default values for `max_connections` and `timeout_sec`.
> 2. `.connection_string()` accepts `impl Into<String>` for string slice flexibility.
> 3. `.build()` returns `Result<DbPool, &'static str>` to safely validate mandatory parameters.

---

### Exercise 2: Compile-Time Verified State Machine Builder (Type-State Pattern)

**Scenario:** Build a TLS client builder where `.connect()` can only be invoked after `.set_certificate()` is called at compile time.

**Requirements:**
1. Define `NoCert` and `HasCert` marker structs.
1. Implement `TlsBuilder<NoCert>` and `TlsBuilder<HasCert>`.
1. Ensure `.connect()` is only defined on `TlsBuilder<HasCert>`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub struct NoCert;
> pub struct HasCert(pub String);
> 
> pub struct TlsClientBuilder<State> {
>     host: String,
>     state: State,
> }
> 
> impl TlsClientBuilder<NoCert> {
>     pub fn new(host: impl Into<String>) -> Self {
>         Self {
>             host: host.into(),
>             state: NoCert,
>         }
>     }
> 
>     pub fn set_certificate(self, cert: impl Into<String>) -> TlsClientBuilder<HasCert> {
>         TlsClientBuilder {
>             host: self.host,
>             state: HasCert(cert.into()),
>         }
>     }
> }
> 
> impl TlsClientBuilder<HasCert> {
>     pub fn connect(self) -> String {
>         format!("Connected to {} with cert {}", self.host, self.state.0)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_typestate_builder() {
>         let builder = TlsClientBuilder::new("example.com")
>             .set_certificate("cert_pem_data");
>         let conn = builder.connect();
>         assert!(conn.contains("example.com"));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Using zero-sized marker types `NoCert` and `HasCert`, the builder transforms type signature upon calling `.set_certificate()`.
> 2. Compiling `.connect()` on an uncertified builder produces a compile-time type error.

---

### Exercise 3: High-Performance Logger Configuration Builder

**Scenario:** Create a thread-safe logger builder configuring log levels and destination streams.

**Requirements:**
1. Implement `LoggerBuilder` supporting log levels (`Info`, `Debug`, `Error`).
1. Provide defaults.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq)]
> pub enum LogLevel { Info, Debug, Error }
> 
> pub struct Logger {
>     pub level: LogLevel,
>     pub file_output: bool,
> }
> 
> pub struct LoggerBuilder {
>     level: LogLevel,
>     file_output: bool,
> }
> 
> impl LoggerBuilder {
>     pub fn new() -> Self {
>         Self { level: LogLevel::Info, file_output: false }
>     }
> 
>     pub fn level(mut self, level: LogLevel) -> Self {
>         self.level = level;
>         self
>     }
> 
>     pub fn enable_file_output(mut self, enable: bool) -> Self {
>         self.file_output = enable;
>         self
>     }
> 
>     pub fn build(self) -> Logger {
>         Logger { level: self.level, file_output: self.file_output }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_logger_builder() {
>         let log = LoggerBuilder::new().level(LogLevel::Debug).enable_file_output(true).build();
>         assert_eq!(log.level, LogLevel::Debug);
>         assert!(log.file_output);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Standard infallible builder pattern for component configuration.
> 2. Provides clean defaults for optional logging features.

---

## 5. Related Terms

- [Type-State Pattern](../level_14/type_state_pattern.md) — Type-state builder pattern variant.
- [`Default` Trait](../level_04/default_trait.md) — Default values.

---

## 7. Key Takeaways

- Constructs complex objects step-by-step via method chaining.
- Takes `mut self` and returns `Self` to enable fluent APIs.
- Use `Result<T, BuildError>` or Type-State patterns for mandatory fields.
- Separates object configuration from runtime instantiation.
