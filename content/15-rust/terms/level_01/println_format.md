# `println!` / `format!`

> **Level 1 — Foundations**
> Macros for formatted output and string formatting using `{}` placeholders.

---

## 1. Prerequisites


- [Variable](variable.md) — The data you are trying to print or format.
- [String vs &str](string_vs_&str.md) — `format!` specifically creates and returns a heap-allocated `String`.

---

## 2. Term Category

**Rust-specific**: While printing to the console is universal, Rust implements these tools as *macros* (denoted by the `!`) which uniquely parse and validate your formatting at compile-time to guarantee safety.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In older languages like C, formatting text is notoriously dangerous. If you tell C's `printf` function to print a string, but you accidentally pass it an integer, the program will likely crash at runtime.

Rust's designers wanted formatting to be 100% safe without sacrificing speed. To achieve this, `println!` and `format!` are not regular functions; they are **macros**. You can tell they are macros because they end with an exclamation mark (`!`). 

When you compile your code, these macros analyze your format string. They check that you have provided the exact right number of `{}` placeholders, and that the data types you provided can actually be turned into text. If anything is wrong, Rust refuses to compile the program. This guarantees you will never have a formatting crash at runtime.

- **`println!`** takes your formatted text and pushes it immediately to the terminal/console.
- **`format!`** takes your formatted text and returns it as a new, usable `String` variable in your code.

### (2) Reality Metaphor

Think of these macros like a **strict game of Mad Libs**. 

You hand the compiler a piece of paper with a sentence that has blanks in it (the `{}` placeholders), along with a list of words to fill in those blanks. Before the compiler ever publishes the book (compiles the program), it strictly verifies that:
1. There is exactly one word for every blank.
2. The word provided actually makes grammatical sense in that blank. 

If you provide three blanks but only two words, the compiler rips up the paper and makes you fix it before the book is published.

### (3) Rust Code Examples

#### Short Snippet
```rust
let name = "Alice";
let score = 100;

// println! prints directly to the console.
// You can put variables directly inside the braces.
println!("Player {name} has a score of {score}."); 
```

