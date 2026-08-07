# Declarative Rendering

> **Level 1 — Core Concepts & Reactivity**
> A programming paradigm where you describe *what* the UI should look like based on the current state, leaving Vue to surgically update the DOM when state changes.

---

## 1. Prerequisites

- [Template Syntax](template_syntax.md) — How you declare UI elements and bindings in Vue.
- [DOM (Document Object Model)](../../../01-html/terms/level_09/dom.md) — The imperative structure that declarative rendering replaces.

---

## 2. Term Category

**Programming Paradigm / Core UI Engine Architecture (Declarative View Model)**: Declarative Rendering is the foundational architectural pillar of Vue.js. Rather than writing manual DOM manipulation procedures (`document.querySelector`, `element.appendChild`), developers declare the relationship between underlying state objects and UI elements.

Unlike imperative libraries (such as raw DOM APIs or legacy jQuery) where developers manually reconcile state and DOM states across client applications, Vue's compiler transforms templates into optimized Virtual DOM render functions. Coupled with fine-grained Proxy dependency tracking, Vue automatically calculates minimal DOM mutations when reactive state changes, executing seamlessly across client SPA and server SSR rendering targets.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Before modern frontend frameworks, Web UI updates relied on **Imperative Programming**. Developers had to write line-by-line instructions specifying *how* to locate and mutate every single DOM element when events occurred. 

For example, when a user submitted a form:
1. Select the submit button node in the DOM.
2. Disable the button node.
3. Show a spinner element.
4. Issue an HTTP request.
5. On completion, hide the spinner element and update text inside three target paragraph tags.

In large-scale applications, this imperative approach led to spaghetti code, memory leaks, and state desynchronization (where the JS variable says `isLoading = false`, but the spinner is still stuck visible on screen).

Vue solves this with **Declarative Rendering**. You simply declare the rules: "The button is disabled IF `isSubmitting` is true; the paragraph displays `{{ user.name }}`." You mutate the state object, and Vue handles all intermediate DOM manipulations automatically.

### (2) Reality Metaphor
Think of an Automatic Climate Control system in a car versus a manual manual AC knob setup.

With a manual setup (Imperative), if the cabin gets hot, you must manually turn fan speed to 4, direct airflow to upper vents, wait three minutes, adjust heat level down, and manually adjust fan speed back to 2 when comfortable. If you forget a step, you freeze or overheat.

With Automatic Climate Control (Declarative), you simply declare your desired target state: `"Maintain 21°C"`. The car's computer continuously monitors sensors, calculates fan speeds, toggles compressor valves, and adjusts internal dampers. You specify the *desired outcome*, and the machinery handles the step-by-step execution.

### (3) Vue Code Examples

#### Short Snippet
```vue
<script setup>
import { ref } from 'vue'

const message = ref('Hello, Vue 3!')

function updateMessage() {
  // Declarative approach: mutate data, DOM updates automatically
  message.value = 'State mutated! UI updated.'
}
</script>

<template>
  <h1>{{ message }}</h1>
  <button @click="updateMessage">Update Text</button>
</template>
```

