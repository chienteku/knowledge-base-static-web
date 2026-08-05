# Cargo Target Kinds (`[lib]`, `[[bin]]`, `examples/`, `benches/`, `tests/`)

> **Level 7 — Modules, Visibility & Project Structure**
> How Cargo discovers and separately compiles a package's library, binaries, examples, and benchmarks.

---

## 1. Prerequisites


- [Package](../level_01/package.md) — The container that can hold multiple targets of different kinds.
- [Crate](../level_01/crate.md) — Each individual target compiles into its own separate crate.
- [Integration Tests](../level_08/integration_tests.md) — The `tests/` directory, one of the target kinds covered here.

---

## 2. Term Category

**Cargo Project Layout (the multi-target package)**: A single package isn't limited to "one library" or "one binary" — Cargo recognizes several distinct **target kinds**, each discovered by convention (a specific directory/file location) or declared explicitly in `Cargo.toml`, and each compiled as its own separate crate.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

A real-world package is rarely just "one file that does one thing." A library crate might want: a runnable CLI tool that uses the library (a **binary**), a few small demonstration programs showing off specific features (**examples**), performance benchmarks tracked over time (**benches**), and integration tests exercising the library's actual public API from the outside (**tests**). Rather than forcing all of this into one undifferentiated blob, or requiring a separate `Cargo.toml`/package for each piece, Cargo recognizes a fixed set of **target kinds**, each discovered automatically by a specific directory convention: `src/lib.rs` is the library, `src/main.rs` (or `src/bin/*.rs`) are binaries, `examples/*.rs` are examples, `benches/*.rs` are benchmarks, and `tests/*.rs` are integration tests. Each target compiles as its own independent crate, and Cargo provides dedicated commands to build/run each kind (`cargo run --example foo`, `cargo bench`, `cargo test`), without needing any of this structure spelled out manually for the common case.

### (2) Reality Metaphor

Imagine a single publishing house (a package) that produces several genuinely different kinds of printed material from the same underlying manuscript.

- **`src/lib.rs`** is the definitive, canonical reference edition (**the library**) — the authoritative source everything else draws from.
- **`src/bin/*.rs`** are standalone pocket editions (**binaries**) meant to be handed directly to a reader and used on their own.
- **`examples/*.rs`** are the illustrated sample chapters handed out at a bookstore to demonstrate what the full book is like.
- **`benches/*.rs`** are the timed reading-speed trial editions, specifically produced to measure performance, not for general reading.
- **`tests/*.rs`** are the independent, external quality-assurance reviewers who read *only* the finished, publicly available reference edition — checking it behaves correctly from a reader's outside perspective, not peeking at the publisher's internal drafts.

### (3) Rust Code Examples

#### Short Snippet (The Conventional Directory Layout)
```text
my_package/
├── Cargo.toml
├── src/
│   ├── lib.rs        <- The library target (`cargo build --lib`)
│   └── main.rs        <- A binary target (`cargo run`)
├── examples/
│   └── basic_usage.rs <- An example (`cargo run --example basic_usage`)
├── benches/
│   └── perf.rs         <- A benchmark (`cargo bench`)
└── tests/
    └── integration.rs  <- An integration test (`cargo test`)
```

#### Fuller Example (Explicit `[[bin]]` Declaration for a Non-Standard Layout)
```toml
# Cargo.toml — declaring an additional binary target explicitly,
# for a file NOT in the conventional src/bin/ location.
[package]
name = "my_package"
version = "0.1.0"

[[bin]]
name = "admin-tool"
path = "tools/admin.rs" # A location Cargo wouldn't auto-discover on its own.
```
```rust
// tools/admin.rs
fn main() {
    println!("Running the admin tool!");
}
```
Run it with `cargo run --bin admin-tool`.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Expecting Code in `examples/` or `tests/` to Access Private Library Members

**The mistake:** Calling private (non-`pub`) functions or accessing private fields of `src/lib.rs` inside `examples/demo.rs` or `tests/integration_test.rs`.

**Why it is wrong:** `examples/` and `tests/` targets are compiled as completely separate external crates that link against the main library via `use my_crate::*`. They can only access `pub` items.

*Incorrect:*
```rust
// inside tests/integration.rs
use my_crate::internal_helper; // ❌ Error E0603: function `internal_helper` is private!
```

