# `<NuxtErrorBoundary>` Component

> **Level 10 — Error Handling & Production**
> A wrapper component used to catch and handle client-side Vue rendering errors gracefully, without destroying the entire page layout or redirecting the user to the global `error.vue` page.

---

## 1. Prerequisites
- [`error.vue` & `useError`](error_vue.md) — The global fatal error handler that `<NuxtErrorBoundary>` explicitly tries to avoid.
- [Vue 3 Composition API Context](../level_01/composition_api_context.md) — Understanding slots and rendering boundaries.
---

## 2. Term Category
- **Error Handling**

---

## 3. Environment Context
- **Client Only**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Recovering from errors

**Problem:** In the `#error` slot, you are provided a `clearError` function. When the user clicks the "Try Again" button to call `clearError`, what exactly does Vue do?

**Expected output:**
> [!check]- Answer
> ```text
> It wipes the error state and attempts to re-render (re-mount) the default slot (the <RecentActivityWidget />) from scratch.
> ```
> - The `clearError` slot prop resets the error boundary state wrapper so the compiler attempts to reload child components.

---

### Exercise 2: NuxtErrorBoundary Isolated Component Recovery Pattern

**Problem:** Write Vue template wrapping `<Widget />` inside `<NuxtErrorBoundary>` displaying error message and a button calling `clearError` from slot props.

**Expected output:**
> [!check]- Answer
> ```vue
> <template>
>   <NuxtErrorBoundary>
>     <Widget />
>     <template #error="{ error, clearError }">
>       <p>Error: {{ error.message }}</p>
>       <button @click="clearError">Retry</button>
>     </template>
>   </NuxtErrorBoundary>
> </template>
> ```
> - `<NuxtErrorBoundary>` isolates component exceptions to sub-trees.
> 
> ```vue
> <template>
>   <NuxtErrorBoundary>
>     <WidgetComponent />
>     <template #error="{ error, clearError }">
>       <div class="p-4 bg-red-50 text-red-600 rounded">
>         <p>Widget failed: {{ error.message }}</p>
>         <button @click="clearError" class="mt-2 btn">
>           Retry Widget
>         </button>
>       </div>
>     </template>
>   </NuxtErrorBoundary>
> </template>
> ```

---

### Exercise 3: NuxtErrorBoundary vs error.vue

**Problem:** Compare `<NuxtErrorBoundary>` vs `error.vue`.

**Expected output:**
> [!check]- Answer
> ```text
> NuxtErrorBoundary: Isolated component-level error boundary wrapping specific UI sub-trees;
> error.vue: Full-page global un-handled error boundary.
> ```
> - `<NuxtErrorBoundary>` -> Sub-tree component isolation.
> - `error.vue` -> Global full-page error boundary.
> 
> ```text
> NuxtErrorBoundary = Component Level; error.vue = Full Page Level.
> ```


---

## 7. Related Terms
- [`error.vue` & `useError`](error_vue.md) — The global equivalent that handles fatal, unrecoverable errors.
---

## 8. Key Takeaways
- `<NuxtErrorBoundary>` catches Vue errors without destroying the page layout.
- It is perfect for isolating fragile UI widgets.
- The `#error` slot provides the error details and a `clearError` retry function.
- It only catches thrown exceptions, so `useFetch` errors must be thrown manually if you want them caught here.
