# `syn` Crate

> **Level 12 — Macros**
> The de facto standard Rust crate for parsing low-level token streams into strongly-typed Abstract Syntax Trees (AST) inside procedural macros.

---

## 1. Prerequisites


- [Token Stream](token_stream.md) — Understanding `proc_macro::TokenStream` and `proc_macro2::TokenStream` as raw lexical token input sequences.
- [Procedural Macros](procedural_macros.md) — Proc macro architecture and execution during compilation.
- [Struct](../level_02/struct.md)

---

## 2. Term Category

**Ecosystem / Tooling**: The `syn` crate (short for "syntax") is the parsing pillar of the Rust procedural macro ecosystem. It takes raw token streams (`TokenStream`) from the compiler and parses them into rich, strongly-typed Rust data structures (Abstract Syntax Trees) like `syn::DeriveInput`, `syn::ItemFn`, `syn::Expr`, and `syn::Type`.

---

## 3. Environment Context

**Cargo Dependency (Host Compile-Time)**: `syn` is used as a `[dependencies]` entry inside procedural macro crates (or code-generation tooling). It operates on the build host during compilation to inspect and analyze Rust source code structure.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"

When building procedural macros, the compiler passes raw `TokenStream` instances consisting of low-level `TokenTree` tokens (`Ident`, `Punct`, `Literal`, `Group`).

If you had to manually inspect a struct declaration like `struct User { id: u64, name: String }` using raw token iteration:
1. You would have to manually search for the word `"struct"`.
2. Grab the next identifier as the struct name (`"User"`).
3. Find the `{` group token.
4. Step through commas, colons, field names, and type annotations while handling edge cases like generics (`<T>`), attributes (`#[serde(rename = "...")]`), and visibilities (`pub`).

Writing custom parsers for Rust syntax in every proc macro would be overwhelmingly complex, bug-prone, and unsustainable.

The `syn` crate solves this by providing a complete, battle-tested Rust parser. With a single call (`syn::parse::<syn::DeriveInput>(input)`), `syn` converts unstructured token streams into structured AST structs with accessible fields (e.g. `input.ident`, `input.data`, `field.ty`).

### (2) Reality Metaphor

Imagine a **Customs Inspector with an Automated Scanning Scanner**:

- A raw **`TokenStream`** is like a crate full of unsorted luggage items: loose shirts, shoes, passports, and wires thrown together in a pile.
- Manual token iteration without `syn` is like searching through the luggage with your bare hands, item by item, trying to guess which passport belongs to which shirt.
- The **`syn` Crate** is an advanced airport security scanner: it scans the luggage pile instantly, categorizes every item into labeled luggage compartments (**AST structs like `DeriveInput`**), groups struct fields into clean lists (**`syn::FieldsNamed`**), and flags invalid items with exact security error tickets (**`syn::Error`**).

### (3) Code Examples

#### Short Snippet (Parsing a `DeriveInput` with `syn`)

*Note: In `Cargo.toml`, add `syn = { version = "2.0", features = ["derive"] }`.*

```rust
use proc_macro::TokenStream;
use syn::{parse_macro_input, DeriveInput};

/// A derive macro using `syn` to parse the struct/enum definition
#[proc_macro_derive(MyDescribe)]
pub fn derive_describe(input: TokenStream) -> TokenStream {
    // `parse_macro_input!` uses `syn` to parse the TokenStream into a `syn::DeriveInput` AST struct.
    // If parsing fails, it automatically returns a `compile_error!`.
    let ast = parse_macro_input!(input as DeriveInput);

    // Extract struct/enum name identifier
    let name = &ast.ident;
    println!("Parsed struct or enum name: {}", name);

    // Return empty TokenStream for demonstration
    TokenStream::new()
}
```

#### Fuller Example (Inspecting Struct Fields with `syn` AST)

