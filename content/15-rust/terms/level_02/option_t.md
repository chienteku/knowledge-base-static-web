# `Option<T>`

> **Level 2 — Control Flow & Data Structures**
> An enum (`Some(T)` / `None`) replacing null; forces explicit handling of absent values.

---

## 1. Prerequisites

- [Enum](../level_02/enum.md) — `Option` is just a standard Enum built into the Rust standard library!
- [`match`](../level_02/match.md) — The safest way to handle both variants of an `Option`.
- [`if let`](../level_02/if_let_while_let.md) — The cleanest way to handle an `Option` when you only care about the `Some` variant.

---

## 2. Term Category

**Rust-specific (the safety)**: Rust completely removes the concept of `null` from the language. Instead, it uses the `Option<T>` enum to safely model the concept of a value being absent or missing, entirely preventing "Null Pointer Exceptions".

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The inventor of `null` (Tony Hoare) famously calls it his "billion-dollar mistake." In languages like Java, C++, or JavaScript, `null` is a sneaky value that almost any object can secretly be. If you write code expecting a user's name, but you receive `null` and try to call `.toUpperCase()` on it, your entire program instantly crashes at runtime. 

Rust bans `null` completely. Instead, Rust represents the *possibility* of absence using a built-in Enum called `Option<T>`. It has exactly two variants:
1. `Some(value)` — The data exists, and it's inside here.
2. `None` — The data is missing (the safe equivalent of null).

Because it is an Enum, the Rust compiler **forces you to handle the `None` case** before it lets you touch the data inside `Some`. You literally cannot forget to check for "null" in Rust. The compiler will catch the mistake and refuse to build the program. 

### (2) Reality Metaphor

Imagine receiving a wrapped gift box.

In a language with `null`, you arrogantly assume there's a gift inside and reach in blindfolded. If the box happens to be empty (`null`), a booby trap snaps on your hand and you die (the program crashes).

In Rust, the `Option` type forces you to take off your blindfold and safely look inside the box first (using `match`). If the box is empty (`None`), you sigh and move on safely. If there is a gift inside (`Some`), you extract it and use it safely.

### (3) Rust Code Examples

#### Short Snippet (The Definition)
You don't need to define `Option` yourself; it's already in the language. But if you did, it would look like this:
```rust
enum Option<T> {
    None,
    Some(T),
}
```

Because it's so common, Rust automatically imports the `Some` and `None` variants for you.
```rust
let present: Option<i32> = Some(5);
let absent: Option<i32> = None;
```

#### Fuller Example (Safe Extraction)
```rust
fn main() {
    let middle_name = Some(String::from("Danger"));
    
    // Attempting to do `middle_name.len()` right now will fail to compile!
    // We must extract it first using pattern matching.

    // Method 1: Using `match` (handles both cases)
    match middle_name {
        Some(name) => println!("Middle name is {} letters long.", name.len()),
        None => println!("No middle name provided."),
    }

    // Method 2: Using `if let` (handles only the Some case)
    let lucky_number = Some(7);
    if let Some(num) = lucky_number {
        println!("My lucky number is {}", num);
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Option T Scoping and Lifecycle Rules

**The mistake:** Assuming Option T instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("option_t_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("option_t_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Option T State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Option T through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Option T Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Option T instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Open the Box

**Problem:** The code below attempts to print a user's age, but the variable is an `Option<u32>`. Use a `match` statement to safely extract the age. If the age is `None`, print "Age unknown".

```rust
fn main() {
    let user_age: Option<u32> = Some(28);
    
    // TODO: Write a `match` statement here to handle `user_age`
}
```

**Expected output:**
> [!check]- Answer
> ```text
> Age: 28
> ```
> ```rust
> match user_age {
>     Some(age) => println!("Age: {}", age),
>     None => println!("Age unknown"),
> }
> ```

---

### Exercise 2: Transforming Options with `.map()`

**Problem:** Transform `Some(5)` to `Some(10)` using `.map(|x| x * 2)` on `Option<i32>`.

**Expected output:**
> [!check]- Answer
> ```
> Some(10)
> ```
> ```rust
> fn main() {
>     let opt = Some(5);
>     let doubled = opt.map(|x| x * 2);
>     println!("{:?}", doubled);
> }
> ```
>
> **Explanation:** `Option::map` transforms `Some(v)` values while passing `None` through untouched.

---

### Exercise 3: Chaining Options with `.and_then()`

**Problem:** Chain two option-returning functions using `.and_then()`: `parse_num("10").and_then(check_even)`.

**Expected output:**
> [!check]- Answer
> ```
> Some(10)
> ```
> ```rust
> fn check_even(n: i32) -> Option<i32> { if n % 2 == 0 { Some(n) } else { None } }
> fn main() {
>     let opt: Option<i32> = Some(10);
>     let res = opt.and_then(check_even);
>     println!("{:?}", res);
> }
> ```
>
> **Explanation:** `.and_then()` flattens nested `Option<Option<T>>` returns produced by monadic operations.

---

## 6. Related Terms

- [`Result<T, E>`](../level_02/result_t_e.md) — The other famous built-in enum, used for error handling (Success vs Failure) rather than missing values (Present vs Absent).
- [`unwrap()` / `expect()`](../level_04/unwrap_expect.md) — Methods used to aggressively extract the value from an `Option`, intentionally crashing the program if it is `None`.

---

## 7. Key Takeaways

- Rust does not have `null`. It uses the `Option<T>` enum to represent the concept of absence.
- The two variants are `Some(value)` (data is present) and `None` (data is missing).
- The compiler forces you to handle the `None` possibility, making "null pointer exceptions" impossible in safe Rust code.
- You must "open the box" using `match` or `if let` to safely extract and use the data hidden inside `Some`.
