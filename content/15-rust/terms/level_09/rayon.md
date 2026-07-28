# Rayon

> **Level 9 — Concurrency & Parallelism**
> Popular crate for data parallelism; provides parallel iterators (`.par_iter()`).

---

## 1. Prerequisites

- [`std::thread::spawn`](../level_09/std_thread_spawn.md) — The raw multi-threading tool that Rayon abstracts away.
- [Iterator Adapters](../level_02/iterator_adapters.md) — The `.iter().map().filter()` chains that Rayon supercharges.
- [Closure (`|...|`)](../level_06/closure.md) — The syntax used to pass logic into Rayon iterators.

---

## 2. Term Category

**Rust Tooling (the parallel powerhouse)**: Writing raw `std::thread::spawn` code is tedious. If you have an array of 1,000,000 numbers and you want to double all of them, you don't want to manually spawn 16 threads, slice the array into 16 chunks, pass the chunks to the threads, wait for them to finish, and painstakingly recombine the array. 

**Rayon** is an external crate that does all of this for you automatically. You literally just change `.iter()` to `.par_iter()`, and your loop instantly runs across all available CPU cores!

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The Rust designers wanted concurrency to be incredibly easy, but they also didn't want to bloat the standard library with complex thread-pooling logic. 

Rayon was created as an external crate (built by Niko Matsakis, one of Rust's core designers) to handle "Data Parallelism". 

It uses a brilliant algorithm called a **"work-stealing thread pool"**. If you have a massive loop, Rayon automatically distributes the loop iterations across all available CPU cores. If Core 1 finishes its chunk of work early, it literally "steals" work from Core 2's queue so that no CPU core is ever sitting idle! This maximizes efficiency with zero manual configuration.

### (2) Reality Metaphor

Imagine you have 10,000 envelopes to stuff. 

- **Single Thread (`.iter()`):** You sit alone at a desk and stuff them one by one. It takes 10 hours.
- **Manual Threads (`thread::spawn`):** You hire 4 friends, spend an hour splitting the envelopes into 4 perfectly equal piles, hand them out, and wait. If Friend A finishes their pile early, they just sit in a chair doing nothing while the others work.
- **Rayon (`.par_iter()`):** You dump all 10,000 envelopes in the center of the room and yell *"Go!"* Your 4 friends grab as many as they can. If Friend A finishes their pile, they immediately reach over and steal envelopes from Friend B's pile. Nobody is ever sitting idle!

### (3) Rust Code Examples

#### Short Snippet (The Magic Trick)
To use Rayon, you add `rayon = "1"` to your `Cargo.toml`. Then, you must bring the Rayon "prelude" into scope. This unlocks the magic `.par_iter()` method on all your standard collections (Vecs, HashMaps, etc.).

```rust
use rayon::prelude::*; // <--- Required!

fn main() {
    let numbers = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // This sum is calculated across multiple threads!
    let total: i32 = numbers.par_iter().sum();
}
```

#### Fuller Example (The Massive Chain)
Rayon provides parallel versions of almost every standard iterator adapter (`.map`, `.filter`, `.collect`). 

```rust
use rayon::prelude::*;

fn main() {
    // A massive vector of 1 million numbers
    let mut numbers: Vec<i32> = (1..1_000_000).collect();

    // In a SINGLE LINE, we spin up a thread pool, distribute the data,
    // filter it, mutate it, and recombine it.
    let processed_data: Vec<i32> = numbers
        .into_par_iter()           // 1. Parallel Iterator!
        .filter(|&x| x % 2 == 0)   // 2. Filter evens in parallel
        .map(|x| x * x)            // 3. Square them in parallel
        .collect();                // 4. Recombine into a single Vec!
        
    println!("Processed {} items!", processed_data.len());
}
```
If you accidentally tried to cause a Data Race inside the `.map()` closure, the Rust compiler would catch it instantly and refuse to compile, maintaining "Fearless Concurrency"!

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Rayon Scoping and Lifecycle Rules

**The mistake:** Assuming Rayon instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("rayon_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("rayon_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Rayon State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Rayon through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Rayon Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Rayon instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Missing Import

**Problem:** You copy-pasted some Rayon code from StackOverflow. 
`let sum: i32 = my_vec.par_iter().sum();`
The compiler throws an error: `no method named 'par_iter' found for struct 'Vec'`. What line of code did you forget to add to the top of your file?

> [!check]- Answer
> You forgot the prelude! 
>
> ```rust
> use rayon::prelude::*;
> ```
> Traits must be in scope to use their methods. The Rayon prelude brings all the necessary extension traits into scope so that standard library types like `Vec` suddenly gain the `.par_iter()` methods.

---

### Exercise 2: Sequential vs. Parallel Sum with `par_iter`

**Problem:**
Rayon's killer feature is that replacing `.iter()` with `.par_iter()` is a one-word change that distributes work across all CPU cores automatically. The interface is identical — the same adapters (`.map`, `.filter`, `.sum`, etc.) work on both.

Write a program that:
1. Creates a `Vec<i64>` of 10,000,000 numbers from 1 to 10,000,000.
2. Computes the sum **sequentially** with `.iter().sum::<i64>()` and prints it.
3. Computes the sum **in parallel** with `.par_iter().sum::<i64>()` and prints it.
4. Asserts both results are equal.

Then answer: **why will both produce the same result even though parallel order is non-deterministic?**

**Expected output:**
> [!check]- Answer
> ```text
> Sequential sum: 50000005000000
> Parallel sum:   50000005000000
> Results match!
> ```
>
> - **Hint 1:** Add `rayon = "1"` to `[dependencies]` in `Cargo.toml`, then `use rayon::prelude::*;` at the top of the file. Without the prelude import, `.par_iter()` does not exist — the method is added to `Vec` via an extension trait that the prelude brings into scope.
> - **Hint 2:** The one-word change: `nums.iter().sum::<i64>()` → `nums.par_iter().sum::<i64>()`. Rayon splits the slice into chunks, sums each chunk on a separate thread pool worker, then combines the partial sums. The total is always correct because integer addition is associative and commutative — order doesn't affect the final sum.
> - **Hint 3:** For very small vectors, `.par_iter()` will be *slower* than `.iter()` because thread management overhead exceeds the computation cost. The 10M-element range ensures the parallel version actually benefits from parallelism.
>
> ```rust
> use rayon::prelude::*;
>
> fn main() {
>     let nums: Vec<i64> = (1..=10_000_000).collect();
>
>     // Sequential: single thread, left-to-right
>     let seq_sum: i64 = nums.iter().sum();
>     println!("Sequential sum: {}", seq_sum);
>
>     // Parallel: Rayon splits the slice across all CPU cores.
>     // Each worker sums its chunk; results are combined (reduced) at the end.
>     let par_sum: i64 = nums.par_iter().sum();
>     println!("Parallel sum:   {}", par_sum);
>
>     assert_eq!(seq_sum, par_sum);
>     println!("Results match!");
> }
> ```
>
> **Answer to the ordering question:**
> Integer summation is both *associative* (`(a+b)+c == a+(b+c)`) and *commutative* (`a+b == b+a`). Rayon can split the slice into any number of chunks and sum them in any order — the partial sums will always combine to the same total. This is why `.par_iter().sum()` is always correct regardless of thread scheduling. Floating-point operations are **not** fully associative (due to rounding), so `f64` parallel sums may differ slightly from sequential sums.

---

### Exercise 3: Parallel Sorting and `par_iter().map()` Pipeline

**Problem:**
Rayon parallelises not just reductions (like `.sum()`) but also transformations (`.map()`, `.filter()`) and sorting (`.par_sort()`). The key rule: operations that are **embarrassingly parallel** — where each element is processed independently — are Rayon's sweet spot.

Write a program that:
1. Creates a `Vec<i32>` of 1,000,000 random-ish numbers using `(0..1_000_000).map(|i| (i * 7 + 3) % 997).collect()`.
2. Uses `.par_sort()` to sort the vector in parallel and verifies it is sorted by checking `data.windows(2).all(|w| w[0] <= w[1])`.
3. Uses `par_iter().map(|&x| x * x).sum::<i64>()` to compute the sum of squares in parallel.
4. Prints both results.

**Expected output:**
> [!check]- Answer
> ```text
> Sorted: true
> Sum of squares: 330836500000
> ```
>
> - **Hint 1:** `.par_sort()` is an in-place parallel sort — it is a drop-in replacement for `.sort()`. It uses a parallel merge sort or introsort variant internally. Like sequential `.sort()`, it requires `T: Ord`. For a custom comparator, use `.par_sort_by(|a, b| a.cmp(b))`.
> - **Hint 2:** `.par_iter().map(|&x| x * x).sum::<i64>()` is a parallel pipeline: Rayon splits the slice, each worker maps its chunk (squares every element), then all partial sums are reduced. The type annotation `::<i64>` prevents integer overflow for large sums.
> - **Hint 3:** `.windows(2)` produces overlapping pairs `[a, b]` from the sorted vec. `all(|w| w[0] <= w[1])` checks every consecutive pair — the fastest way to verify a sorted `Vec` without re-sorting.
>
> ```rust
> use rayon::prelude::*;
>
> fn main() {
>     // Generate 1M pseudo-random numbers using a simple formula.
>     let mut data: Vec<i32> = (0..1_000_000)
>         .map(|i| (i * 7 + 3) % 997)
>         .collect();
>
>     // par_sort: parallel in-place sort — drop-in replacement for .sort()
>     data.par_sort();
>     let is_sorted = data.windows(2).all(|w| w[0] <= w[1]);
>     println!("Sorted: {}", is_sorted);
>
>     // Parallel map + sum pipeline: square each element, then sum all squares.
>     let sum_of_squares: i64 = data.par_iter()
>         .map(|&x| x as i64 * x as i64)
>         .sum();
>     println!("Sum of squares: {}", sum_of_squares);
> }
> ```
>
> **Explanation:**
> `.par_sort()` and `.par_iter().map(...).sum()` both follow Rayon's **work-stealing** model: the global thread pool divides the data into chunks. Idle threads "steal" work from busy threads' queues, ensuring all CPU cores stay fully utilised. The result is that both operations run in roughly `O(n log n / cores)` and `O(n / cores)` wall-clock time respectively — the speedup scales with the number of cores. The programmer writes code that *looks* sequential but executes in parallel with zero explicit thread management.

---

## 6. Related Terms

- [Iterator Adapters](../level_02/iterator_adapters.md) — Rayon provides parallel equivalents for all of these (`.map`, `.filter`, etc.).
- [`std::thread::spawn`](../level_09/std_thread_spawn.md) — What Rayon is actually doing under the hood!

---

## 7. Key Takeaways

- **Rayon** is the standard Rust crate for Data Parallelism.
- It uses a highly optimized **"work-stealing" thread pool** to ensure no CPU core ever sits idle.
- You unlock it by bringing **`use rayon::prelude::*;`** into scope.
- You simply replace `.iter()` with **`.par_iter()`**, or `.into_iter()` with **`.into_par_iter()`**.
- **Do NOT use it for tiny arrays!** The overhead of thread management will actually slow your program down.
