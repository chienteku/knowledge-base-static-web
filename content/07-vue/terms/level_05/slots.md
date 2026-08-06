# Slots

> **Level 5 — Advanced Component Architecture**
> A mechanism for content distribution that allows a Parent component to pass raw HTML or other components into a specific placeholder inside a Child component's template.

---

## 1. Prerequisites

- [Props](../level_04/props.md) — The building blocks involved.
- [Props](../level_04/props.md) — The standard way to pass simple data. Slots are for passing HTML structure.

---

## 2. Term Category

**Vue Core Concept (Content Distribution / Template Composition)**: Slots are Vue's native mechanism for template content distribution (also known as transclusion). They allow parent components to inject raw HTML markup, inline elements, or secondary Vue components into designated placeholder locations defined within a child component's template.

Based on the W3C Web Components Shadow DOM slot specification, slots enable structural flexibility across reusable UI widgets like modals, cards, tabs, and layout containers. While props pass raw JavaScript data types down to child components, slots pass rendered Virtual DOM node subtrees (`VNodes`). In React, this behavior is handled by passing JSX nodes via `props.children` or custom props (`header={<Header />}`). Vue provides explicit `<slot>` template elements with built-in support for fallback content, named slots, and shorthand binding syntax (`#header`).

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Imagine building a reusable `<ModalDialog>` component. The modal requires a backdrop, an overlay container, a close icon, and a content area in the center. If you attempted to pass the modal's internal content using text props (`:headerText="'Confirm'"`, `:bodyText="'Are you sure?'"`), you quickly encounter severe limitations when the parent needs to render rich HTML—such as formatted lists, input forms, images, or interactive button groups inside the modal.

Passing HTML markup as raw string props leads to unmaintainable code and security risks (like XSS vulnerabilities when using `v-html`). Slots solve this elegantly by creating structural placeholders inside the child component's layout template. The parent component retains complete control over what HTML elements or child components are passed into those placeholders.

### (2) Reality Metaphor
Think of a Vue Slot like a modular wall-mount picture frame. The frame manufacturer (the child component) builds the outer wooden border, glass cover, hanging wire, and backboard clips. However, the manufacturer does not print pictures inside the frame. Instead, they cut out a open window (the slot placeholder). When an art collector (the parent component) buys the frame, they insert whatever artwork, photograph, or fabric swatch they desire directly into the opening. The frame handles structural mounting and positioning, while the collector retains total freedom over visual content.

### (3) Vue Code Examples

#### Short Snippet
```vue
<!-- BaseButton.vue (Child Component) -->
<template>
  <button class="btn">
    <!-- Slot placeholder with fallback text -->
    <slot>Default Button Text</slot>
  </button>
</template>
```

```vue
<!-- App.vue (Parent Component) -->
<template>
  <BaseButton>
    <!-- Injected HTML content replaces fallback text -->
    <span class="icon">🚀</span> Submit Order
  </BaseButton>
</template>
```

#### Fuller Example
```vue
<!-- ModalCard.vue (Child Component with Named Slots) -->
<template>
  <div class="modal-backdrop">
    <div class="modal-card">
      <!-- Header Named Slot -->
      <header class="modal-header">
        <slot name="header">
          <h3>Default Modal Header</h3>
        </slot>
      </header>

      <!-- Default Body Slot -->
      <main class="modal-body">
        <slot></slot>
      </main>

      <!-- Footer Named Slot -->
      <footer class="modal-footer">
        <slot name="footer">
          <button class="btn-secondary">Close</button>
        </slot>
      </footer>
    </div>
  </div>
</template>
```

```vue
<!-- BankingDashboard.vue (Parent Component targeting slots) -->
<script setup>
import ModalCard from './ModalCard.vue'
</script>

<template>
  <ModalCard>
    <!-- Target #header named slot using shorthand syntax -->
    <template #header>
      <h3 class="text-danger">⚠️ Transfer Authorization</h3>
    </template>

    <!-- Main default slot content -->
    <p>Confirm wire transfer of <strong>$50,000.00 USD</strong> to account #8821?</p>

    <!-- Target #footer named slot -->
    <template #footer>
      <button class="btn-cancel">Cancel</button>
      <button class="btn-confirm">Authorize Transfer</button>
    </template>
  </ModalCard>
</template>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting Fallback Content for Optional Slots

**The mistake:** Leaving `<slot name="header"></slot>` completely empty without fallback default content in reusable UI primitives.

**Why it's wrong:** If a consuming parent component omits content for a slot that lacks fallback content, the child component renders an empty HTML wrapper or missing layout section, leading to broken padding or unexpected whitespace.

*Incorrect:*
```vue
<!-- Empty slot tag yields nothing if parent omits template -->
<div class="card-header"><slot name="header"></slot></div>
```

*Fix:*
```vue
<!-- Provide fallback content inside the slot tag: -->
<div class="card-header">
  <slot name="header">
    <h4 class="default-title">Default Section Title</h4>
  </slot>
