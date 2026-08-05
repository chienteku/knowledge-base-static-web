# Pinia State Management

> **Level 4 — Composables & State**
> The official, modern state management library for the Vue/Nuxt ecosystem, replacing Vuex to provide a type-safe, modular way to manage complex global state.

---

## 1. Prerequisites
- [`useState` Hook](use_state.md) — The lightweight Nuxt alternative that Pinia improves upon for large-scale applications.
- [Vue 3 Composition API Context](../level_01/composition_api_context.md) — The syntax used to write modern Pinia stores.

---

## 2. Term Category
- **State Management**

---

## 3. Environment Context
- **Server & Client**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
While Nuxt's built-in `useState()` is fantastic for simple variables (like a string or a boolean), it becomes messy when managing complex logic. For example, a "Shopping Cart" needs state (items), getters (total price), and actions (addItem, removeItem, checkout).

**Pinia** was created to manage this complexity. It is fully integrated with Nuxt 3 (via `@pinia/nuxt`), meaning it handles the complex Server-to-Client state serialization (hydration) automatically. It is also designed from the ground up for perfect TypeScript support.

### (2) Setup Stores (The Modern Syntax)
In Nuxt 3, Pinia stores are written using the exact same Composition API syntax you use in your Vue components. This is called a "Setup Store."

```typescript
// stores/cart.ts
import { defineStore } from 'pinia';

export const useCartStore = defineStore('cart', () => {
  // State (Refs)
  const items = ref<string[]>([]);
  
  // Getters (Computed)
  const totalItems = computed(() => items.value.length);
  
  // Actions (Functions)
  function addItem(item: string) {
    items.value.push(item);
  }

  // You must return everything you want to expose
  return { items, totalItems, addItem };
});
```

### (3) Using the Store
Once defined, you simply import the store (or let Nuxt auto-import it if configured) and call it inside your component.

```vue
<!-- pages/cart.vue -->
<script setup lang="ts">
import { useCartStore } from '~/stores/cart';

const cart = useCartStore();
</script>

<template>
  <div>
    <h2>Cart ({{ cart.totalItems }})</h2>
    <ul>
      <li v-for="item in cart.items" :key="item">{{ item }}</li>
    </ul>
    <button @click="cart.addItem('Apple')">Add Apple</button>
  </div>
</template>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Destructuring state without `storeToRefs`
**The mistake:** Trying to use ES6 destructuring to pull state out of a Pinia store to make the template cleaner.

**Why it's wrong:** Standard JavaScript destructuring immediately breaks Vue's reactivity. If you destructure `const { items } = useCartStore()`, the `items` variable will be completely disconnected from the store. When the store updates, your UI will not change.
**Golden Rule:** If you want to destructure state or getters from Pinia, you MUST use the `storeToRefs` utility. (Note: Actions/Functions can be destructured normally).

*Incorrect:*
```typescript
const store = useCartStore();
const { totalItems } = store; // Reactivity broken!
```

*Fix:*
```typescript
import { storeToRefs } from 'pinia';

const store = useCartStore();
const { totalItems } = storeToRefs(store); // Reactivity maintained!
const { addItem } = store; // Functions don't need storeToRefs
```

---

### Mistake 2: Destructuring Pinia Store State Without `storeToRefs()` (Loss of Reactivity)

**The mistake:** Writing `const { count, user } = useMainStore()` in `<script setup>`.

**Why it's wrong:** Destructuring state directly from a Pinia store severs Vue reactivity. Use `storeToRefs(store)` to preserve reactive ref bindings when destructuring.

*Incorrect:*
```vue
<script setup>
const store = useMainStore();
const { count } = store; // ❌ Destructuring severs reactivity!
</script>
```

*Fix:*
```vue
<script setup>
import { storeToRefs } from 'pinia';
const store = useMainStore();
const { count } = storeToRefs(store); // Preserves ref reactivity
const { increment } = store; // Actions can be destructured directly
</script>
```

---

### Mistake 3: Executing Client-Only Side Effects inside Pinia Setup Stores During SSR

**The mistake:** Calling `localStorage.getItem('token')` at the root of a Pinia setup store definition.

**Why it's wrong:** Pinia stores instantiate on the server during SSR. Calling `localStorage` at store root throws a `localStorage is not defined` error during server rendering.

*Incorrect:*
```typescript
export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token')); // ❌ Throws SSR ReferenceError!
});
```

*Fix:*
```vue
export const useAuthStore = defineStore('auth', () => {
  const token = useCookie('token'); // Use SSR-friendly cookie composable
});
```


---

## 6. Practice Exercises

### Exercise 1: Defining a User Store

**Problem:** Write a minimal Pinia Setup Store named `user` that holds a `username` (string, default empty) and a `login` action that sets the `username` to "Admin".

**Expected output:**
> [!check]- Answer
> ```typescript
> import { defineStore } from 'pinia';
> 
> export const useUserStore = defineStore('user', () => {
>   const username = ref('');
>   
>   function login() {
>     username.value = 'Admin';
>   }
>   
>   return { username, login };
> });
> ```
> - Wrap your setup code in `defineStore('user', () => { ... })` and return state and action properties.

---

### Exercise 2: Pinia Setup Store Pattern in Nuxt 3

**Problem:** Write Pinia Setup Store `stores/user.ts` containing ref `user`, computed `isLoggedIn`, and action `setUser(data)`.

**Expected output:**
> [!check]- Answer
> ```typescript
> export const useUserStore = defineStore('user', () => {
>   const user = ref(null);
>   const isLoggedIn = computed(() => !!user.value);
>   function setUser(data) { user.value = data; }
>   return { user, isLoggedIn, setUser };
> });
> ```
> - `@pinia/nuxt` module auto-imports `defineStore` across Nuxt projects.
> 
> ```typescript
> // stores/user.ts
> export const useUserStore = defineStore('user', () => {
>   const user = ref<{ id: number; name: string } | null>(null);
>   const isLoggedIn = computed(() => !!user.value);
>   
>   function setUser(userData: { id: number; name: string }) {
>     user.value = userData;
>   }
>   
>   return { user, isLoggedIn, setUser };
> });
> ```

---

### Exercise 3: Pinia Nuxt Module Installation

**Problem:** Which module name must be added to `modules` array in `nuxt.config.ts` for Pinia integration?

**Expected output:**
> [!check]- Answer
> ```text
> @pinia/nuxt
> ```
> - `@pinia/nuxt` provides automatic store auto-imports and SSR hydration.
> 
> ```typescript
> export default defineNuxtConfig({
>   modules: ['@pinia/nuxt']
> });
> ```


---

## 7. Related Terms
- [`composables/` Directory](composables_directory.md) — Pinia stores are essentially super-powered composables.
- [`useState` Hook](use_state.md) — Related concept: `useState` Hook.
- [Nuxt Modules System](../level_09/nuxt_modules.md) — Related concept: Nuxt Modules System.

---

## 8. Key Takeaways
- Pinia is the official state management library for Vue and Nuxt.
- Use Setup Stores to write Pinia logic using standard Composition API syntax (`ref`, `computed`, functions).
- Pinia handles Nuxt SSR state serialization automatically.
- Never destructure state directly; always use `storeToRefs`.
