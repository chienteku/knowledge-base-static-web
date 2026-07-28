# `Clone` Trait

> **Level 3 — Ownership & Borrowing**
> Explicit deep duplication via `.clone()`. Required for types that don't implement `Copy`.

---

## 1. Prerequisites

- [Move Semantics](../level_03/move_semantics.md) — The default behavior of assignment that `Clone` allows you to bypass.
- [`Copy` Trait](../level_03/copy_trait.md) — The implicit version of copying for small, simple Stack data.
- [Traits](../level_04/trait.md) — (Future reference) The system used to define shared behaviors across types.

---

## 2. Term Category

**Rust-specific**: Other languages often hide whether variable assignment is performing a cheap pointer copy or an expensive full data copy. Rust forces expensive "Deep Copies" to be incredibly explicit via the `.clone()` method.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Sometimes you genuinely need a full, independent duplicate of a massive Heap data structure (like a `String` or a `Vec`). 

Rust's default behavior is to **Move** the data, invalidating the original variable. Why doesn't it just automatically copy the data? Because making a Deep Copy is **extremely expensive**. The computer has to ask the Operating System for new Heap memory and then copy every single byte of data over.

Because Rust is a systems programming language focused on performance, it refuses to do expensive things secretly. If you want an expensive Deep Copy, you must explicitly type `.clone()`. When a Rust programmer reviews code and sees `.clone()`, they instantly know: *"Ah, a heavy memory allocation is happening here."*

### (2) Reality Metaphor

Imagine you own a famous, original oil painting (Heap data). 

- If you hand it to a friend, you no longer have it. (**Move Semantics**)
- What if you want to keep your original *and* give your friend an identical one? You must hire a professional artist to spend a week painting a perfect replica. This is incredibly expensive and slow, so it never happens by accident. You must explicitly issue the order to **`.clone()`** it.

*(Contrast this with the `Copy` trait, which is like quickly scribbling a duplicate of a 2-line post-it note).*

### (3) Rust Code Examples

#### Short Snippet (The Explicit Clone)
```rust
fn main() {
    let s1 = String::from("Hello");
    
    // We explicitly ask for a Deep Copy. 
    // New memory is allocated on the Heap!
    let s2 = s1.clone(); 
    
    // Because we cloned it, s1 was never moved. Both are perfectly valid!
    println!("s1: {}, s2: {}", s1, s2);
}
```

#### Fuller Example (Custom Clone Structs)
Just like `Copy`, custom `struct`s do not implement `Clone` by default. You can easily add it using the `#[derive(Clone)]` macro. When you call `.clone()` on the struct, Rust will recursively call `.clone()` on all of its fields.

```rust
// We tell the compiler: "Allow us to clone this struct!"
#[derive(Clone)]
struct User {
    username: String, // String is not Copy, so the struct cannot be Copy!
    login_count: i32,
}

fn main() {
    let user1 = User {
        username: String::from("alice_88"),
        login_count: 5,
    };
    
    // We perform a deep copy of the entire struct.
    let user2 = user1.clone();
    
    println!("user1 is still alive: {}", user1.username);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Clone Trait Scoping and Lifecycle Rules

**The mistake:** Assuming Clone Trait instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("clone_trait_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("clone_trait_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Clone Trait State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Clone Trait through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Clone Trait Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Clone Trait instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Greedy Function

**Problem:** The `analyze_data` function takes ownership of the Vector, causing `main` to fail on the last line. Fix the code by passing a Deep Copy into the function so `main` can keep its original.

```rust
fn analyze_data(data: Vec<i32>) {
    println!("Analyzing {} items...", data.len());
}

fn main() {
    let my_data = vec![10, 20, 30, 40, 50];
    
    // TODO: Fix this line so `my_data` is not moved!
    analyze_data(my_data); 
    
    // This line currently crashes: "borrow of moved value"
    println!("Original data is still intact: {:?}", my_data); 
}
```

> [!check]- Answer
> Change the function call to `analyze_data(my_data.clone());` to pass a Deep Copy.

---

### Exercise 2: Deriving vs Explicit Clone Implementation

**Problem:** Derive `Clone` on a custom `Point` struct and duplicate an instance with `.clone()`.

**Expected output:**
> [!check]- Answer
> ```
> Cloned point: (1, 2)
> ```
> ```rust
> #[derive(Clone, Debug)]
> struct Point { x: i32, y: i32 }
> fn main() {
>     let p1 = Point { x: 1, y: 2 };
>     let p2 = p1.clone();
>     println!("Cloned point: ({}, {})", p2.x, p2.y);
> }
> ```
>
> **Explanation:** `#[derive(Clone)]` generates field-by-field `.clone()` calls automatically.

---

### Exercise 3: Clone-on-Write Strategy

**Problem:** Clone a `Vec<String>` only when mutation is necessary.

**Expected output:**
> [!check]- Answer
> ```
> Original len: 2, Cloned len: 3
> ```
> ```rust
> fn main() {
>     let original = vec!["a".to_string(), "b".to_string()];
>     let mut modified = original.clone();
>     modified.push("c".to_string());
>     println!("Original len: {}, Cloned len: {}", original.len(), modified.len());
> }
> ```
>
> **Explanation:** `.clone()` isolates changes by duplicating data onto the heap.

---

## 6. Related Terms

- [`Copy` Trait](../level_03/copy_trait.md) — The implicit, cheap version of copying for stack-only data.
- [Borrowing (`&`)](../level_03/borrowing.md) — The idiomatic way to avoid `.clone()` by just letting functions look at your data temporarily without taking ownership.

---

## 7. Key Takeaways

- The `Clone` trait allows you to perform an expensive **Deep Copy** of data.
- Because Deep Copies hit the Heap and slow down performance, it is never automatic. You must explicitly type `.clone()`.
- You can make your own structs cloneable by adding `#[derive(Clone)]` directly above the struct definition.
- Avoid using `.clone()` as a crutch just to silence compiler errors; use Borrowing (`&`) whenever possible to maintain blazing fast performance.
