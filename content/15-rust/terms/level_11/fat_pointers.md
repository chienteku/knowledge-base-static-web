# `Fat Pointers` (Wide Pointers)

> **Level 11 — Smart Pointers & Advanced Types**
> Pointers that store both a memory address and extra metadata — the mechanism that makes Dynamically Sized Types usable.

---

## 1. Prerequisites


- [Dynamically Sized Types (DSTs)](dynamically_sized_types.md) — What fat pointers exist to point at.
- [Trait Objects (`dyn Trait`)](../level_04/trait_objects.md) — The other major fat-pointer use case.

---

## 2. Term Category

**Memory Layout (the two-word pointer)**: A normal Rust reference (`&i32`) is a single machine word — just an address. A fat pointer is **two** words: an address, plus one more word of metadata. This extra word is precisely what lets a pointer refer to a type whose size isn't known until runtime.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

A `&[i32]` needs to answer two questions the moment you use it: "where does the data start?" and "how many elements are there?" A plain address alone can only answer the first question. Rather than inventing a special, different-shaped reference type just for slices, Rust generalizes: any reference to a Dynamically Sized Type is automatically a **fat pointer** — an address plus whatever metadata that specific DST needs. For `[T]`, the metadata is a `usize` length. For `str` (which is just `[u8]` with a UTF-8 guarantee), it's also a length. For `dyn Trait`, the metadata is instead a pointer to a **vtable** — a lookup table of function pointers for that trait's methods on the concrete type being stored. This is why `&dyn Trait` and `&[T]` are both twice the size of an ordinary `&T`, but for entirely different reasons: one carries a length, the other carries a vtable pointer.

### (2) Reality Metaphor

Imagine two kinds of shipping labels for packages of unknown size.

- **A thin pointer (`&i32`)** is a label with just a warehouse shelf address — enough, because every box on that kind of shelf is a guaranteed identical, standard size.
- **A fat pointer for a slice (`&[T]`)** is a label with the shelf address **plus a note: "this shipment spans exactly 12 boxes starting here"** — necessary, because shipments on this kind of shelf can be any length.
- **A fat pointer for a trait object (`&dyn Trait`)** is a label with the shelf address **plus a laminated instruction card** taped to it: "to operate this specific package, use *these* exact procedures" (**the vtable**) — because the box might be a `Dog` or an `Elephant`, and the label needs to carry along the right operating instructions for whichever one it actually is.

### (3) Rust Code Examples

#### Short Snippet (Measuring the Size Difference)
```rust
fn main() {
    use std::mem::size_of;

    println!("{}", size_of::<&i32>());      // 8 bytes (on 64-bit): just an address.
    println!("{}", size_of::<&[i32]>());    // 16 bytes: address + length (usize).
    println!("{}", size_of::<&str>());      // 16 bytes: same shape as &[u8].

    trait Speak { fn say(&self); }
    struct Dog;
    impl Speak for Dog { fn say(&self) { println!("Woof"); } }
    println!("{}", size_of::<&dyn Speak>()); // 16 bytes: address + vtable pointer.
}
```

