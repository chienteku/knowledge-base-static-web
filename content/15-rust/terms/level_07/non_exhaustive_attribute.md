# `#[non_exhaustive]`

> **Level 7 — Modules, Visibility & Project Structure**
> Marks a struct/enum so downstream crates cannot exhaustively match or construct it — preserving your freedom to add fields/variants later without a breaking change.

---

## 1. Prerequisites


- [Enum](../level_02/enum.md)
- [`match`](../level_02/match.md) — Whose exhaustiveness checking this attribute specifically restricts for external crates.
- [`pub` Visibility](pub_visibility.md) — The public-API concern this attribute is designed to protect.
- [Edition](edition.md) — The versioning context this attribute's SemVer guarantees operate within.

---

## 2. Term Category

**API-Evolution Attribute (the "more variants may come" promise)**: By default, a public enum with 3 variants is a firm promise: "there will always be exactly these 3 variants, forever, or it's a breaking change." `#[non_exhaustive]` softens that promise deliberately, explicitly telling downstream users "expect more variants/fields to appear in future versions — don't write code that assumes today's list is final."

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Rust's `match` exhaustiveness checking is a wonderful safety feature *within* a single crate — if you add a new enum variant, every `match` on it across your own codebase fails to compile until you handle the new case, guaranteeing you never forget one. But this becomes a liability across crate boundaries: if a library's public enum is matched exhaustively by downstream code, adding **any** new variant to that enum — even a genuinely new, unrelated feature — breaks every single downstream crate's build. This makes evolving public enums (and structs, for adding fields) effectively impossible without a major version bump, even for additions that shouldn't logically be "breaking." `#[non_exhaustive]` fixes this: it forces external crates to include a wildcard `_` arm in every `match`, and forbids them from directly constructing the type with struct-literal syntax (forcing a constructor function instead) — both restrictions exist specifically so the library author retains room to add new variants/fields later without it counting as a breaking change for anyone who respected the attribute's warning.

### (2) Reality Metaphor

Imagine a restaurant's printed menu that explicitly states, in bold letters at the top: "Additional seasonal items may be added at any time without notice."

- **A normal (exhaustive) menu**: If a customer's order form has a checkbox for every single item currently on the menu, and the restaurant later adds a new dish, every customer's old order form is suddenly "incomplete" — a real problem if the form was supposed to be a complete, final checklist.
- **`#[non_exhaustive]` (the seasonal-items warning)**: Customers are explicitly told upfront to always include a "something else, ask your server" catch-all option on their order form. When the restaurant adds a new seasonal dish later, every customer's form still technically works — the catch-all option gracefully absorbs it, exactly as everyone was warned it might need to.

### (3) Rust Code Examples

#### Short Snippet (Forcing a Wildcard Arm)
```rust
// Inside a LIBRARY crate:
#[non_exhaustive]
pub enum Event {
    Click,
    KeyPress(char),
}

// Inside a DOWNSTREAM crate using this library:
fn handle(event: Event) {
    match event {
        Event::Click => println!("clicked"),
        Event::KeyPress(c) => println!("key: {c}"),
        // The `_` arm below is MANDATORY here, specifically because Event is non_exhaustive!
        // Without it: "non-exhaustive patterns: `_` not covered" — even though today,
        // Click and KeyPress genuinely ARE the only two variants that exist.
        _ => println!("unknown future event"),
    }
}
```

#### Fuller Example (Forcing Construction Through a Function)
```rust
// Inside a LIBRARY crate:
#[non_exhaustive]
pub struct Config {
    pub timeout_ms: u32,
    pub retries: u8,
}

impl Config {
    pub fn new(timeout_ms: u32, retries: u8) -> Self {
        Config { timeout_ms, retries }
    }
}

// Inside a DOWNSTREAM crate:
fn main() {
    // let c = Config { timeout_ms: 100, retries: 3 }; // COMPILE ERROR: struct literal
    //   syntax forbidden for non_exhaustive structs from OUTSIDE their defining crate!
    let c = library::Config::new(100, 3); // Must go through the provided constructor.
    println!("{}", c.timeout_ms); // Reading existing PUBLIC fields is still fine.
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Attempting Struct Literal Instantiation on `#[non_exhaustive]` Structs Outside the Defining Crate

