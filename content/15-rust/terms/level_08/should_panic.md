# `#[should_panic]`

> **Level 8 — Testing & Documentation**
> Attribute indicating a test is expected to panic.

---

## 1. Prerequisites


- [`panic!` Macro](../level_04/panic.md) — The macro that triggers the behavior this attribute is looking for.

---

## 2. Term Category

**Rust-specific (the reverse test)**: Normally, if a function panics, the test runner marks it as a failure (red). 

But sometimes, you *want* a function to panic. For example, if you write a function that divides two numbers, you want to guarantee that it crashes if the user tries to divide by zero. The **`#[should_panic]`** attribute tells the test runner to reverse its logic: if the function panics, the test *passes*. If the function successfully finishes, the test *fails*.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In robust software, testing edge cases and failure modes is just as important as testing the "happy path". 

If your official API documentation explicitly states: *"This function will panic if you pass it a negative number,"* you need a way to mathematically prove that it actually does. The Rust designers created `#[should_panic]` to make testing these intentional, defensive crashes incredibly easy.

### (2) Reality Metaphor

Imagine you are testing a new car's Airbag System. 

In a normal test (like testing the radio), if the car crashes, the test failed. But in an Airbag test, a crash is exactly what you want! If you crash the car into a wall and the airbag deploys, the test passes. If you drive the car safely to the grocery store during the airbag test, the test actually *fails*, because you didn't trigger the system you were trying to verify. 

`#[should_panic]` is the label you put on the car to tell the safety inspectors: *"Crash this car into a wall on purpose!"*

### (3) Rust Code Examples

#### Short Snippet (The Basic Crash)
Here is a test that intentionally triggers an array out-of-bounds error. 

```rust
#[cfg(test)]
mod tests {
    // 1. We must mark it as a test FIRST.
    #[test]
    // 2. We tell the runner to EXPECT a crash.
    #[should_panic]
    fn test_array_out_of_bounds() {
        let numbers = [1, 2, 3];
        // We ask for the 99th item in an array of 3 items. 
        // This causes a panic! The test PASSES!
        let _x = numbers[99]; 
    }
}
```

#### Fuller Example (The Exact Crash)
If you just use `#[should_panic]`, the test passes on *any* panic. But what if it panicked for the wrong reason? The idiomatic way to use this attribute is to provide an `expected` message.

```rust
pub fn divide(a: i32, b: i32) -> i32 {
    if b == 0 {
        panic!("MathError: Cannot divide by zero!");
    }
    a / b
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    // We tell the runner to look for a SPECIFIC panic message!
    // It only passes if the panic message contains this exact string.
    #[should_panic(expected = "MathError: Cannot divide by zero")]
    fn test_divide_by_zero() {
        // This triggers the specific panic we want.
        divide(10, 0);
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Should Panic Scoping and Lifecycle Rules

**The mistake:** Assuming Should Panic instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("should_panic_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("should_panic_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Should Panic State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Should Panic through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Should Panic Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Should Panic instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Financial Trading Risk Engine Invariant Enforcement

**Scenario:** **Problem Requirements:**
You are developing an algorithmic crypto-trading engine risk module (`AccountRiskProfile`). The system must enforce non-negotiable risk invariants at runtime before orders reach the matching engine. If invalid parameters or margin overflow occurs, the system must panic immediately to prevent illegal order execution.

**Requirements:**
Implement:
1. A `Position` struct holding `symbol: String`, `size: f64`, `entry_price: f64`, and `leverage: u32`.
2. An `AccountRiskProfile` struct with fields `total_equity: f64`, `used_margin: f64`, and `max_leverage_limit: u32`.
3. `AccountRiskProfile::new(total_equity: f64, max_leverage_limit: u32) -> Self`:
   - Panics with `"InvalidEquity: total equity must be positive"` if `total_equity <= 0.0`.
   - Panics with `"InvalidLeverage: leverage limit must be between 1x and 100x"` if `max_leverage_limit == 0 || max_leverage_limit > 100`.
4. `AccountRiskProfile::open_position(&mut self, symbol: &str, size: f64, price: f64, leverage: u32) -> Position`:
   - Panics with `"LeverageExceeded: position leverage exceeds account limit"` if `leverage > self.max_leverage_limit`.
   - Calculates required margin as `(size * price) / leverage`.
   - Panics with `"MarginExceeded: insufficient available equity"` if `self.used_margin + required_margin > self.total_equity`.
   - Updates `used_margin` and returns the new `Position`.
5. Unit tests (`#[cfg(test)] mod tests`) verifying:
   - Happy-path position opening using `assert_eq!` and `assert!`.
   - Defensive initialization panics using `#[should_panic(expected = "...")]`.
   - Leverage and margin overflow panics using `#[should_panic(expected = "...")]`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq)]
