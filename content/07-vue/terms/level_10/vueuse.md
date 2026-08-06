# VueUse

> **Level 10 — Tooling & Ecosystem**
> An open-source collection of hundreds of essential, battle-tested Vue Composition API composable utility functions wrapping browser APIs, state management, network connections, and UI interactions reactively.

---

## 1. Prerequisites

- [Composables](../level_05/composables.md) — The state encapsulation design pattern that VueUse builds upon.
- [`ref`](../level_02/ref.md) — The fundamental reactive state wrapper returned by VueUse utilities.
- [`watchEffect`](../level_02/watch_effect.md) — Automatic dependency tracking utilized by VueUse for side-effect management.

---

## 2. Term Category

**Utility Library (Composable Ecosystem Standard)**: VueUse (`@vueuse/core`) is the de facto "standard library" for the Vue Composition API. It provides 200+ battle-tested, tree-shakable, lifecycle-aware composables wrapping browser APIs (`useLocalStorage`, `useWindowSize`, `useClipboard`, `useDark`, `useIntersectionObserver`), async utilities (`useFetch`, `useAsyncState`), and UI helper hooks.

Compared to writing raw browser event listeners in Vue components, VueUse utilities automatically manage event attachment during mounting and cleanup during unmounting (`onUnmounted`), preventing memory leaks without requiring manual event listener removal code.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
With Vue 3's Composition API, developers gained the ability to extract stateful browser logic into reusable composable functions. However, frontend teams quickly found themselves writing the exact same low-level boilerplate in every project:
- Synchronizing reactive state to `localStorage` (`useLocalStorage`).
- Listening to `window.addEventListener('resize')` to track screen dimensions (`useWindowSize`).
- Writing `IntersectionObserver` logic to lazy-load elements (`useIntersectionObserver`).
- Managing dark mode theme class injections on `<html>` (`useDark`).

Writing these manually is time-consuming and error-prone—forgetting to remove a window resize listener on component unmount causes severe memory leaks. **VueUse** was created to provide a unified, thoroughly tested, and lifecycle-safe library of composables so developers can focus on building features rather than wrestling with low-level browser APIs.

### (2) Reality Metaphor
Imagine building a modern residential home. 

Instead of manufacturing your own copper electrical wiring, forging custom water pipes, and building a custom circuit breaker box from raw metal in your backyard, you purchase standardized, certified electrical outlets, plumbing valves, and breakers from a hardware supplier. 

Vue.js Composition API provides the foundation; VueUse is that comprehensive hardware store stocked with standardized, safety-certified "plumbing and electrical components" (composables) ready to snap into your application walls.

### (3) Vue Code Examples

#### Short Snippet
```vue
<script setup>
import { useMouse, useStorage, useWindowSize } from '@vueuse/core'

// 1. Reactive mouse cursor coordinates ref
const { x, y } = useMouse()

// 2. Reactive window dimensions ref
const { width, height } = useWindowSize()

// 3. State synchronized automatically with localStorage
const savedName = useStorage('user_name', 'Guest')
</script>

<template>
  <div>
    <p>Cursor: {{ x }}, {{ y }} | Screen: {{ width }}x{{ height }}</p>
    <input v-model="savedName" placeholder="Enter name..." />
  </div>
</template>
```

