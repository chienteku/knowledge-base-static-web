# Enum

> **Level 2 — Control Flow & Data Structures**
> A type that can be one of several variants, each optionally carrying data.

---

## 1. Prerequisites

- [Struct](../level_02/struct.md) — While structs group data together, enums offer a choice between different types of data.
- [`match`](../level_02/match.md) — The primary tool used to check which variant an Enum is currently holding and extract its data.

---

## 2. Term Category

**Rust-specific (the immense power)**: Enums (short for enumerations) exist in languages like C and Java. However, in those languages, they are usually just glorified integers used for labeling. In Rust, Enums are **Algebraic Data Types**. This means that each individual variant within the enum can store its own unique, custom data!

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

A [Struct](../level_02/struct.md) is an **"AND"** type. A `User` struct has a username **AND** an email **AND** an age. 

But sometimes you need an **"OR"** type. For example, imagine a network request. The result is either a `Success` **OR** a `Failure`. It can never be both. If you try to model this with a struct, you end up with awkward, confusing fields where half the data is null/empty depending on the state.

An **Enum** is the perfect tool for "OR" relationships. It allows you to define a type by enumerating its possible variants. What makes Rust's enums legendary is that **variants can hold data**. A `Success` variant can hold a `String` representing the webpage HTML, while the `Failure` variant holds an `i32` representing the 404 error code. 

### (2) Reality Metaphor

Imagine a combo meal at a restaurant where you must choose exactly one side dish. 

The Side Dish is an **Enum**. It can be Fries **OR** Salad **OR** Soup. 
- If you choose `Fries`, it might hold extra data: `Fries(Size)`.
- If you choose `Salad`, it might hold no extra data at all: `Salad`.
- If you choose `Soup`, it might hold very complex data: `Soup { flavor: String, temperature: i32 }`.

You only get one side dish, but the specific choice dictates what extra information comes with it.

### (3) Rust Code Examples

#### Short Snippet (Basic Enum)
```rust
// An enum with no internal data (similar to a C-style enum).
enum TrafficLight {
    Red,
    Yellow,
    Green,
}

fn main() {
    // You access variants using the double colon `::` namespace
    let current_light = TrafficLight::Red;
}
```

#### Fuller Example (Enums with Data)
```rust
// An enum where variants hold different shapes of data!
enum WebEvent {
    PageLoad,                 // Variant with no data (Unit-like)
    KeyPress(char),           // Variant holding a single character (Tuple-like)
    Click { x: i64, y: i64 }, // Variant holding named fields (Struct-like)
}

fn main() {
    let event1 = WebEvent::KeyPress('x');
    let event2 = WebEvent::Click { x: 250, y: 120 };
    
    // We use Pattern Matching to extract the data hidden inside the enum!
    match event2 {
        WebEvent::PageLoad => println!("Page loaded."),
        WebEvent::KeyPress(c) => println!("Pressed key: {}", c),
        WebEvent::Click { x, y } => println!("Clicked at {}, {}", x, y),
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Enum Scoping and Lifecycle Rules

**The mistake:** Assuming Enum instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("enum_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("enum_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Enum State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Enum through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Enum Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Enum instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Messenger

**Problem:** Define an enum called `Message`. It should have three variants: 
1. `Quit` (holds no data)
2. `Echo` (holds a `String`)
3. `Move` (holds two named fields, `x: i32` and `y: i32`)

```rust
// TODO: Define the Message enum here

fn main() {
    // TODO: Create an instance of the `Echo` variant holding the string "Hello"
    // let msg = ...
}
```

> [!check]- Answer
> ```rust
> enum Message {
>     Quit,
>     Echo(String),
>     Move { x: i32, y: i32 },
> }
>
> // Inside main:
> let msg = Message::Echo(String::from("Hello"));
> ```

---

### Exercise 2: Enum Method Implementation

**Problem:** Define an enum `Shape` with variants `Circle(f64)` and `Square(f64)`. Implement an `area(&self) -> f64` method on `Shape`.

**Expected output:**
> [!check]- Answer
> ```
> Circle area: 78.53981633974483
> ```
> ```rust
> enum Shape {
>     Circle(f64),
>     Square(f64),
> }
> impl Shape {
>     fn area(&self) -> f64 {
>         match self {
>             Shape::Circle(r) => std::f64::consts::PI * r * r,
>             Shape::Square(s) => s * s,
>         }
>     }
> }
> fn main() {
>     let c = Shape::Circle(5.0);
>     println!("Circle area: {}", c.area());
> }
> ```
>
> **Explanation:** Methods on enums pattern match on `self` variants to execute variant-specific computations.

---

### Exercise 3: Discriminant Value Assignment

**Problem:** Define a C-style enum `HttpStatus` with custom integer discriminants `Ok = 200`, `NotFound = 404`. Cast `HttpStatus::NotFound as u16` and print it.

**Expected output:**
> [!check]- Answer
> ```
> 404
> ```
> ```rust
> enum HttpStatus {
>     Ok = 200,
>     NotFound = 404,
> }
> fn main() {
>     println!("{}", HttpStatus::NotFound as u16);
> }
> ```
>
> **Explanation:** Fieldless enums support explicit integer discriminant values castable via `as`.

---

## 6. Related Terms

- [`match`](../level_02/match.md) — The ultimate tool for safely verifying and extracting data out of an enum variant.
- [`Option<T>`](../level_02/option_t.md) — The most famous built-in enum in Rust. It represents a value that might exist (`Some(T)`) or might not (`None`).
- [`Result<T, E>`](../level_02/result_t_e.md) — Another famous built-in enum used for error handling (`Ok(T)` or `Err(E)`).

---

## 7. Key Takeaways

- A `struct` groups data together (an **AND** relationship); an `enum` represents an exclusive choice between variants (an **OR** relationship).
- Rust enums are incredibly powerful because their variants can store completely different shapes of data (Strings, Tuples, or even Structs).
- You must use the `::` syntax to access a variant (e.g., `Coin::Penny`).
- You cannot access data hidden inside an enum directly; you are forced to use pattern matching (`match` or `if let`) to safely extract it.
