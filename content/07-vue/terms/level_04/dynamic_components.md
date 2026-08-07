# Dynamic Components (`<component :is>`)

> **Level 4 — Components & Lifecycle**
> A design pattern that enables swapping which component mounts at runtime by binding a reactive value to Vue's built-in `<component>` element using the `:is` attribute.

---

## 1. Prerequisites

- [Components](components.md) — The building blocks of Vue layout.
- [`v-bind`](../level_03/v_bind.md) — Passing attributes and properties dynamically.

---

## 2. Term Category

**Component Switching Pattern (Runtime VNode Resolution)**: Dynamic Components represent Vue's built-in construct for resolving component targets at runtime without giant `v-if / v-else-if` chains. Utilizing the reserved `<component>` template tag paired with the `:is` attribute, Vue's Virtual DOM engine evaluates the `:is` payload—accepting raw imported component objects, string HTML tags, or component names—and patches the document tree accordingly. Running in client-side browser DOM rendering and SSR environments, dynamic components are frequently combined with `<KeepAlive>` for state caching and `<Transition>` for view animation.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In multi-view user interfaces—such as tabbed navigation panels, multi-step checkout wizards, dashboard widget grids, or CMS page builders—developers frequently need to swap entire section layouts based on user selections or configuration state.

A naive approach relies on verbose conditional rendering chains:
```vue
<ProfileTab v-if="activeTab === 'profile'" />
<SettingsTab v-else-if="activeTab === 'settings'" />
<BillingTab v-else-if="activeTab === 'billing'" />
<SecurityTab v-else-if="activeTab === 'security'" />
```
As applications scale to dozens of dynamic views, this `v-if` chain becomes massive, repetitive, and difficult to maintain. Adding a new tab requires updating both the script selection state and adding another `v-else-if` template element.

Vue designed **Dynamic Components** to solve this cleanly. Instead of writing multiple conditional elements, you write a single placeholder element—`<component>`—and bind its target component definition dynamically using the `:is` attribute (`<component :is="activeTabComponent" />`).

### (2) Reality Metaphor

Imagine an automated billboard standing beside a highway.

Standard static component tags (`<ProfileTab />`) are like traditional printed paper billboards—the advert image is glued to the frame. If you want to show a different advert, workers must physically tear down the old paper poster and glue up a new one.

**Dynamic Components** (`<component :is="activeAdvert" />`) are like a digital LED billboard screen. The structural metal frame (`<component>`) stays mounted on the highway permanently. To switch from an advert for a coffee shop to an advert for an airline (`:is="activeAdvert"`), central control simply transmits a new image signal object down the cable. The LED screen switches its display instantly without altering the physical frame.

### (3) Vue Code Examples

#### Short Snippet
```vue
<script setup>
import { shallowRef } from 'vue'
import HomeTab from './HomeTab.vue'
import SettingsTab from './SettingsTab.vue'

// Use shallowRef for component references to avoid deep proxy overhead
const currentTab = shallowRef(HomeTab)
</script>

<template>
  <div class="tabs-demo">
    <button @click="currentTab = HomeTab">Home</button>
    <button @click="currentTab = SettingsTab">Settings</button>
    
    <!-- Render active component dynamically -->
    <component :is="currentTab" />
  </div>
</template>
```

#### Fuller Example
```vue
<script setup>
import { shallowRef, computed } from 'vue'
import LineChartWidget from './LineChartWidget.vue'
import TableDataWidget from './TableDataWidget.vue'
import MetricCardWidget from './MetricCardWidget.vue'

const activeWidget = shallowRef(LineChartWidget)

// Generate props dynamically based on selected component
const widgetProps = computed(() => {
  if (activeWidget.value === LineChartWidget) {
    return { title: 'Traffic Analytics', timeframe: '24h' }
  } else if (activeWidget.value === TableDataWidget) {
    return { rowsPerPage: 10, showPagination: true }
  }
  return { title: 'System Uptime', value: '99.98%' }
})

function handleWidgetRefresh(payload) {
  console.log('Refresh event received from widget:', payload)
}
</script>

<template>
  <div class="dashboard-portal">
    <header class="controls">
      <button @click="activeWidget = LineChartWidget">Chart View</button>
      <button @click="activeWidget = TableDataWidget">Table View</button>
      <button @click="activeWidget = MetricCardWidget">Metric View</button>
    </header>

    <!-- 
      Dynamic Component:
      - :is switches target component object
      - v-bind forwards dynamic props object
      - @refresh binds custom event listener to active child
    -->
    <main class="widget-stage">
      <component 
        :is="activeWidget" 
        v-bind="widgetProps" 
        @refresh="handleWidgetRefresh" 
      />
    </main>
  </div>
</template>

<style scoped>
.dashboard-portal { padding: 16px; }
.controls { display: flex; gap: 8px; margin-bottom: 16px; }
.widget-stage { border: 1px solid #e8e8e8; padding: 16px; border-radius: 8px; }
</style>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Expecting unmounted dynamic component state to persist when switching

**The mistake:** Expecting form inputs or local `ref()` state inside a dynamic component to remain populated when switching back and forth between tabs.

**Why it's wrong:** Swapping dynamic components triggers a full unmount cycle on the outgoing component by default. Its DOM elements are destroyed and local state is garbage collected. Switching back creates a brand new instance with empty state.

*Incorrect:*
```vue
<!-- State inside activeTab is lost when switching tabs -->
<component :is="activeTab" />
```

*Fix:* Wrap the dynamic component in Vue's built-in `<KeepAlive>` element to cache instances in memory.
```vue
<!-- Component state is cached and preserved when switched away -->
<KeepAlive>
  <component :is="activeTab" />
