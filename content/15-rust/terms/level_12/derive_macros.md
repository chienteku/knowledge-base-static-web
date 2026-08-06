# Derive Macros

> **Level 12 — Macros**
> Procedural macros defined with `#[proc_macro_derive]` that allow automatic implementation of traits for structs, enums, and unions via the `#[derive(...)]` attribute.

---

## 1. Prerequisites


- [Procedural Macros](procedural_macros.md) — Understanding compile-time host execution and procedural macro crate requirements.
- [Trait](../level_04/trait.md) — Understanding trait definitions and explicit `impl Trait for Type` blocks.
- [`syn` Crate](syn_crate.md) — Parsing struct and enum definitions into `syn::DeriveInput` AST nodes.
- [`quote` Crate](quote_crate.md) — Quasi-quoting trait implementation code using `quote!`.

---

## 2. Term Category



**Rust Procedural Macro (custom #[derive] trait code generator)**: Derive Macros are the most widely used category of procedural macros in Rust. Applied via the built-in `#[derive(TraitName)]` attribute, derive macros inspect the syntax definition of a `struct`, `enum`, or `union`, and append *additional* Rust code (typically `impl Trait for MyStruct` blocks) without modifying or destroying the target item itself.



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In object-oriented languages like TypeScript or Java, boilerplate behaviors (such as object printing, equality checking, serialization, or cloning) are either inherited through base class hierarchies, resolved via runtime reflection, or generated using dynamic runtime decorators. However, inheritance introduces tight coupling, runtime reflection incurs memory/performance overhead, and runtime decorators cannot provide compile-time guarantees.

Rust wanted a trait-based polymorphism system that was:
1. **Zero-Cost at Runtime**: Trait implementations are generated directly as statically dispatched Rust code before compilation.
2. **Boilerplate-Free**: Developers should not have to manually write repetitive `impl Debug for User`, `impl PartialEq for User`, or `impl Serialize for User` for every data model struct in a codebase.
3. **Append-Only & Non-Destructive**: Derive macros guarantee that the original struct/enum definition is left intact and unmodified, appending companion code cleanly alongside it.

Derive macros solve this by providing a dedicated compiler hook: `#[proc_macro_derive(MyTrait)]`. When `#[derive(MyTrait)]` is placed on a struct or enum, `rustc` passes the target item's `TokenStream` into the derive macro function, which emits the generated `impl MyTrait for Target` code.

### (2) Reality Metaphor

Imagine an **Automated Certification Stamping Office**:

- Writing manual `impl` blocks is like hand-writing a 10-page compliance manual for every new product model your factory builds (**repetitive manual trait implementations**).
- An **Attribute Macro** is like an overhaul team that takes your original blueprint, redraws all the internal wiring, and gives you back a modified blueprint (**modifies/replaces the original item**).
- A **Derive Macro** is like an automated scanner and stamping machine: it scans your untouched original product blueprint (**reads `syn::DeriveInput`**), leaves the original blueprint exactly as it was, and instantly prints a companion instruction booklet containing all standard operations (**appends `impl Trait for Struct`**) tailored specifically to your product's field parts.

### (3) Code Examples

#### Short Snippet (Defining a Custom Derive Macro)

*Note: Defined in a `proc-macro = true` crate.*

```rust
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput};

/// Custom derive macro `#[derive(HelloName)]`
/// Automatically implements a `hello_name()` method for structs/enums.
#[proc_macro_derive(HelloName)]
pub fn derive_hello_name(input: TokenStream) -> TokenStream {
    // Parse input AST
    let input = parse_macro_input!(input as DeriveInput);
    let name = input.ident;

    // Generate companion `impl` block
    let expanded = quote! {
        impl #name {
            pub fn hello_name() -> &'static str {
                stringify!(#name)
            }
        }
    };

    TokenStream::from(expanded)
}
```

#### Fuller Example (Consuming Built-in and Custom Derives)

```rust
// User application code consuming derive macros:
use serde::{Serialize, Deserialize};

/// Applying multiple derive macros to auto-generate:
/// 1. `Debug`: formatting string print capability
/// 2. `Clone`: duplicate struct instance capability
/// 3. `Serialize`/`Deserialize`: Serde JSON transformation traits
#[derive(Debug, Clone, Serialize, Deserialize)]
struct DeviceConfig {
    device_id: String,
    port: u16,
    is_enabled: bool,
}

