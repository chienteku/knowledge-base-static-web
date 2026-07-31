# `match`

> **Level 2 — Control Flow & Data Structures**
> Pattern matching expression; must be exhaustive over all possible variants.

---

## 1. Prerequisites

- [`if` / `else`](../level_02/if_else.md) — The basic branching logic that `match` often replaces when things get complex.
- [Expressions](../level_01/expressions.md) — Because `match` is an expression, it can return a value directly to a variable.

---

## 2. Term Category

**Rust-specific (the strict safety)**: `match` is the Rust equivalent of the `switch` statement found in C, Java, or JavaScript. However, Rust elevates it by enforcing strict **exhaustiveness** (you must handle every possible case) and by making it an expression.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The traditional `switch` statement in older languages is infamous for causing bugs. Two major issues exist:
1. **Fallthrough**: If you forget to write the `break` keyword at the end of a `switch` case, the code accidentally "falls through" and executes the next case too.
2. **Missing cases**: You can easily forget to handle a specific value, leading to unexpected runtime behavior.

Rust designed the `match` expression to completely eliminate these bugs. 
First, there is no "fallthrough" in Rust. Once a `match` arm is chosen, it executes that block and immediately exits.
Second, `match` is **exhaustive**. The compiler will literally refuse to compile your code if it detects that you haven't handled every single possible value. To handle "everything else", Rust uses the `_` (underscore) character as a catch-all.

### (2) Reality Metaphor

Imagine you are a postal worker sorting physical mail. 

A traditional `switch` statement is like having a few specific slots for standard letters. If a weirdly shaped package arrives, you might just throw it on the floor because you forgot to build a slot for it. 

A Rust `match` statement is like having a strict postmaster hovering over your shoulder. They demand that every single piece of mail has a designated slot. To guarantee this, they force you to put a large "Catch-All" bin (`_`) at the end of your desk so that absolutely nothing is dropped on the floor.

### (3) Rust Code Examples

#### Short Snippet
```rust
let dice_roll = 4;

// Matching against a number. 
match dice_roll {
    1 => println!("Critical failure!"),
    6 => println!("Critical success!"),
    // The `_` is the catch-all. It handles 2, 3, 4, 5, 
    // and literally any other integer.
    _ => println!("A normal roll."),
}
```

