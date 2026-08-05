# Inline Assembly (`asm!`)

> **Level 13 — Rust**
> `core::arch::asm!` macro for inserting raw machine assembly instructions directly into Rust code inside `unsafe` blocks.

---

## 1. Prerequisites

- [`unsafe` Block](unsafe_block.md) — Unsafe execution context.

---

## 2. Term Category

**Unsafe / Systems**: `core::arch::asm!` macro for inserting raw machine assembly instructions directly into Rust code inside `unsafe` blocks.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Compilers cannot emit every target-specific CPU instruction (such as reading hardware timestamp counters `rdtsc`, executing special vector instructions, or invoking kernel hypercalls).

The `asm!` macro allows developers to inject raw, architecture-specific assembly instructions directly into the target machine binary, enabling direct low-level hardware control, custom register management, and bare-metal OS kernel primitives.

### (2) Reality Metaphor

Driving a modern automobile: writing standard Rust is driving with automatic transmission and lane assist; using `asm!` is opening a hatch in the vehicle floorboard and manually adjusting the engine throttle linkage by hand.

### (3) Rust Code Examples

#### Short Snippet
```rust
use std::arch::asm;
let mut val: u64 = 10;
unsafe { asm!("add {0}, 1", inout(reg) val); }
```

#### Fuller Example
```rust
#[cfg(target_arch = "x86_64")]
use std::arch::asm;

#[cfg(target_arch = "x86_64")]
pub fn read_cpu_timestamp() -> u64 {
    let low: u32;
    let high: u32;
    unsafe {
        asm!(
            "rdtsc",
            out("eax") low,
            out("edx") high,
            options(nomem, nostack)
        );
    }
    ((high as u64) << 32) | (low as u64)
}

fn main() {
    #[cfg(target_arch = "x86_64")]
    {
        let tsc = read_cpu_timestamp();
        assert!(tsc > 0);
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Writing Assembly Without Architecture `#[cfg]` Gates

**The mistake:** Compiling architecture-specific instructions (like x86 `rdtsc` or ARM `isb`) across all target architectures.

**Why it is wrong:** Assembly instructions are CPU architecture specific. Compiling x86 instructions for ARM target hardware causes compilation failures.

*Incorrect:*
```rust
unsafe { asm!("rdtsc"); } // Fails on ARM/AArch64 targets!
```

*Fix:*
```rust
#[cfg(target_arch = "x86_64")] unsafe { asm!("rdtsc", out("eax") _, out("edx") _); }
```

### Mistake 2: Failing to Declare Overwritten (Clobbered) CPU Registers

**The mistake:** Modifying a register inside `asm!` without declaring it to the compiler via `out(...)` or `inout(...)`.

**Why it is wrong:** The Rust compiler assumes it owns register state across instructions. Silently mutating undeclared registers overwrites local variables, causing catastrophic Undefined Behavior.

*Incorrect:*
```rust
unsafe { asm!("mov rcx, 1"); } // Overwrites rcx silently!
```

*Fix:*
```rust
unsafe { asm!("mov rcx, 1", out("rcx") _); } // Tells compiler rcx is clobbered!
```

### Mistake 3: Omitting Optimization Flags (`options(nomem, nostack)`)

**The mistake:** Forgetting to specify `options(nomem, nostack)` for pure register arithmetic.

**Why it is wrong:** The compiler assumes undeclared assembly can read or write any memory location, forcing it to flush all cached register variables to RAM before the assembly block.

*Incorrect:*
```rust
unsafe { asm!("add {0}, 1", inout(reg) val); }
```

*Fix:*
```rust
unsafe { asm!("add {0}, 1", inout(reg) val, options(nomem, nostack)); }
```

---

## 5. Practice Exercises

### Exercise 1: x86_64 Fast Bitwise Left Shift Assembly Function

**Scenario:** Implement a high-performance left-shift function `fast_shl_one(val: u64) -> u64` using `asm!` and the x86_64 `shl` assembly instruction.

**Requirements:**
1. Use `std::arch::asm!`.
1. Specify `inout(reg) val => result`.
1. Pass `options(nomem, nostack, pure)`.
1. Write unit tests verifying multiplication by 2.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[cfg(target_arch = "x86_64")]
> pub fn fast_shl_one(val: u64) -> u64 {
>     let mut result: u64;
>     unsafe {
>         std::arch::asm!(
>             "shl {0}, 1",
>             inout(reg) val => result,
>             options(nomem, nostack, pure)
>         );
>     }
>     result
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     #[cfg(target_arch = "x86_64")]
>     fn test_asm_shl() {
>         assert_eq!(fast_shl_one(5), 10);
>         assert_eq!(fast_shl_one(64), 128);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `inout(reg) val => result` assigns `val` to a general-purpose register and stores output in `result`.
> 2. `options(nomem, nostack, pure)` signals to LLVM that the operation has no memory side-effects.

---

### Exercise 2: CPUID Processor Vendor Identification Assembly Wrapper

**Scenario:** Build an x86_64 CPUID assembly query function `query_cpuid_vendor() -> [u32; 3]` capturing `EBX`, `EDX`, and `ECX` registers.

**Requirements:**
1. Call `cpuid` with `EAX = 0`.
1. Capture `EBX`, `EDX`, `ECX`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[cfg(target_arch = "x86_64")]
> pub fn query_cpuid_vendor() -> [u32; 3] {
>     let ebx: u32;
>     let edx: u32;
>     let ecx: u32;
>     unsafe {
>         std::arch::asm!(
>             "cpuid",
>             inout("eax") 0u32 => _,
>             out("ebx") ebx,
>             out("edx") edx,
>             out("ecx") ecx,
>             options(nomem, nostack)
>         );
>     }
>     [ebx, edx, ecx]
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     #[cfg(target_arch = "x86_64")]
>     fn test_cpuid_vendor() {
>         let regs = query_cpuid_vendor();
>         assert_ne!(regs, [0, 0, 0]);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Direct register constraints `inout("eax")` and `out("ebx")` map variables to physical CPU hardware registers.

---

### Exercise 3: Hardware NOP Delay Loop Assembly Generator

**Scenario:** Implement a non-allocating hardware NOP delay loop using inline assembly.

**Requirements:**
1. Execute `nop` in a loop.
1. Use `inout(reg)`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[cfg(target_arch = "x86_64")]
> pub fn nop_spin_delay(count: usize) {
>     let mut i = count;
>     unsafe {
>         std::arch::asm!(
>             "1:",
>             "dec {0}",
>             "jnz 1b",
>             inout(reg) i,
>             options(nomem, nostack)
>         );
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     #[cfg(target_arch = "x86_64")]
>     fn test_nop_delay() {
>         nop_spin_delay(10);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Implements raw assembly jump loops using local labels (`1:`, `1b`).

---

## 5. Related Terms

- [`unsafe` Block](unsafe_block.md) — Unsafe blocks.

---

## 7. Key Takeaways

- `asm!` macro enables inserting raw machine instructions inside `unsafe` blocks.
- Requires target architecture `#[cfg(target_arch = "...")]` protection.
- Must accurately declare all modified registers (`out`, `inout`).
- Use `options(nomem, nostack, pure)` to allow compiler optimization passes.
