# `Weak<T>`

> **Level 11 — Smart Pointers & Advanced Types**
> A non-owning reference used with `Rc`/`Arc` to break reference cycles.

---

## 1. Prerequisites


- [`Rc<T>`](../level_03/rc_t.md) — The Reference Counted smart pointer used for shared ownership.
- [`Arc<T>`](../level_03/arc_t.md) — The thread-safe version of `Rc`.

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

---

## 5. Practice Exercises

### Exercise 1: Asynchronous Event Bus with Weak Subscriber Registration

**Scenario:** 
In high-throughput event-driven systems (such as UI event loops or pub-sub message brokers), subscribers register handles with a central dispatcher. If the dispatcher holds strong `Arc<T>` references to subscribers, subscribers are kept alive forever by the dispatcher—causing severe memory leaks when UI elements or worker tasks finish their work.

Implement a thread-safe `EventBroker<M>` that stores subscriber handles as `Vec<Weak<SubscriberHandle<M>>>`:
1. Define `SubscriberHandle<M>` containing `id: u64` and `log: Mutex<Vec<M>>`.
2. Implement `EventBroker::subscribe(&self, handle: &Arc<SubscriberHandle<M>>)` using `Arc::downgrade`.
3. Implement `EventBroker::publish(&self, msg: M) -> usize` which iterates through subscribers, attempts `.upgrade()` on each `Weak` reference, delivers `msg` to surviving subscribers, and purges expired `Weak` handles using `Vec::retain`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::sync::{Arc, Mutex, Weak};
>
> pub struct SubscriberHandle<M> {
>     pub id: u64,
>     pub log: Mutex<Vec<M>>,
> }
>
> impl<M> SubscriberHandle<M> {
>     pub fn new(id: u64) -> Arc<Self> {
>         Arc::new(Self {
>             id,
>             log: Mutex::new(Vec::new()),
>         })
>     }
>
>     pub fn received_messages(&self) -> Vec<M>
>     where
>         M: Clone,
>     {
>         self.log.lock().unwrap().clone()
>     }
> }
>
> pub struct EventBroker<M> {
>     subscribers: Mutex<Vec<Weak<SubscriberHandle<M>>>>,
> }
>
> impl<M: Clone> EventBroker<M> {
>     pub fn new() -> Self {
>         Self {
>             subscribers: Mutex::new(Vec::new()),
>         }
>     }
>
>     pub fn subscribe(&self, handle: &Arc<SubscriberHandle<M>>) {
>         let mut subs = self.subscribers.lock().unwrap();
>         subs.push(Arc::downgrade(handle));
>     }
>
>     pub fn publish(&self, msg: M) -> usize {
>         let mut subs = self.subscribers.lock().unwrap();
>         let mut delivered_count = 0;
>
>         // Retain only weak references that successfully upgrade
>         subs.retain(|weak_ref| {
>             if let Some(sub) = weak_ref.upgrade() {
>                 sub.log.lock().unwrap().push(msg.clone());
>                 delivered_count += 1;
>                 true
>             } else {
>                 false // Purge dead subscriber handle
>             }
>         });
>
>         delivered_count
>     }
>
>     pub fn subscriber_count(&self) -> usize {
>         self.subscribers.lock().unwrap().len()
>     }
> }
>
> #[cfg(test)]
> mod tests {
>     use super::*;
>
>     #[test]
>     fn test_event_broker_weak_lifecycle() {
>         let broker = EventBroker::<String>::new();
>
>         let sub1 = SubscriberHandle::new(1);
>         let sub2 = SubscriberHandle::new(2);
>
>         broker.subscribe(&sub1);
>         broker.subscribe(&sub2);
>
>         assert_eq!(broker.subscriber_count(), 2);
>
>         // Publish message to both active subscribers
>         let delivered = broker.publish("Event A".to_string());
>         assert_eq!(delivered, 2);
>         assert_eq!(sub1.received_messages(), vec!["Event A".to_string()]);
>         assert_eq!(sub2.received_messages(), vec!["Event A".to_string()]);
>
>         // Drop sub2 (strong count drops to 0)
>         drop(sub2);
>
>         // Publish event B: delivers to sub1 and automatically cleans up sub2's weak reference
>         let delivered2 = broker.publish("Event B".to_string());
>         assert_eq!(delivered2, 1);
>         assert_eq!(broker.subscriber_count(), 1);
>         assert_eq!(
>             sub1.received_messages(),
>             vec!["Event A".to_string(), "Event B".to_string()]
>         );
>     }
> }
> ```
>
> #### Technical Explanation
>**
> 1. **Decoupling Lifetimes (`Arc::downgrade`):** `EventBroker` stores `Weak<SubscriberHandle<M>>` instead of `Arc`. When a subscriber is registered, `Arc::downgrade(&handle)` creates a non-owning weak pointer. The broker does not increment the subscriber's strong count.
> 2. **Attempting Promotion (`.upgrade()`):** When `publish` is called, `weak_ref.upgrade()` atomically checks if the target `SubscriberHandle` is still alive. If it is, it returns `Some(Arc<SubscriberHandle<M>>)`.
> 3. **Automatic Dead-Reference Cleanup (`Vec::retain`):** If `.upgrade()` returns `None`, the subscriber was dropped by its caller. Returning `false` inside `.retain()` removes the stale `Weak` handle from `EventBroker`'s internal storage without requiring manual unregister calls.

---

### Exercise 2: Concurrent Thread-Safe Cache with Lock-Free Weak Eviction

**Scenario:** 
In resource-constrained microservices, dynamic resources (like parsed configuration blobs or database schemas) should be shared among worker threads. Resources should remain cached as long as at least one worker thread is actively holding a strong reference (`Arc<V>`). Once all workers drop their handles, the resource should be freed from memory while maintaining a weak index in the cache map.

Build a thread-safe `WeakCache<K, V>` using `RwLock<HashMap<K, Weak<V>>>`:
1. Implement `get_or_insert_with<F>(&self, key: K, init: F) -> Arc<V>` using double-checked locking: first try upgrading under a read lock (`RwLock::read`); if upgrade fails or key missing, acquire write lock (`RwLock::write`), re-check for concurrent initialization, invoke `init()`, insert `Arc::downgrade(...)`, and return the `Arc<V>`.
2. Implement `clean_dead_entries(&self) -> usize` to purge expired weak references whose strong count is zero.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::HashMap;
> use std::hash::Hash;
> use std::sync::{Arc, RwLock, Weak};
>
> pub struct WeakCache<K, V> {
>     map: RwLock<HashMap<K, Weak<V>>>,
> }
>
> impl<K, V> WeakCache<K, V>
> where
>     K: Eq + Hash + Clone,
> {
>     pub fn new() -> Self {
>         Self {
>             map: RwLock::new(HashMap::new()),
>         }
>     }
>
>     pub fn get_or_insert_with<F>(&self, key: K, init: F) -> Arc<V>
>     where
>         F: FnOnce() -> V,
>     {
>         // 1. Fast Path: Concurrent Read Lock
>         {
>             let read_guard = self.map.read().unwrap();
>             if let Some(weak_ref) = read_guard.get(&key) {
>                 if let Some(arc_val) = weak_ref.upgrade() {
>                     return arc_val;
>                 }
>             }
>         }
>
>         // 2. Slow Path: Write Lock with Double-Checked Lock pattern
>         let mut write_guard = self.map.write().unwrap();
>         if let Some(weak_ref) = write_guard.get(&key) {
>             if let Some(arc_val) = weak_ref.upgrade() {
>                 return arc_val;
>             }
>         }
>
>         // Instantiate new value, wrap in Arc, downgrade for cache storage
>         let value = Arc::new(init());
>         write_guard.insert(key, Arc::downgrade(&value));
>         value
>     }
>
>     pub fn clean_dead_entries(&self) -> usize {
>         let mut write_guard = self.map.write().unwrap();
>         let initial_len = write_guard.len();
>         write_guard.retain(|_k, weak_ref| weak_ref.strong_count() > 0);
>         initial_len - write_guard.len()
>     }
>
>     pub fn len(&self) -> usize {
>         self.map.read().unwrap().len()
>     }
> }
>
> #[cfg(test)]
> mod tests {
>     use super::*;
>
>     #[test]
>     fn test_weak_cache_eviction_and_reuse() {
>         let cache = WeakCache::<String, Vec<u8>>::new();
>         let key = "config_blob".to_string();
>         let mut init_counter = 0;
>
>         // First acquisition: calls init
>         let handle1 = cache.get_or_insert_with(key.clone(), || {
>             init_counter += 1;
>             vec![0xDE, 0xAD, 0xBE, 0xEF]
>         });
>         assert_eq!(init_counter, 1);
>         assert_eq!(*handle1, vec![0xDE, 0xAD, 0xBE, 0xEF]);
>
>         // Second acquisition while handle1 is active: reuses cached Arc without calling init
>         let handle2 = cache.get_or_insert_with(key.clone(), || {
>             init_counter += 1;
>             vec![0x00]
>         });
>         assert_eq!(init_counter, 1);
>         assert!(Arc::ptr_eq(&handle1, &handle2));
>
>         // Drop all active strong handles
>         drop(handle1);
>         drop(handle2);
>
>         // Cache map still holds key pointing to dead Weak pointer
>         assert_eq!(cache.len(), 1);
>
>         // Re-requesting key creates fresh Arc and re-invokes init
>         let handle3 = cache.get_or_insert_with(key.clone(), || {
>             init_counter += 1;
>             vec![0xCA, 0xFE]
>         });
>         assert_eq!(init_counter, 2);
>         assert_eq!(*handle3, vec![0xCA, 0xFE]);
>
>         drop(handle3);
>
>         // Verify explicit dead entry cleanup
>         let pruned = cache.clean_dead_entries();
>         assert_eq!(pruned, 1);
>         assert_eq!(cache.len(), 0);
>     }
> }
> ```
>
> #### Technical Explanation
>**
> 1. **Read Lock Optimization (Fast Path):** Multiple threads concurrently read from `RwLock<HashMap<K, Weak<V>>>`. If the key exists and `weak_ref.upgrade()` yields `Some(Arc<V>)`, the reference count is safely incremented without blocking other reader threads.
> 2. **Double-Checked Locking:** If a cache miss occurs under the read lock, the thread upgrades to a write lock (`RwLock::write`). Before allocating or running the expensive `init()` closure, it checks `write_guard.get(&key)` again in case another thread initialized the resource while acquiring the write lock.
> 3. **Memory Eviction Tracking (`strong_count()`):** When all callers drop their returned `Arc<V>`, the memory allocation for `V` is deallocated. `clean_dead_entries` uses `weak_ref.strong_count() > 0` to safely remove expired keys without keeping unused payload data in memory.

