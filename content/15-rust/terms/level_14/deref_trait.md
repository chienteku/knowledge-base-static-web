# `Deref` and `DerefMut` Traits

> **Level 14 — Rust**
> Overloads the `*` dereference operator and enables deref coercions — automatically converting `Box<T>` to `&T`, `String` to `&str`, and `Vec<T>` to `&[T]` in many contexts.

---

## 1. Prerequisites

- [`Deref` / `DerefMut` Traits](deref_deref_mut_traits.md) — Deref traits.

---


## 2. Term Category

**Smart Pointer Trait**: `std::ops::Deref` and `DerefMut` for customized dereferencing operator behavior (`*`).

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Custom container types like `Box<T>`, `Rc<T>`, or `Arc<T>` wrap inner values in heap allocations. Without `Deref`, accessing methods or fields on the inner value `T` would require writing verbose wrapper method delegates for every single method on `T`.

Implementing `Deref` (`type Target = T; fn deref(&self) -> &T`) allows custom smart pointers to overload the unary dereference operator `*ptr` and automatically expose all underlying methods of `T`.

### (2) Reality Metaphor

A transparent protective sleeve over a smartphone: tapping the outer screen sleeve directly passes touch events through to the phone display underneath.

### (3) Rust Code Examples

#### Short Snippet
```rust
use std::ops::Deref;
struct MyBox<T>(T);
impl<T> Deref for MyBox<T> {
    type Target = T;
    fn deref(&self) -> &T { &self.0 }
}
```

