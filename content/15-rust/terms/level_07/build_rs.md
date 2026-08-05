# `build.rs` — Build Scripts

> **Level 7 — Rust**
> An optional Rust file executed by Cargo before compiling the crate, used for code generation, linking native libraries, and setting compile-time environment variables.

---

## 1. Prerequisites

- [`Cargo.toml`](cargo_toml.md) — Manifest configuring build = 'build.rs'.
- [Cargo CLI](cargo_cli.md) — Cargo build execution.

---

## 2. Term Category

**Cargo Tooling (build-pipeline pre-compilation hook)**: `build.rs` is a custom Rust build script located at the package root that Cargo automatically compiles and runs *before* compiling the crate itself. It communicates build instructions (`cargo:key=value`) to Cargo via standard output.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Cargo resolves Rust crate dependencies natively, but real-world projects frequently require:
- Linking against external system C/C++ static or dynamic libraries (`libz`, `libssl`).
- Generating Rust source files from Protobuf `.proto` schemas or C header files prior to compilation.
- Emitting custom compile-time flags (`cargo:rustc-cfg=...`) or environment variables.

Because static `Cargo.toml` files cannot perform imperative shell operations or environment probing, `build.rs` provides a secure, sandboxed Rust execution hook before main compilation.

### (2) Communication Protocol (`cargo:key=value`)

`build.rs` communicates with Cargo exclusively by printing formatted text directives to standard output:
- `cargo:rustc-link-lib=foo`: Tells `rustc` to link against native library `foo`.
- `cargo:rustc-link-search=native=/path`: Adds search paths for native library linkers.
- `cargo:rustc-cfg=has_feature`: Defines custom conditional compilation flags accessible via `#[cfg(has_feature)]`.
- `cargo:rerun-if-changed=file`: Instructs Cargo to re-run `build.rs` only when the specified file changes.

### (3) Reality Metaphor

A pre-construction site preparation team: before masons and carpenters arrive to erect a building (`rustc`), the site prep team (`build.rs`) clears land, pours foundations (**builds C libraries**), and routes utility power lines (**configures link directives**).

### (4) Rust Code Examples

#### Basic Linker Directive & Rebuild Trigger
```rust
// build.rs
fn main() {
    // Link against system zlib
    println!("cargo:rustc-link-lib=z");
    
    // Only re-run if wrapper.h changes
    println!("cargo:rerun-if-changed=src/native/wrapper.h");
}
```

