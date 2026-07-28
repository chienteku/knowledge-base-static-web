# Data Race

> **Level 9 — Concurrency & Parallelism**
> Simultaneous unsynchronized access where at least one is a write; impossible in safe Rust.

---

## 1. Prerequisites

- [`std::thread::spawn`](../level_09/std_thread_spawn.md) — The function that introduces multiple threads (and thus the possibility of data races).
- [Ownership](../level_03/ownership.md) — The system Rust uses to prevent this bug.
- [`Mutex<T>`](../level_09/mutex_t.md) — The tool used to synchronize access and prevent data races.

---

## 2. Term Category

**Rust-nonspecific (the ultimate villain)**: A Data Race is widely considered the most terrifying, difficult-to-debug error in all of computer science. It occurs when two threads try to access the exact same piece of memory at the exact same microsecond, and at least one of them is modifying (writing to) that memory.

The entire Rust programming language was essentially created to mathematically eradicate this specific bug.

---

## 3. Explanation

### (1) Design Motivation — "Why does this concept exist?"

In C and C++, Data Races are a daily occurrence. They are often called "Heisenbugs" (named after the Heisenberg Uncertainty Principle)—they only happen 1 in 10,000 times based on microscopic, random variations in CPU timing and OS scheduling. 

Your code will work perfectly on your laptop 100 times in a row, pass every test, and then crash catastrophically in production once a month. Because the timing is random, they are nearly impossible to reproduce and fix.

Rust's strict Ownership system, the Borrow Checker (which only allows one `&mut` reference at a time), and the `Send`/`Sync` traits were all explicitly designed to guarantee at compile-time that a Data Race is physically impossible to compile.

### (2) Reality Metaphor

