# Trait Objects (`dyn Trait`)

> **Level 4 — Error Handling & Generics**
> Dynamic dispatch via a vtable; enables runtime polymorphism at the cost of static dispatch performance.

---

## 1. Prerequisites

- [Trait](../level_04/trait.md) — The shared behavior that groups the objects together.
- [Monomorphization](../level_04/monomorphization.md) — The "static" system that Trait Objects exist to bypass.
- [`Box<T>`](../level_03/box_t.md) — The smart pointer almost universally used to store Trait Objects.

---

## 2. Term Category

**Rust-specific (the polymorphism engine)**: We learned previously that Rust strongly prefers "Monomorphization" (creating hard-coded, zero-cost copies of generic functions at compile time). But what happens when you need to put *multiple different types* into a single `Vec`? Monomorphization physically cannot do this. Trait Objects (`dyn Trait`) exist to provide true Object-Oriented Polymorphism at runtime.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Imagine you are writing a User Interface library. You have a `Button` struct, a `TextField` struct, and a `Checkbox` struct. They all implement a `Widget` trait. 

You want to store them all in a single array so you can loop through and draw them: `Vec<Widget>`.

If you try this, the Rust compiler will instantly reject your code. **Arrays and Vectors require every single element to be the exact same size in bytes!** A `TextField` takes up more memory than a `Checkbox`. The compiler cannot put them in the same array. 

How do we solve this? We use **pointers**! A pointer to a massive `TextField` and a pointer to a tiny `Checkbox` are the exact same size (e.g., 8 bytes). 

We wrap our widgets in a `Box` and declare the array as `Vec<Box<dyn Widget>>`. The `dyn` stands for "Dynamic". The compiler no longer cares what the underlying data is; it just knows there is a pointer to *something* that implements `Widget`. This allows you to cleanly mix different types in a single collection.

### (2) Reality Metaphor

**Monomorphization** (Generics) is like building three separate, specialized cash registers: one that only accepts Dollars, one that only accepts Euros, and one that only accepts Yen. It is incredibly fast, but inflexible. You can't put Dollars in the Euro register.

**Trait Objects (`dyn Trait`)** are like hiring a human cashier with a smartphone currency converter. You can hand them a bucket containing *any* mixture of currencies in the world. It takes them slightly longer to process the transaction (because they have to look up the exchange rate dynamically at runtime), but you only need one cashier for the entire store, and they can handle the mixed bucket perfectly.

### (3) Rust Code Examples

#### Short Snippet (The Problem and Solution)
Here is exactly why `dyn Trait` exists.

```rust
trait Animal { fn speak(&self); }
struct Dog; impl Animal for Dog { fn speak(&self) { println!("Woof"); } }
struct Cat; impl Animal for Cat { fn speak(&self) { println!("Meow"); } }

fn main() {
    // ERROR! You cannot put a Dog and a Cat in the same Vec. 
    // They are different types!
    // let animals = vec![Dog, Cat]; 
    
    // SUCCESS! We use Box to make the sizes identical, and `dyn Animal` 
    // to tell the compiler to treat them all as generic animals.
    let animals: Vec<Box<dyn Animal>> = vec![
        Box::new(Dog), 
        Box::new(Cat)
    ];
}
```

#### Fuller Example (Dynamic Dispatch in Action)
When you loop through a `Vec<Box<dyn Animal>>`, the CPU doesn't know what animal it's looking at until the exact microsecond it processes the pointer. It has to look up the correct `.speak()` method dynamically at runtime. This is called **Dynamic Dispatch**.

