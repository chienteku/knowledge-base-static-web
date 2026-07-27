# Dangling Reference

> **Level 3 — Ownership & Borrowing**
> A reference to freed memory; Rust's borrow checker prevents this at compile time.

---

## 1. Prerequisites

- [Ownership](../level_03/ownership.md) — The rule that data is dropped when its owner goes out of scope.
- [Borrowing (`&`)](../level_03/borrowing.md) — The act of passing a reference instead of ownership.
- [Borrow Checker](../level_03/borrow_checker.md) — The strict cop that ensures a reference never outlives its data.

---

## 2. Term Category

**Rust-specific (the prevention of it)**: Dangling references are a notorious and catastrophic bug common in languages like C and C++. Rust is world-famous because its compiler makes this specific bug mathematically impossible to compile.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In manually memory-managed languages like C, you can ask the computer for a chunk of memory and create a "pointer" (reference) to it. If you free that memory, but accidentally keep the pointer and try to read it later, you have a **Dangling Reference**. 

Why is this so bad? Because the Operating System might have given that freed memory space to a totally different program, or a hacker might have inserted malicious code into that exact spot. Reading from a dangling reference causes crashes ("Segmentation Faults") or massive security vulnerabilities. 

Rust prevents this entirely. The [Borrow Checker](../level_03/borrow_checker.md) tracks the lifetime of every piece of data. If it sees that a reference will live longer than the data it points to, it halts compilation immediately. It is impossible to have a dangling reference in safe Rust.

### (2) Reality Metaphor

Imagine you give your friend the address to a specific hotel you are staying at (a **Reference**). 

A week later, the hotel goes bankrupt and the building is completely demolished (the memory is **Dropped**). 

A month later, your friend finally drives to the address expecting to find you and your hotel room. Instead, they find an empty dirt lot, or worse, a brand new radioactive waste facility. They try to walk into "your room" and instantly die. This is a **Dangling Reference**. 

Rust prevents this by having a strict rule: *"You are not allowed to hand out an address if the person is going to visit it after the building is scheduled for demolition."*

### (3) Rust Code Examples

#### Short Snippet (The Classic Beginner Error)
The most common way to accidentally create a dangling reference is trying to return a reference to a variable created *inside* a function.

```rust
// Attempting to return a reference to a String
fn create_message() -> &String { 
    let s = String::from("Hello World");
    
    &s // We return a reference to `s`
} // DANGER: `s` goes out of scope here! The String is dropped!

// If this compiled, the caller would receive a reference to deleted memory!
// The Rust compiler throws an error: "returns a reference to data owned by the current function"
```

#### Fuller Example (The Fix)
To fix a dangling reference returning from a function, you must stop trying to pass an address (`&`), and instead pass the actual deed (**Ownership**)!

```rust
// We change the return type from `&String` to `String`. 
// We are transferring Ownership back to the caller!
fn create_message_fixed() -> String {
    let s = String::from("Hello World");
    
    s // We return the actual String, NOT a reference.
} // Because Ownership is transferred to the caller, `s` is NOT dropped here.

fn main() {
    // `msg` becomes the new Owner of the String. Perfectly safe!
    let msg = create_message_fixed(); 
    println!("{}", msg);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Dangling Reference Scoping and Lifecycle Rules

**The mistake:** Assuming Dangling Reference instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("dangling_reference_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("dangling_reference_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Dangling Reference State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Dangling Reference through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Dangling Reference Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Dangling Reference instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Dangling Integer

**Problem:** The code below attempts to return a reference to a number created inside a function. It will not compile. Fix the code by removing the reference syntax so the function returns the actual number instead.

```rust
// TODO: Fix the return type!
fn get_lucky_number() -> &i32 {
    let num = 77;
    
    // TODO: Fix the return value!
    &num 
}

fn main() {
    let my_num = get_lucky_number();
    println!("My lucky number is {}", my_num);
}
```

> [!check]- Answer
> Remove the `&` symbols!
> 1. Change `-> &i32` to `-> i32`.
> 2. Change `&num` to `num`.

---

### Exercise 2: Fixing Dangling String References

**Problem:** Fix compiler error `E0515` by returning owned `String` instead of `&String`.

**Expected output:**
```
Hello World
```

> [!check]- Answer
> ```rust
> fn create_text() -> String {
>     let s = String::from("Hello World");
>     s // Return owned String
> }
> fn main() {
>     println!("{}", create_text());
> }
> ```
>
> **Explanation:** Returning owned types transfers heap data ownership to the caller safely without dangling references.

### Exercise 3: Static Reference Lifetime Extension

**Problem:** Return a string slice reference `&'static str` from a function safely.

**Expected output:**
```
Static slice: Constant
```

> [!check]- Answer
> ```rust
> fn static_text() -> &'static str {
>     "Constant"
> }
> fn main() {
>     println!("Static slice: {}", static_text());
> }
> ```
>
> **Explanation:** String literals reside in binary data segments with `'static` lifetime, preventing dangling reference risks.

---

## 6. Related Terms

- [Lifetimes](../level_05/lifetime.md) — The underlying system the Borrow Checker uses to mathematically prove that a reference isn't dangling.
- [Borrow Checker](../level_03/borrow_checker.md) — The compiler component that throws the "returns a reference to data owned by the current function" error.

---

## 7. Key Takeaways

- A **Dangling Reference** is a pointer to memory that has already been dropped/freed.
- Using them causes catastrophic security vulnerabilities and crashes in languages like C/C++.
- Rust's Borrow Checker **completely eliminates** this bug at compile time.
- The most common way beginners trigger this compiler error is by trying to return a reference (`&`) to a variable created inside a function. 
- The fix is almost always to remove the `&` and return **Ownership** of the data instead.
