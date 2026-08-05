# `FromStr` Trait & `.parse()`

> **Level 4 — Error Handling & Generics**
> The trait behind `str::parse::<T>()`; the standard way to turn text into a typed value.

---

## 1. Prerequisites


- [String vs &str](../level_01/string_vs_&str.md) — The text you are converting *from*.
- [`Result<T, E>`](../level_02/result_t_e.md) — Parsing is fallible, so it always returns a `Result`.
- [`From` / `Into` Traits](from_into_traits.md) — `FromStr` is the text-specific sibling of this conversion-trait family.

---

## 2. Term Category

**Standard Library Trait (the text-to-type gateway)**: `FromStr` is the trait that powers `.parse()`. Any type that implements it can be produced from a string slice, and the compiler figures out *which* implementation to use based on how you annotate or turbofish the call. It's the standard, idiomatic answer to "how do I turn user input into a number?"

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Reading a number from a CLI argument, a config file, or stdin means starting with a `&str`. But `&str` and `i32` are utterly different in memory — there's no `as` cast that can bridge them (unlike, say, `i64 as i32`), because turning `"42"` into `42` requires actual parsing logic, and turning `"abc"` into a number should *fail*, not produce garbage. `FromStr` formalizes this: it's a trait with one method, `from_str(s: &str) -> Result<Self, Self::Err>`, that every parseable type implements. `.parse::<T>()` on `&str` is just a convenience method that calls `T::from_str()` for you.

### (2) Reality Metaphor

Imagine a customs officer at a border crossing who only accepts *typed, verified* forms — never raw, unverified paperwork.

- **The raw string** (`"42"`) is a handwritten note someone hands the officer.
- **`.parse::<i32>()`** is the officer's specialized "Numbers Department" stamp: they carefully verify the note really is a valid number, and issue you an official `i32` passport (`Ok(42)`).
- **If the note says `"forty-two"`**, the officer can't process it. They don't guess or crash the whole checkpoint — they hand you back a rejection slip explaining exactly what went wrong (`Err(ParseIntError)`), and you decide what to do next.

### (3) Rust Code Examples

#### Short Snippet (The Basic Parse)
```rust
fn main() {
    let input = "42";

    // Turbofish tells .parse() WHICH type to build.
    let number = input.parse::<i32>().unwrap();
    println!("{}", number + 8); // 50

    // A bad input returns Err instead of panicking or garbage data.
    let bad_input = "not a number";
    let result: Result<i32, _> = bad_input.parse();
    println!("{:?}", result); // Err(ParseIntError { kind: InvalidDigit })
}
```

#### Fuller Example (Implementing `FromStr` for Your Own Type)
```rust
use std::str::FromStr;

#[derive(Debug)]
struct Point { x: i32, y: i32 }

impl FromStr for Point {
    type Err = String; // The error type returned on failure.

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        // Expects input like "3,4"
        let (x_str, y_str) = s.split_once(',').ok_or("missing comma")?;

        let x = x_str.trim().parse::<i32>().map_err(|e| e.to_string())?;
        let y = y_str.trim().parse::<i32>().map_err(|e| e.to_string())?;

        Ok(Point { x, y })
    }
}

fn main() {
    // Because we implemented FromStr, ".parse::<Point>()" now works for free!
    let p: Point = "3, 4".parse().unwrap();
    println!("{:?}", p); // Point { x: 3, y: 4 }

    let bad: Result<Point, String> = "not a point".parse();
    println!("{:?}", bad); // Err("missing comma")
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Fromstr Parse Scoping and Lifecycle Rules

**The mistake:** Assuming Fromstr Parse instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("fromstr_parse_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("fromstr_parse_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Fromstr Parse State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Fromstr Parse through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Fromstr Parse Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Fromstr Parse instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Multi-Protocol Network Endpoint URI Parser with Custom Error Hierarchies

**Problem Statement:**
In distributed microservices, network configuration parameters are frequently ingested from environment variables or remote config servers as raw strings (e.g., `"https://api.internal.v1:8443"`, `"grpc://10.0.0.1:50051"`, or `"ws://localhost:8080"`).
Design and implement a zero-allocation-focused custom string parsing pipeline by implementing `FromStr` for a domain struct `NetworkEndpoint`.

**Requirements:**
1. Define an enum `Protocol` with variants: `Http`, `Https`, `Grpc`, `Ws`, `Wss`. Implement `FromStr` for `Protocol` (case-insensitive).
2. Define a struct `NetworkEndpoint` with fields: `protocol: Protocol`, `host: String`, `port: u16`.
3. Define a custom error enum `EndpointParseError` with variants:
   - `MissingProtocol`
   - `UnsupportedProtocol(String)`
   - `InvalidHost(String)`
   - `MissingPort`
   - `InvalidPort(std::num::ParseIntError)`
   - `MalformedUri(String)`
   Implement `std::fmt::Display` and `std::error::Error` for `EndpointParseError`.
4. Implement `FromStr` for `NetworkEndpoint` with `type Err = EndpointParseError`. Parse URI format `"<protocol>://<host>:<port>"`.
   - Validate that scheme separator `://` is present.
   - Validate host (must not be empty, must not contain spaces or slashes).
   - If port is missing or invalid, return the corresponding `EndpointParseError` variant.
