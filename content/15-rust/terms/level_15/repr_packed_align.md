# `#[repr(packed)]` / `#[repr(align)]`

> **Level 15 — Performance & Optimization**
> Representation attributes that explicitly control struct memory alignment: `#[repr(packed)]` strips padding bytes to minimize memory footprint or match unaligned wire protocols, while `#[repr(align(N))]` increases alignment to prevent false sharing in multi-threaded CPU caches or satisfy SIMD hardware vector alignment requirements.

---

## 1. Prerequisites

- [`#[repr(C)]`](../level_13/repr_c.md) — Standard C memory layout rules for structs.
- [SIMD (`std::simd`)](../level_15/simd.md) — Hardware vector instructions requiring aligned memory buffers.
- [Undefined Behavior (UB)](../level_13/undefined_behavior.md) — Creating standard references to unaligned memory fields causes UB.

---

## 2. Term Category

**Performance / Memory / Layout**: `#[repr(packed)]` and `#[repr(align(N))]` are memory layout attributes in Rust. By default, the compiler aligns struct fields according to their scalar type requirements (e.g. `u32` aligned to 4-byte boundaries, `u64` aligned to 8-byte boundaries), inserting invisible padding bytes between fields. `#[repr(packed)]` forces the compiler to remove all padding bytes (alignment = 1), while `#[repr(align(N))]` forces the struct's starting address to be a multiple of `N` bytes.

---

## 3. Environment Context

**Universal Rust**: `#[repr(packed)]` and `#[repr(align(N))]` are available across all Rust targets (`std`, `no_std`, WASM, embedded systems). They are critical for network protocol parsing (TCP/IP headers), hardware MMIO register mapping, cache line false-sharing prevention in concurrent data structures, and SIMD alignment.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"

CPUs prefer to read memory at natural alignment boundaries:
- A 32-bit integer (`u32`) is fastest to read when stored at a memory address divisible by 4 (`0x00`, `0x04`, `0x08`).
- A 64-bit float (`f64`) is fastest when stored at an address divisible by 8 (`0x00`, `0x08`, `0x10`).

To uphold natural alignment, compilers insert **padding bytes** between fields in a struct.

However, two specific performance and hardware scenarios require overriding default alignment:

1. **Packing (`#[repr(packed)]`)**:
   - When parsing binary network packets (like Ethernet or IP headers) or reading binary file formats (BMP images), the data on the wire contains **zero padding bytes**.
   - A 1-byte flag is immediately followed by a 4-byte integer at byte offset 1.
   - `#[repr(packed)]` forces Rust to strip all padding bytes so the struct matches the exact binary wire layout.

2. **Aligning (`#[repr(align(N))]`)**:
   - **Preventing False Sharing**: Modern CPU cores share a 64-byte L1 Cache Line. If Thread 1 frequently mutates `AtomicBool A` and Thread 2 frequently mutates `AtomicBool B`, and both variables live on the same 64-byte cache line, the CPU cores constantly invalidate each other's L1 cache line ("false sharing"), slowing execution down by 10x–50x.
   - Using `#[repr(align(64))]` forces each atomic variable into its own dedicated 64-byte cache line, eliminating cache line invalidation.
   - **SIMD Alignment**: AVX2 and AVX-512 vector instructions require 32-byte or 64-byte memory alignment (`#[repr(align(32))]`).

### (2) Reality Metaphor

Imagine a **Custom Shipping Cargo Container**:

- **Default Layout (`#[repr(Rust)]` / `#[repr(C)]`)** is like shipping furniture with protective styrofoam blocks between items: the styrofoam (**padding bytes**) keeps fragile items aligned safely, but takes up extra volume.
- **`#[repr(packed)]`** is vacuum-sealing all furniture together with zero styrofoam padding:
  - Takes up the smallest physical shipping space (**minimal memory footprint & matching binary wire protocols**).
  - But unpacking a vacuum-sealed item without special tools (**dereferencing unaligned fields**) can damage the item (**hardware alignment fault or Undefined Behavior**).
- **`#[repr(align(64))]`** is placing a fragile statue inside a standardized 64-inch steel shipping crate:
  - The statue is centered inside a full 64-inch crate block (**aligns struct to 64-byte L1 CPU Cache Line boundary**).
  - Multiple crates can be loaded onto separate forklift trucks (**CPU cores**) without forklift arms bumping into adjacent cargo (**prevents false sharing**).

