# Memory Leaks & Reference Cycles

> **Level 11 — Smart Pointers & Advanced Types**
> Rust guarantees memory *safety*, but not memory *leak-freedom* — two `Rc`/`Arc` pointers that own each other can leak forever.

---

## 1. Prerequisites


- [`Rc<T>`](../level_03/rc_t.md) — The reference-counted smart pointer whose cycles cause leaks.
- [`Weak<T>`](weak_t.md) — The tool specifically designed to break these cycles.
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

---

## 5. Practice Exercises

### Exercise 1: Thread-Safe Subscriber System and Reference Cycle Prevention (`Arc<Mutex<T>>` & `Weak`)

**Scenario:**
In event-driven backend architectures, services register listeners to receive broadcast updates. A naive implementation stores strong `Arc<Mutex<dyn Listener>>` references inside the `Publisher`, while listeners store an `Arc<Publisher>` handle to unregister themselves. This creates a multi-thread reference cycle: neither the publisher nor the listeners can ever be dropped, resulting in a persistent memory leak.

Implement a thread-safe subscription system where:
1. `Publisher` stores `Weak<Mutex<dyn Listener>>` handles inside `Mutex<Vec<Weak<Mutex<dyn Listener>>>>`.
2. `Publisher::subscribe(&self, listener: &Arc<Mutex<dyn Listener>>)` downgrades the reference before storing it.
3. `Publisher::publish(&self, event: &str) -> usize` broadcasts the event to active listeners while automatically pruning dead (dropped) subscriptions whose weak pointers fail to upgrade.
4. Add unit tests (`#[test]`) using `assert_eq!`, `assert!`, and an `AtomicUsize` drop tracker to verify that listener destruction fires properly and no memory leaks occur when listeners drop out of scope.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::sync::{Arc, Mutex, Weak};
> use std::sync::atomic::{AtomicUsize, Ordering};
> 
> pub trait Listener: Send + Sync {
>     fn on_event(&self, event: &str);
> }
> 
> pub struct DropTracker {
>     pub name: String,
>     pub drop_counter: Arc<AtomicUsize>,
> }
> 
> impl Drop for DropTracker {
>     fn drop(&mut self) {
>         self.drop_counter.fetch_add(1, Ordering::SeqCst);
>     }
> }
> 
> pub struct CustomListener {
>     pub name: String,
>     pub received_events: Mutex<Vec<String>>,
>     pub _tracker: DropTracker,
> }
> 
> impl Listener for CustomListener {
>     fn on_event(&self, event: &str) {
>         if let Ok(mut events) = self.received_events.lock() {
>             events.push(event.to_string());
>         }
>     }
> }
> 
> pub struct Publisher {
>     listeners: Mutex<Vec<Weak<Mutex<dyn Listener>>>>,
> }
> 
> impl Publisher {
>     pub fn new() -> Self {
>         Self {
>             listeners: Mutex::new(Vec::new()),
>         }
>     }
> 
>     pub fn subscribe(&self, listener: &Arc<Mutex<dyn Listener>>) {
>         let mut list = self.listeners.lock().unwrap();
>         list.push(Arc::downgrade(listener));
>     }
> 
>     pub fn publish(&self, event: &str) -> usize {
>         let mut list = self.listeners.lock().unwrap();
>         let mut notified = 0;
>         list.retain(|weak_listener| {
>             if let Some(strong_listener) = weak_listener.upgrade() {
>                 let guard = strong_listener.lock().unwrap();
>                 guard.on_event(event);
>                 notified += 1;
>                 true
>             } else {
>                 false // Prune dead weak pointers!
>             }
>         });
>         notified
>     }
> 
>     pub fn active_listener_count(&self) -> usize {
>         let list = self.listeners.lock().unwrap();
>         list.iter().filter(|w| w.upgrade().is_some()).count()
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_event_delivery_and_weak_pruning() {
>         let drop_counter = Arc::new(AtomicUsize::new(0));
>         let publisher = Arc::new(Publisher::new());
> 
>         let listener1: Arc<Mutex<dyn Listener>> = Arc::new(CustomListener {
>             name: "Listener1".to_string(),
>             received_events: Mutex::new(Vec::new()),
>             _tracker: DropTracker {
>                 name: "Listener1".to_string(),
>                 drop_counter: Arc::clone(&drop_counter),
>             },
>         });
> 
>         publisher.subscribe(&listener1);
>         assert_eq!(publisher.active_listener_count(), 1);
> 
>         {
>             let listener2: Arc<Mutex<dyn Listener>> = Arc::new(CustomListener {
>                 name: "Listener2".to_string(),
>                 received_events: Mutex::new(Vec::new()),
>                 _tracker: DropTracker {
>                     name: "Listener2".to_string(),
>                     drop_counter: Arc::clone(&drop_counter),
>                 },
>             });
> 
>             publisher.subscribe(&listener2);
>             assert_eq!(publisher.active_listener_count(), 2);
> 
>             let notified = publisher.publish("INIT");
>             assert_eq!(notified, 2);
>         } // listener2 goes out of scope here and is dropped!
> 
>         // Drop tracker proves listener2 was deallocated
>         assert_eq!(drop_counter.load(Ordering::SeqCst), 1);
> 
>         // Next publish auto-prunes dead weak pointer to listener2
>         let notified = publisher.publish("UPDATE");
>         assert_eq!(notified, 1);
>         assert_eq!(publisher.active_listener_count(), 1);
> 
>         drop(listener1);
>         assert_eq!(drop_counter.load(Ordering::SeqCst), 2);
>     }
> }
> ```
> 
> #### Technical Explanation
>
> 1. **Cycle Breaking via `Weak`:** Storing `Weak<Mutex<dyn Listener>>` instead of `Arc<Mutex<dyn Listener>>` prevents the `Publisher` from keeping listeners alive indefinitely.
> 2. **Dynamic Weak Upgrading:** Calling `.upgrade()` on `Weak` pointers attempts to obtain a temporary `Arc` strong reference. If the subscriber has been dropped elsewhere in the application, `.upgrade()` safely returns `None`.
> 3. **Automatic Pruning:** `list.retain()` filters the weak vector during publication, removing stale `Weak` references on the fly so the subscriber list does not accumulate memory garbage over time.

---

## 5. Practice Exercises

### Exercise 2: Intentional Static Leaks with `Box::leak` for Zero-Copy Process-Wide Configuration

**Scenario:**
In microservice architectures, configuration values or large static buffers parsed at startup must be accessed across dozens of worker threads. Passing `Arc<Config>` incurs atomic reference counting overhead on every borrow, while copying strings wastes heap memory. Rust allows intentionally leaking dynamically allocated data using `Box::leak` to yield `'static` references (`&'static Config` or `&'static mut [u8]`) that live for the lifetime of the process without lifetime annotations or `Arc` wrapper overhead.

Implement `ConfigManager`:
1. `leak_config(config: AppConfig) -> &'static AppConfig` dynamically boxes and leaks an `AppConfig` struct.
2. `leak_byte_buffer(buffer: Vec<u8>) -> &'static mut [u8]` leaks a heap byte vector into a static mutable slice.
3. Write unit tests (`#[test]`) using `assert_eq!`, `assert!`, and `std::thread::spawn` demonstrating zero-copy concurrent access across thread boundaries and direct slice mutation.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::thread;
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct AppConfig {
>     pub server_name: String,
>     pub port: u16,
>     pub max_connections: usize,
>     pub feature_flags: Vec<String>,
> }
> 
> pub struct ConfigManager;
> 
> impl ConfigManager {
>     /// Leaks a dynamically allocated AppConfig to produce a process-wide static reference.
>     pub fn leak_config(config: AppConfig) -> &'static AppConfig {
>         Box::leak(Box::new(config))
>     }
> 
>     /// Leaks a Vec<u8> buffer to produce a static mutable slice.
>     pub fn leak_byte_buffer(buffer: Vec<u8>) -> &'static mut [u8] {
>         Box::leak(buffer.into_boxed_slice())
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_box_leak_static_config_sharing() {
>         let config = AppConfig {
>             server_name: "api-gateway-v1".to_string(),
>             port: 8080,
>             max_connections: 10_000,
>             feature_flags: vec!["auth_v2".to_string(), "tracing".to_string()],
>         };
> 
>         // Leak the box to get a &'static AppConfig reference
>         let static_cfg: &'static AppConfig = ConfigManager::leak_config(config);
> 
>         assert_eq!(static_cfg.server_name, "api-gateway-v1");
>         assert_eq!(static_cfg.port, 8080);
> 
>         // Spawn multiple threads sharing &'static AppConfig without Arc or cloning
>         let handles: Vec<_> = (0..4)
>             .map(|i| {
>                 thread::spawn(move || {
>                     assert_eq!(static_cfg.port, 8080);
>                     assert!(static_cfg.feature_flags.contains(&"auth_v2".to_string()));
>                     i * static_cfg.max_connections
>                 })
>             })
>             .collect();
> 
>         for handle in handles {
>             let res = handle.join().unwrap();
>             assert_eq!(res % 10_000, 0);
>         }
>     }
> 
>     #[test]
>     fn test_box_leak_mutable_slice_buffer() {
>         let raw_data = vec![0u8; 128];
>         let leaked_buf: &'static mut [u8] = ConfigManager::leak_byte_buffer(raw_data);
> 
>         assert_eq!(leaked_buf.len(), 128);
> 
>         // Mutate static memory directly
>         leaked_buf[0] = 0xDE;
>         leaked_buf[1] = 0xAD;
>         leaked_buf[2] = 0xBE;
>         leaked_buf[3] = 0xEF;
> 
>         assert_eq!(&leaked_buf[0..4], &[0xDE, 0xAD, 0xBE, 0xEF]);
>     }
> }
> ```
> 
> #### Technical Explanation
>
> 1. **Intentional Memory Leak via `Box::leak`:** `Box::leak` transfers ownership of the allocated data away from Rust's RAII drop mechanism and returns a mutable reference with a `'static` lifetime (`&'static mut T`).
> 2. **Thread Safety:** Because static references (`&'static T`) are guaranteed to remain valid for the entire runtime of the binary, they can be freely moved into threads spawned by `thread::spawn` without needing `Arc` reference counting or lifetime specifiers.
> 3. **Use Cases:** Ideal for initializing process-wide global caches, lookup tables, or standard buffers created at application startup.
> 
> ---
> 
> ### Exercise 3: Reactive Dataflow DAG and Cycle Prevention (`Rc<RefCell<T>>` vs `Weak`)
> 
> **Scenario:**
> In reactive dataflow engines (such as GUI component graphs or task dependency trees), parent nodes trigger updates to child nodes through forward edges (`outputs`), while child nodes inspect parent states through back-edges (`inputs`). Using `Rc<RefCell<Node>>` for both forward and back-edges forms circular reference graphs that leak the entire node network when the root node goes out of scope.
> 
> Implement a leak-free reactive node graph system:
> 1. Define `DependencyNode` with `inputs: RefCell<Vec<Weak<RefCell<DependencyNode>>>>` and `outputs: RefCell<Vec<Rc<RefCell<DependencyNode>>>>`.
> 2. Implement `add_dependency(parent, child)` which adds child as strong `Rc` in `outputs` and parent as `Weak` in `inputs`.
> 3. Implement `update_value` to propagate changes down the DAG.
> 4. Write unit tests (`#[test]`) using `assert_eq!`, `assert!`, and atomic drop counters to verify that dropping the root node automatically drops all child nodes in the DAG and that weak back-references return `None` once parents are deallocated.
> 
> > [!check]- Answer
> > ```rust
> > use std::cell::RefCell;
> > use std::rc::{Rc, Weak};
> > use std::sync::atomic::{AtomicUsize, Ordering};
> > 
> > pub static NODE_DROP_COUNT: AtomicUsize = AtomicUsize::new(0);
> > 
> > #[derive(Debug)]
> > pub struct DependencyNode {
> >     pub id: String,
> >     pub value: RefCell<i32>,
> >     pub inputs: RefCell<Vec<Weak<RefCell<DependencyNode>>>>,
> >     pub outputs: RefCell<Vec<Rc<RefCell<DependencyNode>>>>,
> > }
> > 
> > impl Drop for DependencyNode {
> >     fn drop(&mut self) {
> >         NODE_DROP_COUNT.fetch_add(1, Ordering::SeqCst);
> >     }
> > }
> > 
> > impl DependencyNode {
> >     pub fn new(id: &str, initial_val: i32) -> Rc<RefCell<Self>> {
> >         Rc::new(RefCell::new(Self {
> >             id: id.to_string(),
> >             value: RefCell::new(initial_val),
> >             inputs: RefCell::new(Vec::new()),
> >             outputs: RefCell::new(Vec::new()),
> >         }))
> >     }
> > 
> >     pub fn add_dependency(parent: &Rc<RefCell<Self>>, child: &Rc<RefCell<Self>>) {
> >         parent.borrow_mut().outputs.borrow_mut().push(Rc::clone(child));
> >         child.borrow_mut().inputs.borrow_mut().push(Rc::downgrade(parent));
> >     }
> > 
> >     pub fn update_value(&self, new_val: i32) {
> >         *self.value.borrow_mut() = new_val;
> >         for output in self.outputs.borrow().iter() {
> >             output.borrow().on_parent_updated(new_val);
> >         }
> >     }
> > 
> >     fn on_parent_updated(&self, parent_val: i32) {
> >         let current = *self.value.borrow();
> >         *self.value.borrow_mut() = current + parent_val;
> >     }
> > 
> >     pub fn inspect_inputs(&self) -> Vec<i32> {
> >         let inputs = self.inputs.borrow();
> >         inputs
> >             .iter()
> >             .filter_map(|weak_input| weak_input.upgrade())
> >             .map(|strong_input| *strong_input.borrow().value.borrow())
> >             .collect()
> >     }
> > }
> > 
> > #[cfg(test)]
> > mod tests {
> >     use super::*;
> > 
> >     #[test]
> >     fn test_reactive_graph_propagation_and_cycle_prevention() {
> >         NODE_DROP_COUNT.store(0, Ordering::SeqCst);
> > 
> >         {
> >             let root = DependencyNode::new("root", 10);
> >             let child_a = DependencyNode::new("child_a", 5);
> >             let child_b = DependencyNode::new("child_b", 2);
> > 
> >             DependencyNode::add_dependency(&root, &child_a);
> >             DependencyNode::add_dependency(&root, &child_b);
> > 
> >             // Strong count check: root has 1 strong reference (local variable)
> >             // child nodes have 2 strong references (local variable + root's outputs vector)
> >             assert_eq!(Rc::strong_count(&root), 1);
> >             assert_eq!(Rc::strong_count(&child_a), 2);
> >             assert_eq!(Rc::strong_count(&child_b), 2);
> > 
> >             let input_vals = child_a.borrow().inspect_inputs();
> >             assert_eq!(input_vals, vec![10]);
> > 
> >             // Trigger value propagation down the tree
> >             root.borrow().update_value(20);
> >             assert_eq!(*root.borrow().value.borrow(), 20);
> >             assert_eq!(*child_a.borrow().value.borrow(), 25);
> >             assert_eq!(*child_b.borrow().value.borrow(), 22);
> >         } // All nodes leave scope here!
> > 
> >         // Dropping root drops outputs vector, which decrements child strong counts to 0.
> >         // Drop tracker verifies all 3 nodes were cleanly destroyed!
> >         assert_eq!(NODE_DROP_COUNT.load(Ordering::SeqCst), 3);
> >     }
> > 
> >     #[test]
> >     fn test_weak_input_upgrade_returns_none_after_parent_dropped() {
> >         NODE_DROP_COUNT.store(0, Ordering::SeqCst);
> >         let child = DependencyNode::new("child", 100);
> > 
> >         {
> >             let parent = DependencyNode::new("parent", 50);
> >             DependencyNode::add_dependency(&parent, &child);
> >             assert_eq!(child.borrow().inspect_inputs(), vec![50]);
> >         } // parent is dropped here
> > 
> >         // Weak back-reference safely returns empty list because parent allocation is dead
> >         assert_eq!(child.borrow().inspect_inputs(), Vec::<i32>::new());
> >     }
> > }
> > ```
> > 
> > **Explanation:**
> > 1. **Asymmetric Ownership Structure:** Storing strong `Rc` in `outputs` establishes a clear parent-to-child ownership hierarchy, while storing `Weak` in `inputs` breaks back-pointer reference cycles.
> > 2. **Cascade Deallocation:** When the root node is dropped, its `outputs` vector is dropped, decrementing the strong count of `child_a` and `child_b` from 2 to 1 (and then to 0 as local variables drop). This allows destructors (`impl Drop`) to cascade down the entire DAG automatically.
> > 3. **Safety of Weak Upgrades:** Calling `filter_map(|w| w.upgrade())` when inspecting inputs ensures child nodes can safely access parent values without risking dangling pointer crashes if a parent node is removed from the graph prematurely.

---

## 6. Related Terms


- [`Weak<T>`](weak_t.md) — The non-owning pointer specifically designed to break reference cycles.
- [`Rc<T>`](../level_03/rc_t.md)
- [`Drop` Trait](../level_03/drop_trait.md) — The destructor that never runs on leaked data.
- [Ownership](../level_03/ownership.md) — `mem::forget` is the "intentional leak" primitive; see also `Box::leak`.
- [`std::mem` Utilities (`replace`, `take`, `swap`, `drop`)](../level_03/std_mem_utilities.md) — Related concept: `std::mem` Utilities (`replace`, `take`, `swap`, `drop`).

---

## 7. Key Takeaways

- Rust's memory-safety guarantees (no dangling pointers, no UB) do **not** include leak-freedom — a leak is officially a *safe* operation.
- The classic leak pattern is a **reference cycle**: two or more `Rc`/`Arc` pointers that keep each other's strong count above zero forever.
- `Weak<T>` breaks cycles by holding a reference that doesn't count toward the strong count, so the cycle can still be fully collected.
- You can also leak *intentionally* and safely with `Box::leak` or `std::mem::forget`, which is occasionally useful for genuinely `'static` data.
