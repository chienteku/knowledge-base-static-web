# `Function Pointers` (`fn()`)

> **Level 6 — Closures & Functional Patterns**
> A primitive scalar type representing a pointer to a function — distinct from closures because it cannot capture its environment.

---

## 1. Prerequisites


- [Closure](closure.md) — The closely related, but fundamentally different, callable type this contrasts with.
- [`Fn` / `FnMut` / `FnOnce`](fn_traits.md) — The trait family closures implement, which function pointers *also* implement.
- [`fn` (Functions)](../level_01/fn.md) — The keyword that both declares functions and names this type.

---

## 2. Term Category

**Primitive Type (environment-free callables)**: `fn(Args) -> Ret` is a concrete, primitive, scalar `Copy` type in Rust that stores the raw memory address of an executable function. Unlike closure types, function pointers carry **zero captured environment state**, making them thin pointers (a single machine word) fully compatible with C FFI.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Capturing closures require generating unique compiler structs to hold captured references or owned variables. Consequently, two closures with identical bodies have distinct, unnameable struct types.

Plain functions (`fn add(a: i32, b: i32) -> i32`), however, carry no environment. They execute stateless code located at a fixed memory address in the executable binary.

Rust exposes this capability through **Function Pointers (`fn`)**:
1. **Concrete, Nameable Type**: Unlike closures, `fn(i32) -> i32` is an explicit type nameable in structs, arrays, and FFI interfaces.
2. **`Copy` & `Send` & `Sync`**: Because a function pointer is just a code memory address, it implements `Copy`, `Clone`, `Send`, and `Sync` automatically.
3. **Coercion from Non-Capturing Closures**: Any closure that captures *no variables* from its environment automatically coerces to a raw function pointer `fn`.

### (2) Deep Dive — Function Pointers vs Closure Traits

Function pointers implement all three closure traits (`Fn`, `FnMut`, `FnOnce`), but the reverse is **not** true:

$$\text{Bare Functions / Non-Capturing Closures} \xrightarrow{\text{Coerce}} \text{fn(A) -> B} \implies \text{Implements Fn, FnMut, FnOnce}$$

$$\text{Capturing Closures} \implies \text{Anonymous Struct} \centernot\implies \text{fn(A) -> B}$$

### (3) Reality Metaphor

- **Function Pointer (`fn`)**: A GPS coordinate pinned to a public library branch. Anyone can follow the coordinate to reach the exact same building, and sending the coordinate over a text message (`Copy`) costs nothing.
- **Capturing Closure**: A mobile food truck with ingredients and kitchen gear inside. You cannot represent the food truck using just a GPS coordinate, because moving the truck requires towing its entire physical vehicle and inventory (**captured state**).

### (4) Rust Code Examples

#### Top-Level Function & Non-Capturing Closure Coercion
```rust
fn add_one(x: i32) -> i32 { x + 1 }

fn main() {
    // Top-level function assigns to function pointer type
    let fp: fn(i32) -> i32 = add_one;
    assert_eq!(fp(5), 6);

    // Non-capturing closure coerces to function pointer!
    let non_capturing_closure = |x: i32| x * 2;
    let fp2: fn(i32) -> i32 = non_capturing_closure;
    assert_eq!(fp2(5), 10);
}
```

