# Declarative Macros (`macro_rules!`)

> **Level 12 — Macros**
> Pattern-matching macros for code generation, syntax extension, and DSL creation evaluated at compile time.

---

## 1. Prerequisites


- [Functions (`fn`)](../level_01/function.md) — Understanding function calls and signatures vs macro expansion.
- [`match`](../level_02/match.md) — declarative macros use structural pattern matching very similar to `match` arms.
- [Expressions vs. Statements](../level_01/expression_vs_statement.md) — Macro matchers care deeply about syntactic categories like `expr`, `stmt`, and `ty`.

---

## 2. Term Category



**Rust Macro Primitive (pattern matching macro_rules! definition)**: `macro_rules!` is Rust's system for declarative metaprogramming. Unlike functions that evaluate values at runtime, declarative macros operate on syntax (tokens) at compile time using pattern matching to expand into standard Rust code.



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In JavaScript and TypeScript, reducing boilerplate or introducing custom domain-specific syntax is often done at runtime (e.g. passing objects, higher-order functions) or via complex build-step transpilers (Babel, SWC, custom AST transformers). However, runtime wrappers add overhead, and external build tools operate outside the language itself.

Rust needed a way to perform compile-time code generation that was:
1. **Zero-cost at runtime**: Code is expanded directly before type checking and compilation.
2. **Type-safe & Hygienic**: Prevents macro variables from silently shadowing local variables in caller scope.
3. **Variadic & Expressive**: Supports taking an arbitrary number of arguments without allocating arrays or slices (e.g., `vec![1, 2, 3]`, `println!`).

Functions in Rust cannot accept a variable number of differently-typed arguments without dynamic dispatch (`&dyn Trait`) or slices. Declarative macros (`macro_rules!`) solve this by providing structural AST pattern matching over code tokens.

### (2) Reality Metaphor

Imagine a **Custom Cookie Cutter Factory**. 

- A **Function** is like a standard biscuit box: it accepts a fixed shape of dough (typed parameters) and produces a finished biscuit.
- A **Declarative Macro (`macro_rules!`)** is a machine that inspects the blueprint of the dough you pass in (pattern matching tokens). If you pass in 3 chocolate chips, it instantly stamps out a 3-chip cookie mold. If you pass in 10, it stamps out a 10-chip mold. 
- The macro doesn't eat or bake the cookies at runtime; it generates the exact physical molds (**Rust code**) at compile time before the baking (**compilation**) begins.

### (3) Code Examples

#### Short Snippet (Custom `vec!`-style Macro)

```rust
// Define a macro that creates a HashMap with syntactic sugar
macro_rules! map {
    ( $( $key:expr => $value:expr ),* $(,)? ) => {{
        let mut temp_map = std::collections::HashMap::new();
        $(
            temp_map.insert($key, $value);
        )*
        temp_map
    }};
}

fn main() {
    // Easily construct a HashMap without repetitive .insert() calls
    let user_roles = map! {
        "Alice" => "Admin",
        "Bob" => "User",
    };

    println!("Alice's role: {:?}", user_roles.get("Alice"));
}
```

#### Fuller Example (Variadic Logging & Design Pattern)

```rust
/// A declarative macro for structured console logging with custom syntax.
/// Demonstrates multiple matcher arms, designators ($expr, $ident, $ty), and repetition.
macro_rules! log_info {
    // Arm 1: Simple message
    ($msg:expr) => {
        println!("[INFO] [{}:{}] {}", file!(), line!(), $msg);
    };

    // Arm 2: Message with key-value payload context
    ($msg:expr, $( $key:ident = $val:expr ),+ $(,)?) => {
        print!("[INFO] [{}:{}] {} | Context: ", file!(), line!(), $msg);
        $(
            print!("{}={} ", stringify!($key), $val);
        )*
        println!();
    };
}

fn main() {
    let status_code = 200;
    let latency_ms = 45;

    // Matches Arm 1
    log_info!("Server initialized successfully");

    // Matches Arm 2 with variadic key-value pairs
    log_info!(
        "Request processed",
        status = status_code,
        latency = latency_ms,
        path = "/api/v1/health",
    );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Fragment Specifier Mismatch (e.g., using `expr` where `ident` or `ty` is expected)

**The mistake:** Using `$x:expr` when trying to match a type name, variable name, or item definition inside a macro.

**Why it's wrong:** Rust macro designators (`expr`, `ty`, `ident`, `stmt`, `pat`, `path`) restrict what syntactic elements can match and what tokens can follow them to maintain grammar stability and prevent parsing ambiguity.

*Incorrect:*
```rust
macro_rules! create_struct {
    // ❌ Error: $name:expr cannot be used as a struct identifier name
    ($name:expr) => {
        struct $name {
            id: u64,
        }
    };
}
```

*Fix:*
```rust
macro_rules! create_struct {
    // Correct: Use $name:ident for identifiers
    ($name:ident) => {
        struct $name {
            id: u64,
        }
    };
}

