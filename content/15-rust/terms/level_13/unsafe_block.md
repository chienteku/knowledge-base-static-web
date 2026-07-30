# `unsafe` Block

> **Level 13 — Unsafe Rust & FFI**
> A block of code marked with `unsafe { ... }` that informs the compiler you are manually taking responsibility for upholding safety invariants to unlock five low-level capabilities.

---

## 1. Prerequisites

- [Ownership & Borrowing](../level_01/ownership.md) — Understanding borrow checker rules, aliasing XOR mutability, and lifetime guarantees.
- [Raw Pointers (`*const T`, `*mut T`)](../level_13/raw_pointers.md) — Basic understanding of raw pointers that bypass borrow checking.
- [Undefined Behavior (UB)](../level_13/undefined_behavior.md) — Understanding what constitutes memory safety violations in compiled Rust binaries.

---

## 2. Term Category

**Unsafe / FFI**: An `unsafe` block is a explicit opt-in syntax block (`unsafe { ... }`) in Rust. It does not turn off the borrow checker or disable type checking, but rather unlocks five specific "superpowers" that the compiler cannot statically verify for memory safety.

---

## 3. Environment Context

**Universal Rust**: `unsafe` blocks work in all Rust environments, including standard library (`std`), `no_std`, systems programming, embedded microcontrollers, and WebAssembly FFI bindings.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"

Computer hardware operates on physical memory addresses, raw bytes, hardware registers, and system calls. The Rust compiler's strict safety checks (ownership rules, single mutable borrow enforcement, lifetime bounds) are conservative: `rustc` will reject some programs that are actually safe because it cannot *provably verify* their safety at compile time.

If Rust strictly prohibited any operation the compiler couldn't verify:
1. You could not build basic data structures like linked lists, graphs, or atomic ring buffers (which require aliased pointers or shared mutability).
2. You could not interact with operating system APIs, C libraries, or hardware device registers.
3. You could not write the Rust Standard Library itself (e.g. `Vec<T>`, `String`, and `Mutex<T>` rely internally on raw pointers and `unsafe` allocations).

Rust introduced the `unsafe` keyword to separate the compiler's responsibility from the developer's responsibility. Inside an `unsafe { ... }` block, you tell the compiler: *"I know what I am doing. I take personal responsibility for upholding memory safety invariants here."*

Crucially, an `unsafe` block unlocks **only five specific superpowers**:
1. **Dereferencing a raw pointer** (`*const T`, `*mut T`).
2. **Calling an unsafe function** or foreign function interface (`unsafe fn` or `extern`).
3. **Implementing an unsafe trait** (e.g., `Send` or `Sync`).
4. **Accessing or mutating a mutable static variable** (`static mut`).
5. **Accessing fields of a `union`**.

An `unsafe` block does **not** disable type checking, lifetime checks, or standard borrow checking on standard references (`&T` / `&mut T`).

### (2) Reality Metaphor

Imagine a **High-Voltage Main Circuit Breaker Panel**:

- **Safe Rust** is like plugging standard appliances into wall outlets protected by automatic circuit breakers and child-proof covers. The outlets prevent you from accidentally touching live 240V wires.
- An **`unsafe` Block** is like putting on insulated rubber gloves, grabbing an insulated screwdriver, and opening the main circuit breaker panel door (**entering `unsafe { ... }`**).
  - The breaker panel allows you to bypass standard wall sockets to wire heavy machinery or raw copper cables directly (**unlocks raw pointer access & FFI**).
  - Electricity still obeys physics (**types and memory rules still apply**).
  - If you touch the bare live busbar with your bare hands (**cause Undefined Behavior**), the panel will not prevent you from receiving an electric shock (**memory corruption / crash**).

### (3) Code Examples

#### Short Snippet (Unlocking Raw Pointer Dereferencing)

```rust
fn main() {
    let mut num: i32 = 42;

    // Creating raw pointers is 100% SAFE. No `unsafe` block required!
    let r1: *const i32 = &num as *const i32;
    let r2: *mut i32 = &mut num as *mut i32;

    // Dereferencing raw pointers REQUIRES an `unsafe` block:
    unsafe {
        println!("r1 value: {}", *r1); // 42
        *r2 = 100;
        println!("r2 modified value: {}", *r2); // 100
    }
}
```

