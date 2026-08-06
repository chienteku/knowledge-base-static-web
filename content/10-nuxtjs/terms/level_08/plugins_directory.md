# `plugins/` Directory

> **Level 8 — Middleware & Plugins**
> A directory used to register Vue plugins, add global third-party libraries, or inject helper functions into the Nuxt app context before the root Vue application is mounted.

---

## 1. Prerequisites
- [`useNuxtApp` Context](../level_04/use_nuxt_app.md) — The composable used to access the helpers injected by these plugins.
- [Vue 3 Composition API Context](../level_01/composition_api_context.md) — The Vue context hosting plugin initialization blocks.

---

## 2. Term Category

**Extensibility & Modules** (Runtime Application Extension Plugins): The `plugins/` directory registers runtime extensions (`defineNuxtPlugin`) that execute during Vue application setup on server and client.



---

## 3. Explanation

### Environment Context
- **Server & Client**

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Registering Universal Nuxt Plugins with `defineNuxtPlugin`

**Scenario:**
Create a Nuxt plugin `plugins/format.ts` providing a custom date formatting helper `$formatDate`.

**Requirements:**
1. Export `defineNuxtPlugin` returning `{ provide: { formatDate } }`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // plugins/format.ts
> export default defineNuxtPlugin(() => {
>   return {
>     provide: {
>       formatDate: (dateString: string) => {
>         return new Date(dateString).toLocaleDateString("en-US", {
>           year: "numeric",
>           month: "short",
>           day: "numeric"
>         });
>       }
>     }
>   };
> });
> ```

> #### Technical Explanation
>
> 1. Files in `plugins/` execute automatically during Nuxt application initialization.
> 2. Returning `{ provide: { helperName } }` injects `$helperName` globally into Vue template contexts and `useNuxtApp()`.
> 3. Standard method for registering global utility helpers.

---

### Exercise 2: Server-Only and Client-Only Plugins

**Scenario:**
Create a client-only plugin `plugins/toast.client.ts` initializing a browser toast notification library.

**Requirements:**
1. Create `plugins/toast.client.ts`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // plugins/toast.client.ts
> export default defineNuxtPlugin((nuxtApp) => {
>   // Executed strictly in browser client environment!
>   const toast = {
>     show: (msg: string) => alert(msg)
>   };
>   
>   return {
>     provide: { toast }
>   };
> });
> ```

> #### Technical Explanation
>
> 1. `.client.ts` suffix restricts plugin execution exclusively to the browser environment.
> 2. `.server.ts` suffix restricts plugin execution exclusively to Node.js server SSR setup.
> 3. Prevents executing browser-dependent libraries during server rendering.

---

### Exercise 3: Controlling Plugin Execution Order

**Scenario:**
Configure plugin execution ordering using numeric file prefixes (`01.auth.ts`, `02.router.ts`).

**Requirements:**
1. Use numeric prefixes in `plugins/`.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Plugin Registration Directory:
> - plugins/01.config.ts  -> Executes First
> - plugins/02.auth.ts    -> Executes Second (can consume $config)
> - plugins/03.theme.ts   -> Executes Third
> ```

> #### Technical Explanation
>
> 1. Nuxt registers plugins in alphabetical/numeric order by default.
> 2. Prepending numbers (`01.`, `02.`) guarantees dependent plugins execute in strict sequential order.
> 3. Essential for plugins relying on previously initialized global helpers.

---




---

## 6. Related Terms
- [Vue Plugins vs Nuxt Plugins](vue_vs_nuxt_plugins.md) — Understanding how to specifically attach standard Vue plugins.
- [`useNuxtApp` Context](../level_04/use_nuxt_app.md) — How you retrieve the provided `$helpers`.
- [Nuxt Modules System](../level_09/nuxt_modules.md) — Related concept: Nuxt Modules System.

---

## 7. Key Takeaways
- The `plugins/` directory replaces standard Vue's `main.ts` for app initialization.
- All files in `plugins/` are executed automatically before Vue mounts.
- Returning a `provide` object injects `$helpers` globally.
- Use the `.client.ts` or `.server.ts` suffix to force a plugin to run in only one environment.
