# Inlining (`#[inline]`)

> **Level 15 — Performance & Optimization**
> Compiler attributes (`#[inline]`, `#[inline(always)]`, `#[inline(never)]`) that control function inlining — replacing a function call instruction with the function's actual body code to eliminate call overhead, unlock downstream LLVM optimizations, and enable cross-crate code expansion.

---

## 1. Prerequisites

- [Zero-Cost Abstractions](../level_15/zero_cost_abstractions.md) — How compiler optimizations eliminate high-level function call overhead.
- [Functions](../level_01/function.md) — Function calls, stack frames, and parameter passing mechanics.
- [Link-Time Optimization (LTO)](../level_15/link_time_optimization.md) — Cross-crate optimization pipeline paired with inlining.

---

## 2. Term Category

**Performance / Optimization / Compiler Attribute**: Function Inlining is an LLVM compiler optimization technique. When a function is inlined, `rustc` replaces the CPU `call` instruction and stack frame setup with the literal body code of the target function directly at the caller site. The `#[inline]` attribute serves two purposes in Rust: it acts as a strong optimization hint to LLVM, and critically, **makes a function's intermediate representation (MIR/LLVM IR) available across crate boundaries** for generic or cross-crate inlining.

---

## 3. Environment Context

**Universal Rust**: `#[inline]` attributes work across all Rust compilation targets (`std`, `no_std`, WASM, embedded microcontrollers).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"

Executing a standard function call instruction at the assembly level requires:
1. Pushing argument registers onto the CPU stack frame.
2. Executing a `call` instruction (jumping to a different memory address, flushing CPU pipeline caches).
3. Executing the function body.
4. Executing a `ret` instruction and popping the stack frame back.

For small, frequently called helper functions (such as getter methods `fn x(&self) -> f32 { self.x }`, coordinate additions, or iterator closures), the administrative overhead of setting up and tearing down the function call frame can take 5–10 times longer than executing the actual function logic itself!

Furthermore, function call boundaries act as "optimization barriers": the compiler LLVM backend cannot optimize across a separate function call boundary unless it can see inside the function.

Function Inlining solves this:
- **Removes Overhead**: Eliminates `call`, `ret`, and stack frame allocations completely.
- **Unlocks Downstream Optimizations**: Once inlined, LLVM can apply constant folding, dead code elimination, and loop vectorization across the combined caller-callee body.
- **Cross-Crate Availability**: By default, `rustc` compiles each crate into a separate object file and discards internal function code representations. Marking a public library function `#[inline]` ensures its IR is exported so downstream consumer crates can inline it!

### (2) Inlining Attribute Variants

| Attribute | Behavior / Compiler Directive |
| :--- | :--- |
| **`#[inline]`** | Hints to LLVM to inline the function, AND exports its code representation across crate boundaries. |
| **`#[inline(always)]`** | Forces LLVM to inline the function unconditionally (unless physically impossible, like recursion). |
| **`#[inline(never)]`** | Forbids LLVM from inlining the function under any circumstance (useful for cold error handlers or stack profiling). |

### (3) Reality Metaphor

Imagine a **Macro Key on a Computer Keyboard vs Phone Calling an Assistant**:

- **A Standard Function Call** is like dialing your assistant on the phone every time you need a zip code (`call lookup_zip()`):
  - You stop typing (**pause current stack execution**).
  - Dial the number and wait for the line to connect (**jump to instruction address & allocate stack frame**).
  - The assistant says "90210" (**execute return**).
  - You hang up the phone and resume typing (**tear down stack frame**).
- **Inlining (`#[inline]`)** is like programming a single macro key on your keyboard to instantly print "90210":
  - The zip code text is pasted directly into your document at the cursor position (**function body expanded directly into caller code**).
  - Zero phone dialing overhead, zero waiting for connection, and now your text editor can automatically format the zip code inline (**unlocks downstream LLVM optimizations**).

### (4) Code Examples

#### Short Snippet (Getter Methods with `#[inline]`)

```rust
pub struct Point3D {
    pub x: f32,
    pub y: f32,
    pub z: f32,
}

impl Point3D {
    #[inline]
    pub fn x(&self) -> f32 {
        self.x
    }

    #[inline]
    pub fn y(&self) -> f32 {
        self.y
    }
}

fn main() {
    let p = Point3D { x: 10.0, y: 20.0, z: 30.0 };

    // With `#[inline]`, calling `p.x()` is compiled directly to accessing `p.x` memory offset
    // without executing a CPU `call` instruction!
    let val = p.x();
    println!("Point x: {}", val);
}
```

#### Fuller Example (`#[inline(always)]` vs `#[inline(never)]` Benchmark Setup)

