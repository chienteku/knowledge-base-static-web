# `Option<T>`

> **Level 2 — Control Flow & Data Structures**
> An enum (`Some(T)` / `None`) replacing null; forces explicit handling of absent values.

---

## 1. Prerequisites


- [Enum](enum.md) — `Option` is just a standard Enum built into the Rust standard library!
- [`match`](match.md) — The safest way to handle both variants of an `Option`.
- [`if let` / `while let`](if_let_while_let.md) — The cleanest way to handle an `Option` when you only care about the `Some` variant.

---

## 2. Term Category

**Rust-specific (the safety)**: Rust completely removes the concept of `null` from the language. Instead, it uses the `Option<T>` enum to safely model the concept of a value being absent or missing, entirely preventing "Null Pointer Exceptions".

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The inventor of `null` (Tony Hoare) famously calls it his "billion-dollar mistake." In languages like Java, C++, or JavaScript, `null` is a sneaky value that almost any object can secretly be. If you write code expecting a user's name, but you receive `null` and try to call `.toUpperCase()` on it, your entire program instantly crashes at runtime. 

Rust bans `null` completely. Instead, Rust represents the *possibility* of absence using a built-in Enum called `Option<T>`. It has exactly two variants:
1. `Some(value)` — The data exists, and it's inside here.
2. `None` — The data is missing (the safe equivalent of null).

Because it is an Enum, the Rust compiler **forces you to handle the `None` case** before it lets you touch the data inside `Some`. You literally cannot forget to check for "null" in Rust. The compiler will catch the mistake and refuse to build the program. 

### (2) Reality Metaphor

Imagine receiving a wrapped gift box.

In a language with `null`, you arrogantly assume there's a gift inside and reach in blindfolded. If the box happens to be empty (`null`), a booby trap snaps on your hand and you die (the program crashes).

In Rust, the `Option` type forces you to take off your blindfold and safely look inside the box first (using `match`). If the box is empty (`None`), you sigh and move on safely. If there is a gift inside (`Some`), you extract it and use it safely.

### (3) Rust Code Examples

#### Short Snippet (The Definition)
You don't need to define `Option` yourself; it's already in the language. But if you did, it would look like this:
```rust
enum Option<T> {
    None,
    Some(T),
}
```

Because it's so common, Rust automatically imports the `Some` and `None` variants for you.
```rust
let present: Option<i32> = Some(5);
let absent: Option<i32> = None;
```

