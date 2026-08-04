# Orphan Rule

> **Level 14 — Advanced Traits & Type System**
> A core compiler coherence rule stating that you can implement a trait for a target type if and only if either the trait or the target type is local to (defined within) the current crate.

---

## 1. Prerequisites

- [Traits](../level_04/trait.md) — Standard trait definitions and `impl Trait for Type` blocks.
- [Newtype Pattern](../level_11/newtype_pattern.md) — The primary design pattern used to bypass the Orphan Rule.

---

## 2. Term Category

**Core Concept / Trait / Module System**: The Orphan Rule is a foundational coherence constraint enforced by `rustc`. It dictates that an `impl Trait for Type` block is legal if and only if **at least one of `Trait` or `Type` is local to the crate compiling the `impl` block**. If both `Trait` and `Type` are foreign (defined in the standard library or an external dependency crate), the implementation is rejected with compiler error `E0117`.

---

## 3. Environment Context

**Universal Rust**: The Orphan Rule is enforced universally across all Rust compilation targets (`std`, `no_std`, WASM, embedded systems) to guarantee global trait coherence across the entire Cargo ecosystem.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"

In dynamic languages like JavaScript or Python, developers can dynamically modify foreign object prototypes or classes at runtime (often called "monkey patching"). For example, a JavaScript library can add `.customMethod()` directly onto `Array.prototype`. However, if two third-party npm packages monkey-patch the exact same prototype method name differently, the application breaks unpredictably at runtime due to namespace collisions.

Rust wanted a trait-based polymorphism system that was:
1. **Extensible**: You should be able to implement your custom traits for standard types (`impl MyTrait for String`), and implement standard library traits for your custom types (`impl Display for MyStruct`).
2. **Deterministic & Coherent**: There must *never* exist two conflicting implementations of `impl Trait for Type` in the entire compiled binary dependency graph.
3. **Decoupled**: Adding a dependency to your `Cargo.toml` must not silently break existing trait implementations in other crates.

Consider what would happen without the Orphan Rule:
- Crate A (a third-party library) writes `impl Display for Vec<i32>`.
- Crate B (another third-party library) writes `impl Display for Vec<i32>`.
- Your application imports both Crate A and Crate B.
- Now your application calls `vec.to_string()`. Which `Display` implementation should the compiler choose? The build fails or behaves unpredictably.

The **Orphan Rule** solves this by preventing foreign-trait-on-foreign-type implementations entirely. Crate A and Crate B are forbidden from implementing `Display` (foreign trait from `std`) on `Vec<i32>` (foreign type from `std`).

### (2) Reality Metaphor

Imagine a **Passport Stamp Jurisdiction Policy**:

- **Local Type + Foreign Trait (`impl Display for MyStruct`)**: You bring your local custom passport (**`MyStruct`**) to a foreign consulate (**`Display` trait**). The consulate stamps your passport. This is completely legal because you own the passport.
- **Foreign Type + Local Trait (`impl MyTrait for String`)**: You create a local custom visa stamp (**`MyTrait`**) and stamp a foreign visitor's passport (**`String`**). This is completely legal because you own the visa stamp.
- **Foreign Type + Foreign Trait (`impl Display for Vec<i32>`) — Orphan Rule Violation**: You take a foreign citizen's passport (**`Vec<i32>`**) and try to apply another foreign nation's official consulate stamp (**`Display`**) on their behalf. Border control (**`rustc`**) arrests you for forgery (**Compiler Error `E0117`**) because neither the passport nor the stamp belongs to your country (**crate**)!

### (3) Code Examples

#### Short Snippet (Demonstrating Allowed vs Forbidden Impls)

