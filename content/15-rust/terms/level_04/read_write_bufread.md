# `Read` / `Write` / `BufRead` Traits

> **Level 4 — Error Handling & Generics**
> The `std::io` traits behind all blocking byte-oriented I/O — files, sockets, stdin/stdout.

---

## 1. Prerequisites

- [`Result<T, E>`](../level_02/result_t_e.md) — Every I/O operation can fail, so every method here returns `io::Result<T>`.
- [`?` Operator](../level_04/question_mark_operator.md) — The idiomatic way to propagate I/O errors.
- [Trait Objects (`dyn Trait`)](../level_04/trait_objects.md) — `Box<dyn Read>`/`Box<dyn Write>` are common ways to abstract over I/O sources.

---

## 2. Term Category

**Standard Library Traits (the universal I/O interface)**: `Read`, `Write`, and `BufRead` are the trio of traits that make byte-oriented input/output *generic* in Rust. A function written against `impl Read` works identically whether the actual source is a file, a TCP socket, an in-memory `Vec<u8>`, or `stdin` — the caller decides what concrete type to plug in.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Every I/O source — files, sockets, in-memory buffers, standard input — fundamentally does the same two things: you can pull bytes out of it, or push bytes into it. Rather than writing separate file-reading code, socket-reading code, and buffer-reading code, Rust abstracts this into two core traits: `Read` (has a `.read(&mut buf) -> io::Result<usize>` method) and `Write` (has `.write(&buf) -> io::Result<usize>`). Any function written generically over `R: Read` or `W: Write` (or the trait-object forms `&mut dyn Read`) automatically works with *any* current or future type that implements them — you write the logic once. `BufRead` extends `Read` with line-oriented and buffered convenience methods (`.read_line()`, `.lines()`), which require an internal buffer that plain `Read` doesn't guarantee.

### (2) Reality Metaphor

Imagine a universal electrical outlet adapter that works in any country.

- **`Read`** is a plug shape that says "I can pull power out of any socket that speaks this protocol" — whether the socket is in a wall (a file), a power bank (an in-memory buffer), or a generator (a network stream), the appliance (**your code**) doesn't need to know or care.
- **`Write`** is the same idea, reversed: "I can push power into any receptacle that accepts this plug shape."
- **`BufRead`** is an upgraded adapter with a built-in surge protector and a readout screen (**internal buffering**) that lets you ask higher-level questions like "give me the next full line," instead of managing raw voltage (bytes) yourself.

### (3) Rust Code Examples

#### Short Snippet (Generic Over Any `Write`)
```rust
use std::io::{self, Write};

// This function works with a File, a TcpStream, stdout, or a Vec<u8> — unchanged.
fn log_message(destination: &mut impl Write, msg: &str) -> io::Result<()> {
    writeln!(destination, "[LOG] {msg}")
}

fn main() -> io::Result<()> {
    let mut buffer: Vec<u8> = Vec::new();
    log_message(&mut buffer, "hello from an in-memory buffer")?;

    log_message(&mut io::stdout(), "hello from real stdout")?;

    println!("captured: {}", String::from_utf8_lossy(&buffer));
    Ok(())
}
```

#### Fuller Example (Reading Lines with `BufRead`)
```rust
use std::io::{self, BufRead};

fn count_lines(source: impl BufRead) -> io::Result<usize> {
    let mut count = 0;
    for line in source.lines() {
        let _line = line?; // Each line is its own io::Result<String>.
        count += 1;
    }
    Ok(count)
}

fn main() -> io::Result<()> {
    let text = "line one\nline two\nline three";
    let lines = count_lines(text.as_bytes())?; // &[u8] implements Read; wrap for BufRead.
    println!("{lines}"); // 3
    Ok(())
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Read Write Bufread Scoping and Lifecycle Rules

**The mistake:** Assuming Read Write Bufread instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("read_write_bufread_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("read_write_bufread_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Read Write Bufread State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Read Write Bufread through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Read Write Bufread Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Read Write Bufread instances across OS threads via `std::thread::spawn`.

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

## 5. Practice Exercises

### Exercise 1: Make a Function Testable with `Write`

**Problem:** This function is hard to unit test because it always prints to real stdout. Rewrite its signature to accept any `Write` destination, so tests can pass in a `Vec<u8>` instead.

```rust
fn greet(name: &str) {
    println!("Hello, {name}!");
}
```

> [!check]- Answer
> ```rust
> use std::io::{self, Write};
>
> fn greet(destination: &mut impl Write, name: &str) -> io::Result<()> {
>     writeln!(destination, "Hello, {name}!")
> }
>
> // In production: greet(&mut io::stdout(), "Alice")?;
> // In a test:      let mut buf = Vec::new(); greet(&mut buf, "Alice")?;
> //                  assert_eq!(buf, b"Hello, Alice!\n");
> ```

---

### Exercise 2: Reading Lines with `BufRead::lines`

**Problem:** Wrap a byte cursor `std::io::Cursor::new("line1\nline2")` in a `BufReader` and iterate through lines.

**Expected output:**
```
line1
line2
```

> [!check]- Answer
> ```rust
> use std::io::{BufRead, BufReader, Cursor};
> fn main() {
>     let data = Cursor::new("line1\nline2");
>     let reader = BufReader::new(data);
>     for line in reader.lines() {
>         println!("{}", line.unwrap());
>     }
> }
> ```
>
> **Explanation:** `BufRead::lines` yields string lines efficiently by reading until newline delimiters.

### Exercise 3: Buffered Writing with `BufWriter`

**Problem:** Write `b"Hello World"` to a vector using `BufWriter` and call `.flush()`.

**Expected output:**
```
Written 11 bytes
```

> [!check]- Answer
> use std::io::{BufWriter, Write};
> fn main() {
>     let mut buffer = Vec::new();
>     {
>         let mut writer = BufWriter::new(&mut buffer);
>         writer.write_all(b"Hello World").unwrap();
>         writer.flush().unwrap();
>     }
>     println!("Written {} bytes", buffer.len());
> }
> ```
>
> **Explanation:** `BufWriter` buffers memory writes until filled or explicitly flushed via `.flush()`.

---

## 6. Related Terms

- [`?` Operator](../level_04/question_mark_operator.md) — The idiomatic propagation tool for the `io::Result<T>` every method here returns.
- [The Standard Library (`std`)](../level_17/std_library.md) — `Read`/`Write`/`BufRead` are specifically part of the OS-integration layer that only `std` (not `core`/`alloc`) provides.
- [Trait Objects (`dyn Trait`)](../level_04/trait_objects.md) — `Box<dyn Read>`/`&mut dyn Write` are common ways to store a heterogeneous I/O source/sink.
- [Tokio](../level_10/tokio.md) — The async counterpart (`AsyncRead`/`AsyncWrite`) for non-blocking I/O.

---

## 7. Key Takeaways

- `Read` and `Write` are the universal, generic byte-I/O traits — a single function written against them works with files, sockets, and in-memory buffers alike.
- `BufRead` extends `Read` with buffered, line-oriented convenience methods like `.lines()` and `.read_line()`.
- `.read()` may perform a **short read** — use `.read_exact()` or `.read_to_end()`/`.read_to_string()` when you need guaranteed-complete reads.
- Every method returns `io::Result<T>`, making the `?` operator the natural way to write I/O code.
