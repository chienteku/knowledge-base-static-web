# `<script setup>` & Compiler Macros

> **Level 4 — Components & Lifecycle**
> A compile-time syntactic sugar transformation for using the Composition API inside Single-File Components (SFCs), paired with compiler macros to declare component options without runtime imports.

---

## 1. Prerequisites

- [Composition API](../level_01/composition_api.md) — The functional reactivity model powering `<script setup>`.
- [Components](components.md) — The modular building blocks of a Vue application.
- [Single-File Components (SFCs)](sfc.md) — Vue's `.vue` single-file component format.

---

## 2. Term Category

**Build-Time Syntactic Sugar (SFC Compiler Macro Engine)**: `<script setup>` is a specialized compile-time transformation executed by `@vue/compiler-sfc`. Rather than running as a standard runtime script tag, `<script setup>` instructs Vue's compiler to wrap all top-level script statements inside an optimized `setup()` function. Top-level variables, imports, and functions are automatically exposed to the `<template>` view without requiring explicit `return {}` statements. Integrated with globally available **Compiler Macros** (`defineProps`, `defineEmits`, `defineExpose`, `defineModel`, `defineOptions`), `<script setup>` minimizes boilerplate while improving IDE type inference and build compilation speeds.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

When Vue 3 first introduced the Composition API, developers wrote logic inside a standard component object using a `setup()` method:
```javascript
// Classic Vue 3 Composition API setup (verbose)
export default {
  props: ['title'],
  emits: ['close'],
  setup(props, { emit }) {
    const count = ref(0)
    const increment = () => count.value++
    
    // Boilerplate: Everything must be explicitly returned to template!
    return { count, increment }
  }
}
```
This initial design suffered from two major developer experience drawbacks:
1. **Redundant Returns:** Developers had to declare variables, write functions, and then duplicate their names inside a large `return {}` object block at the bottom of `setup()`.
2. **Import Overhead & Mixing:** Declaring props, emits, or component names required mixing Options API syntax blocks with Composition API functions or importing helper methods.

To solve this, Vue created **`<script setup>`**. It is a compiler-level upgrade. Instead of writing a function that returns an object, developers write standard JavaScript at the top level of the script. The Vue compiler handles the scope mapping, automatically exposing all top-level variables, functions, and imports directly to the `<template>` block.

Pairing with this, Vue introduced **Compiler Macros** (`defineProps`, `defineEmits`, `defineExpose`, `defineModel`). These are special global compiler helper directives processed during build compilation—they generate underlying component options and are removed from the final runtime bundle.

### (2) Reality Metaphor

Imagine a commercial television studio broadcasting a live news program.

Writing the old `setup()` function with a `return {}` block is like having news anchors deliver their reports behind closed soundproof booth doors, requiring a stage manager to manually carry written transcripts out of the booth and hand them to camera operators outside before anything can be broadcast onto screen monitors.

**`<script setup>`** is like tearing down the soundproof booth walls entirely. The news anchors deliver their reports directly on the open studio stage floor. Everything created on the open floor (top-level variables, functions, imported components) is immediately visible to the cameras (`<template>`) without needing a stage manager to hand-carry transcript objects out of a booth.

### (3) Vue Code Examples

#### Short Snippet
```vue
<script setup>
import { ref } from 'vue'

// Top-level variables and functions are automatically exposed to <template>
const count = ref(0)

// Compiler macros are globally available - NO IMPORTS NEEDED!
const props = defineProps({ title: String })
const emit = defineEmits(['update'])
</script>

<template>
  <div>
    <h3>{{ title }}: {{ count }}</h3>
    <button @click="count++">Increment</button>
  </div>
</template>
```

