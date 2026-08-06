# Route Params, Query & Meta

> **Level 6 — Routing (Vue Router)**
> The three primary data structures attached to a Vue Router location object, used to pass path variables, URL search strings, and custom route metadata.

---

## 1. Prerequisites

- [Vue Router](vue_router.md) — The router registration library.
- [Dynamic Routing](dynamic_routing.md) — Dynamic URL mapping.
- [Programmatic Navigation (`useRouter` / `useRoute`)](programmatic_navigation.md) — Script-driven page navigation.

---

## 2. Term Category

**Vue Ecosystem (Routing Data Structures / Location State)**: Route Params, Query, and Meta are the three core data collections exposed by Vue Router on every normalized route location object (`useRoute()`). They serve distinct roles in URL path matching (`params`), search string state persistence (`query`), and route definition metadata management (`meta`).

| Property | Format / URL Appearance | Scope & Purpose |
| :--- | :--- | :--- |
| **`route.params`** | Path variables (`/user/:id` -> `/user/101`) | Identifies primary resource entities in path hierarchy |
| **`route.query`** | Search string (`/search?term=vue&page=2`) | Persists optional UI filter, sorting, or pagination states |
| **`route.meta`** | Not visible in URL (Defined in `routes` array) | Attaches custom configuration (auth flags, page titles, layout roles) |

In React Router v6+, these concerns are split across `useParams()`, `useSearchParams()`, and custom route `handle` objects. Vue Router consolidates them into a single reactive `route` proxy object (`useRoute()`).

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When users navigate web applications, different types of data must be communicated across view transitions:
1. **Resource Identification**: Which specific entity am I viewing? (e.g. User `#101` vs User `#202`).
2. **UI State Persistence**: How is the current view filtered, sorted, or paginated? (e.g. `?sort=desc&page=3`).
3. **Application Governance**: What access permissions or layout rules apply to this page? (e.g. `requiresAuth: true`, `layout: 'admin'`).

Encoding all three concerns into raw URL strings creates unmaintainable paths. Vue Router explicitly separates location state into **`params`** (path variables), **`query`** (search parameters), and **`meta`** (internal route metadata), giving developers clear, typed interfaces for managing URL state.

### (2) Reality Metaphor
Think of a Route Location Object like a Certified Postal Parcel:
- **`params` (Destination Address)**: The street name and house number printed on the front (`/building/4/floor/2`). It dictates the exact physical destination where the package must be delivered.
- **`query` (Delivery Preference Slip)**: A sticky note attached to the package specifying preferences (`?leaveAtDoor=true&signatureRequired=false`). It modifies delivery handling without changing the destination address.
- **`meta` (Manifest Shipping Label)**: An internal barcode printed by the logistics company specifying handling rules (`{ requiresRefrigeration: true, maxWeight: '50kg' }`). It is read by logistics guards and automated sorters to enforce safety protocol.

### (3) Vue Code Examples

#### Short Snippet
```vue
<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

// 1. Path parameters (/product/:id)
console.log('Product ID:', route.params.id)

// 2. Query search params (?view=grid&sort=price)
console.log('View Mode:', route.query.view)

// 3. Static route definition metadata
console.log('Page Title:', route.meta.title)
</script>
```

#### Fuller Example
```javascript
// router.js - Route configuration utilizing params, query, and meta
import { createRouter, createWebHistory } from 'vue-router'
import ProductCatalog from './views/ProductCatalog.vue'
import ProductDetail from './views/ProductDetail.vue'

const routes = [
  {
    path: '/catalog',
    component: ProductCatalog,
    meta: {
      title: 'Product Catalog',
      layout: 'default-layout',
      requiresAuth: false
    }
  },
  {
    path: '/catalog/:category/:id',
    name: 'product-detail',
    component: ProductDetail,
    meta: {
      title: 'Product Details',
      layout: 'full-width-layout',
      requiresAuth: true
    }
  }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})
```

