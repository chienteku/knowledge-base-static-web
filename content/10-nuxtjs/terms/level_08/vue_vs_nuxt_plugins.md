# Vue Plugins vs Nuxt Plugins

> **Level 8 — Middleware & Plugins**
> The distinction between standard Vue 3 plugins (which interact with `app.use()`) and Nuxt 3 Plugins (which interact with the Nuxt App context), and how to register Vue plugins inside a Nuxt environment.

---

## 1. Prerequisites
- [`plugins/` Directory](plugins_directory.md) — The folder where both types of plugins are initialized.
- [Vue 3 Composition API Context](../level_01/composition_api_context.md) — The standard Vue application environment.
---

## 2. Term Category
- **Extensibility**

---

## 3. Environment Context
- **Server & Client**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Registering a Global Component

**Problem:** You have a third-party Vue component `SuperSlider`. The documentation says to run `app.component('SuperSlider', SuperSlider)`. Write the Nuxt plugin code to accomplish this.

**Expected output:**
> [!check]- Answer
> ```typescript
> import SuperSlider from 'super-slider-library';
> 
> export default defineNuxtPlugin((nuxtApp) => {
>   nuxtApp.vueApp.component('SuperSlider', SuperSlider);
> });
> ```
> - Inside the plugin function, access `nuxtApp.vueApp.component()` to register the component globally.

---

### Exercise 2: Vue Plugin Registration in Nuxt 3 Pattern

**Problem:** Write Nuxt plugin `plugins/vue-toastification.client.ts` registering third-party Vue plugin `Toast` on `nuxtApp.vueApp`.

**Expected output:**
> [!check]- Answer
> ```typescript
> import Toast from 'vue-toastification';
> export default defineNuxtPlugin((nuxtApp) => {
>   nuxtApp.vueApp.use(Toast);
> });
> ```
> - `nuxtApp.vueApp.use()` registers third-party Vue plugins.
> 
> ```typescript
> // plugins/vue-toastification.client.ts
> import Toast from 'vue-toastification';
> import 'vue-toastification/dist/index.css';
> 
> export default defineNuxtPlugin((nuxtApp) => {
>   nuxtApp.vueApp.use(Toast);
> });
> ```

---

### Exercise 3: Vue vs Nuxt Plugin Distinction

**Problem:** Compare Vue Plugins vs Nuxt Plugins.

**Expected output:**
> [!check]- Answer
> ```text
> Vue Plugins: Extend Vue app instance (components, directives);
> Nuxt Plugins: Extend full Nuxt lifecycle (SSR context, Nitro hooks, universal payload, provide helpers).
> ```
> - Vue Plugins -> Extend Vue component instance.
> - Nuxt Plugins -> Extend full Nuxt universal lifecycle & Nitro server.
> 
> ```text
> Vue Plugins = Component Scope; Nuxt Plugins = Full Universal Application Scope.
> ```


---

## 7. Related Terms
- [`plugins/` Directory](plugins_directory.md) — The folder where these files must be placed.
- [`useNuxtApp` Context](../level_04/use_nuxt_app.md) — The parent object that holds `.vueApp`.
---

## 8. Key Takeaways
- Standard Vue documentation assumes you have a `main.ts` file with `createApp()`.
- In Nuxt, you access `createApp()` via `nuxtApp.vueApp` inside a Nuxt plugin.
- Use `nuxtApp.vueApp.use()` to install standard Vue plugins.
- Use `nuxtApp.vueApp.directive()` to install global Vue directives.
