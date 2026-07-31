# `Result<T, E>`

> **Level 2 — Control Flow & Data Structures**
> An enum (`Ok(T)` / `Err(E)`) for recoverable error handling.

---

## 1. Prerequisites

- [Enum](../level_02/enum.md) — `Result` is a standard Enum built into the Rust standard library.
- [`Option<T>`](../level_02/option_t.md) — The sister type to `Result`, used for *missing* data rather than *failed* operations.
- [`match`](../level_02/match.md) — The primary tool used to check if a `Result` succeeded or failed.

---

## 2. Term Category

**Rust-specific (the safety)**: Rust completely removes the concept of `try / catch` blocks and Exceptions. Instead, any function that can fail simply returns the `Result<T, E>` enum, forcing the developer to handle errors predictably and explicitly.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In older languages like Java, C#, or Python, errors are handled by "throwing Exceptions". This design has two major flaws:
1. **Invisibility**: By looking at a function signature like `int divide(a, b)`, you have no idea if it might throw an Exception and crash.
2. **Forgetfulness**: If you forget to wrap a risky function in a `try/catch` block, your program will crash at runtime.

Rust's designers wanted errors to be visible, predictable, and impossible to ignore. Therefore, Rust uses an Enum called `Result`. If a function might fail, it is forced to return a `Result` type. It has two variants:
- `Ok(value)` — The operation succeeded, here is your data.
- `Err(error_info)` — The operation failed, here is why.

Because `Result` is an Enum, the compiler **forces you** to handle both the `Ok` case and the `Err` case (usually via `match`). You cannot accidentally ignore a failure, making Rust programs incredibly stable.

### (2) Reality Metaphor

Imagine ordering a package online.

In a language with Exceptions, the delivery driver either hands you your package, or they secretly plant a landmine on your porch. If you open your front door without wearing a bomb squad suit (`try/catch`), the landmine explodes and you die (program crash).

In Rust, the delivery driver always hands you a transparent lockbox (the `Result` enum). You look inside the lockbox: it either contains your item (`Ok`), or it contains an apology note explaining why the delivery failed (`Err`). You cannot touch the item without first opening the lockbox and acknowledging the note.

### (3) Rust Code Examples

#### Short Snippet (The Definition)
You don't need to define `Result` yourself; it's built into the language. It looks like this:
```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

Because it's so common, Rust automatically imports `Ok` and `Err` for you.
```rust
let success: Result<i32, String> = Ok(200);
let failure: Result<i32, String> = Err(String::from("Database offline"));
```

#### Fuller Example (Handling the Result)
```rust
// A function that can fail returns a `Result`
fn divide(numerator: f64, denominator: f64) -> Result<f64, String> {
    if denominator == 0.0 {
        // Return the Error variant
        Err(String::from("Cannot divide by zero!"))
    } else {
        // Return the Success variant
        Ok(numerator / denominator)
    }
}

