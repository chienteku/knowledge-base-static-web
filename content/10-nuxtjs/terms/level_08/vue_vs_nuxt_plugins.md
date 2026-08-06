# Vue Plugins vs Nuxt Plugins

> **Level 8 — Middleware & Plugins**
> The distinction between standard Vue 3 plugins (which interact with `app.use()`) and Nuxt 3 Plugins (which interact with the Nuxt App context), and how to register Vue plugins inside a Nuxt environment.

---

## 1. Prerequisites
- [`plugins/` Directory](plugins_directory.md) — The folder where both types of plugins are initialized.
- [Vue 3 Composition API Context](../level_01/composition_api_context.md) — The standard Vue application environment.

---

## 2. Term Category

**Extensibility & Modules** (Plugin Paradigm Comparison): Vue plugins hook into Vue 3 `app.use()`, whereas Nuxt plugins wrap Vue plugins with access to `useNuxtApp()`, SSR payload helpers, and helper injection.



---

## 3. Explanation

### Environment Context
- **Server & Client**

### (1) Design Motivation — "Why did we design this?"
If you read the documentation for a standard Vue 3 library (like `vue-toastification`), the installation instructions will always say:
```typescript
import Toast from "vue-toastification";
import { createApp } from "vue";
import App from "./App.vue";

const app = createApp(App);
app.use(Toast); // <--- How do I do this in Nuxt?!
app.mount("#app");
```
Because Nuxt hides `createApp()` inside its core engine, developers often get confused about how to register standard Vue plugins. The solution is to wrap the Vue Plugin inside a Nuxt Plugin.

### (2) Accessing the Vue App
Inside a Nuxt plugin (`defineNuxtPlugin`), you have access to the `nuxtApp` context. The underlying Vue application instance is exposed at `nuxtApp.vueApp`. 

To register a standard Vue plugin, you simply call `nuxtApp.vueApp.use()`.

```typescript
// plugins/toast.client.ts
import Toast, { PluginOptions } from "vue-toastification";
import "vue-toastification/dist/index.css";

export default defineNuxtPlugin((nuxtApp) => {
  const options: PluginOptions = {
    timeout: 3000
  };

  // Registering the standard Vue plugin!
  nuxtApp.vueApp.use(Toast, options);
});
```

### (3) Registering Global Vue Directives
You can use this exact same pattern to register global Vue Directives (`v-focus`) or global Vue Components that aren't auto-imported.

```typescript
// plugins/directives.ts
export default defineNuxtPlugin((nuxtApp) => {
  // Creating a custom v-focus directive
  nuxtApp.vueApp.directive('focus', {
    mounted(el) {
      el.focus()
    }
  })
});
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to return `app.use()`
**The mistake:** Returning the result of `nuxtApp.vueApp.use()` from the Nuxt plugin.

**Why it's wrong:** `defineNuxtPlugin` expects you to either return nothing (`void`) or return a `{ provide: {} }` object for Nuxt injections. If you return the Vue app instance, Nuxt will complain about an invalid plugin return type.
**Golden Rule:** Just call `nuxtApp.vueApp.use()` directly. Do not `return` it.

*Incorrect:*
```typescript
export default defineNuxtPlugin((nuxtApp) => {
  return nuxtApp.vueApp.use(MyPlugin); // Error!
});
```

*Fix:*
```typescript
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(MyPlugin); // Correct!
});
```

---

### Mistake 2: Registering Vanilla Vue Plugins with `app.use(Plugin)` inside Vue Components

**The mistake:** Writing `const app = createApp(); app.use(MyPlugin)` inside `<script setup>`.

**Why it's wrong:** Nuxt 3 manages the Vue application instance automatically. Register Vue plugins inside Nuxt plugins using `nuxtApp.vueApp.use(Plugin)`.

*Incorrect:*
```vue
<script setup>
const app = createApp(); app.use(MyPlugin); // ❌ Manual createApp break Nuxt instance!
</script>
```

*Fix:*
```vue
// plugins/my-plugin.ts
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(MyPlugin);
});
```

---

### Mistake 3: Expecting Vanilla Vue Plugins to Access Nuxt Server Context (`useFetch`, Nitro)

**The mistake:** Expecting standard Vue SPA plugins to execute on the Node.js server during SSR.

**Why it's wrong:** Standard Vue plugins understand only client Vue components. Nuxt plugins (`defineNuxtPlugin`) receive `nuxtApp` providing server context, payload hydration, and Nitro hooks.

*Incorrect:*
```vue
/* Expecting standard Vue SPA plugin to access Nuxt server SSR context */
```

*Fix:*
```vue
/* Wrap Vue plugins in defineNuxtPlugin((nuxtApp) => { nuxtApp.vueApp.use(...) }) */
```


---

## 5. Practice Exercises

### Exercise 1: Wrapping Vue 3 Plugins inside Nuxt Plugins

**Scenario:**
Register a third-party Vue 3 plugin (e.g. Vue Toastification or I18n) inside a Nuxt 3 plugin using `vueApp.use()`.

**Requirements:**
1. Access `nuxtApp.vueApp.use(VuePlugin)`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // plugins/vue-component-lib.ts
> import CustomVueLib from "custom-vue-library";
> 
> export default defineNuxtPlugin((nuxtApp) => {
>   // Registers Vue 3 plugin on root Vue app instance
>   nuxtApp.vueApp.use(CustomVueLib, {
>     defaultColor: "blue"
>   });
> });
> ```
> 
> #### Technical Explanation
>
> 1. `nuxtApp.vueApp` grants access to the root Vue 3 application instance created by Nuxt.
> 2. `vueApp.use()` registers standard Vue 3 plugins, directives, and global components.
> 3. Integrates existing Vue 3 ecosystem packages into Nuxt 3 applications.
> 
---

