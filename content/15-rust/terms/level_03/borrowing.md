# Borrowing (`&`)

> **Level 3 — Ownership & Borrowing**
> Creating an immutable reference to a value without taking ownership.

---

## 1. Prerequisites

- [Ownership](../level_03/ownership.md) — The system that Borrowing is designed to work alongside.
- [Move Semantics](../level_03/move_semantics.md) — The destructive behavior that Borrowing successfully avoids.
- [String vs &str](../level_01/string_vs_&str.md) — We previously learned that `&str` is a string *reference*. Now we will learn exactly what that reference is!

---

## 2. Term Category

**Rust-specific (the elegant solution)**: While passing variables "by reference" exists in languages like C++, Rust's concept of "Borrowing" strictly ties references into the Ownership system. The compiler meticulously tracks borrows to guarantee they never cause bugs.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

We know that passing a `String` into a function triggers a **Move**. The function takes Ownership of the string, and when the function finishes, the string is permanently destroyed.

If you want to use that string again in your `main` function, you could pass a Deep Copy using `.clone()`, but copying Heap data is extremely slow and uses up lots of memory. What we really want is to let the function *look* at the data temporarily without actually giving it Ownership.

Rust solves this with **References (`&`)**. Creating a reference is called **Borrowing**. When you borrow data, you do not take Ownership of it. Because you don't own it, the compiler knows *not* to destroy the data when your scope ends!

### (2) Reality Metaphor

If **Ownership** is physically handing someone the legal deed to your house...

**Borrowing (`&`)** is giving them a piece of paper with your address written on it.
They can use the address to drive by and look at your house as much as they want. However, because they only have a piece of paper and not the legal deed, they don't actually *own* your house. Therefore, when they leave town, they aren't allowed to bulldoze your house. 

Because giving out a piece of paper is incredibly cheap, you can hand out as many addresses as you want without slowing anything down!

### (3) Rust Code Examples

#### Short Snippet (Passing a Reference)
```rust
// The function signature MUST specify it expects a reference (`&String`)
fn calculate_length(s: &String) -> usize {
    s.len()
} // `s` goes out of scope here. But because it is only a Borrow, nothing is dropped!

fn main() {
    let my_string = String::from("Hello Rust");
    
    // We pass `&my_string` (an address), NOT `my_string` (the deed).
    let len = calculate_length(&my_string);
    
    // Because we only borrowed it, `my_string` is still perfectly valid!
    println!("The length of '{}' is {}", my_string, len);
}
```

#### Fuller Example (Multiple Simultaneous Borrows)
Because standard borrows are strictly read-only, Rust allows you to have as many active borrows pointing to the same data as you want.

```rust
fn main() {
    let book = String::from("The Rust Book");
    
    // Alice borrows the book
    let alice_view = &book;
    
    // Bob borrows the book at the exact same time
    let bob_view = &book;
    
    // Everyone can read the book simultaneously without issue!
    println!("Alice reads: {}", alice_view);
    println!("Bob reads: {}", bob_view);
    println!("The Library still owns: {}", book);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Borrowing Scoping and Lifecycle Rules

**The mistake:** Assuming Borrowing instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("borrowing_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("borrowing_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Borrowing State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Borrowing through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Borrowing Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Borrowing instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Zero-Copy HTTP Protocol Packet & Header Inspector

**Problem:** High-throughput API proxies process tens of thousands of requests per second. Constructing owned `String` instances for every HTTP header key and value creates severe heap allocation overhead and garbage accumulation.

Implement a zero-copy HTTP header inspector struct `HeaderInspector<'a>` that borrows header slices (`&'a [Header<'a>]`) directly from an immutable socket buffer.

#### Requirements:
1. Define a `Header<'a>` struct containing `key: &'a str` and `value: &'a str`.
2. Define a `HeaderInspector<'a>` struct holding `headers: &'a [Header<'a>]`.
3. Implement `HeaderInspector<'a>` methods:
   - `new(headers: &'a [Header<'a>]) -> Self`
   - `get_header(&self, key: &str) -> Option<&'a str>` (case-insensitive key lookup returning string slice with buffer lifetime `'a`).
   - `find_all_by_prefix(&self, prefix: &str) -> Vec<&'a Header<'a>>` (returns borrowed references to headers matching a key prefix).
   - `compute_total_bytes(&self) -> usize` (sums total byte lengths of all keys and values).
   - `is_authorized(&self) -> bool` (returns `true` if an `Authorization` header starting with `"Bearer "` is present).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq)]
