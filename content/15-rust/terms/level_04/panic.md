# `panic!`

> **Level 4 — Error Handling & Generics**
> Macro for unrecoverable errors; unwinds the stack (or aborts, if configured).

---

## 1. Prerequisites

- [`Result<T, E>`](../level_02/result_t_e.md) — The tool for *recoverable* errors.
- [`unwrap()` / `expect()`](../level_04/unwrap_expect.md) — The methods that secretly trigger a `panic!` when they fail.
- [Macros](../level_01/macros.md) — Code that writes code; `panic!` is a macro, denoted by the `!`.

---

## 2. Term Category

**Rust-specific (the controlled crash)**: In languages like C or C++, a fatal error (like a "Segmentation Fault") instantly kills the program, often leaving the Operating System in a corrupted state with leaked memory. Rust turns crashes into a safe, meticulously controlled shutdown process.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In programming, there are two fundamental types of errors: 
1. **Recoverable errors:** e.g., A file wasn't found. You handle this gracefully with `Result`.
2. **Unrecoverable errors:** e.g., A massive math bug tried to index the 100th item of a 5-item list, or the server's hard drive was physically corrupted. 

When an unrecoverable error occurs, proceeding is dangerous. Rust needs a way to instantly stop the program, but it also needs to clean up all the memory it allocated along the way. This is the **`panic!` macro**. 

When `panic!` is invoked, it doesn't just instantly kill the CPU process. It enters a controlled shutdown phase called **"Unwinding the Stack"**. It carefully walks backward through every function that was currently running, and executes the `Drop` trait on every single variable to ensure memory and network sockets are safely closed before finally turning the lights out.

### (2) Reality Metaphor

Imagine you are the pilot of a commercial airplane.

A **recoverable error** is a broken coffee machine (`Result::Err`). The flight attendants log the error, apologize to the passengers, and keep flying the plane to the destination.

An **unrecoverable error** is the right engine catching fire. You don't try to "handle" the error and keep flying to Hawaii. You instantly abort the mission (`panic!`). But you don't just magically teleport out of the sky; you execute a careful, controlled emergency landing (**"unwinding the stack"**) to ensure all passengers get off safely before the plane is decommissioned.

### (3) Rust Code Examples

#### Short Snippet (Explicit Panic)
You can manually trigger a panic if your program enters a state that makes no logical sense.
```rust
fn process_payment(amount: i32) {
    if amount < 0 {
        // We manually crash the program. You cannot have a negative payment!
        panic!("CRITICAL: Attempted to process a negative payment: {}", amount);
    }
    println!("Processing ${}...", amount);
}

fn main() {
    process_payment(-50); // The program will crash here!
}
```

#### Fuller Example (Implicit Panic & Backtraces)
Rust will automatically panic to protect you from memory bugs. If you run a panicked program with the `RUST_BACKTRACE=1` environment variable, Rust will print out the exact history of function calls that led to the crash.

```rust
fn get_item(index: usize) {
    let data = vec![10, 20, 30];
    
    // If index is 99, this will implicitly trigger a panic!
    // "index out of bounds: the len is 3 but the index is 99"
    println!("Item: {}", data[index]); 
}

fn main() {
    get_item(99); 
}
```
*Run in terminal:*
`RUST_BACKTRACE=1 cargo run`

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Panic Scoping and Lifecycle Rules

**The mistake:** Assuming Panic instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("panic_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("panic_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Panic State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Panic through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Panic Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Panic instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Panic vs Result

**Problem:** Read the following three scenarios. Decide whether the program should return a `Result::Err` (Recoverable) or trigger a `panic!` (Unrecoverable).

1. A user attempts to upload a profile picture, but the file size is too large.
2. The core configuration file required to boot up the web server is missing.
3. The player inputs their password incorrectly.

> [!check]- Answer
> 1. **`Result`**: Recoverable. You should show an error message on the UI, not crash the app.
> 2. **`panic!`**: Unrecoverable. The server cannot possibly start without its config file. Crash immediately so the developer knows it's broken.
> 3. **`Result`**: Recoverable. Ask them to type it again.

---

### Exercise 2: Custom Panic Messages

**Problem:** Trigger a panic with custom formatted arguments `panic!("Invalid code: {}", 404)` inside `catch_unwind`.

**Expected output:**
> [!check]- Answer
> ```
> Caught panic
> ```
> ```rust
> use std::panic;
> fn main() {
>     let res = panic::catch_unwind(|| {
>         panic!("Invalid code: {}", 404);
>     });
>     if res.is_err() {
>         println!("Caught panic");
>     }
> }
> ```
>
> **Explanation:** `std::panic::catch_unwind` catches unwinding panics at thread boundaries.

---

### Exercise 3: Asserting Pre-conditions with `assert!`

**Problem:** Validate function input using `assert!(val > 0, "Val must be positive")`.

**Expected output:**
> [!check]- Answer
> ```
> Precondition met
> ```
> ```rust
> fn process(val: i32) {
>     assert!(val > 0, "Val must be positive");
>     println!("Precondition met");
> }
> fn main() { process(10); }
> ```
>
> **Explanation:** `assert!` evaluates boolean expressions and panics if conditions evaluate to `false`.

---

## 6. Related Terms

- [`unwrap()` / `expect()`](../level_04/unwrap_expect.md) — The methods that actively choose to trigger a `panic!` if a `Result` is an error.
- [`Drop` Trait](../level_03/drop_trait.md) — The cleanup method that is rapidly executed as the stack unwinds during a panic.

---

## 7. Key Takeaways

- `panic!` is a macro used for **unrecoverable errors** where the program cannot safely continue.
- It triggers a controlled shutdown called **"unwinding the stack"**, which executes the `Drop` trait on all active variables to safely free memory.
- You can manually call it using `panic!("message")`.
- It is implicitly called by memory-safety protections, like array out-of-bounds indexing, `.unwrap()`, or division by zero.
- You can view the exact sequence of function calls that led to the crash by running the program with the `RUST_BACKTRACE=1` environment variable.
