# `Fat Pointers` (Wide Pointers)

> **Level 11 — Smart Pointers & Advanced Types**
> Pointers that store both a memory address and extra metadata — the mechanism that makes Dynamically Sized Types usable.

---

## 1. Prerequisites

- [Dynamically Sized Types (DSTs)](../level_11/dynamically_sized_types.md) — What fat pointers exist to point at.
- [Slice (`&[T]`, `&str`)](../level_03/slice.md) — The most common concrete example of a fat pointer.
- [Trait Objects (`dyn Trait`)](../level_04/trait_objects.md) — The other major fat-pointer use case.

---

## 2. Term Category

**Memory Layout (the two-word pointer)**: A normal Rust reference (`&i32`) is a single machine word — just an address. A fat pointer is **two** words: an address, plus one more word of metadata. This extra word is precisely what lets a pointer refer to a type whose size isn't known until runtime.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

A `&[i32]` needs to answer two questions the moment you use it: "where does the data start?" and "how many elements are there?" A plain address alone can only answer the first question. Rather than inventing a special, different-shaped reference type just for slices, Rust generalizes: any reference to a Dynamically Sized Type is automatically a **fat pointer** — an address plus whatever metadata that specific DST needs. For `[T]`, the metadata is a `usize` length. For `str` (which is just `[u8]` with a UTF-8 guarantee), it's also a length. For `dyn Trait`, the metadata is instead a pointer to a **vtable** — a lookup table of function pointers for that trait's methods on the concrete type being stored. This is why `&dyn Trait` and `&[T]` are both twice the size of an ordinary `&T`, but for entirely different reasons: one carries a length, the other carries a vtable pointer.

### (2) Reality Metaphor

Imagine two kinds of shipping labels for packages of unknown size.

- **A thin pointer (`&i32`)** is a label with just a warehouse shelf address — enough, because every box on that kind of shelf is a guaranteed identical, standard size.
- **A fat pointer for a slice (`&[T]`)** is a label with the shelf address **plus a note: "this shipment spans exactly 12 boxes starting here"** — necessary, because shipments on this kind of shelf can be any length.
- **A fat pointer for a trait object (`&dyn Trait`)** is a label with the shelf address **plus a laminated instruction card** taped to it: "to operate this specific package, use *these* exact procedures" (**the vtable**) — because the box might be a `Dog` or an `Elephant`, and the label needs to carry along the right operating instructions for whichever one it actually is.

### (3) Rust Code Examples

#### Short Snippet (Measuring the Size Difference)
```rust
fn main() {
    use std::mem::size_of;

    println!("{}", size_of::<&i32>());      // 8 bytes (on 64-bit): just an address.
    println!("{}", size_of::<&[i32]>());    // 16 bytes: address + length (usize).
    println!("{}", size_of::<&str>());      // 16 bytes: same shape as &[u8].

    trait Speak { fn say(&self); }
    struct Dog;
    impl Speak for Dog { fn say(&self) { println!("Woof"); } }
    println!("{}", size_of::<&dyn Speak>()); // 16 bytes: address + vtable pointer.
}
```

#### Fuller Example (Two Different Kinds of "Second Word")
```rust
trait Animal { fn sound(&self) -> &str; }
struct Cat;
impl Animal for Cat { fn sound(&self) -> &str { "Meow" } }

fn main() {
    let numbers = [1, 2, 3, 4, 5];

    // Fat pointer #1: address + LENGTH metadata.
    let slice: &[i32] = &numbers[1..4];
    println!("{:?}", slice); // [2, 3, 4] — the length (3) travels WITH the pointer.

    // Fat pointer #2: address + VTABLE metadata (totally different second word!).
    let cat = Cat;
    let animal: &dyn Animal = &cat;
    println!("{}", animal.sound()); // "Meow" — found via the vtable, not a length.
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Fat Pointers Scoping and Lifecycle Rules

**The mistake:** Assuming Fat Pointers instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("fat_pointers_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("fat_pointers_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Fat Pointers State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Fat Pointers through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Fat Pointers Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Fat Pointers instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Predict the Metadata

**Problem:** For each type below, is its reference a thin or fat pointer, and if fat, what's the extra metadata word?
1. `&u64`
2. `&[u8]`
3. `&dyn std::fmt::Display`
4. `&String`

> [!check]- Answer
> 1. `&u64` → **thin** (8 bytes) — `u64` is `Sized`.
> 2. `&[u8]` → **fat** (16 bytes) — metadata is a `usize` **length**.
> 3. `&dyn std::fmt::Display` → **fat** (16 bytes) — metadata is a **vtable pointer**.
> 4. `&String` → **thin** (8 bytes) — `String` itself is a plain, fixed-size, `Sized` struct (a pointer + length + capacity *inside* it); the reference *to* the struct is just one address. Its *contents* (the underlying `str` data) is a DST, but that's a separate, internal detail — `&String` itself does not need to be fat.

---

### Exercise 2: Measuring Slice Fat Pointer Sizes

**Problem:** Print `std::mem::size_of::<&[i32]>()` versus `std::mem::size_of::<&i32>()`.

**Expected output:**
> [!check]- Answer
> ```
> Thin ptr: 8, Fat ptr: 16
> ```
> ```rust
> use std::mem::size_of;
> fn main() {
>     println!("Thin ptr: {}, Fat ptr: {}", size_of::<&i32>(), size_of::<&[i32]>());
> }
> }
> ```
>
> **Explanation:** Slice references `&[T]` store pointer + length metadata, taking 2 pointer words.

---

### Exercise 3: Trait Object Fat Pointer Inspection

**Problem:** Print `size_of::<&dyn std::fmt::Display>()` showing vtable pointer overhead.

**Expected output:**
> [!check]- Answer
> ```
> Trait object fat ptr size: 16
> ```
> use std::mem::size_of;
> fn main() {
>     println!("Trait object fat ptr size: {}", size_of::<&dyn std::fmt::Display>());
> }
> ```
>
> **Explanation:** Trait object references store data pointer + vtable pointer.

---

---

## 6. Related Terms

- [Dynamically Sized Types (DSTs)](../level_11/dynamically_sized_types.md) — What fat pointers exist specifically to make usable.
- [Slice (`&[T]`, `&str`)](../level_03/slice.md) — The length-metadata flavor of fat pointer.
- [Trait Objects (`dyn Trait`)](../level_04/trait_objects.md) — The vtable-metadata flavor of fat pointer.
- [Object Safety](../level_04/object_safety.md) — The rule set that keeps a trait's vtable (and thus its fat pointers) well-formed.

---

## 7. Key Takeaways

- A fat pointer is twice the size of a normal reference: an address, plus one word of metadata.
- For slices and `str`, the metadata is a **length**. For trait objects, it's a **vtable pointer** — two structurally different kinds of "extra word."
- Fat pointers are exactly what makes referencing a Dynamically Sized Type possible at all.
- `String`, `Vec<T>`, and `Box<T>` (pointing at a `Sized` `T`) are themselves ordinary, thin, `Sized` types — don't confuse an owned collection's own size with the (potentially fat) pointer it holds internally.
