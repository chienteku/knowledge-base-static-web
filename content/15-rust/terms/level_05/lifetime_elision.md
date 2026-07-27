# Lifetime Elision

> **Level 5 — Lifetimes**
> Deterministic compiler rules that infer lifetimes in common function signatures to reduce boilerplate.

---

## 1. Prerequisites

- [Lifetime (`'a`)](../level_05/lifetime.md) — The fundamental concept being automatically inferred.
- [Fn (Functions)](../level_01/fn.md) — The declarations where elision rules apply.
- [Method](../level_02/method.md) — Methods with `&self` or `&mut self` have dedicated elision rules.

---

## 2. Term Category

**Compiler Feature (syntactic sugar for lifetimes)**: In early versions of Rust, every function that accepted or returned a reference required explicit lifetime annotations like `fn foo<'a>(x: &'a str) -> &'a str`. Rust developers noticed that 90% of functions followed predictable lifetime patterns. The compiler team codified these patterns into the **Lifetime Elision Rules**, allowing you to omit explicit `'a` annotations in the vast majority of everyday code.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Writing explicit lifetime annotations everywhere adds visual noise without adding extra information when the pattern is obvious.

Consider:
```rust
fn print_str(s: &str) { ... }
fn first_word(s: &str) -> &str { ... }
```

In `print_str`, there is only one reference parameter and no return value. In `first_word`, there is one reference input and one reference output — obviously the returned reference must borrow from the input parameter!

Instead of forcing you to write `fn first_word<'a>(s: &'a str) -> &'a str`, Rust's compiler applies 3 deterministic rules to insert the lifetime annotations for you behind the scenes.

### (2) The 3 Lifetime Elision Rules

When you write a function without explicit lifetimes, the compiler performs these 3 steps in order:

1. **Rule 1 (Input Lifetimes):** Each parameter that is a reference gets its own distinct lifetime parameter.
   - `fn foo(x: &i32, y: &i32)` becomes `fn foo<'a, 'b>(x: &'a i32, y: &'b i32)`.
2. **Rule 2 (Single Input):** If there is exactly **one** input lifetime parameter (whether explicit or elided), that lifetime is assigned to **all** output references.
   - `fn first_word(s: &str) -> &str` becomes `fn first_word<'a>(s: &'a str) -> &'a str`.
3. **Rule 3 (Method `&self` / `&mut self`):** If there are multiple input lifetime parameters, but one of them is `&self` or `&mut self`, the lifetime of `self` is assigned to **all** output references.
   - `impl Struct { fn get_part(&self, query: &str) -> &str }` assigns `&self`'s lifetime to the return value!

If after applying these 3 rules there are still output references whose lifetime cannot be inferred, the compiler stops and demands explicit lifetime annotations.

### (3) Reality Metaphor

Imagine a court reporter transcribing a trial.

When a lawyer says "the defendant," everyone in the room knows *which* defendant they are talking about because there is only one defendant at the table (Rule 2). The court reporter doesn't make the lawyer state the defendant's full social security number every single sentence. 

Only when there are *multiple* defendants at the table does the reporter ask for explicit clarification. Lifetime elision is the compiler's shorthand for unambiguous contexts.

### (4) Rust Code Examples

#### Short Snippet (Elided vs Expanded)
```rust
// What you write (Elided):
fn trim_space(s: &str) -> &str {
    s.trim()
}

// What the compiler expands it to (Rule 2):
fn trim_space<'a>(s: &'a str) -> &'a str {
    s.trim()
}
```

#### Method Example (Rule 3 in action)
```rust
struct Book {
    title: String,
}

impl Book {
    // Rule 3: The returned &str automatically inherits the lifetime of &self!
    fn get_title(&self, _prefix: &str) -> &str {
        &self.title
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Lifetime Elision Scoping and Lifecycle Rules

**The mistake:** Assuming Lifetime Elision instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("lifetime_elision_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("lifetime_elision_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Lifetime Elision State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Lifetime Elision through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Lifetime Elision Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Lifetime Elision instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Apply Elision Rules Manually

**Problem:** How does the compiler expand `fn process(data: &str, config: &str) -> String`?

> [!check]- Answer
> Rule 1 assigns `fn process<'a, 'b>(data: &'a str, config: &'b str) -> String`. Since the return type is an owned `String` (not a reference), no output lifetime is needed! The code compiles without any explicit lifetime annotations.

---

### Exercise 2: Inspecting Elided Method Lifetimes

**Problem:** Write a method `fn get_name(&self, _other: &str) -> &str` and explain why return lifetime elides to `&self`.

**Expected output:**
```
Name: Alice
```

> [!check]- Answer
> ```rust
> struct User { name: String }
> impl User {
>     fn get_name(&self, _other: &str) -> &str { &self.name }
> }
> fn main() {
>     let u = User { name: "Alice".into() };
>     println!("Name: {}", u.get_name("test"));
> }
> ```
>
> **Explanation:** By lifetime elision rule 3, if a method has `&self` or `&mut self`, the lifetime of `self` is assigned to all output lifetime parameters.

### Exercise 3: Single Input Lifetime Elision Rule

**Problem:** Demonstrate that `fn first_word(s: &str) -> &str` compiles without explicit annotations.

**Expected output:**
```
Word: Hello
```

> [!check]- Answer
> fn first_word(s: &str) -> &str { &s[..5] }
> fn main() { println!("Word: {}", first_word("Hello World")); }
> ```
>
> **Explanation:** Elision rule 1 assigns a distinct lifetime parameter to each input reference, and rule 2 assigns that single input lifetime to all output references.

---

## 6. Related Terms

- [Lifetime (`'a`)](../level_05/lifetime.md) — The syntax being elided.
- [Struct Lifetimes](../level_05/struct_lifetimes.md) — Note: Struct definitions **do not** support lifetime elision; `struct Foo<'a>` must always be explicit.
- [Higher-Ranked Trait Bounds (HRTB)](../level_05/higher_ranked_trait_bounds.md) — For advanced closures where lifetimes apply for *all* calls.

---

## 7. Key Takeaways

- Lifetime elision is a set of 3 deterministic compiler rules, not magic guessing.
- Single input reference $\rightarrow$ output gets that same lifetime.
- Methods with `&self` or `&mut self` $\rightarrow$ output gets `self`'s lifetime.
- Multiple input references returning a reference require explicit lifetime annotations.
- Struct fields holding references can *never* elide lifetimes.
