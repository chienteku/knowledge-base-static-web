# `pub` Visibility

> **Level 7 — Modules, Visibility & Project Structure**
> Makes items public; items are private by default.

---

## 1. Prerequisites


- [`mod` Declaration](mod_declaration.md) — The boundaries that `pub` actually allows you to cross.
- [`fn` (Functions)](../level_01/fn.md) — The most common items you will make public.
- [Struct](../level_02/struct.md) — The data structures with tricky field-level privacy rules.

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

### Mistake 1: Assuming Struct Fields Become Public Automatically when Declaring `pub struct`

**The mistake:** Marking a struct public via `pub struct User { name: String }` and expecting callers outside the module to access `user.name`.

**Why it is wrong:** In Rust, declaring `pub struct User` makes the type name public, but all struct fields remain **private by default**. Callers outside the module cannot access or initialize `name` unless the field is explicitly marked `pub name: String`.

*Incorrect:*
```rust
pub struct User {
    name: String, // ❌ Field is private! Cannot be accessed outside this module!
}
```

*Fix:*
```rust
pub struct User {
    pub name: String, // Explicitly marked public!
}
```

### Mistake 2: Assuming Enum Variants Require Individual `pub` Annotations

**The mistake:** Trying to write `pub enum Status { pub Active, pub Inactive }`.

**Why it is wrong:** Unlike struct fields, making an `enum` public automatically makes **all** of its variants and variant fields public. Writing `pub` on individual enum variants is invalid syntax.

*Incorrect:*
```rust
pub enum Status {
    pub Active, // ❌ Syntax error! Enum variants inherit public visibility automatically
}
```

*Fix:*
```rust
pub enum Status {
    Active, // Correct!
}
```

### Mistake 3: Forgetting Public Parent Module Declarations for Public Child Items

**The mistake:** Declaring `pub fn helper()` inside `mod foo`, but declaring `mod foo;` (without `pub`) in `lib.rs`.

**Why it is wrong:** Even if an item is `pub`, it cannot be accessed from outside the parent module if the parent module itself is private. The module must be `pub mod foo;` to be reachable by external callers.

---

## 5. Practice Exercises

### Exercise 1: The Secret Age

**Scenario:** The following code fails to compile with the error: `field 'age' of struct 'Employee' is private`. Fix the code by adding a single word to the struct definition.

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
>
> #### Implementation
>
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

**Scenario:** Define `pub struct User { pub name: String, age: u32 }` where `age` remains private.

**Expected output:**
> [!check]- Answer
> ```
> Name: Alice
> ```
>
> #### Implementation
>
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
> #### Technical Explanation
> Struct fields can have granular visibility independent of container struct visibility.

---

### Exercise 3: Restricting Visibility to Ancestors with `pub(in path)`

**Scenario:** Use `pub(in crate::outer)` to restrict a function's visibility to an ancestor module.

**Expected output:**
> [!check]- Answer
> ```
> Restricted ancestor function called
> ```
>
> #### Implementation
>
> ```rust
> mod outer {
>     pub mod inner {
>         pub(in crate::outer) fn secret() { println!("Restricted ancestor function called"); }
>     }
>     pub fn call() { inner::secret(); }
> }
> fn main() { outer::call(); }
> ```
>
> #### Technical Explanation
> `pub(in path)` restricts visibility to designated ancestor module paths.

---

## 6. Related Terms


- [`mod` Declaration](mod_declaration.md) — The boundaries that `pub` actually allows you to cross.
- [`pub(crate)` / `pub(super)`](pub_crate_super.md) — Advanced, fine-grained versions of `pub` that allow you to restrict visibility to specific areas instead of making things completely public.
- [Crate](../level_01/crate.md) — Related concept: Crate.
- [Re-exporting (`pub use`)](re_exporting.md) — Related concept: Re-exporting (`pub use`).
- [`cargo doc`](../level_08/cargo_doc.md) — Related concept: `cargo doc`.

---

## 7. Key Takeaways

- In Rust, everything (functions, structs, traits, modules) is **strictly private by default**.
- Add the **`pub`** keyword to expose an item to parent modules or external users.
- Making a struct `pub` does **not** make its fields `pub`. Fields must be explicitly marked `pub` individually.
- Making an enum `pub` **does** make all of its variants `pub` automatically.
