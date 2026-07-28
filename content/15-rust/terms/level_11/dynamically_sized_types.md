# Dynamically Sized Types (DSTs)

> **Level 11 — Smart Pointers & Advanced Types**
> Types whose size is unknown at compile time (e.g. `str`, `[T]`); always used behind a pointer.

---

## 1. Prerequisites

- [Stack vs Heap](../level_15/stack_vs_heap.md) — The Stack requires fixed sizes; the Heap allows dynamic sizes.
- [`String` vs `&str`](../level_01/string_vs_&str.md) — The most famous example of a fixed vs dynamic type.
- [Trait Objects (`dyn Trait`)](../level_04/trait_objects.md) — The other incredibly common DST.

---

## 2. Term Category

**Rust Memory Model (the unstackable types)**: Dynamically Sized Types (DSTs) are types whose exact byte size cannot be known until the program is actually running. 

The three most famous examples are **`str`** (a string of unknown length), **`[T]`** (an array slice of unknown length), and **`dyn Trait`** (a trait object that could be any underlying struct). Because the compiler doesn't know how many bytes these types take up, you are mathematically forbidden from storing them directly on the Stack. They *must* be hidden behind a pointer!

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The Stack memory structure is incredibly fast, but it has one massive limitation: it requires the compiler to know the exact byte size of *every* variable at compile time. 
- A `u32` is always 4 bytes. 
- An `f64` is always 8 bytes. 

But what about a `str`? Is it `"Hi"` (2 bytes) or the entire script of *The Lord of the Rings* (3 million bytes)? The compiler doesn't know! If you try to write `let x: str = "Hi";`, the compiler panics because it doesn't know how much Stack space to reserve.

To use a DST, you must hide it behind a **Pointer** (like `&str`, `Box<str>`, or `Rc<str>`). The pointer itself is a "Fat Pointer" with a fixed size (usually 16 bytes: 8 bytes for the memory address, 8 bytes for the length), which *can* safely be placed on the Stack!

### (2) Reality Metaphor

Imagine you manage a Shipping Yard (the Stack).

- **Sized Types (`u32`, `String`)**: Customers hand you standard 20-foot metal shipping containers. You know exactly how to stack them perfectly.
- **Dynamically Sized Types (`str`, `[T]`)**: A customer hands you a container made of stretchy rubber. It could be 5 feet long, or it could be 500 feet long. You refuse to stack it! It would ruin the math of your entire shipping yard! (Compile Error). 
- **The Pointer Fix (`&str`)**: The customer puts the rubber container in a remote warehouse (the Heap or Read-Only Memory), and hands you a standard 3x5 paper Index Card. The card contains the address of the warehouse and the length of the rubber container. The Index Card is a fixed size, so you happily stack the card in your yard!

### (3) Rust Code Examples

#### Short Snippet (The Classic Compiler Error)
Every Rust beginner tries to write this code, and is immediately hit with the DST compiler error.

```rust
fn main() {
    // COMPILE ERROR: the size for values of type `str` cannot be known at compilation time!
    // let my_text: str = "Hello"; 

    // SUCCESS! We hide the `str` behind a reference (`&`). 
    // The `&str` pointer has a known, fixed size of 16 bytes!
    let my_text: &str = "Hello"; 
}
```

#### Fuller Example (Trait Objects are DSTs!)
If you write `trait Animal {}`, the type `dyn Animal` is dynamically sized! Why? Because it could be representing a 4-byte `Dog` struct, or a 1,000-byte `Elephant` struct! You cannot store it directly.

