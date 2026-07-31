# Newtype Pattern

> **Level 11 — Smart Pointers & Advanced Types**
> Wrapping a type in a single-field tuple struct for type safety, e.g. `struct Meters(f64);`.

---

## 1. Prerequisites

- [Tuple Structs](../level_02/tuple_struct.md) — The fundamental syntax used to create a Newtype.
- [Traits](../level_04/trait.md) — The interfaces that the Newtype pattern is often used to implement.

---

## 2. Term Category

**Rust Design Pattern (the type safety wrapper)**: The Newtype pattern is one of the most famous and widely used architectural patterns in Rust. 

It involves creating a single-element Tuple Struct that wraps an existing, basic type. It is used to enforce mathematical units at compile time, to enforce security rules, or to bypass the infamous "Orphan Rule" when implementing traits!

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Consider a massive physics engine. You have a function `fn launch_rocket(velocity: f64)`. The `velocity` is a raw float. Is it miles-per-hour? Kilometers-per-hour? Meters-per-second? 

In 1999, NASA lost the $125 million *Mars Climate Orbiter* because one software team used metric units and another team used imperial units, passing the wrong raw floats into each other's functions! 

The Newtype pattern mathematically prevents this disaster. By wrapping the raw `f64` in `struct Kilometers(f64);` and `struct Miles(f64);`, the Rust compiler will completely reject a program that tries to pass `Miles` into a function expecting `Kilometers`. Zero runtime cost, infinite safety.

### (2) Reality Metaphor

Imagine you have a standard $100 bill (a raw `f64`). It looks identical to every other piece of paper money.

- **Raw Data**: You hand the $100 bill to a cashier in London. They blindly accept it, try to put it in their register, and get fired because it's the wrong currency.
- **Newtype Pattern**: You take the $100 bill and seal it inside a bright green envelope heavily labeled **"US DOLLARS ONLY"** (`struct USD(f64)`). If you try to hand the green envelope to the cashier in London, they instantly reject it before the transaction even begins (Compile Time Error). The money inside is the exact same, but the envelope enforces the rules!

### (3) Rust Code Examples

#### Short Snippet (Enforcing Units)
Because a Newtype is just a struct with one field, it takes up the exact same amount of memory as the raw type. At runtime, the struct disappears completely!

```rust
// We define two distinct Newtypes. Both hold an f64.
struct Kilometers(f64);
struct Miles(f64);

// This function strictly requires Kilometers
fn travel(distance: Kilometers) {
    println!("Traveling {} km", distance.0); // Access the inner f64 using .0
}

fn main() {
    let km = Kilometers(100.0);
    let mi = Miles(62.0);

    travel(km); // SUCCESS!
    // travel(mi); // COMPILE ERROR: expected `Kilometers`, found `Miles`!
}
```

#### Fuller Example (Bypassing the Orphan Rule)
In Rust, the **Orphan Rule** states that you cannot implement an *external* trait on an *external* type. If you try to implement Rust's built-in `Display` trait on Rust's built-in `Vec`, the compiler blocks you!

The official, compiler-approved workaround is the Newtype pattern! 

