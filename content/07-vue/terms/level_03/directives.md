# Directives

> **Level 3 — Directives & Template Features**
> Special attributes provided by Vue, prefixed with `v-`, that apply reactive behavior to the rendered HTML DOM.

---

## 1. Prerequisites

- [Template Syntax](../level_01/template_syntax.md) — The HTML structure where directives are used.
- [Declarative Rendering](../level_01/declarative_rendering.md) — The core philosophy directives implement.

---

## 2. Term Category

**Core Syntax Construct (Template AST Transformations)**: Directives are specialized XML/HTML template attributes that instruct Vue's template compiler (`@vue/compiler-sfc`) to transform template nodes into optimized Virtual DOM render functions. Operating at the boundary between static HTML markup and dynamic reactivity, directives abstract DOM operations—attribute binding, event registration, list iteration, structural mounting/unmounting—into declarative attributes. Executed during template compilation and runtime Virtual DOM patching, directives decouple DOM imperative manipulation from component JavaScript execution.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In standard web standards, HTML attributes are static key-value pairs (e.g., `<img src="logo.png">`). To modify HTML dynamically using vanilla JavaScript, developers historically had to write step-by-step imperative code: querying elements via `document.querySelector()`, attaching event listeners, and updating attributes manually.

React solves attribute dynamicism by abandoning HTML entirely in favor of JSX, writing JavaScript object expressions directly inside component render trees. Vue took a different architectural direction: preserving standard HTML syntax while enhancing HTML tags with **Directives** (`v-*`). Directives signal to Vue's compiler: *"Do not treat this attribute string literally; evaluate it as a reactive JavaScript expression and sync the underlying DOM node whenever dependencies change."*

### (2) Reality Metaphor

Think of an HTML template as a physical blueprint for a electronic circuit board. Standard HTML attributes (`id="app"`, `class="card"`) are like fixed copper traces printed permanently onto the board—they never change once manufactured.

**Vue Directives** are like smart micro-controllers soldered onto specific circuit pins. A directive like `v-bind` acts as a dynamic voltage regulator adjusting output dynamically based on sensor input, while `v-on` acts as a momentary switch waiting for physical button presses. Rather than requiring external wiring changes (imperative JS DOM querying), the micro-controllers manage the pin behavior right on the board blueprint.

### (3) Vue Code Examples

#### Short Snippet
```vue
<script setup>
import { ref } from 'vue'

const isHighlighted = ref(true)
const statusMessage = ref('System Operational')
</script>

<template>
  <!-- v-bind (:), v-if, and mustache interpolation working in harmony -->
  <div :class="{ active: isHighlighted }">
    <p v-if="statusMessage">{{ statusMessage }}</p>
  </div>
</template>
```

