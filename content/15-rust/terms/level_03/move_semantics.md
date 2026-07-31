# Move Semantics

> **Level 3 — Ownership & Borrowing**
> Assigning or passing a value transfers ownership; the original binding becomes invalid.

---

## 1. Prerequisites

- [Ownership](../level_03/ownership.md) — Move semantics are the direct consequence of the rule: "There can only be one owner at a time."
- [String vs &str](../level_01/string_vs_&str.md) — `String` data lives on the Heap, making it the perfect example of a type that gets "moved".

---

## 2. Term Category

**Rust-specific (the default behavior)**: When you assign a variable to another (`y = x`), most languages perform either a "Shallow Copy" or a "Deep Copy". Rust rejects both of these and performs a "Move" instead.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

What should happen when you write the following code?
```rust
let a = String::from("Hello");
let b = a; 
```

1. **The Python/Java approach (Shallow Copy)**: `a` and `b` both point to the exact same `"Hello"` on the Heap. This is fast, but dangerous. If you modify `b`, `a` magically changes too, causing invisible bugs. Furthermore, when `a` and `b` go out of scope, the computer will try to clean up `"Hello"` twice (a "Double Free" error), which crashes the program.
2. **The C++ approach (Deep Copy)**: The computer creates a brand new, second `"Hello"` on the Heap for `b`. This is safe, but incredibly slow. If `"Hello"` was a 10-Gigabyte text file, you just accidentally copied 10 GB of data with an innocent `=` sign!

Rust's Ownership rules say: *There can only be one owner at a time.* 

Therefore, Rust does a **Move**. It copies the pointer to the Heap (fast), but then it *immediately invalidates the original variable `a`* (safe). It guarantees blazing speed without the risk of double-free crashes or accidental mutations.

### (2) Reality Metaphor

Imagine holding the physical deed to a house. 

- **In Java**, if you assign the deed to your friend (`friend = you`), the government prints a second deed. You both own the house. If you paint the living room red, your friend walks in and is shocked to find their house is red.
- **In C++**, the government brings in bulldozers and builds an identical clone of the house next door for your friend. This is very expensive and takes a long time.
- **In Rust**, you physically hand the single deed to your friend. Your friend is the new owner. If you try to walk into the house afterward, the compiler arrests you for trespassing. You **moved** the ownership.

### (3) Rust Code Examples

#### Short Snippet (Variable Assignment)
```rust
fn main() {
    let s1 = String::from("Batman");
    
    // Ownership is MOVED from s1 to s2.
    let s2 = s1; 
    
    // s1 is now considered an "uninitialized" variable. 
    // It is completely dead.
    // println!("{}", s1); // COMPILER ERROR: "borrow of moved value: `s1`"
    
    println!("The new owner is {}", s2);
}
```

#### Fuller Example (Function Arguments)
Passing a variable to a function works *exactly the same way* as assigning it to a new variable with `=`.

