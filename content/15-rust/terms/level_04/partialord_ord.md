# `PartialOrd` / `Ord`

> **Level 4 — Error Handling & Generics**
> Traits for ordering comparison (`<`, `>`, etc.).

---

## 1. Prerequisites

- [`PartialEq` / `Eq`](../level_04/partialeq_eq.md) — You can't see if one thing is greater than another if you don't even know how to check if they are equal!
- [Derive Macro](../level_04/derive_macro.md) — How you get these traits for free 99% of the time.
- [Expressions (`<`, `>`)](../level_01/expressions.md) — The operators that these traits unlock.

---

## 2. Term Category

**Rust-specific (the sorting engine)**: In the previous term, we learned how to check if two things are *equal*. Now, we learn how to check if one thing is *greater than* another. These traits power the `<`, `>`, `<=`, and `>=` operators, and they are the secret engine that allows the `.sort()` method to work on your custom data structures.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

If you have a `Vec` of custom `Player` structs, how does the compiler know how to sort them? By their alphabetical name? By their high score? Rust refuses to guess. It forces you to implement **`PartialOrd`** to define exactly how two objects compare to each other (Less, Greater, or Equal).

**So what is `Ord`?**
Just like the difference between `PartialEq` and `Eq`, there is a split because of floating-point numbers (`f32`, `f64`). 

Floating-point numbers have a special value called `NaN` (Not a Number). If you ask the CPU, *"Is 5.0 greater than NaN?"*, the answer is mathematically undefined. Because `NaN` cannot be strictly ordered, floating point numbers only implement `PartialOrd`, not `Ord`.

**`Ord`** is a strict guarantee to the compiler that *"My custom type has no undefined `NaN` edge cases. I can guarantee a perfect, Total Ordering for every single possible value."* **You MUST implement `Ord` if you want to use the `.sort()` method on a `Vec`!**

### (2) Reality Metaphor

Imagine `PartialOrd` is a judge trying to rank three boxers. Usually, the judge can say A beat B, and B beat C. But what if boxer C never showed up to the fight (`NaN`)? The judge cannot rank C against the others. The ranking is only *partially* valid. 

`Ord` is a guarantee to the tournament director: *"Everyone showed up, everyone fought, and I can give you a perfect 1-to-3 ranking list with absolutely zero exceptions."* You cannot sort a tournament leaderboard without that strict `Ord` guarantee.

### (3) Rust Code Examples

#### Short Snippet (The Free Implementation)
If you use `#[derive]`, Rust will compare your fields top-to-bottom. It checks the first field; if they are equal, it moves to the second field, just like sorting words in a dictionary!

```rust
// Notice that Ord requires PartialOrd, which requires Eq, which requires PartialEq!
#[derive(PartialEq, Eq, PartialOrd, Ord)]
struct Version {
    major: u32,
    minor: u32,
}

fn main() {
    let v1 = Version { major: 1, minor: 5 };
    let v2 = Version { major: 2, minor: 0 };
    
    // The < operator works magically!
    if v1 < v2 {
        println!("Please update your software.");
    }
}
```

#### Fuller Example (Manual Sorting Logic)
If you want to sort a list of `Player` structs strictly by their `score` (and ignore their alphabetical name), you have to write the implementation manually.

*(Note: In real code, implementing all 4 traits manually is quite tedious. People often use a helper method like `player.score.cmp(&other.score)` inside the `Ord` block to save time).*

