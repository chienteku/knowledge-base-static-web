# Nuxt 3 Overview

> **Level 1 — Core Concepts & Architecture**
> The modern, full-stack framework built on top of Vue 3, designed to make web development intuitive and powerful by providing opinionated defaults like server-side rendering and auto-imports.

---

## 1. Prerequisites
- [Node.js (Runtime Environment)](../../../05-nodejs/terms/level_01/nodejs.md) — The server runtime hosting the application.
- [Vue 3 Composition API Context](composition_api_context.md) — The core UI framework.

---

## 2. Term Category
- **Framework Overview**

---

## 3. Environment Context
- **Server & Client**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Vue is a fantastic library for building interactive user interfaces, but it is "just a view layer." If you want to build a full production application with Vue, you have to manually configure a router (Vue Router), a state manager (Pinia), a build tool (Vite), and figure out how to do Server-Side Rendering (SSR) for SEO. 

Nuxt 3 solves this by pre-packaging the entire Vue ecosystem into a highly opinionated, zero-configuration framework. It handles the routing automatically based on your folders, configures Vite, and provides a powerful backend engine (Nitro) so you don't even need a separate Node.js backend.

### (2) Core Concept
Nuxt 3 acts as the "orchestrator." When you run a Nuxt 3 app, it boots up a Node.js server powered by Nitro. This server intercepts incoming requests, renders your Vue components into HTML strings, sends them to the browser, and then "hydrates" the page so Vue can take over on the client side.

Nuxt 3 embraces **Convention over Configuration**. If you put a Vue component in the `pages/` directory, Nuxt automatically creates a route for it. If you put a component in `components/`, you can use it anywhere without importing it.

### (3) The Nuxt 3 Stack
Nuxt 3 is composed of several underlying technologies:
- **Vue 3:** The core UI framework (using the Composition API).
- **Vite:** The lightning-fast bundler and dev server.
- **Nitro:** The server engine that handles SSR and API routes.
- **ofetch:** The modern data-fetching library replacing Axios.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Treating Nuxt 3 like a Single Page App (SPA) by default
**The mistake:** Writing Vue code that heavily depends on the browser's `window` or `document` objects right inside the component body.

**Why it's wrong:** Nuxt runs your components on the *server* first. The server (Node.js) does not have a `window` or `document`. Accessing them immediately will cause your app to crash with `window is not defined`.
**Golden Rule:** Always wrap browser-specific code inside the `onMounted` lifecycle hook, which only runs on the client.

*Incorrect:*
```vue
<script setup lang="ts">
// Crashes the server!
const screenWidth = window.innerWidth;
</script>
```

*Fix:*
```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';

const screenWidth = ref(0);

onMounted(() => {
  // Safe! This only runs in the browser.
  screenWidth.value = window.innerWidth;
});
</script>
```

---

### Mistake 2: Using Nuxt 2 Options API Bridge Syntax in Nuxt 3 Projects

**The mistake:** Writing `export default { asyncData() {} }` in Nuxt 3 page components.

**Why it's wrong:** `asyncData()` and `fetch()` page hooks are deprecated in Nuxt 3. Use Vue 3 `<script setup>` with `useAsyncData()` or `useFetch()`. 

*Incorrect:*
```vue
<script>
export default {
  async asyncData({ $axios }) { ... } // ❌ Deprecated Nuxt 2 page hook!
}
</script>
```

*Fix:*
```vue
<script setup>
// Nuxt 3 composables:
const { data } = await useFetch('/api/data');
</script>
```

---

### Mistake 3: Creating `nuxt.config.js` Instead of `nuxt.config.ts` with `defineNuxtConfig`

**The mistake:** Exporting plain untyped JavaScript objects from `nuxt.config.js`.

**Why it's wrong:** Nuxt 3 is built TypeScript-first. Using `nuxt.config.ts` with `defineNuxtConfig({})` provides auto-completion, type checking, and schema validation.

*Incorrect:*
```vue
// nuxt.config.js
module.exports = { ... }; // ❌ Legacy untyped JS config!
```

*Fix:*
```vue
// nuxt.config.ts
export default defineNuxtConfig({
  // Strongly typed Nuxt 3 configuration
});
```


---

## 6. Practice Exercises

### Exercise 1: Identifying the Nuxt Stack
**Problem:** Which underlying technology in Nuxt 3 is responsible for serving API endpoints and performing Server-Side Rendering?

**Expected output:**
> [!check]- Answer
> ```text
> Nitro
> ```
> - It's not Vite (that's the bundler).
> - It's the engine built specifically for Nuxt 3.

---

### Exercise 2: Nuxt 3 Stack Technology Matrix

**Problem:** List the 4 core technology pillars that form the foundation of Nuxt 3.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Vue 3 (Composition API & Script Setup)
> 2. Nitro Engine (Server runtime powered by H3 & Unimport)
> 3. Vite (Lightning fast HMR build tool)
> 4. Vue Router (File-based routing)
> ```
> - Vue 3 -> UI Framework
> - Nitro Engine -> Server Runtime
> - Vite -> Development Bundler
> - Vue Router -> Routing Engine
> 
> ```text
> Vue 3 + Nitro + Vite + Vue Router = Nuxt 3
> ```

---

### Exercise 3: defineNuxtConfig Helper Setup

**Problem:** Write minimal `nuxt.config.ts` file enabling TypeScript strict mode.

**Expected output:**
> [!check]- Answer
> ```typescript
> export default defineNuxtConfig({ typescript: { strict: true } });
> ```
> - `defineNuxtConfig` provides type hints for project settings.
> 
> ```typescript
> export default defineNuxtConfig({
>   typescript: {
>     strict: true
>   }
> });
> ```


---

## 7. Related Terms
- [Universal Rendering (SSR)](universal_rendering.md) — The process Nuxt uses to render Vue on the server.
- [Nitro Engine](nitro_engine.md) — The backend engine powering Nuxt.
- [Vue 3 Composition API Context](composition_api_context.md) — The core UI framework.
- [Auto-imports](auto_imports.md) — Auto-import system.

---

## 8. Key Takeaways
- Nuxt 3 is a full-stack framework built around Vue 3.
- It provides "Convention over Configuration" (e.g., file-based routing, auto-imports).
- It runs on both the server (Node.js) and the client (Browser).
- You must be careful not to use browser-only APIs (`window`) during server rendering.
