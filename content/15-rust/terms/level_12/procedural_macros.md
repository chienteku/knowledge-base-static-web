# Procedural Macros

> **Level 12 — Macros**
> Rust functions that accept code tokens as input and output transformed code tokens at compile time.

---

## 1. Prerequisites

- [Declarative Macros (`macro_rules!`)](../level_12/declarative_macros_macro_rules.md) — Understanding macro evaluation and AST-level code generation versus simple function execution.
- [Token Stream](../level_12/token_stream.md) — The fundamental compiler input/output type (`proc_macro::TokenStream`) manipulated by procedural macros.
- [Crate (`crate`)](../level_07/crate.md) — Procedural macros MUST be defined in a dedicated separate crate with `proc-macro = true` in `Cargo.toml`.

---

## 2. Term Category

**Syntax / Language Feature**: Procedural Macros are advanced metaprogramming constructs in Rust. Unlike declarative macros (`macro_rules!`) which match token patterns structurally, procedural macros are full Rust functions that execute during compilation to read, parse, mutate, and generate Rust code.

---

## 3. Environment Context

**Universal Rust (Compile-time Execution)**: Procedural macros execute inside `rustc` during compilation on the host compiler target. The generated code operates in whatever target environment (`std`, `no_std`, WASM, embedded) the parent crate targets.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"

In languages like JavaScript or TypeScript, code transformation relies heavily on external tooling build steps (such as Babel plugins, Webpack loaders, or SWC transformers). While declarative macros (`macro_rules!`) handle many pattern-matching code generation needs in Rust, they have strict structural limitations. They cannot easily perform complex AST analysis, arbitrary code generation logic, inspect struct fields programmatically, or interact with external configuration files at compile time.

Rust introduced **Procedural Macros** ("proc macros") to give developers the full power of Rust code execution during compilation. A procedural macro functions as a compiler plugin: it accepts a stream of source tokens (`TokenStream`), parses it, manipulates it using regular Rust code, and outputs a new `TokenStream` that the compiler inserts into the abstract syntax tree.

There are three flavors of procedural macros:
1. **Derive Macros**: `#[derive(MyTrait)]` — Generates additional code (typically trait implementations) attached to structs/enums/unions without modifying the original definition.
2. **Attribute Macros**: `#[my_custom_attribute]` — Replaces or transforms the item (function, struct, module) it is attached to.
3. **Function-like Macros**: `custom_macro!(...)` — Looks like a declarative macro call, but processes its inputs via procedural function logic.

### (2) Reality Metaphor

Imagine a **3D Printing Factory with a Customs Inspection Station**:

- A **Declarative Macro (`macro_rules!`)** is like a fixed mechanical template: you insert materials into slot A and slot B, and mechanical gears physically press out a fixed shape.
- A **Procedural Macro** is like sending the raw blueprints (**`TokenStream`**) into a software computer running full CAD modeling scripts (**Rust function**). The computer analyzes every line of the blueprint, adds custom wiring, verifies safety checks, generates new engineering blueprints, and hands those updated blueprints to the factory floor (**`rustc`**) to print into physical objects (**machine code**).

### (3) Code Examples

#### Short Snippet (Conceptual Proc Macro Structure)

*Note: Procedural macros must live in a separate crate configured with `proc-macro = true` in `Cargo.toml`.*

```rust
// Cargo.toml in proc_macro_crate:
// [lib]
// proc-macro = true

use proc_macro::TokenStream;

/// A minimal function-like procedural macro definition
#[proc_macro]
pub fn make_hello_world(input: TokenStream) -> TokenStream {
    // Return a TokenStream that parses directly as Rust code:
    // fn hello() { println!("Hello from procedural macro!"); }
    "fn hello() { println!(\"Hello from procedural macro!\"); }"
        .parse()
        .unwrap()
}
```

#### Fuller Example (Consuming and Invoking a Derive Procedural Macro)

```rust
// In a user project consuming serde / derive proc macros:
use serde::{Serialize, Deserialize};

/// Using the derive procedural macro provided by Serde.
/// At compile time, `#[derive(Serialize, Deserialize)]` runs Serde's proc macro logic,
/// which inspects the `User` struct fields and generates high-performance 
/// serialization code without any runtime reflection overhead.
#[derive(Debug, Serialize, Deserialize)]
struct User {
    id: u64,
    username: String,
    is_active: bool,
}

