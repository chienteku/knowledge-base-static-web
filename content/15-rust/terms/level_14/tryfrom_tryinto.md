# `TryFrom` and `TryInto` Traits

> **Level 14 — Rust**
> Fallible type conversion traits that return `Result<T, E>`, used when a conversion might fail (e.g. converting `i64` to `u8` may overflow), complementing the infallible `From`/`Into`.

---

## 1. Prerequisites

- [`TryFrom` / `TryInto`](try_from_try_into.md) — TryFrom / TryInto traits.

---

## 2. Term Category



**Rust Conversion Traits (fallible value conversion traits)**: `TryFrom` and `TryInto` for conversions that can fail.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Converting integers across sizes (`u64` to `u8`) or parsing strings into domain types can fail due to overflow or invalid formatting. C-style silent truncation creates security vulnerabilities.

`TryFrom<T>` (`fn try_from(value: T) -> Result<Self, Self::Error>`) provides safe fallible conversions. Implementing `TryFrom<T>` automatically generates `TryInto<T>` for free via Rust's blanket implementation.

### (2) Reality Metaphor

A size-restricted mail slot validator: if a parcel fits within dimensions, it passes through safely; if oversized, the validator rejects it with an error code.

### (3) Rust Code Examples

#### Short Snippet
```rust
use std::convert::TryFrom;
let val: u8 = u8::try_from(255u32).unwrap();
assert!(u8::try_from(256u32).is_err());
```

#### Fuller Example
```rust
use std::convert::TryFrom;

#[derive(Debug, PartialEq)]
pub struct Port(pub u16);

impl TryFrom<u32> for Port {
    type Error = &'static str;
    fn try_from(val: u32) -> Result<Self, Self::Error> {
        if val > 0 && val <= 65535 {
            Ok(Port(val as u16))
        } else {
            Err("Port out of valid u16 range")
        }
    }
}

fn main() {
    let valid = Port::try_from(8080u32);
    let invalid = Port::try_from(70000u32);
    assert_eq!(valid, Ok(Port(8080)));
    assert!(invalid.is_err());
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using Infallible `From` for Fallible Operations

**The mistake:** Implementing `From<T>` and panicking inside `from()` when conversion fails.

**Why it is wrong:** `From` must never panic. Use `TryFrom` and return a structured `Result<T, E>` for fallible conversions.

*Incorrect:*
```rust
impl From<u32> for u8 { fn from(v: u32) -> Self { v.try_into().unwrap() } }
```

*Fix:*
```rust
impl TryFrom<u32> for u8 { type Error = ...; fn try_from(v: u32) -> Result<Self, Self::Error> { ... } }
```

### Mistake 2: Implementing `TryInto<T>` Directly Instead of `TryFrom<T>`

**The mistake:** Implementing `TryInto<Target>` for a source type.

**Why it is wrong:** Implementing `TryFrom<Source>` automatically generates `TryInto<Target>` via blanket implementation.

*Incorrect:*
```rust
impl TryInto<Port> for u32 { ... }
```

*Fix:*
```rust
impl TryFrom<u32> for Port { ... } // Blanket TryInto implementation included!
```

### Mistake 3: Ignoring Integer Truncation in Bitwise Casts (`as`)

**The mistake:** Using `as` casting for untrusted integer inputs instead of `TryFrom`.

**Why it is wrong:** `as` casting silently truncates upper bits, introducing security bugs.

*Incorrect:*
```rust
let SmallVal = big_int as u8; // Silent truncation!
```

*Fix:*
```rust
let SmallVal = u8::try_from(big_int)?; // Checked bounds conversion!
```

---

## 5. Practice Exercises

### Exercise 1: Bounded Percentage Type Fallible Conversion

**Scenario:** Implement a fallible conversion from `f64` into a `Percentage` struct enforcing bounds between `0.0` and `100.0`.

**Requirements:**
1. Define `Percentage(f64)` struct.
1. Implement `TryFrom<f64>`.
1. Write unit tests for valid and out-of-bound inputs.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::convert::TryFrom;
> 
> #[derive(Debug, PartialEq)]
> pub struct Percentage(pub f64);
> 
> impl TryFrom<f64> for Percentage {
>     type Error = &'static str;
>     fn try_from(val: f64) -> Result<Self, Self::Error> {
>         if (0.0..=100.0).contains(&val) {
>             Ok(Percentage(val))
>         } else {
>             Err("Percentage must be between 0.0 and 100.0")
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_try_from_percentage() {
>         let valid = Percentage::try_from(85.5);
>         let negative = Percentage::try_from(-5.0);
>         let overflow = Percentage::try_from(105.0);
> 
>         assert_eq!(valid, Ok(Percentage(85.5)));
>         assert!(negative.is_err());
>         assert!(overflow.is_err());
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `TryFrom<f64>` returns `Result<Percentage, &'static str>`.
> 2. Safely enforces domain invariants during conversion.
> 
---

