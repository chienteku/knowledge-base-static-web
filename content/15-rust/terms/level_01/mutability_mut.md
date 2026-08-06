# Mutability (`mut`)

> **Level 1 — Foundations**
> Opt-in mutability; `let mut x = 5;` allows reassignment.

---

## 1. Prerequisites


- [Variable](variable.md) — A named binding in memory; immutable by default in Rust.

---

## 2. Term Category



**Rust Core Keyword (explicit state mutability)**: While mutability exists in all languages, Rust's strict "opt-in" mutability by default is a core language design choice for safety and concurrency.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In many legacy programming languages (like C, C++, or Python), variables are mutable by default. You can change their values anytime, anywhere. However, as programs grow larger, this leads to a massive problem: it becomes incredibly difficult to track *who* changed a variable and *when*. This accidental mutation is a leading cause of logic bugs and devastating data races in multi-threaded applications.

When designing Rust, we wanted to flip the default. We decided that variables should be **immutable** by default. If a developer intends for a value to change over time, they must explicitly signal that intent to both the compiler and future readers of the code by using the `mut` keyword. This single decision eliminates entire classes of bugs because you can confidently pass a variable around knowing it won't be secretly modified behind your back, unless it explicitly says `mut`.

### (2) Reality Metaphor

Think of a standard variable as a **printed poster** hanging on a wall. Once it is printed and framed, you cannot change the text on it. It is permanent and safe to show to everyone exactly as it is.

Adding `mut` is like replacing that poster with a **whiteboard and a marker**. By explicitly installing a whiteboard, you are announcing to everyone in the room: *"Expect the information here to change."*

### (3) Rust Code Examples

#### Short Snippet
```rust
// We explicitly opt-in to mutability using the `mut` keyword.
let mut counter = 0;
counter = 1; // This reassignment is now perfectly legal.
```

