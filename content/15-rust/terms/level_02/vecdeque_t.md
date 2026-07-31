# `VecDeque<T>`

> **Level 2 — Control Flow & Data Structures**
> A double-ended queue (ring buffer) with O(1) push/pop at *both* ends.

---

## 1. Prerequisites

- [`Vec<T>`](../level_02/vec_t.md) — The single-ended growable array this type generalizes.
- [`IntoIterator`](../level_06/intoiterator.md) — What lets a `VecDeque` be used in a `for` loop.

---

## 2. Term Category

**Collection Type (the two-ended array)**: `VecDeque<T>` ("deque" = double-ended queue) behaves like a `Vec<T>` that's efficient to push and pop from **both** the front and the back, not just the back. It's Rust's standard choice whenever you need queue or ring-buffer behavior.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

`Vec<T>` is excellent at appending/removing from the **end** (`.push()`/`.pop()`, both O(1) amortized), but removing from the **front** (`.remove(0)`) is O(n) — every remaining element has to physically shift left by one slot. This makes `Vec` a poor fit for queues (FIFO: first-in-first-out), where you constantly add at one end and remove from the other. `VecDeque<T>` fixes this by storing its data as a **ring buffer**: a fixed-capacity block of memory where the "start" and "end" are just tracked indices that can wrap around, so both ends can grow or shrink in O(1) without shifting anything.

### (2) Reality Metaphor

Imagine a line of people waiting to board a subway car that has doors on **both** ends.

- **`Vec` behavior**: Only the back door works. If someone needs to leave from the front of the line, everyone behind them has to shuffle forward one spot to close the gap — slow if the line is long.
- **`VecDeque` behavior**: Both doors work. People can board or exit from the front *or* the back instantly, without anyone else in line needing to move at all — the car simply tracks "where does the line currently start and end."

### (3) Rust Code Examples

#### Short Snippet (A FIFO Queue)
```rust
use std::collections::VecDeque;

fn main() {
    let mut queue: VecDeque<&str> = VecDeque::new();

    queue.push_back("first-in-line");
    queue.push_back("second-in-line");
    queue.push_back("third-in-line");

    // pop_front: O(1), unlike Vec's O(n) `.remove(0)`.
    while let Some(person) = queue.pop_front() {
        println!("Serving: {person}");
    }
    // Serving: first-in-line
    // Serving: second-in-line
    // Serving: third-in-line
}
```

