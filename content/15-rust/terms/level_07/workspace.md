# Workspace

> **Level 7 — Modules, Visibility & Project Structure**
> A Cargo feature for managing multiple related packages (crates) in a single repository.

---

## 1. Prerequisites


- [`Cargo.toml`](cargo_toml.md) — The manifest file that configures the Workspace.
- [Crate](../level_01/crate.md) — The individual compilation units that the Workspace groups together.

---

## 2. Term Category

**Rust Tooling (the mega-project organizer)**: Normally, a `Cargo.toml` file manages exactly one Crate (one library or one executable binary). But what if you are building a massive application? 

You might want to split it up into a `frontend_cli` crate, a `backend_server` crate, and a `shared_types` library crate, all sitting in the same git repository. A **Workspace** allows you to group multiple crates together so they can share dependencies and compile efficiently as one massive super-project.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Imagine you have 3 separate crates in 3 separate folders. All 3 of them use the heavy `serde` serialization library. If you run `cargo build` on each of them individually, Cargo will literally download and compile the massive `serde` library 3 different times! It takes 3 times as long to compile, and it stores 3 identical copies of the compiled code on your hard drive. 

Workspaces solve this. By grouping them into a Workspace, Cargo creates a single, master `Cargo.lock` file and a single, shared `/target` folder. It compiles `serde` exactly once, and shares the compiled machine code across all 3 of your crates. This saves massive amounts of disk space and compilation time!

### (2) Reality Metaphor

Imagine a large Office Building (the **Workspace**). 

Inside the building, there are three totally different businesses: an Accounting Firm, a Law Firm, and a Graphic Design Studio (the **Crates**). They all do completely different work and have their own employees. 

However, instead of each business hiring their own separate janitor and paying their own separate water bill (compiling dependencies separately), they share the building's central Janitorial Staff and Utilities (the shared `/target` folder and `Cargo.lock`). It is vastly more efficient for everyone.

### (3) Rust Code Examples

#### Short Snippet (The Folder Structure)
Here is what a typical Workspace looks like on your hard drive. Notice there is no `src/` folder at the root! The root just holds the individual crates.

```text
my_mega_project/
├── Cargo.toml          <-- The Workspace Root Config
├── Cargo.lock          <-- The ONE shared lockfile for all crates
├── target/             <-- The ONE shared compiled output folder
│
├── frontend_cli/       <-- Member Crate #1
│   ├── Cargo.toml
│   └── src/main.rs
│
├── backend_server/     <-- Member Crate #2
│   ├── Cargo.toml
│   └── src/main.rs
│
└── shared_types/       <-- Member Crate #3
    ├── Cargo.toml
    └── src/lib.rs
```

#### Fuller Example (The Root `Cargo.toml`)
To make the folder structure above actually work, the `Cargo.toml` at the very root of the project looks different than a normal file. It uses the `[workspace]` header!

**File: `my_mega_project/Cargo.toml`**
```toml
# Notice there is no [package] section here! 
# This is a "Virtual Workspace" root. It's just a container.

[workspace]
members = [
    "frontend_cli",
    "backend_server",
    "shared_types",
]

# (Optional) You can define dependencies here to share exact versions 
# across all your crates!
[workspace.dependencies]
serde = "1.0"
tokio = "1.30"
```

To use `shared_types` inside the backend, the backend's `Cargo.toml` would look like this:

