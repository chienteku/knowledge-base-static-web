# `todo!` / `unimplemented!` / `unreachable!`

> **Level 4 — Error Handling & Generics**
> Diverging macros (type `!`) for stubbing unfinished code or asserting a branch is impossible.

---

## 1. Prerequisites


- [`panic!` Macro](panic.md) — The mechanism all three of these macros are built on.
- [Never Type (`!`)](../level_11/never_type.md) — The type that lets these macros type-check anywhere a value is expected.
- [`match`](../level_02/match.md) — Where `unreachable!()` is most commonly used, in a provably-impossible arm.

---

## 2. Term Category

**Diverging Macros (the placeholder-panic family)**: All three macros immediately panic when executed, just like `panic!`, but each communicates a **different intent** to both the compiler and future readers of the code — "not written yet," "deliberately not supported," or "this can genuinely never happen."

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Rust requires every function to satisfy its declared return type and every `match` to be exhaustive — you can't just leave a function body empty or skip a `match` arm while you're still figuring out the implementation. Rather than forcing you to write a fake, misleading placeholder value (`return 0; // TODO: fix this`) just to satisfy the type checker, these three macros let you write code that **compiles cleanly** (since they evaluate to the [never type](../level_11/never_type.md), which coerces to *any* expected type) while still panicking loudly and immediately if that specific path is ever actually executed. The three names exist specifically to encode *why* a given panic point is there, which both documents intent for human readers and, in the case of tools like Clippy, enables different static analysis (e.g. distinguishing "known incomplete" from "logically impossible").

### (2) Reality Metaphor

Imagine three different kinds of "under construction" signs a contractor might post around a building site.

- **`todo!()`**: A sign reading "Room not yet built — come back later." It's an honest placeholder for work that's clearly still coming.
- **`unimplemented!()`**: A sign reading "This wing was intentionally left out of this version of the building — not planned for now." Similar to `todo!`, but often used to mean "not needed yet, possibly never," rather than "actively being worked on."
- **`unreachable!()`**: A sign posted on a door that, according to the building's own blueprints, **cannot possibly exist** — if anyone ever actually opens that door, it means the blueprints themselves were wrong somewhere, and the contractor wants to be alerted immediately and loudly, not have someone quietly wander through.

### (3) Rust Code Examples

#### Short Snippet (Stubbing Out Work in Progress)
```rust
fn calculate_discount(user_tier: &str) -> f64 {
    match user_tier {
        "gold" => 0.20,
        "silver" => 0.10,
        "bronze" => todo!("bronze tier pricing not decided yet"), // Compiles! Panics only if CALLED.
        _ => 0.0,
    }
}

fn main() {
    println!("{}", calculate_discount("gold")); // 0.2 — fine, doesn't touch the todo!().
    // calculate_discount("bronze"); // Would panic: "not yet implemented: bronze tier pricing not decided yet"
}
```

