# `#[ignore]`

> **Level 8 — Testing & Documentation**
> Attribute to skip a test by default; run ignored tests with `cargo test -- --ignored`.

---

## 1. Prerequisites


**None.**

---

## 2. Term Category

**Rust Tooling (the test skipper)**: As your project grows, you might write some tests that take a very long time to run (like downloading a large file from the internet, connecting to a real database, or crunching massive amounts of data). 

You do not want these heavy tests running every single time you hit Save! The **`#[ignore]`** attribute tells Cargo to skip the test during standard runs, but keeps the test available for when you explicitly ask for it.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

A core rule of software engineering is: *Testing needs to be fast.* 

If `cargo test` takes 5 minutes to run, developers will simply stop running it. However, you still absolutely need to write those slow, heavy integration tests to ensure your software works in the real world! 

The Rust designers created `#[ignore]` so you can write those slow tests, commit them to your repository, but prevent them from slowing down your daily workflow.

### (2) Reality Metaphor

Imagine you have a daily workout routine (your standard `cargo test`). It takes 20 minutes, you do it every morning, and it keeps you healthy. 

Once a month, you want to run a full 26-mile marathon to really test your endurance. If you forced yourself to run a marathon *every single day*, you'd quit working out entirely! 

`#[ignore]` is like keeping the marathon on your calendar, but skipping it during your daily routine. You only run the marathon when you specifically wake up and say: *"Today is marathon day!"* (`cargo test -- --ignored`).

### (3) Rust Code Examples

#### Short Snippet (The Skipped Test)
To use it, you simply stack the `#[ignore]` attribute right below your `#[test]` attribute.

```rust
#[cfg(test)]
mod tests {
    #[test]
    fn fast_math_test() {
        assert_eq!(2 + 2, 4); // This runs instantly!
    }

    #[test]
    #[ignore]
    fn slow_database_test() {
        // This test connects to AWS and takes 10 seconds to run.
        // It will be SKIPPED during a standard `cargo test`.
        connect_to_database(); 
    }
}
```

#### Fuller Example (How to actually run it)
If Cargo skips the test by default, how do you actually run it when you want to? You use terminal flags!

```bash
# 1. The Daily Routine
# Runs `fast_math_test`. Skips `slow_database_test`.
cargo test

# 2. The Marathon Day! 
# The `--` separates Cargo's arguments from the test runner's arguments.
# This command runs ONLY the tests marked with #[ignore].
cargo test -- --ignored

# 3. Run Absolutely Everything
# This command runs all normal tests AND all ignored tests.
cargo test -- --include-ignored
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Ignore Scoping and Lifecycle Rules

**The mistake:** Assuming Ignore instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("ignore_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("ignore_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Ignore State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Ignore through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Ignore Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Ignore instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: High-Volume Event Aggregator & Heavy Stress Testing

**Problem:**
In high-throughput financial or metrics ingestion systems, software engineers must ensure that local development TDD runs (`cargo test`) complete in milliseconds. However, heavy soak/stress tests processing millions of transactions are still required to detect memory leaks, boundary errors, or balance drift.

Implement a financial transaction ledger system:
1. Define a `Transaction` struct containing `id` (`u64`), `amount` (`i64`), and `is_credit` (`bool`).
2. Define a `LedgerStats` struct holding `total_transactions` (`usize`), `net_balance` (`i64`), and `max_transaction_amount` (`i64`).
3. Define a `LedgerProcessor` trait with methods `process_transaction(&mut self, tx: Transaction) -> Result<(), &'static str>` and `stats(&self) -> LedgerStats`.
4. Implement `TransactionLedger` with a bounded transaction capacity limit.
5. Create a `#[cfg(test)] mod tests` module containing:
   - A fast unit test (`test_quick_ledger_transaction_balancing`) that verifies credit/debit calculation and zero-amount error checking during normal `cargo test` execution.
   - An ignored heavy stress test (`test_high_volume_stress_processing`) annotated with `#[ignore = "High-volume stress test processing 1,000,000 records; run with cargo test -- --ignored"]` that ingests 1,000,000 transactions.
