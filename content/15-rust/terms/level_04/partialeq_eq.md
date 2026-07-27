# `PartialEq` / `Eq`

> **Level 4 — Error Handling & Generics**
> Traits for equality comparison; `Eq` is a marker for total equality.

---

## 1. Prerequisites

- [Trait](../level_04/trait.md) — The contract being implemented.
- [Derive Macro](../level_04/derive_macro.md) — How you get these traits for free 99% of the time.
- [Expressions (`==`)](../level_01/expressions.md) — The operators that these traits unlock.

---

## 2. Term Category

**Rust-specific (the comparison engine)**: In languages like Python or JavaScript, you can use the `==` operator to compare almost anything. In Rust, you can only use `==` if the compiler mathematically guarantees the two objects know how to compare themselves. The `PartialEq` and `Eq` traits provide that exact mathematical guarantee.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

How do you know if two custom `User` structs are "equal"? Do all the fields have to match? Does just the `id` have to match? Rust doesn't guess. It forces you to implement the **`PartialEq`** trait, which provides the underlying logic for the `==` and `!=` operators. 

**So what is `Eq`?**
Some types in computer science have mathematically bizarre edge cases. For example, floating-point numbers (`f32`, `f64`) have a special value called `NaN` (Not a Number). According to international computer science standards, `NaN == NaN` is *false*. Because a value is not equal to itself, floating point numbers are only *partially* equal to each other. 

Therefore, `f32` implements `PartialEq`, but it does not implement `Eq`. 

**`Eq`** is a special "marker trait" (it has no methods). You add it *on top* of `PartialEq` to promise the compiler: *"My custom type has no weird `NaN` edge cases. Every value is 100% equal to itself (Total Equality)."* Many standard library data structures (like HashMaps) require `Eq` to function safely.

### (2) Reality Metaphor

Imagine `PartialEq` is a **Bouncer** at a club checking IDs. They check if the face matches the photo. It works 99% of the time, but sometimes a person shows up wearing a ski-mask (`NaN`). The bouncer's system breaks down and rejects them, even if they are comparing the person to a photo of themselves in the ski-mask. The checking system is only *partially* reliable.

`Eq` is a **VIP Stamp** on the ID. It is a mathematical guarantee to the club owner that *"This specific group of people will never wear ski-masks. You can trust the Bouncer to evaluate them correctly 100% of the time."*

### (3) Rust Code Examples

#### Short Snippet (The Free Implementation)
99% of the time, you want two structs to be equal if *every single field* inside them is exactly equal. You use the `#[derive]` macro to get this behavior for free.

```rust
// We derive both!
#[derive(PartialEq, Eq)]
struct Coordinate {
    x: i32,
    y: i32,
}

fn main() {
    let p1 = Coordinate { x: 5, y: 10 };
    let p2 = Coordinate { x: 5, y: 10 };
    let p3 = Coordinate { x: 0, y: 0 };
    
    // The == operator works magically because of PartialEq!
    println!("p1 equals p2? {}", p1 == p2); // true
    println!("p1 equals p3? {}", p1 == p3); // false
}
```

#### Fuller Example (Manual Business Logic)
Sometimes, "equality" is subjective. If you have two `User` structs with the same database ID but different usernames (maybe one just changed their name), are they equal? In a database context, yes! We must implement `PartialEq` manually.

```rust
struct User {
    id: u32,
    username: String,
}

// We implement PartialEq manually!
impl PartialEq for User {
    fn eq(&self, other: &Self) -> bool {
        // We only care if the IDs match. Ignore the username completely!
        self.id == other.id
    }
}

// We add Eq as a blank marker to promise `id == id` is always mathematically true.
impl Eq for User {}

fn main() {
    let old_user = User { id: 1, username: String::from("alice99") };
    let new_user = User { id: 1, username: String::from("alice_the_great") };
    
    // This will print TRUE, even though the usernames are different!
    if old_user == new_user {
        println!("They are the exact same user in the database.");
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Partialeq Eq Scoping and Lifecycle Rules

**The mistake:** Assuming Partialeq Eq instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("partialeq_eq_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("partialeq_eq_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Partialeq Eq State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Partialeq Eq through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Partialeq Eq Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Partialeq Eq instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The ISBN Checker

**Problem:** You are building a library system. Two `Book` structs should be considered equal *only* if their `isbn` strings match. The `title` might be different due to typos. Implement `PartialEq` manually.

```rust
struct Book {
    isbn: String,
    title: String,
}

// TODO: Implement PartialEq for Book. Compare only the `isbn`.

fn main() {
    let b1 = Book { isbn: String::from("123"), title: String::from("Dune") };
    let b2 = Book { isbn: String::from("123"), title: String::from("Doon") };
    
    // Uncomment when finished:
    // assert!(b1 == b2); 
}
```

> [!check]- Answer
> ```rust
> impl PartialEq for Book {
>     fn eq(&self, other: &Self) -> bool {
>         self.isbn == other.isbn
>     }
> }
> ```

---

### Exercise 2: Custom `PartialEq` Case-Insensitive String Comparison

**Problem:** Implement `PartialEq` for `struct InsensitiveString(String)` comparing strings case-insensitively.

**Expected output:**
```
Strings match: true
```

> [!check]- Answer
> ```rust
> struct InsensitiveString(String);
> impl PartialEq for InsensitiveString {
>     fn eq(&self, other: &Self) -> bool {
>         self.0.to_lowercase() == other.0.to_lowercase()
>     }
> }
> fn main() {
>     let s1 = InsensitiveString("Rust".into());
>     let s2 = InsensitiveString("RUST".into());
>     println!("Strings match: {}", s1 == s2);
> }
> ```
>
> **Explanation:** Custom `PartialEq` implementations override `==` comparison behavior.

### Exercise 3: Deriving Total Equivalence with `Eq`

**Problem:** Derive `PartialEq` and `Eq` on `UserId(u64)` and verify usage as `HashMap` keys.

**Expected output:**
```
Total equivalence confirmed
```

> [!check]- Answer
> #[derive(PartialEq, Eq, Debug)]
> struct UserId(u64);
> fn main() {
>     let u1 = UserId(1);
>     let u2 = UserId(1);
>     assert_eq!(u1, u2);
>     println!("Total equivalence confirmed");
> }
> ```
>
> **Explanation:** `Eq` is a marker trait signaling total equivalence relations across all domain values.

---

## 6. Related Terms

- [`PartialOrd` / `Ord`](../level_04/partialord_ord.md) — The sister traits used for Greater Than (`>`) and Less Than (`<`) operators.
- [Derive Macro](../level_04/derive_macro.md) — How you get `PartialEq` and `Eq` for free 99% of the time.

---

## 7. Key Takeaways

- `PartialEq` is the trait that powers the `==` and `!=` operators.
- `Eq` is just a blank marker trait that you add *on top* of `PartialEq` to promise the compiler that your type has no weird `NaN` behavior (i.e., `x == x` is always mathematically true).
- You can derive them automatically using `#[derive(PartialEq, Eq)]` to compare every field inside the struct.
- You implement `PartialEq` manually when "equality" requires custom business logic (like only comparing a database ID).
