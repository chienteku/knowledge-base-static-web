# Package

> **Level 1 — Foundations**
> A Cargo concept containing one or more crates, defined by a `Cargo.toml` file.

---

## 1. Prerequisites


- [Cargo](cargo.md) — The Rust package manager and build system
- [Crate](crate.md) — A compilation unit in Rust (either a library or a binary)

---

## 2. Term Category



**Rust Cargo Construct (bundle of one or more crates)**

A Cargo-specific concept that organizes one or more crates and defines how they are built.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

As we built Cargo to manage Rust projects, we needed a clear distinction between "the thing being compiled" (a crate) and "the project you distribute" (a package). If every project was just a single crate, things would get messy when developers wanted to ship both a command-line tool and a reusable library in the same repository. 

We designed the **Package** as a container. A package is defined by a `Cargo.toml` file. It's the unit of distribution you upload to crates.io. Inside a package, you can have multiple crates (usually one library crate and one or more binary crates). This design gives you a clean way to organize, version, and publish related code together, while still letting the Rust compiler deal with individual crates independently.

### (2) Reality Metaphor

Think of a **Package** as a shipping box, and a **Crate** as the actual product inside.

When you buy a drone, the whole box that arrives at your door is the **Package**. It has a shipping label (`Cargo.toml`) that tells the delivery system where it's going, what's inside, and how heavy it is. Inside the box, you might have the drone itself (a binary crate — something you can turn on and use) and a spare parts kit (a library crate — parts you can use to build or fix things). The package is how you ship it; the crates are what actually do the work.

### (3) Rust Code Examples

#### Short Snippet

Here is what the defining file of a package, `Cargo.toml`, looks like:

```toml
[package]
name = "my_awesome_package"
version = "0.1.0"
edition = "2024"

[dependencies]
# Dependencies for the entire package go here
rand = "0.10"
```

#### Fuller Example

A typical package structure on your file system looks like this. The package contains both a library crate (`src/lib.rs`) and a binary crate (`src/main.rs`).

```text
my_awesome_package/    # This is a PACKAGE (the shipping box)
├── Cargo.toml         # The package definition and dependencies
├── src/
│   ├── lib.rs         # A LIBRARY CRATE (reusable code)
│   └── main.rs        # A BINARY CRATE (executable program)
```

In `src/lib.rs` (the library crate):

```rust
// This functionality is part of the library crate
pub fn calculate_power(base: u32, exponent: u32) -> u32 {
    base.pow(exponent)
}
```

In `src/main.rs` (the binary crate):

