# `?` Operator

> **Level 4 — Error Handling & Generics**
> Propagates errors by returning early from a function if a `Result` is `Err` or `Option` is `None`.

---

## 1. Prerequisites

- [`Result<T, E>`](../level_02/result_t_e.md) — The success/failure enum that `?` unpacks.
- [`Option<T>`](../level_02/option_t.md) — The some/none enum that `?` can also unpack.
- [Pattern Matching](../level_02/pattern_matching.md) — The verbose `match` syntax that `?` successfully replaces.

---

## 2. Term Category

**Rust-specific (the syntactic sugar)**: Languages like Java or Python use `try/catch` blocks for error handling. Rust uses `Result` enums. Because typing `match` on every single function call is exhausting, Rust created the `?` operator to make error propagation incredibly ergonomic.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

If you are doing three things in a row that can fail (e.g., open a file, read its contents, parse the text to a number), you have to `match` the `Result` at every single step. This leads to massive, deeply nested "staircase" code that is extremely hard to read.

Rust introduced the **`?` Operator** to solve this. Placing a `?` at the exact end of a function call tells the compiler to run a hidden `match` statement:
- "If this succeeded (`Ok`), unwrap the inner value and give it to me so I can keep working."
- "If this failed (`Err`), **instantly stop the current function** and `return` the error up to whoever called me."

### (2) Reality Metaphor

Imagine you are the manager of a restaurant, and you give your chef three tasks: 
1. Buy tomatoes
2. Make sauce
3. Cook pasta

The `?` operator is the **chef's emergency radio**. 
- If the chef successfully buys tomatoes (`Ok`), he quietly unpacks them and moves to step 2. 
- But if the store is out of tomatoes (`Err`), he instantly hits the `?` radio button to call you (**returning early**), saying *"Boss, I can't finish the job, here is the error."* He doesn't even try to make the sauce or cook the pasta. He just bails out immediately and hands the problem up to you.

### (3) Rust Code Examples

#### Short Snippet (The Verbose Way vs The `?` Way)
```rust
use std::fs::File;
use std::io::Error;

// THE VERBOSE WAY
fn read_file_old() -> Result<File, Error> {
    let f = File::open("secret.txt");
    
    let file = match f {
        Ok(file) => file,
        Err(e) => return Err(e), // Early return!
    };
    
    Ok(file)
}

// THE `?` WAY
fn read_file_new() -> Result<File, Error> {
    // If this fails, the ? instantly returns the Err for us!
    let file = File::open("secret.txt")?; 
    
    Ok(file)
}
```

#### Fuller Example (Chaining `?`)
Because `?` extracts the inner value on success, you can instantly call another method on that value, leading to beautiful "method chaining".

```rust
use std::fs::File;
use std::io::{self, Read};

// This function attempts to open a file and read it into a String.
fn read_username_from_file() -> Result<String, io::Error> {
    let mut username = String::new();
    
    // 1. Try to open the file. If it fails, RETURN early.
    // 2. Try to read the file into `username`. If it fails, RETURN early.
    File::open("hello.txt")?.read_to_string(&mut username)?;
    
    // 3. If we made it this far, both steps succeeded!
    Ok(username)
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Question Mark Operator Scoping and Lifecycle Rules

**The mistake:** Assuming Question Mark Operator instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("question_mark_operator_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("question_mark_operator_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Question Mark Operator State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Question Mark Operator through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Question Mark Operator Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Question Mark Operator instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Staircase Refactor

**Problem:** The function below is awful to read. Refactor it using the `?` operator to be as short and clean as possible.

```rust
fn get_first_word_length(text: Option<String>) -> Option<usize> {
    match text {
        Some(s) => {
            match s.split_whitespace().next() {
                Some(word) => Some(word.len()),
                None => None,
            }
        },
        None => None,
    }
}
```

> [!check]- Answer
> You can shrink the entire function down to just two lines!
> ```rust
> fn get_first_word_length(text: Option<String>) -> Option<usize> {
>     // If `text` is None, ? returns None immediately.
>     // If `next()` is None, ? returns None immediately.
>     let word = text?.split_whitespace().next()?;
>     Some(word.len())
> }
> ```

---

### Exercise 2: Propagating `Option` with `?`

**Problem:** Write a function `fn add_opts(a: Option<i32>, b: Option<i32>) -> Option<i32>` that unwraps both using `?`.

**Expected output:**
> [!check]- Answer
> ```
> Some(30)
> ```
> ```rust
> fn add_opts(a: Option<i32>, b: Option<i32>) -> Option<i32> {
>     let val_a = a?;
>     let val_b = b?;
>     Some(val_a + val_b)
> }
> fn main() {
>     println!("{:?}", add_opts(Some(10), Some(20)));
> }
> ```
>
> **Explanation:** `?` short-circuits execution and returns `None` early if applied to `None` values.

---

### Exercise 3: Chaining Error Conversions with `?`

**Problem:** Write a function `parse_file_len(s: &str) -> Result<usize, std::num::ParseIntError>` using `?`.

**Expected output:**
> [!check]- Answer
> ```
> Parsed len: 42
> ```
> fn parse_file_len(s: &str) -> Result<usize, std::num::ParseIntError> {
>     let val: usize = s.parse()?;
>     Ok(val)
> }
> fn main() {
>     if let Ok(len) = parse_file_len("42") {
>         println!("Parsed len: {}", len);
>     }
> }
> ```
>
> **Explanation:** `?` automatically invokes `From::from` to convert error types into the enclosing function's error return type.

---

## 6. Related Terms

- [`unwrap()` / `expect()`](../level_04/unwrap_expect.md) — The dangerous alternative to `?` that crashes the program entirely instead of safely returning the error.
- [`From` / `Into` Traits](../level_04/from_into_traits.md) — The hidden magic that allows `?` to automatically convert different types of errors into a single unified error type before returning.

---

## 7. Key Takeaways

- The `?` operator is syntactic sugar for *"Return early on error, otherwise give me the inner value"*.
- It completely eliminates the need for deeply nested `match` blocks when handling errors.
- It works seamlessly on both `Result` and `Option` types.
- The function using the `?` operator **must** return a `Result` or `Option` itself.
- You can chain multiple `?` calls together for incredibly clean, concise, and perfectly safe code.
