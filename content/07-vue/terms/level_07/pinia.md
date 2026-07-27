# Pinia

> **Level 7 — State Management (Pinia)**
> The official State Management library for modern Vue.js. It replaces Vuex, offering a simpler API, perfect TypeScript support, and full integration with the Composition API.

---

## 1. Prerequisites
- [State Management](../level_07/state_management.md) — The concept that Pinia implements.
- [Composition API](../level_01/composition_api.md) — The syntax pattern Pinia natively mimics.

---

## 2. Term Category
- **Vue Ecosystem / Library**

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
For years, **Vuex** was the official state management tool for Vue. However, Vuex was designed for the older Options API. It was clunky, required "Mutations" to change data, used string-based dispatching (`store.dispatch('updateUser')`), and had notoriously terrible TypeScript support.
When Vue 3 and the Composition API were released, the core team realized Vuex's architecture was obsolete. They built **Pinia** from the ground up. Pinia removes "Mutations", relies heavily on standard JavaScript functions, and feels exactly like writing a standard Vue component.

### (2) The Setup
To use Pinia, you must register it as a plugin in your root Vue instance, exactly like Vue Router.

```javascript
// main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia) // Activate Pinia!
app.mount('#app')
```

### (3) Why Pinia is better than Vuex
1. **No Mutations:** In Vuex, you couldn't change state directly; you had to commit a "Mutation". Pinia removes this entirely. You just change the state like a normal variable!
2. **Modular by Default:** Vuex had one giant global store. Pinia has multiple, isolated stores (e.g., `useUserStore()`, `useCartStore()`).
3. **TypeScript:** Pinia infers your data types automatically without complex interfaces.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using Vuex in a new Vue 3 project

**The mistake:** A developer is starting a brand new Vue 3 project. They run `npm install vuex` because that's what a 4-year-old Medium article told them to do.

**Why it's wrong:** The official Vue documentation states explicitly: *"Vuex is now in maintenance mode. It still works, but will no longer receive new features. It is recommended to use Pinia for new applications."* 
**Golden Rule:** If you are building a Vue 3 application today, you MUST use Pinia. Only use Vuex if you are maintaining a legacy Vue 2 codebase.

---

### Mistake 2: Destructuring State from Pinia Stores Without `storeToRefs()` (Loss of Reactivity)

**The mistake:** Destructuring state properties directly from a Pinia store instance (`const { count } = useCounterStore()`).

**Why it's wrong:** Direct ES6 destructuring extracts raw value copies from the store proxy, severing Vue's reactive link. Use `storeToRefs(store)` for state and getters.

*Incorrect:*
```javascript
const store = useCounterStore();
const { count } = store; // ❌ Destructuring severs reactivity!
```

*Fix:*
```javascript
import { storeToRefs } from 'pinia';
const store = useCounterStore();
const { count } = storeToRefs(store); // Preserves reactive ref binding
const { increment } = store; // Actions can be destructured directly
```

---

### Mistake 3: Instantiating Pinia Stores Outside Vue Application Lifecycles (Before Pinia Plugin Installation)

**The mistake:** Calling `useUserStore()` in global JS module scope before `app.use(createPinia())` executes.

**Why it's wrong:** Pinia stores require the active Pinia plugin instance. Calling store functions at top-level module import scope causes a runtime error: `getActivePinia() was called with no active Pinia`.

*Incorrect:*
```javascript
// Global module scope
const userStore = useUserStore(); // ❌ Fails before app.use(createPinia()) runs!
```

*Fix:*
```javascript
// Call store functions inside component setup or router guards after pinia plugin is installed:
router.beforeEach(() => {
  const userStore = useUserStore();
});
```


---

## 6. Practice Exercises

### Exercise 1: Pinia vs Composables

**Problem:** You learned about [Composables](../level_05/composables.md) (like `useMouse()`). Pinia stores look very similar (like `useUserStore()`). Can't you just use a Composable to share global state?

**Expected output:**
```text
Technically, yes (if you define the `ref` outside the composable function). 
However, Pinia provides critical features that plain Composables lack:
1. Integration with Vue DevTools (time-travel debugging, tracking who changed what state).
2. Server-Side Rendering (SSR) support.
3. Hot Module Replacement (HMR).
```

> [!check]- Answer
> - Think about debugging and DevTools!

---

### Exercise 2: Pinia Setup Store Pattern

**Problem:** Write a Pinia Setup Store `useCartStore` with `defineStore('cart', () => { ... })` declaring `items` ref, `count` computed, and `addItem()` function.

**Expected output:**
```javascript
export const useCartStore = defineStore('cart', () => { const items = ref([]); const count = computed(() => items.value.length); function addItem(item) { items.value.push(item); } return { items, count, addItem }; });
```

> [!check]- Answer
> - Setup stores mirror Composition API `<script setup>` syntax.
> 
> ```javascript
> import { defineStore } from 'pinia';
> import { ref, computed } from 'vue';
> 
> export const useCartStore = defineStore('cart', () => {
>   const items = ref([]);
>   const count = computed(() => items.value.length);
>   
>   function addItem(item) {
>     items.value.push(item);
>   }
>   
>   return { items, count, addItem };
> });
> ```

---

### Exercise 3: Vuex vs Pinia Comparison

**Problem:** Name 2 major architectural advantages Pinia has over legacy Vuex 3/4.

**Expected output:**
```text
1. Zero mutations (state is updated directly or via actions)
2. Full TypeScript auto-completion support out of the box without complex type wrappers
```

> [!check]- Answer
> - No mutations required (direct state mutation supported).
> - First-class TypeScript inference without verbose types.
> 
> ```text
> Pinia eliminates Vuex mutations and provides native TypeScript support.
> ```


---

## 7. Related Terms
- [Store](../level_07/store.md) — The actual files you create inside Pinia.
- [Composables](../level_05/composables.md) — The local-logic equivalent of a Pinia store.

---

## 8. Key Takeaways
- **Pinia** is the modern, official State Management library for Vue 3.
- It completely replaces the older **Vuex** library.
- It integrates seamlessly with the Composition API.
- It removes the tedious "Mutations" requirement found in Vuex/Redux.
- You must register it as a plugin using `app.use(createPinia())` before you can create Stores.
