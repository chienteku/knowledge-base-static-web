# Scope and Shadowing

> **Level 1 — Rust**
> Lexical scoping rules in Rust where variables are valid within their block, and shadowing allows re-binding the same name to a new value or type in an inner scope.

---

## 1. Prerequisites

- [Variable](variable.md) — Variable bindings.

---


## 2. Term Category

**Variable Lifetimes**: Lexical scope `{}` bounds and variable shadowing (`let x = x + 1`).

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Reusing temporary variable names after type conversions in other languages requires creating ugly artificial names (like `str_val`, `int_val`, `parsed_val`).

Rust scope defines the lexical lifetime bounded by `{}` where variables exist before being dropped. Variable Shadowing allows declaring a new variable with the exact same name (`let x = ...`), allowing type transformations or mutations while maintaining clean variable names.

### (2) Reality Metaphor

Layering tracing paper over a drawing grid: placing a new sheet of paper directly over a sketch allows drawing a refined version with the same label name, hiding the sheet beneath it.

### (3) Rust Code Examples

#### Short Snippet
```rust
let x = 5;
let x = x + 1; // Variable Shadowing!
let x = "now a string"; // Type transformation!
assert_eq!(x, "now a string");
```

#### Fuller Example
```rust
pub fn parse_input_port(raw: &str) -> Result<u16, &'static str> {
    let raw = raw.trim(); // Shadowing with cleaned &str
    let raw: u16 = raw.parse().map_err(|_| "Invalid number")?; // Shadowing with u16
    Ok(raw)
}

fn main() {
    let port = parse_input_port(" 8080 ").unwrap();
    assert_eq!(port, 8080);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Confusing Variable Shadowing (`let x`) with Variable Mutation (`x = ...`)

**The mistake:** Attempting to mutate an immutable variable without the `let` keyword.

**Why it is wrong:** Without `let`, Rust treats `x = val` as a mutation attempt on an existing binding, failing if `x` was not declared `let mut`.

*Incorrect:*
```rust
let x = 5; x = x + 1; // Error: cannot mutate immutable variable!
```

*Fix:*
```rust
let x = 5; let x = x + 1; // Correct variable shadowing with `let`!
```

### Mistake 2: Expecting Inner Block Shadowed Variables to Persist Out of Scope

**The mistake:** Shadowing a variable inside a `{}` block and expecting the inner variable value to persist outside.

**Why it is wrong:** Inner scope variables drop when the block ends. The outer variable binding resumes visibility.

*Incorrect:*
```rust
let x = 1; { let x = 2; } assert_eq!(x, 2); // Fails! x is 1 outside block!
```

*Fix:*
```rust
let x = 1; let x = { let x = 2; x }; // Assign block output!
```

### Mistake 3: Unintended Variable Shadowing Hiding Outer Variables

**The mistake:** Accidentally re-declaring `let item` inside a loop, shadowing an outer variable of the same name.

**Why it is wrong:** Hides outer variable bindings, creating subtle logic bugs.

*Incorrect:*
```rust
let total = 0; for x in vec { let total = x; } // Outer total remains 0!
```

*Fix:*
```rust
let mut total = 0; for x in vec { total += x; }
```

---

## 5. Practice Exercises

### Exercise 1: Multi-Stage Input Data Sanitizer with Variable Shadowing

**Scenario:** Build an API request parser `parse_user_id(input: &str) -> Option<u64>` using variable shadowing to clean, validate, and parse user IDs.

**Requirements:**
1. Shadow `input` by trimming whitespace.
1. Shadow `input` by stripping prefix `user_`.
1. Shadow `input` by parsing into `u64`.
1. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn parse_user_id(input: &str) -> Option<u64> {
>     let input = input.trim();
>     let input = input.strip_prefix("user_")?;
>     let input: u64 = input.parse().ok()?;
>     Some(input)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_variable_shadowing_parser() {
>         assert_eq!(parse_user_id("  user_42  "), Some(42));
>         assert_eq!(parse_user_id("invalid"), None);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Uses variable shadowing (`let input = ...`) to perform sequential type and format transformations cleanly using a single variable name.

---

### Exercise 2: Scoped Resource Lock Guard

**Scenario:** Demonstrate Lexical Scope `{}` dropping temporary resource guards early.

**Requirements:**
1. Create scoped block `{}`.
1. Verify resource drop on block exit.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub struct ScopeGuard {
>     pub active: bool,
> }
> 
> pub fn test_scope_cleanup() -> bool {
>     let mut flag = false;
>     {
>         let _g = ScopeGuard { active: true };
>         flag = _g.active;
>     } // _g drops here!
>     flag
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_scope_dropping() {
>         assert!(test_scope_cleanup());
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Lexical scope `{}` forces RAII drop execution upon block exit.

---

### Exercise 3: Type Re-Binding Shadowing Utility

**Scenario:** Demonstrate changing variable type from `&str` to `Vec<String>` via `let` shadowing.

**Requirements:**
1. Accept comma separated `&str`.
1. Shadow with `Vec<&str>`.
1. Shadow with `Vec<String>`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn process_tags(raw: &str) -> Vec<String> {
>     let raw: Vec<&str> = raw.split(',').map(|s| s.trim()).collect();
>     let raw: Vec<String> = raw.into_iter().map(|s| s.to_uppercase()).collect();
>     raw
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_type_shadowing() {
>         let tags = process_tags("rust, async, web");
>         assert_eq!(tags, vec!["RUST", "ASYNC", "WEB"]);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Shadowing allows re-using variable names across type transformations.

---

## 5. Related Terms

- [Hygiene](../level_12/hygiene.md)
- [Shadowing](shadowing.md) — Re-declaring variables in scope.

---


## 7. Key Takeaways

- Lexical scopes `{}` bound variable lifetimes.
- Variables drop automatically when leaving their scope block.
- Shadowing (`let x = ...`) allows declaring a new variable with the same name.
- Shadowing allows type transformations without inventing artificial variable names.