Imagine a giant chalkboard (the computer's memory). 

Two people (threads) are standing at the board, both wearing blindfolds. 
- Person A is running their fingers across the board to read a sentence. 
- At the exact same time, Person B takes an eraser, wipes away half the sentence, and writes a new one. 

Person A ends up reading half of the old sentence and half of the new sentence, resulting in absolute gibberish. That is a Data Race. The data is fundamentally corrupted because it was modified *while* it was being accessed.

### (3) Rust Code Examples

#### Short Snippet (The Attempt)
It is impossible to write a Data Race in Safe Rust. If you try, the Borrow Checker will instantly stop you!

```rust
use std::thread;

fn main() {
    let mut data = vec![1, 2, 3];

    // Thread A tries to write to the data
    thread::spawn(|| {
        data.push(4); // COMPILE ERROR!
    });

    // Thread B tries to read the data at the exact same time!
    thread::spawn(|| {
        println!("{:?}", data); // COMPILE ERROR!
    });
}
```
In C++, this compiles perfectly and crashes randomly. In Rust, the compiler screams because you are trying to use a variable after moving it, preventing the Data Race.

#### Fuller Example (The Bank Heist)
To understand why Data Races are so dangerous, let's look at the classic Banking example. This is what happens under the hood if a Data Race were allowed to occur when depositing money.

1. The Bank Account has **$0**.
2. Thread A and Thread B both want to deposit $100 at the exact same microsecond.
3. Thread A reads the balance. It sees **$0**.
4. Thread B reads the balance. It sees **$0**.
5. Thread A adds $100 to the $0 it saw, and writes **$100** to the database.
6. Thread B adds $100 to the $0 it saw, and writes **$100** to the database (overwriting Thread A!).
7. The total balance is **$100**. The other $100 vanished into thin air!

To prevent this, you must synchronize the access using a [`Mutex`](../level_09/mutex_t.md) or [`Atomic Types`](../level_09/atomic_types.md). By forcing the threads to take turns (synchronization), Thread B is forced to wait until Thread A finishes. Thread B will read the updated `$100`, add its own `$100`, and correctly write `$200`.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Data Race Scoping and Lifecycle Rules

**The mistake:** Assuming Data Race instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("data_race_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("data_race_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Data Race State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Data Race through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Data Race Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Data Race instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Rust Promise

**Problem:** You are writing a multi-threaded Rust application without using any `unsafe` blocks. Your program crashes. Your coworker looks at the code and says, *"Ah, you must have a Data Race somewhere."* Why is your coworker definitely wrong?

> [!check]- Answer
> Because **Data Races are mathematically impossible in Safe Rust!**
>
> If your program crashed, it might be due to a Deadlock, a `.unwrap()` panic, or an out-of-bounds array access, but the compiler *guarantees* it is not a Data Race.

---

### Exercise 2: The Compiler as Race Detector — Three Rejected Programs

**Problem:**
A data race requires three things simultaneously: two threads, shared memory, and at least one write. The Rust type system prevents all three combinations from existing in safe code. Study these three attempts and explain *which rule* blocks each one.

```rust
// Attempt A: shared mutable reference across threads
let mut x = 0i32;
std::thread::spawn(|| { x += 1; }); // borrow of `x`
println!("{}", x);                  // second use of `x`

// Attempt B: sharing a non-Sync type across threads
use std::cell::RefCell;
let rc = std::sync::Arc::new(RefCell::new(0));
let rc2 = rc.clone();
std::thread::spawn(move || { *rc2.borrow_mut() += 1; }); // RefCell: !Sync

// Attempt C: moving a non-Send type into a thread
let rc = std::rc::Rc::new(0);
std::thread::spawn(move || { println!("{}", rc); }); // Rc: !Send
```

**Expected output:**
> [!check]- Answer
> ```text
> (none — all three attempts are compile errors)
> ```
>
> - **Hint 1:** Attempt A is blocked by the **borrow checker**: `x += 1` requires `&mut x` inside the closure. But `println!("{}", x)` on the next line is a simultaneous borrow — the compiler enforces "one `&mut` OR many `&`, never both at once", making it impossible for two concurrent accesses to exist where one writes.
> - **Hint 2:** Attempt B is blocked by the **`Sync` trait bound**: `Arc<T>: Send` only when `T: Sync`. `RefCell<T>` is deliberately `!Sync` because its borrow counter is not atomic — two threads could corrupt it. The compiler rejects the spawn with `E0277: RefCell<i32> cannot be shared between threads safely`.
> - **Hint 3:** Attempt C is blocked by the **`Send` trait bound**: `thread::spawn` requires the moved closure to be `Send`. `Rc<T>` is `!Send` because its reference count is a plain `usize` (not atomic) — incrementing/decrementing it from two threads simultaneously would corrupt it. `E0277: Rc<i32> cannot be sent between threads safely`.
>
> **Explanation:**
> Safe Rust makes data races structurally impossible through three interlocking mechanisms:
> 1. **Borrow checker**: enforces `&mut T` exclusivity at compile time — no two code paths can hold a mutable reference to the same data simultaneously, preventing unsynchronized concurrent writes.
> 2. **`Send` trait**: gates what can be *moved* into a new thread. Types whose internals would be corrupted by concurrent access from different threads (like `Rc`) are `!Send`.
> 3. **`Sync` trait**: gates what can be *shared by reference* across threads. Types that allow unsynchronized interior mutation (like `RefCell`) are `!Sync`.
>
> These three checks together cover every possible shape of "two threads touching the same memory".

---

### Exercise 3: Data Race vs. Race Condition — A TOCTOU Bug Mutex Cannot Fix

**Problem:**
Rust eliminates *data races* (memory corruption from unsynchronized concurrent access). But it does **not** eliminate *race conditions* — logical bugs where the *timing* of operations produces wrong results even though each individual memory access is synchronized.

Demonstrate the classic "check-then-act" race condition:
1. A shared `Arc<Mutex<i32>>` represents a bank balance starting at `100`.
2. Spawn **two threads** that both:
   - Lock the mutex, **read** the balance, and **unlock** (drop the guard).
   - If the balance is ≥ 80, sleep 10 ms (simulating processing time), then lock again and **subtract 80**.
3. Join both threads and print the final balance.
4. Explain why the final balance can be **negative** even though `Mutex` is used correctly.

**Expected output:**
> [!check]- Answer
> ```text
> Final balance: -60   (or 20, depending on scheduling)
> ```
> *(Both threads see balance=100 ≥ 80, both proceed, both subtract 80: 100 − 80 − 80 = −60)*
>
> - **Hint 1:** The bug is in the **gap between the read lock and the write lock**. Thread A reads `100`, drops the lock, sleeps. Thread B reads `100` (still 100!), drops the lock, sleeps. Now both believe they have permission to withdraw. Thread A wakes first, subtracts: `100 − 80 = 20`. Thread B wakes, subtracts: `20 − 80 = −60`. No data race occurred — every lock/unlock was correct. But the *logical invariant* ("only withdraw if balance ≥ amount") was violated.
> - **Hint 2:** The fix is to never release the lock between the check and the act — keep a single guard alive across both operations. This is called a *compare-and-swap* or *atomic transaction* pattern.
> - **Hint 3:** This pattern is called **TOCTOU (Time Of Check To Time Of Use)**. It is the most common concurrency bug class that `Mutex` alone cannot prevent — because `Mutex` only guarantees each individual lock operation is exclusive, not that the *sequence* of operations is atomic.
>
> ```rust
> use std::sync::{Arc, Mutex};
> use std::thread;
> use std::time::Duration;
>
> fn main() {
>     let balance = Arc::new(Mutex::new(100i32));
>     let mut handles = vec![];
>
>     for _ in 0..2 {
>         let bal = Arc::clone(&balance);
>         handles.push(thread::spawn(move || {
>             // Step 1: read the balance and release the lock.
>             let current = *bal.lock().unwrap();
>
>             if current >= 80 {
>                 // GAP: lock is released here. Other thread can read balance too!
>                 thread::sleep(Duration::from_millis(10)); // simulate processing
>
>                 // Step 2: acquire lock again and subtract — but balance may have changed!
>                 let mut guard = bal.lock().unwrap();
>                 *guard -= 80; // both threads do this if both saw current >= 80
>             }
>         }));
>     }
>
>     for h in handles { h.join().unwrap(); }
>     println!("Final balance: {}", *balance.lock().unwrap());
> }
> ```
>
> **Explanation:**
> `Mutex` prevents data races: no two threads corrupt the `i32`'s memory. But it cannot prevent *logical* race conditions where the invariant "only withdraw if balance is sufficient" is checked and acted on in two separate lock acquisitions. In between those two operations, another thread can change the world. The fix — holding the lock from check to act — shows why correct lock *granularity* matters as much as correct lock *usage*.

---

## 6. Related Terms

- [`Mutex<T>`](../level_09/mutex_t.md) — The software tool that prevents Data Races by forcing threads to wait in a single-file line.
- [`Atomic` Types](../level_09/atomic_types.md) — The hardware tool that prevents Data Races by performing math in a single, uninterruptible cycle.

---

## 7. Key Takeaways

- A **Data Race** happens when two threads access the exact same memory simultaneously, and at least one is writing.
- They cause silent, unpredictable memory corruption that is nearly impossible to reproduce or debug.
- Safe Rust guarantees that Data Races are **impossible to compile**.
- Rust prevents them using the core concepts of Ownership, Borrowing (`&mut`), `Send`, and `Sync`.
- A Data Race (memory corruption) is different from a **Race Condition** (a logical timing bug). Rust does *not* prevent Race Conditions.
