# Supertraits

> **Level 14 — Advanced Traits & Type System**
> Declaring a trait requirement (`pub trait SubTrait: SuperTrait`) stating that any type implementing `SubTrait` must also implement `SuperTrait`.

---

## 1. Prerequisites


- [Trait](../level_04/trait.md) — Standard trait definitions and `impl Trait for Type` syntax.
- [Blanket Implementation](blanket_implementation.md) — Generic trait implementations across type bounds.
- [`Display` Trait](../level_04/display_trait.md) — Standard library formatting trait often used as a supertrait bound.

---

## 2. Term Category

**Trait / Abstraction**: Supertraits define a prerequisite dependency relationship between traits in Rust. Declaring `pub trait Person: Display` does NOT mean `Person` inherits code or state from `Display` in an object-oriented sense; rather, it specifies a **trait bound prerequisite**: any type `T` that wants to implement `Person` is required to also implement `Display`.

---

## 3. Environment Context

**Universal Rust**: Supertraits are used throughout the Rust Standard Library (e.g. `pub trait Copy: Clone`, `pub trait Eq: PartialEq`, `pub trait Ord: Eq + PartialOrd`) and across ecosystem crates.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"

In object-oriented languages (TypeScript, Java, C#), interface inheritance (`interface Student extends Person`) allows a child interface to inherit method signatures and force implementing classes to satisfy both parent and child contracts.

Rust does not have traditional class inheritance. However, traits often rely logically on capabilities provided by other traits:
- A `Copy` type (bitwise copy) must logically be duplicate-able via `Clone`.
- A total ordering trait `Ord` must logically support equality checks (`Eq`) and partial ordering (`PartialOrd`).
- A custom logging trait `Loggable` needs to call `.fmt()` formatting methods from `Display` inside its default implementations.

If Rust did not support supertraits:
1. Functions accepting `T: Loggable` would have to write verbose compound bounds everywhere: `fn log<T: Loggable + Display + Debug>(item: T)`.
2. Trait default method implementations inside `Loggable` could not call methods defined on `Display` because `Loggable` alone could not guarantee that `T` implemented `Display`.

Supertraits solve this by establishing trait dependency contracts. By writing `pub trait Loggable: Display + Debug`, `Loggable` guarantees that any generic function accepting `T: Loggable` can freely invoke methods from `Display` and `Debug` on `T`.

### (2) Reality Metaphor

Imagine a **Commercial Airline Pilot License Prerequisite**:

- **Independent Traits** are like basic certificates: a Boating License and a First Aid Certificate are unrelated skills.
- A **Supertrait Relationship (`trait AirlinePilot: CommercialDriver + MedicalClearance`)** is a mandatory prerequisite rule:
  - The Aviation Authority does not issue a Commercial Airline Pilot License (**`SubTrait`**) to a candidate unless they *already* possess a valid Commercial Driver's License (**`SuperTrait 1`**) AND a Class-1 Medical Certificate (**`SuperTrait 2`**).
  - Anyone hiring a certified `AirlinePilot` can instantly assume without extra checks that the pilot can drive a commercial vehicle and has passed medical screening.

### (3) Code Examples

#### Short Snippet (Standard Library `Copy: Clone` Relationship)

```rust
// In standard library:
// pub trait Copy: Clone {} // `Clone` is a supertrait of `Copy`

#[derive(Debug)]
struct Point {
    x: i32,
    y: i32,
}

// ❌ COMPILER ERROR if we try to implement `Copy` without `Clone`:
// impl Copy for Point {} // Error: the trait `Clone` is not implemented for `Point`

// Correct: Implement supertrait `Clone` FIRST (or derive both)
impl Clone for Point {
    fn clone(&self) -> Self {
        Point { x: self.x, y: self.y }
    }
}

// Now `Copy` can be safely implemented:
impl Copy for Point {}

fn main() {
    let p1 = Point { x: 10, y: 20 };
    let p2 = p1; // Copy behavior
    println!("p1: {:?}, p2: {:?}", p1, p2);
}
```

#### Fuller Example (Custom Supertrait with Default Method Invocation)

```rust
use std::fmt::Display;

/// Supertrait definition: Any type implementing `Renderable` MUST also implement `Display`.
pub trait Renderable: Display {
    fn render_frame(&self) -> String;

    // Default method implementation utilizing supertrait capabilities:
    // Because `Display` is a supertrait, we can call `self.to_string()` directly!
    fn print_rendered(&self) {
        println!("[RENDER FRAME] {} -> Description: {}", self.render_frame(), self.to_string());
    }
}

struct Button {
    label: String,
    width: u32,
}

// 1. Satisfy supertrait requirement: Implement `Display`
impl Display for Button {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "Button('{}')", self.label)
    }
}

// 2. Implement target subtrait `Renderable`
impl Renderable for Button {
    fn render_frame(&self) -> String {
        format!("<button width='{}'>{}</button>", self.width, self.label)
    }
}

fn main() {
    let btn = Button { label: String::from("Submit"), width: 120 };
    
    // Call default method defined on `Renderable` that invokes `Display`
    btn.print_rendered();
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Confusing Supertraits with Class Inheritance

**The mistake:** Assuming that `trait Sub: Super` causes `Sub` to inherit default method implementations or state variables from `Super` automatically.

**Why it's wrong:** Supertraits in Rust declare *bounds*, not OOP code inheritance. Implementing `Sub` does not automatically implement `Super` for you; you must write separate `impl Super for MyType` AND `impl Sub for MyType` blocks.

*Incorrect:*
```rust
trait Base { fn base_method(&self) { println!("Base"); } }
trait Derived: Base { fn derived_method(&self); }

struct Widget;

// ❌ Compiler Error: implementing `Derived` does NOT automatically implement `Base`!
impl Derived for Widget {
    fn derived_method(&self) {}
}
```

*Fix:*
```rust
struct Widget;

// Correct: Must implement supertrait `Base` explicitly
impl Base for Widget {}

// Then implement `Derived`
impl Derived for Widget {
    fn derived_method(&self) {}
}
```

### Mistake 2: Creating Cyclic Supertrait Dependencies

**The mistake:** Defining `trait A: B` and `trait B: A`.

**Why it's wrong:** Cyclic supertrait bounds cause an infinite recursion compiler error (`cycle detected when computing supertraits`).

*Incorrect:*
```rust
// ❌ Compiler Error: cycle detected when computing supertraits!
trait TraitA: TraitB {}
trait TraitB: TraitA {}
```

*Fix:*
```rust
// Separate the common shared capability into a foundational base trait
trait BaseTrait {}
trait TraitA: BaseTrait {}
trait TraitB: BaseTrait {}
```

### Mistake 3: Supertrait Name Collision (Ambiguous Method Calls)

**The mistake:** Defining a method in a subtrait with the exact same name as a method in its supertrait.

**Why it's wrong:** If both `SubTrait` and `SuperTrait` define a method with the same signature (e.g. `fn reset(&self)`), calling `widget.reset()` results in an ambiguous method call compiler error (`E0034`).

*Incorrect:*
```rust
trait ResetBase { fn reset(&self); }
trait ResetSub: ResetBase { fn reset(&self); } // ❌ Ambiguous method name!
```

*Fix:*
```rust
// Disambiguate call site using fully qualified syntax:
// ResetBase::reset(&widget);
// ResetSub::reset(&widget);
// OR rename subtrait method to avoid shadowing: `fn reset_sub(&self);`
```

---

## 6. Practice Exercises

### Exercise 1: Multi-Tier Embedded Telemetry Trait Hierarchy

**Problem:** In an embedded IoT firmware system, sensor devices must follow a strict trait hierarchy to guarantee identity, calibration safety, and formatted telemetry report generation before data transmission.

Define the following multi-tier supertrait hierarchy:
1. Base supertrait `Identifiable`: requires `fn device_id(&self) -> &'static str`.
2. Intermediate supertrait `Calibratable: Identifiable`: requires `fn calibrate(&mut self) -> Result<(), &'static str>` and `fn is_calibrated(&self) -> bool`.
3. Subtrait `TelemetrySensor: Calibratable`: requires `fn read_raw_units(&mut self) -> u32` and provides a default method `fn generate_report(&mut self) -> Result<String, &'static str>`:
   - Validates `self.is_calibrated()`. Returns `Err("Sensor uncalibrated")` if false.
   - If calibrated, reads units via `self.read_raw_units()` and formats: `Ok(format!("[Device ID: {}] Telemetry Reading: {} units", self.device_id(), raw))`. Note how `generate_report` invokes methods from both supertrait tiers.

Implement this hierarchy for `ThermalSensor` with fields `id: &'static str`, `calibrated: bool`, and `raw_temp_adc: u32`. Write unit tests with assertions (`assert_eq!`, `assert!`) testing calibration enforcement and report formatting.

> [!check]- Answer
> ```rust
> use std::fmt;
> 
> /// Base supertrait: Anything identifiable in the system.
> pub trait Identifiable {
>     fn device_id(&self) -> &'static str;
> }
> 
> /// Intermediate supertrait: Extends `Identifiable`.
> pub trait Calibratable: Identifiable {
>     fn calibrate(&mut self) -> Result<(), &'static str>;
>     fn is_calibrated(&self) -> bool;
> }
> 
> /// Subtrait: Extends `Calibratable` (and transitively `Identifiable`).
> pub trait TelemetrySensor: Calibratable {
>     fn read_raw_units(&mut self) -> u32;
> 
>     /// Default method utilizing methods from both `Calibratable` and `Identifiable`.
>     fn generate_report(&mut self) -> Result<String, &'static str> {
>         if !self.is_calibrated() {
>             return Err("Sensor uncalibrated");
>         }
>         let raw = self.read_raw_units();
>         Ok(format!(
>             "[Device ID: {}] Telemetry Reading: {} units",
>             self.device_id(),
>             raw
>         ))
>     }
> }
> 
> /// Hardware implementation struct
> pub struct ThermalSensor {
>     pub id: &'static str,
>     pub calibrated: bool,
>     pub raw_temp_adc: u32,
> }
> 
> impl Identifiable for ThermalSensor {
>     fn device_id(&self) -> &'static str {
>         self.id
>     }
> }
> 
> impl Calibratable for ThermalSensor {
>     fn calibrate(&mut self) -> Result<(), &'static str> {
>         self.calibrated = true;
>         Ok(())
>     }
> 
>     fn is_calibrated(&self) -> bool {
>         self.calibrated
>     }
> }
> 
> impl TelemetrySensor for ThermalSensor {
>     fn read_raw_units(&mut self) -> u32 {
>         self.raw_temp_adc
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_uncalibrated_sensor_rejects_report() {
>         let mut sensor = ThermalSensor {
>             id: "TEMP-001",
>             calibrated: false,
>             raw_temp_adc: 1024,
>         };
> 
>         assert_eq!(sensor.device_id(), "TEMP-001");
>         assert!(!sensor.is_calibrated());
> 
>         let report_result = sensor.generate_report();
>         assert!(report_result.is_err());
>         assert_eq!(report_result.unwrap_err(), "Sensor uncalibrated");
>     }
> 
>     #[test]
>     fn test_calibrated_sensor_generates_report() {
>         let mut sensor = ThermalSensor {
>             id: "TEMP-002",
>             calibrated: false,
>             raw_temp_adc: 2048,
>         };
> 
>         // Perform calibration via Calibratable supertrait
>         assert!(sensor.calibrate().is_ok());
>         assert!(sensor.is_calibrated());
> 
>         // Generate report via TelemetrySensor subtrait default method
>         let report = sensor.generate_report().unwrap();
>         assert_eq!(
>             report,
>             "[Device ID: TEMP-002] Telemetry Reading: 2048 units"
>         );
>     }
> }
> ```
> 
> **Explanation:**
> 1. **Transitive Supertrait Hierarchy**: The declaration `pub trait TelemetrySensor: Calibratable` combined with `pub trait Calibratable: Identifiable` creates a multi-tier dependency chain. Any struct implementing `TelemetrySensor` must fulfill all prerequisite traits in the hierarchy.
> 2. **Cross-Trait Default Invocation**: Subtrait default method `generate_report` invokes `self.is_calibrated()` (from supertrait `Calibratable`) and `self.device_id()` (from supertrait `Identifiable`). Rust allows this because supertrait bounds guarantee these methods exist for any implementor.
> 3. **Explicit Trait Implementations**: Each trait in the hierarchy requires its own distinct `impl Trait for Struct` block, enforcing modularity and separation of concerns.

---

### Exercise 2: Secure Cryptographic Key Operations & Trait Prerequisite Chains

**Problem:** In a hardware security module (HSM), signing operations must guarantee that cryptographic key objects carry handle metadata, reside in hardware memory, and satisfy PIN authentication before raw signatures are emitted.

Design the following security trait hierarchy:
1. Base marker trait `HardwareKey`: empty marker trait asserting key material resides in a secure enclave.
2. Base trait `KeyInfo: HardwareKey`: requires `fn key_handle(&self) -> u64` and `fn algorithm_name(&self) -> &'static str`.
3. Supertrait `AuthenticatedKey: KeyInfo`: requires `fn authenticate(&mut self, pin: u32) -> bool` and `fn is_authenticated(&self) -> bool`.
4. Subtrait `CryptoSigner: AuthenticatedKey`: requires `fn raw_sign(&self, payload: &[u8]) -> [u8; 4]` and provides default method `fn safe_sign(&mut self, pin: u32, payload: &[u8]) -> Result<[u8; 4], &'static str>`:
   - Invokes `self.authenticate(pin)`. Returns `Err("Authentication failed: invalid PIN")` if authentication fails.
   - On success, returns `Ok(self.raw_sign(payload))`.

Implement this hierarchy for `HsmToken` with fields `handle: u64`, `secret_pin: u32`, and `authenticated: bool`. Write unit tests with assertions (`assert_eq!`, `assert!`) verifying authentication enforcement and payload signing.

> [!check]- Answer
> ```rust
> /// Base marker trait guaranteeing hardware enclave storage.
> pub trait HardwareKey {}
> 
> /// Metadata trait dependent on HardwareKey.
> pub trait KeyInfo: HardwareKey {
>     fn key_handle(&self) -> u64;
>     fn algorithm_name(&self) -> &'static str;
> }
> 
> /// Authentication supertrait dependent on KeyInfo.
> pub trait AuthenticatedKey: KeyInfo {
>     fn authenticate(&mut self, pin: u32) -> bool;
>     fn is_authenticated(&self) -> bool;
> }
> 
> /// Cryptographic signing subtrait dependent on AuthenticatedKey.
> pub trait CryptoSigner: AuthenticatedKey {
>     fn raw_sign(&self, payload: &[u8]) -> [u8; 4];
> 
>     /// Default implementation combining authentication and signing capabilities.
>     fn safe_sign(&mut self, pin: u32, payload: &[u8]) -> Result<[u8; 4], &'static str> {
>         if !self.authenticate(pin) {
>             return Err("Authentication failed: invalid PIN");
>         }
>         Ok(self.raw_sign(payload))
>     }
> }
> 
> /// HSM Key token implementation
> pub struct HsmToken {
>     pub handle: u64,
>     pub secret_pin: u32,
>     pub authenticated: bool,
> }
> 
> impl HardwareKey for HsmToken {}
> 
> impl KeyInfo for HsmToken {
>     fn key_handle(&self) -> u64 {
>         self.handle
>     }
>     fn algorithm_name(&self) -> &'static str {
>         "Ed25519-HSM"
>     }
> }
> 
> impl AuthenticatedKey for HsmToken {
>     fn authenticate(&mut self, pin: u32) -> bool {
>         if pin == self.secret_pin {
>             self.authenticated = true;
>             true
>         } else {
>             self.authenticated = false;
>             false
>         }
>     }
> 
>     fn is_authenticated(&self) -> bool {
>         self.authenticated
>     }
> }
> 
> impl CryptoSigner for HsmToken {
>     fn raw_sign(&self, payload: &[u8]) -> [u8; 4] {
>         let checksum = payload.iter().fold(0u8, |acc, &b| acc.wrapping_add(b));
>         [0xAA, 0xBB, checksum, (self.handle & 0xFF) as u8]
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_failed_authentication_blocks_signing() {
>         let mut token = HsmToken {
>             handle: 0xDEAD_BEEF,
>             secret_pin: 1234,
>             authenticated: false,
>         };
> 
>         assert_eq!(token.key_handle(), 0xDEAD_BEEF);
>         assert_eq!(token.algorithm_name(), "Ed25519-HSM");
> 
>         let result = token.safe_sign(9999, b"transaction payload");
>         assert!(result.is_err());
>         assert_eq!(result.unwrap_err(), "Authentication failed: invalid PIN");
>         assert!(!token.is_authenticated());
>     }
> 
>     #[test]
>     fn test_successful_authentication_and_signing() {
>         let mut token = HsmToken {
>             handle: 0x1234_5678,
>             secret_pin: 4321,
>             authenticated: false,
>         };
> 
>         let payload = b"transfer 100 tokens";
>         let sig_result = token.safe_sign(4321, payload);
>         assert!(sig_result.is_ok());
> 
>         let sig = sig_result.unwrap();
>         assert_eq!(sig[0], 0xAA);
>         assert_eq!(sig[1], 0xBB);
>         assert!(token.is_authenticated());
>     }
> }
> ```
> 
> **Explanation:**
> 1. **Security Supertrait Invariants**: By enforcing `CryptoSigner: AuthenticatedKey`, Rust's type system guarantees at compile-time that any signing type cannot bypass authentication mechanisms.
> 2. **Marker Trait Integration**: `HardwareKey` serves as an empty marker trait bound. Marker supertraits allow architectural constraints (e.g. enclave storage guarantees) to be encoded directly into trait boundaries.
> 3. **Encapsulated Workflow in Default Methods**: Default subtrait methods like `safe_sign` act as stateful guards, calling supertrait authentication methods before permitting access to lower-level operations (`raw_sign`).

---

### Exercise 3: Standard Library Trait Chain (`Ord: Eq + PartialOrd`, `Copy: Clone`)

**Problem:** In high-throughput task scheduling engines, execution queue items must maintain strict total ordering semantics (`Ord`) and bitwise copy semantics (`Copy`).

Build a struct `ScheduledTask`:
- Fields: `priority: u8` and `task_id: u64`.
- Requirements:
  1. Manually implement standard library traits in their exact supertrait dependency chain:
     - `Clone` and `Copy` (`Copy: Clone`).
     - `PartialEq` and `Eq` (`Eq: PartialEq`).
     - `PartialOrd` and `Ord` (`Ord: Eq + PartialOrd`): Priority ordering compares `priority` descending (higher priority executes first), and secondarily `task_id` ascending (older tasks execute first).
  2. Define a custom subtrait `PrioritizedTask: Ord + Copy` with method `fn description(&self) -> String` and default method `fn executes_before(&self, other: &Self) -> bool` using comparison operators (`self > other`).

Write unit tests with assertions (`assert!`, `assert_eq!`) testing manual trait ordering logic, priority comparison, and `Copy` semantics.

> [!check]- Answer
> ```rust
> use std::cmp::Ordering;
> 
> /// Task struct representing scheduled workload
> #[derive(Debug)]
> pub struct ScheduledTask {
>     pub priority: u8,
>     pub task_id: u64,
> }
> 
> // 1. Supertrait requirement for `Copy`: MUST implement `Clone`
> impl Clone for ScheduledTask {
>     fn clone(&self) -> Self {
>         *self // Copy semantics
>     }
> }
> 
> // 2. Implement `Copy`
> impl Copy for ScheduledTask {}
> 
> // 3. Supertrait requirement for `Eq` and `PartialOrd`: MUST implement `PartialEq`
> impl PartialEq for ScheduledTask {
>     fn eq(&self, other: &Self) -> bool {
>         self.priority == other.priority && self.task_id == other.task_id
>     }
> }
> 
> // 4. Implement `Eq` (total equality marker)
> impl Eq for ScheduledTask {}
> 
> // 5. Supertrait requirement for `Ord`: MUST implement `PartialOrd`
> impl PartialOrd for ScheduledTask {
>     fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
>         Some(self.cmp(other))
>     }
> }
> 
> // 6. Implement `Ord` (total ordering)
> impl Ord for ScheduledTask {
>     fn cmp(&self, other: &Self) -> Ordering {
>         // Primary: higher priority first (descending)
>         match other.priority.cmp(&self.priority) {
>             Ordering::Equal => self.task_id.cmp(&other.task_id), // Secondary: lower task_id first
>             non_equal => non_equal,
>         }
>     }
> }
> 
> /// Custom subtrait bounded by `Ord` and `Copy` supertraits
> pub trait PrioritizedTask: Ord + Copy {
>     fn description(&self) -> String;
> 
>     /// Default method utilizing supertrait `Ord` via comparison operators
>     fn executes_before(&self, other: &Self) -> bool {
>         self > other
>     }
> }
> 
> impl PrioritizedTask for ScheduledTask {
>     fn description(&self) -> String {
>         format!("Task #{} (Priority: {})", self.task_id, self.priority)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_task_priority_ordering() {
>         let high_priority = ScheduledTask {
>             priority: 10,
>             task_id: 100,
>         };
>         let low_priority = ScheduledTask {
>             priority: 2,
>             task_id: 101,
>         };
> 
>         // Test Ord operator via PrioritizedTask supertrait default method
>         assert!(high_priority.executes_before(&low_priority));
>         assert!(!low_priority.executes_before(&high_priority));
>         assert_eq!(high_priority.cmp(&low_priority), Ordering::Greater);
>     }
> 
>     #[test]
>     fn test_task_tie_breaking_by_task_id() {
>         let task_earlier = ScheduledTask {
>             priority: 5,
>             task_id: 10,
>         };
>         let task_later = ScheduledTask {
>             priority: 5,
>             task_id: 20,
>         };
> 
>         // Same priority, lower task_id comes first
>         assert!(task_earlier.executes_before(&task_later));
>         assert_eq!(task_earlier.cmp(&task_later), Ordering::Greater);
>     }
> 
>     #[test]
>     fn test_copy_semantics() {
>         let task1 = ScheduledTask {
>             priority: 8,
>             task_id: 50,
>         };
>         let task2 = task1; // Copied, not moved
> 
>         assert_eq!(task1, task2);
>         assert_eq!(task1.description(), task2.description());
>     }
> }
> ```
> 
> **Explanation:**
> 1. **Standard Library Supertrait Dependencies**:
>    - `Copy: Clone`: Bitwise duplication (`Copy`) logically requires value cloning capability (`Clone`).
>    - `Eq: PartialEq`: Total equality requires partial equality reflexivity.
>    - `Ord: Eq + PartialOrd`: Total ordering requires both total equality and partial ordering comparisons.
> 2. **Manual Trait Hierarchy Resolution**: Implementing `Ord` manually forces implementing all supertraits in sequence. `PartialOrd::partial_cmp` delegates directly to `Ord::cmp`.
> 3. **Operator Overloading via Supertraits**: `PrioritizedTask` defines `Ord` as a supertrait bound, enabling the `>` binary comparison operator inside `executes_before` because `Ord` mandates `PartialOrd`.

---

## 7. Related Terms


- [Trait](../level_04/trait.md) — Fundamental trait abstraction concept.
- [Blanket Implementation](blanket_implementation.md) — Implementing traits generically across bounds.
- [Sealed Trait Pattern](sealed_trait_pattern.md) — Design pattern relying on private supertraits to restrict external implementations.
- [Marker Traits](marker_traits.md) — Empty marker traits often used as supertraits (`Send`, `Sync`).

---

## 8. Key Takeaways

- Supertraits (`pub trait Sub: Super`) specify that any type implementing `Sub` MUST also implement `Super`.
- Supertraits declare prerequisite trait bounds; they do NOT provide class-style code inheritance.
- Subtrait default methods can invoke methods defined on supertraits.
- Standard library supertrait examples include `Copy: Clone`, `Eq: PartialEq`, and `Ord: Eq + PartialOrd`.
- Implementing a subtrait requires writing explicit, separate `impl` blocks for both the supertrait and the subtrait.