```rust
use syn::{Data, Fields, ItemStruct};
use quote::quote;

/// Helper function inspecting struct fields parsed by `syn`
fn analyze_struct_ast(item: ItemStruct) -> Vec<String> {
    let mut field_descriptions = Vec::new();

    // Check if the struct has named fields: `struct Point { x: i32, y: i32 }`
    if let Fields::Named(fields_named) = item.fields {
        for field in fields_named.named {
            // Get field identifier name
            if let Some(ident) = field.ident {
                field_descriptions.push(format!("Field: {}", ident));
            }
        }
    }

    field_descriptions
}

fn main() {
    // Parse raw code fragment string into a `syn::ItemStruct` AST node
    let code = "struct User { id: u64, username: String }";
    let parsed_struct: ItemStruct = syn::parse_str(code).expect("Failed to parse Rust struct");

    println!("Struct identifier: {}", parsed_struct.ident);
    let fields = analyze_struct_ast(parsed_struct);
    
    for f in fields {
        println!("{}", f);
    }
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Enabling Heavy `syn` Feature Flags Unnecessarily

**The mistake:** Adding `syn = { version = "2.0", features = ["full"] }` when writing basic derive macros that only require `features = ["derive"]`.

**Why it's wrong:** The `full` feature enables parsing for every possible Rust language construct (expressions, statements, match arms, async blocks). This significantly increases clean compilation time for your crate's downstream users.

*Incorrect:*
```toml
# Cargo.toml
[dependencies]
# ❌ Unnecessarily compiles full Rust expression & statement parser for a simple derive macro
syn = { version = "2.0", features = ["full", "extra-traits"] }
```

*Fix:*
```toml
# Cargo.toml
[dependencies]
# Correct: Enable only `derive` features for struct/enum derive macros
syn = { version = "2.0", features = ["derive"] }
```

### Mistake 2: Manual `panic!` instead of Returning `syn::Error`

**The mistake:** Calling `.unwrap()` or `panic!("invalid attribute")` when validating AST node properties parsed by `syn`.

**Why it's wrong:** Panicking inside a proc macro prints an unhelpful macro panic message without pointing to the exact source code span where the user made the mistake. Returning `syn::Error::into_compile_error()` attaches error squiggles directly to the invalid token in the developer's IDE.

*Incorrect:*
```rust
if ast.generics.params.len() > 0 {
    // ❌ Causes opaque compiler panic
    panic!("Generics are not supported on this macro!"); 
}
```

*Fix:*
```rust
if ast.generics.params.len() > 0 {
    // Correct: Emit syn::Error bound to the generics token span
    return syn::Error::new_spanned(&ast.generics, "Generics are not supported on this macro!")
        .to_compile_error()
        .into();
}
```

### Mistake 3: Overlooking Enum Variant Payload Types in `syn::Data`

**The mistake:** Assuming `syn::DeriveInput` always represents a `struct` with named fields.

**Why it's wrong:** `syn::DeriveInput` represents any item that can receive a `#[derive(...)]` attribute — which includes `struct` (unit, tuple, or named), `enum` (with tuple/named variants), and `union`. Attempting to access fields directly without pattern matching on `syn::Data` causes runtime errors or missing cases.

*Incorrect:*
```rust
// ❌ Panics or fails compile if macro is attached to an Enum instead of a Struct
let Data::Struct(data_struct) = ast.data else {
    panic!("Expected struct!");
};
```

*Fix:*
```rust
match ast.data {
    Data::Struct(data_struct) => { /* Handle struct */ }
    Data::Enum(data_enum) => { /* Handle enum variants */ }
    Data::Union(_) => {
        return syn::Error::new_spanned(ast, "Unions are not supported")
            .to_compile_error()
            .into();
    }
}
```

---

## 6. Practice Exercises

### Exercise 1: Helper Attribute Parsing and Struct Field Metadata Extraction

**Problem:** In custom serialization and RPC protocol procedural macros (such as custom `Protobuf` or `Bincode` derive macros), developers annotate struct fields with helper attributes to customize wire-format field names or exclude private fields.

Write a metadata parser function `parse_struct_field_schema(input_code: &str) -> Result<Vec<FieldSchema>, String>` using `syn` that parses a struct definition string into a `syn::DeriveInput`. For each named field:
1. Parse the field's identifier name and its type string representation.
2. Inspect field attributes for `#[codec(rename = "...")]` to override `wire_name`.
3. Inspect field attributes for `#[codec(skip)]` to set `is_skipped = true`.
4. If an unsupported attribute key inside `#[codec(...)]` is encountered, return a descriptive error message.

