# `#![no_main]`

> **Level 17 — Embedded & Systems Programming**
> A crate-level attribute (`#![no_main]`) that disables the standard Rust runtime entry point (`fn main()`), allowing bare-metal applications, operating system kernels, bootloaders, and microcontroller firmware to define their own custom entry points (such as `_start` or `#[entry]`).

---

## 1. Prerequisites


- [Linker Script](linker_script.md) — Controls hardware memory layout and entry point addresses.

---

## 2. Term Category



**Rust Binary Entrypoint (custom runtime startup entrypoint)**: `#![no_main]` tells the Rust compiler not to generate the standard C runtime startup code (`crt0`) and default `main()` wrapper.



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

When a standard Rust program starts up on Linux, Windows, or macOS:
1. The OS kernel loads the binary and jumps to a C runtime initialization symbol called `_start` (provided by `crt0.o`).
2. `crt0` sets up command-line arguments (`argc`, `argv`), environment variables, thread stack guards, and calls Rust's runtime `main()`.

On a bare-metal microcontroller chip:
- There is NO operating system to load `crt0.o`.
- There are NO command-line arguments (`argc`/`argv`).
- RAM must be initialized by copying `.data` sections from Flash ROM to RAM before any user code executes!

`#![no_main]` disables the default `main` expectations, allowing embedded frameworks (like `cortex-m-rt`) to define custom reset handlers (`#[entry]`) that initialize hardware registers directly upon power-on.

### (2) Code Examples

#### Embedded Microcontroller Entry Point with `#![no_main]`

```rust
#![no_std]
#![no_main]

use core::panic::PanicInfo;

#[panic_handler]
fn panic(_info: &PanicInfo) -> ! {
    loop {}
}

/// Custom low-level entry point function exported as `_start`
#[no_mangle]
pub extern "C" fn _start() -> ! {
    // Hardware initialization
    let mut gpio_led = 1u8;

    loop {
        // Toggle LED pin
        gpio_led ^= 1;
    }
}
```

---

## 4. Common Mistakes & Pitfalls
### Mistake 2: Returning from `_start` Entrypoint Functions

**The mistake:** Allowing a `#![no_main]` entrypoint function to return.

**Why it's wrong:** On bare-metal hardware, returning from `_start` executes random memory instructions, triggering CPU hard faults.

*Fix:* Ensure `_start` ends in an infinite loop (`loop {}`) or system shutdown call.

### Mistake 3: Forgetting `#[no_mangle]` or `pub extern "C"` on Reset Handlers

**The mistake:** Defining `_start` without `#[no_mangle]` or incorrect C calling convention.

**Why it's wrong:** The linker cannot locate the entrypoint symbol if the compiler mangles the function name.

*Fix:* Annotate entrypoint functions with `#[no_mangle] pub extern "C" fn _start() -> !`.


### Mistake 1: Returning from a `#![no_main]` Entry Point

**The mistake:** Writing a `#![no_main]` entry function that returns (`fn _start()`).

**Why it's wrong:** On bare metal, there is no OS to return to! Returning causes undefined behavior or CPU crash loops. Entry point functions must return the diverge type `!`.

---

## 5. Practice Exercises

### Exercise 1: Bare-Metal RAM Initialization and Hardware Vector Table in `#![no_main]`

**Scenario:** In bare-metal microcontrollers (such as ARM Cortex-M or RISC-V), there is no C runtime startup (`crt0`) or operating system to initialize global variables before execution starts. When power is applied, the hardware reads the entry vector table directly from Flash ROM and jumps straight to the reset handler function defined in a `#![no_main]` crate.
Before executing application logic, the reset handler must perform early startup tasks:
1. Copy the `.data` section (initialized global/static variables) from Flash ROM into SRAM.
2. Clear the `.bss` section (zero-initialized global/static variables) in SRAM.

