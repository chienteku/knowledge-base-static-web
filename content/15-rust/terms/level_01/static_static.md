# Static (`static`)

> **Level 1 — Foundations**
> A global variable with a `'static` lifetime; can be mutable (`static mut`) but requires `unsafe`.

---

## 1. Prerequisites


- [Constants (`const`)](constants_const.md) — The preferred way to define global read-only values.

---

## 2. Term Category



**Rust Keyword (fixed global memory allocation)**: Static variables exist in languages like C, C++, and Java (as static fields) to represent data that lives for the entire duration of a program.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

While [Constants (`const`)](../level_01/constants_const.md) are great for read-only values, they work by literally copy-pasting the value wherever it is used. What if you have a massive 1-Gigabyte lookup table? You definitely don't want to copy-paste that into memory hundreds of times. Or what if you are doing low-level programming and need to point to a specific, unmoving hardware memory address?

This is where the `static` keyword comes in. A `static` item guarantees that there is exactly **one instance** of the value at a **single, fixed memory location** that lives for the entire duration of your program (this duration is called the `'static` lifetime). 

Because there is only one memory location, if you allow it to be mutable (`static mut`), multiple threads could try to change it at the exact same time, causing a disastrous "data race." Rust's compiler is obsessed with safety and cannot guarantee that your multi-threaded code is safe if it uses `static mut`. Therefore, reading or writing to a `static mut` forces you to use an `unsafe` block, explicitly telling the compiler: *"I know this is dangerous, but I take full responsibility."*

### (2) Reality Metaphor

- A `const` is like a **PDF flyer**. If 100 people need it, you print 100 copies and hand them out. Everyone gets their own copy of the exact same data.
- A `static` is like a **single physical bulletin board** in the lobby of a building. There is only one board. If 100 people need the information, they all walk to the exact same physical location to look at it. 
- A `static mut` means you are allowing people to change what's on the bulletin board. Because people might bump into each other and rip the paper while trying to pin things at the same time, the building manager requires you to put on a hardhat (an `unsafe` block) before you touch it.

### (3) Rust Code Examples

#### Short Snippet
```rust
// Like const, static variables MUST have a type annotation.
static GREETING: &str = "Hello, World";

// A mutable static variable.
static mut GLOBAL_COUNTER: i32 = 0;
```

#### Fuller Example
```rust
static HELLO_WORLD: &str = "Hello, world!";
static mut HIT_COUNT: u32 = 0;

fn main() {
    // Reading a standard `static` is perfectly safe.
    println!("Message: {}", HELLO_WORLD);
    
    // Changing a `static mut` is DANGEROUS. 
    // The compiler will refuse to build this unless we wrap it in `unsafe`.
    unsafe {
        HIT_COUNT += 1;
        
        // Even simply reading a `static mut` requires an `unsafe` block!
        // What if another thread was changing it right as we read it?
        println!("The hit count is now: {}", HIT_COUNT);
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Static Static Scoping and Lifecycle Rules

**The mistake:** Assuming Static Static instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("static_static_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("static_static_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Forgetting the `unsafe` block for `static mut`

**The mistake:** Trying to read or write a `static mut` like a normal variable.

**Why it's wrong:** Rust's primary selling point is fearless concurrency (no data races). Global mutable state is the #1 cause of data races. Rust forces you to acknowledge this danger.

*Incorrect:*
```rust
static mut SCORE: i32 = 0;

fn main() {
    SCORE = 100; // ERROR: use of mutable static is unsafe
}
```

*Fix:*
```rust
static mut SCORE: i32 = 0;

