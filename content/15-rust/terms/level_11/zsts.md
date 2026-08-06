# `ZSTs` (Zero-Sized Types)

> **Level 11 — Smart Pointers & Advanced Types**
> Types that occupy 0 bytes in memory — optimized away at runtime, yet essential for compile-time markers and state tracking.

---

## 1. Prerequisites


- [Unit Type (`()`)](../level_01/unit_type.md) — The most basic ZST, and the one every Rust programmer meets first.
- [`PhantomData<T>`](phantomdata_t.md) — The flagship "deliberately zero-sized" type used to carry compile-time-only information.
- [Monomorphization](../level_04/monomorphization.md) — Part of why ZSTs cost nothing at runtime.

---

## 2. Term Category

**Memory Layout Category (the free type)**: A Zero-Sized Type is any type whose instances take up **exactly 0 bytes** of memory. They still exist fully at the type level — the compiler tracks them, enforces their trait bounds, and uses them for type safety — but at runtime, creating a million of them costs exactly as much memory as creating zero.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Sometimes you want a type purely to carry *information the compiler should check*, with no actual data to store at runtime. The unit type `()` is the simplest example — it conveys "this computation finished, no interesting value resulted." A unit struct like `struct Marker;` is the same idea, but nameable and distinguishable from other markers. Rust leans into this pattern deliberately: because these types provably hold zero bytes of information, the compiler can (and does) optimize them away entirely — no allocation, no memory read, sometimes not even a machine instruction — while still using them at compile time to enforce invariants, tag types, and drive generic logic. This is a cornerstone of Rust's "pay only for what you use" philosophy: type-level bookkeeping with zero runtime footprint.

### (2) Reality Metaphor

Imagine a company that uses colored sticky-note flags to categorize physical folders on a shelf, but the flags themselves are made of a special material that has **zero weight and zero volume** — you can stick a thousand of them on a folder and the folder's weight never changes.

- **The folder** (your actual data) is what takes up real physical shelf space.
- **The sticky-note flag** (a ZST like `PhantomData<T>` or a unit struct) carries real, useful information — "this folder has been legally reviewed," "this folder is classified Type-A" — that a filing clerk (**the compiler**) can check and enforce rules around, without the flag itself ever costing you an ounce of shelf space or shipping weight.

### (3) Rust Code Examples

#### Short Snippet (Proving Zero Size)
```rust
struct Marker; // A unit struct — zero fields, zero bytes.

fn main() {
    use std::mem::size_of;

    println!("{}", size_of::<()>());      // 0
    println!("{}", size_of::<Marker>());   // 0

    // You can create as many as you want — costs nothing:
    let markers: Vec<Marker> = (0..1_000_000).map(|_| Marker).collect();
    println!("{}", size_of::<Vec<Marker>>()); // Still just the Vec's own 24-byte header!
}
```

