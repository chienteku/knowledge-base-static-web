# Transitions & Animations

> **Level 10 — Tooling & Ecosystem**
> Built-in Vue components (`<Transition>` and `<TransitionGroup>`) that coordinate CSS transitions, animations, and JavaScript hooks automatically when DOM nodes enter, leave, or reorder within the component tree.

---

## 1. Prerequisites

- [Components](../level_04/components.md) — Custom template structures wrapped by transition components.
- [`v-if` / `v-show`](../level_03/v_if_show.md) — Visibility directives triggering element insertion and removal transitions.
- [Dynamic Components (`<component :is>`)](../level_04/dynamic_components.md) — Dynamic component swapping animated via transition modes.

---

## 2. Term Category

**Built-In Component (Animation Orchestrator)**: `<Transition>` and `<TransitionGroup>` are built-in Vue wrapper components designed to orchestrate entry, exit, and list reordering animations. Instead of requiring manual DOM class manipulation and timer management, Vue monitors target node lifecycle states and applies predefined CSS class suffixes (`-enter-from`, `-enter-active`, `-enter-to`, `-leave-from`, `-leave-active`, `-leave-to`) or JavaScript hooks (`onEnter`, `onLeave`) automatically.

Unlike React CSSTransition (which requires third-party libraries like `react-transition-group`) or Angular's DSL animations engine, Vue integrates transition lifecycle hooks directly into its core Virtual DOM patch engine, supporting seamless CSS transitions, keyframe animations, and FLIP list reordering out of the box.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In modern web applications, sudden UI element appearances or instant removals feel unpolished and disruptive. Modals snapping open without fade-ins, alert banners disappearing abruptly, or list items shifting without movement animations create jarring user experiences.

However, coordinating entry and exit animations manually in raw JavaScript requires complex timing coordination: adding enter CSS classes, waiting for animation frame callbacks, attaching `transitionend` event listeners, and physically removing DOM nodes only *after* exit animations complete. Vue designed `<Transition>` and `<TransitionGroup>` to automate DOM lifecycle class injection, allowing developers to describe animation aesthetics purely in CSS while Vue manages timing and node mounting.

### (2) Reality Metaphor
Imagine a theatrical stage stage manager coordinating actors entering and leaving a play performance. 

When an actor enters the stage, the stage manager dims the lights, cues the entry music, and signals the actor to walk onto stage (enter transition phase). When an actor leaves, the manager allows the actor to finish their exit monologue and bow before closing the curtain and guiding them offstage (leave transition phase). The stage manager never cancels the actor's exit scene halfway through.

Vue's `<Transition>` component acts as the digital stage manager—it handles the entry cues, applies CSS costumes (`v-enter-active`), and delays removing the DOM node until the curtain call animation completes.

### (3) Vue Code Examples

#### Short Snippet
```vue
<script setup>
import { ref } from 'vue'
const show = ref(true)
</script>

<template>
  <button @click="show = !show">Toggle Modal</button>
  
  <Transition name="fade">
    <div v-if="show" class="modal-box">Modal Dialog Content</div>
  </Transition>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
```

#### Fuller Example
```vue
<!-- AnimatedTodoList.vue -->
<script setup>
import { ref } from 'vue'

const items = ref([
  { id: 101, text: 'Calibrate Industrial Sensors' },
  { id: 102, text: 'Audit Telemetry Logs' }
])
let nextId = 103

function addItem() {
  items.value.unshift({ id: nextId++, text: `New Task #${nextId}` })
}

function removeItem(id) {
  items.value = items.value.filter(item => item.id !== id)
}
</script>

<template>
  <div class="todo-panel">
    <button @click="addItem">Add Priority Task</button>

    <!-- TransitionGroup handles v-for list animations and FLIP reordering -->
    <TransitionGroup name="list" tag="ul" class="task-list">
      <li v-for="item in items" :key="item.id" class="task-item">
        <span>{{ item.text }}</span>
        <button @click="removeItem(item.id)">Complete</button>
      </li>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.task-list {
  position: relative;
  list-style: none;
  padding: 0;
}

