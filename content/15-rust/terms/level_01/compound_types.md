# Compound Types

> **Level 1 — Foundations**
> Tuples `(i32, f64)` and fixed-length arrays `[i32; 5]`.

---

## 1. Prerequisites


- [Scalar Types](scalar_types.md) — The fundamental, single-value data types (integers, floats, booleans, chars) that make up compound types.

---

## 2. Term Category

**Rust-nonspecific**: Grouping multiple values together is a fundamental concept in almost all programming languages.

---

## 3. Explanation

### (1) Design Motivation — "Why does this exist in programming languages?"

If you only had scalar types, passing related data around would be a nightmare. Imagine a function that calculates 3D coordinates. Without compound types, you would have to return three separate variables, which isn't cleanly supported by most function signatures. Compound types solve this by allowing you to bundle multiple values into a single package.

In Rust, the two primitive compound types are **Tuples** and **Arrays**. 
- **Tuples** let you group multiple values of *different* types into one block. They are perfect for returning multiple values from a function.
- **Arrays** let you group multiple values of the *same* type. 

A critical design rule in Rust is that **both Tuples and Arrays have a fixed length**. Once you define them, they can never grow or shrink. This allows the Rust compiler to allocate exactly the right amount of memory on the stack, making them incredibly fast and efficient.

### (2) Reality Metaphor

- **A Tuple is like a pre-packaged lunchbox.** It has specific compartments of different sizes. Slot 0 might hold a sandwich (a string), Slot 1 might hold an apple (a character), and Slot 2 might hold a juice box (an integer). The items are different, but they are bundled together as one "lunch".
- **An Array is like an egg carton.** It has a fixed number of slots (e.g., exactly 12), and every single slot must contain the exact same type of item (an egg).

### (3) Rust Code Examples

#### Short Snippet
```rust
// A tuple grouping an integer, a float, and a character
let my_tuple: (i32, f64, char) = (500, 6.4, 'Z');

// An array containing exactly five integers
let my_array: [i32; 5] = [1, 2, 3, 4, 5];
```

