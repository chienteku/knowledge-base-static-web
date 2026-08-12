# MIR (Mid-level IR)

> **Level 19 — Rust**
> Rust's internal Mid-level Intermediate Representation, used by the borrow checker, MIRI, and optimizations before lowering to LLVM IR.

---

## 1. Prerequisites

- [HIR (High-level IR)](hir_high_level_ir.md) — HIR representation.

---

## 2. Term Category



**Rust Compiler Intermediate Representation (control flow graph mid-level IR)**: Mid-Level Intermediate Representation (MIR) in `rustc`.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Performing borrow checking, lifetime analysis, and constant evaluation directly on complex AST or HIR structures is prohibitively slow and error-prone.

MIR (Mid-Level Intermediate Representation) is a simplified, Control Flow Graph (CFG) based representation of Rust programs. MIR breaks down nested expressions into simple assignment statements, basic blocks, and explicit terminators, enabling fast and sound borrow checking.

### (2) Reality Metaphor

A railway track layout diagram: explicitly representing every switch, track block, and station platform to guarantee no two trains occupy the same track segment simultaneously.

### (3) Rust Code Examples

#### Short Snippet
```rust
// Inspected via: rustc --emit=mir main.rs
```

#### Fuller Example
```rust
pub fn mir_example(cond: bool) -> i32 {
    // MIR desugars this if/else into basic blocks with explicit goto/switchInt terminators
    if cond { 10 } else { 20 }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Expecting MIR to Contain High-Level Syntactic Loops

**The mistake:** Expecting `for` or `while` loops to exist in MIR.

**Why it is wrong:** MIR converts all loops into basic blocks connected by conditional jump terminators.

*Incorrect:*
```rust
for loop in MIR
```

*Fix:*
```rust
Loops are lowered to basic blocks with SwitchInt and Goto terminators in MIR!
```

### Mistake 2: Confusing MIR Borrow Checking with Runtime Validation

**The mistake:** Assuming MIR borrow checking incurs runtime execution cost.

**Why it is wrong:** MIR borrow checking is executed entirely during compilation; zero runtime overhead.

*Incorrect:*
```rust
Runtime borrow overhead
```

*Fix:*
```rust
MIR borrow checking is 100% static compile-time validation!
```

### Mistake 3: Attempting to Modify MIR in Proc Macros

**The mistake:** Writing procedural macros expecting to modify MIR.

**Why it is wrong:** Proc macros operate on AST TokenStreams before HIR and MIR lowering.

*Incorrect:*
```rust
Proc macro on MIR
```

*Fix:*
```rust
Proc macros transform AST TokenStream; MIR is generated internally by rustc!
```

---

## 5. Practice Exercises

### Exercise 1: Basic Block CFG Simulator

**Scenario:** Build a Control Flow Graph simulator representing MIR basic blocks and terminators.

**Requirements:**
1. Define `BasicBlock` struct with statements and terminator.
1. Simulate execution flow.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq)]
> pub enum Terminator {
>     Goto(usize),
>     Return,
> }
> 
> pub struct BasicBlock {
>     pub statements: Vec<String>,
>     pub terminator: Terminator,
> }
> 
> pub fn execute_cfg(blocks: &[BasicBlock]) -> usize {
>     let mut current = 0;
>     let mut executed_count = 0;
>     while current < blocks.len() {
>         executed_count += 1;
>         match blocks[current].terminator {
>             Terminator::Goto(next) => current = next,
>             Terminator::Return => break,
>         }
>     }
>     executed_count
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_cfg_execution() {
>         let blocks = vec![
>             BasicBlock { statements: vec!["_1 = 10".into()], terminator: Terminator::Goto(1) },
>             BasicBlock { statements: vec!["_0 = _1".into()], terminator: Terminator::Return },
>         ];
>         assert_eq!(execute_cfg(&blocks), 2);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Simulates MIR Control Flow Graph (CFG) basic block execution.
> 2. Enables borrow checker lifetime analysis.
> 
---

### Exercise 2: Borrow Checker Liveness Tracker Simulator

**Scenario:** Simulate variable liveness tracking across MIR basic blocks.

**Requirements:**
1. Track variable assignment and drop points.
1. Detect live ranges.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::HashSet;
> 
> pub struct LivenessTracker {
>     live_vars: HashSet<String>,
> }
> 
> impl LivenessTracker {
>     pub fn new() -> Self { Self { live_vars: HashSet::new() } }
>     pub fn assign(&mut self, var: &str) { self.live_vars.insert(var.to_string()); }
>     pub fn drop(&mut self, var: &str) { self.live_vars.remove(var); }
>     pub fn is_live(&self, var: &str) -> bool { self.live_vars.contains(var) }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_liveness() {
>         let mut tracker = LivenessTracker::new();
>         tracker.assign("_1");
>         assert!(tracker.is_live("_1"));
>         tracker.drop("_1");
>         assert!(!tracker.is_live("_1"));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Represents MIR variable liveness analysis used for lifetime checking.
> 2. Determines exact scope drop points.
> 
---

### Exercise 3: MIR Statement Simplifier

**Scenario:** Simulate desugaring complex expressions into binary assignment statements.

**Requirements:**
1. Flatten compound expressions into binary statements.
1. Verify statement count.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn flatten_expr(a: i32, b: i32, c: i32) -> (i32, i32) {
>     let temp1 = a + b; // _1 = Add(a, b)
>     let temp2 = temp1 * c; // _0 = Mul(_1, c)
>     (temp1, temp2)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_flattening() {
>         let (t1, t2) = flatten_expr(2, 3, 4);
>         assert_eq!(t1, 5);
>         assert_eq!(t2, 20);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Demonstrates MIR breaking complex expressions into explicit 3-address statements.
> 2. Simplifies optimization passes.
> 
---

## 6. Related Terms

- [HIR (High-level IR)](hir_high_level_ir.md) — High-level IR.
- [LLVM (Codegen Backend)](llvm_codegen_backend.md) — LLVM backend.
- [Miri (Undefined Behavior Detector)](../level_13/miri_ub_detector.md) — Miri execution engine.

---

## 7. Key Takeaways

- MIR is a Control Flow Graph (CFG) representation of Rust programs.
- Powers borrow checking, lifetime validation, and `const` evaluation.
- Simplifies complex expressions into basic blocks and explicit terminators.
- Lowered to LLVM IR for target machine code generation.
