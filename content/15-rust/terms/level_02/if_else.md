# `if` / `else`

> **Level 2 — Control Flow & Data Structures**
> Conditional branching; `if` is an expression and can return values.

---

## 1. Prerequisites

- [Variable](../level_01/variable.md) — Understanding how to assign the result of an `if` expression to a variable.

---

## 2. Term Category

**Rust-specific**: While `if` statements exist in almost every programming language, Rust elevates them by making them **expressions** (meaning they can return a value directly), eliminating the need for the "ternary operator" (`condition ? a : b`) found in languages like C, Java, or JavaScript.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Every program needs to make decisions (conditional branching). If a user is an admin, show the admin panel; otherwise, show the standard dashboard. 

In older languages, `if` is purely a *statement*—an action that executes code. If you wanted to assign a value based on a condition, you had to either:
1. Create a mutable variable, then mutate it inside the `if` block (which is verbose and breaks immutability).
2. Use a completely different, specialized syntax called the ternary operator (`let status = is_admin ? "Admin" : "User";`).

Rust elegantly solves this by making `if` an **expression**. In Rust, blocks of code can evaluate to a final value. This means you can assign an entire `if / else` block directly to a variable. It keeps the language syntax simple (no need for ternary operators) while encouraging you to use safe, immutable variables (`let` instead of `mut`).

### (2) Reality Metaphor

An `if` statement is like **approaching a fork in a road**. You read the sign (the condition). If the sign says "Bridge Out," you take the `else` path.

Because Rust's `if` is an *expression*, it's also like a **vending machine**. You press a button based on a condition (e.g., "Do I want soda or water?"). The machine evaluates your choice and *returns an item directly into your hands* (the value assigned to your variable).

### (3) Rust Code Examples

#### Short Snippet (Standard usage)
```rust
let health = 45;

// Notice there are NO parentheses around the condition.
if health <= 0 {
    println!("Game Over!");
} else if health < 50 {
    println!("Warning: Low Health!");
} else {
    println!("Looking good.");
}
```

#### Fuller Example (Using `if` as an expression)
```rust
fn main() {
    let is_vip = true;
    
    // We are assigning the result of the entire `if` block to `entrance_fee`.
    // Because we don't put semicolons at the end of `0` and `50`, 
    // they are RETURNED from the block.
    let entrance_fee = if is_vip {
        0 
    } else {
        50
    };
    
    println!("Your fee is ${}", entrance_fee);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding If Else Scoping and Lifecycle Rules

**The mistake:** Assuming If Else instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("if_else_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("if_else_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Putting parentheses around the condition

**The mistake:** Writing `if (x > 5)` like you would in C, Java, or JavaScript.

**Why it's wrong:** Rust does not require (or want) parentheses around the boolean condition. If you include them, the compiler will actually give you a warning telling you to remove them, as they are considered unnecessary visual clutter.

*Incorrect:*
```rust
if (health == 100) { ... } // Compiler Warning!
```

*Fix:*
```rust
if health == 100 { ... }
```

---

### Mistake 3: Concurrent Access to If Else Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe If Else instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Financial Order Routing & Dynamic Surcharge Engine

**Scenario:**
You are building an execution gateway for a low-latency financial exchange. The service must validate incoming order requests and compute dynamic fee quotes based on account tier (`VIP`, `Standard`, `Guest`), account activity status (`Active`, `Suspended`), order transaction amount in cents, and real-time exchange load factor (`f64`).

**Requirements:**
1. Define the data structures:
   - `AccountTier`: `VIP`, `Standard`, `Guest`
   - `AccountStatus`: `Active`, `Suspended`
   - `TransactionQuote`: containing fields `base_fee_cents: u64`, `surcharge_cents: u64`, `total_fee_cents: u64`, `priority: &'static str`
   - `TransactionError`: `AccountSuspended`, `ExceedsLimit`, `InvalidAmount`
