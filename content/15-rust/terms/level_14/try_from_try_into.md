# `TryFrom` / `TryInto`

> **Level 14 — Advanced Traits & Design Patterns**
> Standard library traits (`core::convert::TryFrom` and `core::convert::TryInto`) for performing fallible type conversions that return a `Result<T, Error>`, guaranteeing safe and explicit type casting when a conversion could overflow, truncate, or violate domain invariants.



### Mistake 2: Ignoring Numeric Truncation or Out-of-Bounds Values

**The mistake:** Using unchecked `as` casting inside `TryFrom` implementations instead of bounds checking.

**Why it's wrong:** The sole purpose of `TryFrom` is fallible conversion safety. Using `as` casting without checking limits silently truncates values (e.g. `256u16 as u8` becomes `0`), defeating the safety invariants of `TryFrom`.

*Incorrect:*
```rust
impl TryFrom<u16> for SmallByte {
    type Error = &'static str;
    fn try_from(val: u16) -> Result<Self, Self::Error> {
        Ok(SmallByte(val as u8)) // ❌ Silently truncates values > 255!
    }
}
```

*Fix:*
```rust
impl TryFrom<u16> for SmallByte {
    type Error = &'static str;
    fn try_from(val: u16) -> Result<Self, Self::Error> {
        if val <= 255 {
            Ok(SmallByte(val as u8))
        } else {
            Err("Value exceeds u8 maximum")
        }
    }
}
```

### Mistake 3: Swallowing Error Context in `type Error`

**The mistake:** Defining `type Error = ();` without providing domain-specific error details.

**Why it's wrong:** Callers using `TryFrom` need structured error information to diagnose why conversion failed. Using `()` discards context and prevents error matching.

*Fix:* Use custom enums or descriptive error types implementing `std::error::Error`.

---

## 1. Prerequisites


- [`From` / `Into` Traits](../level_04/from_into_traits.md) — Infallible type conversion traits in the standard library.
- [`Result<T, E>`](../level_02/result_t_e.md) — Error handling container used by `TryFrom` and `TryInto`.
- [Blanket Implementation](blanket_implementation.md) — How `TryInto` is automatically derived for all types implementing `TryFrom`.

---

## 2. Term Category



**Rust Conversion Traits (fallible type conversion traits)**: `TryFrom` and `TryInto` are standard conversion traits used when a conversion from type `T` to type `U` can fail. Unlike `From` and `Into` which guarantee success (infallible conversion), `TryFrom` returns a `Result<Target, Error>`. Implementing `TryFrom<T> for U` automatically provides the reciprocal `TryInto<U> for T` via a standard library blanket implementation.



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Primitive type casts (`as` keyword) in Rust can silently truncate values or alter signs:
- `257u16 as u8` results in `1u8` (silent high-byte truncation).
- `-5i8 as u8` results in `251u8` (silent sign bit reinterpretation).

Before `TryFrom` was stabilized in Rust 1.34, developers wrote custom methods (`from_u32()`, `parse_bytes()`) or relied on dynamic bounds checking. This lacked a unified interface across ecosystem libraries.

`TryFrom` and `TryInto` solve this:
1. **Type-Safe Fallible Casting**: Returns `Ok(value)` on valid conversion, or `Err(Error)` on range overflow or invalid data.
2. **Unified API Contract**: Enables generic functions to bound types with `T: TryFrom<U>` or `U: TryInto<T>`.
3. **Automatic Reciprocity**: Implementing `TryFrom` gives you `TryInto` for free via blanket implementation.

### (2) Definition Signature

```rust
pub trait TryFrom<T>: Sized {
    type Error;
    fn try_from(value: T) -> Result<Self, Self::Error>;
}

pub trait TryInto<T>: Sized {
    type Error;
    fn try_into(self) -> Result<T, Self::Error>;
}
```

### (3) Reality Metaphor

