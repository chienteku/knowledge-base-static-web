# Custom Directives (`v-*`)

> **Level 3 — Directives & Template Features**
> User-defined attributes that execute low-level DOM access and manipulation by running custom hook functions directly on a target DOM element.

---

## 1. Prerequisites

- [Directives](directives.md) — The built-in directive system.
- [Component Lifecycle](../level_04/component_lifecycle.md) — Component lifecycle phases.

---

## 2. Term Category

**Template Extension (DOM Lifecycle Hooking)**: Custom directives represent Vue's explicit escape hatch for encapsulated, reusable DOM manipulation attached directly to template elements. Unlike components which encapsulate UI subtrees, custom directives encapsulate low-level DOM behavior—such as auto-focusing, viewport intersection monitoring, or custom formatting—without introducing extra Virtual DOM nodes. Executed primarily in client-side browser DOM contexts, custom directives bridge raw DOM APIs (`HTMLInputElement`, `IntersectionObserver`, `ResizeObserver`) with Vue's declarative template syntax.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In Vue application architecture, the primary imperative is state-driven declarative rendering. Developers are advised to let Vue manage the DOM via template bindings (`v-bind`, `v-model`, `v-if`). However, standard web applications inevitably require low-level DOM interactions that standard template bindings cannot cleanly capture:

1. Auto-focusing form inputs dynamically when modals or search bars appear.
2. Lazy-loading heavy images or triggering animations when elements enter the browser viewport.
3. Detecting clicks outside a dropdown menu container to trigger closure callbacks.
4. Binding complex third-party non-Vue JavaScript libraries (like tooltip handlers or canvas rotators) directly to DOM nodes.

While a developer could achieve these using a `ref()` and calling manual DOM logic inside `onMounted()`, doing so traps that DOM logic inside a specific component. Copying template refs across dozens of form fields creates messy duplication. Custom Directives solve this by abstracting DOM manipulation into declarative, reusable template attributes prefixed with `v-`.

### (2) Reality Metaphor

Imagine an automated fulfillment warehouse where package boxes travel along a conveyor belt. Standard Vue components represent the boxes themselves—they define the structure and content of what is being transported. 

A **Custom Directive** is like attaching a specialized physical device—a barcode scanner, a temperature sensor, or a robotic stamper—directly to a specific conveyor station. The sensor doesn't alter the box's structural design; instead, it hooks onto the box at specific lifecycle moments (when it arrives, updates position, or exits the station) to inspect, focus, stamp, or attach external events to that exact box.

### (3) Vue Code Examples

#### Short Snippet
```vue
<script setup>
// Naming variable starting with 'v' registers 'v-focus' directive in template
const vFocus = {
  mounted: (el) => el.focus()
}
</script>

<template>
  <!-- Direct DOM focus when input enters the DOM -->
  <input v-focus placeholder="Auto-focused input..." />
</template>
```

