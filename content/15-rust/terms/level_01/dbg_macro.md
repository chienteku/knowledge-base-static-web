# `dbg!` Macro

> **Level 1 — Foundations**
> Prints an expression's file, line, and value to stderr, and returns the value unchanged — the idiomatic print-debugging tool.

---

## 1. Prerequisites


- [`println!` / `format!`](println_format.md) — The output-formatting macro `dbg!` builds on.
- [Expressions](expressions.md) — `dbg!` wraps an expression and evaluates to it.
- [Macros](macros.md) — The general mechanism.

---

## 2. Term Category

**Debugging Macro (the transparent inspector)**: `dbg!` exists to answer "what is this value, right here, right now?" without disturbing the surrounding code's structure or return value. Unlike `println!`, it requires no manual formatting string, prints to `stderr` (not `stdout`), and — critically — **evaluates to the value it was given**, so it can be dropped directly into an expression without restructuring anything.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The standard way to inspect a value mid-computation is `println!("{:?}", some_expr);` — but this requires introducing a temporary variable if `some_expr` is embedded inside a larger expression, and it doesn't tell you *where* in the source the print came from once you have several of them scattered around. `dbg!` solves both problems at once: it automatically prints the file name, line number, the exact source text of the expression, and its debug-formatted value — and then hands the value right back to you, so `dbg!(x + 1)` behaves exactly like `x + 1` in every way except for the side-effect of printing. This means you can wrap *any* sub-expression, anywhere, without rewriting the surrounding code.

### (2) Reality Metaphor

Imagine a factory conveyor belt with a package moving through several processing stations.

