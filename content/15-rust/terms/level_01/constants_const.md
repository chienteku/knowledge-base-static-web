# Constants (`const`)

> **Level 1 — Foundations**
> Compile-time constants that must have an explicit type and are always immutable.

---

## 1. Prerequisites


- [Variable](variable.md) — Regular bindings that are evaluated at runtime.
- [Type Annotation](type_annotation.md) — The syntax required to define the type, which is mandatory for constants.

---

## 2. Term Category

**Rust-nonspecific**: Constants exist in almost all programming languages (like `final` in Java, or `const` in JavaScript/C++) to represent values that never change.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

While variables (`let`) are immutable by default in Rust, they are still evaluated at *runtime*. This means the computer allocates memory for them while the program is actively running. 

Sometimes, you have a value that will absolutely *never* change and is known before the program even runs (like the speed of light, the maximum number of players in a game, or the number of hours in a day). For these, Rust provides the `const` keyword. 

When you use `const`, the compiler doesn't wait until runtime to allocate memory. Instead, it takes the value and literally copies and pastes it everywhere you used that constant in the code while it is building the executable. This makes `const` incredibly fast and efficient. Because of this, constants can be declared in the global scope (outside of any function), making them accessible from anywhere in your code.

### (2) Reality Metaphor

Think of a regular variable (`let`) as a **post-it note** on your desk. You write on it when you sit down to work (runtime), and you can throw it away when you are done.

A `const` is like the **rules permanently printed on the back of a board game box** (e.g., "MAX PLAYERS: 4"). It was decided at the factory (compile-time) before you ever opened the box. It is printed in permanent ink, it applies to the entire game, and you absolutely cannot erase or change it while playing.

### (3) Rust Code Examples

#### Short Snippet
```rust
// Constants MUST have a type annotation.
// By convention, they are named in SCREAMING_SNAKE_CASE.
const MAX_SPEED: u32 = 120;
```

