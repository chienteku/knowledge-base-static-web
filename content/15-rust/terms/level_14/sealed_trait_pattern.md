# Sealed Trait Pattern

> **Level 14 — Advanced Traits & Type System**
> An API design pattern that prevents external downstream crates from implementing a public trait by requiring a private, un-exported supertrait (`pub trait MyTrait: private::Sealed`).

---

## 1. Prerequisites


- [Trait](../level_04/trait.md) — Standard trait definitions and implementations.
- [Supertraits](supertraits.md) — Declaring trait dependencies (`pub trait Sub: Super`).
- [Visibility and Modules (`pub`, `mod`)](../level_07/visibility_and_modules.md) — Private module item visibility rules (`mod private`, `pub(crate)`).

---

## 2. Term Category



**Rust Design Pattern (downstream trait implementation boundary)**: The Sealed Trait Pattern is an API architecture idiom in Rust. By defining a private, unreachable supertrait inside a private module (`mod private { pub trait Sealed {} }`) and making your public trait depend on it (`pub trait PublicTrait: private::Sealed {}`), downstream crates can *use* `PublicTrait` as a trait bound, but *cannot implement* `PublicTrait` for their own custom types.



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In Rust, when you declare a `pub trait MyTrait`, any external downstream crate that imports your library can write `impl MyTrait for MyCustomType`. 

While extensibility is usually desirable, there are two critical scenarios where open trait implementations cause major problems:
1. **API SemVer Stability & Breaking Changes**: If downstream crates implement your public trait, adding a new method to `MyTrait` in a minor version update (`v1.1.0`) breaks all downstream implementations, violating Semantic Versioning (SemVer).
2. **Exhaustive Internal Assumptions**: Library authors often need to guarantee that *only* a specific set of internal types (e.g. `u8`, `u16`, `u32`, `u64`) implement a trait so internal `unsafe` code or optimized algorithms can rely on exhaustive type guarantees without handling unexpected third-party implementations.

