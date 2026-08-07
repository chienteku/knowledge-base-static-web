# Nuxt.js

> **Level 9 — Server-Side Rendering (SSR) & Nuxt**
> The official higher-level meta-framework for Vue.js that provides conventions, file-based routing, auto-imports, and automated server-side rendering (SSR) or static site generation (SSG) architectures out of the box.

---

## 1. Prerequisites

- [Server-Side Rendering (SSR)](ssr.md) — The core architecture that Nuxt automates and simplifies.
- [Vue Router](../level_06/vue_router.md) — The routing system that Nuxt completely abstracts via file-based routing conventions.

---

## 2. Term Category

**Meta-Framework (Full-Stack Vue Engine)**: Nuxt.js is an opinionated, production-grade meta-framework built on top of Vue 3, Vite, and Nitro server engine. It automates server-side rendering (SSR), static site generation (SSG), single-page application (SPA), and edge rendering configurations without requiring manual Webpack/Vite dual-compilation setup.

Compared to Next.js in the React ecosystem or SvelteKit in Svelte, Nuxt provides unprecedented developer experience through zero-config auto-imports for Vue composables, file-based routing (`pages/`), server routes (`server/api/`), and universal deployment targets across Node.js, Vercel, Netlify, or Cloudflare Workers.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Configuring Server-Side Rendering manually in Vue requires establishing complex dual-build pipelines (compiling separate client and server bundles), setting up Express/Node servers, handling state rehydration scripts, and managing SSR memory leak guards.

Nuxt was created to eliminate this architectural configuration burden. By wrapping Vue in an opinionated, convention-over-configuration framework (`npx nuxi init`), developers gain instant access to automated file-based routing, server data fetching composables (`useFetch`), built-in head management (`useHead`), dynamic SEO optimization (`useSeoMeta`), and flexible deployment rendering modes.

### (2) Reality Metaphor
Imagine building a modern automobile. Instead of sourcing a bare chassis, buying an engine, manually wiring the transmission, and writing custom ECU software from scratch, you purchase a turnkey luxury performance vehicle with pre-tuned engine management, automated climate control, and built-in GPS navigation.

Vue.js is the high-performance engine; Nuxt is the complete, turnkey luxury automobile built around that engine. It handles steering (routing), ignition (SSR boot process), climate control (head meta management), and fuel delivery (data fetching) automatically.

### (3) Vue Code Examples

#### Short Snippet
```vue
<!-- pages/index.vue -->
<script setup>
// Nuxt auto-imports Vue APIs (ref) and Nuxt composables (useFetch) automatically!
const { data: status } = await useFetch('/api/health')
</script>

<template>
  <div class="status-box">
    <h1>System Status: {{ status?.health || 'Checking...' }}</h1>
  </div>
</template>
```

#### Fuller Example
```vue
<!-- pages/products/[id].vue -->
<script setup>
// File-based route parameters accessible via useRoute()
const route = useRoute()

// useFetch handles SSR server fetch & hydrates data to client payload automatically
const { data: product, pending, error } = await useFetch(
  `https://api.example.com/products/${route.params.id}`,
  {
    key: `product-${route.params.id}`
  }
)

// SSR-friendly Head & SEO management
useSeoMeta({
  title: () => product.value ? `${product.value.title} - Store` : 'Loading Product...',
  description: () => product.value?.description || 'Browse catalog items'
})
</script>

<template>
  <div class="product-detail-container">
    <NuxtLink to="/products" class="back-link">&larr; Back to Catalog</NuxtLink>

    <div v-if="pending" class="loading-skeleton">
      Loading product specification...
    </div>

    <div v-else-if="error" class="error-box">
      Failed to load product details: {{ error.message }}
    </div>

    <article v-else-if="product" class="product-card">
      <h2>{{ product.title }}</h2>
      <p class="price">${{ product.price }}</p>
      <p class="description">{{ product.description }}</p>
      <button class="buy-btn">Add to Shopping Cart</button>
    </article>
  </div>
</template>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using Standard `fetch()` Inside Nuxt Component Setup Scope

**The mistake:** Calling standard `fetch()` or `axios` directly inside setup scope of a Nuxt SSR page.

**Why it's wrong:** Standard `fetch()` executes on the Node.js server to fetch data, but because the payload isn't saved to Nuxt's hydration state, the client executes the exact same `fetch()` request *again* during hydration, causing duplicate API requests and UI flicker.

