# Expressions vs. Statements

> **Level 1 — Rust**
> Rust's distinction between expressions (produce a value) and statements (perform an action without returning a value), and how it affects control flow and return values.

---

## 1. Prerequisites

- [Statements](statements.md) — Statements doing actions.
- [Expressions](expressions.md) — Expressions returning values.

---


## 2. Term Category

**Language Syntax**: Expressions (evaluating to values) versus Statements (executing instructions ending in `;`).

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Many languages separate statements (like `if` or `switch`) from expressions (like arithmetic operations), forcing verbose temporary variable assignments to capture conditional values.

In Rust, almost everything is an expression that evaluates to a value (including `if`, `match`, and block `{}` expressions). Statements are instructions ending with a semicolon `;` that discard the value and evaluate to the unit type `()`.

### (2) Reality Metaphor

A vending machine vs a trash incinerator: an expression is a vending machine—you insert tokens and it returns a cold beverage item; a statement is a trash incinerator ending in a semicolon—it consumes input and outputs nothing (`()`).

### (3) Rust Code Examples

#### Short Snippet
```rust
let val = if true { 10 } else { 20 }; // if expression evaluates directly to 10!
assert_eq!(val, 10);
```

#### Fuller Example
```rust
pub fn compute_grade(score: u32) -> &'static str {
    // Implicit block return expression (no semicolon!)
    if score >= 90 {
        "A"
    } else if score >= 80 {
        "B"
    } else {
        "C"
    }
}

fn main() {
    let grade = compute_grade(85);
    assert_eq!(grade, "B");
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Accidentally Adding a Semicolon `;` to Implicit Return Expressions

**The mistake:** Adding a semicolon `;` to the last line of a function or block intended to return a value.

**Why it is wrong:** Adding `;` converts the expression into a statement evaluating to `()`, causing type mismatch compilation errors.

*Incorrect:*
```rust
fn get_val() -> i32 { 42; } // Error: expected i32, found ()!
```

*Fix:*
```rust
fn get_val() -> i32 { 42 } // Omit semicolon to return value!
```

### Mistake 2: Mismatching Return Types Across `if`/`else` Expression Arms

**The mistake:** Returning an integer in the `if` branch and a string in the `else` branch of an `if` expression.

**Why it is wrong:** An `if`/`else` expression must evaluate to the exact same type across all execution arms.

*Incorrect:*
```rust
let x = if cond { 10 } else { "ten" }; // Type mismatch error!
```

*Fix:*
```rust
Ensure both arms evaluate to the same type: if cond { 10 } else { 20 }
```

### Mistake 3: Confusing Block Semicolons in `match` Arms

**The mistake:** Adding unnecessary semicolons inside multi-line `match` arm blocks.

**Why it is wrong:** Prevents the `match` arm from evaluating to the expected arm value.

*Incorrect:*
```rust
match x { 1 => { println!("1"); 10; }, _ => 20 }
```

*Fix:*
```rust
Omit final block semicolon to yield value: 1 => { println!("1"); 10 }
```

---

## 5. Practice Exercises

### Exercise 1: Expression-Based HTTP Status Code Resolver

**Scenario:** Build an HTTP status message resolver `resolve_status(code: u16) -> &'static str` using expression-based `match` arms without explicit `return` statements.

**Requirements:**
1. Implement `resolve_status` using `match` expression.
1. Omit explicit `return` keywords.
1. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn resolve_status(code: u16) -> &'static str {
>     match code {
>         200 => "OK",
>         404 => "Not Found",
>         500 => "Internal Server Error",
>         _ => "Unknown Status",
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_status_resolver() {
>         assert_eq!(resolve_status(200), "OK");
>         assert_eq!(resolve_status(404), "Not Found");
>         assert_eq!(resolve_status(999), "Unknown Status");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. The `match` block is an expression that evaluates directly to the string slice value.
> 2. Demonstrates idiomatic semicolon-free expression returns.

---

### Exercise 2: Block Expression Scoped Calculation

**Scenario:** Build a scoped math utility `calculate_tax(subtotal: f64, region: &str) -> f64` using block expressions `{ ... }` to encapsulate temporary variables.

**Requirements:**
1. Encapsulate tax rate calculation in a block expression.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn calculate_tax(subtotal: f64, region: &str) -> f64 {
>     let rate = {
>         if region == "CA" {
>             0.0725
>         } else if region == "NY" {
>             0.04
>         } else {
>             0.0
>         }
>     };
>     subtotal * rate
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_tax_calc() {
>         assert_eq!(calculate_tax(100.0, "CA"), 7.25);
>         assert_eq!(calculate_tax(100.0, "OR"), 0.0);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Assigns `let rate` directly from the result of an `if` block expression.

---

### Exercise 3: Loop Expression Value Return

**Scenario:** Demonstrate returning values from a `loop` expression using `break value;`.

**Requirements:**
1. Search array in `loop` and return found index via `break idx;`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn find_first_even(numbers: &[i32]) -> Option<usize> {
>     let mut i = 0;
>     loop {
>         if i >= numbers.len() {
>             break None;
>         }
>         if numbers[i] % 2 == 0 {
>             break Some(i);
>         }
>         i += 1;
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_loop_expression_return() {
>         let arr = [1, 3, 5, 6, 7];
>         assert_eq!(find_first_even(&arr), Some(3));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `loop` is an expression that yields a value via `break value;`.

---

## 5. Related Terms

- [Statements](statements.md) — Action statements.
- [Expressions](expressions.md) — Value-producing expressions.

---


## 7. Key Takeaways

- Expressions evaluate to values; statements execute instructions ending in `;`.
- Semicolons `;` suppress expression evaluation and yield the unit type `()`.
- `if`, `match`, and `{}` blocks are expressions in Rust.
- Omit the trailing semicolon on the last line of a function to return its value.
