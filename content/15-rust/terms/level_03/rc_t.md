# `Rc<T>`

> **Level 3 — Ownership & Borrowing**
> Reference-counted smart pointer for shared ownership in single-threaded contexts.

---

## 1. Prerequisites

- [Ownership](../level_03/ownership.md) — The fundamental rule ("One Owner") that `Rc` is designed to safely bypass.
- [`Drop` Trait](../level_03/drop_trait.md) — How Rust cleans up memory. `Rc` manipulates exactly *when* the `Drop` trait is allowed to trigger.

---

## 2. Term Category

**Rust-specific (the explicit GC alternative)**: Languages like Java or Python use a heavy Garbage Collector to allow multiple variables to own the same data. Rust avoids Garbage Collection by using explicit **Reference Counting** (similar to Swift's ARC or C++ `std::shared_ptr`).

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The Golden Rule of Rust is: *"There can only be one owner."* 

But what if you are building a complex data structure, like a Graph network or a UI tree, where multiple different nodes need to point to and "own" the exact same piece of data? If you just use standard Borrowing (`&`), you become trapped by strict Lifetimes—the original owner might drop the data while the borrowers are still trying to read it!

We need **Shared Ownership**. 

`Rc<T>` stands for **R**eference **C**ounted. It is a "Smart Pointer" that wraps around your data. It keeps a running tally (a count) of exactly how many owners currently exist. Every time you clone the `Rc`, it *does not* deep copy your data; it just increases the integer count by 1. When an owner goes out of scope, the count drops by 1. When the count hits exactly `0`, the data is finally dropped.

### (2) Reality Metaphor

Imagine a TV in a shared living room.

- The TV (the data) is owned by the room. 
- Alice walks in and turns the TV on. **(Count = 1)**
- Bob walks in to watch. **(Count = 2)**
- Alice gets bored and leaves the room. **(Count = 1)**. The TV stays on because Bob is still watching.
- Charlie walks in. **(Count = 2)**
- Bob leaves. **(Count = 1)**
- Charlie leaves. **(Count = 0)**. 
- Because the room is now completely empty, the last person out turns off the TV (the **Drop** trait is called).

### (3) Rust Code Examples

#### Short Snippet (Incrementing the Count)
To use `Rc`, you must import it from the standard library.
```rust
use std::rc::Rc;

fn main() {
    // 1. We wrap our data inside a Reference Counter. Count is currently 1.
    let shared_data = Rc::new(String::from("Shared Secret"));
    
    // 2. We use `Rc::clone` to create a second owner. Count is now 2.
    // NOTE: This does NOT copy the string! It just increments the integer count!
    let owner_two = Rc::clone(&shared_data);
    
    println!("There are {} owners.", Rc::strong_count(&shared_data));
}
```

#### Fuller Example (Scoping and Dropping)
This example proves that the data stays alive as long as at least one owner exists, and shows the count going up and down based on `{}` scopes.

```rust
use std::rc::Rc;

fn main() {
    let a = Rc::new(String::from("TV Show"));
    println!("Count after creating a: {}", Rc::strong_count(&a)); // 1
    
    {
        // Inside this scope, `b` becomes a second owner.
        let b = Rc::clone(&a);
        println!("Count after creating b: {}", Rc::strong_count(&a)); // 2
        
    } // Scope ends! `b` is dropped. The count goes down by 1!
    
    // The data is still perfectly safe because `a` is still alive.
    println!("Count after b leaves: {}", Rc::strong_count(&a)); // 1
    
} // `a` drops here. Count hits 0. The "TV Show" string is finally dropped!
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Rc T Scoping and Lifecycle Rules

**The mistake:** Assuming Rc T instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("rc_t_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("rc_t_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Rc T State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Rc T through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Rc T Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Rc T instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Shared Abstract Syntax Tree (AST) Subexpression Sharing Engine

**Scenario:** You are building a high-performance single-threaded expression parsing and evaluation engine for an embedded query processor. Queries frequently reuse common subexpressions (such as variable references or constant arithmetic bounds) across different branches of the Abstract Syntax Tree (AST). Using owned allocations (`Box<Expr>`) causes excessive memory duplication and unnecessary heap allocations.

Your task is to implement an AST system where expressions and string identifiers are wrapped in `Rc` smart pointers (`Rc<Expr>` and `Rc<str>`). This allows subtrees to be shared across multiple parents without cloning the underlying data. You will also implement an evaluator that computes expression values given a variable environment map and inspects node reference counts to verify sharing.

**Requirements:**
1. Define an AST enum `Expr` with variants `Literal(i64)`, `Var(Rc<str>)`, `Add(Rc<Expr>, Rc<Expr>)`, and `Mul(Rc<Expr>, Rc<Expr>)`.
2. Implement `Expr::eval(&self, env: &HashMap<String, i64>) -> Result<i64, String>` to recursively evaluate expressions.
3. Implement `count_node_references(node: &Rc<Expr>) -> usize` using `Rc::strong_count`.
4. Complete the skeleton code so that shared subexpressions are safely evaluated and reference counts accurately reflect shared ownership.

```rust
use std::rc::Rc;
use std::collections::HashMap;

#[derive(Debug, PartialEq)]
pub enum Expr {
    Literal(i64),
    Var(Rc<str>),
    Add(Rc<Expr>, Rc<Expr>),
    Mul(Rc<Expr>, Rc<Expr>),
}

impl Expr {
    pub fn eval(&self, env: &HashMap<String, i64>) -> Result<i64, String> {
        // TODO: Implement recursive evaluation matching on self variants
        todo!()
    }
}

pub fn count_node_references(node: &Rc<Expr>) -> usize {
    // TODO: Return the strong reference count of the given Rc node
    todo!()
}

fn main() {
    // TODO: Construct shared AST subexpression (x + 5) and evaluate (x + 5) * (x + 5)
}
```

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::rc::Rc;
> use std::collections::HashMap;
> 
> #[derive(Debug, PartialEq)]
> pub enum Expr {
>     Literal(i64),
>     Var(Rc<str>),
>     Add(Rc<Expr>, Rc<Expr>),
>     Mul(Rc<Expr>, Rc<Expr>),
> }
> 
> impl Expr {
>     pub fn eval(&self, env: &HashMap<String, i64>) -> Result<i64, String> {
>         match self {
>             Expr::Literal(val) => Ok(*val),
>             Expr::Var(name) => env
>                 .get(name.as_ref())
>                 .copied()
>                 .ok_or_else(|| format!("Undefined variable: {}", name)),
>             Expr::Add(lhs, rhs) => {
>                 let l = lhs.eval(env)?;
>                 let r = rhs.eval(env)?;
>                 Ok(l + r)
>             }
>             Expr::Mul(lhs, rhs) => {
>                 let l = lhs.eval(env)?;
>                 let r = rhs.eval(env)?;
>                 Ok(l + r)
>             }
>         }
>     }
> }
> 
> pub fn count_node_references(node: &Rc<Expr>) -> usize {
>     Rc::strong_count(node)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_ast_subexpression_sharing_and_evaluation() {
>         let var_x = Rc::new(Expr::Var(Rc::from("x")));
>         let lit_5 = Rc::new(Expr::Literal(5));
> 
>         // Shared subexpression: (x + 5)
>         let shared_subexpr = Rc::new(Expr::Add(Rc::clone(&var_x), Rc::clone(&lit_5)));
> 
>         // AST representing: (x + 5) * (x + 5)
>         let root = Expr::Mul(Rc::clone(&shared_subexpr), Rc::clone(&shared_subexpr));
> 
>         let mut env = HashMap::new();
>         env.insert("x".to_string(), 10);
> 
>         let result = root.eval(&env);
> 
>         // Explicit assertions
>         assert_eq!(result, Ok(225));
>         assert!(result.is_ok());
>         assert_ne!(count_node_references(&shared_subexpr), 1);
>         assert_eq!(count_node_references(&shared_subexpr), 3); // local handle + 2 arms of Mul
>         assert!(matches!(result, Ok(val) if val > 200));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Zero-Copy Subtree Sharing via `Rc<T>`**: Standard owned AST structures rely on unique allocation via `Box<Expr>`. Duplicating subtrees requires recursively cloning entire node hierarchies. By wrapping node instances in `Rc<Expr>`, cloning an `Rc` pointer (`Rc::clone(&ptr)`) performs an $O(1)$ non-atomic integer increment rather than allocating heap memory or copying tree buffers.
> 2. **`Rc<str>` for Shared String Identifiers**: Rather than using heap-allocated `String` instances or lifetime-bounded `&'a str` slices inside AST nodes, `Rc<str>` provides an immutable, reference-counted unsized slice. This decoupling allows string identifiers to outlive parsing stack frames without lifetime constraints (`'a`).
> 3. **Memory Layout (`RcBox<T>`)**: On the heap, `Rc<T>` allocates a heap block containing a header and payload: `[strong_count: usize, weak_count: usize, value: T]`. When `shared_subexpr` is cloned for the left and right branches of `Mul`, the strong counter increases from 1 to 3 while pointing to the exact same `RcBox` address in memory.
> 4. **Single-Thread Safety Invariant**: `Rc<T>` does not implement `Send` or `Sync`. Integer counter operations use unsanitized non-atomic increment (`+1`) and decrement (`-1`) instructions. This makes `Rc<T>` optimal for single-threaded DSL engines by eliminating atomic memory barrier instructions (`LOCK XADD` / `FARBAR`).

---

### Exercise 2: Directed Acyclic Graph (DAG) Route Navigation with `Weak<T>` Cycle Prevention

**Scenario:** In a web application routing engine or file system directory service, routes form a Directed Acyclic Graph (DAG) hierarchy. Parent nodes maintain child route lists (`Rc<RouteNode>`), while child routes inherit parent middleware configurations (`Rc<Vec<String>>`). Children must also traverse backward to parent nodes (`parent: Option<Weak<RouteNode>>`) to compute fully qualified URL paths (e.g., `/api/v1/users`).

If child nodes held strong `Rc<RouteNode>` backpointers to parent nodes, a cyclic reference would form. Parent strong counts would never reach zero when dropped, leading to persistent heap memory leaks.

**Requirements:**
1. Define `RouteNode` containing `path_segment: String`, `middleware: Rc<Vec<String>>`, `parent: Option<Weak<RouteNode>>`, and `children: RefCell<Vec<Rc<RouteNode>>>`.
2. Implement `RouteNode::new_root(path, middleware)` to instantiate root route nodes.
3. Implement `RouteNode::add_child(parent, path, extra_middleware)` to create child routes that reference parents via `Rc::downgrade(parent)`.
4. Implement `RouteNode::full_path(node)` to construct absolute paths by ascending parent links via `Weak::upgrade()`.
5. Complete the skeleton and ensure memory is correctly freed when parent nodes are dropped.

```rust
use std::rc::{Rc, Weak};
use std::cell::RefCell;

#[derive(Debug)]
pub struct RouteNode {
    pub path_segment: String,
    pub middleware: Rc<Vec<String>>,
    pub parent: Option<Weak<RouteNode>>,
    pub children: RefCell<Vec<Rc<RouteNode>>>,
}

impl RouteNode {
    pub fn new_root(path_segment: impl Into<String>, middleware: Vec<String>) -> Rc<Self> {
        // TODO: Construct root route node wrapped in Rc
        todo!()
    }

    pub fn add_child(
        parent_rc: &Rc<Self>,
        path_segment: impl Into<String>,
        additional_middleware: Option<Vec<String>>,
    ) -> Rc<Self> {
        // TODO: Create child route inheriting parent middleware and setting parent Weak pointer
        todo!()
    }

    pub fn full_path(node: &Rc<Self>) -> String {
        // TODO: Traverse parent pointers upward using Weak::upgrade to build path string
        todo!()
    }
}

fn main() {
    // TODO: Build route hierarchy and output full path
}
```

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::rc::{Rc, Weak};
> use std::cell::RefCell;
> 
> #[derive(Debug)]
> pub struct RouteNode {
>     pub path_segment: String,
>     pub middleware: Rc<Vec<String>>,
>     pub parent: Option<Weak<RouteNode>>,
>     pub children: RefCell<Vec<Rc<RouteNode>>>,
> }
> 
> impl RouteNode {
>     pub fn new_root(path_segment: impl Into<String>, middleware: Vec<String>) -> Rc<Self> {
>         Rc::new(RouteNode {
>             path_segment: path_segment.into(),
>             middleware: Rc::new(middleware),
>             parent: None,
>             children: RefCell::new(Vec::new()),
>         })
>     }
> 
>     pub fn add_child(
>         parent_rc: &Rc<Self>,
>         path_segment: impl Into<String>,
>         additional_middleware: Option<Vec<String>>,
>     ) -> Rc<Self> {
>         let middleware = match additional_middleware {
>             Some(extra) => {
>                 let mut combined = (*parent_rc.middleware).clone();
>                 combined.extend(extra);
>                 Rc::new(combined)
>             }
>             None => Rc::clone(&parent_rc.middleware),
>         };
> 
>         let child = Rc::new(RouteNode {
>             path_segment: path_segment.into(),
>             middleware,
>             parent: Some(Rc::downgrade(parent_rc)),
>             children: RefCell::new(Vec::new()),
>         });
> 
>         parent_rc.children.borrow_mut().push(Rc::clone(&child));
>         child
>     }
> 
>     pub fn full_path(node: &Rc<Self>) -> String {
>         let mut segments = vec![node.path_segment.clone()];
>         let mut current_weak = node.parent.clone();
> 
>         while let Some(weak_ptr) = current_weak {
>             if let Some(parent_rc) = weak_ptr.upgrade() {
>                 segments.push(parent_rc.path_segment.clone());
>                 current_weak = parent_rc.parent.clone();
>             } else {
>                 break;
>             }
>         }
> 
>         segments.reverse();
>         if segments.len() == 1 && segments[0] == "/" {
>             return "/".to_string();
>         }
>         let joined = segments.join("/");
>         if joined.starts_with("//") {
>             joined[1..].to_string()
>         } else {
>             joined
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_route_dag_backpointers_and_cycle_prevention() {
>         let root = RouteNode::new_root("", vec!["logger".to_string()]);
>         let api = RouteNode::add_child(&root, "api", Some(vec!["auth".to_string()]));
>         let v1 = RouteNode::add_child(&api, "v1", None);
>         let users = RouteNode::add_child(&v1, "users", Some(vec!["rate_limit".to_string()]));
> 
>         // Path traversal test
>         assert_eq!(RouteNode::full_path(&users), "/api/v1/users");
>         assert!(users.parent.is_some());
>         assert_ne!(Rc::strong_count(&root), 0);
> 
>         // Weak upgrade verification
>         let parent_upgrade = users.parent.as_ref().unwrap().upgrade();
>         assert!(matches!(parent_upgrade, Some(_)));
>         assert_eq!(parent_upgrade.unwrap().path_segment, "v1");
> 
>         // Verify drop cleanup without reference cycles leaking memory
>         drop(root);
>         drop(api);
>         drop(v1);
> 
>         // Upgrading an orphaned Weak reference safely returns None
>         let orphan_upgrade = users.parent.as_ref().unwrap().upgrade();
>         assert_eq!(orphan_upgrade, None);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Reference Counting Cycles & Memory Leaks**: If parent nodes hold `Rc<RouteNode>` pointers to children, and children also hold strong `Rc<RouteNode>` backpointers to parents, the strong count for every node in the graph will always remain $\ge 1$, even when all external owned handles leave scope. Rust's `Drop` trait will never trigger for cyclic `Rc` structures, leaking memory indefinitely.
> 2. **Breaking Cycles with `Weak<T>`**: `Rc::downgrade` creates a `Weak<T>` pointer that increments the `weak_count` header in `RcBox` without incrementing `strong_count`. Weak references do not express ownership.
> 3. **Safely Accessing Weak Targets via `Weak::upgrade()`**: Because the underlying `T` can be dropped once `strong_count == 0`, `Weak<T>` cannot be directly dereferenced. `Weak::upgrade()` atomically checks if `strong_count > 0`. If valid, it increments `strong_count` by 1 and returns `Some(Rc<T>)`. If dropped, it returns `None`.
> 4. **Deallocation Lifecycle**: Memory deallocation occurs in two distinct phases for `RcBox`:
>    - When `strong_count` drops to 0, `T::drop()` is immediately called and the inner payload `T` is invalidated.
>    - The underlying memory block (`RcBox`) itself is only freed by the allocator once `weak_count` drops to 0.

---

### Exercise 3: Single-Threaded Desktop GUI Component Tree & Shared Theme Engine

**Scenario:** In a desktop GUI framework (such as GTK-rs or a WASM canvas renderer), UI widget trees require shared read-only resources (like `Rc<ThemeConfig>`) alongside dynamic runtime state (`Rc<RefCell<WidgetState>>`). 

Every component shares the application theme without duplicating color palettes or typography configuration. At the same time, user interaction events (like mouse clicks) propagate downward through component hierarchies, mutating widget state counters without requiring multi-threaded locks (`Mutex` or `RwLock`).

**Requirements:**
1. Define `ThemeConfig` containing `font_family: String`, `primary_color: String`, `font_size: u32`.
2. Define `WidgetState` containing `click_count: usize` and `enabled: bool`.
3. Define `Widget` containing `id: String`, `theme: Rc<ThemeConfig>`, `state: Rc<RefCell<WidgetState>>`, and `children: RefCell<Vec<Rc<Widget>>>`.
4. Implement `Widget::new(id, theme)`, `Widget::add_child(&self, child)`, `Widget::click(&self)`, and `Widget::total_clicks(&self) -> usize`.
5. Complete the skeleton and write unit tests demonstrating state mutation, theme configuration sharing, and hierarchical event propagation.

```rust
use std::rc::Rc;
use std::cell::RefCell;

#[derive(Debug, PartialEq)]
pub struct ThemeConfig {
    pub font_family: String,
    pub primary_color: String,
    pub font_size: u32,
}

#[derive(Debug)]
pub struct WidgetState {
    pub click_count: usize,
    pub enabled: bool,
}

#[derive(Debug)]
pub struct Widget {
    pub id: String,
    pub theme: Rc<ThemeConfig>,
    pub state: Rc<RefCell<WidgetState>>,
    pub children: RefCell<Vec<Rc<Widget>>>,
}

impl Widget {
    pub fn new(id: impl Into<String>, theme: Rc<ThemeConfig>) -> Rc<Self> {
        // TODO: Construct new Widget wrapped in Rc with default enabled WidgetState
        todo!()
    }

    pub fn add_child(&self, child: Rc<Widget>) {
        // TODO: Push child into self.children RefCell vector
        todo!()
    }

    pub fn click(&self) {
        // TODO: Increment click_count on self state and recursively trigger click on all children
        todo!()
    }

    pub fn total_clicks(&self) -> usize {
        // TODO: Borrow state and return click count
        todo!()
    }
}

fn main() {
    // TODO: Initialize GUI tree and propagate click events
}
```

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::rc::Rc;
> use std::cell::RefCell;
> 
> #[derive(Debug, PartialEq)]
> pub struct ThemeConfig {
>     pub font_family: String,
>     pub primary_color: String,
>     pub font_size: u32,
> }
> 
> #[derive(Debug)]
> pub struct WidgetState {
>     pub click_count: usize,
>     pub enabled: bool,
> }
> 
> #[derive(Debug)]
> pub struct Widget {
>     pub id: String,
>     pub theme: Rc<ThemeConfig>,
>     pub state: Rc<RefCell<WidgetState>>,
>     pub children: RefCell<Vec<Rc<Widget>>>,
> }
> 
> impl Widget {
>     pub fn new(id: impl Into<String>, theme: Rc<ThemeConfig>) -> Rc<Self> {
>         Rc::new(Widget {
>             id: id.into(),
>             theme,
>             state: Rc::new(RefCell::new(WidgetState {
>                 click_count: 0,
>                 enabled: true,
>             })),
>             children: RefCell::new(Vec::new()),
>         })
>     }
> 
>     pub fn add_child(&self, child: Rc<Widget>) {
>         self.children.borrow_mut().push(child);
>     }
> 
>     pub fn click(&self) {
>         let mut st = self.state.borrow_mut();
>         if st.enabled {
>             st.click_count += 1;
>         }
>         for child in self.children.borrow().iter() {
>             child.click();
>         }
>     }
> 
>     pub fn total_clicks(&self) -> usize {
>         self.state.borrow().click_count
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_gui_widget_tree_and_theme_sharing() {
>         let theme = Rc::new(ThemeConfig {
>             font_family: "Inter".to_string(),
>             primary_color: "#007ACC".to_string(),
>             font_size: 14,
>         });
> 
>         let window = Widget::new("window", Rc::clone(&theme));
>         let panel = Widget::new("panel", Rc::clone(&theme));
>         let button = Widget::new("button", Rc::clone(&theme));
> 
>         panel.add_child(Rc::clone(&button));
>         window.add_child(Rc::clone(&panel));
> 
>         // Explicit assertions
>         assert_eq!(Rc::strong_count(&theme), 4); // theme handle + 3 widgets
>         assert!(window.state.borrow().enabled);
>         assert_ne!(window.total_clicks(), 5);
> 
>         // Dispatch click event down the tree
>         window.click();
> 
>         assert_eq!(window.total_clicks(), 1);
>         assert_eq!(panel.total_clicks(), 1);
>         assert_eq!(button.total_clicks(), 1);
> 
>         assert!(matches!(button.theme.font_size, 14));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Combining `Rc<T>` and `RefCell<T>` (Shared Interior Mutability)**: `Rc<T>` grants shared ownership but enforces strict immutability (`&T`). To permit state mutation through shared pointers, Rust combines `Rc<T>` with `RefCell<T>`. `RefCell<T>` dynamically enforces Rust's borrow checker invariants at runtime, allowing temporary exclusive access (`borrow_mut()`) without requiring `&mut` references to the outer `Widget`.
> 2. **Performance Advantages Over `Arc<Mutex<T>>`**: Multi-threaded smart pointers (`Arc<Mutex<T>>`) incur synchronization overhead via hardware atomic instructions (`LOCK` prefix on x86) and thread kernel synchronization primitives. In single-threaded contexts (such as browser WASM apps or desktop event loops), `Rc<RefCell<T>>` replaces atomic operations with plain integer field manipulation, yielding significantly lower latency.
> 3. **Cascading Event Propagation & Reentrancy Guards**: During `Widget::click()`, calling `self.children.borrow()` holds a shared borrow (`Ref`) on the `children` vector while iterating. If a child widget handler attempted to call `add_child()` on `self` during event dispatch, `borrow_mut()` would detect simultaneous mutable and immutable borrows and panic with `AlreadyBorrowed`.
> 4. **Drop Cascades in Tree Hierarchies**: When the root `window` is dropped, its `children` vector is dropped, decrementing the strong count of `panel` from 1 to 0. This triggers `panel`'s `Drop` implementation, which drops its `children` vector, decrementing `button`'s strong count to 0 and reclaiming all allocated widgets in a clean, non-recursive cascade.

---

## 6. Related Terms

- [`Arc<T>`](../level_03/arc_t.md) — The thread-safe sibling to `Rc` (Atomic Reference Counted).
- [`RefCell<T>`](../level_03/refcell_t.md) — A tool often wrapped *inside* an `Rc` to allow you to mutate the shared data safely.
- [Ownership](../level_03/ownership.md) — The strict "One Owner" rule that `Rc` safely bends.

---

## 7. Key Takeaways

- `Rc<T>` enables **Shared Ownership** of data in Rust.
- It works by keeping a "Reference Count" of exactly how many owners currently exist.
- The underlying data is only dropped when the count reaches `0`.
- You increase the count using `Rc::clone(&var)`. This is incredibly fast because it only increments an integer; it does *not* deep copy the data.
- Data inside an `Rc` is strictly **read-only**.
- `Rc` is not thread-safe and can only be used in single-threaded programs.