fn main() {
    let outcome = divide(10.0, 0.0);
    
    // We MUST use pattern matching to extract the answer
    match outcome {
        Ok(answer) => println!("The answer is: {}", answer),
        Err(error_msg) => println!("Task failed: {}", error_msg),
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Result T E Scoping and Lifecycle Rules

**The mistake:** Assuming Result T E instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("result_t_e_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("result_t_e_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Result T E State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Result T E through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Result T E Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Result T E instances across OS threads via `std::thread::spawn`.

**Why it's wrong:** Traits that do not implement `Send` or `Sync` marker traits cannot safely cross thread boundaries. The compiler prevents data races by raising compile errors `E0277` (`trait Send is not implemented`).

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

### Exercise 1: Financial Payment Gateway Transaction Parser & Batch Evaluator

**Scenario:** A fintech payment gateway receives raw transaction records from external banking webhooks in CSV format (`"TX_ID,AMOUNT_CENTS,CURRENCY"`). Because external input is untrusted, parsing can fail at multiple stages: invalid field count, malformed transaction prefix (must start with `"TX_"`), invalid or non-positive integer amounts, or unsupported currency codes (only `"USD"`, `"EUR"`, and `"GBP"` are supported).

**Task:**
1. Define a domain error type `PaymentError` with variants:
   - `InvalidFormat`
   - `InvalidTxId`
   - `InvalidAmount(String)`
   - `UnsupportedCurrency(String)`
2. Define a struct `PaymentTransaction` with fields `tx_id: String`, `amount_cents: u64`, and `currency: String`.
3. Implement `parse_payment(raw: &str) -> Result<PaymentTransaction, PaymentError>` using pattern matching and `Result` mapping combinators like `map_err`.
4. Implement `process_batch(records: &[&str]) -> (Vec<PaymentTransaction>, Vec<PaymentError>)` that partitions a list of raw string records into valid transactions and encountered errors.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq)]
> pub enum PaymentError {
>     InvalidFormat,
>     InvalidTxId,
>     InvalidAmount(String),
>     UnsupportedCurrency(String),
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct PaymentTransaction {
>     pub tx_id: String,
>     pub amount_cents: u64,
>     pub currency: String,
> }
> 
> pub fn parse_payment(raw: &str) -> Result<PaymentTransaction, PaymentError> {
>     let parts: Vec<&str> = raw.split(',').map(|s| s.trim()).collect();
>     if parts.len() != 3 {
>         return Err(PaymentError::InvalidFormat);
>     }
> 
>     let tx_id = parts[0];
>     if !tx_id.starts_with("TX_") || tx_id.len() <= 3 {
>         return Err(PaymentError::InvalidTxId);
>     }
> 
>     let amount_cents: u64 = parts[1]
>         .parse::<u64>()
>         .map_err(|_| PaymentError::InvalidAmount(parts[1].to_string()))?;
> 
>     if amount_cents == 0 {
>         return Err(PaymentError::InvalidAmount(
>             "Amount must be greater than zero".to_string(),
>         ));
>     }
> 
>     let currency = parts[2];
>     match currency {
>         "USD" | "EUR" | "GBP" => {}
>         _ => return Err(PaymentError::UnsupportedCurrency(currency.to_string())),
>     }
> 
>     Ok(PaymentTransaction {
>         tx_id: tx_id.to_string(),
>         amount_cents,
>         currency: currency.to_string(),
>     })
> }
> 
> pub fn process_batch(records: &[&str]) -> (Vec<PaymentTransaction>, Vec<PaymentError>) {
>     let mut successes = Vec::new();
>     let mut failures = Vec::new();
> 
>     for record in records {
>         match parse_payment(record) {
>             Ok(tx) => successes.push(tx),
>             Err(err) => failures.push(err),
>         }
>     }
> 
>     (successes, failures)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_valid_payment_parsing() {
>         let raw = "TX_9901, 15000, USD";
>         let res = parse_payment(raw);
>         assert!(res.is_ok());
>         let tx = res.unwrap();
>         assert_eq!(tx.tx_id, "TX_9901");
>         assert_eq!(tx.amount_cents, 15000);
>         assert_eq!(tx.currency, "USD");
>     }
> 
>     #[test]
>     fn test_invalid_format_and_id() {
>         let bad_format = "TX_9901,15000";
>         assert_eq!(parse_payment(bad_format), Err(PaymentError::InvalidFormat));
> 
>         let bad_id = "INVALID_9901,15000,USD";
>         assert_eq!(parse_payment(bad_id), Err(PaymentError::InvalidTxId));
>     }
> 
>     #[test]
>     fn test_amount_and_currency_errors() {
>         let parse_err = parse_payment("TX_10, -500, USD");
>         assert!(matches!(parse_err, Err(PaymentError::InvalidAmount(_))));
> 
>         let zero_err = parse_payment("TX_10, 0, USD");
>         assert_eq!(
>             zero_err,
>             Err(PaymentError::InvalidAmount("Amount must be greater than zero".to_string()))
>         );
> 
>         let curr_err = parse_payment("TX_10, 500, JPY");
>         assert_eq!(curr_err, Err(PaymentError::UnsupportedCurrency("JPY".to_string())));
>         assert_ne!(curr_err, Err(PaymentError::UnsupportedCurrency("USD".to_string())));
>     }
> 
>     #[test]
>     fn test_process_batch() {
>         let records = vec![
>             "TX_1, 100, USD",
>             "INVALID",
>             "TX_2, 200, EUR",
>             "TX_3, 0, GBP",
>         ];
>         let (successes, failures) = process_batch(&records);
>         assert_eq!(successes.len(), 2);
>         assert_eq!(failures.len(), 2);
>         assert_eq!(successes[0].tx_id, "TX_1");
>         assert_eq!(failures[0], PaymentError::InvalidFormat);
>         assert!(matches!(failures[1], PaymentError::InvalidAmount(_)));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
>
>
> 1. **Structured Error Hierarchy**: Returning a domain-specific `PaymentError` enum instead of a generic `String` or `panic!` allows callers to programmatically inspect failure reasons. Rust requires all enum variants to be exhaustively handled during pattern matching.
> 2. **Error Translation with `map_err`**: The `str::parse::<u64>()` method returns a `Result<u64, ParseIntError>`. We map standard library errors into domain errors using `.map_err(|_| PaymentError::InvalidAmount(...))`.
> 3. **Ownership and Lifetime Boundaries**: `parse_payment` accepts a borrowed slice `&str` (`raw`). When creating the owned `PaymentTransaction`, string fields are converted into owned `String` objects via `.to_string()`, ensuring the output struct outlives the input string slice.
> 4. **Batch Processing Pattern**: `process_batch` demonstrates how `Result` instances can be collected or split without aborting execution on the first error encountered, a standard requirement for robust stream parsing pipelines.

---

### Exercise 2: Binary Frame Packet Decoder with Checksum Validation & Chained Combinators

**Scenario:** A low-level telemetry ingestion worker receives binary byte streams over network sockets. Packets follow a fixed header structure:
- **Bytes 0..2**: Magic byte header `0xA5`, `0x5A`.
- **Bytes 2..4**: Big-endian `u16` specifying payload byte length $N$.
- **Bytes 4..(4+N)**: Raw payload bytes.
- **Byte (4+N)**: XOR checksum byte of all bytes preceding the checksum (header + length + payload).

**Task:**
1. Define a `PacketError` enum covering failure modes:
   - `BufferTooShort { required: usize, actual: usize }`
   - `InvalidMagicHeader([u8; 2])`
   - `ChecksumMismatch { expected: u8, calculated: u8 }`
   - `PayloadExceedsLimit(usize)`
   - `InvalidPayloadUtf8(String)`
2. Implement `decode_packet(bytes: &[u8]) -> Result<Packet, PacketError>`.
3. Implement `decode_and_extract_text(bytes: &[u8]) -> Result<String, PacketError>` using `.and_then()` to chain binary packet decoding with UTF-8 string extraction.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq)]
> pub enum PacketError {
>     BufferTooShort { required: usize, actual: usize },
>     InvalidMagicHeader([u8; 2]),
>     ChecksumMismatch { expected: u8, calculated: u8 },
>     PayloadExceedsLimit(usize),
>     InvalidPayloadUtf8(String),
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct Packet {
>     pub payload: Vec<u8>,
> }
> 
> pub fn decode_packet(bytes: &[u8]) -> Result<Packet, PacketError> {
>     const MIN_HEADER_LEN: usize = 5; // 2 magic + 2 len + 1 checksum
>     if bytes.len() < MIN_HEADER_LEN {
>         return Err(PacketError::BufferTooShort {
>             required: MIN_HEADER_LEN,
>             actual: bytes.len(),
>         });
>     }
> 
>     let magic = [bytes[0], bytes[1]];
>     if magic != [0xA5, 0x5A] {
>         return Err(PacketError::InvalidMagicHeader(magic));
>     }
> 
>     let payload_len = u16::from_be_bytes([bytes[2], bytes[3]]) as usize;
>     if payload_len > 1024 {
>         return Err(PacketError::PayloadExceedsLimit(payload_len));
>     }
> 
>     let total_required = 4 + payload_len + 1;
>     if bytes.len() < total_required {
>         return Err(PacketError::BufferTooShort {
>             required: total_required,
>             actual: bytes.len(),
>         });
>     }
> 
>     let data_to_checksum = &bytes[..4 + payload_len];
>     let calculated_checksum = data_to_checksum.iter().fold(0u8, |acc, &b| acc ^ b);
>     let expected_checksum = bytes[4 + payload_len];
> 
>     if calculated_checksum != expected_checksum {
>         return Err(PacketError::ChecksumMismatch {
>             expected: expected_checksum,
>             calculated: calculated_checksum,
>         });
>     }
> 
>     let payload = bytes[4..4 + payload_len].to_vec();
>     Ok(Packet { payload })
> }
> 
> pub fn decode_and_extract_text(bytes: &[u8]) -> Result<String, PacketError> {
>     decode_packet(bytes).and_then(|pkt| {
>         String::from_utf8(pkt.payload)
>             .map_err(|err| PacketError::InvalidPayloadUtf8(err.to_string()))
>     })
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     fn build_raw_packet(payload: &[u8]) -> Vec<u8> {
>         let mut buf = Vec::new();
>         buf.push(0xA5);
>         buf.push(0x5A);
>         let len_bytes = (payload.len() as u16).to_be_bytes();
>         buf.extend_from_slice(&len_bytes);
>         buf.extend_from_slice(payload);
>         let checksum = buf.iter().fold(0u8, |acc, &b| acc ^ b);
>         buf.push(checksum);
>         buf
>     }
> 
>     #[test]
>     fn test_valid_packet_decoding() {
>         let raw = build_raw_packet(b"hello rust");
>         let res = decode_packet(&raw);
>         assert!(res.is_ok());
>         let pkt = res.unwrap();
>         assert_eq!(pkt.payload, b"hello rust");
>     }
> 
>     #[test]
>     fn test_header_and_short_buffer() {
>         let short = vec![0xA5, 0x5A];
>         assert_eq!(
>             decode_packet(&short),
>             Err(PacketError::BufferTooShort { required: 5, actual: 2 })
>         );
> 
>         let bad_magic = vec![0x11, 0x22, 0x00, 0x00, 0x33];
>         assert_eq!(
>             decode_packet(&bad_magic),
>             Err(PacketError::InvalidMagicHeader([0x11, 0x22]))
>         );
>     }
> 
>     #[test]
>     fn test_checksum_mismatch() {
>         let mut raw = build_raw_packet(b"test");
>         let last_idx = raw.len() - 1;
>         raw[last_idx] ^= 0xFF;
> 
>         let res = decode_packet(&raw);
>         assert!(matches!(res, Err(PacketError::ChecksumMismatch { .. })));
>         if let Err(PacketError::ChecksumMismatch { expected, calculated }) = res {
>             assert_ne!(expected, calculated);
>         } else {
>             panic!("Expected ChecksumMismatch error variant");
>         }
>     }
> 
>     #[test]
>     fn test_decode_and_extract_text_combinator() {
>         let valid_raw = build_raw_packet("Level 2 Result".as_bytes());
>         let text_res = decode_and_extract_text(&valid_raw);
>         assert_eq!(text_res, Ok("Level 2 Result".to_string()));
> 
>         let invalid_utf8_bytes = vec![0xFF, 0xFE, 0xFD];
>         let invalid_utf8_raw = build_raw_packet(&invalid_utf8_bytes);
>         let text_err = decode_and_extract_text(&invalid_utf8_raw);
>         assert!(matches!(text_err, Err(PacketError::InvalidPayloadUtf8(_))));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
>
>
> 1. **Defensive Slice Bounds Checking**: Slicing byte arrays `&bytes[..]` panics at runtime if indices are out of bounds. Checking `bytes.len() < MIN_HEADER_LEN` and `bytes.len() < total_required` explicitly converts potential panics into clean `Result::Err` values (`PacketError::BufferTooShort`).
> 2. **Chaining Operations with `.and_then()`**: The `and_then` combinator takes a closure returning `Result<U, E>` and applies it only if the preceding `Result` is `Ok`. This flattens what would otherwise be nested `match` statements into a single monadic sequence.
> 3. **Conversion of Foreign Errors**: `String::from_utf8` returns `FromUtf8Error`. By calling `.map_err(|err| PacketError::InvalidPayloadUtf8(err.to_string()))`, foreign error types are unified into the module's target error enum.
> 4. **Endianness Safety**: Converting raw multi-byte arrays to numerical fields via `u16::from_be_bytes` ensures architecture-independent binary protocol parsing across big-endian and little-endian systems.

---

### Exercise 3: Multi-Tier Service Configuration Evaluator with Fallback Recovery

**Scenario:** A cloud container bootstrap process configures service instances from environment parameters. Configuration strings contain key-value assignments (`"KEY=VALUE"`). The engine must parse mandatory settings (`NODE_ID`, `TIMEOUT_MS`, `MAX_CONN`) and enforce range bounds. If the primary configuration string fails validation (e.g., due to bad formatting or invalid values), the runtime must seamlessly fall back to a default configuration string using `Result` fallback combinators.

**Task:**
1. Define a struct `Config` with fields `node_id: u32`, `timeout_ms: u64`, and `max_connections: u32`.
2. Define `ConfigError` enum with variants:
   - `MissingField(String)`
   - `ParseIntError { field: String, raw_value: String }`
   - `OutOfBounds { field: String, value: u64, min: u64, max: u64 }`
3. Implement `parse_config(raw: &str) -> Result<Config, ConfigError>`.
4. Implement `load_config_with_fallback(primary_env: &str, secondary_env: &str) -> Result<(Config, bool), ConfigError>` using `.or_else()` to try `primary_env` first and fall back to `secondary_env` if `primary_env` yields an `Err`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::HashMap;
> 
> #[derive(Debug, PartialEq, Eq, Clone)]
> pub struct Config {
>     pub node_id: u32,
>     pub timeout_ms: u64,
>     pub max_connections: u32,
> }
> 
> #[derive(Debug, PartialEq, Eq, Clone)]
> pub enum ConfigError {
>     MissingField(String),
>     ParseIntError { field: String, raw_value: String },
>     OutOfBounds { field: String, value: u64, min: u64, max: u64 },
> }
> 
> pub fn parse_config(raw: &str) -> Result<Config, ConfigError> {
>     let mut map = HashMap::new();
>     for line in raw.lines() {
>         let line = line.trim();
>         if line.is_empty() || line.starts_with('#') {
>             continue;
>         }
>         if let Some((key, val)) = line.split_once('=') {
>             map.insert(key.trim(), val.trim());
>         }
>     }
> 
>     let get_field = |name: &str| -> Result<&str, ConfigError> {
>         map.get(name)
>             .copied()
>             .ok_or_else(|| ConfigError::MissingField(name.to_string()))
>     };
> 
>     let raw_node_id = get_field("NODE_ID")?;
>     let node_id: u32 = raw_node_id.parse().map_err(|_| ConfigError::ParseIntError {
>         field: "NODE_ID".to_string(),
>         raw_value: raw_node_id.to_string(),
>     })?;
>     if node_id < 1 || node_id > 65535 {
>         return Err(ConfigError::OutOfBounds {
>             field: "NODE_ID".to_string(),
>             value: node_id as u64,
>             min: 1,
>             max: 65535,
>         });
>     }
> 
>     let raw_timeout = get_field("TIMEOUT_MS")?;
>     let timeout_ms: u64 = raw_timeout.parse().map_err(|_| ConfigError::ParseIntError {
>         field: "TIMEOUT_MS".to_string(),
>         raw_value: raw_timeout.to_string(),
>     })?;
>     if timeout_ms < 100 || timeout_ms > 60000 {
>         return Err(ConfigError::OutOfBounds {
>             field: "TIMEOUT_MS".to_string(),
>             value: timeout_ms,
>             min: 100,
>             max: 60000,
>         });
>     }
> 
>     let raw_max_conn = get_field("MAX_CONN")?;
>     let max_connections: u32 = raw_max_conn.parse().map_err(|_| ConfigError::ParseIntError {
>         field: "MAX_CONN".to_string(),
>         raw_value: raw_max_conn.to_string(),
>     })?;
>     if max_connections < 1 || max_connections > 10000 {
>         return Err(ConfigError::OutOfBounds {
>             field: "MAX_CONN".to_string(),
>             value: max_connections as u64,
>             min: 1,
>             max: 10000,
>         });
>     }
> 
>     Ok(Config {
>         node_id,
>         timeout_ms,
>         max_connections,
>     })
> }
> 
> pub fn load_config_with_fallback(
>     primary_env: &str,
>     secondary_env: &str,
> ) -> Result<(Config, bool), ConfigError> {
>     parse_config(primary_env)
>         .map(|cfg| (cfg, false))
>         .or_else(|_| parse_config(secondary_env).map(|cfg| (cfg, true)))
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_valid_config_parsing() {
>         let raw = "NODE_ID=101\nTIMEOUT_MS=5000\nMAX_CONN=250";
>         let res = parse_config(raw);
>         assert!(res.is_ok());
>         let cfg = res.unwrap();
>         assert_eq!(cfg.node_id, 101);
>         assert_eq!(cfg.timeout_ms, 5000);
>         assert_eq!(cfg.max_connections, 250);
>     }
> 
>     #[test]
>     fn test_missing_field_and_out_of_bounds() {
>         let missing = "NODE_ID=101\nTIMEOUT_MS=5000";
>         assert_eq!(
>             parse_config(missing),
>             Err(ConfigError::MissingField("MAX_CONN".to_string()))
>         );
> 
>         let oob = "NODE_ID=101\nTIMEOUT_MS=50\nMAX_CONN=250";
>         assert_eq!(
>             parse_config(oob),
>             Err(ConfigError::OutOfBounds {
>                 field: "TIMEOUT_MS".to_string(),
>                 value: 50,
>                 min: 100,
>                 max: 60000,
>             })
>         );
>     }
> 
>     #[test]
>     fn test_fallback_chain() {
>         let invalid_primary = "NODE_ID=invalid\nTIMEOUT_MS=5000\nMAX_CONN=250";
>         let valid_secondary = "NODE_ID=202\nTIMEOUT_MS=1000\nMAX_CONN=500";
> 
>         let res = load_config_with_fallback(invalid_primary, valid_secondary);
>         assert!(res.is_ok());
>         let (cfg, used_fallback) = res.unwrap();
>         assert!(used_fallback);
>         assert_eq!(cfg.node_id, 202);
>         assert_ne!(cfg.node_id, 101);
> 
>         let both_invalid = load_config_with_fallback("BAD=1", "ALSO_BAD=2");
>         assert!(matches!(both_invalid, Err(ConfigError::MissingField(_))));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
>
>
> 1. **Lazy Fallback Evaluation with `.or_else()`**: The `.or_else()` combinator takes a closure that evaluates only when the initial `Result` is an `Err`. This avoids unnecessary computation or secondary I/O if the primary operation succeeds.
> 2. **Option-to-Result Conversion via `.ok_or_else()`**: When retrieving fields from `HashMap::get`, an `Option<&str>` is returned. Converting `Option` to `Result` using `.ok_or_else(|| ConfigError::MissingField(...))` creates a lazy error payload if the value is `None`.
> 3. **The `?` Operator Mechanics**: The `?` operator unwraps `Ok(T)` values or early-returns `Err(E)` values from the current function. This allows sequential validation logic to remain clean while propagating errors instantly.
> 4. **Boundary Validation**: Numerical parsing is complemented by semantic range assertions. Even if string conversion to `u32` succeeds, invalid operational ranges (e.g. timeout < 100ms) yield structured domain errors (`OutOfBounds`).

---

## 6. Related Terms

- [`Option<T>`](../level_02/option_t.md) — The sister enum used for *missing* data, whereas Result is used for *failed* operations.
- [`?` Operator](../level_04/question_mark_operator.md) — (Future reference) The magical syntax sugar that makes working with `Result` incredibly easy by automatically returning errors up the chain.
- [`unwrap()` / `expect()`](../level_04/unwrap_expect.md) — Aggressive methods that intentionally crash the program if a `Result` is an `Err`.

---

## 7. Key Takeaways

- Rust does not use Exceptions (`try/catch`). It uses the `Result<T, E>` enum.
- The variants are `Ok(T)` (success with data) and `Err(E)` (failure with error data).
- The compiler forces you to handle the `Result` (usually with `match` or `if let`) to extract the `Ok` value.
- This design forces you to acknowledge and handle errors gracefully, preventing unexpected runtime crashes.