#### Fuller Example
```rust
use std::ops::{Deref, DerefMut};

pub struct MeasuredBuffer<T> {
    data: Vec<T>,
    pub access_count: usize,
}

impl<T> MeasuredBuffer<T> {
    pub fn new(data: Vec<T>) -> Self {
        Self { data, access_count: 0 }
    }
}

impl<T> Deref for MeasuredBuffer<T> {
    type Target = Vec<T>;
    fn deref(&self) -> &Self::Target {
        &self.data
    }
}

fn main() {
    let buf = MeasuredBuffer::new(vec![1, 2, 3]);
    // Method call transparently forwarded to Vec<T> via Deref!
    assert_eq!(buf.len(), 3);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Abusing `Deref` for Struct Inheritance Simulation

**The mistake:** Implementing `Deref` on a domain struct (e.g. `User`) targeting another struct (`Account`) to fake OOP class inheritance.

**Why it is wrong:** Deref is designed specifically for smart pointers. Abusing it for domain structs causes confusing method resolution bugs and violates idiomatic Rust composition rules.

*Incorrect:*
```rust
impl Deref for User { type Target = Account; ... } // Antipattern!
```

*Fix:*
```rust
Use explicit fields (`user.account`) or delegation traits instead of abusing Deref!
```

### Mistake 2: Forgetting `DerefMut` for Mutable Access

**The mistake:** Implementing `Deref` without `DerefMut` and expecting `*ptr = new_val` or mutable method calls (`ptr.push()`) to work.

**Why it is wrong:** `Deref` only grants immutable `&Target` references. Mutable dereferencing requires implementing `DerefMut`.

*Incorrect:*
```rust
let mut my_box = MyBox(vec![1]); my_box.push(2); // Error without DerefMut!
```

*Fix:*
```rust
impl<T> DerefMut for MyBox<T> { fn deref_mut(&mut self) -> &mut Self::Target { &mut self.0 } }
```

### Mistake 3: Creating Recursive Infinite Loops in `deref` Implementation

**The mistake:** Invoking `*self` or calling a method on `self` inside `deref()`.

**Why it is wrong:** Triggers infinite recursion stack overflow during execution.

*Incorrect:*
```rust
impl Deref for Wrapper { type Target = Inner; fn deref(&self) -> &Inner { &*self } } // Stack overflow!
```

*Fix:*
```rust
Return reference to underlying field: fn deref(&self) -> &Inner { &self.inner }
```

---

## 5. Practice Exercises

### Exercise 1: Custom Smart Pointer Container with `Deref` and `DerefMut`

**Scenario:** Implement a smart pointer `TrackedBox<T>` counting read and write access counts while implementing `Deref` and `DerefMut`.

**Requirements:**
1. Define `TrackedBox<T>` wrapping `T`.
1. Implement `Deref<Target = T>` and `DerefMut`.
1. Write unit tests for dereferencing and mutable methods.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::ops::{Deref, DerefMut};
> 
> pub struct TrackedBox<T> {
>     value: T,
>     pub reads: usize,
>     pub writes: usize,
> }
> 
> impl<T> TrackedBox<T> {
>     pub fn new(value: T) -> Self {
>         Self { value, reads: 0, writes: 0 }
>     }
> }
> 
> impl<T> Deref for TrackedBox<T> {
>     type Target = T;
>     fn deref(&self) -> &Self::Target {
>         &self.value
>     }
> }
> 
> impl<T> DerefMut for TrackedBox<T> {
>     fn deref_mut(&mut self) -> &mut Self::Target {
>         &mut self.value
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_tracked_box_deref() {
>         let mut boxed = TrackedBox::new(vec![10, 20]);
>         // Immutable deref method call on Vec<i32>
>         assert_eq!(boxed.len(), 2);
> 
>         // Mutable deref method call on Vec<i32>
>         boxed.push(30);
>         assert_eq!(boxed.len(), 3);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Implementing `Deref` and `DerefMut` exposes all `Vec<T>` methods transparently on `TrackedBox<T>`.
> 2. Overloads `*boxed` operator.

---

### Exercise 2: Lazy Initialization Singleton Guard with `Deref`

**Scenario:** Implement a thread-safe lazy resource guard implementing `Deref` to expose initialized database configuration.

**Requirements:**
1. Define `LazyGuard<T>`.
1. Implement `Deref`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::ops::Deref;
> 
> pub struct LazyConfig {
>     pub host: String,
>     pub port: u16,
> }
> 
> pub struct ConfigGuard {
>     config: LazyConfig,
> }
> 
> impl ConfigGuard {
>     pub fn load() -> Self {
>         Self {
>             config: LazyConfig {
>                 host: "localhost".into(),
>                 port: 5432,
>             },
>         }
>     }
> }
> 
> impl Deref for ConfigGuard {
>     type Target = LazyConfig;
>     fn deref(&self) -> &Self::Target {
>         &self.config
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_config_guard_deref() {
>         let guard = ConfigGuard::load();
>         assert_eq!(guard.host, "localhost");
>         assert_eq!(guard.port, 5432);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `ConfigGuard` transparently forwards field accesses to inner `LazyConfig`.

---

### Exercise 3: String Alias Wrapper Smart Pointer

**Scenario:** Build a validated `EmailAddress` newtype smart pointer delegating `str` methods via `Deref`.

**Requirements:**
1. Define `EmailAddress(String)`.
1. Implement `Deref<Target = str>`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::ops::Deref;
> 
> pub struct EmailAddress(String);
> 
> impl EmailAddress {
>     pub fn parse(s: &str) -> Result<Self, &'static str> {
>         if s.contains('@') {
>             Ok(EmailAddress(s.to_string()))
>         } else {
>             Err("Invalid email format")
>         }
>     }
> }
> 
> impl Deref for EmailAddress {
>     type Target = str;
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
>     fn test_email_deref() {
>         let email = EmailAddress::parse("user@example.com").unwrap();
>         assert!(email.ends_with("@example.com")); // Directly uses str::ends_with!
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Newtype smart pointer validating invariants on construction while exposing `str` methods via `Deref`.

---

## 5. Related Terms

- [Newtype Pattern](../level_11/newtype_pattern.md)
- [`Deref` / `DerefMut` Traits](deref_deref_mut_traits.md) — Deref/DerefMut traits.

---


## 7. Key Takeaways

- Overloads the dereference operator `*ptr`.
- Required for smart pointer implementations (`Box`, `Rc`, `Arc`, `RefCell` guards).
- Implement `DerefMut` for mutable dereferencing.
- Do not abuse `Deref` for domain struct inheritance.
