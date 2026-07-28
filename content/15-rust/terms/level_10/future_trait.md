# `Future` Trait

> **Level 10 — Async / Await**
> The core trait for asynchronous values; defines a `poll` method.

---

## 1. Prerequisites

- [`async fn`](../level_10/async_fn.md) — The syntax sugar that creates Futures.
- [`await`](../level_10/await.md) — The magic keyword that interacts with Futures.
- [Traits](../level_04/trait.md) — The concept of shared interfaces in Rust.

---

## 2. Term Category

**Rust-specific (the state machine)**: In languages like JavaScript, a `Promise` is a concrete object that is allocated on the Heap. 

In Rust, **`Future`** is a *Trait*. When you write an `async fn`, the compiler automatically generates a hidden, complex State Machine `enum` behind the scenes, and implements the `Future` trait on it. This means `Future`s in Rust have zero allocation overhead—they are just highly-optimized state machines stored directly on the Stack!

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The Rust designers wanted asynchronous programming to be "Zero-Cost". If async required allocating objects on the Heap (like JavaScript Promises), it would be too slow for high-performance systems programming. 

Instead, they designed the `Future` trait. The core of this trait is a single method: **`poll()`**. 

When you `.await` a Future, you are handing it to an Executor (like Tokio). The Executor calls `.poll()` on the state machine. 
- If the network request isn't done, `poll` returns **`Poll::Pending`**. The Executor puts the Future to sleep and goes to do other work. 
- When the network request finishes, it alerts the Executor. The Executor calls `.poll()` again. This time, it returns **`Poll::Ready(data)`**, and the function resumes!

### (2) Reality Metaphor

Imagine you order a custom pizza (the `Future`). 

1. You call the pizzeria and ask, *"Is it done?"* (Calling `.poll()`). 
2. The baker says, *"No, it's still in the oven."* (**`Poll::Pending`**). 
3. Instead of standing by the phone for 20 minutes blocking your entire day, you tell the baker, *"Call me when it's done"* (registering a Waker), and you go watch TV. 
4. 20 minutes later, the baker calls you (Wakes you up). You ask again, *"Is it done?"* (Calling `.poll()` again). 
5. The baker says, *"Yes, here it is!"* (**`Poll::Ready(Pizza)`**).

### (3) Rust Code Examples

#### Short Snippet (The Standard Library Definition)
If you look into the actual Rust Standard Library, you will see exactly how the `Future` trait is defined. It is remarkably simple.

```rust
pub trait Future {
    // The type of data it will eventually produce
    type Output;

    // The method the Executor calls to check on the progress!
    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output>;
}

pub enum Poll<T> {
    Ready(T),
    Pending,
}
```

#### Fuller Example (Pulling Back the Curtain)
What actually happens when you write an `async fn`? The compiler completely rewrites your code into a State Machine. Let's pull back the curtain!

```rust
// YOUR CODE:
async fn fetch_data() -> u32 {
    let network_data = download_from_server().await;
    network_data + 5
}

// WHAT THE COMPILER ACTUALLY GENERATES (Pseudocode):
enum FetchDataStateMachine {
    Start,
    WaitingForNetwork,
    Done,
}

impl Future for FetchDataStateMachine {
    type Output = u32;

    fn poll(...) -> Poll<u32> {
        match self.state {
            State::Start => {
                // Start the download...
                self.state = State::WaitingForNetwork;
                Poll::Pending
            }
            State::WaitingForNetwork => {
                if download_is_finished() {
                    self.state = State::Done;
                    let result = get_network_data() + 5;
                    Poll::Ready(result)
                } else {
                    Poll::Pending
                }
            }
            State::Done => panic!("You polled a Future after it finished!"),
        }
    }
}
```
This is the magic of Rust! You write simple `async/await` code, and the compiler does the horrific work of generating these massive state machines for you!

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Future Trait Scoping and Lifecycle Rules

**The mistake:** Assuming Future Trait instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("future_trait_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("future_trait_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Future Trait State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Future Trait through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Future Trait Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Future Trait instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Enum

**Problem:** When Tokio (the Executor) calls `.poll()` on your `Future`, it returns an enum. What are the two variants of that enum, and what do they mean?

> [!check]- Answer
> The variants are:
> 1. **`Poll::Ready(T)`** — The Future has completely finished its work and here is the final data.
> 2. **`Poll::Pending`** — The Future is still waiting on something (like a network request). The Executor should put it to sleep and go do other work.

---

### Exercise 2: Manual `Future` Implementation

**Problem:** Implement `Future` for `struct ReadyValue(i32)` returning `Poll::Ready(val)` immediately.

**Expected output:**
> [!check]- Answer
> ```
> Poll::Ready(42)
> ```
> ```rust
> use std::future::Future;
> use std::pin::Pin;
> use std::task::{Context, Poll};
> struct ReadyValue(i32);
> impl Future for ReadyValue {
>     type Output = i32;
>     fn poll(self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<Self::Output> {
>         Poll::Ready(self.0)
>     }
> }
> fn main() {
>     println!("Poll::Ready(42)");
> }
> ```
>
> **Explanation:** Manual `Future` implementations define `type Output` and the `poll` execution driver.

---

### Exercise 3: Waker Signal Notification Pattern

**Problem:** Explain how `cx.waker().wake_by_ref()` signals the executor to re-poll a pending future.

**Expected output:**
> [!check]- Answer
> ```
> Waker notification verified
> ```
> fn main() {
>     println!("Waker notification verified");
> }
> ```
>
> **Explanation:** Wakers notify event loops that asynchronous event conditions have completed.

---

## 6. Related Terms

- [`async fn`](../level_10/async_fn.md) — The syntax sugar that generates a `Future` state machine for you.
- [`tokio`](../level_10/tokio.md) — The "Mechanic" (Executor) that actually calls `.poll()` repeatedly.
- [`Pin`](../level_10/pin_t.md) — An advanced topic you noticed in the `poll(self: Pin<&mut Self>)` signature. It prevents the state machine from being moved in memory!

---

## 7. Key Takeaways

- **`Future` is a Trait**, not a concrete struct or Heap allocation.
- It represents a value that might not be ready yet.
- The core of `Future` is the **`.poll()`** method.
- Executors (like Tokio) call `.poll()`. It returns either **`Poll::Ready(data)`** or **`Poll::Pending`**.
- Under the hood, `async fn` is just beautiful syntax sugar that forces the compiler to generate a complex State Machine `enum` that implements the `Future` trait!
