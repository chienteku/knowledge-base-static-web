# Struct

> **Level 2 — Control Flow & Data Structures**
> A custom data type grouping named fields (`struct Point { x: f64, y: f64 }`).

---

## 1. Prerequisites

- [Variable](../level_01/variable.md) — You bind an instance of a struct to a variable using `let`.
- [Compound Types](../level_01/compound_types.md) — Structs are essentially Tuples where every piece of data has a strict name.

---

## 2. Term Category

**Rust-nonspecific**: Structs (short for structures) exist in many languages like C, C++, and Go. In Rust, they are the primary way to define custom data types and serve as the replacement for "Classes" found in Object-Oriented languages like Java or Python.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

When building applications, you constantly need to group related pieces of data together. For example, if you want to represent a "User", you could use a standard Tuple: `("Alice", "Smith", 28)`. But accessing data via `user.0`, `user.1`, and `user.2` is confusing. If you accidentally swap the first and last name, the compiler won't catch it.

A **Struct** solves this problem. It allows you to create a brand new, custom data type where every piece of data is neatly organized into a named **field**. Instead of `user.0`, you get to write `user.first_name` and `user.age`. This makes your code infinitely more readable, maintainable, and type-safe.

Note: Rust does not have traditional "Classes". Instead, Rust separates data from behavior. You use **Structs** to define the data, and later you will learn to use [`impl` Blocks](../level_02/impl_block.md) to define the behavior (methods).

### (2) Reality Metaphor

A Struct is like a **Custom DMV Form**. 

When you apply for a driver's license, they don't hand you a blank piece of paper and say "write down your information." They give you a specifically designed form with labeled boxes: "First Name", "Date of Birth", and "Eye Color". 

Defining a `struct` is like creating the **blueprint** for that blank form. Creating an *instance* of a struct is like filling out that form with your specific personal information and handing it back.

### (3) Rust Code Examples

#### Short Snippet (Definition and Instantiation)
```rust
// 1. Define the blueprint (the Struct)
struct User {
    username: String,
    age: u32,
    active: bool,
}

fn main() {
    // 2. Create an instance (fill out the form)
    let my_user = User {
        username: String::from("maverick"),
        age: 32,
        active: true,
    }; // Don't forget the semicolon here!

    // 3. Access fields using dot notation
    println!("User {} is {} years old.", my_user.username, my_user.age);
}
```

#### Fuller Example (Mutability and Update Syntax)
```rust
struct Point {
    x: f64,
    y: f64,
}

fn main() {
    // To change a field, the ENTIRE struct instance must be mutable.
    let mut location = Point { x: 0.0, y: 0.0 };
    
    // We can now update the fields
    location.x = 10.5;
    location.y = 20.0;
    
    // "Struct Update Syntax"
    // We can quickly create a new struct by copying the fields of an old one.
    // We override `y`, but copy `x` from `location`.
    let new_location = Point {
        y: 50.0,
        ..location
    };
    
    println!("New location: ({}, {})", new_location.x, new_location.y);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Struct Scoping and Lifecycle Rules

**The mistake:** Assuming Struct instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("struct_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("struct_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Struct State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Struct through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Struct Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Struct instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: High-Performance Network Protocol Data Unit (PDU) Frame Assembler

**Scenario**: In a high-throughput network service, incoming byte streams must be transformed into structured protocol frames (`Header` and `Packet`). You need to design named structs to capture frame headers and payload data, implement constructors using field initialization shorthand, perform frame validation against binary constraints, and create response acknowledgement frames using Rust's struct update syntax (`..`).

**Requirements**:
1. Define a `Header` struct with fields:
   - `magic: [u8; 2]` (fixed magic bytes `[0xAA, 0x55]`)
   - `version: u8` (protocol version number, default `1`)
   - `flags: u8` (bitflag representation: `0x01` = encrypted, `0x02` = compressed, `0x04` = priority)
   - `sequence_number: u32` (monotonically increasing sequence number)
   - `payload_len: u16` (byte length of payload)
2. Define a `Packet` struct holding `header: Header` and `payload: Vec<u8>`.
3. Implement `create_packet(sequence_number: u32, flags: u8, payload: Vec<u8>) -> Result<Packet, &'static str>`:
   - Returns `Err("Payload exceeds maximum allowable size of 65535 bytes")` if `payload.len() > u16::MAX as usize`.
   - Constructs `Header` using field init shorthand.
