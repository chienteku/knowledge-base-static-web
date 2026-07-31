# Shadowing

> **Level 1 — Foundations**
> Re-declaring a variable with the same name in the same scope, optionally changing its type.

---

## 1. Prerequisites

- [Variable](../level_01/variable.md) — The named bindings that are being re-declared.
- [Mutability (`mut`)](../level_01/mutability_mut.md) — Shadowing is often used as a safer, cleaner alternative to mutability.

---

## 2. Term Category

**Rust-specific**: While other languages allow variables in inner scopes to shadow outer scopes, Rust actively encourages intentional shadowing *in the exact same scope* as an idiomatic way to transform data without inventing awkward variable names.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In strict languages like C# or Java, once you declare a variable named `input`, that name is permanently taken for that entire block of code. If `input` starts as a string (from a user typing), but you need to convert it into a number to do math, you are forced to invent awkward, slightly different names like `input_str` and `input_int`.

Rust solves this naming fatigue through **Shadowing**. By simply using the `let` keyword again with the exact same name, you create a *brand new* variable that hides the old one. This is incredibly powerful for two reasons:
1. **You can change the data type.** (e.g., parsing a `String` into an `i32`).
2. **It preserves immutability.** The new variable is still immutable by default. You transformed the data safely without having to make the variable `mut`, locking it down from accidental changes later.

### (2) Reality Metaphor

Imagine an actor performing in a one-person play. The actor's name is "Sam" (the variable name). 

In Scene 1, Sam plays a king. In Scene 2, Sam walks behind the curtain (the `let` keyword), quickly changes costumes, and walks back out as a peasant. Even though you are still looking at "Sam", the king is gone, completely overshadowed by the new character. Sam has entirely changed their "type" and "value" without you having to hire a second actor named "Sam_2".

### (3) Rust Code Examples

#### Short Snippet
```rust
let x = 5;

// We use `let` again to shadow the old `x` with a new `x`.
let x = x + 1; 

println!("The value is: {}", x); // Prints 6
```

