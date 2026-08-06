# `serde`

> **Level 16 — Ecosystem & Tooling**
> The de facto standard serialization and deserialization framework in the Rust ecosystem — using procedural derive macros (`Serialize`, `Deserialize`) to convert Rust data structures to and from JSON, TOML, YAML, Postcard, Bincode, and MessagePack with zero runtime reflection overhead.

---

## 1. Prerequisites


- [Zero-Cost Abstractions](../level_15/zero_cost_abstractions.md) — Compile-time serialization code generation without runtime reflection.

---

## 2. Term Category



**Rust Ecosystem Crate (serialization and deserialization framework)**: `serde` (short for **SER**ialization / **DE**serialization) is Rust's premier data serialization library. Unlike Java or JavaScript (which rely on heavy runtime reflection or `JSON.parse` parsing overhead), `serde` generates specialized, zero-cost monomorphized serialization code at compile time.



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In traditional languages:
- **Runtime Reflection** (Java/C#): Inspects object field metadata at runtime, leading to slow serialization, high memory garbage collection, and missing type-safety checks.
- **Tightly Coupled Formatters**: Writing separate parser code for JSON, XML, and TOML forces developers to duplicate data structures or maintain separate DTOs.

`serde` decouples data structures from data formats:
1. **Format-Agnostic Core**: Data structures implement `Serialize` and `Deserialize` once.
2. **Pluggable Data Formats**: The exact same struct can be serialized to JSON (`serde_json`), TOML (`toml`), YAML (`serde_yaml`), or binary (`bincode`) without modifying a single line of struct definition!
3. **Zero-Cost Compile-Time Code**: Derive macros generate dedicated visitor code at compile time, matching the speed of hand-written binary parsers.

### (2) Code Examples

#### Basic JSON Serialization and Deserialization

```rust
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Debug, PartialEq)]
pub struct UserProfile {
    pub username: String,
    pub age: u32,
    pub is_active: bool,
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let user = UserProfile {
        username: String::from("ferris"),
        age: 10,
        is_active: true,
    };

    // 1. Serialize Rust struct to JSON string
    let json_str = serde_json::to_string(&user)?;
    println!("Serialized JSON: {}", json_str);
    // Output: {"username":"ferris","age":10,"is_active":true}

    // 2. Deserialize JSON string back to Rust struct
    let deserialized_user: UserProfile = serde_json::from_str(&json_str)?;
    assert_eq!(user, deserialized_user);
    println!("Deserialization verified!");

    Ok(())
}
```

#### Field Renaming and Attributes

```rust
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")] // Converts `first_name` -> `firstName` in JSON
pub struct ApiResponse {
    pub first_name: String,
    
    #[serde(rename = "user_id")] // Custom override for specific field
    pub id: u64,

    #[serde(skip_serializing_if = "Option::is_none")] // Omit null fields
    pub email: Option<String>,
}

fn main() {
    let resp = ApiResponse {
        first_name: String::from("Alice"),
        id: 101,
        email: None,
    };

    let json = serde_json::to_string_pretty(&resp).unwrap();
    println!("Renamed JSON output:\n{}", json);
}
```

---

## 4. Common Mistakes & Pitfalls
### Mistake 2: Deserializing Untrusted Data Without Bounds Checking or Depth Limits

**The mistake:** Deserializing arbitrary JSON/BSON payloads into unbounded collections (`Vec<T>`).

**Why it's wrong:** Malicious payloads with millions of nested arrays can trigger stack overflow or out-of-memory crashes (OOM denial of service).

*Fix:* Validate payload sizes and use `serde_json::Deserializer::disable_recursion_limit` controls when appropriate.

### Mistake 3: Using Derived `Serialize` / `Deserialize` on Types Holding Borrowed References Without Lifetime Bounds

**The mistake:** Deriving `Deserialize` on borrowed structs without specifying `'de` lifetime bounds.

**Why it's wrong:** Rust's zero-copy deserialization requires tying reference fields to the input payload lifetime `'de`.

*Fix:* Use `struct MyData<'a> { field: &'a str }` with `#[derive(Deserialize)]`.


### Mistake 1: Forgetting `features = ["derive"]` in `Cargo.toml`

**The mistake:** Adding `serde = "1.0"` to `Cargo.toml` without enabling the `"derive"` feature, causing `#[derive(Serialize, Deserialize)]` to fail compilation.

*Fix:*
```toml
# Cargo.toml
[dependencies]
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
```

---

## 5. Practice Exercises

### Exercise 1: Custom Serializer & Deserializer for Network Telemetry Payload

**Scenario:** In a network IoT telemetry microservice, sensor readings arrive as JSON strings. However, external wire formats differ from internal domain representations:
1. `device_mac`: Stored internally as `[u8; 6]`, but represented in JSON as a colon-separated uppercase hexadecimal string (e.g., `"00:1A:2B:3C:4D:5E"`).
2. `status`: Stored internally as an enum `DeviceStatus` (`Ok`, `Warning`, `Error`), but incoming JSON may use case-insensitive strings like `"ok"`, `"WARNING"`, or `"Error"`.

Implement custom Serde helper modules `mac_format` and `status_format` using Serde's `Serializer`, `Deserializer`, and `de::Visitor` traits. Apply them to `SensorTelemetry` with `#[serde(with = "...")]`, and write unit tests with assertions verifying serialization output, case-insensitive string parsing, and invalid MAC address error handling.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use serde::{de, Deserialize, Deserializer, Serialize, Serializer};
> use std::fmt;
> 
> #[derive(Debug, PartialEq, Eq, Clone, Copy)]
> pub enum DeviceStatus {
>     Ok,
>     Warning,
>     Error,
> }
> 
> pub mod status_format {
>     use super::*;
> 
>     pub fn serialize<S>(status: &DeviceStatus, serializer: S) -> Result<S::Ok, S::Error>
>     where
>         S: Serializer,
>     {
>         let s = match status {
>             DeviceStatus::Ok => "OK",
>             DeviceStatus::Warning => "WARNING",
>             DeviceStatus::Error => "ERROR",
>         };
>         serializer.serialize_str(s)
>     }
> 
>     pub fn deserialize<'de, D>(deserializer: D) -> Result<DeviceStatus, D::Error>
>     where
>         D: Deserializer<'de>,
>     {
>         struct DeviceStatusVisitor;
> 
>         impl<'de> de::Visitor<'de> for DeviceStatusVisitor {
>             type Value = DeviceStatus;
> 
>             fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
>                 formatter.write_str("a case-insensitive status string ('ok', 'warning', 'error')")
>             }
> 
>             fn visit_str<E>(self, value: &str) -> Result<DeviceStatus, E>
>             where
>                 E: de::Error,
>             {
>                 match value.to_lowercase().as_str() {
>                     "ok" => Ok(DeviceStatus::Ok),
>                     "warning" => Ok(DeviceStatus::Warning),
>                     "error" => Ok(DeviceStatus::Error),
>                     _ => Err(de::Error::custom(format!("unknown device status: {}", value))),
>                 }
>             }
>         }
> 
>         deserializer.deserialize_str(DeviceStatusVisitor)
>     }
> }
> 
> pub mod mac_format {
>     use super::*;
> 
>     pub fn serialize<S>(mac: &[u8; 6], serializer: S) -> Result<S::Ok, S::Error>
>     where
>         S: Serializer,
>     {
>         let hex_str = format!(
>             "{:02X}:{:02X}:{:02X}:{:02X}:{:02X}:{:02X}",
>             mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]
>         );
>         serializer.serialize_str(&hex_str)
>     }
> 
>     pub fn deserialize<'de, D>(deserializer: D) -> Result<[u8; 6], D::Error>
>     where
>         D: Deserializer<'de>,
>     {
>         struct MacVisitor;
> 
>         impl<'de> de::Visitor<'de> for MacVisitor {
>             type Value = [u8; 6];
> 
>             fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
>                 formatter.write_str("a MAC address string formatted as XX:XX:XX:XX:XX:XX")
>             }
> 
>             fn visit_str<E>(self, v: &str) -> Result<[u8; 6], E>
>             where
>                 E: de::Error,
>             {
>                 let parts: Vec<&str> = v.split(':').collect();
>                 if parts.len() != 6 {
>                     return Err(de::Error::custom("invalid MAC format: expected 6 hex byte pairs"));
>                 }
>                 let mut bytes = [0u8; 6];
>                 for (i, part) in parts.iter().enumerate() {
>                     bytes[i] = u8::from_str_radix(part, 16)
>                         .map_err(|_| de::Error::custom("invalid hexadecimal character in MAC address"))?;
>                 }
>                 Ok(bytes)
>             }
>         }
> 
>         deserializer.deserialize_str(MacVisitor)
>     }
> }
> 
> #[derive(Debug, Serialize, Deserialize, PartialEq)]
> pub struct SensorTelemetry {
>     #[serde(with = "mac_format")]
>     pub device_mac: [u8; 6],
>     #[serde(with = "status_format")]
>     pub status: DeviceStatus,
>     pub temperature: f32,
>     pub timestamp_ms: u64,
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_telemetry_serialization() {
>         let telemetry = SensorTelemetry {
>             device_mac: [0x00, 0x1A, 0x2B, 0x3C, 0x4D, 0x5E],
>             status: DeviceStatus::Ok,
>             temperature: 23.5,
>             timestamp_ms: 1700000000000,
>         };
> 
>         let json = serde_json::to_string(&telemetry).unwrap();
>         assert!(json.contains(r#""device_mac":"00:1A:2B:3C:4D:5E""#));
>         assert!(json.contains(r#""status":"OK""#));
> 
>         let deserialized: SensorTelemetry = serde_json::from_str(&json).unwrap();
>         assert_eq!(telemetry, deserialized);
>     }
> 
>     #[test]
>     fn test_case_insensitive_status_deserialization() {
>         let json_input = r#"{
>             "device_mac": "AA:BB:CC:DD:EE:FF",
>             "status": "warning",
>             "temperature": 85.0,
>             "timestamp_ms": 1700000050000
>         }"#;
> 
>         let parsed: SensorTelemetry = serde_json::from_str(json_input).unwrap();
>         assert_eq!(parsed.status, DeviceStatus::Warning);
>         assert_eq!(parsed.device_mac, [0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF]);
>     }
> 
>     #[test]
>     fn test_invalid_mac_error() {
>         let bad_json = r#"{
>             "device_mac": "INVALID_MAC",
>             "status": "OK",
>             "temperature": 20.0,
>             "timestamp_ms": 1000
>         }"#;
> 
>         let result: Result<SensorTelemetry, _> = serde_json::from_str(bad_json);
>         assert!(result.is_err());
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **`#[serde(with = "module")]` Attribute:** Tells Serde to look inside `mac_format` and `status_format` for `serialize` and `deserialize` functions matching standard signatures (`fn serialize<S>(&T, S) -> Result<S::Ok, S::Error>` and `fn deserialize<'de, D>(D) -> Result<T, D::Error>`).
> 2. **Visitor Pattern (`de::Visitor`):** Serde uses stack-allocated visitor structs to consume token streams from the deserializer without heap allocation overhead. The `visit_str` callback inspects string values and parses them into domain types (`[u8; 6]` or `DeviceStatus`).
> 3. **Custom Error Generation (`de::Error::custom`):** Maps domain conversion errors (such as invalid hexadecimal string length or digits) into format-agnostic Serde errors during deserialization.
> 
---

### Exercise 2: Zero-Copy Deserialization with `&'a str` & `Cow<'a, str>`

**Scenario:** High-performance network proxies and embedded telemetry processors cannot afford heap allocation overhead (`String` allocation) for every string field during payload deserialization. Serde supports zero-copy deserialization by borrowing string slices directly from the input buffer slice (`&'a str` or `std::borrow::Cow<'a, str>`).

Implement a `PacketHeader<'a>` struct borrowing `source_ip: &'a str` and `endpoint: Cow<'a, str>` with `#[serde(borrow)]`. Write unit tests utilizing memory pointer comparison (`as_ptr()`) to prove that unescaped JSON text fields borrow directly from the input buffer slice without allocating memory, and demonstrate how string escape sequences force fallback to `Cow::Owned`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use serde::Deserialize;
> use std::borrow::Cow;
> 
> #[derive(Debug, Deserialize, PartialEq)]
> pub struct PacketHeader<'a> {
>     pub source_ip: &'a str,
>     #[serde(borrow)]
>     pub endpoint: Cow<'a, str>,
>     pub payload_checksum: u32,
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_zero_copy_deserialization_pointer_equality() {
>         // Input JSON string buffer in memory
>         let json_data = r#"{"source_ip":"192.168.1.100","endpoint":"/api/v1/telemetry","payload_checksum":3735928559}"#;
> 
>         // Deserialize zero-copy packet borrowing from `json_data`
>         let packet: PacketHeader = serde_json::from_str(json_data).unwrap();
> 
>         assert_eq!(packet.source_ip, "192.168.1.100");
>         assert_eq!(packet.endpoint, "/api/v1/telemetry");
>         assert_eq!(packet.payload_checksum, 0xDEADBEEF);
> 
>         // 1. Verify zero-copy pointer bounds: source_ip slice points inside json_data buffer!
>         let raw_bytes = json_data.as_bytes();
>         let field_bytes = packet.source_ip.as_bytes();
>         
>         assert!(field_bytes.as_ptr() >= raw_bytes.as_ptr());
>         assert!(field_bytes.as_ptr() < unsafe { raw_bytes.as_ptr().add(raw_bytes.len()) });
> 
>         // 2. Verify Cow variant: Unescaped string creates Cow::Borrowed
>         match packet.endpoint {
>             Cow::Borrowed(slice) => {
>                 assert!(slice.as_ptr() >= raw_bytes.as_ptr());
>             }
>             Cow::Owned(_) => panic!("Expected Cow::Borrowed for unescaped JSON string"),
>         }
>     }
> 
>     #[test]
>     fn test_cow_owned_fallback_on_escaped_string() {
>         // Escaped JSON string (\n sequence) requires allocating an unescaped String buffer
>         let escaped_json = r#"{"source_ip":"10.0.0.1","endpoint":"/api/v1/\nlog","payload_checksum":100}"#;
> 
>         let packet: PacketHeader = serde_json::from_str(escaped_json).unwrap();
>         
>         assert_eq!(packet.endpoint, "/api/v1/\nlog");
>         
>         // String escape handling forces Serde to instantiate Cow::Owned
>         match packet.endpoint {
>             Cow::Owned(_) => { /* Successfully verified dynamic allocation fallback */ }
>             Cow::Borrowed(_) => panic!("Expected Cow::Borrowed due to string escape sequence"),
>         }
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Lifetime Binding (`'a`):** Tying `PacketHeader<'a>` to the input string lifetime allows Serde to deserialize `&'a str` by returning a slice (`&json_data[start..end]`) directly from the input buffer.
> 2. **`#[serde(borrow)]` Attribute:** Explicitly signals to Serde that `Cow<'a, str>` should attempt borrowing from the deserializer's input string buffer (`Deserializer<'de>`) whenever possible.
> 3. **`Cow<'a, str>` Allocation Fallback:** When JSON strings contain escape sequences (e.g. `\n`, `\"`, `\uXXXX`), Serde cannot borrow a contiguous slice from the raw input and automatically switches from `Cow::Borrowed` to `Cow::Owned(String)`.
> 
---

### Exercise 3: Polymorphic API Payload Parsing via Tagged Enums & Defaults

**Scenario:** Message bus consumers (e.g. Kafka or RabbitMQ event handlers) receive heterogeneous event envelopes containing static metadata headers (`event_id`, `timestamp`) alongside dynamic, polymorphic payloads depending on an `event_type` field.
1. Design an `EventEnvelope` containing `event_id: String`, `timestamp: u64`, and a flattened `payload: EventPayload`.
2. `EventPayload` is an enum using adjacent tagging (`#[serde(tag = "event_type", content = "data")]`) supporting variants: `Telemetry` (`temperature: f64`, `humidity: f64`), `UserAction` (`user_id: u64`, `action: String`), and `SystemAlert` (`severity: String`, `message: String`, `retries_count: u32`).
3. Apply `#[serde(default)]` to `SystemAlert` so missing payload fields fall back to `Default` trait values without failing deserialization. Write comprehensive unit tests verifying polymorphic round-trip serialization and default fallback behavior.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use serde::{Deserialize, Serialize};
> 
> #[derive(Debug, Serialize, Deserialize, PartialEq)]
> pub struct TelemetryData {
>     pub temperature: f64,
>     pub humidity: f64,
> }
> 
> #[derive(Debug, Serialize, Deserialize, PartialEq)]
> pub struct UserAction {
>     pub user_id: u64,
>     pub action: String,
> }
> 
> #[derive(Debug, Serialize, Deserialize, PartialEq)]
> #[serde(default)]
> pub struct SystemAlert {
>     pub severity: String,
>     pub message: String,
>     pub retries_count: u32,
> }
> 
> impl Default for SystemAlert {
>     fn default() -> Self {
>         Self {
>             severity: "INFO".to_string(),
>             message: "No details provided".to_string(),
>             retries_count: 0,
>         }
>     }
> }
> 
> #[derive(Debug, Serialize, Deserialize, PartialEq)]
> #[serde(tag = "event_type", content = "data")]
> pub enum EventPayload {
>     #[serde(rename = "telemetry")]
>     Telemetry(TelemetryData),
>     #[serde(rename = "user_action")]
>     UserAction(UserAction),
>     #[serde(rename = "system_alert")]
>     SystemAlert(SystemAlert),
> }
> 
> #[derive(Debug, Serialize, Deserialize, PartialEq)]
> pub struct EventEnvelope {
>     pub event_id: String,
>     pub timestamp: u64,
>     #[serde(flatten)]
>     pub payload: EventPayload,
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_telemetry_event_roundtrip() {
>         let event = EventEnvelope {
>             event_id: "evt-1001".to_string(),
>             timestamp: 1700000000,
>             payload: EventPayload::Telemetry(TelemetryData {
>                 temperature: 24.5,
>                 humidity: 55.0,
>             }),
>         };
> 
>         let json = serde_json::to_string_pretty(&event).unwrap();
>         assert!(json.contains(r#""event_type": "telemetry""#));
> 
>         let deserialized: EventEnvelope = serde_json::from_str(&json).unwrap();
>         assert_eq!(event, deserialized);
>     }
> 
>     #[test]
>     fn test_system_alert_with_default_fallback() {
>         // Incoming JSON omits retries_count field
>         let raw_json = r#"{
>             "event_id": "evt-1002",
>             "timestamp": 1700000050,
>             "event_type": "system_alert",
>             "data": {
>                 "severity": "CRITICAL",
>                 "message": "High memory usage detected"
>             }
>         }"#;
> 
>         let event: EventEnvelope = serde_json::from_str(raw_json).unwrap();
>         
>         if let EventPayload::SystemAlert(alert) = event.payload {
>             assert_eq!(alert.severity, "CRITICAL");
>             assert_eq!(alert.message, "High memory usage detected");
>             assert_eq!(alert.retries_count, 0); // Default trait value filled in!
>         } else {
>             panic!("Expected EventPayload::SystemAlert variant");
>         }
>     }
> 
>     #[test]
>     fn test_user_action_deserialization() {
>         let raw_json = r#"{
>             "event_id": "evt-1003",
>             "timestamp": 1700000100,
>             "event_type": "user_action",
>             "data": {
>                 "user_id": 42,
>                 "action": "LOGIN"
>             }
>         }"#;
> 
>         let event: EventEnvelope = serde_json::from_str(raw_json).unwrap();
>         assert_eq!(
>             event.payload,
>             EventPayload::UserAction(UserAction {
>                 user_id: 42,
>                 action: "LOGIN".to_string()
>             })
>         );
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Adjacent Enum Tagging (`#[serde(tag = "...", content = "...")]`):** Encodes enum variants into structured JSON objects with a discriminator tag field (e.g. `"event_type": "telemetry"`) and a separate content key (`"data": { ... }`).
> 2. **`#[serde(flatten)]`:** Inlines fields of nested structs or enums into the outer JSON object, allowing `event_type` and `data` to reside at the top-level of `EventEnvelope`.
> 3. **`#[serde(default)]` Fallback:** When deserializing a struct with missing fields, Serde invokes the struct's `Default::default()` implementation to fill missing values without aborting deserialization with missing key errors.
> 
---


## 6. Related Terms

- None!

---

## 7. Key Takeaways

- `serde` is the de facto serialization/deserialization framework for Rust.
- It decouples data structures (`Serialize`/`Deserialize`) from data formats (`serde_json`, `toml`, `bincode`).
- Serialization code is generated at compile time via derive macros, incurring zero runtime reflection overhead.
- Enable `features = ["derive"]` in `Cargo.toml` to use `#[derive(Serialize, Deserialize)]`.
