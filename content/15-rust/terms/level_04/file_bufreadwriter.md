# `File`, `BufReader`, `BufWriter`

> **Level 4 — Rust**
> `std::fs::File` for filesystem handles paired with `BufReader`/`BufWriter` wrappers for efficient, buffered byte-level I/O.

---

## 1. Prerequisites

**None.**

---


## 2. Term Category

**File I/O**: `std::fs::File`, `BufReader`, and `BufWriter` for buffered disk I/O.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Reading or writing disk files 1 byte at a time invokes thousands of kernel system calls (`read()`, `write()`), slowing down application performance dramatically.

`BufReader` and `BufWriter` wrap file handles with an in-memory byte buffer (typically 8 KB). `BufReader` pre-fetches large chunks of data from disk into RAM; `BufWriter` batches multiple small write operations in RAM, issuing a single efficient system call when the buffer fills or is flushed.

### (2) Reality Metaphor

Pouring water into a garden bucket vs using an eyedropper: instead of taking 1,000 trips back and forth to the tap with a tiny eyedropper (`raw File.read_byte()`), you fill a large bucket (`BufReader`) once and carry it to the garden.

### (3) Rust Code Examples

#### Short Snippet
```rust
use std::fs::File;
use std::io::{BufReader, BufRead};
let file = File::open("data.txt").unwrap();
let reader = BufReader::new(file);
```

#### Fuller Example
```rust
use std::fs::File;
use std::io::{BufRead, BufReader, Write, Result};

pub fn copy_lines_filtered(src_path: &str, dst_path: &str) -> Result<usize> {
    let src = File::open(src_path)?;
    let reader = BufReader::new(src);
    let dst = File::create(dst_path)?;
    let mut writer = std::io::BufWriter::new(dst);

    let mut count = 0;
    for line in reader.lines() {
        let l = line?;
        if !l.starts_with('#') {
            writeln!(writer, "{}", l)?;
            count += 1;
        }
    }
    writer.flush()?;
    Ok(count)
}

fn main() {}

```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to Call `writer.flush()` Before Dropping `BufWriter`

**The mistake:** Dropping a `BufWriter` without calling `.flush()` explicitly when error handling is needed.

**Why it is wrong:** If the final automatic buffer flush inside `Drop` fails (e.g. disk full), the error is silently swallowed! Call `.flush()` explicitly to catch write errors.

*Incorrect:*
```rust
let mut w = BufWriter::new(file); writeln!(w, "data"); // Drop ignores flush errors!
```

*Fix:*
```rust
let mut w = BufWriter::new(file); writeln!(w, "data")?; w.flush()?; // Explicit flush catches errors!
```

### Mistake 2: Reading Files Line-by-Line Without `BufReader`

**The mistake:** Using `File::open` and attempting to read lines without wrapping in `BufReader`.

**Why it is wrong:** Raw `File` does not implement `BufRead` (which provides `.lines()` and `.read_line()`).

*Incorrect:*
```rust
let file = File::open(p)?; for line in file.lines() { ... } // Compiler Error!
```

*Fix:*
```rust
let reader = BufReader::new(file); for line in reader.lines() { ... }
```

### Mistake 3: Allocating String Buffers Repeatedly in Line Iteration Loops

**The mistake:** Using `reader.lines()` in ultra-high-throughput loops instead of `reader.read_line(&mut buf)`.

**Why it is wrong:** `reader.lines()` allocates a new `String` heap buffer for every single line in the file.

*Incorrect:*
```rust
for line in reader.lines() { let l = line?; } // Heap allocation per line!
```

*Fix:*
```rust
let mut buf = String::new(); while reader.read_line(&mut buf)? > 0 { process(&buf); buf.clear(); }
```

---

## 5. Practice Exercises

### Exercise 1: Buffered Log File Line Counter and Filter Utility

**Scenario:** Build a buffered file processor `filter_log_file(input_path: &str, output_path: &str, keyword: &str) -> std::io::Result<usize>` that reads a log file line-by-line using `BufReader` and writes matching lines to `BufWriter`.

