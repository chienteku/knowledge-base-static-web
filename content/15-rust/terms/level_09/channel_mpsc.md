# Channel (`mpsc`)

> **Level 9 — Concurrency & Parallelism**
> Multi-producer, single-consumer message passing: `std::sync::mpsc`.

---

## 1. Prerequisites

- [`std::thread::spawn`](../level_09/std_thread_spawn.md) — The function used to spawn the threads that will send the messages.
- [`Send` Trait](../level_09/send_trait.md) — The trait required to physically move data through the channel.
- [`Arc<Mutex<T>>`](../level_09/arc_mutex_t.md) — The *other* way to do concurrency, which you should compare this to.

---

## 2. Term Category

**Rust-nonspecific (the message tube)**: There are two main ways to write multithreaded programs. 
1. Share memory using `Arc<Mutex<T>>` (everyone gathers around one variable).
2. Pass messages using a **Channel**. 

A Channel is a one-way tube connecting two threads. One thread pushes data in, and the other thread pulls it out. `mpsc` stands for **M**ulti-**P**roducer, **S**ingle-**C**onsumer, meaning you can have 10 threads pushing messages into the tube, but only 1 thread at the end reading them.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

> *"Do not communicate by sharing memory; instead, share memory by communicating."* 

This is a famous slogan from the Go programming language that Rust also deeply embraces. 

`Arc<Mutex<T>>` is perfectly safe, but it can be incredibly slow. If you have 10 threads all trying to lock the same Mutex, 9 of them are constantly paused, waiting in line. What if, instead of locking a shared variable, the worker threads just did their math independently and *mailed* the answer to the main thread? 

Channels allow threads to work entirely independently without ever locking a shared resource. Because they don't wait in line, Channels can massively improve performance in certain architectures.

### (2) Reality Metaphor

Imagine a busy Bank. You have 10 Bank Tellers (the Multi-Producers). 

When a teller receives a cash deposit, they don't want to leave their desk, walk to the back room, and wait in line to put the cash in a shared safe (`Mutex`). That wastes time! 

Instead, they drop the cash into a pneumatic tube at their desk (the **Channel**). The tube shoots the cash to the back room, where a single Vault Manager (the Single-Consumer) catches it and files it away. The tellers never have to leave their desks or wait in line, and the Vault Manager doesn't have 10 people crowding their workspace!

### (3) Rust Code Examples

#### Short Snippet (The Declaration)
When you create a channel, it returns a tuple of two halves: the Transmitter (`tx`) and the Receiver (`rx`).

```rust
use std::sync::mpsc;

fn main() {
    // tx = the pneumatic tube entrance
    // rx = the basket where the messages pop out
    let (tx, rx) = mpsc::channel();
    
    // We send a string into the tube
    tx.send("Hello from the tube!").unwrap();
    
    // We catch the string as it pops out
    let message = rx.recv().unwrap();
    println!("{}", message);
}
```

#### Fuller Example (Multi-Producer in Action)
Let's spawn 3 threads (Tellers). We will clone the `tx` so each thread has its own entrance to the tube. The main thread will be the Vault Manager.

