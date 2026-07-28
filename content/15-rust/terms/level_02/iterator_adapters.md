# Iterator Adapters

> **Level 2 — Control Flow & Data Structures**
> Methods like `.map()`, `.filter()`, `.enumerate()` that transform iterators lazily.

---

## 1. Prerequisites

- [Iterator](../level_02/iterator.md) — The lazy sequence of items that adapters attach to.
- [Closures](../level_06/closure.md) — The inline anonymous functions (like `|x| x + 1`) that tell the adapters exactly what to do.

---

## 2. Term Category

**Rust-nonspecific**: Similar concepts exist in many languages, such as array methods in JavaScript (`array.map().filter()`) or the Streams API in Java. However, Rust's adapters are famous for being strictly lazy and compiling down to hyper-optimized machine code.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Once you have an Iterator producing values, you usually want to *do* something with them. You might want to transform them (e.g., multiply every number by 2) or filter them (e.g., keep only the even numbers).

In older languages, you'd write a manual `for` loop, add an `if` statement inside, and `.push()` the results to a new array. This is verbose and error-prone. 

Rust provides **Iterator Adapters**: methods that attach directly to an Iterator to modify the sequence. Crucially, they are **lazy**. Calling `.map()` doesn't actually execute any math; it just returns a *brand new Iterator* that promises to do the math later when it is finally consumed. This allows you to chain a dozen adapters together to build complex data pipelines without allocating any intermediate memory.

### (2) Reality Metaphor

If an Iterator is a factory conveyor belt carrying raw products, an **Iterator Adapter** is a specialized robotic arm you bolt onto the side of the belt.

One robotic arm (`.filter()`) is programmed to inspect the products and knock the defective ones off the belt. The next robotic arm down the line (`.map()`) is programmed to paint the remaining products red. 

You can bolt as many robotic arms onto the belt as you want. But remember: the robotic arms don't do *anything* until the factory boss turns the main conveyor belt motor on (by looping over it or `.collect()`ing it).

### (3) Rust Code Examples

#### Short Snippet (Map and Filter)
```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];

    // .filter() keeps only the even numbers
    // .map() multiplies them by 10
    // .collect() turns the machine on!
    let transformed: Vec<i32> = numbers.into_iter()
        .filter(|x| x % 2 == 0)
        .map(|x| x * 10)
        .collect();

    println!("{:?}", transformed); // [20, 40]
}
```

#### Fuller Example (The `enumerate` Adapter)
In languages like Python, you often use `enumerate` to get the index and the item at the same time. Rust has an adapter for this!
```rust
fn main() {
    let fruits = vec!["Apple", "Banana", "Cherry"];

    // `.enumerate()` wraps each item in a tuple: (index, item)
    for (index, fruit) in fruits.iter().enumerate() {
        println!("Fruit #{} is {}", index, fruit);
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Iterator Adapters Scoping and Lifecycle Rules

**The mistake:** Assuming Iterator Adapters instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("iterator_adapters_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("iterator_adapters_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Iterator Adapters State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Iterator Adapters through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Iterator Adapters Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Iterator Adapters instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The VIP List

**Problem:** You have a vector of ages. Use `.into_iter()`, then `.filter()` to keep only the ages that are 18 or older. Then use `.map()` to convert those valid ages into strings using `.to_string()`. Finally, collect them into a `Vec<String>`.

```rust
fn main() {
    let ages = vec![15, 22, 17, 30];
    
    // TODO: Write the iterator pipeline here!
    // let vips: Vec<String> = ...
    
    // println!("{:?}", vips); // Should print ["22", "30"]
}
```

> [!check]- Answer
> ```rust
> let vips: Vec<String> = ages.into_iter()
>     .filter(|&age| age >= 18)
>     .map(|age| age.to_string())
>     .collect();
> ```

---

### Exercise 2: Filtering and Mapping Numbers

**Problem:** Take `1..=10`, filter even numbers using `.filter()`, square them with `.map()`, and collect into `Vec<i32>`.

**Expected output:**
> [!check]- Answer
> ```
> [4, 16, 36, 64, 100]
> ```
> ```rust
> fn main() {
>     let result: Vec<i32> = (1..=10)
>         .filter(|x| x % 2 == 0)
>         .map(|x| x * x)
>         .collect();
>     println!("{:?}", result);
> }
> ```
>
> **Explanation:** `.filter()` retains elements matching predicates; `.map()` transforms retained elements.

---

### Exercise 3: Flattening Nested Iterators

**Problem:** Use `.flat_map()` to turn a vector of words `vec!["hi", "bye"]` into an iterator of individual chars.

**Expected output:**
> [!check]- Answer
> ```
> ['h', 'i', 'b', 'y', 'e']
> ```
> ```rust
> fn main() {
>     let words = vec!["hi", "bye"];
>     let chars: Vec<char> = words.into_iter().flat_map(|w| w.chars()).collect();
>     println!("{:?}", chars);
> }
> ```
>
> **Explanation:** `.flat_map()` maps items to sub-iterators and flattens intermediate sequences into a single stream.

---

## 6. Related Terms

- [Collecting](../level_02/collecting.md) — The terminal operation that forces the lazy adapters to finally execute and save their work.
- [Iterator](../level_02/iterator.md) — The prerequisite lazy sequence that adapters attach to.

---

## 7. Key Takeaways

- **Iterator Adapters** (`map`, `filter`, `enumerate`, `zip`, etc.) are methods that modify the sequence of an Iterator.
- They are **lazy** and return a *new* Iterator. They do not execute any work until they are consumed.
- They rely heavily on **Closures** (inline anonymous functions like `|x| x + 1`) to dictate their specific behavior.
- You can chain multiple adapters together to build complex data transformation pipelines with zero runtime overhead.
