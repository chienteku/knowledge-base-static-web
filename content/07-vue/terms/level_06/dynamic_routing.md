# Dynamic Routing

> **Level 6 — Routing (Vue Router)**
> A technique in Vue Router where parts of the URL are treated as variables (parameters), allowing a single Route configuration to handle thousands of different URLs.

---

## 1. Prerequisites

- [Vue Router](vue_router.md) — The system that parses the URLs.

---

## 2. Term Category

**Vue Ecosystem (Routing Strategy / Dynamic Pattern Matching)**: Dynamic Routing is a URL matching technique in Vue Router where variable segments of a path are defined using colon syntax (e.g. `/user/:username` or `/order/:id`). This allows a single route configuration to match an infinite number of dynamic URLs, instantiating the target view component while exposing parameter values via `route.params`.

Unlike static route definitions—which require explicit path mappings for every page—dynamic routing relies on path-to-regexp pattern matching. In React Router v6+, dynamic parameters are declared similarly (`/user/:id`) and extracted via `useParams()`. Vue Router integrates dynamic parameters directly into Vue 3's Proxy reactivity system via `useRoute()`, allowing watchers and computed properties to reactively track URL parameter changes.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Consider building an enterprise platform like GitHub or Twitter. Users have profile pages (`/alice`, `/bob`, `/charlie`), and repositories have issue pages (`/vuejs/core/issues/101`). If routing required hardcoding static paths for every user or issue, configuration files would be infinitely long and impossible to maintain.

Dynamic Routing solves this by introducing wildcard parameter variables into route paths (`{ path: '/user/:username', component: UserProfile }`). Vue Router matches incoming request URLs against these patterns, extracts dynamic path values, and injects them into a reactive `route.params` dictionary available to component scripts.

### (2) Reality Metaphor
Think of Dynamic Routing like a Post Office PO Box sorting wall. Instead of building a custom physical building for every resident in a city, the post office installs a standardized wall of numbered PO Box slots (`/pobox/:boxNumber`). When mail arrives addressed to "PO Box 402," the sorting clerk does not construct a new room; they drop the envelope into slot #402. The underlying box structure (the view component) remains identical, but the internal contents (the box ID parameter) adapt dynamically to whoever opens the door.

### (3) Vue Code Examples

#### Short Snippet
```javascript
// router.js - Route configuration with dynamic parameter :id
import { createRouter, createWebHistory } from 'vue-router'
import UserProfile from './UserProfile.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/user/:id', component: UserProfile }
  ]
})
```

```vue
<!-- UserProfile.vue - Extracting dynamic parameter -->
<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
console.log('Active User ID:', route.params.id)
</script>

<template>
  <h2>User Profile ID: {{ route.params.id }}</h2>
</template>
```

#### Fuller Example
```vue
<!-- ProductDetail.vue (Handling parameter updates on component reuse) -->
<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const product = ref(null)
const isLoading = ref(true)

async function fetchProductDetails(sku) {
  isLoading.value = true
  // Simulate API fetch based on dynamic SKU parameter
  setTimeout(() => {
    product.value = {
      sku,
      name: `Enterprise Server ${sku.toUpperCase()}`,
      price: 2499.99
    }
    isLoading.value = false
  }, 400)
}

// Initial fetch on component mount
onMounted(() => {
  fetchProductDetails(route.params.sku)
})

// CRITICAL: Watch route.params.sku for changes when navigating /product/sku-01 -> /product/sku-02
watch(
  () => route.params.sku,
  (newSku) => {
    if (newSku) {
      fetchProductDetails(newSku)
    }
  }
)
</script>

<template>
  <div class="product-view">
    <div v-if="isLoading" class="spinner">Loading SKU details...</div>
    <div v-else-if="product" class="details-card">
      <h3>{{ product.name }}</h3>
      <p>SKU: {{ product.sku }}</p>
      <p>Price: ${{ product.price }}</p>
    </div>
  </div>
</template>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Component Reuse Data Stagnation (Failing to Watch `route.params`)

**The mistake:** Navigating from `/user/alice` to `/user/bob` and expecting `onMounted()` to re-fire to fetch Bob's data.

**Why it's wrong:** Vue Router optimizes performance by reusing the mounted component instance when navigating between routes matching the exact same dynamic path pattern. Because the component is not destroyed and recreated, `onMounted()` does NOT re-fire.

*Incorrect:*
```javascript
// ❌ Does NOT execute when navigating /user/alice -> /user/bob!
onMounted(() => {
  fetchUserData(route.params.username);
});
```

*Fix:* Use `watch()` or `onBeforeRouteUpdate()` to detect parameter changes on reused components:
```javascript
import { watch } from 'vue';
import { useRoute, onBeforeRouteUpdate } from 'vue-router';

