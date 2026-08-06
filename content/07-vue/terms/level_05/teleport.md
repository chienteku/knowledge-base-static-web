# Teleport

> **Level 5 — Advanced Component Architecture**
> A built-in Vue component that allows you to render a piece of your component's HTML in a completely different location in the browser's DOM tree, breaking out of the component hierarchy.

---

## 1. Prerequisites

- [Components](../level_04/components.md) — Understanding the strict hierarchy of the Component Tree.
- [DOM (Document Object Model)](../../../01-html/terms/level_09/dom.md) — The physical HTML structure we are breaking out of.

---

## 2. Term Category

**Vue Built-in Component (DOM Projection Architecture)**: Teleport is a built-in Vue 3 component that allows developers to physically transport rendered HTML elements to a targeted location outside the host component's physical DOM container (e.g. appending directly to `document.body` or `#modal-root`), while maintaining full logical component state hierarchy.

By default, Vue component templates render their DOM elements strictly inside their parent container element. However, UI overlays like full-screen modals, tooltips, dropdowns, and toast notifications often fail when placed inside containers governed by `overflow: hidden`, `transform`, or strict `z-index` stacking contexts. In React, this issue is addressed programmatically via `ReactDOM.createPortal()`. Vue's `<Teleport>` provides a declarative template API (`<Teleport to="body">`) that supports dynamic destination updates (`:to="targetSelector"`) and conditional inline rendering (`:disabled="isMobile"`).

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Imagine building a deeply nested `<UserProfileCard>` component located inside a sidebar (`<aside class="sidebar" style="overflow: hidden; z-index: 2;">`). When the user clicks "Delete Account," the component needs to render a full-screen confirmation modal dialog overlaying the entire application.

If the modal's HTML remains physically nested inside the `<aside>` container, CSS layout rules cause severe rendering bugs: the modal gets clipped by `overflow: hidden`, or its backdrop fails to cover the full viewport because of stacking context constraints on the parent element. `<Teleport>` solves this cleanly by allowing the component's script logic to reside deep in `<UserProfileCard>`, while beaming the rendered modal HTML nodes straight out to `document.body`.

### (2) Reality Metaphor
Think of `<Teleport>` like a Holographic Telecommunication Projector installed on a flagship bridge. The commander (the parent component) stands on the physical bridge deck (the component hierarchy) and operates the control interface (reactive state, methods, injected props). However, when the commander transmits an instruction, the holographic projector beams a 3D avatar (the rendered DOM markup) into an off-site conference room (the target `<body>` tag). The avatar physically appears in the off-site room, but its actions remain completely controlled by the commander back on the bridge.

### (3) Vue Code Examples

#### Short Snippet
```vue
<script setup>
import { ref } from 'vue'
const isOpen = ref(false)
</script>

<template>
  <button @click="isOpen = true">Open Modal</button>

  <!-- Physical HTML is beamed to <body>; logical Vue reactive state stays here! -->
  <Teleport to="body">
    <div v-if="isOpen" class="modal-backdrop">
      <p>Full-screen overlay content</p>
      <button @click="isOpen = false">Close</button>
    </div>
  </Teleport>
</template>
```

#### Fuller Example
```vue
<!-- UserSettings.vue (Nested inside a constrained container) -->
<script setup>
import { ref } from 'vue'

const showConfirmModal = ref(false)
const isProcessing = ref(false)

function handleConfirmDelete() {
  isProcessing.value = true
  setTimeout(() => {
    isProcessing.value = false
    showConfirmModal.value = false
  }, 1000)
}
</script>

<template>
  <div class="settings-card-constrained">
    <h3>Account Actions</h3>
    <button class="btn-danger" @click="showConfirmModal = true">Delete Account</button>

    <!-- Teleport moves modal DOM nodes out to #modal-root to escape clipping -->
    <Teleport to="#modal-root">
      <div v-if="showConfirmModal" class="modal-overlay">
        <div class="modal-content">
          <h4>Confirm Account Deletion</h4>
          <p>This action is irreversible. Are you sure?</p>
          <div class="modal-actions">
            <button :disabled="isProcessing" @click="showConfirmModal = false">Cancel</button>
            <button :disabled="isProcessing" class="btn-confirm" @click="handleConfirmDelete">
              {{ isProcessing ? 'Deleting...' : 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* Component scoped CSS styles STILL APPLY to teleported elements! */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}
.modal-content {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
}
</style>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Teleporting to a DOM Target Selector That Does Not Exist Yet

**The mistake:** Specifying `<Teleport to="#missing-target">` when `<div id="missing-target">` is not present in the DOM at the time the component mounts.

**Why it's wrong:** Vue attempts to append teleported DOM nodes immediately during component mount. If `document.querySelector(to)` returns `null`, Vue throws a fatal runtime error.

*Incorrect:*
```vue
<!-- ❌ Target container missing in DOM when this mounts: -->
<Teleport to="#dynamic-modal-container">
  <ModalDialog />
