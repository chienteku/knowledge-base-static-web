# Rustfmt

> **Level 16 — Ecosystem & Tooling**
> The official code formatting tool for Rust (`cargo fmt`) that automatically formats Rust source code according to the community style guidelines.

---

## 1. Prerequisites


- [Cargo CLI](../level_07/cargo_cli.md) — Invokes `rustfmt` via `cargo fmt`.

---

## 2. Term Category

**Ecosystem / Tooling**: `rustfmt` is the official, opinionated code formatter for the Rust programming language. Similar to `prettier` in JavaScript/TypeScript or `gofmt` in Go, `rustfmt` parses Rust AST tokens and re-formats source files to adhere strictly to the official Rust Style Guide, eliminating code style debates in code reviews.

---

## 3. Environment Context

**Universal Tooling**: `rustfmt` formats all `.rs` files in a workspace via `cargo fmt`. It is integrated into IDEs (VS Code, rust-analyzer, CLion) and runs in CI pipelines (`cargo fmt --check`).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"

In software teams working in languages without an official formatter (like C++ or legacy JavaScript):
1. Code reviews spend hours arguing over 4-space vs 2-space indentation, trailing commas, braces placement, and line wrap lengths.
2. Codebases become inconsistent patchwork quilts where every file looks different depending on who wrote it.
3. Diff noise increases in git commits when developers reformat indentation while making logic changes.

`rustfmt` solves this:
- **Zero Style Arguments**: The entire Rust ecosystem uses the exact same formatting rules.
- **Automated Formatting**: Invoked on save in IDEs or via `cargo fmt`.
- **CI Verification**: Enforces style rules in continuous integration (`cargo fmt --check`) to block unformatted pull requests.

### (2) Code Examples

#### CLI Usage

```bash
# 1. Format all code in the current Cargo workspace
cargo fmt

# 2. Check formatting in CI without modifying files (exits with code 1 if unformatted)
cargo fmt --check
```

#### Customizing `rustfmt.toml`

```toml
# rustfmt.toml (Placed in project root directory)
max_width = 100
tab_spaces = 4
edition = "2021"
use_small_heuristics = "Default"
reorder_imports = true
```

#### Suppressing Formatting for Specific Blocks

```rust
// Suppress rustfmt formatting for a specific item using `#[rustfmt::skip]`
#[rustfmt::skip]
const MATRIX: [f32; 9] = [
    1.0, 0.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 0.0, 1.0,
];

