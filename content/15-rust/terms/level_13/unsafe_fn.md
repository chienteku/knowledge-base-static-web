# `unsafe fn`

> **Level 13 — Unsafe Rust & FFI**
> A function signature prefixed with `unsafe` (`unsafe fn`) signaling to callers that calling the function requires upholding specific preconditions and safety invariants that the compiler cannot verify.

---

## 1. Prerequisites


- [`unsafe` Block](unsafe_block.md) — Understanding `unsafe { ... }` blocks and the five unlocked superpowers.
- [Functions (`fn`)](../level_01/function.md) — Function signatures, parameters, and return types.
- [Undefined Behavior (UB)](undefined_behavior.md) — Understanding memory corruption risks when function safety contracts are violated.

---

## 2. Term Category



**Rust Function Specifier (contract-requiring unsafe function header)**: An `unsafe fn` is a function whose type signature includes the `unsafe` keyword (`unsafe fn foo(...)`). Marking a function as `unsafe` declares to the Rust compiler and downstream developers that the function's internal implementation contains operations with safety invariants that *cannot* be guaranteed for all possible inputs, shifting the burden of verifying safety preconditions onto the caller.



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In standard safe Rust functions (`fn foo(...)`), the compiler guarantees that for any validly typed inputs passed to the function, executing the body will *never* result in Undefined Behavior (UB), memory corruption, or data races. The function contract is completely verified at compile time by `rustc`.

However, some performance-critical low-level operations cannot be statically verified by the compiler. For example:
- A function that reads raw memory at an arbitrary address offset.
- A function that skips UTF-8 string encoding validation checks (`String::from_utf8_unchecked`).
- An external C library function call over FFI (`extern "C" fn`).

If Rust did not allow functions to be marked as `unsafe fn`:
1. Function authors would have to wrap internal unsafe operations in regular safe `fn` headers, tricking callers into thinking the function accepts any input safely — even inputs that trigger memory corruption or crashes.
2. Callers would have no syntax signal indicating that specific preconditions must be checked before calling the function.

`unsafe fn` solves this by transferring the responsibility boundary explicitly. By placing `unsafe` in the function signature, the author specifies: *"This function cannot verify its own inputs. Callers must guarantee specific safety preconditions in an `# Safety` doc block, and must wrap calls to this function in an `unsafe { ... }` block."*

### (2) Reality Metaphor

Imagine a **Prescription Medication Bottle with a Black-Box Warning**:

- A **Safe Function (`fn`)** is like an over-the-counter vitamin: the bottle carries a guarantee that following the package directions is completely safe for anyone without special medical clearance.
- An **Unsafe Function (`unsafe fn`)** is like a specialized surgical anesthetic: the drug bottle carries a prominent **Black-Box Warning (`unsafe fn`)** stating that the drug is extremely dangerous unless specific clinical conditions are strictly verified (**preconditions documented in `# Safety`**).
  - The doctor (**the caller**) must verify the patient's vitals (**uphold invariants**) before administering the dosage (**wrapping the call inside `unsafe { ... }`**).

### (3) Code Examples

#### Short Snippet (Defining and Calling an `unsafe fn`)

```rust
/// Reads an integer directly from a raw pointer.
///
/// # Safety
/// The caller must ensure that `ptr` is non-null, properly aligned,
/// points to an initialized `i32` value, and remains valid for the duration of the call.
pub unsafe fn read_raw_int(ptr: *const i32) -> i32 {
    // Inside an `unsafe fn`, raw pointer dereferencing is permitted
    *ptr
}

fn main() {
    let value: i32 = 42;
    let raw_ptr: *const i32 = &value;

    // Calling `read_raw_int` REQUIRES an `unsafe` block:
    unsafe {
        // SAFETY: `raw_ptr` is derived directly from stack variable `value`,
        // guaranteeing it is non-null, aligned, and points to initialized memory.
        let result = read_raw_int(raw_ptr);
        println!("Value read from raw pointer: {}", result); // 42
    }
}
```

#### Fuller Example (`String::from_utf8_unchecked` vs `String::from_utf8`)