**The mistake:** Downstream code trying to create a struct instance via `Config { host: "127.0.0.1".into(), port: 8080 }` when `Config` is marked `#[non_exhaustive]`.

**Why it is wrong:** `#[non_exhaustive]` signals that future versions may add hidden fields. Struct literal instantiation requires explicitly setting every field, which would break if new fields were added. Downstream code must use constructor functions (e.g. `Config::new(...)`).

*Incorrect:*
```rust
let config = external_crate::Config { host: "127.0.0.1".into(), port: 8080 }; // ❌ Error E0639: cannot create non-exhaustive struct!
```

*Fix:*
```rust
let config = external_crate::Config::new("127.0.0.1", 8080); // Use public constructor!
```

### Mistake 2: Missing Wildcard `_` Fallback Arms in External Enum `match` Expressions

**The mistake:** Writing a `match` on an external `#[non_exhaustive]` enum listing only current variants.

**Why it is wrong:** The compiler requires a wildcard `_ => ...` pattern arm for external non-exhaustive enums to ensure downstream code compiles even when new enum variants are added in minor library updates.

### Mistake 3: Believing `#[non_exhaustive]` Restricts Pattern Matching Within the Defining Crate

**The mistake:** Assuming `#[non_exhaustive]` prevents exhaustive `match` statements inside the crate where the enum/struct is defined.

**Why it is wrong:** `#[non_exhaustive]` restrictions apply strictly across external crate boundaries. Code inside the defining crate retains full access for exhaustive matching and struct literal instantiation.

---

## 5. Practice Exercises

### Exercise 1: Predict the Breaking-Change Impact

**Scenario:** A library has `pub enum Status { Active, Inactive }` (no `#[non_exhaustive]`), used with exhaustive `match` statements by many downstream crates. The library wants to add a `Status::Pending` variant in its next release. Is this a breaking change? What if `#[non_exhaustive]` had been applied from the start?

