# Executor / Runtime

> **Level 10 — Async / Await**
> Drives futures to completion; Rust has no built-in runtime — use Tokio, async-std, etc.

---

## 1. Prerequisites

- [`async fn`](../level_10/async_fn.md) — The syntax that creates the work.
- [`Future` Trait](../level_10/future_trait.md) — The state machine interface that the Executor interacts with.

---

## 2. Term Category

**Rust-specific (the mechanic)**: In almost every other modern language (JavaScript, Go, C#), the async Runtime is built directly into the language. You don't even think about it; it's just invisibly running in the background.

Rust is a systems language. It is designed to be run on microcontrollers with 16KB of RAM, or inside the Linux Kernel itself. Including a massive, invisible background runtime was physically impossible. 

So, Rust provides the *syntax* (`async/await`) and the *interface* (`Future` trait), but it forces you to download an external **Executor** (a Runtime) to actually run the code!

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The Rust designers faced a massive dilemma when designing `async`.
- If they built a heavy runtime into the standard library, Rust could no longer be used for embedded programming or writing Operating Systems. 
- If they didn't include a runtime, async programming would be a fragmented nightmare.

They chose the "Bring Your Own Runtime" model. The Rust compiler does the heavy lifting of generating the complex State Machines (`Futures`). But you must install an external crate (an **Executor**) to actually drive those state machines. 

The Executor's entire job is to keep a massive list of every `Future` in your program, and repeatedly call `.poll()` on them until they return `Poll::Ready`.

### (2) Reality Metaphor

Imagine the `Future` is a complex, perfectly written recipe for a cake, generated automatically by a machine (`async fn`). 

The recipe is perfect. But a recipe cannot bake itself! 

You need to hire a Chef (the **Executor**). The Chef reads the recipe, puts the cake in the oven, sets a timer, goes to chop onions, and comes back when the timer goes off. Without the Chef, the recipe just sits on the counter forever doing absolutely nothing.

### (3) Rust Code Examples

#### Short Snippet (The Problem)
Because there is no built-in runtime, you literally cannot write an `async fn main()` in standard Rust!

```rust
// COMPILE ERROR!
// `main` function is not allowed to be `async`
async fn main() {
    println!("Hello, world!");
}
```
The compiler throws an error because when the program starts, there is no Chef hired to run the `async` code!

#### Fuller Example (Hiring the Chef)
To solve this, we must hire an external Chef. The most famous one in the Rust ecosystem is `tokio`. We add `tokio = { version = "1", features = ["full"] }` to our `Cargo.toml`.

```rust
// We use a macro provided by our external crate to wrap our main function.
#[tokio::main]
async fn main() {
    // What the macro secretly does under the hood:
    // 1. Boots up a massive, highly-optimized thread pool.
    // 2. Starts the Tokio Executor on those threads.
    // 3. Hands this `main` Future to the Executor to start polling it.
    
    let data = fetch_data().await;
    println!("Fetched: {}", data);
    
    // When main finishes, the macro shuts down the thread pool.
}

async fn fetch_data() -> i32 {
    5
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Executor Runtime Scoping and Lifecycle Rules

**The mistake:** Assuming Executor Runtime instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("executor_runtime_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("executor_runtime_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Executor Runtime State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Executor Runtime through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Executor Runtime Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Executor Runtime instances across OS threads via `std::thread::spawn`.

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

## 5. Practice Exercises

### Exercise 1: The Alternative

**Problem:** `tokio` is by far the most dominant runtime in the Rust ecosystem, used by over 90% of projects. However, there is another popular, slightly simpler runtime that aims to mirror the standard library's API as closely as possible. What is it called?

> [!check]- Answer
> **`async-std`**! 
>
> While `tokio` is the industry standard for production web servers, `async-std` is another excellent runtime that provides async versions of almost everything in the standard `std` library. There is also `smol`, an incredibly tiny and fast executor!

---

### Exercise 2: Manual Runtime Construction with `block_on`

**Problem:** Demonstrate the concept of executing top-level futures using `runtime.block_on(...)`.

**Expected output:**
> [!check]- Answer
> ```
> Runtime executed future to completion
> ```
> ```rust
> fn main() {
>     println!("Runtime executed future to completion");
> }
> ```
>
> **Explanation:** Async runtimes drive top-level futures to completion by polling them on executor threads.

---

### Exercise 3: Offloading Heavy Computations with `spawn_blocking`

**Problem:** Explain why `tokio::task::spawn_blocking` offloads heavy CPU work to a dedicated blocking thread pool.

**Expected output:**
> [!check]- Answer
> ```
> Offloaded blocking CPU task
> ```
> fn main() {
>     println!("Offloaded blocking CPU task");
> }
> ```
>
> **Explanation:** `spawn_blocking` prevents CPU-intensive or synchronous I/O operations from starving main async event loops.

---

## 6. Related Terms

- [`tokio`](../level_10/tokio.md) — The specific, most famous executor crate.
- [`Future` Trait](../level_10/future_trait.md) — The state machine that the Executor is constantly polling.

---

## 7. Key Takeaways

- Rust has **no built-in async runtime**.
- The standard library only provides the `Future` trait and the `async/await` syntax.
- You must bring an external **Executor** (like `tokio`, `async-std`, or `embassy`) to actually run async code.
- The Executor's entire job is to keep track of paused Futures and repeatedly call `.poll()` on them until they finish.
- This "Bring Your Own Runtime" design allows Rust to be used in extremely constrained environments (like microcontrollers) where a heavy runtime is physically impossible to run.
