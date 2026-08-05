# `MaybeUninit<T>`

> **Level 11 — Smart Pointers & Advanced Types**
> Represents possibly uninitialized memory; used in low-level code to avoid UB.

---

## 1. Prerequisites


- [`unsafe` Block](../level_13/unsafe_block.md) — The unsafe superpowers required to extract data from this wrapper.
- [Stack vs Heap](../level_15/stack_vs_heap.md) — Understanding how RAM works under the hood.

---

## 2. Term Category

**Rust-specific (the memory placeholder)**: In older languages like C or C++, you can ask the Operating System for an array of memory, and the OS will just hand you a block of RAM full of random garbage left over from whatever program used it last. This is incredibly fast, but if you accidentally read that garbage, your program crashes (Undefined Behavior) or exposes security flaws.

Rust completely forbids uninitialized memory in Safe Rust. If you want the raw speed of uninitialized memory, you must use **`MaybeUninit<T>`**, a strict wrapper that forces you to prove to the compiler that you've overwritten the garbage before you read it.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Sometimes you need to allocate a massive buffer (e.g., a 4KB array for reading a file from the hard drive). 

In safe Rust, you would write `let mut buffer = [0u8; 4096]`. This forces the CPU to physically write 4,096 zeroes into memory. If you are immediately going to overwrite those zeroes with data from the hard drive, writing the zeroes was a complete waste of CPU cycles! 

You want to skip the initialization. `MaybeUninit` allows you to allocate the 4096 bytes of garbage memory *without* paying the CPU cost of zeroing it out, but it traps that memory inside an `unsafe` API so you don't accidentally read the garbage.

### (2) Reality Metaphor

Imagine you are building a new house. 

- **Safe Rust (`[0u8; 4096]`)**: You build a brick wall. You painstakingly paint every single brick white (zero initialization). An hour later, the homeowners arrive and paint the entire wall red (the actual data). The white paint was a massive waste of time and money!
- **`MaybeUninit<T>`**: You build the brick wall and leave it covered in mud and cement dust (uninitialized garbage). You put up a massive **"CAUTION: DO NOT TOUCH"** barrier (`MaybeUninit`). When the homeowners arrive, they paint the wall red directly over the dust, and *only then* do they remove the caution barrier (`.assume_init()`). You saved hours of unnecessary white painting!

### (3) Rust Code Examples

#### Short Snippet (The Basic Workflow)
You create the uninitialized memory, you write to it, and then you use `unsafe` to promise the compiler that the garbage is gone and the data is safe to use.

```rust
use std::mem::MaybeUninit;

fn main() {
    // 1. Create a block of uninitialized garbage memory
    let mut x: MaybeUninit<u32> = MaybeUninit::uninit();

    // 2. Overwrite the garbage with real data
    x.write(100);

    // 3. Extract the real data. 
    // This requires `unsafe` because the compiler cannot mathematically 
    // prove that you actually called .write()! You are making a promise.
    let initialized_x: u32 = unsafe { x.assume_init() };

    println!("Value is: {}", initialized_x);
}
```

#### Fuller Example (The Fast Buffer)
This is the most common use case in systems programming: creating a massive uninitialized array to act as a buffer for a C-library or an Operating System read call.

