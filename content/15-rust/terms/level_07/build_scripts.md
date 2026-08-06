# Build Scripts (`build.rs`)

> **Level 7 — Modules, Visibility & Project Structure**
> A Rust program Cargo compiles and runs *before* your crate, used for codegen, compiling C dependencies, or emitting build directives.

---

## 1. Prerequisites


- [`Cargo.toml`](cargo_toml.md) — The manifest that references and configures a build script.
- [Package](../level_01/package.md) — The unit a build script belongs to and runs on behalf of.
- [`cfg` Attribute](cfg_attribute.md) — One of the mechanisms a build script can programmatically control.

---

## 2. Term Category

**Cargo Build-Pipeline Hook (the pre-compile step)**: A build script is just a normal Rust binary, named `build.rs` at your package root, that Cargo automatically compiles and *runs* before compiling your actual crate. It exists so your crate's compilation can depend on things Cargo alone can't know — like "does this system have OpenSSL installed?" or "generate this file from a schema first."

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Cargo is great at resolving *Rust* dependencies, but real-world software often needs more: linking against a system C library, generating Rust code from a protobuf/GraphQL schema, or embedding the current git commit hash into the binary. None of this fits into a static `Cargo.toml` — it requires running arbitrary logic *before* `rustc` starts compiling your `src/`. Build scripts solve this by letting you write that logic in ordinary Rust, with a well-defined communication channel back to Cargo: your `build.rs` prints special `cargo:` lines to stdout, and Cargo reads them to learn things like "link against this library" or "rebuild if this file changes."

### (2) Reality Metaphor

Imagine a restaurant kitchen (`your crate`) that requires fresh ingredients prepped by a specialist before the chef can start cooking.

- **Without a build script**: The chef (`rustc`) can only cook with whatever raw ingredients are already sitting in the pantry (`src/`), exactly as-is.
- **With `build.rs`**: A prep cook (`the build script`) runs first. They might chop vegetables generated fresh from a recipe card (**codegen**), or go check the walk-in freezer to confirm a specific brand of butter is stocked and tell the chef which shelf it's on (**linking against a system library**). The chef doesn't do this prep work themselves — they just trust the notes the prep cook leaves behind (**the `cargo:` directives**) and start cooking once prep is done.

### (3) Rust Code Examples

#### Short Snippet (The Minimal Build Script)
Just place this file at your package root, next to `Cargo.toml`. Cargo finds and runs it automatically — no registration needed.
```rust
// build.rs
fn main() {
    // Emit a `cargo:` directive: tell rustc to link against the system's `z` (zlib) library.
    println!("cargo:rustc-link-lib=z");

    // Tell Cargo to only re-run this script if `wrapper.h` changes (avoids needless rebuilds).
    println!("cargo:rerun-if-changed=wrapper.h");
}
```

