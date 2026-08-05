# `matches!` Macro

> **Level 2 — Control Flow & Data Structures**
> `matches!(expr, Pattern)` returns a `bool` for a single pattern test, without writing a full `match`.

---

## 1. Prerequisites


- [`match`](match.md) — The full construct this macro is sugar over.
- [Pattern Matching](pattern_matching.md) — The pattern grammar accepted on the right-hand side.
- [Macros](../level_01/macros.md) — The general mechanism `matches!` is built with.

---

## 2. Term Category

**Utility Macro (the boolean pattern test)**: `matches!` answers exactly one question — "does this value match this pattern?" — as a plain `bool`, letting you use pattern matching directly inside an `if` condition, a `.filter()` closure, or anywhere else a boolean is expected, without the ceremony of a full `match` block.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Checking "is this enum variant X (ignoring its payload)?" with a full `match` is verbose for such a simple yes/no question:

```rust
let is_ready = match status {
    Status::Ready => true,
    _ => false,
};
```

That's four lines and a throwaway `_ => false` arm just to answer one boolean question. `matches!(status, Status::Ready)` expands to exactly this `match` under the hood, but as a **single expression** — because it's a macro, it can accept the full pattern grammar (including `|` alternatives and `if` guards) that a plain `==` comparison could never support (enums with data, or types without `PartialEq`, can't use `==` at all).

### (2) Reality Metaphor

Imagine a security checkpoint where a guard just needs to answer "does this badge match one of the approved shapes?" — not process the badge in any other way.

- **A full `match`**: The guard sets up an entire elaborate sorting station with a labeled bin for every possible badge shape, most of which just funnel into a "reject" bin, purely to answer one yes/no question.
- **`matches!`**: The guard holds up a single stencil (**the pattern**) against the badge and just says "yes" or "no" on the spot — same underlying comparison logic, but collapsed into a single instant boolean answer.

### (3) Rust Code Examples

#### Short Snippet (Basic Boolean Check)
```rust
enum Status { Ready, Pending, Failed(String) }

fn main() {
    let status = Status::Ready;

    // Without matches!:
    let is_ready_verbose = match status {
        Status::Ready => true,
        _ => false,
    };

    // With matches!: identical result, one line.
    let status2 = Status::Ready;
    let is_ready = matches!(status2, Status::Ready);

    println!("{is_ready_verbose} {is_ready}"); // true true
}
```

#### Fuller Example (Or-Patterns and Guards Inside `matches!`)
```rust
enum Status { Ready, Pending, Failed(String) }

fn main() {
    let s = Status::Failed("timeout".to_string());

    // Or-pattern: is it EITHER Ready or Pending?
    let active = matches!(s, Status::Ready | Status::Pending);
    println!("{active}"); // false

    // Pattern with a guard: is it a Failed variant AND does the message contain "timeout"?
    let timed_out = matches!(&s, Status::Failed(msg) if msg.contains("timeout"));
    println!("{timed_out}"); // true

    // Great inside iterator adapters, where a closure must return bool:
    let statuses = vec![Status::Ready, Status::Failed("oops".into()), Status::Pending];
    let ready_count = statuses.iter().filter(|s| matches!(s, Status::Ready)).count();
    println!("{ready_count}"); // 1
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Matches Macro Scoping and Lifecycle Rules

**The mistake:** Assuming Matches Macro instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("matches_macro_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("matches_macro_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Matches Macro State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Matches Macro through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Matches Macro Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Matches Macro instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Financial Market Engine — Order Event Classification

**Problem:** In a high-frequency trading platform, order lifecycle events are emitted as an un-derived enum `OrderEvent`:

```rust
pub enum OrderEvent {
    Submitted { order_id: u64, trader_id: u32, price: u64 },
    PartialFill { order_id: u64, filled_qty: u32, remaining_qty: u32, fill_price: u64 },
    FullyFilled { order_id: u64, total_qty: u32, avg_price: u64 },
    Cancelled { order_id: u64, reason: String },
    Rejected { order_id: u64, error_code: u16 },
}
```

Because `OrderEvent` contains dynamic heap-allocated data (`String`), it does not derive `PartialEq` or `Eq`. Implement an `OrderTracker` struct with three methods:
1. `is_terminal(&self, event: &OrderEvent) -> bool`: Uses `matches!` with OR-patterns to identify terminal events (`FullyFilled`, `Cancelled`, `Rejected`).
2. `is_significant_fill(&self, event: &OrderEvent, min_qty: u32) -> bool`: Uses `matches!` with pattern guards to return `true` if an event is a `PartialFill` with `filled_qty >= min_qty` OR a `FullyFilled` with `total_qty >= min_qty`.
3. `filter_active_events<'a>(&self, events: &'a [OrderEvent]) -> Vec<&'a OrderEvent>`: Uses `.iter().filter()` with `matches!` to retain only non-terminal events (`Submitted`, `PartialFill`).

