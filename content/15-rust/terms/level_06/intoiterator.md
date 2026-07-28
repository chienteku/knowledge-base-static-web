# `IntoIterator`

> **Level 6 — Closures & Functional Patterns**
> Trait that allows a type to be used in `for` loops.

---

## 1. Prerequisites

- [Iterator](../level_02/iterator.md) — The trait that actually does the stepping (`.next()`).
- [`for` / Range](../level_02/for_range.md) — The loop syntax that completely relies on `IntoIterator` to function.
- [Trait](../level_04/trait.md) — The system that defines this shared behavior.

---

## 2. Term Category

**Rust-specific (the loop enabler)**: You probably know that `for` loops in Rust can only iterate over things that implement the `Iterator` trait. But here's a secret: A `Vec` is not an Iterator. A `HashMap` is not an Iterator! 

So how is it possible to write `for item in vec`? Because of **`IntoIterator`**! This is the magical "conversion" trait that automatically transforms collections into Iterators behind the scenes.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

If you had to manually create an iterator every single time you wanted to write a `for` loop, you would be forced to write `for item in vec.into_iter() { ... }` everywhere in your code. This is annoying and verbose.

The Rust designers created the `IntoIterator` trait to automate this. The `for` loop in Rust is literally just syntax sugar. When you write `for x in collection`, the compiler secretly translates it into a `while` loop that calls `.into_iter()` on the collection.

Because of this design, *any* custom struct you build can be used in a standard `for` loop, as long as you implement `IntoIterator` for it!

### (2) Reality Metaphor

Imagine an **`Iterator`** is a Pez Dispenser. It perfectly hands out exactly one candy at a time whenever you push the head (`.next()`). 

A **`Vec`** is just a sealed plastic bag of candy. You cannot push the head of a plastic bag. It doesn't know how to hand out one candy at a time. 

The **`IntoIterator`** trait is a factory machine. You pour the sealed bag of candy into the machine (`.into_iter()`), and it instantly transforms the pile of candy into a fully loaded, functioning Pez Dispenser so you can eat them one by one.

### (3) Rust Code Examples

#### Short Snippet (The Syntax Sugar Expansion)
Here is what you type, and what the compiler actually compiles it into.

```rust
fn main() {
    let my_vec = vec![1, 2, 3];

    // 1. WHAT YOU WRITE:
    for x in my_vec {
        println!("{}", x);
    }
    
    // 2. WHAT THE COMPILER SECRETLY DOES:
    // (Notice how it automatically calls `into_iter()` for you!)
    /*
    let mut iter = my_vec.into_iter();
    while let Some(x) = iter.next() {
        println!("{}", x);
    }
    */
}
```

#### Fuller Example (Custom Struct Iteration)
If you build a custom struct, you can implement `IntoIterator` so other developers can loop over your struct directly, without needing to know its internal fields!

```rust
struct Company {
    employees: Vec<String>,
}

// We implement `IntoIterator` for our custom `Company` struct.
impl IntoIterator for Company {
    type Item = String; // The type we will yield
    type IntoIter = std::vec::IntoIter<String>; // The type of Iterator we will produce

    // We just forward the call to the internal Vector's `.into_iter()` method!
    fn into_iter(self) -> Self::IntoIter {
        self.employees.into_iter()
    }
}

fn main() {
    let tech_corp = Company {
        employees: vec!["Alice".to_string(), "Bob".to_string()],
    };

    // MAGIC! We can loop over `tech_corp` directly!
    // We don't have to write `for p in tech_corp.employees`!
    for person in tech_corp {
        println!("Employee: {}", person);
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Intoiterator Scoping and Lifecycle Rules

**The mistake:** Assuming Intoiterator instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("intoiterator_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("intoiterator_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Intoiterator State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Intoiterator through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Intoiterator Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Intoiterator instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Save the Vector!

**Problem:** The following code fails to compile because the `for` loop consumes the Vector, making it unusable in the final `println!`. Fix the code with a single character so the Vector is borrowed instead of consumed.

```rust
fn main() {
    let scores = vec![100, 95, 80];

    // TODO: Fix this line so it borrows the vector instead of consuming it!
    for score in scores {
        println!("Score: {}", score);
    }

    // ERROR! `scores` was moved into the loop!
    println!("Total scores processed: {}", scores.len());
}
```

> [!check]- Answer
> ```rust
> fn main() {
>     let scores = vec![100, 95, 80];
>
>     // Adding `&` forces the compiler to call `(&scores).into_iter()` instead, 
>     // which safely produces borrowed references without destroying the vector!
>     for score in &scores {
>         println!("Score: {}", score);
>     }
>
>     println!("Total scores processed: {}", scores.len());
> }
> ```

---

### Exercise 2: Custom Struct `IntoIterator` Implementation

**Problem:** Implement `IntoIterator` for `struct Group { members: Vec<String> }` to iterate over member strings.

**Expected output:**
> [!check]- Answer
> ```
> Member: Alice
> Member: Bob
> ```
> ```rust
> struct Group { members: Vec<String> }
> impl IntoIterator for Group {
>     type Item = String;
>     type IntoIter = std::vec::IntoIter<Self::Item>;
>     fn into_iter(self) -> Self::IntoIter {
>         self.members.into_iter()
>     }
> }
> fn main() {
>     let g = Group { members: vec!["Alice".into(), "Bob".into()] };
>     for m in g {
>         println!("Member: {}", m);
>     }
> }
> ```
>
> **Explanation:** Implementing `IntoIterator` allows custom collections to be used directly in `for` loops.

---

### Exercise 3: Borrowing Iteration via `&Group` `IntoIterator`

**Problem:** Implement `IntoIterator` for `&'a Group` to allow non-destructive `for m in &group` loops.

**Expected output:**
> [!check]- Answer
> ```
> Ref member: Alice
> ```
> struct Group { members: Vec<String> }
> impl<'a> IntoIterator for &'a Group {
>     type Item = &'a String;
>     type IntoIter = std::slice::Iter<'a, String>;
>     fn into_iter(self) -> Self::IntoIter {
>         self.members.iter()
>     }
> }
> fn main() {
>     let g = Group { members: vec!["Alice".into()] };
>     for m in &g { println!("Ref member: {}", m); }
> }
> ```
>
> **Explanation:** Implementing `IntoIterator` for `&Collection` returns reference iterators without moving collection ownership.

---

---

## 6. Related Terms

- [Iterator](../level_02/iterator.md) — The trait that `IntoIterator` actually produces.
- [`for` / Range](../level_02/for_range.md) — The loop syntax that relies entirely on `IntoIterator` to function.

---

## 7. Key Takeaways

- `IntoIterator` is a conversion trait with a single method: `into_iter()`.
- The `for` loop is just syntax sugar that automatically calls `.into_iter()` on whatever you pass it.
- **`vec`** (Ownership), **`&vec`** (Immutable Borrow), and **`&mut vec`** (Mutable Borrow) trigger three totally different implementations of `IntoIterator`!
- If you implement this trait for your own custom structs, you can use them directly in `for` loops.
