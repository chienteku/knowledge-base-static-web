# Module

> **Level 1 — Foundations**
> A namespace mechanism (`mod`) for organizing code within a crate.

---

## 1. Prerequisites


- [Crate](crate.md) — A compilation unit in Rust; either a binary (executable) or a library.

---

## 2. Term Category

**Rust-specific**

While many languages have modules, Rust’s explicit module system (`mod`), file mapping rules, and strict privacy boundaries are uniquely designed to tame large codebases.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

As a Rust designer, when we started building larger programs, we quickly realized that throwing all our code into a single `main.rs` or `lib.rs` file was a disaster. Naming collisions became frequent, finding specific logic was like searching for a needle in a haystack, and everything was public by default, leading to tangled, unmaintainable code.

We needed a way to partition code, group related items together, and establish strict boundaries. While some languages implicitly treat every file as a module, we wanted something more explicit. We designed the `mod` keyword to let developers explicitly declare the module tree, independent of the file system (though they often align). This explicit declaration allows you to define a clear API, hide implementation details using Rust's privacy rules (everything is private by default), and prevent sprawling spaghetti code within a crate.

### (2) Reality Metaphor

Think of a **Crate** as a large office building. If a crate had no modules, it would be a giant, open-plan warehouse where every employee (function, struct) is shouting over each other, and anyone can grab the CEO's private documents. 

A **Module** is like a department or a specific room within that building (e.g., HR, Engineering, Sales). By putting employees in specific rooms, you organize them logically. You can also put locks on the doors (privacy) so that only authorized people can enter, while providing a reception desk (`pub` functions) for public interactions.

### (3) Rust Code Examples

#### Short Snippet

```rust
// Declaring a module named `math`
mod math {
    // This function is public and can be used outside the module
    pub fn add(a: i32, b: i32) -> i32 {
        a + b
    }

    // This function is private by default, only usable within `math`
    fn subtract(a: i32, b: i32) -> i32 {
        a - b
    }
}

fn main() {
    // Accessing the public function using the path `math::add`
    let sum = math::add(5, 10);
    println!("Sum: {sum}");
}
```

#### Fuller Example

```rust
// A real-world scenario of organizing a game's logic
mod game {
    // A nested module for player-related logic
    pub mod player {
        pub struct Player {
            pub name: String,
            health: u32, // Private field, cannot be modified directly from outside
        }

        impl Player {
            // Public constructor
            pub fn new(name: &str) -> Self {
                Self {
                    name: name.to_string(),
                    health: 100,
                }
            }

            pub fn take_damage(&mut self, amount: u32) {
                self.health = self.health.saturating_sub(amount);
                println!("{} took {} damage. Health: {}", self.name, amount, self.health);
            }
        }
    }

    // Another nested module
    pub mod enemies {
        // Can access other modules using absolute paths
        pub fn spawn_goblin() {
            println!("A wild goblin appears!");
        }
    }
}

fn main() {
    // Using items from our module tree
    game::enemies::spawn_goblin();

    // Creating a player using the public API
    let mut hero = game::player::Player::new("Arthur");
    hero.take_damage(20);
    
    // error[E0616]: field `health` of struct `Player` is private
    // hero.health = 10000; 
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to make items public (`pub`)

**The mistake:** Rust items (functions, structs, fields) are private by default. Beginners often create a module and try to use its contents, resulting in a compiler error.

**Why it's wrong:** Modules act as privacy boundaries. If you want an item to be accessible from outside the module, you must explicitly mark it with the `pub` keyword.

*Incorrect:*
```rust
mod utils {
    fn helper() {
        println!("Helping!");
    }
}

fn main() {
    utils::helper(); // ERROR: function `helper` is private
}
```

*Fix:* Mark items you want to expose with `pub`:
```rust
mod utils {
    pub fn helper() {
        println!("Helping!");
    }
}

fn main() {
    utils::helper(); // Works!
}
```

### Mistake 2: Confusing `mod` (declaration) with `use` (import)

**The mistake:** Developers coming from other languages often think `mod my_file;` is how you import code to use it. 

**Why it's wrong:** `mod` *declares* the existence of a module and tells the compiler to compile it as part of the module tree. You only write `mod some_file;` once per file. `use` brings an already-declared item into your current scope.

*Incorrect:*
```rust
// Assuming a file `math.rs` exists
// Trying to "import" it inside a function or nested module
fn calculate() {
    mod math; // ERROR or unexpected behavior: tries to look for `math/math.rs` or `calculate/math.rs`
}
```

*Fix:*
```rust
// Declare the module at the root of your crate (e.g., in main.rs or lib.rs)
mod math;