```rust
use std::fmt::Display;

// 1. LOCAL TYPE
pub struct MyLocalStruct(pub i32);

// 2. LOCAL TRAIT
pub trait MyLocalTrait {
    fn describe(&self) -> String;
}

// ✅ CASE 1: Foreign Trait + Local Type -> ALLOWED!
impl Display for MyLocalStruct {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "MyLocalStruct({})", self.0)
    }
}

// ✅ CASE 2: Local Trait + Foreign Type -> ALLOWED!
impl MyLocalTrait for String {
    fn describe(&self) -> String {
        format!("String of length {}", self.len())
    }
}

// ❌ CASE 3: Foreign Trait + Foreign Type -> FORBIDDEN (Orphan Rule Error E0117)!
// impl Display for Vec<i32> { ... }

fn main() {
    let s = MyLocalStruct(42);
    let text = String::from("Hello");

    println!("Local type with foreign trait: {}", s);
    println!("Foreign type with local trait: {}", text.describe());
}
```

#### Fuller Example (Bypassing the Orphan Rule with the Newtype Pattern)

```rust
use std::fmt::{self, Display};

// SCENARIO: You want to implement foreign trait `Display` for foreign type `Vec<String>`.
// Direct `impl Display for Vec<String>` is rejected by the Orphan Rule.

// SOLUTION: The Newtype Pattern!
// Wrap the foreign type `Vec<String>` inside a local tuple struct `MyStringList`.
pub struct MyStringList(pub Vec<String>);

// Now `MyStringList` is a LOCAL TYPE!
// Implementing foreign trait `Display` on local type `MyStringList` is 100% LEGAL:
impl Display for MyStringList {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "[")?;
        for (i, item) in self.0.iter().enumerate() {
            if i > 0 { write!(f, ", ")?; }
            write!(f, "\"{}\"", item)?;
        }
        write!(f, "]")
    }
}

fn main() {
    let raw_list = vec![String::from("Alice"), String::from("Bob"), String::from("Charlie")];
    
    // Wrap foreign Vec inside local Newtype
    let list = MyStringList(raw_list);

    // Call Display trait
    println!("Formatted string list: {}", list);
    // Output: Formatted string list: ["Alice", "Bob", "Charlie"]
}
```

---

## 4. Legal vs Illegal Orphan Rule Combinations

| Trait Origin | Type Origin | Status | Example |
| :--- | :--- | :--- | :--- |
| **Local Crate** | **Local Crate** | ✅ Allowed | `impl MyTrait for MyStruct` |
| **Foreign Crate** | **Local Crate** | ✅ Allowed | `impl std::fmt::Display for MyStruct` |
| **Local Crate** | **Foreign Crate** | ✅ Allowed | `impl MyTrait for String` |
| **Foreign Crate** | **Foreign Crate** | ❌ **Forbidden (E0117)** | `impl std::fmt::Display for Vec<i32>` |

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Attempting `impl ForeignTrait for ForeignType` Directly

**The mistake:** Writing `impl serde::Serialize for std::time::Duration` in your application crate when `serde` doesn't provide the feature flag.

**Why it's wrong:** Both `Serialize` and `Duration` are defined in external crates (`serde` and `std`). The compiler rejects this with `E0117`.

*Incorrect:*
```rust
// ❌ Compiler Error E0117: Only traits defined in the current crate can be implemented for arbitrary types
impl serde::Serialize for std::time::Duration {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where S: serde::Serializer {
        serializer.serialize_u64(self.as_millis() as u64)
    }
}
```

*Fix:*
```rust
// Correct: Use the Newtype Pattern or serde's `#[serde(with = "...")]` helper modules
pub struct MyDuration(pub std::time::Duration);

