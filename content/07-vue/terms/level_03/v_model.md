# `v-model`

> **Level 3 — Directives & Template Features**
> Vue's syntactic sugar directive that establishes automatic Two-Way Data Binding between HTML form inputs (or custom components) and reactive JavaScript state.

---

## 1. Prerequisites

- [`v-bind`](v_bind.md) — Binds JavaScript data down to HTML attributes (One-way).
- [`v-on`](v_on.md) — Listens to DOM events from HTML to JavaScript (One-way).

---

## 2. Term Category

**Form Binding Directive (Syntactic Sugar for Two-Way Binding)**: `v-model` is Vue's dedicated abstraction for synchronizing state between view form elements (`<input>`, `<textarea>`, `<select>`, custom components) and JavaScript reactivity objects. Rather than operating as a distinct reactivity engine, `v-model` acts as compile-time syntactic sugar that expands into a downward `v-bind` (`:value` or `:checked`) paired with an upward `v-on` event listener (`@input` or `@change`). Executed in browser client contexts, `v-model` handles cross-browser form element quirks automatically.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In traditional web applications or frameworks like React, binding form inputs to application state requires writing "Controlled Components" with explicit boilerplate. For every single form field, developers must write two separate bindings:
1. Pushing state down to the input: `value={username}`
2. Listening to user keystrokes to mutate state: `onChange={e => setUsername(e.target.value)}`

In a complex registration form with 20 input fields, writing 40 individual property and event bindings creates overwhelming, repetitive boilerplate code. 

Vue introduced **`v-model`** to solve form synchronization declaratively. By writing `v-model="username"`, Vue automatically expands the directive at compile time into both the downward attribute binding and the upward event listener simultaneously. Furthermore, `v-model` intelligently detects element types: tracking `.value` and `@input` on text boxes, `.checked` and `@change` on checkboxes, and array selections on multi-select dropdowns.

### (2) Reality Metaphor

Imagine a walkie-talkie communication link between a dispatcher at central command and a field agent in the city.

A one-way binding like `v-bind` is like a continuous loudspeaker broadcast from central command to the agent—the agent hears dispatcher updates, but cannot talk back into the loudspeaker. A one-way listener like `v-on` is like an emergency distress button pressed by the agent—it sends a signal to command, but cannot transmit command audio down to the agent.

**`v-model`** is like placing a full-duplex two-way radio headset on both the dispatcher and the field agent. When central command speaks (JavaScript state mutates), the agent's earpiece speaks immediately (the input box text updates). When the agent speaks (the user types in the input box), central command hears it in real time (the reactive JavaScript variable mutates). Both sides remain continuously in sync over a single communication channel.

### (3) Vue Code Examples

#### Short Snippet
```vue
<script setup>
import { ref } from 'vue'

const username = ref('')
</script>

<template>
  <!-- v-model expands automatically to :value="username" and @input="username = $event.target.value" -->
  <input v-model="username" placeholder="Enter username..." />
  <p>Live Profile Preview: {{ username }}</p>
</template>
```

