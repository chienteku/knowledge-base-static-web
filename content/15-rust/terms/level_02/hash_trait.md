# `Hash` Trait

> **Level 2 — Control Flow & Data Structures**
> The trait a type must implement to be used as a `HashMap`/`HashSet` key.

---

## 1. Prerequisites

- [`HashMap<K, V>`](../level_02/hashmap_k_v.md) — The collection that requires this trait on its keys.
- [`PartialEq` / `Eq`](../level_04/partialeq_eq.md) — `Hash` must stay logically consistent with `Eq`.
- [Derive Macro](../level_04/derive_macro.md) — How `Hash` is almost always implemented in practice.

---

## 2. Term Category

**Standard Library Trait (the bucket-finder)**: `Hash` lets a type compute a numeric fingerprint of itself. `HashMap` uses that fingerprint to decide *which internal bucket* a key belongs in, so it can jump straight there instead of scanning every entry. Without `Hash`, a type simply cannot be used as a `HashMap` or `HashSet` key.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

A `HashMap` achieves its famous O(1) average lookup speed by never actually *searching*. Instead, it runs the key through a hash function to get a number, uses that number to jump directly to a bucket, and only then checks equality against the (usually one) candidate in that bucket. This means every key type needs a `.hash()` method — that's exactly what the `Hash` trait provides. Rust makes this a real, checkable trait bound (rather than assuming every type is hashable, like some languages do) so the compiler can catch "this type can't be a key" at compile time instead of at runtime.

### (2) Reality Metaphor

Imagine a massive library with a million books (the `HashMap`), but instead of alphabetical shelving, every book has a magic barcode (the `Hash`) that instantly tells you which of 10,000 shelves it belongs on.

- **With `Hash`**: You scan the barcode, walk directly to shelf #4,821, and the book (or an empty spot) is right there. Lookup is instant regardless of library size.
- **Without `Hash`**: The librarian has no barcode scanner for this kind of book. They refuse to shelve it at all — the compiler stops you before you even try.
- **The critical rule**: Two *identical* books (equal by `Eq`) **must** have the *same* barcode (equal by `Hash`), or the librarian will file duplicates on totally different shelves and "lose" one of them forever.

### (3) Rust Code Examples

#### Short Snippet (Deriving `Hash`)
The overwhelmingly common way to implement `Hash` is to derive it — never by hand.
```rust
use std::collections::HashMap;

// `Eq` and `Hash` must ALWAYS be derived together for correctness.
#[derive(Debug, PartialEq, Eq, Hash, Clone)]
struct UserId(u64);

fn main() {
    let mut sessions: HashMap<UserId, &str> = HashMap::new();
    sessions.insert(UserId(42), "alice_token");

    println!("{:?}", sessions.get(&UserId(42))); // Some("alice_token")
}
```

#### Fuller Example (Why `PartialEq` and `Hash` Must Agree)
```rust
use std::collections::HashSet;

// BAD: This type has custom Eq that ignores `id_padding`,
// but derived Hash that includes it. This VIOLATES the Hash contract!
#[derive(Debug, Eq, Hash, Clone)]
struct BrokenKey {
    value: i32,
    id_padding: u8, // Irrelevant to equality, but derived Hash still hashes it!
}

impl PartialEq for BrokenKey {
    fn eq(&self, other: &Self) -> bool {
        self.value == other.value // Only compares `value`!
    }
}

fn main() {
    let mut set = HashSet::new();
    set.insert(BrokenKey { value: 1, id_padding: 0 });

    // These are "equal" by our custom Eq (`value` matches)...
    let lookup = BrokenKey { value: 1, id_padding: 99 };

    // ...but they hash DIFFERENTLY (different id_padding), so HashSet looks
    // in the WRONG bucket and never finds it! This prints `false`.
    println!("{}", set.contains(&lookup));
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Hash Trait Scoping and Lifecycle Rules

**The mistake:** Assuming Hash Trait instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("hash_trait_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("hash_trait_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Hash Trait State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Hash Trait through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Hash Trait Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Hash Trait instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Make It Compile

**Problem:** This code fails to compile with `the trait bound Point: Hash is not satisfied`. Fix it with a one-line change to the struct definition.

```rust
use std::collections::HashSet;

#[derive(Debug, PartialEq, Eq)]
struct Point { x: i32, y: i32 }

