# Composition API

> **Level 1 — Core Concepts & Reactivity**
> The modern, standard way of writing Vue.js components using imported functions rather than a structured object, allowing you to organize code by feature rather than by option type.

---

## 1. Prerequisites
- [Options API](options_api.md) — Understanding the limitations of the old way helps explain why the Composition API exists.
- [Declarative Rendering](declarative_rendering.md) — The core principle Vue operates on.

---

## 2. Term Category
- **Vue Architecture / Syntax Style**

---

## 3. Environment Context
- **Vue 3**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In the older [Options API](../level_01/options_api.md), you were forced to put all state in `data()`, all functions in `methods`, and all watchers in `watch`.
If your component handled two features—e.g., "User Search" and "Shopping Cart"—the code for Search and the code for the Cart were physically intertwined and scattered across those buckets. 
The **Composition API** removes the buckets. It provides raw reactivity functions (`ref`, `computed`, `watch`) that you can import and use anywhere. This allows you to group all the "Search" code together, and all the "Cart" code together, making massive components readable.

### (2) The `<script setup>` Magic
The modern way to write the Composition API is by adding the `setup` attribute to your script tag. It tells Vue to automatically compile all the variables and functions in that block and expose them to your HTML template.

```vue
<!-- Notice the 'setup' attribute! -->
<script setup>
// You explicitly import the reactivity tools you need
import { ref, computed } from 'vue'

// --- FEATURE 1: COUNTER ---
const count = ref(0)
const doubleCount = computed(() => count.value * 2)
function increment() {
  count.value++
}

// --- FEATURE 2: USER INPUT ---
const username = ref('')
function clearUser() {
  username.value = ''
}
</script>

<template>
  <!-- No 'this.' required in the template! -->
  <button @click="increment">Count: {{ count }}</button>
  <input v-model="username" />
</template>
```

### (3) The Death of `this`
Because you are writing standard JavaScript variables and functions instead of an object, you no longer need to use the confusing `this` keyword! You simply reference your variables directly (`count.value`).

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting `.value` in JavaScript

**The mistake:** A developer writes `if (count === 5)` or `count++` in their `<script setup>`.

**Why it's wrong:** In the Composition API, basic reactive variables are created using `ref()`. This wraps the value in an object to make it trackable by Vue. Inside the `<script>` tag, you MUST access or mutate the underlying data using `.value`. 
**Golden Rule:** Inside JavaScript (`<script setup>`), always use `count.value`. Inside the HTML `<template>`, Vue automatically un-wraps it for you, so you just write `{{ count }}`.

---

### Mistake 2: Destructuring Reactive Objects Without `toRefs()` (Loss of Reactivity)

**The mistake:** Destructuring properties directly from a reactive object (`const { count } = state`).

**Why it's wrong:** Direct ES6 destructuring extracts primitive value copies, severing Vue's reactive proxy tracking link. Use `toRefs(state)` or `toRef(state, 'count')`.

*Incorrect:*
```javascript
const state = reactive({ count: 0 });
const { count } = state; // ❌ Destructuring breaks reactivity!
```

*Fix:*
```javascript
import { reactive, toRefs } from 'vue';
const state = reactive({ count: 0 });
const { count } = toRefs(state); // Preserves reactive ref binding
```

---

### Mistake 3: Using `this` Inside `<script setup>` Functions

**The mistake:** Attempting to access component state using `this.count` inside `<script setup>`.

**Why it's wrong:** Inside `<script setup>`, code executes during component setup before the instance context is bound. `this` is `undefined`. Access top-level variables directly.

*Incorrect:*
```vue
<script setup>
import { ref } from 'vue';
const count = ref(0);
function increment() {
  this.count.value++; // ❌ TypeError: Cannot read properties of undefined!
}
</script>
```

*Fix:*
```vue
<script setup>
import { ref } from 'vue';
const count = ref(0);
function increment() {
  count.value++; // Access variables directly without 'this'
}
</script>
```


---

## 6. Practice Exercises

### Exercise 1: Options to Composition

**Problem:** How would you rewrite this old Options API code using the modern Composition API `<script setup>`?
```javascript
export default {
  data() { return { age: 20 } },
  methods: { birthday() { this.age++ } }
}
```

**Expected output:**
> [!check]- Answer
> ```javascript
> import { ref } from 'vue'
> 
> const age = ref(20)
> 
> function birthday() {
>   age.value++
> }
> ```
> - Create a `ref`.
> - Create a standard JS function.
> - Remember `.value`!
> 
---

### Exercise 2: Composition API Ref Converter

**Problem:** Write a `<script setup>` snippet creating reactive `name` ('Alice') and `age` (30) variables, and a function `birthday()` incrementing `age`.

**Expected output:**
> [!check]- Answer
> ```javascript
> import { ref } from 'vue'; const name = ref('Alice'); const age = ref(30); function birthday() { age.value++; }
> ```
> - `ref()` wraps primitives into reactive objects.
> - Mutate `.value` inside `<script setup>`.
> 
> ```vue
> <script setup>
> import { ref } from 'vue';
> 
> const name = ref('Alice');
> const age = ref(30);
> 
> function birthday() {
>   age.value++;
> }
> </script>
> ```
> 
---

### Exercise 3: Template Ref Unwrapping Rule

**Problem:** Do you need to write `{{ count.value }}` inside the `<template>` block when referencing a `ref`?

**Expected output:**
> [!check]- Answer
> ```text
> No. Vue automatically unwraps top-level ref objects inside the template, so you write {{ count }}.
> ```
> - Template ref unwrapping is automatic for top-level refs.
> 
> ```html
> <!-- Template automatically unwraps refs -->
> <p>{{ count }}</p>
> ```
> 
> 
---

## 7. Related Terms
- [`ref`](../level_02/ref.md) — The primary tool used to create state in the Composition API.
- [Composables](../level_05/composables.md) — The ultimate superpower of the Composition API: extracting logic into reusable files.
- [`<script setup>` & Compiler Macros](../level_04/script_setup.md) — The standard compilation sugar for Composition API.
- [Options API](options_api.md) — Related concept: Options API.
- [Reactive State](../level_02/reactive_state.md) — Reactive state API.

---

## 8. Key Takeaways
- The **Composition API** is the modern standard for writing Vue 3 components.
- You use `<script setup>` to write standard JavaScript, completely eliminating the confusing `this` keyword.
- It allows you to group related logic by feature, rather than fragmenting it across predefined option buckets.
- You must explicitly import reactivity tools like `ref` and `computed` from the `vue` package.
- State created with `ref()` must be accessed via `.value` inside the `<script>` tag.