Imagine a **Fixed-Size Mail Slot vs Large Parcel**:

- **`From` / `Into` (Infallible)** is like dropping a letter into a large mailbox drop-slot: it is guaranteed to fit every time (**always succeeds**).
- **`as` Casting (Dangerous)** is like taking a large 10-inch box and slamming a heavy hammer down to force it through a 2-inch slot: the box is crushed and damaged (**data corruption/truncation**).
- **`TryFrom` / `TryInto` (Fallible)** is a smart automated measuring scanner at the postal counter:
  - It measures the parcel dimensions first (**bounds & invariant checking**).
  - If the parcel fits, it accepts the package and prints a receipt (**returns `Ok(ParsedType)`**).
  - If the parcel is too wide, it stops, rejects the box safely, and gives an error message explaining why (**returns `Err(PackageTooLargeError)`**).

### (4) Code Examples

#### Short Snippet (Fallible Integer Conversion)

```rust
use std::convert::TryFrom;

fn main() {
    let big_num: u32 = 255;
    let overflow_num: u32 = 300;

    // Successful conversion: 255 fits inside u8
    let small_num: Result<u8, _> = u8::try_from(big_num);
    assert_eq!(small_num, Ok(255));

    // Failed conversion: 300 exceeds u8::MAX (255)
    let failed_num: Result<u8, _> = u8::try_from(overflow_num);
    assert!(failed_num.is_err());
    println!("Conversion failed safely: {:?}", failed_num);
}
```

#### Fuller Example (Domain-Driven Type Validation)

