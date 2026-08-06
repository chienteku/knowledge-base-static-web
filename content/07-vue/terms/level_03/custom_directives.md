# Custom Directives (`v-*`)

> **Level 3 — Directives**
> User-defined attributes that allow low-level DOM access and manipulation by running custom hook functions directly on a DOM element at specific lifecycle events.

---

## 1. Prerequisites
- [Directives](directives.md) — The built-in directive system.
- [Component Lifecycle](../level_04/component_lifecycle.md) — Component lifecycle phases.

---

## 2. Term Category
- **Directive**

---

## 3. Environment Context
- **Client-Side (Browser)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In Vue, the general rule is: **never touch the DOM manually**. Declarative template bindings (`v-bind`, `v-model`, etc.) handle 99% of DOM changes.

However, there are rare scenarios where you need direct, low-level access to a physical HTML element. Common examples include:
- Auto-focusing an input when a page or modal opens.
- Lazy-loading images when they enter the viewport.
- Handling clicks outside a dropdown menu to close it.
- Dynamically styling text based on custom formatting properties.

While you *could* do this using a template ref (`const inputRef = ref(null)`) and modifying it inside `onMounted`, this logic is trapped inside the component. If you need to auto-focus inputs in ten different forms across your application, copying and pasting template refs is messy. Custom Directives solve this by allowing you to package DOM-manipulation logic into a reusable, declarative attribute syntax.

### (2) How it works under the hood
A custom directive is simply an object containing a set of hook functions (mirroring the component lifecycle). When Vue creates or modifies the element, it runs the hooks you've defined.

The key lifecycle hooks are:
- `created`: Called before element attributes or event listeners are applied.
- `mounted`: Called when the element is inserted into the DOM.
- `updated`: Called after the parent component and its children have updated.
- `unmounted`: Called when the element is removed.

In `<script setup>`, any camelCase variable that starts with a lowercase `v` followed by an uppercase letter (e.g., `vFocus`) is automatically registered as a directive named `v-focus` in the template.

Each hook receives the following arguments:
- `el`: The raw DOM element (e.g. `HTMLInputElement`).
- `binding`: An object containing details about the directive (`value` passed to it, `oldValue`, `arg` like `:color`, and `modifiers` like `.foo`).

### (3) Code Examples

#### Short Snippet
Auto-focusing an input element on mount:
```vue
<script setup>
// In <script setup>, starting with "v" registers a directive
const vFocus = {
  mounted: (el) => {
    el.focus()
  }
}
</script>

<template>
  <!-- Triggers the mounted hook on the input element -->
  <input v-focus />
</template>
```

#### Fuller Example
Implementing a click-outside directive, a common pattern for interactive dropdowns and modals.

