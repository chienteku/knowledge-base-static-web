# Vue 3 Composition API Context

> **Level 1 — Core Concepts & Architecture**
> The modern paradigm for writing Vue components, relying on `<script setup>` to define reactive state and functions in a flat, readable, and highly reusable way.

---

## 1. Prerequisites
- [Composition API](../../../07-vue/terms/level_01/composition_api.md) — The core Vue paradigm.
- [`ref`](../../../07-vue/terms/level_02/ref.md) — The mechanism for primitive values.
- [`reactive`](../../../07-vue/terms/level_02/reactive.md) — The mechanism for object structures.

---

## 2. Term Category

**Framework Architecture** (Vue 3 Composition API Integration): Composition API Context defines Nuxt 3's reliance on `<script setup>` syntax and reactive primitives (`ref`, `reactive`, `computed`) for modular application logic.



---

## 3. Explanation

### Environment Context
- **Server & Client**

### (1) Design Motivation — "Why did we design this?"
In Vue 2 (and early Nuxt 2), developers used the **Options API** (`data()`, `methods`, `computed`, `mounted`). As components grew larger, logic related to a single feature (e.g., search functionality) became scattered across the file. You'd have search state in `data()`, search logic in `methods`, and search caching in `computed`.

The **Composition API** was introduced in Vue 3 to solve this. It allows developers to group logic together by feature rather than by arbitrary options. In Nuxt 3, the Composition API is the strict default, usually authored via the `<script setup>` syntactic sugar.

### (2) The `<script setup>` Syntax
Nuxt 3 projects universally use `<script setup>`. Any variable or function declared inside this block is automatically exposed to the `<template>`.

```vue
<template>
  <div>
    <h1>{{ title }}</h1>
    <button @click="increment">Count: {{ count }}</button>
  </div>
</template>

<script setup lang="ts">
// Reactivity APIs are auto-imported in Nuxt!
const title = ref('My Nuxt App');
const count = ref(0);

function increment() {
  count.value++;
}
</script>
```

### (3) Composables
The true power of the Composition API is extracting logic into reusable functions called **Composables** (which typically start with `use...`). Nuxt embraces this pattern heavily (e.g., `useFetch`, `useHead`, `useRouter`).

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using the Options API in Nuxt 3
**The mistake:** Falling back to familiar Vue 2 syntax.

**Why it's wrong:** While Nuxt 3 technically supports the Options API for backward compatibility, almost all modern Nuxt features, composables, and ecosystem tools are designed exclusively for the Composition API. Using the Options API cuts you off from the modern ecosystem.
**Golden Rule:** Always use `<script setup lang="ts">`.

*Incorrect:*
```vue
<script lang="ts">
export default {
  data() {
    return { count: 0 }
  },
  methods: {
    increment() { this.count++; }
  }
}
</script>
```

*Fix:*
```vue
<script setup lang="ts">
const count = ref(0);
function increment() { count.value++; }
</script>
```

---

### Mistake 2: Accessing Nuxt Composables Outside the Synchronous `<script setup>` Scope

**The mistake:** Calling `useRoute()` or `useNuxtApp()` inside an asynchronous callback or decoupled setTimeout event loop.

**Why it's wrong:** Nuxt composables rely on a shared global context initialized during synchronous component setup. Calling them after asynchronous delays (`setTimeout`, detached callbacks) loses the active Nuxt context, throwing `Nuxt instance not unavailable` errors.

*Incorrect:*
```vue
<script setup>
setTimeout(() => {
  const route = useRoute(); // ❌ Loss of Nuxt context inside setTimeout!
}, 1000);
</script>
```

*Fix:*
```vue
<script setup>
// Capture route synchronously at top level of script setup:
const route = useRoute();
setTimeout(() => {
  console.log(route.path); // Use pre-captured reference safely
}, 1000);
</script>
```

---

### Mistake 3: Using Options API `this` inside Nuxt 3 Composables

**The mistake:** Attempting to reference `this.$nuxt` or `this.$route` inside Composition API setup blocks.

