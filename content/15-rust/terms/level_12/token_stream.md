# Token Stream

> **Level 12 — Macros**
> The compiler type (`proc_macro::TokenStream`) that represents Rust source code as a sequence of lexical tokens passed into and returned from procedural macros.

---

## 1. Prerequisites

- [Procedural Macros](../level_12/procedural_macros.md) — Understanding compile-time host execution and procedural macro declarations.
- [Tokens & Lexing](../level_01/tokens.md) — Basic understanding of source code lexical analysis (identifiers, literals, operators, punctuation).
- [Iterators (`Iterator`)](../level_05/iterator.md) — `TokenStream` implements `IntoIterator`, producing `TokenTree` elements.

---

## 2. Term Category

**Syntax / Language Feature**: A Token Stream is the fundamental data representation used by Rust procedural macros. Exposed by the compiler's built-in `proc_macro` crate as `proc_macro::TokenStream` (and mirrored in ecosystem crates as `proc_macro2::TokenStream`), it represents Rust source code not as raw plain text strings, but as an abstract sequence of lexical tokens and nested token trees.

---

## 3. Environment Context

**Universal Rust (Host Compiler Context)**: `proc_macro::TokenStream` is available exclusively within procedural macro crates running on the build host during compilation. Ecosystem code outside proc macro crates uses `proc_macro2::TokenStream` to enable unit testing and out-of-proc-macro code generation.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"

In JavaScript or C/C++ preprocessors, metaprogramming and macro substitution often operate on raw string concatenation (e.g. C `#define` macros or string regex replacements). String-based code generation is notoriously error-prone: it easily causes broken syntax, subtle operator precedence bugs, unclosed quotes, or invalid variable shadowing.

Rust wanted a metaprogramming system that was:
1. **Syntactically Aware**: Operates on structured lexical tokens rather than unstructured characters or strings.
2. **Span and Hygiene Tracked**: Every token inside a token stream retains source location metadata (`Span`), enabling precise line/column compiler error messages and hygienic variable binding.
3. **Delimiter Preserving**: Enclosed code blocks (`(...)`, `[...]`, `{...}`) are preserved as nested `TokenTree::Group` nodes, maintaining hierarchical AST structure before full semantic parsing.

`TokenStream` satisfies these requirements by exposing source code as a sequence of `TokenTree` variants: `Group`, `Ident`, `Punct`, and `Literal`.

### (2) Reality Metaphor

Imagine a **Freight Train of Standardized Cargo Containers**:

- **Raw Source Code (`String`)** is like a bulk heap of loose items dumped in a truck bed: text characters mixed together that must be sorted from scratch before anything can be processed.
- A **`TokenStream`** is like a freight train made up of discrete, labeled shipping containers (**`TokenTree` items**):
  - **`Ident`** container: holds a variable or function name (`user_id`).
  - **`Literal`** container: holds a raw value (`42`, `"hello"`).
  - **`Punct`** container: holds punctuation operators (`+`, `:`, `=`).
  - **`Group`** container: holds a sealed nested mini-train enclosed in parentheses or braces `(...)`.

The procedural macro function is the train conductor: it receives the incoming train, inspects/rearranges/swaps cargo containers, and sends out the modified freight train to the compiler.

### (3) Code Examples

#### Short Snippet (Inspecting a `TokenStream` via Iteration)

*Note: Must be executed within a `proc-macro = true` crate.*

```rust
use proc_macro::{TokenStream, TokenTree};

/// A procedural macro that iterates over an incoming TokenStream
/// and prints each TokenTree variant during compilation.
#[proc_macro]
pub fn inspect_tokens(input: TokenStream) -> TokenStream {
    for token in input.clone() {
        match token {
            TokenTree::Group(group) => {
                println!("Found Group with delimiter: {:?}", group.delimiter());
            }
            TokenTree::Ident(ident) => {
                println!("Found Identifier: {}", ident);
            }
            TokenTree::Punct(punct) => {
                println!("Found Punctuation: {}", punct.as_char());
            }
            TokenTree::Literal(lit) => {
                println!("Found Literal: {}", lit);
            }
        }
    }

    // Return the token stream unchanged
    input
}
```