**File: `my_mega_project/backend_server/Cargo.toml`**
```toml
[package]
name = "backend_server"
version = "0.1.0"
edition = "2021"

[dependencies]
# We use a relative path to point to our sibling crate!
shared_types = { path = "../shared_types" }
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Placing a `[package]` Section inside a Virtual Workspace Root `Cargo.toml`

**The mistake:** Defining `[package] name = "root"` inside a root `Cargo.toml` that only serves as an organizational container for member crates.

**Why it is wrong:** A virtual workspace root has no `src/` directory or code. Adding `[package]` tricks Cargo into treating the root folder as a standalone package, leading to missing `src/main.rs` build errors.

*Incorrect:*
```toml
# Virtual workspace root Cargo.toml:
[package]
name = "workspace-root" # ❌ Virtual workspace roots should NOT have a [package] table!
```

*Fix:*
```toml
# Virtual workspace root Cargo.toml:
[workspace]
members = ["crate_a", "crate_b"] # Correct!
```

### Mistake 2: Specifying Conflicting `Cargo.lock` Lockfiles inside Sub-Crates

**The mistake:** Committing separate `Cargo.lock` files inside individual sub-crate directories within a workspace.

**Why it is wrong:** Workspaces share a single unified `Cargo.lock` and `/target` directory located at the workspace root. Sub-crate lockfiles are ignored by Cargo.

### Mistake 3: Forgetting `workspace = true` When Referencing Root Workspace Dependencies

**The mistake:** Re-specifying explicit version strings `serde = "1.0.197"` inside member crates instead of `serde = { workspace = true }`.

**Why it is wrong:** Bypasses central dependency version management in `[workspace.dependencies]`, allowing member crate versions to drift apart over time.

---

## 5. Practice Exercises

### Exercise 1: Declare the Workspace

**Problem:** You are building a multiplayer game. You have created a root folder with a `Cargo.toml` file. Inside the root folder, you have created two crates (folders) named `game_client` and `game_server`. 

Write the exact TOML code that must go in the root `Cargo.toml` to link these two crates into a Workspace.

> [!check]- Answer
> ```toml
> [workspace]
> members = [
>     "game_client",
>     "game_server",
> ]
> ```

---

### Exercise 2: Sharing Dependencies Across Workspace Members

**Problem:**
A workspace with 5 member crates all depend on `serde` and `tokio`. Without shared workspace dependencies, each crate's `Cargo.toml` repeats the same version strings, and bumping `serde` from `1.0.100` to `1.0.150` requires editing 5 files. The `[workspace.dependencies]` table (Cargo 1.64+) solves this.

Write the **root** `Cargo.toml` for a workspace called `my_platform` with members `api_server` and `data_worker`, that:
1. Declares `serde` (with `derive` feature) and `tokio` (with `full` feature) as shared workspace dependencies at specific versions.
2. Show the `Cargo.toml` for one member crate (`api_server`) that inherits both dependencies using `workspace = true`.
3. Answer: does `workspace = true` force `api_server` to compile ALL features listed in the root's `[workspace.dependencies]`? Or can a member crate selectively disable some?

> [!check]- Answer
> **Root `Cargo.toml`:**
> ```toml
> [workspace]
> members = ["api_server", "data_worker"]
> resolver = "2"  # Required for workspace.dependencies
>
> [workspace.dependencies]
> serde  = { version = "1.0", features = ["derive"] }
> tokio  = { version = "1.36", features = ["full"] }
> ```
>
> **`api_server/Cargo.toml` (member crate):**
> ```toml
> [package]
> name    = "api_server"
> version = "0.1.0"
> edition = "2021"
>
> [dependencies]
> # `workspace = true` inherits version, features, and other fields from root.
> serde  = { workspace = true }
> tokio  = { workspace = true }
>
> # Member can also add its own non-shared dependencies:
> axum = "0.7"
> ```
>
> **Answer to the features question:**
> A member crate that uses `{ workspace = true }` inherits the *version* from the root, but can **add** additional features using `features = ["extra"]`. It **cannot** remove or disable features declared at the workspace level — features only union, never subtract. So if the workspace declares `features = ["full"]` for tokio, a member that also specifies `{ workspace = true, features = ["rt"] }` will compile tokio with `full` + `rt` (both sets combined).
>
> **Explanation:**
> `[workspace.dependencies]` is a DRY principle applied to dependency management. It acts as a single source of truth for versions across all crates in the workspace. When you upgrade `serde`, you change one line in the root `Cargo.toml` and every member crate picks up the change automatically on the next `cargo build`.

---

### Exercise 3: Virtual Workspaces and Shared `target/`

**Problem:**
A "virtual workspace" is a workspace whose root `Cargo.toml` has a `[workspace]` section but NO `[package]` section and no `src/` folder — it's a pure container for member crates.

You are building a monorepo for a platform with three crates: `core_lib`, `api_server`, and `admin_cli`. The root should be a virtual workspace.

1. Write the root `Cargo.toml` as a virtual workspace.
2. What shared benefit do all three crates get from being in the same workspace, even if they have completely different dependencies?
3. A team member runs `cargo build` from the root. Which crates get built? What command builds only `api_server`?
4. What happens to `Cargo.lock` in a virtual workspace? Where does it live?

> [!check]- Answer
> **1. Root `Cargo.toml` (virtual workspace — no `[package]`, no `src/`):**
> ```toml
> [workspace]
> members = [
>     "core_lib",
>     "api_server",
>     "admin_cli",
> ]
> resolver = "2"
> ```
> That's the entire root `Cargo.toml`. There is no `name`, `version`, or `edition` key — those belong to each member's own `Cargo.toml`.
>
> **2. Shared benefits:**
> - **One shared `target/` directory.** If `core_lib` and `api_server` both depend on `serde`, it is compiled **once** and the `.rlib` is shared. Without a workspace, each crate in its own directory would compile `serde` independently — doubling (or tripling) build times and disk usage.
> - **One shared `Cargo.lock`.** All three crates are resolved together. You can't accidentally have `api_server` using `serde 1.0.100` while `admin_cli` uses `serde 1.0.150` — the workspace lockfile enforces one version per package across all members.
>
> **3. Building from the root:**
> `cargo build` from the root builds **all** workspace members. To build only one:
> ```bash
> cargo build -p api_server
> ```
> The `-p` (package) flag selects a specific workspace member by its `[package] name`.
>
> **4. `Cargo.lock` location:**
> `Cargo.lock` lives at the **workspace root** (next to the root `Cargo.toml`), not inside each member crate. There is exactly **one** lockfile per workspace, regardless of how many members exist. This is what enforces the single resolved dependency graph.
>
> **Explanation:**
> The virtual workspace pattern is the standard for monorepos: all crates benefit from shared compilation without any crate being forced to also be the "root" package. The root is a pure manifest — an organizational container with no code of its own.

---

## 6. Related Terms


- [`Cargo.toml`](cargo_toml.md) — The file that defines the workspace.
- [Crate](../level_01/crate.md) — The individual packages that make up the workspace.
- [Edition](edition.md) — Related concept: Edition.
- [Package](../level_01/package.md) — Related concept: Package.

---

## 7. Key Takeaways

- A Workspace is a collection of one or more crates that share the same `Cargo.lock` and `/target` directory.
- It dramatically reduces compilation time and disk usage when working on multiple related crates, because shared dependencies (like `serde`) are only compiled once.
- The root `Cargo.toml` contains a `[workspace]` section with an array of `members`.
- "Virtual workspaces" have no `src` folder or `[package]` section at the root level; they just act as a container for other crates.
