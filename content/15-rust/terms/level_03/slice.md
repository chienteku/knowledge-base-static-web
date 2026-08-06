# Slice (`&[T]`, `&str`)

> **Level 3 — Ownership & Borrowing**
> A reference to a contiguous subsequence of a collection, without ownership.

---

## 1. Prerequisites


- [Borrowing (`&`)](borrowing.md) — Slices are fundamentally just a special type of Borrow.
- [`Vec<T>`](../level_02/vec_t.md) — The most common collection that we slice into.
- [String vs &str](../level_01/string_vs_&str.md) — We previously learned that `&str` is a string reference. We can now reveal its true name: a **String Slice**.

---

## 2. Term Category

**Rust-specific (the safety integration)**: Slices exist in languages like Python (`my_list[1:4]`) and Go. However, in Rust, slices are deeply integrated into the Borrow Checker. The compiler guarantees that the underlying collection cannot be mutated or destroyed while a slice is actively looking at it.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Imagine you have a `Vec` of 1,000,000 temperatures, and you want to write a function that calculates the average of just the first 10 temperatures. 

If you create a brand new `Vec` and copy those 10 temperatures into it, you are wasting CPU cycles and Heap memory. What you really want is to pass the function a "window" that just looks at the original 10 items. 

This is a **Slice**. A slice is a read-only reference to a *slice* of a larger collection. Because it is just a reference (`&`), it does not take Ownership. It requires zero memory allocation, making it blazing fast.

### (2) Reality Metaphor

Imagine a massive encyclopedia sitting on a table in the library (a `String` or `Vec`).

A standard borrow (`&String`) is giving your friend the exact coordinates to the table so they can read the entire encyclopedia. 

A **Slice** (`&str` or `&[T]`) is giving your friend the coordinates to the table, but handing them a pair of blinders that only allows them to see Pages 45 to 50. They do not *own* the book, and they haven't made a physical photocopy of the pages. They are just looking at a specific window of the original book.

### (3) Rust Code Examples

#### Short Snippet (Creating Slices)
You create a slice using the `&` symbol combined with a range `[start..end]`. The `start` is inclusive, and the `end` is exclusive.
```rust
fn main() {
    let my_vec = vec![10, 20, 30, 40, 50];
    
    // Create a slice containing [20, 30, 40]
    let middle_slice: &[i32] = &my_vec[1..4];
    
    let message = String::from("Hello World");
    
    // Create a String Slice containing "Hello"
    let word_slice: &str = &message[0..5];
    
    println!("{:?}", middle_slice);
    println!("{}", word_slice);
}
```

#### Fuller Example (The Borrow Checker's Protection)
Slices are protected by the [Borrow Checker](../level_03/borrow_checker.md). If you create a slice, the compiler will aggressively prevent anyone from modifying the original collection until the slice is done being used.

```rust
fn main() {
    let mut sentence = String::from("Rust is fast");
    
    // We create a slice of the first word
    let first_word = &sentence[0..4]; 
    
    // DANGER: We try to clear the original String!
    // sentence.clear(); // COMPILER ERROR! 
    
    // Why did the compiler stop us? Because if `sentence` was cleared, 
    // `first_word` would be looking at deleted memory (a Dangling Reference)!
    
    println!("The first word is: {}", first_word);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Slice Scoping and Lifecycle Rules

**The mistake:** Assuming Slice instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("slice_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("slice_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Slice State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Slice through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Slice Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Slice instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Zero-Copy Binary Telemetry Stream Parser

**Scenario:** In high-frequency trading and IoT telemetry ingest nodes, incoming packet streams are processed under strict sub-microsecond latency constraints. Creating owned heap objects (`Vec<u8>` or `String`) for every incoming packet payload degrades throughput due to memory allocation overhead and pressure on memory allocators.

**Problem Statement:** Design a zero-copy binary streaming packet parser `BinaryPacketParser` that decodes frame headers and extracts payload byte slices directly from an unparsed stream buffer `&'a [u8]`.