/* Enter and Leave Animations */
.list-enter-active, .list-leave-active {
  transition: all 0.4s cubic-bezier(0.55, 0, 0.1, 1);
}
.list-enter-from, .list-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* Smooth FLIP position reordering animation for remaining list items */
.list-move {
  transition: transform 0.4s ease;
}
.list-leave-active {
  position: absolute;
  width: 100%;
}
</style>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Transitioning Mutually Exclusive Elements Without `mode="out-in"`

**The mistake:** Transitioning between two elements using `v-if` / `v-else` without setting the transition mode attribute.

**Why it's wrong:** By default, Vue triggers the entrance animation of the new incoming element and the exit animation of the outgoing element simultaneously. For a brief moment, both elements exist in the DOM layout flow together, causing elements to stack vertically or jump erratically.

*Incorrect:*
```vue
<!-- ❌ Both buttons render simultaneously during transition, jumping layout! -->
<Transition name="fade">
  <button v-if="isEditing" key="save">Save Changes</button>
  <button v-else key="edit">Edit Profile</button>
</Transition>
```

*Fix:*
```vue
<!-- ✅ mode="out-in" waits for outgoing element to exit before mounting incoming element -->
<Transition name="fade" mode="out-in">
  <button v-if="isEditing" key="save">Save Changes</button>
  <button v-else key="edit">Edit Profile</button>
</Transition>
```

---

### Mistake 2: Wrapping Multiple Root Nodes in `<Transition>`

**The mistake:** Placing multiple top-level child elements inside a `<Transition>` component.

**Why it's wrong:** `<Transition>` works by applying CSS animation classes to a single target DOM node. Multi-root children inside `<Transition>` trigger runtime warnings and fail to animate. (Use `<TransitionGroup>` for multi-node lists).

*Incorrect:*
```vue
<Transition name="slide">
  <!-- ❌ Error: Transition expects a single root DOM element! -->
  <h1>Title</h1>
  <p>Description text</p>
</Transition>
```

*Fix:*
```vue
<Transition name="slide">
  <!-- ✅ Single container root wrapper node -->
  <div>
    <h1>Title</h1>
    <p>Description text</p>
  </div>
</Transition>
```

---

### Mistake 3: Using `<Transition>` Instead of `<TransitionGroup>` for `v-for` List Rendering

**The mistake:** Wrapping a `v-for` list iteration in a `<Transition>` tag.

**Why it's wrong:** `<Transition>` only handles single element toggles or `v-if`/`v-else` swaps. Animating dynamic list arrays rendered with `v-for` requires `<TransitionGroup>`.

*Incorrect:*
```vue
<!-- ❌ Fails to animate list items correctly! -->
<Transition name="list">
  <li v-for="item in list" :key="item.id">{{ item.name }}</li>
</Transition>
```

*Fix:*
```vue
<!-- ✅ TransitionGroup manages dynamic node lists and FLIP reordering -->
<TransitionGroup tag="ul" name="list">
  <li v-for="item in list" :key="item.id">{{ item.name }}</li>
</TransitionGroup>
```

---

## 5. Practice Exercises

### Exercise 1: IoT Sensor Alarm Banner Transition

**Scenario:** An industrial IoT control panel displays emergency alert banners. When a temperature threshold is exceeded, an alert banner must slide in smoothly from the top of the screen (`transform: translateY(-100%)`) and fade in.

