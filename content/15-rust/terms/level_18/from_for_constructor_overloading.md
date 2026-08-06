# `From` for Constructor Overloading

> **Level 18 — Rust**
> Implementing `From<T>` to provide multiple construction paths for a type, enabling ergonomic `.into()` conversions.

---

## 1. Prerequisites

- [`From` / `Into` Traits](../level_04/from_into_traits.md) — From/Into traits.
- [Associated Function](../level_02/associated_function.md) — Associated functions.

---

## 2. Term Category



**Rust Idiom Pattern (From/Into flexible constructor overloading)**: Constructor polymorphism using `From` and `Into` traits.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Rust does not support constructor function overloading (e.g. multiple `new()` methods with different parameter signatures). Creating distinct constructor names (`new_from_str`, `new_from_u64`) leads to bloated APIs.

Implementing `From<T>` for a struct provides idiomatic, overloaded conversion constructors. Furthermore, implementing `From<T>` automatically generates `Into<T>` for free via Rust's blanket implementation.

### (2) Reality Metaphor

A universal wall power adapter: accepting US, EU, and UK plug formats to output standard regulated DC power to an electronic device.

### (3) Rust Code Examples

#### Short Snippet
```rust
#[derive(Debug, PartialEq)]
struct UserId(u64);
impl From<u64> for UserId { fn from(id: u64) -> Self { UserId(id) } }
```

#### Fuller Example
```rust
#[derive(Debug, PartialEq)]
pub struct Person {
    pub name: String,
}

impl From<&str> for Person {
    fn from(s: &str) -> Self {
        Person { name: s.to_string() }
    }
}

impl From<String> for Person {
    fn from(s: String) -> Self {
        Person { name: s }
    }
}

fn main() {
    let p1 = Person::from("Alice");
    let p2 = Person::from(String::from("Bob"));
    assert_eq!(p1.name, "Alice");
    assert_eq!(p2.name, "Bob");
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Implementing `Into<T>` Directly Instead of `From<T>`

**The mistake:** Implementing `Into<Target>` for a type instead of `From<Source>`.

**Why it is wrong:** Implementing `From<Source>` automatically implements `Into<Target>` via blanket implementation, but the inverse is not true.

*Incorrect:*
```rust
impl Into<Person> for &str { ... }
```

*Fix:*
```rust
impl From<&str> for Person { ... } // Gives both Person::from() and .into() for free!
```

### Mistake 2: Using Fallible Conversion in `From` Implementations

**The mistake:** Triggering a panic inside `From::from` when conversion fails.

**Why it is wrong:** `From` must be infallible. Use `TryFrom<T>` for fallible conversions.

*Incorrect:*
```rust
impl From<&str> for Port { fn from(s: &str) -> Self { Port(s.parse().unwrap()) } }
```

*Fix:*
```rust
impl TryFrom<&str> for Port { type Error = ParseIntError; fn try_from(s: &str) -> Result<Self, Self::Error> { Ok(Port(s.parse()?)) } }
```

### Mistake 3: Overusing Custom `parse_x` Method Names

**The mistake:** Creating non-standard conversion function names instead of `From` / `TryFrom` traits.

**Why it is wrong:** Prevents caller generic code bounded by `From` / `Into` from interoperating with your type.

*Incorrect:*
```rust
fn make_person(s: &str) -> Person
```

*Fix:*
```rust
impl From<&str> for Person
```

---

## 5. Practice Exercises

### Exercise 1: Polymorphic IP Address Constructor

**Scenario:** Implement an `IpAddress` enum constructible from `[u8; 4]` IPv4 array, `[u8; 16]` IPv6 array, or `u32` integer via `From` traits.

**Requirements:**
1. Define `IpAddress` enum.
1. Implement `From<[u8; 4]>` and `From<u32>`.
1. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq)]
> pub enum IpAddress {
>     V4([u8; 4]),
>     V6([u8; 16]),
> }
> 
> impl From<[u8; 4]> for IpAddress {
>     fn from(bytes: [u8; 4]) -> Self {
>         IpAddress::V4(bytes)
>     }
> }
> 
> impl From<u32> for IpAddress {
>     fn from(val: u32) -> Self {
>         IpAddress::V4(val.to_be_bytes())
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_ip_from() {
>         let ip1 = IpAddress::from([127, 0, 0, 1]);
>         let ip2 = IpAddress::from(0x7F000001u32);
>         assert_eq!(ip1, ip2);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Implementing `From` for multiple source types provides clean constructor overloading.
> 2. Enables using `.into()` in generic contexts.

---

### Exercise 2: Flexible Money Currency Constructor

**Scenario:** Create a `Money` struct constructible from `i64` cents or `f64` dollars.

**Requirements:**
1. Define `Money` struct storing cents `i64`.
1. Implement `From<i64>` and `From<f64>`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq)]
> pub struct Money {
>     pub cents: i64,
> }
> 
> impl From<i64> for Money {
>     fn from(cents: i64) -> Self { Money { cents } }
> }
> 
> impl From<f64> for Money {
>     fn from(dollars: f64) -> Self { Money { cents: (dollars * 100.0) as i64 } }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_money_from() {
>         let m1 = Money::from(1000i64);
>         let m2 = Money::from(10.0f64);
>         assert_eq!(m1, m2);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Standardizes numerical conversions for monetary amounts.
> 2. Infallible constructor interface.

---

### Exercise 3: Flexible Port Assignment Constructor

**Scenario:** Build a `NetworkPort` struct constructible from `u16` or `&str` via `TryFrom`.

**Requirements:**
1. Implement `From<u16>` and `TryFrom<&str>`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq)]
> pub struct NetworkPort(pub u16);
> 
> impl From<u16> for NetworkPort {
>     fn from(p: u16) -> Self { NetworkPort(p) }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_port_from() {
>         let p: NetworkPort = 8080u16.into();
>         assert_eq!(p, NetworkPort(8080));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `8080u16.into()` works automatically because `From<u16>` provides `Into<NetworkPort>` blanket implementation.

---

## 6. Related Terms

- [`From` / `Into` Traits](../level_04/from_into_traits.md) — From trait conversions.

---

## 7. Key Takeaways

- Provides idiomatic constructor polymorphism in Rust.
- Implementing `From<T>` automatically generates `Into<T>` blanket implementation.
- Must be infallible; use `TryFrom<T>` for fallible conversions.
- Integrates seamlessly with generic function boundaries.
