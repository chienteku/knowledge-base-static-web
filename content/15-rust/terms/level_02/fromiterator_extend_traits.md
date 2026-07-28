# `FromIterator` / `Extend` Traits

> **Level 2 — Control Flow & Data Structures**
> The traits that power `.collect()` and `.extend()` — the mechanism that lets *any* collection be built from an iterator.

---

## 1. Prerequisites

- [Collecting (`.collect()`)](../level_02/collecting.md) — The method whose implementation this trait defines.
- [Iterator](../level_02/iterator.md) — The source `.collect()`/`.extend()` consume.
- [Turbofish (`::<>`)](../level_06/turbofish.md) — How you tell `.collect()` which `FromIterator` implementation to use.

---

## 2. Term Category

**Standard Library Trait (the collection-builder contract)**: `.collect()` feels like magic — the same method call builds a `Vec`, a `HashMap`, a `String`, or even a `Result`, depending only on the type annotation. `FromIterator` is *why* that magic works: it's the trait `.collect()` actually calls into, and every collectible type implements it.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Rust could have hard-coded `.collect()` to only understand `Vec`, `HashMap`, and a handful of other built-ins. Instead, the standard library made "can be built from an iterator" an actual trait, `FromIterator<A>`, with one required method: `from_iter(iter: impl IntoIterator<Item = A>) -> Self`. `.collect()` is just a thin generic wrapper that calls `Self::from_iter(self)`. This design means **any** type — including ones you define yourself — can support `.collect()` for free, just by implementing `FromIterator`. `Extend` is the closely related sibling for growing an *existing* collection rather than building a new one, powering `.extend()` and the `+=`-style accumulation pattern.

### (2) Reality Metaphor

Imagine a factory assembly line (the iterator) that can feed its output into many different kinds of packaging machines.

- **`FromIterator`** is the certification each packaging machine (`Vec`, `HashMap`, `String`, ...) holds, proving "I know how to receive a stream of items and box myself up from scratch." `.collect()` is just walking the conveyor belt over to whichever certified machine you pointed at.
- **`Extend`** is a *different* certification: "I already have a partially-full box, and I know how to keep stuffing more items from the belt into the box I already have," rather than building a brand new box from nothing.

### (3) Rust Code Examples

#### Short Snippet (Implementing `FromIterator` for Your Own Type)
```rust
struct Histogram {
    buckets: Vec<u32>,
}

impl FromIterator<u32> for Histogram {
    fn from_iter<I: IntoIterator<Item = u32>>(iter: I) -> Self {
        let mut buckets = vec![0; 10];
        for value in iter {
            buckets[(value % 10) as usize] += 1;
        }
        Histogram { buckets }
    }
}

fn main() {
    // Because we implemented FromIterator, .collect() now builds a Histogram for free!
    let hist: Histogram = [3, 13, 23, 7, 17].into_iter().collect();
    println!("{:?}", hist.buckets); // [0,0,0,3,0,0,0,2,0,0]
}
```

#### Fuller Example (`Extend`, for Growing Instead of Building)
```rust
fn main() {
    let mut running_total: Vec<i32> = vec![1, 2, 3];

    // .extend() calls Extend::extend, appending WITHOUT discarding what's already there.
    running_total.extend([4, 5, 6]);
    println!("{:?}", running_total); // [1, 2, 3, 4, 5, 6]

    // .collect() (FromIterator) vs .extend() (Extend) — same source data, different intent:
    let fresh: Vec<i32> = [10, 20].into_iter().collect(); // Builds a NEW Vec.
    println!("{:?}", fresh); // [10, 20]
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Fromiterator Extend Traits Scoping and Lifecycle Rules

**The mistake:** Assuming Fromiterator Extend Traits instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("fromiterator_extend_traits_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("fromiterator_extend_traits_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Fromiterator Extend Traits State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Fromiterator Extend Traits through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Fromiterator Extend Traits Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Fromiterator Extend Traits instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Predict the Collected Type

**Problem:** What does `.collect()` build here, and what happens if any item is `Err`?

```rust
fn parse_all(inputs: &[&str]) -> Result<Vec<i32>, std::num::ParseIntError> {
    inputs.iter().map(|s| s.parse::<i32>()).collect()
}
```

> [!check]- Answer
> It builds a **`Result<Vec<i32>, ParseIntError>`** — `Result` itself implements `FromIterator` over an iterator of `Result`s! If every item is `Ok`, you get `Ok(Vec<i32>)` with all the values unwrapped and collected. If **any** item is `Err`, the whole collect **short-circuits** and returns just that first `Err` immediately, discarding the rest — a surprisingly elegant pattern that falls directly out of the `FromIterator for Result<V, E>` implementation.

---

### Exercise 2: Appending Vector Elements with Extend

**Problem:** Create a mutable vector `vec![1, 2]`. Extend it with elements from a second vector `vec![3, 4, 5]` using `.extend()`.

**Expected output:**
> [!check]- Answer
> ```
> [1, 2, 3, 4, 5]
> ```
> ```rust
> fn main() {
>     let mut v1 = vec![1, 2];
>     let v2 = vec![3, 4, 5];
>     v1.extend(v2);
>     println!("{:?}", v1);
> }
> ```
>
> **Explanation:** `Extend` appends all items from an iterator into an existing mutable collection without reallocating a brand new container.

---

### Exercise 3: Custom Collection `FromIterator` Implementation

**Problem:** Demonstrate collecting a string iterator into a `String` using `FromIterator` to build a single concatenated string.

**Expected output:**
> [!check]- Answer
> ```
> rustlang
> ```
> ```rust
> fn main() {
>     let parts = vec!["rust", "lang"];
>     let full: String = parts.into_iter().collect();
>     println!("{}", full);
> }
> ```
>
> **Explanation:** `String` implements `FromIterator<&str>`, allowing iterators of string slices to be collected directly into an owned `String`.

---

## 6. Related Terms

- [Collecting (`.collect()`)](../level_02/collecting.md) — The method that's just a thin wrapper around `FromIterator::from_iter`.
- [Iterator](../level_02/iterator.md) — The trait every `FromIterator` implementation consumes.
- [`Result<T, E>`](../level_02/result_t_e.md) — Notably implements `FromIterator`, enabling the short-circuiting collect pattern above.
- [`HashSet<T>` / `BTreeSet<T>`](../level_02/hashset_btreeset.md), [`VecDeque<T>`](../level_02/vecdeque_t.md) — All implement both `FromIterator` and `Extend`.

---

## 7. Key Takeaways

- `FromIterator<A>` is the trait behind `.collect()` — implementing it makes your type a valid collect target.
- `Extend<A>` is the trait behind `.extend()` — growing an *existing* collection instead of building a fresh one.
- `Result<T, E>` and `Option<T>` both implement `FromIterator`, giving you free short-circuiting collection over fallible iterator chains.
- These traits are why `.collect()` can build wildly different types (`Vec`, `String`, `HashMap`, `Result<Vec<_>, _>`) from the exact same generic method call.
