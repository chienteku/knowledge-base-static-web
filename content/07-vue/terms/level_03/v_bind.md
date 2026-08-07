# `v-bind`

> **Level 3 — Directives & Template Features**
> A core Vue directive used to dynamically bind JavaScript expressions, reactive variables, or object properties to HTML attributes or component props.

---

## 1. Prerequisites

- [Directives](directives.md) — The category `v-bind` belongs to.
- [Reactive State](../level_02/reactive_state.md) — The data `v-bind` listens to.

---

## 2. Term Category

**Core Data Binding Directive (One-Way Downward Binding)**: `v-bind` is Vue's primary mechanism for enforcing dynamic one-way data binding from JavaScript state down into HTML element attributes (`src`, `href`, `class`, `disabled`, `style`) and component properties (props). Operating at compile-time and runtime Virtual DOM diffing phases, `v-bind` evaluates attribute strings as reactive JavaScript expressions. Unlike React's JSX attribute interpolation, `v-bind` integrates directly into standard HTML template syntax, automatically updating target DOM node properties whenever reactive dependencies trigger patches.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In standard HTML, attribute values are static literal strings. Writing `<img src="userAvatar">` forces the browser to literally request an image file named `"userAvatar"` from the server, producing a 404 error. Standard HTML offers no built-in syntax to indicate that an attribute value should be evaluated as a JavaScript variable.

In early web development with jQuery or Vanilla JS, developers dynamically updated attributes using imperative commands: `element.setAttribute('src', userAvatar)`. This approach was error-prone and decoupled view definitions from script logic.

Vue introduced **`v-bind`** to solve attribute dynamicism declaratively. By prefixing any HTML attribute or component prop with `v-bind:` (or its shorthand `:`), developers instruct Vue: *"Evaluate this attribute string as a reactive JavaScript expression, and automatically patch the underlying DOM attribute whenever the expression's dependencies change."*

### (2) Reality Metaphor

Imagine a physical digital sign outside a parking garage that displays available space counts. 

A static HTML attribute is like painting the number `"42"` permanently onto a wooden sign with blue paint—it will display `"42"` forever regardless of how many cars enter or leave the garage.

**`v-bind`** is like connecting an electronic LED display panel to a digital counter wire. The wooden sign frame (the HTML element structure) remains unchanged, but the numbers displayed on the LED panel (`:count="availableSpaces"`) continuously update in real time whenever sensor signals (reactive state changes) travel down the signal cable.

### (3) Vue Code Examples

#### Short Snippet
```vue
<script setup>
import { ref } from 'vue'

const avatarUrl = ref('https://example.com/avatar.png')
const isDisabled = ref(true)
</script>

<template>
  <!-- v-bind shorthand ':' evaluates variables and booleans dynamically -->
  <img :src="avatarUrl" alt="User Profile Avatar" />
  <button :disabled="isDisabled">Submit Order</button>
</template>
```

