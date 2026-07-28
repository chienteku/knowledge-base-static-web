# Pattern Matching

> **Level 2 — Control Flow & Data Structures**
> Destructuring values in `match`, `if let`, `let`, and function parameters.

---

## 1. Prerequisites

- [`match`](../level_02/match.md) — The most common and powerful place pattern matching is used.
- [`if let` / `while let`](../level_02/if_let_while_let.md) — Uses pattern matching to check for a single specific shape of data.
- [Compound Types](../level_01/compound_types.md) — Tuples and arrays, which are frequently pulled apart using patterns.

---

## 2. Term Category

**Rust-specific (the ubiquity of it)**: While functional languages like Haskell have had pattern matching for decades, Rust brings it to the mainstream and bakes it deeply into the language. In Rust, pattern matching isn't just for `match` blocks—it is the underlying mechanic behind how `let` statements and function parameters work!

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In programming, you often receive complex data structures (like a Tuple, an Array, or an Enum) and you only care about the data *inside* them. 

In older languages, extracting this data is tedious. You have to write multiple lines of code like `let x = point.0; let y = point.1;`. 

Rust solves this with **Pattern Matching**, a concept that allows you to specify the "shape" (the pattern) of the data you expect. If the incoming data matches that shape, Rust will instantly "destructure" it, pulling out the inner values and binding them to variables in a single, elegant step. 

Because this is so powerful, Rust's designers made it universal. When you write `let x = 5;`, you aren't just assigning a variable; you are actually matching the pattern `x` against the value `5`!

### (2) Reality Metaphor

Imagine receiving a beautifully wrapped gift basket containing a bottle of wine, a block of cheese, and some crackers. 

Without pattern matching, you have to unpack the basket manually: *"Take out item 1. Take out item 2..."*

**Pattern Matching** is like throwing a magical net over the basket. The net has a specific shape (the "pattern"). If the net fits the shape of the basket perfectly, it instantly extracts the wine, cheese, and crackers directly into your hands (variables) in one smooth motion.

### (3) Rust Code Examples

#### Short Snippet (Destructuring with `let`)
```rust
// We have a tuple representing an RGB color.
let color = (255, 0, 100);

// We use Pattern Matching in a `let` statement to destructure it!
// `r`, `g`, and `b` are instantly created as new variables.
let (r, g, b) = color;

println!("Red: {}, Green: {}, Blue: {}", r, g, b);
```

#### Fuller Example (Patterns in `match`)
```rust
fn main() {
    let dice_roll = (3, 4);

    match dice_roll {
        // Pattern 1: Matches ONLY if both dice are exactly 6 (Snake Eyes... but 6s)
        (6, 6) => println!("Jackpot!"),
        
        // Pattern 2: Matches if the first die is 1. 
        // It binds the second die to the variable `y` so we can use it.
        (1, y) => println!("Rolled a 1 and a {}", y),
        
        // Pattern 3: Matches any two dice, binding them to `x` and `y`.
        // It also uses a "Match Guard" (`if x == y`) to add extra logic!
        (x, y) if x == y => println!("You rolled doubles of {}", x),
        
        // Pattern 4: The Catch-All. We use `_` to ignore the values.
        _ => println!("Just a normal roll."),
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to use a "Refutable" pattern in a `let` statement

**The mistake:** Trying to use `let` to match a pattern that might fail (like checking if an Option is `Some`).

**Why it's wrong:** There are two types of patterns in Rust:
1. **Irrefutable** (Can never fail to match): e.g., `let (x, y) = (1, 2);`
2. **Refutable** (Might fail to match): e.g., matching `Some(x)` against a variable that might be `None`.

A standard `let` statement **must** use an irrefutable pattern, because if it failed, the program wouldn't know what to do. For refutable patterns, you must use `if let` or `match`.

*Incorrect:*
```rust
let config = Some(5);
// ERROR: refutable pattern in local binding: `None` not covered
let Some(x) = config; 
```

*Fix:*
```rust
if let Some(x) = config { ... }
```

### Mistake 2: Mutating Pattern Matching State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Pattern Matching through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Pattern Matching Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Pattern Matching instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Extract the Coordinates

**Problem:** The code below has a tuple representing 3D coordinates. Use a single `let` statement and pattern matching to extract the X, Y, and Z values into variables so the `println!` statement works.

```rust
fn main() {
    let coordinates = (10, 20, 30);
    
    // TODO: Write a single `let` statement here to destructure `coordinates`
    
    println!("X: {}, Y: {}, Z: {}", x, y, z);
}
```

**Expected output:**
> [!check]- Answer
> ```text
> X: 10, Y: 20, Z: 30
> ```
> - Write `let (x, y, z) = coordinates;`

---

### Exercise 2: Destructuring Struct Patterns

**Problem:** Destructure a struct `Point { x, y }` in a match arm: `Point { x: 0, y } => ...`.

**Expected output:**
> [!check]- Answer
> ```
> Y axis: 10
> ```
> ```rust
> struct Point { x: i32, y: i32 }
> fn main() {
>     let p = Point { x: 0, y: 10 };
>     match p {
>         Point { x: 0, y } => println!("Y axis: {}", y),
>         Point { x, y: 0 } => println!("X axis: {}", x),
>         Point { x, y } => println!("{}, {}", x, y),
>     }
> }
> ```
>
> **Explanation:** Struct patterns extract named fields into local bindings during match evaluation.

---

### Exercise 3: @ Binding Patterns

**Problem:** Use `@` pattern binding `n @ 1..=5` to bind and test integer range membership.

**Expected output:**
> [!check]- Answer
> ```
> Matched small number: 3
> ```
> ```rust
> fn main() {
>     let num = 3;
>     match num {
>         n @ 1..=5 => println!("Matched small number: {}", n),
>         _ => println!("Other"),
>     }
> }
> ```
>
> **Explanation:** `@` binds matched values to variable names while simultaneously matching range patterns.

---

## 6. Related Terms

- [`if let`](../level_02/if_let_while_let.md) — Syntactic sugar that relies entirely on refutable pattern matching.
- [Struct](../level_02/struct.md) — You can also use pattern matching to destructure Structs to get their inner fields!

---

## 7. Key Takeaways

- **Pattern Matching** allows you to test the shape of data and instantly extract (destructure) its inner contents.
- It is used almost everywhere: in `match`, `if let`, function parameters, and even basic `let` statements.
- **Irrefutable** patterns always match (like extracting from a Tuple). They are required for `let` statements.
- **Refutable** patterns might fail (like checking if a number is exactly `5`). They require `match` or `if let`.
- You can add `if` conditions to match arms, known as **Match Guards** (e.g., `(x, y) if x == y => ...`).
