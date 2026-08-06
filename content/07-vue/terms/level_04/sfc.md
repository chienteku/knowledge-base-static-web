# Single-File Components (SFCs)

> **Level 4 — Components & Lifecycle**
> Vue's signature file format (`.vue` files) that encapsulates HTML structure, JavaScript logic, and CSS styling for a component inside a single unified file.

---

## 1. Prerequisites

- None!

---

## 2. Term Category

**Physical File Format (Build-Time Transpilation Target)**: Single-File Components (`.vue` files) are Vue's standard authoring format for web UI modules. Built around three top-level language blocks (`<script>`, `<template>`, `<style>`), SFCs co-locate component logic, markup, and styling into a single physical source file. SFCs require a build compilation step (`@vue/compiler-sfc` via Vite or Webpack) to parse and transpile `.vue` files into standard JavaScript modules and CSS stylesheets that browser engines can execute. SFCs support features like CSS scoping (`<style scoped>`) and dynamic CSS state binding (`v-bind()`).

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In traditional web development, building a single UI element (such as a custom modal or button) forced developers to maintain three separate files in different directories: `button.html`, `button.js`, and `button.css`.

Jumping across three separate directory paths just to make a minor styling change or add a click event listener created heavy context switching. Furthermore, CSS rules written in global `.css` files frequently leaked styles across unrelated HTML pages, causing accidental visual bugs.

Vue invented the **Single-File Component (`.vue` format)** to solve file fragmentation and CSS leakage. An SFC encapsulates the three core web pillars into three distinct top-level blocks within one single `.vue` file:
1. `<script setup>`: The component's JavaScript/TypeScript reactivity and business logic.
2. `<template>`: The component's HTML structure and data binding markup.
3. `<style scoped>`: The component's CSS styling, automatically scoped to prevent leaks.

### (2) Reality Metaphor

Imagine a commercial modular house builder manufacturing pre-fabricated bathroom pods in a factory.

The old traditional approach is like shipping loose plumbing pipes in one truck (`button.html`), loose electrical wires in a second truck (`button.js`), and loose ceramic tiles in a third truck (`button.css`) to a construction site, forcing builders to assemble everything on site while hoping wires don't cross into the living room.

An **SFC (`.vue` file)** is like delivering a complete, pre-fabricated, fully sealed bathroom pod truck. The plumbing (`<template>`), electrical wiring (`<script>`), and tile finishes (`<style scoped>`) are manufactured together inside one sealed box. When dropped into a house frame (the Component Tree), the sealed box plugs in cleanly without leaking water (CSS rules) into adjacent bedrooms.

### (3) Vue Code Examples

#### Short Snippet
```vue
<!-- BaseBadge.vue: Anatomy of a Single-File Component (.vue) -->
<script setup>
defineProps({
  count: Number
})
</script>

<template>
  <span class="badge">{{ count }}</span>
</template>

<style scoped>
/* 'scoped' attribute guarantees this CSS cannot leak to other components */
.badge {
  padding: 4px 8px;
  background: #1890ff;
  color: white;
  border-radius: 10px;
}
</style>
```

