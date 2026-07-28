# Feature Flags

> **Level 7 — Modules, Visibility & Project Structure**
> Conditional compilation of optional functionality, declared in `Cargo.toml`.

---

## 1. Prerequisites

- [`Cargo.toml`](../level_07/cargo_toml.md) — The file where Feature Flags are defined and requested.
- [`[dependencies]`](../level_07/dependencies_section.md) — Where you activate features for external libraries.

---

## 2. Term Category

**Rust Tooling (the opt-in system)**: In some languages, if you download a massive graphics library just to draw a single 2D circle, you end up compiling a million lines of 3D rendering code you will never use. It bloats your compiled binary and slows down your compile times. 

Rust solves this using **Feature Flags**: a built-in system that allows library authors to make heavy parts of their code strictly opt-in.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

A core Rust philosophy is *"pay for what you use."* 

Feature Flags allow the Rust compiler to completely ignore large blocks of code during compilation if the user didn't explicitly ask for them. This keeps compile times incredibly fast and binary sizes incredibly small. 

It also allows library authors to build powerful "mega-crates" (like the `tokio` async runtime, or the `serde` serialization library) without worrying about punishing users who only need 1% of the functionality.

### (2) Reality Metaphor

Imagine buying a new Car. 

The base model comes with the engine and wheels (the core crate logic). But it has optional upgrades: a sunroof, heated seats, and a premium stereo (the **Feature Flags**). 

If you don't check the box for the sunroof on your order form, the factory doesn't just install it and glue it shut—they completely omit the sunroof from the assembly line. The car is literally built differently, saving weight and manufacturing cost.

### (3) Rust Code Examples

#### Short Snippet (The Consumer)
This is how you *activate* a feature when downloading a crate from `crates.io`.

**File: `Cargo.toml`**
```toml
[dependencies]
# 1. The default (gets whatever the author decided was standard)
serde = "1.0"

# 2. The Feature Flag! We explicitly ask for the `derive` macro.
serde = { version = "1.0", features = ["derive"] }

# 3. Multiple Features! We want everything `tokio` has to offer.
tokio = { version = "1.30", features = ["macros", "rt-multi-thread", "net"] }
```

#### Fuller Example (The Library Author)
If you are building your own library, how do you create these optional upgrades for your users? You define them in `Cargo.toml` and use the `#[cfg(...)]` macro in your Rust code!

**File: `Cargo.toml`**
```toml
[package]
name = "my_math_lib"
version = "0.1.0"

# 1. We declare our custom features!
[features]
default = [] # No features active by default
super_calculus = [] # Our custom opt-in feature!
```

**File: `src/lib.rs`**
```rust
// This function is in the "base model". It always compiles.
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

// This function is OPTIONAL! 
// The compiler completely ignores this code unless the user 
// explicitly requests `features = ["super_calculus"]`.
#[cfg(feature = "super_calculus")]
pub fn solve_differential_equation() {
    println!("Doing heavy math...");
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Feature Flags Scoping and Lifecycle Rules

**The mistake:** Assuming Feature Flags instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("feature_flags_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("feature_flags_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Feature Flags State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Feature Flags through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Feature Flags Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Feature Flags instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Bare Minimum

**Problem:** Write the `Cargo.toml` line to import `reqwest` version `0.11`. You want to disable all default features to keep the compile time low, but you DO want to enable the `json` feature.

> [!check]- Answer
> ```toml
> [dependencies]
> reqwest = { version = "0.11", default-features = false, features = ["json"] }
> ```

---

### Exercise 2: Defining Default Features

**Problem:** Configure `[features] default = ["json"] json = ["dep:serde_json"]` in `Cargo.toml`.

**Expected output:**
> [!check]- Answer
> ```
> Default feature defined
> ```
> ```rust
> fn main() {
>     println!("Default feature defined");
> }
> ```
>
> **Explanation:** `default` lists features enabled automatically unless `default-features = false` is passed.

---

### Exercise 3: Conditional Feature Code Gating

**Problem:** Gate a function with `#[cfg(feature = "extra")]`.

**Expected output:**
> [!check]- Answer
> ```
> Extra feature code compiled
> ```
> ```rust
> #[cfg(feature = "extra")]
> fn extra() { println!("Extra feature code compiled"); }
> fn main() {
>     #[cfg(feature = "extra")]
>     extra();
> }
> ```
>
> **Explanation:** Feature flags map directly to `#[cfg(feature = "...")]` conditional compilation gates.

---

## 6. Related Terms

- [`Cargo.toml`](../level_07/cargo_toml.md) — Where custom features are defined.
- [`[dependencies]`](../level_07/dependencies_section.md) — Where features are activated for external crates.

---

## 7. Key Takeaways

- Feature Flags allow **conditional compilation**, keeping compile times fast and binaries small.
- You activate them using `features = ["..."]` in your `[dependencies]` section.
- You can create your own custom features in the `[features]` section of your `Cargo.toml`.
- Inside Rust code, you wrap optional code with the **`#[cfg(feature = "name")]`** attribute so the compiler knows to ignore it if the flag isn't active.
- Use `default-features = false` if you want a strictly minimal import.
