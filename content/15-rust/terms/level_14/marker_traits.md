# Marker Traits

> **Level 14 — Advanced Traits & Type System**
> Traits with an empty body (`pub trait Marker {}`) containing no methods or associated items, used purely to flag semantic properties of types for compile-time generic verification.

---

## 1. Prerequisites


- [Trait](../level_04/trait.md) — Standard trait definitions and implementations.
- [`Send` Trait](../level_09/send_trait.md)
- [`ZSTs` (Zero-Sized Types)](../level_11/zsts.md) — Type-level markers that cost zero memory at runtime.
- [`Sized` Trait](../level_11/sized_trait.md) — Built-in marker trait indicating known compile-time size.

---

## 2. Term Category



**Rust Type System (compile-time marker traits)**: A Marker Trait is a trait definition that contains no methods, associated constants, or associated types (`pub trait Marker {}`). Instead of defining executable behavior, marker traits act as type-level metadata flags. They allow the compiler and library authors to categorize types into semantic groups (e.g. "thread-safe", "copyable", "compile-time sized", "unencrypted payload") and enforce these constraints statically at compile time with zero runtime overhead.



---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In dynamically typed languages (like JavaScript or Python), checking whether an object satisfies a specific semantic guarantee (e.g. "is this payload safe to send across a web worker thread?" or "is this object immutable?") requires adding runtime metadata flags (`isThreadSafe: true`) or performing runtime `instanceof` checks.

In Rust, runtime checks incur memory overhead and performance penalties. Furthermore, many critical safety properties — such as preventing data races across threads or ensuring a type can be duplicated via simple bitwise memcpy — must be guaranteed *before* the program ever runs.

Rust introduced **Marker Traits** to solve this at the type level. Because a marker trait has no methods (`trait Copy {}`), implementing it for a type (`impl Copy for Point`) adds zero extra byte fields to the struct and generates zero machine code instructions.

The compiler uses marker traits to drive type checking and optimizations:
- **`T: Copy`**: The compiler knows it can duplicate `T` using cheap bitwise memory copies (`memcpy`) instead of calling drop destructors.
- **`T: Send`**: The multi-threaded runtime (`std::thread::spawn`) knows `T` is safe to move to another OS thread.
- **`T: Sized`**: Function parameters know `T` occupies a fixed, known byte size on the stack.

### (2) Reality Metaphor

Imagine a **Security Clearance Badge System in a Government Building**:

- **Standard Traits (`trait Driver { fn drive(); }`)** are like job descriptions: they require the employee to actually perform specific work duties (**execute methods**).
- **Marker Traits (`trait TopSecretClearance {}`)** are like colored security badge stickers:
  - The sticker contains no tools or working gear inside it (**no methods or data fields**).
  - The security guard at the vault door (**generic trait bound `fn enter_vault<T: TopSecretClearance>(person: T)`**) simply inspects the employee's badge for the sticker at the door (**compile-time type bound check**).
  - If the sticker is present, access is instantly granted with zero delay (**zero runtime cost**).

### (3) Code Examples

#### Short Snippet (Built-in Standard Library Marker Traits)

```rust
// Standard library marker trait definitions:
// pub trait Copy: Clone {}
// pub unsafe trait Send {}
// pub unsafe trait Sync {}

#[derive(Debug, Clone, Copy)] // Auto-implements `Copy` marker trait
struct Vector2 {
    x: f32,
    y: f32,
}

// Function enforcing `Copy` marker trait bound
fn duplicate_value<T: Copy>(val: T) -> (T, T) {
    // Because T: Copy, assignment performs a bitwise copy without moving ownership
    (val, val)
}

fn main() {
    let v1 = Vector2 { x: 1.0, y: 2.0 };
    let (v2, v3) = duplicate_value(v1);

    // `v1` is STILL valid because Vector2 implements the `Copy` marker trait!
    println!("v1: {:?}, v2: {:?}, v3: {:?}", v1, v2, v3);
}
```

#### Fuller Example (Custom Marker Trait for Compile-Time Security Validation)

