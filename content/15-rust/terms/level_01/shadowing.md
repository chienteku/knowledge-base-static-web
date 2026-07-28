# Shadowing

> **Level 1 — Foundations**
> Re-declaring a variable with the same name in the same scope, optionally changing its type.

---

## 1. Prerequisites

- [Variable](../level_01/variable.md) — The named bindings that are being re-declared.
- [Mutability (`mut`)](../level_01/mutability_mut.md) — Shadowing is often used as a safer, cleaner alternative to mutability.

---

## 2. Term Category

**Rust-specific**: While other languages allow variables in inner scopes to shadow outer scopes, Rust actively encourages intentional shadowing *in the exact same scope* as an idiomatic way to transform data without inventing awkward variable names.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In strict languages like C# or Java, once you declare a variable named `input`, that name is permanently taken for that entire block of code. If `input` starts as a string (from a user typing), but you need to convert it into a number to do math, you are forced to invent awkward, slightly different names like `input_str` and `input_int`.

Rust solves this naming fatigue through **Shadowing**. By simply using the `let` keyword again with the exact same name, you create a *brand new* variable that hides the old one. This is incredibly powerful for two reasons:
1. **You can change the data type.** (e.g., parsing a `String` into an `i32`).
2. **It preserves immutability.** The new variable is still immutable by default. You transformed the data safely without having to make the variable `mut`, locking it down from accidental changes later.

### (2) Reality Metaphor

Imagine an actor performing in a one-person play. The actor's name is "Sam" (the variable name). 

In Scene 1, Sam plays a king. In Scene 2, Sam walks behind the curtain (the `let` keyword), quickly changes costumes, and walks back out as a peasant. Even though you are still looking at "Sam", the king is gone, completely overshadowed by the new character. Sam has entirely changed their "type" and "value" without you having to hire a second actor named "Sam_2".

### (3) Rust Code Examples

#### Short Snippet
```rust
let x = 5;

// We use `let` again to shadow the old `x` with a new `x`.
let x = x + 1; 

println!("The value is: {}", x); // Prints 6
```

#### Fuller Example
```rust
fn main() {
    // 1. We get some input from a user (a String).
    let guess = "42";
    
    // 2. We need it to be a number, not a string.
    // Instead of naming this `guess_number`, we just shadow `guess`!
    // We use `let` again to create a completely new variable with the same name,
    // changing its type from `&str` to `u32`.
    let guess: u32 = guess.parse().unwrap();
    
    println!("You guessed the number: {}", guess);
    
    // Note: We couldn't have done this using `mut`.
    // Mutability allows changing the VALUE, but NOT the TYPE.
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Shadowing Scoping and Lifecycle Rules

**The mistake:** Assuming Shadowing instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("shadowing_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("shadowing_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Shadowing State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Shadowing through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Shadowing Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Shadowing instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Transform the Data

**Problem:** The code below tries to apply a discount to a price, but it currently throws an error because the price is a string. Fix the code by using shadowing to convert `price` from a string into an `i32` before the discount is applied.

```rust
fn main() {
    let price = "100";
    
    // TODO: Add a line here that shadows `price`, parsing it into an i32.
    
    let discounted = price - 20;
    println!("Final price: ${}", discounted);
}
```

**Expected output:**
> [!check]- Answer
> ```text
> Final price: $80
> ```
> - Before the `discounted` line, add `let price: i32 = price.parse().unwrap();`.
> - This creates a new `price` variable that hides the string version, allowing the math to work.

---

### Exercise 2: Type Transformation via Shadowing

**Problem:** Take a user input string `"42"`, parse it into a `u32` using shadowing with `let input = input.trim().parse::<u32>().unwrap();`, and print the doubled number.

**Expected output:**
> [!check]- Answer
> ```
> 84
> ```
> ```rust
> fn main() {
>     let input = " 42 \n";
>     let input: u32 = input.trim().parse().unwrap();
>     println!("{}", input * 2);
> }
> ```
>
> **Explanation:** Shadowing allows transforming raw input representations into validated domain types without inventing throwaway variable names like `input_str` and `input_int`.

---

### Exercise 3: Scope Boundary Shadowing

**Problem:** Trace variable values across nested blocks when `x` is shadowed twice: `let x = 1; { let x = 2; { let x = 3; } }`.

**Expected output:**
> [!check]- Answer
> ```
> Outer: 1
> ```
> ```rust
> fn main() {
>     let x = 1;
>     {
>         let x = 2;
>         {
>             let x = 3;
>             assert_eq!(x, 3);
>         }
>         assert_eq!(x, 2);
>     }
>     println!("Outer: {}", x);
> }
> ```
>
> **Explanation:** Each block creates a distinct lexical scope. When an inner block exits, its shadowing binding is dropped and the outer binding becomes visible again.

---

## 6. Related Terms

- [Mutability (`mut`)](../level_01/mutability_mut.md) — The alternative approach. Use `mut` when you want to change the *value* in a loop or over time. Use shadowing when you want to change the *type* or apply a one-time transformation.
- [Variable](../level_01/variable.md) — The basic named binding that shadowing replaces.

---

## 7. Key Takeaways

- Shadowing is performed by using the `let` keyword on a variable name that already exists.
- Shadowing creates a **completely new variable** that hides the previous one.
- Unlike `mut`, shadowing allows you to change the **data type** of a variable.
- Shadowing allows you to reuse clean variable names (like `input`) instead of inventing messy ones (like `input_str` and `input_int`).
