# `'static` Lifetime

> **Level 5 — Lifetimes**
> The reserved lifetime specifying references valid for the entire duration of the program execution.

---

## 1. Prerequisites


- [Lifetime (`'a`)](lifetime.md) — The annotation mechanism.
- [Static (`static`)](../level_01/static_static.md) — Global memory storage location.
- [String vs &str](../level_01/string_vs_&str.md) — String literals naturally have a `'static` lifetime.

---

## 2. Term Category

**Reserved Lifetime & Trait Bound**: `'static` is a reserved lifetime keyword in Rust with two distinct meanings:
1. **As a Reference Lifetime (`&'static T`)**: Indicates data that resides in permanent memory (such as read-only binary data `.rodata` or heap allocations leaked via `Box::leak`) and remains valid for the entire runtime duration of the program.
2. **As a Trait Bound (`T: 'static`)**: Indicates that the type `T` can be retained indefinitely because it contains **no non-`'static` borrowed references**. Owned types like `String`, `i32`, or `Vec<u8>` satisfy `T: 'static`.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Some program data exists for the complete execution lifespan of an application:
- String literals (`"Hello, World!"`) compiled into the executable binary's read-only data segment (`.rodata`).
- Global variables declared with `static KEY: &str = "VAL";`.

Rust needs a reserved lifetime syntax to represent "this reference never expires". That reserved syntax is `'static`.

Furthermore, when spawning OS threads (`std::thread::spawn`), the background thread may outlive the stack frame of the function that spawned it. Rust enforces `F: Send + 'static` on thread closures to guarantee that no spawned thread accesses stack-allocated references that might be deallocated on the parent thread.

### (2) Deep Dive — `&'static T` vs `T: 'static`

It is critical to distinguish between these two concepts:

```rust
// 1. &'static str -> A REFERENCE valid for the entire program execution
let s: &'static str = "literal";

// 2. String -> AN OWNED TYPE that satisfies the `T: 'static` trait bound!
let owned: String = String::from("dynamic");

fn accept_static_type<T: 'static>(item: T) {
    // T can be owned (String) OR a static reference (&'static str).
    // T CANNOT be a short-lived reference like &'a str!
}
```

### (3) Reality Metaphor

- **Regular Reference (`&'a str`)**: A library book checked out on a 14-day pass (`'a`). You must return the book before the deadline or face fines.
- **Static Reference (`&'static str`)**: A monument carved into a granite mountain. It remains in place for as long as the mountain exists.
- **Owned Type satisfying `T: 'static` (`String`)**: A book you bought outright and own completely. Because you own it, you can keep it for 1 day, 10 years, or forever without returning it to anyone.

### (4) Rust Code Examples

#### Short Snippet (String Literals & Owned Types)
```rust
fn main() {
    let static_ref: &'static str = "compiled_into_rodata";
    let owned_string: String = String::from("heap_allocated");
    
    // Both satisfy T: 'static bound!
    print_static_bound(static_ref);
    print_static_bound(owned_string);
}

fn print_static_bound<T: 'static + std::fmt::Display>(val: T) {
    println!("Value: {val}");
}
```

#### Safely Promoting Dynamic Heap Memory via `Box::leak`
```rust
fn leak_runtime_string(s: String) -> &'static str {
    // Converts owned String into &'static str by intentionally bypassing deallocation
    Box::leak(s.into_boxed_str())
}

fn main() {
    let dynamic = format!("runtime_config_{}", 42);
    let static_str: &'static str = leak_runtime_string(dynamic);
    println!("Leaked static string: {static_str}");
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Confusing `&'static T` Reference Requirement with `T: 'static` Trait Bound

**The mistake:** Believing a function with a `T: 'static` bound can *only* accept `&'static` references.

**Why it is wrong:** `T: 'static` means "type `T` contains no non-static references". Owned types (`i32`, `String`, `Vec<u8>`) hold their own data and satisfy `T: 'static`.

*Incorrect:*
```rust
fn spawn_task<T: 'static>(val: T) {}

fn main() {
    let s = String::from("hello");
    // Incorrectly thinking s must be converted to &'static str before calling spawn_task!
}
```

*Fix:*
```rust
fn main() {
    let s = String::from("hello");
    spawn_task(s); // Correct: String owns its memory and satisfies T: 'static!
}
```

### Mistake 2: Overusing `Box::leak` to Bypass Borrow Checker Errors

**The mistake:** Using `Box::leak` routinely to turn temporary references into `&'static str` to solve lifetime errors.

**Why it is wrong:** `Box::leak` permanently leaks heap memory. Calling it inside loop iterations or high-frequency request handlers causes runaway memory consumption.

*Incorrect:*
```rust
fn process_request(query: String) -> &'static str {
    Box::leak(query.into_boxed_str()) // ❌ Memory leaked on every request!
}
```

*Fix:*
```rust
fn process_request(query: String) -> String {
    query // Return owned String or pass borrowed &str in short scope!
}
```

### Mistake 3: Attempting to Return References to Local Stack Variables as `&'static str`

**The mistake:** Annotating a function returning a reference to local stack memory with `-> &'static str`.

**Why it is wrong:** Stack variables are deallocated when the function frame pops. Returning a reference to local stack data violates memory safety and triggers compiler error `E0515`.

---

## 5. Practice Exercises

### Exercise 1: Multi-Threaded Task Dispatcher with `T: Send + 'static`

