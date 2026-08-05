# Tuple Struct

> **Level 2 — Control Flow & Data Structures**
> A struct with unnamed fields, e.g. `struct Color(u8, u8, u8);`.

---

## 1. Prerequisites


- [Struct](struct.md) — The parent concept; standard structs have named fields.
- [Compound Types](../level_01/compound_types.md) — Tuples are the underlying structure of a Tuple Struct.

---

## 2. Term Category

**Rust-specific (mostly)**: While some other languages have similar concepts, Rust uses Tuple Structs heavily to create "Newtypes" (wrapping an existing type to give it a new, strict identity) and to bridge the gap between anonymous tuples and verbose structs.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

A standard Tuple like `(u8, u8, u8)` is great for quickly grouping data. However, Tuples lack **type identity**. If your program uses `(u8, u8, u8)` to represent an RGB Color, and also uses `(u8, u8, u8)` to represent a 3D Location, the compiler will happily let you pass a Location into a function that paints a Color. This is dangerous!

You could use a standard [Struct](../level_02/struct.md) to fix this, but writing `struct Color { r: u8, g: u8, b: u8 }` can sometimes feel too verbose if the meaning of the fields is painfully obvious.

A **Tuple Struct** is the perfect middle ground. It takes a standard Tuple and slaps a permanent, unique Name on it. It provides the strict type safety of a Struct, but keeps the concise, unnamed fields of a Tuple.

### (2) Reality Metaphor

Imagine two identical glass jars containing a clear liquid. One is water, the other is white vinegar. 

Because they look identical (like an anonymous tuple), you might accidentally drink the vinegar. A Tuple Struct is like slapping a permanent, brightly colored label ("VINEGAR" vs "WATER") on the jars. The contents (the unnamed fields) are exactly the same, but the system will now prevent you from ever mixing them up.

### (3) Rust Code Examples

#### Short Snippet (Definition and Access)
```rust
// Defining a Tuple Struct. Note the semicolon at the end!
struct Color(u8, u8, u8);

fn main() {
    // Instantiating the Tuple Struct
    let my_color = Color(255, 0, 50);
    
    // Accessing fields using dot-index notation (just like a normal tuple)
    println!("Red value is: {}", my_color.0);
}
```