#### Fuller Example (Two Different Kinds of "Second Word")
```rust
trait Animal { fn sound(&self) -> &str; }
struct Cat;
impl Animal for Cat { fn sound(&self) -> &str { "Meow" } }

fn main() {
    let numbers = [1, 2, 3, 4, 5];

    // Fat pointer #1: address + LENGTH metadata.
    let slice: &[i32] = &numbers[1..4];
    println!("{:?}", slice); // [2, 3, 4] — the length (3) travels WITH the pointer.

    // Fat pointer #2: address + VTABLE metadata (totally different second word!).
    let cat = Cat;
    let animal: &dyn Animal = &cat;
    println!("{}", animal.sound()); // "Meow" — found via the vtable, not a length.
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Fat Pointers Scoping and Lifecycle Rules

**The mistake:** Assuming Fat Pointers instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("fat_pointers_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("fat_pointers_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Fat Pointers State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Fat Pointers through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Fat Pointers Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Fat Pointers instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Zero-Copy Slice Fat Pointer Parser & Memory Layout Inspection

**Problem:**
In high-performance networking services, binary packet buffers (`&[u8]`) are parsed without heap allocations. In Rust, a slice reference `&[u8]` is stored as a 16-byte fat pointer (on 64-bit systems) consisting of two words: a raw data pointer (`*const u8`) and a length (`usize`).

Your task is to build a low-level packet buffer viewer `PacketBuffer`:
1. Define a `SliceRawParts` struct decorated with `#[repr(C)]` containing `data_ptr: *const u8` and `length: usize`.
2. Implement `PacketBuffer::inspect_fat_pointer<'a>(slice: &'a [u8]) -> SliceRawParts` using `std::mem::transmute` to convert the `&[u8]` fat pointer reference into `SliceRawParts`.
3. Implement `PacketBuffer::extract_raw_parts(slice: &[u8]) -> (*const u8, usize)` returning the data pointer and length.
4. Implement `unsafe fn PacketBuffer::reconstruct_slice<'a>(ptr: *const u8, len: usize) -> &'a [u8]` using `std::slice::from_raw_parts` to convert raw components back into a valid slice reference.
5. Write unit tests verifying:
   - Memory size assertions (`size_of::<&u8>() == 8` vs `size_of::<&[u8]>() == 16` on 64-bit target).
   - Correct extraction and reconstruction of payload slices.
   - Sub-slice pointer arithmetic showing that taking a slice offset advances `data_ptr` by the byte offset while reducing `length` metadata accordingly.

> [!check]- Answer
> ```rust
> use std::mem::size_of;
> use std::slice;
>
> /// Representation of a slice fat pointer layout on 64-bit platforms (data pointer + length).
> #[repr(C)]
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub struct SliceRawParts {
>     pub data_ptr: *const u8,
>     pub length: usize,
> }
>
> pub struct PacketBuffer;
>
> impl PacketBuffer {
>     /// Extracts raw pointer and length components from a byte slice.
>     pub fn extract_raw_parts(slice: &[u8]) -> (*const u8, usize) {
>         (slice.as_ptr(), slice.len())
>     }
>
>     /// Transmutes a slice reference into its raw two-word fat pointer structure.
>     pub fn inspect_fat_pointer(slice: &[u8]) -> SliceRawParts {
>         // Safety: &[u8] reference is guaranteed to be layout-compatible with `SliceRawParts`
>         unsafe { std::mem::transmute::<&[u8], SliceRawParts>(slice) }
>     }
>
>     /// Reconstructs a byte slice reference from raw data pointer and length.
>     ///
>     /// # Safety
>     /// `ptr` must be non-null, properly aligned for `u8`, and point to `len` valid initialized bytes.
>     pub unsafe fn reconstruct_slice<'a>(ptr: *const u8, len: usize) -> &'a [u8] {
>         slice::from_raw_parts(ptr, len)
>     }
> }
>
> fn main() {
>     let payload = b"POST /api/v1/ingest HTTP/1.1";
>     let raw_parts = PacketBuffer::inspect_fat_pointer(payload);
>     println!("Data Pointer: {:p}, Length: {}", raw_parts.data_ptr, raw_parts.length);
> }
>
> #[cfg(test)]
> mod tests {
>     use super::*;
>
>     #[test]
>     fn test_fat_pointer_size_and_layout() {
>         // A thin reference `&u8` is 1 word (8 bytes on 64-bit architecture)
>         assert_eq!(size_of::<&u8>(), size_of::<usize>());
>         // A slice reference `&[u8]` is a fat pointer: 2 words (16 bytes on 64-bit architecture)
>         assert_eq!(size_of::<&[u8]>(), 2 * size_of::<usize>());
>         assert_eq!(size_of::<SliceRawParts>(), size_of::<&[u8]>());
>
>         let payload = b"GET /api/v1/resource HTTP/1.1";
>         let slice: &[u8] = &payload[..];
>
>         let raw = PacketBuffer::inspect_fat_pointer(slice);
>         assert_eq!(raw.length, payload.len());
>         assert_eq!(raw.data_ptr, slice.as_ptr());
>     }
>
>     #[test]
>     fn test_slice_fat_pointer_decomposition_and_reconstruction() {
>         let original_data = b"TCP_HANDSHAKE_SYN_ACK";
>         let (ptr, len) = PacketBuffer::extract_raw_parts(original_data);
>
>         assert_eq!(len, 21);
>         assert_eq!(ptr, original_data.as_ptr());
>
>         let reconstructed = unsafe { PacketBuffer::reconstruct_slice(ptr, len) };
>         assert_eq!(reconstructed, original_data);
>     }
>
>     #[test]
>     fn test_subslice_pointer_arithmetic() {
>         let frame = [0xDEADBEEFu32, 0xCAFEBABE, 0x12345678];
>         let bytes: &[u8] = unsafe {
>             slice::from_raw_parts(frame.as_ptr() as *const u8, size_of::<[u32; 3]>())
>         };
>
>         // Subslice skipping first 4-byte integer
>         let sub_slice = &bytes[4..12];
>
>         let full_raw = PacketBuffer::inspect_fat_pointer(bytes);
>         let sub_raw = PacketBuffer::inspect_fat_pointer(sub_slice);
>
>         assert_eq!(full_raw.length, 12);
>         assert_eq!(sub_raw.length, 8);
>
>         // Data pointer advances by exactly 4 bytes
>         let byte_offset = unsafe { sub_raw.data_ptr.offset_from(full_raw.data_ptr) };
>         assert_eq!(byte_offset, 4);
>     }
> }
> ```
>
> **Step-by-Step Explanation:**
> 1. **Slice Memory Layout:** In Rust, a slice reference `&[T]` does not point to a struct containing data; it is a two-word fat pointer stored directly on the stack containing `(*const T, usize)`.
> 2. **Transmutation:** `std::mem::transmute::<&[u8], SliceRawParts>` safely converts the fat pointer reference into a C-compatible raw struct representation, proving that the second word is literally the length of the slice.
> 3. **Sub-slicing Mechanics:** When you take a slice subset `&buffer[4..12]`, Rust does not copy data or allocate memory. It simply constructs a new fat pointer on the stack whose `data_ptr` is offset by 4 bytes (`ptr + 4`) and whose `length` metadata is updated to `8`.

