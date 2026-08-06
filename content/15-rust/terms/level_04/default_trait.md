# `Default` Trait

> **Level 4 — Error Handling & Generics**
> Provides a default value via `Default::default()`.

---

## 1. Prerequisites


- [Trait](trait.md) — The contract being implemented.
- [Struct](../level_02/struct.md) — The primary target for default configurations.
- [Derive Macro](derive_macro.md) — How you get a "zeroed-out" default for free.

---

## 2. Term Category

**Rust-specific (the configuration generator)**: In many Object-Oriented languages, you use Constructors with optional arguments to create a standard, "default" object. Rust does not have optional function arguments, nor does it have traditional Constructors. The `Default` trait is Rust's universally accepted, idiomatic way of providing a base, zero-state configuration for an object.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Imagine you are building a UI library. You have a `WindowConfig` struct with 15 different fields (width, height, full_screen, title, color, font_size, etc.). 

99% of the time, users just want a standard window, but maybe they want to change the `title`. Because Rust strictly forces you to initialize *every single field* when instantiating a struct, the user would have to manually type out all 15 fields every single time they create a window. This is awful.

The `Default` trait solves this. It provides a standard `Default::default()` method that returns a sensible base configuration. You can then use the incredibly powerful **struct update syntax** (`..`) to say: *"Give me the default window, but override the title."*

### (2) Reality Metaphor

Imagine you are buying a car. 

You *could* build it entirely from scratch, specifying exactly what engine you want, what tires, what seats, and what steering wheel. But most people don't want to do that. 

Most people just walk into the dealership and say: *"Give me the standard factory model (`Default::default()`), but paint it red (`..` struct update syntax)."* The `Default` trait represents the manufacturer's standard factory configuration.

### (3) Rust Code Examples

#### Short Snippet (The Free Implementation)
When you use `#[derive(Default)]`, the compiler looks at every field in your struct and calls `.default()` on it. (For numbers, the default is `0`. For booleans, it's `false`. For Strings, it's `""`).

```rust
#[derive(Debug, Default)]
struct Player {
    name: String,   // Defaults to ""
    score: i32,     // Defaults to 0
    is_admin: bool, // Defaults to false
}

fn main() {
    // We get a fully instantiated struct for free!
    let new_player = Player::default();
    
    println!("{:?}", new_player); 
    // Output: Player { name: "", score: 0, is_admin: false }
}
```

#### Fuller Example (Manual Defaults & Struct Update Syntax)
If your standard window size should be `800x600` instead of `0x0`, you must implement `Default` manually. Then, you can use the magic `..` syntax to save massive amounts of typing.

```rust
#[derive(Debug)]
struct WindowConfig {
    width: u32,
    height: u32,
    title: String,
    fullscreen: bool,
}

// 1. Manually implement Default to provide sensible base values
impl Default for WindowConfig {
    fn default() -> Self {
        WindowConfig {
            width: 800,
            height: 600,
            title: String::from("My App"),
            fullscreen: false,
        }
    }
}

fn main() {
    // 2. We use the `..` struct update syntax!
    // This says: "Set the title to 'Custom', and fill in the rest of the 
    // fields using whatever WindowConfig::default() returns!"
    let my_window = WindowConfig {
        title: String::from("Custom App"),
        ..WindowConfig::default()
    };
    
    println!("{:#?}", my_window);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Default Trait Scoping and Lifecycle Rules

**The mistake:** Assuming Default Trait instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("default_trait_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("default_trait_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Default Trait State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Default Trait through an immutable reference `&T` or without specifying `mut` in variable declarations.

**Why it's wrong:** Rust's aliasing XOR mutability rule (`&T` for shared immutable access, `&mut T` for exclusive mutable access) prohibits mutating state through shared references unless interior mutability patterns (e.g. `RefCell`, `Mutex`) are explicitly used.

*Incorrect:*
```rust
fn update_val(data: &i32) {
    // *data += 1; // ❌ Error E0594: cannot assign to `*data`, which is behind a `&` reference
}
```

*Fix:*
```rust
fn update_val(data: &mut i32) {
    *data += 1; // Correct: exclusive mutable reference permits mutation
}
```

### Mistake 3: Concurrent Access to Default Trait Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Default Trait instances across OS threads via `std::thread::spawn`.

**Why it's wrong:** Types that do not implement `Send` or `Sync` marker traits cannot safely cross thread boundaries. The compiler prevents data races by raising compile errors `E0277` (`trait Send is not implemented`).

*Incorrect:*
```rust
use std::rc::Rc;
use std::thread;

