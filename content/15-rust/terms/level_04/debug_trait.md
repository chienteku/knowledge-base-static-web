# `Debug` Trait

> **Level 4 — Error Handling & Generics**
> A trait allowing types to be formatted using `{:?}` (developer-facing output).

---

## 1. Prerequisites

- [Trait](../level_04/trait.md) — The contract being implemented.
- [Derive Macro](../level_04/derive_macro.md) — How you get this trait for free 99% of the time.
- [`println!` / `format!`](../level_01/println_format.md) — The macros that consume this trait.

---

## 2. Term Category

**Rust-specific (the print enabler)**: In dynamic languages like JavaScript or Python, if you `console.log()` a custom object, the language will aggressively try to print it (often resulting in unhelpful output like `[object Object]`). Rust strictly refuses to print any custom type unless you explicitly declare *how* it should be converted into text. The `Debug` trait is how you make that declaration.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

When debugging code, developers constantly need to print variables to the console to inspect their current state. 

Because Rust is strictly typed, the `println!` macro can't just guess how to convert a custom `struct` into a string. The `Debug` trait is the specific contract that provides that conversion logic. 

It is designed entirely for **developers**, not end-users. This means the output doesn't have to be pretty or localized; it just has to be technically accurate, showing the exact struct name and the raw values of all its internal fields. Because the implementation is so predictable, the compiler can write it for you automatically.

### (2) Reality Metaphor

Imagine you find a strange machine part on the floor of an assembly plant (your custom Struct). You take it to the foreman and ask, *"What is this?"* (calling `println!`). 

If the part has no labels, the foreman can't help you (the compiler throws an error). 

The `Debug` trait is the technical spec sticker on the back of the part. It lists the exact serial number, dimensions, and raw material composition. It's not pretty enough to put on a marketing brochure for a customer, but it's exactly what an engineer needs to debug a problem.

### (3) Rust Code Examples

#### Short Snippet (The Free Implementation)
You almost always use the `#[derive]` macro to get `Debug` for free. You print it using the special `{:?}` placeholder.

```rust
// Ask the compiler to write the Debug trait for us
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

fn main() {
    let rect = Rectangle { width: 30, height: 50 };

    // Use {:?} to trigger the Debug trait
    println!("The rectangle is {:?}", rect);
    // Output: The rectangle is Rectangle { width: 30, height: 50 }
    
    // Use {:#?} for "pretty-printing" (adds line breaks and indents)
    println!("The rectangle is {:#?}", rect);
    /* Output: 
       The rectangle is Rectangle {
           width: 30,
           height: 50,
       }
    */
}
```

#### Fuller Example (Manual Implementation)
Why would you ever write `Debug` manually instead of using the macro? Usually, to hide sensitive information from your server logs!

```rust
use std::fmt;

struct User {
    username: String,
    password_hash: String,
}

// We write it manually so we don't accidentally log the password!
impl fmt::Debug for User {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("User")
         .field("username", &self.username)
         .field("password_hash", &"********") // Redacted!
         .finish()
    }
}

fn main() {
    let u = User {
        username: String::from("alice99"),
        password_hash: String::from("12345_qwerty"),
    };
    
    println!("{:?}", u);
    // Output: User { username: "alice99", password_hash: "********" }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Debug Trait Scoping and Lifecycle Rules

**The mistake:** Assuming Debug Trait instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("debug_trait_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("debug_trait_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Debug Trait State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Debug Trait through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Debug Trait Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Debug Trait instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Ultimate Shortcut

**Problem:** Rust has a special macro specifically built around the `Debug` trait called `dbg!()`. Copy this code into a Rust playground and run it. Notice how `dbg!()` is vastly superior to `println!` for quick debugging!

```rust
#[derive(Debug)]
struct Vector2(f32, f32);

fn main() {
    let velocity = Vector2(10.5, -3.2);
    
    // The dbg! macro takes ownership, prints the file name, line number, 
    // the variable name, and the Debug output, and then returns the value back!
    let final_velocity = dbg!(velocity);
}
```

> [!check]- Answer
> ```text
> [src/main.rs:9] velocity = Vector2(
>     10.5,
>     -3.2,
> )
> ```

---

### Exercise 2: Custom Debug Implementation for Sensitive Data Redaction

**Problem:** Implement `fmt::Debug` manually for `User { username: String, secret_key: String }` to redact `secret_key`.

**Expected output:**
> [!check]- Answer
> ```
> User { username: "alice", secret_key: "***" }
> ```
> ```rust
> use std::fmt;
> struct User { username: String, secret_key: String }
> impl fmt::Debug for User {
>     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
>         f.debug_struct("User")
>          .field("username", &self.username)
>          .field("secret_key", &"***")
>          .finish()
>     }
> }
> fn main() {
>     let u = User { username: "alice".into(), secret_key: "secret123".into() };
>     println!("{:?}", u);
> }
> ```
>
> **Explanation:** Manual `Debug` implementations allow customized formatting outputs using `f.debug_struct()` helpers.

---

### Exercise 3: Pretty-Printing Debug Output

**Problem:** Print a nested struct using `{:#?}` pretty-print formatting.

**Expected output:**
> [!check]- Answer
> ```
> Pretty debug printed
> ```
> ```rust
> #[derive(Debug)]
> struct Config { port: u16, host: String }
> fn main() {
>     let cfg = Config { port: 8080, host: "localhost".into() };
>     println!("{:#?}", cfg);
>     println!("Pretty debug printed");
> }
> ```
>
> **Explanation:** `{:#?}` formats `Debug` structures with multiline indentation and field alignment.

---

## 6. Related Terms

- [`Display` Trait](../level_04/display_trait.md) — The user-facing counterpart to `Debug`.
- [Derive Macro](../level_04/derive_macro.md) — The mechanism used to generate `Debug` automatically.

---

## 7. Key Takeaways

- `Debug` is a trait that allows a type to be printed using the `{:?}` format specifier.
- The `{:#?}` specifier "pretty-prints" the output (adds line breaks and indentation for large structs).
- The `dbg!(my_var)` macro is an incredible shortcut that prints the file name, line number, variable name, and the `Debug` output, and then returns the variable back so you can use it in-line.
- You should almost always automatically `#[derive(Debug)]` on every single struct and enum you create.
