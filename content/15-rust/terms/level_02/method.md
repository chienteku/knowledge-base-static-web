# Method

> **Level 2 — Control Flow & Data Structures**
> A function defined in an `impl` block that takes `self`, `&self`, or `&mut self`.

---

## 1. Prerequisites

- [`impl` Block](../level_02/impl_block.md) — The location where all methods must be defined.
- [Struct](../level_02/struct.md) / [Enum](../level_02/enum.md) — The data types that methods are attached to.
- [`fn`](../level_01/fn.md) — A method is just a function with a special first parameter.

---

## 2. Term Category

**Rust-nonspecific**: Methods exist in almost all Object-Oriented programming languages (Java, Python, C++, etc.). They are simply functions that belong to a specific instance of an object (or in Rust's case, a struct or enum).

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

If you write a standard function to calculate the area of a rectangle, it looks like this: `fn calculate_area(rect: &Rectangle)`. You have to call it by passing the data in: `calculate_area(&my_rect)`. This works, but it doesn't intuitively communicate that calculating the area is an inherent property of a Rectangle.

By defining the function as a **Method** inside an `impl` block, Rust allows you to use a special first parameter called `self`. `self` represents the specific instance of the struct the method is being called on. 

This enables "dot notation" (`my_rect.area()`). Dot notation is universally recognized, makes the code read fluidly from left to right, and allows your IDE (like VS Code) to easily show you a list of all behaviors attached to that specific data type.

### (2) Reality Metaphor

Imagine you have a physical car (the `struct`). 

A standard function is like an external towing machine: the machine has to reach out, grab the car, and pull it to make it move (`tow_machine_move(&car)`). 

A **Method** is like the steering wheel and gas pedal *inside* the car. Because they are fundamentally attached to the car itself (via `self`), you interact with the car directly: `car.drive()`.

### (3) Rust Code Examples

#### Short Snippet (The Basics)
```rust
struct User {
    name: String,
}

impl User {
    // The `&self` parameter makes this a Method! 
    // It means "I need to read the data of the User calling this method."
    fn greet(&self) {
        println!("Hello, my name is {}", self.name);
    }
}

fn main() {
    let u = User { name: String::from("Alice") };
    u.greet(); // Called using dot notation!
}
```

#### Fuller Example (The Three Types of `self`)
There are three ways a method can interact with the struct instance:
```rust
struct BankAccount {
    balance: f64,
}

impl BankAccount {
    // 1. `&self` (Read-Only). The most common.
    fn check_balance(&self) {
        println!("Balance is ${}", self.balance);
    }

    // 2. `&mut self` (Modify). Allows changing the struct's data.
    fn deposit(&mut self, amount: f64) {
        self.balance += amount;
    }

    // 3. `self` (Consume). Rare. Takes complete ownership and DESTROYS the struct!
    fn close_account(self) {
        println!("Account with ${} is now permanently closed.", self.balance);
        // The struct is destroyed at the end of this block.
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Method Scoping and Lifecycle Rules

**The mistake:** Assuming Method instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("method_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("method_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Method State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Method through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Method Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Method instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Grow the Plant

**Problem:** We have a `Plant` struct. Write an `impl` block containing a method called `water`. The method should increase the plant's `height` by `1`.

```rust
struct Plant {
    height: i32,
}

// TODO: Write the `impl` block and the `water` method here

fn main() {
    let mut my_plant = Plant { height: 5 };
    my_plant.water();
    println!("Plant height is now: {}", my_plant.height);
}
```

**Expected output:**
```text
Plant height is now: 6
```

> [!check]- Answer
> - The method must modify data, so it needs to take `&mut self`.
> - Use `self.height += 1;` inside the method.

---

### Exercise 2: Mutable Method Calls

**Problem:** Implement a `Counter` struct with `count: u32` and a method `fn increment(&mut self)`.

**Expected output:**
```
Count: 1
```

> [!check]- Answer
> ```rust
> struct Counter { count: u32 }
> impl Counter {
>     fn increment(&mut self) { self.count += 1; }
> }
> fn main() {
>     let mut c = Counter { count: 0 };
>     c.increment();
>     println!("Count: {}", c.count);
> }
> ```
>
> **Explanation:** `&mut self` methods allow modifying instance fields in-place.

### Exercise 3: Chaining Methods via Builder Pattern

**Problem:** Implement a builder method `fn set_name(mut self, name: String) -> Self` that returns `self` for chaining.

**Expected output:**
```
User: Alice
```

> [!check]- Answer
> struct User { name: String }
> impl User {
>     fn new() -> Self { Self { name: String::new() } }
>     fn set_name(mut self, name: String) -> Self {
>         self.name = name;
>         self
>     }
> }
> fn main() {
>     let u = User::new().set_name("Alice".to_string());
>     println!("User: {}", u.name);
> }
> ```
>
> **Explanation:** Methods returning `Self` enable fluent builder chaining.

---

## 6. Related Terms

- [Associated Function](../level_02/associated_function.md) — A function inside an `impl` block that does *not* take `self` (like a static constructor, e.g., `String::new()`).
- [`impl` Block](../level_02/impl_block.md) — The boundary where all methods live.

---

## 7. Key Takeaways

- **Methods** are functions tied to a specific instance of a struct or enum.
- They must be defined inside an `impl` block.
- Their very first parameter must be `self` (which represents the instance).
- You call them using dot notation: `instance.method_name()`.
- **Default to using `&self` (read-only)**. Only use `&mut self` if you must modify data. Rarely use `self` without an ampersand, as it will destroy the instance.
