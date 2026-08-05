# Linker Script

> **Level 17 — Embedded & Systems Programming**
> A configuration file (typically `memory.x` or `link.ld`) passed to the linker (`rust-lld`) that defines the exact physical memory map (Flash ROM, SRAM) of a microcontroller or target hardware architecture, specifying where binary code (`.text`), read-only data (`.rodata`), and initialized variables (`.data`) reside.

---

## 1. Prerequisites


- [Cross-Compilation](cross_compilation.md) — Target compilation using custom linker scripts.

---

## 2. Term Category

**Systems / Embedded / Tooling**: A Linker Script is a plain text file written in linker command language. While desktop operating systems place binaries into arbitrary virtual memory spaces, bare-metal microcontrollers have rigid physical memory addresses (e.g. Flash memory starting at `0x0800_0000` and RAM starting at `0x2000_0000`). The linker script tells `rust-lld` exactly how to arrange compiled binary sections across physical memory banks.

---

## 3. Environment Context

**Bare-Metal & Firmware**: Required for microcontrollers (ARM Cortex-M, RISC-V, ESP32) and OS kernel development.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"

On a microcontroller:
- Executable instructions MUST be written to Flash ROM (`0x08000000`).
- Mutable variables MUST be allocated in SRAM (`0x20000000`).
- Vector interrupt tables MUST sit at the very beginning of Flash memory.

Without a linker script, the linker would put code at default desktop virtual memory addresses, and the microcontroller hardware would fail to boot.

### (2) Code Examples

#### Typical Microcontroller `memory.x` Linker Script

```text
/* memory.x - Linker script for ARM Cortex-M4 Microcontroller */

MEMORY
{
  /* 512 KB Flash ROM starting at address 0x08000000 */
  FLASH : ORIGIN = 0x08000000, LENGTH = 512K

  /* 128 KB SRAM starting at address 0x20000000 */
  RAM   : ORIGIN = 0x20000000, LENGTH = 128K
}

/* Specify entry point symbol */
ENTRY(Reset_Handler);
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Memory Overflow Errors during Linking

**The mistake:** Compiling a large embedded binary that exceeds the `LENGTH` declared in the linker script.

**Why it's wrong:** The linker validates section sizes against `memory.x`. If code exceeds Flash size, linking fails with `region 'FLASH' overflowed`.

---

## 6. Practice Exercises

### Exercise 1: Bare-Metal `.data` and `.bss` RAM Initialization Routine

**Problem:**
On a bare-metal microcontroller (e.g., ARM Cortex-M or RISC-V), non-volatile Flash ROM retains executable instructions (`.text`) and read-only data (`.rodata`), but initialized global variables (`.data`) and uninitialized zero-allocated variables (`.bss`) must reside in volatile SRAM. Upon power-on, SRAM contains random garbage values.
Write a `#![no_std]` Rust initialization function `rtt_init_ram()` that uses linker script exported symbols (`_sidata`, `_sdata`, `_edata`, `_sbss`, `_ebss`) to:
1. Copy initial `.data` section values from Flash ROM (`_sidata`) into SRAM (`_sdata` through `_edata`).
2. Zero out the `.bss` section in SRAM (`_sbss` through `_ebss`).
3. Include unit tests that simulate Flash and RAM memory regions using arrays to verify that data is correctly copied and zeroed out with assertions.

