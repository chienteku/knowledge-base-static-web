# `Deref` / `DerefMut` Traits

> **Level 14 — Advanced Traits & Type System**
> Standard library traits (`std::ops::Deref` and `std::ops::DerefMut`) that customize the behavior of the dereference operator (`*v`) and enable automatic Deref Coercion for smart pointers and container types.

---

## 1. Prerequisites


- [Smart Pointers (`Box`, `Rc`, `Arc`)](../level_10/smart_pointers.md) — Smart pointer wrapper types that use `Deref` to expose inner values.
- [References and Borrowing (`&`, `&mut`)](../level_01/references_and_borrowing.md) — Borrowing mechanics (`&T` and `&mut T`).

---

## 2. Term Category



**Rust Standard Traits (smart pointer dereferencing traits)**: `Deref` (`std::ops::Deref`) and `DerefMut` (`std::ops::DerefMut`) are operator traits in Rust. Implementing `Deref` allows a custom type `T` to define how it converts to a reference of an inner associated type `Target` (`fn deref(&self) -> &Self::Target`). This customizes the `*` dereference operator and unlocks **Deref Coercion** — allowing references `&T` to automatically coercion-borrow as `&Target` when passed to function parameters.



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Without `Deref` and Deref Coercion:
1. Every time you wanted to call a string slice (`str`) method like `.len()`, `.to_uppercase()`, or `.contains()` on a `String`, you would have to write `(*my_string).as_str().len()`.
2. Every time you wanted to pass a `Vec<u8>` to a function expecting a slice `&[u8]`, you would have to write `function_expecting_slice(my_vec.as_slice())`.
3. Every time you accessed an inner value inside a `Box<User>`, you would have to call `my_box.get_inner().name`.

Rust introduced **`Deref` / `DerefMut`** to make smart pointers and container wrappers behave as transparently as regular references:
- **Explicit Dereferencing**: `*my_smart_ptr` evaluates to `*my_smart_ptr.deref()`.
- **Method Call Deref**: Invoking `my_smart_ptr.method()` automatically searches for `method()` on `Target` if `SmartPtr` does not define a method with that name.
- **Implicit Deref Coercion**: Passing `&String` to a parameter expecting `&str` automatically converts `&String` $\rightarrow$ `&str` at compile time with zero runtime cost.

### (2) Reality Metaphor

Imagine a **Clear Protective Smartphone Case**:

- A **Standard Struct** without `Deref` is like putting your phone inside a sealed metal safe: every time you want to tap the screen (**call a method on the inner value**), you must unlock the safe, take the phone out, tap the screen, and put it back in.
- Implementing **`Deref`** is like encasing the phone in a clear, ultra-thin protective touch-case:
  - You are touching the case (**holding the `Box<T>` or `String` wrapper**).
  - When you tap the glass screen (**call `.len()` or `*ptr`**), your touch passes directly through the protective case to the phone's actual screen (**inner `Target` type**) without any friction or delay.

### (3) Code Examples

#### Short Snippet (Custom Smart Pointer with `Deref`)

```rust
use std::ops::Deref;

/// A custom smart pointer wrapper
struct MyBox<T>(T);

impl<T> MyBox<T> {
    fn new(x: T) -> Self {
        MyBox(x)
    }
}

// 1. Implement `Deref` to specify associated `Target` type
impl<T> Deref for MyBox<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

fn main() {
    let x = 5;
    let b = MyBox::new(x);

    // Explicit dereferencing using `*` operator (equivalent to `*(b.deref())`):
    assert_eq!(5, *b);
    println!("Successfully dereferenced MyBox<i32>: {}", *b);
}
```

#### Fuller Example (`DerefMut` & Implicit Deref Coercion)

```rust
use std::ops::{Deref, DerefMut};

/// A custom string wrapper demonstrating Deref Coercion to `&str`
pub struct TitleString(String);

impl TitleString {
    pub fn new(title: impl Into<String>) -> Self {
        TitleString(title.into())
    }
}

impl Deref for TitleString {
    type Target = String;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl DerefMut for TitleString {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}

// Function expecting a plain string slice `&str`
fn print_length(s: &str) {
    println!("String length: {} bytes, content: '{}'", s.len(), s);
}

fn main() {
    let mut title = TitleString::new("Rust Systems Programming");

    // DEREF COERCION: Passing `&TitleString` automatically coerces to `&String` -> `&str`!
    print_length(&title);

    // Call String methods directly on TitleString via Deref method resolution:
    title.push_str(" (2026 Edition)");
    
    // Call slice method `.to_uppercase()` directly:
    println!("Uppercase: {}", title.to_uppercase());
}
```

