# Client-Side Rendering (CSR)

> **Level 9 — Server-Side Rendering (SSR) & Nuxt**
> The default rendering architecture of standard Vue Single-Page Applications (SPAs), where the server delivers a static HTML shell and JavaScript handles UI generation, routing, and data fetching entirely in the browser.

---

## 1. Prerequisites

- [Vue Instance](../level_01/vue_instance.md) — What mounts to the DOM and takes over the browser in CSR.
- [Vue Router](../level_06/vue_router.md) — The client-side routing library that handles navigation without full-page reloads.

---

## 2. Term Category

**Rendering Architecture (Client-Side Paradigm)**: Client-Side Rendering (CSR) is an application architecture where the server serves an initial HTML payload containing a bare container element (`<div id="app"></div>`) and script references. The browser downloads, parses, and executes the compiled JavaScript bundle, which dynamically builds the virtual DOM, mounts components, and manages application routing and data retrieval on the client runtime environment.

Unlike legacy multi-page architectures or modern Server-Side Rendering (SSR), CSR delegates all HTML generation to the client browser. In frameworks like React or Angular, CSR similarly loads client bundles, but Vue's proxy-based reactivity system ensures fine-grained DOM updates without full component sub-tree re-renders during state mutations.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In traditional multi-page web applications, every user interaction or page navigation triggered a round-trip HTTP request to the server, resulting in white-screen flickers, high server processing load, and latency while waiting for server HTML compilation.

CSR was created to deliver desktop-like responsiveness for web applications. By bundling application logic, component templates, and routing into JavaScript assets served statically over CDNs, CSR allows web applications to boot once and perform instantaneous local UI updates, background data syncing via asynchronous API calls, and smooth route transitions without reloading the browser page.

### (2) Reality Metaphor
Imagine a flat-pack furniture delivery service. Instead of shipping a fully assembled, heavy wooden dining table (which takes up massive freight space and requires expensive transport overhead), the vendor ships a compact box containing instructions and raw parts. Once the box arrives at your home, you unpack it and assemble the table locally.

In CSR, the web server acts as the flat-pack shipping facility—it sends a minimal, lightweight HTML box along with the JavaScript "instruction manual and assembly tools." Your browser executes the JavaScript to build and render the complex UI furniture directly inside the DOM.

### (3) Vue Code Examples

#### Short Snippet
```vue
<script setup>
import { ref, onMounted } from 'vue'

const status = ref('Initializing CSR Application...')

onMounted(() => {
  status.value = 'Client-Side Application Ready!'
})
</script>

<template>
  <div class="csr-banner">
    <p>{{ status }}</p>
  </div>
</template>
```

#### Fuller Example
```vue
<!-- App.vue (CSR Telemetry Dashboard Entry) -->
<script setup>
import { ref, onMounted } from 'vue'

const telemetryData = ref([])
const isLoading = ref(true)
const fetchError = ref(null)

async function loadDashboardData() {
  try {
    isLoading.value = true
    const response = await new Promise(resolve => 
      setTimeout(() => resolve([
        { id: 101, node: 'Edge-Alpha', status: 'Online', latencyMs: 14 },
        { id: 102, node: 'Edge-Beta', status: 'Degraded', latencyMs: 180 }
      ]), 600)
    )
    telemetryData.value = response
  } catch (err) {
    fetchError.value = 'Failed to load telemetry streams.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>

<template>
  <div class="dashboard-container">
    <h2>Client-Side Telemetry Dashboard</h2>
    
    <div v-if="isLoading" class="skeleton-loader">
      <p>Fetching real-time streams over Client JavaScript...</p>
    </div>
    
    <div v-else-if="fetchError" class="error-alert">
      {{ fetchError }}
    </div>
    
    <table v-else class="data-table">
      <thead>
        <tr>
          <th>Node ID</th>
          <th>Location</th>
          <th>Status</th>
          <th>Latency</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="node in telemetryData" :key="node.id">
          <td>{{ node.id }}</td>
          <td>{{ node.node }}</td>
          <td>{{ node.status }}</td>
          <td>{{ node.latencyMs }}ms</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Relying on Pure CSR for SEO-Critical E-Commerce Stores

**The mistake:** Building a public e-commerce store using a standard Client-Side Rendered Vue SPA without SSR or static pre-rendering.

**Why it's wrong:** Pure CSR serves an initial HTML shell containing only an empty `<div id="app"></div>`. Search engine crawlers (and social media link preview bots) reading the raw HTML response see no product headings, descriptions, or schema metadata, severely harming search index rankings and link previews.

*Incorrect:*
```html
<!-- Server response sent to search crawlers in pure CSR -->
<!DOCTYPE html>
<html>
  <body>
    <div id="app"></div> <!-- Empty HTML shell! No indexed product text. -->
    <script src="/dist/bundle.js"></script>
  </body>