#### Fuller Example
```vue
<script setup>
import { ref } from 'vue'

const formData = ref({
  accountName: '',
  planTier: 'pro',
  agreeToTerms: false,
  selectedFeatures: []
})

function submitAccount() {
  console.log('Submitting payload:', JSON.stringify(formData.value))
}
</script>

<template>
  <form class="account-form" @submit.prevent="submitAccount">
    <h3>Create Enterprise Account</h3>

    <!-- Text input -->
    <label>Account Name</label>
    <input v-model.trim="formData.accountName" type="text" placeholder="Acme Corp" />

    <!-- Radio selection -->
    <label>Subscription Tier</label>
    <div class="radio-group">
      <input v-model="formData.planTier" type="radio" value="basic" id="tier-basic" />
      <label for="tier-basic">Basic</label>

      <input v-model="formData.planTier" type="radio" value="pro" id="tier-pro" />
      <label for="tier-pro">Pro</label>
    </div>

    <!-- Multi-checkbox array binding -->
    <label>Add-on Features</label>
    <div class="checkbox-group">
      <input v-model="formData.selectedFeatures" type="checkbox" value="analytics" id="feat-analytics" />
      <label for="feat-analytics">Advanced Analytics</label>

      <input v-model="formData.selectedFeatures" type="checkbox" value="sso" id="feat-sso" />
      <label for="feat-sso">SAML SSO</label>
    </div>

    <!-- Single boolean checkbox -->
    <div class="terms">
      <input v-model="formData.agreeToTerms" type="checkbox" id="terms-check" />
      <label for="terms-check">I agree to Terms of Service</label>
    </div>

    <button type="submit" :disabled="!formData.agreeToTerms">Register Account</button>
  </form>
</template>

<style scoped>
.account-form { display: flex; flex-direction: column; gap: 12px; max-width: 400px; }
.radio-group, .checkbox-group { display: flex; gap: 12px; }
</style>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Binding `v-model` to non-reactive primitive variables

**The mistake:** Writing `let username = 'Alice'` in `<script setup>` and binding `<input v-model="username">`.

**Why it's wrong:** `v-model` requires a Vue Reactivity target (`ref()`, `reactive()` property, or Pinia store state) so that input mutations can trigger Virtual DOM updates. Binding to plain raw JS variables breaks UI re-renders.

*Incorrect:*
```vue
<script setup>
let username = 'Alice'; // ❌ Plain non-reactive variable!
</script>
<template><input v-model="username" /></template>
```

*Fix:*
```vue
<script setup>
import { ref } from 'vue'
const username = ref('Alice'); // Reactive ref wrapper
</script>
<template><input v-model="username" /></template>
```

---

### Mistake 2: Direct prop mutation inside child component custom `v-model` handlers

**The mistake:** A child component receiving prop `modelValue` writing `props.modelValue = newValue` inside input handlers.

**Why it's wrong:** Vue enforces strict One-Way Data Flow. Props are read-only proxies. Direct prop mutations throw console warnings (`Set operation on key "modelValue" failed: target is readonly`). Emits or `defineModel()` must be used.

*Incorrect:*
```javascript
const props = defineProps(['modelValue'])
function onInput(e) {
  props.modelValue = e.target.value // ❌ Readonly prop mutation warning!
}
```

*Fix:*
```javascript
// Vue 3.4+ defineModel macro handles 2-way component binding automatically:
const model = defineModel() // Mutate model.value directly in child
```

---

### Mistake 3: Omitting `.number` modifier on numeric HTML inputs

**The mistake:** Expecting `<input type="number" v-model="age">` to store `age` as a JavaScript `Number`.

**Why it's wrong:** Standard HTML `<input type="number">` elements return string values in native DOM input events (`"25"` instead of `25`). Use `v-model.number="age"` to automatically typecast strings to JS numbers.

*Incorrect:*
```vue
<input type="number" v-model="age" /> <!-- Stores string '25' in age state -->
```

*Fix:*
```vue
<input type="number" v-model.number="age" /> <!-- Typecasts input string to JS Number -->
```

---

## 5. Practice Exercises

### Exercise 1: Industrial IoT Telemetry Threshold Configuration Form (IoT)

**Scenario:** An industrial pump controller configuration screen allows operators to set pressure threshold limits via numeric inputs, select operational modes via radio buttons, and toggle emergency shutoff switches via checkboxes.

**Requirements:**
1. Bind numeric input `maxPressure` using `v-model.number`.
2. Bind operational mode `opMode` ('AUTO', 'MANUAL') using radio inputs.
3. Bind emergency shutoff boolean `emergencyStop` using single checkbox.
4. Output JSON preview of configuration state.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref } from 'vue'
> 
> const maxPressure = ref(120)
> const opMode = ref('AUTO')
> const emergencyStop = ref(false)
> </script>
> 
> <template>
>   <div class="config-panel">
>     <h3>Pump Configuration</h3>
> 
>     <label>Max Pressure Limit (PSI):</label>
>     <input v-model.number="maxPressure" type="number" />
> 
>     <label>Operation Mode:</label>
>     <div>
>       <input v-model="opMode" type="radio" value="AUTO" id="mode-auto" />
>       <label for="mode-auto">Auto</label>
>       
>       <input v-model="opMode" type="radio" value="MANUAL" id="mode-manual" />
>       <label for="mode-manual">Manual</label>
>     </div>
> 
>     <div>
>       <input v-model="emergencyStop" type="checkbox" id="e-stop" />
>       <label for="e-stop">Enable Emergency Auto-Stop</label>
>     </div>
> 
>     <pre>{{ { maxPressure, opMode, emergencyStop } }}</pre>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: `v-model.number` automatically typecasts input string numbers into JS numerical primitives.
> 2. **Concept**: `v-model` on radio inputs binds shared state to `value` attributes.
> 3. **Concept**: `v-model` on single checkboxes binds state to boolean `checked` properties.
> 4. **Concept**: Reactive state changes synchronize views automatically.
> 
---

### Exercise 2: Financial Currency Converter Two-Way Binding (Finance)

**Scenario:** A currency conversion utility allows users to input amounts in USD or EUR, automatically recalculating the opposite currency value live as the user types.

**Requirements:**
1. Bind USD input using `v-model.number`.
2. Compute EUR input dynamically using computed getter/setter or explicit watcher updates.
3. Demonstrate two-way data flow cleanly.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, computed } from 'vue'
> 
> const usdAmount = ref(100)
> const exchangeRate = 0.92 // 1 USD = 0.92 EUR
> 
> const eurAmount = computed({
>   get: () => parseFloat((usdAmount.value * exchangeRate).toFixed(2)),
>   set: (val) => {
>     usdAmount.value = parseFloat((val / exchangeRate).toFixed(2))
>   }
> })
> </script>
> 
> <template>
>   <div class="converter">
>     <h3>Currency Exchange Calculator</h3>
>     <div>
>       <label>USD ($)</label>
>       <input v-model.number="usdAmount" type="number" step="0.01" />
>     </div>
> 
>     <div>
>       <label>EUR (€)</label>
>       <input v-model.number="eurAmount" type="number" step="0.01" />
>     </div>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: `v-model` works seamlessly with writable computed properties containing `get()` and `set()` functions.
> 2. **Concept**: Typing in `usdAmount` triggers computed `get()`, updating EUR field.
> 3. **Concept**: Typing in `eurAmount` triggers computed `set()`, updating `usdAmount` ref back.
> 4. **Concept**: `v-model.number` ensures arithmetic calculations receive numbers, not strings.
> 
---

### Exercise 3: E-Commerce Custom Component v-model with Vue 3.4+ defineModel (E-commerce)

**Scenario:** An e-commerce product page features a custom numeric stepper component `<QuantitySelector>` that requires two-way `v-model` binding with parent cart state.

**Requirements:**
1. Build `QuantitySelector.vue` using Vue 3.4+ `defineModel()` compiler macro.
2. Implement increment and decrement buttons inside child component.
3. Bind child component in parent using `v-model="cartQty"`.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <!-- QuantitySelector.vue (Child Component) -->
> <script setup>
> // Vue 3.4+ defineModel handles two-way prop/emit binding automatically
> const quantity = defineModel({ type: Number, default: 1 })
> 
> function decrement() {
>   if (quantity.value > 1) quantity.value--
> }
> function increment() {
>   quantity.value++
> }
> </script>
> 
> <template>
>   <div class="quantity-stepper">
>     <button @click="decrement">-</button>
>     <span>{{ quantity }}</span>
>     <button @click="increment">+</button>
>   </div>
> </template>
> ```
> 
> ```vue
> <!-- Parent.vue -->
> <script setup>
> import { ref } from 'vue'
> import QuantitySelector from './QuantitySelector.vue'
> 
> const cartQty = ref(2)
> </script>
> 
> <template>
>   <div class="cart-item">
>     <h4>Wireless Headphones</h4>
>     <!-- 2-Way Component Binding -->
>     <QuantitySelector v-model="cartQty" />
>     <p>Subtotal: ${{ cartQty * 99 }}</p>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: Vue 3.4+ `defineModel()` macro declares model props and emits automatically in child components.
> 2. **Concept**: Mutating `quantity.value` inside child emits `update:modelValue` to parent automatically.
> 3. **Concept**: Parent uses clean `v-model="cartQty"` syntax without verbose `:modelValue` and `@update:modelValue` handlers.
> 4. **Concept**: Enforces One-Way Data Flow under the hood while maintaining clean DX.
> 
---

## 6. Related Terms

- [`v-bind`](v_bind.md) — One-way downward attribute binding.
- [`v-on`](v_on.md) — One-way upward event listening.
- [Event, Key & Form Modifiers](modifiers.md) — Suffixes for input sync timing (`.lazy`, `.number`, `.trim`).
- [Directives](directives.md) — Built-in directives.

---

## 7. Key Takeaways

- **`v-model`** provides **Two-Way Data Binding** between Vue state and form inputs/components.
- It is compile-time syntactic sugar expanding into `:value` (or `:checked`) and `@input` (or `@change`).
- It automatically adapts to input types (text, radio, checkbox, select).
- Use `v-model.number` on numeric inputs to typecast string inputs to JS numbers.
- Vue 3.4+ `defineModel()` macro simplifies building custom component two-way `v-model` bindings.
