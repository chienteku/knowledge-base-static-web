# `join!`

> **Level 10 — Async / Await**
> Macro that runs multiple futures concurrently and waits for all to complete.

---

## 1. Prerequisites

- [`Tokio`](../level_10/tokio.md) — The async runtime that provides this macro.
- [`Future` Trait](../level_10/future_trait.md) — The state machines that `join!` runs.
- [`select!`](../level_10/select_macro.md) — The opposite of `join!` (waits for only one to finish).

---

## 2. Term Category

**Rust Tooling (the async team player)**: If `tokio::select!` is a ruthless race where the losers are instantly fired, **`tokio::join!`** is a team project where nobody is allowed to go home until everyone is finished with their work.

It takes multiple Futures, runs them all concurrently on the same OS thread, and returns a massive Tuple containing all of their final results.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In web servers, you constantly need to fetch data from multiple independent sources to build a single HTML response. 

For example, a User Profile page might need to fetch the User's Data from a SQL database, and the User's Avatar image from an AWS S3 bucket. 
- If you `.await` the User Data, and *then* `.await` the Avatar sequentially, you are wasting time standing idle!
- You want to fetch them at the exact same time!

`tokio::join!` solves this. You hand it two Futures. It polls them simultaneously. When they both finish, it hands you back both pieces of data!

### (2) Reality Metaphor

Imagine you are cooking breakfast. 

- **Sequential (`.await` then `.await`)**: You put toast in the toaster. You stand still for 3 minutes until it pops up. *Then* you start frying eggs. You wait 5 minutes. Breakfast takes **8 minutes** total.
- **Concurrent (`join!`)**: You put toast in the toaster. You instantly walk over and start frying eggs. You rapidly switch your attention between the two. Breakfast takes **5 minutes** total (the length of the longest task). You don't serve the plate until *both* are finished!

### (3) Rust Code Examples

#### Short Snippet (The Classic Parallel Fetch)
Notice how `join!` returns a tuple containing the exact types returned by the two Futures.

```rust
async fn fetch_user() -> String { "Alice".to_string() }
async fn fetch_avatar() -> Vec<u8> { vec![0, 1, 2] }

#[tokio::main]
async fn main() {
    // We do NOT .await them individually! We pass the raw Futures into join!
    // The macro .awaits them both concurrently.
    let (user, avatar) = tokio::join!(fetch_user(), fetch_avatar());
    
    println!("Found user {} with avatar size {}", user, avatar.len());
}
```

#### Fuller Example (The Speed Test)
Let's prove that `join!` actually runs concurrently by measuring how long it takes to run three futures that sleep for 1, 2, and 3 seconds.

```rust
use tokio::time::{sleep, Duration};
use std::time::Instant;

async fn task_one() { sleep(Duration::from_secs(1)).await; }
async fn task_two() { sleep(Duration::from_secs(2)).await; }
async fn task_three() { sleep(Duration::from_secs(3)).await; }

#[tokio::main]
async fn main() {
    let start = Instant::now();

    // Run all three at the exact same time!
    tokio::join!(task_one(), task_two(), task_three());
    
    let duration = start.elapsed();
    
    // This will print ~3 seconds, NOT 6 seconds!
    // The total time is simply the time of the longest single task.
    println!("Finished all three tasks in {:?}", duration);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Join Macro Scoping and Lifecycle Rules

**The mistake:** Assuming Join Macro instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("join_macro_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("join_macro_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Join Macro State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Join Macro through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Join Macro Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Join Macro instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Math Problem

**Problem:** Future A takes 5 seconds. Future B takes 2 seconds. Future C takes 10 seconds. 

1. If you `.await` them sequentially (one by one), how long does the program take? 
2. If you use `tokio::join!(A, B, C)`, how long does the program take?

> [!check]- Answer
> 1. **Sequentially**: It takes **17 seconds** (5 + 2 + 10).
> 2. **Concurrently**: It takes **10 seconds** (the duration of the single longest task).

---

### Exercise 2: `tokio::join!` — Running Two Futures Concurrently

**Problem:**
`tokio::join!` polls all its futures concurrently on the *same thread* and returns a tuple of their results when *all* finish. This is fundamentally different from sequential `.await`: both futures make progress during each other's await points.

Write a `#[tokio::main]` program that:
1. Defines `async fn fetch_user() -> u32` — sleeps 80 ms, returns `10`.
2. Defines `async fn fetch_score() -> u32` — sleeps 50 ms, returns `20`.
3. Uses `tokio::join!` to run both concurrently and unpack the results into `(user, score)`.
4. Prints `"Results: {user}, {score}"`.

Then answer: **approximately how long does the whole program take, and why?**

