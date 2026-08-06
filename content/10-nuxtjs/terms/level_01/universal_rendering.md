# Universal Rendering (SSR)

> **Level 1 — Core Concepts & Architecture**
> Nuxt's default rendering mode, which generates the initial HTML on the server for speed and SEO, and then "hydrates" it into a fully interactive Single Page Application in the browser.

---

## 1. Prerequisites
- [Nuxt 3 Overview](nuxt_3_overview.md) — The orchestrator of this process.
- [Component Lifecycle](../../../07-vue/terms/level_04/component_lifecycle.md) — Understanding when component setups run.
- [Search Engine Optimization (SEO)](seo.md) — The core driver for SSR.
- [Hydration](hydration.md) — The bridge mechanism between server HTML and client interactivity.

---

## 2. Term Category

**Rendering Strategy** (Isomorphic Server & Client Rendering): Universal Rendering (SSR) executes Vue components on the server to generate HTML for initial requests, followed by client hydration for SPA interactivity.



---

## 3. Explanation

### Environment Context
- **Server & Client**

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Auditing Execution Contexts (Server vs Client)

**Scenario:**
Add conditional logging to verify code execution on the server during initial load and on the client during hydration.

**Requirements:**
1. Inspect `import.meta.server` and `import.meta.client` flags inside `<script setup>`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <script setup lang="ts">
> if (import.meta.server) {
>   console.log("Executing on Nitro Node.js Server!");
> }

if (import.meta.client) {
  console.log("Executing on Browser Client!");
}
</script>

<template>
  <div>
    <p>Universal Rendering Execution Audit</p>
  </div>
</template>
```

> #### Technical Explanation
>
> 1. In Universal Rendering, `<script setup>` executes ONCE on the server during HTML generation and ONCE on the client during hydration.
> 2. `import.meta.server` (or `process.server`) isolates server-side operations (database queries, secret keys).
> 3. `import.meta.client` (or `process.client`) isolates browser-only operations (`localStorage`, DOM events).

---

### Exercise 2: Preventing Server Execution of Browser APIs

**Scenario:**
Fix a server rendering crash caused by calling `window.localStorage.getItem()` directly in `<script setup>`.

**Requirements:**
1. Move `localStorage` access into `onMounted()` or wrap with `import.meta.client`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <script setup lang="ts">
> const token = ref<string | null>(null);

onMounted(() => {
  // Executed strictly in browser after hydration!
  token.value = localStorage.getItem("auth_token");
});
</script>

<template>
  <div>
    <p>Auth Token: {{ token ?? "None" }}</p>
  </div>
</template>
```

> #### Technical Explanation
>
> 1. Node.js server environment lacks browser globals like `window`, `document`, and `localStorage`.
> 2. Calling browser globals directly in `<script setup>` causes SSR 500 compilation errors.
> 3. Lifecycle hook `onMounted()` executes strictly in the client browser environment.

---

### Exercise 3: Switching Route Rendering Modes via Route Rules

**Scenario:**
Configure `nuxt.config.ts` `routeRules` to enforce SPA rendering for admin pages while keeping Universal Rendering for public pages.

**Requirements:**
1. Configure `routeRules` in `nuxt.config.ts`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // nuxt.config.ts
> export default defineNuxtConfig({
>   routeRules: {
>     "/": { ssr: true },             // Universal SSR Rendering (Default)
>     "/admin/**": { ssr: false }     // Client-Side SPA Rendering Only
>   }
> });
> ```

> #### Technical Explanation
>
> 1. `routeRules` enables Hybrid Rendering, applying different rendering strategies per route path.
> 2. `ssr: false` disables server HTML rendering for `/admin/**`, sending a minimal SPA wrapper to the browser.
> 3. Optimizes server CPU load while preserving SSR benefits for public SEO pages.

---




---

## 6. Related Terms
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

## 7. Key Takeaways
- Universal Rendering provides the SEO/speed of SSR and the interactivity of an SPA.
- The initial load is Server-Side Rendered. All subsequent navigation is Client-Side.
- Code in your components runs on **both** the server and the client.
- You must ensure the server HTML exactly matches the initial client HTML to avoid Hydration Mismatches.
