# `std::thread::spawn`

> **Level 9 — Concurrency & Parallelism**
> Creates a new OS thread.

---

## 1. Prerequisites

- [Closure (`|...|`)](../level_06/closure.md) — The anonymous function syntax used to give the new thread its instructions.
- [`move` Keyword](../level_06/move_closure.md) — The keyword required to safely transfer variables into the new thread.

---

## 2. Term Category

**Rust-nonspecific (the parallel worker)**: Almost all modern languages support multithreading. It is the ability to tell your computer's Operating System to create a second, independent timeline of execution so you can run two tasks at the exact same time. 

**`std::thread::spawn`** is the Rust standard library function that creates these parallel workers.

---

## 3. Explanation

### (1) Design Motivation — "Why does this exist in programming languages?"

Single-core CPU speeds stopped increasing dramatically over a decade ago. To keep computers getting faster, manufacturers started adding *more cores* (4, 8, 16, or 32 cores per chip). 

If you write standard synchronous code, your program only runs on ONE core, wasting 95% of your computer's power! To utilize modern hardware, you must split your work into chunks and spawn threads to process them simultaneously. 

Rust's approach to threads is world-famous. In C++, sharing data between threads often causes catastrophic bugs (Data Races) where two threads overwrite the same memory at the same time. Rust uses its Ownership system to completely prevent Data Races at compile time!

### (2) Reality Metaphor

Imagine you are a Head Chef (the main thread) cooking a massive Thanksgiving dinner. 

You are chopping vegetables. If you stop chopping to stir the soup, the vegetables don't get chopped. You can only do one thing at a time. It takes 5 hours to cook dinner. 

To speed this up, you pick up a phone and hire an Assistant Chef (`thread::spawn`). You hand them a recipe card (a Closure) and say: *"You stir the soup!"* Now, you are chopping vegetables while they are stirring the soup at the exact same time. Dinner is ready in 2 hours!

### (3) Rust Code Examples

#### Short Snippet (The Assistant Chef)
You pass a Closure to `spawn`. The new thread immediately begins executing the code inside the closure.

```rust
use std::thread;

fn main() {
    // We hire an assistant chef to print this message!
    thread::spawn(|| {
        println!("Hello from the new thread!");
    });
}
```

#### Fuller Example (Waiting for the Assistant)
If you run the code above, there is a very high chance it will print absolutely nothing! Why? Because if the Head Chef (the main thread) finishes their work and goes home, the restaurant closes and all assistant chefs are instantly fired! 

You must tell the main thread to **wait** for the assistant to finish.

```rust
use std::thread;
use std::time::Duration;

fn main() {
    // 1. Spawn the thread. It returns a "handle" (a receipt for our thread).
    let handle = thread::spawn(|| {
        for i in 1..=5 {
            println!("Assistant thread is working on item {}...", i);
            thread::sleep(Duration::from_millis(10)); // Simulate hard work
        }
    });

    // 2. The main thread continues working simultaneously!
    for i in 1..=3 {
        println!("Main thread is working on item {}...", i);
        thread::sleep(Duration::from_millis(10));
    }

    // 3. We tell the main thread to WAIT here until the assistant finishes.
    // Without this, the program might exit before the assistant counts to 5!
    handle.join().unwrap();
    
    println!("Both threads are completely done!");
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to borrow variables from the main thread

**The pitfall:** A beginner creates a string in the main thread and tries to print it from inside the spawned thread. The compiler screams: *"Closure may outlive the current function!"*

*Incorrect:*
```rust
let name = String::from("Alice");
thread::spawn(|| {
    println!("Hello {}", name); // COMPILE ERROR!
});
```

**Why it's wrong:** The Rust compiler is protecting you from a massive memory safety bug! 
What if the main thread finishes its work, hits the end of the `main()` function, and destroys (drops) the `name` variable? But the spawned thread is still running! If the spawned thread tried to print `name`, it would be reading garbage, corrupted memory (a dangling pointer).

**The fix:** You MUST use the **`move`** keyword to permanently transfer Ownership of the variable into the new thread!

*Fix:*
```rust
let name = String::from("Alice");
thread::spawn(move || { // <--- Added `move`!
    println!("Hello {}", name); // Perfectly safe!
});
```
By taking Ownership, the spawned thread is now responsible for destroying `name` when it finishes, guaranteeing memory safety.

---

### Mistake 2: Mutating Std Thread Spawn State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Std Thread Spawn through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Std Thread Spawn Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Std Thread Spawn instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Silent Program

**Problem:** You write a program that spawns a thread to calculate a massive prime number. You run the program, and it immediately exits without printing anything. What critical function call did you forget to add to the bottom of your `main()` function?

> [!check]- Answer
> You forgot to call **`.join().unwrap()`** on the thread handle! 
>
> Because you didn't tell the main thread to wait, the main thread instantly hit the end of the file and exited, which automatically kills all spawned threads before they have a chance to finish their math.

---

### Exercise 2: Waiting for Thread Completion with `.join()`

**Problem:** Spawn a thread returning `42` and retrieve the result using `handle.join().unwrap()`.

**Expected output:**
> [!check]- Answer
> ```
> Thread returned: 42
> ```
> ```rust
> use std::thread;
> fn main() {
>     let handle = thread::spawn(|| 42);
>     let res = handle.join().unwrap();
>     println!("Thread returned: {}", res);
> }
> ```
>
> **Explanation:** `JoinHandle::join` blocks until the target thread terminates, returning `Result<T, Box<dyn Any>>`.

---

### Exercise 3: Setting Custom Thread Names

**Problem:** Use `std::thread::Builder::new().name("worker".into())` to spawn a named thread.

**Expected output:**
> [!check]- Answer
> ```
> Named thread spawned
> ```
> ```rust
> use std::thread;
> fn main() {
>     let handle = thread::Builder::new()
>         .name("worker".into())
>         .spawn(|| println!("Named thread spawned"))
>         .unwrap();
>     handle.join().unwrap();
> }
> ```
>
> **Explanation:** `thread::Builder` configures thread stack sizes and OS thread names.

---

## 6. Related Terms

- [`move` Keyword](../level_06/move_closure.md) — The keyword required to safely transfer external variables into the thread closure.
- [`Send` Trait](../level_09/send_trait.md) — The upcoming trait that determines if a variable is actually *allowed* to be moved into a thread!

---

## 7. Key Takeaways

- **`std::thread::spawn`** creates a new OS thread to run code in parallel.
- It takes a Closure (`|| { ... }`) containing the code you want the new thread to run.
- You must call **`.join().unwrap()`** on the returned handle if you want the main thread to stop and wait for the spawned thread to finish.
- You must use **`move ||`** to transfer ownership of any external variables into the thread, preventing dangerous dangling pointers if the main thread exits early.
