# Smart Pointers (`Box`, `Rc`, `Arc`)

> **Level 10 — Rust**
> Heap-allocating pointer types that implement `Deref` and `Drop`: `Box<T>` for unique ownership, `Rc<T>` for single-threaded reference counting, `Arc<T>` for thread-safe shared ownership.

---

## 1. Prerequisites

- [`Box<T>`](../level_03/box_t.md) — Box heap allocation.

---

## 2. Term Category



**Rust Abstraction Pattern (heap pointer & ownership wrappers)**: Smart pointers (`Box<T>`, `Rc<T>`, `Arc<T>`, `RefCell<T>`) providing memory allocation and ownership semantics.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Standard references (`&T`, `&mut T`) do not own data and cannot represent complex heap allocations, reference-counted sharing, or interior mutability.

Smart Pointers are structs implementing `Deref` and `Drop` traits. `Box<T>` manages unique heap allocation; `Rc<T>` enables single-threaded reference counting; `Arc<T>` enables thread-safe atomic reference counting; `RefCell<T>` enforces borrow rules dynamically at runtime.

### (2) Reality Metaphor

A shipping vault with automatic security monitoring: wrapping valuable cargo in specialized protective containers (`Box`, `Arc`) with automated logging sensors (`RefCell`) and automatic disposal (`Drop`).

### (3) Rust Code Examples

#### Short Snippet
```rust
use std::sync::Arc;
let val = Arc::new(42);
let clone = Arc::clone(&val);
assert_eq!(*clone, 42);
```

