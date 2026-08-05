# Universal Rendering (SSR)

> **Level 1 — Core Concepts & Architecture**
> Nuxt's default rendering mode, which generates the initial HTML on the server for speed and SEO, and then "hydrates" it into a fully interactive Single Page Application in the browser.

---

## 1. Prerequisites
- [Nuxt 3 Overview](nuxt_3_overview.md) — The orchestrator of this process.
- component_lifecycle — Understanding when component setups run.
- [Search Engine Optimization (SEO)](seo.md) — The core driver for SSR.
- [Hydration](hydration.md) — The bridge mechanism between server HTML and client interactivity.
---

## 2. Term Category
- **Rendering Strategy**

---

## 3. Environment Context
- **Server & Client**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Standard Single Page Applications (SPAs) send a blank HTML file to the browser, forcing the user to wait until all JavaScript downloads and executes before they see any content. This is terrible for SEO (search engines see a blank page) and terrible for users on slow devices.

Server-Side Rendering (SSR) fixes this by generating the fully populated HTML string on a Node server and sending that to the browser. However, traditional SSR sites (like PHP or Ruby on Rails) require a full page refresh on every click. 

**Universal Rendering** (the Nuxt default) is the best of both worlds. The *first* request is Server-Side Rendered (for instant SEO and fast initial paint). But once that HTML loads, Nuxt downloads the Vue application in the background and attaches event listeners to the static HTML (a process called **Hydration**). From that moment on, the app acts as a lightning-fast SPA.

### (2) The Lifecycle
1. **The Request:** User navigates to `yourwebsite.com/about`.
2. **Server (Nitro):** Nuxt executes your Vue components, fetches data on the server, and outputs an HTML string.
3. **Browser (First Paint):** The user instantly sees the fully rendered HTML.
4. **Hydration:** Vue downloads and makes the static HTML interactive (buttons become clickable).
5. **Client Navigation:** User clicks a link to the "Contact" page. Nuxt uses client-side routing. The server is *not* contacted for HTML.

### (3) The Hydration Mismatch
Because the app runs twice—once on the server, and once on the client—the output MUST be identical. If the server renders `<p>Hello</p>` but the client JavaScript expects to render `<p>Goodbye</p>`, Vue will throw a "Hydration Mismatch" error and force a complete, slow re-render of the entire page.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Hydration Mismatches via Browser APIs
**The mistake:** Rendering content conditionally based on browser-only APIs without waiting for hydration to complete.

**Why it's wrong:** The server doesn't have a `localStorage`. If it renders "Guest" but the client renders "Logged In", the HTML strings won't match, breaking hydration.
**Golden Rule:** If a value relies on the browser, default to a safe value for the server, and update it in `onMounted`.

*Incorrect:*
```vue
<template>
  <p>{{ theme }}</p>
</template>

<script setup>
// Server throws an error, or guesses wrong.
const theme = localStorage.getItem('theme') || 'light';
</script>
```

*Fix:*
```vue
<template>
  <p>{{ theme }}</p>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const theme = ref('light'); // Safe server default

onMounted(() => {
  // Updates safely AFTER hydration on the client
  theme.value = localStorage.getItem('theme') || 'light';
});
</script>
```

---

### Mistake 2: Using Browser-Specific APIs (`document.cookie`, `navigator.userAgent`) in Component Setup

**The mistake:** Writing `const cookie = document.cookie` directly inside `<script setup>`.

**Why it's wrong:** Universal rendering executes `<script setup>` on both the Node.js server AND browser client. Referencing `document` on the server throws a `document is not defined` ReferenceError.

*Incorrect:*
```vue
<script setup>
const cookie = document.cookie; // ❌ ReferenceError: document is not defined on server!
</script>
```

*Fix:*
```vue
<script setup>
// Use Nuxt cross-platform composable:
const cookie = useCookie('session');
</script>
```

---

### Mistake 3: Disabling Universal SSR Rendering Globally for the Entire Application

**The mistake:** Setting `ssr: false` in `nuxt.config.ts` for public SEO-driven applications.

**Why it's wrong:** Setting `ssr: false` forces the entire app into a Client-Side Rendered (SPA) shell, destroying initial server HTML rendering and hurting search engine indexing.

*Incorrect:*
```vue
// nuxt.config.ts
export default defineNuxtConfig({
  ssr: false // ❌ Turns entire app into SPA, destroying SEO!
});
```

*Fix:*
```vue
// Enable SSR by default (ssr: true) or use Route Rules for hybrid rendering:
routeRules: { '/admin/**': { ssr: false } }
```


---

## 6. Practice Exercises

### Exercise 1: Understanding the execution flow

**Problem:** If you put `console.log("Component setup")` directly inside a `<script setup>` in a page component, where will that log appear on a fresh page load?

**Expected output:**
> [!check]- Answer
> ```text
> It will appear in BOTH the server terminal (Node.js) AND the browser's developer console, because the component executes twice during Universal Rendering.
> ```
> - Think about the double execution nature of Universal Rendering: first, the server generates static HTML (runs component setup), then the client hydrates it (runs setup again to hook reactivity).

---

### Exercise 2: Universal Execution Flow Matrix

**Problem:** Identify where the following execution lifecycle steps occur during initial page request under Universal Rendering:
1. `<script setup>` top-level execution
2. `onMounted()` hook execution
3. Nitro server API request

**Expected output:**
> [!check]- Answer
> ```text
> 1. Server AND Client
> 2. Client ONLY
> 3. Server ONLY
> ```
> - `<script setup>` -> Executes on Server (SSR) and re-executes on Client (Hydration).
> - `onMounted()` -> Client ONLY.
> - Nitro API -> Server ONLY.
> 
> ```text
> Server Render -> Send HTML -> Client Hydrate -> onMounted()
> ```

---

### Exercise 3: process.server / process.client Guards

**Problem:** Write an `if` condition using Nuxt process guards executing `console.log('Server Execution')` only when rendering on the server.

**Expected output:**
> [!check]- Answer
> ```typescript
> if (import.meta.server) { console.log('Server Execution'); } (or if (process.server))
> ```
> - `import.meta.server` (or `process.server`) isolates server execution.
> 
> ```typescript
> if (import.meta.server) {
>   console.log('Executing on Node.js Nitro Server');
> }
> ```


---

## 7. Related Terms
- [ClientOnly Component](../level_03/client_only_component.md) — A utility to force a component to completely skip server rendering.
- [Nitro Engine](nitro_engine.md) — The server responsible for executing the SSR phase.
- [Hydration](hydration.md) — Related concept: Hydration.
- [Nuxt 3 Overview](nuxt_3_overview.md) — Related concept: Nuxt 3 Overview.
- [Search Engine Optimization (SEO)](seo.md) — Related concept: Search Engine Optimization (SEO).
- [`useCookie` Hook](../level_04/use_cookie.md) — Related concept: `useCookie` Hook.
- [Nuxt Server Components (Islands)](../level_09/nuxt_server_components.md) — Related concept: Nuxt Server Components (Islands).
- [`.output/` Directory](../level_10/output_directory.md) — Related concept: `.output/` Directory.
- [Hybrid Rendering](../level_09/hybrid_rendering.md) — Hybrid rendering modes.
---

## 8. Key Takeaways
- Universal Rendering provides the SEO/speed of SSR and the interactivity of an SPA.
- The initial load is Server-Side Rendered. All subsequent navigation is Client-Side.
- Code in your components runs on **both** the server and the client.
- You must ensure the server HTML exactly matches the initial client HTML to avoid Hydration Mismatches.
