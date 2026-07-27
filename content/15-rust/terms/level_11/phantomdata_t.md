# `PhantomData<T>`

> **Level 11 — Smart Pointers & Advanced Types**
> Zero-sized type used to signal ownership or lifetime relationships to the compiler.

---

## 1. Prerequisites

- [Zero-Sized Types](../level_02/unit_struct.md) — Types that take up 0 bytes of memory (like `()`).
- [Generics](../level_04/generics.md) — The `<T>` syntax that `PhantomData` interacts with.
- [Lifetimes](../level_05/lifetime.md) — The `'a` annotations that `PhantomData` can also simulate.

---

## 2. Term Category

**Rust-specific (the invisible ghost)**: `PhantomData` is a literal ghost. 

It is a Zero-Sized Type (ZST), meaning it takes up exactly 0 bytes of memory and completely ceases to exist at runtime. However, at *compile time*, it is used to trick the Rust compiler into believing that your struct actually owns a type `T` or a lifetime `'a`, even when it doesn't!

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The Rust compiler is incredibly strict about generics. If you define a generic struct `struct MyStruct<T>`, but you don't actually use `T` inside any of the struct's fields, the compiler will throw a massive error: `parameter 'T' is never used`. 

Why would you declare a `T` without using it? 
1. **The Typestate Pattern**: Using generics to represent states (e.g., `Door<Open>` vs `Door<Closed>`) without actually storing data for them.
2. **Unsafe Pointers**: If you write a custom `Vec`, you might store a raw `*mut u8` pointer. The compiler doesn't know what type of data the pointer points to! 

To fix the compiler error without allocating any actual memory, you add a `PhantomData<T>` field to the struct. It satisfies the compiler's strict rules for zero cost.

### (2) Reality Metaphor

Imagine you are buying a plane ticket. The airline requires you to put a "Companion Name" on the ticket, but your companion is an imaginary friend.

- **Compile Error**: If you leave the Companion Name blank, the airline rejects the ticket (unused generic parameter).
- **Memory Allocation**: If you buy a second actual ticket for your imaginary friend, you waste $500.
- **`PhantomData`**: You write "Imaginary Bob" on the ticket. The airline is happy and accepts the ticket. It costs you $0 extra. When you board the plane, nobody is actually sitting next to you (Zero-Sized at runtime).

### (3) Rust Code Examples

#### Short Snippet (The Compiler Error)
The compiler demands that all generics be used. `PhantomData` is the escape hatch.

```rust
// COMPILE ERROR: parameter `State` is never used!
struct StateMachine<State> { 
    id: u32 
}

// SUCCESS! The compiler is happy, and this struct still 
// takes up the exact same amount of memory (4 bytes for the u32).
use std::marker::PhantomData;

struct StateMachineFixed<State> { 
    id: u32,
    _marker: PhantomData<State>,
}
```

#### Fuller Example (The Typestate Pattern)
This is one of the most advanced and beautiful design patterns in Rust. We use `PhantomData` to make invalid states *unrepresentable at compile time*. We create a `Car` that cannot be driven unless it is `On`!

```rust
use std::marker::PhantomData;

// Two empty structs used purely as "States"
struct Off;
struct On;

// The Car struct takes a generic State, but doesn't actually store it!
struct Car<State> {
    _marker: PhantomData<State>,
}

// We implement methods ONLY for a Car<Off>
impl Car<Off> {
    fn turn_on(self) -> Car<On> {
        println!("Turning car on!");
        Car { _marker: PhantomData }
    }
}

// We implement methods ONLY for a Car<On>
impl Car<On> {
    fn drive(&self) {
        println!("Vroom!");
    }
}

fn main() {
    let parked_car: Car<Off> = Car { _marker: PhantomData };
    
    // parked_car.drive(); // COMPILE ERROR! Car<Off> does not have a drive method!
    
    let running_car = parked_car.turn_on();
    running_car.drive(); // SUCCESS!
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Phantomdata T Scoping and Lifecycle Rules

**The mistake:** Assuming Phantomdata T instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("phantomdata_t_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("phantomdata_t_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Phantomdata T State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Phantomdata T through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Phantomdata T Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Phantomdata T instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Size

**Problem:** How many bytes of RAM does `PhantomData<String>` take up?

> [!check]- Answer
> **0 bytes**. 
>
> Even though a `String` normally takes 24 bytes, `PhantomData<String>` is a Zero-Sized Type that only exists during compilation to satisfy the type checker.

---

### Exercise 2: Compile-Time State Machines with `PhantomData`

**Problem:** Build a `struct Lock<State> { _state: PhantomData<State> }` modeling `Locked` and `Unlocked` states.

**Expected output:**
```
State machine lock compiled
```

> [!check]- Answer
> ```rust
> use std::marker::PhantomData;
> struct Locked;
> struct Unlocked;
> struct Lock<State> { _state: PhantomData<State> }
> fn main() {
>     let _l: Lock<Locked> = Lock { _state: PhantomData };
>     println!("State machine lock compiled");
> }
> ```
>
> **Explanation:** `PhantomData<T>` acts as a zero-sized marker type for generic typestate patterns.

### Exercise 3: Informing Variance with `PhantomData`

**Problem:** Use `PhantomData<fn() -> T>` to mark covariant lifetime ownership.

**Expected output:**
```
PhantomData covariance verified
```

> [!check]- Answer
> use std::marker::PhantomData;
> struct Holder<T> { _marker: PhantomData<fn() -> T> }
> fn main() {
>     println!("PhantomData covariance verified");
> }
> ```
>
> **Explanation:** `PhantomData` customizes variance and drop checker behavior for raw pointer abstractions.

---

## 6. Related Terms

- [Zero-Sized Types](../level_02/unit_struct.md) — The fundamental concept behind `PhantomData`.
- [Unsafe Rust](../level_13/unsafe_block.md) — One of the main domains where `PhantomData` is required to communicate ownership rules to the compiler.

---

## 7. Key Takeaways

- **`PhantomData<T>`** is a Zero-Sized Type (0 bytes of memory).
- It is used to trick the compiler into believing a struct uses a generic `T` or lifetime `'a`, preventing the `unused parameter` compile error.
- It completely **disappears at runtime**, having zero impact on performance or memory.
- It is critical for advanced Rust architectures like the **Typestate Pattern** (using generics to represent state).
- In `unsafe` code, it is used to manually signal ownership and `Drop` rules to the compiler.
