# Unit Struct

> **Level 2 — Control Flow & Data Structures**
> A struct with no fields, e.g. `struct Marker;`. Used as a type-level tag.

---

## 1. Prerequisites


- [Struct](struct.md) — The parent concept; a standard struct contains named data fields.
- [Tuple Struct](tuple_struct.md) — A struct with unnamed data fields.
- [`impl` Block](impl_block.md) — (Future reference) This is where Unit Structs actually become useful, as it allows you to attach behavior to them.

---

## 2. Term Category

**Rust-specific (mostly)**: While some Object-Oriented languages allow you to create "empty classes", Rust formalizes the Unit Struct as a distinct concept. It takes up absolutely zero memory at runtime and is heavily used in advanced Rust patterns (like the Typestate pattern) to enforce logic at compile time.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

If a [Struct](../level_02/struct.md) is designed to group data together, why would you ever want a struct that contains *no data at all*?

In Rust, **data and behavior are strictly separated**. Structs hold data, and `impl` blocks define behavior. Sometimes, you want to define behavior without actually needing to store any information. For example, you might want to create a `Keyboard` struct that implements a `Typeable` trait, but you don't care about storing the color or size of the keyboard in memory.

A **Unit Struct** solves this perfectly. It provides the strict **Type Identity** required by the compiler so you can attach functions and Traits to it, but it takes up exactly **0 bytes** of memory. It vanishes completely when your program is compiled.

### (2) Reality Metaphor

A Unit Struct is like a **VIP Access Badge**.

The badge itself doesn't contain any useful data. There is no barcode, no magnetic strip, no name, and no photo. It's literally just a blank piece of colored plastic. 

However, simply *possessing* the badge grants you specific behaviors (the ability to walk past the bouncer into the VIP lounge). The value isn't in the data it holds; the value is entirely in its identity.

### (3) Rust Code Examples

#### Short Snippet (Definition and Instantiation)
```rust
// Defining a Unit Struct. 
// Notice there are no `{}` or `()`, just a semicolon.
struct DatabaseConnection;

fn main() {
    // Instantiating a Unit Struct.
    // Again, no brackets or parentheses required!
    let conn = DatabaseConnection;
}
```

