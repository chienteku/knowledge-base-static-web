# Memory Leaks & Reference Cycles

> **Level 11 — Smart Pointers & Advanced Types**
> Rust guarantees memory *safety*, but not memory *leak-freedom* — two `Rc`/`Arc` pointers that own each other can leak forever.

---

## 1. Prerequisites

- [`Rc<T>`](../level_03/rc_t.md) — The reference-counted smart pointer whose cycles cause leaks.
- [`Weak<T>`](../level_11/weak_t.md) — The tool specifically designed to break these cycles.
- [`Drop` Trait](../level_03/drop_trait.md) — What *fails to run* when a cycle leaks.

---

## 2. Term Category

**Safety Model Boundary (the deliberate gap)**: Rust's ownership system prevents dangling pointers, use-after-free, and data races at compile time. It does **not** prevent memory leaks. A leak — memory that is never freed even though it's unreachable and unused — is officially classified by Rust as a **safe** operation. This surprises many learners who assume "memory safe" means "leak-proof."

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

`Rc<T>`'s reference counter drops an allocation's data only when its **strong count reaches zero**. But what if `Rc` A holds a pointer to B, and `Rc` B holds a pointer back to A? Each one keeps the other's strong count above zero *forever*, even if nothing outside the cycle can reach either of them anymore. Neither `Drop` impl ever runs, and the memory is leaked for the rest of the program's life. Rust's borrow checker operates on *statically known* ownership graphs; it cannot look inside a `Rc<RefCell<T>>` at compile time to detect a cycle that only forms at *runtime*. So instead of trying (and failing) to prevent this at compile time, Rust made a deliberate design choice: leaking is defined as **safe** (it can never cause UB, a crash, or memory corruption — it just wastes memory), and gave you `Weak<T>` as the tool to break cycles yourself.

### (2) Reality Metaphor

Imagine two people, each holding the only key to the other person's front door, and refusing to leave until someone else lets them out.

- **Person A** (an `Rc`) says: "I'll only leave once B is gone."
- **Person B** (an `Rc`) says: "I'll only leave once A is gone."
- Nobody outside the house can see them anymore (they're **unreachable**), but they're both still technically "alive," locked in a mutual standoff, taking up space in the house (**the heap**) forever. No crime was committed (**it's safe**) — the house just never gets cleaned out.
- **`Weak<T>`** is agreeing that one of them holds a spare key that *doesn't* count as "still needing you here" — so when the other person leaves, this one can leave too.

### (3) Rust Code Examples

#### Short Snippet (Building a Leak on Purpose)
```rust
use std::cell::RefCell;
use std::rc::Rc;

struct Node {
    next: RefCell<Option<Rc<Node>>>,
}

fn main() {
    let a = Rc::new(Node { next: RefCell::new(None) });
    let b = Rc::new(Node { next: RefCell::new(None) });

    // A points to B...
    *a.next.borrow_mut() = Some(Rc::clone(&b));
    // ...and B points back to A. A cycle!
    *b.next.borrow_mut() = Some(Rc::clone(&a));

    // Both strong_counts are now 2, not 1. Neither will ever reach 0
    // when `a` and `b` go out of scope here. LEAKED. But still SAFE.
}
```

#### Fuller Example (Deliberate, Intentional Leaks)
Rust also gives you tools to leak *on purpose*, which is occasionally useful (e.g. for `'static` data created at startup).
```rust
fn main() {
    let boxed = Box::new(String::from("this will never be freed"));

    // Box::leak intentionally leaks the Box, returning a `&'static mut` reference.
    let leaked: &'static mut String = Box::leak(boxed);
    println!("{leaked}");

    // std::mem::forget does the same thing for any value: it disables its Drop.
    let another = String::from("also never freed");
    std::mem::forget(another);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Memory Leaks Scoping and Lifecycle Rules

**The mistake:** Assuming Memory Leaks instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("memory_leaks_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("memory_leaks_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Memory Leaks State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Memory Leaks through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Memory Leaks Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Memory Leaks instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Break the Cycle

**Problem:** In the "Short Snippet" example above, `Node.next` is `RefCell<Option<Rc<Node>>>`, which lets both `a` and `b` hold *strong* references to each other. Change only the type of one direction of the link (say, imagine a `parent` field alongside `next`, representing the back-pointer) so that a parent→child graph cannot leak.

> [!check]- Answer
> Use `Weak<Node>` for whichever direction represents "the pointer that shouldn't keep the other one alive" — typically the back-pointer (child → parent):
>
> ```rust
> use std::cell::RefCell;
> use std::rc::{Rc, Weak};
>
> struct Node {
>     parent: RefCell<Weak<Node>>,       // Weak: doesn't keep the parent alive.
>     children: RefCell<Vec<Rc<Node>>>,  // Rc: the parent DOES keep children alive.
> }
> ```
>
> Now the parent's strong count is only incremented by whoever *owns* it from outside the graph (or by other children), so it can reach zero and be dropped even while children still exist and hold a `Weak` reference back to it.

---

### Exercise 2: Intentional Memory Leakage via `Box::leak`

**Problem:** Leak a `Box<Vec<i32>>` to create a `'static` slice reference.

**Expected output:**
```
Static leaked slice: [1, 2, 3]
```

> [!check]- Answer
> ```rust
> fn main() {
>     let v = vec![1, 2, 3];
>     let leaked: &'static mut [i32] = Box::leak(v.into_boxed_slice());
>     println!("Static leaked slice: {:?}", leaked);
> }
> ```
>
> **Explanation:** `Box::leak` intentionally leaks heap memory to yield stable `'static` references.

### Exercise 3: Detecting Reference Cycles with `Rc`

**Problem:** Explain how reference cycles in `Rc<RefCell<Node>>` prevent destructor invocation.

**Expected output:**
```
Reference cycle memory leak verified
```

> [!check]- Answer
> fn main() {
>     println!("Reference cycle memory leak verified");
> }
> ```
>
> **Explanation:** Cyclic strong references keep ref counts > 0, preventing memory deallocation.

---

---

## 6. Related Terms

- [`Weak<T>`](../level_11/weak_t.md) — The non-owning pointer specifically designed to break reference cycles.
- [`Rc<T>`](../level_03/rc_t.md) / [`Arc<T>`](../level_03/arc_t.md) — The reference-counted pointers whose cycles cause leaks.
- [`Drop` Trait](../level_03/drop_trait.md) — The destructor that never runs on leaked data.
- [`std::mem` Utilities](../level_03/ownership.md) — `mem::forget` is the "intentional leak" primitive; see also `Box::leak`.

---

## 7. Key Takeaways

- Rust's memory-safety guarantees (no dangling pointers, no UB) do **not** include leak-freedom — a leak is officially a *safe* operation.
- The classic leak pattern is a **reference cycle**: two or more `Rc`/`Arc` pointers that keep each other's strong count above zero forever.
- `Weak<T>` breaks cycles by holding a reference that doesn't count toward the strong count, so the cycle can still be fully collected.
- You can also leak *intentionally* and safely with `Box::leak` or `std::mem::forget`, which is occasionally useful for genuinely `'static` data.
