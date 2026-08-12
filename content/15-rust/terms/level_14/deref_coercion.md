# Deref Coercion

> **Level 14 — Rust**
> An implicit compiler transformation that converts `&String` → `&str`, `&Box<T>` → `&T`, etc., by following `Deref` implementations through a chain.

---

## 1. Prerequisites

- [`Deref` / `DerefMut` Traits](deref_deref_mut_traits.md) — Deref traits.

---

## 2. Term Category



**Rust Implicit Conversion (smart pointer reference deref coercion)**: Automatic Deref coercion converting `&T` to `&U` when `T: Deref<Target = U>`.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Without deref coercion, passing a smart pointer like `String` or `Box<T>` to a function expecting `&str` or `&T` would require writing explicit dereferencing syntax like `&*s` or `s.as_str()` every time.

Deref coercion is an automatic compiler type conversion that transforms a reference `&T` into `&U` when `T` implements `Deref<Target = U>`. It works transparently for function parameters, method calls, and field access.

### (2) Reality Metaphor

An automatic telescopic lens adapter on a camera: attaching a telephoto converter lens automatically redirects light through the secondary lens without requiring physical lens teardown.

### (3) Rust Code Examples

#### Short Snippet
```rust
fn greet(name: &str) { println!("Hello {name}"); }
let s = String::from("Alice");
greet(&s); // Automatic Deref coercion from &String to &str!
```

#### Fuller Example
```rust
use std::ops::Deref;

pub struct SmartBox<T>(T);
impl<T> Deref for SmartBox<T> {
    type Target = T;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

fn process_str(s: &str) -> usize {
    s.len()
}

fn main() {
    let boxed = SmartBox(String::from("Rust"));
    // Deref coercion: &SmartBox<String> -> &String -> &str
    assert_eq!(process_str(&boxed), 4);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Expecting Deref Coercion on Value Types (Not References)

**The mistake:** Passing an owned value `String` to a function expecting `&str` without `&`.

**Why it is wrong:** Deref coercion *only* applies to reference types (`&T` to `&U`), not owned value types.

*Incorrect:*
```rust
fn print(s: &str) {} let s = String::from("a"); print(s); // Type mismatch error!
```

*Fix:*
```rust
fn print(s: &str) {} let s = String::from("a"); print(&s); // Pass &s for Deref coercion!
```

### Mistake 2: Chaining Custom Deref Coercion Across Too Many Unrelated Types

**The mistake:** Implementing `Deref` solely to simulate object inheritance or code reuse.

**Why it is wrong:** Abusing `Deref` for non-smart-pointer types confuses callers and can lead to unexpected method shadowing.

*Incorrect:*
```rust
impl Deref for UserProfile { type Target = UserDetails; ... }
```

*Fix:*
```rust
Use composition and explicit helper methods instead of abusing Deref for structural subtyping!
```

### Mistake 3: Forgetting Deref Coercion Applies to Method Calls Automatically

**The mistake:** Writing explicit `(*boxed).method()` syntax.

**Why it is wrong:** Rust's method lookup automatically dereferences `&T` to find methods on `Target`.

*Incorrect:*
```rust
let len = (*boxed_str).len();
```

*Fix:*
```rust
let len = boxed_str.len(); // Automatic method deref!
```

---

## 5. Practice Exercises

### Exercise 1: Smart Pointer Reference Passing Pipeline

**Scenario:** Demonstrate a multi-layer deref coercion chain from `Box<String>` to `&str` across nested function calls.

**Requirements:**
1. Create nested wrapper functions taking `&str`.
1. Pass `Box<String>` and verify automatic deref coercion.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn count_vowels(s: &str) -> usize {
>     s.chars().filter(|c| "aeiouAEIOU".contains(*c)).count()
> }
> 
> pub fn analyze_boxed_text(text: &Box<String>) -> usize {
>     // Deref coercion transforms &Box<String> -> &String -> &str
>     count_vowels(text)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_deref_coercion_chain() {
>         let boxed: Box<String> = Box::new(String::from("Automation"));
>         assert_eq!(analyze_boxed_text(&boxed), 5);
>         assert_eq!(count_vowels(&boxed), 5); // Direct deref coercion from &Box<String> to &str!
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Compiler automatically chains `Box<T>::deref` and `String::deref` to convert `&Box<String>` into `&str`.
> 2. Zero boilerplate syntax required.
> 
---

### Exercise 2: Custom Smart Pointer `Deref` Coercion for Buffer View

**Scenario:** Create a custom smart pointer `BufferWrapper<T>` implementing `Deref<Target = [T]>` and pass it to slice functions.

**Requirements:**
1. Define `BufferWrapper<T>` holding `Vec<T>`.
1. Implement `Deref<Target = [T]>`.
1. Pass `&BufferWrapper<i32>` to function taking `&[i32]`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::ops::Deref;
> 
> pub struct BufferWrapper<T> {
>     data: Vec<T>,
> }
> 
> impl<T> BufferWrapper<T> {
>     pub fn new(data: Vec<T>) -> Self { Self { data } }
> }
> 
> impl<T> Deref for BufferWrapper<T> {
>     type Target = [T];
>     fn deref(&self) -> &Self::Target {
>         &self.data
>     }
> }
> 
> pub fn sum_slice(slice: &[i32]) -> i32 {
>     slice.iter().sum()
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_custom_deref_coercion() {
>         let buf = BufferWrapper::new(vec![10, 20, 30]);
>         // Deref coercion: &BufferWrapper<i32> -> &[i32]
>         assert_eq!(sum_slice(&buf), 60);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `BufferWrapper<T>` implements `Deref<Target = [T]>`.
> 2. Passing `&buf` to `sum_slice` triggers automatic compiler Deref coercion.
> 
---

### Exercise 3: Atomic RefCell Guard Deref Coercion

**Scenario:** Demonstrate Deref coercion on `RefCell` read guard `Ref<T>`.

**Requirements:**
1. Use `std::cell::RefCell`.
1. Pass `Ref<String>` to `&str` function.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::cell::RefCell;
> 
> pub fn get_len(s: &str) -> usize {
>     s.len()
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_refcell_deref_coercion() {
>         let cell = RefCell::new(String::from("Hello"));
>         let borrow = cell.borrow();
>         // &Ref<String> derefs to &String which derefs to &str
>         assert_eq!(get_len(&borrow), 5);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `RefCell` borrow guards implement `Deref`.
> 2. Allows passing borrow guards directly to standard slice functions.
> 
---

## 6. Related Terms

- [`Deref` / `DerefMut` Traits](deref_deref_mut_traits.md) — Deref traits.

---

## 7. Key Takeaways

- Automatic type conversion from `&T` to `&U` when `T: Deref<Target = U>`.
- Applies to function parameters, method calls, and field access.
- Can chain multiple dereferences automatically (`&Box<String>` to `&str`).
- Only applies to references (`&T`), not owned values (`T`).
