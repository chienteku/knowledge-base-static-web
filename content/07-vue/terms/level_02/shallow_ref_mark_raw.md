# `shallowRef` / `markRaw`

> **Level 2 — Reactivity System**
> Performance escape hatches in Vue's reactivity system used to bypass deep reactive proxy wrapping for large datasets, third-party library instances, or immutable structures.

---

## 1. Prerequisites

- [`ref`](ref.md) — The standard reactive wrapper primitive that `shallowRef` acts as a shallow alternative to.
- [`reactive`](reactive.md) — The API that makes objects recursively reactive, which `markRaw` explicitly opts-out of.

---

## 2. Term Category

**Vue Reactivity API / Performance Escape Hatches (Non-Deep Reactivity Control)**: `shallowRef()` and `markRaw()` are low-level performance optimization utilities in Vue 3. 

- `shallowRef()` creates a ref that tracks mutations **only** to its root `.value` pointer, leaving nested object properties non-reactive and un-proxied.
- `markRaw()` permanently tags a target object with a non-enumerable `__v_skip: true` flag, preventing Vue from ever converting it into a reactive proxy.

Used across client components managing third-party DOM instances (Chart.js, Leaflet, Monaco Editor) or large data lists, these functions eliminate recursive Proxy creation overhead.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
By default, Vue's reactivity system is **deep**. When you pass a large nested object or array into `ref()` or `reactive()`, Vue recursively walks every child property, wrapping every nested object in an ES6 `Proxy`.

This deep reactivity makes Vue feel intuitive. However, deep proxying introduces significant CPU and memory overhead in two common enterprise scenarios:
1. **Massive Datasets**: Rendering a table with 10,000 immutable rows fetched from a REST API. Recursively proxying 100,000 nested properties can freeze the browser for several seconds.
2. **Third-Party Library Instances**: Storing instances of complex external classes (such as Leaflet Maps, Three.js 3D scenes, or Monaco Code Editor instances) inside Vue state. Third-party class instances rely on internal private variables, strict reference equality, and direct internal mutations. Wrapping them in Vue reactive proxies alters their internal execution context, causing fatal runtime exceptions or catastrophic memory leaks.

Vue created **`shallowRef()`** and **`markRaw()`** to solve these problems:
- **`shallowRef()`**: Tracks only root `.value` pointer replacements. Inner nested mutations are ignored by Vue's reactivity engine.
- **`markRaw()`**: Expressly instructs Vue: *"Do NOT turn this object into a Proxy under any circumstances."*

### (2) Reality Metaphor
Think of an Armored Freight Shipping Container (`shallowRef()`) versus a Transparent Glass Display Case (`ref()`).

With a Transparent Glass Display Case (`ref()`), every single item placed inside—down to the smallest screw, label, or inner box—is constantly visible and tracked by security cameras. If someone shifts an item inside an inner box, the security alarm rings.

An Armored Freight Shipping Container (`shallowRef()`) has a single heavy steel door lock marked `.value`. Security cameras check *only* whether the container door itself is unlocked or swapped (`container.value = newContainer`). What happens inside the container is private; security cameras ignore internal repositioning entirely, saving massive surveillance bandwidth.

### (3) Vue Code Examples

#### Short Snippet
```vue
<script setup>
import { shallowRef, markRaw } from 'vue'

// 1. shallowRef: Only root .value reassignment triggers reactivity
const state = shallowRef({ nested: { count: 0 } })

function testShallow() {
  state.value.nested.count++ // ❌ Memory updates, but UI DOES NOT re-render!
  state.value = { nested: { count: 10 } } // ✅ UI re-renders!
}

// 2. markRaw: Prevents an object from ever becoming reactive
const rawTool = markRaw({ log: () => console.log('Executing raw tool') })
</script>

<template>
  <button @click="testShallow">Update Shallow Ref</button>
</template>
```

