# Enum

> **Level 2 — Control Flow & Data Structures**
> A type that can be one of several variants, each optionally carrying data.

---

## 1. Prerequisites


- [Struct](struct.md) — While structs group data together, enums offer a choice between different types of data.
- [`match`](match.md) — The primary tool used to check which variant an Enum is currently holding and extract its data.

---

## 2. Term Category

**Rust-specific (the immense power)**: Enums (short for enumerations) exist in languages like C and Java. However, in those languages, they are usually just glorified integers used for labeling. In Rust, Enums are **Algebraic Data Types**. This means that each individual variant within the enum can store its own unique, custom data!

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

A [Struct](../level_02/struct.md) is an **"AND"** type. A `User` struct has a username **AND** an email **AND** an age. 

But sometimes you need an **"OR"** type. For example, imagine a network request. The result is either a `Success` **OR** a `Failure`. It can never be both. If you try to model this with a struct, you end up with awkward, confusing fields where half the data is null/empty depending on the state.

An **Enum** is the perfect tool for "OR" relationships. It allows you to define a type by enumerating its possible variants. What makes Rust's enums legendary is that **variants can hold data**. A `Success` variant can hold a `String` representing the webpage HTML, while the `Failure` variant holds an `i32` representing the 404 error code. 

### (2) Reality Metaphor

Imagine a combo meal at a restaurant where you must choose exactly one side dish. 

The Side Dish is an **Enum**. It can be Fries **OR** Salad **OR** Soup. 
- If you choose `Fries`, it might hold extra data: `Fries(Size)`.
- If you choose `Salad`, it might hold no extra data at all: `Salad`.
- If you choose `Soup`, it might hold very complex data: `Soup { flavor: String, temperature: i32 }`.

You only get one side dish, but the specific choice dictates what extra information comes with it.

### (3) Rust Code Examples

#### Short Snippet (Basic Enum)
```rust
// An enum with no internal data (similar to a C-style enum).
enum TrafficLight {
    Red,
    Yellow,
    Green,
}

fn main() {
    // You access variants using the double colon `::` namespace
    let current_light = TrafficLight::Red;
}
```

