# Documentation Comments (`///`, `//!`)

> **Level 7 — Rust**
> Markdown-supporting doc comments that `rustdoc` parses to generate HTML documentation: `///` for item docs, `//!` for module/crate-level docs, with embedded runnable examples.

---

## 1. Prerequisites

- [Comments](../level_01/comments.md) — Standard comments vs doc comments /// and //!.
- [Attributes (`#[...]`)](attributes.md) — Doc comments desugar to #[doc = '...'] attributes.

---

## 2. Term Category

**Documentation Tooling (API documentation generator hook)**: Outer `///` (attaching to subsequent items) and inner `//!` (attaching to enclosing crate/module files) are special comments parsed by `rustdoc` to produce HTML documentation. Embedded code blocks in doc comments automatically run as unit tests during `cargo test`.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In traditional software development, external API documentation sites quickly become outdated as code changes.

Rust embeds documentation directly into source files using Markdown:
- **`///` (Outer Doc Comment)**: Placed directly above structs, functions, enums, or modules. Documents the item immediately below it.
- **`//!` (Inner Doc Comment)**: Placed at the top of a file or module root. Documents the enclosing container (the whole module or crate).
- **Doctests**: Any Rust code enclosed in ` ``` ` block fences inside `///` comments is compiled and executed by `cargo test` as an automated integration test, guaranteeing that documentation examples never drift out of sync with code!

### (2) Reality Metaphor

An interactive user manual: reading the instruction guide for an appliance, where pressing a button on the printed paper manual actually operates the live device.

### (3) Rust Code Examples

#### Crate Root & Item Documentation with Doctests
```rust
//! # Math Utilities Crate
//!
//! Provides arithmetic calculation helpers.

/// Adds two integers together.
///
/// # Examples
///
/// ```
/// use my_crate::add;
/// assert_eq!(add(2, 3), 5);
/// ```
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

fn main() {
    assert_eq!(add(10, 20), 30);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Confusing Inner Doc Comments (`//!`) with Outer Doc Comments (`///`)

**The mistake:** Placing outer `///` comments at the top of a file expecting it to document the entire module.

**Why it is wrong:** `///` attaches to the next code item following it. At the top of a file, `rustdoc` attaches `///` to the first function or struct, leading to misplaced module documentation. Use `//!` at the top of a file.

*Incorrect:*
```rust
/// Module documentation at top of file (Attaches to next struct!)
```

*Fix:*
```rust
//! Module documentation describing the enclosing module file!
```

### Mistake 2: Writing Non-Compiling Code Snippets inside Doctest Fences

**The mistake:** Writing invalid Rust pseudocode inside ` /// ``` ` doc comment blocks.

**Why it is wrong:** `cargo test` extracts and compiles all doc comment code blocks. Non-compiling code causes test suite failures. Mark pseudocode with ` /// ```ignore ` or ` /// ```no_run `.

---

## 5. Practice Exercises

### Exercise 1: Doctest Code Snippet Extractor Simulator

**Scenario:** Implement a helper function `extract_doctests(doc_lines: &[&str]) -> Vec<String>` parsing code fences inside doc comments.

**Requirements:**
1. Extract lines between ` ``` ` fences.
2. Return vector of extracted code blocks.
3. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn extract_doctests(doc_lines: &[&str]) -> Vec<String> {
>     let mut in_block = false;
>     let mut current_block = String::new();
>     let mut blocks = Vec::new();
> 
>     for line in doc_lines {
>         let trimmed = line.trim_start_matches("///").trim_start_matches("//!").trim();
>         if trimmed.starts_with("```") {
>             if in_block {
>                 blocks.push(current_block.trim().to_string());
>                 current_block.clear();
>                 in_block = false;
>             } else {
>                 in_block = true;
>             }
>         } else if in_block {
>             current_block.push_str(trimmed);
>             current_block.push('\n');
>         }
>     }
>     blocks
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_extract_doctest() {
>         let comments = vec![
>             "/// Adds two numbers",
>             "/// ```",
>             "/// assert_eq!(2 + 2, 4);",
>             "/// ```",
>         ];
>         let tests = extract_doctests(&comments);
>         assert_eq!(tests.len(), 1);
>         assert_eq!(tests[0], "assert_eq!(2 + 2, 4);");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Simulates `rustdoc` extracting doc comment code blocks for automated compilation and test execution.
> 2. Prevents documentation drift.

---

### Exercise 2: Doc Comment Section Header Validator

**Scenario:** Write a function `validate_doc_sections(doc: &str) -> bool` verifying that public API doc comments contain `# Examples` headers.

**Requirements:**
1. Check if string contains `# Examples`.
2. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn validate_doc_sections(doc: &str) -> bool {
>     doc.contains("# Examples")
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_doc_section_validation() {
>         let good_doc = "/// Multiplies numbers\n///\n/// # Examples\n/// ```\n/// assert!(true);\n/// ```";
>         assert!(validate_doc_sections(good_doc));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Ensures documentation adheres to Rust community API guideline standards (`# Examples`, `# Errors`, `# Panics`).

---

### Exercise 3: Module Root Inner Doc Comment Generator

**Scenario:** Implement `format_crate_header(crate_name: &str, description: &str) -> String` generating top-level `//!` module comments.

**Requirements:**
1. Format `//! # Crate Name\n//! Description`.
2. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn format_crate_header(crate_name: &str, description: &str) -> String {
>     format!("//! # {crate_name}\n//!\n//! {description}")
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_crate_header_formatting() {
>         let header = format_crate_header("CryptoCore", "High-performance cryptography primitives.");
>         assert!(header.starts_with("//! # CryptoCore"));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Inner doc comments `//!` document the enclosing crate or file module scope.

---

## 5. Related Terms

- [Comments](../level_01/comments.md) — Related concept: Comments.

---

## 7. Key Takeaways

- `///` (outer doc comment) documents the item immediately following it.
- `//!` (inner doc comment) documents the enclosing file or module container.
- Embedded code blocks inside doc comments are automatically compiled and tested during `cargo test`.
- Use Markdown section headers (`# Examples`, `# Errors`, `# Panics`) for clear documentation structure.
