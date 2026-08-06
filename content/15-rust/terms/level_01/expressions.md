# Expressions

> **Level 1 — Foundations**
> Code that evaluates to a value (e.g., `5 + 5`, calling a function, `if` blocks without a trailing `;`).

---

## 1. Prerequisites


- [Statements](statements.md) — Understanding the difference between doing an action (Statements) and returning a value (Expressions).
- [Variable](variable.md) — Variables are assigned the values that expressions evaluate to.

---

## 2. Term Category

**Rust-specific (mostly)**: Rust is an **expression-oriented** language. While all languages have expressions (like `5 + 5`), Rust goes much further. Almost every construct in Rust (including `if` blocks, `match` blocks, and basic `{}` scope blocks) is an expression that can return a value. 

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

When you are programming, you constantly need to calculate and pass around data. Any piece of code that evaluates to a specific value is an **expression**. 

In older languages like C or Python, there is a strict divide. You have "expressions" for math (`5 + 5`), and "statements" for logic (`if`, `switch`, `for`). Because logic blocks are statements, they don't return values. If you want an `if` block to calculate a value, you have to create a temporary variable and assign to it.

Rust's designers realized that code is much cleaner and safer if almost *everything* evaluates to a value. By making `{}` blocks and `if` blocks into expressions, you can chain logic together seamlessly. The golden rule of Rust expressions is this: **If a block of code ends with an expression that lacks a semicolon, that value is implicitly returned from the block.**

### (2) Reality Metaphor

An expression is like **asking a question that requires an answer.**
- *"What is 5 + 5?"* -> Evaluates to `10`.
- *"What is the length of 'Hello'?"* -> Evaluates to `5`.
- *"If it is raining, return 'umbrella', otherwise return 'sunglasses'."* -> Evaluates to `'umbrella'`.

When the question is answered, you can immediately hand that answer (the value) to someone else (like a variable).

### (3) Rust Code Examples

#### Short Snippet
```rust
// `5 + 5` is an expression. It evaluates to 10.
let math_result = 5 + 5; 

// `String::from("Hello")` is an expression. It evaluates to a new String.
let greeting = String::from("Hello");
```

#### Fuller Example
```rust
fn main() {
    // A block of code `{ ... }` is an expression!
    let y = {
        let x = 3;
        
        // This is the final line of the block. 
        // Notice there is NO SEMICOLON at the end.
        // Therefore, this block evaluates to `4`, which gets assigned to `y`.
        x + 1 
    };
    
    println!("The value of y is: {}", y);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Accidentally adding a semicolon

**The mistake:** Putting a semicolon at the end of a line that you intended to return as a value.

**Why it's wrong:** Adding a semicolon (`;`) to the end of an expression turns it into a [Statement](../level_01/statements.md). Statements do not return values (they return `()`, the empty unit type). This is the most common compiler error for beginners trying to implicitly return a value from a function or block.

*Incorrect:*
```rust
fn get_score() -> i32 {
    100; // ERROR: expected `i32`, found `()`
}
```

*Fix:*
```rust
fn get_score() -> i32 {
    100 // SUCCESS: No semicolon, so this expression is returned!
}
```

---

### Mistake 2: Mutating Expressions State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Expressions through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Expressions Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Expressions instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Financial Payment Gateway Fee & Merchant Tier Evaluator

**Scenario:**
In a high-throughput financial payment engine (e.g., payment processing gateways like Stripe or Adyen), every incoming transaction must undergo dynamic processing fee evaluation and merchant tier assignment based on monthly transaction volume, international card surcharges, and fraud risk metrics. To prevent subtle bugs caused by intermediate mutable variables being modified out of order, the billing system relies on Rust's expression-oriented syntax. Block expressions, `if/else` expressions, and `match` expressions are composed to calculate state transformations immutably.

**Problem Statement:**
Implement a payment calculation engine function `compute_transaction_fee` that takes four parameters:
- `amount_cents: u64` (The transaction amount in micro-cents)
- `monthly_volume_cents: u64` (The merchant's total monthly processing volume)
- `is_international: bool` (Flag indicating cross-border transaction)
- `risk_score: u8` (Fraud score between 0 and 100)

Requirements:
1. If `risk_score > 90`, the function must evaluate immediately to `Err(FeeError::ExcessiveRiskScore(risk_score))`.
2. If `amount_cents == 0`, the function must evaluate to `Err(FeeError::InvalidAmount)`.
3. Use a block expression `{ ... }` to determine the `MerchantTier`:
   - `monthly_volume_cents >= 10_000_000` (≥ $100,000) -> `MerchantTier::Platinum`
   - `monthly_volume_cents >= 1_000_000` (≥ $10,000) -> `MerchantTier::Gold`
   - Otherwise -> `MerchantTier::Standard`
4. Use a `match` expression on `MerchantTier` to determine base fee in cents:
   - `Platinum` -> 10 cents ($0.10)
   - `Gold` -> 20 cents ($0.20)
   - `Standard` -> 30 cents ($0.30)
5. Use nested block and `if` expressions to compute basis points (bps, where 100 bps = 1%):
   - Tier base rates: `Platinum` = 150 bps (1.50%), `Gold` = 220 bps (2.20%), `Standard` = 290 bps (2.90%).
   - Add 100 bps if `is_international` is `true`.
6. Compute variable fee: `(amount_cents * total_bps) / 10_000`. Use checked arithmetic; evaluate to `Err(FeeError::FeeOverflow)` on multiplication or addition overflow.
7. Return `Ok(FeeResult { ... })`.

```rust
#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub enum MerchantTier {
    Standard,
    Gold,
    Platinum,
}

