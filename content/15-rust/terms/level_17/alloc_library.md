# `alloc` Library

> **Level 17 — Embedded & Systems Programming**
> The standard library crate (`extern crate alloc;`) that provides heap-allocated data structures (`Box`, `Vec`, `String`, `BTreeMap`, `Arc`) in `#![no_std]` environments by linking against a global memory allocator without requiring the full operating system support of `std`.

---

## 1. Prerequisites


- [Allocator API](../level_15/allocator_api.md) — Custom global allocators (`#[global_allocator]`) required by `alloc`.

---

## 2. Term Category

**Standard Library / Memory / Embedded**: `alloc` is the heap-allocation crate in the Rust compiler distribution. Situated between `core` (no heap, no OS) and `std` (heap + OS), `alloc` enables dynamic collections (`Vec<T>`, `Box<T>`, `String`) in `#![no_std]` applications as long as a global allocator (`#[global_allocator]`) is defined.

---

## 3. Environment Context

**Embedded & OS Kernel Environments**: Used in microcontrollers with external RAM, operating system kernel development, and WebAssembly modules.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"

In `#![no_std]` environments (such as an ARM Cortex microcontroller or OS kernel):
- You don't have access to `std::vec::Vec` because `std` is disabled.
- However, your microcontroller might have 128 MB of SDRAM, and you need a dynamic array (`Vec`) or heap pointer (`Box`).

Rust separated heap-allocated types into the **`alloc` crate**:
- **`core`**: 0 heap allocations, 0 OS calls.
- **`alloc`**: Heap allocations enabled (`Vec`, `Box`, `String`, `BTreeMap`), 0 OS calls required!
- **`std`**: Includes `core` + `alloc` + OS filesystem/sockets/threads.

By writing `extern crate alloc;` in a `#![no_std]` crate, you gain access to `alloc::vec::Vec` and `alloc::boxed::Box` without needing an operating system!

### (2) Code Examples

#### Using `alloc` in a `#![no_std]` Crate

```rust
#![no_std]

// 1. Explicitly enable the `alloc` crate in #![no_std]
extern crate alloc;

use alloc::vec::Vec;
use alloc::string::String;
use alloc::boxed::Box;
use alloc::format;

pub fn build_dynamic_message(id: u32) -> String {
    let mut numbers: Vec<u32> = Vec::new();
    numbers.push(id);
    numbers.push(id * 2);

    format!("Dynamic message for ID {}: sum={}", id, numbers.iter().sum::<u32>())
}

pub fn create_boxed_data(val: u32) -> Box<u32> {
    Box::new(val)
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Importing `alloc` without Defining a `#[global_allocator]`

**The mistake:** Using `extern crate alloc;` in a `#![no_std]` binary without registering a `#[global_allocator]`.

**Why it's wrong:** `alloc` needs a memory allocator to request heap bytes. Without a global allocator, linking fails.

---

## 6. Practice Exercises

### Exercise 1: Dynamic Sensor Telemetry Aggregator & Heap String Formatting

**Problem:** In an embedded telemetry logging system running on bare-metal hardware without an operating system, raw sensor measurements arrive over a serial bus. Write a `#![no_std]` function `pub fn summarize_telemetry(readings: &[(u32, f32)]) -> alloc::string::String` that:
1. Filters out invalid temperatures outside `[0.0, 100.0]` °C.
2. Collects valid timestamp-reading pairs into a heap-allocated `alloc::vec::Vec<(u32, f32)>` sorted by timestamp.
3. Computes the average temperature, minimum temperature, and maximum temperature across all valid samples.
4. Uses `alloc::format!` to construct and return a heap-allocated string summary formatted as `"Telemetry [<count> samples]: avg=<avg> C, range=[<min>..=<max>] C"`. If no valid samples exist, return `"Telemetry [0 samples]: empty"`.

Include a test function `pub fn test_telemetry_summarizer()` with assertions verifying filtering logic, mathematical calculations, and string formatting.

