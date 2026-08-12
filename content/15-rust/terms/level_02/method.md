# Method

> **Level 2 — Control Flow & Data Structures**
> A function defined in an `impl` block that takes `self`, `&self`, or `&mut self`.

---

## 1. Prerequisites


- [`impl` Block](impl_block.md) — The location where all methods must be defined.
- [Struct](struct.md)
- [fn](../level_01/fn.md) — A method is just a function with a special first parameter.

---

## 2. Term Category



**Rust Language Construct (self-binding functions)**: Methods exist in almost all Object-Oriented programming languages (Java, Python, C++, etc.). They are simply functions that belong to a specific instance of an object (or in Rust's case, a struct or enum).

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

If you write a standard function to calculate the area of a rectangle, it looks like this: `fn calculate_area(rect: &Rectangle)`. You have to call it by passing the data in: `calculate_area(&my_rect)`. This works, but it doesn't intuitively communicate that calculating the area is an inherent property of a Rectangle.

By defining the function as a **Method** inside an `impl` block, Rust allows you to use a special first parameter called `self`. `self` represents the specific instance of the struct the method is being called on. 

This enables "dot notation" (`my_rect.area()`). Dot notation is universally recognized, makes the code read fluidly from left to right, and allows your IDE (like VS Code) to easily show you a list of all behaviors attached to that specific data type.

### (2) Reality Metaphor

Imagine you have a physical car (the `struct`). 

A standard function is like an external towing machine: the machine has to reach out, grab the car, and pull it to make it move (`tow_machine_move(&car)`). 

A **Method** is like the steering wheel and gas pedal *inside* the car. Because they are fundamentally attached to the car itself (via `self`), you interact with the car directly: `car.drive()`.

### (3) Rust Code Examples

#### Short Snippet (The Basics)
```rust
struct User {
    name: String,
}

impl User {
    // The `&self` parameter makes this a Method! 
    // It means "I need to read the data of the User calling this method."
    fn greet(&self) {
        println!("Hello, my name is {}", self.name);
    }
}

fn main() {
    let u = User { name: String::from("Alice") };
    u.greet(); // Called using dot notation!
}
```

#### Fuller Example (The Three Types of `self`)
There are three ways a method can interact with the struct instance:
```rust
struct BankAccount {
    balance: f64,
}

impl BankAccount {
    // 1. `&self` (Read-Only). The most common.
    fn check_balance(&self) {
        println!("Balance is ${}", self.balance);
    }

    // 2. `&mut self` (Modify). Allows changing the struct's data.
    fn deposit(&mut self, amount: f64) {
        self.balance += amount;
    }

    // 3. `self` (Consume). Rare. Takes complete ownership and DESTROYS the struct!
    fn close_account(self) {
        println!("Account with ${} is now permanently closed.", self.balance);
        // The struct is destroyed at the end of this block.
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Method Scoping and Lifecycle Rules

**The mistake:** Assuming Method instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("method_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("method_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Method State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Method through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Method Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Method instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: High-Frequency Limit Order Book (`&self` vs `&mut self` Stateful Methods)

**Scenario:** **Problem Description:**
In electronic trading systems and exchange order matching engines, maintaining low-latency state changes without dynamic memory allocation overhead is critical. An order book maintains bid (buy) and ask (sell) limit orders sorted by price level.

**Requirements:**
Design and implement a matching engine `LimitOrderBook` using struct methods:
1. **Associated Constructor**: `LimitOrderBook::new(symbol: impl Into<String>) -> Self`.
2. **Inspect Methods (taking `&self`)**:
   - `best_bid(&self) -> Option<u64>`: Returns the highest buy price in the book.
   - `best_ask(&self) -> Option<u64>`: Returns the lowest sell price in the book.
   - `spread(&self) -> Option<u64>`: Returns the difference between `best_ask` and `best_bid` (if both exist).
   - `volume_at(&self, price: u64) -> u32`: Returns total order volume at a given price level across bids and asks.
3. **Mutation Methods (taking `&mut self`)**:
   - `add_limit_order(&mut self, is_bid: bool, price: u64, quantity: u32) -> Result<u64, OrderError>`: Validates that price and quantity are non-zero, assigns an auto-incrementing order ID, and stores the order.
   - `cancel_order(&mut self, order_id: u64) -> Result<(), OrderError>`: Removes an order by ID and cleans up empty price levels.
   - `execute_market_order(&mut self, is_buy: bool, mut quantity: u32) -> (u32, u64)`: Matches incoming market orders against opposing limit orders in price-time priority. Returns a tuple of `(total_quantity_filled, total_cost)`.

Write unit tests verifying `&self` queries, `&mut self` state mutations, cancellation, and market order matching using explicit assertions: `assert_eq!`, `assert!`, `assert_ne!`, and `matches!`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::BTreeMap;
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum OrderError {
>     InvalidPrice,
>     InvalidQuantity,
>     OrderNotFound,
> }
> 
> #[derive(Debug, Clone)]
> pub struct Order {
>     pub id: u64,
>     pub price: u64,
>     pub quantity: u32,
>     pub is_bid: bool,
> }
> 
> pub struct LimitOrderBook {
>     pub symbol: String,
>     next_order_id: u64,
>     bids: BTreeMap<u64, Vec<Order>>,
>     asks: BTreeMap<u64, Vec<Order>>,
> }
> 
> impl LimitOrderBook {
>     /// Associated constructor function (no `self` receiver).
>     pub fn new(symbol: impl Into<String>) -> Self {
>         Self {
>             symbol: symbol.into(),
>             next_order_id: 1,
>             bids: BTreeMap::new(),
>             asks: BTreeMap::new(),
>         }
>     }
> 
>     /// Inspect method taking `&self` to query highest bid.
>     pub fn best_bid(&self) -> Option<u64> {
>         self.bids.keys().next_back().copied()
>     }
> 
>     /// Inspect method taking `&self` to query lowest ask.
>     pub fn best_ask(&self) -> Option<u64> {
>         self.asks.keys().next().copied()
>     }
> 
>     /// Inspect method calculating bid-ask spread.
>     pub fn spread(&self) -> Option<u64> {
>         match (self.best_ask(), self.best_bid()) {
>             (Some(ask), Some(bid)) if ask >= bid => Some(ask - bid),
>             _ => None,
>         }
>     }
> 
>     /// Inspect method taking `&self` for volume lookup.
>     pub fn volume_at(&self, price: u64) -> u32 {
>         let bid_vol: u32 = self.bids.get(&price).map_or(0, |orders| orders.iter().map(|o| o.quantity).sum());
>         let ask_vol: u32 = self.asks.get(&price).map_or(0, |orders| orders.iter().map(|o| o.quantity).sum());
>         bid_vol + ask_vol
>     }
> 
>     /// Mutation method taking `&mut self` to insert a new limit order.
>     pub fn add_limit_order(
>         &mut self,
>         is_bid: bool,
>         price: u64,
>         quantity: u32,
>     ) -> Result<u64, OrderError> {
>         if price == 0 {
>             return Err(OrderError::InvalidPrice);
>         }
>         if quantity == 0 {
>             return Err(OrderError::InvalidQuantity);
>         }
> 
>         let id = self.next_order_id;
>         self.next_order_id += 1;
> 
>         let order = Order {
>             id,
>             price,
>             quantity,
>             is_bid,
>         };
> 
>         let book = if is_bid { &mut self.bids } else { &mut self.asks };
>         book.entry(price).or_default().push(order);
> 
>         Ok(id)
>     }
> 
>     /// Mutation method taking `&mut self` to cancel an existing order.
>     pub fn cancel_order(&mut self, order_id: u64) -> Result<(), OrderError> {
>         let books = [&mut self.bids, &mut self.asks];
>         for book in books {
>             let mut found_price = None;
>             let mut is_empty_now = false;
> 
>             for (price, orders) in book.iter_mut() {
>                 if let Some(pos) = orders.iter().position(|o| o.id == order_id) {
>                     orders.remove(pos);
>                     found_price = Some(*price);
>                     is_empty_now = orders.is_empty();
>                     break;
>                 }
>             }
> 
>             if let Some(price) = found_price {
>                 if is_empty_now {
>                     book.remove(&price);
>                 }
>                 return Ok(());
>             }
>         }
>         Err(OrderError::OrderNotFound)
>     }
> 
>     /// Mutation method taking `&mut self` to match market order volume.
>     pub fn execute_market_order(&mut self, is_buy: bool, mut quantity: u32) -> (u32, u64) {
>         let mut total_filled = 0u32;
>         let mut total_cost = 0u64;
> 
>         while quantity > 0 {
>             let best_price = if is_buy { self.best_ask() } else { self.best_bid() };
>             let price = match best_price {
>                 Some(p) => p,
>                 None => break,
>             };
> 
>             let remove_price_level = {
>                 let book = if is_buy { &mut self.asks } else { &mut self.bids };
>                 if let Some(orders) = book.get_mut(&price) {
>                     while quantity > 0 && !orders.is_empty() {
>                         let front = &mut orders[0];
>                         let fill = quantity.min(front.quantity);
>                         front.quantity -= fill;
>                         quantity -= fill;
>                         total_filled += fill;
>                         total_cost += (fill as u64) * price;
> 
>                         if front.quantity == 0 {
>                             orders.remove(0);
>                         }
>                     }
>                     orders.is_empty()
>                 } else {
>                     false
>                 }
>             };
> 
>             if remove_price_level {
>                 let book = if is_buy { &mut self.asks } else { &mut self.bids };
>                 book.remove(&price);
>             }
>         }
> 
>         (total_filled, total_cost)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_order_book_operations() {
>         let mut book = LimitOrderBook::new("BTC-USD");
>         assert_eq!(book.symbol, "BTC-USD");
>         assert_eq!(book.best_bid(), None);
>         assert_eq!(book.best_ask(), None);
>         assert_eq!(book.spread(), None);
> 
>         // Validation errors using matches!
>         let err_price = book.add_limit_order(true, 0, 100);
>         assert!(matches!(err_price, Err(OrderError::InvalidPrice)));
> 
>         let err_qty = book.add_limit_order(true, 50000, 0);
>         assert!(matches!(err_qty, Err(OrderError::InvalidQuantity)));
> 
>         // Insert orders
>         let bid1 = book.add_limit_order(true, 50000, 10).unwrap();
>         let bid2 = book.add_limit_order(true, 49900, 5).unwrap();
>         let ask1 = book.add_limit_order(false, 50100, 8).unwrap();
>         let ask2 = book.add_limit_order(false, 50200, 12).unwrap();
> 
>         assert_eq!(book.best_bid(), Some(50000));
>         assert_eq!(book.best_ask(), Some(50100));
>         assert_eq!(book.spread(), Some(100));
>         assert_eq!(book.volume_at(50000), 10);
>         assert_ne!(bid1, bid2);
> 
>         // Cancel order
>         assert!(book.cancel_order(bid1).is_ok());
>         assert_eq!(book.best_bid(), Some(49900));
>         let cancel_err = book.cancel_order(999);
>         assert!(matches!(cancel_err, Err(OrderError::OrderNotFound)));
> 
>         // Execute market buy order matching against ask1 (8 @ 50100) and ask2 (2 @ 50200)
>         let (filled, cost) = book.execute_market_order(true, 10);
>         assert_eq!(filled, 10);
>         assert_eq!(cost, (8 * 50100) + (2 * 50200));
>         assert_eq!(book.best_ask(), Some(50200));
>         assert_eq!(book.volume_at(50200), 10);
>         assert!(filled > 0);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Method Receiver Selection (`&self` vs `&mut self`)**:
>    - `best_bid`, `best_ask`, `spread`, and `volume_at` perform read-only inspect operations on internal `BTreeMap` structures. Using `&self` permits multiple concurrent shared reads without requiring exclusive access.
>    - `add_limit_order`, `cancel_order`, and `execute_market_order` modify internal state (`next_order_id`, `bids`, and `asks`). They require exclusive mutable borrowing `&mut self` to prevent data races and guarantee deterministic single-writer state consistency.
> 2. **Associated Constructor vs Method**:
>    - `LimitOrderBook::new` is an associated function because it lacks a `self` parameter. It initializes structural invariants before returning the owned type `Self`.
> 3. **Borrow Scope Scoping for Clean Mutability**:
>    - In `cancel_order` and `execute_market_order`, temporary scopes are used to query and modify vector contents (`get_mut`) before dropping the borrow. This ensures `book.remove(&price)` can safely take an exclusive mutable borrow of `book` without triggering borrow checker conflict `E0499`.
> 
---

### Exercise 2: Protocol Handshake State Machine (Consuming `self` Methods)

**Scenario:** **Problem Description:**
Network protocols (such as TLS handshakes, binary RPC framing, or IoT sensor protocols) enforce strict sequence transitions. For example, transmitting binary payloads before establishing authentication or reading metrics from a closed socket must be impossible.

**Requirements:**
By defining methods that take ownership of `self` by value, Rust's borrow checker enforces protocol transitions at compile-time: once a method taking `self` is called, the previous state variable is moved and destroyed, preventing illegal state reuse.

Implement a type-safe connection lifecycle:
1. `ConnectionBuilder::new(endpoint: &str) -> ConnectionBuilder`: Associated constructor.
2. `ConnectionBuilder::timeout(mut self, duration_ms: u64) -> Self`: Method taking `mut self` by value to support fluent method chaining.
3. `ConnectionBuilder::connect(self) -> UnauthenticatedConnection`: Consumes builder (`self`) and produces an unauthenticated connection.
4. `UnauthenticatedConnection::authenticate(self, token: &str) -> Result<AuthenticatedConnection, AuthError>`: Consumes `self`. If `token == "secret-token"`, transitions into `AuthenticatedConnection`; otherwise returns `Err(AuthError::InvalidToken)`.
5. `AuthenticatedConnection`:
   - `send_bytes(&mut self, payload: &[u8]) -> Result<usize, ConnError>`: Takes `&mut self` to record byte transmissions up to a payload limit of 1024 bytes.
   - `close(self) -> ClosedConnection`: Consumes `self` by value to close the connection.
6. `ClosedConnection::stats(&self) -> (u64, &str)`: Takes `&self` to report total bytes sent and target endpoint.

Write unit tests verifying fluent initialization, protocol state transitions, invalid authentication handling, payload limits, and explicit assertions: `assert_eq!`, `assert!`, `assert_ne!`, and `matches!`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq)]
> pub enum AuthError {
>     InvalidToken,
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum ConnError {
>     SocketClosed,
>     BufferOverflow,
> }
> 
> pub struct ConnectionBuilder {
>     endpoint: String,
>     timeout_ms: u64,
> }
> 
> impl ConnectionBuilder {
>     /// Associated constructor function.
>     pub fn new(endpoint: &str) -> Self {
>         Self {
>             endpoint: endpoint.to_string(),
>             timeout_ms: 5000,
>         }
>     }
> 
>     /// Method taking `mut self` by value for fluent method chaining.
>     pub fn timeout(mut self, duration_ms: u64) -> Self {
>         self.timeout_ms = duration_ms;
>         self
>     }
> 
>     /// Transition method consuming `self` by value.
>     pub fn connect(self) -> UnauthenticatedConnection {
>         UnauthenticatedConnection {
>             endpoint: self.endpoint,
>             timeout_ms: self.timeout_ms,
>         }
>     }
> }
> 
> pub struct UnauthenticatedConnection {
>     endpoint: String,
>     timeout_ms: u64,
> }
> 
> impl UnauthenticatedConnection {
>     /// Consumes `self` to enforce state transition.
>     pub fn authenticate(self, token: &str) -> Result<AuthenticatedConnection, AuthError> {
>         if token == "secret-token" {
>             Ok(AuthenticatedConnection {
>                 endpoint: self.endpoint,
>                 bytes_sent: 0,
>             })
>         } else {
>             Err(AuthError::InvalidToken)
>         }
>     }
> }
> 
> pub struct AuthenticatedConnection {
>     endpoint: String,
>     bytes_sent: u64,
> }
> 
> impl AuthenticatedConnection {
>     /// Method taking `&mut self` for stateful payload transmission.
>     pub fn send_bytes(&mut self, payload: &[u8]) -> Result<usize, ConnError> {
>         if payload.len() > 1024 {
>             return Err(ConnError::BufferOverflow);
>         }
>         self.bytes_sent += payload.len() as u64;
>         Ok(payload.len())
>     }
> 
>     /// Consumes `self` by value to finalize connection state.
>     pub fn close(self) -> ClosedConnection {
>         ClosedConnection {
>             endpoint: self.endpoint,
>             total_bytes_sent: self.bytes_sent,
>         }
>     }
> }
> 
> pub struct ClosedConnection {
>     endpoint: String,
>     total_bytes_sent: u64,
> }
> 
> impl ClosedConnection {
>     /// Read-only inspect method taking `&self`.
>     pub fn stats(&self) -> (u64, &str) {
>         (self.total_bytes_sent, self.endpoint.as_str())
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_connection_lifecycle() {
>         // 1. Method chaining via builder
>         let builder = ConnectionBuilder::new("api.service.internal:8443").timeout(3000);
>         assert_eq!(builder.timeout_ms, 3000);
> 
>         // 2. Failed authentication handling
>         let failed_conn = ConnectionBuilder::new("api.service.internal:8443").connect();
>         let auth_res = failed_conn.authenticate("wrong_token");
>         assert!(matches!(auth_res, Err(AuthError::InvalidToken)));
> 
>         // 3. Successful transition path
>         let conn_unauth = builder.connect();
>         let mut conn_auth = conn_unauth.authenticate("secret-token").unwrap();
> 
>         // 4. Stateful payload writes using &mut self
>         let bytes1 = conn_auth.send_bytes(b"hello server").unwrap();
>         let bytes2 = conn_auth.send_bytes(b"another payload").unwrap();
>         assert_eq!(bytes1, 12);
>         assert_eq!(bytes2, 15);
>         assert_ne!(bytes1, bytes2);
> 
>         // Buffer overflow check
>         let large_payload = vec![0u8; 2048];
>         let overflow_res = conn_auth.send_bytes(&large_payload);
>         assert!(matches!(overflow_res, Err(ConnError::BufferOverflow)));
> 
>         // 5. Final transition consuming self
>         let closed = conn_auth.close();
>         let (total, endpoint) = closed.stats();
>         assert_eq!(total, 27);
>         assert_eq!(endpoint, "api.service.internal:8443");
>         assert!(total > 0);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Consuming Receiver (`self`) for Type-State Guarantees**:
>    - Methods taking `self` move ownership of the struct instance into the method scope. At the end of the method, the original instance is dropped or moved into a new return type (e.g. `UnauthenticatedConnection` $\rightarrow$ `AuthenticatedConnection`).
>    - This eliminates runtime state flags (such as `is_connected: bool`). Attempting to send bytes over `conn_unauth` or `closed` triggers compile error `E0382` (use of moved value), converting runtime security flaws into immediate compile errors.
> 2. **Builder Pattern via Value Receiver (`mut self`)**:
>    - `ConnectionBuilder::timeout` takes `mut self` by value and returns `Self`. This enables fluent dot-notation method chaining (`builder.timeout(3000).connect()`) without requiring heap allocation or pointer dereferencing.
> 3. **Post-Closure Inspection (`&self`)**:
>    - `ClosedConnection::stats` takes `&self`, allowing safe, read-only post-mortem inspection of session telemetry while guaranteeing no further network operations can be invoked.
> 
---

### Exercise 3: Dynamic AST Evaluator & Pipeline Transformer (`&mut Self` Chaining vs `self` Consumption)

**Scenario:** **Problem Description:**
In expression evaluation engines, rule processing frameworks, and compiler toolchains, Abstract Syntax Tree (AST) structures are constructed, transformed, and evaluated against execution contexts.

**Requirements:**
Implement an AST evaluation pipeline:
1. `ExecutionContext`:
   - Associated constructor `ExecutionContext::new() -> Self`.
   - `set_var(&mut self, name: &str, value: i64) -> &mut Self`: Sets a variable in an internal `HashMap`. Takes `&mut self` and returns `&mut Self` to allow method chaining on mutable references.
   - `get_var(&self, name: &str) -> Option<i64>`: Borrows `&self` to perform variable lookup.
2. `Expr` Enum:
   - Variants: `Literal(i64)`, `Variable(String)`, `Add(Box<Expr>, Box<Expr>)`, `Multiply(Box<Expr>, Box<Expr>)`.
3. Methods on `Expr`:
   - `eval(&self, ctx: &ExecutionContext) -> Result<i64, EvalError>`: Recursively evaluates the AST node. Borrowing `&self` guarantees the expression tree remains unchanged during evaluation.
   - `substitute(self, var_name: &str, val: i64) -> Self`: Consumes `self` by value, replaces matching `Variable(var_name)` nodes with `Literal(val)`, and returns the modified tree `Self`.

Write unit tests verifying variable environment setup using mutable reference chaining (`&mut Self`), expression evaluation, AST variable substitution using `self` consumption, error handling for unbound variables, and explicit assertions: `assert_eq!`, `assert!`, `assert_ne!`, and `matches!`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::HashMap;
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum EvalError {
>     VariableNotFound(String),
>     Overflow,
> }
> 
> pub struct ExecutionContext {
>     variables: HashMap<String, i64>,
> }
> 
> impl ExecutionContext {
>     /// Associated constructor function.
>     pub fn new() -> Self {
>         Self {
>             variables: HashMap::new(),
>         }
>     }
> 
>     /// Method taking `&mut self` and returning `&mut Self` for chaining on mutable references.
>     pub fn set_var(&mut self, name: &str, value: i64) -> &mut Self {
>         self.variables.insert(name.to_string(), value);
>         self
>     }
> 
>     /// Read-only lookup taking `&self`.
>     pub fn get_var(&self, name: &str) -> Option<i64> {
>         self.variables.get(name).copied()
>     }
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub enum Expr {
>     Literal(i64),
>     Variable(String),
>     Add(Box<Expr>, Box<Expr>),
>     Multiply(Box<Expr>, Box<Expr>),
> }
> 
> impl Expr {
>     /// Inspect method taking `&self` for recursive non-destructive evaluation.
>     pub fn eval(&self, ctx: &ExecutionContext) -> Result<i64, EvalError> {
>         match self {
>             Expr::Literal(val) => Ok(*val),
>             Expr::Variable(name) => ctx
>                 .get_var(name)
>                 .ok_or_else(|| EvalError::VariableNotFound(name.clone())),
>             Expr::Add(left, right) => {
>                 let l = left.eval(ctx)?;
>                 let r = right.eval(ctx)?;
>                 l.checked_add(r).ok_or(EvalError::Overflow)
>             }
>             Expr::Multiply(left, right) => {
>                 let l = left.eval(ctx)?;
>                 let r = right.eval(ctx)?;
>                 l.checked_mul(r).ok_or(EvalError::Overflow)
>             }
>         }
>     }
> 
>     /// Transformation method taking `self` by value to recursively replace variables.
>     pub fn substitute(self, var_name: &str, val: i64) -> Self {
>         match self {
>             Expr::Literal(v) => Expr::Literal(v),
>             Expr::Variable(name) => {
>                 if name == var_name {
>                     Expr::Literal(val)
>                 } else {
>                     Expr::Variable(name)
>                 }
>             }
>             Expr::Add(left, right) => Expr::Add(
>                 Box::new(left.substitute(var_name, val)),
>                 Box::new(right.substitute(var_name, val)),
>             ),
>             Expr::Multiply(left, right) => Expr::Multiply(
>                 Box::new(left.substitute(var_name, val)),
>                 Box::new(right.substitute(var_name, val)),
>             ),
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_ast_eval_and_substitute() {
>         let mut ctx = ExecutionContext::new();
>         // Method chaining on a mutable reference using &mut Self
>         ctx.set_var("x", 10).set_var("y", 20);
> 
>         assert_eq!(ctx.get_var("x"), Some(10));
>         assert_eq!(ctx.get_var("y"), Some(20));
>         assert_eq!(ctx.get_var("z"), None);
> 
>         // Construct AST representing: (x + 5) * y
>         let expr = Expr::Multiply(
>             Box::new(Expr::Add(
>                 Box::new(Expr::Variable("x".to_string())),
>                 Box::new(Expr::Literal(5)),
>             )),
>             Box::new(Expr::Variable("y".to_string())),
>         );
> 
>         // Non-destructive evaluation: (10 + 5) * 20 = 300
>         let res = expr.eval(&ctx);
>         assert_eq!(res, Ok(300));
> 
>         // Unbound variable error check using matches!
>         let unbound_expr = Expr::Add(
>             Box::new(Expr::Variable("unbound".to_string())),
>             Box::new(Expr::Literal(1)),
>         );
>         let err_res = unbound_expr.eval(&ctx);
>         assert!(matches!(err_res, Err(EvalError::VariableNotFound(ref name)) if name == "unbound"));
> 
>         // AST substitution consuming self: replace "x" with 100 -> (100 + 5) * 20 = 2100
>         let transformed = expr.clone().substitute("x", 100);
>         let res_transformed = transformed.eval(&ctx);
>         assert_eq!(res_transformed, Ok(2100));
>         assert_ne!(res.unwrap(), res_transformed.unwrap());
>         assert!(res_transformed.is_ok());
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **`&mut Self` Receiver Chaining vs Value Move (`mut self`)**:
>    - `ExecutionContext::set_var` takes `&mut self` and returns `&mut Self`. This allows caller-side method chaining (`ctx.set_var("x", 10).set_var("y", 20);`) on an existing mutable stack variable without transferring ownership or reallocating the container.
> 2. **Recursive Traversal via Immutable Shared Reference (`&self`)**:
>    - `Expr::eval` accepts `&self` and `&ExecutionContext`. Because no state is modified, multiple threads can concurrently evaluate the exact same AST instance across shared execution contexts without dynamic lock overhead.
> 3. **Recursive In-Place Rebuilding taking `self`**:
>    - `Expr::substitute` takes `self` by value. Transferring ownership of the recursive `Box<Expr>` nodes allows pattern matching and replacing specific AST branches without cloning or allocating extra memory for unchanged nodes.
> 
---

## 6. Related Terms


- [Associated Function](associated_function.md) — A function inside an `impl` block that does *not* take `self` (like a static constructor, e.g., `String::new()`).
- [`impl` Block](impl_block.md) — The boundary where all methods live.
- [Reborrowing & Two-Phase Borrows](../level_03/reborrowing.md) — Related concept: Reborrowing & Two-Phase Borrows.

---

## 7. Key Takeaways

- **Methods** are functions tied to a specific instance of a struct or enum.
- They must be defined inside an `impl` block.
- Their very first parameter must be `self` (which represents the instance).
- You call them using dot notation: `instance.method_name()`.
- **Default to using `&self` (read-only)**. Only use `&mut self` if you must modify data. Rarely use `self` without an ampersand, as it will destroy the instance.
