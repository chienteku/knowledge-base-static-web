# Cargo CLI

> **Level 7 — Rust**
> Rust's official build system and package manager command-line interface — commands include `cargo build`, `cargo run`, `cargo test`, `cargo add`, and `cargo publish`.

---

## 1. Prerequisites

- [Cargo](../level_01/cargo.md) — Core build system and package manager.
- [`Cargo.toml`](cargo_toml.md) — Package configuration manifest.

---

## 2. Term Category

**Build Tooling (package manager & build orchestrator)**: The `cargo` CLI is Rust's official build tool and package manager executable that automates dependency fetching, package compilation, test execution, benchmark running, documentation generation, and crate publishing.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Without an integrated build tool, compiling C/C++ or early Rust projects required manual `Makefile` creation, shell script configuration, and manual library header linking.

Cargo unifies the Rust ecosystem into a single command-line interface:
- **`cargo check`**: Fast type-checking pass without LLVM code generation for instant editor feedback.
- **`cargo build`**: Compiles the current crate and all resolved dependencies into binary/library artifacts.
- **`cargo test`**: Discovers and executes unit, integration, and documentation tests concurrently.
- **`cargo run`**: Compiles and executes binary targets in a single command.
- **`cargo publish`**: Packages and uploads crates to `crates.io`.

### (2) Debug vs Release Compilation Modes

By default, `cargo build` compiles in **Debug mode** (`target/debug/`), enabling `panic!` stack traces, runtime integer overflow checks, and zero LLVM optimization passes for fast compilation speed.

Passing `--release` (`cargo build --release`) switches Cargo to **Release mode** (`target/release/`), enabling aggressive LLVM optimizations (`opt-level = 3`), dead-code elimination, and vectorization for maximum runtime performance.

### (3) Reality Metaphor

A master construction general contractor: when you issue a project blueprint (`Cargo.toml`), the contractor (`cargo`) orders materials from suppliers (`crates.io`), organizes construction crews, runs building code inspections (`cargo check`), performs safety testing (`cargo test`), and hands over the finished keys (`cargo run`).

### (4) Rust Code Examples

#### Essential Cargo CLI Workflow Commands
```bash
# Fast type checking without code generation (fastest development loop)
$ cargo check

# Build debug binary
$ cargo build

# Build fully optimized production release binary
$ cargo build --release

# Add a dependency to Cargo.toml automatically
$ cargo add serde --features derive

# Run all unit and integration tests
$ cargo test -- --nocapture
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using `cargo build` Instead of `cargo check` During Development Feedback Loops

**The mistake:** Constantly running `cargo build` after editing code to check for syntax and type errors.

**Why it is wrong:** `cargo build` invokes LLVM code generation and linking. `cargo check` skips code generation, running up to 5x faster to report type errors.

*Incorrect:*
```bash
cargo build # Slow feedback loop during quick edits!
```

*Fix:*
```bash
cargo check # Ultra-fast type checking feedback!
```

### Mistake 2: Benchmarking Performance Without the `--release` Flag

**The mistake:** Executing performance benchmarks using default `cargo run` or `cargo test`.

**Why it is wrong:** Debug builds include runtime overflow checks and zero LLVM optimizations, executing 10x-100x slower than release builds.

*Incorrect:*
```bash
cargo run # Debug mode performance measurements are invalid!
```

*Fix:*
```bash
cargo run --release # Enables full LLVM optimizations!
```

### Mistake 3: Committing `Cargo.lock` for Published Library Crates

**The mistake:** Committing `Cargo.lock` inside reusable library crates published to `crates.io`.

**Why it is wrong:** Downstream applications ignore library `Cargo.lock` files during dependency resolution. Lockfiles should be committed for application binaries, not libraries.

---

## 5. Practice Exercises

### Exercise 1: Cargo Command Flag Dispatch Simulator

**Scenario:** Build a CLI argument dispatcher `dispatch_cargo_command(args: &[&str]) -> &'static str` matching common Cargo commands (`build`, `test`, `check`, `--release`).

**Requirements:**
1. Implement `dispatch_cargo_command`.
2. Differentiate between debug build and release build options.
3. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn dispatch_cargo_command(args: &[&str]) -> &'static str {
>     if args.contains(&"check") {
>         "Fast Type Check"
>     } else if args.contains(&"test") {
>         "Execute Test Suite"
>     } else if args.contains(&"build") {
>         if args.contains(&"--release") {
>             "Optimized Release Build"
>         } else {
>             "Unoptimized Debug Build"
>         }
>     } else {
>         "Unknown Cargo Command"
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_cargo_command_dispatcher() {
>         assert_eq!(dispatch_cargo_command(&["check"]), "Fast Type Check");
>         assert_eq!(dispatch_cargo_command(&["build", "--release"]), "Optimized Release Build");
>         assert_eq!(dispatch_cargo_command(&["test"]), "Execute Test Suite");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Simulates Cargo CLI flag parsing logic for build modes.
> 2. `cargo check` bypasses LLVM code generation for fast execution.

---

### Exercise 2: SemVer Dependency Constraint Compatibility Evaluator

**Scenario:** Implement a semantic version matching function `is_semver_compatible(constraint: &str, target_version: &str) -> bool` evaluating caret constraints (`^1.2.0`).

**Requirements:**
1. Handle caret requirements (`^1.2.0`).
2. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn is_semver_compatible(constraint: &str, target_version: &str) -> bool {
>     if let Some(req) = constraint.strip_prefix('^') {
>         let req_major = req.split('.').next().unwrap_or("0");
>         let ver_major = target_version.split('.').next().unwrap_or("0");
>         req_major == ver_major
>     } else {
>         constraint == target_version
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_semver_compatibility() {
>         assert!(is_semver_compatible("^1.0.0", "1.4.2"));
>         assert!(!is_semver_compatible("^1.0.0", "2.0.0"));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Caret requirements (`^1.2.0`) permit non-breaking updates within the same major version series.
> 2. Mimics Cargo dependency version selection algorithms.

---

### Exercise 3: Cargo Profile Optimization Level Query

**Scenario:** Implement `get_profile_opt_level(is_release: bool) -> u8` returning `0` for debug builds and `3` for release builds.

**Requirements:**
1. Return opt-level integer.
2. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn get_profile_opt_level(is_release: bool) -> u8 {
>     if is_release { 3 } else { 0 }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_profile_opt_levels() {
>         assert_eq!(get_profile_opt_level(false), 0);
>         assert_eq!(get_profile_opt_level(true), 3);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Debug builds (`opt-level = 0`) prioritize fast compilation.
> 2. Release builds (`opt-level = 3`) enable full LLVM compiler optimizations.

---

## 5. Related Terms

- [Release Profile](../level_15/release_profile.md)
- [Rustup](../level_16/rustup.md)
- [Miri (UB Detector)](../level_13/miri_ub_detector.md) — Related concept: Miri (UB Detector).

---

## 7. Key Takeaways

- Cargo is Rust's official package manager and build system.
- Use `cargo check` for fast compilation error checking during editing.
- Always append `--release` when compiling binaries for performance benchmarks or deployment.
- Commit `Cargo.lock` for application binaries; omit for library crates.