### Exercise 2: Network Packet Header Size Conversion

**Scenario:** Implement fallible conversion from `usize` packet length to `u16` header field.

**Requirements:**
1. Implement `TryFrom<usize>` for `u16` header size wrapper.
1. Test bounds.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::convert::TryFrom;
> 
> #[derive(Debug, PartialEq)]
> pub struct HeaderLen(pub u16);
> 
> impl TryFrom<usize> for HeaderLen {
>     type Error = &'static str;
>     fn try_from(len: usize) -> Result<Self, Self::Error> {
>         u16::try_from(len)
>             .map(HeaderLen)
>             .map_err(|_| "Packet length exceeds u16 max size")
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_header_len_try_from() {
>         assert_eq!(HeaderLen::try_from(1024usize), Ok(HeaderLen(1024)));
>         assert!(HeaderLen::try_from(70000usize).is_err());
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Delegates to integer `u16::try_from` to prevent silent overflow.
> 
---

### Exercise 3: Enum Variant String Parser via `TryFrom`

**Scenario:** Implement `TryFrom<&str>` for a `UserRole` enum (`Admin`, `User`, `Guest`).

**Requirements:**
1. Define `UserRole` enum.
1. Implement `TryFrom<&str>`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::convert::TryFrom;
> 
> #[derive(Debug, PartialEq)]
> pub enum UserRole { Admin, User, Guest }
> 
> impl TryFrom<&str> for UserRole {
>     type Error = String;
>     fn try_from(s: &str) -> Result<Self, Self::Error> {
>         match s.to_lowercase().as_str() {
>             "admin" => Ok(UserRole::Admin),
>             "user" => Ok(UserRole::User),
>             "guest" => Ok(UserRole::Guest),
>             _ => Err(format!("Unknown role: {s}")),
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_role_try_from() {
>         assert_eq!(UserRole::try_from("ADMIN"), Ok(UserRole::Admin));
>         assert!(UserRole::try_from("superman").is_err());
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Idiomatic fallible string parsing into enum variants using `TryFrom`.
> 
---

## 6. Related Terms

- [`as` Casting (Primitive Numeric Coercion)](../level_01/as_casting.md) — 
- [`Any` Trait / Downcasting](../level_04/any_trait_downcasting.md) — 
- [`From` / `Into` Traits](../level_04/from_into_traits.md) — 
- [`FromStr` Trait & `.parse()`](../level_04/fromstr_parse.md) — 
- [`TryFrom` / `TryInto`](try_from_try_into.md) — TryFrom/TryInto family.

---

## 7. Key Takeaways

- Provides safe fallible type conversions returning `Result<T, E>`.
- Implementing `TryFrom<T>` automatically generates `TryInto<T>` blanket implementation.
- Use `TryFrom` instead of panicking inside `From`.
- Replaces dangerous silent `as` integer truncation.
