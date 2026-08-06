# Turbopack

> **Level 10 — Advanced Architecture**
> An incremental, Rust-based bundler designed as a high-performance successor to Webpack, providing near-instant development server startups and Hot Module Replacement (HMR) hot reloads.

---

## 1. Prerequisites
- [Next.js Overview](../level_01/nextjs.md) — The framework powered by this bundler.

---

## 2. Term Category

**Build & Deployment** (Rust-Powered Incremental Bundler): Turbopack is a Rust-based incremental bundler optimized for high-speed local development in `next dev --turbo`.



---

## 3. Explanation

### Environment Context
- **Build-Time (Development Server)**

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Running Local Development with Turbopack (`next dev --turbo`)

**Scenario:**
Execute local development server using Turbopack in Next.js.

**Requirements:**
1. Run `next dev --turbo` CLI command.

> [!check]- Answer
>
> #### Implementation
>
> ```bash
> # Start local development server with Turbopack bundler
> npx next dev --turbo
> ```
> 
> #### Technical Explanation
>
> 1. Turbopack is an incremental bundler written in Rust designed as the successor to Webpack.
> 2. `next dev --turbo` delivers up to 10x faster initial startup times and instant HMR updates.
> 3. Re-evaluates ONLY modified functions using an internal function call graph.
> 
---

### Exercise 2: Configuring Webpack Loaders in Turbopack (`experimental.turbo`)

**Scenario:**
Configure custom SVG loaders inside `next.config.js` under `experimental.turbo`.

**Requirements:**
1. Configure `experimental.turbo.rules` in `next.config.js`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> // next.config.js
> module.exports = {
>   experimental: {
>     turbo: {
>       rules: {
>         "*.svg": {
>           loaders: ["@svgr/webpack"],
>           as: "*.js"
>         }
>       }
>     }
>   }
> };
> ```
> 
> #### Technical Explanation
>
> 1. `experimental.turbo` configures custom asset loading rules for Turbopack.
> 2. Replaces traditional Webpack module rules when running `next dev --turbo`.
> 3. Maintains custom asset loader compatibility.
> 
---

### Exercise 3: Incremental Computation Architecture in Turbopack

**Scenario:**
Explain how Turbopack's Turbo Engine architecture caches function results in memory for instant HMR updates.

**Requirements:**
1. Detail function memoization graph mechanics.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Turbopack Incremental Engine Architecture:
> - Step: Turbopack models entire compilation process as a graph of pure functions.
> - Step: When a file changes, Turbopack re-executes ONLY the exact functions dependent on that file.
> - Step: Unchanged components and modules return cached memory results instantly!
> Result: HMR update times stay constant regardless of application size!
> ```
> 
> #### Technical Explanation
>
> 1. Webpack re-bundles large module trees on file changes; Turbopack re-evaluates individual functions.
> 2. Ensures HMR speed remains fast even in massive enterprise monorepos.
> 3. Core architectural innovation of Turbopack.
> 
---


## 6. Related Terms
- [The Next.js Compiler (SWC)](swc.md) — The file compilation system.
- [Node.js Runtime](../level_01/nodejs_runtime.md) — The execution host.
- [`next.config.mjs`](../level_02/next_config.md) — next.config.js.

---

## 7. Key Takeaways
- Turbopack is an incremental Rust-based bundler designed to replace Webpack.
- It operates using incremental computations to compile only modified modules.
- Turbopack delivers near-instant starts and Hot Module Replacement (HMR) times.
- SWC compiles individual files; Turbopack bundles multiple files together.
- Enable Turbopack in Next.js development by running `next dev --turbo`.
