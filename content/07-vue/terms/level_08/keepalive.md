# KeepAlive

> **Level 8 — Advanced Architecture & Performance**
> A built-in Vue wrapper component that caches inactive component instances in memory instead of unmounting and destroying them.

---

## 1. Prerequisites

- [Component Lifecycle](../level_04/component_lifecycle.md) — The baseline mounting and unmounting lifecycle process that `<KeepAlive>` fundamentally alters.
- [`v-if` / `v-show`](../level_03/v_if_show.md) — The conditional rendering directives where `<KeepAlive>` serves as the middle ground between node destruction (`v-if`) and CSS hiding (`v-show`).

---

## 2. Term Category

**Vue Built-in Component (State & DOM Caching Mechanism)**: `<KeepAlive>` is an abstract built-in component used to preserve component state and DOM nodes when dynamic components are swapped out. Operating in client-side browser contexts, it intercepts standard unmounting behavior when dynamic `<component :is="...">` or router views change.

When a component wrapped inside `<KeepAlive>` is toggled away, Vue does not trigger `onUnmounted()`. Instead, it deactivates the component, preserving its reactive state variables, scroll positions, form inputs, and child subtrees in memory. When the user navigates back, Vue reactivates the cached instance instantaneously, avoiding expensive DOM re-creation and API refetching cycles.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In tabbed user interfaces, dynamic route views, or multi-step wizard forms, switching between views traditionally causes Vue to unmount and destroy the previous component. When a user fills out a 15-field registration form, clicks over to a "Terms & Conditions" tab, and clicks back, standard component unmounting completely destroys the form component. All typed input state is lost, and the component must be rebuilt from scratch upon re-mounting.

While developers could solve this using `v-show` (hiding elements via CSS `display: none`), `v-show` keeps all DOM nodes rendered in the live browser tree simultaneously, consuming layout performance and executing watchers for hidden elements. **`<KeepAlive>`** provides an ideal architectural compromise: DOM elements for inactive tabs are detached from the active DOM tree and stored in JavaScript RAM. The component remains alive in memory, preserving state without burdening the active browser rendering layout.

### (2) Reality Metaphor
Imagine an artist working in a studio with multiple paintings. In a standard component unmounting model without `<KeepAlive>`, whenever the artist switches from Painting A to Painting B, an assistant burns Painting A to ashes and throws out the easel. When the artist wants to tweak Painting A again, the assistant must redraw every brushstroke from scratch on a new canvas.

`<KeepAlive>` is like a temperature-controlled storage rack behind the studio curtain. When the artist switches to Painting B, the assistant carefully slides Painting A into the storage rack (deactivation). The canvas remains intact, paints stay wet, and no space is taken up on the active painting floor. When the artist wants Painting A back, the assistant instantly slides it back onto the easel (activation).

### (3) Vue Code Examples

#### Short Snippet
```vue
<template>
  <button @click="activeTab = 'ProfileTab'">Profile</button>
  <button @click="activeTab = 'SettingsTab'">Settings</button>

  <!-- Component instances are preserved in memory when swapped -->
  <KeepAlive>
    <component :is="activeTab === 'ProfileTab' ? ProfileTab : SettingsTab" />
  </KeepAlive>
</template>
```

#### Fuller Example
```vue
<script setup>
import { ref, onActivated, onDeactivated } from 'vue'

// Child component demonstrating KeepAlive lifecycle hooks
const searchKeyword = ref('')
const lastRefreshed = ref(new Date().toLocaleTimeString())

// Called when component is inserted from KeepAlive cache
onActivated(() => {
  console.log('Tab activated! Refreshing background data...')
  lastRefreshed.value = new Date().toLocaleTimeString()
})

// Called when component is removed and placed into KeepAlive cache
onDeactivated(() => {
  console.log('Tab deactivated and cached in RAM.')
})
</script>

<template>
  <div class="tab-panel">
    <h3>Search Console (Cached View)</h3>
    <p>Last Active Refresh: {{ lastRefreshed }}</p>
    <input v-model="searchKeyword" placeholder="Type search term..." />
    <p>Preserved Input Value: {{ searchKeyword }}</p>
  </div>
</template>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Memory Leaks by Caching Everything Without Limits
**The mistake:** Wrapping main application `<RouterView>` in an unrestricted `<KeepAlive>` tag for large applications with dozens of complex data views.

**Why it's wrong:** Caching component instances keeps all DOM nodes, reactive state arrays, and child references in browser RAM indefinitely. Caching 50 heavy infinite-scroll feeds will consume gigabytes of RAM and crash client browser tabs. Use the `:max` prop to cap cached instances using Least Recently Used (LRU) eviction.

*Incorrect:*
```vue
<!-- ❌ Caches every route forever, creating massive memory leaks -->
<KeepAlive>
  <component :is="Component" />
