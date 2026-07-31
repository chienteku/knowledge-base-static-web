# Integration Tests

> **Level 8 — Testing & Documentation**
> Tests in the `tests/` directory; each file is compiled as a separate crate.

---

## 1. Prerequisites

- [`#[test]`](../level_08/test_attribute.md) — The attribute used to mark functions as tests.
- [`pub` Visibility](../level_07/pub_visibility.md) — The access modifier that Integration Tests rely on.
- [Crate](../level_01/crate.md) — Because every integration test file is secretly compiled as its own independent crate!

---

## 2. Term Category

**Rust Tooling (the external perspective)**: Unit tests live directly inside your `src/` folder alongside your code. Because they are internal, they can see your private functions and test your internal plumbing. 

**Integration Tests** live outside your codebase entirely, in a special `tests/` folder at the root of your project. They are entirely external. They can only see the `pub` (public) API of your library, forcing you to test your code exactly the way a customer would use it.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The Rust designers recognized two fundamentally different types of testing that both needed first-class support.

1. You need **Unit Tests** (internal) to verify that the individual gears and cogs in your machine are perfectly machined and mathematically correct. 
2. You need **Integration Tests** (external) to verify that the entire machine works as expected when an actual user turns the key. 

If you put Integration Tests inside your `src/` folder, you might accidentally "cheat" by accessing private internal variables that a real user wouldn't have access to. By forcing Integration Tests into a separate `tests/` directory and compiling them as completely independent crates, Rust mathematically guarantees that your tests cannot cheat.

### (2) Reality Metaphor

Imagine you are opening a new Restaurant.

**Unit Tests** are the Head Chef standing in the kitchen, tasting the soup with a spoon to make sure it has enough salt (Internal Testing). The chef has full access to the pantry, the recipes, and the raw ingredients.

**Integration Tests** are a Secret Shopper walking through the front door of the restaurant (External Testing). The secret shopper sits at a table, orders from the public menu, and eats the final meal. The secret shopper isn't allowed to walk into the kitchen! They can only interact with the restaurant exactly the way a real customer would.

### (3) Rust Code Examples

#### Short Snippet (The Folder Structure)
To write Integration Tests, you must step outside your `src/` folder and create a new folder named `tests/` at the root of your project (right next to `Cargo.toml`).

```text
my_awesome_library/
├── Cargo.toml
├── src/
│   └── lib.rs         <-- Your actual library code
└── tests/
    └── my_tests.rs    <-- Your integration tests!
```

#### Fuller Example (Writing the Test)
Unlike Unit Tests, you do **not** need to use `#[cfg(test)] mod tests { ... }`. Because the entire `tests/` folder is only compiled when you run `cargo test`, Cargo already knows to keep it out of production!

**File: `tests/my_tests.rs`**
```rust
// 1. We must explicitly import our library, exactly like a customer would!
// (Assuming your Cargo.toml package name is `my_awesome_library`)
use my_awesome_library; 

// 2. Just write your tests! No `mod tests` block needed.
#[test]
fn test_the_public_api() {
    // We can only access functions marked with `pub` in our lib.rs!
    let result = my_awesome_library::calculate_total(100);
    
    assert_eq!(result, 120);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Integration Tests Scoping and Lifecycle Rules

**The mistake:** Assuming Integration Tests instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("integration_tests_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("integration_tests_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Integration Tests State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Integration Tests through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Integration Tests Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Integration Tests instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Multi-Component Service Integration & Shared Fixture Test Harness

**Problem Requirements:**
In production microservices built with Rust, integration testing requires validating multi-component workflows (such as an in-memory transactional Event Bus interacting with a User Account Service) strictly through public interfaces while sharing fixture setup patterns (mimicking `tests/common/mod.rs`).

1. Define an `Event` enum representing domain events: `UserCreated { id: u64, email: String }` and `UserDeleted { id: u64 }`.
2. Define a thread-safe `EventListener` trait with `fn on_event(&self, event: &Event) -> Result<(), String>`.
3. Implement an `EventBus` struct that maintains registered listeners using `Arc<Mutex<Vec<Box<dyn EventListener>>>>` and dispatches published events to listeners.
4. Implement a `UserService` struct that manages an internal database `Arc<RwLock<HashMap<u64, User>>>` and publishes lifecycle events to the `EventBus`.
5. Create a `MockAuditLogger` struct as an integration test fixture that records all received events into a thread-safe log vector.
6. Write a complete, compilable test module (`#[cfg(test)] mod tests`) containing integration tests that check:
   - User creation triggers `UserCreated` event dispatching and database persistence.
   - User deletion cleans up database state and triggers `UserDeleted` event.
   - Duplicate user creation attempts return an explicit `Err` and emit no events.
