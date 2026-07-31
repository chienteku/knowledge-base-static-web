# `while`

> **Level 2 — Control Flow & Data Structures**
> A conditional loop that runs while a predicate is true.

---

## 1. Prerequisites

- [`loop`](../level_02/loop.md) — The unconditional loop that runs forever.
- [`if` / `else`](../level_02/if_else.md) — The branching logic that evaluates a true/false condition (which `while` also does).

---

## 2. Term Category

**Rust-nonspecific**: The `while` loop is a fundamental construct found in almost every programming language (C, Java, Python, JavaScript) to repeat code based on a condition.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The [`loop`](../level_02/loop.md) keyword is fantastic for infinite processes, but very often, you want a loop to stop naturally when a specific condition is no longer met. 

You *could* achieve this by writing a `loop`, putting an `if` statement at the very top, and calling `break` if the condition is false. However, doing this every time is verbose and clunky. 

The **`while` loop** was designed as a cleaner alternative. It combines a loop and a condition into a single, elegant line of code. It checks a true/false condition (a predicate) *before* every iteration. If it's true, it runs the block. If it's false, it skips the block and moves on to the rest of the program. 

### (2) Reality Metaphor

A `while` loop is like **filling up your car's gas tank**.

You squeeze the pump handle (execute the loop body) *while* the tank is not full. The moment the sensor detects that the tank is full (the condition becomes `false`), the pump automatically stops, and you move on with your day.

### (3) Rust Code Examples

#### Short Snippet
```rust
let mut countdown = 3;

// The loop runs as long as countdown is greater than 0.
// Notice there are no parentheses around the condition!
while countdown > 0 {
    println!("{}...", countdown);
    countdown -= 1; // Don't forget to change the condition variable!
}
println!("Liftoff!");
```

