# Props

> **Level 4 — Components & Props**
> Custom attributes you can register on a component, allowing a Parent component to pass data *down* to a Child component.

---

## 1. Prerequisites
- [Components](../level_04/components.md) — The entities passing data to each other.
- [`v-bind`](../level_03/v_bind.md) — The directive used to pass dynamic variables as props.

---

## 2. Term Category
- **Vue Core Concept / Data Flow**

---

## 3. Environment Context
- **Composition API (`<script setup>`)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If you create a reusable `<UserProfile>` component, it's useless if it always displays "Alice". You need to be able to tell the component *which* user to display.
**Props** (short for Properties) allow you to pass arguments into a component, exactly like passing arguments into a JavaScript function.

### (2) Passing Data (Parent to Child)
The Parent component uses custom HTML attributes to pass the data down.
```html
<!-- Parent.vue -->
<template>
  <!-- Passing a static string -->
  <UserProfile name="Alice" />
  
  <!-- Using v-bind (:) to pass a dynamic reactive variable or a Number! -->
  <UserProfile :name="currentUser.name" :age="30" />
</template>
```

### (3) Receiving Data (The Child)
The Child component MUST explicitly declare which props it expects to receive using `defineProps()`. If it doesn't declare the prop, Vue ignores it.
```vue
<!-- Child.vue (UserProfile) -->
<script setup>
// 1. Declare the expected props
const props = defineProps({
  name: String,
  age: Number
})

// 2. You can access them in JS using props.name
console.log("Rendering profile for: " + props.name)
</script>

<template>
  <!-- 3. You can use them directly in the template! -->
  <h1>{{ name }}</h1>
  <p>Age: {{ age }}</p>
</template>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Mutating a Prop

**The mistake:** A developer passes `:count="10"` to a child. Inside the child, they write a function: `function increment() { props.count++; }`.

**Why it's wrong:** **Props are strictly Read-Only!** Data in Vue flows strictly "One-Way" (Top-Down). The Parent owns the data. The Child is merely borrowing it to display it. If the Child tries to mutate the prop, Vue will throw a glaring warning in the console. 
**Golden Rule:** A child component must NEVER modify a prop. If the child needs the data to change, it must [Emit an Event](../level_04/emit.md) to beg the Parent to change it for them.

---

### Mistake 2: Mutating Props Directly Inside Child Components ("Mutating Prop Anti-Pattern")

**The mistake:** Writing `props.title = 'New Title'` inside a child component function.

**Why it's wrong:** Vue enforces One-Way Data Flow. Props are read-only. Mutating props directly triggers a runtime warning: `Set operation on key "title" failed: target is readonly`. Emit an event to request parent updates.

*Incorrect:*
```javascript
const props = defineProps(['title']);
function update() {
  props.title = 'New'; // ❌ Warning: Cannot mutate readonly prop!
}
```

*Fix:*
```javascript
const props = defineProps(['title']);
const emit = defineEmits(['update:title']);
function update() {
  emit('update:title', 'New'); // Emit event requesting parent state update
}
```

---

### Mistake 3: Failing to Provide Default Factory Functions for Array or Object Props

**The mistake:** Declaring `items: { type: Array, default: [] }` in Options API or `defineProps`.

**Why it's wrong:** Default values for Objects and Arrays MUST be returned from a factory function (`default: () => []`). Providing a direct array reference causes all component instances to share the same default array.

*Incorrect:*
```javascript
defineProps({
  items: { type: Array, default: [] } // ❌ Shared array reference across instances!
});
```

*Fix:*
```javascript
defineProps({
  items: { type: Array, default: () => [] } // Factory function returns fresh array
});
```


---

## 6. Practice Exercises

### Exercise 1: Default Values

**Problem:** You have a `<Button>` component that takes a `color` prop. If the Parent forgets to pass the `color` prop, you want the button to default to "blue". How do you define this?

**Expected output:**
```javascript
// You use the object syntax for defineProps to provide a default!
const props = defineProps({
  color: {
    type: String,
    default: 'blue'
  }
})
```

> [!check]- Answer
> - `defineProps` accepts a configuration object.

---

### Exercise 2: TypeScript Type-Only defineProps Macro

**Problem:** Write Vue 3 `<script setup lang="ts">` `defineProps` declaration for optional `title?: string` and required `count: number`.

**Expected output:**
```vue
<script setup lang="ts"> interface Props { title?: string; count: number; } defineProps<Props>(); </script>
```

> [!check]- Answer
> - Generic type argument `defineProps<Props>()` provides compile-time prop validation.
> 
> ```vue
> <script setup lang="ts">
> interface Props {
>   title?: string;
>   count: number;
> }
> 
> const props = defineProps<Props>();
> </script>
> ```

---

### Exercise 3: withDefaults Macro for TS Props

**Problem:** Write `withDefaults` wrapper providing default value `title: 'Default'` for TypeScript props interface.

**Expected output:**
```text
withDefaults(defineProps<Props>(), { title: 'Default' });
```

> [!check]- Answer
> - `withDefaults()` supplies default prop values in TS `<script setup>`.
> 
> ```typescript
> const props = withDefaults(defineProps<Props>(), {
>   title: 'Default Title'
> });
> ```


---

## 7. Related Terms
- [Emitting Events](../level_04/emit.md) — The opposite of Props. (Props go down, Events go up).
- [`v-bind`](../level_03/v_bind.md) — The directive used to pass reactive variables as props.
- [Fallthrough Attributes (`$attrs`)](../level_04/fallthrough_attributes.md) — How undeclared attributes pass through components.

---

## 8. Key Takeaways
- **Props** are custom attributes used to pass data from a Parent component down to a Child component.
- The Child must explicitly register them using `defineProps()`.
- If you are passing a Number, Boolean, Object, or dynamic variable, you MUST use `v-bind` (the `:` shorthand) on the Parent.
- **Props are Read-Only.** Data flows One-Way (Top-Down). A child component must never mutate a prop.