> [!check]- Answer
> ```rust
> #![no_std]
> extern crate alloc;
> 
> use alloc::format;
> use alloc::string::String;
> use alloc::vec::Vec;
> 
> pub fn summarize_telemetry(readings: &[(u32, f32)]) -> String {
>     let mut valid: Vec<(u32, f32)> = readings
>         .iter()
>         .copied()
>         .filter(|&(_, temp)| temp >= 0.0 && temp <= 100.0)
>         .collect();
> 
>     if valid.is_empty() {
>         return String::from("Telemetry [0 samples]: empty");
>     }
> 
>     // Sort valid readings by timestamp
>     valid.sort_by_key(|&(ts, _)| ts);
> 
>     let count = valid.len();
>     let sum: f32 = valid.iter().map(|&(_, temp)| temp).sum();
>     let avg = sum / (count as f32);
> 
>     let min_temp = valid
>         .iter()
>         .map(|&(_, temp)| temp)
>         .fold(f32::INFINITY, |acc, x| acc.min(x));
> 
>     let max_temp = valid
>         .iter()
>         .map(|&(_, temp)| temp)
>         .fold(f32::NEG_INFINITY, |acc, x| acc.max(x));
> 
>     format!(
>         "Telemetry [{} samples]: avg={:.2} C, range=[{:.1}..={:.1}] C",
>         count, avg, min_temp, max_temp
>     )
> }
> 
> pub fn test_telemetry_summarizer() {
>     let raw_readings = [
>         (1050, 24.5),
>         (1000, -5.0),  // Out of range (filtered out)
>         (1020, 105.0), // Out of range (filtered out)
>         (1010, 28.0),
>         (1030, 26.5),
>     ];
> 
>     let summary = summarize_telemetry(&raw_readings);
>     assert_eq!(
>         summary,
>         "Telemetry [3 samples]: avg=26.33 C, range=[24.5..=28.0] C"
>     );
> 
>     let invalid_readings = [(100, -10.0), (101, 150.0)];
>     let empty_summary = summarize_telemetry(&invalid_readings);
>     assert_eq!(empty_summary, "Telemetry [0 samples]: empty");
> }
> ```
>
> **Explanation:**
> 1. **Crate Enabling (`extern crate alloc;`)**: In `#![no_std]` targets, the compiler provides access to heap allocation primitives (`Vec`, `String`, `format!`) via `alloc`, without depending on standard library operating system wrappers (`std`).
> 2. **Heap Collection (`alloc::vec::Vec`)**: The `filter` and `collect` iterator pipeline allocates memory dynamically via the registered `#[global_allocator]` to store an arbitrary number of valid sensor pairs.
> 3. **Dynamic Text Generation (`alloc::format!`)**: Generates owned dynamic strings in heap memory on bare-metal systems where standard console output or OS file descriptors are unavailable.

---

### Exercise 2: Polymorphic Dynamic Command Dispatcher (`alloc::boxed::Box`)

**Problem:** Embedded microcontrollers receiving commands over UART or CAN bus need to process heterogeneous actions dynamically. Standard Rust slices or arrays cannot store dynamic trait objects directly because their size is unknown at compile time.

Implement a `#![no_std]` command processing system using dynamic trait objects boxed on the heap (`alloc::boxed::Box<dyn Command>`):
1. Define a `SystemState` struct tracking `led_enabled: bool`, `telemetry_rate_hz: u16`, and `error_count: u32`.
2. Define a trait `pub trait Command` with method `fn execute(&self, state: &mut SystemState) -> Result<(), &'static str>`.
3. Implement `Command` for `SetLedCommand { enable: bool }` and `ConfigureTelemetryCommand { rate_hz: u16 }`.
4. Create a `CommandDispatcher` struct holding `queue: alloc::vec::Vec<alloc::boxed::Box<dyn Command>>`. Provide `new()`, `register(cmd)`, and `execute_all(state)` methods, where `execute_all` drains the queue, executes each command, and returns the total count of executed commands.
5. Write a test function `pub fn test_command_dispatcher()` using assertions to verify command registration, heap dispatch execution, state mutation, and queue draining.

