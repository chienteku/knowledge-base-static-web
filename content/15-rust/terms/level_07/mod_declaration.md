# `mod` Declaration

> **Level 7 — Modules, Visibility & Project Structure**
> Declares a submodule; the compiler looks for `mod_name.rs` or `mod_name/mod.rs`.

---

## 1. Prerequisites

- [Functions (`fn`)](../level_01/fn.md) — The blocks of code you are trying to organize.
- [Structs (`struct`)](../level_02/struct.md) — The data structures you want to separate into different files.

---

## 2. Term Category

**Rust-specific (the project tree builder)**: In languages like Node.js or Python, the file system *is* the module system. If you create a file named `math.js`, the program automatically knows it exists. Rust does NOT work this way! 

In Rust, the compiler only looks at your "root" file (`main.rs` or `lib.rs`). If you create a new file called `math.rs` in your folder, the compiler will completely ignore it. The `mod` keyword is how you explicitly tell the compiler: *"Hey, there is another file over there, please include it in the project."*

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The Rust designers wanted explicit control over the project structure. They didn't want the compiler magically scanning your hard drive and randomly including files just because they happen to be in the folder. 

By requiring the `mod` keyword, you build an explicit "tree" of modules starting from the root. This guarantees that every single file in your compiled binary was explicitly asked for. It also prevents the chaos of having to write confusing relative path imports (like `../../utils.rs`) all over your codebase.

### (2) Reality Metaphor

Imagine `main.rs` is the CEO of a company. 

You (the developer) hire a new employee and stick them in an office down the hall (you create the file `math.rs`). The CEO has absolutely no idea the employee exists! If the CEO tries to ask the employee to do work, the CEO will fail.

Writing the `mod math;` declaration is you walking into the CEO's office and handing them the employee's ID badge. You are explicitly wiring the new file into the company's official organizational chart.

### (3) Rust Code Examples

#### Short Snippet (The basic file link)
This is exactly how you link a separate file into your Rust project.

**File: `math.rs`**
```rust
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}
```

**File: `main.rs`**
```rust
// 1. We DECLARE the module. This tells the compiler to look for `math.rs`
mod math; 

fn main() {
    // 2. Now we can use the code inside that module!
    let result = math::add(5, 10);
    println!("Result: {}", result);
}
```

#### Fuller Example (Inline vs Filesystem)
Modules don't *have* to be separate files. You can define them inline! But when you do map them to the file system, Rust looks for two specific file paths.

```rust
// 1. INLINE MODULE: We define the module right here in the same file.
mod inline_math {
    pub fn multiply(a: i32, b: i32) -> i32 {
        a * b
    }
}

// 2. FILESYSTEM MODULE: We just write `mod name;` without the curly braces.
mod external_math;
// When the compiler sees `mod external_math;`, it looks for exactly two files:
// Option A: `external_math.rs` (in the same directory)
// Option B: `external_math/mod.rs` (if you want a folder for submodules)

fn main() {
    println!("{}", inline_math::multiply(5, 5));
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Mod Declaration Scoping and Lifecycle Rules

**The mistake:** Assuming Mod Declaration instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("mod_declaration_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("mod_declaration_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Mod Declaration State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Mod Declaration through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Mod Declaration Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Mod Declaration instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Invisible File

**Problem:** You are building a game. You have a `main.rs` and you just created a `player.rs` file in the same folder. However, when you write `player::jump();` in your `main.rs`, the compiler says `use of undeclared crate or module 'player'`. How do you fix it?

> [!check]- Answer
> You must explicitly declare the module so the compiler knows the file exists! Add this to the top of your `main.rs`:
>
> ```rust
> mod player;
> ```

---

### Exercise 2: Inline vs File Module Declarations

**Problem:** Declare an inline module `mod utils { pub fn ping() {} }` and call `utils::ping()`.

**Expected output:**
> [!check]- Answer
> ```
> Pinged
> ```
> ```rust
> mod utils {
>     pub fn ping() { println!("Pinged"); }
> }
> fn main() {
>     utils::ping();
> }
> ```
>
> **Explanation:** `mod name { ... }` defines inline submodules without separate file creation.

---

### Exercise 3: Nested Submodule Hierarchy Declarations

**Problem:** Access `net::http::client::connect()` through nested module paths.

**Expected output:**
> [!check]- Answer
> ```
> Connected
> ```
> ```rust
> mod net { pub mod http { pub mod client { pub fn connect() { println!("Connected"); } } } }
> fn main() { net::http::client::connect(); }
> ```
>
> **Explanation:** Nested `mod` declarations establish hierarchical module paths.

---

## 6. Related Terms

- [`use` Statement](../level_07/use_statement.md) — The keyword you use to actually *import* things from the modules you declare with `mod`.
- [`pub` Visibility](../level_07/pub_visibility.md) — How you make the functions inside your modules visible to the rest of the project.

---

## 7. Key Takeaways

- Rust does not automatically read files just because they are in your folder!
- **`mod name;`** explicitly tells the compiler to look for a file named `name.rs` or `name/mod.rs` and physically include it in the compiled project.
- You only declare a module with `mod` **exactly once** in your whole project (where it belongs in the tree).
- Do not confuse `mod` (which builds the tree) with `use` (which creates a shortcut to an item already in the tree).
