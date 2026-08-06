# `reactive`

> **Level 2 — Reactivity System**
> A Composition API function that creates a deeply reactive JavaScript Proxy wrapper around objects and collections, allowing direct property mutations without `.value`.

---

## 1. Prerequisites

- [`ref`](ref.md) — The fundamental reactive reference primitive, which `reactive()` acts as a specialized alternative to.
- [Proxy Reactivity](../level_08/proxy_reactivity.md) — The underlying ES6 Proxy API that powers `reactive()`.

---

## 2. Term Category

**Vue Reactivity API / Proxy Wrapper (Deep Object Reactivity)**: `reactive()` is Vue 3's core function for creating deeply reactive state proxies from JavaScript Objects, Arrays, Maps, and Sets. When an object is passed to `reactive()`, Vue wraps it in an ES6 `Proxy` object that intercepts property getter and setter operations.

Unlike `ref()`, which wraps primitives in an object container accessible via `.value`, `reactive()` proxies the object properties directly in-place. Operable across client-side components and server-side setup scripts, it provides deep reactivity, meaning nested objects are automatically wrapped in proxies upon access.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When managing complex nested data structures (e.g. form state with 20 input fields, or deeply nested API response objects), wrapping individual values in `ref()` can lead to verbose syntax:

```javascript
const form = ref({
  user: {
    profile: {
      name: 'Alice',
      address: { city: 'Paris' }
    }
  }
})
// Accessing nested fields requires .value at the root pointer:
form.value.user.profile.address.city = 'London'
```

To provide a cleaner developer experience for object structures, Vue introduced **`reactive()`**. By returning a JavaScript Proxy around the target object, properties can be read and mutated directly (`form.user.profile.address.city = 'London'`), completely eliminating `.value` references.

However, `reactive()` comes with notable architectural trade-offs:
1. **Objects Only**: It cannot proxy primitive values (`string`, `number`, `boolean`, `null`, `undefined`). Calling `reactive(0)` fails or issues runtime warnings.
2. **Reassignment Loss**: Reassigning a `reactive()` object variable (`state = reactive({ count: 5 })`) replaces the Proxy instance with a plain object reference, breaking reactivity completely.
3. **Destructuring Loss**: Destructuring primitive properties from a `reactive()` object (`const { count } = state`) extracts raw primitive copies, severing reactivity unless wrapped with `toRefs()`.

Because of these pitfalls, modern Vue architectural standards (and Vue documentation guidance) often recommend using **`ref()` for all state** by default to maintain consistent code syntax across teams.

### (2) Reality Metaphor
Think of a Smart Touchscreen Tablet (Proxy via `reactive()`) versus a Locked Document Box with a Keyhole Container (`ref()`).

With a Locked Document Box (`ref()`), the box itself is a physical container. To read or swap the paper inside, you must explicitly unlock the box door marked `.value` every single time (`box.value = newPaper`).

With a Smart Touchscreen Tablet (`reactive()`), the surface *is* the interface. Tapping directly on text, dragging sliders, or updating numbers alters the digital display instantly without opening any outer container box. However, if you drop the tablet into water (reassign the object variable entirely), the electronic screen dies (reactivity is destroyed).

### (3) Vue Code Examples

#### Short Snippet
```vue
<script setup>
import { reactive } from 'vue'

// Create a reactive proxy object
const user = reactive({
  name: 'Alice',
  age: 30
})

function celebrateBirthday() {
  // Direct mutation without .value!
  user.age++
}
</script>

<template>
  <button @click="celebrateBirthday">{{ user.name }} is {{ user.age }} years old</button>
</template>
```

