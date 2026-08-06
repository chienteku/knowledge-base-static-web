# Formatting Traits (`std::fmt`)

> **Level 4 — Rust**
> Traits in `std::fmt` — `Display`, `Debug`, `LowerHex`, `Binary`, etc. — providing structured text formatting via `{}` and `{:?}` placeholders.

---

## 1. Prerequisites

- [`Display` Trait](display_trait.md) — The Display trait for user-facing formatting.
- [`Debug` Trait](debug_trait.md) — The Debug trait for developer-facing formatting.

---

## 2. Term Category



**Rust Standard Library (custom print formatting traits)**: `Display` (user-facing `{}`) and `Debug` (developer-facing `{:?}`) formatting traits.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Unstructured print statements make debugging and error reporting inconsistent.

Rust categorizes text formatting into `Display` (user-facing output formatted via `{}`) and `Debug` (developer-facing structural inspection formatted via `{:?}`). Structs can derive `#[derive(Debug)]` automatically, while implementing `Display` specifies custom public formatting.

### (2) Reality Metaphor

A museum display plaque vs an engineering blueprint: the display plaque (`Display`) presents a clean title for museum visitors; the engineering blueprint (`Debug`) shows exact internal measurements and structural components for maintenance technicians.

### (3) Rust Code Examples

#### Short Snippet
```rust
use std::fmt;
#[derive(Debug)] struct Point { x: i32, y: i32 }
println!("{:?}", Point { x: 1, y: 2 });
```

#### Fuller Example
```rust
use std::fmt;

pub struct Money {
    pub cents: i64,
}

impl fmt::Display for Money {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "${:.2}", (self.cents as f64) / 100.0)
    }
}

fn main() {
    let m = Money { cents: 1250 };
    assert_eq!(format!("{}", m), "$12.50");
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Attempting to Print Structs with `{}` Without Implementing `Display`

**The mistake:** Using `{}` format placeholder on a struct that only derives `#[derive(Debug)]`.

**Why it is wrong:** `{}` requires explicit implementation of `std::fmt::Display`. Use `{:?}` for `Debug` formatting.

*Incorrect:*
```rust
#[derive(Debug)] struct User { id: u64 } println!("{}", user); // Error!
```

*Fix:*
```rust
println!("{:?}", user); // Use {:?} for Debug!
```

### Mistake 2: Writing Recursive `Display` Implementations Causing Stack Overflow

**The mistake:** Invoking `write!(f, "{}", self)` inside `Display::fmt`.

**Why it is wrong:** Recursively calls `Display::fmt` on `self`, causing a stack overflow crash.

*Incorrect:*
```rust
impl fmt::Display for Item { fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result { write!(f, "{}", self) } }
```

*Fix:*
```rust
Format inner fields: write!(f, "{}", self.name)
```

### Mistake 3: Using `Display` for Internal Debugging Information

**The mistake:** Including private implementation details or memory addresses inside `Display` implementations.

**Why it is wrong:** `Display` is for clean end-user presentation. Put structural details in `Debug` (`{:?}`).

*Incorrect:*
```rust
impl fmt::Display for Node { fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result { write!(f, "Node(ptr={:p})", self) } }
```

*Fix:*
```rust
Use #[derive(Debug)] for structural metadata!
```

---

## 5. Practice Exercises

### Exercise 1: Custom Currency Formatter with `Display` and `Debug`

**Scenario:** Build a custom financial currency struct `Currency` implementing `Display` (formatting as `$1,234.50`) and `Debug` (showing internal integer cents).

**Requirements:**
1. Define `Currency` with `cents: i64`.
1. Implement `Display` formatting as `$D.CC`.
1. Derive `Debug`.
1. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::fmt;
> 
> #[derive(Debug, PartialEq)]
> pub struct Currency {
>     pub cents: i64,
> }
> 
> impl Currency {
>     pub fn from_dollars(dollars: f64) -> Self {
>         Self { cents: (dollars * 100.0) as i64 }
>     }
> }
> 
> impl fmt::Display for Currency {
>     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
>         let dollars = self.cents / 100;
>         let remaining_cents = (self.cents % 100).abs();
>         write!(f, "${}.{:02}", dollars, remaining_cents)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_currency_formatting() {
>         let c = Currency::from_dollars(49.99);
>         assert_eq!(format!("{}", c), "$49.99");
>         assert_eq!(format!("{:?}", c), "Currency { cents: 4999 }");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `Display` implementation formats `Currency` cleanly as `$49.99` for end users.
> 2. Derived `Debug` shows internal struct layout `Currency { cents: 4999 }` for developers.
> 
---

### Exercise 2: Pretty-Printed Hex Byte Array Debug Formatter

**Scenario:** Implement custom `LowerHex` formatting for a byte array struct `MacAddress`.

**Requirements:**
1. Define `MacAddress([u8; 6])`.
1. Implement `fmt::Display` formatting as colon-separated hex.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::fmt;
> 
> pub struct MacAddress(pub [u8; 6]);
> 
> impl fmt::Display for MacAddress {
>     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
>         write!(
>             f,
>             "{:02X}:{:02X}:{:02X}:{:02X}:{:02X}:{:02X}",
>             self.0[0], self.0[1], self.0[2], self.0[3], self.0[4], self.0[5]
>         )
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_mac_display() {
>         let mac = MacAddress([0x00, 0x1A, 0x2B, 0x3C, 0x4D, 0x5E]);
>         assert_eq!(format!("{}", mac), "00:1A:2B:3C:4D:5E");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Custom `Display` formats MAC address bytes into upper-case colon-separated hex representation.
> 
---

### Exercise 3: Custom Struct Pretty Debug Formatter `f.debug_struct()`

**Scenario:** Implement custom `Debug` manually for a `User` struct hiding sensitive password fields.

**Requirements:**
1. Implement `Debug` using `f.debug_struct()` masking password.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::fmt;
> 
> pub struct UserAccount {
>     pub username: String,
>     pub password_hash: String,
> }
> 
> impl fmt::Debug for UserAccount {
>     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
>         f.debug_struct("UserAccount")
>             .field("username", &self.username)
>             .field("password_hash", &"[REDACTED]")
>             .finish()
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_redacted_debug() {
>         let u = UserAccount { username: "alice".into(), password_hash: "secret123".into() };
>         let dbg = format!("{:?}", u);
>         assert!(dbg.contains("[REDACTED]"));
>         assert!(!dbg.contains("secret123"));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `f.debug_struct()` allows building custom developer debug outputs that redact sensitive fields.
> 
---

## 5. Related Terms

- None!

---

## 7. Key Takeaways

- `Display` (`{}`) is for clean user-facing output.
- `Debug` (`{:?}`) is for developer structural inspection.
- Derive `#[derive(Debug)]` automatically for structs.
- Use `f.debug_struct()` to redact sensitive fields in custom `Debug` impls.