> pub struct Header<'a> {
>     pub key: &'a str,
>     pub value: &'a str,
> }
> 
> #[derive(Debug)]
> pub struct HeaderInspector<'a> {
>     headers: &'a [Header<'a>],
> }
> 
> impl<'a> HeaderInspector<'a> {
>     pub fn new(headers: &'a [Header<'a>]) -> Self {
>         Self { headers }
>     }
> 
>     pub fn get_header(&self, key: &str) -> Option<&'a str> {
>         self.headers
>             .iter()
>             .find(|h| h.key.eq_ignore_ascii_case(key))
>             .map(|h| h.value)
>     }
> 
>     pub fn find_all_by_prefix(&self, prefix: &str) -> Vec<&'a Header<'a>> {
>         self.headers
>             .iter()
>             .filter(|h| h.key.starts_with(prefix))
>             .collect()
>     }
> 
>     pub fn compute_total_bytes(&self) -> usize {
>         self.headers
>             .iter()
>             .map(|h| h.key.len() + h.value.len())
>             .sum()
>     }
> 
>     pub fn is_authorized(&self) -> bool {
>         self.get_header("authorization")
>             .map_or(false, |val| val.starts_with("Bearer "))
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_zero_copy_header_inspection() {
>         let raw_headers = vec![
>             Header { key: "Host", value: "api.service.internal" },
>             Header { key: "Authorization", value: "Bearer secret-token-123" },
>             Header { key: "X-Trace-Id", value: "trace-abc-8899" },
>             Header { key: "X-Trace-Span", value: "span-001" },
>             Header { key: "Content-Type", value: "application/json" },
>         ];
> 
>         let inspector = HeaderInspector::new(&raw_headers);
> 
>         // Exact & case-insensitive header lookup
>         assert_eq!(inspector.get_header("Host"), Some("api.service.internal"));
>         assert_eq!(inspector.get_header("authorization"), Some("Bearer secret-token-123"));
>         assert_eq!(inspector.get_header("Non-Existent"), None);
> 
>         // Prefix searching
>         let trace_headers = inspector.find_all_by_prefix("X-Trace-");
>         assert_eq!(trace_headers.len(), 2);
>         assert_eq!(trace_headers[0].key, "X-Trace-Id");
>         assert_eq!(trace_headers[1].key, "X-Trace-Span");
> 
>         // Total byte calculation
>         let total = inspector.compute_total_bytes();
>         assert_ne!(total, 0);
>         assert_eq!(total, 4 + 20 + 13 + 23 + 10 + 14 + 12 + 8 + 12 + 16);
> 
>         // Authorization verification
>         assert!(inspector.is_authorized());
> 
>         // Pattern matching on option result
>         let auth_result = inspector.get_header("Authorization");
>         assert!(matches!(auth_result, Some(v) if v.starts_with("Bearer")));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Zero-Copy Lifetime Elision & Propagation (`'a`)**: The `HeaderInspector<'a>` struct stores a slice reference `&'a [Header<'a>]`. In `get_header(&self, key: &str) -> Option<&'a str>`, explicit lifetime annotation `'a` decouples the lifetime of the temporary inspector instance (`&self`) and query parameter (`key`) from the returned value (`Option<&'a str>`). This allows the caller to use returned string references even after the `HeaderInspector` object is destroyed, provided the underlying `raw_headers` array remains in scope.
> 2. **Memory Layout of String Slices (`&str`)**: Each `&str` is represented internally as a 16-byte fat pointer (an 8-byte pointer to UTF-8 bytes and an 8-byte length). Passing and returning string slice references copies only 16 bytes on the stack, completely avoiding heap allocations (`malloc`/`free`) and `.clone()` operations.
> 3. **Shared Read Aliasing**: Rust allows an arbitrary number of immutable references (`&T`) to point to `raw_headers` simultaneously. Multiple inspection routines (security checkers, routing modules, analytics engines) can examine the exact same memory region concurrently without risk of data races.
> 4. **Edge Cases & Invariants**: If `raw_headers` is dropped, the compiler's borrow checker rejects any attempt to read returned header references with `E0597` ("borrowed value does not live long enough").

---

### Exercise 2: Shared Multi-View In-Memory Log Snapshot Query Engine

**Problem:** Production log storage systems maintain contiguous snapshot buffers in memory. Running multiple query filters (filtering by level, time window, or substring match) must execute without copying log entries or mutating log state.

Implement a snapshot query analyzer `SnapshotQuery<'a>` operating over borrowed slice references `&'a [LogRecord<'a>]`.

#### Requirements:
1. Define a `LogLevel` enum with variants `Debug`, `Info`, `Warn`, `Error` derived with `Debug, Clone, Copy, PartialEq, Eq`.
2. Define a `LogRecord<'a>` struct with `timestamp: u64`, `level: LogLevel`, `module: &'a str`, and `message: &'a str`.
3. Implement `SnapshotQuery<'a>` methods:
   - `new(records: &'a [LogRecord<'a>]) -> Self`
   - `filter_by_level(&self, level: LogLevel) -> Vec<&'a LogRecord<'a>>`
   - `filter_by_time_range(&self, start: u64, end: u64) -> Vec<&'a LogRecord<'a>>`
   - `search_message(&self, substring: &str) -> Vec<&'a LogRecord<'a>>`
   - `partition_by_severity(&self) -> (Vec<&'a LogRecord<'a>>, Vec<&'a LogRecord<'a>>)` (splits records into high severity [`Warn`, `Error`] vs normal [`Debug`, `Info`]).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub enum LogLevel {
>     Debug,
>     Info,
>     Warn,
>     Error,
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct LogRecord<'a> {
>     pub timestamp: u64,
>     pub level: LogLevel,
>     pub module: &'a str,
>     pub message: &'a str,
> }
> 
> pub struct SnapshotQuery<'a> {
>     records: &'a [LogRecord<'a>],
> }
> 
> impl<'a> SnapshotQuery<'a> {
>     pub fn new(records: &'a [LogRecord<'a>]) -> Self {
>         Self { records }
>     }
> 
>     pub fn filter_by_level(&self, level: LogLevel) -> Vec<&'a LogRecord<'a>> {
>         self.records
>             .iter()
>             .filter(|rec| rec.level == level)
>             .collect()
>     }
> 
>     pub fn filter_by_time_range(&self, start: u64, end: u64) -> Vec<&'a LogRecord<'a>> {
>         self.records
>             .iter()
>             .filter(|rec| rec.timestamp >= start && rec.timestamp <= end)
>             .collect()
>     }
> 
>     pub fn search_message(&self, substring: &str) -> Vec<&'a LogRecord<'a>> {
>         self.records
>             .iter()
>             .filter(|rec| rec.message.contains(substring))
>             .collect()
>     }
> 
>     pub fn partition_by_severity(&self) -> (Vec<&'a LogRecord<'a>>, Vec<&'a LogRecord<'a>>) {
>         self.records.iter().partition(|rec| {
>             matches!(rec.level, LogLevel::Warn | LogLevel::Error)
>         })
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_snapshot_query_borrows() {
>         let logs = vec![
>             LogRecord { timestamp: 100, level: LogLevel::Info, module: "auth", message: "User logged in" },
>             LogRecord { timestamp: 105, level: LogLevel::Warn, module: "db", message: "Connection pool pressure high" },
>             LogRecord { timestamp: 110, level: LogLevel::Error, module: "payment", message: "Gateway timeout connecting to provider" },
>             LogRecord { timestamp: 115, level: LogLevel::Debug, module: "auth", message: "Token refreshed" },
>             LogRecord { timestamp: 120, level: LogLevel::Error, module: "db", message: "Deadlock detected on table users" },
>         ];
> 
>         let query = SnapshotQuery::new(&logs);
> 
>         // Filter by level
>         let errors = query.filter_by_level(LogLevel::Error);
>         assert_eq!(errors.len(), 2);
>         assert_eq!(errors[0].module, "payment");
>         assert_eq!(errors[1].module, "db");
> 
>         // Filter by time range
>         let range_logs = query.filter_by_time_range(105, 115);
>         assert_eq!(range_logs.len(), 3);
>         assert_ne!(range_logs[0].timestamp, 100);
> 
>         // Substring search
>         let deadlock_logs = query.search_message("Deadlock");
>         assert_eq!(deadlock_logs.len(), 1);
>         assert!(matches!(deadlock_logs[0].level, LogLevel::Error));
> 
>         // Partitioning severe vs normal logs
>         let (severe, normal) = query.partition_by_severity();
>         assert_eq!(severe.len(), 3);
>         assert_eq!(normal.len(), 2);
> 
>         // Verify underlying vector remains intact and owned by main scope
>         assert_eq!(logs.len(), 5);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Slice Reference Memory Layout (`&[T]`)**: A slice reference `&'a [LogRecord<'a>]` is represented as a fat pointer containing a 64-bit pointer to the first contiguous `LogRecord` and a 64-bit element count. Calling `SnapshotQuery::new(&logs)` passes only 16 bytes regardless of whether `logs` contains 5 or 5,000,000 records.
> 2. **Aliasing XOR Mutability Invariant**: Because all query methods receive `&self` (shared immutable reference), Rust guarantees that no other code path can mutate the underlying `logs` vector while any `SnapshotQuery` or returned `&'a LogRecord<'a>` references exist.
> 3. **Iterator Borrow Chains**: `self.records.iter()` produces an iterator yielding `&'a LogRecord<'a>`. Collecting these into `Vec<&'a LogRecord<'a>>` allocates a vector of 64-bit raw pointers, pointing directly back to the original memory inside `logs` without duplicating string buffers or struct fields.
> 4. **Drop Semantics**: When `query`, `errors`, or `range_logs` go out of scope, they drop only their slice wrappers and pointer vectors. The actual underlying `LogRecord` instances remain owned by `logs` and are safely deallocated when `logs` goes out of scope at the end of the outer block.

---

### Exercise 3: Multi-Observer Telemetry Dispatcher & Observer Routing

**Problem:** Distributed real-time monitoring infrastructure routes stream metrics to diverse analytical subscribers (e.g. CPU anomaly detectors, HTTP error rate trackers). Cloning telemetry events for every observer introduces massive CPU overhead.

Implement a telemetry dispatcher `TelemetryDispatcher<'a>` that broadcasts borrowed immutable event references `&TelemetryEvent` to multiple registered observers implementing an `Observer` trait.

#### Requirements:
1. Define a `TelemetryEvent` struct with fields `device_id: String`, `cpu_usage: f64`, `mem_usage_mb: u64`, and `status_code: u16`.
2. Define a trait `Observer`: `fn observe(&mut self, event: &TelemetryEvent);`.
3. Implement `CpuAnomalyDetector`:
   - `new(threshold: f64) -> Self`
   - Fields: `threshold: f64`, `anomaly_count: usize`, `max_cpu_seen: f64`.
   - Increments `anomaly_count` when `event.cpu_usage > threshold` and tracks `max_cpu_seen`.
4. Implement `ErrorCounter`:
   - `new() -> Self`
   - Fields: `error_count: usize`, `failing_devices: Vec<String>`.
   - Increments `error_count` when `event.status_code >= 400` and records distinct `device_id` strings in `failing_devices`.
5. Implement `TelemetryDispatcher<'a>` holding `observers: Vec<&'a mut dyn Observer>`:
   - `new() -> Self`
   - `register(&mut self, observer: &'a mut dyn Observer)`
   - `dispatch(&mut self, event: &TelemetryEvent)`
   - `dispatch_batch(&mut self, events: &[TelemetryEvent])`

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone, PartialEq)]
> pub struct TelemetryEvent {
>     pub device_id: String,
>     pub cpu_usage: f64,
>     pub mem_usage_mb: u64,
>     pub status_code: u16,
> }
> 
> pub trait Observer {
>     fn observe(&mut self, event: &TelemetryEvent);
> }
> 
> pub struct CpuAnomalyDetector {
>     threshold: f64,
>     pub anomaly_count: usize,
>     pub max_cpu_seen: f64,
> }
> 
> impl CpuAnomalyDetector {
>     pub fn new(threshold: f64) -> Self {
>         Self {
>             threshold,
>             anomaly_count: 0,
>             max_cpu_seen: 0.0,
>         }
>     }
> }
> 
> impl Observer for CpuAnomalyDetector {
>     fn observe(&mut self, event: &TelemetryEvent) {
>         if event.cpu_usage > self.max_cpu_seen {
>             self.max_cpu_seen = event.cpu_usage;
>         }
>         if event.cpu_usage > self.threshold {
>             self.anomaly_count += 1;
>         }
>     }
> }
> 
> pub struct ErrorCounter {
>     pub error_count: usize,
>     pub failing_devices: Vec<String>,
> }
> 
> impl ErrorCounter {
>     pub fn new() -> Self {
>         Self {
>             error_count: 0,
>             failing_devices: Vec::new(),
>         }
>     }
> }
> 
> impl Observer for ErrorCounter {
>     fn observe(&mut self, event: &TelemetryEvent) {
>         if event.status_code >= 400 {
>             self.error_count += 1;
>             if !self.failing_devices.contains(&event.device_id) {
>                 self.failing_devices.push(event.device_id.clone());
>             }
>         }
>     }
> }
> 
> pub struct TelemetryDispatcher<'a> {
>     observers: Vec<&'a mut dyn Observer>,
> }
> 
> impl<'a> TelemetryDispatcher<'a> {
>     pub fn new() -> Self {
>         Self { observers: Vec::new() }
>     }
> 
>     pub fn register(&mut self, observer: &'a mut dyn Observer) {
>         self.observers.push(observer);
>     }
> 
>     pub fn dispatch(&mut self, event: &TelemetryEvent) {
>         for obs in self.observers.iter_mut() {
>             obs.observe(event);
>         }
>     }
> 
>     pub fn dispatch_batch(&mut self, events: &[TelemetryEvent]) {
>         for event in events {
>             self.dispatch(event);
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_telemetry_dispatcher_borrows() {
>         let events = vec![
>             TelemetryEvent { device_id: "edge-node-01".into(), cpu_usage: 45.2, mem_usage_mb: 1024, status_code: 200 },
>             TelemetryEvent { device_id: "edge-node-02".into(), cpu_usage: 92.8, mem_usage_mb: 4096, status_code: 500 },
>             TelemetryEvent { device_id: "edge-node-01".into(), cpu_usage: 88.0, mem_usage_mb: 2048, status_code: 404 },
>             TelemetryEvent { device_id: "edge-node-03".into(), cpu_usage: 12.5, mem_usage_mb: 512, status_code: 200 },
>         ];
> 
>         let mut cpu_detector = CpuAnomalyDetector::new(80.0);
>         let mut error_counter = ErrorCounter::new();
> 
>         {
>             let mut dispatcher = TelemetryDispatcher::new();
>             dispatcher.register(&mut cpu_detector);
>             dispatcher.register(&mut error_counter);
> 
>             // Dispatch batch of borrowed events
>             dispatcher.dispatch_batch(&events);
>         }
> 
>         // Verify CPU detector state after dispatch
>         assert_eq!(cpu_detector.anomaly_count, 2);
>         assert_eq!(cpu_detector.max_cpu_seen, 92.8);
> 
>         // Verify error counter state after dispatch
>         assert_eq!(error_counter.error_count, 2);
>         assert_eq!(error_counter.failing_devices.len(), 2);
>         assert!(error_counter.failing_devices.contains(&"edge-node-02".to_string()));
>         assert!(error_counter.failing_devices.contains(&"edge-node-01".to_string()));
> 
>         // Confirm original events vector is intact and retained by caller
>         assert_eq!(events.len(), 4);
>         assert_eq!(events[1].device_id, "edge-node-02");
>         assert!(matches!(events[0].status_code, 200));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Fan-Out Immutable Borrowing (`&TelemetryEvent`)**: The dispatcher passes `&TelemetryEvent` to `obs.observe(event)`. Borrowing the event immutably allows dispatching the exact same event instance sequentially to N observers without cloning `device_id` or allocating heap buffers per fan-out subscriber.
> 2. **Mutable Trait Object References (`&'a mut dyn Observer`)**: The dispatcher stores mutable references to trait objects `&'a mut dyn Observer`. Each trait object reference is a 16-byte fat pointer containing a data pointer to the concrete observer struct and a vtable pointer for dynamic dispatch. Mutably borrowing observers allows them to update internal metrics (`anomaly_count`, `failing_devices`) while preventing concurrent, un-synchronized access to the observers elsewhere.
> 3. **Non-Lexical Lifetimes (NLL) & Block Scoping**: In `test_telemetry_dispatcher_borrows`, `dispatcher` is declared within an inner block `{ ... }`. During this block, `cpu_detector` and `error_counter` are mutably borrowed by `dispatcher`. Once the block finishes, `dispatcher` is dropped, releasing the mutable borrows. This allows `test_telemetry_dispatcher_borrows` to safely read `cpu_detector.anomaly_count` and `error_counter.error_count` afterwards without triggering borrow checker conflict error `E0502`.
> 4. **Safety & Read Invariance**: Because `observe` takes `event: &TelemetryEvent` (an immutable reference), concrete observers can inspect metrics but are strictly forbidden by the compiler from mutating or invalidating event payload fields during observation.

---

## 6. Related Terms

- [Mutable Borrowing (`&mut`)](../level_03/mutable_borrowing.md) — How to let a function temporarily *modify* your data without taking ownership.
- [Borrow Checker](../level_03/borrow_checker.md) — The strict compiler component that enforces all the rules of borrowing.

---

## 7. Key Takeaways

- **Borrowing** allows you to pass a reference to data (`&data`) instead of passing the data itself.
- Borrowing **does not** transfer Ownership.
- Because Ownership isn't transferred, the data is **not dropped** when the reference goes out of scope.
- Standard borrows (`&`) are completely **immutable**. You can read the data, but you cannot change it.
- You can have as many simultaneous immutable borrows pointing to the same data as you want.
