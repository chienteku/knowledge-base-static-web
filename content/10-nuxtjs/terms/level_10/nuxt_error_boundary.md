# `<NuxtErrorBoundary>` Component

> **Level 10 — Error Handling & Production**
> A wrapper component used to catch and handle client-side Vue rendering errors gracefully, without destroying the entire page layout or redirecting the user to the global `error.vue` page.

---

## 1. Prerequisites
- [`error.vue` & `useError`](error_vue.md) — The global fatal error handler that `<NuxtErrorBoundary>` explicitly tries to avoid.
- [Vue 3 Composition API Context](../level_01/composition_api_context.md) — Understanding slots and rendering boundaries.

---

## 2. Term Category

**Framework Architecture** (Component-Level Error Boundary Wrapper): `<NuxtErrorBoundary>` is a built-in Vue component that intercepts child component errors without crashing the parent view.



---

## 3. Explanation

### Environment Context
- **Client Only**

### (1) Design Motivation — "Why did we design this?"
If you use `showError`, it destroys your entire website layout and replaces it with `error.vue`. 

But what if you have a complex dashboard with a sidebar, a header, and a small "Recent Activity" widget? If the API for the "Recent Activity" widget fails, you don't want the *entire dashboard* to explode. You just want the widget to display a small "Failed to load activity" message, while the rest of the dashboard continues to work perfectly.

`<NuxtErrorBoundary>` solves this. It acts as a safety net. If any component inside the boundary throws a Vue error, the error is caught, the rest of the page survives, and the boundary displays a custom `#error` slot.

### (2) Core Concept
You wrap the risky component inside `<NuxtErrorBoundary>`. It provides a `#error` slot which exposes the exact `error` object and a `clearError` function to retry rendering.

```vue
<template>
  <div class="dashboard">
    <Sidebar />
    
    <main>
      <h1>Dashboard</h1>
      
      <!-- Wrap the risky widget -->
      <NuxtErrorBoundary>
        <RecentActivityWidget />

        <!-- This slot ONLY renders if the widget crashes -->
        <template #error="{ error, clearError }">
          <div class="widget-error">
             <p>Oops, the widget crashed: {{ error.message }}</p>
             <!-- clearError wipes the error and attempts to remount the widget! -->
             <button @click="clearError">Try Again</button>
          </div>
        </template>
      </NuxtErrorBoundary>

    </main>
  </div>
</template>
```

### (3) Scope of the Boundary
It is critical to understand that `<NuxtErrorBoundary>` only catches Vue rendering errors occurring within its slot *on the client side*. It does not catch 404 routing errors or fatal server-side SSR crashes.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to catch asynchronous `useFetch` errors
**The mistake:** Wrapping a component in `<NuxtErrorBoundary>` and expecting it to trigger if `useFetch('/api/data')` returns a 500 error.

**Why it's wrong:** `useFetch` does not *throw* a JavaScript exception when an API call fails. It swallows the failure and populates its reactive `error` object. Because no exception was actually thrown in Vue, `<NuxtErrorBoundary>` does not trigger!
**Golden Rule:** If you want `<NuxtErrorBoundary>` to catch a `useFetch` failure, you must manually check the `useFetch` error and throw it.

*Fix inside `RecentActivityWidget.vue`:*
```vue
<script setup>
const { data, error } = await useFetch('/api/activity');

if (error.value) {
  // Now we actually throw it, so <NuxtErrorBoundary> can catch it!
  throw createError(error.value);
}
</script>
```

---

### Mistake 2: Expecting `<NuxtErrorBoundary>` to Catch Asynchronous Event Handler Errors Automatically

**The mistake:** Expecting `<NuxtErrorBoundary>` to catch errors inside a button `@click="saveUser"` handler.

**Why it's wrong:** `<NuxtErrorBoundary>` catches errors thrown during RENDERING and setup component lifecycle execution. Event handler errors MUST be caught using explicit `try/catch` blocks.

*Incorrect:*
```vue
/* Expecting <NuxtErrorBoundary> to catch onClick event exceptions */
```

*Fix:*
```vue
// Handle event handler errors explicitly inside try/catch:
async function handleClick() {
  try { await api(); } catch (e) { errorState.value = e.message; }
}
```

