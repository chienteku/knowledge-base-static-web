# Reborrowing & Two-Phase Borrows

> **Level 3 — Ownership & Borrowing**
> The implicit `&mut *r` that lets a `&mut` reference be passed to a function and used again afterward, plus the relaxation that allows `vec.push(vec.len())`.

---

## 1. Prerequisites


- [Mutable Borrowing (`&mut`)](mutable_borrowing.md) — The exclusivity rule reborrowing and two-phase borrows both interact with.
- [Non-Lexical Lifetimes (NLL)](../level_05/non_lexical_lifetimes.md) — A closely related borrow-checker precision improvement from the same era.
- [Method](../level_02/method.md) — The call-site shape (`vec.push(...)`) where two-phase borrows matter most.

---

## 2. Term Category

**Borrow-Checker Refinements (the "obviously fine" exceptions)**: `&mut T` is supposed to be *exclusive* — only one can exist at a time. Taken completely literally, this rule would reject a surprising amount of everyday, clearly-safe code. Reborrowing and two-phase borrows are two specific, compiler-recognized exceptions that make the exclusivity rule work the way you'd intuitively expect, without weakening the underlying safety guarantee.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

**Reborrowing** solves this problem: if you have `r: &mut T` and pass `r` to a function expecting `&mut T`, doesn't that *move* `r`, making it unusable afterward (since `&mut` isn't `Copy`)? In practice, the compiler instead implicitly creates a **temporary, shorter-lived borrow** *of* `*r` — a "reborrow" — for the duration of that function call, and hands `r` itself back to you afterward, fully usable again. Without this, you'd have to explicitly write `&mut *r` everywhere, or structure code around never reusing a `&mut` reference after passing it anywhere.

**Two-phase borrows** solve a narrower, related problem: `vec.push(vec.len())` looks like it should conflict — `vec.push(...)` needs `&mut vec`, but `vec.len()` (evaluated as an argument) needs `&vec` "at the same time." The compiler recognizes that a mutable borrow used for a method call actually has two phases: it's first only *reserved* (during argument evaluation, other shared borrows are still fine), and only becomes fully *active* (exclusive) once the call itself actually happens — after all arguments, including `vec.len()`, have already been evaluated and no longer need to read `vec`.

### (2) Reality Metaphor

**Reborrowing**: Imagine lending your house key to a contractor for the afternoon so they can do specific work, with an explicit agreement that they hand the key back to you the moment they're done — you don't lose ownership of the key permanently just because someone else briefly held it.

**Two-phase borrows**: Imagine reserving a conference room ("I intend to use this room exclusively soon") while you're still in the hallway checking your notes (**reading `vec.len()`**) — the room is provisionally claimed, but not yet *locked and in exclusive use*, so someone briefly glancing through the door window (**a shared read**) during your hallway prep doesn't cause a conflict. Only once you actually step inside and shut the door (**the call itself executes**) does the room become truly exclusive.

### (3) Rust Code Examples

#### Short Snippet (Reborrowing in Action)
```rust
fn add_one(x: &mut i32) {
    *x += 1;
}

fn main() {
    let mut value = 5;
    let r: &mut i32 = &mut value;

    add_one(r); // Implicitly reborrows `*r` for the duration of this call.
    add_one(r); // `r` is STILL usable here — it wasn't moved/consumed by the first call!

    println!("{value}"); // 7
}
```

#### Fuller Example (Two-Phase Borrows, `vec.push(vec.len())`)
```rust
fn main() {
    let mut numbers = vec![10, 20, 30];

    // This looks like it should conflict: `.push()` needs `&mut numbers`,
    // but `.len()` (an argument) needs `&numbers` at "the same time."
    // Two-phase borrows make this legal: the &mut is only RESERVED during
    // argument evaluation, and only becomes ACTIVE once push() itself runs
    // (by which point .len() has already finished reading).
    numbers.push(numbers.len());

    println!("{numbers:?}"); // [10, 20, 30, 3]
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Reborrowing Scoping and Lifecycle Rules

**The mistake:** Assuming Reborrowing instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("reborrowing_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("reborrowing_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Reborrowing State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Reborrowing through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Reborrowing Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Reborrowing instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Zero-Copy Binary Protocol Stream Parser with Reborrowed Slices

**Scenario:**
In high-performance networking pipelines (such as custom IPC protocols or game server frame decoders), binary parsing must operate without dynamic memory allocations by returning zero-copy slice references `&'a [u8]`. The parser state is maintained inside a cursor struct `StreamCursor<'a>`. Because methods on `StreamCursor<'a>` take `&mut self` to advance internal slice pointers, passing the cursor into sub-parsing helper functions (`parse_header`, `parse_payload`) would consume (move) the mutable reference if `&mut T` were treated as a non-copyable moved value.