#### Code Generation in `$OUT_DIR`
```rust
// build.rs
use std::env;
use std::fs;
use std::path::Path;

fn main() {
    let out_dir = env::var("OUT_DIR").unwrap();
    let dest_path = Path::new(&out_dir).join("build_version.rs");
    
    let version_code = "pub const BUILD_TIMESTAMP: &str = \"2026-08-05T16:00:00Z\";";
    fs::write(&dest_path, version_code).unwrap();
    
    println!("cargo:rerun-if-changed=build.rs");
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting `cargo:rerun-if-changed` Directives

**The mistake:** Failing to print `cargo:rerun-if-changed=path/to/file` in `build.rs`.

**Why it is wrong:** Cargo defaults to re-running `build.rs` on *every* build or missing rebuilds when external schema or C source files are modified.

*Incorrect:*
```rust
// build.rs generates code from schema.proto but emits no rerun directive!
```

*Fix:*
```rust
println!("cargo:rerun-if-changed=schema.proto"); // Correct!
```

### Mistake 2: Writing Generated Code Files Directly into `src/`

**The mistake:** Writing output files directly into source directories like `src/generated.rs`.

**Why it is wrong:** Dirties version control git repositories and breaks read-only build environments (such as Cargo package publishing or Docker builds). Always write build script artifacts to `$OUT_DIR`.

*Incorrect:*
```rust
fs::write("src/generated.rs", code); // ❌ Dirties git tree & fails in read-only builds
```

*Fix:*
```rust
let out_dir = std::env::var("OUT_DIR").unwrap();
fs::write(std::path::Path::new(&out_dir).join("generated.rs"), code);
```

### Mistake 3: Printing Unprefixed Diagnostic Strings to Standard Output

**The mistake:** Printing raw diagnostic text via `println!("Compiling C library...");`.

**Why it is wrong:** Cargo intercepts stdout and attempts to parse lines as directives. Unprefixed lines are ignored or cause parsing confusion. Use `eprintln!` for debugging.

---

## 5. Practice Exercises

### Exercise 1: Build Script Environment Code Generator Simulator

**Scenario:** Implement a function `generate_build_constants(out_dir: &Path) -> PathBuf` simulating a `build.rs` script generating static constants inside `$OUT_DIR`.

**Requirements:**
1. Generate `build_info.rs` inside `out_dir`.
2. Write `pub const APP_BUILD_NAME: &str = "AntigravityCore";`.
3. Write unit tests validating file creation and string inclusion.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::fs;
> use std::path::{Path, PathBuf};
> 
> pub fn generate_build_constants(out_dir: &Path) -> PathBuf {
>     let dest_path = out_dir.join("build_info.rs");
>     let content = "pub const APP_BUILD_NAME: &str = \"AntigravityCore\";";
>     fs::write(&dest_path, content).expect("Failed to write build constant");
>     dest_path
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_build_constant_generation() {
>         let temp_dir = std::env::temp_dir();
>         let path = generate_build_constants(&temp_dir);
>         assert!(path.exists());
>         let read_back = fs::read_to_string(path).unwrap();
>         assert!(read_back.contains("AntigravityCore"));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Simulates `build.rs` writing generated Rust code to `$OUT_DIR`.
> 2. Main crate includes generated file via `include!(concat!(env!("OUT_DIR"), "/build_info.rs"));`.

---

### Exercise 2: Cargo Linker Directive Generator

**Scenario:** Create a helper function `generate_cargo_link_directives(lib_dir: &str, lib_name: &str) -> Vec<String>` producing standard `cargo:` linker instructions for native static libraries.

**Requirements:**
1. Generate `cargo:rustc-link-search=native=...`.
2. Generate `cargo:rustc-link-lib=static=...`.
3. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn generate_cargo_link_directives(lib_dir: &str, lib_name: &str) -> Vec<String> {
>     vec![
>         format!("cargo:rustc-link-search=native={lib_dir}"),
>         format!("cargo:rustc-link-lib=static={lib_name}"),
>         format!("cargo:rerun-if-changed={lib_dir}"),
>     ]
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_link_directives() {
>         let dirs = generate_cargo_link_directives("/usr/local/lib", "crypto");
>         assert_eq!(dirs[0], "cargo:rustc-link-search=native=/usr/local/lib");
>         assert_eq!(dirs[1], "cargo:rustc-link-lib=static=crypto");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `build.rs` outputs these directives to stdout to instruct `cargo` and `rustc` linkers.
> 2. Configures native library paths and static linking rules.

---

### Exercise 3: C Header Dependency Watcher Generator

**Scenario:** Build a function `generate_rerun_directives(headers: &[&str]) -> Vec<String>` simulating `cargo:rerun-if-changed` emission for C header dependencies.

**Requirements:**
1. Emit `cargo:rerun-if-changed=<header>`.
2. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn generate_rerun_directives(headers: &[&str]) -> Vec<String> {
>     headers.iter().map(|h| format!("cargo:rerun-if-changed={h}")).collect()
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_rerun_headers() {
>         let dirs = generate_rerun_directives(&["header1.h", "header2.h"]);
>         assert_eq!(dirs.len(), 2);
>         assert_eq!(dirs[0], "cargo:rerun-if-changed=header1.h");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Prevents stale builds by monitoring C header modifications.
> 2. Informs Cargo's incremental build cache engine.

---

## 5. Related Terms

- [`bindgen`](../level_13/bindgen.md)

---

## 7. Key Takeaways

- `build.rs` is compiled and executed by Cargo **before** main crate compilation.
- Directives are printed to stdout using `cargo:key=value` format.
- Always write generated code to `$OUT_DIR`, never to `src/`.
- Declare `cargo:rerun-if-changed` for all input files to avoid unnecessary rebuilds.
