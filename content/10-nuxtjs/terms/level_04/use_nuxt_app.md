# `useNuxtApp` Context

> **Level 4 — Composables & State**
> An auto-imported composable that gives you access to the shared, global context of your Nuxt application. It is primarily used to access injected plugins or specific Nuxt lifecycle hooks.

---

## 1. Prerequisites
- [Auto-imports](../level_01/auto_imports.md) — How this composable is accessed.
- [Vue 3 Composition API Context](../level_01/composition_api_context.md) — Nuxt runtime context and composables overview.

---

## 2. Term Category
- **Application Context**

---

## 3. Environment Context
- **Server & Client**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In a global Node.js server environment, many users are hitting your application at the exact same time. If Nuxt stored global variables (like the current Vue router instance, or a third-party analytics library) on a global JavaScript `window` or `globalThis` object, User A's data would bleed into User B's request.

To prevent this cross-request leakage, Nuxt creates a unique, isolated "Context" object for every single incoming request. `useNuxtApp()` is the gateway to access this secure, isolated context anywhere in your code.

### (2) Accessing Provided Plugins
The most common use case for `useNuxtApp()` is accessing utilities or third-party libraries that were injected into the application via a Plugin. 

By convention, injected plugins are prefixed with a dollar sign (`$`).

```vue
<script setup lang="ts">
// Retrieve the app context
const nuxtApp = useNuxtApp();

// Access a hypothetical third-party toast notification plugin
function notify() {
  nuxtApp.$toast.success('Profile updated!');
}

// Access a hypothetical analytics plugin
function track() {
  nuxtApp.$analytics.trackEvent('button_click');
}
</script>
```

### (3) Accessing the Vue App
If you need to access the underlying Vue application instance directly (for example, to manually register a Vue directive or a global Vue plugin), you can access it via `nuxtApp.vueApp`.

```typescript
const nuxtApp = useNuxtApp();
// nuxtApp.vueApp.directive('my-directive', ...)
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to use `useNuxtApp()` outside of the setup context
**The mistake:** Calling `useNuxtApp()` inside an asynchronous callback (like `setTimeout` or after an `await` fetch call) in a place where Nuxt has lost track of the current Vue component.

**Why it's wrong:** Nuxt relies on Vue's strict synchronous execution context to know *which* user request is currently running. If you break that context (e.g., inside a delayed `setTimeout`), Nuxt throws the dreaded "Nuxt instance is unavailable" error.
**Golden Rule:** Always call `useNuxtApp()` synchronously at the very top of your `<script setup>` or composable function, and store it in a variable if you need to use it later inside a callback.

*Incorrect:*
```typescript
setTimeout(() => {
  // Throws an error! Context is lost.
  const nuxtApp = useNuxtApp(); 
  nuxtApp.$toast('Done');
}, 1000);
```

*Fix:*
```typescript
// Safely grab the context immediately
const nuxtApp = useNuxtApp(); 

setTimeout(() => {
  // Uses the saved reference
  nuxtApp.$toast('Done');
}, 1000);
```

---

### Mistake 2: Destructuring Provided Helper Plugins from `useNuxtApp()` Outside Synchronous Scope

**The mistake:** Calling `const { $myPlugin } = useNuxtApp()` inside an asynchronous callback.

**Why it's wrong:** `useNuxtApp()` accesses internal Nuxt instance context. Calling it inside detached async callbacks loses context and throws `Nuxt instance unavailable`.

*Incorrect:*
```typescript
setTimeout(() => {
  const { $api } = useNuxtApp(); // ❌ Context lost inside async timeout!
}, 500);
```

*Fix:*
```vue
// Capture instance synchronously at top level of script setup:
const { $api } = useNuxtApp();
setTimeout(() => {
  $api.fetchData(); // Use pre-captured plugin reference
}, 500);
```

---

### Mistake 3: Attaching Global Properties to `window` Instead of `nuxtApp.provide()`

**The mistake:** Writing `window.myHelper = helperFunc` inside a Nuxt plugin.

**Why it's wrong:** Attaching helpers to `window` breaks server-side rendering (SSR). Use `nuxtApp.provide('myHelper', helperFunc)` to make helpers available across both server and client.

*Incorrect:*
```vue
// plugins/helper.ts
window.myHelper = () => {}; // ❌ ReferenceError: window is not defined on server!
```

*Fix:*
```vue
// plugins/helper.ts
export default defineNuxtPlugin((nuxtApp) => {
  return {
    provide: {
      myHelper: () => 'Universal Helper'
    }
  };
});
```


---

## 6. Practice Exercises

### Exercise 1: Accessing an Injected Formatter

**Problem:** A teammate wrote a Nuxt plugin that provides a global currency formatter accessible at `$formatCurrency`. How do you access and use this formatter to format the number `500` inside a component?

**Expected output:**
> [!check]- Answer
> ```typescript
> const { $formatCurrency } = useNuxtApp();
> const price = $formatCurrency(500);
> ```
> - Call `useNuxtApp()` and destructure the `$formatCurrency` variable from the returned object.

---

### Exercise 2: useNuxtApp Hook Event Registration

**Problem:** Write Vue component using `useNuxtApp().hook('page:finish', callback)` executing function when page navigation finishes.

**Expected output:**
> [!check]- Answer
> ```vue
> <script setup>
> const nuxtApp = useNuxtApp();
> nuxtApp.hook('page:finish', () => {
>   console.log('Page transition complete');
> });
> </script>
> ```
> - `nuxtApp.hook()` listens to internal Nuxt lifecycle events.
> 
> ```vue
> <script setup>
> const nuxtApp = useNuxtApp();
> 
> nuxtApp.hook('page:finish', () => {
>   console.log('Page navigation and rendering finished!');
> });
> </script>
> ```

---

### Exercise 3: useNuxtApp Provided Properties

**Problem:** List 3 built-in properties attached to the `useNuxtApp()` instance object.

**Expected output:**
> [!check]- Answer
> ```text
> 1. $fetch (Universal fetch helper)
> 2. payload (Serialized Nuxt payload)
> 3. ssrContext (Node.js server request context)
> ```
> - `$fetch` -> Universal fetch utility
> - `payload` -> Serialized SSR state payload
> - `ssrContext` -> Nitro server request context
> 
> ```typescript
> const { $fetch, payload, ssrContext } = useNuxtApp();
> ```


---

## 7. Related Terms
- [`plugins/` Directory](../level_08/plugins_directory.md) — Where these `$variables` are actually created and injected into the Nuxt app.
- [Vue Plugins vs Nuxt Plugins](../level_08/vue_vs_nuxt_plugins.md) — Related concept: Vue Plugins vs Nuxt Plugins.

---

## 8. Key Takeaways
- `useNuxtApp()` provides access to the isolated context of the current application instance.
- It prevents cross-request data leaks during Server-Side Rendering.
- It is the primary way to access globally injected plugins (e.g., `$toast`, `$analytics`).
- It must be called synchronously at the top level of your component or composable.
