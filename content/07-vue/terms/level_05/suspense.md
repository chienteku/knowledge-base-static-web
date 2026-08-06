# `<Suspense>` (Vue)

> **Level 5 — Advanced Component Architecture**
> A built-in orchestration component that coordinates nested asynchronous dependencies in the component tree, displaying a unified loading state until they resolve.

---

## 1. Prerequisites

- [Async Components](../level_08/async_components.md) — Components loaded lazily over the network.
- [Composables](composables.md) — Asynchronous state logic.
- [Teleport](teleport.md) — Moving elements outside the component DOM hierarchy.

---

## 2. Term Category

**Vue Built-in Component (Asynchronous Orchestration Pattern)**: `<Suspense>` is Vue 3's built-in orchestration component designed to coordinate nested asynchronous dependencies across the component tree. It manages components that perform top-level `await` calls inside `<script setup>` or components loaded dynamically via `defineAsyncComponent()`, preventing layout thrashing and displaying a single, unified loading fallback UI until all child promises resolve.

Unlike React's `<Suspense>`—which primarily coordinates code-splitting boundaries and data-fetching hooks like React Query—Vue's `<Suspense>` leverages standard ES module top-level `await` integration natively supported by Vue's SFC compiler. It uses two explicit named slots (`#default` and `#fallback`) to control state transitions between pending, resolved, and error states when paired with `onErrorCaptured()`.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In modern Single-Page Applications, complex view layouts (such as analytics dashboards) are composed of multiple independent child widgets—such as user profile cards, charts, and transaction feeds. If each widget independently manages its own loading spinner and async API fetch, the resulting user interface suffers from severe visual noise: multiple loading spinners popping up at different times, visual layout shifts, and staggered DOM updates.

Historically, developers solved this by hoisting all API loading flags up into a single parent component (`isLoading = ref(true)`), forcing top-level components to manage data fetching for all descendants. `<Suspense>` eliminates this manual boilerplate. It acts as an asynchronous boundary layer in the component template that automatically intercepts all async promises in its child tree, showing a unified fallback loading placeholder until all nested components are ready.

### (2) Reality Metaphor
Think of `<Suspense>` like an Airport Flight Operations Gate Controller. Before an international passenger flight is cleared to depart (render the `#default` slot), multiple independent ground teams must complete their tasks: refuel the aircraft (widget 1 API fetch), load baggage (widget 2 code split), and complete safety checks (widget 3 configuration). Instead of allowing passengers to board and un-board staggered inside the jet bridge (layout shifts), the Gate Controller holds all passengers comfortably in the gate lounge (the `#fallback` slot) with a departure progress board. Once *all* ground teams report complete, the Gate Controller opens the door and boards everyone at once.

### (3) Vue Code Examples

#### Short Snippet
```vue
<script setup>
import AsyncUserProfile from './AsyncUserProfile.vue' // Uses top-level await
</script>

<template>
  <Suspense>
    <!-- Renders when AsyncUserProfile resolves -->
    <template #default>
      <AsyncUserProfile />
    </template>
    <!-- Displays while waiting for top-level await resolution -->
    <template #fallback>
      <div class="spinner">Loading user profile...</div>
    </template>
  </Suspense>
</template>
```

#### Fuller Example
```vue
<!-- OperationsDashboard.vue (Parent Error Boundary) -->
<script setup>
import { ref, onErrorCaptured } from 'vue'
import TelemetryWidget from './TelemetryWidget.vue' // Top-level await
import FleetMapWidget from './FleetMapWidget.vue'   // Top-level await

const hasError = ref(false)
const errorMessage = ref('')

// Capture any async promise rejection occurring within the Suspense boundary
onErrorCaptured((err) => {
  hasError.value = true
  errorMessage.value = err.message || 'Failed to initialize operational widgets'
  return false // Prevent error from bubbling up further
})
</script>

<template>
  <div class="dashboard-container">
    <h2>Control Tower Operations</h2>

    <!-- Display error UI if any async component fails -->
    <div v-if="hasError" class="alert-banner">
      ⚠️ Error Loading Dashboard: {{ errorMessage }}
    </div>

    <!-- Suspense coordinates both widgets into a single patch -->
    <Suspense v-else>
      <template #default>
        <div class="grid-layout">
          <TelemetryWidget />
          <FleetMapWidget />
        </div>
      </template>

      <template #fallback>
        <div class="skeleton-loader">
          <p>⏳ Connecting to satellite telemetry and assembling map layers...</p>
        </div>
      </template>
    </Suspense>
  </div>
</template>
```