Construct a `#![no_std]` and `#![no_main]` embedded initialization module. Define a C-compatible ARM Cortex-M `VectorTable` structure placed in the `.vector_table` linker section. Implement `copy_data_section` and `zero_bss_section` helpers operating safely on pointer boundaries, and write unit tests with assertions (`assert_eq!`, `assert!`) verifying that memory initialization correctly relocates global values and zeros uninitialized memory sections.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #![cfg_attr(not(test), no_std)]
> #![cfg_attr(not(test), no_main)]
> 
> use core::panic::PanicInfo;
> 
> #[cfg(not(test))]
> #[panic_handler]
> fn panic(_info: &PanicInfo) -> ! {
>     loop {}
> }
> 
> /// Function pointer type for hardware vector table handlers
> pub type VectorHandler = unsafe extern "C" fn() -> !;
> 
> /// Representation of ARM Cortex-M Vector Table layout
> #[repr(C)]
> pub struct VectorTable {
>     pub initial_stack_pointer: *const u32,
>     pub reset_handler: VectorHandler,
> }
> 
> /// Relocates initialized data from Flash ROM to SRAM.
> ///
> /// # Safety
> /// `src` must point to valid Flash ROM, `dst` must point to writable SRAM,
> /// and `count` must not exceed allocated buffer boundaries.
> pub unsafe fn copy_data_section(src: *const u8, dst: *mut u8, count: usize) {
>     for i in 0..count {
>         *dst.add(i) = *src.add(i);
>     }
> }
> 
> /// Fills uninitialized BSS section in SRAM with zeros.
> ///
> /// # Safety
> /// `dst` must point to valid writable SRAM and `count` must be accurate.
> pub unsafe fn zero_bss_section(dst: *mut u8, count: usize) {
>     for i in 0..count {
>         *dst.add(i) = 0;
>     }
> }
> 
> /// Custom bare-metal entry point called on CPU hardware reset
> #[no_mangle]
> pub unsafe extern "C" fn reset_handler() -> ! {
>     // Symbol addresses provided by the linker script (memory.x)
>     extern "C" {
>         static _sidata: u8; // Start of data in Flash
>         static mut _sdata: u8; // Start of data in RAM
>         static mut _edata: u8; // End of data in RAM
>         static mut _sbss: u8;  // Start of BSS in RAM
>         static mut _ebss: u8;  // End of BSS in RAM
>     }
> 
>     let data_bytes = (&_edata as *const u8 as usize) - (&_sdata as *const u8 as usize);
>     let bss_bytes = (&_ebss as *const u8 as usize) - (&_sbss as *const u8 as usize);
> 
>     copy_data_section(&_sidata, &mut _sdata, data_bytes);
>     zero_bss_section(&mut _sbss, bss_bytes);
> 
>     // Enter main application loop
>     loop {}
> }
> 
> /// Place vector table in `.vector_table` linker section
> #[cfg(not(test))]
> #[no_mangle]
> #[link_section = ".vector_table"]
> pub static VECTORS: VectorTable = VectorTable {
>     initial_stack_pointer: 0x2002_0000 as *const u32,
>     reset_handler,
> };
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_copy_data_section() {
>         let flash_rom: [u8; 4] = [0xAA, 0xBB, 0xCC, 0xDD];
>         let mut sram: [u8; 4] = [0; 4];
> 
>         unsafe {
>             copy_data_section(flash_rom.as_ptr(), sram.as_mut_ptr(), flash_rom.len());
>         }
> 
>         assert_eq!(sram, [0xAA, 0xBB, 0xCC, 0xDD]);
>     }
> 
>     #[test]
>     fn test_zero_bss_section() {
>         let mut sram_dirty: [u8; 5] = [0xFF, 0xDE, 0xAD, 0xBE, 0xEF];
> 
>         unsafe {
>             zero_bss_section(sram_dirty.as_mut_ptr(), sram_dirty.len());
>         }
> 
>         assert_eq!(sram_dirty, [0, 0, 0, 0, 0]);
>     }
> 
>     #[test]
>     fn test_vector_table_layout_size() {
>         assert_eq!(
>             core::mem::size_of::<VectorTable>(),
>             core::mem::size_of::<usize>() * 2
>         );
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Crate Attributes (`#![no_std]` and `#![no_main]`)**: `#![no_main]` disables standard runtime entry point generation (`fn main()`), delegating initial CPU execution directly to `reset_handler`. Using `cfg_attr(not(test), ...)` allows the module to be compiled and unit tested under host `cargo test` harnesses while remaining zero-dependency bare-metal code for target microcontrollers.
> 2. **Hardware Startup Memory Setup**: On microcontrollers, persistent Flash memory stores global read-only data and static initializers, but RAM starts in an uninitialized garbage state. `copy_data_section` moves initialized static variables into SRAM, while `zero_bss_section` clears uninitialized zero-allocated memory before application logic runs.
> 3. **Hardware Vector Table (`#[repr(C)]` & `#[link_section]`)**: The `VectorTable` structure uses `#[repr(C)]` to guarantee sequential layout in memory matching CPU hardware specifications. The `#[link_section = ".vector_table"]` attribute directs the linker script to place `VECTORS` at memory address `0x0000_0000` in Flash ROM.
> 4. **Unit Verification**: The test suite validates that `copy_data_section` accurately mirrors source byte patterns into destination RAM, `zero_bss_section` wipes dirty memory blocks to zero, and `VectorTable` preserves target pointer size alignment.
> 
---

### Exercise 2: Embedded Watchdog Feed & Diverging Application Loop in `#![no_main]`

**Scenario:** Standard Rust `fn main()` entry functions return an integer exit code to the host operating system upon completion. In a bare-metal `#![no_main]` binary, there is no host operating system to receive a return value. As a result, entry point functions must be marked as *diverging* (`fn _start() -> !`), meaning they never return.
In hardware firmware (e.g. IoT edge sensors or industrial controllers), entry points enter an infinite loop. To prevent system freezes caused by software deadlocks, the hardware incorporates a Hardware Watchdog Timer (WDT). The main loop must process application events and periodically reset ("feed") the watchdog timer within a mandatory tick threshold. If the loop stalls, the watchdog counter expires and triggers an automatic hardware CPU reset.

Design a `#![no_std]` `#![no_main]` software watchdog subsystem. Implement a `WatchdogTimer` struct with `feed()`, `tick()`, and `is_expired()` methods, alongside a `SystemLoop` struct that runs task processing. Write a `#![no_main]` diverging entry point `_start()` that executes the watchdog main loop, and include comprehensive unit tests with assertions (`assert_eq!`, `assert!`) verifying watchdog decay, timer feeding, freeze detection, and diverging loop behavior.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #![cfg_attr(not(test), no_std)]
> #![cfg_attr(not(test), no_main)]
> 
> use core::panic::PanicInfo;
> 
> #[cfg(not(test))]
> #[panic_handler]
> fn panic(_info: &PanicInfo) -> ! {
>     loop {}
> }
> 
> /// Embedded Hardware Watchdog Timer Simulator
> pub struct WatchdogTimer {
>     max_ticks: u32,
>     current_ticks: u32,
> }
> 
> impl WatchdogTimer {
>     pub fn new(max_ticks: u32) -> Self {
>         Self {
>             max_ticks,
>             current_ticks: max_ticks,
>         }
>     }
> 
>     /// Feed the watchdog timer to reload its counter
>     pub fn feed(&mut self) {
>         self.current_ticks = self.max_ticks;
>     }
> 
>     /// Advance system tick counter by one unit
>     pub fn tick(&mut self) -> bool {
>         if self.current_ticks > 0 {
>             self.current_ticks -= 1;
>             true
>         } else {
>             false // Timer expired -> Trigger Hardware Reset!
>         }
>     }
> 
>     pub fn remaining_ticks(&self) -> u32 {
>         self.current_ticks
>     }
> 
>     pub fn is_expired(&self) -> bool {
>         self.current_ticks == 0
>     }
> }
> 
> /// Embedded Application System Task Loop
> pub struct SystemLoop {
>     pub watchdog: WatchdogTimer,
>     pub processed_tasks: u32,
> }
> 
> impl SystemLoop {
>     pub fn new(watchdog_ticks: u32) -> Self {
>         Self {
>             watchdog: WatchdogTimer::new(watchdog_ticks),
>             processed_tasks: 0,
>         }
>     }
> 
>     /// Execute a single work step and feed the watchdog
>     pub fn step(&mut self) -> Result<(), &'static str> {
>         if !self.watchdog.tick() {
>             return Err("Hardware Watchdog Expired: System Reset Required");
>         }
> 
>         // Perform application workload (e.g. read sensors, update outputs)
>         self.processed_tasks = self.processed_tasks.wrapping_add(1);
> 
>         // Feed watchdog to signal normal execution
>         self.watchdog.feed();
>         Ok(())
>     }
> }
> 
> /// Bare-metal diverging entry point (never returns)
> #[no_mangle]
> pub extern "C" fn _start() -> ! {
>     let mut sys = SystemLoop::new(100);
> 
>     loop {
>         if sys.step().is_err() {
>             // On watchdog timeout, trigger hardware reset sequence
>             unsafe {
>                 core::ptr::write_volatile(0x4000_0000 as *mut u32, 1);
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
>     fn test_watchdog_feed_and_decay() {
>         let mut wdt = WatchdogTimer::new(5);
>         assert_eq!(wdt.remaining_ticks(), 5);
> 
>         assert!(wdt.tick());
>         assert!(wdt.tick());
>         assert_eq!(wdt.remaining_ticks(), 3);
> 
>         wdt.feed();
>         assert_eq!(wdt.remaining_ticks(), 5);
>     }
> 
>     #[test]
>     fn test_watchdog_expiration() {
>         let mut wdt = WatchdogTimer::new(2);
>         assert!(wdt.tick());
>         assert!(wdt.tick());
>         assert!(!wdt.tick()); // Expired
>         assert!(wdt.is_expired());
>     }
> 
>     #[test]
>     fn test_system_loop_step() {
>         let mut sys = SystemLoop::new(10);
>         assert_eq!(sys.processed_tasks, 0);
> 
>         assert!(sys.step().is_ok());
>         assert_eq!(sys.processed_tasks, 1);
>         assert_eq!(sys.watchdog.remaining_ticks(), 10);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Diverging Function Signature (`-> !`)**: In `#![no_main]` binaries, the entry function signature must specify the diverging return type `!` because there is no underlying operating system runtime to return control to. The CPU must stay active inside an explicit `loop {}`.
> 2. **Hardware Watchdog Pattern**: Mission-critical firmware uses watchdog timers to recover from unhandled runtime faults or infinite spinlocks. Calling `watchdog.feed()` inside `sys.step()` continuously reloads the hardware counter during normal operation.
> 3. **Volatile Peripheral Control**: When a watchdog failure or system error occurs, bare-metal hardware resets are triggered by writing control flags to memory-mapped registers via `core::ptr::write_volatile`.
> 4. **Unit Verification**: Unit tests verify that tick decrements remaining capacity, `feed()` restores maximum timeout allowances, step operations safely increment task counters, and exhausted timers trigger failure return states.
> 
---

### Exercise 3: Bootloader Stage-2 Handshake and Boot Information Validation in `#![no_main]`

**Scenario:** In custom operating system development and embedded bootloader architecture, Stage 1 bootloader (which runs immediately after power-on) loads the Stage 2 kernel image into memory and jumps to its entry point.
The Stage 1 bootloader passes system configuration parameters (such as RAM boundaries, device tree address, and hardware info) to the `#![no_main]` entry point via a memory pointer to a `BootInformation` structure. If corrupted data or an incompatible bootloader version calls the kernel entry point, execution must halt immediately to prevent physical hardware damage or severe memory corruption.

Implement a C-ABI compliant `BootInformation` header structure with magic header validation (`0x52555354` — ASCII `"RUST"`), memory size validation, and 32-bit XOR checksum calculation. Write a `#![no_main]` kernel entry function `_start_kernel(boot_info_ptr: *const BootInformation) -> !` that validates the boot header before starting kernel subsystems, and provide comprehensive unit tests with assertions (`assert_eq!`, `assert!`) covering valid handshakes, magic code mismatches, and corrupted checksum detection.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #![cfg_attr(not(test), no_std)]
> #![cfg_attr(not(test), no_main)]
> 
> use core::panic::PanicInfo;
> 
> #[cfg(not(test))]
> #[panic_handler]
> fn panic(_info: &PanicInfo) -> ! {
>     loop {}
> }
> 
> /// Expected magic number passed by Stage-1 Bootloader ("RUST")
> pub const BOOT_MAGIC: u32 = 0x52555354;
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum BootError {
>     NullPointer,
>     InvalidMagic(u32),
>     ChecksumMismatch { expected: u32, calculated: u32 },
>     InsufficientMemory(u32),
> }
> 
> /// C-Compatible Boot Information Structure passed from Bootloader
> #[repr(C)]
> pub struct BootInformation {
>     pub magic: u32,
>     pub ram_size_kb: u32,
>     pub framebuffer_ptr: u64,
>     pub checksum: u32,
> }
> 
> impl BootInformation {
>     pub fn new(ram_size_kb: u32, framebuffer_ptr: u64) -> Self {
>         let mut info = Self {
>             magic: BOOT_MAGIC,
>             ram_size_kb,
>             framebuffer_ptr,
>             checksum: 0,
>         };
>         info.checksum = info.calculate_checksum();
>         info
>     }
> 
>     /// Computes XOR checksum over all fields except the checksum field itself
>     pub fn calculate_checksum(&self) -> u32 {
>         self.magic
>             ^ self.ram_size_kb
>             ^ (self.framebuffer_ptr as u32)
>             ^ ((self.framebuffer_ptr >> 32) as u32)
>     }
> 
>     /// Validates structural integrity and compatibility of boot header
>     pub fn validate(&self) -> Result<(), BootError> {
>         if self.magic != BOOT_MAGIC {
>             return Err(BootError::InvalidMagic(self.magic));
>         }
> 
>         let calculated = self.calculate_checksum();
>         if self.checksum != calculated {
>             return Err(BootError::ChecksumMismatch {
>                 expected: self.checksum,
>                 calculated,
>             });
>         }
> 
>         if self.ram_size_kb < 1024 {
>             return Err(BootError::InsufficientMemory(self.ram_size_kb));
>         }
> 
>         Ok(())
>     }
> }
> 
> /// Bare-metal kernel entry point accepting raw boot information pointer
> #[no_mangle]
> pub unsafe extern "C" fn _start_kernel(boot_info_ptr: *const BootInformation) -> ! {
>     if boot_info_ptr.is_null() {
>         panic!("Boot error: Received NULL boot information pointer");
>     }
> 
>     let boot_info = &*boot_info_ptr;
>     match boot_info.validate() {
>         Ok(()) => {
>             // Kernel initialization success! Proceed to main OS loop.
>             loop {}
>         }
>         Err(_err) => {
>             // Invalid boot structure detected; lock down hardware
>             loop {}
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_valid_boot_information() {
>         let boot_info = BootInformation::new(4096, 0xA000_0000);
>         assert_eq!(boot_info.validate(), Ok(()));
>     }
> 
>     #[test]
>     fn test_invalid_magic_number() {
>         let mut boot_info = BootInformation::new(4096, 0xA000_0000);
>         boot_info.magic = 0xDEADBEEF;
>         assert_eq!(
>             boot_info.validate(),
>             Err(BootError::InvalidMagic(0xDEADBEEF))
>         );
>     }
> 
>     #[test]
>     fn test_corrupted_checksum() {
>         let mut boot_info = BootInformation::new(4096, 0xA000_0000);
>         let correct_checksum = boot_info.checksum;
>         boot_info.checksum ^= 0xFFFFFFFF; // Corrupt bits
> 
>         assert_eq!(
>             boot_info.validate(),
>             Err(BootError::ChecksumMismatch {
>                 expected: boot_info.checksum,
>                 calculated: correct_checksum,
>             })
>         );
>     }
> 
>     #[test]
>     fn test_insufficient_ram() {
>         let boot_info = BootInformation::new(512, 0xA000_0000);
>         assert_eq!(boot_info.validate(), Err(BootError::InsufficientMemory(512)));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **C Calling Convention and FFI Entry**: In `#![no_main]` binaries that boot from legacy C stage-1 bootloaders, the entry point function must be annotated with `#[no_mangle] pub unsafe extern "C" fn`. This prevents symbol name mangling and guarantees argument passing via CPU hardware registers according to the C ABI.
> 2. **`#[repr(C)]` Memory Layout**: The `BootInformation` struct uses `#[repr(C)]` so that field offsets match memory packed by external assembly or C bootloaders without Rust struct layout reordering.
> 3. **Defensive Firmware Validation**: Bare-metal kernels must validate boot parameters passed via raw pointers prior to initializing subsystems. Magic headers (`BOOT_MAGIC`) and XOR checksums prevent corrupted bootloader data from causing silent memory corruption.
> 4. **Unit Verification**: The unit tests verify that valid boot parameter payloads pass header verification, modified magic codes return `InvalidMagic`, flipped checksum bits trigger `ChecksumMismatch`, and under-sized RAM parameters report `InsufficientMemory`.
> 
---


## 6. Related Terms

- None!

---

## 7. Key Takeaways

- `#![no_main]` disables standard runtime `main()` entry expectations.
- Essential for bare-metal firmware, OS kernels, and bootloaders.
- Entry functions must return `!` and be marked `#[no_mangle] pub extern "C" fn`.
