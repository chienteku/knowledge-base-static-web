# `ToOwned` Trait

> **Level 11 — Smart Pointers & Advanced Types**
> Generalizes `Clone` to produce an owned value *from a borrow*, even when the borrowed and owned types differ — the trait bound that makes `Cow` work.

---

## 1. Prerequisites


- [`Clone` Trait](../level_03/clone_trait.md) — The narrower trait this one generalizes.
- [`Cow<'a, T>`](cow_t.md) — The type whose entire design depends on this trait.
- [String vs &str](../level_01/string_vs_&str.md) — The canonical example of borrowed/owned types that differ.

---

## 2. Term Category

**Standard Library Trait (the borrow-to-owned bridge)**: `Clone` requires the source and result to be the **same type** (`T -> T`). `ToOwned` relaxes this: it lets a *borrowed* type produce a *different, owned* type (`&str -> String`, `&[T] -> Vec<T>`). This small generalization is exactly what's needed to make `Cow<'_, T>` possible.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

`Clone::clone(&self) -> Self` is perfect when duplicating a `String` into another `String`, or an `i32` into another `i32` — the input and output are the same type. But consider `str`: you can't `.clone()` a `&str` into an owned `str`, because `str` is a Dynamically Sized Type that can't exist as an owned, stack-allocated value at all — the *owned equivalent* of borrowed `str` data is a completely different type, `String`. `ToOwned` exists precisely to express this relationship generically: `ToOwned::to_owned(&self) -> Self::Owned`, where `Self::Owned` can be a distinct associated type. Every type that implements `Clone` gets a blanket `ToOwned` implementation for free (with `Owned = Self`), so `ToOwned` is a strict generalization, not a competing trait — and it's specifically the trait bound `Cow<'a, T>` requires on its `Borrowed` type, since `Cow` needs to be able to turn its borrowed variant into an owned one on demand.

### (2) Reality Metaphor

Imagine a print shop that can duplicate documents, but sometimes the "duplicate" has to be a fundamentally different physical format than the original.

- **`Clone`**: You hand over a photograph, and the shop hands back an identical photograph — same medium, same format, just a second physical copy.
- **`ToOwned`**: You hand over a **negative** (the borrowed, lightweight form — like `&str`), and the shop doesn't hand you back another negative. It develops the negative into a full, physical, standalone photograph (**the owned form**, `String`) — a different kind of object entirely, but unmistakably derived from and equivalent in content to what you handed in.

### (3) Rust Code Examples

#### Short Snippet (Borrowed → Owned, Different Types)
```rust
fn main() {
    let borrowed: &str = "hello";
    let owned: String = borrowed.to_owned(); // &str -> String: DIFFERENT types!

    let slice: &[i32] = &[1, 2, 3];
    let vec: Vec<i32> = slice.to_owned(); // &[i32] -> Vec<i32>: also different types!

    println!("{owned} {vec:?}");
}
```

#### Fuller Example (Why `Cow` Requires `ToOwned`, Not `Clone`)
```rust
use std::borrow::Cow;

// Cow<'a, str> needs to be able to produce a String (the OWNED form of str)
// when it needs to mutate — `Clone` couldn't express this, since `str` can't
// "clone" into another `str` (it's unsized!). It specifically needs ToOwned.
fn ensure_trailing_slash(input: &str) -> Cow<'_, str> {
    if input.ends_with('/') {
        Cow::Borrowed(input) // No allocation — we just borrow the original.
    } else {
        // .to_owned() here is ToOwned::to_owned, producing a fresh String.
        Cow::Owned(format!("{input}/"))
    }
}

fn main() {
    println!("{}", ensure_trailing_slash("/already/slashed/")); // no allocation
    println!("{}", ensure_trailing_slash("/needs/one"));        // allocates a String
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Toowned Trait Scoping and Lifecycle Rules

**The mistake:** Assuming Toowned Trait instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("toowned_trait_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("toowned_trait_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Toowned Trait State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Toowned Trait through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Toowned Trait Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Toowned Trait instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Implementing `ToOwned` and `Borrow` for a Custom Unsized Type (`PacketSlice`)

**Scenario:** In zero-copy network telemetry parsers, binary payloads are represented by custom unsized slice types (Dynamically Sized Types). Create a custom unsized struct `PacketSlice([u8])` with `repr(transparent)` and an owned payload container `OwnedPacket`. Implement `std::borrow::Borrow<PacketSlice>` for `OwnedPacket` and `ToOwned` for `PacketSlice`. Additionally, override `ToOwned::clone_into(&self, target: &mut Self::Owned)` to reuse `target`'s existing vector allocation capacity without triggering heap re-allocation. Write unit tests verifying conversion, `Cow<'a, PacketSlice>` usage, and allocation reuse.

