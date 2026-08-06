# Store (Pinia)

> **Level 7 — State Management & Pinia**
> An isolated, self-contained domain module in Pinia holding reactive State, memoized Getters, and imperative Actions for a specific application feature.

---

## 1. Prerequisites

- [Pinia](pinia.md) — The state management library powering Pinia Store modules.
- [Composition API](../level_01/composition_api.md) — The functional programming paradigm used to define modern Pinia Setup Stores.

---

## 2. Term Category

**Vue Ecosystem Construct (Pinia Store Module Container)**: A Pinia Store is a modular unit of application state created using `defineStore()`. Operating across client and server environments, each store represents an independent domain namespace (e.g., `useUserStore`, `useCartStore`, `useThemeStore`).

Unlike legacy state management libraries (like Vuex) that maintained a single global state object, Pinia Stores are completely modular and decentralized. Stores are instantiated lazily when invoked by components, composables, or router guards. They integrate directly with Vue DevTools, supporting time-travel debugging, action inspection, and hot module replacement (HMR) during local development.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In Vuex 3/4, application state was defined as a single monolithic tree (`store.state.user.profile.name`). Splitting a monolithic store required registering sub-modules with string namespaces (`dispatch('user/profile/update')`), creating nested paths that were difficult to refactor and impossible to type-check cleanly in TypeScript.

Pinia introduced **Modular Stores** using the `defineStore()` function. Each store is defined in its own file with a unique string ID (e.g., `'user'`). Stores act like specialized composables: you export a custom hook like `export const useUserStore = defineStore('user', () => { ... })`. When a component needs user data, it imports `useUserStore` and calls it directly. This modular structure provides clean code splitting, automatic tree-shaking for unused stores, and seamless TypeScript auto-completion.

### (2) Reality Metaphor
Imagine a modern smartphone operating system. Instead of maintaining one massive 500-page settings ledger on a physical clipboard, the OS provides dedicated **App Containers** (Stores). 

The Battery Manager app (`useBatteryStore`) manages battery percentages and power-saving modes. The Wi-Fi Manager app (`useWifiStore`) manages SSID connections and passwords. The Apps operate independently: opening Wi-Fi settings does not load or evaluate Battery Manager memory. When an app needs permission data from another service, it calls the system API directly. Each store module is isolated, lightweight, and loaded on demand.

### (3) Vue Code Examples

#### Short Snippet
```vue
<script setup>
import { defineStore } from 'pinia'
import { ref } from 'vue'

// Define a minimal Pinia Setup Store with unique ID 'counter'
export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  function increment() { count.value++ }
  return { count, increment }
})
</script>
```

