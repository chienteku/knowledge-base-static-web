# Trait Bound

> **Level 4 — Error Handling & Generics**
> Constraining a generic type: `fn foo<T: Display>(t: T)`.

---

## 1. Prerequisites

- [Generics (`<T>`)](../level_04/generics.md) — The placeholder types we want to constrain.
- [Trait](../level_04/trait.md) — The certificates of ability we use as the constraints.

---

## 2. Term Category

**Rust-specific (the generic filter)**: In languages with traditional templates (like C++), the compiler accepts any type you pass into a generic function, and only throws a massive, confusing error later if the type happens to be missing a method you tried to call. Rust is far stricter. Rust requires you to explicitly declare exactly what abilities a generic type must possess *before* you are allowed to compile the code. This explicit declaration is a Trait Bound.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

When you write a generic function, the Rust compiler is incredibly pessimistic. It assumes that `<T>` can be *absolutely anything in the universe*, and therefore, it assumes `<T>` can do **absolutely nothing**.

```rust
// The compiler thinks: "What if T is a File? You can't print a File!"
fn print_item<T>(item: T) {
    println!("{}", item); // ERROR: `T` doesn't implement `Display`
}
```

To fix this, you have to constrain `<T>`. You have to make a promise to the compiler: *"I guarantee that whoever calls this function will only pass a `T` that implements the `Display` trait."* 

You do this using a **Trait Bound**: `<T: Display>`. Now, the compiler knows it is safe to print `T`, and if a user tries to pass a `File` into the function, the compiler will reject the user's code at the door.

### (2) Reality Metaphor

Imagine you are running a "Bring Your Own Vehicle" generic race. 

If your race is completely generic (`<T>`), anyone can show up: a sports car, a boat, a tricycle, a spaceship. But wait, your race track is a dirt road! If a boat shows up, the race will fail. 

To prevent this, you add a **Trait Bound** to the race invitations: *"Welcome to the race `<T: OffRoad>`"*. 

Now, the race is still generic (you don't care if it's a Jeep or a Subaru), but you have filtered out the invalid types at the door. If a boat tries to enter, security checks its traits, sees it lacks the `OffRoad` certification, and denies entry.

### (3) Rust Code Examples

#### Short Snippet (The Syntax)
You add a Trait Bound using a colon `:` directly inside the angle brackets.

```rust
use std::fmt::Display;

// We bound T. "T must implement Display"
fn print_item<T: Display>(item: T) {
    println!("Look at this item: {}", item);
}

fn main() {
    print_item(5);       // Works! i32 implements Display
    print_item("Hello"); // Works! &str implements Display
    
    // print_item(vec![1, 2, 3]); // ERROR! Vec does not implement Display
}
```

#### Fuller Example (Multiple Trait Bounds)
Sometimes one trait isn't enough. What if you want to print an item, but you also need to make a clone of it? You can combine multiple trait bounds using the `+` operator.

```rust
use std::fmt::Display;

// T must implement BOTH Display and Clone!
fn print_and_return_copy<T: Display + Clone>(item: &T) -> T {
    println!("Item is: {}", item);
    
    // Because of the `Clone` bound, we are allowed to call `.clone()`
    item.clone()
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Trait Bound Scoping and Lifecycle Rules

**The mistake:** Assuming Trait Bound instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("trait_bound_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("trait_bound_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Trait Bound State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Trait Bound through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Trait Bound Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Trait Bound instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Comparison Bound

**Problem:** You are writing a generic function that takes two items and returns the larger one. To use the `>` operator, the type `T` must implement the `PartialOrd` trait. Add the correct Trait Bound to make this code compile.

```rust
// TODO: Fix the signature of this function
fn get_larger<T>(a: T, b: T) -> T {
    if a > b {
        a
    } else {
        b
    }
}
```

> [!check]- Answer
> ```rust
> // We add `<T: PartialOrd>` so the compiler knows `T` can be compared with `>`.
> fn get_larger<T: PartialOrd>(a: T, b: T) -> T {
>     if a > b {
>         a
>     } else {
>         b
>     }
> }
> ```

---

### Exercise 2: Combining Trait Bounds with `+`

**Problem:** Write a function `fn print_copy<T: std::fmt::Debug + Copy>(val: T)`.

**Expected output:**
> [!check]- Answer
> ```
> Val: 100
> ```
> ```rust
> fn print_copy<T: std::fmt::Debug + Copy>(val: T) {
>     println!("Val: {:?}", val);
> }
> fn main() {
>     print_copy(100);
> }
> ```
>
> **Explanation:** The `+` syntax combines multiple required trait bounds on generic parameters.

---

### Exercise 3: Generic Struct Field Trait Bounds

**Problem:** Constrain a generic struct `struct DisplayBox<T: std::fmt::Display> { item: T }`.

**Expected output:**
> [!check]- Answer
> ```
> Boxed item: Hello
> ```
> struct DisplayBox<T: std::fmt::Display> { item: T }
> fn main() {
>     let b = DisplayBox { item: "Hello" };
>     println!("Boxed item: {}", b.item);
> }
> ```
>
> **Explanation:** Struct generic type definitions can enforce trait bounds directly.

---

---

## 6. Related Terms

- [`where` Clause](../level_04/where_clause.md) — A cleaner syntax for writing Trait Bounds when you have multiple generics and the `<T: Display + Clone>` line gets too long and messy to read.
- [`impl Trait`](../level_04/impl_trait.md) — Syntactic sugar (`fn foo(item: impl Display)`) that does the exact same thing as a Trait Bound under the hood, but is sometimes easier to read.

---

## 7. Key Takeaways

- Generics (`<T>`) are useless on their own because the compiler assumes `T` can do absolutely nothing.
- You must use **Trait Bounds** to tell the compiler what `T` is allowed to do.
- Syntax: `<T: TraitName>`
- You can require multiple traits by adding them together: `<T: TraitOne + TraitTwo>`.
