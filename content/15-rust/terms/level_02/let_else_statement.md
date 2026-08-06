# `let else` Statement

> **Level 2 — Control Flow & Data Structures**
> `let Pattern = expr else { diverge };` — binds on a successful match, or runs a diverging block otherwise.

---

## 1. Prerequisites


- [`if let` / `while let`](if_let_while_let.md) — The pattern-matching sugar `let else` complements.
- [Pattern Matching](pattern_matching.md) — The underlying mechanism.
- [Never Type (`!`)](../level_11/never_type.md) — The type of the diverging `else` block.

---

## 2. Term Category

**Control-Flow Sugar (the flattening idiom)**: `let else` is the modern, idiomatic answer to "unwrap this pattern, or bail out of the function right now." It exists specifically to eliminate the extra nesting level that `if let ... else { return }` forces onto the rest of your function.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Before `let else` (stabilized in Rust 1.65), extracting a value from an `Option`/`Result`/enum and bailing early on failure required an `if let` with the "happy path" indented one level deeper:

```rust
let value = if let Some(v) = maybe_value {
    v
} else {
    return; // or `continue`, `break`, `panic!`
};
```

This is awkward: the *success* case, which is usually the interesting logic, ends up wrapped in an `if let { ... } else { ... }` block just to extract one value. As functions grow and chain several of these, the code creeps rightward with nesting that has nothing to do with actual branching logic. `let else` inverts the emphasis: the pattern goes on the left of a normal `let`, and only the *failure* path gets an explicit block, which must diverge (`return`, `break`, `continue`, or `panic!`) since there's no other way to produce a value for `value` on that branch.

### (2) Reality Metaphor

Imagine airport security screening: you walk through, and either you get a green light and keep walking straight ahead, or a red light stops you and diverts you to a separate room entirely.

- **`if let ... else { ... }`**: The entire rest of your day's itinerary is written *inside* the "green light" room, indented one level in, because technically it was a branch. Every subsequent event nests one level deeper.
- **`let else`**: You just keep walking normally down the main hallway after the checkpoint (**no extra nesting**). The red-light room is a clearly separate side-room you're diverted to only on failure — and once you're in it, you *must* exit the building entirely (`return`/`panic!`/`continue`/`break`), never wander back into the main hallway.

### (3) Rust Code Examples

#### Short Snippet (Before and After)
```rust
fn describe(input: Option<i32>) -> String {
    // BEFORE: if let / else, with an extra nesting level.
    let value = if let Some(v) = input {
        v
    } else {
        return "no value".to_string();
    };
    format!("value is {value}")
}

fn describe_v2(input: Option<i32>) -> String {
    // AFTER: let else. Same logic, zero extra nesting for the happy path.
    let Some(value) = input else {
        return "no value".to_string();
    };
    format!("value is {value}")
}
```

