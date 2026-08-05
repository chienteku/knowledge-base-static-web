# `Sized` Trait

> **Level 11 — Smart Pointers & Advanced Types**
> Marker trait for types with a known compile-time size; implicitly bound on generics.

---

## 1. Prerequisites


- [Dynamically Sized Types (DSTs)](dynamically_sized_types.md) — The types that do *not* implement `Sized`.
- [Generics (`<T>`)](../level_04/generics.md) — The syntax where `Sized` becomes incredibly important.

---

## 2. Term Category

**Rust Memory Model (the invisible boundary)**: `Sized` is a Marker Trait automatically applied by the compiler to any type whose exact byte size is known at compile time (e.g., `u32`, `String`, `&str`). 

It is the exact opposite of a Dynamically Sized Type (DST like `str` or `[T]`). 

The most important thing to know about `Sized` is that **the compiler secretly injects it into every single generic function you write!**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The compiler needs to mathematically guarantee if a type can safely be placed on the Stack memory. It uses the `Sized` trait to track this. If a type implements `Sized`, it goes on the Stack. If it doesn't, it is a DST and must be put behind a pointer. 

But the real magic (and confusion) happens with Generics. 

If you write a generic function `fn do_work<T>(item: &T)`, the compiler secretly rewrites it as `fn do_work<T: Sized>(item: &T)`. It automatically assumes that all generics must have a fixed size! If you try to pass a `&str` into this function, the compiler will throw an error, because the underlying `str` is a DST and does not implement `Sized`! 

To fix this, you must explicitly tell the compiler to *remove* the `Sized` restriction using the special **`?Sized`** syntax.

### (2) Reality Metaphor

Imagine a VIP Nightclub with an invisible bouncer.

- **`Sized`**: A VIP pass for people who are exactly 6 feet tall (fixed size).
- **The Generic Function (`<T>`)**: You throw a party and put up a sign that says *"Anyone is invited!"* 
- **The Invisible Bouncer**: The compiler secretly hires a bouncer who stands at the door and says, *"When the boss said 'Anyone', he secretly meant 'Anyone who is exactly 6 feet tall' (`<T: Sized`)."* If a 5-foot person (a DST) tries to enter, the bouncer aggressively rejects them!
- **`?Sized`**: You realize the bouncer is ruining your party. You walk outside and put up a new sign that says *"You do NOT need to be exactly 6 feet tall!" (`<T: ?Sized`)*. The bouncer finally relaxes and lets everyone in!

### (3) Rust Code Examples

#### Short Snippet (The Secret Injection)
When you write a normal generic function, the compiler secretly adds the `Sized` bound.

```rust
// What you write:
fn do_work<T>(item: T) { }

// What the compiler secretly compiles:
fn do_work<T: Sized>(item: T) { }
```

#### Fuller Example (The `?Sized` Escape Hatch)
Let's see what happens when we try to write a generic function that accepts a reference to *any* type, and we try to pass in a `str` (a Dynamically Sized Type).

```rust
use std::fmt::Debug;

// We write a generic function. The compiler secretly adds `T: Sized`.
fn print_data<T: Debug>(data: &T) {
    println!("{:?}", data);
}

fn main() {
    let number: i32 = 5;
    print_data(&number); // SUCCESS! i32 is Sized.
    
    let text: &str = "Hello";
    
    // COMPILE ERROR! `str` is not `Sized`!
    // print_data(text); 
}
```

How do we fix this? We use `?Sized` to tell the compiler to relax its strict rules!