#### Fuller Example (Strict Type Safety)
```rust
struct Color(u8, u8, u8);
struct Location(u8, u8, u8);

// This function strictly requires a `Color` type
fn paint_pixel(c: Color) {
    println!("Painting pixel with R:{} G:{} B:{}", c.0, c.1, c.2);
}

fn main() {
    let red = Color(255, 0, 0);
    let player_pos = Location(255, 0, 0);
    
    paint_pixel(red); // SUCCESS
    
    // paint_pixel(player_pos); 
    // ERROR: expected `Color`, found `Location`. 
    // Even though they hold the exact same data, they are different types!
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Tuple Struct Scoping and Lifecycle Rules

**The mistake:** Assuming Tuple Struct instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("tuple_struct_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("tuple_struct_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Tuple Struct State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Tuple Struct through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Tuple Struct Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Tuple Struct instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Multi-Currency Financial Trading Engine (Newtype Pattern & Operator Overloading)

**Scenario:**
In high-frequency trading platforms and multi-currency banking infrastructure, representing monetary values as raw primitive types (`u64` or `f64`) frequently introduces severe accounting bugs—such as accidentally adding United States Dollars (`USD`) directly to Euros (`EUR`) without applying currency conversion rates.

**Task:**
Implement a type-safe financial engine leveraging single-element tuple structs (the **Newtype** pattern) and standard operator overloading traits:
1. Define tuple structs `Usd(pub u64)` and `Eur(pub u64)`, where internal values represent micro-units (cents / fixed-point integers).
2. Define a tuple struct `ExchangeRate(pub f64)` representing the conversion rate from EUR to USD (`1 EUR = rate * USD`).
3. Implement `std::ops::Add` for `Usd` and `Usd` to allow type-safe addition (`usd1 + usd2`).
4. Implement a method `Eur::to_usd(&self, rate: ExchangeRate) -> Usd` that safely converts EUR to micro-USD.
5. Write comprehensive unit tests in `#[cfg(test)] mod tests` verifying arithmetic safety, conversion precision, and pattern destructuring using `assert_eq!`, `assert!`, `assert_ne!`, and `matches!`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::ops::Add;
> 
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub struct Usd(pub u64);
> 
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub struct Eur(pub u64);
> 
> #[derive(Debug, Clone, Copy, PartialEq)]
> pub struct ExchangeRate(pub f64);
> 
> impl Add for Usd {
>     type Output = Usd;
> 
>     fn add(self, rhs: Usd) -> Self::Output {
>         Usd(self.0 + rhs.0)
>     }
> }
> 
> impl Add for Eur {
>     type Output = Eur;
> 
>     fn add(self, rhs: Eur) -> Self::Output {
>         Eur(self.0 + rhs.0)
>     }
> }
> 
> impl Eur {
>     pub fn to_usd(&self, rate: ExchangeRate) -> Usd {
>         let converted = (self.0 as f64) * rate.0;
>         Usd(converted.round() as u64)
>     }
> }
> 
> impl Usd {
>     pub fn is_zero(&self) -> bool {
>         self.0 == 0
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_usd_addition_and_equality() {
>         let wallet1 = Usd(5000); // $50.00
>         let wallet2 = Usd(2500); // $25.00
>         let total = wallet1 + wallet2;
> 
>         assert_eq!(total, Usd(7500));
>         assert_ne!(total, wallet1);
>         assert!(!total.is_zero());
>     }
> 
>     #[test]
>     fn test_currency_conversion() {
>         let eur_amount = Eur(10000); // 100.00 EUR
>         let eur_to_usd_rate = ExchangeRate(1.08); // 1 EUR = 1.08 USD
>         let usd_equivalent = eur_amount.to_usd(eur_to_usd_rate);
> 
>         assert_eq!(usd_equivalent, Usd(10800)); // $108.00
>     }
> 
>     #[test]
>     fn test_pattern_matching_and_destructuring() {
>         let payment = Usd(1500);
>         
>         // Destructure tuple struct directly
>         let Usd(cents) = payment;
>         assert_eq!(cents, 1500);
> 
>         // Test matches! macro on tuple struct pattern
>         assert!(matches!(payment, Usd(1500)));
>         assert!(!matches!(payment, Usd(0)));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Zero-Cost Abstraction & Type Identity**: Single-element tuple structs like `Usd(pub u64)` compile down to the exact memory representation of a raw `u64` (zero runtime overhead), yet enforce compile-time type separation. The Rust compiler strictly prevents adding `Usd` to `Eur` directly because `Usd + Eur` lacks an `Add` trait implementation across distinct types.
> 2. **Operator Overloading via `std::ops::Add`**: Implementing `Add` for `Usd` establishes domain logic for summing values within the same currency domain, returning a new `Usd` instance via move semantics (`Copy` primitives).
> 3. **Pattern Matching & Field Access**: Unnamed positional fields in tuple structs can be accessed either via dot-index notation (`payment.0`) or pattern destructured using `let Usd(cents) = payment;`.
> 4. **Safety & Precision Bounds**: Operating on integer micro-units (`u64` cents) eliminates binary floating-point rounding errors during accumulation, converting to `f64` only during multi-currency rate transformations.

---

### Exercise 2: Network Telemetry & Packet Routing Engine (Nested Tuple Structs & Custom Parsing)

**Scenario:**
High-performance network switches and telemetry proxies process IPv4 socket connections in real time. Representing network endpoints using plain 4-element tuples `(u8, u8, u8, u8)` leads to unreadable code and lost domain meaning, whereas standard named structs add needless syntax verbosity for familiar data structures.

**Task:**
Construct a zero-overhead network socket domain model utilizing nested tuple structs:
1. Define `struct Ipv4Addr(pub u8, pub u8, pub u8, pub u8);` representing an IPv4 address.
2. Define `struct Port(pub u16);` wrapping a TCP/UDP port number.
3. Define `struct SocketAddrV4(pub Ipv4Addr, pub Port);` encapsulating an IPv4 endpoint.
4. Implement helper methods:
   - `Ipv4Addr::is_loopback(&self) -> bool` returning true if the first octet is `127`.
   - `Port::is_privileged(&self) -> bool` returning true if the port is `< 1024`.
   - `SocketAddrV4::to_string(&self) -> String` formatting the address as `"a.b.c.d:port"`.
5. Write unit tests in `#[cfg(test)] mod tests` verifying loopback detection, port checks, string rendering, and nested destructuring with `assert_eq!`, `assert!`, `assert_ne!`, and `matches!`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub struct Ipv4Addr(pub u8, pub u8, pub u8, pub u8);
> 
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub struct Port(pub u16);
> 
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub struct SocketAddrV4(pub Ipv4Addr, pub Port);
> 
> impl Ipv4Addr {
>     pub fn is_loopback(&self) -> bool {
>         self.0 == 127
>     }
> }
> 
> impl Port {
>     pub fn is_privileged(&self) -> bool {
>         self.0 < 1024
>     }
> }
> 
> impl SocketAddrV4 {
>     pub fn to_string(&self) -> String {
>         let Ipv4Addr(a, b, c, d) = self.0;
>         let Port(port) = self.1;
>         format!("{}.{}.{}.{}:{}", a, b, c, d, port)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_loopback_and_privileged_port() {
>         let ip = Ipv4Addr(127, 0, 0, 1);
>         let port = Port(80);
>         let socket = SocketAddrV4(ip, port);
> 
>         assert!(ip.is_loopback());
>         assert!(port.is_privileged());
>         assert_eq!(socket.to_string(), "127.0.0.1:80");
>     }
> 
>     #[test]
>     fn test_non_loopback_unprivileged() {
>         let ip = Ipv4Addr(192, 168, 1, 100);
>         let port = Port(8080);
> 
>         assert!(!ip.is_loopback());
>         assert!(!port.is_privileged());
>         assert_ne!(ip, Ipv4Addr(127, 0, 0, 1));
>     }
> 
>     #[test]
>     fn test_nested_pattern_matching() {
>         let socket = SocketAddrV4(Ipv4Addr(10, 0, 0, 1), Port(443));
> 
>         // Deep destructuring of nested tuple struct
>         let SocketAddrV4(Ipv4Addr(a, b, c, d), Port(p)) = socket;
>         assert_eq!((a, b, c, d, p), (10, 0, 0, 1, 443));
> 
>         // Match validation using matches! macro
>         assert!(matches!(socket, SocketAddrV4(Ipv4Addr(10, _, _, _), Port(443))));
>         assert!(!matches!(socket, SocketAddrV4(Ipv4Addr(127, _, _, _), _)));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Positional Struct Composition**: Tuple structs allow composing structured nested types—such as `SocketAddrV4(Ipv4Addr, Port)`—without defining redundant field names like `address: Ipv4Addr` and `port: Port`. Positional indices (`self.0`, `self.1`) maintain clarity while reducing boilerplate.
> 2. **Deep Pattern Destructuring**: Rust's pattern matching algorithm cleanly handles deeply nested tuple structs. Syntaxes such as `let SocketAddrV4(Ipv4Addr(a, b, c, d), Port(p)) = socket;` extract primitive values recursively in a single binding statement.
> 3. **Memory Alignment & Layout**: Because `Ipv4Addr(u8, u8, u8, u8)` contains four byte-aligned primitives and `Port(u16)` contains a 2-byte integer, Rust packs `SocketAddrV4` into a compact 6-byte structure in memory (subject to standard alignment padding), keeping network packet processing cache-friendly.
> 4. **Invariants & Type Boundaries**: Using specialized tuple structs for `Port` and `Ipv4Addr` guarantees that high-level functions accepting network sockets cannot accidentally swap raw port integers with IPv4 octet values.

---

### Exercise 3: Type-Safe In-Memory Relational Entity Store (Opaque Keys & Ref Bounds)

**Scenario:**
Enterprise database layers and AST compilers manage primary keys for different database tables (e.g. `User`, `Order`, `Product`). Using raw numeric IDs (`u64`) across table repositories frequently leads to logical corruptions where a `user_id` is accidentally queried against an `order_repository`.

**Task:**
Design an in-memory entity lookup system using strong tuple struct key wrappers and lifetime-aware records:
1. Define key tuple structs `UserId(pub u64)` and `OrderId(pub u64)`.
2. Define a database record tuple struct holding an entity key and a string payload reference: `struct UserRecord<'a>(pub UserId, pub &'a str);` and `struct OrderRecord<'a>(pub OrderId, pub &'a str);`.
3. Implement an in-memory repository store `struct EntityStore<'a>` containing `Vec<UserRecord<'a>>` and `Vec<OrderRecord<'a>>`.
4. Add methods to `EntityStore`:
   - `pub fn insert_user(&mut self, record: UserRecord<'a>)`
   - `pub fn insert_order(&mut self, record: OrderRecord<'a>)`
   - `pub fn find_user(&self, id: UserId) -> Option<&'a str>`
   - `pub fn find_order(&self, id: OrderId) -> Option<&'a str>`
5. Write unit tests in `#[cfg(test)] mod tests` demonstrating type safety, successful retrieval, missing key lookups, and pattern matching using `assert_eq!`, `assert!`, `assert_ne!`, and `matches!`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub struct UserId(pub u64);
> 
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub struct OrderId(pub u64);
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct UserRecord<'a>(pub UserId, pub &'a str);
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct OrderRecord<'a>(pub OrderId, pub &'a str);
> 
> #[derive(Default)]
> pub struct EntityStore<'a> {
>     users: Vec<UserRecord<'a>>,
>     orders: Vec<OrderRecord<'a>>,
> }
> 
> impl<'a> EntityStore<'a> {
>     pub fn new() -> Self {
>         Self {
>             users: Vec::new(),
>             orders: Vec::new(),
>         }
>     }
> 
>     pub fn insert_user(&mut self, record: UserRecord<'a>) {
>         self.users.push(record);
>     }
> 
>     pub fn insert_order(&mut self, record: OrderRecord<'a>) {
>         self.orders.push(record);
>     }
> 
>     pub fn find_user(&self, id: UserId) -> Option<&'a str> {
>         self.users
>             .iter()
>             .find(|record| record.0 == id)
>             .map(|record| record.1)
>     }
> 
>     pub fn find_order(&self, id: OrderId) -> Option<&'a str> {
>         self.orders
>             .iter()
>             .find(|record| record.0 == id)
>             .map(|record| record.1)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_entity_store_insert_and_lookup() {
>         let mut store = EntityStore::new();
>         let user_id = UserId(101);
>         let order_id = OrderId(5001);
> 
>         store.insert_user(UserRecord(user_id, "Alice Developer"));
>         store.insert_order(OrderRecord(order_id, "Laptop purchase"));
> 
>         let user_name = store.find_user(user_id);
>         let order_desc = store.find_order(order_id);
> 
>         assert_eq!(user_name, Some("Alice Developer"));
>         assert_eq!(order_desc, Some("Laptop purchase"));
>         assert!(user_name.is_some());
>     }
> 
>     #[test]
>     fn test_missing_key_lookup() {
>         let store = EntityStore::new();
>         let missing_user = UserId(999);
> 
>         assert_eq!(store.find_user(missing_user), None);
>         assert_ne!(missing_user, UserId(101));
>     }
> 
>     #[test]
>     fn test_tuple_struct_pattern_matching() {
>         let record = UserRecord(UserId(42), "Bob Smith");
> 
>         // Destructure record tuple struct
>         let UserRecord(UserId(id_val), name) = record;
>         assert_eq!(id_val, 42);
>         assert_eq!(name, "Bob Smith");
> 
>         // Match verification with matches!
>         assert!(matches!(record, UserRecord(UserId(42), _)));
>         assert!(!matches!(record, UserRecord(UserId(100), _)));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Domain-Specific Key Safety**: Distinguishing entity keys using dedicated tuple structs (`UserId` vs `OrderId`) prevents key transposition bugs at compile time. Calling `store.find_user(order_id)` generates a strict compiler error (`E0308: mismatched types`), stopping cross-entity database queries before execution.
> 2. **Lifetimes in Tuple Structs**: The tuple struct `UserRecord<'a>(pub UserId, pub &'a str)` combines owned data (`UserId`) with borrowed string slices (`&'a str`). The generic lifetime parameter `'a` binds the reference held inside field `.1` to the memory buffer where the string literal or slice resides.
> 3. **Ownership and Copy Semantics**: `UserId` derives `Copy` and `Clone` because it wraps a primitive `u64`. Searching the store borrows `UserId` by value without requiring heap allocation or moving the key out of caller context.
> 4. **Pattern Matching Flexibility**: Positional pattern matching allows concise extraction of both the key and slice contents via `let UserRecord(UserId(id_val), name) = record;` without accessing indices directly.

---

## 6. Related Terms


- [Struct](struct.md) — The standard version that requires you to name every field.
- [Unit Struct](unit_struct.md) — A struct with no fields at all (e.g. `struct Marker;`).
- [Pattern Matching](pattern_matching.md) — A great way to extract values from a Tuple Struct: `let Color(r, g, b) = my_color;`
- [Newtype Pattern](../level_11/newtype_pattern.md) — Related concept: Newtype Pattern.

---

## 7. Key Takeaways

- Tuple Structs give a standard anonymous Tuple a unique **Type Name**.
- The fields are unnamed and accessed via dot-index notation (e.g., `color.0`, `color.1`).
- They provide strict **type safety** (you cannot accidentally mix up two Tuple Structs that have the same internal types).
- Use them when naming the fields is redundant (e.g., `Color(R, G, B)`), or for the "Newtype" pattern (wrapping a single primitive type to give it meaning).
