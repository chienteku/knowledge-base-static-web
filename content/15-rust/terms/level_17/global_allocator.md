# `global_allocator`

> **Level 17 — Embedded & Systems Programming**
> A static attribute (`#[global_allocator]`) that registers a custom heap memory manager implementing the `GlobalAlloc` trait as the application's global memory allocator for `std` or `#![no_std]` + `alloc` environments.

---

## 1. Prerequisites


- [Allocator API](../level_15/allocator_api.md) — The `GlobalAlloc` trait framework configured by `#[global_allocator]`.
- [`alloc` Library](alloc_library.md) — The heap collection library powered by `#[global_allocator]`.

---

## 2. Term Category

**Attribute / Memory / Embedded**: `#[global_allocator]` is a compiler attribute placed on a static item implementing `std::alloc::GlobalAlloc` (or `core::alloc::GlobalAlloc`). It routes every dynamic memory request (`Box`, `Vec`, `String`) in the application through the designated allocator instance.

---

## 3. Environment Context

**Universal Memory Systems**: Used to swap high-concurrency allocators (`jemalloc`/`mimalloc`) in production web servers, or to provide custom pool/bump allocators on `#![no_std]` embedded microcontrollers.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"

In `#![no_std]` embedded applications or custom OS kernels:
- There is no default operating system `malloc`/`free`.
- If you use the `alloc` crate for dynamic vectors or strings, Cargo needs to know *which* memory allocator implementation should handle raw memory requests.

`#[global_allocator]` provides a single point of registration:
1. Implement `unsafe impl GlobalAlloc for MyAllocator`.
2. Annotate a static instance with `#[global_allocator]`.
3. All `Vec::push`, `Box::new`, and `String::from` calls automatically invoke your allocator's `alloc` and `dealloc` methods!

### (2) Code Examples

#### Registering an Embedded Bump Allocator with `#[global_allocator]`

```rust
#![no_std]
extern crate alloc;

use core::alloc::{GlobalAlloc, Layout};
use core::ptr::null_mut;

/// A trivial dummy allocator for embedded demonstration
pub struct DummyEmbeddedAllocator;

unsafe impl GlobalAlloc for DummyEmbeddedAllocator {
    unsafe fn alloc(&self, _layout: Layout) -> *mut u8 {
        // Return raw memory pointer from embedded heap buffer
        null_mut()
    }

    unsafe fn dealloc(&self, _ptr: *mut u8, _layout: Layout) {
        // Free raw memory pointer
    }
}

// 1. Register static allocator instance globally!
#[global_allocator]
static ALLOCATOR: DummyEmbeddedAllocator = DummyEmbeddedAllocator;

pub fn allocate_test() {
    // Uses `ALLOCATOR.alloc()` under the hood!
    let _v: alloc::vec::Vec<u8> = alloc::vec::Vec::with_capacity(16);
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Defining Multiple `#[global_allocator]` Statics in a Workspace

**The mistake:** Defining `#[global_allocator]` in multiple sub-crates of a single binary.

**Why it's wrong:** An application can have only ONE global memory allocator. Multiple statics cause a link-time duplicate symbol error.

---

## 6. Practice Exercises

### Exercise 1: Thread-Safe Fixed-Buffer Bump Allocator with Alignment Handling

**Problem:** In bare-metal embedded microcontrollers without OS heap management, dynamic memory must be allocated from static RAM buffers. Implement a `#![no_std]` thread-safe Bump (Arena) Allocator `BumpAllocator<const SIZE: usize>` that implements `core::alloc::GlobalAlloc`. The allocator must guarantee proper memory alignment for requested types, track total allocated bytes and count via atomic operations, and handle out-of-memory situations gracefully by returning a null pointer. Include a unit test demonstrating heap allocation with `alloc::vec::Vec` and `alloc::boxed::Box`.