*Incorrect:*
```vue
<script setup>
import { ref } from 'vue'
const data = ref(null)
// ❌ Executes twice! Once on server, once during client hydration!
fetch('/api/user').then(res => res.json()).then(res => data.value = res)
</script>
```

*Fix:*
```vue
<script setup>
// ✅ useFetch bundles server data into SSR payload, preventing client duplicate fetch
const { data } = await useFetch('/api/user')
</script>
```

---

### Mistake 2: Manually Importing Auto-Imported Nuxt Composables

**The mistake:** Writing `import { ref, computed } from 'vue'` or `import { useRoute } from 'vue-router'` inside Nuxt 3 SFCs.

**Why it's wrong:** Nuxt 3 automatically scans and imports Vue core APIs, Vue Router functions, and custom composables in `composables/`. Adding manual imports creates redundant code boilerplate.

*Incorrect:*
```vue
<script setup>
import { ref } from 'vue' // Redundant manual import in Nuxt 3!
import { useRoute } from 'vue-router'
const route = useRoute()
</script>
```

*Fix:*
```vue
<script setup>
// Nuxt 3 auto-imports ref, computed, useRoute, useFetch, and custom composables!
const route = useRoute()
const count = ref(0)
</script>
```

---

### Mistake 3: Accessing Browser Globals Outside `ClientOnly` or Lifecycle Hooks

**The mistake:** Accessing `window`, `document`, or `navigator` in top-level setup scope of Nuxt pages.

**Why it's wrong:** Nuxt pages pre-render on Node.js server environments during requests. Calling `window` at setup time throws fatal server crashes (`ReferenceError: window is not defined`).

*Incorrect:*
```vue
<script setup>
// Crashes Nuxt SSR server process!
const userLang = navigator.language
</script>
```

*Fix:*
```vue
<script setup>
const userLang = ref('en')

onMounted(() => {
  // Safe browser global access post-mount
  userLang.value = navigator.language
})
</script>
```

---

## 5. Practice Exercises

### Exercise 1: Real-Time Telemetry Analytics Route in Nuxt

**Scenario:** An industrial IoT monitoring platform uses Nuxt 3 to render telemetry nodes. Dynamic routes under `pages/telemetry/[nodeId].vue` must fetch data via `useFetch()` and update page title tags dynamically via `useSeoMeta()`.

**Requirements:**
1. Access `nodeId` dynamic route parameter via `useRoute()`.
2. Fetch node telemetry using Nuxt's `useFetch()`.
3. Set dynamic page SEO titles via `useSeoMeta()`.
4. Include a test assertion verifying node ID resolution and SEO title generation.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <!-- pages/telemetry/[nodeId].vue -->
> <script setup>
> const route = useRoute()
> const nodeId = route.params.nodeId
> 
> // Simulated SSR data fetch
> const { data: nodeData } = await useFetch(`/api/telemetry/${nodeId}`, {
>   default: () => ({ nodeId, temperature: 48.2, status: 'NOMINAL' })
> })
> 
> useSeoMeta({
>   title: `Node ${nodeId} - Telemetry Monitor`
> })
> 
> function testNuxtTelemetry() {
>   console.assert(nodeId === 'ALPHA-01', 'Test Failed: Incorrect route parameter')
>   console.assert(nodeData.value.status === 'NOMINAL', 'Test Failed: Telemetry status missing')
>   console.log('Nuxt Telemetry Route Test Passed')
> }
> 
> // Execute test on client mount
> onMounted(() => {
>   testNuxtTelemetry()
> })
> </script>
> 
> <template>
>   <div class="node-telemetry">
>     <h2>Telemetry Node: {{ nodeId }}</h2>
>     <p>Status: {{ nodeData.status }}</p>
>     <p>Temperature: {{ nodeData.temperature }} °C</p>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: Nuxt dynamic routes automatically map file bracket naming `[nodeId].vue` to `route.params.nodeId`.
> 2. **Concept**: `useFetch` executes asynchronously on SSR server pass, embedding JSON payload into client hydration state.
> 3. **Concept**: `useSeoMeta` injects server-rendered `<title>` tags into HTML response headers for search bots.
> 4. **Concept**: Self-contained test assertions validate route parameter parsing and state initialization.
> 
---

### Exercise 2: Financial Stock Ticker Nuxt API Integration

**Scenario:** A financial news website uses Nuxt to render stock quotes. Stock details are fetched using `useAsyncData` to cache payload data across navigation.