#### Fuller Example
```vue
<script setup>
import { ref, computed } from 'vue'

const isOnline = ref(true)
const networkLatency = ref(42) // ms

const statusText = computed(() => {
  if (!isOnline.value) return 'Disconnected'
  return networkLatency.value > 150 ? 'High Latency' : 'Optimal Connection'
})

const statusBadgeClass = computed(() => ({
  'badge-green': isOnline.value && networkLatency.value <= 150,
  'badge-yellow': isOnline.value && networkLatency.value > 150,
  'badge-red': !isOnline.value
}))

function simulateNetworkDrop() {
  isOnline.value = !isOnline.value
}
</script>

<template>
  <div class="network-monitor">
    <h2>Network Status: {{ statusText }}</h2>
    <span class="badge" :class="statusBadgeClass">
      {{ isOnline ? `${networkLatency}ms` : 'Offline' }}
    </span>
    <button @click="simulateNetworkDrop">Toggle Network Connection</button>
  </div>
</template>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Directly Mutating DOM Nodes via `document.querySelector`

**The mistake:** Reaching into the DOM using native document selectors (e.g. `document.getElementById('status').textContent = 'Loaded'`) inside a Vue component callback.

**Why it's wrong:** Direct manual DOM mutations bypass Vue's Virtual DOM reconciliation engine. When Vue next re-evaluates component state, it will overwrite manual changes, causing visual flickering or state desynchronization bugs.

*Incorrect:*
```javascript
function setHeaderTitle(title) {
  document.getElementById('page-title').innerText = title // ❌ Manual DOM mutation!
}
```

*Fix:*
```javascript
const pageTitle = ref('Initial Title')
function setHeaderTitle(title) {
  pageTitle.value = title // Declarative state change updates template automatically
}
```

---

### Mistake 2: Attempting Attribute Binding with Mustache Interpolation (`src="{{ url }}"`)

**The mistake:** Placing mustache curly braces `{{ }}` inside HTML attribute quotes (e.g. `<img src="{{ avatarUrl }}">`).

**Why it's wrong:** Mustache syntax `{{ }}` is designed exclusively for text content interpolation within HTML tags. Inside attributes, string literal evaluation causes invalid URL lookups or syntax errors.

*Incorrect:*
```vue
<img src="{{ userAvatar }}"> <!-- ❌ Invalid mustache inside attribute! -->
```

*Fix:*
```vue
<img :src="userAvatar"> <!-- Use v-bind shorthand for attributes -->
```

---

### Mistake 3: Treating Declarative Rendering as Synchronous Instantaneous DOM Updates

**The mistake:** Mutating reactive state and immediately querying the DOM for updated dimensions synchronously in the same function line.

**Why it's wrong:** Vue queues state changes asynchronously and flushes DOM updates on the next tick microtask to batch performance. Immediate synchronous DOM queries will read stale element layout properties.

*Incorrect:*
```javascript
const height = ref(100)
function expandBox() {
  height.value = 500
  const el = document.getElementById('box')
  console.log(el.clientHeight) // ❌ Reads stale height (100) before DOM flush!
}
```

*Fix:*
```javascript
import { nextTick } from 'vue'
const height = ref(100)
async function expandBox() {
  height.value = 500
  await nextTick() // Await asynchronous DOM microtask flush
  const el = document.getElementById('box')
  console.log(el.clientHeight) // Reads updated height (500)
}
```

---

## 5. Practice Exercises

### Exercise 1: E-Commerce Inventory Stock Tracker

**Scenario:** An inventory view shows item availability and dynamically changes badge status without DOM selectors.
**Requirements:**
1. Track reactive `stockQuantity` (`ref(5)`).
2. Compute `stockStatus` ('In Stock', 'Low Stock', 'Out of Stock') declaratively.
3. Provide `purchaseItem` function reducing stock.
4. Verify stock status transitions via test assertions.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, computed } from 'vue'
> 
> const stockQuantity = ref(5)
> 
> const stockStatus = computed(() => {
>   if (stockQuantity.value <= 0) return 'Out of Stock'
>   if (stockQuantity.value <= 3) return 'Low Stock'
>   return 'In Stock'
> })
> 
> function purchaseItem() {
>   if (stockQuantity.value > 0) {
>     stockQuantity.value--
>   }
> }
> 
> // Verification assertions
> console.assert(stockStatus.value === 'In Stock', 'Initial status should be In Stock')
> stockQuantity.value = 2
> console.assert(stockStatus.value === 'Low Stock', 'Status should be Low Stock at 2 units')
> stockQuantity.value = 0
> console.assert(stockStatus.value === 'Out of Stock', 'Status should be Out of Stock at 0 units')
> </script>
> 
> <template>
>   <div>
>     <p>Available Units: {{ stockQuantity }}</p>
>     <span>Status: {{ stockStatus }}</span>
>     <button :disabled="stockQuantity === 0" @click="purchaseItem">Buy Item</button>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Data-driven UI**: The button disabled state and status text are pure functions of `stockQuantity`.
> 2. **Zero DOM querying**: No `document.querySelector` calls exist; state mutations trigger exact updates.
> 3. **Computed derived state**: `stockStatus` caches its evaluation until `stockQuantity` changes.
> 4. **Declarative attributes**: `:disabled="stockQuantity === 0"` binds dynamic boolean attributes cleanly.
> 
---

### Exercise 2: Real-Time Healthcare Patient Vitals Monitor

**Scenario:** A hospital monitor displays patient heart rate telemetry and highlights warnings declaratively.
**Requirements:**
1. Track `heartRate` (`ref(72)`).
2. Declare computed `isAbnormal` boolean (`heartRate < 60 || heartRate > 100`).
3. Add `updateHeartRate(rate)` method.
4. Verify abnormal condition assertion.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, computed } from 'vue'
> 
> const heartRate = ref(72)
> 
> const isAbnormal = computed(() => heartRate.value < 60 || heartRate.value > 100)
> 
> function updateHeartRate(newRate) {
>   heartRate.value = newRate
> }
> 
> // Assertion tests
> console.assert(isAbnormal.value === false, '72 BPM should be normal')
> updateHeartRate(115)
> console.assert(isAbnormal.value === true, '115 BPM should trigger abnormal flag')
> </script>
> 
> <template>
>   <div :class="{ alert: isAbnormal }">
>     <h3>Heart Rate Telemetry: {{ heartRate }} BPM</h3>
>     <p v-if="isAbnormal">WARNING: Cardiac telemetry outside safe bounds!</p>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Declarative CSS class binding**: `:class="{ alert: isAbnormal }"` applies classes based on reactive boolean state.
> 2. **Structural directive binding**: `v-if="isAbnormal"` mounts/unmounts warning templates declaratively.
> 3. **Fine-grained reactivity**: Only nodes bound to `isAbnormal` or `heartRate` update during telemetry flushes.
> 4. **Testability**: Pure state functions enable painless unit testing without DOM mocks.
> 
---

### Exercise 3: Financial Trading Engine Order Book Visualizer

**Scenario:** A trading application visualizes order book depth and dynamically highlights bid/ask spread ranges.
**Requirements:**
1. Maintain reactive `bids` array and `asks` array.
2. Compute `spread` value using `computed`.
3. Provide `addBid(price, amount)` helper.
4. Assert spread calculation correctness.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, computed } from 'vue'
> 
> const highestBid = ref(100.50)
> const lowestAsk = ref(100.75)
> 
> const spread = computed(() => (lowestAsk.value - highestBid.value).toFixed(2))
> 
> function addBid(price) {
>   if (price > highestBid.value) {
>     highestBid.value = price
>   }
> }
> 
> // Test assertion
> console.assert(spread.value === '0.25', `Expected spread 0.25, got ${spread.value}`)
> addBid(100.60)
> console.assert(spread.value === '0.15', `Expected spread 0.15, got ${spread.value}`)
> </script>
> 
> <template>
>   <div>
>     <p>Highest Bid: ${{ highestBid }}</p>
>     <p>Lowest Ask: ${{ lowestAsk }}</p>
>     <p>Market Spread: ${{ spread }}</p>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Surgical DOM patching**: Mutating `highestBid` updates only bid display and spread paragraph tags.
> 2. **Pure data flow**: UI reflects data values deterministically.
> 3. **Virtual DOM batching**: Multiple reactive state mutations within a single synchronous frame batch into one Virtual DOM update cycle.
> 4. **Predictable mental model**: Bugs are debugged by inspecting data state rather than tracing DOM mutation sequences.
> 
---

## 6. Related Terms

- [Template Syntax](template_syntax.md) — The HTML-based syntax used to express declarative rendering rules.
- [Reactive State](../level_02/reactive_state.md) — The data dependencies monitored by Vue to trigger rendering.
- [Virtual DOM (Vue)](../level_08/virtual_dom.md) — The underlying rendering engine that converts declarative templates into efficient DOM operations.
- [Options API](options_api.md) — The legacy component authoring structure.

---

## 7. Key Takeaways

- **Declarative Rendering** shifts developer focus from *how* to change DOM nodes to *what* the UI state should be.
- Vue automatically tracks data dependencies and patches the real DOM using Virtual DOM diffing.
- Direct DOM manipulation using `document.querySelector` is an anti-pattern in Vue components.
- DOM updates are asynchronous and batched microtask-by-microtask; use `nextTick()` if synchronous post-render DOM measurement is required.
