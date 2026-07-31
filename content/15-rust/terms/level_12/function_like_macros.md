# Function-like Macros

> **Level 12 — Macros**
> Procedural macros defined with `#[proc_macro]` that are invoked using function call syntax with an exclamation mark (`custom_macro!(...)`) to generate code dynamically.

---

## 1. Prerequisites

- [Procedural Macros](../level_12/procedural_macros.md) — Understanding procedural macro definitions, compile-time host execution, and dedicated `proc-macro = true` crate setup.
- [Token Stream](../level_12/token_stream.md) — The fundamental compiler input/output type (`proc_macro::TokenStream`) manipulated by function-like procedural macros.
- [Declarative Macros (`macro_rules!`)](../level_12/declarative_macros_macro_rules.md) — Understanding invocation syntax similarities (`my_macro!(...)`) versus procedural AST logic capabilities.

---

## 2. Term Category

**Syntax / Language Feature**: Function-like Macros are a specialized kind of procedural macro in Rust. While they look superficially identical to declarative macros when called (`my_macro!(...)`), they are implemented as procedural Rust functions taking a single `TokenStream` input and returning a transformed `TokenStream` output. This allows them to execute arbitrary Rust code, parse complex Domain-Specific Languages (DSLs), query compile-time environment resources, and execute custom AST logic.

---

## 3. Environment Context

**Universal Rust (Compile-time Execution)**: Function-like macros execute on the host compiler machine during `rustc` compilation. Popular ecosystem examples include SQL compile-time query verification (`sqlx::query!("SELECT * FROM users")`), HTML/JSX compile-time templating (`maud::html!`, `leptos::view!`), and inline assembly (`core::arch::asm!`).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"

In JavaScript and TypeScript ecosystems, embedding DSLs (such as SQL strings, GraphQL queries, or HTML/JSX templates) relies either on template literals parsed at runtime or on complex external build tool extensions (such as Babel plugins or SWC transformers).

While declarative macros (`macro_rules!`) in Rust allow creating custom invocation syntax using pattern matching, they struggle when handling:
1. **Arbitrary Non-Rust Syntax**: Declarative matchers expect valid Rust macro tokens (`expr`, `ty`, `ident`, `stmt`). They cannot parse raw SQL queries, HTML tags with custom syntax, or custom expression languages.
2. **Compile-Time Side Effects & IO**: `macro_rules!` cannot connect to local development databases to verify SQL column names and types at compile time or validate external files.
3. **Complex Control Flow**: `macro_rules!` pattern matching is recursive and macro expansion limited, making full AST analysis difficult.

Function-like procedural macros solve this by providing a clean function interface: `pub fn my_macro(input: TokenStream) -> TokenStream`. The input token stream contains everything inside the invocation delimiters (`()`, `[]`, or `{}`), giving the macro full freedom to parse and transform arbitrary code at compile time.

### (2) Reality Metaphor

Imagine a **Universal Translator Device in a Science Lab**:

- A **Standard Rust Function** is like a calculator: you feed it numbers, press equal, and get a calculated number output at runtime.
- A **Declarative Macro (`macro_rules!`)** is like a fixed stencil: you lay down the stencil and spray paint through the holes to get standard Rust shapes.
- A **Function-like Procedural Macro (`my_macro!(...)`)** is like handing an foreign blueprint written in a complex alien dialect (**custom DSL tokens inside `(...)`**) to a translation computer running a full translation algorithm (**Rust macro function**). The computer decodes the foreign dialect, runs validation checks, and converts it directly into a standard engineering blueprint (**transformed Rust `TokenStream`**) before handing it to the manufacturing floor (**`rustc`**).

### (3) Code Examples

#### Short Snippet (Defining a Function-like Procedural Macro)

*Note: Must be defined in a dedicated crate configured with `proc-macro = true` in `Cargo.toml`.*

```rust
// In proc_macro_crate/src/lib.rs:
use proc_macro::TokenStream;

/// A function-like procedural macro that generates a constant string length function.
#[proc_macro]
pub fn count_tokens(input: TokenStream) -> TokenStream {
    let token_count = input.into_iter().count();
    
    // Generate a Rust expression evaluating to the token count integer literal
    format!("{}", token_count)
        .parse()
        .unwrap()
}
```

#### Fuller Example (Consuming `sqlx::query!` and `html!` Style Macros)

