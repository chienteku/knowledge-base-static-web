# `impl` Block

> **Level 2 — Control Flow & Data Structures**
> Associates methods and associated functions with a struct or enum.

---

## 1. Prerequisites

- [Struct](../level_02/struct.md) — The custom data types that `impl` blocks are most commonly attached to.
- [Enum](../level_02/enum.md) — You can also attach `impl` blocks to enums!
- [`fn`](../level_01/fn.md) — The functions that actually live inside the `impl` block.

---

## 2. Term Category

**Rust-specific (the separation of data and behavior)**: In Object-Oriented languages (like Java or C++), you define data (variables) and behavior (methods) together inside a single `class` block. Rust fundamentally separates them. Data is defined in a `struct`, and behavior is defined in an `impl` block.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In traditional Object-Oriented Programming, `class` files often balloon into massive, thousands-of-lines-long "God Objects" because all the data and every single behavior must be stuffed into the exact same set of curly braces. 

Rust enforces a strict architectural boundary. First, you define the pure "shape" of your data using a `struct`. Then, if you want that data to actually *do* something, you define an `impl` (short for "implementation") block. 

This design is incredibly flexible. You can create an `impl` block for a struct in one file, and a completely separate `impl` block for that *exact same struct* in another file! It keeps code organized, modular, and prevents bloated files.

### (2) Reality Metaphor

Imagine building a Robot.

A **`struct`** is the physical hardware: the metal chassis, the motors, the battery, and the sensors. On its own, it is just a dumb piece of metal. It doesn't *do* anything.

An **`impl` block** is the software chip you plug into the robot. The chip contains the instructions that teach the physical hardware how to walk, talk, and interact with the world. You can easily swap chips or plug in multiple chips (`impl` blocks) to give the robot new abilities without having to rebuild the metal body (`struct`).

### (3) Rust Code Examples

#### Short Snippet (The Basics)
```rust
// 1. Define the Data (The Hardware)
struct User {
    username: String,
}

// 2. Define the Behavior (The Software Chip)
impl User {
    // This is a "Method" because it takes `&self`
    fn print_name(&self) {
        println!("My name is {}", self.username);
    }
}

fn main() {
    let u = User { username: String::from("Maverick") };
    u.print_name(); // Calling the behavior!
}
```

#### Fuller Example (Multiple Blocks & Associated Functions)
```rust
struct Rectangle {
    width: u32,
    height: u32,
}

// Block 1: Core mathematical behavior
impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }
}

// Block 2: You can have multiple impl blocks for the same type!
// We can put Constructors (Associated Functions) here.
impl Rectangle {
    // Notice this does NOT take `&self`. It's like a "static" method.
    fn new(size: u32) -> Rectangle {
        Rectangle { width: size, height: size }
    }
}

fn main() {
    // Calling an Associated Function uses `::`
    let square = Rectangle::new(10);
    
    // Calling a Method uses `.`
    println!("The area is {}", square.area());
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Impl Block Scoping and Lifecycle Rules

**The mistake:** Assuming Impl Block instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("impl_block_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("impl_block_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Impl Block State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Impl Block through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Impl Block Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Impl Block instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Circle's Area

**Problem:** We have a `Circle` struct. Write an `impl` block for it that contains a single method called `radius_squared`. It should return the `radius` multiplied by itself.

```rust
struct Circle {
    radius: f64,
}

// TODO: Write the `impl` block here

fn main() {
    let my_circle = Circle { radius: 3.0 };
    println!("Radius squared: {}", my_circle.radius_squared());
}
```

**Expected output:**
> [!check]- Answer
> ```text
> Radius squared: 9
> ```
> ```rust
> impl Circle {
>     fn radius_squared(&self) -> f64 {
>         self.radius * self.radius
>     }
> }
> ```

---

### Exercise 2: Multiple `impl` Blocks Separation

**Problem:** Implement core constructors in one `impl Struct` block and helper methods in a second `impl Struct` block.

**Expected output:**
> [!check]- Answer
> ```
> Value: 42
> ```
> ```rust
> struct Item { val: i32 }
> impl Item {
>     fn new(val: i32) -> Self { Self { val } }
> }
> impl Item {
>     fn get_val(&self) -> i32 { self.val }
> }
> fn main() {
>     let item = Item::new(42);
>     println!("Value: {}", item.get_val());
> }
> ```
>
> **Explanation:** Rust allows splitting method definitions for a single type across multiple `impl` blocks.

---

### Exercise 3: Generic `impl` Blocks

**Problem:** Write an `impl<T> Container<T>` block providing `fn new(value: T) -> Self` and `fn value(&self) -> &T`.

**Expected output:**
> [!check]- Answer
> ```
> Contained: Hello
> ```
> ```rust
> struct Container<T> { value: T }
> impl<T> Container<T> {
>     fn new(value: T) -> Self { Self { value } }
>     fn value(&self) -> &T { &self.value }
> }
> fn main() {
>     let c = Container::new("Hello");
>     println!("Contained: {}", c.value());
> }
> ```
>
> **Explanation:** Generic type parameters declared in `impl<T>` make methods available for any generic type `T`.

---

## 6. Related Terms

- [Method](../level_02/method.md) — A function inside an `impl` block that *does* take `self` (operates on an instance).
- [Associated Function](../level_02/associated_function.md) — A function inside an `impl` block that *does not* take `self` (like a static constructor).
- [Traits](../level_04/trait.md) — (Future reference) You use `impl Trait for Type` to attach standardized interfaces to your structs.

---

## 7. Key Takeaways

- Rust strictly separates Data (`struct` / `enum`) from Behavior (`impl` block).
- You attach functions to a type using `impl TypeName { ... }`.
- You **cannot** put functions directly inside a `struct` definition.
- You can create **multiple** `impl` blocks for the exact same type, which is excellent for organizing large codebases.