#### Fuller Example (Building a Safe Abstraction over Unsafe Internal Operations)

```rust
/// A safe wrapper around a raw memory slice split operations.
/// Demonstrates the core Rust idiom: encapsulation of `unsafe` logic
/// behind a 100% safe public API contract.
pub fn split_at_mut_slice<T>(slice: &mut [T], mid: usize) -> (&mut [T], &mut [T]) {
    let len = slice.len();
    let ptr = slice.as_mut_ptr(); // Get raw mutable pointer to element 0

    // Uphold safety invariants before entering `unsafe` block:
    // 1. `mid` must be within slice bounds
    assert!(mid <= len, "index out of bounds");

    unsafe {
        // SAFETY INVARIANT JUSTIFICATION:
        // - `ptr` points to valid slice memory of length `len`.
        // - `ptr.add(mid)` stays within slice bounds because mid <= len.
        // - The two returned slices `(&mut [T], &mut [T])` are non-overlapping memory regions,
        //   so returning two mutable references does not violate Rust's aliasing rules.
        (
            std::slice::from_raw_parts_mut(ptr, mid),
            std::slice::from_raw_parts_mut(ptr.add(mid), len - mid),
        )
    }
}

fn main() {
    let mut numbers = vec![10, 20, 30, 40, 50];
    let (left, right) = split_at_mut_slice(&mut numbers, 2);

    left[0] = 99;
    right[0] = 88;

    println!("Updated original vector: {:?}", numbers); // [99, 20, 88, 40, 50]
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Believing `unsafe` Disables the Borrow Checker

**The mistake:** Assuming that wrapping normal reference code inside `unsafe { ... }` allows creating multiple mutable references `&mut T` to the same data simultaneously.

**Why it's wrong:** An `unsafe` block does not turn off borrow checking for standard references (`&T` / `&mut T`). Creating aliased `&mut T` references inside an `unsafe` block is **Undefined Behavior (UB)** and will trigger compiler optimizations that corrupt data or cause crashes.

*Incorrect:*
```rust
let mut val = 42;
unsafe {
    // ❌ UNDEFINED BEHAVIOR! Aliased `&mut` references are illegal even inside `unsafe`
    let ref1: &mut i32 = &mut val;
    let ref2: &mut i32 = &mut val; 
    *ref1 = 10;
    *ref2 = 20;
}
```

*Fix:*
```rust
let mut val = 42;
// Correct: Use raw pointers (*mut i32) when multiple mutable pointers are required
let ptr1: *mut i32 = &mut val as *mut i32;
let ptr2: *mut i32 = ptr1;

unsafe {
    *ptr1 = 10;
    *ptr2 = 20;
    println!("val: {}", val); // 20
}
```

### Mistake 2: Missing `// SAFETY:` Documented Invariant Justifications

**The mistake:** Writing an `unsafe` block without adding a comment explaining *why* the unsafe operations inside are provably safe.

**Why it's wrong:** `unsafe` code must be audited by humans. Without a `// SAFETY:` comment detailing why pointer bounds, alignment, non-nullness, or lifetime invariants hold, future maintainers will break your code during refactoring.

*Incorrect:*
```rust
unsafe {
    // ❌ No explanation of why dereferencing this raw pointer is safe!
    let val = *raw_ptr;
}
```

*Fix:*
```rust
// SAFETY: `raw_ptr` was created from a valid, non-null `Box<i32>` instance
// and is guaranteed to be properly aligned and readable.
unsafe {
    let val = *raw_ptr;
}
```

### Mistake 3: Creating Null or Dangling References `&T` from Bad Raw Pointers

**The mistake:** Converting a null raw pointer directly into a Rust reference `&T` using `&*ptr`.

**Why it's wrong:** In Rust, standard references `&T` can NEVER be null or dangling. Converting a null raw pointer to `&T` causes instant Undefined Behavior, even if the reference is never dereferenced.

*Incorrect:*
```rust
let null_ptr: *const i32 = std::ptr::null();
unsafe {
    // ❌ UNDEFINED BEHAVIOR! Rust references MUST NOT be null!
    let reference: &i32 = &*null_ptr; 
}
```

