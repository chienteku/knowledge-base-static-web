# Re-exporting (`pub use`)

> **Level 7 — Modules, Visibility & Project Structure**
> Exposes an item from a submodule at a higher level in the module hierarchy.

---

## 1. Prerequisites

- [`use` Statement](../level_07/use_statement.md) — The standard way to create shortcuts, which `pub use` builds upon.
- [`pub` Visibility](../level_07/pub_visibility.md) — The keyword that makes things visible to the outside world.
- [`mod` Declaration](../level_07/mod_declaration.md) — The internal tree structure that `pub use` helps hide from users.

---

## 2. Term Category

**Rust-specific (the API cleaner)**: When you build a large library, your internal code is usually highly nested into dozens of folders and files. But you don't want your users to have to type `use my_library::network::protocols::http::client::connect;`. You want them to just type `use my_library::connect;`. 

**Re-exporting (`pub use`)** allows you to grab an item from deep inside your messy internal structure and present it at the very top level of your public API.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The way you organize your code internally for *maintenance* (lots of tiny files, deeply nested folders) is almost never the way you want your users to interact with it (which should be flat, simple, and clean). 

If you force users to navigate your internal module tree, you create two massive problems:
1. They have to write horribly long `use` statements.
2. If you ever reorganize your internal folders, you break everyone's code!

`pub use` completely decouples your internal file structure from your public API. You can move your files around all you want; as long as you `pub use` the structs at the root level, the user's code will never break.

### (2) Reality Metaphor

Imagine a mega-store like IKEA. 

Internally, the logistics team tracks a couch as being located in `Warehouse 4 -> Aisle 12 -> Shelf B -> Bin 9`. It would be an absolute disaster if customers had to navigate the dark, messy warehouse just to buy a couch. 

Instead, IKEA takes the couch from the deep warehouse and puts it right at the front of the store in the **Showroom**. 

That is `pub use`. You are taking a deeply nested item from your "warehouse" (internal modules) and placing it in a highly visible "showroom" (`lib.rs`) so users can grab it instantly.

### (3) Rust Code Examples

#### Short Snippet (The Showroom)
Here is what a `lib.rs` file looks like for a library using `pub use`.

```rust
// 1. We declare our messy internal module structure.
// Users don't want to type `use my_crate::auth::passwords::User;`
pub mod auth {
    pub mod passwords {
        pub struct User;
    }
}

// 2. THE SHOWROOM! We re-export `User` to the very top level.
// Now users can just type `use my_crate::User;`!
pub use crate::auth::passwords::User;
```

#### Fuller Example (The User's Perspective)
Here is what it looks like from the perspective of the developer who downloads the library above. They don't even know the `auth::passwords` modules exist!

```rust
// Because the library author used `pub use`, the user gets a beautiful, flat API!
use my_crate::User;

fn main() {
    let u = User;
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Re Exporting Scoping and Lifecycle Rules

**The mistake:** Assuming Re Exporting instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("re_exporting_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("re_exporting_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Re Exporting State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Re Exporting through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Re Exporting Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Re Exporting instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Flattening the API

**Problem:** You wrote a crate called `database_lib`. Your `lib.rs` currently looks like this. Users are complaining that they have to write `use database_lib::storage::postgres::Database;`, which is too long. 

Modify the code below to Re-Export `Database` so users can just write `use database_lib::Database;`.

```rust
// File: src/lib.rs

pub mod storage {
    pub mod postgres {
        pub struct Database;
    }
}

// TODO: Add a line here to re-export `Database`!
```

> [!check]- Answer
> ```rust
> pub mod storage {
>     pub mod postgres {
>         pub struct Database;
>     }
> }
>
> // We grab it from the deep module and present it to the public here!
> pub use crate::storage::postgres::Database;
> ```

---

### Exercise 2: Flattening Module Structures with `pub use`

**Problem:** Re-export a deeply nested function `pub use deep::nested::core_action;` at top level.

**Expected output:**
> [!check]- Answer
> ```
> Core action executed
> ```
> ```rust
> mod deep {
>     pub mod nested {
>         pub fn core_action() { println!("Core action executed"); }
>     }
> }
> pub use deep::nested::core_action;
> fn main() {
>     core_action();
> }
> ```
>
> **Explanation:** `pub use` exposes nested items under convenient top-level module paths.

---

### Exercise 3: Re-exporting External Dependencies

**Problem:** Re-export a third-party type `pub use serde::Serialize;` from a library API.

**Expected output:**
> [!check]- Answer
> ```
> Re-exported trait available
> ```
> ```rust
> fn main() { println!("Re-exported trait available"); }
> ```
>
> **Explanation:** Re-exporting dependency types prevents version mismatch issues for downstream consumers.

---

## 6. Related Terms

- [`use` Statement](../level_07/use_statement.md) — The private version of this keyword, which only creates a shortcut for your own internal file.
- [`pub` Visibility](../level_07/pub_visibility.md) — The requirement for the item being re-exported.

---

## 7. Key Takeaways

- `use` creates a private shortcut for the current file.
- **`pub use`** creates a public shortcut that external users can see and use.
- It allows you to completely decouple your messy internal file structure from your clean, flat public API.
- It is heavily used in `lib.rs` to create the "Facade" pattern for Rust libraries.