#### Fuller Example (Enums with Data)
```rust
// An enum where variants hold different shapes of data!
enum WebEvent {
    PageLoad,                 // Variant with no data (Unit-like)
    KeyPress(char),           // Variant holding a single character (Tuple-like)
    Click { x: i64, y: i64 }, // Variant holding named fields (Struct-like)
}

fn main() {
    let event1 = WebEvent::KeyPress('x');
    let event2 = WebEvent::Click { x: 250, y: 120 };
    
    // We use Pattern Matching to extract the data hidden inside the enum!
    match event2 {
        WebEvent::PageLoad => println!("Page loaded."),
        WebEvent::KeyPress(c) => println!("Pressed key: {}", c),
        WebEvent::Click { x, y } => println!("Clicked at {}, {}", x, y),
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Enum Scoping and Lifecycle Rules

**The mistake:** Assuming Enum instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("enum_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("enum_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Enum State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Enum through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Enum Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Enum instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: High-Performance Network Telemetry Packet Decoder

**Scenario:**
You are building an ingester for a high-throughput network telemetry daemon. Binary network packets are parsed into an event stream where each packet variant carries payload data tailored to its protocol function:
1. `Ping`: Represents a heartbeat packet holding a microsecond timestamp (`u64`).
2. `Subscribe`: Represents a topic subscription holding a topic (`String`) and a Quality of Service (QoS) level (`u8`).
3. `Publish`: Represents a data payload holding a topic (`String`), payload bytes (`Vec<u8>`), and a message ID (`u32`).
4. `Disconnect`: Represents graceful or unexpected termination carrying a `DisconnectReason` enum (`Graceful = 0`, `ProtocolError = 1`, `Timeout = 2`).

Implement the `DisconnectReason` and `Packet` enums along with the following methods on `Packet`:
- `payload_bytes(&self) -> usize`: Returns the total size in bytes of the variable dynamic payload (for `Ping`, the size of `u64`; for `Subscribe`, topic length + 1 byte for QoS; for `Publish`, topic length + payload length; for `Disconnect`, 1 byte).
- `is_control_packet(&self) -> bool`: Returns `true` if the packet is `Ping` or `Disconnect`.
- `encode_header(&self) -> [u8; 2]`: Returns a 2-byte header `[opcode, flag]` where `Ping` is opcode `0x01` (flag `0`), `Subscribe` is `0x02` (flag is QoS), `Publish` is `0x03` (flag `0`), and `Disconnect` is `0x04` (flag is `DisconnectReason` integer cast).

```rust
// TODO: Define DisconnectReason and Packet enums, and implement the methods.
```

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Clone, Copy)]
> #[repr(u8)]
> pub enum DisconnectReason {
>     Graceful = 0,
>     ProtocolError = 1,
>     Timeout = 2,
> }
> 
> #[derive(Debug, PartialEq, Clone)]
> pub enum Packet {
>     Ping(u64),
>     Subscribe { topic: String, qos: u8 },
>     Publish { topic: String, payload: Vec<u8>, message_id: u32 },
>     Disconnect(DisconnectReason),
> }
> 
> impl Packet {
>     pub fn payload_bytes(&self) -> usize {
>         match self {
>             Packet::Ping(_) => std::mem::size_of::<u64>(),
>             Packet::Subscribe { topic, .. } => topic.len() + std::mem::size_of::<u8>(),
>             Packet::Publish { topic, payload, .. } => topic.len() + payload.len(),
>             Packet::Disconnect(_) => std::mem::size_of::<u8>(),
>         }
>     }
> 
>     pub fn is_control_packet(&self) -> bool {
>         matches!(self, Packet::Ping(_) | Packet::Disconnect(_))
>     }
> 
>     pub fn encode_header(&self) -> [u8; 2] {
>         match self {
>             Packet::Ping(_) => [0x01, 0x00],
>             Packet::Subscribe { qos, .. } => [0x02, *qos],
>             Packet::Publish { .. } => [0x03, 0x00],
>             Packet::Disconnect(reason) => [0x04, *reason as u8],
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_packet_payload_bytes() {
>         let ping = Packet::Ping(1690000000000);
>         assert_eq!(ping.payload_bytes(), 8);
> 
>         let sub = Packet::Subscribe {
>             topic: String::from("sensors/temp"),
>             qos: 1,
>         };
>         assert_eq!(sub.payload_bytes(), 12 + 1);
> 
>         let pub_pkt = Packet::Publish {
>             topic: String::from("telemetry"),
>             payload: vec![0xDE, 0xAD, 0xBE, 0xEF],
>             message_id: 101,
>         };
>         assert_eq!(pub_pkt.payload_bytes(), 9 + 4);
> 
>         let disc = Packet::Disconnect(DisconnectReason::Timeout);
>         assert_eq!(disc.payload_bytes(), 1);
>     }
> 
>     #[test]
>     fn test_is_control_packet() {
>         let ping = Packet::Ping(100);
>         let disc = Packet::Disconnect(DisconnectReason::Graceful);
>         let sub = Packet::Subscribe {
>             topic: String::from("alerts"),
>             qos: 0,
>         };
> 
>         assert!(ping.is_control_packet());
>         assert!(disc.is_control_packet());
>         assert!(!sub.is_control_packet());
>         assert_ne!(ping.is_control_packet(), sub.is_control_packet());
>     }
> 
>     #[test]
>     fn test_encode_header() {
>         let sub = Packet::Subscribe {
>             topic: String::from("sys/health"),
>             qos: 2,
>         };
>         assert_eq!(sub.encode_header(), [0x02, 0x02]);
> 
>         let disc = Packet::Disconnect(DisconnectReason::ProtocolError);
>         assert_eq!(disc.encode_header(), [0x04, 0x01]);
> 
>         let pub_pkt = Packet::Publish {
>             topic: String::from("data"),
>             payload: vec![],
>             message_id: 1,
>         };
>         assert!(matches!(pub_pkt.encode_header(), [0x03, 0x00]));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Variant Diversity & Memory Layout**: Rust enums allow unit variants (`DisconnectReason`), tuple-like variants (`Ping(u64)`), and struct-like variants (`Subscribe`, `Publish`) to coexist within a single type. Tagged union representation ensures that the size of `Packet` is determined by the size of the largest variant plus alignment padding and the discriminant tag.
> 2. **Explicit Discriminants (`#[repr(u8)]`)**: Adding `#[repr(u8)]` to `DisconnectReason` guarantees that each variant compiles down to a single byte discriminant (0, 1, 2). This allows clean numeric casting (`*reason as u8`) during low-level wire header serialization.
> 3. **Non-destructive Borrowing & Pattern Matching**: Methods take `&self` to compute dynamic packet properties without taking ownership or triggering heap reallocations. Wildcards (`..`) allow destructuring without binding unused fields (`message_id`, `payload`).
> 4. **`matches!` Macro**: `matches!(self, Packet::Ping(_) | Packet::Disconnect(_))` expands into a boolean pattern-matching expression without requiring explicit `match` blocks or `return true/false` boilerplate.
> 
---