6. Use assertions including `assert_eq!`, `assert!`, `assert_ne!`, and `matches!`.

> [!check]- Answer
> ```rust
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct Transaction {
>     pub id: u64,
>     pub amount: i64,
>     pub is_credit: bool,
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq, Default)]
> pub struct LedgerStats {
>     pub total_transactions: usize,
>     pub net_balance: i64,
>     pub max_transaction_amount: i64,
> }
> 
> pub trait LedgerProcessor {
>     fn process_transaction(&mut self, tx: Transaction) -> Result<(), &'static str>;
>     fn stats(&self) -> LedgerStats;
> }
> 
> pub struct TransactionLedger {
>     stats: LedgerStats,
>     capacity: usize,
> }
> 
> impl TransactionLedger {
>     pub fn new(capacity: usize) -> Self {
>         Self {
>             stats: LedgerStats::default(),
>             capacity,
>         }
>     }
> }
> 
> impl LedgerProcessor for TransactionLedger {
>     fn process_transaction(&mut self, tx: Transaction) -> Result<(), &'static str> {
>         if self.stats.total_transactions >= self.capacity {
>             return Err("Ledger capacity exceeded");
>         }
> 
>         if tx.amount <= 0 {
>             return Err("Transaction amount must be positive");
>         }
> 
>         self.stats.total_transactions += 1;
>         if tx.is_credit {
>             self.stats.net_balance += tx.amount;
>         } else {
>             self.stats.net_balance -= tx.amount;
>         }
> 
>         if tx.amount > self.stats.max_transaction_amount {
>             self.stats.max_transaction_amount = tx.amount;
>         }
> 
>         Ok(())
>     }
> 
>     fn stats(&self) -> LedgerStats {
>         self.stats.clone()
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_quick_ledger_transaction_balancing() {
>         let mut ledger = TransactionLedger::new(100);
>         let credit = Transaction { id: 1, amount: 500, is_credit: true };
>         let debit = Transaction { id: 2, amount: 200, is_credit: false };
> 
>         assert!(ledger.process_transaction(credit).is_ok());
>         assert_eq!(ledger.stats().net_balance, 500);
> 
>         assert!(ledger.process_transaction(debit).is_ok());
>         assert_eq!(ledger.stats().net_balance, 300);
>         assert_eq!(ledger.stats().total_transactions, 2);
>         assert_eq!(ledger.stats().max_transaction_amount, 500);
>         assert_ne!(ledger.stats().net_balance, 0);
> 
>         let invalid_tx = Transaction { id: 3, amount: 0, is_credit: true };
>         let res = ledger.process_transaction(invalid_tx);
>         assert!(matches!(res, Err("Transaction amount must be positive")));
>     }
> 
>     #[test]
>     #[ignore = "High-volume stress test processing 1,000,000 records; run with cargo test -- --ignored"]
>     fn test_high_volume_stress_processing() {
>         let mut ledger = TransactionLedger::new(1_000_000);
>         for i in 0..1_000_000 {
>             let tx = Transaction {
>                 id: i as u64,
>                 amount: 10,
>                 is_credit: i % 2 == 0,
>             };
>             assert!(ledger.process_transaction(tx).is_ok());
>         }
> 
>         let stats = ledger.stats();
>         assert_eq!(stats.total_transactions, 1_000_000);
>         assert_eq!(stats.net_balance, 0);
>         assert_eq!(stats.max_transaction_amount, 10);
>     }
> }
> ```
> 
> **Technical Explanation:**
> 1. **Separation of Test Horizons**: Fast unit tests run on every single build step to validate correctness of business logic (e.g., zero-amount handling and net balance calculation).
> 2. **`#[ignore]` Annotation**: Stacking `#[ignore = "..."]` directly below `#[test]` prevents Cargo from running `test_high_volume_stress_processing` during normal `cargo test`.
> 3. **Execution Commands**:
>    - `cargo test`: Executes `test_quick_ledger_transaction_balancing` in < 1 ms and reports `test_high_volume_stress_processing ... ignored`.
>    - `cargo test -- --ignored`: Executes only the ignored stress test.
>    - `cargo test -- --include-ignored`: Executes both fast unit tests and the heavy stress test.
> 
---

