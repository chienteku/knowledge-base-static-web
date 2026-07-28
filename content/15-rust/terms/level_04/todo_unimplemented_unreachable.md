# `todo!` / `unimplemented!` / `unreachable!`

> **Level 4 — Error Handling & Generics**
> Diverging macros (type `!`) for stubbing unfinished code or asserting a branch is impossible.

---

## 1. Prerequisites

- [`panic!`](../level_04/panic.md) — The mechanism all three of these macros are built on.
- [Never Type (`!`)](../level_11/never_type.md) — The type that lets these macros type-check anywhere a value is expected.
- [`match`](../level_02/match.md) — Where `unreachable!()` is most commonly used, in a provably-impossible arm.

---

## 2. Term Category

**Diverging Macros (the placeholder-panic family)**: All three macros immediately panic when executed, just like `panic!`, but each communicates a **different intent** to both the compiler and future readers of the code — "not written yet," "deliberately not supported," or "this can genuinely never happen."

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Rust requires every function to satisfy its declared return type and every `match` to be exhaustive — you can't just leave a function body empty or skip a `match` arm while you're still figuring out the implementation. Rather than forcing you to write a fake, misleading placeholder value (`return 0; // TODO: fix this`) just to satisfy the type checker, these three macros let you write code that **compiles cleanly** (since they evaluate to the [never type](../level_11/never_type.md), which coerces to *any* expected type) while still panicking loudly and immediately if that specific path is ever actually executed. The three names exist specifically to encode *why* a given panic point is there, which both documents intent for human readers and, in the case of tools like Clippy, enables different static analysis (e.g. distinguishing "known incomplete" from "logically impossible").

### (2) Reality Metaphor

Imagine three different kinds of "under construction" signs a contractor might post around a building site.

- **`todo!()`**: A sign reading "Room not yet built — come back later." It's an honest placeholder for work that's clearly still coming.
- **`unimplemented!()`**: A sign reading "This wing was intentionally left out of this version of the building — not planned for now." Similar to `todo!`, but often used to mean "not needed yet, possibly never," rather than "actively being worked on."
- **`unreachable!()`**: A sign posted on a door that, according to the building's own blueprints, **cannot possibly exist** — if anyone ever actually opens that door, it means the blueprints themselves were wrong somewhere, and the contractor wants to be alerted immediately and loudly, not have someone quietly wander through.

### (3) Rust Code Examples

#### Short Snippet (Stubbing Out Work in Progress)
```rust
fn calculate_discount(user_tier: &str) -> f64 {
    match user_tier {
        "gold" => 0.20,
        "silver" => 0.10,
        "bronze" => todo!("bronze tier pricing not decided yet"), // Compiles! Panics only if CALLED.
        _ => 0.0,
    }
}

fn main() {
    println!("{}", calculate_discount("gold")); // 0.2 — fine, doesn't touch the todo!().
    // calculate_discount("bronze"); // Would panic: "not yet implemented: bronze tier pricing not decided yet"
}
```

#### Fuller Example (`unreachable!()` in a Provably-Exhaustive Match)
```rust
enum Direction { North, South, East, West }

fn opposite(dir: Direction) -> Direction {
    use Direction::*;
    match dir {
        North => South,
        South => North,
        East => West,
        West => East,
    }
}

fn angle_degrees(dir: &Direction) -> u32 {
    use Direction::*;
    let base = match dir {
        North => 0,
        East => 90,
        South => 180,
        West => 270,
    };
    // Suppose external validation elsewhere GUARANTEES base is always one of these four values.
    match base {
        0 | 90 | 180 | 270 => base,
        _ => unreachable!("angle should always be a multiple of 90, got {base}"),
    }
}

fn main() {
    println!("{}", angle_degrees(&Direction::East)); // 90
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Todo Unimplemented Unreachable Scoping and Lifecycle Rules

**The mistake:** Assuming Todo Unimplemented Unreachable instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("todo_unimplemented_unreachable_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("todo_unimplemented_unreachable_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Todo Unimplemented Unreachable State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Todo Unimplemented Unreachable through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Todo Unimplemented Unreachable Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Todo Unimplemented Unreachable instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Choose the Right Macro

**Problem:** For each scenario, which of `todo!`, `unimplemented!`, or `unreachable!` best fits?
1. You're mid-way through writing a function and haven't gotten to the `else` branch yet.
2. Inside a `match` on an enum, after already handling all four variants explicitly, you add a `_ =>` catch-all arm required by an older compiler edition, even though you know all variants are covered above.
3. A feature is explicitly out of scope for this release and won't be built for a while.

> [!check]- Answer
> 1. **`todo!()`** — actively being worked on, coming soon.
> 2. **`unreachable!()`** — the arm is logically provably impossible given the exhaustive handling above it.
> 3. **`unimplemented!()`** — deliberately, indefinitely not built, distinct from "still in progress."

---

### Exercise 2: Stubbing Unfinished Code with `todo!`

**Problem:** Define a function signature `fn calculate_tax(amount: f64) -> f64` stubbed with `todo!("implement tax rates")`.

**Expected output:**
> [!check]- Answer
> ```
> Stub function defined
> ```
> ```rust
> fn calculate_tax(_amount: f64) -> f64 {
>     todo!("implement tax rates")
> }
> fn main() {
>     println!("Stub function defined");
> }
> ```
>
> **Explanation:** `todo!` acts as a type-satisfying stub macro during iterative API design.

---

### Exercise 3: Marking Impossible Branches with `unreachable!`

**Problem:** Use `unreachable!()` in a match arm after proving mathematically that `x % 2` can only be `0` or `1`.

**Expected output:**
> [!check]- Answer
> ```
> Matched: Even
> ```
> ```rust
> fn check_mod(x: u32) -> &'static str {
>     match x % 2 {
>         0 => "Even",
>         1 => "Odd",
>         _ => unreachable!(),
>     }
> }
> fn main() {
>     println!("Matched: {}", check_mod(4));
> }
> ```
>
> **Explanation:** `unreachable!` informs the compiler that a branch is unreachable, enabling optimization.

---

## 6. Related Terms

- [`panic!`](../level_04/panic.md) — The underlying mechanism all three macros are thin, intent-communicating wrappers around.
- [Never Type (`!`)](../level_11/never_type.md) — What lets these macros type-check as *any* expected return type or match-arm value.
- [`match`](../level_02/match.md) — Where `unreachable!()` is most commonly and appropriately used.
- [`dbg!` Macro](../level_01/dbg_macro.md) — A different kind of development-time macro (for inspection rather than stubbing).

---

## 7. Key Takeaways

- All three macros immediately panic when executed, but communicate **different intent**: `todo!` (not written yet), `unimplemented!` (deliberately not supported), `unreachable!` (provably impossible).
- They evaluate to the never type (`!`), so they compile cleanly wherever a value of any type is expected — a genuinely useful placeholder, not a type-checking workaround.
- `unreachable!()` should only be used where the impossibility is provable from the code's own logic — never as a stand-in for validating genuinely-reachable bad input.
- All three accept an optional format-string message, just like `panic!`, to explain the specific situation when the panic does occur.
