# Interior Mutability

> **Level 3 — Ownership & Borrowing**
> A design pattern allowing data mutation even when there are immutable references to it.

---

## 1. Prerequisites

- [Borrow Checker](../level_03/borrow_checker.md) — The strict compile-time cop that this pattern is designed to bypass.
- [`RefCell<T>`](../level_03/refcell_t.md) — The standard tool used to implement this pattern for Heap data.
- [`Cell<T>`](../level_03/cell_t.md) — The lightweight tool used to implement this pattern for simple Stack data.

---

## 2. Term Category

**Rust-specific (the overarching design pattern)**: This is the official architectural name for the superpower provided by `Cell` and `RefCell`. In other languages, mutability is a free-for-all. In Rust, you must explicitly use the Interior Mutability pattern to legally bypass the compiler's safety checks.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The compiler enforces a strict rule: if a variable is borrowed immutably (`&self`), you absolutely cannot change its data. 

But sometimes, a data structure needs to appear completely read-only to the outside world, while secretly updating data on the inside. For example, imagine a `Logger` that implements a strict trait requiring `fn log(&self, msg: &str)`. The method signature explicitly forbids mutation (`&self`), but the logger *must* push the new message into its internal `Vec`! 

To solve this, we use the **Interior Mutability** pattern. By wrapping the `Vec` in a `RefCell`, we can mutate the data on the *inside* (`.borrow_mut()`), even when the *outside* struct is entirely immutable (`&self`).

### (2) Reality Metaphor

Imagine an intricate mechanical clock hanging on the wall. 

To you (the outside user), the clock is a completely **immutable** object. You can't reach in and physically turn the gears. You just look at the face of the clock (`&self`). 

However, *inside* the wooden box, the gears are constantly turning, mutating their state every single second. The clock possesses **Interior Mutability**. It looks entirely read-only on the outside, but safely modifies itself on the inside.

### (3) Rust Code Examples

#### Short Snippet (The Immutable Mutation)
Notice how the `update_cache` method takes `&self` (immutable), yet successfully changes the value of `cached_value`!

```rust
use std::cell::RefCell;

struct DataCache {
    // We wrap our data in a RefCell to enable Interior Mutability
    cached_value: RefCell<String>,
}

impl DataCache {
    // DANGER: We only take `&self` (Read-only)!
    fn update_cache(&self, new_data: &str) {
        // We bypass the read-only restriction using `.borrow_mut()`
        let mut inner_data = self.cached_value.borrow_mut();
        inner_data.clear();
        inner_data.push_str(new_data);
    }
}

fn main() {
    let cache = DataCache { cached_value: RefCell::new(String::from("Old Data")) };
    
    cache.update_cache("New Data"); // It works!
    
    println!("Cache: {}", cache.cached_value.borrow());
}
```

#### Fuller Example (The Mock Logger)
This is the most famous use-case for Interior Mutability: writing "Mock" objects for unit tests. We want to test a function that requires a `Messenger` trait. The trait requires `&self`, but our Mock object needs to save the messages to prove the test passed!

```rust
use std::cell::RefCell;

// 1. The Trait is strictly read-only
trait Messenger {
    fn send(&self, msg: &str);
}

// 2. Our Mock object uses Interior Mutability to cheat
struct MockMessenger {
    sent_messages: RefCell<Vec<String>>,
}

impl Messenger for MockMessenger {
    // 3. We are forced to use `&self` to satisfy the Trait...
    fn send(&self, msg: &str) {
        // ...but we can still push to the Vec because of RefCell!
        self.sent_messages.borrow_mut().push(String::from(msg));
    }
}

fn main() {
    let mock = MockMessenger { sent_messages: RefCell::new(vec![]) };
    
    // Send a message using the read-only method
    mock.send("Alert: Server overload!");
    
    // Prove that the data was mutated!
    println!("Messages sent: {:?}", mock.sent_messages.borrow());
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Interior Mutability Scoping and Lifecycle Rules

**The mistake:** Assuming Interior Mutability instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("interior_mutability_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("interior_mutability_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Interior Mutability State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Interior Mutability through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Interior Mutability Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Interior Mutability instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Right Tool for the Job

**Problem:** Match the correct Interior Mutability tool to its description.

**Tools:** `RefCell<T>`, `Cell<T>`, `Mutex<T>`

1. Provides Interior Mutability for small, `Copy` data (like `i32`) with zero runtime overhead.
2. Provides Interior Mutability for Heap data (like `String`), but only works on a single thread.
3. Provides Interior Mutability for Heap data safely across multiple background threads.

> [!check]- Answer
> 1. `Cell<T>`
> 2. `RefCell<T>`
> 3. `Mutex<T>`

---

### Exercise 2: Combining `Rc` and `RefCell` for Shared Mutable Graph Nodes

**Problem:** Create a shared node `Rc<RefCell<i32>>` and mutate its inner integer from two independent `Rc` clones.

**Expected output:**
```
Val: 100
```

> [!check]- Answer
> ```rust
> use std::rc::Rc;
> use std::cell::RefCell;
> fn main() {
>     let node = Rc::new(RefCell::new(42));
>     let clone = Rc::clone(&node);
>     *clone.borrow_mut() = 100;
>     println!("Val: {}", node.borrow());
> }
> ```
>
> **Explanation:** `Rc<RefCell<T>>` combines multiple reference ownership with runtime interior mutability.

### Exercise 3: Safe Interior Mutability with `Mutex`

**Problem:** Mutate a thread-safe `Mutex<u32>` using `.lock().unwrap()`.

**Expected output:**
```
Mutex val: 10
```

> [!check]- Answer
> use std::sync::Mutex;
> fn main() {
>     let m = Mutex::new(0);
>     *m.lock().unwrap() += 10;
>     println!("Mutex val: {}", m.lock().unwrap());
> }
> ```
>
> **Explanation:** `Mutex<T>` enforces thread-safe exclusive access via dynamic lock guards.

---

## 6. Related Terms

- [`RefCell<T>`](../level_03/refcell_t.md) — The primary tool used to achieve Interior Mutability in single-threaded code.
- [`Cell<T>`](../level_03/cell_t.md) — The lightweight tool used to achieve Interior Mutability for simple `Copy` data.
- [`Mutex<T>`](../level_09/mutex_t.md) — The thread-safe tool used to achieve Interior Mutability across background threads.

---

## 7. Key Takeaways

- **Interior Mutability** is a design pattern in Rust that allows you to safely mutate data even when there are only immutable references (`&`) pointing to it.
- It is achieved by wrapping data in "smart pointers" like `RefCell<T>`, `Cell<T>`, or `Mutex<T>`.
- It is incredibly useful for implementing Traits that require an immutable `&self` reference, but where you still need to secretly update internal state (like caching data or recording test logs).
- It should be used sparingly. Bypassing compile-time safety checks means risking runtime panics or performance penalties.
