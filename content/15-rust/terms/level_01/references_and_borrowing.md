# References and Borrowing (`&`, `&mut`)

> **Level 1 — Rust**
> Rust's mechanism for accessing data without taking ownership: shared references (`&T`) allow multiple readers; mutable references (`&mut T`) allow one writer at a time.

---

## 1. Prerequisites

- [Variable](variable.md) — Variable bindings.

---

## 2. Term Category



**Rust Core Feature (non-owning memory pointer views)**: References (`&T` shared, `&mut T` exclusive) and borrowing rules preventing data races at compile time.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Passing large data structures by value copies or moves ownership, making variable reuse impossible. Conversely, unconstrained pointer aliasing in C/C++ causes data races and use-after-free bugs.

Rust references (`&T` shared immutable reference, `&mut T` exclusive mutable reference) allow borrowing access to data without taking ownership. Rust strictly enforces the Aliasing XOR Mutability rule at compile time: either any number of shared references (`&T`) exist, OR exactly one exclusive mutable reference (`&mut T`) exists.

### (2) Reality Metaphor

A library book reference policy: 50 library patrons can simultaneously read reference copies of a book in the reading room (many `&T` shared references), but when the book restoration specialist edits annotations (`&mut T`), all other readers must leave the room.

### (3) Rust Code Examples

#### Short Snippet
```rust
let mut val = 10;
let r1 = &val;
let r2 = &val;
println!("{r1}, {r2}"); // Multiple shared references allowed!
```

#### Fuller Example
```rust
pub fn append_exclamation(s: &mut String) {
    s.push('!');
}

fn main() {
    let mut text = String::from("Hello");
    append_exclamation(&mut text);
    assert_eq!(text, "Hello!");
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Aliasing XOR Mutability Violation (Simultaneous `&` and `&mut`)

**The mistake:** Creating a mutable reference `&mut x` while a shared reference `&x` is still active.

**Why it is wrong:** Violates core borrowing rules. Prevents data races where one thread reads data while another mutates it.

*Incorrect:*
```rust
let mut x = 5; let r = &x; let m = &mut x; println!("{r}"); // Compiler Error!
```

*Fix:*
```rust
Ensure shared references finish before creating a mutable reference!
```

### Mistake 2: Returning References to Local Stack Variables (Dangling Reference)

**The mistake:** Attempting to return a reference `&String` created inside a function scope.

**Why it is wrong:** Local stack variables drop when the function exits; returning a reference to dropped data creates a dangling pointer.

*Incorrect:*
```rust
fn get_str() -> &String { let s = String::from("a"); &s } // Dangling reference error!
```

*Fix:*
```rust
Return owned String instead: fn get_str() -> String { String::from("a") }
```

### Mistake 3: Mutating a Vector While Iterating Over It

**The mistake:** Calling `vec.push()` inside a `for item in &vec` loop.

**Why it is wrong:** `vec.push()` requires `&mut vec` which invalidates existing `&vec` iterator references because the vector memory buffer might reallocate.

*Incorrect:*
```rust
for item in &vec { vec.push(1); } // Compiler Error!
```

*Fix:*
```rust
Collect indices or mutate after iteration finishes!
```

---

## 5. Practice Exercises

### Exercise 1: Safe In-Place Text Normalizer Utility

**Scenario:** Build a text normalization utility `normalize_spaces(text: &mut String)` that mutates a string buffer in-place zero-copy.

**Requirements:**
1. Accept `&mut String` parameter.
1. Replace double spaces.
1. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn normalize_spaces(text: &mut String) {
>     while text.contains("  ") {
>         *text = text.replace("  ", " ");
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_borrowed_mutation() {
>         let mut msg = String::from("Hello   world  from   Rust");
>         normalize_spaces(&mut msg);
>         assert_eq!(msg, "Hello world from Rust");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Takes an exclusive mutable reference `&mut String` to modify the caller's data in-place without returning a new value.
> 
---

### Exercise 2: Shared Reference Read-Only Search Function

**Scenario:** Build a search utility `contains_keyword(text: &str, keyword: &str) -> bool` using shared references.

**Requirements:**
1. Accept `&str` shared references.
1. Return boolean.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn contains_keyword(text: &str, keyword: &str) -> bool {
>     text.contains(keyword)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_shared_borrow() {
>         let doc = "Systems programming in Rust";
>         assert!(contains_keyword(doc, "Rust"));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Uses `&str` shared references allowing multiple callers to read the document concurrently.
> 
---

### Exercise 3: Slice Ref Splitter

**Scenario:** Implement `first_word(s: &str) -> &str` returning a borrowed subslice reference.

**Requirements:**
1. Return `&str` slice reference tied to input lifetime.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn first_word(s: &str) -> &str {
>     s.split_whitespace().next().unwrap_or("")
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_first_word() {
>         let sentence = String::from("hello world");
>         let word = first_word(&sentence);
>         assert_eq!(word, "hello");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Lifetime elision ties return reference lifetime directly to input reference lifetime.
> 
---

## 6. Related Terms

- [Raw Pointers (`*const T`, `*mut T`)](../level_13/raw_pointers.md) — 
- [`AsRef` / `AsMut`](../level_14/as_ref_as_mut.md) — 
- [Borrowing (`&`)](../level_03/borrowing.md) — Immutable borrowing (&T).
- [Mutable Borrowing (`&mut`)](../level_03/mutable_borrowing.md) — Mutable borrowing (&mut T).
- [Mutability (`mut`)](mutability_mut.md) — Related concept: Mutability (`mut`).

---

## 7. Key Takeaways

- References allow inspecting or mutating data without taking ownership.
- Shared references `&T` allow multiple concurrent readers (immutable).
- Exclusive references `&mut T` allow exactly one writer (mutable).
- Aliasing XOR Mutability rule prevents data races at compile time.
