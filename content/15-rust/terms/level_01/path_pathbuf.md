# `Path` / `PathBuf`

> **Level 1 — Foundations**
> The borrowed/owned filesystem-path types — the correct way to build and manipulate paths, instead of raw string concatenation.

---

## 1. Prerequisites


- [String vs &str](string_vs_&str.md) — The owned/borrowed split `PathBuf`/`Path` directly mirrors.
- [`AsRef<T>` Trait](../level_14/as_ref.md) — What lets `Path`-accepting APIs take `&str`, `String`, or `PathBuf` interchangeably.

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

---

## 5. Practice Exercises

### Exercise 1: Multi-Tenant Storage Sandbox & Path Traversal Guard

**Scenario:**
You are building the storage backend for a multi-tenant cloud application. Users can request files via relative paths (e.g., `user_123/documents/report.pdf`). However, untrusted inputs might attempt path traversal attacks using parent directory components (`../../etc/passwd`), absolute paths (`/etc/shadow`), or disallowed extensions (`script.sh`).

Write a production-grade function `sanitize_and_resolve_path` that safely joins a `base_dir` and `user_path` while enforcing the following security guarantees:
1. Accept generic path-like arguments using `impl AsRef<Path>`.
2. Reject absolute user paths immediately, guarding against `PathBuf::join`'s behavior where joining an absolute path replaces the base path entirely.
3. Walk path components via `.components()` to detect and reject `Component::ParentDir` (`..`), `Component::RootDir`, or `Component::Prefix`.
4. Validate file extensions against a whitelist using `.extension()`.
5. Verify containment within `base_dir` via `.starts_with()`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::path::{Component, Path, PathBuf};
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum StorageSecurityError {
>     AbsoluteUserPath,
>     PathTraversalDetected,
>     DisallowedExtension,
>     OutsideBaseDirectory,
> }
> 
> pub fn sanitize_and_resolve_path(
>     base_dir: impl AsRef<Path>,
>     user_path: impl AsRef<Path>,
>     allowed_extensions: &[&str],
> ) -> Result<PathBuf, StorageSecurityError> {
>     let base = base_dir.as_ref();
>     let user = user_path.as_ref();
> 
>     // 1. Guard against absolute path override invariant in PathBuf::join
>     if user.is_absolute() {
>         return Err(StorageSecurityError::AbsoluteUserPath);
>     }
> 
>     // 2. Component-level traversal check
>     let mut normalized = PathBuf::new();
>     for comp in user.components() {
>         match comp {
>             Component::ParentDir => return Err(StorageSecurityError::PathTraversalDetected),
>             Component::CurDir => continue,
>             Component::Normal(c) => normalized.push(c),
>             Component::RootDir | Component::Prefix(_) => {
>                 return Err(StorageSecurityError::AbsoluteUserPath);
>             }
>         }
>     }
> 
>     // 3. Whitelist extension check
>     if !allowed_extensions.is_empty() {
>         let ext_valid = normalized
>             .extension()
>             .and_then(|e| e.to_str())
>             .map(|e| allowed_extensions.iter().any(|&allowed| allowed.eq_ignore_ascii_case(e)))
>             .unwrap_or(false);
> 
>         if !ext_valid {
>             return Err(StorageSecurityError::DisallowedExtension);
>         }
>     }
> 
>     let full_path = base.join(&normalized);
> 
>     // 4. Invariant containment check
>     if !full_path.starts_with(base) {
>         return Err(StorageSecurityError::OutsideBaseDirectory);
>     }
> 
>     Ok(full_path)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
>     use std::path::Path;
> 
>     #[test]
>     fn test_valid_path_resolution() {
>         let base = Path::new("/var/app/storage");
>         let user = "user_123/documents/report.pdf";
>         let allowed = ["pdf", "png"];
> 
>         let resolved = sanitize_and_resolve_path(base, user, &allowed).unwrap();
>         assert_eq!(
>             resolved,
>             Path::new("/var/app/storage/user_123/documents/report.pdf")
>         );
>         assert!(resolved.starts_with(base));
>         assert_ne!(resolved, Path::new("/var/app/storage/other.pdf"));
>     }
> 
>     #[test]
>     fn test_reject_traversal_attack() {
>         let base = Path::new("/var/app/storage");
>         let user = "user_123/../../etc/passwd";
>         let allowed = ["pdf"];
> 
>         let res = sanitize_and_resolve_path(base, user, &allowed);
>         assert!(matches!(res, Err(StorageSecurityError::PathTraversalDetected)));
>     }
> 
>     #[test]
>     fn test_reject_absolute_path() {
>         let base = Path::new("/var/app/storage");
>         let user = "/etc/shadow";
>         let allowed = ["pdf"];
> 
>         let res = sanitize_and_resolve_path(base, user, &allowed);
>         assert!(matches!(res, Err(StorageSecurityError::AbsoluteUserPath)));
>     }
> 
>     #[test]
>     fn test_disallowed_extension() {
>         let base = Path::new("/var/app/storage");
>         let user = "malicious_script.sh";
>         let allowed = ["pdf", "png"];
> 
>         let res = sanitize_and_resolve_path(base, user, &allowed);
>         assert_eq!(res, Err(StorageSecurityError::DisallowedExtension));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
> 1. **Path Join Pitfall (`is_absolute`)**: In Rust standard library, calling `base_path.join("/etc/passwd")` returns `PathBuf::from("/etc/passwd")` — the base path is completely discarded! Checking `.is_absolute()` upfront prevents accidental root override.
> 2. **Component Inspection (`.components()`)**: Rather than inspecting strings for `".."`, we iterate over OS-aware `Component` enums (`Component::ParentDir`, `Component::Normal`, etc.). This correctly handles cross-platform subtleties like backslashes (`\`) on Windows and slashes (`/`) on Unix.
> 3. **Extension Safety (`.extension()`)**: Using `Path::extension()` yields an `Option<&OsStr>`, avoiding manual string splitting errors with multiple dots (e.g. `archive.tar.gz`).
> 4. **Containment Verification (`.starts_with()`)**: Performing `.starts_with(base_dir)` provides a final invariant check ensuring the resulting `PathBuf` is hierarchically nested within the intended root directory.
>
> 
---

### Exercise 2: High-Performance Log Cleanup & Archive Relocation Pipeline

**Scenario:**
You are developing an automated log rotation daemon. The daemon scans log directories, identifies active log files, extracts their relative subdirectories, appends timestamp tags, and generates target archive destination paths inside a separate archive storage partition.

Write a production-grade function `plan_log_archive_target` that constructs the target archive path given a `log_root`, an `archive_root`, an `entry_path`, and a `timestamp_tag`.

The function must:
1. Accept parameters as `impl AsRef<Path>` for flexible ownership and borrowing.
2. Strip `log_root` from `entry_path` using `.strip_prefix()` to isolate the relative subdirectory hierarchy.
3. Extract file stem (`.file_stem()`) and extension (`.extension()`, defaulting to `"log"` if missing).
4. Construct an archive filename formatted as `<file_stem>.<timestamp_tag>.<extension>.gz`.
5. Join `archive_root`, the relative parent directory, and the new archive filename.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::path::{Path, PathBuf};
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum LogPipelineError {
>     InvalidRootPrefix,
>     MissingFileName,
> }
> 
> pub fn plan_log_archive_target(
>     log_root: impl AsRef<Path>,
>     archive_root: impl AsRef<Path>,
>     entry_path: impl AsRef<Path>,
>     timestamp_tag: &str,
> ) -> Result<PathBuf, LogPipelineError> {
>     let log_root = log_root.as_ref();
>     let archive_root = archive_root.as_ref();
>     let entry_path = entry_path.as_ref();
> 
>     // 1. Isolate relative path from log root
>     let relative = entry_path
>         .strip_prefix(log_root)
>         .map_err(|_| LogPipelineError::InvalidRootPrefix)?;
> 
>     // 2. Extract stem and extension
>     let stem = entry_path
>         .file_stem()
>         .and_then(|s| s.to_str())
>         .ok_or(LogPipelineError::MissingFileName)?;
> 
>     let extension = entry_path
>         .extension()
>         .and_then(|e| e.to_str())
>         .unwrap_or("log");
> 
>     // 3. Format archive filename
>     let archive_name = format!("{stem}.{timestamp_tag}.{extension}.gz");
> 
>     // 4. Reconstruct destination preserving relative subdirectories
>     let rel_parent = relative.parent().unwrap_or_else(|| Path::new(""));
>     let target_path = archive_root.join(rel_parent).join(archive_name);
> 
>     Ok(target_path)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
>     use std::path::Path;
> 
>     #[test]
>     fn test_valid_archive_target_planning() {
>         let log_root = Path::new("/var/log/app");
>         let archive_root = Path::new("/mnt/backups/logs");
>         let entry = Path::new("/var/log/app/services/auth/error.log");
> 
>         let target = plan_log_archive_target(log_root, archive_root, entry, "2026-07-31").unwrap();
>         assert_eq!(
>             target,
>             Path::new("/mnt/backups/logs/services/auth/error.2026-07-31.log.gz")
>         );
>         assert!(target.starts_with(archive_root));
>         assert_ne!(target, entry);
>     }
> 
>     #[test]
>     fn test_invalid_prefix_error() {
>         let log_root = Path::new("/var/log/app");
>         let archive_root = Path::new("/mnt/backups");
>         let entry = Path::new("/etc/nginx/nginx.conf");
> 
>         let res = plan_log_archive_target(log_root, archive_root, entry, "2026-07-31");
>         assert!(matches!(res, Err(LogPipelineError::InvalidRootPrefix)));
>     }
> 
>     #[test]
>     fn test_root_level_log_file() {
>         let log_root = Path::new("/var/log");
>         let archive_root = Path::new("/mnt/archive");
>         let entry = Path::new("/var/log/syslog");
> 
>         let target = plan_log_archive_target(log_root, archive_root, entry, "2026-07-31").unwrap();
>         assert_eq!(target, Path::new("/mnt/archive/syslog.2026-07-31.log.gz"));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
> 1. **Prefix Stripping (`strip_prefix`)**: Operating on raw strings to remove parent folders leads to bugs with mismatched path separators (`/` vs `\`). `Path::strip_prefix` returns a borrowed `&Path` slice relative to the root, guaranteeing platform independence.
> 2. **Component Decomposition (`file_stem` & `extension`)**: `Path::file_stem()` extracts everything prior to the final dot extension. Combining this with `Path::extension()` ensures multi-dot filenames (e.g. `service.auth.log`) correctly separate `service.auth` (stem) and `log` (extension).
> 3. **Path Composition (`.parent()` & `.join()`)**: To preserve relative folder hierarchies (e.g. `log_root/services/auth/app.log` -> `archive_root/services/auth/app.2026-07-31.log.gz`), we slice the relative path's parent using `.parent()` and chain `.join()`.
>
> 
---

### Exercise 3: Cross-Platform Compiler Build System Output Artifact Mapper

**Scenario:**
In a custom Rust compiler toolchain or code generator, source files inside `src/` must be mapped to corresponding output build artifacts inside `target/dist/` with transformed file extensions (e.g. `src/gfx/pipeline/render_pass.rs` -> `target/dist/gfx/pipeline/render_pass.o`).

Write a production-grade function `map_source_to_build_artifact` that handles this path transformation cleanly and safely.

The function must:
1. Accept parameters as `impl AsRef<Path>`.
2. Strip `src_base` from `source_file` using `.strip_prefix()`.
3. Validate that `source_file` contains a non-empty file stem using `.file_stem()`.
4. Swap the file extension using `.with_extension()`.
5. Join the transformed relative path to `target_base`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::path::{Path, PathBuf};
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum BuildArtifactError {
>     SourceOutsideBase,
>     MissingFileStem,
> }
> 
> pub fn map_source_to_build_artifact(
>     src_base: impl AsRef<Path>,
>     target_base: impl AsRef<Path>,
>     source_file: impl AsRef<Path>,
>     target_ext: &str,
> ) -> Result<PathBuf, BuildArtifactError> {
>     let src_base = src_base.as_ref();
>     let target_base = target_base.as_ref();
>     let source_file = source_file.as_ref();
> 
>     // 1. Ensure source file is within src_base
>     let rel_subpath = source_file
>         .strip_prefix(src_base)
>         .map_err(|_| BuildArtifactError::SourceOutsideBase)?;
> 
>     // 2. Validate stem presence
>     if source_file.file_stem().is_none() {
>         return Err(BuildArtifactError::MissingFileStem);
>     }
> 
>     // 3. Swap extension and prepend target_base
>     let artifact_path = target_base.join(rel_subpath).with_extension(target_ext);
> 
>     Ok(artifact_path)
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
>     use std::path::Path;
> 
>     #[test]
>     fn test_successful_extension_mapping() {
>         let src_base = Path::new("/projects/engine/src");
>         let target_base = Path::new("/projects/engine/target/release/build");
>         let source_file = Path::new("/projects/engine/src/gfx/pipeline/render_pass.rs");
> 
>         let artifact =
>             map_source_to_build_artifact(src_base, target_base, source_file, "o").unwrap();
> 
>         assert_eq!(
>             artifact,
>             Path::new("/projects/engine/target/release/build/gfx/pipeline/render_pass.o")
>         );
>         assert!(artifact.starts_with(target_base));
>         assert_ne!(artifact, source_file);
>         assert_eq!(artifact.extension().and_then(|e| e.to_str()), Some("o"));
>     }
> 
>     #[test]
>     fn test_source_outside_base_err() {
>         let src_base = Path::new("/projects/engine/src");
>         let target_base = Path::new("/projects/engine/target");
>         let source_file = Path::new("/external/lib/vendor.rs");
> 
>         let res = map_source_to_build_artifact(src_base, target_base, source_file, "o");
>         assert!(matches!(res, Err(BuildArtifactError::SourceOutsideBase)));
>     }
> 
>     #[test]
>     fn test_relative_path_mapping() {
>         let src_base = Path::new("src");
>         let target_base = Path::new("dist");
>         let source_file = Path::new("src/ui/components/button.tsx");
> 
>         let artifact =
>             map_source_to_build_artifact(src_base, target_base, source_file, "js").unwrap();
>         assert_eq!(artifact, Path::new("dist/ui/components/button.js"));
>     }
> }
> ```
>
> #### Technical Explanation
>
>
> 1. **Extension Manipulation (`with_extension`)**: Raw string replacement of extensions (e.g., `s.replace(".rs", ".o")`) is highly error-prone if the path contains `.rs` elsewhere in folder names (`src/rs_parser/mod.rs`). `Path::with_extension` mutates only the final extension component in a zero-cost, semantic manner.
> 2. **Zero Allocation Slicing (`AsRef<Path>`)**: By declaring generic parameters `impl AsRef<Path>`, callers can pass string literals (`&str`), owned `String`, `Path`, or `PathBuf` without upfront allocations.
> 3. **Ownership and Copy Semantics**: `strip_prefix` produces a borrowed `&Path` slice without copying strings. Calling `.with_extension()` on `Path` allocates a new `PathBuf` holding the modified extension.
>
> 
---

## 6. Related Terms


- [String vs &str](string_vs_&str.md) — The owned/borrowed pattern `PathBuf`/`Path` directly mirrors.
- [`AsRef<T>` Trait](../level_14/as_ref.md) — What lets path-accepting functions be generic over `&str`/`String`/`PathBuf` via `impl AsRef<Path>`.
- [`OsString` / `OsStr`](os_string_str.md) — What `Path`/`PathBuf` are internally built on, since filenames aren't always valid UTF-8.
- [The Rust Standard Library (`std`)](../level_17/std_library.md) — `Path`/`PathBuf` are part of the OS-integration layer.
- [`File`, `BufReader`, `BufWriter`](../level_04/file_bufreadwriter.md) — File IO operations.

---

## 7. Key Takeaways

- `Path` is the **borrowed** view (like `&str`); `PathBuf` is the **owned**, growable version (like `String`).
- `.join()`/`.push()` insert the platform-correct separator automatically — never build paths with raw string concatenation.
- `Path` provides semantic accessors (`.file_name()`, `.extension()`, `.parent()`) that a plain string has no concept of.
- Accept path-like parameters as `impl AsRef<Path>` so callers can pass `&str`, `String`, or `PathBuf` interchangeably.
