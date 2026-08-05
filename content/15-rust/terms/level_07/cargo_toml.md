# `Cargo.toml`

> **Level 7 — Modules, Visibility & Project Structure**
> Manifest file defining package metadata, dependencies, features, and build configuration.

---

## 1. Prerequisites


- [Cargo](../level_01/cargo.md) — The build system that actually reads and executes this file.
- [Crate](../level_01/crate.md) — The compilation unit that this file describes.

---

## 2. Term Category

**Rust Tooling (the project manifest)**: Just as Node.js has `package.json`, and Python has `requirements.txt` or `pyproject.toml`, Rust has `Cargo.toml`. This single file is the absolute source of truth for your entire Rust project. It tells Cargo exactly how to build your code and what external libraries it needs to download.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The Rust designers wanted dependency management to be a first-class citizen. They didn't want developers suffering through chaotic `Makefiles` or manually downloading and linking C++ libraries. They built Cargo to handle all of this automatically. 

But Cargo needs a standardized instruction manual for every project. The `Cargo.toml` file provides this. It uses the **TOML** (Tom's Obvious, Minimal Language) format, which was specifically chosen because it is incredibly easy for humans to read and write compared to messy JSON (no trailing comma errors!) or fragile YAML (no hidden whitespace bugs!).

### (2) Reality Metaphor

Imagine you are baking a cake. 

You have a recipe. The `Cargo.toml` is the **Ingredients List** at the top of the recipe. It doesn't contain the actual cooking instructions (that's your Rust code in `src/main.rs`). Instead, it tells the chef (Cargo) exactly what supplies they need to buy from the grocery store (`crates.io`), and what tools they need to configure before they can even start cooking.

### (3) Rust Code Examples

#### Short Snippet (The Standard Manifest)
When you run `cargo new my_project`, it automatically generates a minimal `Cargo.toml` that looks like this:

```toml
# The [package] section contains the metadata about your project.
[package]
name = "my_project"
version = "0.1.0"
edition = "2021"
authors = ["Alice <alice@example.com>"]

# The [dependencies] section is where you list external libraries.
[dependencies]
# We are currently using 0 external dependencies!
```

#### Fuller Example (Advanced Configuration)
As your project grows, your `Cargo.toml` becomes much more powerful. You can define optional features and completely change how the compiler optimizes your code.

```toml
[package]
name = "super_server"
version = "1.2.0"
edition = "2021"

[dependencies]
tokio = { version = "1.0", features = ["full"] } # A dependency with specific features enabled
serde = "1.0" # A standard dependency

# 1. OPTIONAL FEATURES
# We let users of our library choose if they want to compile the "database" code,
# which requires downloading the heavy `sqlx` crate.
[features]
default = []
database_support = ["sqlx"]

# 2. COMPILER PROFILES
# We tell the compiler: "When building the final release version, strip out all
# debug symbols to make the file size smaller!"
[profile.release]
strip = true 
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using Spaces or Invalid Characters in Package Names

**The mistake:** Setting `name = "my awesome app"` in `Cargo.toml`.

**Why it is wrong:** Cargo package names can only contain ASCII letters, numbers, `-`, and `_`. Spaces trigger manifest parsing errors and publishing rejections on `crates.io`.

*Incorrect:*
```toml
[package]
name = "my awesome app" # ❌ Invalid package name!
```

*Fix:*
```toml
[package]
name = "my-awesome-app" # Correct!
```

### Mistake 2: Specifying Over-Generic 0.x Dependency Version Ranges

**The mistake:** Declaring `reqwest = "0"` in `[dependencies]`.

**Why it is wrong:** `0.x` pre-stable releases allow breaking API changes on every minor bump (`0.11` vs `0.12`). `reqwest = "0"` allows Cargo to resolve breaking pre-release updates.

*Incorrect:*
```toml
[dependencies]
reqwest = "0" # ❌ Too loose! Vulnerable to breaking 0.x API changes
```

*Fix:*
```toml
[dependencies]
reqwest = "0.11" # Locks within compatible 0.11.x minor series
```

### Mistake 3: Forgetting `package` Key When Renaming Dependencies

**The mistake:** Renaming a dependency key `serde2 = "2.0"` without specifying the upstream package name.

**Why it is wrong:** Cargo looks for a crate named `serde2` on `crates.io`. If you are aliasing a crate named `serde`, you must use `{ package = "serde", version = "2.0" }`.

---

## 5. Practice Exercises

### Exercise 1: Categorize the Config

**Problem:** Look at the following TOML lines. Which `[section]` do they belong under? `[package]` or `[dependencies]`?

1. `reqwest = "0.11"`
2. `version = "2.0.5"`
3. `edition = "2021"`
4. `rand = { version = "0.8", features = ["small_rng"] }`

> [!check]- Answer
> 1. `[dependencies]` (It's an external library)
> 2. `[package]` (It's the version of YOUR code)
> 3. `[package]` (It's the version of the Rust compiler to use)
> 4. `[dependencies]` (It's an external library with specific features requested)

---

### Exercise 2: Reading and Diagnosing a `Cargo.toml`

**Problem:**
A junior developer committed the following `Cargo.toml`. It compiles, but it has **three problems** that will cause issues for other developers or when publishing. Identify all three.

```toml
[package]
name = "my app"
version = "1"
edition = "2021"

