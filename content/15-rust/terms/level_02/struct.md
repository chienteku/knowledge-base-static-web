# Struct

> **Level 2 — Control Flow & Data Structures**
> A custom data type grouping named fields (`struct Point { x: f64, y: f64 }`).

---

## 1. Prerequisites

- [Variable](../level_01/variable.md) — You bind an instance of a struct to a variable using `let`.
- [Compound Types](../level_01/compound_types.md) — Structs are essentially Tuples where every piece of data has a strict name.

---

## 2. Term Category

**Rust-nonspecific**: Structs (short for structures) exist in many languages like C, C++, and Go. In Rust, they are the primary way to define custom data types and serve as the replacement for "Classes" found in Object-Oriented languages like Java or Python.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

When building applications, you constantly need to group related pieces of data together. For example, if you want to represent a "User", you could use a standard Tuple: `("Alice", "Smith", 28)`. But accessing data via `user.0`, `user.1`, and `user.2` is confusing. If you accidentally swap the first and last name, the compiler won't catch it.

A **Struct** solves this problem. It allows you to create a brand new, custom data type where every piece of data is neatly organized into a named **field**. Instead of `user.0`, you get to write `user.first_name` and `user.age`. This makes your code infinitely more readable, maintainable, and type-safe.

Note: Rust does not have traditional "Classes". Instead, Rust separates data from behavior. You use **Structs** to define the data, and later you will learn to use [`impl` Blocks](../level_02/impl_block.md) to define the behavior (methods).

### (2) Reality Metaphor

A Struct is like a **Custom DMV Form**. 

When you apply for a driver's license, they don't hand you a blank piece of paper and say "write down your information." They give you a specifically designed form with labeled boxes: "First Name", "Date of Birth", and "Eye Color". 

Defining a `struct` is like creating the **blueprint** for that blank form. Creating an *instance* of a struct is like filling out that form with your specific personal information and handing it back.

### (3) Rust Code Examples

#### Short Snippet (Definition and Instantiation)
```rust
// 1. Define the blueprint (the Struct)
struct User {
    username: String,
    age: u32,
    active: bool,
}

fn main() {
    // 2. Create an instance (fill out the form)
    let my_user = User {
        username: String::from("maverick"),
        age: 32,
        active: true,
    }; // Don't forget the semicolon here!

    // 3. Access fields using dot notation
    println!("User {} is {} years old.", my_user.username, my_user.age);
}
```

#### Fuller Example (Mutability and Update Syntax)
```rust
struct Point {
    x: f64,
    y: f64,
}

fn main() {
    // To change a field, the ENTIRE struct instance must be mutable.
    let mut location = Point { x: 0.0, y: 0.0 };
    
    // We can now update the fields
    location.x = 10.5;
    location.y = 20.0;
    
    // "Struct Update Syntax"
    // We can quickly create a new struct by copying the fields of an old one.
    // We override `y`, but copy `x` from `location`.
    let new_location = Point {
        y: 50.0,
        ..location
    };
    
    println!("New location: ({}, {})", new_location.x, new_location.y);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Struct Scoping and Lifecycle Rules

**The mistake:** Assuming Struct instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("struct_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("struct_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Struct State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Struct through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Struct Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Struct instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Build a Rectangle

**Problem:** Define a `Rectangle` struct that has two fields: `width` and `height`, both of type `u32`. Then, inside `main`, create an instance of that rectangle with a width of 30 and a height of 50. 

```rust
// TODO: Define the Rectangle struct here

fn main() {
    // TODO: Create an instance named `rect` here
    
    println!("The rectangle is {} by {}", rect.width, rect.height);
}
```

**Expected output:**
> [!check]- Answer
> ```text
> The rectangle is 30 by 50
> ```
> ```rust
> struct Rectangle {
>     width: u32,
>     height: u32,
> }
> // Inside main:
> let rect = Rectangle { width: 30, height: 50 };
> ```

---

### Exercise 2: Struct Update Syntax Usage

**Problem:** Create `User { name, email, active: true }`. Construct `user2` with a different name using `..user1` update syntax.

**Expected output:**
> [!check]- Answer
> ```
> User2 email: alice@example.com
> ```
> ```rust
> struct User { name: String, email: String, active: bool }
> fn main() {
>     let u1 = User { name: "Alice".into(), email: "alice@example.com".into(), active: true };
>     let u2 = User { name: "Bob".into(), ..u1 };
>     println!("User2 email: {}", u2.email);
> }
> ```
>
> **Explanation:** `..u1` copies or moves remaining unassigned fields from `u1` into the new struct instance.

---

### Exercise 3: Field Init Shorthand

**Problem:** Construct a struct `Point { x, y }` using field init shorthand when local variable names match struct field names.

**Expected output:**
> [!check]- Answer
> ```
> Point: 10, 20
> ```
> ```rust
> struct Point { x: i32, y: i32 }
> fn main() {
>     let x = 10;
>     let y = 20;
>     let p = Point { x, y };
>     println!("Point: {}, {}", p.x, p.y);
> }
> ```
>
> **Explanation:** Field initialization shorthand `Point { x, y }` avoids redundant `x: x` repetition.

---

## 6. Related Terms

- [Tuple Struct](../level_02/tuple_struct.md) — A specialized struct that has a name, but its fields do not (they are accessed via `.0`, `.1`).
- [`impl` Block](../level_02/impl_block.md) — The mechanism you use to attach functions and methods directly to a struct.

---

## 7. Key Takeaways

- Use `struct` to group related data into named fields (Rust's version of a Data Class).
- Access data fields using dot notation (e.g., `user.username`).
- **Mutability is all-or-nothing.** You must declare the instance as `let mut` to modify any of its fields.
- You can easily construct a new instance based on an existing one using struct update syntax (`..old_instance`).
