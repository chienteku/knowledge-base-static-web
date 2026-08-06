# Crate

> **Level 1 — Foundations**
> A compilation unit in Rust; either a binary (executable) or a library.

---

## 1. Prerequisites


- [Cargo](cargo.md) — Rust's build system and package manager that creates, builds, and manages crates

---

## 2. Term Category



**Rust Compilation Unit (the compilation & distribution atom)**

While every language has some concept of a "compilation unit" (Java has JARs, Go has packages, C has translation units), the *crate* as Rust defines it — a single rooted tree of modules compiled as one atomic unit, with explicit visibility boundaries — is a Rust-specific design. The name itself, "crate," is unique to the Rust ecosystem.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Here's the problem we were staring at.

In C and C++, the "compilation unit" is a single `.c` or `.cpp` file. Each file is compiled independently, and the linker stitches them together at the end. This means the compiler can't see across files during compilation — it can't check types across boundaries, can't optimize globally, and can't enforce visibility rules. Header files attempt to bridge this gap, but they're fragile, duplicated, and a constant source of bugs (include order matters, missing guards cause redefinitions, macros leak everywhere).

We wanted something different. We wanted a compilation unit that was *big enough* to let the compiler see the whole picture — all the types, all the functions, all the visibility rules — in one shot. But not *so* big that it became unwieldy. We needed a Goldilocks unit.

That's the crate.

A crate is the largest unit the Rust compiler processes at once. It starts from a single root file (`src/main.rs` for binaries, `src/lib.rs` for libraries) and includes everything reachable through `mod` declarations. The compiler sees the entire crate as one coherent unit, which means it can:

- Enforce privacy: items are private by default, and only `pub` items cross crate boundaries
- Check types end-to-end: no header file mismatches, no "undefined reference" surprises
- Optimize globally: inlining, monomorphization, and dead code elimination happen within the whole crate

We also made a deliberate choice: there are exactly **two kinds** of crates — binary crates (which produce executables) and library crates (which produce reusable code). No ambiguity, no special configuration. A binary crate has a `main()` function. A library crate doesn't. That's it.

The name "crate" itself was a playful nod — Cargo ships crates. It stuck.

### (2) Reality Metaphor

Think of a crate as a **shipping container**.

A shipping container is a standard-sized box that holds a complete shipment. Everything inside it is organized, labeled, and sealed as a single unit. When the container arrives at a port (your project), you don't need to know how things are arranged inside — you just know what the container *exports* (its public interface).

There are two types of containers:
- A **delivery container** (binary crate) — it arrives at its destination and its contents are *used directly* (you run the executable)
- A **supply container** (library crate) — its contents are *unpacked and assembled into something else* (other crates depend on it)

The port authority (Cargo) manages loading, transporting, and unloading these containers. And the container's walls enforce boundaries — you can't reach into someone else's container and grab a private item without permission.

### (3) Rust Code Examples

#### Short Snippet — Two kinds of crates

```bash
# Create a binary crate (has src/main.rs with fn main())
cargo new my_app

# Create a library crate (has src/lib.rs, no main function)
cargo new my_lib --lib
```

```rust
// src/main.rs — the root of a BINARY crate
fn main() {
    println!("I'm a binary crate — I run as a program!");
}
```

```rust
// src/lib.rs — the root of a LIBRARY crate
pub fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}
```

#### Fuller Example — A library crate used by a binary crate

First, create the library crate:

```rust
// my_math/src/lib.rs — a library crate providing math utilities

/// Adds two numbers together.
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

/// Multiplies two numbers together.
pub fn multiply(a: i32, b: i32) -> i32 {
    a * b
}

// This function is PRIVATE — only usable inside this crate
fn internal_helper() -> i32 {
    42
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_add() {
        assert_eq!(add(2, 3), 5);
    }

    #[test]
    fn test_multiply() {
        assert_eq!(multiply(4, 5), 20);
    }

    #[test]
    fn test_internal_helper() {
        // We CAN access private functions within the same crate
        assert_eq!(internal_helper(), 42);
    }
}
```

