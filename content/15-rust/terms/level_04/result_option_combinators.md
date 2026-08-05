# `Result` and `Option` Combinators

> **Level 4 — Rust**
> Functional chaining methods (`map`, `and_then`, `or_else`, `map_err`, `unwrap_or_else`) for transforming error and optional values without manual pattern matching.

---

## 1. Prerequisites

**None.**

---


## 2. Term Category

**Functional Error Handling**: Combinator methods (`.map()`, `.and_then()`, `.unwrap_or()`, `.ok_or()`) for `Result` and `Option`.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Writing nested `match` statements to unpack `Option` and `Result` values produces deeply indented pyramid-of-doom code.

Functional Combinators (`.map()`, `.and_then()`, `.unwrap_or()`, `.ok_or()`) provide functional method-chaining pipelines. They allow transforming contained values, flattening nested option steps, providing default fallbacks, and converting between `Option` and `Result` fluently without manual pattern matching.

### (2) Reality Metaphor

An automated factory conveyor belt: raw items travel along a conveyor belt (`Option`/`Result`). Processing stations (`.map()`, `.and_then()`) transform the item if present; if missing, the item passes through safely to the end fallback station (`.unwrap_or()`).

### (3) Rust Code Examples

#### Short Snippet
```rust
let val: Option<i32> = Some(5);
let doubled: Option<i32> = val.map(|x| x * 2);
assert_eq!(doubled, Some(10));
```

#### Fuller Example
```rust
pub fn parse_and_double(s: &str) -> Option<i32> {
    s.trim()
        .parse::<i32>()
        .ok()
        .filter(|&x| x > 0)
        .map(|x| x * 2)
}

fn main() {
    assert_eq!(parse_and_double("  21 "), Some(42));
    assert_eq!(parse_and_double("-5"), None);
    assert_eq!(parse_and_double("abc"), None);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using `.map()` When `.and_then()` Is Required (Creating Nested `Option<Option<T>>`)

**The mistake:** Invoking `.map()` with a closure that returns another `Option` or `Result`.

**Why it is wrong:** Produces double-wrapped types `Option<Option<T>>`. Use `.and_then()` (flat_map) to flatten nested optional returns.

*Incorrect:*
```rust
opt.map(|x| find_user(x)); // Returns Option<Option<User>>!
```

*Fix:*
```rust
opt.and_then(|x| find_user(x)); // Returns Option<User>!
```

### Mistake 2: Using `.unwrap_or()` with Expensive Fallback Calculations

**The mistake:** Passing an expensive function call directly into `.unwrap_or(expensive_computation())`.

**Why it is wrong:** Arguments to `.unwrap_or()` are evaluated eagerly even if the `Option` is `Some`. Use `.unwrap_or_else(|| expensive())` for lazy evaluation.

*Incorrect:*
```rust
opt.unwrap_or(heavy_database_lookup()); // Evaluates every time!
```

*Fix:*
```rust
opt.unwrap_or_else(|| heavy_database_lookup()); // Evaluates lazily only when None!
```

### Mistake 3: Overusing `.unwrap()` Instead of Combinator Pipelines

**The mistake:** Calling `.unwrap()` on intermediate calculation steps.

**Why it is wrong:** Triggers runtime panics on missing values. Use `.map()`, `.and_then()`, or `?` operator.

*Incorrect:*
```rust
let val = parse().unwrap().get().unwrap();
```

*Fix:*
```rust
let val = parse().ok().and_then(|p| p.get());
```

---

## 5. Practice Exercises

### Exercise 1: Production User Account Email Verification Pipeline

**Scenario:** Build an asynchronous user validation pipeline `get_user_domain(raw_email: Option<&str>) -> Result<String, &'static str>` chaining `.ok_or()`, `.filter()`, and `.map()`.

**Requirements:**
1. Accept `Option<&str>`.
1. Use `.ok_or()` to convert to `Result`.
1. Filter for `@` character.
1. Extract domain via `.map()`.
1. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn get_user_domain(raw_email: Option<&str>) -> Result<String, &'static str> {
>     raw_email
>         .ok_or("Email is missing")
>         .map(|s| s.trim())
>         .filter(|s| s.contains('@'))
>         .ok_or("Invalid email format")
>         .and_then(|s| {
>             s.split('@')
>                 .nth(1)
>                 .map(|d| d.to_lowercase())
>                 .ok_or("Missing domain part")
>         })
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_combinator_pipeline() {
>         assert_eq!(get_user_domain(Some(" Alice@Example.com ")), Ok("example.com".into()));
>         assert_eq!(get_user_domain(Some("invalid_email")), Err("Invalid email format"));
>         assert_eq!(get_user_domain(None), Err("Email is missing"));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Chains `.ok_or()`, `.filter()`, `.map()`, and `.and_then()` to perform multi-stage validation fluently without nested `match` statements.

---

### Exercise 2: Fallback Config Reader with Lazy `.unwrap_or_else`

**Scenario:** Implement a configuration value resolver using lazy fallback `.unwrap_or_else`.

**Requirements:**
1. Query environment setting.
1. Fallback lazily to default config.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn resolve_port(env_port: Option<&str>) -> u16 {
>     env_port
>         .and_then(|s| s.parse::<u16>().ok())
>         .unwrap_or_else(|| 8080)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_resolve_port() {
>         assert_eq!(resolve_port(Some("9090")), 9090);
>         assert_eq!(resolve_port(Some("invalid")), 8080);
>         assert_eq!(resolve_port(None), 8080);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `.unwrap_or_else` provides lazy fallback evaluation.

---

### Exercise 3: Option to Result Conversion via `.ok_or_else`

**Scenario:** Convert an `Option<User>` into a `Result<User, DbError>` with dynamic error formatting.

**Requirements:**
1. Use `.ok_or_else()`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub struct User { pub id: u64 }
> 
> pub fn fetch_user_result(user_opt: Option<User>, id: u64) -> Result<User, String> {
>     user_opt.ok_or_else(|| format!("User ID {id} not found in database"))
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_ok_or_else() {
>         let res = fetch_user_result(None, 42);
>         assert_eq!(res.err().unwrap(), "User ID 42 not found in database");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Converts `Option` to `Result` with lazy error message generation.

---

## 5. Related Terms

**None.**

---


## 7. Key Takeaways

- Use `.map()` to transform contained values.
- Use `.and_then()` (flat_map) to flatten nested `Option<Option<T>>` or `Result` returns.
- Use `.unwrap_or_else()` for lazy fallback evaluation.
- Convert `Option` to `Result` using `.ok_or()` or `.ok_or_else()`.
