# `ref`

> **Level 2 — Reactivity System**
> The foundational Composition API function that takes an inner value and returns a reactive, mutable reference object containing a single `.value` property.

---

## 1. Prerequisites

- [Reactive State](reactive_state.md) — The fundamental reactive data model created by `ref()`.
- [Composition API](../level_01/composition_api.md) — The modern component setup syntax where `ref()` is primarily used.

---

## 2. Term Category

**Vue Reactivity API / Reactive Wrapper Primitive (Reference Implementation)**: `ref()` is Vue 3's primary API for declaring reactive state. It takes any value—primitives (`string`, `number`, `boolean`, `symbol`, `null`, `undefined`) as well as objects and arrays—and wraps it in a reactive `RefImpl` instance exposing getter and setter accessors on its `.value` property.

When passed primitive values, `ref()` uses Object property getters and setters to intercept reads and writes. When passed objects or arrays, `ref()` automatically delegates inner object processing to `reactive()`. Functional across browser and server contexts, `ref()` provides predictable, reassignable reactivity tracking.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In native JavaScript, primitive data types (`number`, `string`, `boolean`) are passed **by value**, not by reference. 

If Vue attempts to track a raw primitive variable like `let count = 0`, it cannot. Once `count` is passed into a function or template, JavaScript passes a static copy of the number `0`. There is no container or memory reference for Vue to attach getter/setter alarm traps to.

To overcome this language limitation, Vue provides **`ref()`**. It takes your raw primitive value (`0`) and encapsulates it inside a lightweight wrapper object: `{ value: 0 }`. Because JavaScript objects are passed **by reference**, Vue can attach getter/setter traps to the `.value` property. 

When code reads `count.value`, Vue records a dependency subscriber. When code assigns `count.value = 5`, Vue notifies subscribers and triggers Virtual DOM updates.

Furthermore, `ref()` solves the reassignment limitation of `reactive()`. You can replace an entire array or object stored inside a ref by assigning `items.value = newArray` without losing reactivity.

### (2) Reality Metaphor
Think of a Tracked Lockbox Container (`ref()`) versus writing numbers directly on a slip of paper.

If you write the number `5` directly on a loose slip of paper, anyone can throw the paper away or copy the number, and you will never know.

A `ref()` is a transparent glass Lockbox. The box itself stays in a fixed place on your desk. Inside the box sits a card displaying the number `5`. When you want to see the number, you look through the glass door marked `.value`. When you want to change the number, you open the door marked `.value` and place a new card inside. Because the lockbox itself never moves, anyone watching the lockbox is notified immediately whenever the card inside is changed.

### (3) Vue Code Examples

#### Short Snippet
```vue
<script setup>
import { ref } from 'vue'

// 1. Declare reactive primitive ref
const count = ref(0)

function increment() {
  // 2. Access and mutate via .value in JavaScript
  count.value++
}
</script>

<template>
  <!-- 3. Vue automatically unwraps refs in template (No .value required!) -->
  <button @click="increment">Count: {{ count }}</button>
</template>
```

