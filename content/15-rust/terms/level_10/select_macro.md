# `select!`

> **Level 10 — Async / Await**
> Macro that runs multiple futures simultaneously and handles whichever one finishes FIRST.

---

## 1. Prerequisites


- [`tokio`](../level_16/tokio.md) — The async runtime providing the `select!` macro.
- [`Future` Trait](future_trait.md) — The state machines that `select!` races against each other.

---

## 2. Term Category

**Rust Tooling (the async race)**: If `tokio::join!` is a team project where everyone waits for each other, **`tokio::select!`** is a fast-paced race where **only the winner matters**.

It takes multiple Futures, polls them all concurrently, and executes the code branch for whichever Future finishes **first**. Crucially, it instantly **cancels and drops** all the losing Futures!

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In networked applications, you constantly need to race operations against deadlines or cancel them when a user disconnects.

For example, when fetching data from a slow remote database:
- You want to wait for the database response.
- **BUT**, if the database takes longer than 3 seconds, you want to abort the query and return a "Timeout Error".

`tokio::select!` handles this effortlessly. You race the `db_query()` future against a `sleep(3 seconds)` timer future. Whichever one finishes first wins, and the other is cancelled immediately.

### (2) Reality Metaphor

Imagine a Game Show with buzzers.

- **`join!`**: The host asks 3 contestants a question. The host stands still until *all three* contestants have finished writing down their answers on paper.
- **`select!`**: The host asks a question. All 3 contestants hover over their buzzers (`select!`). The instant **Contestant A** slaps their buzzer, they get to answer the question (`branch execution`). The other 2 contestants are immediately locked out and ignored!

### (3) Rust Code Examples

#### Short Snippet (The Classic Timeout)
Notice how `select!` takes patterns and branches, similar to a `match` statement!

```rust
use tokio::time::{sleep, Duration};

async fn slow_database_query() -> String {
    sleep(Duration::from_secs(5)).await;
    "Database Data".to_string()
}

#[tokio::main]
async fn main() {
    tokio::select! {
        // Branch 1: The database query
        data = slow_database_query() => {
            println!("Got data: {}", data);
        }
        // Branch 2: The 2-second timeout timer
        _ = sleep(Duration::from_secs(2)) => {
            println!("Error: Database timed out after 2 seconds!");
        }
    }
}
```

#### Fuller Example (Graceful Cancellation in a Server Loop)
This shows how real-world servers use `select!` to continuously handle network requests until a "Shutdown Signal" (like pressing `Ctrl+C`) arrives.

