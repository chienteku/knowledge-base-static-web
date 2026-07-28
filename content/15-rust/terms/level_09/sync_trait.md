# `Sync` Trait

> **Level 9 — Concurrency & Parallelism**
> Marker trait indicating a type can be safely shared (via `&T`) between threads.

---

## 1. Prerequisites

- [`Send` Trait](../level_09/send_trait.md) — The sister trait to `Sync`. You must understand `Send` first!
- [Shared Borrowing (`&T`)](../level_03/borrowing.md) — The concept of multiple read-only pointers pointing to the same data.
- [`RefCell<T>`](../level_03/refcell_t.md) — The most famous type that lacks this trait.

---

## 2. Term Category

**Rust-specific (the sharing bouncer)**: The `Send` trait means you are allowed to *move* (transfer ownership of) a variable into a background thread. 

But what if you don't want to move it? What if you want to keep the variable in the main thread, but let 5 different background threads *look at it* simultaneously using shared references (`&T`)? 

The **`Sync`** trait is the mathematical proof to the compiler that a type is safe to be looked at by multiple threads at the exact same time.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The Rust compiler enforces one incredibly brilliant, golden rule: 
> *"A type `T` is `Sync` if and only if `&T` is `Send`."*

This sounds like a tongue-twister, but it translates to: *"It is safe to let multiple threads look at this data simultaneously (`Sync`), ONLY IF it is safe to send a pointer to that data into another thread (`&T` is `Send`)."*

Most types in Rust (like `i32` or `String`) are perfectly safe to read from multiple threads at the same time. Why? Because shared references (`&T`) in Rust are **immutable**! You can't cause a Data Race if nobody is allowed to write to the data.

However, some types (like `RefCell<T>`) use *Interior Mutability*. This means their internal data can be mutated *even through an immutable `&T` reference*. If two threads tried to mutate a `RefCell` at the exact same time, the program would crash. Because of this, the Rust compiler explicitly removes the `Sync` trait from `RefCell`. 

### (2) Reality Metaphor

Imagine a rare painting in a museum. 

- **`Send`** is boxing up the painting, putting it on an airplane, and transferring ownership to a new museum in Paris. 
- **`Sync`** is hanging the painting on the wall and letting 50 different people (threads) look at it at the exact same time (`&T`). 

But what if the painting is actually a magic whiteboard (`RefCell`) that people can draw on while looking at it? If 50 people try to draw on it at the exact same time, chaos ensues! The museum removes the `Sync` sign from the whiteboard, forcing people to take turns.

### (3) Rust Code Examples

#### Short Snippet (The Rule)
Because `Sync` is an auto-trait, you never actually implement it yourself. The compiler does it for you. 

```rust
// The compiler automatically applies this logic to every type you create:
// If my `&T` can be Sent to another thread, then I am Sync!
unsafe auto trait Sync {}
```

#### Fuller Example (The Bouncer in Action)
Let's see what happens if we try to share a `RefCell` across multiple threads using an `Arc` (Atomic Reference Counted pointer). 

`Arc` allows multiple threads to share ownership of data. But `Arc` has a strict rule: the data inside it must be `Send + Sync`!

```rust
use std::sync::Arc;
use std::cell::RefCell;
use std::thread;

fn main() {
    // 1. We wrap a RefCell inside an Arc so we can share it.
    let shared_data = Arc::new(RefCell::new(5));
    let data_clone = Arc::clone(&shared_data);

    // 2. We spawn a thread and try to mutate the RefCell!
    thread::spawn(move || {
        let mut inner = data_clone.borrow_mut();
        *inner += 1;
    });
}
```
**Compiler Error!**
```text
error[E0277]: `RefCell<i32>` cannot be shared between threads safely
   = help: the trait `Sync` is not implemented for `RefCell<i32>`
   = note: required because of the requirements on the impl of `Send` for `Arc<RefCell<i32>>`
```
*Why did it fail?* Because `Arc` gives multiple threads a shared reference to the inner data. But `RefCell` is not `Sync`! It will crash if two threads call `.borrow_mut()` at the same time. The compiler catches this bug instantly.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Sync Trait Scoping and Lifecycle Rules

**The mistake:** Assuming Sync Trait instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("sync_trait_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("sync_trait_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Sync Trait State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Sync Trait through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Sync Trait Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Sync Trait instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Thread-Safe Alternative

**Problem:** `RefCell<T>` allows Interior Mutability (modifying data through an immutable reference). However, it is not `Sync`, so you can't share it across threads. There is another type in Rust that also allows Interior Mutability, but uses OS-level locking mechanisms to ensure only one thread can mutate the data at a time. Because it is safe, the compiler explicitly marks it as `Sync`. What is the name of this type?

> [!check]- Answer
> **`Mutex<T>`**!
>
> A Mutex (Mutual Exclusion) does exactly what `RefCell` does, but it is thread-safe. When you want to share mutable data across threads, you wrap it in a `Mutex`, which gives it the `Sync` trait!

---

### Exercise 2: Verifying `Sync` Trait Bounds

**Problem:** Verify that `Mutex<i32>` implements `Sync` by passing `&Mutex<i32>` to multiple threads.

**Expected output:**
> [!check]- Answer
> ```
> Mutex implements Sync
> ```
> ```rust
> use std::sync::Mutex;
> fn assert_sync<T: Sync>() {}
> fn main() {
>     assert_sync::<Mutex<i32>>();
>     println!("Mutex implements Sync");
> }
> ```
>
> **Explanation:** `Sync` indicates that references `&T` can be safely shared across concurrent threads.

---

### Exercise 3: Relationship Between `Send` and `Sync`

**Problem:** Demonstrate that `&T` implements `Send` if and only if `T` implements `Sync`.

**Expected output:**
> [!check]- Answer
> ```
> Sync relationship verified
> ```
> ```rust
> fn assert_send<T: Send>() {}
> fn check_sync<T: Sync>() { assert_send::<&T>(); }
> fn main() {
>     check_sync::<i32>();
>     println!("Sync relationship verified");
> }
> ```
>
> **Explanation:** By definition, `T` is `Sync` if and only if `&T` is `Send`.

---

## 6. Related Terms

- [`Send` Trait](../level_09/send_trait.md) — The sister trait for *moving* data.
- [`Arc<T>`](../level_03/arc_t.md) — Requires its inner type `T` to be both `Send` and `Sync` to safely share data across threads.
- [`Mutex<T>`](../level_09/mutex_t.md) — The thread-safe alternative to `RefCell` that *is* `Sync`.

---

## 7. Key Takeaways

- **`Sync`** proves a type can be safely referenced (`&T`) by multiple threads simultaneously.
- A type `T` is `Sync` if and only if `&T` is `Send`.
- Most primitive types and immutable structs are automatically `Sync` because immutable reads are always thread-safe.
- Types with non-thread-safe Interior Mutability (like `RefCell<T>`) are *not* `Sync`.
- **`Send` is for moving; `Sync` is for sharing.**
