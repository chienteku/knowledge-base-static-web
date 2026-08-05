# Dependency Injection via Generics

> **Level 18 — Rust**
> Using generic type parameters and trait bounds to inject dependencies rather than hard-coding concrete types, improving testability.

---

## 1. Prerequisites

- [Generics (`<T>`)](../level_04/generics.md) — Generic parameters.
- [Trait Bound](../level_04/trait_bound.md) — Trait bounds.

---


## 2. Term Category

**Architecture Pattern**: Dependency Injection via generics and trait bounds.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Hardcoding concrete struct instantiations inside business logic components creates tight coupling, making unit testing and database mocking impossible.

Dependency Injection (DI) in Rust decouples component dependencies by accepting generic parameters bounded by traits (`struct Service<D: Database> { db: D }`). This enables zero-cost compile-time static dispatch and effortless test mocking.

### (2) Reality Metaphor

A game console USB port: the console hardware connects to any compliant controller (steering wheel, gamepad, flight stick) through a standardized interface boundary.

### (3) Rust Code Examples

#### Short Snippet
```rust
pub trait Logger { fn log(&self, msg: &str); }
pub struct Service<L: Logger> { pub logger: L }
```

#### Fuller Example
```rust
pub trait Repository {
    fn find_user(&self, id: u64) -> Option<String>;
}

pub struct PostgresRepo;
impl Repository for PostgresRepo {
    fn find_user(&self, id: u64) -> Option<String> {
        Some(format!("PostgresUser_{id}"))
    }
}

pub struct UserService<R: Repository> {
    repo: R,
}

impl<R: Repository> UserService<R> {
    pub fn new(repo: R) -> Self { Self { repo } }
    pub fn get_name(&self, id: u64) -> String {
        self.repo.find_user(id).unwrap_or_default()
    }
}

fn main() {
    let service = UserService::new(PostgresRepo);
    assert_eq!(service.get_name(1), "PostgresUser_1");
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Hardcoding Concrete Struct Types in Service Field Definitions

**The mistake:** Instantiating concrete structs directly inside service constructors.

**Why it is wrong:** Prevents replacing the dependency with mock implementations during unit tests.

*Incorrect:*
```rust
struct Service { db: PostgresDatabase }
```

*Fix:*
```rust
struct Service<D: Database> { db: D }
```

### Mistake 2: Using `Box<dyn Trait>` for Monomorphic Single-Implementation Dependencies

**The mistake:** Using dynamic trait objects `Box<dyn Trait>` when only static compile-time dispatch is needed.

**Why it is wrong:** Introduces dynamic dispatch vtable overhead and extra heap allocations.

*Incorrect:*
```rust
struct Service { db: Box<dyn Database> }
```

*Fix:*
```rust
struct Service<D: Database> { db: D }
```

### Mistake 3: Creating Circular Dependencies Between Services

**The mistake:** Designing Service A to depend on Service B while Service B depends on Service A.

**Why it is wrong:** Causes ownership and struct lifetime initialization deadlocks in Rust.

*Incorrect:*
```rust
struct A<B_Type> { b: B_Type } struct B<A_Type> { a: A_Type }
```

*Fix:*
```rust
Decouple shared state into a third shared repository or event channel!
```

---

## 5. Practice Exercises

### Exercise 1: Mockable Payment Processor Service

**Scenario:** Build a payment processor service taking a generic `PaymentGateway` dependency that can be mocked in unit tests.

**Requirements:**
1. Define `PaymentGateway` trait with `charge(&self, amount: u64) -> bool`.
1. Implement `MockGateway` for unit testing.
1. Implement `OrderService<G: PaymentGateway>`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub trait PaymentGateway {
>     fn charge(&self, amount: u64) -> bool;
> }
> 
> pub struct MockGateway {
>     pub should_succeed: bool,
> }
> 
> impl PaymentGateway for MockGateway {
>     fn charge(&self, _amount: u64) -> bool {
>         self.should_succeed
>     }
> }
> 
> pub struct OrderService<G: PaymentGateway> {
>     gateway: G,
> }
> 
> impl<G: PaymentGateway> OrderService<G> {
>     pub fn new(gateway: G) -> Self { Self { gateway } }
>     pub fn process_order(&self, amount: u64) -> Result<(), &'static str> {
>         if self.gateway.charge(amount) {
>             Ok(())
>         } else {
>             Err("Payment declined")
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_order_success() {
>         let service = OrderService::new(MockGateway { should_succeed: true });
>         assert!(service.process_order(100).is_ok());
>     }
> 
>     #[test]
>     fn test_order_decline() {
>         let service = OrderService::new(MockGateway { should_succeed: false });
>         assert!(service.process_order(100).is_err());
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `OrderService` accepts any generic type `G` bounded by `PaymentGateway`.
> 2. `MockGateway` tests success and failure paths deterministically without network calls.

---

### Exercise 2: Injectable Configuration Provider

**Scenario:** Build a service using dependency injection for configuration reading.

**Requirements:**
1. Define `ConfigStore` trait.
1. Inject mock config.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub trait ConfigStore {
>     fn get(&self, key: &str) -> Option<String>;
> }
> 
> pub struct MemoryConfig {
>     pub val: String,
> }
> 
> impl ConfigStore for MemoryConfig {
>     fn get(&self, _key: &str) -> Option<String> {
>         Some(self.val.clone())
>     }
> }
> 
> pub struct AppEnv<C: ConfigStore> {
>     config: C,
> }
> 
> impl<C: ConfigStore> AppEnv<C> {
>     pub fn new(config: C) -> Self { Self { config } }
>     pub fn port(&self) -> u16 {
>         self.config.get("PORT").and_then(|s| s.parse().ok()).unwrap_or(8080)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_config_injection() {
>         let app = AppEnv::new(MemoryConfig { val: "9000".into() });
>         assert_eq!(app.port(), 9000);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Decouples environment variable lookup from application logic.
> 2. Supports memory test fixtures.

---

### Exercise 3: Generic Email Notification Service

**Scenario:** Implement a notification service injecting a `Mailer` trait.

**Requirements:**
1. Define `Mailer` trait.
1. Inject mailer.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub trait Mailer {
>     fn send(&self, to: &str, msg: &str) -> bool;
> }
> 
> pub struct TestMailer;
> impl Mailer for TestMailer {
>     fn send(&self, _to: &str, _msg: &str) -> bool { true }
> }
> 
> pub struct NotificationManager<M: Mailer> {
>     mailer: M,
> }
> 
> impl<M: Mailer> NotificationManager<M> {
>     pub fn new(mailer: M) -> Self { Self { mailer } }
>     pub fn notify(&self, user: &str) -> bool { self.mailer.send(user, "Welcome!") }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_notification() {
>         let mgr = NotificationManager::new(TestMailer);
>         assert!(mgr.notify("alice@example.com"));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Achieves zero-cost compile-time dependency injection.
> 2. Enables seamless unit testing.

---

## 5. Related Terms

- [Trait Bound](../level_04/trait_bound.md) — Trait bound constraints.

---


## 7. Key Takeaways

- Decouples component dependencies via traits.
- Enables unit testing via mock implementation injection.
- Supports zero-cost compile-time static dispatch (`<D: Trait>`).
- Avoids dynamic dispatch vtable overhead.
