# Route Params, Query & Meta

> **Level 6 — Routing (Vue Router)**
> The three primary channels used in Vue Router to pass parameters via path segments (Params), append optional parameters to search strings (Query), and define static configuration properties on routes (Meta).

---

## 1. Prerequisites
- [Vue Router](vue_router.md) — The router registration library.
- [Dynamic Routing](dynamic_routing.md) — Dynamic URL mapping.
- [Programmatic Navigation (`useRouter` / `useRoute`)](programmatic_navigation.md) — Script-driven page navigation.

---

## 2. Term Category
- **Ecosystem Tool**

---

## 3. Environment Context
- **Composition API (`<script setup>`)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When building modern Single Page Applications (SPAs), pages require input context. If you load a Product Details page, the app needs to know *which* product to load. If you load a search page, it needs to know what filters the user selected. If you check page permissions, the router needs to know if the page requires authentication.

Rather than declaring global state variables for every route change, Vue Router organizes URL and page variables into three distinct structures:
1. **Params (Parameters):** Dynamic segments of the URL path required to identify a resource.
2. **Query:** Optional variables appended to the end of the URL (after a `?`), useful for filtering, sorting, or pagination.
3. **Meta:** Custom static configuration metadata attached directly to the route definition (invisible in the URL bar), useful for storing page permissions or layout settings.

### (2) How it works under the hood
During route initialization, you configure these three channels. In your components, you read them off the reactive `useRoute()` context object.

#### Route Configuration
```javascript
const routes = [
  {
    path: '/product/:id', // 1. ":id" defines a route param
    component: ProductDetail,
    // 3. "meta" defines static configuration options
    meta: { requiresAuth: true, layout: 'default' }
  }
]
```

- **Params (`route.params`):** Matched based on colon segments in the route config path. If the URL is `/product/99`, `route.params.id` resolves to the string `"99"`.
- **Query (`route.query`):** Parsed from the URL search query. If the URL is `/product/99?color=red&sort=price`, `route.query` resolves to `{ color: 'red', sort: 'price' }`.
- **Meta (`route.meta`):** Extracted from the static properties attached to the active route definition and its parent routes. Read inside components or global navigation guards.

### (3) Code Examples

#### Short Snippet
```vue
<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

// Read /user/:id?name=bob
console.log('ID param:', route.params.id)
console.log('Name query:', route.query.name)
console.log('Auth Meta:', route.meta.requiresAuth)
</script>
```

#### Fuller Example
In this product browser component, we use the `productId` param to fetch details, use query parameters to apply filters, and meta fields to toggle premium UI elements.

```vue
<!-- ProductDetails.vue -->
<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const product = ref(null)
const selectedTab = ref('specs')

// Function to fetch data from API
async function loadProduct(id, filter) {
  const response = await fetch(`https://api.example.com/products/${id}?tab=${filter}`)
  product.value = await response.json()
}

// 1. Load initial data on mount
onMounted(() => {
  loadProduct(route.params.productId, route.query.tab || 'specs')
})

// 2. React to parameter changes. Since Vue Router reuses the component 
// if only params change, we MUST watch the route params to fetch new data!
watch(
  () => route.params.productId,
  (newId) => {
    if (newId) loadProduct(newId, route.query.tab || 'specs')
  }
)
</script>

<template>
  <div class="product-page">
    <!-- Read meta properties to render premium styles -->
    <div v-if="route.meta.isPremium" class="premium-badge">
      Premium Access Product
    </div>

    <div v-if="product">
      <h1>{{ product.name }}</h1>
      <p>Active Tab: {{ route.query.tab || 'Default Specs' }}</p>
    </div>
  </div>
</template>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Expecting setup() to run when switching parameters on the same page

**The mistake:** Navigating from `/user/1` to `/user/2` and expecting the component's `onMounted()` hook to trigger again to load the new user.

**Why it's wrong:** For performance, Vue Router reuses the same component instance when navigating between URLs that match the same component definition (only the dynamic parameter changes). Because the component is not destroyed and recreated, `onMounted` and `onBeforeMount` do not re-run.

*Incorrect:*
```javascript
// This only runs once! Navigating to a new ID leaves the page stale.
onMounted(async () => {
  userData.value = await fetchUser(route.params.userId) 
})
```

