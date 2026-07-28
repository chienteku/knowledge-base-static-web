# `FromStr` Trait & `.parse()`

> **Level 4 — Error Handling & Generics**
> The trait behind `str::parse::<T>()`; the standard way to turn text into a typed value.

---

## 1. Prerequisites

- [`String` vs `&str`](../level_01/string_vs_&str.md) — The text you are converting *from*.
- [`Result<T, E>`](../level_02/result_t_e.md) — Parsing is fallible, so it always returns a `Result`.
- [`From` / `Into` Traits](../level_04/from_into_traits.md) — `FromStr` is the text-specific sibling of this conversion-trait family.

---

## 2. Term Category

**Standard Library Trait (the text-to-type gateway)**: `FromStr` is the trait that powers `.parse()`. Any type that implements it can be produced from a string slice, and the compiler figures out *which* implementation to use based on how you annotate or turbofish the call. It's the standard, idiomatic answer to "how do I turn user input into a number?"

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Reading a number from a CLI argument, a config file, or stdin means starting with a `&str`. But `&str` and `i32` are utterly different in memory — there's no `as` cast that can bridge them (unlike, say, `i64 as i32`), because turning `"42"` into `42` requires actual parsing logic, and turning `"abc"` into a number should *fail*, not produce garbage. `FromStr` formalizes this: it's a trait with one method, `from_str(s: &str) -> Result<Self, Self::Err>`, that every parseable type implements. `.parse::<T>()` on `&str` is just a convenience method that calls `T::from_str()` for you.

### (2) Reality Metaphor

Imagine a customs officer at a border crossing who only accepts *typed, verified* forms — never raw, unverified paperwork.

- **The raw string** (`"42"`) is a handwritten note someone hands the officer.
- **`.parse::<i32>()`** is the officer's specialized "Numbers Department" stamp: they carefully verify the note really is a valid number, and issue you an official `i32` passport (`Ok(42)`).
- **If the note says `"forty-two"`**, the officer can't process it. They don't guess or crash the whole checkpoint — they hand you back a rejection slip explaining exactly what went wrong (`Err(ParseIntError)`), and you decide what to do next.

### (3) Rust Code Examples

#### Short Snippet (The Basic Parse)
```rust
fn main() {
    let input = "42";

    // Turbofish tells .parse() WHICH type to build.
    let number = input.parse::<i32>().unwrap();
    println!("{}", number + 8); // 50

    // A bad input returns Err instead of panicking or garbage data.
    let bad_input = "not a number";
    let result: Result<i32, _> = bad_input.parse();
    println!("{:?}", result); // Err(ParseIntError { kind: InvalidDigit })
}
```

