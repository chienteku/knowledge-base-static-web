# `#[repr(C)]`

> **Level 13 — Unsafe Rust & FFI**
> A representation attribute instructing the Rust compiler to lay out a `struct`, `enum`, or `union` in memory according to the target platform's C programming language ABI layout rules.

---

## 1. Prerequisites


- [FFI (Foreign Function Interface)](ffi.md) — Understanding binary data exchange across language boundaries.
- [`extern "C"`](extern_c.md) — C ABI calling conventions for foreign functions.
- [Struct](../level_02/struct.md) — Rust composite data structure definitions.

---

## 2. Term Category



**Rust Layout Attribute (C-compatible struct and enum memory layout specifier)**: `#[repr(C)]` (short for "representation C") is a data layout attribute in Rust. By default, Rust structs use the `#[repr(Rust)]` layout, where the compiler is free to reorder fields and insert padding bytes to minimize total struct size and optimize CPU alignment. Applying `#[repr(C)]` disables field reordering, placing fields in memory in the exact sequential order they are declared in code, matching standard C compiler struct padding and alignment rules.



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In standard C compilers, struct fields are stored in memory in the exact order they are declared. For example:
```c
struct CPoint {
    char flag;  // 1 byte (+ 3 bytes padding)
    int value;  // 4 bytes
};
```

In Rust's default representation (`#[repr(Rust)]`), the compiler optimizes memory alignment by reordering fields to reduce padding waste. If you write:
```rust
struct RustPoint {
    flag: u8,   // 1 byte
    value: i32, // 4 bytes
}
```
The Rust compiler might reorder the internal layout to store `value` (4 bytes) *first*, followed by `flag` (1 byte).

If a Rust program passes a `RustPoint` struct to a C function expecting a `CPoint`:
1. The C function expects `flag` at byte offset `0` and `value` at byte offset `4`.
2. But the Rust struct has `value` at byte offset `0` and `flag` at byte offset `4`.
3. Reading `point.value` in C reads garbage bytes from `flag`, resulting in memory corruption and Undefined Behavior (UB).

`#[repr(C)]` solves this by forcing `rustc` to disable field reordering and adopt the target platform's C compiler layout rules for that struct.

### (2) Reality Metaphor

Imagine a **Standardized Architectural Floor Plan Blueprint**:

- **Default Rust Layout (`#[repr(Rust)]`)** is like a custom architect who rearranges furniture, doors, and plumbing fixtures in a room to maximize spatial efficiency: the arrangement is ultra-optimized, but different for every house built.
- **C Representation (`#[repr(C)]`)** is a strict, standardized municipal building blueprint specification: every plumber, electrician, and inspector (**foreign C compiler or network driver**) knows *exactly* that the sink is at offset 0, the electrical box is at offset 4, and the drain is at offset 8. By following `#[repr(C)]`, both teams can work on the building without misplacing components.

### (3) Code Examples

#### Short Snippet (Inspecting `#[repr(C)]` Field Offsets)

```rust
use std::mem::{offset_of, size_of};

/// A C-compatible struct enforcing sequential memory layout
#[repr(C)]
pub struct PacketHeader {
    pub magic: u8,     // Offset 0 (1 byte + 3 bytes padding)
    pub packet_id: u32, // Offset 4 (4 bytes)
    pub payload_len: u16, // Offset 8 (2 bytes + 2 bytes trailing padding)
}

fn main() {
    println!("Struct size in memory: {} bytes", size_of::<PacketHeader>()); // 12 bytes
    println!("Field 'magic' offset:       {}", offset_of!(PacketHeader, magic));       // 0
    println!("Field 'packet_id' offset:   {}", offset_of!(PacketHeader, packet_id));   // 4
    println!("Field 'payload_len' offset: {}", offset_of!(PacketHeader, payload_len)); // 8
}
```

#### Fuller Example (Passing `#[repr(C)]` Struct to an `extern "C"` Function)

```rust
use std::os::raw::c_int;

/// Struct matching C library struct definition:
/// struct CPoint { int x; int y; };
#[repr(C)]
#[derive(Debug, Copy, Clone)]
pub struct CPoint {
    pub x: c_int,
    pub y: c_int,
}

// Simulated foreign C function that expects a CPoint pointer
extern "C" {
    // C prototype: void print_point(const struct CPoint* pt);
    fn print_point(pt: *const CPoint);
}

// Emulating the foreign C function behavior for testing
#[no_mangle]
pub extern "C" fn print_point_impl(pt: *const CPoint) {
    if !pt.is_null() {
        unsafe {
            let point = *pt;
            println!("C Function Received Point: x={}, y={}", point.x, point.y);
        }
    }
}

fn main() {
    let point = CPoint { x: 100, y: 200 };
    
    // Pass pointer to C function (emulated via `print_point_impl`)
    print_point_impl(&point as *const CPoint);
}
```

