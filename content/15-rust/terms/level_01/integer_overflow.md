# Integer Overflow Semantics (`checked_` / `wrapping_` / `saturating_` / `overflowing_`)

> **Level 1 — Foundations**
> Arithmetic overflow panics in debug builds and silently wraps in release builds — unless you use an explicit method family to choose the behavior yourself.

---

## 1. Prerequisites

- [Scalar Types](../level_01/scalar_types.md) — The fixed-width integer types (`u8`, `i32`, ...) that can overflow.
- [Release Profile](../level_15/release_profile.md) — The build mode whose optimization settings change overflow behavior.

---

## 2. Term Category

**Rust Correctness Footgun (the two-faced bug)**: Integer overflow is one of the few places where Rust's behavior is **build-profile-dependent**. The exact same line of code, `a + b`, panics in a debug build and silently produces a wrong number in a release build. Rust gives you explicit method families so you never have to rely on this ambiguous default behavior.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

A fixed-width integer like `u8` can only hold 0 to 255. What should `250_u8 + 10_u8` (which mathematically equals 260) do? Rust's designers made a pragmatic trade-off: in **debug builds**, overflow triggers a `panic!` immediately, because catching bugs early during development is more valuable than speed. In **release builds**, the overflow check is stripped out for performance, and the value silently **wraps** (`260 mod 256 = 4`). This split is dangerous if you don't know about it — code that "works" in `cargo run` can misbehave in `cargo run --release`. So Rust also gives you four explicit method families to make the choice yourself, regardless of build profile.

### (2) Reality Metaphor

Imagine a car's analog odometer with only 3 digits, maxing out at 999.

- **Default/wrapping behavior**: You drive one more mile past 999. The odometer silently rolls over to 000. The car still drives fine — but if you were trusting that number to mean "total miles ever driven," you now have a dangerously wrong reading with no warning light.
- **`checked_add`**: A mechanic inspects the odometer before it rolls over and refuses to let it advance, handing you a `None` instead of a nonsense reading.
- **`saturating_add`**: The odometer physically jams at 999 and refuses to go further, always showing you the true maximum instead of a wrapped lie.

### (3) Rust Code Examples

#### Short Snippet (The Two Faces of `+`)
```rust
fn main() {
    let a: u8 = 250;
    let b: u8 = 10;

    // In a `cargo run` (debug) build: this line PANICS ("attempt to add with overflow").
    // In a `cargo run --release` build: this line silently wraps to 4!
    let sum = a + b;
    println!("{sum}");
}
```

#### Fuller Example (The Explicit Method Families)
```rust
fn main() {
    let a: u8 = 250;
    let b: u8 = 10;

    // 1. checked_*: Returns Option<T>. None means it would have overflowed.
    let checked = a.checked_add(b);
    println!("{checked:?}"); // None

    // 2. wrapping_*: Always wraps, deliberately, on every build profile.
    let wrapped = a.wrapping_add(b);
    println!("{wrapped}"); // 4

    // 3. saturating_*: Clamps to the type's min/max instead of wrapping.
    let saturated = a.saturating_add(b);
    println!("{saturated}"); // 255 (u8::MAX)

    // 4. overflowing_*: Returns (result, did_it_overflow: bool).
    let (value, overflowed) = a.overflowing_add(b);
    println!("{value}, {overflowed}"); // 4, true
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Integer Overflow Scoping and Lifecycle Rules

**The mistake:** Assuming Integer Overflow instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("integer_overflow_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("integer_overflow_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Integer Overflow State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Integer Overflow through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Integer Overflow Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Integer Overflow instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Choose the Right Method

**Problem:** You are computing a user's account balance in cents as a `u32`. You must never let it go negative (which would wrap to a huge positive number), and you'd rather clamp at zero than crash the whole program. Which method family do you reach for, and why?

> [!check]- Answer
> **`saturating_sub`**.
>
> ```rust
> let balance: u32 = 500;
> let withdrawal: u32 = 700;
> let new_balance = balance.saturating_sub(withdrawal); // Clamps to 0 instead of wrapping to ~4 billion.
> ```
>
> `checked_sub` would also be defensible (returning `None` so you can reject the withdrawal outright), but `saturating_sub` is the right call if the requirement is specifically "never crash, never wrap, just clamp at the boundary."

---

### Exercise 2: Safe Financial Calculations with `checked_add`

**Problem:** Write a function `safe_deposit(balance: u32, amount: u32) -> Option<u32>` using `checked_add` to prevent balance overflow.

**Expected output:**
```
Some(150)
None
```

> [!check]- Answer
> ```rust
> fn safe_deposit(balance: u32, amount: u32) -> Option<u32> {
>     balance.checked_add(amount)
> }
> fn main() {
>     println!("{:?}", safe_deposit(100, 50));
>     println!("{:?}", safe_deposit(u32::MAX, 1));
> }
> ```
>
> **Explanation:** `checked_add` returns `Some(result)` on success or `None` on overflow in both debug and release builds.

### Exercise 3: Explicit Wrapping Math

**Problem:** Demonstrate intentional modular arithmetic using `wrapping_add` on `u8::MAX` with `5`.

**Expected output:**
```
4
```

> [!check]- Answer
> ```rust
> fn main() {
>     let start: u8 = 255;
>     let end = start.wrapping_add(5);
>     println!("{}", end);
> }
> ```
>
> **Explanation:** `wrapping_add` explicitly signals to Rust that wrapping arithmetic is intended, behaving deterministically across all build profiles.

---

## 6. Related Terms

- [`as` Casting](../level_01/as_casting.md) — Another silent-truncation footgun; `as` and unchecked `+` share the same "no warning" failure mode.
- [`panic!`](../level_04/panic.md) — What debug-mode overflow triggers.
- [`Option<T>`](../level_02/option_t.md) — The return type of every `checked_*` method.
- [Release Profile](../level_15/release_profile.md) — The build setting (`overflow-checks`) that determines whether unchecked `+` panics or wraps.

---

## 7. Key Takeaways

- Unchecked arithmetic (`+`, `-`, `*`) **panics on overflow in debug builds** and **silently wraps in release builds** by default — the same code, two different behaviors.
- `checked_*` returns `Option<T>` (`None` on overflow) — best when overflow means "reject this operation."
- `wrapping_*` always wraps, on every build — best when wraparound is the *intended* behavior (e.g. hashing, ring buffers).
- `saturating_*` clamps to the type's min/max — best when you want a safe, non-crashing "closest possible" answer.
- `overflowing_*` returns both the wrapped value and a `bool` — best when you need the wrapped result *and* want to know it happened.