*Fix:*
```rust
let null_ptr: *const i32 = std::ptr::null();
unsafe {
    // Correct: Use `as_ref()` which returns `Option<&T>`
    if let Some(reference) = null_ptr.as_ref() {
        println!("Value: {}", reference);
    } else {
        println!("Pointer was null!");
    }
}
```

---

## 6. Practice Exercises

### Exercise 1: Zero-Copy Network Packet Header & Payload Splitter

**Problem:** In network stack implementation and embedded packet processing (e.g. Ethernet frame parsers or DMA buffer managers), contiguous network buffers must be partitioned into header and payload mutable slices without dynamic memory allocation or byte copying. Standard borrow checking prevents creating two mutable slices (`&mut [u8]`) from the same underlying array simultaneously without low-level pointer operations.

Implement a safe function:
`pub fn split_packet_mut<'a>(packet: &'a mut [u8], header_len: usize) -> Result<(&'a mut [u8], &'a mut [u8]), PacketError>`
where `PacketError` is a custom enum (`HeaderOutOfBounds`).

The function must:
1. Verify that `header_len <= packet.len()`, returning `Err(PacketError::HeaderOutOfBounds)` if out of bounds.
2. Obtain a raw pointer via `packet.as_mut_ptr()`.
3. Use an `unsafe` block and `core::slice::from_raw_parts_mut` to create two non-overlapping slices: header `[0..header_len]` and payload `[header_len..total_len]`.
4. Include explicit `// SAFETY:` comments documenting why pointer offsets and slice bounds guarantee valid non-overlapping mutable references.
5. Include comprehensive unit tests testing header/payload mutation, boundary conditions (`header_len == 0` and `header_len == packet.len()`), and out-of-bounds error handling.

> [!check]- Answer
> ```rust
> use core::fmt;
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum PacketError {
>     HeaderOutOfBounds { header_len: usize, total_len: usize },
> }
> 
> impl fmt::Display for PacketError {
>     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
>         match self {
>             PacketError::HeaderOutOfBounds { header_len, total_len } => {
>                 write!(f, "Header length {} exceeds total packet length {}", header_len, total_len)
>             }
>         }
>     }
> }
> 
> /// Safely splits a mutable byte packet slice into header and payload mutable slices.
> ///
> /// Encapsulates raw pointer operations in an `unsafe` block behind a 100% safe API contract.
> pub fn split_packet_mut<'a>(
>     packet: &'a mut [u8],
>     header_len: usize,
> ) -> Result<(&'a mut [u8], &'a mut [u8]), PacketError> {
>     let total_len = packet.len();
>     if header_len > total_len {
>         return Err(PacketError::HeaderOutOfBounds {
>             header_len,
>             total_len,
>         });
>     }
> 
>     let ptr = packet.as_mut_ptr();
> 
>     // SAFETY:
>     // 1. `ptr` points to a valid, aligned, initialized byte slice of length `total_len`.
>     // 2. `header_len <= total_len` is guaranteed by the preceding bounds check.
>     // 3. `ptr.add(header_len)` points within the slice bounds or exactly to its end.
>     // 4. The two slices `header` [0..header_len] and `payload` [header_len..total_len]
>     //    are strictly disjoint (non-overlapping), so returning dual mutable references
>     //    does not violate Rust's aliasing rules.
>     // 5. The output slices inherit the lifetime `'a` of the input slice `packet`.
>     unsafe {
>         let header = core::slice::from_raw_parts_mut(ptr, header_len);
>         let payload = core::slice::from_raw_parts_mut(ptr.add(header_len), total_len - header_len);
>         Ok((header, payload))
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_valid_packet_split_and_modification() {
>         let mut frame = [0x01, 0x02, 0x03, 0x04, 0xAA, 0xBB, 0xCC];
>         let (header, payload) = split_packet_mut(&mut frame, 4).unwrap();
> 
>         assert_eq!(header, &[0x01, 0x02, 0x03, 0x04]);
>         assert_eq!(payload, &[0xAA, 0xBB, 0xCC]);
> 
>         // Modify header and payload independently
>         header[0] = 0xFF;
>         payload[0] = 0xDD;
> 
>         assert_eq!(frame, [0xFF, 0x02, 0x03, 0x04, 0xDD, 0xBB, 0xCC]);
>     }
> 
>     #[test]
>     fn test_boundary_splits() {
>         let mut frame = [1, 2, 3];
> 
>         // Empty header split
>         let (header, payload) = split_packet_mut(&mut frame, 0).unwrap();
>         assert_eq!(header.len(), 0);
>         assert_eq!(payload.len(), 3);
> 
>         // Empty payload split
>         let (header, payload) = split_packet_mut(&mut frame, 3).unwrap();
>         assert_eq!(header.len(), 3);
>         assert_eq!(payload.len(), 0);
>     }
> 
>     #[test]
>     fn test_out_of_bounds_error() {
>         let mut frame = [1, 2, 3];
>         let res = split_packet_mut(&mut frame, 5);
>         assert_eq!(
>             res,
>             Err(PacketError::HeaderOutOfBounds {
>                 header_len: 5,
>                 total_len: 3,
>             })
>         );
>     }
> }
> ```
>
> **Explanation:**
> 1. **Safe Encapsulation of `unsafe` Blocks**: The function verifies bounds dynamically (`header_len <= total_len`) before entering the `unsafe` block, converting raw pointer manipulations into a 100% safe public API contract.
> 2. **Disjoint Memory Aliasing Guarantees**: Rust forbids multiple overlapping mutable references (`&mut T`). `core::slice::from_raw_parts_mut` creates two slices derived from the same base pointer, but because their memory ranges `[0..header_len]` and `[header_len..total_len]` are completely disjoint, no aliasing rule violation occurs.
> 3. **Raw Pointer Offset Arithmetic**: `ptr.add(header_len)` computes byte pointer offsets without intermediate standard reference allocation.
> 4. **Lifetime Propagation**: Lifetime annotations `'a` tie the produced header and payload slices to the original input buffer lifetime, preventing dangling reference vulnerabilities.
> 
---