#### Fuller Example
```rust
fn main() {
    let traffic_light = "Yellow";
    
    // Because `match` is an expression, we can assign the result 
    // directly to the `action` variable.
    let action = match traffic_light {
        "Green" => "Go",
        "Yellow" => "Slow down",
        "Red" => "Stop",
        // If the string is anything else (e.g. "Purple" or "Broken"),
        // the catch-all handles it safely.
        _ => "Proceed with caution",
    };
    
    println!("The light is {}. Action: {}", traffic_light, action);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Match Scoping and Lifecycle Rules

**The mistake:** Assuming Match instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("match_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("match_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Match State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Match through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Match Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Match instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Telemetry Network Packet Dispatcher & Filter Engine

**Problem:** You are building an edge IoT gateway that ingests telemetry packet frames over TCP/UDP network sockets. The gateway must classify incoming frames and emit routing directives to backend microservices.

Define the telemetry structures and write a function `route_frame(frame: &NetworkFrame) -> RoutingDirective` that uses pattern matching with destructuring, ranges, pattern binding (`@`), and match guards (`if`) to enforce the following business rules:

1. **Telemetry Frames**:
   - If `retry_count > 5`, quarantine the node with reason `"Excessive retries"`.
   - If `metric` is `Temperature` and `value` is out of safe operational range (greater than `100.0` or less than `-40.0`), issue a `CriticalAlarm` containing a formatted string message.
   - If `metric` is `Voltage` and `value` is within nominal operating range (`11.4` to `12.6`), issue `LogNormal`.
   - All other telemetry frames default to `LogNormal`.
2. **Control Commands**:
   - Priority `8..=10`: route to `HighPriorityDispatch`.
   - Priority `1..=7`: route to `StandardQueue`.
   - Priority `0` or any out-of-range priority: `DropFrame`.
3. **Heartbeat Frames**:
   - If `status_flags & 0x80 != 0` (hardware error bit set), quarantine the node with reason `"Hardware fault flag set"`.
   - Otherwise, issue `LogNormal`.
4. **Malformed Frames**:
   - Error code in range `400..=499`: quarantine node 0 with reason `"Client protocol violation"`.
   - Error code in range `500..=599`: issue `RetryPayload` preserving the error code.
   - Any other error code: `DropFrame`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Clone)]
> pub enum MetricType {
>     Temperature,
>     Voltage,
>     Vibration,
> }
> 
> #[derive(Debug, PartialEq, Clone)]
> pub enum NetworkFrame {
>     Telemetry {
>         sensor_id: u32,
>         metric: MetricType,
>         value: f64,
>         retry_count: u8,
>     },
>     ControlCommand {
>         client_id: u64,
>         priority: u8,
>     },
>     Heartbeat {
>         node_id: u32,
>         status_flags: u8,
>     },
>     Malformed {
>         raw_bytes: Vec<u8>,
>         error_code: u16,
>     },
> }
> 
> #[derive(Debug, PartialEq, Clone)]
> pub enum RoutingDirective {
>     CriticalAlarm { sensor_id: u32, message: String },
>     LogNormal,
>     HighPriorityDispatch { client_id: u64 },
>     StandardQueue { client_id: u64 },
>     QuarantineNode { id: u32, reason: &'static str },
>     RetryPayload { code: u16 },
>     DropFrame,
> }
> 
> pub fn route_frame(frame: &NetworkFrame) -> RoutingDirective {
>     match frame {
>         // 1. Telemetry: Check for excessive retries first via guard
>         NetworkFrame::Telemetry { sensor_id, retry_count, .. } if *retry_count > 5 => {
>             RoutingDirective::QuarantineNode {
>                 id: *sensor_id,
>                 reason: "Excessive retries",
>             }
>         }
>         // Telemetry: Temperature out-of-bounds alarm
>         NetworkFrame::Telemetry {
>             sensor_id,
>             metric: MetricType::Temperature,
>             value,
>             ..
>         } if *value > 100.0 || *value < -40.0 => {
>             RoutingDirective::CriticalAlarm {
>                 sensor_id: *sensor_id,
>                 message: format!("Temperature out of bounds: {:.1}", value),
>             }
>         }
>         // Telemetry: Nominal Voltage check using guard range
>         NetworkFrame::Telemetry {
>             metric: MetricType::Voltage,
>             value,
>             ..
>         } if (11.4..=12.6).contains(value) => RoutingDirective::LogNormal,
>         // Telemetry fallback
>         NetworkFrame::Telemetry { .. } => RoutingDirective::LogNormal,
> 
>         // 2. Control Commands: Sub-range pattern matching with @ binding
>         NetworkFrame::ControlCommand {
>             client_id,
>             priority: 8..=10,
>         } => RoutingDirective::HighPriorityDispatch { client_id: *client_id },
>         NetworkFrame::ControlCommand {
>             client_id,
>             priority: 1..=7,
>         } => RoutingDirective::StandardQueue { client_id: *client_id },
>         NetworkFrame::ControlCommand { .. } => RoutingDirective::DropFrame,
> 
>         // 3. Heartbeat: Bitwise flag evaluation via guard
>         NetworkFrame::Heartbeat {
>             node_id,
>             status_flags,
>         } if (status_flags & 0x80) != 0 => RoutingDirective::QuarantineNode {
>             id: *node_id,
>             reason: "Hardware fault flag set",
>         },
>         NetworkFrame::Heartbeat { .. } => RoutingDirective::LogNormal,
> 
>         // 4. Malformed: Range patterns and code binding
>         NetworkFrame::Malformed {
>             error_code: 400..=499,
>             ..
>         } => RoutingDirective::QuarantineNode {
>             id: 0,
>             reason: "Client protocol violation",
>         },
>         NetworkFrame::Malformed {
>             error_code: code @ 500..=599,
>             ..
>         } => RoutingDirective::RetryPayload { code: *code },
>         NetworkFrame::Malformed { .. } => RoutingDirective::DropFrame,
>     }
> }
> 
> fn main() {
>     let frame = NetworkFrame::Telemetry {
>         sensor_id: 101,
>         metric: MetricType::Temperature,
>         value: 105.5,
>         retry_count: 1,
>     };
>     let directive = route_frame(&frame);
>     println!("Routing result: {:?}", directive);
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_telemetry_routing() {
>         let high_temp = NetworkFrame::Telemetry {
>             sensor_id: 42,
>             metric: MetricType::Temperature,
>             value: 120.0,
>             retry_count: 0,
>         };
>         let directive = route_frame(&high_temp);
>         assert!(matches!(directive, RoutingDirective::CriticalAlarm { .. }));
>         assert_eq!(
>             directive,
>             RoutingDirective::CriticalAlarm {
>                 sensor_id: 42,
>                 message: "Temperature out of bounds: 120.0".to_string()
>             }
>         );
> 
>         let normal_voltage = NetworkFrame::Telemetry {
>             sensor_id: 43,
>             metric: MetricType::Voltage,
>             value: 12.0,
>             retry_count: 2,
>         };
>         assert_eq!(route_frame(&normal_voltage), RoutingDirective::LogNormal);
> 
>         let excessive_retries = NetworkFrame::Telemetry {
>             sensor_id: 44,
>             metric: MetricType::Vibration,
>             value: 1.0,
>             retry_count: 6,
>         };
>         assert_eq!(
>             route_frame(&excessive_retries),
>             RoutingDirective::QuarantineNode {
>                 id: 44,
>                 reason: "Excessive retries"
>             }
>         );
>     }
> 
>     #[test]
>     fn test_control_and_heartbeat_routing() {
>         let cmd_high = NetworkFrame::ControlCommand {
>             client_id: 99,
>             priority: 9,
>         };
>         let cmd_low = NetworkFrame::ControlCommand {
>             client_id: 99,
>             priority: 0,
>         };
>         assert_eq!(
>             route_frame(&cmd_high),
>             RoutingDirective::HighPriorityDispatch { client_id: 99 }
>         );
>         assert_ne!(route_frame(&cmd_high), route_frame(&cmd_low));
>         assert_eq!(route_frame(&cmd_low), RoutingDirective::DropFrame);
> 
>         let hb_fault = NetworkFrame::Heartbeat {
>             node_id: 7,
>             status_flags: 0b1000_0001,
>         };
>         assert!(matches!(
>             route_frame(&hb_fault),
>             RoutingDirective::QuarantineNode { id: 7, .. }
>         ));
>     }
> 
>     #[test]
>     fn test_malformed_frame_routing() {
>         let client_err = NetworkFrame::Malformed {
>             raw_bytes: vec![0xDE, 0xAD],
>             error_code: 404,
>         };
>         let server_err = NetworkFrame::Malformed {
>             raw_bytes: vec![0xBE, 0xEF],
>             error_code: 503,
>         };
>         assert_eq!(
>             route_frame(&client_err),
>             RoutingDirective::QuarantineNode {
>                 id: 0,
>                 reason: "Client protocol violation"
>             }
>         );
>         assert_eq!(
>             route_frame(&server_err),
>             RoutingDirective::RetryPayload { code: 503 }
>         );
>     }
> }
> ```
>
> #### Technical Explanation
>
>
>
>
> 1. **Pattern Matching & Borrowing Semantics**:
>    Passing `&NetworkFrame` into `match frame` causes pattern variables to bind by reference (`&u32`, `&f64`, `&u8`). To compare primitive values inside match guards, we explicitly dereference parameters (`*retry_count > 5`, `*value > 100.0`).
>
> 2. **Match Guard Mechanics**:
>    Match guards (`if condition`) execute dynamically at runtime after the structural pattern matches. If a match guard evaluates to `false`, control falls through to subsequent match arms.
>
> 3. **Sub-Range & Pattern Binding (`@`)**:
>    The syntax `code @ 500..=599` binds the value of `error_code` to the local variable `code` if and only if it falls within the closed range `500..=599`.
>
> 4. **Exhaustiveness and Fallthrough Guarantee**:
>    Rust compiler guarantees exhaustiveness. Wildcard pattern arms `NetworkFrame::Telemetry { .. }` and catch-all arms ensure that all enum variants and all potential integer/floating-point values are handled cleanly.

