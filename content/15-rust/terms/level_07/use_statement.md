# `use` Statement

> **Level 7 — Modules, Visibility & Project Structure**
> Brings items into scope to avoid fully qualified paths.

---

## 1. Prerequisites

- [`mod` Declaration](../level_07/mod_declaration.md) — The keyword that actually builds the module tree that `use` navigates.
- [`pub` Visibility](../level_07/pub_visibility.md) — The keyword that allows `use` to reach into other modules.

---

## 2. Term Category

**Rust-specific (the path shortcut)**: The `use` statement does exactly one thing: it creates a shortcut. 

It does not compile files. It does not download external libraries. It just takes a long, annoying path (like `std::collections::HashMap`) and creates a local shortcut so you only have to type `HashMap`.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

If you are building a complex project, your module tree gets very deep. You might have a function located at `crate::network::http::client::connect()`. 

If you have to type that massive string 20 times in a single file, your code becomes completely unreadable. The `use` statement allows you to declare `use crate::network::http::client::connect;` at the top of your file. Now, whenever you type `connect()`, the compiler automatically expands it to the full, correct path behind the scenes.

### (2) Reality Metaphor

Imagine you have a friend named "Jonathan Bartholomew Smith III". Every time you want to ask him a question, saying his full name is exhausting. 

So, you establish a shortcut rule: *"From now on, when I say 'Jon', I mean 'Jonathan Bartholomew Smith III'."* 

That is exactly what a `use` statement does. It establishes a local nickname for a long, fully qualified path so you can save yourself some breath (or typing).

### (3) Rust Code Examples

#### Short Snippet (The basic shortcut)
Here is how `use` cleans up messy, fully-qualified code.

```rust
// 1. WITHOUT `use` (Valid, but ugly)
fn main_ugly() {
    let mut map = std::collections::HashMap::new();
    map.insert("key", "value");
}

// 2. WITH `use` (Clean and idiomatic)
use std::collections::HashMap; // We create the shortcut!

fn main_clean() {
    // Now we just type `HashMap`
    let mut map = HashMap::new();
    map.insert("key", "value");
}
```

#### Fuller Example (Advanced Syntax)
Rust provides several syntactic tricks to make `use` statements even more concise.

```rust
// 1. GROUPING: Import multiple items from the same module using `{}`
use std::collections::{HashMap, HashSet, VecDeque};

// 2. NESTING: Import the module itself AND items inside it using `self`
use std::io::{self, Read, Write}; 
// Now we can use `io::Error`, `Read`, and `Write`.

// 3. RENAMING: Fix naming collisions using `as`
use std::fmt::Result as FmtResult;
use std::io::Result as IoResult;
// Now we can use both `Result` types in the same file without confusing them!

// 4. WILDCARD: Import absolutely everything in the module using `*`
// (Note: This is generally frowned upon because it pollutes your namespace)
use std::f32::consts::*; 
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Use Statement Scoping and Lifecycle Rules

**The mistake:** Assuming Use Statement instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("use_statement_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("use_statement_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Use Statement State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Use Statement through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Use Statement Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Use Statement instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Cleanup Crew

**Problem:** The following code compiles perfectly, but it is incredibly ugly. Add a `use` statement at the top of the code and rewrite the `main` function so it is clean and idiomatic.

```rust
fn main() {
    let duration = std::time::Duration::from_secs(5);
    let instant = std::time::Instant::now();
    
    println!("Waiting {:?} from {:?}", duration, instant);
}
```

> [!check]- Answer
> ```rust
> // Grouping both structs into a single `use` statement!
> use std::time::{Duration, Instant};
>
> fn main() {
>     let duration = Duration::from_secs(5);
>     let instant = Instant::now();
>     
>     println!("Waiting {:?} from {:?}", duration, instant);
> }
> ```

---

### Exercise 2: Aliasing Imports with `as`

**Problem:** Import `std::fmt::Result as FmtResult` and `std::io::Result as IoResult` to avoid naming conflicts.

**Expected output:**
> [!check]- Answer
> ```
> Import aliases resolved
> ```
> ```rust
> use std::fmt::Result as FmtResult;
> use std::io::Result as IoResult;
> fn main() {
>     println!("Import aliases resolved");
> }
> ```
>
> **Explanation:** `use path as Alias` resolves ambiguous import name collisions.

---

### Exercise 3: Nested Import Braces Grouping

**Problem:** Group imports from `std::collections` using nested braces: `use std::collections::{HashMap, HashSet};`.

**Expected output:**
> [!check]- Answer
> ```
> Nested imports loaded
> ```
> ```rust
> use std::collections::{HashMap, HashSet};
> fn main() {
>     let _m: HashMap<i32, i32> = HashMap::new();
>     let _s: HashSet<i32> = HashSet::new();
>     println!("Nested imports loaded");
> }
> ```
>
> **Explanation:** Nested braces `{}` condense multiple imports from the same parent module path.

---

## 6. Related Terms

- [`mod` Declaration](../level_07/mod_declaration.md) — The keyword that actually builds the module tree that `use` navigates.
- [Re-exporting (`pub use`)](../level_07/re_exporting.md) — A specialized version of `use` that takes your shortcut and exposes it to the public API.

---

## 7. Key Takeaways

- The `use` keyword just creates a local shortcut for a long module path. It does **not** link files or import external libraries.
- You can group imports using curly braces: `use std::collections::{HashMap, HashSet};`.
- You can rename imports on the fly using `as` to avoid naming collisions: `use std::io::Result as IoResult;`.
- The `*` wildcard imports everything in a module, but you should avoid it because it makes it hard to track where functions came from.