[dependencies]
reqwest = "0"
serde = { version = "1.0", features = ["derive"] }
```

> [!check]- Answer
> **Problem 1: `name = "my app"` contains a space.**
> Crate names must use only ASCII letters, digits, `-`, and `_`. A space is illegal and will be rejected by `crates.io` publishing and may cause issues with some tools. Fix: `name = "my-app"` or `name = "my_app"`.
>
> **Problem 2: `version = "1"` is missing the minor and patch components.**
> Cargo accepts this syntactically (it treats `"1"` as a semver requirement `^1`), but it's ambiguous and non-standard for a `[package]` version. Package versions must be full semver (`MAJOR.MINOR.PATCH`). Fix: `version = "1.0.0"`.
>
> **Problem 3: `reqwest = "0"` is an extremely loose version constraint.**
> `"0"` matches any version in the `0.x.x` range. In semver, `0.x` versions are pre-stable and every `0.x` → `0.y` bump is permitted to be breaking. Today `reqwest` is at `0.11`; tomorrow it could resolve to `0.12` with breaking API changes. Fix: pin to the specific compatible series: `reqwest = "0.11"`.
>
> **Corrected `Cargo.toml`:**
> ```toml
> [package]
> name = "my-app"
> version = "1.0.0"
> edition = "2021"
>
> [dependencies]
> reqwest = "0.11"
> serde = { version = "1.0", features = ["derive"] }
> ```
>
> **Explanation:**
> `Cargo.toml` is both a build manifest and a publishing contract. Version constraints that are too loose (`"0"`) leave your build vulnerable to silent breaking upgrades; names with illegal characters fail at publish time; and non-standard version strings make automation tools (like `cargo semver-checks`) unreliable.

---

### Exercise 3: Renaming Dependencies — When and Why

**Problem:**
You are building a crate that depends on both `serde` version `1.0` and a fork called `serde2` — but `serde2`'s actual crate name on `crates.io` is also `serde` (at version `2.0`). Without renaming, Cargo would see two dependencies both named `serde` and reject the manifest.

Do the following:
1. Write the `Cargo.toml` `[dependencies]` section that pulls in both, aliasing the fork as `serde2` in your code.
2. Show how to `use` both in `src/lib.rs`.
3. Answer: besides version conflicts, name one other reason you might want to rename a dependency.

> [!check]- Answer
> **1. `Cargo.toml`:**
> ```toml
> [dependencies]
> # The real crate name on crates.io is "serde"; we use it under its normal name.
> serde = "1.0"
>
> # This is also named "serde" on crates.io (a fork), but we alias it to "serde2"
> # so it doesn't collide. The `package` key is the real crate name; the key
> # before `=` is what Cargo calls it locally (and what you write in `use`).
> serde2 = { package = "serde", version = "2.0" }
> ```
>
> **2. `src/lib.rs`:**
> ```rust
> // Use the stable serde normally.
> use serde::Serialize;
>
> // Use the forked serde under its alias.
> use serde2::Deserialize;
> ```
>
> **3. Another use case for renaming:**
> You depend on a crate whose name is a Rust keyword or conflicts with a local module name. For example, a crate literally named `async` or `type` would cause `use async::...` to be a parse error. Aliasing it to `async_lib = { package = "async", version = "1.0" }` lets you write `use async_lib::...` instead.
>
> **Explanation:**
> The `package` key in a dependency entry is the real name Cargo downloads from `crates.io`; the TOML key before `=` is the local alias — both the name you write in `use` statements and the name Cargo uses internally when building. This separation is what allows multiple versions of the same crate to coexist in one dependency graph.

---

## 6. Related Terms


- [Workspace](workspace.md) — How you use `Cargo.toml` to manage multiple separate crates inside a single mega-project repository.
- [Cargo](../level_01/cargo.md) — Related concept: Cargo.
- [Crate](../level_01/crate.md) — Related concept: Crate.
- [Build Scripts (`build.rs`)](build_scripts.md) — Related concept: Build Scripts (`build.rs`).
- [`Cargo.lock`](cargo_lock.md) — Related concept: `Cargo.lock`.
- [Edition](edition.md) — Related concept: Edition.
- [Feature Flags](feature_flags.md) — Related concept: Feature Flags.
- [Package](../level_01/package.md) — Related concept: Package.

---

## 7. Key Takeaways

- `Cargo.toml` is the absolute source of truth and instruction manual for your Rust project.
- It uses the simple TOML format, which relies on `[headers]` to separate configuration sections.
- The `[package]` section contains metadata about your project (name, version, authors).
- The `[dependencies]` section lists the external crates that Cargo needs to download from `crates.io`.
- You edit `Cargo.toml`, but you **NEVER** manually edit `Cargo.lock`!
