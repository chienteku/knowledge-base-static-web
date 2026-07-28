# `tokio::spawn`

> **Level 10 — Async / Await**
> Spawns an async task onto the Tokio runtime.

---

## 1. Prerequisites

- [`Tokio`](../level_10/tokio.md) — The async runtime (the Executor) that this function interacts with.
- [`std::thread::spawn`](../level_09/std_thread_spawn.md) — The heavy OS-level spawning function that this is designed to replace.
- [`Future` Trait](../level_10/future_trait.md) — The state machine that gets spawned!

---

## 2. Term Category

**Rust Tooling (the green thread generator)**: `tokio::spawn` is the asynchronous, ultra-lightweight equivalent of `std::thread::spawn`. 

Instead of asking the Operating System to create a heavy, 2-megabyte thread, `tokio::spawn` asks the Tokio Executor to create a lightweight, 1-kilobyte "Task" (often called a *green thread*). You can comfortably spawn 100,000 tasks on a single laptop without breaking a sweat!

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The core loop of any Web Server is conceptually simple: *"Receive a request, spawn a thread to handle it, return the response."* 

In the early 2000s, the "C10K problem" (handling 10,000 concurrent network connections) was a massive engineering challenge. If you spawned 10,000 OS threads, your server would instantly crash from memory exhaustion! 

Tokio solves this by decoupling the work from the OS threads. Tokio boots up a small pool of OS threads (usually one per CPU core). When you call `tokio::spawn`, it takes your `Future` and hands it to the Executor. The Executor intelligently schedules millions of these lightweight "Tasks" onto that small pool of OS threads.

### (2) Reality Metaphor

Imagine an Amazon Fulfillment Center processing orders. 

- **`std::thread::spawn`**: Whenever an order comes in, you hire a brand new employee, buy them a uniform, give them a scanner, and send them to the warehouse. It is incredibly expensive and slow. If you get 10,000 orders at once, you instantly go bankrupt hiring people.
- **`tokio::spawn`**: You have a fixed, elite crew of 8 veteran workers (the OS threads). Whenever an order comes in, you print a barcode ticket (a **Task**) and drop it on a conveyor belt. The 8 workers just rapidly grab tickets off the belt as fast as they can. If a ticket requires waiting for a forklift to arrive (`.await`), they put the ticket back on the belt and grab another one! It is massively scalable!

### (3) Rust Code Examples

#### Short Snippet (The Spawning)
Just like `thread::spawn`, it takes a closure (specifically, an `async move` block) and returns a `JoinHandle`.

```rust
use tokio::task;

#[tokio::main]
async fn main() {
    // We spawn a lightweight Task onto the conveyor belt!
    let handle = tokio::spawn(async move {
        // Do some async work here...
        return 42;
    });

    // We await the handle to get the final result!
    let result = handle.await.unwrap();
    println!("Task returned: {}", result);
}
```

#### Fuller Example (The Concurrent Server)
Let's build a basic concurrent "server" loop. We loop 10 times, spawning a task for each request. Watch how they all run concurrently!

