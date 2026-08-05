# `Drop Check` (dropck)

> **Level 3 — Ownership & Borrowing**
> The specific borrow-checker sub-analysis that verifies data is still valid when a destructor (`Drop`) runs.

---

## 1. Prerequisites


- [`Drop` Trait](drop_trait.md) — The destructor mechanism this analysis specifically governs.
- [Borrow Checker](borrow_checker.md) — The broader system dropck is a specialized part of.
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

---

## 5. Practice Exercises

### Exercise 1: Soundness in Custom Smart Pointers — `PhantomData<T>` and Drop Check Rules

**Scenario:** You are implementing a custom arena node smart pointer `ArenaNodeGuard<'a, T>` that manages dynamic heap allocations allocated by an arena. Because raw pointers (`*mut T`) do not carry dropck lifetime information, the compiler cannot automatically determine whether `ArenaNodeGuard` drops or accesses `T` when `ArenaNodeGuard` is dropped. Without proper markers, this can create dropck soundness holes where `T` holds references that expire before `ArenaNodeGuard`'s destructor executes.

**Requirements:**
1. Implement `ArenaNodeGuard<'a, T>` holding a raw pointer `*mut T`, an atomic drop counter reference `&'a AtomicUsize`, and `PhantomData<T>` to instruct dropck that `ArenaNodeGuard` strictly owns and drops `T`.
2. Implement `Drop` for `ArenaNodeGuard<'a, T>`, ensuring `std::ptr::drop_in_place` is invoked on the inner `T` before deallocating memory, followed by incrementing the drop counter.
3. Write unit tests proving that nested destructors execute in exact sequence (inner payload drop before arena guard drop) and verify drop order assertions using `assert_eq!`, `assert!`, `assert_ne!`, and `matches!`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::marker::PhantomData;
> use std::sync::atomic::{AtomicUsize, Ordering};
> 
> /// Custom arena smart pointer holding raw memory and dropck markers.
> pub struct ArenaNodeGuard<'a, T: 'a> {
>     ptr: *mut T,
>     drop_counter: &'a AtomicUsize,
>     _marker: PhantomData<T>, // Signals dropck that ArenaNodeGuard owns & drops T
> }
> 
> impl<'a, T: 'a> ArenaNodeGuard<'a, T> {
>     pub fn new(value: T, drop_counter: &'a AtomicUsize) -> Self {
>         let boxed = Box::new(value);
>         let ptr = Box::into_raw(boxed);
>         Self {
>             ptr,
>             drop_counter,
>             _marker: PhantomData,
>         }
>     }
> 
>     pub fn get(&self) -> &T {
>         // SAFETY: ptr is valid for 'a while ArenaNodeGuard is alive
>         unsafe { &*self.ptr }
>     }
> 
>     pub fn get_mut(&mut self) -> &mut T {
>         // SAFETY: Exclusive borrow guarantees safe unique mutable access
>         unsafe { &mut *self.ptr }
>     }
> }
> 
> impl<'a, T: 'a> Drop for ArenaNodeGuard<'a, T> {
>     fn drop(&mut self) {
>         unsafe {
>             // 1. Drop the inner T first before invalidating pointer address
>             std::ptr::drop_in_place(self.ptr);
>             // 2. Reclaim heap allocation
>             let _ = Box::from_raw(self.ptr);
>         }
>         // 3. Register guard drop completion
>         self.drop_counter.fetch_add(1, Ordering::SeqCst);
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     struct PayloadDropper<'a>(&'a AtomicUsize);
>     impl<'a> Drop for PayloadDropper<'a> {
>         fn drop(&mut self) {
>             self.0.fetch_add(10, Ordering::SeqCst);
>         }
>     }
> 
>     #[test]
>     fn test_arena_guard_dropck_sequence() {
>         let guard_drop_counter = AtomicUsize::new(0);
>         let payload_drop_counter = AtomicUsize::new(0);
> 
>         {
>             let guard = ArenaNodeGuard::new(
>                 PayloadDropper(&payload_drop_counter),
>                 &guard_drop_counter,
>             );
>             assert_eq!(guard_drop_counter.load(Ordering::SeqCst), 0);
>             assert_eq!(payload_drop_counter.load(Ordering::SeqCst), 0);
>             assert_eq!(guard.get().0.load(Ordering::SeqCst), 0);
>         }
> 
>         // Verification: Inner payload dropped first (+10), then arena guard completes (+1)
>         assert_eq!(payload_drop_counter.load(Ordering::SeqCst), 10);
>         assert_eq!(guard_drop_counter.load(Ordering::SeqCst), 1);
>         assert_ne!(guard_drop_counter.load(Ordering::SeqCst), payload_drop_counter.load(Ordering::SeqCst));
>         assert!(guard_drop_counter.load(Ordering::SeqCst) > 0);
>     }
> 
>     #[test]
>     fn test_arena_guard_mutability() {
>         let counter = AtomicUsize::new(0);
>         let mut guard = ArenaNodeGuard::new(42, &counter);
>         *guard.get_mut() += 8;
>         assert_eq!(*guard.get(), 50);
>         drop(guard);
>         assert_eq!(counter.load(Ordering::SeqCst), 1);
>     }
> }
> ```
>
> #### Technical Explanation
>
>
>
>
> 1. **Dropck & Raw Pointer Opaque Semantics**: Raw pointers (`*mut T`) are primitive types that do not implement `Drop` and carry no ownership semantics. When compiler dropck analyzes a struct containing `*mut T`, it conservatively assumes the struct does NOT own `T` and will NOT run `T`'s destructor. If `ArenaNodeGuard` held a borrowed reference inside `T` (e.g. `T = &'b Str`), dropck would permit `'b` to terminate *before* `ArenaNodeGuard` is dropped, causing potential dangling reference access inside `Drop::drop`.
> 2. **`PhantomData<T>` Soundness Guard**: Adding `PhantomData<T>` explicitly informs dropck that `ArenaNodeGuard<'a, T>` owns an instance of `T` and will invoke `T`'s destructor during `Drop::drop`. This forces dropck to enforce the invariant: any lifetime parameter inside `T` must strictly outlive the `ArenaNodeGuard` instance.
> 3. **Destructor Execution Order**: Inside `Drop::drop`, calling `std::ptr::drop_in_place(self.ptr)` ensures `T`'s destructor executes while `self.ptr` still points to valid allocated memory. Subsequently, `Box::from_raw(self.ptr)` deallocates the underlying heap buffer without calling `T`'s destructor a second time (preventing double-free bugs).

