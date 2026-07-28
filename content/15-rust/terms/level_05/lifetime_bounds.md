# Lifetime Bounds

> **Level 5 — Lifetimes**
> Constraining generic types or trait objects with lifetime relationships: `T: 'a` or `dyn Trait + 'a`.

---

## 1. Prerequisites

- [Trait Bound](../level_04/trait_bound.md) — Constraining `<T>` with traits.
- [Lifetime (`'a`)](../level_05/lifetime.md) — Reference scope annotations.
- [Trait Objects (`dyn Trait`)](../level_04/trait_objects.md) — Dynamic dispatch objects requiring lifetime bounds.

---

## 2. Term Category

**Rust-specific (lifetime constraints on generics)**: Just as you can constrain a generic type to implement a trait (`T: Display`), you can also constrain a generic type or reference to outlive a specific lifetime (`T: 'a`). Lifetime Bounds are essential when building generic structures that hold references.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Suppose you write a generic struct or function that holds a generic type `T` inside a container associated with lifetime `'a`. 

If `T` is a reference like `&'b str`, what happens if `'b` is shorter than `'a`? The reference inside `T` could expire while the container is still alive, leading to a dangling pointer!

To prevent this, Rust allows **Lifetime Bounds**:
- **`T: 'a`** means *"Every reference inside type `T` must outlive lifetime `'a`."* (If `T` is an owned type with no references, it automatically outlives any `'a`).
- **`'b: 'a`** (read as "'b outlives 'a") means lifetime `'b` must be at least as long as lifetime `'a`.
- **`dyn Trait + 'a`** means the trait object cannot contain references that expire before `'a`.

### (2) Reality Metaphor

Imagine a cargo container (`'a`) shipping specialized electronic devices (`T`).

- If the container's voyage across the ocean takes 30 days (`'a`), the batteries inside the devices (`T`) must have a battery shelf life of *at least* 30 days (`T: 'a`). 
- If a device uses a cheap battery that dies after 5 days, the battery leaks and ruins the cargo before arrival.
- `T: 'a` guarantees the internal components won't expire before the container finishes its journey.

### (3) Rust Code Examples

#### Short Snippet (`T: 'a` Syntax)
```rust
// T must implement Display AND must not contain references shorter than 'a
struct RefContainer<'a, T: 'a> {
    reference: &'a T,
}
```

#### Fuller Example (`'b: 'a` Outlives Relation)
```rust
struct Context<'a>(&'a str);

// We state that lifetime 'b MUST outlive lifetime 'a ('b: 'a)
struct Parser<'a, 'b: 'a> {
    context: &'a Context<'b>,
}

fn parse<'a, 'b: 'a>(ctx: &'a Context<'b>) -> Parser<'a, 'b> {
    Parser { context: ctx }
}

fn main() {
    let text = String::from("sample text");
    let ctx = Context(&text);
    let _parser = parse(&ctx);
}
```

#### Trait Objects with Lifetime Bounds (`dyn Trait + 'a`)
By default, trait objects like `Box<dyn Trait>` implicitly carry a `'static` bound. If your trait object holds a reference with a shorter lifetime `'a`, you must annotate it explicitly:

```rust
trait Logger {
    fn log(&self);
}

struct ConsoleLogger<'a> {
    prefix: &'a str,
}

impl<'a> Logger for ConsoleLogger<'a> {
    fn log(&self) {
        println!("{}: message", self.prefix);
    }
}

// We specify `Box<dyn Logger + 'a>` so the Box can hold references with lifetime 'a
fn make_logger<'a>(prefix: &'a str) -> Box<dyn Logger + 'a> {
    Box::new(ConsoleLogger { prefix })
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Lifetime Bounds Scoping and Lifecycle Rules

**The mistake:** Assuming Lifetime Bounds instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("lifetime_bounds_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("lifetime_bounds_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Lifetime Bounds State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Lifetime Bounds through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Lifetime Bounds Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Lifetime Bounds instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Interpret the Bound

**What does `'a: 'b` mean in Rust?**

> [!check]- Answer
> `'a: 'b` is read as **"`'a` outlives `'b`"**. It means lifetime `'a` is greater than or equal to lifetime `'b`. Any reference valid for `'a` can be used wherever a reference valid for `'b` is expected.

---

### Exercise 2: Classifying `T: 'a` Lifetime Bounds

**Problem:** Write a struct `struct Container<'a, T: 'a> { data: &'a T }` ensuring `T` lives at least as long as `'a`.

**Expected output:**
> [!check]- Answer
> ```
> Container data: 100
> ```
> ```rust
> struct Container<'a, T: 'a> { data: &'a T }
> fn main() {
>     let val = 100;
>     let c = Container { data: &val };
>     println!("Container data: {}", c.data);
> }
> ```
>
> **Explanation:** `T: 'a` states that type `T` must be valid for at least lifetime `'a`.

---

### Exercise 3: Subtyping Outlives Bounds `'a: 'b`

**Problem:** Write `fn tie<'a, 'b: 'a>(x: &'a str, y: &'b str)` where `'b` outlives `'a`.

**Expected output:**
> [!check]- Answer
> ```
> Lifetime subtype verified
> ```
> ```rust
> fn tie<'a, 'b: 'a>(_x: &'a str, _y: &'b str) { println!("Lifetime subtype verified"); }
> fn main() { tie("short", "longer_static"); }
> ```
>
> **Explanation:** `'b: 'a` indicates subtyping lifetime relationships where lifetime `'b` outlives lifetime `'a`.

---

## 6. Related Terms

- [Lifetime (`'a`)](../level_05/lifetime.md) — The fundamental annotation.
- [Trait Objects (`dyn Trait`)](../level_04/trait_objects.md) — The dynamic objects requiring `+ 'a` bounds.
- [`where` Clause](../level_04/where_clause.md) — Where complex lifetime bounds can be specified (`where T: 'a + Display`).

---

## 7. Key Takeaways

- `T: 'a` guarantees that generic type `T` contains no references shorter than `'a`.
- `'b: 'a` means lifetime `'b` outlives (is at least as long as) lifetime `'a`.
- `Box<dyn Trait>` defaults to `Box<dyn Trait + 'static>`.
- Use `Box<dyn Trait + 'a>` if the trait object holds borrowed data tied to lifetime `'a`.
