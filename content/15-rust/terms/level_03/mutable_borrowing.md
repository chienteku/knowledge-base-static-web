# Mutable Borrowing (`&mut`)

> **Level 3 — Ownership & Borrowing**
> Creating an exclusive mutable reference; only one `&mut` is allowed at a time.

---

## 1. Prerequisites

- [Borrowing (`&`)](../level_03/borrowing.md) — The concept of passing references instead of Ownership.
- [Mutability (`mut`)](../level_01/mutability_mut.md) — The keyword required to allow data to change.
- [Expressions / Blocks](../level_01/expressions.md) — Knowing how `{}` scopes work is critical for managing how long a borrow lasts.

---

## 2. Term Category

**Rust-specific (the strict safety rules)**: While pointers in C++ allow unrestricted and highly dangerous mutation, Rust introduces a strict rule known in computer science as "Aliasing XOR Mutability". You can have many readers, OR exactly one writer, but never both at the same time.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In languages like Java, Python, or C++, multiple variables or threads can hold a reference to the exact same list. If Thread A is looping over the list while Thread B is simultaneously deleting items from it, the program will crash or produce garbage data. This is called a **Data Race**, and it is one of the hardest bugs to track down in programming.

Rust was designed to completely eliminate Data Races at compile time. It does this via the strict rules of **Mutable Borrowing (`&mut`)**. 

Rust guarantees that a mutable reference is *exclusive*. If you hold a `&mut` reference to data, no one else is allowed to hold *any* reference to that data (not even a read-only one!). Because the compiler mathematically proves that the writer is the *only* person accessing the memory, data races are impossible.

### (2) Reality Metaphor

Imagine a **whiteboard** in a conference room.

Standard Borrowing (`&`) is like opening the window blinds. You can have 10 people looking at the whiteboard simultaneously, because looking doesn't change anything.

**Mutable Borrowing (`&mut`)** is handing one person a marker. If someone has a marker and is actively changing the board, you *must close the blinds*. No one else is allowed to even *look* at the board while it's being written to, because they might read half-finished, incorrect data. 

**The Golden Rule:** You can have many readers, or exactly one writer. Never both.

### (3) Rust Code Examples

#### Short Snippet (Modifying Data via Reference)
To mutably borrow data, both the original variable AND the reference must be marked `mut`.
```rust
fn add_world(s: &mut String) {
    s.push_str(" World!");
} // The mutable borrow ends here.

fn main() {
    // 1. The original variable MUST be `mut`
    let mut greeting = String::from("Hello");
    
    // 2. We pass a mutable reference `&mut`
    add_world(&mut greeting);
    
    println!("{}", greeting); // Prints: Hello World!
}
```

#### Fuller Example (The Exclusivity Rule)
The compiler will aggressively stop you if you try to break the Golden Rule.

```rust
fn main() {
    let mut book = String::from("The Rust Book");
    
    // Bob borrows the book mutably (He has the marker!)
    let bob_editor = &mut book;
    
    // Alice tries to borrow the book to read it...
    // let alice_reader = &book; // COMPILER ERROR! You cannot read while Bob is editing!
    
    // Bob tries to give his friend Charlie a marker too...
    // let charlie_editor = &mut book; // COMPILER ERROR! Only ONE marker allowed!
    
    bob_editor.push_str(" - 2nd Edition");
    
    // Bob's borrow ends here. Now it's safe to read again!
    println!("Final book: {}", book); 
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Mutable Borrowing Scoping and Lifecycle Rules

**The mistake:** Assuming Mutable Borrowing instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("mutable_borrowing_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("mutable_borrowing_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Mutable Borrowing State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Mutable Borrowing through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Mutable Borrowing Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Mutable Borrowing instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Scope Solution

**Problem:** The code below fails to compile because it tries to create two mutable borrows at the exact same time. Fix the code by putting `r1` inside its own `{ }` scope block so that its borrow dies *before* `r2` begins!

```rust
fn main() {
    let mut s = String::from("Hello");

    // TODO: Put the `r1` logic inside a new Scope `{ }`
    let r1 = &mut s;
    r1.push_str(" World");

    // `r2` should succeed if `r1` is dead!
    let r2 = &mut s;
    r2.push_str("!!!");

    println!("{}", s);
}
```

> [!check]- Answer
> ```rust
> fn main() {
>     let mut s = String::from("Hello");
>
>     {
>         let r1 = &mut s;
>         r1.push_str(" World");
>     } // r1's mutable borrow ends here!
>
>     let r2 = &mut s; // It is now perfectly safe to create a new mutable borrow.
>     r2.push_str("!!!");
>
>     println!("{}", s);
> }
> ```

---

### Exercise 2: In-Place Vector Mutation via `&mut`

**Problem:** Write a function `double_values(v: &mut Vec<i32>)` that doubles every element in-place.

**Expected output:**
> [!check]- Answer
> ```
> [2, 4, 6]
> ```
> ```rust
> fn double_values(v: &mut Vec<i32>) {
>     for x in v.iter_mut() {
>         *x *= 2;
>     }
> }
> fn main() {
>     let mut numbers = vec![1, 2, 3];
>     double_values(&mut numbers);
>     println!("{:?}", numbers);
> }
> ```
>
> **Explanation:** `&mut` references grant exclusive access to iterate and mutate collection elements in-place.

---

### Exercise 3: Reborrowing Mutable References

**Problem:** Pass a mutable reference `&mut val` into a function that modifies `val`, and demonstrate using `&mut val` again afterwards.

**Expected output:**
> [!check]- Answer
> ```
> Final val: 30
> ```
> fn add_ten(x: &mut i32) { *x += 10; }
> fn main() {
>     let mut val = 10;
>     add_ten(&mut val);
>     add_ten(&mut val);
>     println!("Final val: {}", val);
> }
> ```
>
> **Explanation:** Passing mutable references re-borrows exclusive access temporarily for the duration of function calls.

---

## 6. Related Terms

- [Borrow Checker](../level_03/borrow_checker.md) — The strict compiler component that enforces the "One Mutable Borrow" rule.
- [Interior Mutability](../level_03/interior_mutability.md) — (Future reference) Advanced patterns that bypass these strict compile-time rules using runtime checks instead.

---

## 7. Key Takeaways

- **Mutable Borrowing (`&mut`)** allows a function to temporarily modify data without taking ownership.
- The original variable itself must be declared with `mut`.
- Both the sender and receiver must explicitly use `&mut` syntax.
- **The Golden Rule**: You can have either *many immutable borrows (`&`)* OR *exactly one mutable borrow (`&mut`)*. Never both at the same time.
- This strict exclusivity rule completely eliminates Data Races at compile time.
