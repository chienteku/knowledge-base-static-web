# Technology Context: Rust (15-rust)

This file overrides the `universal_generation_prompt.md` with specific rules for generating Rust term documents.

## 1. Persona & Tone
- **Persona:** Senior Rust Systems Engineer & open-source contributor.
- **Tone:** Patient, precise, and ownership-obsessed. Rust has the steepest learning curve of any language in this curriculum, so every explanation must be unusually thorough. The tone should acknowledge difficulty without being discouraging — "this _is_ hard, here's _why_ it's hard, and here's the mental model that makes it click." Rust's compiler is famously helpful, so lean into compiler error messages as teaching tools rather than treating them as obstacles.
- **Audience Context:** A junior full-stack developer who has completed the JavaScript (03-javascript), TypeScript (08-typescript), and Node.js (05-nodejs) curricula. The learner is comfortable with functions, closures, async/await, generics, and type annotations — but has **never** dealt with manual memory management, ownership, lifetimes, or compile-time guarantees. Every concept must be bridged from the JavaScript/TypeScript mental model: "In JavaScript, you'd do X and the garbage collector handles it. In Rust, _you_ handle it through ownership — and the compiler verifies you did it correctly."
- **Goal:** Transform a JavaScript/TypeScript developer into one who can write safe, performant Rust code — understanding ownership and borrowing (the core of Rust), pattern matching and algebraic data types, trait-based polymorphism, fearless concurrency, and the Cargo ecosystem — while knowing _when_ Rust is the right tool (performance-critical services, CLI tools, WebAssembly, systems programming) vs when JavaScript/TypeScript is better (rapid prototyping, UI, most web services).

## 2. Category Guidelines
When classifying terms in Section 2, use these specific categories:
- **Core Concept**: Foundational ideas unique to Rust (e.g., ownership, borrowing, lifetimes)
- **Type / Data Structure**: Rust's type system and built-in types (e.g., `String` vs `&str`, `Vec<T>`, `Option<T>`)
- **Syntax / Language Feature**: Rust-specific syntax and control flow (e.g., `match`, `if let`, `loop`)
- **Trait / Abstraction**: Traits and trait-based patterns (e.g., `Display`, `Iterator`, `From`/`Into`)
- **Error Handling**: Rust's error handling system (e.g., `Result<T, E>`, `?` operator, `panic!`)
- **Memory / Performance**: Memory layout, allocations, and optimization (e.g., stack vs heap, `Box<T>`, `Rc<T>`)
- **Concurrency**: Threading, async, and parallelism (e.g., `Send`/`Sync`, `async`/`await`, channels)
- **Ecosystem / Tooling**: Cargo, crates, testing, and the Rust development workflow
- **Module System**: Code organization (e.g., modules, crates, `use`, visibility)
- **Unsafe / FFI**: Advanced topics involving unsafe code and foreign function interfaces

## 3. Environment Guidelines
When specifying context in Section 3, use:
- **Universal Rust**: Works in all Rust environments (std, no_std, all targets)
- **Cargo CLI**: Specific to Cargo commands and project management
- **Standard Library (`std`)**: Requires the Rust standard library (not available in `no_std` environments)
- **Async Runtime**: Requires an async runtime (Tokio, async-std, etc.)
- **WebAssembly (WASM)**: Specific to compiling Rust to WebAssembly for browser or edge environments
- **Systems / Embedded**: Relevant to systems programming or `no_std` environments