#### Fuller Example (Generating Code at Build Time)
```rust
// build.rs
use std::env;
use std::fs;
use std::path::Path;

fn main() {
    // `OUT_DIR` is a Cargo-provided scratch directory unique to this build.
    let out_dir = env::var("OUT_DIR").unwrap();
    let dest_path = Path::new(&out_dir).join("generated.rs");

    fs::write(
        &dest_path,
        "pub const BUILD_GREETING: &str = \"Hello from build.rs!\";",
    ).unwrap();
}
```
```rust
// src/main.rs
// `include!` pulls the generated file's contents in as if it were typed here.
include!(concat!(env!("OUT_DIR"), "/generated.rs"));

fn main() {
    println!("{}", BUILD_GREETING); // "Hello from build.rs!"
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Writing Output Files Directly to `src/` Instead of `$OUT_DIR`

**The mistake:** Generating Rust source files inside the `src/` directory (e.g. `src/generated.rs`) from `build.rs`.

**Why it is wrong:** Dirties version control git status and causes build failures when compiling packages installed in read-only file systems or published Cargo crates. Generated code must always be written to the scratch path provided by `std::env::var("OUT_DIR")`.

*Incorrect:*
```rust
fs::write("src/bindings.rs", generated_code); // ❌ Dirties git repository and breaks published crate builds!
```

*Fix:*
```rust
let out_dir = std::env::var("OUT_DIR").unwrap();
let dest = std::path::Path::new(&out_dir).join("bindings.rs");
fs::write(dest, generated_code); // Correct!
```

### Mistake 2: Missing `cargo:rerun-if-changed` Directives for Input Dependencies

**The mistake:** Reading input schema files (`schema.proto`, `wrapper.h`) inside `build.rs` without telling Cargo to track them via `cargo:rerun-if-changed`.

**Why it is wrong:** Cargo cannot track files outside `src/`. Modifying `schema.proto` will not trigger `build.rs` re-execution, resulting in stale, out-of-date build artifacts.

*Incorrect:*
```rust
// Reads wrapper.h but prints no rerun directive!
```

*Fix:*
```rust
println!("cargo:rerun-if-changed=c_src/wrapper.h"); // Instructs Cargo to watch file mtime!
```

### Mistake 3: Printing Arbitrary Unprefixed Text to `stdout`

**The mistake:** Using `println!("Building C library...");` to log progress during `build.rs` execution.

**Why it is wrong:** Cargo captures standard output to parse `cargo:key=value` directives. Printing raw text pollutes Cargo's directive parser. Use `eprintln!` to print debug logs to standard error.

---

## 5. Practice Exercises

### Exercise 1: Reading a Build Script's Output

**Scenario:** A `build.rs` contains this line:
```rust
println!("cargo:rustc-cfg=feature_x_enabled");
```
What does this directive do, and what existing Rust mechanism would you use in `src/` to react to it?

> [!check]- Answer
> It tells `rustc` to compile the rest of the crate as if `--cfg feature_x_enabled` were passed on the command line — effectively defining a custom cfg flag from within the build script itself (independent of `Cargo.toml` feature flags). You'd react to it in `src/` using the same [`cfg` Attribute](../level_07/cfg_attribute.md) mechanism used for any other conditional compilation:
>
>
> #### Implementation
>
> ```rust
> #[cfg(feature_x_enabled)]
> fn special_behavior() { /* ... */ }
> ```

---

### Exercise 2: Writing a Realistic Build Script for a C-Backed Crate

**Scenario:**
Your crate wraps a system C library called `mysqlclient`. You need to write a complete `build.rs` that does **all three** of the following:

1. Tells `rustc` to link against the system's `mysqlclient` dynamic library.
2. Tells Cargo to only re-run this build script if the file `c_src/mysql_wrapper.h` changes (so normal Rust edits don't trigger a wasteful rebuild).
3. Sets a custom `cfg` flag called `has_mysql` so that `src/lib.rs` can conditionally compile MySQL-specific code.

Write the complete `build.rs` and show how `src/lib.rs` would use the `has_mysql` cfg flag to compile a function only when MySQL is available.

**Expected output:**
> [!check]- Answer
> *(Build scripts don't produce user-visible stdout — the `cargo:` lines are consumed silently by Cargo. The observable effect is that `rustc` links the library, respects the rebuild trigger, and the `cfg` flag controls which code gets compiled.)*
>
> - **Hint 1:** Each `cargo:` directive is emitted with a plain `println!()` call — Cargo captures and interprets anything printed to stdout during `build.rs` execution.
> - **Hint 2:** There are three distinct directive prefixes in play here:
>   - `cargo:rustc-link-lib=` — tells `rustc` to pass `-l<name>` to the linker
>   - `cargo:rerun-if-changed=` — narrows when Cargo re-executes this script
>   - `cargo:rustc-cfg=` — injects a custom `cfg` key, readable in `src/` with `#[cfg(...)]`
> - **Hint 3:** For `rustc-link-lib`, the default link kind is `dylib` (dynamic). You can be explicit with `dylib=mysqlclient`.
>
>
> #### Implementation
>
> ```rust
> // build.rs
> fn main() {
>     // 1. Link against the system's mysqlclient dynamic library.
>     //    This is equivalent to passing `-l mysqlclient` to rustc.
>     println!("cargo:rustc-link-lib=dylib=mysqlclient");
>
>     // 2. Only re-run this build script when the C header changes.
>     //    Without this, Cargo would conservatively re-run build.rs on *every* build.
>     println!("cargo:rerun-if-changed=c_src/mysql_wrapper.h");
>
>     // 3. Set a custom cfg flag so src/ code can detect MySQL availability.
>     println!("cargo:rustc-cfg=has_mysql");
> }
> ```
>
> ```rust
> // src/lib.rs
> // This function is compiled into the binary ONLY when `has_mysql` cfg is set.
> // The build script above guarantees it's set when mysqlclient is present.
> #[cfg(has_mysql)]
> pub fn connect() -> &'static str {
>     "Connected to MySQL via mysqlclient"
> }
>
> // This stub is compiled when MySQL is *not* available (e.g., CI without the library).
> #[cfg(not(has_mysql))]
> pub fn connect() -> &'static str {
>     "MySQL not available in this build"
> }
> ```
>
> #### Technical Explanation
>
> Build scripts communicate back to Cargo exclusively through `println!("cargo:...")` lines — Cargo intercepts them before they reach the terminal. Each directive prefix has a distinct job:
> - `rustc-link-lib` solves the linker problem: it passes `-l mysqlclient` to `rustc` so the final binary can call into the C library. Without it, you'd get `undefined reference` linker errors at compile time.
> - `rerun-if-changed` solves the stale-rebuild problem: by default Cargo re-runs `build.rs` on every `cargo build` call. Declaring a specific file path restricts re-execution to only when *that* file's mtime changes, keeping incremental builds fast.
> - `rustc-cfg` solves the conditional compilation problem: it injects a flag identical to passing `--cfg has_mysql` to `rustc` directly, letting you use `#[cfg(has_mysql)]` in `src/` without touching `Cargo.toml` feature flags — ideal for capability detection discovered at build time.

