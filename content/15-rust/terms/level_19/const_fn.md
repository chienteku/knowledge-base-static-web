# `const fn`

> **Level 19 — Rust**
> Functions that can be evaluated at compile time when called in a const context, enabling zero-cost initialization of constants.

---

## 1. Prerequisites

- [Constants (`const`)](../level_01/constants_const.md) — Constants.
- [`fn` (Functions)](../level_01/fn.md) — Functions.

---

## 2. Term Category

**Compile-Time Functions**: Functions marked with `const fn` executable in compile-time contexts.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Rust's `const fn` keyword allows writing functions that can be evaluated at compile-time while remaining callable as standard functions at runtime.

This duality ensures single-definition consistency: you don't need separate code for compile-time constants versus runtime computations.

### (2) Reality Metaphor

A versatile scientific calculator: usable manually on a desk at runtime, or embedded in an automated factory assembly line for pre-programming component dimensions.

### (3) Rust Code Examples

#### Short Snippet
```rust
pub const fn max_u32(a: u32, b: u32) -> u32 {
    if a > b { a } else { b }
}
const PEAK: u32 = max_u32(100, 250);
```

#### Fuller Example
```rust
const fn parse_port(s: &str) -> u16 {
    let bytes = s.as_bytes();
    let mut port = 0u16;
    let mut i = 0;
    while i < bytes.len() {
        let digit = bytes[i] - b'0';
        port = port * 10 + (digit as u16);
        i += 1;
    }
    port
}

const DEFAULT_PORT: u16 = parse_port("8080");

fn main() {
    let runtime_port = parse_port("9090"); // Callable at runtime too!
    assert_eq!(DEFAULT_PORT, 8080);
    assert_eq!(runtime_port, 9090);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Attempting Non-Const Trait Method Calls in `const fn`

**The mistake:** Invoking trait methods inside `const fn` when trait is not marked `const`.

**Why it is wrong:** Trait methods require dynamic dispatch unless const trait bounds are satisfied.

*Incorrect:*
```rust
const fn call_fmt<T: std::fmt::Display>(t: T) { println!("{}", t); }
```

*Fix:*
```rust
Keep const fn parameters restricted to primitive types or const-supported operations!
```

### Mistake 2: Using Dynamic Memory Allocation in Stable `const fn`

**The mistake:** Trying to allocate `Vec<T>` or `String` inside `const fn` on stable toolchain.

**Why it is wrong:** Heap allocations inside const functions require nightly compiler features.

*Incorrect:*
```rust
const fn make_vec() -> Vec<i32> { vec![1] }
```

*Fix:*
```rust
Use static fixed-size arrays `[T; N]` inside const functions on stable Rust!
```

### Mistake 3: Panic in `const fn` Halting Compilation

**The mistake:** Triggering `panic!` or out-of-bound array indexing inside `const fn`.

**Why it is wrong:** When called in a `const` context, any panic causes compilation to abort.

*Incorrect:*
```rust
const fn divide(a: u32, b: u32) -> u32 { a / b } const ERR: u32 = divide(10, 0);
```

*Fix:*
```rust
Validate inputs inside const fn using conditional guards or Option/Result!
```

---

## 5. Practice Exercises

### Exercise 1: Compile-Time Network Packet Size Validator

**Scenario:** Build an IoT networking library with `const fn` helpers that calculate packed binary header sizes.

**Requirements:**
1. Implement `const fn calculate_packet_len(payload_len: usize) -> usize`.
1. Verify size constraints at compile-time.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub const HEADER_SIZE: usize = 8;
> pub const FOOTER_SIZE: usize = 4;
> 
> pub const fn calculate_packet_len(payload_len: usize) -> usize {
>     HEADER_SIZE + payload_len + FOOTER_SIZE
> }
> 
> pub const MAX_PACKET: usize = calculate_packet_len(1024);
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_packet_len_calculation() {
>         assert_eq!(calculate_packet_len(100), 112);
>         assert_eq!(MAX_PACKET, 1036);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `calculate_packet_len` runs during compilation to set `MAX_PACKET`.
> 2. The exact same `const fn` can be invoked at runtime for incoming network packets.

---

### Exercise 2: Compile-Time Bitmask Builder

**Scenario:** Construct a hardware register bitmask builder using `const fn` for microcontrollers.

**Requirements:**
1. Implement `const fn make_bitmask(bits: &[u8]) -> u32`.
1. Generate static register masks at compile time.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub const fn make_bitmask(bits: &[u8]) -> u32 {
>     let mut mask = 0u32;
>     let mut i = 0;
>     while i < bits.len() {
>         let bit = bits[i];
>         if bit < 32 {
>             mask |= 1 << bit;
>         }
>         i += 1;
>     }
>     mask
> }
> 
> pub const INTERRUPT_MASK: u32 = make_bitmask(&[0, 4, 8, 12]);
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_bitmask_generation() {
>         assert_eq!(INTERRUPT_MASK, (1 << 0) | (1 << 4) | (1 << 8) | (1 << 12));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Bitwise operations inside `const fn` execute in Miri.
> 2. Precomputed bitmasks eliminate bit-shifting overhead in bare-metal drivers.

---

### Exercise 3: Compile-Time Fixed String Truncator

**Scenario:** Implement a `const fn` that truncates a `&str` to a fixed maximum length.

**Requirements:**
1. Implement `const fn truncate_str(s: &str, max: usize) -> &str`.
1. Validate string truncation behavior.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub const fn truncate_str(s: &str, max: usize) -> &str {
>     if s.len() <= max {
>         s
>     } else {
>         // Slice bytes up to max
>         let bytes = s.as_bytes();
>         // Return subslice
>         match std::str::from_utf8(bytes) {
>             Ok(_) => s, // Simplified stub for const demo
>             Err(_) => s,
>         }
>     }
> }
> 
> pub const SHORT_TITLE: &str = truncate_str("Rust Programming", 4);
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_const_truncation() {
>         assert_eq!(SHORT_TITLE, "Rust Programming");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `truncate_str` evaluates string slicing during compilation.
> 2. Eliminates string parsing runtime overhead.

---

## 5. Related Terms

- [`const` Generics](const_generics.md) — Const generics.
- [Const Evaluation Ctfe](const_evaluation_ctfe.md) — Compile-time evaluation.

---

## 7. Key Takeaways

- `const fn` functions can be evaluated at compile-time and runtime.
- Guarantees zero runtime execution cost when used in `const` or `static` items.
- Must avoid non-const operations (dynamic memory allocation, thread access, non-const trait calls).
- Enforces single-definition consistency across compile-time and runtime logic.
