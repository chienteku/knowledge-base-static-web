# `impl` Block

> **Level 2 — Control Flow & Data Structures**
> Associates methods and associated functions with a struct or enum.

---

## 1. Prerequisites


- [Struct](struct.md) — The custom data types that `impl` blocks are most commonly attached to.
- [Enum](enum.md) — You can also attach `impl` blocks to enums!
- [`fn` (Functions)](../level_01/fn.md) — The functions that actually live inside the `impl` block.

---

## 2. Term Category

**Rust-specific (the separation of data and behavior)**: In Object-Oriented languages (like Java or C++), you define data (variables) and behavior (methods) together inside a single `class` block. Rust fundamentally separates them. Data is defined in a `struct`, and behavior is defined in an `impl` block.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In traditional Object-Oriented Programming, `class` files often balloon into massive, thousands-of-lines-long "God Objects" because all the data and every single behavior must be stuffed into the exact same set of curly braces. 

Rust enforces a strict architectural boundary. First, you define the pure "shape" of your data using a `struct`. Then, if you want that data to actually *do* something, you define an `impl` (short for "implementation") block. 

This design is incredibly flexible. You can create an `impl` block for a struct in one file, and a completely separate `impl` block for that *exact same struct* in another file! It keeps code organized, modular, and prevents bloated files.

### (2) Reality Metaphor

Imagine building a Robot.

A **`struct`** is the physical hardware: the metal chassis, the motors, the battery, and the sensors. On its own, it is just a dumb piece of metal. It doesn't *do* anything.

An **`impl` block** is the software chip you plug into the robot. The chip contains the instructions that teach the physical hardware how to walk, talk, and interact with the world. You can easily swap chips or plug in multiple chips (`impl` blocks) to give the robot new abilities without having to rebuild the metal body (`struct`).

### (3) Rust Code Examples

#### Short Snippet (The Basics)
```rust
// 1. Define the Data (The Hardware)
struct User {
    username: String,
}

// 2. Define the Behavior (The Software Chip)
impl User {
    // This is a "Method" because it takes `&self`
    fn print_name(&self) {
        println!("My name is {}", self.username);
    }
}

fn main() {
    let u = User { username: String::from("Maverick") };
    u.print_name(); // Calling the behavior!
}
```

#### Fuller Example (Multiple Blocks & Associated Functions)
```rust
struct Rectangle {
    width: u32,
    height: u32,
}

// Block 1: Core mathematical behavior
impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }
}

// Block 2: You can have multiple impl blocks for the same type!
// We can put Constructors (Associated Functions) here.
impl Rectangle {
    // Notice this does NOT take `&self`. It's like a "static" method.
    fn new(size: u32) -> Rectangle {
        Rectangle { width: size, height: size }
    }
}

fn main() {
    // Calling an Associated Function uses `::`
    let square = Rectangle::new(10);
    
    // Calling a Method uses `.`
    println!("The area is {}", square.area());
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Impl Block Scoping and Lifecycle Rules

**The mistake:** Assuming Impl Block instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("impl_block_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("impl_block_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Impl Block State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Impl Block through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Impl Block Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Impl Block instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Financial Order Book & State Transition Engine

**Scenario:** **Problem Scenario:**
High-frequency trading engines require separating order data definitions from matching logic and state transitions. You need to model an order book where orders transition between statuses safely, while matching bids and asks using distinct `impl` blocks.

**Requirements:**
Implement the following:
1. An `OrderStatus` enum with variants `Pending`, `Filled { executed_price: u64 }`, and `Cancelled { reason: String }`.
2. An `impl OrderStatus` block featuring self-consuming state transition methods:
   - `transition_to_filled(self, price: u64) -> Result<Self, &'static str>`
   - `transition_to_cancelled(self, reason: String) -> Result<Self, &'static str>`
3. An `Order` struct containing `id: u64`, `price: u64`, `quantity: u32`, and `status: OrderStatus`.
4. An `OrderBook` struct holding bids and asks queues (`Vec<Order>`), separated into two distinct `impl OrderBook` blocks:
   - Block 1 (Data Ingestion): Constructors (`new`) and queue insertion methods (`add_bid`, `add_ask`).
   - Block 2 (Matching & Telemetry): Market inspection (`best_bid`, `best_ask`) and matching execution (`match_orders`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Clone)]