#### Fuller Example
```vue
<script setup>
import { onMounted, onBeforeUnmount, shallowRef, markRaw } from 'vue'
import Chart from 'chart.js/auto'

// Store third-party chart instance in shallowRef to prevent Proxy wrapping!
const chartInstance = shallowRef(null)
const canvasRef = shallowRef(null)

onMounted(() => {
  if (!canvasRef.value) return

  // Mark configuration data as raw to bypass reactive proxy creation
  const config = markRaw({
    type: 'bar',
    data: {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      datasets: [{ label: 'Revenue ($M)', data: [12, 19, 15, 22] }]
    }
  })

  // Instantiate third-party class and store in shallowRef
  chartInstance.value = new Chart(canvasRef.value, config)
})

onBeforeUnmount(() => {
  if (chartInstance.value) {
    chartInstance.value.destroy() // Destroy third-party instance cleanly
  }
})
</script>

<template>
  <div class="chart-container">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Mutating Nested Properties on a `shallowRef()` Expecting UI Updates

**The mistake:** Mutating a nested field (`user.value.profile.age++`) on a `shallowRef()` instance.

**Why it's wrong:** `shallowRef()` intercepts getter/setter calls ONLY on the root `.value` property. Deep nested mutations alter values in memory, but bypass Vue's reactivity system completely, leaving the UI stale.

*Incorrect:*
```javascript
const user = shallowRef({ name: 'Alice', age: 30 })
function birthday() {
  user.value.age++ // ❌ Deep mutation ignored by shallowRef! UI will not update!
}
```

*Fix:*
```javascript
const user = shallowRef({ name: 'Alice', age: 30 })
function birthday() {
  user.value = { ...user.value, age: user.value.age + 1 } // Reassign .value entirely
}
```

---

### Mistake 2: Attempting to Wrap `markRaw()` Objects in `reactive()` Later

**The mistake:** Wrapping an object previously marked with `markRaw()` inside a `reactive()` state object expecting it to become reactive.

**Why it's wrong:** `markRaw()` attaches an immutable `__v_skip: true` property to the object. `reactive()` detects this flag and skips proxy creation, returning the raw un-proxied object.

*Incorrect:*
```javascript
const rawConfig = markRaw({ theme: 'dark' })
const state = reactive({ config: rawConfig })
state.config.theme = 'light' // ❌ state.config remains un-proxied! UI will not update!
```

*Fix:*
```javascript
/* Use markRaw explicitly ONLY for non-reactive instances (e.g. Monaco Editor, Chart.js) */
```

---

### Mistake 3: Confusing `shallowRef()` with `shallowReactive()`

**The mistake:** Using `shallowRef({ count: 0 })` and expecting to read `state.count` directly without `.value`.

**Why it's wrong:** `shallowRef` returns a ref object requiring `.value` to access its root payload (`state.value.count`). `shallowReactive` returns a shallow reactive object accessed directly (`state.count`).

*Incorrect:*
```javascript
const state = shallowRef({ count: 0 })
console.log(state.count) // ❌ undefined! Access via state.value.count
```

*Fix:*
```javascript
const state = shallowRef({ count: 0 })
console.log(state.value.count) // Access inner value via .value
```

---

## 5. Practice Exercises

### Exercise 1: High-Frequency Log Streaming Performance Optimizer

**Scenario:** A server log dashboard receives 1,000 log items per second. Using standard `ref()` causes browser lagging. Optimize it using `shallowRef()`.
**Requirements:**
1. Declare `logs = shallowRef([])`.
2. Implement `appendLogs(batch)` reassigning `logs.value = [...logs.value, ...batch]`.
3. Compute `logCount`.
4. Validate array reassignment reactivity via test assertions.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { shallowRef, computed } from 'vue'
> 
> const logs = shallowRef([])
> 
> const logCount = computed(() => logs.value.length)
> 
> function appendLogs(newBatch) {
>   // Reassign .value to trigger shallowRef dependency notification
>   logs.value = [...logs.value, ...newBatch]
> }
> 
> // Test assertion
> console.assert(logCount.value === 0, 'Initial log count 0')
> appendLogs(['[INFO] Server Started', '[INFO] DB Connected'])
> console.assert(logCount.value === 2, 'Log count should update to 2 after .value reassignment')
> </script>
> 
> <template>
>   <div>
>     <p>Total Streamed Logs: {{ logCount }}</p>
>     <ul>
>       <li v-for="(log, idx) in logs" :key="idx">{{ log }}</li>
>     </ul>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Zero deep proxy overhead**: `shallowRef` prevents Vue from creating 10,000 individual Proxy wrappers for log objects.
> 2. **Root pointer notification**: Assigning `logs.value = [...]` invokes the root setter trap once, triggering a single Virtual DOM patch.
> 3. **Memory efficiency**: Reduces garbage collection churn during high-frequency data streams.
> 4. **Template rendering**: Template loops iterate over the raw array payload efficiently.
> 
---

### Exercise 2: Industrial Leaflet Map Class Instance Encapsulated Manager

**Scenario:** An industrial asset tracking dashboard embeds a Leaflet Map instance safely using `markRaw()` and `shallowRef()`.
**Requirements:**
1. Declare `mapInstance = shallowRef(null)`.
2. Use `markRaw()` on Map configuration options.
3. Provide `destroyMap()` cleanup helper.
4. Verify non-reactive instance protection via assertions.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { shallowRef, markRaw } from 'vue'
> 
> class MockLeafletMap {
>   constructor(options) {
>     this.options = options
>     this.isDestroyed = false
>   }
>   destroy() {
>     this.isDestroyed = true
>   }
> }
> 
> const mapInstance = shallowRef(null)
> 
> function initMap() {
>   const options = markRaw({ zoom: 12, center: [37.7749, -122.4194] })
>   const rawMap = new MockLeafletMap(options)
>   mapInstance.value = markRaw(rawMap)
> }
> 
> function destroyMap() {
>   if (mapInstance.value) {
>     mapInstance.value.destroy()
>     mapInstance.value = null
>   }
> }
> 
> // Test assertions
> initMap()
> console.assert(mapInstance.value !== null, 'Map should be initialized')
> console.assert(mapInstance.value.__v_skip === true, 'Map instance must be marked raw')
> destroyMap()
> console.assert(mapInstance.value === null, 'Map should be cleared')
> </script>
> 
> <template>
>   <div>
>     <button @click="initMap">Init Map</button>
>     <button @click="destroyMap">Destroy Map</button>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **`markRaw` skipping flag**: `markRaw()` attaches `__v_skip: true` to prevent proxy conversion.
> 2. **Class method integrity**: Bypassing reactive proxies preserves native class method binding and private variables.
> 3. **`shallowRef` container**: `shallowRef` stores the raw instance pointer safely without inspecting internal properties.
> 4. **Lifecycle safety**: Enables clean destruction of third-party DOM instances without memory leak traps.
> 
---

### Exercise 3: Financial Chart Engine Instance Shallow Container

**Scenario:** A financial analytics dashboard stores a Chart engine instance using `shallowRef()` and `triggerRef()` for manual updates.
**Requirements:**
1. Declare `chartState = shallowRef({ instanceName: 'FX Chart', dataPoints: [10, 20] })`.
2. Mutate `chartState.value.dataPoints.push(30)`.
3. Force update using `triggerRef(chartState)`.
4. Validate manual trigger update via assertion.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { shallowRef, triggerRef, computed } from 'vue'
> 
> const chartState = shallowRef({
>   instanceName: 'FX Chart',
>   dataPoints: [10, 20]
> })
> 
> const pointCount = computed(() => chartState.value.dataPoints.length)
> 
> function addPoint(val) {
>   // Deep mutation on shallowRef payload
>   chartState.value.dataPoints.push(val)
>   // Force reactive subscribers to re-evaluate manually!
>   triggerRef(chartState)
> }
> 
> // Test assertion
> console.assert(pointCount.value === 2, 'Initial points count 2')
> addPoint(30)
> console.assert(pointCount.value === 3, 'Point count should equal 3 after triggerRef')
> </script>
> 
> <template>
>   <div>
>     <p>{{ chartState.instanceName }} Points: {{ pointCount }}</p>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Manual reactivity notification**: `triggerRef(ref)` manually triggers effects bound to a `shallowRef`.
> 2. **Deep payload mutation**: Allows in-place mutation of shallow ref payloads when combined with explicit triggers.
> 3. **Controlled re-renders**: Prevents automated reactivity cascades, giving developers explicit control over rendering flushes.
> 4. **High-performance rendering**: Ideal for complex canvas or WebGL rendering loops.
> 
---

## 6. Related Terms

- [`ref`](ref.md) — The standard deep reactive ref API.
- [`reactive`](reactive.md) — The deep reactive object API.
- [Virtual DOM (Vue)](../level_08/virtual_dom.md) — The rendering system updated when ref pointers change.

---

## 7. Key Takeaways

- **`shallowRef()`** tracks mutations ONLY to the root `.value` pointer, leaving nested object properties non-reactive.
- **`markRaw()`** permanently tags an object with `__v_skip: true` to prevent Vue from ever wrapping it in a reactive Proxy.
- Use `shallowRef()` and `markRaw()` to eliminate performance overhead when managing massive datasets or third-party class instances (Chart.js, Leaflet, Monaco).
- To update UI bound to a `shallowRef()`, you must reassign `.value` entirely (`ref.value = { ... }`) or invoke `triggerRef(ref)`.
- Never attempt to wrap `markRaw()` objects in `reactive()` state later expecting proxy behavior.
