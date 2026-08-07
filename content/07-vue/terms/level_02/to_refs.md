# `toRefs` / `toRef`

> **Level 2 — Reactivity System**
> Reactivity utility functions that convert properties of a reactive object into individual reactive refs while preserving a live two-way binding link to the source object.

---

## 1. Prerequisites

- [`reactive`](reactive.md) — The reactivity API used to define reactive objects that `toRefs()` unpacks.
- [`ref`](ref.md) — The reactive reference primitive produced for each object property.

---

## 2. Term Category

**Vue Reactivity API / Destructuring Bridge (Ref Projection Utility)**: `toRefs()` and `toRef()` are reactivity bridge utilities in Vue 3. 

- `toRefs(reactiveObject)` converts every property of a reactive Proxy object into a plain object containing individual reactive `RefImpl` instances.
- `toRef(reactiveObject, 'key')` converts a single property of a reactive object into a dedicated `RefImpl` instance.

Operable across component setup functions and composables, these utilities resolve JavaScript's pass-by-value destructuring flaw, ensuring that destructuring or returning reactive object properties maintains live two-way synchronization with the parent reactive state.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In Vue 3, `reactive()` is a popular tool for organizing multi-property component state objects:

```javascript
const state = reactive({ count: 0, user: 'Alice' })
```

However, developers frequently run into a major JavaScript language barrier when attempting to destructure properties for cleaner template syntax or when returning state from reusable Composables:

```javascript
// JavaScript destructures primitive values by copying value, NOT reference!
const { count, user } = state // ❌ Reactivity connection is dead!
```

Under the hood, ES6 destructuring evaluates `state.count` and assigns the primitive number `0` to a local variable `count`. Because `count` is now a raw primitive number disconnected from Vue's proxy getters and setters, future mutations to `state.count` will never update `count`, and mutating `count` will not update `state.count`.

To solve this without abandoning destructuring, Vue created **`toRefs()`** and **`toRef()`**. They wrap every property key in a special custom proxy ref (a `ObjectRefImpl`). Reading `.value` on the generated ref transparently invokes the getter on the source reactive object; writing to `.value` transparently invokes the setter on the source reactive object.

### (2) Reality Metaphor
Think of an Extension Control Cable (`toRefs()`) plugged into a Central Machinery Station (`reactive()`).

The Central Machinery Station (`reactive()`) contains all the motor controls, speed dials, and power switches inside a main console box. If you try to detach a speed dial physically from the console (destructuring directly), you snap the wires, and the dial becomes useless.

`toRefs()` connects dedicated Extension Control Cables into each dial on the main console. You can carry the handheld extension dial (`count`) anywhere in the room (destructure it safely). Turning the dial on your extension cable transparently adjusts the main console's internal speed dial, and changes on the main console reflect instantly on your extension dial display.

### (3) Vue Code Examples

#### Short Snippet
```vue
<script setup>
import { reactive, toRefs } from 'vue'

const state = reactive({
  count: 0,
  username: 'Alice'
})

// Convert reactive object properties into individual Refs
const { count, username } = toRefs(state)

function increment() {
  // Mutating count.value mutates state.count automatically!
  count.value++
}
</script>

<template>
  <button @click="increment">{{ username }}: {{ count }}</button>
</template>
```

#### Fuller Example
```vue
<!-- Composable file: useMousePosition.js -->
<script>
import { reactive, onMounted, onUnmounted, toRefs } from 'vue'

export function useMousePosition() {
  const pos = reactive({ x: 0, y: 0 })

  function handleMouseMove(event) {
    pos.x = event.clientX
    pos.y = event.clientY
  }

  onMounted(() => window.addEventListener('mousemove', handleMouseMove))
  onUnmounted(() => window.removeEventListener('mousemove', handleMouseMove))

  // Return toRefs so consumers can destructure x and y safely!
  return toRefs(pos)
}
</script>

<!-- Component file: App.vue -->
<script setup>
import { useMousePosition } from './useMousePosition.js'

// Safe destructuring enabled by toRefs in composable!
const { x, y } = useMousePosition()
</script>

<template>
  <div class="mouse-tracker">
    <p>Pointer Coordinates: X = {{ x }}px | Y = {{ y }}px</p>
  </div>
</template>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Destructuring a `reactive()` Object Directly Without `toRefs()`

**The mistake:** Writing `const { count, name } = state` where `state` is a `reactive()` object.

**Why it's wrong:** Direct ES6 destructuring extracts primitive value copies, severing Vue's reactive proxy tracking link. Mutating `count` updates a local variable but fails to trigger UI re-renders.

*Incorrect:*
```javascript
const state = reactive({ count: 0 })
let { count } = state // ❌ Destructuring breaks reactivity!