#### Fuller Example
```vue
<script setup>
import { ref, computed } from 'vue'

const isThemeDark = ref(true)
const statusType = ref('warning') // 'success', 'warning', 'error'
const customFontSize = ref(16)

// Dynamic style object binding
const inlineStyles = computed(() => ({
  fontSize: `${customFontSize.value}px`,
  borderLeft: '4px solid #faad14'
}))
</script>

<template>
  <div class="panel-container">
    <!-- Class Object & Array binding via v-bind shorthand -->
    <div 
      :class="[
        'card-base', 
        { 'dark-theme': isThemeDark }, 
        `status-${statusType}`
      ]"
      :style="inlineStyles"
    >
      <h3>System Status Monitor</h3>
      <p>Current font size: {{ customFontSize }}px</p>
    </div>

    <button @click="isThemeDark = !isThemeDark">Toggle Theme</button>
    <button @click="customFontSize += 2">Increase Font Size</button>
  </div>
</template>

<style scoped>
.card-base { padding: 16px; border-radius: 6px; background: #f0f0f0; }
.dark-theme { background: #1f1f1f; color: #ffffff; }
.status-warning { border-left-color: #faad14; }
.status-success { border-left-color: #52c41a; }
</style>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting `v-bind` (`:`) when passing non-string prop primitives

**The mistake:** Passing numbers or booleans to child components without `v-bind`: `<VideoPlayer speed="2" is-active="true" />`.

**Why it's wrong:** Without `v-bind` (`:`), Vue treats attributes as static literal STRINGS (`"2"` and `"true"`). A prop expecting a JS `Number` receives string `"2"`, causing type errors during mathematical operations.

*Incorrect:*
```vue
<VideoPlayer speed="2" is-active="true" /> <!-- ❌ Passes string '2' and string 'true'! -->
```

*Fix:*
```vue
<VideoPlayer :speed="2" :is-active="true" /> <!-- Passes JS number 2 and boolean true -->
```

---

### Mistake 2: Mixing mustache syntax inside `v-bind` expressions

**The mistake:** Writing `<img :src="{{ logoUrl }}">`.

**Why it's wrong:** `v-bind` values are already evaluated directly as JavaScript expressions. Adding mustache `{{ }}` inside a `v-bind` expression creates a template compilation syntax error.

*Incorrect:*
```vue
<img :src="{{ logoUrl }}"> <!-- ❌ Template syntax error! -->
```

*Fix:*
```vue
<img :src="logoUrl"> <!-- Plain JS expression -->
```

---

### Mistake 3: Manually binding object keys individually instead of multi-attribute `v-bind`

**The mistake:** Manually binding 10 individual props when a configuration object exists: `:id="user.id" :name="user.name" :email="user.email"...`.

**Why it's wrong:** Writing dozens of individual bindings creates tedious template bloat. `v-bind` without an argument (`v-bind="user"`) automatically binds all key-value pairs of an object as attributes/props simultaneously.

*Incorrect:*
```vue
<UserProfile :id="user.id" :name="user.name" :email="user.email" :role="user.role" />
```

*Fix:*
```vue
<UserProfile v-bind="user" /> <!-- Binds all object key-value pairs at once -->
```

---

## 5. Practice Exercises

### Exercise 1: IoT Sensor Node Telemetry Binding (IoT)

**Scenario:** An IoT dashboard displays environmental sensor nodes. You need to dynamically bind telemetry connection status to element classes, set dynamic SVG indicator colors via inline styles, and disable control buttons when offline.

**Requirements:**
1. Bind boolean `isOnline` to button `:disabled` state.
2. Bind class object applying `online-node` when `isOnline` is true, and `offline-node` when false.
3. Bind inline style `:style="{ fill: signalColor }"` to status SVG.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, computed } from 'vue'
> 
> const isOnline = ref(false)
> const dbmSignal = ref(-75)
> 
> const signalColor = computed(() => {
>   if (!isOnline.value) return '#ff4d4f'
>   return dbmSignal.value > -80 ? '#52c41a' : '#faad14'
> })
> </script>
> 
> <template>
>   <div class="sensor-node" :class="{ 'online-node': isOnline, 'offline-node': !isOnline }">
>     <svg height="20" width="20">
>       <circle cx="10" cy="10" r="8" :style="{ fill: signalColor }" />
>     </svg>
> 
>     <button :disabled="!isOnline" @click="console.log('Sending ping...')">
>       Ping Sensor Node
>     </button>
> 
>     <button @click="isOnline = !isOnline">Toggle Connectivity</button>
>   </div>
> </template>
> 
> <style scoped>
> .sensor-node { padding: 12px; border: 1px solid #ccc; }
> .online-node { border-color: #52c41a; }
> .offline-node { border-color: #ff4d4f; }
> </style>
> ```
>
> #### Technical Explanation
> 1. **Concept**: `:disabled="!isOnline"` converts boolean state into standard HTML button disabled attribute presence.
> 2. **Concept**: `:class="{ ... }"` object syntax dynamically toggles CSS classes based on reactive booleans.
> 3. **Concept**: `:style="{ fill: signalColor }"` evaluates dynamic SVG styling attributes cleanly.
> 4. **Concept**: `v-bind` updates target attributes automatically when reactive dependencies trigger patches.
> 
---

### Exercise 2: Financial Stock Ticker Dynamic Color Scheme (Finance)

**Scenario:** A stock ticker displays live price shifts. Price gains must display in green with an upward arrow, while price drops must display in red with a downward arrow.