```rust
use std::convert::{TryFrom, TryInto};

#[derive(Debug, PartialEq, Eq)]
pub struct PortNumber(u16);

#[derive(Debug, PartialEq, Eq)]
pub enum PortError {
    ReservedPort(u16),
    ZeroPortNotAllowed,
}

impl TryFrom<u16> for PortNumber {
    type Error = PortError;

    fn try_from(value: u16) -> Result<Self, Self::Error> {
        match value {
            0 => Err(PortError::ZeroPortNotAllowed),
            1..=1023 => Err(PortError::ReservedPort(value)),
            valid => Ok(PortNumber(valid)),
        }
    }
}

fn connect(port: impl TryInto<PortNumber, Error = PortError>) -> Result<(), PortError> {
    let port_num: PortNumber = port.try_into()?;
    println!("Connecting to non-reserved port {:?}", port_num);
    Ok(())
}

fn main() {
    let res1 = connect(8080u16);
    assert!(res1.is_ok());

    let res2 = connect(80u16); // Port 80 is reserved (HTTP)
    assert_eq!(res2, Err(PortError::ReservedPort(80)));
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Implementing `TryInto` Manually Instead of `TryFrom`

**The mistake:** Implementing `TryInto<Target> for Source` directly.

**Why it's wrong:** Rust's standard library provides a blanket implementation:
```rust
impl<T, U> TryInto<U> for T
where
    U: TryFrom<T>,
{
    type Error = U::Error;
    fn try_into(self) -> Result<U, U::Error> {
        U::try_from(self)
    }
}
```
If you implement `TryInto` directly, Rust's coherence rules will prevent you (or others) from implementing `TryFrom`, breaking ecosystem compatibility.

*Fix:* **Always implement `TryFrom`**, and let `TryInto` be derived automatically.

---

## 5. Practice Exercises

### Exercise 1: Hardware Register Byte Decoding for Embedded Sensor (`TryFrom<u8>`)

**Scenario:**
In an embedded driver for an I2C accelerometer, the device emits an 8-bit status byte representing the current operating mode:
- `0x00`: `Standby`
- `0x01`: `Measurement2G`
- `0x02`: `Measurement4G`
- `0x04`: `Measurement8G`
- Any other value: Invalid byte.

Implement `TryFrom<u8>` for `SensorOpMode` returning a custom `InvalidRegisterMode(u8)` error struct. Write unit tests with `assert_eq!` verifying valid mode conversions, invalid mode rejections, and reciprocal `TryInto` usage.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #![cfg_attr(not(test), no_std)]
> 
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub enum SensorOpMode {
>     Standby,
>     Measurement2G,
>     Measurement4G,
>     Measurement8G,
> }
> 
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub struct InvalidRegisterMode(pub u8);
> 
> impl TryFrom<u8> for SensorOpMode {
>     type Error = InvalidRegisterMode;
> 
>     fn try_from(value: u8) -> Result<Self, Self::Error> {
>         match value {
>             0x00 => Ok(SensorOpMode::Standby),
>             0x01 => Ok(SensorOpMode::Measurement2G),
>             0x02 => Ok(SensorOpMode::Measurement4G),
>             0x04 => Ok(SensorOpMode::Measurement8G),
>             unknown => Err(InvalidRegisterMode(unknown)),
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_valid_register_decoding() {
>         assert_eq!(SensorOpMode::try_from(0x00), Ok(SensorOpMode::Standby));
>         assert_eq!(SensorOpMode::try_from(0x01), Ok(SensorOpMode::Measurement2G));
>         assert_eq!(SensorOpMode::try_from(0x02), Ok(SensorOpMode::Measurement4G));
>         assert_eq!(SensorOpMode::try_from(0x04), Ok(SensorOpMode::Measurement8G));
>     }
> 
>     #[test]
>     fn test_invalid_register_decoding() {
>         assert_eq!(SensorOpMode::try_from(0x03), Err(InvalidRegisterMode(0x03)));
>         assert_eq!(SensorOpMode::try_from(0xFF), Err(InvalidRegisterMode(0xFF)));
>     }
> 
>     #[test]
>     fn test_reciprocal_try_into() {
>         let byte_val: u8 = 0x02;
>         let mode: Result<SensorOpMode, _> = byte_val.try_into();
>         assert_eq!(mode, Ok(SensorOpMode::Measurement4G));
>     }
> }
> ```
> 
> #### Technical Explanation
>
> 1. **Match Exhaustiveness**: The `match` block handles exact sensor register bit-patterns and captures out-of-range byte codes in the fallback arm `unknown`.
> 2. **Custom Error Context**: `InvalidRegisterMode(u8)` preserves the invalid byte for diagnostic logging.
> 3. **Blanket Reciprocity**: `TryInto` works seamlessly without custom code because of the std blanket implementation.

---

### Exercise 2: Validated Domain Type — Motor PWM Duty Cycle (`TryFrom<u16>` & `TryFrom<f32>`)

**Scenario:**
An embedded motor controller takes duty cycle inputs from two sources:
1. Discrete 16-bit timer counts (`u16`), where values `0..=100` map to percentage duty cycles, and anything $> 100$ is an out-of-bounds error.
2. Normalized floating-point signals (`f32`), where `0.0..=1.0` maps to percentage duty cycle, and negative numbers, numbers $> 1.0$, or `f32::NAN` are invalid.