</Teleport>
```

*Fix:*
```vue
<!-- Ensure target container exists statically in index.html, or defer rendering until mounted: -->
<!-- In index.html: <div id="modal-root"></div> -->
<Teleport to="#modal-root">
  <ModalDialog />
</Teleport>
```

---

### Mistake 2: Assuming Teleported Components Lose Parent Reactive State Context

**The mistake:** Thinking props, event emitters, or `inject()` bindings break when an element is teleported to `document.body`.

**Why it's wrong:** `<Teleport>` moves *only* the physical DOM elements in the browser layout tree. Logical parent-child relationships within Vue's Virtual DOM remain 100% intact. Props, injects, and custom events operate normally.

*Incorrect:*
```javascript
/* Believing teleported children can no longer access parent inject() bindings */
```

*Fix:*
```javascript
/* Teleport preserves Vue Virtual DOM hierarchy, reactive props, and inject() context */
```

---

### Mistake 3: Overlooking Mobile Responsive Teleportation Needs

**The mistake:** Hardcoding teleportation behavior without considering screen sizes where inline rendering is preferred over full-screen overlays.

**Why it's wrong:** On mobile devices, inline expandable panels are often preferable to body overlays. Forgetting the `:disabled` prop forces full-screen modals across all viewports.

*Incorrect:*
```vue
<Teleport to="body">
  <DropdownMenu /> <!-- ❌ Teleports on all screen sizes indiscriminately -->
</Teleport>
```

*Fix:*
```vue
<script setup>
import { ref } from 'vue'
const isMobile = ref(window.innerWidth < 768)
</script>

<template>
  <Teleport to="body" :disabled="isMobile">
    <DropdownMenu /> <!-- Renders inline on mobile; teleports on desktop -->
  </Teleport>
</template>
```

---

## 5. Practice Exercises

### Exercise 1: E-Commerce Cart Checkout Modal Overlay

**Scenario:** An e-commerce platform needs a full-screen confirmation modal overlay for single-click cart purchases. The button lives deep inside a product card component, but the modal must render under `document.body`.

**Requirements:**
1. Maintain reactive boolean `isCheckoutOpen`.
2. Wrap modal container inside `<Teleport to="body">`.
3. Include scoped CSS verifying that `data-v-xxxx` attributes remain attached to teleported elements.
4. Include test assertions for open/close state transitions.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <!-- ProductCard.vue -->
> <script setup>
> import { ref } from 'vue';
> 
> const isCheckoutOpen = ref(false);
> function toggleCheckout() {
>   isCheckoutOpen.value = !isCheckoutOpen.value;
> }
> </script>
> 
> <template>
>   <div class="product-card-container">
>     <button class="btn-buy" @click="toggleCheckout">Buy Now</button>
>     
>     <Teleport to="body">
>       <div v-if="isCheckoutOpen" class="cart-modal">
>         <h3>Confirm Instant Purchase</h3>
>         <p>Total: $149.00</p>
>         <button @click="toggleCheckout">Cancel</button>
>       </div>
>     </Teleport>
>   </div>
> </template>
> 
> <style scoped>
> .cart-modal {
>   position: fixed;
>   top: 50%;
>   left: 50%;
>   transform: translate(-50%, -50%);
>   background: white;
>   padding: 30px;
>   box-shadow: 0 10px 25px rgba(0,0,0,0.2);
>   z-index: 999;
> }
> </style>
> ```
>
> #### Technical Explanation
> 1. **DOM Escaping**: `<Teleport to="body">` shifts physical `.cart-modal` elements directly into `document.body`.
> 2. **Scoped CSS Preservation**: Vue's compiler attaches `data-v-xxxx` scoped style attributes *before* teleportation occurs, ensuring scoped styles work seamlessly.
> 3. **State Integrity**: `isCheckoutOpen` ref resides safely within `ProductCard.vue`.
> 4. **No Z-Index Trapping**: Escapes parent `.product-card-container` stacking contexts completely.
> 
---