Include unit tests using `#[test]` assertions (`assert_eq!`, `assert!`, etc.) verifying both successful metadata extraction and error handling for unknown attributes.

> [!check]- Answer
> ```rust
> use syn::{parse_str, Attribute, Data, DeriveInput, Fields, LitStr};
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct FieldSchema {
>     pub name: String,
>     pub field_type: String,
>     pub wire_name: String,
>     pub is_skipped: bool,
> }
> 
> pub fn parse_struct_field_schema(input_code: &str) -> Result<Vec<FieldSchema>, String> {
>     let ast: DeriveInput = parse_str(input_code).map_err(|e| e.to_string())?;
>     
>     let fields = match ast.data {
>         Data::Struct(data_struct) => match data_struct.fields {
>             Fields::Named(fields_named) => fields_named.named,
>             _ => return Err("Only structs with named fields are supported".into()),
>         },
>         _ => return Err("Input code must define a struct".into()),
>     };
> 
>     let mut schemas = Vec::new();
> 
>     for field in fields {
>         let field_name = field.ident.as_ref().unwrap().to_string();
>         let mut wire_name = field_name.clone();
>         let mut is_skipped = false;
> 
>         // Parse helper attributes under the `codec` namespace: #[codec(rename = "...", skip)]
>         for attr in &field.attrs {
>             if attr.path().is_ident("codec") {
>                 attr.parse_nested_meta(|meta| {
>                     if meta.path.is_ident("skip") {
>                         is_skipped = true;
>                         Ok(())
>                     } else if meta.path.is_ident("rename") {
>                         let value = meta.value()?;
>                         let lit: LitStr = value.parse()?;
>                         wire_name = lit.value();
>                         Ok(())
>                     } else {
>                         Err(meta.error("unsupported codec attribute option"))
>                     }
>                 })
>                 .map_err(|e| e.to_string())?;
>             }
>         }
> 
>         let ty = &field.ty;
>         let type_str = quote::quote!(#ty).to_string();
> 
>         schemas.push(FieldSchema {
>             name: field_name,
>             field_type: type_str,
>             wire_name,
>             is_skipped,
>         });
>     }
> 
>     Ok(schemas)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_field_schema_extraction() {
>         let code = r#"
>             struct PacketHeader {
>                 #[codec(rename = "msg_id")]
>                 id: u32,
> 
>                 #[codec(skip)]
>                 internal_flags: u8,
> 
>                 payload: Vec<u8>,
>             }
>         "#;
> 
>         let schemas = parse_struct_field_schema(code).expect("Parsing failed");
> 
>         assert_eq!(schemas.len(), 3);
>         assert_eq!(schemas[0].name, "id");
>         assert_eq!(schemas[0].wire_name, "msg_id");
>         assert_eq!(schemas[0].is_skipped, false);
> 
>         assert_eq!(schemas[1].name, "internal_flags");
>         assert_eq!(schemas[1].wire_name, "internal_flags");
>         assert_eq!(schemas[1].is_skipped, true);
> 
>         assert_eq!(schemas[2].name, "payload");
>         assert_eq!(schemas[2].wire_name, "payload");
>         assert_eq!(schemas[2].is_skipped, false);
>     }
> 
>     #[test]
>     fn test_invalid_attribute_fails() {
>         let code = r#"
>             struct BadPacket {
>                 #[codec(unknown_key = 123)]
>                 id: u32,
>             }
>         "#;
> 
>         let result = parse_struct_field_schema(code);
>         assert!(result.is_err());
>         assert!(result.unwrap_err().contains("unsupported codec attribute option"));
>     }
> }
> ```
>
> **Explanation:**
> 1. **`syn::DeriveInput` AST Traversal**: `syn::parse_str::<DeriveInput>(input_code)` parses Rust syntax strings into structured ASTs. We inspect `ast.data` matching `Data::Struct` and `Fields::Named` to access all named struct fields.
> 2. **Attribute Inspection with `parse_nested_meta`**: In `syn` 2.0, `attr.parse_nested_meta` simplifies parsing comma-separated key-value pairs (`rename = "..."`) or flag identifiers (`skip`) inside attribute parentheses `#[codec(...)]`.
> 3. **Error Propagation**: `meta.error(...)` returns a `syn::Error` configured with exact token span information, preventing macro panics and converting errors to clear string messages.
> 
---