const route = useRoute();

watch(
  () => route.params.username,
  (newUsername) => { fetchUserData(newUsername); },
  { immediate: true }
);
```

---

### Mistake 2: Assuming Dynamic Parameters Are Numeric Data Types

**The mistake:** Writing `if (route.params.id === 101)` without casting parameter strings to numbers.

**Why it's wrong:** Vue Router extracts all path parameters as JavaScript string values (`"101"`). Strict equality comparison (`===`) against a number fails.

*Incorrect:*
```javascript
if (route.params.id === 101) { /* ❌ Always false because "101" !== 101 */ }
```

*Fix:*
```javascript
if (Number(route.params.id) === 101) { /* Cast string parameter explicitly */ }
```

---

### Mistake 3: Confusing Path Params (`/user/:id`) with Query Parameters (`/user?id=101`)

**The mistake:** Accessing `route.params.id` when the URL structure is defined using URL query parameters (`/user?id=101`).

**Why it's wrong:** Path parameters live in `route.params`, whereas URL query string parameters live in `route.query`.

*Incorrect:*
```javascript
// Request URL: /search?term=vue
const term = route.params.term; // ❌ undefined!
```

*Fix:*
```javascript
// Request URL: /search?term=vue
const term = route.query.term; // Access query parameters via route.query
```

---

## 5. Practice Exercises

### Exercise 1: E-Commerce Product Catalog Dynamic SKU Resolver

**Scenario:** An e-commerce platform uses dynamic route path `/catalog/:category/:sku`. Create a component script using `<script setup>` that extracts `category` and `sku`, watching parameter changes to reload item inventory.

**Requirements:**
1. Extract `category` and `sku` using `useRoute()`.
2. Watch `() => route.params.sku` to trigger `loadInventory()`.
3. Cast SKU string to uppercase.
4. Include test assertions for parameter updates.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <!-- CatalogItem.vue -->
> <script setup>
> import { ref, watch, onMounted } from 'vue';
> import { useRoute } from 'vue-router';
> 
> const route = useRoute();
> const activeSku = ref('');
> const category = ref('');
> 
> function loadInventory(skuVal, catVal) {
>   activeSku.value = String(skuVal).toUpperCase();
>   category.value = String(catVal);
> }
> 
> onMounted(() => {
>   loadInventory(route.params.sku, route.params.category);
> });
> 
> watch(
>   () => route.params.sku,
>   (newSku) => {
>     if (newSku) loadInventory(newSku, route.params.category);
>   }
> );
> </script>
> 
> <template>
>   <div class="catalog-view">
>     <h2>Category: {{ category }}</h2>
>     <p>SKU: {{ activeSku }}</p>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Multi-Param Access**: `route.params` extracts both `:category` and `:sku` parameters.
> 2. **Watcher Guard**: `watch()` ensures catalog data updates when users switch SKUs directly via navigation links.
> 3. **Type Normalization**: Casts parameter values safely to upper-case string representations.
> 4. **Mounted Initialization**: Guarantees initial data load when component first renders.
> 
---

### Exercise 2: Financial Banking Multi-Parameter Ledger

**Scenario:** A commercial banking application routes account transactions using `/account/:accId/ledger/:txId`. Extract dynamic parameters and validate numeric formatting.

**Requirements:**
1. Extract `accId` and `txId` parameters.
2. Validate that `accId` matches regex `^ACC-\d+` and `txId` is numeric.
3. Handle invalid parameter values with fallback error state.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <!-- LedgerDetail.vue -->
> <script setup>
> import { computed } from 'vue';
> import { useRoute } from 'vue-router';
> 
> const route = useRoute();
> 
> const isValidRoute = computed(() => {
>   const accId = String(route.params.accId || '');
>   const txId = Number(route.params.txId);
>   return /^ACC-\d+$/.test(accId) && !isNaN(txId);
> });
> 
> const accountId = computed(() => route.params.accId);
> const transactionId = computed(() => Number(route.params.txId));
> </script>
> 
> <template>
>   <div class="ledger-container">
>     <div v-if="!isValidRoute" class="error-box">
>       Invalid Account or Transaction Parameter in URL!
>     </div>
>     <div v-else class="ledger-box">
>       <h3>Account: {{ accountId }}</h3>
>       <p>Transaction Reference #: {{ transactionId }}</p>
>     </div>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Computed Parameter Validation**: `isValidRoute` validates regex and numerical properties dynamically.
> 2. **Numeric Casting**: `Number(route.params.txId)` converts string parameter to native number.
> 3. **Route Safety Guard**: Protects against illegal or corrupted URL parameter inputs.
> 4. **Declarative Rendering**: Conditionally renders error feedback based on route validity.
> 
---

### Exercise 3: Healthcare Patient Telehealth Routing (`onBeforeRouteUpdate`)

**Scenario:** A hospital EHR platform uses dynamic route `/telehealth/patient/:patientId`. Use Vue Router's in-component navigation hook `onBeforeRouteUpdate` to save unsaved clinical notes before switching patient records.

**Requirements:**
1. Maintain reactive string `clinicalNotes` and boolean `hasUnsavedChanges`.
2. Implement `onBeforeRouteUpdate((to, from) => ...)` hook.
3. Prompt confirmation if unsaved changes exist before allowing navigation.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <!-- PatientTelehealth.vue -->
> <script setup>
> import { ref } from 'vue';
> import { useRoute, onBeforeRouteUpdate } from 'vue-router';
> 
> const route = useRoute();
> const clinicalNotes = ref('');
> const hasUnsavedChanges = ref(false);
> 
> function handleInput() {
>   hasUnsavedChanges.value = true;
> }
> 
> onBeforeRouteUpdate((to, from) => {
>   if (hasUnsavedChanges.value) {
>     const answer = window.confirm('You have unsaved clinical notes. Discard changes?');
>     if (!answer) return false; // Cancel route navigation
>   }
>   hasUnsavedChanges.value = false;
> });
> </script>
> 
> <template>
>   <div class="telehealth-view">
>     <h2>Patient ID: {{ route.params.patientId }}</h2>
>     <textarea v-model="clinicalNotes" @input="handleInput" placeholder="Enter clinical notes..."></textarea>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **In-Component Hook**: `onBeforeRouteUpdate` intercepts parameter transitions on reused component instances.
> 2. **Navigation Cancellation**: Returning `false` from `onBeforeRouteUpdate` aborts URL navigation.
> 3. **Dirty State Guard**: Tracks unsaved user input state to prevent data loss.
> 4. **Instance Preservation**: Reuses existing DOM node while switching active patient context.
> 
---

## 6. Related Terms

- [Vue Router](vue_router.md) — The parent library.
- [Watchers](../level_02/watchers.md) — The tool needed to detect when dynamic parameters change.
- [Route Params, Query & Meta](route_params_query_meta.md) — Related concept: Route Params, Query & Meta.
- [Nested Routes](nested_routes.md) — Related concept: Nested Routes.

---

## 7. Key Takeaways

- **Dynamic Routing** maps variable path segments (e.g. `/user/:id`) to a single view component using regex matching.
- Access dynamic parameters inside components using **`route.params.paramName`** via `useRoute()`.
- Component instances are **reused** when navigating between URLs matching the same dynamic pattern—`onMounted()` will NOT re-fire!
- Use **`watch(() => route.params.id)`** or **`onBeforeRouteUpdate`** to react to parameter updates on reused components.
- All dynamic path parameters are extracted as **strings**—cast explicitly to numbers when performing strict comparisons.
