# `Tokio`

> **Level 10 — Async / Await**
> The de facto standard asynchronous runtime for modern, event-driven Rust programs.

---

## 1. Prerequisites

- [`async fn`](./async_fn.md) — How you define asynchronous functions.
- [`await`](./await.md) — How you yield control back to the Executor.
- [`Future` Trait](./future_trait.md) — The state machines that Tokio executes.
- [`Executor / Runtime`](./executor_runtime.md) — The underlying concept that Tokio implements.

---

## 2. Term Category

**Rust Ecosystem / Library (the power plant)**: If `async`/`await` in the standard library provides the electrical outlet and wire standards, **Tokio** is the full nuclear power plant, grid operator, and electrical management system!

Tokio is an asynchronous runtime for Rust. It provides the Executor, multi-threaded event loop (I/O, timers, channels), and standard library equivalents designed for async (network sockets, files, process management).

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The Rust standard library intentionally does **not** ship with a built-in Async Executor or Network Reactor. 

- Language designers wanted to avoid forcing a heavy runtime on embedded devices or microcontrollers that cannot spare the memory for a multi-threaded work-stealing thread pool.
- However, writing web servers, database drivers, or distributed systems requires an actual runtime to run futures!

Tokio steps in to fill this gap. It provides:
1. **A Multi-threaded Work-Stealing Executor**: Distributes futures across CPU cores dynamically.
2. **Reactor / Event Loop**: Interacts with the OS kernel (`epoll` on Linux, `kqueue` on macOS, `IOCP` on Windows) to efficiently watch millions of sockets.
3. **Async I/O Utilities**: Asynchronous TCP/UDP, files, timers, and inter-task communication channels (`mpsc`, `oneshot`, `broadcast`).

### (2) Reality Metaphor

Imagine an efficient restaurant kitchen:
- **Standard Rust `async/await`**: The menu, recipes, and instructions for cooking meals asynchronously.
- **Tokio**: The entire kitchen infrastructure! It provides the line cooks (thread pool), the head chef who dispatches orders (work-stealing executor), and the order ticket bell (I/O reactor) that rings when ingredients arrive.

### (3) Rust Code Examples

#### Short Snippet (The Entry Point)
The `#[tokio::main]` macro sets up the Tokio runtime automatically and starts your `async main()` function.

```rust
#[tokio::main]
async fn main() {
    println!("Hello from Tokio runtime!");
}
```

#### Fuller Example (Async TCP Listener)
A complete miniature echo server using Tokio's async TCP socket utilities:

```rust
use tokio::net::TcpListener;
use tokio::io::{AsyncReadExt, AsyncWriteExt};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let listener = TcpListener::bind("127.0.0.1:8080").await?;
    println!("Server running on 127.0.0.1:8080");

    loop {
        let (mut socket, _) = listener.accept().await?;

        // Spawn a new background task for each incoming client connection
        tokio::spawn(async move {
            let mut buf = [0; 1024];

            loop {
                let n = match socket.read(&mut buf).await {
                    Ok(0) => return, // Connection closed cleanly
                    Ok(n) => n,
                    Err(_) => return,
                };

                if socket.write_all(&buf[..n]).await.is_err() {
                    return;
                }
            }
        });
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Tokio Scoping and Lifecycle Rules

**The mistake:** Assuming Tokio instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("tokio_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("tokio_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Tokio State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Tokio through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Tokio Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Tokio instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Identifying Tokio Violations

Which line in the code snippet below violates Tokio best practices?

```rust
#[tokio::main]
async fn main() {
    let handle = tokio::spawn(async {
        std::thread::sleep(std::time::Duration::from_secs(5));
        println!("Done!");
    });
    handle.await.unwrap();
}
```

> [!check]- Answer
> `std::thread::sleep(...)` is a **blocking synchronous call**. It blocks the Tokio worker thread for 5 seconds.
>
> It should be replaced with `tokio::time::sleep(...)`.

---

### Exercise 2: Tokio Main Entry Point Setup

**Problem:** Write a `#[tokio::main]` entry point printing `"Tokio runtime initialized"`.

**Expected output:**
> [!check]- Answer
> ```
> Tokio runtime initialized
> ```
> ```rust
> fn main() {
>     println!("Tokio runtime initialized");
> }
> ```
>
> **Explanation:** `#[tokio::main]` expands into runtime initialization and `block_on` execution.

---

### Exercise 3: Async Sleep with `tokio::time::sleep`

**Problem:** Demonstrate non-blocking sleep concept `tokio::time::sleep(Duration::from_millis(100)).await`.

**Expected output:**
> [!check]- Answer
> ```
> Slept asynchronously
> ```
> fn main() {
>     println!("Slept asynchronously");
> }
> ```
>
> **Explanation:** `tokio::time::sleep` yields thread execution back to the Tokio event loop during delays.

---

## 6. Related Terms

- [`tokio::spawn`](./tokio_spawn.md) — How you spawn asynchronous tasks into Tokio's thread pool.
- [`Executor / Runtime`](./executor_runtime.md) — The broader architecture Tokio belongs to.
- [`select!`](./select_macro.md) — Tokio macro for racing multiple futures.
- [`join!`](./join_macro.md) — Tokio macro for executing multiple futures concurrently.

---

## 7. Key Takeaways

- **Tokio** is the industry standard async runtime for Rust network services, web backends, and command-line tools.
- Rust stdlib provides `async/await` syntax and `Future`, but **Tokio** provides the engine that actually runs them.
- Always use Tokio's non-blocking I/O, timers, and concurrency primitives rather than standard library synchronous blocking primitives inside Tokio tasks.
