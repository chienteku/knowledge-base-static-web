# `unpin_trait.md` (Unpin Trait)

> **Level 10 — Async / Await**
> Marker trait for types that can be safely moved in memory even after being pinned.

---

## 1. Prerequisites


- [`Pin<T>`](pin_t.md) — The primary concept of memory pinning in Rust.
- [`Future` Trait](future_trait.md) — The state machines that rely on pinning.
- [Trait](../level_04/trait.md) — Traits with no methods used to mark compiler capabilities.

---

## 2. Term Category

**Rust Memory Model (the auto-opt-out)**: `Unpin` is a **Marker Trait** in Rust's standard library (`std::marker::Unpin`). 

While `Pin` is designed to anchor self-referential futures so they never move in memory, **`Unpin`** is the marker that says: *"I don't have any self-references! Moving me in memory is 100% safe!"*

Almost **every single primitive type in Rust** (`i32`, `String`, `Vec`, `HashMap`, structs composed of `Unpin` types) automatically implements `Unpin`. Only compiler-generated `Future` state machines (and structs containing `PhantomPinned`) are `!Unpin`.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

When Rust introduced `Pin`, a massive design problem arose: If `Pin<P>` prevents data from being moved, would developers have to write complex pinning boilerplate code even for simple types like `i32` or `String` when working with async APIs?

The Rust team solved this by creating the **`Unpin`** marker trait:
- If a type `T` implements `Unpin`, wrapping it in `Pin<&mut T>` does **not** restrict moving it. You can extract a normal `&mut T` reference out of `Pin<&mut T>` using `Pin::get_mut()` safely without `unsafe` blocks!
- If a type is `!Unpin` (like an `async fn` Future), `Pin` strictly forbids extracting `&mut T`, guaranteeing memory anchor stability.

### (2) Reality Metaphor

Imagine shipping boxes.

- **`!Unpin` (Self-Referential Future)**: A delicate glass sculpture assembled *inside* a custom crate, with wires attached to the crate walls. If you tilt or move the crate, the internal wires snap and destroy the sculpture. It cannot be moved once pinned!
- **`Unpin` (Standard Types)**: A solid wooden building block inside a box. You can flip the box upside down, move it to another room, or take the block out (`Pin::get_mut()`). The block doesn't care where it lives.

### (3) Rust Code Examples

#### Short Snippet (Extracting `&mut T` safely with `Pin::get_mut()`)
Because `i32` implements `Unpin`, `Pin::get_mut` allows safe mutable access without `unsafe`!

```rust
use std::pin::Pin;

fn main() {
    let mut val: i32 = 42;

    // Pinning a mutable reference to an i32
    let mut pinned: Pin<&mut i32> = Pin::new(&mut val);

    // Because i32 is Unpin, Pin::get_mut() is completely safe!
    *pinned.as_mut().get_mut() = 100;

    println!("Value is now: {}", val); // 100
}
```

#### Fuller Example (Stack Pinning `Unpin` vs `!Unpin` Futures)
This snippet contrasts standard `Unpin` data structures with compiler-generated `!Unpin` async futures.