#### Fuller Example
```vue
<script setup>
import { ref } from 'vue'

const searchQuery = ref('')
const isFilterActive = ref(false)
const items = ref([
  { id: 101, name: 'Server Alpha', status: 'Online' },
  { id: 102, name: 'Server Beta', status: 'Offline' }
])

function toggleFilter() {
  isFilterActive.value = !isFilterActive.value
}
</script>

<template>
  <div class="system-monitor">
    <h2>Cluster Nodes</h2>

    <!-- v-model: 2-way form binding directive -->
    <input v-model.trim="searchQuery" placeholder="Filter node name..." />

    <!-- v-on (@): Event listener directive with click handler -->
    <button @click="toggleFilter">
      Toggle Filter Mode
    </button>

    <ul>
      <!-- v-for: List iteration directive with mandatory :key -->
      <li v-for="node in items" :key="node.id">
        <!-- v-bind (:): Dynamic class attribute binding -->
        <span :class="['badge', node.status.toLowerCase()]">
          {{ node.name }} - {{ node.status }}
        </span>
      </li>
    </ul>

    <!-- v-show: Conditional visibility toggle via CSS display -->
    <p v-show="isFilterActive" class="filter-notice">
      Filter mode active. Showing matching nodes.
    </p>
  </div>
</template>

<style scoped>
.badge.online { color: #52c41a; }
.badge.offline { color: #ff4d4f; }
.filter-notice { font-style: italic; color: #8c8c8c; }
</style>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using mustache syntax `{{ }}` inside HTML attribute values

**The mistake:** Writing `<img src="{{ avatarUrl }}">` inside a Vue component template.

**Why it's wrong:** Mustache syntax `{{ }}` works strictly for text content inserted *between* element tags (`<p>{{ text }}</p>`). Using mustaches inside tag attributes causes template syntax errors.

*Incorrect:*
```vue
<img src="{{ logoUrl }}"> <!-- ❌ Mustache syntax in HTML attribute! -->
```

*Fix:*
```vue
<img :src="logoUrl"> <!-- Use v-bind directive shorthand -->
```

---

### Mistake 2: Confusing dynamic directive arguments with static string identifiers

**The mistake:** Writing `<a v-bind:[href]="linkUrl">` expecting `href` to be treated as static attribute `'href'`.

**Why it's wrong:** Dynamic arguments inside square brackets `:[arg]` evaluate `arg` as a JavaScript variable. If `href` is undefined in script setup, Vue outputs warnings or sets null attributes.

*Incorrect:*
```vue
<a v-bind:[href]="url">Link</a> <!-- ❌ Evaluates JS variable 'href'! -->
```

*Fix:*
```vue
<a :href="url">Link</a> <!-- Plain static attribute target -->
```

---

### Mistake 3: Omitting the `v-` prefix on built-in Vue directives

**The mistake:** Writing `<div if="isLoggedIn">User Details</div>` expecting conditional rendering.

**Why it's wrong:** Standard HTML attributes like `if` or `for` are ignored by Vue's template compiler. Directives MUST start with `v-` (or valid shorthands `:`, `@`, `#`).

*Incorrect:*
```vue
<div if="isLoggedIn">Welcome</div> <!-- ❌ Ignored plain attribute! -->
```

*Fix:*
```vue
<div v-if="isLoggedIn">Welcome</div> <!-- Valid Vue directive -->
```

---

## 5. Practice Exercises

### Exercise 1: IoT Device Configuration Directive Mapping (IoT)

**Scenario:** An IoT device control dashboard requires binding telemetry status variables to visual UI cards. You need to identify appropriate directives for attribute binding, event handling, conditional mounting, and input synchronization.

**Requirements:**
1. Bind boolean variable `isDeviceOnline` to disable state of `<button>`.
2. Attach click listener calling `rebootDevice()` function.
3. Show warning message ONLY when `deviceTemperature > 80`.
4. Synchronize text input to `deviceLabel` ref variable.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref } from 'vue'
> 
> const isDeviceOnline = ref(true)
> const deviceTemperature = ref(85)
> const deviceLabel = ref('Edge-Gateway-01')
> 
> function rebootDevice() {
>   console.log('Reboot sequence initiated for:', deviceLabel.value)
> }
> </script>
> 
> <template>
>   <div class="device-panel">
>     <!-- 1. v-bind (:disabled) -->
>     <button :disabled="!isDeviceOnline" @click="rebootDevice">
>       Reboot Unit
>     </button>
> 
>     <!-- 2. v-model 2-way binding -->
>     <input v-model="deviceLabel" placeholder="Unit Label" />
> 
>     <!-- 3. v-if conditional mount -->
>     <p v-if="deviceTemperature > 80" class="warning">
>       OVERHEAT WARNING: {{ deviceTemperature }}°C
>     </p>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: `:disabled="!isDeviceOnline"` uses `v-bind` shorthand to convert JS booleans into HTML attribute state.
> 2. **Concept**: `@click` uses `v-on` shorthand to attach DOM event handlers declaratively.
> 3. **Concept**: `v-if` conditionally mounts DOM nodes when threshold expressions evaluate to `true`.
> 4. **Concept**: `v-model` manages two-way input value synchronization.
> 
---

### Exercise 2: Financial Order Book Directive Composition (Finance)

**Scenario:** A stock trading application displays active market orders. You must construct a template iterating over an order array using list rendering directives and dynamic CSS class binding for order sides (Buy vs Sell).