**Requirements:**
1. Maintain reactive `hasAlert` boolean state.
2. Wrap alert banner in `<Transition name="slide-down">`.
3. Write CSS transitions for `-enter-from`, `-enter-active`, and `-leave-to` classes.
4. Include a test assertion validating alert state toggling.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, onMounted } from 'vue'
> 
> const hasAlert = ref(false)
> const alertMessage = ref('CRITICAL: High Sensor Temperature!')
> 
> function toggleAlert() {
>   hasAlert.value = !hasAlert.value
> }
> 
> onMounted(() => {
>   testIotAlertTransition()
> })
> 
> function testIotAlertTransition() {
>   toggleAlert()
>   console.assert(hasAlert.value === true, 'Test Failed: Alert toggle failed')
>   console.log('IoT Alert Transition Test Passed')
> }
> </script>
> 
> <template>
>   <div class="alarm-panel">
>     <button @click="toggleAlert">Simulate Sensor Alarm</button>
>     
>     <Transition name="slide-down">
>       <div v-if="hasAlert" class="alert-banner">
>         ⚠️ {{ alertMessage }}
>       </div>
>     </Transition>
>   </div>
> </template>
> 
> <style scoped>
> .alert-banner {
>   background: #ff4d4f;
>   color: white;
>   padding: 12px;
>   border-radius: 4px;
>   margin-top: 10px;
> }
> .slide-down-enter-active, .slide-down-leave-active {
>   transition: all 0.3s ease-out;
> }
> .slide-down-enter-from, .slide-down-leave-to {
>   opacity: 0;
>   transform: translateY(-20px);
> }
> </style>
> ```
>
> #### Technical Explanation
> 1. **Concept**: Vue automatically attaches `.slide-down-enter-active` classes when `hasAlert` becomes `true`.
> 2. **Concept**: `transform: translateY(-20px)` and `opacity: 0` create smooth sliding fade entrances.
> 3. **Concept**: The DOM element is removed from the layout only after `.slide-down-leave-active` finishes.
> 4. **Concept**: Unit tests verify reactive boolean state toggling.
> 
---

### Exercise 2: Real-Time Financial Stock Watchlist Reordering Animation

**Scenario:** A stock trading application displays a watchlist sorted by percentage gain. As live prices update, stock rows change positions, requiring smooth FLIP animations via `<TransitionGroup>`.

**Requirements:**
1. Render watchlist array using `<TransitionGroup tag="tbody">`.
2. Provide a function to sort stocks by gain percentage.
3. Apply `.watchlist-move` CSS transition for FLIP reordering.
4. Verify via inline test assertions that sorting mutates array ordering correctly.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, onMounted } from 'vue'
> 
> const watchlist = ref([
>   { ticker: 'AAPL', gain: 1.2 },
>   { ticker: 'NVDA', gain: 5.8 },
>   { ticker: 'TSLA', gain: -0.5 }
> ])
> 
> function sortByGain() {
>   watchlist.value.sort((a, b) => b.gain - a.gain)
> }
> 
> onMounted(() => {
>   sortByGain()
>   testFinancialWatchlistSort()
> })
> 
> function testFinancialWatchlistSort() {
>   console.assert(watchlist.value[0].ticker === 'NVDA', 'Test Failed: Sorting by gain failed')
>   console.log('Financial Watchlist Transition Test Passed')
> }
> </script>
> 
> <template>
>   <div class="watchlist-widget">
>     <h4>Watchlist (FLIP Reorder Animation)</h4>
>     <button @click="sortByGain">Sort by Top Gainers</button>
>     
>     <table>
>       <TransitionGroup tag="tbody" name="watchlist">
>         <tr v-for="stock in watchlist" :key="stock.ticker">
>           <td>{{ stock.ticker }}</td>
>           <td :class="stock.gain >= 0 ? 'green' : 'red'">
>             {{ stock.gain > 0 ? '+' : '' }}{{ stock.gain }}%
>           </td>
>         </tr>
>       </TransitionGroup>
>     </table>
>   </div>
> </template>
> 
> <style scoped>
> .watchlist-move {
>   transition: transform 0.5s ease;
> }
> .green { color: #52c41a; }
> .red { color: #ff4d4f; }
> </style>
> ```
>
> #### Technical Explanation
> 1. **Concept**: `<TransitionGroup>` applies FLIP (First, Last, Invert, Play) calculations to translate elements smoothly during array reorders.
> 2. **Concept**: Unique `:key="stock.ticker"` keys allow Vue to identify moving DOM nodes across sorts.
> 3. **Concept**: `.watchlist-move` CSS property binds transition durations to position shifts.
> 4. **Concept**: Unit tests verify array sorting logic.
> 
---

