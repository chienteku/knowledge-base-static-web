# Hygiene

> **Level 12 — Macros**
> The compiler property ensuring that variables, items, and syntax introduced inside a macro expansion do not accidentally collide with or shadow identifiers in the caller's surrounding scope.

---

## 1. Prerequisites

- [Declarative Macros (`macro_rules!`)](../level_12/declarative_macros_macro_rules.md) — Understanding declarative macro expansion syntax.
- [Procedural Macros](../level_12/procedural_macros.md) — Compile-time procedural code generation functions.
- [Token Stream](../level_12/token_stream.md) — How `proc_macro::Span` metadata tracks token hygiene boundaries.
- [Scope & Shadowing](../level_01/scope_and_shadowing.md) — Variable scope rules and shadowing behavior in Rust.

---

## 2. Term Category

**Core Concept / Language Feature**: Macro Hygiene is the compiler mechanism that prevents macro-generated code from unexpectedly interfering with the caller's local scope. In Rust, declarative macros (`macro_rules!`) are hygienic for local variables: a variable declared inside a macro expansion (e.g. `let x = 10;`) lives in a distinct syntax context, preventing it from accidentally shadowing a variable named `x` in the calling function.

---

## 3. Environment Context

**Universal Rust**: Hygiene rules are enforced automatically by `rustc` across all Rust compilation targets (`std`, `no_std`, WASM, embedded).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"

In older programming languages (such as C/C++ preprocessor macros `#define`), macros perform naive textual substitution. 

Consider this C-style unhygienic macro scenario:
```c
#define SWAP(a, b) { int tmp = a; a = b; b = tmp; }

int main() {
    int tmp = 5;
    int y = 10;
    SWAP(tmp, y); // Expanded to: { int tmp = tmp; tmp = y; y = tmp; } -> BUG!
}
```
Because the macro introduced a temporary variable named `tmp`, it silently shadowed the user's caller variable named `tmp`, causing hard-to-detect runtime bugs and variable pollution.

JavaScript/TypeScript developers face similar issues when writing helper functions or string-evaluated code strings (`eval`) that pollute outer scope or leak global variables.

Rust solved this problem by introducing **Macro Hygiene**. By default, Rust's macro system tracks the *provenance* (the context of origin) for every identifier token using compiler `Span` metadata. Local variables declared inside a macro expansion cannot collide with local variables declared by the caller, even if they share the exact same text name.

### (2) Reality Metaphor

Imagine a **Soundproof Quarantine Booth inside an Office**:

- An **Unhygienic Macro (C `#define`)** is like shouting instructions through a megaphone in an open office: anyone in the room with the name "John" (**local variable `tmp`**) will respond, creating confusion and overwriting instructions.
- A **Hygienic Macro (Rust)** is like stepping inside a soundproof quarantine booth (**syntax context `Span`**): workers inside the booth can use internal labels like "Box A" or "Temporary File" freely. Those names are completely isolated from worker labels outside the booth. A label inside the booth will never confuse or overwrite a file with the same name on a desk outside the booth.

### (3) Code Examples

#### Short Snippet (Demonstrating Variable Hygiene)

```rust
macro_rules! create_and_inc {
    ($val:expr) => {{
        // `temp` is declared inside the macro expansion scope.
        // Rust's macro hygiene guarantees this `temp` will NOT collide with `temp` in main().
        let temp = $val + 1;
        temp
    }};
}

fn main() {
    let temp = 100; // Caller's variable named `temp`
    
    let result = create_and_inc!(temp);

    println!("Result from macro: {}", result); // 101
    println!("Caller's original temp: {}", temp); // 100 (Unchanged!)
}
```

#### Fuller Example (Hygiene Rules & Intentional Identifier Passing)

