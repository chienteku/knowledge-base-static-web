# Pinia

> **Level 7 — State Management & Pinia**
> The official State Management library for modern Vue.js, providing modular reactive stores with zero mutations and native TypeScript support.

---

## 1. Prerequisites

- [State Management](state_management.md) — The central state management architectural concept that Pinia implements.
- [Composition API](../level_01/composition_api.md) — The functional programming pattern and reactivity model Pinia natively mirrors.

---

## 2. Term Category

**Vue Ecosystem Core Library (Modular Application State Management)**: Pinia is the standard state management solution for Vue 3 applications, replacing legacy Vuex. Operating across both client-side Single-Page Applications (SPAs) and Server-Side Rendered (SSR) Nuxt applications, Pinia acts as a centralized repository for reactive state, computed getters, and imperative actions.

Unlike monolithic state trees in older frameworks (such as Vuex or classic Redux), Pinia establishes a decentralized multi-store model. Developers create independent, self-contained store modules (such as `useUserStore()` or `useCartStore()`) that can be instantiated anywhere within component lifecycle hooks, composables, or router guards. Pinia integrates deeply with Vue DevTools, enabling time-travel debugging, action tracking, and automatic Hot Module Replacement (HMR) without page reloads.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In Vue 2, state management was dominated by Vuex 3/4. While Vuex fulfilled the need for shared state, its architecture inherited heavy ceremony from Redux: global state trees required rigid separation between synchronous "mutations" and asynchronous "actions", string-based dispatching (`store.dispatch('user/fetch')`), and verbose module nesting. Crucially, Vuex was designed before TypeScript popularity explosion, resulting in notoriously difficult type safety setups where state property types could not be inferred automatically.

With Vue 3 and the Composition API, the core Vue team created Pinia to provide an ergonomic, intuitive alternative. Pinia eliminated mutations entirely, allowing direct state assignment or setup-store function modifications. By adopting Composition API primitives (`ref`, `computed`), Pinia stores are written identically to standard Vue composable functions, enabling TypeScript to infer state types, getter return types, and action signatures out of the box without manual interfaces.

### (2) Reality Metaphor
Imagine a sprawling corporate office building. In a monolithic state model (Vuex), all files and tools in the entire building are kept in one single, massive basement archive room managed by a single strict librarian who forces you to fill out pink slips (mutations) to touch any document.

Pinia replaces that monolithic archive with specialized satellite department desks (modular stores) on each floor. The Sales team has their own desk (`useSalesStore`), HR has theirs (`useHrStore`), and Engineering has theirs. Employees (Vue components) go directly to the relevant floor desk to read files or request updates. Desks operate independently but can intercom each other when necessary, streamlining workflow and eliminating bottleneck queues.

### (3) Vue Code Examples

