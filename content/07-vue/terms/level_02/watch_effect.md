# `watchEffect`

> **Level 2 — Reactivity System**
> An automated reactivity watcher function that executes immediately upon creation and automatically re-runs whenever any reactive dependency accessed synchronously during execution mutates.

---

## 1. Prerequisites

- [`ref`](ref.md) — The fundamental reactive reference tracked by `watchEffect()`.
- [Watchers](watchers.md) — The base tracking watcher concept that `watchEffect()` automates.

---

## 2. Term Category

**Vue Reactivity API / Side Effect Runner (Automated Dependency Watcher)**: `watchEffect()` is Vue 3's high-level function for running automated reactive side effects. Unlike standard `watch()`, which requires developers to explicitly specify target dependency sources (`watch(source, callback)`), `watchEffect()` automatically tracks every reactive ref or proxy property accessed synchronously during its callback execution.

Executing immediately upon initialization to discover initial dependencies, `watchEffect()` re-runs whenever any tracked dependency mutates. Designed for client-side side effects (network requests, localStorage sync, DOM subscriptions), it automatically unbinds when the host component unmounts.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In complex applications, developers frequently need to run side effects that depend on multiple reactive state sources simultaneously. 

For example, when persisting user preferences to `localStorage`, a side effect might depend on `userId`, `theme`, `fontSize`, and `notificationsEnabled`. Using standard `watch()`, developers must explicitly list every dependency in a source array:

```javascript
watch([userId, theme, fontSize, notificationsEnabled], () => {
  savePreferences()
})
```

This explicit approach introduces maintenance friction. If a developer adds a fifth setting property (`compactMode`) tomorrow, they must remember to update both the `watch` dependency source array and the callback signature. If they forget, side effects fail to trigger for the new variable.

Vue created **`watchEffect()`** to eliminate dependency tracking boilerplate. You write the side effect logic naturally. As `watchEffect()` executes, Vue automatically sets a active effect tracker pointer, recording every reactive variable accessed synchronously. If any of those accessed variables mutate in the future, Vue re-runs the effect callback automatically.

### (2) Reality Metaphor
Think of an Automated Smart Security Sensor (Automated `watchEffect()`) versus a Manual Motion Detector Guard List (Explicit `watch()`).

With a Manual Guard List (`watch()`), security officers must explicitly write down every specific door number on a paper clipboard: *"Monitor Door 101, Door 102, and Door 103."* If an architect adds Door 104 to the building and forgets to update the guard's paper clipboard, Door 104 remains completely unmonitored.

An Automated Smart Security Sensor (`watchEffect()`) turns on the moment it is plugged in. It scans the entire room during its initial activation sweep, automatically detecting every active sensor line connected to the room. If any line trips in the future, the alarm sounds automatically without manual clipboard registration.

### (3) Vue Code Examples

#### Short Snippet
```vue
<script setup>
import { ref, watchEffect } from 'vue'

const count = ref(0)
const maxLimit = ref(5)

// watchEffect runs immediately on initialization!
// Automatically tracks count.value and maxLimit.value
watchEffect(() => {
  if (count.value >= maxLimit.value) {
    console.log(`Alert: Count ${count.value} reached max limit ${maxLimit.value}!`)
  }
})
</script>

<template>
  <button @click="count++">Increment: {{ count }}</button>
</template>
```

#### Fuller Example
```vue
<script setup>
import { ref, watchEffect } from 'vue'

const userId = ref(1)
const userData = ref(null)
const isLoading = ref(false)
const errorMessage = ref('')

// watchEffect handles async data fetching with automatic AbortController cleanup
watchEffect((onCleanup) => {
  const controller = new AbortController()
  const signal = controller.signal

  isLoading.value = true
  errorMessage.value = ''

  fetch(`https://jsonplaceholder.typicode.com/users/${userId.value}`, { signal })
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch user profile')
      return res.json()
    })
    .then(data => {
      userData.value = data
      isLoading.value = false
    })
    .catch(err => {
      if (err.name !== 'AbortError') {
        errorMessage.value = err.message
        isLoading.value = false
      }
    })

  // Register cleanup function triggered before the next run or component unmount
  onCleanup(() => {
    controller.abort() // Cancel outdated pending HTTP request
  })
})
</script>

<template>
  <div class="user-profile-card">
    <select v-model.number="userId">
      <option :value="1">User #1</option>
      <option :value="2">User #2</option>
      <option :value="3">User #3</option>
    </select>

    <p v-if="isLoading">Loading profile data...</p>
    <p v-else-if="errorMessage" class="error">{{ errorMessage }}</p>
    <pre v-else-if="userData">{{ userData }}</pre>
  </div>
