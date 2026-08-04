# Dynamically Sized Types (DSTs)

> **Level 11 — Smart Pointers & Advanced Types**
> Types whose size is unknown at compile time (e.g. `str`, `[T]`); always used behind a pointer.

---

## 1. Prerequisites

- [`String` vs `&str`](../level_01/string_vs_&str.md) — The most famous example of a fixed vs dynamic type.
- [Trait Objects (`dyn Trait`)](../level_04/trait_objects.md) — The other incredibly common DST.

---

## 2. Term Category

**Rust Memory Model (the unstackable types)**: Dynamically Sized Types (DSTs) are types whose exact byte size cannot be known until the program is actually running. 

The three most famous examples are **`str`** (a string of unknown length), **`[T]`** (an array slice of unknown length), and **`dyn Trait`** (a trait object that could be any underlying struct). Because the compiler doesn't know how many bytes these types take up, you are mathematically forbidden from storing them directly on the Stack. They *must* be hidden behind a pointer!

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The Stack memory structure is incredibly fast, but it has one massive limitation: it requires the compiler to know the exact byte size of *every* variable at compile time. 
- A `u32` is always 4 bytes. 
- An `f64` is always 8 bytes. 

But what about a `str`? Is it `"Hi"` (2 bytes) or the entire script of *The Lord of the Rings* (3 million bytes)? The compiler doesn't know! If you try to write `let x: str = "Hello";`, the compiler panics because it doesn't know how much Stack space to reserve.

To use a DST, you must hide it behind a **Pointer** (like `&str`, `Box<str>`, or `Rc<str>`). The pointer itself is a "Fat Pointer" with a fixed size (usually 16 bytes: 8 bytes for the memory address, 8 bytes for the length), which *can* safely be placed on the Stack!

### (2) Reality Metaphor

Imagine you manage a Shipping Yard (the Stack).

- **Sized Types (`u32`, `String`)**: Customers hand you standard 20-foot metal shipping containers. You know exactly how to stack them perfectly.
- **Dynamically Sized Types (`str`, `[T]`)**: A customer hands you a container made of stretchy rubber. It could be 5 feet long, or it could be 500 feet long. You refuse to stack it! It would ruin the math of your entire shipping yard! (Compile Error). 
- **The Pointer Fix (`&str`)**: The customer puts the rubber container in a remote warehouse (the Heap or Read-Only Memory), and hands you a standard 3x5 paper Index Card. The card contains the address of the warehouse and the length of the rubber container. The Index Card is a fixed size, so you happily stack the card in your yard!

### (3) Rust Code Examples

#### Short Snippet (The Classic Compiler Error)
Every Rust beginner tries to write this code, and is immediately hit with the DST compiler error.

```rust
fn main() {
    // COMPILE ERROR: the size for values of type `str` cannot be known at compilation time!
    // let my_text: str = "Hello"; 

    // SUCCESS! We hide the `str` behind a reference (`&`). 
    // The `&str` pointer has a known, fixed size of 16 bytes!
    let my_text: &str = "Hello"; 
}
```

#### Fuller Example (Trait Objects are DSTs!)
If you write `trait Animal {}`, the type `dyn Animal` is dynamically sized! Why? Because it could be representing a 4-byte `Dog` struct, or a 1,000-byte `Elephant` struct! You cannot store it directly.

