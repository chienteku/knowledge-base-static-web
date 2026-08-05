# Coherence

> **Level 14 — Advanced Traits & Type System**
> The foundational property of Rust's trait system guaranteeing that for any given type and trait, there exists at most one unambiguous trait implementation across the entire compiled program.

---

## 1. Prerequisites


- [Trait](../level_04/trait.md) — Trait definitions and implementation mechanics (`impl Trait for Type`).
- [Orphan Rule](orphan_rule.md) — The specific crate-boundary rule that enforces global coherence.
- [Blanket Implementation](blanket_implementation.md) — Generic trait implementations governed by coherence constraints.

---

## 2. Term Category

**Core Concept / Trait / Type System**: Coherence is the overarching design principle of Rust's trait system. It ensures that trait resolution is always **unambiguous** and **deterministic**. Under coherence, there can never exist two conflicting implementations of `impl Trait for TargetType` in a compiled binary, eliminating ambiguity for the compiler, IDEs, and developers.

---

## 3. Environment Context

**Universal Rust**: Coherence rules are enforced statically by `rustc` at compile time across all Rust targets (`std`, `no_std`, WASM, embedded).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"

In object-oriented or dynamically typed languages (like C++, JavaScript, or Haskell without strict flags), trait or interface resolution can suffer from the **"Diamond Problem"** or **Overlapping Instance Ambiguity**:
- C++ allows multiple inheritance, leading to ambiguous member function calls if two parent classes define the same function signature.
- JavaScript prototype monkey-patching allows two libraries to overwrite `Array.prototype.find` with different implementations, leading to unpredictable runtime bugs depending on library load order.
- Haskell allows overlapping type class instances if special compiler pragmas are enabled, making code behavior depend on local import orders.

Rust wanted a trait-based polymorphism system that was:
1. **Always Deterministic**: Calling `val.method()` must resolve to the exact same implementation code regardless of where or how the function is invoked in the codebase.
2. **Import Independent**: Bringing a trait into scope via `use my_crate::MyTrait` must never change the behavior of pre-existing code in another file.
3. **Globally Unique**: For any pair of `(Trait, Type)`, there is strictly zero or one valid `impl` block in the compiled binary.

Rust achieved this by enforcing **Coherence**. Coherence encompasses two major rules:
1. **The Overlapping Impl Rule**: The compiler rejects any two `impl` blocks in a crate if there exists *any* type `T` for which both `impl` blocks would apply (Compiler Error `E0119`).
2. **The Orphan Rule**: Ensures that third-party crates cannot add conflicting implementations for foreign traits on foreign types.

### (2) Reality Metaphor

Imagine a **Single Official Registry for Government ID Numbers**:

- **Without Coherence (Dynamic Monkey-Patching / Overlapping Impls)**: Imagine a city where two different utility companies (Gas Company & Water Company) can assign their own independent Customer ID #101 to different citizens. When the Post Office tries to deliver a letter addressed to "Customer #101", the postman doesn't know which citizen should receive the mail (**ambiguous method resolution error**).
- **With Coherence (Rust Trait System)**: The government enforces a strict single-registry policy: any Citizen Social Security Number (**Type**) is mapped to at most ONE official passport document (**Trait Implementation**). No matter which city, post office, or bank looks up Citizen #101 (**calls `val.trait_method()`**), the lookup returns the exact same, unique, unambiguous citizen record every single time.

### (3) Code Examples

#### Short Snippet (Conflicting Overlapping Impls Rejected by Coherence)

```rust
pub trait Formatter {
    fn format(&self) -> String;
}

struct User(String);

// Implementation 1 for User
impl Formatter for User {
    fn format(&self) -> String {
        format!("User: {}", self.0)
    }
}

// ❌ COMPILER ERROR E0119 if we try to add a second implementation for `User`:
// impl Formatter for User {
//     fn format(&self) -> String {
//         format!("ANOTHER IMPL: {}", self.0)
//     }
// }

fn main() {
    let u = User(String::from("Alice"));
    // Because of Coherence, `u.format()` is 100% unambiguous:
    println!("{}", u.format()); // User: Alice
}
```