> [!check]- Answer
> ```rust
> #![no_std]
> extern crate alloc;
> 
> use core::alloc::{GlobalAlloc, Layout};
> use core::cell::UnsafeCell;
> use core::ptr::null_mut;
> use core::sync::atomic::{AtomicUsize, Ordering};
> 
> /// A thread-safe bump allocator using a static backing buffer.
> pub struct BumpAllocator<const SIZE: usize> {
>     heap: UnsafeCell<[u8; SIZE]>,
>     next: AtomicUsize,
>     allocations: AtomicUsize,
> }
> 
> unsafe impl<const SIZE: usize> Sync for BumpAllocator<SIZE> {}
> 
> impl<const SIZE: usize> BumpAllocator<SIZE> {
>     pub const fn new() -> Self {
>         BumpAllocator {
>             heap: UnsafeCell::new([0u8; SIZE]),
>             next: AtomicUsize::new(0),
>             allocations: AtomicUsize::new(0),
>         }
>     }
> 
>     pub fn allocated_bytes(&self) -> usize {
>         self.next.load(Ordering::Relaxed)
>     }
> 
>     pub fn allocation_count(&self) -> usize {
>         self.allocations.load(Ordering::Relaxed)
>     }
> }
> 
> unsafe impl<const SIZE: usize> GlobalAlloc for BumpAllocator<SIZE> {
>     unsafe fn alloc(&self, layout: Layout) -> *mut u8 {
>         let align = layout.align();
>         let size = layout.size();
> 
>         let mut current = self.next.load(Ordering::Relaxed);
>         loop {
>             let heap_start = self.heap.get() as usize;
>             let current_addr = heap_start + current;
>             // Align upwards to the nearest multiple of `align`
>             let aligned_addr = (current_addr + align - 1) & !(align - 1);
>             let offset = aligned_addr - heap_start;
> 
>             if offset + size > SIZE {
>                 return null_mut(); // Out of memory
>             }
> 
>             match self.next.compare_exchange_weak(
>                 current,
>                 offset + size,
>                 Ordering::AcqRel,
>                 Ordering::Relaxed,
>             ) {
>                 Ok(_) => {
>                     self.allocations.fetch_add(1, Ordering::Relaxed);
>                     return aligned_addr as *mut u8;
>                 }
>                 Err(actual) => current = actual,
>             }
>         }
>     }
> 
>     unsafe fn dealloc(&self, _ptr: *mut u8, _layout: Layout) {
>         // Bump allocators reset all memory at once rather than freeing individual blocks
>     }
> }
> 
> #[global_allocator]
> static ALLOCATOR: BumpAllocator<4096> = BumpAllocator::new();
> 
> pub fn test_bump_allocator() {
>     let initial_bytes = ALLOCATOR.allocated_bytes();
>     let initial_count = ALLOCATOR.allocation_count();
> 
>     // Allocate dynamic collection using alloc crate
>     let mut numbers: alloc::vec::Vec<u32> = alloc::vec::Vec::with_capacity(4);
>     numbers.push(100);
>     numbers.push(200);
>     numbers.push(300);
> 
>     assert_eq!(numbers.len(), 3);
>     assert_eq!(numbers[0], 100);
>     assert_eq!(numbers[1], 200);
>     assert_eq!(numbers[2], 300);
> 
>     // Verify tracking counters increased
>     assert!(ALLOCATOR.allocated_bytes() > initial_bytes);
>     assert!(ALLOCATOR.allocation_count() > initial_count);
> 
>     // Test Box allocation
>     let boxed_val = alloc::boxed::Box::new(42u64);
>     assert_eq!(*boxed_val, 42);
> }
> ```
>
> **Explanation:**
> 1. **`UnsafeCell` & `Sync` Implementation:** In Rust, static variables mutated across threads require interior mutability. Wrapping the raw heap array in `UnsafeCell` allows interior mutability, while `unsafe impl Sync` asserts that atomic lock-free operations protect concurrent access.
> 2. **Alignment Calculation:** Memory allocations require addresses to be aligned to powers of two matching `layout.align()`. `(current_addr + align - 1) & !(align - 1)` rounds the pointer up to the required alignment boundary.
> 3. **Lock-Free Bump Allocation:** `compare_exchange_weak` atomically updates `self.next` from `current` to `offset + size`. If another core or interrupt thread modified `next` concurrently, the loop retries with the updated offset.
> 4. **Registration via `#[global_allocator]`:** Annotating `static ALLOCATOR` routes all `alloc` requests (`Vec::with_capacity`, `Box::new`) directly to our `BumpAllocator::alloc` implementation.
 
 ---
 