7. Use rigorous assertions (`assert_eq!`, `assert!`).

> [!check]- Answer
> ```rust
> use std::collections::HashMap;
> use std::sync::{Arc, Mutex, RwLock};
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub enum Event {
>     UserCreated { id: u64, email: String },
>     UserDeleted { id: u64 },
> }
> 
> pub trait EventListener: Send + Sync {
>     fn on_event(&self, event: &Event) -> Result<(), String>;
> }
> 
> #[derive(Default)]
> pub struct EventBus {
>     listeners: Arc<Mutex<Vec<Box<dyn EventListener>>>>,
> }
> 
> impl EventBus {
>     pub fn new() -> Self {
>         Self {
>             listeners: Arc::new(Mutex::new(Vec::new())),
>         }
>     }
> 
>     pub fn register(&self, listener: Box<dyn EventListener>) {
>         let mut guard = self.listeners.lock().unwrap();
>         guard.push(listener);
>     }
> 
>     pub fn publish(&self, event: &Event) -> Result<usize, String> {
>         let guard = self.listeners.lock().unwrap();
>         let mut success_count = 0;
>         for listener in guard.iter() {
>             if listener.on_event(event).is_ok() {
>                 success_count += 1;
>             }
>         }
>         Ok(success_count)
>     }
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct User {
>     pub id: u64,
>     pub email: String,
> }
> 
> pub struct UserService {
>     db: Arc<RwLock<HashMap<u64, User>>>,
>     event_bus: Arc<EventBus>,
> }
> 
> impl UserService {
>     pub fn new(event_bus: Arc<EventBus>) -> Self {
>         Self {
>             db: Arc::new(RwLock::new(HashMap::new())),
>             event_bus,
>         }
>     }
> 
>     pub fn create_user(&self, id: u64, email: String) -> Result<User, String> {
>         let user = User {
>             id,
>             email: email.clone(),
>         };
>         let mut db_guard = self.db.write().unwrap();
>         if db_guard.contains_key(&id) {
>             return Err(format!("User ID {} already exists", id));
>         }
>         db_guard.insert(id, user.clone());
>         drop(db_guard);
> 
>         let event = Event::UserCreated { id, email };
>         self.event_bus.publish(&event)?;
>         Ok(user)
>     }
> 
>     pub fn delete_user(&self, id: u64) -> Result<(), String> {
>         let mut db_guard = self.db.write().unwrap();
>         if db_guard.remove(&id).is_none() {
>             return Err(format!("User ID {} not found", id));
>         }
>         drop(db_guard);
> 
>         let event = Event::UserDeleted { id };
>         self.event_bus.publish(&event)?;
>         Ok(())
>     }
> 
>     pub fn get_user(&self, id: u64) -> Option<User> {
>         let db_guard = self.db.read().unwrap();
>         db_guard.get(&id).cloned()
>     }
> }
> 
> // Shared Integration Test Fixture (Simulating tests/common/mod.rs helper)
> pub struct MockAuditLogger {
>     pub received_events: Arc<Mutex<Vec<Event>>>,
> }
> 
> impl MockAuditLogger {
>     pub fn new() -> (Self, Arc<Mutex<Vec<Event>>>) {
>         let storage = Arc::new(Mutex::new(Vec::new()));
>         let logger = Self {
>             received_events: Arc::clone(&storage),
>         };
>         (logger, storage)
>     }
> }
> 
> impl EventListener for MockAuditLogger {
>     fn on_event(&self, event: &Event) -> Result<(), String> {
>         let mut guard = self.received_events.lock().unwrap();
>         guard.push(event.clone());
>         Ok(())
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_user_service_integration_with_event_bus() {
>         let event_bus = Arc::new(EventBus::new());
>         let (logger, event_store) = MockAuditLogger::new();
>         event_bus.register(Box::new(logger));
> 
>         let user_service = UserService::new(Arc::clone(&event_bus));
> 
>         // 1. Create user and verify returned domain object
>         let user = user_service.create_user(101, "alice@example.com".to_string()).unwrap();
>         assert_eq!(user.id, 101);
>         assert_eq!(user.email, "alice@example.com");
> 
>         // 2. Verify state persistence through public query API
>         let fetched = user_service.get_user(101);
>         assert!(fetched.is_some());
>         assert_eq!(fetched.unwrap().email, "alice@example.com");
> 
>         // 3. Verify external listener event delivery
>         let events = event_store.lock().unwrap();
>         assert_eq!(events.len(), 1);
>         assert_eq!(
>             events[0],
>             Event::UserCreated {
>                 id: 101,
>                 email: "alice@example.com".to_string()
>             }
>         );
>         drop(events);
> 
>         // 4. Delete user and verify state cleanup & deletion event emission
>         let delete_res = user_service.delete_user(101);
>         assert!(delete_res.is_ok());
>         assert!(user_service.get_user(101).is_none());
> 
>         let events = event_store.lock().unwrap();
>         assert_eq!(events.len(), 2);
>         assert_eq!(events[1], Event::UserDeleted { id: 101 });
>     }
> 
>     #[test]
>     fn test_duplicate_user_creation_error_handling() {
>         let event_bus = Arc::new(EventBus::new());
>         let (logger, event_store) = MockAuditLogger::new();
>         event_bus.register(Box::new(logger));
> 
>         let user_service = UserService::new(event_bus);
> 
>         assert!(user_service.create_user(1, "user1@test.com".to_string()).is_ok());
>         let err_res = user_service.create_user(1, "user1@test.com".to_string());
> 
>         assert!(err_res.is_err());
>         assert_eq!(err_res.unwrap_err(), "User ID 1 already exists");
> 
>         // Verify no duplicate event was dispatched on failure
>         let events = event_store.lock().unwrap();
>         assert_eq!(events.len(), 1);
>     }
> }
> ```
> 
> **Step-by-Step Technical Explanation:**
> 1. **Public API Contract**: In integration testing, components communicate through `pub` traits (`EventListener`) and methods (`create_user`, `delete_user`, `get_user`). Private internals are omitted to test real caller behavior.
> 2. **Shared Fixture Setup**: `MockAuditLogger::new()` provides a fixture that retains shared state via `Arc<Mutex<Vec<Event>>>`. This allows integration test assertions to query side effects without reaching into private service state.
> 3. **Thread Safety & Mutability**: Rust requires `Send + Sync` bounds on `Box<dyn EventListener>` to allow `EventBus` to share listeners safely across threads. `Arc<RwLock<...>>` inside `UserService` guarantees concurrent read access while isolating exclusive write access during updates.

