# `anyhow` / `thiserror`

> **Level 4 — Error Handling & Generics**
> Popular crates: `anyhow` for application-level errors; `thiserror` for library error types.

---

## 1. Prerequisites

- [Custom Error Types](../level_04/custom_error_types.md) — The boilerplate-heavy manual errors that these crates replace.
- [`From` / `Into` Traits](../level_04/from_into_traits.md) — The conversion logic that these crates automate.
- [`?` Operator](../level_04/question_mark_operator.md) — The tool used to propagate the errors these crates generate.

---

## 2. Term Category

**Rust-specific (the ecosystem standard)**: In Rust, the standard library provides the foundation for error handling, but the community has universally adopted these two third-party crates to remove boilerplate and make error handling joyful. They were both created by David Tolnay, a legendary Rust developer.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In the previous terms, we saw that creating a fully idiomatic Custom Error requires writing a massive amount of boilerplate. You have to implement `Debug`, implement `Display` (with a giant `match` statement), implement `std::error::Error`, and write a `From` implementation for *every single external error type* you want to automatically convert with `?`. 

Developers hated writing this. It slowed down development. To fix this forever, the community built two distinct tools:
1. **`thiserror`**: A macro that writes all the `Display`, `Error`, and `From` boilerplate for your custom `enum`s automatically.
2. **`anyhow`**: A magical `Result` type that can secretly hold *literally any error in the universe*, meaning you don't even have to write a custom enum at all!

### (2) Reality Metaphor

Imagine you run a commercial bakery. 

- **`thiserror` is the Customer Menu.** If you are selling to customers, you need a precise menu of exact cupcakes so customers know exactly what they are buying. `thiserror` automatically prints the precise labels for your custom variants. You use `thiserror` when writing **Libraries** because other developers (your customers) need to know exactly what errors your library returns so they can write recovery logic.
- **`anyhow` is the Manager's Incident Report.** In the back office, if a pipe bursts or the oven explodes, the manager doesn't care about a "precise enum menu" of failures. They just want a generic "Something went wrong: The oven exploded" report to log it and close the store. You use `anyhow` when writing **Applications** (executables) because you just want to catch *any* error, print it, and gracefully crash without spending time defining a thousand custom enums.

### (3) Rust Code Examples

#### The Application Way: `anyhow`
If you are writing an application (like a CLI tool or a web server backend), you just use `anyhow::Result`. It accepts **everything**.

```rust
use std::fs::File;
// Notice we import the special Result from anyhow
use anyhow::{Result, Context}; 

// We don't define any custom enums! We just return anyhow::Result.
fn read_config() -> Result<String> {
    // 1. We use ? on an io::Error. anyhow accepts it perfectly!
    let _file = File::open("config.txt")
        // 2. We can attach human-readable context to the error easily!
        .context("Failed to open the critical config.txt file")?; 

    // 3. We use ? on a parsing Error. anyhow accepts that perfectly too!
    let number: i32 = "not_a_number".parse()?; 
    
    Ok("Success".to_string())
}
```

#### The Library Way: `thiserror`
If you are writing a library for others to use, you must provide precise enums. `thiserror` writes all the boilerplate for you using the `#[derive(Error)]` macro.

```rust
use thiserror::Error;
use std::io;

// The macro writes the Display, Error, and From boilerplate for us!
#[derive(Error, Debug)]
pub enum MyLibError {
    // We define how this variant is displayed using #[error("...")]
    #[error("The database at {0} could not be reached.")]
    DatabaseOffline(String),
    
    // #[from] tells the macro to automatically write `impl From<io::Error> for MyLibError`!
    #[error("File system error occurred.")]
    FileSystemError(#[from] io::Error),
}

fn open_lib_file() -> Result<(), MyLibError> {
    // The ? operator works magically because `thiserror` wrote the `From` implementation!
    let _file = std::fs::File::open("lib_data.txt")?;
    Ok(())
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Anyhow Thiserror Scoping and Lifecycle Rules

**The mistake:** Assuming Anyhow Thiserror instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("anyhow_thiserror_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("anyhow_thiserror_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Anyhow Thiserror State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Anyhow Thiserror through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Anyhow Thiserror Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Anyhow Thiserror instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Pick the Crate

**Problem:** For each of the following Rust projects, decide whether the developer should use `anyhow` or `thiserror` for their error handling.

1. A JSON parsing library published to crates.io that allows users to deserialize text into structs.
2. A command-line tool that renames all the photo files in a user's directory.
3. A Postgres database driver that other developers use to connect their apps to a database.
4. A personal Discord bot that reads messages and responds with weather data.

> [!check]- Answer
> 1. **`thiserror`** (It's a library; users need to know exactly why parsing failed).
> 2. **`anyhow`** (It's an application; if a file fails to rename, just print the error and exit).
> 3. **`thiserror`** (It's a library; users need to know if the connection dropped or if the SQL syntax was bad).
> 4. **`anyhow`** (It's an application; if the weather API goes down, just log it and crash).

---

### Exercise 2: Contextual Error Enrichment with Anyhow

**Problem:** Use `anyhow::Context` (`.with_context(...)`) to attach descriptive failure context when parsing string to int.

**Expected output:**
> [!check]- Answer
> ```
> Failed to parse port
> ```
> ```rust
> fn parse_port(s: &str) -> Result<u16, String> {
>     s.parse::<u16>().map_err(|_| "Failed to parse port".to_string())
> }
> fn main() {
>     if let Err(e) = parse_port("invalid") {
>         println!("{}", e);
>     }
> }
> ```
>
> **Explanation:** Attaching context enriches error backtraces with application-specific domain diagnostics.

---

### Exercise 3: Domain Error Definition with `thiserror`

**Problem:** Define an error enum `DataError` with `#[error("io failed")] Io` and `#[error("parse error: {0}")] Parse(String)` variants.

**Expected output:**
> [!check]- Answer
> ```
> Error: parse error: invalid digit
> ```
> ```rust
> enum DataError {
>     Parse(String),
> }
> impl std::fmt::Display for DataError {
>     fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
>         match self { DataError::Parse(s) => write!(f, "parse error: {}", s) }
>     }
> }
> impl std::error::Error for DataError {}
> fn main() {
>     let err = DataError::Parse("invalid digit".into());
>     println!("Error: {}", err);
> }
> ```
>
> **Explanation:** `thiserror` generates standard `Display` and `std::error::Error` implementations for domain enums.

---

## 6. Related Terms

- [Custom Error Types](../level_04/custom_error_types.md) — What `thiserror` is automating behind the scenes.

---

## 7. Key Takeaways

- `thiserror` = For **Libraries**. Automatically generates the boilerplate for your exact, specific custom `enum` errors so callers can `match` on them.
- `anyhow` = For **Applications**. Provides a magical `Result<T>` that can hold *literally any error* in the universe, making it incredibly fast and easy to propagate errors up to `main()` with attached context.
