# Module

> **Level 1 — Foundations**
> A namespace mechanism (`mod`) for organizing code within a crate.

---

## 1. Prerequisites

- [Crate](../level_01/crate.md) — A compilation unit in Rust; either a binary (executable) or a library.

---

## 2. Term Category

**Rust-specific**

While many languages have modules, Rust’s explicit module system (`mod`), file mapping rules, and strict privacy boundaries are uniquely designed to tame large codebases.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

As a Rust designer, when we started building larger programs, we quickly realized that throwing all our code into a single `main.rs` or `lib.rs` file was a disaster. Naming collisions became frequent, finding specific logic was like searching for a needle in a haystack, and everything was public by default, leading to tangled, unmaintainable code.

We needed a way to partition code, group related items together, and establish strict boundaries. While some languages implicitly treat every file as a module, we wanted something more explicit. We designed the `mod` keyword to let developers explicitly declare the module tree, independent of the file system (though they often align). This explicit declaration allows you to define a clear API, hide implementation details using Rust's privacy rules (everything is private by default), and prevent sprawling spaghetti code within a crate.

### (2) Reality Metaphor

Think of a **Crate** as a large office building. If a crate had no modules, it would be a giant, open-plan warehouse where every employee (function, struct) is shouting over each other, and anyone can grab the CEO's private documents. 

A **Module** is like a department or a specific room within that building (e.g., HR, Engineering, Sales). By putting employees in specific rooms, you organize them logically. You can also put locks on the doors (privacy) so that only authorized people can enter, while providing a reception desk (`pub` functions) for public interactions.

### (3) Rust Code Examples

#### Short Snippet

```rust
// Declaring a module named `math`
mod math {
    // This function is public and can be used outside the module
    pub fn add(a: i32, b: i32) -> i32 {
        a + b
    }

    // This function is private by default, only usable within `math`
    fn subtract(a: i32, b: i32) -> i32 {
        a - b
    }
}

fn main() {
    // Accessing the public function using the path `math::add`
    let sum = math::add(5, 10);
    println!("Sum: {sum}");
}
```

#### Fuller Example

```rust
// A real-world scenario of organizing a game's logic
mod game {
    // A nested module for player-related logic
    pub mod player {
        pub struct Player {
            pub name: String,
            health: u32, // Private field, cannot be modified directly from outside
        }

        impl Player {
            // Public constructor
            pub fn new(name: &str) -> Self {
                Self {
                    name: name.to_string(),
                    health: 100,
                }
            }

            pub fn take_damage(&mut self, amount: u32) {
                self.health = self.health.saturating_sub(amount);
                println!("{} took {} damage. Health: {}", self.name, amount, self.health);
            }
        }
    }

    // Another nested module
    pub mod enemies {
        // Can access other modules using absolute paths
        pub fn spawn_goblin() {
            println!("A wild goblin appears!");
        }
    }
}

fn main() {
    // Using items from our module tree
    game::enemies::spawn_goblin();

    // Creating a player using the public API
    let mut hero = game::player::Player::new("Arthur");
    hero.take_damage(20);
    
    // error[E0616]: field `health` of struct `Player` is private
    // hero.health = 10000; 
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to make items public (`pub`)

**The mistake:** Rust items (functions, structs, fields) are private by default. Beginners often create a module and try to use its contents, resulting in a compiler error.

**Why it's wrong:** Modules act as privacy boundaries. If you want an item to be accessible from outside the module, you must explicitly mark it with the `pub` keyword.

*Incorrect:*
```rust
mod utils {
    fn helper() {
        println!("Helping!");
    }
}

fn main() {
    utils::helper(); // ERROR: function `helper` is private
}
```

*Fix:* Mark items you want to expose with `pub`:
```rust
mod utils {
    pub fn helper() {
        println!("Helping!");
    }
}

fn main() {
    utils::helper(); // Works!
}
```

### Mistake 2: Confusing `mod` (declaration) with `use` (import)

**The mistake:** Developers coming from other languages often think `mod my_file;` is how you import code to use it. 

**Why it's wrong:** `mod` *declares* the existence of a module and tells the compiler to compile it as part of the module tree. You only write `mod some_file;` once per file. `use` brings an already-declared item into your current scope.

*Incorrect:*
```rust
// Assuming a file `math.rs` exists
// Trying to "import" it inside a function or nested module
fn calculate() {
    mod math; // ERROR or unexpected behavior: tries to look for `math/math.rs` or `calculate/math.rs`
}
```

*Fix:*
```rust
// Declare the module at the root of your crate (e.g., in main.rs or lib.rs)
mod math;

fn calculate() {
    // Bring the item into scope using `use`
    use math::add;
    // let result = add(2, 2);
}
```

---

### Mistake 3: Concurrent Access to Module Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Module instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Fix the Privacy Boundaries

**Problem:** Fix the code so it compiles and prints the correct output. Do not change `main`.

```rust
mod company {
    mod employees {
        struct Employee {
            name: String,
        }

        impl Employee {
            fn new(name: &str) -> Employee {
                Employee { name: name.to_string() }
            }
        }
    }
}

fn main() {
    let emp = company::employees::Employee::new("Alice");
    println!("Hired: {}", emp.name);
}
```

**Expected output:**
```text
Hired: Alice
```

> [!check]- Answer
> - You need to add the `pub` keyword in multiple places: the `employees` module, the `Employee` struct, the `name` field, and the `new` function.

### Exercise 2: Splitting into Modules

**Problem:** Create a module named `network` containing a nested module named `server`. Inside `server`, create a public function `connect` that prints "Connected to server!". Call this function from `main`.

**Expected output:**
```text
Connected to server!
```

> [!check]- Answer
> - Use `mod network { pub mod server { ... } }` and call it via `network::server::connect()`.

---

### Exercise 3: Re-exporting Submodule Items

**Problem:** Create a module layout where `mod internal { pub fn core_logic() {} }` is re-exported at module level using `pub use internal::core_logic;`.

**Expected output:**
```
Core logic executed
```

> [!check]- Answer
> ```rust
> mod api {
>     mod internal {
>         pub fn core_logic() {
>             println!("Core logic executed");
>         }
>     }
>     pub use internal::core_logic;
> }
> fn main() {
>     api::core_logic();
> }
> ```
>
> **Explanation:** `pub use` brings nested items into public API scope, hiding internal module hierarchy.

---

## 6. Related Terms

- [Crate](../level_01/crate.md) — Modules are the internal organizational units within a single crate
- [Cargo](../level_01/cargo.md) — The tool that compiles your crate and its modules
- [Package](../level_01/package.md) — The top-level structure that contains crates (which in turn contain modules)

---

## 7. Key Takeaways

- **Explicit Declarations**: You must explicitly declare a module with `mod module_name;` or `mod module_name { ... }` for it to be part of the crate.
- **Private by Default**: Everything in a module is private by default. Use `pub` to make functions, structs, or inner modules accessible from the outside.
- **Privacy Boundaries**: A module serves as a privacy boundary, allowing you to hide implementation details and expose a clean API.
- **Tree Structure**: Modules form a tree structure starting from the crate root (`main.rs` or `lib.rs`).
