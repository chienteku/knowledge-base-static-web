# `reactive`

> **Level 2 — Reactivity System**
> A Composition API function used to create reactive state, specifically designed for JavaScript Objects and Arrays, allowing you to mutate their properties without using `.value`.

---

## 1. Prerequisites
- [`ref`](../level_02/ref.md) — The standard way to create state, which `reactive` acts as an alternative to.
- [Proxy Reactivity](../level_08/proxy_reactivity.md) — The underlying JavaScript feature that powers `reactive`.

---

## 2. Term Category
- **Vue Reactivity API**

---

## 3. Environment Context
- **Composition API (`<script setup>`)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
[`ref`](../level_02/ref.md) works perfectly for simple values like `0` or `"Hello"`. But what if your state is a massive configuration object with 50 nested properties?
```javascript
const user = ref({ name: "Alice", address: { city: "Paris" } });
// Mutating it is annoying:
user.value.address.city = "London";
```
Because objects are naturally passed by reference in JavaScript, Vue doesn't need to wrap them in a `.value` object to track them! 
**`reactive()`** takes a raw Object or Array, wraps it in a transparent JavaScript Proxy, and returns it. You can interact with it exactly like a normal object, completely skipping the `.value` syntax!

### (2) How to use it
```vue
<script setup>
import { reactive } from 'vue'

// 1. Pass an object to `reactive`
const user = reactive({
  name: "Alice",
  age: 30
})

function celebrateBirthday() {
  // 2. Mutate directly! No `.value` required!
  user.age++
}
</script>

<template>
  <button @click="celebrateBirthday">{{ user.name }} is {{ user.age }}</button>
</template>
```

### (3) The Great Debate: `ref` vs `reactive`
In the Vue community, there is a debate over which to use.
- **`reactive` Pros:** No `.value` needed. The code looks cleaner.
- **`reactive` Cons:** It ONLY works on Objects/Arrays. It cannot handle primitives (strings/numbers). It also easily loses reactivity if you destructure it.
Because of these limitations, the official Vue documentation (and most senior architects) recommend **just using `ref()` for everything** to maintain consistency across the entire codebase.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Destructuring a `reactive` object

**The mistake:** A developer wants cleaner code in their template, so they destructure the `reactive` object.
```javascript
const user = reactive({ name: "Bob", age: 25 });
// DESTRUCTURING DESTROYS REACTIVITY!
let { name, age } = user;
```

**Why it's wrong:** Destructuring primitives out of a JavaScript object creates standalone, disconnected copies of the values. The variable `age` is now just a dumb number `25`. It is completely severed from the Vue Proxy. When you change `age`, the UI will not update.
**Golden Rule:** Never destructure a `reactive()` object. If you absolutely must, you must use the `toRefs()` utility function first.

---

### Mistake 2: Reassigning Entire `reactive()` Objects (Loss of Reactivity)

**The mistake:** Reassigning a `reactive()` object variable: `let state = reactive({ count: 0 }); state = { count: 5 };`.

**Why it's wrong:** Vue's `reactive()` returns a Proxy wrapper around the initial object. Reassigning the variable replaces the Proxy reference with a plain un-tracked object, severing reactivity.

*Incorrect:*
```javascript
let state = reactive({ count: 0 });
state = { count: 5 }; // ❌ Reassignment destroys reactive proxy!
```

*Fix:*
```javascript
const state = reactive({ count: 0 });
state.count = 5; // Mutate properties on existing proxy
// Or use Object.assign(state, newObj)
```

---

### Mistake 3: Passing Primitive Values to `reactive()`

**The mistake:** Calling `const count = reactive(0)` or `const name = reactive('Alice')`.

**Why it's wrong:** `reactive()` works ONLY for object types (objects, arrays, Maps, Sets). It cannot wrap JavaScript primitives (string, number, boolean). Use `ref()` for primitives.

*Incorrect:*
```javascript
const count = reactive(0); // ❌ Returns raw number 0, NOT a reactive proxy!
```

*Fix:*
```javascript
const count = ref(0); // Use ref() for primitive values
```


---

## 6. Practice Exercises

### Exercise 1: Primitive Panics

**Problem:** What happens if you try to do this: `const count = reactive(0)`?

**Expected output:**
```text
Vue will throw a warning/error in the console. 
`reactive()` only works on Reference Types (Objects, Arrays, Maps, Sets). It physically cannot proxy a primitive like a number or string. 
For primitives, you MUST use `ref()`.
```

> [!check]- Answer
> - Can a number `0` be wrapped in a JavaScript Proxy? No.

---

### Exercise 2: Reactive State Object Pattern

**Problem:** Write a `reactive` state object holding `user: { name: 'Bob', age: 25 }` and a function `celebrate()` incrementing age.

**Expected output:**
```javascript
const state = reactive({ user: { name: 'Bob', age: 25 } }); function celebrate() { state.user.age++; }
```

> [!check]- Answer
> - `reactive()` performs deep reactive Proxy wrapping.
> 
> ```javascript
> const state = reactive({
>   user: {
>     name: 'Bob',
>     age: 25
>   }
> });
> 
> function celebrate() {
>   state.user.age++;
> }
> ```

---

### Exercise 3: ref vs reactive Selection Rule

**Problem:** When should you prefer `ref()` over `reactive()`?

**Expected output:**
```text
Use ref() for primitives (string, number, boolean) or when reassigning entire data structures; use reactive() for fixed nested state objects.
```

> [!check]- Answer
> - `ref()` handles primitives and object reassignment cleanly via `.value`.
> 
> ```text
> Use ref() for primitives and reassignable arrays/objects.
> ```


---

## 7. Related Terms
- [`ref`](../level_02/ref.md) — The recommended alternative for declaring state.
- [Proxy Reactivity](../level_08/proxy_reactivity.md) — The ES6 feature that powers `reactive`.
- [`toRefs` / `toRef`](../level_02/to_refs.md) — The utility to safely destructure reactive objects.
- [`shallowRef` / `markRaw`](../level_02/shallow_ref_mark_raw.md) — Reactivity escape hatches for performance.

---

## 8. Key Takeaways
- **`reactive()`** creates a reactive Proxy out of a JavaScript Object or Array.
- Unlike `ref()`, it does NOT require the `.value` syntax when reading or writing.
- It **cannot** be used on primitives (Strings, Numbers, Booleans).
- Destructuring a `reactive` object severs the reactivity completely.
- Because of its limitations, many teams prefer to exclusively use `ref()` for all state to maintain consistency.