#### Fuller Example (Implementing `FromStr` for Your Own Type)
```rust
use std::str::FromStr;

#[derive(Debug)]
struct Point { x: i32, y: i32 }

impl FromStr for Point {
    type Err = String; // The error type returned on failure.

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        // Expects input like "3,4"
        let (x_str, y_str) = s.split_once(',').ok_or("missing comma")?;

        let x = x_str.trim().parse::<i32>().map_err(|e| e.to_string())?;
        let y = y_str.trim().parse::<i32>().map_err(|e| e.to_string())?;

        Ok(Point { x, y })
    }
}

fn main() {
    // Because we implemented FromStr, ".parse::<Point>()" now works for free!
    let p: Point = "3, 4".parse().unwrap();
    println!("{:?}", p); // Point { x: 3, y: 4 }

    let bad: Result<Point, String> = "not a point".parse();
    println!("{:?}", bad); // Err("missing comma")
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Fromstr Parse Scoping and Lifecycle Rules

**The mistake:** Assuming Fromstr Parse instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("fromstr_parse_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("fromstr_parse_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Fromstr Parse State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Fromstr Parse through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Fromstr Parse Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Fromstr Parse instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Safely Parse User Input

**Problem:** Write a function `add_one(input: &str) -> Result<i32, std::num::ParseIntError>` that parses `input` as an `i32` and returns it plus one, propagating any parse error with `?` instead of panicking.

> [!check]- Answer
> ```rust
> fn add_one(input: &str) -> Result<i32, std::num::ParseIntError> {
>     let n: i32 = input.parse()?;
>     Ok(n + 1)
> }
>
> fn main() {
>     println!("{:?}", add_one("41"));  // Ok(42)
>     println!("{:?}", add_one("oops")); // Err(ParseIntError { .. })
> }
> ```

---

### Exercise 2: Implementing Custom `FromStr` for Domain Structs

**Problem:** Implement `FromStr` for `Point { x: i32, y: i32 }` parsing `"10,20"`.

**Expected output:**
> [!check]- Answer
> ```
> Point: (10, 20)
> ```
> ```rust
> use std::str::FromStr;
> #[derive(Debug)]
> struct Point { x: i32, y: i32 }
> impl FromStr for Point {
>     type Err = &'static str;
>     fn from_str(s: &str) -> Result<Self, Self::Err> {
>         let parts: Vec<&str> = s.split(',').collect();
>         if parts.len() != 2 { return Err("Invalid format"); }
>         let x = parts[0].trim().parse().map_err(|_| "Bad x")?;
>         let y = parts[1].trim().parse().map_err(|_| "Bad y")?;
>         Ok(Point { x, y })
>     }
> }
> fn main() {
>     let p: Point = "10,20".parse().unwrap();
>     println!("Point: ({}, {})", p.x, p.y);
> }
> ```
>
> **Explanation:** `FromStr` enables string parsing via `.parse()` on custom domain types.

---

### Exercise 3: Parsing Color Hex Strings

**Problem:** Parse a hex color string `"#FF0000"` into `Color(u8, u8, u8)` using `.parse()`.

**Expected output:**
> [!check]- Answer
> ```
> Parsed red: 255
> ```
> use std::str::FromStr;
> struct Color(u8, u8, u8);
> impl FromStr for Color {
>     type Err = ();
>     fn from_str(s: &str) -> Result<Self, Self::Err> {
>         let r = u8::from_str_radix(&s[1..3], 16).map_err(|_| ())?;
>         let g = u8::from_str_radix(&s[3..5], 16).map_err(|_| ())?;
>         let b = u8::from_str_radix(&s[5..7], 16).map_err(|_| ())?;
>         Ok(Color(r, g, b))
>     }
> }
> fn main() {
>     let c: Color = "#FF0000".parse().unwrap();
>     println!("Parsed red: {}", c.0);
> }
> ```
>
> **Explanation:** `u8::from_str_radix` parses custom base-16 hexadecimal representations.

---

## 6. Related Terms

- [`?` Operator](../level_04/question_mark_operator.md) — The idiomatic way to propagate a `.parse()` failure out of a function.
- [`Result<T, E>`](../level_02/result_t_e.md) — The type every `FromStr::from_str` implementation must return.
- [`From` / `Into` Traits](../level_04/from_into_traits.md) — The infallible-conversion sibling family; `FromStr` is specifically for the fallible, text-parsing case.
- [`TryFrom` / `TryInto`](../level_14/tryfrom_tryinto.md) — The general-purpose fallible-conversion trait; `FromStr` is effectively `TryFrom<&str>` with a dedicated name and `.parse()` sugar.

---

## 7. Key Takeaways

- `.parse::<T>()` is sugar for `T::from_str(s)`, and works for any `T` that implements `FromStr`.
- Parsing is **fallible by design** — it always returns a `Result`, never panics or silently produces wrong data.
- Because `.parse()` is generic, the compiler needs a type hint: use the turbofish (`::<T>`) or a variable type annotation.
- You can implement `FromStr` for your own types to get free, idiomatic `"text".parse::<MyType>()` support.
