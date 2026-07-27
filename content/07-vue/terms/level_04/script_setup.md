# `<script setup>` & Compiler Macros

> **Level 4 — Components & Props**
> A compile-time syntactic sugar for using the Composition API in Single-File Components (SFCs), paired with global helper functions (compiler macros) to declare component options without runtime import overhead.

---

## 1. Prerequisites
- [Composition API](../level_01/composition_api.md) — The functional state-management model.
- [Components](../level_04/components.md) — The visual units of a Vue application.
- [SFCs](../level_04/sfc.md) — Single-File Components (`.vue` files).

---

## 2. Term Category
- **Vue Core Concept**

---

## 3. Environment Context
- **Composition API (`<script setup>`)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When Vue 3 first launched, the Composition API was written inside a standard component configuration object using a `setup()` function:

```javascript
// Classic Vue 3 Composition API setup (verbose)
export default {
  setup() {
    const count = ref(0)
    const increment = () => count.value++
    
    // Boilerplate: Everything must be explicitly returned to be used in template!
    return { count, increment }
  }
}
```
This approach suffered from two major drawbacks:
1. **Redundancy:** You had to declare variables, write functions, and then duplicate their names inside a large `return {}` block at the bottom of the script.
2. **Import Overhead:** Common component features (like defining props or emits) required importing heavy helper functions or mixing the Options API with the Composition API.

To fix these problems, Vue introduced **`<script setup>`**. It is a compiler-level upgrade. Instead of writing a function that returns an object, you write normal JavaScript. The compiler handles the mapping, making all top-level variables and functions automatically visible to the HTML template.

To go alongside this, Vue introduced **Compiler Macros**. These are special global helper functions that provide declarations for props, events, model bindings, and exposures directly to Vue's compiler, bypassing JavaScript runtime imports.

### (2) How it works under the hood
When Vue compiles a `.vue` file containing `<script setup>`:
1. It parses the script content and identifies all top-level imports, variable declarations, and function declarations.
2. It generates a standard `setup()` function wrapper.
3. Any variable or import referenced inside the `<template>` is automatically returned in the compiled `setup()` return object.
4. **Compiler Macros** (`defineProps`, `defineEmits`, `defineExpose`, `defineModel`) are intercepted during compile time. The compiler extracts the options, creates the appropriate underlying configuration definitions (like the runtime `props` array), and removes the macro call from the final runtime javascript bundle.

Because they are processed entirely by the compiler, **you do not need to import compiler macros from `'vue'`**.

### (3) Code Examples

#### Short Snippet
A simple child component declaring props and emitting events without any manual setup returns or imports:
```vue
<script setup>
// Compiler Macros are globally available - NO imports needed!
const props = defineProps({
  title: String
})

const emit = defineEmits(['close'])
</script>

<template>
  <div class="card">
    <h3>{{ title }}</h3>
    <button @click="emit('close')">X</button>
  </div>
</template>
```

#### Fuller Example
In this parent-child interaction, the child component exposes specific functions to the parent via `defineExpose`, and the child handles two-way data binding using `defineModel` (available in Vue 3.4+).

```vue
<!-- Child: Modal.vue -->
<script setup>
import { ref } from 'vue'

// 1. defineModel: Auto-coordinates v-model binding with the parent
const isOpen = defineModel({ type: Boolean, default: false })

function openModal() { isOpen.value = true }
function closeModal() { isOpen.value = false }

// 2. defineExpose: Explicitly expose methods to parent refs
defineExpose({
  openModal,
  closeModal
})
</script>

<template>
  <div v-if="isOpen" class="modal">
    <p>Modal Content</p>
    <button @click="closeModal">Close</button>
  </div>
</template>
```

