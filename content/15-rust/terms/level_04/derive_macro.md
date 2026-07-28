# Derive Macro

> **Level 4 — Error Handling & Generics**
> `#[derive(Debug, Clone)]` automatically generates common trait implementations for structs/enums.

---

## 1. Prerequisites

- [Macros](../level_01/macros.md) — The meta-programming tools that write code for you.
- [Structs](../level_02/struct.md) / [Enums](../level_02/enum.md) — The custom types you will be deriving traits for.
- [Trait](../level_04/trait.md) — The contracts being implemented.

---

## 2. Term Category

**Rust-specific (the boilerplate killer)**: In many languages, if you want to print a custom object or compare two custom objects for equality, you have to manually write the `toString()` or `equals()` methods by hand. In Rust, the compiler can automatically write these standard, mechanical methods for you using the Derive Macro.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Some traits in Rust are incredibly common and their implementations are entirely predictable. 

For example, if you want your custom struct to implement the `Debug` trait (so it can be printed to the terminal), the code is always exactly the same: *print the struct's name, then print each of its fields*. 

If you want your custom struct to implement the `Clone` trait, the code is always exactly the same: *make a new struct and copy every field one by one*.

Making developers manually type out these `impl` blocks for every single struct they create is a massive waste of time. To solve this, Rust provides the **`#[derive(...)]`** attribute. You place it above your struct, and it tells the compiler: *"Please generate the standard boilerplate code for these traits automatically."*

### (2) Reality Metaphor

Imagine you build a custom robot (your Struct) out of Lego blocks. 

Now, you need an instruction manual on how to duplicate the robot (the `Clone` trait). Instead of sitting down and writing the manual by hand, you slap a `#[derive]` sticker on the robot and send it to an automated factory. 

The factory scans the robot, identifies all the Lego blocks, and automatically prints a perfect instruction manual for you. You get the manual for free without doing any work.

### (3) Rust Code Examples

#### Short Snippet (The Magic Fix)
If you try to print a struct without the `Debug` trait, Rust will reject it. The fix takes exactly one line.

```rust
// 1. We place the derive macro directly above the struct definition.
#[derive(Debug)]
struct Player {
    name: String,
    score: i32,
}

fn main() {
    let p1 = Player {
        name: String::from("Alice"),
        score: 100,
    };
    
    // Because we derived Debug, we can now print the player using `{:?}`
    println!("Player data: {:?}", p1);
}
```

#### Fuller Example (Multiple Traits)
You can derive multiple traits at once by separating them with commas.

```rust
// We want to be able to Print (Debug), Copy (Clone), and Compare (PartialEq) our struct!
#[derive(Debug, Clone, PartialEq)]
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let point_a = Point { x: 5, y: 10 };
    
    // 1. Using Clone
    let point_b = point_a.clone(); 
    
    // 2. Using PartialEq (==)
    if point_a == point_b {
        println!("The points are identical!");
    }
    
    // 3. Using Debug
    println!("Point B: {:?}", point_b);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Derive Macro Scoping and Lifecycle Rules

**The mistake:** Assuming Derive Macro instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("derive_macro_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("derive_macro_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Derive Macro State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Derive Macro through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Derive Macro Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Derive Macro instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Detective

**Problem:** Look at the `main` function below. It is trying to do two things that require special traits. Add the correct `#[derive(...)]` line above the struct to make the code compile. 
*(Hint: You need to derive `PartialEq` for the `==` operator, and `Debug` for the `{:?}` formatter).*

```rust
// TODO: Add the derive macro here!
struct Config {
    port: u16,
    is_active: bool,
}

fn main() {
    let config1 = Config { port: 8080, is_active: true };
    let config2 = Config { port: 8080, is_active: true };

    if config1 == config2 {
        println!("Configs match: {:?}", config1);
    }
}
```

> [!check]- Answer
> ```rust
> #[derive(PartialEq, Debug)]
> struct Config {
>     port: u16,
>     is_active: bool,
> }
> ```

---

### Exercise 2: Standard Derive Macro Suite

**Problem:** Derive `Debug`, `Clone`, `PartialEq`, `Eq` on a struct `Point { x: i32, y: i32 }`.

**Expected output:**
> [!check]- Answer
> ```
> Points equal: true
> ```
> ```rust
> #[derive(Debug, Clone, PartialEq, Eq)]
> struct Point { x: i32, y: i32 }
> fn main() {
>     let p1 = Point { x: 1, y: 2 };
>     let p2 = p1.clone();
>     println!("Points equal: {}", p1 == p2);
> }
> ```
>
> **Explanation:** Derive macros generate boilerplate trait implementations automatically at compile time.

---

### Exercise 3: Deriving Ord for Automatic Struct Comparison

**Problem:** Derive `PartialOrd` and `Ord` on `Task { priority: u32 }` to sort tasks with `.sort()`.

**Expected output:**
> [!check]- Answer
> ```
> Sorted priority: 1, 5, 10
> ```
> ```rust
> #[derive(Debug, PartialEq, Eq, PartialOrd, Ord)]
> struct Task { priority: u32 }
> fn main() {
>     let mut tasks = vec![Task { priority: 10 }, Task { priority: 1 }, Task { priority: 5 }];
>     tasks.sort();
>     println!("Sorted priority: {}, {}, {}", tasks[0].priority, tasks[1].priority, tasks[2].priority);
> }
> ```
>
> **Explanation:** Deriving `Ord` compares struct fields sequentially in order of declaration.

---

## 6. Related Terms

- [`Debug` Trait](../level_04/debug_trait.md) — The most common trait you will ever derive (allows you to print objects to the console for debugging).
- [`Clone` Trait](../level_03/clone_trait.md) — Another incredibly common trait you will derive (allows you to duplicate data).

---

## 7. Key Takeaways

- `#[derive(TraitName)]` automatically generates the boilerplate code to implement `TraitName` for your custom struct or enum.
- You can derive multiple traits at once by separating them with commas (e.g., `#[derive(Debug, Clone)]`).
- It only works for standard, predictable traits (and some special third-party ones like `Serialize` from the `serde` crate).
- It only succeeds if **every inner field** of your struct also implements the trait you are trying to derive.