</html>
```

*Fix:*
```vue
<!-- Use Server-Side Rendering (SSR) or Static Site Generation (SSG) via Nuxt for SEO routes -->
<!-- Nuxt automatically pre-renders fully populated HTML tags on the server side -->
```

---

### Mistake 2: Failing to Implement Loading States During Initial Client Data Fetches

**The mistake:** Rendering null or empty UI layouts while client-side API fetches complete after bundle execution.

**Why it's wrong:** In CSR applications, JavaScript bundle download and execution must complete *before* component data fetching starts. Omitting skeleton loaders or progress indicators leaves users staring at an empty white screen during network delays.

*Incorrect:*
```vue
<script setup>
import { ref } from 'vue'

const items = ref(null)
// Data fetch starts on setup, but UI stays blank while loading!
fetch('/api/items').then(res => res.json()).then(data => items.value = data)
</script>

<template>
  <div>
    <!-- Renders empty markup until fetch finishes -->
    <ul v-if="items">
      <li v-for="item in items" :key="item.id">{{ item.name }}</li>
    </ul>
  </div>
</template>
```

*Fix:*
```vue
<script setup>
import { ref, onMounted } from 'vue'

const items = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await fetch('/api/items')
    items.value = await res.json()
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <div v-if="loading" class="spinner">Loading application data...</div>
    <ul v-else>
      <li v-for="item in items" :key="item.id">{{ item.name }}</li>
    </ul>
  </div>
</template>
```

---

### Mistake 3: Unbounded Client Bundle Sizes Without Code Splitting

**The mistake:** Importing all application routes, heavy charting libraries, and admin utilities into the main entry bundle.

**Why it's wrong:** Monolithic CSR bundles force every user to download the entire application JavaScript before rendering the landing page, leading to high Time to Interactive (TTI) and First Contentful Paint (FCP) latencies.

*Incorrect:*
```javascript
// router/index.js
import Dashboard from '../views/Dashboard.vue'
import AnalyticsAdmin from '../views/AnalyticsAdmin.vue' // Heavy admin module bundled unconditionally!

