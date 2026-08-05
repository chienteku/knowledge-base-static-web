# Lifetime Elision

> **Level 5 — Lifetimes**
> Deterministic compiler rules that infer lifetimes in common function signatures to reduce boilerplate.

---

## 1. Prerequisites


- [Lifetime (`'a`)](lifetime.md) — The fundamental concept being automatically inferred.
- [`fn` (Functions)](../level_01/fn.md) — The declarations where elision rules apply.
- [Method](../level_02/method.md) — Methods with `&self` or `&mut self` have dedicated elision rules.

---

## 2. Term Category

**Compiler Feature (syntactic sugar for lifetimes)**: Lifetime Elision refers to the set of deterministic rules built into the Rust compiler (`rustc`) that automatically infer lifetime parameters in function and method signatures. This allows developers to omit explicit `'a` lifetime annotations in approximately 90% of routine function declarations without sacrificing compile-time memory safety guarantees.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In early Rust design, every function accepting or returning references required explicit lifetime generic declarations:

```rust
// Verbose explicit lifetime syntax required in early Rust
fn first_word<'a>(s: &'a str) -> &'a str { ... }
fn print_val<'a>(x: &'a i32) { ... }
```

As the Rust standard library expanded, language designers observed that virtually all function signatures followed three unambiguous lifetime patterns. Requiring explicit annotations in predictable contexts created visual noise and hindered readability.

The Rust team codified these deterministic patterns into **The 3 Lifetime Elision Rules**. The compiler automatically applies these rules during type checking. If the rules unambiguously determine all output lifetimes, the function compiles cleanly. If ambiguity remains, the compiler stops and requests explicit lifetime annotations.

### (2) The 3 Lifetime Elision Rules

When `rustc` analyzes a function signature without explicit lifetime annotations, it executes the following steps in sequence:

1. **Rule 1 (Input Lifetimes):** Each parameter that is a reference gets its own unique lifetime parameter.
   - `fn foo(x: &i32, y: &i32)` $\rightarrow$ `fn foo<'a, 'b>(x: &'a i32, y: &'b i32)`
2. **Rule 2 (Single Input Lifetime):** If there is exactly **one** input lifetime parameter (whether explicit or elided), that lifetime is assigned to **all** output reference parameters.
   - `fn first_word(s: &str) -> &str` $\rightarrow$ `fn first_word<'a>(s: &'a str) -> &'a str`
3. **Rule 3 (Method `&self` / `&mut self`):** If there are multiple input lifetime parameters, but one of them is `&self` or `&mut self`, the lifetime of `self` is assigned to **all** output reference parameters.
   - `impl Struct { fn get_part(&self, query: &str) -> &str }` $\rightarrow$ assigns `&self`'s lifetime to the returned slice!

> [!NOTE]
> **Crucial Rule Exception**: Lifetime elision applies **only** to function and method signatures. Struct and enum definitions holding reference fields can **never** elide lifetimes (`struct Foo<'a> { part: &'a str }`).

### (3) Reality Metaphor

A bank transaction desk:
- When a customer walks up alone to the window and hands over a check (`Rule 2`), the teller knows without asking that the receipt issued belongs to that specific customer.
- When an authorized corporate account officer (`&self`) presents documents alongside multiple assistant IDs (`Rule 3`), the issued stamped approval automatically defaults to the corporate officer's authority.
- Only when two unrelated customers step up simultaneously presenting conflicting documents without an account manager present does the teller pause and demand explicit written authorization.

### (4) Rust Code Examples

#### Short Snippet (Elided vs Fully Expanded)
```rust
// What you write (Elided syntax):
fn trim_whitespace(input: &str) -> &str {
    input.trim()
}

// What rustc expands it to (Rule 2):
fn trim_whitespace<'a>(input: &'a str) -> &'a str {
    input.trim()
}
```