**Expected output:**
> [!check]- Answer
> ```text
> Results: 10, 20
> ```
> *(takes ~80 ms, not ~130 ms)*
>
> - **Hint 1:** `let (user, score) = tokio::join!(fetch_user(), fetch_score());` — `join!` returns a tuple in the same order as the listed futures. Both futures start polling immediately and make progress concurrently.
> - **Hint 2:** The total time is approximately `max(80, 50) = 80 ms`, not `80 + 50 = 130 ms`. Both futures are sleeping at the same time — the executor polls them both, and whichever wakes first gets resumed first. The program is done when the *longest* future finishes.
> - **Hint 3:** `join!` does **not** create separate threads. Both futures run on the same async executor thread. This concurrency is cooperative: the executor switches between them at `.await` points. This is why blocking one future (e.g. with `std::thread::sleep`) would freeze the other.
>
> ```rust
> use tokio::time::{sleep, Duration};
>
> async fn fetch_user() -> u32 {
>     sleep(Duration::from_millis(80)).await;
>     10
> }
>
> async fn fetch_score() -> u32 {
>     sleep(Duration::from_millis(50)).await;
>     20
> }
>
> #[tokio::main]
> async fn main() {
>     // Both futures start running immediately and overlap.
>     // The tuple is returned only when BOTH are finished.
>     let (user, score) = tokio::join!(fetch_user(), fetch_score());
>     println!("Results: {}, {}", user, score);
> }
> ```
>
> **Explanation:**
> `tokio::join!` is a macro that expands into a single state machine that polls all listed futures on each executor wake. Unlike sequential `.await` (which only starts future B after A finishes), `join!` allows A and B to make progress simultaneously — whenever one yields at a `.await`, the executor can poll the other. The result is that the total wall-clock time equals the *longest* future's duration, not their sum.

---

### Exercise 3: `tokio::try_join!` — Concurrency with Error Short-Circuiting

**Problem:**
`tokio::try_join!` works like `join!` but is designed for `Result`-returning futures. If *any* future returns `Err`, `try_join!` immediately cancels the remaining futures and returns that `Err` — without waiting for the others to finish.

Write a `#[tokio::main]` program that:
1. Defines `async fn fetch_a() -> Result<u32, &'static str>` — sleeps 30 ms and returns `Ok(100)`.
2. Defines `async fn fetch_b() -> Result<u32, &'static str>` — sleeps 10 ms and returns `Err("service B is down")`.
3. Uses `tokio::try_join!(fetch_a(), fetch_b())` and matches the result:
   - `Ok((a, b))` — prints `"Both succeeded: {a}, {b}"`.
   - `Err(e)` — prints `"One failed: {e}"`.

**Expected output:**
> [!check]- Answer
> ```text
> One failed: service B is down
> ```
>
> - **Hint 1:** `try_join!` requires all futures to have the **same** error type. It returns `Result<(T1, T2, ...), E>` — `Ok` only if all succeed, `Err` as soon as any fails.
> - **Hint 2:** Because `fetch_b` resolves in 10 ms (before `fetch_a`'s 30 ms), the `Err` is received first. At that point, `fetch_a`'s future is dropped — it will not be polled again, and its 30 ms sleep is cancelled. The program exits in ~10 ms, not ~30 ms.
> - **Hint 3:** `try_join!` cancels the other futures by dropping them. This is why futures in `try_join!` must be *cancellation-safe* — dropping them mid-execution should not leave shared state in an inconsistent state.
>
> ```rust
> use tokio::time::{sleep, Duration};
>
> async fn fetch_a() -> Result<u32, &'static str> {
>     sleep(Duration::from_millis(30)).await;
>     Ok(100)
> }
>
> async fn fetch_b() -> Result<u32, &'static str> {
>     sleep(Duration::from_millis(10)).await;
>     Err("service B is down") // returns Err after just 10 ms
> }
>
> #[tokio::main]
> async fn main() {
>     // try_join! runs both concurrently but short-circuits on the first Err.
>     match tokio::try_join!(fetch_a(), fetch_b()) {
>         Ok((a, b)) => println!("Both succeeded: {}, {}", a, b),
>         Err(e)     => println!("One failed: {}", e),
>     }
> }
> ```
>
> **Explanation:**
> `try_join!` is the idiomatic way to fan out multiple fallible async operations (e.g. parallel API calls) and fail fast if any of them errors. It avoids the need to manually track which futures have finished and which to cancel. The key difference from `join!` is that `join!` always waits for all futures regardless of success/failure, while `try_join!` aborts on the first `Err`. Use `join!` when each future's result is independent; use `try_join!` when a failure in any one makes the others pointless.

---

## 6. Related Terms

- [`tokio::select!`](../level_10/select_macro.md) — The ruthless race where only the first one to finish survives.
- [`tokio::spawn`](../level_10/tokio_spawn.md) — How you actually push tasks onto the background Executor thread pool instead of just polling them on the current thread.

---

## 7. Key Takeaways

- **`tokio::join!`** runs multiple Futures concurrently on the current thread.
- It waits until **all** Futures have finished, returning a Tuple of their results.
- It dramatically speeds up programs by avoiding sequential waiting (waiting for a database query to finish before starting a network request).
- It runs on the **current thread**. If one Future blocks the CPU, the other Futures in the `join!` will freeze!
- It only works for a fixed number of Futures. For a `Vec` of Futures, use `futures::future::join_all`.
