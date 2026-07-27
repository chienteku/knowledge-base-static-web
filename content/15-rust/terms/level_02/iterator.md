# Iterator

> **Level 2 — Control Flow & Data Structures**
> A trait providing lazy, sequential access to elements via `.next()`.

---

## 1. Prerequisites

- [`Vec<T>`](../level_02/vec_t.md) — The most common collection that we iterate over.
- [`Option<T>`](../level_02/option_t.md) — The data type returned by an iterator to signify if there is data left or if the sequence is finished.
- [`for` / `in` (Range)](../level_02/for_range.md) — The loop syntax that secretly uses iterators behind the scenes.

---

## 2. Term Category

**Rust-specific (the laziness and safety)**: Iterators exist in many languages (like Python or Java), but in Rust, they are famous for two things: they are **"lazy"** (they do absolutely zero work until you force them to) and they are **"zero-cost abstractions"** (the compiler optimizes them to be just as fast as writing a manual, dangerous C-style loop).

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In older languages like C, you iterate over an array by managing an index variable manually:
`for (int i = 0; i < array_length; i++) { print(array[i]); }`

This is incredibly error-prone. What if you miscalculate `array_length`? What if you accidentally type `<= ` instead of `<`? Your program will try to access memory that doesn't exist and instantly crash.

Rust solves this with **Iterators**. An Iterator is an intelligent object whose sole purpose is to yield the next item in a sequence. Because the Iterator internally tracks where it is, it is mathematically impossible to accidentally ask for an "out of bounds" index. It is perfectly memory-safe.

### (2) Reality Metaphor

Imagine a **PEZ candy dispenser**. 

The PEZ dispenser is the Iterator. It holds a sequence of candies. When you interact with it, you don't ask it, "Give me candy number 4." Instead, you just push the head back, and it yields the *next* candy in the sequence. 

You keep pushing the head back, and it keeps returning `Some(Candy)`. Eventually, the dispenser empties. When you push the head back one final time, it returns `None`. You cannot accidentally pull a candy from a dispenser that is empty.

### (3) Rust Code Examples

#### Short Snippet (The Mechanics of `.next()`)
All iterators work by calling the `.next()` method, which returns an `Option`.
```rust
fn main() {
    let my_vec = vec!["Apple", "Banana"];
    
    // Create an iterator from the Vector
    let mut my_iterator = my_vec.iter();
    
    // Manually pull the lever on the PEZ dispenser
    println!("{:?}", my_iterator.next()); // Prints: Some("Apple")
    println!("{:?}", my_iterator.next()); // Prints: Some("Banana")
    println!("{:?}", my_iterator.next()); // Prints: None (The dispenser is empty!)
}
```

#### Fuller Example (The `for` Loop Magic)
Manually calling `.next()` is tedious. This is why Rust has the `for` loop! A `for` loop is actually just syntactic sugar. It automatically creates an Iterator from your collection, calls `.next()` over and over, extracts the value from `Some`, and stops looping the moment it sees a `None`.

```rust
fn main() {
    let numbers = vec![10, 20, 30];
    
    // The `for` loop automatically calls `.iter()` and `.next()` for you!
    for num in numbers.iter() {
        println!("Number: {}", num);
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Iterator Scoping and Lifecycle Rules

**The mistake:** Assuming Iterator instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("iterator_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("iterator_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Iterator State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Iterator through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Iterator Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Iterator instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Manual Dispenser

**Problem:** We have a Vector with two colors. Create a mutable iterator from it. Call `.next()` twice to skip the first two colors. Then, write a `match` statement on the third `.next()` call. If it returns `Some`, print the color. If it returns `None`, print "No colors left!".

```rust
fn main() {
    let colors = vec!["Red", "Blue"];
    
    // TODO: Create a mutable iterator from the vector
    // let mut iter = ...
    
    // TODO: Call `.next()` twice and ignore the results
    
    // TODO: Use a `match` statement on the third `.next()` call
}
```

**Expected output:**
```text
No colors left!
```

> [!check]- Answer
> ```rust
> fn main() {
>     let colors = vec!["Red", "Blue"];
>     let mut iter = colors.iter();
>     
>     iter.next();
>     iter.next();
>     
>     match iter.next() {
>         Some(color) => println!("Color: {}", color),
>         None => println!("No colors left!"),
>     }
> }
> ```

---

### Exercise 2: Manual Iterator Advancement with `.next()`

**Problem:** Create an iterator over `vec![10, 20]`. Advance it manually using `.next()` twice and assert values.

**Expected output:**
```
Some(10)
Some(20)
None
```

> [!check]- Answer
> ```rust
> fn main() {
>     let nums = vec![10, 20];
>     let mut iter = nums.iter();
>     println!("{:?}", iter.next());
>     println!("{:?}", iter.next());
>     println!("{:?}", iter.next());
> }
> ```
>
> **Explanation:** Calling `.next()` advances mutable iterators, returning `Some(&item)` or `None` when exhausted.

### Exercise 3: Creating a Custom Iterator

**Problem:** Implement `Iterator` for `struct Counter { count: u32 }` yielding numbers `1..=3`.

**Expected output:**
```
1 2 3 
```

> [!check]- Answer
> ```rust
> struct Counter { count: u32 }
> impl Iterator for Counter {
>     type Item = u32;
>     fn next(&mut self) -> Option<Self::Item> {
>         if self.count < 3 {
>             self.count += 1;
>             Some(self.count)
>         } else {
>             None
>         }
>     }
> }
> fn main() {
>     let mut c = Counter { count: 0 };
>     while let Some(val) = c.next() {
>         print!("{} ", val);
>     }
>     println!();
> }
> ```
>
> **Explanation:** Implementing `Iterator` requires specifying `type Item` and defining the `.next()` method.

---

## 6. Related Terms

- [Collecting](../level_02/collecting.md) — The process of forcing a lazy Iterator to do its work and save the results back into a concrete collection (like a new `Vec`).
- [`for` / `in` (Range)](../level_02/for_range.md) — The loop syntax that consumes iterators.
- [Closures](../level_06/closure.md) — Anonymous functions heavily used alongside iterator methods like `.map()` and `.filter()`.

---

## 7. Key Takeaways

- An **Iterator** is an object that yields values one-by-one in a sequence.
- It relies entirely on a `.next()` method that returns `Some(value)`, or `None` when the sequence is empty.
- Standard `for` loops are just syntactic sugar that automatically consume Iterators.
- Iterators are **lazy**; they do absolutely no work until they are actively consumed by a loop or method.
- Use `.iter()` to borrow data (read-only), and `.into_iter()` to consume data (destroys the collection).
