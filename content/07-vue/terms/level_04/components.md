# Components

> **Level 4 — Components & Lifecycle**
> Reusable, isolated, self-contained building blocks of a Vue application that encapsulate their own HTML template structure, JavaScript logic, and CSS styling.

---

## 1. Prerequisites

- [Vue Instance](../level_01/vue_instance.md) — The root instance that mounts the component tree.
- [Declarative Rendering](../level_01/declarative_rendering.md) — The core reactivity paradigm components use internally.

---

## 2. Term Category

**Core Component Architecture (Encapsulated UI Tree Nodes)**: Components are the primary structural building blocks of Vue applications. Functioning as custom HTML elements (e.g. `<AppHeader>`, `<UserCard>`, `<DataTable>`), components encapsulate template markup, reactive state logic, and scoped styles into reusable isolated units. Arranged in a hierarchical Component Tree (Root -> Parent -> Child), components enforce encapsulated scope—state inside one component instance remains completely isolated from parallel instances—while communicating via explicit channels (Props Down, Events Up, Slots, Provide/Inject). Executed across client-side rendering and SSR contexts, components match traditional web modularity mental models.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In traditional web development, if a web application needed a "User Profile Card" on five different pages, developers had to copy and paste identical HTML structure onto five separate HTML files. If the card design changed (e.g., adding a status badge), developers had to hunt down all five HTML files and update them manually.

Furthermore, managing global JavaScript scope meant that event listeners or state variables for one card frequently interfered with other cards on the same page.

Vue introduced **Components** to solve UI duplication and state pollution. You define the User Profile Card once as a component. You give it a custom HTML tag name (like `<UserProfileCard>`). Then, you drop that tag anywhere in your application. It encapsulates its own HTML markup, JavaScript reactivity, and CSS rules into a single isolated unit.

### (2) Reality Metaphor

Imagine a lego brick factory manufacturing custom specialized toy modules—like a cockpit block, a wheel assembly, or a solar panel array.

Instead of hand-carving plastic from scratch every time you want to build a spaceship toy, you manufacture the `<CockpitModule>` brick once. You can insert ten `<CockpitModule>` bricks into ten different toy models. Each cockpit brick operates independently: opening the canopy on spaceship #3 does not open the canopy on spaceship #4. The Lego builder arranges these modular bricks into a unified, hierarchical **Component Tree**.

### (3) Vue Code Examples

#### Short Snippet
```vue
<!-- BaseButton.vue (Child Component) -->
<script setup>
defineProps({
  label: String
})
</script>

<template>
  <button class="custom-btn">{{ label }}</button>
</template>

<style scoped>
.custom-btn { padding: 8px 16px; border-radius: 4px; background: #1890ff; color: white; border: none; }
</style>
```

#### Fuller Example
```vue
<!-- App.vue (Parent Component assembling Component Tree) -->
<script setup>
import { ref } from 'vue'
import BaseButton from './BaseButton.vue' // Import child component

const userList = ref([
  { id: 1, name: 'Alice Specialist', role: 'Frontend Architect' },
  { id: 2, name: 'Bob Lead', role: 'DevOps Engineer' }
])

function handleAction(userName) {
  console.log(`Action triggered for user: ${userName}`)
}
</script>

<template>
  <main class="dashboard">
    <h2>Team Directory</h2>
    
    <div class="user-grid">
      <!-- Reusing components in a loop; each instance maintains isolated state -->
      <div v-for="user in userList" :key="user.id" class="user-card">
        <h3>{{ user.name }}</h3>
        <p>{{ user.role }}</p>
        
        <!-- Custom component tag usage -->
        <BaseButton 
          :label="`Contact ${user.name}`" 
          @click="handleAction(user.name)" 
        />
      </div>
    </div>
  </main>
</template>

<style scoped>
.user-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.user-card { padding: 16px; border: 1px solid #e8e8e8; border-radius: 8px; }
</style>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Creating "God Components" (Violating Single Responsibility Principle)

**The mistake:** Building an entire page layout (Navigation bar, Sidebar, Feed, Modals, Footer) inside a single 3,000-line `.vue` component file.

**Why it's wrong:** It completely defeats the architectural purpose of components. Long monolithic components are impossible to unit test, impossible to reuse elsewhere, and extremely difficult to maintain.

*Incorrect:*
```vue
<!-- App.vue containing 3,000 lines of navbar, sidebar, analytics charts, and footers -->
```

*Fix:* Extract reusable sub-views into separate focused components (`Navbar.vue`, `Sidebar.vue`, `AnalyticsChart.vue`).
```vue
<template>
  <Navbar />
  <main><AnalyticsChart /></main>
  <Footer />
