# Iterator Chains

> **Level 6 — Closures & Functional Patterns**
> Composing `.map()`, `.filter()`, `.flat_map()`, `.fold()`, etc. for expressive data pipelines.

---

## 1. Prerequisites

- [Iterator](../level_02/iterator.md) — The core trait that makes these chains possible.
- [Closure](../level_06/closure.md) — The tiny anonymous functions that are passed into the chain links.
- [Iterator Adapters](../level_02/iterator_adapters.md) — Methods like `.map()` and `.filter()` that are linked together to form the chain.

---

## 2. Term Category

**Rust Idiom (the functional pipeline)**: Rust allows you to write standard imperative `for` loops, but experienced Rust developers rarely use them for complex data transformations. Instead, they string together multiple "Iterator Adapters" (methods that take Closures) into a single, elegant pipeline called an **Iterator Chain**.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Imagine you have a list of strings representing numbers: `vec!["1", "5", "12", "bad", "20"]`. 

You want to:
1. Parse them into actual integers.
2. Ignore any bad data that fails to parse.
3. Filter out any numbers less than 10.
4. Square the remaining numbers.
5. Collect the final results into a new Vector.

If you wrote this with a traditional `for` loop, you would need mutable variables, nested `if let` statements, `continue` keywords, and it would take up 15 lines of dense code. The core "business logic" gets buried in boilerplate.

**Iterator chains** solve this by allowing you to define a declarative pipeline. You just write: 
`.filter_map(...).filter(...).map(...).collect()`. 

It compresses the logic into a highly readable, functional format. Best of all, because of Rust's compiler optimizations (Zero-Cost Abstractions), the chain compiles down to the exact same blazing-fast machine code as a hand-written `for` loop!

### (2) Reality Metaphor

Imagine an Assembly Line in a factory. 

You don't have one worker grab a raw piece of metal, carry it to the cutting station, carry it to the welding station, and finally carry it to the paint station (a `for` loop). 

Instead, you build a conveyor belt. The raw metal moves through the Cutter (`filter`), directly into the Welder (`map`), and finally drops into a shipping box at the very end of the belt (`collect`). The items flow seamlessly through a chain of specialized stations.

### (3) Rust Code Examples

#### Short Snippet (Imperative vs Declarative)
Notice how much cleaner the Iterator Chain is compared to the `for` loop!

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];

    // THE OLD WAY (Imperative `for` loop)
    let mut evens_doubled = Vec::new();
    for n in &numbers {
        if n % 2 == 0 {
            evens_doubled.push(n * 2);
        }
    }

    // THE RUST WAY (Declarative Iterator Chain)
    let evens_doubled_chain: Vec<i32> = numbers
        .iter()
        .filter(|n| *n % 2 == 0)  // Keep only even numbers
        .map(|n| n * 2)           // Double them
        .collect();               // Put them in a new Vec
}
```

#### Fuller Example (The Power Pipeline)
Iterator chains can do incredibly complex work in very little code. This example calculates the total sum of the squares of all valid numbers greater than 10.

```rust
fn main() {
    let raw_data = vec!["5", "20", "error", "12", "999"];

    let total_sum: i32 = raw_data
        .into_iter()
        // `filter_map` tries to parse the string. 
        // If it succeeds (Ok), it keeps the number. If it fails (Err), it drops it!
        .filter_map(|s| s.parse::<i32>().ok())
        // Keep only numbers less than 100
        .filter(|&n| n < 100)
        // Square the number
        .map(|n| n * n)
        // Consume the chain by adding them all together!
        .sum();

    // 20^2 + 12^2 = 400 + 144 = 544
    println!("Total: {}", total_sum);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Iterator Chains Scoping and Lifecycle Rules

**The mistake:** Assuming Iterator Chains instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("iterator_chains_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("iterator_chains_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Iterator Chains State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Iterator Chains through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Iterator Chains Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Iterator Chains instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Build the Conveyor Belt

**Problem:** Convert the messy `for` loop below into a clean, chained iterator pipeline.

```rust
fn main() {
    let words = vec!["apple", "banana", "kiwi", "strawberry"];
    
    // BAD: Imperative loop
    let mut long_words_uppercase = Vec::new();
    for word in words {
        if word.len() > 5 {
            long_words_uppercase.push(word.to_uppercase());
        }
    }
    
    // TODO: Write this using an Iterator Chain instead!
    // let chain_result: Vec<String> = ...
}
```

> [!check]- Answer
> ```rust
> fn main() {
>     let words = vec!["apple", "banana", "kiwi", "strawberry"];
>     
>     let chain_result: Vec<String> = words
>         .into_iter()
>         .filter(|w| w.len() > 5)
>         .map(|w| w.to_uppercase())
>         .collect();
> }
> ```

---

### Exercise 2: Chaining `enumerate()`, `filter()`, and `map()`

**Problem:** Take strings `vec!["a", "b", "c", "d"]`, enumerate them, filter even indices, and map to uppercase.

**Expected output:**
> [!check]- Answer
> ```
> ["A", "C"]
> ```
> ```rust
> fn main() {
>     let items = vec!["a", "b", "c", "d"];
>     let result: Vec<String> = items
>         .into_iter()
>         .enumerate()
>         .filter(|(idx, _)| idx % 2 == 0)
>         .map(|(_, val)| val.to_uppercase())
>         .collect();
>     println!("{:?}", result);
> }
> ```
>
> **Explanation:** Combining iterator adapters builds efficient, single-pass processing pipelines.

---

### Exercise 3: Zipping Two Parallel Iterators

**Problem:** Combine `vec!["one", "two"]` and `vec![1, 2]` into tuples using `.zip()`.

**Expected output:**
> [!check]- Answer
> ```
> [("one", 1), ("two", 2)]
> ```
> ```rust
> fn main() {
>     let keys = vec!["one", "two"];
>     let vals = vec![1, 2];
>     let zipped: Vec<(&str, i32)> = keys.into_iter().zip(vals).collect();
>     println!("{:?}", zipped);
> }
> ```
>
> **Explanation:** `.zip()` pairs elements from two iterators into single combined tuple sequences.

---

## 6. Related Terms

- [Lazy Evaluation](../level_06/lazy_evaluation.md) — The fundamental concept explaining why Iterator Chains do absolutely nothing until a Consumer like `.collect()` is called.
- [Closure](../level_06/closure.md) — The tiny anonymous functions you are passing into `map()` and `filter()`.

---

## 7. Key Takeaways

- Iterator Chains let you build expressive, declarative data pipelines instead of imperative `for` loops.
- Common chain links (Adapters) include `.map()`, `.filter()`, and `.filter_map()`.
- The chain **must** always end with a "Consumer" like `.collect()`, `.sum()`, or `.count()` to actually trigger the work.
- Thanks to Zero-Cost Abstractions, Iterator Chains are just as fast (and sometimes even faster) than manual `for` loops.
