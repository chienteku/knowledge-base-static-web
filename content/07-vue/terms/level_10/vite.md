# Vite

> **Level 10 — Tooling & Ecosystem**
> A modern, ultra-fast frontend build tool created by Evan You that serves development source code via native browser ES Modules and compiles optimized production bundles using Rollup.

---

## 1. Prerequisites

- [Build Step (Compilation)](build_step.md) — The asset compilation process that Vite executes.
- [Single-File Components (SFCs)](../level_04/sfc.md) — `.vue` components compiled by `@vitejs/plugin-vue`.

---

## 2. Term Category

**Build Engine (Next-Gen Tooling)**: Vite is the official, default build tool for Vue 3 projects (replacing Webpack and Vue CLI). It consists of two primary engines: a local development server that serves unbundled source code over native browser ES Modules (ESM) using Esbuild pre-bundling, and a production build command (`vite build`) that packages assets using Rollup.

Compared to legacy bundlers like Webpack or Parcel (which must crawl and bundle entire application dependency graphs before starting a dev server), Vite starts dev servers instantly ($< 100\text{ms}$) regardless of project size, delivering instant Hot Module Replacement (HMR).

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In large Webpack-based applications (like older Vue CLI projects), starting local development servers required waiting 30–60 seconds while Webpack crawled thousands of modules and compiled them into monolithic bundle files. Modifying a single CSS file or component required waiting seconds for incremental re-bundling.

Evan You created **Vite** (the French word for "fast") to exploit modern browser capabilities: native ES Module imports (`import / export`). Instead of bundling source code ahead of time, Vite boots dev servers instantaneously and lets the browser request unbundled ES modules on demand. When a file changes, Vite updates *only that specific module* in under 50 milliseconds via Hot Module Replacement (HMR).

### (2) Reality Metaphor
Imagine a restaurant kitchen operating during dinner rush. 

A legacy Webpack server acts as a kitchen that insists on cooking every single dish on the 100-item menu before opening the front doors to customers. If a customer orders a simple salad, they wait 45 minutes while the kitchen prepares steak, lobster, and soup for dishes nobody ordered yet.

Vite acts as a modern à la carte kitchen with lightning-fast prep chefs (Esbuild). The front doors open instantly. When a customer orders a salad, the chef prepares *only that salad* immediately and serves it in seconds. Unordered dishes are never prepared.

### (3) Vue Code Examples

#### Short Snippet
```javascript
// vite.config.js (Standard Vue 3 Vite Configuration)
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    open: true
  }
})
```

#### Fuller Example
```vue
<!-- App.vue (Accessing Vite Environment Variables) -->
<script setup>
import { ref, onMounted } from 'vue'

// Accessing environment variables injected by Vite (prefixed with VITE_)
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.example.com'
const mode = import.meta.env.MODE // 'development' or 'production'
const isDev = import.meta.env.DEV

const status = ref('Connecting to Vite Dev Server...')

onMounted(() => {
  status.value = `Vite running in ${mode} mode`
  testViteEnv()
})

function testViteEnv() {
  console.assert(typeof apiBaseUrl === 'string', 'Test Failed: API URL missing')
  console.assert(typeof isDev === 'boolean', 'Test Failed: DEV flag missing')
  console.log('Vite Environment Test Passed')
}
</script>

<template>
  <div class="vite-dashboard">
    <h2>Vite Powered Vue 3 Application</h2>
    <p>Status: {{ status }}</p>
    <p>API Endpoint: {{ apiBaseUrl }}</p>
    
    <div v-if="isDev" class="dev-badge">
      ⚡ Hot Module Replacement (HMR) Active
    </div>
  </div>
</template>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using `process.env` Instead of `import.meta.env`

**The mistake:** Attempting to read environment variables using Node.js `process.env.VITE_API_URL` syntax in client code.

**Why it's wrong:** Vite exposes environment variables on `import.meta.env`, NOT `process.env`. Calling `process.env` in client code throws a runtime `ReferenceError: process is not defined`.

*Incorrect:*
```javascript
// ❌ ReferenceError in Vite client code!
const url = process.env.VITE_API_URL
```

*Fix:*
```javascript
// ✅ Correct Vite environment variable access
const url = import.meta.env.VITE_API_URL
```

---

### Mistake 2: Omitting the `VITE_` Prefix on Custom Environment Variables

**The mistake:** Defining custom keys like `SECRET_KEY=123` or `API_URL=https://api.com` inside `.env` files and expecting them to be accessible in client components.

**Why it's wrong:** To prevent accidental security leaks of private backend keys, Vite ONLY exposes environment variables prefixed with `VITE_` to client bundle code.

*Incorrect:*
```text
# .env file
API_URL=https://api.example.com # ❌ Excluded from import.meta.env!
```

*Fix:*
```text
# .env file
VITE_API_URL=https://api.example.com # ✅ Exposed to client bundle
```

---

### Mistake 3: Using Legacy CommonJS `require()` Syntax in Vite Projects

**The mistake:** Writing `const logo = require('./assets/logo.png')` inside Vue components.

**Why it's wrong:** Vite is built strictly on modern ES Modules (`import / export`). CommonJS `require()` statements are not recognized by Vite's dev server and throw runtime error exceptions.

*Incorrect:*
```javascript
// ❌ require is not defined in Vite ESM environment!
const logo = require('@/assets/logo.png')
```

*Fix:*
```javascript
// ✅ Use standard ES import statements
import logo from '@/assets/logo.png'
```

---

## 5. Practice Exercises

### Exercise 1: Industrial IoT Gateway Vite Asset Resolver

**Scenario:** An industrial IoT monitoring dashboard built with Vite dynamically loads telemetry SVG icons based on sensor types.