fn main() {
    let config = DeviceConfig {
        device_id: String::from("sensor-01"),
        port: 8080,
        is_enabled: true,
    };

    // Utilizing generated `Clone` trait
    let cloned_config = config.clone();

    // Utilizing generated `Debug` trait
    println!("Device: {:?}", cloned_config);

    // Utilizing generated `Serialize` trait
    let json = serde_json::to_string(&config).unwrap();
    println!("JSON output: {}", json);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Attempting to Derive Traits on Unsupported Types (e.g. Fn pointers or Trait Objects)

**The mistake:** Placing `#[derive(...)]` on function pointers, primitive aliases, or trait objects instead of concrete `struct`, `enum`, or `union` declarations.

**Why it's wrong:** In Rust, `#[derive(...)]` attributes can only be attached to type definitions (`struct`, `enum`, `union`).

*Incorrect:*
```rust
// ❌ Compiler Error: attributes are not allowed on type aliases
#[derive(Debug)] 
type UserHandler = fn(u32) -> String;
```

*Fix:*
```rust
// Correct: Wrap the payload inside a newtype struct
#[derive(Debug)]
struct UserHandler(pub fn(u32) -> String);
```

### Mistake 2: Missing Trait Bounds on Generic Parameters in Generated `impl`

**The mistake:** Writing a custom derive macro that generates `impl<T> MyTrait for MyStruct<T>` without adding `where T: MyTrait` bounds for generic struct fields.

**Why it's wrong:** If `MyStruct<T>` contains a field of type `T`, implementing `MyTrait` for `MyStruct<T>` usually requires `T` itself to implement `MyTrait`. Omitting generic bounds causes compilation failures when callers use types for `T` that do not implement the trait.

*Incorrect:*
```rust
// Proc macro generating un-bounded generic impl:
quote! {
    // ❌ Fails if T does not implement TraitName!
    impl<T> TraitName for #struct_name<T> { ... }
}
```

*Fix:*
```rust
// Correct: Use `syn::Generics` helper to automatically add trait bounds to generic parameters
let (impl_generics, ty_generics, where_clause) = ast.generics.split_for_impl();
quote! {
    impl #impl_generics TraitName for #struct_name #ty_generics #where_clause { ... }
}
```

### Mistake 3: Confusing Helper Attributes with Outer Attribute Macros

**The mistake:** Assuming custom attributes used inside derive structs (such as `#[serde(rename = "...")]`) are standalone attribute macros.

**Why it's wrong:** Derive macros can register custom *helper attributes* (e.g. `#[proc_macro_derive(MyTrait, attributes(my_helper))]`). These helper attributes are ignored by `rustc` and are intended solely for the derive macro to inspect when parsing field AST nodes. Calling a helper attribute without declaring it in `attributes(...)` causes a compiler error.

*Incorrect:*
```rust
// Proc macro declaration missing helper attribute registration:
#[proc_macro_derive(MyTrait)] // ❌ Did not register `my_helper`
pub fn derive_trait(input: TokenStream) -> TokenStream { ... }

// User struct:
#[derive(MyTrait)]
struct User {
    #[my_helper] // ❌ Compiler error: cannot find attribute `my_helper` in this scope
    id: u64,
}
```

*Fix:*
```rust
// Correct: Declare helper attributes in `proc_macro_derive`
#[proc_macro_derive(MyTrait, attributes(my_helper))]
pub fn derive_trait(input: TokenStream) -> TokenStream { ... }
```

---

## 5. Practice Exercises

### Exercise 1: Custom Embedded Telemetry Derive Macro with Helper Attributes

**Scenario:** In embedded IoT devices and industrial telemetry systems (`#![no_std]`), sensor metrics (e.g. voltage, temperature, error counts) are collected in domain structs. Manually writing diagnostic serialization logic for dozens of telemetry structs is tedious and error-prone.
Implement the core procedural macro transformation logic for a custom derive macro `#[derive(EmbeddedTelemetry)]` with a field-level helper attribute `#[telemetry(skip)]`.

The generated `EmbeddedTelemetry` trait implementation must:
1. Provide a method `fn active_fields() -> &'static [&'static str]` returning an array of non-skipped field names.
2. Provide a method `fn format_telemetry(&self, buffer: &mut [u8]) -> usize` that formats serialized non-skipped fields into a key-value byte buffer without dynamic allocation.
3. Inspect field-level attributes and skip any field decorated with `#[telemetry(skip)]`.
4. Validate that the derive macro is only applied to structs with named fields, returning a `syn::Error` with proper token spans if applied to an enum or union.

Write a complete, compilable-style Rust module containing the trait definition, AST generator function (`generate_embedded_telemetry_derive`), a concrete telemetry struct, and a unit test suite with assertions (`assert_eq!`, `assert!`) verifying macro token expansion, field skipping, and buffer output formatting.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use proc_macro2::TokenStream;
> use quote::quote;
> use syn::{parse_str, Data, DeriveInput, Fields};
> 
> /// Trait auto-implemented by `#[derive(EmbeddedTelemetry)]`
> pub trait EmbeddedTelemetry {
>     /// Returns static slice of serialized field names (excluding skipped fields).
>     fn active_fields() -> &'static [&'static str];
> 
>     /// Formats key-value telemetry pairs into buffer, returning written byte count.
>     fn format_telemetry(&self, buffer: &mut [u8]) -> usize;
> }
> 
> /// Core procedural macro generator for `#[derive(EmbeddedTelemetry, attributes(telemetry))]`
> pub fn generate_embedded_telemetry_derive(input_ast: &DeriveInput) -> Result<TokenStream, syn::Error> {
>     let struct_name = &input_ast.ident;
>     let (impl_generics, ty_generics, where_clause) = input_ast.generics.split_for_impl();
> 
>     // 1. Enforce that derive macro targets a struct with named fields
>     let fields = match &input_ast.data {
>         Data::Struct(data_struct) => match &data_struct.fields {
>             Fields::Named(fields_named) => &fields_named.named,
>             _ => {
>                 return Err(syn::Error::new_spanned(
>                     input_ast,
>                     "#[derive(EmbeddedTelemetry)] requires a struct with named fields",
>                 ))
>             }
>         },
>         _ => {
>             return Err(syn::Error::new_spanned(
>                 input_ast,
>                 "#[derive(EmbeddedTelemetry)] can only be applied to structs",
>             ))
>         }
>     };
> 
>     let mut field_names_str = Vec::new();
>     let mut field_writers = Vec::new();
> 
>     // 2. Iterate through fields and inspect helper attributes #[telemetry(skip)]
>     for field in fields {
>         let field_ident = field.ident.as_ref().unwrap();
>         let field_name = field_ident.to_string();
> 
>         let is_skipped = field.attrs.iter().any(|attr| {
>             if attr.path().is_ident("telemetry") {
>                 if let Ok(nested_ident) = attr.parse_args::<syn::Ident>() {
>                     return nested_ident == "skip";
>                 }
>             }
>             false
>         });
> 
>         if is_skipped {
>             continue;
>         }
> 
>         field_names_str.push(field_name.clone());
> 
>         // Generate token stream to format field value into buffer slice
>         field_writers.push(quote! {
>             {
>                 let val_str = self.#field_ident.to_string();
>                 let entry = format!("{}:{},", #field_name, val_str);
>                 let bytes = entry.as_bytes();
>                 let copy_len = bytes.len().min(buffer.len().saturating_sub(offset));
>                 buffer[offset..offset + copy_len].copy_from_slice(&bytes[..copy_len]);
>                 offset += copy_len;
>             }
>         });
>     }
> 
>     // 3. Generate companion impl block
>     let expanded = quote! {
>         impl #impl_generics EmbeddedTelemetry for #struct_name #ty_generics #where_clause {
>             fn active_fields() -> &'static [&'static str] {
>                 &[ #(#field_names_str),* ]
>             }
> 
>             fn format_telemetry(&self, buffer: &mut [u8]) -> usize {
>                 let mut offset = 0;
>                 #(#field_writers)*
>                 offset
>             }
>         }
>     };
> 
>     Ok(expanded)
> }
> 
> /// Concrete example of manual trait implementation corresponding to derived output
> pub struct SystemTelemetry {
>     pub voltage_mv: u16,
>     pub temperature_c: i8,
>     pub secret_key: u32,
> }
> 
> impl EmbeddedTelemetry for SystemTelemetry {
>     fn active_fields() -> &'static [&'static str] {
>         &["voltage_mv", "temperature_c"]
>     }
> 
>     fn format_telemetry(&self, buffer: &mut [u8]) -> usize {
>         let formatted = format!("voltage_mv:{},temperature_c:{},", self.voltage_mv, self.temperature_c);
>         let bytes = formatted.as_bytes();
>         let len = bytes.len().min(buffer.len());
>         buffer[..len].copy_from_slice(&bytes[..len]);
>         len
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_embedded_telemetry_derive_ast_expansion() {
>         let source = r#"
>             #[derive(EmbeddedTelemetry)]
>             #[proc_macro_derive(EmbeddedTelemetry, attributes(telemetry))]
>             struct DeviceMetrics {
>                 battery_level: u8,
>                 cpu_temp: i8,
>                 #[telemetry(skip)]
>                 debug_ptr: usize,
>             }
>         "#;
> 
>         let ast: DeriveInput = parse_str(source).expect("Failed to parse struct AST");
>         let tokens = generate_embedded_telemetry_derive(&ast).expect("Derive generation failed");
>         let code = tokens.to_string();
> 
>         // Assert generated trait implementation header
>         assert!(code.contains("impl EmbeddedTelemetry for DeviceMetrics"));
> 
>         // Assert active fields are present and skipped field is excluded
>         assert!(code.contains("\"battery_level\""));
>         assert!(code.contains("\"cpu_temp\""));
>         assert!(!code.contains("\"debug_ptr\""));
>     }
> 
>     #[test]
>     fn test_embedded_telemetry_runtime_formatting() {
>         let metrics = SystemTelemetry {
>             voltage_mv: 3300,
>             temperature_c: 42,
>             secret_key: 0xDEADBEEF,
>         };
> 
>         assert_eq!(SystemTelemetry::active_fields(), &["voltage_mv", "temperature_c"]);
> 
>         let mut buf = [0u8; 64];
>         let written = metrics.format_telemetry(&mut buf);
>         let output_str = std::str::from_utf8(&buf[..written]).unwrap();
> 
>         assert_eq!(output_str, "voltage_mv:3300,temperature_c:42,");
>         assert!(!output_str.contains("secret_key"));
>     }
> 
>     #[test]
>     fn test_derive_rejects_enum_and_tuple_struct() {
>         let enum_src = "enum State { Ready, Busy }";
>         let enum_ast: DeriveInput = parse_str(enum_src).unwrap();
>         let err = generate_embedded_telemetry_derive(&enum_ast).unwrap_err();
>         assert_eq!(err.to_string(), "#[derive(EmbeddedTelemetry)] can only be applied to structs");
> 
>         let tuple_src = "struct Point(i32, i32);";
>         let tuple_ast: DeriveInput = parse_str(tuple_src).unwrap();
>         let tuple_err = generate_embedded_telemetry_derive(&tuple_ast).unwrap_err();
>         assert_eq!(tuple_err.to_string(), "#[derive(EmbeddedTelemetry)] requires a struct with named fields");
>     }
> }
> ```
> 
> #### Technical Explanation
>
> 1. **AST Struct Verification**: The derive logic matches on `syn::Data::Struct` and `syn::Fields::Named` to confirm target compatibility before code generation.
> 2. **Helper Attribute Inspection (`attributes(telemetry)`)**: Iterating over `field.attrs` checks for `#[telemetry(skip)]` attributes, allowing field-level filtering at compile time.
> 3. **Quasi-Quoting Repetition (`quote!`)**: The `#(#field_writers)*` macro repetition syntax appends field formatting logic into a single companion `impl EmbeddedTelemetry for Struct` block.
> 4. **Append-Only Safety Guarantee**: Derive macros leave the target struct syntax completely untouched and append external static dispatch trait methods alongside it.
> 
---