#### Fuller Example
```rust
fn main() {
    // 1. We get some input from a user (a String).
    let guess = "42";
    
    // 2. We need it to be a number, not a string.
    // Instead of naming this `guess_number`, we just shadow `guess`!
    // We use `let` again to create a completely new variable with the same name,
    // changing its type from `&str` to `u32`.
    let guess: u32 = guess.parse().unwrap();
    
    println!("You guessed the number: {}", guess);
    
    // Note: We couldn't have done this using `mut`.
    // Mutability allows changing the VALUE, but NOT the TYPE.
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Shadowing Scoping and Lifecycle Rules

**The mistake:** Assuming Shadowing instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("shadowing_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("shadowing_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Shadowing State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Shadowing through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Shadowing Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Shadowing instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Multi-Stage Telemetry Configuration Ingestion & Type Transformation

**Problem:** In high-throughput microservices, configuration parameters often arrive from environment variables or remote config servers as raw, untrusted strings (e.g. `"  9090 \n"`). Standard imperative code often introduces clutter with intermediate variable names like `port_raw_str`, `port_trimmed_str`, `port_u16_num`, and `port_endpoint_addr`. In Rust, **variable shadowing** allows developers to re-bind the same variable identifier (`port`) across sequential parsing, sanitization, validation, and domain-object construction stages without introducing mutability or variable name proliferation.

Implement a function `parse_service_port(raw_input: &str) -> Result<ServiceEndpoint, ConfigError>` that sequentially shadows `port`:
1. Trim whitespace from the raw string (`&str` -> `&str`).
2. Parse string into a numerical representation (`u16`).
3. Validate that `port >= 1024` (non-privileged range).
4. Package into a `ServiceEndpoint` struct (`ServiceEndpoint { port }`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq)]
> pub enum ConfigError {
>     EmptyInput,
>     InvalidNumericFormat(String),
>     RestrictedPortRange(u16),
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct ServiceEndpoint {
>     pub port: u16,
> }
> 
> pub fn parse_service_port(raw_input: &str) -> Result<ServiceEndpoint, ConfigError> {
>     if raw_input.trim().is_empty() {
>         return Err(ConfigError::EmptyInput);
>     }
> 
>     // Stage 1: Shadow `port` to store the trimmed string slice (&str -> &str)
>     let port = raw_input.trim();
> 
>     // Stage 2: Shadow `port` to transform string slice into numerical integer (&str -> u16)
>     let port: u16 = port
>         .parse()
>         .map_err(|_| ConfigError::InvalidNumericFormat(port.to_string()))?;
> 
>     // Stage 3: Validate domain invariants on numerical port
>     if port < 1024 {
>         return Err(ConfigError::RestrictedPortRange(port));
>     }
> 
>     // Stage 4: Shadow `port` into final ServiceEndpoint domain struct
>     let port = ServiceEndpoint { port };
> 
>     Ok(port)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_valid_port_parsing_and_shadowing() {
>         let raw = "  8080 \t\n";
>         let result = parse_service_port(raw);
>         assert!(result.is_ok());
>         let endpoint = result.unwrap();
>         assert_eq!(endpoint, ServiceEndpoint { port: 8080 });
>     }
> 
>     #[test]
>     fn test_empty_port_error() {
>         let raw = "   \n";
>         let result = parse_service_port(raw);
>         assert_eq!(result, Err(ConfigError::EmptyInput));
>         assert!(matches!(result, Err(ConfigError::EmptyInput)));
>     }
> 
>     #[test]
>     fn test_invalid_numeric_format() {
>         let raw = "8080a";
>         let result = parse_service_port(raw);
>         assert_ne!(result, Ok(ServiceEndpoint { port: 8080 }));
>         assert!(matches!(result, Err(ConfigError::InvalidNumericFormat(_))));
>     }
> 
>     #[test]
>     fn test_restricted_port_range() {
>         let raw = "80";
>         let result = parse_service_port(raw);
>         assert_eq!(result, Err(ConfigError::RestrictedPortRange(80)));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Why the Solution Works:**
>    - Sequential shadowing (`let port = ...`) allows `port` to transition across distinct types (`&str` -> `&str` -> `u16` -> `ServiceEndpoint`) within the exact same lexical scope without declaring auxiliary variable names (`port_str`, `port_num`).
> 2. **Language Invariants:**
>    - Rust variables declared with `mut` permit value reassignment, but strictly disallow changing the variable's type. Shadowing re-declares a brand-new variable binding that hides the previous one, allowing type transformation while maintaining immutability by default.
> 3. **Lifetime, Ownership & Concurrency:**
>    - `raw_input` is borrowed as `&str`. `port.trim()` creates a slice referencing `raw_input`. When `port` is parsed into `u16`, an owned stack value (`Copy`) is created. Wrapping `u16` inside `ServiceEndpoint` yields an owned, self-contained struct without dangling lifetime dependencies.
> 4. **Edge Cases:**
>    - Empty strings or whitespace-only inputs (`"   \n"`) trigger `ConfigError::EmptyInput`.
>    - Non-numeric text (`"8080a"`) fails parsing with `ConfigError::InvalidNumericFormat`.
>    - Privileged ports (`< 1024`) fail domain validation returning `ConfigError::RestrictedPortRange`.
>

---

### Exercise 2: Financial Order Engine Typestate Transitions via Shadowing

**Problem:** In high-frequency financial trading systems, transactions pass through strict typestate transitions (`Raw` -> `Signed` -> `Executed`). Preventing accidental reuse of intermediate unvalidated transactions is paramount. Combining the **Typestate Pattern** with **variable shadowing** allows developers to shadow `tx` at every state transition. This moves ownership of the old transaction state and hides its binding, ensuring that unvalidated states cannot be accessed after transition.

Implement a financial order processor `process_financial_ledger_entry(raw: Transaction<RawState>) -> Result<Transaction<ExecutedState>, TransactionError>`:
1. Shadow `tx` by validating the digital signature metadata (`RawState` -> `SignedState`).
2. Shadow `tx` by applying transaction fee deduction (`SignedState` -> `ExecutedState`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::marker::PhantomData;
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct RawState;
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct SignedState;
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct ExecutedState;
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct Transaction<State> {
>     pub account_id: String,
>     pub amount: u64,
>     pub fee: u64,
>     pub signature: Option<String>,
>     _state: PhantomData<State>,
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum TransactionError {
>     MissingSignature,
>     InsufficientBalanceForFee { amount: u64, fee: u64 },
> }
> 
> impl Transaction<RawState> {
>     pub fn new(account_id: impl Into<String>, amount: u64, fee: u64, signature: Option<String>) -> Self {
>         Self {
>             account_id: account_id.into(),
>             amount,
>             fee,
>             signature,
>             _state: PhantomData,
>         }
>     }
> 
>     pub fn sign(self) -> Result<Transaction<SignedState>, TransactionError> {
>         if self.signature.is_none() {
>             return Err(TransactionError::MissingSignature);
>         }
> 
>         Ok(Transaction {
>             account_id: self.account_id,
>             amount: self.amount,
>             fee: self.fee,
>             signature: self.signature,
>             _state: PhantomData,
>         })
>     }
> }
> 
> impl Transaction<SignedState> {
>     pub fn execute(self) -> Result<Transaction<ExecutedState>, TransactionError> {
>         if self.amount < self.fee {
>             return Err(TransactionError::InsufficientBalanceForFee {
>                 amount: self.amount,
>                 fee: self.fee,
>             });
>         }
> 
>         let net_amount = self.amount - self.fee;
> 
>         Ok(Transaction {
>             account_id: self.account_id,
>             amount: net_amount,
>             fee: self.fee,
>             signature: self.signature,
>             _state: PhantomData,
>         })
>     }
> }
> 
> pub fn process_financial_ledger_entry(
>     raw: Transaction<RawState>,
> ) -> Result<Transaction<ExecutedState>, TransactionError> {
>     let tx = raw;
> 
>     // Step 1: Shadow `tx` by transitioning from RawState to SignedState
>     let tx = tx.sign()?;
> 
>     // Step 2: Shadow `tx` again by transitioning from SignedState to ExecutedState
>     let tx = tx.execute()?;
> 
>     Ok(tx)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_successful_typestate_shadowing_pipeline() {
>         let raw = Transaction::new("ACC_1001", 500, 15, Some("sig_valid_99".to_string()));
>         let result = process_financial_ledger_entry(raw);
> 
>         assert!(result.is_ok());
>         let tx_final = result.unwrap();
> 
>         assert_eq!(tx_final.account_id, "ACC_1001");
>         assert_eq!(tx_final.amount, 485);
>         assert_eq!(tx_final.fee, 15);
>         assert_ne!(tx_final.amount, 500);
>     }
> 
>     #[test]
>     fn test_missing_signature_error() {
>         let raw = Transaction::new("ACC_1002", 500, 15, None);
>         let result = process_financial_ledger_entry(raw);
> 
>         assert_eq!(result, Err(TransactionError::MissingSignature));
>         assert!(matches!(result, Err(TransactionError::MissingSignature)));
>     }
> 
>     #[test]
>     fn test_insufficient_fee_error() {
>         let raw = Transaction::new("ACC_1003", 10, 50, Some("sig_valid_100".to_string()));
>         let result = process_financial_ledger_entry(raw);
> 
>         assert_eq!(
>             result,
>             Err(TransactionError::InsufficientBalanceForFee { amount: 10, fee: 50 })
>         );
>         assert!(matches!(
>             result,
>             Err(TransactionError::InsufficientBalanceForFee { .. })
>         ));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Why the Solution Works:**
>    - The function shadow-binds `tx` across distinct generic struct types (`Transaction<RawState>` -> `Transaction<SignedState>` -> `Transaction<ExecutedState>`). Shadowing hides previous variables with identical names, enforcing that stale state representations become unreachable in subsequent code lines.
> 2. **Language Invariants:**
>    - Reassigning `tx = tx.sign()?` would fail to compile because reassignment requires exact type identity. Shadowing (`let tx = tx.sign()?`) declares a new variable binding with a distinct generic type parameter. Taking ownership (`self`) ensures the previous struct instance is moved and rendered unusable.
> 3. **Lifetime, Ownership & Concurrency:**
>    - Ownership of underlying fields (`account_id`, `signature`) is transferred from the old state struct into the new state struct. No reference lifetimes are held, producing owned structs that satisfy `Send` and can cross async/thread boundaries cleanly.
> 4. **Edge Cases:**
>    - Missing signatures fail at `RawState::sign()`, returning `TransactionError::MissingSignature`.
>    - Insufficient balances where fee exceeds transaction amount fail at `SignedState::execute()`, returning `TransactionError::InsufficientBalanceForFee`.
>

---

### Exercise 3: Zero-Trust Security Token Redaction & Nested Scope Block Shadowing

**Problem:** In zero-trust authorization systems, audit loggers must record incoming requests without writing raw authentication tokens or secret credentials to log files. Using **nested scope block shadowing**, a secret identifier (`token`) can be shadowed inside an isolated block (`{ ... }`) with a redacted string representation (`"Bearer usr_..."`). Once the logging block exits, the inner redacted variable is dropped, restoring visibility of the outer unredacted token for downstream payload parsing and claim extraction.

Implement `process_auth_request(header_value: &str, log_output: &mut Vec<String>) -> Result<TokenClaims, AuthError>`:
1. Strip `"Bearer "` header prefix and shadow `token` to store the raw token slice (`&str`).
2. Open a block scope `{ ... }` and shadow `token` into a redacted string slice/formatted string for logging.
3. Exit the block scope (dropping the redacted `token`), exposing the outer `token` slice again.
4. Parse/shadow `token` in the outer scope into a `TokenClaims` struct.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq)]
> pub enum AuthError {
>     InvalidHeaderFormat,
>     EmptyTokenPayload,
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct TokenClaims {
>     pub user_id: String,
>     pub role: String,
> }
> 
> pub fn process_auth_request(
>     header_value: &str,
>     log_output: &mut Vec<String>,
> ) -> Result<TokenClaims, AuthError> {
>     let token = header_value.trim();
> 
>     // Step 1: Strip 'Bearer ' prefix and shadow `token` to store raw secret slice (&str)
>     let token = token
>         .strip_prefix("Bearer ")
>         .ok_or(AuthError::InvalidHeaderFormat)?
>         .trim();
> 
>     if token.is_empty() {
>         return Err(AuthError::EmptyTokenPayload);
>     }
> 
>     // Step 2: Inner Lexical Scope Block Shadowing for safe audit logging
>     {
>         // Shadow `token` inside this block with a redacted mask string
>         let token = if token.len() > 6 {
>             format!("Bearer {}...", &token[..4])
>         } else {
>             "Bearer [REDACTED]".to_string()
>         };
> 
>         // Record log entry using inner shadowed `token`
>         log_output.push(format!("AUDIT LOG: Processing request for token {}", token));
> 
>         // Inner `token` drops here when exiting scope block!
>     }
> 
>     // Step 3: Outer scope retains the original unredacted `token` slice!
>     // Shadow `token` into a decoded domain `TokenClaims` struct
>     let parts: Vec<&str> = token.split(':').collect();
>     let (user_id, role) = if parts.len() == 2 {
>         (parts[0].to_string(), parts[1].to_string())
>     } else {
>         (token.to_string(), "user".to_string())
>     };
> 
>     let token = TokenClaims { user_id, role };
> 
>     Ok(token)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_audit_logging_and_scope_shadowing() {
>         let mut log_output = Vec::new();
>         let header = "Bearer usr_9876:admin";
> 
>         let result = process_auth_request(header, &mut log_output);
> 
>         assert!(result.is_ok());
>         let claims = result.unwrap();
>         assert_eq!(claims.user_id, "usr_9876");
>         assert_eq!(claims.role, "admin");
> 
>         assert_eq!(log_output.len(), 1);
>         assert!(log_output[0].contains("usr_..."));
>         assert!(!log_output[0].contains("usr_9876:admin"));
>     }
> 
>     #[test]
>     fn test_invalid_header_format() {
>         let mut log_output = Vec::new();
>         let header = "Basic usr_9876:admin";
> 
>         let result = process_auth_request(header, &mut log_output);
>         assert_eq!(result, Err(AuthError::InvalidHeaderFormat));
>         assert!(matches!(result, Err(AuthError::InvalidHeaderFormat)));
>         assert_eq!(log_output.len(), 0);
>     }
> 
>     #[test]
>     fn test_empty_token_payload() {
>         let mut log_output = Vec::new();
>         let header = "Bearer    ";
> 
>         let result = process_auth_request(header, &mut log_output);
>         assert_eq!(result, Err(AuthError::EmptyTokenPayload));
>         assert!(matches!(result, Err(AuthError::EmptyTokenPayload)));
>         assert_eq!(log_output.len(), 0);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Why the Solution Works:**
>    - Inside the nested block `{ let token = format!(...); ... }`, the local `token` shadows the outer `token` slice. Pushing to `log_output` uses this inner redacted `token`. When the block terminates, the inner binding drops, revealing the outer unredacted `token` binding.
> 2. **Language Invariants:**
>    - Rust enforces strict lexical scoping rules. Shadowing within a nested block is temporary and isolated to that block scope. It does not overwrite, mutate, or drop the outer scope's binding.
> 3. **Lifetime, Ownership & Concurrency:**
>    - The outer `token` is a borrowed string sub-slice (`&str`) derived from `header_value`. The inner scope allocates an owned `String` for the redacted text, which is freed immediately upon block exit. The final claims struct owns its field strings (`user_id`, `role`), preventing dangling references.
> 4. **Edge Cases:**
>    - Headers missing `"Bearer "` prefix trigger `AuthError::InvalidHeaderFormat`.
>    - Empty token payloads trigger `AuthError::EmptyTokenPayload`.
>    - Tokens shorter than 6 characters use fallback redaction `"Bearer [REDACTED]"`.
>

---

## 6. Related Terms

- [Mutability (`mut`)](../level_01/mutability_mut.md) — The alternative approach. Use `mut` when you want to change the *value* in a loop or over time. Use shadowing when you want to change the *type* or apply a one-time transformation.
- [Variable](../level_01/variable.md) — The basic named binding that shadowing replaces.

---

## 7. Key Takeaways

- Shadowing is performed by using the `let` keyword on a variable name that already exists.
- Shadowing creates a **completely new variable** that hides the previous one.
- Unlike `mut`, shadowing allows you to change the **data type** of a variable.
- Shadowing allows you to reuse clean variable names (like `input`) instead of inventing messy ones (like `input_str` and `input_int`).