```rust
use tokio::sync::oneshot;
use tokio::time::{sleep, Duration};

async fn handle_user_request(id: u32) {
    println!("Handling request #{}", id);
}

#[tokio::main]
async fn main() {
    // Create a channel to simulate an emergency shutdown signal
    let (shutdown_tx, mut shutdown_rx) = oneshot::channel::<()>();

    // Spawn a background task to trigger shutdown after 3 seconds
    tokio::spawn(async move {
        sleep(Duration::from_secs(3)).await;
        println!(">>> SHUTDOWN SIGNAL RECEIVED <<<");
        let _ = shutdown_tx.send(());
    });

    let mut request_id = 0;

    // Server loop
    loop {
        request_id += 1;

        tokio::select! {
            // Branch 1: Handle incoming user requests
            _ = sleep(Duration::from_secs(1)) => {
                handle_user_request(request_id).await;
            }
            // Branch 2: Watch for emergency shutdown
            _ = &mut shutdown_rx => {
                println!("Stopping server loop cleanly!");
                break; // Exit the loop!
            }
        }
    }
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

---

## 5. Practice Exercises

### Exercise 1: Cancellation-Safe Event Stream Multiplexer

**Scenario:** High-throughput microservice event loops continuously process incoming telemetry messages from an `mpsc` channel, periodic interval ticks for batch flushing, and emergency shutdown signals from a `oneshot` channel. `.await` points inside `tokio::select!` must be cancellation-safe to avoid message loss during racing conditions.

**Requirements:**
Build an event multiplexer loop using `tokio::select!`.

**Requirements**:
1. Define `TelemetryEvent` with `id: u64` and `payload: String`.
2. Write `async fn process_events_with_cancellation_safety(rx: &mut mpsc::Receiver<TelemetryEvent>, shutdown_rx: &mut oneshot::Receiver<()>, flush_interval_ms: u64) -> (usize, usize)` returning `(events_processed, flush_count)`.
3. Use `tokio::select!` to race message reception, interval ticks, and shutdown signals.
4. Add unit tests asserting processing count and clean exit on shutdown.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::time::Duration;
> use tokio::sync::{mpsc, oneshot};
> use tokio::time::interval;
> 
> #[derive(Debug, Clone)]
> pub struct TelemetryEvent {
>     pub id: u64,
>     pub payload: String,
> }
> 
> pub async fn process_events_with_cancellation_safety(
>     rx: &mut mpsc::Receiver<TelemetryEvent>,
>     shutdown_rx: &mut oneshot::Receiver<()>,
>     flush_interval_ms: u64,
> ) -> (usize, usize) {
>     let mut events_processed = 0;
>     let mut flush_count = 0;
>     let mut ticker = interval(Duration::from_millis(flush_interval_ms));
> 
>     loop {
>         tokio::select! {
>             _ = &mut *shutdown_rx => {
>                 break;
>             }
>             _ = ticker.tick() => {
>                 flush_count += 1;
>             }
>             maybe_evt = rx.recv() => {
>                 match maybe_evt {
>                     Some(_evt) => events_processed += 1,
>                     None => break,
>                 }
>             }
>         }
>     }
> 
>     (events_processed, flush_count)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[tokio::test]
>     async fn test_event_multiplexer_shutdown() {
>         let (tx, mut rx) = mpsc::channel(10);
>         let (shutdown_tx, mut shutdown_rx) = oneshot::channel();
> 
>         tx.send(TelemetryEvent { id: 1, payload: "e1".into() }).await.unwrap();
>         tx.send(TelemetryEvent { id: 2, payload: "e2".into() }).await.unwrap();
> 
>         tokio::spawn(async move {
>             tokio::time::sleep(Duration::from_millis(15)).await;
>             let _ = shutdown_tx.send(());
>         });
> 
>         let (processed, flushes) = process_events_with_cancellation_safety(&mut rx, &mut shutdown_rx, 10).await;
>         assert_eq!(processed, 2);
>         assert!(flushes >= 1);
>     }
> }
> ```
> 
> #### Technical Explanation
>
> 1. **Cancellation Safety**: `mpsc::Receiver::recv()` and `Interval::tick()` are cancellation-safe. If one branch finishes first, dropping the uncompleted future of the other branch leaves state consistent without losing data.
> 2. **Branch Multiplexing**: `tokio::select!` polls all branches simultaneously, executing the branch corresponding to whichever future ready first.
> 
> ---
> 
> ### Exercise 2: Biased Priority Request Dispatcher

**Scenario**: In high-priority microservice routers, high-priority emergency alerts must take precedence over standard background tasks when both are available simultaneously in incoming channels. Tokio's `biased;` directive inside `tokio::select!` forces top-to-bottom branch evaluation order.

Construct a priority dispatcher using `tokio::select!` with `biased;`.

**Requirements**:
1. Write `async fn run_dispatcher(high_rx: &mut mpsc::Receiver<String>, low_rx: &mut mpsc::Receiver<String>, max_iterations: usize) -> Vec<String>`.
2. Use `biased;` inside `tokio::select!` to prioritize `high_rx` before `low_rx`.
3. Add unit tests verifying priority handling order.

