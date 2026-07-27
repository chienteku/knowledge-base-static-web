# `Function Pointers` (`fn()`)

> **Level 6 — Closures & Functional Patterns**
> A primitive scalar type representing a pointer to a function — distinct from closures because it cannot capture its environment.

---

## 1. Prerequisites

- [Closure](../level_06/closure.md) — The closely related, but fundamentally different, callable type this contrasts with.
- [`Fn` / `FnMut` / `FnOnce`](../level_06/fn_traits.md) — The trait family closures implement, which function pointers *also* implement.
- [`fn`](../level_01/fn.md) — The keyword that both declares functions and names this type.

---

## 2. Term Category

**Primitive Type (the environment-free callable)**: `fn(Args) -> Ret` is an actual, concrete, `Copy`-able Rust type — the type of a plain function itself (or a non-capturing closure), not a trait or a generic bound. It's the simplest possible "callable value," precisely because it's guaranteed to carry **no captured data** at all — just a bare address to jump to.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

A closure that captures its environment (`let x = 5; let f = move || x + 1;`) needs to carry that captured data around with it, so it's necessarily a unique, compiler-generated struct type — different closures, even with identical bodies, are always different types. A **plain function** (`fn add_one(x: i32) -> i32 { x + 1 }`), on the other hand, has no environment to capture at all — every call to it behaves identically regardless of context. This means a function (or a closure that happens to capture nothing) can be represented by something dramatically simpler: just the memory address of its compiled code. Rust exposes this as the `fn` type — a genuine, nameable, `Copy`, thread-safe (`Send + Sync`), single-machine-word type, distinct from the anonymous, capture-carrying types closures produce. This matters for FFI (C has no concept of closures, only plain function pointers) and for any scenario where you want to store "a callback" without paying for a capture-carrying struct.

### (2) Reality Metaphor

Imagine the difference between a vending machine's built-in dispensing mechanism and a custom Rube Goldberg contraption someone rigs up beside it.

- **A function pointer (`fn`)** is the vending machine's standard mechanism: a fixed, built-in procedure with **no memory of context** — press button B4, and it does the exact same mechanical motion every single time, regardless of who's standing there or what happened five minutes ago.
- **A capturing closure** is the custom contraption: it might remember "how many times has this specific person pressed a button today" or "what was the last item they bought" (**captured environment**) — genuinely unique machinery that can't be reduced to a single simple address, because it's carrying extra state along with it.

### (3) Rust Code Examples

#### Short Snippet (A Function as a Value)
```rust
fn add_one(x: i32) -> i32 { x + 1 }
fn double(x: i32) -> i32 { x * 2 }

fn apply(f: fn(i32) -> i32, value: i32) -> i32 {
    f(value)
}

fn main() {
    println!("{}", apply(add_one, 5)); // 6
    println!("{}", apply(double, 5));  // 10

    // fn is Copy: storing it in a variable and using it twice is trivial.
    let op: fn(i32) -> i32 = add_one;
    println!("{} {}", op(1), op(2)); // 2 3
}
```

#### Fuller Example (Non-Capturing Closures Coerce to `fn`; Capturing Ones Don't)
```rust
fn main() {
    let non_capturing = |x: i32| x + 1; // Captures NOTHING from its environment.
    let fp: fn(i32) -> i32 = non_capturing; // Coerces to a plain fn pointer — legal!
    println!("{}", fp(10)); // 11

    let captured = 100;
    let capturing = |x: i32| x + captured; // Captures `captured` — has real environment data.
    // let fp2: fn(i32) -> i32 = capturing; // COMPILE ERROR: closure captures data, no fn coercion possible!

    println!("{}", capturing(1)); // 101 — still perfectly usable, just NOT as a bare `fn`.
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Function Pointers Scoping and Lifecycle Rules

**The mistake:** Assuming Function Pointers instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("function_pointers_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("function_pointers_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Function Pointers State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Function Pointers through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Function Pointers Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Function Pointers instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Predict the Compile Result

**Problem:** Will this compile? Why or why not?
```rust
fn make_adder(n: i32) -> fn(i32) -> i32 {
    |x| x + n
}
```

> [!check]- Answer
> **No, this fails to compile.** The closure `|x| x + n` captures `n` from `make_adder`'s parameters — it has real environment data, so it cannot coerce into a bare `fn(i32) -> i32`, which by definition carries none. The fix is to change the return type to `impl Fn(i32) -> i32` (an opaque type representing "some closure implementing `Fn`"), which *can* represent a capturing closure, unlike the concrete `fn` pointer type.

---

### Exercise 2: Passing Top-Level Functions as Function Pointers

**Problem:** Pass top-level function `add_one(x: i32) -> i32` to a higher-order function taking `fn(i32) -> i32`.

**Expected output:**
```
Result: 11
```

> [!check]- Answer
> ```rust
> fn add_one(x: i32) -> i32 { x + 1 }
> fn apply(val: i32, f: fn(i32) -> i32) -> i32 { f(val) }
> fn main() {
>     println!("Result: {}", apply(10, add_one));
> }
> ```
>
> **Explanation:** Function pointers `fn(T) -> R` represent stateless function addresses taking zero environment captures.

### Exercise 3: Coercing Non-Capturing Closures into `fn` Pointers

**Problem:** Pass a non-capturing closure `|x| x * 2` directly to `apply(5, ...)`.

**Expected output:**
```
Result: 10
```

> [!check]- Answer
> fn apply(val: i32, f: fn(i32) -> i32) -> i32 { f(val) }
> fn main() {
>     println!("Result: {}", apply(5, |x| x * 2));
> }
> ```
>
> **Explanation:** Non-capturing closures automatically coerce into raw function pointers `fn`.

---

---

## 6. Related Terms

- [Closure](../level_06/closure.md) — The capturing, generally more flexible sibling that `fn` pointers contrast with.
- [`Fn` / `FnMut` / `FnOnce`](../level_06/fn_traits.md) — The trait family that `fn` pointers *also* implement (specifically `Fn`, since they never mutate captured state — they have none).
- [FFI (Foreign Function Interface)](../level_13/ffi.md) / [`extern "C"`](../level_13/extern_c.md) — Where `fn` pointers are essential, since C has no concept of a capturing closure at all.
- [Fat Pointers](../level_11/fat_pointers.md) — A useful contrast: `fn` pointers are always **thin** (a single address), unlike `dyn Trait` references.

---

## 7. Key Takeaways

- `fn(Args) -> Ret` is a real, concrete, `Copy`, `Send + Sync` scalar type — the type of a plain function or a non-capturing closure.
- It's fundamentally different from a closure type: it carries **zero** captured environment, just a bare code address.
- A non-capturing closure can coerce into a matching `fn` type; a capturing closure cannot, since there's nowhere for the captured data to go.
- Prefer generic `impl Fn`/`FnMut`/`FnOnce` bounds when you want to accept *any* callable, including capturing closures — reserve bare `fn` pointers for cases (like FFI) that specifically require environment-free callables.