</div>
```

---

### Mistake 2: Mixing Unwrapped Default Content with Named `<template>` Blocks

**The mistake:** Placing default slot HTML elements directly on component tags alongside explicit `<template #header>` blocks.

**Why it's wrong:** Mixing direct child elements with named template blocks creates ambiguity regarding default slot boundaries during VNode compilation.

*Incorrect:*
```vue
<ModalCard>
  <h2>Main Body Content</h2> <!-- ❌ Unwrapped element mixed with named templates -->
  <template #header><h3>Header Title</h3></template>
</ModalCard>
```

*Fix:*
```vue
<ModalCard>
  <template #header><h3>Header Title</h3></template>
  <template #default><h2>Main Body Content</h2></template> <!-- Explicit #default tag -->
</ModalCard>
```

---

### Mistake 3: Attempting to Read Slot Content inside Child `<script setup>` without `useSlots()`

**The mistake:** Trying to inspect or conditionally execute logic based on slot presence inside `<script setup>` using standard local state variables.

**Why it's wrong:** Slot content exists in the parent scope. In Vue 3 Composition API, child components must call `useSlots()` to inspect passed slot functions (`slots.header`) programmatically.

*Incorrect:*
```javascript
// ❌ Invalid attempt to check slot existence:
if (this.$slots.header) { /* ... */ }
```

*Fix:*
```javascript
import { useSlots } from 'vue';

const slots = useSlots();
const hasHeaderSlot = !!slots.header; // Clean slot presence check inside <script setup>
```

---

## 5. Practice Exercises

### Exercise 1: Financial Banking Transaction Dialog Component

**Scenario:** A commercial banking web application requires a reusable `<TransactionDialog>` layout component with `#header`, `#default`, and `#footer` named slots.

**Requirements:**
1. `<TransactionDialog>` renders a styled card layout with three distinct named slot regions.
2. Provide fallback default text `"Default Dialog Header"` inside `#header`.
3. Parent component targets `#header` using shorthand `#header` syntax and supplies custom transfer details into the default slot.
4. Include test assertions for slot node structural hierarchy.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <!-- TransactionDialog.vue (Child Component) -->
> <template>
>   <div class="dialog-overlay">
>     <div class="dialog-box">
>       <header class="dialog-header">
>         <slot name="header">Default Dialog Header</slot>
>       </header>
>       <section class="dialog-body">
>         <slot></slot>
>       </section>
>       <footer class="dialog-footer">
>         <slot name="footer">
>           <button>OK</button>
>         </slot>
>       </footer>
>     </div>
>   </div>
> </template>
> ```
> 
> ```vue
> <!-- BankPortal.vue (Parent Component) -->
> <script setup>
> import TransactionDialog from './TransactionDialog.vue';
> </script>
> 
> <template>
>   <TransactionDialog>
>     <template #header>
>       <h2>Secure Wire Transfer</h2>
>     </template>
>     
>     <p>Transferring $10,000 to Account USD-9902.</p>
>     
>     <template #footer>
>       <button class="btn-secondary">Decline</button>
>       <button class="btn-primary">Approve</button>
>     </template>
>   </TransactionDialog>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Named Slot Declarations**: `<slot name="header">` establishes explicit target projection anchors inside the dialog structure.
> 2. **Shorthand Syntax**: Parent uses `#header` and `#footer` shorthand instead of full `v-slot:header`.
> 3. **Fallback Injection**: When the parent omits `#footer`, the default `<button>OK</button>` renders automatically.
> 4. **VNode Projection**: Passed template fragments are compiled into VNode rendering functions without mutating child DOM nodes.
> 
---

### Exercise 2: E-Commerce Product Card Slot Inspection (`useSlots`)

**Scenario:** An e-commerce product grid component `<ProductCard>` needs to render a promotional banner bar *only* if the parent component explicitly provides content for an `#actionBanner` slot.

