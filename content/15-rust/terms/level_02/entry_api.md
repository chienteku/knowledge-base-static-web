# Entry API (`.entry(k).or_insert(...)`)

> **Level 2 — Control Flow & Data Structures**
> The idiomatic single-lookup pattern for "insert if absent, otherwise update" on `HashMap`/`BTreeMap`.

---

## 1. Prerequisites

- [`HashMap<K, V>`](../level_02/hashmap_k_v.md) — The collection this API is a method on.
- [Closure](../level_06/closure.md) — Used by the lazy `or_insert_with` variant.
- [`Default` Trait](../level_04/default_trait.md) — Used by `or_default`.

---

## 2. Term Category

**Collection Idiom (the single-lookup pattern)**: The Entry API is `HashMap`'s answer to "insert-if-absent, update-if-present" — one of the most common map operations in any language. It exists to replace a naive two-lookup pattern with a single, efficient traversal into the map's internal structure.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The obvious way to write "increment a counter for this key, starting at 0 if it's new" is: `if !map.contains_key(&key) { map.insert(key, 0); } map[key] += 1;` (or the borrow-checker-friendlier `match map.get_mut(&key)`). Both approaches walk the map's internal hash buckets **twice** — once to check, once to insert/update — which is wasteful, and the `match`-based version is verbose. Rust's `HashMap::entry()` method solves both problems: it does the bucket lookup exactly once, returning an `Entry` enum (`Occupied` or `Vacant`) that represents "the exact spot this key belongs, whether or not it's filled yet." Every subsequent method on that `Entry` — `or_insert`, `or_insert_with`, `and_modify` — operates on that already-found spot, with no second traversal.

### (2) Reality Metaphor

Imagine checking into a hotel with an assigned room number, but you're not sure if the room already has a guest.

- **The naive two-lookup approach**: You ask the front desk "is room 402 occupied?" (lookup #1). They say no. You then separately ask them to "please put a guest in room 402" (lookup #2, walking to the room again).
- **The Entry API**: You ask the front desk for "room 402" — they walk you *directly* to the room's door (**one lookup**) and hand you a key that represents "this exact room, occupied or not." From there, you can say "if it's empty, put someone in; either way, hand me the current occupant" — all without the front desk needing to look anything up again.

### (3) Rust Code Examples

#### Short Snippet (Counting Word Frequencies)
```rust
use std::collections::HashMap;

fn main() {
    let words = ["a", "b", "a", "c", "b", "a"];
    let mut counts: HashMap<&str, i32> = HashMap::new();

    for word in words {
        // "Get the entry for `word`; if vacant, insert 0; either way, give me a &mut to it."
        *counts.entry(word).or_insert(0) += 1;
    }

    println!("{:?}", counts); // {"a": 3, "b": 2, "c": 1}
}
```

#### Fuller Example (Grouping Into a `Vec` Per Key, With `or_default` and `and_modify`)
```rust
use std::collections::HashMap;

fn main() {
    let pairs = [("fruit", "apple"), ("veg", "carrot"), ("fruit", "banana")];
    let mut groups: HashMap<&str, Vec<&str>> = HashMap::new();

    for (category, item) in pairs {
        // or_default(): Vec<&str>::default() is an empty Vec — no closure needed.
        groups.entry(category).or_default().push(item);
    }
    println!("{:?}", groups); // {"fruit": ["apple", "banana"], "veg": ["carrot"]}

    // and_modify runs ONLY if the key already exists, chained before or_insert.
    let mut scores: HashMap<&str, i32> = HashMap::new();
    scores.entry("alice").and_modify(|s| *s += 10).or_insert(100);
    scores.entry("alice").and_modify(|s| *s += 10).or_insert(100);
    println!("{:?}", scores); // {"alice": 110}  (100 on first call, +10 on second)
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Entry Api Scoping and Lifecycle Rules

**The mistake:** Assuming Entry Api instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("entry_api_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("entry_api_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Entry Api State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Entry Api through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Entry Api Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Entry Api instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Rewrite Without the Entry API

**Problem:** Rewrite this Entry API line using only `.contains_key()` and `.insert()`/`.get_mut()`, to see exactly what the Entry API is saving you from:
```rust
*counts.entry(word).or_insert(0) += 1;
```

> [!check]- Answer
> ```rust
> if !counts.contains_key(word) {
>     counts.insert(word, 0);
> }
> *counts.get_mut(word).unwrap() += 1;
> ```
>
> Notice this performs the internal bucket lookup **twice** (`contains_key`, then `get_mut`), while the Entry API version does it once.

---

### Exercise 2: Word Frequency Counter with `or_insert`

**Problem:** Iterate through words `["apple", "banana", "apple", "apple"]` and count word frequencies using `HashMap::entry` and `.or_insert(0)`.

**Expected output:**
```
apple: 3
```

> [!check]- Answer
> ```rust
> use std::collections::HashMap;
> fn main() {
>     let words = vec!["apple", "banana", "apple", "apple"];
>     let mut map = HashMap::new();
>     for w in words {
>         *map.entry(w).or_insert(0) += 1;
>     }
>     println!("apple: {}", map.get("apple").unwrap());
> }
> ```
>
> **Explanation:** `.entry(k).or_insert(v)` returns a mutable reference `&mut V` to the existing or freshly initialized value.

### Exercise 3: In-Place Value Modification with `and_modify`

**Problem:** Use `.entry(key).and_modify(|e| *e *= 2).or_insert(10)` to double an existing value or default to 10.

**Expected output:**
```
Val: 100
```

> [!check]- Answer
> ```rust
> use std::collections::HashMap;
> fn main() {
>     let mut map = HashMap::from([("score", 50)]);
>     map.entry("score").and_modify(|e| *e *= 2).or_insert(10);
>     println!("Val: {}", map.get("score").unwrap());
> }
> ```
>
> **Explanation:** `.and_modify()` chains inline closure modifications for existing entries before falling back to `.or_insert()`.

---

## 6. Related Terms

- [`HashMap<K, V>`](../level_02/hashmap_k_v.md) / [`BTreeMap<K, V>`](../level_02/btreemap_k_v.md) — Both expose `.entry()`.
- [`Default` Trait](../level_04/default_trait.md) — Powers `.or_default()`.
- [Closure](../level_06/closure.md) — What `.or_insert_with()` and `.and_modify()` accept.
- [Ownership](../level_03/ownership.md) — Why a naive two-lookup pattern is even a problem worth solving — `Entry` holds onto the located slot so you don't re-borrow the map twice.

---

## 7. Key Takeaways

- `.entry(key)` performs exactly **one** internal lookup, returning an `Entry` that represents "this key's slot, filled or not."
- `.or_insert(v)` inserts `v` if vacant, and always returns a `&mut V` to the (now-guaranteed-present) value.
- `.or_insert_with(closure)` is the lazy version — use it when computing the default value is expensive.
- `.or_default()` inserts `V::default()` if vacant — the shortest form, when `V: Default`.
- `.and_modify(closure)` runs only on the `Occupied` branch, and is commonly chained before `.or_insert(...)`.