</template>
```

---

### Mistake 2: Single-Word Component Names (Colliding with Native HTML5 Tags)

**The mistake:** Naming a custom Vue component file `Header.vue` or `Item.vue`.

**Why it's wrong:** HTML5 standards continuously introduce new native tags over time (`<header>`, `<item>`, `<article>`). Single-word custom component names risk colliding with standard HTML tags. Use multi-word component names (`AppHeader.vue`, `TodoItem.vue`).

*Incorrect:*
```javascript
// Component named Header.vue
app.component('Header', Header); // ❌ Collides with HTML5 <header> tag!
```

*Fix:*
```javascript
// Multi-word component naming convention
app.component('AppHeader', AppHeader); // Safe multi-word name
```

---

### Mistake 3: Explicitly registering imported components inside `<script setup>` (Vue 2 Habit)

**The mistake:** Adding `components: { ChildComponent }` options blocks inside Vue 3 `<script setup>`.

**Why it's wrong:** In `<script setup>`, any imported component variable is automatically registered and made available to template syntax immediately. Specifying a `components` registration block is redundant.

*Incorrect:*
```vue
<script setup>
import Child from './Child.vue';
export default { components: { Child } }; // ❌ Redundant Options API block in script setup!
</script>
```

*Fix:*
```vue
<script setup>
import Child from './Child.vue'; // Automatically registered and ready in <template>
</script>
```

---

## 5. Practice Exercises

### Exercise 1: IoT Smart Home Dashboard Component Tree (IoT)

**Scenario:** A smart home dashboard displays multiple environment sensors (Temperature, Humidity, Motion). You must construct a reusable component `<SensorTile>` that accepts sensor parameters and renders isolated tile states.

**Requirements:**
1. Create `SensorTile.vue` accepting props `title`, `value`, `unit`, and `isAlert`.
2. Display alert styling when `isAlert` is true.
3. Import and render multiple `<SensorTile>` components inside `SmartHomeApp.vue`.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <!-- SensorTile.vue (Child) -->
> <script setup>
> defineProps({
>   title: String,
>   value: Number,
>   unit: String,
>   isAlert: Boolean
> })
> </script>
> 
> <template>
>   <div :class="['tile', { alert: isAlert }]">
>     <h4>{{ title }}</h4>
>     <p class="reading">{{ value }} {{ unit }}</p>
>   </div>
> </template>
> 
> <style scoped>
> .tile { padding: 12px; border: 1px solid #ccc; border-radius: 6px; }
> .alert { border-color: #ff4d4f; background: #fff1f0; }
> .reading { font-size: 20px; font-weight: bold; }
> </style>
> ```
> 
> ```vue
> <!-- SmartHomeApp.vue (Parent) -->
> <script setup>
> import { ref } from 'vue'
> import SensorTile from './SensorTile.vue'
> 
> const sensors = ref([
>   { id: 1, title: 'Living Room Temp', value: 22, unit: '°C', isAlert: false },
>   { id: 2, title: 'Server Rack Temp', value: 88, unit: '°C', isAlert: true }
> ])
> </script>
> 
> <template>
>   <div class="dashboard">
>     <h2>Smart Home Sensors</h2>
>     <div class="grid">
>       <SensorTile 
>         v-for="s in sensors" 
>         :key="s.id" 
>         v-bind="s" 
>       />
>     </div>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: Components abstract UI markup into reusable, self-contained elements (`<SensorTile>`).
> 2. **Concept**: Props (`v-bind="s"`) configure component instances independently.
> 3. **Concept**: Scoped styles prevent tile CSS rules from leaking to parent containers.
> 4. **Concept**: Multiple instances maintain isolated memory scopes.
> 
---

### Exercise 2: Financial Stock Watchlist Component Modularization (Finance)

**Scenario:** A stock trading application requires modularizing a stock watchlist table into clean reusable `<StockRow>` components.

**Requirements:**
1. Build `StockRow.vue` component displaying ticker, price, and price change percentage.
2. Implement click handler emitting selected ticker to parent.
3. Render list of `<StockRow>` instances inside `Watchlist.vue`.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <!-- StockRow.vue -->
> <script setup>
> defineProps({
>   symbol: String,
>   price: Number,
>   changePercent: Number
> })
> 
> const emit = defineEmits(['select'])
> </script>
> 
> <template>
>   <div class="stock-row" @click="emit('select', symbol)">
>     <span class="sym">{{ symbol }}</span>
>     <span class="price">${{ price.toFixed(2) }}</span>
>     <span :class="['change', changePercent >= 0 ? 'up' : 'down']">
>       {{ changePercent >= 0 ? '+' : '' }}{{ changePercent }}%
>     </span>
>   </div>
> </template>
> 
> <style scoped>
> .stock-row { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee; cursor: pointer; }
> .up { color: #52c41a; }
> .down { color: #ff4d4f; }
> </style>
> ```
>
> #### Technical Explanation
> 1. **Concept**: `defineProps` declares explicit input interfaces for components.
> 2. **Concept**: `defineEmits` declares upward event channels back to parent scopes.
> 3. **Concept**: Clicking rows triggers component emits without mutating props directly.
> 4. **Concept**: Decouples UI table rendering from parent state logic.
> 
---

