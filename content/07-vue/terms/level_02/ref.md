# `ref`

> **Level 2 — Reactivity System**
> A Composition API function used to declare reactive state. It takes an inner value and wraps it in a special tracking object.

---

## 1. Prerequisites
- [Reactive State](reactive_state.md) — What `ref` creates.
- [Composition API](../level_01/composition_api.md) — The syntax where `ref` is primarily used.

---

## 2. Term Category
- **Vue Reactivity API**

---

## 3. Environment Context
- **Composition API (`<script setup>`)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Vue needs to know when a variable changes so it can update the UI. But in JavaScript, basic data types (like Strings, Numbers, and Booleans) are passed by *value*, not by reference. 
If Vue tries to track `let age = 30`, it can't. There's no way to attach an "alarm bell" to the raw number `30`.
To fix this, Vue provides **`ref()`**. It takes your raw primitive value (`30`) and hides it inside a JavaScript Object. Objects *can* be tracked. 

### (2) The `.value` Property
When you use `ref(0)`, Vue returns an object that looks like this: `{ value: 0 }`.
Vue attaches interceptors to that `.value` property. If anyone tries to read `.value`, Vue writes down their name. If anyone tries to change `.value`, Vue rings the alarm and updates the UI.

```vue
<script setup>
import { ref } from 'vue'

// 1. We create a reactive reference
const count = ref(0)

function increment() {
  // 2. We MUST use `.value` inside JavaScript!
  // Writing `count++` is trying to add 1 to an Object, which results in NaN.
  count.value++
}
</script>

<template>
  <!-- 3. Vue automatically un-wraps the ref in the template. No `.value` needed! -->
  <button @click="increment">{{ count }}</button>
</template>
```

### (3) Template Unwrapping
To make our lives easier, Vue provides "Template Unwrapping". Inside the HTML `<template>`, Vue automatically looks for `ref` objects and extracts the `.value` for you. This is why you write `{{ count }}` instead of `{{ count.value }}`.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting `.value` in logic

**The mistake:** A developer writes:
`const isAdult = ref(false); if (isAdult) { console.log("Adult!"); }`

**Why it's wrong:** `isAdult` is an Object (`{ value: false }`). In JavaScript, an Object is ALWAYS "truthy", even if its inner value is false! The `if` statement will always evaluate to `true`, causing a massive logic bug.
**Golden Rule:** When working inside the `<script>` tag, you MUST append `.value` to read or write to a `ref`. (`if (isAdult.value)`).

---

### Mistake 2: Omiting `.value` Inside `<script setup>` Logic

**The mistake:** Writing `if (count === 5)` or `count = 10` inside `<script setup>`.

**Why it's wrong:** `ref()` wraps values inside an object `{ value: ... }`. Comparing or assigning `count` directly operates on the RefImpl object, not the inner value.

*Incorrect:*
```javascript
const count = ref(5);
if (count === 5) {} // ❌ Compares RefImpl object to number 5 (false)!
```

*Fix:*
```javascript
const count = ref(5);
if (count.value === 5) {} // Access value via .value
```

---

### Mistake 3: Writing `.value` Inside `<template>` Blocks

**The mistake:** Writing `{{ count.value }}` inside template HTML.

**Why it's wrong:** Vue automatically unwraps top-level `ref` objects inside `<template>` rendering contexts. Adding `.value` in templates is redundant and error-prone.

*Incorrect:*
```vue
<h1>Count: {{ count.value }}</h1> <!-- ❌ Redundant .value in template! -->
```

*Fix:*
```vue
<h1>Count: {{ count }}</h1> <!-- Vue unwraps refs automatically -->
```


---

## 6. Practice Exercises

### Exercise 1: Reassigning Refs

**Problem:** Look at this code. Will the UI update to show "Alice"?
```javascript
let user = ref("Bob");
user = "Alice";
```

**Expected output:**
> [!check]- Answer
> ```text
> No! It will completely break the reactivity.
> By reassigning the `user` variable to a raw string ("Alice"), you have destroyed the reactive Object wrapper! 
> You must write: `user.value = "Alice"`. 
> (This is why you should always declare refs with `const`, not `let`).
> ```
> - `user` is the tracking object. You should never overwrite the tracking object itself.
> 
---

### Exercise 2: Ref Initialization and Mutation

**Problem:** Write JS snippet initializing `ref` array `todos` with `['Task 1']`, and a function `addTodo(task)` pushing to `todos`.

**Expected output:**
> [!check]- Answer
> ```javascript
> const todos = ref(['Task 1']); function addTodo(task) { todos.value.push(task); }
> ```
> - `ref()` wraps arrays and primitives.
> - Mutate `.value` inside JavaScript.
> 
> ```javascript
> const todos = ref(['Task 1']);
> function addTodo(task) {
>   todos.value.push(task);
> }
> ```
> 
---

### Exercise 3: Ref Reassignment Feature

**Problem:** Can you replace an entire array wrapped in a `ref` by assigning `todos.value = newArray`?

**Expected output:**
> [!check]- Answer
> ```text
> Yes. Unlike reactive(), refs support complete object/array reassignment via .value while preserving reactivity.
> ```
> - Reassigning `.value` maintains reactivity tracking.
> 
> ```javascript
> const items = ref([1, 2]);
> items.value = [3, 4, 5]; // Fully reactive replacement!
> ```
> 
> 
---

## 7. Related Terms
- [`reactive`](reactive.md) — The alternative way to declare state specifically for Objects.
- [Reactive State](reactive_state.md) — The overarching concept.
- [`shallowRef` / `markRaw`](shallow_ref_mark_raw.md) — Reactivity escape hatches for performance.
- [Composition API](../level_01/composition_api.md) — Related concept: Composition API.
- [Computed Properties](computed_properties.md) — Related concept: Computed Properties.
- [`toRefs` / `toRef`](to_refs.md) — Related concept: `toRefs` / `toRef`.
- [Watchers](watchers.md) — Related concept: Watchers.
- [VueUse](../level_10/vueuse.md) — Related concept: VueUse.

---

## 8. Key Takeaways
- **`ref()`** is the primary tool for creating reactive variables in the Composition API.
- It takes a primitive value (string, number, boolean) and wraps it in a trackable Object with a single `.value` property.
- Inside the `<script>` block, you must always use `.value` to read or mutate the data.
- Inside the `<template>` block, Vue auto-unwraps it, so you do not use `.value`.
- Always declare refs using `const` to prevent accidentally overwriting the reactive wrapper.