#### Fuller Example (Blanket Impl vs Specific Impl Overlap Error)

```rust
pub trait Inspect {
    fn inspect_val(&self);
}

// Blanket implementation 1: Applies to ALL types implementing `Display`
impl<T: std::fmt::Display> Inspect for T {
    fn inspect_val(&self) {
        println!("Display inspect: {}", self);
    }
}

// ❌ COMPILER ERROR E0119: Conflicting implementation for `String`
// Why? `String` implements `Display`, so Blanket Implementation 1 ALREADY applies to `String`!
// Rust's coherence rules forbid adding a second overlapping impl for `String`.
//
// impl Inspect for String {
//     fn inspect_val(&self) {
//         println!("Custom String inspect: {}", self);
//     }
// }

fn main() {
    let num = 42;
    let s = String::from("Rust");

    // Both resolve unambiguously to the Blanket Impl:
    num.inspect_val(); // Display inspect: 42
    s.inspect_val();   // Display inspect: Rust
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Expecting Trait Method Overriding / Specialization on Stable Rust

**The mistake:** Assuming that defining a specific `impl MyTrait for MyStruct` will "override" a generic blanket `impl<T> MyTrait for T`.

**Why it's wrong:** Stable Rust does NOT support trait specialization. Once a generic `impl<T> Trait for T` is declared, writing a specific `impl Trait for MyStruct` triggers error `E0119` (conflicting implementations) because coherence requires no overlap.

*Incorrect:*
```rust
pub trait CustomLog { fn log(&self); }

// Blanket impl for all types
impl<T> CustomLog for T {
    fn log(&self) { println!("Generic log"); }
}

// ❌ Compiler Error E0119: Conflicting implementation for `u32`
// impl CustomLog for u32 {
//     fn log(&self) { println!("u32 log"); }
// }
```

*Fix:*
```rust
// Use wrapper Newtypes, dedicated helper traits, or conditional trait bounds
pub struct MyU32(pub u32);
impl CustomLog for MyU32 {
    fn log(&self) { println!("u32 log: {}", self.0); }
}
```

### Mistake 2: Overlapping Generic Implementations across Multiple Blanket Impls

**The mistake:** Writing two blanket implementations whose generic bounds could potentially overlap for a single type `T`.

**Why it's wrong:** If a type `T` exists that satisfies both trait bounds, the compiler cannot decide which blanket `impl` to invoke, violating coherence.

*Incorrect:*
```rust
pub trait Summary { fn summarize(&self); }

// Blanket Impl 1 for Display types
impl<T: std::fmt::Display> Summary for T {
    fn summarize(&self) { println!("Display"); }
}

