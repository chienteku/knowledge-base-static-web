# Never Type (`!`)

> **Level 11 — Smart Pointers & Advanced Types**
> The type of expressions that never return (e.g. `loop {}`, `panic!`).

---

## 1. Prerequisites

- [Unit Type `()`](../level_02/unit_struct.md) — The type of a function that finishes but returns no data.
- [Panic](../level_04/panic.md) — A macro that crashes the program.
- [Loop](../level_02/loop.md) — An infinite loop.

---

## 2. Term Category

**Rust-specific (the void that consumes)**: In many languages, functions that don't return any data return `void`. In Rust, `void` is represented by `()` (the Unit type). 

But what about a function that *literally never finishes executing* because it crashes the program, or runs in an infinite server loop forever? Rust has a special, mind-bending type just for this scenario: the **Never Type (`!`)**.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The Rust type-checker is mathematically obsessed with matching types. If you write an `if / else` statement, both branches *must* return the exact same type.

But consider this code:
```rust
let number: u32 = if user_input.is_ok() {
    5
} else {
    panic!("Invalid input!");
};
```
What type does `panic!` return? If it returned `()` (Unit), the compiler would throw a massive error because the `if` branch returns a `u32`, and `()` is not a `u32`. 

To solve this, the designers invented the Never Type (`!`). It is an empty type that physically cannot exist at runtime. Because it can never exist, the compiler allows it to "coerce" (magically morph) into **any other type in the entire language** to make the type-checker happy!

### (2) Reality Metaphor

Imagine you are a Toll Booth Operator on a highway. You mathematically require every single driver to hand you exactly $5 (the required return type).

- **Normal Return (`i32`)**: A driver pulls up, hands you $5, and drives away. The transaction is complete.
- **Unit Type (`()`)**: A driver pulls up, hands you an empty envelope, and drives away. The transaction is complete.
- **Never Type (`!`)**: A driver pulls up, stares at you, and suddenly their car explodes. They never handed you $5, but they also never drove away. The transaction never finished. You can just cross them off your list and pretend they paid, because they are gone forever.

### (3) Rust Code Examples

#### Short Snippet (Type Coercion)
Notice how the `todo!()` macro seamlessly morphs into a `String` to satisfy the compiler. `todo!` returns `!`.

```rust
fn fetch_user() -> String {
    // We haven't written this code yet. 
    // If todo!() returned `()`, the compiler would error!
    // Because it returns `!`, the compiler happily compiles the code!
    todo!("I will write this tomorrow");
}
```

#### Fuller Example (The Infinite Server)
If you are writing a web server or a background thread that is designed to run forever, it is considered a best practice to explicitly set the return type to `!`. This communicates to the compiler (and other developers) that this function will literally *never* yield control back to the caller.

```rust
use std::time::Duration;

// We explicitly declare that this function NEVER returns
fn run_background_worker() -> ! {
    loop {
        println!("Checking for new emails...");
        std::thread::sleep(Duration::from_secs(5));
        
        // Notice there is no `break` statement in this loop!
    }
}

fn main() {
    println!("Starting worker...");
    run_background_worker();
    
    // The compiler knows this next line of code is completely unreachable!
    // It will actually throw a "unreachable statement" warning!
    println!("This will never print!"); 
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Never Type Scoping and Lifecycle Rules

**The mistake:** Assuming Never Type instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("never_type_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("never_type_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Never Type State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Never Type through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Never Type Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Never Type instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Magic Morph

**Problem:** You write `let x: Result<String, i32> = panic!("Oh no!");`. Why doesn't the compiler complain that you didn't provide a `Result`?

> [!check]- Answer
> Because `panic!` returns the **Never Type (`!`)**. 
>
> Because a crash never yields control back to the program, the compiler allows the Never Type to automatically coerce (morph) into `Result<String, i32>` to keep the type-checker happy!

---

### Exercise 2: The Never Type Enabling Diverging `match` Arms

**Problem:**
In Rust, every arm of a `match` expression must have the same type. The Never Type (`!`) is special: it coerces into *any* type, so a diverging arm (one that panics, breaks, continues, or returns) is accepted by the compiler even if the other arms produce a concrete value.

Write a `loop` that reads strings from a hard-coded list and parses each as a `u32`. Use a `match` where:
- `Ok(n)` yields the parsed number.
- `Err(_)` calls `continue` (skipping to the next iteration).
- A value of `0` causes `break`.

Print each successfully parsed non-zero number.

**Expected output:**
> [!check]- Answer
> ```text
> Parsed: 42
> Parsed: 7
> Zero encountered — stopping.
> ```
>
> - **Hint 1:** `continue` and `break` both have type `!`. Inside a `match` that must produce a `u32`, the arm `Err(_) => continue` is accepted because `!` silently coerces to `u32` (the compiler knows the arm never actually produces a `u32`).
> - **Hint 2:** The list can be a `&[&str]` array literal iterated with `.iter()`. You need a `'outer` label on the loop if you use nested loops, but a single loop suffices here.
> - **Hint 3:** Check the parsed `u32` *after* the match: `if n == 0 { println!(...); break; }` — or handle `0` as its own arm that calls `break` directly (which also has type `!`).
>
> ```rust
> fn main() {
>     let inputs = ["42", "bad", "7", "also_bad", "0", "99"];
>     let mut iter = inputs.iter();
>
>     loop {
>         let Some(raw) = iter.next() else { break };
>
>         // Both `continue` and `break` have type `!`, so they satisfy
>         // the u32 return type the compiler expects from every arm.
>         let n: u32 = match raw.parse() {
>             Ok(0)    => { println!("Zero encountered — stopping."); break }
>             Ok(n)    => n,
>             Err(_)   => continue, // ← type is !, coerces to u32
>         };
>
>         println!("Parsed: {}", n);
>     }
> }
> ```
>
> **Explanation:**
> The Never Type is why Rust allows you to put `continue`, `break`, `return`, `panic!`, or any diverging expression inside a `match` arm that is otherwise expected to produce a concrete value. The compiler's type system says: "this arm diverges — it will never actually hand back a value — so it trivially satisfies whatever type the other arms produce." Without `!`, you'd need to restructure the code into nested `if let` / `else` chains to avoid type mismatches.

