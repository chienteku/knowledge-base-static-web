# `<Suspense>` (Vue)

> **Level 5 — Advanced Component Architecture**
> A built-in orchestration component that coordinates nested asynchronous dependencies (like components with top-level `await` or async imports) in the component tree, displaying a unified loading state until they resolve.

---

## 1. Prerequisites
- [Async Components](../level_08/async_components.md) — Components loaded lazily over the network.
- [Composables](../level_05/composables.md) — Asynchronous state logic.
- [Teleport](../level_05/teleport.md) — Moving elements outside the component DOM hierarchy.

---

## 2. Term Category
- **Component Pattern**

---

## 3. Environment Context
- **Client-Side (Browser)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In modern Single Page Applications (SPAs), components often fetch their own data. If you have a dashboard with a sidebar, a chart, and a table, each component might run its own asynchronous database query.

Without coordination, this leads to a poor User Experience (UX):
- Multiple separate loading spinners flashing on the screen at different times.
- Layout shifting as elements load in out of order, shifting surrounding content.
- Visual jumps as elements suddenly pop into existence.

To fix this, developers historically wrote complex parent state systems to track loading variables across every child (`isSidebarLoading && isChartLoading && ...`). 

Vue designed **`<Suspense>`** to solve this elegantly. Instead of managing coordinate flags, `<Suspense>` acts as a boundary wrapper in the HTML template. It intercepts any asynchronous initialization processes inside its child subtree, shows a single loading template, and only displays the final components once *all* child components have resolved their asynchronous setups.

### (2) How it works under the hood
`<Suspense>` is a built-in element that utilizes two template slots:
- `#default`: The component tree you want to render.
- `#fallback`: The loading state to show while waiting.

```html
<Suspense>
  <template #default>
    <Dashboard /> <!-- May contain nested async components -->
  </template>
  <template #fallback>
    <p>Loading dashboard...</p>
  </template>
</Suspense>
```

When rendering, `<Suspense>` scans the `#default` slot. A component is considered "async" if:
1. It is declared as an async component using `defineAsyncComponent`.
2. It uses `async setup()` or has a top-level `await` statement inside `<script setup>`.

If any async component is discovered, `<Suspense>` enters a **pending** state and switches to render the `#fallback` slot. During this time, the async components continue loading and fetching data in the background. Once all pending promises resolve, `<Suspense>` transitions to the **resolved** state and renders the `#default` slot.

### (3) Code Examples

#### Short Snippet
```vue
<!-- App.vue -->
<script setup>
import { ref } from 'vue'
import AsyncProfile from './AsyncProfile.vue' // Has top-level await
</script>

<template>
  <!-- Suspense will display "Loading..." until AsyncProfile resolves its fetch -->
  <Suspense>
    <template #default>
      <AsyncProfile />
    </template>
    <template #fallback>
      <div>Loading user profile...</div>
    </template>
  </Suspense>
</template>
```

#### Fuller Example
In this dashboard view, we render multiple independent data-fetching widgets. We also use the `onErrorCaptured` lifecycle hook in the parent to gracefully handle any network failures.

```vue
<!-- App.vue (Parent / Error Boundary) -->
<script setup>
import { ref, onErrorCaptured } from 'vue'
import UserStats from './UserStats.vue'
import TransactionHistory from './TransactionHistory.vue'

const error = ref(null)

// Capture any async rejection inside the Suspense boundary
onErrorCaptured((err) => {
  error.value = err.message
  return false // Prevent error from propagating further
})
</script>

<template>
  <div class="dashboard-container">
    <h2>Dashboard Portal</h2>
    
    <div v-if="error" class="error-banner">
      Failed to load dashboard: {{ error }}
    </div>
    
    <Suspense v-else>
      <!-- default: Shows only when BOTH stats and transactions resolve -->
      <template #default>
        <div class="widgets-grid">
          <UserStats />
          <TransactionHistory />
        </div>
      </template>
      
      <!-- fallback: Unified spinner for the whole section -->
      <template #fallback>
        <div class="skeleton-loader">
          <p>Assembling metrics and transactions...</p>
        </div>
      </template>
    </Suspense>
  </div>
</template>
```

```vue
<!-- UserStats.vue (Child Component with top-level await) -->
<script setup>
// Top-level await: makes this component async automatically!
const response = await fetch('https://api.example.com/stats')
const stats = await response.json()
</script>

<template>
  <div class="widget">
    <h3>Active Users</h3>
    <p class="stat">{{ stats.activeUsers }}</p>
  </div>
</template>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Failing to capture errors from async components

**The mistake:** Wrapping components in `<Suspense>` without providing an error boundary.

**Why it's wrong:** If a network call fails inside an async child component (i.e. the promise rejects), the component will fail to mount. Without catching the error, the application will remain stuck in the `#fallback` loading state indefinitely, or crash silently.

