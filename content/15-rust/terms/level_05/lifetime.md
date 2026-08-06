# Lifetime (`'a`)

> **Level 5 — Lifetimes**
> A compile-time annotation describing how long references remain valid relative to one another.

---

## 1. Prerequisites

- [Borrow Checker](../level_03/borrow_checker.md) — The static analysis engine that checks reference validity.
- [Borrowing (`&`)](../level_03/borrowing.md) — Creating non-owning references to existing data.
- [Dangling Reference](../level_03/dangling_reference.md) — The memory safety vulnerability that lifetime parameters prevent.

---

## 2. Term Category

**Rust-specific (the generic parameter for time)**: In most languages, memory safety is enforced by either a Garbage Collector (which tracks object lifetimes at runtime) or manual memory management (which risks dangling pointers). Rust takes a third path: **Lifetimes**. A lifetime is a generic parameter (like `'a`) that tells the compiler how the duration of one reference relates to another, allowing the compiler to guarantee memory safety at compile time without any runtime performance overhead.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Consider a function that takes two string slices and returns one of them:

```rust
// Which reference does the returned `&str` point to? x or y?
fn longest(x: &str, y: &str) -> &str {
    if x.len() > y.len() { x } else { y }
}
```

The Rust compiler needs to verify that the returned reference will not outlive the data it points to. But when compiling `longest`, the compiler doesn't know what concrete strings will be passed in at runtime! If `x` lives for 10 seconds and `y` lives for 2 seconds, how long does the returned reference live? 

To solve this without a garbage collector, Rust forces us to annotate generic lifetime parameters:

```rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}
```

This annotation states: *"The returned reference will live at least as long as the smaller of the lifetimes of `x` and `y`."* Now the borrow checker can verify callers statically at compile time!

### (2) Reality Metaphor

Imagine rental cars and car insurance policies.

- A **reference** is like a rented car key.
- The **underlying data** is the actual rental car.
- The **lifetime (`'a`)** is the expiration date stamped on your rental contract.

If you try to drive the car (dereference the pointer) after the contract expiration date (end of the data's lifetime), security shuts off the engine (the compiler throws a compile error). Lifetime annotations (`'a`) ensure that your rental contract is never longer than the rental company's lease on the car itself.

### (3) Rust Code Examples

#### Short Snippet (Explicit Lifetime Syntax)
Lifetime names start with an apostrophe `'` and are usually short lowercase letters like `'a`, `'b`.

```rust
// &'a str means a borrowed reference to a str that lives for lifetime 'a
// &'a mut i32 means a mutable reference to an i32 that lives for lifetime 'a

fn print_with_label<'a>(label: &'a str, value: i32) {
    println!("{label}: {value}");
}
```

#### Fuller Example (The `longest` Function)
```rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}

fn main() {
    let string1 = String::from("long string is long");
    let result;
    {
        let string2 = String::from("xyz");
        result = longest(string1.as_str(), string2.as_str());
        // result is valid here because both string1 and string2 are in scope
        println!("The longest string is {result}");
    }
    // If we tried to use `result` here outside the inner block, the compiler
    // would reject it because `string2` died at the end of the inner block!
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Lifetime Scoping and Lifecycle Rules

**The mistake:** Assuming Lifetime instances remain valid beyond their declaring scope block or returning references to local variables allocated within a function.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Returning a reference to data owned by the current stack frame causes compiler errors `E0515` / `E0106` because the underlying memory is freed when the function returns.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("lifetime_data");
    &s // Error E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("lifetime_data");
    s // Correct: transfer ownership of the String directly to caller
}
```

### Mistake 2: Over-Annotating Lifetimes on Functions Covered by Elision Rules

**The mistake:** Adding explicit `'a` parameters everywhere when Rust's lifetime elision rules already infer them automatically.

**Why it's wrong:** While technically correct, adding superfluous `'a` annotations clutter function signatures and obscure the API contract unnecessarily.

*Incorrect:*
```rust
fn first_word<'a>(s: &'a str) -> &'a str {
    s.split_whitespace().next().unwrap_or("")
}
```

*Fix:*
```rust
fn first_word(s: &str) -> &str {
    // Elision rule 1 & 2 infer: fn first_word<'a>(s: &'a str) -> &'a str
    s.split_whitespace().next().unwrap_or("")
}
```

### Mistake 3: Unnecessary Lifetime Coupling on Unrelated Input Parameters

**The mistake:** Binding two independent input reference parameters to the same lifetime `'a` when the returned value only borrows from one of them.