```rust
use std::mem::MaybeUninit;

fn main() {
    // Create an array of 1024 garbage bytes. ZERO CPU cost!
    let mut buffer: [MaybeUninit<u8>; 1024] = unsafe { MaybeUninit::uninit().assume_init() };
    
    // Simulate an Operating System function that fills the first 3 bytes with data
    buffer[0].write(72); // 'H'
    buffer[1].write(73); // 'I'
    buffer[2].write(33); // '!'
    
    // We KNOW the first 3 bytes are safe. We use unsafe to cast those specific 
    // 3 bytes into a standard, safe &[u8] slice so the rest of our program can use it!
    let safe_slice: &[u8] = unsafe {
        // Transmute the initialized portion from `MaybeUninit<u8>` to `u8`
        std::slice::from_raw_parts(buffer.as_ptr() as *const u8, 3)
    };
    
    println!("Received: {:?}", safe_slice); // [72, 73, 33]
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Maybeuninit T Scoping and Lifecycle Rules

**The mistake:** Assuming Maybeuninit T instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("maybeuninit_t_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("maybeuninit_t_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Maybeuninit T State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Maybeuninit T through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Maybeuninit T Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Maybeuninit T instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: High-Performance Zero-Overhead Chunked Reader Buffer

**Problem:**
You are developing a high-throughput binary network protocol decoder. Standard byte buffer initialization in Rust using `[0u8; 1024]` forces the CPU to write 1024 zero bytes into stack memory before every frame read operation. When millions of network frames are processed per second, zeroing out memory that will be immediately overwritten by network I/O imposes a measurable performance penalty.

Implement a function `read_packet_frame<const N: usize>(source: &[u8]) -> Result<Vec<u8>, &'static str>` that:
1. Allocates an uninitialized stack buffer array `[MaybeUninit<u8>; N]` without paying any zero-initialization CPU overhead.
2. Reads bytes from `source` and writes them into each `MaybeUninit<u8>` slot using `.write()`.
3. If `source.len() < N`, returns `Err("Insufficient byte data for full frame")` without calling `.assume_init()`.
4. If full data is present, converts the initialized buffer safely into a `&[u8]` slice using `std::slice::from_raw_parts` and returns `Ok(slice.to_vec())`.

Write unit tests verifying frame decoding success, partial data rejection, and byte equality.

> [!check]- Answer
> ```rust
> use std::mem::MaybeUninit;
> use std::slice;
>
> /// Reads a packet frame of exact size `N` from `source` into an uninitialized stack buffer.
> pub fn read_packet_frame<const N: usize>(source: &[u8]) -> Result<Vec<u8>, &'static str> {
>     if source.len() < N {
>         return Err("Insufficient byte data for full frame");
>     }
>
>     // 1. Allocate uninitialized array on the stack — ZERO zero-initialization cost.
>     let mut buffer: [MaybeUninit<u8>; N] = [MaybeUninit::uninit(); N];
>
>     // 2. Safely populate every element of the uninitialized buffer.
>     for i in 0..N {
>         buffer[i].write(source[i]);
>     }
>
>     // 3. Extract initialized slice safely.
>     // SAFETY: We verified `source.len() >= N` and populated all N elements above.
>     let frame_slice: &[u8] = unsafe {
>         slice::from_raw_parts(buffer.as_ptr() as *const u8, N)
>     };
>
>     Ok(frame_slice.to_vec())
> }
>
> fn main() {
>     let input_data = vec![0xDE, 0xAD, 0xBE, 0xEF, 0xAA, 0xBB];
>     match read_packet_frame::<4>(&input_data) {
>         Ok(frame) => println!("Successfully decoded 4-byte frame: {:X?}", frame),
>         Err(err) => eprintln!("Failed to decode frame: {}", err),
>     }
> }
>
> #[cfg(test)]
> mod tests {
>     use super::*;
>
>     #[test]
>     fn test_read_packet_frame_success() {
>         let payload = [10u8, 20, 30, 40, 50];
>         let result = read_packet_frame::<4>(&payload);
>         assert!(result.is_ok());
>         let frame = result.unwrap();
>         assert_eq!(frame.len(), 4);
>         assert_eq!(frame, vec![10, 20, 30, 40]);
>     }
>
>     #[test]
>     fn test_read_packet_frame_insufficient_data() {
>         let payload = [10u8, 20];
>         let result = read_packet_frame::<4>(&payload);
>         assert!(result.is_err());
>         assert_eq!(result.unwrap_err(), "Insufficient byte data for full frame");
>     }
>
>     #[test]
>     fn test_read_packet_frame_exact_length() {
>         let payload = [0xFFu8, 0xFE, 0xFD];
>         let result = read_packet_frame::<3>(&payload);
>         assert!(result.is_ok());
>         assert_eq!(result.unwrap(), vec![0xFF, 0xFE, 0xFD]);
>     }
> }
> ```
>
> **Explanation:**
> 1. **Zeroing Avoidance**: `[MaybeUninit::uninit(); N]` allocates `N` bytes of memory without emitting CPU store instructions to write zeroes.
> 2. **Writing via `.write()`**: Calling `.write(val)` initializes the slot and returns a mutable reference `&mut T`. It does not attempt to drop any previous contents (which would cause UB if garbage memory was dropped).
> 3. **Unsafe Boundary**: `slice::from_raw_parts(buffer.as_ptr() as *const u8, N)` converts the `MaybeUninit<u8>` array pointer into a standard byte slice pointer. The `unsafe` block is sound because we guaranteed all `N` elements were explicitly populated prior to casting.