#[derive(Debug, PartialEq, Eq)]
pub struct FeeResult {
    pub base_fee_cents: u64,
    pub variable_fee_cents: u64,
    pub total_fee_cents: u64,
    pub merchant_tier: MerchantTier,
}

#[derive(Debug, PartialEq, Eq)]
pub enum FeeError {
    InvalidAmount,
    ExcessiveRiskScore(u8),
    FeeOverflow,
}

pub fn compute_transaction_fee(
    amount_cents: u64,
    monthly_volume_cents: u64,
    is_international: bool,
    risk_score: u8,
) -> Result<FeeResult, FeeError> {
    // TODO: Implement using block, if/else, and match expressions
    todo!()
}
```

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq, Clone, Copy)]
> pub enum MerchantTier {
>     Standard,
>     Gold,
>     Platinum,
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct FeeResult {
>     pub base_fee_cents: u64,
>     pub variable_fee_cents: u64,
>     pub total_fee_cents: u64,
>     pub merchant_tier: MerchantTier,
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum FeeError {
>     InvalidAmount,
>     ExcessiveRiskScore(u8),
>     FeeOverflow,
> }
> 
> pub fn compute_transaction_fee(
>     amount_cents: u64,
>     monthly_volume_cents: u64,
>     is_international: bool,
>     risk_score: u8,
> ) -> Result<FeeResult, FeeError> {
>     // Early return expression for risk score check
>     if risk_score > 90 {
>         return Err(FeeError::ExcessiveRiskScore(risk_score));
>     }
> 
>     // Early return expression for zero amount
>     if amount_cents == 0 {
>         return Err(FeeError::InvalidAmount);
>     }
> 
>     // Block expression evaluating to MerchantTier
>     let merchant_tier = {
>         if monthly_volume_cents >= 10_000_000 {
>             MerchantTier::Platinum
>         } else if monthly_volume_cents >= 1_000_000 {
>             MerchantTier::Gold
>         } else {
>             MerchantTier::Standard
>         }
>     };
> 
>     // Match expression evaluating to fixed base fee in cents
>     let base_fee_cents = match merchant_tier {
>         MerchantTier::Platinum => 10,
>         MerchantTier::Gold => 20,
>         MerchantTier::Standard => 30,
>     };
> 
>     // Block expression encapsulating rate calculation logic
>     let bps = {
>         let tier_bps = match merchant_tier {
>             MerchantTier::Platinum => 150,
>             MerchantTier::Gold => 220,
>             MerchantTier::Standard => 290,
>         };
>         let surcharge = if is_international { 100 } else { 0 };
>         
>         // Tail expression without semicolon returns u64
>         tier_bps + surcharge
>     };
> 
>     // Checked math expression handling potential arithmetic overflow
>     let variable_fee_cents = match amount_cents.checked_mul(bps) {
>         Some(prod) => prod / 10_000,
>         None => return Err(FeeError::FeeOverflow),
>     };
> 
>     let total_fee_cents = match base_fee_cents.checked_add(variable_fee_cents) {
>         Some(total) => total,
>         None => return Err(FeeError::FeeOverflow),
>     };
> 
>     // Function tail expression returning final FeeResult wrapped in Ok
>     Ok(FeeResult {
>         base_fee_cents,
>         variable_fee_cents,
>         total_fee_cents,
>         merchant_tier,
>     })
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_standard_tier_domestic_fee() {
>         let res = compute_transaction_fee(10_000, 500_000, false, 15);
>         assert!(res.is_ok());
>         let fee = res.unwrap();
>         assert_eq!(fee.merchant_tier, MerchantTier::Standard);
>         assert_eq!(fee.base_fee_cents, 30);
>         assert_eq!(fee.variable_fee_cents, 290); // 10000 * 290 / 10000 = 290
>         assert_eq!(fee.total_fee_cents, 320);
>         assert_ne!(fee.base_fee_cents, fee.variable_fee_cents);
>     }
> 
>     #[test]
>     fn test_platinum_tier_international_fee() {
>         let res = compute_transaction_fee(20_000, 15_000_000, true, 5);
>         assert!(res.is_ok());
>         let fee = res.unwrap();
>         assert_eq!(fee.merchant_tier, MerchantTier::Platinum);
>         assert_eq!(fee.base_fee_cents, 10);
>         // Platinum 150 + International 100 = 250 bps. 20000 * 250 / 10000 = 500 cents
>         assert_eq!(fee.variable_fee_cents, 500);
>         assert_eq!(fee.total_fee_cents, 510);
>     }
> 
>     #[test]
>     fn test_excessive_risk_score_error() {
>         let res = compute_transaction_fee(5_000, 2_000_000, false, 95);
>         assert!(res.is_err());
>         assert!(matches!(res, Err(FeeError::ExcessiveRiskScore(95))));
>     }
> 
>     #[test]
>     fn test_zero_amount_error() {
>         let res = compute_transaction_fee(0, 1_000_000, false, 10);
>         assert!(res.is_err());
>         assert!(matches!(res, Err(FeeError::InvalidAmount)));
>         assert_ne!(res, Ok(FeeResult {
>             base_fee_cents: 20,
>             variable_fee_cents: 0,
>             total_fee_cents: 20,
>             merchant_tier: MerchantTier::Gold,
>         }));
>     }
> 
>     #[test]
>     fn test_fee_overflow_error() {
>         let res = compute_transaction_fee(u64::MAX, 100_000, false, 10);
>         assert!(res.is_err());
>         assert!(matches!(res, Err(FeeError::FeeOverflow)));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Expression-Oriented Flow Control**:
>    In Rust, control structures like `if/else`, `match`, and scope blocks `{ ... }` are expressions that evaluate to values rather than imperative statements that produce side effects. In `compute_transaction_fee`, we bind variables directly to the results of these block expressions (e.g., `let merchant_tier = { ... };`). This guarantees immutability since `merchant_tier` is initialized exactly once without needing `let mut`.
> 
> 2. **Semicolon Control & Tail Expressions**:
>    In block expressions, the absence of a trailing semicolon on the final line designates that expression as the block's tail return value. For instance, in the `bps` calculation block, `tier_bps + surcharge` lacks a semicolon; therefore, the block evaluates directly to a `u64` value. If a semicolon were accidentally added (`tier_bps + surcharge;`), the block would evaluate to `()` (the unit type), triggering compiler type error `E0308`.
> 
> 3. **Type Equality Across Control Branches**:
>    Every arm of a `match` or `if/else` expression must evaluate to the exact same type. In the `MerchantTier` block expression, every `if`, `else if`, and `else` arm evaluates to `MerchantTier`. Similarly, in the `base_fee_cents` `match` expression, every arm returns a `u64` literal.
> 
> 4. **Early Exit vs. Block Value Yielding**:
>    The `if risk_score > 90` guard uses `return Err(...)` to exit the surrounding function early. Early `return` statements immediately interrupt block evaluation, while tail expressions (without `return`) simply yield their value to the enclosing scope block.
> 
> 5. **Overflow Invariants & Safe Math**:
>    Using `checked_mul` and `checked_add` inside `match` expressions ensures arithmetic overflow produces structured `FeeError::FeeOverflow` results rather than panicking in debug mode or wrapping silently in release mode.
> 
>
> 
---

### Exercise 2: Zero-Copy Binary Network Packet Decoder

**Scenario:**
In high-performance telemetry infrastructure (such as network packet analyzers or custom IoT UDP protocols), packet parsing must operate with zero dynamic heap allocation and sub-nanosecond processing speed. In Rust, expression blocks allow decoding bitfields, validating magic headers, checking version compatibility, and computing bitwise checksums within localized scopes without scattering mutable decoder state across the stack.

**Problem Statement:**
Implement a fixed-size network packet header decoder `parse_header` that processes an 8-byte array slice `&[u8; 8]` and yields `Result<PacketHeader, ParseError>`.

Header Binary Layout:
- Byte 0: Magic byte (Must equal `0xAA`).
- Byte 1: Protocol version (Must be `1` or `2`).
- Bytes 2..4: Payload length (`u16` in Big-Endian). Must not exceed 4096 bytes.
- Bytes 4..6: Flags bitmask (`u16` in Big-Endian).
  - Bit 0 (`0x0001`): `is_encrypted`
  - Bit 1 (`0x0002`): `is_compressed`
  - Bit 2 (`0x0004`): `is_high_priority`
- Bytes 6..8: Header Checksum (`u16` in Big-Endian). Must equal the bitwise XOR sum of `words[0] ^ words[1] ^ words[2]` (where words are 16-bit big-endian values constructed from bytes `0..2`, `2..4`, and `4..6`).

Requirements:
- Structure all validation checks, bitwise unpackings, and checksum computations using Rust expression blocks `{ ... }`, `match` expressions, and tail expressions.
- Avoid using imperative `mut` variable declarations for decoded field targets.

```rust
#[derive(Debug, PartialEq, Eq)]
pub struct PacketHeader {
    pub version: u8,
    pub payload_length: u16,
    pub is_encrypted: bool,
    pub is_compressed: bool,
    pub is_high_priority: bool,
    pub checksum: u16,
}

