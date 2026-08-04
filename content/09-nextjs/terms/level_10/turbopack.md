# Turbopack

> **Level 10 — Advanced Architecture**
> An incremental, Rust-based bundler designed as a high-performance successor to Webpack, providing near-instant development server startups and Hot Module Replacement (HMR) hot reloads.

---

## 1. Prerequisites
- [Next.js Overview](../level_01/nextjs.md) — The framework powered by this bundler.

---

## 2. Term Category
- **Build Tooling**

---

## 3. Environment Context
- **Build-Time (Development Server)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
During local development, developers save changes to their code and expect to see the results update instantly in the browser. This process is called **Hot Module Replacement (HMR)**.

Traditionally, Next.js used **Webpack** to bundle modules. However, Webpack is written in JavaScript and processes dependency trees linearly. In large codebases with thousands of components, starting the local dev server took minutes, and HMR hot-reloads lagged by several seconds, degrading the developer experience.

**Turbopack** was built to solve this. Written in Rust, Turbopack serves as Webpack's successor, processing dependency trees in parallel to optimize build performance.

---

### (2) Incremental Computation Engine
Turbopack's speed is powered by its **Turbo engine**, which implements incremental computation:
-   **No Duplicated Work:** When a developer modifies a file, Turbopack does not re-bundle the entire application. It only compiles the modified file and updates the specific dependency reference.
-   **Granular Caching:** Turbopack caches the results of compile functions in memory. If a function receives the same input files, it immediately returns the cached output without re-running.

---

### (3) Compiler vs. Bundler
It is important to understand the difference between **SWC** and **Turbopack**:

-   **The Compiler (SWC):** Operates on a **file-by-file** level. It converts JSX/TypeScript code into standard ECMAScript JavaScript.
-   **The Bundler (Turbopack):** Operates on the **module-graph** level. It maps all file imports (`import App from './App'`), resolves dependencies, and links files together into optimized script packages.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Confusing compile-time compiler plugins with Webpack configuration rules

**The mistake:** Expecting custom Webpack config plugins (defined in `next.config.js` via `webpack: (config) => { ... }`) to work automatically when running the Turbopack dev server:

**Why it's wrong:** Turbopack is a complete Rust rewrite. It does not run Webpack loader plugins. If your project has complex legacy Webpack loader rules, they will be ignored by Turbopack, causing the development build to crash.

**Golden Rule:** Next.js supports Turbopack natively for dev modes (`next dev --turbo`). If you rely heavily on legacy Webpack plugins, you must run standard Webpack dev mode (`next dev`) until Turbopack features reach parity.

---

### Mistake 2: Confusing Turbopack Development Flag (`--turbo`) with Production Build Command

**The mistake:** Running `next build --turbo` in production build pipelines.

**Why it's wrong:** Turbopack currently accelerates the local development server (`next dev --turbo`). Production builds use Webpack/SWC (`next build`).

*Incorrect:*
```bash
next build --turbo // ❌ Turbopack targets local dev server (next dev --turbo)!
```

*Fix:*
```bash
next dev --turbo # Fast development server powered by Turbopack
```

---

### Mistake 3: Attempting to Use Webpack-Specific Plugins in Turbopack Without Migration

**The mistake:** Adding complex custom Webpack plugins in `next.config.js` expecting them to work seamlessly in `--turbo` mode.

**Why it's wrong:** Turbopack is a Rust-based bundler built from scratch. Un-supported legacy Webpack plugins require Turbopack-compatible configuration loaders.

*Incorrect:*
```tsx
/* Expecting custom legacy Webpack C++ plugins to run in Turbopack */
```

*Fix:*
```tsx
/* Use Turbopack built-in loaders or standard Next.js config options */
```


---

## 6. Practice Exercises

### Exercise 1: Run Turbopack

**Problem:** How do you launch the Next.js development server with Turbopack enabled?

**Expected output:**
> [!check]- Answer
> ```json
> // Inside package.json scripts:
> {
>   "scripts": {
>     "dev": "next dev --turbo"
>   }
> }
> ```
> - Add the `--turbo` option flag to the standard `next dev` command.

---

### Exercise 2: Turbopack Dev Command

**Problem:** Write `package.json` script command launching Next.js dev server with Turbopack acceleration.

**Expected output:**
> [!check]- Answer
> ```json
> "dev": "next dev --turbo"
> ```
> - `--turbo` flag enables Turbopack in development.
> 
> ```json
> {
>   "scripts": {
>     "dev": "next dev --turbo"
>   }
> }
> ```

---

### Exercise 3: Turbopack Architecture Engine

**Problem:** Which programming language powers Turbopack, and which bundler is it designed to replace?

**Expected output:**
> [!check]- Answer
> ```text
> Written in Rust; designed to replace Webpack (up to 700x faster updates).
> ```
> - Rust-based incremental bundler replacing Webpack.
> 
> ```text
> Turbopack (Rust) -> Webpack Replacement
> ```


---

## 7. Related Terms
- [The Next.js Compiler (SWC)](../level_10/swc.md) — The file compilation system.
- [Node.js Runtime](../level_01/nodejs_runtime.md) — The execution host.

---

## 8. Key Takeaways
- Turbopack is an incremental Rust-based bundler designed to replace Webpack.
- It operates using incremental computations to compile only modified modules.
- Turbopack delivers near-instant starts and Hot Module Replacement (HMR) times.
- SWC compiles individual files; Turbopack bundles multiple files together.
- Enable Turbopack in Next.js development by running `next dev --turbo`.
