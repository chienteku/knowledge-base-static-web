# `PhantomData<T>`

> **Level 11 — Smart Pointers & Advanced Types**
> Zero-sized type used to signal ownership or lifetime relationships to the compiler.

---

## 1. Prerequisites


- [Unit Struct](../level_02/unit_struct.md) — Types that take up 0 bytes of memory (like `()`).
- [Generics (`<T>`)](../level_04/generics.md) — The `<T>` syntax that `PhantomData` interacts with.
- [Lifetime (`'a`)](../level_05/lifetime.md) — The `'a` annotations that `PhantomData` can also simulate.

---

## 2. Term Category

**Rust-specific (the invisible ghost)**: `PhantomData` is a literal ghost. 

It is a Zero-Sized Type (ZST), meaning it takes up exactly 0 bytes of memory and completely ceases to exist at runtime. However, at *compile time*, it is used to trick the Rust compiler into believing that your struct actually owns a type `T` or a lifetime `'a`, even when it doesn't!

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The Rust compiler is incredibly strict about generics. If you define a generic struct `struct MyStruct<T>`, but you don't actually use `T` inside any of the struct's fields, the compiler will throw a massive error: `parameter 'T' is never used`. 

Why would you declare a `T` without using it? 
1. **The Typestate Pattern**: Using generics to represent states (e.g., `Door<Open>` vs `Door<Closed>`) without actually storing data for them.
2. **Unsafe Pointers**: If you write a custom `Vec`, you might store a raw `*mut u8` pointer. The compiler doesn't know what type of data the pointer points to! 

To fix the compiler error without allocating any actual memory, you add a `PhantomData<T>` field to the struct. It satisfies the compiler's strict rules for zero cost.

### (2) Reality Metaphor

Imagine you are buying a plane ticket. The airline requires you to put a "Companion Name" on the ticket, but your companion is an imaginary friend.

- **Compile Error**: If you leave the Companion Name blank, the airline rejects the ticket (unused generic parameter).
- **Memory Allocation**: If you buy a second actual ticket for your imaginary friend, you waste $500.
- **`PhantomData`**: You write "Imaginary Bob" on the ticket. The airline is happy and accepts the ticket. It costs you $0 extra. When you board the plane, nobody is actually sitting next to you (Zero-Sized at runtime).

### (3) Rust Code Examples

#### Short Snippet (The Compiler Error)
The compiler demands that all generics be used. `PhantomData` is the escape hatch.

```rust
// COMPILE ERROR: parameter `State` is never used!
struct StateMachine<State> { 
    id: u32 
}

// SUCCESS! The compiler is happy, and this struct still 
// takes up the exact same amount of memory (4 bytes for the u32).
use std::marker::PhantomData;

struct StateMachineFixed<State> { 
    id: u32,
    _marker: PhantomData<State>,
}
```

#### Fuller Example (The Typestate Pattern)
This is one of the most advanced and beautiful design patterns in Rust. We use `PhantomData` to make invalid states *unrepresentable at compile time*. We create a `Car` that cannot be driven unless it is `On`!

