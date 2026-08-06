# `Copy` Trait

> **Level 3 — Ownership & Borrowing**
> Types implementing `Copy` (e.g. integers, `bool`) are bitwise-copied instead of moved.

---

## 1. Prerequisites


- [Ownership](ownership.md) — The system that `Copy` types bypass.
- [Move Semantics](move_semantics.md) — The default behavior of assignment that invalidates old variables.
- [Scalar Types](../level_01/scalar_types.md) — The simple, stack-only data types that automatically implement `Copy`.

---

## 2. Term Category

**Rust-specific (the exception to the rule)**: While all languages copy primitive integers, Rust formalizes this exception to its strict Ownership rules by using a "Trait" (an interface marker). The `Copy` trait tells the compiler to silently duplicate the data instead of Moving it.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The default behavior in Rust is to **Move** data. If you write `let b = a;`, the variable `a` is invalidated. This is incredibly smart for a 1GB `String` on the Heap, because deep copying 1GB of data implicitly would kill performance.

But what if `a` is just an `i32` integer? An `i32` is a tiny, fixed size (4 bytes) that lives entirely on the fast Stack memory. Moving an `i32` and forcing the programmer to type `.clone()` every time they want to reuse a number would be agonizing to write and completely unnecessary for performance. 

Rust solves this with the **`Copy` trait**. If a type is marked with `Copy`, the compiler knows it is so small and simple that copying it is basically free. When you assign it to a new variable, the compiler silently creates a perfect "bitwise copy". The new variable gets the copy, and the old variable remains perfectly valid!

### (2) Reality Metaphor

Imagine handing over an item to your friend.

If the item is the original **Mona Lisa painting** (`String` / Heap data), handing it to your friend means you no longer have it. It was **Moved**.

If the item is a **two-item grocery list** written on a post-it note (`i32` / Stack data), you don't actually hand over your original note. You just grab a blank post-it, instantly scribble the two items down, and hand them the *copy*. You both now have independent lists. This is the **`Copy` trait**.

### (3) Rust Code Examples

#### Short Snippet (Move vs Copy)
```rust
fn main() {
    // String DOES NOT implement Copy (It lives on the Heap)
    let s1 = String::from("Mona Lisa");
    let s2 = s1; // MOVED!
    // println!("{}", s1); // ERROR: s1 is dead.

    // i32 DOES implement Copy (It lives on the Stack)
    let n1 = 42;
    let n2 = n1; // COPIED!
    println!("I can still print n1: {}", n1); // SUCCESS: n1 is alive!
    println!("And I can print n2: {}", n2);
}
```

#### Fuller Example (Custom Copy Structs)
By default, custom `struct`s do **not** implement `Copy`. If you want a struct to be copyable, you must explicitly ask the compiler to add it using the `#[derive(Copy, Clone)]` macro. 

*Note: In Rust, to have `Copy`, you must also derive `Clone`.*
```rust
// We tell the compiler: "Please make this copyable!"
#[derive(Copy, Clone)]
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p1 = Point { x: 5, y: 10 };
    
    // Because of the derive macro, this is a COPY, not a move!
    let p2 = p1; 
    
    println!("p1 still exists! p1.x = {}", p1.x);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Copy Trait Scoping and Lifecycle Rules

**The mistake:** Assuming Copy Trait instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("copy_trait_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("copy_trait_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Copy Trait State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Copy Trait through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Copy Trait Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Copy Trait instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Zero-Copy Network Packet Header & Multi-Stage Telemetry Pipeline

**Scenario:** In high-throughput network telemetry engines processing millions of packets per second, heap allocations per packet introduce unacceptably high allocation overhead and garbage collection delays. Packet metadata headers must reside entirely on the stack as fixed-size structures that implement `Copy`, allowing them to be passed by value across multi-stage telemetry pipelines (e.g. validation, enrichment, routing) without transferring or invalidating caller ownership.

Implement a `PacketHeader` struct representing IPv4 network telemetry:
- Fields: `src_ip: [u8; 4]`, `dst_ip: [u8; 4]`, `src_port: u16`, `dst_port: u16`, `protocol: u8`, `flags: u8`, `seq_num: u32`.
- Automatically derive `Copy`, `Clone`, `Debug`, `PartialEq`, `Eq`.
- Implement associated methods:
  - `new(...) -> Self`
  - `is_flag_set(&self, flag_mask: u8) -> bool`
  - `with_seq_num(self, new_seq: u32) -> Self` (takes `self` by value utilizing `Copy`)
  - `swap_endpoints(self) -> Self` (creates a packet header with reversed source/destination endpoints)
- Implement a `PipelineProcessor` with stage methods:
  - `validate(header: PacketHeader) -> Result<PacketHeader, &'static str>`
  - `enrich_flags(header: PacketHeader, additional_flags: u8) -> PacketHeader`
  - `route(header: PacketHeader) -> String`
