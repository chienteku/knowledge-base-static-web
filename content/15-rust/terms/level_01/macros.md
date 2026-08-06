# Macros

> **Level 1 — Foundations**
> Code that writes code, denoted by a trailing `!`.

---

## 1. Prerequisites


- [`fn` (Functions)](fn.md) — The standard way to write reusable code in Rust.
- [`println!` / `format!`](println_format.md) — Common macros like println!.

---

## 2. Term Category

**Rust-specific (the meta-programming tool)**: In many languages, functions are flexible enough to take any number of arguments of any type. In Rust, functions are extremely strict. To achieve flexibility (like a `println!` that can take 1 or 10 arguments), Rust relies on Macros: specialized code that literally writes standard Rust code for you before compilation.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In Rust, a standard `fn` has a fixed number of arguments, and those arguments have strict, fixed types. 

But what if you want to write a function like `println!`? Sometimes you want to print 1 string. Sometimes you want to print 1 string and 5 integers. A standard Rust function literally *cannot* do this. 

To solve this, Rust uses **Macros**. A macro is not a function. It is a set of rules for **writing code**. When you type a macro (denoted by the `!`), you are telling the compiler: *"Hey, before you compile this program, look at the arguments I passed here, and automatically generate the massive amount of boilerplate Rust code needed to make it work."*

### (2) Reality Metaphor

Imagine a standard **function** is a chef cooking a recipe. You hand the chef exactly 3 specific ingredients (arguments), and the chef bakes exactly 1 cake.

A **macro** is the architect who built the kitchen. You tell the architect, *"I need to bake 100 cakes at once,"* and the architect dynamically builds you a massive, custom-designed kitchen with 100 ovens *before* the chef even arrives to start cooking. 

### (3) Rust Code Examples

#### Short Snippet (The Expansion)
You use the `vec!` macro to easily create a new `Vec` containing items.
```rust
fn main() {
    // We write 1 line using a Macro:
    let my_list = vec![1, 2, 3];
    
    // During compilation, the Macro automatically expands it into this boilerplate for us:
    /*
    let mut temp = Vec::new();
    temp.push(1);
    temp.push(2);
    temp.push(3);
    let my_list = temp;
    */
}
```

