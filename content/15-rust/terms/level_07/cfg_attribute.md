# `cfg` Attribute

> **Level 7 — Modules, Visibility & Project Structure**
> Conditional compilation: `#[cfg(target_os = "linux")]`, `#[cfg(feature = "serde")]`.

---

## 1. Prerequisites

- [Derive Macro](../level_04/derive_macro.md) — Another feature that uses the `#[...]` attribute syntax.
- [Feature Flags](../level_07/feature_flags.md) — The custom toggles that `cfg` often looks for.

---

## 2. Term Category

**Rust-specific (the shape-shifter)**: Rust runs on almost everything: Windows, Mac, Linux, WebAssembly, and tiny embedded microcontrollers. 

But a function that interacts with the Windows Registry will throw a massive compile error if you try to compile it on a Mac, because those APIs don't exist! The **`#[cfg(...)]`** attribute (short for Configuration) tells the compiler to look at the current environment. If the condition inside the attribute is false, the compiler completely deletes the code before it even tries to compile it.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In older languages like C++, conditional compilation is handled by messy preprocessor macros like `#ifdef _WIN32`. It is incredibly ugly and error-prone. 

The Rust designers wanted a cleaner, integrated solution. By using standard Attributes, conditional compilation looks just like any other Rust metadata. It allows you to write one single codebase that effortlessly adapts its shape based on the OS, the CPU architecture, or custom Feature Flags chosen by the user in `Cargo.toml`.

### (2) Reality Metaphor

Imagine you are writing a script for a play that will be performed in both London and New York. 

In the script, you write a scene where the characters eat dinner. You add a sticky note to one line of dialogue: `[Only read this if performing in London] "Pass the fish and chips!"`. You add another sticky note to the next line: `[Only read this if performing in New York] "Pass the hot dogs!"`. 

The actors (the compiler) look at the sticky notes, determine what city they are currently in, and automatically skip the lines that don't match.

### (3) Rust Code Examples

#### Short Snippet (OS-Specific Code)
Here is how you write cross-platform code without crashing the compiler.

```rust
// The compiler deletes this function if you are on Mac or Linux!
#[cfg(target_os = "windows")]
fn get_os_greeting() -> &'static str {
    "Hello, Windows user!"
}

// The compiler deletes this function if you are on Windows!
#[cfg(not(target_os = "windows"))]
fn get_os_greeting() -> &'static str {
    "Hello, Non-Windows user!"
}

fn main() {
    // This perfectly compiles on all operating systems.
    println!("{}", get_os_greeting());
}
```

#### Fuller Example (Features, Tests, and Complex Logic)
`cfg` isn't just for Operating Systems. It is heavily used for Feature Flags and Unit Testing!

```rust
// 1. FEATURE FLAGS
// This struct only exists if the user activated the `database` feature in Cargo.toml.
#[cfg(feature = "database")]
pub struct DbConnection;

// 2. UNIT TESTS
// We write all our tests in the same file as our code. But we NEVER want test code 
// to be compiled into the final production binary!
// `#[cfg(test)]` tells the compiler: "Only compile this when running `cargo test`!"
#[cfg(test)]
mod tests {
    // Test code goes here...
}

// 3. COMPLEX CONDITIONS
// You can use `all()`, `any()`, and `not()` to build complex logic.
// This function only compiles if the OS is Linux AND the CPU is 64-bit.
#[cfg(all(target_os = "linux", target_pointer_width = "64"))]
fn advanced_linux_math() {}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Cfg Attribute Scoping and Lifecycle Rules