#### Fuller Example
```rust
fn main() {
    let mut player_health = 100;
    let mut monsters_defeated = 0;
    
    // A classic game loop scenario
    while player_health > 0 {
        // Simulate taking damage
        player_health -= 25;
        monsters_defeated += 1;
        
        println!("Fought a monster! Health is now {}", player_health);
        
        // We can still use `break` inside a while loop if an emergency happens
        if monsters_defeated == 3 {
            println!("You found the exit and escaped early!");
            break; 
        }
    }
    
    println!("Adventure over. You defeated {} monsters.", monsters_defeated);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding While Scoping and Lifecycle Rules

**The mistake:** Assuming While instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("while_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("while_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating While State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with While through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to While Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe While instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Resilience Engine with Exponential Backoff State Loop

**Problem Statement:**
In distributed network services, operations (such as HTTP requests, RPCs, or database transactions) frequently fail due to transient errors like network jitter, connection timeouts, or service overload. To ensure system resilience, engineers implement retry loops with exponential backoff.

Design a `BackoffRetryEngine` struct with an `execute` method that executes a closure `F` inside a `while` loop under the following constraints:
1. Maintain state counters for `attempts` (starting at 0) and `total_delay_ms` (starting at 0).
2. The `while` loop must continue while `attempts < policy.max_attempts`.
3. Increment `attempts` by 1 at the beginning of each iteration.
4. Call the closure `op(attempts)`. If it returns `Ok(payload)`, return an `Ok(ExecutionSummary)` immediately containing the total attempts, accumulated delay, and payload.
5. If the closure returns `Err(RetryError::Transient(msg))`:
   - If `attempts < policy.max_attempts`, add `current_backoff` to `total_delay_ms`, then update `current_backoff = (current_backoff * 2).min(policy.max_backoff_ms)`.
   - If `attempts == policy.max_attempts`, let the `while` loop terminate naturally and return `Err(RetryError::Transient(...))`.
6. If the closure returns `Err(RetryError::Fatal(msg))`, terminate the `while` loop immediately using `return` / `break` and return the fatal error.

Include comprehensive unit tests covering:
- Immediate success on attempt 1.
- Eventual success after transient retries with accumulated delay verification.
- Exhaustion of retry budget (`max_attempts`).
- Fatal error triggering early termination without exhausting remaining retries.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq)]
> pub enum RetryError {
>     Transient(String),
>     Fatal(String),
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct RetryPolicy {
>     pub max_attempts: usize,
>     pub initial_backoff_ms: u64,
>     pub max_backoff_ms: u64,
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct ExecutionSummary {
>     pub total_attempts: usize,
>     pub total_delay_ms: u64,
>     pub payload: String,
> }
> 
> pub struct BackoffRetryEngine {
>     policy: RetryPolicy,
> }
> 
> impl BackoffRetryEngine {
>     pub fn new(policy: RetryPolicy) -> Self {
>         Self { policy }
>     }
> 
>     pub fn execute<F>(&self, mut op: F) -> Result<ExecutionSummary, RetryError>
>     where
>         F: FnMut(usize) -> Result<String, RetryError>,
>     {
>         let mut attempts = 0;
>         let mut total_delay_ms = 0;
>         let mut current_backoff = self.policy.initial_backoff_ms;
> 
>         while attempts < self.policy.max_attempts {
>             attempts += 1;
>             match op(attempts) {
>                 Ok(data) => {
>                     return Ok(ExecutionSummary {
>                         total_attempts: attempts,
>                         total_delay_ms,
>                         payload: data,
>                     });
>                 }
>                 Err(RetryError::Transient(_msg)) => {
>                     if attempts < self.policy.max_attempts {
>                         total_delay_ms += current_backoff;
>                         current_backoff = (current_backoff * 2).min(self.policy.max_backoff_ms);
>                     }
>                 }
>                 Err(RetryError::Fatal(msg)) => {
>                     return Err(RetryError::Fatal(msg));
>                 }
>             }
>         }
> 
>         Err(RetryError::Transient(format!(
>             "Operation failed after {} attempts",
>             attempts
>         )))
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_successful_first_attempt() {
>         let policy = RetryPolicy {
>             max_attempts: 3,
>             initial_backoff_ms: 100,
>             max_backoff_ms: 1000,
>         };
>         let engine = BackoffRetryEngine::new(policy);
> 
>         let result = engine.execute(|_attempt| Ok("Success".to_string()));
> 
>         assert!(result.is_ok());
>         let summary = result.unwrap();
>         assert_eq!(summary.total_attempts, 1);
>         assert_eq!(summary.total_delay_ms, 0);
>         assert_eq!(summary.payload, "Success");
>     }
> 
>     #[test]
>     fn test_transient_retry_success() {
>         let policy = RetryPolicy {
>             max_attempts: 5,
>             initial_backoff_ms: 50,
>             max_backoff_ms: 500,
>         };
>         let engine = BackoffRetryEngine::new(policy);
> 
>         let result = engine.execute(|attempt| {
>             if attempt < 3 {
>                 Err(RetryError::Transient("Connection reset".to_string()))
>             } else {
>                 Ok("Connected".to_string())
>             }
>         });
> 
>         assert!(result.is_ok());
>         let summary = result.unwrap();
>         assert_eq!(summary.total_attempts, 3);
>         // Attempt 1: delay 50ms, Attempt 2: delay 100ms -> Total delay = 150ms
>         assert_eq!(summary.total_delay_ms, 150);
>         assert_eq!(summary.payload, "Connected");
>     }
> 
>     #[test]
>     fn test_retry_exhaustion() {
>         let policy = RetryPolicy {
>             max_attempts: 3,
>             initial_backoff_ms: 100,
>             max_backoff_ms: 1000,
>         };
>         let engine = BackoffRetryEngine::new(policy);
> 
>         let result = engine.execute(|_attempt| {
>             Err(RetryError::Transient("Timeout".to_string()))
>         });
> 
>         assert!(result.is_err());
>         assert_eq!(
>             result,
>             Err(RetryError::Transient("Operation failed after 3 attempts".to_string()))
>         );
>     }
> 
>     #[test]
>     fn test_fatal_error_immediate_termination() {
>         let policy = RetryPolicy {
>             max_attempts: 5,
>             initial_backoff_ms: 100,
>             max_backoff_ms: 1000,
>         };
>         let engine = BackoffRetryEngine::new(policy);
> 
>         let mut call_count = 0;
>         let result = engine.execute(|attempt| {
>             call_count += 1;
>             if attempt == 1 {
>                 Err(RetryError::Transient("Busy".to_string()))
>             } else {
>                 Err(RetryError::Fatal("Auth Failed".to_string()))
>             }
>         });
> 
>         assert!(result.is_err());
>         assert_ne!(call_count, policy.max_attempts);
>         assert_eq!(call_count, 2);
>         assert!(matches!(result, Err(RetryError::Fatal(ref msg)) if msg == "Auth Failed"));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **`while` Predicate Evaluation and State Control**: The `while attempts < self.policy.max_attempts` condition acts as a strict dynamic guard. Unlike `for` loops which consume an iterator, `while` allows manual increments and conditional iteration short-circuiting based on state modified inside the body.
> 2. **Ownership and FnMut Trait Bounds**: The closure parameter `op` is bound with `FnMut(usize) -> Result<String, RetryError>`. Using `FnMut` permits the closure to mutate internal state across repeated invocations inside the `while` loop (e.g., tracking `call_count` in tests), while passed by mutable reference `mut op`.
> 3. **Early Exit vs Loop Exhaustion**: Returning `Ok(...)` or `Err(RetryError::Fatal)` directly from within the `match` block exits the function (and loop) immediately without performing unnecessary backoff calculations. When transient errors persist, the loop terminates naturally when `attempts` reaches `max_attempts`.
> 4. **Edge Cases**: When `max_attempts` is set to 0, the `while` predicate `0 < 0` evaluates to `false` immediately, safely returning a retry exhaustion error without invoking `op`. Backoff capping using `.min(max_backoff_ms)` prevents numerical overflow during repeated doubling.

---

### Exercise 2: Length-Prefixed Binary Stream Parser & Frame Decoder

**Problem Statement:**
High-performance network services (such as Redis, Kafka, or custom TCP protocols) transmit binary frames over stream sockets. Because TCP delivers byte streams rather than discrete packets, incoming data arrives in arbitrary chunks into an accumulating buffer `Vec<u8>`.

Implement `StreamFrameDecoder::decode_stream` to parse binary frames from a mutable buffer reference `&mut Vec<u8>`.
Each binary frame consists of:
- Magic Byte: `0xAA` (1 byte).
- Payload Length: `u16` in big-endian byte order (2 bytes).
- Payload: N bytes (where N = Payload Length).

The decoder must use a `while` loop with cursor navigation:
1. `while cursor + HEADER_SIZE <= buffer.len()` (where `HEADER_SIZE = 3` bytes):
   - Check magic byte at `buffer[cursor]`. If `buffer[cursor] != 0xAA`, increment `corrupted_count += 1`, advance `cursor += 1`, and `continue` to scan for the next valid frame header.
   - Read 2-byte payload length via `u16::from_be_bytes([buffer[cursor + 1], buffer[cursor + 2]]) as usize`.
   - Calculate total frame size `total_frame_len = 3 + payload_len`.
   - Check if the full frame is present in the buffer: `if cursor + total_frame_len > buffer.len()`. If false (fragmented frame), `break` out of the `while` loop without advancing `cursor`, leaving unparsed bytes in the buffer.
   - Extract payload slice `buffer[cursor + 3 .. cursor + total_frame_len].to_vec()`, store in `Frame`, advance `cursor += total_frame_len`.
2. After the `while` loop finishes, drain processed bytes from the front of the buffer: `buffer.drain(0..cursor)`.
3. Return `(Vec<Frame>, usize)` returning parsed frames and total corrupted bytes skipped.

Write unit tests verifying:
- Decoding multiple sequential valid frames in a single call.
- Handling incomplete frame headers/payloads (fragmentation) by retaining remaining buffer bytes and resuming correctly when more data arrives.
- Skipped corrupted prefix bytes recovery.
- Frames with zero-length payloads (`payload_len == 0`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq, Clone)]
> pub struct Frame {
>     pub payload: Vec<u8>,
> }
> 
> pub struct StreamFrameDecoder;
> 
> impl StreamFrameDecoder {
>     pub const MAGIC_BYTE: u8 = 0xAA;
>     pub const HEADER_SIZE: usize = 3; // 1 byte magic + 2 bytes u16 len
> 
>     pub fn decode_stream(buffer: &mut Vec<u8>) -> (Vec<Frame>, usize) {
>         let mut frames = Vec::new();
>         let mut cursor = 0;
>         let mut corrupted_count = 0;
> 
>         while cursor + Self::HEADER_SIZE <= buffer.len() {
>             if buffer[cursor] != Self::MAGIC_BYTE {
>                 corrupted_count += 1;
>                 cursor += 1;
>                 continue;
>             }
> 
>             let payload_len = u16::from_be_bytes([buffer[cursor + 1], buffer[cursor + 2]]) as usize;
>             let total_frame_len = Self::HEADER_SIZE + payload_len;
> 
>             if cursor + total_frame_len > buffer.len() {
>                 // Incomplete payload; suspend parsing until next network read chunk
>                 break;
>             }
> 
>             let payload = buffer[cursor + Self::HEADER_SIZE..cursor + total_frame_len].to_vec();
>             frames.push(Frame { payload });
>             cursor += total_frame_len;
>         }
> 
>         // Retain unparsed/fragmented trailing bytes by draining processed bytes
>         buffer.drain(0..cursor);
> 
>         (frames, corrupted_count)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_decode_multiple_valid_frames() {
>         let mut stream_buf = Vec::new();
> 
>         // Frame 1: [0xAA, 0x00, 0x02, 0x10, 0x20]
>         stream_buf.extend_from_slice(&[0xAA, 0x00, 0x02, 0x10, 0x20]);
>         // Frame 2: [0xAA, 0x00, 0x01, 0xFF]
>         stream_buf.extend_from_slice(&[0xAA, 0x00, 0x01, 0xFF]);
> 
>         let (frames, corrupted) = StreamFrameDecoder::decode_stream(&mut stream_buf);
> 
>         assert_eq!(frames.len(), 2);
>         assert_eq!(corrupted, 0);
>         assert_eq!(frames[0].payload, vec![0x10, 0x20]);
>         assert_eq!(frames[1].payload, vec![0xFF]);
>         assert!(stream_buf.is_empty());
>     }
> 
>     #[test]
>     fn test_fragmented_frame_retains_unparsed_buffer() {
>         let mut stream_buf = Vec::new();
> 
>         // Complete Frame 1: [0xAA, 0x00, 0x01, 0x05]
>         stream_buf.extend_from_slice(&[0xAA, 0x00, 0x01, 0x05]);
>         // Incomplete Frame 2: Header claims length 4, but only 2 payload bytes present
>         stream_buf.extend_from_slice(&[0xAA, 0x00, 0x04, 0x01, 0x02]);
> 
>         let (frames, corrupted) = StreamFrameDecoder::decode_stream(&mut stream_buf);
> 
>         assert_eq!(frames.len(), 1);
>         assert_eq!(corrupted, 0);
>         assert_eq!(frames[0].payload, vec![0x05]);
>         // Unparsed incomplete frame must remain in stream_buf
>         assert_eq!(stream_buf, vec![0xAA, 0x00, 0x04, 0x01, 0x02]);
> 
>         // Append remaining payload bytes [0x03, 0x04]
>         stream_buf.extend_from_slice(&[0x03, 0x04]);
>         let (next_frames, _) = StreamFrameDecoder::decode_stream(&mut stream_buf);
> 
>         assert_eq!(next_frames.len(), 1);
>         assert_eq!(next_frames[0].payload, vec![0x01, 0x02, 0x03, 0x04]);
>         assert!(stream_buf.is_empty());
>     }
> 
>     #[test]
>     fn test_corrupted_leading_bytes_recovery() {
>         let mut stream_buf = vec![0x00, 0x12, 0xFF, 0xAA, 0x00, 0x02, 0xCA, 0xFE];
> 
>         let (frames, corrupted) = StreamFrameDecoder::decode_stream(&mut stream_buf);
> 
>         assert_eq!(corrupted, 3);
>         assert_eq!(frames.len(), 1);
>         assert_eq!(frames[0].payload, vec![0xCA, 0xFE]);
>         assert_ne!(corrupted, 0);
>     }
> 
>     #[test]
>     fn test_empty_payload_frame() {
>         let mut stream_buf = vec![0xAA, 0x00, 0x00];
> 
>         let (frames, corrupted) = StreamFrameDecoder::decode_stream(&mut stream_buf);
> 
>         assert_eq!(corrupted, 0);
>         assert_eq!(frames.len(), 1);
>         assert!(matches!(frames.get(0), Some(f) if f.payload.is_empty()));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Index Boundary Guarding in `while` Conditions**: The condition `cursor + Self::HEADER_SIZE <= buffer.len()` guarantees that reading `buffer[cursor]`, `buffer[cursor+1]`, and `buffer[cursor+2]` inside the loop body will never trigger an out-of-bounds index panic (`E0608`/panic).
> 2. **Stream Resynchronization via Loop Increments**: When encountering non-magic bytes, `cursor += 1` combined with `continue` skips corrupted noise byte-by-byte until the start of a valid frame marker is aligned with `cursor`.
> 3. **Non-destructive Buffer Mutation via `drain`**: Modifying `buffer` in-place using `buffer.drain(0..cursor)` after loop completion avoids expensive reallocations while ensuring processed frame bytes are removed and incomplete frame fragments remain aligned at byte index 0 for future parsing.
> 4. **Memory & Slicing Safety**: Using `.to_vec()` creates owned copies of payload data for the returned `Frame` instances, breaking reference ties with `buffer` so that `buffer.drain(...)` can safely execute without violating Rust's alias XOR mutability rules.

---

### Exercise 3: Financial Order Book Batch Processor with Compound Conditions

**Problem Statement:**
In high-frequency trading engines, pending stock market orders accumulate in an order queue `VecDeque<Order>`. To balance order matching throughput with strict memory and risk limits, a batch processing engine drains orders using a `while` loop governed by compound conditions.

Implement `OrderBookProcessor::process_batch` which operates on `queue: &mut VecDeque<Order>` under the following requirements:
1. Initialize `processed_count = 0`, `total_volume = 0`, `total_cost = 0.0`, and `flushed_early = false`.
2. Execute a `while` loop while `!queue.is_empty() && processed_count < max_batch_size && total_volume < max_batch_volume`.
3. Before popping the next order, peek at `queue.front()`. If `total_volume > 0` and adding `next_order.quantity` would cause `total_volume + next_order.quantity > max_batch_volume`, `break` the loop immediately without removing the order from the queue.
4. Pop the front order using `let order = queue.pop_front().unwrap()`.
5. If `order.order_type == OrderType::FlushMarker`, process the marker (increment `processed_count`, add volume, add cost), set `flushed_early = true`, and `break` out of the `while` loop immediately to force an immediate disk/journal flush.
6. Accumulate order metrics (`processed_count += 1`, `total_volume += order.quantity`, `total_cost += order.price * order.quantity`).
7. Calculate volume-weighted average price (`vwap = total_cost / total_volume` if `total_volume > 0` else `0.0`).
8. Return a `BatchReport` summarizing the batch execution results.

Write unit tests verifying:
- Complete queue drain when order count and total volume are within thresholds.
- Batch stopping precisely at `max_batch_size` limit while preserving remaining orders in queue.
- Prevention of volume overfill via lookahead boundary check.
- `FlushMarker` triggering early loop break and setting `flushed_early: true`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::VecDeque;
> 
> #[derive(Debug, PartialEq, Eq, Clone)]
> pub enum OrderType {
>     Standard,
>     FlushMarker,
> }
> 
> #[derive(Debug, PartialEq, Clone)]
> pub struct Order {
>     pub id: u64,
>     pub price: f64,
>     pub quantity: u64,
>     pub order_type: OrderType,
> }
> 
> #[derive(Debug, PartialEq)]
> pub struct BatchReport {
>     pub processed_count: usize,
>     pub total_volume: u64,
>     pub vwap: f64,
>     pub remaining_in_queue: usize,
>     pub flushed_early: bool,
> }
> 
> pub struct OrderBookProcessor;
> 
> impl OrderBookProcessor {
>     pub fn process_batch(
>         queue: &mut VecDeque<Order>,
>         max_batch_size: usize,
>         max_batch_volume: u64,
>     ) -> BatchReport {
>         let mut processed_count = 0;
>         let mut total_volume = 0;
>         let mut total_cost = 0.0;
>         let mut flushed_early = false;
> 
>         while !queue.is_empty()
>             && processed_count < max_batch_size
>             && total_volume < max_batch_volume
>         {
>             // Lookahead check to avoid exceeding max_batch_volume
>             let next_qty = queue.front().unwrap().quantity;
>             if total_volume > 0 && total_volume + next_qty > max_batch_volume {
>                 break;
>             }
> 
>             let order = queue.pop_front().unwrap();
> 
>             if order.order_type == OrderType::FlushMarker {
>                 processed_count += 1;
>                 total_volume += order.quantity;
>                 total_cost += order.price * (order.quantity as f64);
>                 flushed_early = true;
>                 break;
>             }
> 
>             processed_count += 1;
>             total_volume += order.quantity;
>             total_cost += order.price * (order.quantity as f64);
>         }
> 
>         let vwap = if total_volume > 0 {
>             total_cost / (total_volume as f64)
>         } else {
>             0.0
>         };
> 
>         BatchReport {
>             processed_count,
>             total_volume,
>             vwap,
>             remaining_in_queue: queue.len(),
>             flushed_early,
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_full_queue_drain_within_limits() {
>         let mut queue = VecDeque::new();
>         queue.push_back(Order { id: 1, price: 100.0, quantity: 10, order_type: OrderType::Standard });
>         queue.push_back(Order { id: 2, price: 102.0, quantity: 20, order_type: OrderType::Standard });
> 
>         let report = OrderBookProcessor::process_batch(&mut queue, 10, 100);
> 
>         assert_eq!(report.processed_count, 2);
>         assert_eq!(report.total_volume, 30);
>         assert!((report.vwap - 101.33333333333333).abs() < 1e-6);
>         assert_eq!(report.remaining_in_queue, 0);
>         assert!(!report.flushed_early);
>     }
> 
>     #[test]
>     fn test_batch_size_cap_reached() {
>         let mut queue = VecDeque::new();
>         for i in 1..=5 {
>             queue.push_back(Order { id: i, price: 50.0, quantity: 5, order_type: OrderType::Standard });
>         }
> 
>         let report = OrderBookProcessor::process_batch(&mut queue, 3, 1000);
> 
>         assert_eq!(report.processed_count, 3);
>         assert_eq!(report.total_volume, 15);
>         assert_eq!(report.remaining_in_queue, 2);
>         assert_ne!(report.remaining_in_queue, 0);
>     }
> 
>     #[test]
>     fn test_volume_cap_prevents_overfill() {
>         let mut queue = VecDeque::new();
>         queue.push_back(Order { id: 1, price: 10.0, quantity: 40, order_type: OrderType::Standard });
>         queue.push_back(Order { id: 2, price: 10.0, quantity: 50, order_type: OrderType::Standard });
>         queue.push_back(Order { id: 3, price: 10.0, quantity: 30, order_type: OrderType::Standard });
> 
>         let report = OrderBookProcessor::process_batch(&mut queue, 10, 70);
> 
>         assert_eq!(report.processed_count, 1);
>         assert_eq!(report.total_volume, 40);
>         assert_eq!(report.remaining_in_queue, 2);
>     }
> 
>     #[test]
>     fn test_flush_marker_triggers_immediate_break() {
>         let mut queue = VecDeque::new();
>         queue.push_back(Order { id: 1, price: 20.0, quantity: 5, order_type: OrderType::Standard });
>         queue.push_back(Order { id: 2, price: 20.0, quantity: 5, order_type: OrderType::FlushMarker });
>         queue.push_back(Order { id: 3, price: 20.0, quantity: 5, order_type: OrderType::Standard });
> 
>         let report = OrderBookProcessor::process_batch(&mut queue, 10, 100);
> 
>         assert_eq!(report.processed_count, 2);
>         assert_eq!(report.remaining_in_queue, 1);
>         assert!(matches!(report, BatchReport { flushed_early: true, .. }));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Compound Boolean Predicate Evaluation**: In Rust, boolean operators `&&` short-circuit from left to right. In `while !queue.is_empty() && processed_count < max_batch_size && total_volume < max_batch_volume`, if `!queue.is_empty()` is false, subsequent comparisons are not evaluated, guarding against invalid operations on an empty queue.
> 2. **Lookahead Guarding with `queue.front()`**: Inspecting elements via `queue.front()` without removing them enables predictive condition evaluation before state mutation. If the prospective volume would breach `max_batch_volume`, breaking early leaves the order safely intact at the head of the queue.
> 3. **Queue Ownership and Lifetime**: `queue` is passed as a mutable reference `&mut VecDeque<Order>`. Borrow checker rules guarantee exclusive access during the batch execution cycle, preventing concurrent modification panics or iterator invalidation.
> 4. **Division Safety in Financial Metrics**: Calculating VWAP requires guarding against division-by-zero (`0.0 / 0.0` yielding `NaN`). Checking `if total_volume > 0` ensures mathematical stability even when processing an empty batch.

---

## 6. Related Terms

- [`loop`](../level_02/loop.md) — The unconditional loop. If you find yourself writing `while true`, replace it with `loop`.
- [`for` / Range](../level_02/for_range.md) — The preferred loop for going through arrays or counting through a range of numbers.

---

## 7. Key Takeaways

- `while` runs a block of code repeatedly as long as its condition evaluates to `true`.
- The condition is checked at the *very beginning* of every iteration.
- You **do not** use parentheses around the condition.
- You must remember to manually mutate the condition variable inside the loop, otherwise, it will run forever.
- Unlike `loop`, a `while` loop **cannot** return a value via `break`.
