# `#![no_std]`

> **Level 17 — Embedded & Systems Programming**
> A crate-level attribute (`#![no_std]`) that disables the Rust Standard Library (`std`), allowing Rust code to execute on bare-metal hardware, embedded microcontrollers, operating system kernels, and WebAssembly targets with zero operating system dependencies.

---

## 1. Prerequisites


- [`core` Library](core_library.md) — The fundamental dependency-free library available in `#![no_std]`.
- [`alloc` Library](alloc_library.md) — Optional heap allocation library for `#![no_std]`.
- [Panic Handling (`panic!`)](../level_04/panic_handling.md) — Custom panic handlers required in `#![no_std]`.

---

## 2. Term Category



**Rust Compilation Environment (bare-metal standard library exclusion)**: `#![no_std]` is an attribute placed at the top of a crate root (`lib.rs` or `main.rs`). It tells `rustc` not to automatically link the Rust Standard Library (`std`). This removes dependencies on operating system services (like threads, files, network sockets, or OS process heaps), linking only against `core` (the target-independent, dependency-free subset of Rust).



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Standard programming languages (Java, Python, Go) rely heavily on operating system runtimes:
- They assume an OS kernel is running to manage thread scheduling, file handles, TCP sockets, and virtual memory allocators.
- They cannot run directly on a micro-controller chip inside a medical implant, automotive engine control unit (ECU), or OS bootloader because there is no underlying operating system!

Rust was designed from day one as a true systems language capable of replacing C and C++ in bare-metal environments.

Adding `#![no_std]` strips away all OS assumptions:
- **`std` disabled**: No OS threads, no `std::fs`, no `std::net`, no default `malloc`.
- **`core` remains active**: Option, Result, Iterator, Slices, Bitwise operations, Structs, Enums, and Trait mechanics remain 100% available with ZERO performance penalty!

### (2) Code Examples

#### Bare-Metal `#![no_std]` Binary Entry Point

```rust
#![no_std]  // Disable standard library
#![no_main] // Disable standard C main entrypoint

use core::panic::PanicInfo;

/// Required panic handler in `#![no_std]` environments
#[panic_handler]
fn panic(_info: &PanicInfo) -> ! {
    // Loop infinitely or trigger hardware reset on panic
    loop {}
}

/// Custom bare-metal entry point
#[no_mangle]
pub extern "C" fn _start() -> ! {
    let mut sum = 0u32;
    let numbers = [10, 20, 30];

    // `core` iterators and slice methods work seamlessly!
    for &num in numbers.iter() {
        sum += num;
    }

    loop {
        // Main hardware loop
    }
}
```

---

## 4. Common Mistakes & Pitfalls
### Mistake 2: Importing Dependencies that Secretly Require `std`

**The mistake:** Adding a crate to `Cargo.toml` without disabling default features.

**Why it's wrong:** Many crates enable `std` support by default, triggering compilation failures in `#![no_std]` targets.

*Fix:* Specify `default-features = false` in `Cargo.toml` dependencies.

### Mistake 3: Forgetting `#[panic_handler]` in `#![no_std]` Binaries

**The mistake:** Compiling a `#![no_std]` binary without defining a panic handler function.

**Why it's wrong:** The compiler requires an explicit strategy to handle panics when `std` is disabled.

*Fix:* Add a panic handler crate like `panic_halt` or define `#[panic_handler]`.


### Mistake 1: Trying to use `std::println!` or `std::vec::Vec` without `alloc` in `#![no_std]`

**The mistake:** Using `println!` or `Vec` in a `#![no_std]` crate without importing `core::fmt` or `alloc::vec::Vec`.

**Why it's wrong:** `println!` depends on OS stdout handles in `std`.