#### Fuller Example (Safe Extraction)
```rust
fn main() {
    let middle_name = Some(String::from("Danger"));
    
    // Attempting to do `middle_name.len()` right now will fail to compile!
    // We must extract it first using pattern matching.

    // Method 1: Using `match` (handles both cases)
    match middle_name {
        Some(name) => println!("Middle name is {} letters long.", name.len()),
        None => println!("No middle name provided."),
    }

    // Method 2: Using `if let` (handles only the Some case)
    let lucky_number = Some(7);
    if let Some(num) = lucky_number {
        println!("My lucky number is {}", num);
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Option T Scoping and Lifecycle Rules

**The mistake:** Assuming Option T instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("option_t_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("option_t_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Option T State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Option T through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Option T Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Option T instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: High-Frequency Trading Matcher — Order Book Spread & Executable Quote Pipeline

**Scenario:**
In financial trading systems, market order books continuously track the highest active bid (buy price) and lowest active ask (sell price) as optional values (`Option<LimitOrder>`). If either side of the market is empty, inactive, or lacks sufficient volume to meet liquidity constraints, quotes cannot be matched.

**Task:**
Implement an `OrderBookPipeline` to filter, combine, and process order quotes:
1. Define a `LimitOrder` struct containing `price: u64`, `volume: u64`, and `is_active: bool`.
2. Implement `compute_effective_spread(bid: Option<LimitOrder>, ask: Option<LimitOrder>, min_volume: u64) -> Option<u64>`:
   - Use `Option::filter` to discard any order where `is_active` is `false` or `volume < min_volume`.
   - Use `Option::zip` to combine the valid bid and ask into a single `Option<(LimitOrder, LimitOrder)>`.
   - Use `Option::and_then` to calculate `ask.price - bid.price` if `ask.price > bid.price`, or return `None` if the market is crossed (`ask.price <= bid.price`).
3. Implement `extract_and_discount_best_bid(bid: &mut Option<LimitOrder>, discount_bps: u64) -> Option<u64>`:
   - Use `Option::take()` to consume ownership of the inner order out of a mutable reference, filter for activity, and calculate the discounted price using basis points (`price * discount_bps / 10_000`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct LimitOrder {
>     pub price: u64,
>     pub volume: u64,
>     pub is_active: bool,
> }
> 
> pub struct OrderBookPipeline;
> 
> impl OrderBookPipeline {
>     pub fn compute_effective_spread(
>         bid: Option<LimitOrder>,
>         ask: Option<LimitOrder>,
>         min_volume: u64,
>     ) -> Option<u64> {
>         let valid_bid = bid.filter(|b| b.is_active && b.volume >= min_volume);
>         let valid_ask = ask.filter(|a| a.is_active && a.volume >= min_volume);
> 
>         valid_bid.zip(valid_ask).and_then(|(b, a)| {
>             if a.price > b.price {
>                 Some(a.price - b.price)
>             } else {
>                 None
>             }
>         })
>     }
> 
>     pub fn extract_and_discount_best_bid(
>         bid: &mut Option<LimitOrder>,
>         discount_bps: u64,
>     ) -> Option<u64> {
>         bid.take().filter(|b| b.is_active).map(|mut b| {
>             let discount = (b.price * discount_bps) / 10_000;
>             b.price.saturating_sub(discount)
>         })
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_valid_spread_computation() {
>         let bid = Some(LimitOrder { price: 100, volume: 50, is_active: true });
>         let ask = Some(LimitOrder { price: 105, volume: 60, is_active: true });
> 
>         let spread = OrderBookPipeline::compute_effective_spread(bid, ask, 10);
>         assert_eq!(spread, Some(5));
>         assert!(spread.is_some());
>     }
> 
>     #[test]
>     fn test_filtered_inactive_or_insufficient_volume() {
>         let bid = Some(LimitOrder { price: 100, volume: 5, is_active: true }); // Volume too low
>         let ask = Some(LimitOrder { price: 105, volume: 60, is_active: true });
> 
>         let spread = OrderBookPipeline::compute_effective_spread(bid, ask, 10);
>         assert_eq!(spread, None);
>         assert!(spread.is_none());
> 
>         let inactive_bid = Some(LimitOrder { price: 100, volume: 50, is_active: false });
>         let spread_inactive = OrderBookPipeline::compute_effective_spread(inactive_bid, ask, 10);
>         assert_ne!(spread_inactive, Some(5));
>         assert!(matches!(spread_inactive, None));
>     }
> 
>     #[test]
>     fn test_extract_and_discount() {
>         let mut bid_opt = Some(LimitOrder { price: 1000, volume: 20, is_active: true });
>         let discounted_price = OrderBookPipeline::extract_and_discount_best_bid(&mut bid_opt, 500); // 5% discount
> 
>         assert_eq!(discounted_price, Some(950));
>         assert!(bid_opt.is_none()); // Taken option leaves None behind
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Monadic Filtering with `Option::filter`**: The predicate `b.is_active && b.volume >= min_volume` is evaluated directly on the inner value of `Option<LimitOrder>`. If the predicate evaluates to `false`, `filter` converts `Some(order)` into `None` without requiring manual `match` statements.
> 2. **Option Zipping with `Option::zip`**: Combining two independent `Option` values (`valid_bid` and `valid_ask`) into a single `Option<(T, U)>` guarantees that downstream logic only executes when both bid and ask sides are present (`Some`). If either side is `None`, the zipped result immediately becomes `None`.
> 3. **Ownership Transfer with `Option::take()`**: The `bid.take()` method moves the inner `LimitOrder` out of the `&mut Option<LimitOrder>`, leaving `None` in its place. This avoids unnecessary copies or requiring `Clone` on `LimitOrder`, while respecting Rust's borrow checker rules for mutable references.
> 4. **Edge Cases**: Crossed market conditions (`ask.price <= bid.price`) yield `None` via `and_then`, preventing negative spread calculations. Arithmetic overflow during discount calculation is guarded using `u64::saturating_sub`.
> 
---

### Exercise 2: Network Protocol Header Negotiation — TCP Option Parameter Parsing & Fallback Engine

**Scenario:**
During a TCP handshake (SYN/SYN-ACK), network endpoints exchange optional configuration fields such as Maximum Segment Size (MSS), Window Scale Factor, and Selective ACK (SACK) permissions. Each parameter is optional, and handshake negotiations must determine safe mutually agreed-upon defaults when fields are omitted.

**Task:**
Implement a `TcpNegotiator` pipeline:
1. Define `TcpHeaderOptions` containing `mss: Option<u16>`, `window_scale: Option<u8>`, and `sack_permitted: Option<bool>`.
2. Define `NegotiatedConfig` containing `effective_mss: u16`, `window_scale: Option<u8>`, and `sack_enabled: bool`.
3. Implement `negotiate_config(client: &TcpHeaderOptions, server: &TcpHeaderOptions) -> NegotiatedConfig`:
   - Determine `effective_mss`: If both present (via `client.mss.zip(server.mss)`), choose the minimum value. If only one is present, fallback using `.or_else()` chain. If neither is present, fallback to standard default `536` using `.unwrap_or()`.
   - Determine `window_scale`: Negotiate only if both client and server provide a scale factor (choose minimum); otherwise evaluate to `None`.
   - Determine `sack_enabled`: Set to `true` if and only if both client and server explicitly set `sack_permitted` to `Some(true)`.
4. Implement `inspect_and_reset_option(option_slot: &mut Option<u16>) -> Option<u16>` to consume active options above zero while resetting the slot to `None`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone, PartialEq, Eq, Default)]
> pub struct TcpHeaderOptions {
>     pub mss: Option<u16>,
>     pub window_scale: Option<u8>,
>     pub sack_permitted: Option<bool>,
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct NegotiatedConfig {
>     pub effective_mss: u16,
>     pub window_scale: Option<u8>,
>     pub sack_enabled: bool,
> }
> 
> pub struct TcpNegotiator;
> 
> impl TcpNegotiator {
>     pub fn negotiate_config(
>         client: &TcpHeaderOptions,
>         server: &TcpHeaderOptions,
>     ) -> NegotiatedConfig {
>         const DEFAULT_MSS: u16 = 536;
> 
>         let effective_mss = client
>             .mss
>             .zip(server.mss)
>             .map(|(c, s)| std::cmp::min(c, s))
>             .or_else(|| client.mss)
>             .or_else(|| server.mss)
>             .unwrap_or(DEFAULT_MSS);
> 
>         let window_scale = client
>             .window_scale
>             .zip(server.window_scale)
>             .map(|(c, s)| std::cmp::min(c, s));
> 
>         let sack_enabled = client
>             .sack_permitted
>             .zip(server.sack_permitted)
>             .map(|(c, s)| c && s)
>             .unwrap_or(false);
> 
>         NegotiatedConfig {
>             effective_mss,
>             window_scale,
>             sack_enabled,
>         }
>     }
> 
>     pub fn inspect_and_reset_option(option_slot: &mut Option<u16>) -> Option<u16> {
>         option_slot.take().filter(|&val| val > 0)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_negotiate_full_options() {
>         let client = TcpHeaderOptions {
>             mss: Some(1460),
>             window_scale: Some(7),
>             sack_permitted: Some(true),
>         };
>         let server = TcpHeaderOptions {
>             mss: Some(1400),
>             window_scale: Some(5),
>             sack_permitted: Some(true),
>         };
> 
>         let config = TcpNegotiator::negotiate_config(&client, &server);
>         assert_eq!(config.effective_mss, 1400);
>         assert_eq!(config.window_scale, Some(5));
>         assert!(config.sack_enabled);
>     }
> 
>     #[test]
>     fn test_negotiate_fallback_defaults() {
>         let client = TcpHeaderOptions {
>             mss: Some(1460),
>             window_scale: None,
>             sack_permitted: Some(true),
>         };
>         let server = TcpHeaderOptions {
>             mss: None,
>             window_scale: Some(3),
>             sack_permitted: Some(false),
>         };
> 
>         let config = TcpNegotiator::negotiate_config(&client, &server);
>         assert_eq!(config.effective_mss, 1460);
>         assert_ne!(config.effective_mss, 536);
>         assert!(matches!(config.window_scale, None));
>         assert!(!config.sack_enabled);
>     }
> 
>     #[test]
>     fn test_option_reset() {
>         let mut slot = Some(1024);
>         let val = TcpNegotiator::inspect_and_reset_option(&mut slot);
>         assert_eq!(val, Some(1024));
>         assert!(slot.is_none());
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Fallback Chaining with `.or_else()` and `.unwrap_or()`**: In `effective_mss`, `zip` handles the case where both parameters are present. If either is missing, `.or_else(|| client.mss)` and `.or_else(|| server.mss)` lazily evaluate alternative `Option` branches without eager allocation. Finally, `.unwrap_or(DEFAULT_MSS)` provides a guaranteed non-optional primitive value.
> 2. **Boolean Combination via Monadic `.map()`**: `sack_permitted` relies on `.zip()` to verify both options are `Some`, mapping the tuple `(c, s)` to logical `c && s`. The trailing `.unwrap_or(false)` safely defaults missing flags to `false`.
> 3. **In-place State Reset via `Option::take()`**: The `inspect_and_reset_option` function extracts the inner `u16` using `take()`, leaving `None` in the source location. It then chains `.filter(|&val| val > 0)` to ensure zero-valued options are treated as invalid/absent (`None`).
> 4. **Safety & Zero-Cost Abstractions**: Option operations like `zip`, `map`, and `or_else` compile down to straightforward conditional jumps in assembly, matching C-style null checks in performance while providing 100% compile-time safety.
> 
---

### Exercise 3: AST Expression Evaluator & Lexical Scope Environment Lookup

**Scenario:**
In compiler design and script execution engines, variable resolution scans stack frames from innermost (local scope) to outermost (global scope). Expression evaluation over Abstract Syntax Trees (ASTs) must propagate missing variable errors or divide-by-zero occurrences without crashing the host process.

**Task:**
Implement an AST evaluator with hierarchical environment resolution:
1. Define an `Expr` enum: `Literal(i64)`, `Variable(String)`, `Add(Box<Expr>, Box<Expr>)`, and `SafeDiv(Box<Expr>, Box<Expr>)`.
2. Define `EnvironmentChain` holding `scopes: Vec<HashMap<String, i64>>`.
3. Implement `lookup(&self, name: &str) -> Option<i64>`: iterate backwards through scope frames using `.iter().rev()` and `.find_map()` to find the first matching key.
4. Implement `eval_expr(&self, expr: &Expr) -> Option<i64>`:
   - For `Literal`, wrap value in `Some`.
   - For `Variable`, look up symbol in environment.
   - For `Add`, recursively evaluate left and right sub-expressions, combining them using `.zip()` and `.map()`.
   - For `SafeDiv`, recursively evaluate numerator and denominator, zip them, and use `.and_then()` to return `None` if denominator is `0`.

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
>     Variable(String),
>     Add(Box<Expr>, Box<Expr>),
>     SafeDiv(Box<Expr>, Box<Expr>),
> }
> 
> #[derive(Debug, Default)]
> pub struct EnvironmentChain {
>     scopes: Vec<HashMap<String, i64>>,
> }
> 
> impl EnvironmentChain {
>     pub fn new() -> Self {
>         Self { scopes: Vec::new() }
>     }
> 
>     pub fn push_scope(&mut self, scope: HashMap<String, i64>) {
>         self.scopes.push(scope);
>     }
> 
>     pub fn lookup(&self, name: &str) -> Option<i64> {
>         self.scopes
>             .iter()
>             .rev()
>             .find_map(|scope| scope.get(name).copied())
>     }
> 
>     pub fn eval_expr(&self, expr: &Expr) -> Option<i64> {
>         match expr {
>             Expr::Literal(val) => Some(*val),
>             Expr::Variable(name) => self.lookup(name),
>             Expr::Add(left, right) => {
>                 let l = self.eval_expr(left);
>                 let r = self.eval_expr(right);
>                 l.zip(r).map(|(a, b)| a + b)
>             }
>             Expr::SafeDiv(numerator, denominator) => {
>                 let num = self.eval_expr(numerator);
>                 let den = self.eval_expr(denominator);
>                 num.zip(den).and_then(|(n, d)| {
>                     if d != 0 {
>                         Some(n / d)
>                     } else {
>                         None
>                     }
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
>     fn test_scope_shadowing_and_lookup() {
>         let mut env = EnvironmentChain::new();
>         let mut global_scope = HashMap::new();
>         global_scope.insert("x".to_string(), 10);
>         global_scope.insert("y".to_string(), 20);
>         env.push_scope(global_scope);
> 
>         let mut local_scope = HashMap::new();
>         local_scope.insert("x".to_string(), 99); // Shadowing 'x'
>         env.push_scope(local_scope);
> 
>         assert_eq!(env.lookup("x"), Some(99));
>         assert_eq!(env.lookup("y"), Some(20));
>         assert!(env.lookup("z").is_none());
>     }
> 
>     #[test]
>     fn test_expression_eval_success() {
>         let mut env = EnvironmentChain::new();
>         let mut scope = HashMap::new();
>         scope.insert("base".to_string(), 100);
>         env.push_scope(scope);
> 
>         // Expression: base + (50 / 2)
>         let expr = Expr::Add(
>             Box::new(Expr::Variable("base".to_string())),
>             Box::new(Expr::SafeDiv(
>                 Box::new(Expr::Literal(50)),
>                 Box::new(Expr::Literal(2)),
>             )),
>         );
> 
>         let result = env.eval_expr(&expr);
>         assert_eq!(result, Some(125));
>         assert!(result.is_some());
>     }
> 
>     #[test]
>     fn test_expression_eval_division_by_zero_and_missing_var() {
>         let env = EnvironmentChain::new();
> 
>         // Division by zero
>         let div_by_zero = Expr::SafeDiv(
>             Box::new(Expr::Literal(10)),
>             Box::new(Expr::Literal(0)),
>         );
>         let res_zero = env.eval_expr(&div_by_zero);
>         assert_eq!(res_zero, None);
>         assert!(matches!(res_zero, None));
> 
>         // Missing variable lookup
>         let missing_var = Expr::Add(
>             Box::new(Expr::Variable("missing".to_string())),
>             Box::new(Expr::Literal(5)),
>         );
>         let res_missing = env.eval_expr(&missing_var);
>         assert_ne!(res_missing, Some(5));
>         assert!(res_missing.is_none());
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Short-Circuit Shortening with `Option` Chaining**: When evaluating complex nested expressions, any inner evaluation failure (such as an unbound variable or division by zero) produces `None`. Monadic operations like `.zip()` and `.and_then()` propagate `None` automatically up the evaluation tree without panic or explicit error checking at every level.
> 2. **Lexical Scope Traversal with `Iterator::find_map`**: `scopes.iter().rev()` iterates backward from local to outer scopes. Calling `scope.get(name).copied()` converts `Option<&i64>` to `Option<i64>`, and `find_map` returns the first `Some(val)` encountered, correctly enforcing variable shadowing rules.
> 3. **Safe Division Invariants**: Mathematical undefined operations (division by zero) are captured within `and_then(|(n, d)| if d != 0 { Some(n / d) } else { None })`, turning dynamic runtime arithmetic exceptions into safe, handled missing values.
> 4. **Recursive AST Traversal**: Passing references `&Expr` down the AST tree ensures zero dynamic memory allocations during evaluation. The compiler verifies lifetimes, ensuring references to `EnvironmentChain` remain valid across the call hierarchy.
> 
---

## 6. Related Terms


- [`Result<T, E>`](result_t_e.md) — The other famous built-in enum, used for error handling (Success vs Failure) rather than missing values (Present vs Absent).
- [`unwrap()` / `expect()`](../level_04/unwrap_expect.md) — Methods used to aggressively extract the value from an `Option`, intentionally crashing the program if it is `None`.
- [Integer Overflow Semantics (`checked_` / `wrapping_` / `saturating_` / `overflowing_`)](../level_01/integer_overflow.md) — Related concept: Integer Overflow Semantics (`checked_` / `wrapping_` / `saturating_` / `overflowing_`).
- [Enum](enum.md) — Related concept: Enum.
- [`HashMap<K, V>`](hashmap_k_v.md) — Related concept: `HashMap<K, V>`.
- [`Vec<T>`](vec_t.md) — Related concept: `Vec<T>`.
- [`Default` Trait](../level_04/default_trait.md) — Related concept: `Default` Trait.
- [`if let` / `while let`](if_let_while_let.md) — Related concept: `if let` / `while let`.

---

## 7. Key Takeaways

- Rust does not have `null`. It uses the `Option<T>` enum to represent the concept of absence.
- The two variants are `Some(value)` (data is present) and `None` (data is missing).
- The compiler forces you to handle the `None` possibility, making "null pointer exceptions" impossible in safe Rust code.
- You must "open the box" using `match` or `if let` to safely extract and use the data hidden inside `Some`.