2. Implement `evaluate_transaction(tier: AccountTier, status: AccountStatus, amount_cents: u64, load_factor: f64) -> Result<TransactionQuote, TransactionError>` without using any `mut` variable bindings.
3. Use expression-based `if` / `else` logic to:
   - Reject suspended accounts (`AccountStatus::Suspended`) or zero amounts (`0`).
   - Calculate maximum single order transaction limits: `VIP` = $10,000 (1,000,000 cents), `Standard` = $1,000 (100,000 cents), `Guest` = $100 (10,000 cents). Return `Err(TransactionError::ExceedsLimit)` if exceeded.
   - Assign base fees: `VIP` = 10 cents, `Standard` = 50 cents, `Guest` = 200 cents.
   - Calculate load surcharges: if `load_factor > 0.8`, add 20% of `base_fee_cents`; if `load_factor > 0.5`, add 10%; otherwise 0 cents.
   - Assign execution priority: `VIP` receives `"HIGH"`; `Standard` receives `"NORMAL"` if `amount_cents >= 10_000` else `"LOW"`; `Guest` receives `"LOW"`.
4. Provide unit tests using `assert_eq!`, `assert!`, `assert_ne!`, and `matches!`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub enum AccountTier {
>     VIP,
>     Standard,
>     Guest,
> }
> 
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub enum AccountStatus {
>     Active,
>     Suspended,
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct TransactionQuote {
>     pub base_fee_cents: u64,
>     pub surcharge_cents: u64,
>     pub total_fee_cents: u64,
>     pub priority: &'static str,
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub enum TransactionError {
>     AccountSuspended,
>     ExceedsLimit,
>     InvalidAmount,
> }
> 
> pub fn evaluate_transaction(
>     tier: AccountTier,
>     status: AccountStatus,
>     amount_cents: u64,
>     load_factor: f64,
> ) -> Result<TransactionQuote, TransactionError> {
>     if matches!(status, AccountStatus::Suspended) {
>         return Err(TransactionError::AccountSuspended);
>     }
> 
>     if amount_cents == 0 {
>         return Err(TransactionError::InvalidAmount);
>     }
> 
>     let max_limit = if matches!(tier, AccountTier::VIP) {
>         1_000_000
>     } else if matches!(tier, AccountTier::Standard) {
>         100_000
>     } else {
>         10_000
>     };
> 
>     if amount_cents > max_limit {
>         return Err(TransactionError::ExceedsLimit);
>     }
> 
>     let base_fee_cents = if matches!(tier, AccountTier::VIP) {
>         10
>     } else if matches!(tier, AccountTier::Standard) {
>         50
>     } else {
>         200
>     };
> 
>     let surcharge_cents = if load_factor > 0.8 {
>         (base_fee_cents as f64 * 0.20) as u64
>     } else if load_factor > 0.5 {
>         (base_fee_cents as f64 * 0.10) as u64
>     } else {
>         0
>     };
> 
>     let priority = if matches!(tier, AccountTier::VIP) {
>         "HIGH"
>     } else if matches!(tier, AccountTier::Standard) {
>         if amount_cents >= 10_000 {
>             "NORMAL"
>         } else {
>             "LOW"
>         }
>     } else {
>         "LOW"
>     };
> 
>     Ok(TransactionQuote {
>         base_fee_cents,
>         surcharge_cents,
>         total_fee_cents: base_fee_cents + surcharge_cents,
>         priority,
>     })
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_vip_active_quote() {
>         let res = evaluate_transaction(AccountTier::VIP, AccountStatus::Active, 500_000, 0.85);
>         assert!(res.is_ok());
>         let quote = res.unwrap();
>         assert_eq!(quote.base_fee_cents, 10);
>         assert_eq!(quote.surcharge_cents, 2);
>         assert_eq!(quote.total_fee_cents, 12);
>         assert_eq!(quote.priority, "HIGH");
>         assert_ne!(quote.priority, "LOW");
>     }
> 
>     #[test]
>     fn test_suspended_account() {
>         let res = evaluate_transaction(AccountTier::VIP, AccountStatus::Suspended, 500_000, 0.1);
>         assert!(matches!(res, Err(TransactionError::AccountSuspended)));
>     }
> 
>     #[test]
>     fn test_exceeds_limit() {
>         let res = evaluate_transaction(AccountTier::Guest, AccountStatus::Active, 50_000, 0.1);
>         assert!(matches!(res, Err(TransactionError::ExceedsLimit)));
>     }
> 
>     #[test]
>     fn test_standard_priority_branching() {
>         let high_val = evaluate_transaction(AccountTier::Standard, AccountStatus::Active, 15_000, 0.2).unwrap();
>         let low_val = evaluate_transaction(AccountTier::Standard, AccountStatus::Active, 5_000, 0.2).unwrap();
>         assert_eq!(high_val.priority, "NORMAL");
>         assert_eq!(low_val.priority, "LOW");
>         assert_ne!(high_val.priority, low_val.priority);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Expression-Based Value Assignment**: In traditional imperative languages, computing values across complex business rules requires declaring dynamic mutable state (`let mut limit = 0;`). In Rust, `if / else if / else` blocks are first-class expressions. By placing the evaluated scalar directly at the tail of each branch block without a trailing semicolon, Rust returns that value straight into the target immutable variable (`let max_limit = if ...`).
> 2. **Type Invariance Across Branch Arms**: Every arm in an `if` expression tree must evaluate to the identical type. In the `priority` calculation, every branch evaluates to `&'static str`. If one branch attempted to yield an owned `String` while another yielded `&str`, the compiler would reject the program with type mismatch error `E0308`.
> 3. **Ownership and Lifetime Invariants**: Returning static string literals (`"HIGH"`, `"NORMAL"`, `"LOW"`) ensures zero heap allocation overhead. The returned `&'static str` lives for the entire program execution duration, eliminating reference lifetime tracking or ownership transfers for the fee quote caller.
> 4. **Edge Case Safety**: Early returns via guard clauses (`if matches!(status, AccountStatus::Suspended)`) prevent unnecessary calculations and cleanly decouple exception handling from value computation expressions.

---

### Exercise 2: Network Telemetry Packet Ingestion & Routing Policy Evaluator

**Scenario:**
A network packet processing daemon receives telemetry frames over dynamic routing channels. Before buffer allocation occurs, the engine must validate payload integrity, dynamically determine max allowable buffer allocation, assign packet timeouts, and determine target routing queues based on protocol version, payload checksum validation, encryption status, and real-time latency sensitivity flags.

**Requirements:**
1. Define the data structures:
   - `ProtocolVersion`: `V1`, `V2`, `V3`
   - `PacketHeader`: `version: ProtocolVersion`, `payload_bytes: usize`, `is_encrypted: bool`, `latency_critical: bool`, `checksum_valid: bool`
   - `RoutingTarget`: `FastPath`, `StandardQueue`, `Quarantine`
   - `PacketPolicy`: `max_buffer_size: usize`, `timeout_ms: u64`, `target: RoutingTarget`
   - `ValidationError`: `ChecksumFailure`, `PayloadTooLarge`
2. Implement `evaluate_packet_routing(header: &PacketHeader) -> Result<PacketPolicy, ValidationError>`.
3. Use expression-based conditional evaluation to:
   - Instantly reject invalid checksums with `Err(ValidationError::ChecksumFailure)`.
   - Assign `max_buffer_size`: `V3` allows 65,536 bytes if `is_encrypted` and 32,768 bytes otherwise; `V2` allows 16,384 bytes; `V1` allows 8,192 bytes.
   - Reject payloads exceeding `max_buffer_size` with `Err(ValidationError::PayloadTooLarge)`.
   - Calculate `timeout_ms`: latency-critical requests receive 50 ms for `V3` or 100 ms for older versions; non-critical requests receive 500 ms if encrypted or 1000 ms if unencrypted.
   - Route `target`: `FastPath` for encrypted latency-critical packets; `StandardQueue` for remaining encrypted packets or `V3` streams; `Quarantine` for all unencrypted legacy frames.
4. Provide unit tests using `assert_eq!`, `assert!`, `assert_ne!`, and `matches!`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub enum ProtocolVersion {
>     V1,
>     V2,
>     V3,
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct PacketHeader {
>     pub version: ProtocolVersion,
>     pub payload_bytes: usize,
>     pub is_encrypted: bool,
>     pub latency_critical: bool,
>     pub checksum_valid: bool,
> }
> 
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub enum RoutingTarget {
>     FastPath,
>     StandardQueue,
>     Quarantine,
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct PacketPolicy {
>     pub max_buffer_size: usize,
>     pub timeout_ms: u64,
>     pub target: RoutingTarget,
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub enum ValidationError {
>     ChecksumFailure,
>     PayloadTooLarge,
> }
> 
> pub fn evaluate_packet_routing(header: &PacketHeader) -> Result<PacketPolicy, ValidationError> {
>     if !header.checksum_valid {
>         return Err(ValidationError::ChecksumFailure);
>     }
> 
>     let max_buffer_size = if matches!(header.version, ProtocolVersion::V3) {
>         if header.is_encrypted {
>             65_536
>         } else {
>             32_768
>         }
>     } else if matches!(header.version, ProtocolVersion::V2) {
>         16_384
>     } else {
>         8_192
>     };
> 
>     if header.payload_bytes > max_buffer_size {
>         return Err(ValidationError::PayloadTooLarge);
>     }
> 
>     let timeout_ms = if header.latency_critical {
>         if matches!(header.version, ProtocolVersion::V3) {
>             50
>         } else {
>             100
>         }
>     } else if header.is_encrypted {
>         500
>     } else {
>         1000
>     };
> 
>     let target = if header.latency_critical && header.is_encrypted {
>         RoutingTarget::FastPath
>     } else if header.is_encrypted || matches!(header.version, ProtocolVersion::V3) {
>         RoutingTarget::StandardQueue
>     } else {
>         RoutingTarget::Quarantine
>     };
> 
>     Ok(PacketPolicy {
>         max_buffer_size,
>         timeout_ms,
>         target,
>     })
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_valid_v3_fastpath() {
>         let header = PacketHeader {
>             version: ProtocolVersion::V3,
>             payload_bytes: 4000,
>             is_encrypted: true,
>             latency_critical: true,
>             checksum_valid: true,
>         };
>         let res = evaluate_packet_routing(&header);
>         assert!(res.is_ok());
>         let policy = res.unwrap();
>         assert_eq!(policy.max_buffer_size, 65_536);
>         assert_eq!(policy.timeout_ms, 50);
>         assert_eq!(policy.target, RoutingTarget::FastPath);
>         assert_ne!(policy.target, RoutingTarget::Quarantine);
>     }
> 
>     #[test]
>     fn test_invalid_checksum() {
>         let header = PacketHeader {
>             version: ProtocolVersion::V1,
>             payload_bytes: 100,
>             is_encrypted: false,
>             latency_critical: false,
>             checksum_valid: false,
>         };
>         let res = evaluate_packet_routing(&header);
>         assert!(matches!(res, Err(ValidationError::ChecksumFailure)));
>     }
> 
>     #[test]
>     fn test_payload_exceeds_buffer() {
>         let header = PacketHeader {
>             version: ProtocolVersion::V1,
>             payload_bytes: 10_000,
>             is_encrypted: false,
>             latency_critical: false,
>             checksum_valid: true,
>         };
>         let res = evaluate_packet_routing(&header);
>         assert!(matches!(res, Err(ValidationError::PayloadTooLarge)));
>     }
> 
>     #[test]
>     fn test_quarantine_routing() {
>         let header = PacketHeader {
>             version: ProtocolVersion::V1,
>             payload_bytes: 500,
>             is_encrypted: false,
>             latency_critical: false,
>             checksum_valid: true,
>         };
>         let policy = evaluate_packet_routing(&header).unwrap();
>         assert_eq!(policy.target, RoutingTarget::Quarantine);
>         assert_eq!(policy.timeout_ms, 1000);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Nested Conditional Expressions**: `if` expressions can be cleanly nested within individual branch arms (such as evaluating dynamic buffer sizes inside the `ProtocolVersion::V3` arm). Because each block produces an expression value, Rust enforces structural type consistency top-down throughout the evaluation tree.
> 2. **Immutable Control Flow**: By avoiding temporary mutable flags (`let mut timeout = 0;`), the code guarantees thread safety and eliminates partial initialization bugs. The compiler proves that every conceivable branch initializes `max_buffer_size`, `timeout_ms`, and `target` exactly once.
> 3. **Reference Borrowing Efficiency**: `evaluate_packet_routing` accepts `&PacketHeader` as a read-only shared reference. The conditional expressions read primitive fields (`bool`, `usize`, `enum`) without consuming or moving the underlying header struct, permitting reuse of the original packet buffer in downstream network processing code.
> 4. **Edge Cases**: Short-circuit logic prevents downstream buffer limit calculations when payload checksums fail, minimizing telemetry pipeline latency under hostile network conditions or corrupt packet floods.

---

### Exercise 3: Memory Cache Allocation & Eviction Tier Controller

**Scenario:**
High-throughput caching systems need to optimize buffer placement based on system memory pressure, payload size, and allocation urgency. Depending on current resource saturation, data must be directed to fixed stack buffers, pooled heap blocks, or spilled to disk storage, while simultaneously adjusting cache item retention TTLs and eviction aggressiveness.

**Requirements:**
1. Define the data structures:
   - `CachePressure`: `Low`, `Medium`, `High`, `Critical`
   - `AllocationStrategy`: `StackBuffer { capacity: usize }`, `HeapPool { block_size: usize }`, `DiskSpill`
   - `EvictionPolicy`: `None`, `LRU`, `AggressiveEviction`
   - `AllocationPlan`: `strategy: AllocationStrategy`, `eviction: EvictionPolicy`, `ttl_seconds: u32`
   - `AllocationError`: `MemoryCriticalRejected`
2. Implement `determine_cache_allocation(payload_size: usize, pressure: CachePressure, is_urgent: bool) -> Result<AllocationPlan, AllocationError>`.
3. Apply expression-based `if` / `else` rules:
   - If `pressure` is `Critical` and `!is_urgent`, reject immediately with `Err(AllocationError::MemoryCriticalRejected)`.
   - Strategy selection: small payloads (`<= 512` bytes) receive `StackBuffer { capacity: 512 }`. Medium payloads (`<= 65,536` bytes) under `Low`/`Medium` pressure receive `HeapPool` sized to the next power of two (`payload_size.next_power_of_two()`). Larger payloads or high pressure spill to `DiskSpill`.
   - Eviction selection: `Critical` or `High` pressure triggers `AggressiveEviction`; `Medium` pressure uses `LRU`; `Low` pressure uses `None`.
   - TTL calculation: `Critical` pressure sets 30s TTL; `High` pressure sets 120s TTL; urgent requests receive 3,600s TTL; default non-urgent low/medium requests receive 600s TTL.
4. Provide unit tests using `assert_eq!`, `assert!`, `assert_ne!`, and `matches!`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub enum CachePressure {
>     Low,
>     Medium,
>     High,
>     Critical,
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub enum AllocationStrategy {
>     StackBuffer { capacity: usize },
>     HeapPool { block_size: usize },
>     DiskSpill,
> }
> 
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub enum EvictionPolicy {
>     None,
>     LRU,
>     AggressiveEviction,
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct AllocationPlan {
>     pub strategy: AllocationStrategy,
>     pub eviction: EvictionPolicy,
>     pub ttl_seconds: u32,
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub enum AllocationError {
>     MemoryCriticalRejected,
> }
> 
> pub fn determine_cache_allocation(
>     payload_size: usize,
>     pressure: CachePressure,
>     is_urgent: bool,
> ) -> Result<AllocationPlan, AllocationError> {
>     if matches!(pressure, CachePressure::Critical) && !is_urgent {
>         return Err(AllocationError::MemoryCriticalRejected);
>     }
> 
>     let strategy = if payload_size <= 512 {
>         AllocationStrategy::StackBuffer { capacity: 512 }
>     } else if payload_size <= 65_536 && !matches!(pressure, CachePressure::High | CachePressure::Critical) {
>         AllocationStrategy::HeapPool {
>             block_size: payload_size.next_power_of_two(),
>         }
>     } else {
>         AllocationStrategy::DiskSpill
>     };
> 
>     let eviction = if matches!(pressure, CachePressure::Critical | CachePressure::High) {
>         EvictionPolicy::AggressiveEviction
>     } else if matches!(pressure, CachePressure::Medium) {
>         EvictionPolicy::LRU
>     } else {
>         EvictionPolicy::None
>     };
> 
>     let ttl_seconds = if matches!(pressure, CachePressure::Critical) {
>         30
>     } else if matches!(pressure, CachePressure::High) {
>         120
>     } else if is_urgent {
>         3600
>     } else {
>         600
>     };
> 
>     Ok(AllocationPlan {
>         strategy,
>         eviction,
>         ttl_seconds,
>     })
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_small_payload_stack_alloc() {
>         let plan = determine_cache_allocation(256, CachePressure::Low, false).unwrap();
>         assert_eq!(plan.strategy, AllocationStrategy::StackBuffer { capacity: 512 });
>         assert_eq!(plan.eviction, EvictionPolicy::None);
>         assert_eq!(plan.ttl_seconds, 600);
>         assert_ne!(plan.eviction, EvictionPolicy::AggressiveEviction);
>     }
> 
>     #[test]
>     fn test_medium_heap_alloc() {
>         let plan = determine_cache_allocation(1000, CachePressure::Medium, false).unwrap();
>         assert_eq!(plan.strategy, AllocationStrategy::HeapPool { block_size: 1024 });
>         assert_eq!(plan.eviction, EvictionPolicy::LRU);
>         assert!(matches!(plan.strategy, AllocationStrategy::HeapPool { .. }));
>     }
> 
>     #[test]
>     fn test_critical_pressure_rejection() {
>         let res = determine_cache_allocation(100, CachePressure::Critical, false);
>         assert!(matches!(res, Err(AllocationError::MemoryCriticalRejected)));
>     }
> 
>     #[test]
>     fn test_critical_pressure_urgent_spill() {
>         let plan = determine_cache_allocation(70_000, CachePressure::Critical, true).unwrap();
>         assert_eq!(plan.strategy, AllocationStrategy::DiskSpill);
>         assert_eq!(plan.eviction, EvictionPolicy::AggressiveEviction);
>         assert_eq!(plan.ttl_seconds, 30);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Enum Variant Construction in Expressions**: Rust's `if` expression branches seamlessly yield rich algebraic data types (`AllocationStrategy::StackBuffer` vs `AllocationStrategy::HeapPool` vs `AllocationStrategy::DiskSpill`). The compiler computes the total memory layout of `AllocationStrategy` based on its largest variant at compile time.
> 2. **Combinatorial Logical Operators in Conditions**: Complex conditional expressions (such as `!matches!(pressure, CachePressure::High | CachePressure::Critical)`) allow clean multi-condition evaluation without requiring nested boolean flags or repetitive match expressions.
> 3. **Determinism and Zero Dead Paths**: The compiler guarantees exhaustiveness across all branches. Because every `if` expression has a mandatory trailing `else` block, Rust guarantees that `strategy`, `eviction`, and `ttl_seconds` are fully initialized regardless of execution path.
> 4. **Edge Cases**: Non-power-of-two payload sizes are automatically aligned upward via `.next_power_of_two()` inside the `HeapPool` expression arm, preventing fragmentation issues in memory allocation pools under high throughput.

---

## 6. Related Terms

- [`match`](../level_02/match.md) — The more powerful, pattern-matching alternative to `if`. Usually preferred over long chains of `else if`.
- [Expressions](../level_01/expressions.md) vs [Statements](../level_01/statements.md) — The core concept that allows `if` to return a value (Expressions return values, statements do not).

---

## 7. Key Takeaways

- Use `if`, `else if`, and `else` for basic conditional branching.
- **Do not** put parentheses around the condition (`if x > 5 {`).
- `if` blocks are **expressions**. They can evaluate to a value, which allows you to assign them directly to a `let` variable.
- When used as an expression, **every branch must return the exact same data type**.
- Using `if` as an expression is the idiomatic Rust alternative to the ternary operator (`? :`).
