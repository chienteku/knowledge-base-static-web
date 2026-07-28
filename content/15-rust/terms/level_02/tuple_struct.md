# Tuple Struct

> **Level 2 — Control Flow & Data Structures**
> A struct with unnamed fields, e.g. `struct Color(u8, u8, u8);`.

---

## 1. Prerequisites

- [Struct](../level_02/struct.md) — The parent concept; standard structs have named fields.
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

## 5. Practice Exercises

### Exercise 1: The "Newtype" Pattern

**Problem:** A common use for a Tuple Struct is wrapping a single value to give it a strict type (known as the "Newtype" pattern). Define a Tuple Struct called `Password` that wraps a single `String`. Then, instantiate it.

```rust
// TODO: Define the `Password` Tuple Struct here

fn main() {
    // TODO: Create an instance named `my_pass` wrapping the string "hunter2"
    
    println!("My secure password is: {}", my_pass.0);
}
```

**Expected output:**
> [!check]- Answer
> ```text
> My secure password is: hunter2
> ```
> ```rust
> struct Password(String);
>
> // Inside main:
> let my_pass = Password(String::from("hunter2"));
> ```

---

### Exercise 2: Newtype Pattern with Tuple Structs

**Problem:** Create a newtype tuple struct `Meters(u64)` and implement addition for distance safety.

**Expected output:**
> [!check]- Answer
> ```
> Meters: 15
> ```
> ```rust
> struct Meters(u64);
> fn main() {
>     let d1 = Meters(5);
>     let d2 = Meters(10);
>     let total = Meters(d1.0 + d2.0);
>     println!("Meters: {}", total.0);
> }
> ```
>
> **Explanation:** Single-element tuple structs create strong distinct types for type-safe domain modeling.

---

### Exercise 3: Destructuring Tuple Structs

**Problem:** Define `struct Color(u8, u8, u8)`. Destructure `Color(255, 0, 0)` into `let Color(r, g, b) = c;`.

**Expected output:**
> [!check]- Answer
> ```
> Red: 255
> ```
> ```rust
> struct Color(u8, u8, u8);
> fn main() {
>     let c = Color(255, 0, 0);
>     let Color(r, _, _) = c;
>     println!("Red: {}", r);
> }
> ```
>
> **Explanation:** Tuple struct patterns destructure fields positionally.

---

## 6. Related Terms

- [Struct](../level_02/struct.md) — The standard version that requires you to name every field.
- [Unit Struct](../level_02/unit_struct.md) — A struct with no fields at all (e.g. `struct Marker;`).
- [Pattern Matching](../level_02/pattern_matching.md) — A great way to extract values from a Tuple Struct: `let Color(r, g, b) = my_color;`

---

## 7. Key Takeaways

- Tuple Structs give a standard anonymous Tuple a unique **Type Name**.
- The fields are unnamed and accessed via dot-index notation (e.g., `color.0`, `color.1`).
- They provide strict **type safety** (you cannot accidentally mix up two Tuple Structs that have the same internal types).
- Use them when naming the fields is redundant (e.g., `Color(R, G, B)`), or for the "Newtype" pattern (wrapping a single primitive type to give it meaning).
