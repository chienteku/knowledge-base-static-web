# `Cargo.lock`

> **Level 7 — Modules, Visibility & Project Structure**
> Lock file pinning exact dependency versions for reproducible builds.

---

## 1. Prerequisites

- [`Cargo.toml`](../level_07/cargo_toml.md) — The human-written file that tells Cargo what to put in the lockfile.
- [`[dependencies]`](../level_07/dependencies_section.md) — The specific section that triggers the lockfile to be populated.

---

## 2. Term Category

**Rust Tooling (the historical record)**: While `Cargo.toml` is a set of flexible requirements (*"I need some version of `serde` compatible with 1.0"*), `Cargo.lock` is a massive, highly specific, machine-generated historical record of the exact versions that were downloaded (*"I downloaded exactly `serde` version 1.0.197, and its sub-dependency `serde_derive` version 1.0.197, and here are the cryptographic hashes to prove it"*).

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

*"It works on my machine!"* 

This is the most dreaded phrase in software engineering. If `Cargo.toml` was the only file that existed, your coworker downloading your code 6 months from now might get completely different, newer versions of your dependencies. A tiny bug in one of those new dependencies could cause the code to randomly break on their machine, even though it works perfectly on yours.

To solve this, Cargo auto-generates `Cargo.lock`. Once it figures out a combination of dependencies that successfully compiles, it freezes that exact state into the lockfile. If you share `Cargo.lock` with your coworker, Cargo will ignore the internet and perfectly recreate your exact environment. This guarantees **Reproducible Builds**.

### (2) Reality Metaphor

- **`Cargo.toml`** is a cooking recipe that says: *"Buy 1 bag of flour."* It is flexible.
- **`Cargo.lock`** is the grocery store receipt that says: *"Bought 1 bag of King Arthur All-Purpose Unbleached Flour, Lot #5992, at 3:14 PM on Tuesday."*

The recipe is an instruction. The lockfile is a frozen record of history.

### (3) Rust Code Examples

#### Short Snippet (The Difference)
You should never edit `Cargo.lock` by hand, but if you open it, you will immediately see how different it is from `Cargo.toml`.

**What you write (`Cargo.toml`)**:
```toml
[dependencies]
rand = "0.8"
```

**What Cargo auto-generates (`Cargo.lock`)**:
```toml
# A massive file containing hundreds of lines!
[[package]]
name = "rand"
version = "0.8.5"
source = "registry+https://github.com/rust-lang/crates.io-index"
checksum = "34af8d1a0e25924bc5b7c43c079c942339d8f0a8b57c39049bef581b46327404"
dependencies = [
 "libc",
 "rand_chacha",
 "rand_core",
]

# (And then it lists exact versions for libc, rand_chacha, etc...)
```

#### Fuller Example (How to update it safely)
Since you can never edit the file by hand, how do you update your dependencies when a new bug fix comes out?

You use the terminal!

```bash
# 1. Update everything!
# Cargo checks the internet, finds newer compatible versions,
# and overwrites `Cargo.lock` for you.
cargo update

# 2. Update a specific crate safely
cargo update -p rand
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Cargo Lock Scoping and Lifecycle Rules

**The mistake:** Assuming Cargo Lock instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("cargo_lock_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("cargo_lock_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Cargo Lock State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Cargo Lock through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Cargo Lock Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Cargo Lock instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Code Review

**Problem:** You are doing a Code Review for a junior developer. They are building a command-line tool (a binary). You notice they have manually modified a number inside `Cargo.lock`, and they have also added `Cargo.lock` to the `.gitignore` file. 

What two pieces of feedback should you give them?

> [!check]- Answer
> 1. **Never edit `Cargo.lock` manually!** If they want to change a dependency, they should edit `Cargo.toml` or run `cargo update`.
> 2. **Remove it from `.gitignore`!** Because they are building a binary application, the lockfile MUST be committed to version control to guarantee reproducible builds for the rest of the team.

---

### Exercise 2: Updating Specific Dependencies via Cargo

**Problem:** Command line instruction to update only the `serde` package in `Cargo.lock`.

**Expected output:**
> [!check]- Answer
> ```
> cargo update -p serde
> ```
> ```rust
> fn main() {
>     println!("cargo update -p serde");
> }
> ```
>
> **Explanation:** `cargo update -p <pkg>` updates specified dependency entries in `Cargo.lock` to latest semver-compatible versions.

---

### Exercise 3: Library vs Binary Lockfile Commit Practices

**Problem:** State whether `Cargo.lock` should be committed for libraries vs binaries.

**Expected output:**
> [!check]- Answer
> ```
> Binaries: Commit lockfile. Libraries: Ignore or test minimal versions.
> ```
> fn main() {
>     println!("Binaries: Commit lockfile. Libraries: Ignore or test minimal versions.");
> }
> ```
>
> **Explanation:** Libraries leave version resolution to downstream applications.

---

## 6. Related Terms

- [`Cargo.toml`](../level_07/cargo_toml.md) — The human-written recipe that generates the lockfile.
- [`[dependencies]`](../level_07/dependencies_section.md) — The section that triggers the massive web of sub-dependencies to be written into the lockfile.

---

## 7. Key Takeaways

- `Cargo.lock` is a machine-generated file that pins the exact, hyper-specific versions of every dependency (and sub-dependency) in your project.
- It ensures **Reproducible Builds** (if it compiles on your machine today, it will compile on your coworker's machine exactly the same way in 6 months).
- **NEVER** manually edit `Cargo.lock`. Use `cargo update` in the terminal to safely upgrade dependencies.
- **Rule of thumb**: Commit `Cargo.lock` to git for Binary applications. Do NOT commit it for Libraries.
