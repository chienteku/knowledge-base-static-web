# Composables

> **Level 5 — Advanced Component Architecture**
> Functions that leverage Vue's Composition API to encapsulate and reuse stateful logic across multiple components.

---

## 1. Prerequisites

- [Composition API](../level_01/composition_api.md) — The foundation that makes Composables possible.
- [Reactive State](../level_02/reactive_state.md) — What is being encapsulated inside the Composable.

---

## 2. Term Category

**Vue Architecture (Code Reuse Pattern)**: Composables are functions that leverage Vue 3's Composition API to encapsulate and share stateful logic across components. By combining reactivity primitives (`ref`, `reactive`, `computed`) and lifecycle hooks (`onMounted`, `onUnmounted`) inside modular JavaScript/TypeScript functions, composables isolate business logic, device APIs, and async side effects from component UI templates.

Unlike React custom hooks—which execute on every render cycle and require explicit dependency arrays (`useEffect`, `useCallback`) to avoid stale closures—Vue composables run exactly once during component setup. Vue's Proxy-based reactivity system ensures that refs and reactive objects returned from a composable remain reactive without manual memoization hooks.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In Vue 2 (Options API), sharing stateful logic across components relied on patterns like Mixins, Renderless Components, or Higher-Order Components. Mixins suffered from critical architectural flaws: implicit property origins (where did `this.x` come from?), namespace collisions when multiple mixins defined identical property names, and tightly coupled lifecycle dependencies.

The Composition API solved this by decoupling Vue's reactivity and lifecycle engine from the component instance rendering layer. Developers can now invoke reactivity functions (`ref`, `reactive`, `computed`) and lifecycle hooks (`onMounted`, `onUnmounted`) inside pure JavaScript/TypeScript functions. Composables provide explicit data sourcing through destructured variable names, zero namespace collisions, and full TypeScript type inference.

### (2) Reality Metaphor
Think of a Composable like a modular telemetry package for an aircraft or industrial vehicle. Instead of welding a speedometer, altitude sensor, and fuel gauge directly into the physical dashboard frame (the component), you assemble them into a self-contained instrument pod (the composable module). When a vehicle needs telemetry, you plug in the pod; it initializes its own sensors (state and lifecycle events) and streams reactive readings (`x`, `y`, `data`) directly to whatever screen chooses to display them. Multiple vehicles can install the exact same telemetry pod design, but each vehicle gets its own isolated set of physical sensors.

### (3) Vue Code Examples

#### Short Snippet
```vue
<script setup>
import { useMouse } from './useMouse'

// Import and unpack stateful logic in a single line
const { x, y } = useMouse()
</script>

<template>
  <p>Coordinates: {{ x }}, {{ y }}</p>
</template>
```

#### Fuller Example
```vue
<!-- TelemetryMonitor.vue -->
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// Custom composable defined inline for illustration (typically in useTelemetry.js)
function useTelemetry(sensorId) {
  const status = ref('Initializing...')
  const payload = ref(0)

  let timer = null

  function pollSensor() {
    payload.value = Math.floor(Math.random() * 100)
    status.value = 'Active'
  }

  onMounted(() => {
    timer = setInterval(pollSensor, 1000)
  })

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  return { status, payload }
}

const { status, payload } = useTelemetry('SENSOR_ALPHA')
</script>

<template>
  <div class="telemetry-panel">
    <h3>Sensor Alpha Telemetry</h3>
    <p>Status: <strong>{{ status }}</strong></p>
    <p>Payload Reading: <strong>{{ payload }} Hz</strong></p>
  </div>
</template>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to Return Reactive References from a Composable

**The mistake:** Returning plain, primitive JavaScript values or snapshot objects rather than reactive `ref` or `computed` objects from a composable function.

**Why it's wrong:** When a composable returns a plain primitive value like `let data = 10`, caller components receive a static value copied at setup time. Subsequent updates inside the composable will not trigger UI updates in the consuming component.

*Incorrect:*
```javascript
export function useCounter() {
  let count = 0;
  function increment() { count++; }
  return { count, increment }; // ❌ Plain number severed from reactivity
}
```

*Fix:*
```javascript
import { ref } from 'vue';

export function useCounter() {
  const count = ref(0);
  function increment() { count.value++; }
  return { count, increment }; // Return ref to preserve reactive tracking
}
```

---

### Mistake 2: Invoking Composables Outside Synchronous Component Setup

**The mistake:** Calling a composable function inside an asynchronous callback, event handler, or setTimeout function.

**Why it's wrong:** Composables often register lifecycle hooks (`onMounted`, `onUnmounted`) or inject dependencies (`inject()`). Vue relies on an active global component instance context during synchronous `<script setup>` execution. Calling composables asynchronously executes after the setup context is torn down, throwing runtime warnings or failing to register hooks.

*Incorrect:*
```javascript
async function handleButtonClick() {
  // ❌ Called inside async handler - active component instance context lost!
  const { data } = useFetch('/api/data');
}
```

*Fix:*
```javascript
// Call composables synchronously at the top level of <script setup>
const { data, execute } = useFetch('/api/data', { immediate: false });

