# Watchers

> **Level 2 — Reactivity System**
> Explicit reactivity observation functions that monitor target reactive data sources and execute imperative side effects when monitored sources change.

---

## 1. Prerequisites

- [Reactive State](reactive_state.md) — The reactive data sources observed by watchers.
- [Computed Properties](computed_properties.md) — The declarative derived data engine (which watchers should NOT be misused for).

---

## 2. Term Category

**Vue Reactivity API / Side Effect Monitor (Explicit Reactive Observer)**: Watchers (invoked via `watch()`) are Vue's primary API for observing specific reactive sources (`ref`, `reactive` object, computed ref, or getter function) and running imperative side effects when changes occur.

Unlike `computed()`, which returns cached values and forbids side effects, `watch()` is designed explicitly for executing asynchronous operations, network requests, localStorage sync, or direct DOM manipulation. Executing lazily by default (running only when the target source changes), `watch()` provides access to both `newValue` and `oldValue` parameters.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
[Computed Properties](computed_properties.md) are ideal for calculating derived data synchronously. However, computed getters strictly forbid side effects (mutating external state, issuing network requests, or starting timers).

Consider a search input field (`const searchId = ref(5)`). When a user types a new ID into the search bar, the application needs to issue an asynchronous HTTP GET request to a remote server (`/api/users/5`). You cannot issue async network requests inside a computed property getter. You need an explicit mechanism to declare: *"Keep an eye specifically on `searchId`. The exact moment it changes, run this async network request function, and pass me both the new ID and the previous ID."*

Vue introduced **`watch()`** to satisfy this requirement. It grants explicit, precise control over:
1. **Target Sources**: Watch single refs, arrays of refs, or specific object property getter functions (`() => state.count`).
2. **Lazy Execution**: Does not run initially unless configured with `{ immediate: true }`.
3. **Change Parameters**: Passes both `(newValue, oldValue)` to the callback handler.
4. **Deep Monitoring**: Supports deep nested object traversal via `{ deep: true }`.

### (2) Reality Metaphor
Think of an Express Delivery Tracking Notification Service (`watch()`) versus checking your physical mailbox every hour.

Instead of walking out to your mailbox 24 times a day to see if a package arrived, you sign up for Express Delivery Notifications (`watch()`). You instruct the delivery service: *"Watch package tracking number #9921. The moment its status changes from 'In Transit' to 'Delivered', send me a text message containing both the old status and the new status."*

The notification service stays dormant. It does nothing until the package status actually changes, whereupon it fires your custom notification handler.

### (3) Vue Code Examples

#### Short Snippet
```vue
<script setup>
import { ref, watch } from 'vue'

const searchQuery = ref('')
const searchCount = ref(0)

// Explicit watch monitoring searchQuery ref
watch(searchQuery, (newQuery, oldQuery) => {
  console.log(`Query changed from "${oldQuery}" to "${newQuery}"`)
  searchCount.value++
})
</script>

<template>
  <input v-model="searchQuery" placeholder="Type query..." />
  <p>Search executions: {{ searchCount }}</p>
</template>
```

#### Fuller Example
```vue
<script setup>
import { ref, reactive, watch } from 'vue'

const selectedUserId = ref(1)
const userProfile = ref(null)
const isFetching = ref(false)

const filters = reactive({
  category: 'All',
  sortBy: 'name'
})

// 1. Watching a primitive ref for async API calls
watch(selectedUserId, async (newId) => {
  isFetching.value = true
  try {
    const res = await fetch(`https://jsonplaceholder.typicode.com/users/${newId}`)
    userProfile.value = await res.json()
  } finally {
    isFetching.value = false
  }
}, { immediate: true }) // immediate: true runs callback on setup!

// 2. Watching a specific property getter on a reactive object
watch(() => filters.category, (newCategory) => {
  console.log(`Category filter updated to: ${newCategory}`)
})

// 3. Deep watching an entire object using { deep: true }
watch(filters, (newFilters) => {
  console.log('Filters object deeply modified:', newFilters)
}, { deep: true })
</script>

<template>
  <div class="user-viewer">
    <select v-model.number="selectedUserId">
      <option :value="1">User #1</option>
      <option :value="2">User #2</option>
    </select>

    <div v-if="isFetching">Fetching profile...</div>
    <pre v-else-if="userProfile">{{ userProfile }}</pre>
  </div>
</template>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Misusing Watchers to Compute Derived State (Replacing `computed()`)