**Requirements:**
1. Open input file with `BufReader`.
1. Create output file with `BufWriter`.
1. Filter lines by keyword.
1. Flush writer and return line count.
1. Write unit test.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::fs::File;
> use std::io::{BufRead, BufReader, BufWriter, Result, Write};
> 
> pub fn filter_log_file(input_path: &str, output_path: &str, keyword: &str) -> Result<usize> {
>     let input_file = File::open(input_path)?;
>     let reader = BufReader::new(input_file);
> 
>     let output_file = File::create(output_path)?;
>     let mut writer = BufWriter::new(output_file);
> 
>     let mut matched_count = 0;
>     for line in reader.lines() {
>         let line_str = line?;
>         if line_str.contains(keyword) {
>             writeln!(writer, "{}", line_str)?;
>             matched_count += 1;
>         }
>     }
>     writer.flush()?;
>     Ok(matched_count)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_buffered_file_io() {
>         let in_p = "temp_in.log";
>         let out_p = "temp_out.log";
> 
>         {
>             let mut f = File::create(in_p).unwrap();
>             writeln!(f, "[INFO] ok").unwrap();
>             writeln!(f, "[ERROR] fail 1").unwrap();
>             writeln!(f, "[ERROR] fail 2").unwrap();
>         }
> 
>         let count = filter_log_file(in_p, out_p, "[ERROR]").unwrap();
>         assert_eq!(count, 2);
> 
>         let _ = std::fs::remove_file(in_p);
>         let _ = std::fs::remove_file(out_p);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. `BufReader` batches disk reads into an 8 KB RAM buffer, enabling fast line-by-line iteration via `.lines()`.
> 2. `BufWriter` batches disk writes, flushed explicitly with `writer.flush()?`.

---

### Exercise 2: Zero-Allocation Reusable String Buffer Reader

**Scenario:** Build a high-performance log line reader using `read_line(&mut buf)` to reuse a single `String` allocation.

**Requirements:**
1. Reuse `String` buffer across iterations.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::io::{BufRead, Result};
> 
> pub fn count_non_empty_lines<R: BufRead>(mut reader: R) -> Result<usize> {
>     let mut buf = String::new();
>     let mut count = 0;
>     while reader.read_line(&mut buf)? > 0 {
>         if !buf.trim().is_empty() {
>             count += 1;
>         }
>         buf.clear(); // Reuse allocation!
>     }
>     Ok(count)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_reusable_buffer_reader() {
>         let data = "line 1
> 
> line 2
> ";
>         let reader = std::io::Cursor::new(data);
>         assert_eq!(count_non_empty_lines(reader).unwrap(), 2);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Reuses a single `String` buffer via `buf.clear()`, avoiding heap allocations per line.

---

### Exercise 3: Buffered Binary Chunk Reader

**Scenario:** Implement a buffered binary chunk processor reading files in fixed 4 KB chunks using `BufReader`.

**Requirements:**
1. Read binary chunks into array.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::io::{BufReader, Read, Result};
> 
> pub fn process_binary_chunks<R: Read>(reader: R) -> Result<usize> {
>     let mut buf_reader = BufReader::new(reader);
>     let mut chunk = [0u8; 1024];
>     let mut total_bytes = 0;
> 
>     loop {
>         let bytes_read = buf_reader.read(&mut chunk)?;
>         if bytes_read == 0 {
>             break;
>         }
>         total_bytes += bytes_read;
>     }
>     Ok(total_bytes)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_binary_chunk_reader() {
>         let data = vec![0u8; 2500];
>         let cursor = std::io::Cursor::new(data);
>         assert_eq!(process_binary_chunks(cursor).unwrap(), 2500);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Reads binary files efficiently in buffered chunks.

---

## 5. Related Terms

- [`Path` / `PathBuf`](../level_01/path_pathbuf.md) — Related concept: `Path` / `PathBuf`.

---


## 7. Key Takeaways

- `BufReader` and `BufWriter` reduce kernel system calls by batching I/O in RAM.
- `BufReader` enables line-by-line reading via `BufRead` trait (`.lines()`, `.read_line()`).
- Call `.flush()` explicitly on `BufWriter` to catch write errors before dropping.
- Reuse `String` buffers via `read_line(&mut buf)` and `buf.clear()` in hot loops.