---

### Exercise 3: Bidirectional Doubly-Linked Tree Node Navigation without Reference Cycles

**Scenario:** 
In hierarchical document tree systems (such as HTML DOM elements or scene graphs), nodes require bidirectional traversal: parents own their children (`Rc<Node>`), children hold parent back-links (`Weak<Node>`), and sibling nodes hold relative previous/next pointers (`Weak<Node>`). Using strong `Rc` pointers for back-links or sibling links creates cyclical dependencies that leak memory when the root node is dropped.

Implement a leak-free tree structure `TreeNode`:
1. Fields: `value: String`, `parent: RefCell<Weak<TreeNode>>`, `prev_sibling: RefCell<Weak<TreeNode>>`, `next_sibling: RefCell<Weak<TreeNode>>`, `children: RefCell<Vec<Rc<TreeNode>>>`.
2. Implement `add_child(parent: &Rc<Self>, child: &Rc<Self>)`: sets child's `parent` to `Rc::downgrade(parent)`, connects `prev_sibling`/`next_sibling` weak links with existing sibling nodes, and adds `child` to `parent.children`.
3. Implement `ancestors(node: &Rc<Self>) -> Vec<String>` traversing upwards using `parent.borrow().upgrade()`.
4. Implement `sibling_values(node: &Rc<Self>) -> (Option<String>, Option<String>)`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::cell::RefCell;
> use std::rc::{Rc, Weak};
>
> pub struct TreeNode {
>     pub value: String,
>     pub parent: RefCell<Weak<TreeNode>>,
>     pub prev_sibling: RefCell<Weak<TreeNode>>,
>     pub next_sibling: RefCell<Weak<TreeNode>>,
>     pub children: RefCell<Vec<Rc<TreeNode>>>,
> }
>
> impl TreeNode {
>     pub fn new(value: &str) -> Rc<Self> {
>         Rc::new(Self {
>             value: value.to_string(),
>             parent: RefCell::new(Weak::new()),
>             prev_sibling: RefCell::new(Weak::new()),
>             next_sibling: RefCell::new(Weak::new()),
>             children: RefCell::new(Vec::new()),
>         })
>     }
>
>     pub fn add_child(parent: &Rc<Self>, child: &Rc<Self>) {
>         // Establish child -> parent back-link (Weak)
>         *child.parent.borrow_mut() = Rc::downgrade(parent);
>
>         let mut children = parent.children.borrow_mut();
>         if let Some(last_child) = children.last() {
>             // Establish sibling bidirectional links (Weak)
>             *last_child.next_sibling.borrow_mut() = Rc::downgrade(child);
>             *child.prev_sibling.borrow_mut() = Rc::downgrade(last_child);
>         }
>
>         children.push(Rc::clone(child));
>     }
>
>     pub fn ancestors(node: &Rc<Self>) -> Vec<String> {
>         let mut result = Vec::new();
>         let mut current = node.parent.borrow().upgrade();
>
>         while let Some(parent_node) = current {
>             result.push(parent_node.value.clone());
>             current = parent_node.parent.borrow().upgrade();
>         }
>
>         result
>     }
>
>     pub fn sibling_values(node: &Rc<Self>) -> (Option<String>, Option<String>) {
>         let prev = node.prev_sibling.borrow().upgrade().map(|n| n.value.clone());
>         let next = node.next_sibling.borrow().upgrade().map(|n| n.value.clone());
>         (prev, next)
>     }
> }
>
> #[cfg(test)]
> mod tests {
>     use super::*;
>
>     #[test]
>     fn test_tree_node_navigation_and_deallocation() {
>         let root = TreeNode::new("div.main");
>         let child1 = TreeNode::new("header");
>         let child2 = TreeNode::new("article");
>         let child3 = TreeNode::new("footer");
>
>         TreeNode::add_child(&root, &child1);
>         TreeNode::add_child(&root, &child2);
>         TreeNode::add_child(&root, &child3);
>
>         // Verify ancestor chain navigation
>         assert_eq!(TreeNode::ancestors(&child2), vec!["div.main".to_string()]);
>
>         // Verify sibling navigation
>         let (prev, next) = TreeNode::sibling_values(&child2);
>         assert_eq!(prev, Some("header".to_string()));
>         assert_eq!(next, Some("footer".to_string()));
>
>         // Check strong and weak counts
>         assert_eq!(Rc::strong_count(&root), 1);
>         assert_eq!(Rc::weak_count(&root), 3); // 3 children hold weak parent pointers
>
>         assert_eq!(Rc::strong_count(&child2), 2); // root's children vector + local child2 variable
>         assert_eq!(Rc::weak_count(&child2), 2);   // child1.next_sibling + child3.prev_sibling
>
>         // Track root deallocation using a weak reference
>         let root_weak = Rc::downgrade(&root);
>         drop(child1);
>         drop(child2);
>         drop(child3);
>
>         // Dropping root drops all children transitively because ownership flows top-down
>         drop(root);
>
>         // Assert complete deallocation (no memory leaks)
>         assert!(root_weak.upgrade().is_none());
>     }
> }
> ```
>
> #### Technical Explanation
>**
> 1. **Ownership Direction (Top-Down):** `TreeNode.children` holds `Rc<TreeNode>`, establishing clear ownership from parent to children.
> 2. **Cycle Prevention (Upward & Horizontal Weak Links):** `parent`, `prev_sibling`, and `next_sibling` are all wrapped in `Weak<TreeNode>`. Because weak pointers do not increment `strong_count`, dropping the root `Rc` decreases the root's `strong_count` to zero, triggering its `Drop` implementation which drops `children` and cascade-deallocates the entire graph.
> 3. **Interior Mutability (`RefCell`):** `RefCell` allows updating `parent`, `prev_sibling`, and `next_sibling` links dynamically when inserting nodes into the tree graph through shared `&Rc<TreeNode>` references.

---

## 6. Related Terms


- [`Rc<T>`](../level_03/rc_t.md) — The strong pointer that actually keeps data alive.
- [`RefCell<T>`](../level_03/refcell_t.md) — Usually used inside the `Rc` to allow the parent and child to mutate each other!
- [Memory Leaks & Reference Cycles](memory_leaks.md) — Related concept: Memory Leaks & Reference Cycles.

---

## 7. Key Takeaways

- **`Weak<T>`** is a non-owning companion to `Rc` and `Arc`.
- It allows you to point to data without incrementing the "strong count".
- It exists specifically to prevent **Memory Leaks** caused by **Reference Cycles** (e.g., in Trees, where a child points back to a parent).
- To actually use the data inside a `Weak`, you must call **`.upgrade()`**, which returns an `Option<Rc<T>>`.
- If the strong count hits 0, the data is instantly deleted, and `.upgrade()` will safely return `None`.