### Exercise 2: Memory Profiling & Allocation Tracking Wrapper Allocator

**Problem:** During systems debugging and software profiling, developers must monitor heap memory consumption, detect memory leaks, and identify peak usage. Implement a generic decorator allocator `TrackingAllocator<A: GlobalAlloc>` that wraps an inner allocator and tracks active memory usage, peak memory usage, and total allocation/deallocation call counts. Write a test function using `std::alloc::System` proving that dropping heap data correctly decrements active memory metrics.

> [!check]- Answer
> ```rust
> use std::alloc::{GlobalAlloc, Layout, System};
> use std::sync::atomic::{AtomicUsize, Ordering};
> 
> /// Wrapper allocator tracking allocation metrics in real-time.
> pub struct TrackingAllocator<A: GlobalAlloc> {
>     inner: A,
>     currently_allocated: AtomicUsize,
>     total_allocations: AtomicUsize,
>     total_deallocations: AtomicUsize,
>     peak_memory: AtomicUsize,
> }
> 
> impl<A: GlobalAlloc> TrackingAllocator<A> {
>     pub const fn new(inner: A) -> Self {
>         TrackingAllocator {
>             inner,
>             currently_allocated: AtomicUsize::new(0),
>             total_allocations: AtomicUsize::new(0),
>             total_deallocations: AtomicUsize::new(0),
>             peak_memory: AtomicUsize::new(0),
>         }
>     }
> 
>     pub fn current_usage(&self) -> usize {
>         self.currently_allocated.load(Ordering::Relaxed)
>     }
> 
>     pub fn peak_usage(&self) -> usize {
>         self.peak_memory.load(Ordering::Relaxed)
>     }
> 
>     pub fn allocation_count(&self) -> usize {
>         self.total_allocations.load(Ordering::Relaxed)
>     }
> 
>     pub fn deallocation_count(&self) -> usize {
>         self.total_deallocations.load(Ordering::Relaxed)
>     }
> }
> 
> unsafe impl<A: GlobalAlloc> GlobalAlloc for TrackingAllocator<A> {
>     unsafe fn alloc(&self, layout: Layout) -> *mut u8 {
>         let ptr = self.inner.alloc(layout);
>         if !ptr.is_null() {
>             let size = layout.size();
>             self.total_allocations.fetch_add(1, Ordering::Relaxed);
>             let prev = self.currently_allocated.fetch_add(size, Ordering::Relaxed);
>             let current = prev + size;
> 
>             // Atomically update peak memory usage
>             let mut peak = self.peak_memory.load(Ordering::Relaxed);
>             while current > peak {
>                 match self.peak_memory.compare_exchange_weak(
>                     peak,
>                     current,
>                     Ordering::Relaxed,
>                     Ordering::Relaxed,
>                 ) {
>                     Ok(_) => break,
>                     Err(actual) => peak = actual,
>                 }
>             }
>         }
>         ptr
>     }
> 
>     unsafe fn dealloc(&self, ptr: *mut u8, layout: Layout) {
>         self.inner.dealloc(ptr, layout);
>         let size = layout.size();
>         self.total_deallocations.fetch_add(1, Ordering::Relaxed);
>         self.currently_allocated.fetch_sub(size, Ordering::Relaxed);
>     }
> }
> 
> #[global_allocator]
> static ALLOCATOR: TrackingAllocator<System> = TrackingAllocator::new(System);
> 
> pub fn test_tracking_allocator() {
>     let initial_allocated = ALLOCATOR.current_usage();
>     let initial_allocs = ALLOCATOR.allocation_count();
>     let initial_deallocs = ALLOCATOR.deallocation_count();
> 
>     {
>         let mut data: Vec<u8> = Vec::with_capacity(1024);
>         data.extend_from_slice(&[0xAA; 512]);
> 
>         assert!(ALLOCATOR.current_usage() >= 1024);
>         assert!(ALLOCATOR.peak_usage() >= 1024);
>         assert_eq!(ALLOCATOR.allocation_count(), initial_allocs + 1);
>         assert_eq!(ALLOCATOR.deallocation_count(), initial_deallocs);
>     } // `data` goes out of scope here, triggering `dealloc` via RAII!
> 
>     assert_eq!(ALLOCATOR.current_usage(), initial_allocated);
>     assert_eq!(ALLOCATOR.deallocation_count(), initial_deallocs + 1);
> }
> ```
> >
> **Explanation:**
> 1. **Decorator Allocator Design Pattern:** `TrackingAllocator` wraps an existing `GlobalAlloc` implementation (such as system malloc `std::alloc::System` or custom OS heap allocator). It delegates actual raw byte allocation to `self.inner` while intercepting `alloc` and `dealloc` calls to maintain statistics.
> 2. **Atomic Accounting:** `fetch_add` and `fetch_sub` provide thread-safe counter modifications without full mutex locking overhead.
> 3. **Compare-And-Swap (CAS) Peak Tracking:** Updating `peak_memory` uses a `compare_exchange_weak` loop to ensure that concurrent allocations across multiple threads correctly update the maximum recorded high-water mark without race conditions.
> 4. **RAII Drop Verification:** When `data` drops at the end of the inner block scope, Rust automatically invokes `GlobalAlloc::dealloc`, decrements `currently_allocated`, and increments `deallocation_count`.