**Requirements:**
1. Bind dynamic class `price-up` vs `price-down` based on `priceChange > 0`.
2. Bind dynamic image attribute `:src` to appropriate arrow icon URL.
3. Pass numerical props `:price` and `:change-percent` to child `<TickerBadge>` component using `v-bind`.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, computed } from 'vue'
> 
> const stock = ref({
>   symbol: 'TSLA',
>   price: 242.50,
>   change: -3.20
> })
> 
> const isGain = computed(() => stock.value.change >= 0)
> const arrowIcon = computed(() => isGain.value ? '/icons/up.svg' : '/icons/down.svg')
> </script>
> 
> <template>
>   <div class="ticker-card" :class="isGain ? 'price-up' : 'price-down'">
>     <h4>{{ stock.symbol }}</h4>
>     <img :src="arrowIcon" alt="Trend Arrow" />
>     <span>${{ stock.price.toFixed(2) }} ({{ stock.change }}%)</span>
>   </div>
> </template>
> 
> <style scoped>
> .ticker-card { padding: 16px; display: flex; align-items: center; gap: 8px; }
> .price-up { color: #52c41a; }
> .price-down { color: #ff4d4f; }
> </style>
> ```
>
> #### Technical Explanation
> 1. **Concept**: Ternary expressions inside `:class` switch styling names dynamically.
> 2. **Concept**: `:src="arrowIcon"` evaluates computed reactive properties for image source selection.
> 3. **Concept**: Vue automatically sanitizes and applies bound attributes to standard DOM nodes.
> 4. **Concept**: `v-bind` ensures view updates stay in sync with stock data mutation events.
> 
---

### Exercise 3: E-Commerce Product Image Gallery Same-Name Shorthand (E-commerce)

**Scenario:** An e-commerce product detail page displays product gallery thumbnails. You want to utilize Vue 3.4+ same-name attribute binding shorthand (`:src`, `:id`) to simplify attribute template declarations.

**Requirements:**
1. Declare reactive variables `src`, `id`, and `alt`.
2. Use Vue 3.4+ same-name binding shorthand `<img :src :id :alt />`.
3. Toggle `src` value when clicking thumbnail list items.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref } from 'vue'
> 
> const src = ref('https://via.placeholder.com/600x400?text=Product+Main')
> const id = ref('main-product-image')
> const alt = ref('Main Product View')
> 
> function selectImage(newUrl) {
>   src.value = newUrl
> }
> </script>
> 
> <template>
>   <div class="gallery">
>     <!-- Vue 3.4+ same-name binding shorthand -->
>     <img :src :id :alt class="main-img" />
> 
>     <div class="thumbs">
>       <button @click="selectImage('https://via.placeholder.com/600x400?text=Side+View')">
>         View Side
>       </button>
>       <button @click="selectImage('https://via.placeholder.com/600x400?text=Back+View')">
>         View Back
>       </button>
>     </div>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: Vue 3.4+ supports same-name attribute binding shorthand (`:src` is equivalent to `:src="src"`).
> 2. **Concept**: Same-name shorthand reduces redundant template syntax while preserving reactivity.
> 3. **Concept**: Updating `src.value` automatically patches the underlying `HTMLImageElement.src` attribute.
> 4. **Concept**: Directives keep template definitions concise and readable.
> 
---

## 6. Related Terms

- [Directives](directives.md) — The parent directive system.
- [Props](../level_04/props.md) — Passing data to child components via `v-bind`.
- [Custom Directives (`v-*`)](custom_directives.md) — Custom directive extensions.
- [`v-model`](v_model.md) — Two-way data binding.
- [`v-on`](v_on.md) — Event listening.

---

## 7. Key Takeaways

- **`v-bind`** instructs Vue to evaluate HTML attributes or component props as JavaScript expressions.
- The standard shorthand syntax is a single colon (`:`).
- Non-string primitives (numbers, booleans, arrays, objects) MUST be passed using `v-bind` (`:`).
- `v-bind="object"` without an argument binds all key-value pairs of an object simultaneously.
- Vue 3.4+ supports same-name attribute binding shorthand (e.g. `<img :src />`).
