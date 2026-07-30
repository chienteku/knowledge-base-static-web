# `quote` Crate

> **Level 12 — Macros**
> The de facto standard Rust crate for generating token streams from quasi-quoted template code inside procedural macros.

---

## 1. Prerequisites

- [Token Stream](../level_12/token_stream.md) — Understanding `proc_macro2::TokenStream` as the output target for macro code generation.
- [Procedural Macros](../level_12/procedural_macros.md) — Proc macro architecture, host execution, and crate requirements.
- [`syn` Crate](../level_12/syn_crate.md) — The complementary parsing library that produces AST structs interpolated by `quote!`.

---

## 2. Term Category

**Ecosystem / Tooling**: The `quote` crate is the code-generation pillar of Rust metaprogramming. It provides the `quote!` macro (and `quote_spanned!`), allowing developers to write quasi-quoted Rust code templates that interpolate AST variables (`#var`, `#(#repeated)*`) directly into a strongly-typed `TokenStream`.

---

## 3. Environment Context

**Cargo Dependency (Host Compile-Time)**: `quote` is used as a `[dependencies]` entry in procedural macro crates or code generator tooling. It runs on the build host during compilation to synthesize Rust source code.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"

After parsing a `TokenStream` into an AST using the `syn` crate, a procedural macro must synthesize new Rust code to return to the compiler.

If you had to construct a `TokenStream` manually using raw compiler tokens:
1. You would have to construct individual `TokenTree::Ident`, `TokenTree::Punct`, and `TokenTree::Group` items.
2. Manually append semicolons, braces, and commas token by token.
3. Manage nested delimiters by manually instantiating `proc_macro2::Group` structures.

Constructing ASTs programmatically token-by-token is verbose, unreadable, and error-prone. Alternatively, building code via raw string formatting (`format!("fn {}() {{ ... }}", name)`) loses `Span` source tracking metadata and risks broken syntax.

The `quote` crate solves this by introducing quasi-quoting (`quote! { ... }`). You write standard Rust code templates directly inside the `quote!` block, interpolating variables with `#var` (single value) or `#(#iter)*` (repeated collection elements). `quote!` automatically converts the template into a valid, span-preserving `proc_macro2::TokenStream`.

### (2) Reality Metaphor

Imagine a **3D Mold Printing Press with Dynamic Slots**:

- **Manual Token Construction** is like assembling a building word by word using individual physical printing press type-blocks: picking up letter 'f', letter 'n', space, bracket '{', and setting them into place by hand.
- **String Formatting (`format!`)** is like writing code on a paper napkin with a marker: quick to draft, but structural alignment is unchecked and the paper tears easily when fed into automated machinery (**loses Span metadata**).
- **The `quote` Crate (`quote!`)** is a state-of-the-art 3D mold press: you write the template in clean, standard Rust code layout, leave marked slots (`#variable_name` or `#(#list)*`), and the press instantly stamps out perfect, high-precision industrial components (**a valid `TokenStream`**) with exact position timestamps (**`Span`**).

### (3) Code Examples

#### Short Snippet (Basic Variable Interpolation with `quote!`)

*Note: In `Cargo.toml`, add `quote = "1.0"`.*

```rust
use proc_macro2::TokenStream;
use quote::quote;
use syn::Ident;

fn main() {
    // Define identifiers and types to interpolate
    let struct_name = Ident::new("UserProfile", proc_macro2::Span::call_site());
    let field_name = Ident::new("user_id", proc_macro2::Span::call_site());
    let field_type = quote!(u64);

    // Generate token stream using quasi-quoting interpolation `#var`
    let generated_code: TokenStream = quote! {
        struct #struct_name {
            pub #field_name: #field_type,
        }
    };

    println!("Generated code:\n{}", generated_code);
    // Output:
    // struct UserProfile { pub user_id : u64 , }
}
```

#### Fuller Example (Repetition Interpolation `#(#var)*` in Derive Macros)

```rust
use proc_macro2::TokenStream;
use quote::quote;
use syn::{parse_str, DeriveInput};

fn generate_getter_methods(input_code: &str) -> TokenStream {
    let ast: DeriveInput = parse_str(input_code).expect("Failed to parse struct");
    let struct_name = &ast.ident;

    // Extract field names and types into vectors
    let fields = match ast.data {
        syn::Data::Struct(syn::DataStruct { fields: syn::Fields::Named(f), .. }) => f.named,
        _ => panic!("Only structs with named fields are supported"),
    };

    let field_names: Vec<_> = fields.iter().map(|f| &f.ident).collect();
    let field_types: Vec<_> = fields.iter().map(|f| &f.ty).collect();

    // Use repetition syntax `#(#var)*` to generate getter methods for all fields:
    let expanded = quote! {
        impl #struct_name {
            #(
                pub fn #field_names(&self) -> &#field_types {
                    &self.#field_names
                }
            )*
        }
    };

    expanded
}

