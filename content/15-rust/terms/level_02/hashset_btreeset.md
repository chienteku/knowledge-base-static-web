# `HashSet<T>` / `BTreeSet<T>`

> **Level 2 — Control Flow & Data Structures**
> Collections of unique values — hash-based (unordered) or B-tree-based (sorted).

---

## 1. Prerequisites

- [`HashMap<K, V>`](../level_02/hashmap_k_v.md) — `HashSet<T>` is implemented internally as `HashMap<T, ()>`.
- [`Hash` Trait](../level_02/hash_trait.md) — Required for `HashSet` elements.
- [`PartialOrd` / `Ord`](../level_04/partialord_ord.md) — Required for `BTreeSet` elements.

---

## 2. Term Category

**Collection Type (the deduplicator)**: A `Set` answers one question extremely efficiently: "have I seen this value before?" `HashSet<T>` and `BTreeSet<T>` are Rust's two set implementations — same core guarantee (no duplicates), different trade-offs (hashing speed vs. sorted iteration order).

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

A very common task is "give me the unique values from this collection" or "quickly check membership." You *could* use a `Vec<T>` and call `.contains()`, but that's an O(n) linear scan for every check. You could use a `HashMap<T, ()>` — and in fact that's *exactly* what `HashSet<T>` is under the hood, just with a cleaner API that hides the meaningless `()` value. Rust gives you two flavors because they inherit the trade-offs of their underlying map: `HashSet` (backed by hashing) gives O(1) average membership checks but no ordering guarantee; `BTreeSet` (backed by a sorted tree) gives O(log n) checks but keeps elements sorted, and lets you efficiently query ranges.

### (2) Reality Metaphor

Imagine a nightclub bouncer checking IDs against a guest list, deciding whether to let someone in for the first time.

- **`HashSet`**: The bouncer has a magic scanner that instantly hashes each ID card and checks a bucket — nearly instant, but the guest list on the clipboard is in a completely scrambled, unpredictable order.
- **`BTreeSet`**: The bouncer keeps a physical, alphabetically-sorted card catalog. Checking still takes a moment (flipping to the right letter), but at the end of the night, reading the whole guest list off top to bottom gives you it in perfect alphabetical order for free.
- **The core guarantee, either way**: No matter how many times the same person tries to walk in, the guest list only ever records them **once**.

### (3) Rust Code Examples

#### Short Snippet (Deduplication)
```rust
use std::collections::HashSet;

fn main() {
    let numbers = vec![1, 2, 2, 3, 3, 3, 4];
    let unique: HashSet<i32> = numbers.into_iter().collect();

    println!("{}", unique.len()); // 4 (duplicates silently discarded)
    println!("{}", unique.contains(&3)); // true — O(1) average lookup
}
```

#### Fuller Example (Set Algebra: Union, Intersection, and Sorted Iteration)
```rust
use std::collections::{BTreeSet, HashSet};

fn main() {
    let a: HashSet<i32> = [1, 2, 3, 4].into_iter().collect();
    let b: HashSet<i32> = [3, 4, 5, 6].into_iter().collect();

    let mut intersection: Vec<&i32> = a.intersection(&b).collect();
    intersection.sort(); // HashSet order is unpredictable; sort for stable output.
    println!("{:?}", intersection); // [3, 4]

    // BTreeSet: same dedup guarantee, but iteration is ALWAYS sorted — no manual sort needed.
    let sorted_set: BTreeSet<i32> = [5, 1, 4, 1, 3].into_iter().collect();
    let ordered: Vec<&i32> = sorted_set.iter().collect();
    println!("{:?}", ordered); // [1, 3, 4, 5] — guaranteed ascending order
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Hashset Btreeset Scoping and Lifecycle Rules

**The mistake:** Assuming Hashset Btreeset instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("hashset_btreeset_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("hashset_btreeset_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Hashset Btreeset State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Hashset Btreeset through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Hashset Btreeset Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Hashset Btreeset instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Choose the Right Set

**Problem:** You need to store a set of user IDs and, at the end of the program, print them out in ascending numerical order for a report. Which type do you reach for, and why — `HashSet<u32>` or `BTreeSet<u32>`?

> [!check]- Answer
> **`BTreeSet<u32>`.**
>
> Since you need sorted output at the end, `BTreeSet` gives you that for free via `.iter()`, with no separate sort step. `HashSet` would technically work too (collect into a `Vec` and `.sort()` before printing), but if sorted access is a recurring requirement rather than a one-off, `BTreeSet` is the more direct, idiomatic choice — it keeps the invariant maintained continuously instead of re-deriving it every time.

---

### Exercise 2: Set Difference Operations

**Problem:** Find the difference between two `HashSet`s `A = {1, 2, 3}` and `B = {2, 3, 4}` using `.difference()`.

**Expected output:**
```
[1]
```

> [!check]- Answer
> ```rust
> use std::collections::HashSet;
> fn main() {
>     let a: HashSet<i32> = [1, 2, 3].into_iter().collect();
>     let b: HashSet<i32> = [2, 3, 4].into_iter().collect();
>     let diff: Vec<&i32> = a.difference(&b).collect();
>     println!("{:?}", diff);
> }
> ```
>
> **Explanation:** `.difference(&b)` returns items in `a` that do not exist in `b`.

### Exercise 3: Sorted Uniqueness with BTreeSet

**Problem:** Insert random numbers `[9, 2, 5, 2, 9, 1]` into a `BTreeSet` and print elements.

**Expected output:**
```
1 2 5 9
```

> [!check]- Answer
> ```rust
> use std::collections::BTreeSet;
> fn main() {
>     let set: BTreeSet<i32> = [9, 2, 5, 2, 9, 1].into_iter().collect();
>     for num in set {
>         print!("{} ", num);
>     }
>     println!();
> }
> ```
>
> **Explanation:** `BTreeSet` deduplicates elements and stores them in strictly sorted order.

---

## 6. Related Terms

- [`HashMap<K, V>`](../level_02/hashmap_k_v.md) — `HashSet<T>` is literally `HashMap<T, ()>` internally.
- [`BTreeMap<K, V>`](../level_02/btreemap_k_v.md) — `BTreeSet<T>`'s map counterpart, same sorted-tree structure.
- [`Hash` Trait](../level_02/hash_trait.md) — Required on `T` for `HashSet<T>`.
- [`PartialOrd` / `Ord`](../level_04/partialord_ord.md) — Required on `T` for `BTreeSet<T>`.
- [`FromIterator` / `Extend` Traits](../level_02/fromiterator_extend_traits.md) — What powers `.collect::<HashSet<_>>()` and `.extend()`.

---

## 7. Key Takeaways

- Both types guarantee **no duplicate elements**; the difference is purely about backing structure and ordering.
- `HashSet<T>` requires `Hash + Eq` on `T`; offers O(1) average membership checks; **no** iteration-order guarantee.
- `BTreeSet<T>` requires `Ord` on `T`; offers O(log n) membership checks; **always** iterates in sorted order.
- `HashSet` is internally `HashMap<T, ()>` — the unit-type value is a ZST, so there's no real memory overhead versus a "pure" set structure.
- Both support set algebra (`.union()`, `.intersection()`, `.difference()`) out of the box.
