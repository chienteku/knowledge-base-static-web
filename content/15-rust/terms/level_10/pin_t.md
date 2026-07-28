# `Pin<T>`

> **Level 10 — Async / Await**
> Prevents a value from being moved in memory; required for self-referential futures.

---

## 1. Prerequisites

- [`async fn`](../level_10/async_fn.md) — The magic syntax that creates the problem `Pin` solves.
- [`Future` Trait](../level_10/future_trait.md) — The trait whose `poll` method explicitly requires `Pin`.
- [Move Semantics](../level_03/move_semantics.md) — The default behavior of Rust that `Pin` explicitly disables.

---

## 2. Term Category

**Rust-specific (the memory glue)**: `Pin` is widely considered the most notoriously confusing, brain-melting concept in all of Rust. 

It exists almost entirely to solve a massive memory-safety problem introduced by `async fn`. It is a wrapper type (`Pin<Box<T>>`, `Pin<&mut T>`) that makes an ironclad promise to the compiler: *"I swear that the data inside this wrapper will NEVER be moved to a different memory address for as long as it exists."*

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

When you write an `async fn`, the compiler generates a hidden State Machine `enum`. 

Inside your `async fn`, you might declare an array: `let array = [1, 2];`, and then create a reference to it: `let ref_to_array = &array;`. Then, you call `.await`. 

Because you called `.await`, the function must pause! The State Machine must save all your local variables (`array` AND `ref_to_array`) inside its hidden `enum` so they survive while the thread sleeps. 

This means the `enum` now contains a reference pointing *to itself*! This is called a **Self-Referential Struct**. 

In standard Rust, you move variables constantly (e.g., returning them from functions, pushing them into a `Vec`). If you moved this `enum` to a new memory address, the internal reference (`ref_to_array`) would still point to the *old, deleted memory address*! If you tried to use it, your program would suffer a catastrophic memory violation (Use-After-Free). 

**`Pin`** was invented to guarantee that these State Machines are "pinned" to their memory address and can physically never be moved.

### (2) Reality Metaphor

Imagine you have a whiteboard. You write the word "Data" on the left side, and draw an arrow pointing from the right side to the word "Data" (a self-reference).

- **Unpinned (Standard Rust)**: Someone picks up the word "Data" and moves it to a completely different whiteboard in another room. The arrow is still pointing to the left side of the first whiteboard, which is now empty. The arrow points to garbage.
- **Pinned (`Pin<T>`)**: You take a literal metal thumbtack and pin the word "Data" to the whiteboard. It is physically impossible to move it. The arrow will always point to the correct data!

### (3) Rust Code Examples

#### Short Snippet (The Future Signature)
In Term #126, we saw the signature for `Future::poll`. Now you finally understand *why* it looks so scary.

```rust
pub trait Future {
    type Output;

    // The state machine `Self` must be PINNED in memory before 
    // the Executor is allowed to poll it!
    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output>;
}
```

#### Fuller Example (Using `tokio::pin!`)
99% of the time, the `async/await` syntax handles all the pinning for you invisibly. You never think about it. But occasionally, if you want to use advanced Tokio macros like `tokio::select!` or manually poll a Future, you must pin it yourself using a macro.

```rust
use tokio::time::{sleep, Duration};

#[tokio::main]
async fn main() {
    let my_future = sleep(Duration::from_secs(1));
    
    // my_future is currently UNPINNED. We can move it around freely!
    // But we cannot poll it yet.
    
    // We use the macro to permanently pin it to the Stack memory right here!
    tokio::pin!(my_future);
    
    // Now it is a `Pin<&mut Sleep>`. We can pass it into advanced functions!
    // Note: If we tried to `move` my_future after this line, the compiler would crash!
    tokio::select! {
        _ = &mut my_future => {
            println!("Timer finished first!");
        }
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Pin T Scoping and Lifecycle Rules

**The mistake:** Assuming Pin T instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("pin_t_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("pin_t_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Pin T State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Pin T through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Pin T Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Pin T instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Core Problem

**Problem:** Why exactly does `async fn` generate self-referential structs in the first place?

> [!check]- Answer
> Because an `async fn` is a state machine that must pause its execution across `.await` points!
>
> If you declare a local variable, and then declare a reference pointing to that local variable, and *then* you `.await`... the state machine must save both variables so they survive while the thread sleeps. The state machine is now saving a reference that points to data *inside the exact same state machine*. It is self-referential!

---

### Exercise 2: Stack Pinning with `tokio::pin!` — Reusing a Future Across `select!`

**Problem:**
Each iteration of a `select!` loop needs to poll the *same* future — not create a new one. But calling an `async fn` inside `select!` each time creates a fresh future that loses all progress. The solution is to pin the future to the stack with `tokio::pin!` and reuse it.

Write a `#[tokio::main]` program that:
1. Creates a single `tokio::time::sleep(Duration::from_millis(200))` future and pins it to the stack with `tokio::pin!`.
2. Runs a loop with a `tokio::select!` that races:
   - The pinned sleep future against
   - A `tokio::time::sleep(Duration::from_millis(50))` tick timer.
3. On each tick, prints `"Tick: {n}"`. When the pinned sleep resolves, prints `"Long sleep done!"` and breaks.

