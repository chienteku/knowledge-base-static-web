# Type Annotation

> **Level 1 — Foundations**
> Explicitly specifying a type, e.g. `let x: i32 = 5;`.

---

## 1. Prerequisites

- [Variable](../level_01/variable.md) — The named bindings that you attach type annotations to.
- [Type Inference](../level_01/type_inference.md) — The compiler's automatic guessing of types, which annotations override.

---

## 2. Term Category

**Rust-nonspecific**: Present in almost all statically-typed languages (like C++, Java, and TypeScript) as the primary way to define the shape and constraints of data.

---

## 3. Explanation

### (1) Design Motivation — "Why does this exist in programming languages?"

While [Type Inference](../level_01/type_inference.md) is incredibly powerful and saves you from typing redundant code, it isn't magic. There are times when the compiler simply cannot guess what type of data you want, or the context is too ambiguous. Furthermore, as programs grow larger, relying purely on the compiler's guesses can make the code hard for *humans* to read.

**Type Annotation** is the syntax you use to manually declare the exact type of a variable or a function's input/output. You do this by placing a colon (`:`) followed by the type name after your variable. By requiring explicit annotations in critical boundaries—like function signatures—Rust guarantees that the "contract" between different parts of your code is strictly enforced and clearly documented.

### (2) Reality Metaphor

Think of type annotation as putting a **specific job title on a help-wanted sign**. 

If you just hang a sign that says *"Looking for a worker,"* the intent is ambiguous (this is like an ambiguous type). Are you looking for a plumber, an accountant, or a chef? 

By adding an annotation—*"Looking for a worker: **Electrician**"*—you strictly filter the candidates. If a plumber tries to apply (assigning the wrong data type), they are immediately rejected.

### (3) Rust Code Examples

#### Short Snippet
```rust
// The `: i32` is the type annotation telling Rust this is a 32-bit integer.
let player_score: i32 = 100;

// The `: bool` tells Rust this is a boolean (true/false).
let is_game_over: bool = false;
```

