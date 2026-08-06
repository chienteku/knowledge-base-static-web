# Vite

> **Level 10 — Tooling & Build Step**
> A lightning-fast, modern build tool created by Evan You (the creator of Vue). It is the official, default build tool for all new Vue 3 projects, replacing Webpack.

---

## 1. Prerequisites
- [Build Step (Compilation)](build_step.md) — Vite is the tool that executes the Build Step.

---

## 2. Term Category
- **Tooling / Build Engine**

---

## 3. Environment Context
- **Development & Build-Time**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
For years, the JavaScript industry used **Webpack** as the standard build tool. Webpack is incredibly powerful, but it has a fatal flaw: during development, it has to crawl and rebuild your *entire* application before the local server can start. If you have a massive enterprise app with 2,000 modules, starting the local dev server could take 30+ seconds.
Evan You created **Vite** (the French word for "Fast") to solve this. Vite exploits modern browser features (Native ES Modules) to instantly start the dev server, regardless of how large the application is.

### (2) The Dev Server (Lightning Fast HMR)
When you run `npm run dev` in a Vite project, the server starts in milliseconds. 
When you change a file and hit Save, Vite uses **Hot Module Replacement (HMR)** to instantly inject *only that specific file* into the browser. You don't lose your UI state, and the browser updates in less than 50 milliseconds.

### (3) The Production Build (Rollup)
While Vite's Dev Server uses Native ES Modules for speed, serving thousands of tiny unbundled files to users in Production would be slow due to network latency.
When you run `npm run build`, Vite switches engines. It uses a mature bundler called **Rollup** to smash all your files together into highly optimized chunks for production deployment.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Expecting `require()` to work

**The mistake:** A developer migrates an old Vue 2 (Webpack) project to Vite. They try to load an image using `<img :src="require('@/assets/logo.png')" />`. The app instantly breaks with `require is not defined`.

**Why it's wrong:** `require()` is a CommonJS module syntax that Webpack heavily relied on to resolve assets. Vite is built entirely on modern ES Modules (ESM). It does not understand `require()`.
**Golden Rule:** In Vite, you must use standard ES imports for assets: `import logo from '@/assets/logo.png'`, or use the special `new URL(..., import.meta.url)` syntax for dynamic asset resolution.

---

### Mistake 2: Using `process.env` in Client Code Instead of `import.meta.env` in Vite

**The mistake:** Attempting to read `process.env.VITE_API_URL` in a Vite application.

**Why it's wrong:** Vite exposes environment variables on `import.meta.env`, NOT `process.env`. Calling `process.env` in client code throws a ReferenceError.

*Incorrect:*
```javascript
const url = process.env.VITE_API_URL; // ❌ ReferenceError in Vite!
```

*Fix:*
```javascript
const url = import.meta.env.VITE_API_URL; // Use import.meta.env in Vite
```

---

### Mistake 3: Forgetting the `VITE_` Prefix on Custom Environment Variables in `.env` Files

**The mistake:** Naming custom API URL variable `API_URL=https://api.com` in `.env`.

**Why it's wrong:** Vite exposes ONLY environment variables prefixed with `VITE_` to client bundle code to prevent accidental leaking of secret server keys. Use `VITE_API_URL`.

*Incorrect:*
```text
# .env file
SECRET_KEY=123
API_URL=https://api.com # ❌ Not exposed to client bundle!
```

*Fix:*
```text
# .env file
VITE_API_URL=https://api.com # Prefixed variables are exposed to import.meta.env
```


---

## 6. Practice Exercises

### Exercise 1: create-vue vs Vue CLI

**Problem:** You are starting a new Vue project. Should you type `vue create my-project` (Vue CLI) or `npm create vue@latest` (create-vue)?

**Expected output:**
> [!check]- Answer
> ```text
> You MUST use `npm create vue@latest`!
> `vue create` triggers the old Vue CLI, which uses Webpack. The Vue CLI is officially deprecated and in maintenance mode. 
> `npm create vue@latest` scaffolds a modern Vue project powered by Vite.
> ```
> - Which tool is officially deprecated?
> 
---

### Exercise 2: vite.config.js Vue Plugin Configuration

**Problem:** Write minimal `vite.config.js` file importing `@vitejs/plugin-vue` and configuring `plugins: [vue()]`.

**Expected output:**
> [!check]- Answer
> ```javascript
> import { defineConfig } from 'vite'; import vue from '@vitejs/plugin-vue'; export default defineConfig({ plugins: [vue()] });
> ```
> - `@vitejs/plugin-vue` compiles Vue SFC components in Vite.
> 
> ```javascript
> import { defineConfig } from 'vite';
> import vue from '@vitejs/plugin-vue';
> 
> export default defineConfig({
>   plugins: [vue()]
> });
> ```
> 
---

### Exercise 3: Vite Native ESM Dev Server Speed

**Problem:** Why does Vite development server start instantaneously compared to legacy Webpack dev servers?

**Expected output:**
> [!check]- Answer
> ```text
> Vite serves source code via native browser ES Modules (ESM) without bundling upfront during development.
> ```
> - Serves un-bundled native ES Modules to modern browsers.
> 
> ```text
> Instant dev server startup leveraging native ES Modules.
> ```
> 
> 
---

## 7. Related Terms
- [Build Step (Compilation)](build_step.md) — What Vite accomplishes.
- [Vue CLI (Webpack)](vue_cli.md) — The deprecated Webpack-based tool Vite replaces.
- [Single-File Components (SFCs)](../level_04/sfc.md) — Related concept: Single-File Components (SFCs).
- [Vitest (Unit Testing)](vitest.md) — Related concept: Vitest (Unit Testing).
- [Vue Test Utils](vue_test_utils.md) — Related concept: Vue Test Utils.

---

## 8. Key Takeaways
- **Vite** is the modern, official build tool for the Vue ecosystem.
- It provides near-instant dev server startup and lightning-fast Hot Module Replacement (HMR) by utilizing Native Browser ES Modules.
- Under the hood, it uses **Rollup** for the production `npm run build` step.
- It completely deprecates and replaces the older Webpack-based Vue CLI.
- It only supports modern ES Modules; older CommonJS syntaxes like `require()` will not work.