```rust
fn take_ownership(received_string: String) {
    println!("I now own: {}", received_string);
} // `received_string` goes out of scope here and is dropped!

fn main() {
    let my_message = String::from("Secret Data");
    
    // Passing the variable into the function MOVES ownership to `received_string`.
    take_ownership(my_message);
    
    // `my_message` no longer owns the data. It is dead.
    // println!("{}", my_message); // ERROR: "borrow of moved value"
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Move Semantics Scoping and Lifecycle Rules

**The mistake:** Assuming Move Semantics instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("move_semantics_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("move_semantics_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Move Semantics State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Move Semantics through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Move Semantics Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Move Semantics instances across OS threads via `std::thread::spawn`.

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

---

## 5. Practice Exercises

### Exercise 1: High-Performance Zero-Copy Event Pipeline (Sequential Ownership Transfer)

**Problem:** In real-time event streaming systems and network packet processors, copying payload buffers between processing stages creates severe memory allocation and cache thrashing overhead. By leveraging Rust's move semantics, pipeline stages can transfer ownership of packet buffers sequentially zero-copy.

Implement a multi-stage event processing pipeline (`IngestStage` -> `TransformStage` -> `DispatchStage`):
1. Define a `Header` struct (`stream_id: u32`, `checksum: u8`) and a `PacketBuffer` struct (`header: Header`, `payload: Vec<u8>`).
2. Implement `IngestStage::new(stream_id: u32)` and `IngestStage::process(self, raw_data: Vec<u8>) -> TransformStage`. The `process` method must consume `IngestStage` by value, calculate an initial wrapping sum checksum of `raw_data`, wrap it in a `PacketBuffer`, and return `TransformStage`.
3. Implement `TransformStage::apply_transformation(mut self, xor_key: u8) -> DispatchStage`. The method must consume `TransformStage` by value, mutate `payload` in-place by XORing each byte with `xor_key`, update `header.checksum`, and move the buffer into `DispatchStage`.
4. Implement `DispatchStage::finalize(self) -> (Header, Vec<u8>)`. The method must consume `DispatchStage` by value and return the final header and payload without cloning or reallocating heap memory.

Write unit tests confirming that ownership transfers through all stages, payload memory addresses (`as_ptr()`) remain identical across stages, and transformed data matches expected values.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq)]
> pub struct Header {
>     pub stream_id: u32,
>     pub checksum: u8,
> }
> 
> #[derive(Debug)]
> pub struct PacketBuffer {
>     pub header: Header,
>     pub payload: Vec<u8>,
> }
> 
> pub struct IngestStage {
>     stream_id: u32,
> }
> 
> pub struct TransformStage {
>     packet: PacketBuffer,
> }
> 
> pub struct DispatchStage {
>     packet: PacketBuffer,
> }
> 
> impl IngestStage {
>     pub fn new(stream_id: u32) -> Self {
>         Self { stream_id }
>     }
> 
>     pub fn process(self, raw_data: Vec<u8>) -> TransformStage {
>         let initial_checksum = raw_data.iter().fold(0u8, |acc, &x| acc.wrapping_add(x));
>         let packet = PacketBuffer {
>             header: Header {
>                 stream_id: self.stream_id,
>                 checksum: initial_checksum,
>             },
>             payload: raw_data,
>         };
>         TransformStage { packet }
>     }
> }
> 
> impl TransformStage {
>     pub fn apply_transformation(mut self, xor_key: u8) -> DispatchStage {
>         for byte in self.packet.payload.iter_mut() {
>             *byte ^= xor_key;
>         }
>         self.packet.header.checksum = self
>             .packet
>             .payload
>             .iter()
>             .fold(0u8, |acc, &x| acc.wrapping_add(x));
>         DispatchStage { packet: self.packet }
>     }
> }
> 
> impl DispatchStage {
>     pub fn finalize(self) -> (Header, Vec<u8>) {
>         (self.packet.header, self.packet.payload)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_zero_copy_pipeline_ownership_transfer() {
>         let raw_bytes = vec![0x10, 0x20, 0x30, 0x40];
>         let initial_ptr = raw_bytes.as_ptr();
> 
>         let stage1 = IngestStage::new(101);
>         let stage2 = stage1.process(raw_bytes);
>         let stage3 = stage2.apply_transformation(0xFF);
>         let (header, final_bytes) = stage3.finalize();
> 
>         // 1. Verify stream metadata and byte transformation
>         assert_eq!(header.stream_id, 101);
>         assert_eq!(final_bytes, vec![0xEF, 0xDF, 0xCF, 0xBF]);
> 
>         // 2. Verify zero-copy: heap memory pointer remains identical
>         assert_eq!(final_bytes.as_ptr(), initial_ptr);
> 
>         // 3. Verify checksum mutation assertion
>         assert_ne!(header.checksum, 0);
> 
>         // 4. Pattern matching assertion
>         assert!(matches!(header, Header { stream_id: 101, .. }));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Ownership Transfer & Zero-Copy Invariants**: In Rust, passing `raw_data: Vec<u8>` into `IngestStage::process(self, ...)` transfers ownership of the 24-byte stack descriptor (pointer, length, capacity) by value. The underlying heap allocation containing `[0x10, 0x20, 0x30, 0x40]` is never reallocated or copied, as proven by `assert_eq!(final_bytes.as_ptr(), initial_ptr)`.
> 2. **Affine Type System & Invalidation**: By defining methods that accept `self` by value (e.g. `process(self, ...)` and `finalize(self)`), Rust's move semantics consume the caller's binding. Once `stage1.process(...)` completes, `stage1` becomes an uninitialized binding; attempting to reuse `stage1` or `stage2` results in compile error `E0382` ("use of moved value").
> 3. **Memory Layout & Performance**: Moving a `PacketBuffer` between `TransformStage` and `DispatchStage` involves a simple bitwise copy (shallow copy) of the stack metadata (32 bytes total: 4-byte `stream_id`, 1-byte `checksum`, padding, and 24-byte `Vec` header). Rust automatically optimizes out stack copies via scalar replacement of aggregates (SRoA) and inline register passing.
> 4. **Resource Management**: When `DispatchStage::finalize(self)` unpacks `self.packet`, ownership of `Header` and `Vec<u8>` is returned directly to the caller, preventing the `DispatchStage` destructor from dropping the underlying heap payload.

---

### Exercise 2: Compile-Time Safe Type-State Machine for Database Transactions (Affine Types)

**Problem:** In database client drivers and financial engines, performing operations on uncommitted, committed, or rolled-back transactions out of order can lead to severe runtime errors. By using Rust move semantics with the Type-State pattern, transition methods consume `self` by value, ensuring that previous transaction handles are invalidated at compile time.

Implement a database transaction manager:
1. Define zero-sized phantom state types: `Uninitialized`, `Active`, `Committed`, and `RolledBack`.
2. Define a generic structure `Transaction<State>` containing `tx_id: u64`, `db_name: String`, `log: Vec<String>`, and `_state: std::marker::PhantomData<State>`.
3. Implement `Transaction<Uninitialized>::new(tx_id: u64, db_name: impl Into<String>) -> Self` and `begin(self) -> Transaction<Active>`.
4. Implement `Transaction<Active>::record_operation(&mut self, op: impl Into<String>)`, `commit(mut self) -> Transaction<Committed>`, and `rollback(mut self) -> Transaction<RolledBack>`.
5. Implement accessor methods `get_audit_log(&self) -> &[String]` and `tx_id(&self) -> u64` for `Committed` and `RolledBack` states.

Write unit tests verifying state transitions, log recording, and pattern matching on committed/rolled-back states.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::marker::PhantomData;
> 
> pub struct Uninitialized;
> pub struct Active;
> pub struct Committed;
> pub struct RolledBack;
> 
> pub struct Transaction<State> {
>     tx_id: u64,
>     db_name: String,
>     log: Vec<String>,
>     _state: PhantomData<State>,
> }
> 
> impl Transaction<Uninitialized> {
>     pub fn new(tx_id: u64, db_name: impl Into<String>) -> Self {
>         Self {
>             tx_id,
>             db_name: db_name.into(),
>             log: Vec::new(),
>             _state: PhantomData,
>         }
>     }
> 
>     pub fn begin(self) -> Transaction<Active> {
>         let mut log = self.log;
>         log.push(format!("TX {} initialized on database '{}'", self.tx_id, self.db_name));
>         Transaction {
>             tx_id: self.tx_id,
>             db_name: self.db_name,
>             log,
>             _state: PhantomData,
>         }
>     }
> }
> 
> impl Transaction<Active> {
>     pub fn record_operation(&mut self, op: impl Into<String>) {
>         self.log.push(op.into());
>     }
> 
>     pub fn commit(mut self) -> Transaction<Committed> {
>         self.log.push(format!("TX {} committed successfully", self.tx_id));
>         Transaction {
>             tx_id: self.tx_id,
>             db_name: self.db_name,
>             log: self.log,
>             _state: PhantomData,
>         }
>     }
> 
>     pub fn rollback(mut self) -> Transaction<RolledBack> {
>         self.log.push(format!("TX {} rolled back", self.tx_id));
>         Transaction {
>             tx_id: self.tx_id,
>             db_name: self.db_name,
>             log: self.log,
>             _state: PhantomData,
>         }
>     }
> }
> 
> impl Transaction<Committed> {
>     pub fn get_audit_log(&self) -> &[String] {
>         &self.log
>     }
> 
>     pub fn tx_id(&self) -> u64 {
>         self.tx_id
>     }
> }
> 
> impl Transaction<RolledBack> {
>     pub fn get_audit_log(&self) -> &[String] {
>         &self.log
>     }
> 
>     pub fn tx_id(&self) -> u64 {
>         self.tx_id
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_transaction_commit_lifecycle() {
>         let uninit = Transaction::<Uninitialized>::new(1001, "prod_db");
>         let mut active = uninit.begin();
> 
>         active.record_operation("INSERT INTO users VALUES (1, 'Alice')");
>         active.record_operation("UPDATE balances SET amount = 500 WHERE user_id = 1");
> 
>         let committed = active.commit();
> 
>         assert_eq!(committed.tx_id(), 1001);
>         assert_eq!(committed.get_audit_log().len(), 3);
>         assert!(committed.get_audit_log()[1].contains("INSERT INTO users"));
>         assert!(matches!(committed, Transaction { tx_id: 1001, .. }));
>     }
> 
>     #[test]
>     fn test_transaction_rollback_lifecycle() {
>         let uninit = Transaction::<Uninitialized>::new(1002, "staging_db");
>         let mut active = uninit.begin();
> 
>         active.record_operation("DELETE FROM temp_logs");
>         let rolled_back = active.rollback();
> 
>         assert_eq!(rolled_back.tx_id(), 1002);
>         assert_ne!(rolled_back.get_audit_log().len(), 0);
>         assert!(rolled_back.get_audit_log().last().unwrap().contains("rolled back"));
>         assert!(matches!(rolled_back, Transaction { tx_id: 1002, .. }));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Compile-Time Invariant Enforcement**: The Type-State pattern combined with move semantics enforces valid state transitions statically. Because `commit(mut self)` consumes `self` by value, the `active` binding is invalidated upon invocation. Calling `active.record_operation(...)` or `active.commit()` a second time generates compile error `E0382`.
> 2. **Zero-Cost Phantom Data**: `PhantomData<State>` carries zero runtime memory overhead (0 bytes) and zero CPU performance cost. It informs the compiler's type checker about the logical ownership of the generic marker type `State` without affecting memory layout.
> 3. **Ownership Reuse & Memory Efficiency**: In `commit(mut self)` and `rollback(mut self)`, fields like `log: Vec<String>` and `db_name: String` are moved directly from the old `Transaction<Active>` struct into the new `Transaction<Committed>` struct. No dynamic memory allocations or string duplications take place during state transitions.
> 4. **Drop Semantics & Clean Destruction**: When `committed` or `rolled_back` eventually leaves scope, Rust runs the destructor for `Transaction<State>`, safely deallocating `db_name` and all log entries in `Vec<String>`.

---

### Exercise 3: Zero-Cost Buffer Recycling & Selective Partial Moves (`std::mem::replace` & `Option::take`)

**Problem:** In custom network buffer pools and ring buffers, extracting heap-allocated payload buffers from wrapper structs via mutable references `&mut Self` is prohibited because Rust forbids partial moves out of borrowed references (compile error `E0507`). Using `Option::take()` and `std::mem::replace`, developers can extract or swap heavy inner heap vectors in $O(1)$ constant time without cloning or reallocating.

Implement a buffer slot recycling system:
1. Define a `BufferSlot` struct containing `id: u64`, `payload: Option<Vec<u8>>`, and `metadata: String`.
2. Implement `BufferSlot::new(id: u64, payload: Vec<u8>, metadata: impl Into<String>) -> Self`.
3. Implement `BufferSlot::extract_payload(&mut self) -> Vec<u8>`: Extract `self.payload` via `Option::take()`, replacing it with `None` while maintaining struct validity.
4. Implement `BufferSlot::swap_payload(&mut self, new_payload: Vec<u8>) -> Vec<u8>`: Replace `self.payload` in-place using `Option::replace` / `std::mem::replace`, returning the old payload (or empty `Vec` if empty).
5. Implement a `BufferPool` struct containing `pool: Vec<Vec<u8>>` with methods `new()`, `recycle_slot(&mut self, mut slot: BufferSlot)`, and `pool_size(&self) -> usize`.

Write unit tests verifying pointer preservation (`as_ptr()`), partial moves with `Option::take()`, in-place swaps, and buffer pool recycling.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::mem;
> 
> #[derive(Debug)]
> pub struct BufferSlot {
>     pub id: u64,
>     pub payload: Option<Vec<u8>>,
>     pub metadata: String,
> }
> 
> impl BufferSlot {
>     pub fn new(id: u64, payload: Vec<u8>, metadata: impl Into<String>) -> Self {
>         Self {
>             id,
>             payload: Some(payload),
>             metadata: metadata.into(),
>         }
>     }
> 
>     pub fn extract_payload(&mut self) -> Vec<u8> {
>         self.payload.take().unwrap_or_default()
>     }
> 
>     pub fn swap_payload(&mut self, new_payload: Vec<u8>) -> Vec<u8> {
>         let old = self.payload.replace(new_payload);
>         old.unwrap_or_default()
>     }
> }
> 
> pub struct BufferPool {
>     pool: Vec<Vec<u8>>,
> }
> 
> impl BufferPool {
>     pub fn new() -> Self {
>         Self { pool: Vec::new() }
>     }
> 
>     pub fn recycle_slot(&mut self, mut slot: BufferSlot) {
>         if let Some(buf) = slot.payload.take() {
>             self.pool.push(buf);
>         }
>     }
> 
>     pub fn pool_size(&self) -> usize {
>         self.pool.len()
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_selective_partial_move_and_take() {
>         let data = vec![1, 2, 3, 4, 5];
>         let initial_ptr = data.as_ptr();
>         let mut slot = BufferSlot::new(42, data, "session_token_alpha");
> 
>         // 1. Assert initial state
>         assert!(slot.payload.is_some());
> 
>         // 2. Perform partial move via Option::take()
>         let extracted = slot.extract_payload();
>         assert_eq!(extracted.as_ptr(), initial_ptr);
>         assert_eq!(extracted, vec![1, 2, 3, 4, 5]);
>         assert!(slot.payload.is_none());
> 
>         // 3. Swap payload in-place using Option::replace
>         let new_data = vec![10, 20, 30];
>         let new_ptr = new_data.as_ptr();
>         let previous = slot.swap_payload(new_data);
> 
>         assert!(previous.is_empty());
>         assert!(slot.payload.is_some());
>         assert_eq!(slot.payload.as_ref().unwrap().as_ptr(), new_ptr);
>         assert!(matches!(slot, BufferSlot { id: 42, .. }));
>     }
> 
>     #[test]
>     fn test_buffer_pool_recycling() {
>         let mut pool = BufferPool::new();
>         let slot = BufferSlot::new(99, vec![0xFF; 64], "pool_item");
> 
>         pool.recycle_slot(slot);
>         assert_eq!(pool.pool_size(), 1);
>         assert_ne!(pool.pool_size(), 0);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Partial Move Restriction on Borrowed References**: In Rust, moving a field out of a struct behind a mutable reference `&mut BufferSlot` (e.g. `let p = self.payload;`) is rejected by the compiler (`E0507: cannot move out of dereference of &mut pointer`). Rust requires that every borrowed target remains in a fully valid, initialized state at all times.
> 2. **`Option::take()` & `std::mem::replace` Mechanics**: `self.payload.take()` executes `std::mem::replace(&mut self.payload, None)`. In assembly, this atomically writes `None` into `self.payload` while returning the original `Some(Vec<u8>)` by value. This satisfies Rust's memory safety invariant without needing expensive heap cloning or buffer duplication.
> 3. **Null Pointer Optimization (NPO)**: Because `Vec<u8>` contains a non-null pointer descriptor, Rust optimizes `Option<Vec<u8>>` memory representation using Null Pointer Optimization. `None` is represented internally as a zero (null pointer) descriptor, making `Option<Vec<u8>>` occupy the exact same 24 bytes on the stack as `Vec<u8>` alone.
> 4. **Edge Cases & Invariants**: Calling `extract_payload()` on a slot whose payload has already been extracted returns `Vec::new()` (an empty vector that performs 0 heap allocations). In `recycle_slot`, partial move via `take()` extracts the payload for recycling without destroying the parent `BufferSlot`'s metadata.

---

## 6. Related Terms

- [`Clone` Trait](../level_03/clone_trait.md) — The explicit way to bypass a Move and perform a deep copy of the data.
- [`Copy` Trait](../level_03/copy_trait.md) — The reason why simple types like `i32` or `bool` do not get moved (they are copied automatically).
- [Borrowing (`&`)](../level_03/borrowing.md) — The idiomatic way to let a function read your data without moving ownership.

---

## 7. Key Takeaways

- When you assign a heap-allocated variable to another (`let y = x;`), Rust **moves** the data.
- The original variable `x` is immediately invalidated and can never be used again.
- Passing a variable into a function (`do_thing(x)`) also counts as a Move.
- This prevents double-free errors and accidental mutations without the performance cost of deep copying.
- If you see `borrow of moved value`, it means you tried to use a variable after you already gave it away!
