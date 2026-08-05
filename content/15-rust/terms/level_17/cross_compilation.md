# Cross-Compilation

> **Level 17 — Embedded & Systems Programming**
> The process of building executable binaries on a host machine (e.g. x86_64 Linux or macOS) targeted to run on a completely different CPU architecture or operating system target (e.g. `thumbv7em-none-eabihf` ARM Cortex-M, `wasm32-unknown-unknown`, or `x86_64-pc-windows-gnu`).

---

## 1. Prerequisites


- [Rustup](../level_16/rustup.md) — Toolchain manager used to add target architectures (`rustup target add`).
- [Cargo CLI](../level_07/cargo_cli.md) — Invokes cross-compilation via `cargo build --target <target_triple>`.

---

## 2. Term Category

**Systems / Tooling / Compiler Configuration**: Cross-Compilation is a core capability of `rustc` and `LLVM`. Unlike compilers that require setting up complex chroot environments or separate cross-gcc toolchains, Rust uses standardized **Target Triples** (`architecture-vendor-sys-abi`) to generate machine code for any supported target architecture from a single host machine.

---

## 3. Environment Context

**Universal Tooling**: Used daily for embedded firmware compilation, WebAssembly builds, mobile development (iOS/Android), and cross-OS server deployment.

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"

Developing software directly *on* an embedded microcontroller (like a 64 MHz ARM chip with 128 KB RAM) or a mobile phone is impossible due to memory and CPU limits. Developers must compile the code on a powerful desktop workstation (**Host Machine**) and produce binaries designed to run on the target hardware (**Target Machine**).

Rust makes cross-compilation seamless:
1. Install target standard library: `rustup target add thumbv7em-none-eabihf`.
2. Compile binary: `cargo build --target thumbv7em-none-eabihf`.

### (2) Target Triple Structure (`architecture-vendor-sys-abi`)

| Target Triple | CPU Architecture | Operating System | ABI / Environment |
| :--- | :--- | :--- | :--- |
| `x86_64-unknown-linux-gnu` | 64-bit x86 | Linux | GNU libc |
| `thumbv7em-none-eabihf` | ARM Cortex-M4F | Bare-Metal (`none`) | Hardware Floating Point |
| `wasm32-unknown-unknown` | 32-bit WebAssembly | None | Standard WebAssembly |
| `aarch64-apple-darwin` | 64-bit ARM (M1/M2) | macOS | Darwin ABI |

### (3) Code & CLI Examples

#### Cross-Compiling Commands

```bash
# 1. Add WebAssembly target architecture
rustup target add wasm32-unknown-unknown

# 2. Add ARM Cortex-M4 embedded target
rustup target add thumbv7em-none-eabihf

# 3. Cross-compile project for ARM Cortex-M4
cargo build --target thumbv7em-none-eabihf --release

# 4. Use `cross` tool for C-dependency cross-compilation via Docker
cargo install cross
cross build --target aarch64-unknown-linux-gnu
```

#### Configuring Default Target in `.cargo/config.toml`

```toml
# .cargo/config.toml
[build]
target = "thumbv7em-none-eabihf"

[target.thumbv7em-none-eabihf]
runner = "probe-rs run --chip STM32F407VGTx"
rustflags = ["-C", "link-arg=-Tlink.x"]
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Missing C Cross-Linker when Building C-Dependencies

**The mistake:** Running `cargo build --target aarch64-unknown-linux-gnu` on an x86_64 machine when project dependencies include C libraries (like `openssl-sys` or `sqlite3`).

**Why it's wrong:** LLVM can compile Rust code for ARM, but standard system `gcc`/`ld` cannot link C libraries for ARM without a cross-linker.

*Fix:* Use the `cross` tool (`cargo install cross`), which executes builds inside pre-configured Docker containers containing cross-linkers.

---

## 6. Practice Exercises

### Exercise 1: Target Triple Parser and Cross-Compilation Attribute Analyzer

**Problem:** When configuring automated cross-compilation CI pipelines or cargo build scripts (`build.rs`), developers must analyze target triple strings (`architecture-vendor-system-abi`) to determine compiler flags, linker scripts, and hardware acceleration options. Implement a `#![no_std]` target triple parser struct `TargetTriple<'a>` capable of parsing 3-component and 4-component target triples (e.g. `"thumbv7em-none-eabihf"`, `"wasm32-unknown-unknown"`, `"x86_64-unknown-linux-gnu"`). Add methods to query cross-compilation properties: `is_bare_metal()`, `has_hardware_fpu()`, `pointer_width_bits()`, and `requires_custom_linker()`. Include unit tests with assertions verifying correctness across embedded, WebAssembly, and host targets.

