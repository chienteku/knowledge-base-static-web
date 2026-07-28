# Type Inference

> **Level 1 — Foundations**
> The compiler deduces types when unambiguous, reducing annotation boilerplate.

---

## 1. Prerequisites

- [Variable](../level_01/variable.md) — Named bindings to store data.
- [Scalar Types](../level_01/scalar_types.md) — The primitive data types (integers, floats, etc.) that the compiler needs to deduce.

---

## 2. Term Category

**Rust-nonspecific**: Type inference is a feature found in many modern statically-typed languages (like Swift, Kotlin, and TypeScript) designed to give developers the safety of strict types with the clean, readable syntax of dynamic languages.

---

## 3. Explanation

### (1) Design Motivation — "Why does this exist in programming languages?"

In older, statically-typed languages (like Java or C++), developers were forced to explicitly state the data type for every single variable they created. For example, you had to write `int my_number = 5;`. This was great for the compiler because it knew exactly how much memory to allocate and what operations were legal, guaranteeing safety. But for developers, writing out every single type caused "boilerplate"—tedious, repetitive typing that clogged up the screen and distracted from the actual logic of the program.

Language designers realized the compiler is actually quite smart. If you write `let my_number = 5;`, the compiler can clearly see that `5` is an integer. **Type inference** allows the compiler to automatically deduce the type based on the value you assign to it, or based on how you use the variable later on. You get 100% of the safety of strict static typing, with the clean, readable code of a dynamic language like Python. 

### (2) Reality Metaphor

Imagine walking up to the counter at a bakery. If you point to a chocolate chip cookie and say, *"I'll buy that,"* the cashier automatically infers that you are purchasing a cookie and charges you appropriately. 

You don't have to explicitly declare, *"I am initiating the purchase of a baked-good class item known as a chocolate chip cookie."* The context makes your intent completely unambiguous. Type inference is the compiler acting like the cashier, quietly figuring out what you mean based on the obvious context.

### (3) Rust Code Examples

#### Short Snippet
```rust
// The compiler infers `age` is an integer (specifically an i32 by default).
let age = 30;

// The compiler infers `is_active` is a boolean.
let is_active = true;
```

