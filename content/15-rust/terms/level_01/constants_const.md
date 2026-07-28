# Constants (`const`)

> **Level 1 — Foundations**
> Compile-time constants that must have an explicit type and are always immutable.

---

## 1. Prerequisites

- [Variable](../level_01/variable.md) — Regular bindings that are evaluated at runtime.
- [Type Annotation](../level_01/type_annotation.md) — The syntax required to define the type, which is mandatory for constants.

---

## 2. Term Category

**Rust-nonspecific**: Constants exist in almost all programming languages (like `final` in Java, or `const` in JavaScript/C++) to represent values that never change.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

While variables (`let`) are immutable by default in Rust, they are still evaluated at *runtime*. This means the computer allocates memory for them while the program is actively running. 

Sometimes, you have a value that will absolutely *never* change and is known before the program even runs (like the speed of light, the maximum number of players in a game, or the number of hours in a day). For these, Rust provides the `const` keyword. 

When you use `const`, the compiler doesn't wait until runtime to allocate memory. Instead, it takes the value and literally copies and pastes it everywhere you used that constant in the code while it is building the executable. This makes `const` incredibly fast and efficient. Because of this, constants can be declared in the global scope (outside of any function), making them accessible from anywhere in your code.

### (2) Reality Metaphor

Think of a regular variable (`let`) as a **post-it note** on your desk. You write on it when you sit down to work (runtime), and you can throw it away when you are done.

A `const` is like the **rules permanently printed on the back of a board game box** (e.g., "MAX PLAYERS: 4"). It was decided at the factory (compile-time) before you ever opened the box. It is printed in permanent ink, it applies to the entire game, and you absolutely cannot erase or change it while playing.

### (3) Rust Code Examples

#### Short Snippet
```rust
// Constants MUST have a type annotation.
// By convention, they are named in SCREAMING_SNAKE_CASE.
const MAX_SPEED: u32 = 120;
```

#### Fuller Example
```rust
// Constants can be declared in the global scope, outside of any function.
const SECONDS_IN_MINUTE: u32 = 60;
const MINUTES_IN_HOUR: u32 = 60;

// You can use basic math to define a constant, 
// as long as the math can be calculated at compile-time.
const SECONDS_IN_HOUR: u32 = SECONDS_IN_MINUTE * MINUTES_IN_HOUR;

fn main() {
    let hours_worked = 5;
    
    // We can use the global constant down here inside the function.
    let seconds_worked = hours_worked * SECONDS_IN_HOUR;
    
    println!("You worked for {} seconds.", seconds_worked);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Attempting Runtime Computation in `const` Initializers

**The mistake:** Initializing a `const` value using a non-const function call like `const TIME: u64 = SystemTime::now()...`.

**Why it's wrong:** `const` values must be fully evaluated at compile time. Non-const function calls are evaluated at runtime.

*Incorrect:*
```rust
// const NOW: u64 = get_current_timestamp(); // ❌ Non-const function call
```

*Fix:*
```rust
const TIMEOUT_SECS: u64 = 30; // Evaluated at compile time
```

### Mistake 2: Confusing `const` with `let` Immutability

**The mistake:** Omitting explicit type annotations on `const` declarations (`const MAX = 100;`).

**Why it's wrong:** Unlike `let`, `const` declarations MANDATE explicit type annotations.

*Incorrect:*
```rust
// const MAX = 100; // ❌ Missing type annotation
```

*Fix:*
```rust
const MAX: i32 = 100; // Explicit type required
```

### Mistake 3: Expecting `const` Memory Location Equivalence

**The mistake:** Taking references to `const` items expecting them to point to a single global memory address.

**Why it's wrong:** `const` values are inlined into every location where they are referenced, creating independent copies at each site.

*Incorrect:*
```rust
const FOO: String = String::new(); // ❌ Cannot allocate heap string in const
```

*Fix:*
```rust
const FOO: &str = "static text"; // Inlined static string slice
```

## 5. Practice Exercises

### Exercise 1: Fix the Constant

**Problem:** The following constant declaration is broken. Fix it by making the name follow Rust conventions and adding the required type annotation (`i32`).

```rust
// TODO: Fix this declaration
const max_health = 100;

fn main() {
    println!("Max health is {}", MAX_HEALTH);
}
```

**Expected output:**
> [!check]- Answer
> ```text
> Max health is 100
> ```
> - Change `max_health` to `MAX_HEALTH` (SCREAMING_SNAKE_CASE).
> - Add `: i32` right after the name to satisfy the type annotation requirement.
> - The final declaration should be `const MAX_HEALTH: i32 = 100;`.

---

### Exercise 2: Compile-Time Constant Computation

**Problem:** Define a `const` for `SECONDS_IN_DAY` computed from `const SECONDS_IN_MINUTE: u32 = 60`, `MINUTES_IN_HOUR = 60`, and `HOURS_IN_DAY = 24`. Print the result.

**Expected output:**
> [!check]- Answer
> ```
> 86400
> ```
> ```rust
> const SECONDS_IN_MINUTE: u32 = 60;
> const MINUTES_IN_HOUR: u32 = 60;
> const HOURS_IN_DAY: u32 = 24;
> const SECONDS_IN_DAY: u32 = SECONDS_IN_MINUTE * MINUTES_IN_HOUR * HOURS_IN_DAY;
>
> fn main() {
>     println!("{}", SECONDS_IN_DAY);
> }
> ```
>
> **Explanation:** Rust constants support arbitrary compile-time arithmetic operations between existing constants.

---

### Exercise 3: Const Function Implementation

**Problem:** Write a `const fn square(x: u32) -> u32` and use it to initialize a constant `SQUARE_TEN`. Print `SQUARE_TEN` from `main()`.

**Expected output:**
> [!check]- Answer
> ```
> 100
> ```
> ```rust
> const fn square(x: u32) -> u32 {
>     x * x
> }
>
> const SQUARE_TEN: u32 = square(10);
>
> fn main() {
>     println!("{}", SQUARE_TEN);
> }
> ```
>
> **Explanation:** Marking a function as `const fn` enables the Rust compiler to execute it during compilation to compute constant values.

---

## 6. Related Terms

- [Variable](../level_01/variable.md) — A binding evaluated at runtime (which can be mutable or shadowed, unlike a constant).
- [Static (`static`)](../level_01/static_static.md) — Another way to define a global value, but it represents a specific, single location in memory rather than being "pasted" everywhere like `const`.
- [Type Annotation](../level_01/type_annotation.md) — The manual typing syntax that `const` strictly requires.

---

## 7. Key Takeaways

- Constants are declared with the `const` keyword.
- They must **always** have an explicit type annotation (e.g., `: u32`).
- By convention, constant names are written in `SCREAMING_SNAKE_CASE`.
- Their values must be known at compile-time (you cannot use runtime functions to calculate them).
- They can be declared in any scope, including the global scope outside of `main()`.
