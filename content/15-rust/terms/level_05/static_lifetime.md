# `'static` Lifetime

> **Level 5 — Lifetimes**
> The reserved lifetime specifying references valid for the entire duration of the program execution.

---

## 1. Prerequisites

- [Lifetime (`'a`)](../level_05/lifetime.md) — The annotation mechanism.
- [Static (`static`)](../level_01/static_static.md) — Global memory storage location.
- [String Slice (`&str`)](../level_01/string_vs_&str.md) — String literals naturally have a `'static` lifetime.

---

## 2. Term Category

**Reserved Lifetime (the program-duration lifetime)**: `'static` is a special reserved lifetime in Rust with two distinct usages:
1. **As a reference lifetime (`&'static T`):** Means the referenced data is guaranteed to live for the remaining duration of the program execution (e.g., hard-coded string literals embedded in the binary).
2. **As a trait bound (`T: 'static`):** Means the type `T` can live for as long as needed, containing **no non-`'static` references** (owned data like `String` or `i32` satisfies `T: 'static`).

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Some data exists in the compiled binary file itself (like hard-coded string literals `"Hello, world!"`). When the operating system loads the binary into memory, these strings are placed in read-only data segments (`.rodata`). Because this memory is never freed until the process exits, references pointing to it are valid anywhere in the application.

Rust needed a way to express "this reference is safe to keep forever". That is `'static`.

Furthermore, when spawning threads (like `thread::spawn`), the background thread might run longer than the function that spawned it. Rust enforces that data moved into thread closures must satisfy `T: 'static` to ensure no thread accesses memory that was deallocated on the parent thread's stack.

### (2) Reality Metaphor

- **Regular reference `&'a str`:** A library book you checked out on a 2-week loan. You must return it before your lease expires.
- **`&'static str`:** A carved granite monument in the city plaza. It was placed there when the city was built and remains there for as long as the city stands. Anyone can read it at any time.

### (3) Rust Code Examples

#### Short Snippet (String Literals)
All string literals in Rust have the `'static` lifetime by default.

```rust
fn main() {
    // The string literal is stored directly in the binary's read-only memory
    let greeting: &'static str = "Hello, world!";
    println!("{greeting}");
}
```

#### Fuller Example (`T: 'static` Trait Bound)
Notice how owned types like `String` and `i32` satisfy `'static` because they hold no borrowed references with shorter lifespans.

```rust
use std::thread;

// thread::spawn requires F: 'static
fn run_in_background<T: Send + 'static>(data: T) {
    thread::spawn(move || {
        // data is safe to use here because it holds no short-lived references
        println!("Processing background data...");
    });
}

fn main() {
    let owned_string = String::from("Hello from main");
    
    // Works! String is owned and contains no short-lived references.
    run_in_background(owned_string);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Static Lifetime Scoping and Lifecycle Rules

**The mistake:** Assuming Static Lifetime instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("static_lifetime_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("static_lifetime_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Static Lifetime State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Static Lifetime through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Static Lifetime Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Static Lifetime instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Identify Valid `'static` Types

**Which of the following satisfy the `T: 'static` trait bound?**
1. `i32`
2. `String`
3. `&'a str` (where `'a` is a local scope lifetime)
4. `&'static str`

> [!check]- Answer
> 1. `i32` — **Yes** (owned primitive).
> 2. `String` — **Yes** (owned heap data).
> 3. `&'a str` — **No** (holds a non-static reference borrowed for `'a`).
> 4. `&'static str` — **Yes** (reference lives for the entire program).

---

### Exercise 2: Satisfying `T: 'static` Trait Bounds with Owned Types

**Problem:** Pass an owned `String` into a function requiring `T: 'static` bound.

**Expected output:**
```
Owned string satisfies 'static: Hello
```

> [!check]- Answer
> ```rust
> fn spawn_task<T: 'static + std::fmt::Display>(val: T) {
>     println!("Owned string satisfies 'static: {}", val);
> }
> fn main() {
>     let owned_str = String::from("Hello");
>     spawn_task(owned_str);
> }
> ```
>
> **Explanation:** Owned types containing no temporary references satisfy `'static` lifetime bounds.

### Exercise 3: Leaking Memory Safely for `'static` References via `Box::leak`

**Problem:** Convert a dynamic `String` into a `&'static str` slice using `Box::leak`.

**Expected output:**
```
Leaked static slice: Dynamic
```

> [!check]- Answer
> fn main() {
>     let s = String::from("Dynamic");
>     let static_slice: &'static str = Box::leak(s.into_boxed_str());
>     println!("Leaked static slice: {}", static_slice);
> }
> ```
>
> **Explanation:** `Box::leak` bypasses destructor execution, turning heap allocations into valid `'static` references.

---

## 6. Related Terms

- [Lifetime (`'a`)](../level_05/lifetime.md) — The general concept.
- [Static (`static`)](../level_01/static_static.md) — Global variable declaration keyword.
- [Thread Spawn (`thread::spawn`)](../level_09/thread_spawn.md) — Primary user of `T: 'static` bounds.

---

## 7. Key Takeaways

- `'static` means data lives for the entire duration of the program.
- String literals `"foo"` have type `&'static str`.
- `T: 'static` means "type `T` owns its data or only holds static references" (owned types like `u32` and `String` satisfy `T: 'static`).
- Thread spawning requires `'static` bounds so worker threads don't reference destroyed stack frames.