#### Fuller Example
```rust
fn main() {
    // 1. Immediate Inference:
    // Rust sees a floating-point number and defaults to `f64`.
    let temperature = 98.6; 

    // 2. Forward Inference (Rust is very smart!):
    // Here, we create an empty dynamic list (Vector). 
    // At this exact line, Rust DOES NOT know what type of data will go inside it.
    let mut scores = Vec::new(); 
    
    // ... later in the code ...
    // Because we push an integer (i32) into the list, Rust travels back in time
    // to line 9 and confidently infers that `scores` must be a `Vec<i32>`.
    scores.push(100); 

    println!("The first score is {}", scores[0]);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Not providing enough context for the compiler

**The mistake:** Calling a function that can return many different types of data, and expecting the compiler to magically guess which one you want without any hints.

**Why it's wrong:** The `.parse()` method in Rust can convert a string into almost *any* number type (`i32`, `u8`, `f64`, etc.). If you just say "parse this string," the compiler has no idea which specific type of number you need, and it will throw a `type annotations needed` error.

*Incorrect:*
```rust
// The compiler doesn't know if we want an i32, an f64, or a u8!
let parsed_number = "42".parse().unwrap(); 
```

*Fix:*
```rust
// We must manually provide a Type Annotation to help the compiler out.
let parsed_number: i32 = "42".parse().unwrap(); 
```

---

### Mistake 2: Mutating Type Inference State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Type Inference through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Type Inference Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Type Inference instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Fix the Ambiguity

**Problem:** The following code won't compile because `.collect()` can turn an iterator into many different types of collections (like a `Vec` or a `HashSet`). Fix it by adding a type annotation `: Vec<i32>` to the `even_numbers` variable.

```rust
fn main() {
    let numbers = [1, 2, 3, 4, 5, 6];
    
    // We are filtering for even numbers, but Rust doesn't know what 
    // kind of collection to "collect" them into.
    let even_numbers = numbers.into_iter().filter(|n| n % 2 == 0).collect();
    
    println!("Evens: {:?}", even_numbers);
}
```

**Expected output:**
> [!check]- Answer
> ```text
> Evens: [2, 4, 6]
> ```
> - The compiler error will say: `consider giving even_numbers a type`.
> - Change `let even_numbers = ...` to `let even_numbers: Vec<i32> = ...`.

---

### Exercise 2: Guiding Inference with Literal Suffixes

**Problem:**
Rust's type inference defaults to `i32` for integers and `f64` for floats. Use numeric literal suffixes to override these defaults so that:
1. A vector `integers` is inferred as `Vec<u64>` (not `Vec<i32>`).
2. A vector `floats` is inferred as `Vec<f32>` (not `Vec<f64>`).

Print both vectors. Then add a third line that shows the memory size of one element to confirm the types:
- `u64` is 8 bytes.
- `f32` is 4 bytes.

**Expected output:**
> [!check]- Answer
> ```text
> integers (u64): [10, 20, 30]
> floats (f32): [1.5, 2.5, 3.5]
> size of u64: 8 bytes
> size of f32: 4 bytes
> ```
>
> - **Hint 1:** Literal suffixes are written directly after the number with no space: `10_u64`, `1.5_f32`. The `_` before the suffix is optional but conventional for readability.
> - **Hint 2:** Once one element carries a suffix, Rust infers the suffix type for all other elements in the same `vec![]` — you only need to suffix the first element.
> - **Hint 3:** `std::mem::size_of::<T>()` returns the byte size of any type `T` at compile time. It never allocates and works with any concrete type.
>
> ```rust
> use std::mem;
>
> fn main() {
>     // Suffixing the first literal guides inference for the whole vec.
>     let integers = vec![10_u64, 20, 30];  // all inferred as u64
>     let floats   = vec![1.5_f32, 2.5, 3.5]; // all inferred as f32
>
>     println!("integers (u64): {:?}", integers);
>     println!("floats (f32): {:?}",   floats);
>
>     // Verify the inferred types by checking their memory footprints.
>     println!("size of u64: {} bytes", mem::size_of::<u64>());
>     println!("size of f32: {} bytes", mem::size_of::<f32>());
> }
> ```
>
> **Explanation:**
> The compiler's type inference engine resolves types from any hint within the current scope, including literal suffixes. By writing `10_u64` as the first element, the compiler fixes the element type to `u64` and uses that constraint for every other element in the literal. Without any suffix, `vec![10, 20, 30]` infers `Vec<i32>` by default — the numeric default for integers. Suffixes are the lightest-weight way to override defaults without a full type annotation like `Vec<u64>`.

---

### Exercise 3: Resolving Collector Inference Errors

**Problem:** Fix `let mapped = vec!["1", "2", "3"].into_iter().map(|s| s.parse().unwrap());` by providing partial type inference `Vec<i32>`.

**Expected output:**
> [!check]- Answer
> ```
> [1, 2, 3]
> ```
> ```rust
> fn main() {
>     let mapped: Vec<i32> = vec!["1", "2", "3"]
>         .into_iter()
>         .map(|s| s.parse().unwrap())
>         .collect();
>     println!("{:?}", mapped);
> }
> ```
>
> **Explanation:** Annotating `mapped: Vec<i32>` informs `.collect()` to create a `Vec`, which in turn tells `.parse()` inside `.map(...)` to parse strings as `i32`.

---

## 6. Related Terms

- [Type Annotation](../level_01/type_annotation.md) — The exact opposite of type inference. It's when you manually tell the compiler the specific type (`let x: i32 = 5;`).
- [Variable](../level_01/variable.md) — The named bindings that are having their types inferred.
- [Scalar Types](../level_01/scalar_types.md) — The primitive types that Rust falls back to (e.g., defaulting to `i32` for whole numbers and `f64` for decimals).

---

## 7. Key Takeaways

- Type inference allows the compiler to automatically figure out variable types, saving you from writing tedious boilerplate code.
- If you don't provide hints, Rust defaults to `i32` for whole numbers and `f64` for decimal numbers.
- Rust's inference engine is incredibly powerful; it can look ahead in your code to deduce a variable's type based on how you use it later.
- When a situation is ambiguous (like parsing a string into a number), type inference will fail, and you must step in and provide an explicit **Type Annotation**.