**Requirements:**
1. Loop over array `orders` using `v-for` with persistent `:key`.
2. Apply class `buy-order` when `order.side === 'BUY'`, and `sell-order` when `'SELL'`.
3. Display order total using mustache interpolation.
4. Format order row click event passing `order.id` to execution handler.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref } from 'vue'
> 
> const orders = ref([
>   { id: 'ord-101', symbol: 'AAPL', qty: 100, price: 185.50, side: 'BUY' },
>   { id: 'ord-102', symbol: 'TSLA', qty: 50, price: 240.00, side: 'SELL' }
> ])
> 
> function selectOrder(id) {
>   console.log('Selected order:', id)
> }
> </script>
> 
> <template>
>   <table class="order-book">
>     <tbody>
>       <tr 
>         v-for="ord in orders" 
>         :key="ord.id" 
>         :class="{ 'buy-order': ord.side === 'BUY', 'sell-order': ord.side === 'SELL' }"
>         @click="selectOrder(ord.id)"
>       >
>         <td>{{ ord.symbol }}</td>
>         <td>{{ ord.qty }} @ ${{ ord.price }}</td>
>         <td>${{ (ord.qty * ord.price).toFixed(2) }}</td>
>       </tr>
>     </tbody>
>   </table>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: `v-for="ord in orders"` loops over data collections in templates.
> 2. **Concept**: `:key="ord.id"` provides unique node keys for VDOM patching optimization.
> 3. **Concept**: Object syntax `:class="{ ... }"` dynamically evaluates boolean class conditions.
> 4. **Concept**: `@click="selectOrder(ord.id)"` passes loop variables directly to event methods.
> 
---

### Exercise 3: Real-Time Network Packet Inspection Directives (Networking)

**Scenario:** A network analyst dashboard needs to stream network packet captures. You must build a template utilizing `v-once` for static headers, `v-for` for packets, and `v-show` for metadata toggles.

**Requirements:**
1. Render static system metadata block using `v-once`.
2. Render packet list using `v-for`.
3. Toggle detailed packet payload visibility using `v-show` bound to `showDetails`.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref } from 'vue'
> 
> const showDetails = ref(false)
> const packets = ref([
>   { id: 1, protocol: 'TCP', src: '192.168.1.1', payload: '0x4500003c' },
>   { id: 2, protocol: 'UDP', src: '192.168.1.5', payload: '0x01020304' }
> ])
> </script>
> 
> <template>
>   <div class="packet-analyzer">
>     <!-- Static sub-tree rendered once -->
>     <div v-once class="header">
>       <h2>Network Monitor Engine v4.2</h2>
>     </div>
> 
>     <button @click="showDetails = !showDetails">Toggle Details</button>
> 
>     <div v-for="pkt in packets" :key="pkt.id" class="packet-row">
>       <span>{{ pkt.protocol }} - {{ pkt.src }}</span>
>       <pre v-show="showDetails">{{ pkt.payload }}</pre>
>     </div>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: `v-once` caches static subtrees to eliminate re-render overhead.
> 2. **Concept**: `v-show` toggles element display using CSS `display: none` without unmounting nodes.
> 3. **Concept**: Directives operate declaratively based on reactive state changes.
> 4. **Concept**: Combining `v-for` and `v-show` manages dynamic list item UI details cleanly.
> 
---

## 6. Related Terms

- [`v-bind`](v_bind.md) — Attribute binding directive.
- [Template Syntax](../level_01/template_syntax.md) — Where directives live.
- [`v-for` (List Rendering) & `:key`](v_for_key.md) — List rendering directive.
- [Custom Directives (`v-*`)](custom_directives.md) — Creating custom directive handlers.
- [Event, Key & Form Modifiers](modifiers.md) — Directive modifiers.
- [`v-if` / `v-show`](v_if_show.md) — Conditional directives.
- [`v-model`](v_model.md) — Two-way binding directive.

---

## 7. Key Takeaways

- **Directives** are special template attributes prefixed with `v-`.
- They instruct Vue's template compiler to apply reactive behaviors directly to DOM elements.
- Core shorthands include `:` for `v-bind`, `@` for `v-on`, and `#` for `v-slot`.
- Directives take arguments (after `:`), modifiers (after `.`), and expressions (inside `=""`).
- Mustaches cannot be used in HTML attributes; directives must be used instead.