```rust
trait Animal {
    fn speak(&self);
}

struct Dog; 
impl Animal for Dog { fn speak(&self) { println!("Woof"); } }

// COMPILE ERROR: `dyn Animal` is a DST! The compiler doesn't know how big `animal` is!
// fn feed(animal: dyn Animal) { animal.speak(); }

// SUCCESS! We put the DST behind a Box (a pointer).
// The Box has a fixed size of 16 bytes on the Stack, pointing to the Heap!
fn feed_correctly(animal: Box<dyn Animal>) {
    animal.speak();
}

fn main() {
    let my_dog = Box::new(Dog);
    feed_correctly(my_dog);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Dynamically Sized Types Scoping and Lifecycle Rules

**The mistake:** Assuming Dynamically Sized Types instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("dynamically_sized_types_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("dynamically_sized_types_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Dynamically Sized Types State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Dynamically Sized Types through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Dynamically Sized Types Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Dynamically Sized Types instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Custom Struct DSTs & Unsize Coercion (`Header + [T]`)

**Problem:**
In low-level networking, binary packet formats often consist of a fixed-size header (e.g. 32-bit packet identifier) followed immediately by a dynamically sized payload byte sequence (`[u8]`). In Rust, custom structs can be Dynamically Sized Types (DSTs) if their **last field** is a DST.

1. Define a generic struct `PacketHeader<T: ?Sized>` containing two fields: `packet_id: u32` and `payload: T`.
2. Implement methods on `PacketHeader<T>` (with `T: ?Sized`) to query `packet_id(&self)` and total byte footprint `total_bytes(&self)` via `std::mem::size_of_val`.
3. Implement `payload(&self) -> &[u8]` specifically for `PacketHeader<[u8]>`.
4. Implement a helper function `create_4byte_packet(packet_id: u32, data: [u8; 4]) -> Box<PacketHeader<[u8]>>` that allocates a fixed-array packet `Box<PacketHeader<[u8; 4]>>` on the heap and leverages Rust's **unsize coercion** to return it as `Box<PacketHeader<[u8]>>`.
5. Write unit tests (`#[test]`) asserting:
   - Header field reading and payload slice contents.
   - That `size_of::<Box<PacketHeader<[u8]>>>()` is 16 bytes (fat pointer: 8-byte address + 8-byte slice length).
   - That `total_bytes()` returns 8 bytes (4 bytes for `u32` + 4 bytes for `[u8; 4]`).

> [!check]- Answer
> ```rust
> use std::mem::{size_of, size_of_val};
> 
> #[derive(Debug)]
> pub struct PacketHeader<T: ?Sized> {
>     pub packet_id: u32,
>     pub payload: T,
> }
> 
> impl<T: ?Sized> PacketHeader<T> {
>     pub fn packet_id(&self) -> u32 {
>         self.packet_id
>     }
> 
>     pub fn total_bytes(&self) -> usize {
>         size_of_val(self)
>     }
> }
> 
> impl PacketHeader<[u8]> {
>     pub fn payload(&self) -> &[u8] {
>         &self.payload
>     }
> }
> 
> pub fn create_4byte_packet(packet_id: u32, data: [u8; 4]) -> Box<PacketHeader<[u8]>> {
>     let fixed_packet = Box::new(PacketHeader {
>         packet_id,
>         payload: data,
>     });
>     // Unsize coercion automatically converts Box<PacketHeader<[u8; 4]>> to Box<PacketHeader<[u8]>>
>     fixed_packet
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_custom_dst_packet_header() {
>         let packet: Box<PacketHeader<[u8]>> = create_4byte_packet(101, [0xDE, 0xAD, 0xBE, 0xEF]);
> 
>         // Verify struct getters
>         assert_eq!(packet.packet_id(), 101);
>         assert_eq!(packet.payload(), &[0xDE, 0xAD, 0xBE, 0xEF]);
>         assert_eq!(packet.payload().len(), 4);
> 
>         // Verify fat pointer vs heap data size
>         assert_eq!(size_of::<Box<PacketHeader<[u8]>>>(), 16);
>         assert_eq!(packet.total_bytes(), 8);
>     }
> }
> ```
>
> **Explanation:**
> 1. **Custom Struct DST Rule**: In Rust, a struct is unsized (a DST) if and only if its **last field** is unsized (such as `[T]`, `str`, or `dyn Trait`). All preceding fields must be `Sized`.
> 2. **Unsize Coercion**: The compiler automatically permits converting a smart pointer to a fixed-size struct instance (like `Box<PacketHeader<[u8; 4]>>`) into a smart pointer to the unsized struct (`Box<PacketHeader<[u8]>>`).
> 3. **Fat Pointer Composition**: On the stack, `Box<PacketHeader<[u8]>>` occupies 16 bytes on 64-bit systems — 8 bytes for the heap address pointer and 8 bytes for the length metadata of the slice `[u8]`.

---

### Exercise 2: Trait Objects as DSTs & Heterogeneous Middleware Pipelines