**Why it's wrong:** Coupling unrelated inputs to `'a` forces the compiler to restrict the returned reference lifetime to the intersection (minimum lifetime) of both inputs, causing unnecessary borrow check errors at caller sites.

*Incorrect:*
```rust
fn get_prefix<'a>(input: &'a str, _log_label: &'a str) -> &'a str {
    &input[..5] // Restricted to short-lived _log_label scope!
}
```

*Fix:*
```rust
fn get_prefix<'a, 'b>(input: &'a str, _log_label: &'b str) -> &'a str {
    &input[..5] // Decoupled: returned slice only depends on input lifetime 'a
}
```

---

## 5. Practice Exercises

### Exercise 1: High-Throughput Log Buffer Zero-Copy Token Extractor

**Scenario:** In real-time log ingestion systems, performance requires parsing log lines without dynamic heap allocations (`String::from`). A parser function receives a raw log line slice (`&str`) and extracts the severity token (e.g., `"[ERROR]"`) as a zero-copy sub-slice tied explicitly to the input buffer lifetime `'a`.

**Requirements:**
1. Define a `LogParseError` enum with variants `MissingBracket` and `EmptyInput`. Derive `Debug`, `Clone`, `PartialEq`, `Eq`.
2. Implement a function `extract_severity<'a>(log_line: &'a str) -> Result<&'a str, LogParseError>`.
3. Validate that `log_line` starts with `'['` and contains a closing `']'`.
4. Return a sub-slice `&'a str` containing the severity tag (including brackets) bound to input lifetime `'a`.
5. Write unit tests demonstrating zero-copy slice extraction, sub-scope lifetime validity, and error handling.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub enum LogParseError {
>     MissingBracket,
>     EmptyInput,
> }
> 
> pub fn extract_severity<'a>(log_line: &'a str) -> Result<&'a str, LogParseError> {
>     let trimmed = log_line.trim();
>     if trimmed.is_empty() {
>         return Err(LogParseError::EmptyInput);
>     }
>     if !trimmed.starts_with('[') {
>         return Err(LogParseError::MissingBracket);
>     }
>     let end_idx = trimmed.find(']').ok_or(LogParseError::MissingBracket)?;
>     Ok(&trimmed[..=end_idx])
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_extract_severity_success() {
>         let buffer = String::from("[ERROR] 2026-08-06 00:00:00 - Database timeout");
>         let severity = extract_severity(&buffer).unwrap();
>         assert_eq!(severity, "[ERROR]");
>     }
> 
>     #[test]
>     fn test_missing_bracket_error() {
>         let bad_log = "INFO: User logged in";
>         let err = extract_severity(bad_log);
>         assert_eq!(err, Err(LogParseError::MissingBracket));
>     }
> 
>     #[test]
>     fn test_lifetime_binding() {
>         let outer_buf = String::from("[WARN] Disk space low");
>         let tag: &str;
>         {
>             tag = extract_severity(&outer_buf).unwrap();
>         }
>         // tag remains valid here because outer_buf outlives inner block!
>         assert_eq!(tag, "[WARN]");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Zero-Copy Sub-Slice Borrowing (`&'a str`)**: The return type `Result<&'a str, LogParseError>` binds the lifetime of the returned slice `&'a str` directly to the input parameter `log_line: &'a str`. No memory is copied or allocated on the heap.
> 2. **Static Lifetime Contract Enforcement**: The borrow checker guarantees at compile time that callers cannot use the returned `&'a str` token after the underlying string `log_line` is dropped or mutated.
> 3. **Sub-slice Indexing Invariants**: Slicing `&trimmed[..=end_idx]` produces a string slice pointing to the exact bytes within `log_line`'s memory buffer, preserving UTF-8 alignment.

---

### Exercise 2: Multi-Buffer Text Disambiguator with Decoupled Lifetimes

**Scenario:** In network proxy routers, incoming HTTP request headers arrive from different network sockets. A header routing function inspects a primary request path buffer (`&'a str`) and a fallback default path buffer (`&'b str`), returning the active path slice bound to its respective input lifetime.

**Requirements:**
1. Implement a function `select_active_path<'a, 'b>(primary: &'a str, fallback: &'b str) -> Result<&'a str, &'b str>`.
2. If `primary` is non-empty and starts with `'/'`, return `Ok(primary)` bound to lifetime `'a`.
3. Otherwise, return `Err(fallback)` bound to lifetime `'b`.
4. Write unit tests demonstrating that caller scopes can hold different lifetimes for `primary` and `fallback` without borrow check conflicts.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn select_active_path<'a, 'b>(
>     primary: &'a str,
>     fallback: &'b str,
> ) -> Result<&'a str, &'b str> {
>     let trimmed = primary.trim();
>     if !trimmed.is_empty() && trimmed.starts_with('/') {
>         Ok(primary)
>     } else {
>         Err(fallback)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_select_primary_path() {
>         let primary = "/api/v1/users";
>         let fallback = "/health";
>         let res = select_active_path(primary, fallback);
>         assert_eq!(res, Ok("/api/v1/users"));
>     }
> 
>     #[test]
>     fn test_fallback_path_when_invalid() {
>         let primary = "invalid_path";
>         let fallback = "/fallback";
>         let res = select_active_path(primary, fallback);
>         assert_eq!(res, Err("/fallback"));
>     }
> 
>     #[test]
>     fn test_decoupled_lifetimes() {
>         let fallback_string = String::from("/default");
>         let selected: &str;
>         {
>             let primary_string = String::from("/v2/data");
>             // primary_string dies at end of block, but fallback_string survives
>             let res = select_active_path(&primary_string, &fallback_string);
>             assert_eq!(res, Ok("/v2/data"));
>         }
>         selected = select_active_path("", &fallback_string).unwrap_err();
>         assert_eq!(selected, "/default");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Decoupled Lifetime Parameters (`'a`, `'b`)**: Specifying two distinct lifetime parameters `'a` and `'b` informs the compiler that `primary` and `fallback` have independent lifetimes.
> 2. **Result Disambiguation**: Returning `Result<&'a str, &'b str>` ties the `Ok` variant exclusively to lifetime `'a` and the `Err` variant to lifetime `'b`. This allows callers to safely use the `Err` fallback reference even after the `primary` buffer has been dropped.
> 3. **Flexibility Over Intersection**: If both parameters were tied to `'a`, the compiler would force both inputs to share the minimum lifetime scope, needlessly restricting the lifespan of the fallback reference.

---

### Exercise 3: Zero-Allocation Configuration Search Engine

**Scenario:** Microservice configuration managers scan environment text blocks (`&'a str`) to extract sub-slices for configuration keys (`"DATABASE_URL="`, `"PORT="`). The search function returns the longer matching configuration value slice bound to the input buffer lifetime `'a`.

**Requirements:**
1. Define a `ConfigMatch<'a>` struct holding `pub key: &'a str` and `pub value: &'a str`. Derive `Debug`, `Clone`, `PartialEq`, `Eq`.
2. Implement a function `find_longest_config_val<'a>(env_data: &'a str, key1: &str, key2: &str) -> Option<ConfigMatch<'a>>`.
3. Scan `env_data` lines for `key1` and `key2`. Extract key and value sub-slices (`key=value`).
4. Compare value lengths and return the `ConfigMatch<'a>` containing the longer value bound to lifetime `'a`. Return `None` if neither key is present.
5. Write unit tests asserting correct lifetime binding, zero heap allocations, and key selection.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct ConfigMatch<'a> {
>     pub key: &'a str,
>     pub value: &'a str,
> }
> 
> pub fn find_longest_config_val<'a>(
>     env_data: &'a str,
>     key1: &str,
>     key2: &str,
> ) -> Option<ConfigMatch<'a>> {
>     let mut match1 = None;
>     let mut match2 = None;
> 
>     for line in env_data.lines() {
>         let trimmed = line.trim();
>         if let Some((k, v)) = trimmed.split_once('=') {
>             if k == key1 {
>                 match1 = Some(ConfigMatch { key: k, value: v });
>             } else if k == key2 {
>                 match2 = Some(ConfigMatch { key: k, value: v });
>             }
>         }
>     }
> 
>     match (match1, match2) {
>         (Some(m1), Some(m2)) => {
>             if m1.value.len() >= m2.value.len() {
>                 Some(m1)
>             } else {
>                 Some(m2)
>             }
>         }
>         (Some(m1), None) => Some(m1),
>         (None, Some(m2)) => Some(m2),
>         (None, None) => None,
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_find_longest_config() {
>         let config_text = "PORT=8080\nDATABASE_URL=postgres://user:pass@localhost:5432/db\nTIMEOUT=30";
>         let result = find_longest_config_val(config_text, "PORT", "DATABASE_URL");
>         assert!(result.is_some());
>         let m = result.unwrap();
>         assert_eq!(m.key, "DATABASE_URL");
>         assert_eq!(m.value, "postgres://user:pass@localhost:5432/db");
>     }
> 
>     #[test]
>     fn test_no_matching_keys() {
>         let config_text = "LOG_LEVEL=debug";
>         let result = find_longest_config_val(config_text, "PORT", "HOST");
>         assert_eq!(result, None);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Struct Lifetime Elision & Binding (`ConfigMatch<'a>`)**: Structs containing reference fields require explicit lifetime parameters (`ConfigMatch<'a>`). The struct instance cannot outlive the string data referenced by `key` and `value`.
> 2. **Input Sub-Slice Lifetime Propagation**: Function `find_longest_config_val` returns `Option<ConfigMatch<'a>>`, extending lifetime `'a` from `env_data` to both `key` and `value` fields in the returned struct.
> 3. **Search Key Decoupling**: Parameters `key1` and `key2` are passed as `&str` without lifetime `'a` because the search keys are only inspected during iteration and are not referenced in the returned `ConfigMatch<'a>`.

---

## 6. Related Terms

- [Lifetime Elision](lifetime_elision.md) — How Rust lets you omit `'a` in simple function signatures.
- [`'static` Lifetime](static_lifetime.md) — The special lifetime that lasts for the whole program execution.
- [Struct Lifetimes](struct_lifetimes.md) — Holding references inside structs.
- [Borrow Checker](../level_03/borrow_checker.md) — The static verifier enforcing lifetime constraints.
- [Dangling Reference](../level_03/dangling_reference.md) — Related concept: Dangling Reference.
- [Higher-Ranked Trait Bounds (HRTB)](higher_ranked_trait_bounds.md) — Related concept: Higher-Ranked Trait Bounds (HRTB).
- [Lifetime Bounds](lifetime_bounds.md) — Related concept: Lifetime Bounds.
- [Lifetime Variance](lifetime_variance.md) — Related concept: Lifetime Variance.
- [Non-Lexical Lifetimes (NLL)](non_lexical_lifetimes.md) — Related concept: Non-Lexical Lifetimes (NLL).
- [GATs (Generic Associated Types)](../level_14/gats.md) — Related concept: GATs (Generic Associated Types).

---

## 7. Key Takeaways

- Lifetimes (`'a`) describe relationships between the scopes of references at compile time.
- They do not change runtime behavior, performance, or lengthen variable lifespans.
- Functions returning references borrowed from input parameters require lifetime annotations if there is ambiguity.
- Lifetimes guarantee at compile time that no reference will ever point to freed or invalidated memory.
