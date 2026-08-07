# Async Components

> **Level 8 — Advanced Architecture & Performance**
> Components that are loaded lazily over the network only when rendered, splitting code bundles to optimize initial application load performance.

---

## 1. Prerequisites

- [Components](../level_04/components.md) — The fundamental Vue building blocks being split and asynchronously loaded.
- [Vite](../level_10/vite.md) — The modern build tool responsible for analyzing dynamic imports and splitting JavaScript code into separate chunk files.

---

## 2. Term Category

**Vue Performance & Code-Splitting Feature (Lazy Component Loading)**: Async Components are Vue components loaded asynchronously on demand using `defineAsyncComponent()`. Instead of being compiled into the application's main initial JavaScript bundle (`index.js`), async components are split into distinct, separate JS chunk files by bundlers like Vite or Webpack.

Async Components function in both client-side Single Page Applications (SPAs) and Server-Side Rendered (SSR) environments. They defer downloading component code until the component is actually requested for rendering by the DOM (e.g., when a user opens a modal, toggles an accordion, or navigates to a tab). This dramatically reduces initial JavaScript bundle size, improves Time to Interactive (TTI), and minimizes initial network download payloads.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In traditional frontend bundlers, importing components using static ES6 imports (`import HeavyChart from './HeavyChart.vue'`) causes the bundler to concatenate all components into one massive JavaScript bundle. If an application contains complex 3D graphics canvas components, rich text editors, PDF exporters, and admin modal dialogs, a first-time visitor must download all of that code upfront—even if they only visit a basic login page.

**Async Components** solve this by leveraging JavaScript's dynamic `import()` function. By wrapping dynamic imports inside `defineAsyncComponent(() => import('./HeavyChart.vue'))`, developers signal to the build tool to slice the component into an isolated network chunk (`HeavyChart-[hash].js`). Vue defers making the HTTP network request for that chunk until the component is mounted in the template, saving megabytes of unused bandwidth during initial page load.

### (2) Reality Metaphor
Imagine ordering furniture from a home delivery catalog. In a static bundle model without code splitting, the delivery truck arrives at your house on Day 1 containing your kitchen table, a massive outdoor garden shed, a hot tub, and 20 bedroom wardrobe sets—forcing your driveway to clog and taking 8 hours to unload before you can walk through your front door.

Async Components are like modular delivery on demand. Day 1 delivers only the front door key and kitchen table (initial core bundle). The hot tub and garden shed (heavy modal components) remain stored in the regional logistics warehouse. Only when you press a button on your smartphone app asking to set up the hot tub does a small delivery van (an asynchronous HTTP chunk request) bring that specific component to your house.

### (3) Vue Code Examples

#### Short Snippet
```vue
<script setup>
import { defineAsyncComponent, ref } from 'vue'

// Define lazy-loaded component via dynamic import
const HeavyChart = defineAsyncComponent(() => import('./HeavyChart.vue'))

const isVisible = ref(false)
</script>

<template>
  <button @click="isVisible = true">Load Heavy Chart</button>
  <!-- Network chunk for HeavyChart is fetched ONLY when isVisible becomes true -->
  <HeavyChart v-if="isVisible" />
</template>
```

