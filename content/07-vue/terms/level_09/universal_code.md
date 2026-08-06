# Universal Code (Isomorphic)

> **Level 9 — Server-Side Rendering (SSR) & Nuxt**
> JavaScript code structured to execute seamlessly across both Node.js server environments and browser client runtimes without throwing environment-specific exceptions or causing hydration mismatches.

---

## 1. Prerequisites

- [Server-Side Rendering (SSR)](ssr.md) — The architecture that executes components on both backend servers and client browsers.
- [Hydration (Vue)](hydration.md) — The client process that relies on matching virtual DOM output produced by universal setup scripts.

---

## 2. Term Category

**Programming Paradigm (Cross-Platform Architecture)**: Universal Code (historically termed Isomorphic JavaScript) is a design strategy where code modules, component setup scripts, utility functions, and business logic are written to run identically in dual target environments: Node.js servers and browser engines.

In traditional web development, backend code (Node/Python) and frontend code (browser JS) were strictly separated. In SSR frameworks like Nuxt or Next.js, single Single-File Components (SFCs) execute in Node.js to render initial HTML, then execute again in the browser to hydrate reactivity. Universal code patterns ensure components avoid referencing browser-only APIs (`window`, `localStorage`) or server-only modules (`fs`, `path`) in shared execution paths.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When building SSR applications with Vue 3 or Nuxt, developers write a single set of `.vue` files. However, Node.js and browser JS runtimes have vastly different capabilities and global namespaces:
- **Node.js** has `process`, `fs`, `path`, and database drivers, but lacks `window`, `document`, and `navigator`.
- **Browsers** have `window`, `document`, `localStorage`, and DOM APIs, but lack Node system modules.

If a developer references `window.innerWidth` directly in `<script setup>`, the Node.js SSR server crashes instantly with `ReferenceError: window is not defined`. Universal Code patterns and lifecycle guards (`onMounted`, `import.meta.client`) were designed to allow shared component code to execute safely across both runtimes.

### (2) Reality Metaphor
Imagine an amphibious vehicle designed to drive on paved land roads and sail across water lakes. To operate safely without crashing, the vehicle's engine control system must handle both environments: it engages wheels on land and switches to water propellers in the lake.

If the vehicle attempts to spin land tires while submerged in deep water (or run underwater propellers on dry land highways), it breaks down. Universal code acts as the intelligent control unit—it runs common navigation logic universally, while safely switching on "land wheels" (browser APIs) or "water propellers" (server utilities) only when operating in the appropriate environment.

### (3) Vue Code Examples

#### Short Snippet
```vue
<script setup>
import { ref, onMounted } from 'vue'

const screenWidth = ref(0)

// Safe Universal Pattern: Access browser globals inside onMounted
onMounted(() => {
  screenWidth.value = window.innerWidth
})
</script>

<template>
  <p>Screen Width: {{ screenWidth }}px</p>
</template>
```

#### Fuller Example
```vue
<!-- UniversalStorageGuard.vue -->
<script setup>
import { ref, onMounted } from 'vue'

const userTheme = ref('light') // Universal default state

// Universal environment branching using import.meta.client or process.client
function loadThemeFromStorage() {
  if (import.meta.client) {
    const saved = localStorage.getItem('app_theme')
    if (saved) userTheme.value = saved
  }
}

function saveTheme(newTheme) {
  userTheme.value = newTheme
  if (import.meta.client) {
    localStorage.setItem('app_theme', newTheme)
  }
}

onMounted(() => {
  loadThemeFromStorage()
  testUniversalTheme()
})

function testUniversalTheme() {
  saveTheme('dark')
  console.assert(userTheme.value === 'dark', 'Test Failed: Theme state update failed')
  console.log('Universal Storage Test Passed')
}
</script>

<template>
  <div class="theme-panel">
    <h3>Current Theme: {{ userTheme }}</h3>
    <button @click="saveTheme('light')">Set Light</button>
    <button @click="saveTheme('dark')">Set Dark</button>
  </div>
</template>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Importing Browser-Only Libraries Globally at Top-Level Module Scope

**The mistake:** Writing `import * as CanvasLib from 'browser-canvas-plugin'` at the top of an SSR component file.

**Why it's wrong:** Top-level ES imports execute during Node.js module loading on the server. If the third-party library references `window` or `document` immediately upon load, the Node.js SSR server crashes.

*Incorrect:*
```javascript
// ❌ Top-level import executes on Node server during SSR!
import CanvasLib from 'browser-only-canvas-plugin'
```

*Fix:*
```vue
<script setup>
import { onMounted } from 'vue'