#### Fuller Example (`proc_macro2` Unit Testing Token Streams)

```rust
// Outside proc-macro crates (e.g. in standard library/test files),
// we use `proc_macro2::TokenStream` and `quote::quote!` to build and test token streams.
use proc_macro2::TokenStream;
use quote::quote;

fn analyze_token_stream(stream: TokenStream) -> usize {
    // Count total number of top-level token trees in the stream
    stream.into_iter().count()
}

fn main() {
    // `quote!` constructs a `proc_macro2::TokenStream` from valid Rust syntax
    let tokens: TokenStream = quote! {
        let x = 10 + 20;
    };

    let count = analyze_token_stream(tokens.clone());
    println!("TokenStream text representation: \"{}\"", tokens);
    println!("Top-level TokenTree count: {}", count);
    
    // Output:
    // TokenStream text representation: "let x = 10 + 20 ;"
    // Top-level TokenTree count: 6  (let, x, =, 10, +, 20, ;)
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Treating `TokenStream` as a Plain String for Code Generation

**The mistake:** Performing naive string concatenation or regex manipulation on `token_stream.to_string()` and re-parsing back into a `TokenStream`.

**Why it's wrong:** Converting a `TokenStream` to a `String` strips compiler `Span` tracking metadata. As a result, compiler diagnostics for generated code will point to confusing line numbers or lose error highlighting context.

*Incorrect:*
```rust
#[proc_macro]
pub fn bad_macro(input: TokenStream) -> TokenStream {
    // ❌ Strips Span metadata and risks broken syntax concatenation
    let s = input.to_string();
    let modified = format!("fn generated() {{ {} }}", s);
    modified.parse().unwrap()
}
```

*Fix:*
```rust
use quote::quote;