**Requirements:**
1. Fetch stock data using `useAsyncData()`.
2. Compute market capitalization derived from shares and price.
3. Render fallback error UI when API fetches fail.
4. Verify via inline test assertions that cached data loads without client re-fetch.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> const ticker = 'NVDA'
> 
> const { data: stock, error } = await useAsyncData(`stock-${ticker}`, async () => {
>   return { symbol: ticker, price: 480.50, shares: 2500000000 }
> })
> 
> const marketCap = computed(() => {
>   return stock.value ? (stock.value.price * stock.value.shares) / 1e9 : 0
> })
> 
> function testStockFetch() {
>   console.assert(stock.value.symbol === 'NVDA', 'Test Failed: Symbol mismatch')
>   console.assert(marketCap.value > 1000, 'Test Failed: Market cap calculation error')
>   console.log('Nuxt Stock Fetch Test Passed')
> }
> 
> onMounted(() => {
>   testStockFetch()
> })
> </script>
> 
> <template>
>   <div class="stock-quote">
>     <div v-if="error" class="error">Failed to fetch quote</div>
>     <div v-else-if="stock">
>       <h3>{{ stock.symbol }} Quote</h3>
>       <p>Price: ${{ stock.price }}</p>
>       <p>Market Cap: ${{ marketCap.toFixed(2) }}B</p>
>     </div>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: `useAsyncData` allows custom fetch logic while preserving SSR data serialization benefits.
> 2. **Concept**: Unique key identifiers (`stock-NVDA`) allow Nuxt to cache payloads across route transitions.
> 3. **Concept**: `computed` state dynamically derives financial metrics from reactive stock payloads.
> 4. **Concept**: Verification assertions run post-mount to confirm data integrity.
> 
---

### Exercise 3: E-Commerce ClientOnly Shopping Cart Badge

**Scenario:** An e-commerce store built with Nuxt pre-renders static product catalogs. The header cart counter reads `localStorage` items and must be wrapped in Nuxt's `<ClientOnly>` component to prevent hydration mismatches.

**Requirements:**
1. Maintain reactive cart count synced from browser storage.
2. Wrap cart counter markup inside Nuxt `<ClientOnly>` component.
3. Provide fallback skeleton loading markup for server pre-rendering.
4. Verify that local storage synchronization executes post-hydration.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, onMounted } from 'vue'
> 
> const cartCount = ref(0)
> 
> onMounted(() => {
>   const items = JSON.parse(localStorage.getItem('cart') || '[]')
>   cartCount.value = items.length
>   testClientOnlyCart()
> })
> 
> function testClientOnlyCart() {
>   console.assert(typeof cartCount.value === 'number', 'Test Failed: Cart count must be numeric')
>   console.log('Nuxt ClientOnly Cart Test Passed')
> }
> </script>
> 
> <template>
>   <header class="navbar">
>     <div class="brand">Nuxt Commerce</div>
>     <ClientOnly>
>       <div class="cart-badge">
>         🛒 Items in Cart: {{ cartCount }}
>       </div>
>       <template #fallback>
>         <div class="cart-skeleton">🛒 Cart Loading...</div>
>       </template>
>     </ClientOnly>
>   </header>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: Nuxt `<ClientOnly>` skips server rendering for child components, rendering fallback templates during SSR.
> 2. **Concept**: Prevents hydration mismatches caused by reading browser-only storage (`localStorage`) on initial page load.
> 3. **Concept**: Slot fallbacks (`#fallback`) prevent layout shifts during client hydration.
> 4. **Concept**: Verification assertions validate post-mount state reading.
> 
---

## 6. Related Terms

- [Server-Side Rendering (SSR)](ssr.md) — The fundamental architecture that Nuxt simplifies out of the box.
- [Hydration (Vue)](hydration.md) — The process Nuxt coordinates between server HTML and client activation.
- [Static Site Generation (SSG)](ssg.md) — The static build generation target option in Nuxt.
- [Vue Router](../level_06/vue_router.md) — The router engine abstracted by Nuxt file-based routing.

---

## 7. Key Takeaways

- **Nuxt.js** is the official meta-framework for Vue 3, providing zero-config SSR, SSG, and file-based routing architectures.
- Auto-imports Vue core APIs, Nuxt composables, and custom utilities to maximize developer productivity.
- Use `useFetch` and `useAsyncData` to ensure data fetching occurs on the server and serializes safely into client hydration payloads.
- Use `<ClientOnly>` and `onMounted` lifecycle guards to isolate browser-specific code and avoid hydration mismatches.
- Built-in head management (`useSeoMeta`) provides search engine optimization capabilities for Vue applications.
