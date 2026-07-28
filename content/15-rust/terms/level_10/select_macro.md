# `select!`

> **Level 10 — Async / Await**
> Macro that polls multiple futures and executes the branch of the first to complete.

---

## 1. Prerequisites

- [`Tokio`](../level_10/tokio.md) — The async runtime that provides this macro (`tokio::select!`).
- [`Future` Trait](../level_10/future_trait.md) — The state machines that are being raced against each other.
- [`await`](../level_10/await.md) — The standard way to run a single Future, which `select!` replaces when running multiple.

---

## 2. Term Category

**Rust Tooling (the async race track)**: The `tokio::select!` macro is one of the most powerful, brilliant, and commonly used tools in asynchronous Rust. 

It allows you to run multiple Futures at the exact same time, wait for the *first* one to finish, and immediately **cancel** all the others!

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In high-performance systems, you frequently need **timeouts** or **cancellation**. 

For example, if you query a database, you don't want your server to hang forever if the database crashes. You want to query the database, but if 5 seconds pass, you want to instantly abort the query and return an error. How do you "race" a database query against a 5-second timer? 

In standard multithreading (`std::thread`), this is a nightmare requiring complex channels, shared atomic booleans, and thread abort signals. 

In Async Rust, you just use `tokio::select!`. It polls all the Futures concurrently. As soon as one finishes, it literally just drops the others from memory, instantly canceling them!

### (2) Reality Metaphor

Imagine you are an Art Collector. You tell your two assistants to buy you a specific painting. 
- Assistant A goes to an auction in New York. 
- Assistant B goes to an auction in London. 

You tell them both: *"Whoever buys the painting first, call me immediately. As soon as one of you buys it, I will instantly text the other one to cancel their auction."* 

`select!` is the Boss who receives the first phone call and instantly fires/cancels the loser!

### (3) Rust Code Examples

#### Short Snippet (The Classic Timeout)
The most common use case for `select!` in the world is implementing a timeout. We race a slow network request against a sleep timer. Whichever finishes first executes its block of code!

```rust
use tokio::time::{sleep, Duration};

async fn fetch_data() -> String {
    // Simulate a slow database that takes 10 seconds!
    sleep(Duration::from_secs(10)).await;
    String::from("Data")
}

#[tokio::main]
async fn main() {
    tokio::select! {
        // Branch 1: The Database Query
        data = fetch_data() => {
            println!("Success! Got: {}", data);
        }
        // Branch 2: The Timer
        _ = sleep(Duration::from_secs(3)) => {
            println!("Error: The database query timed out!");
        }
    }
    // Because the timer finishes in 3 seconds, Branch 2 wins!
    // The `fetch_data` future is instantly cancelled and destroyed!
}
```

#### Fuller Example (The Shutdown Signal)
Another incredibly common use case is a server loop that listens for messages, but also listens for a global "Shutdown" signal (like the user pressing `Ctrl+C`).

```rust
use tokio::sync::mpsc;

#[tokio::main]
async fn main() {
    let (mut msg_tx, mut msg_rx) = mpsc::channel(32);
    let (mut shutdown_tx, mut shutdown_rx) = mpsc::channel(1);

    tokio::spawn(async move {
        loop {
            tokio::select! {
                // Branch 1: A user sends a chat message
                Some(msg) = msg_rx.recv() => {
                    println!("Received chat message: {}", msg);
                }
                // Branch 2: The server administrator clicks "Shutdown"
                _ = shutdown_rx.recv() => {
                    println!("Shutdown signal received. Stopping server!");
                    break; // Exits the loop and kills the task!
                }
            }
        }
    });

    // ... code to send messages or trigger shutdown ...
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Select Macro Scoping and Lifecycle Rules

**The mistake:** Assuming Select Macro instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("select_macro_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("select_macro_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Select Macro State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Select Macro through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Select Macro Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Select Macro instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Losers

**Problem:** You have a `tokio::select!` block with 3 branches: A, B, and C. Branch B finishes first. What exactly happens to Branch A and Branch C?

> [!check]- Answer
> They are instantly **dropped** from memory and **cancelled**! 
>
> Their `.poll()` methods will never be called again, and any progress they made is aborted.

---

### Exercise 2: Implementing a Timeout with `select!`

**Problem:**
You have an async function `fetch_data()` that simulates a slow database query taking **2 seconds**. You want it to fail fast with an error message if it takes longer than **500 ms**.

Write a `#[tokio::main]` program using `tokio::select!` to race `fetch_data()` against a `tokio::time::sleep(Duration::from_millis(500))` timer. Print which branch wins.

Then answer: **after the timer branch wins, is `fetch_data()` still running in the background?**

**Expected output:**
> [!check]- Answer
> *(The timer always wins because 500 ms < 2 s)*
> ```text
> Timeout! fetch_data took too long.
> ```
>
> - **Hint 1:** The `select!` syntax for each branch is `result_binding = future_expression => { handler_block }`. Both branches are polled concurrently on each iteration of the executor loop; whichever resolves first runs its handler and drops the other.
> - **Hint 2:** If you don't need the value from a branch (e.g. the sleep timer returns `()`), use `_` as the binding: `_ = sleep(...) => { ... }`.
> - **Hint 3 (cancellation answer):** No. When the timer branch wins, Tokio `drop`s the `fetch_data()` future immediately. Its memory is freed, its `.poll()` will never be called again, and the simulated database query is cancelled. This is the defining feature of `select!` and why the futures inside must be *cancellation-safe*.
>
> ```rust
> use tokio::time::{sleep, Duration};
>
> // Simulates a slow database query: takes 2 seconds to complete.
> async fn fetch_data() -> &'static str {
>     sleep(Duration::from_secs(2)).await;
>     "database result"
> }
>
> #[tokio::main]
> async fn main() {
>     tokio::select! {
>         // Branch A: the slow database query.
>         data = fetch_data() => {
>             println!("Got data: {}", data);
>         }
>         // Branch B: 500 ms deadline. Wins because 500 ms < 2 s.
>         // `fetch_data()` is dropped the instant this branch resolves.
>         _ = sleep(Duration::from_millis(500)) => {
>             println!("Timeout! fetch_data took too long.");
>         }
>     }
> }
> ```
>
> **Explanation:**
> `tokio::select!` compiles into a state machine that calls `poll()` on all listed futures on each executor wake. The first future to return `Poll::Ready` wins: its handler block runs, and all remaining futures in the `select!` are **synchronously dropped** — not cancelled via a signal, but literally deallocated. This is why the timeout takes exactly 500 ms (not 2 s): the executor never waits for the losing branch. The pattern is the idiomatic Rust replacement for callback-based timeout APIs and is far simpler than coordinating threads with `AtomicBool` cancellation flags.