impl serde::Serialize for MyDuration {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where S: serde::Serializer {
        serializer.serialize_u64(self.0.as_millis() as u64)
    }
}
```

### Mistake 2: Forgetting Covers for Generic Type Parameters in `impl<T> ForeignTrait for ForeignType<T>`

**The mistake:** Thinking that introducing a local generic parameter `impl<T> Display for Vec<MyLocalStruct<T>>` bypasses the Orphan Rule.

**Why it's wrong:** Fundamental rules for generic covered types require the local type to appear as an uncovered parameter before any foreign parameters in the generic header.

*Incorrect:*
```rust
pub struct MyType;
// ❌ Still rejected! `Vec<T>` is considered a foreign type constructor.
// impl Display for Vec<MyType> { ... }
```

*Fix:*
```rust
// Wrap in a local newtype constructor:
pub struct MyVec(pub Vec<MyType>);
impl Display for MyVec { ... }
```

### Mistake 3: Misunderstanding Crate Locality in Monorepos / Workspaces

**The mistake:** Assuming two sub-crates within the same Cargo workspace count as the "same crate" for Orphan Rule checks.

**Why it's wrong:** The Orphan Rule operates at the *individual compilation unit (crate)* level, not at the Cargo workspace level. Trait definitions in `crate_a` are foreign to `crate_b` even if they live in the same git repository.

*Incorrect:*
```rust
// In workspace crate_b (trying to implement crate_a's trait on std::String):
// ❌ Forbidden if `crate_b` does not define either the trait or String!
```

*Fix:*
```rust
// Define the `impl` inside `crate_a` (where the trait lives) or wrap in a newtype in `crate_b`.
```

---

## 6. Practice Exercises

### Exercise 1: Bypassing Foreign Trait on Foreign Tuple Type (`TelemetryReading`)

**Problem:**
In an industrial IoT monitoring system, sensor nodes transmit telemetry payload tuples formatted as standard primitive pairs `(u64, f64)`, where the first element is a UNIX timestamp in milliseconds and the second is a temperature reading in Celsius. You need to format these readings using `std::fmt::Display` as `"Timestamp: <ts> ms | Temp: <temp> °C"`.

Writing `impl std::fmt::Display for (u64, f64)` causes compiler error `E0117` because both `Display` and the tuple type `(u64, f64)` are foreign to your crate.

Construct a local newtype wrapper `TelemetryReading(pub (u64, f64))`. Implement `std::fmt::Display` and `std::ops::Deref` for `TelemetryReading`. Include unit tests with assertions (`assert_eq!`) verifying string formatting and transparent field access via `Deref`.

> [!check]- Answer
> ```rust
> use std::fmt;
> use std::ops::Deref;
> 
> /// Local Newtype wrapping the foreign tuple type (u64, f64)
> #[derive(Debug, PartialEq)]
> pub struct TelemetryReading(pub (u64, f64));
> 
> /// Implementing foreign trait Display for local type TelemetryReading is 100% legal
> impl fmt::Display for TelemetryReading {
>     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
>         write!(f, "Timestamp: {} ms | Temp: {:.1} °C", (self.0).0, (self.0).1)
>     }
> }
> 
> /// Implement Deref for ergonomic transparent access to the inner tuple
> impl Deref for TelemetryReading {
>     type Target = (u64, f64);
> 
>     fn deref(&self) -> &Self::Target {
>         &self.0
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_telemetry_display_formatting() {
>         let reading = TelemetryReading((1718900000000, 23.45));
>         let formatted = format!("{}", reading);
>         assert_eq!(formatted, "Timestamp: 1718900000000 ms | Temp: 23.5 °C");
>     }
> 
>     #[test]
>     fn test_telemetry_deref_access() {
>         let reading = TelemetryReading((1718900000000, 45.2));
>         // Transparent field access enabled by Deref targeting (u64, f64)
>         assert_eq!(reading.0, 1718900000000);
>         assert_eq!(reading.1, 45.2);
>     }
> }
> ```
>
> **Explanation:**
> 1. **Compiler Error E0117 Cause**: Primitive tuples such as `(u64, f64)` are defined by the Rust standard library language rules, and `std::fmt::Display` is defined in `std::fmt`. Because neither item is local to your compiling crate, Rust's Orphan Rule rejects direct implementation to prevent coherence ambiguity.
> 2. **Newtype Wrapper Strategy**: `TelemetryReading` is a local tuple struct declared in your crate. Wrapping foreign data inside a local type satisfies the Orphan Rule constraint (`Foreign Trait + Local Type -> ALLOWED`).
> 3. **Deref Ergonomics**: By implementing `std::ops::Deref<Target = (u64, f64)>`, callers can access `.0` and `.1` directly on `TelemetryReading` as if it were the inner tuple, preserving convenience without violating compiler guarantees.
> 4. **Unit Verification**: The unit tests use `assert_eq!` to validate string output formatting precision (`23.5 °C`) and transparent tuple dereferencing.

---

### Exercise 2: Embedded `#![no_std]` Hardware Status Register Wrapper & Custom Trait

**Problem:**
In an embedded `#![no_std]` driver for a CAN-bus microcontroller, raw hardware status registers are returned as primitive `u16` values. You need to provide hexadecimal formatting via `core::fmt::LowerHex`, bitwise OR combination via `core::ops::BitOr`, and register state querying via a custom local trait `RegisterDiagnostics`.

1. Create a `#![no_std]` compatible local newtype wrapper `StatusRegister(pub u16)`.
2. Implement `core::fmt::LowerHex`, `core::ops::BitOr`, and a local trait `RegisterDiagnostics` for `StatusRegister`.
3. Include unit tests with `assert!` and `assert_eq!` verifying bitwise operations, hex formatting, and diagnostic bit check logic.

> [!check]- Answer
> ```rust
> #![no_std]
> use core::fmt;
> use core::ops::BitOr;
> 
> /// Local trait defined within our embedded library crate
> pub trait RegisterDiagnostics {
>     fn is_error(&self) -> bool;
>     fn is_ready(&self) -> bool;
> }
> 
> /// Local Newtype wrapping raw primitive u16 hardware register
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub struct StatusRegister(pub u16);
> 
> impl StatusRegister {
>     pub const READY_BIT: u16 = 1 << 0; // Bit 0: Device Ready
>     pub const ERROR_BIT: u16 = 1 << 3; // Bit 3: Hardware Error
> }
> 
> /// Foreign trait core::fmt::LowerHex implemented for local type StatusRegister
> impl fmt::LowerHex for StatusRegister {
>     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
>         write!(f, "0x{:04x}", self.0)
>     }
> }
> 
> /// Foreign trait core::ops::BitOr implemented for local type StatusRegister
> impl BitOr for StatusRegister {
>     type Output = Self;
> 
>     fn bitor(self, rhs: Self) -> Self::Output {
>         StatusRegister(self.0 | rhs.0)
>     }
> }
> 
> /// Local trait implemented for local type StatusRegister
> impl RegisterDiagnostics for StatusRegister {
>     fn is_error(&self) -> bool {
>         (self.0 & Self::ERROR_BIT) != 0
>     }
> 
>     fn is_ready(&self) -> bool {
>         (self.0 & Self::READY_BIT) != 0
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
>     extern crate std;
>     use std::format;
> 
>     #[test]
>     fn test_register_bitor_and_diagnostics() {
>         let reg_ready = StatusRegister(StatusRegister::READY_BIT);
>         let reg_error = StatusRegister(StatusRegister::ERROR_BIT);
> 
>         let combined = reg_ready | reg_error;
> 
>         assert!(combined.is_ready());
>         assert!(combined.is_error());
>         assert_eq!(combined.0, 0x0009);
>     }
> 
>     #[test]
>     fn test_register_hex_formatting() {
>         let reg = StatusRegister(0x0A3F);
>         let formatted = format!("{:x}", reg);
>         assert_eq!(formatted, "0x0a3f");
>     }
> }
> ```
>
> **Explanation:**
> 1. **Embedded Coherence Scope**: The Orphan Rule applies identically in `#![no_std]` targets. Attempting `impl core::fmt::LowerHex for u16` is forbidden because both `LowerHex` and `u16` are foreign to your driver crate.
> 2. **Local Wrapper Bitwise Operations**: Wrapping `u16` in `StatusRegister` allows implementing standard operator traits like `core::ops::BitOr`, enabling clean syntactic sugar `reg_ready | reg_error`.
> 3. **Local Trait vs Foreign Trait Rules**: Implementing local trait `RegisterDiagnostics` on local struct `StatusRegister` satisfies the `Local Trait + Local Type` allowed rule, while implementing `core::fmt::LowerHex` satisfies `Foreign Trait + Local Type`.
> 4. **Unit Verification**: Unit tests verify bitwise masking correctness with `assert!`, raw integer equality with `assert_eq!`, and string hex output formatting.
> 
---

### Exercise 3: Dissecting Generic Covered Types (`impl<T> ForeignTrait for ForeignType<T>`)

**Problem:**
An analytics microservice developer defines a local struct `MetricValue(pub f64)` and wants to implement `std::fmt::Display` for `Vec<MetricValue>` to print comma-separated metrics.

They write `impl std::fmt::Display for Vec<MetricValue>`, but `rustc` rejects it with `E0117` despite `MetricValue` being a local type.

1. Explain why `Vec<MetricValue>` is treated as a foreign type constructor under Rust orphan and generic type rules.
2. Construct a generic local newtype `MetricSeries<T>(pub Vec<T>)`.
3. Implement `std::fmt::Display` for `MetricSeries<T>` where `T: std::fmt::Display`, as well as `From<Vec<T>>` and `std::ops::Deref`.
4. Write unit tests with `assert_eq!` verifying formatted series rendering and dereferencing behavior.

> [!check]- Answer
> ```rust
> use std::fmt;
> use std::ops::Deref;
> 
> #[derive(Debug, PartialEq)]
> pub struct MetricValue(pub f64);
> 
> impl fmt::Display for MetricValue {
>     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
>         write!(f, "{:.2}", self.0)
>     }
> }
> 
> /// Local generic collection wrapper bypassing the Orphan Rule
> #[derive(Debug, PartialEq)]
> pub struct MetricSeries<T>(pub Vec<T>);
> 
> /// Implementing foreign trait Display for local generic wrapper MetricSeries<T>
> impl<T: fmt::Display> fmt::Display for MetricSeries<T> {
>     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
>         write!(f, "[")?;
>         for (i, item) in self.0.iter().enumerate() {
>             if i > 0 {
>                 write!(f, ", ")?;
>             }
>             write!(f, "{}", item)?;
>         }
>         write!(f, "]")
>     }
> }
> 
> impl<T> From<Vec<T>> for MetricSeries<T> {
>     fn from(vec: Vec<T>) -> Self {
>         MetricSeries(vec)
>     }
> }
> 
> impl<T> Deref for MetricSeries<T> {
>     type Target = Vec<T>;
> 
>     fn deref(&self) -> &Self::Target {
>         &self.0
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_metric_series_display() {
>         let metrics = vec![MetricValue(12.345), MetricValue(67.891), MetricValue(0.123)];
>         let series = MetricSeries::from(metrics);
> 
>         let output = format!("{}", series);
>         assert_eq!(output, "[12.35, 67.89, 0.12]");
>     }
> 
>     #[test]
>     fn test_metric_series_deref_ops() {
>         let series = MetricSeries(vec![MetricValue(1.0), MetricValue(2.0)]);
>         assert_eq!(series.len(), 2);
>         assert_eq!(series[0], MetricValue(1.0));
>     }
> }
> ```
>
> **Explanation:**
> 1. **Generic Covered Rules (RFC 2451)**: In `impl Display for Vec<MetricValue>`, `Display` is a foreign trait and `Vec<T>` is a foreign type constructor defined in `std`. Even though `MetricValue` is local, putting a local type inside a foreign generic container (`Vec<LocalType>`) does not make the outer container a local type. Rust considers `Vec<MetricValue>` foreign, triggering `E0117`.
> 2. **Generic Local Container**: Creating `MetricSeries<T>(pub Vec<T>)` defines a local generic type constructor. Because `MetricSeries` is local to the current crate, `impl<T: Display> Display for MetricSeries<T>` is fully valid for all `T`.
> 3. **Conversion & Ergonomics**: Implementing `From<Vec<T>>` allows effortless wrapping of existing vectors, while `Deref` delegates vector operations (`len()`, indexing) directly to the wrapped `Vec`.
> 4. **Unit Verification**: `test_metric_series_display` asserts that floating-point formatting is correctly applied to each element during string formatting.
> 
---

### Exercise 4: Domain Adapter Pattern for External Crate Duration Formatting

**Problem:**
Your microservice imports `std::time::Duration` from the standard library. You need to output durations in floating-point seconds format (e.g. `"1.500s"`) for logging and diagnostic reporting.

Directly attempting `impl std::fmt::Display for std::time::Duration` triggers compiler error `E0117` because both `Display` and `Duration` are defined in `std`.

1. Create a local wrapper `DurationSeconds(pub std::time::Duration)`.
2. Implement a helper method `as_secs_f64(&self) -> f64` that computes fractional seconds from whole seconds and nanoseconds.
3. Implement `std::fmt::Display` and `From<std::time::Duration>` for `DurationSeconds`.
4. Write unit tests with `assert_eq!` validating conversion precision and `Display` string output.

> [!check]- Answer
> ```rust
> use std::fmt;
> use std::time::Duration;
> 
> /// Local Newtype wrapping foreign std::time::Duration
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub struct DurationSeconds(pub Duration);
> 
> impl From<Duration> for DurationSeconds {
>     fn from(dur: Duration) -> Self {
>         DurationSeconds(dur)
>     }
> }
> 
> impl DurationSeconds {
>     /// Helper method returning total duration as floating-point seconds
>     pub fn as_secs_f64(&self) -> f64 {
>         self.0.as_secs() as f64 + (self.0.subsec_nanos() as f64 / 1_000_000_000.0)
>     }
> }
> 
> /// Foreign trait Display implemented for local type DurationSeconds
> impl fmt::Display for DurationSeconds {
>     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
>         write!(f, "{:.3}s", self.as_secs_f64())
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_duration_seconds_conversion() {
>         let dur = Duration::from_millis(1500);
>         let wrapper = DurationSeconds::from(dur);
> 
>         assert_eq!(wrapper.as_secs_f64(), 1.5);
>         assert_eq!(format!("{}", wrapper), "1.500s");
>     }
> 
>     #[test]
>     fn test_duration_seconds_subsecond_precision() {
>         let dur = Duration::new(2, 250_000_000); // 2.25 seconds
>         let wrapper = DurationSeconds(dur);
> 
>         assert_eq!(wrapper.as_secs_f64(), 2.25);
>         assert_eq!(format!("{}", wrapper), "2.250s");
>     }
> }
> ```
>
> **Explanation:**
> 1. **Foreign Type Adapter Pattern**: When external libraries or `std` types lack necessary trait implementations, the Newtype pattern acts as an adapter layer without requiring upstream crate modifications or violating coherence.
> 2. **Orphan Rule Compliance**: `DurationSeconds` is local, so implementing `fmt::Display` (foreign) is accepted by `rustc`.
> 3. **Conversion Interoperability**: Implementing `From<Duration>` provides standard Rust idiomatic conversion semantics (`DurationSeconds::from(dur)`).
> 4. **Unit Verification**: Tests use `assert_eq!` to verify subsecond arithmetic accuracy (`2.250s`) and formatting consistency.
> 
---

## 7. Related Terms

- [Coherence](../level_14/coherence.md) — The global non-ambiguity guarantee enforced by the Orphan Rule.
- [Newtype Pattern](../level_11/newtype_pattern.md) — The idiomatic tuple struct wrapper used to bypass Orphan Rule restrictions.
- [Blanket Implementation](../level_14/blanket_implementation.md) — Generic trait implementations governed by coherence and orphan rules.
- [Traits](../level_04/trait.md) — The interface abstraction system governed by coherence.

---

## 8. Key Takeaways

- The Orphan Rule requires that at least one of `Trait` or `Type` must be local to the current crate in any `impl Trait for Type` block.
- Foreign-trait-on-foreign-type implementations (e.g. `impl Display for Vec<i32>`) are rejected with compiler error `E0117`.
- The rule prevents global namespace collisions and monkey-patching bugs across Cargo dependencies.
- Use the **Newtype Pattern** (`struct MyWrapper(pub ForeignType)`) to bypass the Orphan Rule safely when foreign trait formatting is required.
