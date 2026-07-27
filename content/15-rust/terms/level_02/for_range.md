# `for` / Range

> **Level 2 — Control Flow & Data Structures**
> Iteration over a range (`0..10`) or any iterator. The most idiomatic loop in Rust.

---

## 1. Prerequisites

- [`while`](../level_02/while.md) — The conditional loop, which the `for` loop is designed to replace in 90% of use cases.
- [Variable](../level_01/variable.md) — The `for` loop automatically binds the current item to a variable for you.

---

## 2. Term Category

**Rust-specific**: While `for` loops exist everywhere, Rust completely removes the traditional, error-prone C-style loop (`for (int i=0; i<10; i++)`) in favor of exclusively using safe, iterator-based `for ... in` loops.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The traditional C-style `for` loop requires you to manually manage a counter, a condition, and a step size. It is infamous in programming history for causing **"off-by-one" errors**. If you type `<` instead of `<=`, or `i++` instead of `i--`, your program might skip data, run forever, or crash by trying to access data outside the bounds of an array.

Rust's designers banned the traditional C-style `for` loop entirely. 

Instead, Rust uses an **iterator-based `for` loop**. You simply provide a collection (like a list) or a mathematical **Range** (like `1..5`), and the `for` loop automatically handles everything. It pulls out the items one by one until the collection is empty. This completely eliminates off-by-one errors and guarantees you will never accidentally access out-of-bounds memory. Because of this safety, the `for` loop is the most idiomatic and frequently used loop in Rust.

### (2) Reality Metaphor

A traditional `while` loop or C-style `for` loop is like **dealing cards by counting in your head**: *"Okay, I've dealt 1, 2, 3... wait, was the limit 52 or 51? Did I start counting at 0 or 1?"* You might easily deal too many or too few. 

A Rust `for` loop is like **dealing cards until your hand is empty**. You don't need to count, and you don't need to know the limit. You just say, *"For every card in this deck, put it on the table."* The physical structure of the deck guarantees you won't make a counting mistake.

### (3) Rust Code Examples

#### Short Snippet
```rust
// A "Range" is created using the `..` syntax.
// This will print 1, 2, and 3. (Ranges are exclusive of the upper bound).
for number in 1..4 {
    println!("{}", number);
}
```

#### Fuller Example
```rust
fn main() {
    let countdown = [3, 2, 1]; // An array of numbers
    
    // We can loop directly over the array. 
    // `number` is automatically created as a variable for the current item.
    for number in countdown {
        println!("{}...", number);
    }
    println!("Liftoff!");
    
    // If you need the upper bound to be INCLUDED, use `..=`
    // This will print 10, 20, 30, 40, 50
    for percentage in 1..=5 {
        println!("Loading: {}%", percentage * 10);
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding For Range Scoping and Lifecycle Rules

**The mistake:** Assuming For Range instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("for_range_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("for_range_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating For Range State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with For Range through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to For Range Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe For Range instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Inclusive Range

**Problem:** The code below is supposed to print the numbers 1, 2, 3, 4, and 5. However, it currently stops at 4. Fix the range syntax so that it includes the number 5.

```rust
fn main() {
    // TODO: Fix the range syntax below
    for i in 1..5 {
        println!("Step {}", i);
    }
}
```

**Expected output:**
```text
Step 1
Step 2
Step 3
Step 4
Step 5
```

> [!check]- Answer
> - The `..` syntax is exclusive.
> - Change `1..5` to `1..=5` to make it inclusive.

---

### Exercise 2: Inclusive Range Summation

**Problem:** Calculate the sum of numbers from `1` to `100` inclusive using a `for` loop with range syntax `1..=100`.

**Expected output:**
```
5050
```

> [!check]- Answer
> ```rust
> fn main() {
>     let mut sum = 0;
>     for i in 1..=100 {
>         sum += i;
>     }
>     println!("{}", sum);
> }
> ```
>
> **Explanation:** `1..=100` constructs an inclusive range `RangeInclusive` hitting both end points.

### Exercise 3: Reverse Range Iteration

**Problem:** Count down from `5` to `1` using `(1..=5).rev()` and print `"Liftoff!"` at the end.

**Expected output:**
```
5
4
3
2
1
Liftoff!
```

> [!check]- Answer
> ```rust
> fn main() {
>     for i in (1..=5).rev() {
>         println!("{}", i);
>     }
>     println!("Liftoff!");
> }
> ```
>
> **Explanation:** Calling `.rev()` on a double-ended range reverses iteration direction.

---

## 6. Related Terms

- [Iterator](../level_02/iterator.md) — The underlying mechanic that powers the `in` part of a `for` loop (how it knows how to get the "next" item).
- [`while`](../level_02/while.md) — The conditional loop, which is much more prone to off-by-one errors than `for`.

---

## 7. Key Takeaways

- Rust does not have C-style `for` loops (e.g., `for(i=0; i<10; i++)`).
- The syntax is always `for item in collection_or_range { ... }`.
- The standard Range syntax `start..end` is **exclusive** of the end value (e.g., `1..4` produces 1, 2, 3).
- Use `start..=end` for an **inclusive** range (e.g., `1..=3` produces 1, 2, 3).
- The `for` loop is the safest and most idiomatic way to loop through arrays or numbers in Rust because it prevents out-of-bounds errors.