**Why it's wrong:** Nuxt 3 Composition API eliminates `this` bindings completely. Use composable functions (`useNuxtApp()`, `useRoute()`, `useRouter()`).

*Incorrect:*
```typescript
export default {
  mounted() {
    console.log(this.$route.path); // ❌ Legacy Options API syntax
  }
}
```

*Fix:*
```vue
<script setup>
const route = useRoute(); // Composition API composable
console.log(route.path);
</script>
```


---

## 5. Practice Exercises

### Exercise 1: Migrating Options API to Composition API `<script setup>`

**Scenario:**
Migrate a legacy Options API Vue component to Nuxt 3 `<script setup>` TypeScript syntax.

**Requirements:**
1. Refactor `data()`, `computed`, and `methods` into `<script setup>` primitives.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <script setup lang="ts">
> const search = ref("");
> const items = ref(["Nuxt 3", "Vue 3", "Nitro"]);

const filteredItems = computed(() => {
  return items.value.filter(item => item.toLowerCase().includes(search.value.toLowerCase()));
});

function addItem(newItem: string) {
  items.value.push(newItem);
}
</script>

<template>
  <div>
    <input v-model="search" placeholder="Search..." />
    <ul>
      <li v-for="item in filteredItems" :key="item">{{ item }}</li>
    </ul>
  </div>
</template>
```

> #### Technical Explanation
>
> 1. `<script setup>` is a compile-time syntactic sugar for using the Composition API inside Single File Components.
> 2. Variables and functions declared at top level are directly exposed to the template without `return {}` blocks.
> 3. Provides superior TypeScript inference compared to legacy Options API.

---

### Exercise 2: Managing Reactive State with `ref()` and `reactive()`

**Scenario:**
Demonstrate the difference between primitive state management using `ref()` vs object state using `reactive()`.

**Requirements:**
1. Code `ref` and `reactive` primitives in `<script setup>`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <script setup lang="ts">
> // ref for scalar primitive value
> const count = ref<number>(0);

// reactive for structured state object
const formState = reactive({
  username: "",
  email: "",
  isSubmitting: false
});

function resetForm() {
  count.value = 0;
  formState.username = "";
  formState.email = "";
  formState.isSubmitting = false;
}
</script>

<template>
  <button @click="count++">Count: {{ count }}</button>
</template>
```

> #### Technical Explanation
>
> 1. `ref()` creates a reactive wrapper with a `.value` property for scalar or complex types.
> 2. `reactive()` creates a Proxy wrapper around an object, requiring no `.value` dereferencing in script.
> 3. Template automatically unwraps `ref()` objects without `.value`.

---

### Exercise 3: Component Props and Emits Declaration in `<script setup>`

**Scenario:**
Define typed component props and emits using `defineProps` and `defineEmits` macro primitives.

**Requirements:**
1. Define props `title: string` and emit `update:title`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <script setup lang="ts">
> const props = defineProps<{
>   title: string;
>   count?: number;
> }>();

const emit = defineEmits<{
  (e: "update:title", newTitle: string): void;
  (e: "close"): void;
}>();

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement;
  emit("update:title", target.value);
}
</script>

<template>
  <div>
    <h2>{{ props.title }}</h2>
    <input :value="props.title" @input="handleInput" />
    <button @click="emit('close')">Close</button>
  </div>
</template>
```

> #### Technical Explanation
>
> 1. `defineProps` and `defineEmits` are compiler macros available automatically inside `<script setup>`.
> 2. Pure TypeScript type arguments enable strict prop validation without runtime helper functions.
> 3. Standard Nuxt 3 component communication model.

---




---

## 6. Related Terms
- [Auto-imports](auto_imports.md) — Why you don't need to explicitly import `ref` or `computed`.
- [Nuxt 3 Overview](nuxt_3_overview.md) — Related concept: Nuxt 3 Overview.

---

## 7. Key Takeaways
- Nuxt 3 heavily relies on the Vue 3 Composition API.
- Always use `<script setup lang="ts">` for component logic.
- Variables and functions in `<script setup>` are automatically available in the template.
- State is managed via `ref()` and `reactive()`.