```rust
use std::marker::PhantomData;

// Two empty structs used purely as "States"
struct Off;
struct On;

// The Car struct takes a generic State, but doesn't actually store it!
struct Car<State> {
    _marker: PhantomData<State>,
}

// We implement methods ONLY for a Car<Off>
impl Car<Off> {
    fn turn_on(self) -> Car<On> {
        println!("Turning car on!");
        Car { _marker: PhantomData }
    }
}

// We implement methods ONLY for a Car<On>
impl Car<On> {
    fn drive(&self) {
        println!("Vroom!");
    }
}

fn main() {
    let parked_car: Car<Off> = Car { _marker: PhantomData };
    
    // parked_car.drive(); // COMPILE ERROR! Car<Off> does not have a drive method!
    
    let running_car = parked_car.turn_on();
    running_car.drive(); // SUCCESS!
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Phantomdata T Scoping and Lifecycle Rules

**The mistake:** Assuming Phantomdata T instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("phantomdata_t_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("phantomdata_t_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Phantomdata T State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Phantomdata T through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Phantomdata T Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Phantomdata T instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Type-Safe HTTP Request Builder via Typestate Pattern

**Scenario:**
In network applications, sending an incomplete HTTP request before mandatory configurations (such as setting the target URL and payload body) leads to runtime failures. By employing the **Typestate Pattern** with `PhantomData<State>`, we can make invalid state transitions impossible at compile time with zero runtime overhead.

Implement a zero-cost `HttpRequestBuilder<State>` that transitions through three explicit states:
1. `Unconfigured` (Initial state)
2. `Configured` (URL set)
3. `Ready` (URL and payload body set)

Requirements:
- Define empty marker structs: `Unconfigured`, `Configured`, and `Ready`.
- Define `HttpRequestBuilder<State>` with fields for optional URL string, optional byte body, headers vector, and `_state: PhantomData<State>`.
- Implement `new()` returning `HttpRequestBuilder<Unconfigured>`.
- Implement `.url(&str)` transitioning from `Unconfigured` to `Configured`.
- Implement `.header(&str, &str)` available across all states without changing state.
- Implement `.body(Vec<u8>)` transitioning from `Configured` to `Ready`.
- Implement `.send()` **only** on `HttpRequestBuilder<Ready>`.
- Verify with unit tests (`#[test]`) that `send()` returns the built request tuple and that `size_of::<HttpRequestBuilder<Unconfigured>>()` equals `size_of::<HttpRequestBuilder<Ready>>()`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::marker::PhantomData;
> 
> // State marker structs (Zero-Sized Types)
> #[derive(Debug, PartialEq, Eq)]
> pub struct Unconfigured;
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct Configured;
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct Ready;
> 
> pub struct HttpRequestBuilder<State> {
>     url: Option<String>,
>     body: Option<Vec<u8>>,
>     headers: Vec<(String, String)>,
>     _state: PhantomData<State>,
> }
> 
> impl HttpRequestBuilder<Unconfigured> {
>     pub fn new() -> Self {
>         HttpRequestBuilder {
>             url: None,
>             body: None,
>             headers: Vec::new(),
>             _state: PhantomData,
>         }
>     }
> 
>     pub fn url(self, url: &str) -> HttpRequestBuilder<Configured> {
>         HttpRequestBuilder {
>             url: Some(url.to_string()),
>             body: self.body,
>             headers: self.headers,
>             _state: PhantomData,
>         }
>     }
> }
> 
> impl<State> HttpRequestBuilder<State> {
>     pub fn header(mut self, key: &str, value: &str) -> Self {
>         self.headers.push((key.to_string(), value.to_string()));
>         self
>     }
> }
> 
> impl HttpRequestBuilder<Configured> {
>     pub fn body(self, payload: Vec<u8>) -> HttpRequestBuilder<Ready> {
>         HttpRequestBuilder {
>             url: self.url,
>             body: Some(payload),
>             headers: self.headers,
>             _state: PhantomData,
>         }
>     }
> }
> 
> impl HttpRequestBuilder<Ready> {
>     pub fn send(self) -> (String, Vec<u8>, Vec<(String, String)>) {
>         (
>             self.url.expect("URL must be present in Ready state"),
>             self.body.expect("Body must be present in Ready state"),
>             self.headers,
>         )
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
>     use std::mem::size_of;
> 
>     #[test]
>     fn test_typestate_builder_flow() {
>         let builder = HttpRequestBuilder::new()
>             .header("User-Agent", "Rust-Agent")
>             .url("https://api.example.com/v1/submit")
>             .header("Content-Type", "application/json")
>             .body(b"{\"key\":\"value\"}".to_vec());
> 
>         let (url, body, headers) = builder.send();
> 
>         assert_eq!(url, "https://api.example.com/v1/submit");
>         assert_eq!(body, b"{\"key\":\"value\"}");
>         assert_eq!(headers.len(), 2);
>         assert_eq!(headers[0], ("User-Agent".to_string(), "Rust-Agent".to_string()));
>         assert_eq!(headers[1], ("Content-Type".to_string(), "application/json".to_string()));
>     }
> 
>     #[test]
>     fn test_zero_size_overhead() {
>         assert_eq!(size_of::<PhantomData<Unconfigured>>(), 0);
>         assert_eq!(size_of::<PhantomData<Ready>>(), 0);
>         assert_eq!(
>             size_of::<HttpRequestBuilder<Unconfigured>>(),
>             size_of::<HttpRequestBuilder<Ready>>()
>         );
>     }
> }
> ```
> 
> #### Technical Explanation
>**
> 1. **State Markers as ZSTs:** `Unconfigured`, `Configured`, and `Ready` take 0 bytes of memory. They serve strictly as type parameter tags.
> 2. **Generic Parameter Enforcement:** `HttpRequestBuilder<State>` declares a generic type `State`. Without `_state: PhantomData<State>`, the Rust compiler raises error `E0392` (parameter `State` is never used).
> 3. **Selective Method Implementation:** Methods like `.url()` consume `HttpRequestBuilder<Unconfigured>` and return `HttpRequestBuilder<Configured>`, moving the builder into a new state. `.send()` is defined exclusively on `HttpRequestBuilder<Ready>`. Attempting to call `.send()` on an unconfigured or configured builder results in compile-time error `E0599`.
> 4. **Zero Runtime Cost:** At compile time, `PhantomData<State>` completely vanishes. `size_of::<HttpRequestBuilder<Unconfigured>>()` is identical to `size_of::<HttpRequestBuilder<Ready>>()`.

---

### Exercise 2: Zero-Copy Raw Slice Iterator with Lifetime Bounds (`PhantomData<&'a T>`)

**Scenario:**
When implementing low-level slice iterators or zero-copy parsers over raw pointers (`*const T`), the raw pointer `*const T` does not carry a lifetime or variance information. Without proper lifetime annotations, the Rust borrow checker cannot verify that references handed out by the iterator remain valid for lifetime `'a`.

Implement a high-performance slice iterator `SliceCursor<'a, T>` backed by a raw pointer `*const T` that uses `PhantomData<&'a T>` to bind lifetime `'a` and establish covariance over `T`.

Requirements:
- Define `SliceCursor<'a, T>` containing `ptr: *const T`, `len: usize`, `index: usize`, and `_marker: PhantomData<&'a T>`.
- Implement `from_slice(slice: &'a [T]) -> Self`.
- Implement `Iterator` for `SliceCursor<'a, T>` returning `Option<&'a T>`.
- Implement `remaining(&self) -> usize` and `as_remaining_slice(&self) -> &'a [T]`.
- Provide comprehensive unit tests (`#[test]`) checking iteration bounds, subslice inspection, and zero memory footprint of `PhantomData<&'a T>`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::marker::PhantomData;
> 
> pub struct SliceCursor<'a, T> {
>     ptr: *const T,
>     len: usize,
>     index: usize,
>     _marker: PhantomData<&'a T>,
> }
> 
> impl<'a, T> SliceCursor<'a, T> {
>     pub fn from_slice(slice: &'a [T]) -> Self {
>         SliceCursor {
>             ptr: slice.as_ptr(),
>             len: slice.len(),
>             index: 0,
>             _marker: PhantomData,
>         }
>     }
> 
>     pub fn remaining(&self) -> usize {
>         self.len.saturating_sub(self.index)
>     }
> 
>     pub fn as_remaining_slice(&self) -> &'a [T] {
>         if self.index >= self.len {
>             &[]
>         } else {
>             // SAFETY: ptr + index is within the bounds of the original slice of length len.
>             // Lifetime 'a guarantees the memory remains valid and borrowed.
>             unsafe {
>                 std::slice::from_raw_parts(
>                     self.ptr.add(self.index),
>                     self.len - self.index,
>                 )
>             }
>         }
>     }
> }
> 
> impl<'a, T> Iterator for SliceCursor<'a, T> {
>     type Item = &'a T;
> 
>     fn next(&mut self) -> Option<Self::Item> {
>         if self.index >= self.len {
>             None
>         } else {
>             // SAFETY: index is strictly less than len, so ptr.add(index) points to a valid T.
>             let item_ptr = unsafe { self.ptr.add(self.index) };
>             self.index += 1;
>             unsafe { Some(&*item_ptr) }
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
>     use std::mem::size_of;
> 
>     #[test]
>     fn test_slice_cursor_iteration() {
>         let data = vec![10, 20, 30, 40, 50];
>         let mut cursor = SliceCursor::from_slice(&data);
> 
>         assert_eq!(cursor.remaining(), 5);
>         assert_eq!(cursor.next(), Some(&10));
>         assert_eq!(cursor.next(), Some(&20));
>         assert_eq!(cursor.remaining(), 3);
>         assert_eq!(cursor.as_remaining_slice(), &[30, 40, 50]);
> 
>         assert_eq!(cursor.next(), Some(&30));
>         assert_eq!(cursor.next(), Some(&40));
>         assert_eq!(cursor.next(), Some(&50));
>         assert_eq!(cursor.next(), None);
>         assert_eq!(cursor.remaining(), 0);
>         assert_eq!(cursor.as_remaining_slice(), &[]);
>     }
> 
>     #[test]
>     fn test_cursor_zero_size_phantom() {
>         assert_eq!(size_of::<PhantomData<&'static str>>(), 0);
>         // Cursor layout: raw pointer (1 word) + 2 usize fields (2 words) = 3 words
>         assert_eq!(
>             size_of::<SliceCursor<'static, i32>>(),
>             size_of::<*const i32>() + size_of::<usize>() * 2
>         );
>     }
> }
> ```
> 
> #### Technical Explanation
>**
> 1. **Why `PhantomData<&'a T>` is Required:** Raw pointers (`*const T`) carry neither lifetime constraints nor lifetime covariance. Using `PhantomData<&'a T>` signals to Rust's compiler that `SliceCursor` logically borrows data of type `T` for lifetime `'a`.
> 2. **Covariance:** Because `&'a T` is covariant over `'a` and `T`, `PhantomData<&'a T>` ensures that `SliceCursor<'a, T>` is also covariant over `'a` and `T`.
> 3. **Unsafe Operations Guarded by Lifetime:** When dereferencing `&*item_ptr`, the compiler allows returning `&'a T` because `PhantomData<&'a T>` guarantees to the borrow checker that `data` outlives the cursor.
> 4. **Memory Footprint:** `PhantomData<&'a T>` occupies 0 bytes. The struct size is strictly the sum of `ptr`, `len`, and `index`.

---

### Exercise 3: Custom Safe Heap Slot with Ownership Signaling and Auto Trait Propagation (`PhantomData<T>`)

**Scenario:**
When building custom memory containers or slab allocators wrapping heap pointers (`*mut T`), raw pointers do not signal ownership to Rust's compiler. Consequently:
1. The **drop checker** cannot automatically infer that dropping the container drops an instance of `T`.
2. Raw pointers default to `!Send` and `!Sync`, preventing cross-thread movement even when `T: Send`.

Write a custom owned container `OwnedSlot<T>` wrapping a raw `*mut T` pointer and `PhantomData<T>`.

Requirements:
- Define `OwnedSlot<T>` with `ptr: *mut T` and `_owns: PhantomData<T>`.
- Implement `new(val: T) -> Self` allocating memory on the heap via `Box::into_raw`.
- Implement `get(&self) -> &T` and `get_mut(&mut self) -> &mut T`.
- Implement `into_inner(self) -> T` extracting the owned value without double-dropping.
- Implement `Drop` for `OwnedSlot<T>` reconstructing the `Box` to free memory and run `T`'s destructor.
- Implement `Send` and `Sync` conditionally for `OwnedSlot<T>` where `T: Send` and `T: Sync`.
- Write unit tests (`#[test]`) confirming value access, proper `Drop` invocation via a tracking struct, and `Send` execution across thread boundaries.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::marker::PhantomData;
> use std::sync::atomic::{AtomicBool, Ordering};
> use std::sync::Arc;
> 
> pub struct OwnedSlot<T> {
>     ptr: *mut T,
>     _owns: PhantomData<T>,
> }
> 
> impl<T> OwnedSlot<T> {
>     pub fn new(val: T) -> Self {
>         let boxed = Box::new(val);
>         OwnedSlot {
>             ptr: Box::into_raw(boxed),
>             _owns: PhantomData,
>         }
>     }
> 
>     pub fn get(&self) -> &T {
>         // SAFETY: self.ptr was initialized from Box::into_raw and remains valid
>         // until self is dropped or into_inner is called.
>         unsafe { &*self.ptr }
>     }
> 
>     pub fn get_mut(&mut self) -> &mut T {
>         // SAFETY: Exclusive mutable borrow of self guarantees exclusive access to *self.ptr.
>         unsafe { &mut *self.ptr }
>     }
> 
>     pub fn into_inner(self) -> T {
>         // Extract raw pointer, bypass OwnedSlot's Drop impl, and reconstruct Box to move out value.
>         let ptr = self.ptr;
>         std::mem::forget(self);
>         // SAFETY: ptr was created by Box::into_raw and has not been freed.
>         let boxed = unsafe { Box::from_raw(ptr) };
>         *boxed
>     }
> }
> 
> impl<T> Drop for OwnedSlot<T> {
>     fn drop(&mut self) {
>         // SAFETY: Reconstructing Box frees heap memory and triggers T's Drop destructor.
>         unsafe {
>             let _ = Box::from_raw(self.ptr);
>         }
>     }
> }
> 
> // Auto trait propagation: OwnedSlot<T> is Send/Sync if T is Send/Sync
> unsafe impl<T: Send> Send for OwnedSlot<T> {}
> unsafe impl<T: Sync> Sync for OwnedSlot<T> {}
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     struct DropTracker {
>         dropped: Arc<AtomicBool>,
>     }
> 
>     impl Drop for DropTracker {
>         fn drop(&mut self) {
>             self.dropped.store(true, Ordering::SeqCst);
>         }
>     }
> 
>     #[test]
>     fn test_owned_slot_basic_operations() {
>         let mut slot = OwnedSlot::new(42);
>         assert_eq!(*slot.get(), 42);
> 
>         *slot.get_mut() = 100;
>         assert_eq!(*slot.get(), 100);
> 
>         let val = slot.into_inner();
>         assert_eq!(val, 100);
>     }
> 
>     #[test]
>     fn test_owned_slot_drop_behavior() {
>         let is_dropped = Arc::new(AtomicBool::new(false));
>         {
>             let tracker = DropTracker {
>                 dropped: Arc::clone(&is_dropped),
>             };
>             let _slot = OwnedSlot::new(tracker);
>             assert!(!is_dropped.load(Ordering::SeqCst));
>         } // _slot goes out of scope here
>         assert!(is_dropped.load(Ordering::SeqCst));
>     }
> 
>     #[test]
>     fn test_owned_slot_thread_send() {
>         let slot = OwnedSlot::new(String::from("Hello from thread"));
>         let handle = std::thread::spawn(move || {
>             format!("{}!", slot.get())
>         });
> 
>         let result = handle.join().unwrap();
>         assert_eq!(result, "Hello from thread!");
>     }
> }
> ```
> 
> #### Technical Explanation
>**
> 1. **Ownership Signaling (`PhantomData<T>` vs `PhantomData<*mut T>`):** Using `PhantomData<T>` informs the compiler's drop checker that `OwnedSlot<T>` *owns* an instance of `T`. This ensures correct drop order analysis and strict verification when `T` has non-trivial destructors.
> 2. **Safely Unwrapping (`into_inner`):** `std::mem::forget(self)` prevents `OwnedSlot::drop` from executing when transferring ownership of `T`. Then `Box::from_raw(ptr)` reconstructs the `Box` so dereferencing `*boxed` moves `T` out safely.
> 3. **Destructor Execution:** Inside `Drop for OwnedSlot<T>`, `Box::from_raw(self.ptr)` converts the raw pointer back into a `Box`, which immediately goes out of scope, deallocating the heap buffer and invoking `T`'s destructor.
> 4. **Auto-Trait Safety (`Send` & `Sync`):** Raw pointers `*mut T` are `!Send` and `!Sync` by default to prevent unsafety. `PhantomData<T>` paired with `unsafe impl<T: Send> Send for OwnedSlot<T> {}` safely extends thread-transfer privileges only to types where `T` itself is `Send`.

---

## 6. Related Terms


- [Unit Struct](../level_02/unit_struct.md) — The fundamental concept behind `PhantomData`.
- [`unsafe` Block](../level_13/unsafe_block.md) — One of the main domains where `PhantomData` is required to communicate ownership rules to the compiler.
- [`Drop Check` (dropck)](../level_03/drop_check.md) — Related concept: `Drop Check` (dropck).
- [`ZSTs` (Zero-Sized Types)](zsts.md) — Related concept: `ZSTs` (Zero-Sized Types).

---

## 7. Key Takeaways

- **`PhantomData<T>`** is a Zero-Sized Type (0 bytes of memory).
- It is used to trick the compiler into believing a struct uses a generic `T` or lifetime `'a`, preventing the `unused parameter` compile error.
- It completely **disappears at runtime**, having zero impact on performance or memory.
- It is critical for advanced Rust architectures like the **Typestate Pattern** (using generics to represent state).
- In `unsafe` code, it is used to manually signal ownership and `Drop` rules to the compiler.
