# Composables

> **Level 5 — Advanced Component Architecture**
> Functions that leverage Vue's Composition API to encapsulate and reuse stateful logic across multiple components.

---

## 1. Prerequisites
- [Composition API](../level_01/composition_api.md) — The foundation that makes Composables possible.
- [Reactive State](../level_02/reactive_state.md) — What is being encapsulated inside the Composable.
---

## 2. Term Category
- **Vue Architecture / Code Reuse Pattern**

---

## 3. Environment Context
- **Composition API (`<script setup>`)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In Vue 2 (Options API), if you had logic that tracked the mouse position (`x` and `y` coordinates), and you wanted to reuse that logic in 5 different components, you had to use "Mixins". Mixins were terrible. They caused naming collisions and hid where data came from.
Because Vue 3's **Composition API** uses raw JavaScript functions (`ref`, `onMounted`), you can simply extract your Vue logic out of the `.vue` file and put it into a standard `.js` file! 
These reusable JavaScript files are called **Composables**. (They are identical to React "Custom Hooks").

### (2) Creating a Composable
A composable is just a function (conventionally starting with `use...`) that returns reactive state.
```javascript
// useMouse.js
import { ref, onMounted, onUnmounted } from 'vue'

export function useMouse() {
  // 1. Encapsulate state
  const x = ref(0)
  const y = ref(0)

  // 2. Encapsulate lifecycle logic
  function update(event) {
    x.value = event.pageX
    y.value = event.pageY
  }

  onMounted(() => window.addEventListener('mousemove', update))
  onUnmounted(() => window.removeEventListener('mousemove', update))

  // 3. Return the reactive state
  return { x, y }
}
```

### (3) Using the Composable
Any component can now import and use this logic instantly!
```vue
<!-- AnyComponent.vue -->
<script setup>
import { useMouse } from './useMouse'

// Boom! We have reusable, stateful mouse tracking in one line of code!
const { x, y } = useMouse()
</script>

<template>
  <p>Mouse is at {{ x }}, {{ y }}</p>
</template>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to return `ref`s

**The mistake:** A developer creates a `useFetch(url)` composable. They resolve the data, assign it to a standard JS variable `let data = {}`, and return it.

**Why it's wrong:** The whole point of a Composable is that it is *stateful* and *reactive*. If you return a static Javascript object, the component using the composable will not re-render when the API finishes fetching.
**Golden Rule:** Always use Vue's reactivity system (`ref`, `computed`, etc.) *inside* the `.js` Composable file, and return those reactive objects so the consuming component can track them.

---

### Mistake 2: Calling Composables Outside the Synchronous Execution Scope of Component Setup

**The mistake:** Calling a composable `const { x, y } = useMouse()` inside an async button click handler.

**Why it's wrong:** Composables rely on Vue's active component instance context (for lifecycle hook binding like `onMounted`). Calling composables inside async callbacks or external helper functions breaks lifecycle binding. Call composables synchronously at the top level of `<script setup>`.

*Incorrect:*
```javascript
async function handleLoad() {
  const { data } = useFetch('/api/user'); // ❌ Called inside async handler!
}
```

*Fix:*
```javascript
// Call composables synchronously at top level of setup scope:
const { data } = useFetch('/api/user');
```

---

### Mistake 3: Returning Plain Objects from Composables Without `toRefs()` (Broken Destructuring)

**The mistake:** Returning `reactive({ count, name })` directly from a composable function.

**Why it's wrong:** If a composable returns a plain reactive object, consumers destructuring properties (`const { count } = useMyComposable()`) sever reactivity. Return individual `ref` objects or `toRefs(state)`.

*Incorrect:*
```javascript
function useCounter() {
  const state = reactive({ count: 0 });
  return state; // ❌ Destructuring breaks reactivity for callers!
}
```

*Fix:*
```javascript
function useCounter() {
  const state = reactive({ count: 0 });
  return toRefs(state); // Preserves reactivity upon caller destructuring
}
```


---

## 6. Practice Exercises

### Exercise 1: State Isolation

**Problem:** You import `const { x, y } = useMouse()` in Component A, and you import it again in Component B. Are Component A and B sharing the exact same `x` variable in memory?

**Expected output:**
> [!check]- Answer
> ```text
> No!
> Every time a component calls `useMouse()`, the function executes from scratch, creating brand new `ref` instances. 
> Composables reuse LOGIC, they do not share global STATE. 
> (If you want to share global state, you need Pinia, or you must define the `ref` OUTSIDE the composable function).
> ```
> - What happens every time you invoke a JavaScript function?

---

### Exercise 2: Composable Naming Convention

**Problem:** What naming prefix convention MUST all Vue composables follow by standard community guidelines?

**Expected output:**
> [!check]- Answer
> ```text
> Composables must start with the camelCase 'use' prefix (e.g. useMouse, useFetch, useAuth).
> ```
> - Prefix composables with `use` (e.g. `useEventListener`).
> 
> ```javascript
> export function useFetch(url) {
>   const data = ref(null);
>   // ...
>   return { data };
> }
> ```

---

### Exercise 3: useMouse Composable Implementation

**Problem:** Write a clean `useMouse()` composable returning reactive `x` and `y` coordinates updated on `window.mousemove` with `onUnmounted` cleanup.

**Expected output:**
> [!check]- Answer
> ```javascript
> export function useMouse() { const x = ref(0); const y = ref(0); function update(e) { x.value = e.pageX; y.value = e.pageY; } onMounted(() => window.addEventListener('mousemove', update)); onUnmounted(() => window.removeEventListener('mousemove', update)); return { x, y }; }
> ```
> - Encapsulate state and lifecycle hooks inside composable functions.
> 
> ```javascript
> import { ref, onMounted, onUnmounted } from 'vue';
> 
> export function useMouse() {
>   const x = ref(0);
>   const y = ref(0);
>   
>   function update(e) {
>     x.value = e.pageX;
>     y.value = e.pageY;
>   }
>   
>   onMounted(() => window.addEventListener('mousemove', update));
>   onUnmounted(() => window.removeEventListener('mousemove', update));
>   
>   return { x, y };
> }
> ```


---

## 7. Related Terms
- [Composition API](../level_01/composition_api.md) — The paradigm that enables this.
- [Pinia](../level_07/pinia.md) — Used for sharing global State, whereas Composables share local Logic.
- [VueUse](../level_10/vueuse.md) — The library containing hundreds of pre-written, open-source composables.
- [Custom Directives (`v-*`)](../level_03/custom_directives.md) — Related concept: Custom Directives (`v-*`).
- [Scoped Slots](scoped_slots.md) — Related concept: Scoped Slots.
- [`<Suspense>` (Vue)](suspense.md) — Related concept: `<Suspense>` (Vue).
- [TypeScript with Vue](../level_10/typescript_vue.md) — Related concept: TypeScript with Vue.
---

## 8. Key Takeaways
- **Composables** are reusable JavaScript functions that encapsulate stateful Vue logic.
- They are the Vue 3 equivalent of React Custom Hooks, conventionally named starting with `use` (e.g., `useFetch`, `useMouse`).
- They completely replace Vue 2 Mixins, offering perfect type inference and explicit data sources.
- Invoking a composable creates a *new*, isolated instance of its internal state. They reuse logic, not global data.