---

### Exercise 2: Algorithmic Trading Risk Engine & Batch Order Processor

**Problem:** An electronic trading execution engine processes incoming orders (`OrderRequest`) and validates risk controls using multi-variable pattern matching and slice recursion.

Requirements:
1. `validate_order(order: &OrderRequest) -> ValidationResult`:
   Match on the tuple `(&order.tier, &order.order_type, order.quantity)`:
   - **Retail accounts**:
     - `Market` orders with `quantity > 1000`: reject with reason `"Retail market order size exceeded"`.
     - `Limit` orders where total value (`price * quantity`) exceeds `account_balance`: reject with reason `"Insufficient balance"`.
     - `StopLoss` orders: require `ManualReviewRequired`.
     - Standard valid orders: `Approved`.
   - **VIP accounts**:
     - `Market` orders with `quantity > 50_000`: reject with reason `"VIP market order size exceeded"`.
     - `Limit` orders exceeding `account_balance`: reject with reason `"Insufficient balance"`.
     - `StopLoss` orders: `Approved`.
     - Standard valid orders: `Approved`.
   - **Institutional accounts**:
     - `quantity > 1_000_000`: `ManualReviewRequired` for compliance audit.
     - Standard valid orders: `Approved`.

2. `process_batch_slice(orders: &[OrderRequest]) -> (usize, usize, usize)`:
   Use slice pattern matching (`[]` and `[head, tail @ ..]`) to recursively evaluate order slices and aggregate counts `(approved_count, rejected_count, review_count)`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Clone, Copy)]
