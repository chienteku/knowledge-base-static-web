# Allocator API

> **Level 15 — Performance & Optimization**
> The standard library memory allocation framework (`std::alloc::GlobalAlloc` and `std::alloc::Allocator`) that allows custom global memory allocators (such as `jemalloc` or `mimalloc`) or per-collection custom arena allocators to replace default system memory allocation routines.

---

## 1. Prerequisites

- [Stack vs Heap](../level_15/stack_vs_heap.md) — Understanding dynamic heap memory allocation trade-offs.
- [`unsafe` Block](../level_13/unsafe_block.md) — Raw memory allocation traits require `unsafe fn` implementations.
- [Raw Pointers (`*const T`, `*mut T`)](../level_13/raw_pointers.md) — Allocators return and free raw byte pointers.

---

## 2. Term Category

**Performance / Memory / System**: The Allocator API is Rust's memory management abstraction layer. It defines how Rust requests, resizes, and frees dynamic heap memory blocks. By implementing the `GlobalAlloc` trait (`#[global_allocator]`), developers can swap out the default system allocator (e.g. system `malloc`/`free` or `HeapAlloc`) for high-performance multithreaded allocators like `jemalloc` or `mimalloc`, or implement custom arena/bump allocators for embedded `#![no_std]` environments.

---

## 3. Environment Context

**Universal Rust**: Global allocators (`GlobalAlloc`) can be configured across all Rust environments (`std` and `#![no_std]`). In `#![no_std]` embedded microcontrollers, defining a custom `#[global_allocator]` is mandatory if heap collections (`Vec`, `Box`) are enabled via the `alloc` crate.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"

By default, standard Rust programs use the operating system's default C memory allocator (`glibc malloc` on Linux, `mapt/heap` on macOS/Windows):
- The default OS allocator is designed as a general-purpose compromise for all software on the computer.
- Under heavy, highly concurrent multi-threaded workloads (such as high-throughput web servers or database engines like RocksDB), OS allocators suffer from **thread lock contention** and **memory fragmentation**.
- On embedded microcontrollers (`no_std` environments), there is NO operating system `malloc` available at all!

Furthermore, game engines and real-time audio processors need **Arena/Bump Allocators** (where thousands of small objects are allocated rapidly in a contiguous block of pre-reserved memory and cleared all at once in $O(1)$ time, bypassing `free()` overhead entirely).

Rust introduced the **Allocator API** to solve this:
1. **`#[global_allocator]`**: Allows swapping the entire application's heap memory engine globally with 1 line of code (e.g. switching to `tikv-jemallocator` or `mimalloc`).
2. **`GlobalAlloc` Trait**: Requires implementing two fundamental unsafe methods: `unsafe fn alloc(&self, layout: Layout) -> *mut u8` and `unsafe fn dealloc(&self, ptr: *mut u8, layout: Layout)`.
3. **`Allocator` Trait (Nightly)**: Allows passing custom allocators to individual collections (`Vec<T, A>`, `Box<T, A>`), enabling per-struct arena allocation.

### (2) Reality Metaphor

Imagine a **Construction Site Material Procurement System**:

- **Default System Allocator (`malloc`)** is calling the city's general municipal lumberyard every time a worker needs a single 2x4 board:
  - The worker phones the municipal dispatcher (**sys-call to OS `malloc`**).
  - The dispatcher checks inventory across the city (**allocator search lock**), writes a receipt, and delivers 1 board (**returns pointer**).
  - Calling the city lumberyard 100,000 times a minute creates massive phone line congestion (**allocator thread lock contention**).
- **Custom Global Allocator (`#[global_allocator] jemalloc`)** is hiring a specialized high-speed private logistics company:
  - The private company maintains pre-stocked material hubs on every floor (**thread-local allocation caches**).
  - Workers grab boards instantly without waiting on city phone lines (**$O(1)$ lock-free thread allocation**).
- **Arena / Bump Allocator** is buying a massive pre-cut stack of lumber at the start of the shift:
  - Workers take boards sequentially off the top of the stack (**bump allocation**). At the end of the shift, the entire empty pallet is recycled in 1 second (**$O(1)$ deallocation**).