> [!check]- Answer
> **Without `#[non_exhaustive]`**: Yes, this **is** a breaking change. Every downstream crate that exhaustively matched on `Status` (without a `_` arm, since none was needed before) will fail to compile the moment they upgrade, because their `match` is no longer exhaustive against the new three-variant enum.
>
> **With `#[non_exhaustive]` applied from the start**: No breaking change. Every downstream crate would have been *forced*, all along, to include a `_` wildcard arm (since the compiler wouldn't have let them omit it). Adding `Pending` simply means that wildcard arm now also (correctly) catches the new variant, with zero code changes required downstream.

---

### Exercise 2: Exhaustive Match Handling for Non-Exhaustive Enums

**Scenario:** Match an external `#[non_exhaustive] enum Status { Active, Inactive }` using `_ => ...` wildcard fallback.

**Expected output:**
> [!check]- Answer
> ```
> Matched active
> ```
>
> #### Implementation
>
> ```rust
> #[non_exhaustive]
> enum Status { Active, Inactive }
> fn main() {
>     let s = Status::Active;
>     match s {
>         Status::Active => println!("Matched active"),
>         _ => println!("Other"),
>     }
> }
> ```
>
> #### Technical Explanation
> `#[non_exhaustive]` enforces wildcard `_` fallback arms outside the defining crate.

---

### Exercise 3: `#[non_exhaustive]` Structs — Construction Outside the Crate

**Scenario:**
When `#[non_exhaustive]` is applied to a struct, downstream crates cannot construct it with a struct literal (`Config { host: "localhost".into() }`) because the compiler treats the struct as having hidden fields. The library must provide a constructor.

Write the following (as if it were `src/lib.rs` of a library crate called `my_server`):
1. A `#[non_exhaustive] pub struct Config` with two `pub` fields: `host: String` and `port: u16`.
2. An `impl Config` block with a `pub fn new(host: &str, port: u16) -> Self` constructor.
3. A `fn main()` (or test) that acts as *downstream code* and constructs `Config` using the constructor, then prints the host and port.
4. Show (as a comment) what error the downstream code would get if it tried struct-literal construction instead.

Then answer: **can the `my_server` library's own `src/lib.rs` use struct literal syntax to construct `Config`?**

**Expected output:**
> [!check]- Answer
> ```text
> Connecting to localhost:8080
> ```
>
> - **Hint 1:** `#[non_exhaustive]` on a struct blocks *external* crate struct literals. Code inside the defining crate (same `src/lib.rs`) still has full access and CAN use struct literal syntax — the restriction is only for downstream consumers.
> - **Hint 2:** The standard workaround for downstream construction is a constructor (`new`) or a builder pattern. A `Default` implementation is also common when sensible defaults exist.
> - **Hint 3:** Even if the struct currently has only two fields, `#[non_exhaustive]` signals "we may add more fields without a semver bump." The constructor absorbs new fields transparently — downstream code calling `Config::new("localhost", 8080)` doesn't break when a third field is added with a default.
>
>
> #### Implementation
>
> ```rust
> // src/lib.rs  (inside the my_server crate)
>
> /// Server configuration.
> ///
> /// This struct is non-exhaustive: new fields may be added in future
> /// minor versions without a breaking change.
> #[non_exhaustive]
> pub struct Config {
>     pub host: String,
>     pub port: u16,
> }
>
> impl Config {
>     /// Creates a new `Config`. Use this — do NOT use struct literal syntax.
>     pub fn new(host: &str, port: u16) -> Self {
>         // Inside the defining crate, struct literal syntax IS allowed even
>         // with #[non_exhaustive] — the restriction only applies externally.
>         Config {
>             host: host.to_string(),
>             port,
>         }
>     }
> }
>
> fn main() {
>     let cfg = Config::new("localhost", 8080);
>     println!("Connecting to {}:{}", cfg.host, cfg.port);
>
>     // What downstream code would see if it tried struct literal syntax:
>     // let bad = my_server::Config { host: "localhost".into(), port: 8080 };
>     // error[E0639]: cannot create non-exhaustive struct using struct expression
>     //   --> src/main.rs:3:15
>     //    |
>     //    |     let bad = my_server::Config { host: "localhost".into(), port: 8080 };
>     //    |               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
>     //    |               cannot create non-exhaustive struct using struct expression
> }
> ```
>
> **Answer to the "can the library use struct literals" question:**
> **Yes.** `#[non_exhaustive]` only restricts *external* crates. The defining crate has full knowledge of all fields (there are no hidden fields from its own perspective), so struct literal syntax compiles normally inside `src/lib.rs`. The attribute is purely a contract about what downstream consumers may assume about the struct's completeness.

---

## 6. Related Terms


- [Enum](../level_02/enum.md)
- [`match`](../level_02/match.md) — Whose exhaustiveness-checking behavior this attribute specifically alters for external crates.
- [Edition](edition.md) — The broader SemVer/compatibility context this attribute is one tool within.

---

## 7. Key Takeaways

- `#[non_exhaustive]` forces downstream crates to include a wildcard `_` arm in any `match` on the type, and to construct it only through a provided function, not a struct literal.
- It exists purely as a public-API evolution tool: it lets a library author add new variants/fields later without that addition counting as a semver-breaking change.
- The restrictions apply **only** to code outside the defining crate — the crate itself still sees and enforces the type's exact, complete definition.
- It's the standard way to signal "this list is not guaranteed final" on any public enum or struct meant to be extended over time.
