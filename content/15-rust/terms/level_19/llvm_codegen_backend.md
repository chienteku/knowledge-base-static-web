# LLVM (Codegen Backend)

> **Level 19 — Rust**
> The external optimizing backend that `rustc` uses: Rust MIR is lowered to LLVM IR, which LLVM then optimizes and compiles to native machine code.

---

## 1. Prerequisites

- [Mir Mid Level Ir](mir_mid_level_ir.md) — MIR lowering.

---

## 2. Term Category

**Compiler Architecture**: LLVM code generation and optimization backend.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

After `rustc` performs borrow checking and MIR optimizations, it lowers the program into LLVM Intermediate Representation (LLVM IR).

The LLVM backend handles target machine code generation, auto-vectorization (SIMD), link-time optimization (LTO), and register allocation across platforms (x86_64, ARM64, WebAssembly, RISC-V).

### (2) Reality Metaphor

An industrial steel foundry: transforming abstract CAD blueprints (MIR) into precision-forged steel structural components tailored for specific construction sites.

### (3) Rust Code Examples

#### Short Snippet
```rust
// Emit LLVM IR via: rustc --emit=llvm-ir main.rs
```

#### Fuller Example
```rust
pub fn fast_add(slice: &[u32]) -> u32 {
    // LLVM codegen backend auto-vectorizes this loop into AVX2/NEON SIMD instructions!
    let mut sum = 0;
    for &v in slice {
        sum += v;
    }
    sum
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Expecting Inline Assembly `asm!` to Bypass LLVM

**The mistake:** Assuming `asm!` instructions bypass LLVM optimization passes.

**Why it is wrong:** LLVM parses and optimizes inline assembly blocks within surrounding LLVM IR.

*Incorrect:*
```rust
asm!("..."); // Bypasses compiler optimization?
```

*Fix:*
```rust
LLVM validates and optimizes inline assembly within the compilation unit!
```

### Mistake 2: Overlooking Link-Time Optimization (LTO) Overhead

**The mistake:** Enabling `lto = true` during dev builds.

**Why it is wrong:** LTO performs cross-crate LLVM IR optimization, significantly increasing compile times.

*Incorrect:*
```rust
lto = true in dev profile
```

*Fix:*
```rust
Use LTO for release builds (`cargo build --release`) only!
```

### Mistake 3: Assuming LLVM Handles Rust Memory Safety

**The mistake:** Expecting LLVM to catch memory safety violations.

**Why it is wrong:** LLVM assumes incoming LLVM IR is valid. Safety must be guaranteed by rustc before LLVM lowering.

*Incorrect:*
```rust
Unsafe MIR lowered to LLVM
```

*Fix:*
```rust
Rustc guarantees safety before LLVM lowering; invalid LLVM IR causes undefined behavior!
```

---

## 5. Practice Exercises

### Exercise 1: LLVM IR Instruction Pipeline Simulator

**Scenario:** Build a pipeline stage simulator converting MIR basic instructions into mock LLVM IR.

**Requirements:**
1. Implement `lower_to_llvm_ir(op: &str, a: &str, b: &str) -> String`.
1. Verify LLVM IR output.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn lower_to_llvm_ir(op: &str, a: &str, b: &str) -> String {
>     format!("%result = {op} i32 {a}, {b}")
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_llvm_ir_lowering() {
>         let ir = lower_to_llvm_ir("add", "%1", "%2");
>         assert_eq!(ir, "%result = add i32 %1, %2");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Demonstrates `rustc` codegen backend translating internal MIR statements to LLVM IR instructions.
> 2. Inputs to LLVM optimization passes.

---

### Exercise 2: Target Triple Machine Code Selector

**Scenario:** Simulate target machine code selection for host architectures (x86_64, aarch64, wasm32).

**Requirements:**
1. Define `TargetArch` enum.
1. Return arch-specific codegen target.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub enum TargetArch {
>     X86_64,
>     AArch64,
>     Wasm32,
> }
> 
> pub fn get_target_triple(arch: TargetArch) -> &'static str {
>     match arch {
>         TargetArch::X86_64 => "x86_64-unknown-linux-gnu",
>         TargetArch::AArch64 => "aarch64-apple-darwin",
>         TargetArch::Wasm32 => "wasm32-unknown-unknown",
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_target_triples() {
>         assert_eq!(get_target_triple(TargetArch::X86_64), "x86_64-unknown-linux-gnu");
>         assert_eq!(get_target_triple(TargetArch::Wasm32), "wasm32-unknown-unknown");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Represents target triple configurations passed to LLVM backend during compilation.
> 2. Enables cross-compilation.

---

### Exercise 3: SIMD Vectorization Flag Checker

**Scenario:** Simulate CPU feature flag checks for LLVM auto-vectorization passes.

**Requirements:**
1. Check target feature flags.
1. Enable SIMD passes.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn supports_avx2(target_features: &[&str]) -> bool {
>     target_features.contains(&"avx2")
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_avx2_check() {
>         assert!(supports_avx2(&["sse4.1", "avx2"]));
>         assert!(!supports_avx2(&["sse2"]));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Demonstrates target feature detection passed to LLVM code generator.
> 2. Drives instruction selection.

---

## 5. Related Terms

- [Mir Mid Level Ir](mir_mid_level_ir.md) — MIR intermediate representation.
- [Link-Time Optimization (LTO)](../level_15/link_time_optimization.md) — Link time optimization.

---

## 7. Key Takeaways

- Translates Rust MIR into LLVM IR for target machine code generation.
- Executes aggressive optimization passes (auto-vectorization, LTO, inlining).
- Supports cross-compilation across x86_64, ARM, RISC-V, and WebAssembly.
- Assumes input LLVM IR satisfies memory safety invariants guaranteed by `rustc`.
