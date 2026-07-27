# Move Semantics

> **Level 3 — Ownership & Borrowing**
> Assigning or passing a value transfers ownership; the original binding becomes invalid.

---

## 1. Prerequisites

- [Ownership](../level_03/ownership.md) — Move semantics are the direct consequence of the rule: "There can only be one owner at a time."
- [String vs &str](../level_01/string_vs_&str.md) — `String` data lives on the Heap, making it the perfect example of a type that gets "moved".

---

## 2. Term Category

**Rust-specific (the default behavior)**: When you assign a variable to another (`y = x`), most languages perform either a "Shallow Copy" or a "Deep Copy". Rust rejects both of these and performs a "Move" instead.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

What should happen when you write the following code?
```rust
let a = String::from("Hello");
let b = a; 
```

1. **The Python/Java approach (Shallow Copy)**: `a` and `b` both point to the exact same `"Hello"` on the Heap. This is fast, but dangerous. If you modify `b`, `a` magically changes too, causing invisible bugs. Furthermore, when `a` and `b` go out of scope, the computer will try to clean up `"Hello"` twice (a "Double Free" error), which crashes the program.
2. **The C++ approach (Deep Copy)**: The computer creates a brand new, second `"Hello"` on the Heap for `b`. This is safe, but incredibly slow. If `"Hello"` was a 10-Gigabyte text file, you just accidentally copied 10 GB of data with an innocent `=` sign!

Rust's Ownership rules say: *There can only be one owner at a time.* 

Therefore, Rust does a **Move**. It copies the pointer to the Heap (fast), but then it *immediately invalidates the original variable `a`* (safe). It guarantees blazing speed without the risk of double-free crashes or accidental mutations.

### (2) Reality Metaphor

Imagine holding the physical deed to a house. 

- **In Java**, if you assign the deed to your friend (`friend = you`), the government prints a second deed. You both own the house. If you paint the living room red, your friend walks in and is shocked to find their house is red.
- **In C++**, the government brings in bulldozers and builds an identical clone of the house next door for your friend. This is very expensive and takes a long time.
- **In Rust**, you physically hand the single deed to your friend. Your friend is the new owner. If you try to walk into the house afterward, the compiler arrests you for trespassing. You **moved** the ownership.

### (3) Rust Code Examples

#### Short Snippet (Variable Assignment)
```rust
fn main() {
    let s1 = String::from("Batman");
    
    // Ownership is MOVED from s1 to s2.
    let s2 = s1; 
    
    // s1 is now considered an "uninitialized" variable. 
    // It is completely dead.
    // println!("{}", s1); // COMPILER ERROR: "borrow of moved value: `s1`"
    
    println!("The new owner is {}", s2);
}
```

#### Fuller Example (Function Arguments)
Passing a variable to a function works *exactly the same way* as assigning it to a new variable with `=`.

```rust
fn take_ownership(received_string: String) {
    println!("I now own: {}", received_string);
} // `received_string` goes out of scope here and is dropped!

fn main() {
    let my_message = String::from("Secret Data");
    
    // Passing the variable into the function MOVES ownership to `received_string`.
    take_ownership(my_message);
    
    // `my_message` no longer owns the data. It is dead.
    // println!("{}", my_message); // ERROR: "borrow of moved value"
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Move Semantics Scoping and Lifecycle Rules

**The mistake:** Assuming Move Semantics instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("move_semantics_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("move_semantics_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Move Semantics State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Move Semantics through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Move Semantics Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Move Semantics instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Cloning Solution

**Problem:** The code below fails to compile because `greeting` is moved into `print_message`, making it invalid when `main` tries to print it. Fix the code by passing a *deep copy* into the function using `.clone()`.

```rust
fn print_message(msg: String) {
    println!("Function says: {}", msg);
}

fn main() {
    let greeting = String::from("Good morning!");
    
    // TODO: Fix this line so `greeting` isn't moved!
    print_message(greeting); 
    
    // This line should successfully print if fixed.
    println!("Main says: {}", greeting);
}
```

**Expected output:**
```text
Function says: Good morning!
Main says: Good morning!
```

> [!check]- Answer
> ```rust
> // Use the `.clone()` method to create a deep copy of the String.
> // This way, the clone is moved into the function, and the original stays alive!
> print_message(greeting.clone());
> ```

---

### Exercise 2: Moving Ownership Through Functions

**Problem:** Write `fn take_ownership(s: String) -> usize { s.len() }`. Show that calling it moves `s`.

**Expected output:**
```
Length: 5
```

> [!check]- Answer
> ```rust
> fn take_ownership(s: String) -> usize { s.len() }
> fn main() {
>     let text = String::from("hello");
>     let len = take_ownership(text);
>     // text is no longer valid here
>     println!("Length: {}", len);
> }
> ```
>
> **Explanation:** Ownership transfers into `take_ownership`, deallocating `text` upon function return.

### Exercise 3: Preventing Moves with `.clone()`

**Problem:** Pass a clone `s.clone()` into `take_ownership` so `s` remains valid in caller scope.

**Expected output:**
```
Len: 5, Original: hello
```

> [!check]- Answer
> ```rust
> fn take_ownership(s: String) -> usize { s.len() }
> fn main() {
>     let s = String::from("hello");
>     let len = take_ownership(s.clone());
>     println!("Len: {}, Original: {}", len, s);
> }
> ```
>
> **Explanation:** Explicitly cloning duplicates heap contents, creating a second independent owner.

---

## 6. Related Terms

- [`Clone` Trait](../level_03/clone_trait.md) — The explicit way to bypass a Move and perform a deep copy of the data.
- [`Copy` Trait](../level_03/copy_trait.md) — The reason why simple types like `i32` or `bool` do not get moved (they are copied automatically).
- [Borrowing (`&`)](../level_03/borrowing.md) — The idiomatic way to let a function read your data without moving ownership.

---

## 7. Key Takeaways

- When you assign a heap-allocated variable to another (`let y = x;`), Rust **moves** the data.
- The original variable `x` is immediately invalidated and can never be used again.
- Passing a variable into a function (`do_thing(x)`) also counts as a Move.
- This prevents double-free errors and accidental mutations without the performance cost of deep copying.
- If you see `borrow of moved value`, it means you tried to use a variable after you already gave it away!