### (3) Code Examples

#### Short Snippet (Swapping Global Allocator to `mimalloc`)

```rust
// Cargo.toml setup:
// [dependencies]
// mimalloc = "0.1"

use mimalloc::MiMalloc;

// 1. Declare `MiMalloc` as the application's global memory allocator!
// Every `Box`, `Vec`, and `String` allocation in the app will now use high-performance mimalloc.
#[global_allocator]
static GLOBAL: MiMalloc = MiMalloc;

fn main() {
    // This Vec allocation uses `mimalloc` automatically under the hood:
    let data: Vec<i32> = (0..1_000_000).collect();
    println!("Allocated 1,000,000 integers using custom MiMalloc allocator! Length: {}", data.len());
}
```

#### Fuller Example (Implementing a Custom Minimal `GlobalAlloc` Tracking Allocator)

```rust
use std::alloc::{GlobalAlloc, Layout, System};
use std::sync::atomic::{AtomicUsize, Ordering};

/// A custom wrapper allocator that tracks total active heap memory bytes allocated
pub struct CountingAllocator;

static ALLOCATED_BYTES: AtomicUsize = AtomicUsize::new(0);

unsafe impl GlobalAlloc for CountingAllocator {
    unsafe fn alloc(&self, layout: Layout) -> *mut u8 {
        // Delegate actual raw allocation to System allocator
        let ptr = System.alloc(layout);
        if !ptr.is_null() {
            // Track allocated byte size atomically
            ALLOCATED_BYTES.fetch_add(layout.size(), Ordering::SeqCst);
        }
        ptr
    }

    unsafe fn dealloc(&self, ptr: *mut u8, layout: Layout) {
        // Delegate actual deallocation to System allocator
        System.dealloc(ptr, layout);
        // Track deallocated byte size atomically
        ALLOCATED_BYTES.fetch_sub(layout.size(), Ordering::SeqCst);
    }
}

// Register custom counting allocator as global allocator
#[global_allocator]
static GLOBAL_COUNTER: CountingAllocator = CountingAllocator;

fn get_active_heap_bytes() -> usize {
    ALLOCATED_BYTES.load(Ordering::SeqCst)
}

fn main() {
    println!("Initial active heap memory: {} bytes", get_active_heap_bytes());

    {
        let _data: Vec<u8> = vec![0u8; 1024]; // Allocate 1024 bytes
        println!("Active heap after Vec allocation: {} bytes", get_active_heap_bytes());
    } // `_data` dropped here!

    println!("Active heap after Vec drop: {} bytes", get_active_heap_bytes());
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Memory Alignment Violations in Custom `alloc` Implementations

**The mistake:** Returning a pointer from a custom `GlobalAlloc::alloc` implementation that is not aligned to `layout.align()`.

**Why it's wrong:** Hardware architectures and LLVM optimizations require memory pointers to be aligned to the scalar size of the data type (e.g., `u64` must be aligned to 8-byte boundary offsets). Returning an unaligned pointer from a custom allocator causes Undefined Behavior or hardware alignment fault crashes.

*Incorrect:*
```rust
unsafe impl GlobalAlloc for BadAllocator {
    unsafe fn alloc(&self, layout: Layout) -> *mut u8 {
        // ❌ Ignoring layout.align() risks unaligned pointer returning!
        let raw_ptr = get_raw_memory(); 
        raw_ptr
    }
    unsafe fn dealloc(&self, _ptr: *mut u8, _layout: Layout) {}
}
```

*Fix:*
```rust
// Ensure returned pointers satisfy layout.align() alignment requirements
```

### Mistake 2: Calling Heap Allocations inside `GlobalAlloc::alloc` (Infinite Recursion)

**The mistake:** Attempting to log allocation metrics using `println!()` or allocating a `Vec` *inside* `GlobalAlloc::alloc()`.

**Why it's wrong:** `println!()` and `Vec::new()` allocate heap memory internally. Calling them inside `alloc()` invokes `GlobalAlloc::alloc` recursively, causing an immediate infinite stack overflow crash!

*Incorrect:*
```rust
unsafe fn alloc(&self, layout: Layout) -> *mut u8 {
    // ❌ Invokes heap allocation inside alloc(), causing infinite recursive stack overflow!
    println!("Allocating {} bytes", layout.size()); 
    System.alloc(layout)
}
```

*Fix:*
```rust
// Use atomic counters or raw stdout syscalls that perform 0 heap allocations
```

### Mistake 3: Mismatched Deallocation `Layout` Specs

**The mistake:** Passing a different `Layout` to `dealloc` than the `Layout` passed during `alloc`.

**Why it's wrong:** Allocators rely on `layout.size()` and `layout.align()` during `dealloc` to locate memory bucket headers. Passing a mismatched layout causes heap corruption.

---

## 6. Practice Exercises

### Exercise 1: Building a `#![no_std]` Fixed-Capacity Bump Arena Allocator

