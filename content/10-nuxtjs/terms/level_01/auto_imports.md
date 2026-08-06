# Auto-imports

> **Level 1 — Core Concepts & Architecture**
> Nuxt's intelligent build-time feature that automatically imports Vue APIs, Nuxt composables, and your own components without requiring manual `import` statements.

---

## 1. Prerequisites
- [Vue 3 Composition API Context](composition_api_context.md) — The APIs that are heavily auto-imported.
- [Modules (import/export)](../../../03-javascript/terms/level_08/modules.md) — The manual ES module imports system being bypassed.

---

## 2. Term Category

**Framework Architecture** (Automated Symbol Registration): Auto-imports in Nuxt 3 automatically make Vue composables, Nuxt helpers (`useFetch`, `useRoute`), and components globally available without manual import statements.



---

## 3. Explanation

### Environment Context
- **Build-Time**

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Leveraging Nuxt Auto-Imports in Vue Components

**Scenario:**
Refactor a Vue 3 component to rely on Nuxt 3's auto-import system without manual import statements for `ref`, `computed`, or `useRoute`.

**Requirements:**
1. Remove manual imports for `ref`, `computed`, and `useRoute`.
2. Access route parameter `id` and maintain reactive state.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <script setup lang="ts">
> // No explicit imports needed for ref, computed, or useRoute!
> const route = useRoute();
> const count = ref(1);
> const doubleCount = computed(() => count.value * 2);
> const userId = computed(() => route.params.id);
> </script>

<template>
  <div>
    <p>User ID: {{ userId }}</p>
    <button @click="count++">Count: {{ count }} (Double: {{ doubleCount }})</button>
  </div>
</template>
```

> #### Technical Explanation
>
> 1. Nuxt 3 automatically scans component, composable, and Vue core APIs during development and build compilation.
> 2. Automatically generates TypeScript declaration files (`.nuxt/imports.d.ts`) to provide full IDE auto-completion.
> 3. Reduces boilerplate while maintaining strict type safety.

---

### Exercise 2: Auto-Importing Custom Composables

**Scenario:**
Create a custom composable `composables/useUser.ts` and use it inside `app.vue` without explicit import statements.

**Requirements:**
1. Define `export const useUser = () => { ... }` in `composables/useUser.ts`.
2. Consume `useUser()` directly inside `<script setup>`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // composables/useUser.ts
> export const useUser = () => {
>   const user = ref({ name: "Alice", role: "admin" });
>   const isLoggedIn = computed(() => !!user.value.name);
>   return { user, isLoggedIn };
> };
> ```
>
> ```vue
> <!-- app.vue -->
> <script setup lang="ts">
> // Automatically imported from composables/useUser.ts!
> const { user, isLoggedIn } = useUser();
> </script>

<template>
  <div>
    <p v-if="isLoggedIn">Welcome, {{ user.name }} ({{ user.role }})</p>
  </div>
</template>
```

> #### Technical Explanation
>
> 1. Files exported from the `composables/` directory are auto-imported at compile time.
> 2. Nuxt registers named and default exports globally across the Vue application layer.
> 3. Eliminates deep relative path import statements (`../../composables/useUser`).

---

### Exercise 3: Disabling or Explicitly Importing Explicit Dependencies

**Scenario:**
Explain how to explicitly import functions from `#imports` when required by strict linting rules or external utilities.

**Requirements:**
1. Import `ref` and `useFetch` from `#imports`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <script setup lang="ts">
> import { ref, useFetch } from "#imports";

const { data } = await useFetch("/api/status");
const isReady = ref(true);
</script>
```

> #### Technical Explanation
>
> 1. `#imports` is Nuxt's virtual alias pointing to the generated auto-import repository.
> 2. Useful when linter or external testing suites require explicit module resolution.
> 3. Ensures interoperability with third-party toolchains.

---




---

## 6. Related Terms
- [`components/` Directory](../level_03/components_directory.md) — Where auto-imported components live.
- [`composables/` Directory](../level_04/composables_directory.md) — Where your custom auto-imported logic lives.
- [Vue 3 Composition API Context](composition_api_context.md) — Related concept: Vue 3 Composition API Context.
- [Nuxt 3 Overview](nuxt_3_overview.md) — Related concept: Nuxt 3 Overview.

---

## 7. Key Takeaways
- Nuxt automatically imports Vue APIs, Nuxt composables, components, and your custom composables.
- It removes massive amounts of boilerplate code.
- It happens at build-time (via Unplugin), so there is no runtime performance cost.