**The mistake:** Assuming Cfg Attribute instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("cfg_attribute_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("cfg_attribute_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Cfg Attribute State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Cfg Attribute through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Cfg Attribute Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Cfg Attribute instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Opt-In Print

**Problem:** You have a function called `print_debug_info()`. You only want this function to exist (and be compiled) if the user has activated a custom feature flag in their `Cargo.toml` called `"verbose_logging"`. What attribute should you place above the function?

> [!check]- Answer
> ```rust
> #[cfg(feature = "verbose_logging")]
> fn print_debug_info() {
>     println!("Everything is fine!");
> }
> ```

---

### Exercise 2: Conditional Target OS Compilation

**Problem:** Annotate a function with `#[cfg(target_os = "linux")]`.

**Expected output:**
> [!check]- Answer
> ```
> Linux function compiled
> ```
> ```rust
> #[cfg(target_os = "linux")]
> fn linux_only() { println!("Linux function compiled"); }
> fn main() {
>     #[cfg(target_os = "linux")]
>     linux_only();
> }
> ```
>
> **Explanation:** `#[cfg(...)]` conditionally includes items based on target OS/architecture.

---

### Exercise 3: Composing `cfg` Predicates with `all`, `any`, and `not`

**Problem:**
Real-world platform code often needs multi-condition compilation guards. `cfg` supports boolean combinators: `all(a, b)` (both must be true), `any(a, b)` (either must be true), and `not(a)` (must be false). These compose arbitrarily.

Write a program that defines **three** platform-specific functions and calls the appropriate one based on the current platform:
1. `fn platform() -> &'static str` returning `"desktop unix"` — compiled only on Unix systems that are **not** Android (i.e., Linux desktop, macOS, BSD).
2. `fn platform() -> &'static str` returning `"android"` — compiled only on Android.
3. `fn platform() -> &'static str` returning `"windows or other"` — compiled on everything else.

Only one of the three must compile at a time (no duplicate function error).

**Expected output:**
> [!check]- Answer
> ```text
> Running on: desktop unix    (on Linux/macOS)
> Running on: android         (on Android)
> Running on: windows or other (on Windows/wasm/etc.)
> ```
> *(exact output depends on the host platform)*
>
> - **Hint 1:** `unix` is a cfg predicate set automatically on any Unix-like system: Linux, macOS, Android, BSD, etc. `target_os = "android"` is the Android-specific predicate. So `all(unix, not(target_os = "android"))` means: is Unix but NOT Android.
> - **Hint 2:** `not(unix)` covers Windows, WebAssembly (`wasm32`), and other non-Unix targets. Combining with `not(target_os = "android")` isn't needed here since Android implies Unix.
> - **Hint 3:** The three conditions must be mutually exclusive and collectively exhaustive to avoid both "duplicate function" errors (two conditions true at once) and "function not found" errors (no condition true). Adding a final catch-all with `not(all(unix, ...))` covers this.
>
> ```rust
> // Compiled only on desktop Unix (Linux, macOS, BSD) — not Android.
> #[cfg(all(unix, not(target_os = "android")))]
> fn platform() -> &'static str { "desktop unix" }
>
> // Compiled only on Android (which IS unix, so we need this before the catch-all).
> #[cfg(target_os = "android")]
> fn platform() -> &'static str { "android" }
>
> // Compiled on everything else: Windows, WebAssembly, other non-unix targets.
> #[cfg(not(unix))]
> fn platform() -> &'static str { "windows or other" }
>
> fn main() {
>     println!("Running on: {}", platform());
> }
> ```
>
> **Explanation:**
> `cfg` predicates are evaluated at **compile time** using data Cargo passes to `rustc` (target triple, enabled features, etc.). The three conditions are mutually exclusive because:
> - `all(unix, not(target_os = "android"))` — catches non-Android Unix.
> - `target_os = "android"` — catches Android (a subset of Unix, handled before `not(unix)`).
> - `not(unix)` — catches everything that isn't Unix at all.
> Only one branch exists in the compiled binary; the others are deleted by the compiler before any code generation.

---

## 6. Related Terms

- [Feature Flags](../level_07/feature_flags.md) — The custom toggles you can check using `#[cfg(feature = "...")]`.
- [Testing (`#[test]`)](../level_08/test_attribute.md) — An upcoming feature in Level 8 that relies entirely on `#[cfg(test)]` to keep tests out of production binaries.

---

## 7. Key Takeaways

- `#[cfg(...)]` evaluates conditions at **compile time**.
- If the condition is false, the compiler completely ignores/deletes the code attached to the attribute.
- It is heavily used for OS-specific logic (`target_os = "windows"`).
- It is used to connect Rust code to `Cargo.toml` features (`feature = "my_feature"`).
- It is universally used to keep unit tests out of production binaries via `#[cfg(test)]`.
