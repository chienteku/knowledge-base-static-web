# Cargo

> **Level 1 — Foundations**
> Rust's build system and package manager; used to create, build, test, and manage projects.

---

## 1. Prerequisites

**None.** Cargo is the very first tool you interact with in Rust. No prior Rust knowledge is required — just a working Rust installation (via [Rustup](../level_16/rustup.md)).

---

## 2. Term Category

**Rust-specific**

While the *concept* of a build system or package manager exists in other languages (npm, pip, Maven, Go modules), Cargo is Rust-specific in how it was designed from day one as an inseparable part of the Rust experience — not bolted on after the fact, but woven into the language's identity.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Let me tell you a story about the early days.

Before Rust shipped 1.0, we looked around at the state of systems programming tooling and saw fragmentation everywhere. In C and C++, there was no standard build system — teams picked between Make, CMake, Autotools, Meson, Bazel, and a dozen others. And package management? Even worse. You'd manually download libraries, wrestle with include paths, fight linker errors, and pray that the version you grabbed was compatible with everything else. Every C++ project was a snowflake.

We knew that if Rust was going to succeed, it couldn't just be a better *language*. It needed to be a better *experience*. So we asked ourselves: what if there was one tool that handled *everything* — creating projects, resolving dependencies, compiling code, running tests, generating documentation, and publishing libraries? What if it just worked, out of the box, for every Rust project on the planet?

That's Cargo.

The trade-off was opinionation. Cargo enforces conventions — your source goes in `src/`, your tests go alongside your code or in `tests/`, your manifest is always `Cargo.toml`. Some developers initially bristled at this. But the payoff was enormous: any developer can clone any Rust project and run `cargo build` with confidence. No setup guide, no tribal knowledge, no "works on my machine."

We also studied what npm got right (easy dependency installation, a central registry) and what it got wrong (dependency hell, lack of lock files in early versions). Cargo shipped with `Cargo.lock` from the start — reproducible builds were non-negotiable.

### (2) Reality Metaphor

Think of Cargo as a **general contractor building a house**.

You don't pour concrete, wire electricity, and plumb the pipes yourself. You tell the contractor what you want (the blueprint = `Cargo.toml`), and they:
- Source all the materials from suppliers (dependencies from [crates.io](../level_16/crates_io.md))
- Coordinate the subcontractors (compile your code and all dependencies in the right order)
- Inspect the work (run tests)
- Hand you the keys to the finished house (produce the final binary)

Without a general contractor, you'd be calling individual suppliers, scheduling workers, and resolving conflicts between the electrician and the plumber. Cargo eliminates that chaos.

### (3) Rust Code Examples

#### Short Snippet — Creating and running a project

```bash
# Create a new binary project
cargo new hello_cargo

# Move into the project directory
cd hello_cargo

# Build and run in one step
cargo run
```

Output:
```
   Compiling hello_cargo v0.1.0 (/path/to/hello_cargo)
    Finished dev [unoptimized + debuginfo] target(s)
     Running `target/debug/hello_cargo`
Hello, world!
```

#### Fuller Example — A real workflow with dependencies and tests

```toml
# Cargo.toml — the project manifest
[package]
name = "greeting_app"
version = "0.1.0"
edition = "2024"

[dependencies]
rand = "0.10"          # Adding an external dependency
```

```rust
// src/main.rs
use rand::Rng;

fn generate_greeting(name: &str) -> String {
    let greetings = ["Hello", "Hi", "Hey", "Greetings"];
    let mut rng = rand::rng();
    let index = rng.random_range(0..greetings.len()); // Pick a random greeting
    format!("{}, {}!", greetings[index], name)
}

fn main() {
    let greeting = generate_greeting("Rustacean");
    println!("{}", greeting);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn greeting_contains_name() {
        let result = generate_greeting("Alice");
        assert!(result.contains("Alice")); // The name should always appear
    }

    #[test]
    fn greeting_ends_with_exclamation() {
        let result = generate_greeting("Bob");
        assert!(result.ends_with('!'));
    }
}
```