#### Fuller Example (A Sliding-Window / Ring Buffer)
```rust
use std::collections::VecDeque;

// Keeps only the last N items seen, evicting the oldest when full.
struct SlidingWindow<T> {
    buffer: VecDeque<T>,
    capacity: usize,
}

impl<T> SlidingWindow<T> {
    fn new(capacity: usize) -> Self {
        Self { buffer: VecDeque::with_capacity(capacity), capacity }
    }

    fn push(&mut self, item: T) {
        if self.buffer.len() == self.capacity {
            self.buffer.pop_front(); // Evict oldest — O(1)!
        }
        self.buffer.push_back(item); // Add newest — O(1)!
    }
}

fn main() {
    let mut window: SlidingWindow<i32> = SlidingWindow::new(3);
    for i in 1..=5 {
        window.push(i);
    }
    println!("{:?}", window.buffer); // [3, 4, 5] — only the last 3 survive
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Vecdeque T Scoping and Lifecycle Rules

**The mistake:** Assuming Vecdeque T instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("vecdeque_t_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("vecdeque_t_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Vecdeque T State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Vecdeque T through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Vecdeque T Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Vecdeque T instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: High-Throughput Network Sliding-Window Rate Limiter

**Scenario:**
In distributed microservices and API gateways, rate limiters protect downstream services from traffic spikes using a sliding window log algorithm. Fixed time windows can suffer from boundary burst anomalies (where twice the allowed quota arrives across window boundaries). A sliding window maintains exact timestamp records of recent requests.

`VecDeque<u64>` is the optimal data structure for sliding logs because expired request timestamps are discarded from the head in $O(1)$ time (`pop_front`), while new request timestamps are appended to the tail in $O(1)$ time (`push_back`).

**Task:**
Implement a thread-safe-ready `SlidingWindowRateLimiter` struct:
1. Store timestamps in `VecDeque<u64>` (representing microsecond timestamps), along with `max_requests: usize`, `window_duration_us: u64`, and `evicted_count: u64`.
2. Implement `new(max_requests: usize, window_duration_us: u64) -> Self` initializing `VecDeque` with allocated capacity.
3. Implement `check_and_record(&mut self, current_time_us: u64) -> Result<usize, RateLimitError>`:
   - Evict all timestamps older than `current_time_us.saturating_sub(self.window_duration_us)` from the front of the queue, incrementing `evicted_count`.
   - If the active request count is less than `max_requests`, push `current_time_us` to the back and return `Ok(remaining_capacity)`.
   - Otherwise, return `Err(RateLimitError::Exceeded { current: usize, max: usize, retry_after_us: u64 })`, computing `retry_after_us` relative to the oldest active timestamp.
4. Implement `contiguous_timestamps(&mut self) -> &[u64]` using `VecDeque::make_contiguous()` to provide a single contiguous slice of active timestamp data without extra allocations.
5. Include unit tests demonstrating rate limit enforcement, boundary eviction, contiguous slicing, and explicit assertions (`assert_eq!`, `assert!`, `assert_ne!`, `matches!`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::VecDeque;
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum RateLimitError {
>     Exceeded {
>         current: usize,
>         max: usize,
>         retry_after_us: u64,
>     },
> }
> 
> #[derive(Debug)]
> pub struct SlidingWindowRateLimiter {
>     timestamps: VecDeque<u64>,
>     max_requests: usize,
>     window_duration_us: u64,
>     evicted_count: u64,
> }
> 
> impl SlidingWindowRateLimiter {
>     pub fn new(max_requests: usize, window_duration_us: u64) -> Self {
>         Self {
>             timestamps: VecDeque::with_capacity(max_requests),
>             max_requests,
>             window_duration_us,
>             evicted_count: 0,
>         }
>     }
> 
>     pub fn check_and_record(&mut self, current_time_us: u64) -> Result<usize, RateLimitError> {
>         let cutoff = current_time_us.saturating_sub(self.window_duration_us);
> 
>         // O(1) amortized eviction of expired entries from the front of the ring buffer
>         while let Some(&ts) = self.timestamps.front() {
>             if ts <= cutoff {
>                 self.timestamps.pop_front();
>                 self.evicted_count += 1;
>             } else {
>                 break;
>             }
>         }
> 
>         if self.timestamps.len() < self.max_requests {
>             self.timestamps.push_back(current_time_us);
>             Ok(self.max_requests - self.timestamps.len())
>         } else {
>             let oldest = *self.timestamps.front().unwrap();
>             let retry_after_us = (oldest + self.window_duration_us).saturating_sub(current_time_us);
>             Err(RateLimitError::Exceeded {
>                 current: self.timestamps.len(),
>                 max: self.max_requests,
>                 retry_after_us,
>             })
>         }
>     }
> 
>     pub fn active_requests(&self) -> usize {
>         self.timestamps.len()
>     }
> 
>     pub fn evicted_count(&self) -> u64 {
>         self.evicted_count
>     }
> 
>     pub fn contiguous_timestamps(&mut self) -> &[u64] {
>         self.timestamps.make_contiguous()
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_rate_limiter_basic_flow() {
>         let mut limiter = SlidingWindowRateLimiter::new(3, 1_000_000);
> 
>         // Fill capacity
>         assert_eq!(limiter.check_and_record(100), Ok(2));
>         assert_eq!(limiter.check_and_record(200), Ok(1));
>         assert_eq!(limiter.check_and_record(300), Ok(0));
> 
>         // Attempting 4th request within 1s window fails
>         let res = limiter.check_and_record(400);
>         assert!(res.is_err());
>         assert_ne!(res, Ok(0));
>         assert!(matches!(
>             res,
>             Err(RateLimitError::Exceeded {
>                 current: 3,
>                 max: 3,
>                 retry_after_us: 960000
>             })
>         ));
> 
>         // Advance time past t=100 (cutoff = 1000101 - 1000000 = 101)
>         assert_eq!(limiter.check_and_record(1_000_101), Ok(0));
>         assert_eq!(limiter.evicted_count(), 1);
>         assert_eq!(limiter.active_requests(), 3);
> 
>         // Verify contiguous memory slice view
>         let slice = limiter.contiguous_timestamps();
>         assert_eq!(slice.len(), 3);
>         assert_eq!(slice[0], 200);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Ring Buffer Mechanics & Amortized $O(1)$ Operations:** Unlike `Vec<T>`, where removing element 0 (`remove(0)`) triggers an $O(n)$ memory shift of all remaining elements, `VecDeque<T>` maintains a head and tail pointer over a circular block of allocated memory. `.pop_front()` simply increments the internal head index modulo capacity in $O(1)$ time. `.push_back()` advances the tail index in $O(1)$ amortized time.
> 2. **`make_contiguous()` Memory Invariant:** Because `VecDeque` wraps around its internal array boundary, the stored elements may be split across two non-contiguous memory slices (`as_slices()`). Calling `.make_contiguous()` rotates and rearranges internal elements in-place so all active items reside in a single contiguous slice `&[T]`. This mutation requires `&mut self` and enables zero-copy passing to network serialization buffers or C FFI boundaries.
> 3. **Monotonic Arithmetic Invariants:** `saturating_sub` prevents panic due to integer underflow if non-monotonic clock adjustments occur in low-level telemetry hardware.

---

### Exercise 2: Preemptive Priority Work-Stealing Task Queue

**Scenario:**
High-performance async runtimes (such as Tokio worker threads or parallel raytracers) utilize local task queues where high-priority or urgent events must preempt normal tasks at the front (`push_front`), standard tasks execute in FIFO order at the back (`push_back`), and idle sibling threads steal work from the tail (`pop_back`) to maximize CPU utilization while avoiding lock contention at the head.

**Task:**
Implement a generic `WorkStealingQueue<T>`:
1. Define a `Task<T>` struct containing `id: u64`, `payload: T`, and `is_urgent: bool`.
2. Define `WorkStealingQueue<T>` wrapping `VecDeque<Task<T>>` with a bounded `capacity: usize`.
3. `push_task(&mut self, task: Task<T>) -> Result<(), &'static str>`: If queue is at capacity, return `Err("Queue capacity exceeded")`. If `task.is_urgent` is true, call `push_front`; otherwise call `push_back`.
4. `pop_local(&mut self) -> Option<Task<T>>`: Pops local work from the front (`pop_front`).
5. `steal_remote(&mut self) -> Option<Task<T>>`: Steals work from the back (`pop_back`).
6. `drain_urgent(&mut self) -> Vec<Task<T>>`: Removes and returns all urgent tasks currently in the queue, preserving relative ordering of non-urgent tasks.
7. Write complete unit tests with explicit assertions (`assert_eq!`, `assert!`, `assert_ne!`, `matches!`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::VecDeque;
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct Task<T> {
>     pub id: u64,
>     pub payload: T,
>     pub is_urgent: bool,
> }
> 
> #[derive(Debug)]
> pub struct WorkStealingQueue<T> {
>     buffer: VecDeque<Task<T>>,
>     capacity: usize,
> }
> 
> impl<T> WorkStealingQueue<T> {
>     pub fn new(capacity: usize) -> Self {
>         Self {
>             buffer: VecDeque::with_capacity(capacity),
>             capacity,
>         }
>     }
> 
>     pub fn push_task(&mut self, task: Task<T>) -> Result<(), &'static str> {
>         if self.buffer.len() >= self.capacity {
>             return Err("Queue capacity exceeded");
>         }
>         if task.is_urgent {
>             self.buffer.push_front(task);
>         } else {
>             self.buffer.push_back(task);
>         }
>         Ok(())
>     }
> 
>     pub fn pop_local(&mut self) -> Option<Task<T>> {
>         self.buffer.pop_front()
>     }
> 
>     pub fn steal_remote(&mut self) -> Option<Task<T>> {
>         self.buffer.pop_back()
>     }
> 
>     pub fn len(&self) -> usize {
>         self.buffer.len()
>     }
> 
>     pub fn is_empty(&self) -> bool {
>         self.buffer.is_empty()
>     }
> 
>     pub fn drain_urgent(&mut self) -> Vec<Task<T>> {
>         let mut urgent = Vec::new();
>         let mut i = 0;
>         while i < self.buffer.len() {
>             if self.buffer[i].is_urgent {
>                 if let Some(task) = self.buffer.remove(i) {
>                     urgent.push(task);
>                 }
>             } else {
>                 i += 1;
>             }
>         }
>         urgent
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_work_stealing_queue_priority_and_stealing() {
>         let mut queue = WorkStealingQueue::new(4);
> 
>         let t1 = Task {
>             id: 1,
>             payload: "normal-1",
>             is_urgent: false,
>         };
>         let t2 = Task {
>             id: 2,
>             payload: "normal-2",
>             is_urgent: false,
>         };
>         let t3 = Task {
>             id: 3,
>             payload: "urgent-1",
>             is_urgent: true,
>         };
> 
>         assert_eq!(queue.push_task(t1), Ok(()));
>         assert_eq!(queue.push_task(t2), Ok(()));
>         assert_eq!(queue.push_task(t3), Ok(()));
> 
>         // Local thread pops urgent task (id 3) first from head
>         let local_task = queue.pop_local();
>         assert!(local_task.is_some());
>         assert_eq!(local_task.as_ref().unwrap().id, 3);
> 
>         // Remote thread steals task (id 2) from tail
>         let stolen = queue.steal_remote();
>         assert!(stolen.is_some());
>         assert_eq!(stolen.as_ref().unwrap().id, 2);
> 
>         assert_eq!(queue.len(), 1);
>         let last = queue.pop_local();
>         assert_eq!(last.as_ref().unwrap().id, 1);
>         assert!(queue.is_empty());
> 
>         // Capacity overflow verification
>         let mut full_q = WorkStealingQueue::new(1);
>         assert_eq!(
>             full_q.push_task(Task {
>                 id: 10,
>                 payload: "a",
>                 is_urgent: false,
>             }),
>             Ok(())
>         );
>         let overflow_res = full_q.push_task(Task {
>             id: 11,
>             payload: "b",
>             is_urgent: false,
>         });
>         assert_ne!(overflow_res, Ok(()));
>         assert!(matches!(overflow_res, Err("Queue capacity exceeded")));
>     }
> 
>     #[test]
>     fn test_drain_urgent() {
>         let mut queue = WorkStealingQueue::new(10);
>         queue
>             .push_task(Task {
>                 id: 1,
>                 payload: "norm1",
>                 is_urgent: false,
>             })
>             .unwrap();
>         queue
>             .push_task(Task {
>                 id: 2,
>                 payload: "urg1",
>                 is_urgent: true,
>             })
>             .unwrap();
>         queue
>             .push_task(Task {
>                 id: 3,
>                 payload: "norm2",
>                 is_urgent: false,
>             })
>             .unwrap();
> 
>         let urgent_list = queue.drain_urgent();
>         assert_eq!(urgent_list.len(), 1);
>         assert_eq!(urgent_list[0].id, 2);
> 
>         assert_eq!(queue.len(), 2);
>         assert_eq!(queue.pop_local().unwrap().id, 1);
>         assert_eq!(queue.pop_local().unwrap().id, 3);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Bi-Directional Priority Semantics:** `VecDeque<T>` provides symmetric $O(1)$ operation costs for `push_front`, `push_back`, `pop_front`, and `pop_back`. Pushing urgent tasks to the front grants LIFO/preemptive scheduling for the local worker, while standard tasks appended to the back maintain FIFO fairness among non-urgent work.
> 2. **Work-Stealing Contention Minimization:** Work-stealing scheduling architectures eliminate lock contention between local threads (operating at head/front) and remote stealer threads (operating at tail/back). When remote stealers invoke `pop_back()`, they retrieve the oldest non-urgent tasks while the local worker continues popping preemptive/urgent tasks from `pop_front()`.
> 3. **Selective Removal Complexity:** `VecDeque::remove(i)` shifts elements inward toward the closer end (front or back) to minimize memory copying. While removing arbitrary middle elements takes $O(n)$ time in the worst case, `VecDeque` minimizes move operations by choosing the shortest shift path based on the item index relative to `head` and `tail`.

---

### Exercise 3: Financial Order Book Matching Engine with Bounded Audit Logging

**Scenario:**
Financial exchanges and automated trading systems use order books matching buy (bid) and sell (ask) limit orders based on Price-Time priority. Matching processes incoming orders against the top of the opposite queue. Simultaneously, completed trade execution records are logged in a bounded audit trail buffer using `VecDeque<TradeRecord>`, where oldest trade logs roll off when log capacity is reached.

**Task:**
Implement an `OrderBookMatcher` trading engine:
1. Define `Side` enum (`Buy`, `Sell`), `Order` struct (`id: u64`, `side: Side`, `price: u64`, `quantity: u32`), and `TradeRecord` struct (`buy_id: u64`, `sell_id: u64`, `matched_price: u64`, `quantity: u32`).
2. Define `OrderBookMatcher` struct containing `bids: VecDeque<Order>`, `asks: VecDeque<Order>`, `trades: VecDeque<TradeRecord>`, and `max_trade_history: usize`.
3. `process_order(&mut self, incoming: Order) -> Vec<TradeRecord>`:
   - Match incoming buy orders against front of `asks` while `incoming.price >= ask.price` and `incoming.quantity > 0`.
   - Match incoming sell orders against front of `bids` while `incoming.price <= bid.price` and `incoming.quantity > 0`.
   - Partially or fully fill matching orders, popping fully filled orders from the front of the target `VecDeque`.
   - Insert any remaining unfilled quantity of `incoming` into its respective queue, maintaining sorted order (bids descending by price; asks ascending by price).
   - Log executions to `trades`. If `trades.len() > max_trade_history`, pop the oldest trade log from `trades.pop_front()`.
4. Implement tests covering partial fills, order insertion priority, bounded trade record eviction, and assertions (`assert_eq!`, `assert!`, `assert_ne!`, `matches!`).

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::VecDeque;
> 
> #[derive(Debug, Clone, Copy, PartialEq, Eq)]
> pub enum Side {
>     Buy,
>     Sell,
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct Order {
>     pub id: u64,
>     pub side: Side,
>     pub price: u64,
>     pub quantity: u32,
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct TradeRecord {
>     pub buy_id: u64,
>     pub sell_id: u64,
>     pub matched_price: u64,
>     pub quantity: u32,
> }
> 
> #[derive(Debug)]
> pub struct OrderBookMatcher {
>     bids: VecDeque<Order>,
>     asks: VecDeque<Order>,
>     trades: VecDeque<TradeRecord>,
>     max_trade_history: usize,
> }
> 
> impl OrderBookMatcher {
>     pub fn new(max_trade_history: usize) -> Self {
>         Self {
>             bids: VecDeque::new(),
>             asks: VecDeque::new(),
>             trades: VecDeque::with_capacity(max_trade_history),
>             max_trade_history,
>         }
>     }
> 
>     pub fn process_order(&mut self, mut incoming: Order) -> Vec<TradeRecord> {
>         let mut executed = Vec::new();
> 
>         match incoming.side {
>             Side::Buy => {
>                 while incoming.quantity > 0 && !self.asks.is_empty() {
>                     let best_ask = self.asks.front_mut().unwrap();
>                     if incoming.price >= best_ask.price {
>                         let fill_qty = incoming.quantity.min(best_ask.quantity);
>                         let trade = TradeRecord {
>                             buy_id: incoming.id,
>                             sell_id: best_ask.id,
>                             matched_price: best_ask.price,
>                             quantity: fill_qty,
>                         };
> 
>                         incoming.quantity -= fill_qty;
>                         best_ask.quantity -= fill_qty;
> 
>                         if best_ask.quantity == 0 {
>                             self.asks.pop_front();
>                         }
> 
>                         self.record_trade(trade.clone());
>                         executed.push(trade);
>                     } else {
>                         break;
>                     }
>                 }
> 
>                 if incoming.quantity > 0 {
>                     let pos = self
>                         .bids
>                         .iter()
>                         .position(|o| o.price < incoming.price)
>                         .unwrap_or(self.bids.len());
>                     self.bids.insert(pos, incoming);
>                 }
>             }
>             Side::Sell => {
>                 while incoming.quantity > 0 && !self.bids.is_empty() {
>                     let best_bid = self.bids.front_mut().unwrap();
>                     if incoming.price <= best_bid.price {
>                         let fill_qty = incoming.quantity.min(best_bid.quantity);
>                         let trade = TradeRecord {
>                             buy_id: best_bid.id,
>                             sell_id: incoming.id,
>                             matched_price: best_bid.price,
>                             quantity: fill_qty,
>                         };
> 
>                         incoming.quantity -= fill_qty;
>                         best_bid.quantity -= fill_qty;
> 
>                         if best_bid.quantity == 0 {
>                             self.bids.pop_front();
>                         }
> 
>                         self.record_trade(trade.clone());
>                         executed.push(trade);
>                     } else {
>                         break;
>                     }
>                 }
> 
>                 if incoming.quantity > 0 {
>                     let pos = self
>                         .asks
>                         .iter()
>                         .position(|o| o.price > incoming.price)
>                         .unwrap_or(self.asks.len());
>                     self.asks.insert(pos, incoming);
>                 }
>             }
>         }
> 
>         executed
>     }
> 
>     fn record_trade(&mut self, trade: TradeRecord) {
>         if self.trades.len() >= self.max_trade_history {
>             self.trades.pop_front();
>         }
>         self.trades.push_back(trade);
>     }
> 
>     pub fn recent_trades(&self) -> &VecDeque<TradeRecord> {
>         &self.trades
>     }
> 
>     pub fn bid_depth(&self) -> usize {
>         self.bids.len()
>     }
> 
>     pub fn ask_depth(&self) -> usize {
>         self.asks.len()
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_order_book_matching_and_bounded_audit() {
>         let mut matcher = OrderBookMatcher::new(2);
> 
>         let sell1 = Order {
>             id: 101,
>             side: Side::Sell,
>             price: 100,
>             quantity: 10,
>         };
>         assert!(matcher.process_order(sell1).is_empty());
>         assert_eq!(matcher.ask_depth(), 1);
> 
>         let buy1 = Order {
>             id: 201,
>             side: Side::Buy,
>             price: 105,
>             quantity: 6,
>         };
>         let trades1 = matcher.process_order(buy1);
>         assert_eq!(trades1.len(), 1);
>         assert_eq!(
>             trades1[0],
>             TradeRecord {
>                 buy_id: 201,
>                 sell_id: 101,
>                 matched_price: 100,
>                 quantity: 6
>             }
>         );
>         assert_eq!(matcher.ask_depth(), 1);
> 
>         let buy2 = Order {
>             id: 202,
>             side: Side::Buy,
>             price: 100,
>             quantity: 5,
>         };
>         let trades2 = matcher.process_order(buy2);
>         assert_eq!(trades2.len(), 1);
>         assert_eq!(trades2[0].quantity, 4);
>         assert_eq!(matcher.ask_depth(), 0);
>         assert_eq!(matcher.bid_depth(), 1);
> 
>         let sell2 = Order {
>             id: 102,
>             side: Side::Sell,
>             price: 99,
>             quantity: 1,
>         };
>         let trades3 = matcher.process_order(sell2);
>         assert_eq!(trades3.len(), 1);
>         assert_eq!(trades3[0].matched_price, 100);
> 
>         // Verify ring buffer audit trail bounded history eviction
>         let recent = matcher.recent_trades();
>         assert_eq!(recent.len(), 2);
>         assert_ne!(recent[0].buy_id, 201); // Oldest record (buy 201) evicted
>         assert_eq!(recent[0].buy_id, 202);
>         assert_eq!(recent[1].buy_id, 202);
>         assert!(matches!(
>             recent.front(),
>             Some(TradeRecord { buy_id: 202, .. })
>         ));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Price-Time Priority and Head Inspection:** Matching engines execute trades at the top of the order queue. `VecDeque::front_mut()` grants access to inspect and modify the best bid/ask without taking ownership of the order. If the top order is fully matched (`quantity == 0`), `pop_front()` removes it in $O(1)$ time, exposing the next priority order instantly.
> 2. **Bounded Log Ring Buffering:** Storing execution history in `trades: VecDeque<TradeRecord>` creates a fixed-memory ring buffer log. Appending trades with `push_back()` paired with `pop_front()` when `len() >= max_trade_history` caps total allocated memory without requiring expensive `Vec` shift operations.
> 3. **Ownership and In-Place Mutations:** `front_mut()` enables in-place partial fill updating (`best_ask.quantity -= fill_qty`). Borrow checker rules require matching operations to drop or release the mutable reference before invoking methods that modify `self.asks` or `self.trades` structure.

---

## 6. Related Terms

- [`Vec<T>`](../level_02/vec_t.md) — The single-ended sibling; `VecDeque` is the right choice specifically when front-end operations matter too.
- [`IntoIterator`](../level_06/intoiterator.md) — `VecDeque` implements this, so it works directly in `for` loops.
- [Channel (`mpsc`)](../level_09/channel_mpsc.md) — Conceptually related: both model a FIFO queue, though `mpsc` adds cross-thread synchronization that a plain `VecDeque` does not have.

---

## 7. Key Takeaways

- `VecDeque<T>` offers O(1) push/pop at **both** the front (`push_front`/`pop_front`) and the back (`push_back`/`pop_back`).
- It's implemented as a ring buffer, so no element-shifting occurs when the "logical start" of the data moves.
- Use it whenever you need queue (FIFO) or sliding-window/ring-buffer behavior — situations where `Vec`'s `.remove(0)` would otherwise be a silent O(n) trap.
- It still supports most `Vec`-like operations (indexing, iteration, `.len()`), so it's a near-drop-in replacement wherever front access matters.