let rc = Rc::new(42);
// thread::spawn(move || { println!("{}", rc); }); // ❌ Error E0277: `Rc` cannot be sent between threads safely
```

*Fix:*
```rust
use std::sync::Arc;
use std::thread;

let arc = Arc::new(42);
thread::spawn(move || {
    println!("{}", arc); // Correct: `Arc` implements `Send` and `Sync`
});
```

---

## 5. Practice Exercises

### Exercise 1: Multi-Tiered Database Connection Pool & Resiliency Options

**Scenario:**
You are building an enterprise-grade database driver. The client configuration requires nested settings for connection pool limits, retry backoff strategies, security options, and timeout thresholds.
1. Define an enum `RetryStrategy` with variants:
   - `ExponentialBackoff { initial_delay_ms: u64, max_delay_ms: u64, factor: f64 }`
   - `FixedDelay { delay_ms: u64 }`
   - `NoRetry`
   Implement `Default` for `RetryStrategy` manually so that the default variant is `ExponentialBackoff` with `initial_delay_ms: 100`, `max_delay_ms: 5000`, and `factor: 2.0`.
2. Define a struct `PoolLimits` with fields `max_connections: u32`, `min_idle_connections: u32`, and `idle_timeout_secs: u64`. Implement `Default` manually returning `max_connections: 32`, `min_idle_connections: 5`, and `idle_timeout_secs: 600`.
3. Define a struct `DbPoolConfig` with fields `connection_string: String`, `limits: PoolLimits`, `retry_strategy: RetryStrategy`, `enable_tls: bool`, and `connection_timeout_ms: u64`. Implement `Default` manually returning `"postgres://localhost:5432/production_db"`, `PoolLimits::default()`, `RetryStrategy::default()`, `enable_tls: true`, and `connection_timeout_ms: 5000`.
4. Demonstrate creating a custom configuration that overrides `connection_string` and `max_connections` using `..DbPoolConfig::default()` and `..PoolLimits::default()`. Write complete unit tests with explicit assertions (`assert_eq!`, `assert!`, `assert_ne!`, `matches!`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::fmt::Debug;
> 
> #[derive(Debug, PartialEq, Clone)]
> pub enum RetryStrategy {
>     ExponentialBackoff {
>         initial_delay_ms: u64,
>         max_delay_ms: u64,
>         factor: f64,
>     },
>     FixedDelay {
>         delay_ms: u64,
>     },
>     NoRetry,
> }
> 
> impl Default for RetryStrategy {
>     fn default() -> Self {
>         Self::ExponentialBackoff {
>             initial_delay_ms: 100,
>             max_delay_ms: 5000,
>             factor: 2.0,
>         }
>     }
> }
> 
> #[derive(Debug, PartialEq, Clone)]
> pub struct PoolLimits {
>     pub max_connections: u32,
>     pub min_idle_connections: u32,
>     pub idle_timeout_secs: u64,
> }
> 
> impl Default for PoolLimits {
>     fn default() -> Self {
>         Self {
>             max_connections: 32,
>             min_idle_connections: 5,
>             idle_timeout_secs: 600,
>         }
>     }
> }
> 
> #[derive(Debug, PartialEq, Clone)]
> pub struct DbPoolConfig {
>     pub connection_string: String,
>     pub limits: PoolLimits,
>     pub retry_strategy: RetryStrategy,
>     pub enable_tls: bool,
>     pub connection_timeout_ms: u64,
> }
> 
> impl Default for DbPoolConfig {
>     fn default() -> Self {
>         Self {
>             connection_string: String::from("postgres://localhost:5432/production_db"),
>             limits: PoolLimits::default(),
>             retry_strategy: RetryStrategy::default(),
>             enable_tls: true,
>             connection_timeout_ms: 5000,
>         }
>     }
> }
> 
> impl DbPoolConfig {
>     pub fn new(connection_string: impl Into<String>) -> Self {
>         Self {
>             connection_string: connection_string.into(),
>             ..Self::default()
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_default_config_values() {
>         let config = DbPoolConfig::default();
>         assert_eq!(config.connection_string, "postgres://localhost:5432/production_db");
>         assert_eq!(config.limits.max_connections, 32);
>         assert_eq!(config.limits.min_idle_connections, 5);
>         assert_eq!(config.connection_timeout_ms, 5000);
>         assert!(config.enable_tls);
>         assert_ne!(config.limits.max_connections, 0);
> 
>         assert!(matches!(
>             config.retry_strategy,
>             RetryStrategy::ExponentialBackoff {
>                 initial_delay_ms: 100,
>                 max_delay_ms: 5000,
>                 factor: _
>             }
>         ));
>     }
> 
>     #[test]
>     fn test_struct_update_overrides() {
>         let custom_config = DbPoolConfig {
>             connection_string: String::from("postgres://cluster.internal:5432/analytics"),
>             limits: PoolLimits {
>                 max_connections: 100,
>                 ..PoolLimits::default()
>             },
>             retry_strategy: RetryStrategy::FixedDelay { delay_ms: 500 },
>             ..DbPoolConfig::default()
>         };
> 
>         assert_eq!(custom_config.connection_string, "postgres://cluster.internal:5432/analytics");
>         assert_eq!(custom_config.limits.max_connections, 100);
>         assert_eq!(custom_config.limits.min_idle_connections, 5);
>         assert!(custom_config.enable_tls);
>         assert_ne!(custom_config.connection_string, DbPoolConfig::default().connection_string);
> 
>         assert!(matches!(
>             custom_config.retry_strategy,
>             RetryStrategy::FixedDelay { delay_ms: 500 }
>         ));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Manual Default Implementation vs. Derive**:
>    While `#[derive(Default)]` fills fields with type-level zero values (`0`, `""`, `false`), domain types such as database connection pools require operational defaults (e.g. non-zero ports, pool limits, and default connection strings). Implementing `Default` manually allows establishing domain-valid base configurations.
> 
> 2. **Composition & Nested Default Resolution**:
>    `DbPoolConfig::default()` delegates field initialization to `PoolLimits::default()` and `RetryStrategy::default()`. This maintains modularity and ensures that defaults for nested types stay synchronized across all parent configurations.
> 
> 3. **Struct Update Syntax (`..`) Mechanics**:
>    The expression `..DbPoolConfig::default()` evaluates `DbPoolConfig::default()` to produce a temporary value. Fields explicitly specified in the struct literal are initialized directly, while remaining unmentioned fields move or copy values from the default instance. Because `Default::default()` is a plain function returning `Self` on the stack, struct update syntax incurs zero dynamic dispatch overhead.
> 
> 4. **Monomorphization & Invariants**:
>    The helper method `new(connection_string: impl Into<String>)` monomorphizes at compile time for any type converting into a `String` (such as `&str` or `String`). Struct fields remain strictly owned, avoiding dangling lifetime references (`E0515`).

