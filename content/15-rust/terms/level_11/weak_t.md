# `Weak<T>`

> **Level 11 — Smart Pointers & Advanced Types**
> A non-owning reference used with `Rc`/`Arc` to break reference cycles.

---

## 1. Prerequisites

- [`Rc<T>`](../level_03/rc_t.md) — The Reference Counted smart pointer used for shared ownership.
- [`Arc<T>`](../level_03/arc_t.md) — The thread-safe version of `Rc`.
- [Memory Leaks](../level_11/memory_leaks.md) — The problem `Weak` is designed to solve.

---

## 2. Term Category

**Rust-specific (the cycle breaker)**: `Weak<T>` is a companion smart pointer to `Rc<T>` and `Arc<T>`. 

While an `Rc` represents "Ownership" (it increases the *strong* reference count, physically preventing the data from being deleted), a `Weak` represents a "Non-Owning Reference". It allows you to point to data, but it does *not* prevent that data from being deleted if all the strong `Rc`s go away!

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The biggest flaw of `Rc<T>` (Reference Counting) is **Reference Cycles**. 

If Object A holds an `Rc` pointing to Object B, and Object B holds an `Rc` pointing to Object A, their "strong counts" will always be at least 1. Their reference counts will *never* drop to zero! Even if the rest of your program completely forgets about them, they will keep each other alive forever. This creates a massive **Memory Leak**. 

To solve this, Rust provides `Weak<T>`. A `Weak` pointer points to the data, but it only increments the "weak count". If all the strong `Rc`s are dropped, the data is instantly deleted, even if 100 `Weak` pointers still exist!

### (2) Reality Metaphor

Imagine a VIP Nightclub (the Heap memory).

- **`Rc<T>`**: You are a VIP Member. As long as you (`Rc`) are inside the club, the club stays open. If you leave, and no other VIPs are inside, the club closes and the power shuts off.
- **`Weak<T>`**: You are a Janitor. You are allowed to be in the club, but you have no power to keep it open. If all the VIPs leave, the club closes, the power shuts off, and you are kicked out. When a Janitor wants to use a machine inside the club, they must first check if the power is still on (by trying to "upgrade" to an `Rc`). If the power is off, the Janitor gets nothing.

### (3) Rust Code Examples

#### Short Snippet (Downgrading and Upgrading)
You create a `Weak` pointer by "downgrading" an `Rc`. To use the data inside a `Weak`, you must "upgrade" it back into an `Option<Rc>`.

```rust
use std::rc::{Rc, Weak};

fn main() {
    let strong_rc = Rc::new(100);
    
    // We create a Weak pointer (downgrading)
    let weak_ptr: Weak<i32> = Rc::downgrade(&strong_rc);
    
    // We CANNOT use weak_ptr directly! We must upgrade it.
    // It returns Option<Rc> because the data might have been deleted!
    if let Some(upgraded_rc) = weak_ptr.upgrade() {
        println!("The data still exists! {}", upgraded_rc);
    }
}
```

#### Fuller Example (Breaking the Cycle)
The most common use case is building a Tree data structure. A `Node` needs an `Rc` to its children (so it owns them). But a child needs to know who its parent is! 

If the child holds an `Rc` to its parent, they will leak memory forever. The child must hold a `Weak` pointer to its parent!

```rust
use std::rc::{Rc, Weak};
use std::cell::RefCell;

struct Node {
    value: i32,
    // Parent owns the children
    children: RefCell<Vec<Rc<Node>>>, 
    // Children do NOT own the parent! (Breaking the cycle)
    parent: RefCell<Weak<Node>>, 
}

fn main() {
    let leaf = Rc::new(Node {
        value: 3,
        children: RefCell::new(vec![]),
        parent: RefCell::new(Weak::new()), // No parent yet
    });

    let branch = Rc::new(Node {
        value: 5,
        children: RefCell::new(vec![Rc::clone(&leaf)]),
        parent: RefCell::new(Weak::new()),
    });

    // The leaf points up to the branch using a Weak pointer!
    *leaf.parent.borrow_mut() = Rc::downgrade(&branch);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Weak T Scoping and Lifecycle Rules

**The mistake:** Assuming Weak T instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("weak_t_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("weak_t_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Weak T State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Weak T through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Weak T Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Weak T instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Death of the Data

**Problem:** You have an allocation on the Heap. It has a Strong Count of `0`, and a Weak Count of `5`. Does the data on the Heap still exist?

> [!check]- Answer
> **No!** 
>
> The actual data is instantly deleted the exact moment the Strong Count hits 0. The 5 Weak pointers are now just pointing to an empty "dead" allocation block. If they call `.upgrade()`, they will safely receive `None`.

---

### Exercise 2: Upgrading Weak Pointers

**Problem:** Downgrade an `Rc<i32>` to `Weak<i32>`, upgrade it, and print value.

**Expected output:**
```
Upgraded value: 42
```

> [!check]- Answer
> ```rust
> use std::rc::Rc;
> fn main() {
>     let strong = Rc::new(42);
>     let weak = Rc::downgrade(&strong);
>     if let Some(val) = weak.upgrade() {
>         println!("Upgraded value: {}", *val);
>     }
> }
> ```
>
> **Explanation:** `.upgrade()` returns `Some(Rc<T>)` if the target memory allocation is still active.

### Exercise 3: Handling Dropped Weak Pointers

**Problem:** Drop strong reference `strong` and verify `weak.upgrade()` returns `None`.

**Expected output:**
```
Weak upgrade returned None
```

> [!check]- Answer
> use std::rc::Rc;
> fn main() {
>     let strong = Rc::new(42);
>     let weak = Rc::downgrade(&strong);
>     drop(strong);
>     assert!(weak.upgrade().is_none());
>     println!("Weak upgrade returned None");
> }
> ```
>
> **Explanation:** When all strong references are dropped, weak upgrades return `None`.

---

## 6. Related Terms

- [`Rc<T>`](../level_03/rc_t.md) — The strong pointer that actually keeps data alive.
- [`RefCell<T>`](../level_03/refcell_t.md) — Usually used inside the `Rc` to allow the parent and child to mutate each other!

---

## 7. Key Takeaways

- **`Weak<T>`** is a non-owning companion to `Rc` and `Arc`.
- It allows you to point to data without incrementing the "strong count".
- It exists specifically to prevent **Memory Leaks** caused by **Reference Cycles** (e.g., in Trees, where a child points back to a parent).
- To actually use the data inside a `Weak`, you must call **`.upgrade()`**, which returns an `Option<Rc<T>>`.
- If the strong count hits 0, the data is instantly deleted, and `.upgrade()` will safely return `None`.
