# `as` Casting (Primitive Numeric Coercion)

> **Level 1 — Foundations**
> The `as` keyword for explicit, silent conversions between primitive types.

---

## 1. Prerequisites

- [Scalar Types](../level_01/scalar_types.md) — The integer, float, `bool`, and `char` types you'll be converting between.
- [Type Annotation](../level_01/type_annotation.md) — `as` always names its target type explicitly, e.g. `x as u8`.

---

## 2. Term Category

**Rust Keyword (the blunt instrument)**: `as` is Rust's most primitive, no-questions-asked conversion tool. It converts between numeric types, `bool`→numbers, `char`↔`u32`, and pointer types. Unlike almost every other conversion mechanism in Rust, `as` performs **no runtime check** and **cannot fail** — it just does the conversion, even if the result is nonsense.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Rust has dozens of numeric types (`i8`, `u8`, `i16`, `u32`, `i64`, `usize`, `f32`, `f64`...) and refuses to convert between them automatically, unlike C. If you have a `usize` (from `.len()`) and need an `i32` for an API, you need *some* way to say "just make it that type." `as` is that escape hatch: fast, zero-overhead, and available everywhere — at the cost of being **completely silent** about data loss. It exists because sometimes you, the programmer, know the value fits and don't want the ceremony of a fallible conversion.

### (2) Reality Metaphor

Imagine pouring water from a 5-gallon bucket (`i64`) into a 1-cup measuring cup (`u8`).

- **`as` casting**: You pour as fast as you can. Whatever doesn't fit in the cup splashes on the floor and is gone forever. Nobody stops you, nobody warns you. The cup is now full of *some* water — just not necessarily a useful amount.
- **`TryFrom`** (the safe alternative): A careful assistant measures the bucket first. If it's more than a cup, they hand you back an `Err` and refuse to pour, so you're never surprised by a puddle on the floor.

### (3) Rust Code Examples

#### Short Snippet (Truncation in Action)
```rust
fn main() {
    let big: i64 = 300;
    let small = big as u8; // u8 can only hold 0..=255!

    println!("{small}"); // 44, NOT 300! (300 % 256 = 44)
    // No panic. No warning at runtime. Just silently wrong data.
}
```