### Exercise 2: Lock-Free SPSC Ring Buffer with `UnsafeCell` and `Send`/`Sync`

**Problem:** In real-time audio streams, embedded IPC channels, and high-frequency messaging systems, threads exchange messages using Single-Producer Single-Consumer (SPSC) ring buffers without Mutex lock contention. Implementing shared mutability across threads requires wrapping raw buffer slots in `core::cell::UnsafeCell`, writing/reading slots via raw pointers inside `unsafe` blocks, and manually implementing `unsafe trait Send` and `unsafe trait Sync`.

Implement a lock-free queue struct `SpscChannel<T, const CAP: usize>` for `T: Copy + Default` with fields:
- `buffer: [UnsafeCell<T>; CAP]`
- `head: AtomicUsize` (producer write index)
- `tail: AtomicUsize` (consumer read index)

Requirements:
1. Implement `unsafe impl Send` and `unsafe impl Sync` for `SpscChannel<T, CAP>`, documenting thread-safety preconditions with `// SAFETY:` comments.
2. Implement `push(&self, item: T) -> Result<(), T>` using `AtomicUsize` load/store (`Acquire`/`Release`) and raw pointer dereference `*slot_ptr = item` inside an `unsafe` block.
3. Implement `pop(&self) -> Option<T>` using `AtomicUsize` load/store and raw pointer read inside an `unsafe` block.
4. Write unit tests with assertions (`assert_eq!`, `assert!`) testing sequential push/pop operations, queue overflow behavior, index wrap-around, and multi-threaded data transfer via `std::thread::spawn`.

