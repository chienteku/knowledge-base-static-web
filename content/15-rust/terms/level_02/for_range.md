# `for` / Range

> **Level 2 — Control Flow & Data Structures**
> Iteration over a range (`0..10`) or any iterator. The most idiomatic loop in Rust.

---

## 1. Prerequisites


- [`while`](while.md) — The conditional loop, which the `for` loop is designed to replace in 90% of use cases.
- [Variable](../level_01/variable.md) — The `for` loop automatically binds the current item to a variable for you.

---

## 2. Term Category



**Rust Control Flow (iterator loop construct)**: While `for` loops exist everywhere, Rust completely removes the traditional, error-prone C-style loop (`for (int i=0; i<10; i++)`) in favor of exclusively using safe, iterator-based `for ... in` loops.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The traditional C-style `for` loop requires you to manually manage a counter, a condition, and a step size. It is infamous in programming history for causing **"off-by-one" errors**. If you type `<` instead of `<=`, or `i++` instead of `i--`, your program might skip data, run forever, or crash by trying to access data outside the bounds of an array.

Rust's designers banned the traditional C-style `for` loop entirely. 

Instead, Rust uses an **iterator-based `for` loop**. You simply provide a collection (like a list) or a mathematical **Range** (like `1..5`), and the `for` loop automatically handles everything. It pulls out the items one by one until the collection is empty. This completely eliminates off-by-one errors and guarantees you will never accidentally access out-of-bounds memory. Because of this safety, the `for` loop is the most idiomatic and frequently used loop in Rust.

### (2) Reality Metaphor

A traditional `while` loop or C-style `for` loop is like **dealing cards by counting in your head**: *"Okay, I've dealt 1, 2, 3... wait, was the limit 52 or 51? Did I start counting at 0 or 1?"* You might easily deal too many or too few. 

A Rust `for` loop is like **dealing cards until your hand is empty**. You don't need to count, and you don't need to know the limit. You just say, *"For every card in this deck, put it on the table."* The physical structure of the deck guarantees you won't make a counting mistake.

### (3) Rust Code Examples

#### Short Snippet
```rust
// A "Range" is created using the `..` syntax.
// This will print 1, 2, and 3. (Ranges are exclusive of the upper bound).
for number in 1..4 {
    println!("{}", number);
}
```