**The mistake:** Manually updating a derived state variable inside a watcher callback (e.g. watching `firstName` and `lastName` to update `fullName.value`).

**Why it's wrong:** Using watchers for data derivation requires creating extra state variables and writing redundant tracking code. It bypasses computed caching optimizations, resulting in verbose, bug-prone code.

*Incorrect:*
```javascript
const firstName = ref('John')
const lastName = ref('Doe')
const fullName = ref('')

watch([firstName, lastName], ([first, last]) => {
  fullName.value = `${first} ${last}` // ❌ Verbose watcher state sync!
})
```

*Fix:*
```javascript
const firstName = ref('John')
const lastName = ref('Doe')
// Use computed property for derived state!
const fullName = computed(() => `${firstName.value} ${lastName.value}`)
```

---

### Mistake 2: Watching Reactive Object Properties Directly Without a Getter Function

**The mistake:** Passing a reactive object property value directly to `watch()` (e.g. `watch(state.count, (val) => ...)` where `state` is `reactive({ count: 0 })`).

**Why it's wrong:** `state.count` evaluates to the raw primitive number `0`. Passing raw numbers to `watch()` throws a runtime warning (`Invalid watch source: A watch source can only be a getter function, a ref, a reactive object, or an array of these`).

*Incorrect:*
```javascript
const state = reactive({ count: 0 })
watch(state.count, (val) => {}) // ❌ Warning: Invalid watch source!
```

*Fix:*
```javascript
const state = reactive({ count: 0 })
watch(() => state.count, (val) => {}) // Wrap property access in a getter function
```

---

### Mistake 3: Expecting `newValue` and `oldValue` to Be Different When Deep Watching Reactive Objects

**The mistake:** Deeply watching a `reactive()` object and comparing `newValue` against `oldValue` expecting distinct object values.

**Why it's wrong:** When watching a reactive object, `newValue` and `oldValue` point to the **exact same underlying Proxy object reference**. Therefore, `newValue === oldValue`, making reference comparisons return true.

*Incorrect:*
```javascript
watch(state, (newVal, oldVal) => {
  console.log(newVal.count === oldVal.count) // ❌ Always true! Same object reference!
})
```

*Fix:*
```javascript
// Watch a specific property getter to receive distinct primitive new/old values:
watch(() => state.count, (newVal, oldVal) => {
  console.log(`Changed from ${oldVal} to ${newVal}`) // Distinct primitive values!
})
```

---

## 5. Practice Exercises

### Exercise 1: E-Commerce Currency Rate FX Watcher

**Scenario:** An e-commerce checkout page observes `selectedCurrency` and fetches live FX rates from a remote API.
**Requirements:**
1. Track `selectedCurrency` ref (`'USD'`).
2. Write `watch()` observing `selectedCurrency` with `{ immediate: true }`.
3. Update `exchangeRate` ref based on target currency.
4. Validate FX rate updates via test assertions.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, watch } from 'vue'
> 
> const selectedCurrency = ref('USD')
> const exchangeRate = ref(1.0)
> let fetchCallCount = 0
> 
> const mockFxApi = {
>   USD: 1.0,
>   EUR: 0.92,
>   GBP: 0.79
> }
> 
> watch(selectedCurrency, (newCurrency) => {
>   fetchCallCount++
>   exchangeRate.value = mockFxApi[newCurrency] || 1.0
> }, { immediate: true }) // immediate: true runs watcher callback synchronously on setup
> 
> // Test assertions
> console.assert(fetchCallCount === 1, 'Watcher should execute immediately on setup')
> console.assert(exchangeRate.value === 1.0, 'Initial rate should be 1.0 for USD')
> selectedCurrency.value = 'EUR'
> console.assert(fetchCallCount === 2, 'Watcher should execute on currency change')
> console.assert(exchangeRate.value === 0.92, `Expected 0.92 EUR rate, got ${exchangeRate.value}`)
> </script>
> 
> <template>
>   <div>
>     <select v-model="selectedCurrency">
>       <option value="USD">USD</option>
>       <option value="EUR">EUR</option>
>       <option value="GBP">GBP</option>
>     </select>
>     <p>Current FX Rate: {{ exchangeRate }}</p>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **`{ immediate: true }` option**: Forces the watcher callback to run immediately upon setup to initialize state.
> 2. **Explicit ref target**: Watching `selectedCurrency` directly targets the ref without getter functions.
> 3. **Side effect execution**: Imperatively updates `exchangeRate.value` in response to user selection changes.
> 4. **No computed misuse**: Uses watchers appropriately for network/side-effect operations.
> 
---

