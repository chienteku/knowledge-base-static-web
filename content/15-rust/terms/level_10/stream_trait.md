# `Stream` Trait

> **Level 10 — Async / Await**
> Async equivalent of `Iterator`; yields values asynchronously.

---

## 1. Prerequisites

- [`Future` Trait](../level_10/future_trait.md) — A state machine that yields exactly **one** value asynchronously.
- [`Iterator` Trait](../level_02/iterator.md) — A state machine that yields **multiple** values synchronously.
- [`async fn`](../level_10/async_fn.md) — The context required to use Streams.

---

## 2. Term Category

**Rust-specific (the async iterator)**: A `Future` is great, but it yields exactly one value and then permanently finishes. An `Iterator` yields multiple values, but it does so synchronously (calling `.next()` will block and freeze your thread if the data isn't ready). 

What if you need to yield multiple values over a long period of time (like a live Twitter feed), but you want to do it *asynchronously* so you don't freeze your web server? 

You use a **`Stream`**! It is quite literally an asynchronous Iterator.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Consider a live WebSocket connection (like a multiplayer video game or a live chat room). Data arrives in chunks over several hours. 

- If you use a standard **`Iterator`**, calling `.next()` will freeze your entire server until the user sends their next chat message 5 minutes later. This is unacceptable.
- If you use a **`Future`**, it only returns one single chat message and then the connection dies.

The Rust community created the `Stream` trait to solve this. When you call `.next()` on a Stream, it doesn't block the thread. Instead, it instantly returns a `Future`! You can `.await` that future, which puts your task to sleep until the next chat message arrives, allowing the Tokio Executor to handle other users in the meantime.

### (2) Reality Metaphor

Imagine you are at a restaurant waiting for food.

- **`Future` (One item):** You order a sandwich. The cashier hands you a buzzer and you sit down. The buzzer goes off, you get the sandwich, and the transaction is permanently over. 
- **`Iterator` (Multiple items, Synchronous):** You order a buffet. You stand at the buffet line and put potatoes on your plate, then chicken, then salad. You never sit down. You are blocking the line until you are completely finished.
- **`Stream` (Multiple items, Asynchronous):** You order a 3-course tasting menu. The chef hands you a buzzer. You sit down. The buzzer goes off, you get your appetizer, and you sit back down with the buzzer. 20 minutes later it goes off again, you get the entree, and sit back down. Finally, it goes off for dessert. You got multiple items over a long period of time, but you spent most of the time sitting comfortably (yielding to the Executor).

### (3) Rust Code Examples

#### Short Snippet (The Trait Definition)
If you look at the definition of `Stream`, it looks exactly like `Iterator`, except it returns `Poll<Option<T>>` instead of just `Option<T>`.

```rust
// Standard Iterator (Synchronous)
pub trait Iterator {
    type Item;
    fn next(&mut self) -> Option<Self::Item>; // Blocks until ready!
}

// Stream (Asynchronous Iterator)
pub trait Stream {
    type Item;
    // Returns Poll::Pending if the data isn't ready yet!
    fn poll_next(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Option<Self::Item>>;
}
```

#### Fuller Example (The `while let` Loop)
Because `for` loops do not currently support Streams (as of 2024, `async for` syntax is still being developed), we cannot use a normal `for` loop. We must use a `while let` loop and explicitly `.await` the `.next()` method!

*Note: You must bring the `StreamExt` trait into scope to unlock the `.next()` method!*

```rust
use tokio_stream::StreamExt; // <--- CRITICAL! Unlocks `.next()`
use tokio_stream::iter;

#[tokio::main]
async fn main() {
    // We convert a standard array into an asynchronous Stream
    let mut my_stream = iter(vec![1, 2, 3]);

    // We CANNOT use `for num in my_stream`!
    // We must manually ask for the next Future, and .await it!
    while let Some(num) = my_stream.next().await {
        println!("Received from stream: {}", num);
    }
    
    println!("Stream finished!");
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Stream Trait Scoping and Lifecycle Rules

**The mistake:** Assuming Stream Trait instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("stream_trait_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("stream_trait_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Stream Trait State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Stream Trait through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Stream Trait Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Stream Trait instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Fill in the Blanks

**Problem:** Fill in the blanks with "One" or "Multiple", and "Synchronously" or "Asynchronously".

1. A `Future` yields `___` value(s) `___`.
2. An `Iterator` yields `___` value(s) `___`.
3. A `Stream` yields `___` value(s) `___`.

> [!check]- Answer
> 1. A `Future` yields **One** value **Asynchronously**.
> 2. An `Iterator` yields **Multiple** values **Synchronously**.
> 3. A `Stream` yields **Multiple** values **Asynchronously**.

---

### Exercise 2: Consuming a Stream with `while let Some`

**Problem:**
You have a list of three event names: `["connected", "data_received", "disconnected"]`. Convert this `Vec` into an async stream using `tokio_stream::iter` and consume it with a `while let Some(...)` loop, printing each event as:

```
Event: connected
Event: data_received
Event: disconnected
Stream exhausted.
```

Then answer: **why can't you use a regular `for` loop on a `Stream`?**

**Expected output:**
> [!check]- Answer
> ```text
> Event: connected
> Event: data_received
> Event: disconnected
> Stream exhausted.
> ```
>
> - **Hint 1:** Add `tokio-stream = "0.1"` to your `Cargo.toml`. Then bring `StreamExt` into scope with `use tokio_stream::StreamExt;` — without this trait import, the `.next()` method doesn't exist on the stream type.
> - **Hint 2:** `tokio_stream::iter(vec![...])` wraps any `IntoIterator` into an async `Stream`. The stream must be declared `mut` because `.next()` takes `&mut self`.
> - **Hint 3:** The loop pattern is `while let Some(item) = stream.next().await { ... }`. The `.await` is mandatory — `.next()` returns a `Future<Output = Option<Item>>`, not the item directly.
> - **Answer to the `for` loop question:** A `for` loop desugars into calls to `Iterator::next()`, which returns `Option<T>` synchronously. A `Stream`'s `.next()` returns a `Future<Output = Option<T>>` that must be `.await`ed. The Rust `for` loop has no mechanism to insert an `.await` point, so streams require the manual `while let` pattern (until `async for` stabilises).
>
> ```rust
> use tokio_stream::StreamExt; // ← must import; unlocks .next(), .map(), .filter(), etc.
> use tokio_stream::iter;
>
> #[tokio::main]
> async fn main() {
>     // Convert a Vec into an async Stream. The stream is lazy — items are
>     // only yielded one at a time as we poll it, not all at once.
>     let mut event_stream = iter(vec!["connected", "data_received", "disconnected"]);
>
>     // `while let` + `.await` is the idiomatic Stream consumption loop.
>     // Each call to .next().await suspends this task until the next item
>     // is available, yielding control back to the executor in the meantime.
>     while let Some(event) = event_stream.next().await {
>         println!("Event: {}", event);
>     }
>
>     // None was returned — the stream is permanently exhausted.
>     println!("Stream exhausted.");
> }
> ```
>
> **Explanation:**
> `stream.next().await` is the fundamental building block of all stream consumption. Each call asks the stream for its next item: if one is ready, `Poll::Ready(Some(item))` resolves immediately; if not, `Poll::Pending` suspends the task until the reactor wakes it. When the stream has no more items, `Poll::Ready(None)` terminates the `while let`. The key insight is that the `.await` makes this pattern *non-blocking* — during the wait for the next item, the Tokio executor is free to run other tasks on the same thread.

---

### Exercise 3: Building an Async Stream Adapter Pipeline

**Problem:**
Given a stream of integers `[1, 2, 3, 4, 5, 6]`, build a pipeline using `StreamExt` adapters that:

1. **Filters** to keep only even numbers.
2. **Maps** each surviving number by multiplying it by 10.
3. Consumes the result with `while let Some(...)` and prints each value.

Note that `StreamExt::filter` has a subtly different signature from `Iterator::filter` — its predicate must return a `Future<Output = bool>`, not a plain `bool`. This is the key challenge.

**Expected output:**
> [!check]- Answer
> ```text
> Even×10: 20
> Even×10: 40
> Even×10: 60
> ```
>
> - **Hint 1:** `StreamExt::filter` requires an *async* predicate — a closure that returns a `Future<Output = bool>`. The easiest way to wrap a synchronous boolean into a future is `futures::future::ready(bool_expr)`. Add `futures = "0.3"` to `Cargo.toml` and `use futures::future;`.
> - **Hint 2:** The filter closure signature is `|x| future::ready(x % 2 == 0)`. Note it takes `&Item` not `Item` (mirroring `Iterator::filter`), so if your item type is `i32`, the closure receives `&i32`.
> - **Hint 3:** Chain adapters before the `while let` loop, just like with `Iterator`. The resulting stream type is complex, so use `let mut pipeline = stream.filter(...).map(...);` and let the compiler infer the type.
> - **Hint 4:** `StreamExt::map` (unlike filter) takes a *synchronous* closure returning the new value directly — no `future::ready` needed.
>
> ```rust
> use futures::future;          // for future::ready()
> use tokio_stream::StreamExt;  // for .filter(), .map(), .next()
> use tokio_stream::iter;
>
> #[tokio::main]
> async fn main() {
>     let numbers = iter(vec![1_i32, 2, 3, 4, 5, 6]);
>
>     // Chain adapters to build the pipeline.
>     // filter: async predicate — must wrap the bool in a ready Future.
>     // map:    synchronous transform — plain closure returning the new value.
>     let mut pipeline = numbers
>         .filter(|x| future::ready(x % 2 == 0)) // keeps 2, 4, 6
>         .map(|x| x * 10);                       // yields 20, 40, 60
>
>     while let Some(val) = pipeline.next().await {
>         println!("Even×10: {}", val);
>     }
> }
> ```
>
> **Explanation:**
> The async-predicate requirement of `StreamExt::filter` is the most common stumbling block when coming from `Iterator`. Because `poll_next` is the fundamental async primitive, every adapter in the stream pipeline must be composable with the executor's poll loop — and that means predicates that might themselves need to `.await` something (e.g. a database lookup) must return a `Future`. For a simple synchronous boolean, `future::ready(bool)` is the minimal wrapper: it creates a `Future` that immediately resolves to the given value without ever yielding.
>
> The `filter` → `map` order also matters: filtering first reduces the number of items that `map` has to process, which is the same performance principle as with synchronous iterators — always filter before transforming.

---

## 6. Related Terms

- [`Iterator` Trait](../level_02/iterator.md) — The synchronous version of a Stream.
- [`Future` Trait](../level_10/future_trait.md) — The trait that powers the Stream's `.next()` method (every time you call `.next()`, it returns a Future!).
- [`tokio`](../level_10/tokio.md) — The runtime you are usually running these Streams on.

---

## 7. Key Takeaways

- **`Stream`** is the exact asynchronous equivalent of an `Iterator`.
- It yields multiple values over time without blocking the OS thread.
- Calling **`.next()`** on a Stream returns a `Future` that resolves when the next item arrives.
- You **cannot** use a standard `for` loop on a Stream; you must use `while let Some(item) = stream.next().await`.
- You must always bring **`StreamExt`** into scope (from the `futures` or `tokio_stream` crates) to use methods like `.next()`, `.map()`, and `.filter()`.