```rust
// In a user application crate consuming function-like proc macros:

/// Conceptual example demonstrating how compile-time checked function-like proc macros work.
/// `sqlx::query!` parses the raw SQL string literal at compile time, verifies table schema,
/// and outputs strongly-typed Rust structs without runtime query parsing overhead.
fn demonstrate_function_like_macros() {
    // 1. Invocation using parentheses `()`
    let _sql_query = sqlx::query!("SELECT id, username FROM users WHERE is_active = $1", true);

    // 2. Function-like macros can also be invoked using brackets `[]` or braces `{}`:
    // e.g. leptos::view! { <p>"Hello " {username}</p> }
}

fn main() {
    println!("Function-like macros execute full Rust logic at compile time!");
    demonstrate_function_like_macros();
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Confusing Declarative and Function-like Proc Macro Declarations

**The mistake:** Attempting to define a function-like procedural macro using `macro_rules!` syntax or attempting to place `#[proc_macro]` inside a standard binary crate.

**Why it's wrong:** Declarative macros use `macro_rules! my_name { ... }` in standard crates. Function-like procedural macros are `fn` items tagged with `#[proc_macro]` inside dedicated `proc-macro = true` crates.

*Incorrect:*
```rust
// In src/main.rs:
#[proc_macro] // ❌ Compiler Error: `proc_macro` attributes can only be used in proc-macro crates
pub fn make_code(input: TokenStream) -> TokenStream {
    input
}
```

*Fix:*
```toml
# proc_macro_crate/Cargo.toml
[lib]
proc-macro = true
```
```rust
// proc_macro_crate/src/lib.rs
use proc_macro::TokenStream;

#[proc_macro] // Correct
pub fn make_code(input: TokenStream) -> TokenStream {
    input
}
```

### Mistake 2: Assuming Delimiters are Included in Input TokenStream

**The mistake:** Expecting the outer `()`, `[]`, or `{}` delimiters to be part of the `TokenStream` passed into the `#[proc_macro]` function.

**Why it's wrong:** The Rust compiler strips the outer delimiters of a function-like proc macro invocation before passing the inner content as the input `TokenStream`.

*Incorrect:*
```rust
// Invoking `my_macro!(1, 2, 3)`
#[proc_macro]
pub fn my_macro(input: TokenStream) -> TokenStream {
    // ❌ Expecting `input` to start with `(` and end with `)` token tree
    let s = input.to_string();
    assert!(s.starts_with('(')); // PANICS! `s` contains "1, 2, 3" without outer parentheses.
    input
}
```

*Fix:*
```rust
#[proc_macro]
pub fn my_macro(input: TokenStream) -> TokenStream {
    // Correct: Process the inner contents ("1, 2, 3") directly
    let s = input.to_string();
    println!("Inner content: {}", s);
    input
}
```

### Mistake 3: Unhandled Compile-Time Panics Causing Cryptic Error Messages

**The mistake:** Using `.unwrap()` or panicking directly inside a function-like procedural macro when parsing invalid user DSL syntax.

**Why it's wrong:** Panicking inside a procedural macro causes `rustc` to emit a generic `proc macro panicked` compiler error, which does not point to the exact line number of the invalid token inside the user's macro invocation.

*Incorrect:*
```rust
#[proc_macro]
pub fn parse_pair(input: TokenStream) -> TokenStream {
    // ❌ Raw unwrap causes opaque compile error if input is malformed
    let parsed: syn::Expr = syn::parse(input).unwrap(); 
    syn::quote::quote!( #parsed ).into()
}
```

*Fix:*
```rust
#[proc_macro]
pub fn parse_pair(input: TokenStream) -> TokenStream {
    // Correct: Convert parsing errors into `syn::Error::into_compile_error()`
    // which highlights the exact user source code location with a clean rustc diagnostic.
    match syn::parse::<syn::Expr>(input) {
        Ok(parsed) => syn::quote::quote!( #parsed ).into(),
        Err(err) => err.to_compile_error().into(),
    }
}
```

---

## 6. Practice Exercises

### Exercise 1: Embedded MMIO Register Bitfield Mask DSL Engine

**Problem:** In embedded microcontroller development (e.g., ARM Cortex-M or RISC-V peripherals), hardware drivers rely on memory-mapped IO register configurations. Function-like procedural macros (such as `register_bitfield!`) parse custom hardware DSL tokens matching the pattern `FIELD_NAME: bit_width` (e.g., `ENABLE: 1, MODE: 3, PRIORITY: 4`) to generate zero-cost bitfield masks, bit shifts, and boundary validations at compile time.