**Problem:** In real-time embedded systems (such as a UAV flight controller or high-speed telemetry sampler operating in a `#![no_std]` environment), dynamic OS memory allocation via standard `malloc` is unavailable or prohibited due to non-deterministic latencies and memory fragmentation risks.

Implement a `#![no_std]` fixed-capacity Bump Arena Allocator (`BumpArena<const N: usize>`) that allocates contiguous bytes from an internal byte buffer. Your allocator must:
1. Correctly align memory pointers according to requested `Layout::align()`.
2. Return a null pointer (`core::ptr::null_mut()`) when an allocation exceeds remaining arena capacity (OOM).
3. Support resetting the allocation offset back to `0` in $O(1)$ time between frame processing cycles.
4. Include test assertions proving alignment, bounds checks, and arena resetting.

> [!check]- Answer
> ```rust
> #![no_std]
> 
> use core::alloc::Layout;
> use core::cell::UnsafeCell;
> use core::ptr::null_mut;
> use core::sync::atomic::{AtomicUsize, Ordering};
> 
> /// A fixed-capacity bump arena allocator for `#![no_std]` embedded targets.
> pub struct BumpArena<const N: usize> {
>     buffer: UnsafeCell<[u8; N]>,
>     offset: AtomicUsize,
> }
> 
> // Safety: BumpArena manages internal thread-safe bump pointer offsets via atomic operations.
> unsafe impl<const N: usize> Sync for BumpArena<N> {}
> 
> impl<const N: usize> BumpArena<N> {
>     /// Creates a new, zero-initialized `BumpArena`.
>     pub const fn new() -> Self {
>         Self {
>             buffer: UnsafeCell::new([0u8; N]),
>             offset: AtomicUsize::new(0),
>         }
>     }
> 
>     /// Allocates memory block matching the specified `Layout`.
>     /// Returns raw `*mut u8` pointer, or `null_mut()` on OOM / alignment overflow.
>     pub unsafe fn alloc(&self, layout: Layout) -> *mut u8 {
>         let size = layout.size();
>         let align = layout.align();
> 
>         let base_ptr = self.buffer.get() as usize;
>         let mut current_offset = self.offset.load(Ordering::Relaxed);
> 
>         loop {
>             let current_addr = base_ptr + current_offset;
>             
>             // Compute next aligned address: (addr + align - 1) & !(align - 1)
>             let aligned_addr = match current_addr.checked_add(align - 1) {
>                 Some(val) => val & !(align - 1),
>                 None => return null_mut(),
>             };
> 
>             let new_offset = match aligned_addr.checked_sub(base_ptr) {
>                 Some(off) => match off.checked_add(size) {
>                     Some(end) => end,
>                     None => return null_mut(),
>                 },
>                 None => return null_mut(),
>             };
> 
>             if new_offset > N {
>                 return null_mut(); // Out of memory
>             }
> 
>             // Atomically update bump offset to reserve space
>             match self.offset.compare_exchange_weak(
>                 current_offset,
>                 new_offset,
>                 Ordering::AcqRel,
>                 Ordering::Relaxed,
>             ) {
>                 Ok(_) => return aligned_addr as *mut u8,
>                 Err(actual) => current_offset = actual,
>             }
>         }
>     }
> 
>     /// Resets the bump allocator offset back to zero in O(1) time.
>     pub fn reset(&self) {
>         self.offset.store(0, Ordering::Release);
>     }
> 
>     /// Returns current total bytes allocated in the arena.
>     pub fn allocated_bytes(&self) -> usize {
>         self.offset.load(Ordering::Relaxed)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_bump_arena_alignment_and_reset() {
>         let arena: BumpArena<1024> = BumpArena::new();
> 
>         // 1. Allocate 8-byte aligned u64
>         let layout_u64 = Layout::from_size_align(8, 8).unwrap();
>         let ptr1 = unsafe { arena.alloc(layout_u64) };
>         assert!(!ptr1.is_null());
>         assert_eq!(ptr1 as usize % 8, 0, "Pointer must be 8-byte aligned");
> 
>         // 2. Allocate 1-byte aligned u8
>         let layout_u8 = Layout::from_size_align(1, 1).unwrap();
>         let ptr2 = unsafe { arena.alloc(layout_u8) };
>         assert!(!ptr2.is_null());
> 
>         // 3. Allocate 16-byte aligned SIMD vector block
>         let layout_simd = Layout::from_size_align(16, 16).unwrap();
>         let ptr3 = unsafe { arena.alloc(layout_simd) };
>         assert!(!ptr3.is_null());
>         assert_eq!(ptr3 as usize % 16, 0, "Pointer must be 16-byte aligned");
> 
>         // 4. Test arena reset and memory address reuse
>         arena.reset();
>         assert_eq!(arena.allocated_bytes(), 0);
> 
>         let ptr1_reused = unsafe { arena.alloc(layout_u64) };
>         assert_eq!(ptr1, ptr1_reused, "Reset must reuse starting arena space");
>     }
> 
>     #[test]
>     fn test_bump_arena_oom_rejection() {
>         let arena: BumpArena<64> = BumpArena::new();
>         let layout = Layout::from_size_align(32, 8).unwrap();
> 
>         let p1 = unsafe { arena.alloc(layout) };
>         assert!(!p1.is_null());
> 
>         let p2 = unsafe { arena.alloc(layout) };
>         assert!(!p2.is_null());
> 
>         // 32 + 32 = 64 bytes allocated. Next request exceeds 64-byte arena.
>         let p3 = unsafe { arena.alloc(layout) };
>         assert!(p3.is_null(), "Exceeding capacity must return null pointer");
>     }
> }
> ```
>
> **Explanation:**
> 1. **Alignment Calculation (`(addr + align - 1) & !(align - 1)`):** Memory allocations must start at an address divisible by `layout.align()`. Bitwise ANDing with the bit-inverted mask `!(align - 1)` rounds up the address to the next aligned multiple.
> 2. **Atomic Bump Pointer (`compare_exchange_weak`):** By updating `self.offset` atomically, multiple tasks can allocate from the arena without coarse OS mutex locks.
> 3. **$O(1)$ Deallocation via `reset()`:** Individual allocations do not have destructor calls in bump arenas; setting `offset = 0` reclaims all memory instantaneously.

---

### Exercise 2: High-Performance Fixed-Size Block Pool Allocator (Free-List)

**Problem:** High-Frequency Trading (HFT) order routers and network packet parsers process fixed-size message structures (e.g., 64-byte packet headers). Dynamic general-purpose allocators introduce unacceptable latency variance (jitter) and heap fragmentation.

Implement a fixed-size block pool allocator (`FixedBlockPool<const BLOCK_SIZE: usize, const CAPACITY: usize>`) that:
1. Pre-allocates a contiguous storage array of size `BLOCK_SIZE * CAPACITY`.
2. Maintains a free list stack of available block indices for $O(1)$ allocation and deallocation.
3. Validates deallocated pointers using debug assertions (`debug_assert!`) to catch out-of-bounds or misaligned pointers.
4. Includes unit tests demonstrating block allocation, exhaustion, and block index recycling.

> [!check]- Answer
> ```rust
> use core::ptr::null_mut;
> 
> /// A fixed-block pool allocator offering deterministic O(1) alloc/dealloc.
> pub struct FixedBlockPool<const BLOCK_SIZE: usize, const CAPACITY: usize> {
>     storage: [u8; BLOCK_SIZE * CAPACITY],
>     free_stack: [usize; CAPACITY],
>     free_top: usize,
> }
> 
> impl<const BLOCK_SIZE: usize, const CAPACITY: usize> FixedBlockPool<BLOCK_SIZE, CAPACITY> {
>     /// Constructs a new pool with all block indices pushed to the free stack.
>     pub fn new() -> Self {
>         assert!(BLOCK_SIZE > 0, "BLOCK_SIZE must be > 0");
>         assert!(CAPACITY > 0, "CAPACITY must be > 0");
> 
>         let mut free_stack = [0usize; CAPACITY];
>         let mut idx = 0;
>         while idx < CAPACITY {
>             free_stack[idx] = idx;
>             idx += 1;
>         }
> 
>         Self {
>             storage: [0u8; BLOCK_SIZE * CAPACITY],
>             free_stack,
>             free_top: CAPACITY,
>         }
>     }
> 
>     /// Allocates a single block of size `BLOCK_SIZE`.
>     /// Returns raw pointer `*mut u8` or `None` if the pool is exhausted.
>     pub fn allocate(&mut self) -> Option<*mut u8> {
>         if self.free_top == 0 {
>             return None; // Pool fully exhausted
>         }
>         self.free_top -= 1;
>         let block_idx = self.free_stack[self.free_top];
>         let byte_offset = block_idx * BLOCK_SIZE;
>         let ptr = unsafe { self.storage.as_mut_ptr().add(byte_offset) };
>         Some(ptr)
>     }
> 
>     /// Returns a previously allocated block back to the pool free list.
>     ///
>     /// # Safety
>     /// `ptr` must be a valid pointer previously returned by `allocate()` on this pool instance.
>     pub unsafe fn deallocate(&mut self, ptr: *mut u8) {
>         let storage_start = self.storage.as_ptr() as usize;
>         let ptr_val = ptr as usize;
> 
>         debug_assert!(ptr_val >= storage_start, "Pointer below pool memory bounds");
>         let offset = ptr_val - storage_start;
>         debug_assert!(offset % BLOCK_SIZE == 0, "Misaligned pointer deallocation");
>         
>         let block_idx = offset / BLOCK_SIZE;
>         debug_assert!(block_idx < CAPACITY, "Block index out of bounds");
>         debug_assert!(self.free_top < CAPACITY, "Free list stack overflow / double free");
> 
>         self.free_stack[self.free_top] = block_idx;
>         self.free_top += 1;
>     }
> 
>     /// Returns the count of currently available free blocks.
>     pub fn available_blocks(&self) -> usize {
>         self.free_top
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_fixed_block_pool_lifecycle() {
>         let mut pool: FixedBlockPool<64, 4> = FixedBlockPool::new();
>         assert_eq!(pool.available_blocks(), 4);
> 
>         // 1. Allocate all 4 blocks
>         let b0 = pool.allocate().expect("Allocation b0 failed");
>         let b1 = pool.allocate().expect("Allocation b1 failed");
>         let b2 = pool.allocate().expect("Allocation b2 failed");
>         let b3 = pool.allocate().expect("Allocation b3 failed");
>         assert_eq!(pool.available_blocks(), 0);
> 
>         // 2. Pool exhaustion check
>         assert!(pool.allocate().is_none(), "Pool must return None when exhausted");
> 
>         // 3. Verify deterministic stride separation (64 bytes between adjacent blocks)
>         let addr_diff = (b2 as usize).abs_diff(b3 as usize);
>         assert_eq!(addr_diff, 64, "Block pointers must be exactly BLOCK_SIZE apart");
> 
>         // 4. Return b3 to pool and verify immediate LIFO reuse
>         unsafe { pool.deallocate(b3) };
>         assert_eq!(pool.available_blocks(), 1);
> 
>         let b3_reused = pool.allocate().unwrap();
>         assert_eq!(b3, b3_reused, "Deallocated block must be recycled on next allocation");
> 
>         // Cleanup remaining blocks
>         unsafe {
>             pool.deallocate(b0);
>             pool.deallocate(b1);
>             pool.deallocate(b2);
>             pool.deallocate(b3_reused);
>         }
>         assert_eq!(pool.available_blocks(), 4);
>     }
> }
> ```
>
> **Explanation:**
> 1. **Zero Heap Fragmentation:** All allocations take place inside a pre-allocated array (`storage`). No operating system `malloc` calls occur during steady-state processing.
> 2. **Deterministic $O(1)$ Performance:** Pushing/popping from `free_stack` takes fixed CPU instruction cycles, eliminating unpredictable latency spikes.
> 3. **Intrusive/Stack Index Management:** Storing block indices in `free_stack` avoids allocating dynamic tracking overhead while guaranteeing memory safety checks during deallocation.

---

### Exercise 3: Hard-Limited Global Tracking Allocator with Metrics Auditing

**Problem:** Cloud edge microservices operating under container resource limits (e.g., Docker cgroups memory limits) need real-time memory telemetry and hard budget enforcement to avoid ungraceful OS `SIGKILL` termination.

Implement a custom `GlobalAlloc` wrapper struct (`BudgetedAllocator`) that:
1. Wraps `std::alloc::System` to delegate physical raw allocations.
2. Maintains atomic metrics for `CURRENT_BYTES`, `PEAK_BYTES`, total allocations, and total deallocations.
3. Rejects allocation requests with `core::ptr::null_mut()` if the request would cause `CURRENT_BYTES` to exceed a configurable limit `MAX_LIMIT`.
4. Includes unit tests verifying metric tracking and quota limit enforcement.

> [!check]- Answer
> ```rust
> use std::alloc::{GlobalAlloc, Layout, System};
> use std::sync::atomic::{AtomicUsize, Ordering};
> 
> /// Global allocator wrapper enforcing a hard byte limit and auditing live metrics.
> pub struct BudgetedAllocator {
>     max_limit: usize,
> }
> 
> static CURRENT_BYTES: AtomicUsize = AtomicUsize::new(0);
> static PEAK_BYTES: AtomicUsize = AtomicUsize::new(0);
> static TOTAL_ALLOCS: AtomicUsize = AtomicUsize::new(0);
> static TOTAL_FREES: AtomicUsize = AtomicUsize::new(0);
> 
> impl BudgetedAllocator {
>     pub const fn new(max_limit: usize) -> Self {
>         Self { max_limit }
>     }
> 
>     pub fn current_bytes() -> usize {
>         CURRENT_BYTES.load(Ordering::Relaxed)
>     }
> 
>     pub fn peak_bytes() -> usize {
>         PEAK_BYTES.load(Ordering::Relaxed)
>     }
> 
>     pub fn total_allocations() -> usize {
>         TOTAL_ALLOCS.load(Ordering::Relaxed)
>     }
> 
>     pub fn total_deallocations() -> usize {
>         TOTAL_FREES.load(Ordering::Relaxed)
>     }
> }
> 
> unsafe impl GlobalAlloc for BudgetedAllocator {
>     unsafe fn alloc(&self, layout: Layout) -> *mut u8 {
>         let size = layout.size();
>         let current = CURRENT_BYTES.load(Ordering::Relaxed);
> 
>         // Hard limit quota check
>         if current.saturating_add(size) > self.max_limit {
>             return std::ptr::null_mut(); // Reject allocation on budget overflow
>         }
> 
>         let ptr = System.alloc(layout);
>         if !ptr.is_null() {
>             let new_current = CURRENT_BYTES.fetch_add(size, Ordering::SeqCst) + size;
>             TOTAL_ALLOCS.fetch_add(1, Ordering::Relaxed);
> 
>             // Atomic lock-free peak usage tracking
>             let mut peak = PEAK_BYTES.load(Ordering::Relaxed);
>             while new_current > peak {
>                 match PEAK_BYTES.compare_exchange_weak(
>                     peak,
>                     new_current,
>                     Ordering::SeqCst,
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
>         System.dealloc(ptr, layout);
>         let size = layout.size();
>         CURRENT_BYTES.fetch_sub(size, Ordering::SeqCst);
>         TOTAL_FREES.fetch_add(1, Ordering::Relaxed);
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_budgeted_allocator_limits_and_metrics() {
>         // Configured with a 1024-byte hard limit
>         let allocator = BudgetedAllocator::new(1024);
> 
>         let layout_256 = Layout::from_size_align(256, 8).unwrap();
>         let layout_900 = Layout::from_size_align(900, 8).unwrap();
> 
>         let start_allocs = BudgetedAllocator::total_allocations();
>         let start_frees = BudgetedAllocator::total_deallocations();
> 
>         // 1. Allocate 256 bytes (within 1024 limit)
>         let ptr1 = unsafe { allocator.alloc(layout_256) };
>         assert!(!ptr1.is_null(), "256-byte allocation must succeed");
>         assert_eq!(BudgetedAllocator::current_bytes(), 256);
>         assert_eq!(BudgetedAllocator::peak_bytes(), 256);
>         assert_eq!(BudgetedAllocator::total_allocations(), start_allocs + 1);
> 
>         // 2. Attempt to allocate 900 bytes (256 + 900 = 1156 > 1024 -> must fail)
>         let ptr2 = unsafe { allocator.alloc(layout_900) };
>         assert!(ptr2.is_null(), "Allocation exceeding 1024 byte limit must return null");
>         assert_eq!(BudgetedAllocator::current_bytes(), 256, "Current bytes must not change");
> 
>         // 3. Deallocate ptr1
>         unsafe { allocator.dealloc(ptr1, layout_256) };
>         assert_eq!(BudgetedAllocator::current_bytes(), 0);
>         assert_eq!(BudgetedAllocator::peak_bytes(), 256, "Peak memory stat must be preserved");
>         assert_eq!(BudgetedAllocator::total_deallocations(), start_frees + 1);
>     }
> }
> ```
>
> **Explanation:**
> 1. **`GlobalAlloc` Trait Contracts:** `alloc()` and `dealloc()` receive the exact `Layout` (size and alignment) requested. Returning `null_mut()` cleanly notifies heap consumers of allocation failure without panicking.
> 2. **Avoiding Heap Recursion:** Custom allocators must NEVER invoke heap allocation primitives (such as `println!`, `Vec`, or `format!`) inside `alloc()` or `dealloc()`, as this triggers recursive infinite loops resulting in stack overflow crashes.
> 3. **Atomic CAS Loop (`compare_exchange_weak`):** Updating `PEAK_BYTES` using Compare-And-Swap ensures accurate high-water mark metrics across multiple concurrent threads without raw lock contention.

---

## 7. Related Terms

- [Stack vs Heap](../level_15/stack_vs_heap.md) — Heap memory region managed by the Allocator API.
- [`unsafe` Block](../level_13/unsafe_block.md) — `GlobalAlloc` implementation methods are `unsafe fn`.
- [Raw Pointers (`*const T`, `*mut T`)](../level_13/raw_pointers.md) — Allocators return and free `*mut u8` pointers.
- [Release Profile](../level_15/release_profile.md) — Profile where custom allocator performance improvements take effect.

---

## 8. Key Takeaways

- The Allocator API (`GlobalAlloc`, `#[global_allocator]`, `Layout`) defines how Rust allocates and frees heap memory.
- You can swap the global memory allocator to `jemalloc` or `mimalloc` to eliminate OS allocator thread lock contention in web servers and databases.
- `#![no_std]` embedded targets require defining a custom `#[global_allocator]` if heap collections (`Vec`, `Box`) are enabled.
- `Layout::array::<T>(count)` constructs valid size and alignment specifications for memory requests.
- Custom `GlobalAlloc::alloc` implementations must NEVER call functions that perform heap allocations (`println!`), to prevent recursive stack overflows.