> [!check]- Answer
> ```rust
> use tokio::sync::mpsc;
> 
> pub async fn run_dispatcher(
>     high_rx: &mut mpsc::Receiver<String>,
>     low_rx: &mut mpsc::Receiver<String>,
>     max_iterations: usize,
> ) -> Vec<String> {
>     let mut processed = Vec::new();
> 
>     for _ in 0..max_iterations {
>         tokio::select! {
>             biased;
> 
>             Some(msg) = high_rx.recv() => {
>                 processed.push(format!("HIGH_{}", msg));
>             }
>             Some(msg) = low_rx.recv() => {
>                 processed.push(format!("LOW_{}", msg));
>             }
>             else => break,
>         }
>     }
> 
>     processed
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[tokio::test]
>     async fn test_biased_priority_dispatcher() {
>         let (high_tx, mut high_rx) = mpsc::channel(10);
>         let (low_tx, mut low_rx) = mpsc::channel(10);
> 
>         low_tx.send("task1".into()).await.unwrap();
>         high_tx.send("alert1".into()).await.unwrap();
> 
>         tokio::time::sleep(std::time::Duration::from_millis(5)).await;
> 
>         let results = run_dispatcher(&mut high_rx, &mut low_rx, 2).await;
>         assert_eq!(results.len(), 2);
>         assert_eq!(results[0], "HIGH_alert1");
>         assert_eq!(results[1], "LOW_task1");
>     }
> }
> ```
> 
> #### Technical Explanation
>
> 1. **Biased Select**: Standard `tokio::select!` randomizes branch polling order to prevent starvation. Inserting `biased;` enforces strict top-to-bottom declaration order, ensuring `high_rx` is always checked before `low_rx`.
> 
> ---
> 
> ### Exercise 3: Hedged RPC Request Race with Dynamic Workers & Fallback

**Scenario**: High-availability systems issue "hedged" parallel requests to multiple redundant RPC nodes. Whichever node responds first provides the result, while slower or hanging requests are cancelled.

Build a hedged RPC dispatcher using `futures::future::select_all` combined with `tokio::select!`.

**Requirements**:
1. Write `async fn mock_rpc(node_id: u32, delay_ms: u64) -> String`.
2. Write `async fn execute_hedged_rpc(node_delays: Vec<(u32, u64)>, timeout_ms: u64) -> Result<String, &'static str>`.
3. Add unit tests asserting fastest node response win and timeout handling.

> [!check]- Answer
> ```rust
> use std::time::Duration;
> use futures::future::select_all;
> use tokio::time::sleep;
> 
> pub async fn mock_rpc(node_id: u32, delay_ms: u64) -> String {
>     sleep(Duration::from_millis(delay_ms)).await;
>     format!("NODE_{}_RESP", node_id)
> }
> 
> pub async fn execute_hedged_rpc(
>     node_delays: Vec<(u32, u64)>,
>     timeout_ms: u64,
> ) -> Result<String, &'static str> {
>     let futures: Vec<_> = node_delays
>         .into_iter()
>         .map(|(id, delay)| Box::pin(mock_rpc(id, delay)))
>         .collect();
> 
>     let race_fut = select_all(futures);
>     let timeout_fut = sleep(Duration::from_millis(timeout_ms));
> 
>     tokio::select! {
>         (win_val, _index, _remaining) = race_fut => Ok(win_val),
>         _ = timeout_fut => Err("ALL_NODES_TIMED_OUT"),
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[tokio::test]
>     async fn test_hedged_rpc_fastest_wins() {
>         let nodes = vec![(1, 100), (2, 10), (3, 50)];
>         let res = execute_hedged_rpc(nodes, 200).await;
>         assert_eq!(res, Ok("NODE_2_RESP".to_string()));
>     }
> 
>     #[tokio::test]
>     async fn test_hedged_rpc_timeout() {
>         let nodes = vec![(1, 100), (2, 150)];
>         let res = execute_hedged_rpc(nodes, 20).await;
>         assert_eq!(res, Err("ALL_NODES_TIMED_OUT"));
>     }
> }
> ```
> 
> #### Technical Explanation
>
> 1. **Dynamic Future Racing (`select_all`)**: `futures::future::select_all` races a `Vec` of pinned futures dynamically, returning the winner and remaining incomplete futures.
> 2. **Timeout Wrap**: Wrapping `select_all` inside `tokio::select!` against a `sleep` timer ensures the entire hedged race fails fast if all nodes exceed the deadline.
> 
> ---
> 
## 6. Related Terms

- [`join!` Macro](join_macro.md) — The opposite of `select!` (waits for *all* futures to finish).

---

## 7. Key Takeaways
> 
> - **`tokio::select!`** races multiple Futures and executes the branch for whichever one finishes **first**.
> - It **instantly cancels and drops** all the losing Futures.
> - Perfect for setting timeouts, handling emergency shutdown signals, or racing redundant network requests.
> - Futures passed into `select!` must be **cancellation-safe** so dropping them midway through work doesn't corrupt data or leak memory.
> - Use the **`biased;`** flag if you want branches evaluated in strict top-to-bottom priority order instead of randomly.
> 
