# Actions (Pinia)

> **Level 7 — State Management & Pinia**
> Functions defined inside a Pinia Store that contain business logic to mutate state or perform asynchronous operations.

---

## 1. Prerequisites

- [State & Getters (Pinia)](state_getters.md) — The data structures that Actions read, write, and manipulate.
- [Store (Pinia)](store.md) — The Pinia container where Actions are encapsulated.

---

## 2. Term Category

**Vue Ecosystem Construct (Pinia State Mutation & Business Logic Unit)**: Pinia actions are member functions inside a store responsible for updating reactive state and handling side effects such as HTTP fetch calls, browser storage synchronization, and complex workflow orchestration. Executed in both client-side browser contexts and server-side rendering (SSR) environments, actions represent the primary imperative interface for interacting with centralized application domain state.

Unlike legacy state management libraries (such as Vuex or Redux) that forced a strict architectural separation between synchronous state mutations and asynchronous action dispatches, Pinia unifies all business operations into standard JavaScript methods. Actions can be synchronous or `async`, directly mutate reactive store `ref` values, invoke other store actions, and return Promises that component callers can comfortably await.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In legacy Vue 2 applications using Vuex, modifying global state required a verbose two-step ritual: dispatching an asynchronous "Action", which in turn committed a synchronous "Mutation" to touch the state object. Developers were forced to maintain string constants, track boilerplate mutation files, and contend with fragile string-based `store.dispatch('actionName')` invocations that lacked IDE type auto-completion and static analysis.

When designing Pinia alongside Vue 3's Composition API, the core team eliminated mutations entirely. In a Pinia setup store, actions are simply plain JavaScript functions returned from the `defineStore()` closure. You write `async function login()` just as you would inside a composable or a component `<script setup>`, directly mutating `user.value` inside the function. This design drastically reduces framework ceremony, preserves TypeScript type inference automatically, and aligns global state mutations with standard JavaScript execution semantics.

### (2) Reality Metaphor
Think of a Pinia Store as an automated bank vault and an **Action** as a Bank Teller transaction protocol. A customer (the Vue component UI) should not enter the vault directly to grab cash or modify ledgers. Instead, the customer submits a request to the Teller (the Action), such as `withdrawCash(amount)`. 

The Teller verifies identity, checks account balance thresholds, calls out to fraud verification web services (asynchronous operations), logs the event, updates the central ledger balances (mutating reactive state), and handovers the cash. The customer component remains entirely clean and decoupled, unaware of internal vault procedures beyond requesting the transaction.

### (3) Vue Code Examples

#### Short Snippet
```vue
<script setup>
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  
  // A synchronous Pinia action
  function incrementBy(amount) {
    count.value += amount
  }

  return { count, incrementBy }
})
</script>
```

#### Fuller Example
```vue
<script setup>
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Pinia Setup Store defining state and async action
export const useUserProfileStore = defineStore('userProfile', () => {
  const profile = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  const isAuthenticated = computed(() => profile.value !== null)

  // Asynchronous action encapsulating API fetch, error handling, and state updates
  async function fetchProfile(userId) {
    isLoading.value = true
    error.value = null
    try {
      const response = await fetch(`/api/users/${userId}`)
      if (!response.ok) throw new Error('Failed to load profile')
      const data = await response.json()
      profile.value = data
    } catch (err) {
      error.value = err.message
    } finally {
      isLoading.value = false
    }
  }

  return { profile, isLoading, error, isAuthenticated, fetchProfile }
})
</script>

<template>
  <div class="user-card">
    <button @click="fetchProfile(42)" :disabled="isLoading">
      {{ isLoading ? 'Loading...' : 'Load Profile' }}
    </button>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-else-if="profile">User: {{ profile.name }} ({{ profile.email }})</p>
  </div>
</template>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Component Business Logic Leakage
**The mistake:** Writing complex API fetching, retry loops, and JSON transformation logic directly inside a component event handler, and manually assigning raw response data to store state variables (`userStore.profile = data`).

**Why it's wrong:** Bleeding domain business logic into UI components creates code duplication across screens and prevents reusing workflow operations. Components become untestable because UI rendering is coupled with network request handling.

*Incorrect:*
```vue
<script setup>
import { useUserStore } from './userStore'
const userStore = useUserStore()

async function handleSave() {
  const res = await fetch('/api/user', { method: 'POST', body: JSON.stringify(...) })
  const json = await res.json()
  userStore.user = json.user // ❌ Direct state mutation from component UI logic!
}
</script>
```

*Fix:*
```vue
<script setup>
import { useUserStore } from './userStore'
const userStore = useUserStore()

