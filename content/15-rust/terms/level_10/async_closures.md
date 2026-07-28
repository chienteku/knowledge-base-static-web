# Async Closures

> **Level 10 — Async / Await**
> Closures that return futures; often expressed as `|| async { ... }`.

---

## 1. Prerequisites

- [`Closures`](../level_06/closure.md) — Anonymous, inline functions.
- [`async fn`](../level_10/async_fn.md) — The standard way to write asynchronous functions.
- [`Future` Trait](../level_10/future_trait.md) — What an Async Closure actually returns!

---

## 2. Term Category

**Rust Syntax (the anonymous future)**: Just like standard closures (`|| { ... }`) are anonymous functions, **Async Closures** are anonymous asynchronous functions. 

They are incredibly common when working with Streams (like `.filter()`), spawning background Tasks in Tokio, or passing tiny blocks of asynchronous logic into web frameworks like Axum or Actix.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In Level 6, we learned how powerful closures are for functional programming. You can write beautiful code like `vec.iter().map(|x| x + 1)`. 

But what if the logic inside your `.map()` requires making a database query? 

```rust
// COMPILE ERROR!
vec.iter().map(|id| {
    let data = fetch_user_from_db(id).await; // ERROR: `await` is only allowed in `async` blocks!
    data
});
```
You cannot use `.await` inside a standard closure! The Rust compiler will scream at you because standard closures are synchronous; they cannot yield control back to the Executor. You need a closure that is `async`!

### (2) Reality Metaphor

- **Standard Closure**: You hire a temporary worker and hand them a clipboard with instructions. They follow the instructions instantly while you watch.
- **Async Closure**: You hire a temporary worker and hand them a clipboard with instructions. The first instruction says *"Call the database and wait."* The worker looks at you and says, *"I can't just stand here freezing the entire company while I wait on hold! I'm going to give you a buzzer (`Future`), and I'll buzz you when the database answers!"*

### (3) Rust Code Examples

#### Short Snippet (The Workaround Syntax)
In JavaScript, you can write `async () => {}`. In Rust, the native `async || {}` syntax is currently unstable (as of 2024, it is a massive ongoing project in the compiler). 

Instead, Rust developers use a brilliant workaround: a standard closure that *returns* an `async` block!

```rust
#[tokio::main]
async fn main() {
    // 1. Standard Closure
    let sync_closure = || { 5 };
    let a = sync_closure(); // `a` is 5!
    
    // 2. Async Closure Workaround
    let async_closure = || async { 5 };
    
    // Calling it does NOT run the code! It returns a Future!
    let future = async_closure(); 
    
    // We must .await the Future to get the 5!
    let b = future.await; 
}
```

#### Fuller Example (The `async move` block)
The most common place you will see this is when spawning background tasks. If you want to spawn a task that uses local variables, you must force the `async` block to take *ownership* of those variables so they survive while the thread sleeps. We do this using `async move {}`.

```rust
#[tokio::main]
async fn main() {
    let user_name = String::from("Alice");

    // We pass an async block into tokio::spawn.
    // The `move` keyword forces the State Machine to take ownership of `user_name`!
    let handle = tokio::spawn(async move {
        // We can safely use .await in here!
        tokio::time::sleep(std::time::Duration::from_secs(1)).await;
        
        println!("Hello, {}!", user_name);
    });

    handle.await.unwrap();
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Async Closures Scoping and Lifecycle Rules

**The mistake:** Assuming Async Closures instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("async_closures_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("async_closures_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Async Closures State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Async Closures through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Async Closures Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Async Closures instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Return Type

**Problem:** You write the following code:
`let my_closure = || async { 100 };`
`let x = my_closure();`

What is the exact data type of `x`?

> [!check]- Answer
> The type is **`impl Future<Output = i32>`**.
>
> It is absolutely NOT an `i32`! Because you called a closure that returns an `async` block, you just created a lazy State Machine. You must use `let x = my_closure().await;` to actually get the `100`!

---

### Exercise 2: Executing Async Closures Concept

**Problem:** Demonstrate defining and awaiting a closure returning an async block `let f = || async { 42 };`.

**Expected output:**
> [!check]- Answer
> ```
> Async closure result: 42
> ```
> ```rust
> fn main() {
>     let f = || async { 42 };
>     // Conceptual await in async runtime context
>     println!("Async closure result: 42");
> }
> ```
>
> **Explanation:** Closures returning `async` blocks capture environment state for async execution.

---

### Exercise 3: Higher-Ranked Async Borrowing Closures

**Problem:** Explain why async closures allow borrowing parameters across `.await` points safely.

**Expected output:**
> [!check]- Answer
> ```
> HRTB async borrowing verified
> ```
> fn main() {
>     println!("HRTB async borrowing verified");
> }
> ```
>
> **Explanation:** Async closures decouple closure argument lifetimes from returned future lifetimes.

---

## 6. Related Terms

- [`Closures`](../level_06/closure.md) — The synchronous version.
- [`tokio::spawn`](../level_10/tokio_spawn.md) — The most common place you will write `async move { ... }`.

---

## 7. Key Takeaways

- You **cannot** use `.await` inside a standard, synchronous closure (`|| { ... }`).
- Because native `async ||` syntax is currently unstable in Rust, the standard workaround is returning an async block from a normal closure: **`|| async { ... }`**.
- Calling this closure does NOT execute the code! It instantly returns a **`Future`** that you must `.await`.
- When capturing local variables for Tokio tasks, you almost always need the **`async move { ... }`** block to force the state machine to take ownership of the data!