### Exercise 2: Payment Gateway Client & Live Integration Gate

**Problem:**
Microservice architectures frequently communicate with external HTTP services (e.g., Stripe or PayPal). In-memory mock clients allow instant unit testing, while live sandbox integration tests verify authentication headers and remote server responses. However, executing live integration tests on every local build causes network bottlenecks, rate limiting, and failures when developers are offline.

Design a Payment Gateway module:
1. Define a `PaymentStatus` enum with variants `Authorized { transaction_id: String }`, `Declined { reason: String }`, and `RateLimited`.
2. Define `PaymentRequest` and `PaymentResponse` structs.
3. Define a `PaymentGateway` trait with method `process_payment(&self, req: &PaymentRequest) -> Result<PaymentResponse, &'static str>`.
4. Implement `MockPaymentGateway` (for fast local tests) and `LivePaymentGateway` (for sandbox environment tests).
5. Implement unit tests inside `#[cfg(test)] mod tests`:
   - `test_mock_payment_authorization_and_validation`: Runs in standard test passes to verify request validation and mock authorization matching.
   - `test_live_payment_gateway_authorization`: Marked with `#[ignore = "Requires live sandbox network connection and remote API credentials"]` to prevent unauthorized or offline build failures.
6. Verify behavior using `assert_eq!`, `assert!`, `assert_ne!`, `matches!`, and `panic!`.

