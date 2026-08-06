# `IntoIterator`

> **Level 6 — Closures & Functional Patterns**
> Trait that allows a type to be used in `for` loops.

---

## 1. Prerequisites


- [Iterator](../level_02/iterator.md) — The trait that actually does the stepping (`.next()`).
- [`for` / Range](../level_02/for_range.md) — The loop syntax that completely relies on `IntoIterator` to function.
- [Trait](../level_04/trait.md) — The system that defines this shared behavior.

---

## 2. Term Category

**Rust-specific (loop conversion trait)**: `std::iter::IntoIterator` is the foundational conversion trait in Rust that enables types to be consumed by `for` loops. Collections like `Vec<T>` or `HashMap<K, V>` are not iterators themselves; instead, they implement `IntoIterator` to yield an iterator instance when `.into_iter()` is called or when passed to `for item in collection`.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Writing `for item in collection.into_iter()` or `for item in collection.iter()` explicitly every time you loop over data would create repetitive boilerplate code.

Rust's `IntoIterator` trait solves this by providing **syntactic desugaring for `for` loops**:

```rust
// 1. What you write:
for item in collection { ... }

// 2. What rustc expands it to:
let mut iter = IntoIterator::into_iter(collection);
while let Some(item) = iter.next() { ... }
```

### (2) The Three Variations of `IntoIterator`

Standard collections implement `IntoIterator` across three distinct value/borrow contexts:

1. **`impl<T> IntoIterator for Vec<T>`**: Consumes collection ownership and yields owned `Item = T`.
2. **`impl<'a, T> IntoIterator for &'a Vec<T>`**: Borrows collection immutably and yields `Item = &'a T`.
3. **`impl<'a, T> IntoIterator for &'a mut Vec<T>`**: Borrows collection mutably and yields `Item = &'a mut T`.

### (3) Reality Metaphor

- **`Iterator`**: An automated ticket dispenser that dispenses one paper ticket at a time when you pull the lever (`.next()`).
- **`Vec` (Collection)**: A sealed box containing 50 rolls of tickets. The box cannot dispense individual tickets on its own.
- **`IntoIterator`**: An automated unboxing machine (`.into_iter()`) that opens the sealed box and installs the ticket rolls inside the dispenser mechanism so tickets can be pulled one by one.

### (4) Rust Code Examples

#### 3-Way Iteration (`T`, `&T`, `&mut T`)
```rust
fn main() {
    let mut numbers = vec![10, 20, 30];

    // 1. Borrow immutably via &'a Vec<T>
    for num in &numbers {
        println!("Shared borrow: {num}");
    }

    // 2. Borrow mutably via &'a mut Vec<T>
    for num in &mut numbers {
        *num += 5;
    }

    // 3. Consume ownership via Vec<T>
    for num in numbers {
        println!("Owned value consumed: {num}");
    }
    // numbers is now moved and destroyed!
}
```

#### Implementing `IntoIterator` for a Custom Collection
```rust
struct UserDirectory {
    users: Vec<String>,
}

impl IntoIterator for UserDirectory {
    type Item = String;
    type IntoIter = std::vec::IntoIter<String>;

    fn into_iter(self) -> Self::IntoIter {
        self.users.into_iter()
    }
}

fn main() {
    let dir = UserDirectory { users: vec!["Alice".into(), "Bob".into()] };
    for user in dir { // Automatically calls UserDirectory::into_iter(dir)!
        println!("User: {user}");
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Unintentionally Consuming Collection Ownership in a `for` Loop

**The mistake:** Writing `for item in collection` when intending to inspect elements without destroying the collection.

**Why it is wrong:** `for item in collection` calls `IntoIterator::into_iter(collection)` on the owned value, moving collection ownership into the loop. Attempting to access `collection` afterward triggers compiler error `E0382`.

*Incorrect:*
```rust
let data = vec![1, 2, 3];
for x in data { println!("{x}"); }
// println!("Len: {}", data.len()); // ❌ Error E0382: use of moved value `data`
```

*Fix:*
```rust
let data = vec![1, 2, 3];
for x in &data { println!("{x}"); } // Borrow with &data!
println!("Len: {}", data.len()); // Correct!
```

### Mistake 2: Implementing `IntoIterator` for Owned Type but Forgetting Reference Implementations

**The mistake:** Implementing `IntoIterator for MyStruct` without implementing `IntoIterator for &'a MyStruct` or `&'a mut MyStruct`.

**Why it is wrong:** Users writing `for item in &my_struct` will receive compile error `E0277` because reference borrowing is not automatically generated for custom types.

### Mistake 3: Confusing `Iterator` and `IntoIterator` in Generic Trait Bounds

**The mistake:** Specifying `T: Iterator` when accepting collections in generic functions.

**Why it is wrong:** `Vec<T>` implements `IntoIterator`, not `Iterator`. Constraining a generic parameter to `T: Iterator` rejects `Vec` or slices.

*Incorrect:*
```rust
fn process<I: Iterator<Item = i32>>(iter: I) { ... } // Rejects Vec<i32>!
```

*Fix:*
```rust
fn process<C: IntoIterator<Item = i32>>(container: C) { ... } // Accepts Vec<i32>!
```

---

## 5. Practice Exercises

### Exercise 1: Custom Inventory Container with 3-Way `IntoIterator`

**Scenario:** Implement a warehouse inventory struct `WarehouseInventory` that implements `IntoIterator` for owned `WarehouseInventory`, shared reference `&WarehouseInventory`, and mutable reference `&mut WarehouseInventory`.

**Requirements:**
1. Define struct `Item { pub name: String, pub count: u32 }`.
2. Define struct `WarehouseInventory { pub items: Vec<Item> }`.
3. Implement `IntoIterator` for `WarehouseInventory`, `&'a WarehouseInventory`, and `&'a mut WarehouseInventory`.
4. Write unit tests demonstrating all three loop forms.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Clone)]
> pub struct Item {
>     pub name: String,
>     pub count: u32,
> }
> 
> pub struct WarehouseInventory {
>     pub items: Vec<Item>,
> }
> 
> // 1. Owned IntoIterator
> impl IntoIterator for WarehouseInventory {
>     type Item = Item;
>     type IntoIter = std::vec::IntoIter<Item>;
> 
>     fn into_iter(self) -> Self::IntoIter {
>         self.items.into_iter()
>     }
> }
> 
> // 2. Shared reference IntoIterator
> impl<'a> IntoIterator for &'a WarehouseInventory {
>     type Item = &'a Item;
>     type IntoIter = std::slice::Iter<'a, Item>;
> 
>     fn into_iter(self) -> Self::IntoIter {
>         self.items.iter()
>     }
> }
> 
> // 3. Mutable reference IntoIterator
> impl<'a> IntoIterator for &'a mut WarehouseInventory {
>     type Item = &'a mut Item;
>     type IntoIter = std::slice::IterMut<'a, Item>;
> 
>     fn into_iter(self) -> Self::IntoIter {
>         self.items.iter_mut()
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_3way_into_iterator() {
>         let mut inv = WarehouseInventory {
>             items: vec![Item { name: "Widget".into(), count: 10 }],
>         };
> 
>         // Shared reference loop
>         for item in &inv {
>             assert_eq!(item.count, 10);
>         }
> 
> 
>         // Mutable reference loop
>         for item in &mut inv {
>             item.count += 5;
>         }
> 
> 
>         // Owned loop
>         let items: Vec<Item> = inv.into_iter().collect();
>         assert_eq!(items[0].count, 15);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Implementing `IntoIterator` for `WarehouseInventory` enables `for x in inv` (owned).
> 2. Implementing `IntoIterator` for `&'a WarehouseInventory` enables `for x in &inv` (immutable borrow).
> 3. Implementing `IntoIterator` for `&'a mut WarehouseInventory` enables `for x in &mut inv` (mutable borrow).
> 
---

