# Component Lifecycle

> **Level 4 — Components & Lifecycle**
> The continuous sequence of phases a Vue component instance traverses—from initialization, DOM mounting, and reactive updating to final teardown—paired with hook functions to run code at specific lifecycle moments.

---

## 1. Prerequisites

- [Components](components.md) — The building blocks going through the lifecycle.
- [`v-if` / `v-show`](../level_03/v_if_show.md) — `v-if` physically triggers component mount and unmount lifecycles.

---

## 2. Term Category

**Core Execution Lifecycle (Instance State Transitions)**: Component Lifecycle represents the deterministic execution timeline managed by Vue's runtime core for every component instance. Spanning creation, Virtual DOM mounting, reactive state patching, and DOM destruction, lifecycle hooks (`onMounted`, `onUpdated`, `onUnmounted`, `onActivated`, `onDeactivated`) allow developers to schedule side-effects (API data fetching, canvas initialization, timer teardown, WebSocket closures). Operating across client-side browser DOM rendering and server-side rendering (where only creation hooks execute), understanding lifecycle phases prevents memory leaks and unrendered DOM race conditions.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Components are dynamic runtime instances. A component is created when a page loads or when a `v-if` evaluates to `true`, and it is destroyed when the user navigates away or when `v-if` becomes `false`.

In modern application engineering, code execution must synchronize with exact structural transitions:
- "As soon as this component enters the browser DOM, issue a network request to fetch user profile data."
- "Right before this component is destroyed, cancel the 5-second `setInterval` timer so it doesn't leak memory."
- "When reactive state changes and the DOM finishes updating, adjust canvas scroll height."

Vue exposes **Lifecycle Hooks**—special functions imported from `'vue'`—that register callbacks to execute automatically at these precise operational transitions.

### (2) Reality Metaphor

Think of a Vue component as a commercial airliner operating a scheduled flight.

1. **Creation Phase (`<script setup>` execution)**: The airliner is sitting on the tarmac undergoing pre-flight checkin. Fuel and passenger manifests are validated (reactive state initialized), but the plane has not left the ground.
2. **Mounting Phase (`onMounted`)**: The airliner takes off and reaches cruising altitude (the component is physically rendered and inserted into the browser DOM). Now you can turn on in-flight Wi-Fi services (fetch API data, attach window event listeners).
3. **Updating Phase (`onUpdated`)**: The airliner adjusts altitude or turbulence flaps in response to wind shifts (reactive state changes force Virtual DOM patch flushes).
4. **Unmounting Phase (`onUnmounted`)**: The airliner lands at the destination terminal, deboards passengers, and turns off engines. You MUST turn off in-flight Wi-Fi and power units (clear timers, remove global window event listeners) so the plane doesn't consume battery power sitting idle in the hangar.

### (3) Vue Code Examples

#### Short Snippet
```vue
<script setup>
import { onMounted, onUnmounted } from 'vue'

// Runs as soon as component DOM nodes are inserted into document
onMounted(() => {
  console.log('Component mounted in real DOM. Fetching initial data...')
})

// Runs right before component instance is destroyed and removed from DOM
onUnmounted(() => {
  console.log('Component unmounted. Performing resource teardown...')
})
</script>

<template>
  <div class="lifecycle-card">
    <p>Active Component Instance</p>
  </div>
</template>
```

