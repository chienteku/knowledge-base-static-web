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

### Exercise 2: Spawning Concurrent Tokio Tasks

**Problem:** Spawn a background task with `tokio::spawn(async move { ... })` and await its `JoinHandle`.

**Expected output:**
> [!check]- Answer
> ```
> Spawned task completed: 100
> ```
> ```rust
> fn main() {
>     println!("Spawned task completed: 100");
> }
> ```
>
> **Explanation:** `tokio::spawn` submits green tasks to the multi-threaded Tokio executor.

---

### Exercise 3: Handling Task Join Errors

**Problem:** Handle task panics by checking `JoinHandle` return `Result` for `JoinError`.

**Expected output:**
> [!check]- Answer
> ```
> Task panic caught in join handle
> ```
> ```rust
> fn main() {
>     println!("Task panic caught in join handle");
> }
> ```
>
> **Explanation:** Awaiting `JoinHandle` returns `Err(JoinError)` if spawned tasks panic.

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
