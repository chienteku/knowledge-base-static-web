# Auto-imports

> **Level 1 — Core Concepts & Architecture**
> Nuxt's intelligent build-time feature that automatically imports Vue APIs, Nuxt composables, and your own components without requiring manual `import` statements.

---

## 1. Prerequisites
- [Vue 3 Composition API Context](../level_01/composition_api_context.md) — The APIs that are heavily auto-imported.
- [JavaScript Modules (`import`/`export`)](../../../03-javascript/terms/level_08/modules.md) — The manual ES module imports system being bypassed.

---

## 2. Term Category
- **Build Optimization**

---

## 3. Environment Context
- **Build-Time**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In a typical Vue/React project, every single file begins with a massive block of boilerplate imports. You have to import `ref`, `computed`, `onMounted`, routing hooks, data fetching hooks, and every single UI component you use in the template.

Nuxt 3 eliminates this developer friction entirely. By analyzing your code at build time, Nuxt automatically provides the necessary imports behind the scenes. This keeps your files incredibly clean and focused purely on logic.

### (2) How it Works
When you use a Vue feature like `ref()` or a Nuxt feature like `useFetch()`, you simply use it. You do not import it.

```vue
<script setup lang="ts">
// No imports needed! Nuxt injects `ref` and `useFetch` automatically.
const count = ref(0);
const { data } = await useFetch('/api/users');
</script>

<template>
  <!-- No imports needed! Nuxt automatically finds TheHeader in the components/ directory. -->
  <TheHeader />
  <p>Count: {{ count }}</p>
</template>
```

### (3) What is Auto-imported?
- **Vue APIs:** `ref`, `reactive`, `computed`, `watch`, lifecycle hooks (`onMounted`).
- **Nuxt Composables:** `useHead`, `useFetch`, `useState`, `useRouter`.
- **Your Components:** Anything inside the `components/` directory.
- **Your Composables:** Any exported function inside the `composables/` directory.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Manually importing Vue/Nuxt APIs
**The mistake:** Writing manual imports out of habit.

**Why it's wrong:** It clutters your code and defeats the purpose of the framework's DX (Developer Experience). Furthermore, manually importing certain internal Nuxt context functions can occasionally break SSR state.
**Golden Rule:** Trust the auto-imports. Delete your manual `import { ref } from 'vue';` lines.

*Incorrect:*
```vue
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useFetch } from '#app';
</script>
```

*Fix:*
```vue
<script setup lang="ts">
// Just start coding.
</script>
```

---

### Mistake 2: Manually Importing Built-In Nuxt Composables (`ref`, `useFetch`, `useRoute`)

**The mistake:** Adding `import { ref } from 'vue'` or `import { useFetch } from '#app'` at top of `<script setup>`.

**Why it's wrong:** Nuxt 3 automatically imports Vue APIs, Nuxt composables (`useFetch`, `useRoute`, `useState`), and helper utilities. Manual imports duplicate references and bloat script setups.

*Incorrect:*
```vue
<script setup>
import { ref, computed } from 'vue'; // ❌ Unnecessary manual import!
import { useFetch } from '#app';
</script>
```

*Fix:*
```vue
<script setup>
// Auto-imported by Nuxt 3 automatically:
const count = ref(0);
const double = computed(() => count.value * 2);
</script>
```

---

### Mistake 3: Confusing Auto-Imports with Global Scope pollution (Failing TypeScript IDE IntelliSense)

**The mistake:** Assuming auto-imported composables are attached to `window` or global `this`.

**Why it's wrong:** Nuxt auto-imports use Unimport under the hood, injecting explicit module references during build time without polluting global browser runtime scope.

*Incorrect:*
```vue
/* Trying to access window.useFetch() in client scripts */
```

*Fix:*
```vue
/* Use auto-imported composables directly in <script setup>: const data = await useFetch(...) */
```


---

## 6. Practice Exercises

### Exercise 1: Utilizing Auto-imports

**Problem:** You create a file at `composables/useFormat.ts` with the following code: `export const useFormat = () => { return "Formatted!"; }`. How do you use this in `app.vue`?

**Expected output:**
> [!check]- Answer
> ```vue
> <script setup lang="ts">
> // You just call it directly!
> const formattedText = useFormat();
> </script>
> ```
> - In Nuxt, any files placed in the `composables/` directory are auto-scanned and their named exports are globally available without any import statements.

---

### Exercise 2: Nuxt Auto-Import Directory Rules

**Problem:** List 3 directory paths in a Nuxt 3 project whose exports are automatically auto-imported application-wide.

**Expected output:**
> [!check]- Answer
> ```text
> 1. composables/
> 2. utils/
> 3. components/ (components auto-imported for templates)
> ```
> - `composables/` -> Custom composable functions (`useCustom()`).
> - `utils/` -> Helper functions (`formatDate()`).
> - `components/` -> Vue components (`<MyButton />`).
> 
> ```text
> composables/, utils/, components/
> ```

---

### Exercise 3: Disabling Specific Auto-Imports

**Problem:** How can you disable specific auto-imports in `nuxt.config.ts` if naming collisions occur?

**Expected output:**
> [!check]- Answer
> ```text
> Via imports.transform.exclude or imports.imports array in nuxt.config.ts.
> ```
> - Configure `imports` option in `nuxt.config.ts`.
> 
> ```typescript
> export default defineNuxtConfig({
>   imports: {
>     autoImport: true
>   }
> });
> ```


---

## 7. Related Terms
- [`components/` Directory](../level_03/components_directory.md) — Where auto-imported components live.
- [`composables/` Directory](../level_04/composables_directory.md) — Where your custom auto-imported logic lives.

---

## 8. Key Takeaways
- Nuxt automatically imports Vue APIs, Nuxt composables, components, and your custom composables.
- It removes massive amounts of boilerplate code.
- It happens at build-time (via Unplugin), so there is no runtime performance cost.
