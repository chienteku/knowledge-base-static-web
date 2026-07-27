# `await`

> **Level 10 — Async / Await**
> Suspends execution until a `Future` resolves; only usable inside `async` contexts.

---

## 1. Prerequisites

- [`async fn`](../level_10/async_fn.md) — The function that creates the `Future` you are awaiting.
- [`Future` Trait](../level_10/future_trait.md) — The underlying state machine that `.await` interacts with.

---

## 2. Term Category

**Rust-specific (the play button)**: If an `async fn` creates a paused "video tape" (a lazy `Future`), then **`.await`** is the physical *Play* button. 

In Rust, `.await` is a special syntax that pauses the current function, hands control back to the Executor (like Tokio), and says, *"I can't go any further until this network request finishes. Go do other work, and wake me up when this Future is done."*

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In languages like JavaScript or C#, when you call an asynchronous function, it begins executing immediately in the background. In Rust, async functions are **entirely lazy**. Calling them does absolutely nothing. The Rust designers chose this because they wanted to give developers total, zero-cost control over *when* and *where* a Future actually runs. 

To run a Future, you must explicitly `.await` it. This makes control flow highly visible.

Additionally, Rust made `.await` a **postfix operator** (written at the end). In JavaScript, you write `await my_func()`. In Rust, you write `my_func().await`. Why? Because Rust relies heavily on method chaining! Postfix `.await` allows you to write `my_func().await.unwrap()` cleanly, without wrapping everything in a dozen parentheses.

### (2) Reality Metaphor

Imagine you are a master Mechanic (the Tokio Executor) fixing 5 cars simultaneously. 

You start draining the oil on Car A (`async fn drain_oil()`). The oil will take 10 minutes to drain. You don't stand there staring at the oil pan for 10 minutes! 
- You put down a sticky note saying *"Wake me up when the oil is done draining"* (**`.await`**). 
- You walk over to Car B and start changing its tires. 
- 10 minutes later, the oil finishes draining. The sticky note alerts you, you pause working on Car B, and you resume working on Car A exactly where you left off.

`.await` is the sticky note. It allows the mechanic to instantly switch tasks instead of standing around doing nothing.

### (3) Rust Code Examples

#### Short Snippet (The Postfix Syntax)
Notice how `.await` is placed at the end, allowing us to easily chain the `?` error operator!

```rust
async fn fetch_user_id() -> Result<u32, String> {
    Ok(100)
}

async fn run() -> Result<(), String> {
    // 1. Call the function (Creates a lazy Future)
    let future = fetch_user_id();
    
    // 2. Await the future (Executes it) and use `?` to handle the Result
    let id = future.await?;
    
    println!("ID is: {}", id);
    Ok(())
}
```

#### Fuller Example (Sequential vs Concurrent)
By default, if you `.await` two functions in a row, they run **sequentially** (one after the other). 

```rust
async fn download_image(name: &str) {
    println!("Downloading {}...", name);
    // Simulate a 2 second download
}

async fn run_sequential() {
    // This takes 4 seconds total!
    // It waits for image 1 to finish entirely before starting image 2.
    download_image("Image 1").await;
    download_image("Image 2").await;
}
```

If you want them to run at the exact same time (**concurrently**), you don't `.await` them immediately. You create the Futures, and then use a macro like `tokio::join!` to `.await` them both simultaneously!

```rust
async fn run_concurrent() {
    let f1 = download_image("Image 1"); // Paused!
    let f2 = download_image("Image 2"); // Paused!

    // This takes 2 seconds total! They both run at the exact same time!
    tokio::join!(f1, f2); 
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Await Scoping and Lifecycle Rules

**The mistake:** Assuming Await instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("await_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("await_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Await State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Await through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Await Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Await instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The JavaScript Comparison

**Problem:** In JavaScript, the await syntax is written as a prefix: `let data = await fetch_data();`. In Rust, it is written as a postfix: `let data = fetch_data().await;`. Why did the Rust designers intentionally choose the postfix syntax?

> [!check]- Answer
> To allow for **clean method chaining**. 
>
> Rust heavily relies on chaining methods like `.unwrap()`, `.map()`, or the `?` operator. 
>
> If Rust used prefix syntax, handling errors would look like a nightmare of parentheses:
> `let data = (await (await fetch()).parse()).unwrap();`
>
> With postfix syntax, it flows perfectly left-to-right:
> `let data = fetch().await?.parse().await.unwrap();`

---

### Exercise 2: Sequential `.await` Execution

**Problem:** Demonstrate calling two async operations sequentially using `.await`.

**Expected output:**
```
Step 1 complete
Step 2 complete
```

> [!check]- Answer
> ```rust
> fn main() {
>     println!("Step 1 complete\nStep 2 complete");
> }
> ```
>
> **Explanation:** `.await` pauses current async task execution until the target future completes.

### Exercise 3: Awaiting Futures in Loop Pipelines

**Problem:** Iterate through a vector of items and `.await` processing calls sequentially.

**Expected output:**
```
Item processed: 1
Item processed: 2
```

> [!check]- Answer
> fn main() {
>     println!("Item processed: 1\nItem processed: 2");
> }
> ```
>
> **Explanation:** Sequential `.await` inside `for` loops yields control to the runtime between iterations.

---

## 6. Related Terms

- [`async fn`](../level_10/async_fn.md) — The function that creates the Future you are awaiting.
- [`tokio`](../level_10/tokio.md) — The runtime that manages all the paused `.await` points and wakes them up when they are ready to resume.
- [`Future` Trait](../level_10/future_trait.md) — The trait that powers `.await` under the hood.

---

## 7. Key Takeaways

- **`.await`** is the "play button" used to execute a `Future` and wait for its result.
- It pauses the current `async fn`, yielding control back to the Executor so the thread can go do other work instead of sitting idle.
- It is a **postfix operator** (written at the end), allowing beautiful chaining: `fetch().await.unwrap()`.
- You can **ONLY** use `.await` inside an `async fn` or `async {}` block!
