# The Rust Standard Library (`std`)

> **Level 17 — Rust**
> Rust's `std` crate providing portable abstractions for collections, I/O, threading, networking, and OS interaction — unavailable in `no_std` environments like embedded targets.

---

## 1. Prerequisites

- [`core` Library](core_library.md) — Core library foundation.
- [`alloc` Library](alloc_library.md) — Allocation primitives.

---

## 2. Term Category



**Rust Standard Library (operating-system integrated runtime library)**: The `std` library providing OS primitives, collections, I/O, networking, and concurrency.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Rust is designed to target both OS-hosted environments (Linux, macOS, Windows) and bare-metal embedded microcontrollers.

To decouple bare-metal language fundamentals from OS-dependent features, Rust splits its core libraries into `core` (language primitives, no allocation or OS), `alloc` (heap allocation primitives), and `std` (the full Standard Library).

`std` builds on `core` and `alloc` to provide rich operating system integrations: filesystem I/O (`std::fs`), networking (`std::net`), process management (`std::process`), environment variables (`std::env`), multithreading primitives (`std::thread`, `std::sync`), and collections (`HashMap`, `Vec`).

### (2) Reality Metaphor

A fully furnished turn-key apartment unit: it comes connected to city plumbing, electrical grid power, and internet service out-of-the-box (`std`), whereas a bare-metal tent off-grid requires carrying your own water and solar battery cells (`#![no_std]`).

### (3) Rust Code Examples

#### Short Snippet
```rust
use std::collections::HashMap;
use std::fs;

let content = fs::read_to_string("config.toml").expect("Failed to read file");
```

#### Fuller Example
```rust
use std::collections::HashMap;
use std::env;
use std::fs::File;
use std::io::{Read, Result};

pub struct ConfigLoader;

impl ConfigLoader {
    pub fn load_var(key: &str) -> Option<String> {
        env::var(key).ok()
    }

    pub fn read_file(path: &str) -> Result<String> {
        let mut file = File::open(path)?;
        let mut contents = String::new();
        file.read_to_string(&mut contents)?;
        Ok(contents)
    }
}

fn main() {
    if let Some(path) = ConfigLoader::load_var("PATH") {
        assert!(!path.is_empty());
    }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Attempting to Import `std` Primitives in `#![no_std]` Bare-Metal Crates

**The mistake:** Using `use std::thread;` or `use std::fs::File;` inside a micro-controller crate targeting bare metal.

**Why it is wrong:** The `std` library requires underlying Operating System syscalls (e.g. `open()`, `clone()`, `malloc()`). Microcontrollers lack an OS kernel, causing build failure.

*Incorrect:*
```rust
use std::fs::File; // Fails to compile on #![no_std] targets!
```

*Fix:*
```rust
Use core::* or alloc::* for no_std targets; restrict std usage to OS hosted targets!
```

### Mistake 2: Ignoring I/O Error Result Handling When Interacting with `std::fs`

**The mistake:** Unwrapping OS I/O operations directly without inspecting potential `std::io::Error` causes.

**Why it is wrong:** Filesystem access can fail due to permissions, missing paths, or interrupted system calls, causing unhandled runtime panics.

*Incorrect:*
```rust
let data = std::fs::read_to_string("config.json").unwrap();
```

*Fix:*
```rust
let data = std::fs::read_to_string("config.json").map_err(|e| format!("Failed to read file: {e}"))?;
```

### Mistake 3: Confusing `std::sync::Mutex` with Async-Aware Locks in Tokio Async Runtimes

**The mistake:** Holding a blocking `std::sync::MutexGuard` across `.await` points inside asynchronous tasks.

**Why it is wrong:** `std::sync::MutexGuard` blocks the executing OS worker thread. Holding it across `.await` leads to worker pool starvation or runtime panics.

*Incorrect:*
```rust
let guard = std_mutex.lock().unwrap(); async_func().await;
```

*Fix:*
```rust
Use tokio::sync::Mutex or limit std::sync::Mutex lock scope to a short synchronous block before .await!
```

---

## 5. Practice Exercises

### Exercise 1: Production Environment Variable and File Configuration Parser

**Scenario:** Build a production microservice configuration parser in `std` that attempts to read a configuration setting from an OS environment variable, falling back to reading a local disk file via `std::fs`.

