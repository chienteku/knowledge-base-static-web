# `ZSTs` (Zero-Sized Types)

> **Level 11 — Smart Pointers & Advanced Types**
> Types that occupy 0 bytes in memory — optimized away at runtime, yet essential for compile-time markers and state tracking.

---

## 1. Prerequisites

- [Unit Type (`()`)](../level_01/unit_type.md) — The most basic ZST, and the one every Rust programmer meets first.
- [`PhantomData<T>`](../level_11/phantomdata_t.md) — The flagship "deliberately zero-sized" type used to carry compile-time-only information.
- [Monomorphization](../level_04/monomorphization.md) — Part of why ZSTs cost nothing at runtime.

---

## 2. Term Category

**Memory Layout Category (the free type)**: A Zero-Sized Type is any type whose instances take up **exactly 0 bytes** of memory. They still exist fully at the type level — the compiler tracks them, enforces their trait bounds, and uses them for type safety — but at runtime, creating a million of them costs exactly as much memory as creating zero.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Sometimes you want a type purely to carry *information the compiler should check*, with no actual data to store at runtime. The unit type `()` is the simplest example — it conveys "this computation finished, no interesting value resulted." A unit struct like `struct Marker;` is the same idea, but nameable and distinguishable from other markers. Rust leans into this pattern deliberately: because these types provably hold zero bytes of information, the compiler can (and does) optimize them away entirely — no allocation, no memory read, sometimes not even a machine instruction — while still using them at compile time to enforce invariants, tag types, and drive generic logic. This is a cornerstone of Rust's "pay only for what you use" philosophy: type-level bookkeeping with zero runtime footprint.

### (2) Reality Metaphor

Imagine a company that uses colored sticky-note flags to categorize physical folders on a shelf, but the flags themselves are made of a special material that has **zero weight and zero volume** — you can stick a thousand of them on a folder and the folder's weight never changes.

- **The folder** (your actual data) is what takes up real physical shelf space.
- **The sticky-note flag** (a ZST like `PhantomData<T>` or a unit struct) carries real, useful information — "this folder has been legally reviewed," "this folder is classified Type-A" — that a filing clerk (**the compiler**) can check and enforce rules around, without the flag itself ever costing you an ounce of shelf space or shipping weight.

### (3) Rust Code Examples

#### Short Snippet (Proving Zero Size)
```rust
struct Marker; // A unit struct — zero fields, zero bytes.

fn main() {
    use std::mem::size_of;

    println!("{}", size_of::<()>());      // 0
    println!("{}", size_of::<Marker>());   // 0

    // You can create as many as you want — costs nothing:
    let markers: Vec<Marker> = (0..1_000_000).map(|_| Marker).collect();
    println!("{}", size_of::<Vec<Marker>>()); // Still just the Vec's own 24-byte header!
}
```

#### Fuller Example (`HashSet<T>` Is Secretly `HashMap<T, ()>`)
```rust
use std::collections::HashMap;

fn main() {
    // A HashSet doesn't need to store any VALUE per key — just "is this key present?"
    // So the standard library literally implements HashSet<T> as HashMap<T, ()>.
    // The `()` value costs ZERO extra bytes per entry, compared to a "real" set structure.
    let mut set_like: HashMap<&str, ()> = HashMap::new();
    set_like.insert("apple", ());
    set_like.insert("banana", ());

    println!("{}", set_like.contains_key("apple")); // true
    // This is EXACTLY what HashSet::insert / HashSet::contains do internally.
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Zsts Scoping and Lifecycle Rules

**The mistake:** Assuming Zsts instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("zsts_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("zsts_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Zsts State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Zsts through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Zsts Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Zsts instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Spot the ZST

**Problem:** Which of these types are Zero-Sized Types?
```rust
struct A;
struct B { x: () }
struct C { x: i32 }
enum D { OnlyVariant }
```

> [!check]- Answer
> **`A`, `B`, and `D` are all ZSTs.**
>
> - `A` — an empty unit struct, trivially zero-sized.
> - `B` — its one field is `()`, itself zero-sized, so `B` as a whole is also zero-sized.
> - `D` — an enum with exactly **one** variant and no payload needs no discriminant tag to distinguish variants (there's only ever one possibility), so it compiles down to zero bytes too.
> - `C` is **not** a ZST — it holds a real `i32`, so it's 4 bytes.

---

### Exercise 2: Measuring Zero-Sized Type Memory Sizes

**Problem:** Print `size_of::<()>()` and `size_of::<PhantomData<String>>()`.

**Expected output:**
> [!check]- Answer
> ```
> Unit size: 0, PhantomData size: 0
> ```
> ```rust
> use std::mem::size_of;
> use std::marker::PhantomData;
> fn main() {
>     println!("Unit size: {}, PhantomData size: {}", size_of::<()>(), size_of::<PhantomData<String>>());
> }
> ```
>
> **Explanation:** ZSTs take up 0 bytes in compiled binary memory layouts.

---

### Exercise 3: Zero-Allocation Collections with ZSTs

**Problem:** Push 1,000 unit elements `()` into `Vec<()>` and check vector capacity.

**Expected output:**
> [!check]- Answer
> ```
> Vec<()> len: 1000
> ```
> ```rust
> fn main() {
>     let mut v = Vec::new();
>     for _ in 0..1000 { v.push(()); }
>     println!("Vec<()> len: {}", v.len());
> }
> ```
>
> **Explanation:** `Vec<()>` stores counts without allocating memory for elements.

---

## 6. Related Terms

- [Unit Type (`()`)](../level_01/unit_type.md) / [Unit Struct](../level_02/unit_struct.md) — The two most common, everyday ZSTs.
- [`PhantomData<T>`](../level_11/phantomdata_t.md) — The purpose-built ZST for carrying type/lifetime information with zero runtime cost.
- [Type-State Pattern](../level_14/type_state_pattern.md) — A design pattern that leans heavily on ZSTs to encode state transitions the compiler can verify for free.
- [Monomorphization](../level_04/monomorphization.md) / [Zero-Cost Abstractions](../level_15/zero_cost_abstractions.md) — The broader optimization philosophy ZSTs are one concrete expression of.

---

## 7. Key Takeaways

- A Zero-Sized Type occupies exactly 0 bytes at runtime, while still existing fully at the type level for the compiler to check.
- `()`, field-less unit structs, and single-variant payload-less enums are all common examples.
- `HashSet<T>` is literally `HashMap<T, ()>` internally — the ZST value costs nothing extra per entry.
- ZSTs let you encode compile-time-only information (markers, type tags, state) with zero runtime memory or performance cost.