```rust
use std::time::Instant;

/// Small hot helper function forced to inline unconditionally
#[inline(always)]
fn fast_add_always(a: u64, b: u64) -> u64 {
    a.wrapping_add(b)
}

/// Same helper function forbidden from inlining
#[inline(never)]
fn fast_add_never(a: u64, b: u64) -> u64 {
    a.wrapping_add(b)
}

fn benchmark_inlining() {
    let iterations = 50_000_000;

    // 1. Benchmark `inline(always)`
    let start_always = Instant::now();
    let mut sum_always = 0u64;
    for i in 0..iterations {
        sum_always = fast_add_always(sum_always, i);
    }
    let duration_always = start_always.elapsed();

    // 2. Benchmark `inline(never)`
    let start_never = Instant::now();
    let mut sum_never = 0u64;
    for i in 0..iterations {
        sum_never = fast_add_never(sum_never, i);
    }
    let duration_never = start_never.elapsed();

    println!("inline(always) duration: {:?}", duration_always);
    println!("inline(never) duration:  {:?}", duration_never);
    assert_eq!(sum_always, sum_never);
}

fn main() {
    benchmark_inlining();
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Overusing `#[inline(always)]` Everywhere

**The mistake:** Annotating every single function in a codebase with `#[inline(always)]`.

**Why it's wrong:** Inlining increases compiled binary size ("code bloat"). If large functions are inlined into dozens of caller locations, the binary inflates significantly, spilling out of the CPU's Instruction Cache (I-Cache). Instruction cache misses cause severe performance degradation that outweighs the saved function call overhead.

*Incorrect:*
```rust
// ❌ Anti-pattern: Forcing inlining on a 200-line complex processing function!
#[inline(always)] 
pub fn process_complex_matrix_data(...) { ... }
```

*Fix:*
```rust
// Let LLVM decide for large functions, or use standard `#[inline]` for small library helpers
pub fn process_complex_matrix_data(...) { ... }
```

### Mistake 2: Forgetting `#[inline]` on Small Public Library Functions

**The mistake:** Writing small public helper functions or trait methods in a library crate without `#[inline]`.

**Why it's wrong:** Without `#[inline]`, `rustc` compiles library functions into a separate `.rlib` binary object file and discards their intermediate representation. Consumer crates linking against your library CANNOT inline those small functions across crate boundaries unless Link-Time Optimization (LTO) is explicitly enabled by the consumer.

*Incorrect:*
```rust
// In a library crate (my_crate/src/lib.rs):
// ❌ Downstream crates cannot inline this small 1-line getter!
pub fn get_id(&self) -> u64 { self.id }
```

*Fix:*
```rust
// Correct: Export IR representation for cross-crate inlining
#[inline]
pub fn get_id(&self) -> u64 { self.id }
```

### Mistake 3: Using `#[inline]` on Recursive Functions

**The mistake:** Annotating a recursive function with `#[inline(always)]`.

**Why it's wrong:** A function cannot inline itself infinitely. LLVM will either ignore the attribute or emit a compile-time warning/error.

---

## 6. Practice Exercises

### Exercise 1: Cross-Crate Embedded Telemetry & Data Scaling (`#[inline]`)

**Problem:**
You are developing a `#![no_std]` telemetry library crate for embedded microcontrollers. The library exports sensor calibration functions that convert raw 12-bit Analog-to-Digital Converter (ADC) values into normalized floating-point ratios and scaled millivolt integers inside high-frequency Interrupt Service Routines (ISRs). 

Without explicit annotations, `rustc` compiles functions in library crates into separate binary compilation units, discarding their intermediate representations (MIR/LLVM IR). Consequently, consumer application crates calling your library cannot inline these micro-conversions across crate boundaries, introducing unnecessary function call overhead (stack frame allocation and jump instructions) in time-critical ISR loops.

