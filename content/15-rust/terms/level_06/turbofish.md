# Turbofish (`::<>`)

> **Level 6 — Closures & Functional Patterns**
> Explicit type annotation for generic functions/methods: `iter.collect::<Vec<_>>()`.

---

## 1. Prerequisites

- [Generics (`<T>`)](../level_04/generics.md) — The feature that requires this syntax.
- [Type Inference](../level_01/type_inference.md) — The system that usually saves you from needing this syntax.
- [Collecting](../level_02/collecting.md) — The method that requires this syntax the most frequently.

---

## 2. Term Category

**Rust-specific (the inference helper)**: 95% of the time, Rust's Type Inference is incredibly smart and can guess exactly what type you mean. But occasionally, you call a generic method and the compiler gets completely stuck. The "Turbofish" is a funny-looking syntax (`::<>`) that allows you to explicitly force a type onto a generic method call.

*(Fun fact: It is called the Turbofish because `::<>` looks like a little fish swimming incredibly fast).*

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The most common place you encounter this problem is with `.collect()`. 

The `.collect()` method is highly generic: it can build a `Vec`, a `HashSet`, a `HashMap`, a `String`, and more. If you just write `let items = iter.collect();`, the compiler throws its hands in the air and says: *"Collect into what?! A Vector? A Hash Map? I have no idea!"*

You have two ways to solve this. 
1. **Variable Annotation:** Add a type annotation to the variable: `let items: Vec<i32> = ...`
2. **The Turbofish:** Inject the type directly into the method call: `let items = iter.collect::<Vec<i32>>();`

Sometimes you don't assign the result to a variable (for example, if you instantly pass the result into another function). In those cases, you *cannot* use Variable Annotation. You are forced to use the Turbofish.

### (2) Reality Metaphor

Imagine you go to a Vending Machine (a Generic Method). You press the button that just says "Dispense Drink". 

The machine beeps angrily at you. It can dispense Coke, Sprite, or Water, but you didn't tell it which one! The machine cannot "infer" what you are thirsty for. 

The Turbofish is like swiping a special barcode card (`::<Coke>`) right over the button as you press it, so the machine knows exactly what type to dispense.

### (3) Rust Code Examples

#### Short Snippet (The `.collect()` fix)
Here is the classic compiler error and how the Turbofish fixes it.

```rust
fn main() {
    let numbers = [1, 2, 3];

    // ERROR! "type annotations needed"
    // The compiler doesn't know what kind of collection to build!
    // let doubled = numbers.iter().map(|x| x * 2).collect();

    // FIXED! We use the Turbofish to tell it to build a Vec.
    let doubled = numbers.iter().map(|x| x * 2).collect::<Vec<i32>>();
    
    // PRO TIP: You can use the `_` wildcard to say:
    // "Build a Vec, but figure out the inner type (i32) yourself!"
    let doubled_easy = numbers.iter().map(|x| x * 2).collect::<Vec<_>>();
}
```

#### Fuller Example (Parsing and Generic Functions)
The Turbofish isn't just for `.collect()`. It works on `.parse()` and standard freestanding functions too!

```rust
// A standard generic function
fn return_default<T: Default>() -> T {
    T::default()
}

fn main() {
    let text = "42";

    // 1. `.parse()` is generic. We use Turbofish to tell it to parse an i32!
    let number = text.parse::<i32>().unwrap();
    
    // 2. We can even use it on floating point numbers
    let float_number = "3.14".parse::<f64>().unwrap();

    // 3. We can use it on standard functions!
    // We want the default String (which is ""), so we pass <String> to the function.
    let default_string = return_default::<String>();
    
    // We want the default i32 (which is 0).
    let default_int = return_default::<i32>();
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Turbofish Scoping and Lifecycle Rules

**The mistake:** Assuming Turbofish instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("turbofish_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("turbofish_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Turbofish State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Turbofish through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Turbofish Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Turbofish instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Parse the string

**Problem:** The following code tries to convert a string into a float, but the compiler doesn't know what type to parse it into. Fix the code by adding a Turbofish to the `.parse()` method.

```rust
fn main() {
    let raw_input = "99.9";

    // TODO: Fix this line! Tell it to parse into an f32!
    let temperature = raw_input.parse().unwrap();
    
    println!("Temperature is {}", temperature);
}
```

> [!check]- Answer
> ```rust
> fn main() {
>     let raw_input = "99.9";
>
>     // Add ::<f32> right before the parentheses!
>     let temperature = raw_input.parse::<f32>().unwrap();
>     
>     println!("Temperature is {}", temperature);
> }
> ```

---

### Exercise 2: Turbofish Generic Method Calls

**Problem:** Parse `"100"` into `u16` using `"100".parse::<u16>().unwrap()`.

**Expected output:**
> [!check]- Answer
> ```
> Parsed: 100
> ```
> ```rust
> fn main() {
>     let val = "100".parse::<u16>().unwrap();
>     println!("Parsed: {}", val);
> }
> ```
>
> **Explanation:** `::<T>` supplies type arguments to generic methods in expression position.

---

### Exercise 3: Turbofish Collection Types

**Problem:** Collect a range `1..=3` into a `Vec<i32>` using `.collect::<Vec<i32>>()`.

**Expected output:**
> [!check]- Answer
> ```
> [1, 2, 3]
> ```
> ```rust
> fn main() {
>     let v = (1..=3).collect::<Vec<i32>>();
>     println!("{:?}", v);
> }
> ```
>
> **Explanation:** Turbofish specifies polymorphic return types for generic collector functions.

---

## 6. Related Terms

- [Type Inference](../level_01/type_inference.md) — The incredibly smart system that usually saves you from ever needing to use the Turbofish.
- [Collecting](../level_02/collecting.md) — The specific iterator method that requires the Turbofish most frequently in Rust.

---

## 7. Key Takeaways

- The Turbofish syntax is **`::<Type>`**. (It looks like a fast fish!).
- It is used to explicitly inject a type into a generic function or method when the compiler cannot infer it.
- It is most commonly seen with `.collect::<Vec<_>>()` and `.parse::<i32>()`.
- The `_` wildcard can be used inside the Turbofish (e.g., `::<Vec<_>>`) to tell the compiler the container type, but let it automatically infer the inner data type, saving you from typing out complex types!