```rust
fn demonstrate_unsafe_fn_performance() {
    let valid_bytes: Vec<u8> = vec![72, 101, 108, 108, 111]; // ASCII bytes for "Hello"

    // 1. Safe alternative: performs runtime UTF-8 validation checks O(N)
    let safe_string = String::from_utf8(valid_bytes.clone())
        .expect("Invalid UTF-8 bytes");
    println!("Safe String: {}", safe_string);

    // 2. Unsafe alternative: skips validation checks O(1) for high-performance contexts.
    // CALLER RESPONSIBILITY: Caller MUST guarantee bytes are valid UTF-8.
    unsafe {
        // SAFETY: `valid_bytes` contains hardcoded ASCII bytes [72, 101, 108, 108, 111],
        // which are provably valid UTF-8 sequences.
        let unchecked_string = String::from_utf8_unchecked(valid_bytes);
        println!("Unchecked String: {}", unchecked_string);
    }
}

fn main() {
    demonstrate_unsafe_fn_performance();
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Omitting the `# Safety` Documentation Section

**The mistake:** Writing an `unsafe fn` without documenting the exact safety preconditions required of the caller.

**Why it's wrong:** Marking a function `unsafe fn` without documenting *why* it is unsafe makes it impossible for downstream developers to call the function correctly without causing Undefined Behavior (UB).

*Incorrect:*
```rust
// ❌ Missing `# Safety` doc block! Callers have no idea what preconditions to satisfy.
pub unsafe fn set_length(v: &mut Vec<u8>, new_len: usize) {
    v.set_len(new_len);
}
```

*Fix:*
```rust
/// Sets the vector length directly without initializing elements.
///
/// # Safety
/// The caller must guarantee that `new_len` elements have been fully initialized in vector storage
/// and that `new_len` does not exceed the current capacity of the vector.
pub unsafe fn set_length(v: &mut Vec<u8>, new_len: usize) {
    v.set_len(new_len);
}
```

### Mistake 2: Marking a Function `unsafe fn` when it CANNOT Cause Undefined Behavior

**The mistake:** Marking a function `unsafe fn` simply because it could panic, fail, or return an error result (e.g. file non-existence or index panic).

**Why it's wrong:** In Rust, `unsafe` strictly means *"can cause Undefined Behavior / memory corruption if invariants are violated"*. Panicking, failing to find a file, or returning an `Err(Result)` are SAFE behaviors. Misusing `unsafe fn` for safe error handling dilutes the meaning of `unsafe`.

*Incorrect:*
```rust
// ❌ Wrong: Panicking on divide-by-zero is SAFE behavior. Function should NOT be `unsafe fn`.
pub unsafe fn divide(a: i32, b: i32) -> i32 {
    if b == 0 {
        panic!("Divide by zero!");
    }
    a / b
}
```

*Fix:*
```rust
// Correct: Use standard Result for recoverable safe errors
pub fn divide(a: i32, b: i32) -> Result<i32, &'static str> {
    if b == 0 {
        Err("Divide by zero")
    } else {
        Ok(a / b)
    }
}
```

### Mistake 3: Assuming Body Code inside `unsafe fn` Requires No `unsafe` Block in 2024 Edition

**The mistake:** Relying on implicit `unsafe` block behavior inside `unsafe fn` bodies across modern Rust editions.

**Why it's wrong:** In older Rust editions (2015/2018/2021), the body of an `unsafe fn` was treated as an implicit `unsafe` block. In Rust 2024 edition (and recommended by Clippy in 2021 via `#![warn(unsafe_op_in_unsafe_fn)]`), operations within an `unsafe fn` body require explicit inner `unsafe { ... }` blocks to pinpoint exact unsafe lines.

*Incorrect (Legacy Style):*
```rust
pub unsafe fn get_unchecked_val(ptr: *const i32) -> i32 {
    // Legacy: implicit unsafe block inside unsafe fn body
    *ptr 
}
```

*Fix (Idiomatic 2024 / Clippy Recommended Style):*
```rust
pub unsafe fn get_unchecked_val(ptr: *const i32) -> i32 {
    // Explicit unsafe block clarifies exact location of raw pointer dereference
    // SAFETY: caller guarantees `ptr` is non-null and valid for reading.
    unsafe { *ptr }
}
```

---

## 5. Practice Exercises

### Exercise 1: Embedded Hardware MMIO Driver with `unsafe fn`