```vue
<!-- Parent: App.vue -->
<script setup>
import { ref } from 'vue'
import Modal from './Modal.vue'

// Reference to child component instance
const modalRef = ref(null)

function triggerOpen() {
  // Accessing the exposed method on the child component
  modalRef.value.openModal()
}
</script>

<template>
  <div>
    <button @click="triggerOpen">Open Modal Instance</button>
    <Modal ref="modalRef" />
  </div>
</template>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Importing `defineProps` or `defineEmits` from `'vue'`

**The mistake:** A developer writes `import { defineProps } from 'vue'` at the top of their component.

**Why it's wrong:** Compiler macros are compile-time directives, not runtime libraries. Importing them will result in warning alerts in local dev tools, and can fail depending on compiler strictness.

*Incorrect:*
```vue
<script setup>
import { defineProps } from 'vue' // Wrong: Do not import!
defineProps(['label'])
</script>
```

*Fix:* Use them directly as global functions.
```vue
<script setup>
defineProps(['label']) // Correct: Globally available
</script>
```

**Golden Rule:** Never write imports for `defineProps`, `defineEmits`, `defineExpose`, or `defineModel`. They are compiler-only macros.

---

### Mistake 2: Attempting to Import `defineProps` or `defineEmits` (Compiler Macro Warning)

**The mistake:** Writing `import { defineProps, defineEmits } from 'vue'` inside `<script setup>`.

**Why it's wrong:** `defineProps`, `defineEmits`, `defineExpose`, `defineOptions`, and `defineModel` are **compiler macros** automatically processed at build time. Importing them explicitly causes a compile warning.

*Incorrect:*
```vue
<script setup>
import { defineProps } from 'vue'; // ❌ Unnecessary import warning!
</script>
```

*Fix:*
```vue
<script setup>
// Use compiler macros directly without importing from 'vue':
const props = defineProps(['title']);
</script>
```

---

### Mistake 3: Expecting Child Component Private Variables to Be Accessible via Parent Template Ref Without `defineExpose()`

**The mistake:** Attempting to call `childRef.value.secretMethod()` on a `<script setup>` child component.

**Why it's wrong:** Components using `<script setup>` are **closed by default**. Parent components accessing template refs cannot see internal variables unless explicitly exposed using `defineExpose({ secretMethod })`.

*Incorrect:*
```vue
// Child.vue
<script setup>
const count = ref(0);
// ❌ Parent calling childRef.value.count gets undefined!
</script>
```

*Fix:*
```vue
// Child.vue
<script setup>
const count = ref(0);
defineExpose({ count }); // Explicitly expose properties to parent template refs
</script>
```


---

## 6. Practice Exercises

### Exercise 1: Migrating setup() code to `<script setup>`

**Problem:** Convert this legacy-style Composition API component to modern `<script setup>` syntax.

```vue
<script>
import { ref } from 'vue'

export default {
  props: {
    message: String
  },
  emits: ['acknowledge'],
  setup(props, { emit }) {
    const isSeen = ref(false)
    
    function clickHandler() {
      isSeen.value = true
      emit('acknowledge')
    }
    
    return {
      isSeen,
      clickHandler
    }
  }
}
</script>

<template>
  <div>
    <p>{{ message }} (Seen: {{ isSeen }})</p>
    <button @click="clickHandler">Got it</button>
  </div>
</template>
```

**Expected output:**
```text
The script block rewritten in under 15 lines of clean, modern <script setup> code, omitting any 'return' or 'export default' blocks.
```

> [!check]- Answer
> - Start your script block with `<script setup>`.
> - Replace `props` declaration with `const props = defineProps(...)`.
> - Replace `emit` extraction with `const emit = defineEmits(...)`.
> - Remove the `setup()` function structure and the `return` statement entirely.

---

### Exercise 2: defineExpose Pattern

**Problem:** Write child component `<script setup>` exposing method `resetForm()` to parent template refs using `defineExpose()`.

**Expected output:**
```vue
<script setup> function resetForm() { /* reset */ } defineExpose({ resetForm }); </script>
```

> [!check]- Answer
> - `<script setup>` components are closed by default.
> - `defineExpose()` exposes public instance methods.
> 
> ```vue
> <script setup>
> function resetForm() {
>   // Form reset logic
> }
> 
> defineExpose({ resetForm });
> </script>
> ```

---

### Exercise 3: defineOptions Macro Purpose

**Problem:** Which compiler macro allows declaring Options API options (like `name` or `inheritAttrs`) directly inside `<script setup>`?

**Expected output:**
```text
defineOptions({ name: 'CustomName', inheritAttrs: false })
```

> [!check]- Answer
> ```javascript
> defineOptions({
> name: 'CustomButton',
> inheritAttrs: false
> });
> ```
> - **Explanation:** `defineOptions()` declares component-level options in `<script setup>`.
---

## 7. Related Terms
- [Composition API](../level_01/composition_api.md) — The underlying reactivity paradigm.
- [Props](../level_04/props.md) — Custom configuration values passed into components.
- [Emitting Events](../level_04/emit.md) — Raising custom DOM and application triggers.

---

## 8. Key Takeaways
- **`<script setup>`** is compile-time syntactic sugar that eliminates the return statements and registration blocks of standard setup.
- All top-level imports, constants, and functions are automatically bound to the template view.
- **Compiler Macros** (like `defineProps` and `defineEmits`) are processed during build compilation and require no imports from `'vue'`.
- **`defineExpose`** controls what methods or references are exposed to parent component refs, keeping components closed by default.
- **`defineModel`** simplifies two-way parent-child binding configurations.
