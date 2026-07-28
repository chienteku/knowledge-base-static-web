# `Display` Trait

> **Level 4 — Error Handling & Generics**
> A trait allowing types to be formatted using `{}` (user-facing output) — cannot be derived.

---

## 1. Prerequisites

- [Trait](../level_04/trait.md) — The contract being manually implemented.
- [`println!` / `format!`](../level_01/println_format.md) — The macros that consume this trait.
- [`Debug` Trait](../level_04/debug_trait.md) — The developer-facing counterpart.

---

## 2. Term Category

**Rust-specific (the marketing brochure)**: While `Debug` shows the raw, ugly technical truth of a data structure, `Display` is the trait used to format data exactly how you want a non-programmer (or an end-user) to see it. It is the trait that powers the standard `{}` print syntax.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Imagine you have a `Money` struct containing an `amount` field and a `currency` field. 

If you use `Debug`, it prints: `Money { amount: 100, currency: "USD" }`. 
An end-user looking at a shopping cart receipt doesn't want to see that! They want to see **`$100.00`**. 

Rust designed the `Display` trait so you can manually write the code that transforms your struct into that beautiful, business-logic-specific string. 

Because "beauty" and "business logic" are highly subjective, the compiler has absolutely no idea how you want your struct to look. Do you want `$100`, or `100 USD`, or `100.00$`? Because the compiler cannot guess your business logic, **`Display` can NEVER be derived.** You must always write it manually.

### (2) Reality Metaphor

If `Debug` is the technical serial-number sticker on the back of a flat-screen TV, **`Display` is the glossy marketing brochure** handed to the customer in the store. 

An automated factory (the `#[derive]` macro) can print the serial number sticker automatically because it's purely mechanical: just list the parts. But an automated factory cannot write a compelling, human-readable marketing brochure. A human being has to sit down and write that brochure manually.

### (3) Rust Code Examples

#### Short Snippet (Writing the Brochure)
Notice that the signature for implementing `Display` is exactly the same as implementing `Debug`. You use `write!` to push your formatted string into the provided Formatter.

```rust
use std::fmt;

struct Money {
    amount: u32,
    currency: String,
}

// We MUST write this manually. No macros allowed!
impl fmt::Display for Money {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        // We decide exactly how it looks to the end-user!
        write!(f, "{} {}", self.amount, self.currency)
    }
}

fn main() {
    let price = Money { amount: 250, currency: String::from("EUR") };
    
    // We use `{}` for Display, not `{:?}`!
    println!("The total cost is {}", price); 
    // Output: The total cost is 250 EUR
}
```

#### Fuller Example (The Magic of `.to_string()`)
Implementing `Display` gives you an incredible hidden superpower. The moment you implement `Display` for a struct, the Rust compiler secretly implements the `.to_string()` method for that struct for free!

```rust
use std::fmt;

struct User {
    first_name: String,
    last_name: String,
}

impl fmt::Display for User {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{} {}", self.first_name, self.last_name)
    }
}

fn main() {
    let my_user = User { 
        first_name: String::from("John"), 
        last_name: String::from("Doe") 
    };
    
    // MAGIC! Because we wrote Display, we instantly get `.to_string()` for free!
    let full_name: String = my_user.to_string();
    
    println!("Saved string: {}", full_name); // Prints: Saved string: John Doe
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Display Trait Scoping and Lifecycle Rules

**The mistake:** Assuming Display Trait instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("display_trait_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("display_trait_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Display Trait State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Display Trait through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Display Trait Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Display Trait instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Format the Coordinates

**Problem:** You are building a mapping application. Implement the `Display` trait for the `Point` struct so that it prints beautifully as `(x, y)`.

```rust
use std::fmt;

struct Point {
    x: i32,
    y: i32,
}

// TODO: Implement fmt::Display for Point

fn main() {
    let p = Point { x: 5, y: -10 };
    // Uncomment when finished:
    // println!("The enemy is located at {}", p);
    // Expected output: The enemy is located at (5, -10)
}
```

> [!check]- Answer
> ```rust
> impl fmt::Display for Point {
>     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
>         write!(f, "({}, {})", self.x, self.y)
>     }
> }
> ```

---

### Exercise 2: Custom Vector Display Formatting

**Problem:** Implement `Display` for `struct Point(i32, i32)` formatting output as `"(x, y)"`.

**Expected output:**
> [!check]- Answer
> ```
> (10, 20)
> ```
> ```rust
> use std::fmt;
> struct Point(i32, i32);
> impl fmt::Display for Point {
>     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
>         write!(f, "({}, {})", self.0, self.1)
>     }
> }
> fn main() {
>     let p = Point(10, 20);
>     println!("{}", p);
> }
> ```
>
> **Explanation:** Implementing `Display` defines user-facing text formatting via `{}` specifiers.

---

### Exercise 3: Formatting Custom Currency Values

**Problem:** Implement `Display` for `struct Money(u32)` printing dollars as `"$10.00"`.

**Expected output:**
> [!check]- Answer
> ```
> $10.00
> ```

> use std::fmt;
> struct Money(u32);
> impl fmt::Display for Money {
>     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
>         write!(f, "${}.00", self.0)
>     }
> }
> fn main() {
>     let m = Money(10);
>     println!("{}", m);
> }
> ```
>
> **Explanation:** `write!` macro streams formatted output into the formatter buffer.

---

## 6. Related Terms

- [`Debug` Trait](../level_04/debug_trait.md) — The developer-facing counterpart to `Display`.
- [`String` vs `&str`](../level_01/string_vs_&str.md) — The type you magically get for free (via the `.to_string()` method) the moment you implement the `Display` trait.

---

## 7. Key Takeaways

- `Display` is for formatting data beautifully for **end-users**.
- It is triggered by using the standard `{}` placeholder in print macros.
- You **cannot** derive `Display`. You must always write the implementation manually because the compiler cannot guess your subjective formatting logic.
- Once you implement `Display`, your struct automatically gets a `.to_string()` method for free! (This happens because Rust's standard library has a blanket implementation: *if something can be displayed to a screen, it can be converted to a String*).