*Fix:*
```rust
// Use `core::fmt::Write` or hardware UART for printing in `#![no_std]`
```

---

## 5. Practice Exercises

### Exercise 1: Embedded Fixed-Capacity Ring-Buffer Telemetry Logger

**Scenario:** In bare-metal embedded applications (such as ARM Cortex-M or RISC-V microcontrollers), logging telemetry messages without the standard library (`std`) or dynamic memory allocators (`alloc`) requires custom, fixed-size stack buffers. Implement a `#![no_std]` telemetry logger `RingBufferLogger<const CAP: usize>` that implements `core::fmt::Write`. The logger must:
1. Store bytes in a fixed-size array `[u8; CAP]` using const generics (`const CAP: usize`).
2. Support formatted string writing via the `core::fmt::Write` trait without heap allocation.
3. Automatically wrap around (overwrite oldest data) when log contents exceed capacity, tracking both head write index and total bytes logged.
4. Provide methods `read_bytes(&self)` to copy active log entries into a linear buffer slice and `clear(&mut self)` to reset buffer indices.
5. Include comprehensive unit tests verifying single string formatting, buffer overflow wrap-around behavior, UTF-8 validity checks, and reset operations.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #![no_std]
> 
> use core::fmt::{self, Write};
> 
> /// Fixed-capacity circular telemetry ring buffer logger for #![no_std] environments.
> pub struct RingBufferLogger<const CAP: usize> {
>     buffer: [u8; CAP],
>     write_pos: usize,
>     count: usize,
>     total_written: usize,
> }
> 
> impl<const CAP: usize> RingBufferLogger<CAP> {
>     /// Creates a new empty logger with constant compile-time capacity.
>     pub const fn new() -> Self {
>         RingBufferLogger {
>             buffer: [0u8; CAP],
>             write_pos: 0,
>             count: 0,
>             total_written: 0,
>         }
>     }
> 
>     /// Returns the number of bytes currently stored in the buffer.
>     pub fn len(&self) -> usize {
>         self.count
>     }
> 
>     /// Returns true if the buffer contains no bytes.
>     pub fn is_empty(&self) -> bool {
>         self.count == 0
>     }
> 
>     /// Returns the total cumulative count of bytes written since initialization.
>     pub fn total_written(&self) -> usize {
>         self.total_written
>     }
> 
>     /// Clears the logger state without reallocating memory.
>     pub fn clear(&mut self) {
>         self.write_pos = 0;
>         self.count = 0;
>     }
> 
>     /// Pushes a single byte into the circular buffer.
>     pub fn push_byte(&mut self, byte: u8) {
>         self.buffer[self.write_pos] = byte;
>         self.write_pos = (self.write_pos + 1) % CAP;
>         if self.count < CAP {
>             self.count += 1;
>         }
>         self.total_written += 1;
>     }
> 
>     /// Copies stored bytes into a linear output slice in chronological order.
>     pub fn read_bytes<'a>(&self, out: &'a mut [u8]) -> &'a [u8] {
>         let copy_len = self.count.min(out.len());
>         if copy_len == 0 {
>             return &out[..0];
>         }
> 
>         let start_pos = if self.count < CAP {
>             0
>         } else {
>             self.write_pos
>         };
> 
>         for i in 0..copy_len {
>             let idx = (start_pos + i) % CAP;
>             out[i] = self.buffer[idx];
>         }
> 
>         &out[..copy_len]
>     }
> }
> 
> /// Implement `core::fmt::Write` to enable `write!` and `writeln!` macros in #![no_std]
> impl<const CAP: usize> Write for RingBufferLogger<CAP> {
>     fn write_str(&mut self, s: &str) -> fmt::Result {
>         for &byte in s.as_bytes() {
>             self.push_byte(byte);
>         }
>         Ok(())
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
>     use core::fmt::Write;
> 
>     #[test]
>     fn test_logger_basic_write() {
>         let mut logger: RingBufferLogger<64> = RingBufferLogger::new();
>         assert!(logger.is_empty());
>         assert_eq!(logger.len(), 0);
> 
>         // Format string using core::fmt::Write macro
>         write!(logger, "SYS_OK ID:{}", 101).unwrap();
> 
>         let mut out = [0u8; 64];
>         let bytes = logger.read_bytes(&mut out);
>         let text = core::str::from_utf8(bytes).unwrap();
> 
>         assert_eq!(text, "SYS_OK ID:101");
>         assert_eq!(logger.len(), 13);
>         assert_eq!(logger.total_written(), 13);
>     }
> 
>     #[test]
>     fn test_logger_circular_overwrite() {
>         // Buffer capacity of 8 bytes
>         let mut logger: RingBufferLogger<8> = RingBufferLogger::new();
> 
>         // Write 10 bytes: "1234567890" (exceeds capacity of 8)
>         write!(logger, "1234567890").unwrap();
> 
>         assert_eq!(logger.len(), 8);
>         assert_eq!(logger.total_written(), 10);
> 
>         let mut out = [0u8; 8];
>         let bytes = logger.read_bytes(&mut out);
>         let text = core::str::from_utf8(bytes).unwrap();
> 
>         // Oldest bytes "12" overwritten; buffer contains "34567890"
>         assert_eq!(text, "34567890");
>     }
> 
>     #[test]
>     fn test_logger_clear() {
>         let mut logger: RingBufferLogger<16> = RingBufferLogger::new();
>         write!(logger, "TEMP:24C").unwrap();
>         assert_eq!(logger.len(), 8);
> 
>         logger.clear();
>         assert!(logger.is_empty());
>         assert_eq!(logger.len(), 0);
> 
>         write!(logger, "RESET").unwrap();
>         let mut out = [0u8; 16];
>         let bytes = logger.read_bytes(&mut out);
>         assert_eq!(core::str::from_utf8(bytes).unwrap(), "RESET");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Zero-Allocation Stack Buffering via Const Generics**: Using `const CAP: usize`, memory storage is determined at compile time directly on the stack or static data segment without requiring dynamic heap allocation (`alloc`) or OS runtime support.
> 2. **Formatting Strings with `core::fmt::Write`**: Implementing `core::fmt::Write::write_str` unlocks standard Rust string formatting macros (`write!`, `writeln!`) inside `#![no_std]` environments without depending on `std::println!`.
> 3. **Circular Ring-Buffer Indexing**: Wrapping indices with `(write_pos + 1) % CAP` ensures continuous telemetry collection under fixed memory limits by automatically overwriting the oldest entries.
> 4. **Zero-Copy UTF-8 Verification**: Reading bytes back with `core::str::from_utf8` provides zero-copy validation of string contents in pure `core` Rust.
> 
> ---
> 
> ### Exercise 2: Bare-Metal Hardware Register Bitfield Controller
> 
> **Scenario:** In `#![no_std]` embedded device drivers, developers interact directly with memory-mapped I/O (MMIO) hardware control registers using integer bitmasks. Implement a type-safe control register wrapper `struct ControlRegister(u32)` with the following layout:
> - **Bits 0–1 (Mode)**: 2-bit device operating mode (`enum DeviceMode { Standby = 0b00, Active = 0b01, Diagnostic = 0b10, PowerDown = 0b11 }`).
> - **Bit 2 (Enable)**: Peripheral enable bit (`1` = Enabled, `0` = Disabled).
> - **Bit 3 (Interrupt Enable)**: Enable interrupt generation.
> - **Bits 4–7 (Prescaler)**: 4-bit clock division prescaler value (0 to 15).
> - **Bits 8–15 (Error Flags)**: Bitmask of active hardware error flags.
> - **Bit 31 (Busy Flag)**: Read-only hardware status flag (`1` = Hardware busy).
> 
> Provide type-safe helper methods to encode/decode fields using bitwise operations (`&`, `|`, `^`, `!`, `<<`, `>>`), clear error flags, validate prescaler input with `core::result::Result`, and test all bitmask manipulation routines.
> 
> > [!check]- Answer
> > ```rust
> > #![no_std]
> > 
> > /// Peripheral operating modes represented in bits 0..=1.
> > #[repr(u8)]
> > #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> > pub enum DeviceMode {
> >     Standby = 0b00,
> >     Active = 0b01,
> >     Diagnostic = 0b10,
> >     PowerDown = 0b11,
> > }
> > 
> > impl DeviceMode {
> >     /// Decodes a 2-bit raw value into a DeviceMode enum.
> >     pub fn from_u8(val: u8) -> Self {
> >         match val & 0b11 {
> >             0b00 => DeviceMode::Standby,
> >             0b01 => DeviceMode::Active,
> >             0b10 => DeviceMode::Diagnostic,
> >             _ => DeviceMode::PowerDown,
> >         }
> >     }
> > }
> > 
> > /// Bitfield configuration errors in #![no_std]
> > #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> > pub enum RegisterError {
> >     PrescalerOverflow,
> > }
> > 
> > /// Type-safe memory-mapped control register wrapper (u32).
> > #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> > pub struct ControlRegister(u32);
> > 
> > impl ControlRegister {
> >     const MODE_MASK: u32 = 0b11;            // Bits 0..=1
> >     const ENABLE_BIT: u32 = 1 << 2;         // Bit 2
> >     const INT_ENABLE_BIT: u32 = 1 << 3;     // Bit 3
> >     const PRESCALER_MASK: u32 = 0x0F << 4;  // Bits 4..=7
> >     const ERROR_MASK: u32 = 0xFF << 8;      // Bits 8..=15
> >     const BUSY_BIT: u32 = 1 << 31;          // Bit 31
> > 
> >     /// Creates a reset register with all bits set to 0.
> >     pub const fn new() -> Self {
> >         ControlRegister(0)
> >     }
> > 
> >     /// Returns the raw u32 value for MMIO register writes.
> >     pub const fn raw(&self) -> u32 {
> >         self.0
> >     }
> > 
> >     /// Set operating mode (bits 0..=1).
> >     pub fn set_mode(&mut self, mode: DeviceMode) -> &mut Self {
> >         self.0 = (self.0 & !Self::MODE_MASK) | (mode as u32);
> >         self
> >     }
> > 
> >     /// Get current operating mode.
> >     pub fn mode(&self) -> DeviceMode {
> >         DeviceMode::from_u8((self.0 & Self::MODE_MASK) as u8)
> >     }
> > 
> >     /// Set hardware enable bit (bit 2).
> >     pub fn set_enabled(&mut self, enabled: bool) -> &mut Self {
> >         if enabled {
> >             self.0 |= Self::ENABLE_BIT;
> >         } else {
> >             self.0 &= !Self::ENABLE_BIT;
> >         }
> >         self
> >     }
> > 
> >     /// Check if hardware is enabled.
> >     pub fn is_enabled(&self) -> bool {
> >         (self.0 & Self::ENABLE_BIT) != 0
> >     }
> > 
> >     /// Set interrupt enable flag (bit 3).
> >     pub fn set_interrupt_enabled(&mut self, enabled: bool) -> &mut Self {
> >         if enabled {
> >             self.0 |= Self::INT_ENABLE_BIT;
> >         } else {
> >             self.0 &= !Self::INT_ENABLE_BIT;
> >         }
> >         self
> >     }
> > 
> >     /// Check if interrupt is enabled.
> >     pub fn is_interrupt_enabled(&self) -> bool {
> >         (self.0 & Self::INT_ENABLE_BIT) != 0
> >     }
> > 
> >     /// Set clock prescaler value (bits 4..=7, max 15).
> >     pub fn set_prescaler(&mut self, prescaler: u8) -> Result<&mut Self, RegisterError> {
> >         if prescaler > 15 {
> >             return Err(RegisterError::PrescalerOverflow);
> >         }
> >         self.0 = (self.0 & !Self::PRESCALER_MASK) | ((prescaler as u32) << 4);
> >         Ok(self)
> >     }
> > 
> >     /// Get clock prescaler value.
> >     pub fn prescaler(&self) -> u8 {
> >         ((self.0 & Self::PRESCALER_MASK) >> 4) as u8
> >     }
> > 
> >     /// Get error status flags byte (bits 8..=15).
> >     pub fn error_flags(&self) -> u8 {
> >         ((self.0 & Self::ERROR_MASK) >> 8) as u8
> >     }
> > 
> >     /// Clear all error flags (bits 8..=15).
> >     pub fn clear_errors(&mut self) -> &mut Self {
> >         self.0 &= !Self::ERROR_MASK;
> >         self
> >     }
> > 
> >     /// Check if hardware status busy bit is set (bit 31).
> >     pub fn is_busy(&self) -> bool {
> >         (self.0 & Self::BUSY_BIT) != 0
> >     }
> > 
> >     /// Simulates hardware setting the busy flag (bit 31).
> >     pub fn set_busy_flag(&mut self, busy: bool) {
> >         if busy {
> >             self.0 |= Self::BUSY_BIT;
> >         } else {
> >             self.0 &= !Self::BUSY_BIT;
> >         }
> >     }
> > }
> > 
> > #[cfg(test)]
> > mod tests {
> >     use super::*;
> > 
> >     #[test]
> >     fn test_mode_and_enable_encoding() {
> >         let mut reg = ControlRegister::new();
> >         assert_eq!(reg.raw(), 0);
> >         assert_eq!(reg.mode(), DeviceMode::Standby);
> >         assert!(!reg.is_enabled());
> > 
> >         reg.set_mode(DeviceMode::Diagnostic).set_enabled(true);
> > 
> >         assert_eq!(reg.mode(), DeviceMode::Diagnostic);
> >         assert!(reg.is_enabled());
> >         assert_eq!(reg.raw(), 0b110);
> >     }
> > 
> >     #[test]
> >     fn test_prescaler_encoding_and_validation() {
> >         let mut reg = ControlRegister::new();
> >         assert!(reg.set_prescaler(10).is_ok());
> >         assert_eq!(reg.prescaler(), 10);
> >         assert_eq!(reg.raw(), 10 << 4);
> > 
> >         assert_eq!(reg.set_prescaler(16), Err(RegisterError::PrescalerOverflow));
> >         assert_eq!(reg.prescaler(), 10);
> >     }
> > 
> >     #[test]
> >     fn test_error_flags_clear_and_busy_bit() {
> >         let mut reg = ControlRegister::new();
> >         reg.set_busy_flag(true);
> >         reg.set_enabled(true);
> >         assert!(reg.is_busy());
> > 
> >         reg = ControlRegister(reg.raw() | (0xAB << 8));
> >         assert_eq!(reg.error_flags(), 0xAB);
> > 
> >         reg.clear_errors();
> >         assert_eq!(reg.error_flags(), 0x00);
> >         assert!(reg.is_enabled());
> >         assert!(reg.is_busy());
> >     }
> > }
> > ```
> >
> > **Explanation:**
> > 1. **Type-Safe Representation (`#[repr(u8)]`)**: Explicitly casting enums to target primitive types ensures bitmask alignment while preventing invalid runtime values.
> > 2. **Zero-Cost Hardware Drivers**: Tuple struct wrappers like `ControlRegister(u32)` encapsulate low-level register bits into high-level Rust APIs with zero CPU or memory overhead compared to direct raw C bit manipulation.
> > 3. **Mask-and-Shift Bit Manipulation**: Clearing targeted register ranges with `!MASK` before applying new values with bitwise OR (`|`) prevents unintentional bit corruption in hardware drivers.
> > 4. **No-Std Error Handling with `core::result::Result`**: Functions use custom `enum` types with `core::result::Result` to handle hardware boundary violations without standard OS exception infrastructure.
> 
> ---
> 
> ### Exercise 3: Bare-Metal Panic Diagnostic Recorder & Atomic Re-Entrancy Guard
> 
> **Scenario:** In bare-metal embedded systems, when a panic occurs, the system cannot output diagnostic messages to standard stdout. Instead, a custom `#[panic_handler]` must log fault details (file location and line number) into a static, non-allocating structure, prevent recursive panic cascades using atomic operations, and transition execution into a safe spin loop. Implement a `#![no_std]` panic recorder `FaultRecord` and a thread-safe panic handler system that:
> 1. Captures file paths (up to 48 bytes) and line numbers from `core::panic::PanicInfo` into a stack/static buffer without dynamic allocation.
> 2. Uses `core::sync::atomic::AtomicBool` with `Ordering::SeqCst` memory ordering to guard against nested or recursive panics during diagnostic recording.
> 3. Provides a `capture_fault_info(&PanicInfo) -> FaultRecord` helper function and a `#![no_std]` diverging `#[panic_handler]` function (`fn panic(...) -> !`).
> 4. Includes tests validating file path extraction, line number recording, UTF-8 string decoding, and atomic re-entrancy prevention.
> 
> > [!check]- Answer
> > ```rust
> > #![no_std]
> > 
> > use core::panic::PanicInfo;
> > use core::sync::atomic::{AtomicBool, Ordering};
> > 
> > static PANIC_LOCK: AtomicBool = AtomicBool::new(false);
> > const MAX_FILE_LEN: usize = 48;
> > 
> > /// Non-allocating panic diagnostic fault record.
> > #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> > pub struct FaultRecord {
> >     pub file_buf: [u8; MAX_FILE_LEN],
> >     pub file_len: usize,
> >     pub line: u32,
> >     pub recursive_panic_detected: bool,
> > }
> > 
> > impl FaultRecord {
> >     pub const fn empty() -> Self {
> >         FaultRecord {
> >             file_buf: [0u8; MAX_FILE_LEN],
> >             file_len: 0,
> >             line: 0,
> >             recursive_panic_detected: false,
> >         }
> >     }
> > 
> >     pub fn file_name(&self) -> &str {
> >         if self.file_len == 0 {
> >             "unknown"
> >         } else {
> >             core::str::from_utf8(&self.file_buf[..self.file_len]).unwrap_or("invalid_utf8")
> >         }
> >     }
> > }
> > 
> > pub fn capture_fault_info(info: &PanicInfo) -> FaultRecord {
> >     let mut record = FaultRecord::empty();
> > 
> >     // Atomic swap returns the previous value. If true, a recursive panic occurred!
> >     if PANIC_LOCK.swap(true, Ordering::SeqCst) {
> >         record.recursive_panic_detected = true;
> >         return record;
> >     }
> > 
> >     if let Some(location) = info.location() {
> >         let file_bytes = location.file().as_bytes();
> >         let copy_len = file_bytes.len().min(MAX_FILE_LEN);
> > 
> >         record.file_buf[..copy_len].copy_from_slice(&file_bytes[..copy_len]);
> >         record.file_len = copy_len;
> >         record.line = location.line();
> >     }
> > 
> >     record
> > }
> > 
> > pub fn reset_panic_lock() {
> >     PANIC_LOCK.store(false, Ordering::SeqCst);
> > }
> > 
> > /// Bare-metal panic handler implementation for #![no_std]
> > #[panic_handler]
> > fn panic(info: &PanicInfo) -> ! {
> >     let _fault = capture_fault_info(info);
> > 
> >     // On real embedded target, _fault details would be dispatched over hardware UART or flash storage
> >     loop {
> >         core::hint::spin_loop();
> >     }
> > }
> > 
> > #[cfg(test)]
> > mod tests {
> >     use super::*;
> > 
> >     #[test]
> >     fn test_fault_record_empty() {
> >         let rec = FaultRecord::empty();
> >         assert_eq!(rec.file_name(), "unknown");
> >         assert_eq!(rec.line, 0);
> >         assert!(!rec.recursive_panic_detected);
> >     }
> > 
> >     #[test]
> >     fn test_capture_fault_info_extraction() {
> >         reset_panic_lock();
> > 
> >         let mut rec = FaultRecord::empty();
> >         let test_file = "src/driver/uart.rs";
> >         let copy_len = test_file.len().min(MAX_FILE_LEN);
> > 
> >         rec.file_buf[..copy_len].copy_from_slice(test_file.as_bytes());
> >         rec.file_len = copy_len;
> >         rec.line = 142;
> > 
> >         assert_eq!(rec.file_name(), "src/driver/uart.rs");
> >         assert_eq!(rec.line, 142);
> >         assert!(!rec.recursive_panic_detected);
> >     }
> > 
> >     #[test]
> >     fn test_atomic_reentrancy_protection() {
> >         reset_panic_lock();
> > 
> >         let lock_acquired = !PANIC_LOCK.swap(true, Ordering::SeqCst);
> >         assert!(lock_acquired, "First panic lock acquisition should succeed");
> > 
> >         let second_acquisition = PANIC_LOCK.swap(true, Ordering::SeqCst);
> >         assert!(second_acquisition, "Second acquisition should detect active lock");
> > 
> >         reset_panic_lock();
> >         assert!(!PANIC_LOCK.load(Ordering::SeqCst));
> >     }
> > }
> > ```
> >
> > **Explanation:**
> > 1. **Diverging Panic Handlers (`#[panic_handler]`)**: In `#![no_std]`, `rustc` requires a `#[panic_handler]` function accepting `&PanicInfo` and returning the diverge type `!`. This guarantees execution never falls through after a panic.
> > 2. **Atomic Re-Entrancy Guards**: Using `AtomicBool::swap` with `Ordering::SeqCst` detects if a panic occurs inside the panic handler itself, safely halting recursive panic loops.
> > 3. **Non-Allocating Fault Capture**: Storing diagnostic strings in stack byte arrays (`[u8; 48]`) ensures fault logging functions without standard heap infrastructure (`alloc`).
> > 4. **Hardware Spin Loops (`core::hint::spin_loop`)**: Halting the CPU with `core::hint::spin_loop()` issues architecture-specific hints (like `PAUSE`/`NOP`) to minimize CPU power consumption during catastrophic system failures.

---

---

## 6. Related Terms

- [The Rust Standard Library (`std`)](std_library.md) — Related concept: The Rust Standard Library (`std`).

---

## 7. Key Takeaways

- `#![no_std]` disables the Rust Standard Library (`std`) for bare-metal, embedded, and OS kernel development.
- The `core` library remains 100% available, providing Option, Result, Iterators, and primitive types.
- Requires defining a custom `#[panic_handler]` function.
