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

### Exercise 1: Derive Procedural Macro — `#[derive(Telemetry)]` for Automatic Field Inspection & Serialization

**Problem:** In an embedded telemetry gateway monitoring IoT sensors, you need to output diagnostic key-value summaries for data structures without runtime reflection overhead. Implement a custom Derive Procedural Macro named `#[derive(Telemetry)]` that automatically generates an implementation of the `Telemetry` trait for structs with named fields. The `Telemetry` trait provides `field_count() -> usize`, `telemetry_keys() -> &'static [&'static str]`, and `to_telemetry_pairs(&self) -> Vec<(&'static str, String)>`. Write the complete proc-macro crate code, the application usage code, and unit tests with assertions (`assert_eq!`, `assert!`) verifying field inspection and serialization.

> [!check]- Answer
> ```rust
> // ===========================================================================
> // 1. Dedicated Proc-Macro Crate Definition: `my_telemetry_derive`
> // ===========================================================================
> // Cargo.toml:
> // [lib]
> // proc-macro = true
> //
> // [dependencies]
> // syn = { version = "2.0", features = ["derive", "parsing"] }
> // quote = "1.0"
> // proc-macro2 = "1.0"
> 
> extern crate proc_macro;
> use proc_macro::TokenStream;
> use quote::quote;
> use syn::{parse_macro_input, Data, DeriveInput, Fields};
> 
> /// Custom Derive procedural macro generating `Telemetry` trait implementations
> #[proc_macro_derive(Telemetry)]
> pub fn derive_telemetry(input: TokenStream) -> TokenStream {
>     // Parse the incoming token stream into an AST syntax tree
>     let input = parse_macro_input!(input as DeriveInput);
>     let struct_name = &input.ident;
> 
>     // Extract named struct fields
>     let fields = match &input.data {
>         Data::Struct(data) => match &data.fields {
>             Fields::Named(fields) => &fields.named,
>             _ => panic!("Telemetry derive only supports structs with named fields"),
>         },
>         _ => panic!("Telemetry derive only supports structs"),
>     };
> 
>     // Collect field identifiers and string representations
>     let field_idents: Vec<_> = fields.iter().map(|f| f.ident.as_ref().unwrap()).collect();
>     let field_name_strs: Vec<_> = field_idents.iter().map(|id| id.to_string()).collect();
>     let field_count = field_idents.len();
> 
>     // Generate trait implementation code using quote!
>     let expanded = quote! {
>         impl Telemetry for #struct_name {
>             fn field_count() -> usize {
>                 #field_count
>             }
> 
>             fn telemetry_keys() -> &'static [&'static str] {
>                 &[ #( #field_name_strs ),* ]
>             }
> 
>             fn to_telemetry_pairs(&self) -> Vec<(&'static str, String)> {
>                 vec![
>                     #(
>                         ( #field_name_strs, format!("{:?}", self.#field_idents) )
>                     ),*
>                 ]
>             }
>         }
>     };
> 
>     TokenStream::from(expanded)
> }
> 
> // ===========================================================================
> // 2. Consuming Application Code & Unit Tests (`src/main.rs`)
> // ===========================================================================
> use my_telemetry_derive::Telemetry;
> 
> pub trait Telemetry {
>     fn field_count() -> usize;
>     fn telemetry_keys() -> &'static [&'static str];
>     fn to_telemetry_pairs(&self) -> Vec<(&'static str, String)>;
> }
> 
> #[derive(Debug, Telemetry)]
> struct SensorReading {
>     temperature_celsius: f32,
>     humidity_percent: u8,
>     pressure_hpa: u32,
> }
> 
> fn main() {
>     let reading = SensorReading {
>         temperature_celsius: 22.5,
>         humidity_percent: 55,
>         pressure_hpa: 1013,
>     };
>     println!("Keys: {:?}", SensorReading::telemetry_keys());
>     println!("Pairs: {:?}", reading.to_telemetry_pairs());
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_telemetry_field_count() {
>         assert_eq!(SensorReading::field_count(), 3);
>     }
> 
>     #[test]
>     fn test_telemetry_keys() {
>         let keys = SensorReading::telemetry_keys();
>         assert_eq!(keys, &["temperature_celsius", "humidity_percent", "pressure_hpa"]);
>     }
> 
>     #[test]
>     fn test_telemetry_pairs() {
>         let reading = SensorReading {
>             temperature_celsius: 22.5,
>             humidity_percent: 55,
>             pressure_hpa: 1013,
>         };
> 
>         let pairs = reading.to_telemetry_pairs();
>         assert_eq!(pairs.len(), 3);
>         assert_eq!(pairs[0], ("temperature_celsius", "22.5".to_string()));
>         assert_eq!(pairs[1], ("humidity_percent", "55".to_string()));
>         assert_eq!(pairs[2], ("pressure_hpa", "1013".to_string()));
>     }
> }
> ```
> 
> **Explanation:**
> 1. **Proc-Macro Crate Configuration**: Procedural macros cannot be defined in standard application binaries; they require a library crate with `proc-macro = true` in `Cargo.toml`.
> 2. **AST Parsing (`syn`)**: `parse_macro_input!(input as DeriveInput)` parses raw compiler tokens into a structured syntax tree. `input.data` allows matching on `Data::Struct` and accessing `Fields::Named`.
> 3. **Code Generation (`quote!`)**: The `quote!` macro constructs Rust token streams. Interpolations like `#struct_name` substitute identifiers, while `#(#field_name_strs),*` performs repetition matching over field arrays.
> 4. **Zero Runtime Reflection Overhead**: The generated `field_count()` and `telemetry_keys()` static functions evaluate at compile time, eliminating runtime inspection penalties.