function increment() {
  count++ // UI does not re-render!
}
```

*Fix:*
```javascript
import { reactive, toRefs } from 'vue'
const state = reactive({ count: 0 })
const { count } = toRefs(state) // Retains reactive ref binding

function increment() {
  count.value++ // UI re-renders cleanly
}
```

---

### Mistake 2: Passing Non-Reactive Plain Objects to `toRefs()`

**The mistake:** Calling `toRefs({ count: 0 })` on a plain, non-reactive JavaScript object.

**Why it's wrong:** `toRefs()` expects a reactive Proxy object (from `reactive()`). Passing plain objects issues runtime console warnings (`toRefs() expects a reactive object but received a plain object`).

*Incorrect:*
```javascript
const { count } = toRefs({ count: 0 }) // ❌ Warning: toRefs expects a reactive object!
```

*Fix:*
```javascript
const state = reactive({ count: 0 })
const { count } = toRefs(state) // Pass reactive Proxy object
```

---

### Mistake 3: Confusing `toRef()` (Single Key) with `toRefs()` (Entire Object)

**The mistake:** Calling `toRef(state)` expecting it to convert all properties into refs.

**Why it's wrong:** `toRef(state, 'key')` converts a SINGLE property key into a ref. `toRefs(state)` converts ALL properties of a reactive object into a plain object of refs.

*Incorrect:*
```javascript
const refs = toRef(state) // ❌ Missing key argument!
```

*Fix:*
```javascript
const countRef = toRef(state, 'count') // Convert single property key
const allRefs = toRefs(state) // Convert all object properties
```

---

## 5. Practice Exercises

### Exercise 1: E-Commerce Composable Form Destructuring Engine

**Scenario:** An e-commerce checkout composable `useCheckoutForm()` returns state to a component that destructures properties safely via `toRefs()`.
**Requirements:**
1. Create `useCheckoutForm()` defining `reactive({ email: '', step: 1 })`.
2. Return `toRefs(state)` from composable.
3. In setup, destructure `{ email, step }`.
4. Mutate `email.value` and assert that `state.email` updates via two-way binding.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { reactive, toRefs } from 'vue'
> 
> function useCheckoutForm() {
>   const state = reactive({
>     email: 'user@example.com',
>     step: 1
>   })
>   
>   return {
>     ...toRefs(state),
>     state // Return original state for testing verification
>   }
> }
> 
> const { email, step, state } = useCheckoutForm()
> 
> function updateEmail(newEmail) {
>   email.value = newEmail
> }
> 
> // Test assertions
> console.assert(email.value === 'user@example.com', 'Initial email should match')
> updateEmail('admin@domain.com')
> console.assert(state.email === 'admin@domain.com', 'Two-way binding must update underlying state.email')
> console.assert(email.value === 'admin@domain.com', 'Ref must reflect updated value')
> </script>
> 
> <template>
>   <div>
>     <p>Checkout Step {{ step }}: {{ email }}</p>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Composable export pattern**: Returning `toRefs(state)` allows callers to destructure properties without breaking reactivity.
> 2. **Two-way proxy sync**: Assigning `email.value = 'admin@domain.com'` executes the setter trap on `state.email`.
> 3. **RefImpl access**: Destructured properties behave as standard `ref` objects requiring `.value` in JavaScript.
> 4. **Template unwrapping**: Destructured refs unwrap automatically inside template expressions.
> 
---

### Exercise 2: Industrial IoT Gateway Single Property Projection via `toRef`

**Scenario:** An industrial IoT gateway component extracts a single `status` property from a reactive device object using `toRef()`.
**Requirements:**
1. Declare `deviceState = reactive({ id: 'GW-9', status: 'STANDBY', temp: 35 })`.
2. Create `statusRef = toRef(deviceState, 'status')`.
3. Provide `setOnline()` helper mutating `statusRef.value`.
4. Validate underlying state updates via test assertions.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { reactive, toRef } from 'vue'
> 
> const deviceState = reactive({
>   id: 'GW-9',
>   status: 'STANDBY',
>   temp: 35
> })
> 
> // Extract single property ref with toRef
> const statusRef = toRef(deviceState, 'status')
> 
> function setOnline() {
>   statusRef.value = 'ONLINE'
> }
> 
> // Assertions
> console.assert(deviceState.status === 'STANDBY', 'Initial status STANDBY')
> setOnline()
> console.assert(deviceState.status === 'ONLINE', 'Mutating statusRef must update deviceState.status')
> console.assert(statusRef.value === 'ONLINE', 'statusRef must evaluate to ONLINE')
> </script>
> 
> <template>
>   <div>
>     <h3>Device {{ deviceState.id }} Status: {{ statusRef }}</h3>
>     <button @click="setOnline">Set Online</button>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Single property targeting**: `toRef(obj, key)` isolates a single target property key instead of converting all keys.
> 2. **Ref projection link**: The projected ref acts as an alias to `deviceState.status`.
> 3. **Undefined key safety**: If the key does not exist on `obj`, `toRef` still returns a valid ref that updates when the key is added later.
> 4. **Clean parameter passing**: Enables passing individual object properties into child components as prop refs cleanly.
> 
---

### Exercise 3: Financial Trading Engine Prop Ref Projection with Default Fallbacks

**Scenario:** A financial trading prop converter projects an optional `currency` prop to a ref with a default fallback value using `toRef()`.
**Requirements:**
1. Mock a props object `{ symbol: 'BTC' }` (omitting `currency`).
2. Create `currencyRef = toRef(props, 'currency', 'USD')`.
3. Verify fallback value behavior via test assertions.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { reactive, toRef } from 'vue'
> 
> const mockProps = reactive({
>   symbol: 'BTC'
>   // currency is omitted
> })
> 
> // toRef with optional default fallback (Vue 3.3+)
> const currencyRef = toRef(mockProps, 'currency', 'USD')
> 
> // Test assertion
> console.assert(currencyRef.value === 'USD', `Expected fallback USD, got ${currencyRef.value}`)
> mockProps.currency = 'EUR'
> console.assert(currencyRef.value === 'EUR', `Expected updated EUR, got ${currencyRef.value}`)
> </script>
> 
> <template>
>   <div>
>     <p>Symbol: {{ mockProps.symbol }} | Currency: {{ currencyRef }}</p>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Default fallback support**: `toRef(obj, key, defaultValue)` returns fallback values when properties are undefined.
> 2. **Props reactivity retention**: Useful for extracting individual reactive prop references in child components.
> 3. **RefImpl interface compliance**: Consistently returns a `RefImpl` object compatible with computed getters and watchers.
> 4. **No prop mutation errors**: Reads properties safely without mutating raw prop objects directly.
> 
---

## 6. Related Terms

- [`reactive`](reactive.md) — The reactive object API that `toRefs()` bridges.
- [`ref`](ref.md) — The reactive reference object created for each property key.
- [Composables](../level_05/composables.md) — Reusable logic functions that rely on `toRefs()` for safe state exports.
- [Proxy Reactivity](../level_08/proxy_reactivity.md) — The underlying ES6 Proxy system being projected.

---

## 7. Key Takeaways

- Destructuring a `reactive()` object directly severs Vue's reactivity connection.
- **`toRefs(reactiveObject)`** converts all properties of a reactive object into individual reactive refs linked to the source object.
- **`toRef(reactiveObject, 'key')`** projects a single property key into a reactive ref.
- Always use `toRefs()` when returning state objects from custom Composables so consumers can use destructuring syntax safely.
- Mutating `.value` on a ref created by `toRefs()` automatically mutates the property on the underlying source `reactive()` object.
