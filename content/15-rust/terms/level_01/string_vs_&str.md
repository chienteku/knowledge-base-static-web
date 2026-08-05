# String vs &str

> **Level 1 — Foundations**
> `String` is a heap-allocated, growable string; `&str` is an immutable string slice (borrowed reference).

---

## 1. Prerequisites


- [Variable](variable.md) — Named bindings to store data.
- [Mutability (`mut`)](mutability_mut.md) — The ability to change a value (crucial for `String`).
- [Scalar Types](scalar_types.md) — Primitive types.

---

## 2. Term Category

**Rust-specific**: While other systems languages differentiate between dynamic strings and string literals, Rust's explicit duality (`String` vs `&str`) is a signature feature that forces developers to think about memory allocation.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In high-level languages like Python or JavaScript, a string is just a "string." The language hides how the text is actually stored in memory. However, hiding these details comes with a performance cost. 

Rust is a systems language, meaning it gives you control over memory for maximum speed. There are two completely different ways to use text in a program:
1. **Hardcoded text** (like `"Hello, World!"`) that never changes and is known exactly when you compile the program. 
2. **Dynamic text** (like reading user input from a keyboard) whose size is unknown until the program actually runs.

Rust created two distinct types for these scenarios:
- **`&str` (String Slice):** This is a read-only view into some text. When you type `"Hello"`, it is a `&str` baked directly into the final executable file. It is incredibly fast because no memory allocation happens at runtime, but it cannot grow or change.
- **`String`:** This is a dynamic, growable piece of text stored on the "heap" (system memory). You use this when you need to build, mutate, or take ownership of text at runtime.

### (2) Reality Metaphor

- **`&str` is a Printed Book:** The text is permanently inked on the page. You can read it, and you can point your finger at a specific sentence (a "slice" of the text), but you cannot add new sentences to the paper. 
- **`String` is a Google Doc:** It exists dynamically in the cloud (the heap). You own the document, and you can freely type new paragraphs into it, expanding its size as much as you need.

### (3) Rust Code Examples

#### Short Snippet
```rust
// A string literal is ALWAYS a `&str`. It is fixed and immutable.
let greeting: &str = "Hello";

// To make a growable `String`, we must allocate it from a `&str`.
let mut dynamic_greeting: String = String::from("Hello");
dynamic_greeting.push_str(", World!");
```

#### Fuller Example
```rust
fn main() {
    // 1. &str (String Slice)
    // This text is embedded directly into the binary file.
    let static_name = "Alice"; 
    
    // 2. String (Heap-allocated)
    // We create a new, empty String that can grow.
    let mut profile_bio = String::new();
    
    // We can add `&str` data into our `String`.
    profile_bio.push_str("My name is ");
    profile_bio.push_str(static_name);
    
    // Another way to create a String is using `.to_string()` on a `&str`.
    let sign_off = " Have a great day!".to_string();
    
    profile_bio.push_str(&sign_off);
    
    println!("{}", profile_bio);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to modify a string literal (`&str`)

**The mistake:** Treating a hardcoded string literal as if it can be appended to.

**Why it's wrong:** String literals are `&str`, which are essentially read-only pointers to text baked into the binary. They have no capacity to grow. 

*Incorrect:*
```rust
let mut name = "Bob";
name.push_str(" Smith"); // ERROR: no method named `push_str` found for type `&str`
```

*Fix:*
```rust
// Convert the `&str` to a `String` so it can grow on the heap.
let mut name = String::from("Bob");
name.push_str(" Smith");
```

### Mistake 2: Function parameter type mismatch

**The mistake:** A function expects a `String`, but you pass it a string literal (`"..."`).

**Why it's wrong:** Because `"..."` is a `&str`, it is a completely different type than `String`. Rust will not implicitly convert it for you. 

*Incorrect:*
```rust
fn print_name(name: String) {
    println!("{}", name);
}

fn main() {
    print_name("Alice"); // ERROR: expected struct `String`, found `&str`
}
```

*Fix:*
```rust
fn print_name(name: String) {
    println!("{}", name);
}

fn main() {
    // Explicitly convert it
    print_name(String::from("Alice")); 
}
```
*(Note: A better fix in real Rust is often to change the function to accept `&str` if it doesn't need to mutate the text).*

---

### Mistake 3: Concurrent Access to String Vs &Str Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe String Vs &Str instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Zero-Copy Microservice Log Parsing and Canonical String Formatting

**Scenario:**
A distributed telemetry service ingests log payloads in the raw format `"LEVEL|TIMESTAMP|SERVICE|MESSAGE"` (e.g., `"WARN|2026-07-31T12:00:00Z|auth_svc|Invalid password attempt"`). To maintain low latency, the parser must borrow string slices (`&'a str`) directly from the input buffer without allocating heap memory during parsing. Heap allocation must be deferred until an owned canonical log record (`String`) is generated.