#### Fuller Example
```vue
<script setup>
import { ref, computed } from 'vue'

// Primitive refs
const searchKeyword = ref('')
const isSearching = ref(false)

// Array ref (can be replaced entirely via .value!)
const searchResults = ref([])

const resultCount = computed(() => searchResults.value.length)

async function performSearch() {
  if (!searchKeyword.value.trim()) return
  
  isSearching.value = true
  try {
    // Simulated API payload response
    const mockApiData = ['Vue 3 Reference Guide', 'Pinia Store Patterns', 'Vite Optimization']
    
    // Complete array reassignment supported via .value!
    searchResults.value = mockApiData.filter(item => 
      item.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  } finally {
    isSearching.value = false
  }
}

function clearSearch() {
  searchKeyword.value = ''
  searchResults.value = [] // Reset array pointer cleanly
}
</script>

<template>
  <div class="search-widget">
    <input v-model="searchKeyword" placeholder="Search documentation..." />
    <button @click="performSearch">Search</button>
    <button @click="clearSearch">Clear</button>

    <p v-if="isSearching">Querying API...</p>
    <ul v-else>
      <li v-for="item in searchResults" :key="item">{{ item }}</li>
    </ul>

    <p>Total Found: {{ resultCount }}</p>
  </div>
</template>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Omission of `.value` in JavaScript Logic

**The mistake:** Accessing or comparing a `ref` directly inside `<script setup>` without appending `.value` (e.g. writing `if (isAdult)` or `count = 10`).

**Why it's wrong:** `ref()` returns a `RefImpl` object instance (`{ value: ... }`). In JavaScript, object instances are ALWAYS truthy! Evaluating `if (isAdult)` checks whether the object wrapper exists (which is true), ignoring the underlying boolean `.value`.

*Incorrect:*
```javascript
const isAdult = ref(false)
if (isAdult) { // ❌ Evaluates to true because the RefImpl object exists!
  console.log('Adult approved!')
}
```

*Fix:*
```javascript
const isAdult = ref(false)
if (isAdult.value) { // Correctly checks underlying boolean value
  console.log('Adult approved!')
}
```

---

### Mistake 2: Writing Redundant `.value` Inside HTML Template Expressions

**The mistake:** Writing `<h1>{{ count.value }}</h1>` or `<input :value="count.value">` inside template markup.

**Why it's wrong:** Vue's template compiler automatically unwraps top-level `ref` objects inside template rendering contexts. Writing `.value` in templates is redundant and can cause errors if accessing nested properties.

*Incorrect:*
```vue
<h1>Count: {{ count.value }}</h1> <!-- ❌ Redundant .value in template! -->
```

*Fix:*
```vue
<h1>Count: {{ count }}</h1> <!-- Vue unwraps refs automatically in templates -->
```

---

### Mistake 3: Overwriting the `ref` Variable Itself Instead of Mutating `.value`

**The mistake:** Reassigning a `ref` declared with `let` (e.g. `let count = ref(0); count = 5`).

**Why it's wrong:** Reassigning the variable replaces the `RefImpl` wrapper instance with a raw primitive number (`5`), completely destroying Vue's reactivity tracking wrapper.

*Incorrect:*
```javascript
let count = ref(0)
count = 5 // ❌ Overwrites the RefImpl wrapper instance!
```

*Fix:*
```javascript
const count = ref(0) // Always declare refs using const
count.value = 5 // Mutate inner value via .value property
```

---

## 5. Practice Exercises

### Exercise 1: E-Commerce Quantity Selector Ref Component

**Scenario:** A product details page uses a `ref()` to track item quantities and validate min/max constraints.
**Requirements:**
1. Declare `const quantity = ref(1)`.
2. Provide `increment()` and `decrement()` functions (bounded between 1 and 10).
3. Compute `totalPrice` (`quantity * 45`).
4. Validate boundary state mutations via test assertions.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, computed } from 'vue'
> 
> const itemPrice = 45
> const quantity = ref(1)
> 
> const totalPrice = computed(() => quantity.value * itemPrice)
> 
> function increment() {
>   if (quantity.value < 10) quantity.value++
> }
> 
> function decrement() {
>   if (quantity.value > 1) quantity.value--
> }
> 
> // Test assertions
> console.assert(quantity.value === 1, 'Initial quantity 1')
> console.assert(totalPrice.value === 45, 'Initial price 45')
> increment()
> console.assert(quantity.value === 2, 'Quantity 2')
> console.assert(totalPrice.value === 90, 'Total price 90')
> quantity.value = 10
> increment() // Bounded at 10
> console.assert(quantity.value === 10, 'Quantity capped at 10')
> </script>
> 
> <template>
>   <div>
>     <button @click="decrement">-</button>
>     <span>{{ quantity }}</span>
>     <button @click="increment">+</button>
>     <p>Total: ${{ totalPrice }}</p>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **`const` declaration**: Declaring `quantity` with `const` prevents accidental reassignment of the ref object.
> 2. **`.value` access in script**: JavaScript functions mutate `quantity.value` directly.
> 3. **Template ref unwrapping**: Template tags reference `quantity` without `.value`.
> 4. **Computed propagation**: `totalPrice` automatically recalculates whenever `quantity.value` mutates.
> 
---

### Exercise 2: Industrial IoT Telemetry Threshold Controller

**Scenario:** An industrial IoT control panel uses `ref()` to store alarm threshold values and toggle emergency overrides.
**Requirements:**
1. Declare `pressureThreshold = ref(150)` and `isOverrideActive = ref(false)`.
2. Implement `setThreshold(val)` and `toggleOverride()`.
3. Compute `statusText` ('Normal', 'Override Active', 'PRESSURE WARNING').
4. Validate status transitions via test assertions.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, computed } from 'vue'
> 
> const currentPressure = ref(160)
> const pressureThreshold = ref(150)
> const isOverrideActive = ref(false)
> 
> const statusText = computed(() => {
>   if (isOverrideActive.value) return 'Override Active'
>   return currentPressure.value > pressureThreshold.value ? 'PRESSURE WARNING' : 'Normal'
> })
> 
> function toggleOverride() {
>   isOverrideActive.value = !isOverrideActive.value
> }
> 
> // Verification test
> console.assert(statusText.value === 'PRESSURE WARNING', 'Warning should trigger at 160 PSI')
> toggleOverride()
> console.assert(statusText.value === 'Override Active', 'Override text should show when active')
> </script>
> 
> <template>
>   <div>
>     <h3>Status: {{ statusText }}</h3>
>     <button @click="toggleOverride">Toggle Safety Override</button>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Primitive encapsulation**: Numbers and booleans are wrapped cleanly in `ref()` instances.
> 2. **Multi-ref computation**: `statusText` subscribes to `isOverrideActive`, `currentPressure`, and `pressureThreshold`.
> 3. **Fine-grained updates**: Mutating `isOverrideActive.value` flushes updates specifically to the status header.
> 4. **Script setup ergonomics**: Imported `ref` helpers require zero boilerplate options setup.
> 
---

### Exercise 3: Financial Currency Array Reassignment Ref Engine

**Scenario:** A currency conversion view updates trading rate lists using full array reassignment via `ref()`.
**Requirements:**
1. Declare `rates = ref([0.92, 0.85])`.
2. Implement `updateRates(newRates)` assigning `rates.value = newRates`.
3. Compute `rateCount`.
4. Validate array reassignment reactivity via test assertions.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, computed } from 'vue'
> 
> const rates = ref([0.92, 0.85, 1.10])
> 
> const rateCount = computed(() => rates.value.length)
> 
> function updateRates(newRates) {
>   // Full array reassignment supported via .value!
>   rates.value = newRates
> }
> 
> // Assertions
> console.assert(rateCount.value === 3, 'Initial rate count 3')
> updateRates([0.94, 0.88])
> console.assert(rateCount.value === 2, 'Rate count should update to 2 after reassignment')
> console.assert(rates.value[0] === 0.94, 'First rate should be 0.94')
> </script>
> 
> <template>
>   <div>
>     <p>Active FX Rates Count: {{ rateCount }}</p>
>     <ul>
>       <li v-for="(rate, idx) in rates" :key="idx">{{ rate }}</li>
>     </ul>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Reassignment capability**: Unlike `reactive()`, `ref()` allows complete object/array replacement via `.value = newArray`.
> 2. **Proxy delegation**: Arrays passed to `ref()` are wrapped in deep reactive proxies automatically.
> 3. **Template loop unwrapping**: `v-for="rate in rates"` iterates over array refs seamlessly.
> 4. **Memory pointer retention**: Replacing `.value` triggers dependency notifications while retaining the `RefImpl` object pointer.
> 
---

## 6. Related Terms

- [`reactive`](reactive.md) — The alternative reactivity function designed specifically for objects.
- [`toRefs` / `toRef`](to_refs.md) — The utility function converting reactive object properties into individual refs.
- [Computed Properties](computed_properties.md) — Read-only refs derived from reactive dependencies.
- [`shallowRef` / `markRaw`](shallow_ref_mark_raw.md) — Performance escape hatches for non-deep ref wrapping.

---

## 7. Key Takeaways

- **`ref()`** is the primary function for declaring reactive state in Vue 3 Composition API components.
- It wraps primitives and reference types inside a `RefImpl` object container with a `.value` property.
- Always use `.value` to read or mutate refs inside JavaScript (`<script setup>`).
- Do NOT write `.value` inside HTML `<template>` expressions—Vue unwraps refs automatically in templates.
- Always declare refs using `const` to prevent accidentally overwriting the reactive wrapper instance.
