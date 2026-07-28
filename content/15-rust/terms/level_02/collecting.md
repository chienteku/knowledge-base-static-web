# Collecting

> **Level 2 — Control Flow & Data Structures**
> Converting an Iterator back into a concrete collection like `Vec`.

---

## 1. Prerequisites

- [Iterator](../level_02/iterator.md) — The lazy sequence of items that `collect()` consumes.
- [`Vec<T>`](../level_02/vec_t.md) — The most common collection that we collect *into*.
- [Type Annotation](../level_01/type_annotation.md) — Required because `collect` can build many different things, so you must explicitly tell it what to build.

---

## 2. Term Category

**Rust-specific (the explicitness)**: In languages like JavaScript, calling `array.map(...)` automatically returns a brand new array. In Rust, calling `.map(...)` returns a lazy Iterator that does absolutely nothing. You must explicitly call `.collect()` at the end of the chain to force the Iterator to run and package the results into a final data structure.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Why doesn't `.map()` just return a `Vec` automatically? Because Rust prioritizes ultimate performance and control. 

Creating a new `Vec` requires asking the operating system for Heap memory, which is a slow operation. What if you didn't actually want a `Vec`? What if you wanted to transform the data into a `HashMap`, a `HashSet`, or a `String`? What if you just wanted to find the `sum()` of the numbers, and didn't need a new collection at all? 

By keeping Iterators lazy, Rust allows you to chain a dozen operations together (map, filter, reverse) without allocating *any* memory. Then, you use `.collect()` exactly once at the very end to build the exact type of collection you need. It is highly optimized and perfectly explicit.

### (2) Reality Metaphor

Imagine a factory assembly line.

[Iterators](../level_02/iterator.md) and their methods (like `.map()` or `.filter()`) are the conveyor belts and robotic arms that modify the product. However, if there is no box at the end of the belt to catch the products, the factory boss refuses to turn the machine on. It just sits there, doing nothing (laziness).

**`.collect()`** is the act of putting a specific box at the end of the conveyor belt and pressing the "ON" switch. But because the factory makes many different types of boxes, you have to explicitly tell the boss *which* box you placed there (e.g., "I placed a `Vec` box here!").

### (3) Rust Code Examples

#### Short Snippet (The "Turbofish" Syntax)
Because `.collect()` can build almost anything, the compiler usually needs you to specify the type. The most common way is using the "Turbofish" syntax: `::<>`.
```rust
fn main() {
    let numbers = vec![1, 2, 3];
    
    // `.iter()` borrows the data.
    // `.map()` transforms it, but does nothing yet.
    // `.collect()` turns the machine on and builds a new Vec!
    let doubled = numbers.iter().map(|x| x * 2).collect::<Vec<i32>>();
    
    println!("{:?}", doubled); // [2, 4, 6]
}
```

#### Fuller Example (Variable Annotation vs Turbofish)
You can tell the compiler what "box" to use in two different ways.
```rust
fn main() {
    let words = vec!["hello", "world"];
    
    // Method 1: Variable Type Annotation
    // We tell the variable `shouted` that it will be a `Vec<String>`.
    // The compiler reads this and tells `.collect()` to build a `Vec<String>`.
    let shouted: Vec<String> = words.iter().map(|w| w.to_uppercase()).collect();
    
    // Method 2: The Turbofish `::<T>`
    // We attach the type directly to the `.collect()` method call.
    // Notice the `_`! We can tell the compiler "Build a Vec, but you figure out what goes inside it."
    let shouted2 = words.iter().map(|w| w.to_uppercase()).collect::<Vec<_>>();
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Collecting Scoping and Lifecycle Rules

**The mistake:** Assuming Collecting instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("collecting_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("collecting_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Collecting State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Collecting through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Collecting Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Collecting instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Filter the Even Numbers

**Problem:** We have a Vector of numbers. We want to use `.into_iter()` to consume it, `.filter()` to keep only the even numbers, and then collect the result into a new Vector called `evens`. 

*(Note: `|x| x % 2 == 0` is a closure that returns true if a number is even).*

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5, 6];
    
    // TODO: Write the iterator chain here!
    // let evens = numbers.into_iter()...
    
    // println!("{:?}", evens); // Should print [2, 4, 6]
}
```

> [!check]- Answer
> ```rust
> let evens: Vec<i32> = numbers.into_iter().filter(|x| x % 2 == 0).collect();
>
> // OR using the turbofish:
> // let evens = numbers.into_iter().filter(|x| x % 2 == 0).collect::<Vec<_>>();
> ```

---

### Exercise 2: Collecting into HashSet for Uniqueness

**Problem:** Take a vector with duplicate values `vec![1, 2, 2, 3, 3, 3]` and collect it into a `HashSet<i32>` to remove duplicates.

**Expected output:**
> [!check]- Answer
> ```
> Unique elements count: 3
> ```
> ```rust
> use std::collections::HashSet;
> fn main() {
>     let nums = vec![1, 2, 2, 3, 3, 3];
>     let set: HashSet<i32> = nums.into_iter().collect();
>     println!("Unique elements count: {}", set.len());
> }
> ```
>
> **Explanation:** `HashSet` automatically discards duplicate items when collected from an iterator.

---

### Exercise 3: Transposing Iterator of Results with `.collect()`

**Problem:** Collect an iterator of `Result<i32, &str>` containing `[Ok(1), Ok(2), Ok(3)]` into a single `Result<Vec<i32>, &str>`.

**Expected output:**
> [!check]- Answer
> ```
> Ok([1, 2, 3])
> ```
> ```rust
> fn main() {
>     let results = vec![Ok(1), Ok(2), Ok(3)];
>     let combined: Result<Vec<i32>, &str> = results.into_iter().collect();
>     println!("{:?}", combined);
> }
> ```
>
> **Explanation:** Collecting `Iterator<Item = Result<T, E>>` into `Result<Vec<T>, E>` fails fast on the first `Err` or gathers all `Ok` values into a `Vec`.

---

## 6. Related Terms

- [Iterator](../level_02/iterator.md) — The underlying system that makes `.collect()` possible.
- [Closures](../level_06/closure.md) — The anonymous inline functions (like `|x| x * 2`) used inside `.map()` and `.filter()`.

---

## 7. Key Takeaways

- Iterators are lazy; `.collect()` is the "consumer" that actually turns the machine on and gathers the final results.
- Because `.collect()` is incredibly powerful and can build *many* types of collections (Vecs, HashMaps, Strings), you **must** tell the compiler what type you want.
- You can provide the type via variable annotation (`let x: Vec<i32> = ...`) or the turbofish syntax (`.collect::<Vec<i32>>()`).
- An underscore `_` can be used inside the turbofish (`::<Vec<_>>`) to let the compiler automatically guess the inner data type, saving you typing!
