# KeepAlive

> **Level 8 — Performance & Optimization**
> A built-in Vue wrapper component that caches other components in memory when they are unmounted, preventing them from being destroyed so they can be instantly restored later.

---

## 1. Prerequisites
- [Component Lifecycle](../level_04/component_lifecycle.md) — `KeepAlive` fundamentally alters the standard lifecycle.
- [`v-if` / `v-show`](../level_03/v_if_show.md) — `KeepAlive` is the bridge between `v-if` (destruction) and `v-show` (hiding).

---

## 2. Term Category
- **Vue Built-in Component / Performance Tool**

---

## 3. Environment Context
- **Client-Side**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Imagine a Tab interface: `[Profile] [Settings] [Messages]`.
You use `v-if` to swap between the tab components. When the user clicks "Settings", the `<Profile>` component is completely destroyed (`onUnmounted`). If they typed half their name into the Profile form, it is deleted. When they click back to "Profile", Vue rebuilds the component from scratch (`onMounted`). 
If the component is heavy, rebuilding it causes lag and loss of local state.
**`<KeepAlive>`** solves this. If you wrap the components in `<KeepAlive>`, Vue will not destroy them. It will simply "deactivate" them, keeping their DOM nodes and Javascript state perfectly preserved in memory.

### (2) How to use it
You simply wrap dynamic components inside the `<KeepAlive>` tags.

```vue
<template>
  <button @click="currentTab = 'Profile'">Profile</button>
  <button @click="currentTab = 'Settings'">Settings</button>

  <!-- Without KeepAlive, switching tabs destroys the component -->
  <!-- WITH KeepAlive, the component is cached in memory! -->
  <KeepAlive>
    <component :is="currentTab"></component>
  </KeepAlive>
</template>
```

### (3) The New Lifecycle Hooks
Because a cached component is never truly destroyed or recreated, `onMounted` and `onUnmounted` will not fire when swapping tabs!
Instead, `KeepAlive` introduces two new lifecycle hooks:
- **`onActivated`**: Fires when the cached component is brought back to the screen.
- **`onDeactivated`**: Fires when the component is swapped out and put into memory.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Memory Leaks by caching everything

**The mistake:** A developer thinks `<KeepAlive>` makes everything faster, so they wrap their main `<RouterView>` in `<KeepAlive>` to cache the entire application.

**Why it's wrong:** Caching a component means its DOM nodes and JavaScript variables are kept alive in the browser's RAM. If you cache an infinite scrolling feed or 50 heavy dashboard pages, the browser will consume gigabytes of RAM and eventually crash the user's computer.
**Golden Rule:** Use the `include` or `max` props on `<KeepAlive>` to explicitly limit what gets cached.
`<KeepAlive :max="3">` (Only caches the 3 most recently visited components, destroying the oldest one).

---

### Mistake 2: Expecting `onMounted` or `onUnmounted` to Fire When Toggling `<KeepAlive>` Components

**The mistake:** Adding cleanup code to `onUnmounted` expecting it to execute when toggling a `<KeepAlive>` tab.

**Why it's wrong:** `<KeepAlive>` caches inactive component instances in memory without unmounting them. `onMounted` and `onUnmounted` do NOT re-fire on tab switches. Use `onActivated()` and `onDeactivated()`.

*Incorrect:*
```javascript
onMounted(() => {
  fetchData(); // ❌ Does NOT re-run when user returns to cached KeepAlive tab!
});
```

*Fix:*
```javascript
import { onActivated, onDeactivated } from 'vue';
onActivated(() => {
  refreshData(); // Fires every time component becomes active in KeepAlive
});
onDeactivated(() => {
  pauseTimer(); // Fires when component is cached
});
```

---

### Mistake 3: Using `include` or `exclude` Props on `<KeepAlive>` Without Explicit Component Names

**The mistake:** Writing `<KeepAlive include="UserTab">` when `UserTab.vue` lacks an explicit component `name`.

**Why it's wrong:** `<KeepAlive include="...">` matches against component `name` options. If a component using `<script setup>` omits explicit name definitions (via `defineOptions({ name: 'UserTab' })`), matching fails.

*Incorrect:*
```vue
<!-- Child component lacks explicit name -->
<KeepAlive include="UserTab"><component :is="tab" /></KeepAlive>
```

*Fix:*
```vue
<!-- Declare explicit component name in child component setup: -->
<script setup>
defineOptions({ name: 'UserTab' });
</script>
```


---

## 6. Practice Exercises

### Exercise 1: State vs API Calls

**Problem:** You have a `Dashboard.vue` component that fetches analytics data in `onMounted()`. You wrap it in `<KeepAlive>`. The user leaves the dashboard and comes back 10 minutes later. The data on the screen is 10 minutes old! How do you ensure the data is fresh without losing the UI state?

**Expected output:**
> [!check]- Answer
> ```text
> Move the API fetch from `onMounted` to `onActivated`!
> `onMounted` only fires once (the first time the component is created). 
> `onActivated` fires every time the component is restored from the KeepAlive cache.
> ```
> - Review the new lifecycle hooks introduced by `KeepAlive`.

---

### Exercise 2: KeepAlive max Cache Limit

**Problem:** Write `<KeepAlive>` syntax capping cached component instances to a maximum limit of `5` using the `max` prop.

**Expected output:**
> [!check]- Answer
> ```html
> <KeepAlive :max="5"><component :is="view" /></KeepAlive>
> ```
> - `max` enforces LRU (Least Recently Used) cache eviction.
> 
> ```html
> <KeepAlive :max="5">
>   <component :is="currentView" />
> </KeepAlive>
> ```

---

### Exercise 3: onActivated & onDeactivated Hook Roles

**Problem:** Which 2 specific Vue lifecycle hooks are dedicated exclusively to components cached inside `<KeepAlive>`?

**Expected output:**
> [!check]- Answer
> ```text
> 1. onActivated()
> 2. onDeactivated()
> ```
> - `onActivated` -> Executes when cached component is inserted.
> - `onDeactivated` -> Executes when cached component is hidden.
> 
> ```javascript
> import { onActivated, onDeactivated } from 'vue';
> ```


---

## 7. Related Terms
- [`v-show`](../level_03/v_if_show.md) — Another way to preserve state by hiding elements with CSS, but `KeepAlive` is better for complex routing/component swapping.
- [Component Lifecycle](../level_04/component_lifecycle.md) — The baseline behavior `KeepAlive` alters.
- [Dynamic Components (`<component :is>`)](../level_04/dynamic_components.md) — Dynamic swapping layouts that are commonly wrapped in `<KeepAlive>`.

---

## 8. Key Takeaways
- **`<KeepAlive>`** caches components in memory instead of destroying them when they are toggled out of the UI.
- It perfectly preserves local component state (like scroll position or form inputs) and avoids the CPU cost of rebuilding heavy components.
- It introduces two new lifecycle hooks: `onActivated` and `onDeactivated`.
- Use the `:max` or `:include` props to prevent aggressive memory consumption (RAM leaks).