create_struct!(User);
```

---

### Mistake 2: Missing Macro Export Annotations Across Modules

**The mistake:** Defining a macro inside a child module and expecting it to be visible in other modules using standard `use crate::foo::my_macro;` without proper macro scope attributes.

**Why it's wrong:** Declarative macros follow historical textual scoping rules unless annotated with `#[macro_export]`. Without `#[macro_export]`, macros are only visible *after* their definition order in the file hierarchy.

*Incorrect:*
```rust
mod logger {
    macro_rules! my_log {
        ($msg:expr) => { println!("{}", $msg); };
    }
}

fn main() {
    // ❌ Error: cannot find macro `my_log` in this scope
    // my_log!("hello");
}
```

*Fix:*
```rust
// Option A: Export to crate root
#[macro_export]
macro_rules! my_log {
    ($msg:expr) => { println!("{}", $msg); };
}

fn main() {
    my_log!("hello"); // Works!
}
```

---

### Mistake 3: Trailing Comma Repetition Failure

**The mistake:** Writing repetition matchers like `$( $x:expr ),*` without allowing optional trailing commas, causing compile errors when users write trailing commas in multi-line invocations.

**Why it's wrong:** Rust idiomatic formatting relies on trailing commas. If your macro pattern doesn't explicitly match `$(,)?`, passing a trailing comma breaks macro pattern matching.

*Incorrect:*
```rust
macro_rules! print_all {
    ( $( $x:expr ),* ) => { // Doesn't match trailing comma
        $( println!("{}", $x); )*
    };
}

// print_all!(1, 2, 3,); // ❌ Error: no rules expected the token `,`
```

*Fix:*
```rust
macro_rules! print_all {
    ( $( $x:expr ),* $(,)? ) => { // $(,)? matches 0 or 1 trailing comma
        $( println!("{}", $x); )*
    };
}

fn main() {
    print_all!(1, 2, 3,); // Correct!
}
```

---

## 5. Practice Exercises

### Exercise 1: Type-Safe Embedded Bitfield Register Macro (`no_std`)

**Scenario:** In microcontrollers and hardware driver development (`#![no_std]`), developers frequently manipulate hardware peripheral registers using raw bit shifts and bitwise masks. Writing manual bitwise code for every register flag leads to copy-paste bugs and typos in bit offset calculations.

**Task:** Write a declarative macro `define_bitflags!` that generates a type-safe bitfield struct for a hardware register.

The macro must accept:
1. The visibility modifier and name of the generated struct (e.g., `pub struct UartStatus`).
2. The underlying integer type (e.g., `u8`, `u16`, `u32`).
3. A series of flag definitions formatted as `FLAG_NAME = bit_offset`.

The macro should expand to:
- A tuple struct wrapping the inner integer type with `#[derive(Debug, Clone, Copy, PartialEq, Eq)]`.
- `pub const` associated constants for each flag name holding its shifted bit mask (`1 << bit_offset`).
- A `new(bits: int_type) -> Self` constructor and an `empty() -> Self` method.
- Bitwise query and mutation methods: `contains(&self, flag_mask: int_type) -> bool`, `set(&mut self, flag_mask: int_type)`, `clear(&mut self, flag_mask: int_type)`, and `bits(&self) -> int_type`.
- Support for optional trailing commas.

