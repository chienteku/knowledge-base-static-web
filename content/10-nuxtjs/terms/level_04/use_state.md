# `useState` Hook

> **Level 4 — Composables & State**
> An auto-imported Nuxt composable used to create global, reactive state that is safely shared across components and perfectly synchronized between the Server and the Client during Universal Rendering.

---

## 1. Prerequisites
- [Universal Rendering (SSR)](../level_01/universal_rendering.md) — The environment that makes `useState` necessary.
- [Vue 3 Composition API Context](../level_01/composition_api_context.md) — Specifically, understanding how Vue's standard `ref()` works.
- [Hydration](../level_01/hydration.md) — The synchronization process that relies on serialized state parameters.
---

## 2. Term Category
- **State Management**

---

## 3. Environment Context
- **Server & Client**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In a standard Vue 3 SPA, if you want a reactive variable, you use `ref()`. 

However, Nuxt runs your code *twice*: once on the Node server, and once in the Browser. If you fetch data from a database and store it in a standard Vue `ref()` on the server, the server will render the HTML and send it to the client. But when the client boots up, that `ref()` is recreated from scratch and is completely empty! This causes a Hydration Mismatch, forcing the client to re-fetch the data.

`useState` was created to solve this. It is an "SSR-friendly `ref`". When you put data into `useState` on the server, Nuxt magically serializes that data, embeds it in the HTML payload, and hands it to the browser. The browser immediately picks up the state without making a second network request.

### (2) Core Concept
`useState` takes two arguments:
1. **A unique String Key:** This identifies the state across the entire app.
2. **An initialization function:** Returns the default value if the state doesn't exist yet.

```vue
<script setup lang="ts">
// 'color' is the unique key. If this is called in multiple components,
// they will all share the EXACT SAME reactive state!
const theme = useState<string>('color', () => 'dark');
</script>

<template>
  <div>
    <p>Current theme: {{ theme }}</p>
    <button @click="theme = 'light'">Change</button>
  </div>
</template>
```

### (3) Global State Management
Because `useState` is tied to the unique string key, it acts as a lightweight global state manager (like a mini-Vuex or Pinia). If Component A and Component B both call `useState('cart')`, they are referencing the exact same reactive data in memory.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Defining global `ref()` outside a composable
**The mistake:** Creating a cross-request state leak by defining a Vue `ref()` outside of a component or composable function block.

**Why it's wrong:** A Node.js server is long-running. If you define `const counter = ref(0)` at the top level of a file, that variable is shared across *every single user* who visits your website! User A clicking the button will change User B's screen.
**Golden Rule:** NEVER define a standard `ref()` outside of a `<script setup>` or a function. For global state in Nuxt, always use `useState()` because Nuxt specifically binds `useState` to the *current user's individual request*.

*Incorrect (Massive Security/State Leak):*
```typescript
import { ref } from 'vue';
// Shared by ALL users on the server!
export const globalCount = ref(0); 
```

*Fix:*
```typescript
// Safely scoped to the individual user's request
export const useGlobalCount = () => useState('count', () => 0);
```

---

### Mistake 2: Omitting the Unique Key Parameter in `useState()` Calls (Cross-Component Collisions)

**The mistake:** Writing `const state = useState(() => 0)` without providing a key string.

**Why it's wrong:** If a unique key string is omitted, Nuxt auto-generates a key based on file line numbers. Calling `useState()` with duplicate or missing keys across components causes state collisions.

*Incorrect:*
```typescript
const count = useState(() => 0); // ❌ Missing unique key parameter!
```

*Fix:*
```vue
const count = useState('counter-key', () => 0); // Explicit unique key
```

---

### Mistake 3: Using `ref()` for Shared Global State Across SSR Pages (State Leakage Trap)

**The mistake:** Declaring `const user = ref(null)` in a shared module file for global application state.

**Why it's wrong:** Plain `ref()` declared outside component scope persists in Node.js server memory across multiple user requests. `useState()` creates SSR-safe state scoped strictly to the current request.

*Incorrect:*
```typescript
// composables/state.ts
export const userState = ref(null); // ❌ Cross-request memory leak in SSR!
```

*Fix:*
```vue
// composables/state.ts
export const useUserState = () => useState('user-state', () => null);
```


---

## 6. Practice Exercises

### Exercise 1: SSR-friendly state

**Problem:** You want to store a user's chosen language code (e.g., `'en'` or `'fr'`). Write the `useState` declaration using the key `'lang'` and a default value of `'en'`.

**Expected output:**
> [!check]- Answer
> ```typescript
> const language = useState('lang', () => 'en');
> ```
> - Use the `useState` function, pass the unique string key `'lang'` as the first parameter, and a factory function returning `'en'` as the second parameter.

---

### Exercise 2: useState Global Shared Counter Composable

**Problem:** Write composable `useCounter()` using `useState('counter', () => 0)` exporting `count`, `inc()`, and `dec()`.

**Expected output:**
> [!check]- Answer
> ```typescript
> export const useCounter = () => {
>   const count = useState('counter', () => 0);
>   const inc = () => count.value++;
>   const dec = () => count.value--;
>   return { count, inc, dec };
> };
> ```
> - `useState` preserves reactive state between SSR server render and client hydration.
> 
> ```typescript
> export const useCounter = () => {
>   const count = useState<number>('global-counter', () => 0);
>   
>   const inc = () => count.value++;
>   const dec = () => count.value--;
>   
>   return { count, inc, dec };
> };
> ```

---

### Exercise 3: useState Payload Serialization

**Problem:** Does state initialized via `useState()` automatically get serialized into `window.__NUXT__` payload during SSR?

**Expected output:**
> [!check]- Answer
> ```text
> Yes. useState automatically serializes its value into the server HTML payload, hydrating client state seamlessly.
> ```
> - `useState` values are serialized into server HTML payload automatically.
> 
> ```text
> Server useState -> HTML Payload -> Client Hydrates useState Ref
> ```


---

## 7. Related Terms
- [Pinia State Management](pinia.md) — The heavy-duty alternative to `useState` for complex global state.
- [`useCookie` Hook](use_cookie.md) — Similar to `useState`, but persists the data in the browser cookies.
- [`composables/` Directory](composables_directory.md) — Related concept: `composables/` Directory.
- [Nuxt Payload (SSR State Transfer)](nuxt_payload.md) — Related concept: Nuxt Payload (SSR State Transfer).
---

## 8. Key Takeaways
- `useState` is an SSR-friendly alternative to `ref()`.
- It preserves state from the Server and hands it to the Client, preventing Hydration Mismatches and double-fetching.
- It can be used as a lightweight global state manager by sharing the unique string key.
- Never use top-level `ref()` to share state in Nuxt, as it causes cross-request state leaks.
