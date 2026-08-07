# Computed Properties

> **Level 2 — Reactivity System**
> Declarative reactive calculations derived from reactive state dependencies that automatically cache their evaluation results until underlying dependencies change.

---

## 1. Prerequisites

- [Reactive State](reactive_state.md) — The reactive data sources evaluated inside computed getters.
- [Template Syntax](../level_01/template_syntax.md) — Why complex evaluation logic should be extracted out of template mustaches.

---

## 2. Term Category

**Vue Reactivity API / Derived State Engine (Cached Computed Ref)**: Computed Properties (`computed()`) are first-class reactivity primitives in Vue. Evaluated via pure getter functions, they automatically track any reactive refs or proxy properties accessed during execution.

Unlike standard JavaScript functions which re-execute on every component re-render cycle, computed properties are **cached**. They store their computed return value in memory and only re-evaluate when one of their tracked reactive dependencies mutates. Supported across client and SSR rendering contexts, they return a read-only (or writable) `ComputedRefImpl` proxy object.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In complex user interfaces, components frequently need to display transformed or calculated data: filtering a user list, formatting pricing totals, or calculating chart data points.

Developers could place calculation expressions directly inside template mustaches (`{{ users.filter(u => u.active).length }}`). However, this clutters template markup, eliminates code reuse, and hampers testability. Alternatively, developers could encapsulate logic inside standard component methods (`getActiveUserCount()`). But standard methods execute **on every single template re-render**, even if the `users` array didn't change! If a component re-renders due to an unrelated hover effect or timer, calling expensive filtering loops hundreds of times per second degrades application performance.

Vue introduced **Computed Properties** to solve this. `computed()` getters run ONCE, record their dependencies, and cache the evaluated output. As long as tracked dependencies remain unchanged, reading the computed property returns the cached value instantly with zero recalculation cost.

### (2) Reality Metaphor
Think of an Excel Spreadsheet Formula (`=SUM(A1:A100)`) versus calculating sums manually on a scratchpad every minute.

If you write `=SUM(A1:A100)` in cell B1, Excel calculates the sum once and displays the result `500`. If you scroll around the spreadsheet, edit unrelated cells in column C, or adjust font colors, Excel does NOT recalculate cell B1. It instantly returns the cached `500`. Only when you change a number inside cells A1 through A100 does Excel mark cell B1 dirty and re-evaluate the sum.

Computed properties act as automated spreadsheet formulas inside your Vue components.

### (3) Vue Code Examples

#### Short Snippet
```vue
<script setup>
import { ref, computed } from 'vue'

const count = ref(5)
// Computed getter automatically tracks count.value
const doubleCount = computed(() => count.value * 2)
</script>

<template>
  <p>Count: {{ count }} | Double: {{ doubleCount }}</p>
</template>
```