---

### Exercise 2: Attribute Procedural Macro — `#[retry(max_attempts = N)]` for Fault-Tolerant I/O Operations

**Problem:** In hardware register communication (such as I2C/SPI sensor reads), transient bus interference frequently causes transient errors. Writing manual retry loops inside every I/O function creates repetitive boilerplate. Construct an Attribute Procedural Macro named `#[retry]` (accepting an optional integer literal argument like `#[retry(3)]`) that transforms any function returning `Result<T, E>`. The macro rewrites the function body to execute inside a retry loop, retrying up to `max_attempts` times before returning the final error. Write complete proc-macro crate code, usage code with failure simulation, and unit tests with assertions (`assert_eq!`, `assert!`) verifying retry execution counts and success/failure outcomes.

> [!check]- Answer
> ```rust
> // ===========================================================================
> // 1. Dedicated Proc-Macro Crate Definition: `my_retry_macro`
> // ===========================================================================
> // Cargo.toml:
> // [lib]
> // proc-macro = true
> //
> // [dependencies]
> // syn = { version = "2.0", features = ["full", "parsing"] }
> // quote = "1.0"
> // proc-macro2 = "1.0"
> 
> extern crate proc_macro;
> use proc_macro::TokenStream;
> use quote::quote;
> use syn::{parse_macro_input, ItemFn, LitInt};
> 
> /// Attribute procedural macro transforming Result-returning functions with retry logic
> #[proc_macro_attribute]
> pub fn retry(attr: TokenStream, item: TokenStream) -> TokenStream {
>     // Parse attribute argument for max attempts (defaulting to 3 if unspecified)
>     let max_attempts: usize = if attr.is_empty() {
>         3
>     } else {
>         parse_macro_input!(attr as LitInt)
>             .base10_parse()
>             .unwrap_or(3)
>     };
> 
>     // Parse target item as a function AST node
>     let input_fn = parse_macro_input!(item as ItemFn);
>     let vis = &input_fn.vis;
>     let sig = &input_fn.sig;
>     let block = &input_fn.block;
> 
>     // Wrap original function body inside a retry loop execution closure
>     let expanded = quote! {
>         #vis #sig {
>             let mut attempts = 0;
>             loop {
>                 attempts += 1;
>                 let body_closure = || #block;
>                 let result = body_closure();
>                 match result {
>                     Ok(val) => return Ok(val),
>                     Err(err) if attempts >= #max_attempts => return Err(err),
>                     Err(_) => {
>                         // Continue retrying up to max_attempts
>                     }
>                 }
>             }
>         }
>     };
> 
>     TokenStream::from(expanded)
> }
> 
> // ===========================================================================
> // 2. Consuming Application Code & Unit Tests (`src/main.rs`)
> // ===========================================================================
> use my_retry_macro::retry;
> use std::sync::atomic::{AtomicUsize, Ordering};
> 
> static ATTEMPT_COUNTER: AtomicUsize = AtomicUsize::new(0);
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum BusError {
>     BusBusy,
>     DeviceTimeout,
> }
> 
> /// Simulated hardware function retried up to 3 times
> #[retry(3)]
> pub fn read_bus_register(fail_count: usize) -> Result<u16, BusError> {
>     let current_attempt = ATTEMPT_COUNTER.fetch_add(1, Ordering::SeqCst) + 1;
>     if current_attempt <= fail_count {
>         Err(BusError::BusBusy)
>     } else {
>         Ok(0x4242)
>     }
> }
> 
> fn main() {
>     ATTEMPT_COUNTER.store(0, Ordering::SeqCst);
>     let data = read_bus_register(1);
>     println!("Result: {:?}", data);
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_retry_succeeds_within_limit() {
>         ATTEMPT_COUNTER.store(0, Ordering::SeqCst);
>         // Fails on attempt 1, succeeds on attempt 2 (max_attempts = 3)
>         let res = read_bus_register(1);
>         assert_eq!(res, Ok(0x4242));
>         assert_eq!(ATTEMPT_COUNTER.load(Ordering::SeqCst), 2);
>     }
> 
>     #[test]
>     fn test_retry_fails_exceeding_limit() {
>         ATTEMPT_COUNTER.store(0, Ordering::SeqCst);
>         // Fails 5 times, but max_attempts is capped at 3
>         let res = read_bus_register(5);
>         assert_eq!(res, Err(BusError::BusBusy));
>         assert_eq!(ATTEMPT_COUNTER.load(Ordering::SeqCst), 3);
>     }
> }
> ```
> 
> **Explanation:**
> 1. **Attribute Macro Signature**: Attribute procedural macros receive two `TokenStream` parameters: `attr` (tokens inside `#[retry(...)]`) and `item` (the syntax item attached to the attribute, such as `fn`).
> 2. **Parsing Attribute Literals**: `parse_macro_input!(attr as LitInt)` parses integer literals passed to the attribute macro, providing customizable retry thresholds per function.
> 3. **AST Reconstruction**: The macro captures visibility (`#vis`), signature (`#sig`), and body (`#block`) of the original function and reconstructs a new function body wrapping `#block` in an escalating attempt loop.
> 4. **Empirical Verification**: Unit tests verify retry logic using `AtomicUsize` counters to prove that transient errors trigger retries and max attempt boundaries are respected.

