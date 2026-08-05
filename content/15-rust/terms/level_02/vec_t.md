# `Vec<T>`

> **Level 2 — Control Flow & Data Structures**
> A growable, heap-allocated array (vector). The most common collection type.

---

## 1. Prerequisites


- [Compound Types](../level_01/compound_types.md) — Specifically Arrays (`[T; N]`), which are the fixed-size cousin of Vectors.
- [`Option<T>`](option_t.md) — Used heavily when safely reading data out of a Vector.

---

## 2. Term Category

**Rust-nonspecific**: Vectors (also called dynamic arrays) are a fundamental data structure in computer science. They exist in almost every language under different names: `ArrayList` in Java, `list` in Python, `Array` in JavaScript, and `std::vector` in C++.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

The standard [Array](../level_01/compound_types.md) in Rust (`[T; N]`) is incredibly fast because it is stored directly on the Stack memory. However, it is rigid. Its size must be perfectly known at compile-time, and it can never grow or shrink. 

In the real world, you rarely know exactly how much data you will process. For example, how many users will sign up for your app? How many lines are in a text file?

Rust provides the **Vector** (`Vec<T>`) to solve this. It is a dynamic array that stores its data on the **Heap** memory. Because the Heap is flexible, a Vector can dynamically grow and shrink while your program is running. It is the single most commonly used collection in Rust.

### (2) Reality Metaphor

A standard Array is like a **Styrofoam Egg Carton**. It holds exactly 12 eggs. If you try to put a 13th egg in it, it physically cannot fit, and the structure breaks.

A Vector is like a **Magic Storage Box**. You start putting items into the box. If the box gets completely full, it magically calls the storage facility (the Heap), asks for a brand new box that is twice as big, moves all your items into the new box, and throws the old one away. This allows you to keep adding items indefinitely!

### (3) Rust Code Examples

#### Short Snippet (Creation and Pushing)
```rust
fn main() {
    // 1. Create a new, empty Vector. 
    // We must use `mut` if we want to add things to it!
    let mut names: Vec<String> = Vec::new();
    
    // 2. Add items to the end of the Vector using `.push()`
    names.push(String::from("Alice"));
    names.push(String::from("Bob"));
    
    // 3. Remove the last item using `.pop()`
    let last_person = names.pop(); // Returns Option::Some("Bob")
}
```

