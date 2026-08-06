# `[dependencies]`

> **Level 7 — Modules, Visibility & Project Structure**
> Section in `Cargo.toml` for declaring external crate dependencies.

---

## 1. Prerequisites


- [`Cargo.toml`](cargo_toml.md) — The configuration file where this section lives.
- [Cargo](../level_01/cargo.md) — The program that reads this section and does all the hard work.
- [Crate](../level_01/crate.md) — The external libraries you are actually importing.

---

## 2. Term Category

**Rust Tooling (the library importer)**: The Rust standard library is intentionally kept very small. Things like random number generation, HTTP requests, async runtimes, and JSON parsing are not built-in! 

To get these features, you must rely on the open-source community by downloading Crates from `crates.io`. The `[dependencies]` section in your `Cargo.toml` file is where you list exactly what community crates your project needs.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In older systems languages like C++, adding an external library was a nightmare. You had to download zip files, configure Makefiles, match compilation targets manually, and fight linker errors. 

The Rust team wanted dependency management to be completely frictionless. By simply typing the name and version of a library under `[dependencies]`, Cargo handles 100% of the downloading, configuring, linking, and compiling automatically. It completely abstracts away the nightmare of manual dependency management.

### (2) Reality Metaphor

Imagine you are building a House. 

You don't know how to build a toilet from scratch. You don't want to build a toilet from scratch. So, you just write *"Toilet (Version 1.2)"* on your shopping list (`[dependencies]`). 

The general contractor (Cargo) takes your list, drives to Home Depot (`crates.io`), buys the exact toilet you asked for, drives it back to the house, and seamlessly plumbs it into your walls so you can just use it immediately.

### (3) Rust Code Examples

#### Short Snippet (The Standard Import)
Here is how you add the popular `rand` crate to your project so you can generate random numbers.

**File: `Cargo.toml`**
```toml
[package]
name = "my_game"
version = "0.1.0"
edition = "2021"

[dependencies]
# We tell Cargo we want the `rand` crate, version 0.8
rand = "0.8"
```

Once you save this file, you can immediately start using `rand::random()` in your `main.rs` file! The next time you run `cargo build`, Cargo will magically download it for you.

#### Fuller Example (The 3 Ways to Import)
Sometimes you need more than just a version number. Here are the three most common ways to define a dependency.

```toml
[dependencies]

# 1. THE STANDARD WAY (From crates.io)
# Just the name and the version string.
serde = "1.0"

# 2. THE FEATURES WAY (Opt-in to specific parts of a crate)
# Some crates are huge. We use curly braces to say we only want 
# the `json` parsing feature, saving us from compiling the rest of the crate!
serde_json = { version = "1.0", features = ["alloc"] }
tokio = { version = "1.30", features = ["full"] }

# 3. THE LOCAL PATH WAY (For Workspaces)
# We don't want to download this from the internet. We want Cargo to 
# look in a folder on our local hard drive!
my_shared_types = { path = "../my_shared_types" }
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Omitting Quotes Around Version Strings in `Cargo.toml`

**The mistake:** Writing `rand = 0.8` instead of `rand = "0.8"`.

**Why it is wrong:** `Cargo.toml` uses TOML format rules. Unquoted `0.8` is parsed as a floating-point number, causing a manifest syntax error.

*Incorrect:*
```toml
[dependencies]
rand = 0.8 # ❌ TOML syntax error!
```

*Fix:*
```toml
[dependencies]
rand = "0.8" # Correct!
```

### Mistake 2: Relying on Unpinned `branch = "master"` Git Dependencies in Production

**The mistake:** Setting `rand = { git = "https://github.com/rust-random/rand", branch = "master" }`.

**Why it is wrong:** Unpinned git branches cause non-deterministic builds across developer machines whenever upstream pushes commits. Pin to a specific commit SHA via `rev = "..."`.

### Mistake 3: Forgetting `optional = true` When Declaring Opt-In Feature Dependencies

**The mistake:** Adding `serde = { version = "1.0" }` and listing `json = ["serde"]` in `[features]` without `optional = true`.

**Why it is wrong:** Without `optional = true`, Cargo forces compilation of `serde` for all users even when `json` feature is disabled.

---

## 5. Practice Exercises

### Exercise 1: The Syntax Error

**Scenario:** You are trying to add the `rand` crate to your project. You open `Cargo.toml` and write the following line. When you run `cargo build`, it throws a parsing error. What is wrong with the line?

```toml
[dependencies]
rand = 0.8
```

> [!check]- Answer
> You forgot the quotes! `Cargo.toml` uses the TOML format, and version numbers must always be Strings.
>
> ```toml
> [dependencies]
> rand = "0.8"
> ```
> 
---

### Exercise 2: Optional Dependencies — The Full Pattern

**Scenario:**
You are writing a serialization library. By default, you want zero dependencies. But users who want JSON support should be able to opt in to `serde` without it being forced on everyone.

Write the complete `Cargo.toml` configuration that:
1. Declares `serde` as an optional dependency with `derive` feature.
2. Creates a `[features]` section with a `json` feature that activates `serde`.
3. Shows the `[dependencies]` entry for a downstream user who wants JSON support.
4. Shows the `#[cfg(feature = "json")]` guard in `src/lib.rs` that uses `serde::Serialize`.

