# Lazy Evaluation

> **Level 6 — Closures & Functional Patterns**
> Iterators are lazy; no work is done until a consuming adapter (e.g. `.collect()`, `.sum()`) is called.

---

## 1. Prerequisites

- [Iterator](../level_02/iterator.md) — The core trait that powers this lazy behavior.
- [Iterator Chains](../level_06/iterator_chains.md) — The pipelines that benefit most from being lazy.
- [Iterator Adapters](../level_02/iterator_adapters.md) — The specific methods (like `map` and `filter`) that are lazy.

---

## 2. Term Category

**Rust Idiom (the performance optimization)**: In many programming languages, if you call `.filter()` on an array of 1,000 items, the language immediately loops through the entire array, creates a brand new filtered array in memory, and hands it back to you. Rust does NOT do this. Rust uses **Lazy Evaluation**. When you call `.filter()`, Rust literally does nothing. It just makes a mental note of what you *want* to do, and waits to do the actual work until you demand the final answer.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Creating intermediate arrays in memory is incredibly slow and wasteful. 

Imagine you have a database array of 1,000,000 items. You write:
`data.map(|x| x * 2).filter(|x| x > 10).take(5)`

An "eager" language would loop 1,000,000 times to create a massive multiplied array, then loop 1,000,000 times to create a filtered array, and then throw away 999,995 of those items just to give you the first 5. That is a massive waste of CPU and RAM!

Rust's **Lazy Evaluation** solves this. By doing absolutely no work until the very end of the chain, Rust can perfectly optimize the process. When you finally ask for the answer, it grabs the first item, multiplies it, checks the filter, and hands it to `take(5)`. It does this exactly 5 times, and then immediately stops! It never loops 1,000,000 times, and it creates zero intermediate arrays. 

### (2) Reality Metaphor

Imagine a chaotic Fast-Food Restaurant (**Eager Evaluation**). You order a burger, fries, and a drink. The cashier immediately runs to the back, makes a burger, and hands it to you. Then they run to the back, fry the fries, and hand them to you. Then they run back, pour the drink, and hand it to you. It's incredibly inefficient.

Now imagine a Fine-Dining Restaurant (**Lazy Evaluation**). The waiter comes to your table and takes your order (e.g., calling `.map()` and `.filter()`). The waiter does absolutely no cooking! They just write it down on a notepad. Only when they hand the notepad to the Head Chef (the Consumer method like `.collect()`) does all the cooking happen at once in a perfectly optimized, seamless sequence.

### (3) Rust Code Examples

#### Short Snippet (The Warning)
If you write an Iterator Chain but forget to "consume" it, the compiler will literally warn you that your code is doing nothing.

```rust
fn main() {
    let numbers = vec![1, 2, 3];

    // WARNING: "unused `Map` that must be used"
    // WARNING: "iterator adaptors are lazy and do nothing unless consumed"
    numbers.iter().map(|x| x + 1);

    // FIXED: We added `.collect()`, which forces the lazy iterator to do the work!
    let new_numbers: Vec<i32> = numbers.iter().map(|x| x + 1).collect();
}
```

#### Fuller Example (Proving the Laziness)
We can prove that iterators are lazy by putting `println!` statements inside the closures. You will see that they never print to the terminal!

```rust
fn main() {
    let numbers = vec![1, 2, 3];

    println!("Building the iterator pipeline...");
    
    // We create a pipeline with a print statement inside the map closure.
    let lazy_pipeline = numbers.iter().map(|x| {
        println!("Cooking item: {}", x);
        x * 2
    });

    println!("Pipeline built! Notice that nothing has cooked yet!");

    // It is ONLY when we call `.sum()` that the closures actually run!
    println!("Calling .sum() to consume the pipeline...");
    let total: i32 = lazy_pipeline.sum();
    
    println!("Total is: {}", total);
}
```

**Output:**
```
Building the iterator pipeline...
Pipeline built! Notice that nothing has cooked yet!
Calling .sum() to consume the pipeline...
Cooking item: 1
Cooking item: 2
Cooking item: 3
Total is: 12
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Lazy Evaluation Scoping and Lifecycle Rules

**The mistake:** Assuming Lazy Evaluation instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("lazy_evaluation_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("lazy_evaluation_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Lazy Evaluation State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Lazy Evaluation through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Lazy Evaluation Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Lazy Evaluation instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Silent Printer

**Problem:** The following code tries to print every username in a list, but when you run it, the terminal is completely blank! Fix the code without using a `for` loop.

```rust
fn main() {
    let users = vec!["Alice", "Bob", "Charlie"];

    // TODO: Why isn't this printing? Fix it!
    users.iter().map(|name| println!("User: {}", name));
}
```

> [!check]- Answer
> ```rust
> fn main() {
>     let users = vec!["Alice", "Bob", "Charlie"];
>
>     // `.map()` is lazy and shouldn't be used for side-effects. 
>     // We change `.map()` to `.for_each()`, which is a Consumer method!
>     // It immediately consumes the iterator and runs the closure.
>     users.iter().for_each(|name| println!("User: {}", name));
> }
> ```

---

### Exercise 2: Verifying Lazy Iterator Execution

**Problem:** Demonstrate that `.map(|x| println!("Mapped: {}", x))` outputs nothing until `.collect()` is called.

**Expected output:**
> [!check]- Answer
> ```
> Before collect
> Mapped: 1
> After collect
> ```
> ```rust
> fn main() {
>     let iter = (1..=1).map(|x| println!("Mapped: {}", x));
>     println!("Before collect");
>     let _: Vec<()> = iter.collect();
>     println!("After collect");
> }
> ```
>
> **Explanation:** Iterator transformation steps execute lazily during consumer traversal.

---

### Exercise 3: Short-Circuiting Lazy Computations with `any()`

**Problem:** Show that `.any(|x| x == 2)` on `vec![1, 2, 3, 4]` stops evaluating remaining elements once `2` is found.

**Expected output:**
> [!check]- Answer
> ```
> Found: true
> ```
> fn main() {
>     let nums = vec![1, 2, 3, 4];
>     let found = nums.into_iter().any(|x| x == 2);
>     println!("Found: {}", found);
> }
> ```
>
> **Explanation:** Short-circuiting consumers stop iterating as soon as matching conditions are met.

---

---

## 6. Related Terms

- [Collecting](../level_02/collecting.md) — The most common way to force a lazy iterator to finally do its work.
- [Iterator Chains](../level_06/iterator_chains.md) — The pipelines that benefit most from this optimization.

---

## 7. Key Takeaways

- Iterators and Iterator Adapters (`map`, `filter`) are **100% lazy**. They do absolutely no work when called.
- They only build a "recipe" of what needs to happen.
- The work is only triggered when a **Consumer** method is called at the very end of the chain (like `.collect()`, `.sum()`, `.count()`, or `.for_each()`).
- This allows Rust to perfectly optimize massive data pipelines without wasting memory or CPU cycles.
