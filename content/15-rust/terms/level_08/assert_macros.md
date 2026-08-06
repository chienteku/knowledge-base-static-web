# `assert!` / `assert_eq!` / `assert_ne!`

> **Level 8 — Testing & Documentation**
> Macros for test assertions.

---

## 1. Prerequisites


- [Macros](../level_01/macros.md) — The code-generating system (denoted by `!`) that powers these assertions.
- [`panic!` Macro](../level_04/panic.md) — The action these macros take when an assertion fails.

---

## 2. Term Category

**Rust-specific (the test judges)**: Once you've marked a function with `#[test]`, how do you actually verify that your code works? You use these three macros. 

They act as judges for your code. If they look at your code's output and determine it is incorrect, they immediately trigger a `panic!`. This `panic!` is caught by the test runner, causing the test to fail and lighting up your terminal with a big red `FAILED`.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Testing inherently requires comparing *expected* results with *actual* results. The Rust designers provided three distinct macros to cover all basic testing needs:
1. **`assert!`**: Checks if a single boolean condition is `true`.
2. **`assert_eq!`**: Checks if `actual == expected`. (This is the most heavily used!).
3. **`assert_ne!`**: Checks if `actual != expected`. 

Why are they macros (`!`) instead of standard functions? Because macros have access to the compiler's abstract syntax tree. When an `assert_eq!` fails, the macro automatically captures the line number, the file name, and prints the exact values of both sides, providing you with an incredibly helpful error message automatically!

### (2) Reality Metaphor

Imagine you are a Quality Assurance inspector at a toaster factory. 

A toaster comes off the assembly line. You plug it in and press the button (**`assert!`**). Does it turn on? Yes! (The test passes). 

You set the dial to level 4 and measure the temperature. You expect 400 degrees. The toaster outputs 350 degrees. You yell: *"**`assert_eq!`** failed! Expected 400, got 350!"* and you smash the big red PANIC button, immediately stopping the assembly line. 

### (3) Rust Code Examples

#### Short Snippet (The Three Judges)
Here are all three macros in action inside a single test.

```rust
#[test]
fn test_all_assertions() {
    let result = 5 + 5;
    let is_even = result % 2 == 0;

    // 1. assert! (Checks if something is true)
    assert!(is_even);

    // 2. assert_eq! (Checks if two things are exactly equal)
    assert_eq!(result, 10);

    // 3. assert_ne! (Checks if two things are NOT equal)
    assert_ne!(result, 99);
}
```

#### Fuller Example (Custom Error Messages)
You can optionally provide custom error messages to all three macros! This is incredibly useful for debugging complex tests where you want to know *why* something failed.

```rust
#[test]
fn test_user_permissions() {
    let role = "Guest";
    let has_access = false;

    // The first argument is the condition. The rest is a custom formatted message!
    assert!(
        !has_access, 
        "SECURITY BREACH! The role '{}' was incorrectly granted access!", 
        role
    );

    let calculated_tax = 15.50;
    assert_eq!(
        calculated_tax, 
        20.00, 
        "Tax calculation failed. Expected 20.00 but got {}", 
        calculated_tax
    );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Assert Macros Scoping and Lifecycle Rules

**The mistake:** Assuming Assert Macros instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("assert_macros_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("assert_macros_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Assert Macros State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Assert Macros through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Assert Macros Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Assert Macros instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Financial Order Book & Trade Matching Engine Verification

**Scenario:** **Problem Scenario:**
You are building an order matching engine for an electronic exchange. The engine processes limit orders and executes fills while maintaining audit trails. You need to implement the core `Order` state machine and write comprehensive unit tests using `assert!`, `assert_eq!`, and `assert_ne!` to verify state invariants, partial fill calculations, status transitions, and overfill bounds protection.

**Requirements:**
**Requirements:**
1. Define `OrderStatus` enum (`Pending`, `PartiallyFilled`, `Filled`, `Cancelled`) deriving `Debug` and `PartialEq`.
2. Create an `Order` struct holding `id: u64`, `symbol: String`, `price: u64` (in cents), `quantity: u32`, `filled_quantity: u32`, and `status: OrderStatus`. Implement `Order::new(...)` and `Order::fill(&mut self, qty: u32) -> Result<u32, &'static str>`.
3. Implement `Order::is_active(&self) -> bool` returning `true` if `status` is `Pending` or `PartiallyFilled`.
4. Write unit tests in `#[cfg(test)] mod tests` verifying:
   - Partial fill updates `filled_quantity` and transitions status (`assert_eq!`, `assert_ne!`, `assert!`).
   - Complete fill updates status to `OrderStatus::Filled` and marks order as inactive (`assert_eq!`, `assert!`).
   - Overfilling returns an `Err` and leaves state untouched (`assert!`, `assert_eq!`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Clone)]