---

### Mistake 3: Forgetting the `#error` Fallback Slot in `<NuxtErrorBoundary>`

**The mistake:** Writing `<NuxtErrorBoundary><MyComponent /></NuxtErrorBoundary>` without `<template #error="{ error }">`.

**Why it's wrong:** Without an `#error` slot template, `<NuxtErrorBoundary>` renders an empty void if the child component crashes.

*Incorrect:*
```vue
<NuxtErrorBoundary>
  <MyComponent /> <!-- ❌ Missing #error fallback template! -->
</NuxtErrorBoundary>
```

*Fix:*
```vue
<NuxtErrorBoundary>
  <MyComponent />
  <template #error="{ error }">
    <p>Failed to load component: {{ error.message }}</p>
  </template>
</NuxtErrorBoundary>
```


---

## 5. Practice Exercises

### Exercise 1: Wrapping Problematic Components with `<NuxtErrorBoundary>`

**Scenario:**
Wrap a third-party widget inside `<NuxtErrorBoundary>` to prevent widget crashes from breaking the main page.

**Requirements:**
1. Wrap component inside `<NuxtErrorBoundary>`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <template>
>   <main>
>     <h1>Main Dashboard</h1>
>     <NuxtErrorBoundary>
>       <!-- Unstable third-party component -->
>       <UnstableWidget />
>       
>       <template #error="{ error }">
>         <div class="widget-fallback">
>           <p>Failed to load widget: {{ error.message }}</p>
>         </div>
>       </template>
>     </NuxtErrorBoundary>
>   </main>
> </template>
> ```

> #### Technical Explanation
>
> 1. `<NuxtErrorBoundary>` isolates child component crashes, preventing errors from unmounting the whole page.
> 2. If a child component throws an error, `<NuxtErrorBoundary>` catches it and renders the `#error` slot.
> 3. Keeps main application UI functional despite isolated component failures.

---

### Exercise 2: Clearing Component Error States with `clearError` Slot Scope

**Scenario:**
Provide a retry button inside `<NuxtErrorBoundary>` `#error` slot using `clearError` callback.

**Requirements:**
1. Call `clearError()` passed to `#error="{ error, clearError }"`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <template>
>   <NuxtErrorBoundary>
>     <ComplexDataWidget />
>     
>     <template #error="{ error, clearError }">
>       <div class="error-box">
>         <p>Widget Error: {{ error.message }}</p>
>         <button @click="clearError">Retry Loading Widget</button>
>       </div>
>     </template>
>   </NuxtErrorBoundary>
> </template>
> ```

> #### Technical Explanation
>
> 1. The `#error` slot exposes a `clearError` function in its scope.
> 2. Calling `clearError` clears the captured error ref and attempts to re-render default slot components.
> 3. Enables component-level user error recovery.

---

### Exercise 3: Auditing Capturable vs Non-Capturable Errors

**Scenario:**
Explain which errors `<NuxtErrorBoundary>` captures vs errors that bubble up to root `error.vue`.

**Requirements:**
1. Detail component lifecycle errors captured by `<NuxtErrorBoundary>`.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Error Boundary Scope Rules:
> - Captured: Render errors, setup() errors, and lifecycle hook errors (onMounted, watcher) originating inside child components.
> - Not Captured: Event handler errors (button @click), async background timers, or errors originating outside the boundary wrapper.
> ```

> #### Technical Explanation
>
> 1. `<NuxtErrorBoundary>` relies on Vue's `errorCaptured` lifecycle hook.
> 2. Intercepts errors occurring during Virtual DOM rendering and component setup lifecycle.
> 3. Standard component fault isolation pattern.

---




---

## 6. Related Terms
- [`error.vue` & `useError`](error_vue.md) — The global equivalent that handles fatal, unrecoverable errors.

---

## 7. Key Takeaways
- `<NuxtErrorBoundary>` catches Vue errors without destroying the page layout.
- It is perfect for isolating fragile UI widgets.
- The `#error` slot provides the error details and a `clearError` retry function.
- It only catches thrown exceptions, so `useFetch` errors must be thrown manually if you want them caught here.
