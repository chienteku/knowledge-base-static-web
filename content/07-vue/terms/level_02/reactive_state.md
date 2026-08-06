# Reactive State

> **Level 2 — Reactivity System**
> Component data actively monitored by Vue's reactivity system, which automatically triggers targeted Virtual DOM patches whenever state changes.

---

## 1. Prerequisites

- [Declarative Rendering](../level_01/declarative_rendering.md) — The UI concept powered by reactive state tracking.
- [DOM (Document Object Model)](../../../01-html/terms/level_09/dom.md) — The DOM structure updated by reactive state changes.

---

## 2. Term Category

**Vue Core Concept / Reactivity Architecture (Observer-Subscriber Graph)**: Reactive State refers to JavaScript variables wrapped in Vue's reactivity tracking system (via `ref()`, `reactive()`, or `computed()`). In Vue 3, reactive state uses ES6 Proxies to observe property reads and writes across component render functions, watchers, and computed getters.

Unlike traditional frontend state models that require manual DOM queries or forced full-tree component re-renders, Vue's reactive state maintains a fine-grained **Dependency Graph**. When reactive state mutates in client components or server setup contexts, Vue identifies the exact subscriber components and DOM text nodes that depend on that state, flushing minimal DOM patches microtask-by-microtask.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In standard native JavaScript, variables are static values. If you define `let price = 100` and display it inside an HTML paragraph `<p id="price-display">100</p>`, updating `price = 120` in JavaScript does absolutely nothing to the screen. The paragraph node has no mechanism to know the variable changed. Developers had to write imperative DOM glue code (`document.getElementById('price-display').innerText = price`).

Vue eliminates DOM glue code by introducing **Reactive State**. When data is declared as reactive, Vue attaches getter/setter trap alarms to it:
1. **Dependency Collection (Track)**: When a template reads a reactive variable during rendering, Vue registers the component render function as a subscriber.
2. **Notification & Flush (Trigger)**: When the variable mutates, Vue triggers notifications specifically to subscribed components, batching DOM update jobs asynchronously.

In contrast to React (where `setState` re-executes the *entire* component function from top to bottom), Vue's reactive state **knows exactly who relies on it**. Modifying a single `ref` inside a component containing 50 paragraphs updates ONLY the single text node bound to that `ref`.

### (2) Reality Metaphor
Think of an Automated Stock Ticker Display (Reactive State) versus writing stock prices on a physical chalkboard (Plain JS Variable).

With a physical chalkboard (Plain Variable), if the stock price changes, the broker must stand up, walk over to the board with an eraser, erase the old number, and write the new price by hand.

With an Automated Stock Ticker Display (Reactive State), the digital display board is electronically wired to the stock market ticker feed. The instant a stock price ticks up by $1, the display board flashes and updates the number automatically. The broker never touches the display.

### (3) Vue Code Examples

#### Short Snippet
```vue
<script setup>
import { ref } from 'vue'

// Reactive state primitive
const count = ref(0)

function increment() {
  // Mutating reactive state automatically triggers DOM update
  count.value++
}
</script>

<template>
  <button @click="increment">Clicks: {{ count }}</button>
</template>
```

