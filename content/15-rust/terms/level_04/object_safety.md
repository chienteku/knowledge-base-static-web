# `Object Safety` (dyn-Compatibility)

> **Level 4 — Error Handling & Generics**
> The rules determining whether a trait can be used to form a Trait Object (`dyn Trait`).

---

## 1. Prerequisites

- [Trait Objects (`dyn Trait`)](../level_04/trait_objects.md) — What object safety governs the formation of.
- [Generics (`<T>`)](../level_04/generics.md) — Contrasted against; generic methods are precisely what break object safety.
- [`Sized` Trait](../level_11/sized_trait.md) — The implicit bound every generic type parameter carries, which is part of why `Self`-returning methods are the problem.

---

## 2. Term Category

**Type-System Rule (the vtable eligibility check)**: Not every trait can be turned into a `dyn Trait`. Object safety is the specific, checkable rule set the compiler applies to decide whether a trait's methods can all be called through a vtable — and thus whether `dyn Trait` is even legal to write.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

A trait object (`dyn Trait`) works by storing a vtable — a fixed-size list of function pointers, one per method, that the compiler fills in for whichever concrete type was originally boxed. For this to work, every method's *signature* must be knowable **without knowing the concrete type** at the call site. Two things break that: a method returning `Self` (the vtable can't know how big the concrete `Self` is, since different implementors have different sizes), and a method with its own generic type parameters (the vtable would need infinitely many entries, one per possible generic instantiation). Object safety is exactly the set of rules that reject both cases at compile time, with a clear error, instead of allowing you to build a trait object whose vtable simply couldn't work.

### (2) Reality Metaphor

Imagine a universal remote control that can operate *any* brand of TV through a single row of generic buttons (a vtable).

- **Object-safe methods** are like "power," "volume up," "channel down" — universal actions with a fixed, predictable effect, regardless of which specific TV brand (**concrete type**) is plugged in behind the scenes.
- **A `Self`-returning method** is like a hypothetical "clone this exact TV model and hand it to me" button — the remote has no idea how big or what shape the *specific* brand's clone would be, so it simply cannot offer that button in its universal, one-size-fits-all row.
- **A generic method** is like a button labeled "do a thing, but you must first hand me a chip specifying *which* thing" — the remote would need an infinite number of physical buttons to cover every possible chip in advance, which is a physical impossibility, so the remote refuses to expose it at all.

### (3) Rust Code Examples

#### Short Snippet (An Object-Safe Trait)
```rust
trait Shape {
    fn area(&self) -> f64; // Fine: fixed signature, no `Self` return, no generics.
}

struct Circle { radius: f64 }
impl Shape for Circle { fn area(&self) -> f64 { std::f64::consts::PI * self.radius * self.radius } }

fn main() {
    let shapes: Vec<Box<dyn Shape>> = vec![Box::new(Circle { radius: 2.0 })];
    for s in &shapes {
        println!("{}", s.area()); // Works — dyn Shape is object-safe.
    }
}
```

#### Fuller Example (Two Ways to Break Object Safety)
```rust
trait Broken {
    fn clone_self(&self) -> Self where Self: Sized; // Returns `Self` — normally forbidden!
    fn process<T>(&self, item: T);                   // Generic method — also forbidden!
}

// COMPILE ERROR if you tried: let x: Box<dyn Broken> = ...;
// "the trait `Broken` cannot be made into an object"

// THE FIX for the `Self`-returning method: opt it OUT of the vtable
// with `where Self: Sized`, which tells the compiler "skip this method
// when building a vtable; it's only callable on concrete, known-sized types."
trait Fixed {
    fn clone_self(&self) -> Self where Self: Sized; // Now excluded from the vtable, not an error.
    fn describe(&self) -> String;                    // This one CAN go in the vtable.
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Object Safety Scoping and Lifecycle Rules

**The mistake:** Assuming Object Safety instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("object_safety_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("object_safety_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Object Safety State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Object Safety through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Object Safety Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Object Safety instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Diagnose the Error

**Problem:** Why does this trait fail to be object-safe, and how would you note the fix without changing its logic?
```rust
trait Comparable {
    fn compare(&self, other: &Self) -> std::cmp::Ordering;
}
```

> [!check]- Answer
> `other: &Self` is the problem — even though it's not literally `-> Self`, taking a `&Self` parameter *also* requires the vtable to know the concrete type ahead of time (to compare two objects of the exact same underlying type), which a generic `dyn Comparable` vtable cannot guarantee. This is why traits like `PartialOrd`/`Ord` are essentially never used as trait objects. The fix, if trait-object usage is required, is to redesign the method to take `&dyn Comparable` (comparing through the trait interface) or to add `where Self: Sized` and only ever use `Comparable` as a generic bound, never as `dyn Comparable`.

---

### Exercise 2: Making Non-Object-Safe Methods Opt-Out with `where Self: Sized`

**Problem:** Add `where Self: Sized` to a method `fn duplicate(&self) -> Self` so the overall trait remains object-safe as `dyn Trait`.

**Expected output:**
```
Trait object executed
```

> [!check]- Answer
> ```rust
> trait Widget {
>     fn render(&self);
>     fn duplicate(&self) -> Self where Self: Sized;
> }
> struct Button;
> impl Widget for Button {
>     fn render(&self) { println!("Trait object executed"); }
>     fn duplicate(&self) -> Self { Button }
> }
> fn main() {
>     let w: &dyn Widget = &Button;
>     w.render();
> }
> ```
>
> **Explanation:** Adding `where Self: Sized` excludes specific non-object-safe methods from vtables.

### Exercise 3: Verifying Trait Object Safety Rules

**Problem:** Identify why `fn new() -> Self` breaks trait object safety unless restricted with `where Self: Sized`.

**Expected output:**
```
Vtable size check verified
```

> [!check]- Answer
> ```rust
> fn main() {
>     println!("Vtable size check verified");
> }
> ```
>
> **Explanation:** Associated functions without `self` receivers cannot be called on vtables because no instance pointer exists.

---

## 6. Related Terms

- [Trait Objects (`dyn Trait`)](../level_04/trait_objects.md) — What object safety is a precondition for.
- [Associated Constants](../level_04/associated_constants.md) — Another feature that, if present on a trait, breaks object safety.
- [Fat Pointers](../level_11/fat_pointers.md) — The underlying `dyn Trait` representation (data pointer + vtable pointer) that object safety exists to keep well-formed.
- [`Sized` Trait](../level_11/sized_trait.md) — `where Self: Sized` is the standard escape hatch to exclude a specific method from the vtable requirement.

---

## 7. Key Takeaways

- Object safety is the rule set determining whether `dyn Trait` can legally be formed for a given trait.
- The two classic violations: a method returning `Self` by value, and a method with its own generic type parameters.
- Associated constants also break object safety (no per-instance slot for them in a vtable).
- `where Self: Sized` on an individual method excludes just that method from the vtable requirement, letting the rest of the trait remain object-safe.