### Exercise 2: Industrial IoT Device Config Deep Watcher

**Scenario:** An industrial IoT gateway deeply watches a `config` object and triggers sync callbacks when nested properties mutate.
**Requirements:**
1. Declare `reactive()` `config` state with nested `samplingRate` and `thresholds`.
2. Write `watch()` targeting `config` with `{ deep: true }`.
3. Mutate `config.thresholds.temp` and assert watcher invocation.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { reactive, watch } from 'vue'
> 
> const config = reactive({
>   gatewayId: 'GW-01',
>   thresholds: {
>     temp: 85,
>     vibration: 12
>   }
> })
> 
> let syncCount = 0
> 
> watch(config, () => {
>   syncCount++
>   console.log('Syncing updated config to hardware gateway...')
> }, { deep: true })
> 
> // Test assertions
> console.assert(syncCount === 0, 'Watcher should not run lazily on setup')
> config.thresholds.temp = 95 // Mutate deep nested property
> console.assert(syncCount === 1, 'Deep watcher must trigger on nested property mutation')
> </script>
> 
> <template>
>   <div>
>     <p>Temp Threshold: {{ config.thresholds.temp }}°C</p>
>     <button @click="config.thresholds.temp = 95">Update Temp</button>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **`{ deep: true }` option**: Forces the watcher to recursively traverse all nested properties on the target object.
> 2. **Lazy execution default**: Standard watchers stay dormant until targeted sources mutate.
> 3. **Object source target**: Passing a reactive object directly to `watch()` implicitly enables deep watching in Vue 3.5+.
> 4. **Hardware sync side effect**: Transmits updated configuration payloads to external device interfaces.
> 
---

### Exercise 3: Financial Stock Price Multi-Source Watcher

**Scenario:** A stock trading application monitors both `stockSymbol` and `quantity` using an array watcher source.
**Requirements:**
1. Track `symbol` and `quantity` refs.
2. Watch `[symbol, quantity]` array source.
3. Assert that mutating either ref triggers the callback with updated array parameters.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, watch } from 'vue'
> 
> const symbol = ref('AAPL')
> const quantity = ref(10)
> let lastCapturedOrder = ''
> 
> // Multi-source watcher watching an array of refs
> watch([symbol, quantity], ([newSymbol, newQty], [oldSymbol, oldQty]) => {
>   lastCapturedOrder = `Order: ${newQty} shares of ${newSymbol} (Was: ${oldQty} shares of ${oldSymbol})`
> })
> 
> // Test assertions
> symbol.value = 'TSLA'
> console.assert(lastCapturedOrder === 'Order: 10 shares of TSLA (Was: 10 shares of AAPL)', 'Multi-source watcher must capture symbol change')
> quantity.value = 50
> console.assert(lastCapturedOrder === 'Order: 50 shares of TSLA (Was: 10 shares of TSLA)', 'Multi-source watcher must capture quantity change')
> </script>
> 
> <template>
>   <div>
>     <p>Order Summary: {{ quantity }} shares of {{ symbol }}</p>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Multi-source array watching**: `watch([ref1, ref2], ([new1, new2], [old1, old2]) => ...)` monitors multiple sources simultaneously.
> 2. **Destructured change tuple**: Callback parameters destructure into tuple arrays for clean parameter access.
> 3. **Distinct old/new primitive values**: Monitoring primitive refs yields distinct previous and current value primitives.
> 4. **Efficient batching**: Synchronous mutations to multiple tracked refs within a single tick batch into one watcher execution.
> 
---

## 6. Related Terms

- [Computed Properties](computed_properties.md) — The declarative alternative for derived calculations.
- [`watchEffect`](watch_effect.md) — Automated dependency watcher for side effects.
- [`ref`](ref.md) — The primary target data source monitored by watchers.
- [`nextTick`](../level_04/next_tick.md) — Flush timing utility for post-DOM update watchers.

---

## 7. Key Takeaways

- **Watchers (`watch()`)** execute imperative side effects (API calls, localStorage sync, DOM updates) when observed sources change.
- Never use watchers for derived state calculations—use **Computed Properties** (`computed()`) instead.
- Watchers run **lazily** by default; pass `{ immediate: true }` to force immediate initial execution on component setup.
- To watch a property key on a reactive object, wrap access in a getter function `watch(() => state.count, callback)`.
- Pass `{ deep: true }` to recursively monitor mutations inside nested objects.