### Exercise 2: Implementing a Custom DSL Parser for Hardware MMIO Registers

**Problem:** Embedded Rust frameworks often define custom DSLs for memory-mapped I/O (MMIO) hardware registers. Suppose you are designing a register declaration macro syntax:
`reg CONTROL_REG @ 0x4000_1000 { RW enable: bool, WO trigger: u8 }`

Implement `syn::parse::Parse` for custom AST types `AccessMode`, `RegisterField`, and `RegisterDefinition`.
- `AccessMode` parses identifiers `"RO"`, `"RW"`, or `"WO"`. Any other string should return a `syn::Error`.
- `RegisterField` parses `mode name : type`.
- `RegisterDefinition` parses `reg <IDENT> @ <HEX_OR_DEC_ADDRESS> { <PUNCTUATED_FIELDS> }`.

Provide complete tests using `syn::parse_str::<RegisterDefinition>(...)` with `assert_eq!` assertions validating register name, address hex parsing, access modes, and field types.

> [!check]- Answer
> ```rust
> use syn::parse::{Parse, ParseStream};
> use syn::punctuated::Punctuated;
> use syn::{braced, parse_str, Ident, LitInt, Result, Token, Type};
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum AccessMode {
>     ReadOnly,  // RO
>     ReadWrite, // RW
>     WriteOnly, // WO
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct RegisterField {
>     pub mode: AccessMode,
>     pub name: Ident,
>     pub field_type: Type,
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct RegisterDefinition {
>     pub name: Ident,
>     pub address: u64,
>     pub fields: Vec<RegisterField>,
> }
> 
> impl Parse for AccessMode {
>     fn parse(input: ParseStream) -> Result<Self> {
>         let ident: Ident = input.parse()?;
>         match ident.to_string().as_str() {
>             "RO" => Ok(AccessMode::ReadOnly),
>             "RW" => Ok(AccessMode::ReadWrite),
>             "WO" => Ok(AccessMode::WriteOnly),
>             _ => Err(syn::Error::new(ident.span(), "Expected access mode RO, RW, or WO")),
>         }
>     }
> }
> 
> impl Parse for RegisterField {
>     fn parse(input: ParseStream) -> Result<Self> {
>         let mode: AccessMode = input.parse()?;
>         let name: Ident = input.parse()?;
>         let _: Token![:] = input.parse()?;
>         let field_type: Type = input.parse()?;
>         Ok(RegisterField {
>             mode,
>             name,
>             field_type,
>         })
>     }
> }
> 
> impl Parse for RegisterDefinition {
>     fn parse(input: ParseStream) -> Result<Self> {
>         let kw: Ident = input.parse()?;
>         if kw != "reg" {
>             return Err(syn::Error::new(kw.span(), "Expected keyword 'reg'"));
>         }
> 
>         let name: Ident = input.parse()?;
>         let _: Token![@] = input.parse()?;
>         let addr_lit: LitInt = input.parse()?;
>         let address = addr_lit.base10_parse::<u64>()?;
> 
>         let content;
>         braced!(content in input);
> 
>         let fields_punctuated: Punctuated<RegisterField, Token![,]> =
>             content.parse_terminated(RegisterField::parse, Token![,])?;
> 
>         Ok(RegisterDefinition {
>             name,
>             address,
>             fields: fields_punctuated.into_iter().collect(),
>         })
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_parse_register_definition() {
>         let input = "reg TIMER_CTRL @ 0x40001000 { RW enable: bool, WO trigger: u8 }";
>         let reg: RegisterDefinition = parse_str(input).expect("Failed to parse DSL");
> 
>         assert_eq!(reg.name, "TIMER_CTRL");
>         assert_eq!(reg.address, 0x4000_1000);
>         assert_eq!(reg.fields.len(), 2);
> 
>         assert_eq!(reg.fields[0].mode, AccessMode::ReadWrite);
>         assert_eq!(reg.fields[0].name, "enable");
>         let ty0 = &reg.fields[0].field_type;
>         assert_eq!(quote::quote!(#ty0).to_string(), "bool");
> 
>         assert_eq!(reg.fields[1].mode, AccessMode::WriteOnly);
>         assert_eq!(reg.fields[1].name, "trigger");
>         let ty1 = &reg.fields[1].field_type;
>         assert_eq!(quote::quote!(#ty1).to_string(), "u8");
>     }
> 
>     #[test]
>     fn test_invalid_access_mode_fails() {
>         let input = "reg BAD_REG @ 0x1000 { XX mode: u32 }";
>         let res: Result<RegisterDefinition> = parse_str(input);
>         assert!(res.is_err());
>         let err_msg = res.unwrap_err().to_string();
>         assert!(err_msg.contains("Expected access mode RO, RW, or WO"));
>     }
> }
> ```
>
> **Explanation:**
> 1. **`syn::parse::ParseStream` & Custom Grammars**: Implementing `syn::parse::Parse` for custom types enables parsing domain-specific tokens using recursive predictive descent parsing (`input.parse()?`).
> 2. **Token Delimiters & Macro Helper Macros**: `syn::Token![@]` matches literal `@` punctuation, while `braced!(content in input)` extracts content delimited by `{}` braces into a child `ParseStream`.
> 3. **`Punctuated` Collections**: `content.parse_terminated` handles lists of items separated by delimiters (e.g. commas `,`), abstracting trailing comma handling.
> 
---

