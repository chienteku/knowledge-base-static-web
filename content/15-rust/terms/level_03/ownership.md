# Ownership

> **Level 3 — Ownership & Borrowing**
> Every value has exactly one owner; when the owner goes out of scope, the value is dropped.

---

## 1. Prerequisites

- [Variable](../level_01/variable.md) — Variables are the "owners" of data.
- [Expressions / Blocks](../level_01/expressions.md) — Curly braces `{}` define scopes, which are critical for determining when an owner dies.
- [String vs &str](../level_01/string_vs_&str.md) — `String` data lives on the Heap, making it the primary subject of Ownership rules.

---

## 2. Term Category

**Rust-specific (the core innovation)**: Ownership is Rust’s most unique and famous feature. It is the revolutionary system that allows Rust to guarantee perfect memory safety *without* relying on a slow, background Garbage Collector.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Historically, programming languages manage memory in one of two ways:
1. **Manual Management (C, C++)**: You manually ask the OS for memory (`malloc`), and you manually give it back (`free`). This is blazing fast but incredibly dangerous. If you forget to `free`, your program leaks memory until it crashes. If you `free` the same memory twice, hackers can exploit your program.
2. **Garbage Collection (Java, Python, JS)**: A background program (the Garbage Collector) constantly scans your program while it runs, looking for memory you aren't using anymore to clean it up. This is very safe, but it makes the language slower and causes unpredictable "pauses" during execution.

Rust chose a third, entirely new path: **Ownership**. The compiler enforces a strict set of rules at compile-time. It tracks exactly which variable "owns" a piece of memory. The exact moment that variable's curly brace `{}` ends, the compiler *automatically inserts the `free` code for you*. 

You get the blazing speed of C (no Garbage Collector) with the perfect safety of Java (no memory leaks).

### (2) Reality Metaphor

Imagine borrowing a book from a library.

- **In C++**: You take the book. The librarian never tracks it. You must remember to walk back and return it, or the book is lost forever.
- **In Java**: A librarian literally follows you around town, constantly watching to see if you are still reading the book. If you put it down, they grab it and take it back to the library.
- **In Rust**: The library has three strict rules:
  1. Only **one person** (the Owner) can hold the book at a time.
  2. You can only read the book while you are in this specific room (your Scope).
  3. The exact second you walk out the door (out of scope), an automatic trapdoor opens and drops the book into the return bin.

### (3) Rust Code Examples

#### Short Snippet (The Drop)
```rust
fn main() {
    { // Scope A begins
        let name = String::from("Alice"); // `name` is the OWNER of the string "Alice".
        
        println!("{}", name); 
        
    } // Scope A ends. `name` goes out of scope.
      // Rust automatically calls `drop(name)` here. The memory is instantly freed!
      
    // println!("{}", name); // ERROR: `name` no longer exists!
}
```

#### Fuller Example (The 3 Rules in Action)
The 3 Rules of Ownership are:
1. Each value in Rust has a variable that’s called its **owner**.
2. There can only be **one owner at a time**.
3. When the owner goes out of scope, the value will be dropped.

```rust
fn main() {
    let s1 = String::from("Hello"); // s1 is the owner
    
    // Because there can only be ONE owner at a time...
    // Passing `s1` to `s2` TRANSFERS ownership to `s2`. 
    let s2 = s1; 
    
    // s1 is now completely empty and invalid. It no longer owns anything.
    // println!("{}", s1); // COMPILER ERROR: "borrow of moved value: `s1`"
    
    println!("s2 is the new owner: {}", s2);
} // Scope ends. Only `s2` is dropped, because `s1` already lost its ownership.
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Ownership Scoping and Lifecycle Rules

**The mistake:** Assuming Ownership instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("ownership_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("ownership_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Ownership State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Ownership through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Ownership Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Ownership instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Identify the Drop

**Problem:** Read the code below. On exactly which line number is the memory for `"Rust"` freed from the Heap?

```rust
1  fn main() {
2      let msg1 = String::from("Hello");
3      {
4          let msg2 = String::from("Rust");
5          println!("{} {}", msg1, msg2);
6      }
7      println!("Done.");
8  }
```

> [!check]- Answer
> **Line 6**. 
>
> The variable `msg2` is the owner of `"Rust"`. `msg2`'s scope ends at the closing curly brace on Line 6. Therefore, Rust automatically drops `"Rust"` on Line 6. (`"Hello"` is dropped on Line 8).

---

### Exercise 2: Transferring Ownership Across Variable Bindings

**Problem:** Demonstrate transferring ownership of a `Vec<u8>` from `v1` to `v2` and explain why `v1` is invalid.

**Expected output:**
> [!check]- Answer
> ```
> v2 len: 3
> ```
> ```rust
> fn main() {
>     let v1 = vec![1, 2, 3];
>     let v2 = v1; // Ownership transferred to v2
>     println!("v2 len: {}", v2.len());
> }
> ```
>
> **Explanation:** Assigning non-`Copy` types moves ownership, invalidating previous binding names.

---

### Exercise 3: Returning Owned Values from Functions

**Problem:** Write a function `build_data() -> Vec<i32>` that creates a vector locally and returns ownership to `main`.

**Expected output:**
> [!check]- Answer
> ```
> Built len: 5
> ```
> fn build_data() -> Vec<i32> { vec![1, 2, 3, 4, 5] }
> fn main() {
>     let data = build_data();
>     println!("Built len: {}", data.len());
> }
> ```
>
> **Explanation:** Returning values transfers ownership out of function scopes into caller bindings.

---

## 6. Related Terms

- [Move Semantics](../level_03/move_semantics.md) — The technical term for transferring ownership from one variable to another (e.g., `let s2 = s1;`).
- [`Copy` Trait](../level_03/copy_trait.md) — The exception to Ownership rules for simple stack data.
- [Borrowing (`&`)](../level_03/borrowing.md) — How to let a function look at data *without* taking ownership of it.

---

## 7. Key Takeaways

- **Ownership** replaces Garbage Collection, providing memory safety with zero runtime overhead.
- There are **3 Rules of Ownership**:
  1. Each value in Rust has a variable that’s called its **owner**.
  2. There can only be **one owner** at a time.
  3. When the owner goes **out of scope**, the value will be dropped (cleaned up).
- Because there can only be one owner, assigning a `String` to a new variable transfers ownership and destroys the old variable.