#### Fuller Example (`HashSet<T>` Is Secretly `HashMap<T, ()>`)
```rust
use std::collections::HashMap;

fn main() {
    // A HashSet doesn't need to store any VALUE per key — just "is this key present?"
    // So the standard library literally implements HashSet<T> as HashMap<T, ()>.
    // The `()` value costs ZERO extra bytes per entry, compared to a "real" set structure.
    let mut set_like: HashMap<&str, ()> = HashMap::new();
    set_like.insert("apple", ());
    set_like.insert("banana", ());

    println!("{}", set_like.contains_key("apple")); // true
    // This is EXACTLY what HashSet::insert / HashSet::contains do internally.
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Zsts Scoping and Lifecycle Rules

**The mistake:** Assuming Zsts instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("zsts_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("zsts_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Zsts State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Zsts through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Zsts Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Zsts instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Compile-Time State Machine (Typestate Pattern) with Zero Memory Overhead

**Scenario:** You are building a high-reliability database driver where transaction state transitions (`Uninit` -> `Active` -> `Committed`) must be strictly checked at compile time to prevent invalid operations (such as executing queries on an uninitialized or committed transaction). 

Implement a generic struct `Transaction<State>` using Zero-Sized unit structs (`Uninit`, `Active`, `Committed`) as marker types with `PhantomData<State>`.
1. Define unit ZST markers `Uninit`, `Active`, and `Committed`.
2. Implement state transition methods so that:
   - `Transaction::<Uninit>::new(tx_id: u64)` returns a transaction in `Uninit` state.
   - `.begin()` transitions from `Uninit` to `Active`.
   - `.execute(&mut self, query: &str)` is ONLY available on `Transaction<Active>`.
   - `.commit(self)` transitions from `Active` to `Committed`.
   - `.summary(&self)` is ONLY available on `Transaction<Committed>`.
3. Include unit tests asserting that state markers take 0 bytes and that `size_of::<Transaction<State>>()` is identical across all states (equal to `size_of::<(u64, Vec<String>)>()`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::marker::PhantomData;
> use std::mem::size_of;
> 
> // ZST state markers (0 bytes each)
> struct Uninit;
> struct Active;
> struct Committed;
> 
> struct Transaction<State> {
>     tx_id: u64,
>     queries: Vec<String>,
>     _state: PhantomData<State>,
> }
> 
> impl Transaction<Uninit> {
>     pub fn new(tx_id: u64) -> Self {
>         Self {
>             tx_id,
>             queries: Vec::new(),
>             _state: PhantomData,
>         }
>     }
> 
>     pub fn begin(self) -> Transaction<Active> {
>         Transaction {
>             tx_id: self.tx_id,
>             queries: self.queries,
>             _state: PhantomData,
>         }
>     }
> }
> 
> impl Transaction<Active> {
>     pub fn execute(&mut self, query: &str) {
>         self.queries.push(query.to_string());
>     }
> 
>     pub fn commit(self) -> Transaction<Committed> {
>         Transaction {
>             tx_id: self.tx_id,
>             queries: self.queries,
>             _state: PhantomData,
>         }
>     }
> }
> 
> impl Transaction<Committed> {
>     pub fn summary(&self) -> String {
>         format!("Tx #{} committed {} queries", self.tx_id, self.queries.len())
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_typestate_zst_size_and_transitions() {
>         // Verify ZST marker sizes
>         assert_eq!(size_of::<Uninit>(), 0);
>         assert_eq!(size_of::<Active>(), 0);
>         assert_eq!(size_of::<Committed>(), 0);
>         assert_eq!(size_of::<PhantomData<Active>>(), 0);
> 
>         // Base memory footprint of struct fields (u64 + Vec<String>)
>         let base_size = size_of::<(u64, Vec<String>)>();
>         assert_eq!(size_of::<Transaction<Uninit>>(), base_size);
>         assert_eq!(size_of::<Transaction<Active>>(), base_size);
>         assert_eq!(size_of::<Transaction<Committed>>(), base_size);
> 
>         // Verify typestate workflow execution
>         let tx = Transaction::new(42);
>         let mut active_tx = tx.begin();
>         active_tx.execute("INSERT INTO users VALUES ('Alice')");
>         active_tx.execute("UPDATE stats SET count = count + 1");
>         let committed_tx = active_tx.commit();
> 
>         assert_eq!(committed_tx.summary(), "Tx #42 committed 2 queries");
>     }
> }
> ```
>
> #### Technical Explanation
>**
> 1. **Zero-Sized Markers:** `Uninit`, `Active`, and `Committed` are empty unit structs. The Rust compiler optimizes them to 0 bytes of memory layout.
> 2. **PhantomData Integration:** `PhantomData<State>` informs the compiler that `Transaction<State>` depends on generic parameter `State` without allocating memory for it.
> 3. **Compile-Time State Safety:** Methods like `execute()` are only implemented in `impl Transaction<Active>`, making it impossible to run queries on uninitialized or committed transactions at compile time.
> 4. **Zero Runtime Overhead:** `size_of::<Transaction<State>>()` remains identical to the underlying data fields (`base_size`), proving state safety incurs 0 runtime memory penalty.
> 
---

## 5. Practice Exercises

### Exercise 2: Static Event Pipeline & Zero-Allocation Collection Invariants

**Scenario:** You are designing a high-throughput telemetric event processing library. You need a pipeline that chains ZST event filters (`AuditFilter`, `MetricCounter`) via static dispatch without allocating closure objects or storing dynamic trait objects (`&dyn Trait`). Furthermore, you need to verify how Rust's `Vec<T>` behaves when `T` is a Zero-Sized Type.