- **Using `println!`**: To check a package's contents mid-belt, you have to stop the belt, physically remove the package, open it, note its contents, then put it back and restart the belt — an interruption to the process.
- **Using `dbg!`**: You install a transparent X-ray scanner window directly over one segment of the belt. The package glides through it, is instantly recorded and labeled (with the scanner's exact location and a snapshot of the contents) on a printout, and continues moving without ever leaving the belt or being touched.

### (3) Rust Code Examples

#### Short Snippet (Inline, No Restructuring Needed)
```rust
fn main() {
    let x = 5;
    // dbg!() prints to stderr AND returns the value, so `y` still gets `x * 2`.
    let y = dbg!(x * 2) + 1;
    println!("y = {y}");
}
// stderr: [src/main.rs:4:13] x * 2 = 10
// stdout: y = 11
```

#### Fuller Example (Debugging a Chain Without Breaking It)
```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];

    // Insert dbg! in the MIDDLE of a chain to inspect an intermediate state,
    // without needing to split the chain into separate `let` statements.
    let sum: i32 = numbers
        .iter()
        .map(|n| n * n)
        .filter(|n| dbg!(*n) > 5) // Prints every squared value as it's tested.
        .sum();

    println!("sum = {sum}");
}
// stderr shows each candidate value as the filter runs:
// [src/main.rs:9:29] *n = 1
// [src/main.rs:9:29] *n = 4
// [src/main.rs:9:29] *n = 9
// [src/main.rs:9:29] *n = 16
// [src/main.rs:9:29] *n = 25
// stdout: sum = 50
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Dbg Macro Scoping and Lifecycle Rules

**The mistake:** Assuming Dbg Macro instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("dbg_macro_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("dbg_macro_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Dbg Macro State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Dbg Macro through an immutable reference `&T` or without specifying `mut` in variable declarations.

**Why it's wrong:** Rust's aliasing XOR mutability rule (`&T` for shared immutable access, `&mut T` for exclusive mutable access) prohibits mutating state through shared references unless interior mutability patterns (e.g. `RefCell`, `Mutex`) are explicitly used.

*Incorrect:*
```rust
fn update_val(data: &i32) {
    // *data += 1; // ❌ Error E0594: cannot assign to `*data`, which is behind a `&` reference
}
```

*Fix:*
```rust
fn update_val(data: &mut i32) {
    *data += 1; // Correct: exclusive mutable reference permits mutation
}
```

### Mistake 3: Concurrent Access to Dbg Macro Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Dbg Macro instances across OS threads via `std::thread::spawn`.

**Why it's wrong:** Types that do not implement `Send` or `Sync` marker traits cannot safely cross thread boundaries. The compiler prevents data races by raising compile errors `E0277` (`trait Send is not implemented`).

*Incorrect:*
```rust
use std::rc::Rc;
use std::thread;

let rc = Rc::new(42);
// thread::spawn(move || { println!("{}", rc); }); // ❌ Error E0277: `Rc` cannot be sent between threads safely
```

*Fix:*
```rust
use std::sync::Arc;
use std::thread;

let arc = Arc::new(42);
thread::spawn(move || {
    println!("{}", arc); // Correct: `Arc` implements `Send` and `Sync`
});
```

---

## 5. Practice Exercises

### Exercise 1: Financial Telemetry & Non-Copy Type Ownership in Iterator Pipelines

**Scenario**: In a high-frequency financial trading system, market data feeds contain transaction batches represented as non-`Copy` structures (`Transaction` containing `account_id: String`, `amount: f64`, `status: TransactionStatus`). A telemetry component filters out invalid or flagged transactions and computes fee-adjusted net volumes. During debugging, developers must inspect intermediate values (such as fee-adjusted totals and status predicates) inside iterator method chains without taking ownership of non-`Copy` `String` fields or causing premature drops.

**Problem**: Implement `process_telemetry_batch(transactions: &[Transaction], fee_rate: f64) -> Vec<TransactionSummary>` using iterator chains. Insert transparent `dbg!` taps to inspect intermediate values without taking ownership of non-`Copy` types or invalidating references.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone, PartialEq)]
> pub enum TransactionStatus {
>     Completed,
>     Pending,
>     Flagged,
> }
> 
> #[derive(Debug, Clone, PartialEq)]
> pub struct Transaction {
>     pub id: String,
>     pub account_id: String,
>     pub amount: f64,
>     pub status: TransactionStatus,
> }
> 
> #[derive(Debug, Clone, PartialEq)]
> pub struct TransactionSummary {
>     pub account_id: String,
>     pub net_amount: f64,
> }
> 
> pub fn process_telemetry_batch(
>     transactions: &[Transaction],
>     fee_rate: f64,
> ) -> Vec<TransactionSummary> {
>     transactions
>         .iter()
>         .filter(|tx| {
>             // Inspect status via reference to avoid moving non-Copy tx
>             let is_completed = dbg!(&tx.status) == &TransactionStatus::Completed;
>             is_completed
>         })
>         .filter_map(|tx| {
>             // Inline dbg! inspects fee calculation result and evaluates directly to f64
>             let net_amount = dbg!(tx.amount * (1.0 - fee_rate));
>             if net_amount > 0.0 {
>                 Some(TransactionSummary {
>                     account_id: tx.account_id.clone(),
>                     net_amount,
>                 })
>             } else {
>                 None
>             }
>         })
>         .collect()
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_process_telemetry_batch_filtering() {
>         let batch = vec![
>             Transaction {
>                 id: "tx-1".into(),
>                 account_id: "acc-100".into(),
>                 amount: 500.0,
>                 status: TransactionStatus::Completed,
>             },
>             Transaction {
>                 id: "tx-2".into(),
>                 account_id: "acc-101".into(),
>                 amount: 200.0,
>                 status: TransactionStatus::Flagged,
>             },
>             Transaction {
>                 id: "tx-3".into(),
>                 account_id: "acc-102".into(),
>                 amount: -50.0,
>                 status: TransactionStatus::Completed,
>             },
>         ];
> 
>         let summaries = process_telemetry_batch(&batch, 0.02);
>         assert_eq!(summaries.len(), 1);
>         assert_eq!(summaries[0].account_id, "acc-100");
>         assert!((summaries[0].net_amount - 490.0).abs() < 1e-6);
>     }
> 
>     #[test]
>     fn test_non_copy_borrow_preservation() {
>         let tx = Transaction {
>             id: "tx-4".into(),
>             account_id: "acc-200".into(),
>             amount: 1000.0,
>             status: TransactionStatus::Completed,
>         };
>         let batch = vec![tx.clone()];
>         let summaries = process_telemetry_batch(&batch, 0.05);
> 
>         assert!(summaries.len() == 1);
>         assert_ne!(tx.account_id, "acc-999");
>         assert_eq!(tx.id, "tx-4");
>     }
> 
>     #[test]
>     fn test_edge_cases_empty_and_zero_fee() {
>         let empty_batch: Vec<Transaction> = vec![];
>         let summaries = process_telemetry_batch(&empty_batch, 0.01);
>         assert!(summaries.is_empty());
> 
>         let pending_tx = Transaction {
>             id: "tx-5".into(),
>             account_id: "acc-300".into(),
>             amount: 100.0,
>             status: TransactionStatus::Pending,
>         };
>         let pending_batch = vec![pending_tx];
>         let pending_res = process_telemetry_batch(&pending_batch, 0.0);
>         assert_eq!(pending_res.len(), 0);
>         assert_ne!(pending_batch[0].status, TransactionStatus::Completed);
>         assert!(matches!(pending_batch[0].status, TransactionStatus::Pending));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
> 1. **Ownership Semantics of `dbg!`**: The macro signature conceptually acts as `fn dbg<T: Debug>(val: T) -> T`. When passed a value by value, `dbg!(val)` takes ownership of `val` and returns it. For non-`Copy` types like `Transaction` or `String`, invoking `dbg!(tx)` inside a closure moves `tx`, rendering it unavailable to subsequent iterator steps or outer scopes.
> 2. **Borrowing via `dbg!(&val)`**: To inspect non-`Copy` types without moving them, pass a reference: `dbg!(&tx.status)`. Here, `dbg!` takes `&TransactionStatus` and returns `&TransactionStatus`, leaving ownership of `tx` intact.
> 3. **Inline Pass-Through in Iterator Chains**: `dbg!` evaluates directly to its inner expression. In `.filter_map(|tx| { let net = dbg!(tx.amount * (1.0 - fee_rate)); ... })`, `dbg!` prints the calculated float to `stderr` while returning the `f64` directly for assignment and conditional filtering.
> 4. **Lifetime and Memory Safety**: Slicing `transactions: &[Transaction]` grants immutable references tied to the caller's slice lifetime. Borrowing `tx.account_id` via `.clone()` inside `filter_map` allocates new string instances only for valid summary records, while intermediate `dbg!` taps introduce zero heap allocations.
>
>
> 
---

### Exercise 2: AST Expression Evaluator & Control Flow Debugging

**Scenario**: In a domain-specific rule engine, expressions are represented as an Abstract Syntax Tree (`Expr` enum). When debugging recursive tree evaluation (`eval_expr`), developers need to trace intermediate sub-tree evaluation results and variable lookups without breaking recursive pattern matching or error propagation (`?` operator).

**Problem**: Implement `eval_expr(expr: &Expr, env: &HashMap<String, i64>) -> Result<i64, EvalError>` for an arithmetic AST (`Literal`, `Var`, `Add`, `Mul`, `Div`). Insert `dbg!` taps to trace sub-tree evaluation results while maintaining `Result` error short-circuiting with `?`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::HashMap;
> 
> #[derive(Debug, Clone, PartialEq)]
> pub enum Expr {
>     Literal(i64),
>     Var(String),
>     Add(Box<Expr>, Box<Expr>),
>     Mul(Box<Expr>, Box<Expr>),
>     Div(Box<Expr>, Box<Expr>),
> }
> 
> #[derive(Debug, Clone, PartialEq)]
> pub enum EvalError {
>     UndefinedVariable(String),
>     DivisionByZero,
> }
> 
> pub fn eval_expr(expr: &Expr, env: &HashMap<String, i64>) -> Result<i64, EvalError> {
>     match expr {
>         Expr::Literal(val) => Ok(dbg!(*val)),
>         Expr::Var(name) => {
>             let val = env
>                 .get(name)
>                 .copied()
>                 .ok_or_else(|| EvalError::UndefinedVariable(name.clone()));
>             dbg!(val)
>         }
>         Expr::Add(left, right) => {
>             let l_val = dbg!(eval_expr(left, env))?;
>             let r_val = dbg!(eval_expr(right, env))?;
>             Ok(l_val + r_val)
>         }
>         Expr::Mul(left, right) => {
>             let l_val = dbg!(eval_expr(left, env))?;
>             let r_val = dbg!(eval_expr(right, env))?;
>             Ok(l_val * r_val)
>         }
>         Expr::Div(left, right) => {
>             let l_val = dbg!(eval_expr(left, env))?;
>             let r_val = dbg!(eval_expr(right, env))?;
>             if r_val == 0 {
>                 Err(EvalError::DivisionByZero)
>             } else {
>                 Ok(l_val / r_val)
>             }
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_eval_ast_nested_arithmetic() {
>         let mut env = HashMap::new();
>         env.insert("x".to_string(), 10);
> 
>         // Expression: (x + 5) * 2 = 30
>         let ast = Expr::Mul(
>             Box::new(Expr::Add(
>                 Box::new(Expr::Var("x".to_string())),
>                 Box::new(Expr::Literal(5)),
>             )),
>             Box::new(Expr::Literal(2)),
>         );
> 
>         let res = eval_expr(&ast, &env);
>         assert!(res.is_ok());
>         assert_eq!(res.unwrap(), 30);
>     }
> 
>     #[test]
>     fn test_eval_ast_undefined_variable() {
>         let env = HashMap::new();
>         let ast = Expr::Var("y".to_string());
>         let res = eval_expr(&ast, &env);
> 
>         assert!(res.is_err());
>         assert_ne!(res, Ok(0));
>         assert!(matches!(res, Err(EvalError::UndefinedVariable(ref var)) if var == "y"));
>     }
> 
>     #[test]
>     fn test_eval_ast_division_by_zero() {
>         let env = HashMap::new();
>         let ast = Expr::Div(
>             Box::new(Expr::Literal(10)),
>             Box::new(Expr::Literal(0)),
>         );
>         let res = eval_expr(&ast, &env);
> 
>         assert_ne!(res, Ok(0));
>         assert!(matches!(res, Err(EvalError::DivisionByZero)));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
> 1. **Transparent Control Flow Preservation**: Wrapping a fallible recursive call like `dbg!(eval_expr(left, env))?` passes the `Result<i64, EvalError>` directly into `dbg!`. The macro prints `Ok(value)` or `Err(error)` to `stderr` and returns the `Result` intact, allowing `?` to unpack `Ok` or early-return `Err`.
> 2. **Recursive Borrowing and Stack Invariants**: Traversing `&Expr` borrows recursive `Box<Expr>` nodes immutably. Pattern matching on `&Expr::Add(left, right)` yields `&Box<Expr>`, which dereferences to `&Expr` during recursive calls without requiring AST cloning or heap re-allocation.
> 3. **Error Isolation & Zero-Cost Production Code**: `dbg!` macro calls evaluate solely for side-effect printing. When stripping debug invocations, the code structure `eval_expr(left, env)?` remains functionally identical.
> 4. **Edge Cases**: Handles undefined variables by mapping `Option::ok_or_else` to `EvalError::UndefinedVariable`, and checks for division by zero before performing integer division.
>
>
> 
---

### Exercise 3: Binary Protocol Packet Decoding & Checksum Validation

**Scenario**: A binary network service parses framed binary messages from incoming raw byte slices (`&[u8]`). Frame format: 4-byte header (`magic: 0xAA`, `opcode: u8`, `payload_len: u16` big-endian), followed by payload bytes and a 1-byte XOR checksum. Developers debugging protocol deserialization errors need to inspect slice boundaries and checksum computation inline without breaking zero-copy slice references.

**Problem**: Construct `parse_binary_frame(bytes: &[u8]) -> Result<Frame, FrameParseError>` to parse binary network frames. Use `dbg!` to inspect header fields, decoded lengths, and computed checksums inline without mutating or moving slice references.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone, PartialEq)]
> pub struct Frame {
>     pub opcode: u8,
>     pub payload: Vec<u8>,
> }
> 
> #[derive(Debug, Clone, PartialEq)]
> pub enum FrameParseError {
>     HeaderTooShort,
>     InvalidMagic(u8),
>     BufferTooShort { expected: usize, actual: usize },
>     ChecksumMismatch { expected: u8, calculated: u8 },
> }
> 
> pub fn parse_binary_frame(bytes: &[u8]) -> Result<Frame, FrameParseError> {
>     if bytes.len() < 4 {
>         return Err(FrameParseError::HeaderTooShort);
>     }
> 
>     // Inspect magic byte inline
>     let magic = dbg!(bytes[0]);
>     if magic != 0xAA {
>         return Err(FrameParseError::InvalidMagic(magic));
>     }
> 
>     let opcode = bytes[1];
>     let payload_len = dbg!(u16::from_be_bytes([bytes[2], bytes[3]]) as usize);
> 
>     let total_len = 4 + payload_len + 1; // Header (4) + Payload + Checksum (1)
>     if bytes.len() < total_len {
>         return Err(FrameParseError::BufferTooShort {
>             expected: total_len,
>             actual: bytes.len(),
>         });
>     }
> 
>     let payload_slice = &bytes[4..4 + payload_len];
>     let expected_checksum = bytes[4 + payload_len];
> 
>     // Calculate XOR checksum over header and payload
>     let calculated_checksum = dbg!(bytes[..4 + payload_len]
>         .iter()
>         .fold(0u8, |acc, &b| acc ^ b));
> 
>     if dbg!(calculated_checksum) != expected_checksum {
>         return Err(FrameParseError::ChecksumMismatch {
>             expected: expected_checksum,
>             calculated: calculated_checksum,
>         });
>     }
> 
>     Ok(Frame {
>         opcode,
>         payload: payload_slice.to_vec(),
>     })
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_parse_valid_frame() {
>         let header_and_payload = vec![0xAA, 0x01, 0x00, 0x02, 0x10, 0x20];
>         let chk = header_and_payload.iter().fold(0u8, |acc, &b| acc ^ b);
>         let mut buffer = header_and_payload;
>         buffer.push(chk);
> 
>         let result = parse_binary_frame(&buffer);
>         assert!(result.is_ok());
>         let frame = result.unwrap();
>         assert_eq!(frame.opcode, 0x01);
>         assert_eq!(frame.payload, vec![0x10, 0x20]);
>     }
> 
>     #[test]
>     fn test_parse_invalid_magic_and_truncated() {
>         let bad_magic_buffer = vec![0xBB, 0x01, 0x00, 0x00, 0xBB];
>         let res_magic = parse_binary_frame(&bad_magic_buffer);
>         assert!(matches!(res_magic, Err(FrameParseError::InvalidMagic(0xBB))));
> 
>         let short_buffer = vec![0xAA, 0x01];
>         let res_short = parse_binary_frame(&short_buffer);
>         assert_eq!(res_short, Err(FrameParseError::HeaderTooShort));
>         assert_ne!(res_short, Ok(Frame { opcode: 1, payload: vec![] }));
>     }
> 
>     #[test]
>     fn test_parse_checksum_mismatch() {
>         let bad_checksum_buffer = vec![0xAA, 0x01, 0x00, 0x01, 0x55, 0x00];
>         let res = parse_binary_frame(&bad_checksum_buffer);
>         assert!(res.is_err());
>         assert_ne!(res, Ok(Frame { opcode: 0x01, payload: vec![0x55] }));
>         assert!(matches!(
>             res,
>             Err(FrameParseError::ChecksumMismatch { .. })
>         ));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
> 1. **Zero-Copy Byte Slicing Invariants**: Operating on `&[u8]` borrows slice references directly from incoming buffer memory. Wrapping sub-slice expressions such as `dbg!(&bytes[..4])` prints the slice window without allocating or copying buffer contents.
> 2. **Endianness Conversion Debugging**: The payload length is encoded as a 2-byte big-endian integer. Wrapping `dbg!(u16::from_be_bytes([bytes[2], bytes[3]]) as usize)` logs the decoded length to `stderr` while returning `usize` straight into length boundary checks.
> 3. **Inline Stream Fold Inspection**: Calculating XOR checksums via `bytes[..4 + payload_len].iter().fold(0u8, |acc, &b| acc ^ b)` can be wrapped directly in `dbg!(...)`. The macro outputs the final computed byte before comparing against `expected_checksum`.
> 4. **Boundary & Edge Case Safety**: Enforces explicit length verification for truncated headers (`< 4` bytes), invalid magic headers (`!= 0xAA`), incomplete payload frames (`buffer.len() < total_len`), and checksum mismatches.
> 5. **Assertion Safety**: The unit test module rigorously checks both success and failure paths using `assert_eq!`, `assert!`, `assert_ne!`, and `matches!`.
>
>
> 
---

## 6. Related Terms


- [`println!` / `format!`](println_format.md) — The formatting macro family `dbg!` is a debug-focused sibling of.
- [`Debug` Trait](../level_04/debug_trait.md) — Required on any value passed to `dbg!`, since it prints using `{:#?}`-style formatting.
- [Expressions](expressions.md) — Why `dbg!` can be embedded anywhere a value is expected.
- [`todo!` / `unimplemented!` / `unreachable!`](../level_04/todo_unimplemented_unreachable.md) — Related concept: `todo!` / `unimplemented!` / `unreachable!`.

---

## 7. Key Takeaways

- `dbg!(expr)` prints the file, line, source text, and `Debug`-formatted value of `expr` to **stderr**, then returns `expr` unchanged.
- Because it evaluates to its argument, it can be dropped into the middle of any expression or method chain without restructuring code.
- It's a development-time tool — remove `dbg!` calls before committing, the same way you would a temporary breakpoint.
- Requires the value to implement `Debug`, just like `{:?}` formatting.
