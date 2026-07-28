# `Rc<T>`

> **Level 3 — Ownership & Borrowing**
> Reference-counted smart pointer for shared ownership in single-threaded contexts.

---

## 1. Prerequisites

- [Ownership](../level_03/ownership.md) — The fundamental rule ("One Owner") that `Rc` is designed to safely bypass.
- [`Drop` Trait](../level_03/drop_trait.md) — How Rust cleans up memory. `Rc` manipulates exactly *when* the `Drop` trait is allowed to trigger.

---

## 2. Term Category

**Rust-specific (the explicit GC alternative)**: Languages like Java or Python use a heavy Garbage Collector to allow multiple variables to own the same data. Rust avoids Garbage Collection by using explicit **Reference Counting** (similar to Swift's ARC or C++ `std::shared_ptr`).

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The Golden Rule of Rust is: *"There can only be one owner."* 

But what if you are building a complex data structure, like a Graph network or a UI tree, where multiple different nodes need to point to and "own" the exact same piece of data? If you just use standard Borrowing (`&`), you become trapped by strict Lifetimes—the original owner might drop the data while the borrowers are still trying to read it!

We need **Shared Ownership**. 

`Rc<T>` stands for **R**eference **C**ounted. It is a "Smart Pointer" that wraps around your data. It keeps a running tally (a count) of exactly how many owners currently exist. Every time you clone the `Rc`, it *does not* deep copy your data; it just increases the integer count by 1. When an owner goes out of scope, the count drops by 1. When the count hits exactly `0`, the data is finally dropped.

### (2) Reality Metaphor

Imagine a TV in a shared living room.

- The TV (the data) is owned by the room. 
- Alice walks in and turns the TV on. **(Count = 1)**
- Bob walks in to watch. **(Count = 2)**
- Alice gets bored and leaves the room. **(Count = 1)**. The TV stays on because Bob is still watching.
- Charlie walks in. **(Count = 2)**
- Bob leaves. **(Count = 1)**
- Charlie leaves. **(Count = 0)**. 
- Because the room is now completely empty, the last person out turns off the TV (the **Drop** trait is called).

### (3) Rust Code Examples

#### Short Snippet (Incrementing the Count)
To use `Rc`, you must import it from the standard library.
```rust
use std::rc::Rc;

fn main() {
    // 1. We wrap our data inside a Reference Counter. Count is currently 1.
    let shared_data = Rc::new(String::from("Shared Secret"));
    
    // 2. We use `Rc::clone` to create a second owner. Count is now 2.
    // NOTE: This does NOT copy the string! It just increments the integer count!
    let owner_two = Rc::clone(&shared_data);
    
    println!("There are {} owners.", Rc::strong_count(&shared_data));
}
```

#### Fuller Example (Scoping and Dropping)
This example proves that the data stays alive as long as at least one owner exists, and shows the count going up and down based on `{}` scopes.

```rust
use std::rc::Rc;

fn main() {
    let a = Rc::new(String::from("TV Show"));
    println!("Count after creating a: {}", Rc::strong_count(&a)); // 1
    
    {
        // Inside this scope, `b` becomes a second owner.
        let b = Rc::clone(&a);
        println!("Count after creating b: {}", Rc::strong_count(&a)); // 2
        
    } // Scope ends! `b` is dropped. The count goes down by 1!
    
    // The data is still perfectly safe because `a` is still alive.
    println!("Count after b leaves: {}", Rc::strong_count(&a)); // 1
    
} // `a` drops here. Count hits 0. The "TV Show" string is finally dropped!
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Rc T Scoping and Lifecycle Rules

**The mistake:** Assuming Rc T instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("rc_t_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("rc_t_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Rc T State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Rc T through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Rc T Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Rc T instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Shared Playlist

**Problem:** We have a shared playlist. Create an `Rc` wrapping the string `"My Playlist"`. Then, create two new owners (`user2` and `user3`) using `Rc::clone`. Finally, assert that the strong count is equal to `3`.

```rust
use std::rc::Rc;

fn main() {
    // TODO: Wrap this string in an Rc::new()
    let user1 = String::from("My Playlist");
    
    // TODO: Create user2 and user3 using Rc::clone(&user1)
    
    // TODO: Print the Rc::strong_count(&user1)
}
```

> [!check]- Answer
> ```rust
> use std::rc::Rc;
>
> fn main() {
>     let user1 = Rc::new(String::from("My Playlist"));
>     let user2 = Rc::clone(&user1);
>     let user3 = Rc::clone(&user1);
>     
>     println!("Active listeners: {}", Rc::strong_count(&user1)); // 3
> }
> ```

---

### Exercise 2: Inspecting Strong Reference Count

**Problem:** Clone an `Rc<String>` twice and print `Rc::strong_count(&rc)`.

**Expected output:**
> [!check]- Answer
> ```
> Strong count: 3
> ```
> ```rust
> use std::rc::Rc;
> fn main() {
>     let r1 = Rc::new("shared".to_string());
>     let r2 = Rc::clone(&r1);
>     let r3 = Rc::clone(&r1);
>     println!("Strong count: {}", Rc::strong_count(&r1));
> }
> ```
>
> **Explanation:** `Rc::strong_count` returns the active number of shared ownership references.

---

### Exercise 3: Cyclic Reference Memory Leaks with `Rc`

**Problem:** Explain how reference cycles using `Rc` and `RefCell` cause memory leaks if not broken using `Weak` pointers.

**Expected output:**
> [!check]- Answer
> ```
> Weak pointer breaks cycles
> ```
> ```rust
> fn main() {
>     println!("Weak pointer breaks cycles");
> }
> ```
>
> **Explanation:** `Rc` reference cycles prevent `strong_count` from ever reaching 0, causing memory leaks unless `Weak` references are used.

---

## 6. Related Terms

- [`Arc<T>`](../level_03/arc_t.md) — The thread-safe sibling to `Rc` (Atomic Reference Counted).
- [`RefCell<T>`](../level_03/refcell_t.md) — A tool often wrapped *inside* an `Rc` to allow you to mutate the shared data safely.
- [Ownership](../level_03/ownership.md) — The strict "One Owner" rule that `Rc` safely bends.

---

## 7. Key Takeaways

- `Rc<T>` enables **Shared Ownership** of data in Rust.
- It works by keeping a "Reference Count" of exactly how many owners currently exist.
- The underlying data is only dropped when the count reaches `0`.
- You increase the count using `Rc::clone(&var)`. This is incredibly fast because it only increments an integer; it does *not* deep copy the data.
- Data inside an `Rc` is strictly **read-only**.
- `Rc` is not thread-safe and can only be used in single-threaded programs.
