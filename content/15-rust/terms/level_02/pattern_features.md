# Advanced Pattern Features

> **Level 2 — Rust**
> The extended `match` sub-grammar: match guards (`if cond`), `@` bindings, or-patterns (`A | B`), range patterns, `ref`, and `...` rest patterns.

---

## 1. Prerequisites

**None.**

---


## 2. Term Category

**Pattern Matching**: Advanced pattern matching features (guards `if`, `@` bindings, `..` rest patterns, `|` or-patterns).

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Writing nested `if`/`else` chains to destructure complex enums, tuples, structs, and ranges leads to verbose, error-prone code.

Rust Pattern Matching provides powerful pattern syntax: `@` bindings (binding matched values to names while testing patterns), Match Guards (`if condition`), `..` rest patterns (ignoring remaining fields/elements), and Or-Patterns (`A | B`).

### (2) Reality Metaphor

A mail sorting facility: sorting packages into bins based on size ranges (1..=5 kg), assigning tracking labels to matched items (`item @ 1..=5`), and checking weather conditions (`if weather_ok`).

### (3) Rust Code Examples

#### Short Snippet
```rust
let msg = Some(42);
if let Some(val @ 40..=50) = msg {
    assert_eq!(val, 42);
}
```

#### Fuller Example
```rust
#[derive(Debug, PartialEq)]
pub enum Command {
    Move { x: i32, y: i32 },
    Write(String),
    Quit,
}

pub fn inspect_command(cmd: &Command) -> String {
    match cmd {
        Command::Move { x, y } if *x == 0 && *y == 0 => "Origin".into(),
        Command::Move { x, .. } => format!("Move X={x}"),
        Command::Write(msg) => format!("Write: {msg}"),
        Command::Quit => "Quit".into(),
    }
}

fn main() {
    let c = Command::Move { x: 0, y: 0 };
    assert_eq!(inspect_command(&c), "Origin");
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Match Guard Side Effects Overriding Pattern Exhaustiveness

**The mistake:** Relying on Match Guards `if cond` for enum exhaustiveness without providing a fallback arm.

**Why it is wrong:** The compiler cannot evaluate runtime match guard conditions at compile time, requiring an un-guarded fallback arm to satisfy exhaustiveness.

*Incorrect:*
```rust
match opt { Some(x) if x > 0 => 1 } // Error: non-exhaustive match!
```

*Fix:*
```rust
match opt { Some(x) if x > 0 => 1, _ => 0 } // Add fallback arm!
```

### Mistake 2: Forgetting `@` Binding Captures the Whole Value

**The mistake:** Attempting to test range bounds while also capturing the variable without `@`.

**Why it is wrong:** Without `@`, testing range `1..=10` prevents capturing the integer value into a variable name.

*Incorrect:*
```rust
match val { 1..=10 => val } // Error: val is not bound!
```

*Fix:*
```rust
match val { n @ 1..=10 => n } // Use @ binding!
```

### Mistake 3: Multiple `..` Rest Operators in the Same Slice Pattern

**The mistake:** Using multiple `..` rest patterns in a single slice match `[a, .., b, ..]`.

**Why it is wrong:** Ambiguous syntax; compiler cannot determine how many elements belong to each rest pattern.

*Incorrect:*
```rust
match slice { [first, .., middle, ..] => {} } // Ambiguous error!
```

*Fix:*
```rust
Use exactly one `..` rest pattern per slice match: [first, .., last]
```

---

## 5. Practice Exercises

### Exercise 1: HTTP Request Packet Matcher with Advanced Patterns

**Scenario:** Build an API request router `route_request(status: u16, path: &str) -> &'static str` using OR patterns `|`, match guards `if`, and `@` range bindings.

**Requirements:**
1. Match `200 | 201 | 202` as Success.
1. Use `@` binding for client error ranges `err @ 400..=499`.
1. Use match guard for path checking.
1. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn route_request(status: u16, path: &str) -> String {
>     match status {
>         200 | 201 | 202 => format!("Success: {path}"),
>         err @ 400..=499 if path.starts_with("/api") => format!("API Client Error {err}"),
>         err @ 400..=499 => format!("General Client Error {err}"),
>         500..=599 => "Server Error".into(),
>         _ => "Unknown".into(),
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_pattern_routing() {
>         assert_eq!(route_request(200, "/index"), "Success: /index");
>         assert_eq!(route_request(404, "/api/users"), "API Client Error 404");
>         assert_eq!(route_request(403, "/admin"), "General Client Error 403");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Uses OR-pattern `200 | 201 | 202`.
> 2. Uses `@` range binding `err @ 400..=499` with match guard `if path.starts_with(...)`.

---

### Exercise 2: Slice Rest Pattern Destructuring Utility

**Scenario:** Build a slice parser `extract_head_and_tail(slice: &[i32]) -> Option<(i32, i32, &[i32])>` extracting first, last, and middle rest slice using `[first, middle @ .., last]`.

**Requirements:**
1. Use slice destructuring pattern `[first, middle @ .., last]`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn extract_head_and_tail(slice: &[i32]) -> Option<(i32, i32, &[i32])> {
>     match slice {
>         [first, middle @ .., last] => Some((*first, *last, middle)),
>         _ => None,
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_slice_patterns() {
>         let arr = [10, 20, 30, 40];
>         let (first, last, mid) = extract_head_and_tail(&arr).unwrap();
>         assert_eq!(first, 10);
>         assert_eq!(last, 40);
>         assert_eq!(mid, &[20, 30]);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Slice pattern `[first, middle @ .., last]` extracts head, tail, and middle subslice zero-copy.

---

### Exercise 3: Struct Partial Destructuring with `..` Rest Operator

**Scenario:** Destructure a `Point3D` struct capturing `x` and ignoring `y` and `z` using `Point3D { x, .. }`.

**Requirements:**
1. Destructure struct fields with `..`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub struct Point3D { pub x: i32, pub y: i32, pub z: i32 }
> 
> pub fn get_x(p: &Point3D) -> i32 {
>     match p {
>         Point3D { x, .. } => *x,
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_struct_rest_pattern() {
>         let p = Point3D { x: 5, y: 10, z: 15 };
>         assert_eq!(get_x(&p), 5);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Struct rest pattern `..` ignores unreferenced fields cleanly.

---

## 5. Related Terms

**None.**

---


## 7. Key Takeaways

- `@` bindings bind matched values to variable names (`val @ 1..=5`).
- Match Guards (`if condition`) add runtime boolean predicate checks to match arms.
- Or-patterns (`A | B`) match multiple alternative patterns in a single arm.
- `..` rest pattern ignores remaining slice elements or struct fields.
