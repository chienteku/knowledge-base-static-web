# `VecDeque<T>`

> **Level 2 — Control Flow & Data Structures**
> A double-ended queue (ring buffer) with O(1) push/pop at *both* ends.

---

## 1. Prerequisites

- [`Vec<T>`](../level_02/vec_t.md) — The single-ended growable array this type generalizes.
- [`IntoIterator`](../level_06/intoiterator.md) — What lets a `VecDeque` be used in a `for` loop.

---

## 2. Term Category

**Collection Type (the two-ended array)**: `VecDeque<T>` ("deque" = double-ended queue) behaves like a `Vec<T>` that's efficient to push and pop from **both** the front and the back, not just the back. It's Rust's standard choice whenever you need queue or ring-buffer behavior.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

`Vec<T>` is excellent at appending/removing from the **end** (`.push()`/`.pop()`, both O(1) amortized), but removing from the **front** (`.remove(0)`) is O(n) — every remaining element has to physically shift left by one slot. This makes `Vec` a poor fit for queues (FIFO: first-in-first-out), where you constantly add at one end and remove from the other. `VecDeque<T>` fixes this by storing its data as a **ring buffer**: a fixed-capacity block of memory where the "start" and "end" are just tracked indices that can wrap around, so both ends can grow or shrink in O(1) without shifting anything.

### (2) Reality Metaphor

Imagine a line of people waiting to board a subway car that has doors on **both** ends.

- **`Vec` behavior**: Only the back door works. If someone needs to leave from the front of the line, everyone behind them has to shuffle forward one spot to close the gap — slow if the line is long.
- **`VecDeque` behavior**: Both doors work. People can board or exit from the front *or* the back instantly, without anyone else in line needing to move at all — the car simply tracks "where does the line currently start and end."

### (3) Rust Code Examples

#### Short Snippet (A FIFO Queue)
```rust
use std::collections::VecDeque;

fn main() {
    let mut queue: VecDeque<&str> = VecDeque::new();

    queue.push_back("first-in-line");
    queue.push_back("second-in-line");
    queue.push_back("third-in-line");

    // pop_front: O(1), unlike Vec's O(n) `.remove(0)`.
    while let Some(person) = queue.pop_front() {
        println!("Serving: {person}");
    }
    // Serving: first-in-line
    // Serving: second-in-line
    // Serving: third-in-line
}
```

#### Fuller Example (A Sliding-Window / Ring Buffer)
```rust
use std::collections::VecDeque;

// Keeps only the last N items seen, evicting the oldest when full.
struct SlidingWindow<T> {
    buffer: VecDeque<T>,
    capacity: usize,
}

impl<T> SlidingWindow<T> {
    fn new(capacity: usize) -> Self {
        Self { buffer: VecDeque::with_capacity(capacity), capacity }
    }

    fn push(&mut self, item: T) {
        if self.buffer.len() == self.capacity {
            self.buffer.pop_front(); // Evict oldest — O(1)!
        }
        self.buffer.push_back(item); // Add newest — O(1)!
    }
}

fn main() {
    let mut window: SlidingWindow<i32> = SlidingWindow::new(3);
    for i in 1..=5 {
        window.push(i);
    }
    println!("{:?}", window.buffer); // [3, 4, 5] — only the last 3 survive
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Vecdeque T Scoping and Lifecycle Rules

**The mistake:** Assuming Vecdeque T instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("vecdeque_t_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("vecdeque_t_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Vecdeque T State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Vecdeque T through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Vecdeque T Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Vecdeque T instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Spot the Inefficiency

**Problem:** This function processes a `Vec<i32>` as a queue, removing and printing the front element repeatedly. What's the Big-O complexity of the whole loop, and how would switching to `VecDeque` change it?

```rust
fn process(mut items: Vec<i32>) {
    while !items.is_empty() {
        let front = items.remove(0);
        println!("{front}");
    }
}
```

> [!check]- Answer
> The loop is **O(n²)** overall: each `.remove(0)` is O(n) (every remaining element shifts left), and it runs n times.
>
> Switching `items: Vec<i32>` to `items: VecDeque<i32>` and `.remove(0)` to `.pop_front()` (which returns `Option<i32>`) drops this to **O(n)** total — each pop becomes O(1).

---

### Exercise 2: Double-Ended Queue Operations

**Problem:** Push `1` to front and `2` to back of a `VecDeque`. Pop items from front and back.

**Expected output:**
> [!check]- Answer
> ```
> Front: 1, Back: 2
> ```
> ```rust
> use std::collections::VecDeque;
> fn main() {
>     let mut q = VecDeque::new();
>     q.push_front(1);
>     q.push_back(2);
>     println!("Front: {}, Back: {}", q.pop_front().unwrap(), q.pop_back().unwrap());
> }
> ```
>
> **Explanation:** `VecDeque` efficiently supports pushing/popping from both ends.

---

### Exercise 3: Ring Buffer Rotation

**Problem:** Rotate a `VecDeque` of elements `[1, 2, 3]` left by 1 position using `.rotate_left(1)`.

**Expected output:**
> [!check]- Answer
> ```
> [2, 3, 1]
> ```
> ```rust
> use std::collections::VecDeque;
> fn main() {
>     let mut q: VecDeque<_> = [1, 2, 3].into();
>     q.rotate_left(1);
>     println!("{:?}", q);
> }
> ```
>
> **Explanation:** `.rotate_left(k)` rotates ring buffer elements in-place in `O(k)` time.

---

---

## 6. Related Terms

- [`Vec<T>`](../level_02/vec_t.md) — The single-ended sibling; `VecDeque` is the right choice specifically when front-end operations matter too.
- [`IntoIterator`](../level_06/intoiterator.md) — `VecDeque` implements this, so it works directly in `for` loops.
- [Channel (`mpsc`)](../level_09/channel_mpsc.md) — Conceptually related: both model a FIFO queue, though `mpsc` adds cross-thread synchronization that a plain `VecDeque` does not have.

---

## 7. Key Takeaways

- `VecDeque<T>` offers O(1) push/pop at **both** the front (`push_front`/`pop_front`) and the back (`push_back`/`pop_back`).
- It's implemented as a ring buffer, so no element-shifting occurs when the "logical start" of the data moves.
- Use it whenever you need queue (FIFO) or sliding-window/ring-buffer behavior — situations where `Vec`'s `.remove(0)` would otherwise be a silent O(n) trap.
- It still supports most `Vec`-like operations (indexing, iteration, `.len()`), so it's a near-drop-in replacement wherever front access matters.
