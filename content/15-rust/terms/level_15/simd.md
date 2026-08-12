# SIMD (`std::simd`)

> **Level 15 — Performance & Optimization**
> Single Instruction, Multiple Data (SIMD) hardware acceleration in Rust — using wide CPU vector registers (AVX-512, AVX2, NEON) to perform parallel mathematical operations on multiple data elements simultaneously.

---

## 1. Prerequisites


- [Zero-Cost Abstractions](zero_cost_abstractions.md) — How LLVM auto-vectorizes loops into SIMD instructions in release mode.
- [Release Profile](release_profile.md) — Optimization levels driving hardware instruction generation.

---

## 2. Term Category



**Rust Hardware Acceleration (explicit SIMD vector instructions)**: SIMD (Single Instruction, Multiple Data) is a hardware feature built into modern CPU architectures (x86_64 SSE/AVX, ARM NEON). Instead of processing one 32-bit number per CPU instruction (Scalar execution), SIMD vector registers (128-bit, 256-bit, or 512-bit wide) load multiple numbers (e.g. four 32-bit floats or eight 16-bit integers) and process them all in a **single CPU clock cycle**. In Rust, SIMD is accessible either automatically via LLVM Auto-Vectorization or explicitly using `std::simd` (portable SIMD) and `core::arch` hardware intrinsics.



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Consider adding two arrays of 8 floating-point numbers:
```rust
let a = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0];
let b = [10.0, 10.0, 10.0, 10.0, 10.0, 10.0, 10.0, 10.0];
```

In standard **Scalar Execution**:
- The CPU executes 8 separate `addss` instructions sequentially in a loop.
- Total time: 8 CPU clock cycles.

In **SIMD Vector Execution (256-bit AVX2)**:
- The CPU loads all 8 floats into a single 256-bit YMM vector register (`ymm0` and `ymm1`).
- It executes a single vector add instruction (`vaddps ymm0, ymm0, ymm1`).
- Total time: **1 CPU clock cycle** (an 8x throughput speedup!).

For data-parallel workloads — image processing, audio DSP, machine learning matrix multiplication, cryptography, and game physics — scalar loops leave up to 80–90% of the CPU's mathematical processing power unused.

Rust provides two complementary approaches to SIMD:
1. **Auto-Vectorization**: LLVM automatically transforms standard iterator/slice loops into SIMD assembly when compiling in release mode (`-C target-cpu=native`).
2. **Explicit Portable SIMD (`std::simd`)**: For algorithms where auto-vectorization fails due to complex branching or unaligned memory access, `std::simd` allows developers to write explicit, portable vector code using types like `f32x4`, `f32x8`, or `u8x16`.

### (2) Reality Metaphor

Imagine a **Grocery Store Checkout Counter vs Bulk Warehouse Scanner**:

- **Scalar Execution (Standard Loop)** is a traditional cashier scanning items one by one:
  - Pick up apple #1, scan, place in bag (**1 instruction**).
  - Pick up apple #2, scan, place in bag (**1 instruction**)...
  - Scanning 8 apples takes 8 individual scanner swipes.
- **SIMD Execution (`std::simd`)** is a wide-bed industrial 3D barcode scanner:
  - You place a tray containing 8 apples into the scanner simultaneously (**load 8 values into a 256-bit SIMD register**).
  - The scanner flashes a single laser beam across the entire tray (**single SIMD vector instruction**).
  - All 8 apples are scanned and tallied in 1 instant flash (**1 clock cycle**).

### (3) Code Examples

#### Short Snippet (Explicit Portable SIMD Addition with `std::simd`)

*Note: `std::simd` is available in standard Rust nightly / portable SIMD crate.*

```rust
#![feature(portable_simd)]
use std::simd::prelude::*;

fn main() {
    // Define 4-element SIMD vector types (128-bit vector register)
    let a = f32x4::from_array([1.0, 2.0, 3.0, 4.0]);
    let b = f32x4::from_array([10.0, 20.0, 30.0, 40.0]);

    // Single SIMD vector addition instruction (`+`)
    // Adds all 4 lane elements in parallel in 1 CPU clock cycle!
    let result: f32x4 = a + b;

    println!("SIMD vector sum: {:?}", result.to_array());
    // Output: SIMD vector sum: [11.0, 22.0, 33.0, 44.0]
}
```

#### Fuller Example (LLVM Auto-Vectorization vs Scalar Loop Benchmark)

