# Lifetime Variance

> **Level 5 — Lifetimes**
> The type-system rules governing how lifetimes relationship in subtyping: covariance, contravariance, and invariance.

---

## 1. Prerequisites


- [Lifetime (`'a`)](lifetime.md) — Reference scope annotations.
- [Lifetime Bounds](lifetime_bounds.md) — The outlives relationship (`'a` outlives `'b`).
- [Mutable Borrowing (`&mut`)](../level_03/mutable_borrowing.md) — The primary source of invariance in Rust.

---

## 2. Term Category

**Type-System Rule (subtyping for lifetimes)**: Although Rust lacks traditional object-oriented class inheritance, it features **Subtyping for Lifetimes**. If lifetime `'a` outlives lifetime `'b` (`'a: 'b`), then `'a` is a subtype of `'b` (denoted `'a <: 'b`). **Variance** defines how lifetime subtyping relationship transforms when applied inside generic type constructors like `&'a T`, `&mut 'a T`, `fn(&'a T)`, or `Cell<T>`.

---

## 3. Explanation

### (1) The Three Variance Categories

Given `'a: 'b` (meaning `'a` outlives `'b`, so `'a` is a subtype of `'b`):

1. **Covariance (`F<'a>` is a subtype of `F<'b>`):**
   - You can pass a longer-lived reference where a shorter-lived reference is requested.
   - Example: Immutable reference `&'a T` is **covariant** over both `'a` and `T`. You can pass `&'static str` into a function expecting `&'a str`.
2. **Invariance (`F<'a>` and `F<'b>` have no subtype relationship):**
   - You MUST supply an exact type and lifetime match. Subtyping substitution is forbidden.
   - Example: Mutable reference `&mut 'a T` is **covariant** over `'a`, but **INVARIANT** over `T`! You CANNOT pass `&mut &'static str` where `&mut &'a str` is expected.
3. **Contravariance (`F<'b>` is a subtype of `F<'a>`):**
   - Inverts the subtype relationship. A function expecting a broader/shorter lifetime can be substituted where a narrower/longer lifetime is expected.
   - Example: Function argument parameters `fn(T)` are **contravariant** over `T`.

### (2) Design Motivation — "Why is `&mut T` Invariant over `T`?"

Consider what catastrophe would occur if mutable references `&mut T` were covariant over `T`:

```rust
// HYPOTHETICAL DANGEROUS RUST (If &mut T were covariant over T)
fn overwrite_reference<'a>(target: &mut &'a str) {
    let local_string = String::from("short_lived_stack_data");
    *target = &local_string; // Write a short-lived reference into `target`!
} // local_string is dropped here! Memory deallocated!

fn main() {
    let mut static_ref: &'static str = "global_constant";
    // If &mut T were covariant, &mut &'static str could be passed as &mut &'a str!
    overwrite_reference(&mut static_ref);
    // CRASH / DANGLING POINTER: static_ref now points to deallocated stack memory!
    println!("{static_ref}"); 
}
```

Because `&mut T` provides **write access** to `T`, passing a mutable reference to a longer-lived variable (`&'static str`) into a function expecting a shorter lifetime would allow the function to write short-lived references into long-lived locations.

To prevent dangling pointers and guarantee memory safety, **`&mut T` MUST be invariant over `T`**.

### (3) Summary Variance Matrix

| Type / Type Constructor | Variance over `'a` | Variance over `T` | Practical Impact |
|---|---|---|---|
| `&'a T` | Covariant | Covariant | Can substitute longer lifetimes for shorter ones |
| `&'a mut T` | Covariant | **Invariant** | Cannot swap internal reference types |
| `Box<T>` / `Vec<T>` | — | Covariant | Owned containers allow lifetime substitution |
| `Cell<T>` / `RefCell<T>` | — | **Invariant** | Interior mutability enforces exact type matching |
| `fn(T) -> U` | — | `T` is **Contravariant**, `U` is Covariant | Function arguments invert subtyping |

### (4) Reality Metaphor

- **Covariance (`&'a T`)**: A passport scanner that accepts any passport valid for *at least* 6 months. If your passport is valid for 10 years (`'static`), it is accepted without issue.
- **Invariance (`&mut T`)**: A dual-slot lockbox key exchange. You hand over a lockbox designed to store a master key. The receiver cannot replace the master key with a temporary hotel room key, because the lockbox owner will retrieve the key later after the hotel reservation expires.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to Pass `&mut &'static str` into a Function Expecting `&mut &'a str`

**The mistake:** Expecting `&mut &'static str` to automatically degrade to `&mut &'a str`.

**Why it is wrong:** `&mut T` is invariant over `T`. Even though `&'static str` is a subtype of `&'a str`, `&mut &'static str` is NOT a subtype of `&mut &'a str`.

*Incorrect:*
```rust
fn update_slot<'a>(slot: &mut &'a str, val: &'a str) {
    *slot = val;
}

fn main() {
    let mut s: &'static str = "static";
    let local = String::from("local");
    // update_slot(&mut s, &local); // ❌ Error E0308/E0597: lifetime mismatch due to invariance!
}
```

*Fix:*
```rust
fn update_slot(slot: &mut String, val: &str) {
    slot.clear();
    slot.push_str(val); // Re-assign content or use owned types!
}
```

### Mistake 2: Confusing Covariance over `'a` with Invariance over `T` in `&'a mut T`