> pub enum AccountTier {
>     Retail,
>     VIP,
>     Institutional,
> }
> 
> #[derive(Debug, PartialEq, Clone)]
> pub enum OrderType {
>     Market { side: &'static str },
>     Limit { side: &'static str, price: u64 },
>     StopLoss { trigger_price: u64 },
> }
> 
> #[derive(Debug, PartialEq, Clone)]
> pub struct OrderRequest {
>     pub order_id: u64,
>     pub account_id: u64,
>     pub tier: AccountTier,
>     pub order_type: OrderType,
>     pub quantity: u32,
>     pub account_balance: u64,
> }
> 
> #[derive(Debug, PartialEq, Clone)]
> pub enum ValidationResult {
>     Approved { order_id: u64 },
>     RejectedRiskLimit { order_id: u64, reason: &'static str },
>     ManualReviewRequired { order_id: u64 },
> }
> 
> pub fn validate_order(order: &OrderRequest) -> ValidationResult {
>     let id = order.order_id;
>     match (&order.tier, &order.order_type, order.quantity) {
>         // Retail Rules
>         (AccountTier::Retail, OrderType::Market { .. }, qty) if qty > 1000 => {
>             ValidationResult::RejectedRiskLimit {
>                 order_id: id,
>                 reason: "Retail market order size exceeded",
>             }
>         }
>         (AccountTier::Retail, OrderType::Limit { price, .. }, qty)
>             if (*price as u128 * qty as u128) > order.account_balance as u128 =>
>         {
>             ValidationResult::RejectedRiskLimit {
>                 order_id: id,
>                 reason: "Insufficient balance",
>             }
>         }
>         (AccountTier::Retail, OrderType::StopLoss { .. }, _) => {
>             ValidationResult::ManualReviewRequired { order_id: id }
>         }
> 
>         // VIP Rules
>         (AccountTier::VIP, OrderType::Market { .. }, qty) if qty > 50_000 => {
>             ValidationResult::RejectedRiskLimit {
>                 order_id: id,
>                 reason: "VIP market order size exceeded",
>             }
>         }
>         (AccountTier::VIP, OrderType::Limit { price, .. }, qty)
>             if (*price as u128 * qty as u128) > order.account_balance as u128 =>
>         {
>             ValidationResult::RejectedRiskLimit {
>                 order_id: id,
>                 reason: "Insufficient balance",
>             }
>         }
> 
>         // Institutional Rules
>         (AccountTier::Institutional, _, qty) if qty > 1_000_000 => {
>             ValidationResult::ManualReviewRequired { order_id: id }
>         }
> 
>         // Default approval for all valid combinations
>         _ => ValidationResult::Approved { order_id: id },
>     }
> }
> 
> pub fn process_batch_slice(orders: &[OrderRequest]) -> (usize, usize, usize) {
>     match orders {
>         [] => (0, 0, 0),
>         [head, tail @ ..] => {
>             let (app, rej, rev) = match validate_order(head) {
>                 ValidationResult::Approved { .. } => (1, 0, 0),
>                 ValidationResult::RejectedRiskLimit { .. } => (0, 1, 0),
>                 ValidationResult::ManualReviewRequired { .. } => (0, 0, 1),
>             };
>             let (t_app, t_rej, t_rev) = process_batch_slice(tail);
>             (app + t_app, rej + t_rej, rev + t_rev)
>         }
>     }
> }
> 
> fn main() {
>     let req = OrderRequest {
>         order_id: 1,
>         account_id: 88,
>         tier: AccountTier::VIP,
>         order_type: OrderType::Market { side: "BUY" },
>         quantity: 500,
>         account_balance: 10_000_000,
>     };
>     println!("Order outcome: {:?}", validate_order(&req));
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_validate_retail_orders() {
>         let retail_market_large = OrderRequest {
>             order_id: 1,
>             account_id: 100,
>             tier: AccountTier::Retail,
>             order_type: OrderType::Market { side: "BUY" },
>             quantity: 5000,
>             account_balance: 100_000,
>         };
>         let res = validate_order(&retail_market_large);
>         assert!(matches!(res, ValidationResult::RejectedRiskLimit { .. }));
>         assert_eq!(
>             res,
>             ValidationResult::RejectedRiskLimit {
>                 order_id: 1,
>                 reason: "Retail market order size exceeded"
>             }
>         );
>
>         let retail_stop_loss = OrderRequest {
>             order_id: 2,
>             account_id: 100,
>             tier: AccountTier::Retail,
>             order_type: OrderType::StopLoss { trigger_price: 150 },
>             quantity: 500,
>             account_balance: 50_000,
>         };
>         assert_eq!(
>             validate_order(&retail_stop_loss),
>             ValidationResult::ManualReviewRequired { order_id: 2 }
>         );
>     }
> 
>     #[test]
>     fn test_batch_slice_processing() {
>         let orders = vec![
>             OrderRequest {
>                 order_id: 10,
>                 account_id: 200,
>                 tier: AccountTier::VIP,
>                 order_type: OrderType::Market { side: "BUY" },
>                 quantity: 1000,
>                 account_balance: 1_000_000,
>             },
>             OrderRequest {
>                 order_id: 11,
>                 account_id: 201,
>                 tier: AccountTier::Retail,
>                 order_type: OrderType::Market { side: "SELL" },
>                 quantity: 2000,
>                 account_balance: 10_000,
>             },
>             OrderRequest {
>                 order_id: 12,
>                 account_id: 202,
>                 tier: AccountTier::Institutional,
>                 order_type: OrderType::Limit { side: "BUY", price: 10 },
>                 quantity: 5_000_000,
>                 account_balance: 100_000_000,
>             },
>         ];
>
>         let counts = process_batch_slice(&orders);
>         assert_eq!(counts, (1, 1, 1));
>         assert_ne!(counts, (3, 0, 0));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
>
>
> 1. **Multi-Variable Tuple Destructuring**:
>    By matching on `(&order.tier, &order.order_type, order.quantity)`, Rust evaluates multiple orthogonal dimensions of state simultaneously without requiring deeply nested `if/else` statements.
>
> 2. **Slice Pattern Matching & `@` Binding**:
>    The pattern `[head, tail @ ..]` splits a slice reference `&[T]` into its first element `head: &T` and the remaining sub-slice `tail: &[T]`. This allows recursive batch evaluation without dynamic memory allocation or vector reallocation.
>
> 3. **Numeric Overflow Prevention**:
>    When multiplying `price * quantity` in match guard checks, values are safely cast to `u128` (`*price as u128 * qty as u128`) to prevent unexpected integer overflow panics during financial limit calculations.
>
> 4. **Exhaustive Wildcards (`_`)**:
>    The fallback arm `_ => ValidationResult::Approved { order_id: id }` guarantees that all unflagged combinations pass risk validation cleanly.

---

### Exercise 3: Abstract Syntax Tree (AST) Compiler Optimizer & Evaluator

**Problem:** Design a constant-folding pass and evaluation engine for a domain-specific mathematical language represented as an AST `Expr`.

Requirements:
1. `fold_constants(expr: Expr) -> Expr`:
   Recursively optimizes the tree using pattern matching over `Expr`:
   - `Binary`:
     - First fold `left` and `right`.
     - Evaluate arithmetic operations on two `Literal` nodes: `Add`, `Sub`, `Mul`, `Div` (when divisor != 0).
     - Apply algebraic identities:
       - `x + 0` or `0 + x` -> `x`
       - `x - 0` -> `x`
       - `x * 0` or `0 * x` -> `Literal(0)`
       - `x * 1` or `1 * x` -> `x`
     - Otherwise return optimized `Binary` node.
   - `Negate`:
     - Fold `inner`.
     - `Negate(Literal(n))` -> `Literal(-n)`.
     - `Negate(Negate(x))` -> `x` (double negation cancellation).
     - Otherwise return optimized `Negate` node.
   - `IfZero`:
     - Fold `cond`.
     - If `cond` is `Literal(0)`, return folded `then_branch`.
     - If `cond` is `Literal(n)` where `n != 0`, return folded `else_branch`.
     - Otherwise return optimized `IfZero` node with folded sub-expressions.
   - `Literal(n)` and `Variable(name)` remain unchanged.

2. `eval(expr: &Expr, env: &std::collections::HashMap<String, i64>) -> Result<i64, String>`:
   Evaluates an AST node against a variable context environment using pattern matching.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::HashMap;
> 
> #[derive(Debug, PartialEq, Clone)]
> pub enum Operator {
>     Add,
>     Sub,
>     Mul,
>     Div,
> }
> 
> #[derive(Debug, PartialEq, Clone)]
> pub enum Expr {
>     Literal(i64),
>     Variable(String),
>     Binary {
>         op: Operator,
>         left: Box<Expr>,
>         right: Box<Expr>,
>     },
>     Negate(Box<Expr>),
>     IfZero {
>         cond: Box<Expr>,
>         then_branch: Box<Expr>,
>         else_branch: Box<Expr>,
>     },
> }
> 
> pub fn fold_constants(expr: Expr) -> Expr {
>     match expr {
>         Expr::Binary { op, left, right } => {
>             let l_folded = fold_constants(*left);
>             let r_folded = fold_constants(*right);
> 
>             match (op, l_folded, r_folded) {
>                 // Constant arithmetic folding
>                 (Operator::Add, Expr::Literal(a), Expr::Literal(b)) => Expr::Literal(a + b),
>                 (Operator::Sub, Expr::Literal(a), Expr::Literal(b)) => Expr::Literal(a - b),
>                 (Operator::Mul, Expr::Literal(a), Expr::Literal(b)) => Expr::Literal(a * b),
>                 (Operator::Div, Expr::Literal(a), Expr::Literal(b)) if b != 0 => Expr::Literal(a / b),
> 
>                 // Algebraic identity optimizations
>                 (Operator::Add, l, Expr::Literal(0)) | (Operator::Add, Expr::Literal(0), l) => l,
>                 (Operator::Sub, l, Expr::Literal(0)) => l,
>                 (Operator::Mul, _, Expr::Literal(0)) | (Operator::Mul, Expr::Literal(0), _) => Expr::Literal(0),
>                 (Operator::Mul, l, Expr::Literal(1)) | (Operator::Mul, Expr::Literal(1), l) => l,
> 
>                 // Non-foldable binary expression
>                 (op, l, r) => Expr::Binary {
>                     op,
>                     left: Box::new(l),
>                     right: Box::new(r),
>                 },
>             }
>         }
>         Expr::Negate(inner) => {
>             let folded_inner = fold_constants(*inner);
>             match folded_inner {
>                 Expr::Literal(n) => Expr::Literal(-n),
>                 Expr::Negate(nested) => *nested, // Double negation cancellation
>                 other => Expr::Negate(Box::new(other)),
>             }
>         }
>         Expr::IfZero {
>             cond,
>             then_branch,
>             else_branch,
>         } => {
>             let folded_cond = fold_constants(*cond);
>             match folded_cond {
>                 Expr::Literal(0) => fold_constants(*then_branch),
>                 Expr::Literal(_) => fold_constants(*else_branch),
>                 other_cond => Expr::IfZero {
>                     cond: Box::new(other_cond),
>                     then_branch: Box::new(fold_constants(*then_branch)),
>                     else_branch: Box::new(fold_constants(*else_branch)),
>                 },
>             }
>         }
>         Expr::Literal(val) => Expr::Literal(val),
>         Expr::Variable(name) => Expr::Variable(name),
>     }
> }
> 
> pub fn eval(expr: &Expr, env: &HashMap<String, i64>) -> Result<i64, String> {
>     match expr {
>         Expr::Literal(n) => Ok(*n),
>         Expr::Variable(var_name) => env
>             .get(var_name)
>             .copied()
>             .ok_or_else(|| format!("Undefined variable: {}", var_name)),
>         Expr::Negate(inner) => eval(inner, env).map(|val| -val),
>         Expr::Binary { op, left, right } => {
>             let l_val = eval(left, env)?;
>             let r_val = eval(right, env)?;
>             match op {
>                 Operator::Add => Ok(l_val + r_val),
>                 Operator::Sub => Ok(l_val - r_val),
>                 Operator::Mul => Ok(l_val * r_val),
>                 Operator::Div => {
>                     if r_val == 0 {
>                         Err("Division by zero".to_string())
>                     } else {
>                         Ok(l_val / r_val)
>                     }
>                 }
>             }
>         }
>         Expr::IfZero {
>             cond,
>             then_branch,
>             else_branch,
>         } => {
>             let c_val = eval(cond, env)?;
>             if c_val == 0 {
>                 eval(then_branch, env)
>             } else {
>                 eval(else_branch, env)
>             }
>         }
>     }
> }
> 
> fn main() {
>     let expr = Expr::Binary {
>         op: Operator::Add,
>         left: Box::new(Expr::Literal(5)),
>         right: Box::new(Expr::Literal(10)),
>     };
>     let folded = fold_constants(expr);
>     println!("Folded AST: {:?}", folded);
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_ast_constant_folding() {
>         // Construct: (x * 1) + (10 + 20)
>         let unoptimized = Expr::Binary {
>             op: Operator::Add,
>             left: Box::new(Expr::Binary {
>                 op: Operator::Mul,
>                 left: Box::new(Expr::Variable("x".to_string())),
>                 right: Box::new(Expr::Literal(1)),
>             }),
>             right: Box::new(Expr::Binary {
>                 op: Operator::Add,
>                 left: Box::new(Expr::Literal(10)),
>                 right: Box::new(Expr::Literal(20)),
>             }),
>         };
> 
>         let optimized = fold_constants(unoptimized.clone());
>         assert_ne!(unoptimized, optimized);
> 
>         // Should optimize to: x + 30
>         let expected = Expr::Binary {
>             op: Operator::Add,
>             left: Box::new(Expr::Variable("x".to_string())),
>             right: Box::new(Expr::Literal(30)),
>         };
>         assert_eq!(optimized, expected);
>     }
> 
>     #[test]
>     fn test_ast_eval_and_dead_branch_elimination() {
>         // IfZero(Literal(0), Literal(42), Variable("dead"))
>         let dead_branch_expr = Expr::IfZero {
>             cond: Box::new(Expr::Literal(0)),
>             then_branch: Box::new(Expr::Literal(42)),
>             else_branch: Box::new(Expr::Variable("dead".to_string())),
>         };
> 
>         let folded = fold_constants(dead_branch_expr);
>         assert!(matches!(folded, Expr::Literal(42)));
>         assert_eq!(folded, Expr::Literal(42));
> 
>         let mut env = HashMap::new();
>         env.insert("x".to_string(), 12);
>         let res = eval(&folded, &env);
>         assert_eq!(res, Ok(42));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
>
>
> 1. **Deep Nested Structural Matching**:
>    Rust's `match` can inspect recursively nested enum payloads in a single arm (e.g., `(Operator::Add, Expr::Literal(a), Expr::Literal(b))`). This makes tree transformation passes concise and clear.
> 
> 2. **Recursive Ownership Transfers**:
>    Because `fold_constants` takes `expr: Expr` by value, matching destructures inner `Box<Expr>` values. Dereferencing `*left` moves the heap-allocated sub-expression out of the box into the recursive call safely.
> 
> 3. **Dead Branch Elimination & Algebraic Simplification**:
>    When `IfZero` has a known constant condition `Literal(0)` or `Literal(non_zero)`, pattern matching collapses the entire conditional branch at compile/optimization time, discarding dead sub-trees completely.
> 
> 4. **Error Propagation Pattern**:
>    In `eval`, `Result<i64, String>` combines `match` over operators with the `?` operator for clean recursive error propagation when evaluating missing variables or division by zero.

---

## 6. Related Terms

- [`if let`](../level_02/if_let_while_let.md) — Syntactic sugar for when a `match` only cares about one specific pattern and ignores all others.
- [Enum](../level_02/enum.md) — The custom data structure that `match` was practically built to work hand-in-hand with.

---

## 7. Key Takeaways

- `match` is a safer, more powerful alternative to long `if / else if` chains (and replaces `switch`).
- It is an **expression**, meaning it can return a value.
- Every possible value must be handled (**exhaustiveness**).
- Use the underscore `_` as a "catch-all" or "default" case.
- There is no "fallthrough" in Rust; only the matching arm is executed, and it automatically breaks.