```rust
use std::time::Instant;

/// Auto-Vectorizable Loop: LLVM automatically turns this into SIMD AVX2/NEON assembly in release mode!
pub fn vector_add_autovect(a: &[f32], b: &[f32], out: &mut [f32]) {
    assert_eq!(a.len(), b.len());
    assert_eq!(a.len(), out.len());

    // Simple contiguous iteration allows LLVM to vectorize in 8-element SIMD chunks
    for i in 0..a.len() {
        out[i] = a[i] + b[i];
    }
}

fn main() {
    let size = 10_000_000;
    let a = vec![1.5f32; size];
    let b = vec![2.5f32; size];
    let mut out = vec![0.0f32; size];

    let start = Instant::now();
    vector_add_autovect(&a, &b, &mut out);
    let duration = start.elapsed();

    println!("Processed {} floats in {:?}", size, duration);
    assert_eq!(out[0], 4.0);
    // When compiled with `cargo run --release -- -C target-cpu=native`,
    // LLVM generates 256-bit AVX2 SIMD instructions, processing 10,000,000 floats in milliseconds!
}
```

---

## 4. Scalar vs Auto-Vectorization vs Explicit `std::simd`

| Approach | Developer Effort | Portability | Performance Potential |
| :--- | :--- | :--- | :--- |
| **Scalar Loop** | Zero (Standard `for` loop) | 100% Universal | Baseline ($1\times$) |
| **LLVM Auto-Vectorization** | Low (Keep loops clean & contiguous) | 100% Universal | High ($4\times$ – $8\times$ in `--release`) |
| **Portable SIMD (`std::simd`)** | Medium (Write explicit `Simd<T, N>`) | High (Cross-platform abstractions) | Maximum ($8\times$ – $16\times$ guaranteed) |
| **Architecture Intrinsics (`core::arch`)** | High (x86 `_mm256_add_ps`) | Low (Requires target `#cfg` guards) | Maximum (Hardware-specific) |

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Expecting Auto-Vectorization in Debug Mode (`cargo run`)

**The mistake:** Testing a loop and finding no SIMD speedup when compiled without `--release`.

**Why it's wrong:** LLVM auto-vectorization passes are disabled in debug mode (`opt-level = 0`). You must compile in release mode (`cargo build --release`) to enable SIMD auto-vectorization.

*Incorrect:*
```bash
# ❌ Debug mode does NOT generate SIMD vector instructions!
cargo run
```

*Fix:*
```bash
# Correct: Enable release optimizations & native CPU SIMD instructions
RUSTFLAGS="-C target-cpu=native" cargo run --release
```

### Mistake 2: Writing Non-Contiguous or Pointer-Aliased Memory Loops

**The mistake:** Trying to auto-vectorize loops that use non-contiguous memory access (e.g. pointer chasing across linked lists) or complex branching inside the loop body.

**Why it's wrong:** SIMD instructions require contiguous memory alignment (loading arrays/slices sequentially into vector registers). Non-contiguous memory access or complex conditional branches force LLVM to fall back to slow scalar execution.

*Incorrect:*
```rust
// ❌ Cannot be auto-vectorized cleanly! Linked list pointer chasing is non-contiguous memory.
while let Some(node) = current_node {
    node.value += 1.0;
    current_node = node.next;
}
```

*Fix:*
```rust
// Correct: Use contiguous slices or vectors `&[f32]` for SIMD vectorization
for x in slice.iter_mut() {
    *x += 1.0;
}
```

### Mistake 3: Forgetting `-C target-cpu=native` for Target-Specific Hardware Instructions

**The mistake:** Compiling in release mode without telling `rustc` that the host CPU supports AVX2, AVX-512, or NEON.

**Why it's wrong:** By default, `rustc` targets a conservative baseline CPU architecture (e.g. generic x86_64) to ensure binary compatibility across old computers. To unlock your specific CPU's advanced SIMD vector extensions, compile with `target-cpu=native`.

---

## 5. Practice Exercises

### Exercise 1: Audio DSP Gain Scaling with Portable SIMD & Tail Handling