---

### Exercise 3: Function-Like Procedural Macro — `register_mask!` for Compile-Time Bitfield Struct Generation

**Problem:** In embedded microcontroller development (`#![no_std]`), peripheral control registers (like UART, SPI, or I2C) rely on bitwise mask constants. Manually calculating bit-shift positions (`1 << 0`, `1 << 1`, `1 << 2`) is prone to off-by-one errors. Implement a function-like procedural macro `register_mask!` that parses syntax like `register_mask!(ControlRegister => TX_EN, RX_EN, INT_EN)` and expands it into a bitfield struct containing `const` mask definitions and type-safe bitwise methods (`empty()`, `set()`, `unset()`, `contains()`). Write complete proc-macro crate code, custom `syn::parse::Parse` implementation, user application code, and unit tests with assertions (`assert!`, `assert_eq!`) verifying bitmask values and bitwise operations.

> [!check]- Answer
> ```rust
> // ===========================================================================
> // 1. Dedicated Proc-Macro Crate Definition: `my_bitmask_macro`
> // ===========================================================================
> // Cargo.toml:
> // [lib]
> // proc-macro = true
> //
> // [dependencies]
> // syn = { version = "2.0", features = ["full", "parsing"] }
> // quote = "1.0"
> // proc-macro2 = "1.0"
> 
> extern crate proc_macro;
> use proc_macro::TokenStream;
> use quote::quote;
> use syn::parse::{Parse, ParseStream};
> use syn::punctuated::Punctuated;
> use syn::{parse_macro_input, Ident, Token};
> 
> /// Custom AST representation for custom macro syntax: StructName => FLAG1, FLAG2
> struct BitmaskSyntax {
>     struct_name: Ident,
>     flags: Vec<Ident>,
> }
> 
> impl Parse for BitmaskSyntax {
>     fn parse(input: ParseStream) -> syn::Result<Self> {
>         let struct_name: Ident = input.parse()?;
>         let _: Token![=>] = input.parse()?;
>         let flags_punctuated: Punctuated<Ident, Token![,]> =
>             input.parse_terminated(Ident::parse, Token![,])?;
> 
>         Ok(BitmaskSyntax {
>             struct_name,
>             flags: flags_punctuated.into_iter().collect(),
>         })
>     }
> }
> 
> /// Function-like procedural macro generating bitmask register structs
> #[proc_macro]
> pub fn register_mask(input: TokenStream) -> TokenStream {
>     let BitmaskSyntax { struct_name, flags } = parse_macro_input!(input as BitmaskSyntax);
> 
>     // Generate const bitmask declarations with escalating left shifts (1 << 0, 1 << 1, etc.)
>     let flag_consts = flags.iter().enumerate().map(|(index, flag_ident)| {
>         let shift = index as u8;
>         quote! {
>             pub const #flag_ident: u8 = 1 << #shift;
>         }
>     });
> 
>     let expanded = quote! {
>         #[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
>         pub struct #struct_name {
>             bits: u8,
>         }
> 
>         impl #struct_name {
>             #( #flag_consts )*
> 
>             pub const fn empty() -> Self {
>                 Self { bits: 0 }
>             }
> 
>             pub const fn from_bits(bits: u8) -> Self {
>                 Self { bits }
>             }
> 
>             pub fn bits(&self) -> u8 {
>                 self.bits
>             }
> 
>             pub fn set(&mut self, flag: u8) {
>                 self.bits |= flag;
>             }
> 
>             pub fn unset(&mut self, flag: u8) {
>                 self.bits &= !flag;
>             }
> 
>             pub fn contains(&self, flag: u8) -> bool {
>                 (self.bits & flag) == flag
>             }
>         }
>     };
> 
>     TokenStream::from(expanded)
> }
> 
> // ===========================================================================
> // 2. Consuming Application Code & Unit Tests (`src/main.rs`)
> // ===========================================================================
> use my_bitmask_macro::register_mask;
> 
> // Define peripheral bitmask struct via procedural macro
> register_mask!(UartControl => TX_ENABLE, RX_ENABLE, PARITY_EVEN, INTERRUPT_ENABLE);
> 
> fn main() {
>     let mut ctrl = UartControl::empty();
>     ctrl.set(UartControl::TX_ENABLE);
>     println!("Control register bits: {:#010b}", ctrl.bits());
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_bitmask_const_values() {
>         assert_eq!(UartControl::TX_ENABLE, 1 << 0);       // 0b0000_0001 = 1
>         assert_eq!(UartControl::RX_ENABLE, 1 << 1);       // 0b0000_0010 = 2
>         assert_eq!(UartControl::PARITY_EVEN, 1 << 2);     // 0b0000_0100 = 4
>         assert_eq!(UartControl::INTERRUPT_ENABLE, 1 << 3); // 0b0000_1000 = 8
>     }
> 
>     #[test]
>     fn test_bitmask_set_and_contains() {
>         let mut ctrl = UartControl::empty();
>         assert_eq!(ctrl.bits(), 0);
>         assert!(!ctrl.contains(UartControl::TX_ENABLE));
> 
>         ctrl.set(UartControl::TX_ENABLE);
>         ctrl.set(UartControl::INTERRUPT_ENABLE);
> 
>         assert!(ctrl.contains(UartControl::TX_ENABLE));
>         assert!(ctrl.contains(UartControl::INTERRUPT_ENABLE));
>         assert!(!ctrl.contains(UartControl::RX_ENABLE));
>         assert_eq!(ctrl.bits(), 0b1001);
>     }
> 
>     #[test]
>     fn test_bitmask_unset() {
>         let mut ctrl = UartControl::from_bits(0b1111);
>         assert!(ctrl.contains(UartControl::PARITY_EVEN));
> 
>         ctrl.unset(UartControl::PARITY_EVEN);
>         assert!(!ctrl.contains(UartControl::PARITY_EVEN));
>         assert_eq!(ctrl.bits(), 0b1011);
>     }
> }
> ```
> 
> **Explanation:**
> 1. **Function-Like Proc Macro Entrypoint**: `#[proc_macro]` functions receive a single `TokenStream` representing all tokens inside `register_mask!(...)`.
> 2. **Custom Syntax Parsing**: Implementing `syn::parse::Parse` for custom data structures allows parsing non-standard Rust DSLs (such as matching custom tokens like `Token![=>]` and comma-separated identifier lists using `Punctuated`).
> 3. **Compile-Time Bit Calculations**: The macro computes bit shifts (`1 << index`) during compilation, embedding zero-cost `const` field values into the emitted struct definition.
> 4. **Verification via Assertions**: Unit tests prove bitwise operations (`set`, `unset`, `contains`, `from_bits`) match expected binary bitmask representations.

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
