# Turbofish (`::<>`)

> **Level 6 — Closures & Functional Patterns**
> Explicit type annotation for generic functions/methods: `iter.collect::<Vec<_>>()`.

---

## 1. Prerequisites


- [Generics (`<T>`)](../level_04/generics.md) — The feature that requires this syntax.
- [Type Inference](../level_01/type_inference.md) — The system that usually saves you from needing this syntax.
- [Collecting](../level_02/collecting.md) — The method that requires this syntax the most frequently.

---

## 2. Term Category

**Rust Syntax Mechanic (explicit generic parameterization)**: The **Turbofish** operator (`::<...>`) is an explicit syntax operator in Rust used to specify generic type parameters directly on method or function calls in expression position (e.g. `parse::<i32>()` or `collect::<Vec<_>>()`) when Hindley-Milner type inference cannot unambiguously determine target types.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In Rust expression syntax, angle brackets `<T>` are ambiguous. When rustc parses `a < b > c`, it interprets `<` and `>` as relational less-than/greater-than operators.

To disambiguate generic type parameterization on function and method calls from comparison operations, Rust requires the double-colon prefix: `::<T>`.

### (2) When Turbofish is Required

Type inference works bidirectionally, but fails when calling methods with **polymorphic return types**:

1. **`Iterator::collect`**: `fn collect<B: FromIterator<Self::Item>>(self) -> B`. Because `collect` can construct `Vec`, `HashSet`, `LinkedList`, or `String`, rustc requires explicit type targets: `.collect::<Vec<_>>()`.
2. **`str::parse`**: `fn parse<F: FromStr>(&self) -> Result<F, F::Err>`. Parsing string `"42"` can produce `i32`, `u64`, or `f64`, requiring `.parse::<i32>()`.
3. **Generic Factory Constructor**: Functions like `std::mem::size_of::<T>()` or `Vec::<u8>::with_capacity(10)`.

### (3) Reality Metaphor

- **Type Inference**: You walk up to a soda fountain with a cup labeled "Cola". You don't need to specify what drink you want—the machine sees the label on your cup and fills it with Cola.
- **Turbofish (`::<>`)**: You hand the barista an unlabelled blank container (`let items = iter.collect()`). The barista cannot guess what beverage you want, so you must explicitly instruct them: `::<IcedLatte>` (`::<Vec<String>>`).

### (4) Rust Code Examples

