# `Fn` / `FnMut` / `FnOnce`

> **Level 6 — Closures & Functional Patterns**
> Closure traits: borrows immutably / borrows mutably / takes ownership (consumed on call).

---

## 1. Prerequisites


- [Closure](closure.md) — The anonymous functions these traits describe.
- [Trait Bound](../level_04/trait_bound.md) — How you apply these traits to generic functions.
- [Borrowing (`&`)](../level_03/borrowing.md) — The core mechanism that separates these three traits.

---

## 2. Term Category

**Rust-specific (closure bounds)**: In Rust, every closure expression generates a unique, unnameable type created by the compiler. Because you cannot specify anonymous closure types directly in function signatures, Rust uses generic trait bounds parameterized by three core traits: `Fn`, `FnMut`, and `FnOnce`. These traits categorize how closures access their captured environment.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

When accepting a closure as a parameter, a higher-order function must specify what operations it will perform on the closure:

1. **`Fn` (Shared Read-Only)**: Captures environment variables via shared references (`&T`). Can be invoked repeatedly and concurrently across multiple execution paths without mutating captured state.
2. **`FnMut` (Exclusive Mutable)**: Captures environment variables via mutable references (`&mut T`). Can be invoked repeatedly, but requires exclusive `&mut` access because it mutates internal state.
3. **`FnOnce` (Ownership Consumption)**: Takes full ownership of captured variables (`T`). Can be invoked **only once** because calling it consumes or moves captured state out of the closure body.

### (2) Deep Dive — Trait Subtyping Hierarchy & Desugaring

Rust establishes an explicit trait inheritance hierarchy between closure traits:

$$\text{Fn} \subseteq \text{FnMut} \subseteq \text{FnOnce}$$

```rust
pub trait FnOnce<Args> {
    type Output;
    extern "rust-call" fn call_once(self, args: Args) -> Self::Output;
}

pub trait FnMut<Args>: FnOnce<Args> {
    extern "rust-call" fn call_mut(&mut self, args: Args) -> Self::Output;
}

pub trait Fn<Args>: FnMut<Args> {
    extern "rust-call" fn call(&self, args: Args) -> Self::Output;
}
```

- Every closure implementing `Fn` automatically implements `FnMut` and `FnOnce`.
- A function accepting `F: FnOnce()` accepts any closure, whereas a function requiring `F: Fn()` strictly rejects closures that mutate or move their environment.

### (3) Reality Metaphor

- **`Fn` (Reading a Boarding Pass)**: A gate attendant checks your boarding pass. They read your name as many times as needed without damaging or modifying the pass.
- **`FnMut` (Stamping a Loyalty Card)**: A coffee shop barista stamps your loyalty card. They mutate the card state on every visit. You can return repeatedly, but the card state changes on each call.
- **`FnOnce` (Redeeming a One-Time Coupon)**: You hand a paper gift certificate to a cashier. They scan it and tear it up. It is consumed entirely and cannot be redeemed a second time.

### (4) Rust Code Examples

#### Categorizing Closures
```rust
fn main() {
    let name = String::from("Alice");
    let mut count = 0;
    let data = vec![1, 2, 3];

    // Implements Fn (shared borrow of `name`)
    let read_name = || println!("Hello, {name}");

    // Implements FnMut (mutable borrow of `count`)
    let mut inc = || count += 1;

    // Implements FnOnce (consumes `data` by moving it into drop)
    let consume = || drop(data);

    read_name();
    inc();
    consume();
}
```

#### Trait Bounds in Higher-Order Functions
```rust
fn repeat_read<F: Fn()>(f: F) {
    f();
    f();
}

fn execute_once<F: FnOnce()>(f: F) {
    f();
}

fn main() {
    let msg = String::from("Notification");
    repeat_read(|| println!("{msg}"));
    execute_once(move || println!("Final: {msg}"));
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Requiring `Fn` Bound when Accepting a Closure that Mutates Captured State

**The mistake:** Constraining a generic parameter with `F: Fn()` when passing a closure that modifies environment variables (`FnMut`).

**Why it is wrong:** `Fn` requires shared reference `&self` invocation. Closures mutating state require `&mut self` (`FnMut`). Passing an `FnMut` closure to an `Fn` bound causes compiler error `E0525` / `E0596`.

*Incorrect:*
```rust
fn apply_twice<F: Fn()>(f: F) { f(); f(); }

