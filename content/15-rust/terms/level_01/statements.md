# Statements

> **Level 1 — Foundations**
> Instructions that perform an action and do not return a value (e.g., `let` bindings, statements ending in `;`).

---

## 1. Prerequisites


- [Variable](variable.md) — Declaring a variable (`let x = 5;`) is the most common example of a statement.

---

## 2. Term Category



**Rust Core Semantics (unit-evaluating instruction steps)**: A fundamental concept in almost all programming languages, though Rust enforces a much stricter distinction between statements and expressions than languages like C or Python.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

When you write code, you are fundamentally doing two things: calculating values, and telling the computer what to do with those values. 

**Statements** are the instructions that tell the computer to *do* something. They perform an action (like allocating memory for a variable, or defining a new function), but they **do not return a value**. Because they don't evaluate to a result, you cannot assign a statement to another variable. 

In Rust, the most common statements are `let` declarations and expressions that have been terminated by a semicolon (`;`). The semicolon acts as a period at the end of a sentence, signaling to the compiler: *"I am done with this instruction, execute it, throw away the result, and move on."*

### (2) Reality Metaphor

A statement is like **giving a command to a worker**. 

You say, *"Put this box on the shelf"* (which is like `let box = "shelf";`). The worker performs the action. They don't hand you anything back in return. You cannot use the "result" of that action to do something else. 

By contrast, an expression is like asking a question: *"What is 5 + 5?"*. The worker hands you back a piece of paper that says "10".

### (3) Rust Code Examples

#### Short Snippet
```rust
// This entire line is a statement. 
// It performs the action of binding '5' to 'x'.
let x = 5;

// Function declarations are also statements. 
// They define something, but don't evaluate to a value.
fn do_nothing() {}
```

