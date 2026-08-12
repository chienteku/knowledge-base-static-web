# Derive Macro

> **Level 4 — Error Handling & Generics**
> `#[derive(Debug, Clone)]` automatically generates common trait implementations for structs/enums.

---

## 1. Prerequisites


- [Macros](../level_01/macros.md) — The meta-programming tools that write code for you.
- [Struct](../level_02/struct.md) — 
- [Trait](trait.md) — The contracts being implemented.

---

## 2. Term Category

**Rust-specific (the boilerplate killer)**: In many languages, if you want to print a custom object or compare two custom objects for equality, you have to manually write the `toString()` or `equals()` methods by hand. In Rust, the compiler can automatically write these standard, mechanical methods for you using the Derive Macro.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Some traits in Rust are incredibly common and their implementations are entirely predictable. 

For example, if you want your custom struct to implement the `Debug` trait (so it can be printed to the terminal), the code is always exactly the same: *print the struct's name, then print each of its fields*. 

If you want your custom struct to implement the `Clone` trait, the code is always exactly the same: *make a new struct and copy every field one by one*.

Making developers manually type out these `impl` blocks for every single struct they create is a massive waste of time. To solve this, Rust provides the **`#[derive(...)]`** attribute. You place it above your struct, and it tells the compiler: *"Please generate the standard boilerplate code for these traits automatically."*

### (2) Reality Metaphor

Imagine you build a custom robot (your Struct) out of Lego blocks. 

Now, you need an instruction manual on how to duplicate the robot (the `Clone` trait). Instead of sitting down and writing the manual by hand, you slap a `#[derive]` sticker on the robot and send it to an automated factory. 

The factory scans the robot, identifies all the Lego blocks, and automatically prints a perfect instruction manual for you. You get the manual for free without doing any work.

### (3) Rust Code Examples

#### Short Snippet (The Magic Fix)
If you try to print a struct without the `Debug` trait, Rust will reject it. The fix takes exactly one line.

```rust
// 1. We place the derive macro directly above the struct definition.
#[derive(Debug)]
struct Player {
    name: String,
    score: i32,
}

fn main() {
    let p1 = Player {
        name: String::from("Alice"),
        score: 100,
    };
    
    // Because we derived Debug, we can now print the player using `{:?}`
    println!("Player data: {:?}", p1);
}
```

#### Fuller Example (Multiple Traits)
You can derive multiple traits at once by separating them with commas.

```rust
// We want to be able to Print (Debug), Copy (Clone), and Compare (PartialEq) our struct!
#[derive(Debug, Clone, PartialEq)]
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let point_a = Point { x: 5, y: 10 };
    
    // 1. Using Clone
    let point_b = point_a.clone(); 
    
    // 2. Using PartialEq (==)
    if point_a == point_b {
        println!("The points are identical!");
    }
    
    // 3. Using Debug
    println!("Point B: {:?}", point_b);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Derive Macro Scoping and Lifecycle Rules

**The mistake:** Assuming Derive Macro instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("derive_macro_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("derive_macro_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Derive Macro State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Derive Macro through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Derive Macro Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Derive Macro instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Generic Struct Trait Bounds & Custom Overrides for Smart Pointers

**Scenario:** 
In high-throughput async telemetry systems, data batches are wrapped inside `TelemetryBatch<T>` containing a batch ID and a reference-counted payload `Arc<T>`. When using Rust's standard `#[derive(Clone, Debug, PartialEq)]` macro on generic structs:

```rust
#[derive(Clone, Debug, PartialEq)]
pub struct TelemetryBatch<T> {
    pub batch_id: u64,
    pub payload: Arc<T>,
}
```

The compiler derive macro generator automatically places generic bounds on all inner types: `impl<T: Clone> Clone for TelemetryBatch<T>`. However, `Arc<T>` can be safely cloned regardless of whether `T` implements `Clone`! Consequently, when `T` is an unclonable resource handle (such as a database stream or socket file descriptor `UnclonableResource`), standard `#[derive(Clone)]` prevents `TelemetryBatch<T>` from being cloned.

