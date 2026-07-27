# Watchers

> **Level 2 — Reactivity System**
> A tool that allows you to observe a specific piece of reactive state and trigger a "Side Effect" (like fetching data or showing an alert) whenever that state changes.

---

## 1. Prerequisites
- [Reactive State](../level_02/reactive_state.md) — The data you are watching.
- [Computed Properties](../level_02/computed_properties.md) — The tool you use for deriving data (which Watchers should NOT be used for).

---

## 2. Term Category
- **Vue Reactivity API**

---

## 3. Environment Context
- **Composition API (`<script setup>`)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
[Computed Properties](../level_02/computed_properties.md) are great for calculating new data, but they strictly forbid Side Effects. 
But what if the user types a new ID into a search bar (`const searchId = ref(5)`), and you need to send an HTTP Request to your backend API to fetch that new user?
You cannot do this in a computed property. You need a way to say: "Hey Vue, keep an eye on `searchId`. The exact moment it changes, run this arbitrary block of code." This is exactly what the **`watch()`** function does.

### (2) How to use it
You import `watch`, pass it the variable you want to observe, and provide a callback function.

```vue
<script setup>
import { ref, watch } from 'vue'

const question = ref('')
const answer = ref('Ask me a question!')

// 1. We WATCH the `question` variable
watch(question, async (newValue, oldValue) => {
  // 2. When the user types a question mark, trigger an API side effect!
  if (newValue.includes('?')) {
    answer.value = 'Thinking...'
    const res = await fetch('https://yesno.wtf/api')
    const json = await res.json()
    answer.value = json.answer
  }
})
</script>

<template>
  <input v-model="question" />
  <p>{{ answer }}</p>
</template>
```

### (3) `watchEffect` (The Smarter Sibling)
Sometimes you have a function that relies on 5 different variables, and you want to trigger the function if *any* of them change. Writing `watch([var1, var2, var3...])` is tedious.
Vue provides **`watchEffect()`**. You just write the function, and Vue automatically tracks every reactive variable used inside it, re-running the effect whenever any of them change!

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using Watchers instead of Computed Properties

**The mistake:** A developer wants `fullName`. They write:
```javascript
const firstName = ref('John');
const lastName = ref('Doe');
const fullName = ref('');

watch([firstName, lastName], () => {
  fullName.value = `${firstName.value} ${lastName.value}`;
});
```

**Why it's wrong:** This is incredibly inefficient and verbose. You are manually maintaining a third piece of state (`fullName`) when it could just be derived on the fly. Watchers should NEVER be used purely to calculate data.
**Golden Rule:** If you are changing a state variable based on another state variable, use a `computed()` property. Only use `watch()` when you need to perform an asynchronous task, an API call, or touch the DOM (Side Effects).

---

### Mistake 2: Watching Reactive Object Properties Directly Without a Getter Function

**The mistake:** Writing `watch(state.count, (newVal) => { ... })` where `state` is `reactive({ count: 0 })`.

**Why it's wrong:** `state.count` resolves to primitive number `0`. Passing primitive numbers to `watch()` throws a runtime warning. Wrap property access in a getter function `() => state.count`.

*Incorrect:*
```javascript
const state = reactive({ count: 0 });
watch(state.count, (val) => {}); // ❌ Warning: Invalid watch source!
```

*Fix:*
```javascript
const state = reactive({ count: 0 });
watch(() => state.count, (val) => {}); // Pass getter function
```

---

### Mistake 3: Expecting `newValue` and `oldValue` to Be Different When Watching Reactive Objects Deeply

**The mistake:** Watching a `reactive` object and expecting `oldValue` to hold previous property values.

**Why it's wrong:** When watching a reactive object, `newValue` and `oldValue` reference the EXACT SAME Proxy object instance, so `newValue === oldValue`.

*Incorrect:*
```javascript
watch(state, (newVal, oldVal) => {
  console.log(newVal.count === oldVal.count); // ❌ Always true! Same object reference!
});
```

*Fix:*
```javascript
// Watch specific property getter to receive distinct primitive new/old values:
watch(() => state.count, (newVal, oldVal) => {
  console.log(newVal, oldVal); // Distinct primitive values
});
```


---

## 6. Practice Exercises

### Exercise 1: Deep Watching

**Problem:** You are watching a deeply nested object: `const user = reactive({ profile: { age: 30 } })`. You set up `watch(user, () => console.log("Changed!"))`. You change `user.profile.age = 31`. The console log does NOT fire! Why?

**Expected output:**
```text
By default, watchers are "shallow". They only trigger if the variable itself is completely replaced. 
To watch for mutations deep inside a nested object, you must pass the `{ deep: true }` option to the watcher!
`watch(user, () => console.log("Changed!"), { deep: true })`
```

> [!check]- Answer
> - How far down does the watcher look?

---

### Exercise 2: Explicit Watcher Setup

**Problem:** Write `watch()` listening to `searchQuery` ref, logging `newVal` when changed, with `{ immediate: true }` option.

**Expected output:**
```javascript
watch(searchQuery, (newVal) => { console.log(newVal); }, { immediate: true });
```

> [!check]- Answer
> - `watch(source, callback, options)` allows explicit tracking.
> - `immediate: true` triggers callback on initial setup.
> 
> ```javascript
> watch(
>   searchQuery,
>   (newVal, oldVal) => { console.log('Search:', newVal); },
>   { immediate: true }
> );
> ```

---

### Exercise 3: Deep Watcher Option

**Problem:** Which option must be passed to `watch(() => state, callback)` to listen for nested property changes inside a ref object?

**Expected output:**
```text
{ deep: true }
```

> [!check]- Answer
> - `{ deep: true }` forces deep object traversal for ref objects.
> 
> ```javascript
> watch(userRef, callback, { deep: true });
> ```


---

## 7. Related Terms
- [Computed Properties](../level_02/computed_properties.md) — The declarative alternative for deriving data.
- [`ref`](../level_02/ref.md) — The variables you are most commonly watching.
- [`watchEffect`](../level_02/watch_effect.md) — Auto-tracking reactivity watcher.
- [`nextTick`](../level_04/next_tick.md) — Awaiting the next DOM update flush.

---

## 8. Key Takeaways
- **Watchers (`watch`)** allow you to execute code (Side Effects) whenever a specific reactive variable changes.
- They are primarily used for asynchronous operations (like API fetching), saving to LocalStorage, or manually touching the DOM.
- Never use a watcher if a Computed Property can achieve the same result.
- `watchEffect` is a convenience tool that automatically tracks all reactive variables used inside its callback.
- To watch nested properties inside an Object, you must use the `{ deep: true }` option.