```rust
trait Animal {
    fn speak(&self);
}

struct Dog; 
impl Animal for Dog { fn speak(&self) { println!("Woof"); } }

// COMPILE ERROR: `dyn Animal` is a DST! The compiler doesn't know how big `animal` is!
// fn feed(animal: dyn Animal) { animal.speak(); }

// SUCCESS! We put the DST behind a Box (a pointer).
// The Box has a fixed size of 16 bytes on the Stack, pointing to the Heap!
fn feed_correctly(animal: Box<dyn Animal>) {
    animal.speak();
}

fn main() {
    let my_dog = Box::new(Dog);
    feed_correctly(my_dog);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Dynamically Sized Types Scoping and Lifecycle Rules

**The mistake:** Assuming Dynamically Sized Types instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("dynamically_sized_types_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("dynamically_sized_types_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Dynamically Sized Types State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Dynamically Sized Types through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Dynamically Sized Types Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Dynamically Sized Types instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Fix

**Problem:** You write a function `fn process_data(data: [u8])`. The compiler screams at you that `[u8]` is a Dynamically Sized Type. Provide two different ways to fix the function signature by putting the DST behind a pointer.

> [!check]- Answer
> 1. **Borrow it**: `fn process_data(data: &[u8])` (Uses a reference).
> 2. **Own it on the Heap**: `fn process_data(data: Box<[u8]>)` (Uses a Box pointer).
>
> Both `&` and `Box` are fixed-size pointers that the Stack accepts happily!

---

### Exercise 2: Placing Custom DSTs Behind Pointers

**Problem:** Demonstrate placing unsized slice DST `[i32]` behind a reference `&[i32]`.

**Expected output:**
> [!check]- Answer
> ```
> Slice DST len: 3
> ```
> ```rust
> fn print_dst(slice: &[i32]) {
>     println!("Slice DST len: {}", slice.len());
> }
> fn main() {
>     let arr = [1, 2, 3];
>     print_dst(&arr);
> }
> ```
>
> **Explanation:** References to DSTs store metadata (fat pointers) containing slice lengths or vtable addresses.

---

### Exercise 3: Opting Out of `Sized` with `?Sized` — Prove It's Needed

**Problem:**
The compiler secretly adds `T: Sized` to every generic parameter by default. Your job is to prove this matters by doing the following:

1. Write a generic `fn describe<T>(val: &T)` (no bounds) and explain why calling it with a `&str` already works — but why **you could not take `val: T` by value**.
2. Write a generic struct `struct Wrapper<T>` (no explicit `?Sized`) and show the compiler error you'd get trying to store a `&str` inside it.
3. Fix the struct with `struct Wrapper<T: ?Sized>` and demonstrate it can hold **both** `&str` and `&[i32]` — two completely different DSTs — with the same struct definition.

**Expected output:**
> [!check]- Answer
> ```text
> str says: "hello"
> slice says: [10, 20, 30]
> ```
>
> - **Hint 1:** `fn describe<T>(val: &T)` works with `&str` because `&str` is itself `Sized` (a fat pointer is a fixed-size struct). The implicit `T: Sized` constraint applies to `T` — meaning `str` is not allowed as `T`, but `&str` *is* allowed because `&str` is `Sized`. Passing by value (`val: T`) would require `T = str`, which is unsized and forbidden.
> - **Hint 2:** `struct Wrapper<'a, T> { inner: &'a T }` fails with a compile error about missing a lifetime — add `'a`: `struct Wrapper<'a, T> { inner: &'a T }`. Then try `Wrapper::<str>` and observe `E0277: the size of type str cannot be known at compilation time`. Adding `: ?Sized` removes this restriction.
> - **Hint 3:** Once `T: ?Sized`, the *same* `Wrapper` struct can hold `&str`, `&[i32]`, or `&dyn Trait` — any reference to a DST. The struct itself stays fixed-size because its only field is a *reference* (a fat pointer), not the DST directly.
>
> ```rust
> // Step 1: a function that accepts any &T, even where T is a DST.
> // The implicit Sized bound is on T, but we take &T — a reference is always Sized.
> fn describe<T: ?Sized + std::fmt::Debug>(val: &T) {
>     println!("{:?}", val);
> }
>
> // Step 2 (broken): struct Wrapper<'a, T> { inner: &'a T }
> // Compiler: `T` does not implement `Sized` when T = str — E0277.
>
> // Step 3 (fixed): add ?Sized to allow DST type parameters.
> struct Wrapper<'a, T: ?Sized> {
>     label: &'static str,
>     inner: &'a T, // the field is a *reference*, so the struct stays Sized
> }
>
> fn main() {
>     // Wrap a &str DST
>     let s = Wrapper { label: "str says", inner: "hello" };
>     print!("{}: ", s.label);
>     describe(s.inner);
>
>     // Same struct, different DST — &[i32]
>     let arr = [10_i32, 20, 30];
>     let sl = Wrapper { label: "slice says", inner: arr.as_slice() };
>     print!("{}: ", sl.label);
>     describe(sl.inner);
> }
> ```
>
> **Explanation:**
> Without `?Sized`, every generic `T` implicitly carries `T: Sized` — the compiler must be able to determine `T`'s exact byte size at compile time. DSTs like `str` and `[i32]` have no fixed size, so they fail this check when used directly as `T`. Adding `T: ?Sized` ("may or may not be Sized") lifts the restriction, allowing DSTs as the type argument. The key insight is that the struct itself stays `Sized` because its field is `&'a T` (a fat pointer with a known, fixed size), not `T` directly — you are never storing the DST on the stack, only a reference to it.

---

## 6. Related Terms

- [`Sized` Trait](../level_11/sized_trait.md) — The invisible auto-trait the compiler uses to track if a type is fixed-size or a DST.
- [Trait Objects (`dyn Trait`)](../level_04/trait_objects.md) — The most common DST other than strings and slices.

---

## 7. Key Takeaways

- **Dynamically Sized Types (DSTs)** are types whose size cannot be known at compile time.
- The "Big Three" DSTs in Rust are **`str`**, **`[T]`** (slices), and **`dyn Trait`** (Trait Objects).
- Because the Stack requires fixed sizes, you are mathematically forbidden from storing DSTs directly in variables!
- You **MUST** put DSTs behind a pointer (e.g. `&str`, `Box<[T]>`, `Rc<dyn Trait>`). The pointer itself is a "Fat Pointer" with a known, fixed size that can safely live on the Stack!
