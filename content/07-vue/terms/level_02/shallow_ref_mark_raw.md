# `shallowRef` / `markRaw`

> **Level 2 — Reactivity System**
> Performance escape hatches in Vue's reactivity system used to bypass deep reactive wrapping for large objects, third-party library instances, or massive datasets.

---

## 1. Prerequisites
- [`ref`](../level_02/ref.md) — The standard reactive wrapper.
- [`reactive`](../level_02/reactive.md) — The API that makes objects recursively reactive.

---

## 2. Term Category
- **Vue Reactivity API**

---

## 3. Environment Context
- **Composition API (`<script setup>`)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
By default, Vue's reactivity is **deep**. When you wrap an object with `ref()` or `reactive()`, Vue recursively walks through every nested property, transforming it into a Proxy. 

This deep reactivity is what makes Vue feel like magic. However, it comes with a performance cost. If you fetch a massive array of 10,000 items from an API, or store a complex class instance from a third-party library (like Leaflet Maps, Chart.js, or Monaco Editor), Vue's attempt to proxy every internal property will cause noticeable lag. 

Furthermore, many third-party libraries rely on strict internal reference equality or mutate their own state directly. Wrapping them in reactive proxies can alter their identity and break their internal code, causing unexpected bugs. 

To solve these problems, Vue provides **`shallowRef`** and **`markRaw`** as performance escape hatches.

### (2) How it works under the hood

#### `shallowRef`
Unlike `ref`, `shallowRef` only tracks mutations to the `.value` pointer itself. 

```javascript
const shallow = shallowRef({ nested: { count: 0 } })

// This IS tracked because we are reassigning `.value`
shallow.value = { nested: { count: 1 } } 

// This IS NOT tracked. The inner object is not a proxy.
shallow.value.nested.count = 2 
```
Vue's reactivity engine intercepts getter/setter access only at the `.value` property. If you mutate something deeper, the setter is never called, and no component re-renders.

#### `markRaw`
`markRaw` marks a plain object so that it will never be converted to a proxy. Vue attaches a non-enumerable, read-only property to the object: `__v_skip: true`. 

When Vue tries to make this object reactive later, it checks for this flag. If present, Vue returns the raw object directly, skipping proxy generation entirely.

### (3) Code Examples

#### Short Snippet
```javascript
import { shallowRef, markRaw, reactive } from 'vue'

// 1. shallowRef: Only reassigning .value triggers updates
const state = shallowRef({ name: 'Bob' })
state.value.name = 'Alice' // Memory changes, but UI DOES NOT update!
state.value = { name: 'Charlie' } // UI updates!

// 2. markRaw: Prevents an object from ever becoming reactive
const externalTool = markRaw({ log: () => console.log('running') })
const appState = reactive({ tool: externalTool }) // appState.tool remains a plain object, NOT a proxy
```

#### Fuller Example
Using `shallowRef` to store a third-party library instance (like a Chart) and `markRaw` to avoid reactivity overhead on its configuration data.

```vue
<script setup>
import { onMounted, onBeforeUnmount, shallowRef, markRaw } from 'vue'
import Chart from 'chart.js/auto'

// Store the chart instance in a shallowRef. 
// We don't want Vue proxying Chart.js internals!
const chartInstance = shallowRef(null)
const canvasRef = shallowRef(null)

onMounted(() => {
  // Use markRaw on configuration to prevent Vue from proxying chart settings
  const config = markRaw({
    type: 'bar',
    data: {
      labels: ['Red', 'Blue', 'Yellow'],
      datasets: [{ label: 'Votes', data: [12, 19, 3] }]
    }
  })

  // Instantiate and store
  chartInstance.value = new Chart(canvasRef.value, config)
})

onBeforeUnmount(() => {
  if (chartInstance.value) {
    chartInstance.value.destroy()
  }
})
</script>

<template>
  <div>
    <canvas ref="canvasRef"></canvas>
  </div>
</template>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Modifying a nested property in a `shallowRef` and expecting a UI update

**The mistake:** A developer writes to a nested property of a `shallowRef` expecting Vue to detect the change.

**Why it's wrong:** `shallowRef` only watches `.value`. Modifying nested fields changes the object in memory but bypasses Vue's reactivity system.

*Incorrect:*
```javascript
const user = shallowRef({ name: 'Alice', age: 25 })

function birthday() {
  user.value.age++ // UI will not update!
}
```

*Fix:* Reassign `.value` entirely.
```javascript
const user = shallowRef({ name: 'Alice', age: 25 })

