# `move` Closure

> **Level 6 — Closures & Functional Patterns**
> Forces the closure to take ownership of captured variables.

---

## 1. Prerequisites

- [Closure](../level_06/closure.md) — The anonymous functions this keyword applies to.
- [Ownership](../level_03/ownership.md) — The core mechanism that the `move` keyword enforces.
- [`Fn` / `FnMut` / `FnOnce`](../level_06/fn_traits.md) — The traits that categorize closures based on what they do with their data.

---

## 2. Term Category

**Rust-specific (the thread safety switch)**: By default, closures try to be very polite. They only borrow data (`&` or `&mut`) from the environment so the original surrounding function can still use that data later. The `move` keyword overrides this politeness. It forces the closure to aggressively steal (take Ownership of) every single variable it touches. 

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Imagine you spawn a background thread using `std::thread::spawn()`. You pass a closure into the thread, and that closure reads a `greeting` string from your main function. 

The compiler instantly panics! Why? 

Because closures default to *borrowing*, the closure only has an `&greeting` reference. But the background thread might run for 10 minutes, while the `main` function might finish executing and destroy the `greeting` string in 2 seconds! The background thread would be left holding a Dangling Reference!

The Rust compiler prevents this catastrophic bug. It demands that the closure takes **full Ownership** of the `greeting` variable. That way, the data physically moves into the thread and stays alive as long as the thread lives. You do this by typing `move ||`.

### (2) Reality Metaphor

Imagine you are packing a backpack for a 5-day hiking trip (a Closure). 

By default, you just take *photos* of your roommate's expensive camping gear (Borrowing). This is polite, but if your roommate sells the gear while you're on the mountain looking at the photo, the gear is gone.

A **`move` closure** is like physically stuffing your roommate's actual tent and sleeping bag into your backpack (Taking Ownership). Your roommate can never use that gear again (the compiler will block them), but you are mathematically guaranteed to have the gear on the mountain, no matter what your roommate does back home.

### (3) Rust Code Examples

#### Short Snippet (Stealing Ownership)
Here is what happens when you add `move`. The closure steals the variable, making it unusable in the original function.

```rust
fn main() {
    let name = String::from("Alice");

    // We add the `move` keyword before the pipes.
    // This forces the closure to TAKE OWNERSHIP of `name`.
    let print_name = move || {
        println!("Hello, {}", name);
    };

    // ERROR! The main function no longer owns `name`! 
    // The closure stole it!
    // println!("Main function says: {}", name); 

    print_name();
}
```

#### Fuller Example (The Thread Spawn)
This is the #1 most common place you will use `move` closures. You cannot send borrowed data to a thread!

```rust
use std::thread;

fn main() {
    let message = String::from("Data from the main thread!");

    // Without `move`, the compiler complains that `message` might not 
    // live long enough. With `move`, the thread safely takes ownership!
    let handle = thread::spawn(move || {
        println!("Background thread says: {}", message);
    });

    // Wait for the thread to finish
    handle.join().unwrap();
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Move Closure Scoping and Lifecycle Rules

**The mistake:** Assuming Move Closure instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("move_closure_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("move_closure_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Move Closure State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Move Closure through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Move Closure Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Move Closure instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Angry Thread

**Problem:** The following code tries to spawn a thread, but the compiler throws an error: `closure may outlive the current function, but it borrows data owned by the current function`. Fix the code!

```rust
use std::thread;

fn main() {
    let items = vec![1, 2, 3];

    // TODO: Fix this closure so the thread takes ownership of `items`!
    thread::spawn(|| {
        println!("Processing {} items...", items.len());
    }).join().unwrap();
}
```

> [!check]- Answer
> ```rust
> use std::thread;
>
> fn main() {
>     let items = vec![1, 2, 3];
>
>     // Just add the `move` keyword!
>     thread::spawn(move || {
>         println!("Processing {} items...", items.len());
>     }).join().unwrap();
> }
> ```

---

### Exercise 2: Moving Variable Ownership into Threads

**Problem:** Move a `String` into a thread closure using `move ||` and print it inside the spawned thread.

**Expected output:**
> [!check]- Answer
> ```
> Thread received: hello
> ```
> ```rust
> use std::thread;
> fn main() {
>     let s = String::from("hello");
>     let handle = thread::spawn(move || {
>         println!("Thread received: {}", s);
>     });
>     handle.join().unwrap();
> }
> ```
>
> **Explanation:** `move` forces closures to take full ownership of all captured variables.

---

### Exercise 3: Moving Copy Types vs Non-Copy Types

**Problem:** Demonstrate that moving a `Copy` integer into a `move ||` closure leaves the original integer accessible in caller scope.

**Expected output:**
> [!check]- Answer
> ```
> Original integer valid: 42
> ```
> ```rust
> fn main() {
>     let x = 42;
>     let c = move || x + 1;
>     println!("Closure: {}", c());
>     println!("Original integer valid: {}", x);
> }
> ```
>
> **Explanation:** Moving `Copy` types into `move` closures copies values on stack, leaving originals intact.

---

## 6. Related Terms

- [`std::thread::spawn`](../level_09/std_thread_spawn.md) — The most common standard library function that strictly requires `move` closures.
- [`Fn` / `FnMut` / `FnOnce`](../level_06/fn_traits.md) — The trait that beginners frequently confuse with `move`.

---

## 7. Key Takeaways

- Closures default to polite borrowing (`&` or `&mut`).
- Adding the `move` keyword before the pipes (`move ||`) forces the closure to take **Ownership** of captured variables.
- It is almost always required when returning a closure from a function or passing a closure to a new thread.
- `move` only changes *how* variables are captured; it does **not** automatically make the closure `FnOnce`!