#### Fuller Example
```rust
fn main() {
    // 1. A standard `let` statement
    let name = "Alice";
    
    // 2. An expression turned into a statement.
    // `name.len()` is an expression (it evaluates to 5).
    // But because we put a semicolon `;` at the end, we throw away the 5. 
    // The line becomes a statement that does nothing useful.
    name.len();
    
    // 3. A macro call used as a statement.
    // It performs the action of printing to the console, then stops.
    println!("Hello, {}!", name);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to assign a statement to a variable

**The mistake:** Assuming that `let y = 5` returns the value `5` so you can chain assignments.

**Why it's wrong:** In languages like C or Ruby, `x = y = 5` is valid because the assignment `y = 5` returns `5`. In Rust, `let y = 5` is strictly a statement. It returns nothing (technically, it returns the unit type `()`), so you cannot assign it to `x`.

*Incorrect:*
```rust
// ERROR: expected expression, found `let` statement
let x = (let y = 5); 
```

*Fix:*
```rust
let y = 5;
let x = y;
```

### Mistake 2: Mutating Statements State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Statements through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Statements Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Statements instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: High-Throughput Network Frame Ingress Processor & Semicolon Scope Mechanics

**Scenario:**
You are building a high-throughput network frame ingress processor (`FrameProcessor`) for a distributed telemetry pipeline. In production network services, processing logic relies on sequential imperative **statements** (logging events, incrementing payload byte counters, updating audit trails, validating flags) before yielding a final summary struct via a block **expression**.

A common bug occurs when an engineer accidentally appends a semicolon (`;`) to the final block expression inside `process_frame`. In Rust, a semicolon converts an expression into a statement, discarding its value and returning `()` (the unit type). This causes a compile-time type mismatch error `E0308` (`expected enum Result<ProcessingSummary, _>, found ()`). Furthermore, statements enforce strict temporal sequencing, ensuring that side-effect mutations (e.g., audit logging and byte counters) execute before the summary expression is constructed.

**Task:**
1. Define a `Frame` struct with `id: u64`, `payload: Vec<u8>`, and `flags: u8`.
2. Define a `ProcessingSummary` struct containing `frame_id: u64`, `bytes_processed: usize`, `checksum: u32`, and `is_encrypted: bool`.
3. Implement `FrameProcessor` with fields `processed_count: u64`, `total_bytes: u64`, and `audit_log: Vec<String>`.
4. Write `process_frame(&mut self, frame: Frame) -> Result<ProcessingSummary, String>`:
   - Use early-return **statements** for input validation (e.g., empty payload check).
   - Execute imperative **statements** to mutate internal counter and audit log state.
   - Conclude with a value-yielding **expression** (without a semicolon) returning `Ok(ProcessingSummary)`.
5. Write unit tests inside `#[cfg(test)] mod tests` verifying valid processing, empty payload rejection, state side-effects, and checksum accuracy using `assert_eq!`, `assert!`, `assert_ne!`, and `matches!`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct Frame {
>     pub id: u64,
>     pub payload: Vec<u8>,
>     pub flags: u8, // Bit 0: Encrypted, Bit 1: Priority
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct ProcessingSummary {
>     pub frame_id: u64,
>     pub bytes_processed: usize,
>     pub checksum: u32,
>     pub is_encrypted: bool,
> }
> 
> #[derive(Debug, Default)]
> pub struct FrameProcessor {
>     pub processed_count: u64,
>     pub total_bytes: u64,
>     pub audit_log: Vec<String>,
> }
> 
> impl FrameProcessor {
>     pub fn new() -> Self {
>         Self::default()
>     }
> 
>     pub fn process_frame(&mut self, frame: Frame) -> Result<ProcessingSummary, String> {
>         // Statement 1: Validate payload non-emptiness with early return statement
>         if frame.payload.is_empty() {
>             let log_msg = format!("Frame {}: Rejected empty payload", frame.id);
>             self.audit_log.push(log_msg);
>             return Err("Empty payload".to_string());
>         }
> 
>         // Statement 2: Update internal counter statements
>         self.processed_count += 1;
>         self.total_bytes += frame.payload.len() as u64;
> 
>         // Statement 3: Compute additive checksum via local statements
>         let mut checksum: u32 = 0;
>         for &byte in &frame.payload {
>             checksum = checksum.wrapping_add(byte as u32);
>         }
> 
>         // Statement 4: Determine encryption status using let statement
>         let is_encrypted = (frame.flags & 0x01) != 0;
> 
>         // Statement 5: Record audit log entry statement
>         let audit_entry = format!(
>             "Frame {}: Processed {} bytes, Checksum: {}, Encrypted: {}",
>             frame.id,
>             frame.payload.len(),
>             checksum,
>             is_encrypted
>         );
>         self.audit_log.push(audit_entry);
> 
>         // Final Expression (No trailing semicolon!): Produces Result::Ok containing ProcessingSummary
>         Ok(ProcessingSummary {
>             frame_id: frame.id,
>             bytes_processed: frame.payload.len(),
>             checksum,
>             is_encrypted,
>         })
>     }
> }
> 
> fn main() {
>     let mut processor = FrameProcessor::new();
>     let frame = Frame {
>         id: 1001,
>         payload: vec![0xDE, 0xAD, 0xBE, 0xEF],
>         flags: 0x01,
>     };
>     match processor.process_frame(frame) {
>         Ok(summary) => println!("Processed summary: {:?}", summary),
>         Err(err) => eprintln!("Error: {}", err),
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_valid_frame_processing() {
>         let mut processor = FrameProcessor::new();
>         let frame = Frame {
>             id: 42,
>             payload: vec![1, 2, 3, 4, 5],
>             flags: 1, // Bit 0 set -> encrypted
>         };
> 
>         let result = processor.process_frame(frame);
>         assert!(result.is_ok());
> 
>         let summary = result.unwrap();
>         assert_eq!(summary.frame_id, 42);
>         assert_eq!(summary.bytes_processed, 5);
>         assert_eq!(summary.checksum, 15);
>         assert!(summary.is_encrypted);
> 
>         assert_eq!(processor.processed_count, 1);
>         assert_eq!(processor.total_bytes, 5);
>         assert_eq!(processor.audit_log.len(), 1);
>         assert_ne!(processor.audit_log[0], "");
>     }
> 
>     #[test]
>     fn test_empty_payload_rejection() {
>         let mut processor = FrameProcessor::new();
>         let frame = Frame {
>             id: 99,
>             payload: vec![],
>             flags: 0,
>         };
> 
>         let result = processor.process_frame(frame);
>         assert!(matches!(result, Err(ref s) if s == "Empty payload"));
>         assert_eq!(processor.processed_count, 0);
>         assert_eq!(processor.total_bytes, 0);
>         assert_eq!(processor.audit_log.len(), 1);
>         assert!(processor.audit_log[0].contains("Rejected empty payload"));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Statements vs. Value-Yielding Expressions**:
>    - Statements like `self.processed_count += 1;` perform state mutations as side-effects and evaluate to the unit type `()`.
>    - The final line `Ok(ProcessingSummary { ... })` omits the trailing semicolon `;`, preserving its status as an expression that evaluates to `Result<ProcessingSummary, String>`.
>    - Appending a semicolon to the final `Ok(...)` expression turns it into an expression statement that discards the result, yielding `()` and provoking compiler error `E0308`.
> 2. **Sequential Statement Invariants & Ordering**:
>    - Rust guarantees top-to-bottom imperative evaluation of statements. `processed_count` and `total_bytes` are guaranteed to update *before* the summary receipt expression evaluates.
> 3. **Ownership and Lifetime Invariants**:
>    - The `process_frame` function takes ownership of `frame: Frame`. Local stack variables inside `process_frame` borrow from `frame.payload` during loop computation. When `process_frame` completes, `frame` is moved or dropped, leaving no dangling references.
>

---

### Exercise 2: Financial Order Execution Audit Engine with Scoped Statement Blocks

**Scenario:**
In high-frequency financial trading systems, matching engines execute market orders under strict latency and memory isolation constraints. When processing an order, short-lived scratch variables (such as intermediate multiplication buffers and basis-point fee calculations) should be constrained to local **block statements** (`{ ... }`). This ensures that temporary allocations drop immediately when the block finishes, while the final computed values are cleanly yielded to the outer scope via a block **expression**.

Additionally, semicolon placement inside control flow blocks determines whether an `if`/`else` or `match` block functions as an imperative statement (returning `()`) or a value-producing expression.

**Task:**
1. Define an `Order` struct (`id: u64`, `trader_id: String`, `symbol: String`, `price_cents: u64`, `quantity: u32`, `is_buy: bool`).
2. Define a `TradeReceipt` struct (`trade_id: u64`, `order_id: u64`, `total_cost_cents: u64`, `fee_cents: u64`, `timestamp_ns: u64`).
3. Define a `TradingError` enum (`InvalidQuantity`, `PriceOutOfBounds`, `InsufficientLiquidity`).
4. Implement `OrderExecutionEngine` with fields `trade_counter: u64`, `total_volume_cents: u64`, and `fee_tier_bps: u32`:
   - Implement `execute_order(&mut self, order: Order, timestamp_ns: u64) -> Result<TradeReceipt, TradingError>`.
   - Use early validation statements returning `TradingError`.
   - Use a nested block **expression** `{ let raw_cost = ...; let calculated_fee = ...; (raw_cost, calculated_fee) }` to calculate fee and cost in an isolated temporary scope.
   - Execute state updates (`trade_counter`, `total_volume_cents`) via sequential statements.
   - Return `Ok(TradeReceipt)` as the final method expression.
5. Write unit tests inside `#[cfg(test)] mod tests` asserting valid receipts, fee calculations, zero-quantity error handling, and out-of-bounds price handling using `assert_eq!`, `assert!`, `assert_ne!`, and `matches!`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct Order {
>     pub id: u64,
>     pub trader_id: String,
>     pub symbol: String,
>     pub price_cents: u64,
>     pub quantity: u32,
>     pub is_buy: bool,
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct TradeReceipt {
>     pub trade_id: u64,
>     pub order_id: u64,
>     pub total_cost_cents: u64,
>     pub fee_cents: u64,
>     pub timestamp_ns: u64,
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub enum TradingError {
>     InvalidQuantity,
>     PriceOutOfBounds,
>     InsufficientLiquidity,
> }
> 
> #[derive(Debug, Default)]
> pub struct OrderExecutionEngine {
>     pub trade_counter: u64,
>     pub total_volume_cents: u64,
>     pub fee_tier_bps: u32, // Basis points (e.g. 10 BPS = 0.10%)
> }
> 
> impl OrderExecutionEngine {
>     pub fn new(fee_tier_bps: u32) -> Self {
>         Self {
>             trade_counter: 0,
>             total_volume_cents: 0,
>             fee_tier_bps,
>         }
>     }
> 
>     pub fn execute_order(
>         &mut self,
>         order: Order,
>         timestamp_ns: u64,
>     ) -> Result<TradeReceipt, TradingError> {
>         // Block Statement 1: Input Validation Statements
>         if order.quantity == 0 {
>             return Err(TradingError::InvalidQuantity);
>         }
>         if order.price_cents == 0 || order.price_cents > 1_000_000_000 {
>             return Err(TradingError::PriceOutOfBounds);
>         }
> 
>         // Block Expression 2: Isolated block scope calculating fees.
>         // Scratch variables `raw_cost` and `calculated_fee` are scoped to this block.
>         let (total_cost, fee) = {
>             let raw_cost = (order.price_cents as u128) * (order.quantity as u128);
>             let calculated_fee = (raw_cost * (self.fee_tier_bps as u128)) / 10_000;
>             
>             // Final line without semicolon makes this block an EXPRESSION yielding a tuple
>             (raw_cost as u64, calculated_fee as u64)
>         };
> 
>         // Statement 3: Update engine state statements
>         self.trade_counter += 1;
>         self.total_volume_cents += total_cost;
>         let generated_trade_id = self.trade_counter * 100_000 + order.id;
> 
>         // Final Expression: Constructs and returns the TradeReceipt inside Result::Ok
>         Ok(TradeReceipt {
>             trade_id: generated_trade_id,
>             order_id: order.id,
>             total_cost_cents: total_cost + fee,
>             fee_cents: fee,
>             timestamp_ns,
>         })
>     }
> }
> 
> fn main() {
>     let mut engine = OrderExecutionEngine::new(15); // 15 BPS
>     let order = Order {
>         id: 501,
>         trader_id: "TRADER_ALICE".to_string(),
>         symbol: "AAPL".to_string(),
>         price_cents: 15_000, // $150.00
>         quantity: 10,        // 10 shares -> $1,500.00 (150,000 cents)
>         is_buy: true,
>     };
> 
>     match engine.execute_order(order, 1690000000000000000) {
>         Ok(receipt) => println!("Trade executed: {:?}", receipt),
>         Err(err) => eprintln!("Execution error: {:?}", err),
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_successful_order_execution() {
>         let mut engine = OrderExecutionEngine::new(20); // 20 BPS = 0.2%
>         let order = Order {
>             id: 1,
>             trader_id: "T1".to_string(),
>             symbol: "BTC".to_string(),
>             price_cents: 50_000_00, // $50,000.00 -> 5,000,000 cents
>             quantity: 2,
>             is_buy: true,
>         };
> 
>         let result = engine.execute_order(order, 1000);
>         assert!(result.is_ok());
> 
>         let receipt = result.unwrap();
>         // 5,000,000 * 2 = 10,000,000 cents raw cost.
>         // Fee = 10,000,000 * 20 / 10,000 = 20,000 cents ($200.00).
>         assert_eq!(receipt.order_id, 1);
>         assert_eq!(receipt.fee_cents, 20_000);
>         assert_eq!(receipt.total_cost_cents, 10_020_000);
>         assert_eq!(receipt.trade_id, 100_001);
> 
>         assert_eq!(engine.trade_counter, 1);
>         assert_eq!(engine.total_volume_cents, 10_000_000);
>     }
> 
>     #[test]
>     fn test_zero_quantity_rejection() {
>         let mut engine = OrderExecutionEngine::new(10);
>         let order = Order {
>             id: 2,
>             trader_id: "T2".to_string(),
>             symbol: "ETH".to_string(),
>             price_cents: 3_000_00,
>             quantity: 0,
>             is_buy: false,
>         };
> 
>         let result = engine.execute_order(order, 2000);
>         assert!(matches!(result, Err(TradingError::InvalidQuantity)));
>         assert_eq!(engine.trade_counter, 0);
>         assert_eq!(engine.total_volume_cents, 0);
>     }
> 
>     #[test]
>     fn test_price_out_of_bounds() {
>         let mut engine = OrderExecutionEngine::new(10);
>         let order = Order {
>             id: 3,
>             trader_id: "T3".to_string(),
>             symbol: "GOOG".to_string(),
>             price_cents: 0,
>             quantity: 5,
>             is_buy: true,
>         };
> 
>         let result = engine.execute_order(order, 3000);
>         assert_ne!(result, Ok(TradeReceipt { trade_id: 0, order_id: 3, total_cost_cents: 0, fee_cents: 0, timestamp_ns: 0 }));
>         assert!(matches!(result, Err(TradingError::PriceOutOfBounds)));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Block Scopes & Resource Reclamation**:
>    - The inner block `let (total_cost, fee) = { ... };` creates a scope for scratch calculation variables (`raw_cost`, `calculated_fee`).
>    - Because `raw_cost` is a 128-bit integer (`u128`) created to prevent arithmetic overflow during multiplication, keeping it inside the block scope ensures its stack frame space is freed immediately upon block exit.
> 2. **Block Statement vs. Block Expression**:
>    - Inside the calculation block, `(raw_cost as u64, calculated_fee as u64)` lacks a trailing semicolon. This makes the block evaluate to `(u64, u64)`, which is bound by the `let` statement to `(total_cost, fee)`.
>    - If a semicolon were added after `(raw_cost as u64, calculated_fee as u64);`, the block would yield `()`, causing a type error on `let (total_cost, fee) = ...`.
> 3. **Concurrency and Mutability Invariants**:
>    - `execute_order` takes `&mut self`, granting exclusive access to modify `self.trade_counter` and `self.total_volume_cents` sequentially without data races.
>

---

### Exercise 3: Low-Level Embedded Sensor Driver & Register Statement Pipeline

**Scenario:**
In embedded systems and micro-controller device drivers, device initialization and memory-mapped I/O (MMIO) register writes consist of sequential imperative **statements**. Writing bitmasks to configuration registers, resetting hardware peripherals, and clearing interrupt pending flags perform hardware side-effects but do not return meaningful values—they implicitly evaluate to `()` (the unit type).

By contrast, reading hardware values into driver state relies on **expressions** that map raw 16-bit register values to physical floating-point telemetry (e.g., temperature in Celsius and relative humidity percentage). Understanding how unit-returning function calls operate as statements is critical for avoiding subtle driver sequencing bugs.

**Task:**
1. Implement a simulated `RegisterBank` struct representing hardware MMIO registers (`ctrl: u32`, `status: u32`, `data_high: u16`, `data_low: u16`).
2. Define a `SensorReadout` struct (`temperature_celsius: f32`, `humidity_percent: f32`, `hardware_status: u32`).
3. Define a `DriverError` enum (`DeviceBusy`, `HardwareFault`, `Timeout`).
4. Implement `SensorDriver` containing a `RegisterBank` and `is_initialized: bool`:
   - `initialize(&mut self) -> Result<(), DriverError>`: Uses sequential hardware write statements to toggle reset and control register bits, returning `Ok(())`.
   - `ack_interrupt(&mut self)`: Imperative side-effect statement function that clears interrupt status flags and returns `()`.
   - `read_sensor(&mut self) -> Result<SensorReadout, DriverError>`: Validates driver state with statements, invokes `self.ack_interrupt()` as a side-effect statement, and uses a block expression to convert raw register values to physical units inside `SensorReadout`.
5. Write comprehensive unit tests inside `#[cfg(test)] mod tests` verifying driver initialization, data conversion accuracy, busy state error matching, and interrupt acknowledge side-effects using `assert_eq!`, `assert!`, `assert_ne!`, and `matches!`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone, Default)]
> pub struct RegisterBank {
>     pub ctrl: u32,
>     pub status: u32,
>     pub data_high: u16,
>     pub data_low: u16,
> }
> 
> #[derive(Debug, Clone, PartialEq)]
> pub struct SensorReadout {
>     pub temperature_celsius: f32,
>     pub humidity_percent: f32,
>     pub hardware_status: u32,
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub enum DriverError {
>     DeviceBusy,
>     HardwareFault,
>     Timeout,
> }
> 
> pub struct SensorDriver {
>     pub reg: RegisterBank,
>     pub is_initialized: bool,
> }
> 
> impl SensorDriver {
>     pub fn new() -> Self {
>         Self {
>             reg: RegisterBank::default(),
>             is_initialized: false,
>         }
>     }
> 
>     /// Executed via sequence of hardware control statements
>     pub fn initialize(&mut self) -> Result<(), DriverError> {
>         // Statement 1: Assert soft reset bit (Bit 1)
>         self.reg.ctrl |= 0x02;
> 
>         // Statement 2: Clear reset bit and set Enable (Bit 0) + Interrupt Enable (Bit 2)
>         self.reg.ctrl &= !0x02;
>         self.reg.ctrl |= 0x01 | 0x04;
> 
>         // Statement 3: Set status ready bit (Bit 0)
>         self.reg.status = 0x01;
> 
>         // Statement 4: Update driver internal state
>         self.is_initialized = true;
> 
>         // Expression: Yield Ok(()) unit value indicating successful initialization
>         Ok(())
>     }
> 
>     /// Unit-returning hardware side-effect statement function
>     pub fn ack_interrupt(&mut self) {
>         // Statement: Clear any pending interrupt flags in control/status registers
>         self.reg.status &= !0x04; // Clear error bit if any
>     }
> 
>     pub fn read_sensor(&mut self) -> Result<SensorReadout, DriverError> {
>         // Statement 1: Check driver initialization state
>         if !self.is_initialized {
>             return Err(DriverError::HardwareFault);
>         }
> 
>         // Statement 2: Verify hardware status (Bit 1 = Busy, Bit 2 = Error)
>         if (self.reg.status & 0x02) != 0 {
>             return Err(DriverError::DeviceBusy);
>         }
>         if (self.reg.status & 0x04) != 0 {
>             return Err(DriverError::HardwareFault);
>         }
> 
>         // Statement 3: Read raw registers into local variables
>         let raw_temp = self.reg.data_high;
>         let raw_humidity = self.reg.data_low;
> 
>         // Statement 4: Perform side-effect call (returns `()`, strictly a statement)
>         self.ack_interrupt();
> 
>         // Block Expression: Calculate physical units and construct SensorReadout
>         let readout = {
>             // Raw temp scale: 0..65535 maps to -40.0°C to +125.0°C
>             let temp_c = -40.0 + (raw_temp as f32 / 65535.0) * 165.0;
>             // Raw humidity scale: 0..65535 maps to 0.0% to 100.0%
>             let humidity_pct = (raw_humidity as f32 / 65535.0) * 100.0;
> 
>             SensorReadout {
>                 temperature_celsius: temp_c,
>                 humidity_percent: humidity_pct,
>                 hardware_status: self.reg.status,
>             }
>         };
> 
>         Ok(readout)
>     }
> }
> 
> fn main() {
>     let mut driver = SensorDriver::new();
>     if let Err(e) = driver.initialize() {
>         eprintln!("Initialization failed: {:?}", e);
>         return;
>     }
> 
>     driver.reg.data_high = 32768; // ~42.5°C
>     driver.reg.data_low = 32768;  // 50.0%
> 
>     match driver.read_sensor() {
>         Ok(readout) => println!("Sensor readout: {:?}", readout),
>         Err(e) => eprintln!("Read error: {:?}", e),
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_driver_initialization_and_read() {
>         let mut driver = SensorDriver::new();
>         assert!(!driver.is_initialized);
> 
>         let init_res = driver.initialize();
>         assert!(init_res.is_ok());
>         assert_eq!(init_res, Ok(()));
>         assert!(driver.is_initialized);
>         assert_eq!(driver.reg.ctrl & 0x05, 0x05); // Enable and Interrupt bits set
> 
>         // Set raw data
>         driver.reg.data_high = 65535; // Max temp -> 125.0°C
>         driver.reg.data_low = 0;     // Min humidity -> 0.0%
> 
>         let read_res = driver.read_sensor();
>         assert!(read_res.is_ok());
> 
>         let readout = read_res.unwrap();
>         assert!((readout.temperature_celsius - 125.0).abs() < 0.01);
>         assert!((readout.humidity_percent - 0.0).abs() < 0.01);
>         assert_eq!(readout.hardware_status, 0x01);
>     }
> 
>     #[test]
>     fn test_uninitialized_read_fails() {
>         let mut driver = SensorDriver::new();
>         let result = driver.read_sensor();
>         assert!(matches!(result, Err(DriverError::HardwareFault)));
>     }
> 
>     #[test]
>     fn test_device_busy_error() {
>         let mut driver = SensorDriver::new();
>         let _ = driver.initialize();
> 
>         // Set busy bit (Bit 1)
>         driver.reg.status |= 0x02;
> 
>         let result = driver.read_sensor();
>         assert_eq!(result, Err(DriverError::DeviceBusy));
>         assert_ne!(result, Ok(SensorReadout { temperature_celsius: 0.0, humidity_percent: 0.0, hardware_status: 0 }));
>     }
> 
>     #[test]
>     fn test_ack_interrupt_statement_side_effect() {
>         let mut driver = SensorDriver::new();
>         driver.reg.status = 0x05; // Ready + Error
> 
>         // Call ack_interrupt as a side-effect statement
>         driver.ack_interrupt();
>         assert_eq!(driver.reg.status, 0x01); // Error bit (0x04) cleared
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Unit-Returning Functions as Statements**:
>    - Functions like `ack_interrupt(&mut self)` have an implicit return type of `()`. In `read_sensor`, invoking `self.ack_interrupt();` acts as a pure side-effect statement.
>    - Trying to bind `let x = self.ack_interrupt();` binds `x` to `()`. Rust prohibits using `x` in value arithmetic because `()` carries no runtime information.
> 2. **Imperative Hardware Write Statements**:
>    - Compound bitwise assignments like `self.reg.ctrl |= 0x01;` are statements in Rust. Unlike C (where `(a |= b)` evaluates to the updated value), Rust assignment operators return `()`, preventing ambiguous chaining such as `x = y = z`.
> 3. **Type Conversion Expressions**:
>    - The conversion `{ let temp_c = -40.0 + ...; SensorReadout { ... } }` is a block expression producing a `SensorReadout` struct. The calculation avoids intermediate mutation by using direct mathematical mapping expressions.
>

---

## 6. Related Terms


- [Expressions](expressions.md) — The exact opposite. Expressions *evaluate* to a value, and they do not end with a semicolon.
- [`if` / `else`](../level_02/if_else.md) — In many languages, `if` is a statement. In Rust, it is an expression.
- [Unit Type (`()`)](unit_type.md) — Related concept: Unit Type (`()`).
- [Expressions vs. Statements](expression_vs_statement.md) — Related concept: Expressions vs. Statements.

---

## 7. Key Takeaways

- Statements are instructions that perform an action but **do not return a value**.
- Because they don't return a value, you cannot assign a statement to a variable (no `let x = (let y = 5);`).
- `let` bindings and function declarations are statements.
- Adding a semicolon (`;`) to the end of an expression turns it into a statement, throwing away its value.