```vue
<!-- ProductDetail.vue - Consuming params, query, and meta in component setup -->
<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// Extract dynamic path parameters
const category = computed(() => route.params.category)
const productId = computed(() => route.params.id)

// Extract optional query parameters
const referrer = computed(() => route.query.ref || 'direct')
const isDiscounted = computed(() => route.query.discount === 'true')

// Extract route metadata
const pageLayout = computed(() => route.meta.layout)

function updateQueryTab(newTab) {
  // Update query string while preserving path params
  router.push({
    name: 'product-detail',
    params: { category: category.value, id: productId.value },
    query: { ...route.query, tab: newTab }
  })
}
</script>

<template>
  <div class="product-page" :class="pageLayout">
    <h2>Category: {{ category }} | Product #{{ productId }}</h2>
    <p>Referral Origin: {{ referrer }}</p>
    <p v-if="isDiscounted" class="badge">Promo Discount Applied!</p>

    <div class="tabs">
      <button @click="updateQueryTab('specs')">Specifications</button>
      <button @click="updateQueryTab('reviews')">Customer Reviews</button>
    </div>
  </div>
</template>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Exposing Sensitive Security Tokens inside `route.query` or `route.params`

**The mistake:** Passing secret API tokens, passwords, or PII inside URL search queries (`/dashboard?token=secret123` or `/user/:ssn`).

**Why it's wrong:** Anything placed inside `route.params` or `route.query` appears directly in browser address bars, browser history logs, server access logs, and HTTP `Referer` headers, creating severe security vulnerabilities.

*Incorrect:*
```javascript
// ❌ Exposing sensitive token in URL search query!
router.push({ path: '/dashboard', query: { authToken: secretToken } });
```

*Fix:* Keep authorization tokens in secure HTTP-only cookies, Pinia stores, or memory variables:
```javascript
authStore.setToken(secretToken);
router.push('/dashboard');
```

---

### Mistake 2: Mixing Up Named Route Navigation with `path` and `params`

**The mistake:** Writing `router.push({ path: '/user/:id', params: { id: 101 } })`.

**Why it's wrong:** In Vue Router, if `path` is provided in navigation objects, `params` is **ignored**. To use `params`, you must specify the route using `name` or embed the variable directly into the path string.

*Incorrect:*
```javascript
// ❌ 'params' is ignored when 'path' is specified!
router.push({ path: '/user/:id', params: { id: 101 } });
```

*Fix:* Use `name` when passing `params`, or use template literals with `path`:
```javascript
// Fix Option 1: Use named route
router.push({ name: 'user-detail', params: { id: 101 } });

