# `watchEffect`

> **Level 2 — Reactivity System**
> A reactive utility that automatically tracks dependencies read during its execution and re-runs the side effect whenever any tracked dependency changes.

---

## 1. Prerequisites
- [`ref`](../level_02/ref.md) — The fundamental reactive reference.
- [Watchers](../level_02/watchers.md) — The base tracking mechanism that monitors changes.

---

## 2. Term Category
- **Vue Reactivity API**

---

## 3. Environment Context
- **Composition API (`<script setup>`)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In Vue, standard watchers (`watch`) are highly explicit. You tell Vue exactly what property to monitor, and Vue gives you a callback with the new and old values. This works wonderfully for simple updates.

However, sometimes you need to write a side effect that depends on *multiple* reactive sources. For example, if you are saving user settings to localStorage, you might need to track `userId`, `theme`, and `fontSize`. Declaring all three as watch sources in `watch([userId, theme, fontSize], ...)` is verbose. If you add a fourth dependency tomorrow, you must remember to update both the watch source array and the callback signature.

**`watchEffect`** removes this friction. It doesn't ask you *what* you want to watch. Instead, it immediately runs your side-effect code, listens to what reactive values you touch *during* the execution, and registers them as dependencies automatically.

### (2) How it works under the hood
When `watchEffect(fn)` is declared:
1. It executes the callback function `fn` immediately.
2. While `fn` runs, Vue sets a global "active effect" pointer.
3. Every time a reactive dependency (like a `ref` or `reactive` property) is read, its getter checks for the active effect and adds it to its subscriber list.
4. If any of those read variables change in the future, the subscriber list is triggered, and `fn` runs again.

Unlike `watch`, `watchEffect` is run once immediately during initialization so that Vue can discover the initial dependencies.

### (3) Code Examples

#### Short Snippet
```javascript
import { ref, watchEffect } from 'vue'

const count = ref(0)
const limit = ref(10)

// watchEffect runs immediately: console logs "Count is: 0"
// It will re-run automatically whenever `count` or `limit` is updated
watchEffect(() => {
  if (count.value >= limit.value) {
    console.log(`Limit reached: ${count.value}`)
  } else {
    console.log(`Count is: ${count.value}`)
  }
})
```

#### Fuller Example
In real-world applications, side effects often involve asynchronous tasks (like fetching data). When dependency updates occur rapidly, older pending requests must be cancelled to prevent race conditions. `watchEffect` solves this by passing an `onCleanup` function.

```vue
<script setup>
import { ref, watchEffect } from 'vue'

const userId = ref(1)
const userData = ref(null)

watchEffect((onCleanup) => {
  const controller = new AbortController()
  const signal = controller.signal

  // 1. Run the fetch
  fetch(`https://jsonplaceholder.typicode.com/users/${userId.value}`, { signal })
    .then(res => res.json())
    .then(data => {
      userData.value = data
    })
    .catch(err => {
      if (err.name !== 'AbortError') console.error(err)
    })

  // 2. Register cleanup: triggers before the next run or when component unmounts
  onCleanup(() => {
    controller.abort() // Cancel the outdated request
  })
})
</script>

<template>
  <div>
    <select v-model.number="userId">
      <option :value="1">User 1</option>
      <option :value="2">User 2</option>
    </select>
    <pre v-if="userData">{{ userData }}</pre>
    <p v-else>Loading...</p>
  </div>
</template>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Accessing reactive values after an `await` statement

**The mistake:** Expecting `watchEffect` to track a reactive value read *after* an asynchronous boundary.

**Why it's wrong:** Vue's dependency tracking is completely synchronous. As soon as the first `await` is hit, the synchronous execution of the callback ends, and Vue stops recording dependencies. Any reactive variables accessed after `await` will not be registered.

*Incorrect:*
```javascript
watchEffect(async () => {
  // Vue tracks this!
  console.log(`Fetching updates for ID: ${id.value}`) 
  
  const data = await fetchData(id.value)
  
  // Vue WILL NOT track this. Changes to theme.value will not trigger re-run.
  console.log(`Applying theme: ${theme.value}`) 
})
```

*Fix:* Make sure all reactive variables are read synchronously at the start of the effect before any `await` statements.
```javascript
watchEffect(async () => {
  const currentId = id.value
  const currentTheme = theme.value // Read synchronously, tracked!
  
  console.log(`Fetching updates for ID: ${currentId}`)
  const data = await fetchData(currentId)
  console.log(`Applying theme: ${currentTheme}`)
})
```

