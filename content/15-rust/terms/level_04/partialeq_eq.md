# `PartialEq` / `Eq`

> **Level 4 — Error Handling & Generics**
> Traits for equality comparison; `Eq` is a marker for total equality.

---

## 1. Prerequisites

- [Trait](../level_04/trait.md) — The contract being implemented.
- [Derive Macro](../level_04/derive_macro.md) — How you get these traits for free 99% of the time.
- [Expressions (`==`)](../level_01/expressions.md) — The operators that these traits unlock.

---

## 2. Term Category

**Rust-specific (the comparison engine)**: In languages like Python or JavaScript, you can use the `==` operator to compare almost anything. In Rust, you can only use `==` if the compiler mathematically guarantees the two objects know how to compare themselves. The `PartialEq` and `Eq` traits provide that exact mathematical guarantee.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

How do you know if two custom `User` structs are "equal"? Do all the fields have to match? Does just the `id` have to match? Rust doesn't guess. It forces you to implement the **`PartialEq`** trait, which provides the underlying logic for the `==` and `!=` operators. 

**So what is `Eq`?**
Some types in computer science have mathematically bizarre edge cases. For example, floating-point numbers (`f32`, `f64`) have a special value called `NaN` (Not a Number). According to international computer science standards, `NaN == NaN` is *false*. Because a value is not equal to itself, floating point numbers are only *partially* equal to each other. 

Therefore, `f32` implements `PartialEq`, but it does not implement `Eq`. 

**`Eq`** is a special "marker trait" (it has no methods). You add it *on top* of `PartialEq` to promise the compiler: *"My custom type has no weird `NaN` edge cases. Every value is 100% equal to itself (Total Equality)."* Many standard library data structures (like HashMaps) require `Eq` to function safely.

### (2) Reality Metaphor

Imagine `PartialEq` is a **Bouncer** at a club checking IDs. They check if the face matches the photo. It works 99% of the time, but sometimes a person shows up wearing a ski-mask (`NaN`). The bouncer's system breaks down and rejects them, even if they are comparing the person to a photo of themselves in the ski-mask. The checking system is only *partially* reliable.

`Eq` is a **VIP Stamp** on the ID. It is a mathematical guarantee to the club owner that *"This specific group of people will never wear ski-masks. You can trust the Bouncer to evaluate them correctly 100% of the time."*

### (3) Rust Code Examples

#### Short Snippet (The Free Implementation)
99% of the time, you want two structs to be equal if *every single field* inside them is exactly equal. You use the `#[derive]` macro to get this behavior for free.

```rust
// We derive both!
#[derive(PartialEq, Eq)]
struct Coordinate {
    x: i32,
    y: i32,
}

fn main() {
    let p1 = Coordinate { x: 5, y: 10 };
    let p2 = Coordinate { x: 5, y: 10 };
    let p3 = Coordinate { x: 0, y: 0 };
    
    // The == operator works magically because of PartialEq!
    println!("p1 equals p2? {}", p1 == p2); // true
    println!("p1 equals p3? {}", p1 == p3); // false
}
```

#### Fuller Example (Manual Business Logic)
Sometimes, "equality" is subjective. If you have two `User` structs with the same database ID but different usernames (maybe one just changed their name), are they equal? In a database context, yes! We must implement `PartialEq` manually.