### Exercise 2: Algorithmic Trading Order Lifecycle State Machine

**Scenario:**
In high-frequency trading platforms, financial orders must pass through explicit lifecycle state transitions. Invalid transitions (such as executing an order that has already been cancelled) must be caught as type-safe errors.

Define the following enums:
1. `OrderState`:
   - `Pending { order_id: u64, symbol: String, total_qty: u32 }`
   - `Active { order_id: u64, symbol: String, remaining_qty: u32, filled_qty: u32, avg_price: f64 }`
   - `Filled { order_id: u64, symbol: String, total_filled: u32, avg_price: f64 }`
   - `Cancelled { order_id: u64, symbol: String, reason: String }`
2. `ExecutionEvent`:
   - `Fill { fill_qty: u32, price: f64 }`
   - `Cancel { reason: String }`
3. `OrderError`:
   - `InvalidTransition { current: &'static str, event: &'static str }`
   - `ExceedsRemainingQuantity { requested: u32, remaining: u32 }`

Implement state machine methods on `OrderState`:
- `is_terminal(&self) -> bool`: Returns `true` for `Filled` and `Cancelled`.
- `symbol(&self) -> &str`: Returns a reference to the stock ticker symbol.
- `apply_event(self, event: ExecutionEvent) -> Result<OrderState, OrderError>`: Consumes ownership of the current state and returns the next valid state or an error:
  - From `Pending`: a `Fill` checks `fill_qty <= total_qty`. If equal, transitions to `Filled`. If partial, transitions to `Active`. A `Cancel` transitions to `Cancelled`.
  - From `Active`: a `Fill` updates `remaining_qty`, recalculates the weighted average price `((filled_qty * avg_price) + (fill_qty * price)) / new_total_filled`, and transitions to `Filled` (if `remaining_qty == fill_qty`) or updated `Active`. A `Cancel` transitions to `Cancelled`.
  - From `Filled` or `Cancelled`: any incoming event returns `Err(OrderError::InvalidTransition)`.

