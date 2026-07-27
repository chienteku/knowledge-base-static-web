# Borrowing (`&`)

> **Level 3 — Ownership & Borrowing**
> Creating an immutable reference to a value without taking ownership.

---

## 1. Prerequisites

- [Ownership](../level_03/ownership.md) — The system that Borrowing is designed to work alongside.
- [Move Semantics](../level_03/move_semantics.md) — The destructive behavior that Borrowing successfully avoids.
- [String vs &str](../level_01/string_vs_&str.md) — We previously learned that `&str` is a string *reference*. Now we will learn exactly what that reference is!

---

## 2. Term Category

**Rust-specific (the elegant solution)**: While passing variables "by reference" exists in languages like C++, Rust's concept of "Borrowing" strictly ties references into the Ownership system. The compiler meticulously tracks borrows to guarantee they never cause bugs.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

We know that passing a `String` into a function triggers a **Move**. The function takes Ownership of the string, and when the function finishes, the string is permanently destroyed.

If you want to use that string again in your `main` function, you could pass a Deep Copy using `.clone()`, but copying Heap data is extremely slow and uses up lots of memory. What we really want is to let the function *look* at the data temporarily without actually giving it Ownership.

Rust solves this with **References (`&`)**. Creating a reference is called **Borrowing**. When you borrow data, you do not take Ownership of it. Because you don't own it, the compiler knows *not* to destroy the data when your scope ends!

### (2) Reality Metaphor

If **Ownership** is physically handing someone the legal deed to your house...

**Borrowing (`&`)** is giving them a piece of paper with your address written on it.
They can use the address to drive by and look at your house as much as they want. However, because they only have a piece of paper and not the legal deed, they don't actually *own* your house. Therefore, when they leave town, they aren't allowed to bulldoze your house. 

Because giving out a piece of paper is incredibly cheap, you can hand out as many addresses as you want without slowing anything down!

### (3) Rust Code Examples

#### Short Snippet (Passing a Reference)
```rust
// The function signature MUST specify it expects a reference (`&String`)
fn calculate_length(s: &String) -> usize {
    s.len()
} // `s` goes out of scope here. But because it is only a Borrow, nothing is dropped!

fn main() {
    let my_string = String::from("Hello Rust");
    
    // We pass `&my_string` (an address), NOT `my_string` (the deed).
    let len = calculate_length(&my_string);
    
    // Because we only borrowed it, `my_string` is still perfectly valid!
    println!("The length of '{}' is {}", my_string, len);
}
```

#### Fuller Example (Multiple Simultaneous Borrows)
Because standard borrows are strictly read-only, Rust allows you to have as many active borrows pointing to the same data as you want.

```rust
fn main() {
    let book = String::from("The Rust Book");
    
    // Alice borrows the book
    let alice_view = &book;
    
    // Bob borrows the book at the exact same time
    let bob_view = &book;
    
    // Everyone can read the book simultaneously without issue!
    println!("Alice reads: {}", alice_view);
    println!("Bob reads: {}", bob_view);
    println!("The Library still owns: {}", book);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Borrowing Scoping and Lifecycle Rules

**The mistake:** Assuming Borrowing instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("borrowing_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("borrowing_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Borrowing State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Borrowing through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Borrowing Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Borrowing instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Inspector

**Problem:** The `inspect` function currently takes ownership of the `String`, breaking the `println!` in `main`. Fix the code so that it uses Borrowing instead. You will need to change **two** lines of code.

```rust
// TODO: Fix the parameter type so it only borrows the String
fn inspect(text: String) {
    println!("Inspecting: {}", text);
}

fn main() {
    let secret = String::from("Password123");
    
    // TODO: Fix the argument so it passes a reference
    inspect(secret); 
    
    // This line should successfully compile after your fixes!
    println!("I still have my secret: {}", secret); 
}
```

> [!check]- Answer
> 1. Change `text: String` to `text: &String`.
> 2. Change `inspect(secret)` to `inspect(&secret)`.

---

### Exercise 2: Eliminating Unnecessary Clones via References

**Problem:** Refactor a function taking `String` by value to take `&str` reference instead, avoiding `.clone()` calls.

**Expected output:**
```
Processed: rust
```

> [!check]- Answer
> ```rust
> fn process(s: &str) {
>     println!("Processed: {}", s);
> }
> fn main() {
>     let text = String::from("rust");
>     process(&text);
>     println!("Still owned: {}", text);
> }
> ```
>
> **Explanation:** Borrowing `&str` avoids unnecessary heap allocations and cloning while keeping ownership with the caller.

### Exercise 3: Multiple Simultaneous Immutable Borrows

**Problem:** Create three simultaneous immutable references `r1`, `r2`, `r3` pointing to a single `String` and read all three in `println!`.

**Expected output:**
```
r1: hi, r2: hi, r3: hi
```

> [!check]- Answer
> ```rust
> fn main() {
>     let s = String::from("hi");
>     let r1 = &s;
>     let r2 = &s;
>     let r3 = &s;
>     println!("r1: {}, r2: {}, r3: {}", r1, r2, r3);
> }
> ```
>
> **Explanation:** Rust permits aliasing (multiple simultaneous immutable references) as long as no concurrent mutation occurs.

---

## 6. Related Terms

- [Mutable Borrowing (`&mut`)](../level_03/mutable_borrowing.md) — How to let a function temporarily *modify* your data without taking ownership.
- [Borrow Checker](../level_03/borrow_checker.md) — The strict compiler component that enforces all the rules of borrowing.

---

## 7. Key Takeaways

- **Borrowing** allows you to pass a reference to data (`&data`) instead of passing the data itself.
- Borrowing **does not** transfer Ownership.
- Because Ownership isn't transferred, the data is **not dropped** when the reference goes out of scope.
- Standard borrows (`&`) are completely **immutable**. You can read the data, but you cannot change it.
- You can have as many simultaneous immutable borrows pointing to the same data as you want.