---

## 5. Other Memory Representation Modifiers

Besides `#[repr(C)]`, Rust supports additional representation attributes:

| Attribute | Behavior / Use Case |
| :--- | :--- |
| `#[repr(Rust)]` | Default layout; compiler can reorder fields to minimize padding. |
| `#[repr(C)]` | Sequential C ABI layout; fields are not reordered. |
| `#[repr(packed)]` | Removes all padding bytes between fields (used for unaligned hardware/network packets). |
| `#[repr(transparent)]` | Guarantees single-field wrapper struct has exact same memory layout as the inner field `T`. |
| `#[repr(u8)]` / `#[repr(i32)]` | Specifies exact integer discriminant storage type for C-compatible enums. |

---

## 6. Common Mistakes & Pitfalls

### Mistake 1: Omitting `#[repr(C)]` on Structs Passed to C FFI

**The mistake:** Passing a standard `struct` without `#[repr(C)]` to an `extern "C"` function expecting a C struct.

**Why it's wrong:** The Rust compiler may reorder fields in `#[repr(Rust)]` structs, causing field offset mismatches and memory corruption when C reads the struct fields.

*Incorrect:*
```rust
// ❌ Reordered fields cause FFI layout mismatch!
pub struct Color {
    pub r: u8,
    pub a: u32,
    pub g: u8,
    pub b: u8,
}
```

*Fix:*
```rust
// Correct: `#[repr(C)]` guarantees C layout compatibility
#[repr(C)]
pub struct Color {
    pub r: u8,
    pub a: u32,
    pub g: u8,
    pub b: u8,
}
```

### Mistake 2: Dereferencing Unaligned Fields in `#[repr(packed)]` Structs

**The mistake:** Creating a reference `&field` to an unaligned field inside a `#[repr(packed)]` struct.

**Why it's wrong:** `#[repr(packed)]` removes padding, which can place fields at unaligned memory addresses (e.g. `u32` at an odd byte offset). Creating a standard reference `&u32` to an unaligned memory address is Undefined Behavior in Rust and causes hardware crashes on architectures like ARM.

*Incorrect:*
```rust
#[repr(packed)]
struct PackedData {
    flag: u8,
    val: u32, // Unaligned! Offset is 1 instead of 4.
}

let data = PackedData { flag: 1, val: 42 };
// ❌ UNDEFINED BEHAVIOR! Creating reference to unaligned field `data.val`!
let val_ref: &u32 = &data.val; 
```

*Fix:*
```rust
#[repr(packed)]
struct PackedData {
    flag: u8,
    val: u32,
}

let data = PackedData { flag: 1, val: 42 };
// Correct: Copy unaligned field value by value instead of creating a reference
let val_copy: u32 = data.val;
println!("Packed value: {}", val_copy);
```

### Mistake 3: Omitting `#[repr(C)]` or `#[repr(u8)]` on C-Like Enums

**The mistake:** Passing a C-like `enum Mode { Read, Write }` across FFI without specifying an explicit `repr` tag.

**Why it's wrong:** Rust enums without payload do not default to C `int` discriminant sizing. To ensure the enum compiles to a C-compatible integer representation, use `#[repr(C)]` or `#[repr(u8)]` / `#[repr(i32)]`.

*Incorrect:*
```rust
// ❌ Size and representation are not guaranteed to match C `int` enum!
pub enum Status {
    Ok = 0,
    Error = 1,
}
```

*Fix:*
```rust
// Correct: Force C `int` representation for FFI enum
#[repr(C)]
pub enum Status {
    Ok = 0,
    Error = 1,
}
```

---

## 7. Practice Exercises

### Exercise 1: Binary Network Packet Header & Field Alignment Verification

**Scenario:** You are developing a telemetry packet decoder for an embedded IoT network interface. Hardware devices transmit fixed binary frames over UART. The binary protocol specification defines the C packet header as:

```c
struct TelemetryHeader {
    uint16_t sync_word;   // 2 bytes (Magic header 0xAA55)
    uint8_t  version;     // 1 byte
    uint8_t  sensor_id;   // 1 byte
    uint32_t payload_len; // 4 bytes
    uint64_t timestamp;   // 8 bytes
};
```