// ❌ Compiler Error E0119: Conflicting implementations!
// Types like `i32` or `String` implement BOTH `Display` and `Debug`, causing overlap!
// impl<T: std::fmt::Debug> Summary for T {
//     fn summarize(&self) { println!("Debug"); }
// }
```

*Fix:*
```rust
// Separate into distinct traits or use a single non-overlapping bound
pub trait DisplaySummary { fn summarize_display(&self); }
pub trait DebugSummary { fn summarize_debug(&self); }
```

### Mistake 3: Attempting to Implement Foreign Trait on Foreign Type

**The mistake:** Writing `impl ForeignTrait for ForeignType` in your crate.

**Why it's wrong:** This violates the **Orphan Rule** (the crate-boundary policy of Coherence). If two independent crates wrote the same `impl ForeignTrait for ForeignType`, compiling them together would break global coherence.

---

## 6. Practice Exercises

### Exercise 1: Telemetry System — Bypassing Blanket Impl Overlap via Newtype Wrapper

**Problem:** In an embedded telemetry system, a logging framework provides a blanket implementation of `TelemetrySerializer` for all types implementing `std::fmt::Display`. You have a `SensorReadings` struct that implements `Display` for human-readable output, but requires a custom compact format for network transmission. Directly writing `impl TelemetrySerializer for SensorReadings` results in compiler error `E0119` due to coherence rules. Refactor the code using the Newtype pattern to allow custom serialization while respecting coherence.

> [!check]- Answer
> ```rust
> use std::fmt;
> 
> // Third-party or framework trait
> pub trait TelemetrySerializer {
>     fn serialize_telemetry(&self) -> String;
> }
> 
> // Blanket implementation for all types implementing Display
> impl<T: fmt::Display> TelemetrySerializer for T {
>     fn serialize_telemetry(&self) -> String {
>         format!("[DISPLAY] {}", self)
>     }
> }
> 
> // Domain struct representing sensor measurements
> #[derive(Debug, PartialEq)]
> pub struct SensorReadings {
>     pub sensor_id: u32,
>     pub temp_celsius: f32,
>     pub humidity: f32,
> }
> 
> // Standard Display implementation for human-readable logging
> impl fmt::Display for SensorReadings {
>     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
>         write!(
>             f,
>             "Sensor #{}: {:.1}°C, {:.1}% RH",
>             self.sensor_id, self.temp_celsius, self.humidity
>         )
>     }
> }
> 
> // ❌ Direct implementation would fail with E0119 (Conflicting implementations):
> // impl TelemetrySerializer for SensorReadings {
> //     fn serialize_telemetry(&self) -> String { ... }
> // }
> 
> // SOLUTION: Newtype wrapper to create a distinct local type
> pub struct CompactTelemetry<'a>(pub &'a SensorReadings);
> 
> impl<'a> TelemetrySerializer for CompactTelemetry<'a> {
>     fn serialize_telemetry(&self) -> String {
>         format!(
>             "ID:{:#06X}|T:{:.2}|H:{:.2}",
>             self.0.sensor_id, self.0.temp_celsius, self.0.humidity
>         )
>     }
> }
> 
> fn main() {
>     let readings = SensorReadings {
>         sensor_id: 42,
>         temp_celsius: 23.5,
>         humidity: 55.0,
>     };
> 
>     // Default telemetry via Display blanket impl
>     println!("Default: {}", readings.serialize_telemetry());
> 
>     // Custom telemetry via Newtype wrapper
>     let compact = CompactTelemetry(&readings);
>     println!("Compact: {}", compact.serialize_telemetry());
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_blanket_telemetry_serialization() {
>         let readings = SensorReadings {
>             sensor_id: 101,
>             temp_celsius: 21.0,
>             humidity: 45.5,
>         };
>         // Uses blanket impl for Display types
>         let result = readings.serialize_telemetry();
>         assert_eq!(result, "[DISPLAY] Sensor #101: 21.0°C, 45.5% RH");
>     }
> 
>     #[test]
>     fn test_compact_newtype_telemetry_serialization() {
>         let readings = SensorReadings {
>             sensor_id: 101,
>             temp_celsius: 21.0,
>             humidity: 45.5,
>         };
>         // Bypasses blanket impl via Newtype wrapper
>         let compact = CompactTelemetry(&readings);
>         let result = compact.serialize_telemetry();
>         assert_eq!(result, "ID:0x0065|T:21.00|H:45.50");
>     }
> }
> ```
>
> **Explanation:**
> 1. **Coherence & Blanket Impls (`E0119`):** Rust enforces that for any pair `(Trait, Type)`, there is strictly one implementation across the program. The blanket `impl<T: Display> TelemetrySerializer for T` claims an implementation for *every* type implementing `Display`. Adding `impl TelemetrySerializer for SensorReadings` creates two overlapping implementations for `SensorReadings`, triggering error `E0119`.
> 2. **Lack of Specialization in Stable Rust:** Unlike C++ template specialization, stable Rust does not permit specialized `impl` blocks to override generic blanket `impl` blocks.
> 3. **Newtype Pattern Solution:** Wrapping `&SensorReadings` inside `CompactTelemetry<'a>` introduces a novel nominal type in the local crate. Because `CompactTelemetry` does not implement `Display`, it does not trigger the blanket implementation. Implementing `TelemetrySerializer` for `CompactTelemetry` is completely coherent and unambiguous.