> [!check]- Answer
> ```rust
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub enum PaymentStatus {
>     Authorized { transaction_id: String },
>     Declined { reason: String },
>     RateLimited,
> }
> 
> #[derive(Debug, Clone)]
> pub struct PaymentRequest {
>     pub account_id: String,
>     pub amount_cents: u64,
>     pub currency: String,
> }
> 
> #[derive(Debug, Clone)]
> pub struct PaymentResponse {
>     pub status: PaymentStatus,
>     pub latency_ms: u64,
> }
> 
> pub trait PaymentGateway {
>     fn process_payment(&self, req: &PaymentRequest) -> Result<PaymentResponse, &'static str>;
> }
> 
> pub struct MockPaymentGateway {
>     pub auto_decline: bool,
> }
> 
> impl PaymentGateway for MockPaymentGateway {
>     fn process_payment(&self, req: &PaymentRequest) -> Result<PaymentResponse, &'static str> {
>         if req.amount_cents == 0 {
>             return Err("Invalid payment amount");
>         }
>         if self.auto_decline {
>             Ok(PaymentResponse {
>                 status: PaymentStatus::Declined {
>                     reason: "Insufficient funds".into(),
>                 },
>                 latency_ms: 5,
>             })
>         } else {
>             Ok(PaymentResponse {
>                 status: PaymentStatus::Authorized {
>                     transaction_id: format!("tx_mock_{}", req.account_id),
>                 },
>                 latency_ms: 12,
>             })
>         }
>     }
> }
> 
> pub struct LivePaymentGateway {
>     pub endpoint_url: String,
>     pub api_key: String,
> }
> 
> impl PaymentGateway for LivePaymentGateway {
>     fn process_payment(&self, req: &PaymentRequest) -> Result<PaymentResponse, &'static str> {
>         if self.api_key.is_empty() {
>             return Err("Missing API Key for live gateway");
>         }
>         if req.amount_cents > 10_000_000 {
>             Ok(PaymentResponse {
>                 status: PaymentStatus::RateLimited,
>                 latency_ms: 450,
>             })
>         } else {
>             Ok(PaymentResponse {
>                 status: PaymentStatus::Authorized {
>                     transaction_id: format!("tx_live_{}", req.account_id),
>                 },
>                 latency_ms: 230,
>             })
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_mock_payment_authorization_and_validation() {
>         let gateway = MockPaymentGateway { auto_decline: false };
>         let req = PaymentRequest {
>             account_id: "acct_9988".into(),
>             amount_cents: 2500,
>             currency: "USD".into(),
>         };
> 
>         let response = gateway.process_payment(&req).unwrap();
>         assert_eq!(response.latency_ms, 12);
>         assert!(matches!(
>             response.status,
>             PaymentStatus::Authorized { ref transaction_id } if transaction_id == "tx_mock_acct_9988"
>         ));
> 
>         let invalid_req = PaymentRequest {
>             account_id: "acct_9988".into(),
>             amount_cents: 0,
>             currency: "USD".into(),
>         };
>         assert!(matches!(gateway.process_payment(&invalid_req), Err("Invalid payment amount")));
>     }
> 
>     #[test]
>     #[ignore = "Requires live sandbox network connection and remote API credentials"]
>     fn test_live_payment_gateway_authorization() {
>         let live_gateway = LivePaymentGateway {
>             endpoint_url: "https://api.sandbox.paymentservice.com/v1/charge".into(),
>             api_key: "sk_sandbox_test_key_12345".into(),
>         };
> 
>         let req = PaymentRequest {
>             account_id: "live_user_101".into(),
>             amount_cents: 5000,
>             currency: "USD".into(),
>         };
> 
>         let response = live_gateway.process_payment(&req).expect("Live API call failed");
>         assert!(response.latency_ms > 0);
>         assert_ne!(response.latency_ms, 0);
> 
>         if let PaymentStatus::Authorized { ref transaction_id } = response.status {
>             assert!(transaction_id.starts_with("tx_live_"));
>         } else {
>             panic!("Expected authorized payment status from live sandbox");
>         }
>     }
> }
> ```
> 
> **Technical Explanation:**
> 1. **Trait-Based Abstraction**: `PaymentGateway` allows swapping deterministic in-memory implementations (`MockPaymentGateway`) for network-dependent clients (`LivePaymentGateway`).
> 2. **Protecting CI/CD Pipelines**: Adding `#[ignore = "..."]` to `test_live_payment_gateway_authorization` prevents standard CI builds from failing due to missing API keys or external network downtime.
> 3. **Targeted Execution**: Developers testing external API integration can target this specific test using:
>    ```bash
>    cargo test test_live_payment_gateway_authorization -- --ignored
>    ```
> 
---

### Exercise 3: Database Schema Migration Engine & Destructive Migration Testing

**Problem:**
Database migration frameworks must run schema structure checks quickly, while isolating tests that alter large production-like database tables or perform destructive column operations.

Design a schema migration engine:
1. Define a `MigrationStep` struct containing `version` (`u32`), `description` (`String`), `sql_statement` (`String`), and `is_destructive` (`bool`).
2. Define a `MigrationError` enum with variants `VersionMismatch { expected: u32, found: u32 }` and `ExecutionFailed(String)`.
3. Define a `MigrationRunner` trait with `apply_migration(&mut self, step: &MigrationStep) -> Result<(), MigrationError>`.
4. Implement `SchemaMigrator` maintaining current version and execution history.
5. Create a `#[cfg(test)] mod tests` module featuring:
   - `test_sequential_schema_migration`: A standard unit test verifying version sequence checks and history logging.
   - `test_destructive_full_dataset_migration`: An ignored test annotated with `#[ignore = "Destructive migration test on production-sized dataset requiring staging environment"]` to safeguard staging databases during default test runs.
6. Include assertions: `assert_eq!`, `assert!`, `assert_ne!`, and `matches!`.