### (3) Code Examples

#### Short Snippet (Packed vs Aligned Memory Layout Inspection)

```rust
use std::mem::{align_of, size_of};

/// Standard C layout with default padding (size: 8 bytes, align: 4 bytes)
#[repr(C)]
struct DefaultPoint {
    flag: u8,   // 1 byte + 3 bytes padding
    val: u32,   // 4 bytes
}

/// Packed layout with zero padding (size: 5 bytes, align: 1 byte)
#[repr(packed)]
struct PackedPoint {
    flag: u8,   // 1 byte (no padding!)
    val: u32,   // 4 bytes at offset 1
}

/// Aligned layout matching CPU L1 Cache Line (size: 64 bytes, align: 64 bytes)
#[repr(C, align(64))]
struct CacheAlignedPoint {
    flag: u8,
    val: u32,
}

fn main() {
    println!("DefaultPoint:      size = {} bytes, align = {} bytes", size_of::<DefaultPoint>(), align_of::<DefaultPoint>());
    println!("PackedPoint:       size = {} bytes, align = {} bytes", size_of::<PackedPoint>(), align_of::<PackedPoint>());
    println!("CacheAlignedPoint: size = {} bytes, align = {} bytes", size_of::<CacheAlignedPoint>(), align_of::<CacheAlignedPoint>());

    assert_eq!(size_of::<PackedPoint>(), 5);
    assert_eq!(align_of::<CacheAlignedPoint>(), 64);
}
```

#### Fuller Example (Preventing False Sharing in Multi-Threaded Atomic Counters)

```rust
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::Instant;

/// Cache-line aligned atomic counter (64-byte alignment prevents False Sharing!)
#[repr(align(64))]
struct AlignedCounter {
    value: AtomicU64,
}

fn benchmark_cache_alignment() {
    // Allocate two separate counters, each aligned to its own 64-byte cache line
    let counter1 = Arc::new(AlignedCounter { value: AtomicU64::new(0) });
    let counter2 = Arc::new(AlignedCounter { value: AtomicU64::new(0) });

    let c1 = counter1.clone();
    let c2 = counter2.clone();

    let start = Instant::now();

    // Thread 1 mutates counter1
    let handle1 = thread::spawn(move || {
        for _ in 0..10_000_000 {
            c1.value.fetch_add(1, Ordering::Relaxed);
        }
    });

    // Thread 2 mutates counter2 simultaneously
    let handle2 = thread::spawn(move || {
        for _ in 0..10_000_000 {
            c2.value.fetch_add(1, Ordering::Relaxed);
        }
    });

    handle1.join().unwrap();
    handle2.join().unwrap();

    let duration = start.elapsed();
    println!("Concurrent atomic increments duration (64-byte aligned): {:?}", duration);
}

fn main() {
    benchmark_cache_alignment();
}
```

---

## 4. Packed vs Aligned Comparison

| Feature | `#[repr(packed)]` | `#[repr(align(N))]` |
| :--- | :--- | :--- |
| **Padding Bytes** | Removed completely ($0$ padding bytes) | Increased to pad struct size to multiple of $N$ |
| **Alignment Constraint** | Forced to $1$ byte | Forced to $N$ bytes (must be power of 2: 2, 4, 8, 16, 64) |
| **Primary Purpose** | Matching binary wire protocols / minimal memory size | SIMD vector alignment & preventing false sharing |
| **Field References** | ❌ Creating `&field` to unaligned fields is **UB** | ✅ Safe (fields satisfy $N$-byte alignment) |
| **CPU Speed Impact** | May slow down reads on unaligned architectures | Speeds up multi-threaded CPU cache locality |

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Creating a Reference `&field` to an Unaligned Field in `#[repr(packed)]`

**The mistake:** Writing `let val_ref = &packed_struct.field;` inside a `#[repr(packed)]` struct.

**Why it's wrong:** Standard Rust references `&T` MUST be aligned to `align_of::<T>()`. Creating an unaligned reference `&u32` at an odd byte offset inside a packed struct causes instant Undefined Behavior (UB) and hard crashes on ARM/RISC-V architectures.

*Incorrect:*
```rust
#[repr(packed)]
struct PackedHeader {
    flag: u8,
    value: u32, // Offset 1 (Unaligned!)
}

let header = PackedHeader { flag: 1, value: 42 };
// ❌ UNDEFINED BEHAVIOR! Creating reference to unaligned field!
// let val_ref: &u32 = &header.value; 
```