```rust
struct User {
    id: u32,
    username: String,
}

// We implement PartialEq manually!
impl PartialEq for User {
    fn eq(&self, other: &Self) -> bool {
        // We only care if the IDs match. Ignore the username completely!
        self.id == other.id
    }
}

// We add Eq as a blank marker to promise `id == id` is always mathematically true.
impl Eq for User {}

fn main() {
    let old_user = User { id: 1, username: String::from("alice99") };
    let new_user = User { id: 1, username: String::from("alice_the_great") };
    
    // This will print TRUE, even though the usernames are different!
    if old_user == new_user {
        println!("They are the exact same user in the database.");
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Partialeq Eq Scoping and Lifecycle Rules

**The mistake:** Assuming Partialeq Eq instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("partialeq_eq_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("partialeq_eq_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Partialeq Eq State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Partialeq Eq through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Partialeq Eq Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Partialeq Eq instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Cross-Type Zero-Allocation `PartialEq` for High-Performance Cache Keys

**Problem:**
In high-throughput database caching layers, allocating a temporary `String` just to query a `HashMap<CacheKey, Value>` introduces significant garbage generation and memory overhead. To enable zero-allocation lookups, custom key types can implement `PartialEq` across heterogeneous types—such as allowing a `CacheKey` (which wraps an owned string or normalized buffer) to be compared directly against borrowed string slices (`&str` or `String`).

Implement a `CacheKey` struct containing a normalized routing string and a numeric tenant identifier `tenant_id: u64`.
1. Implement `PartialEq` and `Eq` for `CacheKey` comparing both `tenant_id` and `path`.
2. Implement `PartialEq<str>`, `PartialEq<&str>`, and `PartialEq<String>` for `CacheKey` so that a `CacheKey` with `tenant_id == 0` (the default global tenant) can be compared directly against string slices without constructing a new `CacheKey` instance.
3. Write a comprehensive unit test suite in `#[cfg(test)] mod tests` utilizing explicit `assert!`, `assert_eq!`, `assert_ne!`, and `matches!` assertions verifying symmetric, transitive, and cross-type equality semantics.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::fmt;
>
> #[derive(Debug, Clone)]
> pub struct CacheKey {
>     pub tenant_id: u64,
>     pub path: String,
> }
>
> impl CacheKey {
>     pub fn new(tenant_id: u64, path: impl Into<String>) -> Self {
>         Self {
>             tenant_id,
>             path: path.into().to_lowercase(),
>         }
>     }
> }
>
> // 1. Reflexive and Symmetric Equality for identical types
> impl PartialEq for CacheKey {
>     fn eq(&self, other: &Self) -> bool {
>         self.tenant_id == other.tenant_id && self.path == other.path
>     }
> }
>
> // 2. Mark CacheKey as Eq (total equality guarantee: self == self is always true)
> impl Eq for CacheKey {}
>
> // 3. Cross-type equality with borrowed string slice &str for default tenant (tenant_id == 0)
> impl PartialEq<str> for CacheKey {
>     fn eq(&self, other: &str) -> bool {
>         self.tenant_id == 0 && self.path.eq_ignore_ascii_case(other)
>     }
> }
>
> impl PartialEq<&str> for CacheKey {
>     fn eq(&self, other: &&str) -> bool {
>         self == *other
>     }
> }
>
> impl PartialEq<String> for CacheKey {
>     fn eq(&self, other: &String) -> bool {
>         self == other.as_str()
>     }
> }
>
> #[cfg(test)]
> mod tests {
>     use super::*;
>
>     #[test]
>     fn test_same_type_equality() {
>         let key1 = CacheKey::new(101, "/api/v1/users");
>         let key2 = CacheKey::new(101, "/API/V1/USERS");
>         let key3 = CacheKey::new(102, "/api/v1/users");
>
>         assert_eq!(key1, key2);
>         assert_ne!(key1, key3);
>         assert!(key1.eq(&key2));
>     }
>
>     #[test]
>     fn test_cross_type_borrowed_slice_equality() {
>         let global_key = CacheKey::new(0, "/healthz");
>         let tenant_key = CacheKey::new(42, "/healthz");
>
>         assert_eq!(global_key, "/healthz");
>         assert_eq!(global_key, "/HEALTHZ");
>         assert_ne!(tenant_key, "/healthz");
>
>         let owned_str = String::from("/healthz");
>         assert_eq!(global_key, owned_str);
>     }
>
>     #[test]
>     fn test_eq_marker_properties() {
>         fn assert_total_equality<T: Eq>(_val: &T) {}
>         let key = CacheKey::new(1, "test");
>         assert_total_equality(&key);
>         assert!(matches!(key, CacheKey { tenant_id: 1, .. }));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
>
>
> 1. **Heterogeneous `PartialEq<Rhs>` Implementation**: Rust's `PartialEq` trait is generic over the right-hand-side type `Rhs` with a default of `Self` (`trait PartialEq<Rhs: ?Sized = Self>`). By implementing `PartialEq<str>`, `PartialEq<&str>`, and `PartialEq<String>`, we grant `CacheKey` the ability to participate in `==` comparisons directly against string types without converting string slices into owned heap allocations.
> 2. **Total Equality vs. Partial Equality (`Eq`)**: `Eq` has no trait methods; it acts as a marker trait notifying the Rust compiler that equality on `CacheKey` is an equivalence relation satisfying reflexivity (`a == a`), symmetry (`a == b` implies `b == a`), and transitivity (`a == b` and `b == c` implies `a == c`). This allows `CacheKey` to be safely used in hash maps (`HashMap`) and sets (`HashSet`).
> 3. **Memory and Monomorphization**: When calling `cache_key == "path"`, the compiler monomorphizes the specific `PartialEq::<&str>::eq` routine directly into an inline slice comparison. No string cloning or dynamic vtable dispatch occurs.

---

### Exercise 2: Invariant-Guaranteed Total Equality (`Eq`) for Financial Ledger Amounts

**Problem:**
In financial ledger microservices, amounts represented as floating-point numbers (`f64`) pose severe risks. IEEE-754 floats permit `NaN` (Not-a-Number), which violates reflexivity (`NaN == NaN` is false). Because of this edge case, Rust deliberately omits `Eq` for primitive floating-point types (`f32` and `f64`). Standard library collection types like `std::collections::BTreeMap` or `HashSet` require `Eq` to operate safely without missing keys or violating tree invariants.

Create a financial domain type `LedgerAmount` that wraps an `f64`, ensuring invariants at construction time to safely implement total equality (`Eq`).
1. Define `LedgerError::InvalidAmount` to handle non-finite floats (`NaN`, `Infinity`, `-Infinity`).
2. Implement `LedgerAmount::new(amount: f64) -> Result<Self, LedgerError>` which enforces finiteness.
3. Implement `PartialEq` and `Eq` manually for `LedgerAmount`.
4. Provide an `is_approx_eq(&self, other: &Self, epsilon: f64) -> bool` method for fuzzy rounding comparisons in audit trails.
5. Write unit tests with `assert!`, `assert_eq!`, `assert_ne!`, and `matches!` checking both exact equality and invariant failure cases.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::fmt;
>
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub enum LedgerError {
>     InvalidAmount(String),
> }
>
> impl fmt::Display for LedgerError {
>     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
>         match self {
>             LedgerError::InvalidAmount(msg) => write!(f, "Invalid ledger amount: {}", msg),
>         }
>     }
> }
>
> impl std::error::Error for LedgerError {}
>
> #[derive(Debug, Clone, Copy)]
> pub struct LedgerAmount {
>     val: f64,
> }
>
> impl LedgerAmount {
>     pub fn new(val: f64) -> Result<Self, LedgerError> {
>         if val.is_nan() {
>             Err(LedgerError::InvalidAmount("Value cannot be NaN".into()))
>         } else if val.is_infinite() {
>             Err(LedgerError::InvalidAmount("Value cannot be infinite".into()))
>         } else {
>             Ok(Self { val })
>         }
>     }
>
>     pub fn value(&self) -> f64 {
>         self.val
>     }
>
>     pub fn is_approx_eq(&self, other: &Self, epsilon: f64) -> bool {
>         (self.val - other.val).abs() <= epsilon
>     }
> }
>
> // Implement PartialEq manually based on validated finite floating-point values
> impl PartialEq for LedgerAmount {
>     fn eq(&self, other: &Self) -> bool {
>         self.val == other.val
>     }
> }
>
> // Marker trait guaranteeing total equality. Valid because constructor guarantees no NaN state exists.
> impl Eq for LedgerAmount {}
>
> #[cfg(test)]
> mod tests {
>     use super::*;
>
>     #[test]
>     fn test_valid_ledger_amount_creation_and_equality() {
>         let a1 = LedgerAmount::new(100.50).unwrap();
>         let a2 = LedgerAmount::new(100.50).unwrap();
>         let a3 = LedgerAmount::new(200.75).unwrap();
>
>         assert_eq!(a1, a2);
>         assert_ne!(a1, a3);
>         assert!(a1 == a2);
>     }
>
>     #[test]
>     fn test_nan_rejection() {
>         let nan_result = LedgerAmount::new(f64::NAN);
>         let inf_result = LedgerAmount::new(f64::INFINITY);
>
>         assert!(nan_result.is_err());
>         assert!(inf_result.is_err());
>
>         assert!(matches!(
>             nan_result,
>             Err(LedgerError::InvalidAmount(msg)) if msg.contains("NaN")
>         ));
>     }
>
>     #[test]
>     fn test_approximate_equality() {
>         let a1 = LedgerAmount::new(10.0000001).unwrap();
>         let a2 = LedgerAmount::new(10.0000002).unwrap();
>
>         assert_ne!(a1, a2);
>         assert!(a1.is_approx_eq(&a2, 1e-6));
>         assert!(!a1.is_approx_eq(&a2, 1e-9));
>     }
>
>     #[test]
>     fn test_total_order_marker_enforcement() {
>         fn require_eq<T: Eq>(_val: T) {}
>         let amount = LedgerAmount::new(50.0).unwrap();
>         require_eq(amount);
>     }
> }
> ```
>
> #### Technical Explanation
>
>
>
>
> 1. **Why `f64` Lacks `Eq`**: IEEE-754 floating-point standard mandates that `NaN == NaN` evaluates to `false`. This violates the reflexivity property (`x == x`) required by mathematical equivalence relations. Consequently, standard Rust `f64` only implements `PartialEq`, preventing floats from being direct keys in `HashSet` or `HashMap`.
> 2. **Invariant Encapsulation**: By encapsulating `val: f64` as a private field in `LedgerAmount` and restricting construction to `LedgerAmount::new`, we guarantee at compile-time and runtime that no `LedgerAmount` instance can ever hold `NaN` or `Infinity`.
> 3. **Safety of Marker `Eq`**: Because the non-`NaN` invariant is preserved continuously (the struct is immutable and constructor validated), `self.val == self.val` is unconditionally true for all valid instances. Therefore, manually implementing `Eq` is sound and safe.

---

### Exercise 3: Dynamic Trait Object Downcasting & Equality (`Box<dyn FilterNode>`)

**Problem:**
In rule engines, database query planners, and compiler ASTs, nodes are often stored as dynamic trait objects (such as `Box<dyn FilterNode>`). By default, Rust trait objects cannot be compared using `==` because trait objects erase the underlying concrete type size and layout in their virtual method table (vtable). Attempting to derive `PartialEq` for a trait object directly triggers compiler error `E0038` (object safety violation) if `Self: Sized` is required by `PartialEq::eq`.

To enable dynamic equality checking across trait objects:
1. Define a trait `FilterNode` extending `std::any::Any` and `std::fmt::Debug`.
2. Include helper methods `as_any(&self) -> &dyn std::any::Any` and `dyn_eq(&self, other: &dyn FilterNode) -> bool`.
3. Create two concrete types: `LiteralFilter` (holding a target `String`) and `RangeFilter` (holding `min: i64, max: i64`).
4. Implement `PartialEq` for `Box<dyn FilterNode>` and `dyn FilterNode` to allow comparing rule trees dynamically.
5. Write unit tests with `assert!`, `assert_eq!`, `assert_ne!`, and `matches!` checking both identical node structures and cross-node mismatches.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::any::Any;
> use std::fmt::Debug;
>
> pub trait FilterNode: Debug + Any {
>     fn as_any(&self) -> &dyn Any;
>     fn dyn_eq(&self, other: &dyn FilterNode) -> bool;
> }
>
> impl<T: FilterNode + PartialEq + 'static> FilterNode for T {
>     fn as_any(&self) -> &dyn Any {
>         self
>     }
>
>     fn dyn_eq(&self, other: &dyn FilterNode) -> bool {
>         if let Some(other_concrete) = other.as_any().downcast_ref::<T>() {
>             self == other_concrete
>         } else {
>             false
>         }
>     }
> }
>
> #[derive(Debug, PartialEq, Eq)]
> pub struct LiteralFilter {
>     pub value: String,
> }
>
> #[derive(Debug, PartialEq, Eq)]
> pub struct RangeFilter {
>     pub min: i64,
>     pub max: i64,
> }
>
> impl PartialEq for dyn FilterNode {
>     fn eq(&self, other: &Self) -> bool {
>         self.dyn_eq(other)
>     }
> }
>
> impl Eq for dyn FilterNode {}
>
> impl PartialEq for Box<dyn FilterNode> {
>     fn eq(&self, other: &Self) -> bool {
>         self.as_ref().eq(other.as_ref())
>     }
> }
>
> impl Eq for Box<dyn FilterNode> {}
>
> #[cfg(test)]
> mod tests {
>     use super::*;
>
>     #[test]
>     fn test_same_type_trait_object_equality() {
>         let node1: Box<dyn FilterNode> = Box::new(LiteralFilter { value: "active".into() });
>         let node2: Box<dyn FilterNode> = Box::new(LiteralFilter { value: "active".into() });
>         let node3: Box<dyn FilterNode> = Box::new(LiteralFilter { value: "pending".into() });
>
>         assert_eq!(node1, node2);
>         assert_ne!(node1, node3);
>         assert!(node1.eq(&node2));
>     }
>
>     #[test]
>     fn test_different_type_trait_object_inequality() {
>         let literal_node: Box<dyn FilterNode> = Box::new(LiteralFilter { value: "100".into() });
>         let range_node: Box<dyn FilterNode> = Box::new(RangeFilter { min: 0, max: 100 });
>
>         assert_ne!(literal_node, range_node);
>         assert!(!literal_node.eq(&range_node));
>     }
>
>     #[test]
>     fn test_downcast_ref_and_matches() {
>         let node: Box<dyn FilterNode> = Box::new(RangeFilter { min: 10, max: 50 });
>         
>         let range_ref = node.as_any().downcast_ref::<RangeFilter>();
>         assert!(range_ref.is_some());
>         assert_eq!(range_ref.unwrap().min, 10);
>
>         let literal_ref = node.as_any().downcast_ref::<LiteralFilter>();
>         assert!(literal_ref.is_none());
>
>         assert!(matches!(
>             node.as_any().downcast_ref::<RangeFilter>(),
>             Some(RangeFilter { min: 10, max: 50 })
>         ));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
>
>
> 1. **Vtable Erasure & Object Safety**: The standard `PartialEq` trait definition `fn eq(&self, other: &Self) -> bool` requires `other` to have the exact same concrete type `Self` as `self`. For a trait object `dyn FilterNode`, `Self` is unsized (`?Sized`), which violates `PartialEq`'s default `Self: Sized` requirement and causes object safety failure error `E0038`.
> 2. **Double Dispatch via Any Downcasting**: To restore dynamic equality for trait objects, we combine `std::any::Any` downcasting with a double-dispatch helper method `dyn_eq`.
>    - The generic blanket implementation `impl<T: FilterNode + PartialEq + 'static> FilterNode for T` implements `dyn_eq` for any concrete type `T`.
>    - Inside `dyn_eq`, `other.as_any().downcast_ref::<T>()` checks the runtime type ID in the vtable. If `other` matches concrete type `T`, it downcasts `other` to `&T` and delegates comparison to `T`'s underlying `PartialEq` implementation (`self == other_concrete`).
>    - If `other` is a different type (e.g. comparing a `LiteralFilter` to a `RangeFilter`), `dyn_eq` returns `false`.
> 3. **Forwarding Deref Impls**: Implementing `PartialEq` for `Box<dyn FilterNode>` forwards equality to `dyn FilterNode` dereferenced trait object comparison (`self.as_ref().eq(other.as_ref())`), providing seamless `==` syntax across boxed AST nodes.

---

## 6. Related Terms

- [`PartialOrd` / `Ord`](../level_04/partialord_ord.md) — The sister traits used for Greater Than (`>`) and Less Than (`<`) operators.
- [Derive Macro](../level_04/derive_macro.md) — How you get `PartialEq` and `Eq` for free 99% of the time.

---

## 7. Key Takeaways

- `PartialEq` is the trait that powers the `==` and `!=` operators.
- `Eq` is just a blank marker trait that you add *on top* of `PartialEq` to promise the compiler that your type has no weird `NaN` behavior (i.e., `x == x` is always mathematically true).
- You can derive them automatically using `#[derive(PartialEq, Eq)]` to compare every field inside the struct.
- You implement `PartialEq` manually when "equality" requires custom business logic (like only comparing a database ID).