*Fix:* Set up a watcher on the route parameter to trigger reloading.
```javascript
watch(
  () => route.params.userId,
  async (newId) => {
    userData.value = await fetchUser(newId)
  },
  { immediate: true } // Runs on initial load too, replacing onMounted!
)
```

**Golden Rule:** If a route transitions to itself with different parameters, the component is reused. Always watch the param changes to trigger state updates.

---

### Mistake 2: Mutating `route.params` or `route.query` Directly in Component Code

**The mistake:** Writing `route.query.search = 'new'`.

**Why it's wrong:** The `route` object returned by `useRoute()` is a read-only reactive object representing current location. To update params or queries, execute `router.push()` or `router.replace()`.

*Incorrect:*
```javascript
const route = useRoute();
route.query.search = 'vue'; // ❌ Read-only mutation error!
```

*Fix:*
```javascript
const router = useRouter();
const route = useRoute();
router.push({ query: { ...route.query, search: 'vue' } }); // Execute navigation update
```

---

### Mistake 3: Confusing `useRoute()` (Current Route Location) with `useRouter()` (Router Instance)

**The mistake:** Calling `useRoute().push('/home')` or `useRouter().params.id`.

**Why it's wrong:** `useRoute()` returns current route location state (`params`, `query`, `meta`, `path`). `useRouter()` returns the router instance containing navigation methods (`push`, `replace`, `back`).

*Incorrect:*
```javascript
const route = useRoute();
route.push('/login'); // ❌ route has no push method!
```

*Fix:*
```javascript
const router = useRouter(); // For navigation actions (push, replace)
const route = useRoute(); // For reading route state (params, query)
router.push('/login');
```


---

## 6. Practice Exercises

### Exercise 1: Build a Auth Navigation Guard using Meta

**Problem:** You are configuring route guards in your router index file. Complete the navigation guard to redirect users to `/login` if they attempt to visit a route that has `requiresAuth: true` in its meta block, unless they are logged in (`isLoggedIn`).

```javascript
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: []
})

const isLoggedIn = false // Mock login state

router.beforeEach((to, from, next) => {
  // Check the metadata flag on the destination route
  const needsAuth = to.meta.requiresAuth
  
  // Complete the logic
  if (needsAuth && !isLoggedIn) {
    next('/login')
  } else {
    next()
  }
})
```

**Expected output:**
> [!check]- Answer
> ```text
> The beforeEach guard checks to.meta.requiresAuth and successfully redirects unauthorized users.
> ```
> - You can check metadata on the destination route using the `to` object parameter.
> - Access the metadata object via `to.meta`.
> 
---

### Exercise 2: Reading Route State in Script Setup

**Problem:** Write `<script setup>` reading route param `id` and query parameter `sort` using `useRoute()`.

**Expected output:**
> [!check]- Answer
> ```vue
> <script setup> import { useRoute } from 'vue-router'; const route = useRoute(); const id = route.params.id; const sort = route.query.sort; </script>
> ```
> - `useRoute()` exposes active route parameters.
> 
> ```vue
> <script setup>
> import { useRoute } from 'vue-router';
> 
> const route = useRoute();
> const userId = route.params.id;
> const sortOrder = route.query.sort;
> </script>
> ```
> 
---

### Exercise 3: Route Meta Fields Access

**Problem:** Where do you define custom route metadata (e.g. `requiresAuth: true` or `title: 'Home'`) in Vue Router?

**Expected output:**
> [!check]- Answer
> ```text
> Inside the meta property of a route object definition: { path: '/home', meta: { title: 'Home' } }.
> ```
> - `meta` object stores arbitrary metadata attached to routes.
> 
> ```javascript
> { path: '/admin', component: Admin, meta: { requiresAuth: true } }
> ```
> 
> 
---

## 7. Related Terms
- [Vue Router](vue_router.md) — The routing system container.
- [Dynamic Routing](dynamic_routing.md) — Mapping paths containing colon variables.
- [Navigation Guards](navigation_guards.md) — Route middleware hooks.

---

## 8. Key Takeaways
- **Params** are dynamic path elements matched from the URL (e.g. `/product/:id` -> `route.params.id`).
- **Query** options are key-value sets appended after the `?` character in URLs, ideal for filtering/searching.
- **Meta** variables are static properties set in route configurations (not visible in URLs) that are read by guards to manage access levels.
- When changing parameters on the same route path, Vue Router reuses the component instance; watch the params to reload page context.