#### Fuller Example (Float-to-Int Saturation)
```rust
fn main() {
    let ratio: f64 = 3.9;
    let count = ratio as i32; // Truncates toward zero, does NOT round.
    println!("{count}"); // 3

    let too_big: f64 = 1e20;
    let capped = too_big as i32; // Since Rust 1.45, this SATURATES instead of UB.
    println!("{capped}"); // i32::MAX, i.e. 2147483647

    let negative: f64 = -1.0;
    let unsigned = negative as u32; // Saturates to the other bound.
    println!("{unsigned}"); // 0
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Silent Truncation in Downcasting Large Integers

**The mistake:** Casting a 64-bit integer into an 8-bit integer using `as` when the value exceeds 255.

**Why it's wrong:** The `as` operator performs numeric truncation silently without runtime panics or warnings, truncating high-order bits and yielding unexpected values.

*Incorrect:*
```rust
let big: u64 = 1000;
let small: u8 = big as u8; // Silently truncates to 232!
```

*Fix:*
```rust
use std::convert::TryFrom;
let big: u64 = 1000;
let small: Result<u8, _> = u8::try_from(big); // Safely returns Error
```

### Mistake 2: Casting Float to Integer Causing Out-of-Range Undefined Behavior Safeguards

**The mistake:** Casting `NaN` or out-of-bound floating-point numbers like `f64::NAN as i32`.

**Why it's wrong:** Converting float `NaN` or infinity to integers using `as` yields `0` in Rust 1.45+, which can silently corrupt mathematical logic.

*Incorrect:*
```rust
let val: f64 = f64::NAN;
let int_val = val as i32; // Evaluates to 0 silently
```

*Fix:*
```rust
let val: f64 = f64::NAN;
if val.is_finite() {
    let int_val = val as i32;
}
```

### Mistake 3: Pointer Casting Circumventing Ownership Safeguards

**The mistake:** Attempting raw pointer casting `*const T as *mut T` to mutate immutable data.

**Why it's wrong:** Casting immutable reference pointers to mutable pointers without unsafe sync cell primitives breaks aliasing guarantees.

*Incorrect:*
```rust
let x = 42;
let ptr = &x as *const i32 as *mut i32;
// unsafe { *ptr = 100; } // Undefined Behavior!
```

*Fix:*
```rust
use std::cell::Cell;
let x = Cell::new(42);
x.set(100);
```

---

## 5. Practice Exercises

### Exercise 1: High-Throughput Binary Telemetry Frame Header Parser

**Scenario:** You are building a low-latency network telemetry parser for an IoT gateway. Packets arrive as raw byte streams where each frame starts with a 4-byte big-endian header (`[u8; 4]`). The header encodes four packed bitfields inside a 32-bit unsigned integer (`u32`):
- Bits 0..=3 (4 bits): Protocol version (must equal `1`).
- Bits 4..=7 (4 bits): Message opcode / command ID.
- Bits 8..=15 (8 bits): Sensor node ID.
- Bits 16..=31 (16 bits): Payload length in bytes.

**Requirements:**
1. Define a `TelemetryHeader` struct containing `version: u8`, `opcode: u8`, `sensor_id: u8`, `payload_len: u16`.
2. Implement `TelemetryHeader::parse_and_validate(raw_header: &[u8; 4]) -> Result<TelemetryHeader, PacketError>` using bit shifting and explicit `as` casts down to target integer types (`as u8` and `as u16`).
3. Implement `extract_payload<'a>(header: &TelemetryHeader, frame_data: &'a [u8]) -> Result<&'a [u8], PacketError>` that converts `header.payload_len as usize` for slice bounds checking and extraction.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq)]
> pub enum PacketError {
>     InvalidVersion(u8),
>     BufferTooShort { expected: usize, actual: usize },
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct TelemetryHeader {
>     pub version: u8,
>     pub opcode: u8,
>     pub sensor_id: u8,
>     pub payload_len: u16,
> }
> 
> impl TelemetryHeader {
>     pub fn parse_and_validate(raw_header: &[u8; 4]) -> Result<Self, PacketError> {
>         let raw_u32 = u32::from_be_bytes(*raw_header);
> 
>         // Mask bits and explicitly downcast using `as`
>         let version = (raw_u32 & 0x0F) as u8;
>         let opcode = ((raw_u32 >> 4) & 0x0F) as u8;
>         let sensor_id = ((raw_u32 >> 8) & 0xFF) as u8;
>         let payload_len = (raw_u32 >> 16) as u16;
> 
>         if version != 1 {
>             return Err(PacketError::InvalidVersion(version));
>         }
> 
>         Ok(Self {
>             version,
>             opcode,
>             sensor_id,
>             payload_len,
>         })
>     }
> }
> 
> pub fn extract_payload<'a>(
>     header: &TelemetryHeader,
>     frame_data: &'a [u8],
> ) -> Result<&'a [u8], PacketError> {
>     const HEADER_SIZE: usize = 4;
>     let expected_len = HEADER_SIZE + (header.payload_len as usize);
> 
>     if frame_data.len() < expected_len {
>         return Err(PacketError::BufferTooShort {
>             expected: expected_len,
>             actual: frame_data.len(),
>         });
>     }
> 
>     Ok(&frame_data[HEADER_SIZE..expected_len])
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_valid_packet_parsing_and_payload_extraction() {
>         let raw_u32: u32 = (8 << 16) | (42 << 8) | (5 << 4) | 1;
>         let header_bytes = raw_u32.to_be_bytes();
> 
>         let header = TelemetryHeader::parse_and_validate(&header_bytes).unwrap();
>         assert_eq!(header.version, 1);
>         assert_eq!(header.opcode, 5);
>         assert_eq!(header.sensor_id, 42);
>         assert_eq!(header.payload_len, 8);
> 
>         let mut packet_buffer = Vec::new();
>         packet_buffer.extend_from_slice(&header_bytes);
>         packet_buffer.extend_from_slice(b"PINGDATA");
> 
>         let payload = extract_payload(&header, &packet_buffer).unwrap();
>         assert_eq!(payload, b"PINGDATA");
>     }
> 
>     #[test]
>     fn test_invalid_version_error() {
>         let raw_u32: u32 = (4 << 16) | (10 << 8) | (1 << 4) | 2;
>         let header_bytes = raw_u32.to_be_bytes();
> 
>         let result = TelemetryHeader::parse_and_validate(&header_bytes);
>         assert!(matches!(result, Err(PacketError::InvalidVersion(2))));
>     }
> 
>     #[test]
>     fn test_buffer_too_short() {
>         let raw_u32: u32 = (100 << 16) | (1 << 8) | (1 << 4) | 1;
>         let header_bytes = raw_u32.to_be_bytes();
> 
>         let header = TelemetryHeader::parse_and_validate(&header_bytes).unwrap();
>         let frame_data = [0u8; 10];
> 
>         let result = extract_payload(&header, &frame_data);
>         assert_ne!(result, Ok(&[][..]));
>         assert!(matches!(
>             result,
>             Err(PacketError::BufferTooShort { expected: 104, actual: 10 })
>         ));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
> 1. **Bitfield Masking & Infallible Downcasting (`as u8` / `as u16`):**
>    - The 32-bit big-endian integer is constructed using `u32::from_be_bytes(*raw_header)`.
>    - Bitwise operations (e.g., `(raw_u32 & 0x0F)` or `(raw_u32 >> 16)`) yield `u32` values.
>    - Using `as u8` or `as u16` downcasts the `u32` by truncating higher-order bits. Because bitwise masks explicitly restrict the numerical range before casting (`0x0F` $\le 15$, `0xFF` $\le 255$), the `as` truncation is guaranteed to be lossless.
> 2. **Slice Indexing Width Alignment (`u16 as usize`):**
>    - Slices in Rust require indexing via `usize`.
>    - Converting `payload_len as usize` is a zero-cost widening conversion on 16-bit, 32-bit, and 64-bit architectures, guaranteeing no overflow or truncation during slice bounds calculations.
> 3. **Memory Boundary Safety:**
>    - The total packet size `HEADER_SIZE + payload_len as usize` is checked against `frame_data.len()` to prevent out-of-bounds panics when returning a zero-copy subslice `&frame_data[4..expected_len]`.
>
>

---

### Exercise 2: Financial High-Frequency Pricing Engine & Basis-Point Fee Calculator

**Scenario:** High-frequency trading execution venues receive market rates as 64-bit floating-point ratios (`f64`). Because binary floating-point representation accumulates IEEE-754 rounding drift (`0.1 + 0.2 != 0.3`), internal ledgers store currency in signed fixed-point integer micro-units (`1 unit = 1,000,000 micros`).

**Requirements:**
1. Define a `MicroAmount` newtype struct wrapping `pub i64`.
2. Implement `MicroAmount::from_f64_price(price: f64) -> Result<MicroAmount, PricingError>`:
   - Validate `price.is_finite()` to guard against `NaN` and `Infinity`.
   - Scale `price` by `1_000_000.0` and verify bounds against `(i64::MIN as f64) ..= (i64::MAX as f64)` prior to casting.
   - Convert the scaled float using `as i64` (noting truncation behavior toward zero).
3. Implement `MicroAmount::to_f64_price(&self) -> f64` using `self.0 as f64`.
4. Implement `MicroAmount::apply_basis_point_fee(&self, bps: u16) -> Result<MicroAmount, PricingError>` using `bps as i64` for signed multiplication.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq)]
> pub enum PricingError {
>     NonFiniteInput,
>     Overflow,
> }
> 
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub struct MicroAmount(pub i64);
> 
> impl MicroAmount {
>     pub const SCALE_FACTOR: f64 = 1_000_000.0;
> 
>     pub fn from_f64_price(price: f64) -> Result<Self, PricingError> {
>         if !price.is_finite() {
>             return Err(PricingError::NonFiniteInput);
>         }
> 
>         let scaled = price * Self::SCALE_FACTOR;
> 
>         // Validate float range before `as` cast to prevent saturation anomalies
>         if scaled < (i64::MIN as f64) || scaled > (i64::MAX as f64) {
>             return Err(PricingError::Overflow);
>         }
> 
>         // Float-to-int `as` cast truncates fractional digits toward zero
>         let micros = scaled as i64;
>         Ok(MicroAmount(micros))
>     }
> 
>     pub fn to_f64_price(&self) -> f64 {
>         // Integer to float conversion using `as`
>         (self.0 as f64) / Self::SCALE_FACTOR
>     }
> 
>     pub fn apply_basis_point_fee(&self, bps: u16) -> Result<Self, PricingError> {
>         // Widen u16 to i64 using `as` for signed multiplication
>         let bps_i64 = bps as i64;
> 
>         let fee_micros = self
>             .0
>             .checked_mul(bps_i64)
>             .map(|prod| prod / 10_000)
>             .ok_or(PricingError::Overflow)?;
> 
>         Ok(MicroAmount(fee_micros))
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_valid_f64_conversion() {
>         let price = 123.456789;
>         let micro = MicroAmount::from_f64_price(price).unwrap();
>         assert_eq!(micro.0, 123_456_789);
> 
>         let recovered = micro.to_f64_price();
>         assert!((recovered - price).abs() < 1e-6);
>     }
> 
>     #[test]
>     fn test_nan_and_infinity_rejected() {
>         assert!(matches!(
>             MicroAmount::from_f64_price(f64::NAN),
>             Err(PricingError::NonFiniteInput)
>         ));
>         assert!(matches!(
>             MicroAmount::from_f64_price(f64::INFINITY),
>             Err(PricingError::NonFiniteInput)
>         ));
>     }
> 
>     #[test]
>     fn test_truncation_toward_zero() {
>         let micro = MicroAmount::from_f64_price(10.999_999_9).unwrap();
>         assert_eq!(micro.0, 10_999_999);
>         assert_ne!(micro.0, 11_000_000);
>     }
> 
>     #[test]
>     fn test_basis_point_fee_calculation() {
>         let micro = MicroAmount(1_000_000_000); // 1000 currency units
>         let fee = micro.apply_basis_point_fee(250).unwrap(); // 250 bps = 2.5%
>         assert_eq!(fee.0, 25_000_000); // 25 currency units in micros
>     }
> }
> ```
>
> #### Technical Explanation
>
>
> 1. **Rust 1.45+ Float-to-Int `as` Saturation vs Guarding Non-Finite Values:**
>    - Since Rust 1.45, casting floats to integers via `as` saturates out-of-bound values (`f64::INFINITY as i64` yields `i64::MAX`) and converts `f64::NAN as i64` to `0`.
>    - In accounting systems, mapping `NaN` to `0` or saturating to `i64::MAX` silently corrupts financial records. Therefore, `price.is_finite()` and float range checks against `i64::MIN as f64` / `i64::MAX as f64` are mandatory before applying `as i64`.
> 2. **Truncation Behavior during Float-to-Int Conversion:**
>    - Casting `scaled as i64` truncates fractional digits toward zero (`10.999_999 as i64` becomes `10`). If nearest-neighbor rounding is required, callers must invoke `scaled.round()` prior to casting.
> 3. **Precision Boundaries in Integer-to-Float Conversions (`i64 as f64`):**
>    - IEEE-754 `f64` floats allocate 53 bits to the mantissa, providing exact integer representation up to $2^{53} - 1$ ($9,007,199,254,740,991$).
>    - Casting `i64 as f64` for integers exceeding $2^{53}$ silently drops lower-bit precision.
> 4. **Safe Signed Arithmetic via Widening (`bps as i64`):**
>    - Widening `u16` basis points to `i64` using `as` allows signed multiplication with `self.0` using `checked_mul` without risk of overflow during the cast.
>
>

---

### Exercise 3: Low-Level Raw Pointer Memory Arena & Alignment Inspector

**Scenario:** In bare-metal device drivers and zero-copy custom slab allocators, system software must inspect raw buffer pointers for CPU hardware address alignment, compute byte offsets between allocations, and safely reinterpret raw byte buffers into typed structures without performing heap allocations.

**Requirements:**
1. Implement `MemoryAddressInspector::get_raw_address(slice: &[u8]) -> usize` casting `slice.as_ptr() as usize`.
2. Implement `MemoryAddressInspector::is_aligned(slice: &[u8], alignment: usize) -> bool` validating power-of-two alignment on integer addresses using `as usize`.
3. Implement `MemoryAddressInspector::calculate_offset(base: &[u8], target: &[u8]) -> Option<isize>` casting `usize` address values to signed `isize` to compute relative byte offsets.
4. Implement `MemoryAddressInspector::try_reinterpret_header<T: Copy>(buffer: &[u8]) -> Option<&T>` using raw pointer casting `*const u8 as *const T` while enforcing size and alignment safety invariants.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[repr(C, align(4))]
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub struct HardwareDescriptor {
>     pub device_id: u16,
>     pub status_flags: u16,
>     pub clock_rate_mhz: u32,
> }
> 
> pub struct MemoryAddressInspector;
> 
> impl MemoryAddressInspector {
>     pub fn get_raw_address(slice: &[u8]) -> usize {
>         slice.as_ptr() as usize
>     }
> 
>     pub fn is_aligned(slice: &[u8], alignment: usize) -> bool {
>         if alignment == 0 || (alignment & (alignment - 1)) != 0 {
>             return false; // Alignment parameter must be a non-zero power of two
>         }
>         let addr = slice.as_ptr() as usize;
>         (addr % alignment) == 0
>     }
> 
>     pub fn calculate_offset(base: &[u8], target: &[u8]) -> Option<isize> {
>         let base_addr = base.as_ptr() as usize;
>         let target_addr = target.as_ptr() as usize;
> 
>         // Cast unsigned usize addresses to signed isize to calculate offset
>         let diff = (target_addr as isize).wrapping_sub(base_addr as isize);
>         Some(diff)
>     }
> 
>     /// Reinterprets a raw byte slice as a reference to a typed header `T`.
>     pub fn try_reinterpret_header<T: Copy>(buffer: &[u8]) -> Option<&T> {
>         if buffer.len() < std::mem::size_of::<T>() {
>             return None;
>         }
> 
>         let ptr = buffer.as_ptr();
>         let addr = ptr as usize;
> 
>         if addr % std::mem::align_of::<T>() != 0 {
>             return None;
>         }
> 
>         // Raw pointer casting: *const u8 as *const T
>         let typed_ptr = ptr as *const T;
> 
>         // SAFETY: Bounds and alignment checked above; T is Copy.
>         unsafe { Some(&*typed_ptr) }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_address_and_alignment() {
>         let data = [0u8; 16];
>         let addr = MemoryAddressInspector::get_raw_address(&data);
>         assert_ne!(addr, 0);
> 
>         assert!(MemoryAddressInspector::is_aligned(&data, 1));
>         assert!(!MemoryAddressInspector::is_aligned(&data, 3));
>     }
> 
>     #[test]
>     fn test_pointer_offset_calculation() {
>         let buffer = [0u8; 32];
>         let base = &buffer[0..4];
>         let target = &buffer[12..16];
> 
>         let offset = MemoryAddressInspector::calculate_offset(base, target).unwrap();
>         assert_eq!(offset, 12);
> 
>         let reverse_offset = MemoryAddressInspector::calculate_offset(target, base).unwrap();
>         assert_eq!(reverse_offset, -12);
>     }
> 
>     #[test]
>     fn test_try_reinterpret_header_success_and_failure() {
>         let descriptor = HardwareDescriptor {
>             device_id: 0x1234,
>             status_flags: 0x0001,
>             clock_rate_mhz: 3200,
>         };
> 
>         let bytes: &[u8] = unsafe {
>             std::slice::from_raw_parts(
>                 &descriptor as *const HardwareDescriptor as *const u8,
>                 std::mem::size_of::<HardwareDescriptor>(),
>             )
>         };
> 
>         let reinterpreted = MemoryAddressInspector::try_reinterpret_header::<HardwareDescriptor>(bytes);
>         assert!(reinterpreted.is_some());
>         assert_eq!(reinterpreted.unwrap(), &descriptor);
> 
>         let short_buffer = &bytes[0..2];
>         let failed = MemoryAddressInspector::try_reinterpret_header::<HardwareDescriptor>(short_buffer);
>         assert_eq!(failed, None);
>         assert!(matches!(failed, None));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
> 1. **Pointer to Integer Address Cast (`*const u8 as usize`):**
>    - The `as` keyword allows casting raw pointer types `*const T` or `*mut T` directly to `usize`, extracting the absolute scalar virtual memory address.
>    - Address alignment verification `(addr % alignment) == 0` ensures CPU memory operations do not trigger alignment faults on strict architectures (e.g. ARMv7 or SPARC).
> 2. **Signed Pointer Distance (`usize as isize`):**
>    - Relative byte offsets between memory addresses require signed arithmetic because `target` may reside before or after `base`. Converting addresses `as isize` allows signed difference calculations via `wrapping_sub`.
> 3. **Pointer-to-Pointer Cast (`*const u8 as *const T`) & Safety Invariants:**
>    - Casting `buffer.as_ptr() as *const T` is syntactically safe, but dereferencing `&*typed_ptr` is `unsafe` and requires fulfilling four strict memory invariants:
>      - **Buffer Size:** `buffer.len() >= std::mem::size_of::<T>()`.
>      - **Address Alignment:** `(addr % std::mem::align_of::<T>()) == 0`.
>      - **Validity:** Data initialized as valid bytes for `T` (enforced via `T: Copy`).
>      - **Lifetime Binding:** The returned reference lifetime `'a` is tied to the input slice lifetime `&'a [u8]`.
>
>

---

## 6. Related Terms

- [`TryFrom` / `TryInto`](../level_14/tryfrom_tryinto.md) — The fallible, `Result`-returning alternative that never silently loses data.
- [Integer Overflow Semantics](../level_01/integer_overflow.md) — The `checked_`/`wrapping_`/`saturating_` method families that make truncation an explicit choice instead of an `as`-cast accident.
- [`From` / `Into` Traits](../level_04/from_into_traits.md) — The *lossless*, guaranteed-safe conversion traits; prefer these over `as` whenever the target type can represent every source value.

---

## 7. Key Takeaways

- `as` performs **explicit, silent, infallible** primitive conversions — it never panics and never returns a `Result`.
- Narrowing integer casts (`i64 as u8`) **truncate** by discarding high-order bits (wrapping, like modular arithmetic).
- Float-to-int casts **truncate toward zero** and **saturate** at the target type's bounds instead of producing Undefined Behavior.
- If correctness matters more than raw speed, reach for `TryFrom`/`TryInto` or the `checked_`/`saturating_` method families instead.
