# `OnceCell` / `OnceLock` / `LazyLock` / `LazyCell`

> **Level 9 — Concurrency & Parallelism**
> Standard-library types for write-once and lazily-initialized values — the safe, thread-friendly replacement for `static mut`.

---

## 1. Prerequisites

- [`static` (`static`)](../level_01/static_static.md) — The global-state mechanism these types safely replace for non-trivial initialization.
- [Interior Mutability](../level_03/interior_mutability.md) — The pattern that lets a shared `&OnceLock<T>` still be initialized once.
- [`Sync` Trait](../level_09/sync_trait.md) — What makes `OnceLock`/`LazyLock` (unlike `OnceCell`/`LazyCell`) safe to share across threads.

---

## 2. Term Category

**Standard Library Types (the safe global-state family)**: These four types answer "how do I create a value that's computed once, the first time it's needed, and then reused forever?" — the classic *lazy static* pattern — without reaching for `unsafe`. `OnceCell`/`LazyCell` are the single-threaded versions; `OnceLock`/`LazyLock` are their thread-safe counterparts.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

A `const` must be computable at compile time, and a plain `static` must be initialized with a compile-time constant expression too — neither can run arbitrary code like "parse this config file" or "compile this regex" at startup. Before these types existed, achieving a genuinely lazy, run-once global required either `static mut` (which needs `unsafe` and has no built-in synchronization) or an external crate (`lazy_static!`, `once_cell`). The standard library eventually absorbed this pattern natively: `OnceLock<T>` lets you declare a `static` that starts empty and is filled in **exactly once**, safely, from any thread, the first time it's accessed — with the runtime guaranteeing no two threads can race to initialize it simultaneously. `LazyLock<T>` goes one step further, bundling the "what value to compute" closure directly into the type, so you don't even need to write the "is it initialized yet?" check yourself.

### (2) Reality Metaphor

Imagine an office coffee machine that needs to be calibrated exactly once, the very first time anyone uses it that day.

- **`static mut` (the old, unsafe way)**: Anyone can walk up and start fiddling with the calibration dial at any time, with no lock on the machine — if two people try to calibrate it simultaneously, the machine could end up in a corrupted, inconsistent state.
- **`OnceLock`**: The machine has a built-in mechanism that lets exactly the *first* person who approaches perform the calibration, while anyone else who tries to use it *during* that calibration automatically waits their turn. Everyone after that first calibration just gets to use the already-configured machine directly, instantly.
- **`LazyLock`**: Same guarantee, but the calibration *procedure itself* (the closure) is welded onto the machine from the factory — nobody even needs to remember to write "if not calibrated, calibrate" logic; simply touching the machine for the first time runs it automatically.

### (3) Rust Code Examples

#### Short Snippet (`OnceLock`, Manual Initialization)
```rust
use std::sync::OnceLock;

static CONFIG: OnceLock<String> = OnceLock::new();

fn get_config() -> &'static str {
    // .get_or_init() runs the closure ONLY on the very first call, from any thread.
    CONFIG.get_or_init(|| {
        println!("Loading config for the first time...");
        "production".to_string()
    })
}

fn main() {
    println!("{}", get_config()); // Prints "Loading..." then "production"
    println!("{}", get_config()); // Just "production" — no reload!
}
```

#### Fuller Example (`LazyLock`, Fully Automatic)
```rust
use std::sync::LazyLock;
use std::collections::HashMap;

// The closure runs automatically on first access — no .get_or_init() call needed anywhere.
static GREETINGS: LazyLock<HashMap<&str, &str>> = LazyLock::new(|| {
    println!("Building greetings map...");
    let mut m = HashMap::new();
    m.insert("en", "Hello");
    m.insert("es", "Hola");
    m
});

fn main() {
    // First dereference triggers initialization automatically.
    println!("{}", GREETINGS["en"]); // Prints "Building..." then "Hello"
    println!("{}", GREETINGS["es"]); // Just "Hola" — already built.
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Oncelock Lazylock Scoping and Lifecycle Rules

**The mistake:** Assuming Oncelock Lazylock instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("oncelock_lazylock_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("oncelock_lazylock_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Oncelock Lazylock State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Oncelock Lazylock through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Oncelock Lazylock Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Oncelock Lazylock instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Convert `static mut` to `OnceLock`

**Problem:** Rewrite this `unsafe` global counter starter to use `OnceLock` instead:
```rust
use std::time::Instant;

static mut START_TIME: Option<Instant> = None;
```

> [!check]- Answer
> ```rust
> use std::sync::OnceLock;
> use std::time::Instant;
>
> static START_TIME: OnceLock<Instant> = OnceLock::new();
>
> fn start_time() -> Instant {
>     *START_TIME.get_or_init(Instant::now)
> }
> ```
>
> No `unsafe` required anywhere, and it's guaranteed race-free even if `start_time()` is called concurrently from multiple threads.

---

### Exercise 2: Thread-Safe Lazy Initialization with `LazyLock`

**Problem:** Define a global `static CONFIG: LazyLock<Vec<String>> = LazyLock::new(|| vec!["a".into()]);`.

**Expected output:**
> [!check]- Answer
> ```
> Lazy config: ["a"]
> ```
> ```rust
> use std::sync::LazyLock;
> static CONFIG: LazyLock<Vec<String>> = LazyLock::new(|| {
>     vec!["a".to_string()]
> });
> fn main() {
>     println!("Lazy config: {:?}", *CONFIG);
> }
> ```
>
> **Explanation:** `LazyLock` initializes static thread-safe data lazily upon first dereference.

---

### Exercise 3: Explicit One-Time Setup with `OnceLock`

**Problem:** Initialize a global `static CACHE: OnceLock<String> = OnceLock::new();` via `get_or_init`.

**Expected output:**
> [!check]- Answer
> ```
> Cache val: initialized
> ```
> use std::sync::OnceLock;
> static CACHE: OnceLock<String> = OnceLock::new();
> fn main() {
>     let val = CACHE.get_or_init(|| "initialized".to_string());
>     println!("Cache val: {}", val);
> }
> ```
>
> **Explanation:** `OnceLock::get_or_init` executes initialization closures once across all threads.

---

## 6. Related Terms

- [`static` (`static`)](../level_01/static_static.md) — The mechanism these types are almost always paired with.
- [Interior Mutability](../level_03/interior_mutability.md) — The general pattern (mutating through a shared `&T`) that `OnceLock` relies on internally.
- [`Mutex<T>`](../level_09/mutex_t.md) — A related but different tool: `Mutex` allows repeated mutation; `OnceLock` allows exactly one initialization, then read-only access forever after.
- [Closure](../level_06/closure.md) — What `LazyLock::new()` and `.get_or_init()` both accept as the "how to compute the value" argument.

---

## 7. Key Takeaways

- `OnceLock<T>`/`OnceCell<T>` hold a value that's set **exactly once**, safely, with `.get_or_init()`; after that, access is just a fast read.
- `LazyLock<T>`/`LazyCell<T>` bundle the initialization closure directly into the type — no `get_or_init` call needed, initialization triggers automatically on first access.
- Use the `std::sync::` versions (`OnceLock`, `LazyLock`) for anything shareable across threads — including virtually all `static` items; use the `std::cell::` versions only for genuinely single-threaded local use.
- These types are the modern, `unsafe`-free replacement for both `static mut` and the older `lazy_static!`/`once_cell` crates.