---

### Exercise 2: Black-Box Integration Testing of HTTP API Middleware & Rate Limiting

**Problem Requirements:**
Web services require black-box integration testing to ensure that middleware layers (such as Authentication and Rate Limiting) execute correctly before request handlers are reached.

1. Define a public `Request` struct with `path: String`, `token: Option<String>`, and `client_ip: String`.
2. Define a public `Response` struct with `status_code: u16` and `body: String`.
3. Define a `Middleware` trait with `fn handle(&self, req: &Request) -> Result<(), Response>`.
4. Implement `AuthMiddleware` which inspects `req.token`. If missing or invalid, it returns `Err(Response)` with `401 Unauthorized`.
5. Implement `RateLimiterMiddleware` which uses `Mutex<HashMap<String, usize>>` to track client IP requests up to `max_requests`. Exceeding the threshold returns `Err(Response)` with `429 Too Many Requests`.
6. Implement an `ApiPipeline` router struct that stores `Vec<Box<dyn Middleware>>` and dispatches incoming requests through the middleware chain down to endpoint routes (`/api/v1/resource`).
7. Write a complete test suite (`#[cfg(test)] mod tests`) testing:
   - Request authentication failure returns HTTP 401.
   - Sequential requests from a single client IP trigger HTTP 429 when exceeding rate limits.
   - Valid requests to unknown paths return HTTP 404.

