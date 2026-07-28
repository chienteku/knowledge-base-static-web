# Build Scripts (`build.rs`)

> **Level 7 — Modules, Visibility & Project Structure**
> A Rust program Cargo compiles and runs *before* your crate, used for codegen, compiling C dependencies, or emitting build directives.

---

## 1. Prerequisites

- [`Cargo.toml`](../level_07/cargo_toml.md) — The manifest that references and configures a build script.
- [Package](../level_01/package.md) — The unit a build script belongs to and runs on behalf of.
- [`cfg` Attribute](../level_07/cfg_attribute.md) — One of the mechanisms a build script can programmatically control.

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

### Mistake 1: Misunderstanding Build Scripts Scoping and Lifecycle Rules

**The mistake:** Assuming Build Scripts instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("build_scripts_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("build_scripts_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Build Scripts State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Build Scripts through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Build Scripts Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Build Scripts instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Reading a Build Script's Output

**Problem:** A `build.rs` contains this line:
```rust
println!("cargo:rustc-cfg=feature_x_enabled");
```
What does this directive do, and what existing Rust mechanism would you use in `src/` to react to it?

> [!check]- Answer
> It tells `rustc` to compile the rest of the crate as if `--cfg feature_x_enabled` were passed on the command line — effectively defining a custom cfg flag from within the build script itself (independent of `Cargo.toml` feature flags). You'd react to it in `src/` using the same [`cfg` Attribute](../level_07/cfg_attribute.md) mechanism used for any other conditional compilation:
>
> ```rust
> #[cfg(feature_x_enabled)]
> fn special_behavior() { /* ... */ }
> ```

---

### Exercise 2: Emitting Cargo Instruction Directives

**Problem:** Write a `build.rs` main function instructing Cargo to rerun if `src/schema.json` changes.

**Expected output:**
> [!check]- Answer
> ```
> Build instruction printed
> ```
> ```rust
> fn main() {
>     println!("cargo:rerun-if-changed=src/schema.json");
>     println!("Build instruction printed");
> }
> ```
>
> **Explanation:** `println!("cargo:rerun-if-changed=...")` informs Cargo when to re-execute `build.rs`.

---

### Exercise 3: Generating Code to `OUT_DIR`

**Problem:** Use `std::env::var("OUT_DIR")` in a build script to create a generated code file.

**Expected output:**
> [!check]- Answer
> ```
> Generated code path retrieved
> ```
> ```rust
> use std::env;
> fn main() {
>     if let Ok(out_dir) = env::var("OUT_DIR") {
>         println!("Generated code path retrieved: {}", out_dir);
>     }
> }
> ```
>
> **Explanation:** Generated code should always be written into `$OUT_DIR` and included via `include!(concat!(env!("OUT_DIR"), "/file.rs"));`.

---

## 6. Related Terms

- [`bindgen`](../level_13/bindgen.md) — The most common reason to write a build script: auto-generating Rust FFI bindings from a C header during the build.
- [FFI (Foreign Function Interface)](../level_13/ffi.md) — The broader C-interop problem build scripts frequently solve (linking, codegen).
- [`cfg` Attribute](../level_07/cfg_attribute.md) — What a build script can programmatically set via `cargo:rustc-cfg`.
- [`Cargo.toml`](../level_07/cargo_toml.md) — Where you can add `build = "build.rs"` explicitly (though Cargo auto-detects the default filename).

---

## 7. Key Takeaways

- A build script is just a normal Rust binary at `build.rs`, automatically compiled and run by Cargo **before** your crate.
- It communicates back to Cargo exclusively through special `println!("cargo:...")` lines printed to stdout.
- Typical uses: linking system libraries, generating Rust code (`OUT_DIR` + `include!`), and setting custom `cfg` flags.
- Always declare `cargo:rerun-if-changed` for anything your script reads, or Cargo will conservatively re-run it on every build.