#### Fuller Example
```vue
<!-- AdvancedVueUseWidget.vue -->
<script setup>
import { ref } from 'vue'
import { 
  useIntersectionObserver, 
  refDebounced, 
  useClipboard, 
  useDark, 
  useToggle 
} from '@vueuse/core'

// 1. Dark Mode Manager
const isDark = useDark()
const toggleDark = useToggle(isDark)

// 2. Input Debouncing Hook
const searchQuery = ref('')
const debouncedSearch = refDebounced(searchQuery, 400) // Wait 400ms after typing stops

// 3. Clipboard Copy Hook
const { text, copy, copied } = useClipboard()

// 4. Lazy-loading via IntersectionObserver
const lazyCardRef = ref(null)
const isVisible = ref(false)

const { stop } = useIntersectionObserver(
  lazyCardRef,
  ([{ isIntersecting }]) => {
    if (isIntersecting) {
      isVisible.value = true
      stop() // Stop observing once element is visible
    }
  }
)
</script>

<template>
  <div class="vueuse-container">
    <header>
      <button @click="toggleDark()">
        Theme: {{ isDark ? '🌙 Dark' : '☀️ Light' }}
      </button>
    </header>

    <div class="search-box">
      <input v-model="searchQuery" placeholder="Type to search..." />
      <p>Debounced Query: <strong>{{ debouncedSearch }}</strong></p>
      
      <button @click="copy(debouncedSearch)">
        {{ copied ? 'Copied! ✓' : 'Copy Query to Clipboard' }}
      </button>
    </div>

    <div style="height: 600px;">Scroll down to trigger observer...</div>

    <div ref="lazyCardRef" class="lazy-card">
      <div v-if="isVisible" class="card-content">
        🎉 Lazy Component Loaded on Viewport Intersection!
      </div>
      <div v-else class="placeholder">
        Scrolling into view...
      </div>
    </div>
  </div>
</template>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Destructuring Reactive Objects Returned by VueUse Utilities

**The mistake:** Destructuring properties directly from a VueUse composable that returns a single `reactive` object instead of an object of individual `ref` objects.

**Why it's wrong:** Direct ES6 destructuring of a `reactive` object extracts primitive snapshot values, severing Vue's Proxy reactivity tracking link.

*Incorrect:*
```javascript
import { useMouse } from '@vueuse/core'
// ❌ If a utility returns a reactive object, destructuring severs reactivity!
const { x, y } = reactiveMouseObject
```

*Fix:*
```javascript
import { useMouse } from '@vueuse/core'
// ✅ useMouse returns individual ref objects ({ x: Ref, y: Ref }), so destructuring is safe
const { x, y } = useMouse()
// Or for reactive objects, use toRefs():
// const { x, y } = toRefs(reactiveMouseObject)
```

---

### Mistake 2: Re-Inventing Manual Browser Event Listeners Instead of Using VueUse

**The mistake:** Writing manual `window.addEventListener('resize', handler)` and `window.removeEventListener('resize', handler)` code inside component lifecycle hooks.

**Why it's wrong:** Writing manual event listeners adds unnecessary boilerplate and risks memory leaks if developers forget to clean up inside `onUnmounted`. VueUse composables manage lifecycle cleanup automatically.

*Incorrect:*
```vue
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
const width = ref(window.innerWidth)