```rust
trait Clickable {
    fn click(&self);
}

struct Button { label: String }
impl Clickable for Button {
    fn click(&self) { println!("Button '{}' was clicked!", self.label); }
}

struct Link { url: String }
impl Clickable for Link {
    fn click(&self) { println!("Opening browser to: {}", self.url); }
}

fn main() {
    // We create a mixed collection of entirely different structs!
    let ui_elements: Vec<Box<dyn Clickable>> = vec![
        Box::new(Button { label: String::from("Submit") }),
        Box::new(Link { url: String::from("https://rust-lang.org") }),
    ];
    
    // The CPU figures out which specific `click()` method to run on the fly!
    for element in ui_elements {
        element.click();
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Trait Objects Scoping and Lifecycle Rules

**The mistake:** Assuming Trait Objects instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("trait_objects_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("trait_objects_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Trait Objects State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Trait Objects through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Trait Objects Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Trait Objects instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Mixed Bag

**Problem:** The following code tries to put an `i32` and an `f64` into the same `Vec` because they both implement the `Display` trait. Fix the compiler errors by utilizing `Box` and `dyn`.

```rust
use std::fmt::Display;

fn main() {
    // TODO: Fix the type signature of this Vec
    let mixed_numbers: Vec<Display> = vec![
        // TODO: Wrap these values correctly
        5,
        3.14
    ];
    
    for num in mixed_numbers {
        println!("{}", num);
    }
}
```

> [!check]- Answer
> ```rust
> use std::fmt::Display;
>
> fn main() {
>     // 1. We change the type signature to Box<dyn Display>
>     let mixed_numbers: Vec<Box<dyn Display>> = vec![
>         // 2. We wrap the actual values in Boxes!
>         Box::new(5),
>         Box::new(3.14)
>     ];
>     
>     for num in mixed_numbers {
>         println!("{}", num);
>     }
> }
> ```

---

### Exercise 2: Heterogeneous Collections with `Box<dyn Trait>`

**Problem:** Store different structs implementing `trait Speaker { fn speak(&self) -> &str; }` inside `Vec<Box<dyn Speaker>>`.

**Expected output:**
> [!check]- Answer
> ```
> Dog: Woof
> Cat: Meow
> ```
> ```rust
> trait Speaker { fn speak(&self) -> &str; }
> struct Dog; impl Speaker for Dog { fn speak(&self) -> &str { "Woof" } }
> struct Cat; impl Speaker for Cat { fn speak(&self) -> &str { "Meow" } }
> fn main() {
>     let speakers: Vec<Box<dyn Speaker>> = vec![Box::new(Dog), Box::new(Cat)];
>     for s in speakers {
>         println!("Speaker: {}", s.speak());
>     }
> }
> ```
>
> **Explanation:** `Box<dyn Trait>` enables heterogeneous collections of types sharing a trait interface via dynamic vtable dispatch.

---

### Exercise 3: Passing Slices of Trait Objects

**Problem:** Pass `&[&dyn Speaker]` to a function iterating and invoking `.speak()`.

**Expected output:**
> [!check]- Answer
> ```
> Speaker count: 2
> ```
> ```rust
> trait Speaker { fn speak(&self) -> &str; }
> struct Dog; impl Speaker for Dog { fn speak(&self) -> &str { "Woof" } }
> fn main() {
>     let dog1 = Dog;
>     let dog2 = Dog;
>     let slice: &[&dyn Speaker] = &[&dog1, &&dog2];
>     println!("Speaker count: {}", slice.len());
> }
> ```
>
> **Explanation:** References to trait objects `&dyn Trait` form two-pointer fat pointers (data pointer + vtable pointer).

---

## 6. Related Terms

- [Monomorphization](../level_04/monomorphization.md) — The static dispatch alternative to Trait Objects. It is much faster, but completely inflexible (you cannot mix types in a `Vec`).
- [`Box<T>`](../level_03/box_t.md) — The smart pointer almost universally used to store Trait Objects on the heap so they all have a uniform size.

---

## 7. Key Takeaways

- `dyn Trait` (Trait Objects) allow you to store multiple *entirely different* types in the exact same collection, as long as they all implement the same trait.
- Because different types have different sizes in bytes, Trait Objects **must** be stored behind a pointer (like `Box<dyn Trait>` or `&dyn Trait`).
- They use **Dynamic Dispatch**: the CPU has to do a tiny bit of extra work at runtime (using a "vtable") to figure out which specific method to call. This makes them slightly slower than Generics, but incredibly flexible.