**Scenario:** In a Digital Audio Workstation (DAW) or embedded DSP pipeline, audio buffers are represented as contiguous 32-bit floating-point PCM samples (`&[f32]`). You need to scale the audio amplitude by multiplying every sample by a gain factor. Because audio buffer sizes (e.g., 514 samples) are not always exact multiples of the 256-bit SIMD register width (8 `f32` lanes), implement a portable SIMD function `scale_audio_gain` using Rust's `std::simd::f32x8` that processes data in 8-element SIMD vector chunks and handles any remaining unaligned tail samples using a scalar fallback loop. Include comprehensive unit tests to verify correctness for both aligned and non-aligned buffer sizes.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #![feature(portable_simd)]
> use std::simd::prelude::*;
> 
> /// Scales audio buffer PCM samples by a gain factor using 8-lane portable SIMD (`f32x8`).
> /// Processes contiguous 8-sample chunks in parallel and scalar-falls-back for tail elements.
> pub fn scale_audio_gain(samples: &mut [f32], gain: f32) {
>     let gain_vec = f32x8::splat(gain);
>     let chunk_size = 8;
>     
>     // Calculate how many full 8-element SIMD chunks exist
>     let chunks_len = samples.len() / chunk_size;
>     let simd_end = chunks_len * chunk_size;
> 
>     // 1. Process 8-sample SIMD vector chunks in parallel
>     for i in (0..simd_end).step_by(chunk_size) {
>         let chunk_slice = &samples[i..i + chunk_size];
>         let simd_chunk = f32x8::from_slice(chunk_slice);
>         let scaled_chunk = simd_chunk * gain_vec;
>         scaled_chunk.copy_to_slice(&mut samples[i..i + chunk_size]);
>     }
> 
>     // 2. Scalar fallback loop for remaining tail elements
>     for sample in &mut samples[simd_end..] {
>         *sample *= gain;
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_scale_audio_gain_aligned() {
>         // Buffer length = 16 (exactly two 8-lane SIMD vectors)
>         let mut buffer = vec![1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0,
>                               9.0, 10.0, 11.0, 12.0, 13.0, 14.0, 15.0, 16.0];
>         scale_audio_gain(&mut buffer, 0.5);
>         let expected = vec![0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0,
>                             4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0];
>         assert_eq!(buffer, expected);
>     }
> 
>     #[test]
>     fn test_scale_audio_gain_with_tail() {
>         // Buffer length = 11 (one 8-lane SIMD vector + 3 scalar tail elements)
>         let mut buffer = vec![2.0; 11];
>         scale_audio_gain(&mut buffer, 3.0);
>         let expected = vec![6.0; 11];
>         assert_eq!(buffer, expected);
>     }
> }
> ```
> 
> #### Technical Explanation
>
> 1. **`f32x8::splat(gain)`**: Broadcasts the scalar `gain` value across all 8 SIMD lanes simultaneously inside a 256-bit vector register (`[gain, gain, gain, gain, gain, gain, gain, gain]`).
> 2. **`from_slice` & `copy_to_slice`**: Efficiently loads 8 contiguous `f32` floats from slice memory into CPU SIMD registers, performs element-wise vector multiplication `simd_chunk * gain_vec` in a single CPU instruction cycle, and stores the results back to the buffer.
> 3. **Tail Handling Strategy**: Because slice lengths are arbitrarily dynamic, SIMD loops only iterate up to `simd_end` (a multiple of the lane width 8). A secondary scalar loop processes any remaining elements (`&mut samples[simd_end..]`) to prevent out-of-bounds access or silent truncation.
> 4. **Portable Abstraction**: Under the hood, `std::simd` lowers `f32x8` to x86_64 AVX2 (`vmulps`) or ARM NEON (`vmul.f32`) vector instructions depending on the compile target without requiring vendor-specific assembly.
> 
---

### Exercise 2: Accelerated Image RGB-to-Grayscale Luminance Conversion

**Scenario:** In image processing pipelines, converting color images to grayscale relies on the standard weighted luminance formula: $Y = 0.299R + 0.587G + 0.114B$. Standard scalar loops perform 3 floating-point multiplications and 2 additions per pixel sequentially. Write a high-throughput image filter function `convert_rgb_to_grayscale_simd` that processes 4 pixels concurrently using 128-bit portable SIMD (`f32x4`). Include unit tests proving mathematical equivalence between SIMD and standard scalar calculations.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #![feature(portable_simd)]
> use std::simd::prelude::*;
> 
> /// Converts separate R, G, B channel slices to Grayscale luminance output (`Y`)
> /// using 4-lane portable SIMD (`f32x4`) with scalar tail fallback.
> pub fn convert_rgb_to_grayscale_simd(
>     r: &[f32],
>     g: &[f32],
>     b: &[f32],
>     output: &mut [f32],
> ) {
>     assert_eq!(r.len(), g.len());
>     assert_eq!(r.len(), b.len());
>     assert_eq!(r.len(), output.len());
> 
>     let w_r = f32x4::splat(0.299);
>     let w_g = f32x4::splat(0.587);
>     let w_b = f32x4::splat(0.114);
> 
>     let chunk_size = 4;
>     let chunks = r.len() / chunk_size;
>     let simd_end = chunks * chunk_size;
> 
>     // 1. Vectorized loop: Process 4 RGB pixels per cycle
>     for i in (0..simd_end).step_by(chunk_size) {
>         let r_vec = f32x4::from_slice(&r[i..i + chunk_size]);
>         let g_vec = f32x4::from_slice(&g[i..i + chunk_size]);
>         let b_vec = f32x4::from_slice(&b[i..i + chunk_size]);
> 
>         // Weighted luminance formula: Y = 0.299*R + 0.587*G + 0.114*B
>         let y_vec = (r_vec * w_r) + (g_vec * w_g) + (b_vec * w_b);
>         y_vec.copy_to_slice(&mut output[i..i + chunk_size]);
>     }
> 
>     // 2. Scalar fallback loop for tail pixels
>     for i in simd_end..r.len() {
>         output[i] = (r[i] * 0.299) + (g[i] * 0.587) + (b[i] * 0.114);
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_rgb_to_grayscale_simd_correctness() {
>         let r = vec![255.0, 0.0, 100.0, 50.0, 200.0];
>         let g = vec![0.0, 255.0, 100.0, 150.0, 100.0];
>         let b = vec![0.0, 0.0, 100.0, 200.0, 50.0];
>         let mut output = vec![0.0; 5];
> 
>         convert_rgb_to_grayscale_simd(&r, &g, &b, &mut output);
> 
>         // Verify against expected scalar calculations for all 5 pixels (4 SIMD + 1 tail)
>         for i in 0..5 {
>             let expected = (r[i] * 0.299) + (g[i] * 0.587) + (b[i] * 0.114);
>             assert!(
>                 (output[i] - expected).abs() < 1e-4,
>                 "Mismatch at index {}: got {}, expected {}",
>                 i,
>                 output[i],
>                 expected
>             );
>         }
>     }
> }
> ```
> 
> #### Technical Explanation
>
> 1. **Data Parallelism in Graphics**: Standard RGB frame buffers store component values across contiguous memory arrays. By partitioning computation into `f32x4` SIMD vectors, 4 full pixels are converted per CPU loop iteration.
> 2. **Fused Vector Operations**: Vectorized expressions like `(r_vec * w_r) + (g_vec * w_g) + (b_vec * w_b)` compile into hardware-accelerated multiply-add instructions (e.g. FMA3 on x86 or ARM NEON `vmla`), calculating results in fewer total instruction issue cycles.
> 3. **Mathematical Equivalence & Float Assertions**: Unit test uses epsilon floating-point comparisons (`(output[i] - expected).abs() < 1e-4`) to ensure accuracy while allowing for minimal SIMD vs scalar floating-point rounding variations.
> 
---

### Exercise 3: Runtime Target Feature Detection vs Architecture Intrinsics

**Scenario:** Standard portable SIMD relies on compiler abstractions, but legacy or specialized systems often require target-specific architecture intrinsics (`core::arch::x86_64`) for maximum hardware control. When deploying binaries across heterogenous x86_64 servers, hardcoding AVX2 instructions without feature detection can trigger `SIGILL` (Illegal Instruction) crashes on older CPUs. Write a safe function `apply_xor_mask` that uses `is_x86_feature_detected!("avx2")` at runtime to safely dispatch to an unsafe AVX2 intrinsic function (`#[target_feature(enable = "avx2")]`), while gracefully falling back to a scalar XOR implementation on older CPUs.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[cfg(target_arch = "x86_64")]
> use core::arch::x86_64::*;
> 
> /// Applies an 8-bit XOR key across a byte payload slice.
> /// Dispatches to hardware-accelerated AVX2 intrinsics when supported by host CPU.
> pub fn apply_xor_mask(buffer: &mut [u8], key: u8) {
>     #[cfg(target_arch = "x86_64")]
>     {
>         if is_x86_feature_detected!("avx2") {
>             // SAFETY: Checked that host CPU supports AVX2 target feature at runtime.
>             unsafe { apply_xor_mask_avx2(buffer, key) };
>             return;
>         }
>     }
> 
>     // Fallback for non-x86_64 or CPUs without AVX2
>     apply_xor_mask_scalar(buffer, key);
> }
> 
> /// Unsafe hardware-specific AVX2 implementation (256-bit / 32-byte chunks).
> #[cfg(target_arch = "x86_64")]
> #[target_feature(enable = "avx2")]
> unsafe fn apply_xor_mask_avx2(buffer: &mut [u8], key: u8) {
>     let chunk_size = 32;
>     let chunks = buffer.len() / chunk_size;
>     let simd_end = chunks * chunk_size;
> 
>     // Broadcast 8-bit key across a 256-bit AVX2 register (32 copies of key)
>     let mask_reg = _mm256_set1_epi8(key as i8);
> 
>     for i in (0..simd_end).step_by(chunk_size) {
>         let ptr = buffer.as_mut_ptr().add(i) as *mut __m256i;
>         // Load unaligned 256-bit vector from buffer
>         let data = _mm256_loadu_si256(ptr);
>         // Execute 256-bit vector XOR in 1 clock cycle
>         let xor_res = _mm256_xor_si256(data, mask_reg);
>         // Store vector result back to buffer
>         _mm256_storeu_si256(ptr, xor_res);
>     }
> 
>     // Process remaining tail elements using scalar logic
>     for byte in &mut buffer[simd_end..] {
>         *byte ^= key;
>     }
> }
> 
> /// Portable scalar fallback loop.
> fn apply_xor_mask_scalar(buffer: &mut [u8], key: u8) {
>     for byte in buffer.iter_mut() {
>         *byte ^= key;
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_xor_mask_roundtrip() {
>         let original = b"High-Performance SIMD Network Packet Cipher Engine";
>         let key = 0xAA;
>         let mut buffer = original.to_vec();
> 
>         // First pass: encrypt payload with XOR mask
>         apply_xor_mask(&mut buffer, key);
>         assert_ne!(buffer, original.to_vec());
> 
>         // Second pass: decrypting with same XOR mask restores original bytes
>         apply_xor_mask(&mut buffer, key);
>         assert_eq!(buffer, original.to_vec());
>     }
> 
>     #[test]
>     fn test_avx2_scalar_parity() {
>         let data = b"Test buffer for AVX2 and scalar parity checking!";
>         let key = 0x55;
> 
>         let mut data_scalar = data.to_vec();
>         apply_xor_mask_scalar(&mut data_scalar, key);
> 
>         let mut data_dispatched = data.to_vec();
>         apply_xor_mask(&mut data_dispatched, key);
> 
>         assert_eq!(data_scalar, data_dispatched);
>     }
> }
> ```
> 
> #### Technical Explanation
>
> 1. **Runtime Target Feature Detection (`is_x86_feature_detected!`)**: Checks CPUID bits dynamically at application startup. This allows distributing a single binary that uses 256-bit AVX2 on modern hardware without crashing older machines lacking AVX2 instructions.
> 2. **Target Feature Function Attribute (`#[target_feature(enable = "avx2")]`)**: Informs LLVM that inside `apply_xor_mask_avx2`, it can freely emit AVX2 assembly (`_mm256_xor_si256`) regardless of global `-C target-cpu` flags. Calling this function without runtime CPU checks is `unsafe` because executing AVX2 instructions on non-supporting hardware raises hardware processor exceptions.
> 3. **Architecture Intrinsics vs Portable SIMD**: While `std::simd` targets cross-platform portability, `core::arch::x86_64` intrinsics provide direct, 1:1 access to specific CPU instructions (`_mm256_loadu_si256`, `_mm256_xor_si256`) for low-level protocol drivers or cryptographic primitives.
> 
> 
> 
---

## 6. Related Terms


- [Zero-Cost Abstractions](zero_cost_abstractions.md) — How auto-vectorization transforms high-level iterators into SIMD.
- [Release Profile](release_profile.md) — Optimization profile driving SIMD code generation.
- [`perf` / `flamegraph`](perf_flamegraph.md) — Profiling tools used to detect un-vectorized loop bottlenecks.

---

## 7. Key Takeaways

- SIMD (Single Instruction, Multiple Data) processes multiple data elements simultaneously using wide CPU vector registers (128-bit, 256-bit, 512-bit).
- LLVM performs Auto-Vectorization on clean, contiguous slice loops when compiled in Release mode (`--release`).
- Explicit Portable SIMD (`std::simd`) provides type-safe vector types (`f32x4`, `f32x8`, `u8x16`) for manual hardware acceleration.
- Pass `RUSTFLAGS="-C target-cpu=native"` during release builds to unlock your host CPU's full SIMD instruction capabilities (AVX2, AVX-512, NEON).
- Ensure data memory is contiguous (`&[T]` slices) and avoid complex branching inside vectorizable loops.
