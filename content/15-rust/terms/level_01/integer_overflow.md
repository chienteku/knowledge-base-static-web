# Integer Overflow Semantics (`checked_` / `wrapping_` / `saturating_` / `overflowing_`)

> **Level 1 — Foundations**
> Arithmetic overflow panics in debug builds and silently wraps in release builds — unless you use an explicit method family to choose the behavior yourself.

---

## 1. Prerequisites


- [Scalar Types](scalar_types.md) — The fixed-width integer types (`u8`, `i32`, ...) that can overflow.
- [Release Profile](../level_15/release_profile.md) — The build mode whose optimization settings change overflow behavior.

---

## 2. Term Category

**Rust Correctness Footgun (the two-faced bug)**: Integer overflow is one of the few places where Rust's behavior is **build-profile-dependent**. The exact same line of code, `a + b`, panics in a debug build and silently produces a wrong number in a release build. Rust gives you explicit method families so you never have to rely on this ambiguous default behavior.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

A fixed-width integer like `u8` can only hold 0 to 255. What should `250_u8 + 10_u8` (which mathematically equals 260) do? Rust's designers made a pragmatic trade-off: in **debug builds**, overflow triggers a `panic!` immediately, because catching bugs early during development is more valuable than speed. In **release builds**, the overflow check is stripped out for performance, and the value silently **wraps** (`260 mod 256 = 4`). This split is dangerous if you don't know about it — code that "works" in `cargo run` can misbehave in `cargo run --release`. So Rust also gives you four explicit method families to make the choice yourself, regardless of build profile.

### (2) Reality Metaphor

Imagine a car's analog odometer with only 3 digits, maxing out at 999.

- **Default/wrapping behavior**: You drive one more mile past 999. The odometer silently rolls over to 000. The car still drives fine — but if you were trusting that number to mean "total miles ever driven," you now have a dangerously wrong reading with no warning light.
- **`checked_add`**: A mechanic inspects the odometer before it rolls over and refuses to let it advance, handing you a `None` instead of a nonsense reading.
- **`saturating_add`**: The odometer physically jams at 999 and refuses to go further, always showing you the true maximum instead of a wrapped lie.

### (3) Rust Code Examples

#### Short Snippet (The Two Faces of `+`)
```rust
fn main() {
    let a: u8 = 250;
    let b: u8 = 10;

    // In a `cargo run` (debug) build: this line PANICS ("attempt to add with overflow").
    // In a `cargo run --release` build: this line silently wraps to 4!
    let sum = a + b;
    println!("{sum}");
}
```