#### Short Snippet
```vue
<script setup>
import { createApp } from 'vue'
import { createPinia, defineStore } from 'pinia'

// 1. Initialize Pinia plugin
const pinia = createPinia()

// 2. Define a minimal Setup Store
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

// Define modular Setup Store for user settings
export const useSettingsStore = defineStore('settings', () => {
  const theme = ref('dark')
  const notificationsEnabled = ref(true)
  const fontSize = ref(14)

  const isDarkMode = computed(() => theme.value === 'dark')

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  function updateFontSize(newSize) {
    if (newSize >= 10 && newSize <= 24) {
      fontSize.value = newSize
    }
  }

  return { theme, notificationsEnabled, fontSize, isDarkMode, toggleTheme, updateFontSize }
})

// Component Usage
const settingsStore = useSettingsStore()
// Destructure reactive state safely using storeToRefs
const { theme, fontSize, isDarkMode } = storeToRefs(settingsStore)
// Action functions can be destructured directly
const { toggleTheme, updateFontSize } = settingsStore
</script>

<template>
  <div :class="['settings-panel', theme]">
    <h3>User Preferences (Current Theme: {{ theme }})</h3>
    <button @click="toggleTheme">Switch to {{ isDarkMode ? 'Light' : 'Dark' }} Mode</button>
    
    <div class="font-control">
      <label>Font Size: {{ fontSize }}px</label>
      <button @click="updateFontSize(fontSize - 1)">-</button>
      <button @click="updateFontSize(fontSize + 1)">+</button>
    </div>
  </div>
</template>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Destructuring State directly without `storeToRefs()`
**The mistake:** Extracting state variables directly from a store instance using standard ES6 object destructuring (`const { count } = useCounterStore()`).

**Why it's wrong:** Pinia stores are wrapped in reactive Proxy objects. Direct destructuring extracts primitive copies, severing Vue's reactive dependency tracking. Modifying the store will not update the destructured variable. Wrap the store in `storeToRefs(store)` to preserve reactive ref bindings.

*Incorrect:*
```javascript
const store = useCounterStore()
const { count } = store // ❌ Reactivity broken! count is a static primitive copy
```

*Fix:*
```javascript
import { storeToRefs } from 'pinia'
const store = useCounterStore()
const { count } = storeToRefs(store) // Preserves reactive ref binding
const { increment } = store // Functions/actions can be destructured directly
```

---

### Mistake 2: Instantiating Stores outside Vue app lifecycle (Before Pinia installation)
**The mistake:** Calling a store function `useUserStore()` in global JS module scope before `app.use(createPinia())` executes.

**Why it's wrong:** Pinia stores rely on the active Pinia plugin instance injected into the Vue app. Calling store instantiators at top-level module import time throws runtime `getActivePinia() was called with no active Pinia` errors.

*Incorrect:*
```javascript
// Top-level module scope in router.js or api.js
const userStore = useUserStore() // ❌ Executes before app.use(pinia)!
```

*Fix:*
```javascript
// Call store instantiators inside functions (router guards, composables, lifecycle hooks)
router.beforeEach((to, from) => {
  const userStore = useUserStore() // Safe: Executed after plugin registration
})
```

---

### Mistake 3: Re-introducing Vuex Mutations into Pinia Stores
**The mistake:** Creating artificial `mutations` objects inside Pinia setup stores or requiring explicit commit methods to alter state.

**Why it's wrong:** Pinia was specifically designed without mutations to eliminate boilerplate. State can be mutated directly from actions, `$patch()` calls, or component handlers.

*Incorrect:*
```javascript
// Over-engineering Vuex patterns into Pinia
export const useUserStore = defineStore('user', {
  state: () => ({ name: '' }),
  actions: {
    SET_NAME(name) { this.name = name }, // Unnecessary mutation wrapper
    fetchUser() { this.SET_NAME('Alice') }
  }
})
```

*Fix:*
```javascript
export const useUserStore = defineStore('user', () => {
  const name = ref('')
  function fetchUser() {
    name.value = 'Alice' // Direct assignment inside setup action
  }
  return { name, fetchUser }
})
```

---

## 5. Practice Exercises

### Exercise 1: Fintech Multi-Currency Exchange Store
**Scenario:** A financial analytics app requires a global Pinia store to manage user wallet balances across multiple currencies (USD, EUR, JPY) and perform conversion calculations.

**Requirements:**
1. Create a `useWalletStore` setup store with `balances` reactive object `{ USD: 1000, EUR: 500, JPY: 50000 }`.
2. Maintain `exchangeRates` reactive object relative to USD.
3. Provide a getter `totalValueInUSD` calculating net worth in USD.
4. Implement an action `transferFunds(fromCurrency, toCurrency, amount)` with balance checks.

> [!check]- Answer
>
> #### Implementation
> ```javascript
> import { defineStore } from 'pinia'
> import { ref, computed } from 'vue'
> 
> export const useWalletStore = defineStore('wallet', () => {
>   const balances = ref({ USD: 1000, EUR: 500, JPY: 50000 })
>   const exchangeRates = ref({ USD: 1.0, EUR: 1.08, JPY: 0.0067 })
> 
>   const totalValueInUSD = computed(() => {
>     return Object.entries(balances.value).reduce((sum, [curr, amount]) => {
>       const rate = exchangeRates.value[curr] || 1.0
>       return sum + (amount * rate)
>     }, 0)
>   })
> 
>   function transferFunds(fromCurr, toCurr, amount) {
>     if (!balances.value[fromCurr] || balances.value[fromCurr] < amount) {
>       throw new Error(`Insufficient funds in ${fromCurr}`)
>     }
>     const rateFrom = exchangeRates.value[fromCurr]
>     const rateTo = exchangeRates.value[toCurr]
>     const convertedAmount = (amount * rateFrom) / rateTo
> 
>     balances.value[fromCurr] -= amount
>     balances.value[toCurr] = (balances.value[toCurr] || 0) + convertedAmount
>   }
> 
>   return { balances, exchangeRates, totalValueInUSD, transferFunds }
> })
> ```
>
> #### Technical Explanation
> 1. **Modular Setup Store**: `defineStore` uses Composition API setup syntax returning refs, computed getters, and methods.
> 2. **Computed Aggregation**: `totalValueInUSD` automatically tracks dependencies (`balances` and `exchangeRates`) and recalculates dynamically upon mutation.
> 3. **Proxy State Mutation**: `transferFunds` modifies nested object properties directly, which Pinia proxy reactivity handles seamlessly.
> 4. **Encapsulated Exchange Logic**: Currency conversion math is encapsulated inside the store action, keeping UI components clean.
> 
---

### Exercise 2: Real-Time Fleet Management Telemetry Store
**Scenario:** A logistics tracking platform needs a Pinia store to monitor vehicle coordinates, connection status, and emergency alerts from an IoT socket stream.

**Requirements:**
1. Define state `vehicles` Map or Object indexed by vehicle ID.
2. Implement action `updateTelemetry(vehicleId, payload)` that updates vehicle position and status.
3. Provide getter `activeAlerts` returning array of vehicles with status `'emergency'`.
4. Provide action `$resetStore()` to clear telemetry when operator logs out.

> [!check]- Answer
>
> #### Implementation
> ```javascript
> import { defineStore } from 'pinia'
> import { ref, computed } from 'vue'
> 
> export const useFleetStore = defineStore('fleet', () => {
>   const vehicles = ref({})
> 
>   const activeAlerts = computed(() => {
>     return Object.values(vehicles.value).filter(v => v.status === 'emergency')
>   })
> 
>   function updateTelemetry(vehicleId, payload) {
>     vehicles.value[vehicleId] = {
>       ...(vehicles.value[vehicleId] || {}),
>       ...payload,
>       lastUpdated: Date.now()
>     }
>   }
> 
>   function resetStore() {
>     vehicles.value = {}
>   }
> 
>   return { vehicles, activeAlerts, updateTelemetry, resetStore }
> })
> ```
>
> #### Technical Explanation
> 1. **Dynamic Key Assignment**: Updating reactive `vehicles` dictionary keys triggers reactivity downstream for watching map components.
> 2. **Filtered Computed Getters**: `activeAlerts` provides cached filtered arrays without re-querying across UI components.
> 3. **Manual Store Reset**: Custom `resetStore` action provides clean reset capability for setup store state.
> 4. **Socket Ingestion Ready**: `updateTelemetry` can be passed directly as a socket payload listener callback.
> 
---

### Exercise 3: E-Commerce Session & Cart Synchronization Store
**Scenario:** An online store needs to persist cart state to `localStorage` using Pinia's `$subscribe` mechanism and sync guest cart items upon login.

**Requirements:**
1. Define state `cartItems` array in `useCartStore`.
2. Subscribe to store mutations using `$subscribe` to mirror cart state into `localStorage`.
3. Provide an action `syncGuestCart(guestItems)` that merges non-duplicate items into active cart.
4. Export store instance for consumption in components.

> [!check]- Answer
>
> #### Implementation
> ```javascript
> import { defineStore } from 'pinia'
> import { ref } from 'vue'
> 
> export const useCartStore = defineStore('cart', () => {
>   const cartItems = ref(JSON.parse(localStorage.getItem('cart_cache') || '[]'))
> 
>   function syncGuestCart(guestItems) {
>     guestItems.forEach(guestItem => {
>       const exists = cartItems.value.some(item => item.id === guestItem.id)
>       if (!exists) {
>         cartItems.value.push(guestItem)
>       }
>     })
>   }
> 
>   return { cartItems, syncGuestCart }
> })
> 
> // Enable persistence via Pinia subscription outside or inside plugin
> const store = useCartStore()
> store.$subscribe((mutation, state) => {
>   localStorage.setItem('cart_cache', JSON.stringify(state.cartItems))
> })
> ```
>
> #### Technical Explanation
> 1. **State Hydration**: Initial `ref` state reads directly from browser `localStorage` fallbacks during initialization.
> 2. **Pinia Mutation Subscription**: `store.$subscribe` listens to all state changes across all actions and auto-persists updates.
> 3. **Array Deduplication**: `syncGuestCart` action merges guest items cleanly while maintaining reactive tracking.
> 4. **Decoupled Persistence**: UI components invoke cart actions without needing to manage `localStorage` key serialization.
> 
---

## 6. Related Terms

- [Store (Pinia)](store.md) — The individual store files created using Pinia's `defineStore`.
- [State Management](state_management.md) — The global architectural paradigm implemented by Pinia.
- [Composables](../level_05/composables.md) — Component-decoupled Composition API functions that share structural patterns with setup stores.
- [Provide / Inject](../level_05/provide_inject.md) — Vue's built-in dependency injection system used internally by Pinia.
- [Vue DevTools](../level_10/vue_devtools.md) — Developer tools providing state inspection and time-travel debugging for Pinia.

---

## 7. Key Takeaways

- Pinia is the official, recommended state management library for Vue 3, completely replacing legacy Vuex.
- Pinia stores use a modular multi-store architecture rather than a single monolithic state tree.
- Mutations are removed; state is mutated directly or within actions using standard Composition API syntax.
- Use `storeToRefs()` when destructuring reactive state from a store to prevent losing reactivity.
- Always instantiate Pinia via `app.use(createPinia())` before invoking store functions in application code.