#### Fuller Example
```rust
fn main() {
    // TUPLES:
    // We can access tuple elements directly using a period (dot notation)
    let coordinates = (10, 20, 30);
    println!("The X coordinate is: {}", coordinates.0);
    
    // We can also "destructure" a tuple into separate variables
    let (x, y, z) = coordinates;
    println!("Destructured: x={}, y={}, z={}", x, y, z);

    // ARRAYS:
    // Arrays are useful when you want your data allocated on the stack 
    // rather than the heap, and you know the exact size.
    let months = ["Jan", "Feb", "Mar", "Apr"];
    
    // Arrays are accessed using square brackets (zero-indexed)
    let first_month = months[0];
    println!("The first month is {}", first_month);
    
    // You can also initialize an array with the same value repeated
    // This creates an array of exactly 100 zeros: [0, 0, 0, ..., 0]
    let zero_buffer = [0; 100]; 
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Out-of-Bounds Array Indexing Causing Runtime Panics

**The mistake:** Accessing an array element using `arr[index]` where `index >= arr.len()`.

**Why it's wrong:** Direct index lookups perform bounds checks at runtime and panic if the index exceeds array size. Use `.get(index)` for safe handling.

*Incorrect:*
```rust
let arr = [1, 2, 3];
let item = arr[5]; // 💥 Runtime panic: index out of bounds!
```

*Fix:*
```rust
let arr = [1, 2, 3];
if let Some(item) = arr.get(5) {
    println!("{}", item);
}
```

### Mistake 2: Attempting Dynamic Size Extensions on Fixed-Size Tuples and Arrays

**The mistake:** Attempting to push elements onto a fixed-size Rust tuple `(i32, &str)` or array `[i32; 4]`.

**Why it's wrong:** Tuples and arrays in Rust have fixed lengths determined at compile time. Use `Vec<T>` for dynamically resizable collections.

*Incorrect:*
```rust
let mut arr = [1, 2, 3];
// arr.push(4); // ❌ Method push does not exist on array
```

*Fix:*
```rust
let mut vec = vec![1, 2, 3];
vec.push(4); // Works dynamically!
```

### Mistake 3: Accessing Tuple Elements with Square Bracket Syntax

**The mistake:** Writing `tuple[0]` instead of dot notation `tuple.0`.

**Why it's wrong:** Tuples use dot indexing (`t.0`, `t.1`) because tuple fields can have heterogeneous types.

*Incorrect:*
```rust
let t = (10, "hello");
// let val = t[0]; // ❌ Cannot index tuple with []
```

*Fix:*
```rust
let t = (10, "hello");
let val = t.0; // Correct dot indexing
```

---

## 5. Practice Exercises

### Exercise 1: IoT Sensor Packet Header Parser & Checksum Engine

**Problem Context:**
In embedded IoT systems and binary network protocols, data frames are received as fixed-size byte buffers on the stack. A telemetry sensor frame is structured as a fixed 10-byte raw frame `[u8; 10]` with the following layout:
- Bytes `[0..2]`: Magic sync bytes (`[0xAA, 0x55]`)
- Bytes `[2..4]`: 16-bit Big-Endian Device ID (`u16`)
- Bytes `[4..6]`: 16-bit Big-Endian Telemetry Reading (`u16`)
- Bytes `[6..8]`: 16-bit Big-Endian Timestamp (`u16`)
- Bytes `[8..10]`: 16-bit Big-Endian Header Checksum (`u16`) (sum of word values for magic, device ID, reading, and timestamp modulo 65536)

Implement a function `parse_sensor_packet(raw_frame: [u8; 10]) -> Result<((u16, u16, u16), u16), PacketError>` that:
1. Validates the 2-byte magic prefix using array matching. Returns `Err(PacketError::InvalidMagic)` if invalid.
2. Extracts 2-byte fixed sub-arrays `[u8; 2]` and converts them into `u16` scalars using `u16::from_be_bytes`.
3. Verifies the header checksum. If computed checksum doesn't match the packet header checksum, returns `Err(PacketError::ChecksumMismatch { expected: u16, found: u16 })`.
4. Returns `Ok(((device_id, telemetry_value, timestamp), checksum))` bundling parsed metadata into a compound tuple structure.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq)]
> pub enum PacketError {
>     InvalidMagic,
>     ChecksumMismatch { expected: u16, found: u16 },
> }
> 
> pub fn parse_sensor_packet(
>     raw_frame: [u8; 10],
> ) -> Result<((u16, u16, u16), u16), PacketError> {
>     // 1. Validate magic bytes prefix
>     let magic: [u8; 2] = [raw_frame[0], raw_frame[1]];
>     if magic != [0xAA, 0x55] {
>         return Err(PacketError::InvalidMagic);
>     }
> 
>     // 2. Extract fixed 2-byte sub-arrays for wire fields
>     let dev_bytes: [u8; 2] = [raw_frame[2], raw_frame[3]];
>     let val_bytes: [u8; 2] = [raw_frame[4], raw_frame[5]];
>     let ts_bytes: [u8; 2]  = [raw_frame[6], raw_frame[7]];
>     let chk_bytes: [u8; 2] = [raw_frame[8], raw_frame[9]];
> 
>     let device_id = u16::from_be_bytes(dev_bytes);
>     let telemetry_value = u16::from_be_bytes(val_bytes);
>     let timestamp = u16::from_be_bytes(ts_bytes);
>     let checksum = u16::from_be_bytes(chk_bytes);
> 
>     // 3. Compute expected checksum using wrapping addition
>     let magic_word = u16::from_be_bytes(magic);
>     let computed_checksum = magic_word
>         .wrapping_add(device_id)
>         .wrapping_add(telemetry_value)
>         .wrapping_add(timestamp);
> 
>     if computed_checksum != checksum {
>         return Err(PacketError::ChecksumMismatch {
>             expected: computed_checksum,
>             found: checksum,
>         });
>     }
> 
>     // 4. Return nested compound tuple
>     Ok(((device_id, telemetry_value, timestamp), checksum))
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_valid_packet_parsing() {
>         // Packet layout:
>         // magic: 0xAA55 (43605)
>         // device_id: 0x0102 (258)
>         // payload: 0x0304 (772)
>         // timestamp: 0x000A (10)
>         // checksum: 43605 + 258 + 772 + 10 = 44645 (0xAE65)
>         let raw: [u8; 10] = [
>             0xAA, 0x55,
>             0x01, 0x02,
>             0x03, 0x04,
>             0x00, 0x0A,
>             0xAE, 0x65,
>         ];
> 
>         let result = parse_sensor_packet(raw);
>         assert!(result.is_ok());
> 
>         let ((dev, val, ts), chk) = result.unwrap();
>         assert_eq!(dev, 258);
>         assert_eq!(val, 772);
>         assert_eq!(ts, 10);
>         assert_eq!(chk, 0xAE65);
>         assert_ne!(dev, val);
>     }
> 
>     #[test]
>     fn test_invalid_magic_bytes() {
>         let raw: [u8; 10] = [0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x00, 0x0A, 0x00, 0x00];
>         let result = parse_sensor_packet(raw);
>         assert!(result.is_err());
>         assert!(matches!(result, Err(PacketError::InvalidMagic)));
>     }
> 
>     #[test]
>     fn test_checksum_mismatch() {
>         let raw: [u8; 10] = [
>             0xAA, 0x55,
>             0x01, 0x02,
>             0x03, 0x04,
>             0x00, 0x0A,
>             0xFF, 0xFF, // Intentionally incorrect checksum
>         ];
>         let result = parse_sensor_packet(raw);
>         assert!(matches!(
>             result,
>             Err(PacketError::ChecksumMismatch { expected: 0xAE65, found: 0xFFFF })
>         ));
>     }
> }
> ```
>
> #### Technical Explanation
>
> - **Fixed Array Stack Allocation (`[u8; 10]` & `[u8; 2]`):** Fixed arrays are stored directly on the stack without heap pointers or allocator indirection. Passing `[u8; 10]` by value copies 10 contiguous bytes cleanly into the function frame.
> - **Byte Chunk Extraction & Type Conversion:** Array indexing `[raw_frame[0], raw_frame[1]]` constructs stack-allocated 2-byte fixed arrays `[u8; 2]`. The `u16::from_be_bytes` method converts Big-Endian wire bytes into CPU native integers deterministically across architectures.
> - **Compound Tuple Return Types:** Bundling metadata into a nested tuple `((u16, u16, u16), u16)` allows returning heterogeneous data groupings without allocating dynamic structs or heap containers.
> - **Pattern Matching & Error Invariants:** Custom `enum PacketError` paired with `Result` guarantees panic-free binary frame validation.
>