#[derive(Debug, PartialEq, Eq)]
pub enum ParseError {
    InvalidMagic(u8),
    UnsupportedVersion(u8),
    PayloadTooLarge(u16),
    ChecksumMismatch { expected: u16, actual: u16 },
}

pub fn parse_header(packet: &[u8; 8]) -> Result<PacketHeader, ParseError> {
    // TODO: Implement expression-driven binary packet header parser
    todo!()
}
```

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq)]
> pub struct PacketHeader {
>     pub version: u8,
>     pub payload_length: u16,
>     pub is_encrypted: bool,
>     pub is_compressed: bool,
>     pub is_high_priority: bool,
>     pub checksum: u16,
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum ParseError {
>     InvalidMagic(u8),
>     UnsupportedVersion(u8),
>     PayloadTooLarge(u16),
>     ChecksumMismatch { expected: u16, actual: u16 },
> }
> 
> pub fn parse_header(packet: &[u8; 8]) -> Result<PacketHeader, ParseError> {
>     // 1. Magic byte verification expression
>     if packet[0] != 0xAA {
>         return Err(ParseError::InvalidMagic(packet[0]));
>     }
> 
>     // 2. Version validation match expression
>     let version = match packet[1] {
>         1 | 2 => packet[1],
>         v => return Err(ParseError::UnsupportedVersion(v)),
>     };
> 
>     // 3. Payload length block expression
>     let payload_length = {
>         let len = u16::from_be_bytes([packet[2], packet[3]]);
>         if len > 4096 {
>             return Err(ParseError::PayloadTooLarge(len));
>         }
>         len // Tail expression yielding u16
>     };
> 
>     // 4. Bitmask decoding tuple expression
>     let flags_raw = u16::from_be_bytes([packet[4], packet[5]]);
>     let (is_encrypted, is_compressed, is_high_priority) = (
>         (flags_raw & 0x0001) != 0,
>         (flags_raw & 0x0002) != 0,
>         (flags_raw & 0x0004) != 0,
>     );
> 
>     // 5. Checksum verification block expression
>     let expected_checksum = u16::from_be_bytes([packet[6], packet[7]]);
>     let actual_checksum = {
>         let w0 = u16::from_be_bytes([packet[0], packet[1]]);
>         let w1 = u16::from_be_bytes([packet[2], packet[3]]);
>         let w2 = u16::from_be_bytes([packet[4], packet[5]]);
>         w0 ^ w1 ^ w2 // Tail expression yielding calculated XOR checksum
>     };
> 
>     if actual_checksum != expected_checksum {
>         return Err(ParseError::ChecksumMismatch {
>             expected: expected_checksum,
>             actual: actual_checksum,
>         });
>     }
> 
>     // Function tail expression returning parsed header
>     Ok(PacketHeader {
>         version,
>         payload_length,
>         is_encrypted,
>         is_compressed,
>         is_high_priority,
>         checksum: expected_checksum,
>     })
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_valid_packet_parsing() {
>         // Magic: 0xAA, Ver: 0x01, Len: 512 (0x0200), Flags: Encrypted | Priority (0x0005)
>         let w0 = u16::from_be_bytes([0xAA, 0x01]);
>         let w1 = 512u16;
>         let w2 = 0x0005u16;
>         let chk = w0 ^ w1 ^ w2;
> 
>         let packet: [u8; 8] = [
>             0xAA, 0x01,
>             0x02, 0x00,
>             0x00, 0x05,
>             (chk >> 8) as u8, (chk & 0xFF) as u8,
>         ];
> 
>         let res = parse_header(&packet);
>         assert!(res.is_ok());
>         let header = res.unwrap();
>         assert_eq!(header.version, 1);
>         assert_eq!(header.payload_length, 512);
>         assert!(header.is_encrypted);
>         assert!(!header.is_compressed);
>         assert!(header.is_high_priority);
>         assert_eq!(header.checksum, chk);
>     }
> 
>     #[test]
>     fn test_invalid_magic_error() {
>         let packet: [u8; 8] = [0xFF, 0x01, 0x00, 0x10, 0x00, 0x00, 0x00, 0x00];
>         let res = parse_header(&packet);
>         assert!(res.is_err());
>         assert!(matches!(res, Err(ParseError::InvalidMagic(0xFF))));
>         assert_ne!(packet[0], 0xAA);
>     }
> 
>     #[test]
>     fn test_unsupported_version_error() {
>         let packet: [u8; 8] = [0xAA, 0x05, 0x00, 0x10, 0x00, 0x00, 0x00, 0x00];
>         let res = parse_header(&packet);
>         assert!(res.is_err());
>         assert!(matches!(res, Err(ParseError::UnsupportedVersion(5))));
>     }
> 
>     #[test]
>     fn test_payload_too_large_error() {
>         let packet: [u8; 8] = [0xAA, 0x01, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00]; // len = 4097
>         let res = parse_header(&packet);
>         assert!(res.is_err());
>         assert!(matches!(res, Err(ParseError::PayloadTooLarge(4097))));
>     }
> 
>     #[test]
>     fn test_checksum_mismatch_error() {
>         let packet: [u8; 8] = [0xAA, 0x01, 0x00, 0x64, 0x00, 0x00, 0x99, 0x99];
>         let res = parse_header(&packet);
>         assert!(res.is_err());
>         assert!(matches!(res, Err(ParseError::ChecksumMismatch { .. })));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Zero-Mutation Data Pipeline via Expression Scoping**:
>    Traditional binary parsers declared mutable local variables and modified them step-by-step (`let mut version = 0; if ... version = x;`). In contrast, Rust expressions let us declare immutable bindings directly assigned from scoped block expressions (`let version = match packet[1] { ... };`). This guarantees that after assignment, header fields cannot be corrupted by subsequent parsing steps.
> 
> 2. **Pattern Matching Expressions with Guards & Early Exit**:
>    The protocol version extraction uses a `match` expression:
>    ```rust
>    let version = match packet[1] {
>        1 | 2 => packet[1],
>        v => return Err(ParseError::UnsupportedVersion(v)),
>    };
>    ```
>    If `packet[1]` matches `1` or `2`, the match expression evaluates to `packet[1]` and assigns it to `version`. If it matches any other byte `v`, the `return Err(...)` expression executes immediately, interrupting execution.
> 
> 3. **Block Expression Scoping for Intermediate Calculations**:
>    The header checksum verification calculates `actual_checksum` inside an isolated block expression `{ ... }`. All temporary intermediate variables (`w0`, `w1`, `w2`) created during bit-shifting exist strictly within the block's stack frame and are dropped instantly when the block evaluates to `w0 ^ w1 ^ w2`. This keeps the outer function scope clean and prevents variable name leakage.
> 
> 4. **Bitwise Extraction Expressions**:
>    The boolean flags are constructed via a single tuple expression evaluating three boolean expressions simultaneously:
>    ```rust
>    let (is_encrypted, is_compressed, is_high_priority) = (
>        (flags & 0x0001) != 0,
>        (flags & 0x0002) != 0,
>        (flags & 0x0004) != 0,
>    );
>    ```
> 
> 5. **Memory Safety & Lifetime Invariants**:
>    Passing `packet: &[u8; 8]` borrows an 8-byte array by shared immutable reference. Because all decoding is expression-driven and produces stack-allocated scalar primitives (`u8`, `u16`, `bool`), no references are held, no lifetime annotations are required, and zero heap allocations occur.
> 
>
> 
---

### Exercise 3: Recursive AST Expression Evaluator with Contextual Symbol Lookup

**Scenario:**
In database query engines, custom scripting environments, or business rule evaluation microservices, Abstract Syntax Tree (AST) nodes represent mathematical and conditional expressions. Evaluating AST nodes recursively requires zero side-effects and strict evaluation order. In Rust, expression-based recursive pattern matching evaluates entire AST branches directly into outcome values without temporary state mutation or explicit return statements.

**Problem Statement:**
Implement a recursive AST evaluation engine function `eval_expr` that evaluates an `Expr` tree against a variable table `Context` and produces `Result<i64, EvalError>`.

AST Data Structures:
```rust
use std::collections::HashMap;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Expr {
    Literal(i64),
    Variable(String),
    Add(Box<Expr>, Box<Expr>),
    Multiply(Box<Expr>, Box<Expr>),
    IfElse {
        condition: Box<Expr>,
        then_branch: Box<Expr>,
        else_branch: Box<Expr>,
    },
}