Then, use it from a binary crate:

```toml
# my_app/Cargo.toml
[package]
name = "my_app"
version = "0.1.0"
edition = "2024"

[dependencies]
my_math = { path = "../my_math" }   # Depend on our local library crate
```

```rust
// my_app/src/main.rs — a binary crate consuming the library

use my_math::{add, multiply};  // Import public items from the library crate

fn main() {
    let sum = add(10, 20);
    let product = multiply(5, 6);

    println!("10 + 20 = {}", sum);        // 10 + 20 = 30
    println!("5 × 6 = {}", product);      // 5 × 6 = 30

    // my_math::internal_helper();  // ❌ ERROR: this function is private!
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Crate Scoping and Lifecycle Rules

**The mistake:** Assuming Crate instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("crate_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("crate_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Crate State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Crate through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Crate Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Crate instances across OS threads via `std::thread::spawn`.

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

## 5. Practice Exercises

### Exercise 1: High-Frequency Order Matching Engine Crate Architecture & Public Facades

**Scenario:**
You are architecting a high-frequency trading (HFT) order matching engine library crate named `matching_engine`. In financial execution systems, core domain invariants — such as price-time priority, non-zero order quantities, strictly ordered bid/ask depth, and atomic trade fill reports — must be guaranteed at the compilation boundary. Exposing internal data structures directly allows downstream callers or binary crates to corrupt book state or bypass compliance risk checks.

You must design a multi-module library crate structure that encapsulates internal order storage and matching logic within `pub(crate)` visibility while exposing a clean public API facade (`Engine`, `Order`, `Side`, `ExecutionReport`, `OrderBookError`) at the crate root via `pub use` re-exports.

**Requirements:**
1. Define a `matching_engine` crate structure containing submodules: `types`, `orderbook`, and `matching`.
2. Expose core public domain models in `types`: `Order` (fields: `id: u64`, `side: Side`, `price: u64`, `quantity: u32`), `Side` (`Buy`/`Sell`), `ExecutionReport`, and `OrderBookError`.
3. Encapsulate `OrderBook` inside `orderbook` with `pub(crate)` visibility, preventing external binary crates from mutating internal `bids` or `asks` arrays.
4. Encapsulate `match_orders` inside `matching` with `pub(crate)` visibility. Matching logic must match bids (descending price) against asks (ascending price) whenever `bid.price >= ask.price`, executing fills at the maker's (ask) price.
5. Provide a public facade struct `Engine` with `submit_order(&mut self, order: Order) -> Result<Vec<ExecutionReport>, OrderBookError>`. Reject orders with zero price or zero quantity with `Err(OrderBookError::InvalidPriceOrQuantity)`.
6. Write complete, compilable Rust code with comprehensive unit tests (`#[cfg(test)] mod tests`) featuring explicit assertions (`assert_eq!`, `assert!`, `assert_ne!`, `matches!`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub mod matching_engine {
>     pub mod types {
>         #[derive(Debug, Clone, Copy, PartialEq, Eq)]
>         pub enum Side {
>             Buy,
>             Sell,
>         }
> 
>         #[derive(Debug, Clone, PartialEq, Eq)]
>         pub struct Order {
>             pub id: u64,
>             pub side: Side,
>             pub price: u64, // Price in cents
>             pub quantity: u32,
>         }
> 
>         #[derive(Debug, Clone, PartialEq, Eq)]
>         pub struct ExecutionReport {
>             pub maker_order_id: u64,
>             pub taker_order_id: u64,
>             pub executed_price: u64,
>             pub executed_quantity: u32,
>         }
> 
>         #[derive(Debug, Clone, PartialEq, Eq)]
>         pub enum OrderBookError {
>             InvalidPriceOrQuantity,
>             OrderNotFound(u64),
>         }
>     }
> 
>     mod orderbook {
>         use super::types::{Order, OrderBookError, Side};
> 
>         #[derive(Debug, Default)]
>         pub(crate) struct OrderBook {
>             pub(crate) bids: Vec<Order>, // Sorted descending by price
>             pub(crate) asks: Vec<Order>, // Sorted ascending by price
>         }
> 
>         impl OrderBook {
>             pub(crate) fn new() -> Self {
>                 Self {
>                     bids: Vec::new(),
>                     asks: Vec::new(),
>                 }
>             }
> 
>             pub(crate) fn insert(&mut self, order: Order) -> Result<(), OrderBookError> {
>                 if order.price == 0 || order.quantity == 0 {
>                     return Err(OrderBookError::InvalidPriceOrQuantity);
>                 }
> 
>                 match order.side {
>                     Side::Buy => {
>                         self.bids.push(order);
>                         self.bids.sort_by(|a, b| b.price.cmp(&a.price));
>                     }
>                     Side::Sell => {
>                         self.asks.push(order);
>                         self.asks.sort_by(|a, b| a.price.cmp(&b.price));
>                     }
>                 }
>                 Ok(())
>             }
>         }
>     }
> 
>     mod matching {
>         use super::orderbook::OrderBook;
>         use super::types::ExecutionReport;
>         use std::cmp::min;
> 
>         pub(crate) fn match_orders(book: &mut OrderBook) -> Vec<ExecutionReport> {
>             let mut reports = Vec::new();
> 
>             while !book.bids.is_empty() && !book.asks.is_empty() {
>                 let best_bid_price = book.bids[0].price;
>                 let best_ask_price = book.asks[0].price;
> 
>                 if best_bid_price >= best_ask_price {
>                     let fill_qty = min(book.bids[0].quantity, book.asks[0].quantity);
>                     let exec_price = book.asks[0].price; // Maker price execution
> 
>                     reports.push(ExecutionReport {
>                         maker_order_id: book.asks[0].id,
>                         taker_order_id: book.bids[0].id,
>                         executed_price: exec_price,
>                         executed_quantity: fill_qty,
>                     });
> 
>                     book.bids[0].quantity -= fill_qty;
>                     book.asks[0].quantity -= fill_qty;
> 
>                     if book.bids[0].quantity == 0 {
>                         book.bids.remove(0);
>                     }
>                     if book.asks[0].quantity == 0 {
>                         book.asks.remove(0);
>                     }
>                 } else {
>                     break;
>                 }
>             }
> 
>             reports
>         }
>     }
> 
>     // Public crate root re-exports
>     pub use types::{ExecutionReport, Order, OrderBookError, Side};
> 
>     #[derive(Debug, Default)]
>     pub struct Engine {
>         book: orderbook::OrderBook,
>     }
> 
>     impl Engine {
>         pub fn new() -> Self {
>             Self {
>                 book: orderbook::OrderBook::new(),
>             }
>         }
> 
>         pub fn submit_order(&mut self, order: Order) -> Result<Vec<ExecutionReport>, OrderBookError> {
>             self.book.insert(order)?;
>             let reports = matching::match_orders(&mut self.book);
>             Ok(reports)
>         }
> 
>         pub fn active_bids_count(&self) -> usize {
>             self.book.bids.len()
>         }
> 
>         pub fn active_asks_count(&self) -> usize {
>             self.book.asks.len()
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::matching_engine::*;
> 
>     #[test]
>     fn test_order_submission_and_matching() {
>         let mut engine = Engine::new();
> 
>         let sell_order = Order {
>             id: 101,
>             side: Side::Sell,
>             price: 100,
>             quantity: 10,
>         };
> 
>         let res = engine.submit_order(sell_order);
>         assert!(res.is_ok());
>         let reports = res.unwrap();
>         assert!(reports.is_empty());
>         assert_eq!(engine.active_asks_count(), 1);
> 
>         let buy_order = Order {
>             id: 102,
>             side: Side::Buy,
>             price: 105,
>             quantity: 5,
>         };
> 
>         let res_buy = engine.submit_order(buy_order);
>         assert!(res_buy.is_ok());
>         let reports = res_buy.unwrap();
>         assert_eq!(reports.len(), 1);
> 
>         let report = &reports[0];
>         assert_eq!(report.maker_order_id, 101);
>         assert_eq!(report.taker_order_id, 102);
>         assert_eq!(report.executed_price, 100);
>         assert_eq!(report.executed_quantity, 5);
>         assert_eq!(engine.active_asks_count(), 1);
>         assert_eq!(engine.active_bids_count(), 0);
>     }
> 
>     #[test]
>     fn test_invalid_order_rejection() {
>         let mut engine = Engine::new();
> 
>         let invalid_order = Order {
>             id: 1,
>             side: Side::Buy,
>             price: 0,
>             quantity: 10,
>         };
> 
>         let result = engine.submit_order(invalid_order);
>         assert!(result.is_err());
>         assert!(matches!(result, Err(OrderBookError::InvalidPriceOrQuantity)));
>         assert_ne!(engine.active_bids_count(), 1);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Compilation Unit Boundaries & Visibility Controls**: In Rust, visibility is enforced at compile time per crate compilation unit. By marking `OrderBook` fields and `match_orders` as `pub(crate)`, they are accessible across all submodules inside `matching_engine` but completely hidden from external consumer binary crates. This prevents caller code from arbitrarily inserting unordered orders or modifying queued quantities.
> 2. **Re-export Facades (`pub use`)**: Using `pub use types::{...}` at the crate root enables crate consumers to write `use matching_engine::{Engine, Order, Side}` without leaking the internal directory structure (`matching_engine::types::Order`).
> 3. **Ownership and Mutability Invariants**: `submit_order(&mut self, order: Order)` takes ownership of the incoming `Order` struct, preventing callers from retaining a mutable pointer to an order once queued. Exclusive mutable borrowing (`&mut self`) guarantees single-threaded state mutation safety without requiring runtime lock overhead.
> 4. **Edge Cases**:
>    - Zero price or quantity: Validated during insertion and rejected immediately.
>    - Partial fills: Quantities are updated in place, and fully filled orders are removed from book heads (`bids[0]` / `asks[0]`).
>    - Unmatched orders: Order remains cleanly sorted in bid/ask depth for future incoming takers.
>
> 
---

### Exercise 2: Embedded Telemetry Protocol Crate with Zero-Allocation Binary Framing & Feature-Gated Conditional Compilation

**Scenario:**
In an embedded IoT gateway architecture, your library crate `telemetry_codec` must format and decode binary sensor telemetry packets under strict memory constraints. The crate must operate across two compilation environments:
1. Microcontroller embedded targets: Operates with zero heap allocations, stack-allocated 8-byte binary frames, and CRC-16-CCITT payload checksum validation.
2. Host diagnostic targets: Features rich string output formatting controlled via crate feature flags (`#[cfg(feature = "std_diagnostics")]`).

You must architect the binary framing logic and feature gates to maintain compile-time safety and memory efficiency across targets.

**Requirements:**
1. Define binary frame layout (8 bytes, Big-Endian):
   - Bytes 0..2: `sensor_id` (`u16`)
   - Bytes 2..6: `value` (`u32`)
   - Bytes 6..8: `checksum` (`u16` computed over bytes 0..6 via CRC-16 CCITT polynomial `0x1021`, seed `0xFFFF`).
2. Implement `TelemetryFrame::encode(&self) -> [u8; 8]` returning a stack-allocated byte array without heap allocation.
3. Implement `TelemetryFrame::decode(bytes: &[u8]) -> Result<Self, CodecError>`. Return `CodecError::BufferTooSmall` if `bytes.len() < 8`, `CodecError::InvalidSensorId` if `sensor_id == 0`, and `CodecError::ChecksumMismatch { expected, actual }` if CRC verification fails.
4. Add feature-gated `format_diagnostic(&self) -> String` compiled only when `#[cfg(feature = "std_diagnostics")]` is active.
5. Provide complete, compilable Rust code with a full test module (`#[cfg(test)] mod tests`) with explicit assertions (`assert_eq!`, `assert!`, `assert_ne!`, `matches!`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub mod telemetry_codec {
>     #[derive(Debug, Clone, Copy, PartialEq, Eq)]
>     pub struct TelemetryFrame {
>         pub sensor_id: u16,
>         pub value: u32,
>     }
> 
>     #[derive(Debug, Clone, PartialEq, Eq)]
>     pub enum CodecError {
>         BufferTooSmall,
>         InvalidSensorId,
>         ChecksumMismatch { expected: u16, actual: u16 },
>     }
> 
>     /// Computes CRC-16-CCITT over a byte slice.
>     pub fn calculate_crc16(bytes: &[u8]) -> u16 {
>         let mut crc: u16 = 0xFFFF;
>         for &byte in bytes {
>             crc ^= (byte as u16) << 8;
>             for _ in 0..8 {
>                 if (crc & 0x8000) != 0 {
>                     crc = (crc << 1) ^ 0x1021;
>                 } else {
>                     crc <<= 1;
>                 }
>             }
>         }
>         crc
>     }
> 
>     impl TelemetryFrame {
>         pub fn new(sensor_id: u16, value: u32) -> Result<Self, CodecError> {
>             if sensor_id == 0 {
>                 return Err(CodecError::InvalidSensorId);
>             }
>             Ok(Self { sensor_id, value })
>         }
> 
>         pub fn encode(&self) -> [u8; 8] {
>             let mut buf = [0u8; 8];
>             buf[0..2].copy_from_slice(&self.sensor_id.to_be_bytes());
>             buf[2..6].copy_from_slice(&self.value.to_be_bytes());
>             let crc = calculate_crc16(&buf[0..6]);
>             buf[6..8].copy_from_slice(&crc.to_be_bytes());
>             buf
>         }
> 
>         pub fn decode(bytes: &[u8]) -> Result<Self, CodecError> {
>             if bytes.len() < 8 {
>                 return Err(CodecError::BufferTooSmall);
>             }
>             let sensor_id = u16::from_be_bytes([bytes[0], bytes[1]]);
>             if sensor_id == 0 {
>                 return Err(CodecError::InvalidSensorId);
>             }
>             let value = u32::from_be_bytes([bytes[2], bytes[3], bytes[4], bytes[5]]);
>             let expected_crc = u16::from_be_bytes([bytes[6], bytes[7]]);
>             let actual_crc = calculate_crc16(&bytes[0..6]);
> 
>             if expected_crc != actual_crc {
>                 return Err(CodecError::ChecksumMismatch {
>                     expected: expected_crc,
>                     actual: actual_crc,
>                 });
>             }
> 
>             Ok(Self { sensor_id, value })
>         }
> 
>         #[cfg(feature = "std_diagnostics")]
>         pub fn format_diagnostic(&self) -> String {
>             format!("[SENSOR 0x{:04X}] Value: {}", self.sensor_id, self.value)
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::telemetry_codec::*;
> 
>     #[test]
>     fn test_encode_decode_roundtrip() {
>         let frame = TelemetryFrame::new(0x10A, 42949).unwrap();
>         let encoded = frame.encode();
>         assert_eq!(encoded.len(), 8);
> 
>         let decoded = TelemetryFrame::decode(&encoded);
>         assert!(decoded.is_ok());
>         let decoded_frame = decoded.unwrap();
>         assert_eq!(decoded_frame, frame);
>         assert_eq!(decoded_frame.sensor_id, 0x10A);
>         assert_eq!(decoded_frame.value, 42949);
>     }
> 
>     #[test]
>     fn test_checksum_mismatch_detection() {
>         let frame = TelemetryFrame::new(0x20, 100).unwrap();
>         let mut encoded = frame.encode();
> 
>         // Corrupt payload byte
>         encoded[3] ^= 0xFF;
> 
>         let decoded = TelemetryFrame::decode(&encoded);
>         assert!(decoded.is_err());
>         assert!(matches!(decoded, Err(CodecError::ChecksumMismatch { .. })));
>         assert_ne!(decoded, Ok(frame));
>     }
> 
>     #[test]
>     fn test_invalid_sensor_and_short_buffer() {
>         let invalid_frame = TelemetryFrame::new(0, 50);
>         assert!(invalid_frame.is_err());
>         assert!(matches!(invalid_frame, Err(CodecError::InvalidSensorId)));
> 
>         let short_buf = [0u8; 5];
>         let decoded_short = TelemetryFrame::decode(&short_buf);
>         assert_eq!(decoded_short, Err(CodecError::BufferTooSmall));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Zero-Allocation Stack Guarantees**: Stack arrays `[u8; 8]` avoid heap allocations (`Vec<u8>`), making the crate compatible with `no_std` embedded microcontrollers. Operations like `u16::from_be_bytes` and `u32::to_be_bytes` lower directly to byte-swapping instructions without memory overhead.
> 2. **Conditional Compilation Gates (`#[cfg]`)**: Crate feature flags operate at the compilation unit level. Items annotated with `#[cfg(feature = "std_diagnostics")]` are completely omitted from the AST when the feature is disabled, guaranteeing zero code bloat or standard library link dependencies on embedded targets.
> 3. **CRC Invariants and Data Alignment**: Calculating the CCITT CRC-16 over slice `&bytes[0..6]` ensures data integrity against payload corruption over lossy bus lines (RS-485 / CAN bus).
> 4. **Edge Cases**:
>    - Truncated buffers (< 8 bytes) trigger an immediate early return of `BufferTooSmall`.
>    - Reserved `sensor_id == 0` is guarded against invalid telemetry source initialization.
>    - Corrupted payload bytes fail CRC verification and trigger `ChecksumMismatch`.
>
> 
---

### Exercise 3: Plugin-Driven Async Task Pipeline Engine with Shared Library Crate Facade & Dynamic Dispatch

**Scenario:**
You are building an enterprise pipeline orchestrator library crate `task_pipeline`. The library crate defines a composable pipeline where distinct processing steps (e.g. data validation, metrics logging, transformation) can be registered dynamically by consuming binary crates. Each task implements a `PipelineTask` trait and is executed under a configurable `RetryPolicy`.

Architect a clean separation between the library crate facade and binary task dispatchers, providing type-safe context mutation, dynamic trait dispatch (`Box<dyn PipelineTask>`), and consolidated execution reports.

**Requirements:**
1. Define trait `PipelineTask`:
   - `fn name(&self) -> &str;`
   - `fn execute(&self, ctx: &mut TaskContext) -> Result<TaskOutput, TaskError>;`
2. Define `TaskContext` holding state (`HashMap<String, String>`) and execution attempt counter.
3. Define `RetryPolicy`: `NoRetry` or `MaxRetries(u32)`.
4. Build `Pipeline` struct allowing tasks to be appended via `add_task(&mut self, task: Box<dyn PipelineTask>, policy: RetryPolicy)`.
5. Implement `Pipeline::run(&mut self, ctx: &mut TaskContext) -> PipelineReport`. If a task fails, retry according to its policy up to `max_retries`. Aggregate total processed bytes and task status metrics.
6. Provide complete compilable code and unit tests (`#[cfg(test)] mod tests`) with explicit assertions (`assert_eq!`, `assert!`, `assert_ne!`, `matches!`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub mod task_pipeline {
>     use std::collections::HashMap;
> 
>     #[derive(Debug, Clone, PartialEq, Eq)]
>     pub struct TaskOutput {
>         pub message: String,
>         pub bytes_processed: usize,
>     }
> 
>     #[derive(Debug, Clone, PartialEq, Eq)]
>     pub enum TaskError {
>         ExecutionFailed(String),
>         InvalidContext(String),
>         Timeout,
>     }
> 
>     #[derive(Debug, Clone, Copy, PartialEq, Eq)]
>     pub enum RetryPolicy {
>         NoRetry,
>         MaxRetries(u32),
>     }
> 
>     #[derive(Debug, Default)]
>     pub struct TaskContext {
>         state: HashMap<String, String>,
>         execution_count: u32,
>     }
> 
>     impl TaskContext {
>         pub fn new() -> Self {
>             Self {
>                 state: HashMap::new(),
>                 execution_count: 0,
>             }
>         }
> 
>         pub fn set(&mut self, key: impl Into<String>, value: impl Into<String>) {
>             self.state.insert(key.into(), value.into());
>         }
> 
>         pub fn get(&self, key: &str) -> Option<&str> {
>             self.state.get(key).map(|s| s.as_str())
>         }
> 
>         pub fn increment_executions(&mut self) {
>             self.execution_count += 1;
>         }
> 
>         pub fn execution_count(&self) -> u32 {
>             self.execution_count
>         }
>     }
> 
>     pub trait PipelineTask {
>         fn name(&self) -> &str;
>         fn execute(&self, ctx: &mut TaskContext) -> Result<TaskOutput, TaskError>;
>     }
> 
>     #[derive(Debug, Clone, PartialEq, Eq)]
>     pub struct PipelineReport {
>         pub total_tasks: usize,
>         pub successful_tasks: usize,
>         pub failed_tasks: usize,
>         pub total_bytes: usize,
>     }
> 
>     pub struct Pipeline {
>         tasks: Vec<(Box<dyn PipelineTask>, RetryPolicy)>,
>     }
> 
>     impl Pipeline {
>         pub fn new() -> Self {
>             Self { tasks: Vec::new() }
>         }
> 
>         pub fn add_task(&mut self, task: Box<dyn PipelineTask>, policy: RetryPolicy) {
>             self.tasks.push((task, policy));
>         }
> 
>         pub fn run(&mut self, ctx: &mut TaskContext) -> PipelineReport {
>             let mut successful = 0;
>             let mut failed = 0;
>             let mut total_bytes = 0;
> 
>             for (task, policy) in &self.tasks {
>                 let mut attempts = 0;
>                 let max_attempts = match policy {
>                     RetryPolicy::NoRetry => 1,
>                     RetryPolicy::MaxRetries(n) => *n + 1,
>                 };
> 
>                 let mut task_success = false;
> 
>                 while attempts < max_attempts {
>                     attempts += 1;
>                     ctx.increment_executions();
> 
>                     match task.execute(ctx) {
>                         Ok(output) => {
>                             total_bytes += output.bytes_processed;
>                             task_success = true;
>                             break;
>                         }
>                         Err(_err) => {
>                             // Retry on failure if attempts remain
>                         }
>                     }
>                 }
> 
>                 if task_success {
>                     successful += 1;
>                 } else {
>                     failed += 1;
>                 }
>             }
> 
>             PipelineReport {
>                 total_tasks: self.tasks.len(),
>                 successful_tasks: successful,
>                 failed_tasks: failed,
>                 total_bytes,
>             }
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::task_pipeline::*;
> 
>     struct MockTransformTask {
>         name: String,
>         should_fail_times: std::cell::RefCell<u32>,
>     }
> 
>     impl MockTransformTask {
>         fn new(name: &str, fail_times: u32) -> Self {
>             Self {
>                 name: name.to_string(),
>                 should_fail_times: std::cell::RefCell::new(fail_times),
>             }
>         }
>     }
> 
>     impl PipelineTask for MockTransformTask {
>         fn name(&self) -> &str {
>             &self.name
>         }
> 
>         fn execute(&self, ctx: &mut TaskContext) -> Result<TaskOutput, TaskError> {
>             let mut fail_count = self.should_fail_times.borrow_mut();
>             if *fail_count > 0 {
>                 *fail_count -= 1;
>                 Err(TaskError::ExecutionFailed("Transient error".to_string()))
>             } else {
>                 ctx.set("last_task", self.name());
>                 Ok(TaskOutput {
>                     message: "Success".to_string(),
>                     bytes_processed: 1024,
>                 })
>             }
>         }
>     }
> 
>     #[test]
>     fn test_pipeline_execution_with_retry() {
>         let mut ctx = TaskContext::new();
>         let mut pipeline = Pipeline::new();
> 
>         let task1 = Box::new(MockTransformTask::new("task1", 2));
>         pipeline.add_task(task1, RetryPolicy::MaxRetries(2));
> 
>         let report = pipeline.run(&mut ctx);
> 
>         assert_eq!(report.total_tasks, 1);
>         assert_eq!(report.successful_tasks, 1);
>         assert_eq!(report.failed_tasks, 0);
>         assert_eq!(report.total_bytes, 1024);
>         assert_eq!(ctx.execution_count(), 3);
>         assert_eq!(ctx.get("last_task"), Some("task1"));
>     }
> 
>     #[test]
>     fn test_pipeline_task_exhaustion_failure() {
>         let mut ctx = TaskContext::new();
>         let mut pipeline = Pipeline::new();
> 
>         let task1 = Box::new(MockTransformTask::new("failing_task", 5));
>         pipeline.add_task(task1, RetryPolicy::MaxRetries(1));
> 
>         let report = pipeline.run(&mut ctx);
> 
>         assert_eq!(report.total_tasks, 1);
>         assert_eq!(report.successful_tasks, 0);
>         assert_eq!(report.failed_tasks, 1);
>         assert_eq!(report.total_bytes, 0);
>         assert_eq!(ctx.execution_count(), 2);
>         assert_ne!(ctx.get("last_task"), Some("failing_task"));
>         assert!(matches!(report, PipelineReport { failed_tasks: 1, .. }));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Dynamic Dispatch Across Crate Boundaries (`dyn Trait`)**: By accepting `Box<dyn PipelineTask>`, the `task_pipeline` library crate allows consuming binary crates to pass custom structs that implement `PipelineTask` without requiring compile-time monomorphization or leaking concrete task types into the pipeline definition.
> 2. **Context Mutability and Lifetime Invariants**: `TaskContext` is passed as an exclusive mutable reference (`&mut TaskContext`) down the pipeline chain. This enforces strict sequential ordering of state modifications without runtime lock overhead (`Mutex`/`RwLock`).
> 3. **Retry Loop Mechanics**: The execution loop tracks attempt counters per step. If a task returns `Err(TaskError)`, the pipeline checks `RetryPolicy`. Upon exhausting attempts, the failure is recorded in `PipelineReport.failed_tasks` and pipeline execution proceeds to the next stage.
> 4. **Edge Cases**:
>    - Empty pipeline returns zeroed `PipelineReport`.
>    - Multi-attempt recovery correctly updates total executions on `TaskContext` while incrementing `successful_tasks`.
>    - Context key overwrite replaces prior context values cleanly.
>
> 
---

## 6. Related Terms


- [Cargo](cargo.md) — the tool that builds, tests, and manages crates
- [Package](package.md) — a Cargo concept wrapping one or more crates with a `Cargo.toml`
- [Module](module.md) — the organizational unit *within* a crate; crates contain modules
- [`pub` Visibility](../level_07/pub_visibility.md) — controls what items are exposed beyond the crate boundary
- [`Cargo.toml`](../level_07/cargo_toml.md) — the manifest file that defines how a crate is built and its dependencies
- [Workspace](../level_07/workspace.md) — Related concept: Workspace.
- [Integration Tests](../level_08/integration_tests.md) — Related concept: Integration Tests.
- [Link-Time Optimization (LTO)](../level_15/link_time_optimization.md) — Related concept: Link-Time Optimization (LTO).

---

## 7. Key Takeaways

- **A crate is Rust's compilation unit** — the largest chunk of code the compiler processes at once, starting from a single root file.
- **Two kinds, no ambiguity** — binary crates (`src/main.rs`, have `fn main()`, produce executables) and library crates (`src/lib.rs`, produce reusable code).
- **Crate ≠ package** — a package (defined by `Cargo.toml`) can contain multiple crates, but each crate is a single compilation unit.
- **Privacy is enforced at the crate boundary** — items are private by default and only `pub` items are visible to other crates.
- **The crate root is the entry point** — `src/main.rs` or `src/lib.rs` is where the compiler starts; all modules branch out from there via `mod` declarations.