#### Fuller Example
```rust
fn main() {
    let countdown = [3, 2, 1]; // An array of numbers
    
    // We can loop directly over the array. 
    // `number` is automatically created as a variable for the current item.
    for number in countdown {
        println!("{}...", number);
    }
    println!("Liftoff!");
    
    // If you need the upper bound to be INCLUDED, use `..=`
    // This will print 10, 20, 30, 40, 50
    for percentage in 1..=5 {
        println!("Loading: {}%", percentage * 10);
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding For Range Scoping and Lifecycle Rules

**The mistake:** Assuming For Range instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("for_range_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("for_range_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating For Range State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with For Range through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to For Range Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe For Range instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Streaming Network Frame Decoder and Packet Checksum Validator

**Scenario:** In high-throughput network service daemons, binary stream buffers must be chunked into structured protocol frames of a fixed size. Each frame contains a 2-byte header ID, variable payload data, and a trailing 1-byte XOR checksum. To process incoming byte streams safely without manual index arithmetic or out-of-bounds pointer offsets, system pipelines utilize strided range loops (`(0..len).step_by(frame_size)`) combined with slice index sub-ranges (`start..end`).

**Task:** Write a function `decode_frames(buffer: &[u8], frame_size: usize) -> Result<Vec<Frame>, FrameError>` that iterates over a raw byte slice in stepped chunks. For each frame chunk:
1. Validate that the chunk matches `frame_size`. If the trailing slice fragment is smaller than `frame_size`, return `FrameError::IncompleteFrame`.
2. Extract the big-endian 2-byte frame ID (`u16::from_be_bytes([chunk[0], chunk[1]])`).
3. Extract the checksum from the last byte of the frame (`chunk[chunk.len() - 1]`).
4. Using an explicit range loop `for i in start..(end - 1)`, compute the XOR sum of all preceding bytes in the frame.
5. If the computed checksum does not equal the expected checksum, return `FrameError::ChecksumMismatch`.
6. Return `Ok(Vec<Frame>)` upon successful parsing.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq)]
> pub struct Frame {
>     pub id: u16,
>     pub payload: Vec<u8>,
>     pub checksum: u8,
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum FrameError {
>     EmptyBuffer,
>     InvalidFrameSize,
>     IncompleteFrame { expected: usize, actual: usize },
>     ChecksumMismatch { expected: u8, actual: u8 },
> }
> 
> pub fn decode_frames(buffer: &[u8], frame_size: usize) -> Result<Vec<Frame>, FrameError> {
>     if frame_size <= 2 {
>         return Err(FrameError::InvalidFrameSize);
>     }
>     if buffer.is_empty() {
>         return Err(FrameError::EmptyBuffer);
>     }
> 
>     let mut frames = Vec::new();
>     let total_len = buffer.len();
> 
>     for start in (0..total_len).step_by(frame_size) {
>         let end = (start + frame_size).min(total_len);
>         let chunk_len = end - start;
> 
>         if chunk_len < frame_size {
>             return Err(FrameError::IncompleteFrame {
>                 expected: frame_size,
>                 actual: chunk_len,
>             });
>         }
> 
>         let chunk = &buffer[start..end];
>         let id = u16::from_be_bytes([chunk[0], chunk[1]]);
>         let payload = chunk[2..chunk.len() - 1].to_vec();
>         let expected_checksum = chunk[chunk.len() - 1];
> 
>         let mut computed_checksum: u8 = 0;
>         for i in start..(end - 1) {
>             computed_checksum ^= buffer[i];
>         }
> 
>         if computed_checksum != expected_checksum {
>             return Err(FrameError::ChecksumMismatch {
>                 expected: expected_checksum,
>                 actual: computed_checksum,
>             });
>         }
> 
>         frames.push(Frame {
>             id,
>             payload,
>             checksum: expected_checksum,
>         });
>     }
> 
>     Ok(frames)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_valid_frame_decoding() {
>         let raw_data: Vec<u8> = vec![
>             0x01, 0x02, 0xAA, 0xBB, 0x01 ^ 0x02 ^ 0xAA ^ 0xBB,
>             0x03, 0x04, 0xCC, 0xDD, 0x03 ^ 0x04 ^ 0xCC ^ 0xDD,
>         ];
> 
>         let result = decode_frames(&raw_data, 5);
>         assert!(result.is_ok());
>         let frames = result.unwrap();
>         assert_eq!(frames.len(), 2);
>         assert_eq!(frames[0].id, 0x0102);
>         assert_eq!(frames[0].payload, vec![0xAA, 0xBB]);
>         assert_eq!(frames[1].id, 0x0304);
>         assert_ne!(frames[0].id, frames[1].id);
>     }
> 
>     #[test]
>     fn test_checksum_mismatch() {
>         let raw_data: Vec<u8> = vec![0x01, 0x02, 0xAA, 0xBB, 0xFF];
>         let result = decode_frames(&raw_data, 5);
>         assert!(result.is_err());
>         assert!(matches!(result, Err(FrameError::ChecksumMismatch { .. })));
>     }
> 
>     #[test]
>     fn test_incomplete_frame_and_invalid_size() {
>         let raw_data: Vec<u8> = vec![0x01, 0x02, 0xAA];
>         let result = decode_frames(&raw_data, 5);
>         assert!(matches!(result, Err(FrameError::IncompleteFrame { expected: 5, actual: 3 })));
> 
>         let result_invalid = decode_frames(&raw_data, 2);
>         assert_eq!(result_invalid, Err(FrameError::InvalidFrameSize));
>         
>         let empty_data: Vec<u8> = vec![];
>         let result_empty = decode_frames(&empty_data, 5);
>         assert_eq!(result_empty, Err(FrameError::EmptyBuffer));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Range Stepping with `.step_by()`**: The expression `(0..total_len).step_by(frame_size)` generates an iterator over starting offset indices incremented by `frame_size` at each iteration. This guarantees that the loop pointer moves in exact frame boundaries without manual arithmetic increments.
> 2. **Inclusive vs. Exclusive Bounds**: The range `start..(end - 1)` is used to iterate over all header and payload bytes excluding the trailing checksum byte. Range expressions in Rust are exclusive of the upper bound (`end - 1`), preventing off-by-one errors when computing checksums.
> 3. **Ownership and Borrowing**: The function takes `buffer: &[u8]`, borrowing the slice immutably. Slices allow safe indexing within bound checks (`&buffer[start..end]`). Vector payloads are created using `.to_vec()`, copying only the relevant payload bytes into owned heap structures (`Frame`).
> 4. **Edge Cases & Memory Safety**: If the total slice length is not an exact multiple of `frame_size`, `(start + frame_size).min(total_len)` prevents out-of-bounds slicing, allowing the code to explicitly detect truncated frames and return `FrameError::IncompleteFrame`.
> 
---

### Exercise 2: Quantitative Market Volume Profiler & Sliding Window Aggregator

**Scenario:** Quantitative trading engines evaluate continuous tick streams to calculate rolling metrics such as Volume-Weighted Average Price (VWAP) and peak order prices across moving time windows. Calculating sliding window metrics requires stepping an outer index range while using an inner range loop (`for j in start..end`) to compute aggregations over contiguous slice sub-segments.

**Task:** Implement `compute_sliding_volume(prices: &[u64], volumes: &[u64], window_size: usize) -> Result<Vec<VolumeProfile>, MetricError>` that computes sliding window statistics.
1. Validate inputs: if `prices.len() != volumes.len()`, return `MetricError::MismatchedSliceLengths`. If `prices.is_empty()`, return `MetricError::EmptyData`. If `window_size == 0 || window_size > prices.len()`, return `MetricError::InvalidWindowSize`.
2. Compute the number of valid windows as `prices.len() - window_size + 1`.
3. Loop through window starting indices `for i in 0..num_windows`.
4. For each window, loop over sub-range `for j in i..(i + window_size)` to calculate `total_volume`, `price_vol_sum` (`(price * volume)` using `u128` to prevent numeric overflow), and `max_price`.
5. Calculate `vwap` as `price_vol_sum / total_volume` (as `f64`).
6. Construct and collect `VolumeProfile` structs into a `Vec`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq)]
> pub struct VolumeProfile {
>     pub start_idx: usize,
>     pub end_idx: usize,
>     pub total_volume: u64,
>     pub vwap: f64,
>     pub max_price: u64,
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum MetricError {
>     InvalidWindowSize,
>     MismatchedSliceLengths,
>     EmptyData,
> }
> 
> pub fn compute_sliding_volume(
>     prices: &[u64],
>     volumes: &[u64],
>     window_size: usize,
> ) -> Result<Vec<VolumeProfile>, MetricError> {
>     if prices.len() != volumes.len() {
>         return Err(MetricError::MismatchedSliceLengths);
>     }
>     if prices.is_empty() {
>         return Err(MetricError::EmptyData);
>     }
>     if window_size == 0 || window_size > prices.len() {
>         return Err(MetricError::InvalidWindowSize);
>     }
> 
>     let mut profiles = Vec::new();
>     let num_windows = prices.len() - window_size + 1;
> 
>     for i in 0..num_windows {
>         let window_end = i + window_size;
>         let mut total_vol: u64 = 0;
>         let mut price_vol_sum: u128 = 0;
>         let mut max_p: u64 = 0;
> 
>         for j in i..window_end {
>             let p = prices[j];
>             let v = volumes[j];
>             total_vol += v;
>             price_vol_sum += (p as u128) * (v as u128);
>             if p > max_p {
>                 max_p = p;
>             }
>         }
> 
>         let vwap = if total_vol > 0 {
>             (price_vol_sum as f64) / (total_vol as f64)
>         } else {
>             0.0
>         };
> 
>         profiles.push(VolumeProfile {
>             start_idx: i,
>             end_idx: window_end - 1,
>             total_volume: total_vol,
>             vwap,
>             max_price: max_p,
>         });
>     }
> 
>     Ok(profiles)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_sliding_volume_computation() {
>         let prices = vec![100, 102, 101, 105, 104];
>         let volumes = vec![10, 20, 15, 30, 25];
> 
>         let result = compute_sliding_volume(&prices, &volumes, 3);
>         assert!(result.is_ok());
>         let profiles = result.unwrap();
> 
>         assert_eq!(profiles.len(), 3);
>         
>         assert_eq!(profiles[0].start_idx, 0);
>         assert_eq!(profiles[0].end_idx, 2);
>         assert_eq!(profiles[0].total_volume, 45);
>         assert_eq!(profiles[0].max_price, 102);
>         assert!((profiles[0].vwap - 101.22222222222223).abs() < 1e-6);
> 
>         assert_eq!(profiles[1].max_price, 105);
>         assert_ne!(profiles[0].max_price, profiles[1].max_price);
>     }
> 
>     #[test]
>     fn test_metric_error_handling() {
>         let prices = vec![100, 102];
>         let volumes = vec![10];
> 
>         let result_mismatch = compute_sliding_volume(&prices, &volumes, 1);
>         assert_eq!(result_mismatch, Err(MetricError::MismatchedSliceLengths));
> 
>         let empty_prices: Vec<u64> = vec![];
>         let empty_vols: Vec<u64> = vec![];
>         let result_empty = compute_sliding_volume(&empty_prices, &empty_vols, 1);
>         assert_eq!(result_empty, Err(MetricError::EmptyData));
> 
>         let result_invalid_window = compute_sliding_volume(&vec![100, 200], &vec![10, 20], 5);
>         assert!(matches!(result_invalid_window, Err(MetricError::InvalidWindowSize)));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Nested Range Windowing**: Outer loop `for i in 0..num_windows` moves the frame window step by step across the dataset. The inner loop `for j in i..window_end` iterates over the indices belonging exclusively to window `i`. This double-range pattern avoids manual allocation of slice sub-vectors during aggregation.
> 2. **Numeric Safety and Type Widening**: Accumulating financial volume products (`price * volume`) can quickly overflow standard 64-bit unsigned integers. Casting factors to `u128` during inner range summation (`(p as u128) * (v as u128)`) guarantees overflow-safe accumulation before converting to `f64` floating point for VWAP calculation.
> 3. **Boundary Invariants**: Defining `num_windows = prices.len() - window_size + 1` establishes the exact upper bound for valid window start indices. The slice length checks prevent underflow during `prices.len() - window_size`.
> 4. **Float Precision & Equivalence**: Unit tests test floating-point outcomes like `vwap` using delta tolerance (`(a - b).abs() < 1e-6`) rather than strict equality, adhering to IEEE-754 precision norms.
> 
---

### Exercise 3: Low-Level Hardware MMIO Bitmask Event Logger

**Scenario:** Embedded drivers and industrial microcontroller runtimes scan arrays of 32-bit Memory-Mapped I/O (MMIO) status registers to detect hardware signal interrupts (e.g. sensor triggers or fault flags). Hardware state is represented as dense bitfields. Scanners must iterate over register indices and nested bit ranges (`for bit_pos in 0..32u8`) to extract active interrupt events and calculate global hardware bit offsets.

**Task:** Write a function `scan_hardware_events(registers: &[u32], trigger_mask: u32) -> Result<Vec<HardwareEvent>, ScanError>` that performs nested bit scanning.
1. Return `ScanError::EmptyRegisterSet` if `registers` is empty, and `ScanError::InvalidMask` if `trigger_mask == 0`.
2. Loop over register indices `for reg_idx in 0..registers.len()`.
3. Mask register value with `trigger_mask`. If no monitored bits are set (`val & trigger_mask == 0`), skip to next register.
4. Loop through bit positions using range `for bit_pos in 0..32u8`.
5. Check if bit is set (`(active_bits & (1 << bit_pos)) != 0`). If set, derive `global_event_id = (reg_idx as u32) * 32 + (bit_pos as u32)` and append a `HardwareEvent` instance.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq)]
> pub struct HardwareEvent {
>     pub register_index: usize,
>     pub bit_position: u8,
>     pub global_event_id: u32,
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum ScanError {
>     EmptyRegisterSet,
>     InvalidMask,
> }
> 
> pub fn scan_hardware_events(
>     registers: &[u32],
>     trigger_mask: u32,
> ) -> Result<Vec<HardwareEvent>, ScanError> {
>     if registers.is_empty() {
>         return Err(ScanError::EmptyRegisterSet);
>     }
>     if trigger_mask == 0 {
>         return Err(ScanError::InvalidMask);
>     }
> 
>     let mut events = Vec::new();
> 
>     for reg_idx in 0..registers.len() {
>         let val = registers[reg_idx];
>         let active_bits = val & trigger_mask;
>         if active_bits == 0 {
>             continue;
>         }
> 
>         for bit_pos in 0..32u8 {
>             if (active_bits & (1 << bit_pos)) != 0 {
>                 let global_event_id = (reg_idx as u32) * 32 + (bit_pos as u32);
>                 events.push(HardwareEvent {
>                     register_index: reg_idx,
>                     bit_position: bit_pos,
>                     global_event_id,
>                 });
>             }
>         }
>     }
> 
>     Ok(events)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_hardware_event_scanning() {
>         let registers = vec![0b0000_0101, 0b0000_0010];
>         let mask = 0b0000_0111;
> 
>         let result = scan_hardware_events(&registers, mask);
>         assert!(result.is_ok());
>         let events = result.unwrap();
> 
>         assert_eq!(events.len(), 3);
> 
>         assert_eq!(events[0].register_index, 0);
>         assert_eq!(events[0].bit_position, 0);
>         assert_eq!(events[0].global_event_id, 0);
> 
>         assert_eq!(events[1].register_index, 0);
>         assert_eq!(events[1].bit_position, 2);
>         assert_eq!(events[1].global_event_id, 2);
> 
>         assert_eq!(events[2].register_index, 1);
>         assert_eq!(events[2].bit_position, 1);
>         assert_eq!(events[2].global_event_id, 33);
>         assert_ne!(events[0].global_event_id, events[2].global_event_id);
>     }
> 
>     #[test]
>     fn test_masking_and_errors() {
>         let registers = vec![0b1111];
>         let invalid_mask = 0;
>         let result_invalid = scan_hardware_events(&registers, invalid_mask);
>         assert_eq!(result_invalid, Err(ScanError::InvalidMask));
> 
>         let empty_regs: Vec<u32> = vec![];
>         let result_empty = scan_hardware_events(&empty_regs, 0b1);
>         assert!(matches!(result_empty, Err(ScanError::EmptyRegisterSet)));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Bit Range Iteration (`0..32u8`)**: Primitive integer types support range iteration. The loop `for bit_pos in 0..32u8` generates bit shift offsets from 0 up to 31 inclusive without memory allocations or iterator heap overhead.
> 2. **Bitwise Masking & Early Continuation**: Fast register pre-filtering (`let active_bits = val & trigger_mask; if active_bits == 0 { continue; }`) skips 32-iteration bit-scan passes on register words containing no active event triggers, minimizing CPU cycles in hot loops.
> 3. **Global ID Arithmetic**: Global identifier calculation `(reg_idx as u32) * 32 + (bit_pos as u32)` maps two-dimensional register-bit coordinates into a single linear domain safely, avoiding bit-overflow through unsigned type promotion (`u32`).
> 4. **Edge Cases**: Non-responsive register sets (`empty`) or zero-masks are guarded before starting range loops, preventing runtime panic or redundant loop initialization.
> 
---

## 6. Related Terms


- [Iterator](iterator.md) — The underlying mechanic that powers the `in` part of a `for` loop (how it knows how to get the "next" item).
- [`while`](while.md) — The conditional loop, which is much more prone to off-by-one errors than `for`.
- [`loop`](loop.md) — Related concept: `loop`.
- [`IntoIterator`](../level_06/intoiterator.md) — Related concept: `IntoIterator`.

---

## 7. Key Takeaways

- Rust does not have C-style `for` loops (e.g., `for(i=0; i<10; i++)`).
- The syntax is always `for item in collection_or_range { ... }`.
- The standard Range syntax `start..end` is **exclusive** of the end value (e.g., `1..4` produces 1, 2, 3).
- Use `start..=end` for an **inclusive** range (e.g., `1..=3` produces 1, 2, 3).
- The `for` loop is the safest and most idiomatic way to loop through arrays or numbers in Rust because it prevents out-of-bounds errors.