> [!check]- Answer
> ```rust
> #![no_std]
> 
> use core::ptr::{copy_nonoverlapping, write_bytes};
> 
> // Linker script symbols (addresses exported by the linker script)
> extern "C" {
>     /// Start of .data section in Flash ROM (Load Memory Address - LMA)
>     static _sidata: u8;
>     /// Start of .data section in RAM (Virtual Memory Address - VMA)
>     static _sdata: u8;
>     /// End of .data section in RAM
>     static _edata: u8;
>     /// Start of .bss section in RAM
>     static _sbss: u8;
>     /// End of .bss section in RAM
>     static _ebss: u8;
> }
> 
> /// Core RAM initialization routine called early in the Reset Handler
> /// # Safety
> /// Must be called once at boot before any static mutable variables are accessed.
> pub unsafe fn rtt_init_ram() {
>     let sidata = &_sidata as *const u8;
>     let sdata = &_sdata as *mut u8;
>     let edata = &_edata as *mut u8;
>     let sbss = &_sbss as *mut u8;
>     let ebss = &_ebss as *mut u8;
> 
>     // 1. Copy initialized static data from Flash ROM to RAM
>     let data_bytes = edata as usize - sdata as usize;
>     if data_bytes > 0 {
>         copy_nonoverlapping(sidata, sdata, data_bytes);
>     }
> 
>     // 2. Zero out the uninitialized static data (.bss) section in RAM
>     let bss_bytes = ebss as usize - sbss as usize;
>     if bss_bytes > 0 {
>         write_bytes(sbss, 0, bss_bytes);
>     }
> }
> 
> /// Helper function to perform data copy and bss zeroing on arbitrary raw memory slices
> /// (Used for unit testing without depending on actual physical linker symbols)
> pub unsafe fn init_ram_regions(
>     flash_src: *const u8,
>     ram_data_dst: *mut u8,
>     data_len: usize,
>     ram_bss_dst: *mut u8,
>     bss_len: usize,
> ) {
>     if data_len > 0 {
>         copy_nonoverlapping(flash_src, ram_data_dst, data_len);
>     }
>     if bss_len > 0 {
>         write_bytes(ram_bss_dst, 0, bss_len);
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_ram_initialization_routine() {
>         // Mock Flash memory storing initial static variable values [0xAA, 0xBB, 0xCC, 0xDD]
>         let flash_rom: [u8; 4] = [0xAA, 0xBB, 0xCC, 0xDD];
> 
>         // Mock RAM .data section initially filled with random garbage
>         let mut ram_data: [u8; 4] = [0xFF, 0xFF, 0xFF, 0xFF];
> 
>         // Mock RAM .bss section initially filled with uninitialized non-zero values
>         let mut ram_bss: [u8; 6] = [0xDE, 0xAD, 0xBE, 0xEF, 0x12, 0x34];
> 
>         unsafe {
>             init_ram_regions(
>                 flash_rom.as_ptr(),
>                 ram_data.as_mut_ptr(),
>                 flash_rom.len(),
>                 ram_bss.as_mut_ptr(),
>                 ram_bss.len(),
>             );
>         }
> 
>         // Verify .data section was successfully copied from Flash ROM to RAM
>         assert_eq!(ram_data, [0xAA, 0xBB, 0xCC, 0xDD]);
> 
>         // Verify .bss section was completely zeroed out
>         assert_eq!(ram_bss, [0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
>     }
> }
> ```
>
> **Explanation:**
> 1. **Linker Script Symbol Syntax**: In Rust, `extern "C" { static _sdata: u8; }` declares a symbol whose **address** (not value) is provided by the linker script (`link.ld` / `memory.x`).
> 2. **Address vs Value**: Accessing `&_sdata as *const u8 as usize` yields the memory location where `.data` begins in RAM. Dereferencing `_sdata` directly would read the byte stored at that address, which is a classic bug when calculating section boundaries.
> 3. **`copy_nonoverlapping` & `write_bytes`**: Core intrinsic functions `core::ptr::copy_nonoverlapping` (equivalent to C `memcpy`) and `core::ptr::write_bytes` (equivalent to C `memset`) provide high-speed memory block operations required during microsecond boot sequences.

---

### Exercise 2: Custom Linker Sections for DMA Buffers and Flash Configuration Header

**Problem:**
Certain hardware peripherals (such as Ethernet controllers or SPI DMA) require memory buffers placed in dedicated uncacheable RAM regions aligned to 64-byte boundaries. Additionally, target hardware metadata and version flags must be pinned to a fixed location in Flash ROM (`.config_flash`) so external bootloaders can read them without parsing complex ELF symbol tables.
1. Write a linker script section rule snippet defining `.dma_buffer` in `RAM_DMA` and `.config_flash` in `FLASH_CFG`.
2. Write Rust structs using `#[link_section = "..."]` and `#[repr(C, align(64))]` to place static buffers into these sections.
3. Write unit tests with assertions verifying struct sizes, field offsets, and alignment constraints.