#### Fuller Example
```vue
<script setup>
import { ref, reactive, computed } from 'vue'

// Reactive state using ref for primitives and reactive for objects
const searchQuery = ref('')
const state = reactive({
  isLoading: false,
  items: [
    { id: 1, name: 'Server Rack A1', status: 'Online' },
    { id: 2, name: 'Database Node B2', status: 'Maintenance' }
  ]
})

const filteredItems = computed(() => {
  return state.items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

function toggleStatus(item) {
  item.status = item.status === 'Online' ? 'Maintenance' : 'Online'
}
</script>

<template>
  <div class="system-monitor">
    <input v-model="searchQuery" placeholder="Filter nodes..." />
    
    <ul>
      <li v-for="item in filteredItems" :key="item.id">
        <span>{{ item.name }} - Status: {{ item.status }}</span>
        <button @click="toggleStatus(item)">Toggle Status</button>
      </li>
    </ul>
  </div>
</template>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Expecting Standard JavaScript `let`/`const` Variables to Be Reactive

**The mistake:** Declaring plain JavaScript variables inside `<script setup>` (e.g., `let count = 0`) and attempting to update the UI by incrementing `count++`.

**Why it's wrong:** Vue cannot track reads or writes on plain JavaScript primitive variables. Incrementing `count` updates the variable in memory, but no dependency notification is emitted, leaving the HTML UI stuck permanently.

*Incorrect:*
```javascript
let count = 0 // ❌ Plain JS variable is not reactive!
function increment() {
  count++ // UI will not update!
}
```

*Fix:*
```javascript
const count = ref(0) // Wrap variable in Vue reactive proxy
function increment() {
  count.value++ // Triggers automated UI DOM update
}
```

---

### Mistake 2: Accessing Global Module-Scoped Reactive State Outside Setup Scope (SSR Leak Risk)

**The mistake:** Declaring `export const globalState = reactive({ user: null })` at the top level of a JavaScript module file.

**Why it's wrong:** Module-scoped state initialized outside component setup contexts persists across Node.js server memory during Server-Side Rendering (SSR). Requests from User A will contaminate state shared with User B, causing severe security leaks.

*Incorrect:*
```javascript
// Module root scope
export const sharedUser = reactive({ loggedIn: false }) // ❌ Shared state memory leak across SSR requests!
```

*Fix:*
```javascript
// Wrap state inside Pinia stores or composables initialized per component/request context
export const useUserStore = defineStore('user', () => {
  const loggedIn = ref(false)
  return { loggedIn }
})
```

---

### Mistake 3: Overwriting Plain Object Properties on Non-Reactive References

**The mistake:** Storing plain object references in local variables and mutating nested properties without Vue reactivity wrappers.

**Why it's wrong:** Vue's tracking requires reactive proxies (`ref` or `reactive`). Mutating plain objects bypasses getter/setter traps.

*Incorrect:*
```javascript
const user = { name: 'Alice' } // Plain object
function updateName() {
  user.name = 'Bob' // ❌ UI does not re-render!
}
```

*Fix:*
```javascript
const user = ref({ name: 'Alice' }) // Reactive proxy
function updateName() {
  user.value.name = 'Bob' // Triggers UI re-render
}
```

---

## 5. Practice Exercises

### Exercise 1: E-Commerce Dynamic Cart Inventory State Manager

**Scenario:** An e-commerce cart uses reactive state to track quantities and dynamically alert when item stock limits are reached.
**Requirements:**
1. Declare `cartState` using `reactive()` containing `quantity` and `maxStock`.
2. Implement `incrementQuantity()` checking `quantity < maxStock`.
3. Compute boolean `isMaxed`.
4. Validate boundary state mutations via test assertions.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { reactive, computed } from 'vue'
> 
> const cartState = reactive({
>   quantity: 1,
>   maxStock: 5
> })
> 
> const isMaxed = computed(() => cartState.quantity >= cartState.maxStock)
> 
> function incrementQuantity() {
>   if (cartState.quantity < cartState.maxStock) {
>     cartState.quantity++
>   }
> }
> 
> // Test assertions
> console.assert(cartState.quantity === 1, 'Initial quantity should be 1')
> console.assert(isMaxed.value === false, 'Should not be maxed initially')
> cartState.quantity = 5
> console.assert(isMaxed.value === true, 'Should be maxed at 5 units')
> incrementQuantity() // Should not exceed 5
> console.assert(cartState.quantity === 5, 'Quantity should stay capped at 5')
> </script>
> 
> <template>
>   <div>
>     <p>Quantity: {{ cartState.quantity }} / {{ cartState.maxStock }}</p>
>     <button :disabled="isMaxed" @click="incrementQuantity">Add More</button>
>     <span v-if="isMaxed">Max stock reached!</span>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Reactive proxy encapsulation**: `cartState` tracks mutations to `quantity` through proxy traps.
> 2. **Surgical DOM patching**: Mutating `cartState.quantity` updates only the text node and button disabled state.
> 3. **Computed integration**: `isMaxed` re-evaluates automatically when `quantity` mutates.
> 4. **Encapsulated business rules**: Guard logic prevents invalid state values.
> 
---

### Exercise 2: Industrial IoT Factory Sensor Array Reactive Telemetry

**Scenario:** An IoT dashboard tracks machine vibration sensors using reactive state arrays.
**Requirements:**
1. Track `sensorReadings` reactive array ref.
2. Provide `pushReading(val)` function appending values.
3. Compute `averageVibration`.
4. Validate array mutation reactivity via assertions.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, computed } from 'vue'
> 
> const sensorReadings = ref([12, 14, 15])
> 
> const averageVibration = computed(() => {
>   if (sensorReadings.value.length === 0) return 0
>   const sum = sensorReadings.value.reduce((a, b) => a + b, 0)
>   return sum / sensorReadings.value.length
> })
> 
> function pushReading(val) {
>   sensorReadings.value.push(val)
> }
> 
> // Verification assertion
> console.assert(averageVibration.value === 13.666666666666666, 'Average should compute correctly')
> pushReading(27)
> console.assert(averageVibration.value === 17, `Expected average 17, got ${averageVibration.value}`)
> </script>
> 
> <template>
>   <div>
>     <p>Average Sensor Telemetry: {{ averageVibration.toFixed(2) }} Hz</p>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Array mutation tracking**: Vue proxies array prototype methods (`push`, `pop`, `splice`) to notify subscribers.
> 2. **Fine-grained dependency tracking**: Only components reading `sensorReadings` or `averageVibration` re-render.
> 3. **No manual DOM patching**: The paragraph node updates automatically when readings append.
> 4. **Primitive array handling**: `ref()` handles arrays cleanly with `.value` pointer support.
> 
---

### Exercise 3: Financial Currency Trading Ledger Reactive State

**Scenario:** A financial trading ledger uses reactive state objects to track portfolio equity and margin calls.
**Requirements:**
1. Declare `reactive()` `portfolio` with `equity` and `marginRequired`.
2. Compute `marginLevel` ratio (`equity / marginRequired * 100`).
3. Compute `isMarginCall` boolean (`marginLevel < 100`).
4. Validate margin call logic via assertions.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { reactive, computed } from 'vue'
> 
> const portfolio = reactive({
>   equity: 15000,
>   marginRequired: 10000
> })
> 
> const marginLevel = computed(() => (portfolio.equity / portfolio.marginRequired) * 100)
> const isMarginCall = computed(() => marginLevel.value < 100)
> 
> function applyMarketLoss(lossAmount) {
>   portfolio.equity -= lossAmount
> }
> 
> // Test assertion
> console.assert(marginLevel.value === 150, 'Initial margin level 150%')
> console.assert(isMarginCall.value === false, 'No margin call initially')
> applyMarketLoss(6000) // Equity drops to 9000
> console.assert(marginLevel.value === 90, 'Margin level drops to 90%')
> console.assert(isMarginCall.value === true, 'Margin call triggered')
> </script>
> 
> <template>
>   <div>
>     <p>Equity: ${{ portfolio.equity }} | Margin Level: {{ marginLevel.toFixed(0) }}%</p>
>     <h3 v-if="isMarginCall" class="alert">MARGIN CALL WARNING!</h3>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Data-driven state graph**: `isMarginCall` derives from `marginLevel` which derives from `portfolio.equity`.
> 2. **Cascade notifications**: Mutating `portfolio.equity` triggers recalculation down the dependency tree.
> 3. **No manual event emitters**: State relationships are expressed purely via computed getters.
> 4. **High execution efficiency**: Unaffected components in the DOM tree do not re-render.
> 
---

## 6. Related Terms

- [`ref`](ref.md) — The reactivity API function for primitive values.
- [`reactive`](reactive.md) — The reactivity API function for objects and arrays.
- [Declarative Rendering](../level_01/declarative_rendering.md) — The core UI principle driven by reactive state.
- [Proxy Reactivity](../level_08/proxy_reactivity.md) — The ES6 mechanism powering Vue 3's reactive state.

---

## 7. Key Takeaways

- **Reactive State** is data monitored by Vue's Proxy system that automatically triggers targeted Virtual DOM patches on mutation.
- Standard JavaScript variables (`let`, `const`) do NOT trigger UI updates.
- Vue automatically tracks dependencies during rendering, knowing exactly which DOM elements rely on which reactive variables.
- Unlike React, Vue does not re-render whole component trees on state changes, avoiding manual memoization wrappers.
- Never declare shared reactive state at the top level of JavaScript modules to avoid SSR memory leak bugs.
