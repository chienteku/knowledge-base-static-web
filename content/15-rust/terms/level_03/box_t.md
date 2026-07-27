# `Box<T>`

> **Level 3 — Ownership & Borrowing**
> A smart pointer that allocates data on the heap with single ownership.

---

## 1. Prerequisites

- [Ownership](../level_03/ownership.md) — The fundamental "One Owner" rule that `Box` strictly enforces.
- [Scalar Types](../level_01/scalar_types.md) — Types like `i32` that default to living on the fast Stack memory.
- [Enum](../level_02/enum.md) — Often used in combination with `Box` to build recursive data structures.

---

## 2. Term Category

**Rust-specific (the safe pointer)**: In C/C++, you move data to the Heap using `malloc` or `new`, which requires you to manually `free` the memory later to prevent leaks. In Rust, `Box<T>` safely moves data to the Heap and automatically cleans it up using the `Drop` trait.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

By default, simple data in Rust (like integers, booleans, and small structs) is stored on the **Stack**. The Stack is incredibly fast, but it has one strict rule: *the compiler must know the exact size of the data at compile time.*

What if you are building a recursive data structure, like a Linked List? A `Node` contains some data, plus another `Node`. That `Node` contains another `Node`, which contains another `Node`... The compiler tries to calculate the size of this infinite Russian nesting doll and fails, throwing an error: `recursive type has infinite size`.

To fix this, you must store the actual data on the **Heap**, and only keep a fixed-size "pointer" (a memory address) on the Stack. 

**`Box<T>`** is the simplest smart pointer in Rust. It takes any data, moves it to the Heap, and gives you a single, exclusive pointer to it. Because a pointer is always the exact same size (just an address number like `0x8A45F`), the compiler is happy!

### (2) Reality Metaphor

Imagine you buy a massive, 10-foot tall grand piano (large data).

You can't fit the piano inside your tiny apartment (**the Stack**). So, you rent a massive storage unit (**the Heap**) and put the piano inside. The storage company gives you exactly one physical key (**the `Box<T>`**). 

You keep the tiny key in your apartment. It doesn't take up much space, and it proves you are the sole owner of the piano. When you move out of your apartment (go out of scope), you throw the key away, and the storage company automatically throws the piano in the trash to clear the unit (**the `Drop` trait**).

### (3) Rust Code Examples

#### Short Snippet (Moving an integer to the Heap)
An `i32` normally lives on the Stack. By wrapping it in `Box::new()`, we force it onto the Heap.
```rust
fn main() {
    // b is a Box that points to the number 5 on the Heap.
    let b = Box::new(5);
    
    // Rust automatically follows the pointer to print the value!
    println!("b = {}", b);
} // b goes out of scope here. The Heap memory is freed instantly.
```

#### Fuller Example (Fixing a Recursive Type)
This is the most common use-case for `Box`. Without `Box`, the `List` enum below would fail to compile because it has infinite size.

```rust
// A simple Linked List: It is either a Node (Item + Next List), or Empty.
enum List {
    Node(i32, Box<List>), // The Box makes the `next` field a fixed-size pointer!
    Empty,
}

use List::{Node, Empty};

fn main() {
    // We create a list: [1, 2, 3]
    let my_list = Node(1, Box::new(Node(2, Box::new(Node(3, Box::new(Empty))))));
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Box T Scoping and Lifecycle Rules

**The mistake:** Assuming Box T instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("box_t_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("box_t_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Box T State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Box T through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Box T Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Box T instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Recursive Struct

**Problem:** The `BinaryTree` struct below fails to compile with the error `recursive type has infinite size`. Fix the struct definition by wrapping the `left` and `right` child fields in a `Box`.

```rust
// TODO: Fix the infinite size error!
struct BinaryTree {
    value: i32,
    left: Option<BinaryTree>,
    right: Option<BinaryTree>,
}

fn main() {
    let leaf = BinaryTree {
        value: 10,
        left: None,
        right: None,
    };
    println!("Leaf created!");
}
```

> [!check]- Answer
> Wrap the `BinaryTree` type inside the `Option` with a `Box`.
> 1. `left: Option<Box<BinaryTree>>,`
> 2. `right: Option<Box<BinaryTree>>,`

---

### Exercise 2: Recursive Enum Struct Layout with `Box`

**Problem:** Define a recursive `List` enum: `Cons(i32, Box<List>)` or `Nil`. Construct a list `1 -> 2 -> Nil`.

**Expected output:**
```
Head: 1
```

> [!check]- Answer
> enum List {
>     Cons(i32, Box<List>),
>     Nil,
> }
> fn main() {
>     let list = List::Cons(1, Box::new(List::Cons(2, Box::new(List::Nil))));
>     if let List::Cons(val, _) = list {
>         println!("Head: {}", val);
>     }
> }
> ```
>
> **Explanation:** Indirection via `Box` gives recursive types a known, fixed stack size at compile time.

### Exercise 3: Deref Coercion with Boxed Types

**Problem:** Pass a `Box<String>` to a function expecting `&str` using automatic deref coercion.

**Expected output:**
```
Boxed text: Rust
```

> [!check]- Answer
> fn print_slice(s: &str) { println!("Boxed text: {}", s); }
> fn main() {
>     let b = Box::new(String::from("Rust"));
>     print_slice(&b);
> }
> ```
>
> **Explanation:** `Box<T>` implements `Deref<Target = T>`, allowing `&Box<String>` to coerce cleanly into `&str`.

---

## 6. Related Terms

- [`Rc<T>`](../level_03/rc_t.md) — The smart pointer you use when you need Heap allocation *and* multiple owners. (`Box` strictly enforces One Owner).
- [`Vec<T>`](../level_02/vec_t.md) — Under the hood, `Vec` actually uses a `Box` to store its growable list of items on the Heap!

---

## 7. Key Takeaways

- `Box<T>` moves data from the Stack to the Heap.
- It maintains strict **Single Ownership** (unlike `Rc`).
- When the `Box` goes out of scope, the Heap data is automatically freed.
- It is primarily used to create **recursive data structures** (like Trees and Linked Lists) where the compiler cannot determine the size at compile time.
- You can access or modify the inner data by using the dereference operator (`*my_box`).