Implement a complete, `#![no_std]`-compatible Rust bitfield specifier parser and register layout builder that simulates the code generation backend of a function-like procedural macro. The system must:
1. Parse raw field specifications (`FIELD_NAME: bit_width`).
2. Calculate sequential offset shifts and bitwise masks (`(1 << width) - 1`) for each field.
3. Validate that total register width does not exceed 32 bits, returning a structured compile-time error representation if exceeded.
4. Provide helper functions to encode field values into raw register `u32` values and extract field values from raw register `u32` values.
5. Include comprehensive unit tests with `assert_eq!` and `assert!` verifying mask generation, bitwise field insertion, field extraction, and bit overflow error handling.

> [!check]- Answer
> ```rust
> #![no_std]
> 
> /// Represents a single field specifier in the hardware register DSL.
> #[derive(Debug, PartialEq, Eq, Clone, Copy)]
> pub struct FieldSpec {
>     pub name: &'static str,
>     pub bit_width: u8,
> }
> 
> /// Computed field metadata generated by the function-like macro engine.
> #[derive(Debug, PartialEq, Eq, Clone, Copy)]
> pub struct ComputedField {
>     pub name: &'static str,
>     pub shift: u8,
>     pub mask: u32,
>     pub max_value: u32,
> }
> 
> /// Represents an error encountered during DSL token parsing or layout calculation.
> #[derive(Debug, PartialEq, Eq)]
> pub enum RegisterDslError {
>     InvalidBitWidth { field: &'static str, width: u8 },
>     RegisterOverflow { total_bits: u8 },
> }
> 
> /// Simulated output struct representing a compiled register layout.
> #[derive(Debug)]
> pub struct RegisterLayout<const N: usize> {
>     pub fields: [ComputedField; N],
> }
> 
> impl<const N: usize> RegisterLayout<N> {
>     /// Compiles raw field specifications into bit masks and shifts.
>     pub const fn compile(specs: &[FieldSpec; N]) -> Result<Self, RegisterDslError> {
>         let mut fields = [ComputedField {
>             name: "",
>             shift: 0,
>             mask: 0,
>             max_value: 0,
>         }; N];
>         
>         let mut current_shift = 0u8;
>         let mut i = 0;
> 
>         while i < N {
>             let spec = &specs[i];
>             if spec.bit_width == 0 || spec.bit_width > 32 {
>                 return Err(RegisterDslError::InvalidBitWidth {
>                     field: spec.name,
>                     width: spec.bit_width,
>                 });
>             }
> 
>             if (current_shift as u16 + spec.bit_width as u16) > 32 {
>                 return Err(RegisterDslError::RegisterOverflow {
>                     total_bits: current_shift + spec.bit_width,
>                 });
>             }
> 
>             // Calculate bitmask: e.g. for width 3, max_value is (1 << 3) - 1 = 0b111 = 7
>             let max_val = if spec.bit_width == 32 {
>                 u32::MAX
>             } else {
>                 (1u32 << spec.bit_width) - 1
>             };
>             let mask = max_val << current_shift;
> 
>             fields[i] = ComputedField {
>                 name: spec.name,
>                 shift: current_shift,
>                 mask,
>                 max_value: max_val,
>             };
> 
>             current_shift += spec.bit_width;
>             i += 1;
>         }
> 
>         Ok(Self { fields })
>     }
> 
>     /// Packs a field value into an existing raw register value.
>     pub fn write_field(&self, field_index: usize, raw_reg: u32, value: u32) -> Result<u32, &'static str> {
>         if field_index >= N {
>             return Err("Field index out of bounds");
>         }
>         let field = &self.fields[field_index];
>         if value > field.max_value {
>             return Err("Value exceeds field maximum capacity");
>         }
> 
>         // Clear existing bits and set new field bits
>         let cleared = raw_reg & !field.mask;
>         let set_bits = (value << field.shift) & field.mask;
>         Ok(cleared | set_bits)
>     }
> 
>     /// Extracts a field value from a raw register value.
>     pub fn read_field(&self, field_index: usize, raw_reg: u32) -> Result<u32, &'static str> {
>         if field_index >= N {
>             return Err("Field index out of bounds");
>         }
>         let field = &self.fields[field_index];
>         Ok((raw_reg & field.mask) >> field.shift)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_valid_register_layout_compilation() {
>         const SPECS: [FieldSpec; 3] = [
>             FieldSpec { name: "ENABLE", bit_width: 1 },
>             FieldSpec { name: "MODE", bit_width: 3 },
>             FieldSpec { name: "PRIORITY", bit_width: 4 },
>         ];
> 
>         let layout = RegisterLayout::compile(&SPECS).expect("Layout compilation failed");
>         
>         // Check ENABLE field (shift 0, width 1 -> mask 0x1)
>         assert_eq!(layout.fields[0].shift, 0);
>         assert_eq!(layout.fields[0].mask, 0b0000_0001);
>         assert_eq!(layout.fields[0].max_value, 1);
> 
>         // Check MODE field (shift 1, width 3 -> mask 0x0E)
>         assert_eq!(layout.fields[1].shift, 1);
>         assert_eq!(layout.fields[1].mask, 0b0000_1110);
>         assert_eq!(layout.fields[1].max_value, 7);
> 
>         // Check PRIORITY field (shift 4, width 4 -> mask 0xF0)
>         assert_eq!(layout.fields[2].shift, 4);
>         assert_eq!(layout.fields[2].mask, 0b1111_0000);
>         assert_eq!(layout.fields[2].max_value, 15);
>     }
> 
>     #[test]
>     fn test_read_write_field_operations() {
>         const SPECS: [FieldSpec; 3] = [
>             FieldSpec { name: "ENABLE", bit_width: 1 },
>             FieldSpec { name: "MODE", bit_width: 3 },
>             FieldSpec { name: "PRIORITY", bit_width: 4 },
>         ];
>         let layout = RegisterLayout::compile(&SPECS).unwrap();
> 
>         let mut reg = 0u32;
>         reg = layout.write_field(0, reg, 1).unwrap(); // ENABLE = 1
>         reg = layout.write_field(1, reg, 5).unwrap(); // MODE = 5 (0b101)
>         reg = layout.write_field(2, reg, 0xA).unwrap(); // PRIORITY = 10 (0b1010)
> 
>         // Expected bits: 1010_101_1 = 0xAB = 171
>         assert_eq!(reg, 0b1010_1011);
> 
>         assert_eq!(layout.read_field(0, reg).unwrap(), 1);
>         assert_eq!(layout.read_field(1, reg).unwrap(), 5);
>         assert_eq!(layout.read_field(2, reg).unwrap(), 0xA);
>     }
> 
>     #[test]
>     fn test_register_overflow_error() {
>         const OVERFLOW_SPECS: [FieldSpec; 2] = [
>             FieldSpec { name: "PAYLOAD", bit_width: 24 },
>             FieldSpec { name: "HEADER", bit_width: 12 }, // 24 + 12 = 36 > 32
>         ];
>         let result = RegisterLayout::compile(&OVERFLOW_SPECS);
>         assert_eq!(
>             result.err(),
>             Some(RegisterDslError::RegisterOverflow { total_bits: 36 })
>         );
>     }
> }
> ```
> 
> **Explanation:**
> 1. **Compile-Time Bitfield Calculation**: Procedural function-like macros analyze input DSL tokens during compilation to calculate bitwise masks (`mask = max_value << shift`) ahead of time, avoiding dynamic calculations during hardware runtime.
> 2. **Const Generics & Array Layouts**: Using const generics (`RegisterLayout<N>`) and `const fn` guarantees that register layouts are computed during `rustc` compilation, meeting strict `#![no_std]` embedded requirements without dynamic heap memory allocation.
> 3. **Static Boundary Validation**: Checking total register bit widths (e.g. `<= 32` bits) inside the compilation step allows procedural macros to reject invalid hardware register configurations with clear compile-time error diagnostics before microcontrollers flash corrupted register settings.

