# Composition API

> **Level 1 — Core Concepts & Reactivity**
> The modern, standard paradigm for writing Vue.js components using imported functions to organize code by logical feature rather than component options.

---

## 1. Prerequisites

- [Options API](options_api.md) — Understanding the object-based legacy API clarifies why the Composition API was introduced.
- [Declarative Rendering](declarative_rendering.md) — The fundamental reactive rendering mechanism of Vue components.

---

## 2. Term Category

**Vue Architecture / Component Paradigm (Composition Model)**: The Composition API is Vue's primary API for component authoring in Vue 3. Instead of defining component logic via specialized option properties (`data`, `methods`, `computed`, `watch`), it exposes reactivity and lifecycle primitives directly as function imports. Executed during component setup, it leverages native JavaScript scoping and closures to structure component logic in client and server environments alike.

Unlike React's function components which re-execute the entire component body on every render and demand strict Hook call order rules (`useMemo`, `useCallback`), Vue's Composition API setup script executes **once** during component initialization. Its fine-grained Proxy reactivity tracks dependencies outside the rendering pipeline, preventing unnecessary function re-creations and parent-child re-render cascades.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In Vue 2's Options API, component logic was forced into rigid structural buckets: state in `data()`, methods in `methods`, computed state in `computed`, and side effects in `watch`. When building complex enterprise features—such as an interactive data table with search, pagination, and multi-column sorting—the code for a single logical feature was fragmented across four or five different options. Developers spent endless time scrolling back and forth through thousands of lines of code. Furthermore, sharing reusable logic between components relied on Mixins, which caused property name collisions, implicit dependencies, and opaque source origin.

The Composition API eliminates structural buckets. By exposing raw reactivity utilities (`ref`, `reactive`, `computed`, `watch`) as standalone functions, developers can colocate state, methods, and lifecycle hooks by feature. It also unlocks **Composables**—plain JavaScript functions that encapsulate stateful logic without the flaws of Mixins or Higher-Order Components.

### (2) Reality Metaphor
Imagine a modular workshop organized by project (Composition API) versus a workshop organized by tool type (Options API). 

In a tool-type workshop, all screwdrivers are in room A, all hammers in room B, and all glue in room C. To assemble a wooden chair, you must run between rooms for every single step. If you work on both a chair and a lamp simultaneously, chair parts and lamp parts get mixed together in every room. 

The Composition API gives you modular workbench stations. You create a dedicated "Chair Assembly Bench" containing only the exact screws, hammer, and wood required for the chair, and a separate "Lamp Station" right next to it. Everything needed for a single logical task is encapsulated in one dedicated workstation.

### (3) Vue Code Examples

#### Short Snippet
```vue
<script setup>
import { ref, computed } from 'vue'

const count = ref(0)
const doubleCount = computed(() => count.value * 2)

function increment() {
  count.value++
}
</script>

<template>
  <button @click="increment">Count: {{ count }} (Double: {{ doubleCount }})</button>
</template>
```