#### Fuller Example (Adding Behavior)
```rust
struct Greeter;

// We use an `impl` block to attach behavior to our empty struct.
impl Greeter {
    fn say_hello(&self) {
        println!("Hello! I take up 0 bytes of memory!");
    }
}

fn main() {
    let my_greeter = Greeter;
    
    // We can call methods on it, even though it holds no data.
    my_greeter.say_hello();
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Adding curly braces or parentheses

**The mistake:** Trying to define or instantiate a Unit Struct using `{}` or `()`.

**Why it's wrong:** The defining characteristic of a Unit Struct is that it lacks those symbols entirely. It is just the keyword, the name, and a semicolon.

*Incorrect:*
```rust
struct Marker {}; // Adding unnecessary braces
let m = Marker(); // Trying to instantiate it like a function
```

*Fix:*
```rust
struct Marker;
let m = Marker;
```

### Mistake 2: Mutating Unit Struct State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Unit Struct through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Unit Struct Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Unit Struct instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Typestate Pattern for High-Performance Network Protocol Client

**Scenario:**
You are designing a high-reliability TCP protocol client for an industrial telemetry pipeline. The client connection can exist in three states: `Disconnected`, `Connected`, and `Authenticated`. To eliminate runtime state checks and prevent bugs (such as attempting to transmit data before authenticating), enforce state transitions at compile time using zero-sized Unit Structs as state markers with `PhantomData<State>`.

Requirements:
1. Define three unit structs representing states: `Disconnected`, `Connected`, and `Authenticated`.
2. Define a generic struct `Connection<State>` storing an `endpoint: String`, `session_token: Option<String>`, and `_state: PhantomData<State>`.
3. Implement `Connection::<Disconnected>::new(endpoint: impl Into<String>)`, `connect(self)` to transition to `Connected`, `authenticate(self, token: impl Into<String>)` to transition to `Authenticated`, `send_payload(&self, payload: &str)` on `Authenticated`, and `disconnect(self)` returning to `Disconnected`.
4. Demonstrate that unit structs occupy `0` bytes in memory (`std::mem::size_of::<Disconnected>() == 0`), guaranteeing zero memory overhead for type-level safety markers.
5. Provide a complete unit test module `#[cfg(test)] mod tests` with explicit assertions (`assert_eq!`, `assert!`, `assert_ne!`, `matches!`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::marker::PhantomData;
> 
> // State markers defined as Zero-Sized Unit Structs
> #[derive(Debug, PartialEq, Eq)]
> pub struct Disconnected;
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct Connected;
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct Authenticated;
> 
> // Generic connection client parametric over state
> pub struct Connection<State> {
>     endpoint: String,
>     session_token: Option<String>,
>     _state: PhantomData<State>,
> }
> 
> impl Connection<Disconnected> {
>     pub fn new(endpoint: impl Into<String>) -> Self {
>         Self {
>             endpoint: endpoint.into(),
>             session_token: None,
>             _state: PhantomData,
>         }
>     }
> 
>     // State transition consuming ownership of Disconnected state
>     pub fn connect(self) -> Connection<Connected> {
>         Connection {
>             endpoint: self.endpoint,
>             session_token: None,
>             _state: PhantomData,
>         }
>     }
> }
> 
> impl Connection<Connected> {
>     // State transition consuming ownership of Connected state
>     pub fn authenticate(self, token: impl Into<String>) -> Connection<Authenticated> {
>         Connection {
>             endpoint: self.endpoint,
>             session_token: Some(token.into()),
>             _state: PhantomData,
>         }
>     }
> }
> 
> impl Connection<Authenticated> {
>     pub fn send_payload(&self, payload: &str) -> String {
>         format!(
>             "[{}] Sent '{}' via token {}",
>             self.endpoint,
>             payload,
>             self.session_token.as_deref().unwrap_or("none")
>         )
>     }
> 
>     pub fn disconnect(self) -> Connection<Disconnected> {
>         Connection {
>             endpoint: self.endpoint,
>             session_token: None,
>             _state: PhantomData,
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_typestate_lifecycle() {
>         let conn = Connection::new("127.0.0.1:8080");
>         assert_eq!(std::mem::size_of::<Disconnected>(), 0);
>         assert_eq!(std::mem::size_of::<Connected>(), 0);
>         assert_eq!(std::mem::size_of::<Authenticated>(), 0);
> 
>         // Transition: Disconnected -> Connected
>         let connected_conn = conn.connect();
> 
>         // Transition: Connected -> Authenticated
>         let auth_conn = connected_conn.authenticate("secret_jwt_token_123");
>         let response = auth_conn.send_payload("PING");
> 
>         assert_eq!(
>             response,
>             "[127.0.0.1:8080] Sent 'PING' via token secret_jwt_token_123"
>         );
>         assert!(response.contains("secret_jwt_token_123"));
> 
>         // Transition: Authenticated -> Disconnected
>         let disconnected_conn = auth_conn.disconnect();
>         assert_eq!(disconnected_conn.endpoint, "127.0.0.1:8080");
>         assert_ne!(disconnected_conn.endpoint, "192.168.1.1");
>     }
> 
>     #[test]
>     fn test_zero_sized_type_property() {
>         let disc = Disconnected;
>         let conn = Connected;
>         let auth = Authenticated;
> 
>         assert_eq!(std::mem::size_of_val(&disc), 0);
>         assert_eq!(std::mem::size_of_val(&conn), 0);
>         assert_eq!(std::mem::size_of_val(&auth), 0);
> 
>         let option_marker: Option<Disconnected> = None;
>         assert!(matches!(option_marker, None));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Zero-Sized Types (ZST)**: The unit structs `Disconnected`, `Connected`, and `Authenticated` take up `0` bytes in memory. Rust compilers optimize ZST instances out entirely during LLVM code generation, creating zero runtime footprint.
> 2. **Typestate Pattern Mechanics**: By parameterizing `Connection<State>` over unit structs, method availability is controlled at compile time via `impl Connection<State>` blocks. Attempting to call `send_payload` on a `Connection<Disconnected>` causes a compile error (`E0599`), moving invalid state transitions from runtime crashes to compile-time check failures.
> 3. **Ownership and Move Semantics**: State transition methods consume `self` by value (e.g., `fn connect(self)`). Once transferred, the old instance in the prior state is moved and destroyed, preventing reuse or concurrent access in an invalid state (preventing use-after-move).
> 4. **`PhantomData` Role**: Because `State` is only used as a type-level marker and not stored in data fields, `PhantomData<State>` informs the Rust compiler's type checker and variance engine that `Connection` owns logical state `State` without allocating memory for it.

---

### Exercise 2: Zero-Cost Strategy Pattern for Telemetry Encoding

**Scenario:**
In a real-time event processing platform, log messages must be formatted and dispatched using different encoding strategies (`JsonFormat`, `CompactTextFormat`, `CsvFormat`). Instead of using dynamic trait objects (`Box<dyn Formatter>`) which introduce runtime vtable lookups and heap allocations, implement a zero-cost strategy pattern using Unit Structs and static trait dispatch.

Requirements:
1. Define a trait `LogFormatter` with `fn format_log(&self, timestamp: u64, message: &str) -> String`.
2. Define three unit structs acting as stateless strategies: `JsonFormat`, `CompactTextFormat`, and `CsvFormat`.
3. Implement `LogFormatter` for each unit struct strategy.
4. Define `TelemetryLogger<F: LogFormatter>` holding `formatter: F`.
5. Implement `TelemetryLogger::new(formatter: F)` and `log(&self, timestamp: u64, message: &str) -> String`.
6. Prove that storing unit struct strategies in `TelemetryLogger` adds zero bytes to the logger instance size (`std::mem::size_of::<TelemetryLogger<JsonFormat>>() == 0`).
7. Write complete unit tests in `#[cfg(test)] mod tests` using explicit assertions (`assert_eq!`, `assert!`, `assert_ne!`, `matches!`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> // Strategy trait for log serialization
> pub trait LogFormatter {
>     fn format_log(&self, timestamp: u64, message: &str) -> String;
> }
> 
> // Unit structs acting as zero-sized strategy implementations
> #[derive(Debug, Clone, Copy)]
> pub struct JsonFormat;
> 
> #[derive(Debug, Clone, Copy)]
> pub struct CompactTextFormat;
> 
> #[derive(Debug, Clone, Copy)]
> pub struct CsvFormat;
> 
> impl LogFormatter for JsonFormat {
>     fn format_log(&self, timestamp: u64, message: &str) -> String {
>         format!(r#"{{"ts":{},"msg":"{}"}}"#, timestamp, message)
>     }
> }
> 
> impl LogFormatter for CompactTextFormat {
>     fn format_log(&self, timestamp: u64, message: &str) -> String {
>         format!("[{}] {}", timestamp, message)
>     }
> }
> 
> impl LogFormatter for CsvFormat {
>     fn format_log(&self, timestamp: u64, message: &str) -> String {
>         format!("{},\"{}\"", timestamp, message)
>     }
> }
> 
> pub struct TelemetryLogger<F: LogFormatter> {
>     formatter: F,
> }
> 
> impl<F: LogFormatter> TelemetryLogger<F> {
>     pub fn new(formatter: F) -> Self {
>         Self { formatter }
>     }
> 
>     pub fn log(&self, timestamp: u64, message: &str) -> String {
>         self.formatter.format_log(timestamp, message)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_zero_cost_strategy_formatting() {
>         let json_logger = TelemetryLogger::new(JsonFormat);
>         let compact_logger = TelemetryLogger::new(CompactTextFormat);
>         let csv_logger = TelemetryLogger::new(CsvFormat);
> 
>         assert_eq!(
>             json_logger.log(1620000000, "System boot"),
>             r#"{"ts":1620000000,"msg":"System boot"}"#
>         );
>         assert_eq!(
>             compact_logger.log(1620000000, "System boot"),
>             "[1620000000] System boot"
>         );
>         assert_eq!(
>             csv_logger.log(1620000000, "System boot"),
>             "1620000000,\"System boot\""
>         );
> 
>         assert_ne!(
>             json_logger.log(1620000000, "System boot"),
>             csv_logger.log(1620000000, "System boot")
>         );
>     }
> 
>     #[test]
>     fn test_strategy_memory_footprint() {
>         assert_eq!(std::mem::size_of::<JsonFormat>(), 0);
>         assert_eq!(std::mem::size_of::<CompactTextFormat>(), 0);
>         assert_eq!(std::mem::size_of::<CsvFormat>(), 0);
> 
>         assert_eq!(std::mem::size_of::<TelemetryLogger<JsonFormat>>(), 0);
>         assert_eq!(std::mem::size_of::<TelemetryLogger<CompactTextFormat>>(), 0);
> 
>         let fmt = JsonFormat;
>         assert!(matches!(fmt, JsonFormat));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Static Trait Dispatch (Monomorphization)**: Generic type parameters (`TelemetryLogger<F>`) cause Rust to generate concrete specialized code for each strategy type at compile time. Because `JsonFormat`, `CompactTextFormat`, and `CsvFormat` are Unit Structs, methods are directly inlineable without dynamic vtable lookups (`dyn LogFormatter`).
> 2. **Zero-Overhead Strategy Pattern**: Unlike object-oriented strategy patterns that require storing pointer handles to heap objects or trait vtables (which cost 16 bytes for fat pointers), unit struct strategies cost exactly `0` bytes. The compiler replaces calls with direct static code execution.
> 3. **Lifetimes and Pass-by-Value**: Because Unit Structs carry no internal state or pointers, passing them by value (`JsonFormat`) consumes zero register space. Unit structs easily derive `Copy` and `Clone` at no performance penalty.
> 4. **Edge Cases**: Because unit structs contain no fields, instantiating `TelemetryLogger` requires passing the unit struct instance `JsonFormat`. The compiler completely optimizes out storage for `formatter: F` field inside `TelemetryLogger<F>`.

---

### Exercise 3: Type-Safe Hardware Register Access Control via Capability Tokens

**Scenario:**
In embedded hardware driver design, memory-mapped registers possess explicit access permissions: `ReadOnly` (e.g. hardware status registers), `WriteOnly` (e.g. command trigger registers), and `ReadWrite` (e.g. configuration registers). Using Unit Structs as access capability tokens, build a type-safe register abstraction `Register<T, AccessMode>` that guarantees permission correctness at compile time.

Requirements:
1. Define zero-sized unit structs representing access rights: `ReadOnly`, `WriteOnly`, and `ReadWrite`.
2. Define marker traits `Readable` and `Writable`. Implement `Readable` for `ReadOnly` and `ReadWrite`. Implement `Writable` for `WriteOnly` and `ReadWrite`.
3. Define `Register<T: Copy, AccessMode>` storing `value: T` and `_access: PhantomData<AccessMode>`.
4. Implement `read(&self) -> T` constrained on `AccessMode: Readable`.
5. Implement `write(&mut self, val: T)` constrained on `AccessMode: Writable`.
6. Verify that `Register<T, AccessMode>` size equals `std::mem::size_of::<T>()` exactly, proving unit struct markers add zero runtime size overhead.
7. Include comprehensive unit tests inside `#[cfg(test)] mod tests` using explicit assertions (`assert_eq!`, `assert!`, `assert_ne!`, `matches!`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::marker::PhantomData;
> 
> // Zero-sized capability token unit structs
> #[derive(Debug, Clone, Copy)]
> pub struct ReadOnly;
> 
> #[derive(Debug, Clone, Copy)]
> pub struct WriteOnly;
> 
> #[derive(Debug, Clone, Copy)]
> pub struct ReadWrite;
> 
> // Capability marker traits
> pub trait Readable {}
> pub trait Writable {}
> 
> impl Readable for ReadOnly {}
> impl Readable for ReadWrite {}
> 
> impl Writable for WriteOnly {}
> impl Writable for ReadWrite {}
> 
> // Type-safe hardware register abstraction
> pub struct Register<T: Copy, AccessMode> {
>     value: T,
>     _access: PhantomData<AccessMode>,
> }
> 
> impl<T: Copy, AccessMode> Register<T, AccessMode> {
>     pub fn new(initial_value: T) -> Self {
>         Self {
>             value: initial_value,
>             _access: PhantomData,
>         }
>     }
> }
> 
> impl<T: Copy, AccessMode: Readable> Register<T, AccessMode> {
>     pub fn read(&self) -> T {
>         self.value
>     }
> }
> 
> impl<T: Copy, AccessMode: Writable> Register<T, AccessMode> {
>     pub fn write(&mut self, val: T) {
>         self.value = val;
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_register_access_permissions() {
>         let ro_reg: Register<u32, ReadOnly> = Register::new(0xDEAD_BEEF);
>         assert_eq!(ro_reg.read(), 0xDEAD_BEEF);
> 
>         let mut wo_reg: Register<u32, WriteOnly> = Register::new(0);
>         wo_reg.write(0xCAFE_BABE);
>         // ro_reg.write(0); // ❌ Compile Error: trait bound `ReadOnly: Writable` is not satisfied
> 
>         let mut rw_reg: Register<u32, ReadWrite> = Register::new(100);
>         assert_eq!(rw_reg.read(), 100);
>         rw_reg.write(200);
>         assert_eq!(rw_reg.read(), 200);
> 
>         assert_ne!(rw_reg.read(), 100);
>     }
> 
>     #[test]
>     fn test_register_zst_overhead() {
>         assert_eq!(std::mem::size_of::<ReadOnly>(), 0);
>         assert_eq!(std::mem::size_of::<WriteOnly>(), 0);
>         assert_eq!(std::mem::size_of::<ReadWrite>(), 0);
> 
>         // Memory footprint of Register<u32, AccessMode> matches size_of::<u32>() exactly (4 bytes)
>         assert_eq!(std::mem::size_of::<Register<u32, ReadOnly>>(), 4);
>         assert_eq!(std::mem::size_of::<Register<u64, ReadWrite>>(), 8);
> 
>         let cap: Option<ReadOnly> = Some(ReadOnly);
>         assert!(matches!(cap, Some(ReadOnly)));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Capability Traits and Zero-Cost Access Control**: By creating empty marker traits (`Readable`, `Writable`) and implementing them on capability unit structs (`ReadOnly`, `WriteOnly`, `ReadWrite`), method availability on `Register` is strictly governed by trait bounds (`AccessMode: Readable`). Attempting to call `.write()` on a `Register<u32, ReadOnly>` causes a compile error, eliminating invalid hardware bus operations before code reaches hardware.
> 2. **Struct Layout and Memory Alignment**: Rust's ABI rules specify that zero-sized fields (`PhantomData<AccessMode>`) do not alter the struct layout, size, or alignment requirements of `Register<T, AccessMode>`. Thus, `Register<u32, ReadOnly>` is byte-identical in memory representation to a plain `u32`.
> 3. **Safety and Low-Level Driver Invariants**: In embedded systems where registers map directly to memory hardware addresses (`volatile` MMIO pointers), Unit Struct markers allow developers to enforce safety constraints at compile time without paying any runtime penalty in code size, memory footprint, or execution cycles.

---

## 6. Related Terms


- [Struct](struct.md) — The standard version that requires you to name every field.
- [Tuple Struct](tuple_struct.md) — A struct with unnamed fields.
- [Unit Type (`()`)](../level_01/unit_type.md) — Related concept: Unit Type (`()`).
- [Never Type (`!`)](../level_11/never_type.md) — Related concept: Never Type (`!`).
- [`PhantomData<T>`](../level_11/phantomdata_t.md) — Related concept: `PhantomData<T>`.

---

## 7. Key Takeaways

- A Unit Struct is defined simply with `struct Name;` (no `{}` or `()`).
- It takes up exactly **0 bytes** of memory at runtime.
- You create an instance simply by typing its name: `let x = Name;`.
- It is primarily used when you need a custom Type to attach behavior to (via `impl` blocks or Traits), but you don't need to store any actual state.
