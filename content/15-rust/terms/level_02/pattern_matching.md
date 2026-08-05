# Pattern Matching

> **Level 2 — Control Flow & Data Structures**
> Destructuring values in `match`, `if let`, `let`, and function parameters.

---

## 1. Prerequisites


- [`match`](match.md) — The most common and powerful place pattern matching is used.
- [`if let` / `while let`](if_let_while_let.md) — Uses pattern matching to check for a single specific shape of data.
- [Compound Types](../level_01/compound_types.md) — Tuples and arrays, which are frequently pulled apart using patterns.

---

## 2. Term Category

**Rust-specific (the ubiquity of it)**: While functional languages like Haskell have had pattern matching for decades, Rust brings it to the mainstream and bakes it deeply into the language. In Rust, pattern matching isn't just for `match` blocks—it is the underlying mechanic behind how `let` statements and function parameters work!

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In programming, you often receive complex data structures (like a Tuple, an Array, or an Enum) and you only care about the data *inside* them. 

In older languages, extracting this data is tedious. You have to write multiple lines of code like `let x = point.0; let y = point.1;`. 

Rust solves this with **Pattern Matching**, a concept that allows you to specify the "shape" (the pattern) of the data you expect. If the incoming data matches that shape, Rust will instantly "destructure" it, pulling out the inner values and binding them to variables in a single, elegant step. 

Because this is so powerful, Rust's designers made it universal. When you write `let x = 5;`, you aren't just assigning a variable; you are actually matching the pattern `x` against the value `5`!

### (2) Reality Metaphor

Imagine receiving a beautifully wrapped gift basket containing a bottle of wine, a block of cheese, and some crackers. 

Without pattern matching, you have to unpack the basket manually: *"Take out item 1. Take out item 2..."*

**Pattern Matching** is like throwing a magical net over the basket. The net has a specific shape (the "pattern"). If the net fits the shape of the basket perfectly, it instantly extracts the wine, cheese, and crackers directly into your hands (variables) in one smooth motion.

### (3) Rust Code Examples

#### Short Snippet (Destructuring with `let`)
```rust
// We have a tuple representing an RGB color.
let color = (255, 0, 100);

// We use Pattern Matching in a `let` statement to destructure it!
// `r`, `g`, and `b` are instantly created as new variables.
let (r, g, b) = color;

println!("Red: {}, Green: {}, Blue: {}", r, g, b);
```