---

### Exercise 2: Zero-Allocation Quantitative Trading Rolling Metrics Window

**Problem Context:**
Ultra-low-latency financial trading algorithms cannot allocate memory dynamically (e.g., `Vec::push`) during market execution because memory allocator calls introduce non-deterministic CPU pause times. Instead, trade prices are ingested into fixed-capacity const generic arrays `[f64; N]` acting as a circular buffer on the stack.

Implement a stack-based rolling price statistics buffer `RollingMetrics<const N: usize>` that tracks trade ticks and calculates real-time metrics:
1. `data: [f64; N]` initialized using array repeat syntax `[0.0; N]`.
2. `count: usize` tracking the total number of ingested ticks.
3. `head: usize` pointing to the next overwrite index in the ring array.
4. Implement `new() -> Self` and `record_tick(&mut self, price: f64)`.
5. Implement `compute_stats(&self) -> Result<(f64, f64, f64, usize), &'static str>` returning a metric tuple `(mean, min, max, active_sample_count)`. If `count == 0`, return `Err("No market data recorded")`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone)]
> pub struct RollingMetrics<const N: usize> {
>     data: [f64; N],
>     count: usize,
>     head: usize,
> }
> 
> impl<const N: usize> RollingMetrics<N> {
>     pub fn new() -> Self {
>         assert!(N > 0, "Capacity must be greater than zero");
>         Self {
>             data: [0.0; N],
>             count: 0,
>             head: 0,
>         }
>     }
> 
>     pub fn record_tick(&mut self, price: f64) {
>         self.data[self.head] = price;
>         self.head = (self.head + 1) % N;
>         self.count = self.count.saturating_add(1);
>     }
> 
>     pub fn compute_stats(&self) -> Result<(f64, f64, f64, usize), &'static str> {
>         if self.count == 0 {
>             return Err("No market data recorded");
>         }
> 
>         let active_len = N.min(self.count);
>         let active_slice = &self.data[..active_len];
> 
>         let mut sum = 0.0;
>         let mut min = f64::INFINITY;
>         let mut max = f64::NEG_INFINITY;
> 
>         for &price in active_slice {
>             sum += price;
>             if price < min {
>                 min = price;
>             }
>             if price > max {
>                 max = price;
>             }
>         }
> 
>         let mean = sum / active_len as f64;
>         Ok((mean, min, max, active_len))
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_empty_buffer_stats() {
>         let metrics: RollingMetrics<4> = RollingMetrics::new();
>         let stats = metrics.compute_stats();
>         assert!(stats.is_err());
>         assert!(matches!(stats, Err("No market data recorded")));
>     }
> 
>     #[test]
>     fn test_partial_fill_and_overwriting() {
>         let mut metrics: RollingMetrics<3> = RollingMetrics::new();
>         metrics.record_tick(100.0);
>         metrics.record_tick(104.0);
> 
>         let (mean, min, max, active) = metrics.compute_stats().unwrap();
>         assert_eq!(active, 2);
>         assert_eq!(mean, 102.0);
>         assert_eq!(min, 100.0);
>         assert_eq!(max, 104.0);
> 
>         // Fill remaining slot
>         metrics.record_tick(108.0);
>         let (mean2, min2, max2, active2) = metrics.compute_stats().unwrap();
>         assert_eq!(active2, 3);
>         assert_eq!(mean2, 104.0);
>         assert_eq!(min2, 100.0);
>         assert_eq!(max2, 108.0);
> 
>         // Overwrite oldest entry (100.0 replaced by 110.0)
>         metrics.record_tick(110.0);
>         let (mean3, min3, max3, active3) = metrics.compute_stats().unwrap();
>         assert_eq!(active3, 3);
>         assert_eq!(min3, 104.0);
>         assert_eq!(max3, 110.0);
>         assert_ne!(min3, 100.0);
>         assert!(matches!(metrics.compute_stats(), Ok((107.33333333333333, 104.0, 110.0, 3))));
>     }
> }
> ```
>
> #### Technical Explanation
>
> - **Const Generic Fixed Array (`[f64; N]`):** Using const generics `const N: usize`, the compiler constructs stack space tailored exactly to size `N` without dynamic allocation overhead.
> - **Array Repeat Syntax (`[0.0; N]`):** `[0.0; N]` constructs an array of size `N` populated entirely with `0.0`. This requires the element type to implement the `Copy` trait (which primitive `f64` does).
> - **Ring Buffer Indexing & Mutability:** `self.head = (self.head + 1) % N` provides zero-allocation circular buffer bounds wrapping. Array elements are updated in-place via `self.data[self.head] = price`.
> - **Array Slice Indexing (`&self.data[..active_len]`):** Slicing a fixed array allows safely iterating over only the populated active slots when `self.count < N`.
>

---

### Exercise 3: Autonomous Mobile Robot Spatial Occupancy Grid Analyzer

**Problem Context:**
An autonomous mobile robot constructs a local 2D spatial grid map stored as a 4x4 nested array `[[u8; 4]; 4]` representing obstacle density per grid cell (0 = empty, 255 = impenetrable obstacle). Grid positions and bounding region coordinates are represented using 2D tuples `(usize, usize)`.

Implement position translation and regional safety risk evaluation:
1. `type Coordinate = (usize, usize);`
2. `type ObstacleGrid = [[u8; 4]; 4];`
3. `fn transform_coordinate(coord: Coordinate, delta: (i32, i32)) -> Result<Coordinate, &'static str>`: Applies `(dx, dy)` shift to coordinate `(x, y)`. If the resulting index falls outside grid dimensions `[0..4)`, return `Err("Coordinate out of bounds")`.
4. `fn evaluate_region(grid: &ObstacleGrid, top_left: Coordinate, bottom_right: Coordinate) -> Result<(usize, u8, bool), &'static str>`:
   - Verifies bounding box limits: `top_left.0 <= bottom_right.0 < 4` and `top_left.1 <= bottom_right.1 < 4`. Returns `Err("Invalid region bounds")` on illegal bounds.
   - Scans the rectangular subgrid using nested array indexing `grid[row][col]`.
   - Computes: total occupied cell count (where `cell > 0`), peak obstacle density value, and emergency collision flag (`true` if peak density >= 128).
   - Returns compound tuple `Ok((occupied_count, max_density, is_critical))`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub type Coordinate = (usize, usize);