</KeepAlive>
```

*Fix:*
```vue
<!-- Enforce LRU cache limit of 5 recent views -->
<KeepAlive :max="5">
  <component :is="Component" />
</KeepAlive>
```

---

### Mistake 2: Expecting `onMounted` or `onUnmounted` to Fire on Cached Tab Switches
**The mistake:** Placing API refresh logic inside `onMounted()` expecting it to execute every time a user returns to a cached `<KeepAlive>` tab.

**Why it's wrong:** Components stored inside `<KeepAlive>` do NOT unmount or mount when toggled. `onMounted` fires once when the component is created initially. Use `<KeepAlive>`'s dedicated lifecycle hooks: `onActivated()` and `onDeactivated()`.

*Incorrect:*
```javascript
onMounted(() => {
  fetchLatestData() // ❌ Does NOT execute when returning to cached tab!
})
```

*Fix:*
```javascript
import { onActivated, onDeactivated } from 'vue'
onActivated(() => {
  fetchLatestData() // Executes every time component is brought back into view
})
```

---

### Mistake 3: Using `include` / `exclude` Props Without Explicit Component Names
**The mistake:** Passing component names to `<KeepAlive include="UserTab">` when `UserTab.vue` lacks an explicit component name definition.

**Why it's wrong:** `<KeepAlive>`'s `include` and `exclude` props match against component explicit `name` options. In Vue 3 `<script setup>`, components derive names from file names, but explicit matching in bundlers often fails without `defineOptions({ name: 'UserTab' })`.

*Incorrect:*
```vue
<!-- Child script setup lacks explicit name -->
<KeepAlive include="UserTab">
  <component :is="currentTab" />