#### Method Elision (Rule 3)
```rust
struct RequestHeader {
    raw_header: String,
}

impl RequestHeader {
    // Rule 3: Output &str automatically inherits the lifetime of &self!
    fn find_value(&self, key: &str) -> Option<&str> {
        if self.raw_header.contains(key) {
            Some(&self.raw_header)
        } else {
            None
        }
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Expecting Elision when Returning a Reference from Multiple Input References

**The mistake:** Writing a function taking multiple reference arguments and returning a reference without explicit lifetimes.

**Why it is wrong:** Rule 1 assigns distinct lifetimes (`'a`, `'b`) to each input parameter. Rule 2 does not apply because there are multiple inputs. Rule 3 does not apply because there is no `&self`. The compiler cannot guess which input reference the output borrows from, resulting in error `E0106`.

*Incorrect:*
```rust
fn pick_longer(s1: &str, s2: &str) -> &str { // ❌ Error E0106: missing lifetime specifier
    if s1.len() > s2.len() { s1 } else { s2 }
}
```

*Fix:*
```rust
fn pick_longer<'a>(s1: &'a str, s2: &'a str) -> &'a str { // Explicit lifetime annotation!
    if s1.len() > s2.len() { s1 } else { s2 }
}
```

### Mistake 2: Attempting to Use Lifetime Elision in Struct Field Definitions

**The mistake:** Omitting lifetime parameters when declaring a struct that stores reference fields.

**Why it is wrong:** Lifetime elision rules apply strictly to `fn` signatures, not type definitions. Struct fields holding references require explicit lifetime parameters so the layout and type system can enforce field validity bounds.

*Incorrect:*
```rust
struct UserSession {
    token: &str, // ❌ Error E0106: missing lifetime specifier
}
```

*Fix:*
```rust
struct UserSession<'a> {
    token: &'a str, // Explicit lifetime required on struct fields!
}
```

### Mistake 3: Misapplying Method Rule 3 When Output Borrows from an Argument Instead of `&self`

**The mistake:** Relying on Rule 3 when a method returns a reference derived from an input argument rather than `self`.

**Why it is wrong:** Rule 3 automatically binds the output lifetime to `&self`. If the returned slice actually borrows from an argument `other: &'a str`, returning it violates `&self`'s lifetime if `other` has a different lifespan.

*Incorrect:*
```rust
struct Inspector;

impl Inspector {
    // Rule 3 binds return to &self! But we are returning a slice of `input`!
    fn echo_input<'a>(&self, input: &'a str) -> &'a str {
        input // Explicit &'a override needed so return isn't bound to &self
    }
}
```

---

## 5. Practice Exercises

### Exercise 1: Web Request Bearer Token Extractor (Rule 2)

**Scenario:** Implement an HTTP authorization header parser `extract_bearer_token(header: &str) -> Option<&str>` that extracts the token string slice following `"Bearer "`. Verify that lifetime elision Rule 2 correctly infers the returned slice's lifetime.