fn main() {
    let mut visited: HashSet<Point> = HashSet::new();
    visited.insert(Point { x: 0, y: 0 });
}
```

> [!check]- Answer
> ```rust
> #[derive(Debug, PartialEq, Eq, Hash)]
> struct Point { x: i32, y: i32 }
> ```
>
> Adding `Hash` to the derive list is enough, since `i32` (the field type) already implements `Hash` itself — derived `Hash` just combines the hashes of every field.

---

### Exercise 2: Deriving Hash and Eq for Custom Key Structs

**Problem:** Define a custom struct `UserId(u64)` deriving `Hash`, `PartialEq`, and `Eq`. Insert it as a key in a `HashMap`.

**Expected output:**
> [!check]- Answer
> ```
> User found: Alice
> ```
> ```rust
> use std::collections::HashMap;
> #[derive(Hash, PartialEq, Eq, Debug)]
> struct UserId(u64);
> fn main() {
>     let mut map = HashMap::new();
>     map.insert(UserId(101), "Alice");
>     println!("User found: {}", map.get(&UserId(101)).unwrap());
> }
> ```
>
> **Explanation:** Deriving `Hash`, `PartialEq`, and `Eq` allows custom structs to serve as valid `HashMap` and `HashSet` keys.

---

### Exercise 3: Custom Hash Implementation for Field Selection

**Problem:**
Write a manual `Hash` implementation for `struct User { id: u64, cache: String }` that hashes **only** the `id` field (ignoring `cache`). This models the pattern where an expensive cached string should be irrelevant to identity.

Requirements:
1. Implement `PartialEq` and `Eq` for `User` — comparing by `id` only.
2. Implement `Hash` for `User` — hashing `id` only.
3. In `main`, insert a `User` into a `HashMap<User, &str>` as a key. Then perform a lookup using a **different** `User` instance that has the **same `id`** but a **different `cache`** string. Verify the lookup succeeds, proving both implementations agree.

**Expected output:**
> [!check]- Answer
> ```text
> Role for id=42: admin
> Two Users with same id are equal: true
> ```
>
> - **Hint 1:** The `Hash` contract: if `a == b` then `hash(a) == hash(b)`. Since `PartialEq` only compares `id`, `Hash` must also only hash `id`. Breaking this (e.g. hashing `cache` but comparing only `id`) causes lookup failures that are **silent** — the compiler won't catch it.
> - **Hint 2:** `HashMap::get` takes a key by reference: `map.get(&lookup_key)`. The lookup key doesn't need to be the exact same object inserted — it just needs to be `==` to an existing key and produce the same hash.
> - **Hint 3:** To use `User` as a `HashMap` key, the type must implement both `Hash` and `Eq`. Without both, the compiler will refuse with a trait bound error.
>
> ```rust
> use std::collections::HashMap;
> use std::hash::{Hash, Hasher};
>
> struct User {
>     id: u64,
>     cache: String, // ← intentionally ignored in Hash and PartialEq
> }
>
> // Compare by id only — cache is considered "hot data", not identity.
> impl PartialEq for User {
>     fn eq(&self, other: &Self) -> bool {
>         self.id == other.id
>     }
> }
> impl Eq for User {}
>
> // Hash by id only — MUST match the fields used in PartialEq.
> // If we also hashed `cache`, two equal Users (same id, different cache)
> // would produce different hashes, silently breaking HashMap lookups.
> impl Hash for User {
>     fn hash<H: Hasher>(&self, state: &mut H) {
>         self.id.hash(state);
>     }
> }
>
> fn main() {
>     let mut map: HashMap<User, &str> = HashMap::new();
>
>     // Insert a User with a warm cache.
>     map.insert(User { id: 42, cache: "warm_data".to_string() }, "admin");
>
>     // Look up by a DIFFERENT User instance with the same id but empty cache.
>     // Because Hash and PartialEq both use only `id`, this lookup must succeed.
>     let lookup = User { id: 42, cache: String::new() };
>
>     match map.get(&lookup) {
>         Some(role) => println!("Role for id=42: {}", role),
>         None       => println!("ERROR: lookup failed — Hash/Eq contract broken!"),
>     }
>
>     // Explicitly confirm the equality contract:
>     let a = User { id: 42, cache: "aaa".to_string() };
>     let b = User { id: 42, cache: "bbb".to_string() };
>     println!("Two Users with same id are equal: {}", a == b);
> }
> ```
>
> **Explanation:**
> The `Hash`/`Eq` contract is: **if `a == b`, then `hash(a) == hash(b)`**. This is not enforced by the compiler — breaking it is legal Rust but causes `HashMap` to silently fail lookups (because the bucket is found by hash, then confirmed by equality; if the hashes differ, the bucket is never even checked). The `cache` field is excluded from both traits here because it represents computed state, not identity — like how two `File` handles to the same path should be considered the same regardless of their read buffers.

---

## 6. Related Terms

- [`HashMap<K, V>`](../level_02/hashmap_k_v.md) — The primary consumer of this trait.
- [`PartialEq` / `Eq`](../level_04/partialeq_eq.md) — Must stay logically consistent with `Hash` on every type.
- [`Borrow` / `BorrowMut`](../level_14/borrow_trait.md) — Governs how `HashMap::get(&Q)` can look up a key by a borrowed type (e.g. looking up a `HashMap<String, _>` with a `&str`).
- [Derive Macro](../level_04/derive_macro.md) — The mechanism (`#[derive(Hash)]`) that implements this trait correctly in nearly all real code.

---

## 7. Key Takeaways

- `Hash` lets a type produce a numeric fingerprint, which is how `HashMap`/`HashSet` achieve O(1) average-case lookups.
- Any type used as a `HashMap` key or `HashSet` element **must** implement both `Hash` and `Eq`.
- The two traits have a **hard contract**: equal values (`Eq`) must produce equal hashes (`Hash`). Breaking this causes silent lookup failures, not compile errors.
- Always `#[derive(PartialEq, Eq, Hash)]` together on simple field-by-field types; only hand-write both if you have a specific reason, and keep them in sync.
