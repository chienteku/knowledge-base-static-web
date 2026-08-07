# `v-if` / `v-show`

> **Level 3 — Directives & Template Features**
> The two primary directives used for Conditional Rendering in Vue. They control element visibility based on reactive booleans, but operate via fundamentally different Virtual DOM mechanisms under the hood.

---

## 1. Prerequisites

- [Directives](directives.md) — The category these directives belong to.
- [Declarative Rendering](../level_01/declarative_rendering.md) — The philosophy of controlling visibility via reactive state.

---

## 2. Term Category

**Conditional Structural Directives (DOM Lifecycle vs CSS Display)**: `v-if` and `v-show` are structural template directives that govern whether DOM nodes are presented to users. `v-if` is a real structural directive—it physically mounts or destroys DOM elements and component instances, triggering lifecycle hooks (`onMounted`, `onUnmounted`). `v-show` is a CSS abstraction directive—it keeps DOM nodes permanently mounted in the browser document tree, toggling visual visibility via inline CSS `display: none`. Merging build-time template compilation with client-side browser DOM manipulation, these directives provide explicit trade-offs between initial render performance and runtime toggle efficiency.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Web interfaces constantly present dynamic views based on state: displaying login buttons for unauthenticated users, rendering modal popups, opening accordion sections, or toggling tab views. 

In Vanilla JS, developers manually wrote imperative conditional checks (`if (isLoggedIn) container.appendChild(userCard)` or `element.style.display = 'none'`). This imperative logic was difficult to track and prone to memory leaks when event listeners attached to hidden elements were not cleaned up properly.

Vue introduced **`v-if`** and **`v-show`** to declare conditional visibility straight in HTML templates. However, different UI scenarios demand different performance characteristics:
- If a component is heavy (e.g. a complex charting dashboard) and rarely shown, compiling and mounting it on initial page load wastes CPU and RAM. `v-if` solves this by lazily skipping compilation until the condition becomes `true`.
- If a component toggles open and closed 10 times per second (e.g. a dropdown menu or tooltip), repeatedly mounting and destroying DOM nodes causes heavy CPU thrashing. `v-show` solves this by mounting once and toggling instant CSS `display` rules.

### (2) Reality Metaphor

Imagine a stage theater manager organizing props for a theatrical performance.

**`v-if`** is like calling the construction crew to physically erect a wooden house structure on stage when Scene 2 begins, and having the crew completely dismantle the wooden house and throw it into the trash when Scene 2 ends. It takes significant effort and time to erect or tear down (`high toggle cost`), but when Scene 2 isn't playing, the stage is completely clean and empty (`low initial memory footprint`).

**`v-show`** is like leaving the wooden house sitting on stage permanently for the entire show, but pulling a massive black blackout curtain in front of it during Scene 1. Pulling the curtain aside takes a split second (`zero toggle cost`), but the wooden house occupies stage space and floor area even when invisible (`higher initial render cost`).

### (3) Vue Code Examples

#### Short Snippet
```vue
<script setup>
import { ref } from 'vue'

const isVisible = ref(true)
</script>

<template>
  <!-- v-if physically destroys/mounts node in DOM -->
  <div v-if="isVisible">Mounted in real DOM</div>
  <div v-else>Shown when false</div>

  <!-- v-show keeps node in DOM, toggling style="display: none;" -->
  <div v-show="isVisible">Permanently mounted in DOM</div>

  <button @click="isVisible = !isVisible">Toggle Visibility</button>
</template>
```