let mut count = 0;
// apply_twice(|| count += 1); // ❌ Error E0596: cannot borrow as mutable inside `Fn` closure
```

*Fix:*
```rust
fn apply_twice<F: FnMut()>(mut f: F) { f(); f(); } // Use FnMut bound!
```

### Mistake 2: Attempting to Invoke an `FnOnce` Parameter Multiple Times

**The mistake:** Calling an `F: FnOnce()` parameter twice inside a higher-order function.

**Why it is wrong:** `FnOnce` consumes `self` on invocation. Subsequent calls attempt to execute on a moved value, triggering compiler error `E0382`.

*Incorrect:*
```rust
fn run_once<F: FnOnce()>(f: F) {
    f();
    // f(); // ❌ Error E0382: use of moved value `f`
}
```

### Mistake 3: Returning a Borrowing Closure without `move` when Returning `impl Fn()`

**The mistake:** Returning a closure that captures stack variables without using `move`.

**Why it is wrong:** Closures borrow environment references by default. Returning the closure creates a dangling reference to local function stack variables.

---

## 5. Practice Exercises

### Exercise 1: Asynchronous Event Bus Handler Registry

**Scenario:** Implement an event bus `EventBus` where listeners register callbacks for specific event topics. Support both immutable read listeners (`Fn(&Event)`) and stateful mutating listeners (`FnMut(&Event)`).

**Requirements:**
1. Define `struct Event { pub topic: String, pub payload: String }`.
2. Implement `EventBus` storing `listeners: Vec<Box<dyn FnMut(&Event)>>`.
3. Add method `subscribe<F>(&mut self, f: F) where F: FnMut(&Event) + 'static`.
4. Add method `publish(&mut self, event: &Event)`.
5. Write unit tests verifying listener invocation.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub struct Event {
>     pub topic: String,
>     pub payload: String,
> }
> 
> pub struct EventBus {
>     listeners: Vec<Box<dyn FnMut(&Event)>>,
> }
> 
> impl EventBus {
>     pub fn new() -> Self {
>         Self { listeners: Vec::new() }
>     }
> 
>     pub fn subscribe<F>(&mut self, f: F)
>     where
>         F: FnMut(&Event) + 'static,
>     {
>         self.listeners.push(Box::new(f));
>     }
> 
>     pub fn publish(&mut self, event: &Event) {
>         for listener in self.listeners.iter_mut() {
>             listener(event);
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_event_bus() {
>         let mut bus = EventBus::new();
>         let mut received_count = 0;
>         
>         // FnMut closure modifying local counter
>         bus.subscribe(move |evt| {
>             if evt.topic == "ALERT" {
>                 received_count += 1;
>             }
>         });
>         
>         let evt = Event { topic: "ALERT".into(), payload: "High Load".into() };
>         bus.publish(&evt);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `FnMut(&Event)` allows closures to mutate internal captured state (like counter variables) across calls.
> 2. `Box<dyn FnMut(&Event) + 'static>` enables heterogeneous listener storage in a single collection.
> 
---

### Exercise 2: Single-Use Transaction Commit Engine (`FnOnce`)

**Scenario:** Build an atomic transaction manager `execute_transaction<T, F>` that takes an owned context `T` and a single-use closure `F: FnOnce(T) -> Result<T, String>`.

**Requirements:**
1. Implement `execute_transaction<T, F>(context: T, action: F) -> Result<T, String> where F: FnOnce(T) -> Result<T, String>`.
2. Write unit tests passing closures that consume payload ownership.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn execute_transaction<T, F>(context: T, action: F) -> Result<T, String>
> where
>     F: FnOnce(T) -> Result<T, String>,
> {
>     action(context)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_fn_once_transaction() {
>         let payload = String::from("session_data");
>         let res = execute_transaction(payload, |mut data| {
>             data.push_str("_validated");
>             Ok(data)
>         });
>         assert_eq!(res, Ok("session_data_validated".to_string()));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `FnOnce(T)` takes full ownership of `context` on call.
> 2. The closure cannot be called more than once, preserving single-use atomic transaction guarantees.
> 
---

### Exercise 3: High-Throughput Request Middleware Pipeline (`Fn`)

**Scenario:** Implement a HTTP request filter chain `fn run_pipeline<F: Fn(&str) -> bool>(req: &str, filters: &[F]) -> bool` that executes multiple read-only `Fn` closures over a request path.

**Requirements:**
1. Evaluate request string slice through slice of `Fn` closures.
2. Return `true` if all filters pass, `false` otherwise.
3. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn run_pipeline<F: Fn(&str) -> bool>(req: &str, filters: &[F]) -> bool {
>     filters.iter().all(|f| f(req))
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_fn_pipeline() {
>         let f1 = |path: &str| path.starts_with("/api");
>         let f2 = |path: &str| !path.contains("admin");
>         let filters = vec![f1, f2];
>         
>         assert!(run_pipeline("/api/v1/users", &filters));
>         assert!(!run_pipeline("/api/v1/admin", &filters));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `Fn(&str) -> bool` allows invoking filters immutably across iteration.
> 2. `filters.iter().all(...)` processes closures in a short-circuiting read-only pass.
> 
---

## 6. Related Terms


- [`move` Closure](move_closure.md) — A keyword that forces a closure to take ownership of its environment, which heavily interacts with `FnOnce`.
- [Trait Bound](../level_04/trait_bound.md) — The generic mechanism you use to apply `Fn`, `FnMut`, and `FnOnce` to functions.
- [Closure](closure.md) — Related concept: Closure.
- [`Function Pointers` (`fn()`)](function_pointers.md) — Related concept: `Function Pointers` (`fn()`).

---

## 7. Key Takeaways

- **`Fn`**: Captures by shared borrow (`&T`). Callable infinitely and concurrently.
- **`FnMut`**: Captures by mutable borrow (`&mut T`). Callable repeatedly with exclusive access.
- **`FnOnce`**: Captures by move/ownership (`T`). Callable **only once**.
- Trait hierarchy: `Fn` implements `FnMut`, which implements `FnOnce`.