#### Fuller Example
```vue
<script setup>
import { defineStore, storeToRefs } from 'pinia'
import { ref, computed } from 'vue'

// Define domain Store module for shopping cart
export const useCartStore = defineStore('cart', () => {
  // STATE
  const items = ref([])

  // GETTERS
  const itemCount = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))
  const totalPrice = computed(() => items.value.reduce((sum, item) => sum + (item.price * item.quantity), 0))

  // ACTIONS
  function addItem(product) {
    const existing = items.value.find(i => i.id === product.id)
    if (existing) {
      existing.quantity++
    } else {
      items.value.push({ ...product, quantity: 1 })
    }
  }

  function removeItem(productId) {
    items.value = items.value.filter(i => i.id !== productId)
  }

  return { items, itemCount, totalPrice, addItem, removeItem }
})

// Component usage
const cartStore = useCartStore()
// Extract reactive getters safely
const { itemCount, totalPrice } = storeToRefs(cartStore)
// Extract actions directly
const { addItem, removeItem } = cartStore
</script>

<template>
  <div class="cart-widget">
    <h3>Shopping Cart (Items: {{ itemCount }})</h3>
    <p>Total: ${{ totalPrice.toFixed(2) }}</p>
    <ul>
      <li v-for="item in cartStore.items" :key="item.id">
        {{ item.name }} x {{ item.quantity }}
        <button @click="removeItem(item.id)">Remove</button>
      </li>
    </ul>
  </div>
</template>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Duplicate Store String ID Collisions
**The mistake:** Registering two separate store definitions with the exact same string ID parameter: `defineStore('user', ...)` and `defineStore('user', ...)`.

**Why it's wrong:** Pinia uses the unique string ID as a lookup key in the global Pinia registry and DevTools. Duplicate store IDs overwrite each other, leading to state corruption and silent hydration failures in SSR applications.

*Incorrect:*
```javascript
export const useUserStore = defineStore('user', () => { ... })
export const useProfileStore = defineStore('user', () => { ... }) // ❌ Duplicate ID 'user'!
```

*Fix:*
```javascript
export const useUserStore = defineStore('user', () => { ... })
export const useProfileStore = defineStore('profile', () => { ... }) // Unique string IDs
```

---

### Mistake 2: Forgetting to Return State from Setup Stores
**The mistake:** Declaring `const count = ref(0)` inside a setup store `defineStore('counter', () => { ... })` but omitting `count` from the returned object.

**Why it's wrong:** Setup stores work exactly like Composition API setup functions. Only properties explicitly included in the returned object (`return { count, increment }`) are exposed on the store instance. Private un-returned refs remain hidden.

*Incorrect:*
```javascript
export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  function increment() { count.value++ }
  return { increment } // ❌ count is omitted from public store API!
})
```

*Fix:*
```javascript
export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  function increment() { count.value++ }
  return { count, increment } // Expose state ref in return object
})
```

---

### Mistake 3: Destructuring Store State Directly Without `storeToRefs()`
**The mistake:** Extracting state variables directly using ES6 destructuring: `const { count } = useCounterStore()`.

**Why it's wrong:** A Pinia store instance is a reactive Proxy. Destructuring properties extracts raw primitive copies, breaking reactivity. Always use `storeToRefs(store)` for state and getters.

*Incorrect:*
```javascript
const store = useCounterStore()
const { count } = store // ❌ Destructuring breaks reactivity!
```

*Fix:*
```javascript
import { storeToRefs } from 'pinia'
const store = useCounterStore()
const { count } = storeToRefs(store) // Preserves reactive ref binding
```

---

## 5. Practice Exercises

### Exercise 1: IoT Warehouse Fleet Store
**Scenario:** A robotics warehouse system requires a Pinia Store module `useRobotStore` to manage autonomous forklift locations, battery levels, and task assignments.

**Requirements:**
1. Define store ID `'robots'`.
2. State `robots` array containing `{ id, status, battery, location }`.
3. Getter `lowBatteryRobots` returning array of robots with `battery < 20`.
4. Action `assignTask(robotId, task)` updating target robot status to `'busy'`.

> [!check]- Answer
>
> #### Implementation
> ```javascript
> import { defineStore } from 'pinia'
> import { ref, computed } from 'vue'
> 
> export const useRobotStore = defineStore('robots', () => {
>   const robots = ref([
>     { id: 'BOT-01', status: 'idle', battery: 85, location: 'Aisle 3' },
>     { id: 'BOT-02', status: 'idle', battery: 14, location: 'Aisle 7' }
>   ])
> 
>   const lowBatteryRobots = computed(() => {
>     return robots.value.filter(r => r.battery < 20)
>   })
> 
>   function assignTask(robotId, task) {
>     const bot = robots.value.find(r => r.id === robotId)
>     if (!bot) throw new Error(`Robot ${robotId} not found`)
>     if (bot.battery < 20) throw new Error(`Robot ${robotId} battery too low for task`)
>     
>     bot.status = 'busy'
>     bot.currentTask = task
>   }
> 
>   return { robots, lowBatteryRobots, assignTask }
> })
> ```
>
> #### Technical Explanation
> 1. **Setup Store Definition**: `defineStore('robots', ...)` exports custom hook function returning reactive state and getters.
> 2. **Computed Filter Getter**: `lowBatteryRobots` tracks `robots` array mutations and evaluates low-battery items dynamically.
> 3. **Action Boundary Guards**: `assignTask` validates battery thresholds before mutating robot status state.
> 4. **Proxy Reactivity**: Updating `bot.status` mutates the reactive proxy object inside the array seamlessly.
> 
---

### Exercise 2: Financial Currency Rates Store with Auto-Refresh
**Scenario:** A trading application needs a Pinia Store `useFxStore` that fetches currency exchange rates from an API and updates rates on a periodic interval.

**Requirements:**
1. Store ID `'fxRates'`.
2. State `rates` object `{ USD: 1.0, EUR: 0.92, GBP: 0.79 }` and `lastUpdated` timestamp ref.
3. Action `fetchRates()` fetching fresh rate data asynchronously.
4. Provide action `startAutoRefresh(intervalMs)` returning a cleanup stop function.

> [!check]- Answer
>
> #### Implementation
> ```javascript
> import { defineStore } from 'pinia'
> import { ref } from 'vue'
> 
> export const useFxStore = defineStore('fxRates', () => {
>   const rates = ref({ USD: 1.0, EUR: 0.92, GBP: 0.79 })
>   const lastUpdated = ref(Date.now())
>   let timerId = null
> 
>   async function fetchRates() {
>     try {
>       const res = await fetch('/api/fx-rates')
>       if (res.ok) {
>         rates.value = await res.json()
>         lastUpdated.value = Date.now()
>       }
>     } catch (e) {
>       console.error('FX Fetch failed', e)
>     }
>   }
> 
>   function startAutoRefresh(intervalMs = 5000) {
>     if (timerId) clearInterval(timerId)
>     timerId = setInterval(() => {
>       fetchRates()
>     }, intervalMs)
> 
>     return () => {
>       if (timerId) clearInterval(timerId)
>     }
>   }
> 
>   return { rates, lastUpdated, fetchRates, startAutoRefresh }
> })
> ```
>
> #### Technical Explanation
> 1. **Private Timer Variable**: `timerId` is kept private inside setup store closure, un-returned in public store API object.
> 2. **Async Refresh Action**: `fetchRates` executes network dispatch and updates timestamp refs.
> 3. **Interval Cleanup Callback**: `startAutoRefresh` returns explicit cleanup function for component lifecycle unmounting hooks.
> 4. **State Isolation**: Currency rates are isolated from transaction stores, ensuring modular reusability.
> 
---

### Exercise 3: E-Commerce Persistent User Wishlist Store
**Scenario:** An online storefront requires a `useWishlistStore` that tracks saved product IDs and persists changes to browser `localStorage`.

**Requirements:**
1. Store ID `'wishlist'`.
2. State `wishlistIds` array initialized from `localStorage`.
3. Getter `wishlistCount` returning total saved items.
4. Action `toggleWishlist(productId)` adding or removing product IDs.

> [!check]- Answer
>
> #### Implementation
> ```javascript
> import { defineStore } from 'pinia'
> import { ref, computed } from 'vue'
> 
> export const useWishlistStore = defineStore('wishlist', () => {
>   const wishlistIds = ref(JSON.parse(localStorage.getItem('wishlist_ids') || '[]'))
> 
>   const wishlistCount = computed(() => wishlistIds.value.length)
> 
>   function toggleWishlist(productId) {
>     const index = wishlistIds.value.indexOf(productId)
>     if (index > -1) {
>       wishlistIds.value.splice(index, 1)
>     } else {
>       wishlistIds.value.push(productId)
>     }
>     localStorage.setItem('wishlist_ids', JSON.stringify(wishlistIds.value))
>   }
> 
>   return { wishlistIds, wishlistCount, toggleWishlist }
> })
> ```
>
> #### Technical Explanation
> 1. **Initial Ref Hydration**: `wishlistIds` parses browser storage fallback during store instantiation.
> 2. **Toggle Mutator Action**: `toggleWishlist` uses `.indexOf()` and `.splice()` to add/remove items reactively.
> 3. **Sync Persistence**: Updates write directly to `localStorage` key synchronously after state mutations.
> 4. **Derived Count Getter**: `wishlistCount` updates badge counts automatically across navigation icons.
> 
---

## 6. Related Terms

- [Pinia](pinia.md) — The parent state management library powering Pinia Store modules.
- [State & Getters (Pinia)](state_getters.md) — The data structures defined inside a store.
- [Actions (Pinia)](actions.md) — The functions defined inside a store.
- [State Management](state_management.md) — The overall frontend architecture pattern.
- [Composables](../level_05/composables.md) — Composition API logic functions sharing structural patterns with setup stores.

---

## 7. Key Takeaways

- A Pinia Store is an isolated, modular domain container defined via `defineStore('id', () => { ... })`.
- Modern stores use Setup Store syntax, matching Composition API functions.
- Every store in an application must have a unique string ID parameter.
- Remember to return all state, getter, and action properties that should be public.
- Use `storeToRefs()` when destructuring reactive state from a store instance.