Implement a `#![no_std]` sensor processing module with:
1. `normalize_adc_12bit(raw: u16) -> f32` annotated with `#[inline]` to export IR across crate boundaries and normalize values (`0..=4095`) to `0.0..=1.0`.
2. `scale_to_millivolts(raw: u16, v_ref_mv: u32) -> u32` annotated with `#[inline]` using integer arithmetic.
3. Unit tests using `assert_eq!` verifying boundary behavior (0, max 4095, bitwise masking of out-of-range bits).

> [!check]- Answer
> ```rust
> #![no_std]
> 
> /// Normalizes a raw 12-bit ADC reading (0 to 4095) into a floating-point factor (0.0 to 1.0).
> ///
> /// Marking this function `#[inline]` serves two critical purposes:
> /// 1. It acts as a strong optimization hint to LLVM to replace call sites with direct division.
> /// 2. It preserves and exports the function's intermediate representation (IR) so downstream
> ///    consumer crates can inline it across crate boundaries without needing LTO.
> #[inline]
> pub fn normalize_adc_12bit(raw: u16) -> f32 {
>     let masked = raw & 0x0FFF; // Ensure only lower 12 bits are processed
>     (masked as f32) / 4095.0
> }
> 
> /// Scales a raw 12-bit ADC reading to millivolts given a reference voltage in millivolts.
> /// Uses fixed-point integer arithmetic to avoid floating-point hardware requirements on Cortex-M0.
> #[inline]
> pub fn scale_to_millivolts(raw: u16, v_ref_mv: u32) -> u32 {
>     let masked = (raw & 0x0FFF) as u32;
>     (masked * v_ref_mv) / 4095
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_adc_normalization_bounds() {
>         // Min value 0 -> 0.0
>         assert_eq!(normalize_adc_12bit(0), 0.0);
>         // Max 12-bit value 4095 -> 1.0
>         assert_eq!(normalize_adc_12bit(4095), 1.0);
>         // Out-of-range value 0xFFFF is masked to 0x0FFF (4095) -> 1.0
>         assert_eq!(normalize_adc_12bit(0xFFFF), 1.0);
>     }
> 
>     #[test]
>     fn test_millivolt_scaling() {
>         let v_ref = 3300; // 3.3V system reference
>         assert_eq!(scale_to_millivolts(0, v_ref), 0);
>         assert_eq!(scale_to_millivolts(4095, v_ref), 3300);
>         // Mid-scale: 2047 * 3300 / 4095 = 1649 mV
>         assert_eq!(scale_to_millivolts(2047, v_ref), 1649);
>     }
> }
> ```
>
> **Explanation:**
> 1. **Cross-Crate IR Export**: In Rust's compilation model, library functions are compiled independently into `.rlib` binary artifacts. Without `#[inline]`, the LLVM IR for non-generic public functions is discarded after compilation. Decorating functions with `#[inline]` instructs `rustc` to emit the function's MIR/LLVM IR into crate metadata, permitting consumer crates to expand `normalize_adc_12bit` directly into caller code during compilation.
> 2. **ISR Call Overhead Elimination**: In embedded microcontrollers (such as ARM Cortex-M), executing a function call requires pushing registers onto the MSP/PSP stack frame and calling `BL` (Branch with Link). Inlining substitutes these instructions with direct multiplication and bitwise AND (`AND`, `MUL`, `SDIV`), preserving precious clock cycles inside real-time Interrupt Service Routines.
> 3. **Bit-Masking (`0x0FFF`)**: The masking operation `raw & 0x0FFF` limits the input to 12 bits. Because the function is inlined, if a caller passes a constant like `scale_to_millivolts(4095, 3300)`, LLVM performs constant folding at compile time, reducing the entire operation to the static constant integer `3300`.

---

### Exercise 2: Real-Time CAN Bus Header Parsing (`#[inline(always)]`)

**Problem:**
In an Automotive CAN bus (Controller Area Network) gateway driver, millions of 32-bit hardware register frames are received every second. Each frame header packages multiple bit-fields:
- **Priority**: Bits `0..=2` (3 bits, values `0..=7`).
- **Message ID**: Bits `3..=13` (11 bits, values `0..=2047`).
- **Extended Frame Flag**: Bit `14` (1 bit, boolean).

To guarantee zero latency budget and force LLVM to eliminate function call boundaries even in non-optimized debug builds or complex callers, write a `#![no_std]` bit-field extraction struct `CanHeader(pub u32)` with accessor methods `priority()`, `message_id()`, and `is_extended()` marked `#[inline(always)]`. Add unit tests using `assert_eq!` and `assert!`.