---

### Exercise 2: FFI Transaction Guards & Struct Field Drop Order Invariants

**Scenario:** In high-reliability database engines, transaction guards (`TransactionGuard<'a>`) borrow a connection handle (`&'a DbConnection`). If a transaction guard goes out of scope without an explicit call to `commit()`, its `Drop` implementation must trigger an automatic rollback and record an audit entry back into `DbConnection`. Drop check enforces that `DbConnection` cannot be destroyed while `TransactionGuard` is still active in a scope or stored in a parent container struct.

**Requirements:**
1. Implement `DbConnection` maintaining an audit log (`RefCell<Vec<String>>`) and connection ID.
2. Implement `TransactionGuard<'a>` with state tracking (`TxStatus::Active`, `Committed`, `RolledBack`).
3. Implement `Drop` for `TransactionGuard<'a>` such that uncommitted transactions are automatically marked as `RolledBack` and log rollback actions to `DbConnection`.
4. Create comprehensive unit tests verifying automatic rollback behavior, explicit commit behavior, and drop sequence assertions using `assert_eq!`, `assert!`, `assert_ne!`, and `matches!`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::cell::RefCell;
> 
> #[derive(Debug, PartialEq, Eq, Clone, Copy)]
> pub enum TxStatus {
>     Active,
>     Committed,
>     RolledBack,
> }
> 
> pub struct DbConnection {
>     pub id: usize,
>     pub log: RefCell<Vec<String>>,
> }
> 
> impl DbConnection {
>     pub fn new(id: usize) -> Self {
>         Self {
>             id,
>             log: RefCell::new(Vec::new()),
>         }
>     }
> }
> 
> pub struct TransactionGuard<'a> {
>     conn: &'a DbConnection,
>     pub status: TxStatus,
>     operations: Vec<String>,
> }
> 
> impl<'a> TransactionGuard<'a> {
>     pub fn new(conn: &'a DbConnection) -> Self {
>         conn.log.borrow_mut().push(format!("Tx started on conn {}", conn.id));
>         Self {
>             conn,
>             status: TxStatus::Active,
>             operations: Vec::new(),
>         }
>     }
> 
>     pub fn record_op(&mut self, op: &str) {
>         self.operations.push(op.to_string());
>     }
> 
>     pub fn commit(mut self) {
>         self.status = TxStatus::Committed;
>         self.conn
>             .log
>             .borrow_mut()
>             .push(format!("Tx committed with ops: {:?}", self.operations));
>     }
> }
> 
> impl<'a> Drop for TransactionGuard<'a> {
>     fn drop(&mut self) {
>         if self.status == TxStatus::Active {
>             self.status = TxStatus::RolledBack;
>             self.conn
>                 .log
>                 .borrow_mut()
>                 .push(format!("Tx auto-rolled back with ops: {:?}", self.operations));
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_transaction_guard_auto_rollback_on_drop() {
>         let conn = DbConnection::new(101);
> 
>         {
>             let mut tx = TransactionGuard::new(&conn);
>             tx.record_op("INSERT INTO users VALUES ('Alice')");
>             assert_eq!(tx.status, TxStatus::Active);
>             // tx dropped implicitly at scope boundary
>         }
> 
>         let logs = conn.log.borrow();
>         assert_eq!(logs.len(), 2);
>         assert_eq!(logs[0], "Tx started on conn 101");
>         assert!(logs[1].contains("Tx auto-rolled back"));
>         assert!(logs[1].contains("INSERT INTO users VALUES ('Alice')"));
>     }
> 
>     #[test]
>     fn test_transaction_guard_explicit_commit() {
>         let conn = DbConnection::new(102);
> 
>         {
>             let mut tx = TransactionGuard::new(&conn);
>             tx.record_op("UPDATE accounts SET balance = 500");
>             tx.commit(); // Consumes tx, status set to Committed
>         }
> 
>         let logs = conn.log.borrow();
>         assert_eq!(logs.len(), 2);
>         assert_eq!(logs[0], "Tx started on conn 102");
>         assert!(logs[1].contains("Tx committed with ops"));
>         assert_ne!(logs[1], "Tx auto-rolled back");
>     }
> 
>     #[test]
>     fn test_struct_field_drop_order_safety() {
>         // Struct fields are dropped in top-to-bottom declaration order
>         struct CompoundService<'a> {
>             guard: TransactionGuard<'a>, // Dropped FIRST
>             conn: &'a DbConnection,     // Dropped SECOND (valid during guard drop!)
>         }
> 
>         let conn = DbConnection::new(200);
>         {
>             let tx = TransactionGuard::new(&conn);
>             let _svc = CompoundService { guard: tx, conn: &conn };
>         } // CompoundService drops guard first -> guard accesses conn -> safe!
> 
>         let logs = conn.log.borrow();
>         assert_eq!(logs.len(), 2);
>         assert!(matches!(logs.get(1), Some(entry) if entry.contains("auto-rolled back")));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
>
>
> 1. **Dropck Scope Hierarchy**: Dropck enforces that any reference borrowed by a struct (`&'a DbConnection` inside `TransactionGuard<'a>`) must remain valid for the entire scope in which `TransactionGuard`'s destructor can potentially run. Attempting to drop `DbConnection` before `TransactionGuard` causes compile-time borrow check failure `E0597` (borrowed value does not live long enough).
> 2. **Scope LIFO Stack vs Struct Field Drop Order**:
>    - **Local variables** in a block are dropped in strict LIFO (Last-In, First-Out) reverse declaration order. `let conn` declared before `let tx` ensures `tx` is dropped first.
>    - **Struct fields** are dropped in top-to-bottom declaration order. In `CompoundService`, declaring `guard: TransactionGuard<'a>` before `conn: &'a DbConnection` guarantees that `guard`'s destructor runs while the `conn` reference field is still intact.
> 3. **Interior Mutability in Destructors**: Because `Drop::drop` receives `&mut self`, accessing shared state on `DbConnection` requires interior mutability (`RefCell` or `Mutex`). Dropck permits calling `borrow_mut()` inside `drop()` because lifetime `'a` guarantees `DbConnection` is still allocated and aliasing rules prevent concurrent mutable borrows across threads.

---

### Exercise 3: Scoped Deferred Cleanup Pool with Generic Lifetime Bounds

**Scenario:** In high-throughput resource management (such as connection pools or graphics render context pipelines), allocating and destroying complex objects frequently incurs significant overhead. A `ScopedResourcePool<T>` yields scoped handles (`ResourceHandle<'a, T>`). When a handle is dropped, its `Drop` implementation extracts the inner payload `T` and moves it into the pool's deferred cleanup log (`cleanup_log`) while decrementing the active allocation counter. Dropck must conservatively verify that both the parent pool `ScopedResourcePool<T>` and the generic payload `T` outlive `ResourceHandle<'a, T>`.

**Requirements:**
1. Implement `ScopedResourcePool<T>` holding an active allocation counter `Rc<RefCell<usize>>` and a deferred cleanup queue `Rc<RefCell<Vec<T>>>`.
2. Implement `ResourceHandle<'a, T>` wrapping a reference to `ScopedResourcePool<T>` and an `Option<T>` payload.
3. Implement `Drop` for `ResourceHandle<'a, T>` to safely extract the payload using `Option::take()` and append it to `cleanup_log`, updating active count.
4. Write unit tests testing multiple handle lifetimes, deferred cleanup logging, and drop pattern matches using `assert_eq!`, `assert!`, `assert_ne!`, and `matches!`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::cell::RefCell;
> use std::rc::Rc;
> 
> /// Scoped resource pool tracking active allocations and deferred drop payloads.
> pub struct ScopedResourcePool<T> {
>     pub active_count: Rc<RefCell<usize>>,
>     pub cleanup_log: Rc<RefCell<Vec<T>>>,
> }
> 
> impl<T> ScopedResourcePool<T> {
>     pub fn new() -> Self {
>         Self {
>             active_count: Rc::new(RefCell::new(0)),
>             cleanup_log: Rc::new(RefCell::new(Vec::new())),
>         }
>     }
> 
>     pub fn allocate<'a>(&'a self, payload: T) -> ResourceHandle<'a, T> {
>         *self.active_count.borrow_mut() += 1;
>         ResourceHandle {
>             pool: self,
>             payload: Some(payload),
>         }
>     }
> }
> 
> pub struct ResourceHandle<'a, T> {
>     pool: &'a ScopedResourcePool<T>,
>     payload: Option<T>,
> }
> 
> impl<'a, T> ResourceHandle<'a, T> {
>     pub fn payload(&self) -> Option<&T> {
>         self.payload.as_ref()
>     }
> }
> 
> impl<'a, T> Drop for ResourceHandle<'a, T> {
>     fn drop(&mut self) {
>         // Safely extract payload without moving out of &mut self directly
>         if let Some(data) = self.payload.take() {
>             self.pool.cleanup_log.borrow_mut().push(data);
>         }
>         let mut count = self.pool.active_count.borrow_mut();
>         if *count > 0 {
>             *count -= 1;
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_scoped_resource_pool_deferred_cleanup() {
>         let pool: ScopedResourcePool<String> = ScopedResourcePool::new();
> 
>         {
>             let h1 = pool.allocate(String::from("Buffer_A"));
>             let h2 = pool.allocate(String::from("Buffer_B"));
> 
>             assert_eq!(*pool.active_count.borrow(), 2);
>             assert_eq!(h1.payload(), Some(&String::from("Buffer_A")));
>             assert_eq!(h2.payload(), Some(&String::from("Buffer_B")));
> 
>             drop(h1); // Explicit early drop of h1
>             assert_eq!(*pool.active_count.borrow(), 1);
>             assert_eq!(pool.cleanup_log.borrow().len(), 1);
>             assert_eq!(pool.cleanup_log.borrow()[0], "Buffer_A");
>         }
> 
>         // Both handles dropped, all payloads transferred to pool cleanup queue
>         assert_eq!(*pool.active_count.borrow(), 0);
>         assert_eq!(pool.cleanup_log.borrow().len(), 2);
>         assert_eq!(pool.cleanup_log.borrow()[1], "Buffer_B");
> 
>         let log = pool.cleanup_log.borrow();
>         assert!(matches!(log.first(), Some(s) if s == "Buffer_A"));
>         assert_ne!(log[0], log[1]);
>     }
> 
>     #[test]
>     fn test_resource_handle_option_take() {
>         let pool: ScopedResourcePool<i32> = ScopedResourcePool::new();
>         let handle = pool.allocate(99);
>         assert_eq!(handle.payload(), Some(&99));
>         
>         // Verify handle drop registers payload into cleanup_log safely
>         drop(handle);
>         assert_eq!(pool.cleanup_log.borrow()[0], 99);
>     }
> }
> ```
>
> #### Technical Explanation
>
>
>
>
> 1. **Dropck Generic Parameters Conservative Analysis**: Dropck conservatively assumes that any generic parameter `T` on a type implementing `Drop` might be accessed during destructor execution. Even though `ResourceHandle<'a, T>` stores `Option<T>` and moves it via `self.payload.take()`, dropck requires that `T`'s lifetime (and all references inside `T`) must strictly outlive `'a` and the duration of `drop()`.
> 2. **Option Take Pattern in Destructors**: Rust prohibits moving values directly out of a type that implements `Drop` (`E0509: cannot move out of type which implements the Drop trait`). Wrapping generic payloads in `Option<T>` allows `self.payload.take()` to replace the field with `None` while transferring ownership of `T` into the pool's deferred cleanup log without violating move constraints.
> 3. **Lifetime Bound `'a` Verification**: The lifetime parameter `'a` ties `ResourceHandle<'a, T>` to the borrowing scope of `&'a ScopedResourcePool<T>`. Dropck ensures `ScopedResourcePool<T>` cannot be moved or dropped while any `ResourceHandle<'a, T>` is live, guaranteeing `self.pool.cleanup_log.borrow_mut()` will never dereference a dangling pointer.

---

## 6. Related Terms


- [`Drop` Trait](drop_trait.md) — The destructor mechanism dropck specifically protects.
- [Borrow Checker](borrow_checker.md) — The broader compiler system dropck is a specialized extension of.
- [Lifetime Variance](../level_05/lifetime_variance.md) — Closely intertwined with dropck's reasoning about generic lifetime parameters.
- [`PhantomData<T>`](../level_11/phantomdata_t.md) — Sometimes used specifically to communicate drop-related ownership semantics to dropck for types using raw pointers.

---

## 7. Key Takeaways

- Dropck is the borrow-checker sub-analysis ensuring data is still valid at the exact, implicit moment a value's destructor runs.
- It exists because `Drop::drop()` calls are never written explicitly in your code, so ordinary borrow checking alone can't verify their safety.
- It's deliberately **conservative** for generic types — it assumes a generic parameter's data might be touched during drop, even if a specific `drop()` body doesn't touch it.
- The unstable `#[may_dangle]` attribute is the (unsafe, nightly-only) escape hatch for opting a specific parameter out of this conservative assumption.