4. Implement `derive_ack_packet(original: Packet, ack_seq: u32) -> Packet`:
   - Generates an acknowledgement packet. The header updates `sequence_number` to `ack_seq`, sets bit 2 (`0x04` priority) in `flags`, resets `payload_len` to `0`, and copies remaining fields from `original.header` using struct update syntax (`..original.header`).
   - The payload of the ACK packet must be an empty `Vec`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Clone)]
> pub struct Header {
>     pub magic: [u8; 2],
>     pub version: u8,
>     pub flags: u8,
>     pub sequence_number: u32,
>     pub payload_len: u16,
> }
> 
> #[derive(Debug, PartialEq, Clone)]
> pub struct Packet {
>     pub header: Header,
>     pub payload: Vec<u8>,
> }
> 
> pub fn create_packet(sequence_number: u32, flags: u8, payload: Vec<u8>) -> Result<Packet, &'static str> {
>     if payload.len() > u16::MAX as usize {
>         return Err("Payload exceeds maximum allowable size of 65535 bytes");
>     }
> 
>     let magic = [0xAA, 0x55];
>     let version = 1;
>     let payload_len = payload.len() as u16;
> 
>     // Field initialization shorthand used for magic, version, flags, sequence_number, payload_len
>     let header = Header {
>         magic,
>         version,
>         flags,
>         sequence_number,
>         payload_len,
>     };
> 
>     Ok(Packet { header, payload })
> }
> 
> pub fn derive_ack_packet(original: Packet, ack_seq: u32) -> Packet {
>     // Struct update syntax copies primitives (magic, version) while overriding specific fields
>     let header = Header {
>         sequence_number: ack_seq,
>         flags: original.header.flags | 0x04,
>         payload_len: 0,
>         ..original.header
>     };
> 
>     Packet {
>         header,
>         payload: Vec::new(),
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_valid_packet_creation() {
>         let payload = vec![0xDE, 0xAD, 0xBE, 0xEF];
>         let packet_res = create_packet(101, 0x01, payload.clone());
>         assert!(packet_res.is_ok());
> 
>         let packet = packet_res.unwrap();
>         assert_eq!(packet.header.magic, [0xAA, 0x55]);
>         assert_eq!(packet.header.version, 1);
>         assert_eq!(packet.header.sequence_number, 101);
>         assert_eq!(packet.header.flags, 0x01);
>         assert_eq!(packet.header.payload_len, 4);
>         assert_eq!(packet.payload, payload);
>     }
> 
>     #[test]
>     fn test_oversized_payload_rejection() {
>         let large_payload = vec![0u8; 65536];
>         let packet_res = create_packet(102, 0x00, large_payload);
>         assert!(packet_res.is_err());
>         assert_eq!(
>             packet_res.unwrap_err(),
>             "Payload exceeds maximum allowable size of 65535 bytes"
>         );
>     }
> 
>     #[test]
>     fn test_derive_ack_packet_with_struct_update() {
>         let payload = vec![1, 2, 3];
>         let original = create_packet(1, 0x01, payload).unwrap();
>         let ack = derive_ack_packet(original, 200);
> 
>         assert_eq!(ack.header.sequence_number, 200);
>         assert_eq!(ack.header.flags, 0x05); // 0x01 | 0x04
>         assert_eq!(ack.header.payload_len, 0);
>         assert_eq!(ack.header.magic, [0xAA, 0x55]);
>         assert!(ack.payload.is_empty());
>         assert_ne!(ack.header.sequence_number, 1);
>         assert!(matches!(ack.header.version, 1));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Field Initialization Shorthand**: In `create_packet`, local variables (`magic`, `version`, `flags`, `sequence_number`, `payload_len`) match the field names of `Header`. Rust allows `Header { magic, version, ... }` instead of repeating `magic: magic`, reducing boilerplate while enforcing compile-time type safety.
> 2. **Struct Update Syntax (`..`) Semantics**: In `derive_ack_packet`, `..original.header` initializes unmentioned fields (`magic`, `version`) by copying them from `original.header`. Since all fields of `Header` derive `Copy` (arrays of primitives and integers), struct update syntax operates via cheap memory copies without moving heap data.
> 3. **Ownership and Value Lifetimes**: `derive_ack_packet` takes `original` by value (consuming ownership). The original `payload` (a heap-allocated `Vec<u8>`) is dropped when `original` goes out of scope at the end of `derive_ack_packet`, ensuring zero memory leaks while constructing a minimal ACK frame.
> 4. **Edge Cases**: Payload bound checking enforces protocol specifications by verifying length against `u16::MAX`. Passing values exceeding 65,535 bytes yields an `Err` result before any memory allocation or struct field assignment takes place.

---

### Exercise 2: Financial Market Data Engine Order State Auditor

**Scenario**: An order management system (OMS) processes high-frequency stock orders. Regulatory compliance requires generating immutable audit log snapshots whenever an order is partially or fully executed, or cloned for auditing. You must implement order creation, partial/full execution state transitions, and snapshot cloning while observing Rust ownership rules for heap-allocated string identifiers versus `Copy` numeric fields.

**Requirements**:
1. Define an `Order` struct:
   - `order_id: String`
   - `trader_id: String`
   - `symbol: String`
   - `price_cents: u64`
   - `total_quantity: u32`
   - `filled_quantity: u32`
   - `is_active: bool`
2. Implement `create_order(order_id: String, trader_id: String, symbol: String, price_cents: u64, total_quantity: u32) -> Order`:
   - Instantiates an active order with `filled_quantity: 0` and `is_active: true`.
3. Implement `execute_fill(mut order: Order, fill_qty: u32) -> Result<Order, &'static str>`:
   - Returns `Err("Fill quantity exceeds total order quantity")` if `filled_quantity + fill_qty > total_quantity`.
   - Increments `filled_quantity`. Sets `is_active = false` if `filled_quantity == total_quantity`.
4. Implement `clone_as_audit_snapshot(order: &Order, new_order_id: String) -> Order`:
   - Creates a snapshot order with a new `order_id`. Explicitly clones heap-allocated string fields (`trader_id`, `symbol`) while copying primitive fields (`price_cents`, `total_quantity`, `filled_quantity`, `is_active`) via struct update syntax (`..*order`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Clone)]
> pub struct Order {
>     pub order_id: String,
>     pub trader_id: String,
>     pub symbol: String,
>     pub price_cents: u64,
>     pub total_quantity: u32,
>     pub filled_quantity: u32,
>     pub is_active: bool,
> }
> 
> pub fn create_order(
>     order_id: String,
>     trader_id: String,
>     symbol: String,
>     price_cents: u64,
>     total_quantity: u32,
> ) -> Order {
>     Order {
>         order_id,
>         trader_id,
>         symbol,
>         price_cents,
>         total_quantity,
>         filled_quantity: 0,
>         is_active: true,
>     }
> }
> 
> pub fn execute_fill(mut order: Order, fill_qty: u32) -> Result<Order, &'static str> {
>     if order.filled_quantity + fill_qty > order.total_quantity {
>         return Err("Fill quantity exceeds total order quantity");
>     }
> 
>     order.filled_quantity += fill_qty;
>     if order.filled_quantity == order.total_quantity {
>         order.is_active = false;
>     }
> 
>     Ok(order)
> }
> 
> pub fn clone_as_audit_snapshot(order: &Order, new_order_id: String) -> Order {
>     Order {
>         order_id: new_order_id,
>         trader_id: order.trader_id.clone(),
>         symbol: order.symbol.clone(),
>         ..*order
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_order_creation_and_partial_fill() {
>         let order = create_order("ORD-001".into(), "TRD-99".into(), "AAPL".into(), 15000, 100);
>         assert_eq!(order.filled_quantity, 0);
>         assert!(order.is_active);
> 
>         let updated_res = execute_fill(order, 40);
>         assert!(updated_res.is_ok());
> 
>         let updated = updated_res.unwrap();
>         assert_eq!(updated.filled_quantity, 40);
>         assert!(updated.is_active);
>         assert_ne!(updated.filled_quantity, updated.total_quantity);
>     }
> 
>     #[test]
>     fn test_order_complete_fill_deactivation() {
>         let order = create_order("ORD-002".into(), "TRD-99".into(), "GOOG".into(), 280000, 50);
>         let filled_order = execute_fill(order, 50).unwrap();
> 
>         assert_eq!(filled_order.filled_quantity, 50);
>         assert!(!filled_order.is_active);
>         assert!(matches!(filled_order.is_active, false));
>     }
> 
>     #[test]
>     fn test_overfill_rejection() {
>         let order = create_order("ORD-003".into(), "TRD-10".into(), "MSFT".into(), 30000, 20);
>         let res = execute_fill(order, 25);
>         assert!(res.is_err());
>         assert_eq!(res.unwrap_err(), "Fill quantity exceeds total order quantity");
>     }
> 
>     #[test]
>     fn test_audit_snapshot_isolation() {
>         let original = create_order("ORD-100".into(), "TRD-01".into(), "TSLA".into(), 25000, 10);
>         let snapshot = clone_as_audit_snapshot(&original, "AUDIT-100-V1".into());
> 
>         assert_eq!(snapshot.order_id, "AUDIT-100-V1");
>         assert_eq!(snapshot.trader_id, original.trader_id);
>         assert_eq!(snapshot.price_cents, original.price_cents);
>         assert_ne!(snapshot.order_id, original.order_id);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **All-or-Nothing Mutability**: In Rust, mutability applies to the entire struct variable binding (`mut order: Order`). Individual fields cannot be declared `mut` independently inside the struct definition. In `execute_fill`, taking ownership of `mut order` allows modifying `order.filled_quantity` and `order.is_active`.
> 2. **Partial Move vs. Cloning in Struct Update Syntax**: When using struct update syntax (`..*order`) on a struct containing `String` fields, Rust cannot automatically copy non-`Copy` fields. Because `clone_as_audit_snapshot` operates on a shared reference `&Order`, fields that do not implement `Copy` (`trader_id` and `symbol`) must be explicitly `.clone()`ed. The remaining numeric and boolean fields implement `Copy` and are implicitly copied from `*order`.
> 3. **Ownership Transfer in Pipelines**: `execute_fill` consumes the `Order` struct by value and returns a modified `Order`. This move semantics pattern guarantees that stale, pre-fill versions of the order cannot be accidentally accessed or modified elsewhere in the application without explicit compiler error.
> 4. **Edge Cases & Invariants**: The state machine strictly prevents execution fills exceeding `total_quantity`. If an invalid fill is attempted, the error branch preserves safety by returning early without corrupting order state.

---

### Exercise 3: Embedded IoT Sensor Suite Component Aggregator & Destructuring Pipeline

**Scenario**: An industrial IoT edge module collects environmental metrics and hardware diagnostics. To organize telemetry data clean and efficiently, metrics are composed into sub-structs (`SensorMetrics` and `SystemStatus`) inside a top-level `DeviceReport` container. You need to handle nested struct mutation, fault tracking thresholds, and full struct destructuring for data export pipelines.

**Requirements**:
1. Define `SensorMetrics`:
   - `temperature_celsius: f32`
   - `humidity_percentage: f32`
   - `pressure_hpa: f32`
2. Define `SystemStatus`:
   - `battery_millivolts: u16`
   - `error_count: u32`
   - `is_online: bool`
3. Define `DeviceReport`:
   - `device_uuid: String`
   - `timestamp_epoch_secs: u64`
   - `metrics: SensorMetrics`
   - `status: SystemStatus`
4. Implement `build_report(device_uuid: String, timestamp_epoch_secs: u64, metrics: SensorMetrics, status: SystemStatus) -> DeviceReport` using field init shorthand.
5. Implement `record_sensor_error(report: &mut DeviceReport)`:
   - Accesses nested `report.status.error_count` and increments it by 1.
   - If `report.status.error_count >= 5`, sets `report.status.is_online = false`.
6. Implement `decompose_report(report: DeviceReport) -> (String, SensorMetrics, SystemStatus)`:
   - Destructures `report` into its component fields (`device_uuid`, `metrics`, `status`), ignoring `timestamp_epoch_secs` with `_`. Returns the tuple `(device_uuid, metrics, status)`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Clone)]
> pub struct SensorMetrics {
>     pub temperature_celsius: f32,
>     pub humidity_percentage: f32,
>     pub pressure_hpa: f32,
> }
> 
> #[derive(Debug, PartialEq, Clone)]
> pub struct SystemStatus {
>     pub battery_millivolts: u16,
>     pub error_count: u32,
>     pub is_online: bool,
> }
> 
> #[derive(Debug, PartialEq, Clone)]
> pub struct DeviceReport {
>     pub device_uuid: String,
>     pub timestamp_epoch_secs: u64,
>     pub metrics: SensorMetrics,
>     pub status: SystemStatus,
> }
> 
> pub fn build_report(
>     device_uuid: String,
>     timestamp_epoch_secs: u64,
>     metrics: SensorMetrics,
>     status: SystemStatus,
> ) -> DeviceReport {
>     DeviceReport {
>         device_uuid,
>         timestamp_epoch_secs,
>         metrics,
>         status,
>     }
> }
> 
> pub fn record_sensor_error(report: &mut DeviceReport) {
>     report.status.error_count += 1;
>     if report.status.error_count >= 5 {
>         report.status.is_online = false;
>     }
> }
> 
> pub fn decompose_report(report: DeviceReport) -> (String, SensorMetrics, SystemStatus) {
>     let DeviceReport {
>         device_uuid,
>         metrics,
>         status,
>         timestamp_epoch_secs: _,
>     } = report;
> 
>     (device_uuid, metrics, status)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_device_report_construction() {
>         let metrics = SensorMetrics {
>             temperature_celsius: 23.5,
>             humidity_percentage: 45.0,
>             pressure_hpa: 1013.25,
>         };
>         let status = SystemStatus {
>             battery_millivolts: 3300,
>             error_count: 0,
>             is_online: true,
>         };
> 
>         let report = build_report("DEV-8829".into(), 1600000000, metrics.clone(), status.clone());
> 
>         assert_eq!(report.device_uuid, "DEV-8829");
>         assert_eq!(report.timestamp_epoch_secs, 1600000000);
>         assert_eq!(report.metrics, metrics);
>         assert_eq!(report.status.battery_millivolts, 3300);
>         assert!(report.status.is_online);
>     }
> 
>     #[test]
>     fn test_record_sensor_error_threshold() {
>         let metrics = SensorMetrics {
>             temperature_celsius: 85.0,
>             humidity_percentage: 10.0,
>             pressure_hpa: 990.0,
>         };
>         let status = SystemStatus {
>             battery_millivolts: 3100,
>             error_count: 4,
>             is_online: true,
>         };
> 
>         let mut report = build_report("DEV-ERR".into(), 1600000100, metrics, status);
>         assert_eq!(report.status.error_count, 4);
> 
>         record_sensor_error(&mut report);
> 
>         assert_eq!(report.status.error_count, 5);
>         assert!(!report.status.is_online);
>         assert_ne!(report.status.is_online, true);
>         assert!(matches!(report.status.is_online, false));
>     }
> 
>     #[test]
>     fn test_decompose_report_destructuring() {
>         let metrics = SensorMetrics {
>             temperature_celsius: 20.0,
>             humidity_percentage: 50.0,
>             pressure_hpa: 1012.0,
>         };
>         let status = SystemStatus {
>             battery_millivolts: 3200,
>             error_count: 1,
>             is_online: true,
>         };
> 
>         let report = build_report("DEV-DEC".into(), 1600000200, metrics.clone(), status.clone());
>         let (uuid, m, s) = decompose_report(report);
> 
>         assert_eq!(uuid, "DEV-DEC");
>         assert_eq!(m.temperature_celsius, 20.0);
>         assert_eq!(s.error_count, 1);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Struct Composition & Sub-field Access**: Structs can be composed arbitrarily. Accessing nested struct fields (`report.status.error_count`) follows standard dot notation. In Rust, dereferencing through references (such as `&mut DeviceReport`) happens automatically via the `.` operator (auto-dereferencing).
> 2. **Struct Destructuring & Partial Move**: `decompose_report` uses pattern matching on `DeviceReport` (`let DeviceReport { device_uuid, metrics, status, timestamp_epoch_secs: _ } = report;`). This moves `device_uuid`, `metrics`, and `status` out of `report`. The parent `report` struct is partially moved and cannot be used after destructuring. The `_` wild card ignores `timestamp_epoch_secs` without binding it.
> 3. **Exclusive Borrowing for Mutation**: `record_sensor_error` accepts `&mut DeviceReport`. Rust's borrow checker ensures that while `record_sensor_error` holds an exclusive reference to `report`, no other part of the program can read or mutate any field inside `DeviceReport` or its nested `SystemStatus` struct.
> 4. **Memory Layout**: Nested structs in Rust are laid out contiguously in memory by default unless wrapped in pointers like `Box` or `Arc`. The total size of `DeviceReport` on the stack is the sum of its aligned field sizes plus padding, keeping data localized for CPU cache efficiency.

---

## 6. Related Terms

- [Tuple Struct](../level_02/tuple_struct.md) — A specialized struct that has a name, but its fields do not (they are accessed via `.0`, `.1`).
- [`impl` Block](../level_02/impl_block.md) — The mechanism you use to attach functions and methods directly to a struct.

---

## 7. Key Takeaways

- Use `struct` to group related data into named fields (Rust's version of a Data Class).
- Access data fields using dot notation (e.g., `user.username`).
- **Mutability is all-or-nothing.** You must declare the instance as `let mut` to modify any of its fields.
- You can easily construct a new instance based on an existing one using struct update syntax (`..old_instance`).
