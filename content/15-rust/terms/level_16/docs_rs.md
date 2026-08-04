# `docs.rs`

> **Level 16 — Ecosystem & Tooling**
> The official, open-source documentation hosting service for the Rust ecosystem (`docs.rs`) — automatically building and hosting beautiful, cross-linked HTML API documentation for every crate published to `crates.io`.

---

## 1. Prerequisites

- [Documentation Comments](../level_07/documentation_comments.md) — Triple-slash `///` doc comments parsed by `docs.rs`.
- [Cargo CLI (`cargo`)](../level_07/cargo_cli.md) — Local documentation generator (`cargo doc --open`).

---

## 2. Term Category

**Ecosystem / Documentation / Tooling**: `docs.rs` is Rust's centralized documentation platform. Whenever a developer publishes a crate version to `crates.io`, a background `docs.rs` builder automatically runs `cargo doc` for all target platforms, hosting fully searchable, interactive HTML documentation at `https://docs.rs/<crate_name>`.

---

## 3. Environment Context

**Universal Web Platform**: Accessible via browser for any Rust crate published to `crates.io`.

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

### Mistake 1: Failing `docs.rs` Builds due to Missing Features

**The mistake:** Publishing a crate where default feature flags do not compile documentation properly.

*Fix:* Add `[package.metadata.docs.rs] all-features = true` in `Cargo.toml`.

---

## 6. Practice Exercises

### Exercise 1: Conditional Feature-Gated Documentation & `#[doc(cfg)]` Attributes

**Problem Statement:**
You are developing an embedded sensor telemetry crate (`sensor-ring`) for `#![no_std]` microcontroller systems. The crate provides a fixed-capacity ring buffer for logging telemetry metrics. Some advanced hardware transports (such as SPI bus transmission) are conditionally compiled behind a Cargo feature flag (`spi-transport`).

When publishing to `docs.rs`, APIs gated behind features must be clearly rendered with feature requirement badges (e.g., *"This API requires feature `spi-transport`"*).

Implement the `TelemetryBuffer` struct with `#![no_std]` support, add conditional feature-gated methods decorated with `#[doc(cfg(feature = "spi-transport"))]`, configure Cargo metadata under `[package.metadata.docs.rs]`, and include unit tests verifying buffer operations and SPI transport features.

> [!check]- Answer
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
> **Explanation:**
> 1. **Feature Badging via `#[doc(cfg(...))]`**: Decorating conditional items with `#[doc(cfg(feature = "spi-transport"))]` tells `rustdoc` to render a visual badge in generated HTML documentation, clearly indicating to users that the API requires a specific feature flag.
> 2. **Conditional Attribute `#![cfg_attr(docsrs, feature(doc_cfg))]`**: Enables the nightly `doc_cfg` feature only when `docsrs` is defined, preventing compiler errors on stable Rust compilers when building locally without doc flags.
> 3. **`Cargo.toml` `docs.rs` Metadata**:
>    - `all-features = true`: Instructs `docs.rs` builders to pass `--all-features` during documentation builds so all feature-gated items and their badges are generated.
>    - `rustdoc-args = ["--cfg", "docsrs"]`: Sets the `docsrs` cfg flag during the `docs.rs` build pipeline, activating the `#![cfg_attr(docsrs, ...)]` attribute.

---

## 7. Key Takeaways

- `docs.rs` automatically builds and hosts interactive HTML documentation for every crate on `crates.io`.
- Features deep cross-linking to standard library types and external crates.
- Write documentation using `///` triple-slash doc comments with embedded code examples (`/// ``` ... /// ````).
- Test documentation locally with `cargo doc --open`.
