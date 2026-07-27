# `BTreeMap<K, V>`

> **Level 2 — Control Flow & Data Structures**
> An ordered map that keeps keys sorted, with efficient range queries — `HashMap`'s sorted sibling.

---

## 1. Prerequisites

- [`HashMap<K, V>`](../level_02/hashmap_k_v.md) — The unordered map this type mirrors in API but differs from in ordering and key requirements.
- [`PartialOrd` / `Ord`](../level_04/partialord_ord.md) — Required on the key type, instead of `Hash`.
- [`for` / Range](../level_02/for_range.md) — What powers the efficient `.range()` queries.

---

## 2. Term Category

**Collection Type (the sorted map)**: `BTreeMap<K, V>` provides the same "look values up by key" contract as `HashMap`, but backed by a B-tree instead of a hash table. The trade-off is fundamental: you give up `HashMap`'s O(1) average lookup for O(log n), in exchange for keys that are **always kept in sorted order** and support efficient range queries.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

`HashMap` deliberately scrambles key order for speed — hashing throws away any notion of "less than" or "greater than." But sometimes you *need* order: "give me all entries with keys between 100 and 200," or "what's the smallest key still in the map?" A `HashMap` can only answer these by scanning every single entry, which is O(n). `BTreeMap` organizes its keys in a self-balancing tree structure specifically so these are efficient, tree-traversal operations instead of full scans — at the modest cost of needing `Ord` instead of `Hash`, and losing the O(1) average case.

### (2) Reality Metaphor

Imagine a phone book (a physical, printed one) versus a scrambled box of index cards.

- **`HashMap`**: Every contact is on an index card thrown into a bin, sorted only by a hash you can't read. Finding "Alice" is nearly instant if you know her hash-bucket, but you have no idea who comes "before" or "after" her.
- **`BTreeMap`**: A real phone book, alphabetically sorted. Finding "Alice" takes a moment longer (flip to the "A" section), but you can instantly answer "who's between Aaron and Andrew?" (a **range query**), or "who's the very first entry?" — questions the scrambled index-card bin simply cannot answer efficiently.

### (3) Rust Code Examples

#### Short Snippet (Sorted Iteration, For Free)
```rust
use std::collections::BTreeMap;

fn main() {
    let mut scores = BTreeMap::new();
    scores.insert("charlie", 90);
    scores.insert("alice", 100);
    scores.insert("bob", 95);

    // BTreeMap ALWAYS iterates in key-sorted order — no .sort() needed.
    for (name, score) in &scores {
        println!("{name}: {score}");
    }
    // alice: 100
    // bob: 95
    // charlie: 90
}
```

#### Fuller Example (Range Queries)
```rust
use std::collections::BTreeMap;
use std::ops::Bound::Included;

fn main() {
    let mut inventory: BTreeMap<u32, &str> = BTreeMap::new();
    inventory.insert(100, "widget-A");
    inventory.insert(150, "widget-B");
    inventory.insert(200, "widget-C");
    inventory.insert(250, "widget-D");

    // Efficiently find every item priced between 120 and 220 (inclusive), in O(log n + k).
    for (price, name) in inventory.range((Included(120), Included(220))) {
        println!("{name} costs {price}");
    }
    // widget-B costs 150
    // widget-C costs 200

    // first_key_value / last_key_value: instant min/max, no scan needed.
    println!("{:?}", inventory.first_key_value()); // Some((100, "widget-A"))
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Btreemap K V Scoping and Lifecycle Rules

**The mistake:** Assuming Btreemap K V instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("btreemap_k_v_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("btreemap_k_v_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Btreemap K V State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Btreemap K V through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Btreemap K V Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Btreemap K V instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Requirement Mismatch

**Problem:** You try to use a custom struct `Config { name: String, value: i32 }` as a key in a `BTreeMap<Config, String>`, and the compiler rejects it with a trait-bound error. What trait is missing, and how do you fix it?

> [!check]- Answer
> The missing trait is **`Ord`** (along with its prerequisites `PartialOrd`, `Eq`, `PartialEq`). Fix it by deriving all four:
>
> ```rust
> #[derive(PartialEq, Eq, PartialOrd, Ord)]
> struct Config { name: String, value: i32 }
> ```
>
> Note this is the opposite requirement from `HashMap`, which would need `Hash` + `Eq` instead.

---

### Exercise 2: Sorted Key Traversal

**Problem:** Insert unordered integer keys `5, 1, 3` into a `BTreeMap`, iterate over them, and verify keys are printed in ascending sorted order.

**Expected output:**
```
1
3
5
```

> [!check]- Answer
> ```rust
> use std::collections::BTreeMap;
> fn main() {
>     let mut map = BTreeMap::new();
>     map.insert(5, "e");
>     map.insert(1, "a");
>     map.insert(3, "c");
>     for (key, _) in &map {
>         println!("{}", key);
>     }
> }
> ```
>
> **Explanation:** `BTreeMap` automatically maintains key order upon insertion.

### Exercise 3: Range Search Queries

**Problem:** Use `.range(2..=4)` on a `BTreeMap` containing keys `1..=5` to print only values whose keys fall within the range `[2, 4]`.

**Expected output:**
```
2: b
3: c
4: d
```

> [!check]- Answer
> ```rust
> use std::collections::BTreeMap;
> fn main() {
>     let mut map = BTreeMap::new();
>     map.insert(1, "a"); map.insert(2, "b"); map.insert(3, "c");
>     map.insert(4, "d"); map.insert(5, "e");
>     for (k, v) in map.range(2..=4) {
>         println!("{}: {}", k, v);
>     }
> }
> ```
>
> **Explanation:** `.range()` executes sub-slice range queries efficiently in `O(log N)` time.

---

## 6. Related Terms

- [`HashMap<K, V>`](../level_02/hashmap_k_v.md) — The unordered sibling with the same core API but different internal structure and trait bounds.
- [`BTreeSet<T>`](../level_02/hashset_btreeset.md) — The set counterpart, same underlying B-tree.
- [`PartialOrd` / `Ord`](../level_04/partialord_ord.md) — The required key-comparison trait.
- [Entry API](../level_02/entry_api.md) — `BTreeMap` supports `.entry()` too, with identical semantics to `HashMap`.

---

## 7. Key Takeaways

- `BTreeMap<K, V>` keeps keys in **sorted order at all times**, at the cost of O(log n) instead of O(1) average operations.
- Keys must implement `Ord`, not `Hash` — a fundamentally different requirement from `HashMap`.
- `.range(start..end)` gives efficient, tree-traversal-based access to a contiguous key range — something `HashMap` cannot do efficiently at all.
- Default to `HashMap` for raw speed; reach for `BTreeMap` specifically when sorted iteration or range queries are a real requirement.
