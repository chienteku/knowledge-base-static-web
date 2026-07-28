# `std::mem` Utilities (`replace`, `take`, `swap`, `drop`)

> **Level 3 — Ownership & Borrowing**
> Core functions to move values into, out of, and between places without violating borrow rules or allocating.

---

## 1. Prerequisites

- [Ownership](../level_03/ownership.md) — What these functions directly manipulate.
- [Mutable Borrowing (`&mut`)](../level_03/mutable_borrowing.md) — The context in which "I need to move this out from behind a reference" arises.
- [`Default` Trait](../level_04/default_trait.md) — What `mem::take` leaves behind.

---

## 2. Term Category

**Ownership Escape Hatch (the borrow-checker's release valve)**: You cannot normally move a value out of a struct through a `&mut` reference — the borrow checker forbids leaving the place empty. `std::mem`'s four core functions exist specifically to let you do this safely, by always leaving *something* valid behind, instead of leaving a hole.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Imagine you have `&mut self` and want to take ownership of `self.some_field` to pass it elsewhere. You can't just write `let x = self.some_field;` — that would leave `self.some_field` in an undefined, "moved-from" state, and Rust refuses to allow a struct to exist with an uninitialized field. The naive fix — `.clone()` the field — works but costs a real allocation and a full copy every time, even when you're about to overwrite or discard the original anyway. `std::mem`'s functions solve this properly: they let you swap the value out for a placeholder *in the same instruction*, so there's never a moment where the field is empty, and no cloning is required.

### (2) Reality Metaphor

Imagine a hotel room that must always contain exactly one guest (never zero), but you need to physically remove the current guest to send them to a conference room.

- **`mem::replace(&mut room, new_guest)`**: A porter walks the new guest in through one door at the exact same instant the old guest walks out the other door. The room is never empty, and you're handed the old guest to do with as you please.
- **`mem::take(&mut room)`**: Same swap, but the porter's "new guest" is always a bland, default placeholder guest (`Default::default()`) — used when you don't have a specific replacement in mind, just need the room non-empty.
- **`mem::swap(&mut room_a, &mut room_b)`**: Two rooms trade their guests simultaneously, with nobody ever standing in the hallway in between.
- **`mem::drop(value)`**: You escort a guest out and immediately end their stay (`Drop::drop`) right now, instead of waiting for them to leave naturally at the end of scope.

### (3) Rust Code Examples

#### Short Snippet (`mem::take`, the Most Common One)
```rust
struct Buffer {
    data: Vec<u8>,
}

impl Buffer {
    // Takes ownership of `self.data`, leaving an empty Vec (its Default) behind.
    fn take_data(&mut self) -> Vec<u8> {
        std::mem::take(&mut self.data)
    }
}

fn main() {
    let mut buf = Buffer { data: vec![1, 2, 3] };
    let owned = buf.take_data();

    println!("{:?}", owned);      // [1, 2, 3]
    println!("{:?}", buf.data);   // [] (empty Vec, NOT moved-from/invalid)
}
```

#### Fuller Example (State-Machine Transition with `mem::replace`)
```rust
enum State {
    Idle,
    Running { progress: u32 },
    Done { result: String },
}

fn advance(state: &mut State) {
    // We need the OLD state's data to compute the NEW state, but we can't
    // have two states alive in the same field at once. mem::replace lets us
    // swap in a temporary placeholder, take ownership of the old value, and
    // then overwrite the field again — all without cloning `progress`.
    let old = std::mem::replace(state, State::Idle); // Idle is a cheap placeholder.

    *state = match old {
        State::Idle => State::Running { progress: 0 },
        State::Running { progress } if progress < 100 => State::Running { progress: progress + 10 },
        State::Running { progress: _ } => State::Done { result: "finished!".into() },
        done @ State::Done { .. } => done, // Already done; put it back unchanged.
    };
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Std Mem Utilities Scoping and Lifecycle Rules

**The mistake:** Assuming Std Mem Utilities instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("std_mem_utilities_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("std_mem_utilities_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Std Mem Utilities State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Std Mem Utilities through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Std Mem Utilities Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Std Mem Utilities instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Swap Without a Temporary Variable

**Problem:** Without using `std::mem::swap`, swapping two variables normally requires a third temporary variable (`let tmp = a; a = b; b = tmp;`). Use `mem::swap` to swap the contents of two `Vec<i32>` variables directly.

> [!check]- Answer
> ```rust
> fn main() {
>     let mut a = vec![1, 2, 3];
>     let mut b = vec![4, 5, 6];
>
>     std::mem::swap(&mut a, &mut b);
>
>     println!("{:?}", a); // [4, 5, 6]
>     println!("{:?}", b); // [1, 2, 3]
> }
> ```
>
> `mem::swap` takes two `&mut T` and exchanges their pointed-to values in place — no temporary variable, no cloning, no allocation.

---

### Exercise 2: Swapping Values with `std::mem::swap`

**Problem:** Swap two `String` variables `a` and `b` in-place using `std::mem::swap(&mut a, &mut b)` without cloning.

**Expected output:**
> [!check]- Answer
> ```
> a: World, b: Hello
> ```
> ```rust
> use std::mem;
> fn main() {
>     let mut a = String::from("Hello");
>     let mut b = String::from("World");
>     mem::swap(&mut a, &mut b);
>     println!("a: {}, b: {}", a, b);
> }
> ```
>
> **Explanation:** `mem::swap` swaps underlying memory contents directly without heap reallocations or clones.

---

### Exercise 3: Taking Struct Fields with `std::mem::take`

**Problem:** Replace a struct's `Option<String>` field with `None` using `std::mem::take(&mut struct.field)`.

**Expected output:**
> [!check]- Answer
> ```
> Taken: Some("data"), Struct: None
> ```
> ```rust
> use std::mem;
> struct Buffer { data: Option<String> }
> fn main() {
>     let mut buf = Buffer { data: Some("data".into()) };
>     let taken = mem::take(&mut buf.data);
>     println!("Taken: {:?}, Struct: {:?}", taken, buf.data);
> }
> ```
>
> **Explanation:** `mem::take` replaces mutable locations with their `Default::default()` value, moving the original value out.

---

## 6. Related Terms

- [Ownership](../level_03/ownership.md) / [Move Semantics](../level_03/move_semantics.md) — The rules these functions work within, not around.
- [`Drop` Trait](../level_03/drop_trait.md) — What `mem::drop` triggers early, and what the "old" value's destructor still runs on after a `replace`/`take`.
- [`Default` Trait](../level_04/default_trait.md) — Required by `mem::take`'s placeholder value.
- [Memory Leaks & Reference Cycles](../level_11/memory_leaks.md) — `mem::forget` (a `std::mem` sibling) is the deliberate-leak primitive.

---

## 7. Key Takeaways

- `mem::replace(&mut place, new)` swaps in `new`, returning the old value — the general-purpose tool.
- `mem::take(&mut place)` is `replace` with `Default::default()` as the placeholder — the common case when you don't have a specific replacement.
- `mem::swap(&mut a, &mut b)` exchanges two values in place, without a temporary variable.
- `mem::drop(value)` just calls the value's destructor immediately, instead of waiting for scope end — equivalent to a function that takes ownership and does nothing with it.
- None of these allocate; they exist specifically so you never have to `.clone()` just to satisfy the borrow checker.
