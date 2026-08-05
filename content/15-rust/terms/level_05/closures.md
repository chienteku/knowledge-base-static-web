# Closures (`|args| body`)

> **Level 5 — Rust**
> Anonymous functions that capture variables from their surrounding scope by reference or by value, implementing the `Fn`, `FnMut`, or `FnOnce` traits.

---

## 1. Prerequisites

**None.**

---

## 2. Term Category

**Functional Language Feature**: Closures (`|args| expr`) are anonymous functions that capture state from their surrounding lexical scope. Rust closures automatically infer parameter and return types, implement one or more closure marker traits (`Fn`, `FnMut`, `FnOnce`), and compile into zero-cost, stack-allocated anonymous struct types created by `rustc`.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Standard functions declared with `fn` are items in Rust that cannot access local variables from their surrounding lexical environment without explicitly declaring struct fields and passing them manually.

Closures solve this by creating lightweight inline functions capable of **capturing environment state**:
1. **Automatic Type & Capture Inference**: The compiler infers parameter types, return types, and the least restrictive capture mechanism (shared reference `&T`, mutable reference `&mut T`, or move `T`) based on how captured variables are evaluated within the closure body.
2. **Desugaring to Anonymous Structs**: Under the hood, `rustc` constructs an anonymous, unnamed struct for each closure instance. Captured variables become fields of this struct.
3. **Zero-Cost Abstraction**: Monomorphization inline expands generic calls like `fn process<F: Fn(i32)>(f: F)`, completely eliminating function pointer overhead and enabling aggressive compiler optimizations like inlining.

### (2) Deep Dive — The Three Closure Traits

Every closure automatically implements one or more of three traits based on how it handles captured environment variables:

| Trait | Receives `self` as | Capture Semantics | Reusability |
|---|---|---|---|
| **`Fn`** | `&self` | Shared reference `&T` | Callable infinitely without mutating captured state |
| **`FnMut`** | `&mut self` | Mutable reference `&mut T` | Callable repeatedly, can mutate captured state |
| **`FnOnce`** | `self` | Takes ownership `T` | Callable **only once**, because calling it consumes/moves captured variables |

> [!NOTE]
> **Trait Hierarchy**: All `Fn` closures implement `FnMut`, and all `FnMut` closures implement `FnOnce` (`Fn` $\subseteq$ `FnMut` $\subseteq$ `FnOnce`). A function taking `FnOnce` accepts any closure.

### (3) The `move` Keyword and `fn` Pointer Coercion

- **`move` Closures**: Adding `move` before parameters (`move |x| ...`) forces the closure to take full ownership of captured variables by moving them into the generated closure struct fields, rather than capturing references. This is essential when returning closures or passing them across thread boundaries (`thread::spawn`).
- **Function Pointer Coercion**: A closure that captures **no variables** from its environment can be coerced to a raw function pointer `fn(A) -> B`.

### (4) Reality Metaphor

- **`Fn` (Shared Read)**: A Security Camera feeds video to multiple monitors. Watching the video feed doesn't alter or consume the camera.
- **`FnMut` (Mutable Write)**: A Digital Tally Counter button. Clicking the button increments the internal counter state repeatedly.
- **`FnOnce` (One-Shot Action)**: A Rocket Launch Trigger. Pressing the button consumes the rocket fuel and launches the missile; the button cannot be pressed a second time.

### (5) Rust Code Examples

#### Short Snippet (Capturing Environment)
```rust
let factor = 2;
let double = |x: i32| x * factor; // Borrow `factor` immutably (Fn)
assert_eq!(double(5), 10);
```