---

### Exercise 2: Safe Array Construction with Partial Initialization Cleanup

**Problem:**
Safe Rust allows creating array `[T; N]` with `[value; N]` only when `T` implements `Copy`. For non-`Copy` and non-`Default` types (such as custom structs or types holding heap resources), initializing array elements one by one using `MaybeUninit<T>` is required.

However, if element creation fails midway (e.g. at index `k`), elements `0..k` that were already initialized **must be manually dropped** using `assume_init_drop()` or `std::ptr::drop_in_place()` to prevent resource leaks before returning an error.

Implement `init_array_with<T, F, const N: usize>(mut generator: F) -> Result<[T; N], &'static str>` where `F: FnMut(usize) -> Result<T, &'static str>`.
- Allocate `[MaybeUninit<T>; N]`.
- Initialize elements `0..N` using `generator(i)`.
- On error at index `i`, drop previously initialized elements `0..i` safely using `buf[j].assume_init_drop()`, and return `Err`.
- On full success, extract `[T; N]` via `std::ptr::read`.

Write unit tests with a resource tracking struct `ResourceToken` to verify that all initialized tokens are cleanly dropped when initialization fails midway.

> [!check]- Answer
> ```rust
> use std::mem::MaybeUninit;
> use std::sync::atomic::{AtomicUsize, Ordering};
> use std::sync::Arc;
>
> /// Initializes an array `[T; N]` slot-by-slot using a fallible generator closure.
> /// Cleans up already-initialized elements if generation fails midway.
> pub fn init_array_with<T, F, const N: usize>(mut generator: F) -> Result<[T; N], &'static str>
> where
>     F: FnMut(usize) -> Result<T, &'static str>,
> {
>     let mut buf: [MaybeUninit<T>; N] = [MaybeUninit::uninit(); N];
>     let mut initialized_count = 0;
>
>     for i in 0..N {
>         match generator(i) {
>             Ok(val) => {
>                 buf[i].write(val);
>                 initialized_count += 1;
>             }
>             Err(err) => {
>                 // Drop already initialized elements in reverse order to prevent memory leaks.
>                 for j in (0..initialized_count).rev() {
>                     unsafe {
>                         buf[j].assume_init_drop();
>                     }
>                 }
>                 return Err(err);
>             }
>         }
>     }
>
>     // SAFETY: All N elements have been successfully initialized.
>     // We cast the pointer and read the fully initialized array.
>     unsafe { Ok(std::ptr::read(buf.as_ptr() as *const [T; N])) }
> }
>
> /// Resource tracking struct for drop monitoring.
> #[derive(Debug)]
> pub struct ResourceToken {
>     pub id: usize,
>     counter: Arc<AtomicUsize>,
> }
>
> impl ResourceToken {
>     pub fn new(id: usize, counter: Arc<AtomicUsize>) -> Self {
>         counter.fetch_add(1, Ordering::SeqCst);
>         Self { id, counter }
>     }
> }
>
> impl Drop for ResourceToken {
>     fn drop(&mut self) {
>         self.counter.fetch_sub(1, Ordering::SeqCst);
>     }
> }
>
> fn main() {
>     let counter = Arc::new(AtomicUsize::new(0));
>     let result = init_array_with::<ResourceToken, _, 3>(|idx| {
>         Ok(ResourceToken::new(idx, Arc::clone(&counter)))
>     });
>
>     if let Ok(arr) = result {
>         println!("Created array of {} resource tokens. Active count: {}", arr.len(), counter.load(Ordering::SeqCst));
>     }
> }
>
> #[cfg(test)]
> mod tests {
>     use super::*;
>
>     #[test]
>     fn test_init_array_success() {
>         let counter = Arc::new(AtomicUsize::new(0));
>         {
>             let result = init_array_with::<ResourceToken, _, 4>(|i| {
>                 Ok(ResourceToken::new(i, Arc::clone(&counter)))
>             });
>             assert!(result.is_ok());
>             let tokens = result.unwrap();
>             assert_eq!(tokens.len(), 4);
>             assert_eq!(counter.load(Ordering::SeqCst), 4);
>         }
>         // After tokens go out of scope, counter should return to 0
>         assert_eq!(counter.load(Ordering::SeqCst), 0);
>     }
>
>     #[test]
>     fn test_init_array_partial_failure_cleanup() {
>         let counter = Arc::new(AtomicUsize::new(0));
>         let result = init_array_with::<ResourceToken, _, 5>(|i| {
>             if i == 3 {
>                 Err("Failed to allocate resource at index 3")
>             } else {
>                 Ok(ResourceToken::new(i, Arc::clone(&counter)))
>             }
>         });
>
>         assert!(result.is_err());
>         assert_eq!(result.unwrap_err(), "Failed to allocate resource at index 3");
>         // Verify that indices 0, 1, 2 were cleaned up via assume_init_drop()
>         assert_eq!(counter.load(Ordering::SeqCst), 0);
>     }
> }
> ```
>
> **Explanation:**
> 1. **Partial Initialization Risk**: `MaybeUninit<T>` disables Rust's automatic destructor tracking (`Drop`). If code panics or returns early after writing 3 out of 5 non-`Copy` items into an array, Rust will NOT automatically drop those 3 items, causing a resource or memory leak.
> 2. **Explicit Cleanup**: `buf[j].assume_init_drop()` runs `T`'s destructor on the initialized memory slot `j`. We execute this in reverse order `(0..initialized_count).rev()` when an error occurs.
> 3. **Final Extraction**: `std::ptr::read(buf.as_ptr() as *const [T; N])` copies out ownership of the fully populated `[T; N]` array without running drop logic on `buf`.

