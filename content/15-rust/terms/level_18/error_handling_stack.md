# Error Handling Stack

> **Level 18 — Rust**
> Combining `thiserror` (library errors) + `anyhow` (application errors) + `?` operator for ergonomic, layered error handling.

---

## 1. Prerequisites

- [`anyhow` / `thiserror`](../level_04/anyhow_thiserror.md) — Anyhow and thiserror crates.
- [`?` Operator](../level_04/question_mark_operator.md) — ? error propagation.

---


## 2. Term Category

**Architecture Pattern**: Layered error handling using `thiserror` for libraries and `anyhow` for applications.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Errors in applications require rich contextual diagnostics (backtraces, dynamic error chains) while errors in libraries require strongly typed enums for caller pattern matching.

Combining `thiserror` (for public library crates) and `anyhow` (for application mains) establishes clean error boundaries. Libraries define custom error enums with `#[derive(thiserror::Error)]`, while application binaries use `anyhow::Result<T>` with `.context()` for rich operational logging.

### (2) Reality Metaphor

A hospital medical system: specialist physicians diagnose exact disease codes (`thiserror` domain enums), while the emergency room triage desk records comprehensive patient arrival logs (`anyhow` context stack).

### (3) Rust Code Examples

#### Short Snippet
```rust
// Library: #[derive(thiserror::Error, Debug)] pub enum LibErr { ... }
// Application: fn main() -> anyhow::Result<()> { ... }
```

#### Fuller Example
```rust
use thiserror::Error;

#[derive(Error, Debug, PartialEq)]
pub enum ConfigError {
    #[error("file not found: {0}")]
    NotFound(String),
    #[error("permission denied")]
    PermissionDenied,
}

pub fn load_config(path: &str) -> Result<String, ConfigError> {
    if path.is_empty() {
        Err(ConfigError::NotFound("path empty".into()))
    } else {
        Ok("config_data".into())
    }
}

fn main() -> Result<(), ConfigError> {
    let data = load_config("app.json")?;
    assert_eq!(data, "config_data");
    Ok(())
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Exposing `anyhow::Error` in Public Library APIs

**The mistake:** Returning `anyhow::Result` from public library crates.

**Why it is wrong:** Erases concrete error types, forcing downstream library callers to parse string representations instead of pattern matching on error enums.

*Incorrect:*
```rust
pub fn parse_data() -> anyhow::Result<Data> { ... }
```

*Fix:*
```rust
pub fn parse_data() -> Result<Data, ParseError> { ... } // Use strongly-typed enum!
```

### Mistake 2: Forgetting to Wrap Low-Level Errors with Context in Applications

**The mistake:** Propagating raw I/O errors directly using `?` in application entrypoints without context.

**Why it is wrong:** Produces cryptic error messages like `No such file or directory` without indicating *which* file failed.

*Incorrect:*
```rust
let file = File::open(path)?;
```

*Fix:*
```rust
let file = File::open(path).with_context(|| format!("Failed to open config at {path}"))?;
```

### Mistake 3: Ignoring `#[from]` Conversions in `thiserror` Enums

**The mistake:** Manually writing verbose `impl From<std::io::Error> for MyError` implementations.

**Why it is wrong:** Creates unnecessary boilerplate code.

*Incorrect:*
```rust
impl From<std::io::Error> for MyError { ... }
```

*Fix:*
```rust
#[derive(Error, Debug)] enum MyError { #[error(transparent)] Io(#[from] std::io::Error) }
```

---

## 5. Practice Exercises

### Exercise 1: Production Service Error Handling Stack

**Scenario:** Build a modular web server error stack using `thiserror` for database errors and `anyhow` for request handling.

**Requirements:**
1. Define `DbError` enum using `thiserror`.
1. Implement `fetch_user` returning `Result<String, DbError>`.
1. Implement application handler wrapping errors with context.
1. Test error conversion.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use thiserror::Error;
> 
> #[derive(Error, Debug, PartialEq)]
> pub enum DbError {
>     #[error("User {0} not found in database")]
>     UserNotFound(u64),
>     #[error("Database connection timeout")]
>     Timeout,
> }
> 
> pub fn fetch_user(id: u64) -> Result<String, DbError> {
>     if id == 0 {
>         Err(DbError::UserNotFound(id))
>     } else {
>         Ok("Alice".into())
>     }
> }
> 
> pub fn handle_request(user_id: u64) -> Result<String, String> {
>     fetch_user(user_id).map_err(|e| format!("Request failed: {}", e))
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_library_error_matching() {
>         let err = fetch_user(0).unwrap_err();
>         assert_eq!(err, DbError::UserNotFound(0));
>     }
> 
>     #[test]
>     fn test_app_context_wrapping() {
>         let res = handle_request(0);
>         assert!(res.unwrap_err().contains("User 0 not found"));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `DbError` uses `thiserror` for strongly-typed domain errors in library modules.
> 2. `handle_request` formats and attaches context for application presentation.

---

### Exercise 2: File Parser Layered Error Stack

**Scenario:** Build a configuration parser using `thiserror` enum variant delegation.

**Requirements:**
1. Define `ParseError` enum with `Io` and `InvalidFormat` variants.
1. Verify error messages.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use thiserror::Error;
> 
> #[derive(Error, Debug)]
> pub enum ParseError {
>     #[error("IO error: {0}")]
>     Io(#[from] std::io::Error),
>     #[error("Invalid syntax at line {line}")]
>     InvalidSyntax { line: usize },
> }
> 
> pub fn parse_line(line: &str, line_num: usize) -> Result<i32, ParseError> {
>     line.parse::<i32>().map_err(|_| ParseError::InvalidSyntax { line: line_num })
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_parse_error() {
>         let err = parse_line("abc", 5).unwrap_err();
>         assert_eq!(err.to_string(), "Invalid syntax at line 5");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Demonstrates automatic `From` trait implementation via `#[from]` attribute.
> 2. Formats human-readable diagnostic messages.

---

### Exercise 3: Network Protocol Gateway Error Stack

**Scenario:** Implement a protocol gateway capturing remote network disconnects.

**Requirements:**
1. Define `NetworkError` enum.
1. Match variants.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use thiserror::Error;
> 
> #[derive(Error, Debug, PartialEq)]
> pub enum NetworkError {
>     #[error("Disconnected from host {host}:{port}")]
>     Disconnected { host: String, port: u16 },
> }
> 
> pub fn connect(host: &str, port: u16) -> Result<(), NetworkError> {
>     Err(NetworkError::Disconnected { host: host.into(), port })
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_net_err() {
>         let err = connect("127.0.0.1", 8080).unwrap_err();
>         assert_eq!(err, NetworkError::Disconnected { host: "127.0.0.1".into(), port: 8080 });
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Captures structured error fields for programmatic error handling.
> 2. Idiomatic library error design.

---

## 5. Related Terms

- [`anyhow` / `thiserror`](../level_04/anyhow_thiserror.md) — Error libraries.
- [Custom Error Types](../level_04/custom_error_types.md) — Custom error types.

---


## 7. Key Takeaways

- Use `thiserror` for public library crates to expose strongly-typed error enums.
- Use `anyhow` for applications to attach operational context (`.context()`).
- Never expose `anyhow::Error` in public library APIs.
- Preserves type safety for callers while providing rich backtrace logs.