```rust
/// A custom marker trait indicating that a data payload has been sanitized
pub trait Sanitized {}

/// A custom marker trait indicating that a data payload is raw/untrusted
pub trait Untrusted {}

pub struct Payload<State> {
    pub data: String,
    _marker: std::marker::PhantomData<State>, // Zero-sized state marker
}

impl Payload<Untrusted> {
    pub fn new(raw_input: String) -> Self {
        Payload {
            data: raw_input,
            _marker: std::marker::PhantomData,
        }
    }

    /// Sanitizes the raw input and transforms the state marker type to `Sanitized`
    pub fn sanitize(self) -> Payload<Sanitized> {
        let cleaned = self.data.replace("<script>", "").replace("</script>", "");
        Payload {
            data: cleaned,
            _marker: std::marker::PhantomData,
        }
    }
}

// Implement custom marker trait
impl Sanitized for Payload<Sanitized> {}

// API function that ONLY accepts payloads flagged with the `Sanitized` marker trait:
fn execute_database_query<T: Sanitized>(payload: &T) {
    println!("Database query executed safely with sanitized payload!");
}

fn main() {
    let raw_payload = Payload::<Untrusted>::new(String::from("<script>DELETE FROM users</script>"));

    // ❌ COMPILER ERROR if we try to pass raw payload directly:
    // execute_database_query(&raw_payload); 

    // Sanitize payload to obtain `Sanitized` marker state:
    let safe_payload = raw_payload.sanitize();

    // Now passes compile-time marker check:
    execute_database_query(&safe_payload);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Implementing `Copy` on Types with Destructors (`Drop`)

**The mistake:** Trying to implement the `Copy` marker trait on a struct that implements `std::ops::Drop`.

**Why it's wrong:** `Copy` implies bitwise `memcpy` duplication without running destructor logic. If a type implemented both `Copy` and `Drop`, duplicating the type would cause double-free memory bugs when multiple copied instances are dropped. The compiler rejects this with error `E0184`.

*Incorrect:*
```rust
struct CustomBuffer(*mut u8);

impl Drop for CustomBuffer {
    fn drop(&mut self) { /* Free raw memory */ }
}

// ❌ Compiler Error E0184: the trait `Copy` may not be implemented for this type; the type has a destructor
impl Copy for CustomBuffer {}
```

*Fix:*
```rust
// Use `Clone` for explicit duplication when custom drop logic is required
impl Clone for CustomBuffer {
    fn clone(&self) -> Self { ... }
}
```

### Mistake 2: Assuming Marker Traits Add Runtime Overhead or Memory Size

**The mistake:** Worrying that adding custom marker traits or `PhantomData` fields increases the size of structs or slows down generic function calls.

**Why it's wrong:** Marker traits have no methods or fields, and `PhantomData` is a Zero-Sized Type (ZST). They exist purely at compile time and are completely stripped during compilation. `size_of::<T>()` remains unchanged.

*Incorrect:*
```rust
// Worrying that `Sanitized` marker adds bytes to `SecureData`:
struct SecureData<S: Sanitized> {
    data: u64,
    _marker: PhantomData<S>, // 0 bytes!
}
```

*Fix:*
```rust
// `size_of::<SecureData<Sanitized>>()` is exactly 8 bytes (just the u64)!
```

### Mistake 3: Manually Implementing Auto Marker Traits Incorrectly

**The mistake:** Writing manual `unsafe impl Send for MyType` on a struct containing non-thread-safe types (`Rc<T>`, raw pointers) without verifying internal thread synchronization.

**Why it's wrong:** `Send` and `Sync` are *auto traits* (automatically implemented by the compiler if all fields implement them). Overriding the compiler with manual `unsafe impl` bypasses safety checks and introduces data races if your type isn't actually thread-safe.

---

## 5. Practice Exercises

### Exercise 1: Custom Marker Trait & Typestate Pattern for Microcontroller UART Driver

**Scenario:** **Problem Statement:**
In embedded Rust applications (`#![no_std]`), microcontroller hardware peripherals (such as a UART interface) must be initialized in a strict operational sequence. The peripheral must remain in a `Disabled` state while configuring baud rates or frame parameters, and transition to an `Enabled` state before transmitting data over hardware pins.