```vue
<!-- Dropdown.vue -->
<script setup>
import { ref } from 'vue'

const isOpen = ref(false)

// Custom directive to close the dropdown when clicking outside
const vClickOutside = {
  mounted(el, binding) {
    el.clickOutsideEvent = (event) => {
      // Check if the click was outside the dropdown container
      if (!(el === event.target || el.contains(event.target))) {
        // Call the method passed as the value (closeDropdown)
        binding.value()
      }
    }
    document.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted(el) {
    // Crucial: Clean up global listeners to prevent memory leaks!
    document.removeEventListener('click', el.clickOutsideEvent)
  }
}

function closeDropdown() {
  isOpen.value = false
}
</script>

<template>
  <div class="menu-container">
    <button @click="isOpen = !isOpen">Menu</button>
    
    <!-- Using the click-outside directive -->
    <ul v-if="isOpen" v-click-outside="closeDropdown" class="dropdown-list">
      <li>Profile</li>
      <li>Settings</li>
      <li>Logout</li>
    </ul>
  </div>
</template>

<style scoped>
.menu-container { position: relative; display: inline-block; }
.dropdown-list { position: absolute; top: 100%; left: 0; background: white; border: 1px solid #ccc; list-style: none; padding: 10px; }
</style>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Mutating Vue application state inside custom directives

**The mistake:** Directly changing reactive variables or modifying business state inside a custom directive.

**Why it's wrong:** Custom directives are strictly meant for low-level DOM modifications. Modifying business logic or global state inside them makes code execution tracking difficult to follow and creates hidden side-effects.

*Incorrect:*
```javascript
const vSyncState = {
  mounted(el, binding) {
    // Modifying reactive state inside a DOM tool - BAD practice
    binding.instance.someState = el.innerText 
  }
}
```

*Fix:* Keep the state manipulation inside the component and use a Composable, or pass event handlers to the directive to let it notify the component.
```javascript
const vTrackClick = {
  mounted(el, binding) {
    el.addEventListener('click', () => {
      binding.value() // Execute the callback passed by the component
    })
  }
}
```

**Golden Rule:** Custom directives must strictly focus on reading/writing DOM properties and binding event listeners. Keep business logic inside Components and Composables.

---

### Mistake 2: Accessing Component Instance via `this` Inside Custom Directive Hooks

**The mistake:** Attempting to call `this.myMethod()` inside custom directive hook functions (`mounted(el, binding)`).

**Why it's wrong:** Custom directives do NOT bind `this` to component instances. Access component state or methods through `binding.instance`.

*Incorrect:*
```javascript
const vFocus = {
  mounted(el) {
    this.someMethod(); // ❌ 'this' is undefined inside directive hooks!
  }
};
```

*Fix:*
```javascript
const vFocus = {
  mounted(el, binding) {
    binding.instance.someMethod(); // Access component instance via binding.instance
    el.focus();
  }
};
```

---

### Mistake 3: Forgetting `<script setup>` Custom Directive Naming Conventions (`vFocus` -> `v-focus`)

**The mistake:** Naming custom directive variable `focus` instead of `vFocus` inside `<script setup>`.

**Why it's wrong:** In `<script setup>`, any camelCase variable starting with a lowercase `v` (e.g. `vFocus`) is automatically registered as directive `v-focus` in the template.

*Incorrect:*
```vue
<script setup>
const focus = { mounted(el) { el.focus(); } }; // ❌ Fails to register v-focus directive!
</script>
<template><input v-focus></template>
```

*Fix:*
```vue
<script setup>
const vFocus = { mounted(el) { el.focus(); } }; // Correct vFocus camelCase naming
</script>
<template><input v-focus></template>
```


---

## 6. Practice Exercises

### Exercise 1: Build a Highlight Directive with arguments

**Problem:** Create a custom directive called `vHighlight` that changes the background color of an element. The directive should support a custom color argument (e.g. `v-highlight:yellow`) or default to lightblue if no argument is passed.

**Expected output:**
> [!check]- Answer
> ```html
> <p v-highlight:yellow>This will have a yellow background.</p>
> <p v-highlight>This will have a lightblue background.</p>
> ```
> - The binding argument can be read from `binding.arg`.
> - Apply the background color inside the `mounted` hook using `el.style.backgroundColor = binding.arg || 'lightblue'`.
> 
---

### Exercise 2: Custom Directive Autofocus Pattern

**Problem:** Write a custom directive `vFocus` inside `<script setup>` that automatically focuses an `<input>` element when mounted.

**Expected output:**
> [!check]- Answer
> ```vue
> <script setup> const vFocus = { mounted: (el) => el.focus() }; </script> <template> <input v-focus /> </template>
> ```
> - Name directive variable starting with `v` (e.g. `vFocus`).
> - Hook `mounted(el)` receives target DOM element.
> 
> ```vue
> <script setup>
> const vFocus = {
>   mounted: (el) => el.focus()
> };
> </script>
> 
> <template>
>   <input v-focus placeholder="Auto-focused" />
> </template>
> ```
> 
---

### Exercise 3: Custom Directive Lifecycle Hooks

**Problem:** List 3 common lifecycle hook functions available inside Vue 3 custom directives.

**Expected output:**
> [!check]- Answer
> ```text
> 1. created(el, binding)
> 2. mounted(el, binding)
> 3. updated(el, binding) (or unmounted)
> ```
> - Directive hooks mirror component DOM lifecycle.
> 
> ```text
> created -> Before element attributes/listeners are applied.
> mounted -> After element is inserted into parent DOM.
> updated -> After component VNode and child VNodes have updated.
> unmounted -> When parent component unmounts.
> ```
> 
> 
---

## 7. Related Terms
- [`v-bind`](v_bind.md) — The standard directive for binding element attributes.
- [Composables](../level_05/composables.md) — The mechanism for reusing stateful JavaScript logic.
- [Component Lifecycle](../level_04/component_lifecycle.md) — The hooks that manage the life cycle of the component.
- [Directives](directives.md) — Related concept: Directives.

---

## 8. Key Takeaways
- **Custom Directives** are custom HTML attributes prefixed with `v-` that execute low-level DOM manipulations on elements.
- In `<script setup>`, naming a variable matching `vNameOfDirective` makes it available as `v-name-of-directive`.
- Directives have hooks corresponding to DOM cycles (`mounted`, `updated`, `unmounted`, etc.).
- The hooks receive raw DOM elements (`el`) and `binding` contexts (value, argument, modifiers).
- Use them strictly for DOM-oriented features (focusing, scrolling, animations, event triggers); keep reactive state in Composables.