**Problem:**
In HTTP web frameworks and RPC gateways, request processing pipelines invoke dynamic chains of middleware modules (logging, rate limiting, authentication). Because each concrete middleware struct has a different memory footprint, they cannot be stored directly by value in a contiguous stack vector `Vec<T>`. Instead, they live behind smart pointers as trait object DSTs (`dyn Middleware`).

1. Define a trait `Middleware: Send + Sync` with `fn name(&self) -> &'static str` and `fn handle(&self, request_path: &str) -> Result<String, &'static str>`.
2. Implement three middleware types:
   - `MetricsLogger`: A zero-sized unit struct (`ZST`, 0 bytes memory).
   - `ApiKeyValidator`: Holds a `valid_key: String` (24 bytes on 64-bit platforms).
   - `RateLimiter`: Holds `max_requests: u64` and `counter: Arc<AtomicU64>` (24 bytes).
3. Create a `Pipeline` holding `Vec<Box<dyn Middleware>>` with `add_stage`, `execute`, and `inspect_memory_footprints(&self) -> Vec<(&'static str, usize)>` (utilizing `size_of_val(&**stage)`).
4. Write unit tests (`#[test]`) asserting:
   - Execution pipeline results and short-circuit error handling (`matches!`).
   - That `size_of::<Box<dyn Middleware>>()` is exactly 16 bytes (data pointer + vtable pointer).
   - That `inspect_memory_footprints()` correctly reports the exact concrete byte sizes (0 bytes for `MetricsLogger`, 24 bytes for `ApiKeyValidator`, etc.).

> [!check]- Answer
> ```rust
> use std::sync::atomic::{AtomicU64, Ordering};
> use std::sync::Arc;
> use std::mem::{size_of, size_of_val};
> 
> pub trait Middleware: Send + Sync {
>     fn name(&self) -> &'static str;
>     fn handle(&self, request_path: &str) -> Result<String, &'static str>;
> }
> 
> pub struct MetricsLogger;
> 
> impl Middleware for MetricsLogger {
>     fn name(&self) -> &'static str {
>         "MetricsLogger"
>     }
>     fn handle(&self, request_path: &str) -> Result<String, &'static str> {
>         Ok(format!("[LOG] Processed {}", request_path))
>     }
> }
> 
> pub struct ApiKeyValidator {
>     pub valid_key: String,
> }
> 
> impl Middleware for ApiKeyValidator {
>     fn name(&self) -> &'static str {
>         "ApiKeyValidator"
>     }
>     fn handle(&self, request_path: &str) -> Result<String, &'static str> {
>         if request_path.contains("invalid") {
>             Err("Unauthorized API key")
>         } else {
>             Ok(format!("[AUTH] Verified key for {}", request_path))
>         }
>     }
> }
> 
> pub struct RateLimiter {
>     pub max_requests: u64,
>     pub counter: Arc<AtomicU64>,
> }
> 
> impl Middleware for RateLimiter {
>     fn name(&self) -> &'static str {
>         "RateLimiter"
>     }
>     fn handle(&self, request_path: &str) -> Result<String, &'static str> {
>         let current = self.counter.fetch_add(1, Ordering::SeqCst);
>         if current >= self.max_requests {
>             Err("Rate limit exceeded")
>         } else {
>             Ok(format!("[RATE] Request {} permitted for {}", current + 1, request_path))
>         }
>     }
> }
> 
> #[derive(Default)]
> pub struct Pipeline {
>     pub stages: Vec<Box<dyn Middleware>>,
> }
> 
> impl Pipeline {
>     pub fn new() -> Self {
>         Self { stages: Vec::new() }
>     }
> 
>     pub fn add_stage(&mut self, stage: Box<dyn Middleware>) {
>         self.stages.push(stage);
>     }
> 
>     pub fn execute(&self, path: &str) -> Result<Vec<String>, &'static str> {
>         let mut logs = Vec::new();
>         for stage in &self.stages {
>             let res = stage.handle(path)?;
>             logs.push(res);
>         }
>         Ok(logs)
>     }
> 
>     pub fn inspect_memory_footprints(&self) -> Vec<(&'static str, usize)> {
>         self.stages
>             .iter()
>             .map(|stage| (stage.name(), size_of_val(&**stage)))
>             .collect()
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_middleware_pipeline_execution() {
>         let mut pipeline = Pipeline::new();
>         pipeline.add_stage(Box::new(MetricsLogger));
>         pipeline.add_stage(Box::new(ApiKeyValidator {
>             valid_key: "secret-123".to_string(),
>         }));
>         pipeline.add_stage(Box::new(RateLimiter {
>             max_requests: 2,
>             counter: Arc::new(AtomicU64::new(0)),
>         }));
> 
>         // Execution success path
>         let res = pipeline.execute("/api/v1/resource");
>         assert!(res.is_ok());
>         let logs = res.unwrap();
>         assert_eq!(logs.len(), 3);
>         assert!(logs[0].contains("[LOG]"));
>         assert!(logs[1].contains("[AUTH]"));
>         assert!(logs[2].contains("[RATE] Request 1"));
> 
>         // Execution short-circuit path
>         let err_res = pipeline.execute("/api/v1/invalid");
>         assert!(err_res.is_err());
>         assert_eq!(err_res.unwrap_err(), "Unauthorized API key");
> 
>         // Memory footprint inspection
>         let footprints = pipeline.inspect_memory_footprints();
>         assert_eq!(footprints[0], ("MetricsLogger", 0));
>         assert_eq!(footprints[1], ("ApiKeyValidator", 24));
>         assert_eq!(footprints[2], ("RateLimiter", 24));
> 
>         // Fat pointer size on stack (Box<dyn Middleware>)
>         assert_eq!(size_of::<Box<dyn Middleware>>(), 16);
>     }
> }
> ```
>
> **Explanation:**
> 1. **`dyn Trait` as a DST**: Trait objects (`dyn Middleware`) are dynamically sized because the concrete struct behind the trait object could be 0 bytes (`MetricsLogger`) or 24 bytes (`ApiKeyValidator`).
> 2. **VTable Fat Pointer**: Because `dyn Middleware` is unsized, `Box<dyn Middleware>` stores a 16-byte fat pointer: 8 bytes pointing to the struct instance data on the heap and 8 bytes pointing to the virtual method table (vtable) containing function pointers (`name`, `handle`, `drop`).
> 3. **Polymorphic Containers**: Using `Box<dyn Middleware>` allows heterogeneous concrete types to be stored inside a uniform `Vec<Box<dyn Middleware>>` container.