#### Fuller Example (The Explicit Method Families)
```rust
fn main() {
    let a: u8 = 250;
    let b: u8 = 10;

    // 1. checked_*: Returns Option<T>. None means it would have overflowed.
    let checked = a.checked_add(b);
    println!("{checked:?}"); // None

    // 2. wrapping_*: Always wraps, deliberately, on every build profile.
    let wrapped = a.wrapping_add(b);
    println!("{wrapped}"); // 4

    // 3. saturating_*: Clamps to the type's min/max instead of wrapping.
    let saturated = a.saturating_add(b);
    println!("{saturated}"); // 255 (u8::MAX)

    // 4. overflowing_*: Returns (result, did_it_overflow: bool).
    let (value, overflowed) = a.overflowing_add(b);
    println!("{value}, {overflowed}"); // 4, true
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Integer Overflow Scoping and Lifecycle Rules

**The mistake:** Assuming Integer Overflow instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("integer_overflow_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("integer_overflow_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Integer Overflow State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Integer Overflow through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Integer Overflow Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Integer Overflow instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: High-Frequency Financial Ledger Engine with Fail-Safe Arithmetic

**Scenario:** **Problem Statement:**
In high-frequency financial platforms or banking ledgers, arithmetic correctness is non-negotiable. A standard addition or subtraction with `+` or `-` on balances expressed in fixed-point cents (`u64`) could result in catastrophic overflow panics during debug testing or silent wraps in release deployments (e.g., spending $100 with a $50 balance wrapping to ~$18.4 quintillion dollars).

**Requirements:**
Design a production-grade `AccountLedger` system in Rust that handles:
1. `deposit` and `withdraw` operations using `checked_add` and `checked_sub` returning a custom `Result<u64, LedgerError>` type (with variants `BalanceOverflow`, `InsufficientBalance`).
2. A `calculate_loyalty_rewards` function using `saturating_mul` and `saturating_add`, guaranteeing that calculated rewards clamp at `u64::MAX` rather than causing runtime errors or wrapping.
3. Batch deposit transaction execution (`execute_batch_deposits`) that atomically validates and updates state, aborting on any overflow.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq)]
> pub enum LedgerError {
>     BalanceOverflow,
>     InsufficientBalance,
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct AccountLedger {
>     account_id: u64,
>     balance_cents: u64,
> }
> 
> impl AccountLedger {
>     pub fn new(account_id: u64, initial_balance_cents: u64) -> Self {
>         Self {
>             account_id,
>             balance_cents: initial_balance_cents,
>         }
>     }
> 
>     pub fn balance_cents(&self) -> u64 {
>         self.balance_cents
>     }
> 
>     pub fn deposit(&mut self, amount: u64) -> Result<u64, LedgerError> {
>         let new_balance = self
>             .balance_cents
>             .checked_add(amount)
>             .ok_or(LedgerError::BalanceOverflow)?;
>         self.balance_cents = new_balance;
>         Ok(new_balance)
>     }
> 
>     pub fn withdraw(&mut self, amount: u64) -> Result<u64, LedgerError> {
>         let new_balance = self
>             .balance_cents
>             .checked_sub(amount)
>             .ok_or(LedgerError::InsufficientBalance)?;
>         self.balance_cents = new_balance;
>         Ok(new_balance)
>     }
> 
>     pub fn calculate_loyalty_rewards(&self, multiplier: u64, bonus_points: u64) -> u64 {
>         self.balance_cents
>             .saturating_mul(multiplier)
>             .saturating_add(bonus_points)
>     }
> 
>     pub fn execute_batch_deposits(&mut self, deposits: &[u64]) -> Result<u64, LedgerError> {
>         let mut temp_balance = self.balance_cents;
>         for &amount in deposits {
>             temp_balance = temp_balance
>                 .checked_add(amount)
>                 .ok_or(LedgerError::BalanceOverflow)?;
>         }
>         self.balance_cents = temp_balance;
>         Ok(self.balance_cents)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_deposit_and_withdraw_success() {
>         let mut ledger = AccountLedger::new(1001, 5000);
>         assert_eq!(ledger.deposit(2500), Ok(7500));
>         assert_eq!(ledger.balance_cents(), 7500);
> 
>         assert_eq!(ledger.withdraw(3000), Ok(4500));
>         assert_eq!(ledger.balance_cents(), 4500);
>     }
> 
>     #[test]
>     fn test_withdraw_insufficient_balance() {
>         let mut ledger = AccountLedger::new(1002, 1000);
>         let res = ledger.withdraw(1500);
>         assert!(matches!(res, Err(LedgerError::InsufficientBalance)));
>         assert_eq!(ledger.balance_cents(), 1000);
>     }
> 
>     #[test]
>     fn test_deposit_overflow() {
>         let mut ledger = AccountLedger::new(1003, u64::MAX - 100);
>         let res = ledger.deposit(200);
>         assert!(matches!(res, Err(LedgerError::BalanceOverflow)));
>         assert_eq!(ledger.balance_cents(), u64::MAX - 100);
>     }
> 
>     #[test]
>     fn test_saturating_rewards_clamping() {
>         let ledger = AccountLedger::new(1004, u64::MAX / 2 + 100);
>         let rewards = ledger.calculate_loyalty_rewards(10, 500);
>         assert_eq!(rewards, u64::MAX);
>         assert_ne!(rewards, 0);
>     }
> 
>     #[test]
>     fn test_batch_deposits_rollback_on_overflow() {
>         let mut ledger = AccountLedger::new(1005, 1000);
>         let deposits = vec![500, u64::MAX, 200];
>         let res = ledger.execute_batch_deposits(&deposits);
>         assert!(matches!(res, Err(LedgerError::BalanceOverflow)));
>         assert_eq!(ledger.balance_cents(), 1000);
>     }
> }
> ```
>
> #### Technical Explanation
>
>
> 1. **Why `checked_*` for Core Ledger Transfers:** `checked_add` and `checked_sub` return `Option<T>`, yielding `None` when an arithmetic overflow or underflow would occur. By mapping `None` to explicit error variants (`LedgerError::BalanceOverflow` and `LedgerError::InsufficientBalance`), we guarantee deterministic validation across both `debug` and `release` build profiles without relying on profile-dependent default behavior.
> 2. **Why `saturating_*` for Loyalty Points:** Reward point calculations often involve large multipliers. If a user earns more points than can be represented in `u64`, the business logic dictates capping the rewards at maximum tier allowance (`u64::MAX`) rather than aborting the underlying financial transaction or silently wrapping to zero.
> 3. **Ownership and Invariants:** `AccountLedger` encapsulates its internal balance (`balance_cents`). Operations mutating state consume `&mut self`, enforcing Rust's single mutable reference invariant to prevent concurrent race conditions. Batch operations validate all steps on a temporary variable before mutating `self.balance_cents` to maintain transactional atomicity.
> 4. **Edge Cases Handled:** Depositing onto `u64::MAX` returns `Err(LedgerError::BalanceOverflow)`; withdrawing more than `balance_cents` returns `Err(LedgerError::InsufficientBalance)`; exact zero withdrawals/deposits succeed cleanly; saturated multiplication does not panic or wrap.
>
>
> 
---

