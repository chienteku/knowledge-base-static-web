# `Borrow<T>` Trait

> **Level 14 — Rust**
> Similar to `AsRef`, but additionally guarantees that the borrowed form has the same `Hash`, `Eq`, and `Ord` as the owning type — critical for `HashMap` and `BTreeMap` lookups.

---

## 1. Prerequisites

- [`Borrow` / `BorrowMut`](borrow_borrow_mut.md) — Borrow / BorrowMut traits.

---


## 2. Term Category

**Borrowing Trait**: `std::borrow::Borrow` for abstraction over owned and borrowed data with hash equality invariants.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

`HashMap<String, V>` requires key lookups using `&str` without cloning or allocating a new `String` key.

`Borrow<T>` allows querying a data structure using a borrowed reference `&T` where `Hash`, `Eq`, and `Ord` operations produce identical results whether comparing the owned type (`String`) or the borrowed type (`str`).

### (2) Reality Metaphor

A bank vault deposit locker: you can access locker contents using either your original metal physical key (owned) or a validated digital keycard duplicate (borrowed) because both produce identical lock authorization signatures.

### (3) Rust Code Examples

#### Short Snippet
```rust
use std::borrow::Borrow;
fn get_len<T: Borrow<str>>(item: T) -> usize {
    item.borrow().len()
}
```