**Expected output:**
> [!check]- Answer
> ```text
> Tick: 1
> Tick: 2
> Tick: 3
> Tick: 4
> Long sleep done!
> ```
> *(4 ticks because 200ms / 50ms = 4)*
>
> - **Hint 1:** `tokio::pin!(fut)` is a macro that shadows the variable with a `Pin<&mut impl Future>` pointing to the same stack location. You can then pass `&mut fut` into `select!` across multiple iterations without recreating the future.
> - **Hint 2:** Once a future is pinned, you cannot move it. `select!` borrows `fut` mutably each iteration — it polls it, potentially advances its state, then releases the borrow. This is why pinning is necessary: the future's internal self-references must remain valid between polls.
> - **Hint 3:** In `select!`, reference pinned futures by name directly (they are already `Pin<&mut F>`). The timer branch needs a fresh `sleep(...)` each iteration (create it inside the `select!` arm expression).
>
> ```rust
> use tokio::time::{sleep, Duration};
>
> #[tokio::main]
> async fn main() {
>     // Create the long-running future ONCE and pin it to the stack.
>     // tokio::pin! shadows `long_sleep` with Pin<&mut impl Future>.
>     let long_sleep = sleep(Duration::from_millis(200));
>     tokio::pin!(long_sleep);
>
>     let mut tick = 0u32;
>     loop {
>         tokio::select! {
>             // Branch A: the pinned future — reused across iterations.
>             _ = &mut long_sleep => {
>                 println!("Long sleep done!");
>                 break;
>             }
>             // Branch B: a fresh 50ms tick created each iteration.
>             _ = sleep(Duration::from_millis(50)) => {
>                 tick += 1;
>                 println!("Tick: {}", tick);
>             }
>         }
>     }
> }
> ```
>
> **Explanation:**
> Without `tokio::pin!`, writing `long_sleep` inside `select!` directly would move the future into the macro on the first iteration, making it unavailable for subsequent iterations. `pin!` creates an `in-place` pin: the future stays at its stack address, and `&mut long_sleep` gives a mutable reference to its pinned location that `select!` can borrow repeatedly. This is the canonical pattern for "race a long-running future against a ticker" in Tokio.

---

### Exercise 3: Heap Pinning with `Box::pin` — Type-Erased Future Collections

**Problem:**
Heap-pinning with `Box::pin` serves two purposes: (1) it moves the future to the heap where it has a stable address for its entire lifetime, and (2) combined with `dyn Future`, it erases the concrete type so heterogeneous futures can be stored together.

Write a `#[tokio::main]` program that:
1. Defines three different async fns: `async fn greet() -> String`, `async fn count() -> String`, `async fn timestamp() -> String` — each returns a different formatted string.
2. Stores all three in a `Vec<Pin<Box<dyn Future<Output = String>>>>` using `Box::pin(greet())` etc.
3. Iterates the Vec, `.await`s each future, and prints its result.

**Expected output:**
> [!check]- Answer
> ```text
> Hello, world!
> Count: 42
> Timestamp: T+0
> ```
>
> - **Hint 1:** `Box::pin(some_future)` moves `some_future` to the heap and returns `Pin<Box<impl Future<Output = T>>>`. The future's address is now stable — it will never move even if the `Box` itself is moved.
> - **Hint 2:** To store futures of *different concrete types* in the same `Vec`, you need trait objects: `Pin<Box<dyn Future<Output = String>>>`. Each `Box::pin(f)` coerces to this type automatically because `impl Future` implements `Future`.
> - **Hint 3:** To `.await` a `Pin<Box<dyn Future<Output = String>>>` from a `Vec`, iterate and await each: `for fut in futures { let result = fut.await; }`. This works because `Pin<Box<dyn Future>>` itself implements `Future`.
>
> ```rust
> use std::pin::Pin;
> use std::future::Future;
>
> async fn greet() -> String {
>     String::from("Hello, world!")
> }
>
> async fn count() -> String {
>     String::from("Count: 42")
> }
>
> async fn timestamp() -> String {
>     String::from("Timestamp: T+0")
> }
>
> #[tokio::main]
> async fn main() {
>     // Box::pin erases the concrete type: all three fns have different
>     // anonymous Future types, but all coerce to dyn Future<Output = String>.
>     let futures: Vec<Pin<Box<dyn Future<Output = String>>>> = vec![
>         Box::pin(greet()),
>         Box::pin(count()),
>         Box::pin(timestamp()),
>     ];
>
>     for fut in futures {
>         let result = fut.await;
>         println!("{}", result);
>     }
> }
> ```
>
> **Explanation:**
> `Box::pin` is the primary way to heap-allocate a future when you need to: (a) store it as a field in a struct without knowing its size at compile time, (b) mix futures of different types in a collection, or (c) return a future from a function whose concrete type you want to hide (e.g. `-> Pin<Box<dyn Future<Output = T>>>`). The `Pin` wrapper ensures the heap allocation is never moved, which is necessary because `async fn` generates self-referential state machines that would be corrupted if their memory address changed mid-execution.

---

## 6. Related Terms

- [`Future` Trait](../level_10/future_trait.md) — The entire reason `Pin` exists.
- [Move Semantics](../level_03/move_semantics.md) — The default behavior of Rust that `Pin` explicitly disables to prevent memory corruption.

---

## 7. Key Takeaways

- **`Pin<T>`** is a wrapper type that prevents a value from ever being moved in memory.
- It was created specifically to make `async/await` work safely, because `async fn` generates **self-referential state machines**.
- If a self-referential struct was moved, its internal pointers would point to deleted garbage memory (Use-After-Free). `Pin` mathematically prevents this.
- The **`Unpin`** trait simply means *"This type has no self-references, so it is perfectly safe to move."* 99% of standard Rust types implement `Unpin`.
- You rarely have to use `Pin` directly; the `async/await` syntax hides this nightmare from you!