```rust
// TODO: Define OrderState, ExecutionEvent, OrderError enums, and implement state transition logic.
```

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Clone)]
> pub enum OrderState {
>     Pending {
>         order_id: u64,
>         symbol: String,
>         total_qty: u32,
>     },
>     Active {
>         order_id: u64,
>         symbol: String,
>         remaining_qty: u32,
>         filled_qty: u32,
>         avg_price: f64,
>     },
>     Filled {
>         order_id: u64,
>         symbol: String,
>         total_filled: u32,
>         avg_price: f64,
>     },
>     Cancelled {
>         order_id: u64,
>         symbol: String,
>         reason: String,
>     },
> }
> 
> #[derive(Debug, PartialEq, Clone)]
> pub enum ExecutionEvent {
>     Fill { fill_qty: u32, price: f64 },
>     Cancel { reason: String },
> }
> 
> #[derive(Debug, PartialEq, Clone)]
> pub enum OrderError {
>     InvalidTransition { current: &'static str, event: &'static str },
>     ExceedsRemainingQuantity { requested: u32, remaining: u32 },
> }
> 
> impl OrderState {
>     pub fn is_terminal(&self) -> bool {
>         matches!(self, OrderState::Filled { .. } | OrderState::Cancelled { .. })
>     }
> 
>     pub fn symbol(&self) -> &str {
>         match self {
>             OrderState::Pending { symbol, .. }
>             | OrderState::Active { symbol, .. }
>             | OrderState::Filled { symbol, .. }
>             | OrderState::Cancelled { symbol, .. } => symbol.as_str(),
>         }
>     }
> 
>     pub fn apply_event(self, event: ExecutionEvent) -> Result<OrderState, OrderError> {
>         match (self, event) {
>             (OrderState::Pending { order_id, symbol, total_qty }, ExecutionEvent::Fill { fill_qty, price }) => {
>                 if fill_qty > total_qty {
>                     return Err(OrderError::ExceedsRemainingQuantity {
>                         requested: fill_qty,
>                         remaining: total_qty,
>                     });
>                 }
>                 if fill_qty == total_qty {
>                     Ok(OrderState::Filled {
>                         order_id,
>                         symbol,
>                         total_filled: fill_qty,
>                         avg_price: price,
>                     })
>                 } else {
>                     Ok(OrderState::Active {
>                         order_id,
>                         symbol,
>                         remaining_qty: total_qty - fill_qty,
>                         filled_qty: fill_qty,
>                         avg_price: price,
>                     })
>                 }
>             }
>             (OrderState::Pending { order_id, symbol, .. }, ExecutionEvent::Cancel { reason }) => {
>                 Ok(OrderState::Cancelled { order_id, symbol, reason })
>             }
>             (
>                 OrderState::Active {
>                     order_id,
>                     symbol,
>                     remaining_qty,
>                     filled_qty,
>                     avg_price: current_avg,
>                 },
>                 ExecutionEvent::Fill { fill_qty, price },
>             ) => {
>                 if fill_qty > remaining_qty {
>                     return Err(OrderError::ExceedsRemainingQuantity {
>                         requested: fill_qty,
>                         remaining: remaining_qty,
>                     });
>                 }
>                 let new_filled = filled_qty + fill_qty;
>                 let new_avg = ((filled_qty as f64 * current_avg) + (fill_qty as f64 * price)) / new_filled as f64;
> 
>                 if fill_qty == remaining_qty {
>                     Ok(OrderState::Filled {
>                         order_id,
>                         symbol,
>                         total_filled: new_filled,
>                         avg_price: new_avg,
>                     })
>                 } else {
>                     Ok(OrderState::Active {
>                         order_id,
>                         symbol,
>                         remaining_qty: remaining_qty - fill_qty,
>                         filled_qty: new_filled,
>                         avg_price: new_avg,
>                     })
>                 }
>             }
>             (OrderState::Active { order_id, symbol, .. }, ExecutionEvent::Cancel { reason }) => {
>                 Ok(OrderState::Cancelled { order_id, symbol, reason })
>             }
>             (OrderState::Filled { .. }, ExecutionEvent::Fill { .. } | ExecutionEvent::Cancel { .. }) => {
>                 Err(OrderError::InvalidTransition {
>                     current: "Filled",
>                     event: "ExecutionEvent",
>                 })
>             }
>             (OrderState::Cancelled { .. }, ExecutionEvent::Fill { .. } | ExecutionEvent::Cancel { .. }) => {
>                 Err(OrderError::InvalidTransition {
>                     current: "Cancelled",
>                     event: "ExecutionEvent",
>                 })
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
>     fn test_order_full_fill_flow() {
>         let order = OrderState::Pending {
>             order_id: 1001,
>             symbol: String::from("AAPL"),
>             total_qty: 100,
>         };
>         assert_eq!(order.symbol(), "AAPL");
>         assert!(!order.is_terminal());
> 
>         let result = order.apply_event(ExecutionEvent::Fill {
>             fill_qty: 100,
>             price: 150.0,
>         });
> 
>         assert!(matches!(
>             result,
>             Ok(OrderState::Filled {
>                 order_id: 1001,
>                 total_filled: 100,
>                 ..
>             })
>         ));
> 
>         if let Ok(state) = result {
>             assert!(state.is_terminal());
>             assert_eq!(state.symbol(), "AAPL");
>         }
>     }
> 
>     #[test]
>     fn test_order_partial_fill_then_cancel() {
>         let order = OrderState::Pending {
>             order_id: 1002,
>             symbol: String::from("TSLA"),
>             total_qty: 200,
>         };
> 
>         let active_state = order
>             .apply_event(ExecutionEvent::Fill {
>                 fill_qty: 50,
>                 price: 200.0,
>             })
>             .expect("First fill failed");
> 
>         assert!(matches!(
>             active_state,
>             OrderState::Active {
>                 remaining_qty: 150,
>                 filled_qty: 50,
>                 ..
>             }
>         ));
> 
>         let cancelled_state = active_state
>             .apply_event(ExecutionEvent::Cancel {
>                 reason: String::from("User requested cancel"),
>             })
>             .expect("Cancel failed");
> 
>         assert!(cancelled_state.is_terminal());
>         assert_eq!(
>             cancelled_state,
>             OrderState::Cancelled {
>                 order_id: 1002,
>                 symbol: String::from("TSLA"),
>                 reason: String::from("User requested cancel"),
>             }
>         );
>     }
> 
>     #[test]
>     fn test_invalid_overfill_and_terminal_transitions() {
>         let order = OrderState::Pending {
>             order_id: 1003,
>             symbol: String::from("MSFT"),
>             total_qty: 50,
>         };
> 
>         let overfill_res = order.clone().apply_event(ExecutionEvent::Fill {
>             fill_qty: 100,
>             price: 300.0,
>         });
>         assert_eq!(
>             overfill_res,
>             Err(OrderError::ExceedsRemainingQuantity {
>                 requested: 100,
>                 remaining: 50
>             })
>         );
> 
>         let filled_state = order
>             .apply_event(ExecutionEvent::Fill {
>                 fill_qty: 50,
>                 price: 300.0,
>             })
>             .unwrap();
> 
>         let post_fill_res = filled_state.apply_event(ExecutionEvent::Cancel {
>             reason: String::from("Late cancel"),
>         });
>         assert_ne!(post_fill_res.is_ok(), true);
>         assert!(matches!(
>             post_fill_res,
>             Err(OrderError::InvalidTransition { current: "Filled", .. })
>         ));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Ownership Semantics (`self`) for State Transitions**: By taking `self` by value in `apply_event`, the method consumes the previous enum variant instance. This prevents stale state reuse (e.g. holding onto a `Pending` state handle after it has transitioned to `Active`), guaranteeing strict lifecycle invariants at compile time.
> 2. **Structural Tuple Pattern Matching**: Matching on `(self, event)` pairs allows the compiler to enforce exhaustive checking across every combination of current state and incoming execution event. If a developer adds a new variant to `ExecutionEvent`, Rust will reject compilation until all matrix branches are handled.
> 3. **Domain Error Types**: Returning `Result<OrderState, OrderError>` using explicit custom enums instead of raw strings ensures caller code can programmatically handle overfills differently from illegal state transitions using `matches!` or pattern matching.
> 
---

### Exercise 3: Recursive Abstract Syntax Tree (AST) Expression Evaluator

**Scenario:**
Domain-specific language (DSL) interpreters and arithmetic calculation engines rely on recursive Abstract Syntax Trees (ASTs). Because enums in Rust must have a known size at compile time, recursive data structures require pointer indirection (`Box<T>`).

Define the following enums:
1. `BinaryOp`: `Add`, `Sub`, `Mul`, `Div`.
2. `Expr`:
   - `Literal(i64)`
   - `Variable(String)`
   - `Binary { op: BinaryOp, left: Box<Expr>, right: Box<Expr> }`
   - `Conditional { condition: Box<Expr>, then_branch: Box<Expr>, else_branch: Box<Expr> }`
3. `EvalError`:
   - `UndefinedVariable(String)`
   - `DivisionByZero`

Implement evaluation method on `Expr`:
`pub fn eval(&self, env: &std::collections::HashMap<String, i64>) -> Result<i64, EvalError>`

Evaluation rules:
- `Literal(n)` returns `n`.
- `Variable(name)` looks up `name` in `env`. If missing, returns `Err(EvalError::UndefinedVariable)`.
- `Binary` recursively evaluates `left` and `right`, applying `op`. Division by zero returns `Err(EvalError::DivisionByZero)`.
- `Conditional` evaluates `condition`. If non-zero, evaluates and returns `then_branch`; otherwise evaluates and returns `else_branch`.

```rust
// TODO: Define BinaryOp, Expr, EvalError enums, and implement the eval method.
```

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::HashMap;
> 
> #[derive(Debug, PartialEq, Clone, Copy)]
> pub enum BinaryOp {
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
>         op: BinaryOp,
>         left: Box<Expr>,
>         right: Box<Expr>,
>     },
>     Conditional {
>         condition: Box<Expr>,
>         then_branch: Box<Expr>,
>         else_branch: Box<Expr>,
>     },
> }
> 
> #[derive(Debug, PartialEq, Clone)]
> pub enum EvalError {
>     UndefinedVariable(String),
>     DivisionByZero,
> }
> 
> impl Expr {
>     pub fn eval(&self, env: &HashMap<String, i64>) -> Result<i64, EvalError> {
>         match self {
>             Expr::Literal(val) => Ok(*val),
>             Expr::Variable(name) => env
>                 .get(name)
>                 .copied()
>                 .ok_or_else(|| EvalError::UndefinedVariable(name.clone())),
>             Expr::Binary { op, left, right } => {
>                 let left_val = left.eval(env)?;
>                 let right_val = right.eval(env)?;
>                 match op {
>                     BinaryOp::Add => Ok(left_val + right_val),
>                     BinaryOp::Sub => Ok(left_val - right_val),
>                     BinaryOp::Mul => Ok(left_val * right_val),
>                     BinaryOp::Div => {
>                         if right_val == 0 {
>                             Err(EvalError::DivisionByZero)
>                         } else {
>                             Ok(left_val / right_val)
>                         }
>                     }
>                 }
>             }
>             Expr::Conditional {
>                 condition,
>                 then_branch,
>                 else_branch,
>             } => {
>                 let cond_val = condition.eval(env)?;
>                 if cond_val != 0 {
>                     then_branch.eval(env)
>                 } else {
>                     else_branch.eval(env)
>                 }
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
>     fn test_eval_literal_and_binary() {
>         // (10 + 20) * 3 = 90
>         let expr = Expr::Binary {
>             op: BinaryOp::Mul,
>             left: Box::new(Expr::Binary {
>                 op: BinaryOp::Add,
>                 left: Box::new(Expr::Literal(10)),
>                 right: Box::new(Expr::Literal(20)),
>             }),
>             right: Box::new(Expr::Literal(3)),
>         };
> 
>         let env = HashMap::new();
>         let result = expr.eval(&env);
>         assert_eq!(result, Ok(90));
>         assert!(result.is_ok());
>     }
> 
>     #[test]
>     fn test_eval_variable_lookup_and_conditional() {
>         let expr = Expr::Conditional {
>             condition: Box::new(Expr::Variable(String::from("x"))),
>             then_branch: Box::new(Expr::Binary {
>                 op: BinaryOp::Mul,
>                 left: Box::new(Expr::Variable(String::from("x"))),
>                 right: Box::new(Expr::Literal(2)),
>             }),
>             else_branch: Box::new(Expr::Literal(0)),
>         };
> 
>         let mut env = HashMap::new();
>         env.insert(String::from("x"), 5);
> 
>         assert_eq!(expr.eval(&env), Ok(10));
> 
>         env.insert(String::from("x"), 0);
>         assert_eq!(expr.eval(&env), Ok(0));
> 
>         let empty_env = HashMap::new();
>         let err_res = expr.eval(&empty_env);
>         assert_ne!(err_res, Ok(10));
>         assert!(matches!(
>             err_res,
>             Err(EvalError::UndefinedVariable(ref name)) if name == "x"
>         ));
>     }
> 
>     #[test]
>     fn test_eval_division_by_zero() {
>         let div_expr = Expr::Binary {
>             op: BinaryOp::Div,
>             left: Box::new(Expr::Literal(100)),
>             right: Box::new(Expr::Literal(0)),
>         };
> 
>         let env = HashMap::new();
>         let res = div_expr.eval(&env);
>         assert_eq!(res, Err(EvalError::DivisionByZero));
>         assert!(matches!(res, Err(EvalError::DivisionByZero)));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Indirection via `Box<T>` for Recursive Enums**: Rust requires that all types have a statically known size at compile time. Directly nesting `Expr` inside `Expr` would create an infinitely sized type (`E0072`). Wrapping child nodes in `Box<Expr>` puts a fixed-size (pointer size, 8 bytes on 64-bit platforms) heap allocation reference inside the variant.
> 2. **Short-Circuit Evaluation in AST Nodes**: In `Expr::Conditional`, the AST engine only evaluates the active branch (`then_branch` or `else_branch`) after checking `condition.eval(env)`. The inactive branch is never executed, preventing unnecessary computations or unreferenced variable lookups.
> 3. **Reference-Based AST Traversals**: The `eval` method takes `&self` and `&HashMap`, enabling repeated execution of the same immutable AST across multiple environments without cloning or consuming the tree nodes.
> 
---

## 6. Related Terms


- [`match`](match.md) — The ultimate tool for safely verifying and extracting data out of an enum variant.
- [`Option<T>`](option_t.md) — The most famous built-in enum in Rust. It represents a value that might exist (`Some(T)`) or might not (`None`).
- [`Result<T, E>`](result_t_e.md) — Another famous built-in enum used for error handling (`Ok(T)` or `Err(E)`).
- [`Any` Trait / Downcasting](../level_04/any_trait_downcasting.md) — Related concept: `Any` Trait / Downcasting.
- [`Cow<'a, T>`](../level_11/cow_t.md) — Related concept: `Cow<'a, T>`.

---

## 7. Key Takeaways

- A `struct` groups data together (an **AND** relationship); an `enum` represents an exclusive choice between variants (an **OR** relationship).
- Rust enums are incredibly powerful because their variants can store completely different shapes of data (Strings, Tuples, or even Structs).
- You must use the `::` syntax to access a variant (e.g., `Coin::Penny`).
- You cannot access data hidden inside an enum directly; you are forced to use pattern matching (`match` or `if let`) to safely extract it.