*Fix:*
```rust
#[repr(packed)]
struct PackedHeader {
    flag: u8,
    value: u32,
}

let header = PackedHeader { flag: 1, value: 42 };

// Correct: Copy unaligned value by value (or use `std::ptr::read_unaligned`)
let val_copy: u32 = header.value; 

// Correct: Using ptr::read_unaligned for pointers:
let raw_ptr: *const u32 = std::ptr::addr_of!(header.value);
let val_unaligned = unsafe { std::ptr::read_unaligned(raw_ptr) };
```

### Mistake 2: Specifying an Alignment `N` that is Not a Power of Two

**The mistake:** Writing `#[repr(align(15))]` or `#[repr(align(100))]`.

**Why it's wrong:** Hardware alignment boundaries MUST be powers of two (2, 4, 8, 16, 32, 64, 128). The compiler rejects non-power-of-two alignment attributes.

*Incorrect:*
```rust
// ❌ Compiler Error: attribute should be a power of two
#[repr(align(100))] 
struct BadAlign;
```

*Fix:*
```rust
// Correct: Must be a power of two (e.g. 64 or 128)
#[repr(align(64))]
struct GoodAlign;
```

### Mistake 3: Over-using `#[repr(packed)]` for Standard In-Memory Structs

**The mistake:** Applying `#[repr(packed)]` to standard internal application structs in an attempt to save a few bytes of RAM.

**Why it's wrong:** Unaligned memory access forces the CPU to execute multiple memory reads per field access or execute software exception handlers, significantly degrading CPU read performance. Use `#[repr(packed)]` only when matching binary network/file formats.

---

## 6. Practice Exercises

### Exercise 1: Embedded Network Telemetry Packet Parsing with `#[repr(C, packed)]` (`#![no_std]`)

**Problem Statement:**
In an embedded IoT gateway receiving telemetry frames over a serial link (UART/CAN bus), network packets arrive packed tightly without any padding bytes to minimize transmission bandwidth. The binary frame format consists of:
- `magic`: 1 byte (`u8`, value `0xAA`)
- `device_id`: 2 bytes (`u16`) at byte offset 1
- `timestamp`: 4 bytes (`u32`) at byte offset 3
- `temperature_mc`: 4 bytes (`i32`) at byte offset 7
- `checksum`: 2 bytes (`u16`) at byte offset 11

Total packet size is exactly 13 bytes.

1. Define a struct `TelemetryPacket` with `#[repr(C, packed)]` in a `#![no_std]` environment.
2. Implement safe getter methods for reading unaligned multi-byte fields (`device_id`, `timestamp`, `temperature_mc`, `checksum`) using `core::ptr::addr_of!` and `core::ptr::read_unaligned` to prevent Undefined Behavior (UB).
3. Write unit tests with assertions (`assert_eq!`) validating struct size, alignment, field layout, zero-copy packet deserialization from raw byte slices, and field value extraction.