**Requirements:**
Build a compile-time safe UART driver using Zero-Sized Types (ZSTs) and custom marker traits:
1. Define zero-sized marker types `Disabled` and `Enabled`.
2. Define a custom marker trait `pub trait PeripheralState {}` implemented for both states.
3. Define a custom marker trait `pub trait ReadyToTransmit: PeripheralState {}` implemented **only** for `Enabled`.
4. Define a generic struct `UartDriver<State: PeripheralState>` holding a base memory address (`usize`) and baud rate (`u32`), utilizing `PhantomData<State>`.
5. Implement `new(base_address: usize) -> Self` for `UartDriver<Disabled>`.
6. Implement `configure(self, baud_rate: u32) -> UartDriver<Enabled>` to transition state.
7. Implement `transmit(&self, data: &[u8]) -> usize` restricted to states implementing `ReadyToTransmit`.
8. Include unit tests with `assert_eq!` verifying state transitions, data byte counts, and asserting zero memory footprint (`std::mem::size_of`) for marker state transitions.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::marker::PhantomData;
> 
> /// Marker state representing a disabled/uninitialized peripheral
> #[derive(Debug, PartialEq, Eq)]
> pub struct Disabled;
> 
> /// Marker state representing an active, operational peripheral
> #[derive(Debug, PartialEq, Eq)]
> pub struct Enabled;
> 
> /// Custom marker trait identifying valid peripheral hardware states
> pub trait PeripheralState {}
> impl PeripheralState for Disabled {}
> impl PeripheralState for Enabled {}
> 
> /// Custom marker trait indicating the peripheral is active and safe for output transmission
> pub trait ReadyToTransmit: PeripheralState {}
> // Only `Enabled` implements `ReadyToTransmit`
> impl ReadyToTransmit for Enabled {}
> 
> /// A generic hardware UART driver parameterized by its compile-time state
> pub struct UartDriver<State: PeripheralState> {
>     base_address: usize,
>     baud_rate: u32,
>     _state: PhantomData<State>,
> }
> 
> impl UartDriver<Disabled> {
>     /// Creates a new UART driver in the uninitialized/disabled state
>     pub fn new(base_address: usize) -> Self {
>         Self {
>             base_address,
>             baud_rate: 9600, // Default baud rate
>             _state: PhantomData,
>         }
>     }
> 
>     /// Configures baud rate and transitions the driver from `Disabled` to `Enabled`
>     pub fn configure(self, baud_rate: u32) -> UartDriver<Enabled> {
>         UartDriver {
>             base_address: self.base_address,
>             baud_rate,
>             _state: PhantomData,
>         }
>     }
> }
> 
> impl<State: PeripheralState> UartDriver<State> {
>     pub fn baud_rate(&self) -> u32 {
>         self.baud_rate
>     }
>     
>     pub fn base_address(&self) -> usize {
>         self.base_address
>     }
> }
> 
> impl<State: ReadyToTransmit> UartDriver<State> {
>     /// Transmits raw data over the UART interface. Only available on `Enabled` drivers!
>     pub fn transmit(&self, data: &[u8]) -> usize {
>         // In real hardware, this would write to UART registers at `self.base_address`
>         data.len()
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_uart_state_machine() {
>         let disabled_uart = UartDriver::new(0x4000_C000);
>         assert_eq!(disabled_uart.base_address(), 0x4000_C000);
>         assert_eq!(disabled_uart.baud_rate(), 9600);
> 
>         // Transition state to Enabled
>         let enabled_uart = disabled_uart.configure(115_200);
>         assert_eq!(enabled_uart.baud_rate(), 115_200);
> 
>         // Transmission is only callable on Enabled state
>         let bytes_sent = enabled_uart.transmit(b"HELLO");
>         assert_eq!(bytes_sent, 5);
>     }
> 
>     #[test]
>     fn test_zero_memory_overhead_of_marker_traits() {
>         // Verify PhantomData state markers incur 0 runtime memory overhead
>         assert_eq!(
>             std::mem::size_of::<UartDriver<Disabled>>(),
>             std::mem::size_of::<UartDriver<Enabled>>()
>         );
>         assert_eq!(
>             std::mem::size_of::<UartDriver<Disabled>>(),
>             std::mem::size_of::<usize>() + std::mem::size_of::<u32>()
>         );
>         assert_eq!(std::mem::size_of::<Disabled>(), 0);
>         assert_eq!(std::mem::size_of::<Enabled>(), 0);
>     }
> }
> ```
> 
> #### Technical Explanation
>
> 1. **Marker Traits as Typestate Flags**: `PeripheralState` and `ReadyToTransmit` contain no methods (`trait Marker {}`). They exist exclusively to categorize state types at compile time.
> 2. **Compile-Time Protocol Enforcement**: The `transmit` method is implemented only for `UartDriver<State>` where `State: ReadyToTransmit`. Calling `disabled_uart.transmit(...)` triggers compile error `E0599`, preventing invalid hardware operation without any runtime boolean checks.
> 3. **Zero-Cost Abstraction**: `PhantomData<State>` acts as a zero-sized marker type (ZST). Both `size_of::<Disabled>()` and `size_of::<Enabled>()` are 0 bytes, ensuring the struct memory size equals `usize + u32` exactly.
> 
---

### Exercise 2: Multithreaded Worker Pool with `Send` and `Sync` Marker Enforcements

**Scenario:** **Problem Statement:**
High-concurrency Rust network services delegate CPU-bound background processing to thread pools. Rust guarantees thread safety at compile time using standard library marker traits:
- `Send`: Indicates ownership of a type can be transferred across OS thread boundaries.
- `Sync`: Indicates references (`&T`) to a type can be safely shared across OS threads.

**Requirements:**
Construct a multithreaded task dispatcher and verify marker trait bounds:
1. Define a task wrapper `TaskJob<T>` holding data `payload: T` and a function pointer `handler: fn(T) -> u64`.
2. Implement `WorkerPool::execute_tasks<T>(worker_count: usize, jobs: Vec<TaskJob<T>>, results: Arc<Mutex<Vec<u64>>>) -> Self` constrained by `T: Send + 'static`.
3. Spawn background threads using `std::thread::spawn` and an `mpsc` channel.
4. Implement `WorkerPool::join(self)` to wait for all background worker threads to exit cleanly.
5. Write unit tests with assertions (`assert_eq!`) demonstrating concurrent execution, result aggregation, and verifying `Send`/`Sync` trait bounds for standard library types (`u64`, `String`, `Arc<Mutex<Vec<u64>>>`) while documenting why non-`Send` types like `Rc<T>` fail compile-time checks.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::sync::{mpsc, Arc, Mutex};
> use std::thread;
> 
> /// A task wrapper containing data payload and processing logic
> pub struct TaskJob<T> {
>     pub payload: T,
>     pub handler: fn(T) -> u64,
> }
> 
> /// Worker pool managing background task execution threads
> pub struct WorkerPool {
>     workers: Vec<thread::JoinHandle<()>>,
> }
> 
> impl WorkerPool {
>     /// Spawns `worker_count` background threads processing tasks from a channel
>     pub fn execute_tasks<T>(
>         worker_count: usize,
>         jobs: Vec<TaskJob<T>>,
>         results: Arc<Mutex<Vec<u64>>>,
>     ) -> Self
>     where
>         T: Send + 'static, // Marker trait bound: T MUST be safe to transfer across thread boundaries!
>     {
>         let (sender, receiver) = mpsc::channel::<TaskJob<T>>();
>         let receiver = Arc::new(Mutex::new(receiver));
> 
>         let mut workers = Vec::with_capacity(worker_count);
> 
>         for _ in 0..worker_count {
>             let rx = Arc::clone(&receiver);
>             let res = Arc::clone(&results);
> 
>             let handle = thread::spawn(move || {
>                 loop {
>                     // Lock channel receiver safely across threads
>                     let job_opt = {
>                         let lock = rx.lock().unwrap();
>                         lock.recv().ok()
>                     };
> 
>                     match job_opt {
>                         Some(job) => {
>                             let val = (job.handler)(job.payload);
>                             let mut res_lock = res.lock().unwrap();
>                             res_lock.push(val);
>                         }
>                         None => break, // Channel closed
>                     }
>                 }
>             });
>             workers.push(handle);
>         }
> 
>         // Send all jobs to workers
>         for job in jobs {
>             sender.send(job).unwrap();
>         }
>         drop(sender); // Close channel so workers exit loop
> 
>         WorkerPool { workers }
>     }
> 
>     /// Waits for all worker threads to terminate cleanly
>     pub fn join(self) {
>         for handle in self.workers {
>             handle.join().unwrap();
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_worker_pool_execution() {
>         let results = Arc::new(Mutex::new(Vec::new()));
> 
>         let jobs = vec![
>             TaskJob { payload: 10, handler: |x| x * 2 },
>             TaskJob { payload: 20, handler: |x| x * 2 },
>             TaskJob { payload: 30, handler: |x| x * 2 },
>         ];
> 
>         let pool = WorkerPool::execute_tasks(2, jobs, Arc::clone(&results));
>         pool.join();
> 
>         let mut output = results.lock().unwrap().clone();
>         output.sort();
>         assert_eq!(output, vec![20, 40, 60]);
>     }
> 
>     #[test]
>     fn test_send_sync_marker_verification() {
>         // Helper functions asserting marker trait bounds statically
>         fn is_send<T: Send>() {}
>         fn is_sync<T: Sync>() {}
> 
>         is_send::<u64>();
>         is_send::<String>();
>         is_send::<Arc<Mutex<Vec<u64>>>>();
> 
>         is_sync::<u64>();
>         is_sync::<String>();
>         is_sync::<Arc<Mutex<Vec<u64>>>>();
> 
>         // Note: std::rc::Rc does NOT implement `Send` or `Sync` marker traits!
>         // Uncommenting the line below causes compile error E0277:
>         // is_send::<std::rc::Rc<u64>>();
>     }
> }
> ```
> 
> #### Technical Explanation
>
> 1. **Auto Marker Traits**: `Send` and `Sync` are built-in auto traits implemented automatically by the Rust compiler when all composite struct fields satisfy them.
> 2. **Static Data Race Prevention**: Spawning an OS thread via `std::thread::spawn` requires the moved closure and its captured environment to satisfy `Send`. The generic constraint `where T: Send + 'static` guarantees that task data transferred through `mpsc` channels cannot cause data races.
> 3. **Non-`Send` Types**: Types like `std::rc::Rc<T>` update non-atomic reference counts. Transferring an `Rc` to another thread would cause unsynchronized memory mutations. The compiler enforces safety by withholding `Send` and `Sync` marker implementations for `Rc`.
> 
---

### Exercise 3: Zero-Copy DMA Memory Buffer Marker Trait (`Pod`)

**Scenario:** **Problem Statement:**
Low-level networking devices, operating system kernels, and hardware DMA controllers read and write memory buffers directly as raw byte arrays (`&[u8]`). Transmuting or reinterpreting a Rust data structure into a byte slice can lead to Undefined Behavior if the type contains uninitialized memory (struct padding bytes), invalid bit representation enums, or heap reference pointers.

**Requirements:**
Design a custom `unsafe` marker trait `Pod` (Plain Old Data) to enforce zero-copy byte casting safety:
1. Define an unsafe marker trait `pub unsafe trait Pod: Copy + 'static {}`.
2. Document the safety invariants required for types implementing `Pod`.
3. Implement `Pod` for primitive numeric types (`u8`, `u16`, `u32`, `u64`, `f32`, `f64`).
4. Define a telemetry struct `#[repr(C)] struct SensorReadings { timestamp: u64, temperature: f32, humidity: f32 }` and safely implement `Pod` for it.
5. Implement a generic zero-copy helper function `pub fn as_byte_slice<T: Pod>(slice: &[T]) -> &[u8]` using pointer casting and `std::slice::from_raw_parts`.
6. Write unit tests with assertions (`assert_eq!`) validating byte buffer lengths, byte value reconstitution, and struct size alignment calculations.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::mem::size_of;
> use std::slice;
> 
> /// Custom unsafe marker trait declaring a type is "Plain Old Data" (POD).
> /// 
> /// # Safety
> /// Implementing this marker trait asserts that:
> /// 1. The type contains no uninitialized bytes (padding gaps or uninit memory).
> /// 2. Any bit pattern of the byte representation constitutes a valid instance of this type.
> /// 3. The type contains no heap pointers, references, or `Drop` destructor logic.
> pub unsafe trait Pod: Copy + 'static {}
> 
> // Implement `Pod` for standard primitive numeric types
> unsafe impl Pod for u8 {}
> unsafe impl Pod for u16 {}
> unsafe impl Pod for u32 {}
> unsafe impl Pod for u64 {}
> unsafe impl Pod for f32 {}
> unsafe impl Pod for f64 {}
> 
> /// Custom repr(C) telemetry data payload safe for raw DMA hardware transfers
> #[repr(C)]
> #[derive(Debug, Clone, Copy, PartialEq)]
> pub struct SensorReadings {
>     pub timestamp: u64,   // 8 bytes
>     pub temperature: f32, // 4 bytes
>     pub humidity: f32,    // 4 bytes
> } // Total: 16 bytes, no padding gaps under `repr(C)` field order
> 
> // Safety assertion: SensorReadings satisfies all `Pod` invariants
> unsafe impl Pod for SensorReadings {}
> 
> /// Safely views any slice of `Pod` elements as a contiguous slice of raw bytes.
> pub fn as_byte_slice<T: Pod>(slice: &[T]) -> &[u8] {
>     let byte_len = slice.len() * size_of::<T>();
>     let ptr = slice.as_ptr() as *const u8;
>     // SAFETY: `T: Pod` guarantees no uninitialized padding bytes, invalid bits, or pointers
>     unsafe { slice::from_raw_parts(ptr, byte_len) }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_primitive_pod_byte_casting() {
>         let numbers: [u32; 3] = [0x12345678, 0xAABBCCDD, 0x00000001];
>         let bytes = as_byte_slice(&numbers);
> 
>         assert_eq!(bytes.len(), 12); // 3 * 4 bytes
>         
>         // Verify native endianness byte layout matching
>         let reconstituted_first_u32 = u32::from_ne_bytes(bytes[0..4].try_into().unwrap());
>         assert_eq!(reconstituted_first_u32, 0x12345678);
>     }
> 
>     #[test]
>     fn test_struct_pod_dma_buffer() {
>         let reading = SensorReadings {
>             timestamp: 1600000000,
>             temperature: 25.5,
>             humidity: 60.0,
>         };
> 
>         let slice = [reading];
>         let bytes = as_byte_slice(&slice);
> 
>         assert_eq!(bytes.len(), 16); // 8 + 4 + 4 = 16 bytes
>         assert_eq!(size_of::<SensorReadings>(), 16);
>     }
> }
> ```
> 
> #### Technical Explanation
>
> 1. **Unsafe Marker Traits**: Declaring a marker trait as `unsafe trait Marker {}` signals that the compiler cannot automatically verify its contract. Implementing it requires an explicit `unsafe impl` declaring human verification of safety invariants.
> 2. **Zero-Copy Efficiency**: The `as_byte_slice` function performs an $O(1)$ memory reinterpretation pointer cast without heap allocation or buffer copying.
> 3. **Memory Safety Bounds**: Restricting `as_byte_slice` to `T: Pod` prevents passing non-POD types (e.g. `String`, `Box<T>`, or types with alignment padding), ruling out memory leaks, wild pointer dereferences, and security data exposure.
> 


---

## 6. Related Terms


- [`Send` Trait](../level_09/send_trait.md)
- [`Sized` Trait](../level_11/sized_trait.md) — Compile-time size marker trait.
- [`ZSTs` (Zero-Sized Types)](../level_11/zsts.md) — Types that occupy 0 bytes of memory.
- [Sealed Trait Pattern](sealed_trait_pattern.md) — Design pattern using private supertraits to lock trait implementations.
- [Auto Traits](../level_09/auto_traits.md) — Related concept: Auto Traits.
- [Supertraits](supertraits.md) — Related concept: Supertraits.
- [Type-State Pattern](type_state_pattern.md) — Related concept: Type-State Pattern.

---

## 7. Key Takeaways

- Marker Traits are traits with empty bodies (`pub trait Marker {}`) used to flag semantic type properties.
- Standard library marker traits include `Copy`, `Send`, `Sync`, `Sized`, and `Unpin`.
- They cost zero bytes of memory at runtime and generate zero machine code instructions.
- They allow the compiler and generic functions to enforce critical safety properties (thread safety, bitwise copyability, sanitized state) at compile time.
- Custom marker traits are paired with `PhantomData` to build state-machine validation logic (Type-State Pattern).
