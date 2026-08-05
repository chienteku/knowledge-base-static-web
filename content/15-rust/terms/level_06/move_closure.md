# `move` Closure

> **Level 6 — Closures & Functional Patterns**
> Forces the closure to take ownership of captured variables.

---

## 1. Prerequisites


- [Closure](closure.md) — The anonymous functions this keyword applies to.
- [Ownership](../level_03/ownership.md) — The core mechanism that the `move` keyword enforces.
- [`Fn` / `FnMut` / `FnOnce`](fn_traits.md) — The traits that categorize closures based on what they do with their data.

---

## 2. Term Category

**Rust Keyword (environment ownership modifier)**: Prefixing a closure expression with the `move` keyword (`move |args| { ... }`) forces the compiler to capture all referenced environment variables by **value** (transferring ownership) into the closure's struct fields, overriding Rust's default behavior of capturing by shared (`&T`) or mutable (`&mut T`) reference.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

By default, closures capture variables politely via references to avoid unnecessarily moving values out of enclosing function scopes.

However, when passing closures to asynchronous tasks (`tokio::spawn`), background OS threads (`thread::spawn`), or returning closures from functions, reference borrowing creates thread-safety and stack lifetime hazards:
- A background thread might execute for 10 minutes, whereas the spawning stack frame drops its local variables after 2 milliseconds.
- Without `move`, the thread closure holds dangling references, violating memory safety.

The **`move`** keyword resolves this by forcing ownership of captured variables to transfer directly into the closure struct.

### (2) Deep Dive — `move` vs `FnOnce` Mechanics

A common point of confusion is assuming `move` automatically makes a closure `FnOnce`:

> [!IMPORTANT]
> **`move` controls capture mode; closure traits control call capability.**
> - `move` forces environment variables to be captured **by value** into closure struct fields.
> - If the closure body only *reads* or *mutates* captured fields without moving them *out* of the closure struct, the `move` closure still implements `Fn` or `FnMut` and can be called repeatedly!

```rust
let text = String::from("hello");

// Captures `text` BY VALUE (move).
// But body only reads `text`, so this closure implements `Fn()` and can be called 100 times!
let print_fn = move || println!("{text}");
print_fn();
print_fn(); // Valid!
```

### (3) Reality Metaphor

- **Default Closure (Shared Photo)**: You take a smartphone photo of your roommate's passport (`&T`). If your roommate leaves the apartment (stack frame drops), your photo is fine, but you don't possess the physical passport.
- **`move` Closure (Packing Physical Passport)**: You physically take your roommate's passport out of their desk and pack it in your suitcase (`move`). Your roommate no longer has the passport in their desk (`use of moved value`), but you are guaranteed to possess it wherever you travel.

### (4) Rust Code Examples

#### Thread Spawning with `move`
```rust
use std::thread;

fn main() {
    let payload = String::from("Background payload data");

    // Must use `move ||` because thread lives for 'static lifetime
    let handle = thread::spawn(move || {
        println!("Thread received: {payload}");
    });

    handle.join().unwrap();
    // println!("{payload}"); // ❌ Error E0382: use of moved value `payload`
}
```

