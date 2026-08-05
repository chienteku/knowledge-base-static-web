# Iterator

> **Level 2 — Control Flow & Data Structures**
> A trait providing lazy, sequential access to elements via `.next()`.

---

## 1. Prerequisites


- [`Vec<T>`](vec_t.md) — The most common collection that we iterate over.
- [`Option<T>`](option_t.md) — The data type returned by an iterator to signify if there is data left or if the sequence is finished.
- [`for` / Range](for_range.md) — The loop syntax that secretly uses iterators behind the scenes.

---

## 2. Term Category

**Rust-specific (the laziness and safety)**: Iterators exist in many languages (like Python or Java), but in Rust, they are famous for two things: they are **"lazy"** (they do absolutely zero work until you force them to) and they are **"zero-cost abstractions"** (the compiler optimizes them to be just as fast as writing a manual, dangerous C-style loop).

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In older languages like C, you iterate over an array by managing an index variable manually:
`for (int i = 0; i < array_length; i++) { print(array[i]); }`

This is incredibly error-prone. What if you miscalculate `array_length`? What if you accidentally type `<=` instead of `<`? Your program will try to access memory that doesn't exist and instantly crash.

Rust solves this with **Iterators**. An Iterator is an intelligent object whose sole purpose is to yield the next item in a sequence. Because the Iterator internally tracks where it is, it is mathematically impossible to accidentally ask for an "out of bounds" index. It is perfectly memory-safe.

### (2) Reality Metaphor

Imagine a **PEZ candy dispenser**. 

The PEZ dispenser is the Iterator. It holds a sequence of candies. When you interact with it, you don't ask it, "Give me candy number 4." Instead, you just push the head back, and it yields the *next* candy in the sequence. 

You keep pushing the head back, and it keeps returning `Some(Candy)`. Eventually, the dispenser empties. When you push the head back one final time, it returns `None`. You cannot accidentally pull a candy from a dispenser that is empty.

### (3) Rust Code Examples

#### Short Snippet (The Mechanics of `.next()`)
All iterators work by calling the `.next()` method, which returns an `Option`.
```rust
fn main() {
    let my_vec = vec!["Apple", "Banana"];
    
    // Create an iterator from the Vector
    let mut my_iterator = my_vec.iter();
    
    // Manually pull the lever on the PEZ dispenser
    println!("{:?}", my_iterator.next()); // Prints: Some("Apple")
    println!("{:?}", my_iterator.next()); // Prints: Some("Banana")
    println!("{:?}", my_iterator.next()); // Prints: None (The dispenser is empty!)
}
```

#### Fuller Example (The `for` Loop Magic)
Manually calling `.next()` is tedious. This is why Rust has the `for` loop! A `for` loop is actually just syntactic sugar. It automatically creates an Iterator from your collection, calls `.next()` over and over, extracts the value from `Some`, and stops looping the moment it sees a `None`.

```rust
fn main() {
    let numbers = vec![10, 20, 30];
    
    // The `for` loop automatically calls `.iter()` and `.next()` for you!
    for num in numbers.iter() {
        println!("Number: {}", num);
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Iterator Scoping and Lifecycle Rules

**The mistake:** Assuming Iterator instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("iterator_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("iterator_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Iterator State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Iterator through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Iterator Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Iterator instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: High-Throughput Log Stream Batcher (`LogChunker`)

**Scenario:** In production log aggregation microservices (such as Vector or Fluentd agents), sending individual log entries over the network introduces excessive HTTP header overhead and socket syscall pressure. To optimize network throughput, raw log streams must be dynamically batched into chunks based on two constraints: maximum entry count (`max_items`) and maximum payload byte size (`max_bytes`).

**Problem Statement:**
Implement a stateful iterator adapter `LogChunker<I>` that wraps any underlying iterator `I: Iterator<Item = LogEntry>`. 

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LogEntry {
    pub level: String,
    pub message: String,
}
```

