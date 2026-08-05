# Scalar Types

> **Level 1 — Foundations**
> Primitive types: integers (`i32`, `u64`…), floats (`f32`, `f64`), `bool`, and `char`.

---

## 1. Prerequisites


- [Variable](variable.md) — A named binding used to store data.

---

## 2. Term Category

**Rust-nonspecific**: A general programming concept (primitive data types), though Rust's specific integer naming convention (`i32`, `u8`) is distinct.

---

## 3. Explanation

### (1) Design Motivation — "Why does this exist in programming languages?"

At the hardware level, everything in a computer is just a giant sequence of 1s and 0s. The CPU doesn't inherently know if `01000001` means the number 65, the letter 'A', or a pixel color. **Scalar types** exist to give meaning to those bits. They tell the compiler exactly how much memory to allocate for a single value and how to interpret it.

In older languages like C, a type like `int` might be 16 bits on one machine and 32 bits on another, leading to portability bugs. Rust takes a strict, deterministic approach. Rust's scalar types explicitly declare their memory size and behavior. For example, `i32` is always a 32-bit signed integer everywhere. This guarantees your code behaves the exact same way on a tiny microcontroller as it does on a massive cloud server.

There are four primary scalar types in Rust:
1. **Integers**: Whole numbers (signed like `i32` can be negative; unsigned like `u8` are strictly positive).
2. **Floating-point numbers**: Numbers with decimals (`f32`, `f64`).
3. **Booleans**: True or false (`bool`).
4. **Characters**: A single letter, number, or emoji (`char`), which is exactly 4 bytes in Rust to support all of Unicode.

### (2) Reality Metaphor

Think of scalar types as the **atomic elements of the periodic table** (Hydrogen, Oxygen, Iron). 
They represent a single, indivisible concept. A block of iron is just iron. You can't break it down into simpler materials. Later on, you will combine these atomic elements to create complex molecules (Compound Types) like water or steel, but the universe is fundamentally built on these basic, single-value elements.

### (3) Rust Code Examples

#### Short Snippet
```rust
let integer: i32 = -42;         // Signed 32-bit integer
let float: f64 = 3.14159;       // 64-bit floating point
let is_active: bool = true;     // Boolean
let initial: char = 'R';        // Character (single quotes)
```

