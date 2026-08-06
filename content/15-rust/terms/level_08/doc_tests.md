# Doc Tests

> **Level 8 — Testing & Documentation**
> Code examples in doc comments (`///`) that are compiled and run as tests.

---

## 1. Prerequisites


- [Comments](../level_01/comments.md) — The `///` syntax used to write documentation for functions.

---

## 2. Term Category

**Rust Tooling (the documentation enforcer)**: In most languages, documentation is just raw text. If you write a code example in the comments showing how to use your function, and then 6 months later you change the function's arguments, your documentation is now broken and lying to your users! 

Rust prevents this by turning your documentation examples into actual, runnable tests. When you run `cargo test`, Cargo extracts all the code blocks from your comments and executes them.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The Rust designers wanted `crates.io` to be the best, most reliable package registry in the world. Good packages require good documentation, and good documentation absolutely requires code examples. 

But code examples rot faster than anything else in a codebase. A developer updates the code but forgets to update the comments. 

By automatically extracting all markdown code blocks out of `///` comments and running them during `cargo test`, Rust guarantees that every single code example in your documentation actually compiles and works perfectly. If your code example is outdated, your build fails!

### (2) Reality Metaphor

Imagine reading an instruction manual for a new Blender. 

The manual says: *"Press the RED button to blend."* But the factory updated the blender 3 months ago, and now the button is BLUE. You press the red button, and the blender catches on fire. The manual lied to you!

A **Doc Test** is like a factory robot that reads the instruction manual every single night, presses the exact buttons the manual tells it to press on a real blender, and throws a massive alarm if the blender doesn't turn on.

### (3) Rust Code Examples

#### Short Snippet (The Basic Doc Test)
You don't need `#[test]`. You literally just write a markdown code block inside a triple-slash comment!

```rust
/// Adds two numbers together.
///
/// # Examples
///
/// ```
/// let result = my_library::add(2, 2);
/// assert_eq!(result, 4);
/// ```
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}
```
When you run `cargo test`, Cargo will say: `Doc-tests my_library ... ok`!

#### Fuller Example (Hiding Boilerplate)
Sometimes you need 10 lines of setup code (like connecting to a database) just to make a 2-line code example work. But you don't want the reader to see that ugly setup code in the documentation! 

Rust allows you to prefix lines with `# ` inside the code block. These lines are hidden from the reader in the final documentation, but the compiler still sees them and runs them!

```rust
/// Fetches the active user from the database.
///
/// ```
/// # // The reader will NOT see these hidden setup lines!
/// # let db = Database::connect_mock();
/// # db.insert_test_user("Alice");
/// #
/// // The reader WILL see this!
/// let user = my_library::get_user(&db);
/// assert_eq!(user.name, "Alice");
/// ```
pub fn get_user(db: &Database) -> User { ... }
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Doc Tests Scoping and Lifecycle Rules