---

## 4. How Deref Coercion Works

Rust applies Deref Coercion automatically in three scenarios:
1. **`&T` to `&U`** when `T: Deref<Target = U>` (e.g. `&String` $\rightarrow$ `&str`).
2. **`&mut T` to `&mut U`** when `T: DerefMut<Target = U>` (e.g. `&mut Vec<T>` $\rightarrow$ `&mut [T]`).
3. **`&mut T` to `&U`** when `T: Deref<Target = U>` (coercing a mutable reference to an immutable reference).

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misusing `Deref` for Object-Oriented Class Inheritance

**The mistake:** Implementing `Deref` on a `UserStruct` to deref into `BaseStruct` simply to inherit `BaseStruct`'s fields or methods.

**Why it's wrong:** `Deref` is intended **strictly for smart pointers and container wrappers** (`Box`, `Rc`, `Arc`, `String`, `Vec`). Using `Deref` as a trick for OOP inheritance hides field origins, causes surprising method resolution collisions, and is considered an anti-pattern in Rust code reviews.

*Incorrect (Anti-Pattern):*
```rust
struct BaseUser { id: u64 }
struct AdminUser { base: BaseUser, permissions: Vec<String> }

// ❌ Anti-pattern: Misusing Deref for OOP-style inheritance!
impl Deref for AdminUser {
    type Target = BaseUser;
    fn deref(&self) -> &Self::Target { &self.base }
}
```

*Fix:*
```rust
// Correct: Use explicit field access or delegation traits
impl AdminUser {
    pub fn id(&self) -> u64 { self.base.id }
}
```

### Mistake 2: Method Name Collisions Between Wrapper and Inner `Target`

**The mistake:** Defining a method `fn len(&self)` on a custom smart pointer when `Target` also defines `fn len(&self)`.

**Why it's wrong:** Method resolution checks the outer wrapper type FIRST before attempting Deref coercion. If the wrapper defines `len()`, calling `wrapper.len()` invokes the wrapper's method, masking the inner `Target` method.

*Incorrect:*
```rust
struct MySmartVec<T> { data: Vec<T> }

impl<T> MySmartVec<T> {
    // ❌ Masks `Vec::len`! `my_smart_vec.len()` calls this instead of inner Vec::len.
    pub fn len(&self) -> &'static str { "custom wrapper" } 
}
```

*Fix:*
```rust
// Avoid method name collisions on smart pointer wrappers; prefer inner delegation
```

### Mistake 3: Forgetting `Deref` Requirement when Implementing `DerefMut`

**The mistake:** Writing `impl DerefMut for MyType` without first implementing `Deref`.

**Why it's wrong:** In the standard library, `DerefMut` has `Deref` as a supertrait (`pub trait DerefMut: Deref`). You cannot implement mutable dereferencing without first defining immutable dereferencing.

---

## 5. Practice Exercises

### Exercise 1: Multi-Tier Deref Coercion in an Embedded Telemetry Buffer