*Incorrect:*
```vue
<!-- If AsyncComponent fails, user sees loading spinner forever -->
<Suspense>
  <template #default><AsyncComponent /></template>
  <template #fallback><Spinner /></template>
</Suspense>
```

*Fix:* Use the `onErrorCaptured` hook in the parent to display an error state.
```vue
<script setup>
import { ref, onErrorCaptured } from 'vue'
const error = ref(false)
onErrorCaptured(() => { error.value = true; return false })
</script>

<template>
  <div v-if="error">Error loading component.</div>
  <Suspense v-else>...</Suspense>
</template>
```

**Golden Rule:** Always pair `<Suspense>` with the `onErrorCaptured` hook in a parent component to handle API errors and failed imports.

---

### Mistake 2: Using `<Suspense>` as a Stable Production API Feature (Experimental Warning)

**The mistake:** Relying heavily on `<Suspense>` in mission-critical production apps without fallback error handling.

**Why it's wrong:** As of Vue 3.x, `<Suspense>` remains an **experimental** API subject to specification changes. Always handle error states via `onErrorCaptured()`.

*Incorrect:*
```vue
<!-- Relying on experimental Suspense without onErrorCaptured handler -->
<Suspense><AsyncComponent /></Suspense>
```

*Fix:*
```vue
<script setup>
// Capture async component load errors:
onErrorCaptured((err) => { logError(err); return true; });
</script>
<template>
  <Suspense>
    <template #default><AsyncComponent /></template>
    <template #fallback><LoadingSpinner /></template>
  </Suspense>
</template>
```

---

### Mistake 3: Forgetting the `#fallback` Slot on `<Suspense>` Wrapper

**The mistake:** Wrapping async setup components in `<Suspense>` without providing `<template #fallback>`.

**Why it's wrong:** Without a `#fallback` slot, users experience a completely blank screen while async top-level setup promises resolve.

*Incorrect:*
```vue
<Suspense>
  <AsyncComp /> <!-- ❌ Missing fallback slot while loading! -->
</Suspense>
```

*Fix:*
```vue
<Suspense>
  <template #default><AsyncComp /></template>
  <template #fallback><div>Loading...</div></template>
</Suspense>
```


---

## 6. Practice Exercises

### Exercise 1: Asynchronous Card Rendering

**Problem:** You have a component `<AsyncCard>` that fetches card data using a top-level `await`. Create a parent template that renders `<AsyncCard>` inside a `<Suspense>` block, displaying a simple `<div>Loading card...</div>` while the fetch is active.

```vue
<!-- Parent template code -->
<template>
  <!-- Write the Suspense block here -->
</template>
```

**Expected output:**
> [!check]- Answer
> ```html
> <Suspense>
>   <template #default>
>     <AsyncCard />
>   </template>
>   <template #fallback>
>     <div>Loading card...</div>
>   </template>
> </Suspense>
> ```
> - The `<Suspense>` component relies on two specific named slots: `#default` and `#fallback`.
> - The loading indicator goes in the `#fallback` slot.

---

### Exercise 2: Top-Level Async Setup in SFC

**Problem:** What makes a Vue 3 SFC component automatically async and compatible with `<Suspense>`?

**Expected output:**
> [!check]- Answer
> ```text
> Having a top-level await statement inside <script setup> (e.g. const res = await fetch(...)).
> ```
> - Top-level `await` turns a component into an async dependency for `<Suspense>`.
> 
> ```vue
> <script setup>
> const data = await fetch('/api/user').then(r => r.json());
> </script>
> ```

---

### Exercise 3: Suspense Slots Matrix

**Problem:** Identify the 2 required slot names for the `<Suspense>` component.

**Expected output:**
> [!check]- Answer
> ```text
> 1. #default (Renders when async dependencies resolve)
> 2. #fallback (Renders while async dependencies are pending)
> ```
> - `#default` -> Target async content
> - `#fallback` -> Loading placeholder UI
> 
> ```html
> <Suspense>
>   <template #default><AsyncComponent /></template>
>   <template #fallback><Spinner /></template>
> </Suspense>
> ```


---

## 7. Related Terms
- [Async Components](../level_08/async_components.md) — The dynamic loading pattern.
- [Composables](../level_05/composables.md) — Custom business logic controllers.
- [Teleport](../level_05/teleport.md) — Renders component templates elsewhere in the DOM.

---

## 8. Key Takeaways
- **`<Suspense>`** is a built-in Vue component that coordinates nested async subtrees.
- Any component using top-level `await` or registered via `defineAsyncComponent` automatically signals `<Suspense>` to wait.
- It displays the `#fallback` slot while pending, and replaces it with the `#default` slot upon resolution.
- It eliminates layout thrashing by rendering multiple independent async widgets in a single DOM patch.
- Use **`onErrorCaptured`** in the parent component to handle loading errors, preventing the UI from getting stuck.
