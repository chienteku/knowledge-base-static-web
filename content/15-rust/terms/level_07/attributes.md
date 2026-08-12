# Attributes (`#[...]`)

> **Level 7 — Rust**
> Metadata annotations applied to items, expressions, or crates using `#[attr]` (outer) or `#![attr]` (inner) syntax to control compilation, derive traits, or configure tooling.

---

## 1. Prerequisites

- [Tokens](../level_01/tokens.md) — Syntactic attribute tokens #[...] and #![...].

---

## 2. Term Category

**Language Feature (compiler metadata annotations)**: Attributes in Rust are metadata annotations prefixed with `#[...]` (outer attributes applying to the following item) or `#![...]` (inner attributes applying to the enclosing file or crate) that instruct `rustc` and Cargo on conditional compilation, linting rules, trait derivations, and FFI linkages.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

System compilers need instructions beyond executable logic:
- Which target architectures should compile specific function bodies (`#[cfg]`)?
- Which standard traits should be automatically generated (`#[derive]`)?
- Should compiler warnings be suppressed or treated as errors (`#[allow]`, `#[deny]`)?
- How should functions be inlined by LLVM (`#[inline]`)?

Rust's attribute system provides a unified syntax for communicating metadata to `rustc` and procedural macro attributes without cluttering code with proprietary pragmas or preprocessor directives.

### (2) Outer (`#[...]`) vs Inner (`#![...]`) Attributes

1. **Outer Attributes (`#[...]`)**: Placed directly above items (structs, functions, enums, modules). Applies to the item immediately following it.
2. **Inner Attributes (`#![...]`)**: Placed at the top of a file or module. Applies to the enclosing container (the whole crate file or module scope).

```rust
#![allow(unused_imports)] // Inner: applies to the ENTIRE crate/module file

#[derive(Debug)] // Outer: applies ONLY to struct User
pub struct User {
    pub id: u64,
}
```

### (3) Reality Metaphor

- **Outer Attribute (`#[...]`)**: A sticky label slapped onto the outside of a shipping box ("Fragile", "Handle with Care"). It describes that specific box.
- **Inner Attribute (`#![...]`)**: A manifest poster taped onto the inside door of a cargo shipping container ("No Hazardous Materials Allowed"). It governs everything inside the container.

### (4) Rust Code Examples

#### Crate-Level Attributes & Struct Derivations
```rust
#![allow(dead_code)] // Inner attribute: applies to entire crate file

#[derive(Debug, Clone, PartialEq, Eq)] // Outer attribute: auto-generates trait impls
#[non_exhaustive]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
}

#[inline(always)] // Instructions for LLVM optimizer
pub fn is_valid_port(port: u16) -> bool {
    port > 1024
}

fn main() {
    let cfg = ServerConfig { host: "127.0.0.1".into(), port: 8080 };
    assert!(is_valid_port(cfg.port));
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Confusing Inner Attributes (`#![...]`) with Outer Attributes (`#[...]`)

**The mistake:** Placing an outer attribute `#[no_std]` or `#[allow(unused)]` at the top of a crate file where an inner attribute `#![...]` is required.

**Why it is wrong:** `#[...]` tries to attach to the item immediately following it. At the top of a file with no preceding item, `rustc` raises compiler error `E0753` / `E0583`.

*Incorrect:*
```rust
#[no_std] // ❌ Syntax error! Outer attribute at file root
```

*Fix:*
```rust
#![no_std] // Correct inner attribute!
```

### Mistake 2: Overusing `#[inline(always)]` Without Profiling Benchmark Evidence

**The mistake:** Annotating every helper function with `#[inline(always)]`.

**Why it is wrong:** Causes severe instruction cache misses and inflates binary sizes. LLVM already inlines aggressively across functions. Use `#[inline]` for generic functions across crate boundaries instead.

### Mistake 3: Global Warnings Blanket Suppression via `#![allow(warnings)]`