---

### Exercise 3: Combining `select!` with Pattern Guards for a Shutdown Loop

**Problem:**
Pattern guards let you make a `select!` branch *conditionally* active — the branch only "wins" if both its future resolves *and* a boolean guard expression is true. If the guard is false, `select!` skips that branch entirely, even if its future is ready.

Write a `#[tokio::main]` program that:

1. Creates a `tokio::sync::mpsc` channel and spawns a task that sends the integers `1, 2, 3, 99, 4` with a 50 ms gap between each.
2. In `main`, runs a loop with a `select!` block containing **two branches**:
   - **Message branch:** `Some(n) = rx.recv() if n != 99 =>` — prints `"Received: {n}"` for all values *except* 99.
   - **Poison-pill branch:** `Some(n) = rx.recv() if n == 99 =>` — prints `"Poison pill received! Shutting down."` and `break`s the loop.
3. After the loop, print `"Loop exited cleanly."`

**Expected output:**
> [!check]- Answer
> ```text
> Received: 1
> Received: 2
> Received: 3
> Poison pill received! Shutting down.
> Loop exited cleanly.
> ```
>
> - **Hint 1:** Pattern guards in `select!` branches use the same `if condition` syntax as `match` arms: `Some(n) = rx.recv() if n != 99 => { ... }`. The future is polled only once per `select!` invocation; if the guard fails on the result, `select!` re-polls other branches or re-enters the next loop iteration.
> - **Hint 2:** When two branches poll the *same* future (both call `rx.recv()`), there is a subtlety: `select!` internally uses `biased` or random branch ordering. For this exercise, Tokio's `select!` will evaluate branches in a pseudo-random order to avoid starvation, but for a single `mpsc` receiver only one branch can win per value.
> - **Hint 3:** `mpsc::channel` returns `(Sender<T>, Receiver<T>)`. Use `tx.send(value).await` in the spawned task and `rx.recv().await` (implicitly inside `select!`) in the main loop. The channel's `recv()` returns `Option<T>` — `None` when all senders have dropped.
> - **Hint 4:** You must `Box::pin` or use `tokio::pin!` if you want to *reuse* a single `Future` across multiple `select!` iterations. However, calling `rx.recv()` inside the `select!` expression each iteration creates a fresh `Future` per loop — which is fine for channels.
>
> ```rust
> use tokio::sync::mpsc;
> use tokio::time::{sleep, Duration};
>
> #[tokio::main]
> async fn main() {
>     let (tx, mut rx) = mpsc::channel::<i32>(16);
>
>     // Sender task: emits a sequence with a 99 "poison pill" in the middle.
>     tokio::spawn(async move {
>         for n in [1, 2, 3, 99, 4] {
>             sleep(Duration::from_millis(50)).await;
>             let _ = tx.send(n).await;
>         }
>     });
>
>     loop {
>         tokio::select! {
>             // Branch A: normal values — guard passes for anything that isn't 99.
>             Some(n) = rx.recv(), if n != 99 => {
>                 println!("Received: {}", n);
>             }
>             // Branch B: poison pill — guard passes only for 99.
>             // When this wins, the branch body breaks the loop.
>             Some(n) = rx.recv(), if n == 99 => {
>                 println!("Poison pill received! Shutting down.");
>                 break;
>             }
>         }
>     }
>
>     println!("Loop exited cleanly.");
> }
> ```
>
> **Explanation:**
> Pattern guards inside `select!` are evaluated *after* the future resolves but *before* the branch handler runs. If a guard is false, `select!` treats that branch as if it had returned `Poll::Pending` — it simply doesn't run its handler and continues polling other branches. This gives you fine-grained control over *which* resolved value should win the race, not just *which future* resolved first.
>
> The poison-pill pattern (sending a sentinel value to signal shutdown) is a standard Rust async idiom. It avoids needing a separate shutdown channel entirely: the control signal travels through the same data channel as normal messages, making the ordering guarantee trivial — the shutdown only fires after all preceding messages have been processed.

---

## 6. Related Terms

- [`tokio::join!`](../level_10/join_macro.md) — The opposite of `select!`. `join!` runs multiple futures concurrently but waits for **ALL** of them to finish, rather than just the first one.
- [`Future` Trait](../level_10/future_trait.md) — The state machines that `select!` is polling.

---

## 7. Key Takeaways

- **`tokio::select!`** races multiple Futures concurrently on the same thread.
- It executes the block of code for the **first** Future to finish.
- As soon as the winner finishes, all the other losing Futures are instantly **dropped and cancelled**.
- It is incredibly useful for implementing **Timeouts** (racing a network request against a `tokio::time::sleep` timer) or **Shutdown signals**.
- You must ensure the Futures inside `select!` are **Cancellation Safe**, because losing the race means being violently aborted mid-execution!
