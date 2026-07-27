# `RefCell<T>`

> **Level 3 — Ownership & Borrowing**
> A smart pointer that enforces borrowing rules at runtime instead of compile time.

---

## 1. Prerequisites

- [Borrow Checker](../level_03/borrow_checker.md) — The strict compile-time cop that `RefCell` bypasses.
- [Mutable Borrowing (`&mut`)](../level_03/mutable_borrowing.md) — The "Golden Rule" (one writer OR many readers) that `RefCell` enforces.
- [`Rc<T>`](../level_03/rc_t.md) — The smart pointer that is almost always paired with `RefCell`.

---

## 2. Term Category

**Rust-specific (the runtime loophole)**: Normally, Rust enforces its strict memory safety rules before you even run the code. `RefCell` is a unique tool that delays these checks until the code is actively running, allowing you to bypass compiler limitations at the risk of crashing your program.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The [Borrow Checker](../level_03/borrow_checker.md) is incredibly strict. It must mathematically prove at *compile time* that you never have two mutable borrows active simultaneously. 

But sometimes, a human knows that the code is perfectly safe, but the math is just too complex for the compiler to prove it (this is very common in complex GUI frameworks or Graph data structures). Furthermore, if you share data using `Rc<T>`, the data is strictly read-only. If you want multiple owners to *modify* the shared data, the compiler will aggressively stop you.

Rust solves this with **`RefCell<T>`**. It allows you to mutate data even when the compiler thinks you shouldn't be allowed to. It does this by turning off the compile-time checks, and instead enforcing the borrowing rules at **runtime**.

### (2) Reality Metaphor

The standard **Borrow Checker** is like a strict TSA agent at the airport. They inspect your luggage before you are allowed to board the plane (**Compile Time**). If they think your bag is even slightly dangerous, you aren't allowed to fly. Your program doesn't compile.

**`RefCell`** is like saying: *"Just trust me, put the bag on the plane. But put an armed guard next to it."* 

The guard watches the bag during the flight (**Runtime**). If you sit quietly and read your book (valid borrowing), everything is fine. But if you try to do something dangerous during the flight (like taking out two mutable references at the exact same time), the guard instantly shoots you and crashes the plane. 

### (3) Rust Code Examples

#### Short Snippet (Borrowing at Runtime)
To read data inside a `RefCell`, you call `.borrow()`. To write data, you call `.borrow_mut()`.
```rust
use std::cell::RefCell;

fn main() {
    // We create an immutable variable `data`!
    let data = RefCell::new(5);
    
    // We can still modify the inner value because of RefCell!
    // We ask the runtime guard for a mutable reference.
    *data.borrow_mut() = 10;
    
    // We ask the runtime guard for an immutable reference.
    println!("The data is now: {}", data.borrow());
}
```

#### Fuller Example (The Runtime Crash)
`RefCell` does *not* let you break the rules of Rust. It still enforces the Golden Rule (one writer OR many readers). It just checks it at runtime instead of compile time.

```rust
use std::cell::RefCell;

fn main() {
    let cell = RefCell::new(String::from("Hello"));
    
    let mut writer1 = cell.borrow_mut();
    writer1.push_str(" World");
    
    // DANGER! We try to create a second mutable borrow while `writer1` is still active.
    // The compiler will ALLOW this code to build. 
    // But when you RUN the program, the guard will shoot you and the program will crash!
    
    // let mut writer2 = cell.borrow_mut(); // PANIC: "already borrowed: BorrowMutError"
    
} // `writer1` drops here.
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Refcell T Scoping and Lifecycle Rules

**The mistake:** Assuming Refcell T instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("refcell_t_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("refcell_t_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Refcell T State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Refcell T through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Refcell T Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Refcell T instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Scope Fix

**Problem:** The code below compiles successfully, but will instantly crash when you run it because it tries to print the data (a read borrow) while a mutable borrow is still active. Fix the code by putting the `writer` inside its own `{ }` scope so it drops *before* the `println!` happens.

```rust
use std::cell::RefCell;

fn main() {
    let score = RefCell::new(100);
    
    // TODO: Put this writer logic inside a new Scope `{ }`
    let mut writer = score.borrow_mut();
    *writer += 50;
    
    // This will cause a runtime crash unless `writer` is dead!
    println!("Final Score: {}", score.borrow());
}
```

> [!check]- Answer
> ```rust
> use std::cell::RefCell;
>
> fn main() {
>     let score = RefCell::new(100);
>     
>     {
>         let mut writer = score.borrow_mut();
>         *writer += 50;
>     } // `writer` drops here, freeing up the RefCell!
>     
>     println!("Final Score: {}", score.borrow()); // Safe!
> }
> ```

---

### Exercise 2: Safe Non-Panicking Mut Borrowing with `try_borrow_mut`

**Problem:** Use `cell.try_borrow_mut()` to safely handle double borrow attempts without panicking.

**Expected output:**
```
Borrow failed safely
```

> [!check]- Answer
> ```rust
> use std::cell::RefCell;
> fn main() {
>     let cell = RefCell::new(42);
>     let b1 = cell.borrow();
>     if cell.try_borrow_mut().is_err() {
>         println!("Borrow failed safely");
>     }
> }
> ```
>
> **Explanation:** `try_borrow_mut()` returns `Result<RefMut<T>, BorrowMutError>` instead of panicking on conflict.

### Exercise 3: Scoped Block Borrow Drop Release

**Problem:** Isolate `cell.borrow_mut()` inside an inner scope `{ ... }` so subsequent `cell.borrow()` calls succeed.

**Expected output:**
```
Val: 100
```

> [!check]- Answer
> use std::cell::RefCell;
> fn main() {
>     let cell = RefCell::new(10);
>     {
>         let mut b = cell.borrow_mut();
>         *b = 100;
>     } // RefMut guard dropped here
>     println!("Val: {}", cell.borrow());
> }
> ```
>
> **Explanation:** When `RefMut` guards leave scope, internal borrow counters decrement to release exclusive access.

---

## 6. Related Terms

- [`Rc<T>`](../level_03/rc_t.md) — The smart pointer almost *always* paired with `RefCell`. `Rc<RefCell<T>>` is the standard way to allow multiple owners to mutate shared data.
- [`Cell<T>`](../level_03/cell_t.md) — The slightly faster, simpler sibling to `RefCell` that only works for simple `Copy` data.
- [Interior Mutability](../level_03/interior_mutability.md) — The official name for the design pattern that `RefCell` enables.

---

## 7. Key Takeaways

- `RefCell<T>` allows you to bypass the strict compile-time Borrow Checker.
- It enforces the borrowing rules (one writer OR many readers) at **runtime** instead.
- If you break the borrowing rules while the program is running, it will instantly **Panic and crash**.
- It is incredibly useful for mutating data when the compiler thinks it should be immutable.
- It is most commonly used inside an `Rc` (written as `Rc<RefCell<T>>`) to allow multiple owners to mutate a shared piece of data.
- It is strictly for single-threaded programs.
