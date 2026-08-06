# fn

> **Level 1 — Foundations**
> Keyword to declare a function. `fn main()` is the program entry point.

---

## 1. Prerequisites


- [Variable](variable.md) — Variables passed as parameters or declared within functions.
- [Type Annotation](type_annotation.md) — Input parameter types and return type annotations.

---

## 2. Term Category



**Rust Keyword (function declaration primitive)**: A general programming concept (Functions).

---

## 3. Explanation

### (1) Design Motivation — "Why does this exist in programming languages?"

If you write a program that performs the same sequence of operations multiple times, copying and pasting that code leads to massive, unmaintainable, and error-prone files. Functions exist to solve this fundamental problem: they allow developers to encapsulate a reusable block of logic under a single name. 

While languages like JavaScript use `function` and Python uses `def`, Rust uses the concise `fn` keyword. Rust's specific take on functions places a heavy emphasis on safety and clarity. Unlike dynamic languages, Rust requires you to explicitly state the types of all parameters and the return type in the function signature. This guarantees the compiler has all the information it needs to enforce type safety and memory management before the function is ever called. Additionally, Rust leans into being an *expression-oriented* language, allowing the last expression in a function to be implicitly returned.

### (2) Reality Metaphor

Think of a function as a **vending machine**. 
The coins and button presses you put into it are the **parameters** (inputs). The internal gears and mechanisms that verify your payment and drop the item are the **function body** (logic). Finally, the snack that falls into the tray at the bottom is the **return value** (output). 

Every time you want that snack, you don't build a new vending machine; you just walk up to the existing one, pass in the required inputs, and get your result.

### (3) Rust Code Examples

#### Short Snippet
```rust
fn greet() {
    println!("Hello, Rust!");
}
```

