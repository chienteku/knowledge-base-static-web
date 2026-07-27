# `Drop Check` (dropck)

> **Level 3 — Ownership & Borrowing**
> The specific borrow-checker sub-analysis that verifies data is still valid when a destructor (`Drop`) runs.

---

## 1. Prerequisites

- [`Drop` Trait](../level_03/drop_trait.md) — The destructor mechanism this analysis specifically governs.
- [Borrow Checker](../level_03/borrow_checker.md) — The broader system dropck is a specialized part of.
- [Lifetime (`'a`)](../level_05/lifetime.md) — What dropck ultimately reasons about.

---

## 2. Term Category

**Compiler Sub-Analysis (the destructor safety net)**: Dropck ("drop check") is the part of the borrow checker specifically concerned with one question: when a value's `Drop::drop` runs, are all the references *it* might touch still guaranteed valid? Without this check, a generic type holding a borrowed reference could have its destructor run *after* the referenced data was already gone.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Consider a struct `struct Holder<'a> { data: &'a str }` that implements `Drop` with logic that reads `self.data` inside `drop()`. The ordinary borrow checker already ensures the reference is valid everywhere it's *used* in your code — but a destructor is special: it runs **implicitly**, at the end of scope, potentially interleaved with the destructors of other values in a specific, compiler-determined order (generally reverse declaration order). Dropck exists to specifically verify that whatever a type's `Drop` implementation might touch (based on its generic parameters and lifetimes) is guaranteed to still be alive at the exact moment that destructor actually executes — closing a soundness hole that the "normal" borrow-checking rules alone wouldn't catch, since a `drop()` call is never written explicitly in your source code for the compiler to see and check like any other statement.

### (2) Reality Metaphor

Imagine a stage show where performers must exit through matching doors in a strict, camera-verified order.

- **Ordinary borrow checking** verifies that during the show, no performer stands in a spot they're not allowed to be in *while the curtain is up and the audience is watching* (**while your code explicitly runs**).
- **Dropck** is a separate safety inspector who specifically checks: "when the stage crew silently strikes the set after the show ends (**when `Drop::drop` runs implicitly**), will any prop a performer needs to physically touch during their exit still actually be standing there, or might it have already been hauled away by an earlier cleanup crew?" This exit-order safety check happens for a moment that's never explicitly scripted in the show itself, so it needs its own dedicated inspection pass.

### (3) Rust Code Examples

#### Short Snippet (What Dropck Prevents)
```rust
struct PrintOnDrop<'a>(&'a str);

impl<'a> Drop for PrintOnDrop<'a> {
    fn drop(&mut self) {
        println!("Dropping with data: {}", self.0); // Touches the borrowed data!
    }
}

fn main() {
    let text = String::from("hello");
    let holder = PrintOnDrop(&text);

    // Dropck ensures `text` cannot be dropped before `holder`, since `holder`'s
    // destructor reads `text`'s data. The compiler enforces `text` outlives `holder`.
    drop(holder); // Prints "Dropping with data: hello" — `text` is still valid here.
    println!("{text}"); // Still usable — dropck's ordering guarantee held.
}
```

#### Fuller Example (Why Generic `Drop` Impls Need Extra Care)
```rust
// This struct is generic over T, and its Drop impl might (or might not) touch `T`'s data.
struct Wrapper<T> { value: T }

impl<T> Drop for Wrapper<T> {
    fn drop(&mut self) {
        // Even if this body does nothing with `self.value` directly, dropck
        // CONSERVATIVELY assumes it might (since T could itself have interesting
        // Drop logic), and requires any borrowed data inside T to outlive Wrapper.
        println!("Wrapper dropped");
    }
}

fn main() {
    let text = String::from("borrowed data");
    let w = Wrapper { value: &text };
    // Dropck ensures `text` outlives `w`, even though THIS PARTICULAR drop() body
    // doesn't touch `self.value` — it can't tell that in general, so it's conservative.
    drop(w);
    println!("{text}");
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Drop Check Scoping and Lifecycle Rules

**The mistake:** Assuming Drop Check instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("drop_check_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("drop_check_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Drop Check State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Drop Check through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Drop Check Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Drop Check instances across OS threads via `std::thread::spawn`.

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

## 5. Practice Exercises

### Exercise 1: Explain the Compile Error

**Problem:** This code fails with a lifetime error related to drop order. Explain why, in terms of dropck.
```rust
struct Logger<'a>(&'a str);
impl<'a> Drop for Logger<'a> {
    fn drop(&mut self) { println!("log: {}", self.0); }
}

fn broken() {
    let logger;
    let message = String::from("done");
    logger = Logger(&message);
    drop(message); // Try to drop `message` early, WHILE `logger` still borrows it.
}
```

> [!check]- Answer
> Dropck requires that any data a value's `Drop` impl might read remains valid for at least as long as that value itself might still be dropped. Here, `logger` borrows `message`, and `logger`'s `Drop` impl reads that borrowed data. Manually calling `drop(message)` while `logger` (which still holds a reference to it, and hasn't been dropped yet) is still alive would leave `logger`'s eventual destructor call reading freed data — exactly the unsound scenario dropck exists to reject. The compiler flags this at the `drop(message)` line itself.

---

### Exercise 2: Order of Variable Drop Execution

**Problem:** Demonstrate that variables declared in local scopes are dropped in reverse order of declaration.

**Expected output:**
```
Dropping B
Dropping A
```

> [!check]- Answer
> ```rust
> struct CustomDrop(&'static str);
> impl Drop for CustomDrop {
>     fn drop(&mut self) {
>         println!("Dropping {}", self.0);
>     }
> }
> fn main() {
>     let _a = CustomDrop("A");
>     let _b = CustomDrop("B");
> }
> ```
>
> **Explanation:** Local variables in Rust are dropped in strict LIFO (last-in, first-out) order.

### Exercise 3: Explicit Early Drops with `std::mem::drop`

**Problem:** Use `drop(resource)` to release a resource before a long-running computation.

**Expected output:**
```
Resource dropped
Computation done
```

> [!check]- Answer
> ```rust
> struct Guard;
> impl Drop for Guard { fn drop(&mut self) { println!("Resource dropped"); } }
> fn main() {
>     let g = Guard;
>     drop(g);
>     println!("Computation done");
> }
> ```
>
> **Explanation:** `std::mem::drop(x)` moves ownership to the function body, triggering immediate destructor execution.

---

## 6. Related Terms

- [`Drop` Trait](../level_03/drop_trait.md) — The destructor mechanism dropck specifically protects.
- [Borrow Checker](../level_03/borrow_checker.md) — The broader compiler system dropck is a specialized extension of.
- [Lifetime Variance](../level_05/lifetime_variance.md) — Closely intertwined with dropck's reasoning about generic lifetime parameters.
- [`PhantomData<T>`](../level_11/phantomdata_t.md) — Sometimes used specifically to communicate drop-related ownership semantics to dropck for types using raw pointers.

---

## 7. Key Takeaways

- Dropck is the borrow-checker sub-analysis ensuring data is still valid at the exact, implicit moment a value's destructor runs.
- It exists because `Drop::drop()` calls are never written explicitly in your code, so ordinary borrow checking alone can't verify their safety.
- It's deliberately **conservative** for generic types — it assumes a generic parameter's data might be touched during drop, even if a specific `drop()` body doesn't touch it.
- The unstable `#[may_dangle]` attribute is the (unsafe, nightly-only) escape hatch for opting a specific parameter out of this conservative assumption.
