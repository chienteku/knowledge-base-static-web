# Polonius (Next Borrow Checker)

> **Level 19 — Rust**
> The next-generation borrow checker with Datalog-based, more precise lifetime analysis that permits more programs than NLL while remaining sound.

---

## 1. Prerequisites

- [Borrow Checker](../level_03/borrow_checker.md) — Borrow checker rules.
- [Mir Mid Level Ir](mir_mid_level_ir.md) — MIR IR.

---


## 2. Term Category

**Borrow Checker Engine**: Polonius, the next-generation origin-based borrow checker.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Rust 2018 introduced Non-Lexical Lifetimes (NLL), which improved lifetime granularity. However, NLL still rejected certain safe patterns—particularly returning references from collections inside conditional branches (the 'get_or_insert' pattern).

Polonius is the next-generation borrow checker engine for `rustc`. Based on an origin-based model and Datalog facts, Polonius accurately tracks reference origins across control flow paths, eliminating false positive borrow check errors.

### (2) Reality Metaphor

A high-precision GPS tracking system monitoring individual delivery vehicle paths continuously, replacing rough neighborhood zone boundaries.

### (3) Rust Code Examples

#### Short Snippet
```rust
// Enable experimentally via: rustc -Zpolonius main.rs
```

#### Fuller Example
```rust
use std::collections::HashMap;

// Polonius accepts this safe pattern which NLL rejects:
fn get_or_insert(map: &mut HashMap<i32, String>, key: i32) -> &String {
    if let Some(val) = map.get(&key) {
        return val;
    }
    map.insert(key, String::from("default"));
    &map[&key]
}

fn main() {
    let mut map = HashMap::new();
    let val = get_or_insert(&mut map, 1);
    assert_eq!(val, "default");
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Expecting Polonius Active by Default on Stable

**The mistake:** Assuming Polonius is enabled in stable Rust releases.

**Why it is wrong:** Polonius is currently an experimental compiler flag (`-Zpolonius`).

*Incorrect:*
```rust
rustc main.rs
```

*Fix:*
```rust
rustc -Zpolonius main.rs (experimental nightly flag!)
```

### Mistake 2: Workaround Boilerplate for NLL Limits

**The mistake:** Writing redundant map lookups to satisfy current NLL borrow checker.

**Why it is wrong:** Current NLL requires double lookups in `if let Some(val) = map.get()` patterns; Polonius eliminates this.

*Incorrect:*
```rust
if map.contains_key(&k) { return &map[&k]; }
```

*Fix:*
```rust
Use Polonius or entry API `map.entry(k).or_insert(...)`!
```

### Mistake 3: Confusing Polonius Facts with Runtime Execution

**The mistake:** Assuming Polonius origin tracking adds runtime latency.

**Why it is wrong:** Polonius runs 100% during compilation; zero runtime performance impact.

*Incorrect:*
```rust
Runtime tracking overhead
```

*Fix:*
```rust
Polonius is a compile-time static analysis engine!
```

---

## 5. Practice Exercises

### Exercise 1: Polonius Get-or-Insert Map Pattern Simulator

**Scenario:** Demonstrate the get-or-insert pattern accepted by Polonius origin tracking.

**Requirements:**
1. Implement `get_or_insert_entry(map, key, default)` using Entry API.
1. Verify single-lookup behavior.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::HashMap;
> 
> pub fn get_or_insert_entry<'a>(
>     map: &'a mut HashMap<i32, String>,
>     key: i32,
>     default: &str,
> ) -> &'a String {
>     map.entry(key).or_insert_with(|| default.to_string())
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_get_or_insert() {
>         let mut map = HashMap::new();
>         let s = get_or_insert_entry(&mut map, 10, "fallback");
>         assert_eq!(s, "fallback");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Uses Entry API to safely work around NLL limitations on current stable Rust.
> 2. Polonius will accept the direct `if let` pattern natively.

---

### Exercise 2: Origin Fact Tuple Representation

**Scenario:** Simulate Datalog origin facts used by Polonius (`borrow_issued_at`, `loan_invalidated_at`).

**Requirements:**
1. Define `LoanFact` struct.
1. Check loan validity.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub struct LoanFact {
>     pub origin: &'static str,
>     pub point: u32,
> }
> 
> pub fn is_loan_active(facts: &[LoanFact], current_point: u32) -> bool {
>     facts.iter().any(|f| f.point <= current_point)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_loan_fact() {
>         let facts = vec![LoanFact { origin: "'a", point: 10 }];
>         assert!(is_loan_active(&facts, 15));
>         assert!(!is_loan_active(&facts, 5));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Demonstrates Datalog relational facts computed by Polonius.
> 2. Replaces AST region inference with precise point-based origins.

---

### Exercise 3: Conditional Reference Return Guard

**Scenario:** Simulate conditional reference return paths evaluated by Polonius.

**Requirements:**
1. Return reference conditionally.
1. Verify lifetime validity.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn choose_ref<'a>(flag: bool, a: &'a str, b: &'a str) -> &'a str {
>     if flag { a } else { b }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_choose_ref() {
>         let x = "first";
>         let y = "second";
>         assert_eq!(choose_ref(true, x, y), "first");
>         assert_eq!(choose_ref(false, x, y), "second");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Validates conditional reference origin paths.
> 2. Modeled natively by Polonius origin tracking.

---

## 5. Related Terms

- [Borrow Checker](../level_03/borrow_checker.md) — Borrow checker.
- [Non-Lexical Lifetimes (NLL)](../level_05/non_lexical_lifetimes.md) — NLL lifetime model.

---


## 7. Key Takeaways

- Polonius is the next-generation origin-based borrow checker for `rustc`.
- Eliminates NLL false positive errors (e.g. `get_or_insert` patterns).
- Uses Datalog relational facts for precise origin tracking across control flow.
- Currently accessible via experimental `-Zpolonius` nightly flag.