#### `FnMut` State Accumulator & `move` Closure
```rust
pub fn run_accumulator() {
    let mut total = 0;
    
    // Captures `total` by mutable reference (&mut total)
    let mut accumulator = |val: i32| {
        total += val;
        total
    };

    assert_eq!(accumulator(10), 10);
    assert_eq!(accumulator(20), 30);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting `move` Keyword when Spawning Threads or Returning Closures

**The mistake:** Returning a closure that references local stack variables without specifying `move`.

**Why it is wrong:** Closures borrow environment variables by reference by default. Returning a borrowing closure leaves references to dropped stack frames, causing compiler error `E0373` or `E0597`.

*Incorrect:*
```rust
fn make_adder(x: i32) -> impl Fn(i32) -> i32 {
    |y| x + y // ❌ Error E0373: closure may outlive the current function!
}
```

*Fix:*
```rust
fn make_adder(x: i32) -> impl Fn(i32) -> i32 {
    move |y| x + y // Correct: moves ownership of `x` into closure struct!
}
```

### Mistake 2: Attempting to Call an `FnOnce` Closure Multiple Times

**The mistake:** Invoking a closure that takes ownership of captured values inside a loop or multiple times in a function.

**Why it is wrong:** Calling an `FnOnce` closure moves captured values out of the closure struct on the first call. Subsequent calls attempt to use moved/dropped values, causing `E0382`.

*Incorrect:*
```rust
fn execute_twice<F: FnOnce()>(f: F) {
    f();
    // f(); // ❌ Error E0382: use of moved value `f`
}
```

*Fix:*
```rust
fn execute_twice<F: FnMut()>(mut f: F) { // Constrain to FnMut or Fn if repeated calls are needed!
    f();
    f();
}
```

### Mistake 3: Confusing Function Pointers (`fn`) with Closure Trait Bounds (`Fn`)

**The mistake:** Specifying a function signature requiring a raw function pointer `fn(i32) -> i32` when passing a closure that captures environment variables.

**Why it is wrong:** Raw function pointers `fn` carry zero environment state. Capturing closures generate anonymous structs with internal fields and cannot coerce to raw `fn`.

*Incorrect:*
```rust
let offset = 10;
let f: fn(i32) -> i32 = |x| x + offset; // ❌ Error E0308: expected fn pointer, found capturing closure
```

*Fix:*
```rust
let offset = 10;
let f = |x: i32| x + offset;
fn apply<F: Fn(i32) -> i32>(closure: F, val: i32) -> i32 { closure(val) }
assert_eq!(apply(f, 5), 15);
```

---

## 5. Practice Exercises

### Exercise 1: Real-Time Event-Driven Telemetry Filter & Callback Dispatcher

**Scenario:** Implement an event notification pipeline `TelemetryPipeline` where listeners register `FnMut(&TelemetryEvent)` closures to log, filter, and track system metrics.

**Requirements:**
1. Define struct `TelemetryEvent { pub topic: String, pub payload: u64 }`.
2. Define struct `TelemetryPipeline` holding `Vec<Box<dyn FnMut(&TelemetryEvent)>>`.
3. Add method `register<F>(&mut self, listener: F) where F: FnMut(&TelemetryEvent) + 'static`.
4. Add method `dispatch(&mut self, event: &TelemetryEvent)`.
5. Write unit tests registering closures that increment atomic counters upon event dispatch.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub struct TelemetryEvent {
>     pub topic: String,
>     pub payload: u64,
> }
> 
> pub struct TelemetryPipeline {
>     listeners: Vec<Box<dyn FnMut(&TelemetryEvent)>>,
> }
> 
> impl TelemetryPipeline {
>     pub fn new() -> Self {
>         Self { listeners: Vec::new() }
>     }
> 
>     pub fn register<F>(&mut self, listener: F)
>     where
>         F: FnMut(&TelemetryEvent) + 'static,
>     {
>         self.listeners.push(Box::new(listener));
>     }
> 
>     pub fn dispatch(&mut self, event: &TelemetryEvent) {
>         for listener in self.listeners.iter_mut() {
>             listener(event);
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
>     use std::sync::atomic::{AtomicU64, Ordering};
>     use std::sync::Arc;
> 
>     #[test]
>     fn test_telemetry_pipeline_closures() {
>         let mut pipeline = TelemetryPipeline::new();
>         let total_payload = Arc::new(AtomicU64::new(0));
>         
>         let counter_clone = total_payload.clone();
>         pipeline.register(move |evt| {
>             if evt.topic == "METRICS" {
>                 counter_clone.fetch_add(evt.payload, Ordering::SeqCst);
>             }
>         });
>         
>         pipeline.dispatch(&TelemetryEvent { topic: "METRICS".into(), payload: 100 });
>         pipeline.dispatch(&TelemetryEvent { topic: "METRICS".into(), payload: 50 });
>         
>         assert_eq!(total_payload.load(Ordering::SeqCst), 150);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `FnMut(&TelemetryEvent)` allows listener closures to mutate captured environment state (like modifying atomic counters or internal collections).
> 2. `Box<dyn FnMut(...) + 'static>` permits storing heterogeneous closure types inside a uniform `Vec`.
> 3. `move` captures `counter_clone` by value into the closure struct.

---

### Exercise 2: Atomic Transaction Rollback via `FnOnce`

**Scenario:** Implement an atomic transaction runner `run_transaction<T, F>(payload: T, action: F)` that accepts a single-use `FnOnce(T) -> Result<T, String>` closure. If the action succeeds, return the updated payload; if it fails, trigger an atomic rollback.

**Requirements:**
1. Function `run_transaction<T, F>(payload: T, action: F) -> Result<T, String> where F: FnOnce(T) -> Result<T, String>`.
2. Write unit tests passing closures that consume payload ownership.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn run_transaction<T, F>(payload: T, action: F) -> Result<T, String>
> where
>     F: FnOnce(T) -> Result<T, String>,
> {
>     action(payload)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_fn_once_transaction() {
>         let db_state = String::from("initial_state");
>         
>         let res = run_transaction(db_state, |mut state| {
>             state.push_str("_committed");
>             Ok(state)
>         });
>         
>         assert_eq!(res, Ok(String::from("initial_state_committed")));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `FnOnce(T) -> Result<T, String>` takes full ownership of `payload` and consumes closure state on invocation.
> 2. Guarantees that the atomic transformation executes strictly once without re-invocation risks.

---

### Exercise 3: Configurable Multiplier Factory Returning `impl Fn(f64) -> f64`

**Scenario:** Create a higher-order function `make_multiplier(factor: f64) -> impl Fn(f64) -> f64` that constructs reusable calculation closures.

**Requirements:**
1. Return `move |val| val * factor`.
2. Write unit tests creating multiple multiplier instances (`double`, `triple`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn make_multiplier(factor: f64) -> impl Fn(f64) -> f64 {
>     move |val| val * factor
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_multiplier_factory() {
>         let double = make_multiplier(2.0);
>         let triple = make_multiplier(3.0);
>         
>         assert_eq!(double(10.0), 20.0);
>         assert_eq!(triple(10.0), 30.0);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `move` forces moving `factor` into the generated closure struct.
> 2. `impl Fn(f64) -> f64` enables unboxed, zero-cost monomorphized function return types.

---

## 5. Related Terms

**None.**

---

## 7. Key Takeaways

- Closures capture variables from their surrounding lexical scope automatically.
- `Fn` captures shared references (`&T`), `FnMut` captures mutable references (`&mut T`), and `FnOnce` takes ownership (`T`).
- Use the `move` keyword to force transferring ownership of environment variables into the closure struct.
- Non-capturing closures can coerce to raw function pointers (`fn`).
