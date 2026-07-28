# `Default` Trait

> **Level 4 — Error Handling & Generics**
> Provides a default value via `Default::default()`.

---

## 1. Prerequisites

- [Trait](../level_04/trait.md) — The contract being implemented.
- [Structs](../level_02/struct.md) — The primary target for default configurations.
- [Derive Macro](../level_04/derive_macro.md) — How you get a "zeroed-out" default for free.

---

## 2. Term Category

**Rust-specific (the configuration generator)**: In many Object-Oriented languages, you use Constructors with optional arguments to create a standard, "default" object. Rust does not have optional function arguments, nor does it have traditional Constructors. The `Default` trait is Rust's universally accepted, idiomatic way of providing a base, zero-state configuration for an object.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Imagine you are building a UI library. You have a `WindowConfig` struct with 15 different fields (width, height, full_screen, title, color, font_size, etc.). 

99% of the time, users just want a standard window, but maybe they want to change the `title`. Because Rust strictly forces you to initialize *every single field* when instantiating a struct, the user would have to manually type out all 15 fields every single time they create a window. This is awful.

The `Default` trait solves this. It provides a standard `Default::default()` method that returns a sensible base configuration. You can then use the incredibly powerful **struct update syntax** (`..`) to say: *"Give me the default window, but override the title."*

### (2) Reality Metaphor

Imagine you are buying a car. 

You *could* build it entirely from scratch, specifying exactly what engine you want, what tires, what seats, and what steering wheel. But most people don't want to do that. 

Most people just walk into the dealership and say: *"Give me the standard factory model (`Default::default()`), but paint it red (`..` struct update syntax)."* The `Default` trait represents the manufacturer's standard factory configuration.

### (3) Rust Code Examples

#### Short Snippet (The Free Implementation)
When you use `#[derive(Default)]`, the compiler looks at every field in your struct and calls `.default()` on it. (For numbers, the default is `0`. For booleans, it's `false`. For Strings, it's `""`).

```rust
#[derive(Debug, Default)]
struct Player {
    name: String,   // Defaults to ""
    score: i32,     // Defaults to 0
    is_admin: bool, // Defaults to false
}

fn main() {
    // We get a fully instantiated struct for free!
    let new_player = Player::default();
    
    println!("{:?}", new_player); 
    // Output: Player { name: "", score: 0, is_admin: false }
}
```

#### Fuller Example (Manual Defaults & Struct Update Syntax)
If your standard window size should be `800x600` instead of `0x0`, you must implement `Default` manually. Then, you can use the magic `..` syntax to save massive amounts of typing.

```rust
#[derive(Debug)]
struct WindowConfig {
    width: u32,
    height: u32,
    title: String,
    fullscreen: bool,
}

// 1. Manually implement Default to provide sensible base values
impl Default for WindowConfig {
    fn default() -> Self {
        WindowConfig {
            width: 800,
            height: 600,
            title: String::from("My App"),
            fullscreen: false,
        }
    }
}

fn main() {
    // 2. We use the `..` struct update syntax!
    // This says: "Set the title to 'Custom', and fill in the rest of the 
    // fields using whatever WindowConfig::default() returns!"
    let my_window = WindowConfig {
        title: String::from("Custom App"),
        ..WindowConfig::default()
    };
    
    println!("{:#?}", my_window);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Default Trait Scoping and Lifecycle Rules

**The mistake:** Assuming Default Trait instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("default_trait_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("default_trait_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Default Trait State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Default Trait through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Default Trait Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Default Trait instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Fast Setup

**Problem:** You are creating a `Button` struct. Use the `..` struct update syntax combined with `Default::default()` to create a button where the `label` is `"Submit"`, but all the other fields fall back to their standard default values.

```rust
#[derive(Default, Debug)]
struct Button {
    label: String,
    color: String,
    width: u32,
    is_disabled: bool,
}

fn main() {
    // TODO: Create a `submit_btn` here using the `..` syntax.
    
    // println!("{:?}", submit_btn);
}
```

> [!check]- Answer
> ```rust
> fn main() {
>     let submit_btn = Button {
>         label: String::from("Submit"),
>         ..Default::default() // Let the trait fill out color, width, and is_disabled!
>     };
>     
>     println!("{:?}", submit_btn);
> }
> ```

---

### Exercise 2: Partial Field Construction using `..Default::default()`

**Problem:** Define `struct Config { host: String, port: u16, max_conn: u32 }` deriving `Default`. Construct a config overriding only `port: 9000`.

**Expected output:**
> [!check]- Answer
> ```
> Port: 9000, Max conn: 100
> ```
> ```rust
> #[derive(Debug)]
> struct Config {
>     host: String,
>     port: u16,
>     max_conn: u32,
> }
> impl Default for Config {
>     fn default() -> Self {
>         Self { host: "localhost".into(), port: 8080, max_conn: 100 }
>     }
> }
> fn main() {
>     let cfg = Config { port: 9000, ..Config::default() };
>     println!("Port: {}, Max conn: {}", cfg.port, cfg.max_conn);
> }
> ```
>
> **Explanation:** Combining struct update syntax with `Default::default()` supplies default fallbacks for unassigned fields.

---

### Exercise 3: Deriving Default for Custom Enums

**Problem:** Use `#[default]` attribute on an enum variant `#[derive(Default)] enum Status { #[default] Idle, Active }`.

**Expected output:**
> [!check]- Answer
> ```
> Default status: Idle
> ```
> ```rust
> #[derive(Default, Debug, PartialEq)]
> enum Status {
>     #[default]
>     Idle,
>     Active,
> }
> fn main() {
>     let s: Status = Default::default();
>     println!("Default status: {:?}", s);
> }
> ```
>
> **Explanation:** Rust 1.62+ allows specifying standard default enum variants using `#[default]` attributes.

---

## 6. Related Terms

- [Derive Macro](../level_04/derive_macro.md) — How you get `Default` for free (which recursively zeroes out all fields).
- [`Option<T>`](../level_02/option_t.md) — Another way to handle missing data. Interestingly, `Option::None` is actually the `Default` value for an `Option`!

---

## 7. Key Takeaways

- The `Default` trait provides a standard way to create an "empty" or "base" version of a type via `MyType::default()`.
- You can derive it (`#[derive(Default)]`), which will recursively call `.default()` on every single field (integers become `0`, Strings become `""`, booleans become `false`).
- You implement it manually when the "base" configuration shouldn't just be zeroes (like setting a default volume level to `50` instead of `0`).
- It pairs beautifully with the **`..` struct update syntax** to let you override just one or two fields of a massive struct while keeping the defaults for the rest.
