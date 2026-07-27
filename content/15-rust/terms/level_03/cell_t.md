# `Cell<T>`

> **Level 3 — Ownership & Borrowing**
> A smart pointer for interior mutability of `Copy` types without borrowing overhead.

---

## 1. Prerequisites

- [`RefCell<T>`](../level_03/refcell_t.md) — The heavy-duty tool that `Cell` is an optimization of.
- [`Copy` Trait](../level_03/copy_trait.md) — The trait that allows `Cell` to be so incredibly fast.
- [Interior Mutability](../level_03/interior_mutability.md) — (Future Reference) The design pattern that both `Cell` and `RefCell` enable.

---

## 2. Term Category

**Rust-specific (the lightweight optimization)**: `Cell` provides the exact same superpower as `RefCell` (bypassing the strict Borrow Checker), but it is heavily optimized specifically for small, simple data types.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

We know that `RefCell` allows us to bypass the Borrow Checker and mutate data that the compiler thinks is immutable. But `RefCell` achieves this by keeping an internal "guard" counter that tracks how many borrows are active. Updating and checking this counter takes CPU cycles. If you make a mistake, the guard crashes your program.

But what if the data you want to mutate is just a simple `i32` score counter? 

Tracking references and enforcing borrow rules for a tiny `i32` is massive overkill. Because an `i32` implements the `Copy` trait, you don't even *need* a reference to read it; you can just copy the whole number instantly! 

This is what **`Cell<T>`** does. It bypasses the Borrow Checker entirely *without* any runtime tracking guards. It never gives out references; it only gives out copies. Because there are no references, you can never violate the "One Mutable Borrow" rule, meaning it is blazing fast and impossible to `panic!`.

### (2) Reality Metaphor

Imagine wanting to share a secret family recipe.

**`RefCell`** is a heavily guarded library. To look at the recipe, you have to sign a logbook (the runtime guard). If two people try to sign out the only copy at the exact same time to edit it, the guard violently kicks you out (a `panic!`).

**`Cell<T>`** is a cheap copy machine. There are no guards, no logbooks, and no borrowing. If you want to read the recipe, you just press a button and instantly print a duplicate copy for yourself (`.get()`). If you want to update it, you just print a new piece of paper and permanently overwrite the master copy (`.set()`). Because everyone just makes cheap copies, nobody ever fights over who is holding the original paper. There are no rules, and no crashes.

### (3) Rust Code Examples

#### Short Snippet (The Faster Alternative)
To read data inside a `Cell`, you call `.get()`. To overwrite the data, you call `.set()`. Notice that neither method requires an `&mut` reference!
```rust
use std::cell::Cell;

fn main() {
    // 1. We create an immutable variable
    let score = Cell::new(10);
    
    // 2. We overwrite the value. No `.borrow_mut()` needed! No Panics!
    score.set(20);
    
    // 3. We retrieve a COPY of the value.
    let current_score = score.get();
    
    println!("The score is: {}", current_score);
}
```

#### Fuller Example (Sharing with Rc)
Just like `RefCell`, `Cell` is almost always wrapped inside an `Rc` so that multiple owners can mutate a shared counter.

```rust
use std::rc::Rc;
use std::cell::Cell;

fn main() {
    // A shared counter wrapped in a Cell
    let shared_counter = Rc::new(Cell::new(0));
    
    let user1 = Rc::clone(&shared_counter);
    let user2 = Rc::clone(&shared_counter);
    
    // Both users can freely update the counter without causing a panic!
    user1.set(user1.get() + 1);
    user2.set(user2.get() + 1);
    
    println!("Total clicks: {}", shared_counter.get()); // Prints 2
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Cell T Scoping and Lifecycle Rules

**The mistake:** Assuming Cell T instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("cell_t_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("cell_t_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Cell T State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Cell T through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Cell T Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Cell T instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Heavyweight Refactor

**Problem:** The code below works, but it uses the heavy, crash-prone `RefCell` just to track a simple boolean. Refactor the code to use the much faster, safer `Cell` instead.

```rust
use std::cell::RefCell;

fn main() {
    let is_active = RefCell::new(false);
    
    // TODO: Update this to use Cell methods
    *is_active.borrow_mut() = true;
    
    // TODO: Update this to use Cell methods
    println!("Is active? {}", is_active.borrow());
}
```

> [!check]- Answer
> 1. Change the import to `use std::cell::Cell;`
> 2. Change the initialization to `Cell::new(false);`
> 3. Change the mutation to `is_active.set(true);`
> 4. Change the read to `is_active.get()`

---

### Exercise 2: Interior Mutability with `Cell`

**Problem:** Create a struct `Logger { count: Cell<u32> }` with an `&self` method `fn log(&self)` that increments `count`.

**Expected output:**
```
Log count: 1
```

> [!check]- Answer
> use std::cell::Cell;
> struct Logger { count: Cell<u32> }
> impl Logger {
>     fn log(&self) {
>         self.count.set(self.count.get() + 1);
>     }
> }
> fn main() {
>     let logger = Logger { count: Cell::new(0) };
>     logger.log();
>     println!("Log count: {}", logger.count.get());
> }
> ```
>
> **Explanation:** `Cell<T>` provides zero-overhead interior mutability for `Copy` types behind immutable `&self` references.

### Exercise 3: Swapping Cell Values with `replace`

**Problem:** Use `cell.replace(100)` to swap values in a `Cell<i32>` and print the previous value.

**Expected output:**
```
Old: 42, New: 100
```

> [!check]- Answer
> use std::cell::Cell;
> fn main() {
>     let cell = Cell::new(42);
>     let old = cell.replace(100);
>     println!("Old: {}, New: {}", old, cell.get());
> }
> ```
>
> **Explanation:** `.replace()` stores new values inside `Cell` while returning old values in a single atomic operation.

---

## 6. Related Terms

- [`RefCell<T>`](../level_03/refcell_t.md) — The heavy-duty version of `Cell` used for Heap data (like `String` and `Vec`).
- [Interior Mutability](../level_03/interior_mutability.md) — The official name for the design pattern that both `Cell` and `RefCell` enable.

---

## 7. Key Takeaways

- `Cell<T>` allows you to bypass the strict Borrow Checker and mutate data that is declared as immutable.
- Unlike `RefCell`, it has **zero runtime overhead** and will **never panic**.
- It achieves this by never giving out references. It only ever gives out cheap copies of the data.
- Because it relies on cheap copies, it is only meant for data that implements the **`Copy` trait** (like `i32`, `bool`, `f64`).
- To read the data, use `.get()`. To overwrite the data, use `.set()`.
