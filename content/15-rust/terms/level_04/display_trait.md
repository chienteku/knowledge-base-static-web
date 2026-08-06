# `Display` Trait

> **Level 4 — Error Handling & Generics**
> A trait allowing types to be formatted using `{}` (user-facing output) — cannot be derived.

---

## 1. Prerequisites


- [Trait](trait.md) — The contract being manually implemented.
- [`println!` / `format!`](../level_01/println_format.md) — The macros that consume this trait.
- [`Debug` Trait](debug_trait.md) — The developer-facing counterpart.

---

## 2. Term Category

**Rust-specific (the marketing brochure)**: While `Debug` shows the raw, ugly technical truth of a data structure, `Display` is the trait used to format data exactly how you want a non-programmer (or an end-user) to see it. It is the trait that powers the standard `{}` print syntax.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Imagine you have a `Money` struct containing an `amount` field and a `currency` field. 

If you use `Debug`, it prints: `Money { amount: 100, currency: "USD" }`. 
An end-user looking at a shopping cart receipt doesn't want to see that! They want to see **`$100.00`**. 

Rust designed the `Display` trait so you can manually write the code that transforms your struct into that beautiful, business-logic-specific string. 

Because "beauty" and "business logic" are highly subjective, the compiler has absolutely no idea how you want your struct to look. Do you want `$100`, or `100 USD`, or `100.00$`? Because the compiler cannot guess your business logic, **`Display` can NEVER be derived.** You must always write it manually.

### (2) Reality Metaphor

If `Debug` is the technical serial-number sticker on the back of a flat-screen TV, **`Display` is the glossy marketing brochure** handed to the customer in the store. 

An automated factory (the `#[derive]` macro) can print the serial number sticker automatically because it's purely mechanical: just list the parts. But an automated factory cannot write a compelling, human-readable marketing brochure. A human being has to sit down and write that brochure manually.

### (3) Rust Code Examples

#### Short Snippet (Writing the Brochure)
Notice that the signature for implementing `Display` is exactly the same as implementing `Debug`. You use `write!` to push your formatted string into the provided Formatter.

```rust
use std::fmt;

struct Money {
    amount: u32,
    currency: String,
}

// We MUST write this manually. No macros allowed!
impl fmt::Display for Money {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        // We decide exactly how it looks to the end-user!
        write!(f, "{} {}", self.amount, self.currency)
    }
}

fn main() {
    let price = Money { amount: 250, currency: String::from("EUR") };
    
    // We use `{}` for Display, not `{:?}`!
    println!("The total cost is {}", price); 
    // Output: The total cost is 250 EUR
}
```

#### Fuller Example (The Magic of `.to_string()`)
Implementing `Display` gives you an incredible hidden superpower. The moment you implement `Display` for a struct, the Rust compiler secretly implements the `.to_string()` method for that struct for free!

```rust
use std::fmt;

struct User {
    first_name: String,
    last_name: String,
}

impl fmt::Display for User {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{} {}", self.first_name, self.last_name)
    }
}

fn main() {
    let my_user = User { 
        first_name: String::from("John"), 
        last_name: String::from("Doe") 
    };
    
    // MAGIC! Because we wrote Display, we instantly get `.to_string()` for free!
    let full_name: String = my_user.to_string();
    
    println!("Saved string: {}", full_name); // Prints: Saved string: John Doe
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Display Trait Scoping and Lifecycle Rules

**The mistake:** Assuming Display Trait instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("display_trait_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("display_trait_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Display Trait State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Display Trait through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Display Trait Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Display Trait instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Zero-Allocation Audit Record Formatter with Dynamic Specifier Flags

**Scenario:**
In a high-frequency financial backend, log formatting must be zero-allocation to prevent memory fragmentation and latency spikes. You are building a telemetry library and need to implement `std::fmt::Display` for an `AuditRecord` struct representing financial transactions.

Requirements:
1. Define an enum `AuditStatus`:
   - `Success`
   - `Failed(String)`
   - `Pending`
   Implement `std::fmt::Display` for `AuditStatus` rendering `"SUCCESS"`, `"FAILED: <reason>"`, or `"PENDING"`.
2. Define a struct `AuditRecord`:
   - `id`: `u64`
   - `action`: `&'static str`
   - `amount`: `f64`
   - `status`: `AuditStatus`