#### Fuller Example (Patterns in `match`)
```rust
fn main() {
    let dice_roll = (3, 4);

    match dice_roll {
        // Pattern 1: Matches ONLY if both dice are exactly 6 (Snake Eyes... but 6s)
        (6, 6) => println!("Jackpot!"),
        
        // Pattern 2: Matches if the first die is 1. 
        // It binds the second die to the variable `y` so we can use it.
        (1, y) => println!("Rolled a 1 and a {}", y),
        
        // Pattern 3: Matches any two dice, binding them to `x` and `y`.
        // It also uses a "Match Guard" (`if x == y`) to add extra logic!
        (x, y) if x == y => println!("You rolled doubles of {}", x),
        
        // Pattern 4: The Catch-All. We use `_` to ignore the values.
        _ => println!("Just a normal roll."),
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to use a "Refutable" pattern in a `let` statement

**The mistake:** Trying to use `let` to match a pattern that might fail (like checking if an Option is `Some`).

**Why it's wrong:** There are two types of patterns in Rust:
1. **Irrefutable** (Can never fail to match): e.g., `let (x, y) = (1, 2);`
2. **Refutable** (Might fail to match): e.g., matching `Some(x)` against a variable that might be `None`.

A standard `let` statement **must** use an irrefutable pattern, because if it failed, the program wouldn't know what to do. For refutable patterns, you must use `if let` or `match`.

*Incorrect:*
```rust
let config = Some(5);
// ERROR: refutable pattern in local binding: `None` not covered
let Some(x) = config; 
```

*Fix:*
```rust
if let Some(x) = config { ... }
```

### Mistake 2: Mutating Pattern Matching State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Pattern Matching through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Pattern Matching Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Pattern Matching instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Multi-Layered Financial Message Router with Slice Patterns and Match Guards

**Problem Scenario:**
In high-frequency financial trading systems, raw TCP packets containing order execution messages must be decoded and validated with microsecond-level latency. The protocol uses a 4-byte header (`[0x50, 0x4B, major_ver, minor_ver]`) followed by dynamic command payloads.

Design and implement a binary message parser `parse_trading_frame` and an execution router `route_order` using Rust's advanced pattern matching features:
- Use **slice pattern matching** (`[header.., tail]`, range patterns `1..=2`) to validate protocol magic bytes `['P', 'K']` and version numbers.
- Match sub-slice payloads for Limit Orders (`0x01`), Cancel Orders (`0x02`), and Heartbeats (`0x03`).
- Implement `route_order` using **match guards** (`if price * qty >= 1_000_000`) to prioritize high-value institutional trades while rejecting zero-quantity/zero-price orders via pattern OR conditions (`Order::Limit { price: 0, .. } | ...`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq, Clone)]
> pub enum Side {
>     Buy,
>     Sell,
> }
> 
> #[derive(Debug, PartialEq, Eq, Clone)]
> pub enum Order {
>     Limit { side: Side, price: u32, quantity: u32 },
>     Cancel { order_id: u64 },
>     Heartbeat,
> }
> 
> #[derive(Debug, PartialEq, Eq, Clone)]
> pub enum FrameError {
>     InvalidMagic,
>     UnsupportedVersion(u8),
>     UnknownOpcode(u8),
>     TruncatedPayload,
> }
> 
> #[derive(Debug, PartialEq, Eq, Clone)]
> pub enum OrderRouting {
>     PriorityExecution(Order),
>     StandardExecution(Order),
>     CancelExecution(u64),
>     HeartbeatProcessed,
>     Rejected(&'static str),
> }
> 
> pub fn parse_trading_frame(bytes: &[u8]) -> Result<Order, FrameError> {
>     match bytes {
>         // Match header magic bytes and protocol version range
>         [0x50, 0x4B, version, _minor, payload @ ..] => {
>             if !matches!(version, 1 | 2) {
>                 return Err(FrameError::UnsupportedVersion(*version));
>             }
> 
>             match payload {
>                 // Limit Order: 1 byte opcode (0x01), 1 byte side, 4 bytes price (be), 4 bytes qty (be)
>                 [0x01, side_byte, p0, p1, p2, p3, q0, q1, q2, q3] => {
>                     let side = match side_byte {
>                         0x00 => Side::Buy,
>                         0x01 => Side::Sell,
>                         _ => return Err(FrameError::UnknownOpcode(*side_byte)),
>                     };
>                     let price = u32::from_be_bytes([*p0, *p1, *p2, *p3]);
>                     let quantity = u32::from_be_bytes([*q0, *q1, *q2, *q3]);
>                     Ok(Order::Limit { side, price, quantity })
>                 }
>                 [0x01, ..] => Err(FrameError::TruncatedPayload),
> 
>                 // Cancel Order: 1 byte opcode (0x02), 8 bytes order_id (be)
>                 [0x02, id @ ..] if id.len() == 8 => {
>                     let mut id_bytes = [0u8; 8];
>                     id_bytes.copy_from_slice(id);
>                     Ok(Order::Cancel { order_id: u64::from_be_bytes(id_bytes) })
>                 }
>                 [0x02, ..] => Err(FrameError::TruncatedPayload),
> 
>                 // Heartbeat: 1 byte opcode (0x03)
>                 [0x03] => Ok(Order::Heartbeat),
> 
>                 // Unknown opcode or truncated fallback
>                 [op, ..] => Err(FrameError::UnknownOpcode(*op)),
>                 [] => Err(FrameError::TruncatedPayload),
>             }
>         }
>         [0x50, 0x4B, ..] => Err(FrameError::TruncatedPayload),
>         _ => Err(FrameError::InvalidMagic),
>     }
> }
> 
> pub fn route_order(order: Order) -> OrderRouting {
>     match order {
>         // Match guard to reject invalid parameters (zero price or zero quantity)
>         Order::Limit { price: 0, .. } | Order::Limit { quantity: 0, .. } => {
>             OrderRouting::Rejected("Invalid parameters")
>         }
>         // Match guard to route high-value trades to priority execution
>         Order::Limit { price, quantity, .. }
>             if (price as u64).saturating_mul(quantity as u64) >= 1_000_000 =>
>         {
>             OrderRouting::PriorityExecution(order)
>         }
>         Order::Limit { .. } => OrderRouting::StandardExecution(order),
>         Order::Cancel { order_id } => OrderRouting::CancelExecution(order_id),
>         Order::Heartbeat => OrderRouting::HeartbeatProcessed,
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_valid_limit_order_parsing_and_routing() {
>         let raw_frame = [
>             0x50, 0x4B, 0x01, 0x00, 
>             0x01, 0x00, 0x00, 0x00, 0x01, 0xF4, 0x00, 0x00, 0x07, 0xD0
>         ];
>         let parsed = parse_trading_frame(&raw_frame);
>         assert!(parsed.is_ok());
> 
>         let order = parsed.unwrap();
>         assert_eq!(
>             order,
>             Order::Limit {
>                 side: Side::Buy,
>                 price: 500,
>                 quantity: 2000,
>             }
>         );
> 
>         // Notional value = 500 * 2000 = 1,000,000 => Priority Execution
>         let routed = route_order(order.clone());
>         assert_eq!(routed, OrderRouting::PriorityExecution(order));
>     }
> 
>     #[test]
>     fn test_invalid_frames_and_match_assertions() {
>         let bad_magic = [0x00, 0x4B, 0x01, 0x00, 0x03];
>         assert_eq!(parse_trading_frame(&bad_magic), Err(FrameError::InvalidMagic));
> 
>         let bad_version = [0x50, 0x4B, 0x09, 0x00, 0x03];
>         assert_eq!(
>             parse_trading_frame(&bad_version),
>             Err(FrameError::UnsupportedVersion(9))
>         );
> 
>         let truncated = [0x50, 0x4B, 0x01, 0x00, 0x01, 0x00];
>         assert_eq!(parse_trading_frame(&truncated), Err(FrameError::TruncatedPayload));
> 
>         let cancel_frame = [
>             0x50, 0x4B, 0x02, 0x00, 
>             0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x2A
>         ];
>         let cancel_order = parse_trading_frame(&cancel_frame).unwrap();
>         assert_ne!(cancel_order, Order::Heartbeat);
>         assert!(matches!(cancel_order, Order::Cancel { order_id: 42 }));
> 
>         let zero_qty_order = Order::Limit { side: Side::Sell, price: 100, quantity: 0 };
>         assert!(matches!(route_order(zero_qty_order), OrderRouting::Rejected(_)));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
>
>
> 1. **Slice Patterns (`[0x50, 0x4B, payload @ ..]`)**: Rust's slice pattern matching allows matching fixed prefix elements while binding the remaining slice to a variable using `@ ..`. This avoids manual indexing (`bytes[0]`, `bytes[1]`) and bound checks, as compiler-generated pattern matching guarantees bounds safety.
> 2. **Subpattern Binding (`@`)**: In `payload @ ..`, `@` binds the rest of the slice view into `payload` without allocating new memory or copying bytes.
> 3. **Match Guards (`if (price as u64)...`)**: Match guards extend pattern capability by evaluating boolean expressions after structural matching succeeds. Note that match guards do not affect pattern exhaustiveness; the compiler treats guarded arms as refutable and requires unguarded or catch-all arms.
> 4. **Ownership and Move Semantics**: In `route_order(order: Order)`, struct field pattern matching `Order::Limit { price, quantity, .. }` destructures primitive scalar types (`u32`) which implement `Copy`. When passing `order` into `PriorityExecution(order)`, ownership of the original `order` value is moved cleanly without re-allocation.

---

### Exercise 2: AST Expression Optimizer and Evaluator with Nested Patterns and `@` Subpattern Bindings

**Problem Scenario:**
In database query engines and compiler intermediate representation (IR) pipelines, tree-structured Abstract Syntax Trees (ASTs) undergo algebraic simplification and constant folding passes to eliminate redundant calculations before code generation or query execution.

Implement an AST node representation `Expr` and optimization function `optimize_expr`:
- Use **recursive nested enum/struct pattern matching** to fold operations on literal numbers (e.g. `Add(Literal(a), Literal(b))` -> `Literal(a + b)`).
- Implement **algebraic identity reductions**:
  - `x + 0 => x`, `0 + x => x`
  - `x * 1 => x`, `1 * x => x`
  - `x * 0 => 0`, `0 * x => 0`
  - `x / 1 => x`
  - `0 / x => 0` (for non-zero `x`)
- Utilize `@` subpattern range bindings `Literal(b @ 1..=i64::MAX)` to safely capture non-zero divisors and prevent division by zero during compile-time folding.
- Implement an evaluation function `eval_expr` with environment variable lookups.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::HashMap;
> 
> #[derive(Debug, PartialEq, Eq, Clone)]
> pub enum Op {
>     Add,
>     Sub,
>     Mul,
>     Div,
> }
> 
> #[derive(Debug, PartialEq, Eq, Clone)]
> pub enum Expr {
>     Literal(i64),
>     Var(String),
>     Binary {
>         op: Op,
>         left: Box<Expr>,
>         right: Box<Expr>,
>     },
> }
> 
> #[derive(Debug, PartialEq, Eq, Clone)]
> pub enum EvalError {
>     DivisionByZero,
>     UnboundVariable(String),
> }
> 
> pub fn optimize_expr(expr: Expr) -> Expr {
>     match expr {
>         Expr::Binary { op, left, right } => {
>             let opt_left = Box::new(optimize_expr(*left));
>             let opt_right = Box::new(optimize_expr(*right));
> 
>             match (op, opt_left.as_ref(), opt_right.as_ref()) {
>                 // Constant Folding for Literals
>                 (Op::Add, Expr::Literal(a), Expr::Literal(b)) => Expr::Literal(a + b),
>                 (Op::Sub, Expr::Literal(a), Expr::Literal(b)) => Expr::Literal(a - b),
>                 (Op::Mul, Expr::Literal(a), Expr::Literal(b)) => Expr::Literal(a * b),
>                 (Op::Div, Expr::Literal(a), Expr::Literal(b @ 1..=i64::MAX)) => Expr::Literal(a / b),
>                 (Op::Div, Expr::Literal(a), Expr::Literal(b @ i64::MIN..=-1)) => Expr::Literal(a / b),
> 
>                 // Addition Identities: x + 0 = x, 0 + x = x
>                 (Op::Add, _, Expr::Literal(0)) => *opt_left,
>                 (Op::Add, Expr::Literal(0), _) => *opt_right,
> 
>                 // Subtraction Identities: x - 0 = x
>                 (Op::Sub, _, Expr::Literal(0)) => *opt_left,
> 
>                 // Multiplication Identities: x * 1 = x, 1 * x = x
>                 (Op::Mul, _, Expr::Literal(1)) => *opt_left,
>                 (Op::Mul, Expr::Literal(1), _) => *opt_right,
> 
>                 // Multiplication Annihilation: x * 0 = 0, 0 * x = 0
>                 (Op::Mul, _, Expr::Literal(0)) | (Op::Mul, Expr::Literal(0), _) => Expr::Literal(0),
> 
>                 // Division Identity: x / 1 = x
>                 (Op::Div, _, Expr::Literal(1)) => *opt_left,
> 
>                 // Division of 0 by non-zero denominator: 0 / x = 0 (x != 0)
>                 (Op::Div, Expr::Literal(0), Expr::Literal(denom)) if *denom != 0 => Expr::Literal(0),
> 
>                 // Non-foldable binary expression fallback
>                 (op, _, _) => Expr::Binary {
>                     op,
>                     left: opt_left,
>                     right: opt_right,
>                 },
>             }
>         }
>         // Base cases: Literals and Variables are already fully simplified
>         leaf => leaf,
>     }
> }
> 
> pub fn eval_expr(expr: &Expr, env: &HashMap<&str, i64>) -> Result<i64, EvalError> {
>     match expr {
>         Expr::Literal(val) => Ok(*val),
>         Expr::Var(name) => env
>             .get(name.as_str())
>             .copied()
>             .ok_or_else(|| EvalError::UnboundVariable(name.clone())),
>         Expr::Binary { op, left, right } => {
>             let l_val = eval_expr(left, env)?;
>             let r_val = eval_expr(right, env)?;
> 
>             match (op, r_val) {
>                 (Op::Div, 0) => Err(EvalError::DivisionByZero),
>                 (Op::Add, _) => Ok(l_val + r_val),
>                 (Op::Sub, _) => Ok(l_val - r_val),
>                 (Op::Mul, _) => Ok(l_val * r_val),
>                 (Op::Div, _) => Ok(l_val / r_val),
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
>     fn test_constant_folding_and_identities() {
>         // AST: (x * 1) + (10 - 4)
>         let raw_ast = Expr::Binary {
>             op: Op::Add,
>             left: Box::new(Expr::Binary {
>                 op: Op::Mul,
>                 left: Box::new(Expr::Var("x".to_string())),
>                 right: Box::new(Expr::Literal(1)),
>             }),
>             right: Box::new(Expr::Binary {
>                 op: Op::Sub,
>                 left: Box::new(Expr::Literal(10)),
>                 right: Box::new(Expr::Literal(4)),
>             }),
>         };
> 
>         let optimized = optimize_expr(raw_ast);
>         assert_eq!(
>             optimized,
>             Expr::Binary {
>                 op: Op::Add,
>                 left: Box::new(Expr::Var("x".to_string())),
>                 right: Box::new(Expr::Literal(6)),
>             }
>         );
> 
>         let mut env = HashMap::new();
>         env.insert("x", 14);
>         let res = eval_expr(&optimized, &env);
>         assert!(res.is_ok());
>         assert_eq!(res.unwrap(), 20);
>     }
> 
>     #[test]
>     fn test_zero_multiplication_and_division() {
>         // AST: (y + 100) * 0 => 0
>         let mul_zero = Expr::Binary {
>             op: Op::Mul,
>             left: Box::new(Expr::Binary {
>                 op: Op::Add,
>                 left: Box::new(Expr::Var("y".to_string())),
>                 right: Box::new(Expr::Literal(100)),
>             }),
>             right: Box::new(Expr::Literal(0)),
>         };
> 
>         let opt_zero = optimize_expr(mul_zero);
>         assert_eq!(opt_zero, Expr::Literal(0));
>         assert_ne!(opt_zero, Expr::Literal(1));
> 
>         let div_zero = Expr::Binary {
>             op: Op::Div,
>             left: Box::new(Expr::Literal(42)),
>             right: Box::new(Expr::Literal(0)),
>         };
> 
>         let env = HashMap::new();
>         let eval_err = eval_expr(&div_zero, &env);
>         assert!(matches!(eval_err, Err(EvalError::DivisionByZero)));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
>
>
> 1. **Tuple Matching (`(op, opt_left.as_ref(), opt_right.as_ref())`)**: Matching on a tuple of references allows inspecting deep structural properties across three separate variables (`op`, `left`, `right`) simultaneously without moving out of the `Box` heap allocation until a branch decision is made.
> 2. **Range Pattern with `@` Binding (`b @ 1..=i64::MAX`)**: Subpattern binding via `@` checks if the integer falls within the valid non-zero positive range while binding the matched value to variable `b`. This prevents runtime panics when calculating constant division.
> 3. **Box Dereferencing & Move Operations (`*opt_left`)**: When an identity arm like `(Op::Add, _, Expr::Literal(0)) => *opt_left` matches, dereferencing `*opt_left` moves the inner `Expr` out of the heap-allocated `Box<Expr>` and returns it directly, discarding the unneeded right operand cleanly.
> 4. **Exhaustiveness and Wildcards (`(op, _, _)`)**: Pattern matching in Rust requires every possible case to be handled. The wildcard pattern `_` handles any binary operator/operand combination that did not match an algebraic identity, preserving the un-foldable subtree.

---

### Exercise 3: Telemetry Event Stream Classifier and Storage Router

**Problem Scenario:**
Distributed cloud applications process millions of telemetry metrics and log records per minute. Ingestion nodes classify incoming event records based on geographic region, HTTP status code ranges, alert severity levels, and priority header flags to determine if the event should be routed to Hot, Warm, or Cold storage tiers or trigger immediate system alerts.

Implement a telemetry processing pipeline using Rust pattern matching:
- Parse array slice patterns `[b'U', b'S']`, `[b'E', b'U']`, `[b'A', b'P']` into structured `Region` variants.
- Match on `TelemetryRecord` using **tuple & struct patterns**, bitmask checks (`flags & 0x80`), and **range patterns** (`200..=299`, `500..=599`, `5..=u8::MAX`).
- Utilize **match guards** on HTTP response durations (`response_time_ms > 5000`) and system alert severities (`severity >= 3`) to dynamically escalate processing actions.
- Categorize records into `Action::TriggerImmediateAlert`, `Action::RouteLog { tier, region }`, or `Action::IgnoreMetric`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq, Clone)]
> pub enum Region {
>     NorthAmerica,
>     Europe,
>     AsiaPacific,
>     Unknown([u8; 2]),
> }
> 
> #[derive(Debug, PartialEq, Eq, Clone)]
> pub enum LogPayload {
>     HttpAccess { status_code: u16, response_time_ms: u32, path: String },
>     DatabaseQuery { duration_ms: u32, query_type: String },
>     SystemAlert { severity: u8, code: u32, message: String },
>     RawMetric { metric_id: u32, value: i64 },
> }
> 
> #[derive(Debug, PartialEq, Eq, Clone)]
> pub struct TelemetryRecord {
>     pub client_id: u64,
>     pub region_code: [u8; 2],
>     pub flags: u8, // Bit 7 (0x80): High Priority / Hot Storage
>     pub payload: LogPayload,
> }
> 
> #[derive(Debug, PartialEq, Eq, Clone)]
> pub enum RoutingTier {
>     HotStorage,
>     WarmStorage,
>     ColdStorage,
> }
> 
> #[derive(Debug, PartialEq, Eq, Clone)]
> pub enum Action {
>     TriggerImmediateAlert { region: Region, code: u32, msg: String },
>     RouteLog { tier: RoutingTier, region: Region },
>     IgnoreMetric,
> }
> 
> pub fn parse_region(code: &[u8; 2]) -> Region {
>     match code {
>         [b'U', b'S'] => Region::NorthAmerica,
>         [b'E', b'U'] => Region::Europe,
>         [b'A', b'P'] => Region::AsiaPacific,
>         other => Region::Unknown(*other),
>     }
> }
> 
> pub fn classify_and_route(record: &TelemetryRecord) -> Action {
>     let region = parse_region(&record.region_code);
>     let is_hot_priority = (record.flags & 0x80) != 0;
> 
>     match (&record.payload, is_hot_priority) {
>         // Critical system alerts (severity >= 5) trigger immediate alerts regardless of priority flag
>         (LogPayload::SystemAlert { severity @ 5..=u8::MAX, code, message }, _) => {
>             Action::TriggerImmediateAlert {
>                 region,
>                 code: *code,
>                 msg: message.clone(),
>             }
>         }
>         // Medium-high severity alerts (severity >= 3) with high priority flag
>         (LogPayload::SystemAlert { severity, code, message }, true) if *severity >= 3 => {
>             Action::TriggerImmediateAlert {
>                 region,
>                 code: *code,
>                 msg: message.clone(),
>             }
>         }
> 
>         // HTTP 5xx Server Errors or latency spikes exceeding 5000ms route to Hot Storage
>         (LogPayload::HttpAccess { status_code: 500..=599, .. }, _)
>         | (LogPayload::HttpAccess { response_time_ms, .. }, _) if *response_time_ms > 5000 => {
>             Action::RouteLog {
>                 tier: RoutingTier::HotStorage,
>                 region,
>             }
>         }
> 
>         // High priority HTTP access or long DB queries route to Hot Storage
>         (LogPayload::HttpAccess { status_code: 200..=499, .. }, true)
>         | (LogPayload::DatabaseQuery { duration_ms: 1000..=u32::MAX, .. }, _) => {
>             Action::RouteLog {
>                 tier: RoutingTier::HotStorage,
>                 region,
>             }
>         }
> 
>         // Standard HTTP access & DB queries route to Warm Storage
>         (LogPayload::HttpAccess { .. }, false) | (LogPayload::DatabaseQuery { .. }, _) => {
>             Action::RouteLog {
>                 tier: RoutingTier::WarmStorage,
>                 region,
>             }
>         }
> 
>         // Low severity alerts fallback to Cold Storage
>         (LogPayload::SystemAlert { .. }, _) => Action::RouteLog {
>             tier: RoutingTier::ColdStorage,
>             region,
>         },
> 
>         // Raw metrics ignored in default log router stream
>         (LogPayload::RawMetric { .. }, _) => Action::IgnoreMetric,
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_high_severity_alert_routing() {
>         let record = TelemetryRecord {
>             client_id: 1001,
>             region_code: [b'E', b'U'],
>             flags: 0x00,
>             payload: LogPayload::SystemAlert {
>                 severity: 5,
>                 code: 9001,
>                 message: "Kernel OOM Killer invoked".to_string(),
>             },
>         };
> 
>         let action = classify_and_route(&record);
>         assert!(matches!(action, Action::TriggerImmediateAlert { .. }));
> 
>         if let Action::TriggerImmediateAlert { region, code, msg } = action {
>             assert_eq!(region, Region::Europe);
>             assert_eq!(code, 9001);
>             assert_eq!(msg, "Kernel OOM Killer invoked");
>         } else {
>             panic!("Expected TriggerImmediateAlert");
>         }
>     }
> 
>     #[test]
>     fn test_http_slow_response_and_hot_storage() {
>         let slow_http = TelemetryRecord {
>             client_id: 2002,
>             region_code: [b'U', b'S'],
>             flags: 0x00,
>             payload: LogPayload::HttpAccess {
>                 status_code: 200,
>                 response_time_ms: 6000,
>                 path: "/api/checkout".to_string(),
>             },
>         };
> 
>         let action = classify_and_route(&slow_http);
>         assert_eq!(
>             action,
>             Action::RouteLog {
>                 tier: RoutingTier::HotStorage,
>                 region: Region::NorthAmerica,
>             }
>         );
> 
>         let fast_http = TelemetryRecord {
>             client_id: 2002,
>             region_code: [b'A', b'P'],
>             flags: 0x00,
>             payload: LogPayload::HttpAccess {
>                 status_code: 200,
>                 response_time_ms: 50,
>                 path: "/health".to_string(),
>             },
>         };
>         let fast_action = classify_and_route(&fast_http);
>         assert_ne!(fast_action, action);
>         assert_eq!(
>             fast_action,
>             Action::RouteLog {
>                 tier: RoutingTier::WarmStorage,
>                 region: Region::AsiaPacific,
>             }
>         );
> 
>         let raw_metric = TelemetryRecord {
>             client_id: 3003,
>             region_code: [b'X', b'Y'],
>             flags: 0x00,
>             payload: LogPayload::RawMetric { metric_id: 42, value: 100 },
>         };
>         assert!(matches!(classify_and_route(&raw_metric), Action::IgnoreMetric));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
>
>
> 1. **Fixed-Size Array Slice Patterns (`[b'U', b'S']`)**: Matching array values directly using slice syntax (`[b'U', b'S']`) works because fixed-size array byte representations support pattern matching. The fallback arm `other` binds any non-matching 2-byte array.
> 2. **Ref-Matching `(&record.payload, is_hot_priority)`**: Passing `&record.payload` into `match` borrows the payload reference instead of taking ownership. This allows `classify_and_route` to operate on borrowed `&TelemetryRecord` instances without requiring `Clone` or heap allocations.
> 3. **Range Patterns in Struct Destructuring (`status_code: 500..=599`)**: Rust allows range patterns directly inside named struct fields during enum destructuring, enabling concise HTTP status classification without nested `if/else` checks.
> 4. **Pattern OR Chains (`|`) with Match Guards**: Pattern arms can join multiple patterns using `|`. When combining pattern OR chains with match guards (e.g. `(LogPayload::HttpAccess { ... }) | (LogPayload::HttpAccess { ... }) if ...`), the guard condition applies to any pattern in the chain before entering the arm body.

---

## 6. Related Terms


- [`if let` / `while let`](if_let_while_let.md) — Syntactic sugar that relies entirely on refutable pattern matching.
- [Struct](struct.md) — You can also use pattern matching to destructure Structs to get their inner fields!
- [`let else` Statement](let_else_statement.md) — Related concept: `let else` Statement.
- [`matches!` Macro](matches_macro.md) — Related concept: `matches!` Macro.
- [Tuple Struct](tuple_struct.md) — Related concept: Tuple Struct.
- [Partial Moves & Partial Borrows](../level_03/partial_moves.md) — Related concept: Partial Moves & Partial Borrows.

---

## 7. Key Takeaways

- **Pattern Matching** allows you to test the shape of data and instantly extract (destructure) its inner contents.
- It is used almost everywhere: in `match`, `if let`, function parameters, and even basic `let` statements.
- **Irrefutable** patterns always match (like extracting from a Tuple). They are required for `let` statements.
- **Refutable** patterns might fail (like checking if a number is exactly `5`). They require `match` or `if let`.
- You can add `if` conditions to match arms, known as **Match Guards** (e.g., `(x, y) if x == y => ...`).