The `LogChunker` struct should be instantiated via `LogChunker::new(iter: I, max_items: usize, max_bytes: usize)`.
Implement `Iterator` for `LogChunker<I>` returning `type Item = Vec<LogEntry>`. 
Rules:
1. Each call to `.next()` collects and yields a `Vec<LogEntry>` representing a single batch.
2. A batch closes and is yielded as soon as adding another entry would exceed `max_items` OR exceed `max_bytes` total accumulated message length.
3. If an individual `LogEntry` exceeds `max_bytes` on its own when the current batch is empty, yield that single item in its own batch to avoid blocking pipeline progress.
4. When the underlying iterator yields `None`, return any remaining buffered entries or `None` if completely exhausted.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct LogEntry {
>     pub level: String,
>     pub message: String,
> }
> 
> pub struct LogChunker<I> {
>     iter: I,
>     max_items: usize,
>     max_bytes: usize,
>     pending: Option<LogEntry>,
> }
> 
> impl<I> LogChunker<I>
> where
>     I: Iterator<Item = LogEntry>,
> {
>     pub fn new(iter: I, max_items: usize, max_bytes: usize) -> Self {
>         Self {
>             iter,
>             max_items,
>             max_bytes,
>             pending: None,
>         }
>     }
> }
> 
> impl<I> Iterator for LogChunker<I>
> where
>     I: Iterator<Item = LogEntry>,
> {
>     type Item = Vec<LogEntry>;
> 
>     fn next(&mut self) -> Option<Self::Item> {
>         let mut chunk = Vec::new();
>         let mut current_bytes = 0;
> 
>         // Inject pending entry left over from a previous size threshold breach
>         if let Some(entry) = self.pending.take() {
>             current_bytes += entry.message.len();
>             chunk.push(entry);
>         }
> 
>         while chunk.len() < self.max_items {
>             let next_entry = match self.iter.next() {
>                 Some(entry) => entry,
>                 None => break,
>             };
> 
>             let entry_bytes = next_entry.message.len();
> 
>             if chunk.is_empty() {
>                 // First item in chunk: always accept to prevent getting stuck
>                 current_bytes += entry_bytes;
>                 chunk.push(next_entry);
>             } else if chunk.len() + 1 > self.max_items || current_bytes + entry_bytes > self.max_bytes {
>                 // Size or count limit reached: save for next iteration and yield current chunk
>                 self.pending = Some(next_entry);
>                 break;
>             } else {
>                 current_bytes += entry_bytes;
>                 chunk.push(next_entry);
>             }
>         }
> 
>         if chunk.is_empty() {
>             None
>         } else {
>             Some(chunk)
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_log_chunker_item_and_byte_limits() {
>         let logs = vec![
>             LogEntry { level: "INFO".into(), message: "hello".into() },     // 5 bytes
>             LogEntry { level: "WARN".into(), message: "world".into() },     // 5 bytes
>             LogEntry { level: "ERROR".into(), message: "overflow".into() },  // 8 bytes
>             LogEntry { level: "INFO".into(), message: "a".into() },         // 1 byte
>         ];
> 
>         // Batch constraints: max 3 items, max 12 bytes
>         let mut chunker = LogChunker::new(logs.into_iter(), 3, 12);
> 
>         // Batch 1: "hello" (5B) + "world" (5B) = 10B (adding "overflow" would make 18B > 12B)
>         let chunk1 = chunker.next();
>         assert!(chunk1.is_some());
>         let c1 = chunk1.unwrap();
>         assert_eq!(c1.len(), 2);
>         assert_eq!(c1[0].message, "hello");
>         assert_eq!(c1[1].message, "world");
> 
>         // Batch 2: "overflow" (8B) + "a" (1B) = 9B
>         let chunk2 = chunker.next();
>         assert!(chunk2.is_some());
>         let c2 = chunk2.unwrap();
>         assert_eq!(c2.len(), 2);
>         assert_ne!(c2[0].message, "hello");
>         assert_eq!(c2[0].message, "overflow");
> 
>         // Batch 3: Exhausted
>         let chunk3 = chunker.next();
>         assert!(matches!(chunk3, None));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
>
>
> 1. **Stateful Wrapping & Lookahead (`pending`)**: Custom iterator adapters that aggregate or split elements often need lookahead buffering. When an incoming item breaches `max_bytes` or `max_items`, it cannot be included in the current batch. Storing it in `self.pending: Option<LogEntry>` allows `LogChunker` to defer processing that entry until the next `.next()` invocation without dropping data or requiring full iterator backtracking.
> 2. **Generic Trait Bound (`I: Iterator<Item = LogEntry>`)**: The struct is generic over `I`, accepting any iterator type (e.g. `std::vec::IntoIter<LogEntry>`, channel receivers converted to iterators, or custom stream adapters). Specifying `type Item = Vec<LogEntry>` on `Iterator` connects inner item consumption to outer vector batch production.
> 3. **Edge Case Safety (Oversized Single Items)**: If an incoming message is longer than `max_bytes` (e.g., a 50KB stack trace when `max_bytes` is 10KB), placing it into an empty chunk (`chunk.is_empty()`) guarantees forward progress. Without this guard, an oversized item would cause an infinite loop where the adapter repeatedly refuses to insert the item into a new chunk.

---

### Exercise 2: Quantitative Trading Rolling Simple Moving Average (`SlidingWindowMA`)

**Scenario:** In real-time market data streaming engines, automated trading strategies calculate rolling technical indicators like Simple Moving Average (SMA) over incoming tick price streams. Loading entire historical price sequences into memory is memory-inefficient; calculating the moving average lazily with a sliding window sliding by 1 tick per step ensures $O(1)$ memory consumption and $O(1)$ time complexity per tick.

**Problem Statement:**
Implement a custom streaming iterator `SlidingWindowMA<I>` that wraps an inner price iterator `I: Iterator<Item = f64>`.
Constructor: `SlidingWindowMA::new(iter: I, window_size: usize)`.
Implement `Iterator for SlidingWindowMA<I>` with `type Item = f64`.
Rules:
1. If `window_size == 0`, `.next()` immediately returns `None`.
2. Maintain an internal `VecDeque<f64>` and running total `sum: f64`.
3. On the first call to `.next()`, consume `window_size` items from the inner iterator to populate the initial window. If the stream ends before `window_size` items can be collected, return `None`.
4. On subsequent calls to `.next()`, pull 1 new element from the inner iterator, subtract the oldest element popped from the front of `VecDeque`, push the new element to the back, and return `Some(running_sum / window_size)`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::VecDeque;
> 
> pub struct SlidingWindowMA<I> {
>     iter: I,
>     window_size: usize,
>     window: VecDeque<f64>,
>     sum: f64,
> }
> 
> impl<I> SlidingWindowMA<I>
> where
>     I: Iterator<Item = f64>,
> {
>     pub fn new(iter: I, window_size: usize) -> Self {
>         Self {
>             iter,
>             window_size,
>             window: VecDeque::with_capacity(window_size),
>             sum: 0.0,
>         }
>     }
> }
> 
> impl<I> Iterator for SlidingWindowMA<I>
> where
>     I: Iterator<Item = f64>,
> {
>     type Item = f64;
> 
>     fn next(&mut self) -> Option<Self::Item> {
>         if self.window_size == 0 {
>             return None;
>         }
> 
>         if self.window.is_empty() {
>             // Fill initial sliding window
>             for _ in 0..self.window_size {
>                 let val = self.iter.next()?;
>                 self.sum += val;
>                 self.window.push_back(val);
>             }
>             Some(self.sum / self.window_size as f64)
>         } else {
>             // Slide window by 1 element
>             let new_val = self.iter.next()?;
>             if let Some(old_val) = self.window.pop_front() {
>                 self.sum -= old_val;
>             }
>             self.sum += new_val;
>             self.window.push_back(new_val);
>             Some(self.sum / self.window_size as f64)
>         }
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_sliding_window_ma() {
>         let prices = vec![10.0, 20.0, 30.0, 40.0, 50.0];
>         let mut sma = SlidingWindowMA::new(prices.into_iter(), 3);
> 
>         let first = sma.next();
>         assert!(first.is_some());
>         assert_eq!(first.unwrap(), 20.0); // (10 + 20 + 30) / 3 = 20
> 
>         let second = sma.next();
>         assert!(second.is_some());
>         assert_eq!(second.unwrap(), 30.0); // (20 + 30 + 40) / 3 = 30
> 
>         let third = sma.next();
>         assert_eq!(third, Some(40.0)); // (30 + 40 + 50) / 3 = 40
> 
>         let fourth = sma.next();
>         assert!(matches!(fourth, None));
>         assert_ne!(fourth, Some(50.0));
>     }
> 
>     #[test]
>     fn test_short_stream_returns_none() {
>         let prices = vec![10.0, 20.0];
>         let mut sma = SlidingWindowMA::new(prices.into_iter(), 3);
>         assert!(matches!(sma.next(), None));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
>
>
> 1. **Constant-Time $O(1)$ Window Operations**: Standard library iterators like `.windows()` on slices require pre-existing slice memory. By building a custom `Iterator` using `std::collections::VecDeque`, elements are continuously pushed and popped in $O(1)$ time while updating a running total `sum`. This enables processing unbounded streams without memory growth.
> 2. **Short-Circuit Early Exit (`?` operator)**: In `next()`, calling `self.iter.next()?` utilizes the `?` operator on `Option`. If the underlying stream ends before accumulating `window_size` elements or runs out of elements during a slide operation, `?` immediately evaluates to `None` and returns early from `next()`.
> 3. **Floating Point Precision Invariants**: In high-precision contexts, continuous subtraction and addition of floating-point numbers can accumulate small rounding errors. In production applications, Kahan summation algorithms or integer fixed-point representations are paired with custom iterators to guarantee accuracy.

---

### Exercise 3: Zero-Allocation Lazy Protocol Header Tokenizer (`HeaderParser<'a>`)

**Scenario:** Network middleboxes, proxy servers, and API gateways parse custom ASCII protocol headers formatted as semicolon-separated key-value pairs (e.g. `"Content-Type=application/json; Authorization=Bearer token"`). To maximize throughput and avoid memory fragmenting heap allocations, headers must be parsed lazily without allocating `String` or `Vec` instances.

**Problem Statement:**
Implement a zero-copy custom iterator `HeaderParser<'a>` that borrows a string slice `&'a str` and yields parsed key-value pairs lazily.

```rust
#[derive(Debug, PartialEq, Eq)]
pub struct HeaderPair<'a> {
    pub key: &'a str,
    pub value: &'a str,
}
```

Requirements:
1. `HeaderParser::new(input: &'a str) -> Self`.
2. Implement `Iterator for HeaderParser<'a>` returning `type Item = HeaderPair<'a>`.
3. Split the input slice on `;` delimiters, trim leading and trailing whitespace from both `key` and `value`.
4. Skip empty segments or malformed segments lacking an `=` symbol.
5. All returned string slices in `HeaderPair<'a>` must share lifetime `'a` borrowed from the original string.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq)]
> pub struct HeaderPair<'a> {
>     pub key: &'a str,
>     pub value: &'a str,
> }
> 
> pub struct HeaderParser<'a> {
>     remainder: &'a str,
> }
> 
> impl<'a> HeaderParser<'a> {
>     pub fn new(input: &'a str) -> Self {
>         Self { remainder: input }
>     }
> }
> 
> impl<'a> Iterator for HeaderParser<'a> {
>     type Item = HeaderPair<'a>;
> 
>     fn next(&mut self) -> Option<Self::Item> {
>         while !self.remainder.is_empty() {
>             // Extract current segment up to ';' or remaining string end
>             let (segment, rest) = match self.remainder.find(';') {
>                 Some(idx) => (&self.remainder[..idx], &self.remainder[idx + 1..]),
>                 None => (self.remainder, ""),
>             };
>             self.remainder = rest;
> 
>             let trimmed_segment = segment.trim();
>             if trimmed_segment.is_empty() {
>                 continue;
>             }
> 
>             // Locate key-value separator '='
>             if let Some(eq_idx) = trimmed_segment.find('=') {
>                 let key = trimmed_segment[..eq_idx].trim();
>                 let value = trimmed_segment[eq_idx + 1..].trim();
> 
>                 if !key.is_empty() {
>                     return Some(HeaderPair { key, value });
>                 }
>             }
>         }
>         None
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_header_parser_zero_copy() {
>         let raw_headers = " Content-Type = application/json ; Authorization = Bearer secret_token ; malformed_entry ; Cache-Control = no-cache ";
>         let mut parser = HeaderParser::new(raw_headers);
> 
>         let pair1 = parser.next();
>         assert!(pair1.is_some());
>         assert_eq!(pair1.as_ref().unwrap().key, "Content-Type");
>         assert_eq!(pair1.as_ref().unwrap().value, "application/json");
> 
>         let pair2 = parser.next();
>         assert!(pair2.is_some());
>         assert_eq!(pair2.as_ref().unwrap().key, "Authorization");
>         assert_eq!(pair2.as_ref().unwrap().value, "Bearer secret_token");
> 
>         let pair3 = parser.next();
>         assert!(pair3.is_some());
>         assert_eq!(pair3.as_ref().unwrap().key, "Cache-Control");
>         assert_ne!(pair3.as_ref().unwrap().key, "malformed_entry");
> 
>         let pair4 = parser.next();
>         assert!(matches!(pair4, None));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
>
>
> 1. **Lifetime Annotations `'a`**: By tying lifetime `'a` from `HeaderParser<'a>` to `HeaderPair<'a>`, Rust's borrow checker guarantees that sub-slices `key` and `value` remain valid for as long as the underlying string slice input exists. Zero heap allocations (`String` or `Vec`) take place during iteration.
> 2. **State Mutability via Slicing**: In each iteration of `.next()`, `self.remainder` is updated to point to the slice remaining after the delimiter index (`&self.remainder[idx + 1..]`). Rust's slice operation `&str[..idx]` is $O(1)$ as it simply adjusts pointers and length fields under the hood.
> 3. **Fault-Tolerant Skipping**: The `while !self.remainder.is_empty()` loop handles whitespace-only segments or malformed headers without panicking or terminating iteration prematurely. Skips occur seamlessly until a valid key-value pair is encountered or the slice is completely consumed.

---

## 6. Related Terms


- [Collecting](collecting.md) — The process of forcing a lazy Iterator to do its work and save the results back into a concrete collection (like a new `Vec`).
- [`for` / Range](for_range.md) — The loop syntax that consumes iterators.
- [Closure](../level_06/closure.md) — Anonymous functions heavily used alongside iterator methods like `.map()` and `.filter()`.
- [`FromIterator` / `Extend` Traits](fromiterator_extend_traits.md) — Related concept: `FromIterator` / `Extend` Traits.
- [Iterator Adapters](iterator_adapters.md) — Related concept: Iterator Adapters.
- [`Iterator` Consumers (`fold`, `reduce`, `sum`, `product`, `count`, `any`, `all`, `find`, `position`)](iterator_consumers.md) — Related concept: `Iterator` Consumers (`fold`, `reduce`, `sum`, `product`, `count`, `any`, `all`, `find`, `position`).
- [`Vec<T>`](vec_t.md) — Related concept: `Vec<T>`.
- [Associated Types](../level_04/associated_types.md) — Related concept: Associated Types.
- [`impl Trait`](../level_04/impl_trait.md) — Related concept: `impl Trait`.
- [`IntoIterator`](../level_06/intoiterator.md) — Related concept: `IntoIterator`.
- [GATs (Generic Associated Types)](../level_14/gats.md) — Related concept: GATs (Generic Associated Types).
- [Zero-Cost Abstractions](../level_15/zero_cost_abstractions.md) — Related concept: Zero-Cost Abstractions.

---

## 7. Key Takeaways

- An **Iterator** is an object that yields values one-by-one in a sequence.
- It relies entirely on a `.next()` method that returns `Some(value)`, or `None` when the sequence is empty.
- Standard `for` loops are just syntactic sugar that automatically consume Iterators.
- Iterators are **lazy**; they do absolutely no work until they are actively consumed by a loop or method.
- Use `.iter()` to borrow data (read-only), and `.into_iter()` to consume data (destroys the collection).