fn main() {
    let user = User {
        id: 101,
        username: String::from("ferris"),
        is_active: true,
    };

    // Serialize struct to JSON string (using generated Serialize implementation)
    let json = serde_json::to_string(&user).expect("Failed to serialize");
    println!("Serialized JSON: {}", json);

    // Deserialize JSON string back into struct
    let deserialized: User = serde_json::from_str(&json).expect("Failed to deserialize");
    println!("Deserialized User: {:?}", deserialized);
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Defining a Procedural Macro inside a Standard Crate

**The mistake:** Attempting to export a `#[proc_macro]` function directly inside a normal binary or library crate alongside standard application code.

**Why it's wrong:** The Rust compiler requires procedural macro definitions to reside in their own dedicated library crate with `proc-macro = true` set in `Cargo.toml`. `rustc` compiles proc macro crates first for the *host* machine architecture so it can execute them during the compilation of caller crates.

*Incorrect:*
```rust
// src/lib.rs (in a standard library crate)
use proc_macro::TokenStream;

#[proc_macro] // ❌ Compiler error: functions tagged with `proc_macro` can only be declared in a proc-macro crate type
pub fn my_macro(input: TokenStream) -> TokenStream {
    input
}
```

*Fix:*
```toml
# my_macro_crate/Cargo.toml
[package]
name = "my_macro_crate"
version = "0.1.0"
edition = "2021"

[lib]
proc-macro = true
```
```rust
// my_macro_crate/src/lib.rs
use proc_macro::TokenStream;

#[proc_macro] // Correct: inside a dedicated proc-macro crate
pub fn my_macro(input: TokenStream) -> TokenStream {
    input
}
```

### Mistake 2: Confusing Host vs Target Compilation Environments

**The mistake:** Assuming dependencies or code executed inside a procedural macro function are available at application runtime.

**Why it's wrong:** Procedural macro code runs on the build machine (the host environment) during compilation. Application code runs on the target environment at runtime. Environment variables or file systems read during proc macro execution access the build machine state, not the target machine state.

*Incorrect:*
```rust
// Attempting to read a runtime database connection string inside a proc macro thinking it reads client env at runtime
#[proc_macro]
pub fn embed_config(_input: TokenStream) -> TokenStream {
    // ❌ Reads the developer's / build machine's variable during compilation!
    let db_url = std::env::var("DATABASE_URL").unwrap_or_default();
    format!("fn get_db_url() -> &'static str {{ {:?} }}", db_url).parse().unwrap()
}
```

*Fix:*
```rust
// Proc macros should only generate code that dynamically resolves runtime dependencies when executed,
// or clearly document compile-time configuration parameters.
#[proc_macro]
pub fn generate_db_getter(_input: TokenStream) -> TokenStream {
    "fn get_db_url() -> String { std::env::var(\"DATABASE_URL\").unwrap_or_default() }"
        .parse()
        .unwrap()
}
```

### Mistake 3: Neglecting Compile-Time Performance Impact

**The mistake:** Heavy use of unoptimized parsing or excessive macro dependencies without considering build times.

**Why it's wrong:** Because procedural macros execute full Rust code during build time, complex macros (especially those pulling in large AST parsing libraries like `syn` with heavy feature flags) increase clean build times significantly.

*Incorrect:*
```toml
# Cargo.toml
[dependencies]
# ❌ Enabling full `syn` features when only basic parsing is needed
syn = { version = "2.0", features = ["full", "extra-traits", "fold", "visit-mut"] }
```

*Fix:*
```toml
# Cargo.toml
[dependencies]
# Enable only minimal necessary syn feature flags to keep compilation fast
syn = { version = "2.0", features = ["derive"] }
```

---

## 6. Practice Exercises

### Exercise 1: Identify Proc Macro Categories

**Problem:** Match each Rust attribute/invocation to its procedural macro type:
1. `#[derive(Serialize)]`
2. `#[tokio::main]`
3. `sqlx::query!("SELECT * FROM users")`

> [!check]- Answer
> **1 -> Derive Macro**, **2 -> Attribute Macro**, **3 -> Function-like Macro**
>
> **Explanation:**
> - `#[derive(...)]` is a **Derive Macro** attached to data structures.
> - `#[tokio::main]` is an **Attribute Macro** transforming function definitions.
> - `sqlx::query!(...)` is a **Function-like Macro** invoked with bang syntax `!`.

---

### Exercise 2: Crate Requirement Verification

**Problem:** Why must procedural macros be declared in a dedicated crate with `proc-macro = true`?

> [!check]- Answer
> **Because procedural macros must be compiled for host execution during `rustc` compilation.**
>
> **Explanation:** The host compiler must load dynamic libraries containing macro executable code to transform user code before emitting the final target binary.

---

## 7. Related Terms

- [Declarative Macros (`macro_rules!`)](../level_12/declarative_macros_macro_rules.md) — Pattern-matching declarative macro system in Rust.
- [Token Stream](../level_12/token_stream.md) — The fundamental token sequence type processed by proc macros.
- [`syn` Crate](../level_12/syn_crate.md) — Popular crate for parsing Rust tokens into an Abstract Syntax Tree (AST).
- [`quote` Crate](../level_12/quote_crate.md) — Popular crate for turning Rust AST/code fragments back into token streams.
- [Derive Macros](../level_12/derive_macros.md) — Specific subset of procedural macros for auto-implementing traits.

---

## 8. Key Takeaways

- Procedural Macros are compile-time Rust functions operating on source code token streams (`TokenStream`).
- Proc macros come in three forms: **Derive** (`#[derive(...)]`), **Attribute** (`#[attr]`), and **Function-like** (`macro!(...)`).
- They MUST be defined in a dedicated crate marked with `proc-macro = true` in `Cargo.toml`.
- Libraries like `syn` and `quote` provide parsing and AST code-generation capabilities for writing robust procedural macros.
