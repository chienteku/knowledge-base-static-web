# Unit Struct

> **Level 2 — Control Flow & Data Structures**
> A struct with no fields, e.g. `struct Marker;`. Used as a type-level tag.

---

## 1. Prerequisites

- [Struct](../level_02/struct.md) — The parent concept; a standard struct contains named data fields.
- [Tuple Struct](../level_02/tuple_struct.md) — A struct with unnamed data fields.
- [`impl` Block](../level_02/impl_block.md) — (Future reference) This is where Unit Structs actually become useful, as it allows you to attach behavior to them.

---

## 2. Term Category

**Rust-specific (mostly)**: While some Object-Oriented languages allow you to create "empty classes", Rust formalizes the Unit Struct as a distinct concept. It takes up absolutely zero memory at runtime and is heavily used in advanced Rust patterns (like the Typestate pattern) to enforce logic at compile time.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

If a [Struct](../level_02/struct.md) is designed to group data together, why would you ever want a struct that contains *no data at all*?

In Rust, **data and behavior are strictly separated**. Structs hold data, and `impl` blocks define behavior. Sometimes, you want to define behavior without actually needing to store any information. For example, you might want to create a `Keyboard` struct that implements a `Typeable` trait, but you don't care about storing the color or size of the keyboard in memory.

A **Unit Struct** solves this perfectly. It provides the strict **Type Identity** required by the compiler so you can attach functions and Traits to it, but it takes up exactly **0 bytes** of memory. It vanishes completely when your program is compiled.

### (2) Reality Metaphor

A Unit Struct is like a **VIP Access Badge**.

The badge itself doesn't contain any useful data. There is no barcode, no magnetic strip, no name, and no photo. It's literally just a blank piece of colored plastic. 

However, simply *possessing* the badge grants you specific behaviors (the ability to walk past the bouncer into the VIP lounge). The value isn't in the data it holds; the value is entirely in its identity.

### (3) Rust Code Examples

#### Short Snippet (Definition and Instantiation)
```rust
// Defining a Unit Struct. 
// Notice there are no `{}` or `()`, just a semicolon.
struct DatabaseConnection;

fn main() {
    // Instantiating a Unit Struct.
    // Again, no brackets or parentheses required!
    let conn = DatabaseConnection;
}
```

#### Fuller Example (Adding Behavior)
```rust
struct Greeter;

// We use an `impl` block to attach behavior to our empty struct.
impl Greeter {
    fn say_hello(&self) {
        println!("Hello! I take up 0 bytes of memory!");
    }
}

fn main() {
    let my_greeter = Greeter;
    
    // We can call methods on it, even though it holds no data.
    my_greeter.say_hello();
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Adding curly braces or parentheses

**The mistake:** Trying to define or instantiate a Unit Struct using `{}` or `()`.

**Why it's wrong:** The defining characteristic of a Unit Struct is that it lacks those symbols entirely. It is just the keyword, the name, and a semicolon.

*Incorrect:*
```rust
struct Marker {}; // Adding unnecessary braces
let m = Marker(); // Trying to instantiate it like a function
```

*Fix:*
```rust
struct Marker;
let m = Marker;
```

### Mistake 2: Mutating Unit Struct State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Unit Struct through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Unit Struct Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Unit Struct instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Stateless Handler

**Problem:** You are building a web server and need a type to handle incoming requests, but it doesn't need to store any state. Define a unit struct called `StatelessHandler` and then create an instance of it inside `main`.

```rust
// TODO: Define the StatelessHandler unit struct here

fn main() {
    // TODO: Create an instance named `handler` here
    
    // This is just to prove it compiles and takes 0 bytes!
    println!("Handler size: {} bytes", std::mem::size_of_val(&handler));
}
```

**Expected output:**
> [!check]- Answer
> ```text
> Handler size: 0 bytes
> ```
> ```rust
> struct StatelessHandler;
>
> // Inside main:
> let handler = StatelessHandler;
> ```

---

### Exercise 2: Marker Traits with Unit Structs

**Problem:** Define a unit struct `struct Kilograms;` as a type marker for generic unit conversion.

**Expected output:**
> [!check]- Answer
> ```
> Marker size: 0 bytes
> ```
> ```rust
> struct Kilograms;
> fn main() {
>     println!("Marker size: {} bytes", std::mem::size_of::<Kilograms>());
> }
> ```
>
> **Explanation:** Unit structs compile to zero-sized marker types.

---

### Exercise 3: Implementing Traits on Unit Structs

**Problem:** Implement a `Formatter` trait on a unit struct `struct JsonFormatter;`.

**Expected output:**
> [!check]- Answer
> ```
> Formatted JSON
> ```
> ```rust
> trait Formatter { fn format(&self) -> &'static str; }
> struct JsonFormatter;
> impl Formatter for JsonFormatter {
>     fn format(&self) -> &'static str { "Formatted JSON" }
> }
> fn main() {
>     let fmt = JsonFormatter;
>     println!("{}", fmt.format());
> }
> ```
>
> **Explanation:** Unit structs allow instantiating stateless strategy objects implementing behavior traits.

---

## 6. Related Terms

- [Struct](../level_02/struct.md) — The standard version that requires you to name every field.
- [Tuple Struct](../level_02/tuple_struct.md) — A struct with unnamed fields.
- **[Unit Type `()`](../level_01/unit_type.md)** — The fundamental "nothing" type in Rust (which functions return when they have no explicit return value). This is where the "Unit Struct" gets its name.

---

## 7. Key Takeaways

- A Unit Struct is defined simply with `struct Name;` (no `{}` or `()`).
- It takes up exactly **0 bytes** of memory at runtime.
- You create an instance simply by typing its name: `let x = Name;`.
- It is primarily used when you need a custom Type to attach behavior to (via `impl` blocks or Traits), but you don't need to store any actual state.
