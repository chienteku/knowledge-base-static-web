# Hydration

> **Level 1 — Core Concepts & Architecture**
> The client-side process where Vue boots inside the browser, parses the server-rendered static HTML, builds a matching reactive Virtual DOM tree, and binds event listeners to make the page interactive.

---

## 1. Prerequisites
- [Vue 3 Composition API Context](../level_01/composition_api_context.md) — The paradigm defining the interactive components.

---

## 2. Term Category
- **Rendering Strategy**

---

## 3. Environment Context
- **Universal** (Triggered initially on the server to prepare structured markup, and executed on the client browser to inject reactivity).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In standard Client-Side Rendering (CSR), the server serves a blank HTML file and a JavaScript bundle. The user stares at a blank screen while the browser downloads, compiles, and runs the JavaScript. This results in slow initial load times and poor SEO.

In Server-Side Rendering (SSR), the server does the heavy lifting: it executes your Vue components, fetches data, builds the DOM tree, and returns a fully formed static HTML string. The user sees the page content almost instantly. 

However, raw HTML is just static text. A button like `<button @click="count++">` contains no active JavaScript bindings on the client. 

**Hydration** is the critical step that bridges this gap: it takes the static HTML and converts it into a reactive, dynamic application without forcing a full page reload.

---

### (2) The Hydration Flow
The sequence of events is as follows:

```
[Server] Runs Vue Setup ➔ Renders Static HTML ➔ Sends HTML to Browser
                                                        │
[Browser] Paints Page Instantly (User sees text/images) ◄┘
                                                        │
[Browser] Downloads JS Bundles ➔ Runs Vue Runtime ◄─────┘
                                 │
[Hydration] Vue analyzes HTML ➔ Builds matching Virtual DOM ➔ Attaches Event Listeners
```

Once hydration is complete, the page becomes fully interactive.

---

### (3) The Hydration Mismatch
Because Vue JIT-reconstructs the Virtual DOM in the browser, it expects the server-rendered HTML structure to be **exactly identical** to the client's initial DOM structure. 

If there is any difference between what the server generated and what the client initially builds, a **Hydration Mismatch** error occurs:

```text
[Vue warn]: Hydration node mismatch:
- Server rendered: <div>Guest</div>
- Client vnode: <div>Logged In</div>
```

When this happens, Vue must discard the server HTML for that node, download resources to recreate the DOM element, and re-paint the screen. This degrades page performance and causes visual tearing.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Generating non-deterministic template content

**The mistake:** Rendering values that change dynamically on every invocation directly inside the template:

```vue
<!-- BAD: Triggers hydration mismatch! -->
<template>
  <p>Your lucky number is: {{ Math.random() }}</p>
</template>
```

**Why it's wrong:** The server executes `Math.random()` during SSR and writes a value (e.g. `0.456`) into the static HTML. When the browser loads the client JS bundle, Vue executes `Math.random()` again during hydration and generates a different value (e.g. `0.123`). The client DOM output does not match the server HTML, causing a hydration failure.

**Golden Rule:** Keep templates completely deterministic during the initial mount. If you need dynamic or non-deterministic data, initialize it with a safe default value, and update it inside the client-only `onMounted` lifecycle hook.

---

### Mistake 2: Rendering Server-Hostile Browser Values (`window`, `localStorage`, `Date.now()`) in Templates

**The mistake:** Writing `<div>{{ typeof window !== 'undefined' ? window.innerWidth : 0 }}</div>` directly in Vue templates.

**Why it's wrong:** During SSR, the server renders HTML with 0, while the client browser evaluates `window.innerWidth` as 1920. Mismatched server vs client HTML structure triggers a **Hydration Mismatch Error**.

*Incorrect:*
```vue
<template>
  <div>{{ window.innerWidth }}</div> <!-- ❌ Hydration Error: Window is undefined on server! -->
</template>
```

*Fix:*
```vue
<script setup>
const width = ref(0);
onMounted(() => {
  width.value = window.innerWidth; // Set client value inside onMounted hook
});
</script>
<template>
  <div>{{ width }}</div>
</template>
```

---

### Mistake 3: Nesting Invalid HTML Tags (`<p>` containing `<div>` or `<a>` inside `<a>`)

**The mistake:** Writing `<p><div>Block Element</div></p>` in Vue templates.

**Why it's wrong:** Browsers automatically correct invalid HTML structures by closing `<p>` tags before `<div>` elements. This browser DOM auto-repair causes client DOM nodes to differ from server-rendered HTML, breaking hydration.

*Incorrect:*
```vue
<template>
  <p><div>Invalid nested block element</div></p> <!-- ❌ Hydration Error! -->
</template>
```

*Fix:*
```vue
<template>
  <div><div>Valid nested block element</div></div>
</template>
```


---

## 6. Practice Exercises

### Exercise 1: Resolve a Hydration Mismatch

**Problem:** The component below displays the current date. It crashes with a hydration mismatch because the server's local time zone is different than the client's. Fix the component to prevent this issue.

```vue
<!-- Incorrect Code: -->
<template>
  <div>Loaded at: {{ time }}</div>
</template>

<script setup>
const time = new Date().toLocaleTimeString();
</script>
```

```vue
<!-- Solution: -->
<template>
  <div>Loaded at: {{ time }}</div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const time = ref('--:--:--'); // Safe static placeholder for Server & initial Client render

onMounted(() => {
  // Safe timezone-accurate string generated ONLY in the browser
  time.value = new Date().toLocaleTimeString();
});
</script>
```

> [!check]- Answer
> - Default to a placeholder string on the server, and populate the real timezone date inside `onMounted`.

---

### Exercise 2: ClientOnly Fallback Template Pattern

**Problem:** Write Vue template wrapping browser-only component `<Chart />` in `<ClientOnly>` with a loading slot fallback.

**Expected output:**
> [!check]- Answer
> ```vue
> <template>
>   <ClientOnly>
>     <Chart />
>     <template #fallback>
>       <p>Loading Chart...</p>
>     </template>
>   </ClientOnly>
> </template>
> ```
> - `<ClientOnly>` prevents server-side rendering of browser-only components.
> 
> ```vue
> <template>
>   <ClientOnly>
>     <ChartWidget />
>     <template #fallback>
>       <div>Loading chart skeleton...</div>
>     </template>
>   </ClientOnly>
> </template>
> ```

---

### Exercise 3: onMounted Hydration Boundary

**Problem:** Why does state updated inside `onMounted()` NOT trigger hydration mismatch errors in Nuxt 3?

**Expected output:**
> [!check]- Answer
> ```text
> onMounted() executes EXCLUSIVELY in the browser AFTER hydration completes, avoiding server vs client DOM comparison conflicts.
> ```
> - `onMounted()` fires after client DOM hydration finishes.
> 
> ```text
> Server Render -> Client Hydration -> onMounted Lifecycle Hook
> ```


---

## 7. Related Terms
- [Universal Rendering (SSR)](../level_01/universal_rendering.md) — The process that produces the HTML target.
- [ClientOnly Component](../level_03/client_only_component.md) — A component wrapper designed to completely skip hydration validation by rendering only on the client.

---

## 8. Key Takeaways
- Hydration is the client-side process of injecting reactivity and event bindings into server-rendered HTML.
- It transforms static markup into a fully functional Single Page Application (SPA).
- A hydration mismatch happens when the server HTML differs from the client's initial DOM structure.
- Templates must render identically on the server and client during the initial paint.
- Use `onMounted` to execute client-only or non-deterministic logic safely.