**The mistake:** Disabling compiler warnings globally across a project via `#![allow(warnings)]`.

**Why it is wrong:** Masks memory leaks, unused code, performance bugs, and deprecation notices across the entire codebase.

---

## 5. Practice Exercises

### Exercise 1: Cross-Platform Feature Gate Attribute Engine

**Scenario:** Implement a cross-platform OS query function `get_system_os()` that returns a string matching the target operating system at compile time using `#[cfg(...)]` attributes.

**Requirements:**
1. Implement `get_system_os() -> &'static str`.
2. Support `target_os = "linux"`, `"macos"`, `"windows"`, and a fallback `not(...)`.
3. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[cfg(target_os = "linux")]
> pub fn get_system_os() -> &'static str { "Linux" }
> 
> #[cfg(target_os = "macos")]
> pub fn get_system_os() -> &'static str { "macOS" }
> 
> #[cfg(target_os = "windows")]
> pub fn get_system_os() -> &'static str { "Windows" }
> 
> #[cfg(not(any(target_os = "linux", target_os = "macos", target_os = "windows")))]
> pub fn get_system_os() -> &'static str { "Unknown OS" }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_os_detection_attribute() {
>         let os_name = get_system_os();
>         assert!(!os_name.is_empty());
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `#[cfg(target_os = "...")]` directs `rustc` to compile only the matching function body for the active target platform.
> 2. Avoids runtime `if/else` checks and reduces binary size.
> 
---

### Exercise 2: Expected Panic Unit Test Verification (`#[should_panic]`)

**Scenario:** Implement a payment processing validator `validate_amount(amount: f64)` that panics on non-positive amounts, and write unit tests using `#[test]` and `#[should_panic(expected = "...")]` attributes.

**Requirements:**
1. Implement `validate_amount` panicking on `amount <= 0.0`.
2. Write unit tests testing valid and invalid amounts.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn validate_amount(amount: f64) {
>     if amount <= 0.0 {
>         panic!("Payment amount must be greater than zero");
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_valid_amount() {
>         validate_amount(99.95);
>     }
> 
>     #[test]
>     #[should_panic(expected = "Payment amount must be greater than zero")]
>     fn test_invalid_amount_panics() {
>         validate_amount(-10.0);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `#[test]` registers functions with Cargo's test runner.
> 2. `#[should_panic(expected = "...")]` asserts that a function panics with the exact expected error message.
> 
---

### Exercise 3: Derived Struct Trait Attributes

**Scenario:** Create a network configuration struct `NetworkConfig` with derived traits `#[derive(Debug, Clone, PartialEq, Eq)]`.

**Requirements:**
1. Define struct `NetworkConfig { pub ip: String, pub port: u16 }`.
2. Annotate with `#[derive(Debug, Clone, PartialEq, Eq)]`.
3. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct NetworkConfig {
>     pub ip: String,
>     pub port: u16,
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_network_config_derive() {
>         let cfg1 = NetworkConfig { ip: "192.168.1.1".into(), port: 8080 };
>         let cfg2 = cfg1.clone();
>         
>         assert_eq!(cfg1, cfg2);
>         assert_eq!(format!("{:?}", cfg1), "NetworkConfig { ip: \"192.168.1.1\", port: 8080 }");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `#[derive(...)]` instructs macro expanders to auto-generate implementation blocks for `Debug`, `Clone`, and `PartialEq`.
> 2. Eliminates repetitive manual boilerplate code.
> 
---

## 6. Related Terms

- [Attribute Macros](../level_12/attribute_macros.md) — 

---

## 7. Key Takeaways

- Outer attributes `#[...]` apply to the item immediately following them.
- Inner attributes `#![...]` apply to the enclosing container (crate root or module file).
- Powers conditional compilation (`#[cfg]`), testing (`#[test]`), and code derivation (`#[derive]`).
- Use lint suppression attributes sparingly and target specific items.
ms.