> [!check]- Answer
> ```rust
> use std::collections::HashMap;
> use std::sync::Mutex;
> 
> #[derive(Debug, Clone)]
> pub struct Request {
>     pub path: String,
>     pub token: Option<String>,
>     pub client_ip: String,
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct Response {
>     pub status_code: u16,
>     pub body: String,
> }
> 
> pub trait Middleware: Send + Sync {
>     fn handle(&self, req: &Request) -> Result<(), Response>;
> }
> 
> pub struct AuthMiddleware {
>     secret_token: String,
> }
> 
> impl AuthMiddleware {
>     pub fn new(secret_token: &str) -> Self {
>         Self {
>             secret_token: secret_token.to_string(),
>         }
>     }
> }
> 
> impl Middleware for AuthMiddleware {
>     fn handle(&self, req: &Request) -> Result<(), Response> {
>         match &req.token {
>             Some(token) if token == &self.secret_token => Ok(()),
>             _ => Err(Response {
>                 status_code: 401,
>                 body: "Unauthorized: Invalid or missing token".to_string(),
>             }),
>         }
>     }
> }
> 
> pub struct RateLimiterMiddleware {
>     max_requests: usize,
>     request_counts: Mutex<HashMap<String, usize>>,
> }
> 
> impl RateLimiterMiddleware {
>     pub fn new(max_requests: usize) -> Self {
>         Self {
>             max_requests,
>             request_counts: Mutex::new(HashMap::new()),
>         }
>     }
> }
> 
> impl Middleware for RateLimiterMiddleware {
>     fn handle(&self, req: &Request) -> Result<(), Response> {
>         let mut counts = self.request_counts.lock().unwrap();
>         let count = counts.entry(req.client_ip.clone()).or_insert(0);
>         if *count >= self.max_requests {
>             Err(Response {
>                 status_code: 429,
>                 body: "Too Many Requests: Rate limit exceeded".to_string(),
>             })
>         } else {
>             *count += 1;
>             Ok(())
>         }
>     }
> }
> 
> pub struct ApiPipeline {
>     middlewares: Vec<Box<dyn Middleware>>,
> }
> 
> impl ApiPipeline {
>     pub fn new() -> Self {
>         Self {
>             middlewares: Vec::new(),
>         }
>     }
> 
>     pub fn add_middleware(&mut self, middleware: Box<dyn Middleware>) {
>         self.middlewares.push(middleware);
>     }
> 
>     pub fn dispatch(&self, req: Request) -> Response {
>         for mw in &self.middlewares {
>             if let Err(resp) = mw.handle(&req) {
>                 return resp;
>             }
>         }
> 
>         match req.path.as_str() {
>             "/api/v1/resource" => Response {
>                 status_code: 200,
>                 body: "{\"data\": \"success\"}".to_string(),
>             },
>             _ => Response {
>                 status_code: 404,
>                 body: "Not Found".to_string(),
>             },
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_pipeline_authentication_failure() {
>         let mut pipeline = ApiPipeline::new();
>         pipeline.add_middleware(Box::new(AuthMiddleware::new("secret-key")));
> 
>         let req = Request {
>             path: "/api/v1/resource".to_string(),
>             token: Some("wrong-key".to_string()),
>             client_ip: "192.168.1.1".to_string(),
>         };
> 
>         let response = pipeline.dispatch(req);
>         assert_eq!(response.status_code, 401);
>         assert!(response.body.contains("Unauthorized"));
>     }
> 
>     #[test]
>     fn test_pipeline_rate_limiting_enforcement() {
>         let mut pipeline = ApiPipeline::new();
>         pipeline.add_middleware(Box::new(AuthMiddleware::new("secret-key")));
>         pipeline.add_middleware(Box::new(RateLimiterMiddleware::new(2)));
> 
>         let make_req = || Request {
>             path: "/api/v1/resource".to_string(),
>             token: Some("secret-key".to_string()),
>             client_ip: "10.0.0.5".to_string(),
>         };
> 
>         // First two requests under limit return HTTP 200
>         let r1 = pipeline.dispatch(make_req());
>         assert_eq!(r1.status_code, 200);
> 
>         let r2 = pipeline.dispatch(make_req());
>         assert_eq!(r2.status_code, 200);
> 
>         // Third request exceeds threshold and returns HTTP 429
>         let r3 = pipeline.dispatch(make_req());
>         assert_eq!(r3.status_code, 429);
>         assert_eq!(r3.body, "Too Many Requests: Rate limit exceeded");
>     }
> 
>     #[test]
>     fn test_pipeline_not_found_endpoint() {
>         let mut pipeline = ApiPipeline::new();
>         pipeline.add_middleware(Box::new(AuthMiddleware::new("secret-key")));
> 
>         let req = Request {
>             path: "/api/v1/nonexistent".to_string(),
>             token: Some("secret-key".to_string()),
>             client_ip: "192.168.1.1".to_string(),
>         };
> 
>         let response = pipeline.dispatch(req);
>         assert_eq!(response.status_code, 404);
>         assert_eq!(response.body, "Not Found");
>     }
> }
> ```
> 
> **Step-by-Step Technical Explanation:**
> 1. **Short-Circuit Middleware Execution**: `ApiPipeline::dispatch` loops over trait objects `Box<dyn Middleware>`. If any middleware returns `Err(Response)`, the pipeline immediately short-circuits and returns the error HTTP response without processing downstream handlers.
> 2. **Stateful Rate Limiting**: `RateLimiterMiddleware` protects interior state with `Mutex<HashMap<String, usize>>`. The test verifies client IP tracking across sequential request calls without needing internal struct inspection.
> 3. **Black-Box API Assertions**: The tests instantiate the pipeline via its public builder methods and submit `Request` values, verifying system behavior through `Response` status codes and payload strings (`assert_eq!(response.status_code, 401)`).

