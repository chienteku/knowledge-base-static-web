# Generics (`<T>`)

> **Level 4 — Error Handling & Generics**
> Parameterizing functions, structs, enums, and methods over types.

---

## 1. Prerequisites


- [`fn` (Functions)](../level_01/fn.md) — The primary place you will write generic code.
- [Struct](../level_02/struct.md)
- [Trait](trait.md) — The mechanism used to restrict what a generic type is allowed to do.

---

## 2. Term Category

**Rust-specific (the code deduplicator)**: Almost every modern, statically typed language has some form of Generics (e.g., Templates in C++, Generics in Java/C#). Generics allow you to write a single piece of code that can safely operate on multiple different data types, entirely eliminating the need to copy and paste code.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Imagine you want to write a function that takes a list of items and returns the largest one. 

First, you write `largest_i32(list: &[i32]) -> &i32`. 
Then, you realize you need the same logic for floats, so you copy-paste the exact same code and create `largest_f64(list: &[f64]) -> &f64`. 
Then you need it for characters, so you copy-paste it again: `largest_char(...)`.

This is a maintenance nightmare. If you find a bug, you have to fix it in 3 different places.

**Generics** solve this. They allow you to write the function *once* using a placeholder type (usually named `T`, standing for "Type"). You are telling the compiler: *"I don't care what exact type `T` is, as long as it behaves in a certain way, run this logic on it."*

### (2) Reality Metaphor

Imagine you are manufacturing a protective sleeve for a laptop. 

If your factory makes a "MacBook Pro 14-inch Sleeve", that is a **Concrete Type**. It only fits exactly one specific model of laptop. If someone buys a Dell, they can't use it.

If your factory makes a "Universal Elastic Sleeve `<T>`", that is a **Generic**. You don't care exactly what brand or model the laptop (`T`) is. As long as `T` fits within the physical stretching dimensions of the elastic, the sleeve will accept it and protect it.

### (3) Rust Code Examples

#### Short Snippet (Generic Structs)
You can define structs that hold any type of data using `<T>`. You've actually used this before with `Option<T>` and `Vec<T>`!

```rust
// We define a Point that holds two values of the exact SAME type `T`.
struct Point<T> {
    x: T,
    y: T,
}

fn main() {
    // T becomes an i32
    let integer_point = Point { x: 5, y: 10 }; 
    
    // T becomes an f64
    let float_point = Point { x: 1.0, y: 4.5 }; 
    
    // ERROR: T must be the SAME type for both x and y!
    // let invalid_point = Point { x: 5, y: 4.0 }; 
}
```

#### Fuller Example (Generic Functions and Methods)
When writing a generic function, you must *declare* the generic parameter `<T>` right after the function name before you can use it.

```rust
// 1. Declare <T> after the function name.
// 2. Use T as the parameter type and return type.
fn echo<T>(item: T) -> T {
    println!("I am echoing a generic item!");
    item
}

// Generics in implementations require declaring <T> after `impl`.
struct Container<T> {
    value: T,
}

impl<T> Container<T> {
    fn get_value(&self) -> &T {
        &self.value
    }
}

fn main() {
    let a = echo(5);          // T is i32
    let b = echo("Hello");    // T is &str
    
    let c = Container { value: true }; // Container<bool>
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Generics Scoping and Lifecycle Rules

**The mistake:** Assuming Generics instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("generics_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("generics_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Generics State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Generics through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Generics Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Generics instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Generic In-Memory Time-Series Metric Cache with Type-Safe Aggregation

**Scenario:** In telemetry microservices, metrics (e.g., CPU load, request latencies, network byte counts) arrive continuously and must be accumulated per metric key using type-safe arithmetic operations while maintaining retention policy metadata.

Design and implement a generic metric buffer structure `MetricBuffer<K, V, P>` parameterized over key type `K`, metric sample type `V`, and policy configuration type `P`.

1. Struct definition: `MetricBuffer<K, V, P>` containing an internal `std::collections::HashMap<K, V>` and policy metadata field `policy: P`.
2. Trait bounds & bounds placement:
   - `K` must implement `std::hash::Hash + Eq + Clone`.
   - `V` must implement `std::ops::AddAssign + Default + Copy + PartialOrd`.
3. Methods to implement:
   - `pub fn new(policy: P) -> Self`: constructs a new `MetricBuffer` holding the given policy metadata.
   - `pub fn record(&mut self, key: K, sample: V)`: records a new sample. If `key` already exists, adds `sample` to the stored value in-place using `AddAssign`. If absent, inserts `sample`.
   - `pub fn get(&self, key: &K) -> V`: retrieves the current value for `key`, returning `V::default()` if the key is not found.
   - `pub fn drain_above(&mut self, threshold: V) -> Vec<(K, V)>`: removes all metrics whose accumulated value strictly exceeds `threshold` and returns them as a vector of key-value pairs.
   - `pub fn policy(&self) -> &P`: returns a shared reference to the policy configuration.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::HashMap;
> use std::hash::Hash;
> use std::ops::AddAssign;
> 
> #[derive(Debug)]
> pub struct MetricBuffer<K, V, P> {
>     metrics: HashMap<K, V>,
>     policy: P,
> }
> 
> impl<K, V, P> MetricBuffer<K, V, P>
> where
>     K: Hash + Eq + Clone,
>     V: AddAssign + Default + Copy + PartialOrd,
> {
>     pub fn new(policy: P) -> Self {
>         Self {
>             metrics: HashMap::new(),
>             policy,
>         }
>     }
> 
>     pub fn record(&mut self, key: K, sample: V) {
>         self.metrics
>             .entry(key)
>             .and_modify(|val| *val += sample)
>             .or_insert(sample);
>     }
> 
>     pub fn get(&self, key: &K) -> V {
>         self.metrics.get(key).copied().unwrap_or_default()
>     }
> 
>     pub fn drain_above(&mut self, threshold: V) -> Vec<(K, V)> {
>         let mut drained = Vec::new();
>         self.metrics.retain(|k, v| {
>             if *v > threshold {
>                 drained.push((k.clone(), *v));
>                 false
>             } else {
>                 true
>             }
>         });
>         drained
>     }
> 
>     pub fn policy(&self) -> &P {
>         &self.policy
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_metric_buffer_accumulation_and_drain() {
>         let mut buffer = MetricBuffer::new("retention_policy_30d");
> 
>         buffer.record("cpu_usage", 40.5);
>         buffer.record("cpu_usage", 15.0);
>         buffer.record("mem_usage", 85.0);
>         buffer.record("disk_io", 12.0);
> 
>         assert_eq!(buffer.get(&"cpu_usage"), 55.5);
>         assert_eq!(buffer.get(&"mem_usage"), 85.0);
>         assert_eq!(buffer.get(&"network_rx"), 0.0);
>         assert_ne!(buffer.get(&"cpu_usage"), 40.5);
> 
>         let policy_ref = buffer.policy();
>         assert_eq!(*policy_ref, "retention_policy_30d");
> 
>         let drained = buffer.drain_above(50.0);
>         assert_eq!(drained.len(), 2);
>         assert!(drained.contains(&("cpu_usage", 55.5)));
>         assert!(drained.contains(&("mem_usage", 85.0)));
> 
>         assert_eq!(buffer.get(&"cpu_usage"), 0.0);
>         assert_eq!(buffer.get(&"disk_io"), 12.0);
> 
>         let empty_drain = buffer.drain_above(100.0);
>         assert!(empty_drain.is_empty());
>         assert!(matches!(buffer.get(&"disk_io"), val if val == 12.0));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Multi-Type Parameterization (`<K, V, P>`)**: Separating the key type `K`, metric value type `V`, and policy type `P` ensures the buffer remains agnostic to specific metric datatypes (e.g., `i64`, `f64`, `u128`) and policy structures (e.g., `&str`, custom config struct) without mixing concrete dependencies.
> 2. **Trait Bounds with `where` Clauses**: By placing trait bounds (`K: Hash + Eq + Clone`, `V: AddAssign + Default + Copy + PartialOrd`) in a `where` block on the `impl` declaration, we ensure that arithmetic addition (`+=`), lookup, cloning, and ordering operate purely on abstract trait interfaces.
> 3. **Zero-Allocation Lookups and `Copy` Semantics**: Deriving `V: Copy` allows `get` to return `V` directly by value via `.copied().unwrap_or_default()`, avoiding unnecessary heap allocations or borrow lifecycle complications for primitive numeric types.
> 4. **Monomorphization and Performance**: During compilation, Rust monomorphizes `MetricBuffer<&str, f64, &str>` into specialized machine code with direct struct field offsets and zero dynamic dispatch or virtual function call overhead.

---

### Exercise 2: Type-Safe Compile-Time State Machine for Transaction Pipelines (`PhantomData`)

**Scenario:** Financial processing engines require strict order state transitions (`Draft` -> `Validated` -> `Executed`). Executing an unvalidated transaction or re-validating an executed transaction must be impossible at run time.

Implement a compile-time enforced state machine using generics, state marker structs, ownership consumption (`self`), and `std::marker::PhantomData`.

1. State marker types: Define three public zero-sized structs: `Draft`, `Validated`, and `Executed`.
2. Generic structure: Define `pub struct Transaction<State, T>` containing:
   - `pub id: u64`
   - `pub payload: T`
   - `_state: PhantomData<State>`
3. Implement state-specific methods:
   - For `Transaction<Draft, T>`:
     - `pub fn new(id: u64, payload: T) -> Self`
     - `pub fn validate<F>(self, validator: F) -> Result<Transaction<Validated, T>, Transaction<Draft, T>> where F: FnOnce(&T) -> bool`: consumes `self`. If `validator(&self.payload)` returns `true`, returns `Ok(Transaction<Validated, T>)`. Otherwise, returns `Err(self)` holding the original `Draft` transaction.
   - For `Transaction<Validated, T>`:
     - `pub fn execute<F, R>(self, executor: F) -> (Transaction<Executed, T>, R) where F: FnOnce(&T) -> R`: consumes `self`, executes `executor(&self.payload)`, and returns a tuple of the newly produced `Transaction<Executed, T>` and execution result `R`.
   - For `Transaction<Executed, T>`:
     - `pub fn payload(&self) -> &T`: provides access to the payload of an executed transaction.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::marker::PhantomData;
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct Draft;
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct Validated;
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct Executed;
> 
> #[derive(Debug)]
> pub struct Transaction<State, T> {
>     pub id: u64,
>     pub payload: T,
>     _state: PhantomData<State>,
> }
> 
> impl<T> Transaction<Draft, T> {
>     pub fn new(id: u64, payload: T) -> Self {
>         Self {
>             id,
>             payload,
>             _state: PhantomData,
>         }
>     }
> 
>     pub fn validate<F>(self, validator: F) -> Result<Transaction<Validated, T>, Transaction<Draft, T>>
>     where
>         F: FnOnce(&T) -> bool,
>     {
>         if validator(&self.payload) {
>             Ok(Transaction {
>                 id: self.id,
>                 payload: self.payload,
>                 _state: PhantomData,
>             })
>         } else {
>             Err(self)
>         }
>     }
> }
> 
> impl<T> Transaction<Validated, T> {
>     pub fn execute<F, R>(self, executor: F) -> (Transaction<Executed, T>, R)
>     where
>         F: FnOnce(&T) -> R,
>     {
>         let result = executor(&self.payload);
>         let executed_tx = Transaction {
>             id: self.id,
>             payload: self.payload,
>             _state: PhantomData,
>         };
>         (executed_tx, result)
>     }
> }
> 
> impl<T> Transaction<Executed, T> {
>     pub fn payload(&self) -> &T {
>         &self.payload
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[derive(Debug, PartialEq, Eq, Clone)]
>     struct OrderPayload {
>         account_id: u32,
>         amount: u64,
>     }
> 
>     #[test]
>     fn test_valid_transaction_pipeline_lifecycle() {
>         let order = OrderPayload {
>             account_id: 1001,
>             amount: 500,
>         };
>         let tx_draft = Transaction::new(88391, order);
> 
>         let validation_res = tx_draft.validate(|payload| payload.amount > 0 && payload.account_id > 0);
>         assert!(validation_res.is_ok());
> 
>         let tx_validated = validation_res.unwrap();
>         let (tx_executed, receipt_code) = tx_validated.execute(|payload| {
>             format!("PROCESSED_{}_{}", payload.account_id, payload.amount)
>         });
> 
>         assert_eq!(receipt_code, "PROCESSED_1001_500");
>         assert_eq!(tx_executed.payload().amount, 500);
>         assert_ne!(tx_executed.id, 0);
>         assert!(matches!(tx_executed.payload().account_id, 1001));
>     }
> 
>     #[test]
>     fn test_invalid_transaction_rejection() {
>         let invalid_order = OrderPayload {
>             account_id: 1002,
>             amount: 0,
>         };
>         let tx_draft = Transaction::new(99001, invalid_order.clone());
> 
>         let validation_res = tx_draft.validate(|payload| payload.amount > 0);
>         assert!(validation_res.is_err());
> 
>         if let Err(returned_draft) = validation_res {
>             assert_eq!(returned_draft.id, 99001);
>             assert_eq!(returned_draft.payload, invalid_order);
>         } else {
>             panic!("Expected validation failure for 0 amount");
>         }
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Zero-Cost Typestate Pattern via `PhantomData`**: `PhantomData<State>` acts as a zero-sized marker field that informs the compiler `Transaction` is generic over `State` without allocating runtime storage. The size of `Transaction<State, T>` is identical to `(u64, T)`.
> 2. **Compile-Time State Safety via Ownership Semantics**: Methods like `validate(self)` and `execute(self)` consume ownership of `self`. Once an order is validated, the original `Transaction<Draft, T>` instance is dropped/moved, preventing double validation or out-of-order execution bugs. Attempting to call `.execute()` on a `Draft` transaction causes a compile-time type error (`E0599`).
> 3. **Method Specialization via `impl` Blocks**: Defining separate `impl<T> Transaction<Draft, T>` and `impl<T> Transaction<Validated, T>` blocks attaches methods exclusively to transactions in that specific lifecycle state.
> 4. **Higher-Order Closures (`FnOnce`)**: Accepting `F: FnOnce(&T) -> R` allows callers to execute arbitrary validation logic or execution side-effects, inspecting the immutable payload reference `&T` without modifying internal payload state.

---

### Exercise 3: Composable Generic Stream Event Processor Pipeline

**Scenario:** High-performance stream processing engines need composable processing pipelines (`map`, `filter`) that operate over streaming events with zero dynamic allocation or vtable dynamic dispatch overhead.

Implement a zero-cost generic stream processing framework using generic traits, wrapper structs, and extension trait combinators.

1. Define core trait:
   ```rust
   pub trait EventProcessor<Input> {
       type Output;
       fn process(&mut self, input: Input) -> Option<Self::Output>;
   }
   ```
2. Define base struct `IdentityProcessor<T>` which implements `EventProcessor<T>` with `type Output = T`, returning `Some(input)`.
3. Define wrapper structs:
   - `MapProcessor<P, F>` wrapping inner processor `P` and mapping function `F`.
   - `FilterProcessor<P, F>` wrapping inner processor `P` and predicate function `F`.
4. Implement `EventProcessor<Input>` for `MapProcessor<P, F>` and `FilterProcessor<P, F>`.
5. Define extension trait `EventProcessorExt<Input>: EventProcessor<Input> + Sized` offering builder methods `.map(self, mapper)` and `.filter(self, predicate)` returning wrapped combinators. Implement it blanketly for all `P: EventProcessor<Input>`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::marker::PhantomData;
> 
> pub trait EventProcessor<Input> {
>     type Output;
>     fn process(&mut self, input: Input) -> Option<Self::Output>;
> }
> 
> pub struct IdentityProcessor<T> {
>     _marker: PhantomData<T>,
> }
> 
> impl<T> IdentityProcessor<T> {
>     pub fn new() -> Self {
>         Self {
>             _marker: PhantomData,
>         }
>     }
> }
> 
> impl<T> Default for IdentityProcessor<T> {
>     fn default() -> Self {
>         Self::new()
>     }
> }
> 
> impl<T> EventProcessor<T> for IdentityProcessor<T> {
>     type Output = T;
>     fn process(&mut self, input: T) -> Option<Self::Output> {
>         Some(input)
>     }
> }
> 
> pub struct MapProcessor<P, F> {
>     inner: P,
>     mapper: F,
> }
> 
> impl<Input, P, F, NewOutput> EventProcessor<Input> for MapProcessor<P, F>
> where
>     P: EventProcessor<Input>,
>     F: FnMut(P::Output) -> NewOutput,
> {
>     type Output = NewOutput;
> 
>     fn process(&mut self, input: Input) -> Option<Self::Output> {
>         let out = self.inner.process(input)?;
>         Some((self.mapper)(out))
>     }
> }
> 
> pub struct FilterProcessor<P, F> {
>     inner: P,
>     predicate: F,
> }
> 
> impl<Input, P, F> EventProcessor<Input> for FilterProcessor<P, F>
> where
>     P: EventProcessor<Input>,
>     F: FnMut(&P::Output) -> bool,
> {
>     type Output = P::Output;
> 
>     fn process(&mut self, input: Input) -> Option<Self::Output> {
>         let out = self.inner.process(input)?;
>         if (self.predicate)(&out) {
>             Some(out)
>         } else {
>             None
>         }
>     }
> }
> 
> pub trait EventProcessorExt<Input>: EventProcessor<Input> + Sized {
>     fn map<F, NewOutput>(self, mapper: F) -> MapProcessor<Self, F>
>     where
>         F: FnMut(Self::Output) -> NewOutput,
>     {
>         MapProcessor {
>             inner: self,
>             mapper,
>         }
>     }
> 
>     fn filter<F>(self, predicate: F) -> FilterProcessor<Self, F>
>     where
>         F: FnMut(&Self::Output) -> bool,
>     {
>         FilterProcessor {
>             inner: self,
>             predicate,
>         }
>     }
> }
> 
> impl<Input, P: EventProcessor<Input>> EventProcessorExt<Input> for P {}
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_event_processing_pipeline_chaining() {
>         let mut pipeline = IdentityProcessor::<i32>::new()
>             .filter(|val| val % 2 == 0)
>             .map(|val| val * 10)
>             .map(|val| format!("EVENT_VAL_{}", val));
> 
>         let res_even = pipeline.process(4);
>         assert_eq!(res_even, Some(String::from("EVENT_VAL_40")));
> 
>         let res_odd = pipeline.process(7);
>         assert_eq!(res_odd, None);
>         assert_ne!(res_even, res_odd);
> 
>         assert!(matches!(res_even, Some(s) if s.starts_with("EVENT_")));
>     }
> 
>     #[test]
>     fn test_stateful_closure_in_pipeline() {
>         let mut counter = 0;
>         let mut pipeline = IdentityProcessor::<&str>::new()
>             .map(|s| s.to_uppercase())
>             .filter(move |_| {
>                 counter += 1;
>                 counter <= 2
>             });
> 
>         assert_eq!(pipeline.process("first"), Some(String::from("FIRST")));
>         assert_eq!(pipeline.process("second"), Some(String::from("SECOND")));
>         assert_eq!(pipeline.process("third"), None);
>         assert!(pipeline.process("fourth").is_none());
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Static Dispatch and Monomorphized Composability**: Unlike dynamic trait objects (`Box<dyn EventProcessor>`), chaining generic types yields concrete nested types like `MapProcessor<FilterProcessor<MapProcessor<...>, ...>, ...>`. The Rust compiler monomorphizes and inlines these calls into a single tight machine-code execution block without heap allocation or dynamic vtable dereferencing.
> 2. **Associated Type vs Generic Output Parameter**: Using an associated type `type Output;` on `EventProcessor<Input>` guarantees that for a given `Input` type, the processor produces exactly one output type. This prevents type inference ambiguities that occur when overloading output types as generic parameters (`EventProcessor<Input, Output>`).
> 3. **Extension Trait Blanket Implementation**: `EventProcessorExt<Input>` extends any type `P` implementing `EventProcessor<Input>`. Requiring `Sized` on the extension trait ensures combinators can take ownership of `self` by value when wrapping processors inside `MapProcessor` or `FilterProcessor`.
> 4. **Closure Mutability (`FnMut`)**: Specifying `F: FnMut(...)` for mappers and filters permits stateful closures (e.g., counter increments, internal cache updates) to be safely called within `&mut self` processor pipelines.

---

## 6. Related Terms


- [Trait Bound](trait_bound.md) — The way we restrict what `<T>` is allowed to be (e.g., "T must be something that can be added together").
- [Monomorphization](monomorphization.md) — The terrifying-sounding but incredibly awesome way the compiler physically implements Generics under the hood without losing performance.
- [Associated Types](associated_types.md) — Related concept: Associated Types.
- [Trait](trait.md) — Related concept: Trait.
- [`Sized` Trait](../level_11/sized_trait.md) — Related concept: `Sized` Trait.
- [Type-State Pattern](../level_14/type_state_pattern.md) — Related concept: Type-State Pattern.

---

## 7. Key Takeaways

- Generics allow you to write reusable, deduplicated code by using placeholder types (usually `<T>`).
- You can use Generics in functions, structs, enums (`Option<T>`), and methods.
- You can use multiple generic types at once by separating them with commas: `<T, U, V>`.
- Generics are strictly checked at compile-time, meaning you get the flexibility of dynamic typing with the absolute safety of static typing.
