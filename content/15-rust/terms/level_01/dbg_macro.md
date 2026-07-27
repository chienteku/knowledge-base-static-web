# `dbg!` Macro

> **Level 1 — Foundations**
> Prints an expression's file, line, and value to stderr, and returns the value unchanged — the idiomatic print-debugging tool.

---

## 1. Prerequisites

- [`println!` / `format!`](../level_01/println_format.md) — The output-formatting macro `dbg!` builds on.
- [Expressions](../level_01/expressions.md) — `dbg!` wraps an expression and evaluates to it.
- [Macros](../level_01/macros.md) — The general mechanism.

---

## 2. Term Category

**Debugging Macro (the transparent inspector)**: `dbg!` exists to answer "what is this value, right here, right now?" without disturbing the surrounding code's structure or return value. Unlike `println!`, it requires no manual formatting string, prints to `stderr` (not `stdout`), and — critically — **evaluates to the value it was given**, so it can be dropped directly into an expression without restructuring anything.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The standard way to inspect a value mid-computation is `println!("{:?}", some_expr);` — but this requires introducing a temporary variable if `some_expr` is embedded inside a larger expression, and it doesn't tell you *where* in the source the print came from once you have several of them scattered around. `dbg!` solves both problems at once: it automatically prints the file name, line number, the exact source text of the expression, and its debug-formatted value — and then hands the value right back to you, so `dbg!(x + 1)` behaves exactly like `x + 1` in every way except for the side-effect of printing. This means you can wrap *any* sub-expression, anywhere, without rewriting the surrounding code.

### (2) Reality Metaphor

Imagine a factory conveyor belt with a package moving through several processing stations.

- **Using `println!`**: To check a package's contents mid-belt, you have to stop the belt, physically remove the package, open it, note its contents, then put it back and restart the belt — an interruption to the process.
- **Using `dbg!`**: You install a transparent X-ray scanner window directly over one segment of the belt. The package glides through it, is instantly recorded and labeled (with the scanner's exact location and a snapshot of the contents) on a printout, and continues moving without ever leaving the belt or being touched.

### (3) Rust Code Examples

#### Short Snippet (Inline, No Restructuring Needed)
```rust
fn main() {
    let x = 5;
    // dbg!() prints to stderr AND returns the value, so `y` still gets `x * 2`.
    let y = dbg!(x * 2) + 1;
    println!("y = {y}");
}
// stderr: [src/main.rs:4:13] x * 2 = 10
// stdout: y = 11
```

#### Fuller Example (Debugging a Chain Without Breaking It)
```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];

    // Insert dbg! in the MIDDLE of a chain to inspect an intermediate state,
    // without needing to split the chain into separate `let` statements.
    let sum: i32 = numbers
        .iter()
        .map(|n| n * n)
        .filter(|n| dbg!(*n) > 5) // Prints every squared value as it's tested.
        .sum();

    println!("sum = {sum}");
}
// stderr shows each candidate value as the filter runs:
// [src/main.rs:9:29] *n = 1
// [src/main.rs:9:29] *n = 4
// [src/main.rs:9:29] *n = 9
// [src/main.rs:9:29] *n = 16
// [src/main.rs:9:29] *n = 25
// stdout: sum = 50
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Dbg Macro Scoping and Lifecycle Rules

**The mistake:** Assuming Dbg Macro instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("dbg_macro_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("dbg_macro_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Dbg Macro State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Dbg Macro through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Dbg Macro Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Dbg Macro instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Predict the Return Type

**Problem:** What is the type of `y` in `let y = dbg!(vec![1, 2, 3]);`, and does calling `dbg!` change it?

> [!check]- Answer
> `y` is still **`Vec<i32>`** — exactly the same type (and value) as if `dbg!(...)` weren't there at all. `dbg!` only requires its argument to implement `Debug` (so it can be printed); it never changes the type or the value, it just prints a side-effect message to `stderr` and passes the value straight through.

---

### Exercise 2: Expression Ownership in `dbg!`

**Problem:** Use `dbg!` inline inside an arithmetic expression to inspect intermediate calculation steps without breaking expression flow: `(a + b) * c` where `a=2`, `b=3`, `c=4`.

**Expected output:**
```
5
20
```

> [!check]- Answer
> ```rust
> fn main() {
>     let a = 2;
>     let b = 3;
>     let c = 4;
>     let result = dbg!(a + b) * c;
>     println!("{}", result);
> }
> ```
>
> **Explanation:** `dbg!` takes ownership of the evaluated expression, prints file:line information along with the result, and returns the ownership of that value back to the enclosing expression.

### Exercise 3: Debugging Non-Copy Move Values

**Problem:** Explain why `dbg!(&my_string)` should be used instead of `dbg!(my_string)` when you need to use `my_string` again afterwards.

**Expected output:**
```
Borrowed debug successfully
```

> [!check]- Answer
> ```rust
> fn main() {
>     let s = String::from("Rust");
>     dbg!(&s); // Pass reference so s is not moved
>     println!("Borrowed debug successfully: {}", s);
> }
> ```
>
> **Explanation:** `dbg!(val)` takes ownership of `val`. For non-`Copy` types like `String`, passing by value moves the string and invalidates the original variable binding. Passing `&s` borrows it safely.

---

---

## 6. Related Terms

- [`println!` / `format!`](../level_01/println_format.md) — The formatting macro family `dbg!` is a debug-focused sibling of.
- [`Debug` Trait](../level_04/debug_trait.md) — Required on any value passed to `dbg!`, since it prints using `{:#?}`-style formatting.
- [Expressions](../level_01/expressions.md) — Why `dbg!` can be embedded anywhere a value is expected.

---

## 7. Key Takeaways

- `dbg!(expr)` prints the file, line, source text, and `Debug`-formatted value of `expr` to **stderr**, then returns `expr` unchanged.
- Because it evaluates to its argument, it can be dropped into the middle of any expression or method chain without restructuring code.
- It's a development-time tool — remove `dbg!` calls before committing, the same way you would a temporary breakpoint.
- Requires the value to implement `Debug`, just like `{:?}` formatting.