#### Fuller Example
```rust
use std::borrow::Borrow;
use std::collections::HashMap;

pub struct Cache {
    map: HashMap<String, String>,
}

impl Cache {
    pub fn new() -> Self {
        Self { map: HashMap::new() }
    }
    pub fn insert(&mut self, k: String, v: String) {
        self.map.insert(k, v);
    }
    pub fn get<Q>(&self, key: &Q) -> Option<&str>
    where
        String: Borrow<Q>,
        Q: Hash + Eq + ?Sized,
    {
        self.map.get(key).map(|s| s.as_str())
    }
}

fn main() {
    let mut c = Cache::new();
    c.insert("key1".into(), "val1".into());
    assert_eq!(c.get("key1"), Some("val1"));
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Implementing `Borrow<T>` When `Eq` / `Hash` Invariants Are Violated

**The mistake:** Implementing `Borrow<T>` for a struct where `Hash` or `Eq` produce different outputs between owned and borrowed forms.

**Why it is wrong:** `HashMap` and `BTreeMap` rely on `Borrow<T>` preserving identical hash and equality values. Breaking this invariant causes lost keys in hash tables.

*Incorrect:*
```rust
impl Borrow<str> for CaseInsensitiveString { fn borrow(&self) -> &str { &self.0 } } // Hashes differ!
```

*Fix:*
```rust
Ensure Hash and Eq implementations yield identical results for both owned and borrowed types!
```

### Mistake 2: Using `AsRef<T>` Instead of `Borrow<T>` for Map Key Lookup Traits

**The mistake:** Attempting to use `AsRef<T>` for generic collection key lookup generic bounds.

**Why it is wrong:** `AsRef` does not guarantee identical `Hash` or `Eq` values; `HashMap::get` specifically requires `Borrow<Q>`.

*Incorrect:*
```rust
fn get<Q: AsRef<str>>(map: &HashMap<String, V>, key: &Q)
```

*Fix:*
```rust
fn get<Q>(map: &HashMap<String, V>, key: &Q) where String: Borrow<Q>
```

### Mistake 3: Forgetting `BorrowMut<T>` for Mutable Borrowing

**The mistake:** Trying to mutate a borrowed value via `Borrow::borrow`.

**Why it is wrong:** `Borrow` only grants immutable `&T` references; use `BorrowMut::borrow_mut` for `&mut T`.

*Incorrect:*
```rust
let b: &mut str = item.borrow(); // Error!
```

*Fix:*
```rust
use std::borrow::BorrowMut; let b: &mut str = item.borrow_mut();
```

---

## 5. Practice Exercises

### Exercise 1: Custom Case-Preserving String Cache with Zero-Allocation Lookups

**Scenario:** Build a custom lookup cache using `HashMap<String, usize>` supporting zero-allocation string slice lookups via `Borrow`.

**Requirements:**
1. Implement `SymbolTable` struct holding `HashMap<String, u32>`.
1. Implement `get_id<Q>(&self, name: &Q) -> Option<u32>` bounded by `String: Borrow<Q>`.
1. Test with `&str` and `String`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::borrow::Borrow;
> use std::collections::HashMap;
> use std::hash::Hash;
> 
> pub struct SymbolTable {
>     symbols: HashMap<String, u32>,
>     next_id: u32,
> }
> 
> impl SymbolTable {
>     pub fn new() -> Self {
>         Self {
>             symbols: HashMap::new(),
>             next_id: 1,
>         }
>     }
> 
>     pub fn intern(&mut self, name: &str) -> u32 {
>         if let Some(&id) = self.symbols.get(name) {
>             return id;
>         }
>         let id = self.next_id;
>         self.symbols.insert(name.to_string(), id);
>         self.next_id += 1;
>         id
>     }
> 
>     pub fn lookup<Q>(&self, name: &Q) -> Option<u32>
>     where
>         String: Borrow<Q>,
>         Q: Hash + Eq + ?Sized,
>     {
>         self.symbols.get(name).copied()
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_symbol_table_borrow() {
>         let mut table = SymbolTable::new();
>         let id1 = table.intern("my_var");
>         assert_eq!(table.lookup("my_var"), Some(id1));
>         assert_eq!(table.lookup(&"my_var".to_string()), Some(id1));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `String: Borrow<Q>` allows `symbols.get(name)` to accept `&str` without allocating a `String` key.
> 2. Hash and equality invariants are preserved.

---

### Exercise 2: Generic Set Membership Checker Bounded by `Borrow`

**Scenario:** Implement a generic function `contains_item<T, Q>(set: &HashSet<T>, item: &Q) -> bool` where `T: Borrow<Q>`.

**Requirements:**
1. Implement `contains_item`.
1. Test with `HashSet<PathBuf>` and `&Path`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::borrow::Borrow;
> use std::collections::HashSet;
> use std::hash::Hash;
> use std::path::{Path, PathBuf};
> 
> pub fn contains_path<Q>(set: &HashSet<PathBuf>, path: &Q) -> bool
> where
>     PathBuf: Borrow<Q>,
>     Q: Hash + Eq + ?Sized,
> {
>     set.contains(path)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_contains_path_borrow() {
>         let mut set = HashSet::new();
>         set.insert(PathBuf::from("/etc/config"));
>         assert!(contains_path(&set, Path::new("/etc/config")));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `PathBuf: Borrow<Path>` enables checking set membership using borrowed `&Path` slices.

---

### Exercise 3: Custom Struct `Borrow` Implementation

**Scenario:** Implement `Borrow<str>` for a custom `NormalizedString` struct.

**Requirements:**
1. Define `NormalizedString(String)`.
1. Implement `Borrow<str>`.
1. Verify hash equality.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::borrow::Borrow;
> 
> #[derive(Debug, Eq, PartialEq, Hash)]
> pub struct NormalizedString(pub String);
> 
> impl Borrow<str> for NormalizedString {
>     fn borrow(&self) -> &str {
>         &self.0
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
>     use std::collections::HashSet;
> 
>     #[test]
>     fn test_custom_borrow_hashset() {
>         let mut set = HashSet::new();
>         set.insert(NormalizedString("admin".into()));
>         assert!(set.contains("admin"));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Implementing `Borrow<str>` for `NormalizedString` allows querying `HashSet<NormalizedString>` directly with `&str`.

---

## 5. Related Terms

- [`Hash` Trait](../level_02/hash_trait.md)
- [`Borrow` / `BorrowMut`](borrow_borrow_mut.md) — Borrow trait family.

---


## 7. Key Takeaways

- Abstraction over owned and borrowed types with strict `Hash` and `Eq` invariants.
- Powers `HashMap::get` and `HashSet::contains` for zero-allocation key lookups.
- Guarantees that owned and borrowed representations yield identical hashes and comparison results.
- Use `BorrowMut` for mutable references.