fn main() {
    println!("Formatted matrix preserved!");
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Arguing over Code Formatting in Code Reviews

**The mistake:** Spending time during code review discussing brace alignment or line wrapping.

**Why it's wrong:** Defer all style enforcement to `cargo fmt`. Run `cargo fmt --check` in CI to fail unformatted builds automatically.

---

## 6. Practice Exercises

### Exercise 1: Preserving Matrix Visual Alignment with `#[rustfmt::skip]` in Embedded Graphics

**Problem:** In embedded graphics renderers and DSP control systems, 2D affine transformation matrices are written in code with 3x3 grid alignment so engineers can visually verify rotation, scaling, and translation offsets. Standard `rustfmt` collapses multi-line matrix arrays into flat single-line constructs, destroying visual spatial intuition.

Write a `#![no_std]` compatible matrix transformation module containing:
1. A 3x3 affine transformation matrix constant (`TRANSFORM_2D_SCALE_AND_TRANSLATE`) annotated with `#[rustfmt::skip]` to preserve 2D grid line breaks.
2. A function `transform_point_2d(matrix: &[f32; 9], point: (f32, f32)) -> (f32, f32)` that applies matrix-vector multiplication.
3. Unit tests verifying matrix transformations with `assert_eq!`.

> [!check]- Answer
> ```rust
> #![cfg_attr(not(test), no_std)]
> 
> /// 3x3 Affine transformation matrix (row-major order).
> /// `#[rustfmt::skip]` prevents rustfmt from collapsing the grid into a single line.
> #[rustfmt::skip]
> pub const TRANSFORM_2D_SCALE_AND_TRANSLATE: [f32; 9] = [
>     2.0,  0.0,  10.0,
>     0.0,  3.0,  20.0,
>     0.0,  0.0,   1.0,
> ];
> 
> /// Applies 2D affine transformation to a 2D point (x, y) assuming homogenous coordinates (x, y, 1).
> pub fn transform_point_2d(matrix: &[f32; 9], point: (f32, f32)) -> (f32, f32) {
>     let (x, y) = point;
>     let new_x = matrix[0] * x + matrix[1] * y + matrix[2] * 1.0;
>     let new_y = matrix[3] * x + matrix[4] * y + matrix[5] * 1.0;
>     (new_x, new_y)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_transform_point_2d() {
>         let initial_point = (5.0, 4.0);
>         let result = transform_point_2d(&TRANSFORM_2D_SCALE_AND_TRANSLATE, initial_point);
>         
>         // 2.0 * 5.0 + 0.0 * 4.0 + 10.0 = 20.0
>         // 0.0 * 5.0 + 3.0 * 4.0 + 20.0 = 32.0
>         assert_eq!(result, (20.0, 32.0));
>     }
> 
>     #[test]
>     fn test_identity_transformation() {
>         #[rustfmt::skip]
>         let identity: [f32; 9] = [
>             1.0, 0.0, 0.0,
>             0.0, 1.0, 0.0,
>             0.0, 0.0, 1.0,
>         ];
>         let point = (12.5, -3.2);
>         assert_eq!(transform_point_2d(&identity, point), point);
>     }
> }
> ```
>
> **Explanation:**
> 1. **Formatting Preservation via Attribute**: The `#[rustfmt::skip]` attribute tells `rustfmt` to bypass formatting for the immediately following item (struct declaration, constant, function, or array literal). Without it, `rustfmt` compresses `[2.0, 0.0, 10.0, 0.0, 3.0, 20.0, 0.0, 0.0, 1.0]` onto one line, obscuring matrix structure.
> 2. **`#![no_std]` Compatibility**: Utilizing `#![cfg_attr(not(test), no_std)]` ensures the code can compile on bare-metal embedded targets while retaining standard library test harnesses (`#[cfg(test)]`) during verification.
> 3. **Mathematical Verification**: The test suite validates spatial matrix calculations against expected coordinate offsets using `assert_eq!`.

---

### Exercise 2: `rustfmt.toml` Project Configuration and Hardware Register Bitmask Formatting

**Problem:** An embedded hardware abstraction layer (HAL) requires strict alignment for 32-bit peripheral register address maps and bitmasks so that hardware engineers can easily compare bitfield offsets side-by-side. Additionally, the team requires project-wide code style rules enforced by `rustfmt.toml`.

1. Create a workspace `rustfmt.toml` configuration setting line length limits, import grouping, and edition rules.
2. Implement a `#![no_std]` hardware control register module using `#[rustfmt::skip]` on bitfield constant blocks to align bit offsets cleanly.
3. Write unit tests validating register mask parsing and bitwise validation logic with `assert_eq!` and `assert!`.

> [!check]- Answer
> **Configuration File (`rustfmt.toml`):**
> ```toml
> # rustfmt.toml - Embedded HAL Project Configuration
> edition = "2021"
> max_width = 100
> tab_spaces = 4
> newline_style = "Unix"
> reorder_imports = true
> group_imports = "StdExternalCrate"
> use_small_heuristics = "Default"
> ```
> 
> **Rust Code Implementation (`src/register_hal.rs`):**
> ```rust
> #![cfg_attr(not(test), no_std)]
> 
> /// Peripheral Register Address Offsets and Bitmasks
> pub struct UartRegisterBlock {
>     pub control: u32,
>     pub status: u32,
> }
> 
> impl UartRegisterBlock {
>     // Columnar alignment preserved via #[rustfmt::skip]
>     #[rustfmt::skip]
>     pub const ENABLE_BIT:      u32 = 1 << 0; // Bit 0: Enable Peripheral
>     #[rustfmt::skip]
>     pub const RX_INT_EN:       u32 = 1 << 1; // Bit 1: RX Interrupt Enable
>     #[rustfmt::skip]
>     pub const TX_INT_EN:       u32 = 1 << 2; // Bit 2: TX Interrupt Enable
>     #[rustfmt::skip]
>     pub const BAUDRATE_115200: u32 = 0x0001_0000; // Bit 16: 115200 Baud Configuration
> 
>     pub fn new() -> Self {
>         Self { control: 0, status: 0 }
>     }
> 
>     pub fn configure(&mut self, flags: u32) {
>         self.control |= flags;
>     }
> 
>     pub fn is_enabled(&self) -> bool {
>         (self.control & Self::ENABLE_BIT) != 0
>     }
> 
>     pub fn is_rx_interrupt_active(&self) -> bool {
>         (self.control & Self::RX_INT_EN) != 0
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_register_bitmask_configuration() {
>         let mut uart = UartRegisterBlock::new();
>         assert_eq!(uart.control, 0);
>         assert!(!uart.is_enabled());
> 
>         let config_flags = UartRegisterBlock::ENABLE_BIT | UartRegisterBlock::RX_INT_EN;
>         uart.configure(config_flags);
> 
>         assert_eq!(uart.control, 0x0000_0003);
>         assert!(uart.is_enabled());
>         assert!(uart.is_rx_interrupt_active());
>     }
> 
>     #[test]
>     fn test_baudrate_bitmask() {
>         assert_eq!(UartRegisterBlock::BAUDRATE_115200, 65536);
>     }
> }
> ```
>
> **Explanation:**
> 1. **Workspace Configuration (`rustfmt.toml`)**: `max_width = 100` prevents overly tight line wrapping on modern displays; `group_imports = "StdExternalCrate"` organizes `use` directives logically (`std` first, third-party crates second, local modules third).
> 2. **Inline Columnar Formatting**: Placing `#[rustfmt::skip]` before constant definitions prevents `rustfmt` from collapsing comments or collapsing unequal spacing between variable names and `=` operators, preserving aligned code columns.
> 3. **Hardware Bit Manipulation Testing**: The test suite validates bitwise logical operations (`|`, `&`) using `assert_eq!` and `assert!`, guaranteeing register flags are bit-exact for target hardware controllers.

---

### Exercise 3: CI Formatting Enforcement and Code Generation Exclusion Patterns

**Problem:** In a modern Rust continuous integration pipeline, unformatted code must fail the build before PR merge. However, micro-controller projects often contain auto-generated code files (e.g. from C bindings via `bindgen` or SVD-to-Rust tools) in `src/generated/` that should be excluded from formatting checks.

1. Configure `rustfmt.toml` to ignore specific auto-generated code paths.
2. Define the exact CI shell command sequence to run non-destructive style enforcement.
3. Write a Rust data validator module with unit tests proving that standard code formatting and validation work together.

> [!check]- Answer
> **Configuration File (`rustfmt.toml`):**
> ```toml
> edition = "2021"
> max_width = 100
> # Exclude auto-generated bindgen files from rustfmt processing
> ignore = [
>     "src/generated/*.rs",
>     "benches/vendor/",
> ]
> ```
> 
> **CI Pipeline Script (`.github/workflows/ci.yml` snippet or shell script):**
> ```bash
> #!/usr/bin/env bash
> set -euo pipefail
> 
> echo "Running rustfmt code style check..."
> cargo fmt --check --all
> 
> echo "Running unit test verification..."
> cargo test --workspace
> ```
> 
> **Rust Validator Implementation (`src/sensor_packet.rs`):**
> ```rust
> #![cfg_attr(not(test), no_std)]
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum PacketError {
>     InvalidHeader,
>     ChecksumMismatch,
> }
> 
> pub fn validate_sensor_packet(payload: &[u8]) -> Result<u16, PacketError> {
>     if payload.len() < 4 {
>         return Err(PacketError::InvalidHeader);
>     }
>     if payload[0] != 0xAA || payload[1] != 0x55 {
>         return Err(PacketError::InvalidHeader);
>     }
> 
>     let data_val = ((payload[2] as u16) << 8) | (payload[3] as u16);
>     Ok(data_val)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_valid_packet_parsing() {
>         let valid_packet = [0xAA, 0x55, 0x01, 0xE8]; // 0x01E8 = 488
>         let result = validate_sensor_packet(&valid_packet);
>         assert_eq!(result, Ok(488));
>     }
> 
>     #[test]
>     fn test_invalid_header_packet() {
>         let bad_header = [0xFF, 0x55, 0x00, 0x10];
>         assert_eq!(validate_sensor_packet(&bad_header), Err(PacketError::InvalidHeader));
>     }
> 
>     #[test]
>     fn test_short_payload() {
>         let short_data = [0xAA, 0x55];
>         assert_eq!(validate_sensor_packet(&short_data), Err(PacketError::InvalidHeader));
>     }
> }
> ```
>
> **Explanation:**
> 1. **The `ignore` Configuration Key**: Specifying glob patterns under `ignore` in `rustfmt.toml` stops `cargo fmt` from modifying auto-generated code, preventing unwanted diff noise or syntax error alerts on synthesized files.
> 2. **CI Non-Destructive Enforcement**: `cargo fmt --check --all` inspects all workspace crates without touching files on disk. If any file violates formatting rules, `cargo fmt` returns a non-zero exit code (exit status 1), causing the CI job to fail cleanly.
> 3. **Robust Unit Verification**: The Rust module demonstrates clean idiomatic layout formatted by `rustfmt`, validated with `assert_eq!` tests handling both success (`Ok(...)`) and error (`Err(...)`) pathways.

---

---

## 6. Related Terms

- [Rustup](rustup.md) — Related concept: Rustup.

---

## 7. Key Takeaways

- `rustfmt` (`cargo fmt`) is the official, opinionated Rust code formatter.
- It enforces the official Rust Style Guide, eliminating code style debates.
- Use `cargo fmt --check` in CI pipelines to enforce clean formatting automatically.
- Use `#[rustfmt::skip]` to preserve custom formatting for mathematical matrices or table data.