```vue
<!-- TelemetryWidget.vue (Child Component with top-level await) -->
<script setup>
// Top-level await automatically turns this component into an async dependency
const response = await fetch('https://api.example.com/v1/telemetry')
const metrics = await response.json()
</script>

<template>
  <div class="widget-card">
    <h3>Active Connections</h3>
    <p class="metric-value">{{ metrics.activeConnections }}</p>
  </div>
</template>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Failing to Catch Async Errors with `onErrorCaptured()`

**The mistake:** Wrapping async components inside `<Suspense>` without providing an error boundary handler in an ancestor component.

**Why it's wrong:** If a network request fails or an API throws an exception during an async component's top-level `await`, the promise rejects. Without an `onErrorCaptured()` hook, the application will remain frozen in the `#fallback` loading state permanently or fail silently without displaying diagnostic feedback.

*Incorrect:*
```vue
<!-- Stuck in fallback forever if AsyncComp rejects! -->
<Suspense>
  <template #default><AsyncComp /></template>
  <template #fallback><LoadingSpinner /></template>
</Suspense>
```

*Fix:*
```vue
<script setup>
import { ref, onErrorCaptured } from 'vue'
const error = ref(null)
onErrorCaptured((err) => { error.value = err; return false; })
</script>

<template>
  <div v-if="error">Failed to load content: {{ error.message }}</div>
  <Suspense v-else>
    <template #default><AsyncComp /></template>
    <template #fallback><LoadingSpinner /></template>
  </Suspense>
</template>
```

---

### Mistake 2: Forgetting the `<template #fallback>` Slot

**The mistake:** Declaring `<Suspense>` around async components without including an explicit `#fallback` template slot.

**Why it's wrong:** Without a `#fallback` slot, `<Suspense>` renders an empty DOM node while async top-level setup promises resolve, causing a jarring blank screen experience.

*Incorrect:*
```vue
<Suspense>
  <AsyncComp /> <!-- ❌ Missing fallback slot; user sees blank area -->
</Suspense>
```

*Fix:*
```vue
<Suspense>
  <template #default><AsyncComp /></template>
  <template #fallback><div>Loading assets...</div></template>
</Suspense>
```

---

### Mistake 3: Relying on Experimental Suspense API Without Fallbacks

**The mistake:** Assuming `<Suspense>` specification behavior is frozen and ignoring future release notes regarding experimental status updates.

**Why it's wrong:** In Vue 3.x, `<Suspense>` is flagged as an experimental feature whose API contract may refine across major ecosystem versions. Ensure robust fallback state handling in non-critical components.

*Incorrect:*
```vue
/* Assuming Suspense implementation details will never change without error boundaries */
```

*Fix:*
```vue
/* Combine Suspense with standard Vue error boundary hooks (onErrorCaptured) for safety */
```

---

## 5. Practice Exercises

### Exercise 1: Autonomous Vehicle Telemetry Stream (<Suspense> Boundary)

**Scenario:** An autonomous vehicle fleet management portal loads a `LidarWidget` component using top-level `await`. Build a parent view wrapping `LidarWidget` in a `<Suspense>` block with a fallback skeleton UI.

**Requirements:**
1. Create a parent SFC layout incorporating `<Suspense>`.
2. Target `#default` slot with `<LidarWidget />`.
3. Target `#fallback` slot with `<div class="radar-spinner">Scanning point cloud...</div>`.
4. Capture loading error state using `onErrorCaptured()`.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <!-- VehicleMonitor.vue -->
> <script setup>
> import { ref, onErrorCaptured } from 'vue';
> import LidarWidget from './LidarWidget.vue';
> 
> const scanError = ref(null);
> 
> onErrorCaptured((err) => {
>   scanError.value = 'Lidar telemetry offline: ' + err.message;
>   return false;
> });
> </script>
> 
> <template>
>   <div class="telemetry-box">
>     <div v-if="scanError" class="error-msg">{{ scanError }}</div>
>     <Suspense v-else>
>       <template #default>
>         <LidarWidget />
>       </template>
>       <template #fallback>
>         <div class="radar-spinner">Scanning point cloud...</div>
>       </template>
>     </Suspense>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Interception Boundary**: `<Suspense>` intercepts `LidarWidget`'s top-level `await` promise automatically.
> 2. **Fallback Isolation**: Renders `.radar-spinner` UI cleanly while point cloud binary arrays download.
> 3. **Error Handler Shield**: `onErrorCaptured()` prevents sensor network failure exceptions from unmounting the surrounding monitor layout.
> 4. **Declarative Loading**: Replaces multi-flag `isLoading` state boilerplate with clean template slots.
> 
---

