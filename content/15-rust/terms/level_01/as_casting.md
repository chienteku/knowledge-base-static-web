# `as` Casting (Primitive Numeric Coercion)

> **Level 1 — Foundations**
> The `as` keyword for explicit, silent conversions between primitive types.

---

## 1. Prerequisites

- [Scalar Types](../level_01/scalar_types.md) — The integer, float, `bool`, and `char` types you'll be converting between.
- [Type Annotation](../level_01/type_annotation.md) — `as` always names its target type explicitly, e.g. `x as u8`.

---

## 2. Term Category

**Rust Keyword (the blunt instrument)**: `as` is Rust's most primitive, no-questions-asked conversion tool. It converts between numeric types, `bool`→numbers, `char`↔`u32`, and pointer types. Unlike almost every other conversion mechanism in Rust, `as` performs **no runtime check** and **cannot fail** — it just does the conversion, even if the result is nonsense.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Rust has dozens of numeric types (`i8`, `u8`, `i16`, `u32`, `i64`, `usize`, `f32`, `f64`...) and refuses to convert between them automatically, unlike C. If you have a `usize` (from `.len()`) and need an `i32` for an API, you need *some* way to say "just make it that type." `as` is that escape hatch: fast, zero-overhead, and available everywhere — at the cost of being **completely silent** about data loss. It exists because sometimes you, the programmer, know the value fits and don't want the ceremony of a fallible conversion.

### (2) Reality Metaphor

Imagine pouring water from a 5-gallon bucket (`i64`) into a 1-cup measuring cup (`u8`).

- **`as` casting**: You pour as fast as you can. Whatever doesn't fit in the cup splashes on the floor and is gone forever. Nobody stops you, nobody warns you. The cup is now full of *some* water — just not necessarily a useful amount.
- **`TryFrom`** (the safe alternative): A careful assistant measures the bucket first. If it's more than a cup, they hand you back an `Err` and refuse to pour, so you're never surprised by a puddle on the floor.

### (3) Rust Code Examples

#### Short Snippet (Truncation in Action)
```rust
fn main() {
    let big: i64 = 300;
    let small = big as u8; // u8 can only hold 0..=255!

    println!("{small}"); // 44, NOT 300! (300 % 256 = 44)
    // No panic. No warning at runtime. Just silently wrong data.
}
```

