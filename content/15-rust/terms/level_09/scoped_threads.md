# Scoped Threads (`std::thread::scope`)

> **Level 9 — Concurrency & Parallelism**
> Threads guaranteed to finish before the enclosing scope exits, letting them safely borrow non-`'static` stack data.

---

## 1. Prerequisites

- [`std::thread::spawn`](../level_09/std_thread_spawn.md) — The unscoped thread-creation function this feature extends.
- [`'static` Lifetime](../level_05/static_lifetime.md) — The requirement scoped threads specifically relax.
- [`Arc<T>`](../level_03/arc_t.md) — The workaround scoped threads often let you avoid entirely.

---

## 2. Term Category

**Concurrency API (the borrow-friendly thread spawner)**: `std::thread::scope` creates a block where threads spawned inside are **guaranteed by the compiler** to be joined (finished) before the block ends. This guarantee is what lets those threads borrow local stack data directly, something ordinary `thread::spawn` cannot allow.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

`std::thread::spawn` requires its closure to be `'static` — meaning it can only capture owned data or `'static` references, never a borrow of a local stack variable. This restriction exists because a spawned thread's *lifetime is unbounded* from the compiler's point of view: it might still be running long after the function that spawned it has returned and its stack variables have been destroyed, which would leave the thread holding a dangling reference. The common workaround — wrapping data in `Arc<T>` — works, but forces an allocation and a runtime reference count even when the data was always going to outlive every spawned thread anyway (e.g. a `for` loop that spawns threads and then immediately waits for all of them). `std::thread::scope` fixes this at the type-system level: because the API's design *guarantees* every thread spawned inside the scope is joined before the scope function returns, the compiler can soundly allow those threads to borrow data from the *enclosing* stack frame — no `'static` bound, no `Arc`, no allocation required.

### (2) Reality Metaphor

Imagine sending several employees out to run quick errands, but you know for certain none of them can leave the building until they all check back in with you.

- **`thread::spawn` (unscoped)**: An employee (**the thread**) is sent out with instructions to potentially work indefinitely, with no promise of when — or if — they'll be back before you leave the building yourself. Because of that uncertainty, you can't hand them anything that only exists inside your own desk (**a stack borrow**) — you'd have to give them a durable, personal copy of everything they need (**owned/`'static` data**), in case your desk is cleared out before they return.
- **`thread::scope` (scoped)**: You gather several employees for errands, but this time everyone has signed a binding agreement: nobody leaves the building until **everyone** has reported back to you, and you personally won't walk out that door until they have. Because that guarantee is airtight, you can now safely hand them documents straight off your own desk (**borrow local stack data**) — you know with certainty your desk won't be cleared while they're still out.

### (3) Rust Code Examples

#### Short Snippet (Borrowing Local Data Without `Arc`)
```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5]; // A plain, NON-'static local variable.

    std::thread::scope(|s| {
        s.spawn(|| {
            let sum: i32 = numbers.iter().sum(); // Directly borrows `numbers` — no Arc!
            println!("sum: {sum}");
        });
        s.spawn(|| {
            println!("max: {:?}", numbers.iter().max()); // Also borrows `numbers`.
        });
    }); // <- `scope` blocks here until BOTH threads finish; only then can `numbers` drop.

    println!("numbers still usable here: {numbers:?}");
}
```