> [!check]- Answer
> ```rust
> #![no_std]
> 
> /// Represents a raw 32-bit CAN bus hardware register word.
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub struct CanHeader(pub u32);
> 
> impl CanHeader {
>     /// Extracts priority bit-field (bits 0..=2).
>     /// `#[inline(always)]` bypasses standard compiler heuristics and forces LLVM
>     /// to inline the instruction directly at the call site.
>     #[inline(always)]
>     pub fn priority(&self) -> u8 {
>         (self.0 & 0b111) as u8
>     }
> 
>     /// Extracts the 11-bit standard message identifier (bits 3..=13).
>     #[inline(always)]
>     pub fn message_id(&self) -> u16 {
>         ((self.0 >> 3) & 0x07FF) as u16
>     }
> 
>     /// Checks if the extended frame flag bit (bit 14) is set.
>     #[inline(always)]
>     pub fn is_extended(&self) -> bool {
>         ((self.0 >> 14) & 1) != 0
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_can_header_decoding() {
>         // Construct header: priority = 5 (101b), message_id = 0x123 (291), is_extended = 1
>         let raw = 5 | (0x123 << 3) | (1 << 14);
>         let header = CanHeader(raw);
> 
>         assert_eq!(header.priority(), 5);
>         assert_eq!(header.message_id(), 0x123);
>         assert!(header.is_extended());
>     }
> 
>     #[test]
>     fn test_can_header_zero_state() {
>         let header = CanHeader(0);
>         assert_eq!(header.priority(), 0);
>         assert_eq!(header.message_id(), 0);
>         assert!(!header.is_extended());
>     }
> }
> ```
>
> **Explanation:**
> 1. **Force-Inlining Semantics (`#[inline(always)]`)**: While `#[inline]` is a strong suggestion to LLVM, `#[inline(always)]` overrides internal optimization cost heuristics, forcing the compiler to expand the function body inline everywhere. This is particularly useful for single-instruction micro-accessors where the overhead of a function call (`push`, `mov`, `pop`, `ret`) vastly exceeds the cost of bitwise operations (`UBFX` or `LSR` + `AND`).
> 2. **Bitwise Extraction Mechanics**:
>    - `self.0 & 0b111`: Masks off everything except the lowest 3 bits.
>    - `(self.0 >> 3) & 0x07FF`: Shifts right by 3 bits to align the message ID to bit 0, then masks 11 bits (`0x07FF` = `2047`).
>    - `((self.0 >> 14) & 1) != 0`: Shifts right by 14 bits to isolate bit 14, converting non-zero to boolean.
> 3. **Constant Folding Opportunity**: Because these accessor methods are forced inline, if a `CanHeader` instance is constructed from a compile-time constant (e.g. `CanHeader(0x492D)`), LLVM completely evaluates `header.message_id()` during compilation and replaces the entire call with the literal constant `0x123` in assembly.

---

### Exercise 3: Hot/Cold Path Splitting for I-Cache Efficiency (`#[inline(never)]`)

**Problem:**
High-throughput network stack drivers process millions of packets per second. In 99.9% of cases, incoming packet headers are valid (the "hot path"), requiring only a tiny magic byte check and length validation. However, when an invalid header or truncated packet arrives (the "cold path"), the driver constructs a detailed error enum containing diagnostic metadata.

If the complex, cold error-construction logic is allowed to inline into the hot packet loop, it inflates the compiled function size, causing CPU Instruction Cache (I-Cache) thrashing. 

Design a packet parsing driver that:
1. Keeps the hot fast-path function `process_packet_header(bytes: &[u8]) -> Result<&[u8], PacketError>` small and marked `#[inline]`.
2. Offloads rare error logging/construction paths to standalone helper functions (`log_and_build_magic_error` and `log_and_build_short_payload_error`) annotated with `#[inline(never)]`.
3. Includes unit tests with `assert_eq!` verifying successful slice parsing and precise error variant returns.