**Requirements:**
1. Check if the string slice starts with `"Bearer "`.
2. Return `Some(&str)` containing the token, or `None` if invalid.
3. Write unit tests demonstrating zero-copy slice extraction.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn extract_bearer_token(header: &str) -> Option<&str> {
>     let prefix = "Bearer ";
>     if header.starts_with(prefix) {
>         Some(header[prefix.len()..].trim())
>     } else {
>         None
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_bearer_token_elision() {
>         let auth_header = String::from("Bearer eyJhbGciOiJIUzI1NiJ9");
>         let token = extract_bearer_token(&auth_header);
>         assert_eq!(token, Some("eyJhbGciOiJIUzI1NiJ9"));
>     }
> 
>     #[test]
>     fn test_invalid_header() {
>         assert_eq!(extract_bearer_token("Basic 12345"), None);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Function parameter `header: &str` has a single input reference.
> 2. By Rule 2, `rustc` assigns the input lifetime `'a` to the output `Option<&'a str>`.
> 3. The returned string slice is a zero-copy view of `auth_header`.

---

### Exercise 2: Multi-Source Config Selector with Explicit Annotations

**Scenario:** Implement a configuration resolver function `resolve_setting<'a>(primary: &'a str, fallback: &'a str, override_flag: bool) -> &'a str`. Because there are multiple input references, explain why elision fails and provide explicit annotations.

**Requirements:**
1. Return `primary` if `override_flag` is true, otherwise `fallback`.
2. Annotate parameters with explicit lifetime `'a`.
3. Write unit tests testing both selection branches.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn resolve_setting<'a>(primary: &'a str, fallback: &'a str, override_flag: bool) -> &'a str {
>     if override_flag {
>         primary
>     } else {
>         fallback
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_config_selector() {
>         let env_config = String::from("env_db_host");
>         let default_config = String::from("localhost");
>         
>         let res1 = resolve_setting(&env_config, &default_config, true);
>         assert_eq!(res1, "env_db_host");
>         
>         let res2 = resolve_setting(&env_config, &default_config, false);
>         assert_eq!(res2, "localhost");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Rule 1 assigns distinct lifetimes to `primary` and `fallback`.
> 2. Rule 2 does not apply because there are 2 input reference parameters (plus a boolean).
> 3. Explicit `'a` lifetime parameter binds both inputs and the output to a common intersecting lifetime.

---

### Exercise 3: Method Lifetime Elision in Zero-Copy Tokenizer

**Scenario:** Create a zero-copy string tokenizer struct `Lexer<'a>` holding a buffer reference `&'a str`. Implement methods `next_token(&mut self) -> Option<&'a str>` and demonstrate how method elision works and when explicit overrides are required.

**Requirements:**
1. Define `struct Lexer<'a> { input: &'a str }`.
2. Implement method `fn next_word(&mut self) -> Option<&'a str>` returning words from `input`.
3. Write unit tests verifying token extraction.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub struct Lexer<'a> {
>     pub input: &'a str,
> }
> 
> impl<'a> Lexer<'a> {
>     pub fn new(input: &'a str) -> Self {
>         Self { input }
>     }
> 
>     // We explicitly return &'a str (borrowed from input buffer), NOT bound to &mut self!
>     pub fn next_word(&mut self) -> Option<&'a str> {
>         self.input = self.input.trim_start();
>         if self.input.is_empty() {
>             return None;
>         }
>         let end = self.input.find(char::is_whitespace).unwrap_or(self.input.len());
>         let word = &self.input[..end];
>         self.input = &self.input[end..];
>         Some(word)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_lexer_method_lifetimes() {
>         let text = String::from("rust lifetime elision");
>         let mut lexer = Lexer::new(&text);
>         
>         let w1 = lexer.next_word().unwrap();
>         let w2 = lexer.next_word().unwrap();
>         
>         assert_eq!(w1, "rust");
>         assert_eq!(w2, "lifetime");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. By default, Method Rule 3 would tie the output slice to `&mut self`.
> 2. Returning `Option<&'a str>` explicitly disconnects the returned slice lifetime from `&mut self` and connects it to the underlying string buffer `'a`, allowing multiple tokens to be collected while mutating the lexer state.

---

## 6. Related Terms


- [Lifetime (`'a`)](lifetime.md) — The syntax being elided.
- [Struct Lifetimes](struct_lifetimes.md) — Note: Struct definitions **do not** support lifetime elision; `struct Foo<'a>` must always be explicit.
- [Higher-Ranked Trait Bounds (HRTB)](higher_ranked_trait_bounds.md) — For advanced closures where lifetimes apply for *all* calls.

---

## 7. Key Takeaways

- Lifetime elision is a set of 3 deterministic compiler rules, not magic guessing.
- Rule 1: Each input reference gets a distinct lifetime parameter.
- Rule 2: Single input reference $\rightarrow$ all output references get that same lifetime.
- Rule 3: Methods with `&self` or `&mut self` $\rightarrow$ output references get `self`'s lifetime.
- Struct and enum field definitions can **never** elide lifetimes.
