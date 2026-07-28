# Unit Type (`()`)

> **Level 1 — Foundations**
> The "nothing" type, taking 0 bytes. Implicitly returned when there is no other value.

---

## 1. Prerequisites

- [`fn`](../level_01/fn.md) — Functions that don't specify a return type implicitly return `()`.
- [Statements](../level_01/statements.md) — Statements in Rust evaluate to the Unit Type `()`.
- [Expressions](../level_01/expressions.md) — If you add a semicolon to an expression, it turns into a statement and returns `()` instead of its actual value.

---

## 2. Term Category

**Rust-specific (the explicitness)**: In languages like C, Java, or C++, a function that returns nothing is marked with the keyword `void`. In Rust, there is no `void`. Instead, functions that "return nothing" actually return a concrete type: the Unit Type `()`, which takes up exactly zero bytes of memory.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In programming language design, treating "functions that return a value" and "functions that return nothing" as two completely different concepts causes massive headaches—especially when building Generic types (code that can accept *any* type). 

Rust's designers unified this by ensuring that **every single block of code and every single function in Rust returns *something***. 

If a function doesn't have a meaningful value to return, it simply returns the Unit Type `()`. Because it takes exactly 0 bytes of memory, there is absolutely no performance penalty. But because it is a real type, the mathematical consistency of Rust's compiler is preserved. No special `void` rules are needed!

### (2) Reality Metaphor

The Unit Type is like an **Empty Receipt**.

If you go to the store and buy an apple, the cashier hands you an apple (a concrete value, like an `i32`). 

If you go to the store, ask the cashier for directions, and leave without buying anything, they don't give you an apple. Instead, imagine they print out a completely blank receipt and hand it to you. This is the Unit Type `()`. 

The blank receipt has zero monetary value and takes up zero space in your pocket. However, it serves as physical proof to the universe that your interaction with the cashier completed successfully. 

### (3) Rust Code Examples

#### Short Snippet (Implicit Return)
```rust
// These two function signatures mean the EXACT same thing.
// If you don't specify a return type, Rust assumes `-> ()`
fn do_nothing() {
    println!("I return nothing!");
}

fn do_nothing_explicit() -> () {
    println!("I also return nothing!");
}
```

#### Fuller Example (The Semicolon Effect)
```rust
fn main() {
    // A block expression evaluates to its last line.
    // Because `5 + 5` has no semicolon, this block evaluates to `10`.
    let a: i32 = {
        5 + 5
    };

    // Because we added a semicolon to the end of `5 + 5;`, it becomes a Statement.
    // Statements evaluate to `()`. 
    // Therefore, `b` is assigned the Unit Type.
    let b: () = {
        5 + 5; 
    };

    println!("Value of a: {}", a);
    println!("Value of b is the unit type, which prints as: {:?}", b);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Accidental Semicolons

**The mistake:** Trying to return a value from a function, but putting a semicolon `;` at the end of the line.

**Why it's wrong:** As shown in the example above, a semicolon suppresses the value of an expression and turns it into `()`. If your function signature promises to return an `i32`, but you return `()`, the compiler will throw a `mismatched types` error.

*Incorrect:*
```rust
fn add_one(x: i32) -> i32 {
    x + 1; // ERROR: expected `i32`, found `()`
}
```

*Fix:*
```rust
fn add_one(x: i32) -> i32 {
    x + 1 // Remove the semicolon!
}
```

### Mistake 2: Mutating Unit Type State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Unit Type through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Unit Type Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Unit Type instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Accidental Receipt

**Problem:** The function below is supposed to return the user's score, but it currently won't compile because it is returning the Unit Type `()` instead. Fix the code so it returns the score properly.

```rust
fn get_score() -> i32 {
    let score = 100;
    score; // TODO: Fix this line!
}

fn main() {
    println!("Score: {}", get_score());
}
```

**Expected output:**
> [!check]- Answer
> ```text
> Score: 100
> ```
> - The semicolon at the end of `score;` turns it into a statement that returns `()`.
> - Remove the semicolon to make it an expression that returns its value!

---

### Exercise 2: Unit Type in Generic Result Containers

**Problem:** Write a function `fn process_data() -> Result<(), String>` that returns `Ok(())` on success.

**Expected output:**
> [!check]- Answer
> ```
> Data processed successfully
> ```
> ```rust
> fn process_data() -> Result<(), String> {
>     println!("Data processed successfully");
>     Ok(())
> }
> fn main() {
>     let _ = process_data();
> }
> ```
>
> **Explanation:** In Rust APIs, `Result<(), Error>` signals operations that perform side effects without yielding a meaningful data value on success.

---

### Exercise 3: Using Unit as Map Set Value

**Problem:** Create a `std::collections::HashMap<String, ()>` to store unique keys, inserting `"key1"` with `()` as value.

**Expected output:**
> [!check]- Answer
> ```
> Key present: true
> ```
> ```rust
> use std::collections::HashMap;
> fn main() {
>     let mut set_map: HashMap<String, ()> = HashMap::new();
>     set_map.insert("key1".to_string(), ());
>     println!("Key present: {}", set_map.contains_key("key1"));
> }
> ```
>
> **Explanation:** The zero-sized unit type `()` takes up 0 bytes of memory, allowing `HashMap<K, ()>` to behave as a memory-efficient set.

---

## 6. Related Terms

- [Unit Struct](../level_02/unit_struct.md) — A custom struct you define that behaves exactly like the built-in Unit Type (taking up 0 bytes).
- [Statements](../level_01/statements.md) — The fundamental building blocks that always evaluate to `()`.

---

## 7. Key Takeaways

- Rust does not have a `void` keyword.
- Functions that don't return data implicitly return the **Unit Type `()`**.
- It is a concrete type that takes up exactly **0 bytes** of memory.
- Adding a semicolon `;` to the end of an expression suppresses its value and evaluates to `()`. This is the #1 cause of "mismatched types: expected X, found `()`" compiler errors.
