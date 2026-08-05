# `v-model`

> **Level 3 — Directives**
> Vue's "magic" directive that creates Two-Way Data Binding between a form input (like a text box) and a piece of reactive JavaScript state.

---

## 1. Prerequisites
- [`v-bind`](v_bind.md) — Binds data from JS to HTML (One-way).
- [`v-on`](v_on.md) — Binds data from HTML to JS (One-way).

---

## 2. Term Category
- **Vue Directive**

---

## 3. Environment Context
- **Vue Templates (Forms)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In React, if you want an `<input>` box to update a JavaScript variable, you have to write "Controlled Components". You bind the value using `value={text}`, and you explicitly write an onChange handler `onChange={e => setText(e.target.value)}`. 
It's repetitive boilerplate that you have to type hundreds of times.
Vue provides **`v-model`**. It is syntactic sugar that does both the `v-bind` (pushing data to the input) and the `v-on` (listening to the input) at the exact same time!

### (2) Two-Way Data Binding
Two-Way binding means:
1. If the JavaScript variable changes, the Input box text changes.
2. If the user types in the Input box, the JavaScript variable changes instantly.

```html
<script setup>
import { ref } from 'vue'
const username = ref('') // The reactive state
</script>

<template>
  <!-- v-model does all the hard work automatically! -->
  <input v-model="username" placeholder="Type your name" />
  
  <p>Hello, {{ username }}</p>
</template>
```

### (3) It adapts to the input type
`v-model` is smart. 
- On an `<input type="text">`, it tracks the `value` property and listens to the `input` event.
- On a `<input type="checkbox">`, it tracks the `checked` property and listens to the `change` event.
You don't have to remember the native DOM differences; `v-model` handles it perfectly.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to `v-model` a non-reactive variable

**The mistake:** A developer writes:
`<script setup> let name = "Alice"; </script> <template><input v-model="name"></template>`

**Why it's wrong:** `v-model` requires a Vue Reactivity object to write data back into! If `name` is just a raw string, Vue cannot update it and trigger a UI re-render.
**Golden Rule:** `v-model` must always be attached to a `ref()`, a property of a `reactive()` object, or a Vuex/Pinia state value.

---

### Mistake 2: Attempting to Mutate `v-model` Props Directly in Child Components

**The mistake:** Writing `props.modelValue = 'newVal'` inside a child component handling `v-model`.

**Why it's wrong:** Vue enforces One-Way Data Flow. Props are read-only. Mutating `props.modelValue` throws a runtime warning. Emit `'update:modelValue'` or use `defineModel()` (Vue 3.4+).

*Incorrect:*
```javascript
// Child component trying to mutate prop directly
const props = defineProps(['modelValue']);
function update() { props.modelValue = 'new'; } // ❌ Warning: Cannot mutate readonly prop!
```

*Fix:*
```javascript
// Vue 3.4+ defineModel macro handles 2-way binding automatically:
const model = defineModel(); // Mutate model.value directly
```

---

### Mistake 3: Confusing `v-model.number` Modifier with Input `type="number"`

**The mistake:** Expecting `<input type="number" v-model="age">` to automatically store `age` as a JavaScript Number.

**Why it's wrong:** Standard HTML `<input type="number">` elements return string values in JavaScript DOM events. Use `<input type="number" v-model.number="age">` to typecast strings to numbers automatically.

*Incorrect:*
```vue
<input type="number" v-model="age"> <!-- Stores string '25' in age state -->
```

*Fix:*
```vue
<input type="number" v-model.number="age"> <!-- Typecasts input value to JS Number -->
```


---

## 6. Practice Exercises

### Exercise 1: Deconstructing the Magic

**Problem:** Under the hood, `v-model="email"` is just a shortcut for two other directives. What are they?

**Expected output:**
> [!check]- Answer
> ```html
> <input :value="email" @input="event => email = event.target.value" />
> 
> // v-model automatically combines `v-bind:value` and `v-on:input` into one easy attribute!
> ```
> - Which directive pushes data down? Which directive listens for events coming up?

---

### Exercise 2: v-model Modifiers Matrix

**Problem:** Match `v-model` modifier to function:
1. `.lazy` 
2. `.number` 
3. `.trim` 

**Expected output:**
> [!check]- Answer
> ```text
> 1. Syncs input on change event (blur) instead of input event
> 2. Typecasts user input string to JavaScript number automatically
> 3. Trims leading and trailing whitespace automatically
> ```
> ```html
> <input v-model.lazy="msg">    <!-- Syncs on blur -->
> <input v-model.number="age">  <!-- Typecasts to number -->
> <input v-model.trim="name">   <!-- Trims whitespace -->
> ```
---

### Exercise 3: defineModel Macro Syntax (Vue 3.4+)

**Problem:** Write Vue 3.4 `<script setup>` syntax for a custom input component declaring 2-way `modelValue` binding.

**Expected output:**
> [!check]- Answer
> ```vue
> <script setup> const model = defineModel(); </script> <template> <input v-model="model" /> </template>
> ```
> - `defineModel()` simplifies component 2-way `v-model` bindings.
> 
> ```vue
> <script setup>
> const model = defineModel({ default: '' });
> </script>
> 
> <template>
>   <input v-model="model" />
> </template>
> ```


---

## 7. Related Terms
- [`v-bind`](v_bind.md) — The one-way downward binding.
- [`v-on`](v_on.md) — The one-way upward event listening.
- [Event, Key & Form Modifiers](modifiers.md) — Suffixes for input sync timing and parsing.
- [Directives](directives.md) — Built-in directives.

---

## 8. Key Takeaways
- **`v-model`** provides **Two-Way Data Binding** between Vue state and form inputs.
- It is syntactic sugar that combines `:value` and `@input` into a single directive.
- It automatically adapts its behavior based on the input type (text, checkbox, radio, select).
- It drastically reduces boilerplate code compared to React's Controlled Components.
- It must be bound to reactive state (like a `ref`).