3. Implement `std::fmt::Display` for `AuditRecord`:
   - Default format pattern: `"[AUDIT #<id>] <action> - <status> ($<amount>)"`.
   - Read precision from `f.precision()` if passed via format specifier (e.g. `{:.4}`). Default to `2` decimal places if omitted.
   - Stream formatted output directly to `fmt::Formatter` using `write!` without creating intermediate heap `String` allocations.
4. Include comprehensive unit tests with `#[cfg(test)] mod tests` using `assert_eq!`, `assert!`, `assert_ne!`, and `matches!`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::fmt;
> 
> #[derive(Debug, Clone, PartialEq)]
> pub enum AuditStatus {
>     Success,
>     Failed(String),
>     Pending,
> }
> 
> impl fmt::Display for AuditStatus {
>     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
>         match self {
>             AuditStatus::Success => write!(f, "SUCCESS"),
>             AuditStatus::Failed(reason) => write!(f, "FAILED: {}", reason),
>             AuditStatus::Pending => write!(f, "PENDING"),
>         }
>     }
> }
> 
> pub struct AuditRecord {
>     pub id: u64,
>     pub action: &'static str,
>     pub amount: f64,
>     pub status: AuditStatus,
> }
> 
> impl fmt::Display for AuditRecord {
>     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
>         let precision = f.precision().unwrap_or(2);
>         write!(
>             f,
>             "[AUDIT #{}] {} - {} (${:.1$})",
>             self.id, self.action, self.status, self.amount, precision
>         )
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_audit_record_display_success() {
>         let record = AuditRecord {
>             id: 1001,
>             action: "TRANSFER",
>             amount: 2500.5,
>             status: AuditStatus::Success,
>         };
>         let formatted = record.to_string();
>         assert_eq!(formatted, "[AUDIT #1001] TRANSFER - SUCCESS ($2500.50)");
>         assert!(formatted.contains("SUCCESS"));
>         assert_ne!(formatted, "");
>     }
> 
>     #[test]
>     fn test_audit_record_display_failed_and_precision() {
>         let record = AuditRecord {
>             id: 1002,
>             action: "WITHDRAWAL",
>             amount: 50.123456,
>             status: AuditStatus::Failed("Insufficient funds".to_string()),
>         };
>         let default_fmt = format!("{}", record);
>         assert_eq!(default_fmt, "[AUDIT #1002] WITHDRAWAL - FAILED: Insufficient funds ($50.12)");
> 
>         let custom_precision = format!("{:.4}", record);
>         assert_eq!(custom_precision, "[AUDIT #1002] WITHDRAWAL - FAILED: Insufficient funds ($50.1235)");
> 
>         assert!(matches!(record.status, AuditStatus::Failed(_)));
>     }
> 
>     #[test]
>     fn test_audit_record_pending() {
>         let record = AuditRecord {
>             id: 1003,
>             action: "DEPOSIT",
>             amount: 100.0,
>             status: AuditStatus::Pending,
>         };
>         assert_eq!(record.to_string(), "[AUDIT #1003] DEPOSIT - PENDING ($100.00)");
>         assert!(matches!(record.status, AuditStatus::Pending));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Zero-Allocation Formatting Architecture**:
>    - The implementation streams bytes directly into `f` (`&mut fmt::Formatter<'_>`), which acts as an I/O buffer abstraction. By writing directly to `f` with the `write!` macro instead of calling `format!` to produce temporary `String`s, no intermediate heap allocations occur during formatting.
> 2. **Dynamic Format Specifiers**:
>    - Rust's `fmt::Formatter` exposes options specified in macro calls. We query `f.precision()` to extract precision specified by format strings like `{:.4}`. Using variable positional parameters in `write!(f, "...", ..., precision)` (using `1$` positional notation) forwards the dynamic precision to floating point numbers.
> 3. **Ownership and Lifetime Invariants**:
>    - `fmt::Formatter<'_>` carries an anonymous lifetime tied to the lifetime of the output buffer/stream. `&self` is borrowed immutably, ensuring formatting operations never mutate the audited record state or take ownership of its fields.
> 4. **Compositional Display Trait Usage**:
>    - `AuditRecord` formats its `status` field using `{}` specifier, which invokes `AuditStatus`'s own `Display::fmt` implementation. This modular composition guarantees separation of concerns across complex data models.
> 
---

### Exercise 2: Hierarchical Diagnostic Error Chain with Recursive Display & Trait Objects

**Scenario:**
Distributed database engines and API gateways require multi-tiered error reporting where low-level I/O failures bubble up through database queries and top-level HTTP request handlers. You are tasked with implementing `std::fmt::Display` and `std::error::Error` for a `ChainableError` type that wraps nested causes using dynamic trait objects (`Box<dyn std::error::Error + Send + Sync + 'static>`).

Requirements:
1. Define `ChainableError` containing:
   - `code`: `u32`
   - `message`: `String`
   - `cause`: `Option<Box<dyn std::error::Error + Send + Sync + 'static>>`
2. Implement `fmt::Display` for `ChainableError`:
   - Base message format: `"[ERROR-{code}] {message}"`.
   - If a `cause` exists, recursively format each nested error on a new line with indented bullet points (`"  Caused by: {cause}"`), scaling indentation level by depth.
   - Stream all lines directly to the formatter buffer without instantiating intermediate vectors of strings.
3. Implement `std::error::Error` for `ChainableError`, delegating `.source()` to `cause`.
4. Provide constructor helpers `new(code, message)` and `with_cause(code, message, cause)`.
5. Include comprehensive unit tests with `#[cfg(test)] mod tests` using `assert_eq!`, `assert!`, `assert_ne!`, and `matches!`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::error::Error;
> use std::fmt;
> 
> #[derive(Debug)]
> pub struct ChainableError {
>     pub code: u32,
>     pub message: String,
>     pub cause: Option<Box<dyn Error + Send + Sync + 'static>>,
> }
> 
> impl ChainableError {
>     pub fn new(code: u32, message: impl Into<String>) -> Self {
>         Self {
>             code,
>             message: message.into(),
>             cause: None,
>         }
>     }
> 
>     pub fn with_cause<E>(code: u32, message: impl Into<String>, cause: E) -> Self
>     where
>         E: Error + Send + Sync + 'static,
>     {
>         Self {
>             code,
>             message: message.into(),
>             cause: Some(Box::new(cause)),
>         }
>     }
> }
> 
> impl fmt::Display for ChainableError {
>     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
>         write!(f, "[ERROR-{}] {}", self.code, self.message)?;
> 
>         let mut curr_cause = self.cause.as_ref().map(|e| e.as_ref() as &dyn Error);
>         let mut indent_level = 1;
> 
>         while let Some(err) = curr_cause {
>             let indent = "  ".repeat(indent_level);
>             write!(f, "\n{}Caused by: {}", indent, err)?;
>             curr_cause = err.source();
>             indent_level += 1;
>         }
> 
>         Ok(())
>     }
> }
> 
> impl Error for ChainableError {
>     fn source(&self) -> Option<&(dyn Error + 'static)> {
>         self.cause.as_ref().map(|e| e.as_ref() as &(dyn Error + 'static))
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
>     use std::io;
> 
>     #[test]
>     fn test_single_level_error_display() {
>         let err = ChainableError::new(500, "Internal Server Error");
>         assert_eq!(err.to_string(), "[ERROR-500] Internal Server Error");
>         assert!(err.source().is_none());
>         assert_ne!(err.code, 400);
>     }
> 
>     #[test]
>     fn test_nested_error_chain_display() {
>         let io_err = io::Error::new(io::ErrorKind::ConnectionRefused, "port 8080 unreachable");
>         let db_err = ChainableError::with_cause(503, "Database connection failed", io_err);
>         let api_err = ChainableError::with_cause(500, "API Gateway pipeline error", db_err);
> 
>         let formatted = api_err.to_string();
>         let expected = "[ERROR-500] API Gateway pipeline error\n  Caused by: [ERROR-503] Database connection failed\n    Caused by: port 8080 unreachable";
> 
>         assert_eq!(formatted, expected);
>         assert!(api_err.source().is_some());
> 
>         let source_err = api_err.source().unwrap();
>         let downcasted = source_err.downcast_ref::<ChainableError>();
>         assert!(matches!(downcasted, Some(e) if e.code == 503));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Dynamic Dispatch via Trait Objects (`Box<dyn Error>`)**:
>    - The `cause` field uses trait objects `dyn Error + Send + Sync + 'static`. Trait objects perform dynamic dispatch through a vtable (virtual method table) containing pointers to the concrete error type's `Display::fmt`, `Debug::fmt`, and `Error::source` functions.
> 2. **Recursive Source Chain Traversal**:
>    - Standard library trait `std::error::Error` requires supertrait `Display` (`pub trait Error: Debug + Display`). In `fmt::Display`, we iterate down the cause hierarchy by repeatedly querying `.source()`. Because `dyn Error` implements `Display`, formatting `err` via `{}` delegates dynamically to the underlying error's implementation.
> 3. **Indentation and Direct Streaming**:
>    - The formatting loop streams line breaks and indentation depth directly into `f` via `write!`. The `?` operator propagates `fmt::Error` back up if the destination buffer runs out of space or encounters write failures.
> 4. **Downcasting and Error Trait Integration**:
>    - By implementing `Error::source()`, `ChainableError` integrates seamlessly with standard Rust error-handling ecosystems (`anyhow`, `eyre`, standard library diagnostics). The test demonstrates runtime type reflection via `.downcast_ref::<ChainableError>()`, validating trait object safety and pointer dereferencing.
> 
---

### Exercise 3: Monomorphized Generic Table Formatter with Dynamic Width Calculation

**Scenario:**
CLI observability tools (e.g. status dashboards, container monitors) need to format tabular metrics where each column's type implements `Display`. You must design a generic table renderer `TableReport<T>` where `T: std::fmt::Display`.

Requirements:
1. Define `TableReport<T>` containing:
   - `title`: `String`
   - `headers`: `Vec<String>`
   - `rows`: `Vec<Vec<T>>`
2. Implement `fmt::Display` for `TableReport<T>` with trait bound `T: fmt::Display`:
   - Compute column width per column dynamically by finding the max character length among headers and formatted cell values (`item.to_string().len()`).
   - Format:
     - Header title line: `=== <title> ===`
     - Header row with pipe borders: `| Header1 | Header2 |`
     - Border separator: `+---------+---------+`
     - Data rows left-aligned to column widths: `| Value1  | Value2  |`
   - Gracefully handle empty rows or mismatched column counts without panicking.
3. Include unit tests demonstrating static monomorphization over custom metric structs and primitive types, with tests using `assert_eq!`, `assert!`, `assert_ne!`, and `matches!`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::fmt;
> 
> pub struct TableReport<T> {
>     pub title: String,
>     pub headers: Vec<String>,
>     pub rows: Vec<Vec<T>>,
> }
> 
> impl<T> TableReport<T> {
>     pub fn new(title: impl Into<String>, headers: Vec<String>, rows: Vec<Vec<T>>) -> Self {
>         Self {
>             title: title.into(),
>             headers,
>             rows,
>         }
>     }
> }
> 
> impl<T: fmt::Display> fmt::Display for TableReport<T> {
>     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
>         writeln!(f, "=== {} ===", self.title)?;
> 
>         if self.headers.is_empty() {
>             return Ok(());
>         }
> 
>         let num_cols = self.headers.len();
>         let mut col_widths = vec![0; num_cols];
> 
>         for (i, header) in self.headers.iter().enumerate() {
>             col_widths[i] = col_widths[i].max(header.len());
>         }
> 
>         for row in &self.rows {
>             for (i, item) in row.iter().enumerate().take(num_cols) {
>                 let item_len = item.to_string().len();
>                 col_widths[i] = col_widths[i].max(item_len);
>             }
>         }
> 
>         write!(f, "|")?;
>         for (i, header) in self.headers.iter().enumerate() {
>             write!(f, " {:<1$} |", header, col_widths[i])?;
>         }
>         writeln!(f)?;
> 
>         write!(f, "+")?;
>         for width in &col_widths {
>             write!(f, "{}+", "-".repeat(width + 2))?;
>         }
>         writeln!(f)?;
> 
>         for row in &self.rows {
>             write!(f, "|")?;
>             for i in 0..num_cols {
>                 if let Some(item) = row.get(i) {
>                     write!(f, " {:<1$} |", item, col_widths[i])?;
>                 } else {
>                     write!(f, " {:<1$} |", "", col_widths[i])?;
>                 }
>             }
>             writeln!(f)?;
>         }
> 
>         Ok(())
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[derive(Debug, PartialEq)]
>     struct Metric {
>         val: f64,
>         unit: &'static str,
>     }
> 
>     impl fmt::Display for Metric {
>         fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
>             write!(f, "{:.1}{}", self.val, self.unit)
>         }
>     }
> 
>     #[test]
>     fn test_table_report_display_custom_struct() {
>         let headers = vec!["ID".to_string(), "LATENCY".to_string()];
>         let rows = vec![
>             vec![
>                 Metric { val: 101.0, unit: "" },
>                 Metric { val: 12.5, unit: "ms" },
>             ],
>             vec![
>                 Metric { val: 102.0, unit: "" },
>                 Metric { val: 145.2, unit: "ms" },
>             ],
>         ];
> 
>         let table = TableReport::new("System Latency", headers, rows);
>         let output = table.to_string();
> 
>         assert!(output.contains("=== System Latency ==="));
>         assert!(output.contains("| ID    | LATENCY |"));
>         assert!(output.contains("+-------+---------+"));
>         assert!(output.contains("| 101.0 | 12.5ms  |"));
>         assert!(output.contains("| 102.0 | 145.2ms |"));
>         assert_ne!(output, "");
>     }
> 
>     #[test]
>     fn test_table_report_empty_and_mismatched_rows() {
>         let headers = vec!["KEY".to_string(), "VALUE".to_string()];
>         let rows: Vec<Vec<String>> = vec![
>             vec!["alpha".to_string()],
>             vec!["beta".to_string(), "100".to_string()],
>         ];
> 
>         let table = TableReport::new("Config Key-Value", headers, rows);
>         let rendered = table.to_string();
> 
>         assert!(rendered.contains("| alpha |       |"));
>         assert!(rendered.contains("| beta  | 100   |"));
> 
>         let empty_table: TableReport<i32> = TableReport::new("Empty", vec![], vec![]);
>         assert_eq!(empty_table.to_string(), "=== Empty ===\n");
>         assert!(matches!(empty_table.rows.first(), None));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 
> 1. **Generic Monomorphization (`TableReport<T>`)**:
>    - The implementation `impl<T: fmt::Display> fmt::Display for TableReport<T>` uses static dispatch (monomorphization). During compilation, Rust generates specialized machine code for every concrete type `T` used with `TableReport` (e.g. `TableReport<Metric>`, `TableReport<String>`, `TableReport<i32>`), eliminating virtual dispatch pointer overhead.
> 2. **Blanket Trait Integration (`ToString`)**:
>    - The helper calculation `item.to_string().len()` relies on standard library blanket implementation `impl<T: Display> ToString for T`. Implementing `Display` automatically synthesizes `.to_string()` for any `T`.
> 3. **Dynamic Formatting Width Specifiers**:
>    - In `write!(f, " {:<1$} |", item, col_widths[i])`, the specifier `{:<1$}` instructs the formatter to left-align (`<`) the item and pad it with trailing spaces to match the width argument specified by index `1$` (`col_widths[i]`).
> 4. **Defensive Edge Case Handling**:
>    - Dynamic bounds checking via `row.get(i)` prevents out-of-bounds panics when rendering sparse or uneven matrix rows, safely padding missing column values with empty spaces.
> 
---

## 6. Related Terms


- [`Debug` Trait](debug_trait.md) — The developer-facing counterpart to `Display`.
- [String vs &str](../level_01/string_vs_&str.md) — The type you magically get for free (via the `.to_string()` method) the moment you implement the `Display` trait.
- [`println!` / `format!`](../level_01/println_format.md) — Related concept: `println!` / `format!`.

---

## 7. Key Takeaways

- `Display` is for formatting data beautifully for **end-users**.
- It is triggered by using the standard `{}` placeholder in print macros.
- You **cannot** derive `Display`. You must always write the implementation manually because the compiler cannot guess your subjective formatting logic.
- Once you implement `Display`, your struct automatically gets a `.to_string()` method for free! (This happens because Rust's standard library has a blanket implementation: *if something can be displayed to a screen, it can be converted to a String*).
