# `Drop` Trait

> **Level 3 — Ownership & Borrowing**
> Custom destructor logic; called automatically when a value goes out of scope.

---

## 1. Prerequisites

- [Ownership](../level_03/ownership.md) — The system that determines exactly *when* the Drop trait is triggered.
- [Traits](../level_04/trait.md) — (Future reference) The overarching system used to define shared interfaces and behaviors like `Drop`.

---

## 2. Term Category

**Rust-specific (the automation mechanism)**: C++ has "Destructors" and Python has `__del__`, but Rust's `Drop` trait is perfectly integrated with Ownership to ensure cleanup happens at the exact right millisecond, 100% of the time, without the need for a Garbage Collector.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

We learned in the Ownership chapter that when a variable goes out of scope, it is "dropped". But what does that actually mean? 

If the variable is a `String`, "dropping" means freeing the memory on the Heap. But what if the variable represents an open File, a Network Socket, or a Database Connection? Those resources don't just need their memory freed; they need to be explicitly "closed" so the Operating System can reuse them.

Rust solves this with the **`Drop` trait**. It allows you to write a custom block of "cleanup code". The compiler guarantees that this cleanup code will execute the exact moment the variable goes out of scope, whether the function finishes normally or crashes early. You never have to write `file.close()` manually again!

### (2) Reality Metaphor

Imagine renting a hotel room. 

When your rental period is over (you go out of scope), you leave the room. The **`Drop` trait** is the specific checklist of chores that must happen the moment you leave. 

For a simple integer, the checklist is completely empty. You just walk out. But for a Database Connection, the checklist involves logging out of the server, closing the network port, and returning the physical room key to the front desk. 

Rust ensures this checklist is executed by an invisible robot the very millisecond you step out of the room.

### (3) Rust Code Examples

#### Short Snippet (Writing Custom Cleanup)
To write custom cleanup code, you implement the `Drop` trait for your struct.
```rust
struct CustomSmartPointer {
    data: String,
}

// We define the cleanup code here!
impl Drop for CustomSmartPointer {
    fn drop(&mut self) {
        println!("Dropping CustomSmartPointer with data `{}`!", self.data);
    }
}

fn main() {
    let c = CustomSmartPointer { data: String::from("my stuff") };
    println!("CustomSmartPointer created.");
    
} // Scope ends here. `drop` is automatically called!
```
**Output:**
```text
CustomSmartPointer created.
Dropping CustomSmartPointer with data `my stuff`!
```

#### Fuller Example (Early Drop and LIFO Order)
Variables are dropped in the **reverse order** of their creation (Last In, First Out). If you ever need to clean something up *before* the scope naturally ends, you can force an early drop using `std::mem::drop`.

```rust
fn main() {
    let a = CustomSmartPointer { data: String::from("A") };
    let b = CustomSmartPointer { data: String::from("B") };
    
    println!("Variables created.");
    
    // We cannot call `b.drop()` directly. The compiler prevents it.
    // Instead, we pass ownership to the `drop` function to force early cleanup!
    drop(b);
    
    println!("End of main.");
} // `a` naturally drops here.
```
**Output:**
```text
Variables created.
Dropping CustomSmartPointer with data `B`!
End of main.
Dropping CustomSmartPointer with data `A`!
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Drop Trait Scoping and Lifecycle Rules

**The mistake:** Assuming Drop Trait instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("drop_trait_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("drop_trait_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Drop Trait State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Drop Trait through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Drop Trait Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Drop Trait instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Predict the Output

**Problem:** Read the code below. Predict the exact order the print statements will appear in the console.

*(Assume `Item` implements `Drop` and prints "Dropping [name]").*

```rust
fn main() {
    let item1 = Item::new("First");
    let item2 = Item::new("Second");
    
    println!("Halfway there!");
    
    let item3 = Item::new("Third");
    
    drop(item2);
}
```

> [!check]- Answer
> 1. `Halfway there!`
> 2. `Dropping Second` (Because of the explicit `drop(item2)` call)
> 3. `Dropping Third` (Last In, First Out at the end of the scope)
> 4. `Dropping First` (The first created is the last destroyed)

---

### Exercise 2: Custom File Cleaner Cleanup

**Problem:** Implement `Drop` for `struct TempFile { path: String }` printing cleanup logs on destruction.

**Expected output:**
```
Cleaning temp file: /tmp/test.txt
```

> [!check]- Answer
> ```rust
> struct TempFile { path: String }
> impl Drop for TempFile {
>     fn drop(&mut self) {
>         println!("Cleaning temp file: {}", self.path);
>     }
> }
> fn main() {
>     let _file = TempFile { path: "/tmp/test.txt".to_string() };
> }
> ```
>
> **Explanation:** `Drop::drop` executes destructor cleanup code automatically when instances leave scope.

### Exercise 3: RAII Resource Lock Guard

**Problem:** Build an RAII struct `LockGuard` printing `"Acquired lock"` on creation and `"Released lock"` on drop.

**Expected output:**
```
Acquired lock
Doing work
Released lock
```

> [!check]- Answer
> ```rust
> struct LockGuard;
> impl LockGuard {
>     fn new() -> Self { println!("Acquired lock"); Self }
> }
> impl Drop for LockGuard {
>     fn drop(&mut self) { println!("Released lock"); }
> }
> fn main() {
>     let _guard = LockGuard::new();
>     println!("Doing work");
> }
> ```
>
> **Explanation:** RAII patterns tie resource lifecycle management strictly to object lifetimes.

---

## 6. Related Terms

- [Ownership](../level_03/ownership.md) — The system that decides *when* the scope ends and `Drop` is called.
- [`Copy` Trait](../level_03/copy_trait.md) — As a rule, types that implement `Copy` are not allowed to implement `Drop` (you can't trivially duplicate something that requires complex cleanup!).

---

## 7. Key Takeaways

- The `Drop` trait allows you to define custom cleanup code (a "destructor") for a type.
- It is called **automatically** by the compiler the exact millisecond a variable goes out of scope.
- Variables are dropped in the reverse order of their creation (Last In, First Out).
- You cannot call `.drop()` manually, but you can force an early cleanup using `std::mem::drop(var)`.
- You rarely need to implement this yourself. Rust automatically drops all fields inside a struct for you.
