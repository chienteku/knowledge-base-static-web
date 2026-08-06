# `composables/` Directory

> **Level 4 — Composables & State**
> The dedicated folder in Nuxt where you write reusable Vue 3 logic (composables). Any exported function inside this directory is automatically imported and available throughout your app.

---

## 1. Prerequisites
- [Vue 3 Composition API Context](../level_01/composition_api_context.md) — The syntax used to write composables.
- [Auto-imports](../level_01/auto_imports.md) — The mechanism that powers this directory.
- [Composables](../../../07-vue/terms/level_05/composables.md) — The core Vue concept of composable state logic wrappers.

---

## 2. Term Category

**Framework Architecture** (Automated Composable Functions): The `composables/` directory houses custom composition functions auto-imported globally across Vue components and pages.



---

## 3. Explanation

### Environment Context
- **Server & Client**

### (1) Design Motivation — "Why did we design this?"
In modern Vue 3 development, the standard way to share logic between multiple components (like managing a shopping cart, formatting dates, or tracking mouse position) is to write a "Composable." A Composable is simply a function that utilizes Vue's reactive APIs (`ref`, `computed`, `watch`).

If you put these functions in random files across your codebase, you have to manually import them everywhere you need them. Nuxt created the `composables/` directory to centralize this logic. By placing your functions here, Nuxt automatically makes them available globally without a single import statement.

### (2) Core Concept
To use the directory, create a `.ts` or `.js` file. The name of the exported function determines how you use it. 

**Best Practice:** The filename and the exported function name should match, and both should start with `use`.

```typescript
// composables/useCounter.ts
export const useCounter = () => {
  const count = ref(0);

  const increment = () => {
    count.value++;
  };

  return { count, increment };
};
```

### (3) Using the Composable
Because it lives in the `composables/` directory, you can instantly use `useCounter` in any page or component:

```vue
<!-- pages/index.vue -->
<script setup lang="ts">
// No import needed!
const { count, increment } = useCounter();
</script>

<template>
  <button @click="increment">Count is: {{ count }}</button>
</template>
```

### (4) Named vs Default Exports
Nuxt auto-imports rely strictly on **Named Exports** or **Default Exports**. However, it is highly recommended to use Named Exports (`export const useName = ...`) because it provides better TypeScript support and explicitly dictates the name of the auto-imported function. If you use `export default`, Nuxt infers the name from the filename.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Deeply nested composables not auto-importing
**The mistake:** Creating a file at `composables/auth/useLogin.ts` and wondering why `useLogin()` throws an "is not defined" error.

**Why it's wrong:** By default, Nuxt only scans the *top level* of the `composables/` directory. It does not look inside subdirectories for performance reasons.
**Golden Rule:** If you want to organize composables into subdirectories, you must either re-export them in an `index.ts` at the top level, or configure Nuxt to scan those subdirectories in `nuxt.config.ts`.

*Fix in `nuxt.config.ts`:*
```typescript
export default defineNuxtConfig({
  imports: {
    dirs: ['composables/**'] // Scan all subdirectories
  }
})
```

---

### Mistake 2: Creating Global Reactive State Outside the Composable Export Function (Cross-Request Pollution)

**The mistake:** Writing `const globalState = ref(0); export const useCounter = () => globalState;` in `composables/useCounter.ts`.

**Why it's wrong:** Declaring `ref()` outside the composables function creates a shared global variable in Node.js server memory. User A's data will leak to User B across HTTP requests. Use `useState()` for SSR-safe state.

*Incorrect:*
```typescript
// composables/useUser.ts
const user = ref(null); // ❌ Server memory leak across ALL users!
export const useUser = () => user;
```

*Fix:*
```vue
// Use SSR-safe useState composable:
export const useUser = () => useState('user-key', () => null);
```

---

### Mistake 3: Using Non-Standard File Names in `composables/` That Break Auto-Import Names

**The mistake:** Creating `composables/my-custom-helper.ts` and expecting composable function name to match.

**Why it's wrong:** Nuxt 3 auto-imports named function exports matching file structure. Ensure named function exports match file intention (e.g. `export const useAuth = () => {}`).

*Incorrect:*
```vue
/* Exporting default anonymous arrow functions in composable files */
```

*Fix:*
```vue
/* Export explicitly named composable functions: export const useAuth = () => { ... } */
```


---

## 5. Practice Exercises

### Exercise 1: Authoring Auto-Imported State Composables

**Scenario:**
Create a custom composable `composables/useCart.ts` managing items in a shopping cart.

**Requirements:**
1. Export `useCart` composable function.
2. Provide reactive state and mutation helpers.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // composables/useCart.ts
> export const useCart = () => {
>   const items = useState<string[]>("cart-items", () => []);
>   
>   const addItem = (item: string) => {
>     items.value.push(item);
>   };
>   
>   const itemCount = computed(() => items.value.length);
>   
>   return { items, addItem, itemCount };
> };
> ```
> 
> #### Technical Explanation
>
> 1. Top-level exports from files in `composables/` are auto-imported across the application.
> 2. `useState()` guarantees cart state is initialized safely on the server and hydrated on the client.
> 3. Encapsulates reusable business logic cleanly.
> 
---

### Exercise 2: Defining Nested Composable Utilities

**Scenario:**
Structure `composables/api/useProducts.ts` and verify how Nuxt resolves named exports vs directory prefixes.

**Requirements:**
1. Export `useProducts` from nested folder.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // composables/api/useProducts.ts
> export const useProducts = () => {
>   const fetchProducts = async () => {
>     return await $fetch("/api/products");
>   };
>   return { fetchProducts };
> };
> ```
> 
> #### Technical Explanation
>
> 1. Composables in nested directories are auto-imported based on export function names (`useProducts`).
> 2. If index files or default exports are used, parent folder names may be prepended.
> 3. Standard API abstraction structure.
> 
---

### Exercise 3: Passing Parameters into Parametric Composables

**Scenario:**
Create a parametric composable `composables/useCounter.ts` accepting an initial starting number.

**Requirements:**
1. Accept parameter `initialValue: number`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // composables/useCounter.ts
> export const useCounter = (initialValue: number = 0) => {
>   const count = ref(initialValue);
>   const increment = () => count.value++;
>   const decrement = () => count.value--;
>   return { count, increment, decrement };
> };
> ```
> 
> #### Technical Explanation
>
> 1. Composables can accept runtime configuration parameters.
> 2. Returns reactive references (`count`) and mutator methods.
> 3. Flexible factory composable pattern.
> 
---


## 6. Related Terms
- [`useState` Hook](use_state.md) — A Nuxt-specific composable often used *inside* your custom composables to create global state.
- [`components/` Directory](../level_03/components_directory.md) — The visual equivalent to `composables/`.
- [Auto-imports](../level_01/auto_imports.md) — Related concept: Auto-imports.
- [Pinia State Management](pinia.md) — Related concept: Pinia State Management.

---

## 7. Key Takeaways
- The `composables/` directory is for reusable Vue 3 logic.
- Exported functions are auto-imported everywhere in your app.
- Always name your functions starting with `use` (e.g., `useAuth`).
- Prefer Named Exports over Default Exports.
- Subdirectories are not scanned by default without configuration.