#### Fuller Example
```rust
// Every executable Rust program starts at the `main` function.
fn main() {
    // Calling the function and passing arguments
    let total = calculate_price(10, 3);
    println!("The total price is: ${}", total);
}

// A function with parameters (quantity, price) and a return type (i32).
fn calculate_price(quantity: i32, price: i32) -> i32 {
    let base_cost = quantity * price;
    
    // Implicit return: Notice there is NO semicolon at the end of this line.
    // This evaluates to the value that the function returns.
    base_cost + 5
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to specify the return type

**The mistake:** Creating a function that returns a value without declaring the return type (`-> Type`) in the signature.

**Why it's wrong:** Rust's compiler needs to know exactly what type a function returns to ensure type safety throughout your program. If you don't specify it, Rust assumes the function returns an empty tuple `()` (meaning nothing), causing a type mismatch error when you try to return actual data.

*Incorrect:*
```rust
fn get_number() {
    5
}
```

*Fix:*
```rust
fn get_number() -> i32 {
    5
}
```

### Mistake 2: Accidentally suppressing the implicit return with a semicolon

**The mistake:** Placing a semicolon at the end of the expression you intended to return.

**Why it's wrong:** In Rust, adding a semicolon turns an *expression* (which evaluates to a value) into a *statement* (which does not). A statement returns the empty unit type `()`. If your function signature promises an `i32` but your last line ends in a semicolon, you are actually returning `()`, causing a compilation error.

*Incorrect:*
```rust
fn add(a: i32, b: i32) -> i32 {
    a + b;
}
```

*Fix:*
```rust
fn add(a: i32, b: i32) -> i32 {
    a + b
}
```

---

### Mistake 3: Concurrent Access to Fn Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Fn instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: High-Throughput Network Telemetry Packet Pipeline

**Scenario:** In real-time network streaming services, incoming telemetry packets must be validated and transformed through a pipeline of processing stages before persistence. Using Rust function pointers (`fn(Packet) -> Result<Packet, PacketError>`), implement a zero-allocation pipeline processor.

**Requirements:**
1. Define a `Packet` struct containing `id: u64`, `payload: Vec<u8>`, and `checksum: u32`.
2. Define a `PacketError` enum with variants `EmptyPayload`, `InvalidChecksum { expected: u32, found: u32 }`, and `PayloadTooLarge { max: usize, actual: usize }`.
3. Create stage functions:
   - `validate_non_empty`: Returns `Err(PacketError::EmptyPayload)` if `payload` is empty.
   - `verify_checksum`: Calculates a 32-bit checksum (sum of bytes wrapping add) and returns `Err(PacketError::InvalidChecksum)` if it does not match `checksum`.
   - `clamp_payload_size`: Returns `Err(PacketError::PayloadTooLarge)` if `payload.len() > 1024`.
4. Implement `run_pipeline(packet: Packet, pipeline: &[fn(Packet) -> Result<Packet, PacketError>]) -> Result<Packet, PacketError>` which evaluates each function pointer stage sequentially using early returns (`?`) on error.

**Expected output:**

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Clone)]
> pub struct Packet {
>     pub id: u64,
>     pub payload: Vec<u8>,
>     pub checksum: u32,
> }
>
> #[derive(Debug, PartialEq)]
> pub enum PacketError {
>     EmptyPayload,
>     InvalidChecksum { expected: u32, found: u32 },
>     PayloadTooLarge { max: usize, actual: usize },
> }
>
> pub fn compute_checksum(bytes: &[u8]) -> u32 {
>     bytes.iter().fold(0u32, |acc, &b| acc.wrapping_add(b as u32))
> }
>
> pub fn validate_non_empty(packet: Packet) -> Result<Packet, PacketError> {
>     if packet.payload.is_empty() {
>         return Err(PacketError::EmptyPayload);
>     }
>     Ok(packet)
> }
>
> pub fn verify_checksum(packet: Packet) -> Result<Packet, PacketError> {
>     let computed = compute_checksum(&packet.payload);
>     if computed != packet.checksum {
>         return Err(PacketError::InvalidChecksum {
>             expected: packet.checksum,
>             found: computed,
>         });
>     }
>     Ok(packet)
> }
>
> pub fn clamp_payload_size(packet: Packet) -> Result<Packet, PacketError> {
>     const MAX_SIZE: usize = 1024;
>     if packet.payload.len() > MAX_SIZE {
>         return Err(PacketError::PayloadTooLarge {
>             max: MAX_SIZE,
>             actual: packet.payload.len(),
>         });
>     }
>     Ok(packet)
> }
>
> pub fn run_pipeline(
>     mut packet: Packet,
>     pipeline: &[fn(Packet) -> Result<Packet, PacketError>],
> ) -> Result<Packet, PacketError> {
>     for stage in pipeline {
>         packet = stage(packet)?;
>     }
>     Ok(packet)
> }
>
> #[cfg(test)]
> mod tests {
>     use super::*;
>
>     #[test]
>     fn test_valid_packet_pipeline() {
>         let payload = vec![1, 2, 3, 4, 5];
>         let checksum = compute_checksum(&payload);
>         let packet = Packet {
>             id: 101,
>             payload,
>             checksum,
>         };
>
>         let pipeline: &[fn(Packet) -> Result<Packet, PacketError>] = &[
>             validate_non_empty,
>             verify_checksum,
>             clamp_payload_size,
>         ];
>
>         let result = run_pipeline(packet.clone(), pipeline);
>         assert!(result.is_ok());
>         assert_eq!(result.unwrap(), packet);
>     }
>
>     #[test]
>     fn test_empty_payload_pipeline_failure() {
>         let packet = Packet {
>             id: 102,
>             payload: vec![],
>             checksum: 0,
>         };
>
>         let pipeline: &[fn(Packet) -> Result<Packet, PacketError>] = &[
>             validate_non_empty,
>             verify_checksum,
>         ];
>
>         let result = run_pipeline(packet, pipeline);
>         assert!(result.is_err());
>         assert!(matches!(result, Err(PacketError::EmptyPayload)));
>         assert_ne!(result, Ok(Packet { id: 102, payload: vec![], checksum: 0 }));
>     }
>
>     #[test]
>     fn test_corrupted_checksum() {
>         let payload = vec![10, 20, 30];
>         let packet = Packet {
>             id: 103,
>             payload,
>             checksum: 9999,
>         };
>
>         let pipeline: &[fn(Packet) -> Result<Packet, PacketError>] = &[
>             validate_non_empty,
>             verify_checksum,
>         ];
>
>         let result = run_pipeline(packet, pipeline);
>         assert!(matches!(
>             result,
>             Err(PacketError::InvalidChecksum { expected: 9999, found: 60 })
>         ));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
> 1. **Function Pointer Type Invariants**: A function pointer type (`fn(T) -> R`) represents a concrete top-level function signature without captured environment state. Unlike closure traits (`Fn`, `FnMut`, `FnOnce`), function pointers carry zero runtime allocation overhead and have fixed function addresses, making them ideal for high-performance pipeline registries.
> 2. **Ownership and Value Passing**: In `fn(Packet) -> Result<Packet, PacketError>`, the packet value is passed by ownership into each stage. If validation succeeds, ownership of the updated `Packet` is returned back wrapped in `Ok(Packet)`.
> 3. **Early-Return Pipeline Mechanics**: The `run_pipeline` function uses the `?` operator on the result of `stage(packet)`. On any error, execution aborts early, returning the exact `PacketError` variant immediately.
> 4. **Edge Cases Handled**: Empty payload slices, single-byte boundary conditions, checksum wrapping via `wrapping_add`, and payload length limits at 1024 bytes.
>

---

### Exercise 2: Low-Latency Financial Matching Engine Order Dispatcher

**Scenario:** Financial trading matching engines operate under strict microsecond latency SLAs. Passing dynamic closures with vtable allocations (`Box<dyn Fn>`) introduces latency spikes. A function-pointer array (`[fn(&OrderEvent, &mut EngineContext) -> Result<(), DispatchError>; N]`) enables static dispatch without heap allocations.

**Requirements:**
Implement an event dispatcher system:
1. `OrderEvent` enum with `NewOrder { order_id: u64, price: u64, quantity: u32, trader_id: u32 }` and `CancelOrder { order_id: u64, trader_id: u32 }`.
2. `EngineContext` struct tracking `max_order_quantity: u32`, `active_traders: Vec<u32>`, `processed_count: u64`, and `audit_log: Vec<String>`.
3. `DispatchError` enum containing `TraderNotAuthorized(u32)` and `QuantityExceedsLimit { max: u32, actual: u32 }`.
4. Three handler functions (`fn(&OrderEvent, &mut EngineContext) -> Result<(), DispatchError>`):
   - `validate_trader_auth`: Checks if `trader_id` exists in `active_traders`.
   - `validate_risk_limits`: Ensures `NewOrder` quantity <= `max_order_quantity`.
   - `audit_logger`: Increments `processed_count` and records event text into `audit_log`.
5. `dispatch_order_event`: Iterates over the handler function pointer slice and executes each handler against the event and mutable context.

**Expected output:**

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone, PartialEq)]
> pub enum OrderEvent {
>     NewOrder {
>         order_id: u64,
>         price: u64,
>         quantity: u32,
>         trader_id: u32,
>     },
>     CancelOrder {
>         order_id: u64,
>         trader_id: u32,
>     },
> }
>
> #[derive(Debug, PartialEq)]
> pub struct EngineContext {
>     pub max_order_quantity: u32,
>     pub active_traders: Vec<u32>,
>     pub processed_count: u64,
>     pub audit_log: Vec<String>,
> }
>
> #[derive(Debug, PartialEq)]
> pub enum DispatchError {
>     TraderNotAuthorized(u32),
>     QuantityExceedsLimit { max: u32, actual: u32 },
> }
>
> pub fn validate_trader_auth(
>     event: &OrderEvent,
>     ctx: &mut EngineContext,
> ) -> Result<(), DispatchError> {
>     let trader_id = match event {
>         OrderEvent::NewOrder { trader_id, .. } => *trader_id,
>         OrderEvent::CancelOrder { trader_id, .. } => *trader_id,
>     };
>     if !ctx.active_traders.contains(&trader_id) {
>         return Err(DispatchError::TraderNotAuthorized(trader_id));
>     }
>     Ok(())
> }
>
> pub fn validate_risk_limits(
>     event: &OrderEvent,
>     ctx: &mut EngineContext,
> ) -> Result<(), DispatchError> {
>     if let OrderEvent::NewOrder { quantity, .. } = event {
>         if *quantity > ctx.max_order_quantity {
>             return Err(DispatchError::QuantityExceedsLimit {
>                 max: ctx.max_order_quantity,
>                 actual: *quantity,
>             });
>         }
>     }
>     Ok(())
> }
>
> pub fn audit_logger(
>     event: &OrderEvent,
>     ctx: &mut EngineContext,
> ) -> Result<(), DispatchError> {
>     ctx.processed_count += 1;
>     let log_entry = match event {
>         OrderEvent::NewOrder { order_id, price, quantity, trader_id } => {
>             format!("NEW: id={}, trader={}, qty={}, price={}", order_id, trader_id, quantity, price)
>         }
>         OrderEvent::CancelOrder { order_id, trader_id } => {
>             format!("CANCEL: id={}, trader={}", order_id, trader_id)
>         }
>     };
>     ctx.audit_log.push(log_entry);
>     Ok(())
> }
>
> pub fn dispatch_order_event(
>     event: &OrderEvent,
>     ctx: &mut EngineContext,
>     handlers: &[fn(&OrderEvent, &mut EngineContext) -> Result<(), DispatchError>],
> ) -> Result<(), DispatchError> {
>     for handler in handlers {
>         handler(event, ctx)?;
>     }
>     Ok(())
> }
>
> #[cfg(test)]
> mod tests {
>     use super::*;
>
>     #[test]
>     fn test_successful_dispatch() {
>         let mut ctx = EngineContext {
>             max_order_quantity: 1000,
>             active_traders: vec![42, 108],
>             processed_count: 0,
>             audit_log: Vec::new(),
>         };
>
>         let event = OrderEvent::NewOrder {
>             order_id: 1,
>             price: 150,
>             quantity: 500,
>             trader_id: 42,
>         };
>
>         let handlers: &[fn(&OrderEvent, &mut EngineContext) -> Result<(), DispatchError>] = &[
>             validate_trader_auth,
>             validate_risk_limits,
>             audit_logger,
>         ];
>
>         let res = dispatch_order_event(&event, &mut ctx, handlers);
>         assert!(res.is_ok());
>         assert_eq!(ctx.processed_count, 1);
>         assert_eq!(ctx.audit_log.len(), 1);
>         assert_eq!(ctx.audit_log[0], "NEW: id=1, trader=42, qty=500, price=150");
>     }
>
>     #[test]
>     fn test_unauthorized_trader() {
>         let mut ctx = EngineContext {
>             max_order_quantity: 1000,
>             active_traders: vec![42],
>             processed_count: 0,
>             audit_log: Vec::new(),
>         };
>
>         let event = OrderEvent::CancelOrder {
>             order_id: 99,
>             trader_id: 777,
>         };
>
>         let handlers: &[fn(&OrderEvent, &mut EngineContext) -> Result<(), DispatchError>] = &[
>             validate_trader_auth,
>             validate_risk_limits,
>             audit_logger,
>         ];
>
>         let res = dispatch_order_event(&event, &mut ctx, handlers);
>         assert!(res.is_err());
>         assert!(matches!(res, Err(DispatchError::TraderNotAuthorized(777))));
>         assert_eq!(ctx.processed_count, 0);
>         assert_ne!(ctx.processed_count, 1);
>     }
>
>     #[test]
>     fn test_risk_limit_exceeded() {
>         let mut ctx = EngineContext {
>             max_order_quantity: 100,
>             active_traders: vec![42],
>             processed_count: 0,
>             audit_log: Vec::new(),
>         };
>
>         let event = OrderEvent::NewOrder {
>             order_id: 2,
>             price: 50,
>             quantity: 500,
>             trader_id: 42,
>         };
>
>         let handlers: &[fn(&OrderEvent, &mut EngineContext) -> Result<(), DispatchError>] = &[
>             validate_trader_auth,
>             validate_risk_limits,
>             audit_logger,
>         ];
>
>         let res = dispatch_order_event(&event, &mut ctx, handlers);
>         assert!(matches!(
>             res,
>             Err(DispatchError::QuantityExceedsLimit { max: 100, actual: 500 })
>         ));
>         assert!(ctx.audit_log.is_empty());
>     }
> }
> ```
>
> #### Technical Explanation
>
>
> 1. **Mutable Context Borrowing**: The function signature `fn(&OrderEvent, &mut EngineContext) -> Result<(), DispatchError>` borrows the event immutably while borrowing the engine context mutably. This separation permits inspectable validation without mutating the event payload, while enabling context tracking (e.g. audit logs, counter increments).
> 2. **Static Function Dispatch**: Raw function pointers (`fn(...)`) resolve directly to code memory addresses at compile time, eliminating virtual method table (vtable) lookups and dynamic pointer dereferencing inherent to `dyn Fn` trait objects.
> 3. **Pattern Matching in Function Handlers**: The handlers leverage exhaustive Rust `match` expressions to destructure specific variants (`OrderEvent::NewOrder` vs `OrderEvent::CancelOrder`), ensuring type-safe extraction of fields (`order_id`, `trader_id`, `quantity`).
> 4. **Invariants & Safety**: Zero dynamic closure allocation guarantees consistent sub-microsecond execution timing without triggering garbage collection or heap fragmentation.
>

