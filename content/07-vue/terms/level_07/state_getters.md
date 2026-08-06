# State & Getters (Pinia)

> **Level 7 — State Management & Pinia**
> The two fundamental data pillars of a Pinia store: **State** holds raw reactive data, while **Getters** hold memoized derived data calculated from State.

---

## 1. Prerequisites

- [Store (Pinia)](store.md) — The modular container where State and Getters are defined.
- [Computed Properties](../level_02/computed_properties.md) — The reactivity mechanism that powers Pinia Getters under the hood.

---

## 2. Term Category

**Vue Ecosystem Construct (Pinia Data Definition & Caching Layer)**: State and Getters constitute the reactive data layer of a Pinia store. State represents the single source of truth for raw domain values, while Getters represent computed, read-only slices of derived state.

Operating universally across browser rendering engines and SSR environments, State and Getters leverage Vue's ES6 Proxy reactivity. When reactive state properties mutate, dependent Getters evaluate once lazily upon access and cache their results. Subsequent component reads retrieve the cached evaluation instantly without re-executing derivation logic until underlying state dependencies mutate again.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In complex applications, components rarely consume raw state in isolation. An order management screen needs to render calculated subtotals, tax estimates, filtered pending items, and customer status badges. If every component duplicates this calculation math in local methods, performance degrades and business rules diverge across views.

By pairing raw **State** with memoized **Getters** directly inside the store, Pinia centralizes domain logic. Getters behave identically to component `computed()` properties: they track dependencies automatically, cache calculation outputs, and update reactively across all listening components when underlying state variables change. This design prevents duplicate computations and ensures UI components consume a consistent, unified representation of domain state.

### (2) Reality Metaphor
Think of **State** as a raw SQL database table containing raw transaction rows (date, item, amount). 

**Getters** are indexed SQL Views or Materialized Views created on top of that database table. Instead of querying and summing 100,000 raw transaction rows inside every mobile app endpoint or web dashboard view, the database calculates `monthly_total_revenue` in the Materialized View once. When a user requests the total, the system instantly hands over the pre-calculated cached number. If a new transaction row is inserted into raw State, the Materialized View updates automatically.

### (3) Vue Code Examples

#### Short Snippet
```vue
<script setup>
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useStore = defineStore('numbers', () => {
  // STATE: Raw reactive data
  const list = ref([10, 20, 30])

  // GETTER: Derived memoized computation
  const sum = computed(() => list.value.reduce((a, b) => a + b, 0))

  return { list, sum }
})
</script>
```

