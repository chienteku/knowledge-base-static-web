# Workspace

> **Level 7 — Modules, Visibility & Project Structure**
> A Cargo feature for managing multiple related packages (crates) in a single repository.

---

## 1. Prerequisites

- [`Cargo.toml`](../level_07/cargo_toml.md) — The manifest file that configures the Workspace.
- [Crate](../level_01/crate.md) — The individual compilation units that the Workspace groups together.

---

## 2. Term Category

**Rust Tooling (the mega-project organizer)**: Normally, a `Cargo.toml` file manages exactly one Crate (one library or one executable binary). But what if you are building a massive application? 

You might want to split it up into a `frontend_cli` crate, a `backend_server` crate, and a `shared_types` library crate, all sitting in the same git repository. A **Workspace** allows you to group multiple crates together so they can share dependencies and compile efficiently as one massive super-project.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Imagine you have 3 separate crates in 3 separate folders. All 3 of them use the heavy `serde` serialization library. If you run `cargo build` on each of them individually, Cargo will literally download and compile the massive `serde` library 3 different times! It takes 3 times as long to compile, and it stores 3 identical copies of the compiled code on your hard drive. 

Workspaces solve this. By grouping them into a Workspace, Cargo creates a single, master `Cargo.lock` file and a single, shared `/target` folder. It compiles `serde` exactly once, and shares the compiled machine code across all 3 of your crates. This saves massive amounts of disk space and compilation time!

### (2) Reality Metaphor

Imagine a large Office Building (the **Workspace**). 

Inside the building, there are three totally different businesses: an Accounting Firm, a Law Firm, and a Graphic Design Studio (the **Crates**). They all do completely different work and have their own employees. 

However, instead of each business hiring their own separate janitor and paying their own separate water bill (compiling dependencies separately), they share the building's central Janitorial Staff and Utilities (the shared `/target` folder and `Cargo.lock`). It is vastly more efficient for everyone.

### (3) Rust Code Examples

#### Short Snippet (The Folder Structure)
Here is what a typical Workspace looks like on your hard drive. Notice there is no `src/` folder at the root! The root just holds the individual crates.

```text
my_mega_project/
├── Cargo.toml          <-- The Workspace Root Config
├── Cargo.lock          <-- The ONE shared lockfile for all crates
├── target/             <-- The ONE shared compiled output folder
│
├── frontend_cli/       <-- Member Crate #1
│   ├── Cargo.toml
│   └── src/main.rs
│
├── backend_server/     <-- Member Crate #2
│   ├── Cargo.toml
│   └── src/main.rs
│
└── shared_types/       <-- Member Crate #3
    ├── Cargo.toml
    └── src/lib.rs
```

#### Fuller Example (The Root `Cargo.toml`)
To make the folder structure above actually work, the `Cargo.toml` at the very root of the project looks different than a normal file. It uses the `[workspace]` header!

**File: `my_mega_project/Cargo.toml`**
```toml
# Notice there is no [package] section here! 
# This is a "Virtual Workspace" root. It's just a container.

[workspace]
members = [
    "frontend_cli",
    "backend_server",
    "shared_types",
]

# (Optional) You can define dependencies here to share exact versions 
# across all your crates!
[workspace.dependencies]
serde = "1.0"
tokio = "1.30"
```

To use `shared_types` inside the backend, the backend's `Cargo.toml` would look like this:

**File: `my_mega_project/backend_server/Cargo.toml`**
```toml
[package]
name = "backend_server"
version = "0.1.0"
edition = "2021"

[dependencies]
# We use a relative path to point to our sibling crate!
shared_types = { path = "../shared_types" }
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Workspace Scoping and Lifecycle Rules

**The mistake:** Assuming Workspace instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("workspace_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("workspace_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Workspace State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Workspace through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Workspace Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Workspace instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Declare the Workspace

**Problem:** You are building a multiplayer game. You have created a root folder with a `Cargo.toml` file. Inside the root folder, you have created two crates (folders) named `game_client` and `game_server`. 

Write the exact TOML code that must go in the root `Cargo.toml` to link these two crates into a Workspace.

> [!check]- Answer
> ```toml
> [workspace]
> members = [
>     "game_client",
>     "game_server",
> ]
> ```

---

### Exercise 2: Defining Workspace Manifest Root

**Problem:** Write a `Cargo.toml` root workspace definition listing `members = ["crate_a", "crate_b"]`.

**Expected output:**
> [!check]- Answer
> ```
> [workspace]
> members = ["crate_a", "crate_b"]
> ```
> ```rust
> fn main() {
>     println!("[workspace]\nmembers = [\"crate_a\", \"crate_b\"]");
> }
> ```
>
> **Explanation:** Root `[workspace]` manifests organize multiple related sub-crates under a shared `target/` directory.

---

### Exercise 3: Workspace Dependency Inheritance

**Problem:** Inherit a workspace dependency in a sub-crate `serde = { workspace = true }`.

**Expected output:**
> [!check]- Answer
> ```
> Workspace dependency inherited
> ```
> fn main() {
>     println!("Workspace dependency inherited");
> }
> ```
>
> **Explanation:** `workspace = true` inherits central version specifications defined in root `[workspace.dependencies]`.

---

---

## 6. Related Terms

- [`Cargo.toml`](../level_07/cargo_toml.md) — The file that defines the workspace.
- [Crate](../level_01/crate.md) — The individual packages that make up the workspace.

---

## 7. Key Takeaways

- A Workspace is a collection of one or more crates that share the same `Cargo.lock` and `/target` directory.
- It dramatically reduces compilation time and disk usage when working on multiple related crates, because shared dependencies (like `serde`) are only compiled once.
- The root `Cargo.toml` contains a `[workspace]` section with an array of `members`.
- "Virtual workspaces" have no `src` folder or `[package]` section at the root level; they just act as a container for other crates.
