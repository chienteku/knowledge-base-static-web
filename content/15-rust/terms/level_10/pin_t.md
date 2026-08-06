# `pin!`, `Pin<T>`, and `Unpin`

> **Level 10 — Async / Await**
> Guarantees that an object will never move in memory again, essential for self-referential futures.

---

## 1. Prerequisites


- [`async fn`](async_fn.md) — How we create self-referential futures.
- [`Box<T>`](../level_03/box_t.md) — A common container for pinning (`Pin<Box<T>>`).

---

## 2. Term Category

**Rust Memory Model (the anchor)**: `Pin` is one of the most conceptually challenging parts of Rust, but its job is very simple: **It pins an object to a specific memory address so it can never be moved.**

By default, Rust loves to move things around in memory when you assign them to new variables or pass them into functions (Move semantics). However, Async Futures contain self-referential pointers (pointers that point to other fields *inside the exact same struct*). 

If you move a self-referential struct in memory, its pointers will still point to the *old* memory address, causing horrific memory corruption! `Pin` is the anchor that prevents this.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

When you write an `async fn`, the Rust compiler compiles your function into a giant `enum`/`struct` state machine. 

If your async function creates a variable on the stack, and then creates a reference to that variable across an `.await` point, the generated struct will contain a pointer *pointing directly to another field inside itself*!

If a caller moves this `Future` struct to a different location on the Heap or Stack, the pointer inside the struct will now point to a dead, invalid memory address! 

To make `async`/`await` safe, Rust needed a way to mathematically guarantee: *"Once this Future starts running, it will NEVER move to a new memory address again."* That guarantee is `Pin`.

### (2) Reality Metaphor

Imagine a snail carrying its house on its back.

- **Unpinned Data (`Unpin`)**: A standard plastic toy. You can pick it up from the table, put it in your pocket, or ship it to Japan. It doesn't care where it lives (Move semantics).
- **Self-Referential Data**: Imagine a tree house where the ladder is bolted to a specific root on the ground.
- **`Pin`**: You drive a massive steel stake through the tree house into the bedrock of the earth (`Pin`). Now, nobody can pick up the tree house and move it to a different location, because doing so would rip the ladder off the root! It is anchored in place forever.

### (3) Rust Code Examples

#### Short Snippet (What `Unpin` Means)
Almost every single standard type in Rust (`i32`, `String`, `Vec`) implements the `Unpin` marker trait automatically. It means: *"I don't care about being pinned! Feel free to move me!"*

Only compiler-generated `Future` structs are `!Unpin` (not Unpin).

```rust
use std::marker::PhantomPinned;
use std::pin::Pin;

// Normal types are Unpin. Pinning them does nothing!
let mut number: i32 = 5;
let pinned_number: Pin<&mut i32> = Pin::new(&mut number); // Perfectly legal!

// Structs with PhantomPinned are !Unpin (cannot be moved once pinned)
struct SelfReferential {
    data: String,
    _marker: PhantomPinned, // Opt-out of Unpin!
}
```

#### Fuller Example (Stack Pinning with `tokio::pin!`)
If you want to poll a `Future` manually inside a loop (like using `select!`), you must pin it first! You can pin it to the Heap using `Box::pin()`, or pin it to the Stack using `tokio::pin!`.