#### Fuller Example (The `vec!` Macro and Safe Access)
```rust
fn main() {
    // Rust provides a handy macro `vec![]` to create a Vector with starting data.
    let numbers = vec![10, 20, 30];
    
    // How do we read the data?
    
    // Option A: Direct Indexing (DANGEROUS)
    // If you guess the index wrong, the entire program crashes (Panics).
    let third = numbers[2]; 
    println!("The third number is {}", third);
    // let oops = numbers[100]; // This line would instantly crash the program!
    
    // Option B: The `.get()` method (SAFE)
    // This returns an `Option<T>`. If the index is out of bounds, it just returns `None`.
    match numbers.get(100) {
        Some(num) => println!("The number is {}", num),
        None => println!("That index does not exist! Program didn't crash!"),
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Vec T Scoping and Lifecycle Rules

**The mistake:** Assuming Vec T instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("vec_t_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("vec_t_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Vec T State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Vec T through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Vec T Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Vec T instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: High-Frequency Trading Order Buffer Engine (`Vec<T>` Capacity & Batch Ingestion)

**Problem:** In a low-latency financial trading system, market orders arrive in dense bursts. Frequently allocating and reallocating heap memory inside critical trading loops causes memory fragmentation and unpredictable latency spikes. You must implement an order batch buffer `OrderBatchProcessor` that manages an internal `Vec<Order>`.

Requirements:
1. Define an `Order` struct containing fields: `id: u64`, `symbol: String`, `price: u64`, `quantity: u32`, `is_buy: bool`.
2. Define `OrderBatchProcessor` wrapping `orders: Vec<Order>`.
3. Implement `OrderBatchProcessor::new(capacity: usize) -> Self` to pre-allocate heap capacity using `Vec::with_capacity`.
4. Implement `ingest_batch(&mut self, new_orders: Vec<Order>) -> usize`:
   - Filter out invalid orders where `price == 0` or `quantity == 0`.
   - Calculate additional capacity needed and call `Vec::reserve` to guarantee a single contiguous heap allocation before appending valid orders via `Vec::extend`.
   - Return the count of accepted orders.
5. Implement `purge_below_price(&mut self, min_price: u64) -> usize`: Use `Vec::retain` to filter out underpriced orders in-place without reallocating underlying memory, returning the number of removed orders.
6. Implement `drain_executable(&mut self, limit: usize) -> Vec<Order>`: Use `Vec::drain` to extract up to `limit` executable orders from the front of the vector.
7. Implement `compact(&mut self)`: Use `Vec::shrink_to_fit` to yield unneeded capacity back to the OS allocator.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct Order {
>     pub id: u64,
>     pub symbol: String,
>     pub price: u64,
>     pub quantity: u32,
>     pub is_buy: bool,
> }
> 
> pub struct OrderBatchProcessor {
>     orders: Vec<Order>,
> }
> 
> impl OrderBatchProcessor {
>     pub fn new(capacity: usize) -> Self {
>         Self {
>             orders: Vec::with_capacity(capacity),
>         }
>     }
> 
>     pub fn capacity(&self) -> usize {
>         self.orders.capacity()
>     }
> 
>     pub fn len(&self) -> usize {
>         self.orders.len()
>     }
> 
>     pub fn ingest_batch(&mut self, new_orders: Vec<Order>) -> usize {
>         let valid_orders: Vec<Order> = new_orders
>             .into_iter()
>             .filter(|o| o.price > 0 && o.quantity > 0)
>             .collect();
>         let accepted_count = valid_orders.len();
> 
>         let available = self.orders.capacity().saturating_sub(self.orders.len());
>         if accepted_count > available {
>             self.orders.reserve(accepted_count - available);
>         }
> 
>         self.orders.extend(valid_orders);
>         accepted_count
>     }
> 
>     pub fn purge_below_price(&mut self, min_price: u64) -> usize {
>         let initial_len = self.orders.len();
>         self.orders.retain(|o| o.price >= min_price);
>         initial_len - self.orders.len()
>     }
> 
>     pub fn drain_executable(&mut self, limit: usize) -> Vec<Order> {
>         let drain_count = limit.min(self.orders.len());
>         self.orders.drain(0..drain_count).collect()
>     }
> 
>     pub fn compact(&mut self) {
>         self.orders.shrink_to_fit();
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_order_batch_processor() {
>         let mut processor = OrderBatchProcessor::new(10);
>         assert_eq!(processor.len(), 0);
>         assert!(processor.capacity() >= 10);
> 
>         let batch = vec![
>             Order { id: 1, symbol: "AAPL".into(), price: 150, quantity: 10, is_buy: true },
>             Order { id: 2, symbol: "AAPL".into(), price: 0, quantity: 5, is_buy: true },
>             Order { id: 3, symbol: "GOOG".into(), price: 2800, quantity: 2, is_buy: false },
>         ];
> 
>         let ingested = processor.ingest_batch(batch);
>         assert_eq!(ingested, 2);
>         assert_eq!(processor.len(), 2);
>         assert_ne!(processor.len(), 3);
> 
>         let purged = processor.purge_below_price(200);
>         assert_eq!(purged, 1);
>         assert_eq!(processor.len(), 1);
> 
>         let drained = processor.drain_executable(5);
>         assert_eq!(drained.len(), 1);
>         assert!(matches!(drained.first(), Some(o) if o.symbol == "GOOG"));
> 
>         processor.compact();
>         assert_eq!(processor.capacity(), processor.len());
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Stack Header vs Heap Allocation**: A `Vec<T>` consists of three `usize` values stored on the stack (a raw pointer `ptr` to heap memory, total buffer capacity `capacity`, and active element count `len`). Initializing with `Vec::with_capacity` allocates memory for elements upfront, preventing geometric array growth reallocations during initial batch insertion.
> 2. **Controlled Buffer Reservation**: Using `self.orders.reserve(needed)` guarantees that Rust requests a contiguous heap block large enough to fit `needed` additional items in a single reallocation pass, preventing repeated reallocation cascades.
> 3. **In-Place Purging via `retain`**: `Vec::retain` traverses the vector in $O(N)$ linear time, dropping non-matching elements and shifting retained items leftwards in memory. Crucially, `retain` does not change vector capacity or allocate temporary vectors, making it ideal for memory-constrained loops.
> 4. **Zero-Copy Batch Extraction via `drain`**: `Vec::drain(0..range)` creates a temporary iterator over a specified subslice, moving elements out of the vector while maintaining the underlying allocated memory block for future use.

---

### Exercise 2: Binary Protocol Streaming Frame Decoder (`Vec<u8>` Byte Manipulation)

**Problem:** In network server development, raw TCP streams yield fragmented byte chunks. A custom binary RPC protocol defines frames with the following structure:
- **Magic Byte**: `0xAA` (1 byte)
- **Payload Length**: 2 bytes (Big-Endian `u16`)
- **Payload Data**: $N$ bytes (where $N = \text{length}$)

Implement a stream decoder `PacketDecoder` using `Vec<u8>` that buffers incoming network bytes, safely inspects frame headers without panicking on partial data, purges corrupted bytes, and extracts valid payloads into `Packet` structs.

Requirements:
1. Define struct `Packet { pub payload: Vec<u8> }`.
2. Define enum `DecoderError { IncompleteFrame, InvalidMagic(u8), CorruptLength(usize) }`.
3. Define `PacketDecoder` wrapping `buffer: Vec<u8>`.
4. Implement `feed(&mut self, chunk: &[u8])` using `Vec::extend_from_slice`.
5. Implement `decode_next(&mut self) -> Result<Option<Packet>, DecoderError>`:
   - Safely check buffer length. If $< 3$ bytes, return `Ok(None)`.
   - Inspect leading byte using `buffer.get(0)`. If magic byte is not `0xAA`, remove it using `Vec::remove(0)` and return `Err(DecoderError::InvalidMagic(byte))`.
   - Parse `u16` payload length in Big-Endian format. If length $> 4096$, remove magic byte and return `Err(DecoderError::CorruptLength(len))`.
   - If total frame size exceeds `buffer.len()`, return `Ok(None)` to wait for subsequent socket reads.
   - Drain header and payload bytes from buffer using `Vec::drain(0..total_frame_len)` and return `Ok(Some(Packet))`.
6. Implement `clear_corrupt_data(&mut self)` using `Vec::clear`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct Packet {
>     pub payload: Vec<u8>,
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum DecoderError {
>     IncompleteFrame,
>     InvalidMagic(u8),
>     CorruptLength(usize),
> }
> 
> pub struct PacketDecoder {
>     buffer: Vec<u8>,
> }
> 
> impl PacketDecoder {
>     pub fn new() -> Self {
>         Self { buffer: Vec::new() }
>     }
> 
>     pub fn feed(&mut self, chunk: &[u8]) {
>         self.buffer.extend_from_slice(chunk);
>     }
> 
>     pub fn buffer_len(&self) -> usize {
>         self.buffer.len()
>     }
> 
>     pub fn decode_next(&mut self) -> Result<Option<Packet>, DecoderError> {
>         if self.buffer.len() < 3 {
>             return Ok(None);
>         }
> 
>         let magic = match self.buffer.get(0) {
>             Some(&b) => b,
>             None => return Ok(None),
>         };
> 
>         if magic != 0xAA {
>             let invalid = self.buffer.remove(0);
>             return Err(DecoderError::InvalidMagic(invalid));
>         }
> 
>         let len_bytes: [u8; 2] = [self.buffer[1], self.buffer[2]];
>         let payload_len = u16::from_be_bytes(len_bytes) as usize;
> 
>         if payload_len > 4096 {
>             self.buffer.remove(0);
>             return Err(DecoderError::CorruptLength(payload_len));
>         }
> 
>         let total_frame_len = 3 + payload_len;
>         if self.buffer.len() < total_frame_len {
>             return Ok(None);
>         }
> 
>         let frame_bytes: Vec<u8> = self.buffer.drain(0..total_frame_len).collect();
>         let payload = frame_bytes[3..].to_vec();
> 
>         Ok(Some(Packet { payload }))
>     }
> 
>     pub fn clear_corrupt_data(&mut self) {
>         self.buffer.clear();
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_packet_decoder() {
>         let mut decoder = PacketDecoder::new();
>         assert_eq!(decoder.buffer_len(), 0);
> 
>         let stream = vec![0xFF, 0xAA, 0x00, 0x04, 10, 20, 30, 40];
>         decoder.feed(&stream);
>         assert_ne!(decoder.buffer_len(), 0);
> 
>         let res1 = decoder.decode_next();
>         assert!(matches!(res1, Err(DecoderError::InvalidMagic(0xFF))));
> 
>         let res2 = decoder.decode_next();
>         assert!(matches!(res2, Ok(Some(_))));
>         if let Ok(Some(packet)) = res2 {
>             assert_eq!(packet.payload, vec![10, 20, 30, 40]);
>             assert!(packet.payload.len() == 4);
>         }
> 
>         assert_eq!(decoder.buffer_len(), 0);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Safe Access via `.get()` vs Panic Direct Indexing**: Direct index access like `buffer[0]` causes an unrecoverable panic if the vector is empty or out of bounds. Using `.get(0)` returns `Option<&u8>`, enabling safe error handling without crashing long-running daemons.
> 2. **Contiguous Byte Extension**: `extend_from_slice` copies bytes from borrowed slices (`&[u8]`) into the contiguous heap buffer of `Vec<u8>` in optimized batch memory copies (`memcpy`), growing buffer capacity automatically.
> 3. **Shift & Resynchronization**: Calling `Vec::remove(0)` shifts all remaining bytes left by one index. While $O(N)$ cost, for small stream framing headers it efficiently discards noisy or corrupted protocol bytes until magic byte alignment is restored.
> 4. **Header Splitting via Range Draining**: `self.buffer.drain(0..total_frame_len)` removes the exact window of bytes representing one frame while leaving remaining partial packet stream bytes intact in the buffer.

---

### Exercise 3: Time-Series Sensor Aggregator & Sliding Window (`Vec<T>` Partitioning & Slicing)

**Problem:** Edge telemetry compute nodes aggregate high-frequency sensor readings. You need to implement `TimeSeriesAggregator` to manage timestamped metric samples (`timestamp: u64`, `sensor_id: u32`, `value: f64`).

Requirements:
1. Define struct `MetricPoint { pub timestamp: u64, pub sensor_id: u32, pub value: f64 }`.
2. Define struct `WindowSummary { pub sensor_id: u32, pub count: usize, pub min: f64, pub max: f64, pub avg: f64 }`.
3. Define `TimeSeriesAggregator` wrapping `points: Vec<MetricPoint>`.
4. Implement `push_point(&mut self, point: MetricPoint)` to insert new samples.
5. Implement `prune_older_than(&mut self, cutoff_timestamp: u64)`: Drop samples with `timestamp < cutoff_timestamp` in-place using `Vec::retain`.
6. Implement `split_at_timestamp(&mut self, split_timestamp: u64) -> Vec<MetricPoint>`: Partition points into historical data (`timestamp < split_timestamp`) and current active data (`timestamp >= split_timestamp`) using `Vec::drain(..)` and `Iterator::partition`. Retain active data in `self.points` and return historical data.
7. Implement `summarize_sensor(&self, sensor_id: u32) -> Option<WindowSummary>`: Safely calculate min, max, count, and average values for a specified `sensor_id` without consuming or mutating `self.points`. Return `None` if no data exists for the sensor.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone, PartialEq)]
> pub struct MetricPoint {
>     pub timestamp: u64,
>     pub sensor_id: u32,
>     pub value: f64,
> }
> 
> #[derive(Debug, PartialEq)]
> pub struct WindowSummary {
>     pub sensor_id: u32,
>     pub count: usize,
>     pub min: f64,
>     pub max: f64,
>     pub avg: f64,
> }
> 
> pub struct TimeSeriesAggregator {
>     points: Vec<MetricPoint>,
> }
> 
> impl TimeSeriesAggregator {
>     pub fn new() -> Self {
>         Self { points: Vec::new() }
>     }
> 
>     pub fn push_point(&mut self, point: MetricPoint) {
>         self.points.push(point);
>     }
> 
>     pub fn len(&self) -> usize {
>         self.points.len()
>     }
> 
>     pub fn prune_older_than(&mut self, cutoff_timestamp: u64) {
>         self.points.retain(|p| p.timestamp >= cutoff_timestamp);
>     }
> 
>     pub fn split_at_timestamp(&mut self, split_timestamp: u64) -> Vec<MetricPoint> {
>         let (historical, current): (Vec<MetricPoint>, Vec<MetricPoint>) = self
>             .points
>             .drain(..)
>             .partition(|p| p.timestamp < split_timestamp);
>         self.points = current;
>         historical
>     }
> 
>     pub fn summarize_sensor(&self, sensor_id: u32) -> Option<WindowSummary> {
>         let sensor_points: Vec<&MetricPoint> = self
>             .points
>             .iter()
>             .filter(|p| p.sensor_id == sensor_id)
>             .collect();
> 
>         if sensor_points.is_empty() {
>             return None;
>         }
> 
>         let count = sensor_points.len();
>         let mut min = f64::MAX;
>         let mut max = f64::MIN;
>         let mut sum = 0.0;
> 
>         for p in &sensor_points {
>             if p.value < min {
>                 min = p.value;
>             }
>             if p.value > max {
>                 max = p.value;
>             }
>             sum += p.value;
>         }
> 
>         Some(WindowSummary {
>             sensor_id,
>             count,
>             min,
>             max,
>             avg: sum / count as f64,
>         })
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_time_series_aggregator() {
>         let mut agg = TimeSeriesAggregator::new();
>         assert_eq!(agg.len(), 0);
> 
>         agg.push_point(MetricPoint { timestamp: 100, sensor_id: 1, value: 20.5 });
>         agg.push_point(MetricPoint { timestamp: 105, sensor_id: 1, value: 30.5 });
>         agg.push_point(MetricPoint { timestamp: 200, sensor_id: 2, value: 50.0 });
> 
>         assert_eq!(agg.len(), 3);
>         assert_ne!(agg.len(), 0);
> 
>         let summary = agg.summarize_sensor(1);
>         assert!(matches!(summary, Some(ref s) if s.avg == 25.5));
>         if let Some(s) = summary {
>             assert_eq!(s.count, 2);
>             assert!((s.min - 20.5).abs() < f64::EPSILON);
>             assert!((s.max - 30.5).abs() < f64::EPSILON);
>         }
> 
>         let historical = agg.split_at_timestamp(150);
>         assert_eq!(historical.len(), 2);
>         assert_eq!(agg.len(), 1);
> 
>         agg.prune_older_than(250);
>         assert_eq!(agg.len(), 0);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Non-destructive Iteration**: `summarize_sensor` uses `self.points.iter()` to obtain shared references (`&MetricPoint`). This allows analyzing metrics repeatedly without transferring vector ownership or cloning heap data structures.
> 2. **Vector Draining & Partitioning**: Combining `self.points.drain(..)` with `.partition(...)` moves owned elements out of the original vector and redistributes them into two separate heap-allocated vectors in a single linear pass ($O(N)$ complexity).
> 3. **Memory Pruning Efficiency**: `prune_older_than` enforces sliding-window constraints via `Vec::retain`, preventing unbound memory growth on long-running edge devices.
> 4. **Safe Floating Point Initialization**: Initializing `min` to `f64::MAX` and `max` to `f64::MIN` ensures correct accumulation during iteration, while checking `is_empty()` prevents division-by-zero panics when calculating average values.

---

## 6. Related Terms


- [Compound Types](../level_01/compound_types.md) — The rigid, fixed-size cousin of `Vec`.
- [`Option<T>`](option_t.md) — The type returned by the safe `Vec::get()` method.
- [Iterator](iterator.md) — The idiomatic way to loop through every item inside a Vector.
- [`HashMap<K, V>`](hashmap_k_v.md) — Related concept: `HashMap<K, V>`.
- [`VecDeque<T>`](vecdeque_t.md) — Related concept: `VecDeque<T>`.
- [`Box<T>`](../level_03/box_t.md) — Related concept: `Box<T>`.
- [Arrays and Slices (`[T; N]`, `&[T]`)](../level_01/array_and_slice.md) — Related concept: Arrays and Slices (`[T; N]`, `&[T]`).

---

## 7. Key Takeaways

- `Vec<T>` is a dynamic, growable array stored on the Heap memory.
- You can create one using `Vec::new()` or the handy `vec![1, 2, 3]` macro.
- Use `.push(value)` to add items to the end, and `.pop()` to remove the last item.
- Accessing an item via brackets `my_vec[index]` will crash the program if the index doesn't exist.
- Accessing an item via `my_vec.get(index)` is safe and gracefully returns an `Option<T>`.
