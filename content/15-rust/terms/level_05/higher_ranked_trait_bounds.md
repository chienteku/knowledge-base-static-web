# Higher-Ranked Trait Bounds (HRTB)

> **Level 5 — Lifetimes**
> The `for<'a>` syntax specifying that a trait bound or closure must hold for *all* possible lifetimes.

---

## 1. Prerequisites


- [Trait Bound](../level_04/trait_bound.md) — Constraining generic types.
- [Lifetime (`'a`)](lifetime.md) — Reference validity annotations.
- [Closure](../level_06/closure.md) — Closures that take references as parameters.

---

## 2. Term Category

**Advanced Lifetimes**: Higher-Ranked Trait Bounds (`for<'a>`) specifying that a trait bound or closure must hold universally for *all* possible reference lifetimes `'a`.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

When a function creates temporary data on its local stack (or inside a temporary buffer) and passes a reference of that local data to a caller-provided closure callback, standard generic lifetime bounds (`fn foo<'a, F>(f: F) where F: Fn(&'a str)`) fail to compile.

In standard generic parameters (`<'a>`), the lifetime `'a` is chosen by the caller *outside* the function call, meaning `'a` must outlive the function invocation. However, data created *inside* the function body has a shorter lifetime than any caller-chosen `'a`.

Higher-Ranked Trait Bounds (HRTB) use the `for<'a>` syntax to declare universal quantification over lifetimes. `for<'a> F: Fn(&'a str)` specifies that the closure `F` must be valid for *any* arbitrary lifetime `'a` instantiated dynamically by the callee inside the function execution scope.

### (2) Reality Metaphor

A passport office photo booth operator: standard lifetime bounds (`<'a>`) are like demanding that the customer bring their own photo paper from home before arriving; Higher-Ranked Trait Bounds (`for<'a>`) mean the booth operator hands the customer photo paper of *any* arbitrary size created on the spot inside the booth, and the customer's camera must adapt to print on whatever paper lifetime is generated on the fly.

### (3) Rust Code Examples

#### Short Snippet
```rust
pub fn process_local_buf<F>(mut f: F)
where
    for<'a> F: FnMut(&'a str) -> usize,
{
    let temp_buf = String::from("local stack buffer");
    let len = f(&temp_buf);
    assert_eq!(len, 18);
}
```

#### Fuller Example
```rust
pub trait Serializer {
    fn serialize<'a>(&self, input: &'a str) -> &'a str;
}

pub fn validate_serializer<S>(serializer: S) -> bool
where
    S: for<'a> Fn(&'a str) -> &'a str,
{
    let local_data = String::from("payload");
    let res = serializer(&local_data);
    res == "payload"
}

fn main() {
    assert!(validate_serializer(|s| s));
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Attempting to Use Outer Generic Lifetime Parameters `'a` for Internal Stack References

**The mistake:** Declaring `fn call<'a, F>(f: F) where F: Fn(&'a str)` and passing a reference to a local variable `let s = String::from(...); f(&s)`.

**Why it is wrong:** The caller chooses lifetime `'a` *before* the function executes. A local variable created on the function's stack cannot live as long as the caller-specified `'a`, resulting in compiler error `E0597` (`borrowed value does not live long enough`).

*Incorrect:*
```rust
fn execute<'a, F>(f: F) where F: Fn(&'a str) { let s = String::from("hi"); f(&s); } // E0597 Error!
```

*Fix:*
```rust
fn execute<F>(f: F) where for<'a> F: Fn(&'a str) { let s = String::from("hi"); f(&s); } // HRTB for<'a>!
```

### Mistake 2: Confusing `for<'a>` Lifetime Bounds with Struct Type Lifetime Parameters

**The mistake:** Adding `for<'a>` to a struct definition directly (`struct Reader for<'a> { ... }`).

**Why it is wrong:** `for<'a>` is a trait bound quantifier (`where T: for<'a> Trait<'a>`), not a struct definition parameter.

*Incorrect:*
```rust
struct DataReader for<'a> { ptr: &'a str } // Syntax Error!
```

*Fix:*
```rust
struct DataReader<'a> { ptr: &'a str } // Standard struct lifetime parameter!
```

### Mistake 3: Assuming HRTB Allows Returning References to Dropped Local Data

**The mistake:** Writing `for<'a> F: Fn(&'a str) -> &'a str` and attempting to return the borrowed reference *out* of the function.

**Why it is wrong:** HRTB guarantees the closure can accept short-lived internal references, but it does *not* extend the lifetime of local stack variables. Returning references to internal variables still violates lifetime rules.

*Incorrect:*
```rust
fn leak<'a, F>(f: F) -> &'a str where for<'b> F: Fn(&'b str) -> &'b str { let s = String::from("a"); f(&s) }
```

*Fix:*
```rust
Return owned data (String) or pass references to caller-owned buffers!
```

---

