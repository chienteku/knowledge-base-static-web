# Never Type (`!`)

> **Level 11 — Smart Pointers & Advanced Types**
> The type of expressions that never return (e.g. `loop {}`, `panic!`).

---

## 1. Prerequisites


- [Unit Struct](../level_02/unit_struct.md) — The type of a function that finishes but returns no data.
- [`panic!`](../level_04/panic.md) — A macro that crashes the program.
- [`loop`](../level_02/loop.md) — An infinite loop.

---

## 2. Term Category

**Rust-specific (the void that consumes)**: In many languages, functions that don't return any data return `void`. In Rust, `void` is represented by `()` (the Unit type). 

But what about a function that *literally never finishes executing* because it crashes the program, or runs in an infinite server loop forever? Rust has a special, mind-bending type just for this scenario: the **Never Type (`!`)**.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The Rust type-checker is mathematically obsessed with matching types. If you write an `if / else` statement, both branches *must* return the exact same type.

But consider this code:
```rust
let number: u32 = if user_input.is_ok() {
    5
} else {
    panic!("Invalid input!");
};
```
What type does `panic!` return? If it returned `()` (Unit), the compiler would throw a massive error because the `if` branch returns a `u32`, and `()` is not a `u32`. 

To solve this, the designers invented the Never Type (`!`). It is an empty type that physically cannot exist at runtime. Because it can never exist, the compiler allows it to "coerce" (magically morph) into **any other type in the entire language** to make the type-checker happy!

### (2) Reality Metaphor

Imagine you are a Toll Booth Operator on a highway. You mathematically require every single driver to hand you exactly $5 (the required return type).

- **Normal Return (`i32`)**: A driver pulls up, hands you $5, and drives away. The transaction is complete.
- **Unit Type (`()`)**: A driver pulls up, hands you an empty envelope, and drives away. The transaction is complete.
- **Never Type (`!`)**: A driver pulls up, stares at you, and suddenly their car explodes. They never handed you $5, but they also never drove away. The transaction never finished. You can just cross them off your list and pretend they paid, because they are gone forever.

### (3) Rust Code Examples

#### Short Snippet (Type Coercion)
Notice how the `todo!()` macro seamlessly morphs into a `String` to satisfy the compiler. `todo!` returns `!`.

```rust
fn fetch_user() -> String {
    // We haven't written this code yet. 
    // If todo!() returned `()`, the compiler would error!
    // Because it returns `!`, the compiler happily compiles the code!
    todo!("I will write this tomorrow");
}
```

#### Fuller Example (The Infinite Server)
If you are writing a web server or a background thread that is designed to run forever, it is considered a best practice to explicitly set the return type to `!`. This communicates to the compiler (and other developers) that this function will literally *never* yield control back to the caller.