#### Fuller Example
```vue
<!-- Modal.vue (Child Component utilizing Compiler Macros) -->
<script setup>
import { ref } from 'vue'

// 1. defineModel (Vue 3.4+): Auto-coordinates two-way v-model with parent
const isOpen = defineModel({ type: Boolean, default: false })

// 2. defineProps: Declares component input props
const props = defineProps({
  title: { type: String, default: 'Modal Dialog' }
})

// 3. defineEmits: Declares custom event emits
const emit = defineEmits(['confirm', 'cancel'])

const internalCounter = ref(0)

function handleConfirm() {
  emit('confirm', { count: internalCounter.value })
  isOpen.value = false
}

// 4. defineExpose: Explicitly expose methods to parent template refs
defineExpose({
  resetCounter: () => { internalCounter.value = 0 }
})
</script>

<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal-card">
      <h3>{{ title }}</h3>
      <p>Internal Counter: {{ internalCounter }}</p>
      <button @click="internalCounter++">Increment Inner State</button>
      
      <div class="actions">
        <button @click="handleConfirm">Confirm</button>
        <button @click="isOpen = false">Close</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: grid; place-items: center; }
.modal-card { background: white; padding: 20px; border-radius: 8px; }
</style>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Explicitly importing compiler macros from `'vue'`

**The mistake:** Writing `import { defineProps, defineEmits } from 'vue'` at the top of a `<script setup>` block.

**Why it's wrong:** Compiler macros (`defineProps`, `defineEmits`, `defineExpose`, `defineOptions`, `defineModel`) are build-time directives processed by `@vue/compiler-sfc`. Explicitly importing them triggers compiler warnings or build alerts.

*Incorrect:*
```vue
<script setup>
import { defineProps } from 'vue'; // ❌ Unnecessary macro import warning!
defineProps(['title']);
</script>
```

*Fix:* Use compiler macros directly as global functions without importing from `'vue'`.
```vue
<script setup>
defineProps(['title']); // Correct global macro usage
</script>
```

---

### Mistake 2: Expecting `<script setup>` private variables to be visible on parent template refs without `defineExpose()`

**The mistake:** Attempting to call `childRef.value.secretMethod()` on a child component using `<script setup>`.

**Why it's wrong:** Components using `<script setup>` are **closed by default**. Parent components accessing template refs cannot see internal variables or functions unless explicitly exposed using `defineExpose({ secretMethod })`.

*Incorrect:*
```vue
<!-- Child.vue -->
<script setup>
const count = ref(0);
// ❌ Parent calling childRef.value.count gets undefined!
</script>
```

*Fix:*
```vue
<!-- Child.vue -->
<script setup>
const count = ref(0);
defineExpose({ count }); // Explicitly expose properties to parent template refs
</script>
```

---

### Mistake 3: Trying to export default objects inside `<script setup>`

**The mistake:** Writing `export default { name: 'MyComponent' }` inside a `<script setup>` block.

**Why it's wrong:** `<script setup>` represents the body of the setup function itself. `export default` statements are forbidden inside `<script setup>`. To declare component options (like `name` or `inheritAttrs`), use the `defineOptions()` compiler macro.

*Incorrect:*
```vue
<script setup>
export default { name: 'MyCard' }; // ❌ Syntax error inside <script setup>!
</script>
```

*Fix:*
```vue
<script setup>
defineOptions({ name: 'MyCard' }); // Valid macro for declaring component options
</script>
```

---

## 5. Practice Exercises

### Exercise 1: Migrating Options API / Setup to `<script setup>` (IoT)

**Scenario:** An industrial IoT sensor tile was originally written in legacy Vue setup format. You must migrate the script block to modern `<script setup>` utilizing `defineProps` and `defineEmits`.

```vue
<!-- Legacy Format -->
<script>
import { ref } from 'vue'
export default {
  props: { sensorName: String },
  emits: ['calibrate'],
  setup(props, { emit }) {
    const reading = ref(42)
    function runCalibration() { emit('calibrate', props.sensorName) }
    return { reading, runCalibration }
  }
}
</script>
```

**Requirements:**
1. Convert to `<script setup>`.
2. Use `defineProps` for `sensorName`.
3. Use `defineEmits` for `calibrate`.
4. Eliminate `export default` and `return {}` blocks.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <!-- Modern <script setup> Migration -->
> <script setup>
> import { ref } from 'vue'
> 
> const props = defineProps({
>   sensorName: String
> })
> 
> const emit = defineEmits(['calibrate'])
> 
> const reading = ref(42)
> 
> function runCalibration() {
>   emit('calibrate', props.sensorName)
> }
> </script>
> 
> <template>
>   <div class="sensor-card">
>     <h3>{{ sensorName }}: {{ reading }}</h3>
>     <button @click="runCalibration">Calibrate Sensor</button>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: `<script setup>` eliminates verbose `setup()` methods and `return {}` object blocks.
> 2. **Concept**: `defineProps` declares input contracts globally without imports.
> 3. **Concept**: `defineEmits` declares event channels cleanly.
> 4. **Concept**: Reduces component boilerplate code by over 50%.
> 
---

### Exercise 2: Financial Trading Order Form with `defineExpose` (Finance)

**Scenario:** A stock order form component `<OrderForm>` contains internal reset methods. The parent order desktop needs to call `orderFormRef.value.resetForm()` when resetting workspace views.

**Requirements:**
1. Build `<OrderForm>` with internal `resetForm()` function.
2. Expose `resetForm` using `defineExpose({ resetForm })`.
3. Parent invokes exposed method via template ref.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <!-- OrderForm.vue (Child) -->
> <script setup>
> import { ref } from 'vue'
> 
> const orderSymbol = ref('AAPL')
> const orderQty = ref(100)
> 
> function resetForm() {
>   orderSymbol.value = ''
>   orderQty.value = 0
>   console.log('Order form reset to defaults.')
> }
> 
> // Explicitly expose resetForm method to parent template refs
> defineExpose({
>   resetForm
> })
> </script>
> 
> <template>
>   <div class="form-box">
>     <input v-model="orderSymbol" placeholder="Symbol" />
>     <input v-model.number="orderQty" type="number" />
>   </div>
> </template>
> ```
> 
> ```vue
> <!-- ParentDesk.vue -->
> <script setup>
> import { ref } from 'vue'
> import OrderForm from './OrderForm.vue'
> 
> const orderFormRef = ref(null)
> 
> function clearWorkspace() {
>   if (orderFormRef.value) {
>     orderFormRef.value.resetForm() // Call exposed child method
>   }
> }
> </script>
> 
> <template>
>   <div>
>     <button @click="clearWorkspace">Clear Workspace</button>
>     <OrderForm ref="orderFormRef" />
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: `<script setup>` components are closed by default.
> 2. **Concept**: `defineExpose()` opens an explicit public interface for template ref consumers.
> 3. **Concept**: Un-exposed internal variables (`orderSymbol`) remain private and un-accessible to parent refs.
> 4. **Concept**: Preserves component encapsulation boundaries.
> 
---

### Exercise 3: Real-Time Network Router Component with `defineOptions` & `defineModel` (Networking)

**Scenario:** A router interface tile component requires setting component name `RouterTile` and disabling attribute inheritance using `defineOptions`, while handling two-way status binding using `defineModel`.

**Requirements:**
1. Declare `defineOptions({ name: 'RouterTile', inheritAttrs: false })`.
2. Declare `const isOnline = defineModel({ type: Boolean })`.
3. Toggle `isOnline.value` on button click.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <!-- RouterTile.vue -->
> <script setup>
> // 1. defineOptions macro for component options
> defineOptions({
>   name: 'RouterTile',
>   inheritAttrs: false
> })
> 
> // 2. defineModel macro for 2-way binding (Vue 3.4+)
> const isOnline = defineModel({ type: Boolean, default: false })
> </script>
> 
> <template>
>   <div class="router-tile">
>     <span>Status: {{ isOnline ? 'Online' : 'Offline' }}</span>
>     <button @click="isOnline = !isOnline">Toggle Interface</button>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: `defineOptions()` replaces classic Options API blocks for declaring `name` or `inheritAttrs`.
> 2. **Concept**: `defineModel()` simplifies component two-way `v-model` binding configurations.
> 3. **Concept**: Compiler macros require zero imports from `'vue'`.
> 4. **Concept**: Streamlines modern Vue 3 SFC component development.
> 
---

## 6. Related Terms

- [Composition API](../level_01/composition_api.md) — The underlying reactivity paradigm.
- [Props](props.md) — `defineProps` compiler macro.
- [Emitting Events (`defineEmits`)](emit.md) — `defineEmits` compiler macro.
- [Single-File Components (SFCs)](sfc.md) — `.vue` single-file component format.
- [TypeScript with Vue](../level_10/typescript_vue.md) — Using `<script setup lang="ts">`.

---

## 7. Key Takeaways

- **`<script setup>`** is compile-time syntactic sugar that wraps script statements inside an optimized `setup()` function.
- All top-level imports, variables, and functions are exposed to `<template>` automatically.
- **Compiler Macros** (`defineProps`, `defineEmits`, `defineExpose`, `defineModel`, `defineOptions`) require NO imports from `'vue'`.
- `<script setup>` components are **closed by default**—use `defineExpose()` to expose methods to parent template refs.
- Use `defineOptions()` to declare component-level options like `name` or `inheritAttrs`.