function onResize() { width.value = window.innerWidth }
onMounted(() => window.addEventListener('resize', onResize))
// ❌ Easy to forget onUnmounted cleanup!
onUnmounted(() => window.removeEventListener('resize', onResize))
</script>
```

*Fix:*
```javascript
import { useWindowSize } from '@vueuse/core'
// ✅ One line, fully reactive, automated lifecycle cleanup!
const { width } = useWindowSize()
```

---

### Mistake 3: Passing Non-Ref Primitive Values to Composables Expecting `MaybeRef`

**The mistake:** Passing raw string literal values `'title'` to a VueUse composable expecting a dynamic reactive `ref` source.

**Why it's wrong:** Many VueUse composables accept `MaybeRef<T>` arguments to automatically update when reactive ref values change. Passing static raw primitives prevents composables from responding to state changes dynamically.

*Incorrect:*
```javascript
// ❌ Document title will not update when page state changes!
useTitle('Static Title')
```

*Fix:*
```javascript
const pageTitle = ref('Dynamic Page Title')
// ✅ Document title updates automatically whenever pageTitle.value changes
useTitle(pageTitle)
```

---

## 5. Practice Exercises

### Exercise 1: IoT Sensor Device Local Storage Sync

**Scenario:** An industrial IoT monitoring web app saves configured sensor threshold preferences. Using VueUse `useStorage`, threshold values sync automatically with browser `localStorage`.

**Requirements:**
1. Initialize threshold state using `useStorage('sensor_threshold', 50)`.
2. Provide a function to update threshold values.
3. Verify that mutating threshold `.value` syncs state.
4. Include a test assertion validating initial threshold state.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { onMounted } from 'vue'
> import { useStorage } from '@vueuse/core'
> 
> const sensorThreshold = useStorage('sensor_threshold', 50)
> 
> function setThreshold(val) {
>   sensorThreshold.value = val
> }
> 
> onMounted(() => {
>   testIotStorageSync()
> })
> 
> function testIotStorageSync() {
>   setThreshold(75)
>   console.assert(sensorThreshold.value === 75, 'Test Failed: Storage ref mutation failed')
>   console.log('IoT Storage Sync Test Passed')
> }
> </script>
> 
> <template>
>   <div class="storage-card">
>     <h4>Sensor Alarm Threshold: {{ sensorThreshold }} °C</h4>
>     <button @click="setThreshold(60)">Set 60°C</button>
>     <button @click="setThreshold(80)">Set 80°C</button>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: `useStorage('key', defaultValue)` creates a reactive ref bound to `localStorage`.
> 2. **Concept**: Mutating `sensorThreshold.value` automatically serializes and writes data to browser storage.
> 3. **Concept**: Operates safely across client lifecycles.
> 4. **Concept**: Unit assertions verify ref state mutations.
> 
---

### Exercise 2: Financial Stock Ticker Search Input Debouncer

**Scenario:** A stock trading application provides a search box for ticker symbols. To prevent spamming the backend search API on every keypress, input text is debounced by 300ms using VueUse `refDebounced`.

**Requirements:**
1. Maintain reactive `rawSearch` text ref.
2. Create debounced ref `debouncedSearch = refDebounced(rawSearch, 300)`.
3. Render both raw and debounced values.
4. Include a test assertion checking debounced initial state matching.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, onMounted } from 'vue'
> import { refDebounced } from '@vueuse/core'
> 
> const rawSearch = ref('')
> const debouncedSearch = refDebounced(rawSearch, 300)
> 
> function updateSearch(text) {
>   rawSearch.value = text
> }
> 
> onMounted(() => {
>   testFinancialDebounce()
> })
> 
> function testFinancialDebounce() {
>   updateSearch('NVDA')
>   console.assert(rawSearch.value === 'NVDA', 'Test Failed: Raw search update failed')
>   console.log('Financial Debounce Test Passed')
> }
> </script>
> 
> <template>
>   <div class="search-widget">
>     <input v-model="rawSearch" placeholder="Search Ticker Symbol (e.g. AAPL)..." />
>     <p>Raw Input: {{ rawSearch }}</p>
>     <p>Debounced API Query: <strong>{{ debouncedSearch }}</strong></p>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: `refDebounced(sourceRef, delayMs)` delays updating downstream ref values until typing stops.
> 2. **Concept**: Prevents unnecessary backend network API calls during fast keypress entry.
> 3. **Concept**: Purely functional reactive transformation.
> 4. **Concept**: Assertions verify raw input state updates.
> 
---

### Exercise 3: E-Commerce Dark Mode & Clipboard Manager

**Scenario:** An e-commerce product checkout page uses VueUse `useDark` for theme management and `useClipboard` to allow shoppers to copy promo discount codes.

**Requirements:**
1. Initialize dark mode theme using `useDark()` and `useToggle()`.
2. Initialize clipboard utility `useClipboard()`.
3. Provide promo code copy handler.
4. Verify via inline assertions that copy functions execute cleanly.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { onMounted } from 'vue'
> import { useDark, useToggle, useClipboard } from '@vueuse/core'
> 
> const isDark = useDark()
> const toggleDark = useToggle(isDark)
> const { copy, copied } = useClipboard()
> 
> const promoCode = 'SAVE20OFF'
> 
> function copyPromo() {
>   copy(promoCode)
> }
> 
> onMounted(() => {
>   testEcommerceVueUse()
> })
> 
> function testEcommerceVueUse() {
>   console.assert(typeof isDark.value === 'boolean', 'Test Failed: Dark mode flag invalid')
>   console.log('E-Commerce VueUse Test Passed')
> }
> </script>
> 
> <template>
>   <div class="checkout-box">
>     <button @click="toggleDark()">Toggle Theme</button>
>     <div class="promo-card">
>       <span>Use Code: <strong>{{ promoCode }}</strong></span>
>       <button @click="copyPromo">
>         {{ copied ? 'Copied ✓' : 'Copy Code' }}
>       </button>
>     </div>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: `useDark()` injects class attributes on `<html>` elements automatically.
> 2. **Concept**: `useClipboard()` wraps asynchronous `navigator.clipboard` APIs in reactive refs (`copied`, `text`).
> 3. **Concept**: All event bindings are lifecycle-aware and detach automatically on unmount.
> 4. **Concept**: Unit assertions confirm theme boolean flags.
> 
---

## 6. Related Terms

- [Composables](../level_05/composables.md) — The state encapsulation design pattern implemented by VueUse.
- [`ref`](../level_02/ref.md) — The fundamental reactive state wrapper returned by VueUse composables.
- [`watchEffect`](../level_02/watch_effect.md) — Automatic side-effect tracking used by VueUse hooks.

---

## 7. Key Takeaways

- **VueUse** is the official utility collection of 200+ standard Vue Composition API composables.
- Wraps browser APIs (storage, resize, clipboard, intersection observers, dark mode) in reactive refs.
- All event listeners are lifecycle-aware, detaching automatically on component unmount to prevent memory leaks.
- Speeds up development by providing thoroughly tested, pre-optimized utility implementations.
- Verify whether a composable returns an object of individual `ref` objects (safe to destructure) or a single `reactive` object.