```rust
use std::fmt;

// We cannot do `impl fmt::Display for Vec<i32>`.
// So we wrap the Vec in a LOCAL Newtype!
struct MyVec(Vec<i32>);

// Because MyVec is our local type, the Orphan Rule is bypassed!
impl fmt::Display for MyVec {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        // We access the inner vector using self.0
        write!(f, "[{}]", self.0.iter().map(|n| n.to_string()).collect::<Vec<_>>().join(", "))
    }
}

fn main() {
    let v = MyVec(vec![1, 2, 3]);
    println!("My formatted vector: {}", v); // Prints: [1, 2, 3]
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Newtype Pattern Scoping and Lifecycle Rules

**The mistake:** Assuming Newtype Pattern instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0106` or `E0515`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("newtype_pattern_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("newtype_pattern_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Newtype Pattern State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Newtype Pattern through an immutable reference `&T` or without specifying `mut` in variable declarations.

**Why it's wrong:** Rust's aliasing XOR mutability rule (`&T` for shared immutable access, `&mut T` for exclusive mutable access) prohibits mutating state through shared references unless interior mutability patterns (e.g. `RefCell`, `Mutex`) are explicitly used.

*Incorrect:*
```rust
fn update_val(data: &i32) {
    // *data += 1; // ❌ Error E0594: cannot assign to `*data`, which is behind a `&` reference
}
```

*Fix:*
```rust
fn update_val(data: &mut i32) {
    *data += 1; // Correct: exclusive mutable reference permits mutation
}
```

### Mistake 3: Concurrent Access to Newtype Pattern Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Newtype Pattern instances across OS threads via `std::thread::spawn`.

**Why it's wrong:** Types that do not implement `Send` or `Sync` marker traits cannot safely cross thread boundaries. The compiler prevents data races by raising compile errors `E0277` (`trait Send is not implemented`).

*Incorrect:*
```rust
use std::rc::Rc;
use std::thread;

let rc = Rc::new(42);
// thread::spawn(move || { println!("{}", rc); }); // ❌ Error E0277: `Rc` cannot be sent between threads safely
```

*Fix:*
```rust
use std::sync::Arc;
use std::thread;

let arc = Arc::new(42);
thread::spawn(move || {
    println!("{}", arc); // Correct: `Arc` implements `Send` and `Sync`
});
```

---

## 5. Practice Exercises

### Exercise 1: Domain-Driven Security & Type-Safe Identifiers

**Problem:**
In a multi-tenant web backend, passing raw `u64` primitive types for database IDs (such as `UserId` vs `TenantId`) creates serious security risks if IDs are accidentally swapped in query parameters. Furthermore, accepting raw string user input without type-safe sanitization can lead to Cross-Site Scripting (XSS) vulnerabilities when rendered into HTML.

Create a domain-safe system using the Newtype pattern:
1. Define distinct tuple struct newtypes `UserId(pub u64)`, `TenantId(pub u64)`, `UnsanitizedHtml(pub String)`, and `SanitizedHtml(pub String)`.
2. Implement a `sanitize(self) -> SanitizedHtml` method on `UnsanitizedHtml` that converts HTML special characters (`<`, `>`, `&`, `"`, `'`) to their safe entity equivalents (`&lt;`, `&gt;`, `&amp;`, `&quot;`, `&#x27;`).
3. Write a function `fetch_user_profile(tenant_id: TenantId, user_id: UserId) -> Result<String, String>` that strictly enforces ID separation at compile time and rejects zero values.
4. Include comprehensive unit tests (`#[test]`) verifying type separation, validation logic, and sanitization correctness using `assert_eq!`, `assert!`, and error assertions.

> [!check]- Answer
> ```rust
> #[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
> pub struct UserId(pub u64);
> 
> #[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
> pub struct TenantId(pub u64);
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct UnsanitizedHtml(pub String);
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct SanitizedHtml(pub String);
> 
> impl UnsanitizedHtml {
>     pub fn new(raw: impl Into<String>) -> Self {
>         Self(raw.into())
>     }
> 
>     pub fn sanitize(self) -> SanitizedHtml {
>         let sanitized = self.0
>             .replace('&', "&amp;")
>             .replace('<', "&lt;")
>             .replace('>', "&gt;")
>             .replace('"', "&quot;")
>             .replace('\'', "&#x27;");
>         SanitizedHtml(sanitized)
>     }
> }
> 
> impl SanitizedHtml {
>     pub fn as_str(&self) -> &str {
>         &self.0
>     }
> }
> 
> pub fn fetch_user_profile(tenant_id: TenantId, user_id: UserId) -> Result<String, String> {
>     if tenant_id.0 == 0 || user_id.0 == 0 {
>         return Err("Invalid Tenant or User ID".to_string());
>     }
>     Ok(format!("Profile for User {} in Tenant {}", user_id.0, tenant_id.0))
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_type_safe_id_separation() {
>         let tenant = TenantId(1001);
>         let user = UserId(42);
>         let result = fetch_user_profile(tenant, user);
>         assert_eq!(result, Ok("Profile for User 42 in Tenant 1001".to_string()));
>     }
> 
>     #[test]
>     fn test_invalid_ids_returns_error() {
>         let tenant = TenantId(0);
>         let user = UserId(42);
>         let result = fetch_user_profile(tenant, user);
>         assert!(result.is_err());
>         assert_eq!(result.unwrap_err(), "Invalid Tenant or User ID");
>     }
> 
>     #[test]
>     fn test_html_sanitization() {
>         let unsafe_input = UnsanitizedHtml::new("<script>alert('xss & dangerous');</script>");
>         let safe_output = unsafe_input.sanitize();
>         assert_eq!(
>             safe_output.as_str(),
>             "&lt;script&gt;alert(&#x27;xss &amp; dangerous&#x27;);&lt;/script&gt;"
>         );
>     }
> }
> ```
> 
> **Explanation:**
> 1. **Compile-Time Domain Safety:** By wrapping raw `u64` in `UserId` and `TenantId`, the Rust compiler prevents accidentally swapping arguments (e.g., passing a `TenantId` where a `UserId` is expected).
> 2. **State Transition & Invariant Enforcement:** `UnsanitizedHtml` cannot be rendered directly into HTML components. The only way to obtain a `SanitizedHtml` instance is by consuming the `UnsanitizedHtml` through `.sanitize()`.
> 3. **Zero-Cost Abstraction:** Rust optimizes single-element tuple structs to have the exact memory layout as the underlying primitive, incurring zero runtime performance penalty.

---

### Exercise 2: Physical Unit Safety & Operator Overloading

**Problem:**
In scientific computing and physics engines, mixing unit types (such as adding distance to time or dividing time by distance instead of distance by time) causes catastrophic errors.

Implement a dimensional unit calculation system using Newtypes and operator overloading:
1. Define newtypes `Meters(pub f64)`, `Seconds(pub f64)`, and `MetersPerSecond(pub f64)` with `#[repr(transparent)]`.
2. Implement `std::ops::Add` and `std::ops::Sub` for `Meters` to allow adding and subtracting distances.
3. Implement `std::ops::Div<Seconds>` for `Meters` (`Meters / Seconds -> MetersPerSecond`) to compute velocity.
4. Implement `std::ops::Mul<Seconds>` for `MetersPerSecond` (`MetersPerSecond * Seconds -> Meters`) to compute distance.
5. Implement `std::fmt::Display` formatting for `Meters` and `MetersPerSecond`.
6. Write unit tests (`#[test]`) using assertions (`assert_eq!`, `assert!`, precision tolerances) testing arithmetic operations, velocity calculation, distance reconstruction, and string formatting.

> [!check]- Answer
> ```rust
> use std::fmt;
> use std::ops::{Add, Div, Mul, Sub};
> 
> #[derive(Debug, Clone, Copy, PartialEq, PartialOrd)]
> #[repr(transparent)]
> pub struct Meters(pub f64);
> 
> #[derive(Debug, Clone, Copy, PartialEq, PartialOrd)]
> #[repr(transparent)]
> pub struct Seconds(pub f64);
> 
> #[derive(Debug, Clone, Copy, PartialEq, PartialOrd)]
> #[repr(transparent)]
> pub struct MetersPerSecond(pub f64);
> 
> impl Add for Meters {
>     type Output = Meters;
>     fn add(self, rhs: Meters) -> Meters {
>         Meters(self.0 + rhs.0)
>     }
> }
> 
> impl Sub for Meters {
>     type Output = Meters;
>     fn sub(self, rhs: Meters) -> Meters {
>         Meters(self.0 - rhs.0)
>     }
> }
> 
> impl Div<Seconds> for Meters {
>     type Output = MetersPerSecond;
>     fn div(self, rhs: Seconds) -> MetersPerSecond {
>         MetersPerSecond(self.0 / rhs.0)
>     }
> }
> 
> impl Mul<Seconds> for MetersPerSecond {
>     type Output = Meters;
>     fn mul(self, rhs: Seconds) -> Meters {
>         Meters(self.0 * rhs.0)
>     }
> }
> 
> impl fmt::Display for Meters {
>     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
>         write!(f, "{:.2} m", self.0)
>     }
> }
> 
> impl fmt::Display for MetersPerSecond {
>     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
>         write!(f, "{:.2} m/s", self.0)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_meters_addition_and_subtraction() {
>         let m1 = Meters(150.5);
>         let m2 = Meters(49.5);
>         let sum = m1 + m2;
>         let diff = m1 - m2;
> 
>         assert_eq!(sum, Meters(200.0));
>         assert_eq!(diff, Meters(101.0));
>     }
> 
>     #[test]
>     fn test_velocity_calculation() {
>         let distance = Meters(100.0);
>         let time = Seconds(9.58);
>         let speed: MetersPerSecond = distance / time;
> 
>         let expected_speed = 100.0 / 9.58;
>         assert!((speed.0 - expected_speed).abs() < 1e-6);
>     }
> 
>     #[test]
>     fn test_distance_from_speed_and_time() {
>         let speed = MetersPerSecond(10.4384);
>         let time = Seconds(9.58);
>         let distance = speed * time;
> 
>         assert!((distance.0 - 100.0).abs() < 1e-3);
>     }
> 
>     #[test]
>     fn test_display_formatting() {
>         let distance = Meters(42.195);
>         let speed = MetersPerSecond(5.25);
>         assert_eq!(format!("{}", distance), "42.20 m");
>         assert_eq!(format!("{}", speed), "5.25 m/s");
>     }
> }
> ```
> 
> **Explanation:**
> 1. **Dimensional Analysis in Type System:** Operator trait implementations (`Div<Seconds>` for `Meters`, `Mul<Seconds>` for `MetersPerSecond`) codify physical equations directly into Rust's type system. Attempting `Meters + Seconds` fails at compile time because `Add<Seconds>` is not implemented for `Meters`.
> 2. **Memory Layout Guarantees:** Using `#[repr(transparent)]` guarantees that each newtype wrapper matches ABI layout and alignment of `f64` precisely, allowing seamless pass-by-value efficiency across function boundaries.

---

### Exercise 3: Bypassing the Orphan Rule & Smart Pointer Dereferencing

**Problem:**
Rust's Orphan Rule prevents implementing external traits on external types. When integrating third-party libraries (e.g. an external `ExternalConfig` struct), you cannot directly implement your application crate's traits on `ExternalConfig`. Additionally, manually delegating every method or field access on wrapped types is verbose.

Solve this problem using the Newtype pattern combined with smart pointer dereferencing:
1. Define a simulated third-party struct `ExternalConfig { pub endpoint: String, pub timeout_ms: u64, pub retries: u32 }`.
2. Define a local trait `Auditable` with `fn generate_audit_log(&self) -> String`.
3. Create a local Newtype `AuditConfig(pub ExternalConfig)`.
4. Write a constructor `AuditConfig::new(config: ExternalConfig) -> Result<Self, &'static str>` that validates domain invariants (`timeout_ms > 0` and `retries <= 10`).
5. Implement `Auditable` for `AuditConfig` to bypass the Orphan Rule.
6. Implement `std::ops::Deref` and `std::ops::DerefMut` for `AuditConfig` so callers can seamlessly access and mutate fields of the inner `ExternalConfig`.
7. Write unit tests (`#[test]`) with `assert_eq!`, `assert!`, and `matches!` validating constructor checks, field dereferencing, in-place field mutation, and audit log generation.

> [!check]- Answer
> ```rust
> use std::ops::{Deref, DerefMut};
> 
> // Simulating an external 3rd-party crate type
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct ExternalConfig {
>     pub endpoint: String,
>     pub timeout_ms: u64,
>     pub retries: u32,
> }
> 
> // Local trait defined in our application crate
> pub trait Auditable {
>     fn generate_audit_log(&self) -> String;
> }
> 
> // Local Newtype wrapping external type to bypass the Orphan Rule
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct AuditConfig(pub ExternalConfig);
> 
> impl AuditConfig {
>     pub fn new(config: ExternalConfig) -> Result<Self, &'static str> {
>         if config.timeout_ms == 0 {
>             return Err("Timeout must be greater than zero");
>         }
>         if config.retries > 10 {
>             return Err("Retries cannot exceed 10");
>         }
>         Ok(Self(config))
>     }
> }
> 
> // Implementing local trait on our local Newtype (bypassing orphan rule)
> impl Auditable for AuditConfig {
>     fn generate_audit_log(&self) -> String {
>         format!(
>             "AUDIT: endpoint='{}', timeout_ms={}, retries={}",
>             self.endpoint, self.timeout_ms, self.retries
>         )
>     }
> }
> 
> // Implementing Deref to allow transparent access to ExternalConfig methods and fields
> impl Deref for AuditConfig {
>     type Target = ExternalConfig;
> 
>     fn deref(&self) -> &Self::Target {
>         &self.0
>     }
> }
> 
> // Implementing DerefMut to allow transparent mutable access
> impl DerefMut for AuditConfig {
>     type Target = ExternalConfig;
> 
>     fn deref_mut(&mut self) -> &mut Self::Target {
>         &mut self.0
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_valid_audit_config_creation() {
>         let ext_cfg = ExternalConfig {
>             endpoint: "https://api.service.internal".to_string(),
>             timeout_ms: 5000,
>             retries: 3,
>         };
>         let audit_cfg = AuditConfig::new(ext_cfg);
>         assert!(audit_cfg.is_ok());
>     }
> 
>     #[test]
>     fn test_invalid_audit_config_validation() {
>         let invalid_timeout = ExternalConfig {
>             endpoint: "https://api.service.internal".to_string(),
>             timeout_ms: 0,
>             retries: 3,
>         };
>         assert_eq!(
>             AuditConfig::new(invalid_timeout),
>             Err("Timeout must be greater than zero")
>         );
> 
>         let invalid_retries = ExternalConfig {
>             endpoint: "https://api.service.internal".to_string(),
>             timeout_ms: 1000,
>             retries: 15,
>         };
>         assert_eq!(
>             AuditConfig::new(invalid_retries),
>             Err("Retries cannot exceed 10")
>         );
>     }
> 
>     #[test]
>     fn test_deref_transparent_field_access_and_mutation() {
>         let ext_cfg = ExternalConfig {
>             endpoint: "https://api.v1.org".to_string(),
>             timeout_ms: 2000,
>             retries: 2,
>         };
>         let mut audit_cfg = AuditConfig::new(ext_cfg).unwrap();
> 
>         // Accessing fields directly via Deref coercion
>         assert_eq!(audit_cfg.endpoint, "https://api.v1.org");
>         assert_eq!(audit_cfg.timeout_ms, 2000);
> 
>         // Mutating field directly via DerefMut coercion
>         audit_cfg.endpoint = "https://api.v2.org".to_string();
>         assert_eq!(audit_cfg.endpoint, "https://api.v2.org");
>     }
> 
>     #[test]
>     fn test_auditable_trait_implementation() {
>         let ext_cfg = ExternalConfig {
>             endpoint: "https://db.internal".to_string(),
>             timeout_ms: 3000,
>             retries: 5,
>         };
>         let audit_cfg = AuditConfig::new(ext_cfg).unwrap();
> 
>         let log = audit_cfg.generate_audit_log();
>         assert_eq!(
>             log,
>             "AUDIT: endpoint='https://db.internal', timeout_ms=3000, retries=5"
>         );
>     }
> }
> ```
> 
> **Explanation:**
> 1. **Bypassing Orphan Rule:** `AuditConfig` is defined in the local crate, allowing `impl Auditable for AuditConfig` even though `ExternalConfig` originates from an external crate.
> 2. **Ergonomic Deref Coercion:** Implementing `Deref` and `DerefMut` allows `AuditConfig` to automatically coercion-dereference into `ExternalConfig`. Field access (`audit_cfg.endpoint`) and field mutations transparently pass through to the inner type without boiler-plate getter/setter forwarding methods.
> 3. **Encapsulated Invariant Check:** Constructor `AuditConfig::new` acts as a validation gate, ensuring that any instance of `AuditConfig` in the system adheres to operational constraints.

---

## 6. Related Terms

- [Tuple Structs](../level_02/tuple_struct.md) — The syntax used to build a Newtype.
- [`Deref` Trait](../level_14/deref_trait.md) — The trait used to automatically forward method calls (like `.len()`) through the Newtype to the inner data!

---

## 7. Key Takeaways

- The **Newtype Pattern** involves wrapping an existing type in a single-element Tuple Struct (e.g. `struct Password(String);`).
- It provides **Zero-Cost Abstraction**. At runtime, the struct disappears completely and only the raw data remains in memory.
- It prevents catastrophic unit-conversion disasters (e.g. passing `Miles` into a function expecting `Kilometers`) at compile time.
- It is the official, compiler-approved way to bypass the **Orphan Rule**, allowing you to implement external traits on external types by wrapping them in a local Newtype!