Implement an `UnclonableResource` struct (which intentionally does NOT implement `Clone`) and a generic `TelemetryBatch<T>` struct. Provide manual implementations of `Clone`, `Debug`, and `PartialEq` for `TelemetryBatch<T>` that avoid unnecessary `T: Clone` bounds, allowing `TelemetryBatch<UnclonableResource>` to be cloned by bumping `Arc`'s reference count. Include comprehensive unit tests with `assert!`, `assert_eq!`, `assert_ne!`, and `matches!`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::sync::Arc;
> use std::fmt;
> 
> /// A resource handle representing an OS socket or database pool that is intentionally `!Clone`.
> #[derive(Debug)]
> pub struct UnclonableResource {
>     pub resource_id: String,
> }
> 
> impl UnclonableResource {
>     pub fn new(id: &str) -> Self {
>         Self {
>             resource_id: id.to_string(),
>         }
>     }
> }
> 
> /// A generic telemetry payload wrapped in an `Arc`.
> pub struct TelemetryBatch<T> {
>     pub batch_id: u64,
>     pub payload: Arc<T>,
> }
> 
> impl<T> TelemetryBatch<T> {
>     pub fn new(batch_id: u64, payload: T) -> Self {
>         Self {
>             batch_id,
>             payload: Arc::new(payload),
>         }
>     }
> }
> 
> // Manual Clone implementation: Arc<T> can be cloned even if T does NOT implement Clone!
> impl<T> Clone for TelemetryBatch<T> {
>     fn clone(&self) -> Self {
>         Self {
>             batch_id: self.batch_id,
>             payload: Arc::clone(&self.payload),
>         }
>     }
> }
> 
> // Manual Debug implementation: requires T: Debug to format inner payload
> impl<T: fmt::Debug> fmt::Debug for TelemetryBatch<T> {
>     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
>         f.debug_struct("TelemetryBatch")
>             .field("batch_id", &self.batch_id)
>             .field("payload", &self.payload)
>             .finish()
>     }
> }
> 
> // Manual PartialEq implementation: checks batch ID and pointer equality or inner equality
> impl<T: PartialEq> PartialEq for TelemetryBatch<T> {
>     fn eq(&self, other: &Self) -> bool {
>         self.batch_id == other.batch_id 
>             && (Arc::ptr_eq(&self.payload, &other.payload) || *self.payload == *other.payload)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_telemetry_batch_clone_without_t_clone() {
>         let res = UnclonableResource::new("res-9901");
>         let batch = TelemetryBatch::new(101, res);
> 
>         assert_eq!(Arc::strong_count(&batch.payload), 1);
> 
>         // Cloning batch succeeds even though UnclonableResource is !Clone
>         let batch_cloned = batch.clone();
> 
>         assert_eq!(batch.batch_id, batch_cloned.batch_id);
>         assert_eq!(Arc::strong_count(&batch.payload), 2);
>         assert!(Arc::ptr_eq(&batch.payload, &batch_cloned.payload));
>     }
> 
>     #[test]
>     fn test_telemetry_batch_debug_and_partial_eq() {
>         let res1 = UnclonableResource::new("sensor-a");
>         let batch1 = TelemetryBatch::new(202, res1);
> 
>         let debug_str = format!("{:?}", batch1);
>         assert!(debug_str.contains("TelemetryBatch"));
>         assert!(debug_str.contains("batch_id: 202"));
>         assert!(debug_str.contains("sensor-a"));
> 
>         let batch2 = batch1.clone();
>         assert_eq!(batch1, batch2);
> 
>         let batch3 = TelemetryBatch::new(203, UnclonableResource::new("sensor-a"));
>         assert_ne!(batch1, batch3);
>     }
> }
> ```
>
> #### Technical Explanation
>
>
>
>
> 1. **Implicit Generic Bounds in Derive Macros**:
>    When deriving standard traits like `#[derive(Clone)]` on a generic struct `MyStruct<T>`, the built-in Rust macro expansion algorithm conservatively generates `impl<T: Clone> Clone for MyStruct<T>`. It applies the `Clone` bound to every generic parameter `T`, regardless of whether `T` is held directly by value or wrapped inside a smart pointer like `Arc<T>` or `PhantomData<T>`.
>
> 2. **Overcoming Derive Restrictions via Manual Trait Impl**:
>    Smart pointers such as `Arc<T>` and `Rc<T>` implement `Clone` by incrementing their atomic or non-atomic reference count pointer. They do NOT clone the inner data `T` itself. Therefore, `Arc<T>: Clone` is satisfied for *any* type `T`, even if `T` is `!Clone`. By writing a manual `impl<T> Clone for TelemetryBatch<T>`, we avoid adding `where T: Clone`, allowing non-clonable types (like raw network descriptors or DB connection handles) to participate in batch cloning.
>
> 3. **Ownership and Atomic Lifetime Implications**:
>    Calling `Arc::clone(&self.payload)` performs an atomic fetch-and-add on the strong reference counter (`ArcInner.strong`). No heap allocation or deep copy of `T` occurs. When either `batch` or `batch_cloned` drops, the strong count decrements, and `T` is only deallocated when the count reaches zero.
>
> 4. **Monomorphization Details**:
>    During monomorphization, `TelemetryBatch<UnclonableResource>` is compiled as a concrete type layout containing `u64` (8 bytes) and `Arc<UnclonableResource>` (8 bytes pointer). Static dispatch calls the manual `Clone::clone` implementation directly without virtual lookup tables (vtables).
> 
---

### Exercise 2: Multi-Field Derive Precedence & Priority Inversion for Event Queues

**Scenario:**
In distributed query engine indexing, `AuditEvent` records must be prioritized based on:
1. Event severity rank (`Critical` > `Error` > `Warning` > `Info`).
2. Timestamp ascending (older events processed before newer ones).
3. Sequence ID ascending (tie-breaker).

Using standard `#[derive(PartialEq, Eq, PartialOrd, Ord)]` orders struct fields lexicographically in the exact order of field declaration. Furthermore, for enums derived with `Ord`, variants are ordered according to their numerical discriminant (the first declared variant is the smallest).

If `Severity` is declared as `Info = 0, Warning = 1, Error = 2, Critical = 3`, derived `Ord` treats `Info` as smaller than `Critical`. If events are sorted ascendingly with `.sort()`, `Info` events would appear first unless severity order is inverted!

Construct an `AuditEvent` system where `Severity` uses standard derives, and `AuditEvent` derives `Debug, Clone, PartialEq, Eq`, but implements custom `Ord` and `PartialOrd` to achieve proper priority-queue sorting: higher severity events come first, followed by earlier timestamps and sequence IDs. Validate sorting, equality invariants, and match comparisons using unit tests with `assert!`, `assert_eq!`, `assert_ne!`, and `matches!`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::cmp::Ordering;
> 
> #[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
> pub enum Severity {
>     Info = 0,
>     Warning = 1,
>     Error = 2,
>     Critical = 3,
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct AuditEvent {
>     pub severity: Severity,
>     pub timestamp_ms: u64,
>     pub sequence_id: u64,
> }
> 
> impl AuditEvent {
>     pub fn new(severity: Severity, timestamp_ms: u64, sequence_id: u64) -> Self {
>         Self {
>             severity,
>             timestamp_ms,
>             sequence_id,
>         }
>     }
> }
> 
> impl Ord for AuditEvent {
>     fn cmp(&self, other: &Self) -> Ordering {
>         // Priority Inversion: compare other.severity to self.severity to sort Critical (3) before Info (0)
>         other.severity.cmp(&self.severity)
>             .then_with(|| self.timestamp_ms.cmp(&other.timestamp_ms))
>             .then_with(|| self.sequence_id.cmp(&other.sequence_id))
>     }
> }
> 
> impl PartialOrd for AuditEvent {
>     fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
>         Some(self.cmp(other))
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_audit_event_priority_sorting() {
>         let e1 = AuditEvent::new(Severity::Info, 1000, 1);
>         let e2 = AuditEvent::new(Severity::Critical, 2000, 2);
>         let e3 = AuditEvent::new(Severity::Critical, 1000, 3);
>         let e4 = AuditEvent::new(Severity::Error, 500, 4);
> 
>         let mut events = vec![e1.clone(), e2.clone(), e3.clone(), e4.clone()];
>         events.sort();
> 
>         // High severity critical first; among critical, lower timestamp (1000) first
>         assert_eq!(events[0], e3); // Critical, 1000ms
>         assert_eq!(events[1], e2); // Critical, 2000ms
>         assert_eq!(events[2], e4); // Error, 500ms
>         assert_eq!(events[3], e1); // Info, 1000ms
>     }
> 
>     #[test]
>     fn test_ord_partial_eq_equivalence_invariant() {
>         let e1 = AuditEvent::new(Severity::Warning, 1500, 10);
>         let e2 = AuditEvent::new(Severity::Warning, 1500, 10);
>         let e3 = AuditEvent::new(Severity::Warning, 1500, 11);
> 
>         assert_eq!(e1, e2);
>         assert_eq!(e1.cmp(&e2), Ordering::Equal);
>         assert_ne!(e1, e3);
>         assert_eq!(e1.cmp(&e3), Ordering::Less);
>         assert!(matches!(e1.partial_cmp(&e3), Some(Ordering::Less)));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
>
>
> 1. **Enum Discriminants and Standard `#[derive(Ord)]`**:
>    When `Ord` is derived on an enum like `Severity`, Rust compares variant integer discriminants (0, 1, 2, 3). Standard derived `Ord` evaluates `Info (0) < Critical (3)`. In an ascending priority queue or `.sort()`, `Info` would be ordered *before* `Critical`.
>
> 2. **Lexicographical Field Comparison Expansion**:
>    Deriving `Ord` on a struct expands to field-by-field comparisons in declaration order. To invert order for one field (e.g. severity) while retaining ascending order for others (e.g. timestamp, sequence_id), a manual `Ord` implementation uses `Ordering::then_with`.
>
> 3. **Total Order & Equivalence Invariants**:
>    Rust mandates that `Eq` and `Ord` satisfy the total ordering invariant: `a == b` if and only if `a.cmp(b) == Ordering::Equal`. `PartialOrd` must always return `Some(self.cmp(other))` when `Ord` is implemented. Breaking this invariant leads to unpredictable bugs in standard library collections like `BTreeMap` and `BinaryHeap`.
>
> 4. **Monomorphization & Inlining**:
>    `cmp` and `then_with` calls compile into branchless CPU instructions (such as `CMP` and `CMOV` on x86_64) due to monomorphization and compiler optimization, resulting in zero abstraction overhead compared to handwritten C comparisons.
> 
---

### Exercise 3: Simulated Procedural Derive Macro Mechanics & Structural Schema Generator

**Scenario:**
Procedural derive macros (such as `#[derive(Serialize)]` in `serde` or custom derive macros in framework libraries) parse Rust AST syntax trees at compile time using `syn` and generate `impl` blocks via `quote`. 

Simulate the architectural output of a procedural derive macro for hierarchical system configuration structs (`DatabaseConfig` and `AppConfig`). Implement standard derived traits (`Debug, Clone, PartialEq, Default`) alongside a custom `ConfigSchema` trait with field flattening, key prefixing, `Option<T>` field formatting, and recursive nested struct serialization. Write unit tests with `assert!`, `assert_eq!`, `assert_ne!`, and `matches!` to verify metadata generation and derived trait behavior.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::fmt::Debug;
> 
> /// Trait simulated by standard/procedural derive macros for configuration metadata export.
> pub trait ConfigSchema {
>     fn schema_name() -> &'static str;
>     fn export_kvs(&self, prefix: &str) -> Vec<(String, String)>;
> }
> 
> #[derive(Debug, Clone, PartialEq, Default)]
> pub struct DatabaseConfig {
>     pub host: String,
>     pub port: u16,
>     pub pool_size: Option<u32>,
> }
> 
> impl ConfigSchema for DatabaseConfig {
>     fn schema_name() -> &'static str {
>         "DatabaseConfig"
>     }
> 
>     fn export_kvs(&self, prefix: &str) -> Vec<(String, String)> {
>         let base = if prefix.is_empty() {
>             String::new()
>         } else {
>             format!("{}.", prefix)
>         };
> 
>         let mut kvs = vec![
>             (format!("{}host", base), self.host.clone()),
>             (format!("{}port", base), self.port.to_string()),
>         ];
> 
>         if let Some(ref pool) = self.pool_size {
>             kvs.push((format!("{}pool_size", base), pool.to_string()));
>         } else {
>             kvs.push((format!("{}pool_size", base), "<disabled>".to_string()));
>         }
> 
>         kvs
>     }
> }
> 
> #[derive(Debug, Clone, PartialEq, Default)]
> pub struct AppConfig {
>     pub app_name: String,
>     pub db: DatabaseConfig,
>     pub debug_mode: bool,
> }
> 
> impl ConfigSchema for AppConfig {
>     fn schema_name() -> &'static str {
>         "AppConfig"
>     }
> 
>     fn export_kvs(&self, prefix: &str) -> Vec<(String, String)> {
>         let base = if prefix.is_empty() {
>             String::new()
>         } else {
>             format!("{}.", prefix)
>         };
> 
>         let mut kvs = vec![
>             (format!("{}app_name", base), self.app_name.clone()),
>             (format!("{}debug_mode", base), self.debug_mode.to_string()),
>         ];
> 
>         // Recurse into nested struct field (as a proc macro derive expansion would emit)
>         let db_prefix = format!("{}db", base);
>         kvs.extend(self.db.export_kvs(&db_prefix));
>         kvs
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_database_config_schema_export() {
>         let db = DatabaseConfig {
>             host: "localhost".to_string(),
>             port: 5432,
>             pool_size: Some(10),
>         };
> 
>         assert_eq!(DatabaseConfig::schema_name(), "DatabaseConfig");
> 
>         let kvs = db.export_kvs("database");
>         assert_eq!(kvs.len(), 3);
>         assert_eq!(kvs[0], ("database.host".to_string(), "localhost".to_string()));
>         assert_eq!(kvs[1], ("database.port".to_string(), "5432".to_string()));
>         assert_eq!(kvs[2], ("database.pool_size".to_string(), "10".to_string()));
>     }
> 
>     #[test]
>     fn test_app_config_nested_schema_export() {
>         let app = AppConfig {
>             app_name: "AuthService".to_string(),
>             db: DatabaseConfig {
>                 host: "10.0.0.5".to_string(),
>                 port: 3306,
>                 pool_size: None,
>             },
>             debug_mode: true,
>         };
> 
>         assert_eq!(AppConfig::schema_name(), "AppConfig");
> 
>         let kvs = app.export_kvs("");
>         assert_eq!(kvs.len(), 5);
>         assert_eq!(kvs[0], ("app_name".to_string(), "AuthService".to_string()));
>         assert_eq!(kvs[1], ("debug_mode".to_string(), "true".to_string()));
>         assert_eq!(kvs[2], ("db.host".to_string(), "10.0.0.5".to_string()));
>         assert_eq!(kvs[3], ("db.port".to_string(), "3306".to_string()));
>         assert_eq!(kvs[4], ("db.pool_size".to_string(), "<disabled>".to_string()));
> 
>         // Verify standard derived traits: Clone and PartialEq
>         let app_cloned = app.clone();
>         assert_eq!(app, app_cloned);
>         assert!(matches!(app.debug_mode, true));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
>
>
> 1. **Procedural Derive Macro Architecture**:
>    A procedural derive macro (e.g. `#[proc_macro_derive(ConfigSchema)]`) receives a compiler `TokenStream`, parses it into an AST syntax tree (`syn::DeriveInput`), inspects fields (`syn::Data::Struct`), and emits a synthesized Rust code `TokenStream` using `quote!`.
>
> 2. **Recursive Trait Dispatch vs Derive AST Generation**:
>    When a derive macro encounters nested struct fields (such as `db: DatabaseConfig`), the generated code invokes `ConfigSchema::export_kvs` on the field. If `DatabaseConfig` also derives `ConfigSchema`, static dispatch monomorphizes the recursive calls with zero virtual table dynamic dispatch overhead.
>
> 3. **Macro Hygiene and Scope Isolation**:
>    Rust procedural derive macros run in a separate crate with `proc-macro = true`. Derived `impl` blocks generated by macros exist in module scope and must explicitly use fully qualified paths (`::std::vec::Vec`, `::std::string::String`) to avoid name collision errors ("macro hygiene").
>
> 4. **Derived `Default` Mechanics**:
>    The derived `Default` implementation calls `Default::default()` on each field (`String::default()` -> `""`, `u16::default()` -> `0`, `Option::default()` -> `None`). Derived macros ensure type-safe default construction without manual initialization.
> 
---

## 6. Related Terms


- [`Debug` Trait](debug_trait.md) — The most common trait you will ever derive (allows you to print objects to the console for debugging).
- [`Clone` Trait](../level_03/clone_trait.md) — Another incredibly common trait you will derive (allows you to duplicate data).
- [`Hash` Trait](../level_02/hash_trait.md) — Related concept: `Hash` Trait.
- [`Default` Trait](default_trait.md) — Related concept: `Default` Trait.
- [`PartialEq` / `Eq`](partialeq_eq.md) — Related concept: `PartialEq` / `Eq`.
- [`PartialOrd` / `Ord`](partialord_ord.md) — Related concept: `PartialOrd` / `Ord`.
- [Auto Traits](../level_09/auto_traits.md) — Related concept: Auto Traits.

---

## 7. Key Takeaways

- `#[derive(TraitName)]` automatically generates the boilerplate code to implement `TraitName` for your custom struct or enum.
- You can derive multiple traits at once by separating them with commas (e.g., `#[derive(Debug, Clone)]`).
- It only works for standard, predictable traits (and some special third-party ones like `Serialize` from the `serde` crate).
- It only succeeds if **every inner field** of your struct also implements the trait you are trying to derive.
