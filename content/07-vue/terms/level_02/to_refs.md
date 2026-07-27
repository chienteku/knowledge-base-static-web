# `toRefs` / `toRef`

> **Level 2 — Reactivity System**
> Vue Reactivity API utilities used to convert properties of a reactive object into individual, trackable refs, preventing the loss of reactivity when destructuring or spreading.

---

## 1. Prerequisites
- [`reactive`](../level_02/reactive.md) — The reactivity API used to make objects reactive.
- [`ref`](../level_02/ref.md) — The reactivity API for wrapping single values.

---

## 2. Term Category
- **Vue Reactivity API**

---

## 3. Environment Context
- **Composition API (`<script setup>`)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In Vue 3, `reactive()` is the go-to tool for managing complex state objects. However, developers quickly hit a frustrating wall when trying to extract properties from a reactive object. 

For example, if you have a reactive state:
```javascript
const state = reactive({ count: 0, name: 'Antigravity' })
```

If you try to destructure it for cleaner template usage:
```javascript
const { count, name } = state // Reactivity is now dead!
```
Under the hood, JavaScript destructuring is just syntax sugar for copying values. Since `count` and `name` are primitive values (a number and a string), JavaScript copies them *by value*, not *by reference*. Once copied, they become plain local variables that have no connection to Vue's reactive proxy system.

To solve this, Vue provides `toRefs` and `toRef`. They act as bridges, turning reactive object properties into individual reactive `ref` wrappers while maintaining a live connection to the parent reactive object.

### (2) How it works under the hood
`toRefs` takes a `reactive` object and returns a plain object where every property is a `ref` pointing to the corresponding property on the original object. 

It does not clone or create a new reactive state. Instead, it wraps each key in a special proxy ref:
```javascript
// Simplistic conceptual model of what toRefs does
function toRefs(object) {
  const result = {}
  for (const key in object) {
    result[key] = toRef(object, key)
  }
  return result
}
```
When you read `.value` from a ref created by `toRefs`, it transparently gets the value from the parent reactive object. When you write to `.value`, it updates the parent object. Reactivity is preserved because the original proxy object is still the single source of truth.

### (3) Code Examples

#### Short Snippet
```javascript
import { reactive, toRefs } from 'vue'

const state = reactive({
  count: 0,
  user: 'Alice'
})

// Convert to refs to allow safe destructuring
const { count, user } = toRefs(state)

// Reactivity is preserved! Updates will update `state.count`
count.value++
console.log(state.count) // Output: 1
```

#### Fuller Example
A classic use case is writing a reusable Composable. By returning a `toRefs` object, consumers can destructure the returned state directly without breaking reactivity.

```vue
<!-- Composable definition: useMouse.js -->
<script>
import { reactive, onMounted, onUnmounted, toRefs } from 'vue'

export function useMouse() {
  const pos = reactive({ x: 0, y: 0 })

  function update(event) {
    pos.x = event.clientX
    pos.y = event.clientY
  }

  onMounted(() => window.addEventListener('mousemove', update))
  onUnmounted(() => window.removeEventListener('mousemove', update))

  // Return toRefs so the consumer can destructure it safely
  return toRefs(pos)
}
</script>

<!-- Component consumption: App.vue -->
<script setup>
import { useMouse } from './useMouse.js'

// Safe destructuring!
const { x, y } = useMouse()
</script>

<template>
  <div class="coords">
    <p>Mouse position: {{ x }}, {{ y }}</p>
  </div>
</template>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Destructuring reactive objects directly

**The mistake:** Destructuring properties out of a `reactive` object to simplify scripts or templates.

**Why it's wrong:** Doing so severs the reactivity tracking. Vue can no longer monitor when those values change or trigger view updates.

*Incorrect:*
```javascript
import { reactive } from 'vue'

const state = reactive({ clicks: 0 })
let { clicks } = state // Destructured to local let variable

function registerClick() {
  clicks++ // Vue is oblivious to this modification!
}
```

*Fix:*
```javascript
import { reactive, toRefs } from 'vue'

const state = reactive({ clicks: 0 })
const { clicks } = toRefs(state) // Turned into a Ref

