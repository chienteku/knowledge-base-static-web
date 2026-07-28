# `pub` Visibility

> **Level 7 — Modules, Visibility & Project Structure**
> Makes items public; items are private by default.

---

## 1. Prerequisites

- [`mod` Declaration](../level_07/mod_declaration.md) — The boundaries that `pub` actually allows you to cross.
- [Functions (`fn`)](../level_01/fn.md) — The most common items you will make public.
- [Structs (`struct`)](../level_02/struct.md) — The data structures with tricky field-level privacy rules.

---

## 2. Term Category

**Rust-specific (the privacy shield)**: In Rust, absolute privacy is the default. Every function, struct, field, and module you create is strictly hidden from the outside world unless you explicitly place the **`pub`** keyword in front of it.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In some languages (like Python), everything is public by default. If you write an internal helper function, you just have to add an underscore (`_helper_function()`) and hope no other developer decides to use it. 

The Rust designers believed that exposing internal logic is incredibly dangerous. If someone else relies on your internal helper function, you can never change or delete that function without breaking their code! 

Therefore, Rust makes everything completely private. You are forced to look at every single function and explicitly decide: *"Is this part of my official public API?"* If it is, you mark it with `pub`. This guarantees you never accidentally expose fragile internal logic.

### (2) Reality Metaphor

Imagine a Restaurant. 

The dining room is **`pub`**. Customers are allowed to sit there, look at the menu, and order food. 

The kitchen is **private**. Customers are strictly forbidden from walking into the kitchen and touching the stoves. If the restaurant owner decides to upgrade from gas stoves to electric stoves (refactoring internal logic), the customers don't care, because they never had access to the kitchen anyway. 

If the kitchen stoves were `pub`, changing them would break the customers' workflow! By keeping internal things private, you give yourself the freedom to upgrade your code later without breaking anyone else's code.

### (3) Rust Code Examples

#### Short Snippet (Function Privacy)
Functions inside a module cannot be seen from the outside unless they have the `pub` keyword.

```rust
mod restaurant {
    // This is public! Anyone can call this.
    pub fn order_food() {
        cook_steak(); // It can call private functions inside its own module!
    }

    // This is private! Only functions inside `restaurant` can call this.
    fn cook_steak() {
        println!("Sizzle...");
    }
}

fn main() {
    // SUCCESS! We are allowed to order food.
    restaurant::order_food();

    // ERROR! "function `cook_steak` is private"
    // restaurant::cook_steak(); 
}
```

#### Fuller Example (Struct Field Privacy)
Structs have a very strict privacy rule. Even if you make the struct itself `pub`, all of its fields remain strictly private! You must make the fields `pub` individually.

```rust
mod banking {
    // The struct is public, so people can use the `BankAccount` type.
    pub struct BankAccount {
        // The name is public, anyone can read or change it.
        pub owner_name: String,
        
        // The balance is PRIVATE. No one outside the `banking` module 
        // is allowed to look at or change this number!
        balance: i32, 
    }

    impl BankAccount {
        // We provide a public method to let people *read* the balance safely.
        pub fn get_balance(&self) -> i32 {
            self.balance
        }
    }
}

fn main() {
    // We cannot create a BankAccount directly here because `balance` is private!
    // The compiler strictly forbids us from bypassing the privacy rules.
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Pub Visibility Scoping and Lifecycle Rules

**The mistake:** Assuming Pub Visibility instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("pub_visibility_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("pub_visibility_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Pub Visibility State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Pub Visibility through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Pub Visibility Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Pub Visibility instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: The Secret Age

**Problem:** The following code fails to compile with the error: `field 'age' of struct 'Employee' is private`. Fix the code by adding a single word to the struct definition.

```rust
mod hr_department {
    pub struct Employee {
        pub name: String,
        age: u8, // TODO: Fix this line!
    }
}

fn main() {
    let emp = hr_department::Employee {
        name: String::from("Alice"),
        age: 30, // ERROR! We are not allowed to set this!
    };
    
    println!("{} is {} years old.", emp.name, emp.age);
}
```

> [!check]- Answer
> ```rust
> mod hr_department {
>     pub struct Employee {
>         pub name: String,
>         pub age: u8, // Adding `pub` makes the field accessible!
>     }
> }
> ```

---

### Exercise 2: Selective Field Visibility in Structs

**Problem:** Define `pub struct User { pub name: String, age: u32 }` where `age` remains private.

**Expected output:**
> [!check]- Answer
> ```
> Name: Alice
> ```
> ```rust
> pub struct User {
>     pub name: String,
>     age: u32,
> }
> impl User {
>     pub fn new(name: String, age: u32) -> Self { Self { name, age } }
> }
> fn main() {
>     let u = User::new("Alice".into(), 30);
>     println!("Name: {}", u.name);
> }
> ```
>
> **Explanation:** Struct fields can have granular visibility independent of container struct visibility.

---

### Exercise 3: Restricting Visibility to Ancestors with `pub(in path)`

**Problem:** Use `pub(in crate::outer)` to restrict a function's visibility to an ancestor module.

**Expected output:**
> [!check]- Answer
> ```
> Restricted ancestor function called
> ```
> mod outer {
>     pub mod inner {
>         pub(in crate::outer) fn secret() { println!("Restricted ancestor function called"); }
>     }
>     pub fn call() { inner::secret(); }
> }
> fn main() { outer::call(); }
> ```
>
> **Explanation:** `pub(in path)` restricts visibility to designated ancestor module paths.

---

---

## 6. Related Terms

- [`mod` Declaration](../level_07/mod_declaration.md) — The boundaries that `pub` actually allows you to cross.
- [`pub(crate)` / `pub(super)`](../level_07/pub_crate_super.md) — Advanced, fine-grained versions of `pub` that allow you to restrict visibility to specific areas instead of making things completely public.

---

## 7. Key Takeaways

- In Rust, everything (functions, structs, traits, modules) is **strictly private by default**.
- Add the **`pub`** keyword to expose an item to parent modules or external users.
- Making a struct `pub` does **not** make its fields `pub`. Fields must be explicitly marked `pub` individually.
- Making an enum `pub` **does** make all of its variants `pub` automatically.
