# `HashMap<K, V>`

> **Level 2 — Control Flow & Data Structures**
> A hash map collection for key-value storage.

---

## 1. Prerequisites

- [`Vec<T>`](../level_02/vec_t.md) — The default collection for lists of items, indexed by numbers.
- [`Option<T>`](../level_02/option_t.md) — Used heavily when trying to safely read data out of a HashMap.

---

## 2. Term Category

**Rust-nonspecific**: A standard dictionary or map structure found in almost all programming languages. It is known as a `dict` in Python, `HashMap` in Java, `Object` or `Map` in JavaScript, and `std::unordered_map` in C++.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

A [`Vec<T>`](../level_02/vec_t.md) is fantastic for storing lists of data. However, if you have a Vector of 1,000,000 users and you want to find the user named "Alice", you have to check every single user one by one until you find her. This is extremely slow.

A `HashMap<K, V>` stores data in **Key-Value pairs** (e.g., Key: `"Alice"`, Value: `User_Data`). When you insert data, the computer runs the Key through a mathematical "hashing algorithm". This algorithm determines exactly where in memory the Value will be stored. Later, when you ask the HashMap for "Alice", it runs the name through the algorithm again, giving it the exact memory address instantly. This allows you to look up a Value instantly, regardless of whether the Map contains 10 items or 10 million items.

### (2) Reality Metaphor

A Vector is like a **stack of physical files** on a messy desk. To find "Alice's" file, you have to read the name on every single file from top to bottom until you finally find it.

A HashMap is like a **magical filing cabinet clerk**. You walk up to the desk and simply say, "Give me Alice's file." The clerk's brain instantly translates the name "Alice" into "Drawer 4, Folder 12", opens the drawer, and hands it to you immediately.

### (3) Rust Code Examples

#### Short Snippet (Import and Insert)
Unlike `Vec` and `Option`, HashMaps are not used quite as frequently, so Rust does not import them automatically. You must bring them into scope manually!
```rust
// 1. You MUST import HashMap from the standard library's collections module!
use std::collections::HashMap;

fn main() {
    // 2. Create the HashMap
    let mut scores = HashMap::new();

    // 3. Insert Key-Value pairs
    scores.insert(String::from("Blue Team"), 10);
    scores.insert(String::from("Red Team"), 50);
}
```

#### Fuller Example (Safe Retrieval)
```rust
use std::collections::HashMap;

fn main() {
    let mut book_reviews = HashMap::new();
    book_reviews.insert(String::from("Dune"), 5);
    book_reviews.insert(String::from("Twilight"), 2);

    let target_book = String::from("Dune");

    // How do we read data? Use `.get()`!
    // IMPORTANT: `.get()` requires a REFERENCE to the key (`&target_book`), not the key itself.
    // It returns an `Option<&V>` because the book might not exist in the map!
    match book_reviews.get(&target_book) {
        Some(rating) => println!("{} has a rating of {}/5", target_book, rating),
        None => println!("We haven't reviewed {} yet.", target_book),
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Hashmap K V Scoping and Lifecycle Rules

**The mistake:** Assuming Hashmap K V instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("hashmap_k_v_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("hashmap_k_v_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Hashmap K V State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Hashmap K V through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Hashmap K V Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Hashmap K V instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Scoreboard

**Problem:** Import `HashMap`, create a new map called `scoreboard`, and insert `"Player 1"` with a score of `100`. Then, try to safely retrieve the score of `"Player 2"` and print "Player not found" if they don't exist.

```rust
// TODO: Import HashMap here

fn main() {
    // TODO: Create a mutable HashMap called `scoreboard`
    
    // TODO: Insert "Player 1" with a score of 100
    
    let target = String::from("Player 2");
    
    // TODO: Use `.get(&target)` and a `match` statement to safely handle the result
}
```

**Expected output:**
```text
Player not found
```

> [!check]- Answer
> ```rust
> use std::collections::HashMap;
>
> fn main() {
>     let mut scoreboard = HashMap::new();
>     scoreboard.insert(String::from("Player 1"), 100);
>     
>     let target = String::from("Player 2");
>     
>     match scoreboard.get(&target) {
>         Some(score) => println!("Score: {}", score),
>         None => println!("Player not found"),
>     }
> }
> ```

---

### Exercise 2: HashMap Entry Insertion & Access

**Problem:** Create a `HashMap<String, u32>` for inventory items. Insert `"apples"` -> 50, `"bananas"` -> 30. Retrieve and print `"apples"`.

**Expected output:**
```
Apples: 50
```

> [!check]- Answer
> ```rust
> use std::collections::HashMap;
> fn main() {
>     let mut inventory = HashMap::new();
>     inventory.insert("apples".to_string(), 50);
>     inventory.insert("bananas".to_string(), 30);
>     println!("Apples: {}", inventory.get("apples").unwrap());
> }
> ```
>
> **Explanation:** `HashMap::get` takes a reference to the key `&K` and returns `Option<&V>`.

### Exercise 3: HashMap Iteration by Value

**Problem:** Iterate over a `HashMap<&str, i32>` and calculate the sum of all values.

**Expected output:**
```
Total sum: 60
```

> [!check]- Answer
> ```rust
> use std::collections::HashMap;
> fn main() {
>     let map = HashMap::from([("a", 10), ("b", 20), ("c", 30)]);
>     let total: i32 = map.values().sum();
>     println!("Total sum: {}", total);
> }
> ```
>
> **Explanation:** `.values()` returns an iterator yielding references to map values directly.

---

## 6. Related Terms

- [`Vec<T>`](../level_02/vec_t.md) — The standard collection for ordered lists, where items are looked up by a numerical index rather than a Key.
- [`Option<T>`](../level_02/option_t.md) — The type returned by `HashMap::get()`, ensuring you safely handle the scenario where the Key doesn't exist.

---

## 7. Key Takeaways

- `HashMap<K, V>` stores data in **Key-Value pairs**.
- It allows for near-instant data lookup by Key, regardless of how large the map gets.
- You must manually import it at the top of your file using `use std::collections::HashMap;`.
- Use `.insert(key, value)` to add data.
- Use `.get(&key)` to retrieve data. It requires a reference to the key, and it safely returns an `Option<&V>` in case the key is missing.