**Task:**
1. Define an enum `LogLevel` with variants `Info`, `Warn`, and `Error`.
2. Define a struct `ParsedLog<'a>` with borrowed string slices `timestamp`, `service`, and `message` of lifetime `'a`.
3. Implement `parse_log<'a>(raw: &'a str) -> Result<ParsedLog<'a>, ParseError>` to extract clean string slices.
4. Implement `to_canonical_string(&self) -> String` on `ParsedLog<'a>` to produce formatted output: `"[TIMESTAMP] [LEVEL] (SERVICE): MESSAGE"`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq, Clone, Copy)]
> pub enum LogLevel {
>     Info,
>     Warn,
>     Error,
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum ParseError {
>     InvalidFormat,
>     UnknownLevel,
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub struct ParsedLog<'a> {
>     pub level: LogLevel,
>     pub timestamp: &'a str,
>     pub service: &'a str,
>     pub message: &'a str,
> }
> 
> pub fn parse_log<'a>(raw: &'a str) -> Result<ParsedLog<'a>, ParseError> {
>     let parts: Vec<&'a str> = raw.split('|').map(|s| s.trim()).collect();
>     if parts.len() != 4 {
>         return Err(ParseError::InvalidFormat);
>     }
> 
>     let level = match parts[0] {
>         "INFO" => LogLevel::Info,
>         "WARN" => LogLevel::Warn,
>         "ERROR" => LogLevel::Error,
>         _ => return Err(ParseError::UnknownLevel),
>     };
> 
>     if parts[1].is_empty() || parts[2].is_empty() || parts[3].is_empty() {
>         return Err(ParseError::InvalidFormat);
>     }
> 
>     Ok(ParsedLog {
>         level,
>         timestamp: parts[1],
>         service: parts[2],
>         message: parts[3],
>     })
> }
> 
> impl<'a> ParsedLog<'a> {
>     pub fn to_canonical_string(&self) -> String {
>         let level_str = match self.level {
>             LogLevel::Info => "INFO",
>             LogLevel::Warn => "WARN",
>             LogLevel::Error => "ERROR",
>         };
>         format!(
>             "[{}] [{}] ({}): {}",
>             self.timestamp, level_str, self.service, self.message
>         )
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_parse_valid_log() {
>         let raw = "  WARN  | 2026-07-31T12:00:00Z | auth_svc | Invalid password attempt  ";
>         let parsed = parse_log(raw).expect("Parsing should succeed");
> 
>         assert_eq!(parsed.level, LogLevel::Warn);
>         assert_eq!(parsed.timestamp, "2026-07-31T12:00:00Z");
>         assert_eq!(parsed.service, "auth_svc");
>         assert_eq!(parsed.message, "Invalid password attempt");
>         assert_ne!(parsed.level, LogLevel::Error);
> 
>         let canonical = parsed.to_canonical_string();
>         assert_eq!(
>             canonical,
>             "[2026-07-31T12:00:00Z] [WARN] (auth_svc): Invalid password attempt"
>         );
>     }
> 
>     #[test]
>     fn test_parse_invalid_format() {
>         let missing_fields = "INFO|2026-07-31T12:00:00Z|auth_svc";
>         let res = parse_log(missing_fields);
>         assert!(matches!(res, Err(ParseError::InvalidFormat)));
> 
>         let empty_field = "INFO|2026-07-31T12:00:00Z||user logged in";
>         let res_empty = parse_log(empty_field);
>         assert_eq!(res_empty, Err(ParseError::InvalidFormat));
>     }
> 
>     #[test]
>     fn test_parse_unknown_level() {
>         let invalid_level = "TRACE|2026-07-31T12:00:00Z|auth_svc|Trace message";
>         let res = parse_log(invalid_level);
>         assert_eq!(res, Err(ParseError::UnknownLevel));
>     }
> }
> ```
>
> #### Technical Explanation
>
> - **Zero-Copy Lifetime Binding (`'a`):** The `ParsedLog<'a>` struct borrows slices directly from the input buffer `raw`. The lifetime annotation `'a` ensures that `ParsedLog<'a>` cannot outlive the underlying `raw` string slice, preventing dangling pointer bugs.
> - **Slice Borrowing (`&str`) vs Heap Ownership (`String`):** Calling `raw.split('|')` and `.trim()` yields sub-slices (`&'a str`) pointing directly to existing memory offsets. No heap memory is allocated during parsing.
> - **Deferred Allocation:** Allocation occurs only when `to_canonical_string()` is called, which creates a new growable `String` on the heap to construct the canonical log representation.
>

---

### Exercise 2: HTTP Header Extraction and Case Normalization Engine

**Scenario:**
An API Gateway routes HTTP requests based on header keys. Per RFC 9110, HTTP header names are case-insensitive. Raw header lines like `"   Content-Type  :   application/json  "` must first be parsed zero-copy into raw key/value slices (`&'a str`), and then transformed into normalized lowercase owned `String` keys for hashing and routing table lookups.

**Task:**
1. Implement `parse_header_raw<'a>(line: &'a str) -> Result<(&'a str, &'a str), HeaderError>` to split a header line at `:` and return trimmed string slices.
2. Implement `normalize_header(key: &str, value: &str) -> (String, String)` to convert `key` to lowercase and return owned `String` pairs.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq)]
> pub enum HeaderError {
>     MissingColon,
>     EmptyKey,
> }
> 
> pub fn parse_header_raw<'a>(line: &'a str) -> Result<(&'a str, &'a str), HeaderError> {
>     let colon_pos = line.find(':').ok_or(HeaderError::MissingColon)?;
>     
>     let key = line[..colon_pos].trim();
>     let value = line[colon_pos + 1..].trim();
> 
>     if key.is_empty() {
>         return Err(HeaderError::EmptyKey);
>     }
> 
>     Ok((key, value))
> }
> 
> pub fn normalize_header(key: &str, value: &str) -> (String, String) {
>     let normalized_key = key.to_ascii_lowercase();
>     let normalized_value = value.to_string();
>     (normalized_key, normalized_value)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_parse_header_raw_valid() {
>         let raw_line = "   Content-Type  :   application/json; charset=utf-8  ";
>         let parsed = parse_header_raw(raw_line).expect("Should parse successfully");
> 
>         assert_eq!(parsed.0, "Content-Type");
>         assert_eq!(parsed.1, "application/json; charset=utf-8");
>         assert_ne!(parsed.0, "content-type");
> 
>         let (norm_key, norm_val) = normalize_header(parsed.0, parsed.1);
>         assert_eq!(norm_key, "content-type");
>         assert_eq!(norm_val, "application/json; charset=utf-8");
>     }
> 
>     #[test]
>     fn test_parse_header_raw_missing_colon() {
>         let invalid_line = "Host localhost:8080";
>         let res = parse_header_raw(invalid_line);
>         assert!(matches!(res, Err(HeaderError::MissingColon)));
>     }
> 
>     #[test]
>     fn test_parse_header_raw_empty_key() {
>         let invalid_line = "  : authorization_token_xyz ";
>         let res = parse_header_raw(invalid_line);
>         assert_eq!(res, Err(HeaderError::EmptyKey));
>     }
> }
> ```
>
> #### Technical Explanation
>
> - **Zero-Copy Header Extraction:** Slicing `line[..colon_pos]` produces an immutable string slice `&'a str` referencing the existing memory block of `line`. No dynamic allocations take place in `parse_header_raw`.
> - **Deref Coercion (`&String` to `&str`):** `normalize_header` accepts `&str` as parameters. This idiomatic pattern allows callers to pass string literals (`"Content-Type"`), slices (`&line[..]`), or references to heap strings (`&String`) seamlessly.
> - **Heap Allocation for String Transformation:** Casing changes (`to_ascii_lowercase()`) alter byte values and may alter length in general UTF-8 cases. Thus, mutating ASCII casing requires allocating a fresh, owned `String` on the heap.
>