Implement `StreamCursor<'a>`, `PacketHeader`, and `ParsedPacket<'a>`. Write `parse_header` and `parse_packet` functions, demonstrating how `parse_packet` uses explicit or implicit reborrowing (`&mut *cursor`) to call `parse_header` and subsequently read payload bytes from the same cursor instance. Finally, construct `parse_all_packets` which reborrows `cursor` inside a `while` loop to parse a sequence of contiguous framing packets zero-copy.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq)]
> pub enum ParseError {
>     UnexpectedEof,
>     InvalidMagic(u16),
> }
> 
> pub struct StreamCursor<'a> {
>     slice: &'a [u8],
> }
> 
> impl<'a> StreamCursor<'a> {
>     pub fn new(slice: &'a [u8]) -> Self {
>         Self { slice }
>     }
> 
>     pub fn remaining(&self) -> usize {
>         self.slice.len()
>     }
> 
>     pub fn has_remaining(&self) -> bool {
>         !self.slice.is_empty()
>     }
> 
>     pub fn read_u8(&mut self) -> Result<u8, ParseError> {
>         if self.slice.is_empty() {
>             return Err(ParseError::UnexpectedEof);
>         }
>         let byte = self.slice[0];
>         self.slice = &self.slice[1..];
>         Ok(byte)
>     }
> 
>     pub fn read_u16_be(&mut self) -> Result<u16, ParseError> {
>         if self.slice.len() < 2 {
>             return Err(ParseError::UnexpectedEof);
>         }
>         let bytes: [u8; 2] = self.slice[..2].try_into().unwrap();
>         self.slice = &self.slice[2..];
>         Ok(u16::from_be_bytes(bytes))
>     }
> 
>     pub fn read_u32_be(&mut self) -> Result<u32, ParseError> {
>         if self.slice.len() < 4 {
>             return Err(ParseError::UnexpectedEof);
>         }
>         let bytes: [u8; 4] = self.slice[..4].try_into().unwrap();
>         self.slice = &self.slice[4..];
>         Ok(u32::from_be_bytes(bytes))
>     }
> 
>     pub fn read_bytes(&mut self, len: usize) -> Result<&'a [u8], ParseError> {
>         if self.slice.len() < len {
>             return Err(ParseError::UnexpectedEof);
>         }
>         let (head, tail) = self.slice.split_at(len);
>         self.slice = tail;
>         Ok(head)
>     }
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct PacketHeader {
>     pub magic: u16,
>     pub version: u8,
>     pub payload_len: u32,
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct ParsedPacket<'a> {
>     pub header: PacketHeader,
>     pub payload: &'a [u8],
> }
> 
> pub fn parse_header<'b, 'a>(cursor: &'b mut StreamCursor<'a>) -> Result<PacketHeader, ParseError> {
>     let magic = cursor.read_u16_be()?;
>     if magic != 0x07D1 {
>         return Err(ParseError::InvalidMagic(magic));
>     }
>     let version = cursor.read_u8()?;
>     let payload_len = cursor.read_u32_be()?;
>     Ok(PacketHeader {
>         magic,
>         version,
>         payload_len,
>     })
> }
> 
> pub fn parse_packet<'b, 'a>(cursor: &'b mut StreamCursor<'a>) -> Result<ParsedPacket<'a>, ParseError> {
>     // Reborrowing: passing `&mut *cursor` creates a shorter borrow for parse_header
>     let header = parse_header(&mut *cursor)?;
>     // `cursor` is active again here to extract the zero-copy slice
>     let payload = cursor.read_bytes(header.payload_len as usize)?;
>     Ok(ParsedPacket { header, payload })
> }
> 
> pub fn parse_all_packets<'b, 'a>(cursor: &'b mut StreamCursor<'a>) -> Result<Vec<ParsedPacket<'a>>, ParseError> {
>     let mut packets = Vec::new();
>     while cursor.has_remaining() {
>         // Repeatedly reborrowing cursor in loop iterations
>         let packet = parse_packet(&mut *cursor)?;
>         packets.push(packet);
>     }
>     Ok(packets)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_single_packet_parsing_with_reborrow() {
>         let mut buffer = Vec::new();
>         buffer.extend_from_slice(&0x07D1u16.to_be_bytes());
>         buffer.push(1);
>         buffer.extend_from_slice(&5u32.to_be_bytes());
>         buffer.extend_from_slice(b"hello");
> 
>         let mut cursor = StreamCursor::new(&buffer);
>         let packet = parse_packet(&mut cursor).expect("Failed to parse packet");
> 
>         assert_eq!(packet.header.magic, 0x07D1);
>         assert_eq!(packet.header.version, 1);
>         assert_eq!(packet.header.payload_len, 5);
>         assert_eq!(packet.payload, b"hello");
>         assert_ne!(packet.payload, b"world");
>         assert_eq!(cursor.remaining(), 0);
>         assert!(!cursor.has_remaining());
>     }
> 
>     #[test]
>     fn test_multiple_packets_in_loop_reborrow() {
>         let mut buffer = Vec::new();
>         // Packet 1
>         buffer.extend_from_slice(&0x07D1u16.to_be_bytes());
>         buffer.push(1);
>         buffer.extend_from_slice(&4u32.to_be_bytes());
>         buffer.extend_from_slice(b"ping");
> 
>         // Packet 2
>         buffer.extend_from_slice(&0x07D1u16.to_be_bytes());
>         buffer.push(2);
>         buffer.extend_from_slice(&4u32.to_be_bytes());
>         buffer.extend_from_slice(b"pong");
> 
>         let mut cursor = StreamCursor::new(&buffer);
>         let packets = parse_all_packets(&mut cursor).expect("Failed to parse stream");
> 
>         assert_eq!(packets.len(), 2);
>         assert_eq!(packets[0].payload, b"ping");
>         assert_eq!(packets[1].payload, b"pong");
>         assert_ne!(packets[0].header.version, packets[1].header.version);
>         assert!(!cursor.has_remaining());
>     }
> 
>     #[test]
>     fn test_invalid_magic_and_eof_error_handling() {
>         let mut buffer = Vec::new();
>         buffer.extend_from_slice(&0xDEADu16.to_be_bytes());
>         buffer.push(1);
>         buffer.extend_from_slice(&2u32.to_be_bytes());
>         buffer.extend_from_slice(b"hi");
> 
>         let mut cursor = StreamCursor::new(&buffer);
>         let err = parse_packet(&mut cursor);
>         assert!(matches!(err, Err(ParseError::InvalidMagic(0xDEAD))));
> 
>         let trunc_buf = [0x07, 0xD1, 0x01];
>         let mut trunc_cursor = StreamCursor::new(&trunc_buf);
>         let eof_err = parse_packet(&mut trunc_cursor);
>         assert!(matches!(eof_err, Err(ParseError::UnexpectedEof)));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Reborrowing Semantics (`&mut *cursor`)**:
>    In Rust, references of type `&mut T` do not implement the `Copy` trait. If passing `cursor: &mut StreamCursor<'a>` into `parse_header` moved the value, `cursor` would become invalidated and unavailable for subsequent use in `parse_packet`.
>    The compiler automatically desugars `parse_header(cursor)` to `parse_header(&mut *cursor)`. This creates a temporary reborrow with a shorter lifetime `'b` tied to the duration of `parse_header`. While `parse_header` executes, the parent reference `cursor` is suspended. Once `parse_header` returns, the temporary reborrow expires and `cursor` becomes active again for `cursor.read_bytes(...)`.
> 
> 2. **Lifetime Architecture for Zero-Copy Parsing**:
>    `StreamCursor<'a>` carries two distinct lifetime parameters in parsing functions: `'a` (the lifetime of the underlying byte buffer containing raw packet data) and `'b` (the lifetime of the transient mutable reference to the cursor).
>    Notice that `read_bytes(&mut self, len: usize) -> Result<&'a [u8], ParseError>` returns a slice bound to `'a`, NOT to the lifetime of `&mut self`. This allows `ParsedPacket<'a>` to retain zero-copy references to the input buffer even after the mutable cursor itself is dropped or modified.
> 
> 3. **Loop Reborrowing Invariants**:
>    In `parse_all_packets`, the `while cursor.has_remaining()` loop repeatedly passes `&mut *cursor` into `parse_packet`. Non-Lexical Lifetimes (NLL) ensure that each reborrow created in the loop body ends at the completion of that iteration, allowing the outer `cursor` reference to be safely reborrowed in subsequent iterations without conflicting lifetime overlap.
> 
> 4. **Memory Layout & Edge Cases**:
>    `StreamCursor<'a>` is laid out in memory identically to a slice pointer (`&[u8]`), occupying two 64-bit words (pointer address + length). Mutating `self.slice = &self.slice[N..]` simply advances the pointer address and decrements the slice length in place. Edge cases like slice truncation or invalid magic bytes return `ParseError` without corrupting memory or causing panics.

---

### Exercise 2: Multi-Pass State Machine Pipeline & Two-Phase Method Calls

**Scenario:**
In game simulation engines or graph processing frameworks, graph nodes undergo multi-stage physical updates (`apply_forces`, `integrate_velocity`, `apply_damping`). Furthermore, node storage structures (`GraphStore`) provide builder methods where allocating a node requires generating an ID via shared access (`&store`) while concurrently passing that ID to a mutable storage insertion method (`&mut store`).

Implement a `GraphNode` structure and a `GraphStore` allocator. Demonstrate two-phase borrows during method calls like `store.insert_node(store.next_node_id(), ...)`. Write an execution pipeline `execute_node_pipeline` that reborrows `&mut GraphNode` sequentially across multiple stage functions, and implement a recursive/chained node traversal function `traverse_and_update_chain` that reborrows mutable pointer references inside a pointer-advancing loop.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
> pub struct NodeId(pub u32);
> 
> #[derive(Debug, PartialEq)]
> pub struct GraphNode {
>     pub id: NodeId,
>     pub val: f64,
>     pub velocity: f64,
>     pub child: Option<Box<GraphNode>>,
> }
> 
> impl GraphNode {
>     pub fn new(id: NodeId, val: f64, velocity: f64) -> Self {
>         Self {
>             id,
>             val,
>             velocity,
>             child: None,
>         }
>     }
> }
> 
> pub struct GraphStore {
>     nodes: Vec<GraphNode>,
>     counter: u32,
> }
> 
> impl GraphStore {
>     pub fn new() -> Self {
>         Self {
>             nodes: Vec::new(),
>             counter: 0,
>         }
>     }
> 
>     pub fn next_node_id(&self) -> u32 {
>         self.counter
>     }
> 
>     pub fn insert_node(&mut self, id_val: u32, val: f64, velocity: f64) -> NodeId {
>         let node_id = NodeId(id_val);
>         self.nodes.push(GraphNode::new(node_id, val, velocity));
>         self.counter = self.counter.max(id_val + 1);
>         node_id
>     }
> 
>     pub fn get_node_mut(&mut self, id: NodeId) -> Option<&mut GraphNode> {
>         self.nodes.iter_mut().find(|n| n.id == id)
>     }
> 
>     pub fn len(&self) -> usize {
>         self.nodes.len()
>     }
> }
> 
> pub fn apply_forces(node: &mut GraphNode, force: f64) {
>     node.velocity += force;
> }
> 
> pub fn integrate_velocity(node: &mut GraphNode, dt: f64) {
>     node.val += node.velocity * dt;
> }
> 
> pub fn apply_damping(node: &mut GraphNode, factor: f64) {
>     node.velocity *= factor;
> }
> 
> pub fn execute_node_pipeline(node: &mut GraphNode, force: f64, dt: f64, damping: f64) {
>     // Reborrowing `node` across three consecutive pass calls
>     apply_forces(&mut *node, force);
>     integrate_velocity(&mut *node, dt);
>     apply_damping(&mut *node, damping);
> }
> 
> pub fn traverse_and_update_chain(mut node: &mut GraphNode, mut update_fn: impl FnMut(&mut GraphNode)) {
>     update_fn(&mut *node);
>     while let Some(ref mut next) = node.child {
>         // Reborrowing nested child reference to advance pointer in loop
>         node = &mut **next;
>         update_fn(&mut *node);
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_two_phase_borrow_store_insertion() {
>         let mut store = GraphStore::new();
>         // Two-phase borrow: `store.insert_node` reserves `&mut store`,
>         // while `store.next_node_id()` reads `&store` during argument evaluation.
>         let id1 = store.insert_node(store.next_node_id(), 10.0, 2.0);
>         let id2 = store.insert_node(store.next_node_id(), 20.0, 4.0);
> 
>         assert_eq!(id1, NodeId(0));
>         assert_eq!(id2, NodeId(1));
>         assert_eq!(store.len(), 2);
>         assert_ne!(id1, id2);
>     }
> 
>     #[test]
>     fn test_pipeline_reborrowing() {
>         let mut node = GraphNode::new(NodeId(0), 100.0, 5.0);
>         // force=10 => v=15; dt=2 => val=100+15*2=130; damping=0.5 => v=7.5
>         execute_node_pipeline(&mut node, 10.0, 2.0, 0.5);
> 
>         assert_eq!(node.val, 130.0);
>         assert_eq!(node.velocity, 7.5);
>         assert_ne!(node.val, 100.0);
>         assert!(node.val > 100.0);
>     }
> 
>     #[test]
>     fn test_chain_traversal_reborrowing() {
>         let n3 = GraphNode::new(NodeId(3), 30.0, 0.0);
>         let mut n2 = GraphNode::new(NodeId(2), 20.0, 0.0);
>         let n1 = GraphNode::new(NodeId(1), 10.0, 0.0);
> 
>         n2.child = Some(Box::new(n3));
>         let mut root = n1;
>         root.child = Some(Box::new(n2));
> 
>         traverse_and_update_chain(&mut root, |n| n.val += 5.0);
> 
>         assert_eq!(root.val, 15.0);
>         let child1 = root.child.as_ref().unwrap();
>         assert_eq!(child1.val, 25.0);
>         let child2 = child1.child.as_ref().unwrap();
>         assert_eq!(child2.val, 35.0);
>         assert!(matches!(child2.child, None));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Two-Phase Borrows Resolution (`store.insert_node(store.next_node_id(), ...)`)**:
>    Under strict pre-2018 borrow rules, calling `store.insert_node(&mut store, store.next_node_id(&store))` would fail compilation because taking `&mut store` as receiver would immediately lock `store` exclusively, forbidding `store.next_node_id()` from borrowing `&store` sharedly during argument evaluation.
>    Two-phase borrows solve this by introducing two states for mutable method receivers:
>    - **Reservation Phase**: When `store.insert_node(...)` is evaluated, the mutable borrow of `store` is created in a *reserved* state. In this phase, shared reads (like `store.next_node_id()`) are permitted.
>    - **Activation Phase**: Once all arguments have been evaluated, the shared read of `store` ends, and the mutable borrow transitions to *active* (exclusive) right as `insert_node` executes.
> 
> 2. **Pipeline Reborrowing & Sequential Passes**:
>    In `execute_node_pipeline`, `node` is passed to `apply_forces`, `integrate_velocity`, and `apply_damping`. Because `&mut GraphNode` is reborrowed (`&mut *node`), each pass function gets a temporary reborrow of lifetime `'pass`. The caller retains ownership of `node`, allowing linear pass chaining without needing to return `&mut GraphNode` from each pass function.
> 
> 3. **Pointer-Advancing Loop Reborrowing (`node = &mut **next`)**:
>    In `traverse_and_update_chain`, `node` is originally `&'a mut GraphNode`. Inside the `while let Some(ref mut next) = node.child` loop, `next` is `&'b mut Box<GraphNode>`. Dereferencing `**next` yields `GraphNode`, and taking `&mut **next` creates a new reborrow with a narrower lifetime `'c`. Assigning `node = &mut **next` overwrites the loop pointer variable with the child reborrow without invalidating the parent chain, allowing arbitrary depth traversal.

---

### Exercise 3: Zero-Allocation Ring Buffer with Computed Pushes & Reborrowed Slice Views

**Scenario:**
In high-throughput telemetry, IPC queues, or embedded microservices, ring buffers store data elements in a fixed-size contiguous buffer `[Option<T>; N]`.
1. When calling `buf.push_with_calc(|b| b.available_capacity() * 10)`, the method signature requires `&mut self` to insert the element, while the closure argument requires `&self` to compute the element value dynamically based on current capacity.
2. When performing batch item transformations or invariant validation (`mutate_queued_items`), the ring buffer splits queued elements across circular boundary slices `(&mut [Option<T>], &mut [Option<T>])`. Passing these mutable slices to sub-routine helpers requires **reborrowing** slice handles (`&mut *slice`) so that the outer slice references remain valid for subsequent operations.

Implement a const-generic `RingBuffer<T, const N: usize>` struct supporting `push_with_calc`, `as_mut_slices`, and `mutate_queued_items`. Write comprehensive unit tests validating capacity calculations, two-phase borrows, in-place slice mutation via reborrowing, and full buffer error handling.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub struct RingBuffer<T, const N: usize> {
>     data: [Option<T>; N],
>     head: usize,
>     tail: usize,
>     len: usize,
> }
> 
> impl<T, const N: usize> RingBuffer<T, N> {
>     pub fn new() -> Self {
>         Self {
>             data: std::array::from_fn(|_| None),
>             head: 0,
>             tail: 0,
>             len: 0,
>         }
>     }
> 
>     pub fn len(&self) -> usize {
>         self.len
>     }
> 
>     pub fn capacity(&self) -> usize {
>         N
>     }
> 
>     pub fn available_capacity(&self) -> usize {
>         N - self.len
>     }
> 
>     pub fn is_full(&self) -> bool {
>         self.len == N
>     }
> 
>     pub fn push(&mut self, item: T) -> Result<(), &'static str> {
>         if self.is_full() {
>             return Err("Buffer is full");
>         }
>         self.data[self.tail] = Some(item);
>         self.tail = (self.tail + 1) % N;
>         self.len += 1;
>         Ok(())
>     }
> 
>     /// Pushes an item computed by a closure reading buffer state (`&Self`).
>     /// Demonstrates Two-Phase Borrows: `&mut self` is reserved while `calc_fn(&self)` runs.
>     pub fn push_with_calc<F>(&mut self, calc_fn: F) -> Result<(), &'static str>
>     where
>         F: FnOnce(&Self) -> T,
>     {
>         if self.is_full() {
>             return Err("Buffer is full");
>         }
>         let val = calc_fn(self);
>         self.push(val)
>     }
> 
>     pub fn pop(&mut self) -> Option<T> {
>         if self.len == 0 {
>             return None;
>         }
>         let item = self.data[self.head].take();
>         self.head = (self.head + 1) % N;
>         self.len -= 1;
>         item
>     }
> 
>     /// Returns occupied elements split across circular array bounds as mutable slices.
>     pub fn as_mut_slices(&mut self) -> (&mut [Option<T>], &mut [Option<T>]) {
>         if self.len == 0 {
>             return (&mut [], &mut []);
>         }
> 
>         if self.head < self.tail {
>             let (left, right) = self.data.split_at_mut(self.tail);
>             (&mut left[self.head..], &mut right[..0])
>         } else {
>             let (left, right) = self.data.split_at_mut(self.head);
>             (&mut right[..self.len - left.len()], &mut left[..])
>         }
>     }
> }
> 
> pub fn mutate_queued_items<T, const N: usize>(
>     buf: &mut RingBuffer<T, N>,
>     mut mutator: impl FnMut(&mut T),
> ) {
>     let (s1, s2) = buf.as_mut_slices();
> 
>     fn apply_to_slice<T>(slice: &mut [Option<T>], mutator: &mut impl FnMut(&mut T)) {
>         for opt in slice.iter_mut() {
>             if let Some(val) = opt {
>                 mutator(val);
>             }
>         }
>     }
> 
>     // Reborrowing s1 and s2 when passing to helper function
>     apply_to_slice(&mut *s1, &mut mutator);
>     apply_to_slice(&mut *s2, &mut mutator);
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_two_phase_borrow_push_with_calc() {
>         let mut buf = RingBuffer::<usize, 5>::new();
>         buf.push(10).unwrap();
>         buf.push(20).unwrap();
> 
>         // Two-phase borrow: `buf` is reserved for push_with_calc,
>         // while the closure reads `&buf` (avail cap = 3 => 3 * 10 = 30)
>         let res = buf.push_with_calc(|b| b.available_capacity() * 10);
>         assert!(res.is_ok());
> 
>         assert_eq!(buf.len(), 3);
>         assert_eq!(buf.available_capacity(), 2);
>         assert_ne!(buf.len(), 0);
>     }
> 
>     #[test]
>     fn test_slice_reborrowing_mutation() {
>         let mut buf = RingBuffer::<i32, 4>::new();
>         buf.push(1).unwrap();
>         buf.push(2).unwrap();
>         buf.push(3).unwrap();
> 
>         // Pop one item so head wraps around
>         assert_eq!(buf.pop(), Some(1));
>         buf.push(4).unwrap();
> 
>         // Mutate remaining items (2, 3, 4) in place by doubling them
>         mutate_queued_items(&mut buf, |val| *val *= 2);
> 
>         assert_eq!(buf.pop(), Some(4));
>         assert_eq!(buf.pop(), Some(6));
>         assert_eq!(buf.pop(), Some(8));
>         assert_eq!(buf.pop(), None);
>         assert!(buf.available_capacity() == 4);
>     }
> 
>     #[test]
>     fn test_full_buffer_and_error_handling() {
>         let mut buf = RingBuffer::<i32, 2>::new();
>         assert!(buf.push(100).is_ok());
>         assert!(buf.push(200).is_ok());
>         assert!(buf.is_full());
> 
>         let push_err = buf.push(300);
>         assert!(matches!(push_err, Err("Buffer is full")));
> 
>         let calc_err = buf.push_with_calc(|b| b.len() as i32);
>         assert!(matches!(calc_err, Err("Buffer is full")));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Two-Phase Borrows in Closure-Based Allocation (`push_with_calc`)**:
>    In `buf.push_with_calc(|b| b.available_capacity() * 10)`, `push_with_calc` receives `&mut self`. During argument evaluation, the compiler takes a *reserved* exclusive borrow of `buf`. When the closure runs, it accepts `&self` (a shared reference to `buf`). Under two-phase borrows, shared reads are allowed while the mutable receiver borrow is in the reserved state. Once `calc_fn` completes and returns the calculated value, the shared read ends, and the reserved `&mut self` transitions to active status to push the item into `buf.data`.
> 
> 2. **Slice View Reborrowing (`apply_to_slice(&mut *s1, ...)` )**:
>    `as_mut_slices` returns two non-overlapping mutable slice references `s1: &mut [Option<T>]` and `s2: &mut [Option<T>]`.
>    When invoking `apply_to_slice(s1, ...)`, passing `s1` directly by value would move the slice reference (since `&mut [T]` is non-`Copy`). Reborrowing via `&mut *s1` creates a temporary slice reference of shorter lifetime. This ensures that `s1` remains valid in the scope of `mutate_queued_items`, preventing variable move errors.
> 
> 3. **Non-Overlapping Mutable Slice Invariants**:
>    `split_at_mut` guarantees that `s1` and `s2` reference disjoint sub-ranges of the underlying `data` array. Rust's aliasing rules forbid two overlapping mutable references to the same memory. By returning non-overlapping slices, `RingBuffer` allows safe parallel or sequential mutation of circular buffer segments without unsafe code.
> 
> 4. **Memory & Layout Efficiency**:
>    `RingBuffer<T, N>` is allocated on the stack (or inline in host structs) without heap allocations (`Vec`). Const generics `N` establish array bounds at compile time, eliminating slice boundary runtime overhead and allowing SIMD optimization of loop transformations during `mutate_queued_items`.

---

## 6. Related Terms


- [Mutable Borrowing (`&mut`)](mutable_borrowing.md) — The exclusivity rule both of these features carefully refine without weakening.
- [Non-Lexical Lifetimes (NLL)](../level_05/non_lexical_lifetimes.md) — A sibling borrow-checker precision improvement from the same 2018-edition era.
- [Method](../level_02/method.md) — The `receiver.method(args)` call shape where two-phase borrows specifically apply.

---

## 7. Key Takeaways

- **Reborrowing** implicitly creates a temporary, shorter-lived borrow when a `&mut` reference is passed somewhere, so the original reference remains usable afterward — without this, `&mut` references would behave as if consumed on first use.
- **Two-phase borrows** split a mutable borrow taken for a method call into a *reserved* phase (during argument evaluation, compatible with shared reads) and an *active* phase (only once the call itself runs) — this is exactly what makes `vec.push(vec.len())` compile.
- Neither feature weakens Rust's core aliasing guarantees; both are precision improvements that make the borrow checker match programmer intuition more closely.
- Both were part of the broader borrow-checker overhaul (alongside NLL) that shipped around the 2018 edition.
