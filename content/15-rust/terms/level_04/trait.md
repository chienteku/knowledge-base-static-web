# Trait

> **Level 4 — Error Handling & Generics**
> A collection of methods that types can implement; Rust's core abstraction mechanism (like interfaces).

---

## 1. Prerequisites

- [Structs](../level_02/struct.md) — The data types that will implement the traits.
- [`impl` Block](../level_02/impl_block.md) — The syntax used to attach methods to a type.

---

## 2. Term Category

**Rust-specific (the interface definition)**: In object-oriented languages like Java or C#, you use "Interfaces" or "Abstract Base Classes" to define shared behavior. Rust does not have classes or inheritance. Instead, it relies entirely on **Traits** to define what a type *can do*.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Imagine you have a `Car` struct and an `Airplane` struct. Both of them have the ability to `move_forward()`. 

You want to write a generic function that accepts *anything* that can move forward. In traditional Object-Oriented Programming (OOP), you would make them both inherit from a `Vehicle` base class. Rust completely rejects class inheritance because it often leads to bloated, fragile, and tightly-coupled hierarchies (the "Gorilla Banana" problem).

Instead, Rust uses **Traits**. A Trait is simply a contract. It says: *"I don't care what your data looks like, or where you came from. If you want to claim you have this Trait, you **must** provide the code for these specific methods."* 

By using Traits, unrelated types can share a common interface without needing a shared parent class.

### (2) Reality Metaphor

Imagine you are hiring someone to translate a document into French. 

You don't care if the applicant is a human, a robot, or an alien (the **Struct**). You don't care who their parents are or what family tree they belong to (**Inheritance**). You only care about one single thing: Do they possess the ability to speak French? 

A Trait is exactly that: a certificate of ability (`trait SpeaksFrench`). If an object implements that trait, it holds the certificate, and you can mathematically trust it to translate your document.

### (3) Rust Code Examples

#### Short Snippet (Defining and Implementing)
Here is how you define a contract (the Trait), and how you sign the contract (the `impl`).

```rust
// 1. Define the Trait (The Contract)
trait Summary {
    // We only provide the signature, not the body!
    fn summarize(&self) -> String; 
}

struct NewsArticle {
    headline: String,
    author: String,
}

// 2. Implement the Trait for our specific type
impl Summary for NewsArticle {
    // We MUST provide the exact method defined in the trait
    fn summarize(&self) -> String {
        format!("{} by {}", self.headline, self.author)
    }
}

fn main() {
    let article = NewsArticle {
        headline: String::from("Rust wins again"),
        author: String::from("Alice"),
    };
    
    // We can now call the trait method!
    println!("{}", article.summarize());
}
```

#### Fuller Example (Default Implementations)
Sometimes, a trait has a method where the behavior is usually exactly the same for 90% of types. You can provide a **default implementation** inside the trait itself, so the struct doesn't have to write it!

```rust
trait Greeter {
    // The trait provides the actual code!
    fn say_hello(&self) {
        println!("Hello there!");
    }
}

struct FriendlyRobot;
struct GrumpyCat;

// The robot gets the default behavior for free. We just write an empty block.
impl Greeter for FriendlyRobot {}

// The cat wants to OVERRIDE the default behavior with its own.
impl Greeter for GrumpyCat {
    fn say_hello(&self) {
        println!("Go away.");
    }
}

fn main() {
    let r2d2 = FriendlyRobot;
    let garfield = GrumpyCat;
    
    r2d2.say_hello();   // Prints: Hello there!
    garfield.say_hello(); // Prints: Go away.
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Trait Scoping and Lifecycle Rules

**The mistake:** Assuming Trait instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("trait_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("trait_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Trait State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Trait through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Trait Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Trait instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Sign the Contract

**Problem:** Define a `Bark` trait with a `bark(&self)` method. Then, define a `Dog` struct and implement the `Bark` trait for it.

```rust
// TODO: Define the `Bark` trait

struct Dog {
    name: String,
}

// TODO: Implement `Bark` for `Dog`. Have it print "Woof! I am [name]"

fn main() {
    let fido = Dog { name: String::from("Fido") };
    // fido.bark();
}
```

> [!check]- Answer
> ```rust
> trait Bark {
>     fn bark(&self);
> }
>
> impl Bark for Dog {
>     fn bark(&self) {
>         println!("Woof! I am {}", self.name);
>     }
> }
> ```

---

### Exercise 2: Defining Traits with Default Methods

**Problem:** Define `trait Greet { fn name(&self) -> &str; fn hello(&self) { println!("Hello {}", self.name()); } }`.

**Expected output:**
```
Hello Alice
```

> [!check]- Answer
> ```rust
> trait Greet {
>     fn name(&self) -> &str;
>     fn hello(&self) {
>         println!("Hello {}", self.name());
>     }
> }
> struct User;
> impl Greet for User { fn name(&self) -> &str { "Alice" } }
> fn main() {
>     let u = User;
>     u.hello();
> }
> ```
>
> **Explanation:** Trait default methods provide fallback behavior built on required abstract method calls.

### Exercise 3: Supertraits Dependency Contract

**Problem:** Define `trait Person: std::fmt::Display` requiring implementors to implement `Display` first.

**Expected output:**
```
Person displayed: Bob
```

> [!check]- Answer
> use std::fmt;
> trait Person: fmt::Display {}
> struct Man(&'static str);
> impl fmt::Display for Man { fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result { write!(f, "{}", self.0) } }
> impl Person for Man {}
> fn main() {
>     let m = Man("Bob");
>     println!("Person displayed: {}", m);
> }
> ```
>
> **Explanation:** Supertrait bounds (`trait Sub: Super`) mandate that implementing types must satisfy supertraits.

---

## 6. Related Terms

- [Trait Bound](../level_04/trait_bound.md) — How we actually force a generic `<T>` to implement a specific Trait (e.g., `<T: Summary>`).
- [Generics (`<T>`)](../level_04/generics.md) — What we use Traits to constrain.
- [`impl Trait`](../level_04/impl_trait.md) — Syntactic sugar for accepting/returning types that implement a specific trait.

---

## 7. Key Takeaways

- Traits define shared behavior (methods) that multiple different types can implement.
- They are Rust's equivalent to "Interfaces" in languages like Java or C#.
- You implement a trait on a type using the `impl TraitName for TypeName` syntax.
- Traits can have default method implementations, which types can choose to keep or override.
- **The Orphan Rule** prevents you from implementing an external trait on an external type.
