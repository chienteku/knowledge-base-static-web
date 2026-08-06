# Specialization (Unstable)

> **Level 19 — Rust**
> (Nightly) Allows more specific trait implementations to override more general blanket implementations for particular types.

---

## 1. Prerequisites

- [Nightly Compiler](nightly_compiler.md) — Nightly feature gate.
- [Trait](../level_04/trait.md) — Traits.

---

## 2. Term Category



**Rust Experimental Feature (overlapping generic trait specialization)**: Trait specialization allowing specialized implementations for specific types.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Rust enforces the orphan rule and coherence: a type cannot have multiple overlapping trait implementations.

Specialization permits a blanket trait implementation (`impl<T> Trait for T`) to be overridden by a more specialized implementation for specific types (e.g. `impl Trait for u8`), enabling optimized fast-paths (like `memcpy` for byte slices) without sacrificing generic APIs.

### (2) Reality Metaphor

A highway express lane: regular vehicles take standard lanes, while authorized emergency vehicles take the high-speed express lane.

### (3) Rust Code Examples

#### Short Snippet
```rust
// #![feature(specialization)]
// impl<T> FastCopy for T { ... }
// impl FastCopy for u8 { /* memcpy! */ }
```

#### Fuller Example
```rust
pub trait FastZero {
    fn zero() -> Self;
}

impl<T: Default> FastZero for T {
    default fn zero() -> Self {
        T::default()
    }
}

// Specialized fast path for u8
impl FastZero for u8 {
    fn zero() -> Self {
        0
    }
}

fn main() {
    assert_eq!(u8::zero(), 0);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using `default fn` on Stable Toolchain

**The mistake:** Attempting to use `default fn` specialization on stable Rust.

**Why it is wrong:** Specialization is an unstable nightly feature (`#![feature(specialization)]`) due to soundness interaction with lifetimes.

*Incorrect:*
```rust
default fn item()
```

*Fix:*
```rust
Use standard trait bounds or enum dispatch on stable Rust!
```

### Mistake 2: Creating Soundness Bugs with Lifetime Specialization

**The mistake:** Attempting to specialize based on lifetime parameters `'a` vs `'static`.

**Why it is wrong:** Specializing on lifetimes is unsound and forbidden in Rust type system design.

*Incorrect:*
```rust
impl<T> Trait for &'static T
```

*Fix:*
```rust
Specialize only on concrete types, not lifetime bounds!
```

### Mistake 3: Confusing Specialization with C++ Template Specialization

**The mistake:** Expecting C++ style unconstrained template specialization.

**Why it is wrong:** Rust specialization requires explicit `default` keywords and coherence validation.

*Incorrect:*
```rust
Unconstrained template specialization
```

*Fix:*
```rust
Rust requires explicit default impl annotations for specialization!
```

---

## 5. Practice Exercises

### Exercise 1: Specialized Slice Copy Fast-Path Simulator

**Scenario:** Simulate a trait providing a generic element-by-element copy alongside a specialized `memcpy` fast path for `u8` bytes.

**Requirements:**
1. Define `CustomCopy` trait.
1. Implement generic fallback and specialized `u8` fast path.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub trait CustomCopy {
>     fn copy_to_slice(src: &[Self], dst: &mut [Self]) where Self: Sized + Copy {
>         dst.copy_from_slice(src);
>     }
> }
> 
> impl CustomCopy for i32 {}
> impl CustomCopy for u8 {}
> 
> pub fn fast_byte_copy(src: &[u8], dst: &mut [u8]) {
>     // Specialized fast path for byte slices using ptr::copy_nonoverlapping
>     unsafe {
>         std::ptr::copy_nonoverlapping(src.as_ptr(), dst.as_mut_ptr(), src.len());
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_byte_copy_fast_path() {
>         let src = [1u8, 2, 3, 4];
>         let mut dst = [0u8; 4];
>         fast_byte_copy(&src, &mut dst);
>         assert_eq!(dst, [1, 2, 3, 4]);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Demonstrates the performance motivation for specialization in standard library collections.
> 2. Replaces element iteration with `memcpy` for byte primitives.
> 
---

### Exercise 2: Specialized Formatting Fast Path Simulator

**Scenario:** Simulate specialized string formatting for integer primitives versus generic types.

**Requirements:**
1. Implement `FastFormat` for generic `T: std::fmt::Display`.
1. Provide integer fast path.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub trait FastFormat {
>     fn write_fast(&self) -> String;
> }
> 
> impl<T: std::fmt::Display> FastFormat for T {
>     fn write_fast(&self) -> String {
>         self.to_string()
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_fast_format() {
>         assert_eq!(42.write_fast(), "42");
>         assert_eq!("hello".write_fast(), "hello");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Illustrates blanket trait implementations.
> 2. Specialization enables overriding these defaults for specific primitive types.
> 
---

### Exercise 3: Default Method Override Guard

**Scenario:** Simulate default method implementations in traits.

**Requirements:**
1. Define trait with default method.
1. Override for target struct.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub trait Inspector {
>     fn inspect(&self) -> &'static str { "generic" }
> }
> 
> pub struct CustomItem;
> impl Inspector for CustomItem {
>     fn inspect(&self) -> &'static str { "custom" }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_inspection() {
>         let item = CustomItem;
>         assert_eq!(item.inspect(), "custom");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Shows method overriding semantics in Rust traits.
> 2. Foundation for trait specialization.
> 
---

## 6. Related Terms

- [Blanket Implementation](../level_14/blanket_implementation.md) — Overriding blanket implementations.
- [Nightly Compiler](nightly_compiler.md) — Related concept: Nightly Compiler.

---

## 7. Key Takeaways

- Specialization allows specialized trait implementations to override blanket impls.
- Enables zero-cost performance optimizations (e.g. `memcpy` for `u8` slices).
- Requires explicit `default` keyword on overridable methods.
- Currently unstable on Rust (`#![feature(specialization)]`).