</template>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Accessing Reactive Variables AFTER an `await` Asynchronous Boundary

**The mistake:** Accessing reactive variables *after* an `await` statement inside an async `watchEffect()` callback.

**Why it's wrong:** Vue's dependency tracking operates strictly **synchronously**. As soon as execution reaches an `await` keyword, the synchronous setup call yields, and Vue clears the active effect tracking context. Any reactive variables accessed *after* `await` will NOT be registered as dependencies.

*Incorrect:*
```javascript
watchEffect(async () => {
  console.log(`User ID: ${userId.value}`) // Tracked!
  const res = await fetch(`/api/user/${userId.value}`)
  // Vue WILL NOT track theme.value below because it is after await!
  console.log(`Applying Theme: ${theme.value}`) 
})
```

*Fix:*
```javascript
watchEffect(async () => {
  // Read ALL reactive dependencies synchronously before the first await!
  const currentUserId = userId.value
  const currentTheme = theme.value // Read synchronously, tracked cleanly!

  console.log(`User ID: ${currentUserId}`)
  const res = await fetch(`/api/user/${currentUserId}`)
  console.log(`Applying Theme: ${currentTheme}`)
})
```

---

### Mistake 2: Expecting Un-Evaluated Conditional Branches to Be Tracked

**The mistake:** Expecting `watchEffect()` to re-run when `data.value` changes, when the initial run executed `if (show.value)` and `show.value` was `false`.

**Why it's wrong:** `watchEffect()` tracks ONLY dependencies accessed DURING its actual synchronous execution. If `data.value` is inside an un-executed `else` block or behind a false condition, it is not read, so Vue does not register it.

*Incorrect:*
```javascript
watchEffect(() => {
  if (show.value) {
    console.log(data.value) // ❌ data.value is NOT tracked while show.value is false!
  }
})
```

*Fix:*
```javascript
// Read data.value synchronously outside condition if it must always be tracked:
watchEffect(() => {
  const currentData = data.value
  if (show.value) {
    console.log(currentData)
  }
})
```

---

### Mistake 3: Creating Infinite Loops by Mutating Tracked State Inside `watchEffect()`

**The mistake:** Mutating a tracked ref inside its own `watchEffect()` callback (e.g. `watchEffect(() => { console.log(count.value); count.value++ })`).

**Why it's wrong:** Reading `count.value` registers it as a dependency. Incrementing `count.value++` inside the same effect callback notifies subscribers immediately, causing `watchEffect()` to re-trigger itself in an infinite crash loop.

*Incorrect:*
```javascript
watchEffect(() => {
  console.log(count.value)
  count.value++ // ❌ Infinite effect re-execution loop!
})
```

*Fix:*
```javascript
// Perform state mutations in event handlers, or use explicit watch() with getters
```

---

## 5. Practice Exercises

### Exercise 1: E-Commerce Auto-Saving Shopping Preferences Engine

**Scenario:** An e-commerce settings panel auto-saves user preferences to `localStorage` using `watchEffect()`.
**Requirements:**
1. Declare `reactive()` `preferences` object (`theme`, `currency`, `notifications`).
2. Write `watchEffect()` persisting `preferences` to `localStorage` key `'user-pref'`.
3. Mutate `preferences.theme` and assert that `localStorage` receives the updated JSON payload.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { reactive, watchEffect } from 'vue'
> 
> // Mock localStorage for Node test environments
> const mockLocalStorage = {
>   storage: {},
>   setItem(key, val) { this.storage[key] = String(val) },
>   getItem(key) { return this.storage[key] }
> }
> 
> const preferences = reactive({
>   theme: 'dark',
>   currency: 'USD',
>   notifications: true
> })
> 
> watchEffect(() => {
>   // Touch properties or serialize JSON synchronously to track dependency
>   const payload = JSON.stringify({
>     theme: preferences.theme,
>     currency: preferences.currency,
>     notifications: preferences.notifications
>   })
>   mockLocalStorage.setItem('user-pref', payload)
> })
> 
> // Test assertion
> const initialSaved = JSON.parse(mockLocalStorage.getItem('user-pref'))
> console.assert(initialSaved.theme === 'dark', 'Initial theme should be saved automatically')
> preferences.theme = 'light' // Mutate preference property
> const updatedSaved = JSON.parse(mockLocalStorage.getItem('user-pref'))
> console.assert(updatedSaved.theme === 'light', 'Updated theme must reflect in localStorage')
> </script>
> 
> <template>
>   <div>
>     <select v-model="preferences.theme">
>       <option value="dark">Dark</option>
>       <option value="light">Light</option>
>     </select>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Immediate initial run**: `watchEffect()` executes immediately on setup, writing initial preferences.
> 2. **Automated tracking**: `JSON.stringify(preferences)` reads all nested properties, registering them as dependencies.
> 3. **Direct mutation reaction**: Updating `preferences.theme` triggers re-execution automatically.
> 4. **No manual watcher arrays**: Eliminates verbose `watch([() => pref.theme, ...])` boilerplate.
> 
---

