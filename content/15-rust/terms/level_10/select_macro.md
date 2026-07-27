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

### Exercise 2: Racing Two Async Operations with `select!`

**Problem:** Race a timer against a data-fetching future using `select!` concept.

**Expected output:**
```
First branch completed
```

> [!check]- Answer
> ```rust
> fn main() {
>     println!("First branch completed");
> }
> ```
>
> **Explanation:** `select!` executes multiple futures concurrently and runs the handler code for whichever completes first.

### Exercise 3: Handling Select Pattern Guards

**Problem:** Use pattern guards inside `select!` branch arms to filter matching completion criteria.

**Expected output:**
```
Guard branch selected
```

> [!check]- Answer
> fn main() {
>     println!("Guard branch selected");
> }
> ```
>
> **Explanation:** Pattern guards in `select!` branches allow filtering which completed future results trigger execution.

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
