# `unwrap()` / `expect()`

> **Level 4 — Error Handling & Generics**
> Extract the inner value or panic; use only when failure is truly unexpected.

---

## 1. Prerequisites

- [`Result<T, E>`](../level_02/result_t_e.md) — The success/error wrapper these methods act upon.
- [`Option<T>`](../level_02/option_t.md) — The some/none wrapper these methods can also act upon.
- [`?` Operator](../level_04/question_mark_operator.md) — The safe, preferred alternative to these methods.

---

## 2. Term Category

**Rust-specific (the necessary evil)**: Rust is famous for forcing you to safely handle every possible error. But sometimes, a human knows that an error is impossible, even if the compiler's math can't prove it. `unwrap` and `expect` exist as an explicit "escape hatch" for these exact situations.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The compiler is incredibly strict. If you write `"127.0.0.1".parse::<IpAddr>()`, the compiler forces you to handle the `Result` because `parse` *can* fail (e.g., if you passed it `"hello"`). 

But you, the human, know that `"127.0.0.1"` is a perfectly valid IP address. It is mathematically impossible for this specific, hardcoded string to fail parsing. Writing a massive `match` statement or propagating an impossible error with `?` feels tedious and misleading to other programmers. 

To fix this, Rust provides **`.unwrap()`** and **`.expect()`**. These methods instantly tear open the `Result` or `Option` and give you the inner value! 

However, they are extremely dangerous. If you were wrong, and the value actually *was* an error or `None`, they instantly **Panic** and crash your entire program.

### (2) Reality Metaphor

Imagine receiving a locked safe (`Result`) that might contain a diamond (`Ok`), or might contain a bomb (`Err`).

Using the `?` operator is like carefully calling the bomb squad. They inspect the safe, and if there is a bomb, they safely remove it and report the issue to you without anyone getting hurt (safe early return).

Using **`.unwrap()`** is taking a giant sledgehammer and blindly smashing the safe open. If there's a diamond inside, great! You get it instantly. If there's a bomb inside... you just blew up the entire building (your program crashed). 

You should only use the sledgehammer if you are 100% absolutely certain there is a diamond inside the safe.

### (3) Rust Code Examples

#### Short Snippet (The Valid Sledgehammer)
Because the IP address is hardcoded, it will never fail. Using `unwrap()` here is perfectly acceptable and idiomatic Rust.

```rust
use std::net::IpAddr;

fn main() {
    // We use .unwrap() to instantly get the IpAddr out of the Result
    let home: IpAddr = "127.0.0.1".parse().unwrap();
    
    println!("My IP is: {}", home);
}
```

#### Fuller Example (`unwrap` vs `expect`)
If you smash the safe and the program crashes, `.unwrap()` prints a very generic, ugly error message. 

If you use **`.expect("msg")`**, it does the exact same thing as `unwrap`, but it prints your custom message right before it crashes! This helps your future self debug *why* it crashed.

```rust
fn main() {
    let bad_ip = "127.0.0.BOOM"; // This will fail to parse!
    
    // If we use unwrap(), the program crashes with a generic message:
    // "called `Result::unwrap()` on an `Err` value: AddrParseError(InvalidIPv4)"
    // let ip1: IpAddr = bad_ip.parse().unwrap(); 
    
    // If we use expect(), the program crashes with OUR message:
    // "CRITICAL BUG: The hardcoded IP was somehow corrupted!: AddrParseError(InvalidIPv4)"
    let ip2: std::net::IpAddr = bad_ip.parse().expect("CRITICAL BUG: The hardcoded IP was somehow corrupted!"); 
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Unwrap Expect Scoping and Lifecycle Rules

**The mistake:** Assuming Unwrap Expect instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("unwrap_expect_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("unwrap_expect_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Unwrap Expect State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Unwrap Expect through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Unwrap Expect Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Unwrap Expect instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Crash Upgrade

**Problem:** The code below uses a lazy `.unwrap()`. If the environment variable isn't set, it crashes with a terrible error message. Upgrade the unwrap to an `.expect()` that provides a helpful message to the user explaining exactly what they did wrong.

```rust
use std::env;

fn main() {
    // TODO: Change this unwrap to an expect with a helpful message!
    let db_url = env::var("DATABASE_URL").unwrap();
    
    println!("Connecting to: {}", db_url);
}
```

> [!check]- Answer
> ```rust
> let db_url = env::var("DATABASE_URL").expect("Failed to start: You must set the DATABASE_URL environment variable!");
> ```

---

### Exercise 2: Replacing `.unwrap()` with Descriptive `.expect()`

**Problem:** Replace `.unwrap()` on `Option` parsing with `.expect("Port must be specified")`.

**Expected output:**
> [!check]- Answer
> ```
> Port: 8080
> ```
> ```rust
> fn main() {
>     let port_opt: Option<u16> = Some(8080);
>     let port = port_opt.expect("Port must be specified");
>     println!("Port: {}", port);
> }
> ```
>
> **Explanation:** `.expect(msg)` supplies custom diagnostic context messages when unwrapping panics.

---

### Exercise 3: Safe Fallback Unwrapping with `unwrap_or_default`

**Problem:** Unwrap `Option<String>` using `.unwrap_or_default()` when `None` is encountered.

**Expected output:**
> [!check]- Answer
> ```
> Default str: ""
> ```
> fn main() {
>     let empty_opt: Option<String> = None;
>     let val = empty_opt.unwrap_or_default();
>     println!("Default str: {:?}", val);
> }
> ```
>
> **Explanation:** `.unwrap_or_default()` returns `Default::default()` for `None` or `Err` cases without panicking.

---

## 6. Related Terms

- [`panic!`](../level_04/panic.md) — The macro that is secretly executed when `unwrap` or `expect` encounters an error.
- [`?` Operator](../level_04/question_mark_operator.md) — The safe, preferred alternative to `unwrap`.

---

## 7. Key Takeaways

- `.unwrap()` instantly extracts the success value from a `Result` or `Option`.
- If it encounters an `Err` or `None`, it instantly **Panics and crashes** the entire program.
- `.expect("msg")` does the exact same thing, but allows you to attach a custom error message to the crash log.
- You should always prefer `.expect()` over `.unwrap()` so your future self knows *why* you thought the sledgehammer is safe to use.
- Only use these methods if you can mathematically guarantee the operation will never fail (e.g. hardcoded strings), or if you are writing quick, throwaway prototype code.