---

### Exercise 2: Trait Object Vtable Inspection & Dynamic Plugin Dispatch

**Problem:**
In dynamic plugin engines or extensible microservices, polymorphism is achieved via trait objects (`&dyn Plugin`). A trait object reference is a fat pointer consisting of:
1. A data pointer (`*const ()`) pointing to the concrete instance in memory.
2. A vtable pointer (`*const ()`) pointing to the compiler-generated virtual method table containing function pointers and drop glue.

Your task is to demonstrate the internal mechanics of `dyn Trait` fat pointers:
1. Define a `Plugin` trait with methods `name(&self) -> &'static str` and `process(&self, input: u32) -> u32`.
2. Implement `Plugin` for two distinct structs: `AudioProcessor` (with field `gain: u32`) and `VideoProcessor` (with field `frame_rate: u32`).
3. Define a `TraitObjectRaw` struct matching `&dyn Plugin` memory layout (`data_ptr: *const ()`, `vtable_ptr: *const ()`).
4. Write `extract_vtable(trait_obj: &dyn Plugin) -> TraitObjectRaw` using `std::mem::transmute`.
5. Write unit tests verifying:
   - Trait object fat pointer size (`size_of::<&dyn Plugin>() == 16` bytes on 64-bit).
   - Vtable pointer identity: two `&dyn Plugin` references to different `AudioProcessor` instances have **different data pointers** but share the **exact same vtable pointer**, whereas a reference to `VideoProcessor` has a **different vtable pointer**.
   - Dynamic dispatch execution over a collection of heterogenous plugin pointers (`Vec<&dyn Plugin>`).

