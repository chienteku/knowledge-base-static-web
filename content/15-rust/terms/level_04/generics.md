# Generics (`<T>`)

> **Level 4 — Error Handling & Generics**
> Parameterizing functions, structs, enums, and methods over types.

---

## 1. Prerequisites

- [`fn` (Functions)](../level_01/fn.md) — The primary place you will write generic code.
- [Structs](../level_02/struct.md) / [Enums](../level_02/enum.md) — The data structures you will make generic.
- [Traits](../level_04/trait.md) — The mechanism used to restrict what a generic type is allowed to do.

---

## 2. Term Category

**Rust-specific (the code deduplicator)**: Almost every modern, statically typed language has some form of Generics (e.g., Templates in C++, Generics in Java/C#). Generics allow you to write a single piece of code that can safely operate on multiple different data types, entirely eliminating the need to copy and paste code.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Imagine you want to write a function that takes a list of items and returns the largest one. 

First, you write `largest_i32(list: &[i32]) -> &i32`. 
Then, you realize you need the same logic for floats, so you copy-paste the exact same code and create `largest_f64(list: &[f64]) -> &f64`. 
Then you need it for characters, so you copy-paste it again: `largest_char(...)`.

This is a maintenance nightmare. If you find a bug, you have to fix it in 3 different places.

**Generics** solve this. They allow you to write the function *once* using a placeholder type (usually named `T`, standing for "Type"). You are telling the compiler: *"I don't care what exact type `T` is, as long as it behaves in a certain way, run this logic on it."*

### (2) Reality Metaphor

Imagine you are manufacturing a protective sleeve for a laptop. 

If your factory makes a "MacBook Pro 14-inch Sleeve", that is a **Concrete Type**. It only fits exactly one specific model of laptop. If someone buys a Dell, they can't use it.

If your factory makes a "Universal Elastic Sleeve `<T>`", that is a **Generic**. You don't care exactly what brand or model the laptop (`T`) is. As long as `T` fits within the physical stretching dimensions of the elastic, the sleeve will accept it and protect it.

### (3) Rust Code Examples

#### Short Snippet (Generic Structs)
You can define structs that hold any type of data using `<T>`. You've actually used this before with `Option<T>` and `Vec<T>`!

```rust
// We define a Point that holds two values of the exact SAME type `T`.
struct Point<T> {
    x: T,
    y: T,
}

fn main() {
    // T becomes an i32
    let integer_point = Point { x: 5, y: 10 }; 
    
    // T becomes an f64
    let float_point = Point { x: 1.0, y: 4.5 }; 
    
    // ERROR: T must be the SAME type for both x and y!
    // let invalid_point = Point { x: 5, y: 4.0 }; 
}
```

#### Fuller Example (Generic Functions and Methods)
When writing a generic function, you must *declare* the generic parameter `<T>` right after the function name before you can use it.

```rust
// 1. Declare <T> after the function name.
// 2. Use T as the parameter type and return type.
fn echo<T>(item: T) -> T {
    println!("I am echoing a generic item!");
    item
}

// Generics in implementations require declaring <T> after `impl`.
struct Container<T> {
    value: T,
}

impl<T> Container<T> {
    fn get_value(&self) -> &T {
        &self.value
    }
}

fn main() {
    let a = echo(5);          // T is i32
    let b = echo("Hello");    // T is &str
    
    let c = Container { value: true }; // Container<bool>
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Generics Scoping and Lifecycle Rules

**The mistake:** Assuming Generics instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("generics_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("generics_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Generics State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Generics through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Generics Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Generics instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Multi-Generic Struct

**Problem:** Create a generic struct called `Delivery` that holds two fields: `item` and `address`. The catch? The `item` and `address` might be of *different* types! (Hint: You need more than just `<T>`).

```rust
// TODO: Define the Delivery struct here.

fn main() {
    // Item is a &str, Address is a String
    let d1 = Delivery {
        item: "Pizza",
        address: String::from("123 Main St"),
    };
    
    // Item is an i32 (package ID), Address is an i32 (zip code)
    let d2 = Delivery {
        item: 9942,
        address: 90210,
    };
}
```

> [!check]- Answer
> ```rust
> // By declaring <T, U>, we allow the two fields to be different types!
> struct Delivery<T, U> {
>     item: T,
>     address: U,
> }
> ```

---

### Exercise 2: Generic Struct with Trait Bounds

**Problem:** Create `struct Wrapper<T> { value: T }` with a method `fn print(&self) where T: std::fmt::Display`.

**Expected output:**
```
Value: 42
```

> [!check]- Answer
> ```rust
> struct Wrapper<T> { value: T }
> impl<T> Wrapper<T> {
>     fn print(&self) where T: std::fmt::Display {
>         println!("Value: {}", self.value);
>     }
> }
> fn main() {
>     let w = Wrapper { value: 42 };
>     w.print();
> }
> ```
>
> **Explanation:** Generic parameters allow code reuse across distinct types while enforcing trait contracts.

### Exercise 3: Generic Helper Functions

**Problem:** Write a generic function `fn swap_pair<T, U>(pair: (T, U)) -> (U, T)`.

**Expected output:**
```
Swapped: (world, 10)
```

> [!check]- Answer
> fn swap_pair<T, U>(pair: (T, U)) -> (U, T) { (pair.1, pair.0) }
> fn main() {
>     let p = swap_pair((10, "world"));
>     println!("Swapped: ({:?}, {:?})", p.0, p.1);
> }
> ```
>
> **Explanation:** Generic functions operate polymorphically across multiple type arguments.

---

## 6. Related Terms

- [Trait Bounds](../level_04/trait_bound.md) — The way we restrict what `<T>` is allowed to be (e.g., "T must be something that can be added together").
- [Monomorphization](../level_04/monomorphization.md) — The terrifying-sounding but incredibly awesome way the compiler physically implements Generics under the hood without losing performance.

---

## 7. Key Takeaways

- Generics allow you to write reusable, deduplicated code by using placeholder types (usually `<T>`).
- You can use Generics in functions, structs, enums (`Option<T>`), and methods.
- You can use multiple generic types at once by separating them with commas: `<T, U, V>`.
- Generics are strictly checked at compile-time, meaning you get the flexibility of dynamic typing with the absolute safety of static typing.