---

### Exercise 2: Static DSL Tokenizer, AST Query Parser & Compile-Time Error Diagnostic Generator

**Problem:** Function-like procedural macros such as `sqlx::query!` or `maud::html!` process custom non-Rust token streams inside macro invocation delimiters. A fundamental design pattern in proc macros is converting DSL syntax or semantic errors into `compile_error!` tokens (or `syn::Error::into_compile_error()`) so `rustc` reports exact, column-located diagnostic messages rather than panicking with opaque macro expansion panics.

Implement a complete compile-time DSL query tokenizer, AST parser, and compiler error transformer simulating a function-like macro engine (e.g., `query!("SELECT id, name FROM users WHERE status = ?")`). The implementation must:
1. Tokenize a custom SQL/query string into discrete tokens (`KeywordSelect`, `KeywordFrom`, `KeywordWhere`, `Identifier`, `Comma`, `Equals`, `Placeholder`).
2. Parse tokens into a strongly typed `QueryAst` structure.
3. Validate query structure against schema rules (expecting valid `SELECT`, `FROM`, and identifier tokens).
4. Emit formatted compiler error messages (simulating `compile_error!`) with line/column span context when syntax or schema errors occur.
5. Provide unit tests using `assert_eq!` and `assert!` verifying valid query AST construction, parameter binding count, syntax error diagnosis, and `compile_error!` code string generation.