#### Fuller Example
```vue
<script setup>
import { defineStore, storeToRefs } from 'pinia'
import { ref, computed } from 'vue'

// Setup Store defining State and Getters
export const useInventoryStore = defineStore('inventory', () => {
  // STATE
  const products = ref([
    { id: 1, name: 'Laptop', price: 1200, inStock: true, category: 'tech' },
    { id: 2, name: 'Desk Chair', price: 250, inStock: false, category: 'furniture' },
    { id: 3, name: 'Monitor', price: 400, inStock: true, category: 'tech' }
  ])
  const activeCategory = ref('tech')

  // GETTER 1: Filtered product list based on activeCategory state
  const filteredProducts = computed(() => {
    return products.value.filter(p => p.category === activeCategory.value)
  })

  // GETTER 2: Dependent on GETTER 1 (Total value of in-stock filtered products)
  const categoryTotalValue = computed(() => {
    return filteredProducts.value
      .filter(p => p.inStock)
      .reduce((sum, p) => sum + p.price, 0)
  })

  function setCategory(cat) {
    activeCategory.value = cat
  }

  return { products, activeCategory, filteredProducts, categoryTotalValue, setCategory }
})

// Component Consumption
const store = useInventoryStore()
const { activeCategory, filteredProducts, categoryTotalValue } = storeToRefs(store)
</script>

<template>
  <div class="inventory">
    <div class="filter-bar">
      <button @click="store.setCategory('tech')">Tech</button>
      <button @click="store.setCategory('furniture')">Furniture</button>
    </div>

    <h3>Category: {{ activeCategory.toUpperCase() }}</h3>
    <p>Total Stock Value: ${{ categoryTotalValue }}</p>

    <ul>
      <li v-for="item in filteredProducts" :key="item.id">
        {{ item.name }} - ${{ item.price }} ({{ item.inStock ? 'In Stock' : 'Out of Stock' }})
      </li>
    </ul>
  </div>
</template>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Mutating State directly inside a Getter function
**The mistake:** Performing mutating operations like array `.sort()`, `.splice()`, or assigning properties inside a getter definition.

**Why it's wrong:** Getters must be pure functions. Array mutators like `Array.prototype.sort()` mutate the target array in place. Sorting state inside a getter triggers dependency updates, causing an infinite update loop and crashing the browser tab. Always create a shallow copy before sorting (`[...state.items].sort()`).

*Incorrect:*
```javascript
const sortedItems = computed(() => {
  return items.value.sort((a, b) => a.price - b.price) // ❌ Mutates raw state array!
})
```

*Fix:*
```javascript
const sortedItems = computed(() => {
  return [...items.value].sort((a, b) => a.price - b.price) // Copy array before sorting
})
```

---

### Mistake 2: Expecting Function-Returning Getters to Cache Results
**The mistake:** Writing a getter that returns a lookup function `getById: (state) => (id) => state.items.find(i => i.id === id)` and assuming its output is memoized across invocations.

**Why it's wrong:** Getters that return a function are **not cached**! The getter caches the returned inner function reference, but invoking `getById(5)` executes the inner search loop fresh every single time. For high-frequency rendering, create a computed dictionary or map instead.

*Incorrect:*
```javascript
// Function-returning getter runs loop on every render call
const getById = computed(() => (id) => items.value.find(i => i.id === id))
```

*Fix:*
```javascript
// Map-based getter caches O(1) lookup dictionary
const itemMap = computed(() => {
  return items.value.reduce((map, item) => {
    map[item.id] = item
    return map
  }, {})
})
```

---

### Mistake 3: Accessing `this` inside Arrow Function Options Getters
**The mistake:** Writing `doubleCount: (state) => this.count * 2` inside an Options Store getters configuration block.

**Why it's wrong:** Arrow functions capture outer lexical scope `this` (`undefined`). In Options stores, arrow getters receive `state` as the first argument, but `this` is not bound to the store instance.

*Incorrect:*
```javascript
getters: {
  doubleCount: (state) => this.count * 2 // ❌ 'this' is undefined!
}
```

*Fix:*
```javascript
getters: {
  doubleCount: (state) => state.count * 2, // Use explicit state parameter
  tripleCount() { return this.count * 3 } // Standard function binds 'this'
}
```

---

## 5. Practice Exercises

### Exercise 1: Financial Portfolio Risk Exposure Getters
**Scenario:** A stock trading application requires a Pinia store tracking asset positions. The store must maintain raw position state and calculate portfolio metrics like total market value, un-hedged risk exposure percentage, and top-performing ticker.

**Requirements:**
1. Define state `positions` array of `{ ticker, shares, purchasePrice, currentPrice, sector }`.
2. Provide getter `totalPortfolioValue` summing current market value of all positions.
3. Provide getter `techSectorExposurePercent` computing percentage of portfolio held in `'Technology'` sector.
4. Ensure all calculations remain pure without mutating raw positions array.

> [!check]- Answer
>
> #### Implementation
> ```javascript
> import { defineStore } from 'pinia'
> import { ref, computed } from 'vue'
> 
> export const usePortfolioStore = defineStore('portfolioMetrics', () => {
>   const positions = ref([
>     { ticker: 'AAPL', shares: 50, purchasePrice: 150, currentPrice: 180, sector: 'Technology' },
>     { ticker: 'JNJ', shares: 100, purchasePrice: 160, currentPrice: 155, sector: 'Healthcare' },
>     { ticker: 'NVDA', shares: 20, purchasePrice: 400, currentPrice: 700, sector: 'Technology' }
>   ])
> 
>   const totalPortfolioValue = computed(() => {
>     return positions.value.reduce((total, pos) => total + (pos.shares * pos.currentPrice), 0)
>   })
> 
>   const techSectorExposurePercent = computed(() => {
>     if (totalPortfolioValue.value === 0) return 0
>     const techValue = positions.value
>       .filter(pos => pos.sector === 'Technology')
>       .reduce((total, pos) => total + (pos.shares * pos.currentPrice), 0)
>     return Number(((techValue / totalPortfolioValue.value) * 100).toFixed(2))
>   })
> 
>   return { positions, totalPortfolioValue, techSectorExposurePercent }
> })
> ```
>
> #### Technical Explanation
> 1. **State Independence**: `positions` holds primitive numbers and strings as single source of truth.
> 2. **Getter Chain Dependencies**: `techSectorExposurePercent` depends directly on `totalPortfolioValue` computed getter, demonstrating getter composition.
> 3. **Pure Function Calculations**: Array `.reduce()` and `.filter()` operations create new primitive values without mutating array order or element properties.
> 4. **Memoization Benefit**: Component re-renders do not recalculate exposure percentages unless position prices or share counts update.
> 
---

### Exercise 2: Healthcare Patient Vitals Alert System
**Scenario:** A hospital intensive care unit monitor requires a Pinia store tracking patient vital signs and triggering prioritized alert getters for nursing staff.

**Requirements:**
1. Maintain state `patients` array holding `{ id, room, heartRate, oxygenSat, status }`.
2. Create getter `criticalPatients` returning patients with `heartRate > 120` or `oxygenSat < 90`.
3. Create getter `criticalCount` returning length of critical patients list.
4. Provide action `updateVitals(patientId, newVitals)` to mutate patient readings.

> [!check]- Answer
>
> #### Implementation
> ```javascript
> import { defineStore } from 'pinia'
> import { ref, computed } from 'vue'
> 
> export const useIcuStore = defineStore('icu', () => {
>   const patients = ref([
>     { id: 'P-101', room: '304-A', heartRate: 75, oxygenSat: 98, status: 'stable' },
>     { id: 'P-102', room: '305-B', heartRate: 135, oxygenSat: 88, status: 'warning' }
>   ])
> 
>   const criticalPatients = computed(() => {
>     return patients.value.filter(p => p.heartRate > 120 || p.oxygenSat < 90)
>   })
> 
>   const criticalCount = computed(() => criticalPatients.value.length)
> 
>   function updateVitals(patientId, vitals) {
>     const patient = patients.value.find(p => p.id === patientId)
>     if (patient) {
>       Object.assign(patient, vitals)
>     }
>   }
> 
>   return { patients, criticalPatients, criticalCount, updateVitals }
> })
> ```
>
> #### Technical Explanation
> 1. **Reactive Array Filtering**: `criticalPatients` filters reactive patient proxy objects, auto-updating when vitals mutate.
> 2. **Derived Count Getter**: `criticalCount` reads `criticalPatients.value`, ensuring reactive propagation across badge indicators.
> 3. **In-Place Proxy Updates**: `Object.assign(patient, vitals)` mutates reactive proxy properties directly inside action handler.
> 4. **Zero Rendering Overhead**: Dashboard tables rendering non-critical patients do not execute filtering loops unnecessarily.
> 
---

### Exercise 3: Network Data Pipeline Throughput Metrics
**Scenario:** A cloud networking monitoring tool needs a store tracking network interface packet counters and deriving bandwidth utilization metrics.

**Requirements:**
1. State `interfaces` object indexed by interface name `{ eth0: { rxBytes, txBytes, speedMbps } }`.
2. Getter `totalBandwidthUsageMbps` calculating combined throughput across all interfaces.
3. Getter `saturatedInterfaces` returning array of interface names operating above 80% capacity.
4. Action `recordPacketDelta(iface, rxDelta, txDelta)` updating byte totals.

> [!check]- Answer
>
> #### Implementation
> ```javascript
> import { defineStore } from 'pinia'
> import { ref, computed } from 'vue'
> 
> export const useNetworkStore = defineStore('network', () => {
>   const interfaces = ref({
>     eth0: { rxMbps: 450, txMbps: 350, capacityMbps: 1000 },
>     eth1: { rxMbps: 890, txMbps: 50, capacityMbps: 1000 }
>   })
> 
>   const totalBandwidthUsageMbps = computed(() => {
>     return Object.values(interfaces.value).reduce((sum, iface) => {
>       return sum + iface.rxMbps + iface.txMbps
>     }, 0)
>   })
> 
>   const saturatedInterfaces = computed(() => {
>     return Object.entries(interfaces.value)
>       .filter(([_, iface]) => {
>         const load = (iface.rxMbps + iface.txMbps) / iface.capacityMbps
>         return load >= 0.8
>       })
>       .map(([name]) => name)
>   })
> 
>   function recordMetrics(ifaceName, rxMbps, txMbps) {
>     if (interfaces.value[ifaceName]) {
>       interfaces.value[ifaceName].rxMbps = rxMbps
>       interfaces.value[ifaceName].txMbps = txMbps
>     }
>   }
> 
>   return { interfaces, totalBandwidthUsageMbps, saturatedInterfaces, recordMetrics }
> })
> ```
>
> #### Technical Explanation
> 1. **Object State Iteration**: `Object.values` and `Object.entries` allow computed getters to process dynamic key-value store objects.
> 2. **Threshold Aggregation**: `saturatedInterfaces` returns filtered string array of high-load interface keys for alert components.
> 3. **Direct Dictionary Assignment**: Mutating `rxMbps` on targeted interface key updates dependent bandwidth calculations automatically.
> 4. **Selective Component Re-rendering**: Components subscribing only to `saturatedInterfaces` ignore metric updates on unsaturated links.
> 
---

## 6. Related Terms

- [Store (Pinia)](store.md) — The Pinia container where State and Getters are defined.
- [Computed Properties](../level_02/computed_properties.md) — The underlying Vue Composition API primitive powering Getters.
- [Actions (Pinia)](actions.md) — The imperative store functions used to mutate State.
- [Pinia](pinia.md) — The parent state management library.
- [`ref`](../level_02/ref.md) — The primary reactivity wrapper used to define State variables in setup stores.

---

## 7. Key Takeaways

- **State** is the raw, single source of reactive truth in a Pinia store created via `ref()` or `reactive()`.
- **Getters** are derived values calculated from state created using `computed()`.
- Getters are memoized: they evaluate lazily and cache results until underlying state dependencies mutate.
- Getters must be pure functions; never perform state mutations (`.sort()` in-place) inside a getter.
- Getters returning parameterized lookup functions are NOT cached; use map/dictionary getters for high-performance lookups.
