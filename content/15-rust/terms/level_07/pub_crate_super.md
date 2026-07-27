# `pub(crate)` / `pub(super)`

> **Level 7 — Modules, Visibility & Project Structure**
> Fine-grained visibility: public within the crate, or parent module only.

---

## 1. Prerequisites

- [`pub` Visibility](../level_07/pub_visibility.md) — The default "make it public to everyone" keyword.
- [`mod` Declaration](../level_07/mod_declaration.md) — The module boundaries that these keywords restrict.
- [Cargo](../level_01/cargo.md) — The build system that compiles your project into the "Crate" that `pub(crate)` refers to.

---

## 2. Term Category

**Rust-specific (the granular privacy shields)**: Standard `pub` is a sledgehammer. If you mark a function as `pub` in a library, it becomes visible to the entire universe (including random developers downloading your code from the internet). 

But what if you want a function to be public *only* to the files inside your own project, but strictly hidden from the outside world? That's exactly what `pub(crate)` and `pub(super)` are for. They allow you to dial in exactly how public an item is.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Imagine you are writing a Database library that other developers will download. You have a central `ConnectionManager` struct. 

You want all the different files inside your own project (`queries.rs`, `transactions.rs`, `auth.rs`) to be able to talk freely to the `ConnectionManager`. But you absolutely do NOT want the developers who download your library to interact with it directly! 

- If you use `pub`, everyone in the world can see it. 
- If you use no keyword (Private), no one can see it (not even your own `queries.rs` file). 

The perfect solution is **`pub(crate)`**, which tells the compiler: *"This is public, but ONLY to the files inside my current project (my crate). Hide it from everyone else."*

### (2) Reality Metaphor

Imagine an Airport.

- **Private (No keyword):** The Cockpit. Only the pilot sitting *inside* the cockpit is allowed in.
- **`pub(super)`:** The Terminal Employee Break Room. Only the employees working in that specific Terminal (the immediate parent module) are allowed in.
- **`pub(crate)`:** The Tarmac (Runways). Any employee with an airport badge (anyone anywhere inside the project) can walk on the tarmac.
- **`pub`:** The Main Food Court. The general public (the entire world) can walk in.

### (3) Rust Code Examples

#### Short Snippet (The Visibility Tree)
Here is how the compiler enforces these granular rules.

```rust
mod airport {
    // 1. Visible to ANY file in the entire project
    pub(crate) fn tarmac() {}

    mod terminal_a {
        // 2. Visible ONLY to the `airport` module (the parent)
        pub(super) fn break_room() {}
        
        // 3. Visible ONLY inside `terminal_a` (completely private)
        fn cockpit() {}

        pub fn test_visibility() {
            cockpit(); // OK!
            break_room(); // OK!
            super::tarmac(); // OK!
        }
    }

    pub fn airport_manager() {
        terminal_a::break_room(); // OK! The parent can see `pub(super)`.
        tarmac(); // OK!

        // terminal_a::cockpit(); // ERROR! `cockpit` is strictly private.
    }
}

fn main() {
    airport::tarmac(); // OK! `main` is in the same crate, so `pub(crate)` is visible.
    
    // airport::terminal_a::break_room(); // ERROR! `main` is not the parent!
}
```

#### Fuller Example (Struct Fields)
`pub(crate)` is extremely common for Struct fields in libraries. You want your own library files to be able to modify the `id` field, but you want to prevent external users from hacking it.

```rust
mod database {
    pub struct UserRecord {
        // External users can read this (it is fully `pub`)
        pub username: String,
        
        // External users cannot see this! But other files in OUR project can!
        pub(crate) id: i32,
    }

    impl UserRecord {
        pub fn new(username: String) -> Self {
            Self { username, id: 0 }
        }
    }
}

fn main() {
    // We are in the same crate, so we are allowed to access `pub(crate)`!
    let mut user = database::UserRecord::new("Alice".to_string());
    
    user.id = 999; // Success! 
    
    // NOTE: If a developer downloaded this code as an external library, 
    // the line above would throw a massive compiler error!
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Pub Crate Super Scoping and Lifecycle Rules

**The mistake:** Assuming Pub Crate Super instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("pub_crate_super_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("pub_crate_super_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Pub Crate Super State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Pub Crate Super through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Pub Crate Super Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Pub Crate Super instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Narrowest Shield

**Problem:** You have a `mod engine` which contains a `mod cylinders`. Inside `cylinders`, there is a function `fn ignite()`. You want `engine` to be able to call `ignite()`, but you DO NOT want `main.rs` to be able to call it. Which keyword should you put in front of `fn ignite()`?

1. `pub`
2. `pub(crate)`
3. `pub(super)`
4. No keyword (leave it private)

> [!check]- Answer
> **3. `pub(super)`**
>
> - `pub` and `pub(crate)` would both allow `main.rs` to call it.
> - No keyword would prevent `engine` from calling it.
> - `pub(super)` makes it visible ONLY to `engine` (the immediate parent)!

---

### Exercise 2: Restricting Visibility with `pub(crate)`

**Problem:** Declare `pub(crate) fn internal_helper()` and call it within the same crate.

**Expected output:**
```
Internal helper called
```

> [!check]- Answer
> ```rust
> pub(crate) fn internal_helper() { println!("Internal helper called"); }
> fn main() {
>     internal_helper();
> }
> ```
>
> **Explanation:** `pub(crate)` restricts item visibility strictly to modules within the containing crate.

### Exercise 3: Accessing Parent Scope with `super`

**Problem:** Access a parent module function `super::parent_fn()` from an inner nested submodule.

**Expected output:**
```
Parent function called
```

> [!check]- Answer
> fn parent_fn() { println!("Parent function called"); }
> mod child {
>     pub fn call_parent() { super::parent_fn(); }
> }
> fn main() { child::call_parent(); }
> ```
>
> **Explanation:** `super` refers to the immediate parent module in relative path lookups.

---

---

## 6. Related Terms

- [`pub` Visibility](../level_07/pub_visibility.md) — The sledgehammer version of these keywords that makes items visible to the entire universe.
- [`mod` Declaration](../level_07/mod_declaration.md) — The module hierarchy that these keywords navigate.

---

## 7. Key Takeaways

- **`pub`**: Visible to the entire universe.
- **`pub(crate)`**: Visible to any file inside your current project/crate, but strictly hidden from external users who download your library.
- **`pub(super)`**: Visible only to the immediate parent module that contains the current module.
- These keywords are crucial when building libraries to ensure you don't accidentally leak internal helper code to your users.