*Fix:*
```rust
// Test internal private helpers inside unit test modules inside src/lib.rs (`#[cfg(test)] mod tests`)!
```

### Mistake 2: Assuming `cargo run` Works Without `--bin` when Multiple Binary Targets Exist

**The mistake:** Executing `cargo run` in a package containing multiple binary targets (`src/main.rs`, `src/bin/tool.rs`).

**Why it is wrong:** Cargo cannot guess which binary target to execute and throws error `could not determine which binary to run`.

*Fix:*
```bash
cargo run --bin tool # Specify target explicitly!
```

### Mistake 3: Placing Production Executables in `examples/` Instead of `src/bin/`

**The mistake:** Placing production CLI binary tools inside `examples/` directory.

**Why it is wrong:** `cargo install` only installs binaries declared in `src/main.rs` or `src/bin/`. Binaries inside `examples/` are ignored during package installation.

---

## 5. Practice Exercises

### Exercise 1: Predict How Many Crates Get Compiled

**Problem:** A package has `src/lib.rs`, `src/main.rs`, two files in `examples/` (`demo1.rs`, `demo2.rs`), and one file in `tests/` (`api_tests.rs`). Running `cargo build --all-targets` compiles how many separate crates, and what kind is each?

> [!check]- Answer
> **5 separate crates**: 1 library (`src/lib.rs`), 1 binary (`src/main.rs`), 2 examples (`demo1.rs`, `demo2.rs`, each its own crate), and 1 integration-test crate (`api_tests.rs`). Each is compiled and linked independently — for instance, both example crates and the test crate would each separately link against the library crate as an external dependency, exactly as an outside consumer of the library would.

---

### Exercise 2: Configuring Multiple Binary Targets

**Problem:**
A package can expose multiple binary executables from a single `Cargo.toml`. The auto-discovery rule is: every `.rs` file directly inside `src/bin/` becomes a binary named after the file (no path required). You use `[[bin]]` to customize names or use non-standard paths.

You are building a dev-tools package with three executables:
- `src/bin/server.rs` — the production server (auto-discovered, no `[[bin]]` needed).
- `src/cli/main.rs` — a CLI tool (non-standard path, needs `[[bin]]`).
- `src/bin/migrate.rs` — a DB migration runner (auto-discovered, but you want it named `db-migrate`).

Write the `Cargo.toml` fragment covering all three, then answer: if you run `cargo run` with no `--bin` flag and multiple `[[bin]]` targets exist, what happens?

> [!check]- Answer
> ```toml
> # server.rs is auto-discovered from src/bin/ — no entry needed.
>
> [[bin]]
> name = "cli"
> path = "src/cli/main.rs"   # Non-standard path: must declare explicitly.
>
> [[bin]]
> name = "db-migrate"
> path = "src/bin/migrate.rs"  # Override auto-discovered name.
> ```
>
> - **Hint 1:** Auto-discovery and explicit `[[bin]]` entries can coexist. Cargo merges them. `server` is discovered automatically; the other two are explicit.
> - **Hint 2:** The `name` field determines the filename of the compiled binary in `target/debug/` (e.g. `db-migrate`, not `migrate`).
> - **Hint 3:** If you want to run a specific binary: `cargo run --bin db-migrate`.
>
> **Answer to the ambiguous `cargo run` question:**
> Cargo emits an **error**: `error: could not determine which binary to run`. When a package has more than one binary target, `cargo run` doesn't guess — you must specify `--bin <name>`. This is intentional: silently running the "first" binary would be surprising and fragile.

---

### Exercise 3: The `examples/` Target Kind — Workflow and Purpose

**Problem:**
The `examples/` directory is a distinct target kind from `src/bin/`. Both produce runnable binaries, but they serve different purposes and have different behaviours.

Answer the following:
1. You have `examples/quick_start.rs`. What command runs it?
2. Can code in `examples/` use the private (non-`pub`) functions of `src/lib.rs`?
3. Are example binaries included when a user runs `cargo install your_crate`?
4. What is the practical difference between putting a demo program in `src/bin/` vs `examples/`?

> [!check]- Answer
> **1. Running an example:**
> ```bash
> cargo run --example quick_start
> ```
> Examples are also built with `cargo build --examples` (all of them) or `cargo build --example quick_start` (one). The binary lands in `target/debug/examples/quick_start`.
>
> **2. Access to private API:**
> **No.** Files in `examples/` are compiled as separate crates that depend on your library externally — exactly like a downstream user's code. They can only access `pub` items. This is the same restriction as integration tests in `tests/`.
>
> **3. `cargo install` and examples:**
> **No.** `cargo install your_crate` only installs binaries from `src/main.rs` and `src/bin/`. Example binaries are never installed. They exist only as local developer conveniences.
>
> **4. `src/bin/` vs `examples/` — semantic distinction:**
>
> | | `src/bin/` | `examples/` |
> |---|---|---|
> | Purpose | Production executable shipped with the crate | Demonstration code for documentation / teaching |
> | Installed by `cargo install` | ✅ Yes | ❌ No |
> | Appears in `cargo doc` | No | No |
> | Convention | Ship it to users | Show users how to use your library |
>
> **Explanation:**
> `examples/` is the Rust equivalent of a "getting started" code snippet that actually compiles and runs. Many popular crates (`tokio`, `axum`, `serde`) ship dozens of examples that serve as living documentation — they are guaranteed correct because they compile against the real library.

---

## 6. Related Terms


- [Package](../level_01/package.md)
- [Integration Tests](../level_08/integration_tests.md) — The dedicated deep-dive on the `tests/` target kind specifically.
- [Benchmarking](../level_08/benchmarking.md) — The dedicated deep-dive on the `benches/` target kind.
- [Workspace](workspace.md) — The next layer up: multiple *packages* (each potentially with several targets) managed together.

---

## 7. Key Takeaways

- A single package can have multiple target kinds: one library, one-or-more binaries, examples, benchmarks, and integration tests.
- Each kind is discovered by directory convention (`src/lib.rs`, `src/bin/`, `examples/`, `benches/`, `tests/`) or can be declared explicitly in `Cargo.toml` (`[[bin]]`, `[[example]]`, etc.) for non-standard layouts.
- Every target compiles as its **own separate crate** — including every single top-level file directly inside `tests/`, each becoming its own independent test binary.
- Dedicated Cargo commands target each kind: `cargo run --example NAME`, `cargo bench`, `cargo test`, `cargo run --bin NAME`.
