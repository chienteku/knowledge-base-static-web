# `loop`

> **Level 2 — Control Flow & Data Structures**
> An infinite loop; exit with `break` (which can return a value).

---

## 1. Prerequisites

- [`if` / `else`](../level_02/if_else.md) — You almost always need an `if` statement to decide when to stop the loop.
- [Expressions](../level_01/expressions.md) — Understanding how blocks of code can evaluate to a value.

---

## 2. Term Category

**Rust-specific (mostly)**: While many languages use `while(true)` for infinite loops, Rust provides a dedicated `loop` keyword. Furthermore, Rust's `loop` is unique because it is an *expression* that can return a value via the `break` statement.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Infinite loops are incredibly common in programming. A web server runs in an infinite loop listening for requests, a video game runs in an infinite rendering loop, and network requests often need to retry infinitely until they succeed. 

Instead of forcing developers to write the slightly awkward `while true { ... }`, Rust provides the explicit `loop` keyword. This isn't just syntactic sugar—it actually helps the Rust compiler! When the compiler sees `loop`, it knows with 100% certainty that the code inside will run at least once and won't stop until it hits a `break`.

Because Rust loves [Expressions](../level_01/expressions.md), `loop` can also evaluate to a value. If you are looping specifically to calculate a result (like waiting for a user to type a valid number), you can hand that result directly to the `break` keyword. The entire `loop` block will then evaluate to that value, allowing you to assign it cleanly to a `let` variable.

### (2) Reality Metaphor

A `loop` is like **running on a treadmill**. 

Once you press start, you will keep running infinitely. You only stop when a specific condition occurs (e.g., you hit 5 miles, or you get too tired). At that point, you hit the big red `break` button to stop the machine.

Returning a value from a loop is like stepping off the treadmill and immediately handing your final calorie count (the value) to your fitness app (the variable).

### (3) Rust Code Examples

#### Short Snippet
```rust
let mut counter = 0;

loop {
    counter += 1;
    
    if counter == 3 {
        println!("Hit the limit! Stopping.");
        break; // This exits the loop entirely.
    }
}
```

#### Fuller Example
```rust
fn main() {
    let mut retry_count = 0;
    
    // We want to retry a fake network connection until it succeeds.
    // Because `loop` is an expression, we can assign its result to `status`.
    let status = loop {
        retry_count += 1;
        
        if retry_count < 5 {
            println!("Connection failed, retrying...");
            continue; // `continue` skips to the next iteration of the loop.
        }
        
        // When we finally succeed, we pass the "Success" string to `break`.
        // This stops the loop AND returns "Success" to the `status` variable.
        break "Success"; 
    };
    
    // Note the semicolon after the `loop` block! 
    // It is required because this was a `let` statement.
    
    println!("Final connection status: {}", status);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Loop Scoping and Lifecycle Rules

**The mistake:** Assuming Loop instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("loop_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("loop_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Loop State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Loop through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Loop Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Loop instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Break with a Value

**Problem:** The loop below simulates waiting for a temperature sensor to warm up. Currently, it just breaks when it reaches 100 degrees. Modify the code so that the `loop` returns the final `current_temp` value when it breaks, allowing the `let final_temp` assignment to work correctly.

```rust
fn main() {
    let mut current_temp = 50;
    
    let final_temp = loop {
        current_temp += 10;
        
        if current_temp >= 100 {
            // TODO: Modify this break statement to return `current_temp`
            break; 
        }
    };
    
    println!("Sensor warmed up to: {} degrees", final_temp);
}
```

**Expected output:**
```text
Sensor warmed up to: 100 degrees
```

> [!check]- Answer
> - Change `break;` to `break current_temp;`.
> - Now, when the loop breaks, it hands `100` back to be stored in `final_temp`.

---

### Exercise 2: Returning Values from `loop`

**Problem:** Use a `loop` with `counter += 1` that returns `counter * 2` using `break counter * 2;` when `counter == 10`.

**Expected output:**
```
Result: 20
```

> [!check]- Answer
> ```rust
> fn main() {
>     let mut counter = 0;
>     let result = loop {
>         counter += 1;
>         if counter == 10 {
>             break counter * 2;
>         }
>     };
>     println!("Result: {}", result);
> }
> ```
>
> **Explanation:** `break expression;` inside `loop` returns values directly to variable bindings.

### Exercise 3: Loop Labels for Nested Loops

**Problem:** Use a labelled loop `'outer: loop` to break out of nested loops directly when inner condition `x * y == 6` is met.

**Expected output:**
```
Broken out at x=2, y=3
```

> [!check]- Answer
> ```rust
> fn main() {
>     'outer: for x in 1..=5 {
>         for y in 1..=5 {
>             if x * y == 6 {
>                 println!("Broken out at x={}, y={}", x, y);
>                 break 'outer;
>             }
>         }
>     }
> }
> ```
>
> **Explanation:** Loop labels (`'label:`) allow `break` and `continue` to target specific outer loop scopes.

---

## 6. Related Terms

- [`while`](../level_02/while.md) — A loop that runs as long as a specific condition evaluates to true.
- [`for` / Range](../level_02/for_range.md) — An iterator loop (the most common and idiomatic loop in Rust).
- [Expressions](../level_01/expressions.md) — The concept that allows `loop` to return a value.

---

## 7. Key Takeaways

- `loop` creates an infinite loop.
- Use the `break` keyword to exit the loop entirely.
- Use the `continue` keyword to skip the rest of the current iteration and start the next one immediately.
- `loop` can be used as an **expression** to return a value by passing that value to `break` (e.g., `break 42;`).
- Always prefer `loop` over `while true`.
