# Functions (`fn`)

> **Level 1 — Rust**
> Named reusable blocks of code declared with `fn`, accepting typed parameters and optionally returning a value via an expression tail or explicit `return`.

---

## 1. Prerequisites

- [fn](fn.md) — fn keyword syntax.

---

## 2. Term Category



**Rust Core Construct (first-class callable abstractions)**: Functions declared via `fn` keywords with explicit argument types and return signatures.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Unstructured code blocks lead to massive duplication and poor testability.

Functions (`fn`) encapsulate reusable computational units. Rust enforces explicit parameter typing and explicit return types (`-> T`) to guarantee static type safety and enable fast, modular compilation.

### (2) Reality Metaphor

A specialized kitchen appliance: a food processor accepts specific input ingredients (parameters), performs processing inside, and delivers a consistent output dish (return value).

### (3) Rust Code Examples

#### Short Snippet
```rust
fn add(a: i32, b: i32) -> i32 {
    a + b
}
```

#### Fuller Example
```rust
pub fn calculate_discount(price: f64, discount_pct: f64) -> Result<f64, &'static str> {
    if discount_pct < 0.0 || discount_pct > 100.0 {
        return Err("Invalid discount percentage");
    }
    Ok(price * (1.0 - discount_pct / 100.0))
}

fn main() {
    let final_price = calculate_discount(100.0, 20.0).unwrap();
    assert_eq!(final_price, 80.0);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting Return Type Signature when Returning Values

**The mistake:** Omitting `-> T` in function signature when the function body yields a value.

**Why it is wrong:** Functions without `-> T` return unit `()`. Returning a value causes compilation failure.

*Incorrect:*
```rust
fn get_five() { 5 } // Compiler Error!
```

*Fix:*
```rust
fn get_five() -> i32 { 5 } // Add -> i32 return type!
```

### Mistake 2: Mismatching Semicolons on Early Return Statements

**The mistake:** Writing `return x` on early exit without a semicolon `;`.

**Why it is wrong:** Early return statements require semicolons `;`.

*Incorrect:*
```rust
if cond { return 10 }
```

*Fix:*
```rust
if cond { return 10; } // Add semicolon to early return statement!
```

### Mistake 3: Passing Arguments by Value Unexpectedly Moving Ownership

**The mistake:** Taking parameters by value `fn process(s: String)` when only reading is needed.

**Why it is wrong:** Moves ownership from caller to function, rendering variables unusable in caller scope.

*Incorrect:*
```rust
fn print_val(s: String) { println!("{s}"); }
```

*Fix:*
```rust
fn print_val(s: &str) { println!("{s}"); } // Take reference!
```

---

## 5. Practice Exercises

### Exercise 1: User Authorization Function with Generic Result Output

**Scenario:** Build an authorization function `authorize_access(role: &str, resource: &str) -> Result<bool, &'static str>` validating security roles.

**Requirements:**
1. Accept string slice parameters `&str`.
1. Validate role and resource permissions.
1. Return `Result<bool, &'static str>`.
1. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn authorize_access(role: &str, resource: &str) -> Result<bool, &'static str> {
>     if role.is_empty() || resource.is_empty() {
>         return Err("Role and resource cannot be empty");
>     }
>     match (role, resource) {
>         ("Admin", _) => Ok(true),
>         ("User", "Public") => Ok(true),
>         ("User", "Private") => Ok(false),
>         _ => Ok(false),
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_authorization_function() {
>         assert_eq!(authorize_access("Admin", "Private"), Ok(true));
>         assert_eq!(authorize_access("User", "Private"), Ok(false));
>         assert!(authorize_access("", "Public").is_err());
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Enforces explicit input type signatures `&str` and fallible return signature `Result<bool, &'static str>`.
> 
---

### Exercise 2: Infallible Math Calculation Function

**Scenario:** Build a temperature conversion function `celsius_to_fahrenheit(c: f64) -> f64`.

**Requirements:**
1. Accept `f64`.
1. Return `f64`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn celsius_to_fahrenheit(c: f64) -> f64 {
>     (c * 9.0 / 5.0) + 32.0
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_celsius_conversion() {
>         assert_eq!(celsius_to_fahrenheit(0.0), 32.0);
>         assert_eq!(celsius_to_fahrenheit(100.0), 212.0);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Pure mathematical function.
> 
---

### Exercise 3: Function Accepting Closure Callback

**Scenario:** Implement a function `apply_twice<F>(val: i32, f: F) -> i32` applying a function twice.

**Requirements:**
1. Accept generic closure `F: Fn(i32) -> i32`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn apply_twice<F>(val: i32, f: F) -> i32
> where
>     F: Fn(i32) -> i32,
> {
>     f(f(val))
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_apply_twice() {
>         assert_eq!(apply_twice(5, |x| x + 1), 7);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Higher-order function taking closure parameter.
> 
---

## 6. Related Terms

- [fn](fn.md) — fn keyword.
- [Expressions](expressions.md) — Function body tail expressions.

---

## 7. Key Takeaways

- Functions declared with `fn` keyword require explicit parameter and return types.
- Omit semicolon on the last line for implicit return expression.
- Use `return` keyword for early conditional exits.
- Pass parameters by reference `&T` to prevent moving ownership unnecessarily.
