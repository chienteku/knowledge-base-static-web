# Static (`static`)

> **Level 1 — Foundations**
> A global variable with a `'static` lifetime; can be mutable (`static mut`) but requires `unsafe`.

---

## 1. Prerequisites

- [Constants (`const`)](../level_01/constants_const.md) — The preferred way to define global read-only values.

---

## 2. Term Category

**Rust-nonspecific**: Static variables exist in languages like C, C++, and Java (as static fields) to represent data that lives for the entire duration of a program.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

While [Constants (`const`)](../level_01/constants_const.md) are great for read-only values, they work by literally copy-pasting the value wherever it is used. What if you have a massive 1-Gigabyte lookup table? You definitely don't want to copy-paste that into memory hundreds of times. Or what if you are doing low-level programming and need to point to a specific, unmoving hardware memory address?

This is where the `static` keyword comes in. A `static` item guarantees that there is exactly **one instance** of the value at a **single, fixed memory location** that lives for the entire duration of your program (this duration is called the `'static` lifetime). 

Because there is only one memory location, if you allow it to be mutable (`static mut`), multiple threads could try to change it at the exact same time, causing a disastrous "data race." Rust's compiler is obsessed with safety and cannot guarantee that your multi-threaded code is safe if it uses `static mut`. Therefore, reading or writing to a `static mut` forces you to use an `unsafe` block, explicitly telling the compiler: *"I know this is dangerous, but I take full responsibility."*

### (2) Reality Metaphor

- A `const` is like a **PDF flyer**. If 100 people need it, you print 100 copies and hand them out. Everyone gets their own copy of the exact same data.
- A `static` is like a **single physical bulletin board** in the lobby of a building. There is only one board. If 100 people need the information, they all walk to the exact same physical location to look at it. 
- A `static mut` means you are allowing people to change what's on the bulletin board. Because people might bump into each other and rip the paper while trying to pin things at the same time, the building manager requires you to put on a hardhat (an `unsafe` block) before you touch it.

### (3) Rust Code Examples

#### Short Snippet
```rust
// Like const, static variables MUST have a type annotation.
static GREETING: &str = "Hello, World";

// A mutable static variable.
static mut GLOBAL_COUNTER: i32 = 0;
```

#### Fuller Example
```rust
static HELLO_WORLD: &str = "Hello, world!";
static mut HIT_COUNT: u32 = 0;

fn main() {
    // Reading a standard `static` is perfectly safe.
    println!("Message: {}", HELLO_WORLD);
    
    // Changing a `static mut` is DANGEROUS. 
    // The compiler will refuse to build this unless we wrap it in `unsafe`.
    unsafe {
        HIT_COUNT += 1;
        
        // Even simply reading a `static mut` requires an `unsafe` block!
        // What if another thread was changing it right as we read it?
        println!("The hit count is now: {}", HIT_COUNT);
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Static Static Scoping and Lifecycle Rules

**The mistake:** Assuming Static Static instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("static_static_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("static_static_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Forgetting the `unsafe` block for `static mut`

**The mistake:** Trying to read or write a `static mut` like a normal variable.

**Why it's wrong:** Rust's primary selling point is fearless concurrency (no data races). Global mutable state is the #1 cause of data races. Rust forces you to acknowledge this danger.

*Incorrect:*
```rust
static mut SCORE: i32 = 0;

fn main() {
    SCORE = 100; // ERROR: use of mutable static is unsafe
}
```

*Fix:*
```rust
static mut SCORE: i32 = 0;

fn main() {
    unsafe {
        SCORE = 100;
    }
}
```

---

### Mistake 3: Concurrent Access to Static Static Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Static Static instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Safely Unsafe

**Problem:** The code below attempts to increment a global mutable counter, but the compiler is throwing an error. Fix the code so it successfully compiles.

```rust
static mut LOG_COUNT: u32 = 0;

fn log_event() {
    // TODO: Wrap the following line in an unsafe block.
    LOG_COUNT += 1;
}

fn main() {
    log_event();
}
```

**Expected output:**
*(The code should compile with no output)*

> [!check]- Answer
> - Wrap the mutation inside an `unsafe { ... }` block.
> - The code inside the function should look like:
>   ```rust
>   unsafe {
>       LOG_COUNT += 1;
>   }
>   ```

---

### Exercise 2: Global Immutable Configuration

**Problem:** Define a global `static APP_NAME: &str = "Antigravity";` and print it from multiple functions.

**Expected output:**
> [!check]- Answer
> ```
> App: Antigravity
> Running Antigravity
> ```
> ```rust
> static APP_NAME: &str = "Antigravity";
> fn print_header() { println!("App: {}", APP_NAME); }
> fn print_status() { println!("Running {}", APP_NAME); }
> fn main() {
>     print_header();
>     print_status();
> }
> ```
>
> **Explanation:** Immutable `static` items have `'static` lifetime and reside in a fixed memory location accessible safely throughout application lifetime.

---

### Exercise 3: Static Address vs Const Inlining

**Problem:** Demonstrate that pointers to a `static` variable yield the exact same memory address across calls, whereas pointers to `const` can yield distinct addresses.

**Expected output:**
> [!check]- Answer
> ```
> Static addresses match: true
> ```
> ```rust
> static NUM: i32 = 100;
> fn main() {
>     let ptr1: *const i32 = &NUM;
>     let ptr2: *const i32 = &NUM;
>     println!("Static addresses match: {}", ptr1 == ptr2);
> }
> ```
>
> **Explanation:** `static` items occupy a single, dedicated location in the compiled binary's data segment, giving them a unique, stable memory address.

---

## 6. Related Terms

- [Constants (`const`)](../level_01/constants_const.md) — The preferred alternative for read-only global values.
- [Variable](../level_01/variable.md) — Standard bindings that live on the stack or heap, rather than in fixed global memory.

---

## 7. Key Takeaways

- `static` variables represent a **single, fixed memory location** that lasts for the entire lifetime of the program.
- Like `const`, they **must** have an explicit type annotation.
- You can make them mutable using `static mut`.
- Because global mutable state is dangerous across multiple threads, **reading or writing to a `static mut` requires an `unsafe` block**.
- In 99% of cases, you should prefer `const` for global values. Use `static` only when a single memory address is strictly required.