---

### Exercise 3: AST Arithmetic Expression Evaluator with Operator Function Mapping

**Scenario:** Compilers and query engines evaluate math expressions by building an Abstract Syntax Tree (AST). Write an AST evaluator (`eval_expr`) that uses function pointers to map binary operator nodes to checked arithmetic functions.

**Requirements:**
1. Define enums:
   - `BinaryOperator`: `Add`, `Subtract`, `Multiply`, `Divide`.
   - `Expr`: `Literal(i64)`, `Variable(String)`, `BinaryOp { left: Box<Expr>, right: Box<Expr>, op: BinaryOperator }`.
   - `EvalError`: `VariableNotFound(String)`, `DivisionByZero`, `IntegerOverflow`.
2. Implement checked operation functions matching `fn(i64, i64) -> Result<i64, EvalError>`:
   - `safe_add`: uses `checked_add`.
   - `safe_sub`: uses `checked_sub`.
   - `safe_mul`: uses `checked_mul`.
   - `safe_div`: checks for division by zero before `checked_div`.
3. Implement `get_operator_fn(op: BinaryOperator) -> fn(i64, i64) -> Result<i64, EvalError>` to return the appropriate function pointer for each operator.
4. Implement `eval_expr(expr: &Expr, symbols: &HashMap<String, i64>) -> Result<i64, EvalError>` to evaluate expressions recursively.

