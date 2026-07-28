# Edition

> **Level 7 — Modules, Visibility & Project Structure**
> Rust edition (2015, 2018, 2021, 2024); opt-in language evolution without breaking backward compatibility.

---

## 1. Prerequisites

- [`Cargo.toml`](../level_07/cargo_toml.md) — The configuration file where you declare your Edition.
- [Cargo](../level_01/cargo.md) — The build system that enforces the Edition rules.

---

## 2. Term Category

**Rust Tooling (the time machine)**: If a programming language wants to add a new keyword (like `async`), it usually breaks millions of lines of existing code where people previously used `async` as a variable name! 

Historically, languages solve this by releasing a massive "Version 2.0" that breaks everything (like the infamous Python 2 to Python 3 transition). Rust solves this brilliantly with **Editions**: opt-in language snapshots released every 3 years.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The Rust core team made a strict promise: *Rust code written in 2015 must still compile perfectly on a modern compiler in 2050.* But they also needed to evolve the language! 

"Editions" are the solution. When you specify `edition = "2021"` in your `Cargo.toml`, you are telling the compiler exactly which dialect of Rust your code is written in. 

Because the Rust compiler knows how to read *all* dialects simultaneously, it can perfectly compile a 2015 crate, a 2018 crate, and a 2021 crate side-by-side in the exact same project, allowing them to seamlessly talk to each other!

### (2) Reality Metaphor

Imagine an English dictionary. 

In the 1800s, the word "awful" meant "full of awe" (something amazing). Today, it means "terrible". If you read an old book, you have to know which "Edition" of English the author was speaking, otherwise you will completely misunderstand the book! 

The Rust compiler is an incredibly smart, multi-lingual translator. It speaks 2015 Rust, 2018 Rust, and 2021 Rust perfectly. By telling it which Edition your code is written in, it knows exactly which dictionary to use when reading your files.

### (3) Rust Code Examples

#### Short Snippet (The Declaration)
You declare your edition at the very top of your `Cargo.toml` file.

```toml
[package]
name = "my_modern_app"
version = "0.1.0"
edition = "2021" # We are using the 2021 dictionary!
```

#### Fuller Example (The `async` keyword)
In 2015, the `async` keyword did not exist. Developers freely used it as a variable name. In 2018, Rust officially added the `async/await` feature.

**File: `2015_crate/src/main.rs` (edition = "2015")**
```rust
fn main() {
    // This perfectly compiles in the 2015 edition!
    // The compiler knows `async` is just a normal variable here.
    let async = 5;
    println!("Value: {}", async);
}
```

**File: `2018_crate/src/main.rs` (edition = "2018")**
```rust
fn main() {
    // SYNTAX ERROR in 2018 edition! 
    // `async` is now a reserved keyword. You cannot use it as a variable name!
    // let async = 5;
    
    // We are allowed to write async functions instead!
    // async fn fetch_data() {}
}
```
*Note: A modern compiler can compile BOTH of those crates at the same time in the same Workspace!*

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Edition Scoping and Lifecycle Rules

