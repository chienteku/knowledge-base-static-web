# `core` Library

> **Level 17 — Embedded & Systems Programming**
> The foundational, dependency-free subset of the Rust Standard Library — containing essential types (`Option`, `Result`, `Iterator`), language traits (`Copy`, `Clone`, `Send`), and intrinsics that require zero operating system support and zero heap memory allocations.

---

## 1. Prerequisites


- [`alloc` Library](alloc_library.md) — The heap-allocating extension built on top of `core`.

---

## 2. Term Category

**Standard Library / Core / Embedded**: `core` is the minimal core of the Rust Standard Library. It is implicitly embedded inside `std` (`std::option::Option` is re-exported from `core::option::Option`). In `#![no_std]` environments, `core` is always present and guarantees zero OS syscalls and zero dynamic memory allocations.

---

## 3. Environment Context

**Universal Foundation**: `core` is available everywhere — from 8-bit microcontrollers with 1 KB of RAM to 64-bit cloud servers.

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

### Mistake 1: Assuming `core` Performs Heap Allocations

**The mistake:** Expecting `core::vec::Vec` or `core::string::String` to exist in `core`.

**Why it's wrong:** `core` requires zero heap allocation capabilities. Heap types live in `alloc`.

---

## 6. Practice Exercises

### Exercise 1: Zero-Allocation `core` Slice & Iterator Processing

**Problem:** Implement a `#![no_std]` binary payload parser `fn extract_packet<'a>(buffer: &'a [u8], magic_header: &[u8]) -> Result<(&'a [u8], &'a [u8]), &'static str>` using only `core::slice` and `core::result::Result`. The function must locate a frame delimited by `magic_header`, extract a 2-byte big-endian payload length header, and return a tuple `(payload, remaining_bytes)` without allocating heap memory or using `std`.

> [!check]- Answer
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
> **Explanation:** 
> 1. Uses `core::slice::windows` and `Iterator::position` to search for subslice patterns without standard library string or vector helpers.
> 2. `u16::from_be_bytes` converts fixed 2-byte slices directly into numeric lengths in `#![no_std]`.
> 3. Zero-copy lifetime propagation (`'a`) ensures extracted payload slices borrow directly from the input buffer without allocation.

---

### Exercise 2: Custom `core::fmt::Display` & Zero-Heap Telemetry Formatter

**Problem:** Implement `core::fmt::Display` for a telemetry sensor diagnostic enumeration `enum TelemetryStatus { Nominal { voltage_mv: u16 }, Degraded { err_code: u8 }, Critical(&'static str) }` using `core::fmt::Formatter`. Write a test function using a static fixed-size `core::fmt::Write` adapter buffer to print formatted status messages in a `#![no_std]` environment.

> [!check]- Answer
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
> **Explanation:** 
> 1. Custom domain data structures implement `core::fmt::Display` using `write!` macro provided entirely by `core`.
> 2. Implement `core::fmt::Write` on a stack-allocated byte array buffer (`ArrayString<N>`), enabling string formatting in embedded software without depending on `std::string::String` or heap allocation.

---

---

## 6. Related Terms

- [`alloc` Library](alloc_library.md) — The heap-allocating extension built on top of `core`.
- [The Rust Standard Library (`std`)](std_library.md) — Related concept: The Rust Standard Library (`std`).

---

## 7. Key Takeaways

- `core` is the dependency-free foundation of Rust, requiring zero OS support and zero heap memory.
- Provides `Option`, `Result`, `Iterator`, `Copy`, `Clone`, `mem`, `fmt`, and primitive math.
- Always available in all Rust compilation targets.
