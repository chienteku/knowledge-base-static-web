# Pinia State Management

> **Level 4 — Composables & State**
> The official, modern state management library for the Vue/Nuxt ecosystem, replacing Vuex to provide a type-safe, modular way to manage complex global state.

---

## 1. Prerequisites
- [`useState` Hook](use_state.md) — The lightweight Nuxt alternative that Pinia improves upon for large-scale applications.
- [Vue 3 Composition API Context](../level_01/composition_api_context.md) — The syntax used to write modern Pinia stores.

---

## 2. Term Category

**State Management** (Centralized Reactive Store): Pinia is the official modular state management library for Vue 3 and Nuxt 3, providing devtools support and SSR state hydration.



---

## 3. Explanation

### Environment Context
- **Server & Client**

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Defining Setup Stores in Nuxt 3 with `@pinia/nuxt`

**Scenario:**
Create a Pinia setup store `stores/useAuthStore.ts` using composition syntax and TypeScript interfaces.

**Requirements:**
1. Use `defineStore("auth", () => { ... })`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // stores/useAuthStore.ts
> import { defineStore } from "pinia";

export const useAuthStore = defineStore("auth", () => {
  const token = ref<string | null>(null);
  const user = ref<{ id: number; name: string } | null>(null);
  
  const isAuthenticated = computed(() => !!token.value);
  
  function setAuth(newToken: string, userData: { id: number; name: string }) {
    token.value = newToken;
    user.value = userData;
  }
  
  function logout() {
    token.value = null;
    user.value = null;
  }
  
  return { token, user, isAuthenticated, setAuth, logout };
});
```

> #### Technical Explanation
>
> 1. `@pinia/nuxt` enables auto-importing for `defineStore` and custom store composables inside Nuxt 3.
> 2. Setup stores use Vue 3 Composition API syntax (`ref`, `computed`, functions).
> 3. State is automatically hydrated from server to client seamlessly.

---

### Exercise 2: Consuming Pinia Stores in Vue Components

**Scenario:**
Consume `useAuthStore()` inside a login header component.

**Requirements:**
1. Consume store state and actions in `<script setup>`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <script setup lang="ts">
> const authStore = useAuthStore();
> </script>

<template>
  <div>
    <div v-if="authStore.isAuthenticated">
      <span>Welcome, {{ authStore.user?.name }}</span>
      <button @click="authStore.logout">Log Out</button>
    </div>
    <div v-else>
      <button @click="authStore.setAuth('token123', { id: 1, name: 'Alice' })">
        Log In
      </button>
    </div>
  </div>
</template>
```

> #### Technical Explanation
>
> 1. Stores are instantiated reactively across components.
> 2. `authStore.isAuthenticated` computes state updates across components automatically.
> 3. Centralized global state architecture.

---

### Exercise 3: Preserving Store Reactivity with `storeToRefs()`

**Scenario:**
Destructure store state properties safely using `storeToRefs()` without breaking Vue reactivity.

**Requirements:**
1. Use `const { token, isAuthenticated } = storeToRefs(authStore)`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <script setup lang="ts">
> import { storeToRefs } from "pinia";

const authStore = useAuthStore();
// Preserves reactive bindings when destructuring!
const { user, isAuthenticated } = storeToRefs(authStore);
const { logout } = authStore; // Methods can be destructured directly
</script>

<template>
  <div v-if="isAuthenticated">
    <p>User: {{ user?.name }}</p>
    <button @click="logout">Log Out</button>
  </div>
</template>
```

> #### Technical Explanation
>
> 1. Direct ES6 object destructuring (`const { user } = authStore`) breaks Vue reactivity tracking.
> 2. `storeToRefs()` wraps state and computed properties in reactive `ref` objects.
> 3. Actions and methods do not need `storeToRefs()` and can be destructured directly.

---




---

## 6. Related Terms
- [`composables/` Directory](composables_directory.md) — Pinia stores are essentially super-powered composables.
- [`useState` Hook](use_state.md) — Related concept: `useState` Hook.
- [Nuxt Modules System](../level_09/nuxt_modules.md) — Related concept: Nuxt Modules System.

---

## 7. Key Takeaways
- Pinia is the official state management library for Vue and Nuxt.
- Use Setup Stores to write Pinia logic using standard Composition API syntax (`ref`, `computed`, functions).
- Pinia handles Nuxt SSR state serialization automatically.
- Never destructure state directly; always use `storeToRefs`.