```rust
// The binary crate can use the library crate from the same package
use my_awesome_package::calculate_power;

fn main() {
    let result = calculate_power(2, 8);
    println!("2 to the power of 8 is: {}", result);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Package Scoping and Lifecycle Rules

**The mistake:** Assuming Package instances remain valid beyond their declaring scope block or across asynchronous boundaries without explicit lifetime tracking.

**Why it's wrong:** Rust strictly enforces lexical scope boundaries and non-lexical lifetimes (NLL) at compile time. Accessing dropped values or failing to handle variable drop order results in compiler errors such as `E0597` or `E0382`.

*Incorrect:*
```rust
fn get_ref() -> &str {
    let s = String::from("package_data");
    &s // ❌ Error E0106/E0515: returns a reference to data owned by the current function
}
```

*Fix:*
```rust
fn get_string() -> String {
    let s = String::from("package_data");
    s // Ownership of the String is transferred directly to the caller
}
```

### Mistake 2: Mutating Package State Without Exclusive Ownership or `mut` Borrowing

**The mistake:** Attempting to mutate data associated with Package through an immutable reference `&T` or without specifying `mut` in variable declarations.

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

### Mistake 3: Concurrent Access to Package Across Threads Without `Send` / `Sync` Guards

**The mistake:** Sharing non-thread-safe Package instances across OS threads via `std::thread::spawn`.

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

### Exercise 1: Multi-Target Cargo Package Manifest Parser and Target Validation Engine

**Scenario:**
In build orchestrators, package managers, and automated CI/CD tools, a Cargo package manifest must be inspected and validated before compilation starts. A valid Cargo package enforces fundamental structural invariants:
1. A package can contain **at most one library crate target** (`src/lib.rs`).
2. A package can contain **zero or more binary crate targets** (`src/main.rs`, `src/bin/*.rs`).
3. Binary target names within a single package must be **unique**.
4. The package manifest maintains a list of external package dependencies. Transitive dependency graphs must be checked for direct or indirect **cyclic package references** (e.g. Package A depends on B, B depends on C, C depends on A).

Your goal is to build a production-grade `PackageRegistry` that models package targets, validates package structural constraints upon insertion, and detects cyclic dependency chains across registered packages.

**Requirements:**
1. Implement a `Version` struct with `major`, `minor`, and `patch` fields, implementing `Display`, `PartialEq`, `Eq`, `PartialOrd`, and `Ord`.
2. Implement a `TargetKind` enum (`Library`, `Binary`) and a `Target` struct representing package targets with `name`, `kind`, and source `path`.
3. Implement a `Package` struct representing a package manifest with a `name`, `version`, `targets` (`Vec<Target>`), and `dependencies` (`Vec<String>` representing dependent package names).
4. Implement a `PackageRegistry` struct:
   - `add_package(&mut self, package: Package) -> Result<(), PackageError>`: validates target rules (returns `Err(PackageError::MultipleLibraryTargets)` if >1 library target exists, `Err(PackageError::DuplicateBinaryTarget(name))` if binary target names duplicate, or `Err(PackageError::EmptyPackageName)` if name is empty/whitespace).
   - `find_package(&self, name: &str) -> Option<&Package>`: returns a reference to the registered package.
   - `detect_cycle(&self, start_package: &str) -> Result<bool, PackageError>`: performs depth-first search (DFS) over package dependency names to determine if a cyclic dependency path exists starting from `start_package`. Returns `Err(PackageError::PackageNotFound)` if any traversed dependency is missing from the registry.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::{HashMap, HashSet};
> use std::fmt;
> 
> #[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash)]
> pub struct Version {
>     pub major: u32,
>     pub minor: u32,
>     pub patch: u32,
> }
> 
> impl Version {
>     pub fn new(major: u32, minor: u32, patch: u32) -> Self {
>         Self { major, minor, patch }
>     }
> }
> 
> impl fmt::Display for Version {
>     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
>         write!(f, "{}.{}.{}", self.major, self.minor, self.patch)
>     }
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub enum TargetKind {
>     Library,
>     Binary,
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct Target {
>     pub name: String,
>     pub kind: TargetKind,
>     pub path: String,
> }
> 
> impl Target {
>     pub fn library(name: impl Into<String>, path: impl Into<String>) -> Self {
>         Self {
>             name: name.into(),
>             kind: TargetKind::Library,
>             path: path.into(),
>         }
>     }
> 
>     pub fn binary(name: impl Into<String>, path: impl Into<String>) -> Self {
>         Self {
>             name: name.into(),
>             kind: TargetKind::Binary,
>             path: path.into(),
>         }
>     }
> }
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct Package {
>     pub name: String,
>     pub version: Version,
>     pub targets: Vec<Target>,
>     pub dependencies: Vec<String>,
> }
> 
> impl Package {
>     pub fn new(name: impl Into<String>, version: Version) -> Self {
>         Self {
>             name: name.into(),
>             version,
>             targets: Vec::new(),
>             dependencies: Vec::new(),
>         }
>     }
> 
>     pub fn add_target(&mut self, target: Target) {
>         self.targets.push(target);
>     }
> 
>     pub fn add_dependency(&mut self, dep_name: impl Into<String>) {
>         self.dependencies.push(dep_name.into());
>     }
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum PackageError {
>     EmptyPackageName,
>     MultipleLibraryTargets,
>     DuplicateBinaryTarget(String),
>     PackageNotFound(String),
> }
> 
> impl fmt::Display for PackageError {
>     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
>         match self {
>             PackageError::EmptyPackageName => write!(f, "Package name cannot be empty"),
>             PackageError::MultipleLibraryTargets => {
>                 write!(f, "A package can contain at most one library target")
>             }
>             PackageError::DuplicateBinaryTarget(name) => {
>                 write!(f, "Duplicate binary target name: '{}'", name)
>             }
>             PackageError::PackageNotFound(name) => {
>                 write!(f, "Package '{}' not found in registry", name)
>             }
>         }
>     }
> }
> 
> impl std::error::Error for PackageError {}
> 
> #[derive(Debug, Default)]
> pub struct PackageRegistry {
>     packages: HashMap<String, Package>,
> }
> 
> impl PackageRegistry {
>     pub fn new() -> Self {
>         Self {
>             packages: HashMap::new(),
>         }
>     }
> 
>     pub fn add_package(&mut self, package: Package) -> Result<(), PackageError> {
>         if package.name.trim().is_empty() {
>             return Err(PackageError::EmptyPackageName);
>         }
> 
>         let mut lib_count = 0;
>         let mut bin_names = HashSet::new();
> 
>         for target in &package.targets {
>             match target.kind {
>                 TargetKind::Library => {
>                     lib_count += 1;
>                     if lib_count > 1 {
>                         return Err(PackageError::MultipleLibraryTargets);
>                     }
>                 }
>                 TargetKind::Binary => {
>                     if !bin_names.insert(&target.name) {
>                         return Err(PackageError::DuplicateBinaryTarget(target.name.clone()));
>                     }
>                 }
>             }
>         }
> 
>         self.packages.insert(package.name.clone(), package);
>         Ok(())
>     }
> 
>     pub fn find_package(&self, name: &str) -> Option<&Package> {
>         self.packages.get(name)
>     }
> 
>     pub fn detect_cycle(&self, start_package: &str) -> Result<bool, PackageError> {
>         if !self.packages.contains_key(start_package) {
>             return Err(PackageError::PackageNotFound(start_package.to_string()));
>         }
> 
>         let mut visited = HashSet::new();
>         let mut rec_stack = HashSet::new();
>
>         self.dfs_cycle(start_package, &mut visited, &mut rec_stack)
>     }
>
>     fn dfs_cycle(
>         &self,
>         curr: &str,
>         visited: &mut HashSet<String>,
>         rec_stack: &mut HashSet<String>,
>     ) -> Result<bool, PackageError> {
>         let pkg = self
>             .packages
>             .get(curr)
>             .ok_or_else(|| PackageError::PackageNotFound(curr.to_string()))?;
>
>         visited.insert(curr.to_string());
>         rec_stack.insert(curr.to_string());
>
>         for dep in &pkg.dependencies {
>             if !visited.contains(dep) {
>                 if self.dfs_cycle(dep, visited, rec_stack)? {
>                     return Ok(true);
>                 }
>             } else if rec_stack.contains(dep) {
>                 return Ok(true);
>             }
>         }
>
>         rec_stack.remove(curr);
>         Ok(false)
>     }
> }
>
> #[cfg(test)]
> mod tests {
>     use super::*;
>
>     #[test]
>     fn test_package_validation_success() {
>         let mut reg = PackageRegistry::new();
>         let mut pkg = Package::new("my_crate", Version::new(1, 0, 0));
>         pkg.add_target(Target::library("my_crate", "src/lib.rs"));
>         pkg.add_target(Target::binary("cli", "src/bin/cli.rs"));
>         pkg.add_target(Target::binary("daemon", "src/bin/daemon.rs"));
>
>         let res = reg.add_package(pkg);
>         assert!(res.is_ok());
>         assert_eq!(reg.find_package("my_crate").unwrap().targets.len(), 3);
>     }
>
>     #[test]
>     fn test_multiple_libraries_error() {
>         let mut reg = PackageRegistry::new();
>         let mut pkg = Package::new("invalid_pkg", Version::new(0, 1, 0));
>         pkg.add_target(Target::library("lib1", "src/lib.rs"));
>         pkg.add_target(Target::library("lib2", "src/lib2.rs"));
>
>         let res = reg.add_package(pkg);
>         assert!(matches!(res, Err(PackageError::MultipleLibraryTargets)));
>     }
>
>     #[test]
>     fn test_duplicate_binary_error() {
>         let mut reg = PackageRegistry::new();
>         let mut pkg = Package::new("dup_bin_pkg", Version::new(0, 1, 0));
>         pkg.add_target(Target::binary("app", "src/main.rs"));
>         pkg.add_target(Target::binary("app", "src/bin/app.rs"));
>
>         let res = reg.add_package(pkg);
>         assert!(matches!(
>             res,
>             Err(PackageError::DuplicateBinaryTarget(ref name)) if name == "app"
>         ));
>     }
>
>     #[test]
>     fn test_dependency_cycle_detection() {
>         let mut reg = PackageRegistry::new();
>
>         let mut pkg_a = Package::new("pkg_a", Version::new(1, 0, 0));
>         pkg_a.add_dependency("pkg_b");
>
>         let mut pkg_b = Package::new("pkg_b", Version::new(1, 0, 0));
>         pkg_b.add_dependency("pkg_c");
>
>         let mut pkg_c = Package::new("pkg_c", Version::new(1, 0, 0));
>         pkg_c.add_dependency("pkg_a");
>
>         reg.add_package(pkg_a).unwrap();
>         reg.add_package(pkg_b).unwrap();
>         reg.add_package(pkg_c).unwrap();
>
>         let has_cycle = reg.detect_cycle("pkg_a").unwrap();
>         assert!(has_cycle);
>         assert_ne!(has_cycle, false);
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Package Target Invariants & Verification**: Cargo packages organize library and binary crates under strict rules. By iterating through `package.targets` during `add_package`, we keep track of library target counts and use a `HashSet<&str>` to ensure binary target names do not conflict.
> 2. **Dependency Graph Cycle Detection**: We model dependency checking as a directed graph traversal. Using a Depth-First Search (DFS) with a recursion stack tracking set (`rec_stack`), we detect cycles in $O(V + E)$ time complexity. If a node currently in the call stack is re-visited, a cycle exists.
> 3. **Ownership and Lifetimes**: The `PackageRegistry` owns its stored `Package` instances inside a `HashMap<String, Package>`. Borrowing via `find_package` returns `Option<&Package>` tied to the registry's lifetime (`&'a self -> Option<&'a Package>`), respecting Rust's borrow checking invariants.
> 4. **Edge Cases Handled**: Empty/whitespace package names, packages with no targets, packages with no dependencies, missing dependency lookups, and multi-node cyclic chains.
> 
>

---

### Exercise 2: Thread-Safe Package Target Execution Engine with Interior Mutability

**Scenario:**
When building multi-binary microservice packages (e.g. a database package containing server binary `db-server`, admin CLI binary `db-cli`, and worker binary `db-worker`), a task execution runner executes package binary targets across worker threads concurrently. Each target execution transitions through distinct lifecycle states: `Pending`, `Running`, `Completed { exit_code: i32 }`, and `Failed { error: String }`.

You must implement a thread-safe `PackageExecutionEngine` that manages shared binary target execution states across threads using thread synchronization primitives (`Arc`, `RwLock`).

**Requirements:**
1. Define `ExecutionState` enum: `Pending`, `Running`, `Completed { exit_code: i32 }`, and `Failed { error: String }`.
2. Define `TargetStatus` containing `binary_name: String`, `state: ExecutionState`, and `duration_ms: u64`.
3. Implement `PackageExecutionEngine`:
   - `new(package_name: impl Into<String>) -> Self`
   - `register_target(&self, binary_name: impl Into<String>) -> Result<(), String>`: registers a new binary target in `Pending` state. Fails if already registered.
   - `start_target(&self, binary_name: &str) -> Result<(), String>`: transitions target from `Pending` to `Running`. Fails if target is not in `Pending` state.
   - `complete_target(&self, binary_name: &str, exit_code: i32, duration_ms: u64) -> Result<(), String>`: transitions target from `Running` to `Completed`. Fails if target is not in `Running` state.
   - `fail_target(&self, binary_name: &str, error: impl Into<String>) -> Result<(), String>`: transitions target to `Failed`.
   - `get_status(&self, binary_name: &str) -> Option<ExecutionState>`: returns current state clone.
   - `all_completed_successfully(&self) -> bool`: returns true if all registered targets have state `Completed { exit_code: 0 }`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::HashMap;
> use std::sync::{Arc, RwLock};
>
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub enum ExecutionState {
>     Pending,
>     Running,
>     Completed { exit_code: i32 },
>     Failed { error: String },
> }
>
> #[derive(Debug, Clone)]
> pub struct TargetStatus {
>     pub binary_name: String,
>     pub state: ExecutionState,
>     pub duration_ms: u64,
> }
>
> #[derive(Debug, Clone)]
> pub struct PackageExecutionEngine {
>     package_name: String,
>     statuses: Arc<RwLock<HashMap<String, TargetStatus>>>,
> }
>
> impl PackageExecutionEngine {
>     pub fn new(package_name: impl Into<String>) -> Self {
>         Self {
>             package_name: package_name.into(),
>             statuses: Arc::new(RwLock::new(HashMap::new())),
>         }
>     }
>
>     pub fn package_name(&self) -> &str {
>         &self.package_name
>     }
>
>     pub fn register_target(&self, binary_name: impl Into<String>) -> Result<(), String> {
>         let name = binary_name.into();
>         let mut map = self
>             .statuses
>             .write()
>             .map_err(|_| "RwLock poisoned during target registration".to_string())?;
>
>         if map.contains_key(&name) {
>             return Err(format!("Binary target '{}' already registered", name));
>         }
>
>         map.insert(
>             name.clone(),
>             TargetStatus {
>                 binary_name: name,
>                 state: ExecutionState::Pending,
>                 duration_ms: 0,
>             },
>         );
>         Ok(())
>     }
>
>     pub fn start_target(&self, binary_name: &str) -> Result<(), String> {
>         let mut map = self
>             .statuses
>             .write()
>             .map_err(|_| "RwLock poisoned during start_target".to_string())?;
>
>         let status = map
>             .get_mut(binary_name)
>             .ok_or_else(|| format!("Target '{}' not found", binary_name))?;
>
>         if status.state != ExecutionState::Pending {
>             return Err(format!(
>                 "Target '{}' cannot start from state {:?}",
>                 binary_name, status.state
>             ));
>         }
>
>         status.state = ExecutionState::Running;
>         Ok(())
>     }
>
>     pub fn complete_target(
>         &self,
>         binary_name: &str,
>         exit_code: i32,
>         duration_ms: u64,
>     ) -> Result<(), String> {
>         let mut map = self
>             .statuses
>             .write()
>             .map_err(|_| "RwLock poisoned during complete_target".to_string())?;
>
>         let status = map
>             .get_mut(binary_name)
>             .ok_or_else(|| format!("Target '{}' not found", binary_name))?;
>
>         if status.state != ExecutionState::Running {
>             return Err(format!(
>                 "Target '{}' cannot complete from state {:?}",
>                 binary_name, status.state
>             ));
>         }
>
>         status.state = ExecutionState::Completed { exit_code };
>         status.duration_ms = duration_ms;
>         Ok(())
>     }
>
>     pub fn fail_target(&self, binary_name: &str, error: impl Into<String>) -> Result<(), String> {
>         let mut map = self
>             .statuses
>             .write()
>             .map_err(|_| "RwLock poisoned during fail_target".to_string())?;
>
>         let status = map
>             .get_mut(binary_name)
>             .ok_or_else(|| format!("Target '{}' not found", binary_name))?;
>
>         status.state = ExecutionState::Failed {
>             error: error.into(),
>         };
>         Ok(())
>     }
>
>     pub fn get_status(&self, binary_name: &str) -> Option<ExecutionState> {
>         let map = self.statuses.read().ok()?;
>         map.get(binary_name).map(|s| s.state.clone())
>     }
>
>     pub fn all_completed_successfully(&self) -> bool {
>         let map = match self.statuses.read() {
>             Ok(m) => m,
>             Err(_) => return false,
>         };
>
>         if map.is_empty() {
>             return false;
>         }
>
>         map.values().all(|status| {
>             matches!(status.state, ExecutionState::Completed { exit_code: 0 })
>         })
>     }
> }
>
> #[cfg(test)]
> mod tests {
>     use super::*;
>     use std::thread;
>
>     #[test]
>     fn test_single_threaded_lifecycle() {
>         let engine = PackageExecutionEngine::new("service_suite");
>         assert_eq!(engine.package_name(), "service_suite");
>
>         engine.register_target("db-server").unwrap();
>         assert_eq!(
>             engine.get_status("db-server"),
>             Some(ExecutionState::Pending)
>         );
>
>         engine.start_target("db-server").unwrap();
>         assert_eq!(
>             engine.get_status("db-server"),
>             Some(ExecutionState::Running)
>         );
>
>         engine.complete_target("db-server", 0, 150).unwrap();
>         assert_eq!(
>             engine.get_status("db-server"),
>             Some(ExecutionState::Completed { exit_code: 0 })
>         );
>
>         assert!(engine.all_completed_successfully());
>     }
>
>     #[test]
>     fn test_invalid_state_transition() {
>         let engine = PackageExecutionEngine::new("app");
>         engine.register_target("cli").unwrap();
>
>         let res = engine.complete_target("cli", 0, 10);
>         assert!(res.is_err());
>         assert!(matches!(
>             engine.get_status("cli"),
>             Some(ExecutionState::Pending)
>         ));
>     }
>
>     #[test]
>     fn test_concurrent_multi_binary_execution() {
>         let engine = PackageExecutionEngine::new("parallel_pkg");
>         let targets = vec!["bin_a", "bin_b", "bin_c"];
>
>         for t in &targets {
>             engine.register_target(*t).unwrap();
>         }
>
>         let mut handles = Vec::new();
>
>         for t in targets {
>             let engine_clone = engine.clone();
>             let name = t.to_string();
>             let handle = thread::spawn(move || {
>                 engine_clone.start_target(&name).unwrap();
>                 thread::sleep(std::time::Duration::from_millis(5));
>                 engine_clone.complete_target(&name, 0, 10).unwrap();
>             });
>             handles.push(handle);
>         }
>
>         for h in handles {
>             h.join().expect("Worker thread panicked");
>         }
>
>         assert!(engine.all_completed_successfully());
>         assert_ne!(engine.get_status("bin_a"), Some(ExecutionState::Pending));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Thread Safety & Concurrency Invariants**: `PackageExecutionEngine` wraps the status table in `Arc<RwLock<HashMap<String, TargetStatus>>>`. `Arc` provides atomic reference counting so the engine can be cloned and shared safely across threads. `RwLock` provides thread-safe interior mutability (multiple simultaneous readers or one exclusive writer).
> 2. **State Machine Validation**: State transitions are strictly verified under exclusive write locks. A target must be in `Pending` to transition to `Running`, and in `Running` to transition to `Completed`. Invalid state transitions return explicit `Err` strings without leaving the engine in an inconsistent state.
> 3. **Lock Poisoning Resilience**: Write operations handle `RwLock` poisoning explicitly with `.map_err()`, preventing panics from propagating if a worker thread panics while holding the lock.
> 4. **Edge Cases Handled**: Concurrent target registrations, illegal state transitions (e.g. completing before starting), empty target sets in `all_completed_successfully()`, and worker thread panics during concurrent execution.
> 
>

---

### Exercise 3: Package Feature Matrix Resolver and Conflict Validation Engine

**Scenario:**
Cargo packages support optional compilation features defined in `Cargo.toml` under `[features]`. A feature flag can transitively enable other sub-features or optional crate dependencies. However, attempting to build a package with mutually exclusive features (e.g. `tokio-backend` vs `async-std-backend`) or requesting unknown features must be rejected with explicit error diagnostics.

You are tasked with implementing a `FeatureGraph` engine that registers feature dependencies and mutually exclusive conflict pairs, transitively expands requested features using breadth-first traversal (BFS), and validates feature matrix consistency.

**Requirements:**
1. Define a `Feature` struct holding `name: String` and `enables: Vec<String>`.
2. Implement a custom `FeatureError` enum with variants: `UnknownFeature(String)`, `ConflictingFeatures(String, String)`, and `InvalidFeatureDefinition(String)`.
3. Implement `FeatureGraph`:
   - `new() -> Self`
   - `add_feature(&mut self, feature: Feature) -> Result<(), FeatureError>`: registers feature definition (fails if feature name is empty).
   - `add_conflict(&mut self, feat_a: impl Into<String>, feat_b: impl Into<String>)`: registers a pair of mutually exclusive features.
   - `resolve(&self, requested: &[&str]) -> Result<Vec<String>, FeatureError>`: expands all requested features transitively using BFS. Returns sorted vector of activated feature names. If any requested or sub-feature is unknown, returns `Err(FeatureError::UnknownFeature(name))`. If both sides of a conflicting pair are simultaneously activated, returns `Err(FeatureError::ConflictingFeatures(feat_a, feat_b))`.

> [!check]- Answer
>
> #### Implementation
>
> ```rust
> use std::collections::{HashMap, HashSet, VecDeque};
> use std::fmt;
> 
> #[derive(Debug, Clone, PartialEq, Eq)]
> pub struct Feature {
>     pub name: String,
>     pub enables: Vec<String>,
> }
> 
> impl Feature {
>     pub fn new(name: impl Into<String>, enables: Vec<impl Into<String>>) -> Self {
>         Self {
>             name: name.into(),
>             enables: enables.into_iter().map(|s| s.into()).collect(),
>         }
>     }
> }
> 
> #[derive(Debug, PartialEq, Eq)]
> pub enum FeatureError {
>     UnknownFeature(String),
>     ConflictingFeatures(String, String),
>     InvalidFeatureDefinition(String),
> }
> 
> impl fmt::Display for FeatureError {
>     fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
>         match self {
>             FeatureError::UnknownFeature(name) => {
>                 write!(f, "Unknown feature requested: '{}'", name)
>             }
>             FeatureError::ConflictingFeatures(a, b) => {
>                 write!(f, "Mutually exclusive features enabled: '{}' and '{}'", a, b)
>             }
>             FeatureError::InvalidFeatureDefinition(msg) => {
>                 write!(f, "Invalid feature definition: {}", msg)
>             }
>         }
>     }
> }
> 
> impl std::error::Error for FeatureError {}
> 
> #[derive(Debug, Default)]
> pub struct FeatureGraph {
>     features: HashMap<String, Feature>,
>     mutually_exclusive_pairs: Vec<(String, String)>,
> }
> 
> impl FeatureGraph {
>     pub fn new() -> Self {
>         Self {
>             features: HashMap::new(),
>             mutually_exclusive_pairs: Vec::new(),
>         }
>     }
> 
>     pub fn add_feature(&mut self, feature: Feature) -> Result<(), FeatureError> {
>         if feature.name.trim().is_empty() {
>             return Err(FeatureError::InvalidFeatureDefinition(
>                 "Feature name cannot be empty".into(),
>             ));
>         }
>         self.features.insert(feature.name.clone(), feature);
>         Ok(())
>     }
> 
>     pub fn add_conflict(&mut self, feat_a: impl Into<String>, feat_b: impl Into<String>) {
>         self.mutually_exclusive_pairs
>             .push((feat_a.into(), feat_b.into()));
>     }
> 
>     pub fn resolve(&self, requested: &[&str]) -> Result<Vec<String>, FeatureError> {
>         let mut active = HashSet::new();
>         let mut queue = VecDeque::new();
> 
>         for feat in requested {
>             if !self.features.contains_key(*feat) {
>                 return Err(FeatureError::UnknownFeature((*feat).to_string()));
>             }
>             queue.push_back((*feat).to_string());
>         }
> 
>         while let Some(current) = queue.pop_front() {
>             if active.insert(current.clone()) {
>                 if let Some(feat_def) = self.features.get(&current) {
>                     for sub in &feat_def.enables {
>                         if !self.features.contains_key(sub) {
>                             return Err(FeatureError::UnknownFeature(sub.clone()));
>                         }
>                         queue.push_back(sub.clone());
>                     }
>                 }
>             }
>         }
> 
>         for (a, b) in &self.mutually_exclusive_pairs {
>             if active.contains(a) && active.contains(b) {
>                 return Err(FeatureError::ConflictingFeatures(a.clone(), b.clone()));
>             }
>         }
> 
>         let mut resolved: Vec<String> = active.into_iter().collect();
>         resolved.sort();
>         Ok(resolved)
>     }
> }
> 
> #[cfg(test)]
> mod tests {
>     use super::*;
> 
>     #[test]
>     fn test_feature_resolution_transitive() {
>         let mut graph = FeatureGraph::new();
>         graph
>             .add_feature(Feature::new("full", vec!["serde", "tls"]))
>             .unwrap();
>         graph
>             .add_feature(Feature::new("serde", vec!["alloc"]))
>             .unwrap();
>         graph
>             .add_feature(Feature::new("tls", vec!["crypto"]))
>             .unwrap();
>         graph
>             .add_feature(Feature::new("alloc", Vec::<String>::new()))
>             .unwrap();
>         graph
>             .add_feature(Feature::new("crypto", Vec::<String>::new()))
>             .unwrap();
> 
>         let active = graph.resolve(&["full"]).unwrap();
>         let expected = vec!["alloc", "crypto", "full", "serde", "tls"];
>         assert_eq!(active, expected);
>         assert!(active.contains(&"crypto".to_string()));
>     }
>
>     #[test]
>     fn test_conflicting_features_error() {
>         let mut graph = FeatureGraph::new();
>         graph
>             .add_feature(Feature::new("tokio-backend", Vec::<String>::new()))
>             .unwrap();
>         graph
>             .add_feature(Feature::new("async-std-backend", Vec::<String>::new()))
>             .unwrap();
>         graph.add_conflict("tokio-backend", "async-std-backend");
>
>         let res = graph.resolve(&["tokio-backend", "async-std-backend"]);
>         assert!(matches!(
>             res,
>             Err(FeatureError::ConflictingFeatures(ref a, ref b))
>                 if a == "tokio-backend" && b == "async-std-backend"
>         ));
>     }
>
>     #[test]
>     fn test_unknown_feature_error() {
>         let mut graph = FeatureGraph::new();
>         graph
>             .add_feature(Feature::new("core", Vec::<String>::new()))
>             .unwrap();
>
>         let res = graph.resolve(&["nonexistent"]);
>         assert!(matches!(
>             res,
>             Err(FeatureError::UnknownFeature(ref f)) if f == "nonexistent"
>         ));
>         assert_ne!(res, Ok(vec!["core".to_string()]));
>     }
> }
> ```
>
> #### Technical Explanation
>
> 1. **Transitive Feature Resolution via BFS**: Features in Cargo package manifests form a directed acyclic or cyclic graph (where feature A enables B, B enables C). We use a `VecDeque<String>` queue for BFS traversal and a `HashSet<String>` (`active`) to track activated features. Using `HashSet::insert()` ensures cycles in feature aliases are deduplicated without infinite looping or stack overflow.
> 2. **Conflict Set Validation**: After transitive feature expansion completes, we evaluate all registered conflict pairs against the `active` set. If both `feat_a` and `feat_b` are present in `active`, resolution fails immediately with `FeatureError::ConflictingFeatures`.
> 3. **Deterministic Output Ordering**: `resolve` collects the resulting `HashSet<String>` into a `Vec<String>` and sorts it lexicographically (`resolved.sort()`), guaranteeing deterministic feature matrix outputs across different platforms.
> 4. **Edge Cases Handled**: Deeply nested transitive features, cyclic feature aliases (A enables B, B enables A), unknown requested features, unknown sub-features in `enables`, and mutual exclusion conflicts triggered transitively.
> 
>

---

## 6. Related Terms


- [Cargo](cargo.md) — The tool that manages packages
- [Crate](crate.md) — The building blocks contained within a package
- [Module](module.md) — How you organize code *inside* a single crate
- [`Cargo.toml`](../level_07/cargo_toml.md) — Cargo package manifest.
- [Workspace](../level_07/workspace.md) — Multi-package workspace.

---

## 7. Key Takeaways

- **A Package is defined by a `Cargo.toml` file.**
- **It is a container** that groups one or more crates together.
- **A package can contain at most one library crate.**
- **A package can contain multiple binary crates** (by placing them in `src/bin/`).
- **Packages are the units of distribution** that you publish to registries like crates.io.