**Scenario:** In an embedded telemetry network, UART packet frames are wrapped inside a `TelemetryFrame` struct containing metadata (header ID) and a byte payload (`Vec<u8>`). Implement `Deref<Target = Vec<u8>>` and `DerefMut` for `TelemetryFrame`. Demonstrate multi-tier deref coercion (`&TelemetryFrame` $\rightarrow$ `&Vec<u8>` $\rightarrow$ `&[u8]`) by passing a `&TelemetryFrame` reference directly to a function expecting a byte slice `&[u8]`, calling slice methods (`.len()`, `.split_at()`), and modifying inner bytes in-place via `DerefMut`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::ops::{Deref, DerefMut};
> 
> /// Embedded telemetry frame holding header metadata and dynamic byte payload
> #[derive(Debug, PartialEq, Eq)]
> pub struct TelemetryFrame {
>     pub header_id: u32,
>     payload: Vec<u8>,
> }
> 
> impl TelemetryFrame {
>     pub fn new(header_id: u32, payload: Vec<u8>) -> Self {
>         Self { header_id, payload }
>     }
> }
> 
> // 1. Implement `Deref` to expose the inner `Vec<u8>` payload
> impl Deref for TelemetryFrame {
>     type Target = Vec<u8>;
> 
>     fn deref(&self) -> &Self::Target {
>         &self.payload
>     }
> }
> 
> // 2. Implement `DerefMut` to support mutable byte slice operations
> impl DerefMut for TelemetryFrame {
>     fn deref_mut(&mut self) -> &mut Self::Target {
>         &mut self.payload
>     }
> }
> 
> /// Function expecting a primitive slice `&[u8]`
> pub fn verify_packet_prefix(slice: &[u8]) -> bool {
>     slice.starts_with(&[0xAA, 0xBB])
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_multi_tier_deref_coercion() {
>         let frame = TelemetryFrame::new(101, vec![0xAA, 0xBB, 0x01, 0x02]);
> 
>         // Multi-tier Deref Coercion: &TelemetryFrame -> &Vec<u8> -> &[u8]
>         assert!(verify_packet_prefix(&frame));
> 
>         // Method resolution automatically forwards `.len()` and `.split_at()` to Vec/slice
>         assert_eq!(frame.len(), 4);
>         let (head, tail) = frame.split_at(2);
>         assert_eq!(head, &[0xAA, 0xBB]);
>         assert_eq!(tail, &[0x01, 0x02]);
>     }
> 
>     #[test]
>     fn test_deref_mut_in_place_modification() {
>         let mut frame = TelemetryFrame::new(102, vec![0x00, 0x11, 0x22]);
> 
>         // Mutate inner payload via DerefMut index operator & push method
>         frame[0] = 0xFF;
>         frame.push(0x33);
> 
>         assert_eq!(&frame[..], &[0xFF, 0x11, 0x22, 0x33]);
>         assert_eq!(frame.len(), 4);
>     }
> }
> ```
> 
> #### Technical Explanation
>
> 1. **Multi-Tier Deref Coercion**: When passing `&frame` (`&TelemetryFrame`) to `verify_packet_prefix(&[u8])`, Rust dereferences `TelemetryFrame` to `Vec<u8>`, and then recursively applies `Vec<u8>`'s `Deref` implementation to yield `&[u8]`. This zero-cost conversion occurs at compile time without heap allocations or runtime overhead.
> 2. **Transparent Method Delegation**: Method calls like `frame.len()` and `frame.split_at(2)` trigger Rust's method resolution logic: if the outer type (`TelemetryFrame`) does not define the method, Rust dereferences to `Vec<u8>` and subsequently to `[u8]` slice methods.
> 3. **In-Place Mutation with `DerefMut`**: Implementing `DerefMut` enables mutable indexing (`frame[0] = 0xFF`) and calling mutating collection methods (`frame.push(0x33)`). Note that `DerefMut` requires `Deref` as a supertrait (`pub trait DerefMut: Deref`).
> 
---

### Exercise 2: Implementing an Audited Access RAII Guard

**Scenario:** In high-integrity systems and embedded diagnostic tools, read and write accesses to shared data or configuration blocks must be monitored for audit trails. Implement a custom RAII guard struct `AuditedGuard<'a, T>` wrapping a mutable reference `&'a mut T` and a reference to an `AuditTracker`. Implement `Deref` and `DerefMut` for `AuditedGuard` to increment read and write counters inside `AuditTracker` whenever the underlying data is dereferenced for reading or writing.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::cell::Cell;
> use std::ops::{Deref, DerefMut};
> 
> /// Shared tracker recording access counts using interior mutability (`Cell`)
> #[derive(Debug, Default)]
> pub struct AuditTracker {
>     reads: Cell<usize>,
>     writes: Cell<usize>,
> }
> 
> impl AuditTracker {
>     pub fn new() -> Self {
>         Self {
>             reads: Cell::new(0),
>             writes: Cell::new(0),
>         }
>     }
> 
>     pub fn read_count(&self) -> usize {
>         self.reads.get()
>     }
> 
>     pub fn write_count(&self) -> usize {
>         self.writes.get()
>     }
> }
> 
> /// RAII Guard that audits read and write dereferences to wrapped data `T`
> pub struct AuditedGuard<'a, T> {
>     data: &'a mut T,
>     tracker: &'a AuditTracker,
> }
> 
> impl<'a, T> AuditedGuard<'a, T> {
>     pub fn new(data: &'a mut T, tracker: &'a AuditTracker) -> Self {
>         Self { data, tracker }
>     }
> }
> 
> // 1. Implement `Deref` to audit read accesses and return `&T`
> impl<'a, T> Deref for AuditedGuard<'a, T> {
>     type Target = T;
> 
>     fn deref(&self) -> &Self::Target {
>         self.tracker.reads.set(self.tracker.read_count() + 1);
>         self.data
>     }
> }
> 
> // 2. Implement `DerefMut` to audit write accesses and return `&mut T`
> impl<'a, T> DerefMut for AuditedGuard<'a, T> {
>     fn deref_mut(&mut self) -> &mut Self::Target {
>         self.tracker.writes.set(self.tracker.write_count() + 1);
>         self.data
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[derive(Debug, PartialEq, Eq)]
>     struct DeviceConfig {
>         baud_rate: u32,
>         enabled: bool,
>     }
> 
>     #[test]
>     fn test_audited_guard_read_and_write_tracking() {
>         let tracker = AuditTracker::new();
>         let mut config = DeviceConfig {
>             baud_rate: 9600,
>             enabled: false,
>         };
> 
>         {
>             let mut guard = AuditedGuard::new(&mut config, &tracker);
> 
>             // Read access via Deref (field lookup triggers deref())
>             assert_eq!(guard.baud_rate, 9600);
>             assert_eq!(tracker.read_count(), 1);
> 
>             // Write access via DerefMut (field mutation triggers deref_mut())
>             guard.baud_rate = 115200;
>             guard.enabled = true;
>             assert_eq!(tracker.write_count(), 2);
> 
>             // Read access via Deref again
>             assert!(guard.enabled);
>             assert_eq!(tracker.read_count(), 2);
>         }
> 
>         // Verify target state mutated correctly after guard leaves scope
>         assert_eq!(config.baud_rate, 115200);
>         assert_eq!(config.enabled, true);
>         assert_eq!(tracker.read_count(), 2);
>         assert_eq!(tracker.write_count(), 2);
>     }
> }
> ```
> 
> #### Technical Explanation
>
> 1. **Custom Smart Pointer Guard Pattern**: `AuditedGuard<'a, T>` mimics standard library RAII types like `MutexGuard` or `RefMut`. It temporarily owns an exclusive borrow `&'a mut T`.
> 2. **Interior Mutability in `Deref`**: The `deref(&self)` signature takes an immutable shared reference `&self`. To increment `tracker.reads` without requiring `&mut self`, `AuditTracker` utilizes `std::cell::Cell<usize>`, allowing interior mutability through shared references.
> 3. **Implicit Operator Hooking**: Field accesses (`guard.baud_rate`) and method calls automatically invoke `deref()` or `deref_mut()` under the hood, seamlessly instrumenting field reads and writes without altering user-facing access syntax.
> 4. **Lifetime Safety**: Tying the lifetime `'a` of `data` and `tracker` inside `AuditedGuard<'a, T>` ensures statically that the guard cannot outlive the underlying resource or tracker.
> 
---