async function handleButtonClick() {
  await execute();
}
```

---

### Mistake 3: Returning Plain `reactive` Objects Directly (Broken Destructuring)

**The mistake:** Returning a `reactive` object directly from a composable without converting its properties to refs using `toRefs()`.

**Why it's wrong:** When the consuming component destructures properties from a reactive object (`const { count } = useMyComposable()`), ES6 destructuring extracts primitive copies and severs Vue's reactive proxy tracking link.

*Incorrect:*
```javascript
export function useForm() {
  const state = reactive({ username: '', email: '' });
  return state; // ❌ Caller destructuring destroys reactivity!
}
```

*Fix:*
```javascript
import { reactive, toRefs } from 'vue';

export function useForm() {
  const state = reactive({ username: '', email: '' });
  return toRefs(state); // Preserves ref wrappers upon destructuring
}
```

---

## 5. Practice Exercises

### Exercise 1: IoT Sensor Stream Manager

**Scenario:** You are building an industrial IoT dashboard monitoring smart factory sensors. You need a composable `useSensorStream(sensorId)` that connects to an MQTT stream, updates real-time telemetry values, and cleans up event listeners when components unmount.

**Requirements:**
1. Maintain reactive `telemetry` (object with `temperature`, `vibration`, `pressure`) and `isConnected` state.
2. Simulate socket data updates on a 500ms interval.
3. Automatically clear interval timers on component unmount using `onUnmounted`.
4. Provide a manual `reconnect()` action method.

> [!check]- Answer
>
> #### Implementation
> ```javascript
> import { ref, reactive, onMounted, onUnmounted } from 'vue';
> 
> export function useSensorStream(sensorId) {
>   const isConnected = ref(false);
>   const telemetry = reactive({
>     temperature: 0,
>     vibration: 0,
>     pressure: 0
>   });
> 
>   let intervalId = null;
> 
>   function connect() {
>     isConnected.value = true;
>     intervalId = setInterval(() => {
>       telemetry.temperature = Number((20 + Math.random() * 10).toFixed(2));
>       telemetry.vibration = Number((0.1 + Math.random() * 0.5).toFixed(3));
>       telemetry.pressure = Number((100 + Math.random() * 5).toFixed(1));
>     }, 500);
>   }
> 
>   function disconnect() {
>     if (intervalId) {
>       clearInterval(intervalId);
>       intervalId = null;
>     }
>     isConnected.value = false;
>   }
> 
>   function reconnect() {
>     disconnect();
>     connect();
>   }
> 
>   onMounted(() => connect());
>   onUnmounted(() => disconnect());
> 
>   return { isConnected, telemetry, reconnect };
> }
> 
> // Technical Test Assertion (Node / Vitest environment simulation)
> const { isConnected, telemetry, reconnect } = useSensorStream('SENSOR-01');
> console.assert(isConnected.value === false, 'Should start disconnected prior to mount');
> ```
>
> #### Technical Explanation
> 1. **Encapsulated State**: `ref` and `reactive` wrap connection status and numerical metrics in isolated reactive primitives.
> 2. **Lifecycle Cleanups**: `onUnmounted` guarantees timer tear-down, preventing memory leaks when factory floor view panels unmount.
> 3. **Method Exposure**: Exposes `reconnect` without leaking internal interval handle variables.
> 4. **Instance Scope**: Each component calling `useSensorStream` gets a dedicated timer and unique state instance.
> 
---

### Exercise 2: Financial Exchange Order Book Aggregator

**Scenario:** A crypto exchange dashboard requires real-time calculation of order book depth. Create a composable `useOrderBook()` that accepts raw order tuples and computes live aggregate bid and ask depth.

**Requirements:**
1. Accept dynamic order inputs via an `addOrder(type, price, amount)` function.
2. Maintain reactive arrays for `bids` and `asks`.
3. Provide computed properties `totalBidVolume` and `totalAskVolume`.
4. Ensure order arrays are capped at 5 items max for performance.

> [!check]- Answer
>
> #### Implementation
> ```javascript
> import { ref, computed } from 'vue';
> 
> export function useOrderBook() {
>   const bids = ref([]);
>   const asks = ref([]);
> 
>   function addOrder(type, price, amount) {
>     const target = type === 'bid' ? bids : asks;
>     target.value.unshift({ id: Date.now(), price, amount });
>     if (target.value.length > 5) {
>       target.value.pop();
>     }
>   }
> 
>   const totalBidVolume = computed(() => {
>     return bids.value.reduce((acc, order) => acc + order.amount, 0);
>   });
> 
>   const totalAskVolume = computed(() => {
>     return asks.value.reduce((acc, order) => acc + order.amount, 0);
>   });
> 
>   return { bids, asks, addOrder, totalBidVolume, totalAskVolume };
> }
> 
> // Test verification
> const { addOrder, totalBidVolume } = useOrderBook();
> addOrder('bid', 50000, 1.5);
> addOrder('bid', 49900, 2.0);
> console.assert(totalBidVolume.value === 3.5, 'Total bid volume should compute correctly');
> ```
>
> #### Technical Explanation
> 1. **Reactive Collections**: Array state changes via `.unshift()` and `.pop()` trigger dependency notifications.
> 2. **Computed Derivation**: `totalBidVolume` dynamically recalculates only when `bids` array elements mutate.
> 3. **Array Mutation Rules**: Uses ref value assignment to trigger reactive array reactivity correctly.
> 4. **Encapsulation**: Keeps internal capped-array manipulation logic hidden behind the clean `addOrder` interface.
> 
---

### Exercise 3: E-Commerce Shopping Cart & Tax Engine

**Scenario:** An e-commerce platform requires client-side price calculation across different regional tax rules. Create a composable `useCartCalculator(taxRate)` that handles item additions, item removals, subtotal calculations, and tax computation.

**Requirements:**
1. State must include an `items` ref array of `{ id, name, price, quantity }`.
2. Compute reactive `subtotal`, `taxAmount`, and `grandTotal`.
3. Provide `addItem(product)` and `removeItem(id)` methods.
4. Export reactive state and helper functions.

> [!check]- Answer
>
> #### Implementation
> ```javascript
> import { ref, computed } from 'vue';
> 
> export function useCartCalculator(taxRate = 0.08) {
>   const items = ref([]);
> 
>   function addItem(product) {
>     const existing = items.value.find(i => i.id === product.id);
>     if (existing) {
>       existing.quantity += product.quantity || 1;
>     } else {
>       items.value.push({ ...product, quantity: product.quantity || 1 });
>     }
>   }
> 
>   function removeItem(id) {
>     items.value = items.value.filter(i => i.id !== id);
>   }
> 
>   const subtotal = computed(() => {
>     return items.value.reduce((sum, item) => sum + item.price * item.quantity, 0);
>   });
> 
>   const taxAmount = computed(() => subtotal.value * taxRate);
>   const grandTotal = computed(() => subtotal.value + taxAmount.value);
> 
>   return { items, addItem, removeItem, subtotal, taxAmount, grandTotal };
> }
> 
> // Test assertion
> const cart = useCartCalculator(0.10);
> cart.addItem({ id: 101, name: 'Widget', price: 100, quantity: 2 });
> console.assert(cart.subtotal.value === 200, 'Subtotal should be 200');
> console.assert(cart.taxAmount.value === 20, 'Tax amount should be 20');
> console.assert(cart.grandTotal.value === 220, 'Grand total should be 220');
> ```
>
> #### Technical Explanation
> 1. **Chained Computeds**: `grandTotal` consumes `subtotal` and `taxAmount` computed getters, leveraging Vue's dependency tree graph.
> 2. **Flexible Parameters**: Accepts initial configuration arguments like `taxRate` upon setup invocation.
> 3. **Array Update Strategy**: Safe item mutation updates maintain reactive array purity.
> 4. **Declarative API**: Exposes clean interface functions that components can call from event handlers.
> 
---

## 6. Related Terms

- [Composition API](../level_01/composition_api.md) — The paradigm that enables this.
- [Pinia](../level_07/pinia.md) — Used for sharing global State, whereas Composables share local Logic.
- [VueUse](../level_10/vueuse.md) — The library containing hundreds of pre-written, open-source composables.
- [Custom Directives (`v-*`)](../level_03/custom_directives.md) — Related concept: Custom Directives (`v-*`).
- [Scoped Slots](scoped_slots.md) — Related concept: Scoped Slots.
- [`<Suspense>` (Vue)](suspense.md) — Related concept: `<Suspense>` (Vue).
- [TypeScript with Vue](../level_10/typescript_vue.md) — Related concept: TypeScript with Vue.

---

## 7. Key Takeaways

- **Composables** are reusable JavaScript functions that encapsulate stateful Vue logic, replacing legacy Vue 2 Mixins.
- Conventionally named starting with `use` (e.g., `useMouse`, `useFetch`, `useCartCalculator`).
- Executed synchronously during component setup, creating an isolated instance of internal reactive state per caller.
- Always return reactive objects (`ref`, `computed`, `toRefs(state)`) so caller destructuring preserves Vue's Proxy reactivity.
- Keep composables focused on logic and side effects, leaving HTML templates to Single-File Components.