#### Fuller Example
```rust
fn main() {
    // If you don't specify the type, Rust defaults to i32 for integers 
    // and f64 for floats, because they are fast on modern CPUs.
    let speed_limit = 65; // Inferred as i32
    let exact_temp = 98.6; // Inferred as f64

    // u8 is an "unsigned 8-bit integer". It holds values from 0 to 255.
    // It is perfect for ages, RGB colors, or raw bytes.
    let age: u8 = 25;

    // Characters use single quotes. Strings use double quotes.
    // Rust chars support all Unicode, including emojis!
    let status_emoji: char = '✅';
    let is_admin = false;

    if !is_admin {
        println!("User is {} years old. Status: {}", age, status_emoji);
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Assigning a negative number to an unsigned integer

**The mistake:** Trying to store a negative value in a `u` (unsigned) type.

**Why it's wrong:** "Unsigned" means the number does not have a +/- sign; it is strictly positive (starting from 0). If you try to give it a negative number, the compiler will reject it to prevent memory corruption.

*Incorrect:*
```rust
let balance: u32 = -100; // ERROR: cannot apply unary operator `-` to type `u32`
```

*Fix:*
```rust
let balance: i32 = -100; // Use an 'i' (integer) type which is signed.
```

### Mistake 2: Mixing scalar types in math operations

**The mistake:** Trying to add or multiply an integer with a float, or an `i32` with an `i64`.

**Why it's wrong:** Unlike JavaScript or Python, Rust refuses to implicitly convert (coerce) your data types. If you mix types, precision could be lost. You must explicitly convert one type to another using the `as` keyword.

*Incorrect:*
```rust
let apples = 5;       // i32
let weight = 2.5;     // f64
let total = apples * weight; // ERROR: cannot multiply `i32` by `f64`
```

*Fix:*
```rust
let apples = 5;
let weight = 2.5;
// Explicitly cast `apples` to an f64 before multiplying
let total = (apples as f64) * weight; 
```

---

### Mistake 3: Concurrent Access to Scalar Types Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Scalar Types instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Low-Level Binary IoT Telemetry Packet Decoder

**Scenario:**
You are building an embedded telemetry ingestion node that receives 8-byte frames over a serial link. Bandwidth is severely constrained, so binary fields are densely packed into primitive Rust scalar types (`u8`, `u16`, `i16`, `f64`, `bool`).

**Requirements:**
1. Write a parser function `parse_telemetry_packet(bytes: &[u8; 8]) -> Result<TelemetryFrame, PacketError>`.
2. Packet binary format (8 bytes, Big-Endian):
   - **Bytes 0..1**: Magic Header (`0xAA55` as `u16`). Return `PacketError::InvalidHeader(u16)` if mismatched.
   - **Byte 2**: Bitfield Flags (`u8`):
     - Bit 0 (`0x01`): `is_active` (`bool`).
     - Bits 1..3 (`0x0E`): `battery_level` integer (`0..=7`). Shift right by 1.
     - Bit 4 (`0x10`): `sensor_fault` (`bool`).
     - Bits 5..7 (`0xE0`): Reserved. Must be `0`. Return `PacketError::InvalidFlags(u8)` if set.
   - **Bytes 3..4**: Sensor Device ID (`u16`).
   - **Bytes 5..6**: Scaled Temperature (`i16`). Represents hundredths of a degree Celsius (e.g. `2150` = `21.50` °C, `-1025` = `-10.25` °C). Convert to `f64` degree Celsius.
   - **Byte 7**: XOR Checksum over bytes `0..=6`. Return `PacketError::ChecksumMismatch { expected, actual }` if invalid.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq)]
> pub struct TelemetryFrame {
>     pub is_active: bool,
>     pub battery_level: u8,
>     pub sensor_fault: bool,
>     pub sensor_id: u16,
>     pub temperature_celsius: f64,
> }
> 
> #[derive(Debug, PartialEq)]
> pub enum PacketError {
>     InvalidHeader(u16),
>     InvalidFlags(u8),
>     ChecksumMismatch { expected: u8, actual: u8 },
> }
> 
> pub fn parse_telemetry_packet(bytes: &[u8; 8]) -> Result<TelemetryFrame, PacketError> {
>     // Compute XOR checksum across header and payload bytes (0..7)
>     let mut computed_checksum: u8 = 0;
>     for &b in &bytes[0..7] {
>         computed_checksum ^= b;
>     }
>     let actual_checksum = bytes[7];
>     if computed_checksum != actual_checksum {
>         return Err(PacketError::ChecksumMismatch {
>             expected: computed_checksum,
>             actual: actual_checksum,
>         });
>     }
> 
>     // Validate magic header
>     let magic = u16::from_be_bytes([bytes[0], bytes[1]]);
>     if magic != 0xAA55 {
>         return Err(PacketError::InvalidHeader(magic));
>     }
> 
>     // Parse status bitfield flags
>     let flags = bytes[2];
>     if (flags & 0xE0) != 0 {
>         return Err(PacketError::InvalidFlags(flags));
>     }
>     let is_active = (flags & 0x01) != 0;
>     let battery_level = (flags & 0x0E) >> 1;
>     let sensor_fault = (flags & 0x10) != 0;
> 
>     // Extract device ID and scaled temperature payload
>     let sensor_id = u16::from_be_bytes([bytes[3], bytes[4]]);
>     let raw_temp = i16::from_be_bytes([bytes[5], bytes[6]]);
>     let temperature_celsius = (raw_temp as f64) / 100.0;
> 
>     Ok(TelemetryFrame {
>         is_active,
>         battery_level,
>         sensor_fault,
>         sensor_id,
>         temperature_celsius,
>     })
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_valid_packet_parsing() {
>         // Magic: 0xAA55, Flags: 0x0B (active, batt 5), ID: 1024, Temp: 2150 (21.50C)
>         let frame_bytes: [u8; 8] = [0xAA, 0x55, 0x0B, 0x04, 0x00, 0x08, 0x66, 0x90];
>         let res = parse_telemetry_packet(&frame_bytes);
>         assert!(res.is_ok());
>         let frame = res.unwrap();
>         assert_eq!(frame.is_active, true);
>         assert_eq!(frame.battery_level, 5);
>         assert_eq!(frame.sensor_fault, false);
>         assert_eq!(frame.sensor_id, 1024);
>         assert!((frame.temperature_celsius - 21.50).abs() < f64::EPSILON);
>     }
> 
>     #[test]
>     fn test_negative_temperature() {
>         let mut bytes: [u8; 8] = [0xAA, 0x55, 0x01, 0x00, 0x01, 0xFC, 0xFF, 0x00];
>         let mut chk = 0u8;
>         for &b in &bytes[0..7] {
>             chk ^= b;
>         }
>         bytes[7] = chk;
> 
>         let frame = parse_telemetry_packet(&bytes).expect("Should parse negative temp");
>         assert_eq!(frame.temperature_celsius, -10.25);
>     }
> 
>     #[test]
>     fn test_header_and_checksum_errors() {
>         let bad_header: [u8; 8] = [0x12, 0x34, 0x00, 0x00, 0x00, 0x00, 0x00, 0x26];
>         let res = parse_telemetry_packet(&bad_header);
>         assert!(matches!(res, Err(PacketError::InvalidHeader(0x1234))));
> 
>         let bad_checksum: [u8; 8] = [0xAA, 0x55, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF];
>         let res_chk = parse_telemetry_packet(&bad_checksum);
>         assert!(matches!(res_chk, Err(PacketError::ChecksumMismatch { .. })));
>     }
> }
> ```
>
> #### Technical Explanation
>
> - **Bitwise Masking & Bit Shift Invariants**: Scalar types like `u8` allow direct bitwise bit extraction using bitwise AND (`&`) and right-shift (`>>`). For example, `(flags & 0x0E) >> 1` isolates bits 1 through 3 and aligns them into a 3-bit scalar integer (`0..=7`).
> - **Sign Extension in Integer-to-Float Casts**: Temperature is stored as a signed 16-bit scalar integer (`i16`) in two's-complement form. Casting `raw_temp as f64` correctly preserves negative sign extension before dividing by `100.0` to yield accurate IEEE 754 decimal values.
> - **Ownership & Copy Semantics**: Scalar types (`u8`, `u16`, `i16`, `f64`, `bool`) implement `Copy`. Extracting values from array references creates direct bit-copy copies with zero allocation overhead.
> - **Concurrency & Thread Safety**: Primitive scalar fields implement both `Send` and `Sync`, ensuring that parsed `TelemetryFrame` structures can be transferred across worker thread channels (`std::sync::mpsc`) without synchronization locks.
>