5. Provide a helper method `NetworkEndpoint::is_secure(&self) -> bool` returning `true` for `Https` and `Wss`.
6. Include a complete test module `#[cfg(test)] mod tests` with explicit assertions (`assert_eq!`, `assert!`, `assert_ne!`, `matches!`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::fmt;
> use std::str::FromStr;
> 
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub enum Protocol {
>     Http,
>     Https,
>     Grpc,
>     Ws,
>     Wss,
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum EndpointParseError {
>     MissingProtocol,
>     UnsupportedProtocol(String),
>     InvalidHost(String),
>     MissingPort,
>     InvalidPort(std::num::ParseIntError),
>     MalformedUri(String),
> }
> 
> impl fmt::Display for EndpointParseError {
>     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
>         match self {
>             EndpointParseError::MissingProtocol => write!(f, "URI scheme/protocol separator '://' is missing"),
>             EndpointParseError::UnsupportedProtocol(p) => write!(f, "Unsupported network protocol: '{}'", p),
>             EndpointParseError::InvalidHost(h) => write!(f, "Invalid hostname/IP specified: '{}'", h),
>             EndpointParseError::MissingPort => write!(f, "Port number was not specified in endpoint URI"),
>             EndpointParseError::InvalidPort(err) => write!(f, "Failed to parse port number: {}", err),
>             EndpointParseError::MalformedUri(uri) => write!(f, "Malformed URI format: '{}'", uri),
>         }
>     }
> }
> 
> impl std::error::Error for EndpointParseError {
>     fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
>         match self {
>             EndpointParseError::InvalidPort(err) => Some(err),
>             _ => None,
>         }
>     }
> }
> 
> impl FromStr for Protocol {
>     type Err = EndpointParseError;
> 
>     fn from_str(s: &str) -> Result<Self, Self::Err> {
>         match s.to_ascii_lowercase().as_str() {
>             "http" => Ok(Protocol::Http),
>             "https" => Ok(Protocol::Https),
>             "grpc" => Ok(Protocol::Grpc),
>             "ws" => Ok(Protocol::Ws),
>             "wss" => Ok(Protocol::Wss),
>             other => Err(EndpointParseError::UnsupportedProtocol(other.to_string())),
>         }
>     }
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct NetworkEndpoint {
>     pub protocol: Protocol,
>     pub host: String,
>     pub port: u16,
> }
> 
> impl NetworkEndpoint {
>     pub fn is_secure(&self) -> bool {
>         matches!(self.protocol, Protocol::Https | Protocol::Wss)
>     }
> }
> 
> impl FromStr for NetworkEndpoint {
>     type Err = EndpointParseError;
> 
>     fn from_str(s: &str) -> Result<Self, Self::Err> {
>         let (proto_str, rest) = s
>             .split_once("://")
>             .ok_or(EndpointParseError::MissingProtocol)?;
> 
>         if proto_str.is_empty() {
>             return Err(EndpointParseError::MissingProtocol);
>         }
> 
>         let protocol: Protocol = proto_str.parse()?;
> 
>         let (host_str, port_str) = rest
>             .rsplit_once(':')
>             .ok_or(EndpointParseError::MissingPort)?;
> 
>         if host_str.is_empty() || host_str.contains(' ') || host_str.contains('/') {
>             return Err(EndpointParseError::InvalidHost(host_str.to_string()));
>         }
> 
>         if port_str.is_empty() {
>             return Err(EndpointParseError::MissingPort);
>         }
> 
>         let port: u16 = port_str
>             .parse()
>             .map_err(EndpointParseError::InvalidPort)?;
> 
>         Ok(NetworkEndpoint {
>             protocol,
>             host: host_str.to_string(),
>             port,
>         })
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_parse_valid_endpoints() {
>         let ep: NetworkEndpoint = "https://api.internal.v1:8443".parse().unwrap();
>         assert_eq!(ep.protocol, Protocol::Https);
>         assert_eq!(ep.host, "api.internal.v1");
>         assert_eq!(ep.port, 8443);
>         assert!(ep.is_secure());
> 
>         let ep_grpc: NetworkEndpoint = "grpc://10.0.0.1:50051".parse().unwrap();
>         assert_eq!(ep_grpc.protocol, Protocol::Grpc);
>         assert_eq!(ep_grpc.host, "10.0.0.1");
>         assert_eq!(ep_grpc.port, 50051);
>         assert!(!ep_grpc.is_secure());
>     }
> 
>     #[test]
>     fn test_parse_invalid_cases() {
>         let res: Result<NetworkEndpoint, _> = "localhost:8080".parse();
>         assert!(matches!(res, Err(EndpointParseError::MissingProtocol)));
> 
>         let res_proto: Result<NetworkEndpoint, _> = "ftp://localhost:21".parse();
>         assert!(matches!(res_proto, Err(EndpointParseError::UnsupportedProtocol(ref p)) if p == "ftp"));
> 
>         let res_no_port: Result<NetworkEndpoint, _> = "http://localhost".parse();
>         assert!(matches!(res_no_port, Err(EndpointParseError::MissingPort)));
> 
>         let res_bad_port: Result<NetworkEndpoint, _> = "http://localhost:99999".parse();
>         assert!(matches!(res_bad_port, Err(EndpointParseError::InvalidPort(_))));
> 
>         let res_bad_host: Result<NetworkEndpoint, _> = "http://invalid host:8080".parse();
>         assert!(matches!(res_bad_host, Err(EndpointParseError::InvalidHost(_))));
> 
>         assert_ne!(Protocol::Http, Protocol::Https);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Trait Composition & Method Chaining**: Implementing `FromStr` for `Protocol` allows `proto_str.parse()?` inside `NetworkEndpoint::from_str` to automatically invoke `Protocol::from_str`. The compiler uses monomorphization to generate direct function calls to `Protocol::from_str` without dynamic dispatch (`dyn`).
> 2. **Zero-Copy Subslice Splitting**: `split_once` and `rsplit_once` operate directly on string slices (`&str`), returning borrowing tuples (`(&str, &str)`). No heap allocations occur until string slices are explicitly converted to owned `String` instances (`host_str.to_string()`) upon constructing `NetworkEndpoint`.
> 3. **Error Wrappers & Ownership**: The `std::error::Error` implementation for `EndpointParseError` optionally returns an underlying cause via `source()`. By wrapping `std::num::ParseIntError` inside `EndpointParseError::InvalidPort`, lower-level parsing errors retain their full diagnostic stack traces while adhering to domain-specific error protocols.

---

### Exercise 2: Generic Configuration Extraction with Rich Error Context

**Problem Statement:**
Production services read raw string key-value configurations (e.g., from `std::env::vars()` or `.env` files stored in a `HashMap<String, String>`).
Implement a generic parsing pipeline function `parse_config_entry<T: FromStr>` that safely extracts and parses configuration keys into typed Rust domain values while producing detailed, contextual error reports when parsing fails.

**Requirements:**
1. Define a domain enum `LogLevel` (`Debug`, `Info`, `Warn`, `Error`). Implement `FromStr` for `LogLevel`.
2. Define a domain struct `DatabaseConfig` with fields `host: String`, `port: u16`, `max_connections: u32`, `log_level: LogLevel`.
3. Define a custom error type `ConfigError`:
   - `MissingKey { key: String }`
   - `InvalidValue { key: String, raw_value: String, cause: String }`
   Implement `Display` and `std::error::Error` for `ConfigError`.
4. Implement a generic function `parse_config_entry<T>(map: &HashMap<String, String>, key: &str) -> Result<T, ConfigError> where T: FromStr, T::Err: std::fmt::Display`.
5. Implement `DatabaseConfig::from_map(map: &HashMap<String, String>) -> Result<Self, ConfigError>` extracting keys `"DB_HOST"`, `"DB_PORT"`, `"DB_MAX_CONN"`, and `"DB_LOG_LEVEL"`.
6. Include a complete test module `#[cfg(test)] mod tests` with explicit assertions (`assert_eq!`, `assert!`, `assert_ne!`, `matches!`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::HashMap;
> use std::fmt;
> use std::str::FromStr;
> 
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub enum LogLevel {
>     Debug,
>     Info,
>     Warn,
>     Error,
> }
> 
> impl FromStr for LogLevel {
>     type Err = String;
> 
>     fn from_str(s: &str) -> Result<Self, Self::Err> {
>         match s.trim().to_uppercase().as_str() {
>             "DEBUG" => Ok(LogLevel::Debug),
>             "INFO" => Ok(LogLevel::Info),
>             "WARN" | "WARNING" => Ok(LogLevel::Warn),
>             "ERROR" => Ok(LogLevel::Error),
>             _ => Err(format!("Unknown log level: '{}'", s)),
>         }
>     }
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum ConfigError {
>     MissingKey { key: String },
>     InvalidValue {
>         key: String,
>         raw_value: String,
>         cause: String,
>     },
> }
> 
> impl fmt::Display for ConfigError {
>     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
>         match self {
>             ConfigError::MissingKey { key } => write!(f, "Configuration key '{}' is missing", key),
>             ConfigError::InvalidValue { key, raw_value, cause } => {
>                 write!(f, "Failed to parse key '{}' with value '{}': {}", key, raw_value, cause)
>             }
>         }
>     }
> }
> 
> impl std::error::Error for ConfigError {}
> 
> pub fn parse_config_entry<T>(map: &HashMap<String, String>, key: &str) -> Result<T, ConfigError>
> where
>     T: FromStr,
>     T::Err: fmt::Display,
> {
>     let raw = map
>         .get(key)
>         .ok_or_else(|| ConfigError::MissingKey { key: key.to_string() })?;
> 
>     raw.parse::<T>().map_err(|err| ConfigError::InvalidValue {
>         key: key.to_string(),
>         raw_value: raw.clone(),
>         cause: err.to_string(),
>     })
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct DatabaseConfig {
>     pub host: String,
>     pub port: u16,
>     pub max_connections: u32,
>     pub log_level: LogLevel,
> }
> 
> impl DatabaseConfig {
>     pub fn from_map(map: &HashMap<String, String>) -> Result<Self, ConfigError> {
>         let host: String = parse_config_entry(map, "DB_HOST")?;
>         let port: u16 = parse_config_entry(map, "DB_PORT")?;
>         let max_connections: u32 = parse_config_entry(map, "DB_MAX_CONN")?;
>         let log_level: LogLevel = parse_config_entry(map, "DB_LOG_LEVEL")?;
> 
>         Ok(DatabaseConfig {
>             host,
>             port,
>             max_connections,
>             log_level,
>         })
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_valid_config_parsing() {
>         let mut map = HashMap::new();
>         map.insert("DB_HOST".to_string(), "postgres.internal".to_string());
>         map.insert("DB_PORT".to_string(), "5432".to_string());
>         map.insert("DB_MAX_CONN".to_string(), "100".to_string());
>         map.insert("DB_LOG_LEVEL".to_string(), "info".to_string());
> 
>         let cfg = DatabaseConfig::from_map(&map).unwrap();
>         assert_eq!(cfg.host, "postgres.internal");
>         assert_eq!(cfg.port, 5432);
>         assert_eq!(cfg.max_connections, 100);
>         assert_eq!(cfg.log_level, LogLevel::Info);
>         assert_ne!(cfg.log_level, LogLevel::Debug);
>     }
> 
>     #[test]
>     fn test_missing_key_error() {
>         let mut map = HashMap::new();
>         map.insert("DB_HOST".to_string(), "localhost".to_string());
> 
>         let res = DatabaseConfig::from_map(&map);
>         assert!(matches!(res, Err(ConfigError::MissingKey { ref key }) if key == "DB_PORT"));
>     }
> 
>     #[test]
>     fn test_invalid_value_error() {
>         let mut map = HashMap::new();
>         map.insert("DB_HOST".to_string(), "localhost".to_string());
>         map.insert("DB_PORT".to_string(), "not_a_number".to_string());
>         map.insert("DB_MAX_CONN".to_string(), "10".to_string());
>         map.insert("DB_LOG_LEVEL".to_string(), "DEBUG".to_string());
> 
>         let res = DatabaseConfig::from_map(&map);
>         assert!(matches!(
>             res,
>             Err(ConfigError::InvalidValue { ref key, ref raw_value, .. })
>                 if key == "DB_PORT" && raw_value == "not_a_number"
>         ));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Generic Monomorphization**: `parse_config_entry<T>` uses Rust's static generics (`T: FromStr`). At compile time, the Rust compiler monomorphizes distinct specialized instantiations for `T = String`, `T = u16`, `T = u32`, and `T = LogLevel`. This eliminates runtime trait object dispatch overhead while preserving complete type safety.
> 2. **Contextual Error Enrichment**: Low-level parse errors (`ParseIntError` or `String`) often lack context regarding *which* configuration key caused the failure. By capturing `key` and `raw_value` inside `ConfigError::InvalidValue`, the function converts anonymous errors into actionable diagnostic signals for operators.
> 3. **Trait Bound `T::Err: Display`**: Constraining `T::Err` with `std::fmt::Display` guarantees that any error produced by `T::from_str` can be serialized into a user-readable `String` via `err.to_string()`, permitting arbitrary domain types to plug seamlessly into `parse_config_entry`.

---

### Exercise 3: High-Precision Fixed-Point Financial Monetary Parser

**Problem Statement:**
In financial ledger software, binary floating-point types (`f32` / `f64`) are forbidden because representation issues cause rounding errors (e.g. `0.1 + 0.2 != 0.3`). Monetary values are stored as fixed-point integers representing sub-units (e.g., cents or Yen).
Implement `FromStr` for a `Money` type that parses strings like `"$1,234.56 USD"`, `"EUR 99.00"`, `"-¥500 JPY"`, or `"100.50 CAD"`.

**Requirements:**
1. Define a `Currency` enum: `USD`, `EUR`, `GBP`, `JPY`, `CAD`. Implement `FromStr` for `Currency`.
   - `JPY` has 0 decimal sub-units.
   - `USD`, `EUR`, `GBP`, `CAD` have 2 decimal sub-units (cents).
2. Define a `Money` struct containing: `amount_subunits: i64`, `currency: Currency`.
3. Define a custom error type `MoneyParseError` with variants:
   - `InvalidFormat`
   - `UnknownCurrency(String)`
   - `InvalidAmount`
   - `SubunitOverflow`
   Implement `Display` and `std::error::Error` for `MoneyParseError`.
4. Implement `FromStr` for `Money`:
   - Strip whitespace, currency symbols (`$`, `€`, `£`, `¥`), and thousand separators (`,`).
   - Determine currency via ISO code (`"USD"`) or symbol (`"$"`).
   - Validate decimal places based on currency specifications (reject extra decimals or decimals for `JPY`).
   - Safely convert decimal components to integer sub-units using checked integer arithmetic (`checked_mul`, `checked_add`).
5. Provide helper `Money::to_formatted_string(&self) -> String` to re-format parsed values.
6. Include a complete test module `#[cfg(test)] mod tests` with explicit assertions (`assert_eq!`, `assert!`, `assert_ne!`, `matches!`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::fmt;
> use std::str::FromStr;
> 
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub enum Currency {
>     USD,
>     EUR,
>     GBP,
>     JPY,
>     CAD,
> }
> 
> impl Currency {
>     pub fn decimal_places(&self) -> u32 {
>         match self {
>             Currency::JPY => 0,
>             Currency::USD | Currency::EUR | Currency::GBP | Currency::CAD => 2,
>         }
>     }
> 
>     pub fn symbol(&self) -> &'static str {
>         match self {
>             Currency::USD | Currency::CAD => "$",
>             Currency::EUR => "€",
>             Currency::GBP => "£",
>             Currency::JPY => "¥",
>         }
>     }
> }
> 
> impl FromStr for Currency {
>     type Err = MoneyParseError;
> 
>     fn from_str(s: &str) -> Result<Self, Self::Err> {
>         match s.trim().to_uppercase().as_str() {
>             "USD" | "$" => Ok(Currency::USD),
>             "EUR" | "€" => Ok(Currency::EUR),
>             "GBP" | "£" => Ok(Currency::GBP),
>             "JPY" | "¥" => Ok(Currency::JPY),
>             "CAD" => Ok(Currency::CAD),
>             other => Err(MoneyParseError::UnknownCurrency(other.to_string())),
>         }
>     }
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum MoneyParseError {
>     InvalidFormat,
>     UnknownCurrency(String),
>     InvalidAmount,
>     SubunitOverflow,
> }
> 
> impl fmt::Display for MoneyParseError {
>     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
>         match self {
>             MoneyParseError::InvalidFormat => write!(f, "Invalid monetary string format"),
>             MoneyParseError::UnknownCurrency(c) => write!(f, "Unrecognized currency indicator: '{}'", c),
>             MoneyParseError::InvalidAmount => write!(f, "Failed to parse numeric monetary amount"),
>             MoneyParseError::SubunitOverflow => write!(f, "Monetary amount exceeds integer storage limit"),
>         }
>     }
> }
> 
> impl std::error::Error for MoneyParseError {}
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct Money {
>     pub amount_subunits: i64,
>     pub currency: Currency,
> }
> 
> impl Money {
>     pub fn new(amount_subunits: i64, currency: Currency) -> Self {
>         Money { amount_subunits, currency }
>     }
> 
>     pub fn to_formatted_string(&self) -> String {
>         let decimals = self.currency.decimal_places();
>         if decimals == 0 {
>             format!("{} {}", self.amount_subunits, self.currency.symbol())
>         } else {
>             let divisor = 10i64.pow(decimals);
>             let units = self.amount_subunits / divisor;
>             let subs = (self.amount_subunits % divisor).abs();
>             format!("{}{}.{:02} {:?}", self.currency.symbol(), units, subs, self.currency)
>         }
>     }
> }
> 
> impl FromStr for Money {
>     type Err = MoneyParseError;
> 
>     fn from_str(s: &str) -> Result<Self, Self::Err> {
>         let trimmed = s.trim();
>         if trimmed.is_empty() {
>             return Err(MoneyParseError::InvalidFormat);
>         }
> 
>         let mut currency: Option<Currency> = None;
>         let mut clean_str = String::new();
> 
>         for token in trimmed.split_whitespace() {
>             if let Ok(c) = token.parse::<Currency>() {
>                 if currency.is_none() {
>                     currency = Some(c);
>                     continue;
>                 }
>             }
>             clean_str.push_str(token);
>         }
> 
>         if currency.is_none() {
>             if clean_str.starts_with('$') || clean_str.starts_with('€') || clean_str.starts_with('£') || clean_str.starts_with('¥') {
>                 let symbol = &clean_str[..clean_str.chars().next().unwrap().len_utf8()];
>                 currency = symbol.parse::<Currency>().ok();
>                 clean_str = clean_str[symbol.len()..].to_string();
>             }
>         }
> 
>         let currency = currency.ok_or(MoneyParseError::InvalidFormat)?;
> 
>         let number_str = clean_str.replace(',', "");
>         if number_str.is_empty() {
>             return Err(MoneyParseError::InvalidAmount);
>         }
> 
>         let is_negative = number_str.starts_with('-');
>         let abs_str = if is_negative || number_str.starts_with('+') {
>             &number_str[1..]
>         } else {
>             &number_str[..]
>         };
> 
>         let decimals = currency.decimal_places();
>         let (units_str, frac_str) = match abs_str.split_once('.') {
>             Some((u, f)) => (u, f),
>             None => (abs_str, ""),
>         };
> 
>         if decimals == 0 && !frac_str.is_empty() {
>             return Err(MoneyParseError::InvalidAmount);
>         }
> 
>         if frac_str.len() > decimals as usize {
>             return Err(MoneyParseError::InvalidAmount);
>         }
> 
>         let units: i64 = if units_str.is_empty() {
>             0
>         } else {
>             units_str.parse().map_err(|_| MoneyParseError::InvalidAmount)?
>         };
> 
>         let padded_frac = format!("{:0<width$}", frac_str, width = decimals as usize);
>         let frac: i64 = if decimals == 0 {
>             0
>         } else {
>             padded_frac.parse().map_err(|_| MoneyParseError::InvalidAmount)?
>         };
> 
>         let scale = 10i64.pow(decimals);
>         let total_subunits = units
>             .checked_mul(scale)
>             .and_then(|u| u.checked_add(frac))
>             .ok_or(MoneyParseError::SubunitOverflow)?;
> 
>         let final_subunits = if is_negative {
>             -total_subunits
>         } else {
>             total_subunits
>         };
> 
>         Ok(Money {
>             amount_subunits: final_subunits,
>             currency,
>         })
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_parse_valid_money() {
>         let m1: Money = "$1,234.56 USD".parse().unwrap();
>         assert_eq!(m1.amount_subunits, 123456);
>         assert_eq!(m1.currency, Currency::USD);
> 
>         let m2: Money = "EUR 99.00".parse().unwrap();
>         assert_eq!(m2.amount_subunits, 9900);
>         assert_eq!(m2.currency, Currency::EUR);
> 
>         let m3: Money = "100 JPY".parse().unwrap();
>         assert_eq!(m3.amount_subunits, 100);
>         assert_eq!(m3.currency, Currency::JPY);
> 
>         let m4: Money = "-$50.25 USD".parse().unwrap();
>         assert_eq!(m4.amount_subunits, -5025);
>     }
> 
>     #[test]
>     fn test_parse_invalid_money() {
>         let res1: Result<Money, _> = "100.50.25 USD".parse();
>         assert!(matches!(res1, Err(MoneyParseError::InvalidAmount)));
> 
>         let res2: Result<Money, _> = "$10.999 USD".parse();
>         assert!(matches!(res2, Err(MoneyParseError::InvalidAmount)));
> 
>         let res3: Result<Money, _> = "100.50 JPY".parse();
>         assert!(matches!(res3, Err(MoneyParseError::InvalidAmount)));
> 
>         let res4: Result<Money, _> = "$100 XYZ".parse();
>         assert!(matches!(res4, Err(MoneyParseError::UnknownCurrency(_))));
> 
>         assert_ne!(Currency::USD, Currency::EUR);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Fixed-Point Decimal Parsing**: To prevent IEEE 754 floating-point inaccuracies, string components (`units_str` and `frac_str`) are split on decimal boundaries (`.split_once('.')`) and converted directly into integer sub-units. Arithmetic operations utilize `checked_mul` and `checked_add` to protect against `i64` integer overflow vulnerabilities.
> 2. **Multi-Stage Token & Symbol Resolution**: `FromStr::from_str` parses both currency symbols (`$`, `€`, `£`, `¥`) and ISO 4217 alphabetic codes (`USD`, `EUR`) by leveraging sub-parsing via `token.parse::<Currency>()`. UTF-8 multibyte boundary awareness (`symbol.chars().next().unwrap().len_utf8()`) ensures slice bounds remain valid when stripping unicode symbols like `€` (3 bytes) or `¥` (2 bytes).
> 3. **Currency Domain Invariants**: The parser dynamically queries `currency.decimal_places()` to enforce scale precision. Currencies without subunits (e.g. `JPY`) reject fractional strings, whereas sub-cent decimals (e.g. `$10.999`) trigger `MoneyParseError::InvalidAmount` to maintain accounting invariants.

---

## 6. Related Terms


- [`?` Operator](question_mark_operator.md) — The idiomatic way to propagate a `.parse()` failure out of a function.
- [`Result<T, E>`](../level_02/result_t_e.md) — The type every `FromStr::from_str` implementation must return.
- [`From` / `Into` Traits](from_into_traits.md) — The infallible-conversion sibling family; `FromStr` is specifically for the fallible, text-parsing case.
- [`TryFrom` and `TryInto` Traits](../level_14/tryfrom_tryinto.md) — The general-purpose fallible-conversion trait; `FromStr` is effectively `TryFrom<&str>` with a dedicated name and `.parse()` sugar.

---

## 7. Key Takeaways

- `.parse::<T>()` is sugar for `T::from_str(s)`, and works for any `T` that implements `FromStr`.
- Parsing is **fallible by design** — it always returns a `Result`, never panics or silently produces wrong data.
- Because `.parse()` is generic, the compiler needs a type hint: use the turbofish (`::<T>`) or a variable type annotation.
- You can implement `FromStr` for your own types to get free, idiomatic `"text".parse::<MyType>()` support.