#### Fuller Example
```vue
<script setup>
import { ref } from 'vue'

const isDropdownOpen = ref(false)

// Custom directive to close element when clicking outside its DOM tree
const vClickOutside = {
  mounted(el, binding) {
    el.clickOutsideEvent = (event) => {
      // Check if click occurred outside the target element and its children
      if (!(el === event.target || el.contains(event.target))) {
        // Execute callback function passed as directive value
        binding.value(event)
      }
    }
    document.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted(el) {
    // Prevent memory leaks by removing global event listener on unmount
    document.removeEventListener('click', el.clickOutsideEvent)
  }
}

function closeDropdown() {
  isDropdownOpen.value = false
}
</script>

<template>
  <div class="dropdown-wrapper">
    <button @click.stop="isDropdownOpen = !isDropdownOpen">
      Toggle Menu
    </button>

    <ul 
      v-if="isDropdownOpen" 
      v-click-outside="closeDropdown" 
      class="menu"
    >
      <li>Account Settings</li>
      <li>Billing Options</li>
      <li>Sign Out</li>
    </ul>
  </div>
</template>

<style scoped>
.dropdown-wrapper { position: relative; display: inline-block; }
.menu { position: absolute; top: 100%; left: 0; background: #fff; border: 1px solid #ccc; list-style: none; padding: 8px; }
</style>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Mutating Vue application business state inside custom directive hooks

**The mistake:** Modifying business logic or mutating global reactive state directly inside custom directive lifecycle hooks (`mounted`, `updated`).

**Why it's wrong:** Custom directives are strictly meant for low-level DOM side-effects. Mutating business state inside directive hooks creates hidden side-effects that decouple state mutations from component logic, making debugging extremely difficult.

*Incorrect:*
```javascript
const vSyncState = {
  mounted(el, binding) {
    // Mutating business state inside a directive - BAD practice!
    binding.instance.userProfileName = el.innerText
  }
}
```

*Fix:*
```javascript
const vTrackClick = {
  mounted(el, binding) {
    el.addEventListener('click', () => {
      // Pass execution back to component method via binding value
      binding.value()
    })
  }
}
```

---

### Mistake 2: Accessing component instance via `this` inside directive hooks

**The mistake:** Attempting to call `this.someMethod()` inside custom directive hook functions.

**Why it's wrong:** Directive hooks receive explicit arguments `(el, binding, vnode, prevVnode)`. They do not bind `this` to the component instance. Calling `this` results in `undefined`.

*Incorrect:*
```javascript
const vHighlight = {
  mounted(el) {
    this.applyTheme(); // ❌ 'this' is undefined inside directive hooks!
  }
}
```

*Fix:*
```javascript
const vHighlight = {
  mounted(el, binding) {
    // Access component instance via binding.instance
    binding.instance.applyTheme();
  }
}
```

---

### Mistake 3: Invalid directive variable naming in `<script setup>`

**The mistake:** Declaring `const focusDirective = { mounted(el) { el.focus() } }` inside `<script setup>` and using `v-focus` in template.

**Why it's wrong:** In `<script setup>`, Vue looks for camelCase variables starting with a lowercase `v` (e.g. `vFocus`). Variable names not following this convention are not auto-registered as template directives.

*Incorrect:*
```vue
<script setup>
const focusDirective = { mounted(el) { el.focus(); } }; // ❌ Fails to register v-focus!
</script>
<template><input v-focus /></template>
```

*Fix:*
```vue
<script setup>
const vFocus = { mounted(el) { el.focus(); } }; // Correct vFocus camelCase naming
</script>
<template><input v-focus /></template>
```

---

## 5. Practice Exercises

### Exercise 1: Industrial IoT Telemetry Warning Flasher (IoT)

**Scenario:** In an industrial monitoring center, sensor status tiles must visually flash red when critical sensor readings exceed threshold parameters. You need to construct a custom directive `vFlashAlert` that applies an animated CSS flashing state when telemetry data exceeds danger thresholds.

**Requirements:**
1. Create a directive `vFlashAlert` that accepts a boolean payload (e.g. `v-flash-alert="isCritical"`).
2. Apply a CSS highlight class `telemetry-alarm` when value is `true`, and remove it when `false`.
3. Handle updates dynamically in the `updated` hook.
4. Clean up inline styles or timers upon element unmounting.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref } from 'vue'
> 
> const turbineTemp = ref(85)
> 
> const vFlashAlert = {
>   mounted(el, binding) {
>     if (binding.value) {
>       el.classList.add('telemetry-alarm')
>     }
>   },
>   updated(el, binding) {
>     if (binding.value !== binding.oldValue) {
>       if (binding.value) {
>         el.classList.add('telemetry-alarm')
>       } else {
>         el.classList.remove('telemetry-alarm')
>       }
>     }
>   },
>   unmounted(el) {
>     el.classList.remove('telemetry-alarm')
>   }
> }
> 
> // Test simulation assertion
> function simulateThermalSpike() {
>   turbineTemp.value = 105 // Triggers updated hook
> }
> </script>
> 
> <template>
>   <div class="sensor-card">
>     <h3>Turbine #4 Temperature</h3>
>     <p v-flash-alert="turbineTemp > 100" class="temp-readout">
>       {{ turbineTemp }} °C
>     </p>
>     <button @click="simulateThermalSpike">Simulate Thermal Spike</button>
>   </div>
> </template>
> 
> <style scoped>
> .temp-readout { padding: 10px; font-weight: bold; }
> .telemetry-alarm { background-color: #ff4d4f; color: white; animation: blink 1s infinite; }
> @keyframes blink { 50% { opacity: 0.5; } }
> </style>
> ```
>
> #### Technical Explanation
> 1. **Concept**: `vFocus`/`vFlashAlert` naming inside `<script setup>` auto-registers the directive for template usage.
> 2. **Concept**: The `mounted` hook runs when the element enters the DOM, evaluating initial boolean binding values.
> 3. **Concept**: The `updated` hook inspects `binding.value` vs `binding.oldValue` to update class lists responsively without re-creating nodes.
> 4. **Concept**: The `unmounted` hook performs DOM teardown to ensure clean state reset.
> 
---

### Exercise 2: Financial Currency Input Masking Directive (Finance)

**Scenario:** A trading application requiring input fields for currency trades must automatically format numerical user input into currency strings (e.g., `$1,250.00`) on blur and display unformatted numbers on focus.