#### Fuller Example
```vue
<script setup>
import { ref } from 'vue'

const userRole = ref('guest') // 'admin', 'member', 'guest'
const isDropdownOpen = ref(false)
</script>

<template>
  <div class="app-layout">
    <!-- v-if / v-else-if / v-else structural chain -->
    <header class="navbar">
      <div v-if="userRole === 'admin'" class="badge admin">
        Admin Control Panel
      </div>
      <div v-else-if="userRole === 'member'" class="badge member">
        Member Workspace
      </div>
      <div v-else class="badge guest">
        Guest Visitor Mode
      </div>

      <!-- v-show for high-frequency dropdown menu toggles -->
      <div class="user-menu">
        <button @click="isDropdownOpen = !isDropdownOpen">Profile Menu</button>
        <ul v-show="isDropdownOpen" class="dropdown-list">
          <li>Account Settings</li>
          <li>Security</li>
          <li>Logout</li>
        </ul>
      </div>
    </header>

    <div class="controls">
      <button @click="userRole = 'admin'">Set Admin</button>
      <button @click="userRole = 'member'">Set Member</button>
      <button @click="userRole = 'guest'">Set Guest</button>
    </div>
  </div>
</template>

<style scoped>
.badge { padding: 6px 12px; border-radius: 4px; font-weight: bold; }
.admin { background: #ff4d4f; color: white; }
.member { background: #1890ff; color: white; }
.guest { background: #8c8c8c; color: white; }
.dropdown-list { list-style: none; padding: 8px; border: 1px solid #ccc; background: white; }
</style>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using `v-if` for high-frequency visibility toggles

**The mistake:** Using `v-if="isOpen"` on a dropdown menu or modal drawer toggled dozens of times per minute.

**Why it's wrong:** `v-if` completely unmounts and recreates DOM elements and component subtrees on every toggle. For high-frequency toggles, this causes CPU thrashing and frame drops. Use `v-show`.

*Incorrect:*
```vue
<!-- High frequency toggle causing repeated DOM creation & unmounts -->
<Dropdown v-if="isOpen" />
```

*Fix:*
```vue
<!-- High frequency toggle using CSS display without unmounting -->
<Dropdown v-show="isOpen" />
```

---

### Mistake 2: Using `v-show` as a null guard for uninitialized data

**The mistake:** Using `v-show="user !== null"` on a component accessing `user.name` when `user` is initially `null`.

**Why it's wrong:** `v-show` ALWAYS compiles and mounts the element to the DOM on initial render (setting `display: none`). It cannot guard against `TypeError: Cannot read properties of null` during initial mounting. Use `v-if` for null guards.

*Incorrect:*
```vue
<!-- ❌ Throws TypeError: Cannot read properties of null (name) on initial render! -->
<div v-show="user !== null">{{ user.name }}</div>
```

*Fix:*
```vue
<!-- Guards component mounting cleanly -->
<div v-if="user !== null">{{ user.name }}</div>
```

---

### Mistake 3: Breaking `v-if` / `v-else` continuity with sibling elements

**The mistake:** Placing an un-related HTML element (like a comment or `<p>` tag) between a `v-if` element and a `v-else` element.

**Why it's wrong:** `v-else` and `v-else-if` MUST immediately follow a `v-if` element in the template markup. Placing intervening sibling elements breaks the compiler chain, throwing a template compilation error.

*Incorrect:*
```vue
<div v-if="isLoggedIn">Welcome Back</div>
<p>Intervening break text</p> <!-- ❌ Breaks v-if chain! -->
<div v-else>Please Log In</div>
```

*Fix:*
```vue
<div v-if="isLoggedIn">Welcome Back</div>
<div v-else>Please Log In</div>
<p>Intervening text moved below</p>
```

---

## 5. Practice Exercises

### Exercise 1: IoT Industrial Sensor Dashboard Null Guarding & Alarm Toggles (IoT)

**Scenario:** An industrial pump monitor fetches sensor telemetry asynchronously. You must guard against accessing null telemetry data prior to API arrival using `v-if`, and toggle high-frequency alarm sound indicator controls using `v-show`.

**Requirements:**
1. Use `v-if` to render pump details container ONLY when `pumpData` ref is not `null`.
2. Use `v-show` to toggle audible alarm indicator panel when `isMuted` changes.
3. Handle loading indicator state cleanly with `v-else`.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref } from 'vue'
> 
> const pumpData = ref(null) // Initially null
> const isMuted = ref(false)
> 
> function fetchTelemetry() {
>   // Simulate API load
>   setTimeout(() => {
>     pumpData.value = { id: 'PUMP-99', pressure: 42.5, status: 'NOMINAL' }
>   }, 500)
> }
> fetchTelemetry()
> </script>
> 
> <template>
>   <div class="dashboard">
>     <!-- 1. v-if Null Guard -->
>     <div v-if="pumpData !== null" class="pump-card">
>       <h3>{{ pumpData.id }}</h3>
>       <p>Pressure: {{ pumpData.pressure }} PSI</p>
>       
>       <!-- 2. v-show High frequency audio panel toggle -->
>       <div v-show="!isMuted" class="audio-panel">
>         🔊 Audio Alarm Monitoring Active
>       </div>
>       
>       <button @click="isMuted = !isMuted">Toggle Mute</button>
>     </div>
> 
>     <!-- 3. v-else Loading fallback -->
>     <div v-else class="loading-state">
>       Loading telemetry data...
>     </div>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: `v-if="pumpData !== null"` prevents initial `TypeError` crashes before async data arrives.
> 2. **Concept**: `v-else` presents a fallback loading UI state until `pumpData` initializes.
> 3. **Concept**: `v-show="!isMuted"` toggles inline CSS `display` without destroying audio panel DOM nodes.
> 4. **Concept**: Choosing the right conditional directive balances stability and performance.
> 
---

### Exercise 2: Financial Trading Order Type Form Selector (Finance)

**Scenario:** A trading exchange form lets traders select between Limit, Market, and Stop-Loss orders. You must build a form layout using `v-if / v-else-if / v-else` to render specialized input fields for each order type.

**Requirements:**
1. Declare string ref `orderType` ('LIMIT', 'MARKET', 'STOP_LOSS').
2. Use `v-if` for Limit order (show Limit Price input).
3. Use `v-else-if` for Stop-Loss order (show Stop Trigger Price input).
4. Use `v-else` for Market order (show Market Order Notice).

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref } from 'vue'
> 
> const orderType = ref('LIMIT')
> const limitPrice = ref(150)
> const stopPrice = ref(145)
> </script>
> 
> <template>
>   <div class="order-form">
>     <select v-model="orderType">
>       <option value="LIMIT">Limit Order</option>
>       <option value="STOP_LOSS">Stop-Loss Order</option>
>       <option value="MARKET">Market Order</option>
>     </select>
> 
>     <!-- v-if / v-else-if / v-else conditional execution -->
>     <div v-if="orderType === 'LIMIT'" class="field">
>       <label>Limit Price ($)</label>
>       <input v-model.number="limitPrice" type="number" />
>     </div>
> 
>     <div v-else-if="orderType === 'STOP_LOSS'" class="field">
>       <label>Stop Trigger Price ($)</label>
>       <input v-model.number="stopPrice" type="number" />
>     </div>
> 
>     <div v-else class="field-notice">
>       Market orders execute immediately at current best available market price.
>     </div>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: `v-if / v-else-if / v-else` constructs multi-branch template logic cleanly.
> 2. **Concept**: Directives evaluate string equalities reactively against `orderType`.
> 3. **Concept**: Un-selected form fields are unmounted to prevent submitting irrelevant data.
> 4. **Concept**: Native `<select>` values bind to `orderType` via `v-model`.
> 
---

### Exercise 3: E-Commerce Product Tab Panel Performance Matrix (E-commerce)

**Scenario:** An online store product page has three tabs: Description (Light text), Reviews (Heavy comment list with pictures), and Q&A (Interactive form). You must select appropriate conditional directives for each tab to balance initial page load speed with tab switching responsiveness.

**Requirements:**
1. Use `v-show` on Description tab for instant switching.
2. Use `v-if` on Reviews tab to defer loading heavy review DOM nodes until clicked.
3. Demonstrate tab switching using reactive integer `activeTab`.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref } from 'vue'
> 
> const activeTab = ref(1) // 1: Description, 2: Reviews
> </script>
> 
> <template>
>   <div class="product-tabs">
>     <div class="tab-headers">
>       <button @click="activeTab = 1">Description</button>
>       <button @click="activeTab = 2">Customer Reviews</button>
>     </div>
> 
>     <!-- 1. v-show: Light description stays mounted -->
>     <div v-show="activeTab === 1" class="tab-body">
>       <p>High-grade noise cancelling wireless headphones with 30hr battery life.</p>
>     </div>
> 
>     <!-- 2. v-if: Heavy reviews deferred until user explicitly requests tab -->
>     <div v-if="activeTab === 2" class="tab-body">
>       <h3>Customer Reviews (1,240)</h3>
>       <div class="review-card">★★★★★ - Excellent build quality!</div>
>     </div>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: `v-show` provides instant display toggles for lightweight components.
> 2. **Concept**: `v-if` defers initial compilation and DOM mounting for heavy subtrees until needed.
> 3. **Concept**: Combining both directives optimizes overall initial page bundle render performance.
> 4. **Concept**: Integer state `activeTab` coordinates active view selection across template branches.
> 
---

## 6. Related Terms

- [Component Lifecycle](../level_04/component_lifecycle.md) — `v-if` triggers unmount/mount hooks; `v-show` does not.
- [Reactive State](../level_02/reactive_state.md) — Reactive data controlling visibility.
- [`v-for` (List Rendering) & `:key`](v_for_key.md) — List rendering directives.
- [Async Components](../level_08/async_components.md) — Lazy-loaded dynamic components.
- [KeepAlive](../level_08/keepalive.md) — Caching dynamic component state.
- [Transitions & Animations](../level_10/transition.md) — Animated conditional visibility.

---

## 7. Key Takeaways

- **`v-if`** completely mounts and unmounts DOM nodes and component instances from the document tree.
- **`v-if`** has lower initial render cost (lazy if false) but higher toggle cost. Use for rare toggles and null guards.
- **`v-show`** keeps elements permanently mounted, toggling visual visibility via inline CSS `display: none`.
- **`v-show`** has higher initial render cost but zero toggle cost. Use for high-frequency toggles (menus, tabs).
- `v-else` and `v-else-if` MUST immediately follow `v-if` elements without intervening siblings.
