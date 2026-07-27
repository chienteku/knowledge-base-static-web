# Associated Constants

> **Level 4 — Error Handling & Generics**
> `const` items declared inside a trait or `impl` block — the third member of the "associated items" family, alongside associated types and functions.

---

## 1. Prerequisites

- [Associated Types](../level_04/associated_types.md) — The sibling "associated item" this generalizes the idea from.
- [Associated Function](../level_02/associated_function.md) — The other sibling.
- [Constants (`const`)](../level_01/constants_const.md) — The underlying `const` mechanism being attached to a trait/type.

---

## 2. Term Category

**Trait/Type Feature (the third associated item)**: Rust lets a trait or `impl` block declare three kinds of "associated items," each attached to the type rather than to any specific instance: associated **functions** (behavior), associated **types** (a placeholder type), and associated **constants** (a fixed value). Associated constants are simply the value-level member of that family.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Many types have natural, fixed configuration values — the maximum representable value of an integer type, the identity element for a mathematical operation, a default buffer size for a particular implementation. Before associated constants, the only way to express "every implementor of this trait must provide a specific fixed value" was an associated *function* returning that value (`fn max_value() -> Self`), which is needlessly indirect for something that's genuinely a compile-time constant, not computed logic. Associated constants let a trait declare `const MAX: Self;` directly, and each implementor supplies the actual value with `const MAX: Self = ...;` — giving you a real, inlinable, compile-time constant, accessed with the same `Type::CONST` syntax already familiar from `i32::MAX` and `f64::EPSILON` (both of which are themselves inherent associated constants).

### (2) Reality Metaphor

Imagine a franchise contract that every branch of a chain restaurant must sign.

- **Associated functions** are like required *services* every branch must offer — "must be able to prepare a burger" — the specific steps can vary by branch, but the capability is guaranteed.
- **Associated types** are like a required *category* each branch must specify — "must declare which cuisine type you serve" — a placeholder each branch fills in with something specific.
- **Associated constants** are like a required *fixed number* stamped on the contract — "must post your legal maximum seating capacity" — not a service to perform, not a category to declare, just an immutable fact baked permanently into that branch's specific franchise agreement.

### (3) Rust Code Examples

#### Short Snippet (Declaring and Implementing)
```rust
trait Bounded {
    const MIN: Self;
    const MAX: Self;
}

impl Bounded for u8 {
    const MIN: Self = 0;
    const MAX: Self = 255;
}

fn main() {
    println!("{} to {}", u8::MIN, u8::MAX); // 0 to 255
    // (u8::MIN/MAX already exist inherently in std — this reimplements the idea!)
}
```

#### Fuller Example (Using Associated Constants Generically)
```rust
trait Shape {
    const SIDES: u32;
    fn describe() -> String {
        // A trait can even provide a DEFAULT method that uses the constant!
        format!("This shape has {} sides", Self::SIDES)
    }
}

struct Triangle;
impl Shape for Triangle { const SIDES: u32 = 3; }

struct Square;
impl Shape for Square { const SIDES: u32 = 4; }

fn print_sides<T: Shape>() {
    println!("{}", T::describe()); // Works for ANY T that implements Shape.
}

fn main() {
    print_sides::<Triangle>(); // This shape has 3 sides
    print_sides::<Square>();   // This shape has 4 sides
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Associated Constants Scoping and Lifecycle Rules

**The mistake:** Assuming Associated Constants instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("associated_constants_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("associated_constants_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Associated Constants State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Associated Constants through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Associated Constants Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Associated Constants instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Give a Default Value

**Problem:** Traits can give associated constants a *default* value, just like default methods. Add a default for `SIDES` in the `Shape` trait above so that implementors don't have to specify it unless they want to override it.

> [!check]- Answer
> ```rust
> trait Shape {
>     const SIDES: u32 = 0; // Default value, usable if an impl doesn't override it.
>     fn describe() -> String {
>         format!("This shape has {} sides", Self::SIDES)
>     }
> }
>
> struct Circle; // Doesn't specify SIDES — inherits the default (0).
> impl Shape for Circle {}
>
> fn main() {
>     println!("{}", Circle::describe()); // "This shape has 0 sides"
> }
> ```

---

### Exercise 2: Trait Associated Constant Definition

**Problem:** Define a trait `Limit` with `const MAX_SIZE: usize;`. Implement it for `Buffer` with `MAX_SIZE = 1024`.

**Expected output:**
```
Max size: 1024
```

> [!check]- Answer
> ```rust
> trait Limit { const MAX_SIZE: usize; }
> struct Buffer;
> impl Limit for Buffer { const MAX_SIZE: usize = 1024; }
> fn main() {
>     println!("Max size: {}", Buffer::MAX_SIZE);
> }
> ```
>
> **Explanation:** Associated constants bind constant value contracts directly to trait definitions.

### Exercise 3: Generic Bounds on Associated Constants

**Problem:** Write a generic function `fn get_limit<T: Limit>() -> usize { T::MAX_SIZE }`.

**Expected output:**
```
Limit: 1024
```

> [!check]- Answer
> trait Limit { const MAX_SIZE: usize; }
> struct Buffer;
> impl Limit for Buffer { const MAX_SIZE: usize = 1024; }
> fn get_limit<T: Limit>() -> usize { T::MAX_SIZE }
> fn main() {
>     println!("Limit: {}", get_limit::<Buffer>());
> }
> ```
>
> **Explanation:** Generic trait bounds allow functions to query trait-associated constants at compile time.

---

## 6. Related Terms

- [Associated Types](../level_04/associated_types.md) — The type-level sibling of this value-level associated item.
- [Associated Function](../level_02/associated_function.md) — The behavior-level sibling.
- [Object Safety](../level_04/object_safety.md) — What associated constants are documented as breaking.
- [Constants (`const`)](../level_01/constants_const.md) — The base mechanism associated constants attach to traits/impls.

---

## 7. Key Takeaways

- Associated constants (`const NAME: Type;` inside a trait, implemented with `const NAME: Type = value;`) are the value-level member of Rust's "associated items" family.
- They're accessed with the same `Type::CONST` syntax as inherent constants like `i32::MAX`.
- Traits can give them default values, just like default methods.
- A trait with any associated constant is **not object-safe** — it cannot be used as `dyn Trait`, only as a generic bound.