> [!check]- Answer
> ```rust
> use core::cell::UnsafeCell;
> use core::sync::atomic::{AtomicUsize, Ordering};
> 
> /// A fixed-capacity Single-Producer Single-Consumer (SPSC) lock-free queue.
> pub struct SpscChannel<T, const CAP: usize> {
>     buffer: [UnsafeCell<T>; CAP],
>     head: AtomicUsize,
>     tail: AtomicUsize,
> }
> 
> // SAFETY: `SpscChannel` allows sharing references `&SpscChannel` across threads (`Sync`)
> // and sending `SpscChannel` across threads (`Send`). Safety is guaranteed provided:
> // 1. `T` implements `Send` so owned data can cross threads.
> // 2. Exactly ONE producer calls `push` and ONE consumer calls `pop` concurrently.
> // 3. `head` and `tail` atomic indices with Release-Acquire ordering ensure the producer
> //    and consumer never write or read the same `UnsafeCell` slot simultaneously.
> unsafe impl<T: Copy + Send, const CAP: usize> Send for SpscChannel<T, CAP> {}
> unsafe impl<T: Copy + Send, const CAP: usize> Sync for SpscChannel<T, CAP> {}
> 
> impl<T: Copy + Default, const CAP: usize> SpscChannel<T, CAP> {
>     /// Creates a new empty `SpscChannel` with fixed compile-time capacity.
>     pub fn new() -> Self {
>         SpscChannel {
>             buffer: core::array::from_fn(|_| UnsafeCell::new(T::default())),
>             head: AtomicUsize::new(0),
>             tail: AtomicUsize::new(0),
>         }
>     }
> 
>     /// Pushes an item into the channel. Executed by the PRODUCER thread only.
>     pub fn push(&self, item: T) -> Result<(), T> {
>         let head = self.head.load(Ordering::Relaxed);
>         let tail = self.tail.load(Ordering::Acquire);
> 
>         let next_head = (head + 1) % CAP;
>         if next_head == tail {
>             // Queue is full
>             return Err(item);
>         }
> 
>         // SAFETY:
>         // - `head` is exclusively written by the single producer thread.
>         // - `next_head != tail` guarantees the consumer is not currently reading slot `head`.
>         // - `UnsafeCell::get()` produces a valid raw pointer to buffer slot `head`.
>         unsafe {
>             let slot_ptr = self.buffer[head].get();
>             *slot_ptr = item;
>         }
> 
>         self.head.store(next_head, Ordering::Release);
>         Ok(())
>     }
> 
>     /// Pops an item from the channel. Executed by the CONSUMER thread only.
>     pub fn pop(&self) -> Option<T> {
>         let tail = self.tail.load(Ordering::Relaxed);
>         let head = self.head.load(Ordering::Acquire);
> 
>         if tail == head {
>             // Queue is empty
>             return None;
>         }
> 
>         // SAFETY:
>         // - `tail` is exclusively written by the single consumer thread.
>         // - `tail != head` guarantees the producer has finished writing slot `tail`
>         //   and published the update via Release-Acquire barrier.
>         // - `UnsafeCell::get()` produces a valid readable pointer.
>         let item = unsafe {
>             let slot_ptr = self.buffer[tail].get();
>             *slot_ptr
>         };
> 
>         let next_tail = (tail + 1) % CAP;
>         self.tail.store(next_tail, Ordering::Release);
>         Some(item)
>     }
> 
>     pub fn len(&self) -> usize {
>         let head = self.head.load(Ordering::Relaxed);
>         let tail = self.tail.load(Ordering::Relaxed);
>         if head >= tail {
>             head - tail
>         } else {
>             CAP + head - tail
>         }
>     }
> 
>     pub fn is_empty(&self) -> bool {
>         self.len() == 0
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
>     use std::sync::Arc;
>     use std::thread;
> 
>     #[test]
>     fn test_push_pop_sequential() {
>         let queue: SpscChannel<i32, 4> = SpscChannel::new();
>         assert!(queue.is_empty());
> 
>         assert!(queue.push(10).is_ok());
>         assert!(queue.push(20).is_ok());
>         assert!(queue.push(30).is_ok());
>         // Capacity is 4, but 1 slot is reserved to distinguish full from empty (max 3 items)
>         assert_eq!(queue.push(40), Err(40));
> 
>         assert_eq!(queue.len(), 3);
>         assert_eq!(queue.pop(), Some(10));
>         assert_eq!(queue.pop(), Some(20));
>         assert_eq!(queue.pop(), Some(30));
>         assert_eq!(queue.pop(), None);
>         assert!(queue.is_empty());
>     }
> 
>     #[test]
>     fn test_wrap_around() {
>         let queue: SpscChannel<u32, 3> = SpscChannel::new(); // Max 2 items
>         assert!(queue.push(100).is_ok());
>         assert!(queue.push(200).is_ok());
>         assert_eq!(queue.pop(), Some(100));
> 
>         assert!(queue.push(300).is_ok()); // Wraps around index
>         assert_eq!(queue.pop(), Some(200));
>         assert_eq!(queue.pop(), Some(300));
>         assert_eq!(queue.pop(), None);
>     }
> 
>     #[test]
>     fn test_concurrent_spsc_threads() {
>         let queue = Arc::new(SpscChannel::<u64, 128>::new());
>         let producer_queue = Arc::clone(&queue);
> 
>         let items_count = 1000u64;
> 
>         let producer_handle = thread::spawn(move || {
>             for i in 0..items_count {
>                 while producer_queue.push(i).is_err() {
>                     thread::yield_now();
>                 }
>             }
>         });
> 
>         let mut received = Vec::new();
>         while received.len() < items_count as usize {
>             if let Some(val) = queue.pop() {
>                 received.push(val);
>             } else {
>                 thread::yield_now();
>             }
>         }
> 
>         producer_handle.join().unwrap();
> 
>         let expected: Vec<u64> = (0..items_count).collect();
>         assert_eq!(received, expected);
>     }
> }
> ```
>
> **Explanation:**
> 1. **Unsafe Traits `Send` & `Sync`**: By default, `UnsafeCell<T>` disables `Sync` because it provides interior mutability without lock protection. Implementing `unsafe impl Sync` informs compiler that `SpscChannel` is safe to share across threads under SPSC access constraints.
> 2. **Interior Mutability via `UnsafeCell::get`**: `UnsafeCell::get()` returns a `*mut T` raw pointer to the slot. Dereferencing `*slot_ptr` inside `unsafe` blocks enables modifying buffer slots through shared `&self` references without Mutex allocation.
> 3. **Atomic Synchronization Orderings**: Using `Ordering::Release` when publishing updated indices (`head` / `tail`) and `Ordering::Acquire` when reading indices guarantees memory barrier visibility across CPU cores before raw pointer dereferences occur.
> 4. **Lock-Free Thread Communication**: Validated concurrent message passing between worker threads using `Arc` and `std::thread::spawn` demonstrates lock-free, zero-allocation IPC patterns.
> 
---

