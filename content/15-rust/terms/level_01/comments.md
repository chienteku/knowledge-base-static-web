# Comments

> **Level 1 — Foundations**
> Line comments (`//`), block comments (`/* */`), and doc comments (`///`, `//!`).

---

## 1. Prerequisites


- [Tokens](tokens.md) — Lexical elements processed by the compiler lexer.

---

## 2. Term Category



**Universal Language Construct (the documentation engine)**: Every programming language has comments. However, Rust's built-in, first-class support for "doc comments" that generate HTML documentation is a standout feature of the Rust ecosystem.

---

## 3. Explanation

### (1) Design Motivation — "Why does this exist in programming languages?"

Well-written code explains *what* the computer is doing, but it rarely explains *why* the programmer chose to do it that way. Comments are entirely ignored by the compiler; they exist solely for humans to leave notes, warnings, and explanations for their teammates (or for their future selves).

Rust provides three main types of comments:
1. **Line Comments (`//`)**: The standard way to leave a quick note. Anything after the `//` on that specific line is ignored.
2. **Block Comments (`/* */`)**: Useful for writing long paragraphs or, more commonly, for quickly disabling large chunks of code during debugging.
3. **Doc Comments (`///` and `//!`)**: This is where Rust shines. If you use three slashes (`///`), Rust treats it as official documentation for your code. It supports full Markdown (bolding, code blocks, links). When you run `cargo doc`, Rust automatically reads these comments and builds a beautiful, easily navigable HTML website for your project.

### (2) Reality Metaphor

Think of regular comments (`//`) like **sticky notes** you leave on a blueprint for your coworkers. They are informal, messy, and meant only for the people actively building the machine.

Think of Doc Comments (`///`) like the **official user manual** that ships with the final product. You write them directly in the blueprint to save time, but a machine extracts them, formats them nicely, and binds them into a polished book for the end-user.

### (3) Rust Code Examples

#### Short Snippet
```rust
// This is a standard line comment. It's just a note.

/* 
   This is a block comment. 
   It can span multiple lines!
*/
let x = 5; // You can also put line comments at the end of a line of code.
```

#### Fuller Example
```rust
//! This is an "inner" doc comment. It documents the ENTIRE file/module 
//! that encloses it. You usually put these at the very top of `main.rs`.
//! 
//! # Welcome to my program!
//! This program calculates physics stuff.

/// This is an "outer" doc comment. It documents the specific item 
/// that comes immediately *after* it. 
/// 
/// It supports **Markdown**!
/// 
/// ```
/// let result = calculate_gravity(9.8);
/// ```
fn calculate_gravity(mass: f64) -> f64 {
    // We multiply by 9.8 because that is Earth's gravity constant.
    // (This is a regular comment explaining the 'why').
    mass * 9.8
}

