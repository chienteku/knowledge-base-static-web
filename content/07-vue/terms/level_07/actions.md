# Actions (Pinia)

> **Level 7 — State Management (Pinia)**
> Functions defined inside a Pinia Store that contain the business logic required to mutate the State or perform asynchronous operations (like API fetching).

---

## 1. Prerequisites
- [State & Getters (Pinia)](state_getters.md) — The data that Actions are modifying.
- [Store (Pinia)](store.md) — Where Actions live.
---

## 2. Term Category
- **Vue Ecosystem / Pinia Concepts**

---

## 3. Environment Context
- **Pinia Setup Stores**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
You have a Pinia Store holding a User's authentication token (`const token = ref(null)`). 
Any component *could* technically import the store and write `userStore.token = '12345'`. 
But what if setting the token requires saving it to `localStorage`, fetching the user's profile from the API, and redirecting them to the dashboard? If you put that logic inside a component, you can never reuse it.
**Actions** encapsulate business logic *inside* the Store. Components simply call the Action (`userStore.login()`), and the Store handles all the heavy lifting.

### (2) Defining Actions
In a modern Setup Store, Actions are simply standard JavaScript functions. They can be synchronous (changing a variable) or asynchronous (fetching from an API).

```javascript
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const user = ref(null) // State

  // 1. A Synchronous Action
  function logout() {
    user.value = null
    localStorage.removeItem('token')
  }

  // 2. An Asynchronous Action
  async function login(email, password) {
    try {
      const response = await fetch('/api/login', { method: 'POST', body: ... })
      const data = await response.json()
      
      // Mutate the state inside the action!
      user.value = data.user
      localStorage.setItem('token', data.token)
    } catch (error) {
      console.error("Login failed")
    }
  }

  return { user, logout, login }
})
```

### (3) The Difference from Vuex Mutations
If you used the older Vuex library, you remember "Mutations" (synchronous) and "Actions" (asynchronous). 
Pinia abolished Mutations! In Pinia, an Action handles *everything*. You just write a normal JavaScript function, and you mutate the state variables directly inside it using `.value`.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Component Business Logic Leakage

**The mistake:** A developer writes a complex 50-line API fetch and error-handling block inside `Login.vue`, and at the very end, writes `userStore.user = data.user`.

**Why it's wrong:** You have leaked business logic into the UI layer. If you ever need to log in from a different component (like a Session Timeout Modal), you have to copy-paste those 50 lines.
**Golden Rule:** Components should be "dumb". They should collect user input and call an Action. The Store Action should be "smart". It should handle the API logic, error catching, and state mutation.

---

### Mistake 2: Using ES6 Arrow Functions for Pinia Options API Actions (Broken `this` Context)

**The mistake:** Defining an action using an arrow function inside Pinia Options store: `actions: { increment: () => { this.count++ } }`.

**Why it's wrong:** Arrow functions bind `this` lexically to the outer scope (undefined) instead of the Pinia store instance. Use standard function declarations.

*Incorrect:*
```javascript
export const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0 }),
  actions: {
    increment: () => { this.count++; } // ❌ 'this' is undefined in arrow functions!
  }
});
```

*Fix:*
```javascript
export const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0 }),
  actions: {
    increment() { this.count++; } // Standard ES6 method definition
  }
});
```

---

### Mistake 3: Forgetting `await` on Async Action Invocations in Component Methods

**The mistake:** Calling `store.fetchUserData()` without `await` when subsequent component code depends on fetched state.

**Why it's wrong:** Pinia async actions return Promises. Failing to await action completion causes component code to execute against un-populated empty state.

*Incorrect:*
```javascript
function load() {
  userStore.fetchUser(); // ❌ Async action un-awaited!
  console.log(userStore.user.name); // Throws TypeError: user is null!
}
```

*Fix:*
```javascript
async function load() {
  await userStore.fetchUser(); // Await promise resolution
  console.log(userStore.user.name);
}
```


---

## 6. Practice Exercises

### Exercise 1: Directly Mutating State

**Problem:** In Vuex/Redux, directly mutating state outside of an Action (`userStore.name = "Bob"`) was strictly forbidden and would throw an error. Is it forbidden in Pinia?

**Expected output:**
> [!check]- Answer
> ```text
> No!
> Pinia allows you to mutate state directly from components. `userStore.name = "Bob"` is perfectly valid and will work.
> However, for complex updates involving multiple variables or side effects, you should always use an Action to keep the logic centralized and readable.
> ```
> - Pinia removed the strict "Mutations" requirement.

---

### Exercise 2: Pinia Action Error Handling Pattern

**Problem:** Write an async Pinia Setup store action `fetchItems()` wrapped in `try/catch` updating `items` and setting `isLoading` boolean state.

**Expected output:**
> [!check]- Answer
> ```javascript
> async function fetchItems() { isLoading.value = true; try { items.value = await api.getItems(); } catch (err) { error.value = err; } finally { isLoading.value = false; } }
> ```
> - Wrap async actions in `try/catch/finally` blocks.
> 
> ```javascript
> const isLoading = ref(false);
> const items = ref([]);
> const error = ref(null);
> 
> async function fetchItems() {
>   isLoading.value = true;
>   try {
>     items.value = await api.getItems();
>   } catch (err) {
>     error.value = err;
>   } finally {
>     isLoading.value = false;
>   }
> }
> ```

---

### Exercise 3: Pinia $onAction Subscriptions

**Problem:** Which Pinia store method allows subscribing to action executions to log performance timings or handle global errors?

**Expected output:**
> [!check]- Answer
> ```text
> store.$onAction(({ name, store, args, after, onError }) => {})
> ```
> - `store.$onAction()` listens to action executions.
> 
> ```javascript
> userStore.$onAction(({ name, after, onError }) => {
>   console.log(`Action ${name} started`);
>   after((result) => console.log(`Action ${name} finished`));
> });
> ```


---

## 7. Related Terms
- [Store (Pinia)](store.md) — The container for Actions.
- [State & Getters (Pinia)](state_getters.md) — What the Actions manipulate.
---

## 8. Key Takeaways
- **Actions** are standard JavaScript functions inside a Pinia Store used to contain business logic.
- They can be asynchronous (`async/await`) to handle API requests.
- They completely replace Vuex "Mutations" and "Actions"; in Pinia, everything is just an Action.
- Keep components "dumb" (handling UI) and push heavy business/API logic into Store Actions.
- While you *can* mutate Pinia state directly from a component, complex changes should always be encapsulated in an Action.
