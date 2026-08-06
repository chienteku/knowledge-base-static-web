# `docs.rs`

> **Level 16 — Ecosystem & Tooling**
> The official, open-source documentation hosting service for the Rust ecosystem (`docs.rs`) — automatically building and hosting beautiful, cross-linked HTML API documentation for every crate published to `crates.io`.



---

### Exercise 2: Automated Cross-Target Documentation Verification & Multi-Platform CI

**Scenario:**
You are building an open-source cross-platform system utility library (`sys-info-rs`) that supports Linux, macOS, Windows, and WebAssembly (`wasm32`). Certain hardware inspection functions exist only on specific operating systems (e.g. Linux `/proc` filesystem monitors vs Windows Win32 API calls).

To ensure high-quality documentation on `docs.rs`:
1. Configure `Cargo.toml` with `[package.metadata.docs.rs]` specifying target triples `["x86_64-unknown-linux-gnu", "x86_64-pc-windows-msvc", "wasm32-unknown-unknown"]`.
2. Write platform-gated functions using `#[cfg(target_os = "linux")]` and `#[doc(cfg(target_os = "linux"))]`.
3. Provide a safe public API facade with complete documentation comments and `/// # Examples` doctests.
4. Include unit tests verifying platform-specific logic and doctest compilation.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> //! Cross-platform system metrics collector library.
> 
> pub struct SystemMetrics {
>     pub core_count: usize,
> }
> 
> impl SystemMetrics {
>     /// Returns basic CPU metrics available on all target platforms.
>     pub fn current() -> Self {
>         Self {
>             core_count: 4,
>         }
>     }
> }
> 
> /// Linux-specific memory metrics collector.
> #[cfg(target_os = "linux")]
> #[doc(cfg(target_os = "linux"))]
> pub fn read_proc_meminfo() -> Result<usize, &'static str> {
>     Ok(16384) // Simulated 16GB memory reading
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_generic_metrics() {
>         let metrics = SystemMetrics::current();
>         assert_eq!(metrics.core_count, 4);
>     }
> 
>     #[cfg(target_os = "linux")]
>     #[test]
>     fn test_linux_meminfo() {
>         assert_eq!(read_proc_meminfo(), Ok(16384));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Multi-Target Documentation (`targets`)**: Adding target triples to `Cargo.toml` under `[package.metadata.docs.rs]` instructs `docs.rs` to run `cargo doc` builds for all listed platforms, creating a target selector dropdown in the hosted documentation header.
> 2. **Platform Badging (`#[doc(cfg(...))]`)**: Annotating platform-specific functions with `#[doc(cfg(target_os = "..."))]` displays OS requirement badges on `docs.rs`.
> 3. **Compilation Verification**: Combining doc tests with `cargo test --doc` prevents documentation example rot.
> 
---

### Exercise 3: Intra-Doc Linking and Workspace Crate Documentation Architecture

**Scenario:**
In a large multi-crate Rust workspace (containing `my-engine-core` and `my-engine-api`), public documentation must hyperlink seamlessly between crate types without broken links or hardcoded URLs.

1. Use intra-doc link syntax `[`EngineCore`](my_engine_core::EngineCore)` to reference types across workspace crates.
2. Verify that internal modules and re-exported types are documented properly with `#[doc(inline)]`.
3. Include unit tests and doc-tests verifying intra-doc link resolution and re-export access.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> //! Main API entrypoint for the engine workspace.
> //!
> //! This crate builds upon [`EngineCore`](my_engine_core::EngineCore) to provide
> //! high-level HTTP and RPC routing services.
> 
> pub mod my_engine_core {
>     /// Core execution engine state.
>     pub struct EngineCore {
>         pub active: bool,
>     }
> }
> 
> /// High-level service wrapper for [`EngineCore`].
> pub struct ApiService {
>     pub core: my_engine_core::EngineCore,
> }
> 
> impl ApiService {
>     /// Constructs an `ApiService` using an initial [`EngineCore`].
>     pub fn new(core: my_engine_core::EngineCore) -> Self {
>         Self { core }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_api_service_creation() {
>         let core = my_engine_core::EngineCore { active: true };
>         let service = ApiService::new(core);
>         assert!(service.core.active);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Intra-Doc Links**: Intra-doc Markdown links `[`TypeName`](path::TypeName)` are validated at compile time by `rustdoc`, ensuring broken links trigger compiler warnings/errors.
> 2. **Cross-Crate Linking**: `docs.rs` automatically links types across different published crates on `crates.io` and within workspace crates.
> 3. **Inline Re-exports**: `#[doc(inline)]` renders re-exported items directly on the module page for enhanced developer ergonomics.
> 
---

## 1. Prerequisites


- [Documentation Comments (`///`, `//!`)](../level_07/documentation_comments.md) — Triple-slash `///` doc comments parsed by `docs.rs`.
- [Cargo CLI](../level_07/cargo_cli.md) — Local documentation generator (`cargo doc --open`).

---

## 2. Term Category



**Rust Ecosystem Platform (automatic documentation hosting service)**: `docs.rs` is Rust's centralized documentation platform. Whenever a developer publishes a crate version to `crates.io`, a background `docs.rs` builder automatically runs `cargo doc` for all target platforms, hosting fully searchable, interactive HTML documentation at `https://docs.rs/<crate_name>`.



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In traditional languages:
- Developers must manually build HTML documentation, purchase web domain hosting, and upload static site files.
- Documentation for different library versions gets lost or broken over time.
- Standard library types (`String`, `Option`, `Result`) are not hyperlinked across third-party documentation.

`docs.rs` provides a **Unified Documentation Experience**:
1. **Zero Setup Hosting**: Every published crate is built and hosted automatically on `https://docs.rs/<crate_name>/<version>`.
2. **Deep Cross-Linking**: Standard library types (`Option`, `Result`, `Vec`, `String`) and cross-crate types are automatically hyperlinked to their source definitions across `docs.rs`.
3. **Interactive Search & Source Viewing**: Instant type search (`S` key) and inline source code viewer (`[src]` button).
4. **Target Platform Builds**: Displays target-specific APIs (e.g. Linux vs Windows vs WASM methods).

### (2) Writing Documentation for `docs.rs`

```rust
/// A high-performance thread-safe buffer queue.
///
/// # Examples
///
/// ```
/// use my_crate::BufferQueue;
///
/// let mut queue = BufferQueue::new(10);
/// queue.push(42);
/// assert_eq!(queue.pop(), Some(42));
/// ```
pub struct BufferQueue {
    capacity: usize,
    data: Vec<i32>,
}

impl BufferQueue {
    /// Creates a new `BufferQueue` with specified capacity.
    pub fn new(capacity: usize) -> Self {
        BufferQueue { capacity, data: Vec::with_capacity(capacity) }
    }

    /// Pushes an item into the queue.
    pub fn push(&mut self, val: i32) {
        if self.data.len() < self.capacity {
            self.data.push(val);
        }
    }

    /// Pops an item from the queue.
    pub fn pop(&mut self) -> Option<i32> {
        self.data.pop()
    }
}
```

#### Configuring `docs.rs` in `Cargo.toml`

```toml
# Cargo.toml metadata to customize docs.rs builds
[package]
name = "my_crate"
version = "1.0.0"

[package.metadata.docs.rs]
all-features = true # Build docs with all crate features enabled on docs.rs
targets = ["x86_64-unknown-linux-gnu", "wasm32-unknown-unknown"]
rustdoc-args = ["--cfg", "docsrs"]
```

---

## 4. Common Mistakes & Pitfalls
### Mistake 2: Omitting `#![cfg_attr(docsrs, feature(doc_cfg))]` on Feature-Gated Items

**The mistake:** Using feature flags without documenting them for `docs.rs` visitors.

**Why it's wrong:** Users browsing `docs.rs` cannot tell which feature flags are required to use specific structs or methods.

*Fix:* Add `#![cfg_attr(docsrs, feature(doc_cfg))]` and `#[doc(cfg(feature = "..."))]` attributes.

### Mistake 3: Broken Intra-Doc Links Pointing to Private Symbols

**The mistake:** Referencing private structs or internal modules in public doc comments using `[`PrivateStruct`]`.

**Why it's wrong:** `docs.rs` builds with warning-as-error checks for broken intra-doc links, causing documentation builds to fail on publication.

*Fix:* Ensure all intra-doc markdown links point to publicly accessible API symbols.


### Mistake 1: Failing `docs.rs` Builds due to Missing Features

**The mistake:** Publishing a crate where default feature flags do not compile documentation properly.

*Fix:* Add `[package.metadata.docs.rs] all-features = true` in `Cargo.toml`.

---

## 5. Practice Exercises

### Exercise 1: Conditional Feature-Gated Documentation & `#[doc(cfg)]` Attributes

**Scenario:** **Problem Statement:**
You are developing an embedded sensor telemetry crate (`sensor-ring`) for `#![no_std]` microcontroller systems. The crate provides a fixed-capacity ring buffer for logging telemetry metrics. Some advanced hardware transports (such as SPI bus transmission) are conditionally compiled behind a Cargo feature flag (`spi-transport`).

**Requirements:**
When publishing to `docs.rs`, APIs gated behind features must be clearly rendered with feature requirement badges (e.g., *"This API requires feature `spi-transport`"*).

Implement the `TelemetryBuffer` struct with `#![no_std]` support, add conditional feature-gated methods decorated with `#[doc(cfg(feature = "spi-transport"))]`, configure Cargo metadata under `[package.metadata.docs.rs]`, and include unit tests verifying buffer operations and SPI transport features.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> //! Embedded telemetry ring buffer and transport driver.
> //!
> //! Provides a `#![no_std]` ring buffer for collecting sensor samples and transmitting
> //! them over hardware interfaces.
>
> #![no_std]
> #![cfg_attr(docsrs, feature(doc_cfg))]
>
> /// A fixed-capacity ring buffer for embedded telemetry data.
> ///
> /// # Examples
> ///
> /// ```
> /// use sensor_ring::TelemetryBuffer;
> ///
> /// let mut buf = TelemetryBuffer::<4>::new();
> /// assert!(buf.push(100).is_ok());
> /// assert_eq!(buf.pop(), Some(100));
> /// ```
> pub struct TelemetryBuffer<const N: usize> {
>     storage: [u32; N],
>     head: usize,
>     tail: usize,
>     len: usize,
> }
>
> impl<const N: usize> TelemetryBuffer<N> {
>     /// Creates a new, empty `TelemetryBuffer`.
>     pub const fn new() -> Self {
>         Self {
>             storage: [0; N],
>             head: 0,
>             tail: 0,
>             len: 0,
>         }
>     }
>
>     /// Pushes a new sensor sample into the buffer.
>     ///
>     /// Returns `Err(value)` if the buffer is full.
>     pub fn push(&mut self, value: u32) -> Result<(), u32> {
>         if self.len == N {
>             return Err(value);
>         }
>         self.storage[self.tail] = value;
>         self.tail = (self.tail + 1) % N;
>         self.len += 1;
>         Ok(())
>     }
>
>     /// Pops the oldest sample from the buffer.
>     pub fn pop(&mut self) -> Option<u32> {
>         if self.len == 0 {
>             return None;
>         }
>         let val = self.storage[self.head];
>         self.head = (self.head + 1) % N;
>         self.len -= 1;
>         Some(val)
>     }
>
>     /// Returns the current number of stored elements.
>     pub fn len(&self) -> usize {
>         self.len
>     }
>
>     /// Returns `true` if the buffer contains no elements.
>     pub fn is_empty(&self) -> bool {
>         self.len == 0
>     }
> }
>
> /// SPI transport extension methods for `TelemetryBuffer`.
> #[cfg(feature = "spi-transport")]
> #[doc(cfg(feature = "spi-transport"))]
> impl<const N: usize> TelemetryBuffer<N> {
>     /// Transmits all buffered telemetry samples over the SPI bus.
>     ///
>     /// # Errors
>     ///
>     /// Returns `Err(1)` if an invalid bus ID is provided.
>     pub fn transmit_spi(&mut self, bus_id: u8) -> Result<usize, u8> {
>         if bus_id == 0 {
>             return Err(1); // Invalid bus ID
>         }
>         let count = self.len;
>         self.head = 0;
>         self.tail = 0;
>         self.len = 0;
>         Ok(count)
>     }
> }
>
> #[cfg(test)]
> mod tests {
>     use super::*;
>
>     #[test]
>     fn test_buffer_push_pop_fifo() {
>         let mut buf = TelemetryBuffer::<3>::new();
>         assert!(buf.is_empty());
>         assert_eq!(buf.len(), 0);
>
>         assert_eq!(buf.push(10), Ok(()));
>         assert_eq!(buf.push(20), Ok(()));
>         assert_eq!(buf.push(30), Ok(()));
>         assert_eq!(buf.push(40), Err(40)); // Buffer full
>
>         assert_eq!(buf.len(), 3);
>         assert_eq!(buf.pop(), Some(10));
>         assert_eq!(buf.pop(), Some(20));
>
>         assert_eq!(buf.push(40), Ok(()));
>         assert_eq!(buf.pop(), Some(30));
>         assert_eq!(buf.pop(), Some(40));
>         assert_eq!(buf.pop(), None);
>         assert!(buf.is_empty());
>     }
>
>     #[cfg(feature = "spi-transport")]
>     #[test]
>     fn test_spi_transmission() {
>         let mut buf = TelemetryBuffer::<4>::new();
>         let _ = buf.push(100);
>         let _ = buf.push(200);
>
>         assert_eq!(buf.transmit_spi(0), Err(1)); // Invalid bus
>         assert_eq!(buf.transmit_spi(1), Ok(2)); // Transmitted 2 samples
>         assert!(buf.is_empty());
>     }
> }
> ```
>
> **Required `Cargo.toml` Configuration:**
> ```toml
> [package]
> name = "sensor-ring"
> version = "0.1.0"
> edition = "2021"
>
> [features]
> default = []
> spi-transport = []
>
> [package.metadata.docs.rs]
> all-features = true
> rustdoc-args = ["--cfg", "docsrs"]
> targets = ["x86_64-unknown-linux-gnu", "thumbv7em-none-eabihf"]
> ```
>
> #### Technical Explanation
>
> 1. **Feature Badging via `#[doc(cfg(...))]`**: Decorating conditional items with `#[doc(cfg(feature = "spi-transport"))]` tells `rustdoc` to render a visual badge in generated HTML documentation, clearly indicating to users that the API requires a specific feature flag.
> 2. **Conditional Attribute `#![cfg_attr(docsrs, feature(doc_cfg))]`**: Enables the nightly `doc_cfg` feature only when `docsrs` is defined, preventing compiler errors on stable Rust compilers when building locally without doc flags.
> 3. **`Cargo.toml` `docs.rs` Metadata**:
>    - `all-features = true`: Instructs `docs.rs` builders to pass `--all-features` during documentation builds so all feature-gated items and their badges are generated.
>    - `rustdoc-args = ["--cfg", "docsrs"]`: Sets the `docsrs` cfg flag during the `docs.rs` build pipeline, activating the `#![cfg_attr(docsrs, ...)]` attribute.
> 
---


## 6. Related Terms

- [`crates.io`](crates_io.md) — The package registry whose crates are documented on `docs.rs`.

---

## 7. Key Takeaways

- `docs.rs` automatically builds and hosts interactive HTML documentation for every crate on `crates.io`.
- Features deep cross-linking to standard library types and external crates.
- Write documentation using `///` triple-slash doc comments with embedded code examples (`/// ``` ... /// ````).
- Test documentation locally with `cargo doc --open`.