### Exercise 3: Static Function Signature Safety Guard Validator for RTOS Interrupt Handlers

**Problem:** In safe Rust real-time kernel frameworks, functions designated as Interrupt Service Routines (ISRs) via macro attributes (e.g. `#[interrupt]`) must adhere to strict compile-time signature constraints before code generation proceeds:
1. Cannot be `async` (`sig.asyncness`).
2. Cannot be `const` (`sig.constness`).
3. Must return default unit type `()` (`sig.output`).
4. Must take at most 1 parameter (`sig.inputs`).
5. Must be annotated with `#[no_mangle]` attribute to preserve vector table C linkage symbols.

Write a signature validator `validate_isr_signature(func: &syn::ItemFn) -> Result<(), syn::Error>` that checks all 5 rules and returns a `syn::Error` attached to the specific illegal AST token span if a constraint is violated.

Provide comprehensive unit tests parsing function definitions with `syn::parse_str::<syn::ItemFn>(...)` and asserting success for compliant handlers and failure for non-compliant handlers.

> [!check]- Answer
> ```rust
> use syn::{parse_str, ItemFn, ReturnType, Type};
> 
> pub fn validate_isr_signature(func: &ItemFn) -> Result<(), syn::Error> {
>     // 1. Reject `async fn`
>     if let Some(async_kw) = func.sig.asyncness {
>         return Err(syn::Error::new_spanned(
>             async_kw,
>             "Interrupt handlers cannot be `async` functions",
>         ));
>     }
> 
>     // 2. Reject `const fn`
>     if let Some(const_kw) = func.sig.constness {
>         return Err(syn::Error::new_spanned(
>             const_kw,
>             "Interrupt handlers cannot be `const` functions",
>         ));
>     }
> 
>     // 3. Return type must be default `()`
>     match &func.sig.output {
>         ReturnType::Default => {}
>         ReturnType::Type(_, ty) => {
>             if let Type::Tuple(tup) = ty.as_ref() {
>                 if !tup.elems.is_empty() {
>                     return Err(syn::Error::new_spanned(
>                         &func.sig.output,
>                         "Interrupt handlers must return `()` (unit type)",
>                     ));
>                 }
>             } else {
>                 return Err(syn::Error::new_spanned(
>                     &func.sig.output,
>                     "Interrupt handlers must return `()` (unit type)",
>                 ));
>             }
>         }
>     }
> 
>     // 4. Input parameter count check (max 1)
>     if func.sig.inputs.len() > 1 {
>         return Err(syn::Error::new_spanned(
>             &func.sig.inputs,
>             "Interrupt handlers accept at most 1 parameter (`&mut InterruptContext`)",
>         ));
>     }
> 
>     // 5. Must have `#[no_mangle]` attribute
>     let has_no_mangle = func
>         .attrs
>         .iter()
>         .any(|attr| attr.path().is_ident("no_mangle"));
> 
>     if !has_no_mangle {
>         return Err(syn::Error::new_spanned(
>             &func.sig.ident,
>             "Interrupt handlers must be annotated with `#[no_mangle]`",
>         ));
>     }
> 
>     Ok(())
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_valid_isr_signature() {
>         let code = r#"
>             #[no_mangle]
>             pub fn handle_timer_interrupt(ctx: &mut InterruptContext) {
>                 // Interrupt logic
>             }
>         "#;
>         let func: ItemFn = parse_str(code).unwrap();
>         assert!(validate_isr_signature(&func).is_ok());
>     }
> 
>     #[test]
>     fn test_reject_async_isr() {
>         let code = r#"
>             #[no_mangle]
>             pub async fn handle_timer_interrupt() {}
>         "#;
>         let func: ItemFn = parse_str(code).unwrap();
>         let res = validate_isr_signature(&func);
>         assert!(res.is_err());
>         assert_eq!(
>             res.unwrap_err().to_string(),
>             "Interrupt handlers cannot be `async` functions"
>         );
>     }
> 
>     #[test]
>     fn test_reject_non_unit_return() {
>         let code = r#"
>             #[no_mangle]
>             pub fn handle_timer_interrupt() -> u32 { 0 }
>         "#;
>         let func: ItemFn = parse_str(code).unwrap();
>         let res = validate_isr_signature(&func);
>         assert!(res.is_err());
>         assert_eq!(
>             res.unwrap_err().to_string(),
>             "Interrupt handlers must return `()` (unit type)"
>         );
>     }
> 
>     #[test]
>     fn test_missing_no_mangle() {
>         let code = r#"
>             pub fn handle_timer_interrupt() {}
>         "#;
>         let func: ItemFn = parse_str(code).unwrap();
>         let res = validate_isr_signature(&func);
>         assert!(res.is_err());
>         assert_eq!(
>             res.unwrap_err().to_string(),
>             "Interrupt handlers must be annotated with `#[no_mangle]`"
>         );
>     }
> }
> ```
>
> **Explanation:**
> 1. **`syn::ItemFn` Decomposition**: Function ASTs decompose into attributes (`func.attrs`), visibility, and signature (`func.sig`). The signature contains qualifiers like `asyncness`, `constness`, inputs vector, and return type (`output`).
> 2. **Spanned Error Reporting (`syn::Error::new_spanned`)**: Binding errors to specific AST elements (e.g. `async_kw` or `func.sig.output`) allows the Rust compiler to underline the exact syntax error location in the IDE rather than pointing vaguely to the macro invocation line.
> 3. **Attribute Verification**: Inspecting `func.attrs` allows procedural macros to enforce essential attributes like `#[no_mangle]` or `#[export_name = "..."]` before code generation.
> 
---

## 7. Related Terms


- [`quote` Crate](quote_crate.md) — The complementary crate used to convert parsed AST structs back into `TokenStream` code.
- [Token Stream](token_stream.md) — The input data format (`proc_macro::TokenStream`) parsed by `syn`.
- [Procedural Macros](procedural_macros.md) — The metaprogramming system that uses `syn` for syntax parsing.
- [Derive Macros](derive_macros.md) — Primary use case for `syn::DeriveInput` parsing.

---

## 8. Key Takeaways

- `syn` parses raw Rust token streams into strongly-typed Abstract Syntax Tree (AST) structs.
- Key AST types include `DeriveInput` (for derives), `ItemFn` (for functions), `ItemStruct` (for structs), and `Expr` (for expressions).
- Use `parse_macro_input!(input as DeriveInput)` inside proc macros for automatic error formatting.
- Keep `Cargo.toml` dependencies minimal by specifying only required feature flags (e.g. `features = ["derive"]`).
- Prefer returning `syn::Error::into_compile_error()` over calling `panic!`.