```bash
# Common Cargo commands for this project:
cargo build          # Compile the project
cargo run            # Compile and run
cargo test           # Run all tests
cargo doc --open     # Generate and open documentation
cargo build --release  # Compile with optimizations for production
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to Commit Cargo.lock in Binary Applications

**The mistake:** Adding `Cargo.lock` to `.gitignore` when building an executable Rust binary project.

**Why it's wrong:** Binary applications rely on `Cargo.lock` to guarantee reproducible builds across developers and CI environments.

*Incorrect:*
```rust
# .gitignore
Cargo.lock // ❌ Breaks deterministic application builds!
```

*Fix:*
```rust
# .gitignore
# Keep Cargo.lock for binary projects to lock dependency trees
```

### Mistake 2: Confusing `cargo check` with `cargo build`

**The mistake:** Running `cargo build` repeatedly during rapid development iterations.

**Why it's wrong:** `cargo build` produces full machine code binary artifacts, whereas `cargo check` skips code generation and only verifies types, running significantly faster.

*Incorrect:*
```rust
$ cargo build # ❌ Slower turnaround during quick editing loops
```

*Fix:*
```rust
$ cargo check # FAST syntax and borrow checker validation
```

### Mistake 3: Specifying Wildcard Dependency Version Specifiers

**The mistake:** Writing `serde = "*"` inside `Cargo.toml` dependencies.

**Why it's wrong:** Wildcard versions pull breaking major updates unpredictably during compilation.

*Incorrect:*
```rust
# Cargo.toml
[dependencies]
serde = "*" // ❌ Unpredictable breaking changes
```

*Fix:*
```rust
# Cargo.toml
[dependencies]
serde = "1.0" // Semantic version range pin
```

## 5. Practice Exercises

### Exercise 1: Create and run your first project

**Problem:** Create a new Rust project called `my_first_app` that prints `"Rust is awesome!"` to the console. Build and run it using Cargo.

**Expected output:**
```
Rust is awesome!
```

> [!check]- Answer
> - Use `cargo new my_first_app` to scaffold the project
> - Edit `src/main.rs` to change the print message
> - Use `cargo run` to compile and execute in one step

### Exercise 2: Add a dependency and use it

**Problem:** Create a project called `colorful_hello` that uses the `colored` crate (version `3`) to print `"Hello, Rust!"` in green and bold to the terminal.

**Expected behavior:** The text "Hello, Rust!" appears in green and bold in your terminal.

> [!check]- Answer
> - Add `colored = "3"` under `[dependencies]` in `Cargo.toml`
> - In `src/main.rs`, add `use colored::Colorize;`
> - Use `"Hello, Rust!".green().bold()` inside `println!("{}", ...)`
> - Run with `cargo run` — Cargo will automatically download and compile the dependency

### Exercise 3: Write and run a test

**Problem:** In the `colorful_hello` project from Exercise 2, add a test module with a test that verifies `2 + 2 == 4`. Run all tests using Cargo.

**Expected output:**
```
running 1 test
test tests::math_works ... ok

test result: ok. 1 passed; 0 failed; 0 ignored
```

> [!check]- Answer
> - Add a `#[cfg(test)]` module at the bottom of `src/main.rs`
> - Inside it, write a function annotated with `#[test]`
> - Use `assert_eq!(2 + 2, 4);` as the assertion
> - Run `cargo test` to execute all tests

---

## 6. Related Terms

- [Crate](../level_01/crate.md) — the compilation unit that Cargo builds; every `cargo build` produces a crate
- [Package](../level_01/package.md) — a Cargo concept: one or more crates bundled with a `Cargo.toml` manifest
- [`Cargo.toml`](../level_07/cargo_toml.md) — the manifest file where you declare metadata, dependencies, and build settings
- [`Cargo.lock`](../level_07/cargo_lock.md) — the auto-generated lock file that pins exact dependency versions
- [Rustup](../level_16/rustup.md) — the toolchain manager that installs Cargo (and the Rust compiler) for you

---

## 7. Key Takeaways

- **Cargo is your single tool for everything** — creating projects, building, testing, documenting, and publishing. You rarely need to call `rustc` directly.
- **`Cargo.toml` is the blueprint** — it declares your project's metadata and dependencies. Cargo handles the rest.
- **Convention over configuration** — Cargo enforces a standard project layout (`src/`, `tests/`, `Cargo.toml`), which means every Rust project looks familiar.
- **Reproducible builds come free** — `Cargo.lock` pins exact dependency versions so builds are consistent across machines.
- **The ecosystem starts here** — Cargo connects to [crates.io](https://crates.io), giving you access to over 100,000 community libraries with a single line in `Cargo.toml`.