fn main() {
    unsafe {
        SCORE = 100;
    }
}
```

---

### Mistake 3: Concurrent Access to Static Static Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Static Static instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Lock-Free Global Telemetry Engine for High-Concurrency Microservices

**Scenario:**
In high-throughput microservices, sharing mutable global telemetry data via raw `static mut` variables creates critical data races and requires dangerous `unsafe` blocks. Mutex guards add locking overhead that hurts P99 response latencies. You are tasked with designing a production-grade, thread-safe global `TelemetryRegistry` using immutable `static` declarations combined with atomic primitives (`AtomicU64`, `AtomicBool`).

**Task:**
Implement a global telemetry registry that allows multi-threaded worker nodes to record request execution latencies, track error rates, and toggle system active status concurrently without `unsafe` blocks.

Requirements:
1. Define a `TelemetryRegistry` struct with `AtomicU64` fields (`total_requests`, `error_count`, `total_latency_us`) and an `AtomicBool` (`is_active`). Provide a `const fn new()` constructor for compile-time `static` initialization.
2. Implement `record_request(&self, latency_us: u64, is_error: bool)` using `Ordering::Relaxed` atomics.
3. Implement `snapshot(&self) -> TelemetrySnapshot` returning consolidated metrics including total requests, errors, total latency, error percentage (`f64`), and average latency (`f64`), safely handling zero requests.
4. Declare a global static instance `static GLOBAL_TELEMETRY: TelemetryRegistry = TelemetryRegistry::new();` and an accessor function `get_telemetry() -> &'static TelemetryRegistry`.
5. Include comprehensive unit tests using `std::thread::spawn` with explicit assertions (`assert_eq!`, `assert!`, `assert_ne!`, `matches!`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
> use std::thread;
> 
> #[derive(Debug, Clone, PartialEq)]
> pub struct TelemetrySnapshot {
>     pub total_requests: u64,
>     pub error_count: u64,
>     pub total_latency_us: u64,
>     pub error_rate_percent: f64,
>     pub avg_latency_us: f64,
>     pub is_active: bool,
> }
> 
> pub struct TelemetryRegistry {
>     total_requests: AtomicU64,
>     error_count: AtomicU64,
>     total_latency_us: AtomicU64,
>     is_active: AtomicBool,
> }
> 
> impl TelemetryRegistry {
>     pub const fn new() -> Self {
>         Self {
>             total_requests: AtomicU64::new(0),
>             error_count: AtomicU64::new(0),
>             total_latency_us: AtomicU64::new(0),
>             is_active: AtomicBool::new(true),
>         }
>     }
> 
>     pub fn record_request(&self, latency_us: u64, is_error: bool) {
>         if !self.is_active.load(Ordering::Relaxed) {
>             return;
>         }
>         self.total_requests.fetch_add(1, Ordering::Relaxed);
>         self.total_latency_us.fetch_add(latency_us, Ordering::Relaxed);
>         if is_error {
>             self.error_count.fetch_add(1, Ordering::Relaxed);
>         }
>     }
> 
>     pub fn set_active(&self, active: bool) {
>         self.is_active.store(active, Ordering::Relaxed);
>     }
> 
>     pub fn snapshot(&self) -> TelemetrySnapshot {
>         let reqs = self.total_requests.load(Ordering::Relaxed);
>         let errs = self.error_count.load(Ordering::Relaxed);
>         let latency = self.total_latency_us.load(Ordering::Relaxed);
>         let active = self.is_active.load(Ordering::Relaxed);
> 
>         let error_rate = if reqs == 0 {
>             0.0
>         } else {
>             (errs as f64 / reqs as f64) * 100.0
>         };
> 
>         let avg_latency = if reqs == 0 {
>             0.0
>         } else {
>             latency as f64 / reqs as f64
>         };
> 
>         TelemetrySnapshot {
>             total_requests: reqs,
>             error_count: errs,
>             total_latency_us: latency,
>             error_rate_percent: error_rate,
>             avg_latency_us: avg_latency,
>             is_active: active,
>         }
>     }
> }
> 
> pub static GLOBAL_TELEMETRY: TelemetryRegistry = TelemetryRegistry::new();
> 
> pub fn get_telemetry() -> &'static TelemetryRegistry {
>     &GLOBAL_TELEMETRY
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_telemetry_multithreaded() {
>         let telemetry = get_telemetry();
>         telemetry.set_active(true);
> 
>         let mut handles = vec![];
>         for i in 0..10 {
>             handles.push(thread::spawn(move || {
>                 for j in 0..100 {
>                     let is_err = (i + j) % 10 == 0;
>                     telemetry.record_request(500, is_err);
>                 }
>             }));
>         }
> 
>         for handle in handles {
>             handle.join().unwrap();
>         }
> 
>         let snap = telemetry.snapshot();
>         assert_eq!(snap.total_requests, 1000);
>         assert!(snap.avg_latency_us > 499.0 && snap.avg_latency_us < 501.0);
>         assert_ne!(snap.error_count, 0);
>         assert!(matches!(snap.is_active, true));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Atomics vs. `static mut`**: Standard `static` items in Rust are placed in the program's data segment at a fixed memory address for the `'static` lifetime. However, shared mutation of a standard `static` requires types with internal mutability that implement `Sync`. `AtomicU64` and `AtomicBool` provide thread-safe interior mutability via hardware-level atomic instructions without requiring `unsafe` blocks or lock acquisition.
> 2. **Memory Ordering Invariants**: `Ordering::Relaxed` guarantees atomic operations on single memory variables without imposing cross-variable synchronization barriers, minimizing CPU bus lock overhead in telemetry pipelines.
> 3. **Lifetime Invariants**: Returning `&'static TelemetryRegistry` guarantees that the telemetry collector remains valid for the entire executable duration, enabling worker threads to log metrics safely without lifetime parameter annotations.
>
> 
---

### Exercise 2: High-Frequency Trading Symbol & Routing Table with `LazyLock` & `'static` Slices

**Scenario:**
In a high-frequency trading (HFT) matching engine, order routing tables and symbol configurations must be accessible across multiple worker threads with zero runtime heap allocation during order validation. Standard static initialization requires compile-time constant expressions, but dynamically populated initial states require lazy initialization via `LazyLock` coupled with thread-safe `RwLock`.

**Task:**
Build a symbol registry module using `std::sync::LazyLock` and `RwLock` that provides safe registration, concurrent read lookups, fee calculation, and address stability verification across threads.

Requirements:
1. Define a struct `SymbolConfig` storing `symbol: &'static str`, `tick_size: f64`, `min_order_size: f64`, `maker_fee_bps: u32`, and `taker_fee_bps: u32`.
2. Define `SymbolRegistry` containing `RwLock<HashMap<&'static str, SymbolConfig>>`. Implement methods `new()`, `register_symbol(&self, config: SymbolConfig) -> Result<(), &'static str>`, `lookup_symbol(&self, symbol: &str) -> Option<SymbolConfig>`, and `calculate_fee(&self, symbol: &str, notional: f64, is_maker: bool) -> Result<f64, &'static str>`.
3. Instantiate a global static `GLOBAL_REGISTRY: LazyLock<SymbolRegistry>`.
4. Include unit tests asserting correct fee calculation, concurrent dynamic symbol insertion, lookup failures, and static address stability using `assert_eq!`, `assert!`, `assert_ne!`, and `matches!`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::HashMap;
> use std::sync::{LazyLock, RwLock};
> 
> #[derive(Debug, Clone, PartialEq)]
> pub struct SymbolConfig {
>     pub symbol: &'static str,
>     pub tick_size: f64,
>     pub min_order_size: f64,
>     pub maker_fee_bps: u32,
>     pub taker_fee_bps: u32,
> }
> 
> pub struct SymbolRegistry {
>     symbols: RwLock<HashMap<&'static str, SymbolConfig>>,
> }
> 
> impl SymbolRegistry {
>     pub fn new() -> Self {
>         let mut map = HashMap::new();
>         map.insert(
>             "BTC-USD",
>             SymbolConfig {
>                 symbol: "BTC-USD",
>                 tick_size: 0.01,
>                 min_order_size: 0.0001,
>                 maker_fee_bps: 10,
>                 taker_fee_bps: 20,
>             },
>         );
>         map.insert(
>             "ETH-USD",
>             SymbolConfig {
>                 symbol: "ETH-USD",
>                 tick_size: 0.01,
>                 min_order_size: 0.001,
>                 maker_fee_bps: 15,
>                 taker_fee_bps: 25,
>             },
>         );
>         Self {
>             symbols: RwLock::new(map),
>         }
>     }
> 
>     pub fn register_symbol(&self, config: SymbolConfig) -> Result<(), &'static str> {
>         let mut guard = self.symbols.write().map_err(|_| "Lock poisoned")?;
>         guard.insert(config.symbol, config);
>         Ok(())
>     }
> 
>     pub fn lookup_symbol(&self, symbol: &str) -> Option<SymbolConfig> {
>         let guard = self.symbols.read().ok()?;
>         guard.get(symbol).cloned()
>     }
> 
>     pub fn calculate_fee(&self, symbol: &str, notional: f64, is_maker: bool) -> Result<f64, &'static str> {
>         let config = self.lookup_symbol(symbol).ok_or("Symbol not found")?;
>         let bps = if is_maker { config.maker_fee_bps } else { config.taker_fee_bps };
>         let fee = notional * (bps as f64) / 10_000.0;
>         Ok(fee)
>     }
> }
> 
> pub static GLOBAL_REGISTRY: LazyLock<SymbolRegistry> = LazyLock::new(SymbolRegistry::new);
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_hft_symbol_registry() {
>         let btc_opt = GLOBAL_REGISTRY.lookup_symbol("BTC-USD");
>         assert!(btc_opt.is_some());
>         let btc = btc_opt.unwrap();
>         assert_eq!(btc.symbol, "BTC-USD");
>         assert!(btc.tick_size < 0.1);
> 
>         let fee_res = GLOBAL_REGISTRY.calculate_fee("BTC-USD", 10_000.0, true);
>         assert_eq!(fee_res, Ok(10.0));
> 
>         let taker_fee = GLOBAL_REGISTRY.calculate_fee("ETH-USD", 10_000.0, false);
>         assert_eq!(taker_fee, Ok(25.0));
> 
>         let new_symbol = SymbolConfig {
>             symbol: "SOL-USD",
>             tick_size: 0.001,
>             min_order_size: 0.01,
>             maker_fee_bps: 8,
>             taker_fee_bps: 18,
>         };
>         assert_eq!(GLOBAL_REGISTRY.register_symbol(new_symbol), Ok(()));
> 
>         let sol_fee = GLOBAL_REGISTRY.calculate_fee("SOL-USD", 1000.0, true);
>         assert_eq!(sol_fee, Ok(0.80));
> 
>         let unknown_lookup = GLOBAL_REGISTRY.lookup_symbol("INVALID");
>         assert!(matches!(unknown_lookup, None));
> 
>         let addr1 = &*GLOBAL_REGISTRY as *const SymbolRegistry as usize;
>         let addr2 = &*GLOBAL_REGISTRY as *const SymbolRegistry as usize;
>         assert_eq!(addr1, addr2);
>         assert_ne!(addr1, 0);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Lazy Static Initialization (`LazyLock`)**: `std::sync::LazyLock` defers the execution of the initialization function until the static item is dereferenced for the first time. This bypasses the constraint that `static` initializers must be `const fn`, while guaranteeing thread-safe one-time initialization via internal synchronization barriers.
> 2. **Ref-Counting & Lifetime Bounds**: Using `&'static str` as hash map keys ensures keys reside in the binary's read-only string table or leak-free global memory, satisfying `'static` lifetime requirements for global static collections.
> 3. **Concurrency & Memory Address Stability**: `RwLock` enables multiple concurrent readers without contention while granting exclusive access for symbol registration. The memory location of `GLOBAL_REGISTRY` remains unchanged across all invocations, guaranteeing memory address invariance.
>
> 
---

### Exercise 3: Lock-Free Embedded SPSC Ring Buffer with Fixed Global `static` Storage

**Scenario:**
In embedded hardware microcontrollers or real-time network packet queues, heap allocation (`Vec`, `Box`) is unavailable or forbidden due to non-deterministic allocation latencies. Data frames must be transferred from a high-priority hardware interrupt producer to a processing thread using a lock-free Single-Producer Single-Consumer (SPSC) queue backed by fixed global `static` memory.

**Task:**
Implement a lock-free `StaticSpscQueue<const N: usize>` struct designed for global `static` instantiation using atomic head and tail pointers and an `UnsafeCell` buffer array.

Requirements:
1. Define `StaticSpscQueue<const N: usize>` with fields `buffer: [UnsafeCell<u64>; N]`, `head: AtomicUsize`, and `tail: AtomicUsize`.
2. Implement `unsafe impl<const N: usize> Sync for StaticSpscQueue<N> {}` with safety invariants documenting SPSC access guarantees.
3. Implement methods: `const fn new() -> Self`, `push(&self, item: u64) -> Result<(), u64>`, `pop(&self) -> Option<u64>`, `len(&self) -> usize`, `is_empty(&self) -> bool`, and `capacity(&self) -> usize`.
4. Declare `pub static HARDWARE_QUEUE: StaticSpscQueue<8> = StaticSpscQueue::new();`.
5. Include comprehensive unit tests testing queue push/pop ops, full queue rejection, static memory pointer equality, and thread interaction with explicit assertions (`assert_eq!`, `assert!`, `assert_ne!`, `matches!`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::cell::UnsafeCell;
> use std::sync::atomic::{AtomicUsize, Ordering};
> use std::thread;
> 
> pub struct StaticSpscQueue<const N: usize> {
>     buffer: [UnsafeCell<u64>; N],
>     head: AtomicUsize,
>     tail: AtomicUsize,
> }
> 
> // Safety: Safe for concurrent access if exactly one thread acts as producer
> // and exactly one thread acts as consumer.
> unsafe impl<const N: usize> Sync for StaticSpscQueue<N> {}
> 
> impl<const N: usize> StaticSpscQueue<N> {
>     pub const fn new() -> Self {
>         const EMPTY_CELL: UnsafeCell<u64> = UnsafeCell::new(0);
>         Self {
>             buffer: [EMPTY_CELL; N],
>             head: AtomicUsize::new(0),
>             tail: AtomicUsize::new(0),
>         }
>     }
> 
>     pub fn push(&self, item: u64) -> Result<(), u64> {
>         let head = self.head.load(Ordering::Relaxed);
>         let tail = self.tail.load(Ordering::Acquire);
>         let next_head = (head + 1) % N;
>         if next_head == tail {
>             return Err(item);
>         }
>         unsafe {
>             *self.buffer[head].get() = item;
>         }
>         self.head.store(next_head, Ordering::Release);
>         Ok(())
>     }
> 
>     pub fn pop(&self) -> Option<u64> {
>         let tail = self.tail.load(Ordering::Relaxed);
>         let head = self.head.load(Ordering::Acquire);
>         if head == tail {
>             return None;
>         }
>         let item = unsafe { *self.buffer[tail].get() };
>         let next_tail = (tail + 1) % N;
>         self.tail.store(next_tail, Ordering::Release);
>         Some(item)
>     }
> 
>     pub fn len(&self) -> usize {
>         let head = self.head.load(Ordering::Relaxed);
>         let tail = self.tail.load(Ordering::Relaxed);
>         (head + N - tail) % N
>     }
> 
>     pub fn is_empty(&self) -> bool {
>         self.head.load(Ordering::Relaxed) == self.tail.load(Ordering::Relaxed)
>     }
> 
>     pub fn capacity(&self) -> usize {
>         N - 1
>     }
> }
> 
> pub static HARDWARE_QUEUE: StaticSpscQueue<8> = StaticSpscQueue::new();
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_static_spsc_queue() {
>         let queue = &HARDWARE_QUEUE;
>         assert!(queue.is_empty());
>         assert_eq!(queue.capacity(), 7);
> 
>         let push_res = queue.push(101);
>         assert_eq!(push_res, Ok(()));
>         assert_ne!(queue.is_empty(), true);
> 
>         let popped = queue.pop();
>         assert_eq!(popped, Some(101));
>         assert!(queue.is_empty());
> 
>         for i in 0..7 {
>             assert_eq!(queue.push(i as u64), Ok(()));
>         }
> 
>         let full_push = queue.push(999);
>         assert!(matches!(full_push, Err(999)));
> 
>         let ptr1 = queue as *const StaticSpscQueue<8>;
>         let ptr2 = &HARDWARE_QUEUE as *const StaticSpscQueue<8>;
>         assert_eq!(ptr1, ptr2);
>         assert_ne!(ptr1, std::ptr::null());
> 
>         let producer_handle = thread::spawn(move || {
>             let mut popped_vals = vec![];
>             while popped_vals.len() < 7 {
>                 if let Some(val) = queue.pop() {
>                     popped_vals.push(val);
>                 }
>             }
>             popped_vals
>         });
> 
>         let received = producer_handle.join().unwrap();
>         assert_eq!(received, vec![0, 1, 2, 3, 4, 5, 6]);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Lock-Free Concurrency & Acquire-Release Ordering**: The producer only modifies `head` while reading `tail` with `Ordering::Acquire`. The consumer only modifies `tail` while reading `head` with `Ordering::Acquire`. Memory stores to the slot buffer are published via `Ordering::Release` before `head` update, guaranteeing memory synchronization across hardware threads without mutex locks.
> 2. **Safety of `UnsafeCell` in Static Items**: `UnsafeCell` disables Rust's default immutability alias rule for `static` storage. Implementing `Sync` is safe strictly under Single-Producer Single-Consumer constraints because producer and consumer threads access non-overlapping buffer indices at any given moment.
> 3. **Fixed Address Guarantee**: Instantiating `pub static HARDWARE_QUEUE` places the queue buffer in the static BSS/Data section of memory, preventing heap fragmentation and guaranteeing pointer address immutability for low-level peripheral DMA access.
>
> 
---

## 6. Related Terms


- [Constants (`const`)](constants_const.md) — The preferred alternative for read-only global values.
- [Variable](variable.md) — Standard bindings that live on the stack or heap, rather than in fixed global memory.
- [`'static` Lifetime](../level_05/static_lifetime.md) — Related concept: `'static` Lifetime.
- [`OnceCell` / `OnceLock` / `LazyLock` / `LazyCell`](../level_09/oncelock_lazylock.md) — Related concept: `OnceCell` / `OnceLock` / `LazyLock` / `LazyCell`.
- [`thread_local!` Macro](../level_09/thread_local_macro.md) — Related concept: `thread_local!` Macro.

---

## 7. Key Takeaways

- `static` variables represent a **single, fixed memory location** that lasts for the entire lifetime of the program.
- Like `const`, they **must** have an explicit type annotation.
- You can make them mutable using `static mut`.
- Because global mutable state is dangerous across multiple threads, **reading or writing to a `static mut` requires an `unsafe` block**.
- In 99% of cases, you should prefer `const` for global values. Use `static` only when a single memory address is strictly required.
