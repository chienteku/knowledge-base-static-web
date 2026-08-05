# Visitor Pattern

> **Level 18 — Rust**
> Separating algorithms from data structures using double dispatch via traits, letting you add operations without modifying the types.

---

## 1. Prerequisites

- [Trait](../level_04/trait.md) — Trait polymorphism.
- [Enum](../level_02/enum.md) — Enum variants.

---


## 2. Term Category

**Design Pattern**: Visitor pattern for traversing hierarchical AST data structures.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Compilers and AST analyzers need to perform dozens of distinct passes (linting, type checking, code generation) over complex tree structures. Hardcoding traversal logic inside every AST node class creates massive code duplication.

The Visitor pattern decouples tree traversal algorithms from AST node definitions. AST nodes accept a visitor interface (`node.accept(visitor)`), enabling external passes to process tree nodes cleanly without mutating node definitions.

### (2) Reality Metaphor

A municipal building inspector: walking through office rooms to evaluate plumbing, electrical, and fire safety compliance without modifying building walls or room architecture.

### (3) Rust Code Examples

#### Short Snippet
```rust
pub trait ASTVisitor { fn visit_number(&mut self, val: i32); }
pub enum ASTNode { Num(i32) }
```

#### Fuller Example
```rust
pub enum Expr {
    Number(i32),
    Add(Box<Expr>, Box<Expr>),
}

pub trait ExprVisitor<R> {
    fn visit_number(&mut self, val: i32) -> R;
    fn visit_add(&mut self, left: &Expr, right: &Expr) -> R;
}

impl Expr {
    pub fn accept<R>(&self, visitor: &mut impl ExprVisitor<R>) -> R {
        match self {
            Expr::Number(n) => visitor.visit_number(*n),
            Expr::Add(l, r) => visitor.visit_add(l, r),
        }
    }
}

fn main() {}

```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Mutating AST Nodes During Read-Only Visitor Traversal

**The mistake:** Attempting shared mutable access to AST nodes during visitor traversal.

**Why it is wrong:** Rust's borrow checker enforces single writer or multiple reader constraints across recursive tree calls.

*Incorrect:*
```rust
fn visit(&mut self, node: &mut Node)
```

*Fix:*
```rust
Decouple read-only visitors from mutating tree transformer visitors!
```

### Mistake 2: Forgetting Recursive Traversal in Visitor Implementations

**The mistake:** Visiting child nodes manually without forwarding `.accept()` calls.

**Why it is wrong:** Causes subtrees to be skipped during analysis passes.

*Incorrect:*
```rust
fn visit_add(&mut self, l: &Expr, r: &Expr) { /* skipped children! */ }
```

*Fix:*
```rust
fn visit_add(&mut self, l: &Expr, r: &Expr) { l.accept(self); r.accept(self); }
```

### Mistake 3: Creating Monolithic Visitor Traits with 100 Mandatory Methods

**The mistake:** Defining huge visitor traits without default empty method implementations.

**Why it is wrong:** Forces every visitor pass to implement 100 unused AST node methods.

*Incorrect:*
```rust
pub trait ASTVisitor { fn visit_a(); fn visit_b(); ... }
```

*Fix:*
```rust
Provide default empty method implementations: `fn visit_a(&mut self) {}`!
```

---

## 5. Practice Exercises

### Exercise 1: AST Arithmetic Evaluator Visitor

**Scenario:** Build an AST calculator using the Visitor pattern to evaluate arithmetic expressions (`Number` and `Add` nodes).

**Requirements:**
1. Define `Expr` enum (`Number(i32)`, `Add(Box<Expr>, Box<Expr>)`).
1. Implement `ExprVisitor` trait.
1. Implement `EvaluatorVisitor` struct.
1. Test evaluation.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub enum Expr {
>     Number(i32),
>     Add(Box<Expr>, Box<Expr>),
> }
> 
> pub trait ExprVisitor<R> {
>     fn visit_number(&mut self, val: i32) -> R;
>     fn visit_add(&mut self, left: &Expr, right: &Expr) -> R;
> }
> 
> impl Expr {
>     pub fn accept<R>(&self, visitor: &mut impl ExprVisitor<R>) -> R {
>         match self {
>             Expr::Number(n) => visitor.visit_number(*n),
>             Expr::Add(l, r) => visitor.visit_add(l, r),
>         }
>     }
> }
> 
> pub struct EvaluatorVisitor;
> impl ExprVisitor<i32> for EvaluatorVisitor {
>     fn visit_number(&mut self, val: i32) -> i32 {
>         val
>     }
>     fn visit_add(&mut self, left: &Expr, right: &Expr) -> i32 {
>         left.accept(self) + right.accept(self)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_visitor_evaluator() {
>         let ast = Expr::Add(
>             Box::new(Expr::Number(10)),
>             Box::new(Expr::Number(32)),
>         );
>         let mut eval = EvaluatorVisitor;
>         assert_eq!(ast.accept(&mut eval), 42);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `Expr::accept` performs double dispatch to forward evaluation to `EvaluatorVisitor`.
> 2. Recursively evaluates left and right subtree expressions.

---

### Exercise 2: AST Node Counter Visitor Pass

**Scenario:** Create an AST node counting visitor `NodeCounterVisitor` calculating total tree node counts.

**Requirements:**
1. Implement `NodeCounterVisitor`.
1. Count nodes.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub struct NodeCounterVisitor {
>     pub count: usize,
> }
> 
> impl NodeCounterVisitor {
>     pub fn new() -> Self { Self { count: 0 } }
> }
> 
> impl ExprVisitor<()> for NodeCounterVisitor {
>     fn visit_number(&mut self, _val: i32) {
>         self.count += 1;
>     }
>     fn visit_add(&mut self, left: &Expr, right: &Expr) {
>         self.count += 1;
>         left.accept(self);
>         right.accept(self);
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_node_counter() {
>         let ast = Expr::Add(Box::new(Expr::Number(1)), Box::new(Expr::Number(2)));
>         let mut counter = NodeCounterVisitor::new();
>         ast.accept(&mut counter);
>         assert_eq!(counter.count, 3);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Demonstrates adding new AST analysis passes without modifying `Expr` struct definitions.
> 2. Clean separation of concerns.

---

### Exercise 3: AST Pretty Printer Visitor

**Scenario:** Build a pretty printer visitor formatting AST nodes into strings.

**Requirements:**
1. Implement `PrettyPrinterVisitor`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub struct PrettyPrinterVisitor;
> 
> impl ExprVisitor<String> for PrettyPrinterVisitor {
>     fn visit_number(&mut self, val: i32) -> String {
>         val.to_string()
>     }
>     fn visit_add(&mut self, left: &Expr, right: &Expr) -> String {
>         format!("({} + {})", left.accept(self), right.accept(self))
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_pretty_printer() {
>         let ast = Expr::Add(Box::new(Expr::Number(1)), Box::new(Expr::Number(2)));
>         let mut printer = PrettyPrinterVisitor;
>         assert_eq!(ast.accept(&mut printer), "(1 + 2)");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Converts recursive AST structures into formatted string expressions.
> 2. Idiomatic compiler visitor pattern.

---

## 5. Related Terms

- [Enum Dispatch](enum_dispatch.md) — Enum dispatch alternative.
- [Trait Objects (`dyn Trait`)](../level_04/trait_objects.md) — Dynamic trait objects.

---


## 7. Key Takeaways

- Decouples algorithms and analysis passes from AST node structures.
- Employs double dispatch (`node.accept(visitor)`).
- Enables adding new passes without mutating AST node definitions.
- Extensively utilized across compiler parser passes and linters.