function birthday() {
  user.value = {
    ...user.value,
    age: user.value.age + 1
  } // UI updates!
}
```

**Golden Rule:** When using `shallowRef`, treat the inner value as immutable. If you need to make changes, reassign `.value` with a new object.

---

### Mistake 2: Expecting Deep Nested Property Changes to Trigger Reactivity in `shallowRef()`

**The mistake:** Mutating `state.value.nested.count++` on a `shallowRef()` expecting a template re-render.

**Why it's wrong:** `shallowRef()` tracks mutations ONLY to the root `.value` property. Deep nested mutations are ignored. Use `triggerRef(state)` or reassign `.value`.

*Incorrect:*
```javascript
const state = shallowRef({ nested: { count: 0 } });
state.value.nested.count++; // ❌ Deep mutation ignored by shallowRef!
```

*Fix:*
```javascript
const state = shallowRef({ nested: { count: 0 } });
state.value = { nested: { count: 1 } }; // Root .value reassignment triggers update
```

---

### Mistake 3: Attempting to Wrap `markRaw()` Objects in `reactive()` Later Expecting Reactivity

**The mistake:** Wrapping an object marked with `markRaw()` inside `reactive()`.

**Why it's wrong:** `markRaw()` explicitly marks an object to opt-out of reactivity permanently. `reactive()` will return the raw un-proxied object.

*Incorrect:*
```javascript
const rawObj = markRaw({ chart: new Chart() });
const state = reactive({ chart: rawObj }); // ❌ state.chart remains un-reactive!
```

*Fix:*
```vue
/* Use markRaw for complex third-party library instances (Monaco Editor, Chart.js, Three.js) */
```


---

## 6. Practice Exercises

### Exercise 1: Optimization

**Problem:** You are building a dashboard displaying real-time server logs. Every second, you append a new log to a list of 5,000 logs. The UI is lagging. Optimize the script block below using `shallowRef`.

```vue
<script setup>
import { ref } from 'vue'

const logs = ref([])

function addLog(message) {
  logs.value.push({ timestamp: new Date(), message })
}
</script>
```

**Expected output:**
> [!check]- Answer
> ```text
> The logs list is updated efficiently without recursively scanning the entire array for reactive changes.
> ```
> - Replace `ref` with `shallowRef`.
> - Because `shallowRef` does not track array operations like `.push()`, you must reassign `.value` with a new array: `logs.value = [...logs.value, newLog]`.

---

### Exercise 2: Shallow Ref Manual Triggering

**Problem:** Which Vue utility function forces template updates after mutating deep properties inside a `shallowRef()`?

**Expected output:**
> [!check]- Answer
> ```text
> triggerRef(shallowRefInstance)
> ```
> - `triggerRef()` manually executes shallowRef watchers.
> 
> ```javascript
> import { shallowRef, triggerRef } from 'vue';
> const state = shallowRef({ count: 0 });
> state.value.count++;
> triggerRef(state); // Forces template re-render
> ```

---

### Exercise 3: markRaw Use Case

**Problem:** Why is `markRaw()` essential when storing large third-party class instances (e.g. Three.js scenes or WebGL contexts) in Vue state?

**Expected output:**
> [!check]- Answer
> ```text
> Wrapping complex third-party class instances in Vue reactive proxies creates heavy memory overhead and causes unexpected internal proxy method breaks.
> ```
> - Avoids Proxy wrapping overhead for heavy non-reactive instances.
> 
> ```javascript
> const mapInstance = markRaw(new MapboxGL.Map());
> ```


---

## 7. Related Terms
- [`ref`](../level_02/ref.md) — The standard reactive wrapper.
- [`reactive`](../level_02/reactive.md) — The deep reactive object wrapper.
- [Virtual DOM](../level_08/virtual_dom.md) — The virtual representation of the DOM that Vue updates when reactive variables change.

---

## 8. Key Takeaways
- **`shallowRef`** only intercepts reads/writes on the `.value` property. Deep nested changes are completely ignored by Vue's reactivity.
- **`markRaw`** permanently tags an object to prevent it from ever being converted into a reactive proxy.
- Use `shallowRef` and `markRaw` to avoid the performance overhead of deeply proxying massive datasets or lists.
- Use `shallowRef` when storing complex stateful class instances from third-party libraries (e.g. maps, editors, charts).
- When mutating a `shallowRef`, you must treat the value as immutable and reassign `.value` entirely to trigger a UI render.
