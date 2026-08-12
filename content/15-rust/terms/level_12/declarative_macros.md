# Declarative Macros (`macro_rules!`)

> **Level 12 — Rust**
> Pattern-matching macros defined with `macro_rules!` that expand at compile time by matching against token-tree patterns and producing replacement token trees.

---


## 1. Prerequisites

- [Declarative Macros (`macro_rules!`)](declarative_macros_macro_rules.md) — macro_rules! syntax.

---

## 2. Term Category



**Rust Metaprogramming (pattern matching macro_rules! engine)**: A syntactic macro system using `macro_rules!` to generate code based on pattern matching token trees.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Writing highly repetitive code (like implementing a trait for 10 different tuple sizes or numeric types) is error-prone and tedious. Functions cannot abstract over varying numbers of arguments or distinct types in the same way. Declarative macros allow developers to write pattern-matching rules over Rust syntax tokens. The compiler expands the macro into actual Rust code before compilation, eliminating boilerplate without the complexity of procedural macros (which require separate crates and parsing full ASTs).

### (2) Reality Metaphor

Imagine a smart text expander on your keyboard.
If you type `!greet(Alice)`, it doesn't run a function; instead, it instantly replaces the text with `println!("Hello, Alice!");` right there in your document before anyone else reads it. `macro_rules!` is basically a highly advanced find-and-replace tool built into the compiler that understands Rust's grammatical rules (like expressions, identifiers, and blocks) instead of just raw strings.

### (3) Rust Code Examples

#### Short Snippet
```rust
// Define a declarative macro
macro_rules! say_hello {
    // Match empty invocation
    () => {
        println!("Hello, World!");
    };
    // Match an expression
    ($name:expr) => {
        println!("Hello, {}!", $name);
    };
}

fn main() {
    say_hello!(); // Expands to: println!("Hello, World!");
    say_hello!("Alice"); // Expands to: println!("Hello, {}!", "Alice");
}
```

#### Fuller Example (Building a `hashmap!` macro)
```rust
macro_rules! my_hashmap {
    // `$( ... ),*` matches zero or more occurrences separated by commas.
    // `$( ... ),+` matches one or more.
    ( $( $key:expr => $value:expr ),* $(,)? ) => {
        {
            let mut map = std::collections::HashMap::new();
            $(
                map.insert($key, $value);
            )* // This block is repeated for every match
            map
        }
    };
}

fn main() {
    // The macro allows a beautiful literal syntax for HashMap
    let scores = my_hashmap! {
        "Alice" => 50,
        "Bob" => 40,
    };
    
    assert_eq!(scores.get("Alice"), Some(&50));
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Hygiene and Local Variables

**The mistake:** Trying to declare a variable inside a macro that is meant to be accessed *outside* the macro's invocation.

**Why it's wrong:** Declarative macros in Rust are *partially hygienic*. If a macro defines a local variable (e.g., `let temp = 5;`), that variable cannot be accessed by the code surrounding the macro call to prevent accidental naming collisions. 

*Incorrect:*
```rust
macro_rules! create_x {
    () => { let x = 10; };
}