```rust
use std::fmt::Debug;

// `?Sized` means: "T may or may not be Sized. I don't care, just let it in!"
fn print_data_fixed<T: Debug + ?Sized>(data: &T) {
    println!("{:?}", data);
}

fn main() {
    let text: &str = "Hello";
    print_data_fixed(text); // SUCCESS!
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Sized Trait Scoping and Lifecycle Rules

**The mistake:** Assuming Sized Trait instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("sized_trait_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("sized_trait_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Sized Trait State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Sized Trait through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Sized Trait Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Sized Trait instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Zero-Copy Telemetry Encoder for Unsized Payloads (`?Sized`)

**Problem:**
You are building a high-performance network telemetry encoder. The system must accept both fixed-size primitive payloads (such as `u64` timestamps) and dynamically sized byte buffers or text strings (such as `[u8]` slices or `str` text) without incurring heap allocations or requiring separate function overloads.

1. Define a trait `TelemetryPayload` with a method `fn write_bytes(&self, buf: &mut Vec<u8>)`.
2. Implement `TelemetryPayload` for `u64`, `str`, and `[u8]`.
3. Implement a generic function `encode_telemetry_event<T: ?Sized + TelemetryPayload>(header_id: u16, payload: &T) -> Vec<u8>` that writes the 2-byte big-endian `header_id` followed by the payload bytes.
4. Explain why omitting `?Sized` causes compile error `E0277` when passing `&str` or `&[u8]`.
5. Write complete unit tests verifying encoding of `u64`, `str`, and `[u8]` payloads using assertions (`assert_eq!`).

> [!check]- Answer
> ```rust
> use std::fmt::Display;
> 
> /// Trait implemented by telemetry payloads capable of binary serialization.
> pub trait TelemetryPayload {
>     fn write_bytes(&self, buf: &mut Vec<u8>);
> }
> 
> // Implementation for fixed-size scalar type (Sized)
> impl TelemetryPayload for u64 {
>     fn write_bytes(&self, buf: &mut Vec<u8>) {
>         buf.extend_from_slice(&self.to_be_bytes());
>     }
> }
> 
> // Implementation for unsized string slice DST (str)
> impl TelemetryPayload for str {
>     fn write_bytes(&self, buf: &mut Vec<u8>) {
>         buf.extend_from_slice(self.as_bytes());
>     }
> }
> 
> // Implementation for unsized byte slice DST ([u8])
> impl TelemetryPayload for [u8] {
>     fn write_bytes(&self, buf: &mut Vec<u8>) {
>         buf.extend_from_slice(self);
>     }
> }
> 
> /// Encodes telemetry headers and generic payloads.
> /// `T: ?Sized` allows `T` to be an unsized type (`str` or `[u8]`) passed via reference `&T`.
> pub fn encode_telemetry_event<T: ?Sized + TelemetryPayload>(header_id: u16, payload: &T) -> Vec<u8> {
>     let mut buffer = Vec::new();
>     buffer.extend_from_slice(&header_id.to_be_bytes());
>     payload.write_bytes(&mut buffer);
>     buffer
> }
> 
> fn main() {
>     // Sized payload: u64
>     let timestamp: u64 = 1700000000;
>     let bytes_u64 = encode_telemetry_event(0x01, &timestamp);
>     println!("Sized u64 payload bytes: {:?}", bytes_u64);
> 
>     // Unsized payload: str slice
>     let log_msg: &str = "SYSTEM_OK";
>     let bytes_str = encode_telemetry_event(0x02, log_msg);
>     println!("Unsized str payload bytes: {:?}", String::from_utf8_lossy(&bytes_str));
> 
>     // Unsized payload: [u8] slice
>     let raw_slice: &[u8] = &[0xAA, 0xBB, 0xCC];
>     let bytes_raw = encode_telemetry_event(0x03, raw_slice);
>     println!("Unsized [u8] payload bytes: {:?}", bytes_raw);
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_encode_sized_u64() {
>         let ts: u64 = 0x0102030405060708;
>         let encoded = encode_telemetry_event(100, &ts);
>         assert_eq!(encoded.len(), 2 + 8);
>         assert_eq!(&encoded[0..2], &100u16.to_be_bytes());
>         assert_eq!(&encoded[2..10], &ts.to_be_bytes());
>     }
> 
>     #[test]
>     fn test_encode_unsized_str() {
>         let msg: &str = "CRITICAL_ALERT";
>         let encoded = encode_telemetry_event(500, msg);
>         assert_eq!(encoded.len(), 2 + msg.len());
>         assert_eq!(&encoded[0..2], &500u16.to_be_bytes());
>         assert_eq!(&encoded[2..], msg.as_bytes());
>     }
> 
>     #[test]
>     fn test_encode_unsized_byte_slice() {
>         let data: &[u8] = &[1, 2, 3, 4, 5];
>         let encoded = encode_telemetry_event(999, data);
>         assert_eq!(encoded.len(), 2 + 5);
>         assert_eq!(&encoded[2..], &[1, 2, 3, 4, 5]);
>     }
> }
> ```
>
> **Detailed Explanation:**
> 1. **Implicit `Sized` Bounds:** By default, Rust appends `T: Sized` to every generic parameter. If you declare `fn encode<T: TelemetryPayload>(data: &T)`, the compiler interprets `T` as requiring compile-time size knowledge. When passing `&str` or `&[u8]`, `T` resolves to `str` or `[u8]` respectively. Because `str` and `[u8]` are Dynamically Sized Types (DSTs), compilation fails with error `E0277` (`the size for values of type str cannot be known at compilation time`).
> 2. **Relaxing with `?Sized`:** Specifying `T: ?Sized + TelemetryPayload` informs the compiler that `T` may or may not be sized. Because the function receives `payload: &T` (a reference), the argument itself is a fat pointer (containing pointer + length metadata), which has a fixed byte size on the stack regardless of whether `T` is sized or unsized.
> 3. **Zero-Allocation Flexibility:** This pattern allows callers to pass references to stack integers (`&u64`), string slices (`&str`), or raw slice views (`&[u8]`) into a single uniform generic function without heap-allocating intermediate container objects.

---

### Exercise 2: Designing a Custom DST Packet Struct with Unsized Coercion

**Problem:**
In binary protocol parsers, network packets often consist of a fixed-size header followed by a variable-sized payload trailing field. In Rust, a custom struct becomes a Dynamically Sized Type (DST) if its final field is unsized.

1. Define a generic struct `Packet<T: ?Sized>` containing `header_id: u32`, `flags: u8`, and `payload: T`.
2. Implement methods `id(&self) -> u32` and `payload(&self) -> &T` for `Packet<T>` where `T: ?Sized`.
3. Construct a concrete sized instance `Packet<[u8; 4]>` on the stack.
4. Demonstrate unsized coercion by borrowing `&Packet<[u8; 4]>` as `&Packet<[u8]>`.
5. Use `std::mem::size_of_val` to measure the byte size of both sized and unsized references.
6. Write unit tests validating property getters, unsized coercion, fat pointer behavior, and `Box<Packet<[u8]>>` dynamic allocation.

> [!check]- Answer
> ```rust
> use std::mem::size_of_val;
> 
> /// Custom header packet struct where `T` can be sized or unsized (DST).
> /// Declaring `T: ?Sized` permits `Packet<[u8]>` or `Packet<str>` as custom DSTs.
> #[derive(Debug)]
> pub struct Packet<T: ?Sized> {
>     pub header_id: u32,
>     pub flags: u8,
>     pub payload: T,
> }
> 
> impl<T: ?Sized> Packet<T> {
>     /// Returns the header identifier.
>     pub fn id(&self) -> u32 {
>         self.header_id
>     }
> 
>     /// Returns a reference to the payload (works for both Sized types and DSTs).
>     pub fn payload(&self) -> &T {
>         &self.payload
>     }
> }
> 
> fn main() {
>     // Concrete stack allocation using a fixed-size payload array
>     let sized_packet: Packet<[u8; 4]> = Packet {
>         header_id: 101,
>         flags: 0x01,
>         payload: [10, 20, 30, 40],
>     };
> 
>     println!("Sized packet ID: {}", sized_packet.id());
>     println!("Sized packet payload: {:?}", sized_packet.payload());
>     println!("Sized packet total bytes: {}", size_of_val(&sized_packet));
> 
>     // Unsized Coercion: &Packet<[u8; 4]> automatically coerces to &Packet<[u8]>
>     // The reference becomes a fat pointer storing the start address + payload slice length.
>     let unsized_ref: &Packet<[u8]> = &sized_packet;
> 
>     println!("Unsized ref ID: {}", unsized_ref.id());
>     println!("Unsized ref payload len: {}", unsized_ref.payload().len());
>     println!("Unsized ref total bytes (via fat pointer): {}", size_of_val(unsized_ref));
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_sized_packet_properties() {
>         let pkt = Packet {
>             header_id: 42,
>             flags: 0xFF,
>             payload: [100u8, 200u8],
>         };
>         assert_eq!(pkt.id(), 42);
>         assert_eq!(pkt.payload(), &[100, 200]);
>         assert!(size_of_val(&pkt) >= 6);
>     }
> 
>     #[test]
>     fn test_unsized_coercion_and_fat_pointer() {
>         let concrete_pkt = Packet {
>             header_id: 99,
>             flags: 0,
>             payload: [1u8, 2, 3, 4, 5, 6],
>         };
> 
>         // Coerce reference with fixed array payload into reference with unsized slice payload
>         let unsized_pkt: &Packet<[u8]> = &concrete_pkt;
> 
>         assert_eq!(unsized_pkt.id(), 99);
>         assert_eq!(unsized_pkt.payload().len(), 6);
>         assert_eq!(unsized_pkt.payload(), &[1, 2, 3, 4, 5, 6]);
> 
>         // Dynamic size checking via size_of_val on fat pointer
>         assert_eq!(size_of_val(unsized_pkt), size_of_val(&concrete_pkt));
>     }
> 
>     #[test]
>     fn test_boxed_custom_dst() {
>         // Unsized coercion works with smart pointers like Box
>         let boxed_pkt: Box<Packet<[u8]>> = Box::new(Packet {
>             header_id: 2024,
>             flags: 0x80,
>             payload: [7u8, 8, 9],
>         });
> 
>         assert_eq!(boxed_pkt.id(), 2024);
>         assert_eq!(boxed_pkt.payload(), &[7, 8, 9]);
>         assert_eq!(boxed_pkt.payload().len(), 3);
>     }
> }
> ```
>
> **Detailed Explanation:**
> 1. **Custom Dynamically Sized Types:** In Rust, if the last field of a struct has type `T` where `T: ?Sized`, the struct itself becomes unsized whenever `T` is an unsized type (e.g. `[u8]` or `str`). `Packet<[u8]>` cannot live directly on the stack because its byte layout depends on the length of the slice payload.
> 2. **Unsized Coercion:** Rust's compiler supports unsized coercion for structs with trailing unsized fields. A reference to a concrete sized packet `&Packet<[u8; N]>` can be implicitly converted into `&Packet<[u8]>`. During this conversion, the compiler constructs a fat pointer containing both the base memory address of `Packet` and the slice metadata (length `N`).
> 3. **Smart Pointer Support:** Unsized coercion applies to standard smart pointers such as `Box<T>`, `Rc<T>`, and `Arc<T>`. `Box::new(Packet { payload: [1, 2, 3], ... }) as Box<Packet<[u8]>>` allocates the payload on the heap and returns a fat pointer box.

---

### Exercise 3: In-Memory Cache with `?Sized` Borrowed Query Keys

**Problem:**
When implementing generic data structures like key-value caches or index tables storing owned keys (`String`, `Vec<u8>`), lookups should accept borrowed query slices (`&str`, `&[u8]`) to eliminate unnecessary heap allocations.

1. Implement a `CacheEngine<K, V>` wrapping `HashMap<K, V>`.
2. Implement `new()`, `insert(key: K, value: V)`, `len()`, and `is_empty()`.
3. Implement `get<Q>(&self, key: &Q) -> Option<&V>` bound by `K: Borrow<Q>` and `Q: ?Sized + Hash + Eq`.
4. Explain why `Q: ?Sized` is required on `Borrow<Q>` for lookups with `&str` and `&[u8]`.
5. Write unit tests using `assert_eq!`, `assert!`, and test assertions for owned key mutations and zero-allocation slice queries.

> [!check]- Answer
> ```rust
> use std::borrow::Borrow;
> use std::collections::HashMap;
> use std::hash::Hash;
> 
> /// In-memory cache holding owned keys `K` and values `V`.
> /// Lookup requests accept borrowed references `&Q` where `Q: ?Sized`.
> pub struct CacheEngine<K, V> {
>     storage: HashMap<K, V>,
> }
> 
> impl<K, V> CacheEngine<K, V>
> where
>     K: Eq + Hash,
> {
>     /// Creates a new empty cache.
>     pub fn new() -> Self {
>         Self {
>             storage: HashMap::new(),
>         }
>     }
> 
>     /// Inserts a key-value pair into the cache.
>     pub fn insert(&mut self, key: K, value: V) -> Option<V> {
>         self.storage.insert(key, value)
>     }
> 
>     /// Queries the cache using a reference to a borrowed key form `&Q`.
>     /// `Q: ?Sized` permits querying with unsized types like `str` or `[u8]`.
>     pub fn get<Q>(&self, key: &Q) -> Option<&V>
>     where
>         K: Borrow<Q>,
>         Q: ?Sized + Hash + Eq,
>     {
>         self.storage.get(key)
>     }
> 
>     /// Returns the number of items stored in the cache.
>     pub fn len(&self) -> usize {
>         self.storage.len()
>     }
> 
>     /// Returns true if the cache contains no elements.
>     pub fn is_empty(&self) -> bool {
>         self.storage.is_empty()
>     }
> }
> 
> fn main() {
>     let mut string_cache = CacheEngine::<String, u32>::new();
>     string_cache.insert(String::from("user_session_101"), 8080);
>     string_cache.insert(String::from("user_session_102"), 9090);
> 
>     // Query with unsized &str slice — zero String allocations required!
>     let query_str: &str = "user_session_101";
>     if let Some(port) = string_cache.get(query_str) {
>         println!("Found port for '{query_str}': {port}");
>     }
> 
>     let mut bytes_cache = CacheEngine::<Vec<u8>, String>::new();
>     bytes_cache.insert(vec![0xDE, 0xAD, 0xBE, 0xEF], String::from("ADMIN_FLAG"));
> 
>     // Query with unsized &[u8] slice
>     let query_bytes: &[u8] = &[0xDE, 0xAD, 0xBE, 0xEF];
>     if let Some(val) = bytes_cache.get(query_bytes) {
>         println!("Found entry for byte key: {val}");
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_string_key_query_with_str_slice() {
>         let mut cache = CacheEngine::new();
>         cache.insert(String::from("alpha"), 100);
>         cache.insert(String::from("beta"), 200);
> 
>         // &str slice querying owned String key (str is ?Sized)
>         let key_slice: &str = "alpha";
>         assert_eq!(cache.get(key_slice), Some(&100));
> 
>         let missing_slice: &str = "gamma";
>         assert_eq!(cache.get(missing_slice), None);
>     }
> 
>     #[test]
>     fn test_vec_key_query_with_byte_slice() {
>         let mut cache = CacheEngine::new();
>         cache.insert(vec![1, 2, 3], "payload_a");
> 
>         // &[u8] byte slice querying owned Vec<u8> key ([u8] is ?Sized)
>         let key_bytes: &[u8] = &[1, 2, 3];
>         assert_eq!(cache.get(key_bytes), Some(&"payload_a"));
> 
>         let nonexistent: &[u8] = &[9, 9, 9];
>         assert_eq!(cache.get(nonexistent), None);
>     }
> 
>     #[test]
>     fn test_cache_mutations_and_size() {
>         let mut cache = CacheEngine::new();
>         assert!(cache.is_empty());
>         assert_eq!(cache.len(), 0);
> 
>         let old_val = cache.insert(String::from("key1"), "val1");
>         assert_eq!(old_val, None);
>         assert_eq!(cache.len(), 1);
> 
>         let replaced = cache.insert(String::from("key1"), "val2");
>         assert_eq!(replaced, Some("val1"));
>         assert_eq!(cache.get("key1"), Some(&"val2"));
>     }
> }
> ```
>
> **Detailed Explanation:**
> 1. **The `std::borrow::Borrow` Trait:** `Borrow<Q>` allows a type `K` (like `String`) to be borrowed as type `Q` (like `str`). The `Borrow` trait definition in `std` is `pub trait Borrow<Borrowed: ?Sized>`. The `Borrowed` type generic is explicitly annotated with `?Sized` because the borrowed form of an owned collection is almost always an unsized slice (`str` for `String`, `[T]` for `Vec<T>`).
> 2. **Why `Q: ?Sized` is Essential:** If `Q` in `get<Q>` did not have `?Sized`, the compiler would secretly inject `Q: Sized`. Calling `cache.get("alpha")` passes `&str`, which sets `Q = str`. Since `str` does NOT implement `Sized`, the compiler would reject the call!
> 3. **Performance Optimization:** Relaxing `Sized` on query types allows callers to query maps using slice references (`&str` or `&[u8]`) without allocating temporary heap objects (`String::from(...)` or `vec![...]`).

---

## 6. Related Terms


- [Dynamically Sized Types (DSTs)](dynamically_sized_types.md) — The types (like `str`) that do *not* implement `Sized`.
- [Generics (`<T>`)](../level_04/generics.md) — The syntax where `Sized` and `?Sized` are almost exclusively used.
- [`Object Safety` (dyn-Compatibility)](../level_04/object_safety.md) — Related concept: `Object Safety` (dyn-Compatibility).
- [Marker Traits](../level_14/marker_traits.md) — Related concept: Marker Traits.

---

## 7. Key Takeaways

- **`Sized`** is an invisible marker trait automatically applied to types with a known, fixed byte size at compile time.
- The compiler **secretly injects** the `<T: Sized>` restriction into every single generic function and struct you write!
- If you want a generic function to accept Dynamically Sized Types (like `str` or `[T]`), you must explicitly remove the restriction using the **`<T: ?Sized>`** syntax.
- `?Sized` is pronounced *"May or may not be Sized"*. It is an escape hatch to relax the compiler's strict default rules!