```rust
use tokio::time::{sleep, Duration};

#[tokio::main]
async fn main() {
    let mut handles = vec![];

    // Simulate receiving 10 concurrent requests
    for i in 1..=10 {
        // We spawn a Task for each request!
        let handle = tokio::spawn(async move {
            println!("Request {} started processing...", i);
            
            // Simulate a slow database query. 
            // Because we use tokio sleep, the OS thread is NOT blocked!
            // It instantly grabs the next task off the conveyor belt!
            sleep(Duration::from_millis(500)).await;
            
            println!("Request {} finished!", i);
            i * 10 // Return some data
        });
        
        handles.push(handle);
    }

    // Wait for all 10 tasks to finish and collect their results
    for handle in handles {
        let result = handle.await.unwrap();
        println!("Collected result: {}", result);
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Tokio Spawn Scoping and Lifecycle Rules

**The mistake:** Assuming Tokio Spawn instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("tokio_spawn_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("tokio_spawn_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Tokio Spawn State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Tokio Spawn through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Tokio Spawn Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Tokio Spawn instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Wait

**Problem:** You write `let handle = tokio::spawn(async move { fetch_data().await });`. Why does `tokio::spawn` return a `JoinHandle` instead of just returning the data immediately?

> [!check]- Answer
> Because the data isn't ready yet! 
>
> `tokio::spawn` executes the code *in the background*. It instantly returns a `JoinHandle`, which is itself a `Future`. You must `.await` the `JoinHandle` later on to finally extract the finished data!

---

### Exercise 2: Spawning Concurrent Tasks That Share Data

**Problem:**
You have a counter value `42` that needs to be processed by **three independent tasks** running concurrently. Each task should multiply the counter by its own task number (1, 2, and 3) and return the result. The main task collects all three results and prints them.

Constraints:
- Each spawned task must **own** the data it uses (you cannot pass a `&` reference into `tokio::spawn` — tasks must be `'static`).
- All three tasks must be spawned **before** any of them are awaited, so they run concurrently.
- Collect the results in order and print each one.

**Expected output:**
> [!check]- Answer
> ```text
> Task 1 result: 42
> Task 2 result: 84
> Task 3 result: 126
> ```
>
> - **Hint 1:** `tokio::spawn` requires the async block to be `'static` — it cannot hold borrowed references to variables on the stack. Use `async move` to *move* ownership into the block. For shared data, wrap it in `Arc<T>` and clone the `Arc` before each spawn.
> - **Hint 2:** Spawn all tasks first, collecting `JoinHandle`s into a `Vec`. Then iterate the `Vec` awaiting each handle. If you `.await` each handle right after spawning, you'd serialize the tasks — defeating the purpose of concurrent spawning.
> - **Hint 3:** `handle.await` returns `Result<T, JoinError>`. Call `.unwrap()` (or `?`) to extract the inner value for this exercise.
>
> ```rust
> use std::sync::Arc;
>
> #[tokio::main]
> async fn main() {
>     // Arc lets each task clone a handle without requiring a `'static` borrow.
>     let counter = Arc::new(42_u64);
>
>     let mut handles = vec![];
>
>     // Spawn all three tasks BEFORE awaiting any of them → true concurrency.
>     for task_num in 1_u64..=3 {
>         let counter = Arc::clone(&counter); // clone the Arc, not the data
>         let handle = tokio::spawn(async move {
>             // `counter` and `task_num` are moved in; no borrowed references.
>             *counter * task_num
>         });
>         handles.push(handle);
>     }
>
>     // Collect results in order (1, 2, 3).
>     for (i, handle) in handles.into_iter().enumerate() {
>         let result = handle.await.unwrap();
>         println!("Task {} result: {}", i + 1, result);
>     }
> }
> ```
>
> **Explanation:**
> `tokio::spawn` enforces a `'static` bound on its closure — the spawned task may outlive the function that created it, so it cannot borrow anything from the caller's stack. `Arc::clone` creates a new reference-counted handle to the same heap allocation, giving each task its own owned pointer at the cost of just an atomic reference-count increment. Spawning all handles before awaiting any of them is the key to concurrency: the Tokio executor can schedule all three tasks simultaneously on its thread pool, so their total runtime approaches the maximum of their individual runtimes — not the sum.

---

### Exercise 3: Catching Task Panics via `JoinError`

**Problem:**
Unlike `std::thread::spawn`, a panic inside a `tokio::spawn`ed task does **not** propagate automatically to the parent — it is captured inside the `JoinHandle`'s `Result`. This makes it possible to recover gracefully from a panicking task without crashing the whole program.

Write a `#[tokio::main]` program that:

1. Spawns a **healthy task** that returns the string `"all good"`.
2. Spawns a **panicking task** that calls `panic!("something went wrong")`.
3. Awaits both `JoinHandle`s and pattern-matches the `Result` to print:
   - `"Task succeeded: all good"` for the healthy task.
   - `"Task panicked: <reason>"` for the panicking task (extract the message from `JoinError`).

