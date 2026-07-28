# Associated Function

> **Level 2 — Control Flow & Data Structures**
> A function in an `impl` block without `self` (like a static method), e.g. `String::new()`.

---

## 1. Prerequisites

- [`impl` Block](../level_02/impl_block.md) — The location where Associated Functions are defined.
- [Method](../level_02/method.md) — The sister concept; Methods *do* take `self`, whereas Associated Functions *do not*.

---

## 2. Term Category

**Rust-nonspecific**: In Object-Oriented languages like Java, C#, or C++, this concept is known as a **Static Method** or **Class Method**. It is a function that belongs to a Type/Class as a whole, rather than belonging to a specific instance/object of that class.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Sometimes you need a function that is closely related to a [Struct](../level_02/struct.md) or [Enum](../level_02/enum.md), but it doesn't actually need an *instance* of that data to run. 

The most common example is a **Constructor**—a function whose entire job is to build a brand new instance for you. If you made the constructor a standard [Method](../level_02/method.md), you would need an instance of the struct to call the method that creates an instance of the struct. This is a paradox!

To solve this, you define a function inside an `impl` block, but you **omit the `self` parameter**. This creates an **Associated Function**. It is "associated" with the Type itself (like `String`), rather than an instance of the Type (like `"hello"`). 

### (2) Reality Metaphor

Imagine a Car Factory (the Type) and a physical Car (the Instance).

A **Method** is like turning the steering wheel. You can only turn the steering wheel if you have a physical car to sit inside. You interact with the car itself (`my_car.turn_wheel()`).

An **Associated Function** is like placing an order at the Factory for a brand new car. You don't need to already own a car to place the order; you are talking to the Factory itself. You interact with the concept of the car (`CarFactory::build_new_car()`).

### (3) Rust Code Examples

#### Short Snippet (The Constructor)
```rust
struct User {
    username: String,
    role: String,
}

impl User {
    // This is an Associated Function because it lacks `&self`.
    // By convention, we name constructors `new`, but it's not a strict keyword.
    fn new(name: String) -> User {
        User {
            username: name,
            role: String::from("Guest"), // Default role
        }
    }
}
```

#### Fuller Example (Calling the Function)
Because Associated Functions do not have an instance (`self`), you cannot use dot notation to call them. You must use the double colon `::` syntax on the Type name itself.

```rust
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    // Associated Function (Constructor)
    fn square(size: u32) -> Rectangle {
        Rectangle { width: size, height: size }
    }

    // Method (Takes &self)
    fn area(&self) -> u32 {
        self.width * self.height
    }
}

fn main() {
    // 1. Call the Associated Function using `::` on the Type name.
    let my_square = Rectangle::square(10);
    
    // 2. Call the Method using `.` on the instance.
    println!("The area is: {}", my_square.area());
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Associated Function Scoping and Lifecycle Rules

**The mistake:** Assuming Associated Function instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("associated_function_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("associated_function_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Associated Function State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Associated Function through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Associated Function Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Associated Function instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Default Settings

**Problem:** We have a `ServerConfig` struct. Write an associated function called `default()` that returns a new `ServerConfig` with the port set to `8080` and the mode set to `"Production"`.

```rust
struct ServerConfig {
    port: u32,
    mode: String,
}

// TODO: Write the `impl` block and the `default()` associated function here

fn main() {
    let config = ServerConfig::default();
    println!("Starting {} server on port {}", config.mode, config.port);
}
```

**Expected output:**
> [!check]- Answer
> ```text
> Starting Production server on port 8080
> ```
> ```rust
> impl ServerConfig {
>     fn default() -> ServerConfig {
>         ServerConfig {
>             port: 8080,
>             mode: String::from("Production"),
>         }
>     }
> }
> ```

---

### Exercise 2: Constructor Factory Pattern

**Problem:** Create a struct `Rectangle` with `width` and `height`. Add an associated constructor function `Rectangle::square(size: u32) -> Self` and call it.

**Expected output:**
> [!check]- Answer
> ```
> Square: 10x10
> ```
> ```rust
> struct Rectangle {
>     width: u32,
>     height: u32,
> }
> impl Rectangle {
>     fn square(size: u32) -> Self {
>         Self { width: size, height: size }
>     }
> }
> fn main() {
>     let r = Rectangle::square(10);
>     println!("Square: {}x{}", r.width, r.height);
> }
> ```
>
> **Explanation:** Associated functions without `self` parameters act as constructors or namespace helper functions, instantiated via `Type::fn_name()`.

---

### Exercise 3: Default Instance Construction

**Problem:** Add an associated function `Config::default_config() -> Config` returning a default struct `Config { port: 8080 }`.

**Expected output:**
> [!check]- Answer
> ```
> Port: 8080
> ```
> ```rust
> struct Config { port: u16 }
> impl Config {
>     fn default_config() -> Self {
>         Self { port: 8080 }
>     }
> }
> fn main() {
>     let cfg = Config::default_config();
>     println!("Port: {}", cfg.port);
> }
> ```
>
> **Explanation:** `Self` inside an `impl` block refers to the implementing type, simplifying constructor returns.

---

## 6. Related Terms

- [Method](../level_02/method.md) — The sister function that *does* take `self`.
- [`impl` Block](../level_02/impl_block.md) — The boundary where Associated Functions are defined.

---

## 7. Key Takeaways

- **Associated Functions** live in `impl` blocks but **do not** take a `self` parameter.
- They are the Rust equivalent of "Static Methods" in other languages.
- They are most commonly used for "Constructors" (functions that return a new instance of the struct).
- They are called using the double colon namespace syntax directly on the Type name (e.g., `String::new()`).
- `new` is not a magic keyword in Rust; it is just a naming convention.
