# `Result<T, E>`

> **Level 2 — Control Flow & Data Structures**
> An enum (`Ok(T)` / `Err(E)`) for recoverable error handling.

---

## 1. Prerequisites

- [Enum](../level_02/enum.md) — `Result` is a standard Enum built into the Rust standard library.
- [`Option<T>`](../level_02/option_t.md) — The sister type to `Result`, used for *missing* data rather than *failed* operations.
- [`match`](../level_02/match.md) — The primary tool used to check if a `Result` succeeded or failed.

---

## 2. Term Category

**Rust-specific (the safety)**: Rust completely removes the concept of `try / catch` blocks and Exceptions. Instead, any function that can fail simply returns the `Result<T, E>` enum, forcing the developer to handle errors predictably and explicitly.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In older languages like Java, C#, or Python, errors are handled by "throwing Exceptions". This design has two major flaws:
1. **Invisibility**: By looking at a function signature like `int divide(a, b)`, you have no idea if it might throw an Exception and crash.
2. **Forgetfulness**: If you forget to wrap a risky function in a `try/catch` block, your program will crash at runtime.

Rust's designers wanted errors to be visible, predictable, and impossible to ignore. Therefore, Rust uses an Enum called `Result`. If a function might fail, it is forced to return a `Result` type. It has two variants:
- `Ok(value)` — The operation succeeded, here is your data.
- `Err(error_info)` — The operation failed, here is why.

Because `Result` is an Enum, the compiler **forces you** to handle both the `Ok` case and the `Err` case (usually via `match`). You cannot accidentally ignore a failure, making Rust programs incredibly stable.

### (2) Reality Metaphor

Imagine ordering a package online.

In a language with Exceptions, the delivery driver either hands you your package, or they secretly plant a landmine on your porch. If you open your front door without wearing a bomb squad suit (`try/catch`), the landmine explodes and you die (program crash).

In Rust, the delivery driver always hands you a transparent lockbox (the `Result` enum). You look inside the lockbox: it either contains your item (`Ok`), or it contains an apology note explaining why the delivery failed (`Err`). You cannot touch the item without first opening the lockbox and acknowledging the note.

### (3) Rust Code Examples

#### Short Snippet (The Definition)
You don't need to define `Result` yourself; it's built into the language. It looks like this:
```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

Because it's so common, Rust automatically imports `Ok` and `Err` for you.
```rust
let success: Result<i32, String> = Ok(200);
let failure: Result<i32, String> = Err(String::from("Database offline"));
```

#### Fuller Example (Handling the Result)
```rust
// A function that can fail returns a `Result`
fn divide(numerator: f64, denominator: f64) -> Result<f64, String> {
    if denominator == 0.0 {
        // Return the Error variant
        Err(String::from("Cannot divide by zero!"))
    } else {
        // Return the Success variant
        Ok(numerator / denominator)
    }
}

fn main() {
    let outcome = divide(10.0, 0.0);
    
    // We MUST use pattern matching to extract the answer
    match outcome {
        Ok(answer) => println!("The answer is: {}", answer),
        Err(error_msg) => println!("Task failed: {}", error_msg),
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Result T E Scoping and Lifecycle Rules

**The mistake:** Assuming Result T E instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("result_t_e_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("result_t_e_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Result T E State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Result T E through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Result T E Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Result T E instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Parse the Number

**Problem:** The `parse()` method takes a string and tries to convert it into a number. Because the string might contain letters, it returns a `Result`. Use a `match` statement to extract the number if it succeeds, or print "Not a number!" if it fails.

```rust
fn main() {
    let input = "42a";
    let parsed: Result<i32, _> = input.parse();
    
    // TODO: Write a `match` statement here to handle `parsed`
}
```

**Expected output:**
```text
Not a number!
```

> [!check]- Answer
> ```rust
> match parsed {
>     Ok(number) => println!("The number is: {}", number),
>     Err(_) => println!("Not a number!"),
> }
> ```

---

### Exercise 2: Converting `Result` to `Option`

**Problem:** Convert `Ok(42)` to `Some(42)` and `Err("fail")` to `None` using `.ok()`.

**Expected output:**
```
Some(42)
None
```

> [!check]- Answer
> ```rust
> fn main() {
>     let ok_res: Result<i32, &str> = Ok(42);
>     let err_res: Result<i32, &str> = Err("fail");
>     println!("{:?}", ok_res.ok());
>     println!("{:?}", err_res.ok());
> }
> ```
>
> **Explanation:** `.ok()` converts `Result<T, E>` into `Option<T>`, discarding error values.

### Exercise 3: Error Recovery with `unwrap_or_else`

**Problem:** Use `.unwrap_or_else(|err| err.len() as i32)` to supply dynamic fallback values for errors.

**Expected output:**
```
Error length: 4
```

> [!check]- Answer
> ```rust
> fn main() {
>     let res: Result<i32, &str> = Err("fail");
>     let val = res.unwrap_or_else(|e| e.len() as i32);
>     println!("Error length: {}", val);
> }
> ```
>
> **Explanation:** `.unwrap_or_else(f)` computes fallback default values lazily using closures.

---

## 6. Related Terms

- [`Option<T>`](../level_02/option_t.md) — The sister enum used for *missing* data, whereas Result is used for *failed* operations.
- [`?` Operator](../level_04/question_mark_operator.md) — (Future reference) The magical syntax sugar that makes working with `Result` incredibly easy by automatically returning errors up the chain.
- [`unwrap()` / `expect()`](../level_04/unwrap_expect.md) — Aggressive methods that intentionally crash the program if a `Result` is an `Err`.

---

## 7. Key Takeaways

- Rust does not use Exceptions (`try/catch`). It uses the `Result<T, E>` enum.
- The variants are `Ok(T)` (success with data) and `Err(E)` (failure with error data).
- The compiler forces you to handle the `Result` (usually with `match` or `if let`) to extract the `Ok` value.
- This design forces you to acknowledge and handle errors gracefully, preventing unexpected runtime crashes.