#### Fuller Example (Splitting Work Across a Slice)
```rust
fn parallel_sum(data: &[i32], num_chunks: usize) -> i32 {
    let chunk_size = data.len().div_ceil(num_chunks);
    let mut total = 0;

    std::thread::scope(|s| {
        let handles: Vec<_> = data
            .chunks(chunk_size)
            .map(|chunk| s.spawn(move || chunk.iter().sum::<i32>())) // Borrows a slice of `data`.
            .collect();

        for handle in handles {
            total += handle.join().unwrap();
        }
    });

    total
}

fn main() {
    let data: Vec<i32> = (1..=100).collect();
    println!("{}", parallel_sum(&data, 4)); // 5050
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Scoped Threads Scoping and Lifecycle Rules

**The mistake:** Assuming Scoped Threads instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("scoped_threads_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("scoped_threads_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Scoped Threads State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Scoped Threads through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Scoped Threads Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Scoped Threads instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Why Does This Fail Without `scope`?

**Problem:** Explain, in terms of lifetimes, why this code fails to compile with plain `std::thread::spawn`:
```rust
fn broken() {
    let data = vec![1, 2, 3];
    std::thread::spawn(|| {
        println!("{:?}", data); // ERROR: closure may outlive the current function
    });
}
```

> [!check]- Answer
> `std::thread::spawn` requires its closure to be `'static`, because the returned `JoinHandle` could be dropped (never joined) or joined arbitrarily late — the compiler has no way to guarantee the thread finishes before `data` goes out of scope at the end of `broken()`. Since `data` is a purely local, non-`'static` `Vec<i32>`, borrowing it inside a `'static`-bound closure is rejected. Wrapping the `spawn` call in `std::thread::scope(|s| { s.spawn(|| { ... }); })` fixes this: `scope`'s API contract guarantees the spawned thread joins before `scope()` itself returns, which is *before* `data` could ever be dropped, so the compiler can soundly permit the borrow.

---

### Exercise 2: Borrowing Local Stack Variables in Scoped Threads

**Problem:** Borrow a local slice `&str` inside a `std::thread::scope` thread without cloning or `'static` bounds.

**Expected output:**
```
Scoped thread read: stack data
```

> [!check]- Answer
> ```rust
> use std::thread;
> fn main() {
>     let msg = String::from("stack data");
>     thread::scope(|s| {
>         s.spawn(|| {
>             println!("Scoped thread read: {}", msg);
>         });
>     });
> }
> ```
>
> **Explanation:** `std::thread::scope` guarantees all spawned threads join before scope exit, enabling safe borrowing of non-`'static` stack variables.

### Exercise 3: Mutating Stack Data Across Scoped Threads

**Problem:** Mutate separate elements of a local slice concurrently across scoped threads using `split_at_mut`.

**Expected output:**
```
Mutated slice: [10, 20]
```

> [!check]- Answer
> use std::thread;
> fn main() {
>     let mut data = vec![1, 2];
>     let (left, right) = data.split_at_mut(1);
>     thread::scope(|s| {
>         s.spawn(|| { left[0] = 10; });
>         s.spawn(|| { right[0] = 20; });
>     });
>     println!("Mutated slice: {:?}", data);
> }
> ```
>
> **Explanation:** Splitting mutable slices allows independent scoped threads to mutate distinct memory regions safely.

---

## 6. Related Terms

- [`std::thread::spawn`](../level_09/std_thread_spawn.md) — The unscoped primitive this API builds on and relaxes the `'static` requirement of.
- [`'static` Lifetime](../level_05/static_lifetime.md) — The specific constraint scoped threads let you bypass.
- [`Arc<T>`](../level_03/arc_t.md) — The common (now often unnecessary) workaround for sharing data with unscoped threads.
- [RAII](../level_18/raii.md) — The `scope` function's "block until all threads join" behavior is itself an RAII-style guarantee, enforced by the API's structure rather than a `Drop` impl.

---

## 7. Key Takeaways

- `std::thread::scope(|s| { ... })` guarantees every thread spawned via `s.spawn(...)` is joined before `scope()` returns.
- That guarantee lets scoped threads borrow **non-`'static`** data straight from the enclosing stack frame — no `Arc`, no cloning, no allocation.
- Reach for it whenever your concurrency pattern is "fan out several threads, then wait for all of them" within the same function.
- Fall back to `Arc`/`Mutex` only when threads must genuinely outlive the spawning function or need true shared mutable state beyond a simple join.
