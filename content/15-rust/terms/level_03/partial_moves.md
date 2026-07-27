# Partial Moves & Partial Borrows

> **Level 3 — Ownership & Borrowing**
> Moving one field out of a struct while leaving others behind, and borrowing disjoint fields simultaneously.

---

## 1. Prerequisites

- [Move Semantics](../level_03/move_semantics.md) — The whole-value moving rule this concept specializes to individual fields.
- [Ownership](../level_03/ownership.md) — What "partially moved" means for a struct's overall ownership state.
- [Mutable Borrowing (`&mut`)](../level_03/mutable_borrowing.md) — The exclusivity rule that partial borrows specifically relax at the field level.

---

## 2. Term Category

**Borrow-Checker Precision (the field-level exception)**: Both ownership and borrowing rules, taken at their coarsest, would apply to an entire struct as a single unit. Rust's borrow checker is actually more precise than that: it tracks ownership and borrows **per field**, letting you move one field out while leaving the rest of the struct intact, and borrow two different fields mutably at the same time, as long as they're provably disjoint.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

If ownership rules only worked at the whole-struct level, this common pattern would be impossible: `let Config { name, settings } = config; use(name); use(settings);` — destructuring a struct and moving each field out independently. Rust's compiler is smarter than that: it tracks the **initialization state of each field separately**. Moving `config.name` out only invalidates `config.name` specifically — `config.settings` remains fully valid and usable, and the compiler statically tracks that `config` as a whole is now only *partially* initialized (which is why you generally can't use `config` as a complete value again afterward, only its still-valid individual fields). The equivalent applies to borrowing: `&mut config.a` and `&mut config.b` can coexist, because the compiler can see, at the field level, that `a` and `b` are provably non-overlapping memory — unlike calling two methods on `config` as a whole, where the compiler (usually) can't see inside to know the methods only touch disjoint fields.

### (2) Reality Metaphor

Imagine a gift basket with several distinct compartments, each holding a different item.

- **Partial moves**: You can reach in and take out the chocolate (**one field**) without needing to take the entire basket. The basket itself is now missing one item (**partially moved**), but the wine bottle and cheese still sitting in their own compartments (**other fields**) remain completely fine to remove separately, whenever you like.
- **Partial borrows**: Two different people can each simultaneously reach into two *different* compartments of the same basket without getting in each other's way — one person adjusting the wine bottle, another rearranging the cheese — as long as they're clearly reaching into separate, non-overlapping compartments and not, say, both grabbing at the same slot.

### (3) Rust Code Examples

#### Short Snippet (Partial Move via Destructuring)
```rust
struct Config {
    name: String,
    settings: Vec<i32>,
}

fn main() {
    let config = Config { name: "prod".to_string(), settings: vec![1, 2, 3] };

    let Config { name, settings } = config; // Both fields MOVED OUT independently.

    println!("{name}");     // Fine — `name` is a fully valid, owned String.
    println!("{settings:?}"); // Fine — `settings` is a fully valid, owned Vec.
    // println!("{}", config.name); // ERROR: `config` was partially moved from.
}
```

#### Fuller Example (Partial Borrows: Two `&mut` on Disjoint Fields)
```rust
struct Player {
    health: i32,
    inventory: Vec<String>,
}

fn main() {
    let mut player = Player { health: 100, inventory: vec!["sword".to_string()] };

    // Two SEPARATE mutable borrows into DIFFERENT fields, at the same time.
    // The compiler can see `health` and `inventory` are disjoint memory — legal!
    let health_ref: &mut i32 = &mut player.health;
    let inventory_ref: &mut Vec<String> = &mut player.inventory;

    *health_ref -= 10;
    inventory_ref.push("shield".to_string());

    println!("{} {:?}", player.health, player.inventory); // 90 ["sword", "shield"]
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Partial Moves Scoping and Lifecycle Rules

**The mistake:** Assuming Partial Moves instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("partial_moves_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("partial_moves_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Partial Moves State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Partial Moves through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Partial Moves Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Partial Moves instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Why Does This Fail to Compile?

**Problem:** Explain why this fails, given what you now know about partial borrows:
```rust
struct Player { health: i32, inventory: Vec<String> }

impl Player {
    fn take_damage(&mut self) { self.health -= 10; }
}

fn main() {
    let mut player = Player { health: 100, inventory: vec![] };
    let inventory_ref = &mut player.inventory; // Borrow of ONE field.
    player.take_damage();                       // Needs &mut player — the WHOLE struct!
    inventory_ref.push("potion".to_string());
}
```

> [!check]- Answer
> `player.take_damage()` requires `&mut self`, i.e. `&mut player` as a **whole struct**, because from the caller's perspective the compiler cannot see inside `take_damage`'s body to know it only touches `self.health`. Since `inventory_ref` (a live borrow of `player.inventory`, a *part* of `player`) is still in scope, taking `&mut player` as a whole would overlap with it — violating exclusivity. The fix is either to reorder so `inventory_ref` isn't alive across the method call, or to restructure `take_damage` to take `&mut self.health: &mut i32` directly instead of `&mut self`.

---

### Exercise 2: Inspecting Partial Moves with Match Patterns

**Problem:** Demonstrate moving a non-`Copy` field `name` out of `User` while continuing to use remaining `Copy` field `age`.

**Expected output:**
```
Moved name: Alice, Age: 30
```

> [!check]- Answer
> ```rust
> struct User { name: String, age: u32 }
> fn main() {
>     let u = User { name: "Alice".into(), age: 30 };
>     let name = u.name;
>     println!("Moved name: {}, Age: {}", name, u.age);
> }
> ```
>
> **Explanation:** Unmoved `Copy` fields (`age`) remain valid and readable after partial moves of non-`Copy` fields (`name`).

### Exercise 3: Preventing Partial Moves with `ref` Keywords

**Problem:** Use `ref name` in pattern matching `let Person { ref name, age } = p;` to borrow fields without partial moves.

**Expected output:**
```
Borrowed name: Bob, Person still valid: Bob
```

> [!check]- Answer
> struct Person { name: String, age: u32 }
> fn main() {
>     let p = Person { name: "Bob".into(), age: 25 };
>     let Person { ref name, age } = p;
>     println!("Borrowed name: {}, Person still valid: {}", name, p.name);
> }
> ```
>
> **Explanation:** Matching with `ref name` borrows `&String` instead of moving the field.

---

## 6. Related Terms

- [Move Semantics](../level_03/move_semantics.md) / [Ownership](../level_03/ownership.md) — The whole-value rules that partial moves specialize down to the field level.
- [Mutable Borrowing (`&mut`)](../level_03/mutable_borrowing.md) — The exclusivity rule partial borrows relax specifically for provably-disjoint fields.
- [`std::mem` Utilities](../level_03/std_mem_utilities.md) — A common tool for working around cases where partial-borrow analysis can't see through a method call boundary.
- [Pattern Matching](../level_02/pattern_matching.md) — The destructuring syntax (`let Struct { a, b } = value;`) that commonly triggers partial moves.

---

## 7. Key Takeaways

- Rust's ownership and borrow tracking operates at the **field level**, not just the whole-struct level.
- A "partial move" leaves a struct's individual fields independently valid or invalid — you can still use fields that weren't moved out, but not the struct as a single complete value.
- "Partial borrows" let you hold simultaneous mutable borrows of different, disjoint fields of the same struct.
- This field-level analysis only works for **direct field access** in the current scope — it cannot see through an opaque method call to know which fields that method actually touches.
