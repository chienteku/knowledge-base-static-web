# Feature Flags

> **Level 7 — Modules, Visibility & Project Structure**
> Conditional compilation of optional functionality, declared in `Cargo.toml`.

---

## 1. Prerequisites


- [`Cargo.toml`](cargo_toml.md) — The file where Feature Flags are defined and requested.

---

## 2. Term Category

**Rust Tooling (the opt-in system)**: In some languages, if you download a massive graphics library just to draw a single 2D circle, you end up compiling a million lines of 3D rendering code you will never use. It bloats your compiled binary and slows down your compile times. 

Rust solves this using **Feature Flags**: a built-in system that allows library authors to make heavy parts of their code strictly opt-in.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

A core Rust philosophy is *"pay for what you use."* 

Feature Flags allow the Rust compiler to completely ignore large blocks of code during compilation if the user didn't explicitly ask for them. This keeps compile times incredibly fast and binary sizes incredibly small. 

It also allows library authors to build powerful "mega-crates" (like the `tokio` async runtime, or the `serde` serialization library) without worrying about punishing users who only need 1% of the functionality.

### (2) Reality Metaphor

Imagine buying a new Car. 

The base model comes with the engine and wheels (the core crate logic). But it has optional upgrades: a sunroof, heated seats, and a premium stereo (the **Feature Flags**). 

If you don't check the box for the sunroof on your order form, the factory doesn't just install it and glue it shut—they completely omit the sunroof from the assembly line. The car is literally built differently, saving weight and manufacturing cost.

### (3) Rust Code Examples

#### Short Snippet (The Consumer)
This is how you *activate* a feature when downloading a crate from `crates.io`.

**File: `Cargo.toml`**
```toml
[dependencies]
# 1. The default (gets whatever the author decided was standard)
serde = "1.0"

# 2. The Feature Flag! We explicitly ask for the `derive` macro.
serde = { version = "1.0", features = ["derive"] }

# 3. Multiple Features! We want everything `tokio` has to offer.
tokio = { version = "1.30", features = ["macros", "rt-multi-thread", "net"] }
```

#### Fuller Example (The Library Author)
If you are building your own library, how do you create these optional upgrades for your users? You define them in `Cargo.toml` and use the `#[cfg(...)]` macro in your Rust code!

**File: `Cargo.toml`**
```toml
[package]
name = "my_math_lib"
version = "0.1.0"

# 1. We declare our custom features!
[features]
default = [] # No features active by default
super_calculus = [] # Our custom opt-in feature!
```

**File: `src/lib.rs`**
```rust
// This function is in the "base model". It always compiles.
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

// This function is OPTIONAL! 
// The compiler completely ignores this code unless the user 
// explicitly requests `features = ["super_calculus"]`.
#[cfg(feature = "super_calculus")]
pub fn solve_differential_equation() {
    println!("Doing heavy math...");
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Assuming Feature Flags Are Mutually Exclusive (Feature Additivity Violation)

**The mistake:** Designing features assuming `feature = "backend_a"` and `feature = "backend_b"` can never be enabled simultaneously in the same dependency tree.

**Why it is wrong:** Cargo features are **additive**. If two downstream crates in a workspace activate different features of your crate, Cargo unifies them into a single build with *both* features enabled simultaneously.

*Incorrect:*
```rust
#[cfg(feature = "backend_a")]
pub struct Backend;