---

### Exercise 2: Recyclable Packet Buffer Manager with Const Generics & Default Reset

**Scenario:**
In high-performance networking pipelines, allocating new packet buffers for every incoming payload incurs memory fragmentation and allocator contention. Buffer pools pre-allocate storage and recycle dirty slots by resetting slot state using `T::default()`.
1. Define a `PacketSlot` struct representing a network packet header:
   - `header_flags: u8`
   - `payload_len: usize`
   - `checksum: u32`
   - `payload: [u8; 64]`
   Derive or manually implement `Default`, `Copy`, `Clone`, `Debug`, and `PartialEq` for `PacketSlot` (default header flags `0`, payload len `0`, checksum `0`, empty array).
2. Define a generic struct `RecycledBuffer<T, const CAP: usize>` containing:
   - `slots: [T; CAP]`
   - `active_len: usize`
   Implement `Default` for `RecycledBuffer<T, const CAP: usize>` where `T: Default + Copy`.
3. Provide methods:
   - `push(&mut self, item: T) -> Result<usize, &'static str>` to place an item into the buffer.
   - `reset_slot(&mut self, index: usize) -> Result<(), &'static str>` which resets the targeted slot at `index` to `T::default()`.
   - `reset_all(&mut self)` which resets every slot to `T::default()` and resets `active_len` to `0`.