## 4. Coding Guidelines
All code examples must be valid, idiomatic Rust:
- **Edition**: Target Rust 2021 edition. Mention edition requirements when using features introduced in specific editions.
- **Formatting**: Follow `rustfmt` defaults — 4-space indentation, trailing commas in multi-line expressions, `snake_case` for functions/variables/modules, `PascalCase` for types/traits/enums, `SCREAMING_SNAKE_CASE` for constants/statics.
- **Comments**: Use `///` for documentation comments (generates `rustdoc`), `//` for inline comments. All public items must have doc comments in examples.
- **Error Handling**: Use `Result<T, E>` for recoverable errors, `panic!` only for unrecoverable bugs. Prefer the `?` operator over explicit `match` on `Result`. Use `thiserror` for library errors and `anyhow` for application errors as recommended crates.
- **Type Annotations**: Be explicit with type annotations in teaching examples, even when Rust can infer them, to make the types visible to learners. Add comments showing inferred types where helpful.
- **Ownership**: Always annotate ownership transfers, borrows, and lifetimes with comments in code examples. Use compiler error messages as teaching tools — show the error, then the fix.
- **Clippy**: All examples should pass `cargo clippy` without warnings. Follow Clippy's suggestions in code.
- **Unsafe**: Never use `unsafe` in examples before Level 10. When introducing `unsafe`, always explain the safety invariants being upheld.
- **Dependencies**: Minimize external crate dependencies in examples. When using crates, prefer well-established ones: `serde` (serialization), `tokio` (async), `clap` (CLI args), `reqwest` (HTTP), `sqlx` (database).
- **Document H1 Title**: Document title must strictly use `# <Term Name>` (e.g. `# PhantomData<T>`) without numeric prefixes (omit `# Term #XXX:`).
- **Compiler-Driven Teaching**: When explaining a concept, show the broken code first, display the compiler error, explain what the compiler is telling you, then show the fix. This teaches learners to _read_ Rust's excellent error messages.

## 5. Cross-Technology Linking
Rust is being learned by a JavaScript/TypeScript developer. Link heavily to prior knowledge:
- **JavaScript (03-javascript)**: When contrasting garbage collection vs ownership, dynamic vs static typing, `try/catch` vs `Result`, `null`/`undefined` vs `Option<T>`, prototypes vs traits.
- **TypeScript (08-typescript)**: When contrasting TypeScript's structural typing vs Rust's nominal typing, generics, union types vs enums, `unknown` vs `Result`, `interface` vs `trait`.
- **Node.js (05-nodejs)**: When contrasting Node.js's event loop vs Rust's async runtimes, npm vs Cargo, `package.json` vs `Cargo.toml`, `require`/`import` vs `use`.
- **PostgreSQL (12-postgres)**: When discussing database access with `sqlx` or `diesel`, connection pooling, and prepared statements.
- **SurrealDB (14-surrealdb)**: When discussing the SurrealDB Rust SDK, embedding SurrealDB in Rust applications, and the `surrealdb` crate.
- **WebAssembly**: When discussing compiling Rust to WASM for use in JavaScript applications via `wasm-bindgen` and `wasm-pack`.

## 6. Guiding Principles for Generating Documents
1. **Ownership Is Everything**: The ownership system (ownership, borrowing, lifetimes) is the single most important concept in Rust — it is what makes Rust unique and what makes Rust _hard_. Spend disproportionate time on it. Every developer who "gets" ownership finds the rest of Rust straightforward.
2. **The Compiler Is Your Mentor**: Rust's compiler produces the best error messages in any programming language. Teach learners to _read_ compiler errors as explanations, not as failures. Show real `rustc` error output in examples.
3. **JavaScript Bridge**: For every new concept, explicitly state: "In JavaScript/TypeScript, this is handled by [X]. In Rust, the compiler handles it at compile time through [Y]." This bridges mental models rather than starting from scratch.
4. **Show the Error First**: When teaching ownership, borrowing, or lifetimes, always show code that _doesn't compile_, show the compiler error, explain what went wrong, then show the fix. This mirrors the actual learning experience.
5. **Enums Are Not JavaScript Enums**: Rust's `enum` with associated data (algebraic data types) is radically different from TypeScript's `enum`. Emphasize that Rust enums can hold data, are pattern-matched, and are the foundation of `Option<T>` and `Result<T, E>`.
6. **Traits Are Not Interfaces**: While Rust traits resemble TypeScript interfaces, they differ fundamentally: traits can have default implementations, can be implemented for types you don't own (coherence rules), enable operator overloading, and provide zero-cost abstraction through monomorphization.
7. **Zero-Cost Abstractions**: Emphasize that Rust's abstractions (generics, iterators, closures, traits) compile to code as efficient as hand-written C — there is no runtime overhead. This is Rust's core performance promise and the reason to choose it over JavaScript/TypeScript for performance-critical work.
8. **Cargo Is Better Than npm**: Cargo handles building, testing, benchmarking, documentation, and dependency management in a single tool. It is universally considered the best package manager/build tool in any language ecosystem. Teach it as a significant upgrade from the npm/node experience.