#### Fuller Example
```rust
// Rust STRICTLY requires type annotations for function parameters and return types.
// The compiler refuses to guess here to ensure the contract is perfectly clear.
fn multiply(a: i32, b: i32) -> i32 {
    a * b
}

fn main() {
    // Here, we voluntarily use a type annotation for readability, 
    // even though the compiler could probably guess it.
    let base_damage: f64 = 15.5;
    
    let raw_input = "42";
    
    // Here, type annotation is MANDATORY. 
    // `.parse()` can turn a string into almost any number type. 
    // Without `: u32`, the compiler has no idea what you want it parsed into.
    let parsed_age: u32 = raw_input.parse().unwrap();
    
    println!("Parsed age: {}", parsed_age);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting annotations on function parameters

**The mistake:** Trying to rely on type inference when defining a new function.

**Why it's wrong:** In some languages, you can get away with this, but Rust's compiler is intentionally designed to stop inferring at function boundaries. This ensures that a mistake inside a function doesn't accidentally change the type signature of the function, which could break code everywhere else in the project.

*Incorrect:*
```rust
// ERROR: expected type, found `x`
fn square(x) { 
    x * x
}
```

*Fix:*
```rust
// Explicitly annotate the parameter and the return type (`-> i32`)
fn square(x: i32) -> i32 { 
    x * x
}
```

### Mistake 2: Annotating a type that contradicts the assigned value

**The mistake:** Giving a variable an annotation but assigning it data of a completely different type.

**Why it's wrong:** The compiler will prioritize your annotation as the absolute truth. If the data doesn't match the truth, it throws an error immediately.

*Incorrect:*
```rust
let active_users: u32 = "Five"; // ERROR: expected `u32`, found `&str`
```

*Fix:*
```rust
let active_users: u32 = 5;
```

---

### Mistake 3: Concurrent Access to Type Annotation Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Type Annotation instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: High-Frequency Financial Transaction Packet Parser

**Problem Scenario:**
In a high-frequency trading (HFT) ingestion engine, raw text logs received over TCP sockets must be parsed into strongly-typed transaction records. A single log entry contains comma-separated fields: `"transaction_id,timestamp_ns,amount_cents,side"`.

Key requirements:
1. `transaction_id` must be explicitly annotated as `u64`.
2. `timestamp_ns` (nanosecond epoch) must be explicitly annotated as `u64`.
3. `amount_cents` (fixed-point cents representation to avoid floating-point rounding errors) must be explicitly annotated as `u128`.
4. `side` must be mapped to an `OrderSide` enum (`Buy` or `Sell`).

Because methods like `str::parse()` and `Iterator::collect()` are generic, Rust cannot infer target types without type annotations, raising compile error `E0282: type annotations needed`. You must use explicit variable annotations (`let id: u64 = ...`) or turbofish syntax (`parse::<u64>()`) to guide the compiler.

Implement `parse_transaction_log(raw_log: &str) -> Result<Transaction, ParseError>` to robustly parse log records and return structured domain models or typed errors (`ParseError`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq, Clone, Copy)]
> pub enum OrderSide {
>     Buy,
>     Sell,
> }
> 
> #[derive(Debug, PartialEq, Eq, Clone)]
> pub struct Transaction {
>     pub transaction_id: u64,
>     pub timestamp_ns: u64,
>     pub amount_cents: u128,
>     pub side: OrderSide,
> }
> 
> #[derive(Debug, PartialEq, Eq, Clone)]
> pub enum ParseError {
>     InvalidFieldCount(usize),
>     InvalidId(String),
>     InvalidTimestamp(String),
>     InvalidAmount(String),
>     InvalidSide(String),
> }
> 
> pub fn parse_transaction_log(raw_log: &str) -> Result<Transaction, ParseError> {
>     let fields: Vec<&str> = raw_log.trim().split(',').collect();
>     if fields.len() != 4 {
>         return Err(ParseError::InvalidFieldCount(fields.len()));
>     }
> 
>     let transaction_id: u64 = fields[0]
>         .trim()
>         .parse::<u64>()
>         .map_err(|_| ParseError::InvalidId(fields[0].to_string()))?;
> 
>     let timestamp_ns: u64 = fields[1]
>         .trim()
>         .parse::<u64>()
>         .map_err(|_| ParseError::InvalidTimestamp(fields[1].to_string()))?;
> 
>     let amount_cents: u128 = fields[2]
>         .trim()
>         .parse::<u128>()
>         .map_err(|_| ParseError::InvalidAmount(fields[2].to_string()))?;
> 
>     let side: OrderSide = match fields[3].trim().to_uppercase().as_str() {
>         "BUY" => OrderSide::Buy,
>         "SELL" => OrderSide::Sell,
>         _ => return Err(ParseError::InvalidSide(fields[3].to_string())),
>     };
> 
>     Ok(Transaction {
>         transaction_id,
>         timestamp_ns,
>         amount_cents,
>         side,
>     })
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_valid_transaction_parsing() {
>         let log: &str = "100492,1625097600000000000,5000250,BUY";
>         let parsed: Result<Transaction, ParseError> = parse_transaction_log(log);
> 
>         assert!(parsed.is_ok());
>         let tx: Transaction = parsed.unwrap();
> 
>         assert_eq!(tx.transaction_id, 100492_u64);
>         assert_eq!(tx.timestamp_ns, 1625097600000000000_u64);
>         assert_eq!(tx.amount_cents, 5000250_u128);
>         assert_eq!(tx.side, OrderSide::Buy);
>         assert_ne!(tx.side, OrderSide::Sell);
>     }
> 
>     #[test]
>     fn test_invalid_field_count() {
>         let log: &str = "100492,1625097600000000000,5000250";
>         let result: Result<Transaction, ParseError> = parse_transaction_log(log);
>         assert!(matches!(result, Err(ParseError::InvalidFieldCount(3))));
>     }
> 
>     #[test]
>     fn test_invalid_id_and_side() {
>         let bad_id: &str = "invalid_id,1625097600000000000,5000250,BUY";
>         let result_id: Result<Transaction, ParseError> = parse_transaction_log(bad_id);
>         assert!(matches!(result_id, Err(ParseError::InvalidId(_))));
> 
>         let bad_side: &str = "100492,1625097600000000000,5000250,HOLD";
>         let result_side: Result<Transaction, ParseError> = parse_transaction_log(bad_side);
>         assert!(matches!(result_side, Err(ParseError::InvalidSide(_))));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Type Disambiguation via Annotations**:
>    - Method `.parse()` is generic over `std::str::FromStr`. Calling `"100492".parse()` without a target type annotation causes compiler error `E0282` because string content can be parsed into `u8`, `u64`, `u128`, `i32`, or custom types. Specifying `let transaction_id: u64 = fields[0].parse::<u64>()?` provides the concrete target type to the monomorphizer.
>    - Similarly, `Iterator::collect()` works with any type implementing `FromIterator`. Annotating `let fields: Vec<&str> = raw_log.trim().split(',').collect();` forces `collect()` to materialize a `Vec<&str>`.
>
> 2. **Financial Data Invariants & Overflow Control**:
>    - Using `u128` for `amount_cents` accommodates high-volume fixed-point financial transactions up to $3.4 \times 10^{36}$, completely eliminating floating-point rounding inaccuracies inherent to `f32`/`f64`.
>    - Strong enum typing (`OrderSide`) guarantees at compile-time that invalid string values like `"HOLD"` or `"CANCEL"` cannot leak into trade processing downstream.
>
> 3. **Ownership and Lifetime Guarantees**:
>    - The input `raw_log: &str` is borrowed for splitting. String slices `&str` reference segments of the input without dynamic heap allocation. Converted values (`u64`, `u128`, `OrderSide`) implement `Copy` and are allocated directly on the stack inside `Transaction`.
>

---

### Exercise 2: Binary Network Telemetry Frame Decoder & Bitmask Engine

**Problem Scenario:**
An IoT micro-controller transmits binary telemetry over UDP socket buffers (`&[u8]`). Each binary telemetry frame consists of:
- Bytes `0..2`: Magic Header `0xA5C3` (Big-Endian `u16`)
- Bytes `2..6`: Device Identification Number (Big-Endian `u32`)
- Byte `6`: Bitmask status flags (`u8`: Bit 0 = Online, Bit 1 = Alarm, Bit 2 = Calibrated)
- Bytes `7..9`: Payload byte length `N` (Big-Endian `u16`)
- Bytes `9..9+N`: IEEE-754 floating-point sensor metric values (sequence of Big-Endian `f32` numbers, 4 bytes each)

When converting byte slices `&[u8]` into fixed-size byte arrays (`[u8; 2]`, `[u8; 4]`) using `TryInto::try_into` and transforming iterator chunks into primitive vectors (`Vec<f32>`), Rust's type inferencer requires explicit type annotations to resolve array target lengths and slice transformations.

Implement `decode_telemetry_frame(buffer: &[u8]) -> Result<TelemetryFrame, TelemetryParseError>` using explicit annotations across primitive arrays, scalar variables, closure signatures, and collection accumulators.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::convert::TryInto;
> 
> #[derive(Debug, PartialEq, Eq, Clone, Copy)]
> pub struct DeviceStatus {
>     pub is_online: bool,
>     pub is_alarm_active: bool,
>     pub is_calibrated: bool,
> }
> 
> #[derive(Debug, PartialEq, Clone)]
> pub struct TelemetryFrame {
>     pub magic_header: u16,
>     pub device_id: u32,
>     pub status: DeviceStatus,
>     pub sensor_readings: Vec<f32>,
> }
> 
> #[derive(Debug, PartialEq, Eq, Clone)]
> pub enum TelemetryParseError {
>     BufferTooShort { required: usize, actual: usize },
>     InvalidMagicHeader(u16),
>     PayloadMismatch { expected_bytes: usize, actual_bytes: usize },
> }
> 
> pub fn decode_telemetry_frame(buffer: &[u8]) -> Result<TelemetryFrame, TelemetryParseError> {
>     const HEADER_SIZE: usize = 2 + 4 + 1 + 2; // 9 bytes header
>     if buffer.len() < HEADER_SIZE {
>         return Err(TelemetryParseError::BufferTooShort {
>             required: HEADER_SIZE,
>             actual: buffer.len(),
>         });
>     }
> 
>     let magic_bytes: [u8; 2] = buffer[0..2]
>         .try_into()
>         .map_err(|_| TelemetryParseError::BufferTooShort { required: 2, actual: buffer.len() })?;
>     let magic_header: u16 = u16::from_be_bytes(magic_bytes);
> 
>     if magic_header != 0xA5C3 {
>         return Err(TelemetryParseError::InvalidMagicHeader(magic_header));
>     }
> 
>     let device_bytes: [u8; 4] = buffer[2..6]
>         .try_into()
>         .map_err(|_| TelemetryParseError::BufferTooShort { required: 6, actual: buffer.len() })?;
>     let device_id: u32 = u32::from_be_bytes(device_bytes);
> 
>     let raw_flags: u8 = buffer[6];
>     let status: DeviceStatus = DeviceStatus {
>         is_online: (raw_flags & 0b0000_0001) != 0,
>         is_alarm_active: (raw_flags & 0b0000_0010) != 0,
>         is_calibrated: (raw_flags & 0b0000_0100) != 0,
>     };
> 
>     let payload_len_bytes: [u8; 2] = buffer[7..9]
>         .try_into()
>         .map_err(|_| TelemetryParseError::BufferTooShort { required: 9, actual: buffer.len() })?;
>     let payload_len: u16 = u16::from_be_bytes(payload_len_bytes);
>     let expected_payload_bytes: usize = payload_len as usize;
> 
>     let payload_buffer: &[u8] = &buffer[9..];
>     if payload_buffer.len() != expected_payload_bytes || expected_payload_bytes % 4 != 0 {
>         return Err(TelemetryParseError::PayloadMismatch {
>             expected_bytes: expected_payload_bytes,
>             actual_bytes: payload_buffer.len(),
>         });
>     }
> 
>     let sensor_readings: Vec<f32> = payload_buffer
>         .chunks_exact(4)
>         .map(|chunk: &[u8]| -> f32 {
>             let float_bytes: [u8; 4] = chunk.try_into().unwrap();
>             f32::from_be_bytes(float_bytes)
>         })
>         .collect::<Vec<f32>>();
> 
>     Ok(TelemetryFrame {
>         magic_header,
>         device_id,
>         status,
>         sensor_readings,
>     })
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_valid_telemetry_frame_decoding() {
>         let mut buffer: Vec<u8> = Vec::new();
>         buffer.extend_from_slice(&0xA5C3_u16.to_be_bytes());
>         buffer.extend_from_slice(&42001_u32.to_be_bytes());
>         buffer.push(0b0000_0101); // online + calibrated
>         buffer.extend_from_slice(&8_u16.to_be_bytes()); // 8 bytes payload (2 x f32)
>         buffer.extend_from_slice(&23.5_f32.to_be_bytes());
>         buffer.extend_from_slice(&98.6_f32.to_be_bytes());
> 
>         let frame_result: Result<TelemetryFrame, TelemetryParseError> = decode_telemetry_frame(&buffer);
>         assert!(frame_result.is_ok());
> 
>         let frame: TelemetryFrame = frame_result.unwrap();
>         assert_eq!(frame.magic_header, 0xA5C3_u16);
>         assert_eq!(frame.device_id, 42001_u32);
>         assert_eq!(frame.status.is_online, true);
>         assert_eq!(frame.status.is_alarm_active, false);
>         assert_eq!(frame.status.is_calibrated, true);
>         assert_eq!(frame.sensor_readings.len(), 2);
>         assert_eq!(frame.sensor_readings[0], 23.5_f32);
>         assert_ne!(frame.sensor_readings[1], 0.0_f32);
>     }
> 
>     #[test]
>     fn test_header_too_short_and_invalid_magic() {
>         let short_buffer: [u8; 4] = [0xA5, 0xC3, 0x00, 0x01];
>         let result_short: Result<TelemetryFrame, TelemetryParseError> = decode_telemetry_frame(&short_buffer);
>         assert!(matches!(result_short, Err(TelemetryParseError::BufferTooShort { .. })));
> 
>         let bad_magic_buffer: Vec<u8> = vec![0x12, 0x34, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00];
>         let result_magic: Result<TelemetryFrame, TelemetryParseError> = decode_telemetry_frame(&bad_magic_buffer);
>         assert!(matches!(result_magic, Err(TelemetryParseError::InvalidMagicHeader(0x1234))));
>     }
> 
>     #[test]
>     fn test_payload_mismatch() {
>         let mut buffer: Vec<u8> = Vec::new();
>         buffer.extend_from_slice(&0xA5C3_u16.to_be_bytes());
>         buffer.extend_from_slice(&100_u32.to_be_bytes());
>         buffer.push(0b0000_0001);
>         buffer.extend_from_slice(&8_u16.to_be_bytes());
>         buffer.extend_from_slice(&12.0_f32.to_be_bytes()); // only 4 bytes provided
> 
>         let result: Result<TelemetryFrame, TelemetryParseError> = decode_telemetry_frame(&buffer);
>         assert!(matches!(result, Err(TelemetryParseError::PayloadMismatch { expected_bytes: 8, actual_bytes: 4 })));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Slice-to-Array Conversion and Sizing Annotations**:
>    - In Rust, array types include their fixed size in the type signature (e.g., `[u8; 2]` vs `[u8; 4]`). `TryInto::try_into` converts dynamically-sized slices `&[u8]` into fixed-size byte array references. Annotating `let magic_bytes: [u8; 2] = buffer[0..2].try_into()?;` specifies the array bound to the compiler, enabling stack-allocated fixed-size decoding without heap allocations.
>
> 2. **Endianness Conversion Invariants**:
>    - Primitives like `u16::from_be_bytes(magic_bytes)`, `u32::from_be_bytes(device_bytes)`, and `f32::from_be_bytes(float_bytes)` consume fixed-size byte arrays and perform zero-overhead byte-swapping on little-endian hardware (x86_64/ARM64).
>
> 3. **Bitmask Extraction & Safety**:
>    - Bitwise AND operations (`(raw_flags & 0b0000_0001) != 0`) convert `u8` status byte flags into strongly typed `bool` struct fields (`DeviceStatus`), safeguarding calling application code from invalid bit states.
>
> 4. **Closure and Iterator Type Annotations**:
>    - When iterating with `chunks_exact(4)`, annotating closure parameters `.map(|chunk: &[u8]| -> f32 { ... })` and calling `.collect::<Vec<f32>>()` explicitly defines the intermediate mapping and final collection type, preventing compilation ambiguity.
>

---

### Exercise 3: System Metrics Aggregator & Tagged Query Engine

**Problem Scenario:**
A microservice monitoring platform collects structured log strings formatted as key-value pairs separated by commas:
`"service=auth_db,latency_ms=12.5,requests=1500"`
`"service=api_gateway,latency_ms=4.0,requests=8200"`
`"service=auth_db,latency_ms=17.5,requests=2100"`

The monitoring daemon needs to parse these log records into a typed `MetricsSummary` containing:
- `total_requests`: `u64` (sum total requests across all services)
- `service_latencies`: `HashMap<String, Vec<f64>>` (mapping service names to historical latency vectors in milliseconds)
- `average_latencies`: `HashMap<String, f64>` (calculated mean latency for each microservice)

When populating nested collection structures like `HashMap<String, Vec<f64>>` and computing aggregations with iterator helper traits (`.sum::<f64>()`), Rust's type checker requires explicit annotations on local map variables, closure signatures, and primitive casts.

Implement `aggregate_metrics(records: &[&str]) -> Result<MetricsSummary, MetricParseError>` to parse log slices and compute aggregated latency statistics.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::HashMap;
> 
> #[derive(Debug, PartialEq, Clone)]
> pub struct MetricsSummary {
>     pub total_requests: u64,
>     pub service_latencies: HashMap<String, Vec<f64>>,
>     pub average_latencies: HashMap<String, f64>,
> }
> 
> #[derive(Debug, PartialEq, Eq, Clone)]
> pub enum MetricParseError {
>     MalformedLine(String),
>     MissingKey(String),
>     InvalidNumber(String),
> }
> 
> pub fn aggregate_metrics(records: &[&str]) -> Result<MetricsSummary, MetricParseError> {
>     let mut total_requests: u64 = 0;
>     let mut service_latencies: HashMap<String, Vec<f64>> = HashMap::new();
> 
>     for record in records {
>         let trimmed: &str = record.trim();
>         if trimmed.is_empty() {
>             continue;
>         }
> 
>         let pairs: Vec<&str> = trimmed.split(',').collect::<Vec<&str>>();
>         let mut kv_map: HashMap<&str, &str> = HashMap::new();
> 
>         for pair in pairs {
>             let parts: Vec<&str> = pair.split('=').collect::<Vec<&str>>();
>             if parts.len() != 2 {
>                 return Err(MetricParseError::MalformedLine(pair.to_string()));
>             }
>             kv_map.insert(parts[0].trim(), parts[1].trim());
>         }
> 
>         let service_name: &str = kv_map
>             .get("service")
>             .copied()
>             .ok_or_else(|| MetricParseError::MissingKey("service".to_string()))?;
> 
>         let latency_str: &str = kv_map
>             .get("latency_ms")
>             .copied()
>             .ok_or_else(|| MetricParseError::MissingKey("latency_ms".to_string()))?;
> 
>         let requests_str: &str = kv_map
>             .get("requests")
>             .copied()
>             .ok_or_else(|| MetricParseError::MissingKey("requests".to_string()))?;
> 
>         let latency: f64 = latency_str
>             .parse::<f64>()
>             .map_err(|_| MetricParseError::InvalidNumber(latency_str.to_string()))?;
> 
>         let requests: u64 = requests_str
>             .parse::<u64>()
>             .map_err(|_| MetricParseError::InvalidNumber(requests_str.to_string()))?;
> 
>         total_requests += requests;
>         service_latencies
>             .entry(service_name.to_string())
>             .or_insert_with(|| Vec::<f64>::new())
>             .push(latency);
>     }
> 
>     let mut average_latencies: HashMap<String, f64> = HashMap::new();
>     for (service, latencies) in &service_latencies {
>         let sum: f64 = latencies.iter().sum::<f64>();
>         let count: f64 = latencies.len() as f64;
>         let avg: f64 = if count > 0.0 { sum / count } else { 0.0 };
>         average_latencies.insert(service.clone(), avg);
>     }
> 
>     Ok(MetricsSummary {
>         total_requests,
>         service_latencies,
>         average_latencies,
>     })
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_valid_metrics_aggregation() {
>         let logs: [&str; 3] = [
>             "service=auth_db,latency_ms=12.5,requests=1500",
>             "service=api_gateway,latency_ms=4.0,requests=8200",
>             "service=auth_db,latency_ms=17.5,requests=2100",
>         ];
> 
>         let summary_res: Result<MetricsSummary, MetricParseError> = aggregate_metrics(&logs);
>         assert!(summary_res.is_ok());
> 
>         let summary: MetricsSummary = summary_res.unwrap();
>         assert_eq!(summary.total_requests, 11800_u64);
> 
>         let auth_latencies: Option<&Vec<f64>> = summary.service_latencies.get("auth_db");
>         assert!(auth_latencies.is_some());
>         assert_eq!(auth_latencies.unwrap().len(), 2);
> 
>         let auth_avg: f64 = *summary.average_latencies.get("auth_db").unwrap();
>         assert_eq!(auth_avg, 15.0_f64);
> 
>         let api_avg: f64 = *summary.average_latencies.get("api_gateway").unwrap();
>         assert_eq!(api_avg, 4.0_f64);
>         assert_ne!(auth_avg, api_avg);
>     }
> 
>     #[test]
>     fn test_missing_key_error() {
>         let bad_logs: [&str; 1] = ["service=auth_db,requests=1500"];
>         let result: Result<MetricsSummary, MetricParseError> = aggregate_metrics(&bad_logs);
>         assert!(matches!(result, Err(MetricParseError::MissingKey(_))));
>     }
> 
>     #[test]
>     fn test_invalid_number_error() {
>         let bad_logs: [&str; 1] = ["service=auth_db,latency_ms=fast,requests=1500"];
>         let result: Result<MetricsSummary, MetricParseError> = aggregate_metrics(&bad_logs);
>         assert!(matches!(result, Err(MetricParseError::InvalidNumber(_))));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Nested Collection Type Annotations**:
>    - Instantiating complex collections (`let mut service_latencies: HashMap<String, Vec<f64>> = HashMap::new();`) mandates explicit type parameter annotations (`K = String`, `V = Vec<f64>`). Without explicit annotations on `HashMap::new()`, Rust cannot infer the value type `Vec<f64>` until the first insertion point. Explicitly annotating variable declaration ensures clear type contracts for reader clarity and compiler type checking.
>
> 2. **Numeric Cast Invariants & Precision**:
>    - Latencies are parsed as floating-point `f64` values to support high-precision sub-millisecond durations.
>    - Summing latencies via `latencies.iter().sum::<f64>()` utilizes turbofish type annotation `::<f64>` to inform `std::iter::Sum` of the target summation accumulator type. Converting collection length `latencies.len() as f64` ensures type-safe floating-point division without silent integer truncation.
>
> 3. **Error Isolation & Type-Safe Result Boundaries**:
>    - Converting missing keys or malformed strings into strongly-typed `MetricParseError` variants ensures callers receive precise operational diagnostic information rather than unhandled standard library panics.
>

---

## 6. Related Terms

- [Type Inference](../level_01/type_inference.md) — The compiler's automatic behavior that type annotation manually overrides.
- [`fn`](../level_01/fn.md) — Function declarations, the one place where type annotations are strictly mandatory.
- [Scalar Types](../level_01/scalar_types.md) — The primitive types (like `i32`, `f64`, `bool`) you will frequently use in your annotations.

---

## 7. Key Takeaways

- Type annotations manually define the type of a variable using the syntax `variable: type`.
- You must use them when the compiler is confused or a method is ambiguous (like `.parse()`).
- Rust strictly **requires** type annotations on all function parameters and return types to keep code boundaries safe and predictable.
- You can voluntarily use annotations on variables just to make your code easier for other humans to read.
