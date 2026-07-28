# Macros

> **Level 1 — Foundations**
> Code that writes code, denoted by a trailing `!`.

---

## 1. Prerequisites

- [`fn`](../level_01/fn.md) — The standard way to write reusable code in Rust.
- [`println!` / `format!`](../level_01/println_format.md) — The most common macros you will use every day.

---

## 2. Term Category

**Rust-specific (the meta-programming tool)**: In many languages, functions are flexible enough to take any number of arguments of any type. In Rust, functions are extremely strict. To achieve flexibility (like a `println!` that can take 1 or 10 arguments), Rust relies on Macros: specialized code that literally writes standard Rust code for you before compilation.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In Rust, a standard `fn` has a fixed number of arguments, and those arguments have strict, fixed types. 

But what if you want to write a function like `println!`? Sometimes you want to print 1 string. Sometimes you want to print 1 string and 5 integers. A standard Rust function literally *cannot* do this. 

To solve this, Rust uses **Macros**. A macro is not a function. It is a set of rules for **writing code**. When you type a macro (denoted by the `!`), you are telling the compiler: *"Hey, before you compile this program, look at the arguments I passed here, and automatically generate the massive amount of boilerplate Rust code needed to make it work."*

### (2) Reality Metaphor

Imagine a standard **function** is a chef cooking a recipe. You hand the chef exactly 3 specific ingredients (arguments), and the chef bakes exactly 1 cake.

A **macro** is the architect who built the kitchen. You tell the architect, *"I need to bake 100 cakes at once,"* and the architect dynamically builds you a massive, custom-designed kitchen with 100 ovens *before* the chef even arrives to start cooking. 

### (3) Rust Code Examples

#### Short Snippet (The Expansion)
You use the `vec!` macro to easily create a new `Vec` containing items.
```rust
fn main() {
    // We write 1 line using a Macro:
    let my_list = vec![1, 2, 3];
    
    // During compilation, the Macro automatically expands it into this boilerplate for us:
    /*
    let mut temp = Vec::new();
    temp.push(1);
    temp.push(2);
    temp.push(3);
    let my_list = temp;
    */
}
```

#### Fuller Example (Variable Arguments)
Macros allow you to pass a variable number of arguments, which is impossible with a standard `fn`.
```rust
fn main() {
    // 1 argument
    println!("Hello!"); 
    
    // 3 arguments of completely different types!
    println!("Hello {}! You are {} years old.", "Alice", 30); 
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Macros Scoping and Lifecycle Rules

**The mistake:** Assuming Macros instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("macros_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("macros_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Macros State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Macros through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Macros Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Macros instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Spot the Macro

**Problem:** Look at the code below. Identify which calls are macros and which are standard functions.

```rust
fn main() {
    let name = String::from("Bob");
    let numbers = vec![10, 20];
    println!("Name: {}", name);
    numbers.len();
}
```

> [!check]- Answer
> - `String::from` is a **function** (no `!`).
> - `vec!` is a **macro**.
> - `println!` is a **macro**.
> - `numbers.len()` is a **function** (method).

---

### Exercise 2: Creating a Custom String Vector Macro

**Problem:** Write a macro `string_vec!["a", "b", "c"]` that constructs a `Vec<String>` from `&str` literals.

**Expected output:**
> [!check]- Answer
> ```
> ["a", "b", "c"]
> ```
> ```rust
> macro_rules! string_vec {
>     ( $( $x:expr ),* ) => {{
>         let mut v = Vec::new();
>         $( v.push(String::from($x)); )*
>         v
>     }};
> }
> fn main() {
>     let v = string_vec!["a", "b", "c"];
>     println!("{:?}", v);
> }
> ```
>
> **Explanation:** Macro repetition `$( v.push(...); )*` expands the enclosed statement once for every matching expression provided in the macro call.

---

### Exercise 3: Macro Pattern Overloading

**Problem:** Define a macro `calculate!` with two matcher branches: one for `calculate!(add a b)` and one for `calculate!(sub a b)`.

**Expected output:**
> [!check]- Answer
> ```
> 15
> 5
> ```
> ```rust
> macro_rules! calculate {
>     (add $a:expr $b:expr) => { $a + $b };
>     (sub $a:expr $b:expr) => { $a - $b };
> }
> fn main() {
>     println!("{}", calculate!(add 10 5));
>     println!("{}", calculate!(sub 10 5));
> }
> ```
>
> **Explanation:** `macro_rules!` attempts pattern matching against rule arms sequentially from top to bottom.

---

## 6. Related Terms

- [`println!` / `format!`](../level_01/println_format.md) — The most common macros in Rust.
- [`panic!`](../level_04/panic.md) — The macro used to crash the program on an unrecoverable error.
- **[Derive Macros](../level_12/derive_macros.md)** — A special type of macro written as `#[derive(Debug)]` above a struct to automatically generate implementation code.

---

## 7. Key Takeaways

- Macros are "code that writes code".
- They are expanded into actual Rust boilerplate code *before* the program is compiled.
- You can spot them because they always end with an exclamation mark (`!`).
- They allow you to write operations that take a variable number of arguments (like `println!`) or generate massive amounts of boilerplate safely (like `vec!`).