1. Define a Rust struct `TelemetryHeader` with `#[repr(C)]` to mirror this layout without field reordering.
2. Implement a safe constructor `from_bytes(buffer: &[u8; 16]) -> Self` that parses big-endian network byte fields into host struct values.
3. Write unit tests with `assert_eq!` verifying field byte offsets (`offset_of!`), total struct size (`size_of`), struct alignment (`align_of`), and payload parsing correctness.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use core::mem::{align_of, offset_of, size_of};
> 
> /// Embedded Telemetry Packet Header matching C ABI layout:
> /// struct TelemetryHeader {
> ///     uint16_t sync_word;   // Offset 0 (2 bytes)
> ///     uint8_t  version;     // Offset 2 (1 byte)
> ///     uint8_t  sensor_id;   // Offset 3 (1 byte)
> ///     uint32_t payload_len; // Offset 4 (4 bytes)
> ///     uint64_t timestamp;   // Offset 8 (8 bytes)
> /// };
> #[repr(C)]
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub struct TelemetryHeader {
>     pub sync_word: u16,
>     pub version: u8,
>     pub sensor_id: u8,
>     pub payload_len: u32,
>     pub timestamp: u64,
> }
> 
> impl TelemetryHeader {
>     /// Safe parser converting a 16-byte raw network buffer into a `TelemetryHeader`
>     pub fn from_bytes(buffer: &[u8; 16]) -> Self {
>         let sync_word = u16::from_be_bytes([buffer[0], buffer[1]]);
>         let version = buffer[2];
>         let sensor_id = buffer[3];
>         let payload_len = u32::from_be_bytes([buffer[4], buffer[5], buffer[6], buffer[7]]);
>         let timestamp = u64::from_be_bytes([
>             buffer[8], buffer[9], buffer[10], buffer[11],
>             buffer[12], buffer[13], buffer[14], buffer[15],
>         ]);
> 
>         Self {
>             sync_word,
>             version,
>             sensor_id,
>             payload_len,
>             timestamp,
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_telemetry_header_layout() {
>         // Verify field offsets match standard C alignment rules
>         assert_eq!(offset_of!(TelemetryHeader, sync_word), 0);
>         assert_eq!(offset_of!(TelemetryHeader, version), 2);
>         assert_eq!(offset_of!(TelemetryHeader, sensor_id), 3);
>         assert_eq!(offset_of!(TelemetryHeader, payload_len), 4);
>         assert_eq!(offset_of!(TelemetryHeader, timestamp), 8);
> 
>         // Verify struct size and alignment
>         assert_eq!(size_of::<TelemetryHeader>(), 16);
>         assert_eq!(align_of::<TelemetryHeader>(), 8);
>     }
> 
>     #[test]
>     fn test_telemetry_header_parsing() {
>         let raw_bytes: [u8; 16] = [
>             0xAA, 0x55,             // sync_word: 0xAA55
>             0x01,                   // version: 1
>             0x42,                   // sensor_id: 0x42 (66)
>             0x00, 0x00, 0x01, 0x00, // payload_len: 256
>             0x00, 0x00, 0x00, 0x00, 0x64, 0xA7, 0xB3, 0x16, // timestamp: 1688703766
>         ];
> 
>         let header = TelemetryHeader::from_bytes(&raw_bytes);
> 
>         assert_eq!(header.sync_word, 0xAA55);
>         assert_eq!(header.version, 1);
>         assert_eq!(header.sensor_id, 0x42);
>         assert_eq!(header.payload_len, 256);
>         assert_eq!(header.timestamp, 1688703766);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Disabling Field Reordering:** In default `#[repr(Rust)]`, `rustc` might reorder `timestamp` (8 bytes) to offset 0 to optimize space. `#[repr(C)]` guarantees declaration order (`sync_word` at 0, `version` at 2, `sensor_id` at 3).
> 2. **Alignment & Padding:** `payload_len` requires 4-byte alignment, placed directly at offset 4 after `sensor_id` (offset 3). `timestamp` requires 8-byte alignment, placed at offset 8.
> 3. **Offset & Size Verification:** `core::mem::offset_of!` programmatically confirms byte offsets, ensuring cross-language ABI compatibility between C firmware generators and Rust parsers.
> 
---

### Exercise 2: Embedded Hardware Peripheral Register Layout & Discriminant Enums

**Scenario:** In embedded systems development, hardware peripheral control registers are mapped directly to memory addresses. The semiconductor datasheet specifies a UART Peripheral Configuration Register block as:

```c
typedef enum {
    UART_BAUD_9600 = 0,
    UART_BAUD_115200 = 1,
} UARTBaudRate; // Explicit 1-byte discriminant

struct UARTConfig {
    uint8_t      control_enable; // 1 byte (Offset 0)
    UARTBaudRate baud_rate;      // 1 byte (Offset 1)
    uint16_t     buffer_size;    // 2 bytes (Offset 2)
    uint32_t     rx_timeout_ms;  // 4 bytes (Offset 4)
};
```

1. Define a C-compatible enum `UARTBaudRate` using `#[repr(u8)]` to enforce 1-byte discriminant storage.
2. Define `UARTConfig` using `#[repr(C)]` to ensure memory-mapped register alignment.
3. Write a safe method `as_bytes(&self) -> &[u8]` that returns a byte view of the struct for hardware memory-mapped DMA transfer.
4. Write unit tests with `assert_eq!` verifying enum size, struct offsets, total size (8 bytes), and byte representation.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use core::mem::{align_of, offset_of, size_of};
> 
> /// 1-byte integer discriminant matching C `uint8_t` enum layout
> #[repr(u8)]
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub enum UARTBaudRate {
>     Baud9600 = 0,
>     Baud115200 = 1,
> }
> 
> /// Memory-mapped UART peripheral configuration register block matching C ABI layout
> #[repr(C)]
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub struct UARTConfig {
>     pub control_enable: u8,      // Offset 0
>     pub baud_rate: UARTBaudRate, // Offset 1
>     pub buffer_size: u16,        // Offset 2
>     pub rx_timeout_ms: u32,      // Offset 4
> }
> 
> impl UARTConfig {
>     /// Safe helper returning a byte view of register block for hardware write
>     pub fn as_bytes(&self) -> &[u8] {
>         unsafe {
>             core::slice::from_raw_parts(
>                 (self as *const Self) as *const u8,
>                 size_of::<Self>(),
>             )
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_uart_enum_layout() {
>         assert_eq!(size_of::<UARTBaudRate>(), 1);
>         assert_eq!(UARTBaudRate::Baud9600 as u8, 0);
>         assert_eq!(UARTBaudRate::Baud115200 as u8, 1);
>     }
> 
>     #[test]
>     fn test_uart_config_layout() {
>         assert_eq!(offset_of!(UARTConfig, control_enable), 0);
>         assert_eq!(offset_of!(UARTConfig, baud_rate), 1);
>         assert_eq!(offset_of!(UARTConfig, buffer_size), 2);
>         assert_eq!(offset_of!(UARTConfig, rx_timeout_ms), 4);
> 
>         assert_eq!(size_of::<UARTConfig>(), 8);
>         assert_eq!(align_of::<UARTConfig>(), 4);
>     }
> 
>     #[test]
>     fn test_uart_register_byte_serialization() {
>         let config = UARTConfig {
>             control_enable: 1,
>             baud_rate: UARTBaudRate::Baud115200,
>             buffer_size: 512,
>             rx_timeout_ms: 1000,
>         };
> 
>         let bytes = config.as_bytes();
>         assert_eq!(bytes.len(), 8);
> 
>         // Byte 0: control_enable = 1
>         assert_eq!(bytes[0], 1);
>         // Byte 1: baud_rate = 1
>         assert_eq!(bytes[1], 1);
>         // Bytes 2..4: buffer_size = 512 (little-endian: 0x00, 0x02)
>         let buffer_size_val = u16::from_ne_bytes([bytes[2], bytes[3]]);
>         assert_eq!(buffer_size_val, 512);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **`#[repr(u8)]` Enums:** By default, Rust enums without payloads are not guaranteed to fit in a C `uint8_t`. `#[repr(u8)]` guarantees a 1-byte storage size matching C `enum` definitions.
> 2. **Register Packing:** `UARTConfig` has fields of size 1, 1, 2, and 4 bytes totaling exactly 8 bytes with zero internal padding.
> 3. **DMA Memory View:** Because `#[repr(C)]` enforces strict layout and padding, `as_bytes()` can safely cast the struct address into a byte slice `&[u8]` for DMA transfers to hardware registers.
> 
---

### Exercise 3: Cross-FFI Matrix Math & `#[repr(transparent)]` Newtype Wrappers

**Scenario:** You are interfacing Rust with a high-performance C linear algebra library (`struct CVector3 { float x, y, z; };`). In Rust, you want domain type safety by wrapping floating-point metrics inside a custom type `struct Meters(pub f32)`.

1. Define `CVector3` using `#[repr(C)]` to match the foreign C 3D vector struct.
2. Define a newtype wrapper `Meters` using `#[repr(transparent)]` to guarantee it shares the exact ABI and memory layout of `f32`.
3. Define a Rust struct `Position3D` with three `Meters` fields using `#[repr(C)]`.
4. Implement a zero-cost conversion method `as_c_vector(&self) -> &CVector3`.
5. Write unit tests with `assert_eq!` proving layout identity between `Position3D`, `CVector3`, and `[f32; 3]`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use core::mem::{align_of, offset_of, size_of};
> 
> /// C library struct definition: `struct CVector3 { float x, y, z; };`
> #[repr(C)]
> #[derive(Debug, Clone, Copy, PartialEq)]
> pub struct CVector3 {
>     pub x: f32,
>     pub y: f32,
>     pub z: f32,
> }
> 
> /// A zero-cost newtype wrapper representing distance in meters.
> /// `#[repr(transparent)]` guarantees identical ABI and memory representation as `f32`.
> #[repr(transparent)]
> #[derive(Debug, Clone, Copy, PartialEq)]
> pub struct Meters(pub f32);
> 
> /// Strongly-typed 3D Position struct composed of transparent `Meters` fields.
> /// `#[repr(C)]` guarantees field layout matches `CVector3` (3 x f32 = 12 bytes).
> #[repr(C)]
> #[derive(Debug, Clone, Copy, PartialEq)]
> pub struct Position3D {
>     pub x: Meters,
>     pub y: Meters,
>     pub z: Meters,
> }
> 
> impl Position3D {
>     /// Zero-cost reinterpretation of `Position3D` as a C-compatible `CVector3` reference
>     pub fn as_c_vector(&self) -> &CVector3 {
>         // SAFETY: Both types use #[repr(C)], have identical size (12 bytes),
>         // alignment (4 bytes), and field layout (3 contiguous 32-bit floats).
>         unsafe { &*(self as *const Self as *const CVector3) }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_transparent_newtype_layout() {
>         assert_eq!(size_of::<Meters>(), size_of::<f32>());
>         assert_eq!(align_of::<Meters>(), align_of::<f32>());
>     }
> 
>     #[test]
>     fn test_position_vs_cvector_layout_equality() {
>         // 1. Verify sizes
>         assert_eq!(size_of::<Position3D>(), 12);
>         assert_eq!(size_of::<CVector3>(), 12);
>         assert_eq!(size_of::<[f32; 3]>(), 12);
> 
>         // 2. Verify alignments
>         assert_eq!(align_of::<Position3D>(), 4);
>         assert_eq!(align_of::<CVector3>(), 4);
> 
>         // 3. Verify field offsets match exactly
>         assert_eq!(offset_of!(Position3D, x), offset_of!(CVector3, x));
>         assert_eq!(offset_of!(Position3D, y), offset_of!(CVector3, y));
>         assert_eq!(offset_of!(Position3D, z), offset_of!(CVector3, z));
>     }
> 
>     #[test]
>     fn test_zero_cost_ffi_reinterpretation() {
>         let pos = Position3D {
>             x: Meters(10.5),
>             y: Meters(-20.0),
>             z: Meters(5.25),
>         };
> 
>         let c_vec = pos.as_c_vector();
> 
>         assert_eq!(c_vec.x, 10.5);
>         assert_eq!(c_vec.y, -20.0);
>         assert_eq!(c_vec.z, 5.25);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **`#[repr(transparent)]` Guarantee:** Informs `rustc` that `Meters` must be treated as identical to `f32` at the ABI level, allowing zero-cost passing in CPU registers.
> 2. **Struct Composition:** Composing `Position3D` out of `Meters` with `#[repr(C)]` yields an identical memory layout to `CVector3` (three 32-bit floats in sequence).
> 3. **Zero-Cost FFI Pointer Reinterpretation:** Because layouts match 100%, `as_c_vector` reinterprets pointers without memory copying or allocation.
> 
---

## 6. Related Terms


- [FFI (Foreign Function Interface)](ffi.md) — The cross-language interface requiring `#[repr(C)]` data layouts.
- [`extern "C"`](extern_c.md) — Function calling convention string paired with `#[repr(C)]` structs.
- [`union`](union.md) — C-compatible untagged union memory type.
- [Undefined Behavior (UB)](undefined_behavior.md) — Result of field layout mismatches across FFI boundaries.

---

## 7. Key Takeaways

- `#[repr(C)]` forces Rust structs and enums to adopt C compiler memory layout rules, preventing field reordering.
- Always add `#[repr(C)]` to any struct or enum passed across an FFI boundary to C/C++ libraries.
- Use `#[repr(transparent)]` for single-field newtype wrappers to match the inner field's ABI layout.
- Use `std::mem::offset_of!` to inspect field byte positions in memory.
- Be careful with `#[repr(packed)]`: creating references to unaligned fields is Undefined Behavior.