#### Fuller Example
```rust
fn main() {
    // A player's score will change as they play the game, so it must be mutable.
    let mut score = 0;
    println!("Starting score: {}", score);
    
    // The player collects a coin. We update the score.
    score = score + 10;
    println!("Collected a coin! Score is now: {}", score);
    
    // The player defeats an enemy. We update it again.
    // We can also use shorthand assignment operators like `+=`.
    score += 50;
    println!("Defeated an enemy! Score is now: {}", score);
    
    // The maximum possible score won't change during this run, 
    // so we deliberately do NOT use `mut` here.
    let max_score = 999;
    println!("You need {} more points to max out!", max_score - score);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting `mut` when trying to change a variable

**The mistake:** Attempting to reassign or modify a variable without having declared it with the `mut` keyword.

**Why it's wrong:** Rust will strictly block any reassignment to a standard `let` binding. The compiler will give you a helpful error: `cannot assign twice to immutable variable`.

*Incorrect:*
```rust
let player_name = "Guest";
player_name = "Alice"; // ERROR: player_name is not mutable
```

*Fix:*
```rust
let mut player_name = "Guest";
player_name = "Alice";
```

### Mistake 2: Making a variable mutable when it doesn't need to be

**The mistake:** Declaring a variable as `mut` but never actually changing its value in the code.

**Why it's wrong:** While it will compile, it defeats the purpose of Rust's safety guarantees and misleads other developers reading your code into thinking the value will change. The Rust compiler (and Clippy) will actually generate a warning telling you that the variable does not need to be mutable.

*Incorrect:*
```rust
let mut starting_lives = 3;
println!("You start with {} lives", starting_lives);
// Notice we never actually change `starting_lives` after this point.
```

*Fix:*
```rust
let starting_lives = 3; // Remove `mut` to silence the compiler warning and clarify intent.
println!("You start with {} lives", starting_lives);
```

---

### Mistake 3: Concurrent Access to Mutability Mut Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Mutability Mut instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Real-Time Financial Order Aggregator & Volume-Weighted Average Price (VWAP) Engine

**Scenario:** In production software engineering contexts, developers must handle complex system behaviors robustly.

**Requirements:**
In high-frequency trading (HFT) systems, allocating memory on hot execution paths introduces latency spikes and allocator lock contention. Implement an in-place financial trade aggregator `TradeAggregator` that tracks active trades, total volume, total transaction value (in cents), and peak price, mutating state in-place without unnecessary memory re-allocation.

Your implementation must support:
- `process_trade(&mut self, trade: Trade) -> Result<(), AggregatorError>` validating inputs, enforcing buffer capacity, and mutating total volume, total value, and peak price in-place.
- `calculate_vwap(&self) -> Option<f64>` computing the volume-weighted average price.
- `reset_inplace(&mut self)` clearing active trades and resetting accumulators in-place.
- `apply_discount_inplace(&mut self, discount_percent: u64)` mutating trade prices in-place using mutable iterator references (`&mut self.trades`) and updating running total values.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct Trade {
>     pub trade_id: u64,
>     pub price: u64,
>     pub quantity: u32,
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub enum AggregatorError {
>     InvalidQuantity,
>     InvalidPrice,
>     BufferFull,
> }
> 
> #[derive(Debug)]
> pub struct TradeAggregator {
>     trades: Vec<Trade>,
>     total_volume: u64,
>     total_value: u128,
>     peak_price: u64,
>     capacity: usize,
> }
> 
> impl TradeAggregator {
>     pub fn new(capacity: usize) -> Self {
>         Self {
>             trades: Vec::with_capacity(capacity),
>             total_volume: 0,
>             total_value: 0,
>             peak_price: 0,
>             capacity,
>         }
>     }
> 
>     pub fn process_trade(&mut self, trade: Trade) -> Result<(), AggregatorError> {
>         if trade.quantity == 0 {
>             return Err(AggregatorError::InvalidQuantity);
>         }
>         if trade.price == 0 {
>             return Err(AggregatorError::InvalidPrice);
>         }
>         if self.trades.len() >= self.capacity {
>             return Err(AggregatorError::BufferFull);
>         }
> 
>         self.total_volume += trade.quantity as u64;
>         self.total_value += (trade.price as u128) * (trade.quantity as u128);
>         if trade.price > self.peak_price {
>             self.peak_price = trade.price;
>         }
> 
>         self.trades.push(trade);
>         Ok(())
>     }
> 
>     pub fn calculate_vwap(&self) -> Option<f64> {
>         if self.total_volume == 0 {
>             None
>         } else {
>             Some((self.total_value as f64) / (self.total_volume as f64))
>         }
>     }
> 
>     pub fn reset_inplace(&mut self) {
>         self.trades.clear();
>         self.total_volume = 0;
>         self.total_value = 0;
>         self.peak_price = 0;
>     }
> 
>     pub fn apply_discount_inplace(&mut self, discount_percent: u64) {
>         if discount_percent > 100 {
>             return;
>         }
>         let multiplier = 100 - discount_percent;
>         self.total_value = 0;
>         for trade in &mut self.trades {
>             trade.price = (trade.price * multiplier) / 100;
>             self.total_value += (trade.price as u128) * (trade.quantity as u128);
>         }
>         self.peak_price = self.trades.iter().map(|t| t.price).max().unwrap_or(0);
>     }
> 
>     pub fn len(&self) -> usize {
>         self.trades.len()
>     }
> 
>     pub fn is_empty(&self) -> bool {
>         self.trades.is_empty()
>     }
> 
>     pub fn total_volume(&self) -> u64 {
>         self.total_volume
>     }
> 
>     pub fn total_value(&self) -> u128 {
>         self.total_value
>     }
> 
>     pub fn peak_price(&self) -> u64 {
>         self.peak_price
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_process_trade_mutates_state() {
>         let mut aggregator = TradeAggregator::new(5);
>         let trade1 = Trade { trade_id: 1, price: 100, quantity: 10 };
>         let trade2 = Trade { trade_id: 2, price: 200, quantity: 5 };
> 
>         assert_eq!(aggregator.process_trade(trade1), Ok(()));
>         assert_eq!(aggregator.process_trade(trade2), Ok(()));
> 
>         assert_eq!(aggregator.total_volume(), 15);
>         assert_eq!(aggregator.total_value(), 2000);
>         assert_eq!(aggregator.peak_price(), 200);
>         assert_eq!(aggregator.len(), 2);
>         assert!(!aggregator.is_empty());
> 
>         let vwap = aggregator.calculate_vwap();
>         assert!(vwap.is_some());
>         assert!((vwap.unwrap() - 133.33333333333334).abs() < 1e-6);
>     }
> 
>     #[test]
>     fn test_error_conditions() {
>         let mut aggregator = TradeAggregator::new(1);
>         let invalid_qty = Trade { trade_id: 1, price: 100, quantity: 0 };
>         let invalid_price = Trade { trade_id: 2, price: 0, quantity: 10 };
>         let valid_trade = Trade { trade_id: 3, price: 50, quantity: 5 };
>         let overflow_trade = Trade { trade_id: 4, price: 60, quantity: 5 };
> 
>         assert!(matches!(aggregator.process_trade(invalid_qty), Err(AggregatorError::InvalidQuantity)));
>         assert!(matches!(aggregator.process_trade(invalid_price), Err(AggregatorError::InvalidPrice)));
>         assert_eq!(aggregator.process_trade(valid_trade), Ok(()));
>         assert!(matches!(aggregator.process_trade(overflow_trade), Err(AggregatorError::BufferFull)));
>     }
> 
>     #[test]
>     fn test_inplace_discount_and_reset() {
>         let mut aggregator = TradeAggregator::new(5);
>         aggregator.process_trade(Trade { trade_id: 1, price: 100, quantity: 10 }).unwrap();
>         aggregator.process_trade(Trade { trade_id: 2, price: 200, quantity: 10 }).unwrap();
> 
>         aggregator.apply_discount_inplace(10);
>         assert_eq!(aggregator.peak_price(), 180);
>         assert_eq!(aggregator.total_value(), 2700);
>         assert_ne!(aggregator.total_value(), 3000);
> 
>         aggregator.reset_inplace();
>         assert_eq!(aggregator.len(), 0);
>         assert_eq!(aggregator.total_volume(), 0);
>         assert_eq!(aggregator.total_value(), 0);
>         assert_eq!(aggregator.peak_price(), 0);
>         assert_eq!(aggregator.calculate_vwap(), None);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Opt-in Mutability (`let mut` & `&mut self`)**:
>    - In Rust, struct fields cannot be individually mutated unless the struct instance itself is bound mutably (e.g., `let mut aggregator = TradeAggregator::new(...)`).
>    - Method signatures taking `&mut self` grant exclusive write access to the instance for the duration of the method call. The compiler enforces that no other references (immutable `&self` or mutable `&mut self`) exist concurrently, satisfying Rust's fundamental aliasing rule: *Aliasing XOR Mutability*.
> 
> 2. **In-Place Mutation vs Reallocation**:
>    - In `apply_discount_inplace`, we iterate over `&mut self.trades` (or calling `self.trades.iter_mut()`), yielding `&mut Trade` mutable references. Dereferencing or field accessing through `trade.price = ...` mutates the underlying memory buffer directly without allocating new trade objects or copying vectors.
>    - `reset_inplace` calls `self.trades.clear()`, which truncates vector length to zero while retaining the heap-allocated capacity (`Vec::with_capacity`), guaranteeing zero memory allocations when subsequent trades are pushed.
> 
> 3. **Numeric Safety and Invariants**:
>    - Cumulative volume (`u64`) and total transaction value (`u128`) prevent overflow during high-volume aggregation.
>    - `calculate_vwap` guards against division by zero by returning `None` when `total_volume == 0`.
> 
>

---

### Exercise 2: Zero-Copy Network Frame Protocol Parser & In-Place Payload Sanitizer

**Scenario:** In production software engineering contexts, developers must handle complex system behaviors robustly.

**Requirements:**
High-throughput network edge proxies require zero-copy packet manipulation to process network frames without allocating new buffer memory. Implement a zero-copy frame transformation function `process_packet_inplace(frame: &mut [u8], xor_key: Option<u8>) -> Result<usize, PacketError>` that operates on raw byte buffers.

Binary Frame Specification:
- **Header Bytes [0..4]**:
  - Byte 0: Magic Byte (`0xAA`).
  - Byte 1: Flags (`bit 1` = Sanitized flag `0x02`).
  - Byte 2: Time-To-Live (`u8`).
  - Byte 3: Payload Length `N` (`u8`).
- **Payload Bytes [4..4+N]**: Packet raw payload.

Your implementation must:
- Validate header size (`>= 4`), magic byte (`0xAA`), non-zero TTL (`> 0`), and frame length (`>= 4 + N`).
- Decrement TTL byte (`frame[2]`) in-place.
- Mutate payload bytes in-place: apply XOR bitwise mask if `xor_key` is provided, and sanitize control/non-printable ASCII bytes (`< 32` or `> 126`) by replacing them with `b'?'`.
- Update header flag byte `frame[1] |= 0x02` to signal completed sanitization.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub enum PacketError {
>     FrameTooShort,
>     InvalidMagic,
>     TtlExpired,
>     PayloadLengthMismatch,
> }
> 
> pub fn process_packet_inplace(frame: &mut [u8], xor_key: Option<u8>) -> Result<usize, PacketError> {
>     if frame.len() < 4 {
>         return Err(PacketError::FrameTooShort);
>     }
> 
>     if frame[0] != 0xAA {
>         return Err(PacketError::InvalidMagic);
>     }
> 
>     let ttl = frame[2];
>     if ttl == 0 {
>         return Err(PacketError::TtlExpired);
>     }
>     frame[2] -= 1;
> 
>     let payload_len = frame[3] as usize;
>     if frame.len() < 4 + payload_len {
>         return Err(PacketError::PayloadLengthMismatch);
>     }
> 
>     let payload = &mut frame[4..4 + payload_len];
> 
>     if let Some(key) = xor_key {
>         for byte in payload.iter_mut() {
>             *byte ^= key;
>         }
>     }
> 
>     for byte in payload.iter_mut() {
>         if *byte < 32 || *byte > 126 {
>             *byte = b'?';
>         }
>     }
> 
>     frame[1] |= 0x02;
> 
>     Ok(payload_len)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_valid_packet_transformation() {
>         let mut frame = vec![0xAA, 0x00, 10, 5, b'H', b'e', b'l', b'l', b'o'];
>         let result = process_packet_inplace(&mut frame, None);
> 
>         assert_eq!(result, Ok(5));
>         assert_eq!(frame[2], 9);
>         assert_eq!(frame[1] & 0x02, 0x02);
>         assert_eq!(&frame[4..9], b"Hello");
>     }
> 
>     #[test]
>     fn test_xor_and_sanitization() {
>         let mut frame = vec![0xAA, 0x00, 5, 3, 0x01, b'A', 0xFF];
>         let res = process_packet_inplace(&mut frame, Some(0x00));
>         assert!(res.is_ok());
>         assert_eq!(frame[4], b'?');
>         assert_eq!(frame[5], b'A');
>         assert_eq!(frame[6], b'?');
>         assert_ne!(frame[4], 0x01);
>     }
> 
>     #[test]
>     fn test_packet_errors() {
>         let mut short_frame = vec![0xAA, 0x00];
>         assert!(matches!(process_packet_inplace(&mut short_frame, None), Err(PacketError::FrameTooShort)));
> 
>         let mut bad_magic = vec![0xBB, 0x00, 5, 2, b'a', b'b'];
>         assert!(matches!(process_packet_inplace(&mut bad_magic, None), Err(PacketError::InvalidMagic)));
> 
>         let mut expired_ttl = vec![0xAA, 0x00, 0, 2, b'a', b'b'];
>         assert!(matches!(process_packet_inplace(&mut expired_ttl, None), Err(PacketError::TtlExpired)));
> 
>         let mut truncated_payload = vec![0xAA, 0x00, 5, 10, b'a', b'b'];
>         assert!(matches!(process_packet_inplace(&mut truncated_payload, None), Err(PacketError::PayloadLengthMismatch)));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Mutable Slice Semantics (`&mut [u8]`)**:
>    - Passing `frame: &mut [u8]` passes a borrowed mutable view over contiguous bytes owned by the caller. Rust guarantees that `frame` has unique access: no other thread or pointer can read or write to this memory range simultaneously.
> 
> 2. **In-Place Byte Mutation & Subslice Re-borrowing**:
>    - We perform sub-slicing `let payload = &mut frame[4..4 + payload_len];`. This re-borrows a mutable sub-slice of the original buffer.
>    - In `payload.iter_mut()`, the iterator yields mutable reference elements `&mut u8`. To modify the value in memory, we dereference the reference `*byte ^= key` or `*byte = b'?'`.
> 
> 3. **Bitwise Mutation Operators (`|=` & `^=`)**:
>    - In-place bitwise OR (`frame[1] |= 0x02`) modifies specific bit flags in the header without modifying surrounding bits.
>    - Bitwise XOR (`*byte ^= key`) mutates payload bytes for obfuscation or decoding in-place.
> 
> 4. **Edge Cases and Bounds Protection**:
>    - Bounds check `frame.len() < 4` prevents index out-of-bounds panics when checking headers.
>    - Checking `ttl == 0` prevents `u8` underflow when executing `frame[2] -= 1`.
> 
>

---

### Exercise 3: Telemetry Sliding Window Ring Buffer with In-Place Compaction

**Scenario:** Telemetry sidecars collect continuous sensor metrics over sliding windows. To prevent memory fragmentation, telemetry collectors rely on fixed-capacity ring buffers that mutate state in-place as new samples arrive.

**Requirements:**
Implement `TelemetryRingBuffer` managing telemetry sample streams:
- `new(capacity: usize) -> Self` initializing fixed-capacity ring buffer storage.
- `push(&mut self, sample: u64)` appending or overwriting samples using a sliding write cursor `(write_pos + 1) % capacity`.
- `clamp_outliers_inplace(&mut self, max_threshold: u64, clamp_value: u64) -> usize` modifying any sample exceeding `max_threshold` to `clamp_value` in-place, returning the count of mutated samples.
- `compute_stats(&self) -> (u64, u64, f64)` computing minimum, maximum, and average across active buffer samples.
- `retain_inplace<F>(&mut self, predicate: F) -> usize where F: FnMut(&u64) -> bool` retaining matching samples in-place and updating ring pointers.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug)]
> pub struct TelemetryRingBuffer {
>     buffer: Vec<u64>,
>     capacity: usize,
>     write_pos: usize,
>     count: usize,
> }
> 
> impl TelemetryRingBuffer {
>     pub fn new(capacity: usize) -> Self {
>         assert!(capacity > 0, "Capacity must be greater than zero");
>         Self {
>             buffer: Vec::with_capacity(capacity),
>             capacity,
>             write_pos: 0,
>             count: 0,
>         }
>     }
> 
>     pub fn push(&mut self, sample: u64) {
>         if self.buffer.len() < self.capacity {
>             self.buffer.push(sample);
>         } else {
>             self.buffer[self.write_pos] = sample;
>         }
>         self.write_pos = (self.write_pos + 1) % self.capacity;
>         if self.count < self.capacity {
>             self.count += 1;
>         }
>     }
> 
>     pub fn clamp_outliers_inplace(&mut self, max_threshold: u64, clamp_value: u64) -> usize {
>         let mut clamped_count = 0;
>         for sample in self.buffer.iter_mut() {
>             if *sample > max_threshold {
>                 *sample = clamp_value;
>                 clamped_count += 1;
>             }
>         }
>         clamped_count
>     }
> 
>     pub fn compute_stats(&self) -> (u64, u64, f64) {
>         if self.count == 0 {
>             return (0, 0, 0.0);
>         }
>         let min = *self.buffer.iter().min().unwrap_or(&0);
>         let max = *self.buffer.iter().max().unwrap_or(&0);
>         let sum: u64 = self.buffer.iter().sum();
>         let avg = (sum as f64) / (self.count as f64);
>         (min, max, avg)
>     }
> 
>     pub fn retain_inplace<F>(&mut self, predicate: F) -> usize
>     where
>         F: FnMut(&u64) -> bool,
>     {
>         self.buffer.retain(predicate);
>         self.count = self.buffer.len();
>         self.write_pos = if self.capacity > 0 { self.count % self.capacity } else { 0 };
>         self.count
>     }
> 
>     pub fn capacity(&self) -> usize {
>         self.capacity
>     }
> 
>     pub fn len(&self) -> usize {
>         self.count
>     }
> 
>     pub fn is_empty(&self) -> bool {
>         self.count == 0
>     }
> 
>     pub fn samples(&self) -> &[u64] {
>         &self.buffer
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_ring_buffer_push_and_overflow() {
>         let mut ring = TelemetryRingBuffer::new(3);
>         ring.push(10);
>         ring.push(20);
>         ring.push(30);
>
>         assert_eq!(ring.len(), 3);
>         assert_eq!(ring.samples(), &[10, 20, 30]);
>
>         ring.push(40);
>         assert_eq!(ring.len(), 3);
>         assert_eq!(ring.samples(), &[40, 20, 30]);
>
>         let (min, max, avg) = ring.compute_stats();
>         assert_eq!(min, 20);
>         assert_eq!(max, 40);
>         assert!((avg - 30.0).abs() < 1e-6);
>     }
>
>     #[test]
>     fn test_clamp_outliers_inplace() {
>         let mut ring = TelemetryRingBuffer::new(4);
>         ring.push(100);
>         ring.push(500);
>         ring.push(200);
>         ring.push(1000);
>
>         let modified = ring.clamp_outliers_inplace(300, 300);
>         assert_eq!(modified, 2);
>         assert_eq!(ring.samples(), &[100, 300, 200, 300]);
>         assert_ne!(ring.samples(), &[100, 500, 200, 1000]);
>     }
>
>     #[test]
>     fn test_retain_inplace() {
>         let mut ring = TelemetryRingBuffer::new(5);
>         ring.push(5);
>         ring.push(15);
>         ring.push(25);
>         ring.push(8);
>
>         let retained = ring.retain_inplace(|&val| val >= 10);
>         assert_eq!(retained, 2);
>         assert_eq!(ring.len(), 2);
>         assert_eq!(ring.samples(), &[15, 25]);
>         assert!(!ring.is_empty());
>
>         let (min, max, avg) = ring.compute_stats();
>         assert_eq!(min, 15);
>         assert_eq!(max, 25);
>         assert!((avg - 20.0).abs() < 1e-6);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Index-Based Struct Mutability (`buffer[write_pos] = sample`)**:
>    - When `push` is called on `&mut self`, we gain write access to all fields (`self.buffer`, `self.write_pos`, `self.count`).
>    - Pre-allocated `Vec` indices are overwritten directly: `self.buffer[self.write_pos] = sample`, avoiding new heap allocations once capacity is reached.
> 
> 2. **Mutable Reference Iteration (`iter_mut`)**:
>    - In `clamp_outliers_inplace`, calling `self.buffer.iter_mut()` returns an iterator over `&mut u64`.
>    - Dereferencing `*sample = clamp_value` mutates the integer stored at that vector memory location directly.
> 
> 3. **In-Place Predicate Retain & Cursor Alignment**:
>    - `retain_inplace` leverages `Vec::retain`, which shifts elements in-place to remove values where `predicate(&u64)` evaluates to `false`.
>    - Following retain, `self.count` and `self.write_pos` are re-calculated to ensure write cursors remain synchronized with the reduced buffer length.
> 
> 
>

---

## 6. Related Terms


- [Variable](variable.md) — The standard immutable binding that `mut` alters.
- [Shadowing](shadowing.md) — An alternative to mutability where you declare a completely new variable with the same name.
- [Constants (`const`)](constants_const.md) — Values that can *never* be made mutable and are evaluated at compile time.
- [References and Borrowing (`&`, `&mut`)](references_and_borrowing.md) — Exclusive mutable references (&mut).
- [`Cell<T>`](../level_03/cell_t.md) — Interior mutability.

---

## 7. Key Takeaways

- Mutability in Rust is **opt-in**. You must explicitly use the `mut` keyword (e.g., `let mut x = 5;`).
- Explicit mutability signals clear intent to other developers and prevents accidental modification bugs.
- If you declare a variable as `mut` but never change it, the Rust compiler will issue a helpful warning to remove the `mut` keyword.
