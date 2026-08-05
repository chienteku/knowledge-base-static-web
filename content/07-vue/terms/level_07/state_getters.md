# State & Getters (Pinia)

> **Level 7 — State Management (Pinia)**
> The two fundamental data pillars of a Pinia Store. **State** is the raw data, and **Getters** are calculated, derived data based on the State.

---

## 1. Prerequisites
- [Store (Pinia)](store.md) — The container where State and Getters live.
- [Computed Properties](../level_02/computed_properties.md) — Getters are literally just Computed Properties!

---

## 2. Term Category
- **Vue Ecosystem / Pinia Concepts**

---

## 3. Environment Context
- **Pinia Setup Stores**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If a store is a mini-database, it needs to hold raw data. That is the **State**. 
But often, the raw data isn't enough. If your State is `items: [{ price: 10 }, { price: 20 }]`, five different components might need to know the `totalPrice`. You don't want to copy-paste the math `items.reduce(...)` into all five components.
Instead, you create a **Getter** directly inside the Store. The Getter calculates the total once, caches the result, and provides it to any component that asks.

### (2) Defining State
In a modern Pinia Setup Store, State is simply defined using standard Vue [`ref()`](../level_02/ref.md) or [`reactive()`](../level_02/reactive.md) functions.
```javascript
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCartStore = defineStore('cart', () => {
  // This is STATE! (Raw data)
  const items = ref([])
  const discountCode = ref('')

  return { items, discountCode }
})
```

### (3) Defining Getters
In a Setup Store, Getters are simply defined using standard Vue [`computed()`](../level_02/computed_properties.md) functions.
```javascript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const items = ref([{ price: 10 }, { price: 20 }]) // State

  // This is a GETTER! (Derived data)
  const totalCost = computed(() => {
    return items.value.reduce((sum, item) => sum + item.price, 0)
  })

  // A Getter can even depend on another Getter!
  const hasItems = computed(() => totalCost.value > 0)

  return { items, totalCost, hasItems }
})
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Mutating state inside a Getter

**The mistake:** A developer writes a Getter that accidentally changes the array it is trying to read.
```javascript
const sortedItems = computed(() => {
  // .sort() mutates the original array in JavaScript!
  return items.value.sort((a,b) => a.price - b.price) 
})
```

**Why it's wrong:** Getters must be **Pure Functions**. If a Getter modifies the State, it will trigger the Getter to run again, which modifies the State again, causing an Infinite Loop that crashes the browser.
**Golden Rule:** Getters must *only* read data and return a new value. If you need to sort an array in a Getter, copy it first! (`[...items.value].sort()`).

---

### Mistake 2: Accessing Other Getters Using `this` inside Arrow Function Getters

**The mistake:** Writing `doubleCount: (state) => this.otherGetter` inside Options store getters.

**Why it's wrong:** Arrow function getters bind `this` to the outer lexical context, not the store instance. Access state via the `state` argument or use standard function syntax for `this`.

*Incorrect:*
```javascript
getters: {
  doubleCount: (state) => this.count * 2 // ❌ 'this' is undefined!
}
```

*Fix:*
```javascript
// Use state parameter:
getters: {
  doubleCount: (state) => state.count * 2
}
// Or standard function syntax for 'this' access:
getters: {
  doubleCount() { return this.count * 2; }
}
```

---

### Mistake 3: Returning Un-Cached Results from Function-Returning Getters

**The mistake:** Assuming a getter returning a function `getById: (state) => (id) => state.items.find(i => i.id === id)` caches query results.

**Why it's wrong:** Getters that return a function are NOT cached! The returned function is executed fresh every single time it is called. Cache results manually inside component computed properties if needed.

*Incorrect:*
```vue
/* Expecting function-returning getters to cache evaluation results */
```

*Fix:*
```vue
/* Function-returning getters execute fresh on every call; awareness required for large arrays */
```


---

## 6. Practice Exercises

### Exercise 1: Caching Power

**Problem:** Component A reads `cartStore.totalCost`. Component B reads `cartStore.totalCost`. The calculation involves looping over 10,000 items. How many times does the math actually run?

**Expected output:**
> [!check]- Answer
> ```text
> Exactly once!
> Because Getters are built on Vue's `computed()` properties, they cache their result. 
> When Component A asks, it does the math and caches it. When Component B asks a millisecond later, Pinia instantly returns the cached value without doing the math again.
> ```
> - Think about how Computed Properties work.

---

### Exercise 2: Parameterized Getter Pattern

**Problem:** Write a Pinia getter `getUserById` returning a function that accepts user ID number and finds user in `state.users` array.

**Expected output:**
> [!check]- Answer
> ```javascript
> getters: { getUserById: (state) => (id) => state.users.find(u => u.id === id) }
> ```
> - Return a function from getters to accept dynamic arguments.
> 
> ```javascript
> getters: {
>   getUserById: (state) => {
>     return (userId) => state.users.find(user => user.id === userId);
>   }
> }
> ```

---

### Exercise 3: Cross-Store Getter Usage

**Problem:** How do you access a getter from another store `useAuthStore()` inside a Pinia getter?

**Expected output:**
> [!check]- Answer
> ```text
> By instantiating the other store inside the getter function: const authStore = useAuthStore(); return state.user && authStore.isLoggedIn;.
> ```
> - Instantiate other stores directly inside getter functions.
> 
> ```javascript
> getters: {
>   userCart(state) {
>     const authStore = useAuthStore();
>     return state.carts[authStore.userId];
>   }
> }
> ```


---

## 7. Related Terms
- [Computed Properties](../level_02/computed_properties.md) — The underlying technology of Getters.
- [Actions (Pinia)](actions.md) — The tool used to actually mutate the State.
- [Store (Pinia)](store.md) — Related concept: Store (Pinia).

---

## 8. Key Takeaways
- **State** is the raw reactive data in a Pinia store, defined using `ref()`.
- **Getters** are derived values based on the state, defined using `computed()`.
- Getters cache their results for maximum performance.
- Getters must be Pure Functions; they should never mutate state or perform asynchronous side effects (like API calls).