4. Write unit tests verifying zero-allocation slot recycling, dirty data mutation, capacity overflow guards, and assertions (`assert_eq!`, `assert!`, `assert_ne!`, `matches!`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::fmt::Debug;
> 
> #[derive(Debug, Clone, Copy, PartialEq)]
> pub struct PacketSlot {
>     pub header_flags: u8,
>     pub payload_len: usize,
>     pub checksum: u32,
>     pub payload: [u8; 64],
> }
> 
> impl Default for PacketSlot {
>     fn default() -> Self {
>         Self {
>             header_flags: 0,
>             payload_len: 0,
>             checksum: 0,
>             payload: [0; 64],
>         }
>     }
> }
> 
> #[derive(Debug, Clone, PartialEq)]
> pub struct RecycledBuffer<T, const CAP: usize> {
>     pub slots: [T; CAP],
>     pub active_len: usize,
> }
> 
> impl<T: Default + Copy, const CAP: usize> Default for RecycledBuffer<T, const CAP: usize> {
>     fn default() -> Self {
>         Self {
>             slots: [T::default(); CAP],
>             active_len: 0,
>         }
>     }
> }
> 
> impl<T: Default + Copy, const CAP: usize> RecycledBuffer<T, const CAP: usize> {
>     pub fn push(&mut self, item: T) -> Result<usize, &'static str> {
>         if self.active_len >= CAP {
>             return Err("Buffer capacity reached");
>         }
>         let index = self.active_len;
>         self.slots[index] = item;
>         self.active_len += 1;
>         Ok(index)
>     }
> 
>     pub fn reset_slot(&mut self, index: usize) -> Result<(), &'static str> {
>         if index >= CAP {
>             return Err("Index out of bounds");
>         }
>         self.slots[index] = T::default();
>         Ok(())
>     }
> 
>     pub fn reset_all(&mut self) {
>         for slot in self.slots.iter_mut() {
>             *slot = T::default();
>         }
>         self.active_len = 0;
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_buffer_default_initialization() {
>         let buf: RecycledBuffer<PacketSlot, 4> = RecycledBuffer::default();
>         assert_eq!(buf.active_len, 0);
>         assert_eq!(buf.slots.len(), 4);
>         assert_eq!(buf.slots[0].header_flags, 0);
>         assert_eq!(buf.slots[0].checksum, 0);
>         assert!(matches!(buf.slots[0].payload_len, 0));
>     }
> 
>     #[test]
>     fn test_push_and_reset_slot() {
>         let mut buf: RecycledBuffer<PacketSlot, 4> = RecycledBuffer::default();
> 
>         let dirty_packet = PacketSlot {
>             header_flags: 0xFF,
>             payload_len: 32,
>             checksum: 0xDEADBEEF,
>             payload: [1; 64],
>         };
> 
>         let idx = buf.push(dirty_packet).unwrap();
>         assert_eq!(idx, 0);
>         assert_eq!(buf.active_len, 1);
>         assert_eq!(buf.slots[0].checksum, 0xDEADBEEF);
>         assert_ne!(buf.slots[0], PacketSlot::default());
> 
>         buf.reset_slot(0).unwrap();
>         assert_eq!(buf.slots[0], PacketSlot::default());
>         assert_eq!(buf.slots[0].checksum, 0);
>     }
> 
>     #[test]
>     fn test_reset_all_recycling() {
>         let mut buf: RecycledBuffer<PacketSlot, 2> = RecycledBuffer::default();
>         let dirty = PacketSlot {
>             header_flags: 0x01,
>             payload_len: 16,
>             checksum: 42,
>             payload: [2; 64],
>         };
> 
>         assert!(buf.push(dirty).is_ok());
>         assert!(buf.push(dirty).is_ok());
>         let push_res = buf.push(dirty);
>         assert!(push_res.is_err());
>         assert!(matches!(push_res, Err("Buffer capacity reached")));
> 
>         assert_eq!(buf.active_len, 2);
>         buf.reset_all();
>         assert_eq!(buf.active_len, 0);
>         assert_eq!(buf.slots[0], PacketSlot::default());
>         assert_eq!(buf.slots[1], PacketSlot::default());
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Generic Bounds & Array Repeat Expressions**:
>    The implementation of `Default` for `RecycledBuffer<T, const CAP: usize>` uses array repeat syntax `[T::default(); CAP]`. In Rust, initializing a generic array with repeat syntax requires `T` to implement `Copy` so the compiler can duplicate the bit representation of the default element across all `CAP` array elements at compile time.
> 
> 2. **Const Generics & Monomorphization**:
>    `const CAP: usize` allows array size to be specified as a compile-time constant. Rust monomorphizes `RecycledBuffer` for every distinct tuple `(T, CAP)`, embedding the exact byte size on the stack and eliminating heap allocation during slot creation or clearing.
> 
> 3. **Memory Safety & Reset Invariants**:
>    Resetting a slot via `*slot = T::default()` replaces the existing instance with a pristine zero/default value. If `T` owned heap data (e.g. `String` or `Vec`), Rust's assignment operator would automatically drop the prior value before writing the new `T::default()` instance into the slot location, preventing memory leaks (`E0509`/`E0507`).

---

### Exercise 3: Distributed Tracing Context Extraction with Default Fallbacks & Context Propagation

**Scenario:**
Microservice API gateways inspect incoming HTTP headers to extract distributed tracing metadata (`SpanContext`). If incoming requests lack tracing headers, the system must fall back to safe default identifiers and sampling decisions using `Default::default()` or `Option::unwrap_or_default()`, while supporting parent-to-child span propagation.
1. Define an enum `SamplingDecision`:
   - `#[default] Sampled`
   - `NotSampled`
   - `Deferred`
   Derive `Default`, `Debug`, `PartialEq`, `Eq`, `Clone`, `Copy`.
2. Define a struct `SpanContext`:
   - `trace_id: String` (default `"00000000000000000000000000000000"`)
   - `span_id: String` (default `"0000000000000000"`)
   - `sampling: SamplingDecision` (default `SamplingDecision::default()`)
   - `baggage: std::collections::HashMap<String, String>` (default empty map)
   Implement `Default` manually.
3. Provide methods:
   - `extract_from_headers(headers: &std::collections::HashMap<String, String>) -> Self` which parses `"x-trace-id"`, `"x-span-id"`, `"x-sampled"`, and any `"x-baggage-*"` keys. Missing trace or span ID headers must fall back to default values via `SpanContext::default()`.
   - `child_span(&self, new_span_id: String) -> Self` which produces a new span inheriting `trace_id`, `sampling`, and `baggage` from `self` while updating `span_id`.
4. Write unit tests verifying header parsing, fallback behavior when headers are missing, default span creation, child context inheritance, and assertions (`assert_eq!`, `assert!`, `assert_ne!`, `matches!`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::HashMap;
> 
> #[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
> pub enum SamplingDecision {
>     #[default]
>     Sampled,
>     NotSampled,
>     Deferred,
> }
> 
> #[derive(Debug, Clone, PartialEq)]
> pub struct SpanContext {
>     pub trace_id: String,
>     pub span_id: String,
>     pub sampling: SamplingDecision,
>     pub baggage: HashMap<String, String>,
> }
> 
> impl Default for SpanContext {
>     fn default() -> Self {
>         Self {
>             trace_id: String::from("00000000000000000000000000000000"),
>             span_id: String::from("0000000000000000"),
>             sampling: SamplingDecision::default(),
>             baggage: HashMap::new(),
>         }
>     }
> }
> 
> impl SpanContext {
>     pub fn extract_from_headers(headers: &HashMap<String, String>) -> Self {
>         let default_ctx = Self::default();
> 
>         let trace_id = headers
>             .get("x-trace-id")
>             .cloned()
>             .unwrap_or(default_ctx.trace_id);
> 
>         let span_id = headers
>             .get("x-span-id")
>             .cloned()
>             .unwrap_or(default_ctx.span_id);
> 
>         let sampling = headers
>             .get("x-sampled")
>             .map(|val| match val.to_lowercase().as_str() {
>                 "true" | "1" => SamplingDecision::Sampled,
>                 "false" | "0" => SamplingDecision::NotSampled,
>                 _ => SamplingDecision::Deferred,
>             })
>             .unwrap_or_default();
> 
>         let mut baggage = HashMap::new();
>         for (k, v) in headers {
>             if let Some(baggage_key) = k.strip_prefix("x-baggage-") {
>                 baggage.insert(baggage_key.to_string(), v.clone());
>             }
>         }
> 
>         Self {
>             trace_id,
>             span_id,
>             sampling,
>             baggage,
>         }
>     }
> 
>     pub fn child_span(&self, new_span_id: String) -> Self {
>         Self {
>             trace_id: self.trace_id.clone(),
>             span_id: new_span_id,
>             sampling: self.sampling,
>             baggage: self.baggage.clone(),
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_span_context_default() {
>         let ctx = SpanContext::default();
>         assert_eq!(ctx.trace_id, "00000000000000000000000000000000");
>         assert_eq!(ctx.span_id, "0000000000000000");
>         assert!(matches!(ctx.sampling, SamplingDecision::Sampled));
>         assert!(ctx.baggage.is_empty());
>         assert_ne!(ctx.trace_id, "");
>     }
> 
>     #[test]
>     fn test_extract_full_headers() {
>         let mut headers = HashMap::new();
>         headers.insert("x-trace-id".to_string(), "4bf92f3577b34da6a3ce929d0e0e4736".to_string());
>         headers.insert("x-span-id".to_string(), "00f067aa0ba902b7".to_string());
>         headers.insert("x-sampled".to_string(), "false".to_string());
>         headers.insert("x-baggage-user-id".to_string(), "usr_9981".to_string());
> 
>         let ctx = SpanContext::extract_from_headers(&headers);
>         assert_eq!(ctx.trace_id, "4bf92f3577b34da6a3ce929d0e0e4736");
>         assert_eq!(ctx.span_id, "00f067aa0ba902b7");
>         assert!(matches!(ctx.sampling, SamplingDecision::NotSampled));
>         assert_eq!(ctx.baggage.get("user-id"), Some(&"usr_9981".to_string()));
>         assert_ne!(ctx.trace_id, SpanContext::default().trace_id);
>     }
> 
>     #[test]
>     fn test_extract_missing_headers_fallback() {
>         let headers = HashMap::new();
>         let ctx = SpanContext::extract_from_headers(&headers);
> 
>         assert_eq!(ctx.trace_id, SpanContext::default().trace_id);
>         assert_eq!(ctx.span_id, SpanContext::default().span_id);
>         assert!(matches!(ctx.sampling, SamplingDecision::Sampled));
>         assert!(ctx.baggage.is_empty());
>     }
> 
>     #[test]
>     fn test_child_span_propagation() {
>         let mut parent = SpanContext::default();
>         parent.trace_id = "abc-123-trace".to_string();
>         parent.baggage.insert("tenant".to_string(), "acme_corp".to_string());
> 
>         let child = parent.child_span("child-456".to_string());
> 
>         assert_eq!(child.trace_id, "abc-123-trace");
>         assert_eq!(child.span_id, "child-456");
>         assert_ne!(child.span_id, parent.span_id);
>         assert_eq!(child.sampling, parent.sampling);
>         assert_eq!(child.baggage.get("tenant"), Some(&"acme_corp".to_string()));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Enum `#[default]` Macro Attribute (Rust 1.62+)**:
>    `SamplingDecision` uses `#[derive(Default)]` combined with `#[default]` on variant `Sampled`. This generates a `Default::default()` implementation returning `SamplingDecision::Sampled` without requiring manual boilerplate implementation blocks.
> 
> 2. **Combining `Option::unwrap_or_default()` and `Default`**:
>    `Option<T>::unwrap_or_default()` returns `T::default()` when the `Option` is `None`. For `sampling`, mapping missing or unknown header values to `Option::None` allows invoking `.unwrap_or_default()`, automatically invoking `SamplingDecision::default()`.
> 
> 3. **Ownership, Cloning, and Context Inheritance**:
>    `child_span` clones the `trace_id`, `sampling`, and `baggage` map from `&self` while replacing `span_id`. Standard ownership rules apply: string allocations created during extraction are owned by `SpanContext`, ensuring context survival across asynchronous microservice tasks without dangling references (`E0597`).

---

## 6. Related Terms


- [Derive Macro](derive_macro.md) — How you get `Default` for free (which recursively zeroes out all fields).
- [`Option<T>`](../level_02/option_t.md) — Another way to handle missing data. Interestingly, `Option::None` is actually the `Default` value for an `Option`!
- [Entry API (`.entry(k).or_insert(...)`)](../level_02/entry_api.md) — Related concept: Entry API (`.entry(k).or_insert(...)`).
- [`std::mem` Utilities (`replace`, `take`, `swap`, `drop`)](../level_03/std_mem_utilities.md) — Related concept: `std::mem` Utilities (`replace`, `take`, `swap`, `drop`).
- [Builder Pattern](../level_18/builder_pattern.md) — Related concept: Builder Pattern.

---

## 7. Key Takeaways

- The `Default` trait provides a standard way to create an "empty" or "base" version of a type via `MyType::default()`.
- You can derive it (`#[derive(Default)]`), which will recursively call `.default()` on every single field (integers become `0`, Strings become `""`, booleans become `false`).
- You implement it manually when the "base" configuration shouldn't just be zeroes (like setting a default volume level to `50` instead of `0`).
- It pairs beautifully with the **`..` struct update syntax** to let you override just one or two fields of a massive struct while keeping the defaults for the rest.