#### Fuller Example
```rust
fn main() {
    let item = "Sword";
    let damage = 50;
    
    // Older Rust style: providing variables after the string.
    // (This is still widely used and required for complex expressions).
    println!("You found a {} that does {} damage.", item, damage);
    
    // Modern Rust style: variables inline inside the braces.
    println!("You found a {item} that does {damage} damage.");
    
    // format! uses the exact same syntax, but instead of printing,
    // it saves the result as a new `String` variable.
    let inventory_text = format!("Inventory: 1x {item}");
    
    // We can then use that String later!
    println!("Status Check: {}", inventory_text);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the exclamation mark (`!`)

**The mistake:** Treating `println` like a normal function in Python or Java.

**Why it's wrong:** Rust requires the `!` to signal that this is a macro that needs to rewrite your code at compile-time. If you omit it, the compiler will look for a regular function named `println`, which doesn't exist.

*Incorrect:*
```rust
println("Hello world"); // ERROR: expected function, found macro `println`
```

*Fix:*
```rust
println!("Hello world");
```

### Mistake 2: Trying to print complex types with `{}`

**The mistake:** Using the standard `{}` placeholder to print an Array, Tuple, or custom Struct.

**Why it's wrong:** The `{}` placeholder asks the data to display itself in a pretty, user-facing way. Primitive types (like numbers and strings) know how to do this. But complex types (like arrays) do not have a default "pretty" format. You must use `{:?}` (Debug format) to tell Rust to print the raw, programmer-facing representation of the data.

*Incorrect:*
```rust
let numbers = [1, 2, 3];
println!("My numbers are {}", numbers); // ERROR: `[{integer}; 3]` doesn't implement `std::fmt::Display`
```

*Fix:*
```rust
let numbers = [1, 2, 3];
// Use `{:?}` to print arrays, tuples, or structs for debugging!
println!("My numbers are {:?}", numbers); 
```

---

### Mistake 3: Concurrent Access to Println Format Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Println Format instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Production Structured Telemetry & Log Event Formatter

**Problem Context:**
In high-throughput microservices and distributed telemetry systems, log aggregation pipelines (such as Elasticsearch, Vector, or Fluentd) require structured, deterministic formatting. Log entries must follow precise width, alignment, and numerical representation rules so that regular expressions or binary ingest parsers can process log lines without allocations or syntax failures.

**Task:**
Implement a log line formatting function `format_log_entry` that consumes a reference to a `LogEvent` struct and constructs a single, formatted `String` using Rust's `format!` macro according to the following specifications:
1. **Timestamp**: Microsecond timestamp (`u64`) zero-padded to 12 digits (e.g., `000000123456`).
2. **Log Level**: Uppercase representation (`DEBUG`, `INFO`, `WARN`, `ERROR`), left-aligned within a fixed 5-character wide field (`{:<5}`).
3. **Target / Module**: Bounded to exactly 16 characters in width (`{:<16.16}`). If the module string is shorter than 16 characters, pad it with trailing spaces; if longer than 16 characters, truncate it to 16 characters.
4. **Request ID**: Hexadecimal integer (`u32`) prefixed with `0x`, zero-padded to 8 uppercase hex digits (e.g., `0x00A1F3C0`).
5. **Message**: Log payload string appended after the request ID.

Format string template:
`[<timestamp>] [<level>] [<target>] [0x<request_id>] <message>`

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LogLevel {
    Debug,
    Info,
    Warn,
    Error,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LogEvent<'a> {
    pub timestamp_us: u64,
    pub level: LogLevel,
    pub target: &'a str,
    pub request_id: u32,
    pub message: &'a str,
}

pub fn format_log_entry(event: &LogEvent) -> String {
    // TODO: Implement using format! macro with width, alignment, precision, and hex specifiers
}
```

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
> impl LogLevel {
>     pub fn as_str(&self) -> &'static str {
>         match self {
>             LogLevel::Debug => "DEBUG",
>             LogLevel::Info => "INFO",
>             LogLevel::Warn => "WARN",
>             LogLevel::Error => "ERROR",
>         }
>     }
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct LogEvent<'a> {
>     pub timestamp_us: u64,
>     pub level: LogLevel,
>     pub target: &'a str,
>     pub request_id: u32,
>     pub message: &'a str,
> }
> 
> pub fn format_log_entry(event: &LogEvent) -> String {
>     format!(
>         "[{:012}] [{:<5}] [{:<16.16}] [0x{:08X}] {}",
>         event.timestamp_us,
>         event.level.as_str(),
>         event.target,
>         event.request_id,
>         event.message
>     )
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_format_log_entry_basic() {
>         let event = LogEvent {
>             timestamp_us: 123456,
>             level: LogLevel::Info,
>             target: "auth_service",
>             request_id: 0x00A1F3C0,
>             message: "User authentication successful",
>         };
>         let formatted = format_log_entry(&event);
>         assert_eq!(
>             formatted,
>             "[000000123456] [INFO ] [auth_service    ] [0x00A1F3C0] User authentication successful"
>         );
>         assert!(formatted.contains("0x00A1F3C0"));
>         assert_ne!(formatted.len(), 0);
>     }
> 
>     #[test]
>     fn test_format_log_entry_target_truncation() {
>         let event = LogEvent {
>             timestamp_us: 999,
>             level: LogLevel::Error,
>             target: "payment_processing_gateway_v2",
>             request_id: 255,
>             message: "Connection timeout",
>         };
>         let formatted = format_log_entry(&event);
>         assert_eq!(
>             formatted,
>             "[000000000999] [ERROR] [payment_processi] [0x000000FF] Connection timeout"
>         );
>         assert!(matches!(event.level, LogLevel::Error));
>     }
> 
>     #[test]
>     fn test_format_log_entry_zero_values() {
>         let event = LogEvent {
>             timestamp_us: 0,
>             level: LogLevel::Debug,
>             target: "core",
>             request_id: 0,
>             message: "System initialized",
>         };
>         let formatted = format_log_entry(&event);
>         assert_eq!(
>             formatted,
>             "[000000000000] [DEBUG] [core            ] [0x00000000] System initialized"
>         );
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Formatting Specifiers**:
>    - `{:012}`: Pads the `u64` timestamp with leading zeroes up to a total width of 12 digits.
>    - `{:<5}`: Left-aligns (`<`) the level string within a 5-character column.
>    - `{:<16.16}`: Combines left alignment (`<`), minimum width (`16`), and maximum precision (`.16`). In Rust string formatting, precision specifies the maximum number of characters included from the slice, truncating longer strings while width pads shorter strings.
>    - `0x{:08X}`: Formats the `u32` request ID as an uppercase hexadecimal (`X`), zero-padded (`0`) to 8 digits, preceded by literal `0x`.
> 2. **Memory & Allocation Invariants**:
>    - `format!` allocates a single heap-allocated `String` via `std::fmt::Arguments`. Using `format!` to produce a single string is significantly more efficient than multiple atomic `print!` calls to stdout, preventing stream interleaving in multithreaded runtime environments.
> 3. **Edge Cases**:
>    - Target strings exceeding 16 bytes are safely truncated without panic due to `.16` string precision specifier.
>    - Maximum `u32` request ID (`0xFFFFFFFF`) and zero timestamps (`000000000000`) fill exact column bounds.
>

---

### Exercise 2: Network Packet Frame Hex & ASCII Inspection Dump

**Problem Context:**
Network protocol analysis tools (such as Wireshark CLI or embedded debug monitors) dump raw binary buffers into aligned hex tables with side-by-side ASCII rendering. Displaying raw bytes requires formatting byte offsets, converting binary values to uppercase hexadecimal strings, padding incomplete lines, and filtering non-printable ASCII control characters.

**Task:**
Implement a function `format_hex_dump(data: &[u8], bytes_per_line: usize) -> String` that formats a byte slice into canonical hexadecimal dump output:
1. **Line Offset**: Displayed at the start of each line as an 8-digit uppercase hex integer zero-padded, followed by `: `: `{:08X}: `.
2. **Hex Bytes**: Display each byte as a 2-digit uppercase hex code `{:02X}` separated by a space.
3. **Alignment Padding**: If a final line has fewer than `bytes_per_line` bytes, pad the missing byte columns with `"   "` (3 spaces) per missing byte to align the ASCII delimiter column.
4. **ASCII Column**: Enclosed in pipes `|...|`. Printable ASCII characters (`0x20..=0x7E`) are rendered as chars; non-printable bytes (e.g. `0x00..0x1F`, `0x7F..0xFF`) are rendered as `.`. Each line ends with `\n`.

```rust
pub fn format_hex_dump(data: &[u8], bytes_per_line: usize) -> String {
    // TODO: Implement formatted hex dump generator
}
```

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub fn format_hex_dump(data: &[u8], bytes_per_line: usize) -> String {
>     if bytes_per_line == 0 || data.is_empty() {
>         return String::new();
>     }
> 
>     let estimated_lines = (data.len() + bytes_per_line - 1) / bytes_per_line;
>     let line_len = 10 + (3 * bytes_per_line) + 3 + bytes_per_line + 1;
>     let mut result = String::with_capacity(estimated_lines * line_len);
> 
>     for (chunk_idx, chunk) in data.chunks(bytes_per_line).enumerate() {
>         let offset = chunk_idx * bytes_per_line;
>         result.push_str(&format!("{:08X}: ", offset));
> 
>         for b in chunk {
>             result.push_str(&format!("{:02X} ", b));
>         }
> 
>         if chunk.len() < bytes_per_line {
>             let missing = bytes_per_line - chunk.len();
>             for _ in 0..missing {
>                 result.push_str("   ");
>             }
>         }
> 
>         result.push_str(" |");
> 
>         for b in chunk {
>             if (0x20..=0x7E).contains(b) {
>                 result.push(*b as char);
>             } else {
>                 result.push('.');
>             }
>         }
> 
>         result.push_str("|\n");
>     }
> 
>     result
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_format_hex_dump_full_and_partial_line() {
>         let input = b"Hello, World! 123";
>         let output = format_hex_dump(input, 16);
>         assert!(output.starts_with("00000000: 48 65 6C 6C 6F 2C 20 57 6F 72 6C 64 21 20 31 32  |Hello, World! 12|\n"));
>         assert!(output.contains("00000010: 33                                             |3|\n"));
>         assert_eq!(output.lines().count(), 2);
>         assert_ne!(output.len(), 0);
>     }
> 
>     #[test]
>     fn test_format_hex_dump_non_printable_bytes() {
>         let input = &[0x00, 0x0A, 0x1B, 0x41, 0x7F, 0xFF];
>         let output = format_hex_dump(input, 8);
>         assert!(output.contains(".A.."));
>         assert!(matches!(input.len(), 6));
>     }
> 
>     #[test]
>     fn test_format_hex_dump_empty() {
>         let output = format_hex_dump(&[], 16);
>         assert_eq!(output, "");
>         assert!(output.is_empty());
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Step-by-Step Logic**:
>    - `data.chunks(bytes_per_line)` breaks the raw slice into line-sized byte slices.
>    - `chunk_idx * bytes_per_line` computes the memory byte offset, formatted via `{:08X}: `.
>    - `{:02X} ` formats individual byte values into two-digit uppercase hex representation with trailing space.
>    - Short final chunks calculate `bytes_per_line - chunk.len()` and insert 3 spaces per missing byte to maintain layout symmetry.
>    - Range check `(0x20..=0x7E).contains(b)` determines whether a byte is a printable ASCII character or must be mapped to `.`.
> 2. **Buffer Pre-allocation**:
>    - Using `String::with_capacity` pre-allocates contiguous heap memory based on line counts, eliminating dynamic reallocations during formatting loop execution.
> 3. **Edge Cases**:
>    - `bytes_per_line == 0` or empty slice `data.is_empty()` returns an empty string without panic or divide-by-zero errors.
>

---

### Exercise 3: High-Frequency Trading Order Book Console Renderer

**Problem Context:**
High-frequency financial trading applications render real-time Level-2 market depth (Bids & Asks) on operator terminals. Tables must display fixed column widths, aligned floating-point numbers with precise decimal places, fill characters for table headers, and explicit plus/minus signs for spread indicators.

**Task:**
Implement `render_order_book(snapshot: &OrderBookSnapshot) -> String` to render a 40-character wide ASCII console order book:
1. **Header Banner**: Centered symbol and 10-digit zero-padded sequence ID padded with `=` fill characters across a 40-character width: `{:=^40}`.
   Title template: ` ORDER BOOK: <symbol> (Seq: <sequence:010>) `
2. **Columns**: `SIDE |   PRICE   |   QUANTITY   | ORDERS` (Widths: `SIDE`=4, `PRICE`=9 right-aligned, `QUANTITY`=12 right-aligned, `ORDERS`=6 right-aligned).
3. **Asks (Sell Orders)**: Top 5 ask levels displayed in reverse order (highest price top, lowest ask adjacent to bid section):
   - Side `"ASK "`, price formatted `{:>9.2}`, quantity formatted `{:>12.4}`, orders formatted `{:>6}`.
4. **Bids (Buy Orders)**: Top 5 bid levels displayed in order (highest bid adjacent to ask section):
   - Side `"BID "`, price formatted `{:>9.2}`, quantity formatted `{:>12.4}`, orders formatted `{:>6}`.
5. **Section Dividers**: 40 dash characters `----------------------------------------`.
6. **Footer Summary**: `SPREAD: {:+.2}` displaying spread (`min_ask.price - max_bid.price`) with explicit sign specifier `+`. If asks or bids are empty, display `SPREAD: N/A`.

```rust
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct OrderLevel {
    pub price: f64,
    pub quantity: f64,
    pub order_count: u32,
}

#[derive(Debug, Clone)]
pub struct OrderBookSnapshot<'a> {
    pub symbol: &'a str,
    pub sequence: u64,
    pub asks: &'a [OrderLevel],
    pub bids: &'a [OrderLevel],
}

pub fn render_order_book(snapshot: &OrderBookSnapshot) -> String {
    // TODO: Implement tabular console renderer using format! specifiers
}
```

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, Clone, Copy, PartialEq)]
> pub struct OrderLevel {
>     pub price: f64,
>     pub quantity: f64,
>     pub order_count: u32,
> }
> 
> #[derive(Debug, Clone)]
> pub struct OrderBookSnapshot<'a> {
>     pub symbol: &'a str,
>     pub sequence: u64,
>     pub asks: &'a [OrderLevel],
>     pub bids: &'a [OrderLevel],
> }
> 
> pub fn render_order_book(snapshot: &OrderBookSnapshot) -> String {
>     let mut out = String::with_capacity(512);
> 
>     // 1. Header Banner
>     let header_title = format!(" ORDER BOOK: {} (Seq: {:010}) ", snapshot.symbol, snapshot.sequence);
>     out.push_str(&format!("{:=^40}\n", header_title));
> 
>     // 2. Column Headers
>     out.push_str(&format!("{:<4} | {:^9} | {:^12} | {:>6}\n", "SIDE", "PRICE", "QUANTITY", "ORDERS"));
>     out.push_str(&format!("{}\n", "-".repeat(40)));
> 
>     // 3. Asks (Top 5, reversed so highest ask is at top, lowest ask near bid boundary)
>     let top_asks = &snapshot.asks[..snapshot.asks.len().min(5)];
>     for level in top_asks.iter().rev() {
>         out.push_str(&format!(
>             "{:<4} | {:>9.2} | {:>12.4} | {:>6}\n",
>             "ASK", level.price, level.quantity, level.order_count
>         ));
>     }
> 
>     // 4. Spread Divider
>     out.push_str(&format!("{}\n", "-".repeat(40)));
> 
>     // 5. Bids (Top 5, highest bid first)
>     let top_bids = &snapshot.bids[..snapshot.bids.len().min(5)];
>     for level in top_bids.iter() {
>         out.push_str(&format!(
>             "{:<4} | {:>9.2} | {:>12.4} | {:>6}\n",
>             "BID", level.price, level.quantity, level.order_count
>         ));
>     }
> 
>     // 6. Footer Summary
>     out.push_str(&format!("{}\n", "-".repeat(40)));
>     if let (Some(best_ask), Some(best_bid)) = (snapshot.asks.first(), snapshot.bids.first()) {
>         let spread = best_ask.price - best_bid.price;
>         out.push_str(&format!("SPREAD: {:+.2}\n", spread));
>     } else {
>         out.push_str("SPREAD: N/A\n");
>     }
> 
>     out
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_render_order_book_basic() {
>         let asks = vec![
>             OrderLevel { price: 100.50, quantity: 1.5, order_count: 3 },
>             OrderLevel { price: 101.00, quantity: 2.0, order_count: 5 },
>         ];
>         let bids = vec![
>             OrderLevel { price: 100.20, quantity: 4.0, order_count: 2 },
>             OrderLevel { price: 99.80, quantity: 10.0, order_count: 8 },
>         ];
>         let snapshot = OrderBookSnapshot {
>             symbol: "ETH/USD",
>             sequence: 42,
>             asks: &asks,
>             bids: &bids,
>         };
> 
>         let rendered = render_order_book(&snapshot);
>         assert!(rendered.contains("ORDER BOOK: ETH/USD (Seq: 0000000042)"));
>         assert!(rendered.contains("ASK  |    101.00 |       2.0000 |      5"));
>         assert!(rendered.contains("ASK  |    100.50 |       1.5000 |      3"));
>         assert!(rendered.contains("BID  |    100.20 |       4.0000 |      2"));
>         assert!(rendered.contains("SPREAD: +0.30"));
>         assert_ne!(rendered.len(), 0);
>     }
> 
>     #[test]
>     fn test_render_order_book_empty_spread() {
>         let snapshot = OrderBookSnapshot {
>             symbol: "SOL/USD",
>             sequence: 1,
>             asks: &[],
>             bids: &[],
>         };
>         let rendered = render_order_book(&snapshot);
>         assert!(rendered.contains("SPREAD: N/A"));
>         assert!(matches!(snapshot.asks.len(), 0));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Advanced Format Specifiers**:
>    - `{:=^40}`: Uses `=` as fill character (`=`), centered alignment (`^`), and minimum total width `40`.
>    - `{:>9.2}`: Right-aligns (`>`) floating-point number within a 9-character field rounded to 2 decimal places (`.2`).
>    - `{:>12.4}`: Right-aligns floating-point quantity within a 12-character field rounded to 4 decimal places (`.4`).
>    - `{:+.2}`: Forces display of explicit positive sign (`+`) or negative sign for numeric floating-point values.
> 2. **Order Book Presentation Logic**:
>    - In financial order books, asks are rendered with the lowest ask (best ask) at the bottom of the asks block, and bids are rendered with highest bid (best bid) at the top of the bids block. Reversing the top 5 asks (`iter().rev()`) places the best ask directly adjacent to the best bid across the middle divider.
> 3. **Concurrency & Thread Safety**:
>    - Function accepts immutable reference snapshot `&OrderBookSnapshot`. String allocation takes place purely on the stack/heap of the caller thread without shared state synchronization locks.
>

---

## 6. Related Terms


- [String vs &str](string_vs_&str.md) — The `format!` macro specifically returns a `String` (heap-allocated), not a `&str`.
- [`dbg!` Macro](dbg_macro.md) — Related concept: `dbg!` Macro.
- [Macros](macros.md) — Related concept: Macros.
- [`Display` Trait](../level_04/display_trait.md) — Display formatting trait.

---

## 7. Key Takeaways

- `println!` and `format!` are **macros**, not functions. They must end with an exclamation mark (`!`).
- `println!` outputs text to the console.
- `format!` returns a brand new `String` that you can save to a variable.
- Both use `{}` placeholders to inject variables. You can put the variable name directly inside the braces (e.g., `{name}`).
- Use `{:?}` instead of `{}` if you need to print a complex type like an Array or Tuple for debugging purposes.