**Requirements:**
1. Dynamically resolve asset URLs using `new URL(path, import.meta.url)`.
2. Provide fallback default icon paths.
3. Access Vite build mode flag `import.meta.env.MODE`.
4. Include a test assertion validating resolved asset URL strings.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, onMounted } from 'vue'
> 
> function getSensorIcon(iconName) {
>   // Vite dynamic asset resolution pattern
>   return new URL(`../assets/icons/${iconName}.svg`, import.meta.url).href
> }
> 
> const iconPath = ref('')
> 
> onMounted(() => {
>   iconPath.value = getSensorIcon('temperature')
>   testViteAssetResolver()
> })
> 
> function testViteAssetResolver() {
>   console.assert(typeof iconPath.value === 'string', 'Test Failed: Icon path must be a string')
>   console.assert(iconPath.value.includes('temperature.svg'), 'Test Failed: Icon filename mismatch')
>   console.log('Vite Dynamic Asset Resolver Test Passed')
> }
> </script>
> 
> <template>
>   <div class="sensor-icon-card">
>     <h4>IoT Icon Resolver</h4>
>     <p>Resolved Path: {{ iconPath }}</p>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: `new URL(relPath, import.meta.url).href` is the official Vite pattern for resolving dynamic asset paths.
> 2. **Concept**: Vite automatically rewrites dynamic asset URLs during production `vite build` compilation.
> 3. **Concept**: Avoids legacy CommonJS `require()` dependencies.
> 4. **Concept**: Unit assertions verify string formatting of resolved asset URLs.
> 
---

### Exercise 2: Financial Terminal Vite Alias Resolver

**Scenario:** A financial trading application uses Vite path aliases (`@/components`, `@/stores`) to simplify clean module import paths across 200+ components.

**Requirements:**
1. Configure Vite `@` alias pointing to `./src`.
2. Define custom proxy rules for financial API backends in `vite.config.js`.
3. Include a test assertion checking path alias object structure.

> [!check]- Answer
>
> #### Implementation
> ```javascript
> // vite.config.test.js
> import { defineConfig } from 'vite'
> import path from 'path'
> 
> export const financialViteConfig = defineConfig({
>   resolve: {
>     alias: {
>       '@': path.resolve(__dirname, './src')
>     }
>   },
>   server: {
>     proxy: {
>       '/api/financial': {
>         target: 'https://trading.backend.com',
>         changeOrigin: true
>       }
>     }
>   }
> })
> 
> function testViteConfigAlias() {
>   console.assert(financialViteConfig.resolve.alias['@'] !== undefined, 'Test Failed: Alias @ missing')
>   console.assert(financialViteConfig.server.proxy['/api/financial'] !== undefined, 'Test Failed: Proxy missing')
>   console.log('Vite Config Test Passed')
> }
> 
> testViteConfigAlias()
> ```
>
> #### Technical Explanation
> 1. **Concept**: `resolve.alias` simplifies imports (`import Button from '@/components/Button.vue'`).
> 2. **Concept**: `server.proxy` redirects local CORS requests during development to backend services.
> 3. **Concept**: Vite transforms alias paths on-the-fly during native ESM dev server requests.
> 4. **Concept**: Assertions verify configuration object structure.
> 
---

### Exercise 3: E-Commerce Store Vite HMR State Retain Component

**Scenario:** An e-commerce checkout funnel component relies on Vite Hot Module Replacement (HMR) to preserve reactive shopping cart state in memory while editing styles and templates in VS Code.

**Requirements:**
1. Maintain reactive cart state.
2. Log HMR update events using `import.meta.hot`.
3. Provide cart modification trigger functions.
4. Include a test assertion validating cart state persistence.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, onMounted } from 'vue'
> 
> const cartCount = ref(3)
> 
> // Vite HMR API hook check
> if (import.meta.hot) {
>   import.meta.hot.accept((newModule) => {
>     console.log('Vite HMR updated component module:', newModule)
>   })
> }
> 
> function incrementCart() {
>   cartCount.value++
> }
> 
> onMounted(() => {
>   testViteHmrState()
> })
> 
> function testViteHmrState() {
>   console.assert(cartCount.value === 3, 'Test Failed: Initial cart count mismatch')
>   console.log('Vite HMR Test Passed')
> }
> </script>
> 
> <template>
>   <div class="hmr-cart-box">
>     <h4>Vite HMR Cart State: {{ cartCount }} items</h4>
>     <button @click="incrementCart">Add Item</button>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: Vite HMR swaps modified component templates instantly without full browser page reloads.
> 2. **Concept**: Component reactive state is preserved in memory during template HMR updates.
> 3. **Concept**: `import.meta.hot` provides developer APIs to customize HMR behavior.
> 4. **Concept**: Unit assertions verify initial state retention.
> 
---

## 6. Related Terms

- [Build Step (Compilation)](build_step.md) — Asset compilation orchestrated by Vite.
- [Vue CLI (Webpack)](vue_cli.md) — The legacy build tool replaced by Vite.
- [Vitest (Unit Testing)](vitest.md) — The Vite-native testing framework sharing Vite's transformer pipeline.
- [Single-File Components (SFCs)](../level_04/sfc.md) — Component SFC format compiled by Vite plugins.

---

## 7. Key Takeaways

- **Vite** is the official, default build tool for Vue 3 applications, replacing Webpack and Vue CLI.
- Serves source code via native browser ES Modules (`import / export`) for instant dev server startup ($< 100\text{ms}$).
- Uses **Rollup** under the hood for production `vite build` bundle optimization.
- Environment variables must be accessed via `import.meta.env` and prefixed with `VITE_`.
- Does NOT support legacy CommonJS `require()` syntax; use standard ES imports.