> [!check]- Answer
> ```rust
> #![no_std]
> 
> /// Target triple representation breaking down standard cross-compilation target triples.
> #[derive(Debug, PartialEq, Eq)]
> pub struct TargetTriple<'a> {
>     pub arch: &'a str,
>     pub vendor: &'a str,
>     pub sys: &'a str,
>     pub abi: Option<&'a str>,
> }
> 
> impl<'a> TargetTriple<'a> {
>     /// Parses a standard target triple string like "thumbv7em-none-eabihf" or "x86_64-unknown-linux-gnu".
>     pub fn parse(triple: &'a str) -> Result<Self, &'static str> {
>         let parts: [Option<&'a str>; 4] = {
>             let mut iter = triple.split('-');
>             [iter.next(), iter.next(), iter.next(), iter.next()]
>         };
> 
>         match parts {
>             [Some(arch), Some(vendor), Some(sys), Some(abi)] => Ok(TargetTriple {
>                 arch,
>                 vendor,
>                 sys,
>                 abi: Some(abi),
>             }),
>             [Some(arch), Some(vendor_or_sys), Some(sys_or_abi), None] => {
>                 if vendor_or_sys == "none" || vendor_or_sys == "unknown" {
>                     if sys_or_abi.starts_with("eabi") || sys_or_abi == "elf" {
>                         Ok(TargetTriple {
>                             arch,
>                             vendor: "none",
>                             sys: vendor_or_sys,
>                             abi: Some(sys_or_abi),
>                         })
>                     } else {
>                         Ok(TargetTriple {
>                             arch,
>                             vendor: vendor_or_sys,
>                             sys: sys_or_abi,
>                             abi: None,
>                         })
>                     }
>                 } else {
>                     Ok(TargetTriple {
>                         arch,
>                         vendor: "unknown",
>                         sys: vendor_or_sys,
>                         abi: Some(sys_or_abi),
>                     })
>                 }
>             }
>             _ => Err("Invalid target triple string format"),
>         }
>     }
> 
>     /// Checks if target is a bare-metal target without an operating system (`#![no_std]`).
>     pub fn is_bare_metal(&self) -> bool {
>         self.sys == "none"
>     }
> 
>     /// Checks if the target ABI uses hardware floating-point instructions (e.g. `eabihf`).
>     pub fn has_hardware_fpu(&self) -> bool {
>         match self.abi {
>             Some(abi) => abi.ends_with("hf"),
>             None => false,
>         }
>     }
> 
>     /// Calculates CPU word/pointer bit width from target architecture.
>     pub fn pointer_width_bits(&self) -> usize {
>         match self.arch {
>             "x86_64" | "aarch64" | "riscv64" => 64,
>             "thumbv6m" | "thumbv7m" | "thumbv7em" | "wasm32" | "i686" | "armv7" => 32,
>             "msp430" | "avr" => 16,
>             _ => 32,
>         }
>     }
> 
>     /// Determines if target binary linking requires a specialized target runner or linker script (`link.x`).
>     pub fn requires_custom_linker(&self) -> bool {
>         self.is_bare_metal() || self.arch.starts_with("thumb")
>     }
> }
> 
> /// Unit test verifying target triple parsing across various cross-compilation target architectures.
> pub fn test_target_triple_analysis() {
>     // 1. Embedded ARM Cortex-M4 with hardware floating point
>     let arm = TargetTriple::parse("thumbv7em-none-eabihf").expect("Failed to parse ARM target");
>     assert_eq!(arm.arch, "thumbv7em");
>     assert_eq!(arm.sys, "none");
>     assert_eq!(arm.abi, Some("eabihf"));
>     assert!(arm.is_bare_metal());
>     assert!(arm.has_hardware_fpu());
>     assert_eq!(arm.pointer_width_bits(), 32);
>     assert!(arm.requires_custom_linker());
> 
>     // 2. 64-bit Linux GNU host target
>     let linux = TargetTriple::parse("x86_64-unknown-linux-gnu").expect("Failed to parse Linux target");
>     assert_eq!(linux.arch, "x86_64");
>     assert_eq!(linux.vendor, "unknown");
>     assert_eq!(linux.sys, "linux");
>     assert_eq!(linux.abi, Some("gnu"));
>     assert!(!linux.is_bare_metal());
>     assert!(!linux.has_hardware_fpu());
>     assert_eq!(linux.pointer_width_bits(), 64);
>     assert!(!linux.requires_custom_linker());
> 
>     // 3. WebAssembly target
>     let wasm = TargetTriple::parse("wasm32-unknown-unknown").expect("Failed to parse WASM target");
>     assert_eq!(wasm.arch, "wasm32");
>     assert_eq!(wasm.sys, "unknown");
>     assert_eq!(wasm.pointer_width_bits(), 32);
>     assert!(!wasm.has_hardware_fpu());
> }
> ```
>
> **Explanation:**
> 1. **Target Triple Format (`arch-vendor-sys-abi`)**: Target triples encode hardware architecture, vendor, operating system, and ABI conventions. When cross-compiling for bare-metal ARM microcontrollers (`thumbv7em-none-eabihf`), `sys` is `"none"` (indicating no OS), and `eabihf` designates Hard-Float ABI.
> 2. **Zero-Allocation Parsing (`#![no_std]`)**: By leveraging slice iteration (`triple.split('-')`) and `&'a str` borrowing, string analysis executes efficiently without requiring `std` or heap memory allocation (`alloc`).
> 3. **Cargo Integration**: Custom build scripts (`build.rs`) inspect target components to pass architecture-specific flags (e.g. `-C link-arg=-Tlink.x`) to `rustc` during cross-compilation.