- Write comprehensive unit tests verifying that passing `PacketHeader` by value into pipeline stages duplicates stack bytes bitwise, leaving caller header bindings valid and untouched across all operations.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Copy, Clone, PartialEq, Eq)]
> pub struct PacketHeader {
>     pub src_ip: [u8; 4],
>     pub dst_ip: [u8; 4],
>     pub src_port: u16,
>     pub dst_port: u16,
>     pub protocol: u8,
>     pub flags: u8,
>     pub seq_num: u32,
> }
> 
> pub const FLAG_SYN: u8 = 0x01;
> pub const FLAG_ACK: u8 = 0x10;
> pub const FLAG_FIN: u8 = 0x04;
> 
> impl PacketHeader {
>     pub fn new(
>         src_ip: [u8; 4],
>         dst_ip: [u8; 4],
>         src_port: u16,
>         dst_port: u16,
>         protocol: u8,
>         flags: u8,
>         seq_num: u32,
>     ) -> Self {
>         Self {
>             src_ip,
>             dst_ip,
>             src_port,
>             dst_port,
>             protocol,
>             flags,
>             seq_num,
>         }
>     }
> 
>     pub fn is_flag_set(&self, flag_mask: u8) -> bool {
>         (self.flags & flag_mask) == flag_mask
>     }
> 
>     pub fn with_seq_num(self, new_seq: u32) -> Self {
>         let mut updated = self; // Bitwise stack copy
>         updated.seq_num = new_seq;
>         updated
>     }
> 
>     pub fn swap_endpoints(self) -> Self {
>         Self {
>             src_ip: self.dst_ip,
>             dst_ip: self.src_ip,
>             src_port: self.dst_port,
>             dst_port: self.src_port,
>             protocol: self.protocol,
>             flags: self.flags,
>             seq_num: self.seq_num,
>         }
>     }
> }
> 
> pub struct PipelineProcessor;
> 
> impl PipelineProcessor {
>     pub fn validate(header: PacketHeader) -> Result<PacketHeader, &'static str> {
>         if header.src_port == 0 || header.dst_port == 0 {
>             Err("Invalid port number")
>         } else {
>             Ok(header)
>         }
>     }
> 
>     pub fn enrich_flags(header: PacketHeader, additional_flags: u8) -> PacketHeader {
>         let mut enriched = header; // Bitwise stack copy
>         enriched.flags |= additional_flags;
>         enriched
>     }
> 
>     pub fn route(header: PacketHeader) -> String {
>         format!(
>             "{}.{}.{}.{}:{} -> {}.{}.{}.{}:{}",
>             header.src_ip[0], header.src_ip[1], header.src_ip[2], header.src_ip[3], header.src_port,
>             header.dst_ip[0], header.dst_ip[1], header.dst_ip[2], header.dst_ip[3], header.dst_port
>         )
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_copy_preserves_caller_ownership() {
>         let original = PacketHeader::new(
>             [192, 168, 1, 10],
>             [10, 0, 0, 1],
>             8080,
>             443,
>             6, // TCP
>             FLAG_SYN,
>             1001,
>         );
> 
>         // Pass by value to validate stage
>         let validated_res = PipelineProcessor::validate(original);
>         assert!(validated_res.is_ok());
>         assert_eq!(validated_res.unwrap(), original);
> 
>         // original is still accessible because PacketHeader implements Copy!
>         assert_eq!(original.seq_num, 1001);
>         assert!(original.is_flag_set(FLAG_SYN));
> 
>         // Pass by value to enrich_flags stage
>         let enriched = PipelineProcessor::enrich_flags(original, FLAG_ACK);
>         assert_ne!(original.flags, enriched.flags);
>         assert_eq!(enriched.flags, FLAG_SYN | FLAG_ACK);
> 
>         // original remains completely unmodified
>         assert_eq!(original.flags, FLAG_SYN);
> 
>         // Pass by value to swap_endpoints stage
>         let response_hdr = original.swap_endpoints();
>         assert_eq!(response_hdr.src_ip, original.dst_ip);
>         assert_eq!(response_hdr.dst_ip, original.src_ip);
>         assert_eq!(original.src_ip, [192, 168, 1, 10]);
> 
>         // Pass by value to route stage
>         let route_str = PipelineProcessor::route(original);
>         assert_eq!(route_str, "192.168.1.10:8080 -> 10.0.0.1:443");
>         assert_eq!(original.dst_port, 443);
>     }
> 
>     #[test]
>     fn test_validation_failure() {
>         let invalid = PacketHeader::new([127, 0, 0, 1], [127, 0, 0, 1], 0, 80, 6, 0, 1);
>         let res = PipelineProcessor::validate(invalid);
>         assert!(matches!(res, Err("Invalid port number")));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Copy Mechanics & Stack Layout**: `PacketHeader` consists entirely of fixed-size scalar fields (`u8`, `u16`, `u32`) and a fixed-size byte array (`[u8; 4]`). In Rust, array types `[T; N]` automatically derive `Copy` if `T` implements `Copy`. Because all underlying fields reside on the stack and have fixed, known sizes, `PacketHeader` can be duplicated via a bitwise memory copy (`memcpy`).
> 2. **Bypassing Move Semantics**: When a struct does not implement `Copy`, passing it by value into functions like `PipelineProcessor::validate(original)` transfers ownership, rendering `original` uninitialized in the caller's stack frame. Implementing `Copy` changes assignment and pass-by-value semantics: instead of moving ownership, the compiler copies the bytes into the target stack frame while leaving `original` valid.
> 3. **Immutability & Pure Functions**: Methods like `with_seq_num(self, ...)` take `self` by value and create modified copies without requiring `&mut self`. This functional pattern is exceptionally performant for small value types, enabling lock-free and side-effect-free pipeline processing.

---

### Exercise 2: Lock-Free Shared Ring Buffer Descriptor & `Drop` Incompatibility

**Scenario:** In lock-free shared-memory ring buffers and inter-process communication (IPC) queues, descriptor structures track slot allocation IDs, buffer byte offsets, segment lengths, sequence numbers, and state flags. Because ring buffer entries are copied across atomic slots or memory-mapped regions via raw byte copies, descriptors must implement `Copy`. However, Rust strictly prohibits types implementing `Copy` from also implementing `std::ops::Drop` (compiler error `E0184`), because bitwise stack copying duplicates data without tracking individual object drop lifecycles.

Implement a lock-free ring buffer descriptor system:
- Define `RingDescriptor` struct:
  - Fields: `slot_id: u32`, `offset: u64`, `len: u32`, `seq: u64`, `flags: u16`.
  - Automatically derive `Copy`, `Clone`, `Debug`, `PartialEq`, `Eq`.
- Implement `RingDescriptor` methods:
  - `new(slot_id: u32, offset: u64, len: u32, seq: u64, flags: u16) -> Self`
  - `end_offset(&self) -> u64`: Returns `offset + len as u64`.
  - `split(self, at_len: u32) -> Option<(Self, Self)>`: Splits a descriptor into two contiguous descriptors if `at_len < self.len`.
  - `merge(self, next: Self) -> Option<Self>`: Merges `self` with `next` if they share the same `slot_id` and `self.end_offset() == next.offset`.
- Design a `DescriptorPool` manager to demonstrate explicit resource disposal patterns required when managing copyable descriptors.
- Write unit tests using `assert_eq!`, `assert!`, `assert_ne!`, `matches!`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Copy, Clone, PartialEq, Eq)]
> pub struct RingDescriptor {
>     pub slot_id: u32,
>     pub offset: u64,
>     pub len: u32,
>     pub seq: u64,
>     pub flags: u16,
> }
> 
> pub const DESC_FLAG_READY: u16 = 0x0001;
> pub const DESC_FLAG_COMMITTED: u16 = 0x0002;
> 
> impl RingDescriptor {
>     pub fn new(slot_id: u32, offset: u64, len: u32, seq: u64, flags: u16) -> Self {
>         Self {
>             slot_id,
>             offset,
>             len,
>             seq,
>             flags,
>         }
>     }
> 
>     pub fn end_offset(&self) -> u64 {
>         self.offset.saturating_add(self.len as u64)
>     }
> 
>     pub fn split(self, at_len: u32) -> Option<(Self, Self)> {
>         if at_len == 0 || at_len >= self.len {
>             return None;
>         }
> 
>         let head = Self {
>             slot_id: self.slot_id,
>             offset: self.offset,
>             len: at_len,
>             seq: self.seq,
>             flags: self.flags,
>         };
> 
>         let tail = Self {
>             slot_id: self.slot_id,
>             offset: self.offset + (at_len as u64),
>             len: self.len - at_len,
>             seq: self.seq + 1,
>             flags: self.flags,
>         };
> 
>         Some((head, tail))
>     }
> 
>     pub fn merge(self, next: Self) -> Option<Self> {
>         if self.slot_id == next.slot_id && self.end_offset() == next.offset {
>             Some(Self {
>                 slot_id: self.slot_id,
>                 offset: self.offset,
>                 len: self.len + next.len,
>                 seq: self.seq,
>                 flags: self.flags | next.flags,
>             })
>         } else {
>             None
>         }
>     }
> }
> 
> // Lifecycle manager demonstrating explicit cleanup for Copy types.
> pub struct DescriptorPool {
>     active_count: u32,
> }
> 
> impl DescriptorPool {
>     pub fn new() -> Self {
>         Self { active_count: 0 }
>     }
> 
>     pub fn allocate(&mut self, slot_id: u32, offset: u64, len: u32) -> RingDescriptor {
>         self.active_count += 1;
>         RingDescriptor::new(slot_id, offset, len, 1, DESC_FLAG_READY)
>     }
> 
>     pub fn release(&mut self, desc: RingDescriptor) {
>         let _ = desc; // Bitwise copy passed in; no destructor executed
>         if self.active_count > 0 {
>             self.active_count -= 1;
>         }
>     }
> 
>     pub fn active_count(&self) -> u32 {
>         self.active_count
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_ring_descriptor_copy_and_split() {
>         let desc = RingDescriptor::new(1, 1024, 512, 10, DESC_FLAG_READY);
> 
>         // Bitwise copy on assignment
>         let copy_desc = desc;
>         assert_eq!(desc, copy_desc);
> 
>         // split takes desc by value, creating a copy
>         let split_opt = desc.split(200);
>         assert!(split_opt.is_some());
> 
>         let (head, tail) = split_opt.unwrap();
>         assert_eq!(head.offset, 1024);
>         assert_eq!(head.len, 200);
>         assert_eq!(tail.offset, 1224);
>         assert_eq!(tail.len, 312);
>         assert_eq!(tail.seq, 11);
> 
>         // Original desc remains accessible and unaltered!
>         assert_eq!(desc.len, 512);
>         assert_eq!(desc.end_offset(), 1536);
> 
>         // Merge contiguous descriptors
>         let merged_opt = head.merge(tail);
>         assert!(merged_opt.is_some());
>         let merged = merged_opt.unwrap();
>         assert_eq!(merged.offset, desc.offset);
>         assert_eq!(merged.len, desc.len);
> 
>         // Attempting to merge non-contiguous descriptors returns None
>         let unaligned = RingDescriptor::new(1, 2000, 100, 1, DESC_FLAG_READY);
>         assert!(matches!(head.merge(unaligned), None));
>         assert_ne!(head.end_offset(), unaligned.offset);
>     }
> 
>     #[test]
>     fn test_descriptor_pool_explicit_release() {
>         let mut pool = DescriptorPool::new();
>         let desc1 = pool.allocate(1, 0, 1024);
>         let desc2 = pool.allocate(2, 1024, 1024);
> 
>         assert_eq!(pool.active_count(), 2);
> 
>         pool.release(desc1);
>         assert_eq!(pool.active_count(), 1);
> 
>         // desc1 is still accessible in stack scope because it implements Copy!
>         assert_eq!(desc1.slot_id, 1);
> 
>         pool.release(desc2);
>         assert_eq!(pool.active_count(), 0);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Why `Copy` and `Drop` Are Mutually Exclusive**: If a type implements `Copy`, the compiler replicates its stack memory via bitwise copies whenever assigned or passed by value. If Rust allowed a `Copy` type to implement `std::ops::Drop`, the compiler would have no safe way to determine how many copies exist or which instance responsible for running the destructor. Executing `drop` on duplicated copies would cause double-free vulnerabilities or premature resource cleanup. Rust enforces compile error `E0184` if both are defined.
> 2. **Plain Old Data (POD) Layout**: `RingDescriptor` is a classic POD structure containing scalar primitive types (`u32`, `u64`, `u16`). Because none of its fields own dynamic heap memory, custom pointers, or OS handles, dropping a `RingDescriptor` is a trivial no-op (its stack frame is simply reclaimed when popping the call stack).
> 3. **Explicit Resource Management**: Because automatic `Drop` cannot be implemented on `Copy` types, any resource tracking (such as returning ring buffer slots to a pool) must be performed explicitly through manager types like `DescriptorPool::release(desc)`.

---

### Exercise 3: Real-Time Audio Quadraphonic Frame & Fixed-Point DSP Matrix

**Scenario:** Real-time Digital Signal Processing (DSP) applications process multichannel PCM audio sample frames at 48kHz or 96kHz. To prevent frame drops and jitter caused by heap allocations or dynamic reference counting overhead, sample frames must live strictly on the stack and implement `Copy`.

Implement a quadraphonic fixed-point audio frame system:
- Struct `AudioFrame`:
  - Fields: `samples: [i16; 4]` (4 channels: Left, Right, Center, LFE), `timestamp_us: u64`.
- Explicitly implement `Copy` and `Clone` manually without using `#[derive(Copy, Clone)]` to demonstrate how `Copy` marker trait bounds interact with `Clone`:
  ```rust
  impl Clone for AudioFrame {
      fn clone(&self) -> Self {
          *self
      }
  }

  impl Copy for AudioFrame {}
  ```
- Implement DSP operations on `AudioFrame`:
  - `new(samples: [i16; 4], timestamp_us: u64) -> Self`
  - `apply_gain(self, gain_q8: u16) -> Self`: Multiplies samples by 8-bit fixed-point gain (`gain_q8 / 256.0`), using saturating arithmetic to prevent integer overflow/underflow.
  - `mix(self, other: Self, mix_ratio_q8: u8) -> Self`: Performs fixed-point linear interpolation between `self` and `other` using ratio `mix_ratio_q8` (0 = 100% `self`, 256 = 100% `other`), updating the timestamp to `max(self.timestamp_us, other.timestamp_us)`.
  - `peak_amplitude(&self) -> i16`: Returns maximum absolute amplitude value across all 4 channels.
- Write unit tests verifying that value operations perform pure bitwise stack duplication, leaving original audio sample frames unmodified, with explicit assertions (`assert_eq!`, `assert!`, `assert_ne!`, `matches!`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq)]
> pub struct AudioFrame {
>     pub samples: [i16; 4],
>     pub timestamp_us: u64,
> }
> 
> impl Clone for AudioFrame {
>     fn clone(&self) -> Self {
>         *self // Copy semantics turns dereferencing *self into a bitwise stack copy
>     }
> }
> 
> impl Copy for AudioFrame {}
> 
> impl AudioFrame {
>     pub fn new(samples: [i16; 4], timestamp_us: u64) -> Self {
>         Self { samples, timestamp_us }
>     }
> 
>     // Apply fixed-point gain (gain_q8 where 256 = 1.0x gain)
>     pub fn apply_gain(self, gain_q8: u16) -> Self {
>         let mut output_samples = [0i16; 4];
>         for i in 0..4 {
>             let scaled = (self.samples[i] as i32 * gain_q8 as i32) / 256;
>             output_samples[i] = scaled.clamp(i16::MIN as i32, i16::MAX as i32) as i16;
>         }
>         Self {
>             samples: output_samples,
>             timestamp_us: self.timestamp_us,
>         }
>     }
> 
>     // Fixed-point linear mix (mix_ratio_q8: 0 = 100% self, 256 = 100% other)
>     pub fn mix(self, other: Self, mix_ratio_q8: u8) -> Self {
>         let w2 = mix_ratio_q8 as i32;
>         let w1 = 256 - w2;
>         let mut mixed = [0i16; 4];
> 
>         for i in 0..4 {
>             let val = (self.samples[i] as i32 * w1 + other.samples[i] as i32 * w2) / 256;
>             mixed[i] = val.clamp(i16::MIN as i32, i16::MAX as i32) as i16;
>         }
> 
>         Self {
>             samples: mixed,
>             timestamp_us: self.timestamp_us.max(other.timestamp_us),
>         }
>     }
> 
>     pub fn peak_amplitude(&self) -> i16 {
>         self.samples
>             .iter()
>             .map(|&s| if s == i16::MIN { i16::MAX } else { s.abs() })
>             .max()
>             .unwrap_or(0)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_manual_copy_dsp_operations() {
>         let frame_a = AudioFrame::new([1000, -2000, 3000, -4000], 100_000);
>         let frame_b = AudioFrame::new([5000, 5000, -5000, -5000], 100_050);
> 
>         // Test explicit clone via dereferencing Copy instance
>         let cloned_a = frame_a.clone();
>         assert_eq!(frame_a, cloned_a);
> 
>         // Apply gain (takes frame_a by value via Copy)
>         let boosted = frame_a.apply_gain(512); // 2.0x gain
>         assert_eq!(boosted.samples, [2000, -4000, 6000, -8000]);
> 
>         // frame_a remains untouched because AudioFrame implements Copy!
>         assert_eq!(frame_a.samples, [1000, -2000, 3000, -4000]);
>         assert_eq!(frame_a.peak_amplitude(), 4000);
> 
>         // Mix frame_a and frame_b (50/50 mix: ratio = 128)
>         let mixed = frame_a.mix(frame_b, 128);
>         assert_eq!(mixed.timestamp_us, 100_050);
>         assert_ne!(mixed.samples, frame_a.samples);
>         assert_ne!(mixed.samples, frame_b.samples);
> 
>         // Assert both original frames are still valid
>         assert_eq!(frame_a.samples[0], 1000);
>         assert_eq!(frame_b.samples[0], 5000);
> 
>         // Test gain saturation/clamping
>         let max_frame = AudioFrame::new([20000, -20000, 30000, -30000], 200_000);
>         let saturated = max_frame.apply_gain(1024); // 4.0x gain
>         assert_eq!(saturated.samples[0], i16::MAX);
>         assert_eq!(saturated.samples[1], i16::MIN);
> 
>         assert!(matches!(saturated.samples[0], 32767));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Manual `Copy` Implementation & Supertrait Bound**: In Rust, `Copy` is defined as `pub trait Copy: Clone {}`. This means `Clone` is a supertrait of `Copy`. When manually implementing `Copy`, you must also implement `Clone`. Because types implementing `Copy` can be duplicated by dereferencing `*self`, the manual `clone()` implementation can simply be `*self`.
> 2. **Marker Trait Mechanics**: `Copy` is a marker trait: it defines no methods or associated constants. Its sole purpose is to instruct the compiler that the type uses copy semantics rather than move semantics. The compiler will enforce that every field of a `Copy` struct also implements `Copy`.
> 3. **Zero-Cost Abstraction in Real-Time Systems**: For real-time DSP audio processing, passing `AudioFrame` values across DSP graph nodes generates zero heap allocation overhead and zero lock contention. Memory is allocated on the stack and cleaned up automatically when call frames unwind, guaranteeing deterministic execution time.

---

## 6. Related Terms


- [`Clone` Trait](clone_trait.md) — The explicit, deep-copy equivalent for Heap data. You must type `.clone()` to use it.
- [Move Semantics](move_semantics.md) — What happens to a variable if it *doesn't* have the `Copy` trait.
- [Trait](../level_04/trait.md) — (Future reference) The overarching system used to define shared interfaces and behaviors like `Copy` and `Clone`.
- [`Drop` Trait](drop_trait.md) — Related concept: `Drop` Trait.
- [Ownership](ownership.md) — Related concept: Ownership.

---

## 7. Key Takeaways

- **Move Semantics** are the default in Rust, but types marked with the **`Copy` trait** bypass this and are duplicated automatically.
- The original variable remains perfectly valid after assignment.
- All simple scalar types (`i32`, `f64`, `bool`, `char`) and fixed-size arrays of `Copy` types implement `Copy` by default.
- Heap-allocated types (`String`, `Vec`) do **not** implement `Copy`.
- You can make your own `struct` copyable by adding `#[derive(Copy, Clone)]` above it, as long as all its fields are also copyable.
