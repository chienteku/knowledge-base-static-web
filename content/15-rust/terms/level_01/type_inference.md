# Type Inference

> **Level 1 — Foundations**
> The compiler deduces types when unambiguous, reducing annotation boilerplate.

---

## 1. Prerequisites

- [Variable](../level_01/variable.md) — Named bindings to store data.
- [Scalar Types](../level_01/scalar_types.md) — The primitive data types (integers, floats, etc.) that the compiler needs to deduce.

---

## 2. Term Category

**Rust-nonspecific**: Type inference is a feature found in many modern statically-typed languages (like Swift, Kotlin, and TypeScript) designed to give developers the safety of strict types with the clean, readable syntax of dynamic languages.

---

## 3. Explanation

### (1) Design Motivation — "Why does this exist in programming languages?"

In older, statically-typed languages (like Java or C++), developers were forced to explicitly state the data type for every single variable they created. For example, you had to write `int my_number = 5;`. This was great for the compiler because it knew exactly how much memory to allocate and what operations were legal, guaranteeing safety. But for developers, writing out every single type caused "boilerplate"—tedious, repetitive typing that clogged up the screen and distracted from the actual logic of the program.

Language designers realized the compiler is actually quite smart. If you write `let my_number = 5;`, the compiler can clearly see that `5` is an integer. **Type inference** allows the compiler to automatically deduce the type based on the value you assign to it, or based on how you use the variable later on. You get 100% of the safety of strict static typing, with the clean, readable code of a dynamic language like Python. 

### (2) Reality Metaphor

Imagine walking up to the counter at a bakery. If you point to a chocolate chip cookie and say, *"I'll buy that,"* the cashier automatically infers that you are purchasing a cookie and charges you appropriately. 

You don't have to explicitly declare, *"I am initiating the purchase of a baked-good class item known as a chocolate chip cookie."* The context makes your intent completely unambiguous. Type inference is the compiler acting like the cashier, quietly figuring out what you mean based on the obvious context.

### (3) Rust Code Examples

#### Short Snippet
```rust
// The compiler infers `age` is an integer (specifically an i32 by default).
let age = 30;

// The compiler infers `is_active` is a boolean.
let is_active = true;
```