**Requirements:**
1. Build `vCurrencyMask` directive to handle input focus and blur listeners.
2. Format raw number input to USD currency format using `Intl.NumberFormat` on blur.
3. Restore raw input value on element focus for user editing.
4. Clean up listener attachments during unmount phase.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref } from 'vue'
> 
> const tradeAmount = ref(1250)
> 
> const vCurrencyMask = {
>   mounted(el) {
>     const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
>     
>     el._onFocus = () => {
>       if (el._rawValue !== undefined) {
>         el.value = el._rawValue
>       }
>     }
>     
>     el._onBlur = () => {
>       el._rawValue = el.value
>       const numericVal = parseFloat(el.value.replace(/[^0-9.-]+/g, ''))
>       if (!isNaN(numericVal)) {
>         el.value = formatter.format(numericVal)
>       }
>     }
>     
>     el.addEventListener('focus', el._onFocus)
>     el.addEventListener('blur', el._onBlur)
>     el._onBlur() // Initial format
>   },
>   unmounted(el) {
>     el.removeEventListener('focus', el._onFocus)
>     el.removeEventListener('blur', el._onBlur)
>   }
> }
> </script>
> 
> <template>
>   <div class="trade-form">
>     <label>Order Amount</label>
>     <input v-currency-mask v-model="tradeAmount" type="text" />
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: Attaching references (`el._onFocus`) to the target DOM element preserves callback identity for subsequent removal.
> 2. **Concept**: `Intl.NumberFormat` provides high-performance localized formatting directly within DOM event handlers.
> 3. **Concept**: Directives intercept DOM `focus` and `blur` events without altering parent component state management.
> 4. **Concept**: Lifecycle cleanup in `unmounted` prevents detached DOM node listener leaks.
> 
---

### Exercise 3: E-Commerce Product Image Lazy Loader (E-commerce)

**Scenario:** An online store catalog with hundreds of items needs to defer loading high-resolution product images until the images enter the browser viewport to optimize bandwidth.

**Requirements:**
1. Create a `vLazySrc` directive receiving image URL string as binding value.
2. Utilize native browser `IntersectionObserver` to detect when element enters viewport.
3. Assign binding URL to `el.src` once intersecting, then disconnect observer.
4. Clean up observer in directive `unmounted` hook.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref } from 'vue'
> 
> const products = ref([
>   { id: 1, title: 'Pro Headphones', img: 'https://via.placeholder.com/400?text=Headphones' },
>   { id: 2, title: 'Smart Watch', img: 'https://via.placeholder.com/400?text=Watch' }
> ])
> 
> const vLazySrc = {
>   mounted(el, binding) {
>     el.observer = new IntersectionObserver((entries) => {
>       entries.forEach((entry) => {
>         if (entry.isIntersecting) {
>           el.src = binding.value
>           el.observer.disconnect()
>         }
>       })
>     })
>     el.observer.observe(el)
>   },
>   unmounted(el) {
>     if (el.observer) {
>       el.observer.disconnect()
>     }
>   }
> }
> </script>
> 
> <template>
>   <div class="catalog">
>     <div v-for="product in products" :key="product.id" class="card">
>       <img v-lazy-src="product.img" src="placeholder.png" alt="Product Thumbnail" />
>       <h4>{{ product.title }}</h4>
>     </div>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: `IntersectionObserver` provides hardware-accelerated viewport detection integrated cleanly inside `mounted`.
> 2. **Concept**: Directives encapsulate browser API interactions away from template rendering logic.
> 3. **Concept**: Storing observer reference on element allows clean unbind cleanup in `unmounted`.
> 4. **Concept**: Directives operate directly on standard DOM properties like `HTMLImageElement.src`.
> 
---

## 6. Related Terms

- [`v-bind`](v_bind.md) — The standard directive for binding element attributes.
- [Composables](../level_05/composables.md) — The mechanism for reusing stateful JavaScript logic.
- [Component Lifecycle](../level_04/component_lifecycle.md) — The hooks that manage the life cycle of the component.
- [Directives](directives.md) — Built-in template directives.

---

## 7. Key Takeaways

- **Custom Directives** are custom attributes prefixed with `v-` that execute low-level DOM manipulations.
- In `<script setup>`, naming a variable `vCamelCase` registers it automatically as `v-kebab-case` directive.
- Directives provide hooks mirroring DOM cycles (`created`, `mounted`, `updated`, `unmounted`).
- Directive hooks receive target element `el` and context object `binding` containing arguments and values.
- Directives must be kept strictly for low-level DOM side-effects, leaving state management to Composables and Pinia.