</KeepAlive>
```

*Fix:*
```vue
<!-- Child component explicitly defines component name -->
<script setup>
defineOptions({ name: 'UserTab' })
</script>
```

---

## 5. Practice Exercises

### Exercise 1: Financial Multi-Market Trading Terminal Tabs
**Scenario:** A stock trading platform provides active tabs for NASDAQ, FOREX, and Crypto markets. Switching tabs must preserve active order book form inputs and scroll position while pausing WebSocket telemetry when inactive.

**Requirements:**
1. Wrap tab dynamic components in `<KeepAlive :max="3">`.
2. Implement `onActivated()` in tab components to resume WebSocket streams.
3. Implement `onDeactivated()` in tab components to pause WebSocket streams.
4. Maintain `tradeAmount` ref input value across tab switches.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, onActivated, onDeactivated } from 'vue'
> 
> const tradeAmount = ref(1000)
> const isStreamActive = ref(false)
> let socketTimer = null
> 
> onActivated(() => {
>   isStreamActive.value = true
>   // Resume telemetry stream
>   socketTimer = setInterval(() => {
>     console.log('Streaming tick data...')
>   }, 1000)
> })
> 
> onDeactivated(() => {
>   isStreamActive.value = false
>   // Pause stream to save network bandwidth while cached
>   if (socketTimer) clearInterval(socketTimer)
> })
> </script>
> 
> <template>
>   <div class="market-tab">
>     <h4>Order Book (Stream Status: {{ isStreamActive ? 'ACTIVE' : 'PAUSED' }})</h4>
>     <label>Trade Amount ($):</label>
>     <input v-model.number="tradeAmount" type="number" />
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **State Preservation**: `tradeAmount` ref retains user input seamlessly when switching between market tabs.
> 2. **Bandwidth Optimization**: `onDeactivated()` halts background timers/sockets while the tab is cached, avoiding wasted client CPU cycles.
> 3. **Instant Re-activation**: `onActivated()` restarts live telemetry streams without re-creating DOM inputs or state variables.
> 4. **LRU Protection**: Capping `<KeepAlive :max="3">` ensures unused market tabs are evicted if memory limits are reached.
> 
---

### Exercise 2: Healthcare Patient Registration Wizard Form
**Scenario:** A hospital intake portal uses a multi-step registration wizard (`Step1Personal.vue`, `Step2Insurance.vue`, `Step3MedicalHistory.vue`). Patients can navigate back and forth without losing filled form fields.

**Requirements:**
1. Dynamic component switching using `<component :is="activeStep">`.
2. Wrap dynamic component in `<KeepAlive include="Step1Personal,Step2Insurance,Step3MedicalHistory">`.
3. Provide explicit `defineOptions({ name: ... })` in step components.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <!-- Parent Wizard Host Component -->
> <script setup>
> import { ref, shallowRef } from 'vue'
> import Step1Personal from './Step1Personal.vue'
> import Step2Insurance from './Step2Insurance.vue'
> 
> const currentStep = shallowRef(Step1Personal)
> </script>
> 
> <template>
>   <div class="wizard">
>     <button @click="currentStep = Step1Personal">Step 1: Personal</button>
>     <button @click="currentStep = Step2Insurance">Step 2: Insurance</button>
> 
>     <KeepAlive include="Step1Personal,Step2Insurance">
>       <component :is="currentStep" />
>     </KeepAlive>
>   </div>
> </template>
> 
> <!-- Step1Personal.vue -->
> <script setup>
> import { ref } from 'vue'
> defineOptions({ name: 'Step1Personal' })
> const fullName = ref('')
> const ssn = ref('')
> </script>
> <template>
>   <div class="step-form">
>     <input v-model="fullName" placeholder="Full Legal Name" />
>     <input v-model="ssn" placeholder="SSN" />
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Selective Inclusion**: `include="Step1Personal,Step2Insurance"` restricts caching specifically to wizard step components.
> 2. **Explicit Name Matching**: `defineOptions({ name: 'Step1Personal' })` ensures reliable matching against string inclusion rules.
> 3. **Shallow Ref Optimization**: `shallowRef` holds component definitions without wrapping component internal options in reactivity proxies.
> 4. **Input Loss Prevention**: Patients can toggle back to Step 1 to verify names without clearing input fields.
> 
---

### Exercise 3: E-Commerce Product Catalog Filter View Cache
**Scenario:** An e-commerce search results page allows filtering thousands of items. Opening product detail modals and returning must preserve catalog scroll position and selected search filters.

**Requirements:**
1. Wrap catalog route component inside `<KeepAlive>`.
2. Cache filter checkboxes, page number, and scroll offset.
3. Allow manual clearing of cache upon fresh catalog search.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, onActivated } from 'vue'
> 
> const searchFilter = ref({ category: 'shoes', minPrice: 50, page: 2 })
> const scrollOffset = ref(0)
> 
> onActivated(() => {
>   // Restore scroll position
>   window.scrollTo(0, scrollOffset.value)
> })
> 
> function handleScroll() {
>   scrollOffset.value = window.scrollY
> }
> </script>
> 
> <template>
>   <div class="catalog-view" @scroll="handleScroll">
>     <h3>Catalog (Category: {{ searchFilter.category }}, Page: {{ searchFilter.page }})</h3>
>     <input v-model="searchFilter.category" />
>     <input v-model.number="searchFilter.page" type="number" />
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Scroll Position Retention**: `onActivated()` restores exact pixel scroll coordinates upon returning from detail views.
> 2. **Zero API Refetching**: Product lists and filter selections remain alive in RAM, eliminating network fetch delays.
> 3. **Decoupled Route Views**: Switching between route components does not destroy catalog state variables.
> 4. **Performance Gain**: Prevents DOM re-parsing for thousands of catalog product cards.
> 
---

## 6. Related Terms

- [Component Lifecycle](../level_04/component_lifecycle.md) — The lifecycle system modified by `<KeepAlive>`.
- [`v-if` / `v-show`](../level_03/v_if_show.md) — Alternative conditional rendering strategies.
- [Dynamic Components (`<component :is>`)](../level_04/dynamic_components.md) — Dynamic component swapping mechanism wrapped by `<KeepAlive>`.
- [Async Components](async_components.md) — Lazy-loaded components commonly paired with `<KeepAlive>`.

---

## 7. Key Takeaways

- `<KeepAlive>` caches inactive component instances in memory instead of destroying them.
- Preserves local component state, form inputs, and scroll positions across view swaps.
- Introduces `onActivated()` and `onDeactivated()` lifecycle hooks for cached components.
- Use `:max`, `include`, or `exclude` props to enforce memory limits and prevent RAM leaks.
- Requires explicit component names (`defineOptions({ name: '...' })`) when using string `include`/`exclude` rules.