### Exercise 3: Bare-Metal Memory-Mapped I/O (MMIO) Volatile Peripheral Driver (`#![no_std]`)

**Problem:** In bare-metal embedded device drivers (`#![no_std]`), microcontroller hardware peripherals (like UARTs, SPI buses, or Timers) are controlled by reading and writing hardware registers mapped to specific physical memory addresses (Memory-Mapped I/O). Standard pointer operations are subject to compiler optimizations that cache, reorder, or elide repeated memory reads/writes. Interacting with hardware registers requires calling `core::ptr::read_volatile` and `core::ptr::write_volatile` inside `unsafe` blocks.

Implement an embedded UART driver `MmioUartDriver` for a peripheral mapped at base address `base_ptr: *mut u32` with register offsets:
- `DATA_REG` (offset 0): Transmit/Receive data byte (bits `0..=7`).
- `STATUS_REG` (offset 1): Hardware status flags (Bit 0: `TX_READY`, Bit 1: `RX_READY`).
- `CTRL_REG` (offset 2): Control flags (Bit 0: `ENABLE`).

Requirements:
1. Implement `pub unsafe fn from_raw_address(base_ptr: *mut u32) -> Self`.
2. Implement `pub fn enable(&self)` using `read_volatile` and `write_volatile` on `CTRL_REG`.
3. Implement `pub fn is_enabled(&self) -> bool` using `read_volatile`.
4. Implement `pub fn transmit_byte(&self, byte: u8) -> Result<(), UartError>`: Check `is_enabled()`, perform volatile read on `STATUS_REG` for `TX_READY`, and volatile write `byte as u32` to `DATA_REG`.
5. Implement `pub fn receive_byte(&self) -> Result<u8, UartError>`: Check `is_enabled()`, perform volatile read on `STATUS_REG` for `RX_READY`, and volatile read `DATA_REG`.
6. Include `// SAFETY:` comments inside `unsafe` blocks.
7. In `#[cfg(test)]`, simulate MMIO hardware using a stack memory array `[u32; 3]` and test enable toggling, transmit buffer checks, byte reception, and error handling with `assert_eq!`.