### Exercise 3: Real-Time Network Health Indicator Component (Networking)

**Scenario:** A network monitoring tool displays router health badges using PascalCase component tags `<HealthBadge>` with custom status prop inputs.

**Requirements:**
1. Create `HealthBadge.vue` accepting string prop `status` ('HEALTHY', 'DEGRADED', 'CRITICAL').
2. Render status text with corresponding color theme.
3. Demonstrate PascalCase component usage inside parent template.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <!-- HealthBadge.vue -->
> <script setup>
> defineProps({
>   status: {
>     type: String,
>     default: 'HEALTHY'
>   }
> })
> </script>
> 
> <template>
>   <span :class="['badge', status.toLowerCase()]">
>     ● {{ status }}
>   </span>
> </template>
> 
> <style scoped>
> .badge { padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; }
> .healthy { background: #e6f7ff; color: #1890ff; }
> .degraded { background: #fffbe6; color: #faad14; }
> .critical { background: #fff1f0; color: #ff4d4f; }
> </style>
> ```
>
> #### Technical Explanation
> 1. **Concept**: PascalCase tags (`<HealthBadge />`) visually distinguish custom Vue components from native HTML elements.
> 2. **Concept**: Component props provide default fallback values when un-specified.
> 3. **Concept**: Class binding maps props to scoped CSS styles cleanly.
> 4. **Concept**: Encapsulates badge styling into a single reusable unit.
> 
---

## 6. Related Terms

- [Single-File Components (SFCs)](sfc.md) — Physical `.vue` file structure.
- [Props](props.md) — Passing data down into components.
- [Emitting Events (`defineEmits`)](emit.md) — Sending event messages up from components.
- [Dynamic Components (`<component :is>`)](dynamic_components.md) — Runtime component swapping.
- [Fallthrough Attributes (`$attrs`)](fallthrough_attributes.md) — Undeclared attribute forwarding.
- [Slots](../level_05/slots.md) — Content distribution outlets.

---

## 7. Key Takeaways

- **Components** are reusable, isolated building blocks encapsulating HTML, JS, and CSS.
- Every Vue application is structured as a hierarchical **Component Tree**.
- Multi-word component names (`AppHeader.vue`) prevent collisions with native HTML5 tags.
- In `<script setup>`, imported components are registered automatically.
- Keep components small, focused on a single responsibility, and under 300 lines of code.