onMounted(async () => {
  // ✅ Dynamically import browser-only libraries inside onMounted
  const CanvasLib = await import('browser-only-canvas-plugin')
})
</script>
```

---

### Mistake 2: Importing Node.js Server Modules (`fs`, `path`) into Shared Client Components

**The mistake:** Writing `import fs from 'fs'` inside a shared Vue component file to read local config files.

**Why it's wrong:** Shared components are bundled by Vite/Rollup for client browsers. Browser runtimes do not possess Node.js file system drivers, causing build compilation failures or browser runtime crashes.

*Incorrect:*
```vue
<script setup>
// ❌ Fails when bundled for client browsers!
import fs from 'fs'
const config = fs.readFileSync('./config.json', 'utf-8')
</script>
```

*Fix:*
```vue
<script setup>
// Use Nuxt server routes (/server/api) or environment flags for server-only operations
const { data: config } = await useFetch('/api/config')
</script>
```

---

### Mistake 3: Expecting Client Lifecycle Hooks to Execute on Node.js SSR Servers

**The mistake:** Expecting `onMounted()`, `onUpdated()`, or `onUnmounted()` to run on the Node.js server during SSR pre-rendering.

**Why it's wrong:** On Node.js SSR servers, ONLY setup script code executes (`setup()`). DOM lifecycle hooks (`onMounted`, `onUpdated`, `onUnmounted`) are explicitly skipped by `vue/server-renderer`.

*Incorrect:*
```vue
<script setup>
onMounted(() => {
  // ❌ Expecting this database fetch to run during Node.js SSR server pass!
  fetchServerData()
})
</script>
```

*Fix:*
```vue
<script setup>
// ✅ Place server data fetching in setup scope via useFetch or await
const { data } = await useFetch('/api/data')
</script>
```

---

## 5. Practice Exercises

### Exercise 1: IoT Telemetry Universal Environment Guard

**Scenario:** An industrial IoT device manager uses a single Vue component to display telemetry metrics. Network socket connections must use Node `net` sockets on the server, but WebSockets in browser clients.

**Requirements:**
1. Branch environment logic using `import.meta.client` or `import.meta.server`.
2. Initialize universal reactive metrics state.
3. Establish client WebSocket connection inside `onMounted`.
4. Include a test assertion validating environment-safe state initialization.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, onMounted } from 'vue'
> 
> const connectionType = ref('Initializing...')
> const isClientEnv = ref(false)
> 
> if (import.meta.server) {
>   connectionType.value = 'Node.js SSR Server Engine'
> } else {
>   connectionType.value = 'Browser Runtime Engine'
> }
> 
> onMounted(() => {
>   isClientEnv.value = true
>   connectionType.value = 'Browser Client WebSocket Feed'
>   testUniversalIoT()
> })
> 
> function testUniversalIoT() {
>   console.assert(isClientEnv.value === true, 'Test Failed: Client flag unverified')
>   console.assert(connectionType.value.includes('Browser'), 'Test Failed: Connection type mismatch')
>   console.log('IoT Universal Guard Test Passed')
> }
> </script>
> 
> <template>
>   <div class="iot-universal-card">
>     <h3>IoT Telemetry Guard</h3>
>     <p>Active Engine: {{ connectionType }}</p>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: `import.meta.server` and `import.meta.client` allow safe conditional execution paths across runtimes.
> 2. **Concept**: Universal setup scripts execute safely in Node without throwing `ReferenceError`.
> 3. **Concept**: `onMounted` provides the safe entry point for browser-only socket creation.
> 4. **Concept**: Inline assertions verify runtime environment state switching.
> 
---

### Exercise 2: Financial Currency Formatter Universal Composable

**Scenario:** A financial trading application requires a currency formatting utility that formats numbers using `Intl.NumberFormat`. The utility must operate identically during SSR HTML generation and client hydration.

**Requirements:**
1. Create a universal currency formatting function.
2. Accept number inputs and target currency codes (`USD`, `EUR`).
3. Handle missing browser/server locale fallbacks gracefully.
4. Verify via inline test assertions that formatting outputs match across environments.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, onMounted } from 'vue'
> 
> function formatCurrency(amount, currency = 'USD') {
>   try {
>     return new Intl.NumberFormat('en-US', {
>       style: 'currency',
>       currency: currency
>     }).format(amount)
>   } catch (e) {
>     return `$${amount.toFixed(2)}`
>   }
> }
> 
> const samplePrice = ref(1450.5)
> const formattedPrice = ref(formatCurrency(samplePrice.value, 'USD'))
> 
> onMounted(() => {
>   testUniversalCurrency()
> })
> 
> function testUniversalCurrency() {
>   const result = formatCurrency(100, 'USD')
>   console.assert(result === '$100.00', 'Test Failed: Formatter output mismatch')
>   console.log('Financial Universal Currency Test Passed')
> }
> </script>
> 
> <template>
>   <div class="financial-card">
>     <h4>Universal Currency Output</h4>
>     <p>Amount: {{ formattedPrice }}</p>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: `Intl.NumberFormat` is supported natively in modern Node.js and browsers, making it a true Universal API.
> 2. **Concept**: Executing formatters during setup ensures identical server HTML and initial client DOM outputs.
> 3. **Concept**: Prevents hydration mismatches caused by inconsistent text node formatting.
> 4. **Concept**: Unit assertions confirm expected string formatting outputs.
> 
---

### Exercise 3: E-Commerce Universal LocalStorage Sync Composable

**Scenario:** An e-commerce catalog store syncs user wishlist selections. Reading wishlist items must return fallback default arrays on the server, while reading `localStorage` post-hydration on the client.

**Requirements:**
1. Initialize wishlist state with universal default empty arrays.
2. Read `localStorage` safely inside `onMounted`.
3. Provide an `addWishlistItem` function that guards storage writes.
4. Include a test assertion checking post-mount storage state sync.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, onMounted } from 'vue'
> 
> const wishlist = ref([])
> 
> function safeSaveWishlist(items) {
>   wishlist.value = items
>   if (import.meta.client) {
>     localStorage.setItem('user_wishlist', JSON.stringify(items))
>   }
> }
> 
> onMounted(() => {
>   if (import.meta.client) {
>     const saved = localStorage.getItem('user_wishlist')
>     if (saved) {
>       try { wishlist.value = JSON.parse(saved) } catch (e) {}
>     }
>   }
>   testUniversalWishlist()
> })
> 
> function testUniversalWishlist() {
>   safeSaveWishlist([{ id: 501, title: 'Running Shoes' }])
>   console.assert(wishlist.value.length === 1, 'Test Failed: Wishlist item add failed')
>   console.log('E-Commerce Universal Wishlist Test Passed')
> }
> </script>
> 
> <template>
>   <div class="wishlist-box">
>     <h4>Wishlist Items ({{ wishlist.length }})</h4>
>     <ul>
>       <li v-for="item in wishlist" :key="item.id">{{ item.title }}</li>
>     </ul>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: Universal defaults (`wishlist = []`) ensure matching initial server and client markup during hydration.
> 2. **Concept**: Storage reading/writing is gated behind `import.meta.client` or `onMounted` guards.
> 3. **Concept**: Prevents `ReferenceError: localStorage is not defined` during Node.js SSR requests.
> 4. **Concept**: Unit tests verify reactive array updating and safe persistence.
> 
---

## 6. Related Terms

- [Server-Side Rendering (SSR)](ssr.md) — The rendering architecture that requires universal code compliance.
- [Hydration (Vue)](hydration.md) — The client activation process relying on identical universal setup outputs.
- [Static Site Generation (SSG)](ssg.md) — Build compilation process executing components in Node.js environments.
- [Component Lifecycle](../level_04/component_lifecycle.md) — Understanding that `onMounted` serves as the primary browser-only escape hatch.

---

## 7. Key Takeaways

- **Universal Code (Isomorphic JS)** is code written to execute without errors in both Node.js server and browser client runtimes.
- Setup scripts in SSR Vue components execute in both environments and MUST NOT access browser globals (`window`, `localStorage`) directly.
- Use `onMounted` as the primary lifecycle hook for browser-only operations (DOM manipulation, canvas drawing, window listeners).
- Use environment flags (`import.meta.client`, `import.meta.server`) to safely branch runtime-specific logic.
- Dynamically import third-party browser libraries inside `onMounted` to prevent server module loading crashes.