fn main() {
    /* 
    println!("I am commenting out this code so it doesn't run!");
    */
    let my_mass = 50.0;
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Confusing Line Comments `//` with Outer Doc Comments `///`

**The mistake:** Writing `//` above public functions expecting `cargo doc` to generate HTML documentation.

**Why it's wrong:** `cargo doc` processes `///` doc comments for item documentation. Regular `//` line comments are stripped out.

*Incorrect:*
```rust
// Calculates area of circle
pub fn area(r: f64) -> f64 { 3.14 * r * r }
```

*Fix:*
```rust
/// Calculates area of circle
pub fn area(r: f64) -> f64 { 3.14 * r * r }
```

### Mistake 2: Misusing Inner Doc Comments `//!` inside Functions

**The mistake:** Placing `//!` inside function bodies to document internal code lines.

**Why it's wrong:** `//!` documents the containing item (such as crate root `lib.rs` or module). Using it inside a function causes compile errors or misplaced module docs.

*Incorrect:*
```rust
fn calc() {
    //! This documents the function internally (Wrong!)
}
```

*Fix:*
```rust
fn calc() {
    // Document internal implementation details using line comments
}
```

### Mistake 3: Failing to Verify Doc Comment Code Examples with `cargo test`

**The mistake:** Writing code blocks inside `///` doc comments without running `cargo test` to verify them.

**Why it's wrong:** `cargo test` automatically compiles and executes doc comment code blocks as tests.

*Incorrect:*
```rust
/// ```rust
/// let x = add(1); // ❌ Fails compilation if signature changed!
/// ```
pub fn add(a: i32, b: i32) -> i32 { a + b }
```

*Fix:*
```rust
/// ```rust
/// let x = my_crate::add(1, 2);
/// assert_eq!(x, 3);
/// ```
pub fn add(a: i32, b: i32) -> i32 { a + b }
```

---

## 5. Practice Exercises

### Exercise 1: Multi-Format Source Comment Lexer & Sanitizer Engine

**Scenario:**
In high-security static code analysis pipelines and IDE linter backends, raw Rust source text must be lexed to separate code statements from human annotations. Rust supports four comment syntax forms:
1. Standard line comments (`//`)
2. Inner module doc comments (`//!`)
3. Outer item doc comments (`///`)
4. Block comments (`/* ... */`), which in Rust can be **nested** to arbitrary depth (e.g. `/* outer /* inner */ outer */`).

Crucially, comment-like character sequences embedded inside string literals (`"// not a comment"`) or raw string literals (`r#"/* string literal */"#`) must not be recognized as comment delimiters.

Implement a production-grade `CommentLexer` engine that scans a Rust source stream and extracts a sequence of `CommentToken` objects containing the comment category (`Line`, `InnerDoc`, `OuterDoc`, `Block`), the clean text content (with comment syntax delimiters stripped), and line number positioning.

**Requirements:**
- Correctly track nested block comments (`/* /* ... */ */`).
- Ignore comment syntax markers inside double-quoted string literals (`"..."`) and raw string literals (`r#"..."#`).
- Differentiate outer doc comments (`///`), inner doc comments (`//!`), and standard line comments (`//`).
- Strip prefix delimiters while preserving internal text structure.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub enum CommentKind {
>     Line,
>     InnerDoc,
>     OuterDoc,
>     Block,
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct CommentToken {
>     pub kind: CommentKind,
>     pub content: String,
>     pub line_number: usize,
> }
> 
> pub struct CommentLexer;
> 
> impl CommentLexer {
>     pub fn parse(input: &str) -> Vec<CommentToken> {
>         let mut tokens = Vec::new();
>         let chars: Vec<char> = input.chars().collect();
>         let len = chars.len();
>         let mut i = 0;
>         let mut line = 1;
> 
>         let mut in_string = false;
>         let mut in_raw_string = false;
> 
>         while i < len {
>             let ch = chars[i];
> 
>             if ch == '\n' {
>                 line += 1;
>                 i += 1;
>                 continue;
>             }
> 
>             // Toggle string state for standard string literals
>             if !in_raw_string && ch == '"' && (i == 0 || chars[i - 1] != '\\' || (i >= 2 && chars[i - 2] == '\\')) {
>                 in_string = !in_string;
>                 i += 1;
>                 continue;
>             }
> 
>             // Handle raw string literals r#"..."#
>             if !in_string && ch == 'r' && i + 1 < len && (chars[i + 1] == '"' || chars[i + 1] == '#') {
>                 let mut hash_count = 0;
>                 let mut idx = i + 1;
>                 while idx < len && chars[idx] == '#' {
>                     hash_count += 1;
>                     idx += 1;
>                 }
>                 if idx < len && chars[idx] == '"' {
>                     in_raw_string = true;
>                     i = idx + 1;
>                     while i < len {
>                         if chars[i] == '\n' {
>                             line += 1;
>                         }
>                         if chars[i] == '"' {
>                             let mut end_hashes = 0;
>                             let mut look_ahead = i + 1;
>                             while look_ahead < len && chars[look_ahead] == '#' && end_hashes < hash_count {
>                                 end_hashes += 1;
>                                 look_ahead += 1;
>                             }
>                             if end_hashes == hash_count {
>                                 i = look_ahead;
>                                 in_raw_string = false;
>                                 break;
>                             }
>                         }
>                         i += 1;
>                     }
>                     continue;
>                 }
>             }
> 
>             if in_string || in_raw_string {
>                 i += 1;
>                 continue;
>             }
> 
>             // Line comments & Doc comments
>             if ch == '/' && i + 1 < len && chars[i + 1] == '/' {
>                 let start_line = line;
>                 let is_doc = i + 2 < len;
>                 let (kind, prefix_len) = if is_doc && chars[i + 2] == '!' {
>                     (CommentKind::InnerDoc, 3)
>                 } else if is_doc && chars[i + 2] == '/' {
>                     if i + 3 < len && chars[i + 3] == '/' {
>                         (CommentKind::Line, 2)
>                     } else {
>                         (CommentKind::OuterDoc, 3)
>                     }
>                 } else {
>                     (CommentKind::Line, 2)
>                 };
> 
>                 let start_content = i + prefix_len;
>                 let mut end_content = start_content;
>                 while end_content < len && chars[end_content] != '\n' {
>                     end_content += 1;
>                 }
> 
>                 let raw_content: String = chars[start_content..end_content].iter().collect();
>                 let clean_content = if raw_content.starts_with(' ') {
>                     raw_content[1..].to_string()
>                 } else {
>                     raw_content
>                 };
> 
>                 tokens.push(CommentToken {
>                     kind,
>                     content: clean_content,
>                     line_number: start_line,
>                 });
> 
>                 i = end_content;
>                 continue;
>             }
> 
>             // Block comments with nesting support
>             if ch == '/' && i + 1 < len && chars[i + 1] == '*' {
>                 let start_line = line;
>                 let mut block_depth = 1;
>                 let start_content = i + 2;
>                 i += 2;
> 
>                 while i < len && block_depth > 0 {
>                     if chars[i] == '\n' {
>                         line += 1;
>                     }
>                     if chars[i] == '/' && i + 1 < len && chars[i + 1] == '*' {
>                         block_depth += 1;
>                         i += 2;
>                         continue;
>                     }
>                     if chars[i] == '*' && i + 1 < len && chars[i + 1] == '/' {
>                         block_depth -= 1;
>                         i += 2;
>                         if block_depth == 0 {
>                             let end_content = i - 2;
>                             let raw_content: String = chars[start_content..end_content].iter().collect();
>                             tokens.push(CommentToken {
>                                 kind: CommentKind::Block,
>                                 content: raw_content.trim().to_string(),
>                                 line_number: start_line,
>                             });
>                             break;
>                         }
>                         continue;
>                     }
>                     i += 1;
>                 }
>                 continue;
>             }
> 
>             i += 1;
>         }
> 
>         tokens
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_line_and_doc_comments() {
>         let code = r#"
> //! Inner module docs
> // Standard line comment
> /// Outer item doc
> pub fn foo() {}
> "#;
>         let tokens = CommentLexer::parse(code);
>         assert_eq!(tokens.len(), 3);
>         assert_eq!(tokens[0].kind, CommentKind::InnerDoc);
>         assert_eq!(tokens[0].content, "Inner module docs");
>         assert_eq!(tokens[0].line_number, 2);
> 
>         assert_eq!(tokens[1].kind, CommentKind::Line);
>         assert_eq!(tokens[1].content, "Standard line comment");
>         assert_eq!(tokens[1].line_number, 3);
> 
>         assert_eq!(tokens[2].kind, CommentKind::OuterDoc);
>         assert_eq!(tokens[2].content, "Outer item doc");
>         assert_eq!(tokens[2].line_number, 4);
>     }
> 
>     #[test]
>     fn test_nested_block_comments() {
>         let code = "/* Outer /* Inner */ Still outer */";
>         let tokens = CommentLexer::parse(code);
>         assert_eq!(tokens.len(), 1);
>         assert_eq!(tokens[0].kind, CommentKind::Block);
>         assert!(tokens[0].content.contains("Outer"));
>         assert!(tokens[0].content.contains("Inner"));
>     }
> 
>     #[test]
>     fn test_comments_inside_strings() {
>         let code = r#"
> let s = "// this is a string, not a comment";
> let raw = r#"/* string literal */"#;
> // Actual comment
> "#;
>         let tokens = CommentLexer::parse(code);
>         assert_eq!(tokens.len(), 1);
>         assert_eq!(tokens[0].kind, CommentKind::Line);
>         assert_eq!(tokens[0].content, "Actual comment");
>     }
> 
>     #[test]
>     fn test_token_matches() {
>         let code = "/// Outer doc";
>         let tokens = CommentLexer::parse(code);
>         assert!(!tokens.is_empty());
>         assert_ne!(tokens[0].kind, CommentKind::Line);
>         assert!(matches!(tokens[0].kind, CommentKind::OuterDoc));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Rust Comment Invariants & Scope Rules:**
>    - **Outer Doc (`///`)**: Sugar for `#[doc = "..."]`. Attaches to the item *immediately following* it (function, struct, enum, field).
>    - **Inner Doc (`//!`)**: Sugar for `#![doc = "..."]`. Attaches to the *enclosing item* (the crate root `lib.rs` or module scope).
>    - **Nested Block Comments**: Unlike C and C++ where standard block comments cannot nest, Rust supports arbitrary nesting depth of block comments (`/* /* nested */ */`). A counter state `block_depth` tracks depth levels.
> 2. **String Context State Machine:**
>    - The lexer maintains flags `in_string` and `in_raw_string` with delimiter counting (`#...#`) to prevent mistaking string contents (such as stringified URL paths `https://`) for code comment delimiters.
> 3. **Memory & Performance Tradeoffs:**
>    - Using slice pointers or character iteration allows single-pass scanning in $\mathcal{O}(N)$ time complexity, allocating strings only when emitting tokens.
>
> 
---

### Exercise 2: Microservice API Route Schema & Metadata Doc-Parser

**Scenario:**
In a microservices REST API gateway, backend developers annotate RPC handlers using Rust outer doc comments (`///`). The service documentation engine automatically extracts routing specifications, authentication requirements, and parameter definitions directly from these code comments to generate OpenAPI/Swagger schemas.

Structured metadata tags such as `@route METHOD /path`, `@security ROLE`, and `@param NAME TYPE DESC` are combined with standard Markdown text within doc blocks.

Implement an `ApiDocParser` that accepts a sequence of doc comment strings attached to an endpoint function.

**Requirements:**
1. Extract standard Markdown prose for the API handler description.
2. Parse `@route <HTTP_METHOD> <PATH>` into structured HTTP method and endpoint URI fields.
3. Parse `@security <ROLE>` into security policy requirements.
4. Extract `@param <NAME> <TYPE> <DESCRIPTION>` into structured `ParamDoc` parameter entries.
5. Reject inner module doc comments (`//!`) passed to item handler parsers with an explicit `ParseError::InnerDocNotAllowed`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub enum HttpMethod {
>     Get,
>     Post,
>     Put,
>     Delete,
>     Patch,
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct ParamDoc {
>     pub name: String,
>     pub param_type: String,
>     pub description: String,
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct ApiEndpointDoc {
>     pub title: String,
>     pub description: String,
>     pub route_method: HttpMethod,
>     pub route_path: String,
>     pub security_role: Option<String>,
>     pub params: Vec<ParamDoc>,
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum ParseError {
>     MissingRouteTag,
>     InvalidHttpMethod(String),
>     MalformedTag(String),
>     InnerDocNotAllowed,
> }
> 
> pub struct ApiDocParser;
> 
> impl ApiDocParser {
>     pub fn parse_endpoint(lines: &[&str]) -> Result<ApiEndpointDoc, ParseError> {
>         let mut title = String::new();
>         let mut desc_lines = Vec::new();
>         let mut route_method = None;
>         let mut route_path = String::new();
>         let mut security_role = None;
>         let mut params = Vec::new();
> 
>         for line in lines {
>             let trimmed = line.trim();
> 
>             if trimmed.starts_with("//!") {
>                 return Err(ParseError::InnerDocNotAllowed);
>             }
> 
>             let content = if trimmed.starts_with("///") {
>                 trimmed.trim_start_matches('/').trim()
>             } else if trimmed.starts_with("//") {
>                 trimmed.trim_start_matches('/').trim()
>             } else {
>                 trimmed
>             };
> 
>             if content.is_empty() {
>                 continue;
>             }
> 
>             if content.starts_with("@route") {
>                 let parts: Vec<&str> = content.split_whitespace().collect();
>                 if parts.len() < 3 {
>                     return Err(ParseError::MalformedTag(content.to_string()));
>                 }
>                 let method = match parts[1].to_uppercase().as_str() {
>                     "GET" => HttpMethod::Get,
>                     "POST" => HttpMethod::Post,
>                     "PUT" => HttpMethod::Put,
>                     "DELETE" => HttpMethod::Delete,
>                     "PATCH" => HttpMethod::Patch,
>                     other => return Err(ParseError::InvalidHttpMethod(other.to_string())),
>                 };
>                 route_method = Some(method);
>                 route_path = parts[2].to_string();
>             } else if content.starts_with("@security") {
>                 let parts: Vec<&str> = content.split_whitespace().collect();
>                 if parts.len() >= 2 {
>                     security_role = Some(parts[1].to_string());
>                 }
>             } else if content.starts_with("@param") {
>                 let parts: Vec<&str> = content.split_whitespace().collect();
>                 if parts.len() < 4 {
>                     return Err(ParseError::MalformedTag(content.to_string()));
>                 }
>                 let name = parts[1].to_string();
>                 let param_type = parts[2].to_string();
>                 let description = parts[3..].join(" ");
>                 params.push(ParamDoc {
>                     name,
>                     param_type,
>                     description,
>                 });
>             } else {
>                 if title.is_empty() {
>                     title = content.to_string();
>                 } else {
>                     desc_lines.push(content);
>                 }
>             }
>         }
> 
>         let method = route_method.ok_or(ParseError::MissingRouteTag)?;
> 
>         Ok(ApiEndpointDoc {
>             title,
>             description: desc_lines.join(" "),
>             route_method: method,
>             route_path,
>             security_role,
>             params,
>         })
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_valid_endpoint_doc_parsing() {
>         let doc_comments = vec![
>             "/// Process order transaction",
>             "/// Validates user balance and executes financial settlement.",
>             "/// @route POST /v1/orders",
>             "/// @security BearerToken",
>             "/// @param account_id u64 Unique customer account identifier",
>             "/// @param amount f64 Transaction value in USD",
>         ];
> 
>         let result = ApiDocParser::parse_endpoint(&doc_comments);
>         assert!(result.is_ok());
> 
>         let doc = result.unwrap();
>         assert_eq!(doc.title, "Process order transaction");
>         assert_eq!(doc.route_method, HttpMethod::Post);
>         assert_eq!(doc.route_path, "/v1/orders");
>         assert_eq!(doc.security_role, Some("BearerToken".to_string()));
>         assert_eq!(doc.params.len(), 2);
>         assert_eq!(doc.params[0].name, "account_id");
>         assert_eq!(doc.params[1].param_type, "f64");
>     }
> 
>     #[test]
>     fn test_missing_route_error() {
>         let doc_comments = vec![
>             "/// Handler without route tag",
>             "/// @param id u64 Account ID",
>         ];
>         let result = ApiDocParser::parse_endpoint(&doc_comments);
>         assert!(result.is_err());
>         assert_eq!(result.unwrap_err(), ParseError::MissingRouteTag);
>     }
> 
>     #[test]
>     fn test_inner_doc_rejection() {
>         let doc_comments = vec![
>             "//! Module-level inner doc comment",
>             "/// @route GET /health",
>         ];
>         let result = ApiDocParser::parse_endpoint(&doc_comments);
>         assert!(result.is_err());
>         assert!(matches!(result.unwrap_err(), ParseError::InnerDocNotAllowed));
>     }
> 
>     #[test]
>     fn test_http_method_match() {
>         let doc_comments = vec![
>             "/// Delete user account",
>             "/// @route DELETE /v1/users/:id",
>         ];
>         let doc = ApiDocParser::parse_endpoint(&doc_comments).unwrap();
>         assert_ne!(doc.route_method, HttpMethod::Get);
>         assert!(matches!(doc.route_method, HttpMethod::Delete));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Item-Level Doc Attributes (`///`) vs Module-Level (`//!`):**
>    - In Rust, `///` attaches to item declarations (like API handler functions), whereas `//!` attaches to the parent module scope. In an API documentation generator, attempting to parse `//!` on an individual function is a scope violation.
> 2. **Doc Normalization & Tag Extraction:**
>    - Rust doc comment processing strips up to one leading whitespace after `///`.
>    - Structured tags (`@route`, `@security`, `@param`) are parsed via token splitting while remaining text lines are concatenated into the Markdown endpoint summary.
> 3. **Error Handling & Failure Modes:**
>    - Handlers missing a valid `@route` tag return `Err(ParseError::MissingRouteTag)`. Malformed HTTP methods (e.g. `INVALID /path`) return `ParseError::InvalidHttpMethod`.
>
> 
---

### Exercise 3: Automated Doc-Test Extraction & Synthetic Harness Compiler Engine

**Scenario:**
Rust's built-in doc testing mechanism (`cargo test --doc`) parses code blocks inside `///` and `//!` doc comments to verify that code examples compile and execute successfully.

Crucially:
- Lines starting with `# ` (hash followed by space) within doc code blocks are compiled into the test binary, but are **hidden** from the rendered HTML documentation output generated by `cargo doc`.
- Test flags on code fence headers (such as ` ```rust,no_run `, ` ```should_panic `, ` ```compile_fail `) instruct `rustdoc` how to compile and evaluate the test.
- Code blocks without an explicit `fn main()` entrypoint must be dynamically wrapped in a synthetic harness function `fn main() -> Result<(), Box<dyn std::error::Error>>`.

Build a `DocTestExtractor` tool for an IDE documentation plugin or CI linter that parses doc comment blocks, extracts test cases, strips `# ` directives for documentation rendering while retaining them for binary generation, parses attribute flags, and constructs compilable test harness code.

**Requirements:**
1. Extract fenced code blocks (` ```rust ... ``` `) from item doc comment lines.
2. Separate rendered documentation code (with `# ` lines removed) from executable binary code (with `# ` lines stripped of `# ` and included).
3. Detect test attributes (`no_run`, `should_panic`, `compile_fail`, `ignore`).
4. Automatically wrap snippets that lack a `main` function in a synthetic `fn main() -> Result<(), Box<dyn std::error::Error>>` harness.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub enum TestAttribute {
>     Runnable,
>     NoRun,
>     ShouldPanic,
>     CompileFail,
>     Ignore,
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct DocTestCase {
>     pub id: String,
>     pub attribute: TestAttribute,
>     pub raw_doc_code: String,       // Rendered in cargo doc (hidden '#' lines stripped)
>     pub executable_code: String,    // Compiled in cargo test (hidden '#' setup lines included)
> }
> 
> pub struct DocTestExtractor;
> 
> impl DocTestExtractor {
>     pub fn extract(doc_id: &str, comments: &[&str]) -> Vec<DocTestCase> {
>         let mut test_cases = Vec::new();
>         let mut in_code_block = false;
>         let mut current_attr = TestAttribute::Runnable;
>         let mut raw_lines = Vec::new();
>         let mut exec_lines = Vec::new();
>         let mut test_counter = 0;
> 
>         for line in comments {
>             let trimmed = line.trim();
>             let content = if trimmed.starts_with("///") {
>                 trimmed.trim_start_matches('/').trim_start()
>             } else if trimmed.starts_with("//!") {
>                 trimmed.trim_start_matches('/').trim_start_matches('!').trim_start()
>             } else {
>                 trimmed
>             };
> 
>             if content.starts_with("```") {
>                 if in_code_block {
>                     in_code_block = false;
>                     test_counter += 1;
> 
>                     let exec_body = exec_lines.join("\n");
>                     let full_executable = if exec_body.contains("fn main()") || exec_body.contains("fn main() ->") {
>                         exec_body
>                     } else {
>                         format!(
>                             "fn main() -> Result<(), Box<dyn std::error::Error>> {{\n{}\n    Ok(())\n}}",
>                             exec_lines.iter().map(|l| format!("    {}", l)).collect::<Vec<_>>().join("\n")
>                         )
>                     };
> 
>                     test_cases.push(DocTestCase {
>                         id: format!("{}_doctest_{}", doc_id, test_counter),
>                         attribute: current_attr.clone(),
>                         raw_doc_code: raw_lines.join("\n"),
>                         executable_code: full_executable,
>                     });
> 
>                     raw_lines.clear();
>                     exec_lines.clear();
>                     current_attr = TestAttribute::Runnable;
>                 } else {
>                     in_code_block = true;
>                     let fence_args = content.trim_start_matches('`').trim();
>                     current_attr = if fence_args.contains("should_panic") {
>                         TestAttribute::ShouldPanic
>                     } else if fence_args.contains("no_run") {
>                         TestAttribute::NoRun
>                     } else if fence_args.contains("compile_fail") {
>                         TestAttribute::CompileFail
>                     } else if fence_args.contains("ignore") {
>                         TestAttribute::Ignore
>                     } else {
>                         TestAttribute::Runnable
>                     };
>                 }
>                 continue;
>             }
> 
>             if in_code_block {
>                 if content.starts_with('#') {
>                     let line_without_hash = if content.starts_with("# ") {
>                         &content[2..]
>                     } else {
>                         &content[1..]
>                     };
>                     exec_lines.push(line_without_hash.to_string());
>                 } else {
>                     raw_lines.push(content.to_string());
>                     exec_lines.push(content.to_string());
>                 }
>             }
>         }
> 
>         test_cases
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_doc_test_extraction_with_hidden_lines() {
>         let comments = vec![
>             "/// Adds two numbers.",
>             "///",
>             "/// # Examples",
>             "/// ```rust",
>             "/// # use std::collections::HashMap;",
>             "/// # let mut map = HashMap::new();",
>             "/// let result = 2 + 3;",
>             "/// assert_eq!(result, 5);",
>             "/// ```",
>         ];
> 
>         let cases = DocTestExtractor::extract("add_fn", &comments);
>         assert_eq!(cases.len(), 1);
> 
>         let test_case = &cases[0];
>         assert_eq!(test_case.id, "add_fn_doctest_1");
>         assert_eq!(test_case.attribute, TestAttribute::Runnable);
> 
>         // Raw doc code MUST NOT contain the hidden '#' setup lines
>         assert!(!test_case.raw_doc_code.contains("HashMap"));
>         assert!(test_case.raw_doc_code.contains("let result = 2 + 3;"));
> 
>         // Executable code MUST contain the setup lines and synthetic main wrapper
>         assert!(test_case.executable_code.contains("use std::collections::HashMap;"));
>         assert!(test_case.executable_code.contains("fn main() -> Result"));
>         assert!(test_case.executable_code.contains("assert_eq!(result, 5);"));
>     }
> 
>     #[test]
>     fn test_doc_test_attributes() {
>         let comments = vec![
>             "/// ```rust,should_panic",
>             "/// panic!(\"expected failure\");",
>             "/// ```",
>         ];
> 
>         let cases = DocTestExtractor::extract("panic_fn", &comments);
>         assert_eq!(cases.len(), 1);
>         assert_ne!(cases[0].attribute, TestAttribute::Runnable);
>         assert!(matches!(cases[0].attribute, TestAttribute::ShouldPanic));
>     }
> 
>     #[test]
>     fn test_explicit_main_handling() {
>         let comments = vec![
>             "/// ```rust",
>             "/// fn main() {",
>             "///     assert_eq!(1 + 1, 2);",
>             "/// }",
>             "/// ```",
>         ];
> 
>         let cases = DocTestExtractor::extract("custom_main", &comments);
>         assert_eq!(cases.len(), 1);
>         assert!(cases[0].executable_code.contains("fn main() {"));
>         assert!(!cases[0].executable_code.contains("Result<(), Box"));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Doc Test Compilation Mechanics:**
>    - `rustdoc` extracts code blocks enclosed in backticks (` ``` `). It compiles each test as a distinct temporary crate.
>    - The `# ` prefix allows developers to import dependencies (`# use my_crate::prelude::*;`) or perform setup without cluttering the documentation rendered in web browsers.
> 2. **Harness Generation & Entrypoint Detection:**
>    - If a code example contains its own `fn main()`, `rustdoc` compiles it directly. Otherwise, it wraps the snippet statements inside a synthetic `fn main()` block so that expressions like `assert_eq!(add(1, 2), 3);` compile as valid statements inside a function body.
> 3. **Fence Attribute Invariants:**
>    - Code block attributes control CI execution: `should_panic` expects a runtime panic, `no_run` compiles without executing, and `compile_fail` expects a compilation error.
>
> 
---

## 6. Related Terms


- [fn](fn.md) — Functions are the most common items that receive `///` doc comments.
- [`//!` (Inner Doc Comment)](../level_08/inner_doc_comment.md) — Related concept: `//!` (Inner Doc Comment).
- [Documentation Comments (`///`, `//!`)](../level_07/documentation_comments.md) — Doc comments for rustdoc.

---

## 7. Key Takeaways

- Use `//` for quick, internal notes to yourself or other developers.
- Use `/* */` for multi-line notes or for quickly disabling code.
- Use `///` right above a function, struct, or variable to officially document it.
- Use `//!` at the top of a file to officially document the entire file/module.
- Doc comments support Markdown and are compiled into websites using the `cargo doc` command.