> [!check]- Answer
> ```rust
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct MigrationStep {
>     pub version: u32,
>     pub description: String,
>     pub sql_statement: String,
>     pub is_destructive: bool,
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub enum MigrationError {
>     VersionMismatch { expected: u32, found: u32 },
>     ExecutionFailed(String),
> }
> 
> pub trait MigrationRunner {
>     fn apply_migration(&mut self, step: &MigrationStep) -> Result<(), MigrationError>;
> }
> 
> pub struct SchemaMigrator {
>     pub current_version: u32,
>     pub executed_history: Vec<u32>,
> }
> 
> impl SchemaMigrator {
>     pub fn new(initial_version: u32) -> Self {
>         Self {
>             current_version: initial_version,
>             executed_history: Vec::new(),
>         }
>     }
> }
> 
> impl MigrationRunner for SchemaMigrator {
>     fn apply_migration(&mut self, step: &MigrationStep) -> Result<(), MigrationError> {
>         if step.version != self.current_version + 1 {
>             return Err(MigrationError::VersionMismatch {
>                 expected: self.current_version + 1,
>                 found: step.version,
>             });
>         }
> 
>         if step.sql_statement.contains("INVALID") {
>             return Err(MigrationError::ExecutionFailed(
>                 "SQL syntax error near INVALID".into(),
>             ));
>         }
> 
>         self.current_version = step.version;
>         self.executed_history.push(step.version);
>         Ok(())
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_sequential_schema_migration() {
>         let mut migrator = SchemaMigrator::new(0);
>         let step1 = MigrationStep {
>             version: 1,
>             description: "Create users table".into(),
>             sql_statement: "CREATE TABLE users (id INT PRIMARY KEY);".into(),
>             is_destructive: false,
>         };
> 
>         assert!(migrator.apply_migration(&step1).is_ok());
>         assert_eq!(migrator.current_version, 1);
>         assert_eq!(migrator.executed_history, vec![1]);
> 
>         let invalid_version_step = MigrationStep {
>             version: 3,
>             description: "Skip version test".into(),
>             sql_statement: "CREATE TABLE posts (id INT);".into(),
>             is_destructive: false,
>         };
> 
>         let err = migrator.apply_migration(&invalid_version_step);
>         assert!(matches!(
>             err,
>             Err(MigrationError::VersionMismatch { expected: 2, found: 3 })
>         ));
>     }
> 
>     #[test]
>     #[ignore = "Destructive migration test on production-sized dataset requiring staging environment"]
>     fn test_destructive_full_dataset_migration() {
>         let mut migrator = SchemaMigrator::new(10);
>         let destructive_step = MigrationStep {
>             version: 11,
>             description: "Drop legacy columns and re-index 50M rows".into(),
>             sql_statement: "ALTER TABLE analytics DROP COLUMN raw_payload;".into(),
>             is_destructive: true,
>         };
> 
>         assert!(destructive_step.is_destructive);
>         let result = migrator.apply_migration(&destructive_step);
>         assert!(result.is_ok());
>         assert_eq!(migrator.current_version, 11);
>         assert_ne!(migrator.executed_history.len(), 0);
>     }
> }
> ```
> 
> **Technical Explanation:**
> 1. **Safety and Isolation**: Annotating destructive migration benchmarks with `#[ignore]` ensures developer workstations and shared dev databases are not unintentionally wiped or altered during standard test execution.
> 2. **Reason Strings**: Including descriptive strings like `#[ignore = "Destructive migration test..."]` provides valuable context when test outputs print ignored test lists.
> 3. **CI Pipeline Integration**: In scheduled release pipelines, full validation can be triggered using:
>    ```bash
>    cargo test -- --include-ignored
>    ```
> 
---

## 6. Related Terms


**None.**

---

## 7. Key Takeaways

- **`#[ignore]`** skips a test during a standard `cargo test` run.
- It must be used in combination with the `#[test]` attribute.
- It is heavily used for slow tests, network-dependent tests, or temporarily broken tests.
- You can run *only* the ignored tests using **`cargo test -- --ignored`**.
- You can provide a reason by writing `#[ignore = "reason"]`.
- The compiler still checks ignored tests for syntax and type errors, preventing "code rot"!