#### Fuller Example
```vue
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const telemetryData = ref([])
let pollingTimer = null

function fetchTelemetry() {
  telemetryData.value.unshift({
    timestamp: new Date().toLocaleTimeString(),
    value: Math.floor(Math.random() * 100)
  })
}

// 1. Mounting: Start polling timer once DOM is ready
onMounted(() => {
  fetchTelemetry() // Initial fetch
  pollingTimer = setInterval(fetchTelemetry, 2000) // Poll every 2 seconds
  window.addEventListener('resize', handleWindowResize)
})

// Window event callback
function handleWindowResize() {
  console.log('Window dimensions changed:', window.innerWidth, window.innerHeight)
}

// 2. Unmounting: Clean up global timer & event listener to PREVENT MEMORY LEAKS
onUnmounted(() => {
  if (pollingTimer) {
    clearInterval(pollingTimer) // Stop background timer
  }
  window.removeEventListener('resize', handleWindowResize) // Remove global listener
  console.log('Telemetry monitor cleaned up cleanly.')
})
</script>

<template>
  <div class="telemetry-monitor">
    <h3>Live Server Telemetry</h3>
    <ul>
      <li v-for="(item, i) in telemetryData" :key="i">
        [{{ item.timestamp }}] Load: {{ item.value }}%
      </li>
    </ul>
  </div>
</template>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Fetching initial API data floating directly in script setup without `onMounted()`

**The mistake:** Placing asynchronous API data fetching or DOM queries floating loose directly in the `<script setup>` block.

**Why it's wrong:** Code floating loose in `<script setup>` executes during component *creation*—before DOM nodes are created or inserted. If an API returns fast or if code queries a template `ref()`, the target DOM node is `null`, causing runtime crashes.

*Incorrect:*
```vue
<script setup>
const inputRef = ref(null)
// ❌ Floating code runs before DOM mounting! inputRef.value is null!
inputRef.value.focus()
</script>
```

*Fix:* Place DOM-dependent or initial mount logic inside `onMounted()`.
```vue
<script setup>
const inputRef = ref(null)
onMounted(() => {
  if (inputRef.value) inputRef.value.focus() // Safe: DOM is guaranteed ready
})
</script>
```

---

### Mistake 2: Forgetting to clean up global timers or window event listeners in `onUnmounted()`

**The mistake:** Registering `setInterval()` or `window.addEventListener()` inside `onMounted()` without removing them in `onUnmounted()`.

**Why it's wrong:** Global window event listeners and active `setInterval` timers persist in browser memory even after the component is destroyed. They continue running in the background, firing callbacks on unmounted components and causing massive memory leaks.

*Incorrect:*
```javascript
onMounted(() => {
  window.addEventListener('scroll', handleScroll); // ❌ Missing cleanup in onUnmounted!
})
```

*Fix:*
```javascript
onMounted(() => {
  window.addEventListener('scroll', handleScroll);
})
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll); // Clean up global listener
})
```

---

### Mistake 3: Attempting to use obsolete Vue 2 `created()` or `beforeDestroy()` hooks in Vue 3 `<script setup>`

**The mistake:** Importing or writing `created()` or `beforeDestroy()` inside Composition API code.

**Why it's wrong:** In Vue 3 Composition API, `created()` is obsolete—the entire `<script setup>` block acts as the creation phase. `beforeDestroy()` was renamed to `onBeforeUnmount()`, and `destroyed()` was renamed to `onUnmounted()`.

*Incorrect:*
```vue
<script setup>
// ❌ Options API lifecycle hooks do not exist in Composition API setup!
created() { fetch(); }
</script>
```

*Fix:*
```vue
<script setup>
// Top level code IS creation. Use onMounted / onUnmounted for lifecycle events:
import { onMounted, onUnmounted } from 'vue'
onMounted(() => { fetch(); })
</script>
```

---

## 5. Practice Exercises

### Exercise 1: IoT Sensor WebSocket Stream Lifecycle (IoT)

**Scenario:** An industrial IoT monitoring dashboard connects to a WebSocket server to stream live machine vibration data. You must open the WebSocket connection when the component mounts, update connection status state, and close the WebSocket cleanly when the component unmounts.

**Requirements:**
1. Initialize WebSocket connection inside `onMounted()`.
2. Push incoming telemetry messages to reactive `vibrationData` array ref.
3. Close WebSocket connection inside `onUnmounted()`.
4. Demonstrate clean lifecycle resource teardown.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, onMounted, onUnmounted } from 'vue'
> 
> const vibrationData = ref([])
> const connectionStatus = ref('Connecting...')
> let socket = null
> 
> onMounted(() => {
>   // 1. Initialize WebSocket stream on mount
>   socket = new WebSocket('wss://echo.websocket.events')
>   
>   socket.onopen = () => {
>     connectionStatus.value = 'Connected'
>     socket.send(JSON.stringify({ type: 'SUBSCRIBE', channel: 'vibration' }))
>   }
>   
>   socket.onmessage = (event) => {
>     vibrationData.value.unshift(event.data)
>   }
>   
>   socket.onerror = () => {
>     connectionStatus.value = 'Error'
>   }
> })
> 
> onUnmounted(() => {
>   // 2. Clean up WebSocket connection on unmount to prevent leaks
>   if (socket) {
>     socket.close()
>     console.log('WebSocket stream closed cleanly.')
>   }
> })
> </script>
> 
> <template>
>   <div class="stream-panel">
>     <h3>Machine Vibration Stream ({{ connectionStatus }})</h3>
>     <ul>
>       <li v-for="(msg, i) in vibrationData.slice(0, 5)" :key="i">{{ msg }}</li>
>     </ul>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: `onMounted()` guarantees network connections initiate after component template is ready.
> 2. **Concept**: `onUnmounted()` teardown closes WebSocket sockets to prevent background resource leaks.
> 3. **Concept**: Reactive references update views automatically as socket events arrive.
> 4. **Concept**: Lifecycle hooks isolate side-effects cleanly from component rendering logic.
> 
---

### Exercise 2: Financial Live Order Book Polling Lifecycle (Finance)

**Scenario:** A stock trading application polls order book market depth every 3 seconds while active on screen. You must use `onMounted` to start polling and `onUnmounted` to stop polling, handling page navigation cleanly.

**Requirements:**
1. Declare polling timer variable outside hook functions.
2. Start `setInterval` inside `onMounted()`.
3. Clear `clearInterval` inside `onUnmounted()`.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, onMounted, onUnmounted } from 'vue'
> 
> const orderBook = ref([])
> let pollIntervalId = null
> 
> function fetchOrderBook() {
>   console.log('Polling latest market depth...')
>   orderBook.value = [
>     { price: 185.50, qty: 100 },
>     { price: 185.45, qty: 250 }
>   ]
> }
> 
> onMounted(() => {
>   fetchOrderBook()
>   pollIntervalId = setInterval(fetchOrderBook, 3000)
> })
> 
> onUnmounted(() => {
>   if (pollIntervalId) {
>     clearInterval(pollIntervalId)
>     console.log('Order book polling stopped.')
>   }
> })
> </script>
> 
> <template>
>   <div class="order-book-panel">
>     <h3>Live Market Depth</h3>
>     <div v-for="(row, i) in orderBook" :key="i">
>       ${{ row.price }} - {{ row.qty }} shares
>     </div>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: Storing `pollIntervalId` in script setup scope allows sharing reference between hooks.
> 2. **Concept**: `onMounted()` starts periodic background polling loops once view enters screen.
> 3. **Concept**: `onUnmounted()` clears interval timer when user navigates away, preventing zombie timer callbacks.
> 4. **Concept**: Essential pattern for high-frequency real-time financial applications.
> 
---

### Exercise 3: Real-Time Network Resize Observer Lifecycle (Networking)

**Scenario:** A network topology graph component needs to re-render its canvas layout whenever its parent container resizes, using native `ResizeObserver`.

**Requirements:**
1. Instantiate `ResizeObserver` inside `onMounted()`.
2. Observe container template ref `containerRef`.
3. Disconnect observer inside `onUnmounted()`.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, onMounted, onUnmounted } from 'vue'
> 
> const containerRef = ref(null)
> const dimensions = ref({ width: 0, height: 0 })
> let resizeObserver = null
> 
> onMounted(() => {
>   if (containerRef.value) {
>     resizeObserver = new ResizeObserver((entries) => {
>       for (const entry of entries) {
>         dimensions.value = {
>           width: Math.round(entry.contentRect.width),
>           height: Math.round(entry.contentRect.height)
>         }
>       }
>     })
>     resizeObserver.observe(containerRef.value)
>   }
> })
> 
> onUnmounted(() => {
>   if (resizeObserver) {
>     resizeObserver.disconnect()
>     console.log('ResizeObserver disconnected.')
>   }
> })
> </script>
> 
> <template>
>   <div ref="containerRef" class="topology-container">
>     <p>Graph Bounds: {{ dimensions.width }}px x {{ dimensions.height }}px</p>
>   </div>
> </template>
> 
> <style scoped>
> .topology-container { width: 100%; height: 200px; background: #fafafa; border: 1px solid #d9d9d9; }
> </style>
> ```
>
> #### Technical Explanation
> 1. **Concept**: Template refs (`containerRef`) resolve to real DOM elements inside `onMounted()`.
> 2. **Concept**: `ResizeObserver` attaches directly to DOM element references inside `onMounted()`.
> 3. **Concept**: Disconnecting observers inside `onUnmounted()` prevents memory leaks when containers unmount.
> 4. **Concept**: Bridges browser layout APIs cleanly with Vue lifecycle.
> 
---

## 6. Related Terms

- [`v-if` / `v-show`](../level_03/v_if_show.md) — `v-if` physically triggers mount/unmount lifecycles.
- [Watchers](../level_02/watchers.md) — Reactive data tracking alternative to `onUpdated`.
- [`nextTick`](next_tick.md) — Awaiting DOM update flush tasks.
- [Custom Directives (`v-*`)](../level_03/custom_directives.md) — Directive lifecycle hooks.
- [Navigation Guards](../level_06/navigation_guards.md) — Router route transition hooks.
- [KeepAlive](../level_08/keepalive.md) — Component caching activation hooks (`onActivated`, `onDeactivated`).

---

## 7. Key Takeaways

- **Component Lifecycle** defines the continuous sequence of phases from component creation to unmounting.
- **`<script setup>` top-level code** acts as the creation phase (`setup()`).
- **`onMounted()`** executes after DOM nodes are physically inserted. Use it for API data fetching and DOM measurements.
- **`onUnmounted()`** executes right before component destruction. You MUST use it to clear timers, WebSockets, and window event listeners to prevent memory leaks.
- Vue 3 Composition API uses `onBeforeUnmount` and `onUnmounted` (renamed from Vue 2 `beforeDestroy` and `destroyed`).
