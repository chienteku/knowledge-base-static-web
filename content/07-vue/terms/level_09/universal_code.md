# Universal Code (Isomorphic)

> **Level 9 — Server-Side Rendering (SSR) & Nuxt**
> JavaScript code that is written in such a way that it can execute flawlessly in both a Node.js Server environment and a Browser Client environment without throwing errors.

---

## 1. Prerequisites
- [Server-Side Rendering (SSR)](ssr.md) — The architecture that demands Universal Code.
- [Hydration (Vue)](hydration.md) — The process that relies on Universal Code matching perfectly.

---

## 2. Term Category
- **Programming Paradigm / Architecture Concept**

---

## 3. Environment Context
- **Universal (Node.js & Browser)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In an SSR framework like Nuxt, your Vue components are executed twice. 
First, they execute inside Node.js (to generate the HTML string). 
Second, they execute inside the Browser (to hydrate the reactivity).
This presents a massive problem: Node.js and Browsers are two totally different environments. Node.js has APIs like `fs` (File System) and `process.env`. Browsers have APIs like `window`, `document`, and `localStorage`.
If you write code that only works in one environment, the app will crash in the other. You must write **Universal Code** (historically called Isomorphic JavaScript).

### (2) The Rules of Universal Code
To ensure your code doesn't break during SSR:
1. **Never access `window` or `document` in the root of `setup()`.**
2. **Never access `localStorage` in the root of `setup()`.**
3. **If you must use Browser APIs, wrap them in `onMounted`.** (The `onMounted` hook is explicitly skipped by the Server; it *only* runs in the browser).

### (3) Guarding Environment execution
Sometimes you must write code that branches depending on where it is executing. Frameworks like Nuxt provide environment flags to help you write safe Universal Code.

```javascript
// In Nuxt or standard Vue SSR
if (import.meta.env.SSR) {
  // This code only runs on the Node.js server!
  console.log("I am running on the backend!")
} else {
  // This code only runs in the Browser!
  const width = window.innerWidth;
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Importing Browser-only libraries globally

**The mistake:** A developer wants to use a jQuery plugin or a heavy 3D rendering library like Three.js. They write `import * as THREE from 'three'` at the top of their component. The server crashes immediately.

**Why it's wrong:** The Node.js server executes all top-level `import` statements. If the `three.js` library has code inside it that immediately references `window` (which many browser libraries do), the Node server will throw a fatal `window is not defined` error.
**Golden Rule:** If a third-party library relies on Browser APIs, you cannot import it universally. You must import it dynamically *only* when the component mounts on the client!
```javascript
onMounted(async () => {
  const THREE = await import('three')
})
```

---

### Mistake 2: Executing Node.js File System APIs (`fs`) inside Code Sent to Browser Clients

**The mistake:** Calling `import fs from 'fs'` inside an isomorphic universal component file.

**Why it's wrong:** Universal (isomorphic) code runs on BOTH Node.js server and browser client. Browsers lack Node.js built-in modules (`fs`, `path`, `crypto`). Client bundle builds fail.

*Incorrect:*
```javascript
import fs from 'fs'; // ❌ Fails in browser client bundles!
```

*Fix:*
```vue
// Guard server-specific imports or isolate them in server-only API routes (/server/api)
```

---

### Mistake 3: Using Component Lifecycle Hooks Un-Supported on Node.js SSR Servers

**The mistake:** Expecting `onMounted()` or `onUpdated()` to execute on the Node.js SSR server pass.

**Why it's wrong:** On Node.js SSR servers, ONLY setup code (`setup()`) executes. DOM-dependent hooks (`onMounted`, `onUpdated`, `onUnmounted`) do NOT run on the server.

*Incorrect:*
```javascript
onMounted(() => {
  // Expecting this code to execute during Node.js server render pass ❌
});
```

*Fix:*
```vue
// Place server-side initialization in setup scope; place browser DOM logic in onMounted
```


---

## 6. Practice Exercises

### Exercise 1: Identifying non-universal code

**Problem:** Identify which lines in this component violate the rules of Universal Code and will crash the SSR Node server:
```vue
<script setup>
import { ref, onMounted } from 'vue'

const token = localStorage.getItem('auth')
const username = ref('Guest')

onMounted(() => {
  document.title = "Welcome"
})
</script>
```

**Expected output:**
> [!check]- Answer
> ```text
> The line `const token = localStorage.getItem('auth')` violates Universal Code. 
> `localStorage` is a Browser API. Because it is in the root of `setup()`, the Node.js server will try to execute it, fail to find `localStorage`, and crash.
> The `document.title` line is perfectly fine because it is safely tucked inside `onMounted`, which the server ignores.
> ```
> - Where is it safe to use Browser APIs in a Vue component?
> 
---

### Exercise 2: Checking Server vs Client Environment in Nuxt

**Problem:** Which global boolean constants in Nuxt 3 allow conditional execution for server vs client environments?

**Expected output:**
> [!check]- Answer
> ```text
> process.server (or import.meta.server) and process.client (or import.meta.client)
> ```
> - `import.meta.server` / `import.meta.client` detect execution context.
> 
> ```javascript
> if (import.meta.client) {
>   // Safe browser-only code
> }
> ```
> 
---

### Exercise 3: Universal Code Definition

**Problem:** Define Isomorphic / Universal JavaScript code.

**Expected output:**
> [!check]- Answer
> ```text
> Code written in a standard format that executes seamlessly in both Node.js server and Browser client environments.
> ```
> - Universal code runs identically on server and client.
> 
> ```text
> Single codebase executing on both Server (Node) and Client (Browser).
> ```
> 
> 
---

## 7. Related Terms
- [Server-Side Rendering (SSR)](ssr.md) — The architecture that forces you to think universally.
- [Component Lifecycle](../level_04/component_lifecycle.md) — Understanding that `onMounted` is your escape hatch for browser-only code.
- [Hydration (Vue)](hydration.md) — Related concept: Hydration (Vue).
- [Static Site Generation (SSG)](ssg.md) — Related concept: Static Site Generation (SSG).

---

## 8. Key Takeaways
- **Universal Code** (or Isomorphic JS) is code that can run without errors in both Node.js and the Browser.
- Because SSR Vue apps execute components in both environments, you must write Universal Code.
- Do not access Browser APIs (`window`, `document`, `navigator`, `localStorage`) in the root execution path of your components.
- Push all browser-specific logic into the `onMounted` lifecycle hook, which is skipped by the server.
- Use environment flags (like `import.meta.env.SSR`) if you need to specifically branch your logic between the server and the client.
