# Variable

> **Level 1 — Foundations**
> A named binding declared with `let`. Immutable by default in Rust.

---

## 1. Prerequisites

None.

---

## 2. Term Category

**Rust-nonspecific**: A general programming concept (Variables).

---

## 3. Explanation

### (1) Design Motivation — "Why does this exist in programming languages?"

In any program, you need a way to store data, retrieve it, and perform calculations on it. Without a way to temporarily store information in memory, programming would be impossible. Variables solve this fundamental problem by giving a human-readable name to a specific location in memory.

While almost every programming language has variables, Rust's take is deliberately restrictive for the sake of safety. In languages like JavaScript or Python, variables can be changed (mutated) at any time by default. In Rust, a variable declared with the `let` keyword is **immutable** by default. This means once a value is bound to a name, it cannot be changed. Rust's designers made this choice because code with fewer moving parts is easier to reason about, and preventing accidental data mutations eliminates entire classes of bugs (especially in multi-threaded programs).

### (2) Reality Metaphor

Think of a variable as a **labeled storage box**. 

When you use the `let` keyword, you are taking a box, writing a name on the outside (like "apples"), putting a value inside (like `5`), and then sealing the box with heavy-duty tape. If you try to open the box later and swap the `5` for a `10`, the Rust compiler (acting as a strict warehouse manager) will stop you and say, "Hey! You didn't tell me this box was allowed to be reopened!" 

### (3) Rust Code Examples

#### Short Snippet
```rust
// Declaring a variable named `greeting` and binding it to a string.
let greeting = "Hello, Rust!";
println!("{}", greeting);
```

#### Fuller Example
```rust
fn main() {
    // The compiler automatically figures out (infers) that this is an integer.
    let user_age = 25;
    
    // We can use the variable in a formatted string.
    println!("The user is {} years old.", user_age);
    
    // If we uncomment the next line, the program WILL NOT COMPILE.
    // user_age = 26; // ERROR: cannot assign twice to immutable variable
    
    // Variables can be explicitly typed if needed.
    let active_score: i32 = 100;
    println!("Score: {}", active_score);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to reassign an immutable variable

**The mistake:** Attempting to change the value of a variable declared with just `let`.

**Why it's wrong:** Rust strictly enforces immutability by default. If you need a variable to change, you must explicitly opt-in by using the `mut` keyword (e.g., `let mut score = 0;`).

*Incorrect:*
```rust
let health = 100;
health = 90; // The compiler will reject this
```

*Fix:*
```rust
// (We will cover `mut` in detail in the next term document)
let mut health = 100;
health = 90;
```

### Mistake 2: Using an uninitialized variable

**The mistake:** Declaring a variable but trying to use it before assigning a value to it.

**Why it's wrong:** Some languages initialize empty variables to `null` or `undefined`. Rust does not have a concept of `null` in this way and strictly requires every variable to hold valid data before it is read, preventing unexpected behavior and memory issues.

*Incorrect:*
```rust
let x: i32;
println!("The value is {}", x); // ERROR: use of possibly-uninitialized `x`
```

*Fix:*
```rust
let x: i32;
x = 10;
println!("The value is {}", x); // This is perfectly fine
```

---

### Mistake 3: Concurrent Access to Variable Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Variable instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Declare and Print

**Problem:** Declare an immutable variable named `favorite_color`, assign it a string like `"blue"`, and print it to the console using `println!`.

**Expected output:**
> [!check]- Answer
> ```text
> My favorite color is blue
> ```
> - Use the `let` keyword to declare the variable.
> - Use `println!("My favorite color is {}", favorite_color);` to print it.

---

### Exercise 2: Conditional Variable Initialization

**Problem:** Declare an uninitialized variable `let result: &str;`, initialize it inside an `if/else` block, and print it after the block.

**Expected output:**
> [!check]- Answer
> ```
> Condition met: true
> ```
> ```rust
> fn main() {
>     let condition = true;
>     let result: &str;
>     if condition {
>         result = "Condition met: true";
>     } else {
>         result = "Condition met: false";
>     }
>     println!("{}", result);
> }
> ```
>
> **Explanation:** Rust's compiler verifies that every execution path assigns a value to `result` before it is read.

---

### Exercise 3: Variable Scope & Drop Lifetime

**Problem:** Demonstrate that a variable `x` created inside an inner block `{ let x = 10; }` cannot be accessed outside that block.

**Expected output:**
> [!check]- Answer
> ```
> Inside: 10
> ```
> ```rust
> fn main() {
>     {
>         let x = 10;
>         println!("Inside: {}", x);
>     }
>     // Outside x is out of scope and dropped
> }
> ```
>
> **Explanation:** Variables in Rust live only for the duration of the lexical scope block (`{}`) in which they are declared.

---

## 6. Related Terms

- [Mutability (`mut`)](../level_01/mutability_mut.md) — How to explicitly allow a variable to be changed.
- [Type Inference](../level_01/type_inference.md) — How Rust automatically determines a variable's type.
- [Shadowing](../level_01/shadowing.md) — Reusing a variable name in the same scope to create a new binding.
- [Constants (`const`)](../level_01/constants_const.md) — Values that are inherently immutable and evaluated at compile time.

---

## 7. Key Takeaways

- Variables are declared using the `let` keyword.
- By default, variables in Rust are **immutable** (they cannot be changed after assignment).
- The compiler can usually infer the type of a variable, but you can add explicit type annotations if needed.
- A variable must be initialized with a value before it is used.