Then answer: **if a downstream user writes `my_lib = "1.0"` with no features, does `serde` get compiled into their binary?**

> [!check]- Answer
> **Your library's `Cargo.toml`:**
> ```toml
> [package]
> name = "my_lib"
> version = "1.0.0"
> edition = "2021"
>
> [features]
> # Activating "json" pulls in the serde optional dependency.
> json = ["dep:serde"]
>
> [dependencies]
> # optional = true means serde is NOT compiled unless a feature activates it.
> serde = { version = "1.0", features = ["derive"], optional = true }
> ```
>
> **Your `src/lib.rs`:**
>
> #### Implementation
>
> ```rust
> // Only compiled (and serde only linked) when the "json" feature is active.
> #[cfg(feature = "json")]
> pub use serde::Serialize;
>
> #[cfg(feature = "json")]
> pub fn serialize_example() -> &'static str {
>     "serde is available"
> }
> ```
>
> **A downstream user's `Cargo.toml` — opting IN:**
> ```toml
> [dependencies]
> my_lib = { version = "1.0", features = ["json"] }
> ```
>
> **Answer to the "no features" question:**
> **No** — `serde` is not compiled at all. `optional = true` means the dependency only enters the build graph when a feature that references it is activated. A plain `my_lib = "1.0"` has zero serde overhead: no download, no compile time, no binary size increase. This is how large libraries like `chrono` and `reqwest` keep their default build lean while offering rich opt-in functionality.
> 
---

### Exercise 3: Git Dependencies — When, How, and the Risks

**Scenario:**
You need to use a bug-fix commit in `rand` that was merged to `master` but hasn't been published to `crates.io` yet. Answer the following:

1. Write the `Cargo.toml` entry for a git dependency on `rand`'s `master` branch.
2. Write the entry pinned to a specific commit SHA instead.
3. You are on a team of 5 developers. What reproducibility problem does the `branch = "master"` approach introduce, and how does pinning to a `rev` solve it?
4. When the fix is finally published as `rand = "0.8.6"` on `crates.io`, should you switch back? Why?

> [!check]- Answer
> **1. Git dependency on a branch:**
> ```toml
> [dependencies]
> rand = { git = "https://github.com/rust-random/rand", branch = "master" }
> ```
>
> **2. Git dependency pinned to a specific commit:**
> ```toml
> [dependencies]
> rand = { git = "https://github.com/rust-random/rand", rev = "a1b2c3d4" }
> ```
> (Replace `a1b2c3d4` with the actual full or short SHA of the commit you need.)
>
> **3. Reproducibility problem with `branch = "master"`:**
> If `Cargo.lock` is not committed (or if a teammate runs `cargo update`), each developer may silently resolve to a different commit on `master` — whatever happened to be the HEAD at the time of their build. Developer A might have the fix; Developer B, building an hour later after a new commit was pushed, might have a regression. With `rev = "a1b2c3d4"`, `Cargo.lock` pins the exact commit for everyone; `cargo update` cannot change it without manually editing `Cargo.toml`.
>
> **4. Switch back to `crates.io` when the fix is published:**
> **Yes, always.** Git dependencies have significant downsides:
> - They require network access to the git host at every `cargo build` on a fresh checkout.
> - They cannot be published to `crates.io` (crates.io rejects manifests with git dependencies).
> - They bypass the security audit and checksum verification that `crates.io` + `Cargo.lock` provides.
>
> Switch back as soon as the fixed version is published: `rand = "0.8.6"`.
>
> #### Technical Explanation
>
> Git dependencies are a short-term escape hatch, not a long-term solution. Use `rev` (not `branch`) if you must use one, commit your `Cargo.lock`, and migrate to a published version as soon as possible.
> 
---

## 6. Related Terms


- [`Cargo.toml`](cargo_toml.md) — The file that this section lives inside.
- [Workspace](workspace.md) — The feature that heavily uses local `{ path = "..." }` dependencies.
- [Cargo](../level_01/cargo.md) — The program that actually reads this section and downloads the crates.

---

## 7. Key Takeaways

- The `[dependencies]` section is where you list external crates from `crates.io`.
- Adding a crate is as simple as writing `name = "version"`.
- Cargo handles downloading, caching, linking, and compiling the crates automatically.
- Rust uses standard SemVer. `"1.0"` means Cargo is allowed to download any `1.x.x` version, but will never automatically upgrade you to `2.0.0`.