**The mistake:** Assuming Doc Tests instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("doc_tests_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("doc_tests_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Doc Tests State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Doc Tests through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Doc Tests Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Doc Tests instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Asynchronous Database Client Doc Tests with `#` Hidden Hashing & Connection Setup

**Scenario:** **Problem Statement:**
You are authoring library documentation for a high-performance database connection pool (`AsyncDbClient`). The documentation needs to demonstrate how users query database records using doc tests, while using `#` hidden lines to perform mock connection initialization and setup without cluttering the rendered documentation HTML.

**Requirements:**
Requirements:
1. Define `DbError` enum with `NotFound` and `ConnectionFailed` variants deriving `Debug` and `PartialEq`.
2. Struct `AsyncDbClient` storing `url: String` and internal record cache `HashMap<String, String>`.
3. Implement `AsyncDbClient::connect(url: &str) -> Result<Self, DbError>` and `query_user_role(&self, username: &str) -> Result<String, DbError>`.
4. Include a comprehensive `///` doc comment on `query_user_role` containing runnable doc tests that hide connection setup boilerplate using `#`.
5. In `#[cfg(test)] mod tests`, write unit tests verifying query successes, missing users, and assertions (`assert_eq!`, `assert!`, `assert_ne!`, `matches!`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::HashMap;
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum DbError {
>     NotFound(String),
>     ConnectionFailed,
> }
> 
> /// Client for interacting with remote database clusters.
> pub struct AsyncDbClient {
>     url: String,
>     records: HashMap<String, String>,
> }
> 
> impl AsyncDbClient {
>     /// Connects to a remote database cluster specified by `url`.
>     pub fn connect(url: &str) -> Result<Self, DbError> {
>         if url.is_empty() {
>             return Err(DbError::ConnectionFailed);
>         }
>         let mut records = HashMap::new();
>         records.insert("alice".to_string(), "admin".to_string());
>         records.insert("bob".to_string(), "user".to_string());
>         Ok(Self {
>             url: url.to_string(),
>             records,
>         })
>     }
> 
>     /// Queries the user role for `username`.
>     ///
>     /// # Examples
>     /// ```
>     /// # use std::error::Error;
>     /// # fn main() -> Result<(), Box<dyn Error>> {
>     /// # let client = AsyncDbClient::connect("postgres://localhost:5432/db")?;
>     /// let role = client.query_user_role("alice")?;
>     /// assert_eq!(role, "admin");
>     /// # Ok(())
>     /// # }
>     /// ```
>     pub fn query_user_role(&self, username: &str) -> Result<String, DbError> {
>         self.records
>             .get(username)
>             .cloned()
>             .ok_or_else(|| DbError::NotFound(username.to_string()))
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_db_client_queries() {
>         let client = AsyncDbClient::connect("postgres://localhost:5432/db").unwrap();
> 
>         let role = client.query_user_role("alice");
>         assert!(role.is_ok());
>         assert_eq!(role.unwrap(), "admin");
> 
>         let err = client.query_user_role("charlie");
>         assert!(matches!(err, Err(DbError::NotFound(_))));
>     }
> }
> ```
> 
> **Technical Explanation:**
> 1. **Hidden Setup Lines (`#`)**: Lines starting with `#` in doc test markdown blocks run during `cargo test --doc`, but are omitted from HTML rendered by `cargo doc`. This keeps user-facing examples clean while ensuring code correctness.
> 2. **Fallible Doc Tests**: Returning `Result<(), Box<dyn Error>>` inside hidden `main()` blocks allows using `?` operators directly inside documentation examples.
> 
---

### Exercise 2: `should_panic` Doc Tests for Bounded Buffer Invariants

**Scenario:** **Problem Statement:**
Doc tests can verify intentional failure modes. You are implementing a fixed-capacity circular buffer (`BoundedBuffer<T>`) that panics if initialized with zero capacity or when pushing beyond capacity. You must document these panicking behaviors using ```` ```should_panic ```` doc tests.

**Requirements:**
Requirements:
1. Struct `BoundedBuffer<T>` holding `storage: Vec<T>` and `capacity: usize`.
2. Implement `BoundedBuffer::new(capacity: usize) -> Self` (panics with `"Capacity must be non-zero"` if `capacity == 0`).
3. Implement `push(&mut self, item: T)` (panics with `"Buffer overflow"` if `storage.len() >= capacity`).
4. Write `///` doc comments for `new` and `push` containing runnable `should_panic` doc tests.
5. In `#[cfg(test)] mod tests`, write unit tests verifying non-panicking push/pop operations and assertions (`assert_eq!`, `assert!`, `assert_ne!`, `matches!`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> /// Fixed-capacity circular element buffer.
> pub struct BoundedBuffer<T> {
>     storage: Vec<T>,
>     capacity: usize,
> }
> 
> impl<T> BoundedBuffer<T> {
>     /// Creates a new [`BoundedBuffer`] with the specified capacity.
>     ///
>     /// # Panics
>     /// Panics if `capacity` is 0.
>     ///
>     /// # Examples
>     /// ```should_panic
>     /// # use std::panic;
>     /// // Panics because capacity is zero
>     /// let buffer: BoundedBuffer<i32> = BoundedBuffer::new(0);
>     /// ```
>     pub fn new(capacity: usize) -> Self {
>         assert!(capacity > 0, "Capacity must be non-zero");
>         Self {
>             storage: Vec::with_capacity(capacity),
>             capacity,
>         }
>     }
> 
>     /// Pushes an item into the buffer.
>     ///
>     /// # Panics
>     /// Panics if the buffer is at capacity.
>     ///
>     /// # Examples
>     /// ```should_panic
>     /// # let mut buffer = BoundedBuffer::new(1);
>     /// buffer.push(10);
>     /// buffer.push(20); // Panics due to overflow
>     /// ```
>     pub fn push(&mut self, item: T) {
>         assert!(self.storage.len() < self.capacity, "Buffer overflow");
>         self.storage.push(item);
>     }
> 
>     /// Removes and returns the last element.
>     pub fn pop(&mut self) -> Option<T> {
>         self.storage.pop()
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_buffer_operations() {
>         let mut buf = BoundedBuffer::new(2);
>         buf.push(100);
>         buf.push(200);
> 
>         assert_eq!(buf.pop(), Some(200));
>         assert_eq!(buf.pop(), Some(100));
>         assert_eq!(buf.pop(), None);
>     }
> }
> ```
> 
> **Technical Explanation:**
> 1. **Testing Panic Contracts with `should_panic`**: Adding `should_panic` to a doc test code fence tells `cargo test --doc` to expect a panic. If the example runs without panicking, the doc test fails.
> 2. **Executable API Contract Verification**: `should_panic` doc tests mathematically guarantee that documentation warnings regarding panics accurately reflect implementation behavior.
> 
---

### Exercise 3: Cross-Crate Intra-Doc Links & Complex Doc Test Verification

**Scenario:** **Problem Statement:**
When writing crate documentation, doc tests often demonstrate complex type interactions while relying on intra-doc links (`[`Token`]`, `[`AuthEngine`]`) to connect related items.

**Requirements:**
Requirements:
1. Define struct `Token` with `id: String` and `expires_at: u64`.
2. Define `AuthEngine` with method `validate(&self, token: &Token) -> bool`.
3. Document `AuthEngine::validate` with doc comments containing intra-doc links and runnable doc tests demonstrating token validation.
4. In `#[cfg(test)] mod tests`, write unit tests verifying expired vs active token checks with assertions (`assert_eq!`, `assert!`, `assert_ne!`, `matches!`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> /// Authentication security token.
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct Token {
>     pub id: String,
>     pub expires_at: u64,
> }
> 
> /// Engine for validating incoming authentication [`Token`] instances.
> pub struct AuthEngine {
>     pub current_time: u64,
> }
> 
> impl AuthEngine {
>     /// Constructs a new [`AuthEngine`] initialized to `current_time`.
>     pub fn new(current_time: u64) -> Self {
>         Self { current_time }
>     }
> 
>     /// Validates whether a [`Token`] is valid and not expired.
>     ///
>     /// # Examples
>     /// ```
>     /// let engine = AuthEngine::new(1000);
>     /// let token = Token { id: "tok_123".to_string(), expires_at: 2000 };
>     /// assert!(engine.validate(&token));
>     /// ```
>     pub fn validate(&self, token: &Token) -> bool {
>         !token.id.is_empty() && token.expires_at > self.current_time
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_token_validation() {
>         let engine = AuthEngine::new(1000);
>         let valid_token = Token { id: "valid_1".to_string(), expires_at: 1500 };
>         let expired_token = Token { id: "expired_1".to_string(), expires_at: 500 };
> 
>         assert!(engine.validate(&valid_token));
>         assert!(!engine.validate(&expired_token));
>         assert_ne!(valid_token, expired_token);
>     }
> }
> ```
> 
> **Technical Explanation:**
> 1. **Intra-Doc Hyperlinking**: Branded bracket references (e.g. `[`Token`]`) auto-link across HTML generated by `cargo doc`.
> 2. **Doc Test Execution**: `cargo test --doc` compiles code examples as external consumers, catching missing imports or scope errors.
> 
---

## 6. Related Terms


- [`cargo doc`](cargo_doc.md) — The command that actually generates the beautiful HTML website from these `///` comments.
- [Integration Tests](integration_tests.md) — Like Integration Tests, Doc Tests can only test the `pub` API of a Library crate.

---

## 7. Key Takeaways

- Any ` ``` ` code block inside a `///` doc comment is automatically compiled and run as a test.
- This mathematically guarantees your documentation is never outdated or lying to the user.
- You can hide ugly boilerplate setup code in your examples by prefixing the lines with `# `.
- Just like Integration Tests, Doc Tests only run for Library Crates (`src/lib.rs`), not Binary Crates (`main.rs`).
