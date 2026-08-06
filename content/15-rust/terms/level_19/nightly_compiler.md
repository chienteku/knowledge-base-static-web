# Nightly Rust Compiler

> **Level 19 — Rust**
> The bleeding-edge Rust release channel providing access to unstable features gated by `#![feature(...)]` attributes.

---

## 1. Prerequisites

- [Rustup](../level_16/rustup.md) — Rustup toolchain installer.

---

## 2. Term Category



**Rust Release Channel (experimental compiler feature channel)**: The Rust Nightly release channel (`rustup default nightly`).

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Rust stability guarantees that code compiling on stable Rust will never break on future stable releases. To test new language features without breaking stability guarantees, Rust provides the Nightly release channel.

Nightly builds allow developers and library authors to opt into experimental language features using `#![feature(...)]` flags, providing feedback to the Rust core team before stabilization.

### (2) Reality Metaphor

A car manufacturer's secret test track: prototype concept cars are driven at high speeds to test experimental engine designs before approving them for commercial assembly line production.

### (3) Rust Code Examples

#### Short Snippet
```rust
// #![feature(coroutines)]
// Installed via: rustup toolchain install nightly
```

#### Fuller Example
```rust
// Build with: cargo +nightly build
fn main() {
    println!("Nightly channel unlocks experimental compiler feature flags!");
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using Nightly Features in Production Crates

**The mistake:** Relying on unstable `#![feature(...)]` flags for production library crates.

**Why it is wrong:** Unstable features can undergo breaking syntax or semantic changes in any nightly build.

*Incorrect:*
```rust
#![feature(unstable_feature)]
```

*Fix:*
```rust
Use stable Rust features for production software crates!
```

### Mistake 2: Forgetting to Specify Toolchain Override

**The mistake:** Attempting to compile a nightly crate with stable `cargo build`.

**Why it is wrong:** Stable compiler rejects `#![feature(...)]` attributes with a compilation error.

*Incorrect:*
```rust
cargo build
```

*Fix:*
```rust
cargo +nightly build (or create a rust-toolchain.toml file!)
```

### Mistake 3: Failing to Pin Nightly Toolchain Version

**The mistake:** Using `nightly-latest` in CI pipelines without pinning the date.

**Why it is wrong:** Daily nightly updates can occasionally break unstable features. Pin exact dates in CI.

*Incorrect:*
```rust
toolchain: nightly
```

*Fix:*
```rust
toolchain: nightly-2026-08-01
```

---

## 5. Practice Exercises

### Exercise 1: Toolchain Configuration File Generator

**Scenario:** Generate a `rust-toolchain.toml` configuration pinning a specific nightly compiler version.

**Requirements:**
1. Implement `generate_toolchain_file(channel: &str, date: &str) -> String`.
1. Verify file contents.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn generate_toolchain_file(channel: &str, date: &str) -> String {
>     format!("[toolchain]\nchannel = \"{channel}-{date}\"\ncomponents = [\"rust-analyzer\", \"rust-src\"]")
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_toolchain_generation() {
>         let content = generate_toolchain_file("nightly", "2026-08-01");
>         assert!(content.contains("nightly-2026-08-01"));
>         assert!(content.contains("rust-analyzer"));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Pinning exact nightly dates in `rust-toolchain.toml` ensures reproducible CI builds.
> 2. Prevents breaking changes from daily toolchain updates.

---

### Exercise 2: Experimental Feature Gate Parser

**Scenario:** Parse crate source files for `#![feature(...)]` gate declarations.

**Requirements:**
1. Parse string for feature gates.
1. Return list of enabled features.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn extract_features(source: &str) -> Vec<&str> {
>     let mut features = Vec::new();
>     for line in source.lines() {
>         if line.starts_with("#![feature(") && line.ends_with(")]") {
>             let inner = &line[11..line.len() - 2];
>             features.push(inner.trim());
>         }
>     }
>     features
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_feature_extraction() {
>         let src = "#![feature(coroutines)]\n#![feature(specialization)]";
>         let feats = extract_features(src);
>         assert_eq!(feats, vec!["coroutines", "specialization"]);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Identifies unstable feature gates used in nightly crates.
> 2. Helpful for audit tools.

---

### Exercise 3: Nightly Compiler Warning Filter

**Scenario:** Filter compiler warning outputs for unstable feature deprecation notices.

**Requirements:**
1. Filter log lines for warnings.
1. Count warnings.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn count_unstable_warnings(logs: &[&str]) -> usize {
>     logs.iter().filter(|&&l| l.contains("warning: the feature") && l.contains("is incomplete")).count()
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_warning_filter() {
>         let logs = vec![
>             "warning: the feature `specialization` is incomplete",
>             "compiling crate v0.1.0",
>         ];
>         assert_eq!(count_unstable_warnings(&logs), 1);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Identifies incomplete feature warnings emitted by nightly rustc.
> 2. Helps track feature stability status.

---

## 6. Related Terms

- [Specialization](specialization.md) — Unstable specialization.
- [Generators Coroutines](generators_coroutines.md) — Unstable coroutines.

---

## 7. Key Takeaways

- Nightly compiler channel unlocks experimental `#![feature(...)]` flags.
- Allows testing upcoming language features before stabilization.
- Avoid using unstable features in production crates.
- Pin exact nightly toolchain dates in `rust-toolchain.toml` for reproducible builds.