function registerClick() {
  clicks.value++ // Reactivity maintained
}
```

**Golden Rule:** If you need to unpack or return properties from a reactive object, always pass it through `toRefs` first.

---

### Mistake 2: Passing Plain Objects Instead of Reactive Objects to `toRefs()`

**The mistake:** Calling `toRefs({ name: 'Alice' })` on a non-reactive plain object.

**Why it's wrong:** `toRefs()` expects a reactive Proxy object (from `reactive()`). Passing plain objects issues a runtime warning and fails to link reactivity.

*Incorrect:*
```javascript
const { name } = toRefs({ name: 'Alice' }); // ❌ Warning: toRefs expects a reactive object!
```

*Fix:*
```javascript
const state = reactive({ name: 'Alice' });
const { name } = toRefs(state); // Correct usage on reactive object
```

---

### Mistake 3: Confusing `toRef()` (Single Property) with `toRefs()` (Entire Object)

**The mistake:** Using `toRef(state)` expecting it to convert all properties into refs.

**Why it's wrong:** `toRef(state, 'key')` converts a SINGLE property key into a Ref. `toRefs(state)` converts ALL properties of a reactive object into a plain object of Refs.

*Incorrect:*
```javascript
const refs = toRef(state); // ❌ Missing property key argument!
```

*Fix:*
```javascript
const nameRef = toRef(state, 'name'); // Single property ref
const allRefs = toRefs(state); // All properties converted
```


---

## 6. Practice Exercises

### Exercise 1: Restoring Reactivity

**Problem:** Below is a broken component. When the button is clicked, nothing changes in the UI. Rewrite the script block using `toRefs` or `toRef` to fix the component.

```vue
<script setup>
import { reactive } from 'vue'

const profile = reactive({
  name: 'Dev',
  role: 'Developer'
})

let { role } = profile

function promote() {
  role = 'Lead Architect'
}
</script>

<template>
  <div>
    <p>Role: {{ role }}</p>
    <button @click="promote">Promote</button>
  </div>
</template>
```

**Expected output:**
```text
Clicking the "Promote" button successfully updates the UI from "Role: Developer" to "Role: Lead Architect".
```

> [!check]- Answer
> - The component fails because `let { role } = profile` extracts a plain string, losing reactivity.
> - You need to make `role` a ref linked to `profile`. You can use `toRefs(profile)` or `toRef(profile, 'role')`.
> - Remember to use `.value` inside the `promote` function since `role` will now be a ref!

---

### Exercise 2: Composable toRefs Pattern

**Problem:** Write a composable `useFeature()` returning `toRefs(state)` so callers can destructure props safely.

**Expected output:**
```javascript
function useFeature() { const state = reactive({ count: 0, title: 'App' }); return toRefs(state); }
```

> [!check]- Answer
> - `toRefs()` allows composable consumers to destructure properties without breaking reactivity.
> 
> ```javascript
> function useFeature() {
>   const state = reactive({ count: 0, title: 'App' });
>   return toRefs(state);
> }
> // Caller code:
> const { count, title } = useFeature(); // Reactivity preserved!
> ```

---

### Exercise 3: toRef Optional Default Value

**Problem:** What does `toRef(props, 'foo', 'defaultFoo')` do if property `foo` does not exist on `props`?

**Expected output:**
```text
Returns a ref for 'foo' that evaluates to 'defaultFoo' if props.foo is undefined.
```

> [!check]- Answer
> - Provides fallback ref values for optional component props.
> 
> ```javascript
> const foo = toRef(props, 'foo', 'default');
> ```


---

## 7. Related Terms
- [`reactive`](../level_02/reactive.md) — The API for defining reactive objects.
- [`ref`](../level_02/ref.md) — The API for defining single reactive values.
- [Proxy Reactivity](../level_08/proxy_reactivity.md) — The underlying ES6 Proxy engine that makes `reactive` function.

---

## 8. Key Takeaways
- Destructuring a `reactive` object copies its properties by value, breaking Vue's reactivity.
- **`toRefs()`** takes a reactive object and wraps each of its properties in a reactive ref linked to the parent object.
- **`toRef()`** is used to extract a single property from a reactive object as a ref.
- Always use `toRefs` when returning state from custom Composables so that clients can use destructuring syntax safely.
- Modifying the value of a ref created by `toRefs` directly updates the underlying reactive object.