### Exercise 2: Financial Crypto Exchange Order History (Async Component)

**Scenario:** A crypto trading platform lazily imports an `<OrderHistoryTable>` component via `defineAsyncComponent()`. Wrap the table component in a `<Suspense>` boundary.

**Requirements:**
1. Define async component using `defineAsyncComponent(() => import('./OrderHistoryTable.vue'))`.
2. Wrap inside `<Suspense>` with `#default` and `#fallback` slots.
3. Include test assertion verifying component promise resolution state.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <!-- CryptoTerminal.vue -->
> <script setup>
> import { defineAsyncComponent } from 'vue';
> 
> const OrderHistoryTable = defineAsyncComponent(() => 
>   import('./OrderHistoryTable.vue')
> );
> </script>
> 
> <template>
>   <div class="trading-terminal">
>     <h3>Order History</h3>
>     <Suspense>
>       <template #default>
>         <OrderHistoryTable />
>       </template>
>       <template #fallback>
>         <div class="table-skeleton">Loading transaction ledger...</div>
>       </template>
>     </Suspense>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Code-Splitting Integration**: `defineAsyncComponent` creates a dynamic import chunk that triggers `<Suspense>` pending state.
> 2. **Seamless Transition**: Swaps `.table-skeleton` for `<OrderHistoryTable />` as soon as the network script chunk executes.
> 3. **Memory Optimization**: Postpones downloading table rendering logic until the trading tab mounts.
> 4. **Slot Structure Safety**: Strict slot alignment ensures smooth Virtual DOM patching.
> 
---

### Exercise 3: Telecommunications Fiber Network Monitoring Grid

**Scenario:** A telecommunications network operation center (NOC) renders multiple async child widgets inside a single `<Suspense>` tag.

**Requirements:**
1. Include two async child widgets (`NodeStatusWidget` and `BandwidthChartWidget`).
2. Demonstrate that `<Suspense>` waits until *both* async widgets resolve before replacing the `#fallback` slot.
3. Include inline comments explaining Promise.all synchronization under the hood.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <!-- NocDashboard.vue -->
> <script setup>
> import NodeStatusWidget from './NodeStatusWidget.vue';       // Top-level await 1 (200ms)
> import BandwidthChartWidget from './BandwidthChartWidget.vue'; // Top-level await 2 (500ms)
> </script>
> 
> <template>
>   <div class="noc-dashboard">
>     <h2>Fiber Network Core</h2>
>     <Suspense>
>       <template #default>
>         <!-- Vue waits for BOTH widgets to resolve setup before mounting default slot -->
>         <div class="dashboard-grid">
>           <NodeStatusWidget />
>           <BandwidthChartWidget />
>         </div>
>       </template>
>       <template #fallback>
>         <div class="unified-loader">Syncing core network telemetry...</div>
>       </template>
>     </Suspense>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Multi-Widget Synchronization**: `<Suspense>` acts like `Promise.all()`, waiting for both async component setups to complete.
> 2. **Layout Thrash Prevention**: Prevents `NodeStatusWidget` from jumping into place 300ms before `BandwidthChartWidget`.
> 3. **Single Patch DOM Flush**: Renders both widgets into the active Virtual DOM in a single atomic update.
> 4. **Declarative Subtree Management**: Keeps layout setup decoupled from child widget network loading times.
> 
---

## 6. Related Terms

- [Async Components](../level_08/async_components.md) — The dynamic loading pattern.
- [Composables](composables.md) — Custom business logic controllers.
- [Teleport](teleport.md) — Renders component templates elsewhere in the DOM.

---

## 7. Key Takeaways

- **`<Suspense>`** coordinates nested asynchronous component dependencies across the component tree.
- Triggers pending state when child components use top-level `await` or `defineAsyncComponent()`.
- Uses two required slots: `#default` (renders when resolved) and `#fallback` (renders while pending).
- Eliminates layout thrashing by bundling multiple async child updates into a single atomic DOM flush.
- Pair with **`onErrorCaptured()`** in a parent component to handle rejected promises and display fallback error messages.