async function handleSave() {
  // Delegate business workflow and state modification directly to store action
  await userStore.updateUserProfile(...) 
}
</script>
```

---

### Mistake 2: Arrow Function Binding in Options Store Actions
**The mistake:** Defining an action using an ES6 arrow function inside a Pinia Options Store configuration object.

**Why it's wrong:** Arrow functions capture the outer lexical scope's `this` context (which is `undefined` or `window`). Inside an arrow function action, `this` will not point to the Pinia store instance, causing runtime `TypeError: Cannot read properties of undefined` when attempting to access store properties.

*Incorrect:*
```javascript
export const useCartStore = defineStore('cart', {
  state: () => ({ items: [] }),
  actions: {
    clearCart: () => {
      this.items = [] // ❌ 'this' is undefined in ES6 arrow functions!
    }
  }
})
```

*Fix:*
```javascript
export const useCartStore = defineStore('cart', {
  state: () => ({ items: [] }),
  actions: {
    clearCart() {
      this.items = [] // Standard ES6 method syntax correctly binds 'this' to store
    }
  }
})
```

---

### Mistake 3: Un-Awaited Async Action Invocations
**The mistake:** Triggering an asynchronous Pinia store action inside a component function without awaiting its returned Promise before proceeding with dependent operations.

**Why it's wrong:** Asynchronous actions run concurrently. Proceeding immediately without awaiting completion causes downstream logic to read stale or null store state before the network request finishes.

*Incorrect:*
```javascript
function checkout() {
  cartStore.processPayment() // ❌ Promise returned by async action ignored!
  router.push('/order-confirmation') // Navigates before payment completes!
}
```

*Fix:*
```javascript
async function checkout() {
  await cartStore.processPayment() // Await action completion before navigation
  router.push('/order-confirmation')
}
```

---

## 5. Practice Exercises

### Exercise 1: E-Commerce Shopping Cart Checkout Action
**Scenario:** An online retail platform requires a Pinia store action to process checkout. The action must validate item availability, call a payment API, clear cart items on success, and record error messages on failure.

**Requirements:**
1. Maintain reactive state for `items`, `isProcessing`, and `checkoutError`.
2. Implement an `async function processCheckout()` action.
3. Validate that `items` array is non-empty before initiating API calls.
4. Set loading states and handle network errors cleanly with `try/catch/finally`.

> [!check]- Answer
>
> #### Implementation
> ```javascript
> import { defineStore } from 'pinia'
> import { ref } from 'vue'
> 
> export const useCheckoutStore = defineStore('checkout', () => {
>   const items = ref([{ id: 101, title: 'Mechanical Keyboard', price: 149.99 }])
>   const isProcessing = ref(false)
>   const checkoutError = ref(null)
> 
>   async function processCheckout(paymentDetails) {
>     if (items.value.length === 0) {
>       checkoutError.value = 'Cart is empty'
>       return false
>     }
> 
>     isProcessing.value = true
>     checkoutError.value = null
> 
>     try {
>       // Simulated API request payload
>       const response = await fetch('/api/checkout', {
>         method: 'POST',
>         headers: { 'Content-Type': 'application/json' },
>         body: JSON.stringify({ items: items.value, paymentDetails })
>       })
> 
>       if (!response.ok) throw new Error('Payment processing failed')
> 
>       // Clear cart on successful transaction
>       items.value = []
>       return true
>     } catch (err) {
>       checkoutError.value = err.message
>       return false
>     } finally {
>       isProcessing.value = false
>     }
>   }
> 
>   return { items, isProcessing, checkoutError, processCheckout }
> })
> 
> // Technical Test Assertion
> // const store = useCheckoutStore()
> // await store.processCheckout({ cardToken: 'tok_123' })
> ```
>
> #### Technical Explanation
> 1. **State Encapsulation**: Cart `items` and flags (`isProcessing`, `checkoutError`) are declared as `ref()` primitives inside setup store closure.
> 2. **Action Orchestration**: `processCheckout` encapsulates pre-validation, HTTP execution, conditional state resetting, and error capturing.
> 3. **Error Boundaries**: `try/catch/finally` blocks ensure `isProcessing` flag resets reliably even during unexpected runtime exceptions.
> 4. **Return Promises**: Returning explicit boolean indicators allows component callers to trigger UI redirects conditionally.
> 
---

### Exercise 2: IoT Sensor Calibration Action
**Scenario:** An industrial automation dashboard connects to remote telemetry sensors. The telemetry store needs an action to send calibration commands to a target sensor and update local sensor status state.

**Requirements:**
1. Define a `sensors` state array holding sensor objects `{ id, name, status, offset }`.
2. Implement a `calibrateSensor(sensorId, targetOffset)` action.
3. Update targeted sensor's `status` to `'calibrating'` before network dispatch.
4. Mutate targeted sensor's `offset` and update status to `'active'` upon successful response.

> [!check]- Answer
>
> #### Implementation
> ```javascript
> import { defineStore } from 'pinia'
> import { ref } from 'vue'
> 
> export const useTelemetryStore = defineStore('telemetry', () => {
>   const sensors = ref([
>     { id: 'SN-01', name: 'Pressure Valve A', status: 'idle', offset: 0.0 }
>   ])
> 
>   async function calibrateSensor(sensorId, targetOffset) {
>     const sensor = sensors.value.find(s => s.id === sensorId)
>     if (!sensor) throw new Error(`Sensor ${sensorId} not found`)
> 
>     // Pre-mutation flag update
>     sensor.status = 'calibrating'
> 
>     try {
>       // Simulated network calibration payload
>       const res = await fetch(`/api/telemetry/${sensorId}/calibrate`, {
>         method: 'PATCH',
>         headers: { 'Content-Type': 'application/json' },
>         body: JSON.stringify({ offset: targetOffset })
>       })
>       if (!res.ok) throw new Error('Calibration failed')
> 
>       // Direct proxy mutation inside action
>       sensor.offset = targetOffset
>       sensor.status = 'active'
>     } catch (err) {
>       sensor.status = 'error'
>       throw err
>     }
>   }
> 
>   return { sensors, calibrateSensor }
> })
> ```
>
> #### Technical Explanation
> 1. **Granular Array Mutation**: Action searches the reactive `sensors` array and directly mutates properties on the matched target proxy object.
> 2. **State Machine Transitions**: Telemetry status moves predictably through discrete states (`'idle'` -> `'calibrating'` -> `'active'` / `'error'`).
> 3. **Proxy Reactivity Invalidation**: Vue's Proxy reactivity system tracks property modifications on nested array objects automatically without requiring array re-creation.
> 4. **Exception Propagation**: Re-throwing errors allows UI components to display contextual toast alerts while store records error states.
> 
---

### Exercise 3: Financial Portfolio Order Execution Action
**Scenario:** A high-frequency trading platform requires a store action to execute stock purchase orders, deduct funds from available cash balance, and log order history atomically.

**Requirements:**
1. Maintain state for `cashBalance` (number) and `orderHistory` (array).
2. Create an `executeOrder(symbol, quantity, pricePerShare)` action.
3. Validate available `cashBalance` before placing purchase orders.
4. Deduct total cost from `cashBalance` and prepend transaction details to `orderHistory`.

> [!check]- Answer
>
> #### Implementation
> ```javascript
> import { defineStore } from 'pinia'
> import { ref } from 'vue'
> 
> export const usePortfolioStore = defineStore('portfolio', () => {
>   const cashBalance = ref(50000.00)
>   const orderHistory = ref([])
> 
>   function executeOrder(symbol, quantity, pricePerShare) {
>     const totalCost = quantity * pricePerShare
>     
>     if (totalCost > cashBalance.value) {
>       throw new Error(`Insufficient funds: Required $${totalCost.toFixed(2)}, Available $${cashBalance.value.toFixed(2)}`)
>     }
> 
>     // Atomic balance deduction and history logging
>     cashBalance.value -= totalCost
>     
>     const orderRecord = {
>       id: `ORD-${Date.now()}`,
>       symbol,
>       quantity,
>       pricePerShare,
>       totalCost,
>       executedAt: new Date().toISOString()
>     }
>     
>     orderHistory.value.unshift(orderRecord)
>     return orderRecord
>   }
> 
>   return { cashBalance, orderHistory, executeOrder }
> })
> ```
>
> #### Technical Explanation
> 1. **Synchronous Atomic State Mutex**: Cash deduction and array unshift occur in the same synchronous execution block, eliminating state race conditions.
> 2. **Financial Precision Validation**: Pre-execution checks guarantee balance never drops below zero prior to state mutation.
> 3. **Reactive Array Mutators**: Standard array mutators like `unshift()` trigger subscriber updates seamlessly across watching components.
> 4. **Record Immutability**: Order objects appended to state serve as historical audit logs for component table rendering.
> 
---

## 6. Related Terms

- [Store (Pinia)](store.md) — The Pinia container where actions and state are encapsulated.
- [State & Getters (Pinia)](state_getters.md) — The reactive data structures modified and derived by Pinia actions.
- [Pinia](pinia.md) — Vue 3's official modular state management library.
- [Composables](../level_05/composables.md) — Reusable stateful logic functions that follow identical Composition API conventions.
- [Options API](../level_01/options_api.md) — Legacy Vue syntax structure that previously separated mutations and actions in Vuex.

---

## 7. Key Takeaways

- Pinia actions are standard JavaScript functions that handle business logic, asynchronous calls, and state mutations inside a store.
- Pinia eliminates legacy Vuex "Mutations"; actions can directly mutate store reactive state variables (`ref` / `reactive`).
- Keeping business operations in actions keeps UI components "dumb", reusable, and clean.
- In Setup Stores (`defineStore('id', () => { ... })`), actions are standard functions returned in the store definition object.
- Always `await` asynchronous store action calls inside component methods to prevent race conditions against unpopulated state.