#### Function Pointer Lookup Table
```rust
type MathOp = fn(i32, i32) -> i32;

fn add(a: i32, b: i32) -> i32 { a + b }
fn sub(a: i32, b: i32) -> i32 { a - b }
fn mul(a: i32, b: i32) -> i32 { a * b }

fn get_operator(symbol: char) -> Option<MathOp> {
    match symbol {
        '+' => Some(add),
        '-' => Some(sub),
        '*' => Some(mul),
        _ => None,
    }
}

fn main() {
    let op = get_operator('+').unwrap();
    assert_eq!(op(10, 20), 30);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Attempting to Assign a Capturing Closure to a `fn` Pointer

**The mistake:** Trying to store a closure that captures environment variables into a `fn` function pointer type.

**Why it is wrong:** Capturing closures carry environment struct fields. `fn` pointers only store code addresses with zero payload. The compiler rejects this with `E0308`.

*Incorrect:*
```rust
let offset = 10;
let f: fn(i32) -> i32 = |x| x + offset; // ❌ Error E0308: expected fn pointer, found closure with captured environment
```

*Fix:*
```rust
let offset = 10;
let f = |x: i32| x + offset; // Use closure type or generic bound F: Fn(i32) -> i32!
```

### Mistake 2: Specifying `fn` Pointer Parameter in APIs Intended for General Closures

**The mistake:** Defining a public library function `fn process(f: fn(i32))` instead of using generic `fn process<F: Fn(i32)>(f: F)`.

**Why it is wrong:** Hardcoding `fn(i32)` forces API callers to pass non-capturing functions or closures, preventing them from passing capturing closures.

*Incorrect:*
```rust
fn for_each_num(nums: &[i32], callback: fn(i32)) { ... } // Rejects capturing closures!
```

*Fix:*
```rust
fn for_each_num<F: Fn(i32)>(nums: &[i32], callback: F) { ... } // Accepts functions AND closures!
```

### Mistake 3: Omitting `extern "C"` when Passing Function Pointers to C FFI

**The mistake:** Passing a standard Rust `fn()` pointer to C code without specifying ABI calling conventions.

**Why it is wrong:** Rust's default ABI (`extern "Rust"`) is unstable and does not match C calling conventions (`extern "C"`), leading to stack corruption in FFI calls.

---

## 5. Practice Exercises

### Exercise 1: FFI C-Compatible Callback Bridge

**Scenario:** Design a C FFI callback dispatch system `CLogger` accepting stateless function pointers `extern "C" fn(level: i32, msg: *const std::ffi::c_char)`.

**Requirements:**
1. Define type alias `type LogCallback = extern "C" fn(i32, *const std::ffi::c_char)`.
2. Implement `struct CLogger` holding `callback: LogCallback`.
3. Implement `log_message(&self, level: i32, msg: &str)`.
4. Write unit tests with an `extern "C"` static handler function.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::ffi::CString;
> use std::os::raw::c_char;
> 
> pub type LogCallback = extern "C" fn(i32, *const c_char);
> 
> pub struct CLogger {
>     callback: LogCallback,
> }
> 
> impl CLogger {
>     pub fn new(callback: LogCallback) -> Self {
>         Self { callback }
>     }
> 
>     pub fn log(&self, level: i32, message: &str) {
>         let c_str = CString::new(message).unwrap();
>         (self.callback)(level, c_str.as_ptr());
>     }
> }
> 
> extern "C" fn default_c_log(level: i32, msg: *const c_char) {
>     unsafe {
>         let c_str = std::ffi::CStr::from_ptr(msg);
>         println!("[C-Log L{}] {}", level, c_str.to_str().unwrap());
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_c_logger() {
>         let logger = CLogger::new(default_c_log);
>         logger.log(1, "System initialized");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `extern "C" fn(...)` defines the C ABI calling convention for thin function pointers.
> 2. `LogCallback` stores a bare code memory address with zero environment overhead.

---

### Exercise 2: High-Performance Command Dispatch Table

**Scenario:** Build a command execution registry `CommandRegistry` storing command string names mapped to stateless function pointers `fn(&str) -> Result<String, String>`.

**Requirements:**
1. Define `struct CommandRegistry` wrapping `std::collections::HashMap<&'static str, fn(&str) -> Result<String, String>>`.
2. Implement `register` and `execute` methods.
3. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::HashMap;
> 
> pub type CommandFn = fn(&str) -> Result<String, String>;
> 
> pub struct CommandRegistry {
>     handlers: HashMap<&'static str, CommandFn>,
> }
> 
> impl CommandRegistry {
>     pub fn new() -> Self {
>         Self { handlers: HashMap::new() }
>     }
> 
>     pub fn register(&mut self, cmd: &'static str, handler: CommandFn) {
>         self.handlers.insert(cmd, handler);
>     }
> 
>     pub fn execute(&self, cmd: &str, arg: &str) -> Result<String, String> {
>         let handler = self.handlers.get(cmd).ok_or("Command not found")?;
>         handler(arg)
>     }
> }
> 
> fn echo_cmd(arg: &str) -> Result<String, String> {
>     Ok(format!("Echo: {arg}"))
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_command_registry() {
>         let mut reg = CommandRegistry::new();
>         reg.register("echo", echo_cmd);
>         
>         let res = reg.execute("echo", "hello world");
>         assert_eq!(res, Ok("Echo: hello world".to_string()));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `fn(&str) -> Result<String, String>` is a concrete `Copy` type stored directly in the `HashMap`.
> 2. Avoids dynamic trait object allocations (`Box<dyn Fn(...)>`).

---

### Exercise 3: Pluggable Sorting Comparator Engine

**Scenario:** Implement a slice sorting utility `custom_sort<T>(slice: &mut [T], comparator: fn(&T, &T) -> std::cmp::Ordering)` that uses stateless function pointers for element comparison.

**Requirements:**
1. Implement `custom_sort` using function pointer comparators.
2. Write unit tests passing non-capturing closures and top-level comparator functions.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::cmp::Ordering;
> 
> pub fn custom_sort<T>(slice: &mut [T], comparator: fn(&T, &T) -> Ordering) {
>     slice.sort_by(|a, b| comparator(a, b));
> }
> 
> fn reverse_cmp(a: &i32, b: &i32) -> Ordering {
>     b.cmp(a)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_function_pointer_sorting() {
>         let mut data = vec![5, 2, 8, 1, 9];
>         custom_sort(&mut data, reverse_cmp);
>         assert_eq!(data, vec![9, 8, 5, 2, 1]);
>         
>         // Non-capturing closure coerces to fn pointer!
>         custom_sort(&mut data, |a, b| a.cmp(b));
>         assert_eq!(data, vec![1, 2, 5, 8, 9]);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `comparator: fn(&T, &T) -> Ordering` accepts both top-level functions (`reverse_cmp`) and non-capturing closures.
> 2. Function pointers carry zero environment overhead.

---

## 6. Related Terms


- [Closure](closure.md) — The capturing, generally more flexible sibling that `fn` pointers contrast with.
- [`Fn` / `FnMut` / `FnOnce`](fn_traits.md) — The trait family that `fn` pointers *also* implement (specifically `Fn`, since they never mutate captured state — they have none).
- [FFI (Foreign Function Interface)](../level_13/ffi.md)
- [`Fat Pointers` (Wide Pointers)](../level_11/fat_pointers.md) — A useful contrast: `fn` pointers are always **thin** (a single address), unlike `dyn Trait` references.

---

## 7. Key Takeaways

- `fn(Args) -> Ret` is a concrete, `Copy`, `Send + Sync` primitive type representing bare code memory addresses.
- Function pointers carry **zero** captured environment state.
- Non-capturing closures automatically coerce to function pointers (`fn`); capturing closures do not.
- Prefer generic `F: Fn(...)` trait bounds for general APIs, and use bare `fn` pointers when environment-free callables or FFI ABI compatibility is required.