#### Fuller Example (Float-to-Int Saturation)
```rust
fn main() {
    let ratio: f64 = 3.9;
    let count = ratio as i32; // Truncates toward zero, does NOT round.
    println!("{count}"); // 3

    let too_big: f64 = 1e20;
    let capped = too_big as i32; // Since Rust 1.45, this SATURATES instead of UB.
    println!("{capped}"); // i32::MAX, i.e. 2147483647

    let negative: f64 = -1.0;
    let unsigned = negative as u32; // Saturates to the other bound.
    println!("{unsigned}"); // 0
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Silent Truncation in Downcasting Large Integers

**The mistake:** Casting a 64-bit integer into an 8-bit integer using `as` when the value exceeds 255.

**Why it's wrong:** The `as` operator performs numeric truncation silently without runtime panics or warnings, truncating high-order bits and yielding unexpected values.

*Incorrect:*
```rust
let big: u64 = 1000;
let small: u8 = big as u8; // Silently truncates to 232!
```

*Fix:*
```rust
use std::convert::TryFrom;
let big: u64 = 1000;
let small: Result<u8, _> = u8::try_from(big); // Safely returns Error
```

### Mistake 2: Casting Float to Integer Causing Out-of-Range Undefined Behavior Safeguards

**The mistake:** Casting `NaN` or out-of-bound floating-point numbers like `f64::NAN as i32`.

**Why it's wrong:** Converting float `NaN` or infinity to integers using `as` yields `0` in Rust 1.45+, which can silently corrupt mathematical logic.

*Incorrect:*
```rust
let val: f64 = f64::NAN;
let int_val = val as i32; // Evaluates to 0 silently
```

*Fix:*
```rust
let val: f64 = f64::NAN;
if val.is_finite() {
    let int_val = val as i32;
}
```

### Mistake 3: Pointer Casting Circumventing Ownership Safeguards

**The mistake:** Attempting raw pointer casting `*const T as *mut T` to mutate immutable data.

**Why it's wrong:** Casting immutable reference pointers to mutable pointers without unsafe sync cell primitives breaks aliasing guarantees.

*Incorrect:*
```rust
let x = 42;
let ptr = &x as *const i32 as *mut i32;
// unsafe { *ptr = 100; } // Undefined Behavior!
```

*Fix:*
```rust
use std::cell::Cell;
let x = Cell::new(42);
x.set(100);
```

## 5. Practice Exercises

### Exercise 1: Predict the Output

**Problem:** What does this program print, and why?

```rust
fn main() {
    let x: u8 = 250;
    let y: i8 = x as i8;
    println!("{y}");
}
```

> [!check]- Answer
> **`-6`**.
>
> `u8` and `i8` are both 8 bits, so `as` just **reinterprets the same bit pattern**. `250` in binary is `11111010`. As an unsigned `u8` that's 250, but as a signed two's-complement `i8` that same bit pattern means `-6`. No data is lost — the bits are identical — but the *meaning* changes because the sign bit is now interpreted differently.

---

### Exercise 2: Truncation in Loop Indexing

**Problem:** Given a `usize` loop counter starting at 200 and incremented by 20 for 5 iterations, cast each value to `u8` and print it. Explain why values past 255 wrap around.

**Expected output:**
```
200
220
240
4
24
```

> [!check]- Answer
> ```rust
> fn main() {
>     let mut count: usize = 200;
>     for _ in 0..5 {
>         println!("{}", count as u8);
>         count += 20;
>     }
> }
> ```
>
> **Explanation:** `u8` can only represent values from 0 to 255. When `count` reaches 260, casting to `u8` truncates the higher bits: `260 % 256 = 4`. Next iteration yields `280 % 256 = 24`.

### Exercise 3: Float-to-Integer Saturation

**Problem:** Predict and print the result of casting `f32::NAN`, `1e10_f32`, and `-100.75_f32` to `i32` using `as`.

**Expected output:**
```
NAN cast: 0
Large cast: 2147483647
Negative cast: -100
```

> [!check]- Answer
> ```rust
> fn main() {
>     let nan_val: f32 = f32::NAN;
>     let large_val: f32 = 1e10;
>     let neg_val: f32 = -100.75;
>
>     println!("NAN cast: {}", nan_val as i32);
>     println!("Large cast: {}", large_val as i32);
>     println!("Negative cast: {}", neg_val as i32);
> }
> ```
>
> **Explanation:** Since Rust 1.45, float-to-int casts saturate at the bounds of the target integer type (`i32::MAX` for values exceeding representation) and produce `0` for `NaN`.

---

## 6. Related Terms

- [`TryFrom` / `TryInto`](../level_14/tryfrom_tryinto.md) — The fallible, `Result`-returning alternative that never silently loses data.
- [Integer Overflow Semantics](../level_01/integer_overflow.md) — The `checked_`/`wrapping_`/`saturating_` method families that make truncation an explicit choice instead of an `as`-cast accident.
- [`From` / `Into` Traits](../level_04/from_into_traits.md) — The *lossless*, guaranteed-safe conversion traits; prefer these over `as` whenever the target type can represent every source value.

---

## 7. Key Takeaways

- `as` performs **explicit, silent, infallible** primitive conversions — it never panics and never returns a `Result`.
- Narrowing integer casts (`i64 as u8`) **truncate** by discarding high-order bits (wrapping, like modular arithmetic).
- Float-to-int casts **truncate toward zero** and **saturate** at the target type's bounds instead of producing Undefined Behavior.
- If correctness matters more than raw speed, reach for `TryFrom`/`TryInto` or the `checked_`/`saturating_` method families instead.