Each binary frame layout consists of:
- Header Magic: 2 bytes (`[0xAA, 0xBB]`)
- Sequence ID: 4 bytes big-endian (`u32`)
- Payload Length ($N$): 2 bytes big-endian (`u16`)
- Payload Slice: $N$ bytes (`&'a [u8]`)
- Checksum: 2 bytes big-endian (`u16`) (sum of payload bytes mod 65536)
- Trailer Magic: 2 bytes (`[0xCC, 0xDD]`)

Implement `BinaryPacketParser::parse_frame<'a>(input: &'a [u8]) -> Result<(ParsedFrame<'a>, &'a [u8]), ParseError>`. The function must extract the frame without allocating payload copies, validate all magic markers and checksums, and return both the borrowed frame `ParsedFrame<'a>` and the remaining unparsed byte slice `&'a [u8]`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq)]
> pub enum ParseError {
>     TruncatedHeader,
>     InvalidHeaderMagic,
>     TruncatedPayload,
>     ChecksumMismatch { expected: u16, actual: u16 },
>     TruncatedTrailer,
>     InvalidTrailerMagic,
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct ParsedFrame<'a> {
>     pub sequence_id: u32,
>     pub payload: &'a [u8],
>     pub checksum: u16,
> }
> 
> pub struct BinaryPacketParser;
> 
> impl BinaryPacketParser {
>     pub fn parse_frame<'a>(input: &'a [u8]) -> Result<(ParsedFrame<'a>, &'a [u8]), ParseError> {
>         // 1. Verify minimum header length: 2 (magic) + 4 (seq_id) + 2 (payload_len) = 8 bytes
>         if input.len() < 8 {
>             return Err(ParseError::TruncatedHeader);
>         }
> 
>         if &input[0..2] != &[0xAA, 0xBB] {
>             return Err(ParseError::InvalidHeaderMagic);
>         }
> 
>         let sequence_id = u32::from_be_bytes(input[2..6].try_into().unwrap());
>         let payload_len = u16::from_be_bytes(input[6..8].try_into().unwrap()) as usize;
> 
>         let rem = &input[8..];
>         if rem.len() < payload_len {
>             return Err(ParseError::TruncatedPayload);
>         }
> 
>         let (payload, rem) = rem.split_at(payload_len);
> 
>         // Sum all payload bytes modulo 65536
>         let computed_checksum: u16 = payload
>             .iter()
>             .fold(0u16, |acc, &b| acc.wrapping_add(b as u16));
> 
>         if rem.len() < 4 {
>             return Err(ParseError::TruncatedTrailer);
>         }
> 
>         let checksum = u16::from_be_bytes(rem[0..2].try_into().unwrap());
>         if checksum != computed_checksum {
>             return Err(ParseError::ChecksumMismatch {
>                 expected: computed_checksum,
>                 actual: checksum,
>             });
>         }
> 
>         if &rem[2..4] != &[0xCC, 0xDD] {
>             return Err(ParseError::InvalidTrailerMagic);
>         }
> 
>         let remaining_stream = &rem[4..];
>         Ok((
>             ParsedFrame {
>                 sequence_id,
>                 payload,
>                 checksum,
>             },
>             remaining_stream,
>         ))
>     }
> }
> 
> fn main() {
>     let stream_buffer = vec![
>         0xAA, 0xBB,             // Magic header
>         0x00, 0x00, 0x00, 0x2A, // Sequence ID = 42
>         0x00, 0x04,             // Payload length = 4
>         0xDE, 0xAD, 0xBE, 0xEF, // Payload bytes
>         0x03, 0x98,             // Checksum = 0xDE + 0xAD + 0xBE + 0xEF = 0x398 = 920
>         0xCC, 0xDD,             // Magic trailer
>         0xFF, 0xFE,             // Unparsed trailing stream bytes
>     ];
> 
>     match BinaryPacketParser::parse_frame(&stream_buffer) {
>         Ok((frame, remainder)) => {
>             println!(
>                 "Successfully parsed frame #{}: payload len = {}, unparsed bytes remaining = {}",
>                 frame.sequence_id,
>                 frame.payload.len(),
>                 remainder.len()
>             );
>         }
>         Err(err) => println!("Parsing failed with error: {:?}", err),
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_valid_packet_parsing() {
>         let buffer = [
>             0xAA, 0xBB,
>             0x00, 0x00, 0x00, 0x01,
>             0x00, 0x03,
>             10, 20, 30,
>             0x00, 60,
>             0xCC, 0xDD,
>             100, 101,
>         ];
> 
>         let res = BinaryPacketParser::parse_frame(&buffer);
>         assert!(res.is_ok());
> 
>         let (frame, remainder) = res.unwrap();
>         assert_eq!(frame.sequence_id, 1);
>         assert_eq!(frame.payload, &[10, 20, 30]);
>         assert_eq!(frame.checksum, 60);
>         assert_eq!(remainder, &[100, 101]);
>         assert_ne!(frame.payload, &[10, 20, 31]);
>     }
> 
>     #[test]
>     fn test_truncated_header_and_invalid_magic() {
>         let short_buffer = [0xAA, 0xBB, 0x00];
>         let res_short = BinaryPacketParser::parse_frame(&short_buffer);
>         assert!(matches!(res_short, Err(ParseError::TruncatedHeader)));
> 
>         let bad_magic = [0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00];
>         let res_magic = BinaryPacketParser::parse_frame(&bad_magic);
>         assert!(matches!(res_magic, Err(ParseError::InvalidHeaderMagic)));
>     }
> 
>     #[test]
>     fn test_checksum_mismatch() {
>         let bad_checksum_buffer = [
>             0xAA, 0xBB,
>             0x00, 0x00, 0x00, 0x01,
>             0x00, 0x02,
>             50, 50,
>             0x00, 99, // Computed sum is 100, actual provided checksum is 99
>             0xCC, 0xDD,
>         ];
>         let res = BinaryPacketParser::parse_frame(&bad_checksum_buffer);
>         assert!(matches!(
>             res,
>             Err(ParseError::ChecksumMismatch { expected: 100, actual: 99 })
>         ));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Slice Memory Representation & Fat Pointers**:
>    A byte slice `&[u8]` is represented in memory as a 2-word fat pointer: a raw pointer (`*const u8`) to the contiguous start address and a `usize` length count (`len`). Slicing using ranges (e.g., `&input[0..2]`) or `split_at(payload_len)` simply performs arithmetic on the pointer offset and updates the length metadata without allocating heap memory or copying buffer bytes.
> 
> 2. **Lifetime Bounds (`'a`) & Ownership**:
>    The lifetime parameter `'a` in `parse_frame<'a>(input: &'a [u8]) -> Result<(ParsedFrame<'a>, &'a [u8]), ParseError>` ties the lifetime of `ParsedFrame.payload` directly to the input slice `input`. This guarantees that the caller cannot drop or mutate the source byte buffer while holding onto a `ParsedFrame`.
> 
> 3. **Disjoint Sub-Slicing via `split_at`**:
>    The method `rem.split_at(payload_len)` takes a slice reference `&'a [u8]` and splits it at an index boundary into two non-overlapping immutable slices `(&'a [u8], &'a [u8])`. The borrow checker allows returning both slices concurrently because immutability allows arbitrary aliasing.
> 
> 4. **Boundary Checks & Out-of-Bounds Protection**:
>    Index ranges `input[0..2]` and `input[2..6]` perform runtime bounds checks, preventing buffer overrun attacks or wild pointer dereferences. Attempting to slice past `input.len()` triggers a deterministic panic in debug and release builds, whereas early slice length checks (`input.len() < 8`) yield structured `ParseError` variants gracefully.
> 
---

### Exercise 2: Parallel Audio Signal In-Place Processing with Disjoint Mutable Slices

**Scenario:** Digital audio workstations (DAWs) and streaming media encoders require applying volume gains and DSP equalizer transforms across millions of audio PCM samples per second. Mutating a raw sample vector sequentially in a single thread creates performance bottlenecks on multi-core systems.

**Problem Statement:** Rust enforces the strict aliasing XOR mutability rule (`&T` shared XOR `&mut T` exclusive). You cannot spawn multiple OS threads that take `&mut` references to the same `Vec<f32>`. However, non-overlapping segments of a mutable slice can be safely mutated in parallel across threads.

Design a chunked parallel DSP gain scaling function `apply_gain_parallel(buffer: &mut [f32], gain: f32, chunk_size: usize)` using standard library scoped threads (`std::thread::scope`) and slice iteration (`chunks_mut`). Divide the mutable slice `&mut [f32]` into non-overlapping `&mut [f32]` sub-slices, scaling each sample by `gain` and clamping result values within `[-1.0, 1.0]` in parallel without allocating scratch buffers.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::thread;
> 
> pub fn apply_gain_parallel(buffer: &mut [f32], gain: f32, chunk_size: usize) {
>     if chunk_size == 0 || buffer.is_empty() {
>         return;
>     }
> 
>     thread::scope(|s| {
>         for chunk in buffer.chunks_mut(chunk_size) {
>             s.spawn(move || {
>                 for sample in chunk.iter_mut() {
>                     let scaled = *sample * gain;
>                     // Clamp audio output between -1.0 and 1.0 to prevent clipping distortion
>                     *sample = scaled.clamp(-1.0, 1.0);
>                 }
>             });
>         }
>     });
> }
> 
> fn main() {
>     let mut audio_buffer = vec![0.1, 0.5, -0.8, 0.9, -1.2, 0.4];
>     let gain = 1.5;
>     apply_gain_parallel(&mut audio_buffer, gain, 2);
>     println!("Processed audio buffer: {:?}", audio_buffer);
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_parallel_gain_application() {
>         let mut samples = vec![0.2, -0.4, 0.8, -0.9];
>         apply_gain_parallel(&mut samples, 1.5, 2);
> 
>         assert_eq!(samples[0], 0.3);
>         assert_eq!(samples[1], -0.6);
>         assert_eq!(samples[2], 1.0); // Clamped from 1.2
>         assert_eq!(samples[3], -1.0); // Clamped from -1.35
>         assert_ne!(samples[0], 0.2);
>     }
> 
>     #[test]
>     fn test_empty_and_zero_chunk() {
>         let mut empty: Vec<f32> = vec![];
>         apply_gain_parallel(&mut empty, 2.0, 4);
>         assert!(empty.is_empty());
> 
>         let mut data = vec![0.5, 0.5];
>         apply_gain_parallel(&mut data, 2.0, 0); // Zero chunk size handled gracefully
>         assert_eq!(data, vec![0.5, 0.5]);
>     }
> 
>     #[test]
>     fn test_single_element_chunks() {
>         let mut data = vec![0.1, -0.2];
>         apply_gain_parallel(&mut data, 2.0, 1);
>         assert_eq!(data[0], 0.2);
>         assert_eq!(data[1], -0.4);
>         assert!(matches!(data.first(), Some(&0.2)));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Disjoint Mutable Slices (`chunks_mut`)**:
>    `buffer.chunks_mut(chunk_size)` leverages unsafe raw pointer offset calculations internally (`split_at_mut`) to split a single `&mut [T]` into non-overlapping sub-slices `&mut [T]`. Because each sub-slice points to a completely distinct, disjoint region of heap memory, Rust guarantees that no two threads can write to the same element address.
> 
> 2. **Aliasing XOR Mutability Invariant**:
>    The Rust borrow checker enforces that mutable references `&mut T` cannot alias. `chunks_mut` provides a safe interface over disjoint regions, satisfying the compiler that each thread obtains exclusive mutable access to its assigned chunk without alias overlap.
> 
> 3. **Thread Safety via `Send` & `thread::scope`**:
>    A mutable slice `&mut [T]` implements `Send` if `T: Send`. By utilizing standard `std::thread::scope`, threads spawned inside the closure are guaranteed to join before `thread::scope` returns. This lifetime guarantee allows worker threads to safely borrow sub-slices `&'a mut [f32]` without requiring `'static` lifetime bounds or heap allocation like `Arc<Mutex<Vec<f32>>>`.
> 
> 4. **Edge Case Safety**:
>    Passing `chunk_size == 0` would cause iterator panics in `chunks_mut`. Guarding against zero length or zero chunk size explicitly prevents runtime panics and returns early.
> 
---

### Exercise 3: Zero-Copy Web Server Structured Log Tokenizer

**Scenario:** High-throughput HTTP server access log parsers ingest gigabytes of access logs formatted in NGINX or Common Log Format. Converting raw string lines into owned structs with heap-allocated `String` fields produces millions of small allocations, overwhelming system allocators and causing garbage collector pauses in managed runtimes.

**Problem Statement:** Design a zero-copy string scanner `LogEntryScanner` that parses raw HTTP log line strings `&'a str` into structured `LogRecord<'a>` instances whose fields borrow string sub-slices `&'a str` directly from the original input string.

The log format follows:
`<IP> - [<TIMESTAMP>] "<METHOD> <PATH> <PROTOCOL>" <STATUS> <BYTES>`

Example input line:
`192.168.1.10 - [31/Jul/2026:18:26:00] "GET /api/v1/telemetry HTTP/1.1" 200 4096`

Implement `LogEntryScanner::parse<'a>(line: &'a str) -> Result<LogRecord<'a>, LogParseError>` extracting `ip: &'a str`, `timestamp: &'a str`, `method: &'a str`, `path: &'a str`, `status_code: u16`, and `body_bytes: u64` without heap allocations.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq)]
> pub enum LogParseError {
>     InvalidFormat,
>     MissingBracket,
>     MissingQuote,
>     InvalidStatusCode,
>     InvalidBytes,
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct LogRecord<'a> {
>     pub ip: &'a str,
>     pub timestamp: &'a str,
>     pub method: &'a str,
>     pub path: &'a str,
>     pub status_code: u16,
>     pub body_bytes: u64,
> }
> 
> pub struct LogEntryScanner;
> 
> impl LogEntryScanner {
>     pub fn parse<'a>(line: &'a str) -> Result<LogRecord<'a>, LogParseError> {
>         let line = line.trim();
> 
>         // 1. Extract IP address (up to first space)
>         let space_idx = line.find(' ').ok_or(LogParseError::InvalidFormat)?;
>         let ip = &line[..space_idx];
> 
>         let remainder = line[space_idx..].trim_start();
> 
>         // 2. Extract Timestamp enclosed in '[' and ']'
>         let open_bracket = remainder.find('[').ok_or(LogParseError::MissingBracket)?;
>         let close_bracket = remainder.find(']').ok_or(LogParseError::MissingBracket)?;
>         if close_bracket <= open_bracket {
>             return Err(LogParseError::MissingBracket);
>         }
>         let timestamp = &remainder[open_bracket + 1..close_bracket];
> 
>         let remainder = remainder[close_bracket + 1..].trim_start();
> 
>         // 3. Extract Request string enclosed in double quotes '"'
>         let open_quote = remainder.find('"').ok_or(LogParseError::MissingQuote)?;
>         let rest_quote = &remainder[open_quote + 1..];
>         let close_quote = rest_quote.find('"').ok_or(LogParseError::MissingQuote)?;
>         let request_str = &rest_quote[..close_quote];
> 
>         // Split request_str into method and path sub-slices
>         let mut req_parts = request_str.split_whitespace();
>         let method = req_parts.next().ok_or(LogParseError::InvalidFormat)?;
>         let path = req_parts.next().ok_or(LogParseError::InvalidFormat)?;
> 
>         let remainder = rest_quote[close_quote + 1..].trim_start();
> 
>         // 4. Extract Status Code and Body Bytes
>         let mut status_parts = remainder.split_whitespace();
>         let status_str = status_parts.next().ok_or(LogParseError::InvalidFormat)?;
>         let bytes_str = status_parts.next().ok_or(LogParseError::InvalidFormat)?;
> 
>         let status_code = status_str
>             .parse::<u16>()
>             .map_err(|_| LogParseError::InvalidStatusCode)?;
>         let body_bytes = bytes_str
>             .parse::<u64>()
>             .map_err(|_| LogParseError::InvalidBytes)?;
> 
>         Ok(LogRecord {
>             ip,
>             timestamp,
>             method,
>             path,
>             status_code,
>             body_bytes,
>         })
>     }
> }
> 
> fn main() {
>     let raw_log = r#"192.168.1.10 - [31/Jul/2026:18:26:00 +0000] "GET /api/v1/telemetry HTTP/1.1" 200 4096"#;
>     match LogEntryScanner::parse(raw_log) {
>         Ok(record) => {
>             println!("Parsed Log Entry:");
>             println!("  IP: {}", record.ip);
>             println!("  Timestamp: {}", record.timestamp);
>             println!("  Request: {} {}", record.method, record.path);
>             println!("  Status: {}, Bytes: {}", record.status_code, record.body_bytes);
>         }
>         Err(e) => println!("Failed to parse log line: {:?}", e),
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_valid_log_parsing() {
>         let log = r#"10.0.0.1 - [12/May/2026:08:00:00] "POST /checkout HTTP/1.1" 201 1280"#;
>         let result = LogEntryScanner::parse(log);
> 
>         assert!(result.is_ok());
>         let record = result.unwrap();
> 
>         assert_eq!(record.ip, "10.0.0.1");
>         assert_eq!(record.timestamp, "12/May/2026:08:00:00");
>         assert_eq!(record.method, "POST");
>         assert_eq!(record.path, "/checkout");
>         assert_eq!(record.status_code, 201);
>         assert_eq!(record.body_bytes, 1280);
>         assert_ne!(record.status_code, 200);
>     }
> 
>     #[test]
>     fn test_malformed_bracket() {
>         let bad_log = r#"10.0.0.1 - 12/May/2026:08:00:00 "GET / HTTP/1.1" 200 100"#;
>         let result = LogEntryScanner::parse(bad_log);
>         assert!(matches!(result, Err(LogParseError::MissingBracket)));
>     }
> 
>     #[test]
>     fn test_malformed_quote() {
>         let bad_log = r#"10.0.0.1 - [12/May/2026:08:00:00] GET / HTTP/1.1 200 100"#;
>         let result = LogEntryScanner::parse(bad_log);
>         assert!(matches!(result, Err(LogParseError::MissingQuote)));
>     }
> 
>     #[test]
>     fn test_invalid_status_code() {
>         let bad_log = r#"10.0.0.1 - [12/May/2026:08:00:00] "GET / HTTP/1.1" INVALID 100"#;
>         let result = LogEntryScanner::parse(bad_log);
>         assert!(matches!(result, Err(LogParseError::InvalidStatusCode)));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **String Slice (`&str`) Invariants & Memory Layout**:
>    A string slice `&str` is a byte slice `&[u8]` guaranteed by the Rust compiler to contain valid UTF-8 sequence data. Its layout in memory is a 2-word fat pointer comprising a starting memory address pointer and byte length. Sub-slicing a string slice (e.g. `&line[..space_idx]`) returns another `&str` referencing the same memory buffer without copying character strings.
> 
> 2. **UTF-8 Char Boundary Safety**:
>    Indexing a `&str` with byte offsets (`&s[start..end]`) requires that `start` and `end` fall on UTF-8 code point boundaries. Standard slice operations such as `line.find(' ')`, `line.split_whitespace()`, and `trim_start()` calculate boundary byte indices safely on valid UTF-8 code points, guaranteeing memory safety without panics.
> 
> 3. **Lifetime Elision & Propagation (`'a`)**:
>    `LogRecord<'a>` explicitly propagates lifetime `'a` from the raw line string slice input parameter `line: &'a str`. Consequently, all borrowed string sub-fields (`ip`, `timestamp`, `method`, `path`) are tied to the scope of the raw log string buffer, ensuring zero lifetime leakage or dangling reference risks.
> 
---

## 6. Related Terms


- [Borrowing (`&`)](borrowing.md) — The fundamental mechanism that makes Slices memory-safe.
- [Borrow Checker](borrow_checker.md) — The compiler cop that ensures you don't mutate the original collection while a slice is actively looking at it.
- [String vs &str](../level_01/string_vs_&str.md) — Related concept: String vs &str.

---

## 7. Key Takeaways

- A **Slice** (`&[T]` or `&str`) allows you to reference a contiguous sequence of elements in a collection rather than the whole collection.
- Because it is just a reference (`&`), it has **no Ownership** and performs zero memory allocations.
- A string slice is written as `&str`. An array/vector slice is written as `&[T]`.
- Slices are fiercely protected by the Borrow Checker. You cannot mutate or drop the original collection while a slice is actively looking at it!