> [!check]- Answer
> ```rust
> #![no_std]
> 
> /// Header structure placed into dedicated Flash configuration section
> #[repr(C)]
> pub struct FirmwareConfig {
>     pub magic: [u8; 4],     // "FWCF"
>     pub version: u32,       // Firmware version e.g. 0x01020000 (v1.2.0)
>     pub hw_revision: u16,   // Hardware Revision ID
>     pub checksum: u16,      // Header CRC16 checksum
> }
> 
> /// 64-byte aligned DMA buffer struct for peripheral hardware descriptors
> #[repr(C, align(64))]
> pub struct DmaBufferRing {
>     pub rx_buffer: [u8; 512],
>     pub tx_buffer: [u8; 512],
>     pub head: u16,
>     pub tail: u16,
> }
> 
> // Custom Section Attributes in Rust
> #[no_mangle]
> #[link_section = ".config_flash"]
> pub static FW_CONFIG: FirmwareConfig = FirmwareConfig {
>     magic: *b"FWCF",
>     version: 0x01020000,
>     hw_revision: 0x000A,
>     checksum: 0xABCD,
> };
> 
> #[no_mangle]
> #[link_section = ".dma_buffer"]
> pub static mut DMA_RING: DmaBufferRing = DmaBufferRing {
>     rx_buffer: [0; 512],
>     tx_buffer: [0; 512],
>     head: 0,
>     tail: 0,
> };
> 
> /* Corresponding Linker Script Snippet (memory.x / link.ld):
> MEMORY
> {
>   FLASH_CFG (r)  : ORIGIN = 0x0807F000, LENGTH = 4K
>   RAM_DMA   (rwx): ORIGIN = 0x2001C000, LENGTH = 16K
> }
> 
> SECTIONS
> {
>   .config_flash : ALIGN(4)
>   {
>     KEEP(*(.config_flash))
>   } > FLASH_CFG
> 
>   .dma_buffer : ALIGN(64)
>   {
>     *(.dma_buffer)
>   } > RAM_DMA
> }
> */
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
>     use core::mem::{align_of, offset_of, size_of};
> 
>     #[test]
>     fn test_dma_buffer_alignment_and_layout() {
>         // Verify DMA struct size and alignment matching hardware engine requirements
>         assert_eq!(align_of::<DmaBufferRing>(), 64);
>         assert_eq!(size_of::<DmaBufferRing>(), 1088); // 512 + 512 + 2 + 2 = 1028 padded to 1088 for 64-byte alignment
> 
>         // Verify field offsets inside the struct
>         assert_eq!(offset_of!(DmaBufferRing, rx_buffer), 0);
>         assert_eq!(offset_of!(DmaBufferRing, tx_buffer), 512);
>         assert_eq!(offset_of!(DmaBufferRing, head), 1024);
>         assert_eq!(offset_of!(DmaBufferRing, tail), 1026);
>     }
> 
>     #[test]
>     fn test_firmware_config_header() {
>         assert_eq!(size_of::<FirmwareConfig>(), 12);
>         assert_eq!(&FW_CONFIG.magic, b"FWCF");
>         assert_eq!(FW_CONFIG.version, 0x01020000);
>     }
> }
> ```
>
> **Explanation:**
> 1. **`#[link_section = "..."]`**: Directs `rustc` and `LLVM` to place static symbols under custom ELF section names. The linker script matches these names (`*(.dma_buffer)`) and routes them to specific physical memory regions like `RAM_DMA`.
> 2. **`KEEP(*(.config_flash))`**: In linker scripts, `KEEP()` prevents `rust-lld` link-time garbage collection (`--gc-sections`) from stripping static structs that are not explicitly called by application functions.
> 3. **`#[repr(C, align(64))]`**: Ensures memory alignment complies with hardware DMA controller requirements, eliminating cache invalidation errors on high-performance microcontrollers.

---

### Exercise 3: Stack Guard and Memory Boundary Overflow Inspector

**Problem:**
On microcontrollers without a Hardware Memory Protection Unit (MPU), stack memory grows downward from the top of RAM toward the end of `.bss`. If nested function calls or deep recursion push the Stack Pointer (`SP`) beyond the stack region, it overwrites static variables, leading to silent memory corruption and hard faults.
Using linker script symbols `_stack_start` (top of stack) and `_stack_end` (bottom limit of stack region), implement a Rust stack safety utility that computes remaining stack headroom and detects stack overflow conditions. Provide unit tests with assertions proving correctness.

