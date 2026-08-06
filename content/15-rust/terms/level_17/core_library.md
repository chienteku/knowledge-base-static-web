# `core` Library

> **Level 17 — Embedded & Systems Programming**
> The foundational, dependency-free subset of the Rust Standard Library — containing essential types (`Option`, `Result`, `Iterator`), language traits (`Copy`, `Clone`, `Send`), and intrinsics that require zero operating system support and zero heap memory allocations.



---

### Exercise 3: Bare-Metal Fixed-Point Mathematics and Bit Manipulation (`core::num`)

**Scenario:**
In an embedded motor speed controller (`#![no_std]`), floating-point hardware is disabled to conserve power. Motor velocity and acceleration must be calculated using 32-bit fixed-point arithmetic (`Q16.16` format) provided by `core::num` and bitwise bit manipulation methods (`leading_zeros`, `rotate_left`, `saturating_add`).

1. Implement `FixedPoint16` wrapping `i32`.
2. Implement fixed-point multiplication and saturating addition using `core` methods.
3. Include unit tests with assertions (`assert_eq!`) verifying fixed-point math and overflow saturation.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #![no_std]
> 
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub struct FixedPoint16(pub i32); // Q16.16 fixed-point format
> 
> impl FixedPoint16 {
>     pub const SCALE: i32 = 65536; // 2^16
> 
>     pub fn from_int(val: i32) -> Self {
>         Self(val.saturating_mul(Self::SCALE))
>     }
> 
>     pub fn to_int(self) -> i32 {
>         self.0 / Self::SCALE
>     }
> 
>     pub fn add(self, rhs: Self) -> Self {
>         Self(self.0.saturating_add(rhs.0))
>     }
> 
>     pub fn mul_q16(self, rhs: Self) -> Self {
>         let product = (self.0 as i64).saturating_mul(rhs.0 as i64);
>         Self((product >> 16) as i32)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_fixed_point_math() {
>         let a = FixedPoint16::from_int(10);
>         let b = FixedPoint16::from_int(5);
> 
>         let sum = a.add(b);
>         assert_eq!(sum.to_int(), 15);
> 
>         let prod = a.mul_q16(b);
>         assert_eq!(prod.to_int(), 50);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Zero-Dependency Math**: `core::num` provides saturating arithmetic (`saturating_add`, `saturating_mul`) without requiring OS or standard library support.
> 2. **Fixed-Point Scaling**: Shift arithmetic (`>> 16`) maintains fixed-point precision within 32-bit registers.
> 3. **No-Std Safety**: Pure `core` math executes safely across any microcontroller CPU target.
> 
---

## 1. Prerequisites


- [`alloc` Library](alloc_library.md) — The heap-allocating extension built on top of `core`.

---

## 2. Term Category



**Rust Core Foundation (dependency-free platform-agnostic library)**: `core` is the minimal core of the Rust Standard Library. It is implicitly embedded inside `std` (`std::option::Option` is re-exported from `core::option::Option`). In `#![no_std]` environments, `core` is always present and guarantees zero OS syscalls and zero dynamic memory allocations.



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

To enable portable code sharing between high-level web services and low-level bare-metal hardware:
- Language primitives (`bool`, `i32`, `f64`, slices `&[T]`) need math operations.
- Data structures need error handling (`Result<T, E>`) and optionality (`Option<T>`).
- Formatting needs byte string formatting (`core::fmt`).

Rust strictly separated `core` from `std`:
- **`core`**: Contains everything that can run on a bare microprocessor without an OS or heap manager.
- **`std`**: Extends `core` with OS capabilities (Files, Sockets, Threads, System Allocator).

### (2) Code Examples

#### Pure `core` Functions in `#![no_std]`

```rust
#![no_std]

use core::cmp::max;
use core::mem::size_of;

pub fn calculate_max_size<T>() -> usize {
    let base_size = size_of::<T>();
    max(base_size, 8)
}

pub fn safe_divide(numerator: u32, denominator: u32) -> Option<u32> {
    if denominator == 0 {
        None
    } else {
        Some(numerator / denominator)
    }
}
```

---

## 4. Common Mistakes & Pitfalls
### Mistake 2: Attempting to Use `std::vec::Vec` or `std::string::String` Directly from `core`

**The mistake:** Expecting `core` to contain heap-allocated collections like `Vec` or `HashMap`.

**Why it's wrong:** `core` is completely platform-agnostic and contains zero heap-allocation abstractions.

*Fix:* Import heap types from `alloc` or use fixed-capacity stack arrays in `core`.

### Mistake 3: Invoking OS-Dependent Threading or Filesystem APIs Inside `core` Code

**The mistake:** Expecting thread spawning or file I/O to be supported in `core`.

**Why it's wrong:** `core` targets bare-metal hardware where operating system primitives do not exist.

*Fix:* Restrict `core` code to pure algorithms, data formatting, and pointer manipulation.


### Mistake 1: Assuming `core` Performs Heap Allocations

**The mistake:** Expecting `core::vec::Vec` or `core::string::String` to exist in `core`.

**Why it's wrong:** `core` requires zero heap allocation capabilities. Heap types live in `alloc`.

---

## 5. Practice Exercises

### Exercise 1: Zero-Allocation `core` Slice & Iterator Processing

**Scenario:** Implement a `#![no_std]` binary payload parser `fn extract_packet<'a>(buffer: &'a [u8], magic_header: &[u8]) -> Result<(&'a [u8], &'a [u8]), &'static str>` using only `core::slice` and `core::result::Result`. The function must locate a frame delimited by `magic_header`, extract a 2-byte big-endian payload length header, and return a tuple `(payload, remaining_bytes)` without allocating heap memory or using `std`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #![no_std]
> 
> /// Parse a frame: [magic_header] [len_u16_be] [payload...] [remaining...]
> pub fn extract_packet<'a>(
>     buffer: &'a [u8],
>     magic_header: &[u8],
> ) -> Result<(&'a [u8], &'a [u8]), &'static str> {
>     if magic_header.is_empty() || buffer.len() < magic_header.len() + 2 {
>         return Err("Buffer too short or invalid magic header");
>     }
> 
>     // Locate magic header position using core::slice::windows
>     let header_pos = buffer
>         .windows(magic_header.len())
>         .position(|window| window == magic_header)
>         .ok_or("Magic header not found")?;
>
>     let payload_start = header_pos + magic_header.len();
>     if buffer.len() < payload_start + 2 {
>         return Err("Truncated header length field");
>     }
> 
>     // Read 2-byte big-endian length using core slice indexing and primitive byte conversion
>     let len_bytes: [u8; 2] = [buffer[payload_start], buffer[payload_start + 1]];
>     let payload_len = u16::from_be_bytes(len_bytes) as usize;
> 
>     let data_start = payload_start + 2;
>     let data_end = data_start + payload_len;
> 
>     if buffer.len() < data_end {
>         return Err("Incomplete payload frame");
>     }
> 
>     let payload = &buffer[data_start..data_end];
>     let remaining = &buffer[data_end..];
> 
>     Ok((payload, remaining))
> }
> 
> pub fn test_extract_packet() {
>     let raw_stream = [
>         0xAA, 0xBB, // Noise
>         0xDE, 0xAD, // Magic Header
>         0x00, 0x04, // Length (4 bytes big-endian)
>         0x01, 0x02, 0x03, 0x04, // Payload
>         0xFF, 0xFE, // Remaining stream data
>     ];
> 
>     let magic = [0xDE, 0xAD];
>     let result = extract_packet(&raw_stream, &magic);
> 
>     assert!(result.is_ok());
>     let (payload, remaining) = result.unwrap();
>     assert_eq!(payload, &[0x01, 0x02, 0x03, 0x04]);
>     assert_eq!(remaining, &[0xFF, 0xFE]);
> }
> ```
>
> #### Technical Explanation
> 
> 1. Uses `core::slice::windows` and `Iterator::position` to search for subslice patterns without standard library string or vector helpers.
> 2. `u16::from_be_bytes` converts fixed 2-byte slices directly into numeric lengths in `#![no_std]`.
> 3. Zero-copy lifetime propagation (`'a`) ensures extracted payload slices borrow directly from the input buffer without allocation.
> 
---

### Exercise 2: Custom `core::fmt::Display` & Zero-Heap Telemetry Formatter

**Scenario:** Implement `core::fmt::Display` for a telemetry sensor diagnostic enumeration `enum TelemetryStatus { Nominal { voltage_mv: u16 }, Degraded { err_code: u8 }, Critical(&'static str) }` using `core::fmt::Formatter`. Write a test function using a static fixed-size `core::fmt::Write` adapter buffer to print formatted status messages in a `#![no_std]` environment.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #![no_std]
> 
> use core::fmt::{self, Write};
> 
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub enum TelemetryStatus {
>     Nominal { voltage_mv: u16 },
>     Degraded { err_code: u8 },
>     Critical(&'static str),
> }
> 
> impl fmt::Display for TelemetryStatus {
>     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
>         match self {
>             TelemetryStatus::Nominal { voltage_mv } => {
>                 write!(f, "STATUS: NOMINAL ({} mV)", voltage_mv)
>             }
>             TelemetryStatus::Degraded { err_code } => {
>                 write!(f, "STATUS: DEGRADED (Err Code: 0x{:02X})", err_code)
>             }
>             TelemetryStatus::Critical(reason) => {
>                 write!(f, "STATUS: CRITICAL ({})", reason)
>             }
>         }
>     }
> }
> 
> // Fixed-capacity buffer implementing core::fmt::Write for no_std testing
> pub struct ArrayString<const N: usize> {
>     buf: [u8; N],
>     len: usize,
> }
> 
> impl<const N: usize> ArrayString<N> {
>     pub const fn new() -> Self {
>         Self { buf: [0; N], len: 0 }
>     }
> 
>     pub fn as_str(&self) -> &str {
>         core::str::from_utf8(&self.buf[..self.len]).unwrap_or("")
>     }
> }
> 
> impl<const N: usize> Write for ArrayString<N> {
>     fn write_str(&mut self, s: &str) -> fmt::Result {
>         let bytes = s.as_bytes();
>         if self.len + bytes.len() > N {
>             return Err(fmt::Error);
>         }
>         self.buf[self.len..self.len + bytes.len()].copy_from_slice(bytes);
>         self.len += bytes.len();
>         Ok(())
>     }
> }
> 
> pub fn test_telemetry_formatting() {
>     let status = TelemetryStatus::Degraded { err_code: 0x1F };
>     let mut out = ArrayString::<64>::new();
>     
>     write!(out, "{}", status).expect("Formatting failed");
>     assert_eq!(out.as_str(), "STATUS: DEGRADED (Err Code: 0x1F)");
> }
> ```
>
> #### Technical Explanation
> 
> 1. Custom domain data structures implement `core::fmt::Display` using `write!` macro provided entirely by `core`.
> 2. Implement `core::fmt::Write` on a stack-allocated byte array buffer (`ArrayString<N>`), enabling string formatting in embedded software without depending on `std::string::String` or heap allocation.
> 
---


## 6. Related Terms

- [`alloc` Library](alloc_library.md) — The heap-allocating extension built on top of `core`.
- [The Rust Standard Library (`std`)](std_library.md) — Related concept: The Rust Standard Library (`std`).

---

## 7. Key Takeaways

- `core` is the dependency-free foundation of Rust, requiring zero OS support and zero heap memory.
- Provides `Option`, `Result`, `Iterator`, `Copy`, `Clone`, `mem`, `fmt`, and primitive math.
- Always available in all Rust compilation targets.
