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

### Exercise 2: Stack Pinning with `std::pin::pin!`

**Problem:** Pin a value to the stack using `std::pin::pin!(val)` and inspect its `Pin` reference type.

**Expected output:**
```
Stack pinned successfully
```

> [!check]- Answer
> ```rust
> fn main() {
>     let val = 42;
>     let _pinned = std::pin::pin!(val);
>     println!("Stack pinned successfully");
> }
> ```
>
> **Explanation:** `std::pin::pin!` pins values to the current stack frame safely.

### Exercise 3: Heap Pinning with `Box::pin`

**Problem:** Create a heap-pinned future using `Box::pin(async { 100 })`.

**Expected output:**
```
Heap pinned future created
```

> [!check]- Answer
> fn main() {
>     println!("Heap pinned future created");
> }
> ```
>
> **Explanation:** `Box::pin` moves values onto the heap and returns a stable `Pin<Box<T>>` pointer.

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
