# `Path` / `PathBuf`

> **Level 1 — Foundations**
> The borrowed/owned filesystem-path types — the correct way to build and manipulate paths, instead of raw string concatenation.

---

## 1. Prerequisites

- [`String` vs `&str`](../level_01/string_vs_&str.md) — The owned/borrowed split `PathBuf`/`Path` directly mirrors.
- [`AsRef` / `AsMut`](../level_14/as_ref.md) — What lets `Path`-accepting APIs take `&str`, `String`, or `PathBuf` interchangeably.

---

## 2. Term Category

**Standard Library Types (the platform-aware string)**: `Path` (borrowed) and `PathBuf` (owned) represent filesystem paths specifically — as opposed to arbitrary text. They exist because a path is not "just a string": it has platform-specific separator rules, and treating it as plain text invites bugs that only surface on the *other* operating system.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

It's tempting to build a file path with plain string concatenation: `format!("{dir}/{filename}")`. This works on Linux and macOS, and silently produces a *broken* path on Windows, which uses `\` as its separator (though it does tolerate `/` in many contexts). Beyond separators, paths have their own semantics — components, extensions, parent directories — that don't map cleanly onto generic string operations. `Path`/`PathBuf` exist to make path manipulation both **correct across platforms** and **semantically meaningful**: `.join()` inserts the right separator for the current OS automatically, `.extension()` and `.file_stem()` parse path components properly, and the types themselves signal in a function signature "this parameter is specifically a filesystem path," not an arbitrary string.

### (2) Reality Metaphor

Imagine writing a postal address by hand versus using a country-aware address-formatting service.

- **Raw string concatenation**: You glue `city + ", " + street` together the same way regardless of country, and it happens to look right for the one country you tested in — but silently produces a malformed, undeliverable address the moment someone in a different country (**a different OS**) tries to use it.
- **`PathBuf::join()`**: You hand the pieces to a service that knows exactly which punctuation and ordering rules apply for *wherever the letter is actually being delivered* (**the current OS**), and it assembles a correctly formatted address automatically, every time, regardless of where you're mailing from.

### (3) Rust Code Examples

#### Short Snippet (Building a Path Correctly)
```rust
use std::path::PathBuf;

fn main() {
    let mut path = PathBuf::from("projects");
    path.push("rust-tutorial"); // .push() inserts the RIGHT separator for the current OS.
    path.push("src");
    path.push("main.rs");

    println!("{}", path.display()); // "projects/rust-tutorial/src/main.rs" on Unix
                                     // "projects\rust-tutorial\src\main.rs" on Windows
}
```

#### Fuller Example (Parsing Path Components)
```rust
use std::path::Path;

fn main() {
    let path = Path::new("/home/user/report.final.txt");

    println!("{:?}", path.file_name());   // Some("report.final.txt")
    println!("{:?}", path.file_stem());   // Some("report.final")  <- everything but the LAST extension
    println!("{:?}", path.extension());   // Some("txt")
    println!("{:?}", path.parent());      // Some("/home/user")
    println!("{}", path.is_absolute());   // true

    // AsRef<Path> means functions can accept &str, String, or PathBuf interchangeably:
    fn print_ext(p: impl AsRef<Path>) {
        println!("{:?}", p.as_ref().extension());
    }
    print_ext("config.toml");                 // works with &str
    print_ext(String::from("data.csv"));      // works with String
    print_ext(PathBuf::from("archive.tar.gz")); // works with PathBuf
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Path Pathbuf Scoping and Lifecycle Rules

**The mistake:** Assuming Path Pathbuf instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("path_pathbuf_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("path_pathbuf_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Path Pathbuf State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Path Pathbuf through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Path Pathbuf Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Path Pathbuf instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Fix the Platform Bug

**Problem:** This function builds a path with string formatting. Rewrite it using `PathBuf` so it works correctly on both Unix and Windows.
```rust
fn config_path(dir: &str, name: &str) -> String {
    format!("{dir}/{name}.toml")
}
```

> [!check]- Answer
> ```rust
> use std::path::{Path, PathBuf};
>
> fn config_path(dir: &str, name: &str) -> PathBuf {
>     Path::new(dir).join(format!("{name}.toml"))
> }
> ```
>
> `.join()` inserts the platform-correct separator automatically, and returning `PathBuf` (rather than `String`) signals to callers that this is specifically a filesystem path, not arbitrary text.

---

### Exercise 2: Extracting File Extensions Safely

**Problem:** Write a function `get_extension(path_str: &str) -> Option<String>` that parses a string into a `Path`, extracts its file extension, and converts it to a lowercase `String`.

**Expected output:**
```
Some("rs")
```

> [!check]- Answer
> ```rust
> use std::path::Path;
> fn get_extension(path_str: &str) -> Option<String> {
>     Path::new(path_str)
>         .extension()
>         .and_then(|ext| ext.to_str())
>         .map(|s| s.to_lowercase())
> }
> fn main() {
>     println!("{:?}", get_extension("src/main.RS"));
> }
> ```
>
> **Explanation:** `Path::extension` inspects filename components and returns `Option<&OsStr>`, which is safely parsed into UTF-8 text.

### Exercise 3: Navigating Parent Directories

**Problem:** Given `Path::new("/a/b/c/file.txt")`, iterate upward printing all parent directories until reaching the root.

**Expected output:**
```
/a/b/c
/a/b
/a
/
```

> [!check]- Answer
> ```rust
> use std::path::Path;
> fn main() {
>     let mut curr = Path::new("/a/b/c/file.txt").parent();
>     while let Some(p) = curr {
>         println!("{}", p.display());
>         curr = p.parent();
>     }
> }
> ```
>
> **Explanation:** `Path::parent` steps up one directory hierarchy level, returning `None` once root directory boundaries are reached.

---

## 6. Related Terms

- [`String` vs `&str`](../level_01/string_vs_&str.md) — The owned/borrowed pattern `PathBuf`/`Path` directly mirrors.
- [`AsRef` / `AsMut`](../level_14/as_ref.md) — What lets path-accepting functions be generic over `&str`/`String`/`PathBuf` via `impl AsRef<Path>`.
- [`OsString` / `OsStr`](../level_01/os_string_str.md) — What `Path`/`PathBuf` are internally built on, since filenames aren't always valid UTF-8.
- [The Standard Library (`std`)](../level_17/std_library.md) — `Path`/`PathBuf` are part of the OS-integration layer.

---

## 7. Key Takeaways

- `Path` is the **borrowed** view (like `&str`); `PathBuf` is the **owned**, growable version (like `String`).
- `.join()`/`.push()` insert the platform-correct separator automatically — never build paths with raw string concatenation.
- `Path` provides semantic accessors (`.file_name()`, `.extension()`, `.parent()`) that a plain string has no concept of.
- Accept path-like parameters as `impl AsRef<Path>` so callers can pass `&str`, `String`, or `PathBuf` interchangeably.