---

### Exercise 3: Asynchronous Workflow Pipeline Integration & Fault Injection Testing

**Problem Requirements:**
Integration tests often need to verify transaction boundaries and fault tolerance when coordinating multiple external service traits (e.g. Payment Gateways and Notification Systems).

1. Define a `PaymentResult` enum with variants `Success { tx_id: String }` and `Failed { reason: String }`.
2. Define a trait `PaymentGateway: Send + Sync` with `fn charge(&self, account_id: &str, amount_cents: u64) -> PaymentResult`.
3. Define a trait `NotificationService: Send + Sync` with `fn notify(&self, account_id: &str, message: &str) -> Result<(), String>`.
4. Create a `PaymentProcessor` pipeline struct holding `Arc<dyn PaymentGateway>` and `Arc<dyn NotificationService>`.
5. Implement `pub fn process_order(&self, account_id: &str, amount_cents: u64) -> Result<String, String>`:
   - Calls `gateway.charge()`.
   - If payment fails, returns an error immediately and does NOT call the notification service.
   - If payment succeeds, attempts notification. If notification fails, returns a composite fault error.
6. Create mock implementations (`MockPaymentGateway`, `MockNotifier`) with fault-injection flags (`should_fail`) and thread-safe record vectors.
7. Write a unit/integration test suite (`#[cfg(test)] mod tests`) using `assert_eq!`, `assert!`, and string matching to test successful processing, payment failure rollbacks, and notification fault injection.

