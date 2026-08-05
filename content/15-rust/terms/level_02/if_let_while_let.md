# `if let` / `while let`

> **Level 2 — Control Flow & Data Structures**
> Syntactic sugar for matching a single pattern, ignoring the rest.

---

## 1. Prerequisites


- [`match`](match.md) — The exhaustive pattern matching tool that `if let` is designed to simplify.

---

## 2. Term Category

**Rust-specific (mostly)**: `if let` is **syntactic sugar** (a shorthand convenience) popularized by languages like Swift and Rust to make single-pattern matching much less verbose.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The [`match`](../level_02/match.md) expression is incredibly safe because it is **exhaustive**—it forces you to handle every possible outcome. 

However, there is a very common scenario in Rust: you only care about *one* specific outcome, and you want to do absolutely nothing if any other outcome occurs. If you write this using a `match` statement, you are forced to add a useless `_ => ()` (catch-all that does nothing) arm just to satisfy the compiler. This adds visual clutter.

`if let` was designed specifically for this scenario. It allows you to match a single pattern and extract its inner value, while silently ignoring all other possibilities. `while let` is the exact same concept, but it loops continuously *as long as* the pattern continues to match.

### (2) Reality Metaphor

Imagine you are fishing in a murky lake.

A **`match` statement** is like a strict supervisor forcing you to process every single thing you reel in: *"If it's a fish, put it in the bucket. If it's an old boot, throw it in the trash. If it's seaweed, throw it back."*

An **`if let` statement** is like putting on a pair of selective sunglasses where you only care about one thing. *"If I catch a fish, put it in the bucket. Ignore literally everything else."*

### (3) Rust Code Examples

#### Short Snippet (The Verbose vs The Elegant)
```rust
let config_max = Some(3u8);

// The verbose way using `match`:
match config_max {
    Some(max) => println!("The maximum is configured to be {}", max),
    _ => (), // We are forced to include this useless line
}

// The elegant way using `if let`:
if let Some(max) = config_max {
    println!("The maximum is configured to be {}", max),
}
```