### Exercise 2: Network Protocol Sequence Framer & Internet Checksum Engine

**Scenario:** **Problem Statement:**
In network transport protocols (such as custom UDP streaming protocols or sliding window protocol implementations), 32-bit packet sequence numbers roll over deliberately upon reaching `0xFFFFFFFF` (`u32::MAX`). Standard addition using `+` panics in debug builds when wraparound occurs. Additionally, network packet checksum algorithms (like the Internet Checksum RFC 1071) accumulate 16-bit payload words and fold over 16-bit overflow carries.

**Requirements:**
Design a production-grade network stream component featuring:
1. A `PacketSequenceTracker` that increments sequence numbers deterministically across wrap boundaries using `wrapping_add`, and calculates distance between sequence numbers using `wrapping_sub`.
2. A `ChecksumCalculator` that processes byte slices and uses `overflowing_add` to detect 16-bit word addition overflows and perform carry fold-over.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub struct PacketSequenceTracker {
>     current_seq: u32,
> }
> 
> impl PacketSequenceTracker {
>     pub fn new(initial_seq: u32) -> Self {
>         Self { current_seq: initial_seq }
>     }
> 
>     pub fn current_seq(&self) -> u32 {
>         self.current_seq
>     }
> 
>     pub fn next_seq(&mut self) -> u32 {
>         let seq = self.current_seq;
>         self.current_seq = self.current_seq.wrapping_add(1);
>         seq
>     }
> 
>     pub fn advance_by(&mut self, count: u32) {
>         self.current_seq = self.current_seq.wrapping_add(count);
>     }
> 
>     pub fn distance_to(&self, target_seq: u32) -> u32 {
>         target_seq.wrapping_sub(self.current_seq)
>     }
> 
>     pub fn is_newer_than(&self, other_seq: u32) -> bool {
>         let diff = self.current_seq.wrapping_sub(other_seq);
>         diff > 0 && diff < (u32::MAX / 2)
>     }
> }
> 
> pub struct ChecksumCalculator;
> 
> impl ChecksumCalculator {
>     pub fn compute_ones_complement_checksum(payload: &[u8]) -> u16 {
>         let mut accumulator: u32 = 0;
>         let mut i = 0;
> 
>         while i + 1 < payload.len() {
>             let word = u16::from_be_bytes([payload[i], payload[i + 1]]) as u32;
>             let (next_acc, overflowed) = accumulator.overflowing_add(word);
>             accumulator = if overflowed {
>                 next_acc.wrapping_add(1)
>             } else {
>                 next_acc
>             };
>             i += 2;
>         }
> 
>         if i < payload.len() {
>             let word = u16::from_be_bytes([payload[i], 0]) as u32;
>             let (next_acc, overflowed) = accumulator.overflowing_add(word);
>             accumulator = if overflowed {
>                 next_acc.wrapping_add(1)
>             } else {
>                 next_acc
>             };
>         }
> 
>         while (accumulator >> 16) != 0 {
>             accumulator = (accumulator & 0xFFFF) + (accumulator >> 16);
>         }
> 
>         !(accumulator as u16)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_sequence_wrapping_boundary() {
>         let mut tracker = PacketSequenceTracker::new(u32::MAX - 1);
>         assert_eq!(tracker.next_seq(), u32::MAX - 1);
>         assert_eq!(tracker.next_seq(), u32::MAX);
>         assert_eq!(tracker.next_seq(), 0);
>         assert_eq!(tracker.current_seq(), 1);
>     }
> 
>     #[test]
>     fn test_sequence_distance_across_wrap() {
>         let tracker = PacketSequenceTracker::new(u32::MAX - 5);
>         let target = 3_u32;
>         assert_eq!(tracker.distance_to(target), 9);
>     }
> 
>     #[test]
>     fn test_is_newer_than() {
>         let tracker = PacketSequenceTracker::new(5);
>         assert!(tracker.is_newer_than(3));
>         assert!(!tracker.is_newer_than(10));
> 
>         let wrapped_tracker = PacketSequenceTracker::new(2);
>         assert!(wrapped_tracker.is_newer_than(u32::MAX - 1));
>     }
> 
>     #[test]
>     fn test_checksum_computation() {
>         let data = b"Hello, Rust Networking!";
>         let checksum1 = ChecksumCalculator::compute_ones_complement_checksum(data);
>         let checksum2 = ChecksumCalculator::compute_ones_complement_checksum(data);
> 
>         assert_eq!(checksum1, checksum2);
>         assert_ne!(checksum1, 0x0000);
> 
>         let mutated_data = b"Hello, Rust networking!";
>         let checksum_mutated = ChecksumCalculator::compute_ones_complement_checksum(mutated_data);
>         assert_ne!(checksum1, checksum_mutated);
>     }
> }
> ```
>
> #### Technical Explanation
>
>
> 1. **Modular Arithmetic via `wrapping_add`:** RFC 1982 sequence number arithmetic requires modulo $2^{32}$ wraparound. Using `wrapping_add(1)` ensures that incrementing `u32::MAX` moves seamlessly to `0` across debug and release builds.
> 2. **Modular Distance via `wrapping_sub`:** Evaluating sequence distance using `target_seq.wrapping_sub(current_seq)` yields the exact forward step distance, even when `target_seq` has wrapped around to `0` and `current_seq` is near `u32::MAX`.
> 3. **Carry Tracking via `overflowing_add`:** `overflowing_add` returns a tuple `(wrapped_val, did_overflow)`. During internet checksum calculation, when adding 16-bit word accumulators, an overflow means a carry bit was generated. We add `1` back to the low word whenever `overflowed` is `true`.
> 4. **Lifetime & Concurrency Safety:** The checksum calculator accepts borrowed payload slices `&[u8]`. Since no heap allocation or shared mutable state is used, the implementation is thread-safe (`Sync` + `Send`) and allocation-free.
>
>
> 
---

### Exercise 3: Embedded IoT Telemetry Rate Limiter & Token Bucket Pipeline

**Scenario:** **Problem Statement:**
In embedded systems, microcontrollers operate continuously for long durations where timer ticks and byte counters hit fixed bit-width boundaries.
1. A rate-limiting `TokenBucketRateLimiter` uses fixed-size token counters (`u32`). When refilling tokens based on elapsed millisecond ticks, token additions must use `saturating_add` to prevent overflowing the maximum capacity. Token consumption must use `saturating_sub` to clamp at 0 without underflowing.
2. A hardware telemetry aggregator receives byte counts from sensor interrupts. It needs to compute total byte output and report overflow events using `overflowing_add` so telemetry systems track register roll-over counts while maintaining raw wrapped offsets.

**Requirements:**
Design a production-grade embedded rate limiter and telemetry tracking pipeline in Rust.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct TokenBucketRateLimiter {
>     capacity: u32,
>     available_tokens: u32,
>     refill_rate_per_sec: u32,
> }
> 
> impl TokenBucketRateLimiter {
>     pub fn new(capacity: u32, refill_rate_per_sec: u32) -> Self {
>         Self {
>             capacity,
>             available_tokens: capacity,
>             refill_rate_per_sec,
>         }
>     }
> 
>     pub fn available_tokens(&self) -> u32 {
>         self.available_tokens
>     }
> 
>     pub fn refill(&mut self, elapsed_millis: u32) {
>         let added_tokens = (elapsed_millis as u64)
>             .saturating_mul(self.refill_rate_per_sec as u64)
>             .saturating_div(1000) as u32;
> 
>         self.available_tokens = self
>             .available_tokens
>             .saturating_add(added_tokens)
>             .min(self.capacity);
>     }
> 
>     pub fn try_consume(&mut self, tokens: u32) -> bool {
>         if self.available_tokens >= tokens {
>             self.available_tokens = self.available_tokens.saturating_sub(tokens);
>             true
>         } else {
>             false
>         }
>     }
> }
> 
> #[derive(Debug, Default, Clone, PartialEq, Eq)]
> pub struct TelemetryAccumulator {
>     total_bytes: u32,
>     wrap_count: u32,
> }
> 
> impl TelemetryAccumulator {
>     pub fn new() -> Self {
>         Self::default()
>     }
> 
>     pub fn total_bytes(&self) -> u32 {
>         self.total_bytes
>     }
> 
>     pub fn wrap_count(&self) -> u32 {
>         self.wrap_count
>     }
> 
>     pub fn record_bytes(&mut self, count: u32) -> bool {
>         let (new_total, overflowed) = self.total_bytes.overflowing_add(count);
>         self.total_bytes = new_total;
>         if overflowed {
>             self.wrap_count = self.wrap_count.saturating_add(1);
>         }
>         overflowed
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_token_bucket_refill_and_clamp() {
>         let mut limiter = TokenBucketRateLimiter::new(100, 50);
>         assert_eq!(limiter.available_tokens(), 100);
> 
>         assert!(limiter.try_consume(80));
>         assert_eq!(limiter.available_tokens(), 20);
> 
>         limiter.refill(2000);
>         assert_eq!(limiter.available_tokens(), 100);
>     }
> 
>     #[test]
>     fn test_token_bucket_consume_failure() {
>         let mut limiter = TokenBucketRateLimiter::new(50, 10);
>         assert!(limiter.try_consume(30));
>         assert_eq!(limiter.available_tokens(), 20);
> 
>         assert!(!limiter.try_consume(30));
>         assert_eq!(limiter.available_tokens(), 20);
>     }
> 
>     #[test]
>     fn test_telemetry_overflow_detection() {
>         let mut acc = TelemetryAccumulator::new();
>         assert!(!acc.record_bytes(1000));
>         assert_eq!(acc.total_bytes(), 1000);
>         assert_eq!(acc.wrap_count(), 0);
> 
>         let did_overflow = acc.record_bytes(u32::MAX);
>         assert!(did_overflow);
>         assert_eq!(acc.wrap_count(), 1);
>         assert_eq!(acc.total_bytes(), 999);
>     }
> 
>     #[test]
>     fn test_telemetry_multiple_wraps() {
>         let mut acc = TelemetryAccumulator::new();
>         acc.record_bytes(u32::MAX);
>         acc.record_bytes(u32::MAX);
>         assert_eq!(acc.wrap_count(), 2);
>     }
> }
> ```
>
> #### Technical Explanation
>
>
> 1. **Token Refill Clamping (`saturating_add`):** When refilling tokens, `available_tokens.saturating_add(added_tokens)` prevents integer overflow if a system comes back from deep sleep or an extended idle state with a large `elapsed_millis` value. Combining it with `.min(capacity)` bounds available tokens.
> 2. **Token Consumption Clamping (`saturating_sub`):** Attempting to subtract requested tokens using standard `-` could underflow. `saturating_sub` clamps to zero safely.
> 3. **Hardware Counter Roll-over (`overflowing_add`):** Microcontroller registers roll over periodically. `overflowing_add` returns `(wrapped_sum, true)` on overflow, allowing `TelemetryAccumulator` to increment its `wrap_count` using `saturating_add(1)` while seamlessly updating the 32-bit register metric `total_bytes`.
> 4. **No-std / Concurrency Readiness:** The algorithm avoids dynamic allocations (`Vec`, `String`) and floating-point math, relying entirely on deterministic fixed-width integer operations suitable for bare-metal or `no_std` embedded microcontrollers.
>
>
> 
---

## 6. Related Terms


- [`as` Casting (Primitive Numeric Coercion)](as_casting.md) — Another silent-truncation footgun; `as` and unchecked `+` share the same "no warning" failure mode.
- [`panic!` Macro](../level_04/panic.md) — What debug-mode overflow triggers.
- [`Option<T>`](../level_02/option_t.md) — The return type of every `checked_*` method.
- [Release Profile](../level_15/release_profile.md) — The build setting (`overflow-checks`) that determines whether unchecked `+` panics or wraps.

---

## 7. Key Takeaways

- Unchecked arithmetic (`+`, `-`, `*`) **panics on overflow in debug builds** and **silently wraps in release builds** by default — the same code, two different behaviors.
- `checked_*` returns `Option<T>` (`None` on overflow) — best when overflow means "reject this operation."
- `wrapping_*` always wraps, on every build — best when wraparound is the *intended* behavior (e.g. hashing, ring buffers).
- `saturating_*` clamps to the type's min/max — best when you want a safe, non-crashing "closest possible" answer.
- `overflowing_*` returns both the wrapped value and a `bool` — best when you need the wrapped result *and* want to know it happened.
