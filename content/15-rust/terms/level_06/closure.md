# Closure

> **Level 6 — Closures & Functional Patterns**
> An anonymous function that captures variables from its enclosing scope.

---

## 1. Prerequisites

- [Functions (`fn`)](../level_01/fn.md) — The standard, named functions that closures provide a lightweight alternative to.
- [Borrowing (`&`)](../level_03/borrowing.md) — The mechanism closures use behind the scenes to read variables from their environment.
- [Ownership](../level_03/ownership.md) — The rules that closures must still strictly obey.

---

## 2. Term Category

**Rust-specific (the inline function)**: A closure is essentially an anonymous function that you define "inline" (right in the middle of another function). The key difference between a standard `fn` and a Closure is that Closures can "capture" variables from the environment they were created in.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Sometimes you need to pass a tiny piece of logic into another function. For example, sorting a list of numbers: `vec.sort_by(...)`. If you had to define a full, named `fn` somewhere else in the file just to tell Rust how to sort the vector, your code would quickly become bloated and hard to read. Closures let you define that logic inline, right exactly where it is used.

Furthermore, standard functions are completely isolated. If your sorting logic needed to know the user's `current_location`, a standard `fn` couldn't access that variable unless you explicitly passed it in as an argument. A Closure, however, can magically "capture" `current_location` from the surrounding code and use it directly.

### (2) Reality Metaphor

Imagine a **standard Function (`fn`)** as a Freelance Contractor. They show up, you hand them exactly the tools they need (Arguments), they do the job, and they leave. They know nothing else about your company.

A **Closure** is like hiring an In-House Employee. They work right inside your office. They don't just use the tools you explicitly hand them; they can reach over and grab the stapler right off your desk (capturing the environment).

### (3) Rust Code Examples

#### Short Snippet (Syntax Comparison)
Closures use vertical pipes `|args|` instead of parentheses `(args)` for their arguments. They often omit curly braces `{}` if the logic is just a single line.

```rust
// 1. A standard function
fn add_one_fn(x: i32) -> i32 {
    x + 1
}

fn main() {
    // 2. A Closure doing the exact same thing! 
    // Notice we don't even need to declare the types (i32), 
    // the compiler usually infers them for closures automatically!
    let add_one_closure = |x| x + 1;
    
    println!("Function: {}", add_one_fn(5));
    println!("Closure: {}", add_one_closure(5));
}
```

#### Fuller Example (Capturing the Environment)
This is the true superpower of closures. The closure uses a variable (`threshold`) that was not passed into it as an argument!

```rust
fn main() {
    // A variable sitting in the main function's scope.
    let threshold = 10; 

    // We define a closure inline. 
    // Notice it reaches out and grabs `threshold` from the environment!
    let is_above_threshold = |number| number > threshold;

    let test_value = 15;
    
    if is_above_threshold(test_value) {
        println!("It passed!");
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Closure Scoping and Lifecycle Rules

**The mistake:** Assuming Closure instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("closure_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("closure_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Closure State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Closure through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Closure Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Closure instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Inline Conversion

**Problem:** Convert the standard `multiply` function below into a closure assigned to a variable named `multiplier`.

```rust
fn multiply(a: i32, b: i32) -> i32 {
    a * b
}

fn main() {
    // TODO: Write a closure that does the exact same thing as `multiply`
    // let multiplier = ...
    
    // println!("{}", multiplier(5, 10)); // Should print 50
}
```

> [!check]- Answer
> ```rust
> fn main() {
>     // We use |pipes| for arguments. Type inference usually handles the rest!
>     let multiplier = |a, b| a * b;
>     
>     println!("{}", multiplier(5, 10));
> }
> ```

---

### Exercise 2: Capturing Environment Variables by Reference

**Problem:** Write a closure capturing `factor = 3` by reference to multiply input numbers.

**Expected output:**
> [!check]- Answer
> ```
> Result: 15
> ```
> ```rust
> fn main() {
>     let factor = 3;
>     let mult = |x: i32| x * factor;
>     println!("Result: {}", mult(5));
> }
> ```
>
> **Explanation:** Closures automatically infer environment variable capture modes (`&`, `&mut`, or move) based on body usage.

---

### Exercise 3: Mutable Closure State

**Problem:** Create a `mut` closure `let mut accumulator = || ...` incrementing a local total count.

**Expected output:**
> [!check]- Answer
> ```
> Total: 3
> ```
> fn main() {
>     let mut count = 0;
>     let mut inc = || count += 1;
>     inc(); inc(); inc();
>     println!("Total: {}", count);
> }
> ```
>
> **Explanation:** Closures modifying captured environment variables implement `FnMut` and require `mut` bindings.

---

## 6. Related Terms

- [`Fn` / `FnMut` / `FnOnce`](../level_06/fn_traits.md) — The behind-the-scenes traits that actually define exactly *how* a closure captures its environment (by immutable reference, by mutable reference, or by consuming ownership).
- [`move` Closure](../level_06/move_closure.md) — A keyword you add to force a closure to take full Ownership of the environment variables instead of just borrowing them.

---

## 7. Key Takeaways

- Closures are anonymous functions defined using **`|args| body`** syntax.
- They are primarily used for short, inline operations (like defining sorting logic or filtering iterators).
- Unlike standard functions, closures can **"capture"** variables from their surrounding scope without you having to pass them in as arguments.
- Capturing variables is still governed strictly by the Borrow Checker. The closure secretly borrows (`&` or `&mut`) the data it needs!