#### Fuller Example
```vue
<script setup>
import { reactive, computed } from 'vue'

// Reactive state object encapsulating complex form state
const formState = reactive({
  credentials: {
    username: '',
    email: ''
  },
  preferences: {
    newsletter: true,
    theme: 'dark'
  },
  errors: []
})

const isValid = computed(() => {
  return formState.credentials.username.length >= 3 && formState.credentials.email.includes('@')
})

function updateUsername(name) {
  formState.credentials.username = name
}

function resetForm() {
  // Safe resetting by mutating properties on the existing proxy
  formState.credentials.username = ''
  formState.credentials.email = ''
  formState.preferences.newsletter = true
  formState.errors = []
}
</script>

<template>
  <div class="form-container">
    <h2>Account Registration</h2>
    <input v-model="formState.credentials.username" placeholder="Username" />
    <input v-model="formState.credentials.email" placeholder="Email" />
    
    <label>
      <input type="checkbox" v-model="formState.preferences.newsletter" /> Subscribe to Newsletter
    </label>

    <button :disabled="!isValid">Submit Registration</button>
    <button @click="resetForm">Reset Form</button>
  </div>
</template>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Destructuring Properties Directly Out of a `reactive()` Object

**The mistake:** Destructuring properties directly from a reactive object (`const { count, name } = state`).

**Why it's wrong:** Standard ES6 object destructuring extracts primitive value copies (strings, numbers) by value, severing the getter/setter binding to Vue's reactive proxy. Future mutations on `state.count` will not reflect on `count`.

*Incorrect:*
```javascript
const state = reactive({ count: 0, name: 'Bob' })
const { count } = state // ❌ Destructuring severs proxy reactivity!
```

*Fix:*
```javascript
import { reactive, toRefs } from 'vue'
const state = reactive({ count: 0, name: 'Bob' })
const { count } = toRefs(state) // Wraps properties in reactive Refs
```

---

### Mistake 2: Reassigning an Entire `reactive()` Object Variable

**The mistake:** Attempting to overwrite a `reactive` variable reference (`let state = reactive({ count: 0 }); state = { count: 5 }`).

**Why it's wrong:** Reassigning the variable replaces Vue's Proxy wrapper reference with a plain, untracked JavaScript object, permanently breaking component reactivity.

*Incorrect:*
```javascript
let state = reactive({ count: 0 })
state = { count: 5 } // ❌ Reassignment destroys Proxy reference!
```

*Fix:*
```javascript
const state = reactive({ count: 0 })
state.count = 5 // Mutate properties on existing proxy instance
// Or use Object.assign(state, { count: 5 })
```

---

### Mistake 3: Passing Primitive Values to `reactive()`

**The mistake:** Calling `const count = reactive(0)` or `const name = reactive('Alice')`.

**Why it's wrong:** ES6 Proxy wrappers require JavaScript Object reference types (`Object`, `Array`, `Map`, `Set`). Passing primitives returns the raw un-proxied primitive or issues console warnings.

*Incorrect:*
```javascript
const count = reactive(0) // ❌ Returns raw number 0, NOT a proxy!
```

*Fix:*
```javascript
const count = ref(0) // Use ref() for primitive values
```

---

## 5. Practice Exercises

### Exercise 1: E-Commerce Multi-Step Form State Manager

**Scenario:** An e-commerce checkout form manages shipping addresses and payment details within a deep `reactive()` state object.
**Requirements:**
1. Declare `reactive()` `checkout` state containing nested `shipping` and `payment` objects.
2. Implement `updateAddress(city, zip)` mutating properties on existing proxy.
3. Compute `isShippingValid` boolean.
4. Validate mutation and reactivity assertions.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { reactive, computed } from 'vue'
> 
> const checkout = reactive({
>   shipping: {
>     street: '123 Tech Way',
>     city: 'San Francisco',
>     zip: '94105'
>   },
>   payment: {
>     method: 'Credit Card',
>     cardNumber: '4111222233334444'
>   }
> })
> 
> const isShippingValid = computed(() => {
>   return checkout.shipping.city.length > 0 && checkout.shipping.zip.length === 5
> })
> 
> function updateAddress(city, zip) {
>   checkout.shipping.city = city
>   checkout.shipping.zip = zip
> }
> 
> // Assertions
> console.assert(isShippingValid.value === true, 'Shipping should be valid initially')
> updateAddress('Oakland', '94601')
> console.assert(checkout.shipping.city === 'Oakland', 'City should update on proxy')
> console.assert(isShippingValid.value === true, 'Shipping should stay valid')
> updateAddress('San Jose', '12') // Invalid zip length
> console.assert(isShippingValid.value === false, 'Shipping should be invalid with short zip')
> </script>
> 
> <template>
>   <div>
>     <p>Ship To: {{ checkout.shipping.city }}, {{ checkout.shipping.zip }}</p>
>     <span v-if="!isShippingValid">Invalid Zip Code</span>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Deep proxy wrapping**: `reactive()` recursively proxies `checkout.shipping` and `checkout.payment`.
> 2. **Direct property access**: Updating `checkout.shipping.city` triggers dependency notifications without `.value`.
> 3. **Proxy property mutation**: Mutating nested properties retains proxy identity safely.
> 4. **Computed derivation**: `isShippingValid` subscribes directly to nested proxy property reads.
> 
---

### Exercise 2: Industrial IoT Device Telemetry State Collection

**Scenario:** An industrial IoT gateway maintains device telemetry objects in a `reactive()` map structure.
**Requirements:**
1. Declare `reactive()` `deviceGateway` containing a `devices` object map.
2. Provide `registerDevice(id, status)` helper.
3. Compute `onlineDeviceCount`.
4. Validate map updates via test assertion.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { reactive, computed } from 'vue'
> 
> const deviceGateway = reactive({
>   devices: {
>     'DEV-101': { status: 'ONLINE', temp: 42 },
>     'DEV-102': { status: 'OFFLINE', temp: 0 }
>   }
> })
> 
> const onlineDeviceCount = computed(() => {
>   return Object.values(deviceGateway.devices).filter(d => d.status === 'ONLINE').length
> })
> 
> function setDeviceStatus(id, newStatus) {
>   if (deviceGateway.devices[id]) {
>     deviceGateway.devices[id].status = newStatus
>   }
> }
> 
> // Test assertion
> console.assert(onlineDeviceCount.value === 1, 'Initially 1 online device')
> setDeviceStatus('DEV-102', 'ONLINE')
> console.assert(onlineDeviceCount.value === 2, '2 online devices after status change')
> </script>
> 
> <template>
>   <div>
>     <h3>Online Devices: {{ onlineDeviceCount }}</h3>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Object property additions**: ES6 Proxy tracking detects property mutations and updates dynamically.
> 2. **No `.value` references**: Direct property assignments trigger reactive updates cleanly.
> 3. **Computed integration**: `onlineDeviceCount` re-evaluates automatically on status changes.
> 4. **Memory stability**: Property mutations preserve object references in memory.
> 
---

### Exercise 3: Financial Trading Account Order Ledger

**Scenario:** A stock trading ledger records active orders inside a `reactive()` object container.
**Requirements:**
1. Track `ledger` state with `orders` array inside `reactive()`.
2. Implement `addOrder(order)` pushing to `ledger.orders`.
3. Compute `totalVolume`.
4. Verify array push reactivity via test assertion.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { reactive, computed } from 'vue'
> 
> const ledger = reactive({
>   accountNumber: 'ACC-8821',
>   orders: [
>     { symbol: 'AAPL', amount: 100 },
>     { symbol: 'TSLA', amount: 50 }
>   ]
> })
> 
> const totalVolume = computed(() => {
>   return ledger.orders.reduce((sum, order) => sum + order.amount, 0)
> })
> 
> function addOrder(newOrder) {
>   ledger.orders.push(newOrder)
> }
> 
> // Verification test
> console.assert(totalVolume.value === 150, 'Initial volume should be 150')
> addOrder({ symbol: 'NVDA', amount: 200 })
> console.assert(totalVolume.value === 350, 'Volume should equal 350 after order push')
> </script>
> 
> <template>
>   <div>
>     <h2>Ledger Volume: {{ totalVolume }} shares</h2>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Array proxy interception**: Array mutation methods (`push`, `pop`, `splice`) are intercepted by Vue's proxy wrapper.
> 2. **Nested array reactivity**: Elements pushed into `ledger.orders` automatically become reactive.
> 3. **Clean template syntax**: Templates reference `ledger.orders` directly without `.value`.
> 4. **Store compatibility**: `reactive()` forms the underlying state foundation for Pinia stores.
> 
---

## 6. Related Terms

- [`ref`](ref.md) — The recommended state primitive for primitives and reassignable structures.
- [`toRefs` / `toRef`](to_refs.md) — The utility function required to safely destructure `reactive()` objects.
- [Proxy Reactivity](../level_08/proxy_reactivity.md) — The underlying ES6 Proxy feature powering `reactive()`.
- [`shallowRef` / `markRaw`](shallow_ref_mark_raw.md) — Escape hatches to opt-out of deep proxying for performance.

---

## 7. Key Takeaways

- **`reactive()`** creates a deeply reactive Proxy wrapper around Objects, Arrays, Maps, and Sets.
- Unlike `ref()`, properties on a `reactive()` object are read and mutated directly without using `.value`.
- It cannot proxy primitive values (`string`, `number`, `boolean`).
- Never destructure a `reactive()` object directly; use `toRefs()` to prevent losing reactivity connection.
- Never reassign a `reactive()` object variable completely; mutate properties on the existing proxy instance instead.