**Scenario:** In embedded systems programming (`#![no_std]`), peripheral drivers interact directly with hardware registers mapped to physical memory addresses (Memory-Mapped I/O or MMIO). Reading or writing raw memory addresses directly can cause hardware crashes or memory corruption if addresses are invalid or misaligned, so register access operations must be exposed as `unsafe fn` functions with strict caller safety invariants.

Implement a generic hardware register wrapper `MmioRegister<T>` containing a raw pointer `address: *mut T`. Provide two `pub unsafe fn` methods:
1. `unsafe fn write_volatile(&mut self, value: T)` — Uses `core::ptr::write_volatile` to store a value without compiler optimization reordering.
2. `unsafe fn read_volatile(&self) -> T` — Uses `core::ptr::read_volatile` to read the current hardware register value.

Include an explicit `# Safety` doc comment section for both methods. Write a unit test `test_mmio_register_read_write` using a stack-allocated variable as simulated MMIO hardware memory to verify read and write operations using `assert_eq!`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #![no_std]
> use core::ptr;
> 
> /// A wrapper for Memory-Mapped I/O (MMIO) hardware registers.
> #[repr(transparent)]
> pub struct MmioRegister<T: Copy> {
>     address: *mut T,
> }
> 
> impl<T: Copy> MmioRegister<T> {
>     /// Creates a new MMIO register abstraction targeting the specified raw address.
>     pub const fn new(address: *mut T) -> Self {
>         Self { address }
>     }
> 
>     /// Writes a value to the hardware register using a volatile store.
>     ///
>     /// # Safety
>     /// The caller must ensure that:
>     /// 1. `address` points to a valid, readable and writable MMIO address or memory allocation.
>     /// 2. `address` is properly aligned for type `T`.
>     /// 3. Access is properly synchronized if shared across execution contexts.
>     pub unsafe fn write_volatile(&mut self, value: T) {
>         // SAFETY: Caller guarantees `self.address` is valid and aligned.
>         unsafe {
>             ptr::write_volatile(self.address, value);
>         }
>     }
> 
>     /// Reads a value from the hardware register using a volatile load.
>     ///
>     /// # Safety
>     /// The caller must ensure that:
>     /// 1. `address` points to a valid, readable MMIO address or initialized memory location.
>     /// 2. `address` is properly aligned for type `T`.
>     pub unsafe fn read_volatile(&self) -> T {
>         // SAFETY: Caller guarantees `self.address` is valid and readable.
>         unsafe {
>             ptr::read_volatile(self.address)
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_mmio_register_read_write() {
>         // Simulate MMIO register memory using a stack variable
>         let mut mock_register_mem: u32 = 0x0000_0000;
>         let mut reg = MmioRegister::new(&mut mock_register_mem as *mut u32);
> 
>         // Perform unsafe volatile write
>         unsafe {
>             // SAFETY: `mock_register_mem` is a valid, aligned stack allocation.
>             reg.write_volatile(0xCAFE_BABE);
>         }
>         assert_eq!(mock_register_mem, 0xCAFE_BABE);
> 
>         // Perform unsafe volatile read
>         let value = unsafe {
>             // SAFETY: `mock_register_mem` is valid for reading.
>             reg.read_volatile()
>         };
>         assert_eq!(value, 0xCAFE_BABE);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Embedded `#![no_std]` Compatibility**: Bare-metal embedded drivers cannot rely on the Rust standard library (`std`). Using `core::ptr` enables raw memory manipulation in standard-free environments.
> 2. **Volatile Operations**: `ptr::write_volatile` and `ptr::read_volatile` prevent LLVM compiler optimizations from caching or removing reads/writes to memory addresses whose values can change outside Rust's knowledge (such as hardware peripheral registers).
> 3. **Safety Contract (`# Safety`)**: Marking methods as `unsafe fn` shifts the burden of verifying memory validity, pointer alignment, and data race prevention to the caller.
> 4. **Testing Unsafe Abstractions**: Stack variables are used during testing as safe backing memory allocations to verify that raw pointer operations execute correctly without triggering hardware access faults.
> 
---

### Exercise 2: High-Performance Network Packet Header Parser (`unsafe fn` Unchecked Read)

**Scenario:** In high-speed network packet processing, checking array bounds on every field lookup adds latency. When packet header boundaries are pre-validated during initial ingress verification, subsequent field extractors use `unsafe fn` to bypass redundant bounds checks.

Implement:
1. An `unsafe fn read_u16_be_unchecked(slice: &[u8], offset: usize) -> u16` function that extracts a 16-bit big-endian integer from a byte slice at `offset` using raw pointer arithmetic (`slice.as_ptr().add(offset)`) and `core::ptr::read_unaligned`.
2. A safe wrapper function `parse_destination_port(packet: &[u8], offset: usize) -> Result<u16, &'static str>` that verifies `offset + 2 <= packet.len()` before calling `read_u16_be_unchecked`.
3. Unit tests verifying both direct `unsafe` invocation and boundary checking in the safe wrapper with `assert_eq!`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use core::ptr;
> 
> /// Reads a 16-bit big-endian unsigned integer from a slice at `offset` without bounds checking.
> ///
> /// # Safety
> /// The caller must guarantee that `offset + 2 <= slice.len()`.
> /// Violation of this invariant results in out-of-bounds pointer reads and Undefined Behavior.
> pub unsafe fn read_u16_be_unchecked(slice: &[u8], offset: usize) -> u16 {
>     // SAFETY: Caller guarantees `offset + 2` is within `slice.len()`.
>     unsafe {
>         let byte_ptr = slice.as_ptr().add(offset) as *const [u8; 2];
>         let bytes = ptr::read_unaligned(byte_ptr);
>         u16::from_be_bytes(bytes)
>     }
> }
> 
> /// Safe wrapper function that validates slice boundaries prior to calling `read_u16_be_unchecked`.
> pub fn parse_destination_port(packet: &[u8], offset: usize) -> Result<u16, &'static str> {
>     if offset + 2 > packet.len() {
>         return Err("Buffer underflow: slice too short for 16-bit field");
>     }
> 
>     // SAFETY: Boundary check above guarantees `offset + 2 <= packet.len()`.
>     unsafe {
>         Ok(read_u16_be_unchecked(packet, offset))
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_unchecked_u16_read() {
>         // Simulated Ethernet header: Src Port = 80 (0x0050), Dst Port = 443 (0x01BB)
>         let packet_bytes: [u8; 4] = [0x00, 0x50, 0x01, 0xBB];
> 
>         unsafe {
>             // SAFETY: offset 0 + 2 <= 4
>             let src_port = read_u16_be_unchecked(&packet_bytes, 0);
>             assert_eq!(src_port, 80);
> 
>             // SAFETY: offset 2 + 2 <= 4
>             let dst_port = read_u16_be_unchecked(&packet_bytes, 2);
>             assert_eq!(dst_port, 443);
>         }
>     }
> 
>     #[test]
>     fn test_safe_wrapper_validation() {
>         let packet_bytes: [u8; 4] = [0x00, 0x50, 0x01, 0xBB];
> 
>         // Valid extraction
>         assert_eq!(parse_destination_port(&packet_bytes, 2), Ok(443));
> 
>         // Out-of-bounds attempt returns Err safely without panicking or triggering UB
>         assert_eq!(
>             parse_destination_port(&packet_bytes, 3),
>             Err("Buffer underflow: slice too short for 16-bit field")
>         );
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Raw Pointer Arithmetic (`as_ptr().add()`)**: Obtains a raw pointer to `slice` elements and offsets it by `offset` bytes without performing runtime bounds validation.
> 2. **Unaligned Read (`ptr::read_unaligned`)**: Network packet headers are frequently packed without memory alignment padding. `read_unaligned` safely reads multi-byte primitive types from arbitrary raw pointers regardless of alignment constraints on architectures like ARM.
> 3. **Endianness Conversion (`u16::from_be_bytes`)**: Converts network byte order (Big Endian) to the host architecture's native byte order.
> 4. **Safe Abstraction Encapsulation**: Exposing a safe wrapper (`parse_destination_port`) that checks preconditions before calling an internal `unsafe fn` pattern is standard practice in high-performance Rust libraries.
> 
---

### Exercise 3: Zero-Overhead Parallel Slice Splitting (`unsafe fn split_at_mut_unchecked`)

**Scenario:** In parallel algorithms (such as divide-and-conquer map-reduce or thread pool work stealers), a mutable slice `&mut [T]` needs to be split into two non-overlapping mutable slices `(&mut [T], &mut [T])`. Rust's safe `split_at_mut` performs bounds checking (`mid <= len`). In tight inner loops where `mid` is proven valid by algorithm invariants, an unchecked variant avoids redundant branching.

Implement:
1. `pub unsafe fn split_at_mut_unchecked<T>(slice: &mut [T], mid: usize) -> (&mut [T], &mut [T])` which creates two non-overlapping mutable slices derived from `slice`.
2. Document all caller safety requirements in a `# Safety` doc block.
3. Write a unit test `test_split_at_mut_unchecked_concurrent_edits` demonstrating that both resulting slices can be concurrently mutated and verified using `assert_eq!`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use core::slice;
> 
> /// Splits a mutable slice into two sub-slices at index `mid` without bounds checking.
> ///
> /// # Safety
> /// The caller must guarantee that `mid <= slice.len()`.
> /// If `mid > slice.len()`, creating sub-slices beyond valid memory boundaries causes Undefined Behavior.
> pub unsafe fn split_at_mut_unchecked<T>(slice: &mut [T], mid: usize) -> (&mut [T], &mut [T]) {
>     let len = slice.len();
>     let ptr = slice.as_mut_ptr();
> 
>     // SAFETY: Caller guarantees `mid <= len`.
>     // The sub-ranges [ptr, ptr + mid) and [ptr + mid, ptr + len) are completely non-overlapping
>     // and point to valid, initialized elements derived from `slice`.
>     unsafe {
>         let head = slice::from_raw_parts_mut(ptr, mid);
>         let tail = slice::from_raw_parts_mut(ptr.add(mid), len - mid);
>         (head, tail)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_split_at_mut_unchecked_concurrent_edits() {
>         let mut numbers = [10, 20, 30, 40, 50, 60];
> 
>         // Unsafely split slice into two non-overlapping mutable sub-slices at index 3
>         let (left, right) = unsafe {
>             // SAFETY: mid (3) <= numbers.len() (6)
>             split_at_mut_unchecked(&mut numbers, 3)
>         };
> 
>         // Mutate left half
>         left[0] += 5;
>         left[2] += 5;
> 
>         // Mutate right half independently
>         right[0] *= 2;
>         right[2] *= 10;
> 
>         assert_eq!(left, &[15, 20, 35]);
>         assert_eq!(right, &[80, 50, 600]);
> 
>         // Verify underlying array reflected both mutations cleanly
>         assert_eq!(numbers, [15, 20, 35, 80, 50, 600]);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Aliasing Invariant Upholding**: Rust's borrow checker strictly forbids multiple active mutable references (`&mut T`) to overlapping memory. By deriving two non-overlapping raw pointers (`ptr` and `ptr.add(mid)`), `split_at_mut_unchecked` safely bypasses the borrow checker's slice overlap checks while maintaining the core aliasing guarantee.
> 2. **`slice::from_raw_parts_mut`**: Reconstructs a valid Rust mutable slice from a base raw pointer and length count.
> 3. **Precondition Responsibility**: Shifting the responsibility of `mid <= len` to the caller allows compiler LLVM optimization passes to eliminate branch instructions in hot performance loops.
> 
---

## 6. Related Terms


- [`unsafe` Block](unsafe_block.md) — The block construct used by callers to execute an `unsafe fn`.
- [Undefined Behavior (UB)](undefined_behavior.md) — The memory safety violations prevented by enforcing `unsafe fn` safety preconditions.
- [Raw Pointers (`*const T`, `*mut T`)](raw_pointers.md) — Common argument types accepted by `unsafe fn` functions.
- [FFI (Foreign Function Interface)](ffi.md) — Foreign functions exported from C libraries are automatically typed as `unsafe fn`.

---

## 7. Key Takeaways

- `unsafe fn` signals that calling the function requires callers to satisfy safety preconditions that the compiler cannot check.
- Always include a detailed `# Safety` section in doc comments listing caller invariant requirements.
- Use `unsafe fn` only when invalid parameters can lead to Undefined Behavior (UB), not for standard runtime error panics.
- Standard safe functions should wrap `unsafe fn` calls internally when preconditions can be validated programmatically.