### Exercise 3: E-Commerce Product Image Gallery Cross-Fade

**Scenario:** An e-commerce product detail page allows shoppers to view different color variants. Swapping variant images must use `<Transition mode="out-in">` to cross-fade images without breaking gallery layout bounds.

**Requirements:**
1. Maintain selected variant image state.
2. Wrap variant `<img>` in `<Transition name="crossfade" mode="out-in">`.
3. Provide color selector buttons.
4. Include a test assertion validating variant image swapping.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, onMounted } from 'vue'
> 
> const variants = ref([
>   { color: 'Midnight Black', image: '/img/black.jpg' },
>   { color: 'Silver White', image: '/img/silver.jpg' }
> ])
> const selectedVariant = ref(variants.value[0])
> 
> function selectVariant(v) {
>   selectedVariant.value = v
> }
> 
> onMounted(() => {
>   testEcommerceGalleryTransition()
> })
> 
> function testEcommerceGalleryTransition() {
>   selectVariant(variants.value[1])
>   console.assert(selectedVariant.value.color === 'Silver White', 'Test Failed: Variant selection failed')
>   console.log('E-Commerce Gallery Transition Test Passed')
> }
> </script>
> 
> <template>
>   <div class="gallery-card">
>     <div class="image-wrapper">
>       <Transition name="crossfade" mode="out-in">
>         <div :key="selectedVariant.color" class="variant-display">
>           <p>{{ selectedVariant.color }}</p>
>         </div>
>       </Transition>
>     </div>
>     
>     <div class="controls">
>       <button v-for="v in variants" :key="v.color" @click="selectVariant(v)">
>         {{ v.color }}
>       </button>
>     </div>
>   </div>
> </template>
> 
> <style scoped>
> .crossfade-enter-active, .crossfade-leave-active {
>   transition: opacity 0.25s ease-in-out;
> }
> .crossfade-enter-from, .crossfade-leave-to {
>   opacity: 0;
> }
> </style>
> ```
>
> #### Technical Explanation
> 1. **Concept**: `mode="out-in"` ensures the outgoing image fades out completely before the incoming variant fades in.
> 2. **Concept**: Binding `:key="selectedVariant.color"` forces Vue to treat variant swaps as element replacement transitions.
> 3. **Concept**: Scoped CSS transition rules apply opacity fades cleanly across image changes.
> 4. **Concept**: Inline assertions verify variant selection updates.
> 
---

## 6. Related Terms

- [Dynamic Components (`<component :is>`)](../level_04/dynamic_components.md) — Swapping dynamic component layouts animated by transitions.
- [`v-if` / `v-show`](../level_03/v_if_show.md) — Visibility directives triggering element insertion and removal transitions.
- [Components](../level_04/components.md) — Template building blocks animated by transition wrappers.

---

## 7. Key Takeaways

- **`<Transition>`** coordinates entry and exit animations for a single element or toggled `v-if`/`v-else` targets.
- **`<TransitionGroup>`** manages list rendering animations (`v-for`) and supports FLIP position reordering via `-move` CSS classes.
- Use **`mode="out-in"`** when animating between mutually exclusive nodes to prevent elements from rendering simultaneously.
- Vue automatically injects CSS class suffixes (`-enter-from`, `-enter-active`, `-enter-to`, `-leave-from`, `-leave-active`, `-leave-to`) matching the `name` prop.
- Ensure every child item inside `<TransitionGroup>` has a stable, unique `:key` attribute.