> [!check]- Answer
> ```rust
> #![no_std]
> 
> use core::ptr::{read_volatile, write_volatile};
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum UartError {
>     TxBusy,
>     RxEmpty,
>     NotEnabled,
> }
> 
> /// Bitmask constants for MMIO UART peripheral control registers.
> pub struct UartRegisterOffsets;
> impl UartRegisterOffsets {
>     pub const DATA: usize = 0;   // Offset 0x00 (0 * 4 bytes)
>     pub const STATUS: usize = 1; // Offset 0x04 (1 * 4 bytes)
>     pub const CTRL: usize = 2;   // Offset 0x08 (2 * 4 bytes)
> }
> 
> pub struct UartBitmasks;
> impl UartBitmasks {
>     pub const STATUS_TX_READY: u32 = 1 << 0; // Bit 0
>     pub const STATUS_RX_READY: u32 = 1 << 1; // Bit 1
>     pub const CTRL_ENABLE: u32 = 1 << 0;     // Bit 0
>     pub const CTRL_INT_ENABLE: u32 = 1 << 1; // Bit 1
> }
> 
> /// Safe hardware driver wrapper around a raw MMIO peripheral base address.
> pub struct MmioUartDriver {
>     base_ptr: *mut u32,
> }
> 
> impl MmioUartDriver {
>     /// Creates a driver instance from a raw MMIO base address pointer.
>     ///
>     /// # Safety
>     /// `base_ptr` must point to a valid, aligned MMIO memory region containing
>     /// at least 3 readable and writable 32-bit peripheral registers.
>     pub unsafe fn from_raw_address(base_ptr: *mut u32) -> Self {
>         MmioUartDriver { base_ptr }
>     }
> 
>     /// Enables the UART peripheral by setting the CTRL_ENABLE bit in CTRL_REG.
>     pub fn enable(&self) {
>         unsafe {
>             // SAFETY: `base_ptr.add(2)` calculates offset for CTRL_REG (0x08).
>             // Volatile operations prevent compiler optimizations from caching hardware state.
>             let ctrl_ptr = self.base_ptr.add(UartRegisterOffsets::CTRL);
>             let current = read_volatile(ctrl_ptr);
>             write_volatile(ctrl_ptr, current | UartBitmasks::CTRL_ENABLE);
>         }
>     }
> 
>     /// Checks if UART hardware peripheral is enabled.
>     pub fn is_enabled(&self) -> bool {
>         unsafe {
>             // SAFETY: Dereferencing valid hardware control register with volatile read.
>             let ctrl_ptr = self.base_ptr.add(UartRegisterOffsets::CTRL);
>             (read_volatile(ctrl_ptr) & UartBitmasks::CTRL_ENABLE) != 0
>         }
>     }
> 
>     /// Transmits a byte over UART if transmit register is ready.
>     pub fn transmit_byte(&self, byte: u8) -> Result<(), UartError> {
>         if !self.is_enabled() {
>             return Err(UartError::NotEnabled);
>         }
> 
>         unsafe {
>             // SAFETY: Accessing STATUS and DATA registers via volatile pointer offsets.
>             let status_ptr = self.base_ptr.add(UartRegisterOffsets::STATUS);
>             let status = read_volatile(status_ptr);
> 
>             if (status & UartBitmasks::STATUS_TX_READY) == 0 {
>                 return Err(UartError::TxBusy);
>             }
> 
>             let data_ptr = self.base_ptr.add(UartRegisterOffsets::DATA);
>             write_volatile(data_ptr, byte as u32);
>             Ok(())
>         }
>     }
> 
>     /// Receives a byte from UART if receive register has data ready.
>     pub fn receive_byte(&self) -> Result<u8, UartError> {
>         if !self.is_enabled() {
>             return Err(UartError::NotEnabled);
>         }
> 
>         unsafe {
>             // SAFETY: Checking RX_READY in STATUS register and reading DATA register.
>             let status_ptr = self.base_ptr.add(UartRegisterOffsets::STATUS);
>             let status = read_volatile(status_ptr);
> 
>             if (status & UartBitmasks::STATUS_RX_READY) == 0 {
>                 return Err(UartError::RxEmpty);
>             }
> 
>             let data_ptr = self.base_ptr.add(UartRegisterOffsets::DATA);
>             let data = read_volatile(data_ptr);
>             Ok((data & 0xFF) as u8)
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_mmio_driver_enable_and_status() {
>         // Simulate hardware MMIO registers in memory: [DATA, STATUS, CTRL]
>         let mut mock_mmio: [u32; 3] = [0, 0, 0];
>         let driver = unsafe { MmioUartDriver::from_raw_address(mock_mmio.as_mut_ptr()) };
> 
>         assert!(!driver.is_enabled());
> 
>         // Attempting transmission before enable returns NotEnabled error
>         assert_eq!(driver.transmit_byte(0x41), Err(UartError::NotEnabled));
> 
>         driver.enable();
>         assert!(driver.is_enabled());
>         assert_eq!(mock_mmio[UartRegisterOffsets::CTRL], UartBitmasks::CTRL_ENABLE);
>     }
> 
>     #[test]
>     fn test_mmio_transmission_flow() {
>         let mut mock_mmio: [u32; 3] = [0, 0, 0];
>         let driver = unsafe { MmioUartDriver::from_raw_address(mock_mmio.as_mut_ptr()) };
>         driver.enable();
> 
>         // Status register initially 0 (TX not ready)
>         assert_eq!(driver.transmit_byte(0x55), Err(UartError::TxBusy));
> 
>         // Simulate hardware setting TX_READY bit in STATUS register
>         mock_mmio[UartRegisterOffsets::STATUS] |= UartBitmasks::STATUS_TX_READY;
> 
>         // Transmit should now succeed and write byte 0x55 into DATA register
>         assert!(driver.transmit_byte(0x55).is_ok());
>         assert_eq!(mock_mmio[UartRegisterOffsets::DATA], 0x55);
>     }
> 
>     #[test]
>     fn test_mmio_reception_flow() {
>         let mut mock_mmio: [u32; 3] = [0, 0, 0];
>         let driver = unsafe { MmioUartDriver::from_raw_address(mock_mmio.as_mut_ptr()) };
>         driver.enable();
> 
>         // Rx empty initially
>         assert_eq!(driver.receive_byte(), Err(UartError::RxEmpty));
> 
>         // Simulate hardware placing received byte 0xAB in DATA and setting RX_READY in STATUS
>         mock_mmio[UartRegisterOffsets::DATA] = 0xAB;
>         mock_mmio[UartRegisterOffsets::STATUS] |= UartBitmasks::STATUS_RX_READY;
> 
>         assert_eq!(driver.receive_byte(), Ok(0xAB));
>     }
> }
> ```
>
> **Explanation:**
> 1. **Volatile Pointer Reads & Writes (`read_volatile` / `write_volatile`)**: Hardware registers can change state asynchronously outside normal CPU control flow. `read_volatile` and `write_volatile` inside `unsafe` blocks instruct `rustc` and LLVM to execute physical memory bus transactions every time without caching values in CPU registers or optimizing away repeated reads.
> 2. **Type-Safe Hardware Drivers**: Tuple struct wrappers around raw memory pointers (`base_ptr: *mut u32`) abstract physical hardware registers into safe Rust API calls (`enable()`, `transmit_byte()`, `receive_byte()`).
> 3. **Pointer Scaling for MMIO Offset Arithmetic**: `base_ptr.add(offset)` calculates target 32-bit register addresses by scaling `offset` by `size_of::<u32>()` (4 bytes per register index).
> 4. **Bare-Metal Mock Testing**: Passing raw pointers of local stack arrays (`[u32; 3]`) allows unit testing bare-metal embedded drivers in `no_std` environments without needing physical hardware target microcontrollers.
> 
---

## 7. Related Terms

- [Raw Pointers (`*const T`, `*mut T`)](../level_13/raw_pointers.md) — Unsafe pointer types that bypass borrow checking.
- [`unsafe fn`](../level_13/unsafe_fn.md) — Functions with caller-enforced safety contracts.
- [Undefined Behavior (UB)](../level_13/undefined_behavior.md) — Invalid operations that break compiler execution guarantees.
- [FFI (Foreign Function Interface)](../level_13/ffi.md) — Interoperability bindings between Rust and foreign languages like C.

---

## 8. Key Takeaways

- `unsafe` blocks unlock 5 superpowers: dereferencing raw pointers, calling unsafe fns/FFI, mutating mutable statics, implementing unsafe traits, and accessing union fields.
- `unsafe` does NOT disable type checking, lifetime verification, or standard borrow checking.
- The idiomatic Rust pattern is wrapping internal `unsafe` code inside 100% safe public API functions.
- Always document `unsafe` blocks with `// SAFETY:` comments explaining why safety invariants hold.
