# Component Lifecycle

> **Level 4 — Components & Props**
> The series of stages a Vue component goes through from the moment it is created, to when it is added to the screen, to when it is finally destroyed. Vue provides "Hooks" to let you run code at these specific moments.

---

## 1. Prerequisites
- [Components](components.md) — What is going through the lifecycle.
- [`v-if` / `v-show`](../level_03/v_if_show.md) — `v-if` physically triggers the Mount/Unmount lifecycles!
---

## 2. Term Category
- **Vue Architecture / Concept**

---

## 3. Environment Context
- **Client-Side (React DOM)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Sometimes you need to do things at very specific moments.
- "As soon as this component appears on screen, fetch data from the API."
- "Right before this component is destroyed, cancel the 5-second timer so it doesn't cause a memory leak."
Vue exposes **Lifecycle Hooks**—special functions that Vue automatically executes at these precise moments.

### (2) The 3 Main Phases (The Hooks)
In the Composition API, you import the hooks and pass them a callback function.

1. **Mounting Phase (`onMounted`)**: The component has been fully built and physically injected into the browser's DOM. 
   *Use case:* Fetching initial API data, drawing on a `<canvas>`, or initializing a third-party chart library.
   
2. **Updating Phase (`onUpdated`)**: A reactive state variable changed, and Vue has finished updating the DOM to reflect the new data.
   *Use case:* Very rare. Usually, you use [Watchers](../level_02/watchers.md) instead.

3. **Unmounting Phase (`onUnmounted`)**: The component is about to be physically destroyed and removed from the page (e.g., the user navigated away, or a `v-if` evaluated to false).
   *Use case:* Cleaning up! Canceling `setInterval` timers, closing WebSockets, or removing manual `addEventListener` attachments.

```vue
<script setup>
import { onMounted, onUnmounted } from 'vue'

onMounted(() => {
  console.log("I am alive and on the screen!")
})

onUnmounted(() => {
  console.log("I am being destroyed! Goodbye!")
})
</script>
```

### (3) Where did `created` go?
If you used Vue 2 (Options API), you remember `created()`. In the Vue 3 Composition API (`<script setup>`), the `created` hook no longer exists! The entire `<script setup>` block *is* the created hook. Any code written directly in the script block runs immediately when the component initializes.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Fetching data outside of `onMounted`

**The mistake:** A developer needs to fetch a user profile. They write the `fetch()` call floating directly inside the `<script setup>` block, not inside an `onMounted` hook.

**Why it's wrong (usually):** Code floating in the script block runs *before* the component is added to the DOM. If the API returns instantly and tries to update a DOM element that doesn't exist yet, the app crashes. 
**Golden Rule:** Always place API calls that populate the UI inside the `onMounted()` lifecycle hook to guarantee the DOM is ready to receive the data.

---

### Mistake 2: Accessing DOM Elements in `onMounted` Without Checking Template Refs

**The mistake:** Attempting to query DOM elements inside `onMounted` when target element has `v-if="false"`.

**Why it's wrong:** Even inside `onMounted`, elements guarded by `v-if="false"` are unmounted and resolve to `null`. Verify template ref presence before manipulating DOM.

*Incorrect:*
```javascript
onMounted(() => {
  inputRef.value.focus(); // ❌ Throws TypeError if inputRef.value is null!
});
```

*Fix:*
```javascript
onMounted(() => {
  if (inputRef.value) inputRef.value.focus(); // Guard against null template refs
});
```

---

### Mistake 3: Forgetting Cleanup Code in `onUnmounted` (Memory Leaks)

**The mistake:** Setting global `setInterval()` timers or window event listeners inside `onMounted` without removing them in `onUnmounted`.

**Why it's wrong:** Un-cleared global timers and window event listeners persist in memory after component destruction, triggering memory leaks and errors.

*Incorrect:*
```javascript
onMounted(() => {
  window.addEventListener('resize', handleResize); // ❌ Missing cleanup in onUnmounted!
});
```

*Fix:*
```javascript
onMounted(() => {
  window.addEventListener('resize', handleResize);
});
onUnmounted(() => {
  window.removeEventListener('resize', handleResize); // Clean up window listeners
});
```


---

## 6. Practice Exercises

### Exercise 1: The Memory Leak

**Problem:** A component starts a `setInterval` that fetches the stock price every 1 second. The user clicks a link to go to a different page. The component disappears, but the browser keeps fetching the stock price in the background, eventually crashing. How do you fix this?

**Expected output:**
> [!check]- Answer
> ```javascript
> let timerId;
> 
> onMounted(() => {
>   timerId = setInterval(fetchStock, 1000)
> })
> 
> // You MUST clean up the timer when the component dies!
> onUnmounted(() => {
>   clearInterval(timerId)
> })
> ```
> - Which lifecycle phase deals with a component's death?

---

### Exercise 2: Lifecycle Hook Execution Order

**Problem:** Order the 4 primary Composition API lifecycle hooks in execution sequence:
`onUnmounted`, `onMounted`, `onBeforeMount`, `onBeforeUnmount`

**Expected output:**
> [!check]- Answer
> ```text
> 1. onBeforeMount
> 2. onMounted
> 3. onBeforeUnmount
> 4. onUnmounted
> ```
> - `onBeforeMount` -> Before DOM insertion.
> - `onMounted` -> DOM nodes created and inserted.
> - `onBeforeUnmount` -> Before component destruction.
> - `onUnmounted` -> Component destroyed and cleaned up.
> 
> ```text
> 1. onBeforeMount
> 2. onMounted
> 3. onBeforeUnmount
> 4. onUnmounted
> ```

---

### Exercise 3: Options API to Composition API Lifecycle Mapping

**Problem:** Which Composition API hook replaces Options API `mounted()` and `beforeDestroy()`?

**Expected output:**
> [!check]- Answer
> ```text
> mounted() -> onMounted()
> beforeDestroy() -> onBeforeUnmount()
> ```
> - Composition API lifecycle hooks prepend `on` to hook names.
> 
> ```javascript
> import { onMounted, onBeforeUnmount } from 'vue';
> ```


---

## 7. Related Terms
- [`v-if` / `v-show`](../level_03/v_if_show.md) — When `v-if` becomes false, it triggers the `onUnmounted` hook.
- [Watchers](../level_02/watchers.md) — A better alternative to `onUpdated`.
- [`nextTick`](next_tick.md) — Awaiting the next DOM update flush.
- [Custom Directives (`v-*`)](../level_03/custom_directives.md) — Related concept: Custom Directives (`v-*`).
- [Navigation Guards](../level_06/navigation_guards.md) — Related concept: Navigation Guards.
- [KeepAlive](../level_08/keepalive.md) — Related concept: KeepAlive.
- [Universal Code (Isomorphic)](../level_09/universal_code.md) — Related concept: Universal Code (Isomorphic).
---

## 8. Key Takeaways
- The **Component Lifecycle** is the journey of a component from birth (Mount) to death (Unmount).
- **`onMounted()`** runs when the component hits the screen. It is the standard place to execute API data fetching.
- **`onUnmounted()`** runs right before the component is destroyed. You MUST use it to clean up manual timers and event listeners to prevent memory leaks.
- In Vue 3's `<script setup>`, the old `created()` hook is obsolete; top-level code runs during creation.