fn main() {
    create_x!();
    // println!("{}", x); // COMPILER ERROR: `x` not found in this scope
}
```

*Fix:* Pass the identifier into the macro if you want to define a variable in the caller's scope.
```rust
macro_rules! create_var {
    ($name:ident) => { let $name = 10; };
}
fn main() {
    create_var!(x);
    println!("{}", x); // OK!
}
```

### Mistake 2: Fragment Specifier Overreach

**The mistake:** Matching an `expr` (expression) when you meant to match an `ident` (identifier), leading to unexpected matching behavior in later rules.

**Why it's wrong:** An `expr` consumes a whole expression. If you put `expr` followed by another syntax piece, it can cause ambiguity or capture more than intended.

*Incorrect:*
```rust
macro_rules! wrong {
    ($val:expr => $other:expr) => { ... }; 
    // Sometimes valid, but can cause parsing ambiguities if nested.
}
```

*Fix:* Be precise. Use `ident`, `ty` (type), `literal`, `stmt` (statement), or `block` where appropriate to constrain what the macro accepts.

### Mistake 3: Missing Trailing Commas in Repetitions

**The mistake:** Failing to allow a trailing comma in repeated macro patterns, causing valid Rust style (like trailing commas in multiline structs/lists) to fail to compile.

**Why it's wrong:** Users expect to be able to leave a trailing comma.

*Incorrect:*
```rust
macro_rules! list {
    ( $( $val:expr ),* ) => { ... };
}
// list!(1, 2, 3,) // FAILS TO COMPILE due to trailing comma
```

*Fix:* Add an optional comma matcher `$(,)?` at the end.
```rust
macro_rules! list {
    ( $( $val:expr ),* $(,)? ) => { ... };
}
```

---

## 5. Practice Exercises

### Exercise 1: Creating a Custom Vector Initialization Macro

**Scenario:** You want a `vec_strs!` macro that takes multiple string literals and automatically converts them to `String` and pushes them into a `Vec<String>`.

**Requirements:**
1. Use `macro_rules! vec_strs`.
2. Allow comma-separated expressions.
3. Allow a trailing comma.
4. Expand to a block that creates a vector and pushes `$val.to_string()` for each item.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> macro_rules! vec_strs {
>     ( $( $val:expr ),* $(,)? ) => {
>         {
>             let mut temp_vec = Vec::new();
>             $(
>                 temp_vec.push($val.to_string());
>             )*
>             temp_vec
>         }
>     };
> }
> 
> fn main() {
>     let v = vec_strs!["hello", "world",];
>     assert_eq!(v, vec![String::from("hello"), String::from("world")]);
> }
> ```
>
> #### Technical Explanation
> The macro matches the pattern `$( $val:expr ),*`, meaning "zero or more expressions separated by commas". `$(,)?` matches an optional trailing comma. Inside the expansion `{}`, the `$( ... )*` block repeats its internal code for every matched expression. By wrapping the expansion in a block `{ let mut temp_vec ... temp_vec }`, the macro evaluates to an expression containing the populated vector.
> 
### Exercise 2: Implementing a Trait for Multiple Types

**Scenario:** You have a trait `IsEven` that needs to be implemented for `u8`, `u16`, `u32`, and `u64`. Doing this manually is boilerplate.

**Requirements:**
1. Define the `IsEven` trait with `fn is_even(&self) -> bool`.
2. Write a macro `impl_is_even!(...)` that takes a list of types.
3. The macro should generate the `impl IsEven for $type` block for each type.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> trait IsEven {
>     fn is_even(&self) -> bool;
> }
> 
> macro_rules! impl_is_even {
>     ( $( $t:ty ),* ) => {
>         $(
>             impl IsEven for $t {
>                 fn is_even(&self) -> bool {
>                     self % 2 == 0
>                 }
>             }
>         )*
>     };
> }
> 
> impl_is_even!(u8, u16, u32, u64);
> 
> fn main() {
>     assert!(4u8.is_even());
>     assert!(!5u32.is_even());
> }
> ```
>
> #### Technical Explanation
> Using `$t:ty` captures a Rust type. We then repeat the entire `impl IsEven for $t { ... }` block for each matched type. This is one of the most powerful and common uses of `macro_rules!` in the standard library (e.g., implementing `Clone` or `Add` for primitive numeric types).
> 
### Exercise 3: Recursive Macros for HTML Generation

**Scenario:** Macros can call themselves recursively. You want to generate a simple nested HTML string.

**Requirements:**
1. Create a `html!` macro.
2. It should match `html! { <$tag:ident> $content:expr </$tag_end:ident> }`.
3. Generate the formatted string.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> macro_rules! html {
>     ( <$tag:ident> $content:expr </$tag_end:ident> ) => {
>         format!("<{}>{}</{}>", stringify!($tag), $content, stringify!($tag_end))
>     };
> }
> 
> fn main() {
>     let out = html! { <div> "Hello" </div> };
>     assert_eq!(out, "<div>Hello</div>");
> }
> ```
>
> #### Technical Explanation
> `$tag:ident` matches the HTML tag names without needing them to be quoted strings. We use the built-in `stringify!` macro to convert those raw identifiers (like `div`) into string literals (`"div"`) at compile time. This allows for a DSL (Domain Specific Language) that looks very much like HTML directly inside Rust code.
> 
---


## 6. Related Terms

- [Declarative Macros (`macro_rules!`)](declarative_macros_macro_rules.md) — macro_rules! macro rules.

---

## 7. Key Takeaways

- Declarative macros operate at the token tree level, running before code is fully compiled.
- They are defined using `macro_rules!` and are invoked with a `!`.
- They excel at matching repeating patterns (`$()*`) to eliminate boilerplate.
- They are partially hygienic; they cannot accidentally capture or leak local variables unless explicitly passed as identifiers.