fn calculate() {
    // Bring the item into scope using `use`
    use math::add;
    // let result = add(2, 2);
}
```

---

### Mistake 3: Concurrent Access to Module Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Module instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Telemetry Pipeline with Encapsulated Storage and Fine-Grained Module Visibility

**Problem:** In high-throughput cloud microservices, telemetry engines process log entries, apply severity filters, and aggregate statistics before flushing. You are tasked with architecting a `telemetry` module with the following privacy boundaries:
1. Inner submodule `telemetry::ingest`: Exposes `LogEntry`, `LogLevel`, and `LogIngestor`. Struct fields inside `LogEntry` (`level`, `message`, `timestamp_ms`) must remain private so callers cannot fabricate timestamps or create unvalidated empty messages.
2. Inner submodule `telemetry::storage`: Handles internal buffer accumulation (`LogBuffer`). `LogBuffer` must be hidden from external callers using `pub(super)` visibility so that code outside `telemetry` cannot touch internal storage directly.
3. Top-level `telemetry` module: Provides a public facade by re-exporting essential API types (`pub use ingest::{LogEntry, LogLevel, LogIngestor};` and `pub use storage::AggregatedStats;`).

Implement the full `telemetry` pipeline with validation rules and unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub mod telemetry {
>     pub mod ingest {
>         #[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
>         pub enum LogLevel {
>             Debug = 0,
>             Info = 1,
>             Warn = 2,
>             Error = 3,
>         }
> 
>         #[derive(Debug, Clone, PartialEq, Eq)]
>         pub struct LogEntry {
>             level: LogLevel,
>             message: String,
>             timestamp_ms: u64,
>         }
> 
>         impl LogEntry {
>             pub fn new(level: LogLevel, message: impl Into<String>, timestamp_ms: u64) -> Result<Self, &'static str> {
>                 let msg = message.into();
>                 if msg.trim().is_empty() {
>                     return Err("Log message cannot be empty");
>                 }
>                 Ok(Self {
>                     level,
>                     message: msg,
>                     timestamp_ms,
>                 })
>             }
> 
>             pub fn level(&self) -> LogLevel {
>                 self.level
>             }
> 
>             pub fn message(&self) -> &str {
>                 &self.message
>             }
> 
>             pub fn timestamp_ms(&self) -> u64 {
>                 self.timestamp_ms
>             }
>         }
> 
>         pub struct LogIngestor {
>             min_level: LogLevel,
>         }
> 
>         impl LogIngestor {
>             pub fn new(min_level: LogLevel) -> Self {
>                 Self { min_level }
>             }
> 
>             pub fn process(&self, entry: LogEntry) -> Option<LogEntry> {
>                 if entry.level() >= self.min_level {
>                     Some(entry)
>                 } else {
>                     None
>                 }
>             }
>         }
>     }
> 
>     mod storage {
>         use super::ingest::{LogEntry, LogLevel};
> 
>         #[derive(Debug, Default, PartialEq, Eq)]
>         pub struct AggregatedStats {
>             pub total_processed: usize,
>             pub error_count: usize,
>             pub warn_count: usize,
>         }
> 
>         // Module-private buffer engine, restricted to super (telemetry module)
>         pub(super) struct LogBuffer {
>             entries: Vec<LogEntry>,
>         }
> 
>         impl LogBuffer {
>             pub(super) fn new() -> Self {
>                 Self { entries: Vec::new() }
>             }
> 
>             pub(super) fn push(&mut self, entry: LogEntry) {
>                 self.entries.push(entry);
>             }
> 
>             pub(super) fn stats(&self) -> AggregatedStats {
>                 let mut stats = AggregatedStats::default();
>                 stats.total_processed = self.entries.len();
>                 for entry in &self.entries {
>                     match entry.level() {
>                         LogLevel::Error => stats.error_count += 1,
>                         LogLevel::Warn => stats.warn_count += 1,
>                         _ => {}
>                     }
>                 }
>                 stats
>             }
> 
>             pub(super) fn clear(&mut self) {
>                 self.entries.clear();
>             }
>         }
>     }
> 
>     // Re-export public API facade
>     pub use ingest::{LogEntry, LogLevel, LogIngestor};
>     pub use storage::AggregatedStats;
> 
>     pub struct TelemetryPipeline {
>         ingestor: LogIngestor,
>         buffer: storage::LogBuffer,
>     }
> 
>     impl TelemetryPipeline {
>         pub fn new(min_level: LogLevel) -> Self {
>             Self {
>                 ingestor: LogIngestor::new(min_level),
>                 buffer: storage::LogBuffer::new(),
>             }
>         }
> 
>         pub fn submit(&mut self, entry: LogEntry) -> bool {
>             if let Some(accepted) = self.ingestor.process(entry) {
>                 self.buffer.push(accepted);
>                 true
>             } else {
>                 false
>             }
>         }
> 
>         pub fn get_stats(&self) -> AggregatedStats {
>             self.buffer.stats()
>         }
> 
>         pub fn flush(&mut self) {
>             self.buffer.clear();
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::telemetry::*;
> 
>     #[test]
>     fn test_log_entry_validation() {
>         let valid = LogEntry::new(LogLevel::Info, "System boot complete", 1600000000);
>         assert!(valid.is_ok());
>         let entry = valid.unwrap();
>         assert_eq!(entry.level(), LogLevel::Info);
>         assert_eq!(entry.message(), "System boot complete");
>         assert_eq!(entry.timestamp_ms(), 1600000000);
> 
>         let invalid = LogEntry::new(LogLevel::Error, "   ", 1600000001);
>         assert!(invalid.is_err());
>         assert_eq!(invalid.unwrap_err(), "Log message cannot be empty");
>     }
> 
>     #[test]
>     fn test_pipeline_filtering_and_stats() {
>         let mut pipeline = TelemetryPipeline::new(LogLevel::Warn);
> 
>         let debug_entry = LogEntry::new(LogLevel::Debug, "Cache miss", 100).unwrap();
>         let warn_entry = LogEntry::new(LogLevel::Warn, "High memory usage", 101).unwrap();
>         let error_entry = LogEntry::new(LogLevel::Error, "Disk write failure", 102).unwrap();
> 
>         assert!(!pipeline.submit(debug_entry));
>         assert!(pipeline.submit(warn_entry.clone()));
>         assert!(pipeline.submit(error_entry.clone()));
> 
>         let stats = pipeline.get_stats();
>         assert_eq!(stats.total_processed, 2);
>         assert_eq!(stats.warn_count, 1);
>         assert_eq!(stats.error_count, 1);
> 
>         assert_ne!(stats.total_processed, 3);
>         assert!(matches!(warn_entry.level(), LogLevel::Warn));
> 
>         pipeline.flush();
>         let flushed_stats = pipeline.get_stats();
>         assert_eq!(flushed_stats.total_processed, 0);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Encapsulation & Struct Field Privacy:** In Rust, making a struct public (`pub struct LogEntry`) does **not** automatically make its fields public. Private struct fields enforce invariants at runtime (e.g., ensuring `message` is non-empty upon construction via `LogEntry::new`).
> 2. **Super-Module Visibility (`pub(super)`):** By decorating `LogBuffer` with `pub(super)`, visibility is explicitly restricted to the parent module (`telemetry`). Code at the crate root or in sibling modules cannot instantiate or inspect `LogBuffer`, preventing internal buffer corruption.
> 3. **Facade Re-exporting (`pub use`):** Re-exporting nested items at the module root presents a clean, flattened public API facade to consumers while preserving strict modular encapsulation internally.
> 4. **Ownership & Lifetimes:** Log messages use owned `String` allocations, allowing entries to be safely passed from the `ingestor` into the `storage` buffer without lifetime annotations.
> 5. **Edge Cases:** Validation errors occur if messages contain only whitespace. Filtering ensures logs below `min_level` are dropped before storage memory is allocated.
>

---

### Exercise 2: High-Frequency Trading (HFT) Order Gateway & Encapsulated Risk Engine

**Problem:** Financial trading platforms require strict security boundaries to prevent illegal order modifications or bypassing pre-trade risk checks.
Architect a modular financial order matching and risk engine inside a top-level `trading` module:
1. `trading::order`: Defines `OrderSide` (`Buy`, `Sell`) and `Order`. Struct fields in `Order` (`id`, `symbol`, `side`, `price_cents`, `quantity`, `filled_qty`) must remain private so price or executed quantities cannot be mutated directly by external code. Expose explicit getter and mutation methods (`fill(&mut self, qty)`).
2. `trading::risk`: Defines `RiskEngine` with configurable limits (`max_quantity`, `max_order_value_cents`). Exposes `validate_order(&self, order: &Order) -> Result<(), RiskViolation>`.
3. `trading::matching`: Defines `MatchingEngine` containing order books for matching buy and sell orders.
4. Top-level re-exports: `pub use order::{Order, OrderSide};`, `pub use risk::{RiskEngine, RiskViolation};`, `pub use matching::{MatchingEngine, Trade};`.

Implement the complete `trading` architecture and unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub mod trading {
>     pub mod order {
>         #[derive(Debug, Clone, Copy, PartialEq, Eq)]
>         pub enum OrderSide {
>             Buy,
>             Sell,
>         }
> 
>         #[derive(Debug, Clone, PartialEq, Eq)]
>         pub struct Order {
>             id: u64,
>             symbol: String,
>             side: OrderSide,
>             price_cents: u64,
>             quantity: u64,
>             filled_qty: u64,
>         }
> 
>         impl Order {
>             pub fn new(id: u64, symbol: impl Into<String>, side: OrderSide, price_cents: u64, quantity: u64) -> Result<Self, &'static str> {
>                 if quantity == 0 {
>                     return Err("Quantity must be greater than zero");
>                 }
>                 if price_cents == 0 {
>                     return Err("Price must be greater than zero");
>                 }
>                 Ok(Self {
>                     id,
>                     symbol: symbol.into(),
>                     side,
>                     price_cents,
>                     quantity,
>                     filled_qty: 0,
>                 })
>             }
> 
>             pub fn id(&self) -> u64 { self.id }
>             pub fn symbol(&self) -> &str { &self.symbol }
>             pub fn side(&self) -> OrderSide { self.side }
>             pub fn price_cents(&self) -> u64 { self.price_cents }
>             pub fn quantity(&self) -> u64 { self.quantity }
>             pub fn filled_qty(&self) -> u64 { self.filled_qty }
>             pub fn remaining_qty(&self) -> u64 { self.quantity - self.filled_qty }
> 
>             pub fn fill(&mut self, qty: u64) -> Result<u64, &'static str> {
>                 if qty == 0 {
>                     return Err("Fill quantity must be positive");
>                 }
>                 if self.filled_qty + qty > self.quantity {
>                     return Err("Fill exceeds remaining quantity");
>                 }
>                 self.filled_qty += qty;
>                 Ok(self.filled_qty)
>             }
>         }
>     }
> 
>     pub mod risk {
>         use super::order::Order;
> 
>         #[derive(Debug, PartialEq, Eq)]
>         pub enum RiskViolation {
>             QuantityLimitExceeded { limit: u64, requested: u64 },
>             OrderValueExceeded { limit: u64, actual: u64 },
>         }
> 
>         pub struct RiskEngine {
>             max_quantity: u64,
>             max_order_value_cents: u64,
>         }
> 
>         impl RiskEngine {
>             pub fn new(max_quantity: u64, max_order_value_cents: u64) -> Self {
>                 Self { max_quantity, max_order_value_cents }
>             }
> 
>             pub fn validate_order(&self, order: &Order) -> Result<(), RiskViolation> {
>                 if order.quantity() > self.max_quantity {
>                     return Err(RiskViolation::QuantityLimitExceeded {
>                         limit: self.max_quantity,
>                         requested: order.quantity(),
>                     });
>                 }
>                 let total_value = order.price_cents().saturating_mul(order.quantity());
>                 if total_value > self.max_order_value_cents {
>                     return Err(RiskViolation::OrderValueExceeded {
>                         limit: self.max_order_value_cents,
>                         actual: total_value,
>                     });
>                 }
>                 Ok(())
>             }
>         }
>     }
> 
>     pub mod matching {
>         use super::order::{Order, OrderSide};
>         use super::risk::RiskEngine;
> 
>         #[derive(Debug, PartialEq, Eq)]
>         pub struct Trade {
>             pub buy_order_id: u64,
>             pub sell_order_id: u64,
>             pub price_cents: u64,
>             pub quantity: u64,
>         }
> 
>         pub struct MatchingEngine {
>             risk_engine: RiskEngine,
>             buy_orders: Vec<Order>,
>             sell_orders: Vec<Order>,
>         }
> 
>         impl MatchingEngine {
>             pub fn new(risk_engine: RiskEngine) -> Self {
>                 Self {
>                     risk_engine,
>                     buy_orders: Vec::new(),
>                     sell_orders: Vec::new(),
>                 }
>             }
> 
>             pub fn submit_order(&mut self, mut order: Order) -> Result<Vec<Trade>, String> {
>                 self.risk_engine.validate_order(&order).map_err(|e| format!("Risk violation: {:?}", e))?;
> 
>                 let mut trades = Vec::new();
>                 match order.side() {
>                     OrderSide::Buy => {
>                         for sell in self.sell_orders.iter_mut() {
>                             if order.remaining_qty() == 0 { break; }
>                             if order.price_cents() >= sell.price_cents() {
>                                 let match_qty = std::cmp::min(order.remaining_qty(), sell.remaining_qty());
>                                 if match_qty > 0 {
>                                     let execution_price = sell.price_cents();
>                                     order.fill(match_qty).unwrap();
>                                     sell.fill(match_qty).unwrap();
>                                     trades.push(Trade {
>                                         buy_order_id: order.id(),
>                                         sell_order_id: sell.id(),
>                                         price_cents: execution_price,
>                                         quantity: match_qty,
>                                     });
>                                 }
>                             }
>                         }
>                         self.sell_orders.retain(|s| s.remaining_qty() > 0);
>                         if order.remaining_qty() > 0 {
>                             self.buy_orders.push(order);
>                         }
>                     }
>                     OrderSide::Sell => {
>                         for buy in self.buy_orders.iter_mut() {
>                             if order.remaining_qty() == 0 { break; }
>                             if buy.price_cents() >= order.price_cents() {
>                                 let match_qty = std::cmp::min(order.remaining_qty(), buy.remaining_qty());
>                                 if match_qty > 0 {
>                                     let execution_price = buy.price_cents();
>                                     order.fill(match_qty).unwrap();
>                                     buy.fill(match_qty).unwrap();
>                                     trades.push(Trade {
>                                         buy_order_id: buy.id(),
>                                         sell_order_id: order.id(),
>                                         price_cents: execution_price,
>                                         quantity: match_qty,
>                                     });
>                                 }
>                             }
>                         }
>                         self.buy_orders.retain(|b| b.remaining_qty() > 0);
>                         if order.remaining_qty() > 0 {
>                             self.sell_orders.push(order);
>                         }
>                     }
>                 }
>                 Ok(trades)
>             }
>         }
>     }
> 
>     pub use order::{Order, OrderSide};
>     pub use risk::{RiskEngine, RiskViolation};
>     pub use matching::{MatchingEngine, Trade};
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::trading::*;
> 
>     #[test]
>     fn test_order_creation_and_fill() {
>         let mut order = Order::new(1, "AAPL", OrderSide::Buy, 15000, 100).unwrap();
>         assert_eq!(order.id(), 1);
>         assert_eq!(order.symbol(), "AAPL");
>         assert_eq!(order.side(), OrderSide::Buy);
>         assert_eq!(order.remaining_qty(), 100);
> 
>         let fill_res = order.fill(40);
>         assert!(fill_res.is_ok());
>         assert_eq!(order.filled_qty(), 40);
>         assert_eq!(order.remaining_qty(), 60);
> 
>         let invalid_fill = order.fill(70);
>         assert!(invalid_fill.is_err());
>         assert_eq!(invalid_fill.unwrap_err(), "Fill exceeds remaining quantity");
> 
>         let invalid_order = Order::new(2, "AAPL", OrderSide::Sell, 15000, 0);
>         assert!(invalid_order.is_err());
>     }
> 
>     #[test]
>     fn test_risk_engine_validation() {
>         let risk = RiskEngine::new(500, 100_000); // max 500 qty, $1000 order value
>         let ok_order = Order::new(1, "TSLA", OrderSide::Buy, 200, 100).unwrap();
>         assert!(risk.validate_order(&ok_order).is_ok());
> 
>         let high_qty = Order::new(2, "TSLA", OrderSide::Buy, 10, 600).unwrap();
>         let qty_err = risk.validate_order(&high_qty);
>         assert!(matches!(qty_err, Err(RiskViolation::QuantityLimitExceeded { limit: 500, requested: 600 })));
> 
>         let high_val = Order::new(3, "TSLA", OrderSide::Buy, 2000, 100).unwrap();
>         let val_err = risk.validate_order(&high_val);
>         assert!(matches!(val_err, Err(RiskViolation::OrderValueExceeded { limit: 100_000, actual: 200_000 })));
>     }
> 
>     #[test]
>     fn test_matching_engine_execution() {
>         let risk = RiskEngine::new(1000, 1_000_000);
>         let mut engine = MatchingEngine::new(risk);
> 
>         let sell_order = Order::new(1, "BTC", OrderSide::Sell, 50_000, 2).unwrap();
>         let trades_1 = engine.submit_order(sell_order).unwrap();
>         assert!(trades_1.is_empty());
> 
>         let buy_order = Order::new(2, "BTC", OrderSide::Buy, 50_500, 1).unwrap();
>         let trades_2 = engine.submit_order(buy_order).unwrap();
>         assert_eq!(trades_2.len(), 1);
>         assert_eq!(trades_2[0].price_cents, 50_000);
>         assert_eq!(trades_2[0].quantity, 1);
>         assert_ne!(trades_2[0].buy_order_id, trades_2[0].sell_order_id);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Financial Invariants & Encapsulation:** By encapsulating `Order` fields, callers cannot alter an active order's price or exceed the order's max quantity. The `fill` method enforces `filled_qty + qty <= total_quantity`.
> 2. **Cross-Module Type Integration:** The `MatchingEngine` within `trading::matching` consumes `Order` structs from `trading::order` and validates them against `trading::risk::RiskEngine`.
> 3. **Ownership & Borrowing Invariants:** Orders passed into `MatchingEngine::submit_order(mut order: Order)` take ownership of the order. Matching uses mutable references (`iter_mut()`) over active resting orders in `Vec<Order>` to execute partial or full fills atomically.
> 4. **Edge Cases:** Attempts to fill an order with 0 quantity or an amount exceeding remaining unfilled shares return explicit error strings. Orders with quantity or price of 0 are rejected during construction.
>

---

### Exercise 3: Compiler AST Transpiler & Constant-Folding Pipeline with Nested Module Privacy (`pub(super)`)

**Problem:** Language compilers and query optimizers transform source inputs into executable forms across distinct phases: Tokenization $\rightarrow$ Parsing $\rightarrow$ AST Optimization $\rightarrow$ Evaluation.
To maintain internal modular encapsulation:
1. Intermediate tokens (`lexer::Token`) and AST nodes (`parser::Expr`) must be marked with `pub(super)` so that submodules inside `compiler` can pass them to each other, but callers outside the `compiler` module cannot depend on internal compiler representations.
2. Submodule `compiler::lexer`: Tokenizes raw mathematical string expressions (`+`, `-`, `*`, `/`, integers).
3. Submodule `compiler::parser`: Builds binary operator expression trees (`Expr::BinaryOp`).
4. Submodule `compiler::optimizer`: Implements compile-time constant folding (`5 + 3` $\rightarrow$ `8`).
5. Submodule `compiler::evaluator`: Computes final integer output.
6. The `compiler` module exposes only `CompileError` and the facade `compile_and_eval(input: &str) -> Result<i64, CompileError>`.

Implement the complete `compiler` module hierarchy with unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub mod compiler {
>     #[derive(Debug, PartialEq, Eq, Clone)]
>     pub enum CompileError {
>         InvalidToken(char),
>         UnexpectedEOF,
>         SyntaxError(String),
>         DivisionByZero,
>     }
> 
>     pub(super) mod lexer {
>         use super::CompileError;
> 
>         #[derive(Debug, PartialEq, Eq, Clone)]
>         pub(super) enum Token {
>             Number(i64),
>             Plus,
>             Minus,
>             Star,
>             Slash,
>         }
> 
>         pub(super) fn tokenize(input: &str) -> Result<Vec<Token>, CompileError> {
>             let mut tokens = Vec::new();
>             let mut chars = input.chars().peekable();
> 
>             while let Some(&ch) = chars.peek() {
>                 match ch {
>                     ' ' | '\t' | '\n' | '\r' => {
>                         chars.next();
>                     }
>                     '+' => { tokens.push(Token::Plus); chars.next(); }
>                     '-' => { tokens.push(Token::Minus); chars.next(); }
>                     '*' => { tokens.push(Token::Star); chars.next(); }
>                     '/' => { tokens.push(Token::Slash); chars.next(); }
>                     '0'..='9' => {
>                         let mut num_str = String::new();
>                         while let Some(&digit) = chars.peek() {
>                             if digit.is_ascii_digit() {
>                                 num_str.push(digit);
>                                 chars.next();
>                             } else {
>                                 break;
>                             }
>                         }
>                         let num: i64 = num_str.parse().map_err(|_| CompileError::SyntaxError("Invalid integer".into()))?;
>                         tokens.push(Token::Number(num));
>                     }
>                     other => return Err(CompileError::InvalidToken(other)),
>                 }
>             }
>             Ok(tokens)
>         }
>     }
> 
>     pub(super) mod parser {
>         use super::lexer::Token;
>         use super::CompileError;
> 
>         #[derive(Debug, PartialEq, Eq, Clone, Copy)]
>         pub(super) enum Op {
>             Add,
>             Sub,
>             Mul,
>             Div,
>         }
> 
>         #[derive(Debug, PartialEq, Eq, Clone)]
>         pub(super) enum Expr {
>             Number(i64),
>             BinaryOp {
>                 op: Op,
>                 left: Box<Expr>,
>                 right: Box<Expr>,
>             },
>         }
> 
>         pub(super) fn parse(tokens: &[Token]) -> Result<Expr, CompileError> {
>             let mut pos = 0;
>             let expr = parse_additive(tokens, &mut pos)?;
>             if pos < tokens.len() {
>                 return Err(CompileError::SyntaxError("Trailing tokens after expression".into()));
>             }
>             Ok(expr)
>         }
> 
>         fn parse_additive(tokens: &[Token], pos: &mut usize) -> Result<Expr, CompileError> {
>             let mut left = parse_multiplicative(tokens, pos)?;
>             while *pos < tokens.len() {
>                 let op = match &tokens[*pos] {
>                     Token::Plus => Op::Add,
>                     Token::Minus => Op::Sub,
>                     _ => break,
>                 };
>                 *pos += 1;
>                 let right = parse_multiplicative(tokens, pos)?;
>                 left = Expr::BinaryOp {
>                     op,
>                     left: Box::new(left),
>                     right: Box::new(right),
>                 };
>             }
>             Ok(left)
>         }
> 
>         fn parse_multiplicative(tokens: &[Token], pos: &mut usize) -> Result<Expr, CompileError> {
>             let mut left = parse_primary(tokens, pos)?;
>             while *pos < tokens.len() {
>                 let op = match &tokens[*pos] {
>                     Token::Star => Op::Mul,
>                     Token::Slash => Op::Div,
>                     _ => break,
>                 };
>                 *pos += 1;
>                 let right = parse_primary(tokens, pos)?;
>                 left = Expr::BinaryOp {
>                     op,
>                     left: Box::new(left),
>                     right: Box::new(right),
>                 };
>             }
>             Ok(left)
>         }
> 
>         fn parse_primary(tokens: &[Token], pos: &mut usize) -> Result<Expr, CompileError> {
>             if *pos >= tokens.len() {
>                 return Err(CompileError::UnexpectedEOF);
>             }
>             match &tokens[*pos] {
>                 Token::Number(val) => {
>                     let n = *val;
>                     *pos += 1;
>                     Ok(Expr::Number(n))
>                 }
>                 _ => Err(CompileError::SyntaxError("Expected number".into())),
>             }
>         }
>     }
> 
>     pub(super) mod optimizer {
>         use super::parser::{Expr, Op};
>         use super::CompileError;
> 
>         pub(super) fn fold_constants(expr: Expr) -> Result<Expr, CompileError> {
>             match expr {
>                 Expr::Number(n) => Ok(Expr::Number(n)),
>                 Expr::BinaryOp { op, left, right } => {
>                     let left_opt = fold_constants(*left)?;
>                     let right_opt = fold_constants(*right)?;
> 
>                     match (&left_opt, &right_opt) {
>                         (Expr::Number(a), Expr::Number(b)) => match op {
>                             Op::Add => Ok(Expr::Number(a + b)),
>                             Op::Sub => Ok(Expr::Number(a - b)),
>                             Op::Mul => Ok(Expr::Number(a * b)),
>                             Op::Div => {
>                                 if *b == 0 {
>                                     Err(CompileError::DivisionByZero)
>                                 } else {
>                                     Ok(Expr::Number(a / b))
>                                 }
>                             }
>                         },
>                         _ => Ok(Expr::BinaryOp {
>                             op,
>                             left: Box::new(left_opt),
>                             right: Box::new(right_opt),
>                         }),
>                     }
>                 }
>             }
>         }
>     }
> 
>     pub(super) mod evaluator {
>         use super::parser::Expr;
>         use super::CompileError;
> 
>         pub(super) fn evaluate(expr: &Expr) -> Result<i64, CompileError> {
>             match expr {
>                 Expr::Number(n) => Ok(*n),
>                 _ => Err(CompileError::SyntaxError("Unoptimized non-constant expression".into())),
>             }
>         }
>     }
> 
>     pub fn compile_and_eval(input: &str) -> Result<i64, CompileError> {
>         let tokens = lexer::tokenize(input)?;
>         let ast = parser::parse(&tokens)?;
>         let optimized_ast = optimizer::fold_constants(ast)?;
>         evaluator::evaluate(&optimized_ast)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::compiler::*;
> 
>     #[test]
>     fn test_successful_compilation_and_constant_folding() {
>         let result = compile_and_eval("10 + 5 * 2 - 4 / 2");
>         assert!(result.is_ok());
>         assert_eq!(result.unwrap(), 18);
>     }
> 
>     #[test]
>     fn test_invalid_tokens_and_syntax() {
>         let err_char = compile_and_eval("10 + @");
>         assert!(err_char.is_err());
>         assert!(matches!(err_char.unwrap_err(), CompileError::InvalidToken('@')));
> 
>         let err_syntax = compile_and_eval("10 + +");
>         assert!(err_syntax.is_err());
>         assert!(matches!(err_syntax.unwrap_err(), CompileError::SyntaxError(_)));
>     }
> 
>     #[test]
>     fn test_division_by_zero() {
>         let div_zero = compile_and_eval("42 / 0");
>         assert!(div_zero.is_err());
>         assert_eq!(div_zero.unwrap_err(), CompileError::DivisionByZero);
> 
>         let non_zero = compile_and_eval("42 / 7");
>         assert_ne!(non_zero.unwrap(), 0);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Parent-Restricted Visibility (`pub(super)`):** Using `pub(super)` grants item visibility strictly to the immediate parent module (`compiler`). External callers attempting to import `compiler::lexer::Token` will receive a privacy compilation error (`E0603`).
> 2. **Recursive Data Structures (`Box<Expr>`):** Rust requires fixed memory layout sizes at compile-time. Recursive AST definitions like `Expr::BinaryOp { left: Box<Expr>, right: Box<Expr> }` place sub-nodes on the heap using pointer indirection, giving `Expr` a finite size on the stack.
> 3. **Algebraic Data Types & Pattern Matching:** Enum pattern matching is used in `optimizer::fold_constants` to recursively collapse binary operations of constant operands (`Expr::Number(a)` and `Expr::Number(b)`) into a single `Expr::Number`.
> 4. **Edge Cases:** Division by zero during constant folding triggers `CompileError::DivisionByZero`. Invalid syntax or unexpected end-of-file produce descriptive compilation errors.
>

---

## 6. Related Terms


- [Crate](crate.md) — Modules are the internal organizational units within a single crate
- [Cargo](cargo.md) — The tool that compiles your crate and its modules
- [Package](package.md) — The top-level structure that contains crates (which in turn contain modules)
- [`fn` (Functions)](fn.md) — Related concept: fn.
- [Prelude](../level_07/prelude.md) — Related concept: Prelude.
- [Visibility and Modules (`pub`, `mod`)](../level_07/visibility_and_modules.md) — Visibility rules across modules.
- [`mod` Declaration](../level_07/mod_declaration.md) — mod statement syntax.

---

## 7. Key Takeaways

- **Explicit Declarations**: You must explicitly declare a module with `mod module_name;` or `mod module_name { ... }` for it to be part of the crate.
- **Private by Default**: Everything in a module is private by default. Use `pub` to make functions, structs, or inner modules accessible from the outside.
- **Privacy Boundaries**: A module serves as a privacy boundary, allowing you to hide implementation details and expose a clean API.
- **Tree Structure**: Modules form a tree structure starting from the crate root (`main.rs` or `lib.rs`).