---

### Exercise 3: Diverging Functions as a Recovery Pattern

**Problem:**
Write a `fn fatal_error(msg: &str) -> !` that panics with the given message, then use it inside a `match` as the error arm — demonstrating that `-> !` coerces into any return type.

Specifically:
1. Write `fatal_error`.
2. Write a function `parse_port(s: &str) -> u16` that parses `s` as a `u16`. On failure, call `fatal_error("invalid port")` instead of returning an error.
3. In `main`, call `parse_port("8080")` and print the result, then show that calling `parse_port("bad")` would diverge (comment it out with an explanation).

**Expected output:**
> [!check]- Answer
> ```text
> Listening on port: 8080
> ```
>
> - **Hint 1:** `fn fatal_error(msg: &str) -> !` is declared with `-> !` in place of the return type. The body must *never return* — `panic!(...)` satisfies this.
> - **Hint 2:** Inside `parse_port`, the match arm `Err(_) => fatal_error("invalid port")` has type `!`. Because `!` coerces to any type — including `u16` — the compiler accepts it as a valid arm for the `Ok(n) => n` arm that produces `u16`.
> - **Hint 3:** This pattern is common in CLI tools and startup code where a configuration error is truly unrecoverable. The `-> !` signature advertises to callers that the function is an execution terminator, not a normal function.
>
> ```rust
> // `-> !` means this function NEVER returns to its caller.
> // The panic macro itself has type `!`, satisfying the return type.
> fn fatal_error(msg: &str) -> ! {
>     panic!("Fatal: {}", msg);
> }
>
> fn parse_port(s: &str) -> u16 {
>     // The `Err` arm calls `fatal_error` which has type `!`.
>     // `!` coerces to `u16`, so both arms satisfy the expected return type.
>     match s.parse::<u16>() {
>         Ok(port) => port,
>         Err(_)   => fatal_error("invalid port: expected a number 0–65535"),
>     }
> }
>
> fn main() {
>     let port = parse_port("8080");
>     println!("Listening on port: {}", port);
>
>     // Uncommenting the line below would diverge (panic) instead of returning:
>     // let _ = parse_port("bad");
> }
> ```
>
> **Explanation:**
> A function annotated `-> !` is called a *diverging function*. It is part of the type system, not just a documentation convention. The compiler understands that any code after a call to a diverging function is unreachable and will not generate dead-code warnings for it. This is also why `loop {}` has type `!` (it never terminates) and why `std::process::exit()` returns `!`. The coercibility of `!` to any type is what makes diverging arms in `match` expressions work without special-casing them in the compiler.

---

## 6. Related Terms

- [Unit Type `()`](../level_02/unit_struct.md) — The type of a function that finishes safely but yields no data.
- [Panic](../level_04/panic.md) — The most common expression that returns `!`.
- [`todo!()` and `unimplemented!()`](../level_04/panic.md) — Macros that return `!` to help you stub out code.

---

## 7. Key Takeaways

- The **Never Type (`!`)** represents an expression that will *never* finish executing.
- It is returned by infinite loops (`loop {}`), crashes (`panic!`, `unimplemented!`, `todo!`), and process exits (`std::process::exit`).
- Because a Never Type never finishes, the compiler allows it to automatically **"coerce"** (morph) into any other type in the language to satisfy type-checking requirements.
- Do not confuse `!` (the function crashes or hangs forever) with `()` (the function finishes safely but yields no data).