> pub struct Position {
>     pub symbol: String,
>     pub size: f64,
>     pub entry_price: f64,
>     pub leverage: u32,
> }
> 
> #[derive(Debug)]
> pub struct AccountRiskProfile {
>     pub total_equity: f64,
>     pub used_margin: f64,
>     pub max_leverage_limit: u32,
> }
> 
> impl AccountRiskProfile {
>     pub fn new(total_equity: f64, max_leverage_limit: u32) -> Self {
>         if total_equity <= 0.0 {
>             panic!("InvalidEquity: total equity must be positive");
>         }
>         if max_leverage_limit == 0 || max_leverage_limit > 100 {
>             panic!("InvalidLeverage: leverage limit must be between 1x and 100x");
>         }
> 
>         Self {
>             total_equity,
>             used_margin: 0.0,
>             max_leverage_limit,
>         }
>     }
> 
>     pub fn open_position(
>         &mut self,
>         symbol: &str,
>         size: f64,
>         price: f64,
>         leverage: u32,
>     ) -> Position {
>         if leverage > self.max_leverage_limit {
>             panic!("LeverageExceeded: position leverage exceeds account limit");
>         }
> 
>         let required_margin = (size * price) / (leverage as f64);
>         if self.used_margin + required_margin > self.total_equity {
>             panic!("MarginExceeded: insufficient available equity");
>         }
> 
>         self.used_margin += required_margin;
>         Position {
>             symbol: symbol.to_string(),
>             size,
>             entry_price: price,
>             leverage,
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_valid_position_opening() {
>         let mut account = AccountRiskProfile::new(10_000.0, 20);
>         let pos = account.open_position("BTC-USDT", 1.0, 50_000.0, 10);
> 
>         assert_eq!(pos.symbol, "BTC-USDT");
>         assert_eq!(pos.size, 1.0);
>         assert_eq!(pos.entry_price, 50_000.0);
>         assert_eq!(pos.leverage, 10);
>         assert_eq!(account.used_margin, 5_000.0);
>         assert!(account.total_equity >= account.used_margin);
>     }
> 
>     #[test]
>     #[should_panic(expected = "InvalidEquity: total equity must be positive")]
>     fn test_invalid_equity_panic() {
>         let _account = AccountRiskProfile::new(-500.0, 10);
>     }
> 
>     #[test]
>     #[should_panic(expected = "LeverageExceeded: position leverage exceeds account limit")]
>     fn test_exceeded_leverage_panic() {
>         let mut account = AccountRiskProfile::new(10_000.0, 5);
>         account.open_position("ETH-USDT", 2.0, 3_000.0, 10);
>     }
> 
>     #[test]
>     #[should_panic(expected = "MarginExceeded: insufficient available equity")]
>     fn test_exceeded_margin_panic() {
>         let mut account = AccountRiskProfile::new(1_000.0, 10);
>         account.open_position("BTC-USDT", 1.0, 50_000.0, 10);
>     }
> }
> ```
> 
> **Step-by-step Technical Explanation:**
> 1. **Defensive API Contract Enforcement:** In safety-critical domain logic such as financial trading, attempting to operate on corrupt state (e.g. negative balance or 0x leverage) must fail immediately to preserve data integrity. Rust's `panic!` mechanism acts as a hard runtime boundary.
> 2. **Targeted Substring Matching with `#[should_panic(expected = "...")]`:** Standard `#[should_panic]` validates *that* a panic occurred, but fails to verify *why*. By supplying `expected = "InvalidEquity: total equity must be positive"`, Rust's test harness checks if the panic payload string contains that exact substring.
> 3. **Preventing False Positive Test Passes:** If `test_exceeded_margin_panic` panicked due to an unexpected `IndexOutOfBounds` or division-by-zero bug instead of the margin check, `#[should_panic(expected = "...")]` would fail the test, exposing the underlying regression.

---

### Exercise 2: Multithreaded Shared State Lock Guard Invariant & Lock Poisoning Panic Test

**Scenario:** **Problem Requirements:**
You are engineering a thread-safe bounded in-memory cache component (`SharedCache`) protected by an `Arc<Mutex<BoundedCache>>`. You need to ensure capacity contracts are enforced, and test that thread panics holding shared lock guards properly trigger lock poisoning panic assertions.

**Requirements:**
Implement:
1. `BoundedCache` storing `entries: HashMap<String, String>` and `capacity: usize`.
   - `BoundedCache::new(capacity: usize) -> Self`: panics with `"InvalidCapacity: capacity must be greater than zero"` if `capacity == 0`.
   - `BoundedCache::put(&mut self, key: &str, value: &str)`: panics with `"CapacityOverflow: maximum capacity reached"` if adding a new key exceeds `capacity`.
   - `BoundedCache::get(&self, key: &str) -> Option<&String>`.
2. `SharedCache` wrapping `Arc<Mutex<BoundedCache>>`.
   - `SharedCache::new(capacity: usize) -> Self`.
   - `SharedCache::set(&self, key: &str, val: &str)`: acquires lock, panicking with `"LockPoisoned: mutex lock poisoned"` on `PoisonError`.
   - `SharedCache::get(&self, key: &str) -> Option<String>`: acquires lock, panicking with `"LockPoisoned: mutex lock poisoned"` on `PoisonError`.
   - `SharedCache::cause_lock_poison(&self)`: Spawns a background OS thread that acquires the mutex and panics inside the thread, intentionally poisoning the shared lock guard.
3. Unit tests (`#[cfg(test)] mod tests`) verifying:
   - Normal cache insertion and retrieval with `assert_eq!`, `matches!`, `assert!`.
   - Zero capacity initialization panic using `#[should_panic(expected = "InvalidCapacity: capacity must be greater than zero")]`.
   - Overflow insertion panic using `#[should_panic(expected = "CapacityOverflow: maximum capacity reached")]`.
   - Lock poisoning panic propagation across thread boundaries using `#[should_panic(expected = "LockPoisoned: mutex lock poisoned")]`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::HashMap;
> use std::sync::{Arc, Mutex};
> use std::thread;
> 
> #[derive(Debug)]
> pub struct BoundedCache {
>     capacity: usize,
>     entries: HashMap<String, String>,
> }
> 
> impl BoundedCache {
>     pub fn new(capacity: usize) -> Self {
>         if capacity == 0 {
>             panic!("InvalidCapacity: capacity must be greater than zero");
>         }
>         Self {
>             capacity,
>             entries: HashMap::new(),
>         }
>     }
> 
>     pub fn put(&mut self, key: &str, value: &str) {
>         if !self.entries.contains_key(key) && self.entries.len() >= self.capacity {
>             panic!("CapacityOverflow: maximum capacity reached");
>         }
>         self.entries.insert(key.to_string(), value.to_string());
>     }
> 
>     pub fn get(&self, key: &str) -> Option<&String> {
>         self.entries.get(key)
>     }
> }
> 
> #[derive(Clone)]
> pub struct SharedCache {
>     inner: Arc<Mutex<BoundedCache>>,
> }
> 
> impl SharedCache {
>     pub fn new(capacity: usize) -> Self {
>         Self {
>             inner: Arc::new(Mutex::new(BoundedCache::new(capacity))),
>         }
>     }
> 
>     pub fn set(&self, key: &str, val: &str) {
>         let mut guard = self.inner.lock().expect("LockPoisoned: mutex lock poisoned");
>         guard.put(key, val);
>     }
> 
>     pub fn get(&self, key: &str) -> Option<String> {
>         let guard = self.inner.lock().expect("LockPoisoned: mutex lock poisoned");
>         guard.get(key).cloned()
>     }
> 
>     pub fn cause_lock_poison(&self) {
>         let lock = Arc::clone(&self.inner);
>         let handle = thread::spawn(move || {
>             let _guard = lock.lock().unwrap();
>             panic!("ThreadFailure: intentional worker thread panic while holding lock");
>         });
>         let _ = handle.join();
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_valid_cache_operations() {
>         let cache = SharedCache::new(2);
>         cache.set("session_1", "user_alpha");
>         cache.set("session_2", "user_beta");
> 
>         assert_eq!(cache.get("session_1"), Some("user_alpha".to_string()));
>         assert_eq!(cache.get("session_2"), Some("user_beta".to_string()));
>         assert_eq!(cache.get("session_3"), None);
>         assert!(matches!(cache.get("session_1"), Some(_)));
>     }
> 
>     #[test]
>     #[should_panic(expected = "InvalidCapacity: capacity must be greater than zero")]
>     fn test_zero_capacity_panic() {
>         let _cache = SharedCache::new(0);
>     }
> 
>     #[test]
>     #[should_panic(expected = "CapacityOverflow: maximum capacity reached")]
>     fn test_capacity_overflow_panic() {
>         let cache = SharedCache::new(1);
>         cache.set("key1", "val1");
>         cache.set("key2", "val2");
>     }
> 
>     #[test]
>     #[should_panic(expected = "LockPoisoned: mutex lock poisoned")]
>     fn test_mutex_poisoning_propagation_panic() {
>         let cache = SharedCache::new(5);
>         cache.set("k1", "v1");
> 
>         cache.cause_lock_poison();
> 
>         let _val = cache.get("k1");
>     }
> }
> ```
> 
> **Step-by-step Technical Explanation:**
> 1. **Testing Lock Poisoning Dynamics:** When a thread holding a `std::sync::MutexGuard` panics, Rust marks the `Mutex` as poisoned to protect shared state from invariant corruption. Subsequent attempts to call `.lock()` return `Err(PoisonError)`.
> 2. **Testing Panic Propagation across Thread Boundaries:** By using `.expect("LockPoisoned: mutex lock poisoned")`, the main thread converts the `PoisonError` into a structured panic.
> 3. **Concurrency Test Isolation:** `#[should_panic]` isolates panics occurring within the test thread scope. Spawning a background worker thread and calling `.join()` allows the background panic to poison the mutex while allowing the main thread's subsequent lock acquisition attempt to trigger the monitored panic.

---

### Exercise 3: Zero-Copy Binary Telemetry Packet Parser & Boundary Validation

**Scenario:** **Problem Requirements:**
You are constructing a high-throughput IoT binary telemetry parser (`TelemetryFrame`). High-speed network stack parsers validate header invariant markers, payload byte alignment, and CRC checksums. If binary corruption or length mismatch occurs, the parser panics with explicit diagnostic messages.

**Requirements:**
Implement:
1. `TelemetryFrame` struct with `version: u8` and `payload: Vec<u8>`.
2. Binary Frame Layout (Header total 8 bytes):
   - Byte 0: Magic byte `0xAA`
   - Byte 1: Protocol Version `0x01`
   - Bytes 2–3: Payload length (`u16` Big Endian)
   - Bytes 4–7: Payload CRC sum (`u32` Big Endian)
   - Bytes 8+: Binary Payload
3. `TelemetryFrame::parse(raw: &[u8]) -> TelemetryFrame`:
   - Panics with `"BufferTooShort: header requires at least 8 bytes"` if `raw.len() < 8`.
   - Panics with `"InvalidMagic: header magic byte must be 0xAA"` if `raw[0] != 0xAA`.
   - Panics with `"UnsupportedVersion: protocol version must be 1"` if `raw[1] != 0x01`.
   - Decodes length `u16::from_be_bytes([raw[2], raw[3]])`.
   - Panics with `"PayloadLengthMismatch: payload length does not match header length"` if `raw.len() - 8 != length`.
   - Computes payload checksum `raw[8..].iter().fold(0u32, |acc, &b| acc.wrapping_add(b as u32))`.
   - Panics with `"ChecksumMismatch: payload CRC checksum verification failed"` if computed checksum does not match header checksum.
4. Unit tests (`#[cfg(test)] mod tests`) verifying:
   - Complete valid packet serialization and parsing using `assert_eq!`, `assert!`, `assert_ne!`.
   - Test cases for short buffer, corrupt magic byte, payload length mismatch, and checksum mismatch using `#[should_panic(expected = "...")]`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq)]
> pub struct TelemetryFrame {
>     pub version: u8,
>     pub payload: Vec<u8>,
> }
> 
> impl TelemetryFrame {
>     pub fn parse(raw: &[u8]) -> Self {
>         if raw.len() < 8 {
>             panic!("BufferTooShort: header requires at least 8 bytes");
>         }
> 
>         if raw[0] != 0xAA {
>             panic!("InvalidMagic: header magic byte must be 0xAA");
>         }
> 
>         if raw[1] != 0x01 {
>             panic!("UnsupportedVersion: protocol version must be 1");
>         }
> 
>         let payload_len = u16::from_be_bytes([raw[2], raw[3]]) as usize;
>         if raw.len() - 8 != payload_len {
>             panic!("PayloadLengthMismatch: payload length does not match header length");
>         }
> 
>         let expected_checksum = u32::from_be_bytes([raw[4], raw[5], raw[6], raw[7]]);
>         let computed_checksum = raw[8..]
>             .iter()
>             .fold(0u32, |acc, &b| acc.wrapping_add(b as u32));
> 
>         if computed_checksum != expected_checksum {
>             panic!("ChecksumMismatch: payload CRC checksum verification failed");
>         }
> 
>         Self {
>             version: raw[1],
>             payload: raw[8..].to_vec(),
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     fn build_frame(payload: &[u8]) -> Vec<u8> {
>         let payload_len = payload.len() as u16;
>         let checksum = payload.iter().fold(0u32, |acc, &b| acc.wrapping_add(b as u32));
> 
>         let mut buf = Vec::new();
>         buf.push(0xAA);
>         buf.push(0x01);
>         buf.extend_from_slice(&payload_len.to_be_bytes());
>         buf.extend_from_slice(&checksum.to_be_bytes());
>         buf.extend_from_slice(payload);
>         buf
>     }
> 
>     #[test]
>     fn test_valid_telemetry_frame_parsing() {
>         let payload = b"TEMP:23.5;HUMID:60";
>         let frame_bytes = build_frame(payload);
> 
>         let frame = TelemetryFrame::parse(&frame_bytes);
>         assert_eq!(frame.version, 1);
>         assert_eq!(frame.payload, payload.to_vec());
>         assert!(!frame.payload.is_empty());
>         assert_ne!(frame.payload, b"CORRUPTED".to_vec());
>     }
> 
>     #[test]
>     #[should_panic(expected = "BufferTooShort: header requires at least 8 bytes")]
>     fn test_short_buffer_panic() {
>         let raw = [0xAA, 0x01, 0x00];
>         TelemetryFrame::parse(&raw);
>     }
> 
>     #[test]
>     #[should_panic(expected = "InvalidMagic: header magic byte must be 0xAA")]
>     fn test_invalid_magic_panic() {
>         let mut raw = build_frame(b"DATA");
>         raw[0] = 0xBB;
>         TelemetryFrame::parse(&raw);
>     }
> 
>     #[test]
>     #[should_panic(expected = "PayloadLengthMismatch: payload length does not match header length")]
>     fn test_length_mismatch_panic() {
>         let mut raw = build_frame(b"DATA_PACKET");
>         raw.pop();
>         TelemetryFrame::parse(&raw);
>     }
> 
>     #[test]
>     #[should_panic(expected = "ChecksumMismatch: payload CRC checksum verification failed")]
>     fn test_checksum_mismatch_panic() {
>         let mut raw = build_frame(b"SENSOR_OK");
>         let last_idx = raw.len() - 1;
>         raw[last_idx] ^= 0xFF;
>         TelemetryFrame::parse(&raw);
>     }
> }
> ```
> 
> **Step-by-step Technical Explanation:**
> 1. **Binary Slice Bounds & Endianness Parsing:** High-performance parsers convert big-endian byte sequences (`u16::from_be_bytes`, `u32::from_be_bytes`) directly into primitive numeric types.
> 2. **Fast Invariant Failure via Panics:** Zero-copy networking libraries often crash framing routines when protocol headers are malformed or checksums fail, as corrupted buffers violate standard system preconditions.
> 3. **Comprehensive Panic Coverage:** Each edge condition (truncated header, invalid magic header, framing byte mismatch, bit flips in payload) produces a distinct panic string. Annotating unit tests with `#[should_panic(expected = "...")]` ensures that every individual validation barrier is regression-tested and panics with the exact expected error string.

---

## 6. Related Terms


- [`panic!` Macro](../level_04/panic.md) — The macro that triggers the behavior this attribute looks for.
- [`assert!` Macros](assert_macros.md) — The macros that are often used inside functions to intentionally trigger the panics you are testing.

---

## 7. Key Takeaways

- `#[should_panic]` reverses standard test logic: Panicking = Pass. Completing successfully = Fail.
- It must be used in combination with the `#[test]` attribute.
- It is crucial for verifying that your code correctly catches and crashes on invalid input or edge cases.
- Always try to use `#[should_panic(expected = "message")]` to ensure it panicked for the exact right reason.
