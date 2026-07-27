# `while`

> **Level 2 — Control Flow & Data Structures**
> A conditional loop that runs while a predicate is true.

---

## 1. Prerequisites

- [`loop`](../level_02/loop.md) — The unconditional loop that runs forever.
- [`if` / `else`](../level_02/if_else.md) — The branching logic that evaluates a true/false condition (which `while` also does).

---

## 2. Term Category

**Rust-nonspecific**: The `while` loop is a fundamental construct found in almost every programming language (C, Java, Python, JavaScript) to repeat code based on a condition.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The [`loop`](../level_02/loop.md) keyword is fantastic for infinite processes, but very often, you want a loop to stop naturally when a specific condition is no longer met. 

You *could* achieve this by writing a `loop`, putting an `if` statement at the very top, and calling `break` if the condition is false. However, doing this every time is verbose and clunky. 

The **`while` loop** was designed as a cleaner alternative. It combines a loop and a condition into a single, elegant line of code. It checks a true/false condition (a predicate) *before* every iteration. If it's true, it runs the block. If it's false, it skips the block and moves on to the rest of the program. 

### (2) Reality Metaphor

A `while` loop is like **filling up your car's gas tank**.

You squeeze the pump handle (execute the loop body) *while* the tank is not full. The moment the sensor detects that the tank is full (the condition becomes `false`), the pump automatically stops, and you move on with your day.

### (3) Rust Code Examples

#### Short Snippet
```rust
let mut countdown = 3;

// The loop runs as long as countdown is greater than 0.
// Notice there are no parentheses around the condition!
while countdown > 0 {
    println!("{}...", countdown);
    countdown -= 1; // Don't forget to change the condition variable!
}
println!("Liftoff!");
```

#### Fuller Example
```rust
fn main() {
    let mut player_health = 100;
    let mut monsters_defeated = 0;
    
    // A classic game loop scenario
    while player_health > 0 {
        // Simulate taking damage
        player_health -= 25;
        monsters_defeated += 1;
        
        println!("Fought a monster! Health is now {}", player_health);
        
        // We can still use `break` inside a while loop if an emergency happens
        if monsters_defeated == 3 {
            println!("You found the exit and escaped early!");
            break; 
        }
    }
    
    println!("Adventure over. You defeated {} monsters.", monsters_defeated);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding While Scoping and Lifecycle Rules

**The mistake:** Assuming While instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("while_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("while_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating While State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with While through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to While Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe While instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Fix the Infinite Loop

**Problem:** The code below is meant to drain a pool's water level down to zero. However, it currently runs forever. Fix the code so the loop correctly terminates.

```rust
fn main() {
    let mut water_level = 50;
    
    while water_level > 0 {
        println!("Draining... Level is {}", water_level);
        
        // TODO: Add a line here to decrease the water_level by 10 each time.
    }
    
    println!("The pool is empty!");
}
```

**Expected output:**
```text
Draining... Level is 50
Draining... Level is 40
...
Draining... Level is 10
The pool is empty!
```

> [!check]- Answer
> - Add `water_level -= 10;` inside the loop block.
> - This ensures the condition `water_level > 0` eventually becomes false.

---

### Exercise 2: Countdown Loop with Condition

**Problem:** Count down from `5` to `1` using a `while` loop.

**Expected output:**
```
5 4 3 2 1 
```

> [!check]- Answer
> ```rust
> fn main() {
>     let mut count = 5;
>     while count > 0 {
>         print!("{} ", count);
>         count -= 1;
>     }
>     println!();
> }
> ```
>
> **Explanation:** `while` evaluates its boolean condition before every iteration.

### Exercise 3: Processing Items with While Condition

**Problem:** Process elements in `mut vec = vec![1, 2, 3]` using `while !vec.is_empty() { println!("{}", vec.pop().unwrap()); }`.

**Expected output:**
```
3
2
1
```

> [!check]- Answer
> ```rust
> fn main() {
>     let mut v = vec![1, 2, 3];
>     while !v.is_empty() {
>         println!("{}", v.pop().unwrap());
>     }
> }
> ```
>
> **Explanation:** `while !container.is_empty()` iterates until collection contents are drained.

---

## 6. Related Terms

- [`loop`](../level_02/loop.md) — The unconditional loop. If you find yourself writing `while true`, replace it with `loop`.
- [`for` / Range](../level_02/for_range.md) — The preferred loop for going through arrays or counting through a range of numbers.

---

## 7. Key Takeaways

- `while` runs a block of code repeatedly as long as its condition evaluates to `true`.
- The condition is checked at the *very beginning* of every iteration.
- You **do not** use parentheses around the condition.
- You must remember to manually mutate the condition variable inside the loop, otherwise, it will run forever.
- Unlike `loop`, a `while` loop **cannot** return a value via `break`.
