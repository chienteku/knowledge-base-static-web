# `plugins/` Directory

> **Level 8 — Middleware & Plugins**
> A directory used to register Vue plugins, add global third-party libraries, or inject helper functions into the Nuxt app context before the root Vue application is mounted.

---

## 1. Prerequisites
- [`useNuxtApp` Context](../level_04/use_nuxt_app.md) — The composable used to access the helpers injected by these plugins.
- [Vue 3 Composition API Context](../level_01/composition_api_context.md) — The Vue context hosting plugin initialization blocks.

---

## 2. Term Category
- **Extensibility**

---

## 3. Environment Context
- **Server & Client**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In a standard Vue 3 application, `main.ts` is where you initialize the app (`createApp(App)`) and attach global libraries (`app.use(router)`, `app.use(pinia)`, `app.component('Icon', Icon)`). 

In Nuxt 3, there is no `main.ts`. Nuxt handles the app creation behind the scenes. So, if you want to install a third-party Vue library (like a tooltip system or a custom directive), where do you put it? 

The `plugins/` directory is Nuxt's answer. Nuxt automatically finds all files in this directory and runs them sequentially right before mounting the Vue application.

### (2) Core Concept
To create a plugin, export a default function wrapped in `defineNuxtPlugin`.

```typescript
// plugins/hello.ts
export default defineNuxtPlugin((nuxtApp) => {
  // You have full access to the Nuxt App Context here!
  console.log("Plugin is initializing...");
});
```

### (3) Providing Helpers (Injections)
The most powerful feature of Nuxt Plugins is the `provide` key. If your plugin returns a `provide` object, Nuxt automatically injects those functions globally, making them accessible everywhere via `useNuxtApp()`.

```typescript
// plugins/formatters.ts
export default defineNuxtPlugin(() => {
  return {
    provide: {
      // This will be injected as `$hello`
      hello: (name: string) => `Hello, ${name}!`,
      // This will be injected as `$currency`
      currency: (amount: number) => `$${amount.toFixed(2)}`
    }
  }
});
```

Inside a Vue component:
```vue
<script setup lang="ts">
const { $currency, $hello } = useNuxtApp();

console.log($hello('Nuxt')); // "Hello, Nuxt!"
</script>

<!-- They are also automatically available directly in templates! -->
<template>
  <p>{{ $currency(50) }}</p>
</template>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Relying on DOM APIs in universal plugins
**The mistake:** Initializing a third-party charting library that requires `window.document` directly inside a standard plugin file.

**Why it's wrong:** Plugins run on BOTH the Server and the Client. If the plugin runs on the Node server during SSR, `window` is undefined, and the app will crash instantly.
**Golden Rule:** If a plugin strictly requires the browser DOM, you must add the `.client.ts` suffix to the filename (e.g., `plugins/chart.client.ts`). This tells Nuxt to skip executing it on the server.

---

### Mistake 2: Using Legacy Nuxt 2 Plugin Function Signature (`export default ({ app }, inject) => {})`

**The mistake:** Writing `export default ({ app }, inject) => { inject('myPlugin', pluginFunc); }` in Nuxt 3.

**Why it's wrong:** Nuxt 3 uses `defineNuxtPlugin((nuxtApp) => {})`. The legacy Nuxt 2 `inject` callback parameter is deprecated.

*Incorrect:*
```typescript
export default ({ app }, inject) => {
  inject('api', apiFunc); // ❌ Legacy Nuxt 2 plugin syntax!
};
```

*Fix:*
```vue
export default defineNuxtPlugin((nuxtApp) => {
  return {
    provide: {
      api: apiFunc // Nuxt 3 provide object pattern
    }
  };
});
```

---

### Mistake 3: Executing Client-Only DOM Code in Un-Suffixed Server/Client Plugins

**The mistake:** Calling `window.addEventListener()` inside a generic `plugins/analytics.ts` file.

**Why it's wrong:** Plugins execute on BOTH server and client by default. Calling `window` inside generic plugins causes SSR ReferenceErrors. Use `.client.ts` suffix for browser-only plugins.

*Incorrect:*
```vue
// plugins/analytics.ts
window.analytics.init(); // ❌ ReferenceError on server SSR!
```

*Fix:*
```vue
// Rename file to plugins/analytics.client.ts to restrict execution to browser
```


---

## 6. Practice Exercises

### Exercise 1: Client-Only Plugins

**Problem:** You are installing a Google Analytics plugin that only works in the browser. You create the file `plugins/analytics.ts`. When you start the dev server, it crashes with `window is not defined`. How do you fix the filename?

**Expected output:**
```text
Rename it to `plugins/analytics.client.ts`.
```

> [!check]- Answer
> - You can append `.client` or `.server` to plugin filenames to tell Nuxt to run them in only one environment.

---

### Exercise 2: defineNuxtPlugin Helper Provide Pattern

**Problem:** Write Nuxt 3 plugin `plugins/format.ts` providing helper `$formatCurrency(val)` accessible via `useNuxtApp()`. 

**Expected output:**
```typescript
export default defineNuxtPlugin((nuxtApp) => {
  return {
    provide: {
      formatCurrency: (val: number) => `$${val.toFixed(2)}` 
    }
  };
});
```

> [!check]- Answer
> - `provide` object registers helper functions on `nuxtApp` (`$formatCurrency`).
> 
> ```typescript
> // plugins/format.ts
> export default defineNuxtPlugin((nuxtApp) => {
>   return {
>     provide: {
>       formatCurrency: (val: number) => `$${val.toFixed(2)}`
>     }
>   };
> });
> ```

---

### Exercise 3: Plugin Execution Order Prefix

**Problem:** How can you enforce a specific execution order for plugins in the `plugins/` directory?

**Expected output:**
```text
By prefixing filenames with numbers (e.g. plugins/01.setup.ts, plugins/02.auth.ts).
```

> [!check]- Answer
> - Numerical filename prefixes enforce sequential plugin execution.
> 
> ```text
> plugins/01.config.ts -> plugins/02.auth.ts
> ```


---

## 7. Related Terms
- [Vue Plugins vs Nuxt Plugins](../level_08/vue_vs_nuxt_plugins.md) — Understanding how to specifically attach standard Vue plugins.
- [`useNuxtApp` Context](../level_04/use_nuxt_app.md) — How you retrieve the provided `$helpers`.

---

## 8. Key Takeaways
- The `plugins/` directory replaces standard Vue's `main.ts` for app initialization.
- All files in `plugins/` are executed automatically before Vue mounts.
- Returning a `provide` object injects `$helpers` globally.
- Use the `.client.ts` or `.server.ts` suffix to force a plugin to run in only one environment.