> [!check]- Answer
> ```rust
> use std::mem::size_of;
>
> pub trait Plugin {
>     fn name(&self) -> &'static str;
>     fn process(&self, input: u32) -> u32;
> }
>
> pub struct AudioProcessor {
>     pub gain: u32,
> }
>
> impl Plugin for AudioProcessor {
>     fn name(&self) -> &'static str {
>         "AudioProcessor"
>     }
>     fn process(&self, input: u32) -> u32 {
>         input * self.gain
>     }
> }
>
> pub struct VideoProcessor {
>     pub frame_rate: u32,
> }
>
> impl Plugin for VideoProcessor {
>     fn name(&self) -> &'static str {
>         "VideoProcessor"
>     }
>     fn process(&self, input: u32) -> u32 {
>         input + self.frame_rate
>     }
> }
>
> /// Raw memory layout of a trait object reference `&dyn Plugin` on 64-bit target.
> #[repr(C)]
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub struct TraitObjectRaw {
>     pub data_ptr: *const (),
>     pub vtable_ptr: *const (),
> }
>
> pub fn extract_vtable(trait_obj: &dyn Plugin) -> TraitObjectRaw {
>     unsafe { std::mem::transmute::<&dyn Plugin, TraitObjectRaw>(trait_obj) }
> }
>
> fn main() {
>     let audio = AudioProcessor { gain: 4 };
>     let plugin_ref: &dyn Plugin = &audio;
>     let raw = extract_vtable(plugin_ref);
>     println!("Data Pointer: {:p}, Vtable Pointer: {:p}", raw.data_ptr, raw.vtable_ptr);
> }
>
> #[cfg(test)]
> mod tests {
>     use super::*;
>
>     #[test]
>     fn test_trait_object_fat_pointer_structure() {
>         assert_eq!(size_of::<&dyn Plugin>(), 2 * size_of::<usize>());
>         assert_eq!(size_of::<TraitObjectRaw>(), size_of::<&dyn Plugin>());
>
>         let audio = AudioProcessor { gain: 5 };
>         let audio_ref: &dyn Plugin = &audio;
>         let raw = extract_vtable(audio_ref);
>
>         assert!(!raw.data_ptr.is_null());
>         assert!(!raw.vtable_ptr.is_null());
>         assert_eq!(raw.data_ptr, &audio as *const AudioProcessor as *const ());
>     }
>
>     #[test]
>     fn test_vtable_pointer_identity() {
>         let audio1 = AudioProcessor { gain: 2 };
>         let audio2 = AudioProcessor { gain: 10 };
>         let video = VideoProcessor { frame_rate: 60 };
>
>         let ref_audio1: &dyn Plugin = &audio1;
>         let ref_audio2: &dyn Plugin = &audio2;
>         let ref_video: &dyn Plugin = &video;
>
>         let raw1 = extract_vtable(ref_audio1);
>         let raw2 = extract_vtable(ref_audio2);
>         let raw_video = extract_vtable(ref_video);
>
>         // Distinct stack/heap instances have unique data pointers
>         assert_ne!(raw1.data_ptr, raw2.data_ptr);
>
>         // Identical concrete types share the EXACT SAME compiler-generated vtable!
>         assert_eq!(raw1.vtable_ptr, raw2.vtable_ptr);
>
>         // Different concrete types point to DIFFERENT vtables!
>         assert_ne!(raw1.vtable_ptr, raw_video.vtable_ptr);
>     }
>
>     #[test]
>     fn test_dynamic_plugin_dispatch() {
>         let audio = AudioProcessor { gain: 3 };
>         let video = VideoProcessor { frame_rate: 30 };
>
>         let plugins: Vec<&dyn Plugin> = vec![&audio, &video];
>
>         assert_eq!(plugins[0].name(), "AudioProcessor");
>         assert_eq!(plugins[0].process(10), 30);
>
>         assert_eq!(plugins[1].name(), "VideoProcessor");
>         assert_eq!(plugins[1].process(10), 40);
>     }
> }
> ```
>
> **Step-by-Step Explanation:**
> 1. **Vtable Pointer vs Length:** Unlike slice fat pointers whose second word is a numerical length (`usize`), a trait object fat pointer's second word is a memory pointer (`*const ()`) pointing to a read-only vtable created by the compiler for that `(Type, Trait)` pair.
> 2. **Vtable Sharing:** Every instance of `AudioProcessor` coerced to `&dyn Plugin` shares the exact same static vtable in memory. This is why `raw1.vtable_ptr == raw2.vtable_ptr`.
> 3. **Dynamic Dispatch Cost:** When `plugins[0].process(10)` is called at runtime, Rust dereferences `raw1.vtable_ptr`, looks up the function pointer corresponding to `Plugin::process`, passes `raw1.data_ptr` as `&self`, and executes the function. This single indirection enables runtime polymorphism.
> 
> ---
> 
> ### Exercise 3: Custom Dynamically Sized Type (Custom DST with Trailing Payload Slice)
> 
> **Problem:**
> In high-performance kernel modules or binary messaging systems, custom DSTs are defined where a fixed-size header precedes an unsized payload slice (`[u8]`). References to such structs (e.g. `&HeaderPayloadBuffer` or `Box<HeaderPayloadBuffer>`) are also **fat pointers** carrying the length of the trailing payload slice.
> 
> Your task is to implement and inspect a custom DST struct:
> 1. Define a custom DST struct `HeaderPayloadBuffer`:
>    ```rust
>    #[repr(C)]
>    pub struct HeaderPayloadBuffer {
>        pub header_id: u32,
>        pub flags: u16,
>        pub payload: [u8],
>    }
>    ```
> 2. Implement `HeaderPayloadBuffer::new_boxed(header_id: u32, flags: u16, payload_data: &[u8]) -> Box<HeaderPayloadBuffer>` to safely construct a heap-allocated custom DST using `std::ptr::slice_from_raw_parts_mut` and `Box::from_raw`.
> 3. Write unit tests verifying:
>    - References and Boxes to custom DSTs (`&HeaderPayloadBuffer`, `Box<HeaderPayloadBuffer>`) are fat pointers (16 bytes on 64-bit target).
>    - Proper field initialization (`header_id`, `flags`, `payload`, `payload.len()`).
>    - Dynamic size calculation via `std::mem::size_of_val(&*boxed)` accurately accounting for header size, struct alignment padding, and trailing slice payload length.
> 
> > [!check]- Answer
> > ```rust
> > use std::mem::{align_of, size_of, size_of_val};
> > use std::ptr;
> >
> > #[repr(C)]
> > pub struct HeaderPayloadBuffer {
> >     pub header_id: u32,
> >     pub flags: u16,
> >     pub payload: [u8],
> > }
> >
> > impl HeaderPayloadBuffer {
> >     /// Constructs a heap-allocated `Box<HeaderPayloadBuffer>` custom DST.
> >     pub fn new_boxed(header_id: u32, flags: u16, payload_data: &[u8]) -> Box<HeaderPayloadBuffer> {
> >         let payload_len = payload_data.len();
> >
> >         // Calculate total memory size: header_id (4 bytes) + flags (2 bytes) + payload_len bytes.
> >         // Align struct to 4 bytes (max alignment of u32/u16).
> >         let raw_bytes_len = size_of::<u32>() + size_of::<u16>() + payload_len;
> >         let align = std::cmp::max(align_of::<u32>(), align_of::<u16>());
> >         let total_size = (raw_bytes_len + align - 1) & !(align - 1);
> >
> >         let mut raw_buf: Vec<u8> = vec![0u8; total_size];
> >
> >         unsafe {
> >             // Write header_id at offset 0
> >             let ptr_id = raw_buf.as_mut_ptr() as *mut u32;
> >             ptr_id.write(header_id);
> >
> >             // Write flags at offset 4
> >             let ptr_flags = raw_buf.as_mut_ptr().add(4) as *mut u16;
> >             ptr_flags.write(flags);
> >
> >             // Copy payload bytes starting at offset 6
> >             let ptr_payload = raw_buf.as_mut_ptr().add(6);
> >             ptr::copy_nonoverlapping(payload_data.as_ptr(), ptr_payload, payload_len);
> >         }
> >
> >         // Create a raw fat pointer to custom DST using slice_from_raw_parts_mut
> >         let fat_raw_ptr: *mut HeaderPayloadBuffer = ptr::slice_from_raw_parts_mut(
> >             raw_buf.as_mut_ptr() as *mut (),
> >             payload_len,
> >         ) as *mut HeaderPayloadBuffer;
> >
> >         // Prevent Vec from deallocating memory buffer on drop
> >         std::mem::forget(raw_buf);
> >
> >         // Transfer ownership to Box
> >         unsafe { Box::from_raw(fat_raw_ptr) }
> >     }
> > }
> >
> > fn main() {
> >     let boxed = HeaderPayloadBuffer::new_boxed(42, 7, b"HELLO_DST");
> >     println!("Header ID: {}, Payload: {:?}", boxed.header_id, &boxed.payload);
> >     println!("Size of Box fat pointer: {} bytes", size_of::<Box<HeaderPayloadBuffer>>());
> >     println!("Runtime byte size of custom DST: {} bytes", size_of_val(&*boxed));
> > }
> >
> > #[cfg(test)]
> > mod tests {
> >     use super::*;
> >
> >     #[test]
> >     fn test_custom_dst_fat_pointer_size() {
> >         // References and smart pointers to custom DSTs are FAT POINTERS (16 bytes on 64-bit)
> >         assert_eq!(size_of::<&HeaderPayloadBuffer>(), 2 * size_of::<usize>());
> >         assert_eq!(size_of::<Box<HeaderPayloadBuffer>>(), 2 * size_of::<usize>());
> >     }
> >
> >     #[test]
> >     fn test_custom_dst_creation_and_fields() {
> >         let payload_bytes = b"CUSTOM_DST_PAYLOAD";
> >         let boxed: Box<HeaderPayloadBuffer> = HeaderPayloadBuffer::new_boxed(
> >             0x12345678,
> >             0xABCD,
> >             payload_bytes,
> >         );
> >
> >         assert_eq!(boxed.header_id, 0x12345678);
> >         assert_eq!(boxed.flags, 0xABCD);
> >         assert_eq!(&boxed.payload, payload_bytes);
> >         assert_eq!(boxed.payload.len(), 18);
> >     }
> >
> >     #[test]
> >     fn test_custom_dst_size_of_val() {
> >         let payload_bytes = b"12345"; // 5 bytes payload
> >         let boxed = HeaderPayloadBuffer::new_boxed(1, 2, payload_bytes);
> >
> >         // Header: u32 (4 bytes) + u16 (2 bytes) = 6 bytes
> >         // Payload: 5 bytes -> Unpadded total = 11 bytes
> >         // Struct alignment (4 bytes) -> Padded size = 12 bytes
> >         let computed_size = size_of_val(&*boxed);
> >         assert_eq!(computed_size, 12);
> >     }
> > }
> > ```
> >
> > **Step-by-Step Explanation:**
> > 1. **Custom DST Structs:** When a struct ends with an unsized type (like `[u8]`), the struct itself becomes a Dynamically Sized Type (`?Sized`). It cannot exist directly on the stack without a pointer.
> > 2. **Fat Pointer Inheritance:** A pointer to a custom DST containing a trailing slice (`&HeaderPayloadBuffer`) inherits the fat pointer metadata of the unsized slice element — the second word carries `payload.len()`.
> > 3. **`size_of_val` Calculation:** `size_of_val(&*boxed)` reads the fat pointer's length metadata at runtime, adds the fixed size of `header_id` and `flags`, and pads to alignment boundaries.
> 
> ---
> 
## 6. Related Terms

- [`Object Safety` (dyn-Compatibility)](../level_04/object_safety.md) — Related concept: `Object Safety` (dyn-Compatibility).
- [`Function Pointers` (`fn()`)](../level_06/function_pointers.md) — Related concept: `Function Pointers` (`fn()`).

---

## 7. Key Takeaways
> 
> - A fat pointer is twice the size of a normal reference: an address, plus one word of metadata.
> - For slices and `str`, the metadata is a **length**. For trait objects, it's a **vtable pointer** — two structurally different kinds of "extra word."
> - Fat pointers are exactly what makes referencing a Dynamically Sized Type possible at all.
> - `String`, `Vec<T>`, and `Box<T>` (pointing at a `Sized` `T`) are themselves ordinary, thin, `Sized` types — don't confuse an owned collection's own size with the (potentially fat) pointer it holds internally.
> 