---

### Exercise 2: Fixed-Point Currency Calculation Engine

**Scenario:**
Standard floating-point numbers (`f32`/`f64`) introduce inexact binary representations (e.g., `0.1 + 0.2 == 0.30000000000000004`), which is unacceptable in financial transactions. You are building a high-precision fixed-point ledger engine using `i64` integer scalars to represent monetary amounts in micro-units ($1 = 1,000,000$ micro-units).

**Requirements:**
1. Define a struct `FixedMoney { pub micros: i64 }`.
2. Implement conversion constructors: `from_micros(micros: i64) -> Self` and `from_cents(cents: i64) -> Self`.
3. Implement checked arithmetic methods that return `Option<Self>` to avoid release-mode panics:
   - `checked_add(&self, rhs: Self) -> Option<Self>`
   - `checked_sub(&self, rhs: Self) -> Option<Self>`
   - `apply_basis_points(&self, bps: u32) -> Option<Self>`: Calculates fee/interest where $1 \text{ basis point} = \frac{1}{10,000}$. Multiply `micros` by `bps` using temporary `i128` promotion before dividing by `10_000` to prevent scalar overflow.
4. Implement string representation `format_usd(&self) -> String` that formats balance accurately with exact decimal alignment (e.g., `"$12.500000"`, `"-$0.500000"`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
> pub struct FixedMoney {
>     pub micros: i64,
> }
> 
> impl FixedMoney {
>     pub const SCALE: i64 = 1_000_000;
> 
>     pub fn from_micros(micros: i64) -> Self {
>         Self { micros }
>     }
> 
>     pub fn from_cents(cents: i64) -> Self {
>         Self {
>             micros: cents * (Self::SCALE / 100),
>         }
>     }
> 
>     pub fn checked_add(&self, rhs: Self) -> Option<Self> {
>         self.micros.checked_add(rhs.micros).map(Self::from_micros)
>     }
> 
>     pub fn checked_sub(&self, rhs: Self) -> Option<Self> {
>         self.micros.checked_sub(rhs.micros).map(Self::from_micros)
>     }
> 
>     pub fn apply_basis_points(&self, bps: u32) -> Option<Self> {
>         let intermediate = (self.micros as i128) * (bps as i128);
>         let result = intermediate / 10_000;
>         if result > i64::MAX as i128 || result < i64::MIN as i128 {
>             None
>         } else {
>             Some(Self::from_micros(result as i64))
>         }
>     }
> 
>     pub fn format_usd(&self) -> String {
>         let is_negative = self.micros < 0;
>         let abs_micros = self.micros.unsigned_abs();
>         let dollars = abs_micros / (Self::SCALE as u64);
>         let fractional = abs_micros % (Self::SCALE as u64);
> 
>         if is_negative {
>             format!("-${}.{:06}", dollars, fractional)
>         } else {
>             format!("${}.{:06}", dollars, fractional)
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_fixed_money_math() {
>         let m1 = FixedMoney::from_cents(1250); // $12.50
>         let m2 = FixedMoney::from_cents(375);  // $3.75
> 
>         let sum = m1.checked_add(m2).unwrap();
>         assert_eq!(sum.micros, 16_250_000);
>         assert_eq!(sum.format_usd(), "$16.250000");
> 
>         let diff = m1.checked_sub(m2).unwrap();
>         assert_eq!(diff.micros, 8_750_000);
>         assert_eq!(diff.format_usd(), "$8.750000");
>     }
> 
>     #[test]
>     fn test_basis_points_calculation() {
>         let capital = FixedMoney::from_cents(100_000); // $1,000.00
>         let fee = capital.apply_basis_points(250).unwrap(); // 2.5%
>         assert_eq!(fee.micros, 25_000_000); // $25.00
>         assert_eq!(fee.format_usd(), "$25.000000");
>     }
> 
>     #[test]
>     fn test_overflow_and_negative() {
>         let neg = FixedMoney::from_micros(-500_000);
>         assert_eq!(neg.format_usd(), "-$0.500000");
> 
>         let max_money = FixedMoney::from_micros(i64::MAX);
>         let overflow = max_money.checked_add(FixedMoney::from_micros(1));
>         assert_eq!(overflow, None);
>         assert!(overflow.is_none());
>     }
> }
> ```
>
> #### Technical Explanation
>
> - **Elimination of Floating-Point Drift**: Fixed-point arithmetic relies strictly on integer scalars (`i64`), guaranteeing exact, deterministic calculations across all host CPU architectures without IEEE 754 floating-point rounding errors.
> - **Scalar Promotion & Overflow Prevention**: Multiplying an `i64` value by a large `u32` basis point integer can overflow `i64::MAX`. Casting to `i128` widens the scalar register to 128-bit space for intermediate product calculation before performing the integer division. Safe range validation ensures conversion back to `i64` remains sound.
> - **Memory Footprint & Value Semantics**: `FixedMoney` wraps a single 64-bit integer, deriving `Copy` and `Clone`. Function parameters are passed directly in CPU registers without memory allocation or heap pointers.
> - **Edge Case Handling**: Formats zero, micro-unit fractional padding (e.g. `500_000` micro-units $\to$ `"$0.500000"`), negative dollar balances (`"-$0.500000"`), and boundary conditions up to `i64::MAX`.
>

---

### Exercise 3: Low-Level UTF-8 Byte Stream Reader & `char` Validation

**Scenario:**
Rust's `char` scalar type is a 4-byte (32-bit) Unicode Scalar Value. When text is read from network sockets or disk files, it exists as a sequence of `u8` bytes encoded in UTF-8 (1 to 4 bytes per character). You need to build a custom zero-allocation stream decoder that parses raw byte slices into `char` scalars while enforcing strict Unicode safety invariants.

**Requirements:**
1. Implement a decoder function:
   `pub fn decode_utf8_char(bytes: &[u8], offset: &mut usize) -> Result<char, Utf8DecodeError>`
2. Parse variable-length byte patterns:
   - 1-byte (`0xxxxxxx`): ASCII range `U+0000..=U+007F`.
   - 2-byte (`110xxxxx 10xxxxxx`): Range `U+0080..=U+007FF`.
   - 3-byte (`1110xxxx 10xxxxxx 10xxxxxx`): Range `U+0800..=U+FFFF`.
   - 4-byte (`11110xxx 10xxxxxx 10xxxxxx 10xxxxxx`): Range `U+10000..=U+10FFFF`.
3. Reject invalid encodings:
   - `Utf8DecodeError::EmptyStream` when `*offset >= bytes.len()`.
   - `Utf8DecodeError::IncompleteSequence` if remaining bytes are insufficient.
   - `Utf8DecodeError::InvalidContinuationByte` if continuation bytes do not match bit prefix `10xxxxxx`.
   - `Utf8DecodeError::InvalidScalar(u32)` if the reconstructed codepoint is outside valid ranges, falls within UTF-16 surrogate pairs (`0xD800..=0xDFFF`), or uses an overlong byte representation.
4. On success, advance `*offset` by the byte length of the decoded character and return `Ok(char)`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq)]
> pub enum Utf8DecodeError {
>     EmptyStream,
>     IncompleteSequence,
>     InvalidContinuationByte,
>     InvalidScalar(u32),
> }
> 
> pub fn decode_utf8_char(bytes: &[u8], offset: &mut usize) -> Result<char, Utf8DecodeError> {
>     if *offset >= bytes.len() {
>         return Err(Utf8DecodeError::EmptyStream);
>     }
> 
>     let b0 = bytes[*offset];
> 
>     let (seq_len, mut code_point) = if b0 & 0x80 == 0 {
>         (1, (b0 & 0x7F) as u32)
>     } else if b0 & 0xE0 == 0xC0 {
>         (2, (b0 & 0x1F) as u32)
>     } else if b0 & 0xF0 == 0xE0 {
>         (3, (b0 & 0x0F) as u32)
>     } else if b0 & 0xF8 == 0xF0 {
>         (4, (b0 & 0x07) as u32)
>     } else {
>         return Err(Utf8DecodeError::InvalidScalar(b0 as u32));
>     };
> 
>     if *offset + seq_len > bytes.len() {
>         return Err(Utf8DecodeError::IncompleteSequence);
>     }
> 
>     for i in 1..seq_len {
>         let b = bytes[*offset + i];
>         if (b & 0xC0) != 0x80 {
>             return Err(Utf8DecodeError::InvalidContinuationByte);
>         }
>         code_point = (code_point << 6) | ((b & 0x3F) as u32);
>     }
> 
>     let valid_range = match seq_len {
>         1 => true,
>         2 => code_point >= 0x80,
>         3 => code_point >= 0x800 && !(0xD800..=0xDFFF).contains(&code_point),
>         4 => (0x10000..=0x10FFFF).contains(&code_point),
>         _ => false,
>     };
> 
>     if !valid_range {
>         return Err(Utf8DecodeError::InvalidScalar(code_point));
>     }
> 
>     let ch = char::from_u32(code_point).ok_or(Utf8DecodeError::InvalidScalar(code_point))?;
>     *offset += seq_len;
>     Ok(ch)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_valid_utf8_decoding() {
>         let data = "Hello 🦀!".as_bytes();
>         let mut offset = 0;
> 
>         assert_eq!(decode_utf8_char(data, &mut offset), Ok('H'));
>         assert_eq!(offset, 1);
> 
>         assert_eq!(decode_utf8_char(data, &mut offset), Ok('e'));
>         assert_eq!(offset, 2);
> 
>         offset = 6;
>         assert_eq!(decode_utf8_char(data, &mut offset), Ok('🦀'));
>         assert_eq!(offset, 10);
>     }
> 
>     #[test]
>     fn test_incomplete_and_invalid_bytes() {
>         let truncated_crab = [0xF0, 0x9F, 0xA6];
>         let mut offset = 0;
>         assert_eq!(
>             decode_utf8_char(&truncated_crab, &mut offset),
>             Err(Utf8DecodeError::IncompleteSequence)
>         );
> 
>         let bad_continuation = [0xE0, 0x20, 0x80];
>         offset = 0;
>         assert_eq!(
>             decode_utf8_char(&bad_continuation, &mut offset),
>             Err(Utf8DecodeError::InvalidContinuationByte)
>         );
>     }
> 
>     #[test]
>     fn test_surrogate_and_overlong_rejection() {
>         let overlong = [0xC0, 0x81];
>         let mut offset = 0;
>         assert!(matches!(
>             decode_utf8_char(&overlong, &mut offset),
>             Err(Utf8DecodeError::InvalidScalar(1))
>         ));
> 
>         let surrogate = [0xED, 0xA0, 0x80];
>         offset = 0;
>         assert!(matches!(
>             decode_utf8_char(&surrogate, &mut offset),
>             Err(Utf8DecodeError::InvalidScalar(0xD800))
>         ));
>     }
> }
> ```
>
> #### Technical Explanation
>
> - **Rust `char` Memory Representation & Unicode Scalar Invariants**: In Rust, a `char` primitive scalar is strictly 4 bytes (32 bits) wide. Unlike C/C++ `char` (which is an 8-bit integer) or Java `char` (which is a 16-bit UTF-16 code unit), Rust `char` represents a full 21-bit Unicode Scalar Value in range `0x0000..=0xD7FF` or `0xE000..=0x10FFFF`.
> - **Bit Shifting & Code Point Reconstruction**: UTF-8 decodes variable-width sequences by shifting bit masks into a 32-bit scalar accumulator (`u32`). Subsequent continuation bytes clear their high 2 bits (`b & 0x3F`) and shift into the lower 6 bits of the accumulator (`(code_point << 6) | lower_bits`).
> - **Security & Overlong Encoding Rejection**: Non-minimal UTF-8 encodings (overlong sequences) present serious security vulnerabilities (e.g. escaping directory paths via `0xC0 0xAF` instead of `0x2F`). Validating minimum code point thresholds per sequence length guarantees canonical encoding.
> - **Zero-Allocation Lifetime & References**: Operating over `&[u8]` with a mutable offset pointer `&mut usize` allows continuous stream decoding across borrowed buffer slices without allocating heap memory or copying strings.
>

---

## 6. Related Terms


- [Compound Types](compound_types.md) — How to group multiple scalar types together into a single construct (like Tuples or Arrays).
- [Type Annotation](type_annotation.md) — The syntax (`: type`) used to explicitly define a variable's scalar type.
- [Type Inference](type_inference.md) — How the compiler guesses you want an `i32` or `f64` if you don't provide a type annotation.

---

## 7. Key Takeaways

- There are four main scalar types: integers, floating-point numbers, booleans, and characters.
- Rust uses strict, explicitly-sized naming for numbers (e.g., `i32` is 32-bit, `u8` is 8-bit).
- If you don't annotate a type, Rust defaults to `i32` for integers and `f64` for floats.
- Rust does not perform implicit type conversions; you must use the `as` keyword to mix types in operations.
- Characters (`char`) use single quotes (`'A'`) and are a full 4 bytes to support all Unicode symbols.