#### Fuller Example
```rust
// Constants can be declared in the global scope, outside of any function.
const SECONDS_IN_MINUTE: u32 = 60;
const MINUTES_IN_HOUR: u32 = 60;

// You can use basic math to define a constant, 
// as long as the math can be calculated at compile-time.
const SECONDS_IN_HOUR: u32 = SECONDS_IN_MINUTE * MINUTES_IN_HOUR;

fn main() {
    let hours_worked = 5;
    
    // We can use the global constant down here inside the function.
    let seconds_worked = hours_worked * SECONDS_IN_HOUR;
    
    println!("You worked for {} seconds.", seconds_worked);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Attempting Runtime Computation in `const` Initializers

**The mistake:** Initializing a `const` value using a non-const function call like `const TIME: u64 = SystemTime::now()...`.

**Why it's wrong:** `const` values must be fully evaluated at compile time. Non-const function calls are evaluated at runtime.

*Incorrect:*
```rust
// const NOW: u64 = get_current_timestamp(); // ❌ Non-const function call
```

*Fix:*
```rust
const TIMEOUT_SECS: u64 = 30; // Evaluated at compile time
```

### Mistake 2: Confusing `const` with `let` Immutability

**The mistake:** Omitting explicit type annotations on `const` declarations (`const MAX = 100;`).

**Why it's wrong:** Unlike `let`, `const` declarations MANDATE explicit type annotations.

*Incorrect:*
```rust
// const MAX = 100; // ❌ Missing type annotation
```

*Fix:*
```rust
const MAX: i32 = 100; // Explicit type required
```

### Mistake 3: Expecting `const` Memory Location Equivalence

**The mistake:** Taking references to `const` items expecting them to point to a single global memory address.

**Why it's wrong:** `const` values are inlined into every location where they are referenced, creating independent copies at each site.

*Incorrect:*
```rust
const FOO: String = String::new(); // ❌ Cannot allocate heap string in const
```

*Fix:*
```rust
const FOO: &str = "static text"; // Inlined static string slice
```

---

## 5. Practice Exercises

### Exercise 1: High-Throughput Network Telemetry Packet Header Engine

**Scenario**:
You are tasked with building a zero-allocation binary network protocol packet header validator for a telemetry ingestion server. The network protocol specification dictates strict compile-time constants for protocol verification (magic bytes), maximum payload limits, fixed frame header dimensions, and flag bitfield masks.

**Requirements**:
1. Define global `const` items for:
   - `MAGIC_HEADER: [u8; 4] = [0x50, 0x4B, 0x54, 0x01]` (represents ASCII `"PKT\x01"`).
   - `HEADER_SIZE: usize = 8`.
   - `MAX_PAYLOAD_BYTES: u16 = 1024`.
   - Bitfield masks for flags: `FLAG_ENCRYPTED` (bit 0), `FLAG_COMPRESSED` (bit 1), `FLAG_PRIORITY` (bit 2).
2. Create an enum `PacketError` with variants: `InvalidMagic([u8; 4])`, `PayloadTooLarge(u16)`, and `InvalidChecksum { expected: u8, actual: u8 }`.
3. Create a struct `PacketHeader` storing `magic`, `payload_len`, `flags`, and `checksum`.
4. Implement `pub const fn compute_checksum(magic: &[u8; 4], payload_len: u16, flags: u8) -> u8` calculating an 8-bit XOR checksum across all header fields at compile time or runtime.
5. Implement `pub const fn new(flags: u8, payload_len: u16) -> Result<Self, PacketError>` validating payload boundary and computing checksum.
6. Implement `pub const fn is_flag_set(&self, flag_mask: u8) -> bool`.
7. Implement `pub fn serialize(&self) -> [u8; HEADER_SIZE]` and `pub fn deserialize(bytes: &[u8; HEADER_SIZE]) -> Result<Self, PacketError>`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq, Clone, Copy)]
> pub enum PacketError {
>     InvalidMagic([u8; 4]),
>     PayloadTooLarge(u16),
>     InvalidChecksum { expected: u8, actual: u8 },
> }
> 
> pub const MAGIC_HEADER: [u8; 4] = [0x50, 0x4B, 0x54, 0x01];
> pub const HEADER_SIZE: usize = 8;
> pub const MAX_PAYLOAD_BYTES: u16 = 1024;
> 
> pub const FLAG_ENCRYPTED: u8 = 1 << 0;
> pub const FLAG_COMPRESSED: u8 = 1 << 1;
> pub const FLAG_PRIORITY: u8 = 1 << 2;
> 
> #[derive(Debug, PartialEq, Eq, Clone, Copy)]
> pub struct PacketHeader {
>     pub magic: [u8; 4],
>     pub payload_len: u16,
>     pub flags: u8,
>     pub checksum: u8,
> }
> 
> impl PacketHeader {
>     pub const fn compute_checksum(magic: &[u8; 4], payload_len: u16, flags: u8) -> u8 {
>         let len_hi = ((payload_len >> 8) & 0xFF) as u8;
>         let len_lo = (payload_len & 0xFF) as u8;
>         magic[0] ^ magic[1] ^ magic[2] ^ magic[3] ^ len_hi ^ len_lo ^ flags
>     }
> 
>     pub const fn new(flags: u8, payload_len: u16) -> Result<Self, PacketError> {
>         if payload_len > MAX_PAYLOAD_BYTES {
>             return Err(PacketError::PayloadTooLarge(payload_len));
>         }
>         let checksum = Self::compute_checksum(&MAGIC_HEADER, payload_len, flags);
>         Ok(Self {
>             magic: MAGIC_HEADER,
>             payload_len,
>             flags,
>             checksum,
>         })
>     }
> 
>     pub const fn is_flag_set(&self, flag_mask: u8) -> bool {
>         (self.flags & flag_mask) != 0
>     }
> 
>     pub fn serialize(&self) -> [u8; HEADER_SIZE] {
>         let len_bytes = self.payload_len.to_be_bytes();
>         [
>             self.magic[0],
>             self.magic[1],
>             self.magic[2],
>             self.magic[3],
>             len_bytes[0],
>             len_bytes[1],
>             self.flags,
>             self.checksum,
>         ]
>     }
> 
>     pub fn deserialize(bytes: &[u8; HEADER_SIZE]) -> Result<Self, PacketError> {
>         let magic = [bytes[0], bytes[1], bytes[2], bytes[3]];
>         if magic[0] != MAGIC_HEADER[0]
>             || magic[1] != MAGIC_HEADER[1]
>             || magic[2] != MAGIC_HEADER[2]
>             || magic[3] != MAGIC_HEADER[3]
>         {
>             return Err(PacketError::InvalidMagic(magic));
>         }
>         let payload_len = u16::from_be_bytes([bytes[4], bytes[5]]);
>         if payload_len > MAX_PAYLOAD_BYTES {
>             return Err(PacketError::PayloadTooLarge(payload_len));
>         }
>         let flags = bytes[6];
>         let actual_checksum = bytes[7];
>         let expected_checksum = Self::compute_checksum(&magic, payload_len, flags);
> 
>         if actual_checksum != expected_checksum {
>             return Err(PacketError::InvalidChecksum {
>                 expected: expected_checksum,
>                 actual: actual_checksum,
>             });
>         }
> 
>         Ok(Self {
>             magic,
>             payload_len,
>             flags,
>             checksum: actual_checksum,
>         })
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_header_creation_and_flag_check() {
>         let header = PacketHeader::new(FLAG_ENCRYPTED | FLAG_PRIORITY, 512).unwrap();
>         assert_eq!(header.magic, MAGIC_HEADER);
>         assert_eq!(header.payload_len, 512);
>         assert!(header.is_flag_set(FLAG_ENCRYPTED));
>         assert!(header.is_flag_set(FLAG_PRIORITY));
>         assert!(!header.is_flag_set(FLAG_COMPRESSED));
>     }
> 
>     #[test]
>     fn test_payload_exceeds_max_limit() {
>         let result = PacketHeader::new(FLAG_ENCRYPTED, 2048);
>         assert!(matches!(result, Err(PacketError::PayloadTooLarge(2048))));
>         assert_ne!(result, Ok(PacketHeader::new(FLAG_ENCRYPTED, 512).unwrap()));
>     }
> 
>     #[test]
>     fn test_serialization_deserialization_roundtrip() {
>         let original = PacketHeader::new(FLAG_COMPRESSED, 100).unwrap();
>         let bytes = original.serialize();
>         assert_eq!(bytes.len(), HEADER_SIZE);
> 
>         let deserialized = PacketHeader::deserialize(&bytes).unwrap();
>         assert_eq!(original, deserialized);
>     }
> 
>     #[test]
>     fn test_corrupted_checksum() {
>         let header = PacketHeader::new(FLAG_ENCRYPTED, 256).unwrap();
>         let mut bytes = header.serialize();
>         bytes[7] ^= 0xFF; // Corrupt checksum byte
>         let result = PacketHeader::deserialize(&bytes);
>         assert!(matches!(result, Err(PacketError::InvalidChecksum { .. })));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Compile-Time Invariants & Inlining**:
>    Constants defined with `const` are evaluated during compilation and inlined as literal byte patterns wherever used. Placing protocol magic numbers (`MAGIC_HEADER`) and sizing bounds (`HEADER_SIZE`, `MAX_PAYLOAD_BYTES`) in `const` items guarantees zero runtime allocation or memory lookup overhead.
> 2. **Const Functions (`const fn`)**:
>    `compute_checksum` and `new` are marked `const fn`. This permits the Rust compiler to validate headers and compute checksums at compile-time when called with constant parameters, while still allowing normal invocation at runtime. Bitwise shifts (`payload_len >> 8`) and XOR operators are fully deterministic within `const` contexts.
> 3. **Memory & Concurrency Implications**:
>    Because `const` items do not occupy a unique static memory address, using `MAGIC_HEADER` copies its byte sequence directly into caller stack frames or executable text segments. `PacketHeader` implements `Copy` and `Clone` because all its fields are scalar primitives (`[u8; 4]`, `u16`, `u8`), making stack movement thread-safe and free of synchronization locks.
> 4. **Edge Cases**:
>    - Payloads exceeding `MAX_PAYLOAD_BYTES` (1024 bytes) are rejected early by `new()` and `deserialize()`.
>    - High and low payload length bytes are parsed using big-endian byte order (`to_be_bytes()` and `from_be_bytes()`) to guarantee network transport compatibility across target CPU architectures.
>

---

### Exercise 2: Financial High-Frequency Trading Risk Management Subsystem

**Scenario**:
In high-frequency financial trading (HFT), trade parameters (e.g., scale factor decimals, order quantity caps, notional monetary exposure caps) must be evaluated with zero runtime overhead. You must build a fixed-point risk validator that calculates scaled monetary limits at compile time and validates orders before submission.

**Requirements**:
1. Define global constants:
   - `BASE_CURRENCY_DECIMALS: u32 = 4;`
   - `SCALE_FACTOR: u64 = 10u64.pow(BASE_CURRENCY_DECIMALS);` (Evaluated at compile-time: 10,000).
   - `MAX_ORDER_QUANTITY: u64 = 1_000 * SCALE_FACTOR;`
   - `MAX_NOTIONAL_VALUE: u64 = 500_000 * SCALE_FACTOR;`
   - `MIN_TICK_PRICE: u64 = 10;` (Represents $0.0010 USD minimum price increment).
2. Define `OrderSide` enum (`Buy`, `Sell`) and `RiskViolation` error enum (`ExceedsMaxQuantity`, `ExceedsMaxNotional`, `BelowMinTickPrice`, `OverflowDetected`).
3. Define `Order` struct holding `id: u64`, `price: u64`, `quantity: u64`, and `side: OrderSide`.
4. Implement `pub const fn calculate_notional(price: u64, quantity: u64) -> Option<u64>` performing fixed-point multiplication `(price * quantity) / SCALE_FACTOR` using overflow protection.
5. Implement `pub const fn validate_order(order: &Order) -> Result<(), RiskViolation>` enforcing tick bounds, maximum order sizes, and notional monetary caps.

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
> #[derive(Debug, PartialEq, Eq, Clone, Copy)]
> pub enum RiskViolation {
>     ExceedsMaxQuantity { requested: u64, max: u64 },
>     ExceedsMaxNotional { requested: u64, max: u64 },
>     BelowMinTickPrice { requested: u64, min: u64 },
>     OverflowDetected,
> }
> 
> pub const BASE_CURRENCY_DECIMALS: u32 = 4;
> pub const SCALE_FACTOR: u64 = 10u64.pow(BASE_CURRENCY_DECIMALS);
> pub const MAX_ORDER_QUANTITY: u64 = 1_000 * SCALE_FACTOR;
> pub const MAX_NOTIONAL_VALUE: u64 = 500_000 * SCALE_FACTOR;
> pub const MIN_TICK_PRICE: u64 = 10;
> 
> #[derive(Debug, PartialEq, Eq, Clone, Copy)]
> pub struct Order {
>     pub id: u64,
>     pub price: u64,
>     pub quantity: u64,
>     pub side: OrderSide,
> }
> 
> impl Order {
>     pub const fn new(id: u64, price: u64, quantity: u64, side: OrderSide) -> Self {
>         Self { id, price, quantity, side }
>     }
> }
> 
> pub const fn calculate_notional(price: u64, quantity: u64) -> Option<u64> {
>     match price.checked_mul(quantity) {
>         Some(product) => Some(product / SCALE_FACTOR),
>         None => None,
>     }
> }
> 
> pub const fn validate_order(order: &Order) -> Result<(), RiskViolation> {
>     if order.price < MIN_TICK_PRICE {
>         return Err(RiskViolation::BelowMinTickPrice {
>             requested: order.price,
>             min: MIN_TICK_PRICE,
>         });
>     }
> 
>     if order.quantity > MAX_ORDER_QUANTITY {
>         return Err(RiskViolation::ExceedsMaxQuantity {
>             requested: order.quantity,
>             max: MAX_ORDER_QUANTITY,
>         });
>     }
> 
>     match calculate_notional(order.price, order.quantity) {
>         Some(notional) => {
>             if notional > MAX_NOTIONAL_VALUE {
>                 Err(RiskViolation::ExceedsMaxNotional {
>                     requested: notional,
>                     max: MAX_NOTIONAL_VALUE,
>                 })
>             } else {
>                 Ok(())
>             }
>         }
>         None => Err(RiskViolation::OverflowDetected),
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_valid_order_passing_risk() {
>         let order = Order::new(1, 100 * SCALE_FACTOR, 50 * SCALE_FACTOR, OrderSide::Buy);
>         assert_eq!(validate_order(&order), Ok(()));
> 
>         let notional = calculate_notional(order.price, order.quantity).unwrap();
>         assert_eq!(notional, 5_000 * SCALE_FACTOR);
>     }
> 
>     #[test]
>     fn test_order_exceeding_max_quantity() {
>         let order = Order::new(2, 50 * SCALE_FACTOR, 1_001 * SCALE_FACTOR, OrderSide::Sell);
>         let result = validate_order(&order);
>         assert!(matches!(
>             result,
>             Err(RiskViolation::ExceedsMaxQuantity { requested: 10010000, max: 10000000 })
>         ));
>         assert_ne!(result, Ok(()));
>     }
> 
>     #[test]
>     fn test_order_exceeding_max_notional() {
>         let order = Order::new(3, 600 * SCALE_FACTOR, 900 * SCALE_FACTOR, OrderSide::Buy);
>         let result = validate_order(&order);
>         assert!(matches!(
>             result,
>             Err(RiskViolation::ExceedsMaxNotional { requested: 5400000000, max: 5000000000 })
>         ));
>     }
> 
>     #[test]
>     fn test_order_below_min_tick_price() {
>         let order = Order::new(4, 5, 10 * SCALE_FACTOR, OrderSide::Buy);
>         let result = validate_order(&order);
>         assert!(matches!(
>             result,
>             Err(RiskViolation::BelowMinTickPrice { requested: 5, min: 10 })
>         ));
>     }
> 
>     #[test]
>     fn test_notional_overflow_protection() {
>         let order = Order::new(5, u64::MAX, u64::MAX, OrderSide::Sell);
>         let result = validate_order(&order);
>         assert_eq!(result, Err(RiskViolation::OverflowDetected));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Compile-Time Expressions & Constant Folding**:
>    `SCALE_FACTOR` uses `10u64.pow(BASE_CURRENCY_DECIMALS)`. In Rust, standard primitive math operations on constants are evaluated during compilation via constant folding. Derived constants (`MAX_ORDER_QUANTITY` and `MAX_NOTIONAL_VALUE`) automatically absorb `SCALE_FACTOR` without introducing runtime multiplication instructions.
> 2. **Fixed-Point Arithmetic & Overflow Safety**:
>    Financial amounts are modeled as `u64` integers scaled by `10^4` to eliminate floating-point non-determinism. `calculate_notional` uses `price.checked_mul(quantity)` within a `const fn`. If multiplying two scaled values exceeds `u64::MAX`, the overflow is safely caught at compile time (if evaluated in a `const` context) or returns `None` safely at runtime.
> 3. **Immutability & Safety Invariants**:
>    Because risk parameters are `const`, they cannot be modified at runtime by rogue threads or compromised memory buffers. Compiler optimization passes inline these constant limits as immediate operand values in assembly output (`cmp rax, 5000000000`), reducing cache misses and branch latency.
> 4. **Edge Cases**:
>    - Orders placed below `MIN_TICK_PRICE` (e.g. fractional sub-ticks) fail early.
>    - Calculations that trigger integer overflow return `RiskViolation::OverflowDetected` without panicking.
>

---

### Exercise 3: Embedded Microcontroller Hardware Register & Bitmask Controller

**Scenario**:
In bare-metal microcontrollers, peripherals interact with CPU core clock domains using register offsets and bitmask constants. You are designing an emulated UART peripheral driver using compile-time baud rate divisor calculations and bitwise configuration constants.

**Requirements**:
1. Define base memory and register offset constants:
   - `UART_BASE_ADDR: usize = 0x4000_C000;`
   - `OFFSET_CTRL: usize = 0;`
   - `OFFSET_BAUD: usize = 1;`
   - `OFFSET_STATUS: usize = 2;`
   - `OFFSET_DATA: usize = 3;`
2. Define hardware clock constants:
   - `SYSTEM_CLOCK_HZ: u32 = 80_000_000;` (80 MHz system clock).
   - `OVERSAMPLING: u32 = 16;`
3. Define control register bitmasks:
   - `CTRL_ENABLE: u32 = 1 << 0;`
   - `CTRL_TX_EN: u32 = 1 << 1;`
   - `CTRL_RX_EN: u32 = 1 << 2;`
   - `CTRL_PARITY_EVEN: u32 = 1 << 3;`
4. Define status register bitmasks:
   - `STATUS_TX_EMPTY: u32 = 1 << 0;`
   - `STATUS_RX_READY: u32 = 1 << 1;`
   - `STATUS_ERR_OVERRUN: u32 = 1 << 2;`
5. Implement `pub const fn calculate_baud_divisor(baud_rate: u32) -> u32` and `pub const DEFAULT_BAUD_DIVISOR_115200: u32 = calculate_baud_divisor(115_200);`.
6. Implement `UartPeripheralMock` struct holding `registers: [u32; 4]` and methods for initialization, status queries, byte transmission, simulation of hardware byte reception, and buffer reading.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq, Clone)]
> pub struct UartPeripheralMock {
>     pub registers: [u32; 4],
> }
> 
> pub const UART_BASE_ADDR: usize = 0x4000_C000;
> pub const OFFSET_CTRL: usize = 0;
> pub const OFFSET_BAUD: usize = 1;
> pub const OFFSET_STATUS: usize = 2;
> pub const OFFSET_DATA: usize = 3;
> 
> pub const SYSTEM_CLOCK_HZ: u32 = 80_000_000;
> pub const OVERSAMPLING: u32 = 16;
> 
> pub const CTRL_ENABLE: u32 = 1 << 0;
> pub const CTRL_TX_EN: u32 = 1 << 1;
> pub const CTRL_RX_EN: u32 = 1 << 2;
> pub const CTRL_PARITY_EVEN: u32 = 1 << 3;
> 
> pub const STATUS_TX_EMPTY: u32 = 1 << 0;
> pub const STATUS_RX_READY: u32 = 1 << 1;
> pub const STATUS_ERR_OVERRUN: u32 = 1 << 2;
> 
> pub const fn calculate_baud_divisor(baud_rate: u32) -> u32 {
>     SYSTEM_CLOCK_HZ / (OVERSAMPLING * baud_rate)
> }
> 
> pub const DEFAULT_BAUD_DIVISOR_115200: u32 = calculate_baud_divisor(115_200);
> 
> impl UartPeripheralMock {
>     pub fn new() -> Self {
>         let mut registers = [0u32; 4];
>         registers[OFFSET_STATUS] = STATUS_TX_EMPTY;
>         Self { registers }
>     }
> 
>     pub fn init(&mut self, flags: u32, baud_divisor: u32) {
>         self.registers[OFFSET_CTRL] = flags | CTRL_ENABLE;
>         self.registers[OFFSET_BAUD] = baud_divisor;
>     }
> 
>     pub fn is_enabled(&self) -> bool {
>         (self.registers[OFFSET_CTRL] & CTRL_ENABLE) != 0
>     }
> 
>     pub fn is_rx_data_ready(&self) -> bool {
>         (self.registers[OFFSET_STATUS] & STATUS_RX_READY) != 0
>     }
> 
>     pub fn transmit_byte(&mut self, byte: u8) -> Result<(), &'static str> {
>         if !self.is_enabled() {
>             return Err("Peripheral Disabled");
>         }
>         if (self.registers[OFFSET_CTRL] & CTRL_TX_EN) == 0 {
>             return Err("TX Not Enabled");
>         }
>         if (self.registers[OFFSET_STATUS] & STATUS_TX_EMPTY) == 0 {
>             return Err("TX Buffer Busy");
>         }
> 
>         self.registers[OFFSET_DATA] = byte as u32;
>         self.registers[OFFSET_STATUS] &= !STATUS_TX_EMPTY;
>         Ok(())
>     }
> 
>     pub fn simulate_rx_hardware(&mut self, byte: u8) {
>         if (self.registers[OFFSET_STATUS] & STATUS_RX_READY) != 0 {
>             self.registers[OFFSET_STATUS] |= STATUS_ERR_OVERRUN;
>         }
>         self.registers[OFFSET_DATA] = byte as u32;
>         self.registers[OFFSET_STATUS] |= STATUS_RX_READY;
>     }
> 
>     pub fn receive_byte(&mut self) -> Result<u8, &'static str> {
>         if !self.is_enabled() {
>             return Err("Peripheral Disabled");
>         }
>         if (self.registers[OFFSET_CTRL] & CTRL_RX_EN) == 0 {
>             return Err("RX Not Enabled");
>         }
>         if !self.is_rx_data_ready() {
>             return Err("No Data Ready");
>         }
> 
>         let byte = (self.registers[OFFSET_DATA] & 0xFF) as u8;
>         self.registers[OFFSET_STATUS] &= !STATUS_RX_READY;
>         Ok(byte)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_baud_divisor_computation() {
>         assert_eq!(DEFAULT_BAUD_DIVISOR_115200, 43);
>         let baud_9600 = calculate_baud_divisor(9600);
>         assert_eq!(baud_9600, 520);
>         assert_ne!(DEFAULT_BAUD_DIVISOR_115200, baud_9600);
>     }
> 
>     #[test]
>     fn test_uart_initialization_and_enable() {
>         let mut uart = UartPeripheralMock::new();
>         assert!(!uart.is_enabled());
> 
>         uart.init(CTRL_TX_EN | CTRL_RX_EN, DEFAULT_BAUD_DIVISOR_115200);
>         assert!(uart.is_enabled());
>         assert_eq!(uart.registers[OFFSET_BAUD], 43);
>         assert_eq!(
>             uart.registers[OFFSET_CTRL],
>             CTRL_ENABLE | CTRL_TX_EN | CTRL_RX_EN
>         );
>     }
> 
>     #[test]
>     fn test_uart_transmission() {
>         let mut uart = UartPeripheralMock::new();
>         uart.init(CTRL_TX_EN, DEFAULT_BAUD_DIVISOR_115200);
> 
>         let tx_res = uart.transmit_byte(0xAB);
>         assert_eq!(tx_res, Ok(()));
>         assert_eq!(uart.registers[OFFSET_DATA], 0xAB);
>         assert!(!((uart.registers[OFFSET_STATUS] & STATUS_TX_EMPTY) != 0));
> 
>         let second_tx = uart.transmit_byte(0xCD);
>         assert!(matches!(second_tx, Err("TX Buffer Busy")));
>     }
> 
>     #[test]
>     fn test_uart_reception_and_overrun() {
>         let mut uart = UartPeripheralMock::new();
>         uart.init(CTRL_RX_EN, DEFAULT_BAUD_DIVISOR_115200);
> 
>         assert!(matches!(uart.receive_byte(), Err("No Data Ready")));
> 
>         uart.simulate_rx_hardware(0x42);
>         assert!(uart.is_rx_data_ready());
> 
>         let byte = uart.receive_byte().unwrap();
>         assert_eq!(byte, 0x42);
>         assert!(!uart.is_rx_data_ready());
> 
>         uart.simulate_rx_hardware(0x11);
>         uart.simulate_rx_hardware(0x22);
>         assert!((uart.registers[OFFSET_STATUS] & STATUS_ERR_OVERRUN) != 0);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Compile-Time Prescaler Computation**:
>    Computing prescaler register values (`calculate_baud_divisor`) at compile-time prevents floating-point or division instructions from running on embedded hardware during peripheral startup. `DEFAULT_BAUD_DIVISOR_115200` is computed directly by compiler constant evaluation (`80,000,000 / (16 * 115,200) = 43`).
> 2. **Bitmask Manipulation & Flags**:
>    Register bitfields are represented as bitwise shifts (`1 << n`). Combining flags using bitwise OR (`CTRL_TX_EN | CTRL_RX_EN`) creates clear, type-safe control words. Testing flags uses bitwise AND (`(reg & CTRL_ENABLE) != 0`).
> 3. **Hardware Memory Safety & Volatility Invariants**:
>    In actual bare-metal Rust drivers, `UART_BASE_ADDR` and offset constants are converted to raw pointers (`*mut u32`) used with `core::ptr::read_volatile` / `write_volatile`. By utilizing `const` for offsets and addresses, Rust eliminates pointer arithmetic errors at runtime.
> 4. **Edge Cases**:
>    - Transmitting while `STATUS_TX_EMPTY` is cleared returns an error, preventing transmit buffer overrun.
>    - Receiving multiple bytes before reading the data register triggers `STATUS_ERR_OVERRUN`.
>

---

## 6. Related Terms


- [Variable](variable.md) — A binding evaluated at runtime (which can be mutable or shadowed, unlike a constant).
- [Static (`static`)](static_static.md) — Another way to define a global value, but it represents a specific, single location in memory rather than being "pasted" everywhere like `const`.
- [Type Annotation](type_annotation.md) — The manual typing syntax that `const` strictly requires.
- [Mutability (`mut`)](mutability_mut.md) — Related concept: Mutability (`mut`).
- [Associated Constants](../level_04/associated_constants.md) — Related concept: Associated Constants.

---

## 7. Key Takeaways

- Constants are declared with the `const` keyword.
- They must **always** have an explicit type annotation (e.g., `: u32`).
- By convention, constant names are written in `SCREAMING_SNAKE_CASE`.
- Their values must be known at compile-time (you cannot use runtime functions to calculate them).
- They can be declared in any scope, including the global scope outside of `main()`.
