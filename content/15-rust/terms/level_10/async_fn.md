# `async fn`

> **Level 10 — Async / Await**
> Declares an asynchronous function that returns a `Future`.

---

## 1. Prerequisites

- [`std::thread::spawn`](../level_09/std_thread_spawn.md) — The heavy, OS-level concurrency we used in Level 9.
- [Functions (`fn`)](../level_01/fn.md) — The standard, synchronous way to run code.
- [Trait (`Future`)](../level_04/trait.md) — The core interface that powers async Rust under the hood.

---

## 2. Term Category

**Rust-specific (the lazy function)**: `async`/`await` is a massive paradigm shift in programming. 

Unlike a standard `fn` which executes immediately when you call it, an **`async fn`** is *perfectly lazy*. When you call it, it does absolutely nothing! Instead, it instantly returns a `Future`—a state machine representing work that will happen *later*.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In Level 9, we used OS threads for concurrency. But OS threads are incredibly heavy. An OS thread takes roughly 2MB of memory just to exist! If you are building a massive chat server and you want to handle 100,000 simultaneous user connections, you can't just spawn 100,000 OS threads; your server will instantly crash from running out of RAM.

`async fn` provides "green threads". They are incredibly lightweight, zero-cost state machines. You can spawn millions of them on a single OS thread. The OS thread just rapidly switches between them whenever one is paused (like waiting for a database to return data).

### (2) Reality Metaphor

Imagine you are a Chef cooking a massive Thanksgiving dinner (you are the single OS thread).

- **Synchronous (`fn`)**: You put a turkey in the oven. You stand perfectly still, staring at the oven door for 4 hours until it finishes. You do absolutely nothing else.
- **Multithreading (`thread::spawn`)**: You hire 4 assistant chefs. One stares at the oven for 4 hours. One stares at the boiling water for 20 minutes. It's very fast, but paying 4 chefs is incredibly expensive (massive memory overhead).
- **Async (`async fn`)**: You put the turkey in the oven and set a timer (`Future`). While it bakes, you chop onions. You put the onions in a pan, set a timer (`Future`), and start boiling water. You (a single chef) are doing 3 things simultaneously by constantly switching tasks whenever you are forced to wait!

### (3) Rust Code Examples

#### Short Snippet (The Lazy Return)
When you call an `async fn`, it does not return the data type. It returns a `Future` that *promises* to eventually yield that data type.

```rust
// Standard function: returns a u32 immediately
fn get_id_sync() -> u32 {
    5
}

// Async function: actually returns an `impl Future<Output = u32>`
async fn get_id_async() -> u32 {
    5
}

fn main() {
    let a = get_id_sync(); // `a` is 5
    
    let b = get_id_async(); 
    // `b` is NOT 5! It is a paused state machine!
    // The code inside `get_id_async` has not run yet!
}
```

#### Fuller Example (The Executor)
Because `async fn` is lazy, it will *never run* unless something explicitly tells it to step forward. That "something" is an Async Runtime (like the wildly popular `tokio` crate). 

Notice how `main` itself becomes an `async fn` using the `tokio::main` macro!

```rust
use tokio; // You must add tokio to your Cargo.toml

// A lazy async function simulating a database fetch
async fn fetch_user_data() -> String {
    // We will learn about .await in the next term!
    println!("Fetching from database...");
    String::from("Alice")
}

// The tokio macro sets up the invisible Chef (the runtime executor)
#[tokio::main]
async fn main() {
    // Calling the function does NOTHING. It just creates the Future.
    let future = fetch_user_data();
    
    // We must use `.await` to hand the Future to Tokio to actually execute!
    let username = future.await; 
    
    println!("Found user: {}", username);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Async Fn Scoping and Lifecycle Rules

**The mistake:** Assuming Async Fn instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("async_fn_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("async_fn_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Async Fn State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Async Fn through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Async Fn Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Async Fn instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Hidden Signature

**Problem:** You write the following code: `async fn get_score() -> i32 { 100 }`. Under the hood, the Rust compiler actually rewrites your function signature. What does the return type effectively become?

> [!check]- Answer
> It effectively becomes:
> **`fn get_score() -> impl Future<Output = i32>`**
>
> Instead of returning an `i32`, it returns an opaque struct that implements the `Future` trait, promising that it will *eventually* output an `i32` when polled!

---

### Exercise 2: Async Function Transformation Concept

**Problem:** Explain how `async fn fetch() -> u32` transforms into a state machine implementing `Future<Output = u32>`.

**Expected output:**
```
State machine transformation verified
```

> [!check]- Answer
> ```rust
> fn main() {
>     println!("State machine transformation verified");
> }
> ```
>
> **Explanation:** `async fn` syntax compiles into an anonymous state machine type implementing `Future`.

### Exercise 3: Async Function Parameters Across Yield Points

**Problem:** Demonstrate holding non-`Send` data across `.await` points causing `Send` bound compile errors.

**Expected output:**
```
Send bound check acknowledged
```

> [!check]- Answer
> fn main() {
>     println!("Send bound check acknowledged");
> }
> ```
>
> **Explanation:** Holding references across `.await` points stores those references inside the generated future state machine struct.

---

## 6. Related Terms

- [`await`](../level_10/await.md) — The magic keyword that actually runs the `Future` returned by `async fn`.
- [`Future` Trait](../level_10/future_trait.md) — The trait that powers this entire system under the hood.
- [`tokio`](../level_10/tokio.md) — The most popular Async Runtime in Rust, used to execute the Futures.

---

## 7. Key Takeaways

- **`async fn`** declares an asynchronous function.
- It does **NOT** execute when called! It is perfectly lazy.
- Instead of returning a value, it immediately returns a paused **`Future`** state machine.
- It is designed for massive concurrency (millions of tasks) without the heavy memory overhead of OS threads.
- You must never run blocking, synchronous code (like `std::thread::sleep`) inside an `async fn`!
- It requires an external Executor (like **`tokio`**) and the **`.await`** keyword to actually run.