---

### Exercise 2: Financial Engine — Resolving Overlapping Generic Blanket Bounds

**Problem:** In a financial risk engine, you define a `RiskEvaluator` trait. You wish to calculate risk scores based on either audit history (`AuditLog` trait) or compliance status (`ComplianceCheck` trait). Writing two blanket implementations (`impl<T: AuditLog> RiskEvaluator for T` and `impl<T: ComplianceCheck> RiskEvaluator for T`) fails with compiler error `E0119` because a single transaction type could implement both traits. Refactor the architecture using dedicated adapter wrappers to resolve the overlap.

> [!check]- Answer
> ```rust
> pub trait RiskEvaluator {
>     fn calculate_risk_score(&self) -> u32;
> }
> 
> pub trait AuditLog {
>     fn audit_entry_count(&self) -> u32;
>     fn has_flagged_entries(&self) -> bool;
> }
> 
> pub trait ComplianceCheck {
>     fn compliance_score(&self) -> u32;
>     fn is_pep_involved(&self) -> bool; // Politically Exposed Person
> }
> 
> // ❌ Overlapping blanket implementations cause E0119:
> // impl<T: AuditLog> RiskEvaluator for T { ... }
> // impl<T: ComplianceCheck> RiskEvaluator for T { ... }
> // Reason: A type `WireTransfer` might implement BOTH `AuditLog` AND `ComplianceCheck`.
> 
> // SOLUTION: Explicit adapter wrappers to select evaluation perspective
> pub struct AuditRiskAdapter<'a, T: AuditLog>(pub &'a T);
> pub struct ComplianceRiskAdapter<'a, T: ComplianceCheck>(pub &'a T);
> 
> impl<'a, T: AuditLog> RiskEvaluator for AuditRiskAdapter<'a, T> {
>     fn calculate_risk_score(&self) -> u32 {
>         let base = self.0.audit_entry_count() * 5;
>         if self.0.has_flagged_entries() {
>             base + 50
>         } else {
>             base
>         }
>     }
> }
> 
> impl<'a, T: ComplianceCheck> RiskEvaluator for ComplianceRiskAdapter<'a, T> {
>     fn calculate_risk_score(&self) -> u32 {
>         let base = self.0.compliance_score();
>         if self.0.is_pep_involved() {
>             base + 100
>         } else {
>             base
>         }
>     }
> }
> 
> // Concrete financial transaction implementing both domain traits
> pub struct WireTransfer {
>     pub amount: u64,
>     pub audit_count: u32,
>     pub has_suspicious_flag: bool,
>     pub compliance_base: u32,
>     pub involves_pep: bool,
> }
> 
> impl AuditLog for WireTransfer {
>     fn audit_entry_count(&self) -> u32 {
>         self.audit_count
>     }
>     fn has_flagged_entries(&self) -> bool {
>         self.has_suspicious_flag
>     }
> }
> 
> impl ComplianceCheck for WireTransfer {
>     fn compliance_score(&self) -> u32 {
>         self.compliance_base
>     }
>     fn is_pep_involved(&self) -> bool {
>         self.involves_pep
>     }
> }
> 
> fn main() {
>     let tx = WireTransfer {
>         amount: 500_000,
>         audit_count: 4,
>         has_suspicious_flag: true,
>         compliance_base: 20,
>         involves_pep: true,
>     };
> 
>     let audit_risk = AuditRiskAdapter(&tx).calculate_risk_score();
>     let compliance_risk = ComplianceRiskAdapter(&tx).calculate_risk_score();
> 
>     println!("Audit Risk Score: {}", audit_risk);
>     println!("Compliance Risk Score: {}", compliance_risk);
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_audit_risk_evaluation() {
>         let tx = WireTransfer {
>             amount: 10_000,
>             audit_count: 3,
>             has_suspicious_flag: false,
>             compliance_base: 10,
>             involves_pep: false,
>         };
>         let adapter = AuditRiskAdapter(&tx);
>         assert_eq!(adapter.calculate_risk_score(), 15); // 3 * 5 = 15
>     }
> 
>     #[test]
>     fn test_compliance_risk_evaluation_with_pep() {
>         let tx = WireTransfer {
>             amount: 1_000_000,
>             audit_count: 10,
>             has_suspicious_flag: true,
>             compliance_base: 30,
>             involves_pep: true,
>         };
>         let adapter = ComplianceRiskAdapter(&tx);
>         assert_eq!(adapter.calculate_risk_score(), 130); // 30 + 100 = 130
>     }
> }
> ```
>
> **Explanation:**
> 1. **Overlapping Generic Bounds (`E0119`):** Rust's coherence checker checks for potential overlaps across generic bounds. Even if no struct currently implements both `AuditLog` and `ComplianceCheck`, Rust forbids two blanket `impl` blocks if a type *could* implement both traits in the future.
> 2. **Explicit Adapter Pattern:** By wrapping `&WireTransfer` inside `AuditRiskAdapter<'a, T>` or `ComplianceRiskAdapter<'a, T>`, we transform the target type of `impl RiskEvaluator` from `T` to `AuditRiskAdapter<T>` and `ComplianceRiskAdapter<T>`.
> 3. **Zero-Cost Disambiguation:** These adapter structs are non-allocating reference wrappers (`pub struct Adapter<'a, T>(&'a T)`). They compile down to direct function calls without runtime performance penalty while providing absolute coherence.

