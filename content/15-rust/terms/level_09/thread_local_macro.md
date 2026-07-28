# `thread_local!` Macro

> **Level 9 — Concurrency & Parallelism**
> Declares per-thread storage — giving each thread its own independent instance of a value, without any shared-state synchronization.

---

## 1. Prerequisites

- [`static` (`static`)](../level_01/static_static.md) — The global-scope mechanism this macro provides a per-thread alternative to.
- [`std::thread::spawn`](../level_09/std_thread_spawn.md) — What creates the separate threads, each of which gets its own instance.
- [`OnceCell` / `OnceLock` / `LazyLock` / `LazyCell`](../level_09/oncelock_lazylock.md) — A related global-state tool, but *shared* across threads rather than per-thread.

---

## 2. Term Category

**Standard Library Macro (the per-thread global)**: A normal `static` is a **single** value shared by the entire program, across every thread — which means mutating it safely requires synchronization (`Mutex`, atomics, `OnceLock`). `thread_local!` sidesteps synchronization entirely by giving each thread its own **private, independent copy** of the value — no thread ever sees another thread's copy, so there's nothing to synchronize.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Some global-feeling state genuinely shouldn't be shared across threads at all — a per-thread request ID counter, a per-thread random number generator seed, a per-thread scratch buffer reused across many function calls to avoid repeated allocation. Using an ordinary `static` for these would force you to add synchronization (a `Mutex`, say) purely to protect data that was never meant to be shared in the first place — real overhead and complexity for a false problem. `thread_local!` solves this directly: it declares a value that's transparently instantiated **separately** for each thread that ever accesses it, the first time that thread touches it. Since no two threads ever see the same underlying storage, there's no possibility of a data race, and no synchronization primitive is needed at all — the isolation is structural, not lock-based.

### (2) Reality Metaphor

Imagine an office building where, instead of one shared supply closet everyone has to take turns accessing (**a `Mutex`-protected `static`**), each individual employee is issued their own small personal desk drawer stocked with a permanent, private set of pens and notepads.

- **A shared `static` (with a `Mutex`)**: Everyone lines up at the same supply closet, waiting their turn to grab a pen, then putting it back when done — necessary because it's genuinely the *same* physical pens everyone's sharing.
- **`thread_local!`**: Each employee's desk drawer is entirely their own — nobody ever needs to wait in line or coordinate, because nobody else can even see or touch what's in a different employee's drawer. Two employees can grab "their pen" at the exact same instant with zero possibility of conflict, since they're not even touching the same physical object.

### (3) Rust Code Examples

#### Short Snippet (Basic Per-Thread State)
```rust
use std::cell::Cell;

thread_local! {
    static COUNTER: Cell<u32> = Cell::new(0);
}

fn increment_and_print() {
    COUNTER.with(|c| {
        c.set(c.get() + 1);
        println!("Thread-local counter: {}", c.get());
    });
}

fn main() {
    increment_and_print(); // Thread-local counter: 1
    increment_and_print(); // Thread-local counter: 2 (SAME thread, so it accumulates)
}
```

#### Fuller Example (Each Spawned Thread Gets Its Own Independent Copy)
```rust
use std::cell::Cell;

thread_local! {
    static REQUEST_ID: Cell<u32> = Cell::new(0);
}

fn next_id() -> u32 {
    REQUEST_ID.with(|id| {
        let current = id.get();
        id.set(current + 1);
        current
    })
}

fn main() {
    let handles: Vec<_> = (0..3)
        .map(|_| std::thread::spawn(|| {
            // Each thread starts its OWN counter fresh at 0 — completely independent!
            println!("{} {} {}", next_id(), next_id(), next_id());
        }))
        .collect();

    for h in handles { h.join().unwrap(); }
    // Every thread prints "0 1 2" — none of them share state or interfere with each other.
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Thread Local Macro Scoping and Lifecycle Rules

**The mistake:** Assuming Thread Local Macro instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("thread_local_macro_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("thread_local_macro_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Thread Local Macro State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Thread Local Macro through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Thread Local Macro Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Thread Local Macro instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Predict the Output

**Problem:** Given the `REQUEST_ID` example above, if you called `next_id()` three times directly in `main()` (the main thread) *before* spawning any threads, what would the spawned threads' counters start at?

> [!check]- Answer
> **Each spawned thread would still start at 0.** `thread_local!` storage is entirely independent per thread — calling `next_id()` on the main thread only advances the main thread's own private copy of `REQUEST_ID`. A newly spawned thread has never touched `REQUEST_ID` before, so its first access lazily initializes a brand-new copy starting from the macro's initial value (`Cell::new(0)`), completely unaffected by what the main thread (or any other thread) has done with its own separate copy.

---

### Exercise 2: Declaring and Reading `thread_local!` Variables

**Problem:** Declare `thread_local! { static COUNTER: Cell<u32> = Cell::new(0); }` and increment it via `.with()`.

**Expected output:**
> [!check]- Answer
> ```
> Thread local val: 1
> ```
> ```rust
> use std::cell::Cell;
> thread_local! {
>     static COUNTER: Cell<u32> = Cell::new(0);
> }
> fn main() {
>     COUNTER.with(|c| c.set(c.get() + 1));
>     COUNTER.with(|c| println!("Thread local val: {}", c.get()));
> }
> ```
>
> **Explanation:** `thread_local!` variables provide isolated per-thread global storage accessed via `.with()`.

---

### Exercise 3: Independent Per-Thread Storage

**Problem:** Demonstrate that mutating a `thread_local!` variable in a spawned thread does not affect `main()` thread value.

**Expected output:**
> [!check]- Answer
> ```
> Spawned: 100, Main: 0
> ```
> ```rust
> use std::cell::Cell;
> use std::thread;
> thread_local! { static VAL: Cell<i32> = Cell::new(0); }
> fn main() {
>     thread::spawn(|| {
>         VAL.with(|v| v.set(100));
>         VAL.with(|v| println!("Spawned: {}", v.get()));
>     }).join().unwrap();
>     VAL.with(|v| println!("Main: {}", v.get()));
> }
> ```
>
> **Explanation:** Each OS thread allocates its own independent memory storage for `thread_local!` items.

---

## 6. Related Terms

- [`static` (`static`)](../level_01/static_static.md) — The program-wide, shared alternative this macro specifically avoids.
- [Interior Mutability](../level_03/interior_mutability.md) — `thread_local!` values are almost always paired with `Cell`/`RefCell`, since the storage itself is accessed through a shared `&` reference via `.with()`.
- [`OnceCell` / `OnceLock` / `LazyLock` / `LazyCell`](../level_09/oncelock_lazylock.md) — The shared-across-threads sibling tool for lazy global state.
- [`std::thread::spawn`](../level_09/std_thread_spawn.md) — What creates the separate threads, each lazily getting its own independent `thread_local!` instance on first access.

---

## 7. Key Takeaways

- `thread_local!` gives each thread its **own independent instance** of a value — no two threads ever see or share the same underlying storage.
- Because there's no sharing, there's no data-race possibility, and no `Mutex`/atomics are needed.
- Access goes through `.with(|value| { ... })`, since the macro-declared item itself is a special handle, not the value directly.
- Almost always paired with `Cell`/`RefCell` for interior mutability, since `.with()` only ever hands you a shared `&` reference to the thread's own copy.