Include a complete unit test module `#[cfg(test)] mod tests` using `assert!`, `assert_eq!`, `assert_ne!`, and `matches!`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug)]
> pub enum OrderEvent {
>     Submitted { order_id: u64, trader_id: u32, price: u64 },
>     PartialFill { order_id: u64, filled_qty: u32, remaining_qty: u32, fill_price: u64 },
>     FullyFilled { order_id: u64, total_qty: u32, avg_price: u64 },
>     Cancelled { order_id: u64, reason: String },
>     Rejected { order_id: u64, error_code: u16 },
> }
> 
> pub struct OrderTracker;
> 
> impl OrderTracker {
>     pub fn new() -> Self {
>         Self
>     }
> 
>     pub fn is_terminal(&self, event: &OrderEvent) -> bool {
>         matches!(
>             event,
>             OrderEvent::FullyFilled { .. }
>                 | OrderEvent::Cancelled { .. }
>                 | OrderEvent::Rejected { .. }
>         )
>     }
> 
>     pub fn is_significant_fill(&self, event: &OrderEvent, min_qty: u32) -> bool {
>         matches!(
>             event,
>             OrderEvent::PartialFill { filled_qty, .. } if *filled_qty >= min_qty
>         ) || matches!(
>             event,
>             OrderEvent::FullyFilled { total_qty, .. } if *total_qty >= min_qty
>         )
>     }
> 
>     pub fn filter_active_events<'a>(&self, events: &'a [OrderEvent]) -> Vec<&'a OrderEvent> {
>         events
>             .iter()
>             .filter(|e| matches!(e, OrderEvent::Submitted { .. } | OrderEvent::PartialFill { .. }))
>             .collect()
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_order_tracker_terminal_and_significant() {
>         let tracker = OrderTracker::new();
> 
>         let sub = OrderEvent::Submitted { order_id: 101, trader_id: 1, price: 50000 };
>         let part_small = OrderEvent::PartialFill { order_id: 101, filled_qty: 10, remaining_qty: 90, fill_price: 50000 };
>         let part_large = OrderEvent::PartialFill { order_id: 101, filled_qty: 500, remaining_qty: 0, fill_price: 50000 };
>         let full = OrderEvent::FullyFilled { order_id: 102, total_qty: 1000, avg_price: 50100 };
>         let cancel = OrderEvent::Cancelled { order_id: 103, reason: "User requested".into() };
> 
>         // Test is_terminal
>         assert!(!tracker.is_terminal(&sub));
>         assert!(!tracker.is_terminal(&part_small));
>         assert!(tracker.is_terminal(&full));
>         assert!(tracker.is_terminal(&cancel));
> 
>         // Test is_significant_fill
>         assert!(!tracker.is_significant_fill(&part_small, 100));
>         assert!(tracker.is_significant_fill(&part_large, 100));
>         assert!(tracker.is_significant_fill(&full, 500));
> 
>         // Test filter_active_events with assertions
>         let events = vec![sub, part_small, full, cancel];
>         let active = tracker.filter_active_events(&events);
> 
>         assert_eq!(active.len(), 2);
>         assert_ne!(active.len(), 4);
>         assert!(matches!(active[0], OrderEvent::Submitted { .. }));
>         assert!(matches!(active[1], OrderEvent::PartialFill { .. }));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Pattern Matching without `PartialEq` Trait**: In production Rust systems, data types like `OrderEvent` may omit `PartialEq` due to containing non-comparable fields, complex heap types (`String`), or privacy encapsulations. `matches!` operates purely at the compiler pattern destructuring level without invoking operator overloading (`==`), avoiding synthesized trait implementations.
> 2. **OR-Pattern Aggregation (`|`)**: The `is_terminal` method condenses three distinct terminal state variants (`FullyFilled`, `Cancelled`, `Rejected`) into a single boolean expression. The wildcard `..` ignores all payload fields, avoiding unnecessary variable bindings or memory moves.
> 3. **Pattern Guards with Reference Dereferencing**: In `is_significant_fill`, the pattern `OrderEvent::PartialFill { filled_qty, .. } if *filled_qty >= min_qty` borrows the `filled_qty` scalar field as `&u32` when matching against `&OrderEvent`. The guard expression dereferences `*filled_qty` to evaluate the boolean condition without taking ownership of the event.
> 4. **Zero-Cost Inlining inside Iterator Adapters**: In `filter_active_events`, passing `|e| matches!(e, ...)` into `.filter()` allows the Rust compiler to collapse the match arm checking into a simple conditional branch instruction in assembly, outperforming manual loops while maintaining code readability.

---

### Exercise 2: Protocol Security Gateway — HTTP/2 Binary Frame Inspector

**Problem:** In an edge network proxy, binary protocol frames of HTTP/2 connections are decoded into an un-derived enum `Http2Frame`:

```rust
pub enum Http2Frame {
    Data { stream_id: u32, payload_len: usize, flags: u8 },
    Headers { stream_id: u32, flags: u8, priority: Option<u32> },
    Priority { stream_id: u32, weight: u8 },
    RstStream { stream_id: u32, error_code: u32 },
    Settings { ack: bool, params: Vec<(u16, u32)> },
    Ping { ack: bool, payload: u64 },
    GoAway { last_stream_id: u32, error_code: u32 },
}
```

Implement a `FrameInspector` struct with three methods:
1. `is_control_frame(&self, frame: &Http2Frame) -> bool`: Uses `matches!` with OR-patterns to identify connection-level control frames (`Settings`, `Ping`, `GoAway`).
2. `is_stream_termination(&self, frame: &Http2Frame) -> bool`: Uses `matches!` with guards to return `true` if the frame is `RstStream` OR if it is a `Data`/`Headers` frame with the `END_STREAM` flag (`flags & 0x01 != 0`) set.
3. `count_unacknowledged_settings(&self, frames: &[Http2Frame]) -> usize`: Uses `.iter().filter()` with `matches!` matching directly on literal field pattern `ack: false` to count unacknowledged settings frames.

Include a complete unit test module `#[cfg(test)] mod tests` using `assert!`, `assert_eq!`, `assert_ne!`, and `matches!`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug)]
> pub enum Http2Frame {
>     Data { stream_id: u32, payload_len: usize, flags: u8 },
>     Headers { stream_id: u32, flags: u8, priority: Option<u32> },
>     Priority { stream_id: u32, weight: u8 },
>     RstStream { stream_id: u32, error_code: u32 },
>     Settings { ack: bool, params: Vec<(u16, u32)> },
>     Ping { ack: bool, payload: u64 },
>     GoAway { last_stream_id: u32, error_code: u32 },
> }
> 
> pub struct FrameInspector;
> 
> impl FrameInspector {
>     pub const END_STREAM_FLAG: u8 = 0x01;
> 
>     pub fn new() -> Self {
>         Self
>     }
> 
>     pub fn is_control_frame(&self, frame: &Http2Frame) -> bool {
>         matches!(
>             frame,
>             Http2Frame::Settings { .. } | Http2Frame::Ping { .. } | Http2Frame::GoAway { .. }
>         )
>     }
> 
>     pub fn is_stream_termination(&self, frame: &Http2Frame) -> bool {
>         matches!(frame, Http2Frame::RstStream { .. })
>             || matches!(
>                 frame,
>                 Http2Frame::Data { flags, .. } | Http2Frame::Headers { flags, .. }
>                     if (flags & Self::END_STREAM_FLAG) != 0
>             )
>     }
> 
>     pub fn count_unacknowledged_settings(&self, frames: &[Http2Frame]) -> usize {
>         frames
>             .iter()
>             .filter(|f| matches!(f, Http2Frame::Settings { ack: false, .. }))
>             .count()
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_frame_inspector() {
>         let inspector = FrameInspector::new();
> 
>         let ping = Http2Frame::Ping { ack: false, payload: 12345 };
>         let settings_unack = Http2Frame::Settings { ack: false, params: vec![(1, 4096)] };
>         let settings_ack = Http2Frame::Settings { ack: true, params: vec![] };
>         let data_ongoing = Http2Frame::Data { stream_id: 1, payload_len: 512, flags: 0x00 };
>         let data_end = Http2Frame::Data { stream_id: 1, payload_len: 0, flags: 0x01 };
>         let rst = Http2Frame::RstStream { stream_id: 3, error_code: 8 };
> 
>         // Test is_control_frame
>         assert!(inspector.is_control_frame(&ping));
>         assert!(inspector.is_control_frame(&settings_unack));
>         assert!(!inspector.is_control_frame(&data_ongoing));
> 
>         // Test is_stream_termination
>         assert!(!inspector.is_stream_termination(&data_ongoing));
>         assert!(inspector.is_stream_termination(&data_end));
>         assert!(inspector.is_stream_termination(&rst));
> 
>         // Test count_unacknowledged_settings
>         let frames = vec![ping, settings_unack, settings_ack, data_ongoing, data_end, rst];
>         let unack_count = inspector.count_unacknowledged_settings(&frames);
> 
>         assert_eq!(unack_count, 1);
>         assert_ne!(unack_count, 2);
> 
>         assert!(matches!(frames[0], Http2Frame::Ping { ack: false, .. }));
>         assert!(matches!(frames[5], Http2Frame::RstStream { error_code: 8, .. }));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Literal Pattern Matching vs Dynamic Guards**: In `count_unacknowledged_settings`, `matches!(f, Http2Frame::Settings { ack: false, .. })` matches directly on a constant literal value (`ack: false`) inside the struct pattern destructuring. This avoids generating extra runtime branch instructions compared to a post-match `if` guard.
> 2. **Bitwise Operations inside Match Guards**: In `is_stream_termination`, `matches!(frame, Http2Frame::Data { flags, .. } | Http2Frame::Headers { flags, .. } if (flags & Self::END_STREAM_FLAG) != 0)` demonstrates combining structural pattern destructuring across distinct variants sharing a field name (`flags`) with bitwise operation evaluation inside a unified guard expression.
> 3. **Non-Borrowing Structural Inspection**: By passing shared references (`&Http2Frame`) to `matches!`, the compiler creates immutable reference bindings to nested fields. The lifetime of all frame payloads (`Vec<(u16, u32)>`) remains unaffected, ensuring high-throughput packet processing without stack allocation overhead or ownership transfer.
> 4. **Handling Unused Variants**: Wildcard destructuring patterns (`..`) inform the compiler that remaining fields (such as `payload_len` or `priority`) are intentionally ignored, preventing unused variable warnings while maintaining pattern match accuracy.

---

### Exercise 3: SQL AST Security Analyzer & Query Audit Firewall

**Problem:** A database firewall middleware inspects Abstract Syntax Tree (AST) query nodes before query execution to detect dangerous operations:

```rust
pub enum SqlAstNode {
    Select { tables: Vec<String>, columns: Vec<String>, where_clause: Option<Box<SqlAstNode>> },
    Insert { table: String, values_count: usize },
    Update { table: String, fields: Vec<String> },
    Delete { table: String, is_truncated: bool },
    RawFunctionCall { name: String, args: Vec<SqlAstNode> },
    Literal(String),
}
```

Implement a `QuerySecurityAnalyzer` struct with three methods:
1. `is_mutation_query(&self, node: &SqlAstNode) -> bool`: Uses `matches!` with OR-patterns to identify state-modifying AST nodes (`Insert`, `Update`, `Delete`).
2. `contains_dangerous_func(&self, node: &SqlAstNode) -> bool`: Traverses the AST recursively and uses `matches!` with guards to detect if any `RawFunctionCall` node has a `name` matching `"EXEC"`, `"EVAL"`, or `"SYSTEM"` (case-insensitive).
3. `is_unbounded_delete(&self, node: &SqlAstNode) -> bool`: Uses `matches!` with pattern guards to detect `Delete` nodes where `is_truncated` is `true`.

Include a complete unit test module `#[cfg(test)] mod tests` using `assert!`, `assert_eq!`, `assert_ne!`, and `matches!`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug)]
> pub enum SqlAstNode {
>     Select { tables: Vec<String>, columns: Vec<String>, where_clause: Option<Box<SqlAstNode>> },
>     Insert { table: String, values_count: usize },
>     Update { table: String, fields: Vec<String> },
>     Delete { table: String, is_truncated: bool },
>     RawFunctionCall { name: String, args: Vec<SqlAstNode> },
>     Literal(String),
> }
> 
> pub struct QuerySecurityAnalyzer;
> 
> impl QuerySecurityAnalyzer {
>     pub fn new() -> Self {
>         Self
>     }
> 
>     pub fn is_mutation_query(&self, node: &SqlAstNode) -> bool {
>         matches!(
>             node,
>             SqlAstNode::Insert { .. } | SqlAstNode::Update { .. } | SqlAstNode::Delete { .. }
>         )
>     }
> 
>     pub fn contains_dangerous_func(&self, node: &SqlAstNode) -> bool {
>         if matches!(
>             node,
>             SqlAstNode::RawFunctionCall { name, .. }
>                 if name.eq_ignore_ascii_case("EXEC")
>                     || name.eq_ignore_ascii_case("EVAL")
>                     || name.eq_ignore_ascii_case("SYSTEM")
>         ) {
>             return true;
>         }
> 
>         match node {
>             SqlAstNode::Select { where_clause, .. } => {
>                 if let Some(child) = where_clause {
>                     self.contains_dangerous_func(child)
>                 } else {
>                     false
>                 }
>             }
>             SqlAstNode::RawFunctionCall { args, .. } => {
>                 args.iter().any(|arg| self.contains_dangerous_func(arg))
>             }
>             _ => false,
>         }
>     }
> 
>     pub fn is_unbounded_delete(&self, node: &SqlAstNode) -> bool {
>         matches!(node, SqlAstNode::Delete { is_truncated: true, .. })
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_sql_ast_analyzer() {
>         let analyzer = QuerySecurityAnalyzer::new();
> 
>         let select_safe = SqlAstNode::Select {
>             tables: vec!["users".into()],
>             columns: vec!["id".into(), "email".into()],
>             where_clause: None,
>         };
> 
>         let insert = SqlAstNode::Insert { table: "logs".into(), values_count: 5 };
>         let delete_unbounded = SqlAstNode::Delete { table: "sessions".into(), is_truncated: true };
>         let delete_bounded = SqlAstNode::Delete { table: "sessions".into(), is_truncated: false };
> 
>         let dangerous_fn = SqlAstNode::RawFunctionCall {
>             name: "EXEC".into(),
>             args: vec![SqlAstNode::Literal("xp_cmdshell".into())],
>         };
> 
>         let select_nested_danger = SqlAstNode::Select {
>             tables: vec!["audit".into()],
>             columns: vec!["*".into()],
>             where_clause: Some(Box::new(SqlAstNode::RawFunctionCall {
>                 name: "eval".into(),
>                 args: vec![],
>             })),
>         };
> 
>         // Test is_mutation_query
>         assert!(!analyzer.is_mutation_query(&select_safe));
>         assert!(analyzer.is_mutation_query(&insert));
>         assert!(analyzer.is_mutation_query(&delete_unbounded));
> 
>         // Test is_unbounded_delete
>         assert!(analyzer.is_unbounded_delete(&delete_unbounded));
>         assert!(!analyzer.is_unbounded_delete(&delete_bounded));
> 
>         // Test contains_dangerous_func
>         assert!(analyzer.contains_dangerous_func(&dangerous_fn));
>         assert!(analyzer.contains_dangerous_func(&select_nested_danger));
>         assert!(!analyzer.contains_dangerous_func(&select_safe));
> 
>         // Explicit assertions
>         assert_eq!(analyzer.is_mutation_query(&insert), true);
>         assert_ne!(analyzer.is_unbounded_delete(&delete_bounded), true);
>         assert!(matches!(dangerous_fn, SqlAstNode::RawFunctionCall { ref name, .. } if name == "EXEC"));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Recursive AST Traversal & Guard Evaluation**: In `contains_dangerous_func`, `matches!` evaluates the current node level against high-risk security primitives using `eq_ignore_ascii_case`. Combining guard conditions with recursive descent over recursive data structures (`Box<SqlAstNode>` and `Vec<SqlAstNode>`) allows early short-circuit evaluation as soon as an unsafe payload is detected.
> 2. **Handling Nested Enums without Deep Unwrapping**: Using `matches!` prevents nested `if let` pyramid structures. Instead of unwrapping `Option<Box<SqlAstNode>>` manually at every step, pattern guard checks evaluate top-level node conditions cleanly.
> 3. **Lifetime & Move Invariants**: Because `node` is borrowed immutably (`&SqlAstNode`), recursive calls `self.contains_dangerous_func(child)` pass shared references deeper down the stack without taking ownership or cloning heap strings (`table`, `columns`, `name`).
> 4. **Safety & Zero Overhead**: Structural inspection via `matches!` expands at macro expansion time into native pattern matching compiler directives, ensuring zero runtime macro allocation overhead while providing comprehensive query safety guarantees.

---

## 6. Related Terms


- [`match`](match.md) — The full construct `matches!` expands into internally.
- [Pattern Matching](pattern_matching.md) — Supplies the or-patterns (`|`) and guards (`if`) `matches!` accepts.
- [`PartialEq` / `Eq`](../level_04/partialeq_eq.md) — What `==` requires, and what `matches!` deliberately does **not** require.
- [`let else` Statement](let_else_statement.md) — A sibling pattern-matching-flattening macro/statement, for a different use case (extraction rather than boolean testing).

---

## 7. Key Takeaways

- `matches!(value, pattern)` is sugar for a full `match` that returns `true` on a match and `false` otherwise, as a single expression.
- It accepts the **full pattern grammar** — or-patterns (`A | B`) and `if` guards — not just simple equality.
- It works on types that don't implement `PartialEq`, since it's structural pattern matching, not comparison.
- Especially useful inside closures (`.filter()`, `.find()`) where a `match` block would be awkward to inline.
