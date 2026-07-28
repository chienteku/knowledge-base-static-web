# Struct Lifetimes

> **Level 5 — Lifetimes**
> Declaring lifetime parameters on structs and enums that hold reference fields: `struct Excerpt<'a> { part: &'a str }`.

---

## 1. Prerequisites

- [Struct](../level_02/struct.md) — Custom composite data types.
- [Lifetime (`'a`)](../level_05/lifetime.md) — Reference validity annotations.
- [Lifetime Elision](../level_05/lifetime_elision.md) — Understanding why struct definitions *cannot* elide lifetimes.

---

## 2. Term Category

**Rust-specific (borrowed struct fields)**: Most structs in Rust store owned data (like `String`, `i32`, or `Vec<T>`). However, when a struct needs to store a *reference* (`&str` or `&T`), Rust forces you to declare a generic lifetime parameter on the struct definition itself. This ensures that an instance of the struct can never outlive the data it references.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

If a struct holds a reference:

```rust
// INVALID RUST (Will not compile)
struct User {
    username: &str, 
}
```

The compiler asks: *"How long is the string slice `username` valid for?"* 

If `User` could exist after the original string was deallocated, accessing `user.username` would be a dangerous dangling pointer access.

To solve this, Rust requires you to declare a lifetime parameter on the struct:

```rust
struct User<'a> {
    username: &'a str,
}
```

This enforces a ironclad rule: **An instance of `User<'a>` cannot outlive the reference stored in its `username` field.**

### (2) Reality Metaphor

Imagine a paper photo frame (`struct User<'a>`) holding a printed photograph (`&'a str`).

The photo frame cannot exist in a valid state without the photograph inside it. If you throw the photograph into a paper shredder (the data's lifetime `'a` ends), you cannot look at the frame and expect to see the picture. 

The struct's lifetime parameter `'a` stamps the frame with an expiration date tied directly to the photo inside.

### (3) Rust Code Examples

#### Short Snippet (Defining and Instantiating)
```rust
struct ImportantExcerpt<'a> {
    part: &'a str,
}

fn main() {
    let novel = String::from("Call me Ishmael. Some years ago...");
    let first_sentence = novel.split('.').next().expect("Could not find a '.'");
    
    // i is tied to the lifetime of `novel`
    let i = ImportantExcerpt {
        part: first_sentence,
    };
    
    println!("Excerpt: {}", i.part);
}
```

#### Implementing Methods on a Struct with Lifetimes
When writing an `impl` block for a struct with a lifetime, the lifetime parameter must be declared after `impl` and used after the struct name:

```rust
struct Highlight<'a> {
    text: &'a str,
}

impl<'a> Highlight<'a> {
    // Method returning a reference with the same lifetime
    fn get_text(&self) -> &str {
        self.text
    }

    // Method taking another reference
    fn announce_and_return_part(&self, announcement: &str) -> &str {
        println!("Attention: {announcement}");
        self.text
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Struct Lifetimes Scoping and Lifecycle Rules

**The mistake:** Assuming Struct Lifetimes instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("struct_lifetimes_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("struct_lifetimes_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Struct Lifetimes State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Struct Lifetimes through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Struct Lifetimes Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Struct Lifetimes instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Create a Borrowing Struct

**Problem:** Define a struct named `BookReview` that has two fields: `title` (which is an owned `String`) and `quote` (which is a borrowed `&str`). Include all necessary lifetime parameters.

> [!check]- Answer
> ```rust
> struct BookReview<'a> {
>     title: String,
>     quote: &'a str,
> }
> ```

---

### Exercise 2: Struct Holding String Slices

**Problem:** Define `struct Highlight<'a> { text: &'a str }`. Instantiate it with a string slice and print `text`.

**Expected output:**
> [!check]- Answer
> ```
> Highlight: Important
> ```
> ```rust
> struct Highlight<'a> {
>     text: &'a str,
> }
> fn main() {
>     let quote = String::from("Important news");
>     let h = Highlight { text: &quote[..9] };
>     println!("Highlight: {}", h.text);
> }
> ```
>
> **Explanation:** Struct lifetime annotations guarantee struct instances cannot outlive referenced target data.

---

### Exercise 3: Method Implementation on Lifetime Structs

**Problem:** Implement an `impl<'a> Highlight<'a>` block with a method `fn announce(&self) -> &str`.

**Expected output:**
> [!check]- Answer
> ```
> Announce: Important
> ```
> ```rust
> struct Highlight<'a> { text: &'a str }
> impl<'a> Highlight<'a> {
>     fn announce(&self) -> &str { self.text }
> }
> fn main() {
>     let h = Highlight { text: "Important" };
>     println!("Announce: {}", h.announce());
> }
> ```
>
> **Explanation:** Method `impl` blocks for lifetime-constrained structs require declaring lifetime parameters e.g. `impl<'a> Struct<'a>`.

---

## 6. Related Terms

- [Lifetime (`'a`)](../level_05/lifetime.md) — The annotation used on struct fields.
- [Lifetime Bounds](../level_05/lifetime_bounds.md) — `struct Container<'a, T: 'a>` bounds.
- [Struct](../level_02/struct.md) — Composite data structures.

---

## 7. Key Takeaways

- Any struct that holds references must declare generic lifetime parameters: `struct MyStruct<'a> { field: &'a str }`.
- An instance of a borrowing struct cannot outlive any of the data referenced by its fields.
- `impl<'a> MyStruct<'a>` is the syntax for implementing methods on a borrowing struct.
- Lifetime elision does **not** apply to struct field definitions.