#### Returning Closures from Functions
```rust
fn create_greeter(prefix: String) -> impl Fn(&str) -> String {
    // Must use `move` so `prefix` is moved into the returned closure struct!
    move |name| format!("{prefix}, {name}!")
}

fn main() {
    let greeter = create_greeter("Hello".into());
    assert_eq!(greeter("Alice"), "Hello, Alice!");
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Accessing Non-`Copy` Variables in Outer Scope After `move` Capture

**The mistake:** Attempting to read or pass a variable in enclosing function scope after it has been captured by a `move` closure.

**Why it is wrong:** `move` transfers variable ownership into the closure. Non-`Copy` types are invalidated in outer scope, causing compiler error `E0382`.

*Incorrect:*
```rust
let name = String::from("Alice");
let f = move || println!("{name}");
// println!("{name}"); // ❌ Error E0382: use of moved value `name`
```

*Fix:*
```rust
let name = String::from("Alice");
let f = move || println!("{name}"); // If name is not needed in outer scope
// Or clone `name` before moving into closure if outer access is required:
// let name_clone = name.clone();
```

### Mistake 2: Confusing `move` (Capture Mode) with `FnOnce` (Call Semantics)

**The mistake:** Assuming a `move` closure can only be invoked once.

**Why it is wrong:** If a `move` closure does not consume or move captured fields out of its body on execution, it implements `Fn` or `FnMut` and can be invoked multiple times.

### Mistake 3: Forgetting `move` on Async Tasks / Thread Spawns

**The mistake:** Omitting `move` on closures passed to `thread::spawn` or `tokio::spawn`.

---

## 5. Practice Exercises

### Exercise 1: Multi-Threaded Task Dispatcher

**Scenario:** Build a worker task dispatcher `dispatch_worker(task_id: u64, payload: String)` that spawns a background OS thread taking full ownership of `payload` via a `move` closure and returning thread handle.

**Requirements:**
1. Implement `dispatch_worker(task_id: u64, payload: String) -> std::thread::JoinHandle<usize>`.
2. Compute `payload.len()` in spawned thread.
3. Write unit tests joining thread handle and verifying payload length.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::thread::{self, JoinHandle};
> 
> pub fn dispatch_worker(task_id: u64, payload: String) -> JoinHandle<usize> {
>     thread::spawn(move || {
>         println!("Task {task_id} processing payload of len {}", payload.len());
>         payload.len()
>     })
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_move_thread_dispatcher() {
>         let data = String::from("heavy_computing_job");
>         let handle = dispatch_worker(101, data);
>         let result_len = handle.join().unwrap();
>         
>         assert_eq!(result_len, 19);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `thread::spawn(move || ...)` transfers ownership of `task_id` and `payload` into the thread closure struct.
> 2. Guarantees memory safety across thread lifetimes without dangling references.

---

### Exercise 2: State Factory returning Custom Multiplier (`impl Fn(i32) -> i32`)

**Scenario:** Implement a closure factory `make_multiplier(factor: i32) -> Box<dyn Fn(i32) -> i32>` that captures `factor` by value via `move`.

**Requirements:**
1. Return `Box<dyn Fn(i32) -> i32>`.
2. Capture `factor` using `move`.
3. Write unit tests calling returned closure multiple times.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn make_multiplier(factor: i32) -> Box<dyn Fn(i32) -> i32> {
>     Box::new(move |x| x * factor)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_move_closure_factory() {
>         let double = make_multiplier(2);
>         let triple = make_multiplier(3);
>         
>         assert_eq!(double(5), 10);
>         assert_eq!(double(10), 20); // Move closure can be called repeatedly!
>         assert_eq!(triple(5), 15);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `move |x| x * factor` captures `factor` by value into the closure struct stored on heap.
> 2. Implements `Fn` because `factor` is only read, allowing repeated invocations.

---

### Exercise 3: Demonstrating `Copy` vs Non-`Copy` `move` Behavior

**Scenario:** Implement a function demonstrating that moving `Copy` types into a `move` closure leaves outer variables valid, whereas moving non-`Copy` types invalidates outer variables.

**Requirements:**
1. Define function testing integer vs `String` captures.
2. Write unit tests verifying compiler semantics.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn test_move_semantics() -> (i32, String) {
>     let x = 42; // Copy type
>     let s = String::from("owned_string"); // Non-Copy type
> 
>     let closure = move || {
>         let combined = format!("{s}_{x}");
>         combined
>     };
> 
>     let closure_output = closure();
>     // x is still valid here because i32 is Copy!
>     // s is moved into closure and invalid in outer scope.
>     (x, closure_output)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_copy_vs_non_copy_move() {
>         let (x, out) = test_move_semantics();
>         assert_eq!(x, 42);
>         assert_eq!(out, "owned_string_42");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Moving `Copy` types copies values onto the closure struct, keeping outer variables intact.
> 2. Moving non-`Copy` types invalidates outer variable bindings.

---

## 6. Related Terms


- [`std::thread::spawn`](../level_09/std_thread_spawn.md) — The most common standard library function that strictly requires `move` closures.
- [`Fn` / `FnMut` / `FnOnce`](fn_traits.md) — The trait that beginners frequently confuse with `move`.
- [Closure](closure.md) — Related concept: Closure.

---

## 7. Key Takeaways

- `move` forces closures to capture environment variables **by value** (transferring ownership).
- Required when passing closures to threads (`thread::spawn`) or returning closures from functions.
- `move` modifies **capture mode**, not callable trait bounds (`Fn` vs `FnOnce`).
- `Copy` types are copied into `move` closures; non-`Copy` types are moved and invalidated in outer scope.