#### Fuller Example
```vue
<script setup>
import { ref, computed } from 'vue'

const searchQuery = ref('')
const selectedCategory = ref('All')
const items = ref([
  { id: 1, name: 'Wireless Headphones', category: 'Electronics', price: 99 },
  { id: 2, name: 'Ergonomic Office Chair', category: 'Furniture', price: 299 },
  { id: 3, name: 'Mechanical Keyboard', category: 'Electronics', price: 140 }
])

// Computed property filtering items with multi-dependency caching
const filteredItems = computed(() => {
  return items.value.filter(item => {
    const matchesCategory = selectedCategory.value === 'All' || item.category === selectedCategory.value
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    return matchesCategory && matchesSearch
  })
})

const totalValue = computed(() => {
  return filteredItems.value.reduce((sum, item) => sum + item.price, 0)
})
</script>

<template>
  <div class="product-manager">
    <input v-model="searchQuery" placeholder="Search products..." />
    <select v-model="selectedCategory">
      <option value="All">All Categories</option>
      <option value="Electronics">Electronics</option>
      <option value="Furniture">Furniture</option>
    </select>

    <ul>
      <li v-for="item in filteredItems" :key="item.id">
        {{ item.name }} - ${{ item.price }}
      </li>
    </ul>

    <p>Filtered Results Total: ${{ totalValue }}</p>
  </div>
</template>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Invoking Side Effects Inside a Computed Property Getter

**The mistake:** Mutating other state variables or triggering asynchronous network requests inside a `computed()` callback.

**Why it's wrong:** Computed properties MUST be pure side-effect-free getters designed strictly for data derivation. Mutating reactive state inside a computed getter triggers cascading dependency notifications, leading to infinite rendering loops and browser freezes.

*Incorrect:*
```javascript
const filteredData = computed(() => {
  requestCount.value++ // ❌ State mutation side effect inside computed getter!
  return data.value.filter(i => i.active)
})
```

*Fix:*
```javascript
const filteredData = computed(() => {
  return data.value.filter(i => i.active) // Pure getter function
})
```

---

### Mistake 2: Executing Asynchronous Operations Inside Computed Getters

**The mistake:** Returning a Promise or fetching network data inside `computed(async () => ...)` .

**Why it's wrong:** Computed properties expect synchronous return values to establish instant caching layers. Async functions return a Promise object, causing computed properties to evaluate to `Promise <pending>` instead of actual data.

*Incorrect:*
```javascript
const userData = computed(async () => {
  const res = await fetch(`/api/user/${userId.value}`) // ❌ Returns Promise object!
  return res.json()
})
```

*Fix:*
```javascript
const userData = ref(null)
watchEffect(async () => {
  const res = await fetch(`/api/user/${userId.value}`) // Use watchers/effects for async side effects
  userData.value = await res.json()
})
```

---

### Mistake 3: Attempting Direct Read-Only Computed Mutation Without a Writable Setter

**The mistake:** Writing `doubleCount.value = 10` on a standard getter-only computed property.

**Why it's wrong:** Standard `computed(() => ...)` properties are read-only refs. Attempting direct assignment triggers runtime warnings (`Write operation failed: computed value is readonly`).

*Incorrect:*
```javascript
const double = computed(() => count.value * 2)
double.value = 20 // ❌ Warning: Write operation failed on readonly computed ref!
```

*Fix:*
```javascript
// Declare a writable computed property using get and set handlers:
const double = computed({
  get: () => count.value * 2,
  set: (val) => {
    count.value = val / 2
  }
})
```

---

## 5. Practice Exercises

### Exercise 1: E-Commerce Tax and Shipping Order Summary Calculator

**Scenario:** An e-commerce checkout step calculates subtotal, dynamic tax, free shipping eligibility, and final total using computed properties.
**Requirements:**
1. Track `cartItems` array with prices and `userState` for tax rates.
2. Compute `subtotal`, `taxAmount` (8% for NY, 6% for CA), and `shippingFee` ($15 or $0 if subtotal > $100).
3. Compute `grandTotal`.
4. Validate calculation via assertions.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, computed } from 'vue'
> 
> const userState = ref('NY')
> const cartItems = ref([
>   { id: 1, name: 'Headset', price: 60 },
>   { id: 2, name: 'Mousepad', price: 20 }
> ])
> 
> const subtotal = computed(() => cartItems.value.reduce((s, i) => s + i.price, 0))
> 
> const taxRate = computed(() => (userState.value === 'NY' ? 0.08 : 0.06))
> const taxAmount = computed(() => subtotal.value * taxRate.value)
> 
> const shippingFee = computed(() => (subtotal.value >= 100 ? 0 : 15))
> 
> const grandTotal = computed(() => subtotal.value + taxAmount.value + shippingFee.value)
> 
> // Verification assertions
> console.assert(subtotal.value === 80, 'Subtotal should be 80')
> console.assert(taxAmount.value === 6.4, `Expected tax 6.4, got ${taxAmount.value}`)
> console.assert(shippingFee.value === 15, 'Shipping fee should be 15 for orders under 100')
> console.assert(grandTotal.value === 101.4, `Expected grand total 101.4, got ${grandTotal.value}`)
> </script>
> 
> <template>
>   <div>
>     <p>Subtotal: ${{ subtotal }}</p>
>     <p>Tax: ${{ taxAmount.toFixed(2) }}</p>
>     <p>Shipping: ${{ shippingFee }}</p>
>     <h3>Grand Total: ${{ grandTotal.toFixed(2) }}</h3>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Chained computed properties**: Computed properties can depend on other computed properties (`grandTotal` relies on `subtotal`, `taxAmount`, and `shippingFee`).
> 2. **Automatic dependency tracking**: Modifying `cartItems` or `userState` automatically invalidates affected cached properties down the tree.
> 3. **Pure mathematical evaluation**: Getters perform pure calculations without mutating external state.
> 4. **Optimal caching**: Template re-renders do not recalculate grand totals unless item prices or states change.
> 
---

### Exercise 2: Industrial IoT Telemetry Sensor Moving Average Filter

**Scenario:** An IoT sensor dashboard calculates a 3-sample moving average from a stream of telemetry readings to smooth out voltage spikes.
**Requirements:**
1. Track `readings` array ref.
2. Compute `movingAverage` of the last 3 telemetry entries.
3. Compute `isVoltageSpike` boolean (true if latest reading > 20% above moving average).
4. Validate spike detection assertion.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, computed } from 'vue'
> 
> const readings = ref([115, 118, 120]) // Voltage samples
> 
> const movingAverage = computed(() => {
>   const recent = readings.value.slice(-3)
>   if (recent.length === 0) return 0
>   const sum = recent.reduce((a, b) => a + b, 0)
>   return sum / recent.length
> })
> 
> const isVoltageSpike = computed(() => {
>   if (readings.value.length === 0) return false
>   const latest = readings.value[readings.value.length - 1]
>   return latest > movingAverage.value * 1.2
> })
> 
> // Test assertion
> console.assert(movingAverage.value === 117.66666666666667, 'Moving average should calculate correctly')
> console.assert(isVoltageSpike.value === false, '120V is not a spike')
> readings.value.push(160) // Inject voltage spike sample
> console.assert(isVoltageSpike.value === true, '160V should trigger voltage spike flag')
> </script>
> 
> <template>
>   <div>
>     <p>3-Sample Voltage Average: {{ movingAverage.toFixed(1) }}V</p>
>     <p v-if="isVoltageSpike" class="alert">WARNING: Voltage spike detected!</p>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Array slice derivative**: `.slice(-3)` extracts target array sub-ranges reactively inside computed getters.
> 2. **Spike detection caching**: `isVoltageSpike` re-evaluates automatically whenever `readings.value.push()` alters array length.
> 3. **Fine-grained DOM updates**: Only elements bound to `isVoltageSpike` update when readings append.
> 4. **No manual watchers**: Computed getters eliminate manual watcher synchronization code.
> 
---

### Exercise 3: Financial Currency FX Spread Calculator

**Scenario:** A trading engine calculates bi-directional bid/ask currency conversion amounts using a writable computed property.
**Requirements:**
1. Track `baseUsd` ref.
2. Implement writable computed `eurAmount` with `get` and `set` handlers (exchange rate 0.92 EUR per USD).
3. Mutate `eurAmount.value` and verify that `baseUsd.value` updates accordingly via assertion.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, computed } from 'vue'
> 
> const baseUsd = ref(100)
> const exchangeRate = 0.92 // 1 USD = 0.92 EUR
> 
> const eurAmount = computed({
>   get: () => Number((baseUsd.value * exchangeRate).toFixed(2)),
>   set: (val) => {
>     baseUsd.value = Number((val / exchangeRate).toFixed(2))
>   }
> })
> 
> // Assertions
> console.assert(eurAmount.value === 92, `Expected 92 EUR, got ${eurAmount.value}`)
> eurAmount.value = 184 // Setting EUR updates USD
> console.assert(baseUsd.value === 200, `Expected 200 USD, got ${baseUsd.value}`)
> </script>
> 
> <template>
>   <div>
>     <label>USD: <input v-model.number="baseUsd" type="number" /></label>
>     <label>EUR: <input v-model.number="eurAmount" type="number" /></label>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Writable computed properties**: Passing an object with `get` and `set` functions creates a bi-directional computed property.
> 2. **Bi-directional model binding**: `v-model="eurAmount"` seamlessly triggers the computed `set` handler on user input.
> 3. **Source of truth stability**: `baseUsd` remains the single underlying source of truth.
> 4. **Type coercion safety**: Numerical conversions maintain precise string-to-number type handling.
> 
---

## 6. Related Terms

- [`ref`](ref.md) — The reactive variable primitive evaluated inside computed properties.
- [Watchers](watchers.md) — The reactivity tool used for asynchronous side effects (which computed getters forbid).
- [`watchEffect`](watch_effect.md) — Automatic reactivity watcher for side effects.
- [Reactive State](reactive_state.md) — The fundamental reactivity system powering computed getters.

---

## 7. Key Takeaways

- **Computed Properties** are used for derived state calculations that automatically cache results until dependencies mutate.
- Computed getters MUST be **pure functions**—never mutate state or perform async network requests inside them.
- Standard `computed(() => ...)` properties return read-only refs; use `{ get, set }` objects to create writable computed properties.
- Always prefer `computed()` over standard methods inside templates to prevent wasteful re-evaluations during re-render cycles.