**Scenario:** Implement a background worker spawner `spawn_background_worker<T>` that accepts generic message payloads and dispatches them onto OS threads using `std::thread::spawn`.

**Requirements:**
1. Define function `spawn_background_worker<T: Send + 'static + std::fmt::Debug>(payload: T)`.
2. Spawn thread using `thread::spawn`.
3. Write unit tests passing owned structs and string literals.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::thread;
> 
> pub fn spawn_background_worker<T: Send + 'static + std::fmt::Debug>(payload: T) -> thread::JoinHandle<()> {
>     thread::spawn(move || {
>         println!("Background thread received payload: {:?}", payload);
>     })
> }
> 
> #[derive(Debug, PartialEq)]
> pub struct JobPayload {
>     pub id: u64,
>     pub action: String,
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_background_worker_static_bound() {
>         let job = JobPayload {
>             id: 1001,
>             action: String::from("PROCESS_IMAGE"),
>         };
>         
>         // Owned struct satisfies T: 'static!
>         let handle = spawn_background_worker(job);
>         handle.join().unwrap();
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `thread::spawn` requires the closure payload `F: 'static`.
> 2. `JobPayload` is an owned struct containing `u64` and `String`, satisfying `T: 'static`.
> 3. Moving `job` into the spawned thread avoids referencing parent stack frames.

---

### Exercise 2: High-Performance Interned String Dictionary (`Box::leak`)

**Scenario:** Implement a thread-safe string interner `StringInterner` that stores dynamic strings, leaks them safely on first insertion, and returns fast `&'static str` references for high-frequency parser lookups.

**Requirements:**
1. Define struct `StringInterner` wrapping `std::sync::Mutex<std::collections::HashSet<&'static str>>`.
2. Implement `intern(&self, s: &str) -> &'static str`.
3. Write unit tests verifying that interning the same string returns identical `&'static str` slice pointers.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::HashSet;
> use std::sync::Mutex;
> 
> pub struct StringInterner {
>     storage: Mutex<HashSet<&'static str>>,
> }
> 
> impl StringInterner {
>     pub fn new() -> Self {
>         Self { storage: Mutex::new(HashSet::new()) }
>     }
> 
>     pub fn intern(&self, s: &str) -> &'static str {
>         let mut guard = self.storage.lock().unwrap();
>         if let Some(&existing) = guard.get(s) {
>             existing
>         } else {
>             let leaked: &'static str = Box::leak(s.to_string().into_boxed_str());
>             guard.insert(leaked);
>             leaked
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_string_interner() {
>         let interner = StringInterner::new();
>         
>         let s1 = interner.intern("http_header_authorization");
>         let s2 = interner.intern("http_header_authorization");
>         
>         assert_eq!(s1, "http_header_authorization");
>         // Verify exact pointer equality for interned slices!
>         assert!(std::ptr::eq(s1.as_ptr(), s2.as_ptr()));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `Box::leak` converts dynamic `String` allocations into `'static` references.
> 2. `HashSet<&'static str>` dedupes strings so each unique string is leaked at most once.
> 3. `std::ptr::eq` confirms both returned slices point to the exact same memory address.

---

### Exercise 3: Global Thread-Safe Lazy Configuration

**Scenario:** Initialize a global configuration string using `std::sync::LazyLock` (or `lazy_static`) yielding a `&'static str` accessible across threads.

**Requirements:**
1. Declare a static global configuration string using `std::sync::LazyLock`.
2. Write unit tests reading global configuration from multiple threads.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::sync::LazyLock;
> use std::thread;
> 
> pub static GLOBAL_APP_NAME: LazyLock<String> = LazyLock::new(|| {
>     format!("EnterpriseGateway_v{}", 2)
> });
> 
> pub fn get_app_banner() -> &'static str {
>     &GLOBAL_APP_NAME
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_lazy_static_configuration() {
>         let t1 = thread::spawn(|| {
>             assert_eq!(get_app_banner(), "EnterpriseGateway_v2");
>         });
>         let t2 = thread::spawn(|| {
>             assert_eq!(get_app_banner(), "EnterpriseGateway_v2");
>         });
>         
>         t1.join().unwrap();
>         t2.join().unwrap();
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `LazyLock` initializes static data lazily on first access.
> 2. Static globals exist for the duration of the process, returning `&'static str` safely across concurrent threads.

---

## 6. Related Terms


- [Lifetime (`'a`)](lifetime.md) — The general concept.
- [Static (`static`)](../level_01/static_static.md) — Global variable declaration keyword.
- [`thread::spawn`](../level_09/thread_spawn.md) — Primary user of `T: 'static` bounds.
- [`Any` Trait / Downcasting](../level_04/any_trait_downcasting.md) — Related concept: `Any` Trait / Downcasting.
- [Scoped Threads (`std::thread::scope`)](../level_09/scoped_threads.md) — Related concept: Scoped Threads (`std::thread::scope`).

---

## 7. Key Takeaways

- `'static` reference (`&'static T`) means data remains valid for the entire program execution.
- String literals `"hello"` carry `&'static str` type automatically.
- `'static` trait bound (`T: 'static`) means type `T` owns its data or contains no non-static references (`String`, `i32`, `Vec<u8>` satisfy `T: 'static`).
- Thread spawning (`thread::spawn`) requires `'static` bounds to prevent referencing destroyed stack frames.
