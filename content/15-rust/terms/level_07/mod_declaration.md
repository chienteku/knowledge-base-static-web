# `mod` Declaration

> **Level 7 — Modules, Visibility & Project Structure**
> Declares a submodule; the compiler looks for `mod_name.rs` or `mod_name/mod.rs`.

---

## 1. Prerequisites


- [`fn` (Functions)](../level_01/fn.md) — The blocks of code you are trying to organize.
- [Struct](../level_02/struct.md) — The data structures you want to separate into different files.

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

### Mistake 1: Confusing `mod` Declarations with `use` Import Statements

**The mistake:** Writing `mod foo;` everywhere you want to call items inside `foo.rs`.

**Why it is wrong:** `mod foo;` registers a new module file into your crate tree once. It must be declared **only once** in the parent file. Accessing items from other files should be done with `use foo::item;`. Declaring `mod foo;` multiple times causes compiler errors (`error: duplicate definition of module 'foo'`).

*Incorrect:*
```rust
// In file_a.rs:
mod foo; // ❌ Duplicate module declaration!
```

*Fix:*
```rust
// Declare `mod foo;` once in lib.rs or main.rs, then write `use crate::foo;` in other files!
```

### Mistake 2: Assuming Creating a `.rs` File Automatically Registers it in Compilation

**The mistake:** Creating `src/network.rs` and expecting `cargo build` to compile it without adding `mod network;` to `src/main.rs`.

**Why it is wrong:** Rust only compiles files attached to the crate root tree. `src/network.rs` is ignored until declared via `mod network;`.

### Mistake 3: Mixing Legacy `mod.rs` Directories with Modern Edition Module File Naming

**The mistake:** Creating both `src/foo.rs` and `src/foo/mod.rs` in the same project directory.

**Why it is wrong:** In 2018+ editions, `src/foo.rs` acts as the module file for submodules located inside `src/foo/`. Coexisting `src/foo.rs` and `src/foo/mod.rs` causes ambiguous module resolution compiler errors.

---

## 5. Practice Exercises

### Exercise 1: The Invisible File

**Scenario:** You are building a game. You have a `main.rs` and you just created a `player.rs` file in the same folder. However, when you write `player::jump();` in your `main.rs`, the compiler says `use of undeclared crate or module 'player'`. How do you fix it?

> [!check]- Answer
> You must explicitly declare the module so the compiler knows the file exists! Add this to the top of your `main.rs`:
>
>
> #### Implementation
>
> ```rust
> mod player;
> ```

---

### Exercise 2: Inline vs File Module Declarations

**Scenario:** Declare an inline module `mod utils { pub fn ping() {} }` and call `utils::ping()`.

**Expected output:**
> [!check]- Answer
> ```
> Pinged
> ```
>
> #### Implementation
>
> ```rust
> mod utils {
>     pub fn ping() { println!("Pinged"); }
> }
> fn main() {
>     utils::ping();
> }
> ```
>
> #### Technical Explanation
> `mod name { ... }` defines inline submodules without separate file creation.

---

### Exercise 3: Nested Submodule Hierarchy Declarations

**Scenario:** Access `net::http::client::connect()` through nested module paths.

**Expected output:**
> [!check]- Answer
> ```
> Connected
> ```
>
> #### Implementation
>
> ```rust
> mod net { pub mod http { pub mod client { pub fn connect() { println!("Connected"); } } } }
> fn main() { net::http::client::connect(); }
> ```
>
> #### Technical Explanation
> Nested `mod` declarations establish hierarchical module paths.

---

## 6. Related Terms


- [`use` Statement](use_statement.md) — The keyword you use to actually *import* things from the modules you declare with `mod`.
- [`pub` Visibility](pub_visibility.md) — How you make the functions inside your modules visible to the rest of the project.
- [`pub(crate)` / `pub(super)`](pub_crate_super.md) — Related concept: `pub(crate)` / `pub(super)`.
- [Module](../level_01/module.md) — Related concept: Module.

---

## 7. Key Takeaways

- Rust does not automatically read files just because they are in your folder!
- **`mod name;`** explicitly tells the compiler to look for a file named `name.rs` or `name/mod.rs` and physically include it in the compiled project.
- You only declare a module with `mod` **exactly once** in your whole project (where it belongs in the tree).
- Do not confuse `mod` (which builds the tree) with `use` (which creates a shortcut to an item already in the tree).