---

### Exercise 3: Financial Query Sanitization and Pre-Allocated Template Binding

**Scenario:**
A financial compliance audit engine generates SQL query strings dynamically from template patterns. To ensure security against SQL injection, requested table names are validated against a static whitelist slice (`&[&str]`). Query buffer building must manage heap allocations efficiently by using `String::with_capacity` and string slice appends (`.push_str()`).

**Task:**
1. Define a static slice `ALLOWED_TABLES: &[&str] = &["transactions", "audit_logs", "settlements"];`.
2. Implement `build_audit_query(template: &str, table_name: &str, min_amount: u64) -> Result<String, QueryError>`.
3. Validate table names without allocation, check for placeholders `"{TABLE}"` and `"{MIN_AMOUNT}"`, substitute values, and append `"; -- AUDITED QUERY"`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq, Eq)]
> pub enum QueryError {
>     InvalidTableName,
>     MissingPlaceholder,
> }
> 
> pub const ALLOWED_TABLES: &[&str] = &["transactions", "audit_logs", "settlements"];
> 
> pub fn build_audit_query(
>     template: &str,
>     table_name: &str,
>     min_amount: u64,
> ) -> Result<String, QueryError> {
>     if !ALLOWED_TABLES.contains(&table_name) {
>         return Err(QueryError::InvalidTableName);
>     }
> 
>     if !template.contains("{TABLE}") || !template.contains("{MIN_AMOUNT}") {
>         return Err(QueryError::MissingPlaceholder);
>     }
> 
>     let mut sql = String::with_capacity(template.len() + 64);
>     sql.push_str(template);
> 
>     let sql = sql.replace("{TABLE}", table_name);
>     let amount_str = min_amount.to_string();
>     let mut sql = sql.replace("{MIN_AMOUNT}", &amount_str);
> 
>     sql.push_str("; -- AUDITED QUERY");
> 
>     Ok(sql)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_build_audit_query_success() {
>         let template = "SELECT * FROM {TABLE} WHERE amount >= {MIN_AMOUNT}";
>         let query = build_audit_query(template, "transactions", 5000)
>             .expect("Should build query successfully");
> 
>         assert_eq!(
>             query,
>             "SELECT * FROM transactions WHERE amount >= 5000; -- AUDITED QUERY"
>         );
>         assert!(query.contains("transactions"));
>         assert_ne!(query, template);
>     }
> 
>     #[test]
>     fn test_build_audit_query_invalid_table() {
>         let template = "SELECT * FROM {TABLE} WHERE amount >= {MIN_AMOUNT}";
>         let res = build_audit_query(template, "users_credentials", 100);
>         assert_eq!(res, Err(QueryError::InvalidTableName));
>         assert!(matches!(res, Err(QueryError::InvalidTableName)));
>     }
> 
>     #[test]
>     fn test_build_audit_query_missing_placeholder() {
>         let template = "SELECT * FROM transactions WHERE amount >= 100";
>         let res = build_audit_query(template, "transactions", 100);
>         assert_eq!(res, Err(QueryError::MissingPlaceholder));
>     }
> }
> ```
>
> #### Technical Explanation
>
> - **Slice Whitelisting (`&str`):** Checking if `table_name` is allowed (`ALLOWED_TABLES.contains(&table_name)`) works by comparing string slice references (`&str`) without allocating memory on the heap.
> - **Memory Capacity Management (`String::with_capacity`):** When building growable `String` objects, allocating insufficient capacity causes reallocations as the buffer grows. Pre-allocating capacity via `String::with_capacity(template.len() + 64)` allocates the heap buffer once.
> - **Mutation (`push_str`) vs Substitution (`replace`):** Method `.push_str()` appends string slice contents directly to an existing `String` buffer without allocating a new container. Method `.replace()` constructs a new `String` containing the substituted content.
>

---

## 6. Related Terms


- [Ownership](../level_03/ownership.md) — A `String` *owns* its text data, while a `&str` merely *borrows* it.
- [Borrowing (`&`)](../level_03/borrowing.md) — The ampersand `&` in `&str` indicates it is a borrowed reference to text that lives elsewhere.
- [`OsString` / `OsStr`](os_string_str.md) — Related concept: `OsString` / `OsStr`.
- [`Path` / `PathBuf`](path_pathbuf.md) — Related concept: `Path` / `PathBuf`.
- [`println!` / `format!`](println_format.md) — Related concept: `println!` / `format!`.
- [`Display` Trait](../level_04/display_trait.md) — Related concept: `Display` Trait.
- [`Cow<'a, T>`](../level_11/cow_t.md) — Related concept: `Cow<'a, T>`.
- [Slice (`&[T]`, `&str`)](../level_03/slice.md) — Contiguous sequence slice views.
- [`ToOwned` Trait](../level_11/toowned_trait.md) — ToOwned conversion from &str to String.

---

## 7. Key Takeaways

- **`&str`** is for fast, fixed, read-only text (like string literals `"hello"`).
- **`String`** is for dynamic, growable text that you can mutate at runtime.
- You can create a `String` from a `&str` using `String::from("text")` or `"text".to_string()`.
- A `String` is stored on the heap, while the data a `&str` points to is often baked directly into the program's binary.