> [!check]- Answer
> ```rust
> #![no_std]
> use core::mem::{align_of, size_of};
> use core::ptr::{addr_of, read_unaligned};
> 
> /// Packed telemetry packet matching exact binary wire layout with 0 padding bytes.
> /// Total Size: 1 + 2 + 4 + 4 + 2 = 13 bytes. Alignment: 1 byte.
> #[repr(C, packed)]
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub struct TelemetryPacket {
>     pub magic: u8,            // Byte offset 0
>     pub device_id: u16,       // Byte offset 1 (unaligned!)
>     pub timestamp: u32,       // Byte offset 3 (unaligned!)
>     pub temperature_mc: i32,  // Byte offset 7 (unaligned!)
>     pub checksum: u16,        // Byte offset 11 (unaligned!)
> }
> 
> impl TelemetryPacket {
>     /// Constructs a packet from raw binary wire bytes without heap allocation.
>     pub fn from_bytes(bytes: &[u8; 13]) -> Self {
>         let ptr = bytes.as_ptr() as *const TelemetryPacket;
>         unsafe { read_unaligned(ptr) }
>     }
> 
>     /// Safely reads unaligned `device_id` without creating unaligned reference `&u16`.
>     pub fn get_device_id(&self) -> u16 {
>         let ptr = addr_of!(self.device_id);
>         unsafe { read_unaligned(ptr) }
>     }
> 
>     /// Safely reads unaligned `timestamp` without creating unaligned reference `&u32`.
>     pub fn get_timestamp(&self) -> u32 {
>         let ptr = addr_of!(self.timestamp);
>         unsafe { read_unaligned(ptr) }
>     }
> 
>     /// Safely reads unaligned `temperature_mc` without creating unaligned reference `&i32`.
>     pub fn get_temperature_mc(&self) -> i32 {
>         let ptr = addr_of!(self.temperature_mc);
>         unsafe { read_unaligned(ptr) }
>     }
> 
>     /// Safely reads unaligned `checksum` without creating unaligned reference `&u16`.
>     pub fn get_checksum(&self) -> u16 {
>         let ptr = addr_of!(self.checksum);
>         unsafe { read_unaligned(ptr) }
>     }
> }
> 
> #[test]
> fn test_telemetry_packet_layout_and_parsing() {
>     // 1. Verify memory layout and alignment constraints
>     assert_eq!(size_of::<TelemetryPacket>(), 13);
>     assert_eq!(align_of::<TelemetryPacket>(), 1);
> 
>     // 2. Simulated wire data (13 raw bytes, little-endian multi-byte fields)
>     let raw_bytes: [u8; 13] = [
>         0xAA,                   // magic
>         0x34, 0x12,             // device_id: 0x1234
>         0xA0, 0x86, 0x01, 0x00, // timestamp: 100,000
>         0x9C, 0x63, 0x00, 0x00, // temperature_mc: 25,500 mC
>         0xAA, 0x55,             // checksum: 0x55AA
>     ];
> 
>     let packet = TelemetryPacket::from_bytes(&raw_bytes);
> 
>     assert_eq!(packet.magic, 0xAA);
>     assert_eq!(packet.get_device_id(), 0x1234);
>     assert_eq!(packet.get_timestamp(), 100_000);
>     assert_eq!(packet.get_temperature_mc(), 25_500);
>     assert_eq!(packet.get_checksum(), 0x55AA);
> }
> ```
>
> **Explanation:**
> 1. **Why `#[repr(C, packed)]` is required:** Default Rust memory layout (`#[repr(Rust)]` or standard `#[repr(C)]`) inserts padding bytes to align fields to their natural scalar alignment (`u16` aligned to 2 bytes, `u32`/`i32` aligned to 4 bytes). With default layout, 1 padding byte is inserted after `magic`, inflating struct size from 13 to 16 bytes. `#[repr(C, packed)]` strips all padding bytes so the struct matches the exact 13-byte wire protocol.
> 2. **Preventing Undefined Behavior (UB) from unaligned references:** In Rust, standard references (`&T` or `&mut T`) MUST be aligned to `align_of::<T>()`. Creating an unaligned reference like `let r = &packet.timestamp;` causes immediate Undefined Behavior.
> 3. **Safe Unaligned Pointer Operations:** `core::ptr::addr_of!(self.timestamp)` computes raw pointer `*const u32` directly without creating an intermediate reference `&u32`. `core::ptr::read_unaligned` then safely performs a byte-by-byte copy from unaligned memory into a local stack variable.

---

### Exercise 2: High-Performance Cache-Line Alignment (`#[repr(C, align(64))]`) to Eliminate False Sharing

**Problem Statement:**
In multi-threaded lock-free data structures (such as SPSC queues or concurrent metrics collectors), two atomic variables—`head` (modified by producer thread) and `tail` (modified by consumer thread)—are updated continuously by separate CPU cores. If stored in a standard struct, both variables share a single 64-byte L1 CPU cache line. Mutating `head` on CPU Core 1 causes the CPU hardware bus to constantly invalidate Core 2's L1 cache line containing `tail` ("False Sharing"), causing a severe performance penalty.

1. Implement a cache-isolated atomic structure using `#[repr(C, align(64))]`.
2. Define a `ConcurrentQueueIndices` struct holding `head` and `tail` atomic counters, each wrapped in a 64-byte aligned structure to guarantee placement on distinct L1 cache lines.
3. Write unit tests with assertions validating `align_of`, `size_of`, runtime pointer address alignment, and field offsets to prove complete cache line separation.