> [!check]- Answer
> ```rust
> #[derive(Debug, PartialEq, Eq)]
> pub enum PacketError {
>     InvalidMagicNumber(u8),
>     PayloadTooShort { expected: usize, actual: usize },
> }
> 
> /// Hot Fast Path: kept compact so LLVM can inline it directly into caller loops.
> /// Validates the packet magic byte (0xAA) and returns the remaining payload slice.
> #[inline]
> pub fn process_packet_header(bytes: &[u8]) -> Result<&[u8], PacketError> {
>     // Fast check 1: minimum packet length
>     if bytes.len() < 4 {
>         // Cold path jump: offloaded out-of-line
>         return Err(log_and_build_short_payload_error(4, bytes.len()));
>     }
> 
>     // Fast check 2: magic byte header validation
>     if bytes[0] != 0xAA {
>         // Cold path jump: offloaded out-of-line
>         return Err(log_and_build_magic_error(bytes[0]));
>     }
> 
>     // Successful fast path execution
>     Ok(&bytes[1..])
> }
> 
> /// Cold Error Path 1: handles magic byte failure diagnostic formatting.
> /// `#[inline(never)]` ensures this cold assembly code is placed in a separate memory location,
> /// keeping the hot path instruction memory contiguous and I-Cache friendly.
> #[inline(never)]
> fn log_and_build_magic_error(magic: u8) -> PacketError {
>     // In production drivers: increment telemetry counters, emit trace logs, etc.
>     PacketError::InvalidMagicNumber(magic)
> }
> 
> /// Cold Error Path 2: handles short payload error reporting.
> #[inline(never)]
> fn log_and_build_short_payload_error(expected: usize, actual: usize) -> PacketError {
>     PacketError::PayloadTooShort { expected, actual }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_process_packet_header_success() {
>         let raw_packet = [0xAA, 0x10, 0x20, 0x30];
>         let result = process_packet_header(&raw_packet);
>         assert_eq!(result, Ok(&[0x10, 0x20, 0x30][..]));
>     }
> 
>     #[test]
>     fn test_process_packet_header_invalid_magic() {
>         let raw_packet = [0xFF, 0x10, 0x20, 0x30];
>         let result = process_packet_header(&raw_packet);
>         assert_eq!(result, Err(PacketError::InvalidMagicNumber(0xFF)));
>     }
> 
>     #[test]
>     fn test_process_packet_header_short_payload() {
>         let raw_packet = [0xAA, 0x10];
>         let result = process_packet_header(&raw_packet);
>         assert_eq!(
>             result,
>             Err(PacketError::PayloadTooShort { expected: 4, actual: 2 })
>         );
>     }
> }
> ```
>
> **Explanation:**
> 1. **I-Cache Optimization via Hot/Cold Splitting**: High-performance CPUs rely on L1 Instruction Caches (I-Cache) to execute instructions at full clock speed. If a function contains large string formatting or complex error handling branches, inlining the entire body fills the I-Cache lines with assembly code that is rarely executed. Using `#[inline(never)]` forces the compiler to keep error handling code in a remote memory section.
> 2. **Assembly Compactness**: With the cold path offloaded, the assembly for `process_packet_header` reduces to a few comparison and conditional branch instructions (`CMP`, `JNE`). This allows LLVM to comfortably inline `process_packet_header` into the main processing loop while keeping the loop tight enough to fit inside a single 64-byte I-Cache line.
> 3. **Preventing Code Bloat**: If `log_and_build_magic_error` were inlined into every caller of `process_packet_header`, the error reporting logic would be duplicated dozens of times across the compiled binary. `#[inline(never)]` ensures a single shared instance of the error function exists in the binary.

---

## 7. Related Terms

- [Zero-Cost Abstractions](../level_15/zero_cost_abstractions.md) — Inlining is a core mechanism enabling zero-cost abstractions.
- [Link-Time Optimization (LTO)](../level_15/link_time_optimization.md) — Cross-crate optimization allowing inlining without `#[inline]`.
- [`#[cold]` / `#[hot]`](../level_15/cold_hot_attributes.md) — Compiler attributes for branch prediction and call frequency.
- [Release Profile](../level_15/release_profile.md) — Cargo build profile where inlining optimizations are enabled.

---

## 8. Key Takeaways

- Inlining replaces a CPU function `call` with the literal function body, eliminating call overhead and unlocking downstream LLVM optimizations.
- `#[inline]` hints to LLVM to inline the function AND exports its code representation across crate boundaries.
- `#[inline(always)]` forces inlining; `#[inline(never)]` forbids inlining (ideal for cold error handlers).
- Use `#[inline]` on small public library helpers, getters, and iterator closures.
- Avoid `#[inline(always)]` on large functions to prevent binary code bloat and CPU instruction cache (I-Cache) misses.
