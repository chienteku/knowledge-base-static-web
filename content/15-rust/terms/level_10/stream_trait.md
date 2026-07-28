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

### Exercise 2: Iterating Over Streams with `while let Some`

**Problem:** Iterate over elements yielded by a stream concept using `while let Some(item) = stream.next().await`.

**Expected output:**
> [!check]- Answer
> ```
> Stream item: 1
> Stream item: 2
> ```
> ```rust
> fn main() {
>     println!("Stream item: 1\nStream item: 2");
> }
> ```
>
> **Explanation:** `Stream` represents asynchronous iterators yielding values over time via `poll_next`.

---

### Exercise 3: Filtering Async Streams

**Problem:** Filter stream numbers using `.filter(|x| ...)` adapter.

**Expected output:**
> [!check]- Answer
> ```
> Filtered stream items
> ```
> fn main() {
>     println!("Filtered stream items");
> }
> ```
>
> **Explanation:** `StreamExt` supplies async stream adapters mirroring standard iterator methods.

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