**The mistake:** Assuming Edition instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("edition_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("edition_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Edition State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Edition through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Edition Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Edition instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Time Traveler

**Problem:** You download a library crate that was written in 2018 (`edition = "2018"`). Your own project is written in 2021 (`edition = "2021"`). You add the 2018 library to your `[dependencies]`. When you run `cargo build`, will your project compile successfully? 

> [!check]- Answer
> **Yes, absolutely!**
>
> This is the magic of Rust Editions. The compiler will read the library using the 2018 dictionary, and it will read your code using the 2021 dictionary. They will perfectly link together without any errors!

---

### Exercise 2: Edition Keyword Changes in Practice

**Problem:**
Rust editions can reserve new keywords, which could break code that used those words as identifiers. The 2018 edition reserved `async`, `await`, and `try`. The 2021 edition reserved nothing new (it changed import rules instead).

Consider this code written in 2015:
```rust
// This was valid in edition 2015!
fn try(x: i32) -> i32 { x + 1 }
fn main() { println!("{}", try(5)); }
```

Answer the following:
1. What happens when you compile this with `edition = "2018"` in `Cargo.toml`?
2. How do you fix it WITHOUT renaming the function (so the public API stays the same)?
3. A library crate compiled under edition 2015 exposes `fn try()` as part of its public API. Your crate uses edition 2021. Can you still call it?

> [!check]- Answer
> **1. Compile error under edition 2018:**
> ```text
> error: expected expression, found reserved keyword `try`
> ```
> Because `try` became a reserved keyword in edition 2018, using it as a function name is a parse error. The compiler refuses to compile the file.
>
> **2. Fix WITHOUT renaming — use raw identifiers:**
> ```rust
> // `r#` prefix lets you use a keyword as an identifier in edition 2018+
> fn r#try(x: i32) -> i32 { x + 1 }
> fn main() { println!("{}", r#try(5)); }
> ```
> Raw identifiers (`r#name`) are the escape hatch for using keywords as identifiers. They are valid in edition 2018 and 2021, so this is both a fix and a forward-compatible API-preservation strategy.
>
> **3. Cross-edition interoperability:**
> **Yes, you can still call it.** Each crate is compiled under its own edition — the 2015 crate compiles `fn try()` successfully. From your edition 2021 crate, you call it using the raw identifier syntax: `library::r#try(5)`. Editions only affect the *syntax* of the source file being compiled, not the compiled binary interface (symbols, types, ABI) — so cross-edition function calls work seamlessly.
>
> **Explanation:**
> This is the fundamental promise of Rust editions: they never break cross-crate compatibility. New keywords in one edition don't make previously-published libraries unusable — raw identifiers bridge the gap.

---

### Exercise 3: Migrating Editions with `cargo fix --edition`

**Problem:**
You have a large 2018-edition crate and want to upgrade to 2021. Answer the following:

1. What is the exact command to run the automated edition migration?
2. What does `cargo fix --edition` actually change in your source code? Give two concrete examples.
3. After `cargo fix --edition` runs successfully, is your code guaranteed to compile under the new edition? What must you do manually?
4. Can `cargo fix --edition` break any existing tests or behavior?

> [!check]- Answer
> **1. The migration command:**
> ```bash
> cargo fix --edition
> ```
> Run this while your `Cargo.toml` still declares the OLD edition. After the command succeeds, manually change `edition = "2018"` to `edition = "2021"` in `Cargo.toml` and verify with `cargo build`.
>
> **2. What `cargo fix --edition` changes:**
> - **Import paths (2018 → 2021):** In 2021, the `use` prelude rules changed — `use` items in submodules no longer export into scope automatically. `cargo fix` rewrites ambiguous `use` statements to be explicit.
> - **Closure captures (2018 → 2021):** The 2021 edition tightened closure capture rules so closures only capture the specific fields they use (not the whole struct). `cargo fix` may rewrite `move || { use_field }` patterns where the old semantics required capturing more than the field.
>
> **3. Manual steps still required:**
> `cargo fix --edition` cannot fix everything automatically — it only handles patterns the compiler can detect and has a known mechanical fix for. After running it:
> 1. Change the `edition` field in `Cargo.toml` to the new edition.
> 2. Run `cargo build` and `cargo test` to catch any remaining issues.
> 3. Manually review any remaining compile errors (the compiler will explain each one).
>
> **4. Can it break behavior?**
> Theoretically yes — if your code relied on the old closure capture semantics in a subtle way, the new narrower captures could change what gets moved into a closure. In practice this is rare and the compiler will catch type errors from it. `cargo fix --edition` is a safe starting point, not a guarantee of zero-diff semantics.
>
> **Explanation:**
> Edition migrations are designed to be low-risk and incremental. The Rust team writes automated fixes for the vast majority of required changes. The recommended approach is always: run `cargo fix --edition`, then manually bump the edition key, then review with `cargo test`.

---

## 6. Related Terms

- [`Cargo.toml`](../level_07/cargo_toml.md) — Where the edition is declared.
- [Workspace](../level_07/workspace.md) — Where you often see multiple crates living side-by-side with completely different Editions!

---

## 7. Key Takeaways

- Editions are snapshots of the Rust language released every 3 years (2015, 2018, 2021, 2024...).
- They allow the Rust team to add new keywords and syntax to the language **without** breaking old code.
- The modern Rust compiler can compile a 2015 crate and a 2024 crate side-by-side in the exact same project!
- You declare your edition in the `[package]` section of your `Cargo.toml`.
- You **do not** need an old compiler to compile old Editions. Always use the newest compiler!