**Golden Rule:** `watchEffect` only tracks reactive properties accessed synchronously *before* the first asynchronous operation (`await`, `setTimeout`, etc.).

---

### Mistake 2: Expecting `watchEffect()` to Track Dependencies Un-Evaluated Inside Conditional Branches

**The mistake:** Expecting `watchEffect()` to re-run when `b` changes, when initial run executed `if (a)` and `a` was false.

**Why it's wrong:** `watchEffect()` tracks ONLY dependencies accessed DURING its synchronous execution. If `b` is inside an un-executed `else` block, it is not tracked until `a` becomes true.

*Incorrect:*
```javascript
watchEffect(() => {
  if (show.value) console.log(data.value);
  // ❌ data is NOT tracked while show.value is false!
});
```

*Fix:*
```javascript
// Use explicit watch() if tracking must happen regardless of execution paths:
watch([show, data], ([newShow, newData]) => { ... });
```

---

### Mistake 3: Creating Infinite Loops by Mutating Tracked State Inside `watchEffect()`

**The mistake:** Mutating `count.value++` inside `watchEffect(() => { console.log(count.value); count.value++; })`.

**Why it's wrong:** Reading `count.value` registers it as a dependency. Mutating `count.value` inside the same callback triggers the effect to re-run immediately, causing an infinite loop.

*Incorrect:*
```javascript
watchEffect(() => {
  console.log(count.value);
  count.value++; // ❌ Infinite effect execution loop!
});
```

*Fix:*
```javascript
// Perform state mutations outside effect callbacks or use explicit watch()
```


---

## 6. Practice Exercises

### Exercise 1: Auto-Saving State

**Problem:** You are building a form component and want to auto-save its settings to `localStorage` every time the user edits them. Complete the script block using `watchEffect` to perform this task automatically.

```vue
<script setup>
import { reactive, watchEffect } from 'vue'

const settings = reactive({
  theme: 'dark',
  notifications: true
})
</script>
```

**Expected output:**
```text
Every time `settings.theme` or `settings.notifications` changes, the entry in localStorage is updated.
```

> [!check]- Answer
> - Remember that `watchEffect` automatically tracks what you read inside. You just need to run `localStorage.setItem('user-settings', JSON.stringify(settings))` inside the effect.
> - Since `settings` is reactive, touching its properties or converting it to string inside the effect will trigger Vue's tracking.

---

### Exercise 2: watchEffect Immediate Execution Rule

**Problem:** Does `watchEffect()` execute its callback function immediately upon component creation, or wait for dependency changes?

**Expected output:**
```text
watchEffect() executes IMMEDIATELY upon creation to track dependencies during initial run.
```

> [!check]- Answer
> - `watchEffect()` runs immediately to discover dependencies.
> - `watch()` runs lazily by default.
> 
> ```javascript
> watchEffect(() => {
>   console.log('Runs immediately on setup');
> });
> ```

---

### Exercise 3: watchEffect Cleanup Callback

**Problem:** Write `watchEffect()` using `onCleanup` callback to abort pending fetch requests when dependencies change.

**Expected output:**
```javascript
watchEffect((onCleanup) => { const controller = new AbortController(); fetch(url.value, { signal: controller.signal }); onCleanup(() => controller.abort()); });
```

> [!check]- Answer
> - `onCleanup()` registers cleanup functions executed before re-runs.
> 
> ```javascript
> watchEffect((onCleanup) => {
>   const controller = new AbortController();
>   fetch(url.value, { signal: controller.signal });
>   onCleanup(() => controller.abort());
> });
> ```


---

## 7. Related Terms
- [Watchers](../level_02/watchers.md) — The explicit tracking mechanism.
- [Computed Properties](../level_02/computed_properties.md) — Track dependencies to compute a new cached value rather than executing a side effect.

---

## 8. Key Takeaways
- **`watchEffect()`** automatically tracks all reactive properties read during its synchronous execution.
- It executes its callback immediately upon initialization, and then re-runs on any dependency change.
- Unlike `watch`, it does not require explicit source tracking and does not provide `oldValue` / `newValue`.
- Dependecy tracking is synchronous; anything accessed after an `await` statement is ignored.
- Use the `onCleanup` parameter callback to cancel pending async processes or clean up timers before the effect re-runs.