> [!check]- Answer
> ```rust
> #![no_std]
> 
> extern "C" {
>     /// High memory address where Stack Pointer initially starts (e.g. 0x2002_0000)
>     static _stack_start: u8;
>     /// Lower memory address limit for stack growth (e.g. 0x2001_F000)
>     static _stack_end: u8;
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum StackStatus {
>     Safe { headroom_bytes: usize },
>     Overflow { overflow_by_bytes: usize },
> }
> 
> pub struct StackGuard {
>     start_addr: usize,
>     end_addr: usize,
> }
> 
> impl StackGuard {
>     /// Creates a StackGuard instance from explicit bounds or linker symbols
>     pub fn new(start_addr: usize, end_addr: usize) -> Self {
>         Self { start_addr, end_addr }
>     }
> 
>     /// Reads physical linker symbols to create a StackGuard for bare-metal runtime
>     pub fn from_linker() -> Self {
>         let start = unsafe { &_stack_start as *const u8 as usize };
>         let end = unsafe { &_stack_end as *const u8 as usize };
>         Self::new(start, end)
>     }
> 
>     /// Calculates total allocated stack capacity in bytes
>     pub fn total_capacity(&self) -> usize {
>         self.start_addr.saturating_sub(self.end_addr)
>     }
> 
>     /// Inspects a given current stack pointer value (SP) against stack boundaries
>     pub fn inspect(&self, current_sp: usize) -> StackStatus {
>         if current_sp >= self.end_addr && current_sp <= self.start_addr {
>             StackStatus::Safe {
>                 headroom_bytes: current_sp - self.end_addr,
>             }
>         } else if current_sp < self.end_addr {
>             StackStatus::Overflow {
>                 overflow_by_bytes: self.end_addr - current_sp,
>             }
>         } else {
>             StackStatus::Overflow {
>                 overflow_by_bytes: current_sp - self.start_addr,
>             }
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_stack_capacity_and_headroom() {
>         // Mock Stack: 0x2002_0000 down to 0x2001_8000 (32 KB stack)
>         let stack_start = 0x2002_0000;
>         let stack_end = 0x2001_8000;
>         let guard = StackGuard::new(stack_start, stack_end);
> 
>         assert_eq!(guard.total_capacity(), 32 * 1024);
> 
>         // Test SP at midpoint (0x2001_C000 -> 16 KB consumed, 16 KB headroom left)
>         let current_sp = 0x2001_C000;
>         let status = guard.inspect(current_sp);
> 
>         assert_eq!(
>             status,
>             StackStatus::Safe {
>                 headroom_bytes: 16 * 1024
>             }
>         );
>     }
> 
>     #[test]
>     fn test_stack_overflow_detection() {
>         let stack_start = 0x2002_0000;
>         let stack_end = 0x2001_8000; // 32 KB limit
>         let guard = StackGuard::new(stack_start, stack_end);
> 
>         // Test SP pushed 256 bytes beyond lower stack boundary
>         let overflow_sp = 0x2001_7F00;
>         let status = guard.inspect(overflow_sp);
> 
>         assert_eq!(
>             status,
>             StackStatus::Overflow {
>                 overflow_by_bytes: 256
>             }
>         );
>     }
> }
> ```
>
> **Explanation:**
> 1. **Stack Growth Direction**: On ARM Cortex-M and x86 architectures, stack memory grows downward from high addresses (`_stack_start`) to lower addresses (`_stack_end`).
> 2. **Headroom Calculation**: Remaining headroom is `current_sp - _stack_end`. If `current_sp < _stack_end`, the stack pointer has overflowed past the allowed region.
> 3. **Decoupled Testing Architecture**: By isolating pointer bounds into `StackGuard::new(start_addr, end_addr)` alongside `StackGuard::from_linker()`, unit tests can run cleanly on host architectures while maintaining exact bare-metal compatibility.

---

---

## 6. Related Terms

**None.**

---

## 7. Key Takeaways

- Linker Scripts (`memory.x`) define physical memory address layouts for bare-metal targets.
- Map Flash ROM and SRAM memory origins and section boundaries.
- Directs `rust-lld` where to place `.text`, `.rodata`, `.data`, and `.bss` sections.
