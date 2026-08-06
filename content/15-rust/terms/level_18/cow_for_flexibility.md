# `Cow` for API Flexibility

> **Level 18 — Rust**
> Using `Cow<'_, str>` or `Cow<'_, [T]>` in APIs to accept both owned and borrowed data, cloning only when mutation is needed.

---

## 1. Prerequisites

- [`Cow<'a, T>`](../level_11/cow_t.md) — Cow smart pointer.

---

## 2. Term Category



**Rust Idiom Pattern (clone-on-write zero-copy flexibility)**: `std::borrow::Cow` (Copy-On-Write) for opportunistic borrowing.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Allocating memory on the heap for string transformations (like sanitizing HTML or unescaping strings) is expensive if 95% of inputs require no modification.

`Cow` (Copy-On-Write) is an enum (`Borrowed(&'a B)` vs `Owned(B::Owned)`) that allows borrowing data immutably zero-cost, allocating dynamic heap memory *only* when mutation occurs.

### (2) Reality Metaphor

A document editor previewing a manuscript: you read the original file directly from disk (Borrowed). The moment you type a single edit, the system creates a private working copy (Owned).

### (3) Rust Code Examples

#### Short Snippet
```rust
use std::borrow::Cow;
fn sanitize(s: &str) -> Cow<str> {
    if s.contains('<') { Cow::Owned(s.replace('<', "&lt;")) }
    else { Cow::Borrowed(s) }
}
```

#### Fuller Example
```rust
use std::borrow::Cow;

fn escape_html(input: &str) -> Cow<str> {
    if input.contains('<') || input.contains('>') {
        let mut s = String::with_capacity(input.len());
        for c in input.chars() {
            match c {
                '<' => s.push_str("&lt;"),
                '>' => s.push_str("&gt;"),
                _ => s.push(c),
            }
        }
        Cow::Owned(s)
    } else {
        Cow::Borrowed(input)
    }
}

fn main() {
    let clean = "hello_world";
    let res1 = escape_html(clean);
    assert!(matches!(res1, Cow::Borrowed(_)));
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Calling `.to_mut()` on `Cow` Unnecessarily

**The mistake:** Calling `.to_mut()` on a borrowed `Cow` when no modification is made.

**Why it is wrong:** Calling `.to_mut()` immediately clones the borrowed data into owned heap memory even if no edits are performed.

*Incorrect:*
```rust
let mut c = Cow::Borrowed("data"); c.to_mut(); // Clones data!
```

*Fix:*
```rust
let mut c = Cow::Borrowed("data"); if needs_edit { c.to_mut().push_str("!"); }
```

### Mistake 2: Forgetting `Cow` Implements `Deref`

**The mistake:** Writing explicit `match` blocks just to read `Cow` values.

**Why it is wrong:** `Cow` implements `Deref`, allowing transparent read access to methods on the underlying target (`str` or `[T]`).

*Incorrect:*
```rust
match cow { Cow::Borrowed(s) => s.len(), Cow::Owned(ref s) => s.len() }
```

*Fix:*
```rust
cow.len() // Automatic Deref coercion!
```

### Mistake 3: Using `Cow` for Always-Mutated Strings

**The mistake:** Using `Cow<str>` when function inputs are guaranteed to be transformed 100% of the time.

**Why it is wrong:** Introduces enum matching overhead without saving any allocations.

*Incorrect:*
```rust
fn always_transform(s: &str) -> Cow<str> { Cow::Owned(s.to_uppercase()) }
```

*Fix:*
```rust
fn always_transform(s: &str) -> String { s.to_uppercase() }
```

---

## 5. Practice Exercises

### Exercise 1: Zero-Copy HTTP Header Normalizer

**Scenario:** Build an HTTP header value normalizer that strips leading whitespace using `Cow<str>`.

**Requirements:**
1. Implement `normalize_header(val: &str) -> Cow<str>`.
1. Return `Cow::Borrowed` if already trimmed.
1. Return `Cow::Owned` if trimming occurs.
1. Include unit tests for borrowed vs owned variants.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::borrow::Cow;
> 
> pub fn normalize_header(val: &str) -> Cow<str> {
>     let trimmed = val.trim();
>     if trimmed.len() == val.len() {
>         Cow::Borrowed(val)
>     } else {
>         Cow::Owned(trimmed.to_string())
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_header_borrowed() {
>         let clean = "application/json";
>         let res = normalize_header(clean);
>         assert!(matches!(res, Cow::Borrowed(_)));
>         assert_eq!(res, "application/json");
>     }
> 
>     #[test]
>     fn test_header_owned() {
>         let dirty = "  text/html  ";
>         let res = normalize_header(dirty);
>         assert!(matches!(res, Cow::Owned(_)));
>         assert_eq!(res, "text/html");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `normalize_header` checks string length after trimming.
> 2. If no whitespace exists, it returns zero-allocation `Cow::Borrowed(val)`.
> 3. Allocates `String` heap memory only when trimming occurs.
> 
---

### Exercise 2: Zero-Copy SQL Identifier Escaper

**Scenario:** Implement a SQL column name escaper wrapping invalid characters in quotes.

**Requirements:**
1. Escape spaces in identifiers.
1. Return `Cow<str>`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::borrow::Cow;
> 
> pub fn escape_sql_identifier(id: &str) -> Cow<str> {
>     if id.contains(' ') || id.contains('-') {
>         Cow::Owned(format!("\"{}\"", id.replace('"', """")))
>     } else {
>         Cow::Borrowed(id)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_sql_escaper() {
>         let valid = "user_id";
>         let invalid = "user name";
>         assert!(matches!(escape_sql_identifier(valid), Cow::Borrowed(_)));
>         assert!(matches!(escape_sql_identifier(invalid), Cow::Owned(_)));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Avoids allocating heap memory for standard valid database identifier column names.
> 2. Allocates only when escaping spaces/hyphens.
> 
---

### Exercise 3: Opportunistic In-Place Array Mutation

**Scenario:** Implement a Copy-on-Write buffer `Cow<[i32]>` replacing negative numbers with zeros.

**Requirements:**
1. Accept `Cow<[i32]>`.
1. Replace negatives zero-copy where possible.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::borrow::Cow;
> 
> pub fn sanitize_signal(data: &[i32]) -> Cow<[i32]> {
>     if let Some(idx) = data.iter().position(|&x| x < 0) {
>         let mut owned = data.to_vec();
>         for val in &mut owned[idx..] {
>             if *val < 0 {
>                 *val = 0;
>             }
>         }
>         Cow::Owned(owned)
>     } else {
>         Cow::Borrowed(data)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_signal_sanitizer() {
>         let clean = [1, 2, 3];
>         let dirty = [1, -5, 3];
>         assert!(matches!(sanitize_signal(&clean), Cow::Borrowed(_)));
>         assert_eq!(sanitize_signal(&dirty)[1], 0);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Operates on slice `&[i32]` zero-copy if all signals are non-negative.
> 2. Clones into `Vec<i32>` only when a negative sample is encountered.
> 
---

## 6. Related Terms

- [`Cow<'a, T>`](../level_11/cow_t.md) — Clone-on-write pointer.
- [`ToOwned` Trait](../level_11/toowned_trait.md) — ToOwned trait.

---

## 7. Key Takeaways

- Provides Copy-On-Write opportunistic borrowing (`Cow::Borrowed` vs `Cow::Owned`).
- Reduces heap allocations in read-heavy string and slice workflows.
- Implements `Deref` for transparent access to underlying type methods.
- Use `.to_mut()` only when mutation is actually performed.