> [!check]- Answer
> ```rust
> #![no_std]
> extern crate alloc;
> 
> use alloc::boxed::Box;
> use alloc::vec::Vec;
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct SystemState {
>     pub led_enabled: bool,
>     pub telemetry_rate_hz: u16,
>     pub error_count: u32,
> }
> 
> impl SystemState {
>     pub fn default() -> Self {
>         Self {
>             led_enabled: false,
>             telemetry_rate_hz: 1,
>             error_count: 0,
>         }
>     }
> }
> 
> pub trait Command {
>     fn execute(&self, state: &mut SystemState) -> Result<(), &'static str>;
> }
> 
> pub struct SetLedCommand {
>     pub enable: bool,
> }
> 
> impl Command for SetLedCommand {
>     fn execute(&self, state: &mut SystemState) -> Result<(), &'static str> {
>         state.led_enabled = self.enable;
>         Ok(())
>     }
> }
> 
> pub struct ConfigureTelemetryCommand {
>     pub rate_hz: u16,
> }
> 
> impl Command for ConfigureTelemetryCommand {
>     fn execute(&self, state: &mut SystemState) -> Result<(), &'static str> {
>         if self.rate_hz == 0 || self.rate_hz > 1000 {
>             state.error_count += 1;
>             return Err("Invalid telemetry rate");
>         }
>         state.telemetry_rate_hz = self.rate_hz;
>         Ok(())
>     }
> }
> 
> pub struct CommandDispatcher {
>     queue: Vec<Box<dyn Command>>,
> }
> 
> impl CommandDispatcher {
>     pub fn new() -> Self {
>         Self { queue: Vec::new() }
>     }
> 
>     pub fn register(&mut self, cmd: Box<dyn Command>) {
>         self.queue.push(cmd);
>     }
> 
>     pub fn execute_all(&mut self, state: &mut SystemState) -> Result<usize, &'static str> {
>         let mut count = 0;
>         // Drain the queue to execute dynamic command objects
>         for cmd in self.queue.drain(..) {
>             cmd.execute(state)?;
>             count += 1;
>         }
>         Ok(count)
>     }
> }
> 
> pub fn test_command_dispatcher() {
>     let mut state = SystemState::default();
>     let mut dispatcher = CommandDispatcher::new();
> 
>     dispatcher.register(Box::new(SetLedCommand { enable: true }));
>     dispatcher.register(Box::new(ConfigureTelemetryCommand { rate_hz: 50 }));
> 
>     let executed = dispatcher.execute_all(&mut state).expect("Dispatch failed");
>     assert_eq!(executed, 2);
>     assert_eq!(
>         state,
>         SystemState {
>             led_enabled: true,
>             telemetry_rate_hz: 50,
>             error_count: 0,
>         }
>     );
> 
>     // Verify queue drain behavior
>     let empty_run = dispatcher.execute_all(&mut state).unwrap();
>     assert_eq!(empty_run, 0);
> }
> ```
>
> **Explanation:**
> 1. **Polymorphic Heap Allocation (`Box<dyn Trait>`)**: Unsized trait objects (`dyn Command`) cannot be stored directly inside contiguous arrays. Placing them inside `alloc::boxed::Box` creates a heap pointer paired with a vtable (fat pointer), enabling heterogeneous collections in `#![no_std]`.
> 2. **Decoupled Architecture**: Heterogeneous command payloads can be queued and processed uniformly through `Vec<Box<dyn Command>>` without requiring large enums or monolithic switch statements.
> 3. **Resource Cleanup (`drain(..)`)**: Using `Vec::drain(..)` transfers ownership of boxed objects out of the queue during iteration. As each `Box` goes out of scope after execution, its allocated memory is automatically reclaimed by the global allocator.

---

### Exercise 3: Bare-Metal Device Registry & Map Lookup (`alloc::collections::BTreeMap`)