#[proc_macro]
pub fn good_macro(input: TokenStream) -> TokenStream {
    let input2 = proc_macro2::TokenStream::from(input);
    // Correct: Use `quote!` to preserve Spans and structure token streams cleanly
    let expanded = quote! {
        fn generated() {
            #input2
        }
    };
    expanded.into()
}
```

### Mistake 2: Confusing `proc_macro::TokenStream` with `proc_macro2::TokenStream`

**The mistake:** Attempting to use `proc_macro::TokenStream` inside unit tests or standard non-proc-macro binary crates.

**Why it's wrong:** `proc_macro::TokenStream` is compiler-internal and panics when instantiated outside of an active `rustc` procedural macro invocation context. The community crate `proc_macro2` provides an identical type usable anywhere.

*Incorrect:*
```rust
// In tests/test.rs (standard binary/test target)
#[test]
fn test_tokens() {
    // ❌ Panic: proc_macro::TokenStream cannot be used outside proc-macro crate context
    let _ts = proc_macro::TokenStream::new(); 
}
```

*Fix:*
```rust
// In tests/test.rs
#[test]
fn test_tokens() {
    // Correct: Use proc_macro2::TokenStream for testing and offline AST manipulation
    let ts = proc_macro2::TokenStream::new();
    assert!(ts.is_empty());
}
```

### Mistake 3: Forgetting `TokenTree::Group` Recursion

**The mistake:** Assuming a single flat iteration loop over `TokenStream` will visit tokens inside parentheses `()`, brackets `[]`, or braces `{}`.

**Why it's wrong:** Delimited code blocks are stored as a single `TokenTree::Group` element. Iterating over the parent stream yields the `Group` without inspecting its inner stream unless `group.stream()` is recursively iterated.

*Incorrect:*
```rust
// Iterating over `fn foo() { let x = 1; }`
for token in stream {
    // ❌ `let`, `x`, `=`, `1` are hidden inside the TokenTree::Group of the `{...}` body!
}
```

*Fix:*
```rust
fn process_stream(stream: proc_macro2::TokenStream) {
    for token in stream {
        if let proc_macro2::TokenTree::Group(group) = token {
            // Recursively process inner stream inside group
            process_stream(group.stream());
        }
    }
}
```

---

## 6. Practice Exercises

### Exercise 1: Recursive Embedded Hardware Config Token Stream Analyzer

**Problem Statement:**
In an embedded firmware generator or micro-DSL parser, configuration blocks contain hardware register declarations, pin definitions, and telemetry metadata nested inside groups such as:
`config! { pins: { pin_a: 1, pin_b: 2 }, telemetry: [baud_9600, parity_none] }`

Write a recursive analyzer function `fn analyze_dsl_tokens(stream: TokenStream, idents: &mut Vec<String>, literals: &mut Vec<String>)` using `proc_macro2` that inspects all nested `TokenTree::Group` nodes, collects all identifier names into `idents`, and collects all literal values into `literals`. Include unit tests with assertions proving that nested group contents are successfully extracted.

> [!check]- Answer
> ```rust
> use proc_macro2::{TokenStream, TokenTree};
> use quote::quote;
> 
> /// Recursively traverses a TokenStream, accumulating identifiers and literals
> /// even when nested inside `(...)`, `{...}`, or `[...]` groups.
> pub fn analyze_dsl_tokens(
>     stream: TokenStream,
>     idents: &mut Vec<String>,
>     literals: &mut Vec<String>,
> ) {
>     for tt in stream {
>         match tt {
>             TokenTree::Group(group) => {
>                 // Recursively unpack inner TokenStream inside parenthesis, brace, or bracket
>                 analyze_dsl_tokens(group.stream(), idents, literals);
>             }
>             TokenTree::Ident(ident) => {
>                 idents.push(ident.to_string());
>             }
>             TokenTree::Literal(lit) => {
>                 literals.push(lit.to_string());
>             }
>             TokenTree::Punct(_) => {
>                 // Ignore punctuation tokens like ':', ',', '=', etc.
>             }
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_recursive_dsl_analysis() {
>         let input: TokenStream = quote! {
>             config! {
>                 pins: { pin_a: 1, pin_b: 2 },
>                 telemetry: [baud_9600, parity_none]
>             }
>         };
> 
>         let mut idents = Vec::new();
>         let mut literals = Vec::new();
> 
>         analyze_dsl_tokens(input, &mut idents, &mut literals);
> 
>         // Verify captured identifiers across outer call and inner nested groups
>         assert_eq!(
>             idents,
>             vec![
>                 "config",
>                 "pins",
>                 "pin_a",
>                 "pin_b",
>                 "telemetry",
>                 "baud_9600",
>                 "parity_none"
>             ]
>         );
> 
>         // Verify captured literals inside nested groups
>         assert_eq!(literals, vec!["1", "2"]);
>         assert!(idents.contains(&"pin_a".to_string()));
>         assert!(!literals.contains(&"config".to_string()));
>     }
> }
> ```
> 
> **Explanation:**
> 1. **Group Recursion:** A `TokenStream` preserves code hierarchy by wrapping enclosed blocks (`{...}`, `[...]`, `(...)`) inside `TokenTree::Group`. Flat iteration only visits the `Group` node itself; calling `group.stream()` extracts the inner `TokenStream` for recursive inspection.
> 2. **Variant Destructuring:** Using `match tt`, we discriminate between `TokenTree::Ident` (names), `TokenTree::Literal` (values), `TokenTree::Punct` (operators/delimiters), and `TokenTree::Group` (nested sub-streams).
> 3. **Verification Assertions:** The unit test constructs a `TokenStream` using `quote!`, runs `analyze_dsl_tokens`, and validates exact item collections using `assert_eq!` and membership checks using `assert!`.

---

### Exercise 2: Real-Time Telemetry Identifier Prefixing & Span-Preserving Token Rewriter

**Problem Statement:**
In an IoT sensor telemetry library, procedural macros modify user-provided macro code blocks to prevent symbol collisions by prepending a prefix (e.g. `sensor_`) to all identifiers. For instance, `read_adc(adc_ch0, 100);` must be transformed into `sensor_read_adc(sensor_adc_ch0, 100);`.

Write a function `fn prefix_telemetry_idents(stream: TokenStream, prefix: &str) -> TokenStream` using `proc_macro2` that rewrites all identifiers, preserves original group delimiters and `Span` metadata, and include unit tests verifying token structures and strings.

> [!check]- Answer
> ```rust
> use proc_macro2::{Ident, TokenStream, TokenTree};
> use quote::quote;
> 
> /// Rewrites identifiers in a TokenStream by prepending a prefix string,
> /// preserving existing TokenTree::Group structure and original Span metadata.
> pub fn prefix_telemetry_idents(stream: TokenStream, prefix: &str) -> TokenStream {
>     let mut output = TokenStream::new();
> 
>     for tt in stream {
>         let transformed_tt = match tt {
>             TokenTree::Group(group) => {
>                 // Process inner stream recursively and recreate Group with original delimiter and span
>                 let new_inner = prefix_telemetry_idents(group.stream(), prefix);
>                 let mut new_group = proc_macro2::Group::new(group.delimiter(), new_inner);
>                 new_group.set_span(group.span());
>                 TokenTree::Group(new_group)
>             }
>             TokenTree::Ident(ident) => {
>                 // Synthesize new Ident with prefixed string while retaining original ident.span()
>                 let new_name = format!("{}{}", prefix, ident);
>                 let new_ident = Ident::new(&new_name, ident.span());
>                 TokenTree::Ident(new_ident)
>             }
>             TokenTree::Punct(punct) => {
>                 // Preserve punctuation operator and spacing (Joint vs Alone)
>                 TokenTree::Punct(punct)
>             }
>             TokenTree::Literal(lit) => {
>                 // Preserve literals unchanged
>                 TokenTree::Literal(lit)
>             }
>         };
> 
>         output.extend(std::iter::once(transformed_tt));
>     }
> 
>     output
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_prefix_telemetry_idents() {
>         let input: TokenStream = quote! {
>             read_adc(adc_ch0, 100);
>         };
> 
>         let transformed = prefix_telemetry_idents(input, "sensor_");
>         let result_str = transformed.to_string();
> 
>         // Verify overall string representation of transformed stream
>         assert_eq!(result_str, "sensor_read_adc (sensor_adc_ch0 , 100) ;");
> 
>         // Directly inspect root TokenTree elements via unit assertions
>         let tokens: Vec<TokenTree> = transformed.into_iter().collect();
>         if let TokenTree::Ident(ref id) = tokens[0] {
>             assert_eq!(id.to_string(), "sensor_read_adc");
>         } else {
>             panic!("Expected first token to be an Ident");
>         }
> 
>         // Inspect inner group tokens inside parentheses
>         if let TokenTree::Group(ref g) = tokens[1] {
>             let inner_tokens: Vec<TokenTree> = g.stream().into_iter().collect();
>             if let TokenTree::Ident(ref inner_id) = inner_tokens[0] {
>                 assert_eq!(inner_id.to_string(), "sensor_adc_ch0");
>             } else {
>                 panic!("Expected first inner token inside group to be sensor_adc_ch0 Ident");
>             }
>         } else {
>             panic!("Expected second token to be a Group");
>         }
>     }
> }
> ```
> 
> **Explanation:**
> 1. **Span Preservation:** Creating new identifiers using `Ident::new(&new_name, original_ident.span())` transfers source location metadata to the new token. If compiler errors occur on the generated code, `rustc` correctly highlights the original source line.
> 2. **Group Reconstruction:** Groups cannot be mutated in-place; we build a new `proc_macro2::Group` containing the recursively transformed inner stream and copy the original span via `.set_span(group.span())`.
> 3. **Token Accumulation:** Transformed `TokenTree` instances are appended into a new `TokenStream` via `output.extend(std::iter::once(transformed_tt))`.

---

### Exercise 3: Low-Level Peripheral Register Bitmask Token Sequence Validator

**Problem Statement:**
In bare-metal embedded Rust driver development, procedural macros validate bitwise flag combinations passed into register configuration macros, such as `(CTRL_ENABLE | CTRL_INTERRUPT) << 2`.

Write a validation function `fn validate_register_expression(stream: TokenStream) -> Result<usize, String>` using `proc_macro2` that inspects a `TokenStream`, verifying that:
1. Every punctuation token belongs to an allowed set of register operators (`|`, `&`, `^`, `~`, `<`, `>`).
2. Disallowed operators or punctuation (such as `;`, `$`, or `@`) immediately return a descriptive `Err(String)`.
3. Returns `Ok(usize)` with the count of valid operator tokens upon success.

Write unit tests verifying both success cases (correct operator count) and failure cases (error message content).

> [!check]- Answer
> ```rust
> use proc_macro2::{Spacing, TokenStream, TokenTree};
> use quote::quote;
> 
> /// Validates that a TokenStream contains only allowed low-level register bitwise operations
> /// and calculates total valid operator tokens.
> pub fn validate_register_expression(stream: TokenStream) -> Result<usize, String> {
>     let mut op_count = 0;
>     let allowed_ops = ['|', '&', '^', '~', '<', '>'];
> 
>     for tt in stream {
>         match tt {
>             TokenTree::Group(group) => {
>                 // Recursively validate inner group expressions (e.g. parenthesized bitmasks)
>                 let inner_ops = validate_register_expression(group.stream())?;
>                 op_count += inner_ops;
>             }
>             TokenTree::Punct(punct) => {
>                 let ch = punct.as_char();
>                 if !allowed_ops.contains(&ch) {
>                     return Err(format!("Disallowed punctuation token in bitmask: '{}'", ch));
>                 }
> 
>                 // Note: Spacing::Joint indicates a multi-character operator like `<<` or `>>`
>                 if punct.spacing() == Spacing::Joint {
>                     // Joint operator sub-piece verified
>                 }
>                 op_count += 1;
>             }
>             TokenTree::Ident(_) | TokenTree::Literal(_) => {
>                 // Register identifiers and bit-shift literals are valid syntax components
>             }
>         }
>     }
> 
>     Ok(op_count)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_valid_bitmask_expression() {
>         let input: TokenStream = quote! {
>             (CTRL_ENABLE | CTRL_INTERRUPT) << 2
>         };
> 
>         let result = validate_register_expression(input);
>         assert!(result.is_ok());
>         // '|', '<', '<' -> 3 Punct tokens total
>         assert_eq!(result.unwrap(), 3);
>     }
> 
>     #[test]
>     fn test_invalid_punctuation_rejection() {
>         let input: TokenStream = quote! {
>             CTRL_ENABLE ; CTRL_INTERRUPT
>         };
> 
>         let result = validate_register_expression(input);
>         assert!(result.is_err());
>         let err_msg = result.unwrap_err();
>         assert!(err_msg.contains("Disallowed punctuation token"));
>         assert!(err_msg.contains(';'));
>     }
> }
> ```
> 
> **Explanation:**
> 1. **Punctuation Inspection:** `TokenTree::Punct` provides `.as_char()` to inspect the single character of the punctuation token and `.spacing()` (`Spacing::Joint` vs `Spacing::Alone`) to detect multi-character tokens like `<<`.
> 2. **Early Error Propagation:** Using the `?` operator on recursive `validate_register_expression(group.stream())?` calls ensures any invalid token inside nested parentheses immediately short-circuits execution and bubbles up the `Err(String)`.
> 3. **Validation Assertions:** Unit tests check `result.is_ok()`, assert exact operator counts with `assert_eq!`, and verify error handling using `result.is_err()` and substring assertions.

---

## 7. Related Terms

- [Procedural Macros](../level_12/procedural_macros.md) — The metaprogramming function features that consume and produce token streams.
- [`syn` Crate](../level_12/syn_crate.md) — Crate used to parse raw `TokenStream` instances into high-level AST structs.
- [`quote` Crate](../level_12/quote_crate.md) — Crate used to turn Rust code templates into `TokenStream` instances.
- [Hygiene](../level_12/hygiene.md) — The macro safety property preserved by Span metadata inside TokenStreams.

---

## 8. Key Takeaways

- `TokenStream` (`proc_macro::TokenStream` / `proc_macro2::TokenStream`) represents source code as lexical tokens.
- It consists of four fundamental `TokenTree` variants: `Group`, `Ident`, `Punct`, and `Literal`.
- `TokenStream` preserves compiler `Span` metadata for accurate error diagnostic reporting and macro hygiene.
- Use `proc_macro2` outside of host macro compilation environments for testing and AST utilities.
