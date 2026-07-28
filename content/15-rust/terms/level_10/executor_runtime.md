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

### Exercise 2: Building a Runtime Manually — What `#[tokio::main]` Actually Does

**Problem:**
`#[tokio::main]` is a convenience macro. Under the hood it calls `tokio::runtime::Builder` to construct a runtime, then calls `runtime.block_on(your_async_main())`. Understanding this lets you customise the runtime (e.g. single-threaded, limited workers).

Write a plain synchronous `fn main()` (no macro) that:
1. Builds a **single-threaded** Tokio runtime using `Builder::new_current_thread().enable_all().build().unwrap()`.
2. Calls `runtime.block_on(async { ... })` with an async block that prints `"Running inside block_on"` and returns `42u32`.
3. Prints `"block_on returned: {result}"` back in synchronous `main`.

**Expected output:**
> [!check]- Answer
> ```text
> Running inside block_on
> block_on returned: 42
> ```
>
> - **Hint 1:** `tokio::runtime::Builder::new_current_thread()` creates a single-threaded runtime — all tasks run on the calling thread. `new_multi_thread()` creates the default multi-threaded runtime with one thread per CPU core.
> - **Hint 2:** `enable_all()` enables Tokio's I/O driver and timer driver. Without this, `tokio::time::sleep` and network I/O won't work. `#[tokio::main]` always calls `enable_all()` for you.
> - **Hint 3:** `block_on` drives the given `Future` to completion on the *current thread*, blocking it synchronously. This is the bridge between synchronous `fn main()` and the async world. The runtime is dropped when it goes out of scope, which shuts down all background threads.
>
> ```rust
> use tokio::runtime::Builder;
>
> fn main() {
>     // Build a single-threaded runtime manually.
>     // This is exactly what #[tokio::main(flavor = "current_thread")] generates.
>     let runtime = Builder::new_current_thread()
>         .enable_all()  // enables I/O and timer drivers
>         .build()
>         .unwrap();
>
>     // block_on drives the future on the current thread synchronously.
>     // It will not return until the future resolves.
>     let result: u32 = runtime.block_on(async {
>         println!("Running inside block_on");
>         42
>     });
>
>     println!("block_on returned: {}", result);
>     // runtime drops here → all background resources are cleaned up.
> }
> ```
>
> **Explanation:**
> `block_on` is the fundamental bridge from synchronous Rust to async Rust. It blocks the calling OS thread until the given future resolves, turning an async computation into a synchronous result. The `#[tokio::main]` macro is pure syntactic sugar that generates exactly this boilerplate — knowing the expansion means you can customise it: change the number of worker threads, set thread stack sizes, or integrate with non-Tokio async code that needs its own runtime.

---

### Exercise 3: `spawn_blocking` — Preventing Worker Thread Starvation

**Problem:**
Tokio's worker threads are precious — they run the async event loop. If you call a blocking operation (like `std::fs::read_to_string` or a CPU-intensive calculation) directly on a worker thread, that thread is stuck and cannot poll other tasks.

`tokio::task::spawn_blocking` solves this by running blocking code on a *separate* dedicated thread pool, keeping the async workers free.

Write a `#[tokio::main]` program that:
1. Spawns a `tokio::task::spawn_blocking` task that performs a "heavy" synchronous calculation: `(0u64..1_000_000).sum::<u64>()`. Use `std::thread::sleep(Duration::from_millis(50))` to simulate blocking I/O.
2. While that blocking task is running, concurrently prints `"Async task still running..."` from the async side using `tokio::time::sleep(Duration::from_millis(10)).await` in a short loop (3 iterations).
3. Awaits the `spawn_blocking` result and prints `"Blocking result: {sum}"`.

**Expected output:**
> [!check]- Answer
> ```text
> Async task still running...
> Async task still running...
> Async task still running...
> Blocking result: 499999500000
> ```
> *(order of prints may vary slightly)*
>
> - **Hint 1:** `tokio::task::spawn_blocking(|| { ... })` takes a regular (non-async) closure and runs it on the blocking thread pool. It returns a `JoinHandle<T>` that you `.await` to get the result back in async context.
> - **Hint 2:** The blocking pool is separate from the async worker pool. The async worker that spawned the blocking task is immediately free to run other async tasks (like the `tokio::time::sleep` loop) while the blocking thread runs the synchronous code.
> - **Hint 3:** Use `tokio::join!` or spawn the async loop as a separate task with `tokio::spawn` so it runs concurrently with the `spawn_blocking` call. If you `.await` the blocking handle first with no other tasks running, the async side won't get a chance to print.
>
> ```rust
> use std::time::Duration;
>
> #[tokio::main]
> async fn main() {
>     // Spawn the heavy synchronous work onto the blocking thread pool.
>     // The current async worker thread is immediately freed.
>     let blocking_handle = tokio::task::spawn_blocking(|| {
>         std::thread::sleep(Duration::from_millis(50)); // simulate blocking I/O
>         (0u64..1_000_000).sum::<u64>()  // CPU work
>     });
>
>     // While the blocking thread runs, this async task keeps running.
>     let async_side = tokio::spawn(async {
>         for _ in 0..3 {
>             tokio::time::sleep(Duration::from_millis(10)).await;
>             println!("Async task still running...");
>         }
>     });
>
>     // Wait for both to finish.
>     tokio::join!(async_side, async { () }).0.unwrap();
>     let sum = blocking_handle.await.unwrap();
>     println!("Blocking result: {}", sum);
> }
> ```
>
> **Explanation:**
> Tokio's async worker threads run the event loop — they must never be blocked synchronously or all tasks scheduled on that thread will freeze. `spawn_blocking` moves the blocking call to a dedicated "blocking thread pool" (Tokio manages up to 512 by default) that is allowed to block. The async worker that called `spawn_blocking` is immediately returned to the event loop. The `JoinHandle` returned by `spawn_blocking` is a regular async `Future` — awaiting it just suspends the task until the blocking thread finishes, without blocking any worker thread.

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
