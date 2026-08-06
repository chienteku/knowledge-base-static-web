# Visibility and Modules (`pub`, `mod`)

> **Level 7 — Rust**
> Rust's module system (`mod`) for organising code into namespaces, combined with visibility modifiers (`pub`, `pub(crate)`, `pub(super)`) to control item accessibility across boundaries.

---

## 1. Prerequisites

- [`mod` Declaration](mod_declaration.md) — Module creation and hierarchy.
- [`pub` Visibility](pub_visibility.md) — Public and private item visibility.

---

## 2. Term Category

**Language Architecture (encapsulation & module tree framework)**: The module hierarchy tree created by `mod` combined with visibility modifiers (`pub`, `pub(crate)`, `pub(super)`) provides Rust's core encapsulation system, controlling item reachability across file and crate boundaries.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Large software projects require clean boundaries to prevent private internal implementation details from leaking into public APIs.

Rust structures code into a module tree using `mod`. By default, all items (structs, functions, fields, enums) are strictly private to their defining module scope. Fine-grained visibility modifiers control access:
- **`pub`**: Completely public across all crates.
- **`pub(crate)`**: Visible to any module within the current crate, but hidden from external consumers.
- **`pub(super)`**: Visible only to the immediate parent module.
- **Unannotated (Private)**: Visible only to the current module and its submodules.

### (2) Reality Metaphor

A corporate headquarters building: the public lobby (`pub`) is open to visitors; employee breakrooms (`pub(crate)`) are accessible to all company staff; executive conference rooms (`pub(super)`) are restricted to parent department managers.

### (3) Rust Code Examples

#### Fine-Grained Module Tree Visibility
```rust
pub mod database {
    pub struct Connection {
        pub host: String,
        port: u16, // Private field: cannot be accessed outside `database` module!
    }

    impl Connection {
        pub fn new(host: &str) -> Self {
            Self { host: host.into(), port: 5432 }
        }

        pub(crate) fn internal_port(&self) -> u16 {
            self.port
        }
    }
}

fn main() {
    let conn = database::Connection::new("localhost");
    assert_eq!(conn.host, "localhost");
    assert_eq!(conn.internal_port(), 5432); // Allowed: same crate!
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Expecting Struct Fields to Be Public Automatically when Struct is `pub`

**The mistake:** Marking a struct `pub struct User` and assuming its fields are publicly accessible outside the module.

**Why it is wrong:** Struct fields in Rust remain private even if the enclosing struct is `pub`. Each field must be explicitly annotated with `pub`.

*Incorrect:*
```rust
pub struct User { name: String } // ❌ User::name is private!
```

*Fix:*
```rust
pub struct User { pub name: String } // Correct!
```

### Mistake 2: Confusing `mod` Declarations with Header File Includes

**The mistake:** Declaring `mod foo;` multiple times across different files in a project.

**Why it is wrong:** `mod foo;` builds a node in the module tree; declaring it twice creates duplicate module definitions (`error: duplicate definition of module 'foo'`).

### Mistake 3: Exposing Private Types in Public Function Signatures

**The mistake:** Creating a `pub fn` that takes or returns a private struct.

**Why it is wrong:** Triggers compiler error `private type in public interface` (`E0446`).

---

## 5. Practice Exercises

### Exercise 1: Encapsulated Payment Gateway Module Tree

**Scenario:** Build an encapsulated payment processing module tree with `pub(crate)` internal transaction verification and private validation functions.

**Requirements:**
1. Create `payments` module containing private `internal_validate`.
2. Expose `pub fn process_payment`.
3. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub mod payments {
>     pub struct Transaction {
>         pub amount: u64,
>         pub(crate) is_verified: bool,
>     }
> 
>     impl Transaction {
>         pub fn new(amount: u64) -> Self {
>             Self { amount, is_verified: false }
>         }
>     }
> 
>     pub fn process_payment(mut tx: Transaction) -> bool {
>         if internal_validate(&tx) {
>             tx.is_verified = true;
>             true
>         } else {
>             false
>         }
>     }
> 
>     fn internal_validate(tx: &Transaction) -> bool {
>         tx.amount > 0
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::payments::*;
> 
>     #[test]
>     fn test_module_encapsulation() {
>         let tx = Transaction::new(100);
>         assert!(process_payment(tx));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Encapsulates `internal_validate` function privately within `payments` module.
> 2. `pub(crate)` allows internal field verification across crate modules while hiding details from external API callers.
> 
---

### Exercise 2: Parent Module Visibility Restriction (`pub(super)`)

**Scenario:** Implement a nested submodule using `pub(super)` to restrict helper access strictly to the immediate parent module.

**Requirements:**
1. Create `parent::child` module path.
2. Use `pub(super)`.
3. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub mod parent {
>     pub fn outer_call() -> bool {
>         child::inner_helper()
>     }
> 
>     mod child {
>         pub(super) fn inner_helper() -> bool {
>             true
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_pub_super() {
>         assert!(parent::outer_call());
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `pub(super)` restricts `inner_helper` access strictly to `parent` module scope.
> 
---

### Exercise 3: Crate-Wide Logger Visibility (`pub(crate)`)

**Scenario:** Demonstrate `pub(crate)` sharing helper functions across crate modules while keeping them hidden from external library callers.

**Requirements:**
1. Define `pub(crate) fn internal_logger()`.
2. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub(crate) fn internal_crate_logger(msg: &str) -> String {
>     format!("[CRATE INTERNAL] {msg}")
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_crate_visibility() {
>         let log = internal_crate_logger("test");
>         assert!(log.contains("CRATE INTERNAL"));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `pub(crate)` exposes helpers internally within the crate without polluting public API docs or breaking semver compatibility.
> 
---

## 5. Related Terms

- [Sealed Trait Pattern](../level_14/sealed_trait_pattern.md)
- [Module](../level_01/module.md) — Related concept: Module.

---

## 7. Key Takeaways

- Rust modules form a hierarchy tree rooted at `lib.rs` or `main.rs`.
- Items and struct fields are strictly private by default.
- `pub` exposes items publicly; `pub(crate)` restricts to current crate; `pub(super)` restricts to parent.
- Declare `mod foo;` once in crate root; import elsewhere via `use`.
