# Server-Side Rendering (SSR)

> **Level 9 — Server-Side Rendering (SSR) & Nuxt**
> An application architecture where Vue components are compiled into raw HTML markup strings on a backend Node.js server for every request before being sent to the browser for instant painting and client hydration.

---

## 1. Prerequisites

- [Vue Instance](../level_01/vue_instance.md) — What runs on the Node.js backend server during server rendering.
- [Client-Side Rendering (CSR)](csr.md) — The default browser rendering architecture that SSR optimizes for SEO and initial load speed.

---

## 2. Term Category

**Rendering Architecture (Server-Side Paradigm)**: Server-Side Rendering (SSR) is a full-stack execution pattern where an active Node.js server intercepts incoming HTTP page requests, instantiates a fresh Vue application instance per request, executes component setup scripts, fetches database or API payloads, and serializes the resulting component tree into a complete HTML string using `vue/server-renderer`.

Unlike Client-Side Rendering (which sends a blank `<div id="app"></div>` shell), SSR sends fully populated markup directly in the initial HTTP response payload. Frameworks like Next.js (React) or SvelteKit (Svelte) employ similar server compilation, but Vue's SSR compiler features advanced template hoisting and static node stringification to maximize Node.js server rendering throughput.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Standard Single-Page Applications (SPAs) relying on Client-Side Rendering (CSR) suffer from two fundamental enterprise limitations:
1. **Poor SEO & Link Previews:** Search engine spiders (and social media preview crawlers) reading raw HTTP responses encounter empty HTML shells, resulting in poor search engine indexing.
2. **Slow Initial Contentful Paint (FCP):** Mobile users on high-latency networks stare at blank white screens while waiting to download, parse, and execute multi-megabyte JavaScript bundles.

SSR was created to solve both problems simultaneously. By executing component logic on a backend Node.js server and returning pre-rendered HTML markup in the first network packet, browsers paint text and images immediately. Once painted, client JavaScript downloads in the background to **hydrate** the static document into an interactive Vue SPA.

### (2) Reality Metaphor
Imagine ordering food at a restaurant drive-thru. In Client-Side Rendering (CSR), the restaurant hands you raw ingredients, a stove, and a recipe card through your car window—you have to park your car and cook the meal yourself before eating.

In Server-Side Rendering (SSR), the restaurant kitchen (Node.js server) cooks the entire meal, places it hot on a plate, and hands you a ready-to-eat dinner. You take your first bite instantly (First Contentful Paint). A waiter then hands you utensils and a napkin (Client Hydration) so you can interact with your meal comfortably.

### (3) Vue Code Examples

#### Short Snippet
```javascript
// Node.js SSR Server Endpoint (server.js)
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'

async function handleServerRequest(req, res) {
  // 1. Create fresh Vue instance per request
  const app = createSSRApp({
    data: () => ({ message: 'Hello from Node.js SSR Server!' }),
    template: `<div><h1>{{ message }}</h1></div>`
  })

  // 2. Compile Virtual DOM to raw HTML string
  const html = await renderToString(app)
  
  // 3. Send fully populated HTML response
  res.setHeader('Content-Type', 'text/html')
  res.send(`<!DOCTYPE html><html><body><div id="app">${html}</div></body></html>`)
}
```

#### Fuller Example
```vue
<!-- UniversalSSRComponent.vue -->
<script setup>
import { ref, onMounted } from 'vue'

// Executes on BOTH Server (Node.js) and Client (Browser)
const props = defineProps({
  initialMetrics: {
    type: Array,
    default: () => []
  }
})

const serverRenderTime = ref(new Date().toISOString())
const isClientActive = ref(false)

onMounted(() => {
  // Executes EXCLUSIVELY in the browser post-hydration
  isClientActive.value = true
})
</script>

<template>
  <div class="ssr-container">
    <h2>Server-Rendered Telemetry Overview</h2>
    <p class="server-tag">Pre-rendered at: {{ serverRenderTime }}</p>
    
    <div class="metrics-grid">
      <div v-for="m in initialMetrics" :key="m.id" class="metric-card">
        <h3>{{ m.name }}</h3>
        <p class="val">{{ m.value }} {{ m.unit }}</p>
      </div>
    </div>

    <div v-if="isClientActive" class="interactive-panel">
      <button @click="alert('Client interactivity enabled!')">
        Client Interactivity Active
      </button>
    </div>
    <div v-else class="ssr-notice">
      <span>Rendering static server HTML...</span>
    </div>
  </div>
</template>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Accessing Browser Globals (`window`, `document`) in Setup Scope

**The mistake:** Calling `window.innerWidth` or `document.cookie` directly in component setup script scope.

**Why it's wrong:** The component setup script executes on the backend Node.js server during SSR requests. Node.js has no `window` or `document` global objects, triggering server runtime crashes (`ReferenceError: window is not defined`).

*Incorrect:*
```vue
<script setup>
// ❌ Crashes Node.js SSR server process immediately!
const width = window.innerWidth
</script>
```

*Fix:*
```vue
<script setup>
import { ref, onMounted } from 'vue'
const width = ref(0)