#### Fuller Example (Variable Arguments)
Macros allow you to pass a variable number of arguments, which is impossible with a standard `fn`.
```rust
fn main() {
    // 1 argument
    println!("Hello!"); 
    
    // 3 arguments of completely different types!
    println!("Hello {}! You are {} years old.", "Alice", 30); 
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Macros Scoping and Lifecycle Rules

**The mistake:** Assuming Macros instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("macros_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("macros_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Macros State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Macros through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Macros Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Macros instances across OS threads via `std::thread::spawn`.

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

---

## 5. Practice Exercises

### Exercise 1: High-Performance Telemetry Audit Logger Macro (`audit_event!`)

**Scenario:** In distributed microservices, logging structured audit events with key-value pairs (`"user_id" => 42`, `"action" => "login"`) often causes code repetition and inefficient vector reallocations.

**Requirements:**
Implement a macro `audit_event!` that constructs an `AuditEvent` instance taking a `Severity` level (`Info`, `Warn`, `Error`), a target service name (`&str`), and arbitrary key-value metadata tags (`key => value`). The macro must:
1. Use an internal macro count rule (`@count`) to count key-value pairs at expansion time and allocate `Vec::with_capacity(cap)` precisely.
2. Support optional trailing commas after key-value pairs.
3. Automatically convert both keys and values into `String` using `.to_string()`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq, Clone)]
> pub enum Severity {
>     Info,
>     Warn,
>     Error,
> }
> 
> #[derive(Debug, PartialEq, Eq, Clone)]
> pub struct AuditEvent {
>     pub level: Severity,
>     pub target: String,
>     pub tags: Vec<(String, String)>,
> }
> 
> impl AuditEvent {
>     pub fn new(level: Severity, target: impl Into<String>, tags: Vec<(String, String)>) -> Self {
>         Self {
>             level,
>             target: target.into(),
>             tags,
>         }
>     }
> }
> 
> macro_rules! audit_event {
>     // Internal recursive helper to count key-value pairs for precise vector pre-allocation
>     (@count) => { 0usize };
>     (@count $head_key:expr => $head_val:expr $(, $tail_key:expr => $tail_val:expr)* $(,)?) => {
>         1usize + audit_event!(@count $($tail_key => $tail_val),*)
>     };
> 
>     // Main macro entry point
>     ($level:ident, $target:expr $(, $key:expr => $val:expr)* $(,)?) => {{
>         let cap = audit_event!(@count $($key => $val),*);
>         let mut tags = Vec::with_capacity(cap);
>         $(
>             tags.push(($key.to_string(), $val.to_string()));
>         )*
>         AuditEvent::new(Severity::$level, $target, tags)
>     }};
> }
> 
> fn main() {
>     let event = audit_event!(
>         Info,
>         "auth_service",
>         "user_id" => 1042,
>         "ip_address" => "192.168.1.1",
>     );
>     println!("Generated Audit Event: {:?}", event);
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_audit_event_creation_with_tags() {
>         let event = audit_event!(
>             Info,
>             "auth_service",
>             "user_id" => 42,
>             "action" => "login_success",
>         );
> 
>         assert_eq!(event.level, Severity::Info);
>         assert_eq!(event.target, "auth_service");
>         assert_eq!(event.tags.len(), 2);
>         assert_eq!(event.tags[0], ("user_id".to_string(), "42".to_string()));
>         assert_eq!(event.tags[1], ("action".to_string(), "login_success".to_string()));
>         assert!(matches!(event.level, Severity::Info));
>         assert_ne!(event.target, "payment_service");
>     }
> 
>     #[test]
>     fn test_audit_event_zero_tags() {
>         let event = audit_event!(Warn, "rate_limiter");
>         assert_eq!(event.level, Severity::Warn);
>         assert_eq!(event.target, "rate_limiter");
>         assert!(event.tags.is_empty());
>         assert_eq!(event.tags.capacity(), 0);
>         assert!(matches!(event.level, Severity::Warn));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Declarative Pattern Matching & Specifiers (`ident`, `expr`):**
>    The main matcher branch `($level:ident, $target:expr $(, $key:expr => $val:expr)* $(,)?)` matches an enum variant identifier (`$level`), a string/expression target (`$target`), zero or more key-value pairs (`$key => $val`), and an optional trailing comma `$(,)?`.
> 2. **Token Counting via Internal Recurrence (`@count`):**
>    Dynamic arrays (`Vec`) reallocate heap buffer memory when exceeding initial capacity. By defining an internal recursive macro arm `(@count ...)`, `audit_event!` counts key-value expressions during compile-time macro expansion. This allows initializing `Vec::with_capacity(cap)` with exact capacity, eliminating runtime reallocation overhead during audit logging.
> 3. **Hygiene & Local Scope Isolation:**
>    The macro body is wrapped in double curly braces `{{ ... }}`. Rust macro hygiene guarantees that internally declared local bindings (`cap`, `tags`) do not pollute or collide with identifiers in the invoking scope.
> 4. **Ownership & Lifetime Invariants:**
>    By executing `.to_string()` on both key and value expressions, the constructed `AuditEvent` takes full ownership of tag string data, decoupling log entry lifetimes from temporary references passed at the call site.
> 5. **Edge Cases Handled:**
>    - Zero key-value metadata tags (`audit_event!(Warn, "rate_limiter")`) correctly evaluates `@count` to `0` and allocates an empty vector.
>    - Trailing commas are gracefully matched by the `$(,)?` specifier.
>
> 
---

### Exercise 2: Declarative HTTP Route Dispatcher DSL Macro (`dispatch_route!`)

**Scenario:** Writing manual `if-else` branches to match HTTP methods, endpoint paths, and mandatory HTTP request headers in low-overhead embedded API services is verbose and prone to routing bugs.

Construct a macro `dispatch_route!` that evaluates an `HttpRequest` against a series of declared endpoint arms and returns a `RouteResult` (`Handled(String)`, `MethodNotAllowed`, `NotFound`).
The macro must:

**Requirements:**
1. Support matching HTTP methods (`GET`, `POST`, `PUT`, `DELETE`), path literal expressions, and optional header requirements (`[ header "key" == "value" ]`).
2. Evaluate branches sequentially without non-local returns (so the macro expression resolves directly to a `RouteResult`).
3. Return `RouteResult::MethodNotAllowed` if the path matches an endpoint but the HTTP method or required header conditions fail across all branches.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub enum HttpMethod {
>     Get,
>     Post,
>     Put,
>     Delete,
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct HttpRequest<'a> {
>     pub method: HttpMethod,
>     pub path: &'a str,
>     pub headers: &'a [(&'a str, &'a str)],
> }
> 
> impl<'a> HttpRequest<'a> {
>     pub fn get_header(&self, key: &str) -> Option<&'a str> {
>         self.headers
>             .iter()
>             .find(|(k, _)| k.eq_ignore_ascii_case(key))
>             .map(|(_, v)| *v)
>     }
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub enum RouteResult {
>     Handled(String),
>     NotFound,
>     MethodNotAllowed,
> }
> 
> macro_rules! dispatch_route {
>     (
>         $req:expr,
>         $(
>             $method:ident $path:expr $( [ header $h_key:literal == $h_val:literal ] )? => $body:block
>         ),* $(,)?
>     ) => {{
>         let req_ref = &$req;
>         let mut path_matched_any = false;
>         let mut match_result: Option<RouteResult> = None;
> 
>         $(
>             if match_result.is_none() && req_ref.path == $path {
>                 path_matched_any = true;
>                 if req_ref.method == HttpMethod::$method {
>                     let mut header_matched = true;
>                     $(
>                         if req_ref.get_header($h_key) != Some($h_val) {
>                             header_matched = false;
>                         }
>                     )?
>                     if header_matched {
>                         match_result = Some(RouteResult::Handled($body));
>                     }
>                 }
>             }
>         )*
> 
>         match match_result {
>             Some(res) => res,
>             None if path_matched_any => RouteResult::MethodNotAllowed,
>             None => RouteResult::NotFound,
>         }
>     }};
> }
> 
> fn main() {
>     let req = HttpRequest {
>         method: HttpMethod::Get,
>         path: "/health",
>         headers: &[],
>     };
> 
>     let res = dispatch_route!(
>         req,
>         GET "/health" => { "System Operational".to_string() },
>     );
>     println!("Route Result: {:?}", res);
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_successful_route_dispatch() {
>         let req = HttpRequest {
>             method: HttpMethod::Post,
>             path: "/users",
>             headers: &[("content-type", "application/json")],
>         };
> 
>         let res = dispatch_route!(
>             req,
>             GET "/users" => { "List users".to_string() },
>             POST "/users" [header "content-type" == "application/json"] => { "Create user".to_string() },
>         );
> 
>         assert_eq!(res, RouteResult::Handled("Create user".to_string()));
>         assert!(matches!(res, RouteResult::Handled(_)));
>         assert_ne!(res, RouteResult::NotFound);
>     }
> 
>     #[test]
>     fn test_method_not_allowed() {
>         let req = HttpRequest {
>             method: HttpMethod::Put,
>             path: "/users",
>             headers: &[],
>         };
> 
>         let res = dispatch_route!(
>             req,
>             GET "/users" => { "List users".to_string() },
>             POST "/users" => { "Create user".to_string() },
>         );
> 
>         assert_eq!(res, RouteResult::MethodNotAllowed);
>         assert!(matches!(res, RouteResult::MethodNotAllowed));
>         assert_ne!(res, RouteResult::NotFound);
>     }
> 
>     #[test]
>     fn test_route_not_found() {
>         let req = HttpRequest {
>             method: HttpMethod::Get,
>             path: "/unknown",
>             headers: &[],
>         };
> 
>         let res = dispatch_route!(
>             req,
>             GET "/users" => { "List users".to_string() },
>         );
> 
>         assert_eq!(res, RouteResult::NotFound);
>         assert!(matches!(res, RouteResult::NotFound));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **DSL Syntax Matcher & Fragment Specifiers:**
>    The rule matcher syntax `( $req:expr, $( $method:ident $path:expr $( [ header $h_key:literal == $h_val:literal ] )? => $body:block ),* $(,)? )` parses custom domain-specific language (DSL) tokens. It binds method variants (`ident`), path strings (`expr`), optional header key-value literals (`literal`), and handler response blocks (`block`).
> 2. **Optional Sub-Pattern Repetition (`$( ... )?`):**
>    Using `?` inside macro repetition patterns enables optional syntax matching. The macro conditionally checks header validity only when the optional `[ header "key" == "value" ]` clause is present in the route definition.
> 3. **Block Expression Control Flow vs Function Returns:**
>    Invoking `return` inside a macro block terminates the enclosing function rather than resolving the macro expression. To ensure `dispatch_route!` behaves as a pure value-returning expression, the macro uses local state tracking (`let mut path_matched_any`, `let mut match_result`) to capture the outcome and return it via a `match` expression.
> 4. **Zero-Copy Lifetime Semantics:**
>    `HttpRequest<'a>` holds borrowed slices `&'a str` and `&'a [(&'a str, &'a str)]`. The route dispatcher operates purely on borrowed string slices, avoiding dynamic heap string allocations during path and header matching.
> 5. **Edge Cases Handled:**
>    - Matching path with incorrect method or failing header validation yields `RouteResult::MethodNotAllowed`.
>    - Completely unmatched path yields `RouteResult::NotFound`.
>
> 
---