### Exercise 2: Financial Stock Ticker Dynamic Tooltip Positioning

**Scenario:** A stock trading workstation renders financial charts. Hovering over a ticker symbol displays a detailed market depth tooltip. On desktop viewports, tooltips teleport to `#tooltip-portal`, while on mobile touchscreens they render inline using `:disabled`.

**Requirements:**
1. Accept boolean prop `:isMobileView`.
2. Wrap tooltip markup inside `<Teleport to="#tooltip-portal" :disabled="isMobileView">`.
3. Demonstrate toggle functionality.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <!-- StockTicker.vue -->
> <script setup>
> import { ref } from 'vue';
> 
> defineProps({
>   isMobileView: { type: Boolean, default: false },
>   symbol: { type: String, required: true }
> });
> 
> const isHovered = ref(false);
> </script>
> 
> <template>
>   <div class="ticker-badge" @mouseenter="isHovered = true" @mouseleave="isHovered = false">
>     <span>{{ symbol }}</span>
>     
>     <Teleport to="#tooltip-portal" :disabled="isMobileView">
>       <div v-if="isHovered" class="market-tooltip">
>         <p>{{ symbol }} Market Cap: $2.8T</p>
>         <p>Volume: 45.2M</p>
>       </div>
>     </Teleport>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Conditional Teleportation**: `:disabled="isMobileView"` leaves DOM nodes inline on touch screens while teleporting on desktop.
> 2. **Target Selector**: Targets explicit DOM container `#tooltip-portal`.
> 3. **Hover State Tracking**: Reactive `isHovered` ref governs conditional `v-if` visibility regardless of physical node destination.
> 4. **Clean Component Boundary**: Keeps stock ticker event handling encapsulated within the local component setup context.
> 
---

### Exercise 3: Healthcare Hospital Alert System Toast Notifications

**Scenario:** An intensive care hospital monitoring view fires urgent toast alert overlays. Multiple components across different wards emit alerts that must be teleported into a single global `#toast-container` element.

**Requirements:**
1. Target `<Teleport to="#toast-container">`.
2. Demonstrate multiple `<Teleport>` instances appending sequentially into the same target container.
3. Validate DOM order behavior.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <!-- WardAlert.vue -->
> <script setup>
> import { ref } from 'vue';
> 
> const alerts = ref([
>   { id: 1, text: 'ICU Bed 04: High Heart Rate' },
>   { id: 2, text: 'ER Room 02: Oxygen Flow Warning' }
> ]);
> 
> function dismissAlert(id) {
>   alerts.value = alerts.value.filter(a => a.id !== id);
> }
> </script>
> 
> <template>
>   <div class="ward-panel">
>     <h2>Ward 3 Operations</h2>
>     
>     <!-- Teleport appends each notification to global #toast-container -->
>     <Teleport to="#toast-container">
>       <div v-for="alert in alerts" :key="alert.id" class="toast-alert">
>         <span>⚠️ {{ alert.text }}</span>
>         <button @click="dismissAlert(alert.id)">Dismiss</button>
>       </div>
>     </Teleport>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Sequential Append**: Multiple `<Teleport>` instances targeting `#toast-container` append their elements sequentially without overwriting existing sibling nodes.
> 2. **Centralized Notification Stack**: Enables distributed components to stream toast alerts to a single visual container.
> 3. **Array Mutation reactivity**: Mutating `alerts` array updates teleported toast nodes reactively.
> 4. **Decoupled DOM Architecture**: Keeps ward notification logic cleanly separated from root toast container styling.
> 
---

## 6. Related Terms

- [Components](../level_04/components.md) — What Teleport allows you to escape.
- [Single-File Components (SFCs)](../level_04/sfc.md) — Scoped styling still works with Teleport!
- [`<Suspense>` (Vue)](suspense.md) — Related concept: `<Suspense>` (Vue).

---

## 7. Key Takeaways

- **`<Teleport>`** physically transports rendered HTML elements to a different location in the DOM tree (e.g. `body` or `#modal-root`).
- Solves CSS clipping, `z-index` stacking context, and `overflow: hidden` bugs for modals, tooltips, and toasts.
- Logical parent-child relationships in Vue's Virtual DOM remain 100% intact—props, injects, and custom events operate normally.
- Scoped CSS styles (`data-v-xxxx`) continue to apply to teleported elements seamlessly.
- Use **`:disabled="true"`** to conditionally disable teleportation and keep elements rendered inline (e.g., on mobile viewports).