#[derive(Debug, Default)]
pub struct Context {
    pub variables: HashMap<String, i64>,
}

#[derive(Debug, PartialEq, Eq)]
pub enum EvalError {
    UndefinedVariable(String),
    Overflow,
}

pub fn eval_expr(expr: &Expr, ctx: &Context) -> Result<i64, EvalError> {
    // TODO: Implement recursive AST expression evaluator
    todo!()
}
```

Requirements:
1. `Literal(n)` evaluates directly to `Ok(n)`.
2. `Variable(name)` looks up `name` in `ctx.variables`. If missing, evaluate to `Err(EvalError::UndefinedVariable(name))`.
3. `Add(left, right)` evaluates both operands recursively. If addition overflows (using `checked_add`), evaluate to `Err(EvalError::Overflow)`.
4. `Multiply(left, right)` evaluates both operands recursively. If multiplication overflows (using `checked_mul`), evaluate to `Err(EvalError::Overflow)`.
5. `IfElse` evaluates `condition` first. If condition evaluates to a non-zero value, evaluate and return `then_branch`. Otherwise, evaluate and return `else_branch`. (Notice: short-circuit execution!).
6. Write the entire `eval_expr` body as a single top-level `match` expression whose tail returns `Result<i64, EvalError>`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::HashMap;
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub enum Expr {
>     Literal(i64),
>     Variable(String),
>     Add(Box<Expr>, Box<Expr>),
>     Multiply(Box<Expr>, Box<Expr>),
>     IfElse {
>         condition: Box<Expr>,
>         then_branch: Box<Expr>,
>         else_branch: Box<Expr>,
>     },
> }
> 
> #[derive(Debug, Default)]
> pub struct Context {
>     pub variables: HashMap<String, i64>,
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum EvalError {
>     UndefinedVariable(String),
>     Overflow,
> }
> 
> pub fn eval_expr(expr: &Expr, ctx: &Context) -> Result<i64, EvalError> {
>     // Single match expression serving as the function body
>     match expr {
>         Expr::Literal(val) => Ok(*val),
>         
>         Expr::Variable(name) => ctx
>             .variables
>             .get(name)
>             .copied()
>             .ok_or_else(|| EvalError::UndefinedVariable(name.clone())),
>             
>         Expr::Add(left, right) => {
>             let lhs = eval_expr(left, ctx)?;
>             let rhs = eval_expr(right, ctx)?;
>             lhs.checked_add(rhs).ok_or(EvalError::Overflow)
>         }
>         
>         Expr::Multiply(left, right) => {
>             let lhs = eval_expr(left, ctx)?;
>             let rhs = eval_expr(right, ctx)?;
>             lhs.checked_mul(rhs).ok_or(EvalError::Overflow)
>         }
>         
>         Expr::IfElse {
>             condition,
>             then_branch,
>             else_branch,
>         } => {
>             let cond_val = eval_expr(condition, ctx)?;
>             // Expression-driven conditional evaluation
>             if cond_val != 0 {
>                 eval_expr(then_branch, ctx)
>             } else {
>                 eval_expr(else_branch, ctx)
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
>     fn test_literal_and_variable_eval() {
>         let mut ctx = Context::default();
>         ctx.variables.insert("x".to_string(), 42);
> 
>         let lit = Expr::Literal(10);
>         let var = Expr::Variable("x".to_string());
> 
>         assert_eq!(eval_expr(&lit, &ctx), Ok(10));
>         assert_eq!(eval_expr(&var, &ctx), Ok(42));
>         assert_ne!(eval_expr(&lit, &ctx), eval_expr(&var, &ctx));
>     }
> 
>     #[test]
>     fn test_arithmetic_expressions() {
>         let mut ctx = Context::default();
>         ctx.variables.insert("a".to_string(), 5);
>         ctx.variables.insert("b".to_string(), 6);
> 
>         // Expression: (a + 10) * b -> (5 + 10) * 6 = 90
>         let ast = Expr::Multiply(
>             Box::new(Expr::Add(
>                 Box::new(Expr::Variable("a".to_string())),
>                 Box::new(Expr::Literal(10)),
>             )),
>             Box::new(Expr::Variable("b".to_string())),
>         );
> 
>         let res = eval_expr(&ast, &ctx);
>         assert!(res.is_ok());
>         assert_eq!(res.unwrap(), 90);
>     }
> 
>     #[test]
>     fn test_if_else_branch_expression() {
>         let mut ctx = Context::default();
>         ctx.variables.insert("flag".to_string(), 1);
> 
>         // Expression: if flag { 100 } else { 200 }
>         let ast = Expr::IfElse {
>             condition: Box::new(Expr::Variable("flag".to_string())),
>             then_branch: Box::new(Expr::Literal(100)),
>             else_branch: Box::new(Expr::Literal(200)),
>         };
> 
>         assert_eq!(eval_expr(&ast, &ctx), Ok(100));
> 
>         // Change flag to 0
>         ctx.variables.insert("flag".to_string(), 0);
>         assert_eq!(eval_expr(&ast, &ctx), Ok(200));
>     }
> 
>     #[test]
>     fn test_undefined_variable_error() {
>         let ctx = Context::default();
>         let ast = Expr::Variable("missing".to_string());
>         let res = eval_expr(&ast, &ctx);
> 
>         assert!(res.is_err());
>         assert!(matches!(res, Err(EvalError::UndefinedVariable(ref name)) if name == "missing"));
>     }
> 
>     #[test]
>     fn test_arithmetic_overflow_error() {
>         let ctx = Context::default();
>         let ast = Expr::Add(
>             Box::new(Expr::Literal(i64::MAX)),
>             Box::new(Expr::Literal(1)),
>         );
> 
>         let res = eval_expr(&ast, &ctx);
>         assert!(res.is_err());
>         assert!(matches!(res, Err(EvalError::Overflow)));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Pure Expression Recurrence**:
>    Because Rust's `match` is an expression, the function body of `eval_expr` consists of a single `match expr { ... }` construct. Each match arm evaluates directly to `Result<i64, EvalError>`. No intermediate mutable state or explicit `return` keywords are required.
> 
> 2. **Short-Circuiting in Conditional Expressions**:
>    In the `Expr::IfElse` arm, evaluation of branches is deferred until the condition expression evaluates:
>    ```rust
>    let cond_val = eval_expr(condition, ctx)?;
>    if cond_val != 0 {
>        eval_expr(then_branch, ctx)
>    } else {
>        eval_expr(else_branch, ctx)
>    }
>    ```
>    Because `if/else` is an expression, the chosen branch is evaluated directly and its `Result` is yielded as the arm's tail value. If `cond_val != 0`, `else_branch` is never evaluated, preserving expression short-circuit guarantees.
> 
> 3. **The `?` Operator as an Expression Propagator**:
>    The `?` operator unwraps `Ok(v)` values or returns early with `Err(...)`. Under the hood, `eval_expr(left, ctx)?` is an expression that yields `i64` if successful, enabling clean composition with `checked_add` and `checked_mul`.
> 
> 4. **Ownership and Recursive Borrowing**:
>    `eval_expr` receives `expr: &Expr` and `ctx: &Context` by shared immutable reference. Recursive calls pass references down the tree without taking ownership (`Box<Expr>` dereferences to `Expr` behind references). This permits evaluating the same AST multiple times across different threads or contexts without cloning the AST node allocations.
> 
>
> 
---

## 6. Related Terms


- [Statements](statements.md) — The exact opposite. Statements perform actions, do not return values, and usually end with semicolons.
- [`if` / `else`](../level_02/if_else.md) — A prime example of how Rust turns traditional statements into powerful expressions that return values.
- [`dbg!` Macro](dbg_macro.md) — Related concept: `dbg!` Macro.
- [`loop`](../level_02/loop.md) — Related concept: `loop`.
- [Expressions vs. Statements](expression_vs_statement.md) — Related concept: Expressions vs. Statements.
- [Functions (`fn`)](function.md) — Related concept: Functions (`fn`).

---

## 7. Key Takeaways

- Expressions evaluate to a value.
- They **do not** end with a semicolon.
- Math (`5 + 5`), function calls, and even `{ ... }` blocks are expressions.
- The golden rule: If the last line of a block lacks a semicolon, that block implicitly returns that value.
- Adding a semicolon to an expression turns it into a Statement, completely throwing away its value.
