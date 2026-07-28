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

### Mistake 1: Misunderstanding Cargo Target Kinds Scoping and Lifecycle Rules

**The mistake:** Assuming Cargo Target Kinds instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("cargo_target_kinds_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("cargo_target_kinds_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Cargo Target Kinds State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Cargo Target Kinds through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Cargo Target Kinds Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Cargo Target Kinds instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Predict How Many Crates Get Compiled

**Problem:** A package has `src/lib.rs`, `src/main.rs`, two files in `examples/` (`demo1.rs`, `demo2.rs`), and one file in `tests/` (`api_tests.rs`). Running `cargo build --all-targets` compiles how many separate crates, and what kind is each?

> [!check]- Answer
> **5 separate crates**: 1 library (`src/lib.rs`), 1 binary (`src/main.rs`), 2 examples (`demo1.rs`, `demo2.rs`, each its own crate), and 1 integration-test crate (`api_tests.rs`). Each is compiled and linked independently — for instance, both example crates and the test crate would each separately link against the library crate as an external dependency, exactly as an outside consumer of the library would.

---

### Exercise 2: Configuring Custom Binary Targets in `Cargo.toml`

**Problem:** Write a `[[bin]]` configuration for `src/bin/cli.rs` named `"my-cli"`.

**Expected output:**
> [!check]- Answer
> ```
> [[bin]] name = "my-cli" path = "src/bin/cli.rs"
> ```
> ```rust
> fn main() {
>     println!("[[bin]] name = \"my-cli\" path = \"src/bin/cli.rs\"");
> }
> ```
>
> **Explanation:** `[[bin]]` targets specify custom binary target metadata in `Cargo.toml`.

---

### Exercise 3: Building Example Targets

**Problem:** Command to run an example file located at `examples/demo.rs`.

**Expected output:**
> [!check]- Answer
> ```
> cargo run --example demo
> ```
> ```rust
> fn main() {
>     println!("cargo run --example demo");
> }
> ```
>
> **Explanation:** Examples in `examples/` are built and executed via `cargo run --example <name>`.

---

## 6. Related Terms

- [Package](../level_01/package.md) / [Crate](../level_01/crate.md) — The container/unit relationship: one package, potentially many crate targets.
- [Integration Tests](../level_08/integration_tests.md) — The dedicated deep-dive on the `tests/` target kind specifically.
- [Benchmarking](../level_08/benchmarking.md) — The dedicated deep-dive on the `benches/` target kind.
- [Workspace](../level_07/workspace.md) — The next layer up: multiple *packages* (each potentially with several targets) managed together.

---

## 7. Key Takeaways

- A single package can have multiple target kinds: one library, one-or-more binaries, examples, benchmarks, and integration tests.
- Each kind is discovered by directory convention (`src/lib.rs`, `src/bin/`, `examples/`, `benches/`, `tests/`) or can be declared explicitly in `Cargo.toml` (`[[bin]]`, `[[example]]`, etc.) for non-standard layouts.
- Every target compiles as its **own separate crate** — including every single top-level file directly inside `tests/`, each becoming its own independent test binary.
- Dedicated Cargo commands target each kind: `cargo run --example NAME`, `cargo bench`, `cargo test`, `cargo run --bin NAME`.