---

### Exercise 2: Endianness-Aware Serializer for Cross-Architecture Data Transfer

**Problem:** When cross-compiling software that communicates across heterogeneous architectures (e.g. Little-Endian `x86_64` or `thumbv7em` devices sending telemetry to Big-Endian network hardware or protocol parsers), byte ordering of multi-byte numbers differs. Implement a `#![no_std]` network frame serializer and deserializer `TelemetryFrame` using explicit Big-Endian conversion (`to_be_bytes()` / `from_be_bytes()`). Include unit tests proving deterministic serialization independent of host CPU architecture.

> [!check]- Answer
> ```rust
> #![no_std]
> 
> #[derive(Debug, PartialEq, Clone, Copy)]
> pub struct TelemetryFrame {
>     pub device_id: u16,
>     pub timestamp_ms: u64,
>     pub temperature_bits: u32,
>     pub flags: u16,
> }
> 
> impl TelemetryFrame {
>     pub const FRAME_SIZE: usize = 16;
> 
>     /// Serializes the frame into Big-Endian (Network Byte Order) format.
>     pub fn serialize(&self) -> [u8; Self::FRAME_SIZE] {
>         let mut buffer = [0u8; Self::FRAME_SIZE];
> 
>         let id_bytes = self.device_id.to_be_bytes();
>         buffer[0..2].copy_from_slice(&id_bytes);
> 
>         let ts_bytes = self.timestamp_ms.to_be_bytes();
>         buffer[2..10].copy_from_slice(&ts_bytes);
> 
>         let temp_bytes = self.temperature_bits.to_be_bytes();
>         buffer[10..14].copy_from_slice(&temp_bytes);
> 
>         let flag_bytes = self.flags.to_be_bytes();
>         buffer[14..16].copy_from_slice(&flag_bytes);
> 
>         buffer
>     }
> 
>     /// Deserializes a Big-Endian byte buffer into a TelemetryFrame.
>     pub fn deserialize(buffer: &[u8; Self::FRAME_SIZE]) -> Self {
>         let device_id = u16::from_be_bytes([buffer[0], buffer[1]]);
>         let timestamp_ms = u64::from_be_bytes([
>             buffer[2], buffer[3], buffer[4], buffer[5],
>             buffer[6], buffer[7], buffer[8], buffer[9],
>         ]);
>         let temperature_bits = u32::from_be_bytes([
>             buffer[10], buffer[11], buffer[12], buffer[13],
>         ]);
>         let flags = u16::from_be_bytes([buffer[14], buffer[15]]);
> 
>         TelemetryFrame {
>             device_id,
>             timestamp_ms,
>             temperature_bits,
>             flags,
>         }
>     }
> 
>     pub fn set_temperature(&mut self, temp_celsius: f32) {
>         self.temperature_bits = temp_celsius.to_bits();
>     }
> 
>     pub fn get_temperature(&self) -> f32 {
>         f32::from_bits(self.temperature_bits)
>     }
> }
> 
> pub fn test_cross_architecture_endianness() {
>     let mut frame = TelemetryFrame {
>         device_id: 0x4142,
>         timestamp_ms: 0x0102030405060708,
>         temperature_bits: 0,
>         flags: 0x00FF,
>     };
>     frame.set_temperature(25.5);
> 
>     let serialized = frame.serialize();
> 
>     // Verify Big-Endian byte layout (deterministic across all host/target CPUs)
>     assert_eq!(serialized[0..2], [0x41, 0x42]);
>     assert_eq!(serialized[2..10], [0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]);
>     assert_eq!(serialized[14..16], [0x00, 0xFF]);
> 
>     // Verify round-trip deserialization
>     let restored = TelemetryFrame::deserialize(&serialized);
>     assert_eq!(restored, frame);
>     assert!((restored.get_temperature() - 25.5).abs() < 1e-5);
> }
> ```
>
> **Explanation:**
> 1. **Cross-Architecture Endian Safety**: Native byte layout (`to_ne_bytes`) varies across targets. Using explicit `to_be_bytes()` and `from_be_bytes()` guarantees identical byte representation on Little-Endian (`x86_64`, ARM Cortex-M) and Big-Endian targets.
> 2. **Bit Reinterpretation for Floating Point**: `f32::to_bits()` converts single-precision floating point numbers into bit patterns (`u32`), preventing platform floating-point representation differences or soft-float compiler discrepancies from corrupting binary payloads.
> 3. **Fixed-Buffer Allocation**: Stack-allocated arrays `[u8; 16]` allow cross-compiled embedded binaries to execute without heap requirements.

