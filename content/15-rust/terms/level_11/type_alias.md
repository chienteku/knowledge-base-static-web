# Type Alias

> **Level 11 — Smart Pointers & Advanced Types**
> `type Kilometers = i32;` — creates an alias, not a distinct type.

---

## 1. Prerequisites

- [Newtype Pattern](../level_11/newtype_pattern.md) — The strict, safe alternative to Type Aliases.
- [Result Enum](../level_02/result_t_e.md) — The most common place Type Aliases are used in the standard library.

---

## 2. Term Category

**Rust Syntax (the nickname generator)**: A Type Alias is a way to give a new name (a nickname) to an existing type. 

Unlike the Newtype Pattern (which creates a brand new, mathematically distinct struct), a Type Alias creates an identical clone of the name. If you make `type Kilometers = i32`, the compiler treats `Kilometers` and `i32` as exactly the same thing. You can use them interchangeably.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In Rust, types can get horrifyingly long. If you are building an advanced server, you might have a variable with a type like `Rc<RefCell<HashMap<String, Vec<Box<dyn std::error::Error>>>>>`. 

Typing that out in 15 different function signatures is an absolute nightmare. 

A Type Alias allows you to write `type ErrorMap = Rc<RefCell<...>>` once at the top of the file, and then just use `ErrorMap` everywhere else. It is purely for code readability and typing convenience.

### (2) Reality Metaphor

- **Newtype Pattern (`struct`)**: You legally change your name to a new identity. Your old driver's license no longer works. The bouncer at the club rejects your old ID. (A strictly new, distinct type).
- **Type Alias (`type`)**: Your name is William, but your friends call you "Bill". Both "William" and "Bill" refer to the exact same person. If a bouncer checks a VIP list for "William", and you say "I'm Bill", the bouncer lets you in because they are just aliases for the same thing!

### (3) Rust Code Examples

#### Short Snippet (Zero Type Safety)
Notice how `walk` asks for `Kilometers`, but we can just pass in a raw `i32` and the compiler doesn't care at all!

```rust
// Create a Type Alias (a nickname)
type Kilometers = i32;

fn walk(distance: Kilometers) {
    println!("Walking {} units!", distance);
}

fn main() {
    let x: i32 = 5;
    let y: Kilometers = 10;
    
    walk(x); // SUCCESS! i32 is accepted!
    walk(y); // SUCCESS!
}
```

#### Fuller Example (The Standard Library `Result` Pattern)
The Rust Standard Library uses Type Aliases everywhere to clean up code! 

If you use the `std::io` module, you will notice that almost every function returns `std::io::Result<T>`. But wait, doesn't `Result` require two generics? `Result<T, E>`? 

Yes! But the standard library created a Type Alias to hardcode the error type, saving you from typing `std::io::Error` 100 times! You can do the same in your own projects:

```rust
// We define our massive, custom Error enum
enum ServerError {
    DatabaseCrash,
    NetworkTimeout,
    InvalidUser,
}

// We create a Type Alias so we don't have to type out `ServerError` ever again!
type ServerResult<T> = Result<T, ServerError>;

// Now our function signatures are incredibly clean!
fn get_user() -> ServerResult<String> {
    Ok("Alice".to_string())
}

fn fetch_data() -> ServerResult<i32> {
    Err(ServerError::NetworkTimeout)
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Type Alias Scoping and Lifecycle Rules

**The mistake:** Assuming Type Alias instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("type_alias_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("type_alias_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Type Alias State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Type Alias through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Type Alias Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Type Alias instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Choice

**Problem:** You are building a physics engine. You want to make sure developers never accidentally pass `Miles` into a function that calculates physics using `Kilometers`. Which feature should you use?

A) `type Kilometers = f64;`
B) `struct Kilometers(f64);`

> [!check]- Answer
> **B) The Newtype Pattern (`struct Kilometers(f64)`)**.
>
> The Type Alias (Option A) provides absolutely no safety. The compiler would allow a developer to pass `Miles` (which is also just an `f64`) into a `Kilometers` function, crashing your spaceship into Mars.

---

### Exercise 2: Simplifying Complex Result Signatures with Type Aliases

**Problem:** Create a type alias `type Result<T> = std::result::Result<T, MyError>;`.

**Expected output:**
> [!check]- Answer
> ```
> Type alias result verified
> ```
> ```rust
> type Result<T> = std::result::Result<T, &'static str>;
> fn compute() -> Result<i32> { Ok(42) }
> fn main() {
>     if let Ok(val) = compute() {
>         println!("Type alias result verified: {}", val);
>     }
> }
> ```
>
> **Explanation:** Type aliases reduce repetitive generic parameter boilerplate in function signatures.

---

### Exercise 3: Type Alias for Function Pointers

**Problem:** Define `type Callback = fn(i32) -> i32;` and use it in function signatures.

**Expected output:**
> [!check]- Answer
> ```
> Callback result: 20
> ```
> ```rust
> type Callback = fn(i32) -> i32;
> fn run(val: i32, cb: Callback) -> i32 { cb(val) }
> fn main() {
>     println!("Callback result: {}", run(10, |x| x * 2));
> }
> ```
>
> **Explanation:** Type aliases clean up complex function pointer type declarations.

---

## 6. Related Terms

- [Newtype Pattern](../level_11/newtype_pattern.md) — The strict, safe alternative to a Type Alias.
- [Result Enum](../level_02/result_t_e.md) — The most common place type aliases are used in the standard library (`std::io::Result`).

---

## 7. Key Takeaways

- A **Type Alias** uses the `type Name = OriginalType;` syntax to create a nickname for an existing type.
- It is used purely to shorten painfully long type signatures (like `Rc<RefCell<Vec<T>>>`) to make code readable.
- It does **not** create a new type! The compiler treats the alias and the original type as 100% identical and interchangeable.
- It provides **zero type safety**. To enforce strict mathematical or security boundaries, use the Newtype Pattern instead!