**Expected output:**
> [!check]- Answer
> ```text
> Task succeeded: all good
> Task panicked: something went wrong
> ```
> *(The panic message may also include Tokio's internal formatting depending on version.)*
>
> - **Hint 1:** `handle.await` returns `Result<T, tokio::task::JoinError>`. A task panic produces `Err(JoinError)` — it does **not** unwind into the spawning task. This is a deliberate isolation boundary.
> - **Hint 2:** `JoinError` has two variants accessible via methods: `.is_panic()` returns `true` for task panics, and `.is_cancelled()` returns `true` for tasks cancelled via `JoinHandle::abort()`. Use `err.is_panic()` to distinguish them.
> - **Hint 3:** To extract the panic message from a `JoinError`, call `.into_panic()` which returns a `Box<dyn Any>`. Downcast it with `.downcast_ref::<&str>()` or `.downcast_ref::<String>()` to get the original panic payload.
>
> ```rust
> #[tokio::main]
> async fn main() {
>     // Task 1: completes normally and returns a value.
>     let healthy = tokio::spawn(async {
>         "all good" // &'static str is 'static, safe to return from spawn
>     });
>
>     // Task 2: panics internally. The panic is caught by Tokio and stored in JoinError.
>     // It does NOT propagate to this task unless we explicitly re-panic.
>     let panicking = tokio::spawn(async {
>         panic!("something went wrong");
>         #[allow(unreachable_code)]
>         "never reached"
>     });
>
>     // Pattern-match on the Result returned by .await.
>     match healthy.await {
>         Ok(msg) => println!("Task succeeded: {}", msg),
>         Err(e) => println!("Task failed unexpectedly: {}", e),
>     }
>
>     match panicking.await {
>         Ok(msg) => println!("Task succeeded: {}", msg),
>         Err(e) if e.is_panic() => {
>             // Downcast the opaque panic payload back to its original type.
>             let reason = e.into_panic();
>             let msg = reason
>                 .downcast_ref::<&str>()
>                 .copied()
>                 .unwrap_or("<non-string panic payload>");
>             println!("Task panicked: {}", msg);
>         }
>         Err(e) => println!("Task was cancelled: {}", e),
>     }
> }
> ```
>
> **Explanation:**
> Tokio isolates task panics at the `JoinHandle` boundary by design. When a spawned task panics, Tokio catches the unwind, wraps the payload in a `JoinError`, and returns `Err(JoinError)` to whoever awaits the handle. The spawning task continues running normally. This mirrors how web servers want to handle request handler panics: log the error and keep serving other requests, rather than crashing the entire process.
>
> Contrast this with `std::thread::spawn`: if you don't join a panicking thread, the panic is silently swallowed (the thread just dies). With `tokio::spawn`, the `JoinHandle` forces you to acknowledge the outcome — you cannot accidentally ignore a task's result because `JoinHandle` is `#[must_use]`, producing a compiler warning if dropped unexamined.

---

## 6. Related Terms

- [`std::thread::spawn`](../level_09/std_thread_spawn.md) — The heavyweight OS equivalent that creates a 2MB thread.
- [`async fn`](../level_10/async_fn.md) — The syntax used to write the `async move` blocks you pass into `tokio::spawn`.

---

## 7. Key Takeaways

- **`tokio::spawn`** executes an async block concurrently in the background as a new Task (a "green thread").
- Tasks are incredibly **lightweight** (under 1KB) compared to OS threads (2MB). You can easily spawn 100,000 tasks.
- It requires the `async move { ... }` block to have a **`'static` lifetime** (no borrowed references allowed!). You must share data using `Arc`.
- It returns a **`JoinHandle`** that you can `.await` to retrieve the return value or catch panics.
- This function is the fundamental building block of all highly-scalable Rust web servers!
