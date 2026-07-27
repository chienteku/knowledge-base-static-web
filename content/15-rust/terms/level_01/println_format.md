# `println!` / `format!`

> **Level 1 — Foundations**
> Macros for formatted output and string formatting using `{}` placeholders.

---

## 1. Prerequisites

- [Variable](../level_01/variable.md) — The data you are trying to print or format.
- [String vs &str](../level_01/string_vs_&str.md) — `format!` specifically creates and returns a heap-allocated `String`.

---

## 2. Term Category

**Rust-specific**: While printing to the console is universal, Rust implements these tools as *macros* (denoted by the `!`) which uniquely parse and validate your formatting at compile-time to guarantee safety.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In older languages like C, formatting text is notoriously dangerous. If you tell C's `printf` function to print a string, but you accidentally pass it an integer, the program will likely crash at runtime.

Rust's designers wanted formatting to be 100% safe without sacrificing speed. To achieve this, `println!` and `format!` are not regular functions; they are **macros**. You can tell they are macros because they end with an exclamation mark (`!`). 

When you compile your code, these macros analyze your format string. They check that you have provided the exact right number of `{}` placeholders, and that the data types you provided can actually be turned into text. If anything is wrong, Rust refuses to compile the program. This guarantees you will never have a formatting crash at runtime.

- **`println!`** takes your formatted text and pushes it immediately to the terminal/console.
- **`format!`** takes your formatted text and returns it as a new, usable `String` variable in your code.

### (2) Reality Metaphor

Think of these macros like a **strict game of Mad Libs**. 

You hand the compiler a piece of paper with a sentence that has blanks in it (the `{}` placeholders), along with a list of words to fill in those blanks. Before the compiler ever publishes the book (compiles the program), it strictly verifies that:
1. There is exactly one word for every blank.
2. The word provided actually makes grammatical sense in that blank. 

If you provide three blanks but only two words, the compiler rips up the paper and makes you fix it before the book is published.

### (3) Rust Code Examples

#### Short Snippet
```rust
let name = "Alice";
let score = 100;

// println! prints directly to the console.
// You can put variables directly inside the braces.
println!("Player {name} has a score of {score}."); 
```

#### Fuller Example
```rust
fn main() {
    let item = "Sword";
    let damage = 50;
    
    // Older Rust style: providing variables after the string.
    // (This is still widely used and required for complex expressions).
    println!("You found a {} that does {} damage.", item, damage);
    
    // Modern Rust style: variables inline inside the braces.
    println!("You found a {item} that does {damage} damage.");
    
    // format! uses the exact same syntax, but instead of printing,
    // it saves the result as a new `String` variable.
    let inventory_text = format!("Inventory: 1x {item}");
    
    // We can then use that String later!
    println!("Status Check: {}", inventory_text);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the exclamation mark (`!`)

**The mistake:** Treating `println` like a normal function in Python or Java.

**Why it's wrong:** Rust requires the `!` to signal that this is a macro that needs to rewrite your code at compile-time. If you omit it, the compiler will look for a regular function named `println`, which doesn't exist.

*Incorrect:*
```rust
println("Hello world"); // ERROR: expected function, found macro `println`
```

*Fix:*
```rust
println!("Hello world");
```

### Mistake 2: Trying to print complex types with `{}`

**The mistake:** Using the standard `{}` placeholder to print an Array, Tuple, or custom Struct.

**Why it's wrong:** The `{}` placeholder asks the data to display itself in a pretty, user-facing way. Primitive types (like numbers and strings) know how to do this. But complex types (like arrays) do not have a default "pretty" format. You must use `{:?}` (Debug format) to tell Rust to print the raw, programmer-facing representation of the data.

*Incorrect:*
```rust
let numbers = [1, 2, 3];
println!("My numbers are {}", numbers); // ERROR: `[{integer}; 3]` doesn't implement `std::fmt::Display`
```

*Fix:*
```rust
let numbers = [1, 2, 3];
// Use `{:?}` to print arrays, tuples, or structs for debugging!
println!("My numbers are {:?}", numbers); 
```

---

### Mistake 3: Concurrent Access to Println Format Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Println Format instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Build the Greeting

**Problem:** Use the `format!` macro to combine the user's title and name into a single `String`, and then use `println!` to print a welcome message.

```rust
fn main() {
    let title = "Captain";
    let last_name = "Reynolds";
    
    // TODO: Use `format!` to create a String that says "Captain Reynolds"
    // let full_name = ...;
    
    // TODO: Use `println!` to print "Welcome aboard, Captain Reynolds!"
    // using the full_name variable you just created.
}
```

**Expected output:**
```text
Welcome aboard, Captain Reynolds!
```

> [!check]- Answer
> - `let full_name = format!("{} {}", title, last_name);` or `format!("{title} {last_name}");`
> - `println!("Welcome aboard, {}!", full_name);`

---

### Exercise 2: Positional and Named Format Arguments

**Problem:** Format and print a string using named parameters `{name}` and positional index `{0}` to display `"Alice (ID: 42) signed in as Alice"`.

**Expected output:**
```
Alice (ID: 42) signed in as Alice
```

> [!check]- Answer
> ```rust
> fn main() {
>     let name = "Alice";
>     let id = 42;
>     println!("{0} (ID: {id}) signed in as {0}", name, id = id);
> }
> ```
>
> **Explanation:** Rust format macros support positional index referencing (`{0}`) alongside explicit named bindings (`{id}`).

### Exercise 3: Floating-Point Precision & Alignment Formatting

**Problem:** Print float `3.1415926` right-aligned in a 10-character wide column rounded to 2 decimal places.

**Expected output:**
```
      3.14
```

> [!check]- Answer
> ```rust
> fn main() {
>     let val = 3.1415926;
>     println!("{:>10.2}", val);
> }
> ```
>
> **Explanation:** `{:>10.2}` specifies right alignment (`>`), total column width `10`, and precision `.2` decimal places.

---

## 6. Related Terms

- [String vs &str](../level_01/string_vs_&str.md) — The `format!` macro specifically returns a `String` (heap-allocated), not a `&str`.
- **[Declarative Macros (`macro_rules!`)](../level_12/declarative_macros.md)** — (Level 12 concept) The underlying pattern-matching feature that powers macros like `println!` and `format!`.

---

## 7. Key Takeaways

- `println!` and `format!` are **macros**, not functions. They must end with an exclamation mark (`!`).
- `println!` outputs text to the console.
- `format!` returns a brand new `String` that you can save to a variable.
- Both use `{}` placeholders to inject variables. You can put the variable name directly inside the braces (e.g., `{name}`).
- Use `{:?}` instead of `{}` if you need to print a complex type like an Array or Tuple for debugging purposes.