#### Fuller Example
```rust
use std::cell::RefCell;
use std::rc::Rc;

pub struct Node {
    pub val: i32,
    pub next: Option<Rc<RefCell<Node>>>,
}

fn main() {
    let node1 = Rc::new(RefCell::new(Node { val: 10, next: None }));
    let node2 = Rc::new(RefCell::new(Node { val: 20, next: Some(node1.clone()) }));
    
    assert_eq!(node2.borrow().val, 20);
    assert_eq!(node2.borrow().next.as_ref().unwrap().borrow().val, 10);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using `Rc<T>` Across Thread Boundaries

**The mistake:** Attempting to pass an `Rc<T>` smart pointer into `std::thread::spawn`.

**Why it is wrong:** `Rc<T>` uses non-atomic reference counting for speed. It does not implement `Send` or `Sync` and cannot cross thread boundaries.

*Incorrect:*
```rust
let rc = Rc::new(5); thread::spawn(move || { println!("{rc}"); }); // Compiler error!
```

*Fix:*
```rust
Use Arc<T> for multi-threaded shared ownership!
```

### Mistake 2: Creating Reference Cycles with `Rc` / `Arc` (Memory Leaks)

**The mistake:** Creating circular references where Node A holds `Rc<Node B>` and Node B holds `Rc<Node A>`.

**Why it is wrong:** Reference counts never drop to zero, leaking memory permanently.

*Incorrect:*
```rust
node_a.next = Some(node_b.clone()); node_b.next = Some(node_a.clone()); // Reference leak!
```

*Fix:*
```rust
Break cycles using std::rc::Weak<T> or std::sync::Weak<T>!
```

### Mistake 3: Triggering Runtime Panics with `RefCell` Double Borrowing

**The mistake:** Borrowing `RefCell` mutably while an active shared borrow exists.

**Why it is wrong:** `RefCell` checks borrow rules at runtime. Calling `.borrow_mut()` while `.borrow()` is live causes a runtime panic.

*Incorrect:*
```rust
let cell = RefCell::new(5); let r = cell.borrow(); let mut m = cell.borrow_mut(); // Panic!
```

*Fix:*
```rust
Scope borrows tightly or use .try_borrow() / .try_borrow_mut()!
```

---

## 5. Practice Exercises

### Exercise 1: Shared Multi-Reader Cache Using `Arc<Vec<String>>`

**Scenario:** Build a thread-safe static dataset cache sharing a large string array across 3 worker threads using `Arc`.

**Requirements:**
1. Create dataset wrapped in `Arc::new(vec![...])`.
1. Spawn 3 worker threads using `Arc::clone`.
1. Read data concurrently.
1. Join threads.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::sync::Arc;
> use std::thread;
> 
> pub fn process_shared_dataset(dataset: Vec<String>) -> usize {
>     let shared_data = Arc::new(dataset);
>     let mut handles = Vec::new();
> 
>     for _ in 0..3 {
>         let data_clone = Arc::clone(&shared_data);
>         let handle = thread::spawn(move || {
>             data_clone.len()
>         });
>         handles.push(handle);
>     }
> 
>     let mut total_len = 0;
>     for h in handles {
>         total_len += h.join().unwrap();
>     }
>     total_len
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_arc_sharing() {
>         let data = vec!["apple".into(), "banana".into()];
>         assert_eq!(process_shared_dataset(data), 6);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `Arc` provides thread-safe atomic reference counting.
> 2. `Arc::clone` increments reference counter zero-copy.

---

### Exercise 2: Recursive Data Structure Using `Box<T>`

**Scenario:** Implement a recursive binary search tree node `TreeNode` using `Box<TreeNode>`.

**Requirements:**
1. Define `TreeNode` with `left: Option<Box<TreeNode>>` and `right`.
1. Insert values.
1. Test tree traversal.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub struct TreeNode {
>     pub val: i32,
>     pub left: Option<Box<TreeNode>>,
>     pub right: Option<Box<TreeNode>>,
> }
> 
> impl TreeNode {
>     pub fn new(val: i32) -> Self {
>         Self { val, left: None, right: None }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_binary_tree_box() {
>         let mut root = TreeNode::new(10);
>         root.left = Some(Box::new(TreeNode::new(5)));
>         root.right = Some(Box::new(TreeNode::new(15)));
> 
>         assert_eq!(root.left.as_ref().unwrap().val, 5);
>         assert_eq!(root.right.as_ref().unwrap().val, 15);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `Box<T>` allocates recursive struct fields on the heap to break infinite size compilation recursion.

---

### Exercise 3: Interior Mutability Logger Using `RefCell`

**Scenario:** Build a mock logger component implementing a read-only trait while recording log entries inside `RefCell<Vec<String>>`.

**Requirements:**
1. Define `Logger` trait `fn log(&self, msg: &str)`.
1. Implement `MockLogger` using `RefCell`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::cell::RefCell;
> 
> pub trait Logger {
>     fn log(&self, msg: &str);
> }
> 
> pub struct MockLogger {
>     pub logs: RefCell<Vec<String>>,
> }
> 
> impl MockLogger {
>     pub fn new() -> Self { Self { logs: RefCell::new(Vec::new()) } }
> }
> 
> impl Logger for MockLogger {
>     fn log(&self, msg: &str) {
>         self.logs.borrow_mut().push(msg.to_string());
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_refcell_logger() {
>         let logger = MockLogger::new();
>         logger.log("event_1");
>         logger.log("event_2");
> 
>         assert_eq!(logger.logs.borrow().len(), 2);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `RefCell` enables interior mutability (mutating inner data through shared `&self` reference).

---

## 5. Related Terms

- [`Deref` / `DerefMut` Traits](../level_14/deref_deref_mut_traits.md)
- [Stack vs Heap](../level_15/stack_vs_heap.md)
- [`Box<T>`](../level_03/box_t.md) — Box pointer.
- [`Rc<T>`](../level_03/rc_t.md) — Reference counted pointer.
- [`Arc<T>`](../level_03/arc_t.md) — Atomic reference counted pointer.

---

## 7. Key Takeaways

- `Box<T>` provides unique heap allocation.
- `Rc<T>` provides single-threaded reference counting; `Arc<T>` provides thread-safe reference counting.
- `RefCell<T>` provides single-threaded interior mutability checked at runtime.
- Break reference cycles using `Weak<T>` pointers.
