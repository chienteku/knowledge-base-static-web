# String vs &str

> **Level 1 — Foundations**
> `String` is a heap-allocated, growable string; `&str` is an immutable string slice (borrowed reference).

---

## 1. Prerequisites

- [Variable](../level_01/variable.md) — Named bindings to store data.
- [Mutability (`mut`)](../level_01/mutability_mut.md) — The ability to change a value (crucial for `String`).

---

## 2. Term Category

**Rust-specific**: While other systems languages differentiate between dynamic strings and string literals, Rust's explicit duality (`String` vs `&str`) is a signature feature that forces developers to think about memory allocation.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In high-level languages like Python or JavaScript, a string is just a "string." The language hides how the text is actually stored in memory. However, hiding these details comes with a performance cost. 

Rust is a systems language, meaning it gives you control over memory for maximum speed. There are two completely different ways to use text in a program:
1. **Hardcoded text** (like `"Hello, World!"`) that never changes and is known exactly when you compile the program. 
2. **Dynamic text** (like reading user input from a keyboard) whose size is unknown until the program actually runs.

Rust created two distinct types for these scenarios:
- **`&str` (String Slice):** This is a read-only view into some text. When you type `"Hello"`, it is a `&str` baked directly into the final executable file. It is incredibly fast because no memory allocation happens at runtime, but it cannot grow or change.
- **`String`:** This is a dynamic, growable piece of text stored on the "heap" (system memory). You use this when you need to build, mutate, or take ownership of text at runtime.

### (2) Reality Metaphor

- **`&str` is a Printed Book:** The text is permanently inked on the page. You can read it, and you can point your finger at a specific sentence (a "slice" of the text), but you cannot add new sentences to the paper. 
- **`String` is a Google Doc:** It exists dynamically in the cloud (the heap). You own the document, and you can freely type new paragraphs into it, expanding its size as much as you need.

### (3) Rust Code Examples

#### Short Snippet
```rust
// A string literal is ALWAYS a `&str`. It is fixed and immutable.
let greeting: &str = "Hello";

// To make a growable `String`, we must allocate it from a `&str`.
let mut dynamic_greeting: String = String::from("Hello");
dynamic_greeting.push_str(", World!");
```

#### Fuller Example
```rust
fn main() {
    // 1. &str (String Slice)
    // This text is embedded directly into the binary file.
    let static_name = "Alice"; 
    
    // 2. String (Heap-allocated)
    // We create a new, empty String that can grow.
    let mut profile_bio = String::new();
    
    // We can add `&str` data into our `String`.
    profile_bio.push_str("My name is ");
    profile_bio.push_str(static_name);
    
    // Another way to create a String is using `.to_string()` on a `&str`.
    let sign_off = " Have a great day!".to_string();
    
    profile_bio.push_str(&sign_off);
    
    println!("{}", profile_bio);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to modify a string literal (`&str`)

**The mistake:** Treating a hardcoded string literal as if it can be appended to.

**Why it's wrong:** String literals are `&str`, which are essentially read-only pointers to text baked into the binary. They have no capacity to grow. 

*Incorrect:*
```rust
let mut name = "Bob";
name.push_str(" Smith"); // ERROR: no method named `push_str` found for type `&str`
```

*Fix:*
```rust
// Convert the `&str` to a `String` so it can grow on the heap.
let mut name = String::from("Bob");
name.push_str(" Smith");
```

### Mistake 2: Function parameter type mismatch

**The mistake:** A function expects a `String`, but you pass it a string literal (`"..."`).

**Why it's wrong:** Because `"..."` is a `&str`, it is a completely different type than `String`. Rust will not implicitly convert it for you. 

*Incorrect:*
```rust
fn print_name(name: String) {
    println!("{}", name);
}

fn main() {
    print_name("Alice"); // ERROR: expected struct `String`, found `&str`
}
```

*Fix:*
```rust
fn print_name(name: String) {
    println!("{}", name);
}

fn main() {
    // Explicitly convert it
    print_name(String::from("Alice")); 
}
```
*(Note: A better fix in real Rust is often to change the function to accept `&str` if it doesn't need to mutate the text).*

---

### Mistake 3: Concurrent Access to String Vs &Str Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe String Vs &Str instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Upgrade to a String

**Problem:** The following code tries to build a full sentence but fails because `start` is just a `&str`. Fix the code so it successfully compiles.

```rust
fn main() {
    let mut start = "The quick brown fox ";
    start.push_str("jumps over the lazy dog.");
    println!("{}", start);
}
```

**Expected output:**
> [!check]- Answer
> ```text
> The quick brown fox jumps over the lazy dog.
> ```
> - You cannot use `.push_str()` on a `&str`.
> - Change line 2 to initialize `start` as a `String` using `String::from("The quick brown fox ")` or `"The quick brown fox ".to_string()`.

---

### Exercise 2: Efficient String Slice Parameters

**Problem:** Write a function `greeting(name: &str) -> String` that accepts both `&str` literals and `&String` references via deref coercion.

**Expected output:**
> [!check]- Answer
> ```
> Hello, Alice!
> Hello, Bob!
> ```
> ```rust
> fn greeting(name: &str) -> String {
>     format!("Hello, {}!", name)
> }
> fn main() {
>     let literal = "Alice";
>     let owned = String::from("Bob");
>     println!("{}", greeting(literal));
>     println!("{}", greeting(&owned));
> }
> ```
>
> **Explanation:** Accept `&str` in function parameters to maximize flexibility, allowing callers to pass string literals, slices, or owned `String` references cleanly.

---

### Exercise 3: Appending Text to Heap Strings

**Problem:** Create a mutable `String`, push a char `'!'` using `.push()`, append a string slice `" World"` using `.push_str()`, and print the result.

**Expected output:**
> [!check]- Answer
> ```
> Hello World!
> ```
> ```rust
> fn main() {
>     let mut s = String::from("Hello");
>     s.push_str(" World");
>     s.push('!');
>     println!("{}", s);
> }
> ```
>
> **Explanation:** `.push_str()` appends string slices without taking ownership, while `.push()` appends single UTF-8 `char` primitives.

---

## 6. Related Terms

- [Ownership](../level_03/ownership.md) — A `String` *owns* its text data, while a `&str` merely *borrows* it.
- [Borrowing (`&`)](../level_03/borrowing.md) — The ampersand `&` in `&str` indicates it is a borrowed reference to text that lives elsewhere.

---

## 7. Key Takeaways

- **`&str`** is for fast, fixed, read-only text (like string literals `"hello"`).
- **`String`** is for dynamic, growable text that you can mutate at runtime.
- You can create a `String` from a `&str` using `String::from("text")` or `"text".to_string()`.
- A `String` is stored on the heap, while the data a `&str` points to is often baked directly into the program's binary.