> pub enum OrderStatus {
>     Pending,
>     PartiallyFilled,
>     Filled,
>     Cancelled,
> }
> 
> #[derive(Debug, PartialEq, Clone)]
> pub struct Order {
>     pub id: u64,
>     pub symbol: String,
>     pub price: u64, // Price in cents
>     pub quantity: u32,
>     pub filled_quantity: u32,
>     pub status: OrderStatus,
> }
> 
> impl Order {
>     pub fn new(id: u64, symbol: &str, price: u64, quantity: u32) -> Self {
>         Self {
>             id,
>             symbol: symbol.to_string(),
>             price,
>             quantity,
>             filled_quantity: 0,
>             status: OrderStatus::Pending,
>         }
>     }
> 
>     pub fn fill(&mut self, qty: u32) -> Result<u32, &'static str> {
>         if qty == 0 {
>             return Err("Fill quantity must be greater than zero");
>         }
>         if self.filled_quantity + qty > self.quantity {
>             return Err("Fill quantity exceeds remaining order capacity");
>         }
> 
>         self.filled_quantity += qty;
>         if self.filled_quantity == self.quantity {
>             self.status = OrderStatus::Filled;
>         } else {
>             self.status = OrderStatus::PartiallyFilled;
>         }
> 
>         Ok(self.filled_quantity)
>     }
> 
>     pub fn is_active(&self) -> bool {
>         matches!(self.status, OrderStatus::Pending | OrderStatus::PartiallyFilled)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_partial_order_fill() {
>         let mut order = Order::new(1001, "AAPL", 15000, 100);
> 
>         // Verify initial state using assert! and assert_ne!
>         assert!(order.is_active(), "New order must start in active state");
>         assert_eq!(order.filled_quantity, 0, "Initial filled quantity must be 0");
>         assert_ne!(order.status, OrderStatus::Filled, "New order cannot be pre-filled");
> 
>         // Perform partial fill of 40 units
>         let fill_res = order.fill(40);
>         assert!(fill_res.is_ok(), "Partial fill of 40 units should succeed");
>         assert_eq!(order.filled_quantity, 40, "Filled quantity should be exactly 40");
>         assert_eq!(
>             order.status,
>             OrderStatus::PartiallyFilled,
>             "Order status should transition to PartiallyFilled"
>         );
>         assert_ne!(order.status, OrderStatus::Pending, "Status should no longer be Pending");
>     }
> 
>     #[test]
>     fn test_complete_order_fill() {
>         let mut order = Order::new(1002, "TSLA", 25000, 50);
> 
>         // Fill remaining quantity
>         let fill_res = order.fill(50);
>         assert_eq!(fill_res, Ok(50), "Complete fill should return updated total filled quantity");
>         assert_eq!(order.status, OrderStatus::Filled, "Order must be marked Filled");
>         assert!(!order.is_active(), "Completed order must no longer be active");
>     }
> 
>     #[test]
>     fn test_overfill_prevention() {
>         let mut order = Order::new(1003, "GOOGL", 28000, 20);
>         let _ = order.fill(15);
> 
>         // Attempting to overfill by 10 (total 25 > 20)
>         let overfill_res = order.fill(10);
>         assert!(overfill_res.is_err(), "Overfilling an order must return an Error");
>         assert_eq!(
>             order.filled_quantity, 15,
>             "Filled quantity must remain unchanged after failed overfill"
>         );
>         assert_eq!(
>             order.status,
>             OrderStatus::PartiallyFilled,
>             "Order status must remain PartiallyFilled after failed overfill"
>         );
>     }
> }
> ```
> 
> **Technical Explanation:**
> 1. **Assertion Selection:** `assert!` is used for boolean expressions (`order.is_active()`), `assert_eq!` verifies state equalities (`order.filled_quantity == 40`), and `assert_ne!` confirms state progression (`order.status != OrderStatus::Pending`).
> 2. **Deriving Traits:** `#[derive(Debug, PartialEq)]` on `OrderStatus` and `Order` enables `assert_eq!` and `assert_ne!` to print clear diagnostic diffs when comparisons fail.
> 3. **Custom Messages:** Formatting arguments inside assertion macros (e.g. `"Initial filled quantity must be 0"`) provide immediate contextual awareness during test failures in production CI/CD pipelines.
> 
---

### Exercise 2: Token Bucket Rate Limiter & Internal Invariant Auditing