```rust
use std::time::Duration;

// We explicitly declare that this function NEVER returns
fn run_background_worker() -> ! {
    loop {
        println!("Checking for new emails...");
        std::thread::sleep(Duration::from_secs(5));
        
        // Notice there is no `break` statement in this loop!
    }
}

fn main() {
    println!("Starting worker...");
    run_background_worker();
    
    // The compiler knows this next line of code is completely unreachable!
    // It will actually throw a "unreachable statement" warning!
    println!("This will never print!"); 
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Never Type Scoping and Lifecycle Rules

**The mistake:** Assuming Never Type instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("never_type_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("never_type_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Never Type State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Never Type through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Never Type Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Never Type instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Resilient Service Router with Diverging Error Fallbacks (`-> !`)

**Scenario:**
In a production microservice gateway, authentication tokens must be parsed into an `AuthContext`. However, when critical parsing failures occur (e.g. invalid format or expired token), the service policy dictates that execution must immediately trigger a fatal security panic via a dedicated diverging logger `fn log_and_terminate(err: AuthError) -> !`.

Implement `RequestRouter::resolve_or_diverge` and `RequestRouter::resolve_with_match`. Show how calling a diverging function returning `!` allows the error closure in `Result::unwrap_or_else` or the `Err` match arm to seamlessly coerce into the expected `AuthContext` type without type-checker errors. Include comprehensive unit tests verifying both successful token resolution and panic behavior on failure.

> [!check]- Answer
> **Implementation:**
>
> #### Implementation
>
> ```rust
> use std::fmt;
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct AuthContext {
>     pub user_id: u64,
>     pub role: String,
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum AuthError {
>     MissingHeader,
>     InvalidTokenFormat,
>     ExpiredToken,
> }
> 
> impl fmt::Display for AuthError {
>     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
>         write!(f, "{:?}", self)
>     }
> }
> 
> // Diverging function: execution terminates here and NEVER returns to caller.
> pub fn log_and_terminate(err: AuthError) -> ! {
>     panic!("CRITICAL SECURITY FAILURE: Terminating thread due to {:?}", err);
> }
> 
> pub struct RequestRouter;
> 
> impl RequestRouter {
>     // Parses auth token string into AuthContext.
>     pub fn parse_token(raw_token: &str) -> Result<AuthContext, AuthError> {
>         if raw_token.is_empty() {
>             return Err(AuthError::MissingHeader);
>         }
>         let parts: Vec<&str> = raw_token.split(':').collect();
>         if parts.len() != 2 {
>             return Err(AuthError::InvalidTokenFormat);
>         }
>         let user_id = parts[0].parse::<u64>().map_err(|_| AuthError::InvalidTokenFormat)?;
>         let role = parts[1].to_string();
>         if role == "expired" {
>             return Err(AuthError::ExpiredToken);
>         }
>         Ok(AuthContext { user_id, role })
>     }
> 
>     // Resolves context or invokes diverging fallback.
>     // Notice how `log_and_terminate` (type !) coercively satisfies the `AuthContext` return type!
>     pub fn resolve_or_diverge(raw_token: &str) -> AuthContext {
>         Self::parse_token(raw_token).unwrap_or_else(|err| log_and_terminate(err))
>     }
> 
>     // Alternative pattern using match expression where one arm returns `!`
>     pub fn resolve_with_match(raw_token: &str) -> AuthContext {
>         match Self::parse_token(raw_token) {
>             Ok(ctx) => ctx,
>             Err(err) => log_and_terminate(err), // type `!` coerces to AuthContext
>         }
>     }
> }
> 
> fn main() {
>     let ctx = RequestRouter::resolve_or_diverge("1001:admin");
>     println!("Successfully resolved context for user: {}", ctx.user_id);
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_valid_token_resolution() {
>         let raw = "42:developer";
>         let ctx = RequestRouter::resolve_or_diverge(raw);
>         assert_eq!(ctx.user_id, 42);
>         assert_eq!(ctx.role, "developer");
>     }
> 
>     #[test]
>     fn test_valid_token_match_resolution() {
>         let raw = "99:operator";
>         let ctx = RequestRouter::resolve_with_match(raw);
>         assert_eq!(ctx.user_id, 99);
>         assert_eq!(ctx.role, "operator");
>     }
> 
>     #[test]
>     fn test_parse_error_detection() {
>         let res = RequestRouter::parse_token("invalid_format");
>         assert!(matches!(res, Err(AuthError::InvalidTokenFormat)));
>     }
> 
>     #[test]
>     #[should_panic(expected = "CRITICAL SECURITY FAILURE")]
>     fn test_diverge_on_invalid_token() {
>         let _ = RequestRouter::resolve_or_diverge("invalid_format");
>     }
> }
> ```
> 
> #### Technical Explanation
>**
> 1. **Diverging Function Declaration (`-> !`)**: `log_and_terminate` explicitly declares `-> !` as its return type. Because the function body ends in `panic!`, control flow will never exit this function normally.
> 2. **Type Coercion in Closure & Match Arms**: `Result::unwrap_or_else` expects an error closure returning `AuthContext`. Because `log_and_terminate` returns `!`, the compiler automatically coerces `!` to `AuthContext`.
> 3. **Mathematical Guarantee**: The Rust type checker enforces that because `!` can never produce an actual runtime value, treating it as `AuthContext` is sound—execution stops before any value inspection takes place.
> 
---

### Exercise 2: Infallible Generic Pipeline Stages & Exhaustive Pattern Matching (`std::convert::Infallible`)

**Scenario:**
In high-throughput ETL pipelines, generic processing stages return `Result<T, E>`. However, certain transformations (such as string uppercase conversion) can mathematically never fail. Rust uses `std::convert::Infallible` (an uninhabited enum conceptually equivalent to the Never Type `!`) as the associated error type `type Error = Infallible;` for infallible operations.

Write a generic `PipelineStage` trait and implement an infallible `UppercaseStage`. Implement an `unwrap_infallible<T>(res: Result<T, Infallible>) -> T` helper function that extracts the inner value using exhaustive pattern matching (`match never {}`) without requiring runtime panic code. Include unit tests asserting correct processing and zero-overhead unwrapping.

> [!check]- Answer
> **Implementation:**
>
> #### Implementation
>
> ```rust
> use std::convert::Infallible;
> 
> pub trait PipelineStage {
>     type Output;
>     type Error;
> 
>     fn process(&self, input: &str) -> Result<Self::Output, Self::Error>;
> }
> 
> // An infallible stage that converts text to uppercase bytes.
> pub struct UppercaseStage;
> 
> impl PipelineStage for UppercaseStage {
>     type Output = Vec<u8>;
>     type Error = Infallible; // Infallible is an uninhabited type representing `!`
> 
>     fn process(&self, input: &str) -> Result<Self::Output, Self::Error> {
>         // Upper-casing string and converting to bytes can never fail!
>         Ok(input.to_uppercase().into_bytes())
>     }
> }
> 
> // Unwraps a Result whose error type is uninhabited (Infallible / !).
> // Because `Infallible` has no variants, the Err branch is statically unreachable.
> pub fn unwrap_infallible<T>(result: Result<T, Infallible>) -> T {
>     match result {
>         Ok(val) => val,
>         Err(never) => match never {}, // Exhaustive match on uninhabited type
>     }
> }
> 
> pub fn execute_infallible_pipeline(input: &str) -> Vec<u8> {
>     let stage = UppercaseStage;
>     let res = stage.process(input);
>     unwrap_infallible(res)
> }
> 
> fn main() {
>     let output = execute_infallible_pipeline("rust_never_type");
>     println!("Pipeline output bytes count: {}", output.len());
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_infallible_stage_execution() {
>         let stage = UppercaseStage;
>         let result = stage.process("hello_world");
>         assert!(result.is_ok());
>         
>         let bytes = unwrap_infallible(result);
>         assert_eq!(bytes, b"HELLO_WORLD");
>     }
> 
>     #[test]
>     fn test_pipeline_helper() {
>         let bytes = execute_infallible_pipeline("test_data_123");
>         assert_eq!(String::from_utf8(bytes).unwrap(), "TEST_DATA_123");
>     }
> 
>     #[test]
>     fn test_exhaustive_unwrapping_matches() {
>         let res: Result<i32, Infallible> = Ok(42);
>         let val = match res {
>             Ok(v) => v,
>             Err(never) => match never {},
>         };
>         assert_eq!(val, 42);
>     }
> }
> ```
> 
> #### Technical Explanation
>**
> 1. **Uninhabited Types**: `std::convert::Infallible` is defined as `enum Infallible {}` with 0 variants. Because it has no valid constructible instances, it represents the concept of `!`.
> 2. **Exhaustive Matching (`match never {}`)**: When pattern matching on an uninhabited enum value `never`, Rust recognizes that no branches exist. `match never {}` compiles cleanly and acts as an unreachable control flow statement of type `!`.
> 3. **Zero-Cost Unwrapping**: Unlike `.unwrap()` or `.expect()`, `unwrap_infallible` guarantees at compile time that panic code generation is entirely omitted, optimizing the compiled machine code.
> 
---

### Exercise 3: Worker State Machine with Diverging Flow Control (`break`, `continue`, `panic!`)

**Scenario:**
In a multi-threaded event processing system, background worker loops iterate through task commands (`Compute(u32)`, `Skip`, `FatalError(String)`, `Shutdown`).
Inside a `match` statement expecting a unified result type `u32`:
- `Command::Compute(val)` yields `val * 2` (`u32`).
- `Command::Skip` executes `continue` (type `!`).
- `Command::Shutdown` executes `break` (type `!`).
- `Command::FatalError(msg)` invokes `handle_fatal(&msg)` (type `!`).

Implement `WorkerLoop::run_queue` showcasing how `break`, `continue`, and diverging function calls all evaluate to type `!`, allowing them to satisfy the expected `u32` return type of the match expression. Write comprehensive unit tests for normal processing, early shutdown, skips, and panic behavior.

> [!check]- Answer
> **Implementation:**
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq, Clone)]
> pub enum Command {
>     Compute(u32),
>     Skip,
>     FatalError(String),
>     Shutdown,
> }
> 
> #[derive(Debug, Default)]
> pub struct WorkerStats {
>     pub processed_count: usize,
>     pub total_sum: u64,
> }
> 
> pub fn handle_fatal(msg: &str) -> ! {
>     panic!("WORKER FATAL PANIC: {}", msg);
> }
> 
> pub struct WorkerLoop;
> 
> impl WorkerLoop {
>     // Processes a stream of commands, accumulating results into WorkerStats.
>     // Demonstrates how `continue`, `break`, and `handle_fatal` (all type `!`)
>     // coerce into `u32` inside the `match` block!
>     pub fn run_queue(commands: Vec<Command>) -> WorkerStats {
>         let mut stats = WorkerStats::default();
>         let mut iter = commands.into_iter();
> 
>         loop {
>             let cmd = match iter.next() {
>                 Some(c) => c,
>                 None => break, // `break` has type `!`, coercing to Command
>             };
> 
>             // Every match arm must unify to `u32`.
>             // `continue`, `break`, and `handle_fatal` return `!` which coerces to `u32`!
>             let processed_value: u32 = match cmd {
>                 Command::Compute(val) => val * 2,
>                 Command::Skip => continue, // type `!`
>                 Command::Shutdown => break, // type `!`
>                 Command::FatalError(msg) => handle_fatal(&msg), // type `!`
>             };
> 
>             stats.processed_count += 1;
>             stats.total_sum += processed_value as u64;
>         }
> 
>         stats
>     }
> }
> 
> fn main() {
>     let cmds = vec![Command::Compute(10), Command::Skip, Command::Compute(20), Command::Shutdown];
>     let stats = WorkerLoop::run_queue(cmds);
>     println!("Processed {} tasks, total sum: {}", stats.processed_count, stats.total_sum);
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_worker_normal_and_skip() {
>         let cmds = vec![
>             Command::Compute(5),  // processed_value = 10
>             Command::Skip,        // skipped via `continue` (type !)
>             Command::Compute(15), // processed_value = 30
>         ];
>         let stats = WorkerLoop::run_queue(cmds);
>         assert_eq!(stats.processed_count, 2);
>         assert_eq!(stats.total_sum, 40);
>     }
> 
>     #[test]
>     fn test_worker_early_shutdown() {
>         let cmds = vec![
>             Command::Compute(10), // processed_value = 20
>             Command::Shutdown,    // loop terminates via `break` (type !)
>             Command::Compute(100),// never reached
>         ];
>         let stats = WorkerLoop::run_queue(cmds);
>         assert_eq!(stats.processed_count, 1);
>         assert_eq!(stats.total_sum, 20);
>     }
> 
>     #[test]
>     #[should_panic(expected = "WORKER FATAL PANIC: Memory corrupted")]
>     fn test_worker_fatal_error_diverges() {
>         let cmds = vec![
>             Command::Compute(1),
>             Command::FatalError("Memory corrupted".to_string()),
>         ];
>         let _ = WorkerLoop::run_queue(cmds);
>     }
> 
>     #[test]
>     fn test_empty_queue() {
>         let stats = WorkerLoop::run_queue(vec![]);
>         assert_eq!(stats.processed_count, 0);
>         assert_eq!(stats.total_sum, 0);
>     }
> }
> ```
> 
> #### Technical Explanation
>**
> 1. **Diverging Control Keywords**: In Rust syntax, `continue`, `break`, and `return` are expressions, and their static type is `!`.
> 2. **Match Arm Unification**: A `match` expression requires every branch to return the same type (here, `u32`). Because `!` coercively unifies with any type, branches returning `continue`, `break`, or calling `handle_fatal(...)` satisfy the `u32` requirement seamlessly.
> 3. **Unreachable Code Elimination**: Code located after a `!` expression (such as processing statistics after `continue` or `break`) is skipped at runtime, ensuring strict control flow safety.
> 
---

## 6. Related Terms


- [Unit Struct](../level_02/unit_struct.md) — The type of a function that finishes safely but yields no data.
- [`panic!`](../level_04/panic.md) — The most common expression that returns `!`.
- [`panic!`](../level_04/panic.md) — Macros that return `!` to help you stub out code.
- [`let else` Statement](../level_02/let_else_statement.md) — Related concept: `let else` Statement.
- [`todo!` / `unimplemented!` / `unreachable!`](../level_04/todo_unimplemented_unreachable.md) — Related concept: `todo!` / `unimplemented!` / `unreachable!`.
- [Unit Type (`()`)](../level_01/unit_type.md) — Related concept: Unit Type (`()`).

---

## 7. Key Takeaways

- The **Never Type (`!`)** represents an expression that will *never* finish executing.
- It is returned by infinite loops (`loop {}`), crashes (`panic!`, `unimplemented!`, `todo!`), and process exits (`std::process::exit`).
- Because a Never Type never finishes, the compiler allows it to automatically **"coerce"** (morph) into any other type in the language to satisfy type-checking requirements.
- Do not confuse `!` (the function crashes or hangs forever) with `()` (the function finishes safely but yields no data).
