# Custom Error Types

> **Level 4 — Error Handling & Generics**
> Defining your own error enums/structs that implement `std::error::Error`.

---

## 1. Prerequisites

- [`Result<T, E>`](../level_02/result_t_e.md) — The wrapper where our custom errors will live (the `E` part).
- [Enum](../level_02/enum.md) — The primary data structure used to build custom errors.
- [`?` Operator](../level_04/question_mark_operator.md) — The tool used to propagate these errors.

---

## 2. Term Category

**Rust-specific (the domain-driven design)**: In dynamic languages like Python or JavaScript, you usually just "throw" a generic Exception or an error string. In Rust, errors are strictly typed, domain-specific data structures that give the compiler (and the caller) exact information about what went wrong.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

When building an application, functions fail for very specific reasons. A user login attempt might fail because:
1. The username doesn't exist.
2. The password was incorrect.
3. The database server is currently offline.

If your function just returns `Result<User, String>` where the `String` is `"Login failed"`, that is terrible design. The caller has no idea *why* it failed unless they try to parse the text of the string!

To solve this, Rust encourages us to create **Custom Error Types** using `enum`. By creating a `LoginError` enum with those three specific variants, the caller can `match` on the exact error and execute perfect recovery logic (e.g., prompt the user to try again, or page the DevOps team that the database is down).

### (2) Reality Metaphor

Imagine a doctor calling you to give you the results of a blood test. 

If they just say *"You are sick"* (returning a generic `String` error), you have no idea what is wrong. Do you have a mild cold, or a terminal illness? You don't know what medicine to take to recover.

A **Custom Error Type** is the doctor giving you an exact diagnosis (`Diagnosis::StrepThroat`). Because you have an exact, categorized error, you know exactly what happened, and exactly what antibiotics (recovery logic) to use.

### (3) Rust Code Examples

#### Short Snippet (The Basic Enum)
The simplest way to make a custom error is just to define an enum and stick it inside a `Result`.

```rust
// 1. Define the exact ways this domain can fail
enum MathError {
    DivideByZero,
    NegativeSquareRoot,
}

// 2. Use our custom type in the `Err` slot of the Result
fn divide(a: f64, b: f64) -> Result<f64, MathError> {
    if b == 0.0 {
        return Err(MathError::DivideByZero);
    }
    Ok(a / b)
}
```

#### Fuller Example (The Idiomatic Boilerplate)
To make your error fully "idiomatic" (so it works perfectly with the rest of the Rust ecosystem), you must implement three traits: `Debug`, `Display`, and `std::error::Error`. 

*(Note: In the real world, nobody writes this boilerplate by hand. They use the `thiserror` crate to generate it automatically, which we will learn about soon!)*

```rust
use std::fmt;
use std::error::Error;

// 1. Must derive Debug
#[derive(Debug)]
enum LoginError {
    BadPassword,
    UserNotFound(String),
}

// 2. Must implement Display (how the error looks when printed to the user)
impl fmt::Display for LoginError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            LoginError::BadPassword => write!(f, "Incorrect password."),
            LoginError::UserNotFound(user) => write!(f, "User '{}' not found in database.", user),
        }
    }
}

// 3. Must implement the official Error trait (this is usually empty!)
impl Error for LoginError {}

fn main() {
    let err = LoginError::UserNotFound(String::from("alice_99"));
    
    // Now it prints beautifully!
    println!("Error occurred: {}", err);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Custom Error Types Scoping and Lifecycle Rules

**The mistake:** Assuming Custom Error Types instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("custom_error_types_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("custom_error_types_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Custom Error Types State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Custom Error Types through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Custom Error Types Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Custom Error Types instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Match the Recovery

**Problem:** You are calling a function that returns a custom `PaymentError`. Use a `match` statement to handle the error.
- If it's `InsufficientFunds`, print "Get a job."
- If it's `NetworkDown`, print "Retrying..."

```rust
enum PaymentError {
    InsufficientFunds,
    NetworkDown,
}

fn charge_card() -> Result<(), PaymentError> {
    Err(PaymentError::InsufficientFunds)
}

fn main() {
    let result = charge_card();
    
    // TODO: Write a match statement on `result` to handle the Ok and Err variants!
}
```

> [!check]- Answer
> ```rust
> match result {
>     Ok(_) => println!("Payment successful!"),
>     Err(PaymentError::InsufficientFunds) => println!("Get a job."),
>     Err(PaymentError::NetworkDown) => println!("Retrying..."),
> }
> ```

---

### Exercise 2: Building a Custom Enum Error

**Problem:** Define `enum DatabaseError { NotFound, PermissionDenied }`. Implement `Display` and `std::error::Error` for it.

**Expected output:**
```
Error: Record not found
```

> [!check]- Answer
> ```rust
> use std::fmt;
> #[derive(Debug)]
> enum DatabaseError { NotFound, PermissionDenied }
> impl fmt::Display for DatabaseError {
>     fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
>         match self {
>             DatabaseError::NotFound => write!(f, "Record not found"),
>             DatabaseError::PermissionDenied => write!(f, "Permission denied"),
>         }
>     }
> }
> impl std::error::Error for DatabaseError {}
> fn main() {
>     let err = DatabaseError::NotFound;
>     println!("Error: {}", err);
> }
> ```
>
> **Explanation:** Idiomatic custom error types implement `Debug`, `Display`, and `std::error::Error`.

### Exercise 3: Wrapping Lower-Level Errors with `From`

**Problem:** Implement `From<std::num::ParseIntError>` for custom `AppError` enum.

**Expected output:**
```
Wrapped parse error
```

> [!check]- Answer
> use std::num::ParseIntError;
> #[derive(Debug)]
> enum AppError { Parse(ParseIntError) }
> impl From<ParseIntError> for AppError {
>     fn from(err: ParseIntError) -> Self { AppError::Parse(err) }
> }
> fn main() {
>     println!("Wrapped parse error");
> }
> ```
>
> **Explanation:** Implementing `From` allows lower-level errors to automatically convert into custom domain error enums via `?`.

---

## 6. Related Terms

- [`anyhow` / `thiserror`](../level_04/anyhow_thiserror.md) — The wildly popular crates that automatically write all the tedious `Display` and `Error` boilerplate for you!
- [`From` / `Into` Traits](../level_04/from_into_traits.md) — The secret sauce that allows us to automatically convert standard library errors (like `io::Error`) into our Custom Error Types.

---

## 7. Key Takeaways

- You should almost **never use `String`** as an error type in a real application.
- Custom Errors are usually defined using an `enum` so you can list all the exact, specific ways your function can fail.
- A good custom error allows the caller to `match` the error and run different, specific recovery logic for different failures.
- For your custom error to be fully idiomatic, it must implement the `Debug`, `Display`, and `std::error::Error` traits.