### Exercise 2: Accessing Nuxt Composables inside Nuxt Plugins

**Scenario:**
Access `useRuntimeConfig()` and `useCookie()` inside a Nuxt plugin setup function.

**Requirements:**
1. Call `useRuntimeConfig()` inside `defineNuxtPlugin`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // plugins/api-client.ts
> export default defineNuxtPlugin((nuxtApp) => {
>   const config = useRuntimeConfig();
>   const authToken = useCookie("auth_token");
>   
>   const apiClient = {
>     baseUrl: config.public.apiBase,
>     token: authToken.value
>   };
>   
>   return {
>     provide: { apiClient }
>   };
> });
> ```
> 
> #### Technical Explanation
>
> 1. Nuxt plugins operate within the Nuxt runtime environment context.
> 2. Can freely invoke Nuxt composables (`useRuntimeConfig()`, `useCookie()`, `useRoute()`).
> 3. Superior capabilities compared to standalone Vue 3 plugins.
> 
---

### Exercise 3: Comparing Vue 3 Plugin vs Nuxt 3 Plugin Capabilities

**Scenario:**
Formulate a selection matrix comparing Vue 3 plugins vs Nuxt 3 plugins.

**Requirements:**
1. Contrast `app.use()` vs `defineNuxtPlugin` features.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Plugin Paradigm Comparison:
> - Vue 3 Plugin: Function receiving vueApp instance. No built-in SSR payload helper or Nitro integration.
> - Nuxt 3 Plugin: Function receiving nuxtApp context. Provides helper injection ($helper), SSR payload hooks, and auto-registration from plugins/ directory.
> ```
> 
> #### Technical Explanation
>
> 1. Vue plugins manage client component trees.
> 2. Nuxt plugins orchestrate isomorphic server and client initialization across the full stack.
> 3. Fundamental platform architectural distinction.
> 
---


## 6. Related Terms
- [`plugins/` Directory](plugins_directory.md) — The folder where these files must be placed.
- [`useNuxtApp` Context](../level_04/use_nuxt_app.md) — The parent object that holds `.vueApp`.

---

## 7. Key Takeaways
- Standard Vue documentation assumes you have a `main.ts` file with `createApp()`.
- In Nuxt, you access `createApp()` via `nuxtApp.vueApp` inside a Nuxt plugin.
- Use `nuxtApp.vueApp.use()` to install standard Vue plugins.
- Use `nuxtApp.vueApp.directive()` to install global Vue directives.
