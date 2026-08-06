# `Cargo.lock`

> **Level 7 — Modules, Visibility & Project Structure**
> Lock file pinning exact dependency versions for reproducible builds.

---

## 1. Prerequisites


- [`Cargo.toml`](cargo_toml.md) — The human-written file that tells Cargo what to put in the lockfile.

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

### Mistake 1: Manually Editing `Cargo.lock` in a Code Editor

**The mistake:** Trying to hand-edit dependency versions or SHA-256 checksum hashes directly inside `Cargo.lock`.

**Why it is wrong:** `Cargo.lock` is a machine-generated file containing strict cryptographic checksums. Manually modifying text causes checksum verification panics during `cargo build` (`checksum mismatch`).

*Incorrect:*
```toml
# Manually changing version = "0.8.5" to "0.8.6" inside Cargo.lock!
```

*Fix:*
```bash
$ cargo update -p rand # Run cargo update command to re-resolve lockfile entries!
```

### Mistake 2: Adding `Cargo.lock` to `.gitignore` in Application Binary Repositories

**The mistake:** Adding `Cargo.lock` to `.gitignore` in application binaries (web servers, CLI tools, services).

**Why it is wrong:** Ignores locked dependency versions across CI/CD environments and developer machines, leading to "works on my machine" bugs when new transitive dependencies publish breaking changes.

*Incorrect:*
```text
# .gitignore
Cargo.lock # ❌ Wrong for application binaries!
```

*Fix:*
```text
# Always commit Cargo.lock for binary applications; ignore only for published libraries!
```

### Mistake 3: Running Blind `cargo update` Without Running Automated Test Suites

**The mistake:** Running `cargo update` on production systems without re-testing application suites.

**Why it is wrong:** Upgrades all compatible minor/patch dependencies to latest registry releases. Subtle breaking changes or upstream regressions in transitive crates can break builds.

---

## 5. Practice Exercises

### Exercise 1: The Code Review

**Scenario:** You are doing a Code Review for a junior developer. They are building a command-line tool (a binary). You notice they have manually modified a number inside `Cargo.lock`, and they have also added `Cargo.lock` to the `.gitignore` file. 

What two pieces of feedback should you give them?

> [!check]- Answer
> 1. **Never edit `Cargo.lock` manually!** If they want to change a dependency, they should edit `Cargo.toml` or run `cargo update`.
> 2. **Remove it from `.gitignore`!** Because they are building a binary application, the lockfile MUST be committed to version control to guarantee reproducible builds for the rest of the team.

---

### Exercise 2: Surgical Dependency Updates

**Scenario:**
Your team runs `cargo audit` and finds a security advisory for version `0.8.3` of `rand`. The latest patched version is `0.8.6`. You have 20 other dependencies you do NOT want to change. Answer the following:

1. What command updates **only** `rand` in `Cargo.lock` (staying within the semver range declared in `Cargo.toml`)?
2. What if the fix is in `rand_core` (a transitive dependency you never mentioned in `Cargo.toml`)? Can you update it with the same approach?
3. You want to update `rand` to a major version (`0.9.x`) that exceeds your current `Cargo.toml` range `rand = "0.8"`. Does `cargo update -p rand` handle this? What must you do instead?

> [!check]- Answer
> **1. Updating a single named dependency:**
> ```bash
> cargo update -p rand
> ```
> Cargo re-resolves only `rand` (and its transitive deps if required) to the newest version that still satisfies the `"0.8"` semver constraint in `Cargo.toml`. All other `Cargo.lock` entries remain byte-for-byte unchanged.
>
> **2. Updating a transitive dependency:**
> Yes — `cargo update -p rand_core` works exactly the same even if `rand_core` is not in your `Cargo.toml`. Cargo owns the full dependency graph in `Cargo.lock`, including transitive entries. You can pin, update, or inspect any node regardless of whether it's a direct or indirect dependency.
>
> **3. Crossing a major version boundary:**
> `cargo update -p rand` will **not** jump from `0.8.x` to `0.9.x` because `0.9` is outside the `"0.8"` semver range in `Cargo.toml`. You must:
> 1. Edit `Cargo.toml`: change `rand = "0.8"` to `rand = "0.9"`.
> 2. Run `cargo update -p rand` (or just `cargo build`) — Cargo will now resolve to `0.9.x`.
>
> #### Technical Explanation
>
> `cargo update` is a safe, surgical tool: it only updates what you ask for and only within the constraints you already declared. The distinction between "edit `Cargo.toml`" (change intent) and "run `cargo update`" (re-resolve within intent) is the fundamental mental model for managing Rust dependencies.

---

### Exercise 3: `Cargo.lock` Commit Policy — Four Scenarios

**Scenario:**
The rule "commit for binaries, don't commit for libraries" has important nuance. For each scenario below, decide whether `Cargo.lock` should be committed to version control, and explain why:

1. A CLI tool (`src/main.rs`) deployed to production servers.
2. A library crate published to `crates.io` for others to depend on.
3. A library crate that is **not** published — it's used only inside your own workspace.
4. A library crate where you want to run CI tests against the **oldest** semver-compatible versions of every dependency.

> [!check]- Answer
> **1. CLI tool → Commit `Cargo.lock`.**
> The binary is an end product. You want the exact same dependency graph in CI, staging, and production. Without a committed lockfile, `cargo build` in CI might silently pull a newer transitive dep that introduces a regression. Reproducibility is paramount.
>
> **2. Published library → Do NOT commit `Cargo.lock`.**
> `Cargo.lock` from a library is ignored by downstream consumers — Cargo doesn't use it when resolving that library as a dependency. Committing it creates false confidence and noise. The library's `Cargo.toml` version constraints are what matters to downstream users.
>
> **3. Internal workspace-only library → Commit `Cargo.lock`.**
> Even though it's a library crate, it lives inside a workspace that has binaries or integration tests. The workspace shares one `Cargo.lock`. Committing it keeps all developers and CI on the same exact dependency graph, preventing "works on my machine" failures.
>
> **4. Library with minimal-version CI testing → Do NOT commit `Cargo.lock`; use `-Z minimal-versions`.**
> Running `cargo +nightly update -Z minimal-versions` forces Cargo to resolve each dependency to the *lowest* version allowed by the semver constraint, not the latest. This catches bugs where your `Cargo.toml` says `rand = "0.8"` but your code accidentally uses an API only available in `0.8.5`. This requires nightly Cargo and a clean (or absent) `Cargo.lock`.
>
> #### Technical Explanation
>
> The core principle: commit `Cargo.lock` wherever you want **reproducible, deterministic** builds; omit it wherever you need **flexibility** for downstream consumers or CI coverage of the full version range.

---

## 6. Related Terms


- [`Cargo.toml`](cargo_toml.md) — The human-written recipe that generates the lockfile.
- [Cargo](../level_01/cargo.md) — Related concept: Cargo.

---

## 7. Key Takeaways

- `Cargo.lock` is a machine-generated file that pins the exact, hyper-specific versions of every dependency (and sub-dependency) in your project.
- It ensures **Reproducible Builds** (if it compiles on your machine today, it will compile on your coworker's machine exactly the same way in 6 months).
- **NEVER** manually edit `Cargo.lock`. Use `cargo update` in the terminal to safely upgrade dependencies.
- **Rule of thumb**: Commit `Cargo.lock` to git for Binary applications. Do NOT commit it for Libraries.