```rust
use std::cmp::Ordering;

// We derive the Eq traits because we still want to use `==` normally
#[derive(PartialEq, Eq)]
struct Player {
    name: String,
    score: u32,
}

// 1. We manually implement Ord (the strict guarantee)
impl Ord for Player {
    fn cmp(&self, other: &Self) -> Ordering {
        // We tell Rust to ONLY look at the score field when sorting!
        self.score.cmp(&other.score)
    }
}

// 2. We also have to implement PartialOrd to satisfy the compiler
impl PartialOrd for Player {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

fn main() {
    let mut leaderboard = vec![
        Player { name: String::from("Zack"), score: 500 },
        Player { name: String::from("Alice"), score: 9000 },
    ];
    
    // Because we implemented Ord, we can use .sort()!
    // Zack goes first (500), Alice goes second (9000), ignoring alphabetical order!
    leaderboard.sort(); 
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Partialord Ord Scoping and Lifecycle Rules

**The mistake:** Assuming Partialord Ord instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("partialord_ord_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("partialord_ord_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Partialord Ord State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Partialord Ord through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Partialord Ord Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Partialord Ord instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Tallest Building

**Problem:** You want to use the `>` operator to find out which building is taller. Add the correct `#[derive(...)]` line so the `main` function compiles. *(Hint: You only need `PartialOrd` to use `>`, but `PartialOrd` mathematically requires `PartialEq`!)*

```rust
// TODO: Add the derive macro here!
struct Building {
    height: u32,
}

fn main() {
    let burj_khalifa = Building { height: 828 };
    let empire_state = Building { height: 381 };

    if burj_khalifa > empire_state {
        println!("The Burj Khalifa is taller!");
    }
}
```

> [!check]- Answer
> ```rust
> // PartialOrd is required for `>`, and PartialEq is required by PartialOrd!
> #[derive(PartialEq, PartialOrd)]
> struct Building {
>     height: u32,
> }
> ```

---

### Exercise 2: Custom Sorting with `Ord` Implementation

**Problem:** Implement `Ord` for `Person { name: String, age: u32 }` sorting primarily by `age` descending.

**Expected output:**
```
Oldest: 40
```

> [!check]- Answer
> ```rust
> use std::cmp::Ordering;
> #[derive(Eq, PartialEq)]
> struct Person { name: String, age: u32 }
> impl PartialOrd for Person {
>     fn partial_cmp(&self, other: &Self) -> Option<Ordering> { Some(self.cmp(other)) }
> }
> impl Ord for Person {
>     fn cmp(&self, other: &Self) -> Ordering {
>         other.age.cmp(&self.age) // Descending age
>     }
> }
> fn main() {
>     let mut people = vec![
>         Person { name: "A".into(), age: 20 },
>         Person { name: "B".into(), age: 40 },
>     ];
>     people.sort();
>     println!("Oldest: {}", people[0].age);
> }
> ```
>
> **Explanation:** Reversing `cmp` operands (`other.age.cmp(&self.age)`) implements descending sort order.

### Exercise 3: Float Ordering Fallbacks with `partial_cmp`

**Problem:** Sort a vector of floats `vec![3.14, 1.0, 2.5]` using `.sort_by(|a, b| a.partial_cmp(b).unwrap())`.

**Expected output:**
```
[1.0, 2.5, 3.14]
```

> [!check]- Answer
> fn main() {
>     let mut nums = vec![3.14, 1.0, 2.5];
>     nums.sort_by(|a, b| a.partial_cmp(b).unwrap());
>     println!("{:?}", nums);
> }
> ```
>
> **Explanation:** `partial_cmp` handles partial ordering returns (`Option<Ordering>`), accommodating non-comparable values like `NaN`.

---

## 6. Related Terms

- [`PartialEq` / `Eq`](../level_04/partialeq_eq.md) — The prerequisite traits that these ordering traits are built on top of.
- [Derive Macro](../level_04/derive_macro.md) — How you get `PartialOrd` and `Ord` for free 99% of the time.

---

## 7. Key Takeaways

- `PartialOrd` is the trait that powers the `<`, `>`, `<=`, and `>=` operators.
- `Ord` is a strict guarantee of "Total Ordering" (meaning the type has no undefined `NaN` values).
- You **MUST** implement `Ord` if you want to use the `.sort()` method on a `Vec` of your custom types.
- You can derive them automatically using `#[derive(PartialEq, Eq, PartialOrd, Ord)]`. The macro will evaluate the fields top-to-bottom (dictionary order).
- You must implement them manually if you want custom sorting logic (e.g., sorting users by high score instead of by username).
