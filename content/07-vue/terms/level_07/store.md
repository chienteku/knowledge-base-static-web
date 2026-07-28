# Store (Pinia)

> **Level 7 — State Management (Pinia)**
> A specific, isolated module within Pinia that holds data and logic for a single feature or domain (e.g., the User Store, the Cart Store).

---

## 1. Prerequisites
- [Pinia](../level_07/pinia.md) — The library that powers the Store.
- [Composition API](../level_01/composition_api.md) — Stores are written using Composition API syntax.

---

## 2. Term Category
- **Vue Ecosystem / Pinia Architecture**

---

## 3. Environment Context
- **Pinia Configuration Files**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In Redux or Vuex, you traditionally had *one* massive global object that held the state for the entire application. It became incredibly bloated and hard to split up.
Pinia takes a different approach: **Multiple Stores**. 
Instead of one big database, you create specialized mini-databases. You have a file for the `UserStore`, a file for the `CartStore`, and a file for the `ThemeStore`. They are completely independent, but can talk to each other if necessary.

### (2) Setup Stores (The Modern Way)
Pinia allows you to write a Store exactly like you write a Vue `<script setup>` component! This is called a "Setup Store".
You use `defineStore()`, give it a unique ID name, and pass it a setup function.

```javascript
// stores/counter.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// The unique ID is 'counter'. The exported function starts with 'use...'
export const useCounterStore = defineStore('counter', () => {
  
  // STATE (refs)
  const count = ref(0)
  
  // GETTERS (computed)
  const doubleCount = computed(() => count.value * 2)
  
  // ACTIONS (functions)
  function increment() {
    count.value++
  }

  // You MUST return what you want to expose to the app
  return { count, doubleCount, increment }
})
```

### (3) Using the Store in a Component
Any component can now import and invoke the Store.
```vue
<script setup>
import { useCounterStore } from '@/stores/counter'

// 1. Initialize the store instance
const counter = useCounterStore()

// 2. Access the data and functions directly!
// counter.increment()
// console.log(counter.count)
</script>

<template>
  <button @click="counter.increment()">{{ counter.count }}</button>
</template>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Destructuring a Store

**The mistake:** A developer wants cleaner code, so they destructure the store:
`const { count, increment } = useCounterStore()`

**Why it's wrong:** A Pinia Store is wrapped in a Reactive Proxy (just like `reactive()`). If you destructure standard variables out of it, you sever the reactivity! `count` will be stuck at `0` forever, and the UI will not update.
**Golden Rule:** Never destructure state directly from a store. Use `counter.count`. If you absolutely *must* destructure, you must wrap the store in Pinia's `storeToRefs()` utility function first!

---

### Mistake 2: Duplicate Store ID Naming Collisions in `defineStore()`

**The mistake:** Defining two separate stores with the exact same ID name: `defineStore('user', ...)`.

**Why it's wrong:** Pinia uses the unique store string ID to connect to Vue DevTools and manage SSR hydration. Duplicate store IDs overwrite each other in the global Pinia registry.

*Incorrect:*
```javascript
export const useUserStore = defineStore('user', ...);
export const useProfileStore = defineStore('user', ...); // ❌ Duplicate store ID 'user'!
```

*Fix:*
```vue
export const useUserStore = defineStore('user', ...);
export const useProfileStore = defineStore('profile', ...); // Unique store IDs
```

---

### Mistake 3: Forgetting to Return State Variables from Setup Stores

**The mistake:** Declaring `const count = ref(0)` inside `defineStore('counter', () => { ... })` but omitting `count` from the returned object.

**Why it's wrong:** Only properties explicitly included in the setup store's return object (`return { count, increment }`) are exposed on the store instance.

*Incorrect:*
```javascript
defineStore('counter', () => {
  const count = ref(0);
  return {}; // ❌ count is omitted from public store API!
});
```

*Fix:*
```vue
defineStore('counter', () => {
  const count = ref(0);
  return { count }; // Expose state in return object
});
```


---

## 6. Practice Exercises

### Exercise 1: The Unique ID

**Problem:** When you define a store, you must pass a string ID: `defineStore('auth', () => {})`. What happens if you create a second store and accidentally name it `'auth'` as well?

**Expected output:**
> [!check]- Answer
> ```text
> Pinia will throw an error or overwrite the store.
> The string ID (e.g., 'auth') is how Pinia registers the store internally and connects it to the Vue DevTools. Every single store in your application MUST have a globally unique string ID.
> ```
> - Think about database Primary Keys.

---

### Exercise 2: Store State Subscription with $subscribe

**Problem:** Write `store.$subscribe()` statement persisting store state to `localStorage` whenever state updates.

**Expected output:**
> [!check]- Answer
> ```javascript
> cartStore.$subscribe((mutation, state) => { localStorage.setItem('cart', JSON.stringify(state)); });
> ```
> - `store.$subscribe()` listens to all state changes.
> 
> ```javascript
> cartStore.$subscribe((mutation, state) => {
>   localStorage.setItem('cart', JSON.stringify(state));
> });
> ```

---

### Exercise 3: Pinia Plugin Extension Pattern

**Problem:** Write a custom Pinia plugin adding a global `$router` property to all stores.

**Expected output:**
> [!check]- Answer
> ```javascript
> pinia.use(({ store }) => { store.$router = markRaw(router); });
> ```
> - `pinia.use()` extends all store instances with custom properties.
> 
> ```javascript
> pinia.use(({ store }) => {
>   store.$router = markRaw(router);
> });
> ```


---

## 7. Related Terms
- [State & Getters](../level_07/state_getters.md) — The data inside the store.
- [Actions](../level_07/actions.md) — The functions inside the store.

---

## 8. Key Takeaways
- A **Store** is an isolated module of state and logic within Pinia.
- Modern Pinia uses "Setup Stores", which are written exactly like the Vue Composition API (using `ref` and `computed`).
- You define a store using `defineStore('unique-id', () => { ... })`.
- You use the store in a component by importing it and calling the initialization function (`useMyStore()`).
- NEVER destructure state out of a store directly, as it destroys the reactivity.