**Requirements:**
1. Implement `fn resolve_config_val(env_key: &str, file_fallback_path: &str) -> Result<String, String>`.
1. First query `std::env::var(env_key)`.
1. If missing, fallback to reading `std::fs::read_to_string(file_fallback_path)`.
1. Write unit tests verifying environment resolution and file reading fallback.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::env;
> use std::fs;
> 
> pub fn resolve_config_val(env_key: &str, file_fallback_path: &str) -> Result<String, String> {
>     if let Ok(val) = env::var(env_key) {
>         if !val.trim().is_empty() {
>             return Ok(val);
>         }
>     }
>     fs::read_to_string(file_fallback_path)
>         .map(|s| s.trim().to_string())
>         .map_err(|e| format!("Failed to read fallback file {file_fallback_path}: {e}"))
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
>     use std::io::Write;
> 
>     #[test]
>     fn test_resolve_env_var() {
>         env::set_var("TEST_APP_PORT", "9090");
>         let val = resolve_config_val("TEST_APP_PORT", "nonexistent.txt").unwrap();
>         assert_eq!(val, "9090");
>         env::remove_var("TEST_APP_PORT");
>     }
> 
>     #[test]
>     fn test_resolve_file_fallback() {
>         let path = "test_config_fallback.tmp";
>         let mut f = fs::File::create(path).unwrap();
>         writeln!(f, "8080").unwrap();
>         drop(f);
> 
>         let val = resolve_config_val("NON_EXISTENT_ENV_KEY", path).unwrap();
>         assert_eq!(val, "8080");
> 
>         let _ = fs::remove_file(path);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Uses `std::env::var` to inspect OS environment variables at runtime.
> 2. Uses `std::fs::read_to_string` to read files from the host filesystem upon fallback.
> 3. Combines `std` OS primitives cleanly with error handling.

---

### Exercise 2: Multi-Threaded Worker Pool Task Processor Using `std::thread` and `std::sync` channels

**Scenario:** Implement a worker thread pool pipeline using `std::thread::spawn` and `std::sync::mpsc` channels to process numbers concurrently.

**Requirements:**
1. Create a channel `std::sync::mpsc::channel()`.
1. Spawn a background worker thread via `std::thread::spawn`.
1. Send tasks through sender and collect processed results.
1. Test message passing and thread joining.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::sync::mpsc;
> use std::thread;
> 
> pub fn process_numbers_concurrently(inputs: Vec<i32>) -> Vec<i32> {
>     let (tx, rx) = mpsc::channel();
>     let handle = thread::spawn(move || {
>         let mut results = Vec::new();
>         while let Ok(num) = rx.recv() {
>             results.push(num * 2);
>         }
>         results
>     });
> 
>     for &val in &inputs {
>         tx.send(val).unwrap();
>     }
>     drop(tx); // Close channel to let worker finish loop!
> 
>     handle.join().unwrap()
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_concurrent_processing() {
>         let input = vec![1, 2, 3, 4];
>         let output = process_numbers_concurrently(input);
>         assert_eq!(output, vec![2, 4, 6, 8]);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Uses `std::thread::spawn` to launch lightweight operating system OS threads.
> 2. Uses `std::sync::mpsc` channels for safe inter-thread message passing without data races.

---

### Exercise 3: Host Network Socket Listener Stub via `std::net`

**Scenario:** Build an IP socket address validator using `std::net::SocketAddr`.

**Requirements:**
1. Implement `fn parse_socket_addr(addr_str: &str) -> Option<std::net::SocketAddr>`.
1. Validate IPv4 and IPv6 string representations.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::net::SocketAddr;
> 
> pub fn parse_socket_addr(addr_str: &str) -> Option<SocketAddr> {
>     addr_str.parse::<SocketAddr>().ok()
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_socket_parsing() {
>         let addr = parse_socket_addr("127.0.0.1:8080");
>         assert!(addr.is_some());
>         assert_eq!(addr.unwrap().port(), 8080);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. Uses `std::net::SocketAddr` to leverage OS networking stack abstractions.
> 2. Supports both IPv4 and IPv6 network endpoint parsing.

---

## 5. Related Terms

- [`Path` / `PathBuf`](../level_01/path_pathbuf.md)
- [`Read` / `Write` / `BufRead` Traits](../level_04/read_write_bufread.md)
- [Prelude](../level_07/prelude.md)
- [`core` Library](core_library.md) — Core dependency.
- [`alloc` Library](alloc_library.md) — Alloc dependency.

---

## 7. Key Takeaways

- Provides OS-level abstractions (`Vec`, `String`, `HashMap`, `File`, `thread`, `net`).
- Builds upon `core` and `alloc` foundations.
- Unavailable in bare-metal `#![no_std]` embedded targets lacking an operating system.
- Essential for desktop, server, web backend, and CLI applications.