---

### Exercise 3: Generic Binary Encoder with `?Sized` Trait Bounds

**Problem:**
By default, generic functions in Rust implicitly bound type parameters with `T: Sized`. This prohibits passing references to unsized types (DSTs like `str`, `[u8]`, or `[u32]`) into generic APIs as `&T`.

1. Define a trait `ToBytes: ?Sized` with methods `fn write_bytes(&self, buffer: &mut Vec<u8>)` and `fn byte_length(&self) -> usize`.
2. Implement `ToBytes` for both sized primitives (`u32`) and DST slice types (`str`, `[u8]`, `[u32]`).
3. Build a `BinaryWriter` struct with a generic method `pub fn append<T: ToBytes + ?Sized>(&mut self, item: &T)`.
4. Write unit tests (`#[test]`) asserting:
   - Binary encoding accuracy across combined calls to `append` with `u32`, `&str`, `&[u8]`, and `&[u32]`.
   - Total serialized buffer length matching `byte_length()` summations.
   - Stack size of fat pointers `size_of_val(&item)` vs raw DST payload sizes.

> [!check]- Answer
> ```rust
> use std::mem::size_of_val;
> 
> pub trait ToBytes: ?Sized {
>     fn write_bytes(&self, buffer: &mut Vec<u8>);
>     fn byte_length(&self) -> usize;
> }
> 
> impl ToBytes for str {
>     fn write_bytes(&self, buffer: &mut Vec<u8>) {
>         buffer.extend_from_slice(self.as_bytes());
>     }
>     fn byte_length(&self) -> usize {
>         self.len()
>     }
> }
> 
> impl ToBytes for [u8] {
>     fn write_bytes(&self, buffer: &mut Vec<u8>) {
>         buffer.extend_from_slice(self);
>     }
>     fn byte_length(&self) -> usize {
>         self.len()
>     }
> }
> 
> impl ToBytes for u32 {
>     fn write_bytes(&self, buffer: &mut Vec<u8>) {
>         buffer.extend_from_slice(&self.to_be_bytes());
>     }
>     fn byte_length(&self) -> usize {
>         4
>     }
> }
> 
> impl ToBytes for [u32] {
>     fn write_bytes(&self, buffer: &mut Vec<u8>) {
>         for val in self {
>             buffer.extend_from_slice(&val.to_be_bytes());
>         }
>     }
>     fn byte_length(&self) -> usize {
>         self.len() * 4
>     }
> }
> 
> #[derive(Default)]
> pub struct BinaryWriter {
>     buffer: Vec<u8>,
> }
> 
> impl BinaryWriter {
>     pub fn new() -> Self {
>         Self { buffer: Vec::new() }
>     }
> 
>     pub fn append<T: ToBytes + ?Sized>(&mut self, item: &T) {
>         item.write_bytes(&mut self.buffer);
>     }
> 
>     pub fn buffer(&self) -> &[u8] {
>         &self.buffer
>     }
> 
>     pub fn len(&self) -> usize {
>         self.buffer.len()
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_binary_writer_with_dsts() {
>         let mut writer = BinaryWriter::new();
> 
>         let header_magic: u32 = 0x12345678;
>         let text_dst: &str = "RUST";
>         let raw_bytes_dst: &[u8] = &[0xAA, 0xBB];
>         let slice_dst: &[u32] = &[0x00000001, 0x00000002];
> 
>         writer.append(&header_magic);
>         writer.append(text_dst);
>         writer.append(raw_bytes_dst);
>         writer.append(slice_dst);
> 
>         let expected_len = header_magic.byte_length()
>             + text_dst.byte_length()
>             + raw_bytes_dst.byte_length()
>             + slice_dst.byte_length();
> 
>         assert_eq!(writer.len(), expected_len);
>         assert_eq!(expected_len, 4 + 4 + 2 + 8); // 18 bytes total
> 
>         let expected_bytes: Vec<u8> = vec![
>             0x12, 0x34, 0x56, 0x78, // u32 magic
>             b'R', b'U', b'S', b'T', // str payload
>             0xAA, 0xBB,             // [u8] payload
>             0x00, 0x00, 0x00, 0x01, // [u32][0]
>             0x00, 0x00, 0x00, 0x02, // [u32][1]
>         ];
> 
>         assert_eq!(writer.buffer(), &expected_bytes[..]);
> 
>         // Stack reference size vs DST payload length
>         assert_eq!(size_of_val(&text_dst), 16); // &str fat pointer on stack
>         assert_eq!(text_dst.byte_length(), 4);  // str payload size
>     }
> }
> ```
>
> **Explanation:**
> 1. **Opting Out of `Sized`**: Generic parameter `<T>` implicitly injects `T: Sized`. Without appending `?Sized` (`T: ToBytes + ?Sized`), passing `&str` or `&[u8]` raises compiler error `E0277` because unsized types do not implement `Sized`.
> 2. **Trait Implementation on DSTs**: Implementing `ToBytes` directly for `str` or `[u8]` (rather than `&str` or `&[u8]`) makes the trait applicable to any reference type pointing to that DST (`&str`, `Box<str>`, `Arc<str>`).
> 3. **Fat Pointer Borrowing**: The method signature `append(&mut self, item: &T)` takes a reference `&T`. Even when `T` is unsized (`str`), `&T` is a fixed-size fat pointer (16 bytes), enabling safe stack pass-by-reference.

---

## 6. Related Terms

- [`Sized` Trait](../level_11/sized_trait.md) — The invisible auto-trait the compiler uses to track if a type is fixed-size or a DST.
- [Trait Objects (`dyn Trait`)](../level_04/trait_objects.md) — The most common DST other than strings and slices.

---

## 7. Key Takeaways

- **Dynamically Sized Types (DSTs)** are types whose size cannot be known at compile time.
- The "Big Three" DSTs in Rust are **`str`**, **`[T]`**, and **`dyn Trait`**.
- Because the Stack requires fixed sizes, you are mathematically forbidden from storing DSTs directly in variables!
- You **MUST** put DSTs behind a pointer (e.g. `&str`, `Box<[T]>`, `Rc<dyn Trait>`). The pointer itself is a "Fat Pointer" with a known, fixed size that can safely live on the Stack!
