# `Sized` Trait

> **Level 11 — Smart Pointers & Advanced Types**
> Marker trait for types with a known compile-time size; implicitly bound on generics.

---

## 1. Prerequisites

- [Dynamically Sized Types (DSTs)](../level_11/dynamically_sized_types.md) — The types that do *not* implement `Sized`.
- [Generics](../level_04/generics.md) — The syntax where `Sized` becomes incredibly important.
- [Marker Traits](../level_14/marker_traits.md) — Traits with no methods, used purely to communicate with the compiler.

---

## 2. Term Category

**Rust Memory Model (the invisible boundary)**: `Sized` is a Marker Trait automatically applied by the compiler to any type whose exact byte size is known at compile time (e.g., `u32`, `String`, `&str`). 

It is the exact opposite of a Dynamically Sized Type (DST like `str` or `[T]`). 

The most important thing to know about `Sized` is that **the compiler secretly injects it into every single generic function you write!**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The compiler needs to mathematically guarantee if a type can safely be placed on the Stack memory. It uses the `Sized` trait to track this. If a type implements `Sized`, it goes on the Stack. If it doesn't, it is a DST and must be put behind a pointer. 

But the real magic (and confusion) happens with Generics. 

If you write a generic function `fn do_work<T>(item: &T)`, the compiler secretly rewrites it as `fn do_work<T: Sized>(item: &T)`. It automatically assumes that all generics must have a fixed size! If you try to pass a `&str` into this function, the compiler will throw an error, because the underlying `str` is a DST and does not implement `Sized`! 

To fix this, you must explicitly tell the compiler to *remove* the `Sized` restriction using the special **`?Sized`** syntax.

### (2) Reality Metaphor

Imagine a VIP Nightclub with an invisible bouncer.

- **`Sized`**: A VIP pass for people who are exactly 6 feet tall (fixed size).
- **The Generic Function (`<T>`)**: You throw a party and put up a sign that says *"Anyone is invited!"* 
- **The Invisible Bouncer**: The compiler secretly hires a bouncer who stands at the door and says, *"When the boss said 'Anyone', he secretly meant 'Anyone who is exactly 6 feet tall' (`<T: Sized`)."* If a 5-foot person (a DST) tries to enter, the bouncer aggressively rejects them!
- **`?Sized`**: You realize the bouncer is ruining your party. You walk outside and put up a new sign that says *"You do NOT need to be exactly 6 feet tall!" (`<T: ?Sized`)*. The bouncer finally relaxes and lets everyone in!

### (3) Rust Code Examples

#### Short Snippet (The Secret Injection)
When you write a normal generic function, the compiler secretly adds the `Sized` bound.

```rust
// What you write:
fn do_work<T>(item: T) { }

// What the compiler secretly compiles:
fn do_work<T: Sized>(item: T) { }
```

#### Fuller Example (The `?Sized` Escape Hatch)
Let's see what happens when we try to write a generic function that accepts a reference to *any* type, and we try to pass in a `str` (a Dynamically Sized Type).

```rust
use std::fmt::Debug;

// We write a generic function. The compiler secretly adds `T: Sized`.
fn print_data<T: Debug>(data: &T) {
    println!("{:?}", data);
}

fn main() {
    let number: i32 = 5;
    print_data(&number); // SUCCESS! i32 is Sized.
    
    let text: &str = "Hello";
    
    // COMPILE ERROR! `str` is not `Sized`!
    // print_data(text); 
}
```

How do we fix this? We use `?Sized` to tell the compiler to relax its strict rules!

```rust
use std::fmt::Debug;

// `?Sized` means: "T may or may not be Sized. I don't care, just let it in!"
fn print_data_fixed<T: Debug + ?Sized>(data: &T) {
    println!("{:?}", data);
}

fn main() {
    let text: &str = "Hello";
    print_data_fixed(text); // SUCCESS!
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Sized Trait Scoping and Lifecycle Rules

**The mistake:** Assuming Sized Trait instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("sized_trait_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("sized_trait_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Sized Trait State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Sized Trait through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Sized Trait Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Sized Trait instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Translation

**Problem:** Translate the meaning of `<T: ?Sized>` into plain English.

> [!check]- Answer
> "The generic type `T` **may or may not be Sized**." 
>
> It explicitly tells the compiler to remove its default rule that all generics must have a fixed compile-time size, allowing Dynamically Sized Types (DSTs) like `str` and `[T]` to be passed into the function (usually behind a pointer).

---

### Exercise 2: Relaxing Sized Bounds with `?Sized`

**Problem:** Write a generic function `fn print_ref<T: ?Sized + std::fmt::Display>(val: &T)` accepting `str` slices.

**Expected output:**
> [!check]- Answer
> ```
> Printed DST: hello
> ```
> ```rust
> fn print_ref<T: ?Sized + std::fmt::Display>(val: &T) {
>     println!("Printed DST: {}", val);
> }
> fn main() {
>     let s: &str = "hello";
>     print_ref(s);
> }
> ```
>
> **Explanation:** `?Sized` opts out of implicit compile-time size requirements.

---

### Exercise 3: Checking Memory Sizes with `std::mem::size_of`

**Problem:** Print `size_of::<i32>()` and explain why `Sized` types have compile-time known memory layout sizes.

**Expected output:**
> [!check]- Answer
> ```
> Size of i32: 4 bytes
> ```
> use std::mem::size_of;
> fn main() {
>     println!("Size of i32: {} bytes", size_of::<i32>());
> }
> ```
>
> **Explanation:** `Sized` types have known stack sizes fixed during compilation.

---

## 6. Related Terms

- [Dynamically Sized Types (DSTs)](../level_11/dynamically_sized_types.md) — The types (like `str`) that do *not* implement `Sized`.
- [Generics](../level_04/generics.md) — The syntax where `Sized` and `?Sized` are almost exclusively used.

---

## 7. Key Takeaways

- **`Sized`** is an invisible marker trait automatically applied to types with a known, fixed byte size at compile time.
- The compiler **secretly injects** the `<T: Sized>` restriction into every single generic function and struct you write!
- If you want a generic function to accept Dynamically Sized Types (like `str` or `[T]`), you must explicitly remove the restriction using the **`<T: ?Sized>`** syntax.
- `?Sized` is pronounced *"May or may not be Sized"*. It is an escape hatch to relax the compiler's strict default rules!