### Exercise 2: Zero-Copy Network Packet Slice Iterator

**Scenario:** Implement `IntoIterator` for a raw byte frame slice `&'a PacketBuffer` yielding borrowed header byte slices without copying memory.

**Requirements:**
1. Define `struct PacketBuffer<'a> { pub raw: &'a [u8] }`.
2. Implement `IntoIterator` for `&'a PacketBuffer<'a>` returning byte references.
3. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub struct PacketBuffer<'a> {
>     pub raw: &'a [u8],
> }
> 
> impl<'a> IntoIterator for &'a PacketBuffer<'a> {
>     type Item = &'a u8;
>     type IntoIter = std::slice::Iter<'a, u8>;
> 
>     fn into_iter(self) -> Self::IntoIter {
>         self.raw.iter()
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_packet_buffer_into_iter() {
>         let bytes = [0xDE, 0xAD, 0xBE, 0xEF];
>         let buf = PacketBuffer { raw: &bytes };
>         
>         let mut collected = Vec::new();
>         for &b in &buf {
>             collected.push(b);
>         }
>         assert_eq!(collected, vec![0xDE, 0xAD, 0xBE, 0xEF]);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `&'a PacketBuffer<'a>` forwards `into_iter` to `slice.iter()`.
> 2. Zero-copy iteration over internal byte slice buffers.
> 
---

### Exercise 3: Batch Processor Function with `C: IntoIterator` Bound

**Scenario:** Implement a generic function `fn sum_positive<C>(collection: C) -> i32 where C: IntoIterator<Item = i32>` that accepts any collection convertible to an iterator of integers.

**Requirements:**
1. Generic parameter `C: IntoIterator<Item = i32>`.
2. Sum positive integers.
3. Write unit tests passing `Vec<i32>`, `Option<i32>`, and ranges.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn sum_positive<C>(collection: C) -> i32
> where
>     C: IntoIterator<Item = i32>,
> {
>     collection.into_iter().filter(|&x| x > 0).sum()
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_generic_into_iterator_bound() {
>         // Works on Vec<i32>
>         assert_eq!(sum_positive(vec![-5, 10, 20, -1]), 30);
>         
>         // Works on Ranges!
>         assert_eq!(sum_positive(-2..4), 1 + 2 + 3);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `C: IntoIterator<Item = i32>` enables calling `sum_positive` with `Vec`, array ranges, or custom collections.
> 2. Converts inputs into iterators lazily via `.into_iter()`.
> 
---

## 6. Related Terms


- [Iterator](../level_02/iterator.md) — The trait that `IntoIterator` actually produces.
- [`for` / Range](../level_02/for_range.md) — The loop syntax that relies entirely on `IntoIterator` to function.
- [`VecDeque<T>`](../level_02/vecdeque_t.md) — Related concept: `VecDeque<T>`.

---

## 7. Key Takeaways

- `IntoIterator` is a conversion trait providing `.into_iter(self)`.
- `for x in container` is syntax sugar for `while let Some(x) = IntoIterator::into_iter(container).next()`.
- Collections implement three forms of `IntoIterator`: owned `collection`, shared borrow `&collection`, and mutable borrow `&mut collection`.
- Use `C: IntoIterator<Item = T>` as generic bounds for APIs accepting collections.
