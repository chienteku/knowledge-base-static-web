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

### Exercise 2: Proving That `|| async {}` Returns a Future, Not a Value

**Problem:**
A closure that returns an `async` block is *not* an async closure — it is a regular closure whose *body* creates and returns a `Future`. This means calling it gives you a lazy state machine, not the final result.

Do the following inside a `#[tokio::main] async fn main()`:
1. Define `let greet = |name: &str| async move { format!("Hello, {}!", name) };`.
2. Call `greet("Ferris")` and store the result in `pending`. Print the type description: *"pending is a Future, not a String"*.
3. `.await` the result and print the actual `String`.
4. Show what happens if you forget `.await` — use a `let _ = greet("world");` line with a comment explaining the compiler warning.

**Expected output:**
> [!check]- Answer
> ```text
> pending is a Future, not a String
> Hello, Ferris!
> ```
>
> - **Hint 1:** The closure `|name: &str| async move { ... }` has type `impl Fn(&str) -> impl Future<Output = String>`. Calling it returns the `Future` — it does NOT run the body.
> - **Hint 2:** You need `async move` (not just `async`) because `name: &str` is a local variable. Without `move`, the async block tries to borrow `name` from the closure's stack frame, which the state machine outlives. `move` transfers ownership of the `String` (after `.to_owned()` or `format!`) into the future.
> - **Hint 3:** Forgetting `.await` produces a `#[must_use]` warning: `unused implementer of Future that must be used`. The closure body never executes — the `Future` is created and immediately dropped.
>
> ```rust
> #[tokio::main]
> async fn main() {
>     // A regular closure whose body is an async block.
>     // Calling it returns a Future<Output = String>, not a String.
>     let greet = |name: &str| async move {
>         format!("Hello, {}!", name) // name is moved into the state machine
>     };
>
>     // Step 2: calling the closure gives a Future, not the String.
>     let pending = greet("Ferris");
>     println!("pending is a Future, not a String");
>
>     // Step 3: .await drives the state machine to completion.
>     let result = pending.await;
>     println!("{}", result);
>
>     // Step 4: forgetting .await — compiler warns "unused implementer of Future".
>     // The closure body NEVER runs; the String is never formatted.
>     let _ = greet("world"); // ⚠️ Future created and dropped immediately
> }
> ```
>
> **Explanation:**
> `|| async { ... }` is syntactic shorthand for "a closure that, when called, constructs and returns a new `Future` state machine". The distinction from a true `async ||` closure (unstable) is subtle but important: the stable pattern creates a *new* `Future` on every call (each call to `greet(...)` creates a fresh state machine). The `move` keyword is necessary when the async block captures variables from the enclosing scope, because the state machine's lifetime may exceed the closure's call frame.

---

### Exercise 3: `async move` Captures — Using Closures as Async Task Factories

**Problem:**
A common real-world pattern is passing a `|| async move { ... }` closure as a *factory* that generates tasks — e.g., to `tokio::spawn` in a loop. Each iteration needs its own captured data.

Write a `#[tokio::main]` program that:
1. Defines a list of names: `["Alice", "Bob", "Carol"]`.
2. For each name, spawns a `tokio::spawn` task using `async move { ... }` that formats and returns `"Hello, {name}!"`.
3. Collects the `JoinHandle`s and awaits them in order, printing each result.

Then answer: **why does each task need its own `move` capture rather than sharing a reference to the original `names` slice?**

**Expected output:**
> [!check]- Answer
> ```text
> Hello, Alice!
> Hello, Bob!
> Hello, Carol!
> ```
>
> - **Hint 1:** `tokio::spawn` requires the async block to be `'static`. A `&str` from a local slice is not `'static` — the task might outlive the `main` function's stack frame. Using `async move` moves a copy of the `&'static str` literal (which *is* `'static`) into each task.
> - **Hint 2:** String literals like `"Alice"` have type `&'static str`, so they can be moved into a `'static` async block directly. If `name` were a `String` from a `Vec<String>`, you'd clone it before the `move`.
> - **Hint 3:** Collect handles with `let mut handles = Vec::new()` before the loop, push each `tokio::spawn(...)` result, then iterate and `.await` each handle with `handle.await.unwrap()`.
>
> ```rust
> #[tokio::main]
> async fn main() {
>     let names: &[&'static str] = &["Alice", "Bob", "Carol"];
>     let mut handles = Vec::new();
>
>     for &name in names {
>         // `async move` captures `name` (a &'static str copy) into the task.
>         // Each iteration creates a brand-new Future — a fresh state machine.
>         let handle = tokio::spawn(async move {
>             format!("Hello, {}!", name)
>         });
>         handles.push(handle);
>     }
>
>     for handle in handles {
>         println!("{}", handle.await.unwrap());
>     }
> }
> ```
>
> **Answer to the sharing question:**
> `tokio::spawn` requires `'static` — the task must be self-contained and not hold any references to data on the spawning function's stack. A `&str` pointing into a local `names` slice on `main`'s stack would violate this: if `main` returned while a task was still running, the pointer would dangle. `async move` solves this by *copying* the `&'static str` pointer (which points into the binary's read-only segment, not the stack) into the task, making each task fully independent.

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