> [!check]- Answer
> ```rust
> use std::fmt;
> 
> /// Represents discrete token types in the DSL input stream.
> #[derive(Debug, PartialEq, Eq, Clone)]
> pub enum TokenKind {
>     KeywordSelect,
>     KeywordFrom,
>     KeywordWhere,
>     Identifier(String),
>     Comma,
>     Equals,
>     Placeholder(usize),
> }
> 
> /// Token with position tracking for macro error span reporting.
> #[derive(Debug, PartialEq, Eq, Clone)]
> pub struct Token {
>     pub kind: TokenKind,
>     pub column: usize,
> }
> 
> /// Abstract Syntax Tree representation generated by the function-like macro.
> #[derive(Debug, PartialEq, Eq)]
> pub struct QueryAst {
>     pub selected_fields: Vec<String>,
>     pub table_name: String,
>     pub where_field: Option<String>,
>     pub param_count: usize,
> }
> 
> /// Proc macro compiler error output format (simulating compile_error! token output).
> #[derive(Debug, PartialEq, Eq)]
> pub struct ProcMacroCompileError {
>     pub message: String,
>     pub column: usize,
> }
> 
> impl ProcMacroCompileError {
>     /// Generates an expanded `compile_error!("...")` string token representation.
>     pub fn to_compile_error_tokens(&self) -> String {
>         format!(
>             "compile_error!(\"DSL Parse Error at column {}: {}\");",
>             self.column, self.message
>         )
>     }
> }
> 
> /// Simulated Function-like Proc Macro Parser Engine.
> pub struct QueryMacroEngine;
> 
> impl QueryMacroEngine {
>     /// Tokenizes an incoming macro input string.
>     pub fn tokenize(input: &str) -> Result<Vec<Token>, ProcMacroCompileError> {
>         let mut tokens = Vec::new();
>         let mut col = 0;
>         let bytes = input.as_bytes();
> 
>         while col < bytes.len() {
>             match bytes[col] {
>                 b' ' | b'\t' | b'\n' => col += 1,
>                 b',' => {
>                     tokens.push(Token { kind: TokenKind::Comma, column: col });
>                     col += 1;
>                 }
>                 b'=' => {
>                     tokens.push(Token { kind: TokenKind::Equals, column: col });
>                     col += 1;
>                 }
>                 b'?' => {
>                     let param_idx = tokens.iter().filter(|t| matches!(t.kind, TokenKind::Placeholder(_))).count() + 1;
>                     tokens.push(Token { kind: TokenKind::Placeholder(param_idx), column: col });
>                     col += 1;
>                 }
>                 b'a'..=b'z' | b'A'..=b'Z' | b'_' => {
>                     let start = col;
>                     while col < bytes.len() && (bytes[col].is_ascii_alphanumeric() || bytes[col] == b'_') {
>                         col += 1;
>                     }
>                     let word = &input[start..col];
>                     let kind = match word.to_uppercase().as_str() {
>                         "SELECT" => TokenKind::KeywordSelect,
>                         "FROM" => TokenKind::KeywordFrom,
>                         "WHERE" => TokenKind::KeywordWhere,
>                         _ => TokenKind::Identifier(word.to_string()),
>                     };
>                     tokens.push(Token { kind, column: start });
>                 }
>                 c => {
>                     return Err(ProcMacroCompileError {
>                         message: format!("Unexpected character token '{}'", c as char),
>                         column: col,
>                     });
>                 }
>             }
>         }
>         Ok(tokens)
>     }
> 
>     /// Parses token stream into AST, validating query structure.
>     pub fn parse(tokens: &[Token]) -> Result<QueryAst, ProcMacroCompileError> {
>         let mut idx = 0;
> 
>         // Expect SELECT keyword
>         if idx >= tokens.len() || tokens[idx].kind != TokenKind::KeywordSelect {
>             let col = tokens.get(0).map(|t| t.column).unwrap_or(0);
>             return Err(ProcMacroCompileError {
>                 message: "Expected 'SELECT' keyword at start of query".into(),
>                 column: col,
>             });
>         }
>         idx += 1;
> 
>         // Parse column list
>         let mut fields = Vec::new();
>         loop {
>             if idx >= tokens.len() {
>                 return Err(ProcMacroCompileError {
>                     message: "Unexpected end of input while parsing field list".into(),
>                     column: tokens.last().map(|t| t.column).unwrap_or(0),
>                 });
>             }
>             if let TokenKind::Identifier(name) = &tokens[idx].kind {
>                 fields.push(name.clone());
>                 idx += 1;
>             } else {
>                 return Err(ProcMacroCompileError {
>                     message: "Expected column identifier".into(),
>                     column: tokens[idx].column,
>                 });
>             }
> 
>             if idx < tokens.len() && tokens[idx].kind == TokenKind::Comma {
>                 idx += 1; // Skip comma
>             } else {
>                 break;
>             }
>         }
> 
>         // Expect FROM keyword
>         if idx >= tokens.len() || tokens[idx].kind != TokenKind::KeywordFrom {
>             let col = tokens.get(idx).map(|t| t.column).unwrap_or(0);
>             return Err(ProcMacroCompileError {
>                 message: "Expected 'FROM' keyword after select fields".into(),
>                 column: col,
>             });
>         }
>         idx += 1;
> 
>         // Expect Table Name
>         let table_name = if idx < tokens.len() {
>             if let TokenKind::Identifier(name) = &tokens[idx].kind {
>                 let t = name.clone();
>                 idx += 1;
>                 t
>             } else {
>                 return Err(ProcMacroCompileError {
>                     message: "Expected table identifier after 'FROM'".into(),
>                     column: tokens[idx].column,
>                 });
>             }
>         } else {
>             return Err(ProcMacroCompileError {
>                 message: "Unexpected end of query expecting table identifier".into(),
>                 column: tokens.last().map(|t| t.column).unwrap_or(0),
>             });
>         };
> 
>         // Optional WHERE clause
>         let mut where_field = None;
>         let mut param_count = 0;
> 
>         if idx < tokens.len() && tokens[idx].kind == TokenKind::KeywordWhere {
>             idx += 1;
>             if idx < tokens.len() {
>                 if let TokenKind::Identifier(w_field) = &tokens[idx].kind {
>                     where_field = Some(w_field.clone());
>                     idx += 1;
>                 }
>             }
>             if idx < tokens.len() && tokens[idx].kind == TokenKind::Equals {
>                 idx += 1;
>             }
>             if idx < tokens.len() {
>                 if let TokenKind::Placeholder(p_idx) = tokens[idx].kind {
>                     param_count = p_idx;
>                 }
>             }
>         }
> 
>         Ok(QueryAst {
>             selected_fields: fields,
>             table_name,
>             where_field,
>             param_count,
>         })
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_valid_query_parsing() {
>         let input = "SELECT id, name FROM users WHERE status = ?";
>         let tokens = QueryMacroEngine::tokenize(input).expect("Tokenization failed");
>         let ast = QueryMacroEngine::parse(&tokens).expect("Parsing failed");
> 
>         assert_eq!(ast.selected_fields, vec!["id", "name"]);
>         assert_eq!(ast.table_name, "users");
>         assert_eq!(ast.where_field, Some("status".to_string()));
>         assert_eq!(ast.param_count, 1);
>     }
> 
>     #[test]
>     fn test_missing_from_error_diagnostics() {
>         let input = "SELECT id, name users";
>         let tokens = QueryMacroEngine::tokenize(input).unwrap();
>         let err = QueryMacroEngine::parse(&tokens).unwrap_err();
> 
>         assert_eq!(err.message, "Expected 'FROM' keyword after select fields");
>         assert_eq!(
>             err.to_compile_error_tokens(),
>             "compile_error!(\"DSL Parse Error at column 16: Expected 'FROM' keyword after select fields\");"
>         );
>     }
> 
>     #[test]
>     fn test_invalid_character_tokenization() {
>         let input = "SELECT id @ FROM users";
>         let err = QueryMacroEngine::tokenize(input).unwrap_err();
> 
>         assert_eq!(err.message, "Unexpected character token '@'");
>         assert_eq!(err.column, 10);
>     }
> }
> ```
> 
> **Explanation:**
> 1. **Custom Tokenization**: Function-like procedural macros accept arbitrary input token streams within `(...)`, `[...]`, or `{...}`. By tokenizing text characters into domain tokens (`TokenKind`), proc macros break free from Rust's native expression constraints.
> 2. **AST Transformation**: The engine maps flat token streams into structured Abstract Syntax Trees (`QueryAst`). At compile time, this AST enables procedural macros to generate strongly typed Rust structs or functions tailored to the query's schema.
> 3. **Error Reporting via `compile_error!`**: Panicking inside procedural macros produces unhelpful `proc macro panicked` errors. By capturing position context (`column`) and formatting errors into `compile_error!("...")` macro output tokens, errors are passed directly to `rustc` to highlight the exact line and position of invalid input code.

