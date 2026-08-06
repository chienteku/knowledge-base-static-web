# `use` Statement

> **Level 7 — Modules, Visibility & Project Structure**
> Brings items into scope to avoid fully qualified paths.

---

## 1. Prerequisites


- [`mod` Declaration](mod_declaration.md) — The keyword that actually builds the module tree that `use` navigates.
- [`pub` Visibility](pub_visibility.md) — The keyword that allows `use` to reach into other modules.

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

### Mistake 1: Expecting `use` Statements to Load/Compile Unlinked `.rs` Files

**The mistake:** Writing `use foo::bar;` expecting Rust to discover and compile `foo.rs` without declaring `mod foo;`.

**Why it is wrong:** `use` creates a local path shortcut to an item already present in the crate module tree. It does not register files for compilation. You must declare `mod foo;` once in the parent module to build the node in the tree first.

*Incorrect:*
```rust
use foo::bar; // ❌ Error E0432: unresolved import `foo` (missing `mod foo;`!)
```

*Fix:*
```rust
mod foo; // Declares the module node first!
use foo::bar; // Now brings bar into scope!
```

### Mistake 2: Overusing Glob Wildcard Imports (`use std::io::*`)

**The mistake:** Writing `use std::collections::*;` across multiple files in a project.

**Why it is wrong:** Glob imports pollute the local module scope, create symbol naming collisions, and obscure where types/functions originate. Prefer explicit or grouped imports (`use std::collections::{HashMap, HashSet};`).

### Mistake 3: Unhandled Ambiguity with Identically Named Imports

**The mistake:** Importing `use std::fmt::Result;` and `use std::io::Result;` in the same file.

**Why it is wrong:** Triggers compiler error `E0252: the name `Result` is defined multiple times`. Use alias renaming: `use std::fmt::Result as FmtResult;`.

---

## 5. Practice Exercises

### Exercise 1: The Cleanup Crew

**Scenario:** The following code compiles perfectly, but it is incredibly ugly. Add a `use` statement at the top of the code and rewrite the `main` function so it is clean and idiomatic.

```rust
fn main() {
    let duration = std::time::Duration::from_secs(5);
    let instant = std::time::Instant::now();
    
    println!("Waiting {:?} from {:?}", duration, instant);
}
```

> [!check]- Answer
>
> #### Implementation
>
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

**Scenario:** Import `std::fmt::Result as FmtResult` and `std::io::Result as IoResult` to avoid naming conflicts.

**Expected output:**
> [!check]- Answer
> ```
> Import aliases resolved
> ```
>
> #### Implementation
>
> ```rust
> use std::fmt::Result as FmtResult;
> use std::io::Result as IoResult;
> fn main() {
>     println!("Import aliases resolved");
> }
> ```
>
> #### Technical Explanation
> `use path as Alias` resolves ambiguous import name collisions.

---

### Exercise 3: Nested Import Braces Grouping

**Scenario:** Group imports from `std::collections` using nested braces: `use std::collections::{HashMap, HashSet};`.

**Expected output:**
> [!check]- Answer
> ```
> Nested imports loaded
> ```
>
> #### Implementation
>
> ```rust
> use std::collections::{HashMap, HashSet};
> fn main() {
>     let _m: HashMap<i32, i32> = HashMap::new();
>     let _s: HashSet<i32> = HashSet::new();
>     println!("Nested imports loaded");
> }
> ```
>
> #### Technical Explanation
> Nested braces `{}` condense multiple imports from the same parent module path.

---

## 6. Related Terms


- [`mod` Declaration](mod_declaration.md) — The keyword that actually builds the module tree that `use` navigates.
- [Re-exporting (`pub use`)](re_exporting.md) — A specialized version of `use` that takes your shortcut and exposes it to the public API.
- [Prelude](prelude.md) — Related concept: Prelude.

---

## 7. Key Takeaways

- The `use` keyword just creates a local shortcut for a long module path. It does **not** link files or import external libraries.
- You can group imports using curly braces: `use std::collections::{HashMap, HashSet};`.
- You can rename imports on the fly using `as` to avoid naming collisions: `use std::io::Result as IoResult;`.
- The `*` wildcard imports everything in a module, but you should avoid it because it makes it hard to track where functions came from.