```rust
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

fn main() {
    let (tx, rx) = mpsc::channel();

    // Spawn 3 Tellers
    for i in 1..=3 {
        // We MUST clone `tx` so the thread can own a copy!
        let tx_clone = tx.clone();
        
        thread::spawn(move || {
            let msg = format!("Teller {} received a deposit!", i);
            
            // Send the message down the tube. This MOVES ownership of `msg`.
            tx_clone.send(msg).unwrap();
            thread::sleep(Duration::from_millis(10));
        });
    }

    // CRITICAL: We must drop the original `tx` in the main thread! 
    // Otherwise, the `rx` channel stays open forever waiting for the main thread.
    drop(tx);

    // The Vault Manager reads messages until the channel closes
    // (The channel closes automatically when all `tx` clones are dropped)
    for received_msg in rx {
        println!("Vault Manager got: {}", received_msg);
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Channel Mpsc Scoping and Lifecycle Rules

**The mistake:** Assuming Channel Mpsc instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("channel_mpsc_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("channel_mpsc_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Channel Mpsc State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Channel Mpsc through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Channel Mpsc Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Channel Mpsc instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Acronym

**Problem:** In Rust, you can clone the `tx` variable and give it to 100 different threads. Can you clone the `rx` variable and give it to 2 different threads? Why or why not?

> [!check]- Answer
> **No, you cannot clone `rx`!**
>
> The module is named `mpsc`, which stands for **Multi-Producer, Single-Consumer**. The Rust compiler explicitly enforces this by making `tx` cloneable, but making `rx` un-cloneable. Only one thread is allowed to read from the channel!
>
> *(If you ever need multiple consumers, you have to use an external crate like `crossbeam` or `flume` which provide `mpmc` channels).*

---

### Exercise 2: Multi-Producer Single-Consumer \u2014 Receiving Real Messages

**Problem:**
`mpsc::channel` is built for multiple producers feeding one consumer. Cloning `tx` hands an independent sender to each producer thread \u2014 all clones route their messages into the same channel, and `rx` receives them all.

Write a program that:
1. Creates an `mpsc::channel::<String>()`.
2. Spawns **3 threads**, each cloning `tx` and sending `format!("hello from thread {i}")`.
3. Drops the original `tx` in `main` so the channel closes when all clones are also dropped.
4. Iterates `rx` (using `for msg in rx`) and prints each received message.

Then answer: **why must you `drop(tx)` in `main` before iterating `rx`?**

**Expected output:**
> [!check]- Answer
> ```text
> Received: hello from thread 0
> Received: hello from thread 1
> Received: hello from thread 2
> ```
> *(order may vary \u2014 thread scheduling is non-deterministic)*
>
> - **Hint 1:** `tx.clone()` increments the sender reference count. The channel stays open (blocking `rx`) as long as *any* `tx` clone is alive. If you don't `drop(tx)` in main, the `for msg in rx` loop will block forever after the 3 thread-clones drop \u2014 the original `tx` in main is still alive, so `rx` keeps waiting for more messages.
> - **Hint 2:** `for msg in rx` is idiomatic iteration over a channel: it calls `.recv()` repeatedly, yielding each message, and terminates (returns `None`) only when the last `tx` clone is dropped and the channel is empty.
> - **Hint 3:** Join handles are not strictly required here because `for msg in rx` blocks main until all senders are dropped \u2014 by the time the loop ends, all 3 threads have completed their sends (and dropped their `tx` clones). Joining anyway is good practice.
>
> ```rust
> use std::sync::mpsc;
> use std::thread;
>
> fn main() {
>     let (tx, rx) = mpsc::channel::<String>();
>     let mut handles = vec![];
>
>     for i in 0..3 {
>         let tx_clone = tx.clone(); // each thread gets its own sender clone
>         let handle = thread::spawn(move || {
>             tx_clone.send(format!("hello from thread {}", i)).unwrap();
>             // tx_clone drops here, decrementing the sender count
>         });
>         handles.push(handle);
>     }
>
>     // CRITICAL: drop the original tx so the channel closes after all
>     // thread clones finish. Without this, `for msg in rx` blocks forever.
>     drop(tx);
>
>     // for..in on rx calls rx.recv() until all senders are dropped.
>     for msg in rx {
>         println!("Received: {}", msg);
>     }
>
>     for h in handles { h.join().unwrap(); }
> }
> ```
>
> **Explanation:**
> The channel closes \u2014 and `rx` stops blocking \u2014 only when *every* sender clone has been dropped. This includes both the thread clones *and* the original `tx` in `main`. Forgetting `drop(tx)` is the classic `mpsc` bug: the 3 threads finish and drop their clones, but the original `tx` in `main` is still alive, so `rx.recv()` keeps waiting indefinitely. Dropping `tx` explicitly before consuming `rx` is the idiomatic fix.

---

### Exercise 3: Synchronous Bounded Channels (`sync_channel`)

**Problem:** Create a `sync_channel(1)` bounded channel and show that sending blocks when full.

**Expected output:**
> [!check]- Answer
> ```
> Bounded channel sent
> ```
> ```rust
> use std::sync::mpsc;
> fn main() {
>     let (tx, rx) = mpsc::sync_channel(1);
>     tx.send(10).unwrap();
>     println!("Bounded channel sent: {}", rx.recv().unwrap());
> }
> ```
>
> **Explanation:** `sync_channel` enforces backpressure by blocking senders when buffer limits are reached.

---

## 6. Related Terms

- [`std::thread::spawn`](../level_09/std_thread_spawn.md) — The function used to spawn the Producers.
- [`Arc<Mutex<T>>`](../level_09/arc_mutex_t.md) — The alternative approach to concurrency (sharing memory instead of passing messages).

---

## 7. Key Takeaways

- A **Channel** is a one-way communication tube between threads.
- `mpsc` stands for **Multi-Producer, Single-Consumer**.
- `mpsc::channel()` returns a tuple: **`(tx, rx)`** (Transmitter and Receiver).
- You can `.clone()` the `tx` to give it to multiple threads. You *cannot* clone the `rx`.
- Sending a message `.send(data)` **moves** ownership of the data into the channel (requiring the `Send` trait).
- You can iterate over `rx` (like `for msg in rx`) to read messages until the channel closes.
- The channel only closes when *every single copy* of `tx` has been dropped!