#[cfg(feature = "backend_b")]
pub struct Backend; // ❌ Fails to compile when BOTH features are active!
```

*Fix:*
```rust
// Use distinct struct names or enum variants so features remain additive!
```

### Mistake 2: Missing `default-features = false` When Opting Out of Heavy Defaults

**The mistake:** Listing `features = ["json"]` for a crate hoping to save compile time, without adding `default-features = false`.

**Why it is wrong:** Unless `default-features = false` is explicitly specified, Cargo compiles default features *in addition* to the newly listed features.

*Incorrect:*
```toml
reqwest = { version = "0.11", features = ["json"] } # ❌ Still pulls default OpenSSL/native-tls dependencies!
```

*Fix:*
```toml
reqwest = { version = "0.11", default-features = false, features = ["json"] } # Strips defaults!
```

### Mistake 3: Creating Implicit Feature Name Pollution (Pre-Cargo 1.60 Syntax)

**The mistake:** Writing `json = ["serde_json"]` in `[features]` instead of `json = ["dep:serde_json"]`.

**Why it is wrong:** Omitting the `dep:` prefix exposes an implicit feature named `serde_json`, polluting the public feature API namespace.

---

## 5. Practice Exercises

### Exercise 1: The Bare Minimum

**Scenario:** Write the `Cargo.toml` line to import `reqwest` version `0.11`. You want to disable all default features to keep the compile time low, but you DO want to enable the `json` feature.

> [!check]- Answer
> ```toml
> [dependencies]
> reqwest = { version = "0.11", default-features = false, features = ["json"] }
> ```

---

### Exercise 2: Designing a `[features]` Section

**Scenario:**
You are building a crate called `http_client` with three optional capabilities: `json` (JSON body support via `serde_json`), `tls` (HTTPS via `rustls`), and `cookies` (cookie jar). You want `json` and `tls` to be on by default (most users need them), but `cookies` must be explicitly opted in.

Write the complete `[features]` section in `Cargo.toml` for this crate, then answer:

1. A downstream user writes `http_client = { version = "1.0", default-features = false, features = ["json"] }`. Which capabilities are active?
2. A user writes `http_client = "1.0"` (no features key). Which capabilities are active?
3. What does `dep:serde_json` mean in a feature list vs just writing `serde_json`?

> [!check]- Answer
> **`Cargo.toml` `[features]` section:**
> ```toml
> [features]
> # "default" is the magic key: these features activate automatically.
> default = ["json", "tls"]
>
> # Each feature lists which optional deps (and other features) it activates.
> json    = ["dep:serde_json"]
> tls     = ["dep:rustls"]
> cookies = ["dep:cookie"]    # Must be explicitly requested — not in default.
>
> [dependencies]
> serde_json = { version = "1.0", optional = true }
> rustls     = { version = "0.21", optional = true }
> cookie     = { version = "0.18", optional = true }
> ```
>
> **1. `default-features = false, features = ["json"]`:**
> Only `json` (and therefore `serde_json`) is active. Neither `tls` nor `cookies` is compiled in. `default-features = false` disables the `default` feature before re-adding only what was explicitly listed.
>
> **2. `http_client = "1.0"` (no features key):**
> `json` and `tls` are active (from `default`). `cookies` is not active. This is the out-of-the-box experience for most users.
>
> **3. `dep:serde_json` vs just `serde_json`:**
> In older Cargo (before 1.60), writing `serde_json` in a feature list implicitly created a *feature* named `serde_json` in addition to activating the dependency. This caused crate API leakage \u2014 users could accidentally enable `serde_json` by activating a feature named `serde_json`. The `dep:` prefix (Cargo 1.60+) explicitly says "activate the *dependency* named `serde_json`" without creating an implicit feature by the same name. Always prefer `dep:` for new crates.
>
> #### Technical Explanation
>
> Feature design is a core library authorship skill. The `default` feature controls the out-of-the-box experience; `dep:` keeps the feature namespace clean; and `default-features = false` gives downstream users the escape hatch to build a minimal version.

---

### Exercise 3: Conditional Feature Code Gating

**Scenario:** Gate a function with `#[cfg(feature = "extra")]`.

**Expected output:**
> [!check]- Answer
> ```
> Extra feature code compiled
> ```
>
> #### Implementation
>
> ```rust
> #[cfg(feature = "extra")]
> fn extra() { println!("Extra feature code compiled"); }
> fn main() {
>     #[cfg(feature = "extra")]
>     extra();
> }
> ```
>
> #### Technical Explanation
> Feature flags map directly to `#[cfg(feature = "...")]` conditional compilation gates.

---

## 6. Related Terms


- [`Cargo.toml`](cargo_toml.md) — Where custom features are defined.
- [`cfg` Attribute](cfg_attribute.md) — Related concept: `cfg` Attribute.

---

## 7. Key Takeaways

- Feature Flags allow **conditional compilation**, keeping compile times fast and binaries small.
- You activate them using `features = ["..."]` in your `[dependencies]` section.
- You can create your own custom features in the `[features]` section of your `Cargo.toml`.
- Inside Rust code, you wrap optional code with the **`#[cfg(feature = "name")]`** attribute so the compiler knows to ignore it if the flag isn't active.
- Use `default-features = false` if you want a strictly minimal import.