```rust
/// Demonstrates how hygienic macros protect local scope while allowing
/// intentional identifier passing via matcher arguments ($var:ident).

macro_rules! safe_accumulator {
    // 1. Hygienic local variable: `acc` inside macro body is isolated
    (accumulate $e:expr) => {{
        let mut acc = 0;
        acc += $e;
        acc
    }};

    // 2. Intentional scope modification: Passing an identifier `$target:ident` explicitly
    // allows the macro to mutate the caller's variable on purpose!
    (add_to $target:ident, $val:expr) => {
        $target += $val;
    };
}

fn main() {
    let acc = 50; // Caller variable `acc`

    // Macro uses internal `acc` variable without touching caller's `acc`
    let sum = safe_accumulator!(accumulate 10);
    println!("Macro isolated sum: {}", sum); // 10
    println!("Caller acc remains: {}", acc); // 50

    // To intentionally modify caller's variable, caller explicitly passes identifier reference
    let mut total = 100;
    safe_accumulator!(add_to total, 25);
    println!("Explicitly modified caller total: {}", total); // 125
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Assuming Item Names (Functions/Types) Are Fully Hygienic in `macro_rules!`

**The mistake:** Assuming declarative macro hygiene protects global function calls or type names referenced inside a macro.

**Why it's wrong:** In Rust 2021 edition, `macro_rules!` features **mixed hygiene**: local variables are hygienic, but item references (like helper functions or imported traits) resolve in the scope of the *caller*, not the macro definition site! If the caller hasn't imported a referenced trait, the macro expansion fails.

*Incorrect:*
```rust
// In macro crate:
macro_rules! serialize_json {
    ($val:expr) => {
        // ❌ Fails if caller has not imported `use serde::Serialize;` in their module!
        to_string(&$val)
    };
}
```

*Fix:*
```rust
macro_rules! serialize_json {
    ($val:expr) => {
        // Correct: Use fully qualified absolute item paths (`::std`, `::serde`)
        ::serde_json::to_string(&$val)
    };
}
```

### Mistake 2: Using `Span::call_site()` when Procedural Macro Hygiene is Desired

**The mistake:** Creating identifiers in a procedural macro using `proc_macro2::Span::call_site()` when trying to generate private internal variables.

**Why it's wrong:** `Span::call_site()` resolves identifiers as if they were written directly by the caller at the macro invocation site (unhygienic context). To generate hygienic internal variables, use `Span::mixed_site()` or unique auto-generated names.

*Incorrect:*
```rust
// Inside proc macro:
let temp_ident = syn::Ident::new("temp", proc_macro2::Span::call_site());
// ❌ If caller has a `let temp = ...` variable, this generated code may shadow or collide with it!
quote! { let #temp_ident = 42; }
```

*Fix:*
```rust
// Correct: Option A: Use mixed_site span for hygiene
let temp_ident = syn::Ident::new("temp", proc_macro2::Span::mixed_site());

// Correct: Option B: Generate guaranteed unique identifier names
let temp_ident = quote::format_ident!("__internal_temp_{}", 42);
quote! { let #temp_ident = 42; }
```

### Mistake 3: Attempting to Export a Variable Declared Inside a Macro to Caller Scope

**The mistake:** Expecting a macro invocation like `declare_var!()` to create a new variable `x` that can be accessed in subsequent caller code lines.

**Why it's wrong:** Because local variables declared inside a macro expansion are hygienic, they cannot "leak" out of the macro into the caller's binding scope unless explicitly passed in as an identifier argument (`$var:ident`).

*Incorrect:*
```rust
macro_rules! make_x {
    () => {
        let x = 10; // ❌ Variable `x` is hygienic and isolated inside macro scope
    };
}

fn main() {
    make_x!();
    // println!("{}", x); // ❌ Compiler error: cannot find value `x` in this scope
}
```

*Fix:*
```rust
macro_rules! make_x {
    ($name:ident) => {
        let $name = 10; // Correct: caller passes `$name` identifier explicitly
    };
}

fn main() {
    make_x!(my_x);
    println!("{}", my_x); // Prints 10
}
```

---

## 6. Practice Exercises

### Exercise 1: Hygienic Performance Profiling Macro vs. Caller Identifier Shadowing

**Problem Statement:**
In real-time network services or embedded sensor pipelines, developers frequently instrument code using diagnostic macros. Suppose you need to implement a timing benchmark macro `profile_block!` that tracks execution latency by instantiating temporary local variables (`start_time`, `elapsed`, `result`).

If Rust's macro system were unhygienic (like C `#define`), invoking `profile_block!` inside a function that *already* defines variables named `start_time` or `elapsed` would cause variable shadowing bugs or compilation errors.

Write a declarative macro `profile_block!` that:
1. Declares internal temporary variables named `start_time` and `elapsed` inside an isolated block expression.
2. Computes the result of an arbitrary expression `$expr:expr` passed to it.
3. Demonstrates complete local variable hygiene: show that calling `profile_block!` inside a scope where `start_time` and `elapsed` exist in the caller scope compiles cleanly without modifying or colliding with the caller's variables.
4. Includes unit tests verifying that both the caller's variables retain their original values and the macro correctly returns the computed result.

> [!check]- Answer
> ```rust
> macro_rules! profile_block {
>     ($expr:expr) => {{
>         // Internal hygienic local variables
>         let start_time: u64 = 1_000_000; // Simulated timestamp in micros
>         let result = $expr;
>         let elapsed: u64 = 500; // Simulated duration in micros
>         
>         // Return tuple of (result, elapsed)
>         (result, elapsed)
>     }};
> }
> 
> #[cfg(test)]
> mod tests {
>     #[test]
>     fn test_profile_block_hygiene() {
>         // Caller scope defines variables with identical names to macro internal variables
>         let start_time = "Caller string start_time";
>         let elapsed = 999999;
> 
>         // Invoke macro passing an expression
>         let (output, duration) = profile_block!({
>             let internal_calc = 21 * 2;
>             internal_calc
>         });
> 
>         // Assert macro output
>         assert_eq!(output, 42);
>         assert_eq!(duration, 500);
> 
>         // Assert caller's local variables are completely untouched by macro expansion
>         assert_eq!(start_time, "Caller string start_time");
>         assert_eq!(elapsed, 999999);
>     }
> }
> ```
> 
> **Explanation:**
> 1. **Syntax Context (`Span`) Tagging:** When `rustc` expands `profile_block!`, it assigns a unique `SyntaxContext` ID to every token generated inside the macro body. Even though the macro declares `let start_time = ...`, the compiler treats this token as `start_time#1` (macro scope), whereas the caller's variable is `start_time#0` (caller scope).
> 2. **Preventing Shadowing and Interference:** Because of distinct `SyntaxContext` tags, `start_time` inside the macro block does not collide with or shadow `let start_time = "Caller string start_time";` in `test_profile_block_hygiene()`.
> 3. **Block Expression Isolation:** Wrapping macro logic in double braces `{{ ... }}` creates an expression block, ensuring that temporary intermediate calculations return values cleanly without leaking macro tokens into surrounding code.

---

### Exercise 2: Crate Path Hygiene with Fully Qualified Absolute Imports (`$crate::...` / `::core::...`)

**Problem Statement:**
In a library crate designed for embedded or `no_std` environments, you build a custom telemetry packet framing macro `build_telemetry_packet!`. The macro creates a byte array packet using `core::option::Option`.

However, user code consuming your library might define a conflicting type or alias in local module scope (such as `struct Option;` or `type Option = MyCustomType;`). Because `macro_rules!` uses **mixed hygiene** (local variables are hygienic, but item names resolve in caller scope), unqualified references like `Option::Some` can fail to compile when invoked in caller modules with shadowed names.

Write a crate-safe macro `build_telemetry_packet!` that:
1. Constructs a fixed-size telemetry frame struct or byte buffer from sensor values.
2. Uses fully qualified path hygiene (`::core::option::Option`) to guarantee immunity against caller item shadowing.
3. Includes unit tests where the caller scope explicitly shadows standard item names (such as `Option`), proving that the macro expands and executes safely without compilation errors.

> [!check]- Answer
> ```rust
> // Simulated library macro using fully qualified item paths for path hygiene
> macro_rules! build_telemetry_packet {
>     ($sensor_id:expr, $value:expr) => {{
>         // Fully qualified path hygiene prevents caller scope shadowing of Option, Result, or traits
>         let status: ::core::option::Option<u16> = if $value > 0 {
>             ::core::option::Option::Some($value)
>         } else {
>             ::core::option::Option::None
>         };
> 
>         // Construct frame byte buffer: [header, sensor_id, status_flag, value_hi, value_lo]
>         let mut frame = [0u8; 5];
>         frame[0] = 0xAA; // Frame header
>         frame[1] = $sensor_id;
>         
>         match status {
>             ::core::option::Option::Some(val) => {
>                 frame[2] = 0x01; // Valid status
>                 frame[3] = (val >> 8) as u8;
>                 frame[4] = (val & 0xFF) as u8;
>             }
>             ::core::option::Option::None => {
>                 frame[2] = 0x00; // Invalid/null status
>                 frame[3] = 0x00;
>                 frame[4] = 0x00;
>             }
>         }
>         frame
>     }};
> }
> 
> #[cfg(test)]
> mod tests {
>     // Caller intentionally shadows standard items in local scope!
>     #[allow(dead_code)]
>     struct Option; // Shadow core::option::Option
>     #[allow(dead_code)]
>     struct Some;   // Shadow core::option::Option::Some
> 
>     #[test]
>     fn test_crate_path_hygiene() {
>         // Macro works reliably despite local item shadowing in caller module
>         let packet_valid = build_telemetry_packet!(0x05, 0x1234);
>         assert_eq!(packet_valid, [0xAA, 0x05, 0x01, 0x12, 0x34]);
> 
>         let packet_invalid = build_telemetry_packet!(0x05, 0);
>         assert_eq!(packet_invalid, [0xAA, 0x05, 0x00, 0x00, 0x00]);
>     }
> }
> ```
> 
> **Explanation:**
> 1. **Mixed Hygiene Model:** In Rust `macro_rules!`, local variable bindings are hygienic, but item names (types, traits, modules, functions) resolve in the *caller's* lexical scope.
> 2. **Preventing Item Hijacking:** If the macro used plain `Option::Some`, calling it in a module containing `struct Option;` would cause a type mismatch compilation error. Using `::core::option::Option` forces path resolution from the root crate namespace (`::`), bypassing local module shadowing completely.
> 3. **Library Macro Best Practice:** Crate macros exported for external use should always prepend `$crate::` for internal crate items and `::core::` or `::std::` for standard library types.

---

### Exercise 3: Controlled Scope Mutation vs. Internal Isolation in DSL Macro Generators

**Problem Statement:**
When building Domain-Specific Languages (DSLs) in Rust—such as state machine builders, event dispatchers, or database transaction runners—macros often need to perform a mix of **isolated internal operations** (e.g. tracking retry counts, intermediate status flags) and **intentional caller mutations** (e.g. updating a caller's state variable or output accumulator).

Write a macro `execute_transaction!` that:
1. Accepts an explicit target identifier `$target_state:ident`, a maximum retry count `$max_retries:expr`, and a closure/expression `$op:expr`.
2. Uses hygienic local variables (`let mut retries = 0;`, `let mut success = false;`) for internal loop management and retry counters so they never collide with the caller's local scope.
3. Intentionally mutates the passed caller identifier `$target_state` when a transaction succeeds or fails.
4. Includes unit tests demonstrating that internal loop variables (`retries`, `success`) do not leak into or collide with caller variables of the same name, while the passed `$target_state` identifier is updated correctly across retries.

> [!check]- Answer
> ```rust
> #[derive(Debug, PartialEq, Eq)]
> pub enum TransactionState {
>     Idle,
>     Running,
>     Committed(u32),
>     Failed,
> }
> 
> macro_rules! execute_transaction {
>     ($target_state:ident, $max_retries:expr, $op:expr) => {{
>         // Internal hygienic local variables isolated from caller scope
>         let mut retries = 0;
>         let mut success = false;
>         let mut final_val = 0;
> 
>         while retries < $max_retries && !success {
>             retries += 1;
>             let result: Result<u32, &'static str> = $op(retries);
>             if let Ok(val) = result {
>                 success = true;
>                 final_val = val;
>             }
>         }
> 
>         // Intentionally mutate caller's explicit identifier `$target_state`
>         if success {
>             $target_state = TransactionState::Committed(final_val);
>         } else {
>             $target_state = TransactionState::Failed;
>         }
> 
>         retries
>     }};
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_controlled_hygiene_and_mutation() {
>         // Caller defines variables named `retries` and `success`
>         let retries = "Caller string retries";
>         let success = 999;
>         let mut state = TransactionState::Idle;
> 
>         // Transaction succeeds on attempt 2
>         let attempts = execute_transaction!(state, 3, |attempt| {
>             if attempt >= 2 {
>                 Ok(100)
>             } else {
>                 Err("Temporary bus timeout")
>             }
>         });
> 
>         // 1. Assert internal retry counter operated correctly
>         assert_eq!(attempts, 2);
> 
>         // 2. Assert passed identifier `$target_state` (state) was intentionally updated
>         assert_eq!(state, TransactionState::Committed(100));
> 
>         // 3. Assert caller's local `retries` and `success` variables are completely unharmed
>         assert_eq!(retries, "Caller string retries");
>         assert_eq!(success, 999);
>     }
> }
> ```
> 
> **Explanation:**
> 1. **Identifier Matcher (`$ident:ident`) Hygiene Bypass:** Passing an explicit identifier token `$target_state:ident` allows the macro to operate on a variable defined in the caller's syntax context. The compiler preserves the token's origin span, making `$target_state` refer directly to `state` in `test_controlled_hygiene_and_mutation()`.
> 2. **Internal Scope Hygiene:** Local declarations inside the macro (`let mut retries = 0;`, `let mut success = false;`) receive the macro's internal syntax context. They are isolated from the caller's variables (`let retries = ...`, `let success = ...`).
> 3. **Controlled Scope Mutation Pattern:** This demonstrates the standard Rust macro design pattern: maintain clean isolation for internal implementation details while accepting explicit identifier arguments when mutating caller state is required.

---

## 7. Related Terms

- [Declarative Macros (`macro_rules!`)](../level_12/declarative_macros_macro_rules.md) — The pattern-matching macro system built with automatic local hygiene.
- [Token Stream](../level_12/token_stream.md) — `Span` metadata inside token streams tracks hygiene syntax contexts.
- [`quote` Crate](../level_12/quote_crate.md) — Proc macro generation tool exposing `Span::call_site()` and `Span::mixed_site()`.
- [Scope & Shadowing](../level_01/scope_and_shadowing.md) — Lexical scope and binding mechanics in Rust.

---

## 8. Key Takeaways

- Macro Hygiene prevents macro-generated local variables from colliding with or shadowing caller scope variables.
- Declarative macros (`macro_rules!`) feature automatic local variable hygiene.
- Item names (functions, traits, types) resolve in caller scope — always use fully qualified paths (`::std::...`, `$crate::...`) inside macros.
- In procedural macros, hygiene behavior is governed by `Span` contexts (`call_site` vs `mixed_site`).
- To intentionally create or mutate a caller variable, pass the identifier explicitly as a macro argument (`$var:ident`).
