# Vue 3 Composition API Context

> **Level 1 — Core Concepts & Architecture**
> The modern paradigm for writing Vue components, relying on `<script setup>` to define reactive state and functions in a flat, readable, and highly reusable way.

---

## 1. Prerequisites
- [Nuxt 3 Overview](../level_01/nuxt_3_overview.md) — Nuxt 3 is built entirely on this paradigm.
- [Vue 3 Composition API Overview](../../../07-vue/terms/level_01/composition_api.md) — The core Vue paradigm.
- [Reactivity API (`ref`)](../../../07-vue/terms/level_02/ref.md) — The mechanism for primitive values.
- [Reactivity API (`reactive`)](../../../07-vue/terms/level_02/reactive.md) — The mechanism for object structures.

---

## 2. Term Category
- **Vue Paradigm**

---

## 3. Environment Context
- **Server & Client**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In Vue 2 (and early Nuxt 2), developers used the **Options API** (`data()`, `methods`, `computed`, `mounted`). As components grew larger, logic related to a single feature (e.g., search functionality) became scattered across the file. You'd have search state in `data()`, search logic in `methods`, and search caching in `computed`.

The **Composition API** was introduced in Vue 3 to solve this. It allows developers to group logic together by feature rather than by arbitrary options. In Nuxt 3, the Composition API is the strict default, usually authored via the `<script setup>` syntactic sugar.

### (2) The `<script setup>` Syntax
Nuxt 3 projects universally use `<script setup>`. Any variable or function declared inside this block is automatically exposed to the `<template>`.

```vue
<template>
  <div>
    <h1>{{ title }}</h1>
    <button @click="increment">Count: {{ count }}</button>
  </div>
</template>

<script setup lang="ts">
// Reactivity APIs are auto-imported in Nuxt!
const title = ref('My Nuxt App');
const count = ref(0);

function increment() {
  count.value++;
}
</script>
```

### (3) Composables
The true power of the Composition API is extracting logic into reusable functions called **Composables** (which typically start with `use...`). Nuxt embraces this pattern heavily (e.g., `useFetch`, `useHead`, `useRouter`).

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using the Options API in Nuxt 3
**The mistake:** Falling back to familiar Vue 2 syntax.

**Why it's wrong:** While Nuxt 3 technically supports the Options API for backward compatibility, almost all modern Nuxt features, composables, and ecosystem tools are designed exclusively for the Composition API. Using the Options API cuts you off from the modern ecosystem.
**Golden Rule:** Always use `<script setup lang="ts">`.

*Incorrect:*
```vue
<script lang="ts">
export default {
  data() {
    return { count: 0 }
  },
  methods: {
    increment() { this.count++; }
  }
}
</script>
```

*Fix:*
```vue
<script setup lang="ts">
const count = ref(0);
function increment() { count.value++; }
</script>
```

---

### Mistake 2: Accessing Nuxt Composables Outside the Synchronous `<script setup>` Scope

**The mistake:** Calling `useRoute()` or `useNuxtApp()` inside an asynchronous callback or decoupled setTimeout event loop.

**Why it's wrong:** Nuxt composables rely on a shared global context initialized during synchronous component setup. Calling them after asynchronous delays (`setTimeout`, detached callbacks) loses the active Nuxt context, throwing `Nuxt instance not unavailable` errors.

*Incorrect:*
```vue
<script setup>
setTimeout(() => {
  const route = useRoute(); // ❌ Loss of Nuxt context inside setTimeout!
}, 1000);
</script>
```

*Fix:*
```vue
<script setup>
// Capture route synchronously at top level of script setup:
const route = useRoute();
setTimeout(() => {
  console.log(route.path); // Use pre-captured reference safely
}, 1000);
</script>
```

---

### Mistake 3: Using Options API `this` inside Nuxt 3 Composables

**The mistake:** Attempting to reference `this.$nuxt` or `this.$route` inside Composition API setup blocks.

**Why it's wrong:** Nuxt 3 Composition API eliminates `this` bindings completely. Use composable functions (`useNuxtApp()`, `useRoute()`, `useRouter()`).

*Incorrect:*
```typescript
export default {
  mounted() {
    console.log(this.$route.path); // ❌ Legacy Options API syntax
  }
}
```

*Fix:*
```vue
<script setup>
const route = useRoute(); // Composition API composable
console.log(route.path);
</script>
```


---

## 6. Practice Exercises

### Exercise 1: Reactive State

**Problem:** How do you declare a reactive integer in the Composition API that updates the UI when changed?

**Expected output:**
> [!check]- Answer
> ```typescript
> const age = ref(25);
> // To update it: age.value = 26;
> ```
> - Reactivity in Composition API is achieved by wrapping raw values in reactive containers like `ref()`.

---

### Exercise 2: Nuxt Context Preservation Pattern

**Problem:** Write a Vue 3 component capturing `useNuxtApp()` synchronously and calling `$fetch` inside an `onClick` async function.

**Expected output:**
> [!check]- Answer
> ```vue
> <script setup>
> const { $fetch } = useNuxtApp();
> async function handleSave() {
>   await $fetch('/api/save', { method: 'POST' });
> }
> </script>
> ```
> - Capture Nuxt context composables at the top level of `<script setup>`.
> 
> ```vue
> <script setup>
> const { $fetch } = useNuxtApp();
> 
> async function handleSave() {
>   await $fetch('/api/save', { method: 'POST' });
> }
> </script>
> 
> <template>
>   <button @click="handleSave">Save</button>
> </template>
> ```

---

### Exercise 3: callWithNuxt Context Wrapper

**Problem:** Which helper function manually restores Nuxt instance context when executing callbacks across async boundaries?

**Expected output:**
> [!check]- Answer
> ```text
> callWithNuxt(app, callback)
> ```
> - `callWithNuxt` restores instance context for async functions.
> 
> ```typescript
> const nuxtApp = useNuxtApp();
> callWithNuxt(nuxtApp, () => useRoute());
> ```


---

## 7. Related Terms
- [Auto-imports](../level_01/auto_imports.md) — Why you don't need to explicitly import `ref` or `computed`.

---

## 8. Key Takeaways
- Nuxt 3 heavily relies on the Vue 3 Composition API.
- Always use `<script setup lang="ts">` for component logic.
- Variables and functions in `<script setup>` are automatically available in the template.
- State is managed via `ref()` and `reactive()`.
