# Struct Lifetimes

> **Level 5 — Lifetimes**
> Declaring lifetime parameters on structs and enums that hold reference fields: `struct Excerpt<'a> { part: &'a str }`.

---

## 1. Prerequisites


- [Struct](../level_02/struct.md) — Custom composite data types.
- [Lifetime (`'a`)](lifetime.md) — Reference validity annotations.
- [Lifetime Elision](lifetime_elision.md) — Understanding why struct definitions *cannot* elide lifetimes.

---

## 2. Term Category

**Rust-specific (borrowed struct fields)**: While most production structs store owned data (`String`, `i32`, `Vec<T>`), performance-critical data structures often store *references* (`&'a str` or `&'a [u8]`) to avoid heap allocations. When a struct or enum contains borrowed fields, Rust requires declaring generic lifetime parameters (`struct MyStruct<'a>`). This ensures struct instances cannot outlive the underlying memory referenced by their fields.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

If Rust allowed struct definitions to store references without explicit lifetime annotations:

```rust
// INVALID RUST (Will not compile!)
struct UserSession {
    token: &str, // ❌ Error E0106: missing lifetime specifier
}
```

The compiler would have no way to verify how long `token` remains valid. If `token` pointed to a String on the heap that gets freed while `UserSession` is still held by a caller, reading `session.token` would cause a dangerous dangling pointer access!

To enforce compile-time safety, Rust demands explicit generic lifetime parameters on struct definitions:

```rust
struct UserSession<'a> {
    token: &'a str,
}
```

This enforces an ironclad guarantee: **An instance of `UserSession<'a>` cannot outlive the string slice stored in its `token` field.**

### (2) Deep Dive — Implementing Methods and Multiple Field Lifetimes

#### Implementing Methods (`impl<'a> Struct<'a>`)
When writing implementation blocks for a struct with lifetimes, declare generic lifetime parameters after `impl` and attach them to the struct name:

```rust
struct Header<'a> {
    name: &'a str,
}

impl<'a> Header<'a> {
    fn get_name(&self) -> &'a str {
        self.name
    }
}
```

#### Multiple Field Lifetimes (`struct Dual<'a, 'b>`)
If a struct contains multiple reference fields that originate from different scopes, assign distinct lifetime parameters (`'a` and `'b`) to avoid unnecessarily over-constraining field lifetimes:

```rust
struct RequestContext<'a, 'b> {
    headers: &'a str,
    body: &'b str,
}
```

### (3) Reality Metaphor

A picture frame (`struct UserSession<'a>`) holding a printed physical photograph (`&'a str`):
- The picture frame cannot present a valid image without the photograph placed inside it.
- If you throw the photo into a paper shredder (the original data's lifetime `'a` ends), you cannot hold up the empty frame and expect to see the picture.
- The struct's lifetime parameter `'a` acts as a safety tether physically binding the frame's validity duration to the photograph.

### (4) Rust Code Examples

#### Short Snippet (Defining and Instantiating)
```rust
struct Highlight<'a> {
    text: &'a str,
}

fn main() {
    let article = String::from("Rust memory safety without garbage collection.");
    let snippet = &article[0..4]; // Borrowed slice
    
    let highlight = Highlight { text: snippet };
    println!("Highlight: {}", highlight.text);
}
```

#### Struct Method Propagation
```rust
struct ConfigParser<'a> {
    raw_config: &'a str,
}

impl<'a> ConfigParser<'a> {
    fn new(raw_config: &'a str) -> Self {
        Self { raw_config }
    }

    fn extract_section(&self, name: &str) -> Option<&'a str> {
        for line in self.raw_config.lines() {
            if line.starts_with(name) {
                return Some(line);
            }
        }
        None
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Attempting to Build Self-Referential Structs

**The mistake:** Defining a struct that holds an owned value alongside a reference pointing to that same owned value.

**Why it is wrong:** Moving a struct in memory updates its stack location, which invalidates internal references pointing to itself. Rust strictly forbids self-referential structs without special wrappers like `Pin` or `Ouroboros`.

*Incorrect:*
```rust
struct SelfRef<'a> {
    data: String,
    slice: &'a str, // ❌ Attempting to point `slice` into `data` inside the same struct!
}
```

*Fix:*
```rust
// Keep owned data and references separate, or store integer offsets (usize) instead of references!
struct ParsedData {
    data: String,
    start: usize,
    end: usize,
}
```

### Mistake 2: Omitting Lifetime Parameters on `impl` Headers

**The mistake:** Writing `impl MyStruct` instead of `impl<'a> MyStruct<'a>`.

**Why it is wrong:** `MyStruct<'a>` is a generic type parameterized over `'a`. The `impl` block must declare `'a` to bring it into scope for the methods.

*Incorrect:*
```rust
struct Token<'a>(&'a str);

// impl Token { ... } // ❌ Error E0726: implicit elided lifetime not allowed in impl header
```

*Fix:*
```rust
impl<'a> Token<'a> { ... } // Correct!
```

### Mistake 3: Over-Constraining Independent Fields to a Single Lifetime Parameter

**The mistake:** Assigning the same lifetime `'a` to multiple reference fields that are borrowed from completely independent data sources with different lifespans.

**Why it is wrong:** Using a single lifetime `'a` forces both fields to shrink their effective lifetime to the *shortest* borrowed input scope, unnecessarily restricting how long the struct can be held.

*Incorrect:*
```rust
struct Pair<'a> {
    first: &'a str,  // Forced to match second's lifetime!
    second: &'a str,
}
```

*Fix:*
```rust
struct Pair<'a, 'b> { // Independent lifetimes allow flexible borrowing!
    first: &'a str,
    second: &'b str,
}
```