> pub type ObstacleGrid = [[u8; 4]; 4];
> 
> pub fn transform_coordinate(
>     coord: Coordinate,
>     delta: (i32, i32),
> ) -> Result<Coordinate, &'static str> {
>     let (x, y) = coord;
>     let (dx, dy) = delta;
> 
>     let new_x = (x as i32) + dx;
>     let new_y = (y as i32) + dy;
> 
>     if new_x < 0 || new_x >= 4 || new_y < 0 || new_y >= 4 {
>         return Err("Coordinate out of bounds");
>     }
> 
>     Ok((new_x as usize, new_y as usize))
> }
> 
> pub fn evaluate_region(
>     grid: &ObstacleGrid,
>     top_left: Coordinate,
>     bottom_right: Coordinate,
> ) -> Result<(usize, u8, bool), &'static str> {
>     let (r_min, c_min) = top_left;
>     let (r_max, c_max) = bottom_right;
> 
>     if r_min > r_max || c_min > c_max || r_max >= 4 || c_max >= 4 {
>         return Err("Invalid region bounds");
>     }
> 
>     let mut occupied_count = 0;
>     let mut max_density = 0u8;
> 
>     for r in r_min..=r_max {
>         for c in c_min..=c_max {
>             let density = grid[r][c];
>             if density > 0 {
>                 occupied_count += 1;
>                 if density > max_density {
>                     max_density = density;
>                 }
>             }
>         }
>     }
> 
>     let is_critical = max_density >= 128;
>     Ok((occupied_count, max_density, is_critical))
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_transform_coordinate_valid_and_oob() {
>         let origin: Coordinate = (1, 1);
>         let moved = transform_coordinate(origin, (2, -1));
>         assert!(moved.is_ok());
>         assert_eq!(moved.unwrap(), (3, 0));
> 
>         let oob = transform_coordinate(origin, (-2, 0));
>         assert!(oob.is_err());
>         assert!(matches!(oob, Err("Coordinate out of bounds")));
>     }
> 
>     #[test]
>     fn test_evaluate_region_success() {
>         let grid: ObstacleGrid = [
>             [0,   0,   0,   0],
>             [0,  50, 200,   0],
>             [0,   0,  10,   0],
>             [0,   0,   0,   0],
>         ];
> 
>         let result = evaluate_region(&grid, (1, 1), (2, 2));
>         assert!(result.is_ok());
> 
>         let (count, max_d, critical) = result.unwrap();
>         assert_eq!(count, 3);
>         assert_eq!(max_d, 200);
>         assert!(critical);
>         assert_ne!(count, 4);
>     }
> 
>     #[test]
>     fn test_evaluate_region_invalid_bounds() {
>         let grid: ObstacleGrid = [[0; 4]; 4];
>         let bad_min_max = evaluate_region(&grid, (2, 2), (1, 1));
>         assert!(matches!(bad_min_max, Err("Invalid region bounds")));
> 
>         let out_of_grid = evaluate_region(&grid, (0, 0), (4, 4));
>         assert!(matches!(out_of_grid, Err("Invalid region bounds")));
>     }
> }
> ```
>
> #### Technical Explanation
>
> - **Nested Fixed Arrays (`[[u8; 4]; 4]`):** In Rust, multi-dimensional fixed arrays are represented as arrays of arrays. Memory is contiguous on the stack in row-major order (`4 * 4 = 16` bytes total). Element lookup uses sequential bracket indexing `grid[row][col]`.
> - **2D Coordinate Tuples (`(usize, usize)`):** Coordinates are cleanly modeled as 2-tuples. Destructuring syntax `let (x, y) = coord;` extracts coordinate axes safely.
> - **Bounds Checking & Overflow Safety:** Converting `usize` coordinates to signed `i32` before adding relative displacement `(i32, i32)` prevents integer underflow when moving negative distances.
> - **Compound Metric Return Types:** Returning `(usize, u8, bool)` bundles count, maximum density, and risk alert into a lightweight tuple without requiring heap structures.
>

---

## 6. Related Terms


- [Scalar Types](scalar_types.md) — The individual primitive values that are placed inside compound types.
- [Variable](variable.md) — You bind compound types to variables just like scalar types.
- [Struct](../level_02/struct.md) — A more advanced way to group multiple values together using named fields instead of numbered indices.
- [`Vec<T>`](../level_02/vec_t.md) — The heap-allocated, dynamic version of an array that *can* grow and shrink.
- [Arrays and Slices (`[T; N]`, `&[T]`)](array_and_slice.md) — Fixed-size arrays.

---

## 7. Key Takeaways

- **Tuples** group multiple values of *different* types. Access elements using a dot (e.g., `tuple.0`).
- **Arrays** group multiple values of the *same* type. Access elements using brackets (e.g., `array[0]`).
- Both primitive Tuples and Arrays have a **fixed length** known at compile-time. They cannot grow or shrink.
- Rust actively prevents you from accessing array memory out-of-bounds, choosing to panic safely rather than read corrupted data.