> pub enum OrderStatus {
>     Pending,
>     Filled { executed_price: u64 },
>     Cancelled { reason: String },
> }
> 
> impl OrderStatus {
>     pub fn transition_to_filled(self, price: u64) -> Result<Self, &'static str> {
>         match self {
>             OrderStatus::Pending => Ok(OrderStatus::Filled { executed_price: price }),
>             _ => Err("Invalid transition: order is not in Pending status"),
>         }
>     }
> 
>     pub fn transition_to_cancelled(self, reason: String) -> Result<Self, &'static str> {
>         match self {
>             OrderStatus::Pending => Ok(OrderStatus::Cancelled { reason }),
>             _ => Err("Invalid transition: order is not in Pending status"),
>         }
>     }
> }
> 
> #[derive(Debug, Clone)]
> pub struct Order {
>     pub id: u64,
>     pub price: u64,
>     pub quantity: u32,
>     pub status: OrderStatus,
> }
> 
> impl Order {
>     pub fn new(id: u64, price: u64, quantity: u32) -> Self {
>         Self {
>             id,
>             price,
>             quantity,
>             status: OrderStatus::Pending,
>         }
>     }
> }
> 
> pub struct OrderBook {
>     bids: Vec<Order>,
>     asks: Vec<Order>,
> }
> 
> // Impl Block 1: Data Ingestion & Storage
> impl OrderBook {
>     pub fn new() -> Self {
>         Self {
>             bids: Vec::new(),
>             asks: Vec::new(),
>         }
>     }
> 
>     pub fn add_bid(&mut self, order: Order) {
>         self.bids.push(order);
>         self.bids.sort_by(|a, b| b.price.cmp(&a.price));
>     }
> 
>     pub fn add_ask(&mut self, order: Order) {
>         self.asks.push(order);
>         self.asks.sort_by(|a, b| a.price.cmp(&b.price));
>     }
> }
> 
> // Impl Block 2: Matching Engine & State Inspection
> impl OrderBook {
>     pub fn best_bid(&self) -> Option<u64> {
>         self.bids.first().map(|o| o.price)
>     }
> 
>     pub fn best_ask(&self) -> Option<u64> {
>         self.asks.first().map(|o| o.price)
>     }
> 
>     pub fn match_orders(&mut self) -> Option<(u64, u32)> {
>         let best_bid = self.bids.first()?;
>         let best_ask = self.asks.first()?;
> 
>         if best_bid.price >= best_ask.price {
>             let matched_price = best_ask.price;
>             let mut bid = self.bids.remove(0);
>             let mut ask = self.asks.remove(0);
> 
>             let qty = bid.quantity.min(ask.quantity);
> 
>             let old_bid_status = std::mem::replace(&mut bid.status, OrderStatus::Pending);
>             bid.status = old_bid_status.transition_to_filled(matched_price).ok()?;
> 
>             let old_ask_status = std::mem::replace(&mut ask.status, OrderStatus::Pending);
>             ask.status = old_ask_status.transition_to_filled(matched_price).ok()?;
> 
>             Some((matched_price, qty))
>         } else {
>             None
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_order_book_operations() {
>         let mut book = OrderBook::new();
> 
>         let bid1 = Order::new(1, 100, 10);
>         let bid2 = Order::new(2, 105, 5);
>         let ask1 = Order::new(3, 102, 5);
>         let ask2 = Order::new(4, 110, 20);
> 
>         book.add_bid(bid1);
>         book.add_bid(bid2);
>         book.add_ask(ask1);
>         book.add_ask(ask2);
> 
>         assert_eq!(book.best_bid(), Some(105));
>         assert_eq!(book.best_ask(), Some(102));
>         assert_ne!(book.best_bid().unwrap(), book.best_ask().unwrap());
> 
>         let match_res = book.match_orders();
>         assert!(match_res.is_some());
>         assert_eq!(match_res, Some((102, 5)));
> 
>         let status = OrderStatus::Pending.transition_to_filled(102).unwrap();
>         assert!(matches!(status, OrderStatus::Filled { executed_price: 102 }));
> 
>         let invalid_transition = status.transition_to_cancelled("User cancelled".into());
>         assert!(invalid_transition.is_err());
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Receiver Semantics & State Transitions (`self` consumption)**:
>    - In `impl OrderStatus`, methods like `transition_to_filled(self, ...)` take `self` by value. This transfers ownership of the old `OrderStatus` instance, preventing reuse or accidental dual-transitioning of an already finalized order.
> 2. **Multiple `impl` Blocks for Architectural Cleanliness**:
>    - `OrderBook` separates constructor/ingestion operations (`add_bid`, `add_ask`) from state matching and querying operations (`best_bid`, `best_ask`, `match_orders`). In large systems, this separates mutation boundaries from read operations.
> 3. **Ownership and State Replacement**:
>    - In `match_orders`, `std::mem::replace` swaps the inner `OrderStatus` with a temporary `Pending` state so ownership of the enum value can be taken into `transition_to_filled` without moving out of a mutable structure without replacement.
> 4. **Edge Cases**:
>    - Empty books safely return `None` via the `?` operator on `self.bids.first()?`.
>    - Orders with non-matching prices (`best_bid < best_ask`) return `None` without modifying internal book queues.
> 
---

### Exercise 2: Zero-Copy Network Frame Buffer & Packet Decoder

**Scenario:** **Problem Scenario:**
High-performance streaming servers receive byte fragments over TCP sockets that must be validated and parsed into protocol packets without copying memory excessively.

**Requirements:**
Design a binary packet parsing engine:
1. Define a `FrameError` enum (`InvalidMagic`, `IncompleteFrame`, `ChecksumMismatch`).
2. Define a `Packet` struct with an `impl Packet` block containing slice borrow methods (`payload(&self) -> &[u8]`), length inspection (`payload_len`), and XOR checksum validation (`verify_checksum`).
3. Define a `FrameDecoder` struct holding an internal streaming buffer (`Vec<u8>`).
4. Implement an `impl FrameDecoder` block featuring associated constants (`MAGIC = [0xAA, 0x55]`, `HEADER_SIZE = 5`), data ingestion (`push_bytes(&mut self, data: &[u8])`), and framed decoding (`decode_next(&mut self) -> Result<Option<Packet>, FrameError>`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq)]
> pub enum FrameError {
>     InvalidMagic,
>     IncompleteFrame,
>     ChecksumMismatch,
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct Packet {
>     magic: [u8; 2],
>     checksum: u8,
>     payload: Vec<u8>,
> }
> 
> impl Packet {
>     pub fn new(magic: [u8; 2], checksum: u8, payload: Vec<u8>) -> Self {
>         Self { magic, checksum, payload }
>     }
> 
>     pub fn payload(&self) -> &[u8] {
>         &self.payload
>     }
> 
>     pub fn payload_len(&self) -> usize {
>         self.payload.len()
>     }
> 
>     pub fn verify_checksum(&self) -> bool {
>         let computed = self.payload.iter().fold(0u8, |acc, &b| acc ^ b);
>         computed == self.checksum
>     }
> }
> 
> pub struct FrameDecoder {
>     buffer: Vec<u8>,
> }
> 
> impl FrameDecoder {
>     pub const MAGIC: [u8; 2] = [0xAA, 0x55];
>     pub const HEADER_SIZE: usize = 5;
> 
>     pub fn new() -> Self {
>         Self { buffer: Vec::new() }
>     }
> 
>     pub fn push_bytes(&mut self, data: &[u8]) {
>         self.buffer.extend_from_slice(data);
>     }
> 
>     pub fn buffer_len(&self) -> usize {
>         self.buffer.len()
>     }
> 
>     pub fn decode_next(&mut self) -> Result<Option<Packet>, FrameError> {
>         if self.buffer.len() < Self::HEADER_SIZE {
>             return Ok(None);
>         }
> 
>         if self.buffer[0..2] != Self::MAGIC {
>             return Err(FrameError::InvalidMagic);
>         }
> 
>         let payload_len = u16::from_be_bytes([self.buffer[2], self.buffer[3]]) as usize;
>         let total_frame_size = Self::HEADER_SIZE + payload_len;
> 
>         if self.buffer.len() < total_frame_size {
>             return Ok(None);
>         }
> 
>         let checksum = self.buffer[4];
>         let payload = self.buffer[Self::HEADER_SIZE..total_frame_size].to_vec();
> 
>         let computed_checksum = payload.iter().fold(0u8, |acc, &b| acc ^ b);
>         if computed_checksum != checksum {
>             return Err(FrameError::ChecksumMismatch);
>         }
> 
>         self.buffer.drain(0..total_frame_size);
> 
>         Ok(Some(Packet::new(Self::MAGIC, checksum, payload)))
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_frame_decoder_and_packet() {
>         let mut decoder = FrameDecoder::new();
>         assert_eq!(decoder.buffer_len(), 0);
> 
>         let payload = b"Hell";
>         let checksum = payload.iter().fold(0u8, |acc, &b| acc ^ b);
>         let mut frame = vec![0xAA, 0x55, 0x00, 0x04, checksum];
>         frame.extend_from_slice(payload);
> 
>         decoder.push_bytes(&frame);
>         assert_ne!(decoder.buffer_len(), 0);
> 
>         let decode_result = decoder.decode_next();
>         assert!(decode_result.is_ok());
> 
>         let pkt = decode_result.unwrap().unwrap();
>         assert_eq!(pkt.payload_len(), 4);
>         assert_eq!(pkt.payload(), b"Hell");
>         assert!(pkt.verify_checksum());
>         assert!(matches!(decoder.decode_next(), Ok(None)));
> 
>         let mut bad_decoder = FrameDecoder::new();
>         bad_decoder.push_bytes(&[0xFF, 0xFF, 0x00, 0x01, 0x00, 0x41]);
>         let err = bad_decoder.decode_next();
>         assert!(matches!(err, Err(FrameError::InvalidMagic)));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Associated Constants in `impl` Blocks**:
>    - `pub const MAGIC: [u8; 2] = [0xAA, 0x55];` and `pub const HEADER_SIZE: usize = 5;` defined inside `impl FrameDecoder` bind static protocol constants directly to the parser struct namespace.
> 2. **Slice Borrowing & Lifetimes**:
>    - `pub fn payload(&self) -> &[u8]` borrows the internal vector payload as an immutable slice tied to `&self`'s lifetime (`&'a self -> &'a [u8]`), avoiding unnecessary byte cloning when reading header/payload fields.
> 3. **Streaming Ingestion & Buffer Draining**:
>    - `push_bytes(&mut self, data: &[u8])` accumulates streaming network chunks. `decode_next(&mut self)` uses `self.buffer.drain(0..total_frame_size)` to truncate parsed frame data cleanly while preserving residual bytes for subsequent TCP packet chunks.
> 4. **Edge Cases**:
>    - Incomplete frames (fewer bytes than header or total packet size) return `Ok(None)` to signal the stream engine to await additional network read events.
>    - Invalid header magic codes fail immediately with `Err(FrameError::InvalidMagic)`.
> 
---

### Exercise 3: Token Bucket Rate Limiter & Telemetry Analytics

**Scenario:** **Problem Scenario:**
API gateways protect backend microservices from load surges using token bucket rate limiters. Implement a modularized `RateLimiter` using 3 separate `impl` blocks for strict concern separation.

**Requirements:**
Requirements:
1. Implement a builder pattern via `RateLimiterBuilder` and `impl RateLimiterBuilder`.
2. Implement `RateLimiter` across 3 separate `impl` blocks:
   - Block 1 (Associated Constructors & Builders): `new(capacity: u32, refill_rate_per_sec: u32) -> Self` and `builder() -> RateLimiterBuilder`.
   - Block 2 (Core Mutation Logic): `refill(&mut self, current_time_secs: u64)` and `try_consume(&mut self, tokens: u32, current_time_secs: u64) -> bool`.
   - Block 3 (Telemetry & Inspection): `available_tokens(&self) -> u32`, `utilization_ratio(&self) -> f64`, `is_saturated(&self) -> bool`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone)]
> pub struct RateLimiter {
>     capacity: u32,
>     tokens: u32,
>     refill_rate_per_sec: u32,
>     last_refill_timestamp: u64,
> }
> 
> pub struct RateLimiterBuilder {
>     capacity: Option<u32>,
>     refill_rate: Option<u32>,
> }
> 
> impl RateLimiterBuilder {
>     pub fn new() -> Self {
>         Self {
>             capacity: None,
>             refill_rate: None,
>         }
>     }
> 
>     pub fn capacity(mut self, cap: u32) -> Self {
>         self.capacity = Some(cap);
>         self
>     }
> 
>     pub fn refill_rate(mut self, rate: u32) -> Self {
>         self.refill_rate = Some(rate);
>         self
>     }
> 
>     pub fn build(self) -> Result<RateLimiter, &'static str> {
>         let capacity = self.capacity.ok_or("Capacity must be specified")?;
>         let refill_rate = self.refill_rate.ok_or("Refill rate must be specified")?;
>         if capacity == 0 {
>             return Err("Capacity must be greater than zero");
>         }
>         Ok(RateLimiter::new(capacity, refill_rate))
>     }
> }
> 
> // Impl Block 1: Associated Constructors & Builders
> impl RateLimiter {
>     pub fn new(capacity: u32, refill_rate_per_sec: u32) -> Self {
>         Self {
>             capacity,
>             tokens: capacity,
>             refill_rate_per_sec,
>             last_refill_timestamp: 0,
>         }
>     }
> 
>     pub fn builder() -> RateLimiterBuilder {
>         RateLimiterBuilder::new()
>     }
> }
> 
> // Impl Block 2: Core State Mutators (&mut self)
> impl RateLimiter {
>     pub fn refill(&mut self, current_time_secs: u64) {
>         if current_time_secs > self.last_refill_timestamp {
>             let elapsed = current_time_secs - self.last_refill_timestamp;
>             let added_tokens = (elapsed as u32).saturating_mul(self.refill_rate_per_sec);
>             self.tokens = (self.tokens + added_tokens).min(self.capacity);
>             self.last_refill_timestamp = current_time_secs;
>         }
>     }
> 
>     pub fn try_consume(&mut self, tokens: u32, current_time_secs: u64) -> bool {
>         self.refill(current_time_secs);
>         if self.tokens >= tokens {
>             self.tokens -= tokens;
>             true
>         } else {
>             false
>         }
>     }
> }
> 
> // Impl Block 3: Telemetry & Immutable Inspection (&self)
> impl RateLimiter {
>     pub fn available_tokens(&self) -> u32 {
>         self.tokens
>     }
> 
>     pub fn utilization_ratio(&self) -> f64 {
>         if self.capacity == 0 {
>             return 0.0;
>         }
>         1.0 - (self.tokens as f64 / self.capacity as f64)
>     }
> 
>     pub fn is_saturated(&self) -> bool {
>         self.tokens == 0
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_rate_limiter_builder_and_token_consumption() {
>         let builder_res = RateLimiter::builder()
>             .capacity(100)
>             .refill_rate(10)
>             .build();
> 
>         assert!(builder_res.is_ok());
>         let mut limiter = builder_res.unwrap();
> 
>         assert_eq!(limiter.available_tokens(), 100);
>         assert_eq!(limiter.utilization_ratio(), 0.0);
> 
>         let consumed = limiter.try_consume(60, 0);
>         assert!(consumed);
>         assert_eq!(limiter.available_tokens(), 40);
>         assert_ne!(limiter.available_tokens(), 100);
> 
>         assert!(!limiter.try_consume(50, 0));
>         assert!(!limiter.is_saturated());
> 
>         assert!(limiter.try_consume(40, 0));
>         assert!(limiter.is_saturated());
> 
>         let invalid_builder = RateLimiter::builder().capacity(0).refill_rate(10).build();
>         assert!(matches!(invalid_builder, Err("Capacity must be greater than zero")));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Fluent Builder Pattern (`self` method chaining)**:
>    - `RateLimiterBuilder` uses value-consuming methods (`fn capacity(mut self, cap: u32) -> Self`) to construct configuration objects with method chaining. `build(self)` consumes the builder and yields a validated `RateLimiter`.
> 2. **Multi-`impl` Architectural Decoupling**:
>    - Splitting `RateLimiter` across 3 separate `impl` blocks decouples initialization (`builder`, `new`), core mutation logic (`refill`, `try_consume`), and passive metrics telemetry (`available_tokens`, `utilization_ratio`).
> 3. **Arithmetic Safety & Saturation**:
>    - The token calculation uses `.saturating_mul()` when computing accumulated tokens over time to prevent integer overflow panics during long system runtimes or large time deltas.
> 4. **Edge Cases**:
>    - Out-of-order timestamps (`current_time_secs <= last_refill_timestamp`) are safely ignored by the guard clause in `refill`.
>    - Zero capacity bounds prevention ensures floating point calculations in `utilization_ratio` avoid division by zero.
> 
---

## 6. Related Terms


- [Method](method.md) — A function inside an `impl` block that *does* take `self` (operates on an instance).
- [Associated Function](associated_function.md) — A function inside an `impl` block that *does not* take `self` (like a static constructor).
- [Trait](../level_04/trait.md) — (Future reference) You use `impl Trait for Type` to attach standardized interfaces to your structs.
- [Struct](struct.md) — Related concept: Struct.

---

## 7. Key Takeaways

- Rust strictly separates Data (`struct` / `enum`) from Behavior (`impl` block).
- You attach functions to a type using `impl TypeName { ... }`.
- You **cannot** put functions directly inside a `struct` definition.
- You can create **multiple** `impl` blocks for the exact same type, which is excellent for organizing large codebases.