#### Fuller Example (`while let`)
```rust
fn main() {
    // A vector of numbers
    let mut numbers = vec![1, 2, 3];

    // `numbers.pop()` removes the last item and returns `Some(item)`.
    // When the vector is empty, it returns `None`.
    // `while let` will keep looping as long as it successfully matches `Some(number)`.
    while let Some(number) = numbers.pop() {
        println!("Popped: {}", number);
    }
    
    println!("The list is now empty!");
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using `if let` instead of `==` for simple values

**The mistake:** Using `if let` to check if an integer equals `5`.

**Why it's wrong:** `if let` is specifically for **Pattern Matching** (destructuring complex types like Enums to pull out inner values). If you are just doing a standard equality check on a primitive value, just use a normal `if` statement.

*Incorrect:*
```rust
let x = 5;
if let 5 = x { ... } // Compiler warning: irrefutable if-let pattern
```

*Fix:*
```rust
if x == 5 { ... }
```

### Mistake 2: Mutating If Let While Let State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with If Let While Let through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to If Let While Let Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe If Let While Let instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Real-Time Telemetry Stream Harvester & Frame Harvester

**Scenario:**
In a high-throughput IoT microservices architecture, network sensor nodes send telemetry data buffers over a socket connection into a processing pipeline. Inbound slots arrive as optional wrapped frame objects: `Option<Frame>`. The underlying enum is defined as:

```rust
#[derive(Debug, PartialEq)]
pub enum Frame {
    Metric { device_id: u32, metric: String, val: f64 },
    Heartbeat { device_id: u32 },
    Error { code: u16, msg: String },
}
```

**Task:**
Implement a production function `process_telemetry_stream(mut stream: Vec<Option<Frame>>) -> (Vec<(u32, String, f64)>, u32)` that:
1. Iteratively drains the inbound vector using a `while let` loop until `stream.pop()` yields `None`.
2. Uses `if let` pattern matching to unwrap nested `Option<Frame>` values and extract valid `Frame::Metric` payloads (`(device_id, metric, val)`) while counting non-fatal `Frame::Error` instances and ignoring `Frame::Heartbeat` frames.
3. Preserves original stream order for extracted metrics and returns a tuple `(metrics, error_count)`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq)]
> pub enum Frame {
>     Metric { device_id: u32, metric: String, val: f64 },
>     Heartbeat { device_id: u32 },
>     Error { code: u16, msg: String },
> }
> 
> pub fn process_telemetry_stream(mut stream: Vec<Option<Frame>>) -> (Vec<(u32, String, f64)>, u32) {
>     let mut metrics = Vec::new();
>     let mut error_count = 0;
> 
>     // Drain buffer stack until stream.pop() returns None
>     while let Some(slot) = stream.pop() {
>         // Destructure inner Option using if let
>         if let Some(frame) = slot {
>             // Match specific Metric and Error variants via if let / else if let
>             if let Frame::Metric { device_id, metric, val } = frame {
>                 metrics.push((device_id, metric, val));
>             } else if let Frame::Error { code: _, msg: _ } = frame {
>                 error_count += 1;
>             }
>             // Heartbeats are intentionally ignored without panic or catch-all match arms
>         }
>     }
> 
>     // Reversing because pop() processed items in LIFO order
>     metrics.reverse();
>     (metrics, error_count)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_telemetry_stream_processing() {
>         let stream = vec![
>             Some(Frame::Metric { device_id: 101, metric: "cpu_usage".to_string(), val: 42.5 }),
>             Some(Frame::Heartbeat { device_id: 101 }),
>             Some(Frame::Error { code: 500, msg: "Sensor Overheat".to_string() }),
>             None, // Malformed stream slot
>             Some(Frame::Metric { device_id: 102, metric: "mem_usage".to_string(), val: 88.0 }),
>         ];
> 
>         let (metrics, errors) = process_telemetry_stream(stream);
> 
>         assert_eq!(metrics.len(), 2);
>         assert_eq!(metrics[0], (101, "cpu_usage".to_string(), 42.5));
>         assert_eq!(metrics[1], (102, "mem_usage".to_string(), 88.0));
>         assert_eq!(errors, 1);
>         assert_ne!(metrics.len(), 5);
>         assert!(metrics.is_empty() == false);
> 
>         let sample_frame = Frame::Metric { device_id: 1, metric: "temp".to_string(), val: 20.0 };
>         assert!(matches!(sample_frame, Frame::Metric { .. }));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **`while let` Draining Loop**: The loop expression `while let Some(slot) = stream.pop()` continuously evaluates `stream.pop()` and executes the loop body as long as the method returns `Some(slot)`. Once the vector is empty, `pop()` evaluates to `None`, which fails the pattern match and breaks the loop cleanly without out-of-bounds indexing.
> 2. **Concise Nesting with `if let`**: The double destructuring (`if let Some(frame) = slot` followed by `if let Frame::Metric { .. } = frame`) enables targeted extraction of nested enum variants. This avoids writing exhaustive `match` expressions with redundant `_ => ()` wildcard arms for discarded variants like `Frame::Heartbeat`.
> 3. **Ownership and Value Destructuring**: Popping items from `stream` grants exclusive ownership of each `Frame` to the local scope. Struct field bindings (`device_id`, `metric`, `val`) move owned values directly into the output vector without unnecessary heap reallocations.
> 4. **Edge Cases and Invariants**: `None` slots inside the vector are safely ignored by the outer `if let`. Reversing `metrics` at the end restores original FIFO order because `pop()` processes vector elements in LIFO order.

---

### Exercise 2: Financial Order Book Execution Pipeline & Cancellation Queue

**Scenario:**
An electronic trading platform processes incoming limit orders and cancellations from clients. Orders arrive sequentially in a queue represented by the `OrderCommand` enum:

```rust
#[derive(Debug, PartialEq, Clone)]
pub enum OrderCommand {
    LimitOrder { id: u64, symbol: String, price: u64, qty: u32 },
    CancelOrder { id: u64 },
    Flush,
}
```

**Task:**
Implement a trading engine processor `process_order_batch(mut queue: Vec<OrderCommand>) -> (Vec<u64>, Vec<u64>)` that:
1. Reverses `queue` so that `while let Some(cmd) = queue.pop()` processes incoming items in original FIFO order.
2. Uses `if let OrderCommand::Flush = cmd` to detect an emergency flush signal and terminate processing immediately (`break`).
3. Uses `if let` destructuring with pattern guards/conditions to accept `LimitOrder` instances with `price >= 100` into `executed_ids`, while gathering `CancelOrder` IDs into `cancelled_ids`.
4. Returns `(executed_ids, cancelled_ids)`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Clone)]
> pub enum OrderCommand {
>     LimitOrder { id: u64, symbol: String, price: u64, qty: u32 },
>     CancelOrder { id: u64 },
>     Flush,
> }
> 
> pub fn process_order_batch(mut queue: Vec<OrderCommand>) -> (Vec<u64>, Vec<u64>) {
>     let mut executed_ids = Vec::new();
>     let mut cancelled_ids = Vec::new();
> 
>     // Reverse to achieve FIFO processing using fast stack pops
>     queue.reverse();
> 
>     while let Some(cmd) = queue.pop() {
>         // Check sentinel signal via if let
>         if let OrderCommand::Flush = cmd {
>             break;
>         }
> 
>         // Destructure LimitOrder and filter by price condition using if let
>         if let OrderCommand::LimitOrder { id, price, .. } = cmd {
>             if price >= 100 {
>                 executed_ids.push(id);
>             }
>         } else if let OrderCommand::CancelOrder { id } = cmd {
>             cancelled_ids.push(id);
>         }
>     }
> 
>     (executed_ids, cancelled_ids)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_order_batch_processing() {
>         let orders = vec![
>             OrderCommand::LimitOrder { id: 1, symbol: "AAPL".to_string(), price: 150, qty: 10 },
>             OrderCommand::LimitOrder { id: 2, symbol: "AAPL".to_string(), price: 90, qty: 5 }, // Below price threshold
>             OrderCommand::CancelOrder { id: 3 },
>             OrderCommand::LimitOrder { id: 4, symbol: "GOOG".to_string(), price: 200, qty: 20 },
>             OrderCommand::Flush,
>             OrderCommand::LimitOrder { id: 5, symbol: "MSFT".to_string(), price: 300, qty: 15 }, // Unreached
>         ];
> 
>         let (executed, cancelled) = process_order_batch(orders);
> 
>         assert_eq!(executed, vec![1, 4]);
>         assert_eq!(cancelled, vec![3]);
>         assert_ne!(executed.len(), 3);
>         assert!(executed.contains(&1));
>         assert!(matches!(OrderCommand::Flush, OrderCommand::Flush));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **FIFO Processing via Stack Reversal**: In Rust, `Vec::pop()` is an $O(1)$ operation that removes elements from the end. By calling `queue.reverse()` prior to the `while let Some(cmd) = queue.pop()` loop, items are processed in FIFO order without requiring $O(N)$ front-removal shifts.
> 2. **Sentinel Pattern Control Flow**: Matching unit-like variants such as `OrderCommand::Flush` with `if let OrderCommand::Flush = cmd` provides a readable exit condition. Executing `break` upon match immediately halts further queue consumption.
> 3. **Field Ignoring with Wildcards (`..`)**: The pattern `OrderCommand::LimitOrder { id, price, .. }` extracts only `id` and `price`, ignoring `symbol` and `qty`. This avoids binding unused variables and eliminates compiler warnings.
> 4. **Invariants & Edge Cases**: Limit orders below the price threshold (`price < 100`) fail the inner condition and are silently ignored. Commands occurring after `OrderCommand::Flush` remain safely unmutated inside the queue.

---

### Exercise 3: Compiler AST Symbol Harvester & Non-Recursive Work-List Resolver

**Scenario:**
Static analysis tools parse code into an Abstract Syntax Tree (AST). Recursively traversing deeply nested AST nodes can cause runtime stack overflow errors. An AST node is structured as:

```rust
#[derive(Debug, PartialEq)]
pub enum AstNode {
    VarDecl { name: String, initializer: Option<Box<AstNode>> },
    Function { name: String, body: Vec<AstNode> },
    Literal(i64),
    NoOp,
}
```

**Task:**
Implement an iterative AST symbol harvester `collect_declared_variables(root: AstNode) -> Vec<(String, Option<i64>)>` that:
1. Maintains an explicit evaluation stack `let mut worklist = vec![root];` and drains it with `while let Some(node) = worklist.pop()`.
2. Uses `if let AstNode::VarDecl { name, initializer } = node` to inspect variable declarations.
3. Uses nested `if let` checks on `initializer` to extract literal values `(name, Some(val))` if `initializer` contains `Some(Box::new(AstNode::Literal(val)))`. If `initializer` contains a non-literal sub-expression, push the inner node back onto `worklist` for deferred evaluation and record `(name, None)`.
4. Uses `if let AstNode::Function { body, .. } = node` to iterate over child statements in `body` and push them onto `worklist`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq)]
> pub enum AstNode {
>     VarDecl { name: String, initializer: Option<Box<AstNode>> },
>     Function { name: String, body: Vec<AstNode> },
>     Literal(i64),
>     NoOp,
> }
> 
> pub fn collect_declared_variables(root: AstNode) -> Vec<(String, Option<i64>)> {
>     let mut symbols = Vec::new();
>     let mut worklist = vec![root];
> 
>     while let Some(node) = worklist.pop() {
>         if let AstNode::VarDecl { name, initializer } = node {
>             if let Some(init_node) = initializer {
>                 if let AstNode::Literal(val) = *init_node {
>                     symbols.push((name, Some(val)));
>                 } else {
>                     symbols.push((name, None));
>                     worklist.push(*init_node);
>                 }
>             } else {
>                 symbols.push((name, None));
>             }
>         } else if let AstNode::Function { body, .. } = node {
>             for child in body {
>                 worklist.push(child);
>             }
>         }
>     }
> 
>     symbols
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_ast_symbol_harvesting() {
>         let ast = AstNode::Function {
>             name: "main".to_string(),
>             body: vec![
>                 AstNode::VarDecl {
>                     name: "x".to_string(),
>                     initializer: Some(Box::new(AstNode::Literal(42))),
>                 },
>                 AstNode::VarDecl {
>                     name: "y".to_string(),
>                     initializer: None,
>                 },
>                 AstNode::VarDecl {
>                     name: "z".to_string(),
>                     initializer: Some(Box::new(AstNode::VarDecl {
>                         name: "nested".to_string(),
>                         initializer: Some(Box::new(AstNode::Literal(100))),
>                     })),
>                 },
>                 AstNode::NoOp,
>             ],
>         };
> 
>         let symbols = collect_declared_variables(ast);
> 
>         assert_eq!(symbols.len(), 4);
>         assert_eq!(symbols[0], ("z".to_string(), None));
>         assert_eq!(symbols[1], ("nested".to_string(), Some(100)));
>         assert_eq!(symbols[2], ("y".to_string(), None));
>         assert_eq!(symbols[3], ("x".to_string(), Some(42)));
>         assert_ne!(symbols.len(), 0);
>         assert!(!symbols.is_empty());
>         assert!(matches!(symbols[3], (ref name, Some(42)) if name == "x"));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Heap-Based Work-List Traversal**: Combining `while let Some(node) = worklist.pop()` with an explicit `Vec<AstNode>` converts recursive AST traversal into an iterative heap-allocated work-list. This guarantees $O(1)$ stack frame consumption regardless of AST depth.
> 2. **Nested Option and Box Matching**: The expression `if let Some(init_node) = initializer` unwraps the `Option`, and `if let AstNode::Literal(val) = *init_node` dereferences the heap `Box<AstNode>` to extract primitive value types.
> 3. **Selective Branch Discarding**: AST nodes that do not match `VarDecl` or `Function` variants (such as standalone `AstNode::NoOp` or `AstNode::Literal`) fail the pattern match conditions in `if let` / `else if let` branches and are discarded automatically.
> 4. **Ownership Transfers**: Dereferencing `*init_node` moves ownership of the boxed node out of the `Box` smart pointer into the work-list, ensuring zero copy overhead during symbol collection.

---

## 6. Related Terms


- [`match`](match.md) — The verbose, exhaustive parent of `if let`.
- [Pattern Matching](pattern_matching.md) — The underlying mechanic used by `if let` to extract values.
- [`let else` Statement](let_else_statement.md) — Related concept: `let else` Statement.
- [`Option<T>`](option_t.md) — (Future reference) `if let` is most commonly used to extract values from `Option` (`Some` / `None`).

---

## 7. Key Takeaways

- `if let Pattern = Value { ... }` is shorthand for a `match` statement that only cares about **one specific pattern**.
- It automatically and safely ignores all other possibilities.
- `while let Pattern = Value { ... }` loops continuously as long as the pattern successfully matches.
- It is perfect for handling `Option::Some` or `Result::Ok` when you don't care about the `None` or `Err` cases.
- If you find yourself writing an `else` block after an `if let`, you should probably just use `match`.