#### Disambiguating Polymorphic Collections and Parsers
```rust
use std::collections::HashSet;

fn main() {
    // 1. Turbofish on .parse()
    let port = "8080".parse::<u16>().expect("Invalid port");
    assert_eq!(port, 8080);

    // 2. Turbofish on .collect() with type wildcard `_`
    let numbers = vec![1, 2, 2, 3];
    let unique_set = numbers.into_iter().collect::<HashSet<_>>();
    assert_eq!(unique_set.len(), 3);

    // 3. Freestanding generic function parameterization
    let byte_size = std::mem::size_of::<u64>();
    assert_eq!(byte_size, 8);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Placing the Turbofish Operator After Parentheses `parse()<i32>`

**The mistake:** Writing `raw.parse()<i32>` instead of `raw.parse::<i32>()`.

**Why it is wrong:** `::<>` must immediately follow the function or method identifier *before* call parentheses. Placing `<...>` after `()` triggers syntax error `E0308` / parser errors.

*Incorrect:*
```rust
let val = "42".parse()<i32>; // ❌ Syntax Error!
```

*Fix:*
```rust
let val = "42".parse::<i32>(); // Correct!
```

### Mistake 2: Specifying Over-Verbose Full Types when Using Wildcard `_`

**The mistake:** Explicitly writing out complex generic type parameters inside Turbofish when rustc can infer element types automatically.

**Why it is wrong:** Increases code clutter. Use `_` wildcard to let rustc infer element types while you specify only the outer container.

*Verbose:*
```rust
let items: Vec<TransactionHeader> = stream.collect::<Vec<TransactionHeader>>();
```

*Idiomatic:*
```rust
let items = stream.collect::<Vec<_>>(); // Clean and concise!
```

### Mistake 3: Adding Turbofish to Non-Generic Methods

---

## 5. Practice Exercises

### Exercise 1: HTTP API Config Payload Parser

**Scenario:** Build a config parser `parse_network_config(port_str: &str, ips: &[&str]) -> Result<(u16, std::collections::HashSet<String>), String>` that uses `parse::<u16>()` and `.collect::<HashSet<_>>()` to validate network setup strings.

**Requirements:**
1. Parse `port_str` into `u16` using Turbofish `parse::<u16>()`.
2. Collect `ips` into `HashSet<String>` using `.collect::<HashSet<_>>()`.
3. Return tuple `(u16, HashSet<String>)`.
4. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::HashSet;
> 
> pub fn parse_network_config(
>     port_str: &str,
>     ips: &[&str],
> ) -> Result<(u16, HashSet<String>), String> {
>     let port = port_str.parse::<u16>().map_err(|e| e.to_string())?;
>     let ip_set = ips.iter().map(|&s| s.to_string()).collect::<HashSet<_>>();
>     
>     Ok((port, ip_set))
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_network_config_turbofish() {
>         let (port, ips) = parse_network_config("443", &["10.0.0.1", "10.0.0.2"]).unwrap();
>         assert_eq!(port, 443);
>         assert!(ips.contains("10.0.0.1"));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `port_str.parse::<u16>()` uses Turbofish to specify integer target type.
> 2. `collect::<HashSet<_>>()` specifies `HashSet` container while using `_` for element type inference.

---

### Exercise 2: Generic Resource Allocator using `Default::default::<T>()` & `Vec::<T>::with_capacity()`

**Scenario:** Implement a buffer manager `allocate_buffer<T: Default>(capacity: usize) -> Vec<T>` that uses `Vec::<T>::with_capacity()` to pre-allocate memory buffers.

**Requirements:**
1. Use `Vec::<T>::with_capacity(capacity)`.
2. Populate buffer with `T::default()`.
3. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn allocate_buffer<T: Default>(capacity: usize) -> Vec<T> {
>     let mut buf = Vec::<T>::with_capacity(capacity);
>     for _ in 0..capacity {
>         buf.push(T::default());
>     }
>     buf
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_allocate_buffer_turbofish() {
>         let nums = allocate_buffer::<i32>(5);
>         assert_eq!(nums, vec![0, 0, 0, 0, 0]);
>         assert_eq!(nums.capacity(), 5);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `Vec::<T>::with_capacity` passes type argument `T` to generic vector constructor.
> 2. Avoids re-allocations by pre-allocating exact element capacity.

---

### Exercise 3: Collecting Result Streams via `Result<Vec<_>, _>` Turbofish

**Scenario:** Implement a batch record processor `parse_all(records: &[&str]) -> Result<Vec<i32>, String>` that parses a slice of numeric strings using `.collect::<Result<Vec<_>, _>>()`.

**Requirements:**
1. Parse slice into `Result<Vec<i32>, _>` using Turbofish.
2. Short-circuit on first parse error.
3. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn parse_all(records: &[&str]) -> Result<Vec<i32>, String> {
>     records
>         .iter()
>         .map(|s| s.parse::<i32>().map_err(|e| e.to_string()))
>         .collect::<Result<Vec<_>, _>>()
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_result_collect_turbofish() {
>         let valid = vec!["10", "20", "30"];
>         assert_eq!(parse_all(&valid), Ok(vec![10, 20, 30]));
>         
>         let invalid = vec!["10", "bad", "30"];
>         assert!(parse_all(&invalid).is_err());
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `.collect::<Result<Vec<_>, _>>()` transposes an iterator of `Result` items into a single `Result` containing a collected `Vec`.
> 2. Short-circuits on the first `Err` encountered.

---

## 6. Related Terms


- [Type Inference](../level_01/type_inference.md) — The incredibly smart system that usually saves you from ever needing to use the Turbofish.
- [Collecting](../level_02/collecting.md) — The specific iterator method that requires the Turbofish most frequently in Rust.

---

## 7. Key Takeaways

- Turbofish syntax is `::<Type>` placed before call parentheses on methods and functions.
- Used to specify generic type parameters when type inference cannot determine polymorphic return types (e.g. `.collect()`, `.parse()`).
- Use the `_` wildcard (e.g. `::<Vec<_>>`) to let rustc infer element types automatically.
- Essential for transposing iterator `Result` streams into `Result<Vec<_>, _>`.
