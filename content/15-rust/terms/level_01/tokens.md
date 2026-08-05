# Tokens

> **Level 1 — Rust**
> The atomic lexical units of Rust source code: identifiers, literals, punctuation, and keywords that the compiler's lexer converts from raw text before parsing.

---

## 1. Prerequisites

**None.**

---


## 2. Term Category

**Compiler Fundamentals**: Lexical tokens (identifiers, keywords, literals, punctuation) produced by the compiler lexer.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Raw source code is a stream of uninterpreted characters. Compilers cannot perform type checking or syntax parsing directly on raw character strings.

Tokens are the fundamental lexical atomic units (identifiers `foo`, keywords `fn`, literals `42`, operators `+`) produced by the compiler lexer (`rustc_lexer`). They serve as the input for macro expansion (`macro_rules!`, `proc_macro`) and AST syntax tree construction.

### (2) Reality Metaphor

Words in a printed sentence: raw characters are ink spots on paper; tokens are individual recognized words, punctuation marks, and numbers parsed by a human reader.

### (3) Rust Code Examples

#### Short Snippet
```rust
// Tokens produced for `let x = 42;`: [Ident(let), Ident(x), Eq, Literal(42), Semi]
```

#### Fuller Example
```rust
pub fn count_identifiers_demo() -> &'static str {
    // Tokens processed by rustc lexer
    "Tokens are atomic lexical elements"
}

fn main() {
    assert_eq!(count_identifiers_demo(), "Tokens are atomic lexical elements");
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Confusing Raw String Literals with Lexical Identifiers in Macros

**The mistake:** Passing string literals `"x"` to macros expecting identifiers `$name:ident`.

**Why it is wrong:** Identifiers `x` and string literals `"x"` are completely distinct token types in the lexer.

*Incorrect:*
```rust
macro_rules! test { ($i:ident) => {} } test!("x"); // Token error!
```

*Fix:*
```rust
macro_rules! test { ($i:ident) => {} } test!(x); // Pass identifier!
```

### Mistake 2: Forgetting Token Boundary Constraints in Macro Expansion

**The mistake:** Concatenating raw identifiers without using `paste!` macro or token concatenation.

**Why it is wrong:** Tokens cannot be joined by simple string concatenation inside macro_rules!.

*Incorrect:*
```rust
macro_rules! make_fn { ($name:ident) => { fn fn_$name() {} } } // Syntax error!
```

*Fix:*
```rust
Use paste! crate or proc_macro for token concatenation!
```

### Mistake 3: Treating Reserved Keywords as Identifiers

**The mistake:** Attempting to name a variable using a reserved keyword (e.g. `let type = 5;`).

**Why it is wrong:** Keywords are reserved lexical tokens. Use raw identifiers (`r#type`) if mandatory.

*Incorrect:*
```rust
let type = "admin"; // Syntax error!
```

*Fix:*
```rust
let r#type = "admin"; // Raw identifier token syntax!
```

---

## 5. Practice Exercises

### Exercise 1: Simulated Lexer Token Classifier

**Scenario:** Build a simple token classifier function `classify_token(token: &str) -> &'static str` distinguishing keywords, numbers, and identifiers.

**Requirements:**
1. Classify `fn`, `let`, numbers, and identifiers.
1. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn classify_token(token: &str) -> &'static str {
>     match token {
>         "fn" | "let" | "mut" | "struct" | "enum" => "Keyword",
>         _ if token.chars().all(|c| c.is_ascii_digit()) => "NumericLiteral",
>         _ if token.starts_with('"') && token.ends_with('"') => "StringLiteral",
>         _ if token.chars().next().map_or(false, |c| c.is_alphabetic() || c == '_') => "Identifier",
>         _ => "OperatorOrPunctuation",
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_token_classification() {
>         assert_eq!(classify_token("fn"), "Keyword");
>         assert_eq!(classify_token("123"), "NumericLiteral");
>         assert_eq!(classify_token("my_var"), "Identifier");
>         assert_eq!(classify_token(""hello""), "StringLiteral");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Simulates lexical token classification executed by `rustc_lexer`.

---

### Exercise 2: Raw Identifier Token Handler

**Scenario:** Demonstrate using raw identifier syntax `r#struct` to use keywords as struct field names.

**Requirements:**
1. Define struct with `r#type` field.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub struct ConfigItem {
>     pub r#type: String,
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_raw_identifier() {
>         let item = ConfigItem { r#type: "JSON".into() };
>         assert_eq!(item.r#type, "JSON");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Raw identifiers `r#keyword` allow using reserved keyword tokens as field or variable names.

---

### Exercise 3: Token Stream Counter

**Scenario:** Build a token stream length counter splitting code strings into whitespace tokens.

**Requirements:**
1. Count whitespace tokens.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn count_tokens(code: &str) -> usize {
>     code.split_whitespace().count()
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_token_count() {
>         assert_eq!(count_tokens("let mut x = 42;"), 5);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Token streams form the basic unit of macro evaluation.

---

## 5. Related Terms

- [Token Stream](../level_12/token_stream.md) — Stream of compiler tokens.

---


## 7. Key Takeaways

- Tokens are atomic lexical elements (identifiers, keywords, literals, operators).
- Produced by `rustc_lexer` during the first phase of compilation.
- Input format for declarative (`macro_rules!`) and procedural macros.
- Use raw identifiers (`r#name`) to use reserved keywords as identifiers.
