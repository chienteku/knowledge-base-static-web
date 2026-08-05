# Lifetime (`'a`)

> **Level 5 — Lifetimes**
> A compile-time annotation describing how long references remain valid.

---

## 1. Prerequisites


- [Borrow Checker](../level_03/borrow_checker.md) — The static analysis engine that checks reference validity.
- [Borrowing (`&`)](../level_03/borrowing.md) — Creating references to existing data.
- [Dangling Reference](../level_03/dangling_reference.md) — The memory bug that lifetimes prevent.

---

## 2. Term Category

**Rust-specific (the generic parameter for time)**: In most languages, memory safety is enforced by either a Garbage Collector (which tracks object lifetimes at runtime) or manual memory management (which risks dangling pointers). Rust takes a third path: **Lifetimes**. A lifetime is a generic parameter (like `'a`) that tells the compiler how the duration of one reference relates to another, allowing the compiler to guarantee memory safety at compile time without any runtime overhead.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Consider a function that takes two string slices and returns one of them:

```rust
// Which reference does the returned `&str` point to? x or y?
fn longest(x: &str, y: &str) -> &str {
    if x.len() > y.len() { x } else { y }
}
```

The Rust compiler needs to verify that the returned reference will not outlive the data it points to. But when compiling `longest`, the compiler doesn't know what concrete strings will be passed in at runtime! If `x` lives for 10 seconds and `y` lives for 2 seconds, how long does the returned reference live? 

To solve this without a garbage collector, Rust forces us to annotate generic lifetime parameters:

```rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}
```

This annotation says: *"The returned reference will live at least as long as the smaller of the lifetimes of `x` and `y`."* Now the borrow checker can verify callers statically!

### (2) Reality Metaphor

Imagine rental cars and car insurance policies.

- A **reference** is like a rented car key.
- The **underlying data** is the actual rental car.
- The **lifetime (`'a`)** is the expiration date stamped on your rental contract.

If you try to drive the car (dereference the pointer) after the contract expiration date (end of the data's lifetime), security shuts off the engine (the compiler throws a compile error). Lifetime annotations (`'a`) ensure that your rental contract is never longer than the rental company's lease on the car itself.

### (3) Rust Code Examples

#### Short Snippet (Explicit Lifetime Syntax)
Lifetime names start with an apostrophe `'` and are usually short lowercase letters like `'a`, `'b`.

```rust
// &'a str means a borrowed reference to a str that lives for lifetime 'a
// &'a mut i32 means a mutable reference to an i32 that lives for lifetime 'a

fn print_with_label<'a>(label: &'a str, value: i32) {
    println!("{label}: {value}");
}
```

#### Fuller Example (The `longest` Function)
```rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}

fn main() {
    let string1 = String::from("long string is long");
    let result;
    {
        let string2 = String::from("xyz");
        result = longest(string1.as_str(), string2.as_str());
        // result is valid here because both string1 and string2 are in scope
        println!("The longest string is {result}");
    }
    // If we tried to use `result` here, the compiler would reject it
    // because `string2` died at the end of the inner block!
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Lifetime Scoping and Lifecycle Rules

**The mistake:** Assuming Lifetime instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("lifetime_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("lifetime_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Lifetime State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Lifetime through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Lifetime Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Lifetime instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Annotate the Function

**Problem:** Add lifetime annotations to the function `first_three` so it compiles cleanly.

```rust
// TODO: Add lifetime annotations to `s` and the return value
fn first_three(s: &str) -> &str {
    &s[..3]
}
```

> [!check]- Answer
> ```rust
> fn first_three<'a>(s: &'a str) -> &'a str {
>     &s[..3]
> }
> ```
> *(Note: In idiomatic Rust, this specific function is covered by [Lifetime Elision](../level_05/lifetime_elision.md), but explicit annotations make the underlying contract explicit!)*

---

### Exercise 2: Longest String Slice Helper with Explicit Lifetimes

**Problem:** Write `fn longest<'a>(x: &'a str, y: &'a str) -> &'a str` returning the longer string slice.

**Expected output:**
> [!check]- Answer
> ```
> Longest: world
> ```
> ```rust
> fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
>     if x.len() > y.len() { x } else { y }
> }
> fn main() {
>     let s1 = "hello";
>     let s2 = "world";
>     println!("Longest: {}", longest(s1, s2));
> }
> ```
>
> **Explanation:** Explicit `'a` lifetime annotations state that returned reference validities match the shorter input slice validity.

---

### Exercise 3: Function Signatures with Multiple Distinct Lifetimes

**Problem:** Write a function returning a reference bound to the first parameter's lifetime `'a` while ignoring `'b`.

**Expected output:**
> [!check]- Answer
> ```
> First: alpha
> ```
> ```rust
> fn pick_first<'a, 'b>(x: &'a str, _y: &'b str) -> &'a str { x }
> fn main() {
>     let a = "alpha";
>     let b = "beta".to_string();
>     println!("First: {}", pick_first(a, &b));
> }
> ```
>
> **Explanation:** Disambiguating distinct lifetimes (`'a`, `'b`) decouples input reference validity constraints.

---

## 6. Related Terms


- [Lifetime Elision](lifetime_elision.md) — How Rust lets you omit `'a` in simple function signatures.
- [`'static` Lifetime](static_lifetime.md) — The special lifetime that lasts for the whole program execution.
- [Struct Lifetimes](struct_lifetimes.md) — Holding references inside structs.
- [Borrow Checker](../level_03/borrow_checker.md) — The static verifier enforcing lifetime constraints.
- [Dangling Reference](../level_03/dangling_reference.md) — Related concept: Dangling Reference.
- [Higher-Ranked Trait Bounds (HRTB)](higher_ranked_trait_bounds.md) — Related concept: Higher-Ranked Trait Bounds (HRTB).
- [Lifetime Bounds](lifetime_bounds.md) — Related concept: Lifetime Bounds.
- [Lifetime Variance](lifetime_variance.md) — Related concept: Lifetime Variance.
- [Non-Lexical Lifetimes (NLL)](non_lexical_lifetimes.md) — Related concept: Non-Lexical Lifetimes (NLL).
- [GATs (Generic Associated Types)](../level_14/gats.md) — Related concept: GATs (Generic Associated Types).

---

## 7. Key Takeaways

- Lifetimes (`'a`) describe relationships between the scopes of references.
- They do not change runtime behavior or lengthen variable lifespans.
- Functions returning references borrowed from their parameters require lifetime annotations if there is ambiguity.
- Lifetimes ensure at compile time that no reference will ever point to freed memory.