### Exercise 3: Zero-Cost Type-Safe Bitfield Generator Macro (`define_bitflags!`)

**Scenario:** Low-level systems, driver programming, and binary packet parsers often rely on raw integer bitmasks (`u8`, `u16`, `u32`). Performing unchecked bitwise operations (`|`, `&`) using raw numbers leads to subtle bugs and lacks type safety.

Design a macro `define_bitflags!` that autogenerates a strongly-typed bitfield wrapper struct over an integer primitive type.
The macro must:

**Requirements:**
1. Accept struct attributes, visibility modifier (`pub`), struct identifier, underlying integer type, and named constant flag definitions with bit shift expressions.
2. Autogenerate associated constants (`ALL_BITS`, flag names), constructors (`empty()`, `all()`, `from_bits(bits)`), and mutation helper methods (`contains`, `insert`, `remove`, `toggle`, `is_empty`).
3. Implement `BitOr`, `BitAnd`, and `BitXor` standard library ops traits for the generated struct.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> macro_rules! define_bitflags {
>     (
>         $(#[$meta:meta])*
>         $vis:vis struct $name:ident: $ty:ty {
>             $(
>                 $(#[$flag_meta:meta])*
>                 $flag:ident = $value:expr
>             ),* $(,)?
>         }
>     ) => {
>         $(#[$meta])*
>         #[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Default)]
>         $vis struct $name {
>             bits: $ty,
>         }
> 
>         impl $name {
>             /// Combined bitmask of all defined flags for validation.
>             pub const ALL_BITS: $ty = 0 $( | ($value) )*;
> 
>             $(
>                 $(#[$flag_meta])*
>                 pub const $flag: Self = Self { bits: $value };
>             )*
> 
>             /// Creates an empty set of flags (bits = 0).
>             pub const fn empty() -> Self {
>                 Self { bits: 0 }
>             }
> 
>             /// Creates a set containing all defined flags.
>             pub const fn all() -> Self {
>                 Self { bits: Self::ALL_BITS }
>             }
> 
>             /// Validates and constructs flags from raw integer representation.
>             /// Returns `None` if bits contain undefined flags.
>             pub const fn from_bits(bits: $ty) -> Option<Self> {
>                 if (bits & !Self::ALL_BITS) == 0 {
>                     Some(Self { bits })
>                 } else {
>                     None
>                 }
>             }
> 
>             /// Returns the raw integer value of the bitmask.
>             pub const fn bits(&self) -> $ty {
>                 self.bits
>             }
> 
>             /// Checks whether all flags in `other` are present in `self`.
>             pub const fn contains(&self, other: Self) -> bool {
>                 (self.bits & other.bits) == other.bits
>             }
> 
>             /// Inserts specified flags in-place.
>             pub fn insert(&mut self, other: Self) {
>                 self.bits |= other.bits;
>             }
> 
>             /// Removes specified flags in-place.
>             pub fn remove(&mut self, other: Self) {
>                 self.bits &= !other.bits;
>             }
> 
>             /// Toggles specified flags in-place.
>             pub fn toggle(&mut self, other: Self) {
>                 self.bits ^= other.bits;
>             }
> 
>             /// Returns `true` if no flags are set.
>             pub const fn is_empty(&self) -> bool {
>                 self.bits == 0
>             }
>         }
> 
>         impl std::ops::BitOr for $name {
>             type Output = Self;
>             fn bitor(self, rhs: Self) -> Self::Output {
>                 Self { bits: self.bits | rhs.bits }
>             }
>         }
> 
>         impl std::ops::BitAnd for $name {
>             type Output = Self;
>             fn bitand(self, rhs: Self) -> Self::Output {
>                 Self { bits: self.bits & rhs.bits }
>             }
>         }
> 
>         impl std::ops::BitXor for $name {
>             type Output = Self;
>             fn bitxor(self, rhs: Self) -> Self::Output {
>                 Self { bits: self.bits ^ rhs.bits }
>             }
>         }
>     };
> }
> 
> define_bitflags! {
>     pub struct FilePermissions: u8 {
>         READ    = 1 << 0,
>         WRITE   = 1 << 1,
>         EXECUTE = 1 << 2,
>     }
> }
> 
> fn main() {
>     let perms = FilePermissions::READ | FilePermissions::WRITE;
>     println!("File permissions bitmask: 0b{:08b}", perms.bits());
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     define_bitflags! {
>         struct TestFlags: u8 {
>             ALPHA = 1 << 0,
>             BETA  = 1 << 1,
>             GAMMA = 1 << 2,
>         }
>     }
> 
>     #[test]
>     fn test_bitflags_operations() {
>         let mut flags = TestFlags::ALPHA | TestFlags::BETA;
> 
>         assert_eq!(flags.bits(), 0b0000_0011);
>         assert!(flags.contains(TestFlags::ALPHA));
>         assert!(flags.contains(TestFlags::BETA));
>         assert!(!flags.contains(TestFlags::GAMMA));
>         assert_ne!(flags, TestFlags::all());
> 
>         flags.insert(TestFlags::GAMMA);
>         assert_eq!(flags, TestFlags::all());
> 
>         flags.remove(TestFlags::ALPHA);
>         assert_eq!(flags, TestFlags::BETA | TestFlags::GAMMA);
> 
>         flags.toggle(TestFlags::BETA);
>         assert_eq!(flags, TestFlags::GAMMA);
>     }
> 
>     #[test]
>     fn test_from_bits_validation() {
>         let valid = TestFlags::from_bits(0b0000_0101);
>         assert!(valid.is_some());
>         assert_eq!(valid.unwrap(), TestFlags::ALPHA | TestFlags::GAMMA);
>         assert!(matches!(valid, Some(_)));
> 
>         let invalid = TestFlags::from_bits(0b0001_0000);
>         assert!(invalid.is_none());
>         assert_eq!(invalid, None);
>         assert!(matches!(invalid, None));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Meta Attribute Forwarding & Fragment Specifiers:**
>    The macro pattern `$(#[$meta:meta])* $vis:vis struct $name:ident: $ty:ty` captures doc comments/attributes (`$meta`), visibility modifiers (`$vis`), struct name (`$name`), and backing primitive integer type (`$ty`). This allows callers to attach `///` documentation and visibility scopes seamlessly.
> 2. **Compile-Time Constant Expression Folding (`ALL_BITS`):**
>    Computing `pub const ALL_BITS: $ty = 0 $( | ($value) )*;` uses macro repetition over flag values to construct a single compile-time bitwise mask. The Rust compiler folds this expression at compile time into a constant integer literal with zero runtime cost.
> 3. **Bitmask Validation Invariant (`from_bits`):**
>    The `from_bits(bits)` constructor enforces data integrity by checking `(bits & !Self::ALL_BITS) == 0`. If any undefined bit outside `ALL_BITS` is set, `from_bits` returns `None`, preventing invalid bitstates from leaking into memory.
> 4. **Type-Safe Operator Overloading:**
>    Implementing `std::ops::BitOr`, `BitAnd`, and `BitXor` enables idiomatic syntax (`Flags::READ | Flags::WRITE`) while prohibiting accidental bitwise operations across incompatible bitflag types.
> 5. **Edge Cases Handled:**
>    - Empty flag initialization (`empty()`) initializes `bits = 0`.
>    - Checking invalid bits via `from_bits` correctly returns `None`.
>    - In-place bit mutations (`insert`, `remove`, `toggle`) correctly alter internal primitive bit representation.
>
> 
---

## 6. Related Terms


- [`println!` / `format!`](println_format.md) — The most common macros in Rust.
- [`panic!` Macro](../level_04/panic.md) — The macro used to crash the program on an unrecoverable error.
- [Declarative Macros (`macro_rules!`)](../level_12/declarative_macros_macro_rules.md) — macro_rules! macros.

---

## 7. Key Takeaways

- Macros are "code that writes code".
- They are expanded into actual Rust boilerplate code *before* the program is compiled.
- You can spot them because they always end with an exclamation mark (`!`).
- They allow you to write operations that take a variable number of arguments (like `println!`) or generate massive amounts of boilerplate safely (like `vec!`).