---

## 3. Safe FFI Out-Pointer Pattern with C Foreign Structs

**Problem:**
Foreign Function Interfaces (FFI) to C libraries or OS syscalls frequently write output data into a caller-provided raw memory pointer ("out-pointer pattern"). Passing standard uninitialized Rust references like `&mut T` to C is Undefined Behavior if `T` is uninitialized.

`MaybeUninit<T>` is the idiomatic way to allocate uninitialized stack space for a C struct, obtain a raw mutable pointer `as_mut_ptr()`, pass it to foreign C code, check the return code, and safely call `.assume_init()` only on success.

Define a `#[repr(C)]` struct `HardwareStats`:
```rust
#[repr(C)]
#[derive(Debug, PartialEq)]
pub struct HardwareStats {
    pub cpu_usage_pct: u8,
    pub memory_free_mb: u32,
    pub temp_celsius: f32,
}
```
1. Create a simulated C FFI function:
   `unsafe extern "C" fn ffi_get_hardware_stats(out_ptr: *mut HardwareStats, simulate_error: bool) -> i32`.
   If `simulate_error` is false, write valid values to `*out_ptr` and return `0`. If true, return `-1` without modifying `*out_ptr`.
2. Write a safe Rust function `fetch_hardware_stats(simulate_error: bool) -> Result<HardwareStats, i32>` that wraps the FFI call safely using `MaybeUninit<HardwareStats>`.
3. Write unit tests asserting that successful calls return populated `HardwareStats` and failed calls return `Err(-1)` without reading uninitialized memory.