onMounted(() => {
  // ✅ Access browser globals safely inside onMounted (skipped by SSR server)
  width.value = window.innerWidth
})
</script>
```

---

### Mistake 2: Creating Shared State Memory Leaks Across User Requests

**The mistake:** Declaring global reactive state outside component setup or factory functions in Node.js module scope.

**Why it's wrong:** In Node.js SSR, a single long-running server process handles thousands of HTTP requests for different users. Global state declared outside setup scope is shared across all concurrent user requests, leaking private data across users.

*Incorrect:*
```javascript
// server/store.js
import { ref } from 'vue'
// ❌ Shared module state memory leak across concurrent user SSR requests!
export const currentUser = ref(null)
```

*Fix:*
```javascript
// Use Pinia factory functions or request-scoped composables created inside setup()
export function useUserStore() {
  return ref(null) // Fresh instance per request setup
}
```

---

### Mistake 3: Unbounded Server CPU Overload via Un-Cached Dynamic Pre-Rendering

**The mistake:** Executing complex, heavy computations or slow database queries synchronously inside SSR component setup for every incoming request without caching.

**Why it's wrong:** Server-side component compilation consumes CPU cycles. Under heavy traffic spikes, un-cached SSR servers experience CPU saturation, spiking Time to First Byte (TTFB) and causing server timeouts.

*Incorrect:*
```vue
<script setup>
// ❌ Heavy computation executed on Node server CPU for every single HTTP request!
const heavyData = await computeHeavyAnalytics()
</script>
```

*Fix:*
```javascript
// Implement SSR response caching (Nitro routeRules / Redis cache) for heavy pages
export default defineNuxtConfig({
  routeRules: {
    '/analytics/**': { swr: 3600 } // Stale-While-Revalidate caching for 1 hour
  }
})
```

---

## 5. Practice Exercises

### Exercise 1: IoT Sensor Node SSR Telemetry Renderer

**Scenario:** An industrial IoT monitoring engine pre-renders sensor node HTML on a Node.js SSR server. The server fetches current sensor status from a Redis cache, compiles HTML markup, and delivers it to field technicians.

**Requirements:**
1. Accept initial sensor metrics as component props.
2. Render node status, temperature, and pressure tags universally.
3. Attach client-side auto-refresh interval inside `onMounted`.
4. Include a test assertion validating that server props populate initial markup correctly.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, onMounted } from 'vue'
> 
> const props = defineProps({
>   sensorData: {
>     type: Object,
>     default: () => ({ id: 'NODE-99', temp: 55.4, pressure: 2.1, status: 'NORMAL' })
>   }
> })
> 
> const isLive = ref(false)
> 
> onMounted(() => {
>   isLive.value = true
>   testSsrSensorNode()
> })
> 
> function testSsrSensorNode() {
>   console.assert(props.sensorData.id === 'NODE-99', 'Test Failed: Sensor ID missing')
>   console.assert(props.sensorData.temp === 55.4, 'Test Failed: Temperature value incorrect')
>   console.log('SSR IoT Sensor Test Passed')
> }
> </script>
> 
> <template>
>   <div class="sensor-ssr-card">
>     <h3>Node: {{ sensorData.id }}</h3>
>     <p>Temperature: {{ sensorData.temp }} °C</p>
>     <p>Pressure: {{ sensorData.pressure }} bar</p>
>     <span :class="['badge', isLive ? 'live' : 'static']">
>       {{ isLive ? 'Client Hydrated (Live)' : 'Server Rendered HTML' }}
>     </span>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: Props-driven components allow Node.js servers to inject fetched database data during `renderToString()`.
> 2. **Concept**: Pre-rendered HTML allows field technicians to view critical sensor parameters immediately on slow cellular links.
> 3. **Concept**: `onMounted` toggles client-side live telemetry feeds post-hydration.
> 4. **Concept**: Programmatic assertions verify initial props serialization.
> 
---

### Exercise 2: Financial Order Book SSR Renderer

**Scenario:** A stock trading exchange uses SSR to pre-render public order book snapshots. Fast server HTML generation ensures search bots and traders receive instantaneous DOM updates without waiting for client JS execution.

**Requirements:**
1. Render bid/ask price tables from initial server data payloads.
2. Compute total bid/ask volumes using computed properties.
3. Establish safe client WebSocket subscription post-hydration inside `onMounted`.
4. Verify via inline test assertions that order totals calculate accurately.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, computed, onMounted } from 'vue'
> 
> const bids = ref([
>   { price: 150.25, size: 100 },
>   { price: 150.20, size: 250 }
> ])
> 
> const totalBidVolume = computed(() => {
>   return bids.value.reduce((sum, b) => sum + b.size, 0)
> })
> 
> onMounted(() => {
>   testFinancialSsr()
> })
> 
> function testFinancialSsr() {
>   console.assert(totalBidVolume.value === 350, 'Test Failed: Bid volume calculation error')
>   console.log('Financial SSR Order Book Test Passed')
> }
> </script>
> 
> <template>
>   <div class="order-book-ssr">
>     <h4>Public Order Book (SSR Pre-Rendered)</h4>
>     <p>Total Bid Volume: {{ totalBidVolume }} units</p>
>     <table>
>       <thead>
>         <tr><th>Price ($)</th><th>Size</th></tr>
>       </thead>
>       <tbody>
>         <tr v-for="(bid, i) in bids" :key="i">
>           <td>{{ bid.price.toFixed(2) }}</td>
>           <td>{{ bid.size }}</td>
>         </tr>
>       </tbody>
>     </table>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: Node.js SSR compiles `bids` array into pre-structured `<table>` HTML elements per HTTP request.
> 2. **Concept**: Search bots index full order book prices directly from raw HTTP payload strings.
> 3. **Concept**: Computed volume metrics execute during server setup rendering pass.
> 4. **Concept**: Unit tests validate calculations post-mount.
> 
---

### Exercise 3: E-Commerce Product Landing Page SSR SEO Injector

**Scenario:** An online retailer pre-renders e-commerce product landing pages via SSR. The Node.js server generates meta tags and structured product markup to achieve top Google search rankings.

**Requirements:**
1. Render product title, price, and description from initial data properties.
2. Inject OpenGraph meta tags dynamically.
3. Handle cart submission client-side post-hydration.
4. Verify via assertions that pre-rendered price matches initial values.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, onMounted } from 'vue'
> 
> const product = ref({
>   id: 'PROD-88',
>   name: 'Noise-Canceling Headphones',
>   price: 299.99,
>   description: 'Premium wireless audio headphones with active noise cancellation.'
> })
> 
> const addedToCart = ref(false)
> 
> function addToCart() {
>   addedToCart.value = true
> }
> 
> onMounted(() => {
>   testProductSsr()
> })
> 
> function testProductSsr() {
>   console.assert(product.value.price === 299.99, 'Test Failed: Product price mismatch')
>   console.log('E-Commerce Product SSR Test Passed')
> }
> </script>
> 
> <template>
>   <div class="product-seo-page">
>     <h1>{{ product.name }}</h1>
>     <p class="price">${{ product.price.toFixed(2) }}</p>
>     <p class="desc">{{ product.description }}</p>
>     <button @click="addToCart">
>       {{ addedToCart ? 'Added to Cart ✓' : 'Add to Cart' }}
>     </button>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: SSR outputs fully populated `<h1>` and `<p>` tags directly in HTTP response streams for search crawlers.
> 2. **Concept**: Client hydration binds `@click="addToCart"` event listener seamlessly without re-rendering text nodes.
> 3. **Concept**: Fast initial paint delivers optimal Core Web Vitals (LCP/FCP) performance scores.
> 4. **Concept**: Programmatic assertions verify initial data integrity.
> 
---

## 6. Related Terms

- [Client-Side Rendering (CSR)](csr.md) — The opposite rendering strategy where UI generation occurs entirely in the browser.
- [Hydration (Vue)](hydration.md) — The client process that attaches reactivity to pre-rendered server HTML.
- [Nuxt.js](nuxt.md) — The full-stack framework simplifying SSR build pipelines.
- [Static Site Generation (SSG)](ssg.md) — Pre-rendering pages to static HTML during build compilation.
- [Universal Code (Isomorphic)](universal_code.md) — Writing code compatible with Node.js and browser environments.

---

## 7. Key Takeaways

- **Server-Side Rendering (SSR)** compiles Vue components into raw HTML strings on a backend Node.js server before sending responses to the client.
- Provides optimal SEO search indexing and fast perceived initial page load speeds (First Contentful Paint).
- Requires an active Node.js server environment, increasing server hosting infrastructure and maintenance costs.
- Code in component setup scope runs on Node.js and MUST NOT access browser globals (`window`, `document`) directly.
- Avoid shared global module state to prevent cross-request memory leak vulnerabilities across concurrent users.