Include complete unit tests using `#[test]` and assertions (`assert!`, `assert_eq!`) verifying bit operations.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #![no_std]
> 
> macro_rules! define_bitflags {
>     (
>         $vis:vis struct $name:ident : $ty:ty {
>             $( $flag:ident = $bit:expr ),* $(,)?
>         }
>     ) => {
>         #[derive(Debug, Clone, Copy, PartialEq, Eq)]
>         $vis struct $name(pub $ty);
> 
>         impl $name {
>             $(
>                 pub const $flag: $ty = 1 << $bit;
>             )*
> 
>             #[inline]
>             pub const fn new(bits: $ty) -> Self {
>                 Self(bits)
>             }
> 
>             #[inline]
>             pub const fn empty() -> Self {
>                 Self(0)
>             }
> 
>             #[inline]
>             pub fn contains(&self, flag_mask: $ty) -> bool {
>                 (self.0 & flag_mask) == flag_mask
>             }
> 
>             #[inline]
>             pub fn set(&mut self, flag_mask: $ty) {
>                 self.0 |= flag_mask;
>             }
> 
>             #[inline]
>             pub fn clear(&mut self, flag_mask: $ty) {
>                 self.0 &= !flag_mask;
>             }
> 
>             #[inline]
>             pub const fn bits(&self) -> $ty {
>                 self.0
>             }
>         }
>     };
> }
> 
> // Define a status register for a simulated UART hardware peripheral
> define_bitflags! {
>     pub struct UartStatus : u8 {
>         TX_EMPTY = 0,
>         RX_READY = 1,
>         PARITY_ERR = 2,
>         OVERRUN_ERR = 3,
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_bitflags_initialization_and_masks() {
>         assert_eq!(UartStatus::TX_EMPTY, 0b0000_0001);
>         assert_eq!(UartStatus::RX_READY, 0b0000_0010);
>         assert_eq!(UartStatus::PARITY_ERR, 0b0000_0100);
>         assert_eq!(UartStatus::OVERRUN_ERR, 0b0000_1000);
> 
>         let status = UartStatus::new(0b0000_0011);
>         assert!(status.contains(UartStatus::TX_EMPTY));
>         assert!(status.contains(UartStatus::RX_READY));
>         assert!(!status.contains(UartStatus::PARITY_ERR));
>     }
> 
>     #[test]
>     fn test_bitflags_mutation() {
>         let mut status = UartStatus::empty();
>         assert_eq!(status.bits(), 0);
> 
>         status.set(UartStatus::TX_EMPTY | UartStatus::PARITY_ERR);
>         assert!(status.contains(UartStatus::TX_EMPTY));
>         assert!(status.contains(UartStatus::PARITY_ERR));
>         assert_eq!(status.bits(), 0b0000_0101);
> 
>         status.clear(UartStatus::TX_EMPTY);
>         assert!(!status.contains(UartStatus::TX_EMPTY));
>         assert!(status.contains(UartStatus::PARITY_ERR));
>         assert_eq!(status.bits(), 0b0000_0100);
>     }
> }
> ```
> 
> #### Technical Explanation
>
> 1. **Fragment Specifiers:**
>    - `$vis:vis`: Matches visibility modifiers like `pub` or `pub(crate)` (or empty for private).
>    - `$name:ident`: Matches the struct name identifier (`UartStatus`).
>    - `$ty:ty`: Matches the underlying primitive integer type (`u8`, `u16`, `u32`).
>    - `$flag:ident = $bit:expr`: Matches each constant flag identifier and its bit shift expression.
> 2. **Repetition Pattern (`$( ... ),* $(,)?`):**
>    - Matches zero or more comma-separated flag assignments, with `$(,)?` matching zero or one trailing comma.
> 3. **Compile-Time Constant Generation:**
>    - `$( pub const $flag: $ty = 1 << $bit; )*` expands into multiple `pub const` definitions inside `impl $name`, computing masks at compile time without runtime overhead.
> 4. **`no_std` Compatibility:**
>    - The generated code uses only core integer bitwise operations (`&`, `|`, `!`), avoiding dynamic memory allocation (`alloc`) or the standard library (`std`), making it ideal for bare-metal microcontroller drivers.

---

### Exercise 2: Declarative Telemetry Metrics Registry

**Scenario:** Production microservices require low-overhead, thread-safe application metrics (counters for HTTP requests, gauges for active queue depths). Manually defining struct fields and atomic boilerplate across multiple metric types introduces duplication and maintenance overhead.

**Task:** Create a declarative macro `metrics_registry!` that builds a thread-safe metric container struct wrapping atomic counters and gauges.

Define helper structs `Counter` and `Gauge` wrapping `std::sync::atomic::AtomicU64`.

The macro must accept:
```rust
metrics_registry! {
    pub struct AppMetrics {
        http_requests: Counter,
        active_connections: Gauge,
        error_count: Counter,
    }
}
```

The macro should expand to:
- A struct where each field is initialized as the specified wrapper type (`Counter` or `Gauge`).
- A `pub fn new() -> Self` constructor that initializes all atomic counters to 0.
- Allow public field access so caller code can invoke methods like `.inc()`, `.set()`, and `.get()`.
- Support optional trailing commas.

Write comprehensive unit tests with `#[test]`, `std::thread`, `std::sync::Arc`, and assertions (`assert_eq!`) verifying thread-safe metric updates across concurrent threads.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::sync::atomic::{AtomicU64, Ordering};
> use std::sync::Arc;
> use std::thread;
> 
> /// A thread-safe atomic counter for monotonic increments.
> pub struct Counter(AtomicU64);
> impl Counter {
>     pub const fn new() -> Self {
>         Self(AtomicU64::new(0))
>     }
>     pub fn inc(&self) -> u64 {
>         self.0.fetch_add(1, Ordering::Relaxed) + 1
>     }
>     pub fn get(&self) -> u64 {
>         self.0.load(Ordering::Relaxed)
>     }
> }
> 
> /// A thread-safe atomic gauge for dynamic value tracking.
> pub struct Gauge(AtomicU64);
> impl Gauge {
>     pub const fn new() -> Self {
>         Self(AtomicU64::new(0))
>     }
>     pub fn set(&self, val: u64) {
>         self.0.store(val, Ordering::Relaxed);
>     }
>     pub fn get(&self) -> u64 {
>         self.0.load(Ordering::Relaxed)
>     }
> }
> 
> macro_rules! metrics_registry {
>     (
>         $vis:vis struct $name:ident {
>             $( $field:ident : $kind:ident ),* $(,)?
>         }
>     ) => {
>         $vis struct $name {
>             $( pub $field: $kind, )*
>         }
> 
>         impl $name {
>             pub fn new() -> Self {
>                 Self {
>                     $( $field: $kind::new(), )*
>                 }
>             }
>         }
>     };
> }
> 
> // Instantiate an application telemetry registry
> metrics_registry! {
>     pub struct AppMetrics {
>         http_requests: Counter,
>         active_connections: Gauge,
>         error_count: Counter,
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_single_threaded_metrics() {
>         let metrics = AppMetrics::new();
>         assert_eq!(metrics.http_requests.get(), 0);
>         assert_eq!(metrics.active_connections.get(), 0);
> 
>         metrics.http_requests.inc();
>         metrics.http_requests.inc();
>         metrics.active_connections.set(42);
> 
>         assert_eq!(metrics.http_requests.get(), 2);
>         assert_eq!(metrics.active_connections.get(), 42);
>     }
> 
>     #[test]
>     fn test_concurrent_metric_updates() {
>         let metrics = Arc::new(AppMetrics::new());
>         let mut handles = vec![];
> 
>         // Spawn 10 threads, each incrementing http_requests 100 times
>         for _ in 0..10 {
>             let m = Arc::clone(&metrics);
>             let handle = thread::spawn(move || {
>                 for _ in 0..100 {
>                     m.http_requests.inc();
>                 }
>             });
>             handles.push(handle);
>         }
> 
>         for handle in handles {
>             handle.join().unwrap();
>         }
> 
>         assert_eq!(metrics.http_requests.get(), 1000);
>     }
> }
> ```
> 
> #### Technical Explanation
>
> 1. **Ident Matchers (`$kind:ident`):**
>    - The macro uses `$kind:ident` to match type names (`Counter`, `Gauge`). This allows `$kind::new()` to construct each field uniformly inside `impl $name`.
> 2. **Macro Code Expansion:**
>    - `$( pub $field: $kind, )*` expands the struct definition field by field.
>    - `$( $field: $kind::new(), )*` expands the `new()` constructor initializer list.
> 3. **Thread Safety & Metaprogramming:**
>    - By generating wrapping fields containing `AtomicU64`, the macro guarantees zero-cost, lock-free concurrent updates via atomic operations (`Ordering::Relaxed`).
> 4. **Composition & Reusability:**
>    - Pairing domain structs (`Counter`, `Gauge`) with `macro_rules!` keeps the macro syntax clean and readable while delegating specialized logic to Rust's type system.

---

### Exercise 3: Declarative Micro-Router for Command Execution

**Scenario:** Embedded CLI systems, serial UART controllers, and network message handlers parse incoming byte opcodes (e.g. `0x01` for Ping, `0x02` for Reset) and dispatch execution to specific handler functions. Manually matching opcodes to handlers leads to repetitive `match` blocks and duplicated error checking.

**Task:** Write a declarative macro `dispatch_table!` that constructs an opcode enum and an automated dispatch routing function.

The macro must accept:
```rust
dispatch_table! {
    pub enum CommandId {
        Ping = 0x01 => handle_ping,
        SystemReset = 0x02 => handle_reset,
        GetStatus = 0x03 => handle_status,
    }
}
```

The macro should expand to:
- A `u8`-repr enum `CommandId` with explicit discriminant values (`0x01`, `0x02`, etc.) and `#[derive(Debug, Clone, Copy, PartialEq, Eq)]`.
- An `impl CommandId` block containing `pub fn from_u8(val: u8) -> Result<Self, DispatchError>`.
- A dispatch function `pub fn dispatch(opcode: u8, payload: &[u8]) -> Result<u32, DispatchError>` that matches the opcode against the table and invokes the appropriate handler function path `$handler(payload)`.
- Custom error type `DispatchError` handling unknown opcodes and handler errors.

Write comprehensive unit tests with `#[test]` and `assert_eq!` verifying successful command routing, error propagation, and unknown opcode rejection.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq)]
> pub enum DispatchError {
>     UnknownOpcode(u8),
>     HandlerFailed(&'static str),
> }
> 
> macro_rules! dispatch_table {
>     (
>         $vis:vis enum $name:ident {
>             $( $variant:ident = $opcode:expr => $handler:path ),* $(,)?
>         }
>     ) => {
>         #[derive(Debug, Clone, Copy, PartialEq, Eq)]
>         #[repr(u8)]
>         $vis enum $name {
>             $( $variant = $opcode, )*
>         }
> 
>         impl $name {
>             pub fn from_u8(val: u8) -> Result<Self, DispatchError> {
>                 match val {
>                     $( $opcode => Ok(Self::$variant), )*
>                     other => Err(DispatchError::UnknownOpcode(other)),
>                 }
>             }
>         }
> 
>         $vis fn dispatch(opcode: u8, payload: &[u8]) -> Result<u32, DispatchError> {
>             match opcode {
>                 $(
>                     $opcode => $handler(payload).map_err(DispatchError::HandlerFailed),
>                 )*
>                 other => Err(DispatchError::UnknownOpcode(other)),
>             }
>         }
>     };
> }
> 
> // Handler functions called by the generated dispatcher
> fn handle_ping(_payload: &[u8]) -> Result<u32, &'static str> {
>     Ok(1) // Return status code 1 for Pong
> }
> 
> fn handle_reset(payload: &[u8]) -> Result<u32, &'static str> {
>     if payload.is_empty() {
>         Err("Missing authorization token payload")
>     } else {
>         Ok(200) // Reset success code
>     }
> }
> 
> fn handle_status(_payload: &[u8]) -> Result<u32, &'static str> {
>     Ok(100) // System status operational
> }
> 
> // Declare the command routing table
> dispatch_table! {
>     pub enum CommandId {
>         Ping = 0x01 => handle_ping,
>         SystemReset = 0x02 => handle_reset,
>         GetStatus = 0x03 => handle_status,
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_opcode_enum_conversion() {
>         assert_eq!(CommandId::from_u8(0x01), Ok(CommandId::Ping));
>         assert_eq!(CommandId::from_u8(0x02), Ok(CommandId::SystemReset));
>         assert_eq!(CommandId::from_u8(0x03), Ok(CommandId::GetStatus));
>         assert_eq!(
>             CommandId::from_u8(0xFF),
>             Err(DispatchError::UnknownOpcode(0xFF))
>         );
>     }
> 
>     #[test]
>     fn test_dispatch_routing_and_errors() {
>         // Test successful Ping dispatch
>         assert_eq!(dispatch(0x01, &[]), Ok(1));
> 
>         // Test Reset dispatch with valid payload
>         assert_eq!(dispatch(0x02, &[0xAA, 0xBB]), Ok(200));
> 
>         // Test Reset dispatch with missing payload failure
>         assert_eq!(
>             dispatch(0x02, &[]),
>             Err(DispatchError::HandlerFailed("Missing authorization token payload"))
>         );
> 
>         // Test unknown opcode rejection
>         assert_eq!(
>             dispatch(0x99, &[]),
>             Err(DispatchError::UnknownOpcode(0x99))
>         );
>     }
> }
> ```
> 
> #### Technical Explanation
>
> 1. **Path Fragment Specifier (`$handler:path`):**
>    - The macro uses `$handler:path` to match function names or full item paths (e.g. `handle_ping` or `crate::handlers::handle_ping`), enabling flexible handler dispatching.
> 2. **Multi-Item Generation from a Single Invocation:**
>    - A single macro call constructs three distinct compiler items: the `enum CommandId`, the `impl CommandId` block with `from_u8`, and the standalone `dispatch` router function.
> 3. **Dual Repetition Expansion:**
>    - The pattern `$( $variant:ident = $opcode:expr => $handler:path ),*` is expanded twice: once inside `enum $name` to define variants, once inside `from_u8` to construct opcode-to-enum arms, and once inside `dispatch` to map opcodes to `$handler(payload)`.
> 4. **Safety & Zero Overhead:**
>    - The generated match statement avoids dynamic memory allocations and trait object vtables (`dyn Fn`), allowing the Rust compiler to inline handler calls directly for maximum performance.

---

## 6. Related Terms


- [Procedural Macros](procedural_macros.md) — Function-like, derive, and attribute macros operating on raw `TokenStream`s via Rust code.
- [Hygiene](hygiene.md) — The rule system ensuring macros don't accidentally leak or collide with identifiers in caller scopes.
- [`match`](../level_02/match.md) — Value-level pattern matching, which inspired macro token matching.
- [Token Stream](token_stream.md) — The underlying stream of compiler tokens that macros analyze and generate.
- [Function-like Macros](function_like_macros.md) — Related concept: Function-like Macros.
- [Declarative Macros (`macro_rules!`)](declarative_macros.md) — Related concept: Declarative Macros (`macro_rules!`).
- [Macros](../level_01/macros.md) — Related concept: Macros.

---

## 7. Key Takeaways

- `macro_rules!` enables declarative, pattern-matching metaprogramming evaluated entirely at compile time.
- Macro arguments use **designators** (e.g. `$expr:expr`, `$id:ident`, `$t:ty`) to categorize AST syntax fragments.
- Repetition syntax `$( ... ),*` allows variadic arguments with optional trailing comma support via `$(,)?`.
- Declarative macros are **hygienic**: local variables declared inside macro expansions cannot interfere with caller scope variables.
- Use `#[macro_export]` to make declarative macros available at the root level of your crate.