**Problem:** Standard `std::collections::HashMap` is unavailable in `#![no_std]` crates because hash tables depend on cryptographically secure random number generators provided by operating system kernels. `alloc::collections::BTreeMap` offers an ordered key-value map powered entirely by heap allocation without OS dependencies.

Implement a bare-metal peripheral device manager `struct DeviceRegistry` that routes message payloads to registered bus addresses (`u8`):
1. Wrap `devices: alloc::collections::BTreeMap<u8, alloc::string::String>`.
2. Implement `new()`, `register_device(addr, name)`, `lookup_device(addr) -> Option<&str>`, and `active_devices_report() -> alloc::string::String`.
3. `active_devices_report()` must format registered devices into a comma-separated string ordered by address (e.g., `"0x0A: Temp Sensor, 0x10: OLED Display, 0x48: ADC Controller"`). Return `"No devices registered"` if empty.
4. Write a test function `pub fn test_device_registry()` with assertions verifying insertion, search lookup, missing address handling, and key-sorted report generation.

> [!check]- Answer
> ```rust
> #![no_std]
> extern crate alloc;
> 
> use alloc::collections::BTreeMap;
> use alloc::format;
> use alloc::string::String;
> 
> pub struct DeviceRegistry {
>     devices: BTreeMap<u8, String>,
> }
> 
> impl DeviceRegistry {
>     pub fn new() -> Self {
>         Self {
>             devices: BTreeMap::new(),
>         }
>     }
> 
>     pub fn register_device(&mut self, addr: u8, name: &str) {
>         self.devices.insert(addr, String::from(name));
>     }
> 
>     pub fn lookup_device(&self, addr: u8) -> Option<&str> {
>         self.devices.get(&addr).map(|s| s.as_str())
>     }
> 
>     pub fn active_devices_report(&self) -> String {
>         if self.devices.is_empty() {
>             return String::from("No devices registered");
>         }
> 
>         let mut report = String::new();
>         for (i, (&addr, name)) in self.devices.iter().enumerate() {
>             if i > 0 {
>                 report.push_str(", ");
>             }
>             report.push_str(&format!("0x{:02X}: {}", addr, name));
>         }
>         report
>     }
> }
> 
> pub fn test_device_registry() {
>     let mut registry = DeviceRegistry::new();
> 
>     // Insert out of numeric order to demonstrate BTreeMap ordering
>     registry.register_device(0x10, "OLED Display");
>     registry.register_device(0x0A, "Temp Sensor");
>     registry.register_device(0x48, "ADC Controller");
> 
>     assert_eq!(registry.lookup_device(0x0A), Some("Temp Sensor"));
>     assert_eq!(registry.lookup_device(0x99), None);
> 
>     let report = registry.active_devices_report();
>     assert_eq!(
>         report,
>         "0x0A: Temp Sensor, 0x10: OLED Display, 0x48: ADC Controller"
>     );
> }
> ```
>
> **Explanation:**
> 1. **No-OS Key-Value Map (`BTreeMap`)**: While `HashMap` requires OS entropy for hash seeds, `BTreeMap` relies only on key comparison (`Ord`), making it the standard dynamic dictionary structure in `alloc` for `#![no_std]` targets.
> 2. **Deterministic Ordering**: `BTreeMap` automatically sorts keys in memory ($O(\log N)$ operations). Iterating over `BTreeMap` yields keys in natural ascending order, guaranteeing deterministic serial output for embedded hardware inspection.
> 3. **Heap Storage Management**: Dynamically resizes internally as devices are added or removed, utilizing allocator pages without fixed array size limits.

---

---

## 6. Related Terms

- [`core` Library](core_library.md) — Related concept: `core` Library.
- [The Rust Standard Library (`std`)](std_library.md) — Related concept: The Rust Standard Library (`std`).

---

## 7. Key Takeaways

- `alloc` provides heap data structures (`Box`, `Vec`, `String`, `Arc`) in `#![no_std]` environments.
- Enabled via `extern crate alloc;`.
- Requires a `#[global_allocator]` to supply raw heap memory.
- Does not require any operating system support.