Implement `TryFrom<u16>` and `TryFrom<f32>` for `PwmDutyCycle(u8)`. Write comprehensive unit tests verifying bounds, float rounding, and `f32::NAN` rejection.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub struct PwmDutyCycle(u8);
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub enum DutyCycleError {
>     PercentageExceeded(u16),
>     FloatOutOfRange(f32),
>     InvalidNan,
> }
> 
> impl PwmDutyCycle {
>     pub fn percentage(&self) -> u8 {
>         self.0
>     }
> }
> 
> impl TryFrom<u16> for PwmDutyCycle {
>     type Error = DutyCycleError;
> 
>     fn try_from(value: u16) -> Result<Self, Self::Error> {
>         if value <= 100 {
>             Ok(PwmDutyCycle(value as u8))
>         } else {
>             Err(DutyCycleError::PercentageExceeded(value))
>         }
>     }
> }
> 
> impl TryFrom<f32> for PwmDutyCycle {
>     type Error = DutyCycleError;
> 
>     fn try_from(value: f32) -> Result<Self, Self::Error> {
>         if value.is_nan() {
>             return Err(DutyCycleError::InvalidNan);
>         }
>         if (0.0..=1.0).contains(&value) {
>             let pct = (value * 100.0).round() as u8;
>             Ok(PwmDutyCycle(pct))
>         } else {
>             Err(DutyCycleError::FloatOutOfRange(value))
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_pwm_u16_conversion() {
>         assert_eq!(PwmDutyCycle::try_from(0u16).map(|p| p.percentage()), Ok(0));
>         assert_eq!(PwmDutyCycle::try_from(50u16).map(|p| p.percentage()), Ok(50));
>         assert_eq!(PwmDutyCycle::try_from(100u16).map(|p| p.percentage()), Ok(100));
>         assert_eq!(PwmDutyCycle::try_from(101u16), Err(DutyCycleError::PercentageExceeded(101)));
>     }
> 
>     #[test]
>     fn test_pwm_f32_conversion() {
>         assert_eq!(PwmDutyCycle::try_from(0.0f32).map(|p| p.percentage()), Ok(0));
>         assert_eq!(PwmDutyCycle::try_from(0.55f32).map(|p| p.percentage()), Ok(55));
>         assert_eq!(PwmDutyCycle::try_from(1.0f32).map(|p| p.percentage()), Ok(100));
>         assert_eq!(PwmDutyCycle::try_from(-0.1f32), Err(DutyCycleError::FloatOutOfRange(-0.1)));
>         assert_eq!(PwmDutyCycle::try_from(1.05f32), Err(DutyCycleError::FloatOutOfRange(1.05)));
>         assert_eq!(PwmDutyCycle::try_from(f32::NAN), Err(DutyCycleError::InvalidNan));
>     }
> }
> ```
> 
> #### Technical Explanation
>
> 1. **Multiple Conversion Sources**: A single domain type can implement `TryFrom` for multiple distinct input types (`u16` and `f32`).
> 2. **NaN Guarding**: `f32::is_nan()` must be checked before range comparison because NaN comparisons always evaluate to `false`.
> 3. **Domain Invariants**: By restricting constructor access and validating via `TryFrom`, `PwmDutyCycle` guarantees its internal value never exceeds 100%.

---

### Exercise 3: Network Packet Header Parsing — Byte Slice `&[u8]` to Fixed IPv4 Header Struct

**Scenario:**
A low-level network packet engine receives raw byte slices (`&[u8]`). It must extract a valid 20-byte IPv4 packet header struct:
- Header length must be at least 20 bytes.
- The IP version nibble (top 4 bits of byte 0) must equal `4`.
- Extract source IP (`[u8; 4]`) and destination IP (`[u8; 4]`).

Implement `TryFrom<&[u8]>` for `Ipv4Header`. Use `<[u8; 4]>::try_from(...)` slice-to-array conversions. Write unit tests validating success, buffer underflow, and invalid IP version flags.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct Ipv4Header {
>     pub version: u8,
>     pub ttl: u8,
>     pub protocol: u8,
>     pub src_ip: [u8; 4],
>     pub dst_ip: [u8; 4],
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub enum HeaderParseError {
>     BufferTooShort { expected: usize, actual: usize },
>     InvalidVersion(u8),
> }
> 
> impl TryFrom<&[u8]> for Ipv4Header {
>     type Error = HeaderParseError;
> 
>     fn try_from(bytes: &[u8]) -> Result<Self, Self::Error> {
>         if bytes.len() < 20 {
>             return Err(HeaderParseError::BufferTooShort {
>                 expected: 20,
>                 actual: bytes.len(),
>             });
>         }
> 
>         let version = (bytes[0] >> 4) & 0x0F;
>         if version != 4 {
>             return Err(HeaderParseError::InvalidVersion(version));
>         }
> 
>         let ttl = bytes[8];
>         let protocol = bytes[9];
> 
>         let src_ip: [u8; 4] = bytes[12..16]
>             .try_into()
>             .map_err(|_| HeaderParseError::BufferTooShort { expected: 20, actual: bytes.len() })?;
> 
>         let dst_ip: [u8; 4] = bytes[16..20]
>             .try_into()
>             .map_err(|_| HeaderParseError::BufferTooShort { expected: 20, actual: bytes.len() })?;
> 
>         Ok(Ipv4Header {
>             version,
>             ttl,
>             protocol,
>             src_ip,
>             dst_ip,
>         })
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_valid_ipv4_header_parsing() {
>         let raw_packet: [u8; 20] = [
>             0x45, 0x00, 0x00, 0x3c, // Version=4, IHL=5
>             0x1c, 0x46, 0x40, 0x00,
>             0x40, 0x06, 0xb1, 0xe6, // TTL=64, Protocol=6 (TCP)
>             192, 168, 1, 100,      // Src IP
>             10, 0, 0, 1,           // Dst IP
>         ];
> 
>         let header = Ipv4Header::try_from(&raw_packet[..]).unwrap();
>         assert_eq!(header.version, 4);
>         assert_eq!(header.ttl, 64);
>         assert_eq!(header.protocol, 6);
>         assert_eq!(header.src_ip, [192, 168, 1, 100]);
>         assert_eq!(header.dst_ip, [10, 0, 0, 1]);
>     }
> 
>     #[test]
>     fn test_buffer_underflow() {
>         let short_packet = [0x45u8; 10];
>         let res = Ipv4Header::try_from(&short_packet[..]);
>         assert_eq!(res, Err(HeaderParseError::BufferTooShort { expected: 20, actual: 10 }));
>     }
> 
>     #[test]
>     fn test_invalid_ipv6_version() {
>         let mut raw_packet = [0u8; 20];
>         raw_packet[0] = 0x60; // Version 6 (IPv6)
>         let res = Ipv4Header::try_from(&raw_packet[..]);
>         assert_eq!(res, Err(HeaderParseError::InvalidVersion(6)));
>     }
> }
> ```
> 
> #### Technical Explanation
>
> 1. **Slice-to-Array Conversion**: `bytes[12..16].try_into()` converts dynamically sized sub-slices `&[u8]` into fixed-size arrays `[u8; 4]`.
> 2. **Nibble Extraction**: `(bytes[0] >> 4) & 0x0F` isolates the top 4 bits representing the IP version.
> 3. **Panic Safety**: Checking slice bounds up-front prevents out-of-bounds panics at runtime.

---

## 6. Related Terms


- [`From` / `Into` Traits](../level_04/from_into_traits.md) — Infallible counterparts to `TryFrom` and `TryInto`.
- [`Result<T, E>`](../level_02/result_t_e.md) — Error container returned by `try_from`.
- [Blanket Implementation](blanket_implementation.md) — Automatic implementation of `TryInto` for all types implementing `TryFrom`.
- [`as` Casting (Primitive Numeric Coercion)](../level_01/as_casting.md) — Related concept: `as` Casting (Primitive Numeric Coercion).
- [`TryFrom` and `TryInto` Traits](tryfrom_tryinto.md) — Related concept: `TryFrom` and `TryInto` Traits.

---

## 7. Key Takeaways

- Use `TryFrom` / `TryInto` whenever type conversion can fail (overflow, invalid enum tag, string parse failure).
- **Always implement `TryFrom`**, never `TryInto` directly, to preserve std blanket implementations.
- `TryFrom` returns `Result<Self, Self::Error>`, enforcing compile-time error handling.
- `TryFrom` is available in `#![no_std]` environments via `core::convert::TryFrom`.
