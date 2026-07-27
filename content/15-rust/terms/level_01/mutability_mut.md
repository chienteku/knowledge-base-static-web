# Mutability (`mut`)

> **Level 1 — Foundations**
> Opt-in mutability; `let mut x = 5;` allows reassignment.

---

## 1. Prerequisites

- [Variable](../level_01/variable.md) — A named binding in memory; immutable by default in Rust.

---

## 2. Term Category

**Rust-specific**: While mutability exists in all languages, Rust's strict "opt-in" mutability by default is a core language design choice for safety and concurrency.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In many legacy programming languages (like C, C++, or Python), variables are mutable by default. You can change their values anytime, anywhere. However, as programs grow larger, this leads to a massive problem: it becomes incredibly difficult to track *who* changed a variable and *when*. This accidental mutation is a leading cause of logic bugs and devastating data races in multi-threaded applications.

When designing Rust, we wanted to flip the default. We decided that variables should be **immutable** by default. If a developer intends for a value to change over time, they must explicitly signal that intent to both the compiler and future readers of the code by using the `mut` keyword. This single decision eliminates entire classes of bugs because you can confidently pass a variable around knowing it won't be secretly modified behind your back, unless it explicitly says `mut`.

### (2) Reality Metaphor

Think of a standard variable as a **printed poster** hanging on a wall. Once it is printed and framed, you cannot change the text on it. It is permanent and safe to show to everyone exactly as it is.

Adding `mut` is like replacing that poster with a **whiteboard and a marker**. By explicitly installing a whiteboard, you are announcing to everyone in the room: *"Expect the information here to change."*

### (3) Rust Code Examples

#### Short Snippet
```rust
// We explicitly opt-in to mutability using the `mut` keyword.
let mut counter = 0;
counter = 1; // This reassignment is now perfectly legal.
```

#### Fuller Example
```rust
fn main() {
    // A player's score will change as they play the game, so it must be mutable.
    let mut score = 0;
    println!("Starting score: {}", score);
    
    // The player collects a coin. We update the score.
    score = score + 10;
    println!("Collected a coin! Score is now: {}", score);
    
    // The player defeats an enemy. We update it again.
    // We can also use shorthand assignment operators like `+=`.
    score += 50;
    println!("Defeated an enemy! Score is now: {}", score);
    
    // The maximum possible score won't change during this run, 
    // so we deliberately do NOT use `mut` here.
    let max_score = 999;
    println!("You need {} more points to max out!", max_score - score);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting `mut` when trying to change a variable

**The mistake:** Attempting to reassign or modify a variable without having declared it with the `mut` keyword.

**Why it's wrong:** Rust will strictly block any reassignment to a standard `let` binding. The compiler will give you a helpful error: `cannot assign twice to immutable variable`.

*Incorrect:*
```rust
let player_name = "Guest";
player_name = "Alice"; // ERROR: player_name is not mutable
```

*Fix:*
```rust
let mut player_name = "Guest";
player_name = "Alice";
```

### Mistake 2: Making a variable mutable when it doesn't need to be

**The mistake:** Declaring a variable as `mut` but never actually changing its value in the code.

**Why it's wrong:** While it will compile, it defeats the purpose of Rust's safety guarantees and misleads other developers reading your code into thinking the value will change. The Rust compiler (and Clippy) will actually generate a warning telling you that the variable does not need to be mutable.

*Incorrect:*
```rust
let mut starting_lives = 3;
println!("You start with {} lives", starting_lives);
// Notice we never actually change `starting_lives` after this point.
```

*Fix:*
```rust
let starting_lives = 3; // Remove `mut` to silence the compiler warning and clarify intent.
println!("You start with {} lives", starting_lives);
```

---

### Mistake 3: Concurrent Access to Mutability Mut Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Mutability Mut instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Level Up

**Problem:** The following code will not compile. Fix the code so that the player's level increases successfully.

```rust
fn main() {
    let level = 1;
    level += 1;
    println!("Congratulations! You are now level {}", level);
}
```

**Expected output:**
```text
Congratulations! You are now level 2
```

> [!check]- Answer
> - You are trying to modify `level` on line 3.
> - To modify a variable, it must be declared with explicit mutability on line 2.
> - Add the `mut` keyword between `let` and `level`.

---

### Exercise 2: Shadowing vs Mutation

**Problem:** Contrast mutability with shadowing by taking an immutable integer `let x = 5;`, re-binding it with `let x = x + 10;`, and explaining why this compiles without `mut`.

**Expected output:**
```
15
```

> [!check]- Answer
> ```rust
> fn main() {
>     let x = 5;
>     let x = x + 10;
>     println!("{}", x);
> }
> ```
>
> **Explanation:** `let x = ...` creates an entirely new variable binding that shadows the previous `x`. No mutation of the original memory location took place.

### Exercise 3: Mutable References in Functions

**Problem:** Write a function `increment(num: &mut i32)` that adds `1` to the dereferenced integer value in-place.

**Expected output:**
```
11
```

> [!check]- Answer
> ```rust
> fn increment(num: &mut i32) {
>     *num += 1;
> }
> fn main() {
>     let mut val = 10;
>     increment(&mut val);
>     println!("{}", val);
> }
> ```
>
> **Explanation:** Passing `&mut val` grants exclusive access to modify the value stored at `val` via dereferencing `*num`.

---

## 6. Related Terms

- [Variable](../level_01/variable.md) — The standard immutable binding that `mut` alters.
- [Shadowing](../level_01/shadowing.md) — An alternative to mutability where you declare a completely new variable with the same name.
- [Constants (`const`)](../level_01/constants_const.md) — Values that can *never* be made mutable and are evaluated at compile time.

---

## 7. Key Takeaways

- Mutability in Rust is **opt-in**. You must explicitly use the `mut` keyword (e.g., `let mut x = 5;`).
- Explicit mutability signals clear intent to other developers and prevents accidental modification bugs.
- If you declare a variable as `mut` but never change it, the Rust compiler will issue a helpful warning to remove the `mut` keyword.