> [!check]- Answer
> ```rust
> use std::mem::{align_of, size_of};
> use std::sync::atomic::{AtomicU64, Ordering};
> 
> /// Explicitly aligned wrapper isolating atomic variables onto separate 64-byte L1 cache lines.
> #[repr(C, align(64))]
> pub struct CachePaddedAtomicU64 {
>     pub value: AtomicU64,
> }
> 
> impl CachePaddedAtomicU64 {
>     pub const fn new(val: u64) -> Self {
>         Self {
>             value: AtomicU64::new(val),
>         }
>     }
> }
> 
> /// Concurrent queue index tracker with zero L1 cache-line false sharing.
> pub struct ConcurrentQueueIndices {
>     pub head: CachePaddedAtomicU64, // Producer L1 cache line (64 bytes)
>     pub tail: CachePaddedAtomicU64, // Consumer L1 cache line (64 bytes)
> }
> 
> impl ConcurrentQueueIndices {
>     pub const fn new() -> Self {
>         Self {
>             head: CachePaddedAtomicU64::new(0),
>             tail: CachePaddedAtomicU64::new(0),
>         }
>     }
> }
> 
> #[test]
> fn test_cache_line_isolation_and_alignment() {
>     // 1. Verify CachePaddedAtomicU64 alignment is exactly 64 bytes
>     assert_eq!(align_of::<CachePaddedAtomicU64>(), 64);
> 
>     // 2. Verify size is padded to full 64 bytes (8 bytes AtomicU64 + 56 padding bytes)
>     assert_eq!(size_of::<CachePaddedAtomicU64>(), 64);
> 
>     // 3. Verify total indices layout size is 128 bytes (2 distinct 64-byte cache lines)
>     assert_eq!(size_of::<ConcurrentQueueIndices>(), 128);
> 
>     let indices = ConcurrentQueueIndices::new();
> 
>     // 4. Verify runtime pointer addresses are 64-byte aligned and separated by at least 64 bytes
>     let head_addr = &indices.head as *const _ as usize;
>     let tail_addr = &indices.tail as *const _ as usize;
> 
>     assert_eq!(head_addr % 64, 0, "Head address must be aligned to 64 bytes");
>     assert_eq!(tail_addr % 64, 0, "Tail address must be aligned to 64 bytes");
>     assert!(
>         (tail_addr as isize - head_addr as isize).abs() >= 64,
>         "Head and tail must occupy separate 64-byte L1 cache lines"
>     );
> 
>     // 5. Verify thread-safe atomic mutations
>     indices.head.value.fetch_add(1, Ordering::Relaxed);
>     indices.tail.value.fetch_add(1, Ordering::Relaxed);
> 
>     assert_eq!(indices.head.value.load(Ordering::Relaxed), 1);
>     assert_eq!(indices.tail.value.load(Ordering::Relaxed), 1);
> }
> ```
>
> **Explanation:**
> 1. **False Sharing Mechanics:** CPU L1 caches manage memory in fixed-size blocks (typically 64 bytes, called cache lines). When CPU Core 1 writes to a memory location, the MESI cache coherency protocol invalidates that entire 64-byte cache line across all other CPU cores. If `head` and `tail` share a cache line, Core 1 and Core 2 continuously force each other to reload L1 cache lines from L2/L3 cache, slowing execution down by up to 50x.
> 2. **How `#[repr(align(64))]` Works:** By marking `CachePaddedAtomicU64` with `align(64)`, the compiler forces its starting address to be a multiple of 64 and pads its total memory size to a multiple of 64 bytes (8 bytes data + 56 bytes trailing padding).
> 3. **Memory Isolation:** Storing two `CachePaddedAtomicU64` fields inside `ConcurrentQueueIndices` guarantees `head` occupies Cache Line $N$ (bytes 0..64) and `tail` occupies Cache Line $N+1$ (bytes 64..128), completely eliminating false sharing.

---

### Exercise 3: SIMD Hardware Vector Buffer Alignment (`#[repr(C, align(32))]`)

**Problem Statement:**
High-performance SIMD vector instruction sets (such as Intel AVX2 256-bit operations `vmovdqa` / `_mm256_load_ps`) require float vectors (`[f32; 8]`) to be aligned to 32-byte hardware memory boundaries. Attempting to execute aligned vector instructions on unaligned addresses causes a CPU General Protection Fault hardware exception.