</KeepAlive>
```

---

### Mistake 2: Passing component class names as plain strings to `<component :is="...">` in `<script setup>`

**The mistake:** Passing `:is="'TabHeader'"` as a string when `TabHeader` is imported inside `<script setup>`.

**Why it's wrong:** In `<script setup>`, `:is` expects the actual imported component object reference, NOT a string name (unless registered globally on the app instance). Passing string `'TabHeader'` fails to resolve imported component definitions.

*Incorrect:*
```vue
<script setup>
import TabHeader from './TabHeader.vue';
</script>
<template>
  <component :is="'TabHeader'" /> <!-- ❌ String fails to resolve imported component! -->
</template>
```

*Fix:*
```vue
<script setup>
import TabHeader from './TabHeader.vue';
</script>
<template>
  <component :is="TabHeader" /> <!-- Pass actual component object reference -->
</template>
```

---

### Mistake 3: Wrapping component object references in deep `ref()` instead of `shallowRef()`

**The mistake:** Writing `const activeComponent = ref(LineChartWidget)`.

**Why it's wrong:** `ref()` attempts to convert the target object into a deep reactive Proxy. Wrapping complex component objects in deep reactive proxies creates unnecessary performance overhead and triggers console warnings (`Vue received a Component which was made a reactive object`). Use `shallowRef()` or `markRaw()`.

*Incorrect:*
```javascript
const activeTab = ref(HeavyComponent); // ❌ Warning: Unnecessary reactive proxy on component object!
```

*Fix:*
```javascript
const activeTab = shallowRef(HeavyComponent); // Efficient shallow reference
```

---

## 5. Practice Exercises

### Exercise 1: IoT Device Diagnostic Widget Swapper (IoT)

**Scenario:** An industrial IoT diagnostic console allows field engineers to switch between three diagnostic widgets: Network Status, Battery Telemetry, and Firmware Logs. You must build a dynamic component switcher using `shallowRef` and wrap it in `<KeepAlive>` so diagnostic logs are not lost when switching tabs.

**Requirements:**
1. Import three widget components (`NetWidget`, `BatteryWidget`, `LogWidget`).
2. Manage `activeWidget` using `shallowRef(NetWidget)`.
3. Render using `<KeepAlive><component :is="activeWidget" /></KeepAlive>`.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { shallowRef } from 'vue'
> import NetWidget from './NetWidget.vue'
> import BatteryWidget from './BatteryWidget.vue'
> import LogWidget from './LogWidget.vue'
> 
> const activeWidget = shallowRef(NetWidget)
> </script>
> 
> <template>
>   <div class="diagnostic-console">
>     <nav class="tab-bar">
>       <button @click="activeWidget = NetWidget">Network</button>
>       <button @click="activeWidget = BatteryWidget">Battery</button>
>       <button @click="activeWidget = LogWidget">Logs</button>
>     </nav>
> 
>     <!-- State preservation across component swaps -->
>     <KeepAlive>
>       <component :is="activeWidget" />
>     </KeepAlive>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: `<component :is>` renders dynamic component objects at runtime.
> 2. **Concept**: `shallowRef()` avoids deep reactive Proxy wrapping on component objects.
> 3. **Concept**: `<KeepAlive>` caches unmounted dynamic component instances in memory.
> 4. **Concept**: Eliminates giant `v-if / v-else-if` template chains.
> 
---

### Exercise 2: Financial Multi-Step Loan Application Wizard (Finance)

**Scenario:** A banking portal features a 3-step loan application wizard: Step 1 Personal Info, Step 2 Employment Data, Step 3 Review. You must implement a dynamic component wizard passing `formData` to each step via `v-bind`.

**Requirements:**
1. Array `steps = [Step1Personal, Step2Employment, Step3Review]`.
2. Integer ref `currentStepIndex = ref(0)`.
3. Computed `currentStepComponent` returning current step component object.
4. Pass `formData` reactively via `v-bind="formData"`.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, shallowRef, computed } from 'vue'
> import Step1Personal from './Step1Personal.vue'
> import Step2Employment from './Step2Employment.vue'
> import Step3Review from './Step3Review.vue'
> 
> const steps = [Step1Personal, Step2Employment, Step3Review]
> const currentStepIndex = ref(0)
> 
> const currentStepComponent = computed(() => steps[currentStepIndex.value])
> 
> const formData = ref({
>   fullName: 'Jane Doe',
>   annualIncome: 95000,
>   loanAmount: 250000
> })
> 
> function nextStep() {
>   if (currentStepIndex.value < steps.length - 1) currentStepIndex.value++
> }
> function prevStep() {
>   if (currentStepIndex.value > 0) currentStepIndex.value--
> }
> </script>
> 
> <template>
>   <div class="wizard">
>     <h3>Loan Application (Step {{ currentStepIndex + 1 }} of {{ steps.length }})</h3>
> 
>     <component :is="currentStepComponent" v-bind="formData" />
> 
>     <div class="nav-buttons">
>       <button :disabled="currentStepIndex === 0" @click="prevStep">Back</button>
>       <button :disabled="currentStepIndex === steps.length - 1" @click="nextStep">Next</button>
>     </div>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: Storing imported component references in an array permits step index array lookups.
> 2. **Concept**: Computed `currentStepComponent` dynamically resolves active step objects.
> 3. **Concept**: `v-bind="formData"` forwards entire form payload object as props to whichever step component is active.
> 4. **Concept**: Simplifies wizard state management.
> 
---

### Exercise 3: Dynamic Native HTML Element Tag Renderer (Graphics)

**Scenario:** A CMS rich-text renderer parses heading levels dynamically from database JSON (`'h1'`, `'h2'`, `'p'`) and renders corresponding native HTML tags dynamically using `<component :is>`.

**Requirements:**
1. Accept string prop `tagType` ('h1', 'h2', 'p', 'blockquote').
2. Render native HTML tag dynamically using `<component :is="tagType">`.
3. Pass template slot content inside tag.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <!-- DynamicHeading.vue -->
> <script setup>
> defineProps({
>   tagType: {
>     type: String,
>     default: 'p'
>   }
> })
> </script>
> 
> <template>
>   <!-- Built-in <component> accepts native HTML string tags -->
>   <component :is="tagType" class="cms-typography">
>     <slot />
>   </component>
> </template>
> 
> <style scoped>
> .cms-typography { margin-bottom: 12px; font-family: sans-serif; }
> h1.cms-typography { font-size: 28px; color: #111; }
> h2.cms-typography { font-size: 22px; color: #333; }
> p.cms-typography { font-size: 15px; color: #666; }
> </style>
> ```
>
> #### Technical Explanation
> 1. **Concept**: `<component :is>` accepts native HTML string tag names (e.g. `'h1'`, `'p'`).
> 2. **Concept**: Avoids writing 6 separate `v-if / v-else-if` elements for HTML heading levels.
> 3. **Concept**: Default slots preserve internal text or HTML markup structure cleanly.
> 4. **Concept**: High-utility pattern for CMS rendering engines.
> 
---

## 6. Related Terms

- [Components](components.md) — Fundamental component concept.
- [KeepAlive](../level_08/keepalive.md) — Caching dynamic component instances.
- [Async Components](../level_08/async_components.md) — Lazily loading component chunks over network.
- [Transitions & Animations](../level_10/transition.md) — Animating dynamic view switches.

---

## 7. Key Takeaways

- **`<component>`** is Vue's built-in element placeholder for rendering dynamic component targets.
- The **`:is`** attribute specifies which component to mount, accepting component objects or HTML string tags.
- In `<script setup>`, pass imported component object references directly to `:is`.
- Use **`shallowRef()`** instead of `ref()` for component object references to avoid deep Proxy overhead.
- Wrap `<component :is>` in `<KeepAlive>` to cache unmounted component state across tab switches.
