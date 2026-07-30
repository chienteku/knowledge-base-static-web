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

### Exercise 1: Distinguishing Macro Invocation Styles

**Problem:** Identify which of the following macro invocations are Function-like Macros vs Attribute / Derive Macros:
1. `vec![1, 2, 3]`
2. `#[derive(Debug)]`
3. `sqlx::query!("SELECT 1")`
4. `#[actix_web::get("/")]`

> [!check]- Answer
> **1 & 3 are Function-like macro invocation syntaxes (`name!(...)` or `name![...]`). 2 is a Derive Macro. 4 is an Attribute Macro.**
>
> ```rust
> // Code Demonstration:
> fn main() {
>     // Function-like macro invocation syntax (can use (), [], or {}):
>     let v = vec![1, 2, 3]; 
>     println!("Vector length: {}", v.len());
> }
> ```
>
> **Explanation:** Function-like macros are invoked using bang syntax `!`, followed by `()`, `[]`, or `{}` enclosing the input token stream.

---

### Exercise 2: Processing Delimiters in Proc Macros

**Problem:** Given the function-like proc macro invocation `my_calc!{ 10 + 20 }`, what string value does `input.to_string()` produce inside the procedural macro body? Write code to verify token string output format.

> [!check]- Answer
> ```text
> 10 + 20
> ```
> ```rust
> use std::mem;

fn main() {
    // Conceptual verification:
    // The compiler strips the outer `{}` braces before delivering the TokenStream to #[proc_macro] functions.
    let input_str = "10 + 20";
    println!("Proc macro receives inner stream: \"{}\"", input_str);
}
> ```
>
> **Explanation:** Outer delimiters (`()`, `[]`, `{}`) are stripped by `rustc`; the procedural macro function receives only the inner token stream content.

---

## 7. Related Terms

- [Procedural Macros](../level_12/procedural_macros.md) — The parent topic covering compile-time code generation functions.
- [Declarative Macros (`macro_rules!`)](../level_12/declarative_macros_macro_rules.md) — Pattern-matching macro definitions in Rust.
- [Token Stream](../level_12/token_stream.md) — The `proc_macro::TokenStream` input and output data type.
- [`syn` Crate](../level_12/syn_crate.md) — Parsing library for converting function-like macro token streams into ASTs.
- [`quote` Crate](../level_12/quote_crate.md) — Quasi-quoting library for turning Rust AST code back into token streams.

---

## 8. Key Takeaways

- Function-like Macros are procedural macros defined with `#[proc_macro]`.
- They are invoked using function-like bang syntax: `custom_macro!(...)`, `custom_macro![...]`, or `custom_macro!{...}`.
- Unlike declarative macros, function-like proc macros can execute full Rust code, perform file I/O, connect to external tools at compile time, and parse non-Rust DSL syntax.
- Macro parsing errors should be converted to `compile_error!` tokens (e.g. via `syn::Error::into_compile_error()`) to produce clear compiler diagnostics.