> [!check]- Answer
> ```rust
> use std::mem::MaybeUninit;
>
> #[repr(C)]
> #[derive(Debug, PartialEq, Clone)]
> pub struct HardwareStats {
>     pub cpu_usage_pct: u8,
>     pub memory_free_mb: u32,
>     pub temp_celsius: f32,
> }
>
> /// Simulated C foreign function taking an out-pointer.
> pub unsafe extern "C" fn ffi_get_hardware_stats(
>     out_ptr: *mut HardwareStats,
>     simulate_error: bool,
> ) -> i32 {
>     if simulate_error {
>         return -1; // C API error indicator
>     }
>     if !out_ptr.is_null() {
>         out_ptr.write(HardwareStats {
>             cpu_usage_pct: 42,
>             memory_free_mb: 8192,
>             temp_celsius: 55.5,
>         });
>     }
>     0 // Success code
> }
>
> /// Safe Rust wrapper around the C out-pointer FFI function.
> pub fn fetch_hardware_stats(simulate_error: bool) -> Result<HardwareStats, i32> {
>     // 1. Allocate uninitialized memory for the C struct.
>     let mut uninit_stats = MaybeUninit::<HardwareStats>::uninit();
>
>     // 2. Pass raw mutable pointer to the C FFI function.
>     let status_code = unsafe {
>         ffi_get_hardware_stats(uninit_stats.as_mut_ptr(), simulate_error)
>     };
>
>     // 3. Conditionally initialize based on C return code.
>     if status_code == 0 {
>         // SAFETY: C function returned 0, guaranteeing it fully initialized the struct.
>         unsafe { Ok(uninit_stats.assume_init()) }
>     } else {
>         // DO NOT call assume_init() on error — returning raw error code safely.
>         Err(status_code)
>     }
> }
>
> fn main() {
>     match fetch_hardware_stats(false) {
>         Ok(stats) => println!("Hardware Stats: {:?}", stats),
>         Err(code) => eprintln!("Failed to fetch stats, error code: {}", code),
>     }
> }
>
> #[cfg(test)]
> mod tests {
>     use super::*;
>
>     #[test]
>     fn test_fetch_hardware_stats_success() {
>         let result = fetch_hardware_stats(false);
>         assert!(result.is_ok());
>         let stats = result.unwrap();
>         assert_eq!(stats.cpu_usage_pct, 42);
>         assert_eq!(stats.memory_free_mb, 8192);
>         assert_eq!(stats.temp_celsius, 55.5);
>     }
>
>     #[test]
>     fn test_fetch_hardware_stats_error_handling() {
>         let result = fetch_hardware_stats(true);
>         assert!(result.is_err());
>         assert_eq!(result.unwrap_err(), -1);
>         assert!(matches!(result, Err(-1)));
>     }
> }
> ```
>
> **Explanation:**
> 1. **`#[repr(C)]` Alignment**: C foreign functions expect memory aligned according to C ABI layout rules. `MaybeUninit<HardwareStats>` preserves the exact memory layout and alignment required by `HardwareStats`.
> 2. **Out-Pointer Safety**: `uninit_stats.as_mut_ptr()` yields a raw `*mut HardwareStats` pointer. Passing this pointer to C does not violate aliasing rules because no reference `&mut HardwareStats` exists yet.
> 3. **Error Path Immunity**: If the C function fails (`status_code != 0`), `uninit_stats` is dropped naturally at function exit without executing destructors or reading raw garbage, avoiding UB.

---

## 6. Related Terms


- [`unsafe` Block](../level_13/unsafe_block.md) — The only place you will use `MaybeUninit`.
- [FFI (Foreign Function Interface)](../level_13/ffi.md) — The most common reason to use it (passing empty, uninitialized buffers to C code).

---

## 7. Key Takeaways

- **`MaybeUninit<T>`** is a wrapper that safely holds potentially uninitialized garbage memory.
- It allows you to avoid the CPU cost of zeroing out massive arrays (commonly used for File or Network buffers).
- You must manually `.write()` data into the garbage memory.
- Extracting the data requires an **`unsafe { val.assume_init() }`** block, where *you* promise the compiler that the garbage has been fully overwritten with real data.
- It permanently disables the `Drop` trait, meaning it will leak memory if you don't extract the value before it goes out of scope!
