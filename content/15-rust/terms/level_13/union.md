# `union`

> **Level 13 — Unsafe Rust & FFI**
> A low-level data structure where all fields share the exact same starting memory location, used primarily for C FFI compatibility and raw memory type punning.

---

## 1. Prerequisites


- [`#[repr(C)]`](repr_c.md) — Understanding C-compatible struct and union memory layout alignment.
- [`unsafe` Block](unsafe_block.md) — Understanding `unsafe` superpowers and memory access contracts.
- [`extern "C"`](extern_c.md) — Foreign Function Interface binding mechanics.

---

## 2. Term Category



**Rust Low-Level Type (overlapping memory field data structure)**: A `union` in Rust is a specialized data structure declaration syntax (`pub union MyUnion { ... }`). Unlike a `struct` (where fields are laid out sequentially in memory) or an `enum` (which includes a hidden discriminant tag indicating the active variant), a `union` places all declared fields at offset 0 in the exact same memory location. Consequently, the size of a `union` is determined by the size of its largest field (aligned to the largest field's alignment requirement).



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In C, `union` is a standard feature used for two primary purposes:
1. **Memory Efficiency**: Storing different types of data in the same memory slot when only one type is active at a time.
2. **Type Punning**: Reinterpreting the bit pattern of one type (e.g. `float`) as another type (e.g. `uint32_t`) by writing to one field and reading from another.

When Rust interacts with C libraries via FFI (`bindgen`), many C APIs expose `union` parameters (e.g. Linux `epoll_data_t`, Windows `INPUT` event union, X11 protocol events). 

Without native `union` support in Rust:
- Rust developers had to simulate C unions using raw byte arrays (`[u8; 16]`) and perform manual, error-prone pointer casting (`*(ptr as *const u32)`).
- Interfacing with C headers required unsafe transmutes for every single field access.

Rust introduced native **`union`** syntax to bridge C FFI seamlessly. However, Rust treats `union` field access as inherently `unsafe`:
- Writing to any field of a `union` is **safe**.
- Reading from any field of a `union` is **`unsafe`** because the compiler cannot track which field was last written to (there is no runtime tag!). Reading an inactive variant can cause Undefined Behavior if the bit pattern is invalid for that field's type.

### (2) Reality Metaphor

Imagine a **Single Lockbox with Interchanging Document Templates**:

- A **Rust `struct`** is a cabinet with multiple drawers side-by-side: Drawer 1 holds a passport, Drawer 2 holds a driving license (**each field occupies its own distinct memory offset**).
- A **Rust `enum`** is a locked box with a colored indicator light on top: red light means passport, blue light means license (**a hidden discriminant tag tracks the active variant at runtime**).
- A **Rust `union`** is a single slot on a desk with no indicator light:
  - You can slide a Passport (**Field 1**) or a Driving License (**Field 2**) into the exact same physical slot (**offset 0**).
  - The desk slot only holds ONE document at a time (**size equals largest field**).
  - Looking inside the slot (**reading a union field**) is `unsafe` because you must remember which document was put there. If someone put a passport in, but you try to read it as a driving license (**type punning inactive variant**), you might misread a passport photo as a license number!

### (3) Code Examples

#### Short Snippet (Defining and Reading a Union)

```rust
use std::mem::size_of;

/// A simple union storing either a 32-bit integer or 4 bytes
#[repr(C)]
pub union IntOrBytes {
    pub number: u32,
    pub bytes: [u8; 4],
}

fn main() {
    let mut u = IntOrBytes { number: 0x12345678 };

    // Reading a field of a union is ALWAYS `unsafe`:
    unsafe {
        println!("Number: 0x{:X}", u.number); // 0x12345678
        println!("First byte: 0x{:X}", u.bytes[0]); // 0x78 (on little-endian)
    }

    // Size of the union is equal to size of the largest field (4 bytes):
    assert_eq!(size_of::<IntOrBytes>(), 4);
}
```

#### Fuller Example (Safe Enum Wrapper over C FFI Untagged Union)

```rust
/// Untagged C-compatible union from a foreign C library
#[repr(C)]
pub union CPayload {
    pub integer_value: i32,
    pub float_value: f32,
    pub raw_bytes: [u8; 4],
}

/// C event structure combining a discriminator tag with the untagged union
#[repr(C)]
pub struct CEvent {
    pub tag: u8, // 0 = int, 1 = float, 2 = bytes
    pub payload: CPayload,
}

/// Safe idiomatic Rust wrapper enum
#[derive(Debug, PartialEq)]
pub enum SafeEvent {
    Integer(i32),
    Float(f32),
    Raw([u8; 4]),
    Unknown,
}

impl SafeEvent {
    /// Safely parses a C untagged union using the discriminator tag
    pub fn from_c_event(event: &CEvent) -> Self {
        match event.tag {
            // Reading union fields requires an `unsafe` block!
            0 => unsafe { SafeEvent::Integer(event.payload.integer_value) },
            1 => unsafe { SafeEvent::Float(event.payload.float_value) },
            2 => unsafe { SafeEvent::Raw(event.payload.raw_bytes) },
            _ => SafeEvent::Unknown,
        }
    }
}

fn main() {
    let c_event = CEvent {
        tag: 1, // Indicates Float payload
        payload: CPayload { float_value: 3.14159 },
    };

    let safe_event = SafeEvent::from_c_event(&c_event);
    println!("Parsed safe event: {:?}", safe_event);
    assert_eq!(safe_event, SafeEvent::Float(3.14159));
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Storing Non-`Copy` Types inside Untagged Unions without `ManuallyDrop`

**The mistake:** Including fields like `String`, `Vec<T>`, or custom types with `Drop` destructors inside a `union`.

**Why it's wrong:** The Rust compiler cannot know which union field is active when the `union` leaves scope. Therefore, the compiler cannot automatically run the `Drop` destructor for non-`Copy` types in a `union`. Rust rejects non-`Copy` fields in unions unless wrapped in `std::mem::ManuallyDrop<T>`.

*Incorrect:*
```rust
// ❌ Compiler Error: field must implement `Copy` or be wrapped in `ManuallyDrop`
pub union BadUnion {
    pub text: String,
    pub number: u64,
}
```

*Fix:*
```rust
use std::mem::ManuallyDrop;

// Correct: Wrap non-Copy field in ManuallyDrop
pub union GoodUnion {
    pub text: ManuallyDrop<String>,
    pub number: u64,
}
```

### Mistake 2: Reading an Inactive Variant Containing Invalid Bit Patterns

**The mistake:** Writing an `i32` to a `union` field and then reading the inactive `bool` or `char` field when the bit pattern is invalid for that type.

**Why it's wrong:** In Rust, a `bool` MUST be strictly `0` (`false`) or `1` (`true`), and a `char` MUST be a valid Unicode scalar value. Reading a `bool` from a union field containing bit pattern `0x42` causes immediate **Undefined Behavior (UB)**.

*Incorrect:*
```rust
pub union IllegalTypePunning {
    pub byte: u8,
    pub boolean: bool,
}

let u = IllegalTypePunning { byte: 0xFE };
// ❌ UNDEFINED BEHAVIOR! 0xFE is an invalid bit pattern for `bool`!
// let val = unsafe { u.boolean }; 
```

*Fix:*
```rust
// Ensure type punning only occurs between primitive numeric types (e.g. u32 and f32)
// where all bit patterns represent valid values.
```

### Mistake 3: Omitting `#[repr(C)]` on FFI Unions

**The mistake:** Defining a `union` for FFI without adding `#[repr(C)]`.

**Why it's wrong:** Without `#[repr(C)]`, Rust's layout algorithm (`repr(Rust)`) does not guarantee C-compatible field offsets or alignment across compiler versions or FFI boundaries.

---

## 5. Practice Exercises

### Exercise 1: Hardware Register Overlay for Embedded Microcontroller (MMIO)

**Scenario:** **Problem Statement:**
In embedded microcontroller programming (`#![no_std]`), Memory-Mapped I/O (MMIO) peripheral registers are often 32 bits wide. Drivers frequently need to read/write either:
- The entire 32-bit raw register (`raw: u32`).
- Upper and lower 16-bit halves (`halves: RegisterHalves`).
- Individual 8-bit bytes (`bytes: [u8; 4]`).

**Requirements:**
Design a 32-bit hardware register overlay using a `#[repr(C)]` union:
1. Define `#[repr(C)] #[derive(Clone, Copy)] struct RegisterHalves { pub low: u16, pub high: u16 }`.
2. Define `#[repr(C)] pub union Register32` with fields `raw: u32`, `halves: RegisterHalves`, and `bytes: [u8; 4]`.
3. Implement helper methods on `Register32`: `new(val: u32)`, `read_raw(&self) -> u32`, `read_low_half(&self) -> u16`, `read_high_half(&self) -> u16`, and `mut_byte(&mut self, index: usize, val: u8)`.
4. Include unit tests verifying `size_of::<Register32>() == 4`, endianness byte access, and in-place field updates with `assert_eq!`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::mem::size_of;
> 
> #[repr(C)]
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub struct RegisterHalves {
>     pub low: u16,
>     pub high: u16,
> }
> 
> /// 32-bit hardware register overlay union
> #[repr(C)]
> pub union Register32 {
>     pub raw: u32,
>     pub halves: RegisterHalves,
>     pub bytes: [u8; 4],
> }
> 
> impl Register32 {
>     pub fn new(raw: u32) -> Self {
>         Self { raw }
>     }
> 
>     pub fn read_raw(&self) -> u32 {
>         // SAFETY: Reading 32-bit integer field is safe as all 32-bit patterns are valid u32
>         unsafe { self.raw }
>     }
> 
>     pub fn read_low_half(&self) -> u16 {
>         // SAFETY: Reading 16-bit half from repr(C) union alignment
>         unsafe { self.halves.low }
>     }
> 
>     pub fn read_high_half(&self) -> u16 {
>         unsafe { self.halves.high }
>     }
> 
>     pub fn set_byte(&mut self, index: usize, val: u8) {
>         assert!(index < 4, "Register byte index out of bounds");
>         // SAFETY: Modifying single byte in raw array
>         unsafe {
>             self.bytes[index] = val;
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_register_overlay_layout_and_access() {
>         assert_eq!(size_of::<Register32>(), 4);
> 
>         let mut reg = Register32::new(0x1234_5678);
>         assert_eq!(reg.read_raw(), 0x1234_5678);
> 
>         if cfg!(target_endian = "little") {
>             assert_eq!(reg.read_low_half(), 0x5678);
>             assert_eq!(reg.read_high_half(), 0x1234);
>         }
> 
>         // Mutate low-order byte via union overlay
>         reg.set_byte(0, 0x00);
>         if cfg!(target_endian = "little") {
>             assert_eq!(reg.read_raw(), 0x1234_5600);
>         }
>     }
> }
> ```
> 
> #### Technical Explanation
>
> 1. **Zero-Cost Overlay:** Placing `raw`, `halves`, and `bytes` in a `#[repr(C)] union` maps all three fields to offset 0 in memory. Modifying a byte in `bytes` immediately updates the corresponding bits in `raw` and `halves` without extra CPU instructions.
> 2. **Memory Alignment:** `#[repr(C)]` ensures the union is aligned to 4 bytes (the maximum alignment requirement among `u32`, `RegisterHalves`, and `[u8; 4]`), matching hardware MMIO bus requirements.
> 3. **Encapsulating `unsafe`:** The helper methods encapsulate `unsafe` union field reads inside safe Rust functions, asserting bounds checks on byte indices before performing raw writes.
> 
---

### Exercise 2: Interfacing with C FFI Untagged Unions (`CNetworkPacket`)

**Scenario:** **Problem Statement:**
Legacy C networking stacks send raw untagged binary packets over sockets. The C protocol header format is defined as:

**Requirements:**
```c
struct SensorData { uint32_t sensor_id; float reading; };
struct CommandData { uint16_t cmd_code; uint16_t flags; };

union PacketPayload {
    struct SensorData sensor;
    struct CommandData command;
};

struct CNetworkPacket {
    uint8_t payload_type; // 1 = Sensor, 2 = Command
    union PacketPayload payload;
};
```

Recreate this FFI data layout in Rust using `#[repr(C)]` structs and unions. Build a safe parsing method `SafePacket::parse(packet: &CNetworkPacket) -> Result<SafePacket, &'static str>` that inspects `payload_type` and safely extracts the correct union variant inside an `unsafe` block.

Requirements:
1. Define C structs `SensorData` and `CommandData` with `#[repr(C)] #[derive(Copy, Clone)]`.
2. Define C union `PacketPayload` with `#[repr(C)]` containing `sensor` and `command`.
3. Define C struct `CNetworkPacket` with `#[repr(C)]`.
4. Define safe Rust enum `SafePacket` with variants `Sensor { id: u32, reading: f32 }` and `Command { code: u16, flags: u16 }`.
5. Write parsing function and unit tests with `assert_eq!` verifying variant extraction.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[repr(C)]
> #[derive(Debug, Clone, Copy, PartialEq)]
> pub struct SensorData {
>     pub sensor_id: u32,
>     pub reading: f32,
> }
> 
> #[repr(C)]
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub struct CommandData {
>     pub cmd_code: u16,
>     pub flags: u16,
> }
> 
> #[repr(C)]
> pub union PacketPayload {
>     pub sensor: SensorData,
>     pub command: CommandData,
> }
> 
> #[repr(C)]
> pub struct CNetworkPacket {
>     pub payload_type: u8, // 1 = Sensor, 2 = Command
>     pub payload: PacketPayload,
> }
> 
> #[derive(Debug, PartialEq)]
> pub enum SafePacket {
>     Sensor { id: u32, reading: f32 },
>     Command { code: u16, flags: u16 },
> }
> 
> impl SafePacket {
>     pub fn parse(packet: &CNetworkPacket) -> Result<Self, &'static str> {
>         match packet.payload_type {
>             1 => {
>                 // SAFETY: `payload_type == 1` guarantees the C sender populated the `sensor` variant.
>                 let s = unsafe { packet.payload.sensor };
>                 Ok(SafePacket::Sensor {
>                     id: s.sensor_id,
>                     reading: s.reading,
>                 })
>             }
>             2 => {
>                 // SAFETY: `payload_type == 2` guarantees the C sender populated the `command` variant.
>                 let c = unsafe { packet.payload.command };
>                 Ok(SafePacket::Command {
>                     code: c.cmd_code,
>                     flags: c.flags,
>                 })
>             }
>             _ => Err("Unknown packet payload type"),
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_parse_sensor_packet() {
>         let raw_packet = CNetworkPacket {
>             payload_type: 1,
>             payload: PacketPayload {
>                 sensor: SensorData {
>                     sensor_id: 101,
>                     reading: 98.6,
>                 },
>             },
>         };
> 
>         let parsed = SafePacket::parse(&raw_packet).unwrap();
>         assert_eq!(
>             parsed,
>             SafePacket::Sensor {
>                 id: 101,
>                 reading: 98.6
>             }
>         );
>     }
> 
>     #[test]
>     fn test_parse_command_packet() {
>         let raw_packet = CNetworkPacket {
>             payload_type: 2,
>             payload: PacketPayload {
>                 command: CommandData {
>                     cmd_code: 0x05,
>                     flags: 0x80,
>                 },
>             },
>         };
> 
>         let parsed = SafePacket::parse(&raw_packet).unwrap();
>         assert_eq!(
>             parsed,
>             SafePacket::Command {
>                 code: 0x05,
>                 flags: 0x80
>             }
>         );
>     }
> 
>     #[test]
>     fn test_unknown_packet_type() {
>         let raw_packet = CNetworkPacket {
>             payload_type: 99,
>             payload: PacketPayload {
>                 command: CommandData {
>                     cmd_code: 0,
>                     flags: 0,
>                 },
>             },
>         };
> 
>         assert!(SafePacket::parse(&raw_packet).is_err());
>     }
> }
> ```
> 
> #### Technical Explanation
>
> 1. **C Foreign Interoperability:** `#[repr(C)]` guarantees that Rust uses the exact same field offsets, memory padding, and alignment rules as C compilers (GCC/Clang).
> 2. **Untagged Union Safety Contract:** The C protocol uses `payload_type` as a discriminant tag. In Rust, we inspect `payload_type` inside a safe `match` statement before entering `unsafe` blocks to read the active variant.
> 3. **Idiomatic Rust Conversion:** Converting C-style raw structures into an idiomatic Rust `enum` isolates unsafe FFI boundaries at the edge of your application.
> 
---

### Exercise 3: Safe Polymorphic Node Storage using `ManuallyDrop<T>`

**Scenario:** **Problem Statement:**
Standard Rust `union` declarations require all field types to implement `Copy` or be wrapped in `std::mem::ManuallyDrop<T>`. When building custom memory-efficient tree or graph nodes that can hold either a primitive `u64` integer or a heap-allocated `String`, using `ManuallyDrop<T>` prevents automatic destruction while allowing polymorphic memory storage.

**Requirements:**
Design a memory-optimized node storage structure:
1. Define a `union NodeValue` with fields `int_val: u64` and `str_val: ManuallyDrop<String>`.
2. Define a wrapper `struct ValueNode` containing a `tag: u8` (0 for integer, 1 for string) and `value: NodeValue`.
3. Implement constructors `ValueNode::new_int(val: u64)` and `ValueNode::new_str(val: &str)`.
4. Implement getter methods returning `Option<u64>` and `Option<&str>`.
5. Implement `Drop` for `ValueNode` to manually drop the `ManuallyDrop<String>` variant when `tag == 1`.
6. Write unit tests with assertions (`assert_eq!`) verifying memory allocation cleanup and value retrieval.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::mem::ManuallyDrop;
> 
> pub union NodeValue {
>     pub int_val: u64,
>     pub str_val: ManuallyDrop<String>,
> }
> 
> pub struct ValueNode {
>     tag: u8, // 0 = int_val, 1 = str_val
>     value: NodeValue,
> }
> 
> impl ValueNode {
>     pub fn new_int(val: u64) -> Self {
>         Self {
>             tag: 0,
>             value: NodeValue { int_val: val },
>         }
>     }
> 
>     pub fn new_str(val: &str) -> Self {
>         Self {
>             tag: 1,
>             value: NodeValue {
>                 str_val: ManuallyDrop::new(String::from(val)),
>             },
>         }
>     }
> 
>     pub fn as_int(&self) -> Option<u64> {
>         if self.tag == 0 {
>             // SAFETY: `tag == 0` guarantees `int_val` is the active variant
>             Some(unsafe { self.value.int_val })
>         } else {
>             None
>         }
>     }
> 
>     pub fn as_str(&self) -> Option<&str> {
>         if self.tag == 1 {
>             // SAFETY: `tag == 1` guarantees `str_val` is the active variant
>             Some(unsafe { &*self.value.str_val })
>         } else {
>             None
>         }
>     }
> }
> 
> impl Drop for ValueNode {
>     fn drop(&mut self) {
>         if self.tag == 1 {
>             // SAFETY: `tag == 1` means `str_val` was initialized.
>             // Manually drop the String to prevent memory leaks!
>             unsafe {
>                 ManuallyDrop::drop(&mut self.value.str_val);
>             }
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_int_node_lifecycle() {
>         let node = ValueNode::new_int(42);
>         assert_eq!(node.as_int(), Some(42));
>         assert_eq!(node.as_str(), None);
>     }
> 
>     #[test]
>     fn test_str_node_lifecycle() {
>         let node = ValueNode::new_str("Rust Polymorphic Union");
>         assert_eq!(node.as_str(), Some("Rust Polymorphic Union"));
>         assert_eq!(node.as_int(), None);
>         // `node` goes out of scope here; `Drop` executes `ManuallyDrop::drop` safely
>     }
> }
> ```
> 
> #### Technical Explanation
>
> 1. **Why `ManuallyDrop<T>` is Required:** Non-`Copy` types (like `String`) manage heap memory. Rust forbids raw non-`Copy` fields in unions because the compiler does not know which field to drop when the union is destroyed. `ManuallyDrop<T>` disables automatic drop checking.
> 2. **Custom Destructor Implementation:** We implement `Drop for ValueNode` to inspect the runtime `tag`. When `tag == 1`, we invoke `unsafe { ManuallyDrop::drop(&mut self.value.str_val) }` to free heap string memory without leaking.
> 3. **Safety Isolation:** Encapsulating `NodeValue` inside `ValueNode` ensures that external callers interact with safe APIs (`as_int()`, `as_str()`) while maintaining 0-cost memory optimization under the hood.
> 
> 
> 
---

## 6. Related Terms


- [`unsafe` Block](unsafe_block.md) — Unsafe block semantics and memory safety contracts.
- [`extern "C"`](extern_c.md) — Foreign function interaction.
- [Undefined Behavior (UB)](undefined_behavior.md) — Memory safety violations to avoid when reading union fields.

---

## 7. Key Takeaways

- A `union` places all declared fields at offset 0 in the exact same memory location; its size equals the size of its largest field.
- Writing to a `union` field is safe; reading from a `union` field is **`unsafe`** because Rust cannot track the active variant.
- Non-`Copy` fields inside a `union` must be wrapped in `std::mem::ManuallyDrop<T>` to prevent compiler drop errors.
- Always add `#[repr(C)]` when using `union` for C FFI interoperability.
- Reading an inactive variant containing invalid bit patterns for that target type causes Undefined Behavior.
