# `Copy` Trait

> **Level 3 — Ownership & Borrowing**
> Types implementing `Copy` (e.g. integers, `bool`) are bitwise-copied instead of moved.

---

## 1. Prerequisites

- [Ownership](../level_03/ownership.md) — The system that `Copy` types bypass.
- [Move Semantics](../level_03/move_semantics.md) — The default behavior of assignment that invalidates old variables.
- [Scalar Types](../level_01/scalar_types.md) — The simple, stack-only data types that automatically implement `Copy`.

---

## 2. Term Category

**Rust-specific (the exception to the rule)**: While all languages copy primitive integers, Rust formalizes this exception to its strict Ownership rules by using a "Trait" (an interface marker). The `Copy` trait tells the compiler to silently duplicate the data instead of Moving it.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The default behavior in Rust is to **Move** data. If you write `let b = a;`, the variable `a` is invalidated. This is incredibly smart for a 1GB `String` on the Heap, because deep copying 1GB of data implicitly would kill performance.

But what if `a` is just an `i32` integer? An `i32` is a tiny, fixed size (4 bytes) that lives entirely on the fast Stack memory. Moving an `i32` and forcing the programmer to type `.clone()` every time they want to reuse a number would be agonizing to write and completely unnecessary for performance. 

Rust solves this with the **`Copy` trait**. If a type is marked with `Copy`, the compiler knows it is so small and simple that copying it is basically free. When you assign it to a new variable, the compiler silently creates a perfect "bitwise copy". The new variable gets the copy, and the old variable remains perfectly valid!

### (2) Reality Metaphor

Imagine handing over an item to your friend.

If the item is the original **Mona Lisa painting** (`String` / Heap data), handing it to your friend means you no longer have it. It was **Moved**.

If the item is a **two-item grocery list** written on a post-it note (`i32` / Stack data), you don't actually hand over your original note. You just grab a blank post-it, instantly scribble the two items down, and hand them the *copy*. You both now have independent lists. This is the **`Copy` trait**.

### (3) Rust Code Examples

#### Short Snippet (Move vs Copy)
```rust
fn main() {
    // String DOES NOT implement Copy (It lives on the Heap)
    let s1 = String::from("Mona Lisa");
    let s2 = s1; // MOVED!
    // println!("{}", s1); // ERROR: s1 is dead.

    // i32 DOES implement Copy (It lives on the Stack)
    let n1 = 42;
    let n2 = n1; // COPIED!
    println!("I can still print n1: {}", n1); // SUCCESS: n1 is alive!
    println!("And I can print n2: {}", n2);
}
```

#### Fuller Example (Custom Copy Structs)
By default, custom `struct`s do **not** implement `Copy`. If you want a struct to be copyable, you must explicitly ask the compiler to add it using the `#[derive(Copy, Clone)]` macro. 

*Note: In Rust, to have `Copy`, you must also derive `Clone`.*
```rust
// We tell the compiler: "Please make this copyable!"
#[derive(Copy, Clone)]
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p1 = Point { x: 5, y: 10 };
    
    // Because of the derive macro, this is a COPY, not a move!
    let p2 = p1; 
    
    println!("p1 still exists! p1.x = {}", p1.x);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Copy Trait Scoping and Lifecycle Rules

**The mistake:** Assuming Copy Trait instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("copy_trait_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("copy_trait_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Copy Trait State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Copy Trait through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Copy Trait Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Copy Trait instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Broken Rectangle

**Problem:** The code below attempts to calculate the area of a rectangle twice. However, it fails with a `borrow of moved value` error because `Rectangle` is moved into the first `calc_area` function. Fix the code by modifying the struct definition so it is copied instead.

```rust
// TODO: Fix this struct definition!
struct Rectangle {
    width: u32,
    height: u32,
}

fn calc_area(rect: Rectangle) -> u32 {
    rect.width * rect.height
}

fn main() {
    let my_rect = Rectangle { width: 10, height: 5 };
    
    println!("First check: {}", calc_area(my_rect));
    
    // This line currently crashes!
    println!("Second check: {}", calc_area(my_rect)); 
}
```

> [!check]- Answer
> Simply add `#[derive(Copy, Clone)]` to the line directly above `struct Rectangle`. Because `u32` is copyable, the whole struct can become copyable!

---

### Exercise 2: Deriving Copy on Small Value Structs

**Problem:** Derive `Copy` and `Clone` on `struct Coordinate { x: f64, y: f64 }` and demonstrate implicit copy on assignment.

**Expected output:**
> [!check]- Answer
> ```
> Original: (1, 2), Copy: (1, 2)
> ```
> ```rust
> #[derive(Copy, Clone, Debug)]
> struct Coordinate { x: f64, y: f64 }
> fn main() {
>     let c1 = Coordinate { x: 1.0, y: 2.0 };
>     let c2 = c1; // Bitwise copy
>     println!("Original: ({}, {}), Copy: ({}, {})", c1.x, c1.y, c2.x, c2.y);
> }
> ```
>
> **Explanation:** `Copy` types are implicitly duplicated via bitwise stack copies without moving ownership.

---

### Exercise 3: Function Call Semantics with Copy Types

**Problem:** Pass a `Copy` struct to a function by value and verify the caller retains ownership.

**Expected output:**
> [!check]- Answer
> ```
> Caller retained: 42
> ```
> ```rust
> #[derive(Copy, Clone)]
> struct Data(i32);
> fn consume(d: Data) { let _ = d.0; }
> fn main() {
>     let val = Data(42);
>     consume(val);
>     println!("Caller retained: {}", val.0);
> }
> ```
>
> **Explanation:** Passing `Copy` parameters to functions implicitly copies stack bytes, preserving original variable bindings.

---

## 6. Related Terms

- [`Clone` Trait](../level_03/clone_trait.md) — The explicit, deep-copy equivalent for Heap data. You must type `.clone()` to use it.
- [Move Semantics](../level_03/move_semantics.md) — What happens to a variable if it *doesn't* have the `Copy` trait.
- [Traits](../level_04/trait.md) — (Future reference) The overarching system used to define shared interfaces and behaviors like `Copy` and `Clone`.

---

## 7. Key Takeaways

- **Move Semantics** are the default in Rust, but types marked with the **`Copy` trait** bypass this and are duplicated automatically.
- The original variable remains perfectly valid after assignment.
- All simple scalar types (`i32`, `f64`, `bool`, `char`) and fixed-size arrays of `Copy` types implement `Copy` by default.
- Heap-allocated types (`String`, `Vec`) do **not** implement `Copy`.
- You can make your own `struct` copyable by adding `#[derive(Copy, Clone)]` above it, as long as all its fields are also copyable.