#### Fuller Example (Chaining Several Extractions Flat)
```rust
fn process(raw: &str) -> Result<i32, String> {
    let Some((key, value)) = raw.split_once('=') else {
        return Err(format!("'{raw}' is missing '='"));
    };

    let Ok(number) = value.trim().parse::<i32>() else {
        return Err(format!("'{value}' is not a valid number"));
    };

    if key.trim().is_empty() {
        return Err("key cannot be empty".to_string());
    }

    Ok(number * 2) // The "happy path" stays flat, no matter how many extractions precede it.
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Let Else Statement Scoping and Lifecycle Rules

**The mistake:** Assuming Let Else Statement instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("let_else_statement_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("let_else_statement_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Let Else Statement State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Let Else Statement through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Let Else Statement Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Let Else Statement instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: API Gateway Authorization Header & Tenant Token Extractor

**Scenario:** In an enterprise microservices architecture, an API Gateway receives HTTP requests containing an `Authorization` header. To minimize latency, authentication tokens are validated in an edge middleware function before routing. The header follows the format `"Bearer <tenant_id>:<user_id>:<token_hash>"`.

**Problem:** Implement `parse_auth_header(header: Option<&str>) -> Result<SessionContext, AuthError>` using `let else` statements to extract and validate credentials cleanly.
1. If `header` is `None`, bail early returning `Err(AuthError::MissingHeader)`.
2. Extract the scheme and credential payload from `header`. If the space separator is missing, return `Err(AuthError::InvalidFormat)`.
3. Validate that the authentication scheme is `"Bearer"` (case-insensitive) using `let else` with a boolean pattern match (`let true = ... else { ... }`). Return `Err(AuthError::UnsupportedScheme)` on mismatch.
4. Split credentials into `tenant_id` (`u32`), `user_id` (`u32`), and `token_hash` (`u64`). Parse each numeric field using `let Ok(...) = ... else { ... }` and return specific error variants (`InvalidTenantId`, `InvalidUserId`, `InvalidTokenHash`).
5. Return `Ok(SessionContext)` on success without using nested `if let` blocks or intermediate helper closures.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq)]
> pub struct SessionContext {
>     pub tenant_id: u32,
>     pub user_id: u32,
>     pub token_hash: u64,
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum AuthError {
>     MissingHeader,
>     InvalidFormat,
>     UnsupportedScheme,
>     InvalidTenantId,
>     InvalidUserId,
>     InvalidTokenHash,
> }
> 
> pub fn parse_auth_header(header: Option<&str>) -> Result<SessionContext, AuthError> {
>     // 1. Guard against missing header
>     let Some(raw_header) = header else {
>         return Err(AuthError::MissingHeader);
>     };
> 
>     // 2. Extract authorization scheme and credentials string
>     let Some((scheme, credentials)) = raw_header.split_once(' ') else {
>         return Err(AuthError::InvalidFormat);
>     };
> 
>     // 3. Verify scheme is case-insensitively equal to "Bearer"
>     let true = scheme.eq_ignore_ascii_case("Bearer") else {
>         return Err(AuthError::UnsupportedScheme);
>     };
> 
>     // 4. Extract colon-delimited components from credentials
>     let Some((tenant_str, rest)) = credentials.split_once(':') else {
>         return Err(AuthError::InvalidFormat);
>     };
> 
>     let Some((user_str, hash_str)) = rest.split_once(':') else {
>         return Err(AuthError::InvalidFormat);
>     };
> 
>     // 5. Parse integer components safely into target types
>     let Ok(tenant_id) = tenant_str.parse::<u32>() else {
>         return Err(AuthError::InvalidTenantId);
>     };
> 
>     let Ok(user_id) = user_str.parse::<u32>() else {
>         return Err(AuthError::InvalidUserId);
>     };
> 
>     let Ok(token_hash) = hash_str.parse::<u64>() else {
>         return Err(AuthError::InvalidTokenHash);
>     };
> 
>     Ok(SessionContext {
>         tenant_id,
>         user_id,
>         token_hash,
>     })
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_valid_auth_header() {
>         let header = Some("Bearer 100:4002:9876543210");
>         let ctx = parse_auth_header(header);
>         assert!(ctx.is_ok());
>         let ctx = ctx.unwrap();
>         assert_eq!(ctx.tenant_id, 100);
>         assert_eq!(ctx.user_id, 4002);
>         assert_eq!(ctx.token_hash, 9876543210);
>     }
> 
>     #[test]
>     fn test_missing_header() {
>         let result = parse_auth_header(None);
>         assert_eq!(result, Err(AuthError::MissingHeader));
>     }
> 
>     #[test]
>     fn test_invalid_scheme() {
>         let result = parse_auth_header(Some("Basic 100:4002:9876543210"));
>         assert_eq!(result, Err(AuthError::UnsupportedScheme));
>         assert_ne!(result, Ok(SessionContext { tenant_id: 100, user_id: 4002, token_hash: 9876543210 }));
>     }
> 
>     #[test]
>     fn test_malformed_credentials() {
>         let result = parse_auth_header(Some("Bearer invalid_credentials"));
>         assert!(matches!(result, Err(AuthError::InvalidFormat)));
>     }
> 
>     #[test]
>     fn test_non_numeric_fields() {
>         let result = parse_auth_header(Some("Bearer abc:4002:9876543210"));
>         assert_eq!(result, Err(AuthError::InvalidTenantId));
> 
>         let result = parse_auth_header(Some("Bearer 100:xyz:9876543210"));
>         assert_eq!(result, Err(AuthError::InvalidUserId));
> 
>         let result = parse_auth_header(Some("Bearer 100:4002:invalid_hash"));
>         assert_eq!(result, Err(AuthError::InvalidTokenHash));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
> 
> 
> 1. **Flattening Sequential Extractions:**
>    Traditional `if let` parsing requires nesting each extraction step inside block braces (`if let Some(...) = ... { if let Ok(...) = ... { ... } }`). By utilizing `let else`, each validation stage acts as a guard clause: if the pattern matches, execution proceeds sequentially in the primary lexical scope without additional indentation.
> 
> 2. **Refutable Boolean Matching:**
>    `let true = scheme.eq_ignore_ascii_case("Bearer") else { ... }` treats `true` as a refutable pattern against a `bool` expression. If the expression evaluates to `false`, the pattern fails to match, causing execution to divert immediately into the diverging `else` block.
> 
> 3. **Ownership and Lifetime Bounds:**
>    The input parameter `header` is an `Option<&'a str>`. `str::split_once` yields sub-slice references `&'a str` tied to the lifetime of the input buffer without triggering heap allocations. When parsing integers (`u32`, `u64`), owned numeric primitives are produced, terminating borrowing requirements before `SessionContext` is returned.
> 
> 4. **Divergence Constraint (`!` Type):**
>    Each `else` block in `let else` contains an explicit `return Err(...)` expression. Because `return` diverges with type `!`, it satisfies Rust's type-checker requirements when pattern matching fails.
> 
---

### Exercise 2: Binary Telemetry Protocol Frame Decoder

**Scenario:** An IoT ingestion pipeline processes high-frequency network packets sent by remote sensor nodes. The stream multiplexes control messages and telemetry payloads over raw binary slices.

**Problem:** Implement `decode_telemetry_frame(header: &FrameHeader, payload: &[u8]) -> Result<TelemetryPacket, DecodeError>` to decode payload metrics safely using `let else` bindings.
1. Use `let else` to match `FrameHeader::Telemetry { channel_id, payload_len }`. Non-telemetry frames (`Heartbeat`, `Shutdown`) must exit immediately returning `Err(DecodeError::NotTelemetryFrame)`.
2. Extract the timestamp (8-byte big-endian `u64`) and metric value (8-byte big-endian IEEE 754 `f64`) from `payload` using `payload.get(..8)` and `payload.get(8..16)` with `let Some(...) = ... else { ... }`. Return `Err(DecodeError::BufferTooShort)` if payload length is insufficient.
3. Reject IEEE 754 `NaN` floating point values using `let false = metric_value.is_nan() else { ... }`, returning `Err(DecodeError::InvalidMetricValue)`.
4. Return `Ok(TelemetryPacket)` containing decoded field values.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq)]
> pub enum FrameHeader {
>     Telemetry { channel_id: u16, payload_len: u16 },
>     Heartbeat,
>     Shutdown,
> }
> 
> #[derive(Debug, PartialEq)]
> pub struct TelemetryPacket {
>     pub channel_id: u16,
>     pub timestamp_ms: u64,
>     pub metric_value: f64,
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum DecodeError {
>     NotTelemetryFrame,
>     BufferTooShort,
>     InvalidMetricValue,
> }
> 
> pub fn decode_telemetry_frame(
>     header: &FrameHeader,
>     payload: &[u8],
> ) -> Result<TelemetryPacket, DecodeError> {
>     // 1. Guard for correct frame variant and extract channel_id
>     let FrameHeader::Telemetry { channel_id, .. } = header else {
>         return Err(DecodeError::NotTelemetryFrame);
>     };
> 
>     // 2. Safely extract slice windows for timestamp and metric payload
>     let Some(ts_bytes) = payload.get(..8) else {
>         return Err(DecodeError::BufferTooShort);
>     };
> 
>     let Some(val_bytes) = payload.get(8..16) else {
>         return Err(DecodeError::BufferTooShort);
>     };
> 
>     // 3. Convert big-endian byte slices into native numeric primitives
>     let timestamp_ms = u64::from_be_bytes(ts_bytes.try_into().unwrap());
>     let metric_bits = u64::from_be_bytes(val_bytes.try_into().unwrap());
>     let metric_value = f64::from_bits(metric_bits);
> 
>     // 4. Validate float integrity against NaN values
>     let false = metric_value.is_nan() else {
>         return Err(DecodeError::InvalidMetricValue);
>     };
> 
>     Ok(TelemetryPacket {
>         channel_id: *channel_id,
>         timestamp_ms,
>         metric_value,
>     })
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_successful_frame_decode() {
>         let header = FrameHeader::Telemetry { channel_id: 42, payload_len: 16 };
>         let ts: u64 = 1700000000;
>         let val: f64 = 36.6;
>         let mut payload = Vec::new();
>         payload.extend_from_slice(&ts.to_be_bytes());
>         payload.extend_from_slice(&val.to_bits().to_be_bytes());
> 
>         let res = decode_telemetry_frame(&header, &payload);
>         assert!(res.is_ok());
>         let packet = res.unwrap();
>         assert_eq!(packet.channel_id, 42);
>         assert_eq!(packet.timestamp_ms, 1700000000);
>         assert_eq!(packet.metric_value, 36.6);
>     }
> 
>     #[test]
>     fn test_non_telemetry_frame() {
>         let header = FrameHeader::Heartbeat;
>         let res = decode_telemetry_frame(&header, &[]);
>         assert_eq!(res, Err(DecodeError::NotTelemetryFrame));
>         assert_ne!(res, Err(DecodeError::BufferTooShort));
>     }
> 
>     #[test]
>     fn test_buffer_too_short() {
>         let header = FrameHeader::Telemetry { channel_id: 1, payload_len: 8 };
>         let payload = vec![0u8; 10]; // Requires 16 bytes
>         let res = decode_telemetry_frame(&header, &payload);
>         assert!(matches!(res, Err(DecodeError::BufferTooShort)));
>     }
> 
>     #[test]
>     fn test_nan_metric_rejected() {
>         let header = FrameHeader::Telemetry { channel_id: 1, payload_len: 16 };
>         let ts: u64 = 100;
>         let val: f64 = f64::NAN;
>         let mut payload = Vec::new();
>         payload.extend_from_slice(&ts.to_be_bytes());
>         payload.extend_from_slice(&val.to_bits().to_be_bytes());
> 
>         let res = decode_telemetry_frame(&header, &payload);
>         assert_eq!(res, Err(DecodeError::InvalidMetricValue));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
> 
> 
> 1. **Refutable Destructuring of Enums with Shared References:**
>    When destructuring `header: &FrameHeader` via `let FrameHeader::Telemetry { channel_id, .. } = header else`, Rust automatically applies Match Default Binding Modes. `channel_id` is bound as a shared reference `&u16`. Deriving `Copy` on primitives allows dereferencing `*channel_id` into an owned `u16` without moving out of the borrowed `header`.
> 
> 2. **Slice Boundary Safeguards:**
>    Calling `payload.get(..8)` returns an `Option<&[u8]>`. Pattern matching `let Some(ts_bytes) = payload.get(..8) else { ... }` prevents runtime out-of-bounds panics, converting slice indexing checks into explicit error variants at zero runtime allocation cost.
> 
> 3. **Validation of Bit-Level Floating Point Data:**
>    IEEE 754 floating point numbers permit invalid `NaN` bit patterns. Matching `let false = metric_value.is_nan() else` ensures arithmetic validity before passing the metric downstream to analytical engines.
> 
> 4. **Scope Isolation:**
>    Variables bound in `let PATTERN = EXPR else` enter the scope *after* the `let` statement completes. Variables bound inside `PATTERN` are not accessible inside the `else` block, preserving clean scope boundaries and preventing accidental use of partially initialized data.
> 
---

### Exercise 3: Compiler AST Constant Folding Optimization Pass

**Scenario:** In an optimizing SQL query engine or custom compiler, Abstract Syntax Tree (AST) optimization passes traverse tree nodes to fold constant expressions at compile time.

**Problem:** Implement `fold_constant_addition(expr: &Expr) -> Option<Expr>` to inspect an expression node and fold binary additions of integer literals.
1. Use `let else` to match `Expr::Binary { op: BinOp::Add, left, right }`. If `expr` is not an addition node, return `None`.
2. Use `let else` to match `Expr::Literal(l_val)` from `left.as_ref()`. Return `None` if the left operand is not a literal.
3. Use `let else` to match `Expr::Literal(r_val)` from `right.as_ref()`. Return `None` if the right operand is not a literal.
4. Use `let else` with `checked_add` (`let Some(sum) = l_val.checked_add(*r_val) else { return None; };`) to guard against signed integer overflow.
5. Return `Some(Expr::Literal(sum))` on success.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub enum BinOp {
>     Add,
>     Sub,
>     Mul,
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub enum Expr {
>     Literal(i64),
>     Variable(String),
>     Binary {
>         op: BinOp,
>         left: Box<Expr>,
>         right: Box<Expr>,
>     },
> }
> 
> pub fn fold_constant_addition(expr: &Expr) -> Option<Expr> {
>     // 1. Match binary addition node specifically
>     let Expr::Binary { op: BinOp::Add, left, right } = expr else {
>         return None;
>     };
> 
>     // 2. Unpack left literal value without taking ownership
>     let Expr::Literal(l_val) = left.as_ref() else {
>         return None;
>     };
> 
>     // 3. Unpack right literal value without taking ownership
>     let Expr::Literal(r_val) = right.as_ref() else {
>         return None;
>     };
> 
>     // 4. Safely perform integer addition with overflow checking
>     let Some(sum) = l_val.checked_add(*r_val) else {
>         return None;
>     };
> 
>     Some(Expr::Literal(sum))
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_successful_addition_fold() {
>         let expr = Expr::Binary {
>             op: BinOp::Add,
>             left: Box::new(Expr::Literal(15)),
>             right: Box::new(Expr::Literal(27)),
>         };
> 
>         let folded = fold_constant_addition(&expr);
>         assert!(folded.is_some());
>         assert_eq!(folded, Some(Expr::Literal(42)));
>     }
> 
>     #[test]
>     fn test_non_add_op_ignored() {
>         let expr = Expr::Binary {
>             op: BinOp::Sub,
>             left: Box::new(Expr::Literal(10)),
>             right: Box::new(Expr::Literal(5)),
>         };
> 
>         let folded = fold_constant_addition(&expr);
>         assert!(folded.is_none());
>         assert_ne!(folded, Some(Expr::Literal(5)));
>     }
> 
>     #[test]
>     fn test_variable_operand_not_folded() {
>         let expr = Expr::Binary {
>             op: BinOp::Add,
>             left: Box::new(Expr::Variable("x".to_string())),
>             right: Box::new(Expr::Literal(10)),
>         };
> 
>         let folded = fold_constant_addition(&expr);
>         assert!(matches!(folded, None));
>     }
> 
>     #[test]
>     fn test_overflow_returns_none() {
>         let expr = Expr::Binary {
>             op: BinOp::Add,
>             left: Box::new(Expr::Literal(i64::MAX)),
>             right: Box::new(Expr::Literal(1)),
>         };
> 
>         let folded = fold_constant_addition(&expr);
>         assert_eq!(folded, None);
>     }
> }
> ```
>
> #### Technical Explanation
>
>
> 
> 
> 1. **Deep Pattern Matching on Heap-Allocated Recursive Trees:**
>    `Expr::Binary` holds `Box<Expr>` children. By matching `let Expr::Binary { op: BinOp::Add, left, right } = expr else`, Rust isolates references to the boxes (`left: &Box<Expr>`). Calling `.as_ref()` dereferences the `Box` into `&Expr` without heap deallocation or moving content out of the AST.
> 
> 2. **Borrowing vs. Moving Trait Bounds (`E0507` Prevention):**
>    Because `Expr::Variable(String)` does not implement `Copy`, attempting to move values out of `&Expr` via dereferencing `**left` would trigger compiler error `E0507` (cannot move out of shared reference). Using `left.as_ref()` allows pattern matching directly against `&Expr::Literal(l_val)`, yielding `l_val: &i64`.
> 
> 3. **Defensive Arithmetic for Compiler Invariants:**
>    Arithmetic in production Rust compilers must not panic on integer overflow during optimization passes. `checked_add` returns an `Option<i64>`. Applying `let Some(sum) = l_val.checked_add(*r_val) else` cleanly turns numerical overflow into an early return of `None`, preserving safety guarantees.
> 
> 4. **Syntactic Flattening:**
>    Without `let else`, inspecting deeply nested enum structures like AST nodes requires either complex nested `match` statements or chaining multi-clause `if let` blocks. `let else` provides a linear sequence of assertions that progressively refine compiler invariants.
> 
---

## 6. Related Terms


- [`if let` / `while let`](if_let_while_let.md) — The syntax `let else` is designed to flatten away in the "extract or bail" case.
- [Pattern Matching](pattern_matching.md) — The general matching machinery `let else` uses on its left-hand side.
- [Never Type (`!`)](../level_11/never_type.md) — The type-theoretic reason the `else` block is required to diverge.
- [`?` Operator](../level_04/question_mark_operator.md) — A related but narrower flattening tool, specific to `Option`/`Result` propagation; `let else` is more general, since its pattern isn't limited to `Some`/`Ok`.
- [`matches!` Macro](matches_macro.md) — Related concept: `matches!` Macro.

---

## 7. Key Takeaways

- `let PATTERN = expr else { diverge };` binds the pattern's contents on success, with **no added nesting** for the rest of the function.
- The `else` block is mandatory to diverge — `return`, `break`, `continue`, or `panic!` — since there's no value to bind otherwise.
- It works for *any* refutable pattern, not just `Option`/`Result` — unlike the narrower `?` operator.
- Introduced in Rust 1.65 as the idiomatic replacement for `if let ... else { return/continue/break }`.