> [!check]- Answer
> ```rust
> use std::sync::{Arc, Mutex};
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub enum PaymentResult {
>     Success { tx_id: String },
>     Failed { reason: String },
> }
> 
> pub trait PaymentGateway: Send + Sync {
>     fn charge(&self, account_id: &str, amount_cents: u64) -> PaymentResult;
> }
> 
> pub trait NotificationService: Send + Sync {
>     fn notify(&self, account_id: &str, message: &str) -> Result<(), String>;
> }
> 
> pub struct PaymentProcessor {
>     gateway: Arc<dyn PaymentGateway>,
>     notifier: Arc<dyn NotificationService>,
> }
> 
> impl PaymentProcessor {
>     pub fn new(
>         gateway: Arc<dyn PaymentGateway>,
>         notifier: Arc<dyn NotificationService>,
>     ) -> Self {
>         Self { gateway, notifier }
>     }
> 
>     pub fn process_order(&self, account_id: &str, amount_cents: u64) -> Result<String, String> {
>         let result = self.gateway.charge(account_id, amount_cents);
>         match result {
>             PaymentResult::Success { tx_id } => {
>                 let msg = format!("Payment of ${:.2} processed. Tx: {}", amount_cents as f64 / 100.0, tx_id);
>                 match self.notifier.notify(account_id, &msg) {
>                     Ok(_) => Ok(tx_id),
>                     Err(notify_err) => Err(format!("Payment succeeded but notification failed: {}", notify_err)),
>                 }
>             }
>             PaymentResult::Failed { reason } => Err(format!("Payment failed: {}", reason)),
>         }
>     }
> }
> 
> // Fault Injection Mocks for Integration Testing
> pub struct MockPaymentGateway {
>     pub should_fail: bool,
>     pub charges: Mutex<Vec<(String, u64)>>,
> }
> 
> impl MockPaymentGateway {
>     pub fn new(should_fail: bool) -> Self {
>         Self {
>             should_fail,
>             charges: Mutex::new(Vec::new()),
>         }
>     }
> }
> 
> impl PaymentGateway for MockPaymentGateway {
>     fn charge(&self, account_id: &str, amount_cents: u64) -> PaymentResult {
>         let mut guard = self.charges.lock().unwrap();
>         guard.push((account_id.to_string(), amount_cents));
>         if self.should_fail {
>             PaymentResult::Failed {
>                 reason: "Insufficient funds".to_string(),
>             }
>         } else {
>             PaymentResult::Success {
>                 tx_id: format!("TX-{}-{}", account_id, amount_cents),
>             }
>         }
>     }
> }
> 
> pub struct MockNotificationService {
>     pub should_fail: bool,
>     pub notifications: Mutex<Vec<(String, String)>>,
> }
> 
> impl MockNotificationService {
>     pub fn new(should_fail: bool) -> Self {
>         Self {
>             should_fail,
>             notifications: Mutex::new(Vec::new()),
>         }
>     }
> }
> 
> impl NotificationService for MockNotificationService {
>     fn notify(&self, account_id: &str, message: &str) -> Result<(), String> {
>         if self.should_fail {
>             Err("SMS gateway unreachable".to_string())
>         } else {
>             let mut guard = self.notifications.lock().unwrap();
>             guard.push((account_id.to_string(), message.to_string()));
>             Ok(())
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_successful_payment_and_notification_workflow() {
>         let gateway = Arc::new(MockPaymentGateway::new(false));
>         let notifier = Arc::new(MockNotificationService::new(false));
>         let processor = PaymentProcessor::new(
>             Arc::clone(&gateway) as Arc<dyn PaymentGateway>,
>             Arc::clone(&notifier) as Arc<dyn NotificationService>,
>         );
> 
>         let res = processor.process_order("acc_123", 5000);
>         assert!(res.is_ok());
>         let tx_id = res.unwrap();
>         assert_eq!(tx_id, "TX-acc_123-5000");
> 
>         // Verify payment gateway charge audit log
>         let charges = gateway.charges.lock().unwrap();
>         assert_eq!(charges.len(), 1);
>         assert_eq!(charges[0], ("acc_123".to_string(), 5000));
> 
>         // Verify notification payload and dispatch log
>         let notifications = notifier.notifications.lock().unwrap();
>         assert_eq!(notifications.len(), 1);
>         assert_eq!(notifications[0].0, "acc_123");
>         assert!(notifications[0].1.contains("Payment of $50.00 processed"));
>     }
> 
>     #[test]
>     fn test_payment_failure_prevents_notification() {
>         let gateway = Arc::new(MockPaymentGateway::new(true)); // Inject payment failure
>         let notifier = Arc::new(MockNotificationService::new(false));
>         let processor = PaymentProcessor::new(
>             Arc::clone(&gateway) as Arc<dyn PaymentGateway>,
>             Arc::clone(&notifier) as Arc<dyn NotificationService>,
>         );
> 
>         let res = processor.process_order("acc_456", 2500);
>         assert!(res.is_err());
>         assert_eq!(res.unwrap_err(), "Payment failed: Insufficient funds");
> 
>         // Verify notification service was NEVER invoked on payment failure
>         let notifications = notifier.notifications.lock().unwrap();
>         assert!(notifications.is_empty());
>     }
> 
>     #[test]
>     fn test_notification_fault_injection_handling() {
>         let gateway = Arc::new(MockPaymentGateway::new(false));
>         let notifier = Arc::new(MockNotificationService::new(true)); // Inject notification fault
>         let processor = PaymentProcessor::new(
>             Arc::clone(&gateway) as Arc<dyn PaymentGateway>,
>             Arc::clone(&notifier) as Arc<dyn NotificationService>,
>         );
> 
>         let res = processor.process_order("acc_789", 10000);
>         assert!(res.is_err());
>         let err_msg = res.unwrap_err();
>         assert!(err_msg.contains("Payment succeeded but notification failed"));
>         assert!(err_msg.contains("SMS gateway unreachable"));
>     }
> }
> ```
> 
> **Step-by-Step Technical Explanation:**
> 1. **Fault Injection Strategy**: The mock structs store a `should_fail` boolean flag. In integration testing, this enables simulating network timeouts, gateway outages, or database errors without depending on unreliable external services.
> 2. **Transaction Isolation & Invariant Verification**: `test_payment_failure_prevents_notification` asserts that when `charge()` returns `PaymentResult::Failed`, the processor aborts immediately, keeping `notifications` empty (`assert!(notifications.is_empty())`).
> 3. **Trait Abstraction for Dependency Injection**: The `PaymentProcessor` relies on `Arc<dyn PaymentGateway>` and `Arc<dyn NotificationService>` trait objects. In production, real HTTP/gRPC client implementations are injected; in integration tests, mock structs are injected seamlessly.

---

## 6. Related Terms

- [`#[test]`](../level_08/test_attribute.md) — The attribute used inside integration tests to mark the test functions.
- [Crate](../level_01/crate.md) — Every file in the `tests/` folder is compiled as its own independent crate!

---

## 7. Key Takeaways

- Integration Tests live in a **`tests/`** directory at the root of your project.
- They act exactly like an external customer: they can only access your `pub` API.
- Every `.rs` file in the `tests/` folder is compiled as a completely separate crate.
- You can only write integration tests for Library Crates (`lib.rs`), not Binary Crates (`main.rs`).
- You still use the `#[test]` attribute, but you do *not* need `#[cfg(test)]`.