#### Fuller Example
```vue
<!-- UserStatusCard.vue: SFC showcasing script setup, template, scoped CSS, and CSS v-bind -->
<script setup>
import { ref, computed } from 'vue'

const isOnline = ref(true)
const userName = ref('Alice Architect')

// Dynamic theme color consumed directly in CSS <style> block via v-bind()
const statusColor = computed(() => isOnline.value ? '#52c41a' : '#ff4d4f')

function toggleStatus() {
  isOnline.value = !isOnline.value
}
</script>

<template>
  <div class="status-card">
    <div class="avatar">
      <span class="indicator"></span>
      <h3>{{ userName }}</h3>
    </div>
    
    <p>Current Status: {{ isOnline ? 'Online' : 'Offline' }}</p>
    <button @click="toggleStatus">Toggle Status</button>
  </div>
</template>

<style scoped>
.status-card {
  padding: 16px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  background: #ffffff;
}

.avatar {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Consuming reactive JavaScript variable directly in CSS using v-bind() */
.indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: v-bind(statusColor);
}
</style>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the `scoped` attribute on `<style>` blocks (Global CSS Leakage)

**The mistake:** Writing plain `<style>` inside `Header.vue` and setting `h1 { color: blue; }`.

**Why it's wrong:** By default, CSS inside `<style>` blocks is **Global**. It leaks out to the entire application, turning every `<h1>` on every page blue.

*Incorrect:*
```vue
<!-- Unscoped style leaks .title class to all components in the entire app! -->
<style>
.title { color: red; }
</style>
```

*Fix:* Always add the `scoped` attribute: `<style scoped>`. Vue automatically appends a unique scope attribute (e.g. `data-v-7ba5e15a`) to component elements and CSS selectors, guaranteeing styles cannot leak.
```vue
<!-- Scoped style isolates rules strictly to this component -->
<style scoped>
.title { color: red; }
</style>
```

---

### Mistake 2: Expecting web browsers to execute raw `.vue` files natively without a build tool

**The mistake:** Writing `<script src="MyComponent.vue"></script>` directly in a static HTML file and expecting Chrome or Safari to load it.

**Why it's wrong:** Browsers understand standard `.html`, `.js`, and `.css` files. They have no concept of `.vue` files or top-level template tags. SFCs require a build tool compiler (like Vite or Webpack) that compiles `.vue` files into standard JS and CSS assets during build time.

*Incorrect:*
```html
<!-- Attempting to load raw SFC in browser -->
<script src="MyComponent.vue"></script>
```

*Fix:*
```javascript
// Import compiled SFC via Vite / ES Modules
import MyComponent from './MyComponent.vue'
```

---

### Mistake 3: Attempting to style child component deep elements without the `:deep()` pseudo-class

**The mistake:** Writing `.parent-card .child-title` inside a `<style scoped>` block expecting to style elements rendered deep inside a child component.

**Why it's wrong:** Scoped CSS targets ONLY elements in the current component's direct template. To target DOM nodes rendered deep inside child components, use the `:deep()` pseudo-class selector.

*Incorrect:*
```vue
<style scoped>
.card .child-badge { color: blue; } /* ❌ Fails to target child component elements! */
</style>
```

*Fix:*
```vue
<style scoped>
.card :deep(.child-badge) { color: blue; } /* Scoped deep selector */
</style>
```

---

## 5. Practice Exercises

### Exercise 1: IoT Sensor Monitor SFC with Scoped CSS & CSS v-bind (IoT)

**Scenario:** An industrial IoT sensor tile component `<SensorTile.vue>` displays temperature readings. You must build an SFC where the temperature text color changes dynamically to red when temperature exceeds 80°C using CSS `v-bind()`.

**Requirements:**
1. Create `.vue` file containing `<script setup>`, `<template>`, and `<style scoped>`.
2. Compute `tempColor` ref ('#ff4d4f' when temp > 80, else '#52c41a').
3. Bind `tempColor` inside `<style scoped>` using `color: v-bind(tempColor)`.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <!-- SensorTile.vue -->
> <script setup>
> import { ref, computed } from 'vue'
> 
> const temp = ref(75)
> 
> const tempColor = computed(() => temp.value > 80 ? '#ff4d4f' : '#52c41a')
> </script>
> 
> <template>
>   <div class="sensor-tile">
>     <h4>Exhaust Temperature</h4>
>     <p class="reading">{{ temp }} °C</p>
>     <button @click="temp += 10">Increase Temp</button>
>   </div>
> </template>
> 
> <style scoped>
> .sensor-tile { padding: 16px; border: 1px solid #ccc; border-radius: 8px; }
> .reading {
>   font-size: 24px;
>   font-weight: bold;
>   /* CSS v-bind consumes reactive JS computed property */
>   color: v-bind(tempColor);
> }
> </style>
> ```
>
> #### Technical Explanation
> 1. **Concept**: SFC co-locates `<script setup>`, `<template>`, and `<style scoped>` in one `.vue` file.
> 2. **Concept**: `<style scoped>` isolates CSS selectors using unique `data-v-*` attributes.
> 3. **Concept**: CSS `v-bind()` binds reactive JS state directly to CSS property values.
> 4. **Concept**: Transpiled by Vite into optimized CSS variables.
> 
---