#### Fuller Example
```vue
<script setup>
import { ref, computed, watch } from 'vue'

// --- FEATURE 1: Search & Filter Logic ---
const searchQuery = ref('')
const searchResults = ref([])
const isSearching = ref(false)

const resultCount = computed(() => searchResults.value.length)

async function executeSearch(query) {
  if (!query.trim()) {
    searchResults.value = []
    return
  }
  isSearching.value = true
  try {
    const mockData = ['Vue 3 Composition API', 'Pinia State Management', 'Vite Bundler']
    searchResults.value = mockData.filter(item => item.toLowerCase().includes(query.toLowerCase()))
  } finally {
    isSearching.value = false
  }
}

watch(searchQuery, (newVal) => {
  executeSearch(newVal)
})

// --- FEATURE 2: Dark Mode Theme Toggle ---
const isDarkMode = ref(false)

function toggleTheme() {
  isDarkMode.value = !isDarkMode.value
}
</script>

<template>
  <div :class="{ 'dark-theme': isDarkMode }">
    <header>
      <button @click="toggleTheme">Toggle Theme</button>
    </header>

    <main>
      <input v-model="searchQuery" placeholder="Search tech stack..." />
      <span v-if="isSearching">Searching...</span>

      <ul>
        <li v-for="item in searchResults" :key="item">{{ item }}</li>
      </ul>
      <p>Total Results: {{ resultCount }}</p>
    </main>
  </div>
</template>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Omission of `.value` in JavaScript Logic

**The mistake:** Accessing or mutating a `ref` directly as a raw variable inside `<script setup>` (e.g., writing `count++` or `if (count === 5)`).

**Why it's wrong:** In the Composition API, `ref()` wraps primitive values inside an object container with a `.value` property so Vue can intercept reads and writes. Omitting `.value` inside JavaScript compares or mutates the `RefImpl` object instance itself rather than the underlying primitive.

*Incorrect:*
```javascript
const count = ref(0)
function increment() {
  count++ // ❌ NaN error: trying to increment an object!
}
```

*Fix:*
```javascript
const count = ref(0)
function increment() {
  count.value++ // Correctly mutates the inner primitive value
}
```

---

### Mistake 2: Destructuring Reactive Objects Without `toRefs`

**The mistake:** Destructuring properties directly from a `reactive()` object instance (`const { count } = state`).

**Why it's wrong:** Standard ES6 object destructuring extracts primitive value copies, severing the link to Vue's reactive proxy handler. Future updates to `state.count` will not trigger updates on `count`.

*Incorrect:*
```javascript
const state = reactive({ count: 0 })
const { count } = state // ❌ Reactivity connection severed!
```

*Fix:*
```javascript
import { reactive, toRefs } from 'vue'
const state = reactive({ count: 0 })
const { count } = toRefs(state) // Retains reactive ref binding
```

---

### Mistake 3: Attempting to Access `this` Inside `<script setup>`

**The mistake:** Referencing `this` to access variables or methods inside `<script setup>` functions.

**Why it's wrong:** `<script setup>` executes during the component setup phase before the component instance context is bound. In this context, `this` is `undefined`. Top-level variables and imported helpers are directly available in scope.

*Incorrect:*
```vue
<script setup>
import { ref } from 'vue'
const count = ref(0)
function increment() {
  this.count.value++ // ❌ TypeError: Cannot read properties of undefined
}
</script>
```

*Fix:*
```vue
<script setup>
import { ref } from 'vue'
const count = ref(0)
function increment() {
  count.value++ // Directly reference scoped variable
}
</script>
```

---

## 5. Practice Exercises

### Exercise 1: E-Commerce Shopping Cart Manager

**Scenario:** An e-commerce store needs a cart manager that tracks item quantities, calculates the total price dynamically, and applies a promotional discount code.
**Requirements:**
1. Maintain reactive `items` array with `{ id, name, price, quantity }`.
2. Compute `subtotal` and `total` (applying a 15% discount if `hasDiscount` is true).
3. Provide `addItem` and `toggleDiscount` functions.
4. Verify subtotal calculation with inline test assertions.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, computed } from 'vue'
> 
> const items = ref([
>   { id: 1, name: 'Mechanical Keyboard', price: 120, quantity: 1 },
>   { id: 2, name: 'Ergonomic Mouse', price: 80, quantity: 2 }
> ])
> const hasDiscount = ref(false)
> 
> const subtotal = computed(() => {
>   return items.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
> })
> 
> const total = computed(() => {
>   return hasDiscount.value ? subtotal.value * 0.85 : subtotal.value
> })
> 
> function addItem(newItem) {
>   items.value.push(newItem)
> }
> 
> function toggleDiscount() {
>   hasDiscount.value = !hasDiscount.value
> }
> 
> // Verification test assertions
> console.assert(subtotal.value === 280, `Expected subtotal 280, got ${subtotal.value}`)
> toggleDiscount()
> console.assert(total.value === 238, `Expected total 238, got ${total.value}`)
> </script>
> 
> <template>
>   <div>
>     <h2>Cart Subtotal: ${{ subtotal }}</h2>
>     <h2>Final Total: ${{ total.toFixed(2) }}</h2>
>     <button @click="toggleDiscount">Toggle 15% Discount</button>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **`ref()` wrapping**: The `items` array and `hasDiscount` boolean are wrapped in `ref()` to allow deep mutation tracking and re-assignment.
> 2. **Dependency graph auto-tracking**: `computed()` getters automatically subscribe to changes in `items.value` (including quantity changes) and `hasDiscount.value`.
> 3. **No `this` binding**: Functions operate directly on module-scoped reactive variables.
> 4. **Caching benefits**: Re-rendering the template will not recalculate `subtotal` or `total` unless items or discount state changes.
> 
---

### Exercise 2: Industrial IoT Temperature Sensor Monitor

**Scenario:** An IoT dashboard monitors industrial furnace temperatures in real time, triggering alert thresholds when temperatures exceed safe limits.
**Requirements:**
1. Store reactive `temperature` reading and `alertThreshold` limit.
2. Compute boolean `isCritical` status.
3. Include a `recordReading(newTemp)` function.
4. Verify alert triggering logic via test assertion.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, computed } from 'vue'
> 
> const temperature = ref(450) // Celsius
> const alertThreshold = ref(500)
> 
> const isCritical = computed(() => temperature.value > alertThreshold.value)
> 
> function recordReading(newTemp) {
>   temperature.value = newTemp
> }
> 
> // Assertion verification
> console.assert(isCritical.value === false, 'Should not be critical at 450C')
> recordReading(520)
> console.assert(isCritical.value === true, 'Should be critical at 520C')
> </script>
> 
> <template>
>   <div :class="{ critical: isCritical }">
>     <h3>Current Temperature: {{ temperature }}°C</h3>
>     <p v-if="isCritical">ALERT: Critical temperature threshold exceeded!</p>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Fine-grained updates**: Only elements referencing `isCritical` or `temperature` update when `recordReading` is called.
> 2. **Single-execution setup**: The `<script setup>` body executes only once on initialization, registering reactive dependencies.
> 3. **Template ref unwrapping**: In the template block, `temperature` and `isCritical` are accessed without `.value`.
> 4. **Encapsulated logic**: Sensor logic stays colocated without dividing state and methods into artificial options buckets.
> 
---

### Exercise 3: Real-Time Currency Exchange Converter

**Scenario:** A financial application converts base USD amounts into Target FX currencies using live rates.
**Requirements:**
1. Track `usdAmount` and `exchangeRate` using `ref`.
2. Compute `convertedAmount` using `computed`.
3. Update rates dynamically via `setRate(rate)`.
4. Validate conversion accuracy via assertion.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, computed } from 'vue'
> 
> const usdAmount = ref(100)
> const exchangeRate = ref(0.92) // USD to EUR rate
> 
> const convertedAmount = computed(() => {
>   return (usdAmount.value * exchangeRate.value).toFixed(2)
> })
> 
> function updateRate(newRate) {
>   exchangeRate.value = newRate
> }
> 
> // Assertion verification
> console.assert(convertedAmount.value === '92.00', `Expected 92.00, got ${convertedAmount.value}`)
> updateRate(0.95)
> console.assert(convertedAmount.value === '95.00', `Expected 95.00, got ${convertedAmount.value}`)
> </script>
> 
> <template>
>   <div>
>     <label>USD: <input v-model.number="usdAmount" type="number" /></label>
>     <p>Converted EUR: {{ convertedAmount }}</p>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Primitive tracking**: Primitives like numbers are proxied via `ref()`.
> 2. **Composition decoupling**: Calculation rules are expressed cleanly as pure getters within `computed()`.
> 3. **Reactivity propagation**: Mutating `usdAmount.value` or `exchangeRate.value` automatically marks `convertedAmount` dirty for recalculation.
> 4. **No Options API boilerplate**: Eliminates export default objects, data functions, and methods containers.
> 
---

## 6. Related Terms

- [`ref`](../level_02/ref.md) — The fundamental reactive reference primitive used inside script setup.
- [Composables](../level_05/composables.md) — Reusable, stateful logic functions enabled by the Composition API.
- [`<script setup>` & Compiler Macros](../level_04/script_setup.md) — Ergonomic compile-time syntactic sugar for writing Composition API.
- [Options API](options_api.md) — The legacy component paradigm replaced by Composition API.

---

## 7. Key Takeaways

- The **Composition API** structures component code by logical feature rather than framework option categories (`data`, `methods`, `computed`).
- Functions in `<script setup>` run **once** during component initialization, avoiding React's hook re-execution tax.
- Reactive primitives defined via `ref()` must be accessed via `.value` inside JavaScript, but are automatically unwrapped inside template expressions.
- Code reuse is achieved cleanly through **Composables** without property collisions or implicit context issues.