### Exercise 2: Auto-Deriving Hardware Register Bit Pattern Conversion Traits

**Scenario:** Bare-metal microcontroller peripheral drivers (`#![no_std]`) handle hardware status registers returning byte codes (e.g. `0x00` = OK, `0x01` = Timeout, `0x02` = Overcurrent, `0x03` = BusError). Writing manual `TryFrom<u8>` and `From<Enum>` bitwise parsing for dozens of register enums causes boilerplate duplication.
Implement the procedural derive macro builder `generate_enum_register_converter` for `#[derive(EnumRegisterConverter)]`.

The derive macro must:
1. Inspect an `enum` AST using `syn` and extract variant identifiers and integer discriminant values (supporting explicit values like `= 0x01` or implicit auto-incrementing values).
2. Generate `impl core::convert::TryFrom<u8> for EnumName` returning `Result<EnumName, RegisterConversionError>` for recognized bit patterns.
3. Generate `impl core::convert::From<EnumName> for u8` returning the raw `u8` byte representation of each variant.
4. Enforce that the derive macro is strictly applied to `enum` declarations, returning a `syn::Error` if attached to a `struct` or `union`.

Write a complete, compilable-style Rust module containing the derive AST builder, custom conversion error type, concrete runtime enum test fixture, and unit tests with assertions (`assert_eq!`, `assert!`, `matches!`) validating trait code generation, round-trip conversions, unrecognized byte errors, and struct rejection.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use proc_macro2::TokenStream;
> use quote::quote;
> use syn::{parse_str, Data, DeriveInput, Expr, Lit};
> 
> /// Error returned when attempting to convert an unrecognized u8 byte into an Enum variant.
> #[derive(Debug, PartialEq, Eq)]
> pub struct RegisterConversionError(pub u8);
> 
> /// Core procedural macro generator for `#[derive(EnumRegisterConverter)]`
> pub fn generate_enum_register_converter(input_ast: &DeriveInput) -> Result<TokenStream, syn::Error> {
>     let enum_name = &input_ast.ident;
> 
>     // 1. Enforce target is an Enum
>     let data_enum = match &input_ast.data {
>         Data::Enum(data_enum) => data_enum,
>         _ => {
>             return Err(syn::Error::new_spanned(
>                 input_ast,
>                 "#[derive(EnumRegisterConverter)] can only be applied to enums",
>             ));
>         }
>     };
> 
>     let mut try_from_arms = Vec::new();
>     let mut into_u8_arms = Vec::new();
>     let mut current_discriminant = 0u8;
> 
>     // 2. Parse variants and extract integer discriminants
>     for variant in &data_enum.variants {
>         let variant_ident = &variant.ident;
> 
>         let disc_val = if let Some((_, Expr::Lit(expr_lit))) = &variant.discriminant {
>             if let Lit::Int(lit_int) = &expr_lit.lit {
>                 lit_int.base10_parse::<u8>()?
>             } else {
>                 return Err(syn::Error::new_spanned(
>                     variant,
>                     "Enum discriminant must be an integer literal",
>                 ));
>             }
>         } else {
>             current_discriminant
>         };
> 
>         current_discriminant = disc_val + 1;
> 
>         try_from_arms.push(quote! {
>             #disc_val => Ok(#enum_name::#variant_ident),
>         });
> 
>         into_u8_arms.push(quote! {
>             #enum_name::#variant_ident => #disc_val,
>         });
>     }
> 
>     // 3. Generate TryFrom<u8> and From<Enum> for u8 trait implementations
>     let expanded = quote! {
>         impl core::convert::TryFrom<u8> for #enum_name {
>             type Error = RegisterConversionError;
> 
>             fn try_from(raw: u8) -> core::result::Result<Self, Self::Error> {
>                 match raw {
>                     #(#try_from_arms)*
>                     unhandled => Err(RegisterConversionError(unhandled)),
>                 }
>             }
>         }
> 
>         impl core::convert::From<#enum_name> for u8 {
>             fn from(variant: #enum_name) -> Self {
>                 match variant {
>                     #(#into_u8_arms)*
>                 }
>             }
>         }
>     };
> 
>     Ok(expanded)
> }
> 
> /// Concrete runtime hardware status enum for verification
> #[derive(Debug, PartialEq, Eq, Clone, Copy)]
> #[repr(u8)]
> pub enum HardwareStatus {
>     Success = 0x00,
>     Timeout = 0x01,
>     Overcurrent = 0x02,
>     BusError = 0x03,
> }
> 
> impl TryFrom<u8> for HardwareStatus {
>     type Error = RegisterConversionError;
> 
>     fn try_from(raw: u8) -> Result<Self, Self::Error> {
>         match raw {
>             0x00 => Ok(HardwareStatus::Success),
>             0x01 => Ok(HardwareStatus::Timeout),
>             0x02 => Ok(HardwareStatus::Overcurrent),
>             0x03 => Ok(HardwareStatus::BusError),
>             unhandled => Err(RegisterConversionError(unhandled)),
>         }
>     }
> }
> 
> impl From<HardwareStatus> for u8 {
>     fn from(status: HardwareStatus) -> Self {
>         match status {
>             HardwareStatus::Success => 0x00,
>             HardwareStatus::Timeout => 0x01,
>             HardwareStatus::Overcurrent => 0x02,
>             HardwareStatus::BusError => 0x03,
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_enum_register_converter_macro_expansion() {
>         let source = r#"
>             #[repr(u8)]
>             enum SpiState {
>                 Idle = 0x00,
>                 Transmitting = 0x10,
>                 Receiving = 0x20,
>             }
>         "#;
> 
>         let ast: DeriveInput = parse_str(source).expect("Failed to parse enum AST");
>         let tokens = generate_enum_register_converter(&ast).expect("Derive generation failed");
>         let code = tokens.to_string();
> 
>         assert!(code.contains("impl core :: convert :: TryFrom < u8 > for SpiState"));
>         assert!(code.contains("impl core :: convert :: From < SpiState > for u8"));
>         assert!(code.contains("0u8 => Ok (SpiState :: Idle)"));
>         assert!(code.contains("16u8 => Ok (SpiState :: Transmitting)"));
>         assert!(code.contains("32u8 => Ok (SpiState :: Receiving)"));
>     }
> 
>     #[test]
>     fn test_enum_hardware_conversion_roundtrip() {
>         // Test u8 to Enum conversion
>         assert_eq!(HardwareStatus::try_from(0x00), Ok(HardwareStatus::Success));
>         assert_eq!(HardwareStatus::try_from(0x01), Ok(HardwareStatus::Timeout));
>         assert_eq!(HardwareStatus::try_from(0x02), Ok(HardwareStatus::Overcurrent));
>         assert_eq!(HardwareStatus::try_from(0x03), Ok(HardwareStatus::BusError));
> 
>         // Test invalid byte conversion
>         assert_eq!(HardwareStatus::try_from(0xFF), Err(RegisterConversionError(0xFF)));
> 
>         // Test Enum to u8 conversion
>         let raw_byte: u8 = HardwareStatus::Overcurrent.into();
>         assert_eq!(raw_byte, 0x02);
>     }
> 
>     #[test]
>     fn test_derive_rejects_struct_target() {
>         let struct_src = "struct HardwareConfig { port: u8 }";
>         let ast: DeriveInput = parse_str(struct_src).unwrap();
>         let result = generate_enum_register_converter(&ast);
> 
>         assert!(result.is_err());
>         assert_eq!(
>             result.unwrap_err().to_string(),
>             "#[derive(EnumRegisterConverter)] can only be applied to enums"
>         );
>     }
> }
> ```
> 
> #### Technical Explanation
>
> 1. **Enum AST Parsing via `syn::Data::Enum`**: The macro filters for `Data::Enum`, iterating through `data_enum.variants` to discover variant names and explicit/implicit discriminant integers.
> 2. **Discriminant Extraction**: Checking `variant.discriminant` allows parsing explicit values (such as `= 0x10`) using `Lit::Int::base10_parse::<u8>()` or falling back to auto-incrementing counters.
> 3. **Generating Standard Library Trait Implementations**: Deriving `TryFrom<u8>` and `From<Enum> for u8` provides type-safe, zero-cost conversion between hardware byte registers and Rust domain enums.
> 4. **Spanned Error Reporting**: Returning `syn::Error::new_spanned(input_ast, ...)` directs the Rust compiler to highlight the exact invalid line if attached to non-enum types.
> 
---

## 6. Related Terms


- [Procedural Macros](procedural_macros.md) — The parent compile-time metaprogramming system.
- [Attribute Macros](attribute_macros.md) — Procedural macros that can rewrite or modify target items.
- [`syn` Crate](syn_crate.md) — Library used to parse `syn::DeriveInput` AST nodes.
- [`quote` Crate](quote_crate.md) — Library used to generate companion `impl` token streams.
- [Trait](../level_04/trait.md) — The polymorphism interface system implemented by derive macros.

---


### Exercise 3: Auto-Deriving SQL Table Builder Traits (`#[derive(TableBuilder)]`)

**Scenario:**
In enterprise database ORM frameworks, domain model structs map to relational database tables. Manually writing SQL column lists, insert statements, and positional parameters for dozens of database entities leads to boilerplate duplication and schema mismatches.

Implement a procedural derive macro generator `generate_table_builder_derive` for `#[derive(TableBuilder)]`.

The macro must:
1. Extract the struct name and map it to a table name (lowercase string).
2. Extract field names and generate a static method `fn column_names() -> &'static [&'static str]`.
3. Generate a method `fn sql_insert_query(&self) -> String` that constructs a parameterized SQL statement (e.g. `INSERT INTO table (col1, col2) VALUES ($1, $2)`).
4. Include unit tests in `#[cfg(test)] mod tests` asserting table name mapping, column list generation, and parameterized SQL query formatting.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use proc_macro2::TokenStream;
> use quote::quote;
> use syn::{parse_str, Data, DeriveInput, Fields};
> 
> pub trait TableBuilder {
>     fn table_name() -> &'static str;
>     fn column_names() -> &'static [&'static str];
>     fn sql_insert_query(&self) -> String;
> }
> 
> pub fn generate_table_builder_derive(input_ast: &DeriveInput) -> Result<TokenStream, syn::Error> {
>     let struct_name = &input_ast.ident;
>     let table_name_str = struct_name.to_string().to_lowercase();
> 
>     let fields = match &input_ast.data {
>         Data::Struct(data_struct) => match &data_struct.fields {
>             Fields::Named(fields_named) => &fields_named.named,
>             _ => {
>                 return Err(syn::Error::new_spanned(
>                     input_ast,
>                     "#[derive(TableBuilder)] requires named fields",
>                 ))
>             }
>         },
>         _ => {
>             return Err(syn::Error::new_spanned(
>                 input_ast,
>                 "#[derive(TableBuilder)] can only be applied to structs",
>             ))
>         }
>     };
> 
>     let col_names: Vec<String> = fields
>         .iter()
>         .map(|f| f.ident.as_ref().unwrap().to_string())
>         .collect();
> 
>     let placeholders: Vec<String> = (1..=col_names.len())
>         .map(|idx| format!("${idx}"))
>         .collect();
> 
>     let cols_joined = col_names.join(", ");
>     let placeholders_joined = placeholders.join(", ");
> 
>     let insert_query_fmt = format!(
>         "INSERT INTO {table_name_str} ({cols_joined}) VALUES ({placeholders_joined})"
>     );
> 
>     let expanded = quote! {
>         impl TableBuilder for #struct_name {
>             fn table_name() -> &'static str {
>                 #table_name_str
>             }
> 
>             fn column_names() -> &'static [&'static str] {
>                 &[ #(#col_names),* ]
>             }
> 
>             fn sql_insert_query(&self) -> String {
>                 #insert_query_fmt.to_string()
>             }
>         }
>     };
> 
>     Ok(expanded)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_table_builder_derive() {
>         let source = r#"
>             #[derive(TableBuilder)]
>             struct UserAccount {
>                 user_id: u64,
>                 email: String,
>                 is_active: bool,
>             }
>         "#;
> 
>         let ast: DeriveInput = parse_str(source).unwrap();
>         let tokens = generate_table_builder_derive(&ast).unwrap();
>         let code = tokens.to_string();
> 
>         assert!(code.contains("impl TableBuilder for UserAccount"));
>         assert!(code.contains(""useraccount""));
>         assert!(code.contains(""user_id""));
>         assert!(code.contains(""email""));
>         assert!(code.contains(""is_active""));
>         assert!(code.contains("INSERT INTO useraccount (user_id, email, is_active) VALUES ($1, $2, $3)"));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **AST Struct Introspection**: The derive generator extracts `struct_name` and named fields from `syn::DeriveInput` at compile time.
> 2. **Parameterized Query Generation**: Positional placeholder strings (`$1, $2, $3`) are constructed during macro expansion, eliminating runtime query formatting overhead.
> 3. **Static Metadata**: Column names are generated as a static string array (`&'static [&'static str]`), allowing zero-allocation schema inspection.
> 
> 
---

## 7. Key Takeaways

- Derive Macros (`#[proc_macro_derive]`) generate companion code (such as `impl Trait`) via the `#[derive(...)]` attribute.
- They are strictly **append-only** and non-destructive: the original struct, enum, or union definition remains unchanged.
- Use `#[proc_macro_derive(MyTrait, attributes(helper_name))]` to declare field-level helper attributes.
- Use `syn::DeriveInput` to parse the struct/enum AST and `quote!` to emit trait implementation blocks.
