# Computed Properties

> **Level 2 — Reactivity System**
> Reactive variables that are automatically derived or calculated from other reactive variables. They cache their results and only re-calculate when their dependencies change.

---

## 1. Prerequisites
- [Reactive State](reactive_state.md) — The dependencies that computed properties rely on.
- [Template Syntax](../level_01/template_syntax.md) — Why complex logic shouldn't be put directly in the HTML.

---

## 2. Term Category
- **Vue Reactivity API**

---

## 3. Environment Context
- **Composition API (`<script setup>`)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Imagine you have an array of `users` and you want to display the number of active users. 
You could write `{{ users.filter(u => u.isActive).length }}` directly in the template. But doing this clutters the HTML and makes it unreadable.
Alternatively, you could write a standard JavaScript function `getActiveCount()`. But Vue would have to re-run that function on *every single render*, which is terrible for performance if the array has 10,000 items.
**Computed Properties** (`computed`) solve this. They allow you to define complex logic in JavaScript. Vue runs the calculation ONCE, saves (caches) the result, and will never run it again unless the `users` array actually changes!

### (2) How to use it
You import `computed` and pass it an anonymous getter function.

```vue
<script setup>
import { ref, computed } from 'vue'

const items = ref(['Apple', 'Banana', 'Orange'])

// A Computed Property!
// It automatically detects that it depends on `items.value`
const hasItemsMessage = computed(() => {
  return items.value.length > 0 ? 'Yes' : 'No'
})
</script>

<template>
  <!-- Looks just like a normal variable! -->
  <p>Do we have items? {{ hasItemsMessage }}</p>
</template>
```

### (3) The Power of Caching
If another unrelated variable on the page changes (like a user clicking a "Like" button), Vue will re-render the template. 
If `hasItemsMessage` was a normal function, Vue would recalculate the array length. But because it is `computed`, Vue instantly returns the cached "Yes" string without doing any math. This is a massive performance optimization.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Causing Side Effects in a Computed Property

**The mistake:** A developer writes a computed property that changes another variable, or makes an API call.
```javascript
const filteredData = computed(() => {
  count.value++; // MUTATING STATE! BAD!
  return data.value.filter(...);
});
```

**Why it's wrong:** Computed properties MUST be "Pure Functions". They should *only* read data and return a value. If a computed property mutates other state, it can trigger an infinite re-render loop that crashes the browser!
**Golden Rule:** Never cause Side Effects (mutating data, fetching APIs, interacting with the DOM) inside a `computed()` function. Use [Watchers](../level_02/watchers.md) for side effects.

---

### Mistake 2: Executing Async Operations or Side Effects inside Computed Properties

**The mistake:** Calling `fetch()` or updating DOM state inside a `computed()` getter function.

**Why it's wrong:** Computed properties MUST be pure getter functions designed solely to derive data. Async requests do not return values synchronously, breaking computed property caching.

*Incorrect:*
```javascript
const userData = computed(async () => {
  const res = await fetch('/api/user'); // ❌ Async fetch inside computed getter!
  return res.json();
});
```

*Fix:*
```javascript
// Use watchers or lifecycle hooks for async side effects:
const userData = ref(null);
watchEffect(async () => {
  const res = await fetch('/api/user');
  userData.value = await res.json();
});
```

---

### Mistake 3: Attempting to Mutate Computed Properties Directly Without a Setter

**The mistake:** Writing `doubleCount.value = 10` on a getter-only `computed()` property.

**Why it's wrong:** By default, computed properties are read-only getters. Direct mutation triggers a runtime warning: `Write operation failed: computed value is readonly`.

*Incorrect:*
```javascript
const double = computed(() => count.value * 2);
double.value = 20; // ❌ Read-only mutation error!
```

*Fix:*
```javascript
// Define a writable computed property using get and set methods:
const double = computed({
  get: () => count.value * 2,
  set: (val) => { count.value = val / 2; }
});
```


---

## 6. Practice Exercises

### Exercise 1: Computed vs Methods

**Problem:** You need to reverse a string. You write `const reversed = computed(() => text.value.split('').reverse().join(''))`. Your coworker tells you to just use a function: `function getReversed() { return text.value... }`. Why is your coworker wrong?

**Expected output:**
> [!check]- Answer
> ```text
> Performance!
> A method `getReversed()` will execute every single time the component re-renders, regardless of whether `text` changed.
> The `computed` property will execute exactly ONCE, cache the result, and only execute again if `text.value` actually changes.
> ```
> - Think about caching.
> 
---

### Exercise 2: Computed Filtered List Pattern

**Problem:** Write a Vue computed property `activeUsers` filtering array `users` (`ref`) where `user.isActive === true`.

**Expected output:**
> [!check]- Answer
> ```javascript
> const activeUsers = computed(() => users.value.filter(u => u.isActive));
> ```
> - Computed properties cache results based on reactive dependencies.
> 
> ```javascript
> const activeUsers = computed(() => {
>   return users.value.filter(user => user.isActive);
> });
> ```
> 
---

### Exercise 3: Computed vs Method Caching

**Problem:** Why is a computed property `fullName` superior to calling a method `getFullName()` inside a template loop?

**Expected output:**
> [!check]- Answer
> ```text
> Computed properties cache their result based on reactive dependencies and re-evaluate ONLY when dependencies change; methods execute on every single component re-render.
> ```
> - Computed = Cached until dependency changes.
> - Method = Executes on every re-render.
> 
> ```text
> Computed properties cache evaluation results until dependencies change.
> ```
> 
> 
---

## 7. Related Terms
- [Watchers](watchers.md) — The tool you should use instead if you need to perform side effects.
- [`ref`](ref.md) — A computed property actually returns a special, read-only `ref` object under the hood!
- [`watchEffect`](watch_effect.md) — Auto-tracking reactivity watcher.
- [Template Syntax](../level_01/template_syntax.md) — Related concept: Template Syntax.
- [State & Getters (Pinia)](../level_07/state_getters.md) — Related concept: State & Getters (Pinia).
- [`v-once` & `v-memo`](../level_08/v_once_memo.md) — Related concept: `v-once` & `v-memo`.

---

## 8. Key Takeaways
- **Computed Properties** are used to calculate derived data from existing reactive state.
- They are highly optimized: they **cache** their results and only recalculate when their specific dependencies change.
- They help keep templates clean of complex logic.
- They must be **Pure Functions**: they should only return a value, never mutate other state or make API calls.