### Exercise 3: Protecting Domain Invariants with Read-Only Deref Coercion

**Scenario:** In network protocol handlers and IoT edge gateways, newtype wrappers like `ValidatedHostname` guarantee that string data conforms to domain formatting rules (e.g. non-empty, ASCII alphanumeric/hyphens/dots, maximum 63 characters). Implementing `Deref<Target = str>` enables convenient read-only operations and Deref coercion to `&str`. Explain and demonstrate why `DerefMut` must be **deliberately omitted** to prevent caller code from corrupting validated domain invariants post-construction.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::ops::Deref;
> 
> /// Validated network hostname newtype guaranteeing valid domain format
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct ValidatedHostname(String);
> 
> impl ValidatedHostname {
>     /// Constructs a ValidatedHostname if input satisfies all formatting rules
>     pub fn parse(input: &str) -> Result<Self, &'static str> {
>         if input.is_empty() {
>             return Err("Hostname cannot be empty");
>         }
>         if input.len() > 63 {
>             return Err("Hostname exceeds maximum length of 63 characters");
>         }
>         if !input.chars().all(|c| c.is_ascii_alphanumeric() || c == '.' || c == '-') {
>             return Err("Hostname contains invalid characters");
>         }
>         Ok(Self(input.to_lowercase()))
>     }
> }
> 
> // 1. Implement `Deref` to `str` for transparent read-only string access
> impl Deref for ValidatedHostname {
>     type Target = str;
> 
>     fn deref(&self) -> &Self::Target {
>         &self.0
>     }
> }
> 
> // NOTE: `DerefMut` is INTENTIONALLY OMITTED to preserve domain validation invariants!
> 
> /// External DNS lookup helper expecting a standard string slice `&str`
> pub fn resolve_dns_query(domain: &str) -> String {
>     format!("RESOLVED_{}", domain.to_uppercase())
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_valid_hostname_construction_and_deref_coercion() {
>         let host = ValidatedHostname::parse("Sensor-Node-01.local").expect("Valid hostname");
> 
>         // Deref coercion: passing &ValidatedHostname where &str is expected
>         let result = resolve_dns_query(&host);
>         assert_eq!(result, "RESOLVED_SENSOR-NODE-01.LOCAL");
> 
>         // Invoke read-only `str` methods directly on ValidatedHostname via Deref
>         assert_eq!(host.len(), 20);
>         assert!(host.contains("node"));
>         assert!(host.ends_with(".local"));
>         assert_eq!(&host[..6], "sensor");
>     }
> 
>     #[test]
>     fn test_hostname_validation_rejects_invalid_inputs() {
>         assert!(ValidatedHostname::parse("").is_err());
>         assert!(ValidatedHostname::parse("bad host name").is_err());
>         assert!(ValidatedHostname::parse("invalid_symbol!@#").is_err());
>     }
> }
> ```
> 
> #### Technical Explanation
>
> 1. **Newtype Pattern with Read-Only Deref**: Wrapping `String` in `ValidatedHostname(String)` encapsulates the inner field. Implementing `Deref<Target = str>` allows callers to read data using standard slice functions without needing redundant getters like `pub fn as_str(&self) -> &str`.
> 2. **Invariant Safety via Omission**: If `DerefMut` were implemented targeting `String` or `str`, caller code could execute `host.push_str(" invalid space!")` or `host.clear()`, violating the structural validation invariants established during `parse()`. Omitting `DerefMut` statically guarantees immutability through dereferencing.
> 3. **Coercion Target Selection**: `ValidatedHostname` targets `str` (`type Target = str;`) rather than `String`. Dereferencing to `str` is idiomatic in Rust because `&str` provides all read-only string algorithms (`.len()`, `.find()`, `.to_uppercase()`, slicing) without exposing allocation methods (`.reserve()`, `.shrink_to_fit()`).
> 
---

## 6. Related Terms


- [Smart Pointers (`Box`, `Rc`, `Arc`)](../level_10/smart_pointers.md) — Wrapper types that rely heavily on `Deref`.
- [Operator Overloading](operator_overloading.md) — Customizing built-in operators via `std::ops`.
- [`AsRef` / `AsMut`](as_ref_as_mut.md) — Explicit reference conversion traits (contrasted with implicit `Deref`).
- [`Borrow` / `BorrowMut`](borrow_borrow_mut.md) — Consistency-guaranteed reference conversion traits.
- [`Deref` and `DerefMut` Traits](deref_trait.md) — Related concept: `Deref` and `DerefMut` Traits.
- [Deref Coercion](deref_coercion.md) — Related concept: Deref Coercion.

---

## 7. Key Takeaways

- `Deref` (`fn deref(&self) -> &Target`) and `DerefMut` (`fn deref_mut(&mut self) -> &mut Target`) customize the `*` dereference operator.
- They enable **Deref Coercion**, automatically converting `&SmartPointer<T>` to `&T` (and `&String` $\rightarrow$ `&str`, `&Vec<T>` $\rightarrow$ `&[T]`).
- Method calls (`wrapper.method()`) automatically resolve on `Target` if `wrapper` does not define a method with that name.
- `Deref` should ONLY be implemented for smart pointers and container wrappers — never as a trick for OOP class inheritance.