// Fix Option 2: Use template string
router.push({ path: `/user/${101}` });
```

---

### Mistake 3: Mutating `route.meta` Properties Directly at Runtime

**The mistake:** Writing `route.meta.title = 'New Title'` expecting it to dynamically update global route definitions for other components.

**Why it's wrong:** `route.meta` is shallow-merged from the static route configuration array. Mutating `route.meta` directly on the local route object causes un-trackable side effects across navigation guards.

*Incorrect:*
```javascript
// ❌ Direct mutation of route meta object:
route.meta.title = 'Updated Title';
```

*Fix:* Use standard reactive refs or document title composables to handle dynamic page titles:
```javascript
import { useTitle } from '@vueuse/core';
const title = useTitle();
title.value = 'Updated Title';
```

---

## 5. Practice Exercises

### Exercise 1: E-Commerce Product Search & Pagination Query Handler

**Scenario:** An e-commerce search page relies on URL query parameters (`/search?q=laptop&page=2&sort=price_asc`). Write a component script extracting search query parameters with reactive fallbacks.

**Requirements:**
1. Extract `q` (search string, fallback `''`), `page` (number, fallback `1`), and `sort` (fallback `'relevance'`).
2. Provide a helper function `updatePage(newPage)` that updates `route.query.page` without clearing `q` or `sort`.
3. Include test assertions for parameter extraction logic.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <!-- SearchResults.vue -->
> <script setup>
> import { computed } from 'vue';
> import { useRoute, useRouter } from 'vue-router';
> 
> const route = useRoute();
> const router = useRouter();
> 
> const searchQuery = computed(() => String(route.query.q || ''));
> const currentPage = computed(() => Number(route.query.page || 1));
> const sortOrder = computed(() => String(route.query.sort || 'relevance'));
> 
> function updatePage(newPage) {
>   router.push({
>     query: {
>       ...route.query,
>       page: newPage
>     }
>   });
> }
> </script>
> 
> <template>
>   <div class="search-view">
>     <h2>Search Term: "{{ searchQuery }}"</h2>
>     <p>Active Page: {{ currentPage }} | Sort: {{ sortOrder }}</p>
>     <button @click="updatePage(currentPage + 1)">Next Page</button>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Computed Query Extraction**: `computed()` wrappers ensure component reactivity updates automatically as URL query parameters change.
> 2. **Numeric Typecasting**: `Number(route.query.page || 1)` casts search string parameters to valid numbers with default fallbacks.
> 3. **Query Parameter Preservation**: `{ ...route.query, page: newPage }` preserves `q` and `sort` parameters while incrementing page count.
> 4. **Declarative Navigation Sync**: UI state remains perfectly in sync with the browser URL bar.
> 
---

### Exercise 2: Healthcare EHR Route Metadata Audit Inspection

**Scenario:** A hospital Electronic Health Records system attaches audit logging metadata to routes (`meta: { requiresAuditLog: true, departmentalScope: 'CARDIOLOGY' }`). Write a global router guard checking metadata flags.

**Requirements:**
1. Global `beforeEach` inspects `to.meta.requiresAuditLog`.
2. If true, execute `auditLogger.logAccess(to.fullPath, to.meta.departmentalScope)`.
3. Allow navigation to proceed.

> [!check]- Answer
>
> #### Implementation
> ```javascript
> import { createRouter, createWebHistory } from 'vue-router';
> 
> const mockAuditLogger = {
>   logAccess: (path, dept) => console.log(`[AUDIT] Path: ${path} | Dept: ${dept}`)
> };
> 
> export const router = createRouter({
>   history: createWebHistory(),
>   routes: [
>     {
>       path: '/cardiology/patient/:id',
>       component: { template: '<div>Patient Chart</div>' },
>       meta: {
>         requiresAuditLog: true,
>         departmentalScope: 'CARDIOLOGY'
>       }
>     }
>   ]
> });
> 
> router.beforeEach((to, from) => {
>   if (to.meta.requiresAuditLog) {
>     const dept = to.meta.departmentalScope || 'GENERAL';
>     mockAuditLogger.logAccess(to.fullPath, dept);
>   }
>   return true;
> });
> ```
>
> #### Technical Explanation
> 1. **Metadata Inspection**: `to.meta.requiresAuditLog` reads custom metadata fields attached to target route definitions.
> 2. **Centralized Compliance**: Automates audit logging across protected healthcare screens without scattering code in components.
> 3. **Fallback Value Protection**: Supplies default `'GENERAL'` fallback string if `departmentalScope` is omitted.
> 4. **Non-Blocking Execution**: Returns `true` to permit route navigation after recording audit entries.
> 
---

### Exercise 3: Financial Trading Workstation Combined Route Inspection

**Scenario:** A crypto trading platform uses `/trade/:pair?tab=depth` with route metadata `meta: { title: 'Live Order Book' }`. Create a component combining `params`, `query`, and `meta`.

**Requirements:**
1. Extract `params.pair` (e.g. `'BTC-USD'`).
2. Extract `query.tab` (fallback `'book'`).
3. Extract `meta.title`.
4. Render combined status layout.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <!-- TradingTerminal.vue -->
> <script setup>
> import { computed } from 'vue';
> import { useRoute } from 'vue-router';
> 
> const route = useRoute();
> 
> const tradingPair = computed(() => String(route.params.pair || 'BTC-USD').toUpperCase());
> const activeTab = computed(() => String(route.query.tab || 'book'));
> const pageTitle = computed(() => String(route.meta.title || 'Trading Workstation'));
> </script>
> 
> <template>
>   <div class="trading-terminal">
>     <h1>{{ pageTitle }} - {{ tradingPair }}</h1>
>     <p>Active Tab: <strong>{{ activeTab }}</strong></p>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Unified Location State**: Demonstrates simultaneous consumption of `params`, `query`, and `meta` from a single `useRoute()` reference.
> 2. **String Normalization**: Transforms dynamic pair parameters (`'btc-usd'`) into standardized upper-case ticker symbols (`'BTC-USD'`).
> 3. **Default Fallback Protection**: Solves undefined parameter errors with inline logical fallback OR assignment.
> 4. **Reactive Template Binding**: Updates heading titles dynamically during URL parameter changes.
> 
---

## 6. Related Terms

- [Vue Router](vue_router.md) — The routing system container.
- [Dynamic Routing](dynamic_routing.md) — Mapping paths containing colon variables.
- [Navigation Guards](navigation_guards.md) — Route middleware hooks.

---

## 7. Key Takeaways

- **`route.params`** extracts dynamic path variables declared via colon syntax (e.g. `/user/:id`).
- **`route.query`** extracts URL search parameters (e.g. `/search?page=2&q=vue`).
- **`route.meta`** stores arbitrary non-URL configuration data (auth requirements, page titles, layout names) defined in the routes array.
- When calling `router.push()`, **`params` is ignored if `path` is specified**—use `name` alongside `params`.
- Never put sensitive security tokens inside `params` or `query` strings where they are exposed in address bars and history logs.