```rust
use tokio::time::{sleep, Duration};

async fn my_async_task() {
    sleep(Duration::from_millis(100)).await;
    println!("Task finished!");
}

#[tokio::main]
async fn main() {
    let fut = my_async_task();

    // tokio::pin! anchors the future to the current stack frame!
    // It converts `fut` into a `Pin<&mut Future>`
    tokio::pin!(fut);

    // Now we can pass `fut` safely to methods that require a Pinned Future!
    (&mut fut).await;
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

---

## 5. Practice Exercises

### Exercise 1: Self-Referential Pinned Buffer with Heap Pinning (`Pin<Box<T>>`)

**Scenario:** Low-level networking and graphics engines often require self-referential buffers where a slice reference `&[u8]` inside a struct points directly to another heap-allocated buffer stored within the same struct instance. If this struct moves in memory, the raw pointer/slice becomes invalid.

**Requirements:**
Build a self-referential struct `SelfReferentialBuffer` using `PhantomPinned` and heap-pinning via `Box::pin`.

**Requirements**:
1. Struct `SelfReferentialBuffer` must contain `data: Vec<u8>`, `slice_ptr: *const u8`, `slice_len: usize`, and `_pin: PhantomPinned`.
2. Implement `SelfReferentialBuffer::new(data: Vec<u8>) -> Pin<Box<Self>>` which allocates the struct on the heap, initializes `slice_ptr` to point to `data.as_ptr()`, and pins the `Box`.
3. Implement `fn get_slice(self: Pin<&Self>) -> &[u8]` safely using `unsafe` pointer dereferencing verified by pinning bounds.
4. Add unit tests asserting pointer stability, slice content validity, and testing memory assertions.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::marker::PhantomPinned;
> use std::pin::Pin;
> use std::ptr;
> 
> pub struct SelfReferentialBuffer {
>     data: Vec<u8>,
>     slice_ptr: *const u8,
>     slice_len: usize,
>     _pin: PhantomPinned,
> }
> 
> impl SelfReferentialBuffer {
>     /// Constructs a heap-pinned self-referential buffer.
>     pub fn new(data: Vec<u8>) -> Pin<Box<Self>> {
>         let len = data.len();
>         let mut unpinned = Box::new(SelfReferentialBuffer {
>             data,
>             slice_ptr: ptr::null(),
>             slice_len: len,
>             _pin: PhantomPinned,
>         });
> 
>         // Self-reference pointing to data vector inside heap allocation
>         let ptr = unpinned.data.as_ptr();
>         unpinned.slice_ptr = ptr;
> 
>         // Anchor the allocation on the heap permanently
>         Box::into_pin(unpinned)
>     }
> 
>     /// Safely accesses the self-referential slice guaranteed by Pinned pointer immutability.
>     pub fn get_slice(self: Pin<&Self>) -> &[u8] {
>         // SAFETY: `self` is pinned in heap memory, so `data` will never move or relocate.
>         unsafe { std::slice::from_raw_parts(self.slice_ptr, self.slice_len) }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
> 
>     #[test]
>     fn test_self_referential_buffer() {
>         let raw_bytes = vec![0xDE, 0xAD, 0xBE, 0xEF];
>         let pinned_buf = SelfReferentialBuffer::new(raw_bytes);
> 
>         // Access pinned reference safely
>         let slice = pinned_buf.as_ref().get_slice();
>         assert_eq!(slice, &[0xDE, 0xAD, 0xBE, 0xEF]);
>         assert_eq!(slice.len(), 4);
>     }
> 
>     #[test]
>     fn test_pointer_stability_after_pinning() {
>         let data = vec![1, 2, 3, 4, 5];
>         let pinned = SelfReferentialBuffer::new(data);
> 
>         let ptr1 = pinned.as_ref().get_slice().as_ptr();
> 
>         // Moving the Pin<Box<T>> wrapper moves the pointer on stack, NOT the heap data
>         let moved_pin = pinned;
>         let ptr2 = moved_pin.as_ref().get_slice().as_ptr();
> 
>         assert_eq!(ptr1, ptr2);
>     }
> }
> ```
> 
> #### Technical Explanation
>
> 1. **PhantomPinned Marker**: Including `_pin: PhantomPinned` opts out of the default `Unpin` auto-trait implementation for `SelfReferentialBuffer`.
> 2. **Heap Pinning via `Box::pin` / `Box::into_pin`**: Placing the struct inside a `Box` ensures memory lives on the heap. Converting `Box<T>` into `Pin<Box<T>>` disables APIs that move `T` out of the heap box.
> 3. **Self-Pointer Safety**: Because `Pin<Box<T>>` guarantees that `T`'s heap address will never change, the internal `slice_ptr` pointer remains permanently valid for the entire lifetime of the pinned box.
> 
> ---
> 
> ### Exercise 2: Custom Async Timeout Future with Manual Pin Projection
> 
> **Scenario**: When implementing custom low-level `Future` primitives (such as combining an inner future with a timer delay), you must manually poll inner futures. If the inner future is `!Unpin`, you must perform **Pin Projection**—safely projecting `Pin<&mut CustomFuture>` into `Pin<&mut InnerFuture>`.
> 
> Implement a custom `TimeoutFuture<F>` that wraps an inner generic future `F` and a sleep future.
> 
> **Requirements**:
> 1. Define `TimeoutFuture<F>` holding `future: F` and `delay: tokio::time::Sleep`.
> 2. Implement `TimeoutFuture<F>::new(future: F, duration: Duration) -> Self`.
> 3. Manually implement `Future for TimeoutFuture<F>` returning `Poll<Result<F::Output, &'static str>>`.
> 4. Implement structural pin projection inside `poll` using `unsafe { self.as_mut().map_unchecked_mut(...) }` or `get_unchecked_mut`.
> 5. Add unit tests verifying completed future execution and timeout triggers.
> 
> > [!check]- Answer
> > ```rust
> > use std::future::Future;
> > use std::pin::Pin;
> > use std::task::{Context, Poll};
> > use std::time::Duration;
> > use tokio::time::Sleep;
> > 
> > pub struct TimeoutFuture<F> {
> >     future: F,
> >     delay: Sleep,
> > }
> > 
> > impl<F> TimeoutFuture<F> {
> >     pub fn new(future: F, duration: Duration) -> Self {
> >         Self {
> >             future,
> >             delay: tokio::time::sleep(duration),
> >         }
> >     }
> > }
> > 
> > impl<F: Future> Future for TimeoutFuture<F> {
> >     type Output = Result<F::Output, &'static str>;
> > 
> >     fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
> >         // SAFETY: Structural pin projection for fields `future` and `delay`.
> >         // Neither field is moved out of memory; we obtain Pinned references to both.
> >         let (fut_pin, delay_pin) = unsafe {
> >             let this = self.get_unchecked_mut();
> >             (
> >                 Pin::new_unchecked(&mut this.future),
> >                 Pin::new_unchecked(&mut this.delay),
> >             )
> >         };
> > 
> >         // 1. Poll the primary inner future
> >         if let Poll::Ready(out) = fut_pin.poll(cx) {
> >             return Poll::Ready(Ok(out));
> >         }
> > 
> >         // 2. Poll the delay timer future
> >         if let Poll::Ready(_) = delay_pin.poll(cx) {
> >             return Poll::Ready(Err("TIMED_OUT"));
> >         }
> > 
> >         Poll::Pending
> >     }
> > }
> > 
> > #[cfg(test)]
> > mod tests {
> >     use super::*;
> > 
> >     #[tokio::test]
> >     async fn test_timeout_future_success() {
> >         let fast_task = async {
> >             tokio::time::sleep(Duration::from_millis(5)).await;
> >             42
> >         };
> 
> 
>         let timeout_fut = TimeoutFuture::new(fast_task, Duration::from_millis(100));
>         let res = timeout_fut.await;
>         assert_eq!(res, Ok(42));
>     }
> 
>     #[tokio::test]
>     async fn test_timeout_future_expired() {
>         let slow_task = async {
>             tokio::time::sleep(Duration::from_millis(100)).await;
>             99
>         };
> 
>         let timeout_fut = TimeoutFuture::new(slow_task, Duration::from_millis(5));
>         let res = timeout_fut.await;
>         assert_eq!(res, Err("TIMED_OUT"));
>     }
> }
> ```
> 
> #### Technical Explanation
>
> 1. **Pin Projection Requirements**: When polling a struct field `self.future` inside `poll(self: Pin<&mut Self>, ...)`, you cannot move fields out of `self`. You must project `Pin<&mut TimeoutFuture<F>>` into `Pin<&mut F>`.
> 2. **`get_unchecked_mut` & `Pin::new_unchecked`**: `this = self.get_unchecked_mut()` obtains mutable access to struct fields. `Pin::new_unchecked(&mut this.future)` re-pins the field reference, guaranteeing structural pinning.
> 3. **Future Composition**: Polling both projected futures sequentially inside `poll` enables custom async combinators without dynamic heap allocation (`Box::pin`).
> 
> ---
> 
> ### Exercise 3: Stack Pinning with `tokio::pin!` & Reusable Futures in Multiplexed Event Loops
> 
> **Scenario**: When polling an `async fn` or `Future` repeatedly inside an asynchronous event loop (e.g. `tokio::select!`), passing an unpinned future directly into `select!` consumes ownership. To reuse or borrow a `Future` across loop iterations, the future must be pinned on the stack using `tokio::pin!`.
> 
> Build a telemetry event processing loop that stack-pins a long-running ticker stream and processes messages cancellation-safely.
> 
> **Requirements**:
> 1. Write an `async fn fetch_sensor_data(id: u32) -> String` simulating sensor I/O.
> 2. Implement `async fn process_event_stream(sensor_id: u32, iterations: usize) -> Vec<String>`.
> 3. Use `tokio::pin!` on the sensor future inside the event loop.
> 4. Add unit tests asserting output vector collection.
> 
> > [!check]- Answer
> > ```rust
> > use std::time::Duration;
> > 
> > pub async fn fetch_sensor_data(id: u32) -> String {
> >     tokio::time::sleep(Duration::from_millis(5)).await;
> >     format!("SENSOR_{}_DATA", id)
> > }
> > 
> > pub async fn process_event_stream(sensor_id: u32, iterations: usize) -> Vec<String> {
> >     let mut results = Vec::new();
> > 
> >     for _ in 0..iterations {
> >         let fut = fetch_sensor_data(sensor_id);
> >         // Pin the future to the local stack frame
> >         tokio::pin!(fut);
> > 
> >         tokio::select! {
> >             data = &mut fut => {
> >                 results.push(data);
> >             }
> >             _ = tokio::time::sleep(Duration::from_millis(100)) => {
> >                 break;
> >             }
> >         }
> >     }
> > 
> >     results
> > }
> > 
> > #[cfg(test)]
> > mod tests {
> >     use super::*;
> > 
> >     #[tokio::test]
> >     async fn test_stack_pinning_event_stream() {
> >         let logs = process_event_stream(7, 3).await;
> >         assert_eq!(logs.len(), 3);
> >         assert_eq!(logs[0], "SENSOR_7_DATA");
> >         assert_eq!(logs[1], "SENSOR_7_DATA");
> >         assert_eq!(logs[2], "SENSOR_7_DATA");
> >     }
> > }
> > ```
> > 
> > **Step-by-Step Explanation**:
> > 1. **Stack Pinning**: `tokio::pin!(fut)` shadows variable `fut` with `Pin<&mut Future>`, anchoring the future frame to the current function stack.
> > 2. **Borrowing in `tokio::select!`**: Passing `&mut fut` into `tokio::select!` allows `select!` to poll the future by reference rather than taking ownership, permitting reuse or inspection across branches.
> 
> ---
> 
## 6. Related Terms

- [`Future` Trait](future_trait.md) — The state machines that rely on `Pin`.

---

## 7. Key Takeaways
> 
> - **`Pin`** anchors an object to a specific memory address so it can **never move again**.
> - It exists specifically to make **self-referential futures** (created by `async`/`await`) safe.
> - Most normal Rust types implement **`Unpin`** automatically, meaning they ignore pinning and can move freely.
> - Only compiler-generated `Future`s are **`!Unpin`**.
> - You can pin a Future to the Heap using `Box::pin()`, or to the Stack using `tokio::pin!`.
> 
