# Const Evaluation (CTFE)

> **Level 19 — Rust**
> Compile-Time Function Evaluation: the compiler executes `const fn` calls and `const` expressions during compilation, not at runtime.

---

## 1. Prerequisites

- [`const fn`](const_fn.md) — Const functions.

---

## 2. Term Category



**Rust Compiler Subsystem (compile-time function evaluation CTFE engine)**: Compile-Time Function Execution (CTFE) for evaluating code during compilation.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Modern systems programming requires zero-cost abstractions where computations (such as cryptographic lookup tables, CRC checksums, and string hashes) can be computed during compilation rather than executed at runtime.

CTFE allows Rust to execute arbitrary constant expressions and `const fn` calls inside Miri (the Rust compiler's internal interpreter) during compilation. This eliminates runtime overhead, validates domain invariants before binary distribution, and guarantees zero-cost performance.

### (2) Reality Metaphor

Pre-baking bread crusts in a central commercial bakery before delivering them to grocery stores: retail customers save baking time at home because processing was executed ahead of time.

### (3) Rust Code Examples

#### Short Snippet
```rust
const CRC32_TABLE: [u32; 256] = {
    let mut table = [0u32; 256];
    let mut i = 0;
    while i < 256 {
        let mut c = i as u32;
        let mut k = 0;
        while k < 8 {
            if c & 1 != 0 { c = 0xEDB88320 ^ (c >> 1); } else { c >>= 1; }
            k += 1;
        }
        table[i] = c;
        i += 1;
    }
    table
};
```

#### Fuller Example
```rust
const fn generate_sine_table<const N: usize>() -> [f64; N] {
    let mut table = [0.0; N];
    let mut i = 0;
    while i < N {
        let angle = (i as f64) * (2.0 * std::f64::consts::PI) / (N as f64);
        // CTFE evaluates trigonometric approximations or values at compile time
        table[i] = angle;
        i += 1;
    }
    table
}

const SINE_LOOKUP: [f64; 16] = generate_sine_table();

fn main() {
    assert_eq!(SINE_LOOKUP.len(), 16);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Calling Non-Const Functions in CTFE

**The mistake:** Attempting to invoke standard runtime functions (like heap allocation or system time) in CTFE contexts.

**Why it is wrong:** CTFE executes inside compiler Miri without operating system environment bindings.

*Incorrect:*
```rust
const NOW: u64 = std::time::Instant::now().elapsed().as_secs();
```

*Fix:*
```rust
const TIMEOUT: u64 = 30; // Use static const definitions!
```

### Mistake 2: Out-of-Bounds Memory Operations in CTFE

**The mistake:** Accessing slice indices out of bounds inside `const` blocks.

**Why it is wrong:** Triggers a compile-time error during CTFE evaluation, blocking build output.

*Incorrect:*
```rust
const VAL: u8 = [1, 2][5];
```

*Fix:*
```rust
const VAL: u8 = [1, 2][1];
```

### Mistake 3: Infinite Loops in CTFE

**The mistake:** Writing unbounded `while` loops inside const functions.

**Why it is wrong:** Compiler Miri evaluation engine hits evaluation step limit and halts build with a compile error.

*Incorrect:*
```rust
const fn infinite() { while true {} }
```

*Fix:*
```rust
Ensure all loops in const fn have provable termination bounds!
```

---

## 5. Practice Exercises

### Exercise 1: Compile-Time Static CRC32 Checksum Table Generator

**Scenario:** Build an embedded network driver requiring a 256-element CRC32 lookup table generated entirely at compile-time via CTFE.

**Requirements:**
1. Implement `const fn build_crc_table() -> [u32; 256]` using bitwise ops.
1. Assign output to `const CRC_TABLE`.
1. Provide unit tests verifying checksum values.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub const fn build_crc_table() -> [u32; 256] {
>     let mut table = [0u32; 256];
>     let mut i = 0;
>     while i < 256 {
>         let mut c = i as u32;
>         let mut k = 0;
>         while k < 8 {
>             if c & 1 != 0 {
>                 c = 0xEDB88320 ^ (c >> 1);
>             } else {
>                 c >>= 1;
>             }
>             k += 1;
>         }
>         table[i] = c;
>         i += 1;
>     }
>     table
> }
> 
> pub const CRC_TABLE: [u32; 256] = build_crc_table();
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_crc_table_evaluation() {
>         assert_eq!(CRC_TABLE.len(), 256);
>         assert_eq!(CRC_TABLE[0], 0);
>         assert_ne!(CRC_TABLE[1], 0);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `build_crc_table()` is evaluated at compile time via CTFE.
> 2. The resulting `CRC_TABLE` array is embedded into the read-only data segment (`.rodata`) of the final binary.
> 
---

### Exercise 2: Compile-Time Perfect Hash Table Key Validation

**Scenario:** Generate a pre-computed hash lookup array for HTTP header names at compile time.

**Requirements:**
1. Implement `const fn hash_header(s: &str) -> u64`.
1. Construct a static array of hashed header keys at compile time.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub const fn hash_header(s: &str) -> u64 {
>     let bytes = s.as_bytes();
>     let mut hash = 14695981039346656037u64;
>     let mut i = 0;
>     while i < bytes.len() {
>         hash ^= bytes[i] as u64;
>         hash = hash.wrapping_mul(1099511628211);
>         i += 1;
>     }
>     hash
> }
> 
> pub const HOST_HASH: u64 = hash_header("Host");
> pub const CONTENT_TYPE_HASH: u64 = hash_header("Content-Type");
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_header_hashes() {
>         assert_ne!(HOST_HASH, CONTENT_TYPE_HASH);
>         assert_eq!(hash_header("Host"), HOST_HASH);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `hash_header` processes byte slices using FNV-1a hashing during compilation.
> 2. Key hashes are pre-computed as constants, eliminating runtime string parsing overhead.
> 
---

### Exercise 3: Compile-Time Fixed Geometry Bounds Matrix

**Scenario:** Pre-calculate a 4x4 transformation matrix for 3D graphics rendering.

**Requirements:**
1. Implement `const fn scale_matrix(factor: f32) -> [[f32; 4]; 4]`.
1. Validate matrix values at compile time.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub const fn scale_matrix(factor: f32) -> [[f32; 4]; 4] {
>     [
>         [factor, 0.0, 0.0, 0.0],
>         [0.0, factor, 0.0, 0.0],
>         [0.0, 0.0, factor, 0.0],
>         [0.0, 0.0, 0.0, 1.0],
>     ]
> }
> 
> pub const IDENTITY_SCALE: [[f32; 4]; 4] = scale_matrix(1.0);
> pub const DOUBLE_SCALE: [[f32; 4]; 4] = scale_matrix(2.0);
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_matrix_scaling() {
>         assert_eq!(IDENTITY_SCALE[0][0], 1.0);
>         assert_eq!(DOUBLE_SCALE[0][0], 2.0);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Matrix scaling calculations are executed entirely within Miri CTFE.
> 2. Binary code directly accesses precomputed floating point arrays.
> 
---

## 6. Related Terms

- [`const fn`](const_fn.md) — Const functions.
- [`const` Generics](const_generics.md) — Const generics.

---

## 7. Key Takeaways

- CTFE evaluates constant expressions and `const fn` calls during compilation.
- Executes inside Rust compiler Miri interpreter without runtime overhead.
- Resulting data is stored in the binary read-only data segment (`.rodata`).
- Enables compile-time validation, static lookup table generation, and zero-cost abstractions.