> [!check]- Answer
> #### Technical Explanation
>
> To implement `ToOwned` for a custom unsized DST:
> 1. Mark `PacketSlice` as `repr(transparent)` around `[u8]` so pointer casts from `&[u8]` to `&PacketSlice` are valid.
> 2. Implement `Borrow<PacketSlice> for OwnedPacket` returning `&PacketSlice` created from the internal `Vec<u8>`.
> 3. Implement `ToOwned for PacketSlice` setting `type Owned = OwnedPacket` and returning a new `OwnedPacket` in `to_owned(&self)`.
> 4. Override `clone_into(&self, target: &mut Self::Owned)` to call `target.payload.clear()` followed by `extend_from_slice`, preserving existing heap capacity.
>
>
> #### Implementation
>
> ```rust
> use std::borrow::{Borrow, Cow, ToOwned};
> 
> // Custom Dynamically Sized Type (DST) wrapping a raw byte slice
> #[repr(transparent)]
> #[derive(Debug, PartialEq, Eq)]
> pub struct PacketSlice([u8]);
> 
> impl PacketSlice {
>     pub fn from_slice(slice: &[u8]) -> &Self {
>         // Safety: PacketSlice is repr(transparent) around [u8], so memory layout is identical
>         unsafe { &*(slice as *const [u8] as *const PacketSlice) }
>     }
> 
>     pub fn as_bytes(&self) -> &[u8] {
>         &self.0
>     }
> }
> 
> // Owned counterpart managing heap-allocated payload
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct OwnedPacket {
>     payload: Vec<u8>,
> }
> 
> impl OwnedPacket {
>     pub fn new(bytes: Vec<u8>) -> Self {
>         Self { payload: bytes }
>     }
> 
>     pub fn capacity(&self) -> usize {
>         self.payload.capacity()
>     }
> }
> 
> impl Borrow<PacketSlice> for OwnedPacket {
>     fn borrow(&self) -> &PacketSlice {
>         PacketSlice::from_slice(&self.payload)
>     }
> }
> 
> impl ToOwned for PacketSlice {
>     type Owned = OwnedPacket;
> 
>     fn to_owned(&self) -> Self::Owned {
>         OwnedPacket {
>             payload: self.0.to_vec(),
>         }
>     }
> 
>     // Optimization: reuse existing vector allocation of `target`
>     fn clone_into(&self, target: &mut Self::Owned) {
>         target.payload.clear();
>         target.payload.extend_from_slice(&self.0);
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_packet_slice_to_owned() {
>         let raw_data = b"GET /api/v1/health HTTP/1.1";
>         let slice = PacketSlice::from_slice(raw_data);
>         let owned: OwnedPacket = slice.to_owned();
> 
>         assert_eq!(owned.borrow(), slice);
>         assert_eq!(owned.payload, raw_data);
>     }
> 
>     #[test]
>     fn test_cow_with_packet_slice() {
>         let raw_bytes = b"PAYLOAD_V1";
>         let slice = PacketSlice::from_slice(raw_bytes);
> 
>         // Initially borrowed in Cow
>         let mut cow: Cow<PacketSlice> = Cow::Borrowed(slice);
>         assert!(matches!(cow, Cow::Borrowed(_)));
> 
>         // Mutating triggers ToOwned::to_owned under the hood
>         let owned_mut = cow.to_mut();
>         owned_mut.payload.extend_from_slice(b"_MODIFIED");
> 
>         assert!(matches!(cow, Cow::Owned(_)));
>         assert_eq!(cow.as_bytes(), b"PAYLOAD_V1_MODIFIED");
>     }
> 
>     #[test]
>     fn test_clone_into_allocation_reuse() {
>         let slice1 = PacketSlice::from_slice(b"SHORT");
>         let slice2 = PacketSlice::from_slice(b"LONGER_PAYLOAD_DATA");
> 
>         // Create an owned packet with large capacity
>         let mut owned = OwnedPacket::new(Vec::with_capacity(128));
>         owned.payload.extend_from_slice(b"INITIAL_LARGE_BUFFER_ALLOCATION");
>         let initial_cap = owned.capacity();
> 
>         // Use clone_into to overwrite `owned` with `slice1`
>         slice1.clone_into(&mut owned);
> 
>         assert_eq!(owned.borrow(), slice1);
>         // Allocation capacity should be preserved (no drop and re-allocation)
>         assert_eq!(owned.capacity(), initial_cap);
>         assert!(owned.capacity() >= 128);
> 
>         // Now overwrite with `slice2`
>         slice2.clone_into(&mut owned);
>         assert_eq!(owned.borrow(), slice2);
>         assert_eq!(owned.capacity(), initial_cap);
>     }
> }
> ```
> 
> ---
> 
> ### Exercise 2: Zero-Copy Path Normalization using `Path`, `PathBuf`, and `Cow<'a, Path>`
> 
> **Scenario:** Standard library filesystem paths (`std::path::Path`) are Dynamically Sized Types (`DST`) that cannot implement `Clone`. Consequently, zero-copy functions returning `Cow<'a, Path>` rely on `Path::to_owned(&self) -> PathBuf` provided by `ToOwned`. Write a function `normalize_request_path<'a>(path: &'a Path) -> Cow<'a, Path>` that returns `Cow::Borrowed(path)` if no relative `.` segments exist, or `Cow::Owned(PathBuf)` if path cleanup is required. Demonstrate mutating a `Cow<'a, Path>` via `to_mut()` and write unit tests checking allocation behavior and assertions.
> 
> > [!check]- Answer
> > #### Technical Explanation
>
> Because `Path` is unsized, `Cow<'a, Path>` leverages `<Path as ToOwned>::Owned = PathBuf`.
> > 1. Scan `path.components()`: if no `Component::CurDir` (`.`) is found, return `Cow::Borrowed(path)` with zero allocations.
> > 2. If relative components exist, construct a normalized `PathBuf` and wrap it in `Cow::Owned`.
> > 3. Calling `.to_mut()` on a `Cow<'a, Path>` invokes `ToOwned::to_owned(&self)` under the hood to clone `&Path` into a mutable `PathBuf`.
> >
> > ```rust
> > use std::borrow::Cow;
> > use std::path::{Component, Path, PathBuf};
> > 
> > /// Normalizes a filesystem path, avoiding allocation if the path is already clean.
> > pub fn normalize_request_path<'a>(path: &'a Path) -> Cow<'a, Path> {
> >     let mut needs_normalization = false;
> > 
> >     // First pass: check if normalization is required without allocating
> >     for component in path.components() {
> >         if matches!(component, Component::CurDir) {
> >             needs_normalization = true;
> >             break;
> >         }
> >     }
> > 
> >     if !needs_normalization {
> >         // Zero allocation: return the borrowed &Path
> >         return Cow::Borrowed(path);
> >     }
> > 
> >     // Path needs cleanup: allocate a fresh PathBuf via ToOwned
> >     let mut normalized = PathBuf::with_capacity(path.as_os_str().len());
> >     for component in path.components() {
> >         match component {
> >             Component::CurDir => continue, // Skip "."
> >             c => normalized.push(c),
> >         }
> >     }
> > 
> >     Cow::Owned(normalized)
> > }
> > 
> > #[cfg(test)]
> > mod tests {
> >     use super::*;
> > 
> >     #[test]
> >     fn test_already_clean_path_borrows() {
> >         let clean_path = Path::new("/var/www/assets/logo.png");
> >         let result = normalize_request_path(clean_path);
> > 
> >         // Verify no allocation took place
> >         assert!(matches!(result, Cow::Borrowed(_)));
> >         assert_eq!(result, clean_path);
> >     }
> > 
> >     #[test]
> >     fn test_dirty_path_allocates_owned() {
> >         let dirty_path = Path::new("/var/www/./assets/./logo.png");
> >         let result = normalize_request_path(dirty_path);
> > 
> >         // Verify heap allocation occurred
> >         assert!(matches!(result, Cow::Owned(_)));
> >         assert_eq!(result, Path::new("/var/www/assets/logo.png"));
> >     }
> > 
> >     #[test]
> >     fn test_cow_path_to_mut_triggered_by_to_owned() {
> >         let initial_path = Path::new("/etc/nginx");
> >         let mut cow_path: Cow<'_, Path> = Cow::Borrowed(initial_path);
> > 
> >         assert!(matches!(cow_path, Cow::Borrowed(_)));
> > 
> >         // to_mut() invokes ToOwned::to_owned under the hood, yielding &mut PathBuf
> >         let mutable_path_buf: &mut PathBuf = cow_path.to_mut();
> >         mutable_path_buf.push("sites-available");
> >         mutable_path_buf.push("default");
> > 
> >         assert!(matches!(cow_path, Cow::Owned(_)));
> >         assert_eq!(cow_path, Path::new("/etc/nginx/sites-available/default"));
> >     }
> > }
> > ```
> 
> ---
> 
> ### Exercise 3: Zero-Copy HTTP Query Decoder and String Buffer Reuse via `ToOwned::clone_into`
> 
> **Scenario:** High-throughput HTTP web servers parse query string parameters zero-copy (`Cow<'a, str>`) unless percent-encoding (`%XX`) requires decoding into an owned `String`. Furthermore, cached worker threads can reuse existing heap allocations across requests by utilizing `ToOwned::clone_into`. Write `decode_query_param<'a>(input: &'a str) -> Cow<'a, str>` and a `ParamCache` struct that uses `input.clone_into(&mut self.buffer)` to update cached parameter values without re-allocating memory capacity. Include unit tests with `assert_eq!`, `assert!`, and `matches!`.
> 
> > [!check]- Answer
> > #### Technical Explanation
>
> `ToOwned` enables both zero-copy string slice borrowing and in-place buffer recycling:
> > 1. `decode_query_param` checks for `%`. If absent, `Cow::Borrowed(input)` is returned with zero allocations. If present, `%XX` sequences are hex-decoded into a newly allocated `Cow::Owned(String)`.
> > 2. `ParamCache` maintains a long-lived `String` buffer. Calling `input.clone_into(&mut self.buffer)` invokes `str::clone_into`, which reuses `self.buffer`'s allocated memory capacity instead of deallocating and reallocating a new `String`.
> >
> > ```rust
> > use std::borrow::{Cow, ToOwned};
> > 
> > /// Decodes percent-encoded URL query string parameters zero-copy when possible.
> > pub fn decode_query_param<'a>(input: &'a str) -> Cow<'a, str> {
> >     if !input.contains('%') {
> >         return Cow::Borrowed(input);
> >     }
> > 
> >     let mut decoded = String::with_capacity(input.len());
> >     let mut chars = input.chars().peekable();
> > 
> >     while let Some(ch) = chars.next() {
> >         if ch == '%' {
> >             let h1 = chars.next();
> >             let h2 = chars.next();
> >             if let (Some(h1), Some(h2)) = (h1, h2) {
> >                 let hex_str: String = [h1, h2].iter().collect();
> >                 if let Ok(byte) = u8::from_str_radix(&hex_str, 16) {
> >                     decoded.push(byte as char);
> >                     continue;
> >                 }
> >             }
> >             // Fallback if invalid hex sequence
> >             decoded.push('%');
> >         } else {
> >             decoded.push(ch);
> >         }
> >     }
> > 
> >     Cow::Owned(decoded)
> > }
> > 
> > /// A recycled buffer worker demonstrating ToOwned::clone_into for allocation reuse.
> > #[derive(Debug, Default)]
> > pub struct ParamCache {
> >     buffer: String,
> > }
> > 
> > impl ParamCache {
> >     pub fn new() -> Self {
> >         Self {
> >             buffer: String::with_capacity(256),
> >         }
> >     }
> > 
> >     pub fn update(&mut self, input: &str) {
> >         // ToOwned::clone_into copies `input` (&str) into `self.buffer` (String)
> >         // reusing the existing String capacity without heap re-allocation!
> >         input.clone_into(&mut self.buffer);
> >     }
> > 
> >     pub fn get(&self) -> &str {
> >         &self.buffer
> >     }
> > 
> >     pub fn capacity(&self) -> usize {
> >         self.buffer.capacity()
> >     }
> > }
> > 
> > #[cfg(test)]
> > mod tests {
> >     use super::*;
> > 
> >     #[test]
> >     fn test_unencoded_string_is_borrowed() {
> >         let raw = "category_all_items";
> >         let result = decode_query_param(raw);
> > 
> >         assert!(matches!(result, Cow::Borrowed(_)));
> >         assert_eq!(result, "category_all_items");
> >     }
> > 
> >     #[test]
> >     fn test_encoded_string_is_owned() {
> >         let raw = "rust%20programming%21";
> >         let result = decode_query_param(raw);
> > 
> >         assert!(matches!(result, Cow::Owned(_)));
> >         assert_eq!(result, "rust programming!");
> >     }
> > 
> >     #[test]
> >     fn test_param_cache_capacity_reuse_via_clone_into() {
> >         let mut cache = ParamCache::new();
> >         let initial_cap = cache.capacity();
> >         assert!(initial_cap >= 256);
> > 
> >         // Update with first string
> >         cache.update("first_query_string");
> >         assert_eq!(cache.get(), "first_query_string");
> >         assert_eq!(cache.capacity(), initial_cap);
> > 
> >         // Update with second string
> >         cache.update("second_query_string_with_longer_content");
> >         assert_eq!(cache.get(), "second_query_string_with_longer_content");
> >         // Capacity remains unchanged because clone_into reused the allocated memory
> >         assert_eq!(cache.capacity(), initial_cap);
> >     }
> > }
> > ```
> 
> ---
> 
## 6. Related Terms

- [String vs &str](../level_01/string_vs_&str.md) — Related concept: String vs &str.
- [`Cow` for API Flexibility](../level_18/cow_for_flexibility.md) — Related concept: Cow For Flexibility.

---

## 7. Key Takeaways
> 
> - `ToOwned::to_owned(&self) -> Self::Owned` generalizes `Clone` by allowing the owned result to be a **different type** than the borrowed source.
> - Every `Clone` type automatically implements `ToOwned` too (via a blanket impl with `Owned = Self`) — `ToOwned` is a strict superset of capability.
> - `str` and `[T]` (unsized DSTs) can only implement `ToOwned` (→ `String`/`Vec<T>`), never `Clone`, since `Clone` would require returning an unsized `Self` by value.
> - `Cow<'a, T>` specifically requires `T: ToOwned`, not `T: Clone`, precisely so it can wrap DSTs like `str`.
> 
