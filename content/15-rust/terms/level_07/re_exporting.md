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

### Exercise 3: Re-Exporting External Types \u2014 The Diamond Problem

**Problem:**
Re-exporting external dependency types from your library's public API solves a subtle versioning problem called the **diamond dependency conflict**.

Consider this scenario:
- Your library `my_lib v1.0` depends on `serde v1.0` and re-exports `serde::Serialize`.
- A user's application depends on both `my_lib v1.0` and `serde v1.0`.
- The user wants to implement `Serialize` for their struct and pass it to `my_lib`.

Write:
1. `src/lib.rs` of `my_lib` that re-exports `serde::Serialize` as part of its public API.
2. An example showing how the downstream user `use`s the re-exported trait (not directly from serde) and implements it for their own struct.
3. An explanation: why does using `pub use my_lib::Serialize` (the re-export) instead of `use serde::Serialize` directly prevent a compilation error in the user's code?

**Expected output:**
> [!check]- Answer
> *(No runtime output — this is a library API design exercise. The key insight is compile-time compatibility.)*
>
> - **Hint 1:** In Rust, `serde::Serialize` at version `1.0.0` and `serde::Serialize` at version `1.0.1` are the **same trait** (same `Cargo.toml` semver range). But `serde v1.0` and (hypothetically) `serde v2.0` would be **different traits** — a struct implementing `v1::Serialize` does NOT implement `v2::Serialize`, even if they look identical.
> - **Hint 2:** If `my_lib` re-exports `serde::Serialize`, the user who writes `use my_lib::Serialize` gets exactly the same trait object as the one `my_lib` uses internally — they come from the same resolved crate, same version, same type ID. No mismatch possible.
> - **Hint 3:** If `my_lib` does NOT re-export `Serialize`, the user must add `serde` to their own `Cargo.toml`. If they pick a different semver-incompatible version, `cargo build` may fail with `error[E0277]: the trait Serialize is not implemented` even though their struct clearly derives it — because two different versions of the trait exist simultaneously.
>
> ```rust
> // my_lib/src/lib.rs
>
> // Re-export the trait we use in our public API.
> // Users should import Serialize from HERE, not from serde directly.
> // This guarantees they get the exact same version we compiled against.
> pub use serde::Serialize;
>
> /// Serializes any `Serialize` implementor to a JSON string.
> pub fn to_json<T: Serialize>(value: &T) -> String {
>     // (In a real impl, this would call serde_json::to_string)
>     format!("\"serialized: {}\"", std::any::type_name::<T>())
> }
> ```
>
> ```rust
> // user_app/src/main.rs
>
> // Import Serialize from my_lib, not from serde directly.
> // This guarantees version compatibility with my_lib's internal usage.
> use my_lib::Serialize;
>
> #[derive(Serialize)]
> struct User {
>     name: String,
>     age: u32,
> }
>
> fn main() {
>     let user = User { name: "Alice".into(), age: 30 };
>     // This works because User::Serialize and my_lib's Serialize are the SAME trait.
>     let json = my_lib::to_json(&user);
>     println!("{}", json);
> }
> ```
>
> **Answer to the "why re-export prevents errors" question:**
> When `my_lib` declares `pub use serde::Serialize`, it exposes the *exact instance* of the `Serialize` trait that it compiled against. Any user who imports `my_lib::Serialize` gets that exact same instance \u2014 they cannot accidentally import a different version. If they had imported `serde::Serialize` directly with their own `Cargo.toml` entry, Cargo might resolve a different semver-incompatible version, giving them a *different type* with the same name. Rust's type system would then correctly reject their type as "not implementing `my_lib`'s `Serialize`" \u2014 a confusing but technically correct error. Re-exporting closes this gap by making the library the single source of truth for its own dependencies' types.

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