1. Define a SIMD block struct `SimdBlock8` holding 8 `f32` elements aligned to 32 bytes using `#[repr(C, align(32))]`.
2. Implement vector operations (e.g. scalar scaling) operating on `SimdBlock8`.
3. Write unit tests with assertions verifying hardware alignment (`ptr % 32 == 0`), struct size (`32` bytes), alignment requirement (`align_of::<SimdBlock8>() == 32`), and arithmetic correctness.

> [!check]- Answer
> ```rust
> use std::mem::{align_of, size_of};
> 
> /// 256-bit SIMD vector block (8 x 32-bit floats) aligned to 32-byte hardware boundary.
> #[repr(C, align(32))]
> #[derive(Debug, Clone, Copy, PartialEq)]
> pub struct SimdBlock8 {
>     pub data: [f32; 8],
> }
> 
> impl SimdBlock8 {
>     pub const fn new(data: [f32; 8]) -> Self {
>         Self { data }
>     }
> 
>     /// Scales all 8 float elements by a scalar factor.
>     pub fn scale(&mut self, factor: f32) {
>         for val in self.data.iter_mut() {
>             *val *= factor;
>         }
>     }
> 
>     /// Verifies whether runtime memory address satisfies 32-byte SIMD alignment requirement.
>     pub fn is_simd_aligned(&self) -> bool {
>         (self as *const Self as usize) % 32 == 0
>     }
> }
> 
> #[test]
> fn test_simd_buffer_alignment_and_operations() {
>     // 1. Validate SIMD alignment constraint
>     assert_eq!(align_of::<SimdBlock8>(), 32);
> 
>     // 2. Validate struct size (8 * 4 bytes = 32 bytes)
>     assert_eq!(size_of::<SimdBlock8>(), 32);
> 
>     // 3. Instantiate aligned SIMD block
>     let mut block = SimdBlock8::new([1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0]);
> 
>     // 4. Verify runtime hardware memory alignment requirement
>     assert!(block.is_simd_aligned());
> 
>     // 5. Execute vector operation and assert correctness
>     block.scale(2.5);
>     let expected = [2.5, 5.0, 7.5, 10.0, 12.5, 15.0, 17.5, 20.0];
>     assert_eq!(block.data, expected);
> }
> ```
>
> **Explanation:**
> 1. **Hardware Vector Alignment Requirements:** Modern CPU architectures feature vector extension units (AVX/AVX2/AVX-512) that load 256-bit (32-byte) or 512-bit (64-byte) registers directly from L1 cache. Instructions like `vmovdqa` require target memory addresses to be exact multiples of 32 bytes.
> 2. **Power-of-Two Alignment Enforcement:** In Rust, `N` in `#[repr(align(N))]` must be a power of two ($2, 4, 8, 16, 32, 64, \dots$). Marking `SimdBlock8` with `#[repr(C, align(32))]` forces the compiler to place heap allocations and stack frames on 32-byte boundaries (`address % 32 == 0`).
> 3. **Struct Sizing & Trailing Padding:** The Rust compiler calculates struct size as a multiple of its alignment. Since `[f32; 8]` is exactly $8 \times 4 = 32$ bytes, no trailing padding is needed. If the field were `[f32; 5]` (20 bytes), `#[repr(align(32))]` would automatically insert 12 trailing padding bytes to maintain a total size of 32 bytes.
> 
---

## 7. Related Terms

- [`#[repr(C)]`](../level_13/repr_c.md) — Standard C memory layout rules for structs.
- [SIMD (`std::simd`)](../level_15/simd.md) — Hardware vector instructions requiring `#[repr(align(32))]` or `align(64)`.
- [Undefined Behavior (UB)](../level_13/undefined_behavior.md) — Creating references `&T` to unaligned fields causes UB.
- [Raw Pointers (`*const T`, `*mut T`)](../level_13/raw_pointers.md) — Unchecked pointers used with `read_unaligned`.

---

## 8. Key Takeaways

- `#[repr(packed)]` removes all padding bytes (alignment = 1), minimizing memory footprint and matching binary wire protocols (TCP/IP packets).
- `#[repr(align(N))]` increases struct alignment to $N$ bytes (must be a power of 2: 2, 4, 8, 16, 32, 64).
- Use `#[repr(align(64))]` on concurrent atomic counters to prevent CPU L1 Cache Line **False Sharing**.
- Creating standard references `&field` to unaligned fields in `#[repr(packed)]` structs is **Undefined Behavior**.
- Use `std::ptr::addr_of!` and `std::ptr::read_unaligned` to read unaligned packed fields safely.
