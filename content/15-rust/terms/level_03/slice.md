# Slice (`&[T]`, `&str`)

> **Level 3 — Ownership & Borrowing**
> A reference to a contiguous subsequence of a collection, without ownership.

---

## 1. Prerequisites

- [Borrowing (`&`)](../level_03/borrowing.md) — Slices are fundamentally just a special type of Borrow.
- [`Vec<T>`](../level_02/vec_t.md) — The most common collection that we slice into.
- [String vs &str](../level_01/string_vs_&str.md) — We previously learned that `&str` is a string reference. We can now reveal its true name: a **String Slice**.

---

## 2. Term Category

**Rust-specific (the safety integration)**: Slices exist in languages like Python (`my_list[1:4]`) and Go. However, in Rust, slices are deeply integrated into the Borrow Checker. The compiler guarantees that the underlying collection cannot be mutated or destroyed while a slice is actively looking at it.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Imagine you have a `Vec` of 1,000,000 temperatures, and you want to write a function that calculates the average of just the first 10 temperatures. 

If you create a brand new `Vec` and copy those 10 temperatures into it, you are wasting CPU cycles and Heap memory. What you really want is to pass the function a "window" that just looks at the original 10 items. 

This is a **Slice**. A slice is a read-only reference to a *slice* of a larger collection. Because it is just a reference (`&`), it does not take Ownership. It requires zero memory allocation, making it blazing fast.

### (2) Reality Metaphor

Imagine a massive encyclopedia sitting on a table in the library (a `String` or `Vec`).

A standard borrow (`&String`) is giving your friend the exact coordinates to the table so they can read the entire encyclopedia. 

A **Slice** (`&str` or `&[T]`) is giving your friend the coordinates to the table, but handing them a pair of blinders that only allows them to see Pages 45 to 50. They do not *own* the book, and they haven't made a physical photocopy of the pages. They are just looking at a specific window of the original book.

### (3) Rust Code Examples

#### Short Snippet (Creating Slices)
You create a slice using the `&` symbol combined with a range `[start..end]`. The `start` is inclusive, and the `end` is exclusive.
```rust
fn main() {
    let my_vec = vec![10, 20, 30, 40, 50];
    
    // Create a slice containing [20, 30, 40]
    let middle_slice: &[i32] = &my_vec[1..4];
    
    let message = String::from("Hello World");
    
    // Create a String Slice containing "Hello"
    let word_slice: &str = &message[0..5];
    
    println!("{:?}", middle_slice);
    println!("{}", word_slice);
}
```

#### Fuller Example (The Borrow Checker's Protection)
Slices are protected by the [Borrow Checker](../level_03/borrow_checker.md). If you create a slice, the compiler will aggressively prevent anyone from modifying the original collection until the slice is done being used.

```rust
fn main() {
    let mut sentence = String::from("Rust is fast");
    
    // We create a slice of the first word
    let first_word = &sentence[0..4]; 
    
    // DANGER: We try to clear the original String!
    // sentence.clear(); // COMPILER ERROR! 
    
    // Why did the compiler stop us? Because if `sentence` was cleared, 
    // `first_word` would be looking at deleted memory (a Dangling Reference)!
    
    println!("The first word is: {}", first_word);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Slice Scoping and Lifecycle Rules

**The mistake:** Assuming Slice instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("slice_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("slice_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Slice State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Slice through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Slice Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Slice instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Sub-Array

**Problem:** The function below is supposed to print the middle three numbers of the array, but it currently takes ownership of an entire `Vec`. Change the function signature to accept a slice of `i32` integers, and update the function call in `main` to pass a slice of the middle three numbers.

```rust
// TODO: Change this to accept a slice of i32s!
fn print_middle(data: Vec<i32>) {
    println!("Middle data: {:?}", data);
}

fn main() {
    let numbers = vec![1, 2, 3, 4, 5];
    
    // TODO: Pass a slice of indices 1 through 4 (exclusive)
    print_middle(numbers); 
}
```

> [!check]- Answer
> 1. Change the signature to `fn print_middle(data: &[i32])`.
> 2. Change the call to `print_middle(&numbers[1..4]);`.

---

### Exercise 2: Array Slicing and Window Processing

**Problem:** Pass a sub-slice `&arr[1..4]` of an array `[10, 20, 30, 40, 50]` to a function calculating slice sum.

**Expected output:**
> [!check]- Answer
> ```
> Slice sum: 90
> ```
> ```rust
> fn sum_slice(slice: &[i32]) -> i32 { slice.iter().sum() }
> fn main() {
>     let arr = [10, 20, 30, 40, 50];
>     let s = sum_slice(&arr[1..4]);
>     println!("Slice sum: {}", s);
> }
> ```
>
> **Explanation:** Slices `&[T]` provide cheap, non-owning views into contiguous memory sequences.

---

### Exercise 3: Mutable Slices Window Updates

**Problem:** Zero out elements of a sub-slice `&mut vec[1..3]` in-place.

**Expected output:**
> [!check]- Answer
> ```
> [10, 0, 0, 40]
> ```
> fn main() {
>     let mut vec = vec![10, 20, 30, 40];
>     for x in &mut vec[1..3] {
>         *x = 0;
>     }
>     println!("{:?}", vec);
> }
> ```
>
> **Explanation:** Mutable slices `&mut [T]` allow modifying contiguous elements without reallocating the underlying vector.

---

## 6. Related Terms

- [Borrowing (`&`)](../level_03/borrowing.md) — The fundamental mechanism that makes Slices memory-safe.
- [Borrow Checker](../level_03/borrow_checker.md) — The compiler cop that ensures you don't mutate the original collection while a slice is looking at it.

---

## 7. Key Takeaways

- A **Slice** (`&[T]` or `&str`) allows you to reference a contiguous sequence of elements in a collection rather than the whole collection.
- Because it is just a reference (`&`), it has **no Ownership** and performs zero memory allocations.
- A string slice is written as `&str`. An array/vector slice is written as `&[T]`.
- Slices are fiercely protected by the Borrow Checker. You cannot mutate or drop the original collection while a slice is actively looking at it!