1. Implement trait `LogProcessor` with method `fn process(&self, log: &str) -> Option<String>`.
2. Create ZST structs `AuditFilter`, `MetricCounter`, and `AlertTrigger` implementing `LogProcessor`.
3. Implement a generic ZST struct `Pipeline<P1, P2>` holding `PhantomData<(P1, P2)>` that implements `LogProcessor` by delegating to `P1` then `P2`.
4. Write tests using `assert_eq!`, `assert!`, and `matches!` to verify pipeline processing output, 0-byte pipeline size, and `Vec<ZST>` capacity invariants (`capacity() == usize::MAX` without heap allocations).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::marker::PhantomData;
> use std::mem::{size_of, size_of_val};
> 
> pub trait LogProcessor {
>     fn process(&self, log: &str) -> Option<String>;
> }
> 
> #[derive(Default)]
> pub struct AuditFilter;
> 
> #[derive(Default)]
> pub struct MetricCounter;
> 
> #[derive(Default)]
> pub struct AlertTrigger;
> 
> impl LogProcessor for AuditFilter {
>     fn process(&self, log: &str) -> Option<String> {
>         if log.contains("[AUDIT]") {
>             Some(format!("Audit: {}", log))
>         } else {
>             None
>         }
>     }
> }
> 
> impl LogProcessor for MetricCounter {
>     fn process(&self, log: &str) -> Option<String> {
>         if log.contains("[METRIC]") {
>             Some(format!("Metric: {}", log))
>         } else {
>             None
>         }
>     }
> }
> 
> impl LogProcessor for AlertTrigger {
>     fn process(&self, log: &str) -> Option<String> {
>         if log.contains("[ALERT]") {
>             Some(format!("ALERT: {}", log))
>         } else {
>             None
>         }
>     }
> }
> 
> pub struct Pipeline<P1, P2> {
>     _processors: PhantomData<(P1, P2)>,
> }
> 
> impl<P1, P2> Pipeline<P1, P2> {
>     pub fn new() -> Self {
>         Self { _processors: PhantomData }
>     }
> }
> 
> impl<P1, P2> LogProcessor for Pipeline<P1, P2>
> where
>     P1: LogProcessor + Default,
>     P2: LogProcessor + Default,
> {
>     fn process(&self, log: &str) -> Option<String> {
>         let p1 = P1::default();
>         let p2 = P2::default();
>         p1.process(log).or_else(|| p2.process(log))
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_zst_pipeline_execution_and_size() {
>         // Pipeline struct takes exactly 0 bytes
>         assert_eq!(size_of::<AuditFilter>(), 0);
>         assert_eq!(size_of::<MetricCounter>(), 0);
>         assert_eq!(size_of::<Pipeline<AuditFilter, MetricCounter>>(), 0);
> 
>         let pipeline = Pipeline::<AuditFilter, MetricCounter>::new();
> 
>         let res1 = pipeline.process("[AUDIT] User root login");
>         assert!(matches!(res1, Some(ref s) if s.starts_with("Audit:")));
> 
>         let res2 = pipeline.process("[METRIC] CPU 98%");
>         assert!(matches!(res2, Some(ref s) if s.starts_with("Metric:")));
> 
>         let res3 = pipeline.process("[INFO] Routine maintenance");
>         assert_eq!(res3, None);
>     }
> 
>     #[test]
>     fn test_zst_vec_allocation_invariants() {
>         let mut zst_vec: Vec<AuditFilter> = Vec::new();
>         for _ in 0..10_000 {
>             zst_vec.push(AuditFilter);
>         }
> 
>         // Vec<ZST> tracks length without heap allocation
>         assert_eq!(zst_vec.len(), 10_000);
>         assert_eq!(zst_vec.capacity(), usize::MAX);
> 
>         // Vec stack header itself is 24 bytes (on 64-bit target: ptr + cap + len)
>         assert_eq!(size_of_val(&zst_vec), size_of::<usize>() * 3);
>     }
> }
> ```
>
> #### Technical Explanation
>**
> 1. **Static Composition:** `Pipeline<P1, P2>` uses monomorphization to instantiate handlers at compile time via `Default::default()`. Because `P1` and `P2` are ZSTs, instantiating them costs zero machine instructions.
> 2. **Zero-Size Pipeline:** `size_of::<Pipeline<AuditFilter, MetricCounter>>()` is 0 bytes because `PhantomData<(P1, P2)>` is a ZST containing ZSTs.
> 3. **Pattern Matching with `matches!`:** The test demonstrates using `matches!(res1, Some(ref s) if ...)` to clean check option payload conditions.
> 4. **`Vec<ZST>` Mechanics:** `Vec<ZST>` never allocates heap memory because elements occupy 0 bytes. Instead, Rust sets capacity to `usize::MAX` and uses `NonNull::dangling()` as the internal pointer, allowing push/pop operations to update length in zero time.
> 
---

### Exercise 3: Alignment Overrides, Struct Padding, and Raw ZST Pointers

**Scenario:** While ZSTs take 0 bytes of payload memory, custom memory alignment attributes (`#[repr(align(N))]`) can drastically alter the memory layout and padding of structs containing ZSTs. Additionally, unsafe code dealing with ZST raw pointers must obey non-null and alignment constraints.

1. Define an unaligned ZST `UnalignedMarker` and an aligned ZST `#[repr(align(64))] struct Align64Marker;`.
2. Define container struct `TaggedBuffer<Tag>` holding `buffer_id: u32` and `PhantomData<Tag>`.
3. Implement helper `create_dangling_zst_ptr<T>() -> std::ptr::NonNull<T>`.
4. Write unit tests with assertions verifying:
   - `size_of` for both markers is 0.
   - `align_of::<Align64Marker>()` is 64.
   - `TaggedBuffer<UnalignedMarker>` has size 4 and alignment 4.
   - `TaggedBuffer<Align64Marker>` has alignment 64 and total size 64 bytes (due to alignment trailing padding).
   - `NonNull::<Align64Marker>::dangling()` produces a pointer satisfying `addr % 64 == 0`.
   - Raw pointer arithmetic (`ptr.add(N)`) on ZST raw pointers is a pointer no-op.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::marker::PhantomData;
> use std::mem::{align_of, size_of};
> use std::ptr::NonNull;
> 
> struct UnalignedMarker;
> 
> #[repr(align(64))]
> struct Align64Marker;
> 
> struct TaggedBuffer<Tag> {
>     buffer_id: u32,
>     _tag: PhantomData<Tag>,
> }
> 
> pub fn create_dangling_zst_ptr<T>() -> NonNull<T> {
>     NonNull::dangling()
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_zst_alignment_and_padding_effects() {
>         // Both markers are zero-sized
>         assert_eq!(size_of::<UnalignedMarker>(), 0);
>         assert_eq!(size_of::<Align64Marker>(), 0);
> 
>         // Alignments differ dramatically
>         assert_eq!(align_of::<UnalignedMarker>(), 1);
>         assert_eq!(align_of::<Align64Marker>(), 64);
> 
>         // Unaligned ZST marker adds no padding to container (u32 = 4 bytes)
>         assert_eq!(size_of::<TaggedBuffer<UnalignedMarker>>(), 4);
>         assert_eq!(align_of::<TaggedBuffer<UnalignedMarker>>(), 4);
> 
>         // Aligned ZST marker forces container to 64-byte alignment and pads total size to 64 bytes
>         assert_eq!(align_of::<TaggedBuffer<Align64Marker>>(), 64);
>         assert_eq!(size_of::<TaggedBuffer<Align64Marker>>(), 64);
>     }
> 
>     #[test]
>     fn test_zst_dangling_pointer_invariants() {
>         let ptr = create_dangling_zst_ptr::<Align64Marker>();
>         let addr = ptr.as_ptr() as usize;
> 
>         // NonNull::dangling() for aligned ZST satisfies alignment requirement (address is non-null & aligned)
>         assert_ne!(addr, 0);
>         assert_eq!(addr % 64, 0);
> 
>         // Raw pointer offset addition on ZST is a zero offset calculation (offset * 0 bytes)
>         let offset_ptr = unsafe { ptr.as_ptr().add(100) };
>         assert_eq!(offset_ptr, ptr.as_ptr());
>     }
> }
> ```
>
> #### Technical Explanation
>**
> 1. **ZST Payload vs Alignment:** `Align64Marker` takes 0 bytes of payload (`size_of == 0`), but specifies an alignment of 64 bytes (`align_of == 64`).
> 2. **Struct Padding Side Effect:** When embedded into `TaggedBuffer<Align64Marker>`, the struct's alignment requirement rises to `max(align_of::<u32>(), 64) = 64`. Rust pads the trailing struct space so array indexing maintains alignment, bumping total struct `size_of` from 4 bytes to 64 bytes.
> 3. **`NonNull::dangling()` Guarantee:** `NonNull::dangling()` returns a sentinel pointer value equal to `align_of::<T>()`. For `Align64Marker`, this yields address `64`, ensuring it is non-null and perfectly aligned.
> 4. **ZST Pointer Arithmetic:** In Rust, `ptr.add(count)` computes `ptr + count * size_of::<T>()`. Because `size_of::<Align64Marker>() == 0`, `100 * 0 = 0`, making raw pointer offsets a complete no-op.
> 
---

## 6. Related Terms


- [Unit Type (`()`)](../level_01/unit_type.md)
- [`PhantomData<T>`](phantomdata_t.md) — The purpose-built ZST for carrying type/lifetime information with zero runtime cost.
- [Type-State Pattern](../level_14/type_state_pattern.md) — A design pattern that leans heavily on ZSTs to encode state transitions the compiler can verify for free.
- [Monomorphization](../level_04/monomorphization.md)
- [Marker Traits](../level_14/marker_traits.md) — Related concept: Marker Traits.
- [Zero-Cost Abstractions](../level_15/zero_cost_abstractions.md) — Related concept: Zero-Cost Abstractions.

---

## 7. Key Takeaways

- A Zero-Sized Type occupies exactly 0 bytes at runtime, while still existing fully at the type level for the compiler to check.
- `()`, field-less unit structs, and single-variant payload-less enums are all common examples.
- `HashSet<T>` is literally `HashMap<T, ()>` internally — the ZST value costs nothing extra per entry.
- ZSTs let you encode compile-time-only information (markers, type tags, state) with zero runtime memory or performance cost.