---

## 5. Practice Exercises

### Exercise 1: Zero-Copy Network Frame Dissector

**Scenario:** Build a high-performance network packet parser `struct PacketFrame<'a>` that holds slice references to Ethernet, IPv4, and Payload headers without allocating dynamic memory.

**Requirements:**
1. Define struct `PacketFrame<'a>` with fields `eth_header: &'a [u8]`, `payload: &'a [u8]`.
2. Implement constructor `fn parse(raw: &'a [u8]) -> Option<PacketFrame<'a>>`.
3. Write unit tests dissecting raw byte buffers.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> #[derive(Debug, PartialEq)]
> pub struct PacketFrame<'a> {
>     pub eth_header: &'a [u8],
>     pub payload: &'a [u8],
> }
> 
> impl<'a> PacketFrame<'a> {
>     pub fn parse(raw: &'a [u8]) -> Option<Self> {
>         if raw.len() < 14 {
>             return None;
>         }
>         Some(Self {
>             eth_header: &raw[0..14],
>             payload: &raw[14..],
>         })
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_packet_dissector() {
>         let raw_bytes = vec![0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, 0x99, 0xAA, 0xBB, 0x08, 0x00, 0xDE, 0xAD, 0xBE, 0xEF];
>         let frame = PacketFrame::parse(&raw_bytes).unwrap();
>         
>         assert_eq!(frame.eth_header.len(), 14);
>         assert_eq!(frame.payload, &[0xDE, 0xAD, 0xBE, 0xEF]);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `PacketFrame<'a>` stores slices borrowed from `raw_bytes` with zero copy overhead.
> 2. Lifetime `'a` guarantees `PacketFrame` cannot outlive the underlying `raw_bytes` vector.
> 
---

### Exercise 2: Document Search Match Engine with Dual Lifetimes

**Scenario:** Implement a search result struct `SearchMatch<'doc, 'query>` holding references to both a target document string (`'doc`) and the matched search term (`'query`). Use two distinct lifetimes to ensure flexible borrowing.

**Requirements:**
1. Define struct `SearchMatch<'doc, 'query>` with fields `document: &'doc str`, `query: &'query str`, and `line_number: usize`.
2. Implement method `fn render(&self) -> String`.
3. Write unit tests demonstrating search matches across different variable lifespans.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub struct SearchMatch<'doc, 'query> {
>     pub document: &'doc str,
>     pub query: &'query str,
>     pub line_number: usize,
> }
> 
> impl<'doc, 'query> SearchMatch<'doc, 'query> {
>     pub fn render(&self) -> String {
>         format!("Line {}: found '{}' in document", self.line_number, self.query)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_dual_lifetime_match() {
>         let doc_text = String::from("Rust guarantees concurrency\nZero cost abstractions");
>         let search_term = String::from("concurrency");
>         
>         let match_result = SearchMatch {
>             document: &doc_text,
>             query: &search_term,
>             line_number: 1,
>         };
>         
>         assert_eq!(match_result.render(), "Line 1: found 'concurrency' in document");
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Using two distinct lifetimes (`'doc` and `'query`) prevents forcing `doc_text` and `search_term` to share an identical lifetime scope.
> 2. `SearchMatch` can be retained safely as long as both borrowed targets remain alive.
> 
---

### Exercise 3: Zero-Copy Streaming Log Reader with Method Implementation

**Scenario:** Build a streaming log line reader struct `LogReader<'a>` that parses log lines one by one and provides a method `read_error_lines(&mut self) -> Vec<&'a str>` returning borrowed error line slices.

**Requirements:**
1. Define struct `LogReader<'a> { raw_logs: &'a str }`.
2. Implement method `fn read_errors(&mut self) -> Vec<&'a str>`.
3. Write unit tests.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> pub struct LogReader<'a> {
>     pub raw_logs: &'a str,
> }
> 
> impl<'a> LogReader<'a> {
>     pub fn new(raw_logs: &'a str) -> Self {
>         Self { raw_logs }
>     }
> 
>     pub fn read_errors(&mut self) -> Vec<&'a str> {
>         self.raw_logs
>             .lines()
>             .filter(|line| line.contains("[ERROR]"))
>             .collect()
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_log_reader_methods() {
>         let log_data = String::from("[INFO] Server starting\n[ERROR] Connection reset\n[INFO] Retrying\n[ERROR] Timeout");
>         let mut reader = LogReader::new(&log_data);
>         let errors = reader.read_errors();
>         
>         assert_eq!(errors, vec!["[ERROR] Connection reset", "[ERROR] Timeout"]);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `impl<'a> LogReader<'a>` declares lifetime `'a` for all method implementations.
> 2. `read_errors(&mut self) -> Vec<&'a str>` explicitly returns slices tied to `'a` (the log data), allowing caller to hold returned error slices after `reader` drops.
> 
---

## 6. Related Terms


- [Lifetime (`'a`)](lifetime.md) — The annotation used on struct fields.
- [Lifetime Bounds](lifetime_bounds.md) — `struct Container<'a, T: 'a>` bounds.
- [Struct](../level_02/struct.md) — Composite data structures.
- [Lifetime Elision](lifetime_elision.md) — Related concept: Lifetime Elision.

---

## 7. Key Takeaways

- Any struct or enum holding references must declare generic lifetime parameters: `struct MyStruct<'a> { field: &'a str }`.
- An instance of a borrowing struct cannot outlive any of the memory referenced by its fields.
- `impl<'a> MyStruct<'a>` is the required syntax for implementing methods on borrowing structs.
- Lifetime elision does **not** apply to struct field definitions.