const routes = [
  { path: '/dashboard', component: Dashboard },
  { path: '/admin', component: AnalyticsAdmin }
]
```

*Fix:*
```javascript
// router/index.js
// Lazy load route components using dynamic ES imports for route-level code splitting
const routes = [
  { path: '/dashboard', component: () => import('../views/Dashboard.vue') },
  { path: '/admin', component: () => import('../views/AnalyticsAdmin.vue') }
]
```

---

## 5. Practice Exercises

### Exercise 1: IoT Sensor Dashboard Loading Handler

**Scenario:** You are building an industrial IoT sensor monitoring dashboard using a Vue 3 CSR architecture. When operators open the web app, client JavaScript must initialize, connect to an MQTT broker endpoint, and fetch initial sensor node metrics.

**Requirements:**
1. Maintain explicit `connectionStatus` and `sensorMetrics` reactive states.
2. Simulate a client-side network request inside `onMounted`.
3. Display a fallback loading skeleton while connecting to the MQTT broker.
4. Include a self-contained assertion function validating that metrics update once data arrives.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, onMounted } from 'vue'
> 
> const connectionStatus = ref('Connecting to Broker...')
> const isConnecting = ref(true)
> const sensorMetrics = ref([])
> 
> async function initializeMqttFeed() {
>   // Simulated async client-side connection & fetch
>   await new Promise(resolve => setTimeout(resolve, 300))
>   sensorMetrics.value = [
>     { sensorId: 'TEMP-01', value: 42.5, unit: 'C' },
>     { sensorId: 'PRESS-09', value: 1.02, unit: 'bar' }
>   ]
>   connectionStatus.value = 'Connected'
>   isConnecting.value = false
> }
> 
> onMounted(async () => {
>   await initializeMqttFeed()
>   runVerificationTests()
> })
> 
> function runVerificationTests() {
>   console.assert(isConnecting.value === false, 'Test Failed: App should not be in connecting state')
>   console.assert(sensorMetrics.value.length === 2, 'Test Failed: Sensor metrics should be populated')
>   console.log('IoT CSR Dashboard Verification Passed')
> }
> </script>
> 
> <template>
>   <div class="iot-panel">
>     <h3>IoT Sensor Dashboard</h3>
>     <p>Status: {{ connectionStatus }}</p>
>     
>     <div v-if="isConnecting" class="loader">
>       Loading telemetry stream...
>     </div>
>     <ul v-else class="sensor-list">
>       <li v-for="s in sensorMetrics" :key="s.sensorId">
>         {{ s.sensorId }}: {{ s.value }} {{ s.unit }}
>       </li>
>     </ul>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: CSR applications must explicitly handle client initialization delays because UI rendering depends on browser JS execution.
> 2. **Concept**: `onMounted` acts as the primary hook for client-side side-effects and network requests in CSR.
> 3. **Concept**: Vue's reactivity system automatically patches the DOM when `isConnecting` and `sensorMetrics` update.
> 4. **Concept**: Programmatic assertions verify state transitions after asynchronous resolution.
> 
---

### Exercise 2: Real-Time Financial Stock Portfolio Selector

**Scenario:** A financial trading portal displays real-time stock portfolio allocations. Because portfolio values update constantly via WebSockets, the architecture uses CSR to perform instantaneous local re-renders without server reloads.

**Requirements:**
1. Define a reactive portfolio array containing ticker symbols, shares, and current price.
2. Provide a function to simulate live price updates on selected stocks.
3. Compute total portfolio value using a reactive `computed` property.
4. Verify that mutating stock prices automatically updates the computed total value.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, computed } from 'vue'
> 
> const portfolio = ref([
>   { ticker: 'AAPL', shares: 10, price: 180.00 },
>   { ticker: 'NVDA', shares: 5, price: 450.00 }
> ])
> 
> const totalPortfolioValue = computed(() => {
>   return portfolio.value.reduce((sum, item) => sum + (item.shares * item.price), 0)
> })
> 
> function updatePrice(ticker, newPrice) {
>   const item = portfolio.value.find(p => p.ticker === ticker)
>   if (item) {
>     item.price = newPrice
>   }
> }
> 
> // Self-contained test assertion
> function testPortfolioCalculation() {
>   const initialTotal = totalPortfolioValue.value
>   updatePrice('AAPL', 200.00)
>   const updatedTotal = totalPortfolioValue.value
>   console.assert(updatedTotal === initialTotal + 200, 'Test Failed: Portfolio total did not update reactively')
>   console.log('Financial Portfolio Test Passed')
> }
> 
> testPortfolioCalculation()
> </script>
> 
> <template>
>   <div class="portfolio-widget">
>     <h4>Live Financial Portfolio (CSR)</h4>
>     <p>Total Value: ${{ totalPortfolioValue.toFixed(2) }}</p>
>     <ul>
>       <li v-for="item in portfolio" :key="item.ticker">
>         {{ item.ticker }} - {{ item.shares }} shares @ ${{ item.price.toFixed(2) }}
>         <button @click="updatePrice(item.ticker, item.price + 5)">+ $5 Sim</button>
>       </li>
>     </ul>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: CSR applications maintain application state locally in memory, allowing `computed` properties to calculate derived values instantly.
> 2. **Concept**: Proxy reactivity tracks properties inside array items (`item.price`), triggering granular DOM patches upon mutation.
> 3. **Concept**: CSR avoids round-trip server HTML compilation for frequent real-time data ticks.
> 4. **Concept**: Immediate execution of test assertions validates reactive dependency tracking logic.
> 
---

### Exercise 3: E-Commerce Shopping Cart Local Persistence

**Scenario:** An e-commerce site uses Client-Side Rendering for its checkout funnel. To prevent losing user selections when refreshing the page in CSR, cart items must sync to `localStorage`.

**Requirements:**
1. Initialize cart state from `localStorage` if available.
2. Provide an `addItem` function that updates cart items.
3. Automatically serialize and save cart changes to `localStorage`.
4. Include a test assertion verifying that items added to the cart persist across component initialization.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, watch, onMounted } from 'vue'
> 
> const cart = ref([])
> 
> function loadCart() {
>   const saved = localStorage.getItem('csr_cart')
>   if (saved) {
>     try {
>       cart.value = JSON.parse(saved)
>     } catch (e) {
>       cart.value = []
>     }
>   }
> }
> 
> function addItem(product) {
>   cart.value.push(product)
> }
> 
> watch(cart, (newCart) => {
>   localStorage.setItem('csr_cart', JSON.stringify(newCart))
> }, { deep: true })
> 
> onMounted(() => {
>   loadCart()
>   // Test verification
>   addItem({ id: 99, name: 'Wireless Headphones', price: 99.99 })
>   const stored = JSON.parse(localStorage.getItem('csr_cart') || '[]')
>   console.assert(stored.some(i => i.id === 99), 'Test Failed: Cart item failed to persist in localStorage')
>   console.log('E-Commerce Cart Persistence Passed')
> })
> </script>
> 
> <template>
>   <div class="cart-box">
>     <h4>Shopping Cart (CSR Persistence)</h4>
>     <p>Item Count: {{ cart.length }}</p>
>     <button @click="addItem({ id: Date.now(), name: 'Sample Item', price: 19.99 })">
>       Add Product
>     </button>
>     <ul>
>       <li v-for="(item, idx) in cart" :key="idx">
>         {{ item.name }} - ${{ item.price }}
>       </li>
>     </ul>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: CSR applications have full direct access to browser storage APIs like `localStorage` during runtime.
> 2. **Concept**: `watch` with `{ deep: true }` detects nested mutations in arrays or objects, triggering client storage updates.
> 3. **Concept**: `onMounted` ensures local storage reading occurs strictly on the browser runtime.
> 4. **Concept**: Inline assertions verify seamless synchronization between Vue reactive state and browser storage.
> 
---

## 6. Related Terms

- [Server-Side Rendering (SSR)](ssr.md) — The alternative rendering architecture designed to overcome CSR SEO and initial load limitations.
- [Vue Router](../level_06/vue_router.md) — The client-side routing library enabling Single-Page Application navigation without page reloads.
- [Hydration (Vue)](hydration.md) — The client process that attaches event listeners to pre-rendered server markup in SSR.
- [Build Step (Compilation)](../level_10/build_step.md) — The compilation process that bundles Vue components for CSR deployment.

---

## 7. Key Takeaways

- **Client-Side Rendering (CSR)** delegates UI template rendering, routing, and DOM updates completely to the user's browser engine.
- CSR serves a minimal HTML container (`<div id="app"></div>`) alongside pre-compiled JavaScript bundles.
- Offers fast subsequent page transitions and lower server hosting compute overhead compared to server rendering.
- Requires explicit code splitting, route lazy-loading, and skeleton loaders to prevent slow initial load times.
- Unsuitable for public SEO-dependent applications without static site pre-rendering or SSR hybrid strategies.