**Requirements:**
1. Use `useSlots()` inside `<script setup>` to inspect passed slots.
2. Maintain a reactive computed property `hasBanner` that evaluates `!!slots.actionBanner`.
3. Conditionally render `<div class="banner-wrapper" v-if="hasBanner">` in the child template.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <!-- ProductCard.vue (Child) -->
> <script setup>
> import { useSlots, computed } from 'vue';
> 
> const slots = useSlots();
> const hasBanner = computed(() => !!slots.actionBanner);
> </script>
> 
> <template>
>   <div class="product-card">
>     <div v-if="hasBanner" class="banner-wrapper">
>       <slot name="actionBanner"></slot>
>     </div>
>     <div class="card-content">
>       <slot></slot>
>     </div>
>   </div>
> </template>
> ```
> 
> ```vue
> <!-- StoreFront.vue (Parent) -->
> <script setup>
> import ProductCard from './ProductCard.vue';
> </script>
> 
> <template>
>   <ProductCard>
>     <template #actionBanner>
>       <span class="sale-badge">FLASH SALE - 50% OFF</span>
>     </template>
>     
>     <h3>Wireless Headphones</h3>
>     <p>$99.00</p>
>   </ProductCard>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Programmatic Inspection**: `useSlots()` returns an object containing slot render functions provided by the parent instance.
> 2. **DOM Optimization**: `v-if="hasBanner"` prevents empty `<div class="banner-wrapper">` elements from polluting the DOM when no banner slot is supplied.
> 3. **Reactive Derivation**: Wrapping `slots.actionBanner` check inside `computed()` guarantees re-evaluation during parent slot updates.
> 4. **Encapsulated Layout Logic**: Wraps structural card container logic safely away from parent view controllers.
> 
---

### Exercise 3: Industrial IoT Alarm Dashboard with Dynamic Slot Names

**Scenario:** An industrial SCADA monitoring system renders dynamically configured alert panels based on active sensor warning levels (`'critical'`, `'warning'`, `'info'`). Use dynamic slot syntax `#[dynamicSlotName]` to inject level-specific actions.

**Requirements:**
1. Child component `<AlarmPanel>` accepts a prop `:severityLevel` (e.g. `'critical'`).
2. Parent targets dynamic slot `#[severityLevel]` using dynamic template slot syntax.
3. Validate dynamic slot template execution across changing severity values.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <!-- AlarmPanel.vue (Child) -->
> <script setup>
> defineProps({
>   severityLevel: { type: String, required: true } // 'critical' | 'warning' | 'info'
> });
> </script>
> 
> <template>
>   <div class="alarm-panel" :class="severityLevel">
>     <h3>Alarm Status: {{ severityLevel.toUpperCase() }}</h3>
>     <div class="action-area">
>       <!-- Named slot dynamically matches severityLevel string -->
>       <slot :name="severityLevel">
>         <button>Acknowledge Alarm</button>
>       </slot>
>     </div>
>   </div>
> </template>
> ```
> 
> ```vue
> <!-- FactoryConsole.vue (Parent) -->
> <script setup>
> import { ref } from 'vue';
> import AlarmPanel from './AlarmPanel.vue';
> 
> const currentLevel = ref('critical');
> </script>
> 
> <template>
>   <AlarmPanel :severityLevel="currentLevel">
>     <!-- Target slot dynamically using bracket syntax #[variable] -->
>     <template #[currentLevel]>
>       <button class="btn-emergency">🔴 INITIATE EMERGENCY SHUTDOWN</button>
>     </template>
>   </AlarmPanel>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Dynamic Slot Target**: `#[currentLevel]` compiles to dynamic template slot matching `v-slot:[currentLevel]`.
> 2. **Flexible Projection**: Changing `currentLevel.value` dynamically shifts slot content projection to match the new slot name.
> 3. **Fallback Resiliency**: Unmatched slot names automatically fallback to rendering `<button>Acknowledge Alarm</button>`.
> 4. **Type-Safe Binding**: Props pass severity strings cleanly into the child template slot resolver.
> 
---

## 6. Related Terms

- [Scoped Slots](scoped_slots.md) — Advanced slots that send data *back up* to the parent.
- [Props](../level_04/props.md) — For passing JavaScript data instead of HTML structure.
- [Components](../level_04/components.md) — Component template insertion.

---

## 7. Key Takeaways

- **Slots** allow parent components to inject HTML markup or components into designated placeholders inside child templates.
- **Default Slots** (`<slot></slot>`) receive unwrapped content passed between opening and closing child component tags.
- **Named Slots** (`<slot name="header">`) enable multiple content injection points targeted via `<template #header>`.
- Always provide sensible fallback content inside `<slot>Fallback Content</slot>` to handle omitted parent templates.
- Use `useSlots()` inside `<script setup>` to programmatically check for slot presence before rendering wrapper DOM nodes.