## 5. Practice Exercises

### Exercise 1: High-Performance Zero-Copy Network Packet Inspector Callback Engine

**Scenario:** Build a zero-copy packet parser `inspect_network_frames<F>(raw_bytes: &[u8], mut inspector: F) -> usize` that constructs temporary `&str` frame views from a stack buffer and passes them to a higher-ranked closure callback `for<'a> F: FnMut(&'a str) -> bool`.

**Requirements:**
1. Define `inspect_network_frames` accepting byte slice `&[u8]` and generic closure `F`.
1. Enforce HRTB constraint `for<'a> F: FnMut(&'a str) -> bool`.
1. Split raw bytes into frame chunks, convert valid UTF-8 chunks to `&str` views, and pass to `inspector`.
1. Count valid frames and write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn inspect_network_frames<F>(raw_bytes: &[u8], mut inspector: F) -> usize
> where
>     for<'a> F: FnMut(&'a str) -> bool,
> {
>     let mut valid_count = 0;
>     for chunk in raw_bytes.split(|&b| b == b'
> ') {
>         if let Ok(frame_str) = std::str::from_utf8(chunk) {
>             if !frame_str.is_empty() && inspector(frame_str) {
>                 valid_count += 1;
>             }
>         }
>     }
>     valid_count
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_hrtb_packet_inspector() {
>         let payload = b"HEADER_OK
> FRAME_DATA
> INVALID_FRAME
> FOOTER_OK";
>         let count = inspect_network_frames(payload, |frame| {
>             frame.ends_with("OK") || frame.starts_with("FRAME")
>         });
>         assert_eq!(count, 3);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. The closure bound `for<'a> F: FnMut(&'a str) -> bool` guarantees that `inspector` can accept temporary string slice views `&'a str` created on the fly inside the iteration loop from temporary stack chunks.
> 2. Enables zero-copy packet processing without requiring caller-provided lifetime annotations.

---

### Exercise 2: Middleware Pipeline Validator with Higher-Ranked Trait Bounds

**Scenario:** Implement an HTTP request middleware evaluator `evaluate_middleware<M>(middleware: M) -> bool` testing if a middleware component can process temporary header references of any arbitrary lifetime.

**Requirements:**
1. Define `evaluate_middleware` with bound `for<'a> M: Fn(&'a str, &'a str) -> bool`.
1. Construct temporary header keys and values on the local stack.
1. Validate middleware response and write unit test.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn evaluate_middleware<M>(middleware: M) -> bool
> where
>     for<'a> M: Fn(&'a str, &'a str) -> bool,
> {
>     let key = String::from("Authorization");
>     let val = String::from("Bearer secret_token");
>     middleware(&key, &val)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_middleware_hrtb() {
>         let auth_middleware = |k: &str, v: &str| k == "Authorization" && v.starts_with("Bearer");
>         assert!(evaluate_middleware(auth_middleware));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `for<'a> M: Fn(&'a str, &'a str) -> bool` ensures the middleware closure operates on short-lived temporary stack variables `key` and `val`.

---

### Exercise 3: HRTB Function Pointer Event Dispatcher

**Scenario:** Build an event dispatcher `dispatch_temp_event` accepting a raw function pointer with higher-ranked lifetime bounds `for<'a> fn(&'a [u8]) -> usize`.

**Requirements:**
1. Define `dispatch_temp_event(f: for<'a> fn(&'a [u8]) -> usize) -> usize`.
1. Create temporary local buffer and dispatch.
1. Write unit test.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn dispatch_temp_event(f: for<'a> fn(&'a [u8]) -> usize) -> usize {
>     let temp_buf = [1u8, 2, 3, 4, 5];
>     f(&temp_buf)
> }
> 
> fn calc_sum(bytes: &[u8]) -> usize {
>     bytes.iter().map(|&b| b as usize).sum()
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_hrtb_fn_pointer() {
>         assert_eq!(dispatch_temp_event(calc_sum), 15);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Demonstrates `for<'a>` syntax applied directly to raw function pointers (`for<'a> fn(&'a [u8]) -> usize`).

---

## 6. Related Terms


- [Lifetime (`'a`)](lifetime.md) — The reference lifetime parameter.
- [Trait Bound](../level_04/trait_bound.md) — Generic constraints.
- [Closure](../level_06/closure.md) — Functional argument types where HRTB is most useful.
- [Lifetime Elision](lifetime_elision.md) — Related concept: Lifetime Elision.

---

## 7. Key Takeaways

- `for<'a>` means 'for all lifetimes `'a`' (universal quantification over lifetimes).
- Required when a function passes references of locally-created stack data to closure callbacks.
- Differs from caller-chosen generic lifetimes (`<'a>`) which must outlive the function invocation.
- Standard closure trait bounds like `Fn(&str)` automatically expand to `for<'a> Fn(&'a str)` via lifetime elision.