```rust
use std::marker::PhantomPinned;
use std::pin::Pin;

// 1. Standard struct (auto-implements Unpin)
struct NormalData {
    name: String,
}

// 2. Self-referential struct (opts out of Unpin using PhantomPinned)
struct SelfReferentialData {
    name: String,
    _marker: PhantomPinned, // Makes this struct !Unpin
}

fn main() {
    let mut normal = NormalData { name: "Alice".into() };
    let mut self_ref = SelfReferentialData { name: "Bob".into(), _marker: PhantomPinned };

    // Pinned reference to NormalData (Unpin)
    let mut pin_normal = Pin::new(&mut normal);
    // SAFE: NormalData is Unpin, so we can mutate it or move it out!
    pin_normal.name = "Charlie".into();

    // Pinned reference to SelfReferentialData (!Unpin)
    // Pin::new(&mut self_ref); // ❌ COMPILE ERROR! Cannot use Pin::new on !Unpin types!
    // Must use unsafe { Pin::new_unchecked(&mut self_ref) } or Box::pin()!
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Unpin Trait Scoping and Lifecycle Rules

**The mistake:** Assuming Unpin Trait instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("unpin_trait_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("unpin_trait_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Unpin Trait State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Unpin Trait through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Unpin Trait Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Unpin Trait instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Asynchronous Ring Buffer Stream with Safe `Pin::get_mut` Unpin Projection

**Scenario:** Asynchronous ring buffer streams store data in an internal circular `VecDeque<T>` array. Because `VecDeque` implements `Unpin`, safe methods inside `Stream::poll_next` can project `Pin<&mut AsyncRingBuffer>` into a mutable reference `&mut AsyncRingBuffer` using `Pin::get_mut()` without requiring `unsafe` blocks.

**Requirements:**
Implement a custom `AsyncRingBufferStream` using `Pin::get_mut()`.

**Requirements**:
1. Define `AsyncRingBufferStream<T>` holding `buffer: VecDeque<T>`.
2. Implement `futures_core::stream::Stream` yielding `T`.
3. In `poll_next`, use `self.get_mut()` safely to pop front elements from `buffer`. Return `Poll::Ready(Some(item))` if present, or `Poll::Ready(None)` when empty.
4. Add unit tests asserting item sequence and safe `get_mut` usage.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use futures_core::stream::Stream;
> use std::collections::VecDeque;
> use std::pin::Pin;
> use std::task::{Context, Poll};
> 
> pub struct AsyncRingBufferStream<T> {
>     buffer: VecDeque<T>,
> }
> 
> impl<T> AsyncRingBufferStream<T> {
>     pub fn new(items: Vec<T>) -> Self {
>         Self {
>             buffer: VecDeque::from(items),
>         }
>     }
> }
> 
> impl<T: Unpin> Stream for AsyncRingBufferStream<T> {
>     type Item = T;
> 
>     fn poll_next(self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<Option<Self::Item>> {
>         // SAFE: Because Self implements Unpin, Pin::get_mut extracts &mut Self safely!
>         let this = self.get_mut();
>         match this.buffer.pop_front() {
>             Some(item) => Poll::Ready(Some(item)),
>             None => Poll::Ready(None),
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
>     use futures_util::stream::StreamExt;
> 
>     #[tokio::test]
>     async fn test_async_ring_buffer_stream() {
>         let mut stream = AsyncRingBufferStream::new(vec![10, 20, 30]);
>         let mut items = Vec::new();
> 
>         while let Some(val) = stream.next().await {
>             items.push(val);
>         }
> 
> 
>         assert_eq!(items, vec![10, 20, 30]);
>     }
> }
> ```
> 
> #### Technical Explanation
>
> 1. **Safe `Pin::get_mut`**: When a type `T` implements `Unpin`, Rust allows calling `Pin::get_mut(pinned_ref)` to obtain a standard mutable reference `&mut T` safely.
> 2. **No `unsafe` Required**: Because `AsyncRingBufferStream` contains no self-referential pointers, moving it in memory does not break invariants.
> 
> ---
> 
> ### Exercise 2: Multiplexed Protocol Decoder with Hybrid Structural Pinning and `Unpin` Field Access
> 
> **Scenario**: Complex network protocol controllers hold both an inner `!Unpin` state machine (e.g. an active request future) and `Unpin` metadata fields (e.g. byte counters or frame headers). When polling the controller, structural pin projection requires `unsafe` for `!Unpin` fields, but allows safe direct access via `Pin::get_mut` for `Unpin` fields.
> 
> Implement a protocol controller demonstrating hybrid field projection.
> 
> **Requirements**:
> 1. Define `ProtocolController<F>` containing `future: F` (`!Unpin`) and `bytes_read: usize` (`Unpin`).
> 2. Implement `poll_controller(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<usize>`.
> 3. Access `bytes_read` safely while projecting `future` with `unsafe`.
> 4. Add unit tests asserting counter increment and future completion.
> 
> [!check]- Answer
> ```rust
> use std::future::Future;
> use std::marker::PhantomPinned;
> use std::pin::Pin;
> use std::task::{Context, Poll};
> 
> pub struct ProtocolController<F> {
>     future: F,
>     pub bytes_read: usize,
>     _pin: PhantomPinned,
> }
> 
> impl<F> ProtocolController<F> {
>     pub fn new(future: F) -> Self {
>         Self {
>             future,
>             bytes_read: 0,
>             _pin: PhantomPinned,
>         }
>     }
> 
>     pub fn poll_controller(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<F::Output>
>     where
>         F: Future,
>     {
>         // SAFETY: Structural pin projection for `future`
>         let (fut_pin, bytes_ptr) = unsafe {
>             let this = self.get_unchecked_mut();
>             (Pin::new_unchecked(&mut this.future), &mut this.bytes_read)
>         };
> 
>         *bytes_ptr += 64; // Mutate Unpin field
>         fut_pin.poll(cx)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[tokio::test]
>     async fn test_protocol_controller_poll() {
>         let task = async { "FRAME_OK" };
>         let controller = ProtocolController::new(task);
>         tokio::pin!(controller);
> 
>         let waker = futures_util::task::noop_waker();
>         let mut cx = Context::from_waker(&waker);
> 
>         let res = controller.as_mut().poll_controller(&mut cx);
>         assert_eq!(res, Poll::Ready("FRAME_OK"));
>         assert_eq!(controller.bytes_read, 64);
>     }
> }
> ```
> 
> #### Technical Explanation
>
> 1. **Hybrid Projection**: Fields containing `PhantomPinned` render the top-level struct `!Unpin`.
> 2. **Field Access Safety**: While projecting `future` requires `Pin::new_unchecked`, mutating scalar fields like `bytes_read` is safe because primitive types do not rely on memory address stability.
> 
> ---
> 
> ### Exercise 3: Async Task Lifecycle Manager with `Pin::into_inner` Extraction for `Unpin` Futures
> 
> **Scenario**: Task schedulers store completed `Unpin` future results. When a future implements `Unpin`, calling `Pin::into_inner(pinned_box)` safely un-wraps the pinned wrapper and returns the underlying value without `unsafe`.
> 
> Demonstrate `Pin::into_inner` extraction for `Unpin` types.
> 
> **Requirements**:
> 1. Create a `TaskBox<T>` wrapping `Pin<Box<T>>`.
> 2. Implement `extract_inner(task: TaskBox<T>) -> T` where `T: Unpin`.
> 3. Add unit tests asserting ownership recovery via `Pin::into_inner`.
> 
> [!check]- Answer
> ```rust
> use std::pin::Pin;
> 
> pub struct TaskBox<T> {
>     pinned: Pin<Box<T>>,
> }
> 
> impl<T: Unpin> TaskBox<T> {
>     pub fn new(val: T) -> Self {
>         Self {
>             pinned: Box::pin(val),
>         }
>     }
> 
>     pub fn extract_inner(self) -> T {
>         // SAFE: Because T implements Unpin, Pin::into_inner extracts Box<T> safely
>         *Pin::into_inner(self.pinned)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_pin_into_inner_extraction() {
>         let task_box = TaskBox::new(String::from("UNPIN_TASK_PAYLOAD"));
>         let payload = task_box.extract_inner();
>         assert_eq!(payload, "UNPIN_TASK_PAYLOAD");
>     }
> }
> ```
> 
> #### Technical Explanation
>
> 1. **`Pin::into_inner` Bound**: `Pin::into_inner(pin)` requires `T: Unpin`, allowing callers to consume the `Pin` wrapper and extract the inner owned data safely.
> 
> ---
> 
## 6. Related Terms

- [Auto Traits](../level_09/auto_traits.md) — Related concept: Auto Traits.

---

## 7. Key Takeaways
> 
> - **`Unpin`** is a marker trait indicating a type can be safely moved in memory even after being pinned.
> - Almost **every standard type** in Rust (`i32`, `String`, `Vec`) implements `Unpin` automatically.
> - Only compiler-generated `Future`s and structs with `PhantomPinned` are **`!Unpin`**.
> - If a type is `Unpin`, you can call **`Pin::get_mut()`** or **`Pin::into_inner()`** safely without `unsafe` blocks.
> - It prevents async code from requiring tedious pinning boilerplate for standard, non-self-referential data types.
> 