### Exercise 2: Industrial IoT Sensor Telemetry Stream Abort Cleanup Controller

**Scenario:** An IoT dashboard connects to live telemetry endpoints using `watchEffect()` with `onCleanup` abort signaling.
**Requirements:**
1. Declare `sensorId = ref(101)`.
2. Write `watchEffect((onCleanup) => ...)` managing an `AbortController`.
3. Track cleanup execution via test assertion.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, watchEffect } from 'vue'
> 
> const sensorId = ref(101)
> let cleanupExecutedCount = 0
> 
> watchEffect((onCleanup) => {
>   const currentId = sensorId.value // Synchronous dependency read
>   const controller = new AbortController()
>   
>   onCleanup(() => {
>     cleanupExecutedCount++
>     controller.abort() // Cancel previous telemetry stream connection
>   })
> })
> 
> // Test assertions
> console.assert(cleanupExecutedCount === 0, 'No cleanup should run on initial setup')
> sensorId.value = 102 // Mutate ref to trigger re-run
> console.assert(cleanupExecutedCount === 1, 'Cleanup must run prior to second execution')
> sensorId.value = 103
> console.assert(cleanupExecutedCount === 2, 'Cleanup must run prior to third execution')
> </script>
> 
> <template>
>   <div>
>     <button @click="sensorId = 102">Switch Sensor</button>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **`onCleanup` callback parameter**: `watchEffect` provides `onCleanup` to register teardown tasks before re-execution or unmount.
> 2. **Race condition prevention**: Aborting stale requests prevents out-of-order API response bugs.
> 3. **Synchronous reading rule**: Reading `sensorId.value` before async operations ensures reliable dependency registration.
> 4. **Lifecycle teardown**: Unmounting the component automatically invokes the latest `onCleanup` callback.
> 
---

### Exercise 3: Financial Currency Live FX Rate Ticker Auto-Subscriber

**Scenario:** A currency exchange view subscribes to live ticker feeds based on reactive base/quote currency pairs using `watchEffect()`.
**Requirements:**
1. Track `baseCurrency` and `quoteCurrency` refs.
2. Form active subscription topic string inside `watchEffect()`.
3. Validate subscription string updates via test assertion.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, watchEffect } from 'vue'
> 
> const baseCurrency = ref('USD')
> const quoteCurrency = ref('EUR')
> let activeTopic = ''
> 
> watchEffect(() => {
>   activeTopic = `FX_TICKER_${baseCurrency.value}_${quoteCurrency.value}`
> })
> 
> // Test assertion
> console.assert(activeTopic === 'FX_TICKER_USD_EUR', 'Initial topic should set correctly')
> quoteCurrency.value = 'JPY'
> console.assert(activeTopic === 'FX_TICKER_USD_JPY', 'Topic must update when quoteCurrency changes')
> baseCurrency.value = 'GBP'
> console.assert(activeTopic === 'FX_TICKER_GBP_JPY', 'Topic must update when baseCurrency changes')
> </script>
> 
> <template>
>   <div>
>     <p>Active Market Feed: {{ activeTopic }}</p>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Automated multi-dependency subscription**: `watchEffect` tracks both `baseCurrency` and `quoteCurrency` implicitly.
> 2. **Immediate initial execution**: `activeTopic` is populated synchronously during component setup.
> 3. **Declarative side effects**: Keeps external ticker subscriptions in sync with reactive state.
> 4. **Clean unbinds**: Teardown hooks release socket subscriptions automatically on component unmount.
> 
---

## 6. Related Terms

- [Watchers](watchers.md) — The explicit watcher function (`watch`) with access to `newValue` and `oldValue`.
- [Computed Properties](computed_properties.md) — Evaluates cached return values (which `watchEffect` should NOT be used for).
- [`ref`](ref.md) — The reactive state primitive monitored inside effects.
- [Component Lifecycle](../level_04/component_lifecycle.md) — The component lifecycle managing effect unbinds.

---

## 7. Key Takeaways

- **`watchEffect()`** automatically tracks all reactive variables read synchronously during its callback execution.
- It runs **immediately** upon initialization to discover dependencies and establish tracking.
- Unlike `watch()`, it does not require explicit dependency source arrays and does not provide `oldValue` / `newValue` parameters.
- Reactive variables accessed *after* an `await` statement are NOT registered as dependencies.
- Use the `onCleanup` parameter callback to cancel pending async network requests or timers before the effect re-runs.