### Exercise 2: Financial Stock Ticker SFC Scoped Deep Selector (Finance)

**Scenario:** A stock trading application contains a parent component `<Watchlist.vue>` using a third-party child component `<StockBadge>`. You need to override the inner text color of `.badge-text` inside the child using the `:deep()` selector.

**Requirements:**
1. Build parent SFC `<Watchlist.vue>`.
2. Use `<style scoped>` with `:deep(.badge-text)` selector to override child styles.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <!-- Watchlist.vue -->
> <script setup>
> import StockBadge from './StockBadge.vue'
> </script>
> 
> <template>
>   <div class="watchlist-panel">
>     <h2>Market Watchlist</h2>
>     <StockBadge symbol="NVDA" price="120.50" />
>   </div>
> </template>
> 
> <style scoped>
> .watchlist-panel { padding: 16px; }
> 
> /* Scoped :deep() selector allows parent to style deep child elements safely */
> .watchlist-panel :deep(.badge-text) {
>   font-size: 18px;
>   font-weight: 800;
>   color: #1890ff;
> }
> </style>
> ```
>
> #### Technical Explanation
> 1. **Concept**: Scoped CSS normally stops at child component root elements.
> 2. **Concept**: The `:deep()` pseudo-class selector allows scoped styles to penetrate child component subtrees.
> 3. **Concept**: Avoids removing the `scoped` attribute and polluting global CSS.
> 4. **Concept**: Maintains encapsulated design system overrides.
> 
---

### Exercise 3: Real-Time Network Packet Inspector SFC Block Ordering (Networking)

**Scenario:** A network analyst tool requires organizing an SFC `.vue` file following the official Vue Style Guide recommended block ordering (`<script setup>`, `<template>`, `<style scoped>`).

**Requirements:**
1. Structure `.vue` file in exact order: `<script setup>` first, `<template>` second, `<style scoped>` third.
2. Demonstrate clean SFC layout.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <!-- PacketInspector.vue -->
> <!-- 1. Script block first -->
> <script setup>
> import { ref } from 'vue'
> const packetCount = ref(1024)
> </script>
> 
> <!-- 2. Template block second -->
> <template>
>   <div class="inspector">
>     <p>Inspected Packets: {{ packetCount }}</p>
>   </div>
> </template>
> 
> <!-- 3. Style block third -->
> <style scoped>
> .inspector { padding: 12px; background: #222; color: #00ff00; }
> </style>
> ```
>
> #### Technical Explanation
> 1. **Concept**: The official Vue Style Guide recommends ordering blocks: `<script setup>`, `<template>`, `<style scoped>`.
> 2. **Concept**: Although the compiler accepts any block order, standard ordering improves codebase consistency.
> 3. **Concept**: SFC format encapsulates full component implementation cleanly.
> 4. **Concept**: Simplifies IDE navigation and team collaboration.
> 
---

## 6. Related Terms

- [Components](components.md) — Architectural component concept.
- [Vite](../level_10/vite.md) — Build tool that compiles `.vue` files.
- [Teleport](../level_05/teleport.md) — Moving rendered SFC DOM nodes.
- [Build Step (Compilation)](../level_10/build_step.md) — Transpilation step for SFCs.
- [`<script setup>` & Compiler Macros](script_setup.md) — Compiler macros inside SFCs.
- [TypeScript with Vue](../level_10/typescript_vue.md) — Using `<script setup lang="ts">`.

---

## 7. Key Takeaways

- **Single-File Components (SFCs)** use the `.vue` file extension.
- They encapsulate logic (`<script setup>`), structure (`<template>`), and styling (`<style>`) in a single file.
- Browsers cannot execute `.vue` files natively; they must be compiled by a build tool (like Vite) into standard JS/CSS assets.
- Always use **`<style scoped>`** to prevent component CSS rules from leaking to other parts of the application.
- Use CSS **`v-bind()`** to consume reactive JavaScript variables directly inside `<style scoped>` blocks.
