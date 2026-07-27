# Dynamic Components (`<component :is>`)

> **Level 4 — Components & Props**
> A pattern that allows swapping which component renders at runtime by binding a reactive value to Vue's built-in `<component>` placeholder using the `:is` attribute.

---

## 1. Prerequisites
- [Components](../level_04/components.md) — The building blocks of Vue layout.
- [`v-bind`](../level_03/v_bind.md) — Dynamically passing attributes.

---

## 2. Term Category
- **Component Pattern**

---

## 3. Environment Context
- **Client-Side (Browser)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In multi-view web layouts, developers frequently need to swap sections of a page based on user interaction. A classic example is a tabbed panel (e.g., swapping between "Profile", "Settings", and "Security" views) or a multi-step checkout wizard.

A naive approach to this problem uses conditional rendering:
```vue
<ProfileTab v-if="activeTab === 'profile'" />
<SettingsTab v-else-if="activeTab === 'settings'" />
<SecurityTab v-else-if="activeTab === 'security'" />
```
As your application grows and you add more views, this list of `v-if` elements becomes massive, repetitive, and hard to maintain. 

Vue introduced **Dynamic Components** to solve this cleanly. Instead of writing multiple conditional elements, you write a single placeholder element—`<component>`—and bind its type to a reactive variable using the `:is` attribute.

### (2) How it works under the hood
The built-in `<component>` element does not render a real DOM tag itself. Instead, it acts as a slot that Vue resolves dynamically at runtime.

The `:is` attribute accepts two formats:
1. **A String:** Either a registered component name (e.g. `'ProfileTab'`) or a native HTML element tag (e.g. `'input'` or `'button'`).
2. **The Component Object:** The raw, imported Vue component definition (e.g. `ProfileTab` import object). This is the preferred method when working with `<script setup>`.

When the reactive variable bound to `:is` changes, Vue's Virtual DOM engine checks the new component type against the old one. Because the types do not match, Vue runs a full unmount cycle on the active component (destroying its local state and triggering unmount hooks) and then mounts the new component in its place.

### (3) Code Examples

#### Short Snippet
Swapping between two imported components using a tab system:
```vue
<script setup>
import { ref } from 'vue'
import HomeTab from './HomeTab.vue'
import SettingsTab from './SettingsTab.vue'

const currentTab = ref(HomeTab) // Holds the imported component object
</script>

<template>
  <div class="tabs">
    <button @click="currentTab = HomeTab">Home</button>
    <button @click="currentTab = SettingsTab">Settings</button>
    
    <!-- Render the active component dynamically -->
    <component :is="currentTab" />
  </div>
</template>
```

#### Fuller Example
In this dashboard portal, components are swapped dynamically. We can also bind props and event listeners to the dynamic component. Vue automatically maps the bound props to whichever component is currently active.

```vue
<!-- App.vue -->
<script setup>
import { ref, computed } from 'vue'
import LineChart from './LineChart.vue'
import TableWidget from './TableWidget.vue'

const currentWidget = ref(LineChart)
const queryParam = ref('all')

// Generate props dynamically based on the current selection
const widgetProps = computed(() => {
  if (currentWidget.value === LineChart) {
    return { type: 'monochrome', threshold: 100 }
  }
  return { rows: 20 }
})

function handleWidgetAction(payload) {
  console.log('Action triggered from widget:', payload)
}
</script>

<template>
  <div class="dashboard">
    <div class="controls">
      <button @click="currentWidget = LineChart">Show Chart</button>
      <button @click="currentWidget = TableWidget">Show Table</button>
    </div>

    <!-- 
      Dynamic component:
      - :is: switches the component
      - v-bind: forwards the appropriate props object
      - @action: binds the listener to the child component
    -->
    <component 
      :is="currentWidget" 
      v-bind="widgetProps" 
      @action="handleWidgetAction" 
    />
  </div>
</template>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Expecting state to persist when switching components

**The mistake:** Expecting values inside input elements or local ref state to stay populated when switching tabs.

**Why it's wrong:** Swapping dynamic components triggers a full destruction of the active component. Its DOM nodes are removed, local state is garbage collected, and its lifecycle ends. When the user switches back, they get a fresh instance with empty values.

*Incorrect:*
```vue
<!-- The input state of Tab A is lost when switching to Tab B -->
<component :is="activeTab" />
```

*Fix:* Wrap the component in Vue's built-in `<KeepAlive>` element to cache the state in memory.
```vue
<!-- Component state is cached and preserved when switched away -->
<KeepAlive>
  <component :is="activeTab" />