---

### Exercise 3: Constant-Time Fixed-Size Block Pool Allocator for Real-Time Embedded Systems
 
**Problem:** In mission-critical real-time embedded applications (such as flight controllers or automotive microcontrollers), memory allocation must take deterministic $O(1)$ constant time with zero heap fragmentation. Implement a `#![no_std]` fixed-size block pool allocator `FixedBlockAllocator<const BLOCK_SIZE: usize, const NUM_BLOCKS: usize>` managing a static memory pool using an embedded free-list index. Implement `GlobalAlloc` to return blocks when requests fit `BLOCK_SIZE` and handle block recycling on `dealloc`. Include unit tests validating block allocation, deallocation, block reuse, and out-of-memory behavior.

> [!check]- Answer
> ```rust
> #![no_std]
> extern crate alloc;
> 
> use core::alloc::{GlobalAlloc, Layout};
> use core::cell::UnsafeCell;
> use core::ptr::null_mut;
> use core::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
> 
> /// Fixed-size block pool allocator providing O(1) allocation/deallocation.
> pub struct FixedBlockAllocator<const BLOCK_SIZE: usize, const NUM_BLOCKS: usize> {
>     pool: UnsafeCell<[[u8; BLOCK_SIZE]; NUM_BLOCKS]>,
>     next_free: UnsafeCell<[i32; NUM_BLOCKS]>,
>     free_head: UnsafeCell<i32>,
>     lock: AtomicBool,
>     active_allocations: AtomicUsize,
> }
> 
> unsafe impl<const BLOCK_SIZE: usize, const NUM_BLOCKS: usize> Sync
>     for FixedBlockAllocator<BLOCK_SIZE, NUM_BLOCKS> {}
> 
> impl<const BLOCK_SIZE: usize, const NUM_BLOCKS: usize> FixedBlockAllocator<BLOCK_SIZE, NUM_BLOCKS> {
>     pub const fn new() -> Self {
>         let mut next_free = [-1i32; NUM_BLOCKS];
>         let mut i = 0;
>         while i < NUM_BLOCKS - 1 {
>             next_free[i] = (i + 1) as i32;
>             i += 1;
>         }
> 
>         FixedBlockAllocator {
>             pool: UnsafeCell::new([[0u8; BLOCK_SIZE]; NUM_BLOCKS]),
>             next_free: UnsafeCell::new(next_free),
>             free_head: UnsafeCell::new(0),
>             lock: AtomicBool::new(false),
>             active_allocations: AtomicUsize::new(0),
>         }
>     }
> 
>     fn acquire_lock(&self) {
>         while self.lock.swap(true, Ordering::Acquire) {
>             core::hint::spin_loop();
>         }
>     }
> 
>     fn release_lock(&self) {
>         self.lock.store(false, Ordering::Release);
>     }
> 
>     pub fn active_count(&self) -> usize {
>         self.active_allocations.load(Ordering::Relaxed)
>     }
> }
> 
> unsafe impl<const BLOCK_SIZE: usize, const NUM_BLOCKS: usize> GlobalAlloc
>     for FixedBlockAllocator<BLOCK_SIZE, NUM_BLOCKS>
> {
>     unsafe fn alloc(&self, layout: Layout) -> *mut u8 {
>         // Reject allocations exceeding fixed block size or alignment constraints
>         if layout.size() > BLOCK_SIZE || layout.align() > BLOCK_SIZE {
>             return null_mut();
>         }
> 
>         self.acquire_lock();
>         let head = *self.free_head.get();
>         if head == -1 {
>             self.release_lock();
>             return null_mut(); // Pool exhausted
>         }
> 
>         let block_idx = head as usize;
>         let next_idx = (*self.next_free.get())[block_idx];
>         *self.free_head.get() = next_idx;
>         self.active_allocations.fetch_add(1, Ordering::Relaxed);
>         self.release_lock();
> 
>         let pool_ptr = self.pool.get() as *mut u8;
>         pool_ptr.add(block_idx * BLOCK_SIZE)
>     }
> 
>     unsafe fn dealloc(&self, ptr: *mut u8, layout: Layout) {
>         if ptr.is_null() {
>             return;
>         }
> 
>         let pool_start = self.pool.get() as *mut u8;
>         let offset = ptr as usize - pool_start as usize;
>         let block_idx = offset / BLOCK_SIZE;
> 
>         self.acquire_lock();
>         let current_head = *self.free_head.get();
>         (*self.next_free.get())[block_idx] = current_head;
>         *self.free_head.get() = block_idx as i32;
>         self.active_allocations.fetch_sub(1, Ordering::Relaxed);
>         self.release_lock();
>     }
> }
> 
> #[global_allocator]
> static ALLOCATOR: FixedBlockAllocator<64, 8> = FixedBlockAllocator::new();
> 
> pub fn test_block_allocator() {
>     let initial_active = ALLOCATOR.active_count();
> 
>     // 1. Allocate block
>     let b1 = alloc::boxed::Box::new([0x11u8; 32]);
>     assert_eq!(ALLOCATOR.active_count(), initial_active + 1);
> 
>     // 2. Allocate second block
>     let b2 = alloc::boxed::Box::new([0x22u8; 64]);
>     assert_eq!(ALLOCATOR.active_count(), initial_active + 2);
> 
>     assert_eq!(b1[0], 0x11);
>     assert_eq!(b2[0], 0x22);
> 
>     // 3. Drop b1 to return block to pool free-list
>     core::mem::drop(b1);
>     assert_eq!(ALLOCATOR.active_count(), initial_active + 1);
> 
>     // 4. Allocate b3, re-using freed block #0
>     let b3 = alloc::boxed::Box::new([0x33u8; 16]);
>     assert_eq!(ALLOCATOR.active_count(), initial_active + 2);
>     assert_eq!(b3[0], 0x33);
> }
> ```
> >
> **Explanation:**
> 1. **$O(1)$ Free-List Pool Strategy:** Instead of scanning heap metadata or splitting contiguous spans, `FixedBlockAllocator` links free blocks in a stack-like single-linked list indexed by `next_free`. `alloc` pops from `free_head` in $O(1)$ time, and `dealloc` pushes back onto `free_head` in $O(1)$ time.
> 2. **Spinlock Synchronization:** `AtomicBool::swap(true, Acquire)` provides lightweight mutual exclusion in `#![no_std]` bare-metal environments where OS mutexes are unavailable. `core::hint::spin_loop()` notifies CPU execution hardware of busy waiting.
> 3. **Pointer Arithmetic for Deallocation:** `dealloc` calculates the index of the freed block by finding `(ptr - pool_start) / BLOCK_SIZE`. This avoids searching through tables or maintaining per-block header metadata overhead.
> 4. **Deterministic OOM & Recycling:** If all blocks are allocated (`free_head == -1`), `alloc` returns `null_mut()`. When objects drop, their block indices are immediately returned to `free_head`, enabling deterministic memory reuse without external fragmentation.

---
 
---

## 6. Related Terms

**None.**

---

## 7. Key Takeaways
 
- `#[global_allocator]` registers the global memory allocator static instance.
- Must implement the `GlobalAlloc` trait.
- Essential for enabling `alloc` heap collections (`Vec`, `Box`) in `#![no_std]` environments.
- Only one `#[global_allocator]` can be defined per binary application.