**Expected output:**

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::HashMap;
>
> #[derive(Debug, Clone, PartialEq)]
> pub enum BinaryOperator {
>     Add,
>     Subtract,
>     Multiply,
>     Divide,
> }
>
> #[derive(Debug, Clone, PartialEq)]
> pub enum Expr {
>     Literal(i64),
>     Variable(String),
>     BinaryOp {
>         left: Box<Expr>,
>         right: Box<Expr>,
>         op: BinaryOperator,
>     },
> }
>
> #[derive(Debug, PartialEq, Clone)]
> pub enum EvalError {
>     VariableNotFound(String),
>     DivisionByZero,
>     IntegerOverflow,
> }
>
> pub fn safe_add(a: i64, b: i64) -> Result<i64, EvalError> {
>     a.checked_add(b).ok_or(EvalError::IntegerOverflow)
> }
>
> pub fn safe_sub(a: i64, b: i64) -> Result<i64, EvalError> {
>     a.checked_sub(b).ok_or(EvalError::IntegerOverflow)
> }
>
> pub fn safe_mul(a: i64, b: i64) -> Result<i64, EvalError> {
>     a.checked_mul(b).ok_or(EvalError::IntegerOverflow)
> }
>
> pub fn safe_div(a: i64, b: i64) -> Result<i64, EvalError> {
>     if b == 0 {
>         return Err(EvalError::DivisionByZero);
>     }
>     a.checked_div(b).ok_or(EvalError::IntegerOverflow)
> }
>
> pub fn get_operator_fn(op: BinaryOperator) -> fn(i64, i64) -> Result<i64, EvalError> {
>     match op {
>         BinaryOperator::Add => safe_add,
>         BinaryOperator::Subtract => safe_sub,
>         BinaryOperator::Multiply => safe_mul,
>         BinaryOperator::Divide => safe_div,
>     }
> }
>
> pub fn eval_expr(expr: &Expr, symbols: &HashMap<String, i64>) -> Result<i64, EvalError> {
>     match expr {
>         Expr::Literal(val) => Ok(*val),
>         Expr::Variable(name) => {
>             symbols.get(name).copied().ok_or_else(|| EvalError::VariableNotFound(name.clone()))
>         }
>         Expr::BinaryOp { left, right, op } => {
>             let left_val = eval_expr(left, symbols)?;
>             let right_val = eval_expr(right, symbols)?;
>             let op_fn = get_operator_fn(op.clone());
>             op_fn(left_val, right_val)
>         }
>     }
> }
>
> #[cfg(test)]
> mod tests {
>     use super::*;
>
>     #[test]
>     fn test_eval_complex_expression() {
>         let mut symbols = HashMap::new();
>         symbols.insert("x".to_string(), 10);
>         symbols.insert("y".to_string(), 5);
>
>         // Expression: (x + y) * 2
>         let expr = Expr::BinaryOp {
>             left: Box::new(Expr::BinaryOp {
>                 left: Box::new(Expr::Variable("x".to_string())),
>                 right: Box::new(Expr::Variable("y".to_string())),
>                 op: BinaryOperator::Add,
>             }),
>             right: Box::new(Expr::Literal(2)),
>             op: BinaryOperator::Multiply,
>         };
>
>         let result = eval_expr(&expr, &symbols);
>         assert!(result.is_ok());
>         assert_eq!(result.unwrap(), 30);
>     }
>
>     #[test]
>     fn test_division_by_zero() {
>         let symbols = HashMap::new();
>         let expr = Expr::BinaryOp {
>             left: Box::new(Expr::Literal(100)),
>             right: Box::new(Expr::Literal(0)),
>             op: BinaryOperator::Divide,
>         };
>
>         let result = eval_expr(&expr, &symbols);
>         assert!(result.is_err());
>         assert!(matches!(result, Err(EvalError::DivisionByZero)));
>         assert_ne!(result, Ok(0));
>     }
>
>     #[test]
>     fn test_missing_variable() {
>         let symbols = HashMap::new();
>         let expr = Expr::Variable("missing_var".to_string());
>
>         let result = eval_expr(&expr, &symbols);
>         assert_eq!(result, Err(EvalError::VariableNotFound("missing_var".to_string())));
>     }
>
>     #[test]
>     fn test_integer_overflow() {
>         let symbols = HashMap::new();
>         let expr = Expr::BinaryOp {
>             left: Box::new(Expr::Literal(i64::MAX)),
>             right: Box::new(Expr::Literal(1)),
>             op: BinaryOperator::Add,
>         };
>
>         let result = eval_expr(&expr, &symbols);
>         assert!(matches!(result, Err(EvalError::IntegerOverflow)));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
> 1. **Higher-Order Operator Mapping**: `get_operator_fn` maps high-level AST operator enum variants (`BinaryOperator::Add`, etc.) directly to function pointers (`fn(i64, i64) -> Result<i64, EvalError>`). This decouples operator resolution from expression traversal.
> 2. **Recursive Function Invariants**: `eval_expr` traverses recursive enum structures (`Box<Expr>`). Rust requires heap indirect memory allocation (`Box`) for recursive data types to ensure fixed struct layouts at compile time.
> 3. **Arithmetic Bounds & Overflow Protection**: Standard arithmetic ops (`+`, `*`) panic in debug mode or wrap in release mode on overflow. Utilizing standard library checked arithmetic methods (`checked_add`, `checked_mul`, `checked_div`) guarantees safe error propagation via `EvalError`.
> 4. **Variable Lookup Scope**: Symbol resolution queries `HashMap<String, i64>`. Missing keys trigger `EvalError::VariableNotFound` early exit without attempting further sub-expression evaluation.
>

---

## 6. Related Terms


- [Variable](variable.md) — Functions often declare variables locally or accept them as parameters.
- [Type Annotation](type_annotation.md) — Function signatures mandate explicit type annotations for inputs and outputs.
- [Module](module.md) — Functions are typically grouped and organized within modules.
- [Comments](comments.md) — Related concept: Comments.
- [Functions (`fn`)](function.md) — Functions declared with fn.

---

## 7. Key Takeaways

- Functions are declared using the `fn` keyword.
- `fn main()` is the required entry point for all executable Rust programs.
- All function parameters and return values must have explicit type annotations.
- The final expression in a function block (without a trailing semicolon) is implicitly returned.
- Functions are fundamental building blocks for writing modular, reusable code.
