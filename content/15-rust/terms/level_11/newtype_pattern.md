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

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

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

## 5. Practice Exercises

### Exercise 1: The Third-Party Problem

**Problem:** You are building a web server. You want to implement a 3rd-party trait (`Serialize` from the `serde` crate) on a 3rd-party type (`Uuid` from the `uuid` crate). The compiler rejects it because of the Orphan Rule. How do you fix this?

> [!check]- Answer
> You use the **Newtype Pattern**! 
>
> You define a local struct `struct MyUuid(Uuid);`, and then you implement `Serialize` on your local `MyUuid`. Because the struct is defined in your codebase, the compiler allows the implementation!

---

### Exercise 2: Domain Type Safety with Newtypes

**Problem:** Create `struct Miles(u32)` and `struct Kilometers(u32)`. Write functions preventing accidental unit mixing.

**Expected output:**
> [!check]- Answer
> ```
> Distance in miles: 100
> ```
> ```rust
> struct Miles(u32);
> struct Kilometers(u32);
> fn print_miles(m: Miles) { println!("Distance in miles: {}", m.0); }
> fn main() {
>     let m = Miles(100);
>     print_miles(m);
> }
> ```
>
> **Explanation:** Newtypes wrap primitive types into distinct zero-cost domain types enforced at compile time.

---

### Exercise 3: Implementing `Deref` for Newtypes

**Problem:** Implement `Deref` for `struct Name(String)` to expose `&str` methods directly.

**Expected output:**
> [!check]- Answer
> ```
> Len: 5
> ```
> ```rust
> use std::ops::Deref;
> struct Name(String);
> impl Deref for Name {
>     type Target = String;
>     fn deref(&self) -> &Self::Target { &self.0 }
> }
> fn main() {
>     let n = Name("Alice".into());
>     println!("Len: {}", n.len());
> }
> ```
>
> **Explanation:** Implementing `Deref` exposes inner wrapped type methods seamlessly.

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
