# Monomorphization

> **Level 4 — Error Handling & Generics**
> The compiler generates specialized code for each concrete type used with generics — zero-cost abstraction.

---

## 1. Prerequisites

- [Generics (`<T>`)](../level_04/generics.md) — The feature that triggers this compiler mechanism.
- [`fn` (Functions)](../level_01/fn.md) — The primary place where this code duplication happens.

---

## 2. Term Category

**Rust-specific (the compiler magic)**: "Monomorphization" is a massive, scary word for a very simple concept: it is the exact physical mechanism the Rust compiler uses to implement Generics so that they run at blazing speeds. 

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In languages like Java or Python, a generic function usually works by passing everything around as a generic object or pointer under the hood. Because the compiled code doesn't know exactly what type it's dealing with, the CPU has to do extra work at runtime to figure out how to handle the data (this is called *dynamic dispatch*). This makes generic code inherently slightly slower than hard-coding a specific function.

Rust's core philosophy is **"Zero-Cost Abstractions"**. Rust wants you to be able to use elegant abstractions (like Generics) without losing a single drop of performance.

Rust achieves this via **Monomorphization**. When you write a generic function, the Rust compiler looks at everywhere you called it. If you called it with an `i32` and an `f64`, the compiler secretly deletes your generic function, and automatically copy-pastes two brand new, hard-coded functions into the final binary. At runtime, there is no generic code at all!

### (2) Reality Metaphor

Imagine you write a generic recipe for *"Baking a `<T>`"*. 

If you give it to a **Java chef**, the chef keeps the generic recipe on the wall. When you order a cake, the chef has to stop, read the generic recipe, translate `<T>` to "Cake" in their head, figure out how a cake behaves, and then bake it. This translation takes time. 

If you give it to the **Rust compiler**, the compiler looks at your restaurant, sees that you only ever serve "Cake" and "Pie", and secretly throws away your generic recipe. Instead, it prints out two brand new, specific recipes: *"Baking a Cake"* and *"Baking a Pie"*. When the chef cooks, there is zero translation time. They just read the hard-coded recipe and go perfectly fast.

### (3) Rust Code Examples

#### Short Snippet (What you write vs What Rust compiles)

```rust
// 1. What you write:
fn print_item<T>(item: T) {
    // ... logic ...
}

fn main() {
    print_item(5);        // Calling with i32
    print_item("Hello");  // Calling with &str
}
```

```rust
// 2. What the compiler ACTUALLY turns it into (Monomorphization):
// Notice the generic <T> is completely gone!

fn print_item_i32(item: i32) {
    // ... logic ...
}

fn print_item_str(item: &str) {
    // ... logic ...
}

fn main() {
    print_item_i32(5); 
    print_item_str("Hello");
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Monomorphization Scoping and Lifecycle Rules

**The mistake:** Assuming Monomorphization instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("monomorphization_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("monomorphization_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Monomorphization State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Monomorphization through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Monomorphization Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Monomorphization instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Count the Copies

**Problem:** Look at the following code. After Monomorphization finishes, exactly how many copies of the `Wrapper` struct will exist in the final compiled program?

```rust
struct Wrapper<T> {
    value: T,
}

fn main() {
    let a = Wrapper { value: 10 };       // i32
    let b = Wrapper { value: 20 };       // i32
    let c = Wrapper { value: 3.14 };     // f64
    let d = Wrapper { value: "Rust" };   // &str
    let e = Wrapper { value: "Fast" };   // &str
}
```

> [!check]- Answer
> **3 copies.**
>
> The compiler creates one copy for every *unique type* used.
> 1. `Wrapper_i32` (used by `a` and `b`)
> 2. `Wrapper_f64` (used by `c`)
> 3. `Wrapper_str` (used by `d` and `e`)

---

### Exercise 2: Monomorphization Code Duplication Inspection

**Problem:** Demonstrate that calling `fn process<T>(val: T)` with `i32` and `&str` compiles separate code paths.

**Expected output:**
> [!check]- Answer
> ```
> Monomorphized i32
> Monomorphized str
> ```
> ```rust
> fn process<T: std::fmt::Debug>(val: T) {
>     println!("Monomorphized {:?}", val);
> }
> fn main() {
>     process(42);
>     process("str");
> }
> ```
>
> **Explanation:** Rust generates concrete function instances for `process::<i32>` and `process::<&str>` during compilation.

---

### Exercise 3: Reducing Monomorphization Bloat with Inner Non-Generic Helpers

**Problem:** Refactor a generic function to delegate common logic to a non-generic helper function `fn inner_log(msg: &str)`.

**Expected output:**
> [!check]- Answer
> ```
> Logged: test
> ```
> ```rust
> fn inner_log(msg: &str) { println!("Logged: {}", msg); }
> fn log_data<T: std::fmt::Display>(data: T) {
>     inner_log(&data.to_string());
> }
> fn main() {
>     log_data("test");
> }
> ```
>
> **Explanation:** Delegating to non-generic helper functions reduces duplicated compiled binary instructions.

---

## 6. Related Terms

- [Generics (`<T>`)](../level_04/generics.md) — The language feature that triggers Monomorphization.
- [Trait Objects (`dyn Trait`)](../level_04/trait_objects.md) — The exact opposite of Monomorphization. Trait objects use dynamic dispatch at runtime. They save file size (no copy-pasting code) but cost runtime performance.

---

## 7. Key Takeaways

- **Monomorphization** is the compiler turning generic code into specific, hard-coded code at compile-time.
- "Mono" (one) + "morph" (form) = turning a generic into one specific form.
- It is a **Zero-Cost Abstraction**. Using a generic function in Rust is *exactly* as fast as manually writing a hard-coded function for that specific type.
- The only trade-offs are slightly longer compile times and larger executable file sizes (binary bloat).