</KeepAlive>
```

**Golden Rule:** Swapping dynamic components destroys state by default. If preservation is needed, use `<KeepAlive>`.

---

### Mistake 2: Passing Component Class Names as Plain Strings to `<component :is="...">`

**The mistake:** Passing `:is="'TabHeader'"` as a string when `TabHeader` is imported in `<script setup>`.

**Why it's wrong:** In `<script setup>`, `:is` expects the actual imported component object reference, NOT a string name, unless registered globally.

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

### Mistake 3: Wrapping Component References in `ref()` (Reactivity Performance Overhead)

**The mistake:** Writing `const activeComponent = ref(TabHeader)` for heavy components.

**Why it's wrong:** `ref()` attempts to wrap the component object in a deep reactive Proxy, causing performance overhead and console warnings. Use `shallowRef(TabHeader)` or `markRaw()`.

*Incorrect:*
```javascript
const currentTab = ref(HeavyTabComponent); // ❌ Warning: Unnecessary reactive proxy on component!
```

*Fix:*
```javascript
const currentTab = shallowRef(HeavyTabComponent); // Use shallowRef for component references
```


---

## 6. Practice Exercises

### Exercise 1: Render dynamic HTML tags

**Problem:** Dynamic components can also render native HTML elements. Look at the code below. The user can type into an input field, but we want to change the element from a paragraph `<p>` to a heading `<h1>` dynamically based on a dropdown selection. Complete the `:is` binding.

```vue
<script setup>
import { ref } from 'vue'

const text = ref('Hello World')
const tagType = ref('p') // can be 'p', 'h1', or 'h2'
</script>

<template>
  <div>
    <select v-model="tagType">
      <option value="p">Paragraph</option>
      <option value="h1">Heading 1</option>
      <option value="h2">Heading 2</option>
    </select>
    
    <!-- Fix this element to render the dynamic tagType -->
    <component :is="tagType">{{ text }}</component>
  </div>
</template>
```

**Expected output:**
```text
Changing the dropdown correctly swaps the container wrapper between <p>, <h1>, and <h2> tags.
```

> [!check]- Answer
> - The built-in `<component>` element accepts native HTML string tags (like `'h1'`) inside `:is`.
> - Bind the `tagType` variable directly to the `:is` attribute.

---

### Exercise 2: Dynamic Tab Switching Pattern

**Problem:** Write template code using `<component :is="activeTab">` and `<button>` toggling between `TabA` and `TabB` (`shallowRef`).

**Expected output:**
```vue
<script setup> import { shallowRef } from 'vue'; import TabA from './TabA.vue'; import TabB from './TabB.vue'; const activeTab = shallowRef(TabA); </script> <template> <button @click="activeTab = TabA">Tab A</button> <button @click="activeTab = TabB">Tab B</button> <component :is="activeTab" /> </template>
```

> [!check]- Answer
> - Use `shallowRef()` for active component variables.
> - `<component :is="...">` renders dynamic component targets.
> 
> ```vue
> <script setup>
> import { shallowRef } from 'vue';
> import TabA from './TabA.vue';
> import TabB from './TabB.vue';
> 
> const activeTab = shallowRef(TabA);
> </script>
> 
> <template>
>   <button @click="activeTab = TabA">A</button>
>   <button @click="activeTab = TabB">B</button>
>   <component :is="activeTab" />
> </template>
> ```

---

### Exercise 3: KeepAlive Caching with Dynamic Components

**Problem:** Which built-in Vue wrapper component preserves state of unmounted dynamic components when toggling tabs?

**Expected output:**
```text
<KeepAlive><component :is="activeTab" /></KeepAlive>
```

> [!check]- Answer
> - `<KeepAlive>` caches inactive component instances in memory.
> 
> ```html
> <KeepAlive>
>   <component :is="activeTab" />
> </KeepAlive>
> ```


---

## 7. Related Terms
- [Components](../level_04/components.md) — The fundamental Vue components.
- [KeepAlive](../level_08/keepalive.md) — Caching dynamic component instances.
- [Async Components](../level_08/async_components.md) — Lazily loading components only when they are rendered.

---

## 8. Key Takeaways
- **`<component>`** is a built-in Vue element placeholder that renders a target component dynamically.
- The **`:is`** attribute specifies which component to mount, accepting string tags or imported component objects.
- In `<script setup>`, pass the imported component object directly to the `:is` attribute.
- Switching components triggers a full unmount of the old instance, destroying local state by default.
- Bindings (props, listeners) placed on `<component>` are automatically routed to the currently active component.