#### Fuller Example
```vue
<script setup>
import { defineAsyncComponent, ref } from 'vue'
import LoadingSpinner from './LoadingSpinner.vue'
import ErrorDisplay from './ErrorDisplay.vue'

// Advanced Async Component configuration with loader options
const AsyncRichEditor = defineAsyncComponent({
  // Factory loader returning dynamic import Promise
  loader: () => import('./RichTextEditor.vue'),

  // Fallback component rendered while chunk is fetching over network
  loadingComponent: LoadingSpinner,
  
  // Delay before showing loadingComponent (prevents spinner flicker on fast connections)
  delay: 200,

  // Fallback component rendered if network fetch fails or times out
  errorComponent: ErrorDisplay,

  // Timeout duration (ms) before throwing loading error
  timeout: 10000
})

const showEditor = ref(false)
</script>

<template>
  <div class="editor-container">
    <button @click="showEditor = !showEditor">
      {{ showEditor ? 'Close Editor' : 'Open Rich Text Editor' }}
    </button>

    <div v-if="showEditor" class="editor-wrapper">
      <!-- Renders LoadingSpinner during fetch, ErrorDisplay on failure, or RichTextEditor on success -->
      <AsyncRichEditor />
    </div>
  </div>
</template>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Over-Splitting Every Tiny UI Component
**The mistake:** Wrapping every standard button, icon, and input card in `defineAsyncComponent()` in an attempt to make the initial JS bundle ultra-small.

**Why it's wrong:** Every async component generates a separate HTTP network request chunk. If a page requires 40 tiny async components to render its primary layout, the browser must fire 40 concurrent HTTP requests, creating network latency bottlenecks, waterfalls, and UI layout flickering.

*Incorrect:*
```javascript
// ❌ Over-splitting small UI primitives causes network request waterfalls!
const CustomButton = defineAsyncComponent(() => import('./CustomButton.vue'))
const CardHeader = defineAsyncComponent(() => import('./CardHeader.vue'))
```

*Fix:*
```javascript
// Bundle small UI primitives statically; reserve async components for heavy features
import CustomButton from './CustomButton.vue'
const HeavyAnalyticsChart = defineAsyncComponent(() => import('./HeavyAnalyticsChart.vue'))
```

---

### Mistake 2: Returning Invalid Non-Promise Values in Loader Functions
**The mistake:** Writing `defineAsyncComponent(() => fetch('/api/component'))` or passing raw component objects directly instead of returning an ES module dynamic import Promise.

**Why it's wrong:** `defineAsyncComponent()` expects a factory function that returns a Promise resolving to a valid Vue component ES module (`() => import('./Comp.vue')`).

*Incorrect:*
```javascript
const AsyncComp = defineAsyncComponent(() => {
  return fetch('/component.vue') // ❌ Returns raw Response promise, not Vue ES module!
})
```

*Fix:*
```javascript
const AsyncComp = defineAsyncComponent(() => import('./Component.vue')) // Dynamic ES import
```

---

### Mistake 3: Omitting Error Components for Unreliable Network Environments
**The mistake:** Declaring simple async components without configuring fallback error components or timeout handlers.

**Why it's wrong:** If a user loses internet connectivity while opening a lazy-loaded modal chunk, the UI freezes indefinitely without providing feedback.

*Incorrect:*
```javascript
const AdminModal = defineAsyncComponent(() => import('./AdminModal.vue')) // No network fallback
```

*Fix:*
```javascript
const AdminModal = defineAsyncComponent({
  loader: () => import('./AdminModal.vue'),
  errorComponent: NetworkErrorToast,
  timeout: 8000
})
```

---

## 5. Practice Exercises

### Exercise 1: IoT Industrial Dashboard Dynamic Widget Loader
**Scenario:** An industrial IoT supervisory system displays dynamic telemetry widgets based on connected hardware types. Widgets (e.g., `TurbineWidget`, `SolarPanelWidget`) must be lazy-loaded on demand using `defineAsyncComponent`.

**Requirements:**
1. Define a dynamic component loader map mapping hardware types to `defineAsyncComponent` definitions.
2. Accept a prop `hardwareType` ('turbine', 'solar', 'battery').
3. Render the dynamic async component matching `hardwareType`.
4. Include a loading spinner fallback.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { defineAsyncComponent, computed } from 'vue'
> import LoadingSpinner from './LoadingSpinner.vue'
> 
> const props = defineProps({
>   hardwareType: { type: String, required: true }
> })
> 
> // Async component registry map
> const widgetRegistry = {
>   turbine: defineAsyncComponent({
>     loader: () => import('./widgets/TurbineWidget.vue'),
>     loadingComponent: LoadingSpinner,
>     delay: 150
>   }),
>   solar: defineAsyncComponent({
>     loader: () => import('./widgets/SolarPanelWidget.vue'),
>     loadingComponent: LoadingSpinner,
>     delay: 150
>   }),
>   battery: defineAsyncComponent({
>     loader: () => import('./widgets/BatteryWidget.vue'),
>     loadingComponent: LoadingSpinner,
>     delay: 150
>   })
> }
> 
> const activeWidgetComponent = computed(() => {
>   return widgetRegistry[props.hardwareType] || null
> })
> </script>
> 
> <template>
>   <div class="widget-host">
>     <component :is="activeWidgetComponent" v-if="activeWidgetComponent" />
>     <p v-else>Unknown hardware type</p>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Dynamic Registry Map**: `widgetRegistry` maps keys to distinct `defineAsyncComponent` factory wrappers.
> 2. **Vite Code-Splitting**: Vite extracts `TurbineWidget.vue`, `SolarPanelWidget.vue`, and `BatteryWidget.vue` into 3 separate JS chunks.
> 3. **Dynamic `<component :is>` Binding**: Computed `activeWidgetComponent` resolves the target async component ref dynamically.
> 4. **Graceful Loading UI**: `LoadingSpinner` displays while the targeted hardware chunk downloads over the network.
> 
---

### Exercise 2: Healthcare Patient Imaging DICOM Viewer Splitting
**Scenario:** A hospital web portal displays patient electronic records. The heavy 2D/3D DICOM medical image canvas viewer (5MB library size) must only download when a physician clicks "View Scan".

**Requirements:**
1. Maintain `isViewerOpen` boolean ref.
2. Lazy-load `DicomCanvasViewer.vue` using `defineAsyncComponent`.
3. Provide loading component `ScanLoadingPlaceholder`.
4. Provide timeout error handling after 12 seconds.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { defineAsyncComponent, ref } from 'vue'
> import ScanLoadingPlaceholder from './ScanLoadingPlaceholder.vue'
> import ScanErrorAlert from './ScanErrorAlert.vue'
> 
> const AsyncDicomViewer = defineAsyncComponent({
>   loader: () => import('./DicomCanvasViewer.vue'),
>   loadingComponent: ScanLoadingPlaceholder,
>   errorComponent: ScanErrorAlert,
>   delay: 100,
>   timeout: 12000
> })
> 
> const isViewerOpen = ref(false)
> </script>
> 
> <template>
>   <div class="patient-record">
>     <h3>Patient Record #9042</h3>
>     <button @click="isViewerOpen = true" :disabled="isViewerOpen">
>       View 3D DICOM Scan
>     </button>
> 
>     <div v-if="isViewerOpen" class="viewer-container">
>       <AsyncDicomViewer />
>     </div>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Initial Bundle Optimization**: The 5MB DICOM imaging library inside `DicomCanvasViewer.vue` is completely excluded from the primary JS bundle.
> 2. **Conditional Triggering**: `v-if="isViewerOpen"` ensures the loader function executes only when the physician clicks the button.
> 3. **Timeout Protection**: `timeout: 12000` catches slow hospital Wi-Fi connection failures and displays `ScanErrorAlert`.
> 4. **Flicker Reduction**: `delay: 100` prevents loading placeholder flicker on fast cached connections.
> 
---

### Exercise 3: E-Commerce Checkout Payment Gateway Lazy Loading
**Scenario:** An online store supports third-party payment gateways (PayPal, Stripe, Crypto Canvas). Gateway UI modules must be loaded asynchronously when the customer selects a payment option.

**Requirements:**
1. State `selectedGateway` ('stripe', 'paypal', 'crypto').
2. Use `defineAsyncComponent` for `StripeForm.vue`, `PaypalForm.vue`, `CryptoForm.vue`.
3. Dynamic component rendering in checkout view.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { defineAsyncComponent, ref, computed } from 'vue'
> 
> const StripeForm = defineAsyncComponent(() => import('./gateways/StripeForm.vue'))
> const PaypalForm = defineAsyncComponent(() => import('./gateways/PaypalForm.vue'))
> const CryptoForm = defineAsyncComponent(() => import('./gateways/CryptoForm.vue'))
> 
> const selectedGateway = ref('stripe')
> 
> const gatewayComponents = {
>   stripe: StripeForm,
>   paypal: PaypalForm,
>   crypto: CryptoForm
> }
> 
> const currentGatewayComponent = computed(() => gatewayComponents[selectedGateway.value])
> </script>
> 
> <template>
>   <div class="checkout-payment">
>     <h4>Select Payment Method</h4>
>     <select v-model="selectedGateway">
>       <option value="stripe">Credit Card (Stripe)</option>
>       <option value="paypal">PayPal</option>
>       <option value="crypto">Crypto Wallet</option>
>     </select>
> 
>     <div class="payment-form-box">
>       <component :is="currentGatewayComponent" />
>     </div>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **On-Demand SDK Loading**: Heavy external payment SDKs (e.g., PayPal JS SDK) packaged in gateway components are only fetched when selected.
> 2. **Multi-Chunk Code Splitting**: Vite generates 3 separate JS chunks for each payment provider form.
> 3. **Dynamic Template Binding**: `<component :is>` switches async components reactively as the drop-down updates.
> 4. **Reduced Initial Load**: Customers paying via Credit Card never download Crypto or PayPal bundle assets.
> 
---

## 6. Related Terms

- [Components](../level_04/components.md) — The Vue component building blocks being split.
- [Vite](../level_10/vite.md) — The build tool performing code splitting for dynamic `import()`.
- [`<Suspense>` (Vue)](../level_05/suspense.md) — Built-in component for handling async component loading trees.
- [Vue Router](../level_06/vue_router.md) — Primary application location utilizing route-level lazy loading.
- [KeepAlive](keepalive.md) — Built-in component used to cache lazy-loaded async components after fetch.

---

## 7. Key Takeaways

- Async Components are loaded lazily from the server only when rendered in the UI.
- Created via `defineAsyncComponent(() => import('./Component.vue'))`.
- Bundlers like Vite automatically split async components into separate, isolated JS chunk files.
- Greatly improves initial page load performance, TTI, and bundle sizes.
- Do not over-split tiny UI components, as excessive HTTP chunk requests degrade network performance.
