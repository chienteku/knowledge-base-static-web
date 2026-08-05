# Extension Trait

> **Level 18 — Rust**
> Adding methods to foreign or primitive types by defining a new trait and implementing it, without modifying the original type.

---

## 1. Prerequisites

- [Trait](../level_04/trait.md) — Traits.
- [Orphan Rule](../level_14/orphan_rule.md) — Orphan rule restrictions.

---


## 2. Term Category

**Design Pattern**: Extension traits for augmenting external standard types.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Rust's orphan rule prevents implementing external traits for external types (e.g. implementing `Display` for `Vec<T>`). However, developers frequently need utility helper methods on standard types like `str`, `Option<T>`, or `u64`.

The Extension Trait pattern defines a local trait (`pub trait StrExt`) containing helper methods and implements it for external types (`impl StrExt for str`). Bring the extension trait into scope to invoke helper methods directly on standard types.

### (2) Reality Metaphor

Attaching an aftermarket smartphone mount to a standard bicycle handlebar: you cannot alter the bicycle factory frame, but you can extend its functionality using a local accessory interface.

### (3) Rust Code Examples

#### Short Snippet
```rust
pub trait StrExt { fn is_digit_only(&self) -> bool; }
impl StrExt for str { fn is_digit_only(&self) -> bool { self.chars().all(|c| c.is_ascii_digit()) } }
```

#### Fuller Example
```rust
pub trait VecExt<T> {
    fn second(&self) -> Option<&T>;
}

impl<T> VecExt<T> for Vec<T> {
    fn second(&self) -> Option<&T> {
        self.get(1)
    }
}

fn main() {
    let v = vec![10, 20, 30];
    assert_eq!(v.second(), Some(&20));
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Violating the Orphan Rule in Extension Traits

**The mistake:** Attempting to implement an external trait for an external target type.

**Why it is wrong:** Rust requires either the trait or the target type to be local to the current crate.

*Incorrect:*
```rust
impl ExternalTrait for String { ... } // Compiler Error!
```

*Fix:*
```rust
pub trait LocalExtension { ... } impl LocalExtension for String { ... } // Correct!
```

### Mistake 2: Forgetting to Import Extension Trait in Calling Modules

**The mistake:** Invoking extension trait methods without bringing the extension trait into scope via `use`.

**Why it is wrong:** Extension trait methods are invisible to the compiler unless the trait is imported into the calling module scope.

*Incorrect:*
```rust
let b = "123".is_digit_only(); // Method not found error!
```

*Fix:*
```rust
use crate::extension::StrExt; let b = "123".is_digit_only(); // OK!
```

### Mistake 3: Naming Extension Methods Identically to Standard Library Methods

**The mistake:** Creating extension methods that shadow existing standard methods.

**Why it is wrong:** Causes compiler ambiguity errors and confusion for callers.

*Incorrect:*
```rust
pub trait StrExt { fn len(&self) -> usize; }
```

*Fix:*
```rust
Choose explicit, non-overlapping extension method names (e.g. `fn word_count(&self)`)!
```

---

## 5. Practice Exercises

### Exercise 1: String Slice Ellipsis Truncator Extension

**Scenario:** Build an extension trait `StrEllipsisExt` adding `truncate_ellipsis(&self, max_len: usize) -> String` to standard string slices `str`.

**Requirements:**
1. Define `StrEllipsisExt` trait.
1. Implement for `str`.
1. Write unit tests verifying truncation.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub trait StrEllipsisExt {
>     fn truncate_ellipsis(&self, max_len: usize) -> String;
> }
> 
> impl StrEllipsisExt for str {
>     fn truncate_ellipsis(&self, max_len: usize) -> String {
>         if self.len() <= max_len {
>             self.to_string()
>         } else {
>             format!("{}...", &self[..max_len])
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_ellipsis_extension() {
>         let text = "Rust Programming";
>         assert_eq!(text.truncate_ellipsis(4), "Rust...");
>         assert_eq!(text.truncate_ellipsis(50), "Rust Programming");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `StrEllipsisExt` is a local extension trait implemented for standard `str`.
> 2. Bringing `StrEllipsisExt` into scope enables fluent `.truncate_ellipsis()` calls on all string slices.

---

### Exercise 2: Slice Chunking Extension Trait

**Scenario:** Create a `SliceChunkExt<T>` adding helper method `head_and_tail(&self) -> Option<(&T, &[T])>`.

**Requirements:**
1. Define `SliceChunkExt<T>`.
1. Implement for `[T]`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub trait SliceChunkExt<T> {
>     fn head_and_tail(&self) -> Option<(&T, &[T])>;
> }
> 
> impl<T> SliceChunkExt<T> for [T] {
>     fn head_and_tail(&self) -> Option<(&T, &[T])> {
>         self.split_first()
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_head_and_tail() {
>         let arr = [10, 20, 30];
>         let (head, tail) = arr.head_and_tail().unwrap();
>         assert_eq!(*head, 10);
>         assert_eq!(tail, &[20, 30]);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Extends standard slice `[T]` with convenient pattern splitting.
> 2. Idiomatic Rust API extension.

---

### Exercise 3: Option Fallible Boolean Helper Extension

**Scenario:** Implement `OptionBoolExt` adding `.is_true(&self) -> bool` to `Option<bool>`.

**Requirements:**
1. Define `OptionBoolExt`.
1. Implement for `Option<bool>`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub trait OptionBoolExt {
>     fn is_true(&self) -> bool;
> }
> 
> impl OptionBoolExt for Option<bool> {
>     fn is_true(&self) -> bool {
>         matches!(self, Some(true))
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_option_bool() {
>         assert!(Some(true).is_true());
>         assert!(!Some(false).is_true());
>         assert!(!None.is_true());
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Extends standard `Option<bool>` with concise predicate checking.
> 2. Eliminates verbose `match` blocks.

---

## 5. Related Terms

- [Blanket Implementation](../level_14/blanket_implementation.md) — Blanket trait implementations.

---


## 7. Key Takeaways

- Extends external types with custom helper methods without violating the orphan rule.
- Requires bringing the extension trait into scope (`use crate::StrExt`).
- Avoid shadowing standard library method names.
- Improves API ergonomics and fluent method chaining.