---

### Exercise 3: Embedded `no_std` Peripheral Driver — Disjoint Parameterized Generic Implementations

**Problem:** In an embedded `#![no_std]` environment, you are designing a hardware peripheral driver interface `SensorDevice`. Devices can operate in synchronous polling mode (`SyncMode`) or DMA asynchronous mode (`AsyncMode`). Writing separate `impl` blocks for generic parameters without distinct marker types leads to trait overlap errors. Implement a `#![no_std]` compatible driver architecture using phantom type parameters (`PhantomData`) to guarantee disjoint `impl` blocks and coherent trait resolution.

> [!check]- Answer
> ```rust
> #![no_std]
> 
> use core::marker::PhantomData;
> 
> // Execution mode markers
> pub struct SyncMode;
> pub struct AsyncMode;
> 
> // Low-level hardware bus trait
> pub trait RawBus {
>     type Error;
>     fn write_register(&mut self, reg: u8, val: u8) -> Result<(), Self::Error>;
>     fn read_register(&mut self, reg: u8) -> Result<u8, Self::Error>;
> }
> 
> // Hardware Peripheral Driver generic over Bus and Mode
> pub struct SensorDevice<B, Mode> {
>     bus: B,
>     _mode: PhantomData<Mode>,
> }
> 
> // Synchronous polling implementation
> impl<B: RawBus> SensorDevice<B, SyncMode> {
>     pub fn new_sync(bus: B) -> Self {
>         Self {
>             bus,
>             _mode: PhantomData,
>         }
>     }
> 
>     pub fn read_sync_sample(&mut self) -> Result<u16, B::Error> {
>         let high = self.bus.read_register(0x01)?;
>         let low = self.bus.read_register(0x02)?;
>         Ok(((high as u16) << 8) | (low as u16))
>     }
> }
> 
> // Asynchronous DMA implementation
> impl<B: RawBus> SensorDevice<B, AsyncMode> {
>     pub fn new_async(bus: B) -> Self {
>         Self {
>             bus,
>             _mode: PhantomData,
>         }
>     }
> 
>     pub fn prepare_async_dma(&mut self, trigger_reg: u8) -> Result<u8, B::Error> {
>         self.bus.write_register(0x10, trigger_reg)?;
>         self.bus.read_register(0x10)
>     }
> }
> 
> // Mock hardware bus for testing without std
> pub struct MockI2cBus {
>     pub registers: [u8; 32],
> }
> 
> impl RawBus for MockI2cBus {
>     type Error = ();
> 
>     fn write_register(&mut self, reg: u8, val: u8) -> Result<(), Self::Error> {
>         if (reg as usize) < self.registers.len() {
>             self.registers[reg as usize] = val;
>             Ok(())
>         } else {
>             Err(())
>         }
>     }
> 
>     fn read_register(&mut self, reg: u8) -> Result<u8, Self::Error> {
>         if (reg as usize) < self.registers.len() {
>             Ok(self.registers[reg as usize])
>         } else {
>             Err(())
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_sync_sensor_reading() {
>         let mut bus = MockI2cBus { registers: [0; 32] };
>         bus.registers[1] = 0x12;
>         bus.registers[2] = 0x34;
> 
>         let mut dev = SensorDevice::new_sync(bus);
>         let sample = dev.read_sync_sample().unwrap();
>         assert_eq!(sample, 0x1234);
>     }
> 
>     #[test]
>     fn test_async_dma_configuration() {
>         let bus = MockI2cBus { registers: [0; 32] };
>         let mut dev = SensorDevice::new_async(bus);
>         let status = dev.prepare_async_dma(0x05).unwrap();
>         assert_eq!(status, 0x05);
>     }
> }
> ```
>
> **Explanation:**
> 1. **Disjoint Types via Phantom Type Parameters:** By parameterizing `SensorDevice<B, Mode>` with `Mode`, `SensorDevice<MockI2cBus, SyncMode>` and `SensorDevice<MockI2cBus, AsyncMode>` become distinct, non-overlapping types in Rust's type system.
> 2. **Coherence Preservation:** Because the types are distinct, `impl<B: RawBus> SensorDevice<B, SyncMode>` and `impl<B: RawBus> SensorDevice<B, AsyncMode>` do not overlap, completely eliminating coherence errors (`E0119`).
> 3. **`no_std` Zero-Cost Abstraction:** Using `PhantomData<Mode>` ensures no runtime memory footprint or heap allocation is introduced, making this pattern ideal for resource-constrained embedded microcontrollers.

---

## 7. Related Terms


- [Orphan Rule](orphan_rule.md) — The crate-boundary policy enforcing global coherence across Cargo dependencies.
- [Blanket Implementation](blanket_implementation.md) — Generic trait implementations governed by coherence constraints.
- [Trait](../level_04/trait.md) — The fundamental abstraction system governed by coherence.
- [Newtype Pattern](../level_11/newtype_pattern.md) — Design pattern used to create disjoint types that resolve coherence conflicts.
- [Sealed Trait Pattern](sealed_trait_pattern.md) — Related concept: Sealed Trait Pattern.

---

## 8. Key Takeaways

- Coherence guarantees that there is at most ONE valid implementation of `impl Trait for Type` across an entire compiled program.
- Conflicting or overlapping implementations trigger compiler error `E0119`.
- Coherence prevents trait resolution ambiguity, the C++ "diamond problem", and JavaScript prototype monkey-patching bugs.
- Stable Rust does not support trait specialization: generic blanket implementations prevent writing specialized `impl` blocks for types covered by the blanket bound.
- The Orphan Rule is the crate-level mechanism that enforces coherence across external dependencies.