**Scenario:** **Problem Scenario:**
In an enterprise HTTP API Gateway, you are implementing a Token Bucket rate limiter. The rate limiter replenishes tokens over time based on elapsed seconds and enforces capacity limits. To ensure robustness, you must audit runtime rate-limiting responses (`QuotaResult`) and verify state invariants using `assert!`, `assert_eq!`, `assert_ne!`, `matches!`, and `debug_assert!`.

**Requirements:**
**Requirements:**
1. Define `QuotaResult` enum with variants `Allowed { remaining: u32 }` and `RateLimited { retry_after_secs: u64 }`, deriving `Debug` and `PartialEq`.
2. Define `TokenBucket` struct with `capacity: u32`, `tokens: u32`, `refill_rate_per_sec: u32`, and `last_update_secs: u64`.
3. Implement `TokenBucket::new(capacity, refill_rate_per_sec, now_secs)` and `TokenBucket::take(&mut self, now_secs, tokens_requested) -> QuotaResult`.
4. Use `debug_assert!` inside `take` to verify timestamp monotonicity (`now_secs >= self.last_update_secs`) and capacity bounds (`self.tokens <= self.capacity`).
5. Write unit tests in `#[cfg(test)] mod tests` verifying rate limit triggers, token refills over simulated time, and expected pattern matches.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Clone)]
> pub enum QuotaResult {
>     Allowed { remaining: u32 },
>     RateLimited { retry_after_secs: u64 },
> }
> 
> #[derive(Debug, PartialEq, Clone)]
> pub struct TokenBucket {
>     pub capacity: u32,
>     pub tokens: u32,
>     pub refill_rate_per_sec: u32,
>     pub last_update_secs: u64,
> }
> 
> impl TokenBucket {
>     pub fn new(capacity: u32, refill_rate_per_sec: u32, now_secs: u64) -> Self {
>         Self {
>             capacity,
>             tokens: capacity,
>             refill_rate_per_sec,
>             last_update_secs: now_secs,
>         }
>     }
> 
>     pub fn take(&mut self, now_secs: u64, tokens_requested: u32) -> QuotaResult {
>         debug_assert!(now_secs >= self.last_update_secs, "Timestamp cannot go backwards");
> 
>         let elapsed = now_secs.saturating_sub(self.last_update_secs);
>         let replenished = elapsed.saturating_mul(self.refill_rate_per_sec as u64);
>         
>         self.tokens = ((self.tokens as u64) + replenished).min(self.capacity as u64) as u32;
>         self.last_update_secs = now_secs;
> 
>         debug_assert!(
>             self.tokens <= self.capacity,
>             "Bucket token level {} exceeded maximum capacity {}",
>             self.tokens,
>             self.capacity
>         );
> 
>         if self.tokens >= tokens_requested {
>             self.tokens -= tokens_requested;
>             QuotaResult::Allowed { remaining: self.tokens }
>         } else {
>             let needed = tokens_requested - self.tokens;
>             let retry_after = (needed as u64 + self.refill_rate_per_sec as u64 - 1) / (self.refill_rate_per_sec as u64);
>             QuotaResult::RateLimited { retry_after_secs: retry_after }
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_token_bucket_allowance_and_exhaustion() {
>         let mut bucket = TokenBucket::new(10, 2, 1000);
> 
>         // First request: consume 7 tokens out of 10
>         let res1 = bucket.take(1000, 7);
>         assert_eq!(
>             res1,
>             QuotaResult::Allowed { remaining: 3 },
>             "7 tokens should be allowed leaving 3 tokens"
>         );
>         assert_eq!(bucket.tokens, 3, "Bucket should retain 3 tokens");
> 
>         // Second request: request 5 tokens when only 3 remain -> Rate limited
>         let res2 = bucket.take(1000, 5);
>         assert_ne!(
>             res2,
>             QuotaResult::Allowed { remaining: 0 },
>             "Request for 5 tokens must not be granted"
>         );
>         assert!(
>             matches!(res2, QuotaResult::RateLimited { .. }),
>             "Response should match RateLimited variant"
>         );
> 
>         if let QuotaResult::RateLimited { retry_after_secs } = res2 {
>             // Needed = 5 - 3 = 2 tokens. At 2 tokens/sec, retry_after = 1 sec
>             assert_eq!(retry_after_secs, 1, "Expected retry after 1 second for 2 missing tokens");
>         }
>     }
> 
>     #[test]
>     fn test_token_replenishment_over_time() {
>         let mut bucket = TokenBucket::new(10, 2, 1000);
>         let _ = bucket.take(1000, 10); // Fully consume 10 tokens
> 
>         assert_eq!(bucket.tokens, 0, "Bucket must be empty after taking all capacity");
> 
>         // Advance time by 3 seconds -> 3 sec * 2 tokens/sec = 6 tokens replenished
>         let res = bucket.take(1003, 4);
>         assert!(
>             matches!(res, QuotaResult::Allowed { .. }),
>             "Requesting 4 tokens after 3s refill must succeed"
>         );
> 
>         assert_eq!(
>             bucket.tokens, 2,
>             "Expected 6 replenished - 4 consumed = 2 remaining tokens"
>         );
>         assert_ne!(bucket.tokens, 0, "Tokens should not be zero after replenishment");
>     }
> }
> ```
> 
> **Technical Explanation:**
> 1. **Debug Assertions (`debug_assert!`):** Internal invariants (like non-negative elapsed time and upper token limits) are enforced during debug builds without imposing runtime performance overhead in optimized `--release` binaries.
> 2. **Enum Equality & Matching:** `QuotaResult` implements `PartialEq`, allowing direct value comparisons in `assert_eq!`. Pattern matching macro `matches!` combined with `assert!` allows flexible assertion on enum variant families without specifying inner values.
> 3. **Mathematical Precision:** `assert_eq!(retry_after_secs, 1)` verifies ceiling division arithmetic logic under quota restriction scenarios.
> 
---

### Exercise 3: Network Packet Ring Buffer Invariants & Index Wraparound

**Scenario:** **Problem Scenario:**
You are developing a high-throughput telemetry ingestion service. Packet frames are buffered in a fixed-size ring buffer (`PacketRingBuffer<const CAP: usize>`) before processing. You must implement payload checksum verification and ring buffer indexing, and write unit tests asserting FIFO order, buffer capacity boundaries, and index wraparound behavior using `assert!`, `assert_eq!`, `assert_ne!`, and `debug_assert!`.

**Requirements:**
**Requirements:**
1. Define `PacketFrame` containing `id: u32`, `payload: Vec<u8>`, and `checksum: u32`. Implement `PacketFrame::new(id, payload)` and `verify_checksum(&self) -> bool`. Derive `Debug` and `PartialEq`.
2. Define generic struct `PacketRingBuffer<const CAP: usize>` holding fixed-size buffer `[Option<PacketFrame>; CAP]`, `head: usize`, `tail: usize`, and `len: usize`.
3. Implement `new()`, `is_empty()`, `is_full()`, `push(frame) -> Result<(), &'static str>`, and `pop() -> Option<PacketFrame>`.
4. Use `debug_assert!` to verify `len <= CAP` during ring index mutations.
5. Write unit tests in `#[cfg(test)] mod tests` verifying FIFO queue order, boundary overflow errors, and index wraparound functionality.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Clone)]
> pub struct PacketFrame {
>     pub id: u32,
>     pub payload: Vec<u8>,
>     pub checksum: u32,
> }
> 
> impl PacketFrame {
>     pub fn new(id: u32, payload: Vec<u8>) -> Self {
>         let checksum = payload.iter().map(|&b| b as u32).sum::<u32>() % 10007 + id;
>         Self { id, payload, checksum }
>     }
> 
>     pub fn verify_checksum(&self) -> bool {
>         let expected = self.payload.iter().map(|&b| b as u32).sum::<u32>() % 10007 + self.id;
>         self.checksum == expected
>     }
> }
> 
> pub struct PacketRingBuffer<const CAP: usize> {
>     buffer: [Option<PacketFrame>; CAP],
>     head: usize,
>     tail: usize,
>     len: usize,
> }
> 
> impl<const CAP: usize> PacketRingBuffer<CAP> {
>     pub fn new() -> Self {
>         assert!(CAP > 0, "RingBuffer capacity must be strictly positive");
>         Self {
>             buffer: std::array::from_fn(|_| None),
>             head: 0,
>             tail: 0,
>             len: 0,
>         }
>     }
> 
>     pub fn is_empty(&self) -> bool {
>         self.len == 0
>     }
> 
>     pub fn is_full(&self) -> bool {
>         self.len == CAP
>     }
> 
>     pub fn push(&mut self, frame: PacketFrame) -> Result<(), &'static str> {
>         debug_assert!(self.len <= CAP, "Ring buffer length invariant violated!");
>         if self.is_full() {
>             return Err("Ring buffer capacity reached");
>         }
> 
>         self.buffer[self.head] = Some(frame);
>         self.head = (self.head + 1) % CAP;
>         self.len += 1;
>         Ok(())
>     }
> 
>     pub fn pop(&mut self) -> Option<PacketFrame> {
>         debug_assert!(self.len <= CAP, "Ring buffer length invariant violated!");
>         if self.is_empty() {
>             return None;
>         }
> 
>         let frame = self.buffer[self.tail].take();
>         self.tail = (self.tail + 1) % CAP;
>         self.len -= 1;
>         frame
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_ring_buffer_fifo_order_and_checksum() {
>         let mut rb = PacketRingBuffer::<3>::new();
>         assert!(rb.is_empty(), "Buffer must start empty");
>         assert_eq!(rb.len, 0, "Initial length must be 0");
> 
>         let p1 = PacketFrame::new(101, vec![0xDE, 0xAD, 0xBE, 0xEF]);
>         let p2 = PacketFrame::new(102, vec![0xCA, 0xFE]);
> 
>         assert!(p1.verify_checksum(), "Frame p1 checksum must be valid");
>         assert!(p2.verify_checksum(), "Frame p2 checksum must be valid");
> 
>         assert!(rb.push(p1.clone()).is_ok(), "Pushing p1 should succeed");
>         assert!(rb.push(p2.clone()).is_ok(), "Pushing p2 should succeed");
>         assert_eq!(rb.len, 2, "Buffer length should be 2");
> 
>         let popped1 = rb.pop().expect("First pop must return p1");
>         assert_eq!(popped1, p1, "Popped frame must equal inserted frame p1");
>         assert_ne!(popped1, p2, "Popped frame p1 must not equal frame p2");
> 
>         let popped2 = rb.pop().expect("Second pop must return p2");
>         assert_eq!(popped2.id, 102, "Popped frame 2 ID must match 102");
>         assert!(rb.is_empty(), "Buffer should be empty after popping all elements");
>     }
> 
>     #[test]
>     fn test_ring_buffer_capacity_boundary_and_wraparound() {
>         let mut rb = PacketRingBuffer::<2>::new();
> 
>         let f1 = PacketFrame::new(1, vec![1, 2]);
>         let f2 = PacketFrame::new(2, vec![3, 4]);
>         let f3 = PacketFrame::new(3, vec![5, 6]);
> 
>         assert!(rb.push(f1.clone()).is_ok());
>         assert!(rb.push(f2.clone()).is_ok());
>         assert!(rb.is_full(), "Buffer of capacity 2 must be full after 2 pushes");
> 
>         // Attempt push into full buffer
>         let overflow_err = rb.push(f3.clone());
>         assert!(
>             overflow_err.is_err(),
>             "Pushing into a full buffer must return an Error"
>         );
>         assert_eq!(
>             overflow_err.unwrap_err(),
>             "Ring buffer capacity reached",
>             "Error message must specify capacity limit"
>         );
> 
>         // Pop one element to free space, then push f3 (tests index wraparound)
>         let _ = rb.pop();
>         assert_ne!(rb.len, 2, "Buffer length should drop below capacity after pop");
>         assert!(rb.push(f3.clone()).is_ok(), "Push after pop should succeed via index wrap");
>         assert_eq!(rb.len, 2, "Buffer length should return to 2");
>     }
> }
> ```
> 
> **Technical Explanation:**
> 1. **FIFO Invariants:** `assert_eq!(popped1, p1)` and `assert_ne!(popped1, p2)` verify structural data integrity and exact FIFO ordering across buffer mutations.
> 2. **Boundary Testing:** Pushing to a full ring buffer tests capacity assertions (`assert!(rb.is_full())`) and error returns (`assert_eq!(overflow_err.unwrap_err(), ...)`).
> 3. **Wraparound Invariants:** `pop()` followed by `push()` forces `head` pointer modulo wrapping (`(head + 1) % CAP`), verified via `assert_eq!(rb.len, 2)` and `assert_ne!(rb.len, 2)`.

---

## 6. Related Terms


- [`PartialEq` / `Eq`](../level_04/partialeq_eq.md) — The mathematical trait required to compare two items in `assert_eq!`.
- [`Debug` Trait](../level_04/debug_trait.md) — The formatting trait required to print the failure messages to the terminal.

---

## 7. Key Takeaways

- **`assert!(condition)`** checks if a boolean is true.
- **`assert_eq!(actual, expected)`** checks if two values are equal. (This is the most common one!).
- **`assert_ne!(actual, unexpected)`** checks if two values are *not* equal.
- If any of these fail, they trigger a `panic!`, causing the test to fail.
- You can add custom, formatted error messages as extra arguments (e.g., `assert!(is_valid, "Data was {}!", data)`).
- Custom structs must `#[derive(Debug, PartialEq)]` to be used in `assert_eq!` or `assert_ne!`.