**The mistake:** Assuming `&'a mut T` cannot have its outer lifetime `'a` shortened.

**Why it is wrong:** `&'a mut T` is **covariant over `'a`** (the reference lifetime itself can be reborrowed for a shorter scope), but **invariant over `T`** (the underlying type `T` cannot change its lifetime parameters).

*Incorrect:*
```rust
// Assuming you cannot pass a long-lived mutable reference for a short function scope
fn process_buffer<'a>(buf: &'a mut [u8]) { ... }
```

*Fix:*
```rust
// Fully valid: 'a in &'a mut T is covariant, so long-lived &mut buf can be passed!
```

### Mistake 3: Unexpected Invariance in Structs Using `Cell<T>` or `PhantomData<T>`

**The mistake:** Expecting generic structs containing `Cell<&'a str>` to be covariant over `'a`.

**Why it is wrong:** `Cell<T>` provides interior mutability and is invariant over `T`. Any struct wrapping `Cell<&'a str>` automatically becomes invariant over `'a`.

---

## 5. Practice Exercises

### Exercise 1: Zero-Copy Network Packet Buffer Replacer

**Scenario:** Implement a network buffer replacement function `replace_buffer<'a>(target: &mut &'a [u8], new_data: &'a [u8])`. Demonstrate how invariance of `&mut T` guarantees that `target` receives a slice matching lifetime `'a`.

**Requirements:**
1. Function updates `*target = new_data`.
2. Write unit test creating a buffer and replacing it with a slice from an active payload string.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn replace_buffer<'a>(target: &mut &'a [u8], new_data: &'a [u8]) {
>     *target = new_data;
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_buffer_replacement() {
>         let payload = vec![1, 2, 3, 4, 5];
>         let mut current_slice: &[u8] = &payload[0..2];
>         
>         let new_slice: &[u8] = &payload[2..5];
>         replace_buffer(&mut current_slice, new_slice);
>         
>         assert_eq!(current_slice, &[3, 4, 5]);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `target` has type `&mut &'a [u8]`. Because `&mut T` is invariant over `T`, both `current_slice` and `new_slice` must share the exact lifetime `'a`.
> 2. The compiler allows the mutation because both references derive from the lifetime of `payload`.
> 
---

### Exercise 2: Contravariant Event Listener Registry

**Scenario:** Event handling callbacks `fn(&'a EventContext)` demonstrate contravariance over `'a`. Write a callback dispatcher demonstrating that a handler accepting a general context (shorter lifetime requirement) can be used where a specific context is expected.

**Requirements:**
1. Define struct `EventContext<'a> { payload: &'a str }`.
2. Define a function `invoke_callback<'a>(cb: fn(&'a EventContext<'a>), ctx: &'a EventContext<'a>)`.
3. Write unit tests passing closures into the dispatcher.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub struct EventContext<'a> {
>     pub payload: &'a str,
> }
> 
> pub fn invoke_callback<'a>(cb: fn(&EventContext<'a>), ctx: &'a EventContext<'a>) {
>     cb(ctx);
> }
> 
> fn generic_logger(ctx: &EventContext) {
>     println!("Payload received: {}", ctx.payload);
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_contravariant_callback() {
>         let data = String::from("network_event_packet");
>         let ctx = EventContext { payload: &data };
>         
>         // generic_logger accepts EventContext with ANY lifetime; contravariance allows passing it here!
>         invoke_callback(generic_logger, &ctx);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Function argument types `fn(T)` are **contravariant** over `T`.
> 2. `generic_logger` can accept contexts with shorter or broader lifetimes, so it satisfies the parameter constraint safely.
> 
---

### Exercise 3: Invariance Safeguard Demonstration

**Scenario:** Write a test verifying that `&'static str` can be passed into functions expecting `&'a str` due to covariance, while explaining via comments why `&mut &'static str` cannot be mutated into short-lived references.

**Requirements:**
1. Implement `fn read_title<'a>(title: &'a str) -> usize`.
2. Test passing `&'static str` into `read_title`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn read_title<'a>(title: &'a str) -> usize {
>     title.len()
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_covariance_immutable_ref() {
>         let static_title: &'static str = "GLOBAL_APP_TITLE";
>         // Covariance allows passing &'static str to &'a str parameter!
>         let len = read_title(static_title);
>         assert_eq!(len, 16);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Immutable reference `&'a T` is **covariant** over `'a`, permitting `'static` (longer lifetime) to substitute for `'a` (shorter lifetime).
> 2. Mutable reference `&mut T` is **invariant** over `T`, preventing short-lived reference assignment to long-lived memory slots.
> 
---

## 6. Related Terms


- [Lifetime (`'a`)](lifetime.md) — Reference scope annotations.
- [Mutable Borrowing (`&mut`)](../level_03/mutable_borrowing.md) — The trigger for invariance.
- [`RefCell<T>`](../level_03/refcell_t.md) — Interior mutability types that are invariant over `T`.
- [`Drop Check` (dropck)](../level_03/drop_check.md) — Related concept: `Drop Check` (dropck).

---

## 7. Key Takeaways

- **Covariance:** Can substitute longer lifetimes for shorter ones (`&'a T`).
- **Invariance:** Must match exact lifetimes (`&mut T`, `Cell<T>`).
- Invariance prevents writing short-lived data into long-lived references, preventing dangling pointers.
- Function arguments `fn(T)` are **contravariant** over `T`.