---

### Exercise 3: Generating Code with `OUT_DIR` + `include!`

**Scenario:**
The most powerful use of `build.rs` is generating Rust source code at build time and splicing it into your crate with `include!`. This pattern is used to embed constants computed from environment data, generate FFI bindings, or produce lookup tables that would be tedious to write by hand.

Write a complete pipeline consisting of:
1. `build.rs` — reads `OUT_DIR` from the environment, then writes a file `generated.rs` into it containing `pub const BUILD_PROFILE: &str = "debug";`.
2. `src/lib.rs` — uses `include!(concat!(env!("OUT_DIR"), "/generated.rs"))` to splice the generated file in, and exposes `BUILD_PROFILE` as part of the public API.
3. `src/main.rs` (or a doc test) — calls `my_crate::BUILD_PROFILE` and prints it.

Then answer: **why must generated files go to `OUT_DIR` and not directly to `src/`?**

**Expected output:**
> [!check]- Answer
> ```text
> Build profile: debug
> ```
>
> - **Hint 1:** `std::env::var("OUT_DIR")` returns the path Cargo assigns for this build's output artifacts. It is set by Cargo before running `build.rs` — you cannot choose it. It lives inside `target/` and is unique per crate per build profile.
> - **Hint 2:** `std::fs::write(path, content)` creates the file. Construct the path with `std::path::Path::new(&out_dir).join("generated.rs")`.
> - **Hint 3:** On the consuming side, `include!(concat!(env!("OUT_DIR"), "/generated.rs"))` is a macro that textually splices the file's contents at the call site — exactly as if you had typed that Rust code inline. It is evaluated at compile time, not runtime.
>
>
> #### Implementation
>
> ```rust
> // build.rs
> use std::env;
> use std::fs;
> use std::path::Path;
>
> fn main() {
>     let out_dir = env::var("OUT_DIR").expect("OUT_DIR not set by Cargo");
>     let dest = Path::new(&out_dir).join("generated.rs");
>
>     // Write a Rust constant into the generated file.
>     // In real tools (e.g. bindgen), this could be thousands of lines.
>     fs::write(&dest, "pub const BUILD_PROFILE: &str = \"debug\";\n")
>         .expect("failed to write generated.rs");
>
>     // Tell Cargo to only re-run this script if build.rs itself changes.
>     println!("cargo:rerun-if-changed=build.rs");
> }
> ```
>
> ```rust
> // src/lib.rs
> // Splice the generated file into this module at compile time.
> // include! is a textual include — the const declaration lands here.
> include!(concat!(env!("OUT_DIR"), "/generated.rs"));
> ```
>
> ```rust
> // src/main.rs
> fn main() {
>     println!("Build profile: {}", my_crate::BUILD_PROFILE);
> }
> ```
>
> **Answer to the `OUT_DIR` question:**
> Writing into `src/` would dirty the source tree — version control would see the generated file as an untracked/modified file, creating noise in `git status` and potential conflicts between developers or CI runs that generate different content. `OUT_DIR` is inside `target/`, which is `.gitignore`d by convention, so generated files stay out of version control entirely. It also means each build profile (debug, release) gets its own `OUT_DIR`, so profile-specific generated code never collides.

---

## 6. Related Terms


- [`bindgen`](../level_13/bindgen.md) — The most common reason to write a build script: auto-generating Rust FFI bindings from a C header during the build.
- [FFI (Foreign Function Interface)](../level_13/ffi.md) — The broader C-interop problem build scripts frequently solve (linking, codegen).
- [`cfg` Attribute](cfg_attribute.md) — What a build script can programmatically set via `cargo:rustc-cfg`.
- [`Cargo.toml`](cargo_toml.md) — Where you can add `build = "build.rs"` explicitly (though Cargo auto-detects the default filename).

---

## 7. Key Takeaways

- A build script is just a normal Rust binary at `build.rs`, automatically compiled and run by Cargo **before** your crate.
- It communicates back to Cargo exclusively through special `println!("cargo:...")` lines printed to stdout.
- Typical uses: linking system libraries, generating Rust code (`OUT_DIR` + `include!`), and setting custom `cfg` flags.
- Always declare `cargo:rerun-if-changed` for anything your script reads, or Cargo will conservatively re-run it on every build.