---

### Exercise 3: Embedded Telemetry Packet Frame DSL Generator (`no_std`)

**Problem:** In automotive (CAN bus) and IoT sensor platforms, telemetry packet formats are specified via custom binary DSL definitions. A function-like proc macro `packet_spec!` parses field layouts, header signatures, and CRC requirements, generating zero-copy packet builder and parser routines with byte packing and validation checks.

Implement a complete, `#![no_std]` Rust binary telemetry packet framing generator and validation engine demonstrating how a function-like macro's generated code operates. The implementation must:
1. Define fixed-size binary telemetry packet layouts with magic headers, payload fields, sequence numbers, and CRC checksums.
2. Implement binary packing (`serialize`) and unpacking (`deserialize`) routines without heap allocation.
3. Calculate and verify custom CRC16/Checksum signatures over packet frames.
4. Support error handling for corrupted headers, invalid frame lengths, or mismatched CRC checksums.
5. Provide comprehensive unit tests with `assert_eq!` and `assert!` verifying serialization round-trips, frame integrity checks, and error detection on corrupted buffers.

> [!check]- Answer
> ```rust
> #![no_std]
> 
> /// Header magic byte identifying telemetry frames generated by macro.
> pub const TELEMETRY_MAGIC: u16 = 0xAA55;
> 
> /// Error conditions encountered during telemetry packet parsing.
> #[derive(Debug, PartialEq, Eq, Clone, Copy)]
> pub enum PacketError {
>     InvalidMagicHeader,
>     BufferTooSmall,
>     ChecksumMismatch { expected: u16, actual: u16 },
> }
> 
> /// Simulated Struct generated by `packet_spec!` macro.
> #[derive(Debug, PartialEq, Eq, Clone, Copy)]
> pub struct TelemetryFrame {
>     pub seq_num: u16,
>     pub sensor_id: u8,
>     pub temperature_raw: i16,
>     pub pressure_hpa: u16,
> }
> 
> impl TelemetryFrame {
>     /// Computes CCITT-FALSE CRC16 checksum over a byte payload slice.
>     pub fn calculate_crc(data: &[u8]) -> u16 {
>         let mut crc: u16 = 0xFFFF;
>         for &byte in data {
>             crc ^= (byte as u16) << 8;
>             for _ in 0..8 {
>                 if (crc & 0x8000) != 0 {
>                     crc = (crc << 1) ^ 0x1021;
>                 } else {
>                     crc <<= 1;
>                 }
>             }
>         }
>         crc
>     }
> 
>     /// Serializes telemetry frame into a 11-byte binary buffer.
>     /// Buffer layout: [MAGIC:2][SEQ:2][SENSOR_ID:1][TEMP:2][PRESS:2][CRC16:2]
>     pub fn serialize(&self, buffer: &mut [u8]) -> Result<usize, PacketError> {
>         if buffer.len() < 11 {
>             return Err(PacketError::BufferTooSmall);
>         }
> 
>         // Write Magic Header (Big-Endian)
>         buffer[0..2].copy_from_slice(&TELEMETRY_MAGIC.to_be_bytes());
>         // Write Sequence Number
>         buffer[2..4].copy_from_slice(&self.seq_num.to_be_bytes());
>         // Write Sensor ID
>         buffer[4] = self.sensor_id;
>         // Write Temperature Raw
>         buffer[5..7].copy_from_slice(&self.temperature_raw.to_be_bytes());
>         // Write Pressure HPa
>         buffer[7..9].copy_from_slice(&self.pressure_hpa.to_be_bytes());
> 
>         // Compute CRC over header + payload (bytes 0..9)
>         let crc = Self::calculate_crc(&buffer[0..9]);
>         buffer[9..11].copy_from_slice(&crc.to_be_bytes());
> 
>         Ok(11)
>     }
> 
>     /// Deserializes a binary buffer into a TelemetryFrame after verifying CRC integrity.
>     pub fn deserialize(buffer: &[u8]) -> Result<Self, PacketError> {
>         if buffer.len() < 11 {
>             return Err(PacketError::BufferTooSmall);
>         }
> 
>         let magic = u16::from_be_bytes([buffer[0], buffer[1]]);
>         if magic != TELEMETRY_MAGIC {
>             return Err(PacketError::InvalidMagicHeader);
>         }
> 
>         let actual_crc = u16::from_be_bytes([buffer[9], buffer[10]]);
>         let expected_crc = Self::calculate_crc(&buffer[0..9]);
> 
>         if actual_crc != expected_crc {
>             return Err(PacketError::ChecksumMismatch {
>                 expected: expected_crc,
>                 actual: actual_crc,
>             });
>         }
> 
>         let seq_num = u16::from_be_bytes([buffer[2], buffer[3]]);
>         let sensor_id = buffer[4];
>         let temperature_raw = i16::from_be_bytes([buffer[5], buffer[6]]);
>         let pressure_hpa = u16::from_be_bytes([buffer[7], buffer[8]]);
> 
>         Ok(Self {
>             seq_num,
>             sensor_id,
>             temperature_raw,
>             pressure_hpa,
>         })
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_telemetry_frame_roundtrip() {
>         let frame = TelemetryFrame {
>             seq_num: 1024,
>             sensor_id: 0x42,
>             temperature_raw: -150, // -15.0 C
>             pressure_hpa: 1013,
>         };
> 
>         let mut buf = [0u8; 16];
>         let bytes_written = frame.serialize(&mut buf).expect("Serialization failed");
>         assert_eq!(bytes_written, 11);
> 
>         let parsed_frame = TelemetryFrame::deserialize(&buf[..bytes_written]).expect("Deserialization failed");
>         assert_eq!(frame, parsed_frame);
>     }
> 
>     #[test]
>     fn test_corrupted_crc_detection() {
>         let frame = TelemetryFrame {
>             seq_num: 1,
>             sensor_id: 2,
>             temperature_raw: 250,
>             pressure_hpa: 1000,
>         };
> 
>         let mut buf = [0u8; 11];
>         frame.serialize(&mut buf).unwrap();
> 
>         // Corrupt sensor ID byte
>         buf[4] ^= 0xFF;
> 
>         let result = TelemetryFrame::deserialize(&buf);
>         assert!(matches!(result, Err(PacketError::ChecksumMismatch { .. })));
>     }
> 
>     #[test]
>     fn test_invalid_magic_header() {
>         let mut buf = [0u8; 11];
>         buf[0] = 0x00;
>         buf[1] = 0x00; // Invalid magic
> 
>         let result = TelemetryFrame::deserialize(&buf);
>         assert_eq!(result, Err(PacketError::InvalidMagicHeader));
>     }
> }
> ```
> 
> **Explanation:**
> 1. **Zero-Copy Binary Protocol Generation**: Function-like procedural macros parse custom binary packet layout specifications at compile time, outputting strongly-typed structs with fixed byte offset serialization (`copy_from_slice`) for real-time `#![no_std]` embedded networks.
> 2. **Embedded Integrity Guarantees**: Generated `deserialize` functions check fixed frame signatures (`TELEMETRY_MAGIC`) and compute CCITT-FALSE CRC16 checksums over byte slices before instantiating target Rust structs.
> 3. **Testing Zero-Allocation Drivers**: Unit assertions (`assert_eq!`, `matches!`) verify frame packing round-trips, checksum validation failures on corrupted network noise bytes, and header safety checks.

---

## 7. Related Terms

- [Procedural Macros](../level_12/procedural_macros.md) — The parent procedural macro system.
- [Declarative Macros (`macro_rules!`)](../level_12/declarative_macros_macro_rules.md) — Pattern-matching macros with identical invocation syntax (`my_macro!(...)`).
- [Token Stream](../level_12/token_stream.md) — The compiler input/output type passed into function-like proc macros.
- [Attribute Macros](../level_12/attribute_macros.md) — Procedural macros invoked as outer attributes `#[my_attr]`.

---

## 8. Key Takeaways

- Function-like Procedural Macros (`#[proc_macro]`) are invoked using bang syntax (`custom_macro!(...)`).
- They receive a single `TokenStream` containing the tokens inside invocation delimiters `()`, `[]`, or `{}` (with outer delimiters stripped).
- They execute arbitrary Rust code on the build host during compilation, enabling full AST parsing, DSL processing, and external IO.
- Use `syn::Error::into_compile_error()` instead of `panic!` to deliver precise line-and-column diagnostic squiggles.