#### Fuller Example
```rust
fn main() {
    // 1. Immediate Inference:
    // Rust sees a floating-point number and defaults to `f64`.
    let temperature = 98.6; 

    // 2. Forward Inference (Rust is very smart!):
    // Here, we create an empty dynamic list (Vector). 
    // At this exact line, Rust DOES NOT know what type of data will go inside it.
    let mut scores = Vec::new(); 
    
    // ... later in the code ...
    // Because we push an integer (i32) into the list, Rust travels back in time
    // to line 9 and confidently infers that `scores` must be a `Vec<i32>`.
    scores.push(100); 

    println!("The first score is {}", scores[0]);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Not providing enough context for the compiler

**The mistake:** Calling a function that can return many different types of data, and expecting the compiler to magically guess which one you want without any hints.

**Why it's wrong:** The `.parse()` method in Rust can convert a string into almost *any* number type (`i32`, `u8`, `f64`, etc.). If you just say "parse this string," the compiler has no idea which specific type of number you need, and it will throw a `type annotations needed` error.

*Incorrect:*
```rust
// The compiler doesn't know if we want an i32, an f64, or a u8!
let parsed_number = "42".parse().unwrap(); 
```

*Fix:*
```rust
// We must manually provide a Type Annotation to help the compiler out.
let parsed_number: i32 = "42".parse().unwrap(); 
```

---

### Mistake 2: Mutating Type Inference State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Type Inference through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Type Inference Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Type Inference instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Financial Telemetry Log Ingestion Pipeline

**Scenario:**
In a real-time financial exchange telemetry pipeline, incoming market trade execution logs are received as raw CSV string records in the format `"SYMBOL,PRICE,VOLUME"` (e.g., `"AAPL,150.25,100"`).

**Problem:**
Implement a robust log parser function `parse_trade_log(raw_records: &[&str]) -> Result<Vec<Trade>, TradeParseError>` that converts raw logs into structured `Trade` instances using iterator chains.
Demonstrate how Rust's **bidirectional type inference** allows `str::parse()` calls inside closure transformations to automatically infer target scalar types (`f64` for price, `u64` for volume) based on struct field constraints, and how the turbofish operator `::<Result<Vec<_>, _>>()` guides collector allocation while short-circuiting on bad data.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq)]
> pub struct Trade {
>     pub symbol: String,
>     pub price: f64,
>     pub volume: u64,
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum TradeParseError {
>     InvalidFormat,
>     InvalidPrice,
>     InvalidVolume,
> }
> 
> pub fn parse_trade_log(raw_records: &[&str]) -> Result<Vec<Trade>, TradeParseError> {
>     raw_records
>         .iter()
>         .map(|line| {
>             let parts: Vec<&str> = line.split(',').collect();
>             if parts.len() != 3 {
>                 return Err(TradeParseError::InvalidFormat);
>             }
> 
>             // Bidirectional inference: `.parse()` infers target type from struct fields below!
>             let symbol = parts[0].trim().to_string();
>             let price = parts[1].trim().parse().map_err(|_| TradeParseError::InvalidPrice)?;
>             let volume = parts[2].trim().parse().map_err(|_| TradeParseError::InvalidVolume)?;
> 
>             Ok(Trade { symbol, price, volume })
>         })
>         // Turbofish collects into Result<Vec<Trade>, TradeParseError> with wildcard element inference
>         .collect::<Result<Vec<_>, _>>()
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_valid_trade_log_parsing() {
>         let logs = vec!["AAPL,150.25,100", "GOOG,2800.50,50", "TSLA,700.10,200"];
>         let result = parse_trade_log(&logs);
>         
>         assert!(result.is_ok());
>         let trades = result.unwrap();
>         assert_eq!(trades.len(), 3);
>         assert_eq!(trades[0].symbol, "AAPL");
>         assert_eq!(trades[0].price, 150.25);
>         assert_eq!(trades[0].volume, 100);
>         assert_ne!(trades[0], trades[1]);
>     }
> 
>     #[test]
>     fn test_invalid_format_error() {
>         let logs = vec!["AAPL,150.25"];
>         let result = parse_trade_log(&logs);
>         assert!(result.is_err());
>         assert_eq!(result.unwrap_err(), TradeParseError::InvalidFormat);
>     }
> 
>     #[test]
>     fn test_invalid_price_error() {
>         let logs = vec!["AAPL,invalid_price,100"];
>         let result = parse_trade_log(&logs);
>         assert!(result.is_err());
>         assert!(matches!(result, Err(TradeParseError::InvalidPrice)));
>     }
> 
>     #[test]
>     fn test_invalid_volume_error() {
>         let logs = vec!["AAPL,150.25,invalid_vol"];
>         let result = parse_trade_log(&logs);
>         assert!(result.is_err());
>         assert_eq!(result.unwrap_err(), TradeParseError::InvalidVolume);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Bidirectional Type Inference & Constraint Unification**:
>    Rust uses a Hindley-Milner-style constraint unification algorithm. When calling `"150.25".parse()`, `str::parse<F>()` is generic over `F: FromStr`. At the call site, the compiler generates an unconstrained type variable `?T`. When `?T` is assigned to `Trade.price: f64`, the compiler unifies `?T = f64`. Context flows *backwards* into `.parse()`, executing `str::parse::<f64>()` without requiring explicit turbofish syntax on every scalar.
> 2. **Collector Ambiguity & Turbofish `::<T>`**:
>    `Iterator::collect()` is generic over `FromIterator<A>`. Because many types implement `FromIterator` (e.g., `Vec<T>`, `HashSet<T>`, `Result<Vec<T>, E>`), calling `.collect()` without type guidance triggers compiler error `E0282` (`type annotations needed`). Using `.collect::<Result<Vec<_>, _>>()` or `let trades: Result<Vec<Trade>, _> = ...` provides the collector target, allowing `Result::from_iter` to short-circuit upon encountering the first parsing failure.
> 3. **Ownership and Lifetime Implications**:
>    The raw string slices `&str` are borrowed references. Calling `.to_string()` on the symbol slice converts it into an owned `String` allocated on the heap, ensuring that the returned `Trade` struct owns its data and does not depend on the input buffer lifetime.
>

---

### Exercise 2: High-Throughput Network Metric Aggregator

**Scenario:**
A microservice API gateway monitors request traffic latency (in microseconds) per endpoint and computes real-time summary statistics for health reporting.

**Problem:**
Build a `MetricAggregator` struct that tracks latency samples per endpoint in an internal map.
Demonstrate how to leverage **partial type inference** using the wildcard `_` placeholder (e.g. `HashMap<String, Vec<_>>`), numeric literal suffixes (e.g. `0_u64`, `0.0_f64`), and iterator sum accumulator hints to aggregate streaming statistics (`total_samples`, `total_latency_us`, `average_latency_us`, `max_latency_us`) safely.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::HashMap;
> 
> #[derive(Debug, PartialEq)]
> pub struct LatencyStats {
>     pub total_samples: u64,
>     pub total_latency_us: u64,
>     pub average_latency_us: f64,
>     pub max_latency_us: u64,
> }
> 
> #[derive(Default)]
> pub struct MetricAggregator {
>     // Partial type inference: Key is String, value type Vec<_> is deduced from `.push(latency)`
>     storage: HashMap<String, Vec<u64>>,
> }
> 
> impl MetricAggregator {
>     pub fn new() -> Self {
>         Self {
>             storage: HashMap::new(),
>         }
>     }
> 
>     pub fn record(&mut self, endpoint: &str, latency_us: u64) {
>         // Partial inference hint: compiler infers entry value is Vec<u64>
>         self.storage
>             .entry(endpoint.to_string())
>             .or_insert_with(Vec::new)
>             .push(latency_us);
>     }
> 
>     pub fn compute_stats(&self, endpoint: &str) -> Option<LatencyStats> {
>         let latencies = self.storage.get(endpoint)?;
>         if latencies.is_empty() {
>             return None;
>         }
> 
>         let total_samples = latencies.len() as u64;
>         let total_latency_us: u64 = latencies.iter().copied().sum();
>         let max_latency_us = *latencies.iter().max().unwrap_or(&0_u64);
>         let average_latency_us = (total_latency_us as f64) / (total_samples as f64);
> 
>         Some(LatencyStats {
>             total_samples,
>             total_latency_us,
>             average_latency_us,
>             max_latency_us,
>         })
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_record_and_compute_stats() {
>         let mut aggregator = MetricAggregator::new();
>         aggregator.record("/api/v1/checkout", 1200);
>         aggregator.record("/api/v1/checkout", 800);
>         aggregator.record("/api/v1/checkout", 1000);
> 
>         let stats = aggregator.compute_stats("/api/v1/checkout");
>         assert!(stats.is_some());
>         
>         let stats = stats.unwrap();
>         assert_eq!(stats.total_samples, 3);
>         assert_eq!(stats.total_latency_us, 3000);
>         assert_eq!(stats.average_latency_us, 1000.0);
>         assert_eq!(stats.max_latency_us, 1200);
>     }
> 
>     #[test]
>     fn test_nonexistent_endpoint_returns_none() {
>         let aggregator = MetricAggregator::new();
>         let stats = aggregator.compute_stats("/api/v1/health");
>         assert!(stats.is_none());
>         assert_eq!(stats, None);
>     }
> 
>     #[test]
>     fn test_stat_inequality() {
>         let s1 = LatencyStats { total_samples: 1, total_latency_us: 100, average_latency_us: 100.0, max_latency_us: 100 };
>         let s2 = LatencyStats { total_samples: 1, total_latency_us: 200, average_latency_us: 200.0, max_latency_us: 200 };
>         assert_ne!(s1, s2);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Partial Type Inference via Wildcard `_`**:
>    Rust allows the `_` placeholder inside compound types (like `HashMap<_, Vec<u64>>` or `Result<_, Error>`). This instructs the compiler to infer that specific inner generic parameter from subsequent code usage (e.g. `.push(latency)`), while keeping surrounding collection architecture self-documenting.
> 2. **Numeric Suffixes & Literal Anchoring**:
>    Un-annotated integer literals default to `i32` and float literals default to `f64`. When initializing variables without explicit type annotations, appending numeric suffixes like `0_u64` or `0.0_f64` explicitly anchors the type of the binding, preventing mismatched integer type errors in downstream calculations.
> 3. **Trait-Bound Type Inference in Iterator Reductions**:
>    The `Iterator::sum()` method relies on the `std::iter::Sum` trait. Calling `.iter().sum()` on a slice of numbers requires the compiler to know the accumulator type. Providing a clear binding type (`let total_latency_us: u64 = ...`) guides trait resolution without needing explicit generic method qualification on `.sum()`.
>

---

### Exercise 3: Postfix AST Evaluator & Inference Signature Boundaries

**Scenario:**
An embedded rule evaluation engine parses Reverse Polish Notation (RPN) mathematical tokens into an evaluation stack to compute rule triggers dynamically.

**Problem:**
Implement a stack-based AST token evaluator `eval_postfix(tokens: &[Token]) -> Result<f64, EvalError>`.
Demonstrate how initializing an empty local evaluation stack (`let mut stack = Vec::new()`) relies on **forward/backward type propagation** to deduce `Vec<f64>`, and contrast this local statement inference with Rust's strict **signature annotation boundary rule** requiring explicit types on function parameters and return types.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone, PartialEq)]
> pub enum Token {
>     Number(f64),
>     Add,
>     Subtract,
>     Multiply,
>     Divide,
> }
> 
> #[derive(Debug, PartialEq)]
> pub enum EvalError {
>     EmptyStack,
>     DivisionByZero,
>     LeftoverTokens,
> }
> 
> // Function signature boundary: parameters and return types MUST be explicitly annotated!
> pub fn eval_postfix(tokens: &[Token]) -> Result<f64, EvalError> {
>     // 1. Unconstrained local variable initialization (inferred as Vec<f64> later)
>     let mut stack = Vec::new();
> 
>     for token in tokens {
>         match token {
>             // 2. Forward inference: pushing `val` (f64) fixes `stack` as `Vec<f64>`
>             Token::Number(val) => stack.push(*val),
>             Token::Add => {
>                 let b = stack.pop().ok_or(EvalError::EmptyStack)?;
>                 let a = stack.pop().ok_or(EvalError::EmptyStack)?;
>                 stack.push(a + b);
>             }
>             Token::Subtract => {
>                 let b = stack.pop().ok_or(EvalError::EmptyStack)?;
>                 let a = stack.pop().ok_or(EvalError::EmptyStack)?;
>                 stack.push(a - b);
>             }
>             Token::Multiply => {
>                 let b = stack.pop().ok_or(EvalError::EmptyStack)?;
>                 let a = stack.pop().ok_or(EvalError::EmptyStack)?;
>                 stack.push(a * b);
>             }
>             Token::Divide => {
>                 let b = stack.pop().ok_or(EvalError::EmptyStack)?;
>                 let a = stack.pop().ok_or(EvalError::EmptyStack)?;
>                 if b == 0.0 {
>                     return Err(EvalError::DivisionByZero);
>                 }
>                 stack.push(a / b);
>             }
>         }
>     }
> 
>     if stack.len() != 1 {
>         return Err(EvalError::LeftoverTokens);
>     }
> 
>     stack.pop().ok_or(EvalError::EmptyStack)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_eval_postfix_addition_and_multiplication() {
>         // Equivalent to: (3 + 4) * 2 = 14
>         let tokens = vec![
>             Token::Number(3.0),
>             Token::Number(4.0),
>             Token::Add,
>             Token::Number(2.0),
>             Token::Multiply,
>         ];
>         let result = eval_postfix(&tokens);
>         assert!(result.is_ok());
>         assert_eq!(result.unwrap(), 14.0);
>     }
> 
>     #[test]
>     fn test_eval_postfix_division_by_zero() {
>         let tokens = vec![Token::Number(10.0), Token::Number(0.0), Token::Divide];
>         let result = eval_postfix(&tokens);
>         assert!(result.is_err());
>         assert_eq!(result.unwrap_err(), EvalError::DivisionByZero);
>     }
> 
>     #[test]
>     fn test_eval_postfix_empty_stack_error() {
>         let tokens = vec![Token::Add];
>         let result = eval_postfix(&tokens);
>         assert!(result.is_err());
>         assert!(matches!(result, Err(EvalError::EmptyStack)));
>     }
> 
>     #[test]
>     fn test_eval_postfix_leftover_tokens_error() {
>         let tokens = vec![Token::Number(5.0), Token::Number(10.0)];
>         let result = eval_postfix(&tokens);
>         assert!(result.is_err());
>         assert_eq!(result.unwrap_err(), EvalError::LeftoverTokens);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Forward and Backward Inference State Propagation**:
>    At `let mut stack = Vec::new()`, `stack` starts with type `Vec<T>` where `T` is an unconstrained type variable. When `Token::Number(val)` is pushed via `stack.push(*val)`, `val` has type `f64`. The compiler unifies `T = f64`, retroactively constraining `stack` to `Vec<f64>`. Subsequent `stack.pop()` calls automatically return `Option<f64>`.
> 2. **The Function Signature Annotation Boundary**:
>    Rust enforces an essential architectural rule: **Type inference works across statements within a function body, but NEVER across function signatures.** Function parameters and return signatures MUST be explicitly annotated.
>    - *Why?* 
>      1. **Fast, Decoupled Modular Compilation**: The compiler can type-check callsites across modules in parallel using function signatures without parsing every function body implementation.
>      2. **API Stability**: Internal implementation changes cannot silently mutate a public function's return type or parameter contracts.
> 3. **Pattern Matching Unification**:
>    In the `match` expression processing tokens, all execution branches pop elements from the stack and compute `f64` results. The compiler unifies types across all pattern match arms to ensure deterministic stack mutations and control flow.
>

---

## 6. Related Terms

- [Type Annotation](../level_01/type_annotation.md) — The exact opposite of type inference. It's when you manually tell the compiler the specific type (`let x: i32 = 5;`).
- [Variable](../level_01/variable.md) — The named bindings that are having their types inferred.
- [Scalar Types](../level_01/scalar_types.md) — The primitive types that Rust falls back to (e.g., defaulting to `i32` for whole numbers and `f64` for decimals).

---

## 7. Key Takeaways

- Type inference allows the compiler to automatically figure out variable types, saving you from writing tedious boilerplate code.
- If you don't provide hints, Rust defaults to `i32` for whole numbers and `f64` for decimal numbers.
- Rust's inference engine is incredibly powerful; it can look ahead in your code to deduce a variable's type based on how you use it later.
- When a situation is ambiguous (like parsing a string into a number), type inference will fail, and you must step in and provide an explicit **Type Annotation**.
