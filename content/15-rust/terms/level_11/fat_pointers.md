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

### Exercise 2: Measuring and Predicting Fat Pointer Sizes

**Problem:**
Before running any code, predict the size in bytes of each reference type below (assume a 64-bit system where a single pointer is 8 bytes). Then write a `main` function that prints the actual sizes to verify your predictions.

| Type | Your prediction |
|---|---|
| `&i32` | ? bytes |
| `&[i32]` | ? bytes |
| `&str` | ? bytes |
| `&dyn std::fmt::Debug` | ? bytes |

**Expected output:**
> [!check]- Answer
> ```text
> &i32              : 8 bytes  (thin — 1 pointer word)
> &[i32]            : 16 bytes (fat  — pointer + length)
> &str              : 16 bytes (fat  — pointer + length)
> &dyn Debug        : 16 bytes (fat  — pointer + vtable)
> ```
>
> - **Hint 1:** A *thin* pointer carries only a data address — one pointer word (8 bytes on 64-bit). A *fat* pointer carries a data address **plus** one extra metadata word — two pointer words (16 bytes). Any reference to a `Sized` type is thin; any reference to a DST is fat.
> - **Hint 2:** `str` and `[i32]` are both DSTs: their length isn't known at compile time, so the reference must carry it as metadata. `&str` and `&[i32]` are therefore both fat pointers (16 bytes each), even though `str` and `[i32]` are different types.
> - **Hint 3:** `&dyn Trait` is also fat (16 bytes), but its metadata word is a **vtable pointer** — not a length. This is the structural difference between the two kinds of fat pointer.
>
> ```rust
> use std::mem::size_of;
>
> fn main() {
>     println!("&i32              : {} bytes  (thin — 1 pointer word)",  size_of::<&i32>());
>     println!("&[i32]            : {} bytes (fat  — pointer + length)", size_of::<&[i32]>());
>     println!("&str              : {} bytes (fat  — pointer + length)", size_of::<&str>());
>     println!("&dyn Debug        : {} bytes (fat  — pointer + vtable)", size_of::<&dyn std::fmt::Debug>());
> }
> ```
>
> **Explanation:**
> `size_of::<&T>()` measures the size of the *reference itself*, not the data it points to. For `&i32`, the reference is just one 8-byte address. For `&[i32]` and `&str`, the reference is a fat pointer: an 8-byte data address plus an 8-byte `usize` length field. For `&dyn Trait`, the reference is also 16 bytes but structured differently: an 8-byte data address plus an 8-byte pointer to the *vtable* — the lookup table of function pointers for that concrete type's trait implementation.

---

### Exercise 3: Dissecting a Trait Object Fat Pointer

**Problem:**
A `&dyn Trait` fat pointer is 16 bytes on 64-bit — but what are those two 8-byte words, exactly? Answer the following and then write code to verify the size claim:

1. What does the **first word** of a `&dyn Trait` fat pointer contain?
2. What does the **second word** contain? Describe at least three things stored in that structure.
3. Why does the vtable approach mean Rust can call the *correct* method implementation at runtime, even though the concrete type has been erased?

Verify the size with `size_of::<&dyn std::fmt::Display>()`.

**Expected output:**
> [!check]- Answer
> ```text
> &dyn Display fat pointer: 16 bytes
> ```
>
> - **Hint 1:** The first word is a raw data pointer (`*const ()`) — the address of the concrete value on the stack or heap. This is identical to what a thin pointer contains.
> - **Hint 2:** The second word is a pointer to a **vtable** — a static, read-only table generated by the compiler once per `(ConcreteType, Trait)` pair. It contains: (a) a pointer to the concrete type's `drop` implementation, (b) the concrete type's size and alignment (for the allocator), and (c) one function pointer per trait method (`fmt` in the case of `Display`).
> - **Hint 3:** At the call site `dyn_ref.fmt(...)`, Rust dereferences the vtable pointer and calls the function pointer at the correct offset — just like a C++ virtual dispatch table. The concrete type's identity has been erased, but the vtable preserves all the method pointers needed to call it correctly.
>
> ```rust
> use std::mem::size_of;
>
> fn main() {
>     // A &dyn Display is always 16 bytes regardless of what concrete type is behind it.
>     let size = size_of::<&dyn std::fmt::Display>();
>     println!("&dyn Display fat pointer: {} bytes", size);
>
>     // To see the vtable in action: both u32 and &str implement Display,
>     // but they have completely different vtables. The fat pointer carries
>     // the right vtable for each, so the correct `fmt` is called.
>     let x: &dyn std::fmt::Display = &42_u32;
>     let y: &dyn std::fmt::Display = &"hello";
>     println!("{}", x); // calls u32::fmt via x's vtable
>     println!("{}", y); // calls str::fmt via y's vtable
> }
> ```
>
> **Explanation:**
> The vtable is what makes `dyn Trait` dynamic dispatch work. When the compiler monomorphizes a generic `<T: Display>` function, it inlines the exact `Display::fmt` at the call site — zero overhead. When you use `&dyn Display`, the compiler cannot inline because it doesn't know the concrete type at compile time. Instead, every call goes through the vtable pointer in the fat pointer's second word, adding one extra indirection. This is the only performance cost of `dyn Trait` versus generics — the vtable pointer lookup itself.

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