#### Fuller Example (`unreachable!()` in a Provably-Exhaustive Match)
```rust
enum Direction { North, South, East, West }

fn opposite(dir: Direction) -> Direction {
    use Direction::*;
    match dir {
        North => South,
        South => North,
        East => West,
        West => East,
    }
}

fn angle_degrees(dir: &Direction) -> u32 {
    use Direction::*;
    let base = match dir {
        North => 0,
        East => 90,
        South => 180,
        West => 270,
    };
    // Suppose external validation elsewhere GUARANTEES base is always one of these four values.
    match base {
        0 | 90 | 180 | 270 => base,
        _ => unreachable!("angle should always be a multiple of 90, got {base}"),
    }
}

fn main() {
    println!("{}", angle_degrees(&Direction::East)); // 90
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Todo Unimplemented Unreachable Scoping and Lifecycle Rules

**The mistake:** Assuming Todo Unimplemented Unreachable instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("todo_unimplemented_unreachable_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("todo_unimplemented_unreachable_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Todo Unimplemented Unreachable State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Todo Unimplemented Unreachable through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Todo Unimplemented Unreachable Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Todo Unimplemented Unreachable instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Multi-Version Telemetry Protocol Engine (`todo!` vs `unimplemented!`)

**Problem Statement:**
You are architecture lead for a network telemetry pipeline processing sensor metric payloads. The system defines a generic codec trait `ProtocolCodec<T>` designed to support three protocol generations:
1. `encode_v2`: Standard production encoding format. Serializes `TelemetryPayload` (`sensor_id: u32`, `temperature: f64`) into a formatted byte string (`SENSOR:<id>:TEMP:<val>`).
2. `encode_v1`: Legacy v1 binary format has been retired and is permanently unsupported in modern builds. Invoking it must panic using `unimplemented!()` with a descriptive deprecation message.
3. `encode_v3`: Next-gen binary format for QUIC protocol transport, scheduled for a future release. Invoking it must panic using `todo!()` with a roadmap message.

Implement the types, trait, and `TelemetryCodec` struct. Write unit tests using `#[cfg(test)] mod tests` that verify successful `v2` encoding with explicit assertions (`assert!`, `assert_eq!`, `assert_ne!`) and verify `v1` and `v3` panic behavior using `std::panic::catch_unwind` with `matches!`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::panic::catch_unwind;
>
> #[derive(Debug, Clone, PartialEq)]
> pub struct TelemetryPayload {
>     pub sensor_id: u32,
>     pub temperature: f64,
> }
>
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub enum ProtocolVersion {
>     V1Legacy,
>     V2Production,
>     V3Experimental,
> }
>
> pub trait ProtocolCodec<T> {
>     fn encode_v2(&self, payload: &T) -> Result<Vec<u8>, String>;
>     fn encode_v1(&self, payload: &T) -> Vec<u8>;
>     fn encode_v3(&self, payload: &T) -> Vec<u8>;
> }
>
> pub struct TelemetryCodec;
>
> impl ProtocolCodec<TelemetryPayload> for TelemetryCodec {
>     fn encode_v2(&self, payload: &TelemetryPayload) -> Result<Vec<u8>, String> {
>         let formatted = format!("SENSOR:{}:TEMP:{:.2}", payload.sensor_id, payload.temperature);
>         Ok(formatted.into_bytes())
>     }
>
>     fn encode_v1(&self, _payload: &TelemetryPayload) -> Vec<u8> {
>         unimplemented!("V1 legacy protocol encoding is permanently deprecated and unsupported");
>     }
>
>     fn encode_v3(&self, _payload: &TelemetryPayload) -> Vec<u8> {
>         todo!("V3 binary framing support scheduled for QUIC protocol release");
>     }
> }
>
> #[cfg(test)]
> mod tests {
>     use super::*;
>
>     #[test]
>     fn test_v2_encoding_success() {
>         let codec = TelemetryCodec;
>         let payload = TelemetryPayload {
>             sensor_id: 101,
>             temperature: 36.6,
>         };
>
>         let result = codec.encode_v2(&payload);
>         assert!(result.is_ok());
>
>         let bytes = result.unwrap();
>         let encoded_str = String::from_utf8(bytes).unwrap();
>         assert_eq!(encoded_str, "SENSOR:101:TEMP:36.60");
>         assert_ne!(encoded_str, "INVALID");
>     }
>
>     #[test]
>     fn test_v1_unimplemented_panic() {
>         let codec = TelemetryCodec;
>         let payload = TelemetryPayload {
>             sensor_id: 101,
>             temperature: 36.6,
>         };
>
>         let result = catch_unwind(|| {
>             codec.encode_v1(&payload);
>         });
>
>         assert!(result.is_err());
>         let panic_err = result.unwrap_err();
>         let message = panic_err
>             .downcast_ref::<&str>()
>             .cloned()
>             .or_else(|| panic_err.downcast_ref::<String>().map(|s| s.as_str()))
>             .unwrap_or("");
>
>         assert!(message.contains("V1 legacy protocol encoding is permanently deprecated"));
>     }
>
>     #[test]
>     fn test_v3_todo_panic() {
>         let codec = TelemetryCodec;
>         let payload = TelemetryPayload {
>             sensor_id: 101,
>             temperature: 36.6,
>         };
>
>         let result = catch_unwind(|| {
>             codec.encode_v3(&payload);
>         });
>
>         assert!(result.is_err());
>         let panic_err = result.unwrap_err();
>         let message = panic_err
>             .downcast_ref::<&str>()
>             .cloned()
>             .or_else(|| panic_err.downcast_ref::<String>().map(|s| s.as_str()))
>             .unwrap_or("");
>
>         assert!(message.contains("V3 binary framing support scheduled for QUIC"));
>         assert!(matches!(codec.encode_v2(&payload), Ok(_)));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
>
> 1. **Diverging Macro Type Systems (`!` Type)**: `encode_v1` and `encode_v3` declare `Vec<u8>` as their return type. Both `unimplemented!()` and `todo!()` expand to expressions that evaluate to the never type (`!`). Because `!` coerces to any valid Rust type, the function signatures pass compiler type checking without dummy initializers (e.g. `Vec::new()`).
> 2. **Semantic Intent & Linting**: Using `unimplemented!()` explicitly signals to static analysis tools and code reviewers that feature v1 was deliberately omitted due to deprecation. In contrast, `todo!()` signals incomplete work-in-progress, enabling linter checks (like `clippy::todo`) to prevent unfinished code from reaching release binaries.
> 3. **Generic Monomorphization & Lifetime Safety**: `ProtocolCodec<T>` uses generic parameter `T`. When monomorphized with `TelemetryPayload`, references `&TelemetryPayload` are shared immutably (`&self`, `&payload`), adhering to Rust's borrow checker rules without incurring allocation or dynamic vtable overhead.
> 4. **Panic Isolation in Testing**: `std::panic::catch_unwind` wraps the execution boundary in a `Result<R, Box<dyn Any + Send>>`. This catches thread unwinding triggered by `unimplemented!` and `todo!`, allowing unit tests to assert panic occurrence and inspect message contents via downcasting without terminating test execution.

---

### Exercise 2: Financial Matching Engine & Invariant Enforcement (`unreachable!`)

**Problem Statement:**
In an enterprise high-frequency trading matching engine, incoming order commands (`NewOrder`, `CancelOrder`, `Heartbeat`) are dispatched to an execution handler `OrderProcessor::process_active_order`.
- State invariant: `process_active_order` requires that the trading session is in `SessionState::Active`. An upstream validator gates execution so non-active states never enter this path.
- Implementation requirement: If non-active states (`Connecting`, `Authenticated`, `Terminated`) ever bypass the gatekeeper due to a logic bug, the engine must immediately panic via `unreachable!("Session state invariant broken: process_active_order called with non-active state {:?}", session)` rather than returning dummy error codes or silently continuing.
- Process active orders matching:
  - `NewOrder { order_id, amount }`: Returns `Ok("EXECUTED:<order_id>:<amount>")`.
  - `CancelOrder { order_id }`: Returns `Ok("CANCELLED:<order_id>")`.
  - `Heartbeat`: Returns `Err("Heartbeat ignored in execution engine")`.

Implement `OrderProcessor` and unit tests in `#[cfg(test)] mod tests` verifying valid order execution with `assert_eq!`, `assert!`, `assert_ne!`, and `matches!`, and verifying that invariant breaches trigger an `unreachable!` panic caught via `catch_unwind`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::panic::catch_unwind;
>
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub enum SessionState {
>     Connecting,
>     Authenticated,
>     Active,
>     Terminated,
> }
>
> impl SessionState {
>     pub fn is_active(&self) -> bool {
>         matches!(self, SessionState::Active)
>     }
> }
>
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub enum OrderCommand {
>     NewOrder { order_id: u64, amount: u64 },
>     CancelOrder { order_id: u64 },
>     Heartbeat,
> }
>
> pub struct OrderProcessor;
>
> impl OrderProcessor {
>     pub fn process_active_order(
>         session: SessionState,
>         command: OrderCommand,
>     ) -> Result<String, String> {
>         // Structural invariant check guaranteed by upstream gatekeeper
>         if !session.is_active() {
>             unreachable!(
>                 "Session state invariant broken: process_active_order called with non-active state {:?}",
>                 session
>             );
>         }
>
>         match command {
>             OrderCommand::NewOrder { order_id, amount } => {
>                 Ok(format!("EXECUTED:{order_id}:{amount}"))
>             }
>             OrderCommand::CancelOrder { order_id } => {
>                 Ok(format!("CANCELLED:{order_id}"))
>             }
>             OrderCommand::Heartbeat => Err("Heartbeat ignored in execution engine".to_string()),
>         }
>     }
> }
>
> #[cfg(test)]
> mod tests {
>     use super::*;
>
>     #[test]
>     fn test_valid_active_orders() {
>         let session = SessionState::Active;
>
>         let new_cmd = OrderCommand::NewOrder {
>             order_id: 1001,
>             amount: 500,
>         };
>         let res_new = OrderProcessor::process_active_order(session, new_cmd);
>         assert!(res_new.is_ok());
>         assert_eq!(res_new.unwrap(), "EXECUTED:1001:500");
>
>         let cancel_cmd = OrderCommand::CancelOrder { order_id: 1001 };
>         let res_cancel = OrderProcessor::process_active_order(session, cancel_cmd);
>         assert!(res_cancel.is_ok());
>         assert_ne!(res_cancel.as_ref().unwrap(), "EXECUTED:1001:500");
>
>         let hb_cmd = OrderCommand::Heartbeat;
>         let res_hb = OrderProcessor::process_active_order(session, hb_cmd);
>         assert!(matches!(res_hb, Err(_)));
>     }
>
>     #[test]
>     fn test_unreachable_panic_on_invariant_violation() {
>         let invalid_session = SessionState::Connecting;
>         let cmd = OrderCommand::NewOrder {
>             order_id: 999,
>             amount: 100,
>         };
>
>         let result = catch_unwind(|| {
>             OrderProcessor::process_active_order(invalid_session, cmd)
>         });
>
>         assert!(result.is_err());
>         let panic_err = result.unwrap_err();
>         let message = panic_err
>             .downcast_ref::<String>()
>             .map(|s| s.as_str())
>             .or_else(|| panic_err.downcast_ref::<&str>().copied())
>             .unwrap_or("");
>
>         assert!(message.contains("Session state invariant broken"));
>         assert!(message.contains("Connecting"));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
>
> 1. **Mathematical Logic & Program Invariants**: `unreachable!` is designed for branches that are provably impossible according to application semantics or type invariants. In financial systems where corrupt state transitions could lead to invalid order processing, using `unreachable!` guarantees that an invariant breach fails fast and halts execution rather than producing corrupted state.
> 2. **Compiler Optimization & LLVM Hints**: When LLVM compiles code containing `unreachable!`, it introduces control flow hints assuming that branch is dead code. In optimized release builds, this enables compiler optimizations such as branch pruning and register layout optimizations.
> 3. **Ownership and Pattern Matching**: `OrderCommand` is passed by value (transferred into `process_active_order`). Struct pattern matching `OrderCommand::NewOrder { order_id, amount }` destructures the enum fields directly without heap allocation or copying ref-cell guards.
> 4. **Diagnostic Integrity**: Formatting diagnostic variables (`session`) into `unreachable!("... {:?}", session)` provides full execution context upon panic, accelerating root cause analysis during post-mortem stack trace inspection.

---

### Exercise 3: Storage Engine Pipeline with Dynamic Driver Fallbacks (`unimplemented!`, `todo!`, `unreachable!`)

**Problem Statement:**
You are building a storage engine trait `StorageBackend` with read, write, and sync capabilities:
- `fn read(&self, key: &str) -> Result<Option<String>, String>;`
- `fn write(&mut self, key: &str, value: &str) -> Result<(), String>;`
- `fn sync(&mut self) -> Result<(), String>;`

Implement three backends:
1. `MemoryBackend`: In-memory key-value store using `HashMap<String, String>`. All methods (`read`, `write`, `sync`) are fully supported.
2. `ReadOnlyBackend`: Wraps an existing hash map. `read` operates normally, but `write` and `sync` panic via `unimplemented!("ReadOnlyBackend does not support mutation or write operations")`.
3. `CloudBackend`: In-memory cached driver. `read` and `write` work locally, but `sync` panics via `todo!("Cloud storage sync flushing is pending S3 multi-part integration")`.
4. Enum Discriminant Conversion: A helper function `tag_from_u8(byte: u8) -> BackendTag` pre-validates that `byte <= 2`. Any wild-card match arm `_` uses `unreachable!("Byte bounds 0..=2 pre-checked, got invalid tag value: {byte}")`.

Write unit tests in `#[cfg(test)] mod tests` verifying all three backends and the tag converter with `assert!`, `assert_eq!`, `assert_ne!`, `matches!`, and `catch_unwind`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::HashMap;
> use std::panic::catch_unwind;
>
> pub trait StorageBackend {
>     fn read(&self, key: &str) -> Result<Option<String>, String>;
>     fn write(&mut self, key: &str, value: &str) -> Result<(), String>;
>     fn sync(&mut self) -> Result<(), String>;
> }
>
> // 1. Fully functional In-Memory Backend
> #[derive(Default)]
> pub struct MemoryBackend {
>     data: HashMap<String, String>,
> }
>
> impl StorageBackend for MemoryBackend {
>     fn read(&self, key: &str) -> Result<Option<String>, String> {
>         Ok(self.data.get(key).cloned())
>     }
>
>     fn write(&mut self, key: &str, value: &str) -> Result<(), String> {
>         self.data.insert(key.to_string(), value.to_string());
>         Ok(())
>     }
>
>     fn sync(&mut self) -> Result<(), String> {
>         Ok(())
>     }
> }
>
> // 2. Read-Only Backend (Mutation intentionally unsupported)
> pub struct ReadOnlyBackend {
>     data: HashMap<String, String>,
> }
>
> impl ReadOnlyBackend {
>     pub fn new(initial: HashMap<String, String>) -> Self {
>         Self { data: initial }
>     }
> }
>
> impl StorageBackend for ReadOnlyBackend {
>     fn read(&self, key: &str) -> Result<Option<String>, String> {
>         Ok(self.data.get(key).cloned())
>     }
>
>     fn write(&mut self, _key: &str, _value: &str) -> Result<(), String> {
>         unimplemented!("ReadOnlyBackend does not support mutation or write operations");
>     }
>
>     fn sync(&mut self) -> Result<(), String> {
>         unimplemented!("ReadOnlyBackend does not support sync operations");
>     }
> }
>
> // 3. Cloud Backend (Sync operation stubbed out as WIP)
> #[derive(Default)]
> pub struct CloudBackend {
>     cache: HashMap<String, String>,
> }
>
> impl StorageBackend for CloudBackend {
>     fn read(&self, key: &str) -> Result<Option<String>, String> {
>         Ok(self.cache.get(key).cloned())
>     }
>
>     fn write(&mut self, key: &str, value: &str) -> Result<(), String> {
>         self.cache.insert(key.to_string(), value.to_string());
>         Ok(())
>     }
>
>     fn sync(&mut self) -> Result<(), String> {
>         todo!("Cloud storage sync flushing is pending S3 multi-part integration");
>     }
> }
>
> // Discriminant Tag & Unreachable Match
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub enum BackendTag {
>     Mem = 0,
>     ReadOnly = 1,
>     Cloud = 2,
> }
>
> pub fn tag_from_u8(byte: u8) -> BackendTag {
>     // Pre-validation bounds check
>     if byte > 2 {
>         panic!("Invalid byte discriminant");
>     }
>
>     match byte {
>         0 => BackendTag::Mem,
>         1 => BackendTag::ReadOnly,
>         2 => BackendTag::Cloud,
>         _ => unreachable!("Byte bounds 0..=2 pre-checked, got invalid tag value: {byte}"),
>     }
> }
>
> #[cfg(test)]
> mod tests {
>     use super::*;
>
>     #[test]
>     fn test_memory_backend_full_lifecycle() {
>         let mut mem = MemoryBackend::default();
>         assert!(mem.write("config.host", "127.0.0.1").is_ok());
>
>         let val = mem.read("config.host");
>         assert!(val.is_ok());
>         assert_eq!(val.unwrap(), Some("127.0.0.1".to_string()));
>         assert_ne!(mem.read("missing"), Ok(Some("127.0.0.1".to_string())));
>
>         assert!(mem.sync().is_ok());
>     }
>
>     #[test]
>     fn test_readonly_backend_unimplemented_write() {
>         let mut map = HashMap::new();
>         map.insert("env".to_string(), "production".to_string());
>         let mut ro = ReadOnlyBackend::new(map);
>
>         assert_eq!(
>             ro.read("env").unwrap(),
>             Some("production".to_string())
>         );
>
>         let res = catch_unwind(move || {
>             let _ = ro.write("env", "staging");
>         });
>         assert!(res.is_err());
>         let panic_err = res.unwrap_err();
>         let msg = panic_err
>             .downcast_ref::<&str>()
>             .copied()
>             .or_else(|| panic_err.downcast_ref::<String>().map(|s| s.as_str()))
>             .unwrap_or("");
>         assert!(msg.contains("ReadOnlyBackend does not support mutation"));
>     }
>
>     #[test]
>     fn test_cloud_backend_todo_sync() {
>         let mut cloud = CloudBackend::default();
>         assert!(cloud.write("key", "val").is_ok());
>
>         let res = catch_unwind(move || {
>             let _ = cloud.sync();
>         });
>         assert!(res.is_err());
>         let panic_err = res.unwrap_err();
>         let msg = panic_err
>             .downcast_ref::<&str>()
>             .copied()
>             .or_else(|| panic_err.downcast_ref::<String>().map(|s| s.as_str()))
>             .unwrap_or("");
>         assert!(msg.contains("Cloud storage sync flushing is pending S3"));
>     }
>
>     #[test]
>     fn test_tag_conversion_and_unreachable_arm() {
>         assert_eq!(tag_from_u8(0), BackendTag::Mem);
>         assert_eq!(tag_from_u8(1), BackendTag::ReadOnly);
>         assert_eq!(tag_from_u8(2), BackendTag::Cloud);
>
>         assert!(matches!(tag_from_u8(0), BackendTag::Mem));
>
>         // Test bounds pre-check panic
>         let res = catch_unwind(|| tag_from_u8(5));
>         assert!(res.is_err());
>     }
> }
> ```
>
> #### Technical Explanation
>
>
>
> 1. **Polymorphic Trait Implementations & Diverging Methods**: In `StorageBackend`, `ReadOnlyBackend` and `CloudBackend` fulfill the trait contract by stubbing unsupported or work-in-progress operations with `unimplemented!` and `todo!`. Because diverging macros evaluate to the never type (`!`), they coerce to `Result<(), String>`, satisfying compiler type signatures.
> 2. **Interior Mutability & Borrow Checker Rules**: `write` and `sync` accept `&mut self` to enforce exclusive mutable access. `read` accepts `&self` for shared immutable access. `ReadOnlyBackend` safely implements `StorageBackend` because Rust allows trait methods to take `&mut self` even if the underlying implementation panics or refrains from mutating state.
> 3. **Defensive Invariant Guards with `unreachable!`**: In `tag_from_u8`, checking `byte > 2` before `match byte` creates an explicit invariant boundary. Rust's match exhaustiveness check requires handling all 256 possible `u8` values. Writing `_ => unreachable!(...)` satisfies exhaustiveness while guaranteeing that any hypothetical corruption of the guard condition immediately panics with exact context.
> 4. **Zero-Cost Abstractions**: Structs implementing `StorageBackend` statically satisfy the trait bound. When invoked directly or via generic monomorphization, Rust generates direct non-virtual calls, preserving zero-cost abstraction guarantees.

---

## 6. Related Terms


- [`panic!` Macro](panic.md) — The underlying mechanism all three macros are thin, intent-communicating wrappers around.
- [Never Type (`!`)](../level_11/never_type.md) — What lets these macros type-check as *any* expected return type or match-arm value.
- [`match`](../level_02/match.md) — Where `unreachable!()` is most commonly and appropriately used.
- [`dbg!` Macro](../level_01/dbg_macro.md) — A different kind of development-time macro (for inspection rather than stubbing).

---

## 7. Key Takeaways

- All three macros immediately panic when executed, but communicate **different intent**: `todo!` (not written yet), `unimplemented!` (deliberately not supported), `unreachable!` (provably impossible).
- They evaluate to the never type (`!`), so they compile cleanly wherever a value of any type is expected — a genuinely useful placeholder, not a type-checking workaround.
- `unreachable!()` should only be used where the impossibility is provable from the code's own logic — never as a stand-in for validating genuinely-reachable bad input.
- All three accept an optional format-string message, just like `panic!`, to explain the specific situation when the panic does occur.
