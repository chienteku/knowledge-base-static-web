# `Vec<T>`

> **Level 2 — Control Flow & Data Structures**
> A growable, heap-allocated array (vector). The most common collection type.

---

## 1. Prerequisites

- [Compound Types](../level_01/compound_types.md) — Specifically Arrays (`[T; N]`), which are the fixed-size cousin of Vectors.
- [`Option<T>`](../level_02/option_t.md) — Used heavily when safely reading data out of a Vector.

---

## 2. Term Category

**Rust-nonspecific**: Vectors (also called dynamic arrays) are a fundamental data structure in computer science. They exist in almost every language under different names: `ArrayList` in Java, `list` in Python, `Array` in JavaScript, and `std::vector` in C++.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The standard [Array](../level_01/compound_types.md) in Rust (`[T; N]`) is incredibly fast because it is stored directly on the Stack memory. However, it is rigid. Its size must be perfectly known at compile-time, and it can never grow or shrink. 

In the real world, you rarely know exactly how much data you will process. For example, how many users will sign up for your app? How many lines are in a text file?

Rust provides the **Vector** (`Vec<T>`) to solve this. It is a dynamic array that stores its data on the **Heap** memory. Because the Heap is flexible, a Vector can dynamically grow and shrink while your program is running. It is the single most commonly used collection in Rust.

### (2) Reality Metaphor

A standard Array is like a **Styrofoam Egg Carton**. It holds exactly 12 eggs. If you try to put a 13th egg in it, it physically cannot fit, and the structure breaks.

A Vector is like a **Magic Storage Box**. You start putting items into the box. If the box gets completely full, it magically calls the storage facility (the Heap), asks for a brand new box that is twice as big, moves all your items into the new box, and throws the old one away. This allows you to keep adding items indefinitely!

### (3) Rust Code Examples

#### Short Snippet (Creation and Pushing)
```rust
fn main() {
    // 1. Create a new, empty Vector. 
    // We must use `mut` if we want to add things to it!
    let mut names: Vec<String> = Vec::new();
    
    // 2. Add items to the end of the Vector using `.push()`
    names.push(String::from("Alice"));
    names.push(String::from("Bob"));
    
    // 3. Remove the last item using `.pop()`
    let last_person = names.pop(); // Returns Option::Some("Bob")
}
```

#### Fuller Example (The `vec!` Macro and Safe Access)
```rust
fn main() {
    // Rust provides a handy macro `vec![]` to create a Vector with starting data.
    let numbers = vec![10, 20, 30];
    
    // How do we read the data?
    
    // Option A: Direct Indexing (DANGEROUS)
    // If you guess the index wrong, the entire program crashes (Panics).
    let third = numbers[2]; 
    println!("The third number is {}", third);
    // let oops = numbers[100]; // This line would instantly crash the program!
    
    // Option B: The `.get()` method (SAFE)
    // This returns an `Option<T>`. If the index is out of bounds, it just returns `None`.
    match numbers.get(100) {
        Some(num) => println!("The number is {}", num),
        None => println!("That index does not exist! Program didn't crash!"),
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Vec T Scoping and Lifecycle Rules

**The mistake:** Assuming Vec T instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("vec_t_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("vec_t_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Vec T State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Vec T through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Vec T Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Vec T instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Shopping List

**Problem:** Create a mutable shopping list Vector using the `vec!` macro pre-filled with `"Apples"` and `"Milk"`. Then, use `.push()` to add `"Bread"` to the list. Finally, print the length of the list using the `.len()` method.

```rust
fn main() {
    // TODO: Create a mutable `shopping_list` using the `vec!["Apples", "Milk"]` macro
    
    // TODO: Push "Bread" onto the list
    
    // TODO: Print the length of the list using `shopping_list.len()`
}
```

**Expected output:**
> [!check]- Answer
> ```text
> I have 3 items to buy.
> ```
> ```rust
> let mut shopping_list = vec!["Apples", "Milk"];
> shopping_list.push("Bread");
> println!("I have {} items to buy.", shopping_list.len());
> ```

---

### Exercise 2: Safe Vector Indexing with `.get()`

**Problem:** Safely access element at index 5 of `vec![1, 2, 3]` using `.get()` and print `"Out of bounds"` if `None`.

**Expected output:**
> [!check]- Answer
> ```
> Out of bounds
> ```
> ```rust
> fn main() {
>     let v = vec![1, 2, 3];
>     match v.get(5) {
>         Some(val) => println!("Val: {}", val),
>         None => println!("Out of bounds"),
>     }
> }
> ```
>
> **Explanation:** `.get()` returns `Option<&T>` without panicking on out-of-bounds accesses.

---

### Exercise 3: Pre-allocating Vector Capacity

**Problem:** Create a vector with pre-allocated capacity for 100 items using `Vec::with_capacity(100)`.

**Expected output:**
> [!check]- Answer
> ```
> Capacity: 100
> ```
> ```rust
> fn main() {
>     let v: Vec<i32> = Vec::with_capacity(100);
>     println!("Capacity: {}", v.capacity());
> }
> ```
>
> **Explanation:** Pre-allocating capacity avoids frequent heap re-allocations during bulk pushes.

---

## 6. Related Terms

- [Compound Types](../level_01/compound_types.md) — The rigid, fixed-size cousin of `Vec`.
- [`Option<T>`](../level_02/option_t.md) — The type returned by the safe `Vec::get()` method.
- [Iterator](../level_02/iterator.md) — The idiomatic way to loop through every item inside a Vector.

---

## 7. Key Takeaways

- `Vec<T>` is a dynamic, growable array stored on the Heap memory.
- You can create one using `Vec::new()` or the handy `vec![1, 2, 3]` macro.
- Use `.push(value)` to add items to the end, and `.pop()` to remove the last item.
- Accessing an item via brackets `my_vec[index]` will crash the program if the index doesn't exist.
- Accessing an item via `my_vec.get(index)` is safe and gracefully returns an `Option<T>`.