---

### Exercise 3: Dual-Target Driver Abstraction via Conditional Compilation (`#[cfg]`)

**Problem:** Embedded drivers should compile for bare-metal targets (`#[cfg(target_os = "none")]`) accessing actual volatile peripheral MMIO registers, while providing host simulation implementations (`#[cfg(not(target_os = "none"))]`) so unit tests can run locally via `cargo test` on developer host workstations. Implement a `#![no_std]` status register abstraction `StatusRegister` that uses MMIO raw pointers on bare metal and simulated register memory on host targets. Write tests proving register state mutation on host architectures.

> [!check]- Answer
> ```rust
> #![no_std]
> 
> /// Address of MMIO Status Register on target microcontroller hardware.
> const MMIO_STATUS_ADDR: usize = 0x4000_1000;
> 
> #[cfg(not(target_os = "none"))]
> static mut MOCK_MMIO_REGISTER: u32 = 0;
> 
> pub struct StatusRegister;
> 
> impl StatusRegister {
>     pub const fn new() -> Self {
>         StatusRegister
>     }
> 
>     /// Writes raw u32 state to the hardware register.
>     pub fn write_status(&mut self, val: u32) {
>         #[cfg(target_os = "none")]
>         {
>             // Bare-metal target: write directly to hardware memory-mapped register
>             unsafe {
>                 core::ptr::write_volatile(MMIO_STATUS_ADDR as *mut u32, val);
>             }
>         }
> 
>         #[cfg(not(target_os = "none"))]
>         {
>             // Host target: update simulated register memory
>             unsafe {
>                 MOCK_MMIO_REGISTER = val;
>             }
>         }
>     }
> 
>     /// Reads raw u32 state from the hardware register.
>     pub fn read_status(&self) -> u32 {
>         #[cfg(target_os = "none")]
>         {
>             // Bare-metal target: read directly from hardware memory-mapped register
>             unsafe {
>                 core::ptr::read_volatile(MMIO_STATUS_ADDR as *const u32)
>             }
>         }
> 
>         #[cfg(not(target_os = "none"))]
>         {
>             // Host target: read simulated register memory
>             unsafe { MOCK_MMIO_REGISTER }
>         }
>     }
> 
>     /// Sets a specific bit flag (0..31) in the status register.
>     pub fn set_flag(&mut self, bit_index: u8) {
>         if bit_index < 32 {
>             let current = self.read_status();
>             self.write_status(current | (1 << bit_index));
>         }
>     }
> 
>     /// Checks if a specific bit flag (0..31) is set.
>     pub fn is_flag_set(&self, bit_index: u8) -> bool {
>         if bit_index < 32 {
>             (self.read_status() & (1 << bit_index)) != 0
>         } else {
>             false
>         }
>     }
> }
> 
> pub fn test_status_register_driver() {
>     let mut reg = StatusRegister::new();
>     reg.write_status(0);
>     assert_eq!(reg.read_status(), 0);
> 
>     // Set bit 3 (system ready) and bit 7 (interrupt enabled)
>     reg.set_flag(3);
>     reg.set_flag(7);
> 
>     assert!(reg.is_flag_set(3));
>     assert!(reg.is_flag_set(7));
>     assert!(!reg.is_flag_set(0));
>     assert_eq!(reg.read_status(), (1 << 3) | (1 << 7));
> }
> ```
>
> **Explanation:**
> 1. **Conditional Compilation (`#[cfg(...)]`)**: Rust allows conditional compilation based on target properties such as `target_os = "none"` (bare metal), `target_arch = "x86_64"`, or `target_env = "gnu"`.
> 2. **Hardware MMIO vs Host Mocking**: On real microcontrollers (`target_os = "none"`), registers are controlled via `core::ptr::write_volatile` and `core::ptr::read_volatile`. On host developer workstations, `#[cfg(not(target_os = "none"))]` stubs out MMIO using host memory, enabling `cargo test` execution without physical hardware.
> 3. **Portable Drivers**: This pattern enables developing peripheral drivers that compile cleanly both when cross-compiled for ARM/RISC-V targets and when tested on x86_64 host machines.

---

---

## 6. Related Terms

**None.**

---

## 7. Key Takeaways

- Cross-compilation generates executable binaries for a target architecture different from the host workstation.
- Controlled via Target Triples (`architecture-vendor-sys-abi`).
- Use `rustup target add <triple>` and `cargo build --target <triple>`.
- Use `cross` for seamless cross-compilation of projects with C library dependencies.