In object-oriented languages (like Java or C#), classes and interfaces can be marked with the `final` or `sealed` keyword. Rust does not have a `sealed` keyword built into the language.

The **Sealed Trait Pattern** solves this using Rust's module visibility and supertrait system:
- Step 1: Create a private module `mod private { pub trait Sealed {} }`. Because `mod private` is private, external crates cannot reference `private::Sealed`.
- Step 2: Declare your public trait with `private::Sealed` as a supertrait: `pub trait MyTrait: private::Sealed`.
- Step 3: Implement `private::Sealed` for your library's internal types inside your crate.

External crates can use `MyTrait` as a type bound (`fn process<T: MyTrait>(val: T)`), but if they try to write `impl MyTrait for ExternalType`, the compiler blocks them because `ExternalType` cannot implement the unreachable supertrait `private::Sealed`!

### (2) Reality Metaphor

Imagine an **Exclusive VIP Airport Lounge Pass**:

- An **Open Trait (`pub trait OpenLounge`)** is like a public park bench: anyone can bring their own folding chair (**implement the trait for their own type**) and sit down.
- The **Sealed Trait Pattern** is an exclusive airport lounge membership:
  - To enter the VIP Lounge (**implement `pub trait VIPLounge`**), you must present a biometric security chip embedded inside an official Government Passport (**supertrait `private::Sealed`**).
  - The security chip factory (**`mod private`**) is closed to the public. Downstream visitors (**external crates**) can see the VIP Lounge entrance (**use `VIPLounge` in generic bounds**), but they can never forge a security chip (**implement `private::Sealed`**).

### (3) Code Examples

#### Short Snippet (Defining a Sealed Trait)

```rust
// 1. Private module containing the un-exported `Sealed` supertrait
mod private {
    pub trait Sealed {}
}

// 2. Public trait bound by the private `Sealed` supertrait
pub trait Expressible: private::Sealed {
    fn express_bytes(&self) -> &[u8];
}

// 3. Internal types implement `private::Sealed` AND `Expressible` inside this crate:
impl private::Sealed for u32 {}
impl Expressible for u32 {
    fn express_bytes(&self) -> &[u8] {
        // Safe byte slice conversion
        unsafe { std::slice::from_raw_parts(self as *const u32 as *const u8, 4) }
    }
}

fn main() {
    let num: u32 = 0x12345678;
    // External callers can USE `Expressible` methods:
    println!("Bytes: {:?}", num.express_bytes());
}
```

#### Fuller Example (Simulating External Crate Rejection of Sealed Trait)

```rust
// --- LIBRARY CRATE CODE ---
pub mod my_library {
    mod private {
        pub trait Sealed {}
    }

    /// A sealed trait representing primitive fixed-size numeric types.
    /// Downstream crates CANNOT implement `FixedNumeric` for their custom structs.
    pub trait FixedNumeric: private::Sealed {
        fn byte_size(&self) -> usize;
    }

    // Seal and implement for internal library types:
    impl private::Sealed for u8 {}
    impl FixedNumeric for u8 { fn byte_size(&self) -> usize { 1 } }

    impl private::Sealed for u32 {}
    impl FixedNumeric for u32 { fn byte_size(&self) -> usize { 4 } }
}

// --- DOWNSTREAM USER CRATE CODE ---
use my_library::FixedNumeric;

struct CustomBigInt;

// ❌ COMPILER ERROR if downstream user attempts to implement `FixedNumeric`:
// impl FixedNumeric for CustomBigInt {
//     fn byte_size(&self) -> usize { 16 }
// }
// Compiler Error E0224 / E0603: trait `Sealed` is private in module `my_library::private`

fn process_numeric<T: FixedNumeric>(val: T) {
    println!("Processing fixed numeric of size {} bytes", val.byte_size());
}

fn main() {
    process_numeric(42u32); // Works perfectly for sealed internal types!
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Exposing `mod private` as `pub mod private`

**The mistake:** Marking the private module as `pub mod private` or exporting `pub trait Sealed` publicly.

**Why it's wrong:** If `Sealed` becomes publicly accessible, downstream crates can write `impl private::Sealed for MyType`, completely defeating the purpose of the Sealed Trait Pattern!

*Incorrect:*
```rust
// ❌ Public module breaks the seal! External crates can implement `Sealed`!
pub mod private { 
    pub trait Sealed {}
}
pub trait MyTrait: private::Sealed {}
```

*Fix:*
```rust
// Correct: Keep `mod private` non-public (or `pub(crate)`)
mod private {
    pub trait Sealed {}
}
pub trait MyTrait: private::Sealed {}
```

### Mistake 2: Forgetting to Document that a Public Trait is Sealed

**The mistake:** Sealing a trait without adding a `# Sealing` or warning note in the public documentation comments.

**Why it's wrong:** Downstream developers will be confused when `rustc` rejects their trait implementation with an error mentioning a private supertrait. Clearly document that the trait is sealed against external implementations.

*Incorrect:*
```rust
// ❌ No doc comment explaining why `impl MyTrait for User` fails
pub trait MyTrait: private::Sealed {}
```

*Fix:*
```rust
/// A public trait for custom serialization.
///
/// # Sealing
/// This trait is **sealed** and cannot be implemented for types outside this crate.
pub trait MyTrait: private::Sealed {}
```

### Mistake 3: Over-Sealing Traits when Extensibility is Expected

**The mistake:** Sealing every public trait in a library out of habit, preventing users from creating legitimate custom plugin implementations.

**Why it's wrong:** Sealing restricts library extensibility. Only seal traits when SemVer non-breaking evolution or strict internal invariant guarantees require it.

---

## 5. Practice Exercises

### Exercise 1: Embedded Hardware Register Access Control (no_std)

**Scenario:** **Problem Statement:**
In embedded driver development (e.g. ARM Cortex-M or RISC-V MMIO peripherals), hardware register access structures require generic memory access over valid register primitive types (`u8`, `u16`, `u32`). To prevent downstream users from instantiating generic register blocks with invalid or non-hardware-aligned types (such as `u64`, `usize`, or custom structs) which would violate memory-aligned MMIO safety assumptions, the HAL crate seals the `RegisterWidth` trait.

**Requirements:**
Write a `#![no_std]` hardware register access abstraction crate with a sealed `RegisterWidth` trait:
1. Create a private module `mod private { pub trait Sealed {} }`.
2. Define a public trait `pub trait RegisterWidth: private::Sealed + Copy` with methods `mask(self, mask_bits: Self) -> Self` and `is_flag_set(self, bit: u8) -> bool`.
3. Implement `private::Sealed` and `RegisterWidth` for primitive hardware widths `u8`, `u16`, and `u32`.
4. Define a generic MMIO register container `pub struct Register<T: RegisterWidth>` offering `new`, `read`, `write`, `read_masked`, and `is_bit_high`.
5. Include unit tests with assertions (`assert_eq!`, `assert!`) demonstrating register bit manipulation.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #![no_std]
> 
> pub mod hal {
>     // 1. Private module containing the un-exported supertrait
>     mod private {
>         pub trait Sealed {}
>     }
> 
>     /// Sealed trait representing valid MMIO register data widths.
>     ///
>     /// # Sealing
>     /// This trait is **sealed** and cannot be implemented by downstream types.
>     /// Only `u8`, `u16`, and `u32` represent valid hardware register primitives.
>     pub trait RegisterWidth: private::Sealed + Copy {
>         fn mask(self, mask_bits: Self) -> Self;
>         fn is_flag_set(self, bit: u8) -> bool;
>     }
> 
>     // Seal and implement for u8
>     impl private::Sealed for u8 {}
>     impl RegisterWidth for u8 {
>         #[inline]
>         fn mask(self, mask_bits: Self) -> Self {
>             self & mask_bits
>         }
>         #[inline]
>         fn is_flag_set(self, bit: u8) -> bool {
>             (self & (1 << bit)) != 0
>         }
>     }
> 
>     // Seal and implement for u16
>     impl private::Sealed for u16 {}
>     impl RegisterWidth for u16 {
>         #[inline]
>         fn mask(self, mask_bits: Self) -> Self {
>             self & mask_bits
>         }
>         #[inline]
>         fn is_flag_set(self, bit: u8) -> bool {
>             (self & (1 << bit)) != 0
>         }
>     }
> 
>     // Seal and implement for u32
>     impl private::Sealed for u32 {}
>     impl RegisterWidth for u32 {
>         #[inline]
>         fn mask(self, mask_bits: Self) -> Self {
>             self & mask_bits
>         }
>         #[inline]
>         fn is_flag_set(self, bit: u8) -> bool {
>             (self & (1 << bit)) != 0
>         }
>     }
> 
>     /// Safe Memory-Mapped I/O Register wrapper
>     pub struct Register<T: RegisterWidth> {
>         value: T,
>     }
> 
>     impl<T: RegisterWidth> Register<T> {
>         pub const fn new(initial: T) -> Self {
>             Self { value: initial }
>         }
> 
>         pub fn read(&self) -> T {
>             self.value
>         }
> 
>         pub fn write(&mut self, val: T) {
>             self.value = val;
>         }
> 
>         pub fn read_masked(&self, mask: T) -> T {
>             self.value.mask(mask)
>         }
> 
>         pub fn is_bit_high(&self, bit: u8) -> bool {
>             self.value.is_flag_set(bit)
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::hal::*;
> 
>     #[test]
>     fn test_u8_register_operations() {
>         let mut reg = Register::new(0b1010_1100u8);
>         assert_eq!(reg.read(), 0b1010_1100u8);
>         assert!(reg.is_bit_high(7));
>         assert!(!reg.is_bit_high(0));
> 
>         assert_eq!(reg.read_masked(0b0000_1111u8), 0b0000_1100u8);
> 
>         reg.write(0xFFu8);
>         assert_eq!(reg.read(), 0xFFu8);
>     }
> 
>     #[test]
>     fn test_u32_register_operations() {
>         let mut reg = Register::new(0x8000_0001u32);
>         assert!(reg.is_bit_high(31));
>         assert!(reg.is_bit_high(0));
>         assert!(!reg.is_bit_high(16));
> 
>         assert_eq!(reg.read_masked(0x0000_FFFFu32), 0x0000_0001u32);
>         reg.write(0x1234_5678u32);
>         assert_eq!(reg.read(), 0x1234_5678u32);
>     }
> }
> ```
> 
> #### Technical Explanation
>
> 1. **Un-exported Supertrait Constraint:** `RegisterWidth: private::Sealed` mandates that any type `T` implementing `RegisterWidth` MUST also implement `private::Sealed`. Because `mod private` is private to the crate, downstream crates cannot write `impl private::Sealed for MyStruct`, preventing downstream users from implementing `RegisterWidth` for unsupported types like `u64` or custom structs.
> 2. **Embedded `#![no_std]` Safety:** Embedded microcontrollers rely on strict hardware bus alignment (e.g., ARM Cortex-M 8-bit, 16-bit, and 32-bit MMIO accesses). Sealing `RegisterWidth` guarantees that `Register<T>` can only ever be instantiated with valid, hardware-supported primitive types.
> 3. **Trait Bounds & Zero-Cost Abstraction:** Downstream code can use `Register<T>` generically without performance penalty, as Rust monomorphizes `Register<u8>`, `Register<u16>`, and `Register<u32>` into direct inline bitwise hardware instructions.
> 
---

### Exercise 2: SemVer-Safe Network Protocol Frame Pipeline

**Scenario:** **Problem Statement:**
When authoring a public networking or serialization crate, library maintainers need the ability to update trait definitions in minor crate updates (e.g., SemVer `1.0.0` -> `1.1.0`) without causing breaking changes for downstream consumers. If a public trait `ProtocolFrame` is open to downstream implementation, adding a new method (e.g., `compute_crc32(&self) -> u32`) to the trait breaks every downstream crate that implemented `ProtocolFrame`.

**Requirements:**
Design an API-stable network protocol frame processor using the Sealed Trait Pattern:
1. Define a public crate module `protocol`.
2. Inside `protocol`, define `mod private { pub trait Sealed {} }`.
3. Create `pub trait ProtocolFrame: private::Sealed` with methods `header_id(&self) -> u8`, `payload(&self) -> &[u8]`, and a defaulted helper method `compute_crc32(&self) -> u32`.
4. Implement `ProtocolFrame` for internal types `PingFrame` and `TelemetryFrame`.
5. Write a public pipeline function `pub fn serialize_frame<F: ProtocolFrame>(frame: &F) -> Vec<u8>` that packs the header, payload, and CRC32 checksum.
6. Write comprehensive unit tests verifying frame serialization and checksum verification using `assert_eq!`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub mod protocol {
>     mod private {
>         pub trait Sealed {}
>     }
> 
>     /// A sealed trait representing serializable network protocol frames.
>     ///
>     /// # SemVer Guarantee
>     /// This trait is **sealed**. Internal crate maintainers may add new methods
>     /// or internal framing protocols in minor releases without breaking external code.
>     pub trait ProtocolFrame: private::Sealed {
>         fn header_id(&self) -> u8;
>         fn payload(&self) -> &[u8];
> 
>         /// Internal checksum computation added in v1.1.0 without breaking API compatibility.
>         fn compute_crc32(&self) -> u32 {
>             let mut crc: u32 = 0xFFFF_FFFF;
>             for &byte in self.payload() {
>                 crc ^= u32::from(byte);
>                 for _ in 0..8 {
>                     if (crc & 1) != 0 {
>                         crc = (crc >> 1) ^ 0xEDB8_8320;
>                     } else {
>                         crc >>= 1;
>                     }
>                 }
>             }
>             !crc
>         }
>     }
> 
>     // Ping Frame implementation
>     pub struct PingFrame {
>         pub timestamp: u64,
>     }
> 
>     impl private::Sealed for PingFrame {}
>     impl ProtocolFrame for PingFrame {
>         fn header_id(&self) -> u8 { 0x01 }
>         fn payload(&self) -> &[u8] {
>             unsafe {
>                 std::slice::from_raw_parts(
>                     &self.timestamp as *const u64 as *const u8,
>                     std::mem::size_of::<u64>(),
>                 )
>             }
>         }
>     }
> 
>     // Telemetry Data Frame implementation
>     pub struct TelemetryFrame {
>         pub sensor_id: u8,
>         pub data: Vec<u8>,
>     }
> 
>     impl private::Sealed for TelemetryFrame {}
>     impl ProtocolFrame for TelemetryFrame {
>         fn header_id(&self) -> u8 { 0x02 }
>         fn payload(&self) -> &[u8] {
>             &self.data
>         }
>     }
> 
>     /// Transmit pipeline for sending sealed frames over network socket buffers
>     pub fn serialize_frame<F: ProtocolFrame>(frame: &F) -> Vec<u8> {
>         let payload = frame.payload();
>         let crc = frame.compute_crc32();
>         
>         let mut buffer = Vec::with_capacity(1 + 4 + payload.len());
>         buffer.push(frame.header_id());
>         buffer.extend_from_slice(&crc.to_be_bytes());
>         buffer.extend_from_slice(payload);
>         buffer
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::protocol::*;
> 
>     #[test]
>     fn test_ping_frame_serialization() {
>         let ping = PingFrame { timestamp: 0x1122334455667788 };
>         let serialized = serialize_frame(&ping);
> 
>         // Verify header byte (0x01)
>         assert_eq!(serialized[0], 0x01);
>         // Length: header (1 byte) + CRC (4 bytes) + u64 timestamp (8 bytes) = 13 bytes
>         assert_eq!(serialized.len(), 13);
>     }
> 
>     #[test]
>     fn test_telemetry_frame_crc_consistency() {
>         let telemetry = TelemetryFrame {
>             sensor_id: 10,
>             data: vec![0xDE, 0xAD, 0xBE, 0xEF],
>         };
> 
>         let serialized = serialize_frame(&telemetry);
>         assert_eq!(serialized[0], 0x02);
>         assert_eq!(serialized.len(), 1 + 4 + 4);
> 
>         // Verify CRC matches direct compute call
>         let expected_crc = telemetry.compute_crc32();
>         let crc_bytes: [u8; 4] = serialized[1..5].try_into().unwrap();
>         assert_eq!(u32::from_be_bytes(crc_bytes), expected_crc);
>     }
> }
> ```
> 
> #### Technical Explanation
>
> 1. **SemVer Breaking Changes in Open Traits:** In Rust, if a public trait `pub trait ProtocolFrame` is open to external implementation, adding any new non-defaulted method (or even defaulted internal hooks) to `ProtocolFrame` in a crate update `v1.1.0` is a **major breaking change** because external `impl ProtocolFrame for ExternalStruct` blocks will fail to compile.
> 2. **Preventing API Fragmentation via Sealing:** By sealing `ProtocolFrame`, crate maintainers retain exclusive ownership of trait implementation. As a result, adding new trait methods (like `compute_crc32`), optimizing buffer layouts, or adding new protocol methods in minor version updates guarantees full backwards compatibility.
> 3. **Pipeline Generic Bounds:** Downstream callers can consume `serialize_frame<F: ProtocolFrame>(frame: &F)` with total type safety, leveraging static dispatch without runtime vtable overhead.
> 
---

### Exercise 3: Sealed Typestate Machine for Hardware Peripherals

**Scenario:** **Problem Statement:**
The **Typestate Pattern** uses Rust's type system to represent state machine states as static types (e.g. `BusController<Uninitialized>`, `BusController<Idle>`, `BusController<Active>`). To ensure that third-party code cannot declare unauthorized custom state types (e.g., `impl BusState for BypassState`), which could bypass state machine transition invariants and place hardware in an illegal operating mode, the marker trait `BusState` must be sealed.

**Requirements:**
Design a sealed typestate state machine for a SPI/I2C peripheral bus controller:
1. Define a private module `mod private { pub trait Sealed {} }`.
2. Define a public sealed trait `pub trait BusState: private::Sealed { fn name() -> &'static str; }`.
3. Create concrete state marker types: `Uninitialized`, `Idle`, and `Active`. Implement `private::Sealed` and `BusState` for all three.
4. Define generic struct `pub struct BusController<S: BusState>` storing a `bus_id: u8` and `frequency_khz: u32`.
5. Implement state transitions:
   - `BusController<Uninitialized>::new(bus_id: u8) -> Self`
   - `BusController<Uninitialized>::initialize(self, frequency_khz: u32) -> BusController<Idle>`
   - `BusController<Idle>::activate(self) -> BusController<Active>`
   - `BusController<Active>::transfer(&self, data: &[u8]) -> Result<usize, &'static str>`
   - `BusController<Active>::deactivate(self) -> BusController<Idle>`
6. Write unit tests checking that state transitions succeed, frequency configuration is preserved, and state names report correctly using `assert_eq!`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub mod bus {
>     mod private {
>         pub trait Sealed {}
>     }
> 
>     /// Sealed marker trait for valid peripheral bus states.
>     ///
>     /// # Sealing
>     /// Downstream code cannot implement `BusState` for custom marker types,
>     /// guaranteeing the hardware state machine remains exhaustive and closed.
>     pub trait BusState: private::Sealed {
>         fn name() -> &'static str;
>     }
> 
>     // Concrete State Marker Types
>     pub struct Uninitialized;
>     pub struct Idle;
>     pub struct Active;
> 
>     impl private::Sealed for Uninitialized {}
>     impl BusState for Uninitialized {
>         fn name() -> &'static str { "Uninitialized" }
>     }
> 
>     impl private::Sealed for Idle {}
>     impl BusState for Idle {
>         fn name() -> &'static str { "Idle" }
>     }
> 
>     impl private::Sealed for Active {}
>     impl BusState for Active {
>         fn name() -> &'static str { "Active" }
>     }
> 
>     /// Typestate-enforced Bus Controller
>     pub struct BusController<S: BusState> {
>         bus_id: u8,
>         frequency_khz: u32,
>         _state: std::marker::PhantomData<S>,
>     }
> 
>     impl BusController<Uninitialized> {
>         pub fn new(bus_id: u8) -> Self {
>             Self {
>                 bus_id,
>                 frequency_khz: 0,
>                 _state: std::marker::PhantomData,
>             }
>         }
> 
>         pub fn initialize(self, frequency_khz: u32) -> BusController<Idle> {
>             BusController {
>                 bus_id: self.bus_id,
>                 frequency_khz,
>                 _state: std::marker::PhantomData,
>             }
>         }
>     }
> 
>     impl BusController<Idle> {
>         pub fn activate(self) -> BusController<Active> {
>             BusController {
>                 bus_id: self.bus_id,
>                 frequency_khz: self.frequency_khz,
>                 _state: std::marker::PhantomData,
>             }
>         }
> 
>         pub fn frequency(&self) -> u32 {
>             self.frequency_khz
>         }
>     }
> 
>     impl BusController<Active> {
>         pub fn transfer(&self, data: &[u8]) -> Result<usize, &'static str> {
>             if data.is_empty() {
>                 Err("Empty transfer buffer")
>             } else {
>                 // Simulate bus write execution
>                 Ok(data.len())
>             }
>         }
> 
>         pub fn deactivate(self) -> BusController<Idle> {
>             BusController {
>                 bus_id: self.bus_id,
>                 frequency_khz: self.frequency_khz,
>                 _state: std::marker::PhantomData,
>             }
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::bus::*;
> 
>     #[test]
>     fn test_typestate_transitions() {
>         let uninit = BusController::<Uninitialized>::new(1);
>         assert_eq!(Uninitialized::name(), "Uninitialized");
> 
>         let idle = uninit.initialize(400); // 400 kHz I2C mode
>         assert_eq!(Idle::name(), "Idle");
>         assert_eq!(idle.frequency(), 400);
> 
>         let active = idle.activate();
>         assert_eq!(Active::name(), "Active");
> 
>         let bytes_sent = active.transfer(&[0xAA, 0xBB, 0xCC]).unwrap();
>         assert_eq!(bytes_sent, 3);
> 
>         let idle_again = active.deactivate();
>         assert_eq!(idle_again.frequency(), 400);
>     }
> }
> ```
> 
> #### Technical Explanation
>
> 1. **Typestate Pattern Safety:** The Typestate pattern converts runtime state checks into compile-time invariants. Attempting to call `transfer()` on a `BusController<Uninitialized>` or `BusController<Idle>` causes a compile error rather than a runtime panic or hardware fault.
> 2. **Preventing State Invariant Bypass via Sealing:** If `BusState` were an open trait, external code could implement `impl BusState for BypassState` and instantiate `BusController<BypassState>` with arbitrary struct fields, breaking driver invariants. Sealing `BusState` guarantees that the compiler checks an exhaustive, closed set of state types (`Uninitialized`, `Idle`, `Active`).
> 3. **Zero Runtime Cost (`PhantomData`):** The `PhantomData<S>` marker type uses 0 bytes of memory at runtime, meaning state machine static type checks compile down to zero machine instruction overhead.
> 


---

## 6. Related Terms


- [Supertraits](supertraits.md) — The trait prerequisite mechanism used to enforce sealing.
- [Visibility and Modules (`pub`, `mod`)](../level_07/visibility_and_modules.md) — Privacy rules governing `mod private`.
- [Trait](../level_04/trait.md) — Standard Rust trait abstraction.
- [Coherence](coherence.md) — Global trait non-ambiguity guarantee.
- [Marker Traits](marker_traits.md) — Related concept: Marker Traits.

---

## 7. Key Takeaways

- The Sealed Trait Pattern prevents external crates from implementing a public trait by requiring an un-exported private supertrait (`pub trait MyTrait: private::Sealed`).
- It allows library authors to add new trait methods in minor versions without breaking downstream code (SemVer stability).
- It enables closed-set trait implementations for types where internal code assumes exhaustive type control.
- External crates can use sealed traits as bounds (`T: MyTrait`), but cannot implement them for custom types.
- Always document sealed traits clearly so downstream users understand why implementation is restricted.