fn main() {
    let code = "struct Settings { timeout: u32, max_retries: u8 }";
    let getters = generate_getter_methods(code);
    println!("Generated getters:\n{}", getters);
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Mismatched Vector Lengths in Multi-Variable Repetitions

**The mistake:** Using multiple variables in a single repetition block `#(#var_a: #var_b),*` when `var_a` and `var_b` do not have the exact same number of elements.

**Why it's wrong:** `quote!` iterates through all repeated vectors in parallel inside `#(...)*`. If one vector has 3 elements and another has 2, `quote!` panics at compile time.

*Incorrect:*
```rust
let names = vec![quote!(a), quote!(b), quote!(c)]; // 3 items
let types = vec![quote!(i32), quote!(String)];     // ❌ 2 items!

// Panics during macro execution: repetition vectors must have equal lengths
let bad = quote! { #(let #names: #types;)* }; 
```

*Fix:*
```rust
let names = vec![quote!(a), quote!(b), quote!(c)];
let types = vec![quote!(i32), quote!(String), quote!(bool)]; // Correct: matched lengths

let good = quote! { #(let #names: #types;)* };
```

### Mistake 2: Forgetting the Trait `ToTokens` for Custom Interpolated Structs

**The mistake:** Trying to interpolate a custom struct `#my_struct` inside `quote!` without implementing `quote::ToTokens` for that struct.

**Why it's wrong:** `quote!` requires every interpolated variable (`#var`) to implement the `ToTokens` trait so it knows how to convert the variable into a token stream. Standard types, `syn` AST nodes, and `proc_macro2` types implement `ToTokens` out of the box, but custom structs do not unless implemented manually.

*Incorrect:*
```rust
struct CustomField { name: String }

let field = CustomField { name: "age".to_string() };
// ❌ Compiler Error: `CustomField` does not implement `quote::ToTokens`
let code = quote! { let #field = 10; };
```

*Fix:*
```rust
use quote::{quote, ToTokens, TokenStreamExt};
use proc_macro2::TokenStream;

struct CustomField { name: String }

impl ToTokens for CustomField {
    fn to_tokens(&self, tokens: &mut TokenStream) {
        let ident = syn::Ident::new(&self.name, proc_macro2::Span::call_site());
        ident.to_tokens(tokens);
    }
}

let field = CustomField { name: "age".to_string() };
let code = quote! { let #field = 10; }; // Correct
```

### Mistake 3: Using `quote!` instead of `quote_spanned!` for Target Error Spans

**The mistake:** Generating code that validates a specific struct field using `quote!`, causing compiler error messages for generated code to point to the call site rather than the specific field span.

**Why it's wrong:** Standard `quote!` assigns `Span::call_site()` to generated tokens. `quote_spanned!` allows binding generated tokens to the exact source span (`field.span()`) of an input AST node, delivering targeted error highlighting in IDEs.

*Incorrect:*
```rust
// ❌ Errors in generated check will point to the entire #[derive(...)] attribute line
let check = quote! {
    compile_error!("Invalid type for field");
};
```

*Fix:*
```rust
use quote::quote_spanned;
use syn::spanned::Spanned;

// Correct: Error highlight directly squiggles the specific invalid field
let field_span = field.span();
let check = quote_spanned! { field_span =>
    compile_error!("Invalid type for field");
};
```

---

## 6. Practice Exercises

### Exercise 1: Embedded Peripheral Bitfield Accessor Generator

**Problem:** In embedded systems drivers (such as memory-mapped peripheral hardware registers on ARM Cortex-M or RISC-V microcontrollers), registers are represented as numeric primitive integers (e.g., `u32`). Specific bit slices govern peripheral states like baud rate dividers, hardware enable flags, or interrupt masks. Writing bitwise shift (`>>`, `<<`) and bitmask (`&`) boilerplate for every bitfield is tedious and error-prone.

Write a function `generate_register_accessors` that accepts a struct identifier and a slice of bitfield specifications `(name, mask, shift)`. Using `quote!` repetition syntax `#(#var)*` and `quote::format_ident!`, generate an `impl` block containing getter (`get_<field>`) and setter (`set_<field>`) methods for each bitfield. Write a complete test function with assertions verifying output validity.

> [!check]- Answer
> ```rust
> use proc_macro2::{Span, TokenStream};
> use quote::{format_ident, quote};
> use syn::Ident;
> 
> #[derive(Debug, Clone)]
> pub struct BitfieldSpec {
>     pub name: String,
>     pub mask: u32,
>     pub shift: u32,
> }
> 
> /// Generates getter and setter methods for hardware register bitfields.
> pub fn generate_register_accessors(
>     struct_name: &Ident,
>     fields: &[BitfieldSpec],
> ) -> TokenStream {
>     let getters: Vec<Ident> = fields
>         .iter()
>         .map(|f| Ident::new(&f.name, Span::call_site()))
>         .collect();
> 
>     let setters: Vec<Ident> = fields
>         .iter()
>         .map(|f| format_ident!("set_{}", f.name))
>         .collect();
> 
>     let masks: Vec<u32> = fields.iter().map(|f| f.mask).collect();
>     let shifts: Vec<u32> = fields.iter().map(|f| f.shift).collect();
> 
>     // Parallel vector interpolation inside repetition block `#(...)*`
>     quote! {
>         impl #struct_name {
>             #(
>                 pub fn #getters(&self) -> u32 {
>                     (self.bits >> #shifts) & #masks
>                 }
> 
>                 pub fn #setters(&mut self, value: u32) {
>                     let mask_shifted = #masks << #shifts;
>                     let inverted_mask = !mask_shifted;
>                     self.bits = (self.bits & inverted_mask) | ((value & #masks) << #shifts);
>                 }
>             )*
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_register_accessor_generation() {
>         let struct_ident = Ident::new("UartControlRegister", Span::call_site());
>         let fields = vec![
>             BitfieldSpec {
>                 name: "baud_rate".to_string(),
>                 mask: 0xFF,
>                 shift: 0,
>             },
>             BitfieldSpec {
>                 name: "enable_tx".to_string(),
>                 mask: 0x01,
>                 shift: 8,
>             },
>         ];
> 
>         let generated = generate_register_accessors(&struct_ident, &fields);
>         let code_str = generated.to_string();
> 
>         // Assert generated code contains expected methods and operations
>         assert!(code_str.contains("impl UartControlRegister"));
>         assert!(code_str.contains("pub fn baud_rate"));
>         assert!(code_str.contains("pub fn set_baud_rate"));
>         assert!(code_str.contains("pub fn enable_tx"));
>         assert!(code_str.contains("pub fn set_enable_tx"));
> 
>         // Parse token stream back with syn to ensure structural Rust syntactic validity
>         let parsed: Result<syn::ItemImpl, _> = syn::parse2(generated);
>         assert!(parsed.is_ok(), "Generated TokenStream must parse as valid impl block");
>     }
> }
> ```
>
> **Explanation:**
> 1. **Parallel Vector Repetition (`#(#getters ... #setters ... #shifts ... #masks)*`):** `quote!` iterates through multiple vectors in lockstep within a single `#(...)*` repetition block. All parallel vectors (`getters`, `setters`, `masks`, `shifts`) must have identical lengths, otherwise `quote!` will panic at macro expansion time.
> 2. **Identifier Synthesis with `format_ident!`:** The `format_ident!` macro from the `quote` crate enables dynamic identifier construction (e.g., prefixing `"set_"` to `"baud_rate"` to produce `set_baud_rate`) while retaining proper `Span` context.
> 3. **Numeric Literal Interpolation:** Primitive integers like `u32` automatically implement `quote::ToTokens`, allowing numeric expressions (`#shifts`, `#masks`) to be seamlessly quasi-quoted into generated expressions.
> 4. **Syntactic Verification via `syn::parse2`:** Passing the resulting `TokenStream` to `syn::parse2::<syn::ItemImpl>()` programmatically verifies that the synthesized output represents syntactically valid Rust code without needing a full proc-macro compiler invocation.

---

### Exercise 2: Implementing `ToTokens` for Microservice Telemetry Endpoint Config

**Problem:** In distributed microservices, API route configurations (path, rate limit RPS, authentication requirement) are parsed from schema definitions into custom AST structs during macro expansion. To emit a `pub static REGISTRY: EndpointConfig = #endpoint;` item in generated Rust code using `quote!`, the custom `TelemetryEndpoint` AST struct must implement the `quote::ToTokens` trait.

Implement `ToTokens` for `TelemetryEndpoint` so that interpolating `#endpoint` produces a Rust struct literal `EndpointConfig { path: "...", rate_limit_rps: ..., requires_auth: ... }`. Create a static registry code generator function and write unit tests asserting token stream correctness.

> [!check]- Answer
> ```rust
> use proc_macro2::TokenStream;
> use quote::{quote, ToTokens, TokenStreamExt};
> use syn::Ident;
> 
> #[derive(Debug, Clone, PartialEq)]
> pub struct TelemetryEndpoint {
>     pub path: String,
>     pub rate_limit_rps: u32,
>     pub requires_auth: bool,
> }
> 
> // Implement ToTokens so quote! can interpolate #endpoint directly
> impl ToTokens for TelemetryEndpoint {
>     fn to_tokens(&self, tokens: &mut TokenStream) {
>         let path = &self.path;
>         let rate_limit = self.rate_limit_rps;
>         let requires_auth = self.requires_auth;
> 
>         let struct_literal = quote! {
>             EndpointConfig {
>                 path: #path,
>                 rate_limit_rps: #rate_limit,
>                 requires_auth: #requires_auth,
>             }
>         };
> 
>         tokens.extend(struct_literal);
>     }
> }
> 
> /// Generates a public static definition for an endpoint configuration
> pub fn generate_static_endpoint(
>     var_name: &Ident,
>     endpoint: &TelemetryEndpoint,
> ) -> TokenStream {
>     quote! {
>         pub static #var_name: EndpointConfig = #endpoint;
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
>     use proc_macro2::Span;
> 
>     #[test]
>     fn test_telemetry_endpoint_to_tokens() {
>         let endpoint = TelemetryEndpoint {
>             path: "/api/v1/health".to_string(),
>             rate_limit_rps: 1000,
>             requires_auth: false,
>         };
> 
>         let var_ident = Ident::new("HEALTH_ENDPOINT", Span::call_site());
>         let generated = generate_static_endpoint(&var_ident, &endpoint);
>         let code_str = generated.to_string();
> 
>         // Assert generated static declaration and fields
>         assert!(code_str.contains("pub static HEALTH_ENDPOINT : EndpointConfig = EndpointConfig"));
>         assert!(code_str.contains("\"/api/v1/health\""));
>         assert!(code_str.contains("1000u32") || code_str.contains("1000"));
>         assert!(code_str.contains("false"));
> 
>         // Parse back into syn::ItemStatic to verify valid static declaration syntax
>         let parsed: Result<syn::ItemStatic, _> = syn::parse2(generated);
>         assert!(parsed.is_ok(), "Generated TokenStream must parse as a valid static variable declaration");
>     }
> }
> ```
>
> **Explanation:**
> 1. **The `ToTokens` Trait Contract:** `quote!` relies on `ToTokens::to_tokens(&self, tokens: &mut TokenStream)` to convert any interpolated `#variable` into tokens. Standard types (`String`, `u32`, `bool`, `syn::Ident`) implement `ToTokens`, but user-defined AST structs require explicit implementation.
> 2. **Token Stream Extension (`tokens.extend(...)`):** Inside `to_tokens`, quasi-quoted tokens created via `quote! { EndpointConfig { ... } }` are appended to the caller's target `&mut TokenStream` using `tokens.extend()`.
> 3. **Compositional Quasi-Quoting:** By implementing `ToTokens` on `TelemetryEndpoint`, higher-level code generators can cleanly write `#endpoint` without manually decomposing fields every time an endpoint is generated.

---

### Exercise 3: Precise Diagnostic Squiggles using `quote_spanned!` in Deterministic Safety Macros

**Problem:** In safety-critical embedded software (such as motor control loops or aerospace avionics), floating-point arithmetic (`f32`, `f64`) is prohibited due to non-deterministic hardware timing and potential floating-point exception handling latency. When developing a procedural macro `#[derive(DeterministicState)]`, if a user includes a floating-point field in their struct, the macro must generate a `compile_error!` targeted **directly to the offending field line** rather than squiggly-underlining the entire `#[derive(...)]` attribute on the struct.

Implement `generate_deterministic_state_impl` using `syn::spanned::Spanned` and `quote_spanned!`. If any struct field is of type `f32` or `f64`, emit a `compile_error!` bound to that field's exact `Span`. Otherwise, generate an `impl` block containing a `pub fn field_count() -> usize` method. Write unit tests confirming correct error stream generation and valid struct expansion.

> [!check]- Answer
> ```rust
> use proc_macro2::TokenStream;
> use quote::{quote, quote_spanned};
> use syn::{spanned::Spanned, Data, DeriveInput, Fields, Type};
> 
> /// Generates deterministic state impl or emits field-targeted compile_error!
> pub fn generate_deterministic_state_impl(ast: &DeriveInput) -> TokenStream {
>     let struct_name = &ast.ident;
> 
>     let fields = match &ast.data {
>         Data::Struct(data_struct) => match &data_struct.fields {
>             Fields::Named(fields_named) => &fields_named.named,
>             _ => {
>                 return quote_spanned! { ast.span() =>
>                     compile_error!("DeterministicState only supports structs with named fields");
>                 };
>             }
>         },
>         _ => {
>             return quote_spanned! { ast.span() =>
>                 compile_error!("DeterministicState can only be derived for structs");
>             };
>         }
>     };
> 
>     // Inspect fields for prohibited floating-point types
>     for field in fields {
>         if let Type::Path(type_path) = &field.ty {
>             if let Some(segment) = type_path.path.segments.last() {
>                 let type_name = segment.ident.to_string();
>                 if type_name == "f32" || type_name == "f64" {
>                     let field_span = field.span();
>                     return quote_spanned! { field_span =>
>                         compile_error!("Floating-point types (f32/f64) are strictly prohibited in deterministic state structs");
>                     };
>                 }
>             }
>         }
>     }
> 
>     let field_count = fields.len();
> 
>     quote! {
>         impl #struct_name {
>             pub fn field_count() -> usize {
>                 #field_count
>             }
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
>     use syn::parse_str;
> 
>     #[test]
>     fn test_valid_deterministic_struct() {
>         let input_code = r#"
>             struct MotorControllerState {
>                 position_ticks: i32,
>                 encoder_raw: u16,
>             }
>         "#;
>         let ast: DeriveInput = parse_str(input_code).unwrap();
>         let expanded = generate_deterministic_state_impl(&ast);
>         let code_str = expanded.to_string();
> 
>         assert!(code_str.contains("impl MotorControllerState"));
>         assert!(code_str.contains("pub fn field_count ( ) -> usize { 2usize }"));
> 
>         let parsed: Result<syn::ItemImpl, _> = syn::parse2(expanded);
>         assert!(parsed.is_ok(), "Valid struct should expand to syntactically correct impl");
>     }
> 
>     #[test]
>     fn test_float_rejection_emits_targeted_compile_error() {
>         let input_code = r#"
>             struct SensorTelemetry {
>                 timestamp_ms: u64,
>                 raw_voltage: f32,
>             }
>         "#;
>         let ast: DeriveInput = parse_str(input_code).unwrap();
>         let expanded = generate_deterministic_state_impl(&ast);
>         let code_str = expanded.to_string();
> 
>         assert!(code_str.contains("compile_error !"));
>         assert!(code_str.contains("Floating-point types (f32/f64) are strictly prohibited"));
>     }
> }
> ```
>
> **Explanation:**
> 1. **Diagnostic Precision with `quote_spanned!`:** Standard `quote!` assigns `Span::call_site()` to synthesized tokens. If a macro returns `compile_error!`, IDEs and `rustc` will highlight the macro invocation site (e.g. `#[derive(...)]`). By passing `field.span()` to `quote_spanned! { field_span => ... }`, compiler errors directly underline the specific problematic field definition line (`raw_voltage: f32`).
> 2. **`syn::spanned::Spanned` Trait:** Bringing `syn::spanned::Spanned` into scope grants the `.span()` method on all `syn` AST nodes (`Field`, `Ident`, `Type`, `DeriveInput`), allowing macro authors to extract precise source coordinate metadata.
> 3. **Early Exit Error Patterns:** In procedural macros, returning early with `quote_spanned!` containing `compile_error!(...)` is the standard, safe way to report compile-time domain validation failures without panicking the compiler driver process.

---

## 7. Related Terms

- [`syn` Crate](../level_12/syn_crate.md) — The complementary parsing library producing AST inputs for `quote!`.
- [Token Stream](../level_12/token_stream.md) — The output data format (`proc_macro2::TokenStream`) generated by `quote!`.
- [Procedural Macros](../level_12/procedural_macros.md) — Metaprogramming constructs that return `quote!` generated token streams.
- [Hygiene](../level_12/hygiene.md) — Macro hygiene properties managed by Span metadata inside `quote!`.

---

## 8. Key Takeaways

- The `quote` crate provides `quote!` for generating `TokenStream` instances via quasi-quoted template code.
- Variables are interpolated using single-item `#var` syntax or repeated `#(#iter)*` collection syntax.
- Separators inside repetition patterns (e.g. `,`, `;`) control how elements are joined in generated code.
- Types interpolated into `quote!` must implement the `quote::ToTokens` trait.
- Use `quote_spanned!` to attach specific source code spans to generated code for precise compiler diagnostic squiggles.
