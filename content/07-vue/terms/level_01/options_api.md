# Options API

> **Level 1 — Core Concepts & Reactivity**
> The original, classic way of writing Vue.js components by declaring a large JavaScript object containing specific properties (options) like `data`, `methods`, and `computed`.

---

## 1. Prerequisites
- [Components](../level_04/components.md) — The building blocks you are writing.
- [Declarative Rendering](declarative_rendering.md) — What the Options API manages.
---

## 2. Term Category
- **Vue Architecture / Syntax Style**

---

## 3. Environment Context
- **Vue 2 (and Vue 3 support)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When Vue was created (Vue 2), the goal was to make building components as structured and fool-proof as possible.
The creator designed the **Options API**. Instead of writing free-form JavaScript functions, Vue forces you to put everything into predefined buckets (options). 
- State? It goes in the `data()` bucket.
- Functions? They go in the `methods:` bucket.
- Lifecycle hooks? They go in the `mounted()` bucket.
This made Vue incredibly easy to learn, because every component looked exactly the same. You just filled in the blanks.

### (2) The Structure
```vue
<script>
export default {
  // 1. STATE BUCKET
  data() {
    return {
      count: 0
    }
  },
  // 2. COMPUTED BUCKET
  computed: {
    doubleCount() {
      // You must use `this` to access your own data!
      return this.count * 2
    }
  },
  // 3. FUNCTIONS BUCKET
  methods: {
    increment() {
      this.count++
    }
  },
  // 4. LIFECYCLE BUCKET
  mounted() {
    console.log("Component is on the screen!")
  }
}
</script>
```

### (3) The Problem with Options API
The Options API is fantastic for small components. But in massive, enterprise components (1,000+ lines of code), it becomes a nightmare. 
If you have a feature like "Search", the state is in `data()`, the search logic is in `methods()`, and the caching is in `computed()`. The code for a single feature is split across 3 different buckets separated by hundreds of lines of code. This fragmentation led to the creation of the [Composition API](../level_01/composition_api.md).

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the `this` keyword

**The mistake:** A developer writes:
`increment() { count++ }` instead of `increment() { this.count++ }`

**Why it's wrong:** In the Options API, `data`, `methods`, and `computed` are all properties of the component instance. To access a piece of state from inside a method, you MUST use JavaScript's `this` context to point to the instance itself. If you forget `this`, JavaScript thinks you are looking for a local variable and throws a ReferenceError.
**Golden Rule:** Inside the `<script>` block of the Options API, every piece of state or method must be prefixed with `this.`.

---

### Mistake 2: Using ES6 Arrow Functions for Methods or Computed Properties (Broken `this` Binding)

**The mistake:** Defining a method using an arrow function: `methods: { increment: () => { this.count++ } }`.

**Why it's wrong:** Arrow functions bind `this` lexically to the outer parent scope (window/undefined) instead of the Vue component instance. Use standard function declarations.

*Incorrect:*
```javascript
export default {
  data() { return { count: 0 } },
  methods: {
    increment: () => { this.count++ } // ❌ 'this' is undefined in arrow functions!
  }
}
```

*Fix:*
```javascript
export default {
  data() { return { count: 0 } },
  methods: {
    increment() { this.count++ } // Standard ES6 method definition binds 'this' correctly
  }
}
```

---

### Mistake 3: Returning Plain Objects from `data` Option Instead of a Factory Function

**The mistake:** Declaring `data: { count: 0 }` as a plain object in reusable Options API components.

**Why it's wrong:** If `data` is a plain object, all instantiated component instances share the exact same object reference in memory, causing state mutations to leak across component instances.

*Incorrect:*
```javascript
export default {
  data: { count: 0 } // ❌ Shared object reference across all instances!
}
```

*Fix:*
```javascript
export default {
  data() {
    return { count: 0 }; // Returns a fresh data object per instance
  }
}
```


---

## 6. Practice Exercises

### Exercise 1: Modern Relevance

**Problem:** You are starting a brand new Vue 3 project today. Should you use the Options API?

**Expected output:**
> [!check]- Answer
> ```text
> Probably not. 
> While Vue 3 still fully supports the Options API, the industry standard and official recommendation for all new Vue 3 projects is the Composition API (`<script setup>`).
> You primarily need to know the Options API to maintain older Vue 2 codebases.
> ```
> - Read the documentation guidelines for this knowledge base!

---

### Exercise 2: Options API Component Conversion

**Problem:** Write an Options API component with `data` `items: []`, `computed` `itemCount`, and `method` `addItem(item)`.

**Expected output:**
> [!check]- Answer
> ```javascript
> export default { data() { return { items: [] }; }, computed: { itemCount() { return this.items.length; } }, methods: { addItem(item) { this.items.push(item); } } }
> ```
> - Return `data` from factory function.
> - Access component state using `this`.
> 
> ```javascript
> export default {
>   data() {
>     return { items: [] };
>   },
>   computed: {
>     itemCount() { return this.items.length; }
>   },
>   methods: {
>     addItem(item) { this.items.push(item); }
>   }
> };
> ```

---

### Exercise 3: Options API Method Access

**Problem:** How do you access a method `fetchUser()` from inside another method `init()` in the Options API?

**Expected output:**
> [!check]- Answer
> ```text
> By calling `this.fetchUser()`.
> ```
> - Component options are bound to the component instance via `this`.
> 
> ```javascript
> methods: {
>   init() {
>     this.fetchUser();
>   }
> }
> ```


---

## 7. Related Terms
- [Composition API](composition_api.md) — The modern replacement for the Options API.
- [Reactive State](../level_02/reactive_state.md) — What the `data()` option creates.
- [Vue Instance](vue_instance.md) — Vue component instance.
---

## 8. Key Takeaways
- The **Options API** is the classic Vue 2 way of writing components using an object with predefined properties (`data`, `methods`, `computed`).
- It is highly structured and easy for beginners to learn.
- You must use the `this` keyword to access state and methods within the component.
- It struggles to scale in massive components because code for a single feature gets fragmented across different "buckets".
- It is mostly considered legacy; modern Vue 3 development favors the Composition API.
